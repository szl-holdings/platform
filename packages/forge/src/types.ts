import { z } from 'zod';

export const RunStatusSchema = z.enum([
  'pending',
  'running',
  'paused',
  'awaiting-approval',
  'completed',
  'failed',
  'rolled-back',
]);

export const RunConfigSchema = z.object({
  runId: z.string(),
  workflowId: z.string(),
  agentId: z.string().optional(),
  sessionId: z.string().optional(),
  model: z.string().optional(),
  promptVersion: z.string().optional(),
  policyTier: z.string().optional(),
  maxSteps: z.number().int().positive().default(50),
  timeoutMs: z.number().positive().default(300000),
  checkpointEnabled: z.boolean().default(true),
  metadata: z.record(z.unknown()).default({}),
});

export const RunStateSchema = z.object({
  runId: z.string(),
  workflowId: z.string(),
  status: RunStatusSchema.default('pending'),
  currentStep: z.number().int().default(0),
  checkpointId: z.string().optional(),
  traceId: z.string().optional(),
  startedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  output: z.unknown().optional(),
  error: z.string().optional(),
  ledgerEntries: z.array(z.string()).default([]),
});

export type RunStatus = z.infer<typeof RunStatusSchema>;
export type RunConfig = z.infer<typeof RunConfigSchema>;
export type RunState = z.infer<typeof RunStateSchema>;

export interface WorkflowStep {
  id: string;
  name: string;
  execute(context: StepContext): Promise<StepResult>;
}

export interface StepContext {
  runId: string;
  workflowId: string;
  stepIndex: number;
  previousResults: StepResult[];
  metadata: Record<string, unknown>;
}

export interface StepResult {
  stepId: string;
  success: boolean;
  output?: unknown;
  error?: string;
  latencyMs?: number;
}

export interface ApprovalGate {
  requestApproval(params: {
    runId: string;
    workflowId: string;
    agentId?: string;
    stepId: string;
    stepIndex: number;
    reason: string;
    requiredApprovers: string[];
    matchedRuleId?: string;
    tier?: string;
    orgId?: number | string | null;
    requestedById?: number | string | null;
    requestedByRole?: string;
    context: Record<string, unknown>;
  }): Promise<
    { approvalId?: number | string; status: 'pending' | 'approved' | 'rejected' } | undefined
  >;
}

export interface ModelRouterOptions {
  task?: string;
  latencyBudgetMs?: number;
  maxCostUsd?: number;
  preferredModel?: string;
}

export interface ModelRouter {
  selectModel(opts: ModelRouterOptions): string;
}

export interface ActionLedgerWriter {
  record(entry: LedgerEntry): void;
  getEntries(runId: string): LedgerEntry[];
}

export interface LedgerEntry {
  entryId: string;
  runId: string;
  stepId?: string;
  type:
    | 'tool-call'
    | 'approval'
    | 'checkpoint'
    | 'rollback'
    | 'model-selection'
    | 'workflow-start'
    | 'workflow-end';
  description: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}
