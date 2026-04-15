import { logger } from "./logger.js";
import { durableJobQueue, type DurableJob, type DurableJobOptions } from "./durable-job-queue.js";
import { serverTelemetry } from "@szl-holdings/observability";

export interface AgentState {
  [key: string]: unknown;
}

export interface AgentExecutionConfig {
  agentId: string;
  name: string;
  domain: string;
  jobType: string;
  queue?: string;
  maxExecutionWindowMs?: number;
  maxRetries?: number;
  metadata?: Record<string, unknown>;
}

export interface AgentRunContext {
  agentId: string;
  runId: string;
  domain: string;
  previousState: AgentState;
  runCount: number;
  saveState: (state: AgentState) => Promise<void>;
  spawnChild: <T>(type: string, payload: T, opts?: DurableJobOptions) => Promise<DurableJob<T>>;
  awaitChild: (jobId: string, timeoutMs?: number) => Promise<DurableJob>;
  log: (msg: string, data?: Record<string, unknown>) => void;
}

type AgentHandler = (job: DurableJob, ctx: AgentRunContext) => Promise<void>;

export class AgentExecutionRuntime {
  private agents = new Map<string, { config: AgentExecutionConfig; handler: AgentHandler }>();

  registerAgent(config: AgentExecutionConfig, handler: AgentHandler): void {
    this.agents.set(config.agentId, { config, handler });

    durableJobQueue.register(config.jobType, async (job, execCtx) => {
      const runId = job.id;
      const ctx = await this.buildRunContext(config, runId, execCtx.spawnChild, execCtx.log);

      const start = Date.now();
      logger.info({ agentId: config.agentId, runId, domain: config.domain }, "AgentExecutionRuntime: agent run started");

      try {
        if (config.maxExecutionWindowMs) {
          const limitMs = config.maxExecutionWindowMs;
          await Promise.race([
            handler(job, ctx),
            new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error(`AgentExecutionRuntime: agent ${config.agentId} timed out after ${limitMs}ms`)),
                limitMs,
              )
            ),
          ]);
        } else {
          await handler(job, ctx);
        }

        const durationMs = Date.now() - start;
        serverTelemetry.recordBusinessEvent({
          type: "agent_run_completed",
          domain: config.domain,
          durationMs,
          success: true,
          metadata: { agentId: config.agentId, runId },
        });

        logger.info({ agentId: config.agentId, runId, durationMs }, "AgentExecutionRuntime: agent run completed");
      } catch (err) {
        const durationMs = Date.now() - start;
        serverTelemetry.recordBusinessEvent({
          type: "agent_run_failed",
          domain: config.domain,
          durationMs,
          success: false,
          metadata: { agentId: config.agentId, runId, error: err instanceof Error ? err.message : String(err) },
        });

        logger.error({ err, agentId: config.agentId, runId }, "AgentExecutionRuntime: agent run failed");
        throw err;
      }
    });

    logger.info({ agentId: config.agentId, jobType: config.jobType }, "AgentExecutionRuntime: agent registered");
  }

  private async buildRunContext(
    config: AgentExecutionConfig,
    runId: string,
    spawnChild: DurableJob["id"] extends string ? <T>(type: string, payload: T, opts?: DurableJobOptions) => Promise<DurableJob<T>> : never,
    log: (msg: string, data?: Record<string, unknown>) => void,
  ): Promise<AgentRunContext> {
    const { pool } = await import("@szl-holdings/db");

    let previousState: AgentState = {};
    let runCount = 0;

    try {
      const result = await pool.query(
        `SELECT state, run_count FROM agent_execution_contexts WHERE agent_id = $1`,
        [config.agentId],
      );
      if (result.rows.length > 0) {
        const row = result.rows[0];
        previousState = typeof row.state === "string" ? JSON.parse(row.state) : (row.state ?? {});
        runCount = row.run_count ?? 0;
      }
    } catch (err) {
      logger.warn({ err, agentId: config.agentId }, "AgentExecutionRuntime: failed to load agent state (non-fatal)");
    }

    const saveState = async (state: AgentState): Promise<void> => {
      try {
        await pool.query(
          `INSERT INTO agent_execution_contexts
             (agent_id, state, last_run_at, last_run_id, run_count, updated_at)
           VALUES ($1, $2, NOW(), $3, 1, NOW())
           ON CONFLICT (agent_id) DO UPDATE
             SET state = $2,
                 last_run_at = NOW(),
                 last_run_id = $3,
                 run_count = agent_execution_contexts.run_count + 1,
                 updated_at = NOW()`,
          [config.agentId, JSON.stringify(state), runId],
        );
      } catch (err) {
        logger.warn({ err, agentId: config.agentId }, "AgentExecutionRuntime: failed to save agent state (non-fatal)");
      }
    };

    const TERMINAL_STATUSES = new Set<string>(["completed", "failed", "dead_letter", "cancelled"]);

    const awaitChild = async (jobId: string, timeoutMs = 120_000): Promise<DurableJob> => {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        const job = await durableJobQueue.getJob(jobId);
        if (job && TERMINAL_STATUSES.has(job.status)) {
          return job;
        }
        await new Promise<void>(r => setTimeout(r, 2000));
      }
      throw new Error(`awaitChild: job ${jobId} did not reach terminal state within ${timeoutMs}ms`);
    };

    return {
      agentId: config.agentId,
      runId,
      domain: config.domain,
      previousState,
      runCount,
      saveState,
      spawnChild: spawnChild as AgentRunContext["spawnChild"],
      awaitChild,
      log,
    };
  }

  async triggerAgent(agentId: string, payload?: Record<string, unknown>): Promise<DurableJob> {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent not registered: ${agentId}`);

    return durableJobQueue.enqueue(agent.config.jobType, payload ?? {}, {
      queue: agent.config.queue ?? "agents",
      maxRetries: agent.config.maxRetries ?? 2,
      metadata: { agentId, triggeredBy: "manual" },
    });
  }

  async getAgentState(agentId: string): Promise<AgentState | null> {
    const { pool } = await import("@szl-holdings/db");
    const result = await pool.query(
      `SELECT state, run_count, last_run_at, last_run_id FROM agent_execution_contexts WHERE agent_id = $1`,
      [agentId],
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      state: typeof row.state === "string" ? JSON.parse(row.state) : (row.state ?? {}),
      runCount: row.run_count,
      lastRunAt: row.last_run_at,
      lastRunId: row.last_run_id,
    };
  }

  listAgents(): Array<{ agentId: string; name: string; domain: string; jobType: string; queue: string }> {
    return [...this.agents.entries()].map(([id, { config }]) => ({
      agentId: id,
      name: config.name,
      domain: config.domain,
      jobType: config.jobType,
      queue: config.queue ?? "agents",
    }));
  }
}

export const agentExecutionRuntime = new AgentExecutionRuntime();
