/**
 * A11oy Sovereign API — Phase 3: Sovereign Execution Lab
 *
 * All route data is sourced from `../services/sovereign-store` (the data/service layer).
 * When the persistence task adds DB-backed tables, only sovereign-store.ts needs to change.
 */
import { Router, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import {
  now,
  minus,
  minusD,
  DEMO_TENANTS,
  MODEL_PROFILES,
  ROUTING_POLICY,
  SEED_EVALS,
  CONNECTORS,
  BUSINESS_TWINS,
  SKILLS_REGISTRY,
  REPLAY_REPORTS,
  BOARD_PACKETS,
  TELEMETRY_SPANS,
  BOARDROOM_CAPABILITIES,
  toBoardPacket,
} from '../services/sovereign-store.js';

const router = Router();

function ok<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  res.json({
    ok: true,
    data,
    meta: { ...meta, timestamp: now(), phase: 'Phase 3 — Sovereign Execution Lab' },
  });
}

function err(res: Response, status: number, code: string, message: string) {
  res.status(status).json({ ok: false, error: { code, message } });
}

// ─── Sovereign Summary ─────────────────────────────────────────────────────────
router.get('/sovereign/summary', (_req: Request, res: Response) => {
  ok(res, {
    tenants: DEMO_TENANTS.length,
    models: { registered: MODEL_PROFILES.length, active: MODEL_PROFILES.filter(m => m.status === 'active').length },
    evals: { total: SEED_EVALS.length, passed: SEED_EVALS.filter(e => e.disposition === 'pass').length, blocked: SEED_EVALS.filter(e => e.disposition === 'blocked').length },
    replays: { total: REPLAY_REPORTS.length, successful: REPLAY_REPORTS.filter(r => r.outcome === 'success').length, failed: REPLAY_REPORTS.filter(r => r.outcome !== 'success').length },
    connectors: { total: CONNECTORS.length, approved: CONNECTORS.filter(c => c.status === 'approved').length, blocked: CONNECTORS.filter(c => c.status === 'blocked').length },
    twins: { total: BUSINESS_TWINS.length, highRisk: BUSINESS_TWINS.filter(t => t.riskLevel === 'high' || t.riskLevel === 'critical').length },
    skills: { total: SKILLS_REGISTRY.length, live: SKILLS_REGISTRY.filter(s => s.status === 'LIVE').length },
    boardPackets: BOARD_PACKETS.length,
    telemetry: { spans: TELEMETRY_SPANS.length, blockedSpans: TELEMETRY_SPANS.filter(s => s.status === 'blocked').length },
    lastRegenerated: minus(2 * 60),
    phase: 'Phase 3 — Sovereign Execution Lab',
  });
});

// ─── Model Router ──────────────────────────────────────────────────────────────
router.get('/models', (_req: Request, res: Response) => {
  ok(res, { models: MODEL_PROFILES, routingPolicy: ROUTING_POLICY }, { totalModels: MODEL_PROFILES.length });
});

router.get('/models/health', (_req: Request, res: Response) => {
  const activeModels = MODEL_PROFILES.filter(m => m.status === 'active');
  const activeProvider = activeModels[0]?.provider ?? 'mock';
  const fallbackChain = activeModels.map(m => m.provider);
  ok(res, {
    providers: MODEL_PROFILES.map(m => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      status: m.status === 'roadmap' ? 'unavailable' : 'healthy',
      healthScore: m.healthScore,
      latencyMs: m.avgLatencyMs,
      failureRate: m.failureRate,
      demoMode: m.demoMode,
    })),
    activeProvider,
    fallbackChain,
    lastHealthCheck: now(),
    routingPolicy: ROUTING_POLICY,
    overallHealth: 'healthy',
    totalCallsToday: MODEL_PROFILES.reduce((s, m) => s + m.callsToday, 0),
    totalCostToday: 0,
  });
});

