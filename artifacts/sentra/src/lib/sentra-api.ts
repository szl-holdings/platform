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

// ── Incidents ──────────────────────────────────────────────────────────────
// Backend uses sendSuccess(res, payload) without meta → response body IS the
// payload directly (no { data } wrapper). Client reads the body as-is.

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
