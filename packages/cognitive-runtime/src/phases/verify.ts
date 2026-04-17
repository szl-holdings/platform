import { randomUUID } from "crypto";
import { verify } from "@workspace/verifier/engine";
import type { VerifierOutput, VerifierContext, VerifierDecision } from "@workspace/verifier";
import type { PhaseResult } from "../types.js";
import type { ExecutePhaseOutput } from "./execute.js";

export interface VerifyPhaseOptions {
  traceId: string;
  planId?: string;
  domain?: string;
  disabledChecks?: string[];
  maxRevisions?: number;
  currentRevision?: number;
}

export interface VerifyPhaseOutput {
  verifierId: string;
  decision: VerifierDecision;
  passed: boolean;
  action: VerifierDecision["action"];
  overallScore: number;
  blockerCount: number;
  warningCount: number;
  reasoning: string;
  needsRevision: boolean;
  revisionNumber: number;
  summary: string;
}

export async function verifyPhase(
  executeOutput: ExecutePhaseOutput,
  opts: VerifyPhaseOptions,
): Promise<PhaseResult & { output: VerifyPhaseOutput }> {
  const startedAt = Date.now();
  const verifierId = `verif-${randomUUID()}`;
  const revisionNumber = opts.currentRevision ?? 0;

  const outputText = executeOutput.stepResults
    .filter((r) => r.status === "completed")
    .map((r) => JSON.stringify(r.output))
    .join("\n");

  const verifierOutput: VerifierOutput = {
    text: outputText || "No output produced.",
    confidence: executeOutput.completedSteps / Math.max(1, executeOutput.stepResults.length),
    providedFields: executeOutput.stepResults
      .filter((r) => r.status === "completed")
      .map((r) => r.stepId),
    requiredFields: executeOutput.stepResults.map((r) => r.stepId),
    metadata: {
      completedSteps: executeOutput.completedSteps,
      failedSteps: executeOutput.failedSteps,
      totalDurationMs: executeOutput.totalDurationMs,
    },
  };

  const verifierContext: Partial<VerifierContext> = {
    domain: opts.domain,
    evidenceMinPerClaim: 0,
    maxUncitedClaims: 999,
    disabledChecks: opts.disabledChecks ?? ["evidence", "citation"],
    metadata: {
      traceId: opts.traceId,
      planId: opts.planId,
      revisionNumber,
    },
  };

  const target = {
    targetType: "output" as const,
    targetId: verifierId,
    traceId: opts.traceId,
    planId: opts.planId,
  };

  const decision = verify(verifierOutput, target, verifierContext);

  const passed = decision.action === "approve";
  const needsRevision =
    !passed &&
    (decision.action === "revise" || decision.action === "request_more_evidence") &&
    revisionNumber < (opts.maxRevisions ?? 2);

  const output: VerifyPhaseOutput = {
    verifierId,
    decision,
    passed,
    action: decision.action,
    overallScore: decision.overallScore,
    blockerCount: decision.blockerCount,
    warningCount: decision.warningCount,
    reasoning: decision.reasoning,
    needsRevision,
    revisionNumber,
    summary:
      `Verifier decision: ${decision.action.toUpperCase()} ` +
      `(score=${decision.overallScore.toFixed(2)}, ` +
      `blockers=${decision.blockerCount}, warnings=${decision.warningCount}). ` +
      `Revision ${revisionNumber}/${opts.maxRevisions ?? 2}.`,
  };

  const completedAt = Date.now();
  return {
    phase: "verify",
    status: decision.action === "block" ? "blocked" : "ok",
    startedAt,
    completedAt,
    durationMs: completedAt - startedAt,
    output,
    retryCount: revisionNumber,
    metadata: { verifierId, action: decision.action, passed },
    error:
      decision.action === "block"
        ? `Verifier blocked: ${decision.reasoning}`
        : undefined,
  };
}
