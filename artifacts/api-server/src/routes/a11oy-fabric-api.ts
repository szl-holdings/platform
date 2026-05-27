import { Router, type Request, type Response } from 'express';
import { canonicalJson, sha256 as sha256hex } from '../lib/receipt-chain';
import { logger } from '../lib/logger';
import {
  SEED_SIGNALS,
  SEED_OUTCOMES,
  SEED_POLICIES,
  SEED_PROOF_PACKETS,
} from '@workspace/a11oy-fabric/seed';
import {
  findApprovalByAction,
  createApprovalRecord,
  approveAction as approveApprovalRecord,
  runPCEGate,
} from '../a11oy/runtime/governance/pce-gate.js';
import {
  getWorkcell,
  advanceWorkcell,
} from '../a11oy/runtime/workcells/engine.js';

const router = Router();

const now = () => new Date().toISOString();
const minus = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

const WORKCELLS = [
  { id: 'wc-lyte-churn', name: 'Lyte Churn Response Workcell', vertical: 'lyte-revenue', status: 'running', operatorId: 'op-csm-lyte', approvalTier: 'executive' },
  { id: 'wc-terra-covenant', name: 'Terra Covenant Breach Response Workcell', vertical: 'terra-real-estate', status: 'idle', operatorId: 'op-portfolio-terra', approvalTier: 'executive' },
  { id: 'wc-vessels-psc', name: 'Vessels PSC Risk Workcell', vertical: 'vessels-maritime', status: 'idle', operatorId: 'op-fleet-vessels', approvalTier: 'operator' },
  { id: 'wc-aegis-threat', name: 'Aegis Threat Intelligence Workcell', vertical: 'aegis-defense', status: 'running', operatorId: 'op-ti-aegis', approvalTier: 'executive' },
  { id: 'wc-a11oy-fabric-health', name: 'A11oy Fabric Health Workcell', vertical: 'alloy-core', status: 'running', operatorId: 'op-platform-a11oy', approvalTier: 'auto' },
];

const FABRIC_LAYERS = [
  { layer: 'coverage_graph', status: 'healthy', lastHeartbeat: now() },
  { layer: 'signal_mesh', status: 'degraded', signalCount: SEED_SIGNALS.length, processingRateHz: 24, latencyMs: 340, lastHeartbeat: now() },
  { layer: 'state_engine', status: 'healthy', latencyMs: 18, lastHeartbeat: now() },
  { layer: 'causal_core', status: 'healthy', lastHeartbeat: now() },
  { layer: 'action_rail', status: 'healthy', lastHeartbeat: now() },
  { layer: 'covenant_layer', status: 'healthy', lastHeartbeat: now() },
  { layer: 'proof_ledger', status: 'degraded', lastHeartbeat: now() },
];

const VERTICALS = [
  { id: 'lyte-revenue',      label: 'Lyte Revenue',      signalCount: SEED_SIGNALS.filter(s => s.vertical === 'lyte-revenue').length },
  { id: 'vessels-maritime',  label: 'Vessels Maritime',  signalCount: SEED_SIGNALS.filter(s => s.vertical === 'vessels-maritime').length },
  { id: 'terra-real-estate', label: 'DOMAINE Real Estate', signalCount: SEED_SIGNALS.filter(s => s.vertical === 'terra-real-estate').length },
  { id: 'aegis-defense',     label: 'Aegis Defense',     signalCount: SEED_SIGNALS.filter(s => s.vertical === 'aegis-defense').length },
  { id: 'prism-counsel',     label: 'Counsel',           signalCount: SEED_SIGNALS.filter(s => s.vertical === 'prism-counsel').length },
  { id: 'carlota-jo',        label: 'Carlota Jo',        signalCount: SEED_SIGNALS.filter(s => s.vertical === 'carlota-jo').length },
  { id: 'alloy-core',        label: 'Alloy Core',        signalCount: SEED_SIGNALS.filter(s => s.vertical === 'alloy-core').length },
];

