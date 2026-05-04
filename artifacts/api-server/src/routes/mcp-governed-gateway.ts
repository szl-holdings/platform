import { type IRouter, type NextFunction, type Request, type Response, Router } from 'express';
import { randomUUID, createHash } from 'node:crypto';
import { logActivity } from '@szl-holdings/audit';
import {
  db,
  mcpGatewayApiKeysTable,
  mcpGatewayToolCallsTable,
  mcpGatewayProofPacketsTable,
  mcpGatewayApprovalsTable,
} from '@szl-holdings/db';
import { eq, and, desc } from 'drizzle-orm';
import { logger } from '../lib/logger';
import { authMiddleware } from '../middlewares/auth';
import {
  classifyRisk,
  evaluatePolicies,
  type RiskClass,
} from '../a11oy/runtime/governance/pce-gate';
import { executeToolForGateway } from './mcp';

const router: IRouter = Router();

type GatewayRiskLevel = 'low' | 'medium' | 'high' | 'critical';
type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';
type ConnectionStatus = 'active' | 'idle' | 'disconnected';

interface GatewayApiKey {
  id: string;
  keyHash: string;
  prefix: string;
  label: string;
  tenantId: string;
  scopes: string[];
  rateLimit: number;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

interface ExternalConnection {
  connectionId: string;
  agentName: string;
  agentType: 'claude-desktop' | 'cursor' | 'vscode-copilot' | 'codex' | 'generic';
  apiKeyId: string;
  tenantId: string;
  connectedAt: string;
  lastActivityAt: string;
  status: ConnectionStatus;
  toolCallCount: number;
  approvedCount: number;
  rejectedCount: number;
  proofPacketCount: number;
}

interface GatewayToolCall {
  callId: string;
  connectionId: string;
  tenantId: string;
  agentName: string;
  toolName: string;
  parameters: Record<string, unknown>;
  riskLevel: GatewayRiskLevel;
  riskClasses: RiskClass[];
  disposition: 'allowed' | 'blocked' | 'pending_approval' | 'rate_limited';
  approvalId: string | null;
  proofPacketId: string | null;
  resultHash: string | null;
  latencyMs: number;
  timestamp: string;
}

interface GatewayApproval {
  approvalId: string;
  callId: string;
  connectionId: string;
  agentName: string;
  toolName: string;
  parameters: Record<string, unknown>;
  riskLevel: GatewayRiskLevel;
  riskClasses: RiskClass[];
  requiredTier: string;
  status: ApprovalStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  proofPacketId: string | null;
  createdAt: string;
}

interface GatewayProofPacket {
  packetId: string;
  callId: string;
  connectionId: string;
  tenantId: string;
  agentName: string;
  toolName: string;
  riskLevel: GatewayRiskLevel;
  disposition: string;
  callerIdentity: string;
  parametersHash: string;
  resultHash: string | null;
  previousHash: string | null;
  hash: string;
  witnessedBy: string[];
  issuedAt: string;
}

interface RateLimitEntry {
  apiKeyId: string;
  label: string;
  tenantId: string;
  windowStart: number;
  callCount: number;
  limit: number;
  remaining: number;
  resetAt: string;
}

const apiKeys = new Map<string, GatewayApiKey>();
const connections = new Map<string, ExternalConnection>();
const toolCalls: GatewayToolCall[] = [];
const approvals = new Map<string, GatewayApproval>();
const proofPackets: GatewayProofPacket[] = [];
const rateLimitWindows = new Map<string, { windowStart: number; count: number }>();

const RATE_LIMIT_WINDOW_MS = 60_000;

async function persistApiKey(key: GatewayApiKey): Promise<void> {
  try {
    await db.insert(mcpGatewayApiKeysTable).values({
      keyId: key.id,
      label: key.label,
      keyHash: key.keyHash,
      prefix: key.prefix,
      tenantId: key.tenantId,
      scopes: key.scopes,
      rateLimit: key.rateLimit,
      revoked: !!key.revokedAt,
      revokedAt: key.revokedAt ? new Date(key.revokedAt) : null,
      lastUsedAt: key.lastUsedAt ? new Date(key.lastUsedAt) : null,
    }).onConflictDoNothing();
  } catch (e) { logger.debug({ err: e }, 'gateway: persistApiKey failed (non-fatal)'); }
}

async function persistToolCall(call: GatewayToolCall): Promise<void> {
  try {
    await db.insert(mcpGatewayToolCallsTable).values({
      callId: call.callId,
      connectionId: call.connectionId,
      tenantId: call.tenantId,
      agentName: call.agentName,
      toolName: call.toolName,
      parameters: call.parameters,
      riskLevel: call.riskLevel,
      riskClasses: call.riskClasses,
      disposition: call.disposition,
      approvalId: call.approvalId,
      proofPacketId: call.proofPacketId,
      resultHash: call.resultHash,
      latencyMs: call.latencyMs,
    }).onConflictDoNothing();
  } catch (e) { logger.debug({ err: e }, 'gateway: persistToolCall failed (non-fatal)'); }
}

async function persistProofPacket(packet: GatewayProofPacket): Promise<void> {
  try {
    await db.insert(mcpGatewayProofPacketsTable).values({
      packetId: packet.packetId,
      callId: packet.callId,
      tenantId: packet.tenantId,
      connectionId: packet.connectionId,
      agentName: packet.agentName,
      toolName: packet.toolName,
      disposition: packet.disposition,
      riskLevel: packet.riskLevel,
      callerIdentity: packet.callerIdentity,
      parametersHash: packet.parametersHash,
      resultHash: packet.resultHash,
      previousHash: packet.previousHash,
      proofHash: packet.hash,
      witnessedBy: packet.witnessedBy,
      attestedAt: packet.issuedAt,
    }).onConflictDoNothing();
  } catch (e) { logger.debug({ err: e }, 'gateway: persistProofPacket failed (non-fatal)'); }
}

async function persistApproval(approval: GatewayApproval, tenantId?: string): Promise<void> {
  try {
    const resolvedTenant = tenantId
      ?? toolCalls.find(c => c.callId === approval.callId)?.tenantId
      ?? 'unknown';
    await db.insert(mcpGatewayApprovalsTable).values({
      approvalId: approval.approvalId,
      callId: approval.callId,
      tenantId: resolvedTenant,
      connectionId: approval.connectionId,
      agentName: approval.agentName,
      toolName: approval.toolName,
      parameters: approval.parameters,
      riskLevel: approval.riskLevel,
      riskClasses: approval.riskClasses,
      requiredTier: approval.requiredTier,
      status: approval.status,
      reviewedBy: approval.reviewedBy,
      reviewedAt: approval.reviewedAt ? new Date(approval.reviewedAt) : null,
      reviewNote: approval.reviewNote,
      proofPacketId: approval.proofPacketId,
    }).onConflictDoUpdate({
      target: mcpGatewayApprovalsTable.approvalId,
      set: {
        status: approval.status,
        reviewedBy: approval.reviewedBy,
        reviewedAt: approval.reviewedAt ? new Date(approval.reviewedAt) : null,
        reviewNote: approval.reviewNote,
        proofPacketId: approval.proofPacketId,
      },
    });
  } catch (e) { logger.debug({ err: e }, 'gateway: persistApproval failed (non-fatal)'); }
}

async function persistToolCallUpdate(call: GatewayToolCall): Promise<void> {
  try {
    await db.update(mcpGatewayToolCallsTable)
      .set({
        disposition: call.disposition,
        proofPacketId: call.proofPacketId,
        resultHash: call.resultHash,
      })
      .where(eq(mcpGatewayToolCallsTable.callId, call.callId));
  } catch (e) { logger.debug({ err: e }, 'gateway: persistToolCallUpdate failed (non-fatal)'); }
}

async function persistApiKeyLastUsed(keyId: string): Promise<void> {
  try {
    await db.update(mcpGatewayApiKeysTable)
      .set({ lastUsedAt: new Date() })
      .where(eq(mcpGatewayApiKeysTable.keyId, keyId));
  } catch (e) { logger.debug({ err: e }, 'gateway: persistApiKeyLastUsed failed (non-fatal)'); }
}

async function hydrateFromDb(): Promise<void> {
  try {
    const dbKeys = await db.select().from(mcpGatewayApiKeysTable);
    for (const row of dbKeys) {
      apiKeys.set(row.keyId, {
        id: row.keyId,
        keyHash: row.keyHash,
        prefix: row.prefix,
        label: row.label,
        tenantId: row.tenantId,
        scopes: row.scopes,
        rateLimit: row.rateLimit,
        createdAt: row.createdAt.toISOString(),
        lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
        revokedAt: row.revokedAt?.toISOString() ?? null,
      });
    }

    const dbCalls = await db.select().from(mcpGatewayToolCallsTable).orderBy(desc(mcpGatewayToolCallsTable.createdAt));
    for (const row of dbCalls) {
      toolCalls.push({
        callId: row.callId,
        connectionId: row.connectionId,
        tenantId: row.tenantId,
        agentName: row.agentName,
        toolName: row.toolName,
        parameters: (row.parameters ?? {}) as Record<string, unknown>,
        riskLevel: row.riskLevel as GatewayRiskLevel,
        riskClasses: row.riskClasses as RiskClass[],
        disposition: row.disposition as GatewayToolCall['disposition'],
        approvalId: row.approvalId,
        proofPacketId: row.proofPacketId,
        resultHash: row.resultHash,
        latencyMs: row.latencyMs,
        timestamp: row.createdAt.toISOString(),
      });
    }

    const dbApprovals = await db.select().from(mcpGatewayApprovalsTable);
    for (const row of dbApprovals) {
      approvals.set(row.approvalId, {
        approvalId: row.approvalId,
        callId: row.callId,
        connectionId: row.connectionId,
        agentName: row.agentName,
        toolName: row.toolName,
        parameters: (row.parameters ?? {}) as Record<string, unknown>,
        riskLevel: row.riskLevel as GatewayRiskLevel,
        riskClasses: (row.riskClasses ?? []) as RiskClass[],
        requiredTier: row.requiredTier,
        status: row.status as ApprovalStatus,
        reviewedBy: row.reviewedBy,
        reviewedAt: row.reviewedAt?.toISOString() ?? null,
        reviewNote: row.reviewNote,
        proofPacketId: row.proofPacketId,
        createdAt: row.createdAt.toISOString(),
      });
    }

    const dbProofs = await db.select().from(mcpGatewayProofPacketsTable).orderBy(desc(mcpGatewayProofPacketsTable.createdAt));
    for (const row of dbProofs) {
      proofPackets.push({
        packetId: row.packetId,
        callId: row.callId,
        connectionId: row.connectionId,
        tenantId: row.tenantId,
        agentName: row.agentName,
        toolName: row.toolName,
        riskLevel: row.riskLevel as GatewayRiskLevel,
        disposition: row.disposition,
        callerIdentity: row.callerIdentity,
        parametersHash: row.parametersHash,
        resultHash: row.resultHash,
        previousHash: row.previousHash,
        hash: row.proofHash,
        witnessedBy: row.witnessedBy,
        issuedAt: row.attestedAt,
      });
    }

    logger.info(
      { keyCount: dbKeys.length, callCount: dbCalls.length, approvalCount: dbApprovals.length, proofCount: dbProofs.length },
      'gateway: hydrated all entities from DB',
    );
  } catch (e) {
    logger.warn({ err: e }, 'gateway: DB hydration failed, using in-memory only');
  }
}

hydrateFromDb().catch(() => {});

function extractBearerKey(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim() || null;
  }
  return null;
}

