/**
 * Sandbox Runtime — SandboxAgent
 *
 * Combines an AgentRun (from agents-core) with a SandboxSession and
 * configured capabilities. Every sandbox run goes through the same approval
 * gates, step logging, and trace graph as any other agent run.
 *
 * SandboxAgent.run(objective, manifest, config, opts):
 *   1.  Perceive — list workspace, read prior memory, check git status
 *   2.  Plan    — decompose objective into an ordered command sequence
 *   3.  Execute — run each planned step; every shell invocation routes through
 *                 the Tool Mesh governed gateway (full guardrail chain: PII
 *                 scan, policy-engine, Guardian, tier enforcement) before the
 *                 shell handler is called.
 *   4.  Verify  — collect exit codes, scan for output artefacts, summarise
 *   5.  Finalise — persist memory to memory-fabric, sweep workspace artefacts
 *
 * Objective parsing (in priority order):
 *   a) JSON `{"commands": [...]}` in the objective string → explicit sequence
 *   b) `run: cmd`, `exec: cmd`, or `shell: cmd` prefix → single command
 *   c) Bare text  → emitted as a "plan marker" (structured description of
 *      available capabilities + workspace state) that callers can act on;
 *      does NOT silently no-op.
 */

import { AgentRun } from '@workspace/agents-core/run';
import { emitStepLog } from '@workspace/agents-core/step-log';
import { globalCollector } from '@workspace/cognitive-observability';
import { defaultGateway } from '@workspace/tool-mesh';
import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { randomUUID } from 'node:crypto';
import { ensureSandboxToolsRegistered } from './init.js';
import { MemoryCapability } from './capabilities/memory.js';
import { SandboxSession, defaultSessionStore } from './session.js';
import type {
  Manifest,
  SandboxAgentRunResult,
  SandboxArtifact,
  SandboxRunConfig,
  ShellExecResult,
} from './types.js';

const DEFAULT_SHELL_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_OUTPUT_BYTES = 1024 * 1024;

// ─── Tool Mesh Governed Invocation Helper ────────────────────────────────────

/**
 * Invoke a sandbox tool through the governed Tool Mesh gateway.
 *
 * All shell and filesystem operations inside SandboxAgent go through this
 * helper rather than calling capabilities directly. This ensures the full
 * guardrail chain fires for every operation:
 *   1. PII scan on input
 *   2. Policy-engine evaluation (policyTier, approval, rate limits)
 *   3. Guardian decision engine
 *   4. Registered tool handler (ShellCapability, FilesystemCapability)
 *   5. Trace emission (observabilityHooks.emitTrace = true on each manifest)
 *
 * @throws Error if the invocation is denied, the tool is not registered, or
 *   the gateway returns success:false.
 */
async function govInvoke<T>(
  toolId: string,
  input: Record<string, unknown>,
  context: { agentId: string; requestId: string; sessionId?: string },
): Promise<T> {
  const result = await defaultGateway.invoke(toolId, input, {
    agentId: context.agentId,
    requestId: context.requestId,
    sessionId: context.sessionId,
  });
  if (!result.success) {
    throw new Error(
      `Tool Mesh invocation of '${toolId}' denied: ${result.error ?? 'unknown error'}`,
    );
  }
  return result.output as T;
}

// ─── Plan step types ──────────────────────────────────────────────────────────

interface PlannedCommand {
  id: string;
  command: string;
  description?: string;
}

interface ExecutionPlan {
  kind: 'commands' | 'plan-marker';
  steps: PlannedCommand[];
  rawObjective: string;
}

/**
 * Decompose `objective` into an ordered list of shell commands.
 *
 * Resolution order:
 *  1. JSON payload: `{"commands": ["cmd1", "cmd2", ...]}`
 *  2. Single-command prefix: `run: cmd`, `exec: cmd`, `shell: cmd`
 *  3. Fallback: plan-marker (no commands; caller must extend)
 */
function planExecution(objective: string): ExecutionPlan {
  const trimmed = objective.trim();

  // 1. JSON command list
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (
        parsed !== null &&
        typeof parsed === 'object' &&
        'commands' in parsed &&
        Array.isArray((parsed as Record<string, unknown>).commands)
      ) {
        const cmds = (parsed as { commands: unknown[] }).commands;
        if (cmds.length > 0 && cmds.every((c) => typeof c === 'string')) {
          return {
            kind: 'commands',
            rawObjective: objective,
            steps: (cmds as string[]).map((c, i) => ({
              id: `cmd-${i}`,
              command: c,
            })),
          };
        }
      }
    } catch {
      // Not valid JSON — fall through
    }
  }

  // 2. Single-command prefix
  const shellMatch = trimmed.match(/^(?:run|exec|shell):\s*(.+)$/is);
  if (shellMatch?.[1]) {
    const command = shellMatch[1].trim();
    return {
      kind: 'commands',
      rawObjective: objective,
      steps: [{ id: 'cmd-0', command }],
    };
  }

  // 3. Plan marker — no auto-execution; emit structured description
  return { kind: 'plan-marker', rawObjective: objective, steps: [] };
}