const ACTIONS = [
  { id: 'act-001', title: 'Executive Outreach to At-Risk Mid-Market Accounts', vertical: 'lyte-revenue', status: 'approved', priority: 'urgent', requiresApproval: true, approvalTier: 'executive', linkedSignalIds: ['sig-lyte-002'] },
  { id: 'act-002', title: 'Emergency Covenant Remediation: Lease-Up Campaign', vertical: 'terra-real-estate', status: 'pending_approval', priority: 'urgent', requiresApproval: true, approvalTier: 'executive', linkedSignalIds: ['sig-terra-001'] },
  { id: 'act-003', title: 'Notify Lender: Covenant Remediation Plan Submission', vertical: 'terra-real-estate', status: 'recommended', priority: 'urgent', requiresApproval: true, approvalTier: 'executive', linkedSignalIds: ['sig-terra-001'] },
  { id: 'act-004', title: 'Dispatch SIRE 2.0 Remediation Team to 4 Non-Compliant Tankers', vertical: 'vessels-maritime', status: 'recommended', priority: 'high', requiresApproval: true, approvalTier: 'operator', linkedSignalIds: ['sig-vessels-002'] },
  { id: 'act-005', title: 'Resolve State Engine Snapshot Contention', vertical: 'alloy-core', status: 'executing', priority: 'high', requiresApproval: false, approvalTier: 'auto', linkedSignalIds: ['sig-alloy-001'] },
];

function ok<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  res.json({ ok: true, data, meta: { ...meta, timestamp: now(), mode: 'demo', phase: 'Phase 1 — Foundation' } });
}


router.get('/a11oy/now', (_req: Request, res: Response) => {
  const bySeverity = SEED_SIGNALS.reduce<Record<string, number>>((acc, s) => {
    acc[s.severity] = (acc[s.severity] ?? 0) + 1;
    return acc;
  }, {});
  const byVertical = SEED_SIGNALS.reduce<Record<string, number>>((acc, s) => {
    acc[s.vertical] = (acc[s.vertical] ?? 0) + 1;
    return acc;
  }, {});
  ok(res, {
    signals: SEED_SIGNALS.length,
    activeOutcomes: SEED_OUTCOMES.filter(o => o.status === 'in_progress').length,
    pendingActions: ACTIONS.filter(a => a.status === 'recommended' || a.status === 'pending_approval').length,
    activeWorkcells: WORKCELLS.filter(w => w.status === 'running').length,
    fabricStatus: FABRIC_LAYERS.some(f => f.status === 'degraded') ? 'degraded' : 'healthy',
    criticalSignals: SEED_SIGNALS.filter(s => s.severity === 'critical').length,
    bySeverity,
    byVertical,
    fabricLayers: FABRIC_LAYERS.length,
    proofPackets: SEED_PROOF_PACKETS.length,
  });
});

router.get('/a11oy/signals', (req: Request, res: Response) => {
  let results = [...SEED_SIGNALS];
  const { vertical, severity, status, limit = '50', offset = '0' } = req.query as Record<string, string>;
  if (vertical) results = results.filter(s => s.vertical === vertical);
  if (severity) results = results.filter(s => s.severity === severity);
  if (status)   results = results.filter(s => s.status === status);
  const total = results.length;
  const o = parseInt(offset, 10);
  const l = parseInt(limit, 10);
  ok(res, results.slice(o, o + l), { total, offset: o, limit: l });
});

router.get('/a11oy/signals/:id', (req: Request, res: Response) => {
  const signal = SEED_SIGNALS.find(s => s.id === req.params.id);
  if (!signal) {
    res.status(404).json({ ok: false, error: { type: 'not_found', message: `Signal "${req.params.id}" not found.`, retryable: false, suggestion: 'Check the signal ID and try again.' } });
    return;
  }
  ok(res, signal);
});

router.get('/a11oy/outcomes', (_req: Request, res: Response) => {
  ok(res, SEED_OUTCOMES, { total: SEED_OUTCOMES.length });
});

router.get('/a11oy/actions', (_req: Request, res: Response) => {
  ok(res, ACTIONS, { total: ACTIONS.length });
});

router.post('/a11oy/actions/:id/approve', async (req: Request, res: Response) => {
  try {
    const action = ACTIONS.find(a => a.id === req.params.id);
    if (!action) {
      res.status(404).json({ ok: false, error: { type: 'not_found', message: `Action "${req.params.id}" not found.`, retryable: false } });
      return;
    }
    if (!action.requiresApproval) {
      res.status(400).json({ ok: false, error: { type: 'validation', message: 'This action does not require approval.', retryable: false } });
      return;
    }
    if (action.status === 'approved') {
      res.status(409).json({ ok: false, error: { type: 'conflict', message: 'Action is already approved.', retryable: false } });
      return;
    }
    const { approvedBy } = req.body as { approvedBy?: string };
    if (!approvedBy) {
      res.status(400).json({ ok: false, error: { type: 'validation', message: 'approvedBy is required.', retryable: false } });
      return;
    }
    let approval = findApprovalByAction(action.id);
    if (!approval) {
      approval = createApprovalRecord({ actionId: action.id, tier: action.approvalTier });
    }
    const updated = approveApprovalRecord(approval.approvalId, approvedBy);
    action.status = 'approved';
    ok(res, { actionId: action.id, status: 'approved', approvalRecord: updated });
  } catch (e) {
    logger.error({ err: e }, '[a11oy-fabric] POST /actions/:id/approve error');
    res.status(500).json({ ok: false, error: { type: 'execution', message: 'Approval failed.', retryable: true } });
  }
});