export function validateGatewayApiKey(rawKey: string): GatewayApiKey | null {
  const keyHash = createHash('sha256').update(rawKey).digest('hex');
  return [...apiKeys.values()].find(k => k.keyHash === keyHash && !k.revokedAt) ?? null;
}

export function gatewayApiKeyGate(req: Request, res: Response, next: NextFunction): void {
  const bearerKey = extractBearerKey(req);
  if (!bearerKey) {
    next();
    return;
  }
  req.gatewayKeyPresented = true;
  const matchedKey = validateGatewayApiKey(bearerKey);
  if (!matchedKey) {
    res.status(401).json({ error: 'Invalid or revoked gateway API key' });
    return;
  }
  const rl = checkRateLimit(matchedKey.id, matchedKey.rateLimit);
  if (!rl.allowed) {
    const rateLimitedCall: GatewayToolCall = {
      callId: `gc-call-${randomUUID().slice(0, 8)}`,
      connectionId: 'rate-limited',
      tenantId: matchedKey.tenantId,
      agentName: req.headers['x-agent-name'] as string ?? 'unknown',
      toolName: 'mcp-transport',
      parameters: {},
      riskLevel: 'low',
      riskClasses: [],
      disposition: 'rate_limited',
      approvalId: null,
      proofPacketId: null,
      resultHash: null,
      latencyMs: 0,
      timestamp: new Date().toISOString(),
    };
    const rateLimitProof = generateGatewayProof(rateLimitedCall, {
      connectionId: 'rate-limited',
      agentName: rateLimitedCall.agentName,
      agentType: 'generic',
      apiKeyId: matchedKey.id,
      tenantId: matchedKey.tenantId,
      connectedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      status: 'active',
      toolCallCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      proofPacketCount: 0,
    });
    rateLimitedCall.proofPacketId = rateLimitProof.packetId;
    toolCalls.push(rateLimitedCall);
    persistToolCall(rateLimitedCall).catch(() => {});
    res.status(429).json({
      error: 'Rate limit exceeded',
      remaining: rl.remaining,
      resetAt: new Date(rl.resetAt).toISOString(),
    });
    return;
  }
  matchedKey.lastUsedAt = new Date().toISOString();
  persistApiKeyLastUsed(matchedKey.id).catch(() => {});
  req.gatewayApiKey = matchedKey;

  let existingConn = [...connections.values()].find(
    c => c.apiKeyId === matchedKey.id && c.status !== 'disconnected',
  );
  if (!existingConn) {
    existingConn = {
      connectionId: `gc-auto-${randomUUID().slice(0, 8)}`,
      agentName: req.headers['x-agent-name'] as string ?? matchedKey.label,
      agentType: detectAgentType(req.headers['user-agent'] ?? ''),
      apiKeyId: matchedKey.id,
      tenantId: matchedKey.tenantId,
      connectedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      status: 'active',
      toolCallCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      proofPacketCount: 0,
    };
    connections.set(existingConn.connectionId, existingConn);
  }
  existingConn.lastActivityAt = new Date().toISOString();
  req.gatewayConnection = existingConn;

  next();
}

