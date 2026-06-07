/**
 * Sandbox Runtime — Cognitive-Runtime Step Executor Hook
 *
 * Provides a factory that creates a `StepExecutorFn`-compatible function
 * (structural duck type — does NOT import cognitive-runtime to avoid circular
 * dependency) that routes workspace-dependent plan steps into a SandboxAgent.
 *
 * Usage (in api-server or cognitive-runtime config):
 *
 *   ```typescript
 *   import { createSandboxStepExecutor } from '@workspace/sandbox-runtime/cognitive-executor';
 *   import { run } from '@workspace/cognitive-runtime';
 *
 *   const result = await run(objective, {
 *     stepExecutor: createSandboxStepExecutor({ tenantId: req.tenantOrgId }),
 *   });
 *   ```
 *
 * A plan step is routed to the sandbox executor when it has:
 *   `step.metadata.workspaceSandbox === true`
 *
 * Any step without this flag is rejected — the consumer should compose this
 * executor with a fallback (e.g. toolMeshStepExecutor) using a routing wrapper.
 *
 * Step metadata contract:
 *   - `workspaceSandbox: true`  — required; enables sandbox routing
 *   - `manifest?: Manifest`     — workspace manifest to materialise (optional)
 *   - `tenantId?: string`       — overrides the executor-level default
 *   - `allowedSourceRoots?: string[]` — opt-in for local_file/local_dir entries
 *   - `shellTimeout?: number`   — override shell command timeout (ms)
 */

import { SandboxAgent } from './agent.js';
import type { Manifest, SandboxRunConfig } from './types.js';

/** Minimal structural type matching @workspace/planner's PlanStep. */
export interface SandboxPlanStep {
  id: string;
  title: string;
  description?: string;
  inputs?: Record<string, unknown>;
  metadata?: {
    workspaceSandbox?: boolean;
    manifest?: unknown;
    tenantId?: string;
    allowedSourceRoots?: string[];
    shellTimeout?: number;
    [key: string]: unknown;
  };
}

export interface SandboxStepContext {
  traceId: string;
  planId: string;
  agentId: string;
  dryRun: boolean;
}

export interface SandboxStepExecutorOptions {
  /**
   * Default tenant ID for steps that don't include one in metadata.
   * Required when the executor is shared across tenants.
   */
  tenantId?: string;
  /** Default allowed source roots for local manifest entries. */
  allowedSourceRoots?: string[];
  /** Default shell command timeout (ms). */
  shellTimeoutMs?: number;
}

/**
 * Create a StepExecutorFn-compatible function that routes workspace-dependent
 * plan steps through SandboxAgent.
 *
 * Steps MUST have `metadata.workspaceSandbox === true` to be handled. Any step
 * without this flag throws, allowing callers to compose with a fallback.
 */
export function createSandboxStepExecutor(
  opts: SandboxStepExecutorOptions = {},
): (step: SandboxPlanStep, context: SandboxStepContext) => Promise<unknown> {
  return async (step: SandboxPlanStep, context: SandboxStepContext): Promise<unknown> => {
    if (!step.metadata?.workspaceSandbox) {
      throw new Error(
        `SandboxStepExecutor: step '${step.id}' ('${step.title}') is not marked for sandbox ` +
          'execution. Set step.metadata.workspaceSandbox = true to route through sandbox-runtime.',
      );
    }

    const tenantId =
      (step.metadata.tenantId as string | undefined) ?? opts.tenantId ?? 'system';

    const manifest: Manifest =
      step.metadata.manifest != null &&
      typeof step.metadata.manifest === 'object' &&
      'entries' in (step.metadata.manifest as Record<string, unknown>)
        ? (step.metadata.manifest as Manifest)
        : { entries: [] };

    const allowedSourceRoots =
      (step.metadata.allowedSourceRoots as string[] | undefined) ?? opts.allowedSourceRoots ?? [];

    const objective = step.description
      ? `${step.title}: ${step.description}`
      : step.title;

    const config: SandboxRunConfig = {
      dryRun: context.dryRun,
      domain: 'cognitive-runtime',
      shellTimeoutMs: (step.metadata.shellTimeout as number | undefined) ?? opts.shellTimeoutMs,
      allowedSourceRoots,
    };

    const agent = new SandboxAgent(context.agentId);
    const result = await agent.run(objective, manifest, config, {
      tenantId,
      allowedSourceRoots,
      domain: 'cognitive-runtime',
    });

    return {
      sandboxResult: result,
      stepId: step.id,
      runId: result.runId,
      sessionId: result.sessionId,
      status: result.status,
      summary: result.summary,
      artifacts: result.artifacts,
    };
  };
}
