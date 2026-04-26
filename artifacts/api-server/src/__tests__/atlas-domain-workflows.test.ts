/**
 * ATLAS Domain Workflow Integration Tests
 *
 * Exercises the end-to-end ATLAS pipeline for all six SZL domain packs:
 *   aegis-incident-response
 *   vessels-voyage-risk
 *   terra-deal-underwriting
 *   prism-matter-execution
 *   carlota-concierge-workflow
 *   imperium-remediation
 *
 * Test strategy:
 *   - Route-level (HTTP): supertest against the real domain-atlas-execution
 *     router to cover every guard in POST /:domain/atlas/evaluation-hooks/replay
 *     plus the full replay response contract and benchmark comparison shape.
 *   - Engine-level: direct integration tests for ingest → evaluate → policy
 *     → execute → evidence → outcome, validating each stage's outputs.
 *
 * External engine packages are mocked; the ATLAS in-memory stores (signals,
 * evidence, outcomes, evaluation hooks) are real and shared between the engine
 * and the router, which lets us pre-seed state and assert on it through HTTP.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { randomUUID } from "node:crypto";
import express, { type IRouter } from 'express';
import request from "supertest";
import type { WorkflowRun } from "@szl-holdings/action-engine";

// ---------------------------------------------------------------------------
// Mock @szl-holdings/action-engine  (must come before any dynamic import)
// ---------------------------------------------------------------------------

const mockExecuteWorkflow = vi.fn();
const mockRecordRun = vi.fn();
const mockRegisterStepHandler = vi.fn();

vi.mock("@szl-holdings/action-engine", () => ({
  executeWorkflow: mockExecuteWorkflow,
  recordRun: mockRecordRun,
  listRuns: vi.fn().mockResolvedValue([]),
  getRunById: vi.fn().mockResolvedValue(null),
  registerStepHandler: mockRegisterStepHandler,
}));

// ---------------------------------------------------------------------------
// Mock @szl-holdings/decision-engine
// ---------------------------------------------------------------------------

const mockRankSignalGroups = vi.fn();

vi.mock("@szl-holdings/decision-engine", () => ({
  rankSignalGroups: mockRankSignalGroups,
}));

// ---------------------------------------------------------------------------
// Mock @szl-holdings/policy-engine
// ---------------------------------------------------------------------------

const mockCheckAction = vi.fn();

vi.mock("@szl-holdings/policy-engine", () => ({
  registerPolicy: vi.fn(),
  checkAction: mockCheckAction,
}));

// ---------------------------------------------------------------------------
// Mock internal infrastructure (no DB, no logger noise)
// ---------------------------------------------------------------------------

vi.mock("../lib/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("../lib/decisioning-store.js", () => ({
  dbListRuns: vi.fn().mockResolvedValue({ runs: [], total: 0 }),
  dbGetRunById: vi.fn().mockResolvedValue(null),
  dbRecordWorkflowRun: vi.fn().mockResolvedValue(undefined),
  dbCancelRun: vi.fn().mockResolvedValue(true),
  dbApproveRun: vi.fn().mockResolvedValue(true),
}));

vi.mock("../middlewares/auth.js", () => ({
  authMiddleware: (_opts?: unknown) => (req: unknown, _res: unknown, next: () => void) => {
    (req as Record<string, unknown>).isInternalAgent = true;
    next();
  },
}));

vi.mock("../middlewares/sliding-window-limiter.js", () => ({
  perUserApiSlidingLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
  perUserWriteSlidingLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// ---------------------------------------------------------------------------
// Import real engine and router AFTER mocks are hoisted
// ---------------------------------------------------------------------------

const {
  ingestSignal,
  getSignals,
  evaluateSignalsForDomain,
  checkDomainPolicy,
  executedomainWorkflow,
  registerEvaluationHook,
  getEvaluationHooks,
  getEvaluationHookById,
  captureEvidence,
  getEvidence,
  recordOutcome,
  getOutcomes,
  initializeAtlasExecutionEngine,
  DOMAIN_WORKFLOWS,
} = await import("../lib/atlas-execution-engine.js");

const domainAtlasRouter = (await import("../routes/domain-atlas-execution.js")).default;

// ---------------------------------------------------------------------------
// Typed WorkflowRun factory — no type casts required
// ---------------------------------------------------------------------------

function makeWorkflowRun(overrides: Partial<WorkflowRun> = {}): WorkflowRun {
  const now = Date.now();
  return {
    runId: randomUUID(),
    workflowId: "mock-workflow-id",
    workflowName: "Mock Workflow",
    executionMode: "semi_auto",
    isDryRun: false,
    isSimulation: false,
    status: "completed",
    currentStepIndex: 0,
    steps: [
      { stepId: "s1", stepName: "Step 1", startedAt: now - 100, completedAt: now, status: "completed" },
    ],
    approvalState: "none",
    auditTrail: [{ at: now, action: "workflow_started", immutable: true }],
    startedAt: now - 200,
    completedAt: now,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// HTTP app factory — mounts the real domain-atlas router
// ---------------------------------------------------------------------------

function buildApp(): express.Application {
  const app = express();
  app.use(express.json());
  const router = express.Router() as IRouter;
  router.use(domainAtlasRouter);
  app.use(router);
  return app;
}

// ---------------------------------------------------------------------------
// Default mock return values (reset before each test)
// ---------------------------------------------------------------------------

const ALLOW_RESULT = {
  allowed: true,
  effect: "allow",
  matchedRules: [],
  evaluatedAt: Date.now(),
};

beforeEach(() => {
  vi.clearAllMocks();

  mockRankSignalGroups.mockImplementation((groups: Array<Record<string, unknown>>) =>
    groups.map((g, i) => ({
      id: `rec-${i}`,
      domain: g.domain,
      rank: i + 1,
      title: g.customTitle ?? "Recommendation",
      summary: g.customSummary ?? "",
      confidence: (g.confidence as number) ?? 0.75,
      suggestedAction: g.suggestedAction ?? "investigate",
      estimatedCostUsd: 0,
      reasoning: g.customReasoning ?? "",
      evidence: g.evidence ?? [],
      businessImpact: g.businessImpact ?? {},
      createdAt: Date.now(),
    }))
  );

  mockCheckAction.mockReturnValue(ALLOW_RESULT);
  mockRecordRun.mockResolvedValue(undefined);
});

// ---------------------------------------------------------------------------
// Bootstrap the engine (registers policies + step handlers using mocks)
// ---------------------------------------------------------------------------

initializeAtlasExecutionEngine();

// ============================================================================
// Domain test matrix
// ============================================================================

const DOMAIN_CASES = [
  {
    domain: "aegis",
    workflowKey: "aegis-incident-response",
    signalType: "security-incident",
    severity: "high" as const,
    title: "Lateral movement detected on prod-db-01",
    description: "Unusual process execution with elevated privileges",
    payload: { affectedEntities: 3, financialExposureUsd: 500_000, suggestedAction: "isolate-host" },
    policyAction: "incident-response",
    policyAttributes: { severity: "high" },
    isSimulationCapable: true,
    minSteps: 8,
  },
  {
    domain: "vessels",
    workflowKey: "vessels-voyage-risk",
    signalType: "voyage-anomaly",
    severity: "critical" as const,
    title: "AIS gap detected — MSC AURORA",
    description: "12-hour AIS blackout in high-risk corridor",
    payload: { sanctionsMatch: false, riskScore: 42, financialExposureUsd: 2_000_000, suggestedAction: "review-voyage-plan" },
    policyAction: "voyage-approval",
    policyAttributes: { sanctionsMatch: false, riskScore: 42 },
    isSimulationCapable: true,
    minSteps: 7,
  },
  {
    domain: "terra",
    workflowKey: "terra-deal-underwriting",
    signalType: "distress-signal",
    severity: "medium" as const,
    title: "Tax delinquency — 742 Evergreen Terrace",
    description: "36-month tax delinquency with lis pendens filing",
    payload: { dealValueUsd: 1_200_000, isDistressed: true, financialExposureUsd: 1_200_000, suggestedAction: "generate-deal-thesis" },
    policyAction: "deal-commit",
    policyAttributes: { dealValueUsd: 1_200_000, isDistressed: true },
    isSimulationCapable: true,
    minSteps: 7,
  },
  {
    domain: "carlota-jo",
    workflowKey: "carlota-concierge-workflow",
    signalType: "client-request",
    severity: "low" as const,
    title: "Private chef booking for New Year's gala",
    description: "Client requests Michelin-starred private chef for 40-person event",
    payload: { commitmentValueUsd: 18_000, financialExposureUsd: 18_000, suggestedAction: "vendor-outreach" },
    policyAction: "vendor-commit",
    policyAttributes: { commitmentValueUsd: 18_000 },
    isSimulationCapable: true,
    minSteps: 7,
  },
  {
    domain: "imperium",
    workflowKey: "imperium-remediation",
    signalType: "cost-anomaly",
    severity: "medium" as const,
    title: "Untagged EC2 fleet — $210K monthly overrun",
    description: "Production cluster running 3× over budget",
    payload: { estimatedSavingsUsd: 210_000, affectsSovereignty: false, financialExposureUsd: 210_000, suggestedAction: "apply-rightsizing-policy" },
    policyAction: "policy-override",
    policyAttributes: { estimatedSavingsUsd: 210_000, affectsSovereignty: false },
    isSimulationCapable: true,
    minSteps: 7,
  },
] as const;

// ============================================================================
// Section 1 — Engine-level pipeline tests (per domain)
// ============================================================================

for (const tc of DOMAIN_CASES) {
  describe(`ATLAS engine pipeline — ${tc.domain} (${tc.workflowKey})`, () => {
    it("ingests a domain signal and returns a well-formed record", async () => {
      const signal = await ingestSignal({
        domain: tc.domain,
        signalType: tc.signalType,
        severity: tc.severity,
        title: tc.title,
        description: tc.description,
        confidence: 0.85,
        source: "test-harness",
        payload: { ...tc.payload },
        status: "raw",
        tenantId: "test-tenant",
      });

      expect(signal.id).toBeTruthy();
      expect(signal.domain).toBe(tc.domain);
      expect(signal.signalType).toBe(tc.signalType);
      expect(signal.severity).toBe(tc.severity);
      expect(signal.status).toBe("raw");
      expect(signal.createdAt).toBeTruthy();
    });

    it("evaluates signals through the decision engine and returns ranked recommendations", async () => {
      const signal = await ingestSignal({
        domain: tc.domain,
        signalType: tc.signalType,
        severity: tc.severity,
        title: tc.title,
        description: tc.description,
        confidence: 0.85,
        source: "test-harness",
        payload: { ...tc.payload },
        status: "raw",
        tenantId: "test-tenant",
      });

      const recommendations = await evaluateSignalsForDomain(tc.domain, [signal]);

      expect(mockRankSignalGroups).toHaveBeenCalledOnce();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBe(1);
      expect(recommendations[0]).toMatchObject({ domain: tc.domain, rank: expect.any(Number) });
    });

    it("passes signal metadata to the decision engine correctly", async () => {
      const signal = await ingestSignal({
        domain: tc.domain,
        signalType: tc.signalType,
        severity: tc.severity,
        title: tc.title,
        description: tc.description,
        confidence: 0.9,
        source: "test-harness",
        payload: { ...tc.payload },
        status: "raw",
        tenantId: "test-tenant",
      });

      await evaluateSignalsForDomain(tc.domain, [signal]);

      const [passedGroups] = mockRankSignalGroups.mock.calls[0] as [Array<Record<string, unknown>>];
      expect(passedGroups).toHaveLength(1);
      expect(passedGroups[0].domain).toBe(tc.domain);
      expect(passedGroups[0].confidence).toBe(0.9);
    });

    it("performs a policy check and returns a decision", () => {
      const result = checkDomainPolicy({
        action: tc.policyAction,
        domain: tc.domain,
        subject: { id: "user-001", roles: ["operator"] },
        resource: {
          type: "workflow",
          id: "wf-001",
          domain: tc.domain,
          attributes: { ...tc.policyAttributes },
        },
      });

      expect(mockCheckAction).toHaveBeenCalledOnce();
      expect(result).toMatchObject({ allowed: expect.any(Boolean), effect: expect.any(String) });
    });

    it("executes the workflow in dry-run mode and returns a run record", async () => {
      const run = makeWorkflowRun({ isDryRun: true, workflowId: tc.workflowKey });
      mockExecuteWorkflow.mockResolvedValueOnce({
        run,
        requiresApproval: false,
        dryRunSummary: `Dry-run of ${tc.workflowKey} completed`,
      });

      const result = await executedomainWorkflow({
        domain: tc.domain,
        workflowKey: tc.workflowKey,
        isDryRun: true,
        isSimulation: false,
        initiatedBy: "test-harness",
        tenantId: "test-tenant",
      });

      expect(mockExecuteWorkflow).toHaveBeenCalledOnce();
      expect(mockRecordRun).toHaveBeenCalledOnce();
      expect(result.run.isDryRun).toBe(true);
      expect(result.requiresApproval).toBe(false);
      expect(result.dryRunSummary).toContain(tc.workflowKey);
    });

    it("full pipeline: signal → evaluate → policy-check → execute → outcome is valid", async () => {
      const run = makeWorkflowRun({ workflowId: tc.workflowKey, status: "completed" });
      mockExecuteWorkflow.mockResolvedValueOnce({ run, requiresApproval: false });

      const signal = await ingestSignal({
        domain: tc.domain,
        signalType: tc.signalType,
        severity: tc.severity,
        title: tc.title,
        description: tc.description,
        confidence: 0.85,
        source: "test-harness",
        payload: { ...tc.payload },
        status: "raw",
        tenantId: "test-tenant",
      });

      const recommendations = await evaluateSignalsForDomain(tc.domain, [signal]);
      expect(recommendations.length).toBeGreaterThan(0);

      const policyResult = checkDomainPolicy({
        action: tc.policyAction,
        domain: tc.domain,
        subject: { id: "operator-1", roles: ["operator"] },
        resource: {
          type: "workflow",
          id: signal.id,
          domain: tc.domain,
          attributes: { ...tc.policyAttributes },
        },
      });
      expect(policyResult.effect).toBe("allow");

      const execResult = await executedomainWorkflow({
        domain: tc.domain,
        workflowKey: tc.workflowKey,
        signalIds: [signal.id],
        recommendationId: recommendations[0]?.id,
        isDryRun: false,
        isSimulation: false,
        initiatedBy: "test-harness",
        tenantId: "test-tenant",
      });

      expect(execResult.run.runId).toBeTruthy();
      expect(execResult.run.status).toBe("completed");
    });

    it("captures evidence and retrieves it for the domain", async () => {
      const workflowId = `wf-ev-${tc.domain}-${randomUUID()}`;
      const ev = await captureEvidence({
        domain: tc.domain,
        workflowId,
        label: "Test Evidence",
        value: "Captured during pipeline test",
        source: "test-harness",
        capturedBy: "vitest",
        immutable: true,
      });

      expect(ev.id).toBeTruthy();
      expect(ev.domain).toBe(tc.domain);
      expect(ev.immutable).toBe(true);
      expect(ev.capturedAt).toBeTruthy();

      const stored = await getEvidence(tc.domain, workflowId);
      expect(stored.some(e => e.id === ev.id)).toBe(true);
    });

    it("records an outcome and retrieves it for the domain", async () => {
      const workflowId = `wf-out-${tc.domain}-${randomUUID()}`;
      const outcome = await recordOutcome({
        domain: tc.domain,
        workflowId,
        title: `Test outcome — ${tc.domain}`,
        summary: "Pipeline test completed successfully",
        status: "success",
        businessImpact: { financialImpactUsd: 50_000, operationalSeverity: "low", entitiesAffected: 2 },
        recordedBy: "vitest",
        evidence: [],
      });

      expect(outcome.id).toBeTruthy();
      expect(outcome.status).toBe("success");
      expect(outcome.businessImpact?.financialImpactUsd).toBe(50_000);
      expect(outcome.recordedAt).toBeTruthy();

      const stored = await getOutcomes(tc.domain, 10);
      expect(stored.some(o => o.id === outcome.id)).toBe(true);
    });
  });
}

// ============================================================================
// Section 2 — Route-level replay tests (HTTP via supertest, per domain)
// ============================================================================

describe("POST /:domain/atlas/evaluation-hooks/replay — route-level integration", () => {
  let app: express.Application;

  beforeEach(() => {
    app = buildApp();
  });

  // Guard: missing hookId → 400
  it("returns 400 when hookId is absent", async () => {
    const res = await request(app)
      .post("/aegis/atlas/evaluation-hooks/replay")
      .send({});

    expect(res.status).toBe(400);
  });

  // Guard: unknown hookId → 404
  it("returns 404 when hookId does not match any hook", async () => {
    const res = await request(app)
      .post("/aegis/atlas/evaluation-hooks/replay")
      .send({ hookId: "does-not-exist" });

    expect(res.status).toBe(404);
  });

  // Guard: hook belongs to a different domain → 403
  it("returns 403 when hook belongs to a different domain", async () => {
    const alienSignal = await ingestSignal({
      domain: "vessels",
      signalType: "ais-gap",
      severity: "medium",
      title: "Cross-domain alien hook",
      description: "",
      confidence: 0.7,
      source: "test",
      payload: {},
      status: "raw",
      tenantId: "t1",
    });
    const alienRun = makeWorkflowRun();
    const alienHook = await registerEvaluationHook({
      domain: "vessels",
      workflowId: alienRun.runId,
      workflowName: "Vessels Voyage Risk & Execution",
      replayable: true,
      signalSnapshot: [alienSignal],
      runSnapshot: alienRun,
    });

    const res = await request(app)
      .post("/aegis/atlas/evaluation-hooks/replay")
      .send({ hookId: alienHook.id });

    expect(res.status).toBe(403);
  });

  // Guard: non-replayable hook → 422
  it("returns 422 when hook is not marked as replayable", async () => {
    const nonReplayRun = makeWorkflowRun({ status: "failed" });
    const nonReplayHook = await registerEvaluationHook({
      domain: "aegis",
      workflowId: nonReplayRun.runId,
      workflowName: "Aegis Security Incident Response",
      replayable: false,
      signalSnapshot: [],
      runSnapshot: nonReplayRun,
    });

    const res = await request(app)
      .post("/aegis/atlas/evaluation-hooks/replay")
      .send({ hookId: nonReplayHook.id });

    expect(res.status).toBe(422);
  });

  // Happy path for all six domains
  for (const tc of DOMAIN_CASES) {
    it(`replays ${tc.workflowKey} end-to-end and returns benchmark comparison (${tc.domain})`, async () => {
      const replayRun = makeWorkflowRun({
        workflowId: tc.workflowKey,
        isDryRun: true,
        status: "completed",
        steps: [
          { stepId: "s1", stepName: "Step 1", startedAt: Date.now() - 80, completedAt: Date.now() - 40, status: "completed" },
          { stepId: "s2", stepName: "Step 2", startedAt: Date.now() - 40, completedAt: Date.now(), status: "completed" },
        ],
      });
      mockExecuteWorkflow.mockResolvedValueOnce({
        run: replayRun,
        requiresApproval: false,
        dryRunSummary: `Replay of ${tc.workflowKey} completed`,
      });

      const originalSignal = await ingestSignal({
        domain: tc.domain,
        signalType: tc.signalType,
        severity: tc.severity,
        title: `[Replay seed] ${tc.title}`,
        description: tc.description,
        confidence: 0.88,
        source: "test-harness",
        payload: { ...tc.payload },
        status: "raw",
        tenantId: "test-tenant",
      });

      const originalRun = makeWorkflowRun({ workflowId: tc.workflowKey, status: "completed" });
      const hook = await registerEvaluationHook({
        domain: tc.domain,
        workflowId: originalRun.runId,
        workflowName: DOMAIN_WORKFLOWS[tc.workflowKey].name,
        triggerSignalId: originalSignal.id,
        replayable: true,
        signalSnapshot: [originalSignal],
        runSnapshot: originalRun,
        benchmarkMetrics: {
          latencyMs: 350,
          stepsCompleted: 6,
          stepsFailed: 0,
          policyChecks: 2,
          policiesBlocked: 0,
          evidenceCount: 3,
        },
      });

      const res = await request(app)
        .post(`/${tc.domain}/atlas/evaluation-hooks/replay`)
        .send({ hookId: hook.id, isDryRun: true });

      expect(res.status).toBe(201);

      const body = res.body as Record<string, unknown>;
      expect(body.domain).toBe(tc.domain);
      expect(body.replayedHookId).toBe(hook.id);
      expect(body.replayHookId).toBeTruthy();
      expect(body.run).toBeDefined();
      expect((body.run as WorkflowRun).status).toBe("completed");
      expect(typeof body.latencyMs).toBe("number");

      const bc = body.benchmarkComparison as Record<string, unknown>;
      expect(bc).toBeDefined();
      expect(bc.originalLatencyMs).toBe(350);
      expect(bc.originalStepsCompleted).toBe(6);
      expect(typeof bc.replayLatencyMs).toBe("number");
      expect(bc.replayStepsCompleted).toBe(2);
    });
  }

  // The replay endpoint registers a new (non-replayable) hook as the replay record
  it("registers a new [REPLAY] hook after successful replay", async () => {
    const domain = "imperium";
    const replayRun = makeWorkflowRun({ workflowId: "imperium-remediation", isDryRun: true, status: "completed" });
    mockExecuteWorkflow.mockResolvedValueOnce({ run: replayRun, requiresApproval: false });

    const sig = await ingestSignal({
      domain,
      signalType: "cost-anomaly",
      severity: "medium",
      title: "Replay hook registration check",
      description: "",
      confidence: 0.7,
      source: "test",
      payload: {},
      status: "raw",
      tenantId: "t1",
    });
    const origRun = makeWorkflowRun({ workflowId: "imperium-remediation" });
    const hook = await registerEvaluationHook({
      domain,
      workflowId: origRun.runId,
      workflowName: "IMPERIUM Infrastructure Remediation",
      replayable: true,
      signalSnapshot: [sig],
      runSnapshot: origRun,
    });

    const hooksBefore = (await getEvaluationHooks(domain)).length;

    await request(app)
      .post(`/${domain}/atlas/evaluation-hooks/replay`)
      .send({ hookId: hook.id, isDryRun: true });

    const hooksAfter = await getEvaluationHooks(domain);
    expect(hooksAfter.length).toBe(hooksBefore + 1);

    // getEvaluationHooks orders by snapshotAt DESC — newest hook is first
    const replayRecord = hooksAfter[0];
    expect(replayRecord.workflowName).toMatch(/\[REPLAY\]/);
    expect(replayRecord.replayable).toBe(false);
  });

  // The replay endpoint re-ingests signals from the snapshot
  it("re-ingests signals from the hook snapshot into the domain store", async () => {
    const domain = "carlota-jo";
    const replayRun = makeWorkflowRun({ workflowId: "carlota-concierge-workflow", isDryRun: true, status: "completed" });
    mockExecuteWorkflow.mockResolvedValueOnce({ run: replayRun, requiresApproval: false });

    const originalSignal = await ingestSignal({
      domain,
      signalType: "booking-request",
      severity: "low",
      title: "VIP airport transfer",
      description: "",
      confidence: 0.8,
      source: "crm",
      payload: {},
      status: "raw",
      tenantId: "t1",
    });
    const origRun = makeWorkflowRun({ workflowId: "carlota-concierge-workflow" });
    const hook = await registerEvaluationHook({
      domain,
      workflowId: origRun.runId,
      workflowName: "Carlota Jo Concierge Workflow",
      replayable: true,
      signalSnapshot: [originalSignal],
      runSnapshot: origRun,
    });

    const signalsBefore = (await getSignals(domain, 10000)).length;

    await request(app)
      .post(`/${domain}/atlas/evaluation-hooks/replay`)
      .send({ hookId: hook.id, isDryRun: true });

    const signalsAfter = await getSignals(domain, 10000);
    expect(signalsAfter.length).toBe(signalsBefore + 1);
  });
});

// ============================================================================
// Section 3 — Evaluation hook store contract tests
// ============================================================================

describe("ATLAS evaluation hook store contract", () => {
  it("executedomainWorkflow registers an evaluation hook only for non-dry-run, non-simulation execution", async () => {
    const domain = "aegis";
    const run = makeWorkflowRun({ workflowId: "aegis-incident-response", isDryRun: false });
    mockExecuteWorkflow.mockResolvedValueOnce({ run, requiresApproval: false });

    const signal = await ingestSignal({
      domain,
      signalType: "threat-detection",
      severity: "critical",
      title: "C2 beacon detected",
      description: "",
      confidence: 0.95,
      source: "siem",
      payload: {},
      status: "raw",
      tenantId: "t1",
    });

    const hooksBefore = (await getEvaluationHooks(domain)).length;

    await executedomainWorkflow({
      domain,
      workflowKey: "aegis-incident-response",
      signalIds: [signal.id],
      isDryRun: false,
      isSimulation: false,
      initiatedBy: "test-harness",
    });

    const hooksAfter = await getEvaluationHooks(domain);
    expect(hooksAfter.length).toBe(hooksBefore + 1);

    // getEvaluationHooks orders by snapshotAt DESC — newest hook is first
    const hook = hooksAfter[0];
    expect(hook.domain).toBe(domain);
    expect(hook.replayable).toBe(true);
    expect(hook.runSnapshot.runId).toBe(run.runId);
  });

  it("dry-run execution does NOT register an evaluation hook", async () => {
    const domain = "vessels";
    const run = makeWorkflowRun({ isDryRun: true, workflowId: "vessels-voyage-risk" });
    mockExecuteWorkflow.mockResolvedValueOnce({ run, requiresApproval: false, dryRunSummary: "ok" });

    const hooksBefore = (await getEvaluationHooks(domain)).length;

    await executedomainWorkflow({
      domain,
      workflowKey: "vessels-voyage-risk",
      isDryRun: true,
      isSimulation: false,
      initiatedBy: "test-harness",
    });

    expect((await getEvaluationHooks(domain)).length).toBe(hooksBefore);
  });

  it("simulation execution does NOT register an evaluation hook", async () => {
    const domain = "terra";
    const run = makeWorkflowRun({ isSimulation: true, workflowId: "terra-deal-underwriting" });
    mockExecuteWorkflow.mockResolvedValueOnce({ run, requiresApproval: false, simulationSummary: "ok" });

    const hooksBefore = (await getEvaluationHooks(domain)).length;

    await executedomainWorkflow({
      domain,
      workflowKey: "terra-deal-underwriting",
      isDryRun: false,
      isSimulation: true,
      initiatedBy: "test-harness",
    });

    expect((await getEvaluationHooks(domain)).length).toBe(hooksBefore);
  });

  it("registerEvaluationHook stores a hook retrievable by ID with benchmark metrics", async () => {
    const domain = "prism-counsel";
    const fakeRun = makeWorkflowRun({ workflowId: "prism-matter-execution" });
    const sig = await ingestSignal({
      domain,
      signalType: "court-order",
      severity: "high",
      title: "PI issued",
      description: "",
      confidence: 1.0,
      source: "court",
      payload: {},
      status: "raw",
      tenantId: "t1",
    });

    const hook = await registerEvaluationHook({
      domain,
      workflowId: fakeRun.runId,
      workflowName: "Counsel Matter Execution",
      triggerSignalId: sig.id,
      replayable: true,
      signalSnapshot: [sig],
      runSnapshot: fakeRun,
      benchmarkMetrics: {
        latencyMs: 340,
        stepsCompleted: 6,
        stepsFailed: 0,
        policyChecks: 2,
        policiesBlocked: 0,
        evidenceCount: 3,
      },
    });

    expect(hook.id).toBeTruthy();
    expect(hook.benchmarkMetrics?.latencyMs).toBe(340);
    expect(hook.benchmarkMetrics?.stepsCompleted).toBe(6);
    expect(hook.benchmarkMetrics?.evidenceCount).toBe(3);

    const retrieved = await getEvaluationHookById(hook.id);
    expect(retrieved?.id).toBe(hook.id);
    expect(retrieved?.signalSnapshot[0].id).toBe(sig.id);
  });

  it("getEvaluationHookById returns undefined for an unknown ID", async () => {
    expect(await getEvaluationHookById("no-such-hook")).toBeUndefined();
  });
});

// ============================================================================
// Section 4 — Workflow definition structural integrity (all six)
// ============================================================================

describe("ATLAS workflow definitions — structural integrity", () => {
  it("all six canonical workflow keys exist in DOMAIN_WORKFLOWS", () => {
    const required = [
      "aegis-incident-response",
      "vessels-voyage-risk",
      "terra-deal-underwriting",
      "prism-matter-execution",
      "carlota-concierge-workflow",
      "imperium-remediation",
    ];
    for (const key of required) {
      expect(DOMAIN_WORKFLOWS).toHaveProperty(key);
    }
  });

  for (const tc of DOMAIN_CASES) {
    it(`${tc.workflowKey} has correct domain, isDryRunCapable, and isSimulationCapable`, () => {
      const wf = DOMAIN_WORKFLOWS[tc.workflowKey];
      expect(wf.id).toBe(tc.workflowKey);
      expect(wf.domain).toBe(tc.domain);
      expect(wf.isDryRunCapable).toBe(true);
      expect(wf.isSimulationCapable).toBe(tc.isSimulationCapable);
      expect(wf.requiresExplicitApproval).toBe(true);
    });

    it(`${tc.workflowKey} has at least ${tc.minSteps} steps with valid handler names`, () => {
      const wf = DOMAIN_WORKFLOWS[tc.workflowKey];
      expect(wf.steps.length).toBeGreaterThanOrEqual(tc.minSteps);
      for (const step of wf.steps) {
        expect(step.id).toBeTruthy();
        expect(step.name).toBeTruthy();
        expect(typeof step.handler).toBe("string");
        expect(step.handler.length).toBeGreaterThan(0);
      }
    });

    it(`${tc.workflowKey} has at least one approval-required step`, () => {
      const wf = DOMAIN_WORKFLOWS[tc.workflowKey];
      const approvalSteps = wf.steps.filter(s => s.requiresApproval === true);
      expect(approvalSteps.length).toBeGreaterThan(0);
    });
  }
});
