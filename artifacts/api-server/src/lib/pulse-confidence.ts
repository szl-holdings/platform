export type ConfidenceLevel = 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT';
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export function confidenceLabel(c: number): ConfidenceLevel {
  if (c >= 0.8) return 'HIGH';
  if (c >= 0.65) return 'MODERATE';
  if (c >= 0.5) return 'LOW';
  return 'INSUFFICIENT';
}

export function clampRisk(s: unknown): RiskLevel {
  const v = String(s ?? '').toUpperCase();
  if (v === 'CRITICAL' || v === 'HIGH' || v === 'MEDIUM' || v === 'LOW') return v as RiskLevel;
  return 'MEDIUM';
}

export function clampConfidence(c: number): number {
  return Number(Math.max(0.4, Math.min(0.99, c)).toFixed(2));
}

export function averageConfidence(scores: number[]): number {
  if (!scores.length) return 0.75;
  return Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
}
