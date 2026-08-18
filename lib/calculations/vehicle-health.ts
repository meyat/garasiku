import type { ServiceStatus } from "./service-status";

/**
 * Transparent, deterministic vehicle health score.
 * NOT a random or AI-generated number — purely a function of known component statuses.
 *
 * Scoring model:
 * - Start at 100.
 * - Each component subtracts points based on its status severity.
 * - "inspect" (no history yet / inspection-required components) has a small, non-alarming
 *   penalty since it's not necessarily a problem — just unknown/needs a look.
 * - Score is clamped to [0, 100].
 */

const PENALTY: Record<ServiceStatus, number> = {
  overdue: 15,
  due: 8,
  due_soon: 3,
  inspect: 4,
  ok: 0,
  replaced: 0,
  repaired: 0,
  damaged: 20,
};

export interface HealthScoreInput {
  componentName: string;
  status: ServiceStatus;
}

export interface HealthScoreReason {
  componentName: string;
  status: ServiceStatus;
  impact: number; // points deducted
}

export interface HealthScoreResult {
  score: number;
  reasons: HealthScoreReason[]; // sorted by impact desc, only non-zero shown
}

export function calculateVehicleHealth(components: HealthScoreInput[]): HealthScoreResult {
  if (components.length === 0) {
    return { score: 100, reasons: [] };
  }

  const reasons: HealthScoreReason[] = components
    .map((c) => ({ componentName: c.componentName, status: c.status, impact: PENALTY[c.status] }))
    .filter((r) => r.impact > 0)
    .sort((a, b) => b.impact - a.impact);

  const totalPenalty = reasons.reduce((sum, r) => sum + r.impact, 0);
  const score = Math.max(0, Math.min(100, 100 - totalPenalty));

  return { score, reasons };
}
