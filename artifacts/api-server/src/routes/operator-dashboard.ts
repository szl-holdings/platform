/**
 * Operator Dashboard (Task #5175)
 *
 * Roll-up across product surfaces operators need in one place. Backed by
 * the in-process stores already exposed by other a11oy routes:
 *  - workcells:        listWorkcells() from the a11oy runtime engine
 *  - eval regressions: computeAlerts() from a11oy-leader-upgrades
 *  - BOM attestations: listRecentBomAttestations() from a11oy-leader-upgrades
 *  - pattern maturity: patternStats + listPatternTransitions() from a11oy-leader-upgrades
 *  - signal volume:    union of eval runs (runStore), workcell history,
 *                      BOM attestations, and pattern usage — bucketed per
 *                      vertical so the operator gets real cross-product
 *                      activity rather than synthetic noise
 *  - lutar snippet:    lutarInvariant5() over the latest synthesised axes
 *
 * Endpoints (mounted under /api):
 *   GET /operator/dashboard          — JSON snapshot
 *   GET /operator/dashboard/stream   — SSE pushing the snapshot every 5s
 */

import { type Request, type Response, Router } from 'express';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { listWorkcells, type WorkcellEntity } from '../a11oy/runtime/workcells/engine.js';
import { runStore } from './evals';
import {
  computeAlerts,
  suiteBaselines,
  patternStats,
  listPatternTransitions,
  listRecentBomAttestations,
  type BomAttestationRecord,
} from './a11oy-leader-upgrades';
import { lutarInvariant5, defaultWeights5 } from '@workspace/lutar-formulas/lutar';

const router = Router();

interface WorkcellPhaseCount {
  phase: string;
  open: number;
  paused: number;
  blocked: number;
}

interface EvalRegressionItem {
  suiteId: string;
  severity: 'minor' | 'major' | 'critical';
  delta: number;
  baselineAvgScore: number;
  latestAvgScore: number;
  detectedAt: string;
}

interface BomAttestationEntry {
  agentId: string;
  agentName: string;
  modelSnapshot: string;
  attestedAt: string;
  verified: boolean;
  diffFromPrior: number;
}

interface PatternMaturityChange {
  patternId: string;
  patternName: string;
  fromStage: string;
  toStage: string;
  usageCount: number;
  changedAt: string;
}

interface SignalVolumeBucket {
  at: string;
  total: number;
  byVertical: Record<string, number>;
}

interface OperatorSnapshot {
  generatedAt: string;
  workcells: {
    totalOpen: number;
    byPhase: WorkcellPhaseCount[];
    slaBreachingCount: number;
  };
  evalRegressions: {
    total: number;
    bySeverity: { critical: number; major: number; minor: number };
    top: EvalRegressionItem[];
    baselinesConfigured: number;
  };
  bomAttestations: {
    last24h: number;
    failingVerification: number;
    recent: BomAttestationEntry[];
  };
  patternMaturity: {
    promotionsLast7d: number;
    demotionsLast7d: number;
    recent: PatternMaturityChange[];
  };
  signalVolume: {
    perMinuteNow: number;
    last60mTotal: number;
    sparkline: SignalVolumeBucket[];
    byVertical: Record<string, number>;
  };
  lutar: {
    invariant: number;
    delta24h: number;
    confidenceFloor: number;
  };
}

const TERMINAL_PHASES = new Set(['archived', 'proven', 'rejected']);
const PAUSED_PHASES = new Set(['approval_required']);
const BLOCKED_PHASES = new Set(['blocked']);

const STAGE_RANK: Record<string, number> = { experimental: 0, beta: 1, stable: 2 };

function classifyPhase(phase: string): 'open' | 'paused' | 'blocked' {
  if (BLOCKED_PHASES.has(phase)) return 'blocked';
  if (PAUSED_PHASES.has(phase)) return 'paused';
  return 'open';
}

function buildWorkcells(all: WorkcellEntity[]): OperatorSnapshot['workcells'] {
  const now = Date.now();
  const byPhaseMap = new Map<string, WorkcellPhaseCount>();
  let slaBreachingCount = 0;
  let totalOpen = 0;
  for (const wc of all) {
    if (TERMINAL_PHASES.has(wc.phase)) continue;
    totalOpen++;
    const updatedAge = now - new Date(wc.updatedAt).getTime();
    if (updatedAge > wc.maxRunDurationMs) slaBreachingCount++;
    const bucket = byPhaseMap.get(wc.phase) ?? { phase: wc.phase, open: 0, paused: 0, blocked: 0 };
    bucket[classifyPhase(wc.phase)]++;
    byPhaseMap.set(wc.phase, bucket);
  }
  return {
    totalOpen,
    byPhase: Array.from(byPhaseMap.values()).sort((a, b) =>
      (b.open + b.paused + b.blocked) - (a.open + a.paused + a.blocked)
    ),
    slaBreachingCount,
  };
}