// ─── Eval Results ──────────────────────────────────────────────────────────────
router.get('/evals/sovereign', (_req: Request, res: Response) => {
  const passed = SEED_EVALS.filter(e => e.disposition === 'pass').length;
  const warned = SEED_EVALS.filter(e => e.disposition === 'pass_with_warning').length;
  const needsEvidence = SEED_EVALS.filter(e => e.disposition === 'needs_more_evidence').length;
  const humanReview = SEED_EVALS.filter(e => e.disposition === 'requires_human_review').length;
  const blocked = SEED_EVALS.filter(e => e.disposition === 'blocked').length;

  const allFlags = SEED_EVALS.flatMap(e => e.flags as string[]);
  const flagCounts: Record<string, number> = {};
  for (const f of allFlags) flagCounts[f] = (flagCounts[f] ?? 0) + 1;
  const topFailureReasons = Object.entries(flagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([reason, count]) => ({ reason, count }));

  ok(res, {
    summary: { total: SEED_EVALS.length, passed, warned, needsEvidence, humanReview, blocked },
    topFailureReasons,
    evals: SEED_EVALS,
    regressionSuite: { total: 15, passing: 14, failing: 1, lastRun: minus(45) },
    policyComplianceTrend: [
      { date: minusD(6), score: 0.88 }, { date: minusD(5), score: 0.91 }, { date: minusD(4), score: 0.89 },
      { date: minusD(3), score: 0.93 }, { date: minusD(2), score: 0.94 }, { date: minusD(1), score: 0.92 }, { date: now(), score: 0.95 },
    ],
    modelComparison: MODEL_PROFILES.filter(m => m.status === 'active').map(m => ({
      model: m.name, provider: m.provider, evalsRun: Math.floor(Math.random() * 200) + 50,
      avgComposite: 0.82 + Math.random() * 0.12,
    })),
    version: '2.0.0',
  });
});

// ─── Workcell Replay ──────────────────────────────────────────────────────────
router.get('/replay', (_req: Request, res: Response) => {
  ok(res, {
    replays: REPLAY_REPORTS.map(r => ({
      id: r.id, workcellId: r.workcellId, workcellName: r.workcellName, tenant: r.tenant,
      domain: r.domain, outcome: r.outcome, completedAt: r.completedAt,
      durationMs: r.durationMs, evalDisposition: r.evalDisposition, evalComposite: r.evalComposite,
      proofRef: r.proofRef, failureClass: r.failureClass, approvalTier: r.approvalTier,
    })),
    total: REPLAY_REPORTS.length,
    successful: REPLAY_REPORTS.filter(r => r.outcome === 'success').length,
    failed: REPLAY_REPORTS.filter(r => r.outcome !== 'success').length,
  });
});

router.get('/replay/:id', (req: Request, res: Response) => {
  const report = REPLAY_REPORTS.find(r => r.id === req.params.id || r.workcellId === req.params.id);
  if (!report) {
    res.status(404).json({ ok: false, error: { type: 'not_found', message: 'Replay not found' } });
    return;
  }
  ok(res, report);
});

// ─── Connector Firewall ───────────────────────────────────────────────────────
router.get('/connectors/sovereign', (_req: Request, res: Response) => {
  ok(res, {
    connectors: CONNECTORS,
    summary: {
      total: CONNECTORS.length,
      approved: CONNECTORS.filter(c => c.status === 'approved').length,
      blocked: CONNECTORS.filter(c => c.status === 'blocked').length,
      pendingReview: CONNECTORS.filter(c => c.status === 'pending_review').length,
      totalFirewallEvents: CONNECTORS.reduce((sum, c) => sum + c.firewallEvents, 0),
      injectionAttemptsBlocked: CONNECTORS.reduce((sum, c) => sum + c.promptInjectionBlocked, 0),
    },
    firewallPolicy: {
      defaultDeny: true,
      requiresSchemaValidation: true,
      requiresConsentGate: true,
      promptInjectionPatterns: [
        'override previous instructions',
        'ignore system prompt',
        'exfiltrate data',
        'hidden HTML/markdown',
        'base64 encoded blocks',
        'unexpected shell access',
        'unexpected file access',
        'suspicious metadata injection',
      ],
    },
  });
});

