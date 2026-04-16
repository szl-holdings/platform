import { createLogger } from "./logger.js";

const logger = createLogger("tool-registry:registry");

export type ToolApprovalClass = "auto" | "review" | "admin_only" | "never";

export interface ToolParameter {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required: boolean;
  enum?: unknown[];
  defaultValue?: unknown;
  schema?: Record<string, unknown>;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  domain?: string;
  parameters: ToolParameter[];
  returns?: { type: string; description: string };
  approvalClass: ToolApprovalClass;
  allowedTiers: string[];
  sideEffects: boolean;
  idempotent: boolean;
  costEstimateUsd?: number;
  rateLimitPerMinute?: number;
  timeoutMs?: number;
  tags: string[];
  enabled: boolean;
  mcpExposed: boolean;
  handler?: ToolHandler;
  createdAt: string;
  updatedAt: string;
}

export type ToolHandler = (params: Record<string, unknown>, context: ToolContext) => Promise<ToolResult>;

export interface ToolContext {
  callerId: string;
  callerTier?: string;
  orgId?: string;
  traceId?: string;
  dryRun?: boolean;
  isAdmin?: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: unknown;
  error?: string;
  auditEntry?: string;
  costUsd?: number;
  latencyMs?: number;
}

export interface ToolLookup {
  id?: string;
  name?: string;
  category?: string;
  domain?: string;
  tags?: string[];
  approvalClass?: ToolApprovalClass;
  tier?: string;
  mcpOnly?: boolean;
}

class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  register(tool: Omit<ToolDefinition, "createdAt" | "updatedAt">): ToolDefinition {
    if (this.tools.has(tool.id)) {
      throw new Error(`Tool '${tool.id}' already registered — use update() to modify`);
    }
    const now = new Date().toISOString();
    const full: ToolDefinition = { ...tool, createdAt: now, updatedAt: now };
    this.tools.set(tool.id, full);
    logger.info({ id: tool.id, category: tool.category, approvalClass: tool.approvalClass }, "Tool registered");
    return full;
  }

  update(id: string, updates: Partial<Omit<ToolDefinition, "id" | "createdAt">>): ToolDefinition {
    const existing = this.tools.get(id);
    if (!existing) throw new Error(`Tool '${id}' not found`);
    const updated = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
    this.tools.set(id, updated);
    return updated;
  }

  unregister(id: string): boolean {
    return this.tools.delete(id);
  }

  get(id: string): ToolDefinition | undefined {
    return this.tools.get(id);
  }

  getByName(name: string): ToolDefinition | undefined {
    return Array.from(this.tools.values()).find(t => t.name === name);
  }

  list(filters: ToolLookup = {}): ToolDefinition[] {
    let results = Array.from(this.tools.values()).filter(t => t.enabled);
    if (filters.id) results = results.filter(t => t.id === filters.id);
    if (filters.name) results = results.filter(t => t.name === filters.name);
    if (filters.category) results = results.filter(t => t.category === filters.category);
    if (filters.domain) results = results.filter(t => t.domain === filters.domain);
    if (filters.approvalClass) results = results.filter(t => t.approvalClass === filters.approvalClass);
    if (filters.tier) results = results.filter(t => t.allowedTiers.includes("*") || t.allowedTiers.includes(filters.tier!));
    if (filters.mcpOnly) results = results.filter(t => t.mcpExposed);
    if (filters.tags?.length) results = results.filter(t => filters.tags!.some(tag => t.tags.includes(tag)));
    return results;
  }

  checkPolicy(id: string, tier?: string): { allowed: boolean; requiresApproval: boolean; reason?: string } {
    const tool = this.tools.get(id);
    if (!tool) return { allowed: false, requiresApproval: false, reason: "Tool not found" };
    if (!tool.enabled) return { allowed: false, requiresApproval: false, reason: "Tool is disabled" };
    if (tool.approvalClass === "never") return { allowed: false, requiresApproval: false, reason: "Tool is blocked by policy" };

    const hasTierRestrictions = !tool.allowedTiers.includes("*");
    if (hasTierRestrictions) {
      if (tier === undefined) {
        return { allowed: false, requiresApproval: false, reason: "Caller tier required — tool has tier restrictions" };
      }
      if (!tool.allowedTiers.includes(tier)) {
        return { allowed: false, requiresApproval: false, reason: `Tool not allowed for tier '${tier}'` };
      }
    }

    return {
      allowed: true,
      requiresApproval: tool.approvalClass === "review" || tool.approvalClass === "admin_only",
    };
  }

  getMcpSchema(): Array<{ name: string; description: string; inputSchema: Record<string, unknown> }> {
    return this.list({ mcpOnly: true }).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: {
        type: "object",
        properties: Object.fromEntries(
          tool.parameters.map(p => [p.name, { type: p.type, description: p.description, ...(p.enum ? { enum: p.enum } : {}) }]),
        ),
        required: tool.parameters.filter(p => p.required).map(p => p.name),
      },
    }));
  }

  summary(): { total: number; enabled: number; mcpExposed: number; byCategory: Record<string, number>; byApprovalClass: Record<string, number> } {
    const all = Array.from(this.tools.values());
    const byCategory: Record<string, number> = {};
    const byApprovalClass: Record<string, number> = {};
    for (const t of all) {
      byCategory[t.category] = (byCategory[t.category] ?? 0) + 1;
      byApprovalClass[t.approvalClass] = (byApprovalClass[t.approvalClass] ?? 0) + 1;
    }
    return {
      total: all.length,
      enabled: all.filter(t => t.enabled).length,
      mcpExposed: all.filter(t => t.mcpExposed).length,
      byCategory,
      byApprovalClass,
    };
  }
}

export const toolRegistry = new ToolRegistry();
export { ToolRegistry };

export interface ToolCallPolicyResult {
  blocked: boolean;
  reason?: string;
  requiresApproval: boolean;
  approvalClass?: ToolApprovalClass;
}

export function enforceToolCallPolicy(
  toolId: string,
  context: ToolContext,
): ToolCallPolicyResult {
  const tool = toolRegistry.get(toolId);
  if (!tool) {
    return { blocked: true, reason: "Tool not found", requiresApproval: false };
  }

  const policy = toolRegistry.checkPolicy(toolId, context.callerTier);
  if (!policy.allowed) {
    return { blocked: true, reason: policy.reason, requiresApproval: false };
  }

  if (policy.requiresApproval && !context.dryRun) {
    if (tool.approvalClass === "admin_only" && !context.isAdmin) {
      return {
        blocked: true,
        reason: `Tool '${tool.name}' requires admin identity (class: admin_only)`,
        requiresApproval: true,
        approvalClass: tool.approvalClass,
      };
    }
    if (tool.approvalClass === "review") {
      return {
        blocked: true,
        reason: `Tool '${tool.name}' requires human review before execution — submit for approval first`,
        requiresApproval: true,
        approvalClass: tool.approvalClass,
      };
    }
  }

  return { blocked: false, requiresApproval: policy.requiresApproval, approvalClass: tool.approvalClass };
}