function buildEvalRegressions(): OperatorSnapshot['evalRegressions'] {
  const alerts = computeAlerts();
  const sorted = [...alerts].sort((a, b) => a.delta - b.delta);
  const top: EvalRegressionItem[] = sorted.slice(0, 5).map((a) => ({
    suiteId: a.suiteId,
    severity: a.severity,
    delta: a.delta,
    baselineAvgScore: a.baselineAvgScore,
    latestAvgScore: a.latestAvgScore,
    detectedAt: a.detectedAt,
  }));
  const bySeverity = { critical: 0, major: 0, minor: 0 } as { critical: number; major: number; minor: number };
  for (const a of alerts) bySeverity[a.severity]++;
  return {
    total: alerts.length,
    bySeverity,
    top,
    baselinesConfigured: suiteBaselines.size,
  };
}

function buildBomAttestations(): OperatorSnapshot['bomAttestations'] {
  const all = listRecentBomAttestations(50);
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  // Group by agentId so we can compute diffFromPrior against the agent's
  // previous (older) attestation by receiptCount.
  const byAgent = new Map<string, BomAttestationRecord[]>();
  for (const r of all) {
    const arr = byAgent.get(r.agentId) ?? [];
    arr.push(r);
    byAgent.set(r.agentId, arr);
  }
  for (const arr of byAgent.values()) {
    arr.sort((a, b) => a.attestedAt.localeCompare(b.attestedAt));
  }
  const last24h = all.filter((r) => new Date(r.attestedAt).getTime() >= cutoff).length;
  const failingVerification = all.filter((r) => !r.verified).length;
  const recent: BomAttestationEntry[] = all.slice(0, 8).map((r) => {
    const series = byAgent.get(r.agentId) ?? [];
    const idx = series.findIndex((s) => s.attestedAt === r.attestedAt && s.merkleRoot === r.merkleRoot);
    const prior = idx > 0 ? series[idx - 1] : undefined;
    const diffFromPrior = prior ? r.receiptCount - prior.receiptCount : 0;
    return {
      agentId: r.agentId,
      agentName: r.agentName,
      modelSnapshot: r.modelSnapshot,
      attestedAt: r.attestedAt,
      verified: r.verified,
      diffFromPrior,
    };
  });
  return { last24h, failingVerification, recent };
}

function buildPatternMaturity(): OperatorSnapshot['patternMaturity'] {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const transitions = listPatternTransitions();
  const within7d = transitions.filter((t) => new Date(t.changedAt).getTime() >= cutoff);
  let promotionsLast7d = 0;
  let demotionsLast7d = 0;
  for (const t of within7d) {
    const from = STAGE_RANK[t.fromStage] ?? 0;
    const to = STAGE_RANK[t.toStage] ?? 0;
    if (to > from) promotionsLast7d++;
    else if (to < from) demotionsLast7d++;
  }
  const recent: PatternMaturityChange[] = transitions.slice(0, 8).map((t) => ({
    patternId: t.patternKey,
    patternName: t.patternKey,
    fromStage: t.fromStage,
    toStage: t.toStage,
    usageCount: t.callCount,
    changedAt: t.changedAt,
  }));
  return { promotionsLast7d, demotionsLast7d, recent };
}

const SIGNAL_BUCKET_COUNT = 12;
const SIGNAL_BUCKET_MS = 5 * 60 * 1000;

interface SignalEvent { ts: number; vertical: string }

function collectSignalEvents(workcells: WorkcellEntity[]): SignalEvent[] {
  const events: SignalEvent[] = [];
  // Workcell phase transitions: each history entry is a real lifecycle event.
  for (const wc of workcells) {
    for (const h of wc.history) {
      events.push({ ts: new Date(h.timestamp).getTime(), vertical: wc.vertical || 'workcells' });
    }
  }
  // Eval runs.
  for (const r of runStore.values()) {
    events.push({ ts: new Date(r.runAt).getTime(), vertical: 'evals' });
  }
  // BOM attestations.
  for (const a of listRecentBomAttestations(50)) {
    events.push({ ts: new Date(a.attestedAt).getTime(), vertical: 'attestations' });
  }
  // Pattern usage — patternStats only retains lastUsedAt, so one event per
  // pattern weighted by callCount delta would be misleading. We emit one
  // event at lastUsedAt instead so the vertical shows real activity.
  for (const p of patternStats.values()) {
    events.push({ ts: new Date(p.lastUsedAt).getTime(), vertical: 'patterns' });
  }
  return events;
}

