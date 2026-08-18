/**
 * Deterministic service-status calculation.
 * All interval data comes from the `service_intervals` table (source of truth).
 * This function contains NO hardcoded motorcycle-specific numbers.
 */

export type ServiceStatus =
  | "ok"
  | "due_soon"
  | "due"
  | "overdue"
  | "inspect"
  | "replaced"
  | "repaired"
  | "damaged";

export interface ServiceIntervalRule {
  componentId: string;
  intervalKm: number | null;
  intervalMonths: number | null;
  inspectOnly: boolean;
}

export interface LastServiceEvent {
  componentId: string;
  odometerAtService: number;
  dateAtService: string; // ISO date
  action: "inspect" | "clean" | "repair" | "replace" | "adjust" | "other";
}

export interface ComponentStatusInput {
  rule: ServiceIntervalRule;
  lastEvent: LastServiceEvent | null;
  currentOdometer: number;
  currentDate?: Date;
}

export interface ComponentStatusResult {
  componentId: string;
  status: ServiceStatus;
  nextDueKm: number | null;
  nextDueDate: string | null;
  kmRemaining: number | null;
}

// How many km before the due point counts as "due soon".
// Kept as a named constant (not buried magic number) — could be made configurable per component later.
const DUE_SOON_THRESHOLD_KM = 500;
const DUE_SOON_THRESHOLD_DAYS = 14;

export function calculateComponentStatus({
  rule,
  lastEvent,
  currentOdometer,
  currentDate = new Date(),
}: ComponentStatusInput): ComponentStatusResult {
  // Components that are inspection-only (e.g. brake pads) never get an automatic
  // "due" status from km/time — they always prompt inspection.
  if (rule.inspectOnly) {
    return {
      componentId: rule.componentId,
      status: "inspect",
      nextDueKm: null,
      nextDueDate: null,
      kmRemaining: null,
    };
  }

  // No history yet: nothing to compare against, so we can't claim a real due point.
  if (!lastEvent) {
    return {
      componentId: rule.componentId,
      status: "inspect",
      nextDueKm: null,
      nextDueDate: null,
      kmRemaining: null,
    };
  }

  let nextDueKm: number | null = null;
  let nextDueDate: string | null = null;

  if (rule.intervalKm != null) {
    nextDueKm = lastEvent.odometerAtService + rule.intervalKm;
  }
  if (rule.intervalMonths != null) {
    const d = new Date(lastEvent.dateAtService);
    d.setMonth(d.getMonth() + rule.intervalMonths);
    nextDueDate = d.toISOString().slice(0, 10);
  }

  const kmRemaining = nextDueKm != null ? nextDueKm - currentOdometer : null;
  const daysRemaining = nextDueDate != null
    ? Math.floor((new Date(nextDueDate).getTime() - currentDate.getTime()) / 86_400_000)
    : null;

  // Whichever dimension (km or time) is more urgent determines status.
  const kmStatus = classify(kmRemaining, DUE_SOON_THRESHOLD_KM);
  const dateStatus = classify(daysRemaining, DUE_SOON_THRESHOLD_DAYS);

  const status = mostUrgent(kmStatus, dateStatus);

  return { componentId: rule.componentId, status, nextDueKm, nextDueDate, kmRemaining };
}

function classify(remaining: number | null, dueSoonThreshold: number): ServiceStatus | null {
  if (remaining == null) return null;
  if (remaining < 0) return "overdue";
  if (remaining === 0) return "due";
  if (remaining <= dueSoonThreshold) return "due_soon";
  return "ok";
}

const URGENCY_ORDER: ServiceStatus[] = ["overdue", "due", "due_soon", "ok"];

function mostUrgent(a: ServiceStatus | null, b: ServiceStatus | null): ServiceStatus {
  const candidates = [a, b].filter((s): s is ServiceStatus => s != null);
  if (candidates.length === 0) return "ok";
  return candidates.sort(
    (x, y) => URGENCY_ORDER.indexOf(x) - URGENCY_ORDER.indexOf(y)
  )[0]!;
}
