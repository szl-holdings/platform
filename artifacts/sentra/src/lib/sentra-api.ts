const BASE = '/api';

function readCsrfCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function ensureCsrf(): Promise<string | null> {
  const existing = readCsrfCookie();
  if (existing) return existing;
  try {
    await fetch(`${BASE}/csrf-token`, { credentials: 'include' });
  } catch {
    return null;
  }
  return readCsrfCookie();
}

async function csrfHeaders(): Promise<HeadersInit> {
  const token = await ensureCsrf();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['X-CSRF-Token'] = token;
  return headers;
}

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'open' | 'triaging' | 'escalated' | 'contained' | 'resolved';
export type AlertStatus = 'open' | 'acknowledged' | 'suppressed';
export type AgentStatus = 'healthy' | 'stale' | 'isolated' | 'uninstalled';
export type AgentOS = 'linux' | 'windows' | 'macos';
export type AgentAction = 'isolate' | 'release' | 'uninstall' | 'rotate-token';

export interface TimelineEntry {
  id: string;
  type: 'detection' | 'system' | 'user' | 'escalation' | 'resolution';
  message: string;
  actor: string;
  timestamp: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  mitreStage: string;
  detectedAt: string;
  updatedAt: string;
  resolvedAt?: string;
  assignedTo?: string;
  affectedAssets: string[];
  tags: string[];
  timeline: TimelineEntry[];
}

export interface SentraAlert {
  id: string;
  title: string;
  severity: IncidentSeverity;
  source: string;
  status: AlertStatus;
  description: string;
  asset?: string;
  detectedAt: string;
  linkedIncidentId?: string;
}

export interface SentraSummary {
  source: 'live' | 'seed';
  activeIncidents: number;
  criticalAlerts: number;
  totalAlerts: number;
  lastUpdated: string;
}

export interface AgentAuditEntry {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  detail?: string;
}

export interface Agent {
  id: string;
  hostname: string;
  os: AgentOS;
  version: string;
  enrollmentToken?: string;
  tenantId: string;
  tags: string[];
  status: AgentStatus;
  lastHeartbeatAt: string | null;
  enrolledAt: string;
  updatedAt: string;
  auditTrail: AgentAuditEntry[];
}

export interface EnrollmentToken {
  token: string;
  tenantId: string;
  tags: string[];
  createdAt: string;
  expiresAt: string;
}

export interface InstallSnippets {
  linux: string;
  windows: string;
  macos: string;
}

export interface SiemConnection {
  id: string;
  name: string;
  adapterId: string;
  config: Record<string, unknown>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastTestedAt?: string;
  lastTestResult?: { ok: boolean; message: string };
  alertsIngested: number;
}

export interface SiemAdapterMeta {
  id: string;
  displayName: string;
  description: string;
  configFields: Array<{ key: string; description: string; optional: boolean }>;
}

// ── Incidents ──────────────────────────────────────────────────────────────

export async function listIncidents(): Promise<{ incidents: Incident[]; source: 'live' | 'seed' }> {
  try {
    const res = await fetch(`${BASE}/sentra/incidents`, { credentials: 'include' });
    if (!res.ok) throw new Error(`${res.status}`);
    const body = (await res.json()) as { incidents: Incident[]; source: 'live' | 'seed' };
    return body;
  } catch {
    return { incidents: [], source: 'seed' };
  }
}

export async function createIncident(payload: {
  title: string;
  description: string;
  severity: IncidentSeverity;
  mitreStage?: string;
  affectedAssets?: string[];
  tags?: string[];
  assignedTo?: string;
}): Promise<{ ok: true; incident: Incident } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${BASE}/sentra/incidents`, {
      method: 'POST',
      headers: await csrfHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, error: `Request failed (${res.status})` };
    const body = (await res.json()) as Incident;
    return { ok: true, incident: body };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

export async function updateIncident(
  id: string,
  patch: {
    status?: IncidentStatus;
    assignedTo?: string;
    note?: string;
    actor?: string;
  },
): Promise<{ ok: true; incident: Incident } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${BASE}/sentra/incidents/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: await csrfHeaders(),
      credentials: 'include',
      body: JSON.stringify(patch),
    });
    if (!res.ok) return { ok: false, error: `Request failed (${res.status})` };
    const body = (await res.json()) as Incident;
    return { ok: true, incident: body };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

// ── Alerts ─────────────────────────────────────────────────────────────────

export async function listAlerts(): Promise<{ alerts: SentraAlert[]; source: 'live' | 'seed' }> {
  try {
    const res = await fetch(`${BASE}/sentra/alerts`, { credentials: 'include' });
    if (!res.ok) throw new Error(`${res.status}`);
    const body = (await res.json()) as { alerts: SentraAlert[]; source: 'live' | 'seed' };
    return body;
  } catch {
    return { alerts: [], source: 'seed' };
  }
}

export async function updateAlert(
  id: string,
  status: AlertStatus,
): Promise<{ ok: true; alert: SentraAlert } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${BASE}/sentra/alerts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: await csrfHeaders(),
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return { ok: false, error: `Request failed (${res.status})` };
    const body = (await res.json()) as SentraAlert;
    return { ok: true, alert: body };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

export async function getSentraSummary(): Promise<SentraSummary | null> {
  try {
    const res = await fetch(`${BASE}/sentra/summary`, { credentials: 'include' });
    if (!res.ok) return null;
    const body = (await res.json()) as SentraSummary;
    return body;
  } catch {
    return null;
  }
}

// ── Agents ─────────────────────────────────────────────────────────────────

export async function listAgents(): Promise<{ agents: Agent[]; source: 'live' | 'seed' }> {
  try {
    const res = await fetch(`${BASE}/sentra/agents`, { credentials: 'include' });
    if (!res.ok) throw new Error(`${res.status}`);
    const body = (await res.json()) as { agents: Agent[]; source: 'live' | 'seed' };
    return body;
  } catch {
    return { agents: [], source: 'seed' };
  }
}

export async function enrollAgent(payload: {
  tenantId?: string;
  tags?: string[];
}): Promise<
  | { ok: true; token: EnrollmentToken; installSnippets: InstallSnippets }
  | { ok: false; error: string }
> {
  try {
    const res = await fetch(`${BASE}/sentra/agents/enroll`, {
      method: 'POST',
      headers: await csrfHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, error: `Request failed (${res.status})` };
    const body = (await res.json()) as { token: EnrollmentToken; installSnippets: InstallSnippets };
    return { ok: true, ...body };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

export async function agentAction(
  id: string,
  action: AgentAction,
  options?: { actor?: string; reason?: string },
): Promise<{ ok: true; agent: Agent } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${BASE}/sentra/agents/${encodeURIComponent(id)}/action`, {
      method: 'POST',
      headers: await csrfHeaders(),
      credentials: 'include',
      body: JSON.stringify({ action, ...options }),
    });
    if (!res.ok) return { ok: false, error: `Request failed (${res.status})` };
    const body = (await res.json()) as Agent;
    return { ok: true, agent: body };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

