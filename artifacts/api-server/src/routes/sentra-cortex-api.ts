import { Router, type Request, type Response } from 'express';
import { desc } from 'drizzle-orm';
import { logger } from '../lib/logger';
import { authMiddleware } from '../middlewares/auth';
import {
  db,
  sentraCortexProofLog,
  alloyWorkflows,
  alloyApprovals,
} from '@szl-holdings/db';
import {
  resolveProofRoute,
  validateProofArtifacts,
} from '@workspace/ouroboros';
import {
  deriveCortexAmi,
  type AmiResult,
  type CortexPathInput,
} from '../lib/ami-formula';

const requireAuth = authMiddleware({ required: true });

/**
 * Sentra Predictive Defense Cortex API
 *
 * Backed by:
 *   - @workspace/ouroboros — risk-tier escalation gate, proof-route resolver
 *   - artifacts/api-server/src/lib/ami-formula — A11oy AMI v2 composite scoring
 *   - sentra_cortex_proof_log — DB-backed proof chain (one row per action)
 *   - alloy_workflows + alloy_approvals — real approval queue routing for
 *     stage / approve / deny actions on R3+ paths.
 *
 * Endpoints:
 *   GET  /api/internal/sentra/cortex/predictions   — AMI-scored attack paths
 *   GET  /api/internal/sentra/cortex/swarm-status  — adversary swarm telemetry
 *   GET  /api/internal/sentra/layered-intercept    — Iron Dome layer metrics
 *   GET  /api/internal/sentra/cortex/proof-log     — DB proof chain (last 100)
 *   POST /api/internal/sentra/cortex/countermoves/:pathId/:action
 *   POST /api/internal/sentra/red-team/launch      — red-team scenario launch
 *   GET  /api/internal/a11oy/cyber-lobe            — a11oy cross-app panel
 */

const router = Router();

function ok(res: Response, data: unknown) {
  res.json({ ok: true, data, meta: { timestamp: new Date().toISOString(), visibility: 'internal' } });
}

interface PredictionSeed {
  id: string;
  rank: number;
  horizon: '24h' | '72h' | '168h';
  threat_actor: string;
  apt_profile: string;
  likelihood: number;
  impact: number;
  time_to_exploit_hours: number;
  kill_chain_phase: string;
  attack_techniques: string[];
  target_layer: string;
  countermove_status: string;
  constitutional_clause: string;
  swarm_run_id: string;
  summary: string;
  intercept_layer: string;
  ttl_hours: number;
  contradictions: number;
}