router.post('/a11oy/actions/:id/execute', async (req: Request, res: Response) => {
  try {
    const action = ACTIONS.find(a => a.id === req.params.id);
    if (!action) {
      res.status(404).json({ ok: false, error: { type: 'not_found', message: `Action "${req.params.id}" not found.`, retryable: false } });
      return;
    }
    if (action.requiresApproval && action.status !== 'approved') {
      res.status(403).json({ ok: false, error: { type: 'approval_required', message: `Action requires approval (tier: ${action.approvalTier}) before execution.`, retryable: false } });
      return;
    }
    const approval = findApprovalByAction(action.id);
    const pceResult = await runPCEGate({
      actionId: action.id,
      originSignalIds: action.linkedSignalIds,
      vertical: action.vertical,
      riskLevel: action.priority === 'urgent' ? 'critical' : 'medium',
      isDestructive: false,
      approvalRecordId: approval?.approvalId,
    });
    if (!pceResult.allowed) {
      const statusCode = pceResult.errorType === 'approval_required' ? 403 : 400;
      res.status(statusCode).json({ ok: false, error: { type: pceResult.errorType ?? 'policy', message: pceResult.blockedReason ?? 'PCE gate blocked execution.', retryable: false } });
      return;
    }
    action.status = 'executing';
    ok(res, { actionId: action.id, status: 'executing', pceContractId: pceResult.contract?.contractId, mode: pceResult.contract?.mode });
  } catch (e) {
    logger.error({ err: e }, '[a11oy-fabric] POST /actions/:id/execute error');
    res.status(500).json({ ok: false, error: { type: 'execution', message: 'Execution failed.', retryable: true } });
  }
});

router.get('/a11oy/proof', (_req: Request, res: Response) => {
  ok(res, SEED_PROOF_PACKETS, { total: SEED_PROOF_PACKETS.length });
});

// ============================================================
// PROOF CHAIN STORE — in-memory, seeded on boot
// ============================================================

interface FabricReasoningStep {
  id: string;
  type: 'premise' | 'inference' | 'conclusion';
  content: string;
  confidence: number;
  evidenceRefs: string[];
}

interface FabricProofNode {
  id: string;
  kind: string;
  label: string;
  actor: string;
  ts: string;
  hash: string;
  detail: string;
  evidenceRefs: string[];
  status: string;
  reasoningTrace?: FabricReasoningStep[];
}

interface FabricAttestationEnvelope {
  algorithm: string;
  signer: string;
  timestamp: string;
  nonce: string;
  terminalHash: string;
  rootHash: string;
  structural: true;
}

interface FabricProofChain {
  id: string;
  title: string;
  domain: string;
  completedAt: string;
  attestation: FabricAttestationEnvelope;
  nodes: FabricProofNode[];
}

type RawChainNode = Omit<FabricProofNode, 'hash'> & { hash?: string };
interface RawChain {
  id: string;
  title: string;
  domain: string;
  completedAt: string;
  nodes: RawChainNode[];
}

