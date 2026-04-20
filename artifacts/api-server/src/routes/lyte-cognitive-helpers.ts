export const SEVERITY_VAR: Record<string, number> = {
  critical: 1_000_000,
  high: 250_000,
  medium: 50_000,
  low: 10_000,
  info: 0,
};

export const CATEGORY_DOMAIN: Record<string, string> = {
  approval_latency: 'operations',
  ownership_gap: 'governance',
  forecast_drift: 'finance',
  stalled_workflow: 'operations',
  handoff_failure: 'delivery',
  status_conflict: 'delivery',
  readiness_blocker: 'readiness',
  pipeline_hygiene: 'sales',
};

export function estimateVarFromSignal(s: { severity: string; metadata?: unknown }): number {
  const meta = (s.metadata ?? {}) as Record<string, unknown>;
  if (typeof meta.valueAtRisk === 'number') return meta.valueAtRisk;
  if (typeof meta.value_at_risk === 'number') return meta.value_at_risk;
  return SEVERITY_VAR[s.severity] ?? 0;
}

export function parseTimeWindow(from?: string, to?: string): { fromDate: Date; toDate: Date } {
  const toDate = to ? new Date(to) : new Date();
  const fromDate = from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    throw new Error('Invalid from/to date format. Use ISO 8601.');
  }
  return { fromDate, toDate };
}

export function safeParseLimit(raw: unknown, defaultVal = 20, max = 50): number {
  return Math.min(parseInt(String(raw ?? defaultVal), 10) || defaultVal, max);
}

export function computeBottleneckUrgency(data: {
  var: number;
  bottlenecks: number;
  ageHours: number;
  escalationCount: number;
}): { urgencyScore: number; level: string } {
  const urgencyScore = Math.min(
    (data.var > 500_000 ? 40 : data.var > 100_000 ? 25 : data.var > 10_000 ? 15 : 5) +
      data.bottlenecks * 10 +
      (data.ageHours > 24 ? 20 : data.ageHours > 8 ? 10 : 5) +
      data.escalationCount * 15,
    100,
  );
  const level =
    urgencyScore >= 60
      ? 'critical'
      : urgencyScore >= 40
        ? 'high'
        : urgencyScore >= 20
          ? 'medium'
          : 'low';
  return { urgencyScore, level };
}

export function computeAccountabilityUrgency(entry: {
  bottlenecks: number;
  urgentInterventions: number;
  criticalIncidents: number;
  escalationCount: number;
  totalVaR: number;
}): number {
  return Math.min(
    entry.bottlenecks * 15 +
      entry.urgentInterventions * 20 +
      entry.criticalIncidents * 25 +
      entry.escalationCount * 10 +
      (entry.totalVaR > 500_000 ? 20 : entry.totalVaR > 100_000 ? 10 : 0),
    100,
  );
}
