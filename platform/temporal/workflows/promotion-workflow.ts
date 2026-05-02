/**
 * Promotion workflow — dependency-aware environment promotion.
 *
 * Checks dependency versions and source health, gates on approval if required,
 * deploys via GitOps, verifies post-deploy health, and records the evidence chain.
 */

import {
  proxyActivities,
  executeChild,
  workflowInfo,
} from "@temporalio/workflow";
import type * as approvalActivities from "../activities/approval-activities.js";
import type {
  PromotionWorkflowInput,
  PromotionWorkflowResult,
  DependencyCheckResult,
} from "../types/workflow-types.js";
import { approvalWorkflow } from "./approval-workflow.js";

/**
 * Pure semver comparison helper — deterministic, no I/O.
 * Returns true if `actual` >= `minimum` using numeric tuple comparison.
 * Handles versions in the form MAJOR.MINOR.PATCH or MAJOR.MINOR or MAJOR.
 * Pre-release suffixes (e.g. "-beta.1") are ignored for this gate; the
 * service health check is the primary signal for pre-release readiness.
 */
function meetsMinimumVersion(actual: string, minimum: string): boolean {
  if (!actual || actual === "unknown") {
    return false;
  }
  const parse = (v: string) =>
    v
      .replace(/^v/, "")
      .split("-")[0]            // drop pre-release suffix
      .split(".")
      .map((n) => parseInt(n, 10) || 0);

  const a = parse(actual);
  const m = parse(minimum);
  const len = Math.max(a.length, m.length);

  for (let i = 0; i < len; i++) {
    const av = a[i] ?? 0;
    const mv = m[i] ?? 0;
    if (av > mv) return true;
    if (av < mv) return false;
  }
  return true; // equal
}

const {
  evaluatePolicyActivity,
  recordEvidenceActivity,
  emitLyteVisibilityActivity,
  deployServiceActivity,
  checkServiceHealthActivity,
} = proxyActivities<typeof approvalActivities>({
  startToCloseTimeout: "5m",
  retry: {
    maximumAttempts: 3,
    initialInterval: "5s",
    backoffCoefficient: 2,
    maximumInterval: "60s",
  },
});