const RAW_PROOF_CHAINS: RawChain[] = [
  {
    id: 'chain-001',
    title: 'MV Cascade Port Standby — Full Proof Chain',
    domain: 'Maritime',
    completedAt: '2026-04-25T04:34:58Z',
    nodes: [
      { id: 'n1', kind: 'SIGNAL', label: 'Signal Detected', actor: 'Signal Mesh', ts: '2026-04-25T03:48:00Z', detail: 'MV Cascade 18h delay detected from AIS stream — Tanjung Pelepas congestion', evidenceRefs: ['ais-feed-cascade', 'port-api-tpp'], status: 'verified' },
      { id: 'n2', kind: 'CONTEXT', label: 'Context Assembled', actor: 'Context Engine', ts: '2026-04-25T03:49:12Z', detail: 'Context pack assembled: voyage plan, demurrage contract, port cost schedule, historical standby data', evidenceRefs: ['ctx-pack-4421'], status: 'verified' },
      { id: 'n3', kind: 'REASONING', label: 'Reasoning Trace', actor: 'Cascade Navigator', ts: '2026-04-25T03:52:30Z', detail: 'Full reasoning trace: 3 premises, 2 inference steps, 1 conclusion.', evidenceRefs: ['action-brief-cascade'], status: 'verified', reasoningTrace: [
        { id: 'r1', type: 'premise', content: 'MV Cascade ETA delayed 18h due to Tanjung Pelepas port congestion (AIS feed confirmed)', confidence: 0.98, evidenceRefs: ['ais-feed-cascade'] },
        { id: 'r2', type: 'premise', content: 'Demurrage contract clause 4.2: $14,200/day rate applies after 24h delay', confidence: 0.99, evidenceRefs: ['demurrage-contract-4421'] },
        { id: 'r3', type: 'premise', content: 'Historical standby at alternative anchorage saves avg $42,000 per event (12 prior cases)', confidence: 0.94, evidenceRefs: ['historical-standby-data'] },
        { id: 'r4', type: 'inference', content: 'Port standby at anchorage 1.28N 103.67E reduces demurrage exposure by ~$42K vs. waiting at berth', confidence: 0.96, evidenceRefs: ['cost-model-cascade'] },
        { id: 'r5', type: 'inference', content: 'No alternative port within 6h offers lower total cost when factoring fuel + port charges', confidence: 0.92, evidenceRefs: ['route-optimizer-output'] },
        { id: 'r6', type: 'conclusion', content: 'Recommend port standby at anchorage 1.28N 103.67E. Expected savings: $42,000. MirrorEval: 94%.', confidence: 0.945, evidenceRefs: ['action-brief-cascade'] },
      ] },
      { id: 'n4', kind: 'POLICY_EVAL', label: 'Policy Evaluated', actor: 'Covenant Layer', ts: '2026-04-25T03:52:38Z', detail: 'Policy pol-maritime-002 triggered. Enforcement: block_until_approved. Required: VP Operations.', evidenceRefs: ['pol-maritime-002'], status: 'verified' },
      { id: 'n5', kind: 'APPROVAL', label: 'Approval Requested', actor: 'Approval Gateway', ts: '2026-04-25T03:52:45Z', detail: 'Approval request dispatched to VP Operations Sarah Chen. Deadline: T+4h.', evidenceRefs: ['approval-req-001'], status: 'verified' },
      { id: 'n6', kind: 'APPROVAL', label: 'Approval Granted', actor: 'vp-operations:sarah.chen', ts: '2026-04-25T04:30:22Z', detail: 'VP Operations approved port standby. Notes: "Agreed — minimize demurrage exposure."', evidenceRefs: ['approval-grant-001'], status: 'verified' },
      { id: 'n7', kind: 'EXECUTION', label: 'Action Executed', actor: 'Cascade Navigator', ts: '2026-04-25T04:32:11Z', detail: 'Port standby authorized. Vessel repositioned to anchorage 1.28N 103.67E.', evidenceRefs: ['exec-001'], status: 'verified' },
      { id: 'n8', kind: 'VERIFICATION', label: 'Result Verified', actor: 'Verifier Agent', ts: '2026-04-25T04:34:58Z', detail: 'AIS position confirmed. Port authority standby registered. Cost rate locked at $14,200/day. Verification: PASSED.', evidenceRefs: ['vr-001'], status: 'verified' },
    ],
  },
  {
    id: 'chain-002',
    title: 'TG-Ember Threat Escalation — Full Proof Chain',
    domain: 'Defense',
    completedAt: '2026-04-24T18:56:12Z',
    nodes: [
      { id: 'n1', kind: 'SIGNAL', label: 'Signal Detected', actor: 'Signal Mesh', ts: '2026-04-24T18:42:00Z', detail: 'TG-Ember threat actor activity detected — YELLOW threshold breached', evidenceRefs: ['siem-alert-4431'], status: 'verified' },
      { id: 'n2', kind: 'CONTEXT', label: 'Context Assembled', actor: 'Context Engine', ts: '2026-04-24T18:43:00Z', detail: 'Threat intelligence context: TG-Ember history, TTPs, current attack surface', evidenceRefs: ['threat-ctx-4431'], status: 'verified' },
      { id: 'n3', kind: 'REASONING', label: 'Reasoning Trace', actor: 'Guardian', ts: '2026-04-24T18:44:30Z', detail: 'Full reasoning trace for threat escalation decision.', evidenceRefs: ['guardian-brief-01'], status: 'verified', reasoningTrace: [
        { id: 'r1', type: 'premise', content: 'TG-Ember C2 beacons detected on ports 443 and 8080 from 3 internal hosts', confidence: 0.97, evidenceRefs: ['siem-alert-4431'] },
        { id: 'r2', type: 'premise', content: 'TG-Ember TTPs match known APT campaign (MITRE ATT&CK T1071, T1041)', confidence: 0.95, evidenceRefs: ['threat-intel-db'] },
        { id: 'r3', type: 'inference', content: 'Confidence-weighted threat score exceeds ORANGE threshold (0.92 > 0.90)', confidence: 0.96, evidenceRefs: ['threat-scoring-model'] },
        { id: 'r4', type: 'conclusion', content: 'Escalate to ORANGE. Apply 14 perimeter hardening rules. Notify CISO.', confidence: 0.96, evidenceRefs: ['guardian-brief-01'] },
      ] },
      { id: 'n4', kind: 'POLICY_EVAL', label: 'Policy Evaluated', actor: 'Covenant Layer', ts: '2026-04-24T18:44:38Z', detail: 'Policy pol-security-007: auto_escalate for ORANGE+ threats.', evidenceRefs: ['pol-security-007'], status: 'verified' },
      { id: 'n5', kind: 'EXECUTION', label: 'Action Executed', actor: 'Guardian (auto)', ts: '2026-04-24T18:55:00Z', detail: '14 firewall block rules applied. CISO notified. Threat tier set to ORANGE.', evidenceRefs: ['exec-defense-001'], status: 'verified' },
      { id: 'n6', kind: 'VERIFICATION', label: 'Result Verified', actor: 'Verifier Agent', ts: '2026-04-24T18:56:12Z', detail: 'SIEM confirmed ORANGE status. Perimeter surface reduced 22%. PASSED.', evidenceRefs: ['vr-003'], status: 'verified' },
    ],
  },
  {
    id: 'chain-003',
    title: 'Talbot Discovery Escalation — Full Proof Chain',
    domain: 'Legal',
    completedAt: '2026-04-24T14:23:45Z',
    nodes: [
      { id: 'n1', kind: 'SIGNAL', label: 'Signal Detected', actor: 'Signal Mesh', ts: '2026-04-24T08:00:00Z', detail: 'Talbot matter: 340 documents outstanding, T-48h discovery deadline', evidenceRefs: ['clio-matter-4421'], status: 'verified' },
      { id: 'n2', kind: 'CONTEXT', label: 'Context Assembled', actor: 'Context Engine', ts: '2026-04-24T08:01:30Z', detail: 'Matter context: case timeline, outstanding documents, discovery scope, risk assessment', evidenceRefs: ['legal-ctx-4421'], status: 'verified' },
      { id: 'n3', kind: 'REASONING', label: 'Reasoning Trace', actor: 'Counsel Sentinel', ts: '2026-04-24T08:05:00Z', detail: 'Full reasoning trace for legal escalation decision.', evidenceRefs: ['counsel-brief-001'], status: 'verified', reasoningTrace: [
        { id: 'r1', type: 'premise', content: '340 documents remain outstanding with T-48h discovery deadline', confidence: 0.99, evidenceRefs: ['clio-matter-4421'] },
        { id: 'r2', type: 'premise', content: 'Opposing counsel has filed late in 3 of 5 prior cases — adverse inference motion risk is HIGH', confidence: 0.94, evidenceRefs: ['opposing-counsel-history'] },
        { id: 'r3', type: 'inference', content: 'Production rate of 15 docs/hour requires 22.7h — exceeds available time by 4.7h', confidence: 0.97, evidenceRefs: ['production-rate-model'] },
        { id: 'r4', type: 'conclusion', content: 'Immediate escalation to lead counsel + co-counsel required. Risk: adverse inference motion.', confidence: 0.97, evidenceRefs: ['counsel-brief-001'] },
      ] },
      { id: 'n4', kind: 'POLICY_EVAL', label: 'Policy Evaluated', actor: 'Covenant Layer', ts: '2026-04-24T08:05:08Z', detail: 'Policy pol-legal-003: block_until_approved. General Counsel approval required.', evidenceRefs: ['pol-legal-003'], status: 'verified' },
      { id: 'n5', kind: 'APPROVAL', label: 'Approval Granted', actor: 'general-counsel:patricia.mwangi', ts: '2026-04-24T14:20:33Z', detail: 'General Counsel approved escalation. Notes: "Priority. Engage outside co-counsel immediately."', evidenceRefs: ['approval-legal-001'], status: 'verified' },
      { id: 'n6', kind: 'EXECUTION', label: 'Action Executed', actor: 'Counsel Sentinel', ts: '2026-04-24T14:22:10Z', detail: 'Escalation email sent to lead counsel + co-counsel. Clio matter updated.', evidenceRefs: ['exec-legal-001'], status: 'verified' },
      { id: 'n7', kind: 'VERIFICATION', label: 'Result Verified', actor: 'Verifier Agent', ts: '2026-04-24T14:23:45Z', detail: 'Email delivery confirmed. Clio status updated. PASSED.', evidenceRefs: ['vr-002'], status: 'verified' },
    ],
  },
];

