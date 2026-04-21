/**
 * Decision Runtime API hooks
 * Connects the Decision Center to the real Postgres-backed decision engine.
 *
 * API paths: /api/decisions/cards/* and /api/decisions/simulate-policy
 * GET /decisions/cards and GET /decisions/cards/:id — public (demo workspace when unauthenticated)
 * POST mutating routes (approve/reject/request-changes, simulate-policy) — require an auth session
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: 'include' });
  if (!res.ok) throw new Error(`Request failed (${res.status}): ${path}`);
  return res.json() as Promise<T>;
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const csrfToken =
    document.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('csrf_token='))
      ?.split('=')[1] ?? '';
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Request failed (${res.status}): ${text || path}`);
  }
  return res.json() as Promise<T>;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type AutonomyMode =
  | 'observe'
  | 'recommend'
  | 'draft'
  | 'execute-with-approval'
  | 'auto-execute';
export type DecisionStatus =
  | 'draft'
  | 'validation-pending'
  | 'ready-for-review'
  | 'approved'
  | 'rejected'
  | 'changes-requested'
  | 'executed'
  | 'superseded';
export type PolicyState = 'cleared' | 'conditional' | 'blocked' | 'flagged' | 'pending';
export type Freshness = 'live' | 'recent' | 'stale' | 'expired';
export type Domain =
  | 'lyte'
  | 'aegis'
  | 'vessels'
  | 'terra'
  | 'counsel'
  | 'carlota'
  | 'cross_domain';

export interface DecisionCard {
  id: number;
  cardId: string;
  domain: Domain;
  title: string;
  summary: string;
  severity: Severity;
  autonomyMode: AutonomyMode;
  status: DecisionStatus;
  policyState: PolicyState;
  freshness: Freshness;
  confidence: number;
  entityScope: string[];
  recommendedAction?: string;
  owner?: string;
  priority: number;
  evidenceCount: number;
  validationSummary: {
    allPassed: boolean;
    checkCount: number;
    blockingFailures: number;
    warnings: number;
  } | null;
  auditEventId?: string;
  generatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface EvidenceItem {
  id: number;
  label: string;
  value: string;
  source: string;
  excerpt?: string;
  sourceType: string;
  freshness: Freshness;
  confidence: number;
  capturedAt: string;
}

export interface ValidationCheck {
  id: number;
  checkType:
    | 'contradiction'
    | 'stale-data'
    | 'missing-evidence'
    | 'policy'
    | 'confidence-floor'
    | 'falsification';
  passed: boolean;
  explanation: string;
  severity: 'blocking' | 'warning' | 'info';
  metadata?: Record<string, unknown>;
  ranAt: string;
}

export interface RunStep {
  stepType: 'model-call' | 'tool-call' | 'handoff';
  name: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  model?: string;
  tool?: string;
  status: 'completed' | 'failed';
  outputSummary?: string;
}

export interface RunTrace {
  runId: string;
  steps: RunStep[];
  totalLatencyMs?: number;
  totalInputTokens?: number;
  totalOutputTokens?: number;
  estimatedCostUsd?: number;
  modelsCalled: string[];
  toolsCalled: string[];
  status: string;
  startedAt: string;
  completedAt?: string;
}

export interface AuditEvent {
  eventId: string;
  eventType: string;
  actorId: string;
  actorType: string;
  actorDisplay?: string;
  reason?: string;
  previousStatus?: string;
  newStatus?: string;
  occurredAt: string;
}

export interface PolicyEvaluation {
  decision: 'allow' | 'require-approval' | 'block';
  reasons: string[];
  requiredApproverRoles?: string[];
  slaMinutes?: number;
  appliedConstitutionVersion?: string;
}

export interface DecisionDetail {
  card: DecisionCard & {
    reasoning?: string;
    reviewNote?: string;
    policyEvaluation?: PolicyEvaluation;
  };
  evidence: EvidenceItem[];
  validations: ValidationCheck[];
  runTrace: RunTrace | null;
  auditTrail: AuditEvent[];
}

// ─── Query hooks ─────────────────────────────────────────────────────────────

export interface DecisionFilters {
  severity?: Severity;
  domain?: Domain;
  status?: DecisionStatus;
  autonomyMode?: AutonomyMode;
}

export function useDecisions(filters?: DecisionFilters) {
  const params = new URLSearchParams();
  if (filters?.severity) params.set('severity', filters.severity);
  if (filters?.domain) params.set('domain', filters.domain);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.autonomyMode) params.set('autonomyMode', filters.autonomyMode);
  const query = params.toString();

  return useQuery({
    queryKey: ['decisions', filters],
    queryFn: () =>
      getJson<{ success: boolean; data: DecisionCard[]; total: number }>(
        `/api/decisions/cards${query ? `?${query}` : ''}`,
      ),
    refetchInterval: 30_000,
  });
}

export function useDecision(cardId: string | null) {
  return useQuery({
    queryKey: ['decisions', cardId],
    queryFn: () =>
      getJson<{ success: boolean; data: DecisionDetail }>(`/api/decisions/cards/${cardId}`),
    enabled: Boolean(cardId),
  });
}

// ─── Mutation hooks ───────────────────────────────────────────────────────────

export function useDecisionApprove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, reason }: { cardId: string; reason?: string }) =>
      postJson(`/api/decisions/cards/${cardId}/approve`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['decisions'] });
    },
  });
}

export function useDecisionReject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, reason }: { cardId: string; reason?: string }) =>
      postJson(`/api/decisions/cards/${cardId}/reject`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['decisions'] });
    },
  });
}

export function useDecisionRequestChanges() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, reason }: { cardId: string; reason?: string }) =>
      postJson(`/api/decisions/cards/${cardId}/request-changes`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['decisions'] });
    },
  });
}

export function useDecisionDelegate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      cardId,
      delegateTo,
      reason,
    }: {
      cardId: string;
      delegateTo: string;
      reason?: string;
    }) => postJson(`/api/decisions/cards/${cardId}/delegate`, { delegateTo, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['decisions'] });
    },
  });
}
