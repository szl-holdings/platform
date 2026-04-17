import { RunManager } from "@workspace/alloy/run-manager";
import { defaultLedger } from "@workspace/alloy/ledger";
import type { ApprovalGate } from "@workspace/alloy/types";
import { createApprovalRequest } from "@szl-holdings/covenant-policy";
import { logger } from "./logger";

const dbApprovalGate: ApprovalGate = {
  async requestApproval(params) {
    try {
      const orgIdNum =
        typeof params.orgId === "number"
          ? params.orgId
          : typeof params.orgId === "string" && params.orgId.trim() !== ""
            ? Number.parseInt(params.orgId, 10)
            : null;
      const requestedByIdNum =
        typeof params.requestedById === "number"
          ? params.requestedById
          : typeof params.requestedById === "string" && params.requestedById.trim() !== ""
            ? Number.parseInt(params.requestedById, 10)
            : null;
      const approval = await createApprovalRequest({
        orgId: Number.isFinite(orgIdNum as number) ? (orgIdNum as number) : null,
        resourceType: "alloy.run.step",
        resourceId: `${params.runId}:${params.stepId}`,
        title: `Guardian approval required: ${params.stepId}`,
        description: params.reason,
        actionClass: params.tier ?? "general",
        priority: params.tier === "human-approval-mandatory" ? "critical" : "high",
        requestedById: Number.isFinite(requestedByIdNum as number) ? (requestedByIdNum as number) : null,
        requestedByRole: params.requestedByRole,
        requiredApproverRole: params.requiredApprovers?.[0],
        serviceAttribution: "alloy.run-manager",
        correlationId: params.runId,
        payload: {
          runId: params.runId,
          workflowId: params.workflowId,
          agentId: params.agentId ?? null,
          stepId: params.stepId,
          stepIndex: params.stepIndex,
          reason: params.reason,
          matchedRuleId: params.matchedRuleId ?? null,
          tier: params.tier ?? null,
          requiredApprovers: params.requiredApprovers ?? [],
          context: params.context ?? {},
        },
        metadata: {
          source: "guardian",
          runId: params.runId,
          stepId: params.stepId,
        },
      });
      return { approvalId: approval.id, status: "pending" };
    } catch (err) {
      logger.error({ err, runId: params.runId }, "alloy.approval-gate.create-failed");
      return undefined;
    }
  },
};

let singleton: RunManager | null = null;

export function getAlloyRunManager(): RunManager {
  if (!singleton) {
    singleton = new RunManager({ ledger: defaultLedger, approvalGate: dbApprovalGate });
  }
  return singleton;
}