export function computeNodeHash(node: Omit<FabricProofNode, 'hash'>): string {
  const body = {
    id: node.id,
    kind: node.kind,
    label: node.label,
    actor: node.actor,
    ts: node.ts,
    detail: node.detail,
    evidenceRefs: [...node.evidenceRefs].sort(),
    status: node.status,
    reasoningTrace: node.reasoningTrace ?? null,
  };
  return 'sha256:' + sha256hex(canonicalJson(body));
}

export function computeRootHash(nodeHashes: string[]): string {
  return 'sha256:' + sha256hex(nodeHashes.join('||'));
}

function buildChainStore(): FabricProofChain[] {
  return RAW_PROOF_CHAINS.map(rawChain => {
    const nodes: FabricProofNode[] = rawChain.nodes.map(n => {
      const { hash: _h, ...rest } = n;
      return { ...rest, hash: computeNodeHash(rest) };
    });
    const nodeHashes = nodes.map(n => n.hash);
    const terminalHash = nodeHashes[nodeHashes.length - 1] ?? '';
    const rootHash = computeRootHash(nodeHashes);
    const nonce = sha256hex(rawChain.id + rawChain.completedAt).slice(0, 8);
    const attestation: FabricAttestationEnvelope = {
      algorithm: 'SHA-256 (structural content hash)',
      signer: 'spiffe://a11oy.szl/verifier',
      timestamp: rawChain.completedAt,
      nonce,
      terminalHash,
      rootHash,
      structural: true,
    };
    return { id: rawChain.id, title: rawChain.title, domain: rawChain.domain, completedAt: rawChain.completedAt, attestation, nodes };
  });
}

