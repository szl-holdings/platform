import type { GovernedAgentConfig, ProofPacketRecord } from './types.js';
import { TRUST_TIER_THRESHOLDS } from '../types/sovereign-mesh.js';
import { tierMeetsThreshold } from './types.js';
import { createHash } from 'node:crypto';

export class GovernedAgentWrapper {
  private config: GovernedAgentConfig;
  private runCount = 0;
  private totalCostUsd = 0;
  private proofLog: ProofPacketRecord[] = [];
  private tinyAgentInstance: unknown = null;
  private initialized = false;

  constructor(config: GovernedAgentConfig) {
    this.config = config;
  }

  get agentId() { return this.config.agentId; }
  get name() { return this.config.name; }
  get template() { return this.config.template; }
  get proofHistory() { return [...this.proofLog]; }
  get isInitialized() { return this.initialized; }

  async initialize(): Promise<{ ready: boolean; reason?: string }> {
    const tierConfig = TRUST_TIER_THRESHOLDS[this.config.trustTier];
    const allowedToolCount = this.config.fieldConfig.allowedTools.length;

    if (allowedToolCount > tierConfig.maxToolAccess) {
      return {
        ready: false,
        reason: `Agent requests ${allowedToolCount} tools but tier ${this.config.trustTier} allows max ${tierConfig.maxToolAccess}`,
      };
    }

    for (const blocked of this.config.fieldConfig.blockedTools) {
      if (this.config.fieldConfig.allowedTools.includes(blocked)) {
        return { ready: false, reason: `Tool ${blocked} is in both allowed and blocked lists` };
      }
    }

    for (const covenant of this.config.fieldConfig.covenantBindings) {
      if (!covenant.startsWith('policy.')) {
        return { ready: false, reason: `Invalid covenant binding format: ${covenant}` };
      }
    }

    try {
      const mod = await import('@huggingface/tiny-agents');
      const AgentClass = mod.Agent ?? (mod as Record<string, unknown>).default;
      if (AgentClass && typeof AgentClass === 'function') {
        this.tinyAgentInstance = new (AgentClass as new (cfg: unknown) => unknown)({
          provider: 'openai',
          model: this.config.spec.model,
          servers: Object.entries(this.config.spec.mcpServers).map(([name, cfg]) => ({
            name,
            url: cfg.url,
            transport: cfg.transport,
          })),
        });
      }
    } catch {
      // tiny-agents runtime not available — wrapper still functional for governance
    }

    this.initialized = true;
    return { ready: true };
  }

  validateToolAccess(toolId: string): { allowed: boolean; reason?: string } {
    if (this.config.fieldConfig.blockedTools.includes(toolId)) {
      return { allowed: false, reason: `Tool ${toolId} is explicitly blocked for agent ${this.config.agentId}` };
    }

    if (!this.config.fieldConfig.allowedTools.includes(toolId)) {
      return { allowed: false, reason: `Tool ${toolId} is not in allowed tools list for agent ${this.config.agentId}` };
    }

    const tierConfig = TRUST_TIER_THRESHOLDS[this.config.trustTier];
    if (tierConfig.approvalRequired) {
      return { allowed: true, reason: `Tool ${toolId} allowed but requires human approval (tier: ${this.config.trustTier})` };
    }

    return { allowed: true };
  }

  checkCovenantCompliance(requiredCovenants: string[]): { compliant: boolean; missing: string[] } {
    const missing = requiredCovenants.filter(c => !this.config.fieldConfig.covenantBindings.includes(c));
    return { compliant: missing.length === 0, missing };
  }