function detectAgentType(userAgent: string): ExternalConnection['agentType'] {
  const ua = userAgent.toLowerCase();
  if (ua.includes('claude') || ua.includes('anthropic')) return 'claude-desktop';
  if (ua.includes('cursor')) return 'cursor';
  if (ua.includes('vscode') || ua.includes('visual studio')) return 'vscode-copilot';
  if (ua.includes('codex') || ua.includes('openai')) return 'codex';
  return 'generic';
}

declare global {
  namespace Express {
    interface Request {
      gatewayApiKey?: GatewayApiKey;
      gatewayConnection?: ExternalConnection;
      gatewayKeyPresented?: boolean;
    }
  }
}

export function requireAuthOrGatewayKey(req: Request, res: Response, next: NextFunction): void {
  if (req.gatewayApiKey) {
    next();
    return;
  }
  if (req.user) {
    next();
    return;
  }
  res.status(401).json({
    error: 'Authentication required — provide a gateway API key via Authorization: Bearer header, or authenticate via session',
  });
}

export async function recordGatewayMcpCall(
  connection: ExternalConnection,
  apiKey: GatewayApiKey,
  toolName: string,
  parameters: Record<string, unknown>,
): Promise<{ disposition: string; proofPacketId: string; approvalId: string | null }> {
  const riskLevel = classifyToolRisk(toolName);
  const riskClasses = classifyRisk({
    riskLevel,
    isDestructive: isDestructiveAction(toolName),
    vertical: 'operational',
  });
  const policyEval = evaluatePolicies({
    actionId: `gw-${randomUUID().slice(0, 8)}`,
    riskClasses,
    vertical: 'operational',
    riskLevel,
  });
  const needsApproval = riskLevel === 'medium' || riskLevel === 'high' || riskLevel === 'critical';
  if (!apiKey.scopes.includes('tools:execute')) {
    const blockedCall: GatewayToolCall = {
      callId: `gc-call-${randomUUID().slice(0, 8)}`,
      connectionId: connection.connectionId,
      tenantId: connection.tenantId,
      agentName: connection.agentName,
      toolName,
      parameters,
      riskLevel,
      riskClasses,
      disposition: 'blocked',
      approvalId: null,
      proofPacketId: null,
      resultHash: null,
      latencyMs: 0,
      timestamp: new Date().toISOString(),
    };
    const blockedProof = generateGatewayProof(blockedCall, connection);
    blockedCall.proofPacketId = blockedProof.packetId;
    toolCalls.push(blockedCall);
    persistToolCall(blockedCall).catch(() => {});
    return { disposition: 'blocked', proofPacketId: blockedProof.packetId, approvalId: null };
  }

  const call: GatewayToolCall = {
    callId: `gc-call-${randomUUID().slice(0, 8)}`,
    connectionId: connection.connectionId,
    tenantId: connection.tenantId,
    agentName: connection.agentName,
    toolName,
    parameters,
    riskLevel,
    riskClasses,
    disposition: needsApproval ? 'pending_approval' : 'allowed',
    approvalId: null,
    proofPacketId: null,
    resultHash: null,
    latencyMs: 0,
    timestamp: new Date().toISOString(),
  };

  if (needsApproval) {
    const approval: GatewayApproval = {
      approvalId: `gw-apr-${randomUUID().slice(0, 8)}`,
      callId: call.callId,
      connectionId: call.connectionId,
      agentName: call.agentName,
      toolName: call.toolName,
      parameters: call.parameters,
      riskLevel: call.riskLevel,
      riskClasses: call.riskClasses,
      requiredTier: policyEval.approvalTier ?? (riskLevel === 'critical' ? 'executive' : 'operator'),
      status: 'pending',
      reviewedBy: null,
      reviewedAt: null,
      reviewNote: null,
      proofPacketId: null,
      createdAt: call.timestamp,
    };
    call.approvalId = approval.approvalId;
    approvals.set(approval.approvalId, approval);
    persistApproval(approval, connection.tenantId).catch(() => {});
  }

  connection.toolCallCount++;
  const proof = generateGatewayProof(call, connection);
  call.proofPacketId = proof.packetId;
  connection.proofPacketCount++;
  toolCalls.push(call);
  persistToolCall(call).catch(() => {});

  return {
    disposition: call.disposition,
    proofPacketId: proof.packetId,
    approvalId: call.approvalId,
  };
}

export function recordGatewayLifecycleEvent(
  connection: ExternalConnection,
  eventType: 'connect' | 'discover' | 'disconnect',
): { proofPacketId: string } {
  const call: GatewayToolCall = {
    callId: `gc-evt-${randomUUID().slice(0, 8)}`,
    connectionId: connection.connectionId,
    tenantId: connection.tenantId,
    agentName: connection.agentName,
    toolName: `mcp.${eventType}`,
    parameters: { eventType },
    riskLevel: 'low',
    riskClasses: [],
    disposition: 'allowed',
    approvalId: null,
    proofPacketId: null,
    resultHash: createHash('sha256').update(`${eventType}-${connection.connectionId}-${Date.now()}`).digest('hex').slice(0, 16),
    latencyMs: 0,
    timestamp: new Date().toISOString(),
  };
  const proof = generateGatewayProof(call, connection);
  call.proofPacketId = proof.packetId;
  connection.proofPacketCount++;
  toolCalls.push(call);
  persistToolCall(call).catch(() => {});
  logger.info({ connectionId: connection.connectionId, eventType, proofPacketId: proof.packetId }, '[mcp-governed-gateway] Lifecycle event recorded');
  return { proofPacketId: proof.packetId };
}