const PROOF_CHAIN_STORE: FabricProofChain[] = buildChainStore();

/**
 * TEST-ONLY: replace a chain in the store so unit tests can inject tampered
 * state and verify that /verify returns chainOk: false.
 * This export is intentionally not reachable from normal routes.
 */
export function _testOnly_injectChain(chain: FabricProofChain): void {
  const idx = PROOF_CHAIN_STORE.findIndex(c => c.id === chain.id);
  if (idx >= 0) PROOF_CHAIN_STORE[idx] = chain;
  else PROOF_CHAIN_STORE.push(chain);
}

export function _testOnly_resetChainStore(): void {
  PROOF_CHAIN_STORE.splice(0, PROOF_CHAIN_STORE.length, ...buildChainStore());
}

export type { FabricProofChain, FabricProofNode };

router.get('/a11oy/ledger/chains', (_req: Request, res: Response) => {
  const chains = PROOF_CHAIN_STORE.map(c => ({
    id: c.id,
    title: c.title,
    domain: c.domain,
    hash: c.attestation.rootHash,
    completedAt: c.completedAt,
    nodeCount: c.nodes.length,
    reasoningTraceCount: c.nodes.filter(n => n.reasoningTrace).length,
    attestation: c.attestation,
    nodes: c.nodes,
  }));
  ok(res, {
    chains,
    totalNodes: PROOF_CHAIN_STORE.reduce((s, c) => s + c.nodes.length, 0),
    totalReasoningTraces: PROOF_CHAIN_STORE.reduce((s, c) => s + c.nodes.filter(n => n.reasoningTrace).length, 0),
  });
});

router.get('/a11oy/ledger/chains/:chainId', (req: Request, res: Response) => {
  const chain = PROOF_CHAIN_STORE.find(c => c.id === req.params.chainId);
  if (!chain) {
    res.status(404).json({ ok: false, error: { type: 'not_found', message: `Chain "${req.params.chainId}" not found.`, retryable: false } });
    return;
  }
  ok(res, { ...chain, hash: chain.attestation.rootHash });
});

