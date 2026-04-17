import type { CognitiveLoopRun } from "./types.js";

export interface ExecutiveBrief {
  briefId: string;
  runId: string;
  objective: string;
  generatedAt: string;
  status: CognitiveLoopRun["status"];
  executiveSummary: string;
  worldModelHighlights: {
    entityCount: number;
    riskScore: number;
    noveltyScore: number;
    anomaliesDetected: string[];
  };
  planSummary: {
    planId?: string;
    stepCount: number;
    completedSteps: number;
    failedSteps: number;
    planRevisions: number;
  };
  verifySummary: {
    verifyAttempts: number;
    finalVerdict: string;
  };
  lesson?: string;
  recommendations: string[];
  durationMs?: number;
}

export function generateExecutiveBrief(run: CognitiveLoopRun): ExecutiveBrief {
  const worldModel = run.worldModelUpdate;
  const execPhase = run.phases.find((p) => p.phase === "execute");
  const verifyPhase = run.phases.find((p) => p.phase === "verify");
  const reflectPhase = run.phases.find((p) => p.phase === "reflect");

  const execOut = execPhase?.output as
    | { completedSteps?: number; failedSteps?: number }
    | undefined;
  const verifyOut = verifyPhase?.output as
    | { action?: string; overallScore?: number }
    | undefined;
  const reflectOut = reflectPhase?.output as
    | { lesson?: string; whatToTryNext?: string[] }
    | undefined;

  const completedSteps = execOut?.completedSteps ?? run.stepResults.filter((s) => s.status === "completed").length;
  const failedSteps = execOut?.failedSteps ?? run.stepResults.filter((s) => s.status === "failed").length;

  const statusLabel =
    run.status === "completed"
      ? "✓ Completed"
      : run.status === "guardian_blocked"
        ? "⚠ Blocked by safety guardian"
        : run.status === "pending_approval"
          ? "⏳ Awaiting human approval"
          : `✗ ${run.status}`;

  const executiveSummary = [
    `Cognitive run for objective: "${run.objective.slice(0, 120)}${run.objective.length > 120 ? "..." : ""}".`,
    `Status: ${statusLabel}.`,
    completedSteps > 0
      ? `Executed ${completedSteps} plan step(s)${failedSteps > 0 ? `, ${failedSteps} failed` : " successfully"}.`
      : "No steps were executed.",
    verifyOut ? `Verifier verdict: ${verifyOut.action ?? "N/A"} (score=${(verifyOut.overallScore ?? 0).toFixed(2)}).` : "",
    reflectOut?.lesson ? `Key lesson: ${reflectOut.lesson.slice(0, 200)}.` : "",
    `Run duration: ${run.durationMs ? `${run.durationMs}ms` : "N/A"}.`,
  ]
    .filter(Boolean)
    .join(" ");

  const recommendations: string[] = [
    ...(reflectOut?.whatToTryNext ?? []).slice(0, 3),
    ...(worldModel && worldModel.detectedAnomalies.length > 0
      ? [`Review detected anomalies: ${worldModel.detectedAnomalies.slice(0, 2).join(", ")}.`]
      : []),
  ];

  return {
    briefId: `brief-${run.runId}`,
    runId: run.runId,
    objective: run.objective,
    generatedAt: new Date().toISOString(),
    status: run.status,
    executiveSummary,
    worldModelHighlights: {
      entityCount: worldModel?.entities.length ?? 0,
      riskScore: worldModel?.riskScore ?? 0,
      noveltyScore: worldModel?.noveltyScore ?? 0,
      anomaliesDetected: worldModel?.detectedAnomalies ?? [],
    },
    planSummary: {
      planId: run.planId,
      stepCount: run.stepResults.length,
      completedSteps,
      failedSteps,
      planRevisions: run.planRevisions ?? 0,
    },
    verifySummary: {
      verifyAttempts: (run.verifyRevisions ?? 0) + (run.phases.some((p) => p.phase === "verify") ? 1 : 0),
      finalVerdict: verifyOut?.action ?? "not_verified",
    },
    lesson: reflectOut?.lesson,
    recommendations,
    durationMs: run.durationMs,
  };
}
