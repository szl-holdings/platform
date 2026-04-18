import { Router, type IRouter, type Request, type Response } from "express";
import { sendSuccess, sendNotFound, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";

const router: IRouter = Router();

type RemediationStatus = "executing" | "pending_approval" | "completed" | "failed" | "queued";
type PatternType = "restart" | "scale" | "failover" | "clear_queue" | "rollback";

interface RemediationStep {
  id: string;
  action: string;
  status: "done" | "running" | "pending" | "failed";
  durationMs?: number;
}

interface RemediationRun {
  id: string;
  patternId: string;
  patternName: string;
  patternType: PatternType;
  triggerSignal: string;
  service: string;
  detectedAt: number;
  startedAt?: number;
  completedAt?: number;
  status: RemediationStatus;
  steps: RemediationStep[];
  mttrSavedMins: number;
  approver?: string;
  auditRef: string;
}

interface FailurePattern {
  id: string;
  name: string;
  type: PatternType;
  matchCount: number;
  successRate: number;
  avgMttrSavedMins: number;
  enabled: boolean;
  trigger: string;
  runbook: string;
}

const PATTERNS: FailurePattern[] = [
  { id: "p1", name: "Service Restart on OOM", type: "restart", matchCount: 142, successRate: 97.2, avgMttrSavedMins: 34, enabled: true, trigger: "OOM kill detected on pod", runbook: "RUNBOOK-001: Drain → Restart → Health-check → Reroute" },
  { id: "p2", name: "Auto-Scale on CPU Saturation", type: "scale", matchCount: 89, successRate: 94.4, avgMttrSavedMins: 18, enabled: true, trigger: "CPU > 85% for 5 consecutive minutes", runbook: "RUNBOOK-002: Scale +2 replicas → Verify HPA → Alert" },
  { id: "p3", name: "DB Failover on Primary Failure", type: "failover", matchCount: 12, successRate: 100, avgMttrSavedMins: 87, enabled: true, trigger: "Primary DB health check failures > 3", runbook: "RUNBOOK-003: Promote replica → Update DNS → Validate" },
  { id: "p4", name: "Queue Drain on Backlog Overflow", type: "clear_queue", matchCount: 204, successRate: 88.7, avgMttrSavedMins: 12, enabled: true, trigger: "Queue depth > 50k messages for 3 min", runbook: "RUNBOOK-004: Pause producers → Drain → Flush DLQ → Resume" },
  { id: "p5", name: "Canary Rollback on Error Spike", type: "rollback", matchCount: 28, successRate: 92.9, avgMttrSavedMins: 55, enabled: false, trigger: "Error rate delta > 5% vs baseline on new deploy", runbook: "RUNBOOK-005: Halt canary → Shift traffic → Rollback image" },
];

function buildRuns(): RemediationRun[] {
  const now = Date.now();
  return [
    {
      id: "REM-4821",
      patternId: "p1",
      patternName: "Service Restart on OOM",
      patternType: "restart",
      triggerSignal: "api-gateway pod OOM kill — 3 restarts in 10m",
      service: "api-gateway",
      detectedAt: now - 4 * 60000,
      startedAt: now - 3.5 * 60000,
      status: "executing",
      steps: [
        { id: "s1", action: "Drain existing connections", status: "done", durationMs: 1240 },
        { id: "s2", action: "Signal graceful shutdown", status: "done", durationMs: 890 },
        { id: "s3", action: "Restart pod & await ready state", status: "running" },
        { id: "s4", action: "Run health check suite", status: "pending" },
        { id: "s5", action: "Re-route traffic and verify", status: "pending" },
      ],
      mttrSavedMins: 34,
      auditRef: "AUD-2024-4821",
    },
    {
      id: "REM-4819",
      patternId: "p4",
      patternName: "Queue Drain on Backlog Overflow",
      patternType: "clear_queue",
      triggerSignal: "ml-inference queue depth 78k messages",
      service: "ml-inference",
      detectedAt: now - 22 * 60000,
      startedAt: now - 21 * 60000,
      completedAt: now - 14 * 60000,
      status: "completed",
      steps: [
        { id: "s1", action: "Pause message producers", status: "done", durationMs: 320 },
        { id: "s2", action: "Drain backlog queue", status: "done", durationMs: 4100 },
        { id: "s3", action: "Flush dead letter queue", status: "done", durationMs: 880 },
        { id: "s4", action: "Resume producers & validate", status: "done", durationMs: 540 },
      ],
      mttrSavedMins: 12,
      auditRef: "AUD-2024-4819",
    },
    {
      id: "REM-4817",
      patternId: "p2",
      patternName: "Auto-Scale on CPU Saturation",
      patternType: "scale",
      triggerSignal: "auth-service CPU at 91% for 6 consecutive minutes",
      service: "auth-service",
      detectedAt: now - 45 * 60000,
      status: "pending_approval",
      steps: [
        { id: "s1", action: "Scale +2 replicas via HPA", status: "pending" },
        { id: "s2", action: "Verify pod readiness", status: "pending" },
        { id: "s3", action: "Alert on-call engineer", status: "pending" },
      ],
      mttrSavedMins: 18,
      approver: "ops-manager",
      auditRef: "AUD-2024-4817",
    },
    {
      id: "REM-4815",
      patternId: "p1",
      patternName: "Service Restart on OOM",
      patternType: "restart",
      triggerSignal: "data-pipeline OOM kill",
      service: "data-pipeline",
      detectedAt: now - 3 * 3600000,
      startedAt: now - 3 * 3600000 + 30000,
      completedAt: now - 3 * 3600000 + 95000,
      status: "completed",
      steps: [
        { id: "s1", action: "Drain existing connections", status: "done", durationMs: 980 },
        { id: "s2", action: "Signal graceful shutdown", status: "done", durationMs: 720 },
        { id: "s3", action: "Restart pod & await ready state", status: "done", durationMs: 28000 },
        { id: "s4", action: "Run health check suite", status: "done", durationMs: 3200 },
        { id: "s5", action: "Re-route traffic and verify", status: "done", durationMs: 1100 },
      ],
      mttrSavedMins: 34,
      auditRef: "AUD-2024-4815",
    },
    {
      id: "REM-4812",
      patternId: "p3",
      patternName: "DB Failover on Primary Failure",
      patternType: "failover",
      triggerSignal: "postgres-primary health check failed 4 times",
      service: "postgres-primary",
      detectedAt: now - 7 * 3600000,
      startedAt: now - 7 * 3600000 + 5000,
      completedAt: now - 7 * 3600000 + 92000,
      status: "completed",
      steps: [
        { id: "s1", action: "Promote replica to primary", status: "done", durationMs: 18000 },
        { id: "s2", action: "Update DNS records", status: "done", durationMs: 4200 },
        { id: "s3", action: "Validate connection pool", status: "done", durationMs: 6700 },
      ],
      mttrSavedMins: 87,
      auditRef: "AUD-2024-4812",
    },
  ];
}

router.get("/self-healing/stats", authMiddleware({ required: false }), (_req: Request, res: Response) => {
  try {
    const runs = buildRuns();
    const completed = runs.filter(r => r.status === "completed");
    const executing = runs.filter(r => r.status === "executing");
    const pendingApproval = runs.filter(r => r.status === "pending_approval");
    const totalMttrSaved = completed.reduce((s, r) => s + r.mttrSavedMins, 0);
    const eligible = runs.filter(r => r.status !== "pending_approval" && r.status !== "queued");
    const successRate = eligible.length > 0
      ? Math.round((completed.length / eligible.length) * 100)
      : 0;

    sendSuccess(res, {
      totalRuns: runs.length,
      executing: executing.length,
      pendingApproval: pendingApproval.length,
      completed: completed.length,
      totalMttrSavedMins: totalMttrSaved,
      successRate,
      patternsActive: PATTERNS.filter(p => p.enabled).length,
      patternsTotal: PATTERNS.length,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch self-healing stats");
  }
});

router.get("/self-healing/policies", authMiddleware({ required: false }), (_req: Request, res: Response) => {
  try {
    sendSuccess(res, { policies: PATTERNS });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch self-healing policies");
  }
});

router.patch("/self-healing/policies/:id/toggle", authMiddleware({ required: true }), (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const pattern = PATTERNS.find(p => p.id === id);
    if (!pattern) {
      sendNotFound(res, "Policy");
      return;
    }
    pattern.enabled = !pattern.enabled;
    sendSuccess(res, { policy: pattern });
  } catch (err) {
    handleRouteError(res, err, "Failed to toggle self-healing policy");
  }
});

router.get("/self-healing/runs", authMiddleware({ required: false }), (req: Request, res: Response) => {
  try {
    const runs = buildRuns();
    const { status, patternId, limit } = req.query as { status?: string; patternId?: string; limit?: string };
    let filtered = runs;
    if (status) filtered = filtered.filter(r => r.status === status);
    if (patternId) filtered = filtered.filter(r => r.patternId === patternId);
    const take = Math.min(parseInt(limit ?? "50", 10) || 50, 100);
    sendSuccess(res, { runs: filtered.slice(0, take), total: filtered.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch self-healing runs");
  }
});

router.get("/self-healing/runs/:id", authMiddleware({ required: false }), (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const run = buildRuns().find(r => r.id === id);
    if (!run) { sendNotFound(res, "Run"); return; }
    sendSuccess(res, { run });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch self-healing run");
  }
});

export default router;