router.get('/a11oy/ledger/chains/:chainId/packets/:nodeId', (req: Request, res: Response) => {
  const chain = PROOF_CHAIN_STORE.find(c => c.id === req.params.chainId);
  if (!chain) {
    res.status(404).json({ ok: false, error: { type: 'not_found', message: `Chain "${req.params.chainId}" not found.`, retryable: false } });
    return;
  }
  const node = chain.nodes.find(n => n.id === req.params.nodeId);
  if (!node) {
    res.status(404).json({ ok: false, error: { type: 'not_found', message: `Packet "${req.params.nodeId}" not found in chain "${req.params.chainId}".`, retryable: false } });
    return;
  }
  ok(res, { node, chainId: chain.id, chainTitle: chain.title, chainDomain: chain.domain, chainCompletedAt: chain.completedAt, attestation: chain.attestation });
});

router.post('/a11oy/ledger/chains/:chainId/verify', (req: Request, res: Response) => {
  const chain = PROOF_CHAIN_STORE.find(c => c.id === req.params.chainId);
  if (!chain) {
    res.status(404).json({ ok: false, error: { type: 'not_found', message: `Chain "${req.params.chainId}" not found.`, retryable: false } });
    return;
  }
  const nodeResults = chain.nodes.map(node => {
    const { hash, ...rest } = node;
    const recomputed = computeNodeHash(rest);
    return { id: node.id, label: node.label, ok: recomputed === hash, expected: hash, actual: recomputed };
  });
  const recomputedHashes = chain.nodes.map(n => {
    const { hash: _h, ...rest } = n;
    return computeNodeHash(rest);
  });
  const recomputedRoot = computeRootHash(recomputedHashes);
  const rootHashOk = recomputedRoot === chain.attestation.rootHash;
  const chainOk = nodeResults.every(n => n.ok) && rootHashOk;
  ok(res, { chainOk, rootHashOk, recomputedRoot, storedRoot: chain.attestation.rootHash, nodes: nodeResults });
});

// ============================================================
// ROUTING WEIGHTS STORE — in-memory, seeded on boot
// ============================================================

interface RoutingWeight {
  id: string;
  mode: string;
  category: string;
  model: string;
  provider: string;
  weight: number;
  tier: string;
  updatedBy: string | null;
  updatedAt: string | null;
}

const DEFAULT_ROUTING_WEIGHTS: RoutingWeight[] = [
  { id: 'rw-fast-triage',         mode: 'Fast Triage',              category: 'fast_triage',         model: 'o4-mini',          provider: 'OpenAI',    weight: 1.0, tier: 'elevated',  updatedBy: null, updatedAt: null },
  { id: 'rw-deep-reasoning',      mode: 'Deep Reasoning',           category: 'deep_reasoning',      model: 'GPT-5.1',          provider: 'OpenAI',    weight: 1.0, tier: 'elevated',  updatedBy: null, updatedAt: null },
  { id: 'rw-long-context',        mode: 'Long Context',             category: 'long_context',        model: 'Claude 4 Opus',    provider: 'Anthropic', weight: 1.0, tier: 'sovereign', updatedBy: null, updatedAt: null },
  { id: 'rw-code-analysis',       mode: 'Code Analysis',            category: 'code_analysis',       model: 'Qwen2.5-Coder',    provider: 'Qwen',      weight: 1.0, tier: 'standard',  updatedBy: null, updatedAt: null },
  { id: 'rw-document-analysis',   mode: 'Document Analysis',        category: 'document_analysis',   model: 'Gemini 2.5 Pro',   provider: 'Google',    weight: 1.0, tier: 'elevated',  updatedBy: null, updatedAt: null },
  { id: 'rw-eval-judge',          mode: 'Eval Judge',               category: 'eval_judge',          model: 'GPT-5.1',          provider: 'OpenAI',    weight: 1.0, tier: 'elevated',  updatedBy: null, updatedAt: null },
  { id: 'rw-board-packet',        mode: 'Board Packet',             category: 'board_packet',        model: 'Claude 4 Sonnet',  provider: 'Anthropic', weight: 1.0, tier: 'sovereign', updatedBy: null, updatedAt: null },
  { id: 'rw-proof-reconstruction',mode: 'Proof Reconstruction',     category: 'proof_reconstruction',model: 'o3',               provider: 'OpenAI',    weight: 1.0, tier: 'sovereign', updatedBy: null, updatedAt: null },
  { id: 'rw-classification',      mode: 'Classification / Intent',  category: 'classification',      model: 'claude-3-haiku',   provider: 'Anthropic', weight: 1.0, tier: 'standard',  updatedBy: null, updatedAt: null },
  { id: 'rw-counterfactual',      mode: 'Counterfactual (MirrorEval)',category: 'counterfactual',   model: 'gpt-4o',           provider: 'OpenAI',    weight: 1.0, tier: 'elevated',  updatedBy: null, updatedAt: null },
];

