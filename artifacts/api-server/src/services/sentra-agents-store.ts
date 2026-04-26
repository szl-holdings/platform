import { randomUUID } from 'node:crypto';

export type AgentStatus = 'healthy' | 'stale' | 'isolated' | 'uninstalled';
export type AgentOS = 'linux' | 'windows' | 'macos';

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

export interface AgentAuditEntry {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  detail?: string;
}

export interface EnrollmentToken {
  token: string;
  tenantId: string;
  tags: string[];
  createdAt: string;
  expiresAt: string;
  usedByAgentId?: string;
}

// In-memory stores

export const agentsStore: Map<string, Agent> = new Map();
export const enrollmentTokensStore: Map<string, EnrollmentToken> = new Map();

export function generateEnrollmentToken(tenantId: string, tags: string[]): EnrollmentToken {
  const token: EnrollmentToken = {
    token: randomUUID().replace(/-/g, ''),
    tenantId,
    tags,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  };
  enrollmentTokensStore.set(token.token, token);
  return token;
}

const STALE_THRESHOLD_MS = 5 * 60_000; // 5 minutes

export function markStaleAgents(): void {
  const now = Date.now();
  for (const agent of agentsStore.values()) {
    if (agent.status !== 'healthy') continue;
    if (!agent.lastHeartbeatAt) continue;
    const last = new Date(agent.lastHeartbeatAt).getTime();
    if (now - last > STALE_THRESHOLD_MS) {
      agent.status = 'stale';
      agent.updatedAt = new Date().toISOString();
    }
  }
}

// Run stale check every minute
let staleInterval: ReturnType<typeof setInterval> | null = null;
export function startStaleAgentMonitor(): void {
  if (staleInterval) return;
  staleInterval = setInterval(markStaleAgents, 60_000);
}
