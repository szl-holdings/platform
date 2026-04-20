/**
 * AEEP v1 Task Routes
 *
 * All operations are tenant-isolated: workflow runs are stored and retrieved
 * using the tenantId from req.tenantCtx so cross-tenant leakage is prevented.
 *
 * POST /v1/tasks/plan    — decompose a goal into a provisional workflow descriptor
 * POST /v1/tasks/execute — validate a task plan and dispatch as a workflow run
 */
import { Router, type IRouter } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { createWorkflowRun, executeWorkflowRun } from "@szl-holdings/workflow-runtime";
import type { WorkflowDescriptor, AgentRoleId } from "@szl-holdings/shared-contracts";
import { runStore } from "../../store.js";

const router: IRouter = Router();

const PLANNER_STEPS: WorkflowDescriptor["steps"] = [
  {
    stepId: "task_plan_analyse",
    name: "Analyse goal and decompose sub-tasks",
    agentRole: "MissionPlanner" as AgentRoleId,
    toolIds: ["signal_search", "context_recall"],
    policyCheck: true,
    evidenceRequired: false,
  },
  {
    stepId: "task_plan_policy",
    name: "Policy gate — check domain constraints",
    agentRole: "PolicyGuardian" as AgentRoleId,
    toolIds: ["policy_lookup"],
    policyCheck: true,
    evidenceRequired: true,
    requiresApproval: false,
  },
  {
    stepId: "task_plan_emit",
    name: "Emit provisional workflow plan",
    agentRole: "EvidenceSynthesizer" as AgentRoleId,
    toolIds: ["plan_serialise"],
    policyCheck: false,
    evidenceRequired: true,
  },
];

const PlanSchema = z.object({
  goal: z.string().min(1),
  profileId: z.string().optional(),
  triggeredBy: z.string().optional(),
  policyTier: z.enum(["low", "medium", "high"]).optional(),
});

const ExecuteSchema = z.object({
  plan: z.object({
    workflowId: z.string(),
    workflowName: z.string(),
    steps: z.array(z.object({
      stepId: z.string(),
      name: z.string(),
      agentRole: z.string(),
      toolIds: z.array(z.string()).default([]),
      policyCheck: z.boolean().default(true),
      evidenceRequired: z.boolean().default(true),
      requiresApproval: z.boolean().optional(),
    })),
  }),
  profileId: z.string().optional(),
  triggeredBy: z.string().optional(),
});

function tenantId(req: Request): string {
  return req.tenantCtx?.tenantId ?? "default";
}

router.post("/plan", async (req: Request, res: Response): Promise<void> => {
  const parse = PlanSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Validation failed", issues: parse.error.issues });
    return;
  }

  const { goal, profileId, triggeredBy } = parse.data;
  const tid = tenantId(req);

  const planDescriptor: WorkflowDescriptor = {
    id: "investigate_signal",
    name: "Task Planner",
    description: `Plan: ${goal}`,
    category: "intelligence",
    triggerTypes: ["api"],
    steps: PLANNER_STEPS,
    policyTier: parse.data.policyTier ?? "medium",
  };

  const planRun = createWorkflowRun(planDescriptor, { profileId, triggeredBy: triggeredBy ?? tid });
  runStore.set(planRun, tid);

  const completed = await executeWorkflowRun(planRun, {
    onStateChange: (updated) => runStore.set(updated, tid),
  });
  runStore.set(completed, tid);

  res.status(200).json({
    planRunId: completed.runId,
    state: completed.state,
    tenantId: tid,
    goal,
    workflowPlan: {
      workflowId: `task_${Date.now()}`,
      workflowName: `Task: ${goal.slice(0, 60)}`,
      steps: PLANNER_STEPS.map((s) => ({
        stepId: s.stepId,
        name: s.name,
        agentRole: s.agentRole,
        toolIds: s.toolIds,
        policyCheck: s.policyCheck,
        evidenceRequired: s.evidenceRequired,
      })),
    },
  });
});

router.post("/execute", async (req: Request, res: Response): Promise<void> => {
  const parse = ExecuteSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Validation failed", issues: parse.error.issues });
    return;
  }

  const { plan, profileId, triggeredBy } = parse.data;
  const tid = tenantId(req);

  const descriptor: WorkflowDescriptor = {
    id: plan.workflowId as WorkflowDescriptor["id"],
    name: plan.workflowName,
    description: plan.workflowName,
    category: "operational",
    triggerTypes: ["api"],
    steps: plan.steps.map((s) => ({
      stepId: s.stepId,
      name: s.name,
      agentRole: s.agentRole as AgentRoleId,
      toolIds: s.toolIds,
      policyCheck: s.policyCheck,
      evidenceRequired: s.evidenceRequired,
      requiresApproval: s.requiresApproval,
    })),
    policyTier: "medium",
  };

  const run = createWorkflowRun(descriptor, { profileId, triggeredBy });
  runStore.set(run, tid);

  executeWorkflowRun(run, {
    onStateChange: (updated) => runStore.set(updated, tid),
  }).then((final) => runStore.set(final, tid)).catch(() => {
    const stale = runStore.get(run.runId, tid);
    if (stale && stale.state === "running") {
      runStore.set({ ...stale, state: "failed", completedAt: new Date().toISOString() }, tid);
    }
  });

  res.status(202).json({
    runId: run.runId,
    workflowId: run.workflowId,
    tenantId: tid,
    state: run.state,
    startedAt: run.startedAt,
    statusUrl: `/v1/workflows/${run.runId}`,
  });
});

export default router;