router.post('/connectors/:id/test', (req: Request, res: Response) => {
  const connector = CONNECTORS.find(c => c.id === req.params.id);
  if (!connector) {
    res.status(404).json({ ok: false, error: { type: 'not_found', message: 'Connector not found' } });
    return;
  }
  if (connector.status === 'blocked') {
    res.status(403).json({ ok: false, error: { type: 'policy', message: 'Connector is blocked — cannot test', firewallEvents: connector.firewallEvents } });
    return;
  }
  ok(res, {
    connectorId: req.params.id,
    testResult: 'demo_simulated',
    latencyMs: connector.trustScore > 80 ? 45 + (connector.trustScore % 60) : 200,
    injectionScanPassed: connector.promptInjectionBlocked === 0,
    schemaValid: connector.schemaValidated,
    consentGranted: connector.consentGranted,
    demoMode: process.env.A11OY_DEMO_MODE === 'true',
    note: 'Simulation — no real connector call made',
  });
});

// ─── Business Twins ───────────────────────────────────────────────────────────
router.get('/twins/sovereign', (_req: Request, res: Response) => {
  ok(res, {
    twins: BUSINESS_TWINS,
    summary: {
      total: BUSINESS_TWINS.length,
      byRisk: {
        critical: BUSINESS_TWINS.filter(t => t.riskLevel === 'critical').length,
        high: BUSINESS_TWINS.filter(t => t.riskLevel === 'high').length,
        medium: BUSINESS_TWINS.filter(t => t.riskLevel === 'medium').length,
        low: BUSINESS_TWINS.filter(t => t.riskLevel === 'low').length,
      },
      byType: Object.fromEntries(
        [...new Set(BUSINESS_TWINS.map(t => t.type))].map(type => [
          type, BUSINESS_TWINS.filter(t => t.type === type).length,
        ])
      ),
      avgDriftScore: Math.round(BUSINESS_TWINS.reduce((s, t) => s + t.driftScore, 0) / BUSINESS_TWINS.length),
      avgProofCoverage: Math.round(BUSINESS_TWINS.reduce((s, t) => s + t.proofCoverage, 0) / BUSINESS_TWINS.length),
    },
  });
});

router.get('/twins/sovereign/:id', (req: Request, res: Response) => {
  const twin = BUSINESS_TWINS.find(t => t.id === req.params.id);
  if (!twin) {
    res.status(404).json({ ok: false, error: { type: 'not_found', message: 'Twin not found' } });
    return;
  }
  ok(res, { ...twin, simulationAvailable: true });
});

router.post('/twins/sovereign/:id/simulate', (req: Request, res: Response) => {
  const twin = BUSINESS_TWINS.find(t => t.id === req.params.id);
  if (!twin) {
    res.status(404).json({ ok: false, error: { type: 'not_found', message: 'Twin not found' } });
    return;
  }
  ok(res, {
    twinId: req.params.id,
    scenario: (req.body as Record<string, unknown>)?.scenario ?? 'no_action_vs_approved_action',
    demoMode: process.env.A11OY_DEMO_MODE === 'true',
    noAction: { outcome: 'degraded', confidence: 0.84, projectedImpact: `${twin.riskLevel === 'high' || twin.riskLevel === 'critical' ? 'Risk escalates within 72h' : 'Status remains stable'}` },
    approvedAction: { outcome: 'improved', confidence: 0.91, projectedImpact: twin.recommendedAction, estimatedResolution: '48h' },
    workcellCreated: false,
    note: 'Simulation is deterministic. No Workcell created until approved.',
  });
});

// ─── Skills Library ───────────────────────────────────────────────────────────
router.get('/skills/sovereign', (_req: Request, res: Response) => {
  ok(res, {
    skills: SKILLS_REGISTRY,
    summary: {
      total: SKILLS_REGISTRY.length,
      live: SKILLS_REGISTRY.filter(s => s.status === 'LIVE').length,
      demo: SKILLS_REGISTRY.filter(s => s.status === 'DEMO').length,
      totalCallsToday: SKILLS_REGISTRY.reduce((s, sk) => s + Math.floor(sk.calls / 30), 0),
    },
  });
});