export async function deleteAgent(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${BASE}/sentra/agents/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: await csrfHeaders(),
      credentials: 'include',
    });
    if (!res.ok) return { ok: false, error: `Request failed (${res.status})` };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

// ── SIEM Connections ────────────────────────────────────────────────────────

export async function listSiemAdapters(): Promise<SiemAdapterMeta[]> {
  try {
    const res = await fetch(`${BASE}/sentra/siem/adapters`, { credentials: 'include' });
    if (!res.ok) return [];
    const body = (await res.json()) as { adapters: SiemAdapterMeta[] };
    return body.adapters;
  } catch {
    return [];
  }
}

export async function listSiemConnections(): Promise<SiemConnection[]> {
  try {
    const res = await fetch(`${BASE}/sentra/siem/connections`, { credentials: 'include' });
    if (!res.ok) return [];
    const body = (await res.json()) as { connections: SiemConnection[] };
    return body.connections;
  } catch {
    return [];
  }
}

export async function createSiemConnection(payload: {
  name: string;
  adapterId: string;
  config: Record<string, unknown>;
}): Promise<{ ok: true; connection: SiemConnection } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${BASE}/sentra/siem/connections`, {
      method: 'POST',
      headers: await csrfHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: err.error ?? `Request failed (${res.status})` };
    }
    const body = (await res.json()) as SiemConnection;
    return { ok: true, connection: body };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

export async function updateSiemConnection(
  id: string,
  patch: { name?: string; config?: Record<string, unknown> },
): Promise<{ ok: true; connection: SiemConnection } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${BASE}/sentra/siem/connections/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: await csrfHeaders(),
      credentials: 'include',
      body: JSON.stringify(patch),
    });
    if (!res.ok) return { ok: false, error: `Request failed (${res.status})` };
    const body = (await res.json()) as SiemConnection;
    return { ok: true, connection: body };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

export async function deleteSiemConnection(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${BASE}/sentra/siem/connections/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: await csrfHeaders(),
      credentials: 'include',
    });
    if (!res.ok) return { ok: false, error: `Request failed (${res.status})` };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

export async function testSiemConnection(
  id: string,
): Promise<{ ok: true; sample: unknown[] } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${BASE}/sentra/siem/connections/${encodeURIComponent(id)}/test`, {
      method: 'POST',
      headers: await csrfHeaders(),
      credentials: 'include',
    });
    if (!res.ok) return { ok: false, error: `Request failed (${res.status})` };
    const body = (await res.json()) as { ok: boolean; sample?: unknown[]; error?: string };
    if (!body.ok) return { ok: false, error: body.error ?? 'Test failed' };
    return { ok: true, sample: body.sample ?? [] };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

