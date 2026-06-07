import { getEnv } from '@szl-holdings/env';
import { getTracer } from '@szl-holdings/observability';
import { type PrismDomain, prismBus } from '@szl-holdings/prism-bus';
import { forgeEvidenceStore } from './evidence.js';
import { type ApprovalClass, type ForgeSandboxPolicy, createDefaultSandboxPolicy, ForgeSandbox } from './sandbox.js';
import { forgeTimeline } from './timeline.js';

export type ForgeTaskType = 'browser' | 'code' | 'artifact' | 'workflow' | 'messaging';

export type ForgeExecutionStatus =
  | 'pending'
  | 'running'
  | 'dry_run_complete'
  | 'awaiting_approval'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ForgeTask {
  taskId: string;
  type: ForgeTaskType;
  domain: PrismDomain;
  tenantId?: string | null;
  userId?: string | null;
  label: string;
  isDryRun?: boolean;
  approvalClass?: ApprovalClass;
  payload: Record<string, unknown>;
  sandboxPolicy?: Partial<ForgeSandboxPolicy>;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface ForgeExecution {
  executionId: string;
  task: ForgeTask;
  sandbox: ForgeSandbox;
  status: ForgeExecutionStatus;
  startedAt: number;
  completedAt?: number;
  costUsd?: number;
  latencyMs?: number;
  result?: unknown;
  error?: string;
  evidenceIds: string[];
  approvalId?: string | null;
  dryRunResult?: unknown;
  metadata?: Record<string, unknown>;
}

export interface ForgeTenantPolicy {
  tenantId: string;
  defaultApprovalClass: ApprovalClass;
  allowedDomains: PrismDomain[];
  allowedTools: string[];
  maxConcurrentExecutions: number;
  maxCostPerExecutionUsd?: number;
  requiresDryRunFirst: boolean;
  highRiskActions: string[];
}

type ForgeTaskHandler = (
  execution: ForgeExecution,
) => Promise<{ result: unknown; costUsd?: number }>;

const MAX_EXECUTION_HISTORY = 200;

function buildSpanAttributes(execution: ForgeExecution): Record<string, string | number | boolean> {
  const attrs: Record<string, string | number | boolean> = {
    'szl.environment': getEnv().NODE_ENV,
    'szl.workflow.id': execution.executionId,
    'szl.workflow.type': execution.task.type,
  };

  if (execution.task.tenantId) {
    attrs['szl.workspace.id'] = execution.task.tenantId;
  }
  if (execution.task.correlationId) {
    attrs['szl.correlation.id'] = execution.task.correlationId;
  }
  if (execution.task.userId) {
    attrs['szl.actor.id'] = execution.task.userId;
    attrs['szl.actor.type'] = 'human';
  } else {
    attrs['szl.actor.type'] = 'agent';
  }
  if (execution.sandbox.approvalClass) {
    attrs['szl.alloy.approval_class'] = execution.sandbox.approvalClass;
  }
  if (execution.task.domain) {
    attrs['szl.signal.domain'] = execution.task.domain;
  }
  return attrs;
}

export class ForgeRuntime {
  private executions = new Map<string, ForgeExecution>();
  private history: ForgeExecution[] = [];
  private handlers = new Map<ForgeTaskType, ForgeTaskHandler>();
  private tenantPolicies = new Map<string, ForgeTenantPolicy>();
  private activeCount = 0;
  private tenantActiveCount = new Map<string, number>();
  private dryRunCompletedSignatures = new Set<string>();

  registerHandler(type: ForgeTaskType, handler: ForgeTaskHandler): void {
    this.handlers.set(type, handler);
  }

  registerTenantPolicy(policy: ForgeTenantPolicy): void {
    this.tenantPolicies.set(policy.tenantId, policy);
  }

  getTenantPolicy(tenantId: string): ForgeTenantPolicy | undefined {
    return this.tenantPolicies.get(tenantId);
  }

  async submit(task: ForgeTask): Promise<ForgeExecution> {
    const tracer = getTracer();
    return tracer.withSpan(
      'alloy.workflow.start',
      async (span) => {
        const tenantPolicy = task.tenantId ? this.tenantPolicies.get(task.tenantId) : undefined;

        const classOrder: ApprovalClass[] = [
          'observe_only',
          'propose_only',
          'approval_required',
          'approved_execute',
        ];
        const policyClass: ApprovalClass = tenantPolicy?.defaultApprovalClass ?? 'propose_only';
        const requestedClass: ApprovalClass = task.approvalClass ?? policyClass;
        const effectiveApprovalClass: ApprovalClass =
          classOrder.indexOf(requestedClass) > classOrder.indexOf(policyClass)
            ? policyClass
            : requestedClass;

        const tenantAllowedTools = tenantPolicy?.allowedTools ?? [];
        const tenantAllowedDomains =
          tenantPolicy?.allowedDomains ?? ([task.domain, 'global'] as PrismDomain[]);
        const tenantMaxCostUsd = tenantPolicy?.maxCostPerExecutionUsd;
        const tenantRequiresDryRun = tenantPolicy?.requiresDryRunFirst ?? false;

        const trustedCallerOverrides: Partial<ForgeSandboxPolicy> = task.sandboxPolicy
          ? {
              ...(task.sandboxPolicy as Partial<ForgeSandboxPolicy>),
              // Strip all governance-critical fields — callers must not be able
              // to weaken audit, evidence capture, or execution guardrails.
              approvalClass: undefined,
              allowedDomains: undefined,
              allowedTools: undefined,
              maxCostUsd: undefined,
              isDryRunDefault: undefined,
              requiresEvidenceCapture: undefined,
            }
          : {};

        const sandboxBase = createDefaultSandboxPolicy(task.domain, {
          ...trustedCallerOverrides,
          approvalClass: effectiveApprovalClass,
          allowedTools: tenantAllowedTools,
          allowedDomains: tenantAllowedDomains,
          isDryRunDefault: task.isDryRun || tenantRequiresDryRun,
          maxCostUsd: tenantMaxCostUsd,
        });

        const sandbox = new ForgeSandbox(sandboxBase);

        const taskSignature = `${task.tenantId ?? 'global'}::${task.type}::${task.label}`;
        if (
          tenantRequiresDryRun &&
          !task.isDryRun &&
          sandbox.approvalClass !== 'observe_only' &&
          sandbox.approvalClass !== 'propose_only' &&
          !this.dryRunCompletedSignatures.has(taskSignature)
        ) {
          throw new Error(
            `Counsel: tenant policy requires a dry run before live execution for task "${task.label}". Submit with isDryRun=true first.`,
          );
        }

        const executionId = `forge-exec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const execution: ForgeExecution = {
          executionId,
          task,
          sandbox,
          status: 'pending',
          startedAt: Date.now(),
          evidenceIds: [],
          approvalId: null,
        };

        span.setAttributes({
          'szl.workflow.id': executionId,
          'szl.workflow.type': task.type,
          'szl.alloy.approval_class': effectiveApprovalClass,
          'szl.alloy.is_dry_run': !!(task.isDryRun || tenantRequiresDryRun),
          'szl.alloy.label': task.label,
          'szl.signal.domain': task.domain,
          'szl.environment': getEnv().NODE_ENV,
          ...(task.tenantId ? { 'szl.workspace.id': task.tenantId } : {}),
          ...(task.correlationId ? { 'szl.correlation.id': task.correlationId } : {}),
          ...(task.userId
            ? { 'szl.actor.id': task.userId, 'szl.actor.type': 'human' }
            : { 'szl.actor.type': 'agent' }),
        });

        this.executions.set(executionId, execution);
        this.history.unshift(execution);
        if (this.history.length > MAX_EXECUTION_HISTORY) {
          this.history.length = MAX_EXECUTION_HISTORY;
        }

        forgeTimeline.record({
          executionId,
          domain: task.domain,
          type: 'execution_started',
          label: `Counsel: ${task.label}`,
          payload: {
            taskType: task.type,
            approvalClass: sandboxBase.approvalClass,
            isDryRun: sandboxBase.isDryRunDefault,
          },
        });

        await prismBus.publish({
          type: 'execution_started',
          domain: task.domain,
          sourceId: `forge-runtime`,
          severity: 'info',
          payload: { executionId, taskType: task.type, label: task.label },
          correlationId: task.correlationId,
          tenantId: task.tenantId,
          userId: task.userId,
        });

        const ac = sandbox.approvalClass;

        if (ac === 'observe_only') {
          execution.status = 'dry_run_complete';
          execution.completedAt = Date.now();
          execution.latencyMs = execution.completedAt - execution.startedAt;
          execution.result = { observed: true, label: task.label };
          span.addEvent('alloy.workflow.observe_only', { executionId });
          await prismBus.publish({
            type: 'execution_completed',
            domain: task.domain,
            sourceId: 'forge-runtime',
            severity: 'info',
            payload: {
              executionId,
              result: execution.result,
              note: 'observe_only: no execution performed',
            },
            correlationId: task.correlationId,
            tenantId: task.tenantId,
            userId: task.userId,
          });
          return execution;
        }

        if (ac === 'propose_only') {
          execution.status = 'dry_run_complete';
          execution.completedAt = Date.now();
          execution.latencyMs = execution.completedAt - execution.startedAt;
          execution.result = { proposed: true, label: task.label, payload: task.payload };
          span.addEvent('alloy.workflow.propose_only', { executionId });
          await prismBus.publish({
            type: 'execution_completed',
            domain: task.domain,
            sourceId: 'forge-runtime',
            severity: 'info',
            payload: {
              executionId,
              result: execution.result,
              note: 'propose_only: plan proposed, not executed',
            },
            correlationId: task.correlationId,
            tenantId: task.tenantId,
            userId: task.userId,
          });
          return execution;
        }

        if (ac === 'approval_required' && !task.isDryRun) {
          execution.status = 'awaiting_approval';
          span.addEvent('alloy.workflow.approval.request', {
            executionId,
            'szl.approval.class': sandbox.approvalClass,
          });
          await prismBus.publish({
            type: 'approval_requested',
            domain: task.domain,
            sourceId: 'forge-runtime',
            severity: 'medium',
            payload: { executionId, label: task.label, approvalClass: sandbox.approvalClass },
            correlationId: task.correlationId,
            tenantId: task.tenantId,
            userId: task.userId,
          });
          return execution;
        }

        setImmediate(() => {
          this.runExecution(execution).catch(() => {});
        });

        return execution;
      },
      {
        'service.name': 'szl-alloy-workflow',
      },
    );
  }

  async approveAndRun(executionId: string, approvalId: string): Promise<ForgeExecution> {
    const execution = this.executions.get(executionId);
    if (!execution) throw new Error(`Counsel: Execution ${executionId} not found`);
    if (execution.status !== 'awaiting_approval') {
      throw new Error(
        `Counsel: Execution ${executionId} is not awaiting approval (status: ${execution.status})`,
      );
    }

    const tracer = getTracer();
    return tracer.withSpan('alloy.workflow.approval.receive', async (span) => {
      span.setAttributes({
        ...buildSpanAttributes(execution),
        'szl.approval.id': approvalId,
        'service.name': 'szl-alloy-workflow',
      });

      execution.approvalId = approvalId;
      execution.task.isDryRun = false;

      span.addEvent('alloy.workflow.approval.decided', { executionId, approvalId });

      await prismBus.publish({
        type: 'approval_decided',
        domain: execution.task.domain,
        sourceId: 'forge-runtime',
        severity: 'info',
        payload: { executionId, approvalId },
        correlationId: execution.task.correlationId,
      });

      await this.runExecution(execution);
      return execution;
    });
  }

  private async runExecution(execution: ForgeExecution): Promise<void> {
    const tracer = getTracer();
    await tracer.withSpan('alloy.workflow.step.execute', async (span) => {
      span.setAttributes({
        ...buildSpanAttributes(execution),
        'service.name': 'szl-alloy-workflow',
      });

      const tenantPolicy = execution.task.tenantId
        ? this.tenantPolicies.get(execution.task.tenantId)
        : undefined;

      if (tenantPolicy && execution.task.tenantId) {
        const tenantActive = this.tenantActiveCount.get(execution.task.tenantId) ?? 0;
        if (tenantActive >= tenantPolicy.maxConcurrentExecutions) {
          execution.status = 'failed';
          execution.error = `Counsel: tenant '${execution.task.tenantId}' exceeded maxConcurrentExecutions (${tenantPolicy.maxConcurrentExecutions})`;
          execution.completedAt = Date.now();
          execution.latencyMs = execution.completedAt - execution.startedAt;
          span.setStatus('error', execution.error);
          span.addEvent('alloy.workflow.concurrency_limit_exceeded', {
            executionId: execution.executionId,
          });
          await prismBus.publish({
            type: 'execution_failed',
            domain: execution.task.domain,
            sourceId: 'forge-runtime',
            severity: 'high',
            payload: { executionId: execution.executionId, error: execution.error },
            correlationId: execution.task.correlationId,
          });
          return;
        }
      }

      const domainViolation = execution.sandbox.checkDomain(execution.task.domain);
      if (domainViolation) {
        execution.status = 'failed';
        execution.error = domainViolation.detail;
        execution.completedAt = Date.now();
        execution.latencyMs = execution.completedAt - execution.startedAt;
        span.setStatus('error', execution.error);
        span.addEvent('alloy.workflow.domain_violation', { executionId: execution.executionId });
        return;
      }

      execution.status = 'running';
      this.activeCount++;
      if (execution.task.tenantId) {
        const prev = this.tenantActiveCount.get(execution.task.tenantId) ?? 0;
        this.tenantActiveCount.set(execution.task.tenantId, prev + 1);
      }

      const handler = this.handlers.get(execution.task.type);

      try {
        if (!handler) {
          execution.status = execution.task.isDryRun ? 'dry_run_complete' : 'completed';
          execution.result = {
            simulated: true,
            message: `Counsel: no handler registered for task type '${execution.task.type}'`,
          };
          execution.completedAt = Date.now();
          execution.latencyMs = execution.completedAt - execution.startedAt;
          span.addEvent('alloy.workflow.no_handler', { 'szl.workflow.type': execution.task.type });
          return;
        }

        const { result, costUsd } = await handler(execution);

        const durationMs = Date.now() - execution.startedAt;
        const durationViolation = execution.sandbox.checkDuration(durationMs);
        if (durationViolation) {
          execution.status = 'failed';
          execution.error = durationViolation.detail;
          execution.completedAt = Date.now();
          execution.latencyMs = execution.completedAt - execution.startedAt;
          span.setStatus('error', execution.error);
          span.addEvent('alloy.workflow.duration_exceeded', {
            executionId: execution.executionId,
            durationMs,
          });
          return;
        }

        if (costUsd != null) {
          const costViolation = execution.sandbox.checkCost(costUsd);
          if (costViolation) {
            execution.status = 'failed';
            execution.error = costViolation.detail;
            execution.completedAt = Date.now();
            execution.latencyMs = execution.completedAt - execution.startedAt;
            span.setStatus('error', execution.error);
            span.addEvent('alloy.workflow.cost_exceeded', { costUsd });
            return;
          }
        }

        execution.result = result;
        execution.costUsd = costUsd;
        execution.status = execution.task.isDryRun ? 'dry_run_complete' : 'completed';
        if (execution.task.isDryRun) {
          const sig = `${execution.task.tenantId ?? 'global'}::${execution.task.type}::${execution.task.label}`;
          this.dryRunCompletedSignatures.add(sig);
        }
        execution.completedAt = Date.now();
        execution.latencyMs = execution.completedAt - execution.startedAt;

        span.setAttributes({
          'szl.workflow.latency_ms': execution.latencyMs,
          ...(costUsd != null ? { 'szl.workflow.cost_usd': costUsd } : {}),
        });
        span.addEvent('alloy.workflow.complete', {
          executionId: execution.executionId,
          latencyMs: execution.latencyMs,
        });

        if (execution.sandbox.requiresEvidenceCapture) {
          const ev = forgeEvidenceStore.capture({
            executionId: execution.executionId,
            domain: execution.task.domain,
            type: 'log_snapshot',
            description: `Counsel execution complete: ${execution.task.label}`,
            data: { result: execution.result, costUsd: execution.costUsd },
          });
          execution.evidenceIds.push(ev.evidenceId);
        }

        forgeTimeline.record({
          executionId: execution.executionId,
          domain: execution.task.domain,
          type: 'execution_completed',
          label: `Counsel done: ${execution.task.label}`,
          durationMs: execution.latencyMs,
          payload: { costUsd, isDryRun: execution.task.isDryRun },
        });

        await prismBus.publish({
          type: 'execution_completed',
          domain: execution.task.domain,
          sourceId: 'forge-runtime',
          severity: 'info',
          payload: {
            executionId: execution.executionId,
            latencyMs: execution.latencyMs,
            costUsd,
            isDryRun: execution.task.isDryRun,
          },
          correlationId: execution.task.correlationId,
          tenantId: execution.task.tenantId,
          userId: execution.task.userId,
        });
      } catch (err) {
        execution.status = 'failed';
        execution.error = err instanceof Error ? err.message : String(err);
        execution.completedAt = Date.now();
        execution.latencyMs = execution.completedAt - execution.startedAt;

        span.setStatus('error', execution.error);
        span.setAttributes({ 'szl.workflow.latency_ms': execution.latencyMs });
        span.addEvent('alloy.workflow.failed', {
          executionId: execution.executionId,
          error: execution.error,
        });

        forgeTimeline.record({
          executionId: execution.executionId,
          domain: execution.task.domain,
          type: 'execution_failed',
          label: `Counsel failed: ${execution.task.label}`,
          durationMs: execution.latencyMs,
          payload: { error: execution.error },
        });

        await prismBus.publish({
          type: 'execution_failed',
          domain: execution.task.domain,
          sourceId: 'forge-runtime',
          severity: 'high',
          payload: { executionId: execution.executionId, error: execution.error },
          correlationId: execution.task.correlationId,
        });
      } finally {
        this.activeCount--;
        if (execution.task.tenantId) {
          const cur = this.tenantActiveCount.get(execution.task.tenantId) ?? 1;
          this.tenantActiveCount.set(execution.task.tenantId, Math.max(0, cur - 1));
        }
      }
    });
  }

  getExecution(executionId: string): ForgeExecution | undefined {
    return this.executions.get(executionId);
  }

  getHistory(
    options: {
      domain?: PrismDomain;
      tenantId?: string;
      limit?: number;
      status?: ForgeExecutionStatus;
    } = {},
  ): ForgeExecution[] {
    let results = this.history;
    if (options.domain) results = results.filter((e) => e.task.domain === options.domain);
    if (options.tenantId) results = results.filter((e) => e.task.tenantId === options.tenantId);
    if (options.status) results = results.filter((e) => e.status === options.status);
    return results.slice(0, options.limit ?? 50);
  }

  getStats() {
    const total = this.history.length;
    const byStatus: Record<string, number> = {};
    for (const exec of this.history) {
      byStatus[exec.status] = (byStatus[exec.status] ?? 0) + 1;
    }
    const totalCost = this.history.reduce((sum, e) => sum + (e.costUsd ?? 0), 0);
    const avgLatency =
      total > 0 ? this.history.reduce((sum, e) => sum + (e.latencyMs ?? 0), 0) / total : 0;

    return {
      activeCount: this.activeCount,
      total,
      byStatus,
      totalCostUsd: totalCost,
      avgLatencyMs: Math.round(avgLatency),
    };
  }
}

export const forgeRuntime = new ForgeRuntime();