const TOOL_RISK_MAP: Record<string, GatewayRiskLevel> = {
  'knowledge.search': 'low',
  'knowledge.graph_query': 'low',
  'knowledge.rerank': 'low',
  'workcell.inspect': 'low',
  'signal_mesh.query': 'low',
  'proof.verify': 'low',
  'covenant.check': 'low',
  'postgres.query': 'low',
  'postgres.schema': 'low',
  'postgres.tables': 'low',
  'postgres.explain': 'low',
  'github.search_code': 'low',
  'github.list_issues': 'low',
  'github.get_file': 'low',
  'memory.recall': 'low',
  'vessels_fleet_status': 'low',
  'vessels_weather_risk': 'low',
  'firestorm_threat_scan': 'low',
  'firestorm_compliance_check': 'low',
  'terra_property_search': 'low',
  'terra_market_signals': 'low',
  'lyte_health_check': 'low',
  'lyte_executive_summary': 'low',
  'alloy_skill_list': 'low',
  'alloy_decision_status': 'low',
  'alloy_workflow_status': 'low',
  'connector_hub_discover': 'low',
  'connector_hub_health': 'low',
  'hf_search_models': 'low',
  'hf_search_datasets': 'low',
  'observability_get_trace': 'low',
  'observability_query_metrics': 'low',
  'workcell.create': 'medium',
  'knowledge.ingest': 'medium',
  'memory.store': 'medium',
  'memory.consolidate': 'medium',
  'github.create_pr': 'medium',
  'slack.send_message': 'medium',
  'alloy_launch_workflow': 'medium',
  'alloy_create_artifact': 'medium',
  'alloy_research': 'medium',
  'alloy_skill_invoke': 'medium',
  'connector_hub_execute': 'medium',
  'proof.create': 'medium',
  'workcell.replay': 'high',
  'memory.forget': 'high',
  'alloy_approve_decision': 'high',
  'covenant.lift': 'critical',
};

function classifyToolRisk(toolName: string): GatewayRiskLevel {
  return TOOL_RISK_MAP[toolName] ?? 'medium';
}

function isDestructiveAction(toolName: string): boolean {
  return ['memory.forget', 'covenant.lift'].includes(toolName);
}

function hashString(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 16);
}

function checkRateLimit(
  apiKeyId: string,
  limit: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitWindows.get(apiKeyId);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitWindows.set(apiKeyId, { windowStart: now, count: 1 });
    return { allowed: true, remaining: limit - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }
  entry.count++;
  const remaining = Math.max(0, limit - entry.count);
  return { allowed: entry.count <= limit, remaining, resetAt: entry.windowStart + RATE_LIMIT_WINDOW_MS };
}

function generateGatewayProof(
  call: GatewayToolCall,
  connection: ExternalConnection,
): GatewayProofPacket {
  const previousPacket = proofPackets[proofPackets.length - 1];
  const previousHash = previousPacket?.hash ?? null;
  const parametersHash = createHash('sha256').update(JSON.stringify(call.parameters)).digest('hex');
  const payload = Buffer.concat([
    Buffer.from(call.callId, 'utf8'),
    Buffer.from(connection.connectionId, 'utf8'),
    Buffer.from(call.toolName, 'utf8'),
    Buffer.from(call.riskLevel, 'utf8'),
    Buffer.from(call.disposition, 'utf8'),
    Buffer.from(call.timestamp, 'utf8'),
    Buffer.from(parametersHash, 'utf8'),
    Buffer.from(call.resultHash ?? 'null', 'utf8'),
    Buffer.from(call.approvalId ?? 'none', 'utf8'),
  ]);
  const hash = createHash('sha256')
    .update(payload)
    .update(previousHash ?? 'genesis')
    .digest('hex');
  const packet: GatewayProofPacket = {
    packetId: `gw-pp-${randomUUID().slice(0, 8)}`,
    callId: call.callId,
    connectionId: connection.connectionId,
    tenantId: connection.tenantId,
    agentName: connection.agentName,
    toolName: call.toolName,
    riskLevel: call.riskLevel,
    disposition: call.disposition,
    callerIdentity: `${connection.agentType}:${connection.apiKeyId}`,
    parametersHash: parametersHash,
    resultHash: call.resultHash,
    previousHash,
    hash: `sha256:${hash}`,
    witnessedBy: ['mcp-governed-gateway', 'pce-gate', 'covenant-engine'],
    issuedAt: new Date().toISOString(),
  };
  proofPackets.push(packet);
  persistProofPacket(packet).catch(() => {});
  writeProofToAuditLedger(packet, connection.tenantId).catch(() => {});
  return packet;
}

async function writeProofToAuditLedger(packet: GatewayProofPacket, tenantId: string): Promise<void> {
  try {
    await logActivity({
      userId: null,
      action: 'gateway_proof_packet',
      resource: 'mcp_governed_gateway',
      resourceId: packet.packetId,
      description: `Gateway proof: ${packet.toolName} [${packet.riskLevel}/${packet.disposition}] by ${packet.agentName}`,
      metadata: {
        packetId: packet.packetId,
        callId: packet.callId,
        connectionId: packet.connectionId,
        toolName: packet.toolName,
        riskLevel: packet.riskLevel,
        disposition: packet.disposition,
        callerIdentity: packet.callerIdentity,
        parametersHash: packet.parametersHash,
        resultHash: packet.resultHash,
        previousHash: packet.previousHash,
        hash: packet.hash,
        witnessedBy: packet.witnessedBy,
        tenantId,
      },
    });
  } catch (err) {
    logger.warn({ err, packetId: packet.packetId }, '[mcp-governed-gateway] Failed to write proof to audit ledger');
  }
}

function resolveTenantId(req: Request): string | null {
  if (req.gatewayApiKey) return req.gatewayApiKey.tenantId;
  const orgs = req.user?.orgs;
  if (orgs && orgs.length > 0) return String(orgs[0]!.orgId);
  return null;
}

function filterByTenant<T extends { tenantId?: string }>(items: T[], tenantId: string | null): T[] {
  if (!tenantId) return items;
  return items.filter(i => i.tenantId === tenantId);
}

export function getToolGovernanceMetadata(toolName: string): {
  riskLevel: GatewayRiskLevel;
  approvalRequired: boolean;
  approvalTier: string | null;
  isDestructive: boolean;
} {
  const riskLevel = classifyToolRisk(toolName);
  const needsApproval = riskLevel === 'medium' || riskLevel === 'high' || riskLevel === 'critical';
  return {
    riskLevel,
    approvalRequired: needsApproval,
    approvalTier: needsApproval
      ? (riskLevel === 'critical' ? 'executive' : 'operator')
      : null,
    isDestructive: isDestructiveAction(toolName),
  };
}

