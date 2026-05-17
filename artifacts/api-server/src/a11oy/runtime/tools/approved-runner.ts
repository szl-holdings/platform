import { getTool, executeToolMock, type ToolResult } from './registry.js';
import { runPCEGate } from '../governance/pce-gate.js';
import type { MirrorEvalResult } from '../types.js';

export interface ApprovedRunOpts {
  toolId: string;
  input: Record<string, unknown>;
  actionId: string;
  vertical: string;
  riskLevel?: string;
  /** Optional continuous risk score in [0, 1] from the calling domain
   * wrapper. Forwarded to runPCEGate so PCE classification and policy
   * escalation use the numeric score rather than the coarse riskLevel band. */
  riskScore?: number;
  originSignalIds?: string[];
  approvalRecordId?: string;
  mirrorEvalResult?: MirrorEvalResult;
  workcellId?: string;
}

export interface ApprovedRunResult {
  ok: boolean;
  toolResult?: ToolResult;
  pceContractId?: string;
  blocked?: boolean;
  blockedReason?: string;
  errorType?: string;
}

function isDemoMode(): boolean {
  return process.env.A11OY_DEMO_MODE !== 'false';
}

type LiveExecutorFn = (input: Record<string, unknown>, demo: boolean) => Promise<ToolResult>;

const LIVE_EXECUTORS: Record<string, () => Promise<LiveExecutorFn>> = {
  submitHfJob: async () => {
    const { executeSubmitHfJob } = await import('../../../services/hf-jobs-executor.js');
    return executeSubmitHfJob;
  },
  submitHfScheduledJob: async () => {
    const { executeSubmitHfScheduledJob } = await import('../../../services/hf-jobs-executor.js');
    return executeSubmitHfScheduledJob;
  },
};

async function executeTool(toolId: string, input: Record<string, unknown>, demo: boolean): Promise<ToolResult> {
  const loader = LIVE_EXECUTORS[toolId];
  if (loader) {
    const executor = await loader();
    return executor(input, demo);
  }
  return executeToolMock(toolId, input, demo);
}

export async function runApprovedTool(opts: ApprovedRunOpts): Promise<ApprovedRunResult> {
  const tool = getTool(opts.toolId);
  if (!tool) {
    return { ok: false, blocked: true, blockedReason: `Tool "${opts.toolId}" not found.`, errorType: 'not_found' };
  }

  const demo = isDemoMode();

  if (demo && !tool.demoSupported) {
    return { ok: false, blocked: true, blockedReason: `Tool "${opts.toolId}" is not available in demo mode.`, errorType: 'safety' };
  }

  if (demo && tool.isDestructive) {
    return { ok: false, blocked: true, blockedReason: 'Data-destructive tools are blocked in demo mode.', errorType: 'safety' };
  }

  if (!tool.safeForAutonomy || tool.requiresApproval) {
    const pceResult = await runPCEGate({
      actionId: opts.actionId,
      workcellId: opts.workcellId,
      originSignalIds: opts.originSignalIds ?? [],
      vertical: opts.vertical,
      riskLevel: opts.riskLevel ?? tool.riskLevel,
      riskScore: opts.riskScore,
      isDestructive: tool.isDestructive,
      approvalRecordId: opts.approvalRecordId,
      mirrorEvalResult: opts.mirrorEvalResult,
    });

    if (!pceResult.allowed) {
      return {
        ok: false,
        blocked: true,
        blockedReason: pceResult.blockedReason,
        errorType: pceResult.errorType,
        pceContractId: pceResult.contract?.contractId,
      };
    }

    const toolResult = await executeTool(opts.toolId, opts.input, demo);
    return {
      ok: true,
      toolResult,
      pceContractId: pceResult.contract?.contractId,
    };
  }

  const toolResult = await executeTool(opts.toolId, opts.input, demo);
  return { ok: true, toolResult };
}

export async function simulateTool(toolId: string, input: Record<string, unknown>): Promise<ToolResult> {
  const tool = getTool(toolId);
  if (!tool) {
    return { ok: false, toolId, error: `Tool "${toolId}" not found.`, durationMs: 0 };
  }
  return executeToolMock(toolId, input, true);
}