  async executeGoverned(input: {
    action: string;
    toolCalls: string[];
    payload: Record<string, unknown>;
    approvalGranted?: boolean;
    requiredCovenants?: string[];
  }): Promise<{
    success: boolean;
    blocked: boolean;
    blockReason?: string;
    proofPacket: ProofPacketRecord;
    blockedTools: string[];
    requiresApproval: boolean;
  }> {
    if (!this.initialized) {
      const initResult = await this.initialize();
      if (!initResult.ready) {
        return {
          success: false,
          blocked: true,
          blockReason: `Initialization failed: ${initResult.reason}`,
          proofPacket: this.generateProof(input.action, [], 0, 0),
          blockedTools: input.toolCalls,
          requiresApproval: false,
        };
      }
    }

    if (input.requiredCovenants && input.requiredCovenants.length > 0) {
      const covenantCheck = this.checkCovenantCompliance(input.requiredCovenants);
      if (!covenantCheck.compliant) {
        return {
          success: false,
          blocked: true,
          blockReason: `Covenant compliance failure: missing bindings [${covenantCheck.missing.join(', ')}]`,
          proofPacket: this.generateProof(input.action, [], 0, 0),
          blockedTools: input.toolCalls,
          requiresApproval: false,
        };
      }
    }

    const startTime = Date.now();
    const blockedTools: string[] = [];
    const approvedTools: string[] = [];
    let requiresApproval = false;

    for (const toolId of input.toolCalls) {
      const check = this.validateToolAccess(toolId);
      if (!check.allowed) {
        blockedTools.push(toolId);
      } else {
        approvedTools.push(toolId);
        if (check.reason?.includes('requires human approval')) {
          requiresApproval = true;
        }
      }
    }

    const tierConfig = TRUST_TIER_THRESHOLDS[this.config.trustTier];
    if (tierConfig.approvalRequired && !tierMeetsThreshold(this.config.trustTier, this.config.requiresApprovalAbove)) {
      requiresApproval = true;
    }

    if (requiresApproval && !input.approvalGranted) {
      return {
        success: false,
        blocked: true,
        blockReason: `Execution blocked: trust tier "${this.config.trustTier}" requires human approval before execution`,
        proofPacket: this.generateProof(input.action, [], 0, Date.now() - startTime),
        blockedTools: [],
        requiresApproval: true,
      };
    }

    const costEstimate = approvedTools.length * 0.002;

    if (this.totalCostUsd + costEstimate > this.config.maxCostPerRunUsd * (this.runCount + 1)) {
      return {
        success: false,
        blocked: true,
        blockReason: `Budget exceeded: $${(this.totalCostUsd + costEstimate).toFixed(3)} > limit $${(this.config.maxCostPerRunUsd * (this.runCount + 1)).toFixed(3)}`,
        proofPacket: this.generateProof(input.action, [], costEstimate, Date.now() - startTime),
        blockedTools: input.toolCalls,
        requiresApproval: false,
      };
    }

    this.runCount++;
    this.totalCostUsd += costEstimate;

    const proof = this.generateProof(input.action, approvedTools, costEstimate, Date.now() - startTime);
    this.proofLog.push(proof);
    this.config.onProofGenerated?.(proof);

    return {
      success: blockedTools.length === 0,
      blocked: false,
      proofPacket: proof,
      blockedTools,
      requiresApproval: false,
    };
  }

  private generateProof(action: string, toolsCalled: string[], costUsd: number, latencyMs: number): ProofPacketRecord {
    const inputHash = createHash('sha256').update(JSON.stringify({ action, agent: this.config.agentId })).digest('hex').slice(0, 16);
    const outputHash = createHash('sha256').update(JSON.stringify({ toolsCalled, timestamp: Date.now() })).digest('hex').slice(0, 16);

    return {
      id: `PP-${Date.now().toString(36)}`,
      agentId: this.config.agentId,
      workcellId: null,
      action,
      inputHash: `sha256:${inputHash}`,
      outputHash: `sha256:${outputHash}`,
      toolsCalled,
      covenantsPassed: [...this.config.fieldConfig.covenantBindings],
      costUsd,
      latencyMs,
      timestamp: new Date().toISOString(),
    };
  }

  getStatus() {
    return {
      agentId: this.config.agentId,
      name: this.config.name,
      template: this.config.template,
      trustTier: this.config.trustTier,
      initialized: this.initialized,
      runCount: this.runCount,
      totalCostUsd: this.totalCostUsd,
      proofCount: this.proofLog.length,
      tinyAgentConnected: this.tinyAgentInstance !== null,
      mcpServers: Object.keys(this.config.spec.mcpServers),
      covenantBindings: [...this.config.fieldConfig.covenantBindings],
    };
  }
}