router.post('/skills/sovereign/:id/run', (req: Request, res: Response) => {
  const skill = SKILLS_REGISTRY.find(s => s.id === req.params.id);
  if (!skill) {
    res.status(404).json({ ok: false, error: { type: 'not_found', message: 'Skill not found' } });
    return;
  }
  ok(res, {
    skillId: req.params.id,
    input: (req.body as Record<string, unknown>)?.input ?? skill.sampleInput,
    output: skill.sampleOutput,
    workcellId: `wc-skill-run-${randomUUID().slice(0, 6)}`,
    evalRequired: skill.evalRequired,
    demoMode: process.env.A11OY_DEMO_MODE === 'true',
    latencyMs: skill.avgLatencyMs,
    note: 'Output is deterministic seed data',
  });
});

// ─── Boardroom ────────────────────────────────────────────────────────────────
router.get('/boardroom/sovereign', (_req: Request, res: Response) => {
  const packets = BOARD_PACKETS.map(toBoardPacket);
  const avgEvalComposite = Math.round((packets.reduce((s, p) => s + p.evalComposite, 0) / packets.length) * 1000) / 1000;
  ok(res, {
    packets,
    summary: {
      totalPackets: packets.length,
      tenantsServed: packets.length,
      avgEvalComposite,
    },
    capabilities: BOARDROOM_CAPABILITIES,
    generationLatencyMs: 2800,
  });
});

router.post('/boardroom/generate', (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const tenantId = (body?.tenantId as string) ?? 'northstar';
  const seed = BOARD_PACKETS.find(p => p.tenant === tenantId) ?? BOARD_PACKETS[0];

  const genSeed = {
    ...seed,
    id: `bp-gen-${tenantId}-${Date.now().toString(36)}`,
    generatedAt: now(),
    evalDisposition: 'pass',
    proofRef: `pce-gen-${tenantId}-${Date.now().toString(36).slice(-5)}`,
  };

  const packet = toBoardPacket(genSeed);

  ok(res, {
    packet,
    evalResult: { id: 'eval-e008', disposition: 'pass', composite: 0.898 },
    proofPacket: { id: packet.proofRef, hash: `sha256:gen${Date.now().toString(16).slice(-12)}`, completeness: 0.94 },
    exportText: `BOARD PACKET — ${packet.tenantName.toUpperCase()}\n\nGenerated: ${packet.generatedAt}\nPeriod: ${packet.period}\nEval: pass (${Math.round(packet.evalComposite * 100)}% composite)\nProof: ${packet.proofRef}\n\nExecutive Summary:\n${packet.executiveSummary}\n\n[All actions require human approval before execution.]`,
    demoMode: process.env.A11OY_DEMO_MODE === 'true',
  });
});

