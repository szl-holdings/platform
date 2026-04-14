import { Router, type IRouter, type Request, type Response } from "express";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendBadRequest,
  handleRouteError,
} from "../lib/api-response";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { forgeRuntime, forgeTimeline, forgeEvidenceStore } from "@szl-holdings/forge-runtime";
import type { ForgeTask, ForgeTaskType, ForgeTenantPolicy } from "@szl-holdings/forge-runtime";
import type { PrismDomain } from "@szl-holdings/prism-bus";
import type { ApprovalClass } from "@szl-holdings/forge-runtime";

const router: IRouter = Router();

router.get("/forge/status", authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const stats = forgeRuntime.getStats();
    sendSuccess(res, { runtime: "FORGE RUNTIME", status: "active", stats });
  } catch (err) {
    handleRouteError(res, err, "FORGE status");
  }
});

router.post("/forge/submit", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const {
      type,
      domain,
      label,
      payload,
      isDryRun,
      approvalClass,
      correlationId,
      sandboxPolicy,
    } = req.body as {
      type?: string;
      domain?: string;
      label?: string;
      payload?: Record<string, unknown>;
      isDryRun?: boolean;
      approvalClass?: string;
      correlationId?: string;
      sandboxPolicy?: Record<string, unknown>;
    };

    if (!type || !domain || !label) {
      sendBadRequest(res, "type, domain, and label are required");
      return;
    }

    const callerTenantId = req.user?.orgs?.[0]?.orgId?.toString() ?? null;
    const tenantPolicy = callerTenantId ? forgeRuntime.getTenantPolicy(callerTenantId) : undefined;

    const isSuperAdmin = req.user?.roles?.includes("super_admin") || req.user?.roles?.includes("admin");
    const requestedClass = (approvalClass ?? tenantPolicy?.defaultApprovalClass ?? "propose_only") as ApprovalClass;

    const classOrder: ApprovalClass[] = ["observe_only", "propose_only", "approval_required", "approved_execute"];
    const policyClass = tenantPolicy?.defaultApprovalClass ?? "propose_only";
    const policyIdx = classOrder.indexOf(policyClass);
    const requestedIdx = classOrder.indexOf(requestedClass);

    const effectiveApprovalClass: ApprovalClass =
      isSuperAdmin
        ? requestedClass
        : requestedIdx > policyIdx
          ? policyClass
          : requestedClass;

    const task: ForgeTask = {
      taskId: `api-task-${Date.now()}`,
      type: type as ForgeTaskType,
      domain: domain as PrismDomain,
      tenantId: callerTenantId,
      userId: req.user?.id?.toString() ?? null,
      label,
      payload: payload ?? {},
      isDryRun: isDryRun ?? false,
      approvalClass: effectiveApprovalClass,
      correlationId,
      sandboxPolicy: sandboxPolicy as Partial<import("@szl-holdings/forge-runtime").ForgeSandboxPolicy>,
    };

    const execution = await forgeRuntime.submit(task);
    sendCreated(res, {
      executionId: execution.executionId,
      status: execution.status,
      approvalClass: execution.sandbox.approvalClass,
      isDryRun: task.isDryRun,
    });
  } catch (err) {
    handleRouteError(res, err, "FORGE submit");
  }
});

router.get("/forge/executions/:executionId", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { executionId } = req.params;
    const execution = forgeRuntime.getExecution(executionId!);
    if (!execution) {
      sendNotFound(res, `Execution ${executionId} not found`);
      return;
    }

    const callerTenantId = req.user?.orgs?.[0]?.orgId?.toString() ?? null;
    const isSuperAdmin = req.user?.roles?.includes("super_admin") || req.user?.roles?.includes("admin");
    if (!isSuperAdmin && execution.task.tenantId != null && execution.task.tenantId !== callerTenantId) {
      sendNotFound(res, `Execution ${executionId} not found`);
      return;
    }

    sendSuccess(res, {
      executionId: execution.executionId,
      status: execution.status,
      taskType: execution.task.type,
      domain: execution.task.domain,
      label: execution.task.label,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      latencyMs: execution.latencyMs,
      costUsd: execution.costUsd,
      approvalId: execution.approvalId,
      evidenceIds: execution.evidenceIds,
      result: execution.result,
      error: execution.error,
    });
  } catch (err) {
    handleRouteError(res, err, "FORGE execution detail");
  }
});

router.post("/forge/executions/:executionId/approve", authMiddleware(), requireRole("admin", "super_admin", "exec", "compliance", "ops"), async (req: Request, res: Response) => {
  try {
    const { executionId } = req.params;
    const { approvalId } = req.body as { approvalId?: string };

    if (!approvalId) {
      sendBadRequest(res, "approvalId is required");
      return;
    }

    const callerTenantId = req.user?.orgs?.[0]?.orgId?.toString() ?? null;
    const isSuperAdmin = req.user?.roles?.includes("super_admin") || req.user?.roles?.includes("admin");

    const pending = forgeRuntime.getExecution(executionId!);
    if (!pending) {
      sendNotFound(res, `Execution ${executionId} not found`);
      return;
    }
    if (!isSuperAdmin && pending.task.tenantId != null && pending.task.tenantId !== callerTenantId) {
      sendNotFound(res, `Execution ${executionId} not found`);
      return;
    }

    const execution = await forgeRuntime.approveAndRun(executionId!, approvalId);
    sendSuccess(res, {
      executionId: execution.executionId,
      status: execution.status,
      approvalId: execution.approvalId,
    });
  } catch (err) {
    handleRouteError(res, err, "FORGE approve-and-run");
  }
});

