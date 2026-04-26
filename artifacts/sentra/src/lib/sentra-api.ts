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
  enrollmentToken: string;
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