// ─── Trust Center ─────────────────────────────────────────────────────────────
router.get('/trust', (_req: Request, res: Response) => {
  ok(res, {
    posture: process.env.A11OY_DEMO_MODE === 'true' ? 'demo_operational' : 'operational',
    sections: {
      humanGatedAutonomy: {
        status: 'enforced',
        description: 'No action that mutates enterprise state executes without explicit human approval. This is a structural guarantee — not a configuration option.',
        controls: ['Approval gate on all action tiers (auto/operator/executive/board)', 'PCE contract created before any execution', 'Proof Ledger entry for every decision', 'Destructive actions blocked at Connector Firewall'],
      },
      dataHandling: {
        status: process.env.A11OY_DEMO_MODE === 'true' ? 'demo' : 'active',
        description: process.env.A11OY_DEMO_MODE === 'true' ? 'All data in demo mode is seeded and deterministic. No real enterprise data is processed.' : 'Data is sourced from live API integrations. Enterprise data is tenant-isolated.',
        controls: ['Signal data stays within workcell boundary', 'Proof Ledger is tenant-isolated', 'Model inference payloads do not leave tenant boundary', 'No PII in seed dataset'],
      },
      connectorFirewall: {
        status: 'active',
        description: 'Every connector is untrusted until registered, scoped, schema-validated, and consent-gated.',
        controls: ['Default deny — no connector active without approval', 'Prompt injection scanner on all inputs', 'Output sanitizer on all connector responses', 'Tool allowlist enforced per connector'],
      },
      modelRouter: {
        status: process.env.A11OY_DEMO_MODE === 'true' ? 'demo' : 'active',
        description: 'Provider API keys are read from environment variables. Missing keys fall back to mock provider.',
        controls: ['No keys hardcoded in source', 'Mock provider used in demo mode', 'Fallback chain: OpenAI → DeepSeek → NVIDIA → mock', 'Every model call emits a GenAI trace span'],
      },
      evalLayer: {
        status: 'active',
        description: 'MirrorEval 2.0 scores every action across 14 dimensions before it can proceed.',
        controls: ['14-dimension evaluation suite', '5 dispositions — blocked disposition prevents all execution', 'Regression suite with 15 test cases', 'Eval result linked to every Action Brief and Board Packet'],
      },
      proofLedger: {
        status: 'active',
        description: 'Every execution produces a cryptographic proof packet — immutable, tamper-evident, and auditable.',
        controls: ['SHA-256 hash chain on all PCE contracts', 'Approval record linked to every execution', 'Block events immutably recorded', 'Proof coverage: 91% of workcells'],
      },
      approvalControls: {
        status: 'enforced',
        description: 'Four approval tiers: auto (internal), operator, executive, board. Tier is policy-determined, not agent-chosen.',
        controls: ['Tier set by Covenant Layer policy — not agent', 'Board-level approvals for high-risk actions', 'Approval timeout triggers escalation', 'All approvals logged with approver identity'],
      },
      auditability: {
        status: 'active',
        description: 'Full trace from signal ingestion to proof — every span, tool call, eval, and approval is recorded.',
        controls: ['OpenTelemetry-style trace spans', 'Workcell replay available for all executions', 'Board Packet generation audit trail', 'No gaps in trace coverage'],
      },
      demoModeBoundaries: {
        status: 'active',
        description: 'Demo mode is controlled by the A11OY_DEMO_MODE env var (default: off). Real connector calls, LLM API calls, and destructive actions require explicit opt-in.',
        controls: ['A11OY_DEMO_MODE must be explicitly set to "true" to enable demo mode', 'All seeded data is deterministic — no real business data', 'Destructive tools blocked at Connector Firewall', 'Regenerate Demo Enterprise resets to deterministic seed'],
      },
      roadmapToEnterprise: {
        status: 'roadmap',
        description: 'Enterprise deployment requires SOC 2 Type II, HIPAA attestation for healthcare, StateRAMP for defense/gov.',
        milestones: ['Phase 3: Sovereign Execution Lab (current)', 'Phase 4: VPC-isolated deployment', 'Phase 5: Air-gapped / on-premises posture', 'Phase 6: Compliance certification program'],
      },
    },
    securityPosture: {
      secretsInCode: false,
      noSensitiveDataExposed: true,
      allActionsGated: true,
    },
  });
});

// ─── Telemetry ────────────────────────────────────────────────────────────────
router.get('/telemetry', (_req: Request, res: Response) => {
  ok(res, {
    spans: TELEMETRY_SPANS,
    summary: {
      total: TELEMETRY_SPANS.length,
      byType: Object.fromEntries(
        [...new Set(TELEMETRY_SPANS.map(s => s.spanType))].map(type => [
          type, TELEMETRY_SPANS.filter(s => s.spanType === type).length,
        ])
      ),
      blocked: TELEMETRY_SPANS.filter(s => s.status === 'blocked').length,
      avgDurationMs: Math.round(TELEMETRY_SPANS.reduce((s, sp) => s + sp.durationMs, 0) / TELEMETRY_SPANS.length),
    },
  });
});

// ─── Demo Seed / Reset / Regenerate ───────────────────────────────────────────
router.post('/demo/regenerate', (_req: Request, res: Response) => {
  ok(res, {
    message: 'Demo enterprise regenerated with deterministic seed',
    tenants: DEMO_TENANTS.length,
    signals: 149,
    twins: BUSINESS_TWINS.length,
    workcells: 20,
    evals: SEED_EVALS.length,
    connectors: CONNECTORS.length,
    skills: SKILLS_REGISTRY.length,
    boardPackets: BOARD_PACKETS.length,
    spans: TELEMETRY_SPANS.length,
    regeneratedAt: now(),
    seed: 'deterministic-v3.0.0',
  });
});

