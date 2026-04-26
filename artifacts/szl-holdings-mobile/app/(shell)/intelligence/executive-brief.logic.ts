/**
 * Pure logic extracted from the Executive Brief screen.
 * Imported by both the screen and its tests so regressions are caught.
 */

export const ACCENT = '#c9a84c';

export const ENDPOINTS = {
  briefing: '/api/briefings',
  // Use the personalized endpoint so the briefing is scoped to the user's
  // watchlist domains. Falls back to full briefing when watchlist is empty.
  pulseToday: '/api/pulse/briefings/personalized',
} as const;

export function healthColor(score: number): string {
  if (score >= 0.8) return '#22c55e';
  if (score >= 0.5) return '#f59e0b';
  return '#ef4444';
}

export function riskColor(risk: string): string {
  switch (risk) {
    case 'CRITICAL':
      return '#ef4444';
    case 'HIGH':
      return '#f97316';
    case 'MEDIUM':
      return '#f59e0b';
    default:
      return '#22c55e';
  }
}

export function confidenceColor(score: number): string {
  if (score >= 0.75) return '#22c55e';
  if (score >= 0.5) return ACCENT;
  return '#ef4444';
}

export function confidenceLabel(score: number): string {
  if (score >= 0.75) return 'HC';
  if (score >= 0.5) return 'MC';
  return 'LC';
}

export type BriefingSeverity = 'info' | 'warning' | 'critical';

export function filterAlertsBySeverity<T extends { severity: BriefingSeverity }>(
  alerts: readonly T[],
  severity: Exclude<BriefingSeverity, 'info'>,
): T[] {
  return alerts.filter((a) => a.severity === severity);
}

/**
 * Builds the URL used by the "Full Brief" link that opens the pulse web dashboard.
 * Mirrors the anchor logic in the screen: strips a trailing /api suffix and points
 * to the /pulse/ path. Falls back to a relative path when no API base is configured.
 */
export function buildPulseWebUrl(apiBase: string | null | undefined): string {
  if (!apiBase) return '/pulse/';
  return `${apiBase.replace(/\/api\/?$/, '')}/pulse/`;
}