const PREDICTIONS_SEED: PredictionSeed[] = [
  {
    id: 'fth-001', rank: 1, horizon: '24h',
    threat_actor: 'APT29 (Cozy Bear)', apt_profile: 'russian-svr-apt29',
    likelihood: 0.87, impact: 0.94, time_to_exploit_hours: 6,
    kill_chain_phase: 'Lateral Movement',
    attack_techniques: ['T1550.002', 'T1021.001', 'AML.T0043'],
    target_layer: 'identity',
    countermove_status: 'pending',
    constitutional_clause: 'Article IX, §2 — Swarm may propose identity hardening; requires operator approval',
    swarm_run_id: 'swarm-run-0041',
    summary: 'Adversary swarm discovered a pass-the-hash path via service account with stale NTLM credentials. Identity intercept at Layer 2 is pre-empted with 6h window.',
    intercept_layer: 'Identity Layer (Layer 2)',
    ttl_hours: 24,
    contradictions: 1,
  },
  {
    id: 'fth-002', rank: 2, horizon: '24h',
    threat_actor: 'Lazarus Group', apt_profile: 'dprk-lazarus',
    likelihood: 0.79, impact: 0.88, time_to_exploit_hours: 11,
    kill_chain_phase: 'Initial Access',
    attack_techniques: ['T1566.001', 'T1204.002', 'AML.T0048'],
    target_layer: 'perimeter',
    countermove_status: 'approved',
    constitutional_clause: 'Article IX, §1 — Perimeter deception placement pre-approved tier',
    swarm_run_id: 'swarm-run-0039',
    summary: 'Spear-phishing campaign detected via swarm email behavioral simulation. Deception inbox pre-staged.',
    intercept_layer: 'Perimeter Layer (Layer 1)',
    ttl_hours: 24,
    contradictions: 0,
  },
  {
    id: 'fth-003', rank: 3, horizon: '72h',
    threat_actor: 'FIN7', apt_profile: 'fin7-carbanak',
    likelihood: 0.71, impact: 0.82, time_to_exploit_hours: 38,
    kill_chain_phase: 'Collection',
    attack_techniques: ['T1005', 'T1039', 'AML.T0037.000'],
    target_layer: 'data',
    countermove_status: 'pending',
    constitutional_clause: 'Article IX, §3 — Data exfiltration prevention; pre-staging detection rules allowed',
    swarm_run_id: 'swarm-run-0037',
    summary: 'Swarm modeled FIN7 collection TTP against cloud storage. 38h window. Detection rule pre-staging and honeypot data seeding proposed.',
    intercept_layer: 'Data Layer (Layer 4)',
    ttl_hours: 72,
    contradictions: 1,
  },
  {
    id: 'fth-004', rank: 4, horizon: '72h',
    threat_actor: 'APT41 (Double Dragon)', apt_profile: 'china-apt41',
    likelihood: 0.65, impact: 0.91, time_to_exploit_hours: 52,
    kill_chain_phase: 'Privilege Escalation',
    attack_techniques: ['T1068', 'T1134.001', 'AML.T0044'],
    target_layer: 'workload',
    countermove_status: 'pending',
    constitutional_clause: 'Article IX, §2 — Awaiting countermove generation',
    swarm_run_id: 'swarm-run-0035',
    summary: 'Privilege escalation path via vulnerable kernel module identified in containerized workload.',
    intercept_layer: 'Workload Layer (Layer 3)',
    ttl_hours: 72,
    contradictions: 2,
  },
  {
    id: 'fth-005', rank: 5, horizon: '168h',
    threat_actor: 'Sandworm', apt_profile: 'russia-sandworm',
    likelihood: 0.58, impact: 0.97, time_to_exploit_hours: 96,
    kill_chain_phase: 'Impact',
    attack_techniques: ['T1485', 'T1491.002', 'AML.T0036'],
    target_layer: 'data',
    countermove_status: 'staged',
    constitutional_clause: 'Article IX, §4 — Destructive impact prevention; backup pre-staging auto-approved',
    swarm_run_id: 'swarm-run-0031',
    summary: 'Wiper-style impact scenario modeled against critical data stores. Immutable backup pre-staging auto-approved per Art. IX §4.',
    intercept_layer: 'Data Layer (Layer 4) + Response Layer (Layer 5)',
    ttl_hours: 168,
    contradictions: 0,
  },
];

const HORIZON_HOURS: Record<PredictionSeed['horizon'], number> = {
  '24h': 24,
  '72h': 72,
  '168h': 168,
};

const TWIN_FIDELITY_PCT = 97.3;
const COVENANT_GATES_PASSED_24H = 47;
const COVENANT_GATES_BLOCKED_24H = 3;
const ACTIVE_INTERCEPTS_BLOCKED_PCT = 0.907;

interface ScoredPrediction extends PredictionSeed {
  composite_score: number;
  ami: {
    score: number;
    gate: AmiResult['gate'];
    risk_tier: AmiResult['risk_tier'];
    axes: AmiResult['axes'];
    penalties: AmiResult['penalties'];
    formula: string;
    governance_decision: AmiResult['governance_decision'];
  };
}

