import { Router, type Request, type Response } from 'express';
import { logger } from '../lib/logger';
import {
  SEED_SIGNALS,
  SEED_OUTCOMES,
  SEED_POLICIES,
  SEED_PROOF_PACKETS,
} from '@workspace/a11oy-fabric/seed';

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

function notImplemented(res: Response, operation: string) {
  res.status(501).json({
    ok: false,
    error: {
      type: 'not_implemented',
      message: `Operation "${operation}" is not yet available.`,
      retryable: false,
      suggestion: 'This mutating endpoint will be implemented in the A11oy Phase 2 agent runtime. Read-side endpoints are fully operational.',
    },
  });
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

router.post('/a11oy/actions/:id/approve', (req: Request, res: Response) => notImplemented(res, `approve action ${req.params.id}`));
router.post('/a11oy/actions/:id/execute', (req: Request, res: Response) => notImplemented(res, `execute action ${req.params.id}`));

router.get('/a11oy/proof', (_req: Request, res: Response) => {
  ok(res, SEED_PROOF_PACKETS, { total: SEED_PROOF_PACKETS.length });
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

router.post('/a11oy/workcells/:id/run', (req: Request, res: Response) => notImplemented(res, `run workcell ${req.params.id}`));

logger.debug('[a11oy-fabric-api] routes registered — %d signals loaded from @workspace/a11oy-fabric', SEED_SIGNALS.length);

export default router;