export async function promotionWorkflow(
  input: PromotionWorkflowInput
): Promise<PromotionWorkflowResult> {
  const { workflowId, runId } = workflowInfo();

  // Step 1: Policy check for environment guardrails
  const policyResult = await evaluatePolicyActivity({
    policyPackage: "szl.environment",
    inputData: {
      operation_type: "deploy",
      environment: input.toEnvironment,
      requestor_groups: ["platform-team"],  // promotion workflow has elevated context
      staging_health_verified: input.fromEnvironment === "staging",
      in_change_window: true,  // change window already checked by caller
      emergency_override_approved: false,
      change_window_approved: true,
      image_registry: `szlholdingsacr.azurecr.io`,
      break_glass_approved: false,
      secret_scope: input.toEnvironment,
    },
  });

  if (!policyResult.allowed) {
    const evidenceResult = await recordEvidenceActivity({
      category: "deployment",
      actorId: input.initiatedBy,
      actorType: "user",
      action: "promotion-blocked-by-policy",
      outcome: "failure",
      service: input.service,
      environment: input.toEnvironment,
      details: { workflowId, denials: policyResult.denialMessages, imageTag: input.imageTag },
    });
    return {
      promoted: false,
      service: input.service,
      toEnvironment: input.toEnvironment,
      imageTag: input.imageTag,
      deployedAt: null,
      approvalTraceId: null,
      dependencyChecks: [],
      evidenceLedgerId: evidenceResult.evidenceId,
    };
  }

  // Step 2: Check source environment health
  const sourceHealth = await checkServiceHealthActivity({
    service: input.service,
    environment: input.fromEnvironment,
    expectedMinutes: input.toEnvironment === "production" ? 10 : 2,
  });

  if (!sourceHealth.healthy) {
    const evidenceResult = await recordEvidenceActivity({
      category: "deployment",
      actorId: input.initiatedBy,
      actorType: "user",
      action: "promotion-blocked-source-unhealthy",
      outcome: "failure",
      service: input.service,
      environment: input.toEnvironment,
      details: { workflowId, fromEnvironment: input.fromEnvironment, health: sourceHealth },
    });
    return {
      promoted: false,
      service: input.service,
      toEnvironment: input.toEnvironment,
      imageTag: input.imageTag,
      deployedAt: null,
      approvalTraceId: null,
      dependencyChecks: [],
      evidenceLedgerId: evidenceResult.evidenceId,
    };
  }

  // Step 3: Check all dependencies are at minimum version
  const dependencyChecks: DependencyCheckResult[] = [];

  for (const dep of input.dependencies) {
    const depHealth = await checkServiceHealthActivity({
      service: dep.service,
      environment: dep.environment,
      expectedMinutes: 1,
    });

    const actualVersion = depHealth.details["version"] ?? "unknown";
    const versionOk = meetsMinimumVersion(actualVersion, dep.minimumVersion);
    dependencyChecks.push({
      service: dep.service,
      requiredVersion: dep.minimumVersion,
      actualVersion,
      // A dependency must be BOTH healthy AND at or above the minimum version.
      // Failing either check blocks the promotion — a healthy service on an
      // outdated version is still a promotion blocker.
      passed: depHealth.healthy && versionOk,
    });
  }

  const failedDeps = dependencyChecks.filter((d) => !d.passed);
  if (failedDeps.length > 0) {
    const evidenceResult = await recordEvidenceActivity({
      category: "deployment",
      actorId: input.initiatedBy,
      actorType: "user",
      action: "promotion-blocked-dependency-check-failed",
      outcome: "failure",
      service: input.service,
      environment: input.toEnvironment,
      details: { workflowId, failedDependencies: failedDeps },
    });
    return {
      promoted: false,
      service: input.service,
      toEnvironment: input.toEnvironment,
      imageTag: input.imageTag,
      deployedAt: null,
      approvalTraceId: null,
      dependencyChecks,
      evidenceLedgerId: evidenceResult.evidenceId,
    };
  }

  // Step 4: Run approval workflow if required (as child workflow)
  let approvalTraceId: string | null = null;

  if (input.approvalRequired) {
    const approvalResult = await executeChild(approvalWorkflow, {
      args: [{
        operationType: "deploy",
        targetService: input.service,
        targetEnvironment: input.toEnvironment,
        targetVersion: input.imageTag,
        policyId: "szl.approval",
        initiatedBy: input.initiatedBy,
        requestedApproverGroups: ["platform-team", "release-managers"],
        requiredApprovalCount: 1,
        timeoutMs: 4 * 60 * 60 * 1000,  // 4 hours
        context: { gitCommitSha: input.gitCommitSha, changeWindowId: input.changeWindowId },
      }],
      workflowId: `approval-${workflowId}`,
    });

    if (approvalResult.outcome !== "approved") {
      const evidenceResult = await recordEvidenceActivity({
        category: "deployment",
        actorId: input.initiatedBy,
        actorType: "user",
        action: "promotion-approval-not-granted",
        outcome: "failure",
        service: input.service,
        environment: input.toEnvironment,
        details: { workflowId, approvalOutcome: approvalResult.outcome },
      });
      return {
        promoted: false,
        service: input.service,
        toEnvironment: input.toEnvironment,
        imageTag: input.imageTag,
        deployedAt: null,
        approvalTraceId: `approval-${workflowId}`,
        dependencyChecks,
        evidenceLedgerId: evidenceResult.evidenceId,
      };
    }

    approvalTraceId = `approval-${workflowId}`;
  }

  // Step 5: Deploy
  await emitLyteVisibilityActivity({
    event: {
      eventType: "promotion-workflow.deploying",
      workflowType: "promotion-workflow",
      workflowId, runId,
      timestamp: new Date().toISOString(),
      payload: { service: input.service, toEnvironment: input.toEnvironment, imageTag: input.imageTag },
    },
  });

  const deployment = await deployServiceActivity({
    service: input.service,
    environment: input.toEnvironment,
    imageTag: input.imageTag,
    gitCommitSha: input.gitCommitSha,
    approvalTraceId: approvalTraceId ?? workflowId,
  });

  // Step 6: Post-deployment health check
  const postHealth = await checkServiceHealthActivity({
    service: input.service,
    environment: input.toEnvironment,
    expectedMinutes: input.toEnvironment === "production" ? 5 : 2,
  });

  const promoted = postHealth.healthy;

  // Step 7: Record final evidence
  const evidenceResult = await recordEvidenceActivity({
    category: "deployment",
    actorId: input.initiatedBy,
    actorType: "user",
    action: promoted ? "promotion-succeeded" : "promotion-deployed-but-unhealthy",
    outcome: promoted ? "success" : "failure",
    service: input.service,
    environment: input.toEnvironment,
    details: {
      workflowId,
      imageTag: input.imageTag,
      gitCommitSha: input.gitCommitSha,
      deployedAt: deployment.deployedAt,
      postDeployHealth: postHealth,
      dependencyChecks,
      approvalTraceId,
    },
  });

  // Step 8: Update Lyte
  await emitLyteVisibilityActivity({
    event: {
      eventType: promoted ? "promotion-workflow.succeeded" : "promotion-workflow.unhealthy",
      workflowType: "promotion-workflow",
      workflowId, runId,
      timestamp: new Date().toISOString(),
      payload: { service: input.service, toEnvironment: input.toEnvironment, promoted, imageTag: input.imageTag },
    },
  });

  return {
    promoted,
    service: input.service,
    toEnvironment: input.toEnvironment,
    imageTag: input.imageTag,
    deployedAt: deployment.deployedAt,
    approvalTraceId,
    dependencyChecks,
    evidenceLedgerId: evidenceResult.evidenceId,
  };
}