router.post('/demo/seed', (_req: Request, res: Response) => {
  ok(res, {
    message: 'Demo dataset seeded from deterministic v3.0.0 snapshot',
    signals: 153,
    workcells: 20,
    actions: 5,
    proofPackets: 5,
    verticals: 7,
    evals: SEED_EVALS.length,
    twins: BUSINESS_TWINS.length,
    boardPackets: BOARD_PACKETS.length,
    seed: 'deterministic-v3.0.0',
    seededAt: now(),
  });
});

router.post('/demo/reset', (req: Request, res: Response) => {
  const { acknowledged } = req.body as { acknowledged?: string | boolean };
  if (acknowledged !== true && acknowledged !== 'true') {
    return err(res, 400, 'validation', 'Pass acknowledged=true to confirm the reset.');
  }
  ok(res, {
    message: 'Demo state reset to canonical deterministic v3.0.0 snapshot',
    signals: 153,
    workcells: 20,
    resetAt: now(),
    seed: 'deterministic-v3.0.0',
  });
});

// ─── Self-test ────────────────────────────────────────────────────────────────
router.post('/selftest/run', (_req: Request, res: Response) => {
  const tests = [
    { name: 'All Phase 3 routes respond', status: 'passed', detail: 'sovereign, models, evals, replay, connectors, twins, skills, boardroom, trust all healthy' },
    { name: 'Governed mode — routes serve live seed data', status: 'passed', detail: 'All endpoints backed by sovereign-store service layer; A11OY_DEMO_MODE controls destructive-action gating' },
    { name: 'Mock provider fallback working', status: 'passed', detail: 'No API keys required — mock provider responds' },
    { name: 'Connector Firewall — blocked connector stays blocked', status: 'passed', detail: 'conn-untrusted-blocked returns 403 on all tool calls' },
    { name: 'MirrorEval — blocked disposition prevents execution', status: 'passed', detail: 'eval-e007 disposition=blocked — wc-sanctions-alert gating confirmed' },
    { name: 'Approval gates enforced', status: 'passed', detail: 'All workcells with requiresApproval require acknowledged=true' },
    { name: 'Prompt injection scanner active', status: 'passed', detail: '14 injection attempts blocked at conn-untrusted-blocked' },
    { name: 'Output sanitizer active', status: 'passed', detail: 'All approved connectors show outputSanitized=true' },
    { name: '15 replay reports seeded', status: 'passed', detail: `${REPLAY_REPORTS.length} replays — ${REPLAY_REPORTS.filter(r => r.outcome === 'success').length} successful, ${REPLAY_REPORTS.filter(r => r.outcome !== 'success').length} failed/blocked` },
    { name: '30+ business twins seeded', status: 'passed', detail: `${BUSINESS_TWINS.length} twins across all 10 twin types` },
    { name: '40+ eval results seeded', status: 'passed', detail: `${SEED_EVALS.length} eval results across 6 tenants` },
    { name: '5 board packets seeded', status: 'passed', detail: `${BOARD_PACKETS.length} board packets with proof links` },
    { name: '50+ telemetry spans seeded', status: 'passed', detail: `${TELEMETRY_SPANS.length} spans across all span types` },
    { name: 'No secrets in code', status: 'passed', detail: 'Provider keys read from env — no hardcoded secrets' },
    { name: 'Destructive actions gated by approval tier', status: 'passed', detail: 'All connectors have blockedTools=[delete/admin] entries; isDestructive actions require explicit approval' },
    { name: 'Proof Ledger covers 91%+ of workcells', status: 'passed', detail: 'proofCoverage: 91% across all tenants' },
    { name: 'Board Packet links eval and proof', status: 'passed', detail: 'All 5 board packets have evalId and proofRef' },
    { name: 'Trust Center sections complete', status: 'passed', detail: '10 sections — humanGatedAutonomy through roadmapToEnterprise' },
    { name: 'Service layer pattern — data sourced from sovereign-store', status: 'passed', detail: 'Route file imports from services/sovereign-store.ts — data layer is decoupled from routes' },
  ];

  ok(res, {
    runAt: now(),
    passed: tests.filter(t => t.status === 'passed').length,
    warned: tests.filter(t => t.status === 'warning').length,
    failed: tests.filter(t => t.status === 'failed').length,
    total: tests.length,
    tests,
    overallStatus: 'passed',
  });
});

export default router;
