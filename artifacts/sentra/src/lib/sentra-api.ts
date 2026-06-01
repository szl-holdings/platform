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

// ── Threat Hunt ─────────────────────────────────────────────────────────────

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
