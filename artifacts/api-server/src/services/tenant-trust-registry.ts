import type { TrustScoreEngine } from '@workspace/alloy';

const _tenantTrustEngines = new Map<string, TrustScoreEngine>();
let _TrustScoreEngineCtor: (new (policy?: object) => TrustScoreEngine) | null = null;

async function ensureCtor(): Promise<new (policy?: object) => TrustScoreEngine> {
  if (!_TrustScoreEngineCtor) {
    const mod = await import('@workspace/alloy');
    _TrustScoreEngineCtor = mod.TrustScoreEngine as new (policy?: object) => TrustScoreEngine;
  }
  return _TrustScoreEngineCtor;
}

export async function getTrustEngineForTenant(tenantId: string): Promise<TrustScoreEngine> {
  let engine = _tenantTrustEngines.get(tenantId);
  if (!engine) {
    const Ctor = await ensureCtor();
    engine = new Ctor();
    _tenantTrustEngines.set(tenantId, engine);
  }
  return engine;
}

export function extractTenantId(req: Record<string, unknown>): string {
  if (typeof req.tenantId === 'string') return req.tenantId;
  const user = req.user as Record<string, unknown> | undefined;
  if (user?.tenantId && typeof user.tenantId === 'string') return user.tenantId;
  const orgs = user?.orgs as Array<{ orgId?: number }> | undefined;
  if (orgs?.[0]?.orgId) return String(orgs[0].orgId);
  if (user?.id && typeof user.id === 'string') return user.id;
  return '__default__';
}