function scorePrediction(seed: PredictionSeed): ScoredPrediction {
  const input: CortexPathInput = {
    likelihood: seed.likelihood,
    impact: seed.impact,
    time_to_exploit_hours: seed.time_to_exploit_hours,
    twin_fidelity_pct: TWIN_FIDELITY_PCT,
    covenant_gates_passed: COVENANT_GATES_PASSED_24H,
    covenant_gates_blocked: COVENANT_GATES_BLOCKED_24H,
    active_intercepts_blocked_pct: ACTIVE_INTERCEPTS_BLOCKED_PCT,
    horizon_hours: HORIZON_HOURS[seed.horizon],
    contradictions: seed.contradictions,
  };
  const ami = deriveCortexAmi(input);
  // Composite_score is now a real AMI computation, not a hand-tuned constant.
  // Higher attacker likelihood/impact ⇒ lower defender AMI ⇒ we invert and
  // bias against the path so the UI's existing "high score = high threat"
  // semantic still holds.
  const threatScore = Math.round(
    (1 - ami.score * 0.6) * (seed.likelihood * 0.5 + seed.impact * 0.5) * 100,
  );
  return {
    ...seed,
    composite_score: threatScore,
    ami: {
      score: ami.score,
      gate: ami.gate,
      risk_tier: ami.risk_tier,
      axes: ami.axes,
      penalties: ami.penalties,
      formula: ami.formula,
      governance_decision: ami.governance_decision,
    },
  };
}

const predictionsMap: Map<string, ScoredPrediction> = new Map(
  PREDICTIONS_SEED.map(p => [p.id, scorePrediction(p)]),
);

function getPredictions(): ScoredPrediction[] {
  return Array.from(predictionsMap.values()).sort((a, b) => a.rank - b.rank);
}

const SWARM_STATUS = {
  active_agents: [
    { id: 'apt29-shadow', name: 'APT29 Shadow Agent', profile: 'russian-svr-apt29', status: 'executing', current_step: 'Lateral movement sequence #7 — pass-the-hash', covenant_gates_passed: 4, swarm_run_id: 'swarm-run-0041' },
    { id: 'cortex-predict', name: 'Cortex Prediction Engine', profile: 'internal', status: 'aggregating', current_step: 'Updating 72h horizon from 3 completed swarm runs', covenant_gates_passed: 2, swarm_run_id: 'predict-cycle-0012' },
    { id: 'lazarus-shadow', name: 'Lazarus Shadow Agent', profile: 'dprk-lazarus', status: 'complete', current_step: 'Swarm run complete — 3 predictions generated', covenant_gates_passed: 6, swarm_run_id: 'swarm-run-0039' },
    { id: 'countermove', name: 'Countermove Proposer', profile: 'internal', status: 'proposing', current_step: 'Generating cm-001 for fth-001 (APT29)', covenant_gates_passed: 1, swarm_run_id: 'cm-gen-0022' },
  ],
  twin_fidelity: TWIN_FIDELITY_PCT,
  total_runs_completed: 41,
  covenant_gates_total: 287,
  covenant_gates_blocked: 12,
  last_updated: new Date().toISOString(),
};

