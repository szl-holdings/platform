export const API_BASE = (() => {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api-server`;
  }
  return "/api-server";
})();

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

// ─── Intelligence Mesh ───────────────────────────────────────────────────────

export async function fetchMeshSignals() {
  return apiFetch("/intelligence-mesh/signals");
}

export async function fetchMeshFeed(params?: {
  limit?: number;
  signalType?: string;
  targetVenture?: string;
  severity?: string;
  after?: string;
  before?: string;
  entity?: string;
}) {
  const url = new URL(`${API_BASE}/intelligence-mesh/feed`);
  if (params?.limit) url.searchParams.set("limit", String(params.limit));
  if (params?.signalType) url.searchParams.set("signalType", params.signalType);
  if (params?.targetVenture) url.searchParams.set("targetVenture", params.targetVenture);
  if (params?.severity) url.searchParams.set("severity", params.severity);
  if (params?.after) url.searchParams.set("after", params.after);
  if (params?.before) url.searchParams.set("before", params.before);
  if (params?.entity) url.searchParams.set("entity", params.entity);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch feed");
  return res.json();
}

export async function fetchCompoundValue() {
  return apiFetch("/intelligence-mesh/compound-value");
}

export async function fetchRoutingRules() {
  return apiFetch("/intelligence-mesh/routing-rules");
}

export async function fetchVentureInbox(ventureId: string) {
  return apiFetch(`/intelligence-mesh/venture-inbox/${ventureId}`);
}

// ─── Nexus Situation Rooms ───────────────────────────────────────────────────

export async function fetchSituationRooms() {
  return apiFetch("/nexus/situation-rooms");
}

export async function createSituationRoom(data: {
  name: string;
  description?: string;
  priority?: string;
  tag?: string;
}) {
  return apiFetch("/nexus/situation-rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateSituationRoom(roomId: string, data: Record<string, unknown>) {
  return apiFetch(`/nexus/situation-rooms/${roomId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function addRoomNote(roomId: string, content: string) {
  return apiFetch(`/nexus/situation-rooms/${roomId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
}

export async function deleteRoomNote(roomId: string, noteId: string) {
  return apiFetch(`/nexus/situation-rooms/${roomId}/notes/${noteId}`, {
    method: "DELETE",
  });
}

// ─── Nexus Entity Canvas ─────────────────────────────────────────────────────

export async function fetchEntities(domain?: string) {
  const url = domain
    ? `/nexus/entities?domain=${encodeURIComponent(domain)}`
    : "/nexus/entities";
  return apiFetch(url);
}

// ─── Nexus Correlations ──────────────────────────────────────────────────────

export async function fetchCorrelations(params?: { riskLevel?: string; domain?: string }) {
  const url = new URL(`${API_BASE}/nexus/correlations`);
  if (params?.riskLevel) url.searchParams.set("riskLevel", params.riskLevel);
  if (params?.domain) url.searchParams.set("domain", params.domain);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch correlations");
  return res.json();
}

// ─── Nexus Command Actions + Proof Chain ─────────────────────────────────────

export async function fetchProofChain(limit?: number) {
  const url = limit ? `/nexus/proof-chain?limit=${limit}` : "/nexus/proof-chain";
  return apiFetch(url);
}

export async function executeCommandAction(data: {
  actionId: string;
  actionType: string;
  targetDomain: string;
  payload?: Record<string, unknown>;
  operator?: string;
  requiresApproval?: boolean;
}) {
  return apiFetch("/nexus/command-actions/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function handoffSituationRoom(
  roomId: string,
  data: {
    assignTo?: string[];
    removeFrom?: string[];
    note?: string;
    escalate?: boolean;
  }
) {
  return apiFetch(`/nexus/situation-rooms/${roomId}/handoff`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateCommandDecision(
  proofId: string,
  decision: "approved" | "rejected",
  status: "approved" | "rejected" | "executed",
  approvalNotes?: string
) {
  return apiFetch(`/nexus/command-actions/${proofId}/decision`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision, status, approvalNotes }),
  });
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface NexusSettings {
  domainToggles: Record<string, boolean>;
  correlationThreshold: number;
  autoRefreshInterval: number;
}

export async function fetchNexusSettings(): Promise<{ config: NexusSettings }> {
  return apiFetch("/nexus/settings");
}

export async function saveNexusSettings(config: Partial<NexusSettings>): Promise<{ config: NexusSettings }> {
  return apiFetch("/nexus/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
}
