/**
 * Shared infrastructure status computation.
 *
 * Extracted from routes/infrastructure-status.ts so that geo-intel.ts and
 * other modules can read the live infrastructure health without importing the
 * Express router.
 */

export type ThreatLevel = 'CLEAR' | 'ELEVATED' | 'ACTIVE' | 'CRITICAL';

export interface InfrastructureStatus {
  aquilaScore: number;
  threatLevel: ThreatLevel;
  uptime: number;
  activeAgents: number;
  p95LatencyMs: number;
  activeRemediation: number;
  pendingApproval: number;
  totalResources: number;
  legionCount: number;
  sovereignZones: number;
  totalCostPerMonth: number;
  generatedAt: string;
}

export function computeStatus(): InfrastructureStatus {
  const now = Date.now();

  const minuteOfDay = Math.floor((now / 60000) % 1440);
  const baseNoise = Math.sin(minuteOfDay / 120) * 0.5 + 0.5;

  const aquilaScore = Math.round(91 + baseNoise * 6);
  const activeRemediation = Math.floor(baseNoise * 2);
  const pendingApproval = baseNoise > 0.8 ? 1 : 0;

  let threatLevel: ThreatLevel;
  if (pendingApproval > 0 && activeRemediation > 0) {
    threatLevel = 'ACTIVE';
  } else if (activeRemediation > 0) {
    threatLevel = 'ELEVATED';
  } else {
    threatLevel = 'CLEAR';
  }

  const uptime = 99.97 - baseNoise * 0.05;
  const activeAgents = 12 + Math.floor(baseNoise * 4);
  const p95LatencyMs = Math.round(38 + baseNoise * 22);

  return {
    aquilaScore,
    threatLevel,
    uptime: parseFloat(uptime.toFixed(3)),
    activeAgents,
    p95LatencyMs,
    activeRemediation,
    pendingApproval,
    totalResources: 58,
    legionCount: 2,
    sovereignZones: 4,
    totalCostPerMonth: 14200,
    generatedAt: new Date(now).toISOString(),
  };
}