function seedDemoData(): void {
  const demoKeys: GatewayApiKey[] = [
    {
      id: 'gk-alpha',
      keyHash: createHash('sha256').update('szl_gw_alpha_demo').digest('hex'),
      prefix: 'szl_gw_alph',
      label: 'Engineering Team — Claude Desktop',
      tenantId: 'meridian-prime',
      scopes: ['tools:read', 'tools:execute', 'resources:read'],
      rateLimit: 120,
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      lastUsedAt: new Date(Date.now() - 180000).toISOString(),
      revokedAt: null,
    },
    {
      id: 'gk-bravo',
      keyHash: createHash('sha256').update('szl_gw_bravo_demo').digest('hex'),
      prefix: 'szl_gw_brav',
      label: 'Security Ops — Cursor',
      tenantId: 'meridian-prime',
      scopes: ['tools:read', 'tools:execute'],
      rateLimit: 60,
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      lastUsedAt: new Date(Date.now() - 600000).toISOString(),
      revokedAt: null,
    },
    {
      id: 'gk-charlie',
      keyHash: createHash('sha256').update('szl_gw_charlie_demo').digest('hex'),
      prefix: 'szl_gw_char',
      label: 'Research Team — VS Code Copilot',
      tenantId: 'meridian-prime',
      scopes: ['tools:read', 'resources:read'],
      rateLimit: 200,
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      lastUsedAt: new Date(Date.now() - 3600000).toISOString(),
      revokedAt: null,
    },
  ];
  for (const k of demoKeys) apiKeys.set(k.id, k);

  const demoConnections: ExternalConnection[] = [
    {
      connectionId: 'gc-001',
      agentName: 'Claude Desktop (Engineering)',
      agentType: 'claude-desktop',
      apiKeyId: 'gk-alpha',
      tenantId: 'meridian-prime',
      connectedAt: new Date(Date.now() - 7200000).toISOString(),
      lastActivityAt: new Date(Date.now() - 180000).toISOString(),
      status: 'active',
      toolCallCount: 47,
      approvedCount: 12,
      rejectedCount: 1,
      proofPacketCount: 47,
    },
    {
      connectionId: 'gc-002',
      agentName: 'Cursor (Security Ops)',
      agentType: 'cursor',
      apiKeyId: 'gk-bravo',
      tenantId: 'meridian-prime',
      connectedAt: new Date(Date.now() - 3600000).toISOString(),
      lastActivityAt: new Date(Date.now() - 600000).toISOString(),
      status: 'active',
      toolCallCount: 23,
      approvedCount: 5,
      rejectedCount: 0,
      proofPacketCount: 23,
    },
    {
      connectionId: 'gc-003',
      agentName: 'VS Code Copilot (Research)',
      agentType: 'vscode-copilot',
      apiKeyId: 'gk-charlie',
      tenantId: 'meridian-prime',
      connectedAt: new Date(Date.now() - 14400000).toISOString(),
      lastActivityAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'idle',
      toolCallCount: 89,
      approvedCount: 18,
      rejectedCount: 2,
      proofPacketCount: 89,
    },
  ];
  for (const c of demoConnections) connections.set(c.connectionId, c);

  const toolNames = [
    'knowledge.search', 'signal_mesh.query', 'workcell.inspect', 'postgres.query',
    'alloy_launch_workflow', 'knowledge.ingest', 'memory.store', 'github.create_pr',
    'workcell.create', 'alloy_approve_decision', 'memory.forget', 'proof.verify',
    'covenant.check', 'alloy_skill_invoke', 'vessels_fleet_status', 'firestorm_threat_scan',
  ];
  const connIds = ['gc-001', 'gc-002', 'gc-003'];
  const agentNames = ['Claude Desktop (Engineering)', 'Cursor (Security Ops)', 'VS Code Copilot (Research)'];

  for (let i = 0; i < 36; i++) {
    const connIdx = i % 3;
    const toolName = toolNames[i % toolNames.length]!;
    const riskLevel = classifyToolRisk(toolName);
    const riskClasses = classifyRisk({
      riskLevel,
      isDestructive: isDestructiveAction(toolName),
      vertical: 'operational',
    });
    const needsApproval = riskLevel === 'medium' || riskLevel === 'high' || riskLevel === 'critical';
    const disposition = needsApproval && i % 5 === 0 ? 'pending_approval' as const : 'allowed' as const;

    const call: GatewayToolCall = {
      callId: `gc-call-${randomUUID().slice(0, 8)}`,
      connectionId: connIds[connIdx]!,
      tenantId: 'szl-demo',
      agentName: agentNames[connIdx]!,
      toolName,
      parameters: { query: `demo-param-${i}` },
      riskLevel,
      riskClasses,
      disposition,
      approvalId: null,
      proofPacketId: null,
      resultHash: disposition === 'allowed'
        ? createHash('sha256').update(`result-${i}`).digest('hex').slice(0, 16)
        : null,
      latencyMs: Math.round(20 + Math.random() * 400),
      timestamp: new Date(Date.now() - (36 - i) * 120000).toISOString(),
    };

    if (needsApproval) {
      const approval: GatewayApproval = {
        approvalId: `gw-apr-${randomUUID().slice(0, 8)}`,
        callId: call.callId,
        connectionId: call.connectionId,
        agentName: call.agentName,
        toolName: call.toolName,
        parameters: call.parameters,
        riskLevel: call.riskLevel,
        riskClasses: call.riskClasses,
        requiredTier: riskLevel === 'critical' ? 'executive' : 'operator',
        status: disposition === 'pending_approval' ? 'pending' : 'approved',
        reviewedBy: disposition === 'pending_approval' ? null : 'ops-admin',
        reviewedAt: disposition === 'pending_approval'
          ? null
          : new Date(Date.now() - (36 - i) * 60000).toISOString(),
        reviewNote: disposition === 'pending_approval'
          ? null
          : 'Reviewed and approved via Gateway Monitor',
        proofPacketId: null,
        createdAt: call.timestamp,
      };
      call.approvalId = approval.approvalId;
      approvals.set(approval.approvalId, approval);
    }

    const conn = connections.get(call.connectionId)!;
    const proof = generateGatewayProof(call, conn);
    call.proofPacketId = proof.packetId;
    toolCalls.push(call);
  }
}

if (process.env.NODE_ENV !== 'production') {
  seedDemoData();
}

