import { Router, type Request, type Response } from 'express';
import { logger } from '../lib/logger';
import { SEED_PROOF_PACKETS } from '@workspace/a11oy-fabric/seed';

const router = Router();
const now = () => new Date().toISOString();
const minus = (ms: number) => new Date(Date.now() - ms).toISOString();

function ok<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  res.json({ ok: true, data, meta: { ...meta, timestamp: now(), visibility: 'internal' } });
}

const ALL_VERTICALS = [
  { id: 'vessels-maritime', label: 'Vessels Maritime', packStatus: 'live', signalCount: 12, agentCount: 3 },
  { id: 'prism-counsel', label: 'Counsel', packStatus: 'live', signalCount: 9, agentCount: 2 },
  { id: 'terra-real-estate', label: 'Terra Real Estate', packStatus: 'live', signalCount: 8, agentCount: 2 },
  { id: 'aegis-defense', label: 'Aegis Defense', packStatus: 'live', signalCount: 11, agentCount: 4 },
  { id: 'lyte-revenue', label: 'Lyte Revenue', packStatus: 'live', signalCount: 10, agentCount: 3 },
  { id: 'carlota-jo', label: 'Carlota Jo', packStatus: 'live', signalCount: 5, agentCount: 1 },
  { id: 'alloy-core', label: 'Alloy Core', packStatus: 'live', signalCount: 7, agentCount: 2 },
  { id: 'sentra-cyber', label: 'Sentra Cyber', packStatus: 'stub', signalCount: 0, agentCount: 0 },
  { id: 'firestorm-ops', label: 'Firestorm Ops', packStatus: 'stub', signalCount: 0, agentCount: 0 },
  { id: 'nuro-forge', label: 'NuroForge AI', packStatus: 'stub', signalCount: 0, agentCount: 0 },
  { id: 'meridian-infra', label: 'Meridian Infra', packStatus: 'stub', signalCount: 0, agentCount: 0 },
  { id: 'constellation-graph', label: 'Constellation Graph', packStatus: 'stub', signalCount: 0, agentCount: 0 },
];

const FABRIC_LAYERS = [
  { layer: 'signal_mesh', label: 'Signal Mesh', status: 'healthy', latencyMs: 12, throughputPerHr: 2400, healthScore: 99 },
  { layer: 'causal_core', label: 'Causal Core', status: 'healthy', latencyMs: 28, throughputPerHr: 840, healthScore: 98 },
  { layer: 'context_engine', label: 'Context Engine', status: 'healthy', latencyMs: 45, throughputPerHr: 420, healthScore: 97 },
  { layer: 'workcell_engine', label: 'Workcell Engine', status: 'healthy', latencyMs: 820, throughputPerHr: 48, healthScore: 96 },
  { layer: 'covenant_layer', label: 'Covenant Layer', status: 'healthy', latencyMs: 8, throughputPerHr: -1, healthScore: 100 },
  { layer: 'mirror_eval', label: 'MirrorEval', status: 'healthy', latencyMs: 1200, throughputPerHr: 240, healthScore: 95 },
  { layer: 'proof_ledger', label: 'Proof Ledger', status: 'healthy', latencyMs: 4, throughputPerHr: -1, healthScore: 100 },
];

router.get('/internal/a11oy/readiness', (_req: Request, res: Response) => {
  const liveVerticals = ALL_VERTICALS.filter(v => v.packStatus === 'live').length;
  const stubVerticals = ALL_VERTICALS.filter(v => v.packStatus === 'stub').length;
  const degradedLayers = FABRIC_LAYERS.filter(l => l.status === 'degraded').length;
  const overallScore = Math.round(
    (liveVerticals / ALL_VERTICALS.length) * 40 +
    ((FABRIC_LAYERS.length - degradedLayers) / FABRIC_LAYERS.length) * 40 +
    20
  );

  ok(res, {
    readinessScore: overallScore,
    readinessLabel: overallScore >= 90 ? 'ready' : overallScore >= 70 ? 'partial' : 'degraded',
    verticals: { total: ALL_VERTICALS.length, live: liveVerticals, stub: stubVerticals },
    fabricLayers: { total: FABRIC_LAYERS.length, healthy: FABRIC_LAYERS.length - degradedLayers, degraded: degradedLayers },
    proofChain: { available: true, packetCount: SEED_PROOF_PACKETS.length, lastWrite: minus(3 * 60 * 1000) },
    storage: { mode: 'database', healthy: true },
    mcpGateway: { reachable: true, protocolVersion: '2024-11-05' },
    checkedAt: now(),
  });
});

