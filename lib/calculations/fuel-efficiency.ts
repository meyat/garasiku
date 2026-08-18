/**
 * Fuel-efficiency calculation.
 * Rule: efficiency (km/L) is ONLY valid between two consecutive FULL-TANK fills.
 * Partial refuels are excluded from efficiency math but still count for expenses.
 */

export interface FuelLogEntry {
  id: string;
  filledAt: string; // ISO datetime
  odometer: number;
  liters: number;
  totalCost: number | null;
  isFullTank: boolean;
}

export interface EfficiencyPoint {
  fromLogId: string;
  toLogId: string;
  distanceKm: number;
  litersConsumed: number;
  kmPerLiter: number;
  periodStart: string;
  periodEnd: string;
}

export interface FuelEfficiencySummary {
  points: EfficiencyPoint[];
  average: number | null;
  latest: number | null;
  best: number | null;
  worst: number | null;
  totalFuelSpending: number;
  costPerKm: number | null;
}

export function calculateFuelEfficiency(logs: FuelLogEntry[]): FuelEfficiencySummary {
  const sorted = [...logs].sort(
    (a, b) => new Date(a.filledAt).getTime() - new Date(b.filledAt).getTime()
  );

  const fullTankLogs = sorted.filter((l) => l.isFullTank);

  const points: EfficiencyPoint[] = [];
  for (let i = 1; i < fullTankLogs.length; i++) {
    const prev = fullTankLogs[i - 1]!;
    const curr = fullTankLogs[i]!;
    const distanceKm = curr.odometer - prev.odometer;

    // Fuel consumed over this stretch = current fill's liters
    // (liters added to go from "just ran dry-ish at prev full" back to full again),
    // PLUS any partial refuels that happened strictly between prev and curr.
    const partialsBetween = sorted.filter(
      (l) =>
        !l.isFullTank &&
        new Date(l.filledAt) > new Date(prev.filledAt) &&
        new Date(l.filledAt) < new Date(curr.filledAt)
    );
    const litersConsumed =
      curr.liters + partialsBetween.reduce((sum, l) => sum + l.liters, 0);

    if (distanceKm > 0 && litersConsumed > 0) {
      points.push({
        fromLogId: prev.id,
        toLogId: curr.id,
        distanceKm,
        litersConsumed,
        kmPerLiter: distanceKm / litersConsumed,
        periodStart: prev.filledAt,
        periodEnd: curr.filledAt,
      });
    }
  }

  const values = points.map((p) => p.kmPerLiter);
  const average = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  const latest = values.length ? values[values.length - 1]! : null;
  const best = values.length ? Math.max(...values) : null;
  const worst = values.length ? Math.min(...values) : null;

  const totalFuelSpending = sorted.reduce((sum, l) => sum + (l.totalCost ?? 0), 0);
  const totalDistance = points.reduce((sum, p) => sum + p.distanceKm, 0);
  const costPerKm = totalDistance > 0 ? totalFuelSpending / totalDistance : null;

  return { points, average, latest, best, worst, totalFuelSpending, costPerKm };
}