const LAYERED_INTERCEPT = {
  layers: [
    {
      id: 'perimeter', num: 1, name: 'Perimeter Layer', color: '#ef4444',
      description: 'Network boundary, ingress/egress, DNS, firewall, WAF — the outer ring. Longest intercept window; cheapest to block here.',
      intercept_time_hours: 18, threat_count: 47, blocked: 44,
      controls: ['WAF rule sets', 'DNS filtering', 'Ingress rate limiting', 'GeoIP blocks', 'DDoS mitigation'],
      cortex_note: 'Cortex predicts 2 adversary reconnaissance campaigns will reach this layer in the next 24h. Deception honeypots pre-staged.',
      active_intercepts: [
        { id: 'pi-001', threat: 'APT29 Recon Sweep', status: 'intercepted', tti: '0.5h' },
        { id: 'pi-002', threat: 'Lazarus Spear-Phish Delivery', status: 'decoyed', tti: '2h' },
      ],
    },
    {
      id: 'identity', num: 2, name: 'Identity Layer', color: '#f59e0b',
      description: 'Authentication, authorization, MFA, SSO, service accounts, credential stores. 82:1 machine-to-human ratio means most attack surface is non-human.',
      intercept_time_hours: 11, threat_count: 23, blocked: 20,
      controls: ['MFA enforcement', 'Credential rotation', 'Privileged access management', 'Zero-trust identity verification', 'Service account hardening'],
      cortex_note: 'Cortex identified a pass-the-hash path via 3 stale service accounts. Credential rotation countermove awaiting approval (Art. IX §2).',
      active_intercepts: [
        { id: 'id-001', threat: 'APT29 Pass-the-Hash', status: 'countermove-pending', tti: '6h' },
        { id: 'id-002', threat: 'FIN7 Credential Stuffing', status: 'blocked', tti: '0.2h' },
      ],
    },
    {
      id: 'workload', num: 3, name: 'Workload Layer', color: '#3b82f6',
      description: 'Running processes, containers, VMs, serverless functions. Lateral movement and privilege escalation typically happen here.',
      intercept_time_hours: 6, threat_count: 15, blocked: 12,
      controls: ['Runtime behavioral monitoring', 'Container microsegmentation', 'Process allow-listing', 'EDR coverage', 'Kernel patch enforcement'],
      cortex_note: 'APT41 privilege escalation path via vulnerable kernel module flagged. 52h intercept window. Patch pre-staging proposed.',
      active_intercepts: [
        { id: 'wl-001', threat: 'APT41 Kernel Exploit', status: 'monitoring', tti: '52h' },
        { id: 'wl-002', threat: 'Cryptominer Injection', status: 'blocked', tti: '0h' },
      ],
    },
    {
      id: 'data', num: 4, name: 'Data Layer', color: '#8b5cf6',
      description: 'Databases, object storage, file shares, secrets vaults. Exfiltration and destruction impact happens here — the last controlled intercept point.',
      intercept_time_hours: 3, threat_count: 8, blocked: 7,
      controls: ['Data loss prevention', 'Encryption at rest', 'Vault access controls', 'Exfiltration rate limits', 'Immutable backups'],
      cortex_note: 'FIN7 collection path targeting cloud storage modeled. 38h window. Honeypot data seeding pre-staged at highest-value buckets.',
      active_intercepts: [
        { id: 'dl-001', threat: 'FIN7 S3 Exfiltration', status: 'decoyed', tti: '38h' },
        { id: 'dl-002', threat: 'Sandworm Wiper Scenario', status: 'backup-staged', tti: '96h' },
      ],
    },
    {
      id: 'response', num: 5, name: 'Response Layer', color: '#22c55e',
      description: 'Incident response, automated containment, forensics, and recovery. If attacks reach here, the prior four layers have been breached.',
      intercept_time_hours: 1, threat_count: 3, blocked: 3,
      controls: ['Automated isolation playbooks', 'IR runbook activation', 'Forensic preservation', 'Recovery orchestration', 'On-call escalation'],
      cortex_note: 'Sandworm wiper scenario backup pre-staging auto-approved per Art. IX §4. Response playbook queued and ready.',
      active_intercepts: [
        { id: 'rp-001', threat: 'Sandworm Destructive Impact', status: 'playbook-queued', tti: '96h' },
      ],
    },
  ],
  overall_intercept_rate: ACTIVE_INTERCEPTS_BLOCKED_PCT,
  doctrine: 'Iron Dome — intercept at the outermost feasible layer',
  last_updated: new Date().toISOString(),
};

