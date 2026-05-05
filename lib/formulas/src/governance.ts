/**
 * Governance gates — autonomy, escalation, approval policies.
 * Source: docs/thesis/v10-canonical.md §4.3, §4.4.
 */

export type AutonomyDecision = 'auto' | 'approve' | 'multi-party';

/**
 * Risk-banded autonomy gate. Risk is in [0, 1].
 *   r < autoThreshold     → 'auto'
 *   r < approveThreshold  → 'approve'
 *   else                  → 'multi-party'
 */
export function autonomyGate(
  risk: number,
  autoThreshold = 0.2,
  approveThreshold = 0.6,
): AutonomyDecision {
  const r = Number.isFinite(risk) ? Math.max(0, Math.min(1, risk)) : 1;
  if (r < autoThreshold) return 'auto';
  if (r < approveThreshold) return 'approve';
  return 'multi-party';
}

/**
 * Exponential back-off for unanswered approvals.
 *   t_n = min(t_max, t_0 · 2^n)
 */
export function escalationDelaySeconds(n: number, t0 = 60, tMax = 3600): number {
  const k = Math.max(0, Math.floor(n));
  const raw = t0 * Math.pow(2, k);
  return Math.max(0, Math.min(tMax, raw));
}
