import { pool } from "@szl-holdings/db";
import { logger } from "../logger";
import type { WorkflowDAG, WorkflowStep } from "./types";

export async function createWorkflow(dag: WorkflowDAG, startedBy?: string): Promise<string> {
  const workflowId = dag.workflowId || `wf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  await pool.query(
    `INSERT INTO durable_workflows
     (workflow_id, name, status, dag, context, checkpoints, started_by, started_at, updated_at)
     VALUES ($1, $2, 'pending', $3, $4, '[]', $5, NOW(), NOW())`,
    [workflowId, dag.name, JSON.stringify(dag), JSON.stringify(dag.context || {}), startedBy]
  );

  for (const step of dag.steps) {
    await pool.query(
      `INSERT INTO durable_workflow_steps
       (workflow_id, step_id, step_type, agent_id, status, input)
       VALUES ($1, $2, $3, $4, 'pending', $5)`,
      [workflowId, step.stepId, step.stepType, step.agentId, step.input ? JSON.stringify(step.input) : null]
    );
  }

  logger.info({ workflowId, steps: dag.steps.length }, "Durable workflow created");
  return workflowId;
}

export async function executeWorkflow(
  workflowId: string,
  stepExecutor: (step: WorkflowStep, context: Record<string, unknown>) => Promise<any>
): Promise<{ status: string; results: Record<string, any>; error?: string }> {
  const wfResult = await pool.query("SELECT * FROM durable_workflows WHERE workflow_id = $1", [workflowId]);
  if (wfResult.rows.length === 0) throw new Error(`Workflow ${workflowId} not found`);

  const workflow = wfResult.rows[0];
  const dag: WorkflowDAG = workflow.dag;
  const context = workflow.context || {};
  const results: Record<string, any> = {};

  await pool.query(
    "UPDATE durable_workflows SET status = 'running', updated_at = NOW() WHERE workflow_id = $1",
    [workflowId]
  );

  const completed = new Set<string>();
  const failed = new Set<string>();

  function getReadySteps(): WorkflowStep[] {
    return dag.steps.filter(step => {
      if (completed.has(step.stepId) || failed.has(step.stepId)) return false;
      const deps = dag.edges.filter(e => e.to === step.stepId).map(e => e.from);
      return deps.every(d => completed.has(d));
    });
  }

  let iterations = 0;
  const maxIterations = dag.steps.length * 2;

  while (completed.size + failed.size < dag.steps.length && iterations < maxIterations) {
    iterations++;
    const readySteps = getReadySteps();
    if (readySteps.length === 0) break;

    await pool.query(
      "UPDATE durable_workflows SET current_step = $2, updated_at = NOW() WHERE workflow_id = $1",
      [workflowId, readySteps.map(s => s.stepId).join(",")]
    );

    const parallelSteps = readySteps.filter(s => s.stepType === "parallel" || readySteps.length > 1);
    const sequentialSteps = readySteps.length === 1 ? readySteps : [];

    const stepsToRun = parallelSteps.length > 0 ? parallelSteps : sequentialSteps;

    const stepResults = await Promise.allSettled(
      stepsToRun.map(async (step) => {
        await pool.query(
          "UPDATE durable_workflow_steps SET status = 'running', started_at = NOW() WHERE workflow_id = $1 AND step_id = $2",
          [workflowId, step.stepId]
        );

        if (step.stepType === "condition") {
          const edge = dag.edges.find(e => e.from === step.stepId);
          const conditionMet = edge?.condition ? edge.condition(context) : true;
          if (!conditionMet) {
            await pool.query(
              "UPDATE durable_workflow_steps SET status = 'skipped', completed_at = NOW() WHERE workflow_id = $1 AND step_id = $2",
              [workflowId, step.stepId]
            );
            return { stepId: step.stepId, skipped: true };
          }
        }

        if (step.stepType === "checkpoint") {
          const checkpoint = { stepId: step.stepId, context: { ...context }, timestamp: new Date().toISOString() };
          await pool.query(
            "UPDATE durable_workflows SET checkpoints = checkpoints || $2::jsonb, updated_at = NOW() WHERE workflow_id = $1",
            [workflowId, JSON.stringify([checkpoint])]
          );
          return { stepId: step.stepId, checkpoint: true };
        }

        const stepInput = { ...step.input, ...context };
        const output = await stepExecutor(step, stepInput);

        await pool.query(
          "UPDATE durable_workflow_steps SET status = 'completed', output = $3, completed_at = NOW() WHERE workflow_id = $1 AND step_id = $2",
          [workflowId, step.stepId, JSON.stringify(output)]
        );

        return { stepId: step.stepId, output };
      })
    );

    for (const result of stepResults) {
      if (result.status === "fulfilled") {
        const { stepId, output, skipped } = result.value as any;
        completed.add(stepId);
        if (!skipped) {
          results[stepId] = output;
          if (output && typeof output === "object") {
            Object.assign(context, { [`step_${stepId}`]: output });
          }
        }
      } else {
        const stepId = stepsToRun[stepResults.indexOf(result)]?.stepId || "unknown";
        failed.add(stepId);
        const error = (result.reason as Error)?.message || "Unknown error";

        await pool.query(
          "UPDATE durable_workflow_steps SET status = 'failed', error = $3, completed_at = NOW() WHERE workflow_id = $1 AND step_id = $2",
          [workflowId, stepId, error]
        );

        const step = dag.steps.find(s => s.stepId === stepId);
        if (step?.retries && step.retries > 0) {
          const retryResult = await pool.query(
            "SELECT retry_count FROM durable_workflow_steps WHERE workflow_id = $1 AND step_id = $2",
            [workflowId, stepId]
          );
          const currentRetries = retryResult.rows[0]?.retry_count || 0;
          if (currentRetries < step.retries) {
            failed.delete(stepId);
            await pool.query(
              "UPDATE durable_workflow_steps SET status = 'pending', retry_count = retry_count + 1 WHERE workflow_id = $1 AND step_id = $2",
              [workflowId, stepId]
            );
          }
        }
      }
    }
  }

  const finalStatus = failed.size > 0 ? "failed" : "completed";
  await pool.query(
    "UPDATE durable_workflows SET status = $2, context = $3, completed_at = NOW(), updated_at = NOW() WHERE workflow_id = $1",
    [workflowId, finalStatus, JSON.stringify(context)]
  );

  return { status: finalStatus, results, error: failed.size > 0 ? `Failed steps: ${Array.from(failed).join(", ")}` : undefined };
}

export async function getWorkflow(workflowId: string): Promise<any> {
  const [wfResult, stepsResult] = await Promise.all([
    pool.query("SELECT * FROM durable_workflows WHERE workflow_id = $1", [workflowId]),
    pool.query("SELECT * FROM durable_workflow_steps WHERE workflow_id = $1 ORDER BY id", [workflowId]),
  ]);
  if (wfResult.rows.length === 0) return null;
  return { ...wfResult.rows[0], steps: stepsResult.rows };
}

export async function listWorkflows(
  filters?: { status?: string; limit?: number }
): Promise<any[]> {
  const conditions = ["1=1"];
  const params: any[] = [];
  let idx = 1;

  if (filters?.status) { conditions.push(`status = $${idx}`); params.push(filters.status); idx++; }
  params.push(filters?.limit ?? 20);

  const result = await pool.query(
    `SELECT w.*, (SELECT count(*) FROM durable_workflow_steps WHERE workflow_id = w.workflow_id) as step_count,
            (SELECT count(*) FROM durable_workflow_steps WHERE workflow_id = w.workflow_id AND status = 'completed') as completed_steps
     FROM durable_workflows w WHERE ${conditions.join(" AND ")}
     ORDER BY w.started_at DESC LIMIT $${idx}`,
    params
  );
  return result.rows;
}

export async function pauseWorkflow(workflowId: string): Promise<void> {
  await pool.query(
    "UPDATE durable_workflows SET status = 'paused', updated_at = NOW() WHERE workflow_id = $1",
    [workflowId]
  );
}

export async function cancelWorkflow(workflowId: string): Promise<void> {
  await pool.query(
    "UPDATE durable_workflows SET status = 'cancelled', completed_at = NOW(), updated_at = NOW() WHERE workflow_id = $1",
    [workflowId]
  );
}