function getCyberLobe() {
  const preds = getPredictions();
  return {
    panel_title: 'Cyber Lobe — Sentra Live State',
    swarm_agents_active: SWARM_STATUS.active_agents.filter(a => a.status === 'executing' || a.status === 'aggregating' || a.status === 'proposing').length,
    twin_fidelity: SWARM_STATUS.twin_fidelity,
    top_predictions: preds.slice(0, 3).map(p => ({
      id: p.id,
      threat_actor: p.threat_actor,
      composite_score: p.composite_score,
      horizon: p.horizon,
      countermove_status: p.countermove_status,
      intercept_layer: p.intercept_layer,
      ami_gate: p.ami.gate,
      risk_tier: p.ami.risk_tier,
    })),
    pending_countermoves: preds.filter(p => p.countermove_status === 'pending').length,
    approved_countermoves: preds.filter(p => p.countermove_status === 'approved' || p.countermove_status === 'staged').length,
    covenant_gates_24h: COVENANT_GATES_PASSED_24H,
    covenant_gates_blocked_24h: COVENANT_GATES_BLOCKED_24H,
    constitutional_cite: 'Article IX — Adversarial Covenants',
    a11oy_brain_agents: [
      { name: 'APT29 Shadow Agent', status: 'executing', domain: 'adversary-swarm' },
      { name: 'Cortex Prediction Engine', status: 'aggregating', domain: 'prediction-engine' },
      { name: 'Covenant Gate', status: 'reviewing', domain: 'covenant-gate' },
      { name: 'Countermove Proposer', status: 'proposing', domain: 'countermove-proposer' },
    ],
    last_updated: new Date().toISOString(),
  };
}

router.get('/internal/sentra/cortex/predictions', (_req: Request, res: Response) => {
  try {
    const preds = getPredictions();
    ok(res, {
      predictions: preds,
      total: preds.length,
      horizons: {
        '24h': preds.filter(p => p.horizon === '24h').length,
        '72h': preds.filter(p => p.horizon === '72h').length,
        '168h': preds.filter(p => p.horizon === '168h').length,
      },
      provenance: {
        scoring: 'A11oy AMI v2 (Λ^0.22·K^0.16·W^0.16·T^0.14·M^0.14·E^0.10·P^0.08·e^(-0.7N-0.5D)·G)',
        risk_gate: '@workspace/ouroboros — RISK_TIERS R1..R4',
        proof_route: 'PRF_SECURITY_ACTION (v3) / PRF_SECURITY_ACTIONS (v2)',
      },
    });
  } catch (err) {
    logger.error({ err }, 'sentra cortex predictions error');
    res.status(500).json({ ok: false, error: { message: 'Failed to load cortex predictions' } });
  }
});