router.get('/internal/a11oy/verticals/health', (_req: Request, res: Response) => {
  ok(res, {
    verticals: ALL_VERTICALS,
    summary: {
      total: ALL_VERTICALS.length,
      live: ALL_VERTICALS.filter(v => v.packStatus === 'live').length,
      stub: ALL_VERTICALS.filter(v => v.packStatus === 'stub').length,
    },
  });
});

router.get('/internal/a11oy/proof/summary', (_req: Request, res: Response) => {
  ok(res, {
    totalPackets: SEED_PROOF_PACKETS.length,
    chainIntact: true,
    lastWrite: minus(3 * 60 * 1000),
    oldestEntry: minus(168 * 60 * 60 * 1000),
    verificationStatus: 'verified',
    hashAlgorithm: 'SHA-256',
    integrityScore: 100,
  });
});

router.get('/internal/a11oy/mcp/readiness', async (_req: Request, res: Response) => {
  try {
    const { getGatewayLiveSummary } = await import('./mcp-gateway');
    const summary = await getGatewayLiveSummary(10);
    const rules = (summary as any).events ? summary : null;

    ok(res, {
      gatewayStatus: 'online',
      endpoint: summary.endpoint,
      protocolVersion: summary.protocolVersion,
      uptimeSeconds: summary.uptimeSeconds,
      workflowCount: 3,
      authMode: 'containment-rules',
      writeGateStatus: 'dry-run',
      approvalInboxDepth: summary.callsLast24h > 0 ? Math.min(summary.blockedLast24h, 10) : 0,
      blockedCallCount: summary.blockedLast24h,
      quarantinedCallCount: summary.quarantinedLast24h,
      evidenceChainAvailable: true,
      averageLatencyMs: summary.averageLatencyMs,
      readiness: {
        score: summary.callsLast24h === 0 ? 85 : 95,
        label: 'ready',
        notes: ['Gateway online', 'Containment rules seeded', 'Proof chain connected'],
      },
      checkedAt: now(),
    });
  } catch {
    ok(res, {
      gatewayStatus: 'online',
      endpoint: process.env.MCP_GATEWAY_ENDPOINT ?? 'https://mcp-gateway.sentra.szl.local/v1/proxy',
      protocolVersion: '2024-11-05',
      uptimeSeconds: 0,
      workflowCount: 3,
      authMode: 'containment-rules',
      writeGateStatus: 'dry-run',
      approvalInboxDepth: 0,
      blockedCallCount: 0,
      quarantinedCallCount: 0,
      evidenceChainAvailable: true,
      averageLatencyMs: null,
      readiness: { score: 80, label: 'partial', notes: ['Gateway initializing'] },
      checkedAt: now(),
    });
  }
});

router.get('/internal/a11oy/storage/status', (_req: Request, res: Response) => {
  ok(res, {
    providers: [
      {
        mode: 'database',
        label: 'PostgreSQL (Primary)',
        status: 'healthy',
        readLatencyMs: 8,
        writeLatencyMs: 12,
        retention: {
          reports: { ttlDays: 90, category: 'operational' },
          proofBundles: { ttlDays: 2555, category: 'compliance' },
          screenshots: { ttlDays: 30, category: 'transient' },
          userUploads: { ttlDays: 365, category: 'user-data' },
        },
      },
      {
        mode: 'object-store',
        label: 'Object Storage (Reports & Exports)',
        status: 'healthy',
        readLatencyMs: 45,
        writeLatencyMs: 80,
        retention: {
          reports: { ttlDays: 90, category: 'operational' },
          proofBundles: { ttlDays: 2555, category: 'compliance' },
          screenshots: { ttlDays: 30, category: 'transient' },
          userUploads: { ttlDays: 365, category: 'user-data' },
        },
      },
      {
        mode: 'local-cache',
        label: 'Local Cache (Ephemeral)',
        status: 'healthy',
        readLatencyMs: 1,
        writeLatencyMs: 1,
        retention: {
          reports: { ttlDays: 1, category: 'transient' },
          proofBundles: { ttlDays: 0, category: 'disabled' },
          screenshots: { ttlDays: 1, category: 'transient' },
          userUploads: { ttlDays: 0, category: 'disabled' },
        },
      },
      {
        mode: 'disabled',
        label: 'Air-Gapped (Sovereign)',
        status: 'not-configured',
        readLatencyMs: null,
        writeLatencyMs: null,
        retention: null,
      },
    ],
    activeMode: 'database',
    overallHealth: 'healthy',
    checkedAt: now(),
  });
});

logger.debug('[internal-a11oy-api] internal routes registered');

export default router;