export async function toggleSiemConnection(
  id: string,
  enabled: boolean,
): Promise<{ ok: true; connection: SiemConnection } | { ok: false; error: string }> {
  try {
    const action = enabled ? 'enable' : 'disable';
    const res = await fetch(`${BASE}/sentra/siem/connections/${encodeURIComponent(id)}/${action}`, {
      method: 'POST',
      headers: await csrfHeaders(),
      credentials: 'include',
    });
    if (!res.ok) return { ok: false, error: `Request failed (${res.status})` };
    const body = (await res.json()) as SiemConnection;
    return { ok: true, connection: body };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

// ── Threat Hunt List ────────────────────────────────────────────────────────

export interface HuntListItem {
  id: string;
  title: string;
  hypothesis: string;
  reasoning: string;
  proposedAt: string;
  mitreTactics: string[];
  mitreIds: string[];
  falsePositiveRate: number;
  confidenceScore: number;
  signalCount: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'proposed' | 'active' | 'completed' | 'dismissed';
  blastRadiusCost: number;
  affectedBusinessEntities: string[];
}

interface RawHunt {
  id: string;
  title: string;
  hypothesis: string;
  reasoning: string;
  proposedAt: string;
  mitreTactics: string[];
  mitreIds: string[];
  falsePositiveRate: number;
  confidenceScore: number;
  signalCount: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'proposed' | 'active' | 'completed' | 'dismissed';
  attackPath?: {
    blastRadiusCost?: number;
    affectedBusinessEntities?: string[];
  };
  blastRadiusCost?: number;
  affectedBusinessEntities?: string[];
}

function normalizeHunt(raw: RawHunt): HuntListItem {
  return {
    id: raw.id,
    title: raw.title,
    hypothesis: raw.hypothesis ?? '',
    reasoning: raw.reasoning ?? '',
    proposedAt: raw.proposedAt ?? new Date().toISOString(),
    mitreTactics: raw.mitreTactics ?? [],
    mitreIds: raw.mitreIds ?? [],
    falsePositiveRate: raw.falsePositiveRate ?? 0,
    confidenceScore: raw.confidenceScore ?? 0,
    signalCount: raw.signalCount ?? 0,
    severity: raw.severity ?? 'medium',
    status: raw.status ?? 'proposed',
    blastRadiusCost: raw.blastRadiusCost ?? raw.attackPath?.blastRadiusCost ?? 0,
    affectedBusinessEntities: raw.affectedBusinessEntities ?? raw.attackPath?.affectedBusinessEntities ?? [],
  };
}

export async function listHunts(): Promise<{ hunts: HuntListItem[]; source: 'live' | 'seed' }> {
  const res = await fetch(`${BASE}/sentra/hunt-data/hunts`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch hunts (${res.status})`);
  const body = (await res.json()) as { hunts: RawHunt[]; source?: string };
  const hunts = (body.hunts ?? []).map(normalizeHunt);
  return { hunts, source: (body.source as 'live' | 'seed') ?? 'live' };
}

// ── Remediation Pipeline ────────────────────────────────────────────────────

export type RemediationStage =
  | 'ingested'
  | 'contextualized'
  | 'recommended'
  | 'simulated'
  | 'policy-gated'
  | 'approved'
  | 'executing'
  | 'verifying'
  | 'resolved'
  | 'failed';

export type RemediationOutcome = 'pending' | 'verified' | 'regressed' | 'failed' | 'risk-accepted';

export interface RemediationRecommendation {
  action: string;
  type: 'patch' | 'config-change' | 'compensating-control' | 'accept-risk';
  confidence: number;
  rationale: string;
  alternatives?: Array<{ action: string; type: string; confidence: number }>;
  generatedAt: string;
}

export interface RemediationSimulation {
  affectedSystemCount: number;
  estimatedDowntimeMinutes: number;
  blastRadius: 'low' | 'medium' | 'high';
  dependencyImpact: string[];
  rollbackPlan: string;
  simulatedAt: string;
}

export interface RemediationPolicy {
  requiredTier: 'auto' | 'operator' | 'executive';
  tierReason: string;
  approvedBy?: string;
  approvedAt?: string;
  decision?: 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface RemediationExecution {
  instructions: string;
  dispatchedTo: string[];
  startedAt: string;
  completedAt?: string;
  executor?: string;
  result?: 'success' | 'partial' | 'failed';
  notes?: string;
}

export interface RemediationVerification {
  verifiedAt?: string;
  verifiedBy?: string;
  method: 'manual' | 'rescan' | 'automated';
  vulnerabilityResolved: boolean;
  regressionDetected: boolean;
  notes?: string;
}

export interface RemediationTimelineEntry {
  id: string;
  stage: RemediationStage;
  message: string;
  actor: string;
  timestamp: string;
  proofId?: string;
}

export interface RemediationCase {
  id: string;
  cveId?: string | null;
  title: string;
  description: string;
  severity: IncidentSeverity;
  source: string;
  sourceRef?: string | null;
  affectedAsset?: string | null;
  affectedAssets: string[];
  stage: RemediationStage;
  outcome: RemediationOutcome;
  context: Record<string, unknown>;
  recommendation?: RemediationRecommendation | null;
  simulation?: RemediationSimulation | null;
  policy?: RemediationPolicy | null;
  execution?: RemediationExecution | null;
  verification?: RemediationVerification | null;
  proofChainIds: string[];
  timeline: RemediationTimelineEntry[];
  assignedTo?: string;
  detectedAt: string;
  updatedAt: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface RemediationMetrics {
  source: 'live' | 'seed';
  total: number;
  open: number;
  resolved: number;
  failed: number;
  successRate: number;
  meanTimeToRemediateSeconds: number | null;
  byStage: Record<string, number>;
  bySeverity: Record<string, number>;
  approvalBottleneck: { pending: number; oldestAgeMinutes: number };
  lastUpdated: string;
}

export async function listRemediationCases(): Promise<{
  cases: RemediationCase[];
  source: 'live' | 'seed';
}> {
  try {
    const res = await fetch(`${BASE}/sentra/remediation/cases`, { credentials: 'include' });
    if (!res.ok) throw new Error(`${res.status}`);
    const body = (await res.json()) as { cases: RemediationCase[]; source: 'live' | 'seed' };
    return body;
  } catch {
    return { cases: [], source: 'seed' };
  }
}

export async function getRemediationMetrics(): Promise<RemediationMetrics | null> {
  try {
    const res = await fetch(`${BASE}/sentra/remediation/metrics`, { credentials: 'include' });
    if (!res.ok) return null;
    return (await res.json()) as RemediationMetrics;
  } catch {
    return null;
  }
}

export async function ingestRemediationFinding(payload: {
  cveId?: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  affectedAssets?: string[];
  source?: string;
  sourceRef?: string;
  context?: Record<string, unknown>;
  assignedTo?: string;
}): Promise<{ ok: true; case: RemediationCase } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${BASE}/sentra/remediation/cases`, {
      method: 'POST',
      headers: await csrfHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, error: `Request failed (${res.status})` };
    return { ok: true, case: (await res.json()) as RemediationCase };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

async function postCaseAction(
  id: string,
  action: string,
  body?: Record<string, unknown>,
): Promise<{ ok: true; case: RemediationCase } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${BASE}/sentra/remediation/cases/${encodeURIComponent(id)}/${action}`, {
      method: 'POST',
      headers: await csrfHeaders(),
      credentials: 'include',
      body: JSON.stringify(body ?? {}),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: err.error ?? `Request failed (${res.status})` };
    }
    return { ok: true, case: (await res.json()) as RemediationCase };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

// Lifecycle actions: actor / approver / executor / verifier identities are
// resolved server-side from the authenticated principal (req.user). The
// frontend deliberately does not send those fields — that's enforced by the
// API to prevent self-asserted authority.
export const contextualizeRemediation = (id: string) => postCaseAction(id, 'contextualize');
export const recommendRemediation = (id: string) => postCaseAction(id, 'recommend');
export const simulateRemediation = (id: string) => postCaseAction(id, 'simulate');
export const evaluatePolicyRemediation = (id: string) => postCaseAction(id, 'policy');
export const approveRemediation = (
  id: string,
  decision: 'approved' | 'rejected',
  reason?: string,
) => postCaseAction(id, 'approve', { decision, reason });
export const executeRemediation = (
  id: string,
  result: 'success' | 'partial' | 'failed',
  notes?: string,
) => postCaseAction(id, 'execute', { result, notes });
export const verifyRemediation = (
  id: string,
  payload: {
    method: 'manual' | 'rescan' | 'automated';
    vulnerabilityResolved: boolean;
    regressionDetected?: boolean;
    notes?: string;
  },
) => postCaseAction(id, 'verify', payload);

export async function seedRemediationDemo(): Promise<{ seeded: number; skipped: boolean } | null> {
  try {
    const res = await fetch(`${BASE}/sentra/remediation/seed-demo`, {
      method: 'POST',
      headers: await csrfHeaders(),
      credentials: 'include',
    });
    if (!res.ok) return null;
    return (await res.json()) as { seeded: number; skipped: boolean };
  } catch {
    return null;
  }
}

// ── PQC & Hardware Trust ────────────────────────────────────────────────────

export interface PqcStandardItem {
  id: string;
  fips: string;
  name: string;
  purpose: string;
  status: 'deployed' | 'in-progress' | 'planned' | 'not-started';
  deployedCount: number;
  plannedCount: number;
}

interface RawPqcStandard {
  id: string;
  fips: string;
  name: string;
  purpose: string;
  status: 'deployed' | 'in-progress' | 'planned' | 'not-started';
  deployedIn?: string[];
  planned?: string[];
  deployedCount?: number;
  plannedCount?: number;
}

function normalizePqcStandard(raw: RawPqcStandard): PqcStandardItem {
  return {
    id: raw.id,
    fips: raw.fips ?? '',
    name: raw.name ?? '',
    purpose: raw.purpose ?? '',
    status: raw.status ?? 'not-started',
    deployedCount: raw.deployedCount ?? raw.deployedIn?.length ?? 0,
    plannedCount: raw.plannedCount ?? raw.planned?.length ?? 0,
  };
}

export interface MigrationPhaseItem {
  id: string;
  phase: string;
  status: 'deployed' | 'in-progress' | 'planned' | 'not-started';
  taskCount: number;
}

interface RawMigrationPhase {
  id: string;
  phase: string;
  status: 'deployed' | 'in-progress' | 'planned' | 'not-started';
  tasks?: string[];
  taskCount?: number;
}

function normalizeMigrationPhase(raw: RawMigrationPhase): MigrationPhaseItem {
  return {
    id: raw.id,
    phase: raw.phase ?? '',
    status: raw.status ?? 'not-started',
    taskCount: raw.taskCount ?? raw.tasks?.length ?? 0,
  };
}

export interface PqcReadinessScore {
  score: number;
  deployed: number;
  inProgress: number;
  total: number;
}

export interface HardwareTrustSummary {
  verifiedAnchors: number;
  totalAnchors: number;
  avgIntegrity: number;
  cheriCompartments: number;
  attestedComponents: number;
  totalComponents: number;
}

export async function listPqcStandards(): Promise<PqcStandardItem[]> {
  const res = await fetch(`${BASE}/sentra/pqc/standards`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch PQC standards (${res.status})`);
  const body = (await res.json()) as { standards: RawPqcStandard[] };
  return (body.standards ?? []).map(normalizePqcStandard);
}

export async function listMigrationPhases(): Promise<MigrationPhaseItem[]> {
  const res = await fetch(`${BASE}/sentra/pqc/migration-phases`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch migration phases (${res.status})`);
  const body = (await res.json()) as { phases: RawMigrationPhase[] };
  return (body.phases ?? []).map(normalizeMigrationPhase);
}

export async function getPqcReadinessScore(): Promise<PqcReadinessScore | null> {
  const res = await fetch(`${BASE}/sentra/pqc/readiness-score`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch readiness score (${res.status})`);
  return (await res.json()) as PqcReadinessScore;
}

export async function getHardwareTrustSummary(): Promise<HardwareTrustSummary | null> {
  const res = await fetch(`${BASE}/sentra/hardware-trust/summary`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch hardware trust summary (${res.status})`);
  return (await res.json()) as HardwareTrustSummary;
}

// ── Agent Mesh (Sentra API) ──────────────────────────────────────────────────

export interface MeshRuntime {
  id: string;
  name: string;
  version: string;
  sourceRegistry: string;
  lastSeen: string;
  trustState: 'trusted' | 'unverified' | 'quarantined';
  configFiles: string[];
  activeAgentIds: string[];
}

export interface MeshMcpServer {
  id: string;
  name: string;
  packageRef: string;
  version: string;
  pinned: boolean;
  sourceRegistry: string;
  lastSeen: string;
  trustState: 'trusted' | 'unverified' | 'quarantined';
  runtimeIds: string[];
  allowedEgressDomains: string[];
  detectedEgressDomains: string[];
}

export interface MeshExposureItem {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affectedAgentIds: string[];
  affectedSecretIds: string[];
  affectedMcpIds: string[];
  explanation: string;
  status: 'open' | 'fix-pending' | 'resolved';
}

export interface MeshResilienceItem {
  id: string;
  overall: number;
  grade: string;
  secretHygiene: number;
  permissionSurface: number;
  supplyChain: number;
  egressContainment: number;
}

export interface MeshSummary {
  totalRuntimes: number;
  trustedRuntimes: number;
  quarantinedRuntimes: number;
  totalMcpServers: number;
  quarantinedServers: number;
  openExposures: number;
  criticalExposures: number;
  resilienceGrade: string;
  resilienceScore: number;
}

export async function listMeshRuntimes(): Promise<MeshRuntime[]> {
  const res = await fetch(`${BASE}/sentra/agent-mesh/runtimes`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch mesh runtimes (${res.status})`);
  const body = (await res.json()) as { runtimes: MeshRuntime[] };
  return body.runtimes ?? [];
}

export async function listMeshMcpServers(): Promise<MeshMcpServer[]> {
  const res = await fetch(`${BASE}/sentra/agent-mesh/mcp-servers`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch MCP servers (${res.status})`);
  const body = (await res.json()) as { mcpServers: MeshMcpServer[] };
  return body.mcpServers ?? [];
}

export async function listMeshExposures(): Promise<MeshExposureItem[]> {
  const res = await fetch(`${BASE}/sentra/agent-mesh/exposures`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch mesh exposures (${res.status})`);
  const body = (await res.json()) as { exposures: MeshExposureItem[] };
  return body.exposures ?? [];
}

export async function getMeshSummary(): Promise<MeshSummary | null> {
  const res = await fetch(`${BASE}/sentra/agent-mesh/summary`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch mesh summary (${res.status})`);
  return (await res.json()) as MeshSummary;
}

export async function listMeshResilience(): Promise<MeshResilienceItem | null> {
  const res = await fetch(`${BASE}/sentra/agent-mesh/resilience`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch mesh resilience (${res.status})`);
  const body = (await res.json()) as { resilience: MeshResilienceItem[] };
  return body.resilience?.[0] ?? null;
}

export async function patchMeshRuntimeTrustState(
  runtimeId: string,
  trustState: 'trusted' | 'unverified' | 'quarantined',
): Promise<{ ok: true; runtime: MeshRuntime } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${BASE}/sentra/agent-mesh/runtimes/${encodeURIComponent(runtimeId)}`, {
      method: 'PATCH',
      headers: await csrfHeaders(),
      credentials: 'include',
      body: JSON.stringify({ trustState }),
    });
    if (res.status === 404) return { ok: false, error: 'Runtime not found' };
    if (!res.ok) return { ok: false, error: `Request failed (${res.status})` };
    const data = (await res.json()) as MeshRuntime;
    return { ok: true, runtime: data };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

export async function patchMcpServerTrustState(
  mcpId: string,
  trustState: 'trusted' | 'unverified' | 'quarantined',
): Promise<{ ok: true; server: MeshMcpServer } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${BASE}/sentra/agent-mesh/mcp-servers/${encodeURIComponent(mcpId)}`, {
      method: 'PATCH',
      headers: await csrfHeaders(),
      credentials: 'include',
      body: JSON.stringify({ trustState }),
    });
    if (res.status === 404) return { ok: false, error: 'MCP server not found' };
    if (!res.ok) return { ok: false, error: `Request failed (${res.status})` };
    const data = (await res.json()) as MeshMcpServer;
    return { ok: true, server: data };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

// ── Threat Hunt Actions ─────────────────────────────────────────────────────

export interface HuntApprovalResult {
  huntId: string;
  approvedAt: string;
  approvedBy: string;
  signalPublished: boolean;
}

export interface RemediationApprovalResult {
  planId: string;
  approvedAt: string;
  approvedBy: string;
  signalsBroadcast: string[];
  signalPublished: boolean;
}

export async function approveHunt(
  huntId: string,
  payload: {
    huntTitle: string;
    severity: string;
    blastRadiusCost: number;
    affectedBusinessEntities: string[];
    approvedBy?: string;
  },
): Promise<{ ok: true; result: HuntApprovalResult } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${BASE}/sentra/hunts/${encodeURIComponent(huntId)}/approve`, {
      method: 'POST',
      headers: await csrfHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, error: `Request failed (${res.status})` };
    const body = (await res.json()) as HuntApprovalResult;
    return { ok: true, result: body };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

export async function dismissHunt(
  huntId: string,
  payload: { reason?: string; dismissedBy?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${BASE}/sentra/hunts/${encodeURIComponent(huntId)}/dismiss`, {
      method: 'POST',
      headers: await csrfHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, error: `Request failed (${res.status})` };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

export async function approveRemediation(
  planId: string,
  payload: {
    huntId: string;
    huntTitle: string;
    blastRadiusCost: number;
    stepCount: number;
    approvedBy?: string;
    signalsBroadcast?: string[];
  },
): Promise<{ ok: true; result: RemediationApprovalResult } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${BASE}/sentra/remediation/${encodeURIComponent(planId)}/approve`, {
      method: 'POST',
      headers: await csrfHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, error: `Request failed (${res.status})` };
    const body = (await res.json()) as RemediationApprovalResult;
    return { ok: true, result: body };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

// ── Research surfaces — read-only datasets for the rich command pages ───────

export interface ResearchEnvelope {
  source: 'live' | 'seed';
  lastUpdated: string;
}

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { credentials: 'include' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// Autonomous SOC Command
export type AutonomousSocStageStatus = 'active' | 'idle' | 'overloaded';
export interface AutonomousSocStage {
  id: string;
  label: string;
  count: number;
  avgTime: string;
  status: AutonomousSocStageStatus;
  icon: string;
}

export interface SmartScoreAlert {
  id: string;
  title: string;
  score: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  triageTime: string;
  resolution: string;
  correlatedAlerts: number;
}

export interface MlModelCluster {
  category: string;
  count: number;
  accuracy: number;
  status: 'operational' | 'retraining' | 'degraded';
  lastUpdated: string;
}

export interface AgentixAgent {
  id: string;
  name: string;
  phase: 'plan' | 'reason' | 'execute' | 'monitor';
  task: string;
  alertsProcessed: number;
  mttr: string;
  confidence: number;
  status: 'active' | 'idle' | 'cooldown';
}

export interface AutonomousSocResponse extends ResearchEnvelope {
  pipelineStages: AutonomousSocStage[];
  smartScoreAlerts: SmartScoreAlert[];
  mlModelClusters: MlModelCluster[];
  agentixWorkforce: AgentixAgent[];
  metrics: {
    alertsIngested24h: number;
    avgSmartScoreTime: string;
    autoTriageRate: string;
    autonomousMttr: string;
  };
  correlation: {
    rawAlerts24h: number;
    afterDedup: number;
    correlatedCases: number;
    compressionRatio: string;
  };
}

export function getAutonomousSocPage() {
  return getJson<AutonomousSocResponse>('/sentra/pages/autonomous-soc');
}

// Frontier AI Threat Lab
export interface KillChainPhase {
  id: string;
  phase: string;
  technique: string;
  timeElapsed: string;
  totalMinutes: number;
  description: string;
  aiAgent: string;
  status: 'complete' | 'active' | 'pending';
}

export interface MultiAgentAttack {
  id: string;
  name: string;
  framework: string;
  role: string;
  target: string;
  status: 'attacking' | 'detected' | 'contained' | 'evaded';
  confidence: number;
}

export interface FrontierExposure {
  id: string;
  vector: string;
  severity: 'critical' | 'high' | 'medium';
  exposure: string;
  weaponizationDays: number;
  mitigation: string;
}

export interface FrontierAiThreatLabResponse extends ResearchEnvelope {
  killChain: KillChainPhase[];
  multiAgentAttacks: MultiAgentAttack[];
  frontierExposures: FrontierExposure[];
  metrics: {
    fullChainDuration: string;
    aiSpecialistAgents: number;
    cveWeaponizationDays: string;
    detectionGap: string;
  };
}

export function getFrontierAiThreatLabPage() {
  return getJson<FrontierAiThreatLabResponse>('/sentra/pages/frontier-ai-threat-lab');
}

// Attack Surface Command
export type DiscoveredAssetType = 'web' | 'api' | 'rdp' | 'ssh' | 'database' | 'cloud' | 'iot' | 'email';
export interface DiscoveredAsset {
  id: string;
  domain: string;
  type: DiscoveredAssetType;
  ip: string;
  port: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  isKnown: boolean;
  isShadowIT: boolean;
  lastSeen: string;
  org: string;
  cves: number;
  risk: number;
}

export interface SupplyChainVendor {
  id: string;
  name: string;
  exposedAssets: number;
  risk: 'critical' | 'high' | 'medium' | 'low';
  lastAssessment: string;
  breachHistory: number;
}

export interface AttackSurfacePlaybook {
  id: string;
  name: string;
  trigger: string;
  actions: string[];
  autoExecute: boolean;
  lastRun: string;
}

export interface AttackSurfaceResponse extends ResearchEnvelope {
  discoveredAssets: DiscoveredAsset[];
  supplyChainVendors: SupplyChainVendor[];
  responsePlaybooks: AttackSurfacePlaybook[];
}

export function getAttackSurfacePage() {
  return getJson<AttackSurfaceResponse>('/sentra/pages/attack-surface');
}

// AI Swarm Defense
export interface SwarmDefenseAgent {
  id: string;
  name: string;
  role: 'detector' | 'analyzer' | 'disruptor' | 'coordinator';
  status: 'active' | 'engaged' | 'standby' | 'deploying';
  load: number;
  threatsBlocked: number;
  region: string;
}

export interface SwarmPattern {
  id: string;
  name: string;
  type: 'coordinated_scan' | 'distributed_brute' | 'ai_probe' | 'botnet_swarm' | 'apt_multi_vector';
  agentCount: number;
  confidence: number;
  status: 'active' | 'mitigated' | 'analyzing';
  firstSeen: string;
  description: string;
}

export interface KillChainDisruption {
  phase: string;
  blocked: number;
  method: string;
  latency: string;
}

export interface AiSwarmDefenseResponse extends ResearchEnvelope {
  defenseAgents: SwarmDefenseAgent[];
  swarmPatterns: SwarmPattern[];
  killChainDisruptions: KillChainDisruption[];
  counterSwarm: {
    activeCounterSwarms: number;
    ipsBlacklisted24h: number;
    autoPlaybooksExecuted: number;
    falsePositiveRate: string;
  };
  metrics: {
    avgDisruptionLatency: string;
  };
}

export function getAiSwarmDefensePage() {
  return getJson<AiSwarmDefenseResponse>('/sentra/pages/ai-swarm-defense');
}

// MITRE ATLAS Overlay
export interface AtlasTactic {
  id: string;
  name: string;
  techniques: number;
  subTechniques: number;
  covered: number;
  detections: number;
}

export interface AgenticVector {
  id: string;
  technique: string;
  atlasId: string;
  description: string;
  severity: 'critical' | 'high' | 'medium';
  detections: number;
  status: 'covered' | 'partial' | 'gap';
}

export interface AtlasCaseStudy {
  id: string;
  title: string;
  source: string;
  techniques: string[];
  impact: string;
  date: string;
}

export interface MitreAtlasResponse extends ResearchEnvelope {
  atlasTactics: AtlasTactic[];
  agenticVectors: AgenticVector[];
  caseStudies: AtlasCaseStudy[];
}

export function getMitreAtlasPage() {
  return getJson<MitreAtlasResponse>('/sentra/pages/mitre-atlas');
}

// Weaponized Intel Feed
export interface AptCampaign {
  id: string;
  name: string;
  alias: string[];
  nationState: string;
  status: 'active' | 'dormant' | 'emerging';
  targetSectors: string[];
  ttps: string[];
  lastActivity: string;
  description: string;
  confidence: number;
}

export interface RansomwareTrend {
  id: string;
  group: string;
  medianDemand: number;
  avgPayment: number;
  victims30d: number;
  trend: 'up' | 'down' | 'stable';
  sector: string;
}

export interface SocialEngineeringDetection {
  id: string;
  type: 'phishing' | 'vishing' | 'deepfake' | 'sms_phishing';
  method: string;
  detected: number;
  blocked: number;
  aiGenerated: boolean;
  description: string;
}

export interface WeaponizedIntelResponse extends ResearchEnvelope {
  aptCampaigns: AptCampaign[];
  ransomwareTrends: RansomwareTrend[];
  socialEngineeringDetections: SocialEngineeringDetection[];
  metrics: {
    medianRansomDemand: string;
    medianRansomYoyChange: string;
    deepfakeAttacks30d: number;
    deepfakeBlockRate: string;
  };
}

export function getWeaponizedIntelPage() {
  return getJson<WeaponizedIntelResponse>('/sentra/pages/weaponized-intel');
}

// ─── Threat Feeds ──────────────────────────────────────────────────────────

export interface FeedHealth {
  feedId: string;
  displayName: string;
  source: string;
  lastFetched: string | null;
  freshness: 'live' | 'cached' | 'stale' | 'error';
  latencyMs: number;
  recordCount: number;
  cacheAgeMs: number;
  ttlMs: number;
  error?: string;
}

export interface FeedHealthResponse {
  feeds: FeedHealth[];
  asOf: string;
}

export interface DailyBriefResponse {
  date: string;
  headline: string;
  recentKev: Record<string, unknown>[];
  topCves: Record<string, unknown>[];
  topPulses: Record<string, unknown>[];
  threatLevel: 'elevated' | 'moderate' | 'low';
  asOf: string;
}

export function getThreatFeedHealth() {
  return getJson<FeedHealthResponse>('/sentra/threat-feeds/health');
}

export function getDailyBrief() {
  return getJson<DailyBriefResponse>('/sentra/threat-feeds/daily-brief');
}

export function getKevFeed() {
  return getJson<{ vulnerabilities: Record<string, unknown>[]; count: number; source: string; asOf: string }>('/sentra/threat-feeds/kev');
}

export function getNvdFeed() {
  return getJson<{ vulnerabilities: Record<string, unknown>[]; count: number; source: string; asOf: string }>('/sentra/threat-feeds/nvd');
}

export function getEpssScores(cveIds?: string[]) {
  const qs = cveIds && cveIds.length > 0 ? `?cve=${cveIds.join(',')}` : '';
  return getJson<{ scores: Record<string, unknown>[]; source: string; asOf: string }>(`/sentra/threat-feeds/epss${qs}`);
}

// ─── ML Scoring ────────────────────────────────────────────────────────────

export interface AssetRiskScore {
  assetId: string;
  p30dCompromise: number;
  riskLabel: 'critical' | 'high' | 'medium' | 'low';
  factors: Record<string, number>;
  modelVersion: string;
  scoredAt: string;
  confidenceInterval: { lower: number; upper: number };
}

export interface IdentityBlastRadiusForecast {
  identityId: string;
  p7dLateralPath: number;
  estimatedBlastRadius: number;
  highRiskTargets: string[];
  forecastHorizonDays: 7;
  nextLikelyPivots: Array<{ system: string; probability: number; technique: string }>;
  modelVersion: string;
  scoredAt: string;
  monteCarloIterations: number;
}

export interface MLModelInfo {
  modelId: string;
  displayName: string;
  version: string;
  status: string;
  description: string;
  accuracy: number;
  driftStatus: string;
  inferenceEndpoint: string;
  lastUpdated: string;
}

export function getMLModelRegistry() {
  return getJson<{ models: MLModelInfo[]; asOf: string }>('/sentra/ml/model-registry');
}

export function getMLDriftStatus() {
  return getJson<{ models: Array<{ modelId: string; driftStatus: string; psiScore: number; lastEvaluated: string }>; asOf: string }>('/sentra/ml/drift-status');
}

export async function scoreAssetRiskML(input: {
  assetId: string;
  cvssScore?: number;
  epssScore?: number;
  isKevListed?: boolean;
  assetCriticality?: string;
  internetExposure?: boolean;
}) {
  const token = await ensureCsrf();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['X-CSRF-Token'] = token;
  const resp = await fetch(`${BASE}/sentra/ml/asset-risk`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify(input),
  });
  if (!resp.ok) return null;
  const r = await resp.json();
  return r?.data?.score as AssetRiskScore | null;
}

// ─── A11oy Integration ──────────────────────────────────────────────────────

export interface SentraToolMeta {
  toolId: string;
  displayName: string;
  description: string;
  domain: 'sentra';
  capabilities: string[];
  requiresPCEGate: boolean;
  riskLevel: string;
  isDestructive: boolean;
}

export interface HealthcareTimelineStep {
  step: number;
  timestamp: string;
  event: string;
  detail: string;
  severity: string;
  page: string;
  deepLink: string;
  mlSignal?: Record<string, unknown>;
}

export interface HealthcareCaseStudy {
  id: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  mitreStages: string[];
  timeline: HealthcareTimelineStep[];
  affectedSystems: Record<string, number>;
  businessImpact: Record<string, unknown>;
  a11oyDeepLink: string;
  mlScores: Record<string, unknown>;
  feedSources: string[];
  createdAt: string;
  lastUpdated: string;
}

export function getSentraTools() {
  return getJson<{ tools: SentraToolMeta[]; count: number; domain: string }>('/sentra/a11oy/tools');
}

export function getHealthcareCaseStudy() {
  return getJson<{ caseStudy: HealthcareCaseStudy }>('/sentra/a11oy/case-study/healthcare');
}

export function getPrismEvents(limit = 50) {
  return getJson<{ events: unknown[]; total: number; asOf: string }>(`/sentra/a11oy/prism-events?limit=${limit}`);
}

// ─── SOAR Automation Hub (existing) ─────────────────────────────────────────

// SOAR Automation Hub
export interface PlaybookTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  steps: number;
  integrations: string[];
  uses: number;
  lastUpdated: string;
  copsFormat: boolean;
  status: 'active' | 'draft' | 'archived';
}

export interface XdrSyncItem {
  id: string;
  source: string;
  incidentId: string;
  status: 'synced' | 'pending' | 'conflict';
  direction: 'inbound' | 'outbound';
  lastSync: string;
  severity: string;
}

export interface SoarPipelineStatus {
  id: string;
  playbook: string;
  version: string;
  stage: 'build' | 'test' | 'staging' | 'production';
  status: 'success' | 'running' | 'failed';
  timestamp: string;
}

export interface SoarAutomationResponse extends ResearchEnvelope {
  totalTemplates: number;
  playbookTemplates: PlaybookTemplate[];
  xdrSyncItems: XdrSyncItem[];
  pipelineStatus: SoarPipelineStatus[];
}

export function getSoarAutomationPage() {
  return getJson<SoarAutomationResponse>('/sentra/pages/soar-automation');
}

// ─── SIGIL Composition ─────────────────────────────────────────────────────

export interface SigilReport {
  sigma: number;
  axes: { provenance: number; containment: number; coherence: number; convergence: number };
  weights: Record<string, { value: number; rendered: string }>;
  proof: { weightsExact: boolean; minAxis: number; maxAxis: number; formula: string; law: string };
}

export async function composeSigil(axes: {
  provenance: number;
  containment: number;
  coherence: number;
  convergence: number;
}): Promise<SigilReport | null> {
  try {
    const res = await fetch(`${BASE}/sigil/compose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ axes }),
    });
    if (!res.ok) return null;
    return (await res.json()) as SigilReport;
  } catch {
    return null;
  }
}

// ─── Convergence Pulse ─────────────────────────────────────────────────────

export interface ConvergencePulse {
  timestamp: string;
  lambda: number;
  coherence: number;
  driftDetected: boolean;
  activeTenants: number;
}

export function getConvergencePulse() {
  return getJson<ConvergencePulse>('/ouroboros/a11oy/pulse');
}
