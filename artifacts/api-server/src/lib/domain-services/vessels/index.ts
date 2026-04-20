import { domainEventBus } from '../../domain-events/index.js';

// ─── Port Interfaces ───────────────────────────────────────────────────────────

export interface VesselsStoragePort {
  listVessels(args: { status?: string; limit: number; offset: number }): Promise<unknown[]>;
  getVessel(id: number): Promise<unknown | null>;
  listPositions(args: { vesselId?: number; limit: number }): Promise<unknown[]>;
  listRoutes(args: {
    vesselId?: number;
    status?: string;
    limit: number;
    offset: number;
  }): Promise<unknown[]>;
  listEvents(args: {
    vesselId?: number;
    severity?: string;
    limit: number;
    offset: number;
  }): Promise<unknown[]>;
}

// ─── Risk Classification ──────────────────────────────────────────────────────

export type VesselRiskLevel = 'critical' | 'high' | 'medium' | 'low';

export interface VesselRiskProfile {
  riskLevel: VesselRiskLevel;
  riskScore: number;
  factors: string[];
}

export function classifyVesselRisk(vessel: {
  status?: string | null;
  vesselType?: string | null;
  hasAisGap?: boolean;
  daysWithoutPosition?: number;
}): VesselRiskProfile {
  const factors: string[] = [];
  let riskScore = 0;

  if (vessel.hasAisGap || (vessel.daysWithoutPosition ?? 0) > 3) {
    factors.push('AIS gap detected');
    riskScore += 40;
  }

  if (vessel.status === 'inactive' || vessel.status === 'decommissioned') {
    factors.push('Vessel status inactive');
    riskScore += 20;
  }

  if (vessel.vesselType === 'tanker' || vessel.vesselType === 'chemical_tanker') {
    factors.push('High-risk cargo type');
    riskScore += 15;
  }

  const riskLevel: VesselRiskLevel =
    riskScore >= 60 ? 'critical' : riskScore >= 40 ? 'high' : riskScore >= 20 ? 'medium' : 'low';

  return { riskLevel, riskScore, factors };
}

export function detectAisGap(positions: Array<{ recordedAt?: string | null }>): boolean {
  if (positions.length < 2) return false;
  const sorted = [...positions].sort((a, b) => {
    const aTime = a.recordedAt ? new Date(a.recordedAt).getTime() : 0;
    const bTime = b.recordedAt ? new Date(b.recordedAt).getTime() : 0;
    return bTime - aTime;
  });
  const latest = sorted[0]?.recordedAt ? new Date(sorted[0].recordedAt).getTime() : 0;
  const gapHours = (Date.now() - latest) / (1000 * 60 * 60);
  return gapHours > 6;
}

export function classifyVesselBehavior(
  vessel: { vesselType?: string | null; status?: string | null },
  events: Array<{ eventType?: string | null; severity?: string | null }>,
): string {
  const criticalEvents = events.filter((e) => e.severity === 'critical').length;
  const highEvents = events.filter((e) => e.severity === 'high').length;

  if (criticalEvents > 0) return 'high-risk';
  if (highEvents > 2) return 'elevated-risk';
  if (vessel.status === 'active' && criticalEvents === 0) return 'normal';
  return 'monitor';
}

export function generateComplianceRecommendations(riskProfile: VesselRiskProfile): string[] {
  const recommendations: string[] = [];

  if (riskProfile.factors.includes('AIS gap detected')) {
    recommendations.push('Investigate AIS transponder status immediately');
    recommendations.push('Contact vessel master for status confirmation');
  }

  if (riskProfile.riskLevel === 'critical' || riskProfile.riskLevel === 'high') {
    recommendations.push('Escalate to fleet operations center');
    recommendations.push('File incident report with maritime authority');
  }

  if (riskProfile.factors.includes('High-risk cargo type')) {
    recommendations.push('Verify cargo manifest and documentation');
    recommendations.push('Confirm insurance coverage is current');
  }

  return recommendations;
}

// ─── Domain Service Functions ─────────────────────────────────────────────────

export async function listVessels(
  storage: VesselsStoragePort,
  args: { status?: string; limit?: number; offset?: number },
) {
  return storage.listVessels({
    status: args.status,
    limit: args.limit ?? 50,
    offset: args.offset ?? 0,
  });
}

export async function getVessel(storage: VesselsStoragePort, id: number) {
  return storage.getVessel(id);
}

export async function listVesselPositions(
  storage: VesselsStoragePort,
  args: { vesselId?: number; limit?: number },
) {
  return storage.listPositions({ vesselId: args.vesselId, limit: args.limit ?? 100 });
}

export async function listVesselRoutes(
  storage: VesselsStoragePort,
  args: { vesselId?: number; status?: string; limit?: number; offset?: number },
) {
  return storage.listRoutes({
    vesselId: args.vesselId,
    status: args.status,
    limit: args.limit ?? 50,
    offset: args.offset ?? 0,
  });
}

export async function listVesselEvents(
  storage: VesselsStoragePort,
  args: { vesselId?: number; severity?: string; limit?: number; offset?: number },
) {
  return storage.listEvents({
    vesselId: args.vesselId,
    severity: args.severity,
    limit: args.limit ?? 50,
    offset: args.offset ?? 0,
  });
}

export function notifyVesselPositionUpdated(position: {
  vesselId: number;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  recordedAt: string | null;
}): void {
  domainEventBus.publish('vessel.position-updated', {
    vesselId: position.vesselId,
    latitude: position.latitude,
    longitude: position.longitude,
    speed: position.speed,
    recordedAt: position.recordedAt,
  });
}

export function notifyVesselStatusChanged(params: {
  vesselId: number;
  previousStatus: string | null;
  newStatus: string;
}): void {
  domainEventBus.publish('vessel.status-changed', params);
}
