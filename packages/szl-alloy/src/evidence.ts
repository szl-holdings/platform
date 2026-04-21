import { defaultTraceStore } from '@workspace/trace-graph/store';
import { randomUUID } from 'crypto';
import type { Evidence, EvidenceKind } from './types.js';

function registryTraceId(tenantOrgId: number): string {
  return `alloy-evidence-registry:${tenantOrgId}`;
}

function loadRegistry(tenantOrgId: number): Record<string, Evidence> {
  const trace = defaultTraceStore.get(registryTraceId(tenantOrgId));
  if (!trace?.output) return {};
  return (trace.output as { evidence?: Record<string, Evidence> }).evidence ?? {};
}

function saveRegistry(tenantOrgId: number, registry: Record<string, Evidence>): void {
  const traceId = registryTraceId(tenantOrgId);
  const now = new Date().toISOString();
  const existing = defaultTraceStore.get(traceId);
  defaultTraceStore.save({
    traceId,
    runId: `alloy-evidence-registry:${tenantOrgId}`,
    model: 'alloy.evidence.registry',
    status: 'running',
    startedAt: existing?.startedAt ?? now,
    toolCalls: existing?.toolCalls ?? [],
    retrieval: existing?.retrieval ?? [],
    memoryIO: existing?.memoryIO ?? [],
    citations: existing?.citations ?? [],
    guardrailResults: existing?.guardrailResults ?? [],
    verifierDecisions: existing?.verifierDecisions ?? [],
    reflections: existing?.reflections ?? [],
    rollbackPoints: existing?.rollbackPoints ?? [],
    spans: existing?.spans ?? [],
    approvals: existing?.approvals ?? [],
    errors: existing?.errors ?? [],
    retries: existing?.retries ?? 0,
    modelsUsed: existing?.modelsUsed ?? [],
    promptVersions: existing?.promptVersions ?? [],
    operatorComments: existing?.operatorComments ?? [],
    metadata: { tenantOrgId },
    output: { evidence: registry },
  });
}

function requireTenant(tenantOrgId: unknown): number {
  if (typeof tenantOrgId !== 'number' || !Number.isFinite(tenantOrgId)) {
    throw new Error(
      `[alloy/evidence] tenantOrgId is required and must be a finite number. Received: ${JSON.stringify(tenantOrgId)}`,
    );
  }
  return tenantOrgId;
}

export interface CreateEvidenceParams {
  kind: EvidenceKind;
  label: string;
  value: string;
  source: string;
  sourceId?: string;
  confidence?: number;
  weight?: number;
  maxAgeMs?: number;
  metadata?: Record<string, unknown>;
  tenantOrgId: number;
}

export function createEvidence(params: CreateEvidenceParams): Evidence {
  const tenantOrgId = requireTenant(params.tenantOrgId);
  const id = randomUUID();
  const now = new Date().toISOString();
  const ev: Evidence = {
    id,
    kind: params.kind,
    label: params.label,
    value: params.value,
    source: params.source,
    sourceId: params.sourceId,
    freshness: {
      capturedAt: now,
      isStale: false,
      maxAgeMs: params.maxAgeMs,
    },
    confidence: params.confidence ?? 1,
    weight: params.weight ?? 1,
    metadata: params.metadata ?? {},
  };
  const registry = loadRegistry(tenantOrgId);
  registry[id] = ev;
  saveRegistry(tenantOrgId, registry);
  return ev;
}

export function getEvidence(id: string, tenantOrgId: number): Evidence | undefined {
  const tenant = requireTenant(tenantOrgId);
  const registry = loadRegistry(tenant);
  const ev = registry[id];
  if (!ev) return undefined;
  return _checkFreshness(id, ev, tenant, registry);
}

export function listEvidence(ids: string[] | undefined, tenantOrgId: number): Evidence[] {
  const tenant = requireTenant(tenantOrgId);
  const registry = loadRegistry(tenant);
  if (ids && ids.length > 0) {
    return ids
      .map((id) => {
        const ev = registry[id];
        if (!ev) return undefined;
        return _checkFreshness(id, ev, tenant, registry);
      })
      .filter(Boolean) as Evidence[];
  }
  return Object.entries(registry)
    .map(([id, ev]) => _checkFreshness(id, ev, tenant, registry))
    .filter(Boolean) as Evidence[];
}

function _checkFreshness(
  id: string,
  ev: Evidence,
  tenantOrgId: number,
  registry: Record<string, Evidence>,
): Evidence {
  if (ev.freshness.maxAgeMs !== undefined) {
    const age = Date.now() - new Date(ev.freshness.capturedAt).getTime();
    if (age > ev.freshness.maxAgeMs) {
      const stale = { ...ev, freshness: { ...ev.freshness, isStale: true } };
      registry[id] = stale;
      saveRegistry(tenantOrgId, registry);
      return stale;
    }
  }
  return ev;
}

export function deleteEvidence(id: string, tenantOrgId: number): boolean {
  const tenant = requireTenant(tenantOrgId);
  const registry = loadRegistry(tenant);
  if (!(id in registry)) return false;
  delete registry[id];
  saveRegistry(tenant, registry);
  return true;
}

export function markEvidenceStale(id: string, tenantOrgId: number): boolean {
  const tenant = requireTenant(tenantOrgId);
  const registry = loadRegistry(tenant);
  const ev = registry[id];
  if (!ev) return false;
  registry[id] = { ...ev, freshness: { ...ev.freshness, isStale: true } };
  saveRegistry(tenant, registry);
  return true;
}

export function computeEvidenceFreshnessScore(evidence: Evidence[]): number {
  if (evidence.length === 0) return 0;
  const freshCount = evidence.filter((e) => !e.freshness.isStale).length;
  return freshCount / evidence.length;
}
