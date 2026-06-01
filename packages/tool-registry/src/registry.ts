/**
 * @workspace/tool-registry — Tool Definition Registry
 *
 * A typed catalog of every tool available to Alloy specialists.
 * Each entry declares the tool's ID, display name, owning specialist,
 * input/output shape description, and whether it has side effects.
 *
 * Callers can swap in domain-specific tools at startup via registerTool().
 */
import { z } from 'zod';

// ─── Tool definition ──────────────────────────────────────────────────────────

export const ToolCategorySchema = z.enum([
  'planning',
  'retrieval',
  'document',
  'speech',
  'forecasting',
  'anomaly',
  'policy',
  'approval',
  'execution',
  'read-only',
  'write',
  'delete',
]);
export type ToolCategory = z.infer<typeof ToolCategorySchema>;

export interface ToolDefinition {
  /** Stable, unique identifier (e.g. "planner.createPlan"). */
  id: string;
  /** Human-readable name. */
  displayName: string;
  /** Owning specialist role. */
  specialistId: string;
  /** Functional category (used for reversibility scoring). */
  category: ToolCategory;
  /** Short description of what the tool does. */
  description: string;
  /** Whether the tool produces side effects in external systems. */
  hasSideEffects: boolean;
  /** Whether the tool requires explicit approval before calling. */
  requiresApproval: boolean;
  /** Estimated cost per call in USD (0 = free). */
  estimatedCostUsd: number;
  /** Version of the tool definition. */
  version: string;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

const _registry = new Map<string, ToolDefinition>();

export function registerTool(tool: ToolDefinition): void {
  _registry.set(tool.id, tool);
}

export function getTool(id: string): ToolDefinition | undefined {
  return _registry.get(id);
}

export function listTools(filter?: { specialistId?: string; category?: ToolCategory }): ToolDefinition[] {
  let all = Array.from(_registry.values());
  if (filter?.specialistId) all = all.filter((t) => t.specialistId === filter.specialistId);
  if (filter?.category) all = all.filter((t) => t.category === filter.category);
  return all.sort((a, b) => a.id.localeCompare(b.id));
}

export function unregisterTool(id: string): boolean {
  return _registry.delete(id);
}

// ─── Built-in tool definitions (aligned with specialist roster) ───────────────

const BUILT_IN_TOOLS: ToolDefinition[] = [
  {
    id: 'planner.createPlan',
    displayName: 'Create Mission Plan',
    specialistId: 'planner',
    category: 'planning',
    description: 'Decomposes an objective into a routed, risk-estimated plan graph.',
    hasSideEffects: false,
    requiresApproval: false,
    estimatedCostUsd: 0,
    version: '1.0.0',
  },
  {
    id: 'planner.replayPlan',
    displayName: 'Replay Plan',
    specialistId: 'planner',
    category: 'planning',
    description: 'Re-executes a stored plan with updated context.',
    hasSideEffects: false,
    requiresApproval: false,
    estimatedCostUsd: 0,
    version: '1.0.0',
  },
  {
    id: 'policy-guard.evaluate',
    displayName: 'Evaluate Policy',
    specialistId: 'policy-evaluator',
    category: 'policy',
    description: 'Evaluates an action request against active policy rules.',
    hasSideEffects: false,
    requiresApproval: false,
    estimatedCostUsd: 0,
    version: '1.0.0',
  },
  {
    id: 'approvals-inbox.route',
    displayName: 'Route for Approval',
    specialistId: 'approval-router',
    category: 'approval',
    description: 'Routes a pending action to the appropriate human approver.',
    hasSideEffects: true,
    requiresApproval: false,
    estimatedCostUsd: 0,
    version: '1.0.0',
  },
  {
    id: 'retrieval.search',
    displayName: 'Vector Search',
    specialistId: 'retrieval',
    category: 'retrieval',
    description: 'Searches the knowledge store for relevant context. (Phase 4)',
    hasSideEffects: false,
    requiresApproval: false,
    estimatedCostUsd: 0.001,
    version: '0.0.1-stub',
  },
  {
    id: 'document.extract',
    displayName: 'Document Extraction',
    specialistId: 'document',
    category: 'document',
    description: 'Extracts structured data from documents. (Phase 3)',
    hasSideEffects: false,
    requiresApproval: false,
    estimatedCostUsd: 0.002,
    version: '0.0.1-stub',
  },
  {
    id: 'speech.transcribe',
    displayName: 'Transcribe Audio',
    specialistId: 'speech',
    category: 'speech',
    description: 'Converts audio input to structured text. (Phase 3)',
    hasSideEffects: false,
    requiresApproval: false,
    estimatedCostUsd: 0.006,
    version: '0.0.1-stub',
  },
  {
    id: 'forecasting.project',
    displayName: 'Generate Forecast',
    specialistId: 'forecasting',
    category: 'forecasting',
    description: 'Runs a time-series forecast for a given metric. (Phase 5)',
    hasSideEffects: false,
    requiresApproval: false,
    estimatedCostUsd: 0,
    version: '0.0.1-stub',
  },
  {
    id: 'anomaly.scan',
    displayName: 'Anomaly Scan',
    specialistId: 'anomaly',
    category: 'anomaly',
    description: 'Detects statistical anomalies in a signal stream. (Phase 5)',
    hasSideEffects: false,
    requiresApproval: false,
    estimatedCostUsd: 0,
    version: '0.0.1-stub',
  },
];

for (const tool of BUILT_IN_TOOLS) {
  registerTool(tool);
}