// ─── Artefact collection ──────────────────────────────────────────────────────

async function collectArtifacts(
  workspaceRoot: string,
  outputDirs: string[],
): Promise<SandboxArtifact[]> {
  const artifacts: SandboxArtifact[] = [];

  async function walk(dir: string): Promise<void> {
    let entries: import('node:fs').Dirent<string>[];
    try {
      entries = await readdir(dir, { withFileTypes: true, encoding: 'utf8' });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        await walk(full);
      } else if (e.isFile()) {
        try {
          const s = await stat(full);
          artifacts.push({
            path: relative(workspaceRoot, full),
            sizeBytes: s.size,
          });
        } catch {
          // skip unreadable entries
        }
      }
    }
  }

  for (const dir of outputDirs) {
    await walk(join(workspaceRoot, dir));
  }

  return artifacts;
}

// ─── SandboxAgent ─────────────────────────────────────────────────────────────

export interface SandboxAgentOptions {
  /** Existing session to reuse (bypasses session creation from manifest). */
  session?: SandboxSession;
  /** Owning tenant org ID — required when creating a new session. */
  tenantId?: string;
  /** Prior memory summary to inject at session start. */
  priorMemorySummary?: string;
  /** List of output directories to scan for artefacts after run. */
  outputDirs?: string[];
  /** Agent ID forwarded to AgentRun. */
  agentId?: string;
  /** Domain label forwarded to Guardian. */
  domain?: string;
  /**
   * Allowed source roots for `local_file`/`local_dir` manifest entries.
   * Defaults to [] (deny all local copies) — must be set explicitly to enable.
   */
  allowedSourceRoots?: string[];
}

export class SandboxAgent {
  private readonly agentId: string;

  constructor(agentId?: string) {
    this.agentId = agentId ?? `sandbox-agent-${randomUUID()}`;
  }