router.get('/stats', authMiddleware(), (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const tenantConns = filterByTenant([...connections.values()], tenantId);
  const tenantCalls = toolCalls.filter(c => !tenantId || c.tenantId === tenantId);
  const activeConnections = tenantConns.filter(c => c.status === 'active').length;
  const totalCalls = tenantCalls.length;
  const pendingApprovals = [...approvals.values()].filter(a => {
    const call = toolCalls.find(tc => tc.callId === a.callId);
    return a.status === 'pending' && (!tenantId || call?.tenantId === tenantId);
  }).length;
  const riskBreakdown = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const c of tenantCalls) riskBreakdown[c.riskLevel]++;
  const dispositionBreakdown = { allowed: 0, blocked: 0, pending_approval: 0, rate_limited: 0 };
  for (const c of tenantCalls) dispositionBreakdown[c.disposition]++;
  const avgLatency = totalCalls > 0
    ? Math.round(tenantCalls.reduce((s, c) => s + c.latencyMs, 0) / totalCalls)
    : 0;
  res.json({
    activeConnections,
    totalConnections: tenantConns.length,
    totalCalls,
    pendingApprovals,
    totalProofs: proofPackets.filter(p => !tenantId || p.tenantId === tenantId).length,
    totalKeys: [...apiKeys.values()].filter(k => !k.revokedAt && (!tenantId || k.tenantId === tenantId)).length,
    riskBreakdown,
    dispositionBreakdown,
    avgLatencyMs: avgLatency,
    governanceMode: 'enforced',
    protocolVersion: '2025-11-25',
    tenantId,
  });
});

