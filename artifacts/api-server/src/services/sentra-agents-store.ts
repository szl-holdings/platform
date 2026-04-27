import { randomBytes, randomUUID } from 'node:crypto';

export type AgentStatus = 'healthy' | 'stale' | 'isolated' | 'uninstalled';
export type AgentOS = 'linux' | 'windows' | 'macos';
export type CommandKind = 'isolate' | 'release' | 'uninstall';
export type CommandStatus = 'pending' | 'dispatched' | 'acked' | 'failed';

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
  /** Set when a token is issued for an existing agent (e.g. rotate-token). Enables pre-exchange invalidation. */
  issuedForAgentId?: string;
}

export interface AgentBearerToken {
  token: string;
  agentId: string;
  createdAt: string;
}

export interface AgentCommand {
  id: string;
  agentId: string;
  kind: CommandKind;
  actor: string;
  reason?: string;
  status: CommandStatus;
  createdAt: string;
  dispatchedAt?: string;
  ackedAt?: string;
  output?: string;
}

// In-memory stores

export const agentsStore: Map<string, Agent> = new Map();
export const enrollmentTokensStore: Map<string, EnrollmentToken> = new Map();
export const agentBearerStore: Map<string, AgentBearerToken> = new Map(); // token → bearer record
export const commandsStore: Map<string, AgentCommand> = new Map();

// ── Enrollment token ─────────────────────────────────────────────────────────

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

/** Remove the enrollment token from the store so it cannot be replayed. */
export function consumeEnrollmentToken(token: string): void {
  enrollmentTokensStore.delete(token);
}

/** Remove all enrollment tokens that were issued for a specific agent (e.g. prior rotations not yet exchanged). */
export function invalidateEnrollmentTokensByAgent(agentId: string): void {
  for (const [tok, record] of enrollmentTokensStore.entries()) {
    if (record.issuedForAgentId === agentId) {
      enrollmentTokensStore.delete(tok);
    }
  }
}

// ── Agent bearer tokens ──────────────────────────────────────────────────────

export function issueAgentBearer(agentId: string): AgentBearerToken {
  const record: AgentBearerToken = {
    token: `agt_${randomBytes(24).toString('hex')}`,
    agentId,
    createdAt: new Date().toISOString(),
  };
  agentBearerStore.set(record.token, record);
  return record;
}

export function lookupAgentBearer(token: string): AgentBearerToken | undefined {
  return agentBearerStore.get(token);
}

export function revokeAgentBearersByAgent(agentId: string): void {
  for (const [tok, rec] of agentBearerStore.entries()) {
    if (rec.agentId === agentId) agentBearerStore.delete(tok);
  }
}

// ── Command queue ────────────────────────────────────────────────────────────

export function enqueueCommand(
  agentId: string,
  kind: CommandKind,
  actor: string,
  reason?: string,
): AgentCommand {
  const cmd: AgentCommand = {
    id: randomUUID(),
    agentId,
    kind,
    actor,
    reason,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  commandsStore.set(cmd.id, cmd);
  return cmd;
}

export function getCommand(commandId: string): AgentCommand | null {
  return commandsStore.get(commandId) ?? null;
}

export function getNextPendingCommand(agentId: string): AgentCommand | null {
  for (const cmd of commandsStore.values()) {
    if (cmd.agentId === agentId && cmd.status === 'pending') {
      cmd.status = 'dispatched';
      cmd.dispatchedAt = new Date().toISOString();
      commandsStore.set(cmd.id, cmd);
      return cmd;
    }
  }
  return null;
}

export function ackCommand(
  commandId: string,
  success: boolean,
  output?: string,
): AgentCommand | null {
  const cmd = commandsStore.get(commandId);
  if (!cmd) return null;
  cmd.status = success ? 'acked' : 'failed';
  cmd.ackedAt = new Date().toISOString();
  cmd.output = output;
  commandsStore.set(cmd.id, cmd);

  if (success) {
    const agent = agentsStore.get(cmd.agentId);
    if (agent) {
      const now = new Date().toISOString();
      if (cmd.kind === 'isolate') agent.status = 'isolated';
      else if (cmd.kind === 'release') agent.status = 'healthy';
      else if (cmd.kind === 'uninstall') agent.status = 'uninstalled';
      agent.updatedAt = now;
      agent.auditTrail.unshift({
        id: randomUUID(),
        action: `${cmd.kind}-acked`,
        actor: cmd.actor,
        timestamp: now,
        detail: output ?? `Command ${cmd.kind} acknowledged`,
      });
      agentsStore.set(agent.id, agent);
    }
  }
  return cmd;
}

// ── Stale monitor ────────────────────────────────────────────────────────────

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

let staleInterval: ReturnType<typeof setInterval> | null = null;
export function startStaleAgentMonitor(): void {
  if (staleInterval) return;
  staleInterval = setInterval(markStaleAgents, 60_000);
}