  /**
   * Run the agent with the given objective in a sandbox session.
   *
   * Implements a governed perceive → plan → execute → verify flow.
   *
   * @param objective Human-readable objective (may include JSON command list or prefix).
   * @param manifest  Workspace manifest (ignored when opts.session is provided).
   * @param config    Run configuration (timeouts, approval, dry-run).
   * @param opts      Additional options (session reuse, prior memory, artefacts).
   */
  async run(
    objective: string,
    manifest: Manifest,
    config: SandboxRunConfig = {},
    opts: SandboxAgentOptions = {},
  ): Promise<SandboxAgentRunResult> {
    // Ensure sandbox tools are registered in the Tool Mesh gateway before
    // any governed invocation. This is idempotent — subsequent calls are no-ops.
    // Fails fast with SandboxToolRegistrationError if registration cannot complete,
    // rather than silently failing later when a tool handler is not found.
    await ensureSandboxToolsRegistered();

    const runId = randomUUID();
    const startMs = Date.now();

    const agentRun = new AgentRun(objective, {
      runId,
      agentId: this.agentId,
      domain: opts.domain ?? config.domain ?? 'sandbox',
      surface: 'sandbox-runtime',
      metadata: { sandboxRun: true },
    });

    let session: SandboxSession | null = null;
    let shellCommandsExecuted = 0;
    let filesRead = 0;
    const filesWritten = 0;

    // Collect per-command results for the verify step
    const commandResults: Array<{ command: string; exitCode: number; durationMs: number }> = [];

    try {
      await agentRun.start();

      // ── Phase 1: Create or reuse session ────────────────────────────────────
      session = opts.session ?? null;
      let sessionCreated = false;

      if (!session) {
        session = await agentRun.step(
          {
            id: 'sandbox:create-session',
            name: 'create_sandbox_session',
            handler: async () => {
              const s = await SandboxSession.create(manifest, opts.tenantId ?? 'system', {
                allowedSourceRoots: opts.allowedSourceRoots ?? config.allowedSourceRoots ?? [],
              });
              defaultSessionStore.set(s);
              return s;
            },
          },
          undefined,
        );
        sessionCreated = true;
      }

      const workspaceRoot = session.workspaceRoot;
      const sessionId = session.sessionId;

      // ── Phase 2: Initialize capabilities ────────────────────────────────────
      // Shell and filesystem operations are invoked via govInvoke() (Tool Mesh
      // gateway), which fires the full guardrail chain (PII scan, policy-engine,
      // Guardian, tier enforcement, trace emission) for every operation.
      // MemoryCapability is the only direct-call capability because there is no
      // Tool Mesh tool registered for memory (it is internal-only).

      // Convenience gateway context for all invocations in this run.
      const tenantId = opts.tenantId ?? 'system';
      const gwCtx = { agentId: this.agentId, requestId: runId, sessionId };

      const memory = new MemoryCapability({
        workspaceRoot,
        sessionId,
        tenantId: opts.tenantId,
        priorMemorySummary: opts.priorMemorySummary,
      });

      // ── Phase 3: Initialize memory ───────────────────────────────────────────
      await agentRun.step(
        {
          id: 'sandbox:init-memory',
          name: 'initialize_sandbox_memory',
          handler: async () => {
            await memory.initialize();
          },
        },
        undefined,
      );

      await emitStepLog({
        runId,
        stepId: 'sandbox:ready',
        stepName: 'sandbox.ready',
        level: 'info',
        message: `Sandbox session ready — workspace: ${workspaceRoot}`,
        data: { sessionId, sessionCreated, workspaceRoot, objective },
      });

      globalCollector.recordKnown('latency_ms', 0, {
        runId,
        agentId: this.agentId,
        domain: 'sandbox',
        event: 'run_started',
      });

      // ── Phase 4: Perceive ────────────────────────────────────────────────────
      // Observe workspace state: files, git status, prior memory context.
      const perceptionResult = await agentRun.step(
        {
          id: 'sandbox:perceive',
          name: 'sandbox.perceive',
          handler: async () => {
            filesRead++;

            // Route fs.list through the governed Tool Mesh gateway (policyTier:
            // internal-workflow). Guardian + PII scan fire before the handler.
            const listing = await govInvoke<{ entries: unknown[] }>(
              'sandbox.fs.list',
              { sessionId, tenantId, path: '.' },
              gwCtx,
            ).catch(() => ({ entries: [] as unknown[] }));

            // git status — also routed through gateway (policyTier: operator-assisted).
            // Best-effort: non-git workspaces return empty status.
            const gitStatus = await govInvoke<ShellExecResult>(
              'sandbox.shell',
              { sessionId, tenantId, command: 'git status --short 2>/dev/null || echo ""' },
              gwCtx,
            ).catch(() => ({
              stdout: '',
              stderr: '',
              exitCode: 0,
              durationMs: 0,
              timedOut: false,
              command: 'git status',
            }));

            const currentMemory = await memory.readMemory();

            return {
              workspaceFiles: listing.entries.slice(0, 50),
              gitStatus: gitStatus.stdout.trim(),
              memoryContext: currentMemory.slice(0, 1000),
            };
          },
        },
        undefined,
      );

      // ── Phase 5: Plan ────────────────────────────────────────────────────────
      // Decompose objective into an explicit ordered execution plan.
      const plan = await agentRun.step(
        {
          id: 'sandbox:plan',
          name: 'sandbox.plan',
          handler: async () => {
            const executionPlan = planExecution(objective);

            await emitStepLog({
              runId,
              stepId: 'sandbox:plan',
              stepName: 'sandbox.plan',
              level: 'info',
              message: `Execution plan: ${executionPlan.kind} — ${executionPlan.steps.length} step(s)`,
              data: {
                kind: executionPlan.kind,
                steps: executionPlan.steps.map((s) => s.command),
                workspaceFiles: perceptionResult.workspaceFiles.length,
              },
            });

            return executionPlan;
          },
        },
        undefined,
      );

      // ── Phase 6: Execute ─────────────────────────────────────────────────────
      // Run each planned command in sequence; every exec is audited via onExec.
      const execResult = await agentRun.step(
        {
          id: 'sandbox:execute',
          name: 'sandbox.execute',
          requiresApproval: config.requireApproval ?? false,
          approvalJustification: `Sandbox execution: ${objective}`,
          projectedImpact: 'medium',
          projectedRisk: 'low',
          handler: async () => {
            if (config.dryRun) {
              return {
                dryRun: true,
                objective,
                plan: plan.kind,
                message: 'Dry-run mode active: no side effects',
              };
            }

            if (plan.kind === 'plan-marker') {
              // Return a structured plan marker — callers can use this to drive
              // their own domain-specific execution logic on top of the capabilities.
              return {
                planMarker: true,
                objective,
                capabilities: ['shell', 'filesystem', 'memory'],
                workspaceFiles: perceptionResult.workspaceFiles.slice(0, 20),
                memoryContext: perceptionResult.memoryContext,
                hint: 'Provide commands via JSON {"commands":[...]} or "run: <cmd>" prefix.',
              };
            }

            // Execute each planned command through the Tool Mesh governed gateway.
            // govInvoke fires the full guardrail chain (PII scan, policy-engine,
            // Guardian, tier enforcement, trace emission) for every shell invocation.
            // We emit the agents-core step log AFTER the gateway returns so that
            // the run trace includes both the governance decision and the outcome.
            const results: Array<{ stepId: string; command: string; result: ShellExecResult }> = [];
            for (const step of plan.steps) {
              const result = await govInvoke<ShellExecResult>(
                'sandbox.shell',
                {
                  sessionId,
                  tenantId,
                  command: step.command,
                  ...(config.shellTimeoutMs != null ? { timeoutMs: config.shellTimeoutMs } : {}),
                  ...(config.maxOutputBytes != null
                    ? { maxOutputBytes: config.maxOutputBytes }
                    : {}),
                  ...(config.blockedCommands && config.blockedCommands.length > 0
                    ? { blockedCommands: config.blockedCommands }
                    : {}),
                },
                gwCtx,
              );
              shellCommandsExecuted++;

              // Emit agents-core step log — governance trace fired inside gateway.
              await emitStepLog({
                runId,
                stepId: `sandbox:shell:${shellCommandsExecuted}`,
                stepName: 'sandbox.shell.exec',
                level: result.exitCode === 0 ? 'info' : 'warn',
                message: `shell exec [exit ${result.exitCode}]: ${result.command}`,
                data: {
                  command: result.command,
                  exitCode: result.exitCode,
                  durationMs: result.durationMs,
                  timedOut: result.timedOut,
                  stdoutPreview: result.stdout.slice(0, 200),
                  stderrPreview: result.stderr.slice(0, 200),
                },
              });

              commandResults.push({
                command: step.command,
                exitCode: result.exitCode,
                durationMs: result.durationMs,
              });
              results.push({ stepId: step.id, command: step.command, result });

              // Append a memory lesson on failure for cross-run learning
              if (result.exitCode !== 0) {
                await memory.appendLesson({
                  lesson: `Command failed (exit ${result.exitCode}): ${step.command}`,
                  context: `Objective: ${objective}`,
                  timestamp: Date.now(),
                });
              }
            }

            return {
              steps: results.map((r) => ({
                stepId: r.stepId,
                command: r.command,
                exitCode: r.result.exitCode,
                durationMs: r.result.durationMs,
              })),
            };
          },
        },
        undefined,
      );

      // ── Phase 7: Verify ──────────────────────────────────────────────────────
      // Assess outcomes: exit codes, expected artefacts present, summary.
      const verifyResult = await agentRun.step(
        {
          id: 'sandbox:verify',
          name: 'sandbox.verify',
          handler: async () => {
            const failedSteps = commandResults.filter((r) => r.exitCode !== 0);
            const outputDirs = opts.outputDirs ?? manifest.outputDirs ?? [];
            const artifacts =
              outputDirs.length > 0 ? await collectArtifacts(workspaceRoot, outputDirs) : [];

            await emitStepLog({
              runId,
              stepId: 'sandbox:verify',
              stepName: 'sandbox.verify',
              level: failedSteps.length > 0 ? 'warn' : 'info',
              message:
                failedSteps.length > 0
                  ? `Verify: ${failedSteps.length} step(s) failed`
                  : `Verify: all ${commandResults.length} step(s) succeeded`,
              data: {
                totalSteps: commandResults.length,
                failedSteps: failedSteps.length,
                artifacts: artifacts.length,
              },
            });

            return { artifacts, failedSteps };
          },
        },
        undefined,
      );

      // ── Phase 8: Finalize memory ─────────────────────────────────────────────
      await agentRun.step(
        {
          id: 'sandbox:finalize-memory',
          name: 'sandbox.finalize_memory',
          handler: async () => {
            const lessons = commandResults
              .filter((r) => r.exitCode !== 0)
              .map((r) => ({
                lesson: `Command failed (exit ${r.exitCode}): ${r.command}`,
                context: `Objective: ${objective}`,
                timestamp: Date.now(),
              }));
            await memory.finalize(objective, lessons);
          },
        },
        undefined,
      );

      const summary = await agentRun.complete(`Sandbox run completed: ${objective}`);

      return {
        runId,
        sessionId,
        objective,
        status: verifyResult.failedSteps.length > 0 ? 'completed_with_errors' : 'completed',
        summary: summary.status,
        artifacts: verifyResult.artifacts,
        shellCommandsExecuted,
        filesRead,
        filesWritten,
        durationMs: Date.now() - startMs,
        stepResults: summary.stepResults.map((r) => ({
          stepId: r.stepId,
          stepName: r.stepName,
          status: r.status,
          durationMs: r.durationMs,
          error: r.error,
        })),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await agentRun.fail(err);

      return {
        runId,
        sessionId: session?.sessionId ?? 'unknown',
        objective,
        status: 'failed',
        summary: message,
        artifacts: [],
        shellCommandsExecuted,
        filesRead,
        filesWritten,
        durationMs: Date.now() - startMs,
        stepResults: [],
      };
    }
  }
}

export function createSandboxAgent(agentId?: string): SandboxAgent {
  return new SandboxAgent(agentId);
}