router.get('/connections', authMiddleware(), (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const list = filterByTenant([...connections.values()], tenantId).sort(
    (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime(),
  );
  res.json({ connections: list, total: list.length });
});

router.get('/audit-log', authMiddleware(), (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const limit = Math.min(parseInt(String(req.query.limit) || '50', 10), 200);
  const riskFilter = req.query.risk as string | undefined;
  const dispositionFilter = req.query.disposition as string | undefined;
  let filtered = toolCalls.filter(c => !tenantId || c.tenantId === tenantId);
  if (riskFilter) filtered = filtered.filter(c => c.riskLevel === riskFilter);
  if (dispositionFilter) filtered = filtered.filter(c => c.disposition === dispositionFilter);
  const result = filtered.slice(-limit).reverse();
  res.json({ calls: result, total: filtered.length, returned: result.length });
});

router.get('/approvals', authMiddleware(), (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const statusFilter = req.query.status as string | undefined;
  let list = [...approvals.values()].filter(a => {
    const call = toolCalls.find(tc => tc.callId === a.callId);
    return !tenantId || call?.tenantId === tenantId;
  });
  if (statusFilter) list = list.filter(a => a.status === statusFilter);
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({
    approvals: list,
    total: list.length,
    pending: list.filter(a => a.status === 'pending').length,
  });
});

router.post('/approvals/:id/approve', authMiddleware(), async (req: Request, res: Response) => {
  const approval = approvals.get(req.params.id!);
  if (!approval) return res.status(404).json({ error: 'Approval not found' });
  if (approval.status !== 'pending') return res.status(409).json({ error: `Approval already ${approval.status}` });
  const callerTenant = resolveTenantId(req);
  const call = toolCalls.find(c => c.callId === approval.callId);
  if (callerTenant && call && call.tenantId !== callerTenant) {
    return res.status(403).json({ error: 'Cannot approve resources outside your tenant' });
  }
  approval.reviewedBy = req.user?.email ?? 'operator';
  approval.reviewedAt = new Date().toISOString();
  approval.reviewNote = req.body?.note ?? null;
  let executionResult: unknown = null;
  let executionError: string | undefined;
  if (call) {
    try {
      const execOutcome = await executeToolForGateway(call.toolName, call.parameters);
      executionResult = execOutcome.result;
      executionError = execOutcome.error;
    } catch (err) {
      executionError = String(err);
    }
    const executionSucceeded = !executionError;
    approval.status = 'approved';
    call.disposition = executionSucceeded ? 'allowed' : 'execution_failed';
    call.resultHash = createHash('sha256')
      .update(JSON.stringify(executionResult ?? { error: executionError }))
      .digest('hex')
      .slice(0, 16);
    const conn = connections.get(call.connectionId);
    if (conn) {
      conn.approvedCount++;
      const executionProof = generateGatewayProof(call, conn);
      call.proofPacketId = executionProof.packetId;
      approval.proofPacketId = executionProof.packetId;
    }
    persistToolCallUpdate(call).catch(() => {});
  } else {
    approval.status = 'approved';
  }
  persistApproval(approval).catch(() => {});
  const httpStatus = executionError ? 502 : 200;
  logger.info({ approvalId: approval.approvalId, toolName: approval.toolName, hasError: !!executionError, disposition: call?.disposition }, '[mcp-governed-gateway] Approval granted, deferred execution completed');
  res.status(httpStatus).json({
    approval,
    execution: call ? {
      callId: call.callId,
      disposition: call.disposition,
      resultHash: call.resultHash,
      proofPacketId: call.proofPacketId,
      executedAt: approval.reviewedAt,
      result: executionResult,
      error: executionError,
    } : null,
  });
});

router.post('/approvals/:id/reject', authMiddleware(), (req: Request, res: Response) => {
  const approval = approvals.get(req.params.id!);
  if (!approval) return res.status(404).json({ error: 'Approval not found' });
  if (approval.status !== 'pending') return res.status(409).json({ error: `Approval already ${approval.status}` });
  const callerTenant = resolveTenantId(req);
  const call = toolCalls.find(c => c.callId === approval.callId);
  if (callerTenant && call && call.tenantId !== callerTenant) {
    return res.status(403).json({ error: 'Cannot reject resources outside your tenant' });
  }
  approval.status = 'rejected';
  approval.reviewedBy = req.user?.email ?? 'operator';
  approval.reviewedAt = new Date().toISOString();
  approval.reviewNote = req.body?.note ?? req.body?.reason ?? null;
  if (call) {
    call.disposition = 'blocked';
    const conn = connections.get(call.connectionId);
    if (conn) {
      conn.rejectedCount++;
      const proof = generateGatewayProof(call, conn);
      call.proofPacketId = proof.packetId;
      approval.proofPacketId = proof.packetId;
    }
    persistToolCallUpdate(call).catch(() => {});
  }
  persistApproval(approval).catch(() => {});
  logger.info({ approvalId: approval.approvalId, toolName: approval.toolName }, '[mcp-governed-gateway] Approval rejected');
  res.json({ approval });
});

router.get('/proof-chain', authMiddleware(), (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const limit = Math.min(parseInt(String(req.query.limit) || '50', 10), 200);
  const filtered = proofPackets.filter(p => !tenantId || p.tenantId === tenantId);
  const result = filtered.slice(-limit).reverse();
  res.json({ packets: result, total: filtered.length, returned: result.length });
});

router.get('/rate-limits', authMiddleware(), (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const now = Date.now();
  const limits: RateLimitEntry[] = [];
  for (const key of apiKeys.values()) {
    if (key.revokedAt) continue;
    if (tenantId && key.tenantId !== tenantId) continue;
    const window = rateLimitWindows.get(key.id);
    const windowActive = window && (now - window.windowStart) < RATE_LIMIT_WINDOW_MS;
    const callCount = windowActive ? window!.count : 0;
    limits.push({
      apiKeyId: key.id,
      label: key.label,
      tenantId: key.tenantId,
      windowStart: windowActive ? window!.windowStart : now,
      callCount,
      limit: key.rateLimit,
      remaining: Math.max(0, key.rateLimit - callCount),
      resetAt: new Date((windowActive ? window!.windowStart : now) + RATE_LIMIT_WINDOW_MS).toISOString(),
    });
  }
  res.json({ rateLimits: limits });
});

router.get('/api-keys', authMiddleware(), (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const keys = [...apiKeys.values()]
    .filter(k => !tenantId || k.tenantId === tenantId)
    .map(k => ({
      id: k.id,
      prefix: k.prefix,
      label: k.label,
      tenantId: k.tenantId,
      scopes: k.scopes,
      rateLimit: k.rateLimit,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
      revoked: !!k.revokedAt,
    }));
  res.json({ keys, total: keys.length });
});

router.post('/api-keys', authMiddleware(), (req: Request, res: Response) => {
  const callerTenant = resolveTenantId(req);
  const { label, tenantId, scopes, rateLimit } = req.body ?? {};
  if (!label || typeof label !== 'string') return res.status(400).json({ error: 'label is required' });
  const effectiveTenant = callerTenant ?? tenantId ?? 'default';
  if (callerTenant && tenantId && tenantId !== callerTenant) {
    return res.status(403).json({ error: 'Cannot create API keys for a different tenant' });
  }
  const rawKey = `szl_gw_${randomUUID().replace(/-/g, '').slice(0, 24)}`;
  const key: GatewayApiKey = {
    id: `gk-${randomUUID().slice(0, 8)}`,
    keyHash: createHash('sha256').update(rawKey).digest('hex'),
    prefix: rawKey.slice(0, 12),
    label,
    tenantId: effectiveTenant,
    scopes: Array.isArray(scopes) ? scopes : ['tools:read', 'tools:execute'],
    rateLimit: typeof rateLimit === 'number' ? rateLimit : 120,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    revokedAt: null,
  };
  apiKeys.set(key.id, key);
  persistApiKey(key).catch(() => {});
  logger.info({ keyId: key.id, label }, '[mcp-governed-gateway] API key created');
  res.status(201).json({
    id: key.id,
    key: rawKey,
    prefix: key.prefix,
    label: key.label,
    tenantId: key.tenantId,
    scopes: key.scopes,
    rateLimit: key.rateLimit,
    createdAt: key.createdAt,
    warning: 'Store this key securely. It will not be shown again.',
  });
});

router.delete('/api-keys/:id', authMiddleware(), (req: Request, res: Response) => {
  const callerTenant = resolveTenantId(req);
  const key = apiKeys.get(req.params.id!);
  if (!key) return res.status(404).json({ error: 'API key not found' });
  if (callerTenant && key.tenantId !== callerTenant) {
    return res.status(403).json({ error: 'Cannot revoke API keys outside your tenant' });
  }
  if (key.revokedAt) return res.status(409).json({ error: 'Key already revoked' });
  key.revokedAt = new Date().toISOString();
  db.update(mcpGatewayApiKeysTable)
    .set({ revoked: true, revokedAt: new Date(key.revokedAt) })
    .where(eq(mcpGatewayApiKeysTable.keyId, key.id))
    .catch(() => {});
  logger.info({ keyId: key.id, label: key.label }, '[mcp-governed-gateway] API key revoked');
  res.json({ id: key.id, label: key.label, revokedAt: key.revokedAt });
});

router.post('/tool-call', async (req: Request, res: Response) => {
  const start = Date.now();
  const { toolName, parameters, agentName } = req.body ?? {};
  if (!toolName || typeof toolName !== 'string') {
    return res.status(400).json({ error: 'toolName is required' });
  }

  const rawKey = extractBearerKey(req);
  if (!rawKey) {
    return res.status(401).json({
      error: 'API key required via Authorization: Bearer header — generate one via POST /api/mcp-governed-gateway/api-keys',
    });
  }

  const matchedKey = validateGatewayApiKey(rawKey);
  if (!matchedKey) return res.status(401).json({ error: 'Invalid or revoked API key' });

  if (!matchedKey.scopes.includes('tools:execute')) {
    return res.status(403).json({
      error: 'API key does not have tools:execute scope',
      requiredScope: 'tools:execute',
      currentScopes: matchedKey.scopes,
    });
  }

  const rl = checkRateLimit(matchedKey.id, matchedKey.rateLimit);
  if (!rl.allowed) {
    const rateLimitedCall: GatewayToolCall = {
      callId: `gc-call-${randomUUID().slice(0, 8)}`,
      connectionId: 'rate-limited',
      tenantId: matchedKey.tenantId,
      agentName: agentName ?? 'unknown',
      toolName,
      parameters: parameters ?? {},
      riskLevel: classifyToolRisk(toolName),
      riskClasses: [],
      disposition: 'rate_limited',
      approvalId: null,
      proofPacketId: null,
      resultHash: null,
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
    const rateLimitProofConn: ExternalConnection = {
      connectionId: 'rate-limited',
      agentName: rateLimitedCall.agentName,
      agentType: 'generic',
      apiKeyId: matchedKey.id,
      tenantId: matchedKey.tenantId,
      connectedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      status: 'active',
      toolCallCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      proofPacketCount: 0,
    };
    const rateLimitProof = generateGatewayProof(rateLimitedCall, rateLimitProofConn);
    rateLimitedCall.proofPacketId = rateLimitProof.packetId;
    toolCalls.push(rateLimitedCall);
    persistToolCall(rateLimitedCall).catch(() => {});
    return res.status(429).json({
      error: 'Rate limit exceeded',
      remaining: rl.remaining,
      resetAt: new Date(rl.resetAt).toISOString(),
      proofPacketId: rateLimitProof.packetId,
    });
  }
  matchedKey.lastUsedAt = new Date().toISOString();
  persistApiKeyLastUsed(matchedKey.id).catch(() => {});

  const riskLevel = classifyToolRisk(toolName);
  const riskClasses = classifyRisk({
    riskLevel,
    isDestructive: isDestructiveAction(toolName),
    vertical: 'operational',
  });
  const policyEval = evaluatePolicies({
    actionId: `gw-${randomUUID().slice(0, 8)}`,
    riskClasses,
    vertical: 'operational',
    riskLevel,
  });
  const needsApproval = riskLevel === 'medium' || riskLevel === 'high' || riskLevel === 'critical';

  let existingConn = [...connections.values()].find(
    c => c.apiKeyId === matchedKey.id && c.status !== 'disconnected',
  );
  if (!existingConn) {
    existingConn = {
      connectionId: `gc-auto-${randomUUID().slice(0, 8)}`,
      agentName: agentName ?? matchedKey.label,
      agentType: detectAgentType(req.headers['user-agent'] ?? ''),
      apiKeyId: matchedKey.id,
      tenantId: matchedKey.tenantId,
      connectedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      status: 'active',
      toolCallCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      proofPacketCount: 0,
    };
    connections.set(existingConn.connectionId, existingConn);
  }
  existingConn.lastActivityAt = new Date().toISOString();
  existingConn.toolCallCount++;

  const call: GatewayToolCall = {
    callId: `gc-call-${randomUUID().slice(0, 8)}`,
    connectionId: existingConn.connectionId,
    tenantId: existingConn.tenantId,
    agentName: agentName ?? existingConn.agentName,
    toolName,
    parameters: parameters ?? {},
    riskLevel,
    riskClasses,
    disposition: needsApproval ? 'pending_approval' : 'allowed',
    approvalId: null,
    proofPacketId: null,
    resultHash: null,
    latencyMs: 0,
    timestamp: new Date().toISOString(),
  };

  if (needsApproval) {
    const approvalTier = riskLevel === 'critical'
      ? 'executive'
      : riskLevel === 'high'
        ? 'operator'
        : policyEval.approvalTier ?? 'operator';
    const approval: GatewayApproval = {
      approvalId: `gw-apr-${randomUUID().slice(0, 8)}`,
      callId: call.callId,
      connectionId: call.connectionId,
      agentName: call.agentName,
      toolName: call.toolName,
      parameters: call.parameters,
      riskLevel: call.riskLevel,
      riskClasses: call.riskClasses,
      requiredTier: approvalTier,
      status: 'pending',
      reviewedBy: null,
      reviewedAt: null,
      reviewNote: null,
      proofPacketId: null,
      createdAt: call.timestamp,
    };
    call.approvalId = approval.approvalId;
    approvals.set(approval.approvalId, approval);
    persistApproval(approval, existingConn.tenantId).catch(() => {});

    call.latencyMs = Date.now() - start;
    const proof = generateGatewayProof(call, existingConn);
    call.proofPacketId = proof.packetId;
    existingConn.proofPacketCount++;
    toolCalls.push(call);
    persistToolCall(call).catch(() => {});

    res.status(202).json({
      callId: call.callId,
      disposition: call.disposition,
      riskLevel: call.riskLevel,
      riskClasses: call.riskClasses,
      proofPacketId: call.proofPacketId,
      latencyMs: call.latencyMs,
      message: `Tool call queued for ${approvalTier} approval`,
      governance: {
        pceGateApplied: true,
        covenantChecked: true,
        proofGenerated: true,
        approvalRequired: true,
        approvalId: call.approvalId,
        approvalTier,
      },
    });
    return;
  }

  let executionResult: unknown = null;
  let executionError: string | undefined;
  try {
    const execOutcome = await executeToolForGateway(toolName, parameters ?? {});
    executionResult = execOutcome.result;
    executionError = execOutcome.error;
  } catch (err) {
    executionError = String(err);
  }

  call.resultHash = createHash('sha256')
    .update(JSON.stringify(executionResult ?? { error: executionError }))
    .digest('hex')
    .slice(0, 16);
  call.latencyMs = Date.now() - start;
  const proof = generateGatewayProof(call, existingConn);
  call.proofPacketId = proof.packetId;
  existingConn.proofPacketCount++;
  toolCalls.push(call);
  persistToolCall(call).catch(() => {});

  res.status(executionError ? 500 : 200).json({
    callId: call.callId,
    disposition: call.disposition,
    riskLevel: call.riskLevel,
    riskClasses: call.riskClasses,
    proofPacketId: call.proofPacketId,
    latencyMs: call.latencyMs,
    resultHash: call.resultHash,
    result: executionResult,
    error: executionError,
    governance: {
      pceGateApplied: true,
      covenantChecked: true,
      proofGenerated: true,
      approvalRequired: false,
      approvalId: null,
      approvalTier: null,
    },
  });
});

router.get('/connect-instructions', (_req: Request, res: Response) => {
  const devDomain = process.env.REPLIT_DEV_DOMAIN ?? 'your-app.replit.app';
  const baseUrl = `https://${devDomain}`;
  res.json({
    protocolVersion: '2025-11-25',
    transports: ['sse', 'streamable-http'],
    endpoints: {
      sse: `${baseUrl}/api/mcp/sse`,
      streamableHttp: `${baseUrl}/api/mcp`,
      governedToolCall: `${baseUrl}/api/mcp-governed-gateway/tool-call`,
    },
    authentication: {
      type: 'bearer',
      header: 'Authorization',
      format: 'Bearer szl_gw_...',
      note: 'Generate an API key via POST /api/mcp-governed-gateway/api-keys',
    },
    clients: {
      claude_desktop: {
        name: 'Claude Desktop',
        configFile: '~/Library/Application Support/Claude/claude_desktop_config.json',
        config: {
          mcpServers: {
            'szl-governed-gateway': {
              transport: 'sse',
              url: `${baseUrl}/api/mcp/sse`,
              headers: { Authorization: 'Bearer YOUR_API_KEY' },
            },
          },
        },
      },
      cursor: {
        name: 'Cursor',
        configFile: '.cursor/mcp.json',
        config: {
          mcpServers: {
            'szl-governed-gateway': {
              transport: 'sse',
              url: `${baseUrl}/api/mcp/sse`,
              headers: { Authorization: 'Bearer YOUR_API_KEY' },
            },
          },
        },
      },
      vscode: {
        name: 'VS Code (GitHub Copilot)',
        configFile: '.vscode/mcp.json',
        config: {
          servers: {
            'szl-governed-gateway': {
              type: 'sse',
              url: `${baseUrl}/api/mcp/sse`,
              headers: { Authorization: 'Bearer YOUR_API_KEY' },
            },
          },
        },
      },
      codex: {
        name: 'OpenAI Codex CLI',
        note: 'Configure via environment variable or CLI flag',
        command: `OPENAI_MCP_SERVERS='[{"transport":"sse","url":"${baseUrl}/api/mcp/sse","headers":{"Authorization":"Bearer YOUR_API_KEY"}}]' codex`,
      },
    },
  });
});

export default router;