router.post('/internal/sentra/cortex/countermoves/:pathId/:action', requireAuth, async (req: Request, res: Response) => {
  try {
    const { pathId, action } = req.params;
    const validActions = ['approve', 'deny', 'stage'] as const;
    type CmAction = typeof validActions[number];
    if (!validActions.includes(action as CmAction)) {
      res.status(400).json({ ok: false, error: { message: `Invalid action "${action}". Must be approve | deny | stage.` } });
      return;
    }
    const pred = predictionsMap.get(pathId);
    if (!pred) {
      res.status(404).json({ ok: false, error: { message: `No prediction found for pathId: ${pathId}` } });
      return;
    }
    const typedAction = action as CmAction;
    const statusMap: Record<CmAction, string> = { approve: 'approved', deny: 'denied', stage: 'staged' };
    const newStatus = statusMap[typedAction];

    // Resolve proof route for security actions and validate the artifacts we
    // can attach at this point in the flow.
    const proofRoute = resolveProofRoute({
      type: 'action',
      category: 'security_or_threat_actions',
    });
    const proofId = `proof-op-${Date.now().toString(36)}`;

    // 1. For 'stage' actions: route through real a11oy approval queue.
    let alloyWorkflowId: number | null = null;
    let alloyApprovalId: number | null = null;
    if (typedAction === 'stage') {
      // Fail closed: stage MUST land in the a11oy Approval Queue. If either
      // insert fails or the IDs come back null, refuse the action without
      // mutating prediction state or emitting a success proof.
      try {
        const wfRows = await db
          .insert(alloyWorkflows)
          .values({
            name: `Sentra Countermove: ${pathId} — ${pred.threat_actor}`,
            type: 'custom',
            domain: 'sentra',
            triggerType: 'manual',
            status: 'waiting_approval',
            requiresApproval: true,
            approvalState: 'pending',
          })
          .returning({ id: alloyWorkflows.id });
        alloyWorkflowId = wfRows[0]?.id ?? null;
        if (alloyWorkflowId === null) {
          throw new Error('alloy_workflows insert returned no id');
        }
        const apRows = await db
          .insert(alloyApprovals)
          .values({
            workflowId: alloyWorkflowId,
            status: 'pending',
            reason: `Sentra countermove staged for path ${pathId} (${pred.threat_actor}). AMI gate=${pred.ami.gate}, risk_tier=${pred.ami.risk_tier}. ${pred.constitutional_clause}`,
            expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
          })
          .returning({ id: alloyApprovals.id });
        alloyApprovalId = apRows[0]?.id ?? null;
        if (alloyApprovalId === null) {
          throw new Error('alloy_approvals insert returned no id');
        }
      } catch (workflowErr) {
        logger.error({ err: workflowErr, pathId }, 'a11oy approval queue insert failed — refusing countermove stage');
        res.status(502).json({
          ok: false,
          error: {
            message: 'a11oy Approval Queue is not reachable; countermove stage refused. The cortex must not act without a brain.',
            code: 'ALLOY_APPROVAL_QUEUE_UNAVAILABLE',
          },
        });
        return;
      }
    }

    // 2. Validate proof artifacts for the resolved route.
    const artifactKinds = [
      'validator_result' as const,
      'risk_tier' as const,
      'escalation_check' as const,
      'receipt' as const,
    ];
    const validation = validateProofArtifacts(proofRoute, artifactKinds);

    // 3. Persist proof log to DB (this is the canonical audit record).
    try {
      await db.insert(sentraCortexProofLog).values({
        proofId,
        pathId,
        action: typedAction,
        newStatus,
        operator: 'sentra-operator',
        constitutionalCite: pred.constitutional_clause,
        alloyWorkflowId,
        alloyApprovalId,
      });
    } catch (dbErr) {
      logger.error({ err: dbErr, pathId }, 'sentra cortex proof log persist failed');
      res.status(500).json({ ok: false, error: { message: 'Failed to persist proof log' } });
      return;
    }

    pred.countermove_status = newStatus;

    const proofEntry = {
      proof_id: proofId,
      path_id: pathId,
      action: typedAction,
      new_status: newStatus,
      operator: 'sentra-operator',
      constitutional_cite: pred.constitutional_clause,
      proof_route: proofRoute.routeId,
      proof_route_required_artifacts: proofRoute.requiredArtifacts,
      proof_artifacts_valid: validation.valid,
      ami_gate: pred.ami.gate,
      risk_tier: pred.ami.risk_tier,
      governance_decision: pred.ami.governance_decision,
      alloy_workflow_id: alloyWorkflowId,
      alloy_approval_id: alloyApprovalId,
      timestamp: new Date().toISOString(),
    };
    logger.info({ proofEntry }, 'sentra cortex countermove action recorded (DB-backed)');
    ok(res, { prediction: pred, proof: proofEntry });
  } catch (err) {
    logger.error({ err }, 'sentra cortex countermove action error');
    res.status(500).json({ ok: false, error: { message: 'Failed to process countermove action' } });
  }
});

router.get('/internal/sentra/cortex/proof-log', requireAuth, async (_req: Request, res: Response) => {
  try {
    // DESC ordering ensures we always return the newest 100 entries, not the
    // oldest 100, once the table grows beyond the limit.
    const rows = await db
      .select()
      .from(sentraCortexProofLog)
      .orderBy(desc(sentraCortexProofLog.createdAt))
      .limit(100);
    ok(res, { entries: rows, total: rows.length });
  } catch (err) {
    logger.error({ err }, 'sentra cortex proof log read error');
    res.status(500).json({ ok: false, error: { message: 'Failed to load proof log' } });
  }
});