function buildSignalVolume(workcells: WorkcellEntity[]): OperatorSnapshot['signalVolume'] {
  const now = Date.now();
  const events = collectSignalEvents(workcells);
  const buckets: SignalVolumeBucket[] = [];
  for (let i = SIGNAL_BUCKET_COUNT - 1; i >= 0; i--) {
    const start = now - (i + 1) * SIGNAL_BUCKET_MS;
    const end = now - i * SIGNAL_BUCKET_MS;
    const byVertical: Record<string, number> = {};
    let total = 0;
    for (const e of events) {
      if (e.ts >= start && e.ts < end) {
        total++;
        byVertical[e.vertical] = (byVertical[e.vertical] ?? 0) + 1;
      }
    }
    buckets.push({ at: new Date(end).toISOString(), total, byVertical });
  }
  const cutoff60m = now - 60 * 60 * 1000;
  const cutoff1m = now - 60 * 1000;
  const byVertical: Record<string, number> = {};
  let last60mTotal = 0;
  let perMinuteNow = 0;
  for (const e of events) {
    if (e.ts >= cutoff60m) {
      last60mTotal++;
      byVertical[e.vertical] = (byVertical[e.vertical] ?? 0) + 1;
    }
    if (e.ts >= cutoff1m) perMinuteNow++;
  }
  return { perMinuteNow, last60mTotal, sparkline: buckets, byVertical };
}

/**
 * Lutar snippet uses the same deterministic axis trajectory as
 * /formulas/lutar-invariant-5 so the dashboard summary stays consistent
 * with the dedicated gauge.
 */
function buildLutarSnippet(): OperatorSnapshot['lutar'] {
  const now = Date.now();
  const wave = (t: number, phase: number, period: number, lo: number, hi: number) => {
    const mid = (lo + hi) / 2;
    const amp = (hi - lo) / 2;
    return mid + amp * Math.sin((2 * Math.PI * t) / period + phase);
  };
  const sampleAt = (epochMs: number) => {
    const t = epochMs / (1000 * 60 * 60);
    return {
      cleanliness:  wave(t, 0.0, 36, 0.74, 0.92),
      horizon:      wave(t, 1.1, 48, 0.68, 0.88),
      resonance:    wave(t, 2.3, 30, 0.62, 0.84),
      frustum:      wave(t, 0.6, 60, 0.71, 0.90),
      gaussClosure: wave(t, 1.8, 42, 0.66, 0.86),
    };
  };
  const currentAxes = sampleAt(now);
  const priorAxes = sampleAt(now - 24 * 60 * 60 * 1000);
  const current = lutarInvariant5(currentAxes, defaultWeights5()).invariant;
  const prior = lutarInvariant5(priorAxes, defaultWeights5()).invariant;
  const confidenceFloor = Math.min(...Object.values(currentAxes));
  return {
    invariant: Number(current.toFixed(4)),
    delta24h: Number((current - prior).toFixed(4)),
    confidenceFloor: Number(confidenceFloor.toFixed(4)),
  };
}

function buildSnapshot(): OperatorSnapshot {
  const wcs = listWorkcells();
  return {
    generatedAt: new Date().toISOString(),
    workcells: buildWorkcells(wcs),
    evalRegressions: buildEvalRegressions(),
    bomAttestations: buildBomAttestations(),
    patternMaturity: buildPatternMaturity(),
    signalVolume: buildSignalVolume(wcs),
    lutar: buildLutarSnippet(),
  };
}

router.get('/operator/dashboard', (_req: Request, res: Response) => {
  try {
    sendSuccess(res, buildSnapshot());
  } catch (err) {
    handleRouteError(res, err, 'GET /operator/dashboard');
  }
});

router.get('/operator/dashboard/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (event: string, data: unknown): void => {
    if (res.writableEnded) return;
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {
      /* ignore */
    }
  };

  send('snapshot', buildSnapshot());

  const tick = setInterval(() => send('snapshot', buildSnapshot()), 5000);
  const keepalive = setInterval(() => {
    if (!res.writableEnded) res.write(': keepalive\n\n');
  }, 25000);

  const cleanup = () => {
    clearInterval(tick);
    clearInterval(keepalive);
    if (!res.writableEnded) res.end();
  };
  req.on('close', cleanup);
  req.on('aborted', cleanup);
});

export default router;