let routingWeightStore: RoutingWeight[] = DEFAULT_ROUTING_WEIGHTS.map(w => ({ ...w }));

router.get('/a11oy/routing-weights', (_req: Request, res: Response) => {
  ok(res, { weights: routingWeightStore, total: routingWeightStore.length });
});

router.patch('/a11oy/routing-weights/:id', (req: Request, res: Response) => {
  const entry = routingWeightStore.find(w => w.id === req.params.id);
  if (!entry) {
    res.status(404).json({ ok: false, error: { type: 'not_found', message: `Routing weight "${req.params.id}" not found.`, retryable: false } });
    return;
  }
  const { weight, updatedBy } = req.body as { weight?: unknown; updatedBy?: unknown };
  if (typeof weight !== 'number' || weight < 0 || weight > 1) {
    res.status(400).json({ ok: false, error: { type: 'validation', message: 'weight must be a number between 0 and 1 (inclusive).', retryable: false } });
    return;
  }
  entry.weight = weight;
  entry.updatedBy = typeof updatedBy === 'string' ? updatedBy : 'operator';
  entry.updatedAt = now();
  ok(res, entry);
});

router.post('/a11oy/routing-weights/reset', (_req: Request, res: Response) => {
  routingWeightStore = DEFAULT_ROUTING_WEIGHTS.map(w => ({ ...w }));
  ok(res, { weights: routingWeightStore, reset: true });
});

router.get('/a11oy/proof/:entityId', (req: Request, res: Response) => {
  const packets = SEED_PROOF_PACKETS.filter(p => p.entityId === req.params.entityId);
  ok(res, packets, { total: packets.length, entityId: req.params.entityId });
});

router.get('/a11oy/governance', (_req: Request, res: Response) => {
  ok(res, { policies: SEED_POLICIES, total: SEED_POLICIES.length });
});

router.get('/a11oy/verticals', (_req: Request, res: Response) => {
  ok(res, VERTICALS, { total: VERTICALS.length });
});

router.get('/a11oy/fabric', (_req: Request, res: Response) => {
  ok(res, { layers: FABRIC_LAYERS, healthySince: minus(168) });
});

router.get('/a11oy/workcells', (_req: Request, res: Response) => {
  ok(res, WORKCELLS, { total: WORKCELLS.length });
});

router.get('/a11oy/workcells/:id', (req: Request, res: Response) => {
  const wc = WORKCELLS.find(w => w.id === req.params.id);
  if (!wc) {
    res.status(404).json({ ok: false, error: { type: 'not_found', message: `Workcell "${req.params.id}" not found.`, retryable: false, suggestion: 'Check the workcell ID and try again.' } });
    return;
  }
  ok(res, wc);
});

router.post('/a11oy/workcells/:id/run', async (req: Request, res: Response) => {
  try {
    const runtimeWc = getWorkcell(req.params.id);
    if (!runtimeWc) {
      const fabricWc = WORKCELLS.find(w => w.id === req.params.id);
      if (!fabricWc) {
        res.status(404).json({ ok: false, error: { type: 'not_found', message: `Workcell "${req.params.id}" not found.`, retryable: false } });
        return;
      }
    }
    const advanced = await advanceWorkcell(req.params.id);
    if (!advanced) {
      res.status(404).json({ ok: false, error: { type: 'not_found', message: `Workcell "${req.params.id}" could not be advanced.`, retryable: false } });
      return;
    }
    ok(res, advanced);
  } catch (e) {
    logger.error({ err: e }, '[a11oy-fabric] POST /workcells/:id/run error');
    res.status(500).json({ ok: false, error: { type: 'execution', message: 'Workcell run failed.', retryable: true } });
  }
});

logger.debug('[a11oy-fabric-api] routes registered — %d signals loaded from @workspace/a11oy-fabric', SEED_SIGNALS.length);

export default router;