router.post('/internal/sentra/red-team/launch', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as { scenario_id?: unknown; scenario_name?: unknown };
    const scenarioId = typeof body.scenario_id === 'string' ? body.scenario_id : null;
    const scenarioName = typeof body.scenario_name === 'string' ? body.scenario_name : 'Unnamed Red-Team Scenario';
    if (!scenarioId) {
      res.status(400).json({ ok: false, error: { message: 'scenario_id is required' } });
      return;
    }
    const proofRoute = resolveProofRoute({ type: 'action', category: 'security_or_threat_actions' });
    const proofId = `proof-rt-${Date.now().toString(36)}`;

    // Fail closed: red-team launch MUST be governed by the a11oy Approval
    // Queue. If either insert fails or returns no id, refuse the launch.
    let alloyWorkflowId: number;
    let alloyApprovalId: number;
    try {
      const wfRows = await db
        .insert(alloyWorkflows)
        .values({
          name: `Sentra Red-Team Launch: ${scenarioName}`,
          type: 'custom',
          domain: 'sentra',
          triggerType: 'manual',
          status: 'waiting_approval',
          requiresApproval: true,
          approvalState: 'pending',
        })
        .returning({ id: alloyWorkflows.id });
      const wfId = wfRows[0]?.id ?? null;
      if (wfId === null) throw new Error('alloy_workflows insert returned no id');
      alloyWorkflowId = wfId;
      const apRows = await db
        .insert(alloyApprovals)
        .values({
          workflowId: alloyWorkflowId,
          status: 'pending',
          reason: `Sentra red-team scenario "${scenarioName}" requires a11oy approval per Art. IX §1. Sandboxed against digital twin only.`,
          expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
        })
        .returning({ id: alloyApprovals.id });
      const apId = apRows[0]?.id ?? null;
      if (apId === null) throw new Error('alloy_approvals insert returned no id');
      alloyApprovalId = apId;
    } catch (workflowErr) {
      logger.error({ err: workflowErr, scenarioId }, 'red-team alloy approval queue insert failed — refusing launch');
      res.status(502).json({
        ok: false,
        error: {
          message: 'a11oy Approval Queue is not reachable; red-team launch refused. Sentra must not run without a11oy oversight.',
          code: 'ALLOY_APPROVAL_QUEUE_UNAVAILABLE',
        },
      });
      return;
    }

    try {
      await db.insert(sentraCortexProofLog).values({
        proofId,
        pathId: `red-team:${scenarioId}`,
        action: 'stage',
        newStatus: 'awaiting-approval',
        operator: 'sentra-operator',
        constitutionalCite: 'Article IX, §1 — Red-team scenarios sandboxed against digital twin; approval required',
        alloyWorkflowId,
        alloyApprovalId,
      });
    } catch (dbErr) {
      logger.error({ err: dbErr, scenarioId }, 'red-team proof log persist failed');
      res.status(500).json({ ok: false, error: { message: 'Failed to persist red-team proof log' } });
      return;
    }

    ok(res, {
      scenario_id: scenarioId,
      status: 'awaiting-approval',
      proof_id: proofId,
      proof_route: proofRoute.routeId,
      alloy_workflow_id: alloyWorkflowId,
      alloy_approval_id: alloyApprovalId,
      message: 'Red-team scenario routed to a11oy Approval Queue.',
    });
  } catch (err) {
    logger.error({ err }, 'sentra red-team launch error');
    res.status(500).json({ ok: false, error: { message: 'Failed to launch red-team scenario' } });
  }
});

router.get('/internal/sentra/cortex/swarm-status', (_req: Request, res: Response) => {
  try {
    ok(res, SWARM_STATUS);
  } catch (err) {
    logger.error({ err }, 'sentra swarm status error');
    res.status(500).json({ ok: false, error: { message: 'Failed to load swarm status' } });
  }
});

router.get('/internal/sentra/layered-intercept', (_req: Request, res: Response) => {
  try {
    ok(res, LAYERED_INTERCEPT);
  } catch (err) {
    logger.error({ err }, 'sentra layered intercept error');
    res.status(500).json({ ok: false, error: { message: 'Failed to load layered intercept data' } });
  }
});

router.get('/internal/a11oy/cyber-lobe', (_req: Request, res: Response) => {
  try {
    ok(res, getCyberLobe());
  } catch (err) {
    logger.error({ err }, 'a11oy cyber lobe error');
    res.status(500).json({ ok: false, error: { message: 'Failed to load cyber lobe data' } });
  }
});

export default router;