router.get("/forge/history", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { domain, status, limit } = req.query as {
      domain?: string;
      status?: string;
      limit?: string;
    };

    const callerTenantId = req.user?.orgs?.[0]?.orgId?.toString() ?? null;
    const isSuperAdmin = req.user?.roles?.includes("super_admin") || req.user?.roles?.includes("admin");

    const history = forgeRuntime.getHistory({
      domain: domain as PrismDomain | undefined,
      status: status as import("@szl-holdings/forge-runtime").ForgeExecutionStatus | undefined,
      limit: limit ? Number(limit) : 50,
    }).filter(e =>
      isSuperAdmin ||
      e.task.tenantId == null ||
      e.task.tenantId === callerTenantId
    );

    sendSuccess(res, { executions: history, count: history.length });
  } catch (err) {
    handleRouteError(res, err, "FORGE history");
  }
});

router.get("/forge/timeline", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { executionId, domain, limit } = req.query as {
      executionId?: string;
      domain?: string;
      limit?: string;
    };

    const callerTenantId = req.user?.orgs?.[0]?.orgId?.toString() ?? null;
    const isSuperAdmin = req.user?.roles?.includes("super_admin") || req.user?.roles?.includes("admin");

    if (!isSuperAdmin && !executionId) {
      sendBadRequest(res, "executionId is required for non-admin timeline queries");
      return;
    }

    if (!isSuperAdmin && executionId) {
      const execution = forgeRuntime.getExecution(executionId);
      if (!execution || (execution.task.tenantId != null && execution.task.tenantId !== callerTenantId)) {
        sendNotFound(res, `Execution ${executionId} not found`);
        return;
      }
    }

    const events = forgeTimeline.getAllEvents({
      executionId,
      domain: domain as PrismDomain | undefined,
      limit: limit ? Number(limit) : 100,
    });

    sendSuccess(res, { events, count: events.length });
  } catch (err) {
    handleRouteError(res, err, "FORGE timeline");
  }
});

router.get("/forge/evidence", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { executionId, domain, type, limit } = req.query as {
      executionId?: string;
      domain?: string;
      type?: string;
      limit?: string;
    };

    const callerTenantId = req.user?.orgs?.[0]?.orgId?.toString() ?? null;
    const isSuperAdmin = req.user?.roles?.includes("super_admin") || req.user?.roles?.includes("admin");

    if (!isSuperAdmin && !executionId) {
      sendBadRequest(res, "executionId is required for non-admin evidence queries");
      return;
    }

    if (!isSuperAdmin && executionId) {
      const execution = forgeRuntime.getExecution(executionId);
      if (!execution || (execution.task.tenantId != null && execution.task.tenantId !== callerTenantId)) {
        sendNotFound(res, `Execution ${executionId} not found`);
        return;
      }
    }

    const evidence = executionId
      ? forgeEvidenceStore.getForExecution(executionId)
      : forgeEvidenceStore.getAll({
          domain: domain as PrismDomain | undefined,
          type: type as import("@szl-holdings/forge-runtime").EvidenceType | undefined,
          limit: limit ? Number(limit) : 100,
        });

    sendSuccess(res, { evidence, count: evidence.length });
  } catch (err) {
    handleRouteError(res, err, "FORGE evidence");
  }
});

router.post("/forge/tenant-policy", authMiddleware(), requireRole("admin", "super_admin", "exec"), async (req: Request, res: Response) => {
  try {
    const {
      tenantId: bodyTenantId,
      defaultApprovalClass,
      allowedDomains,
      allowedTools,
      maxConcurrentExecutions,
      maxCostPerExecutionUsd,
      requiresDryRunFirst,
      highRiskActions,
    } = req.body as Partial<ForgeTenantPolicy>;

    const callerTenantId = req.user?.orgs?.[0]?.orgId?.toString() ?? null;
    const isSuperAdmin = req.user?.roles?.includes("super_admin") || req.user?.roles?.includes("admin");

    const tenantId = isSuperAdmin ? (bodyTenantId ?? callerTenantId) : callerTenantId;

    if (!tenantId || !defaultApprovalClass) {
      sendBadRequest(res, "tenantId and defaultApprovalClass are required");
      return;
    }

    if (!isSuperAdmin && bodyTenantId && bodyTenantId !== callerTenantId) {
      sendBadRequest(res, "Cannot register policy for a different tenant");
      return;
    }

    forgeRuntime.registerTenantPolicy({
      tenantId,
      defaultApprovalClass,
      allowedDomains: allowedDomains ?? [],
      allowedTools: allowedTools ?? [],
      maxConcurrentExecutions: maxConcurrentExecutions ?? 5,
      maxCostPerExecutionUsd,
      requiresDryRunFirst: requiresDryRunFirst ?? false,
      highRiskActions: highRiskActions ?? [],
    });

    sendCreated(res, { tenantId, registered: true });
  } catch (err) {
    handleRouteError(res, err, "FORGE tenant-policy");
  }
});

export default router;
