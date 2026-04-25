import { Router } from 'express';
import {
  BENCHMARK_SCORES,
  BENCHMARK_TIME_SERIES,
  MYTHOS_EDGES,
  MYTHOS_NODES,
  PROPOSALS,
  RECALIBRATION_MEMOS,
  SCANNERS,
  SIGNALS,
} from './data';
import type { CapabilityProposal, Scanner } from './types';

const router = Router();

// In-memory mutable state (persists for server lifetime)
let proposals: CapabilityProposal[] = [...PROPOSALS];
let scanners: Scanner[] = [...SCANNERS];

// ── Stats ─────────────────────────────────────────────────────────────────────
router.get('/stats', (_req, res) => {
  const signalsToday = SIGNALS.filter(s => {
    const d = new Date(s.createdAt);
    const now = new Date();
    return now.getTime() - d.getTime() < 86_400_000;
  }).length;

  const proposalsOpen = proposals.filter(p => p.status === 'new').length;
  const scannersActive = scanners.filter(s => s.enabled).length;
  const avgConfidence = SIGNALS.reduce((sum, s) => sum + s.confidence, 0) / SIGNALS.length;

  const kindCounts: Record<string, number> = {};
  for (const s of SIGNALS) {
    kindCounts[s.kind] = (kindCounts[s.kind] ?? 0) + 1;
  }
  const topKinds = Object.entries(kindCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([kind, count]) => ({ kind, count }));

  res.json({ signalsToday, proposalsOpen, scannersActive, avgConfidence, topKinds });
});

// ── Signals ──────────────────────────────────────────────────────────────────
router.get('/signals', (req, res) => {
  const { kind, page = '1', pageSize = '20', q } = req.query as Record<string, string>;
  let filtered = [...SIGNALS];

  if (kind) filtered = filtered.filter(s => s.kind === kind);
  if (q) {
    const lower = q.toLowerCase();
    filtered = filtered.filter(s =>
      s.title.toLowerCase().includes(lower) ||
      s.summary.toLowerCase().includes(lower) ||
      s.entities.some(e => e.toLowerCase().includes(lower)) ||
      s.affectedAgents.some(a => a.toLowerCase().includes(lower)),
    );
  }

  const pageNum = Math.max(1, Number(page));
  const size = Math.min(100, Math.max(1, Number(pageSize)));
  const total = filtered.length;
  const start = (pageNum - 1) * size;
  const signals = filtered.slice(start, start + size);

  res.json({ signals, total, page: pageNum, pageSize: size });
});

// ── Mythos Index ──────────────────────────────────────────────────────────────
router.get('/mythos', (_req, res) => {
  res.json({ nodes: MYTHOS_NODES, edges: MYTHOS_EDGES });
});

router.get('/mythos/search', (req, res) => {
  const { q = '' } = req.query as Record<string, string>;
  const lower = q.toLowerCase();

  const scored = MYTHOS_NODES
    .map(n => {
      let score = n.relevanceScore * 0.4;
      if (n.label.toLowerCase().includes(lower)) score += 0.5;
      if (n.description.toLowerCase().includes(lower)) score += 0.3;
      if (n.tags.some(t => t.toLowerCase().includes(lower))) score += 0.2;
      return { node: n, score };
    })
    .filter(({ score }) => score > 0.4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  const nodeIds = new Set(scored.map(({ node }) => node.id));
  const nodes = scored.map(({ node }) => node);
  const edges = MYTHOS_EDGES.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

  res.json({ nodes, edges, query: q });
});

router.get('/mythos/nodes/:id', (req, res) => {
  const node = MYTHOS_NODES.find(n => n.id === req.params.id);
  if (!node) {
    res.status(404).json({ error: 'Node not found' });
    return;
  }

  const neighborEdges = MYTHOS_EDGES.filter(e => e.source === node.id || e.target === node.id);
  const neighborIds = new Set(neighborEdges.flatMap(e => [e.source, e.target]).filter(id => id !== node.id));
  const neighbors = MYTHOS_NODES.filter(n => neighborIds.has(n.id));

  res.json({ node, neighbors, edges: neighborEdges });
});

// ── Proposals ─────────────────────────────────────────────────────────────────
router.get('/proposals', (req, res) => {
  const { status, limit } = req.query as Record<string, string>;
  let filtered = [...proposals];
  if (status && status !== 'all') {
    const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
    filtered = filtered.filter(p => statuses.includes(p.status));
  }
  if (limit) {
    const n = Math.max(1, Math.min(100, Number(limit)));
    filtered = filtered.slice(0, n);
  }
  res.json({ proposals: filtered, total: filtered.length });
});

router.patch('/proposals/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status: 'accepted' | 'deferred' | 'rejected' };

  if (!['accepted', 'deferred', 'rejected'].includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  const idx = proposals.findIndex(p => p.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Proposal not found' });
    return;
  }

  proposals[idx] = { ...proposals[idx], status, updatedAt: new Date().toISOString() };
  res.json({ proposal: proposals[idx] });
});

// ── Benchmarks ────────────────────────────────────────────────────────────────
router.get('/benchmarks', (_req, res) => {
  res.json({ scores: BENCHMARK_SCORES, timeSeries: BENCHMARK_TIME_SERIES });
});

// ── Scanners ──────────────────────────────────────────────────────────────────
router.get('/scanners', (_req, res) => {
  res.json({ scanners });
});

router.patch('/scanners/:id/toggle', (req, res) => {
  const { id } = req.params;
  const { enabled } = req.body as { enabled: boolean };

  const idx = scanners.findIndex(s => s.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Scanner not found' });
    return;
  }

  scanners[idx] = {
    ...scanners[idx],
    enabled,
    status: enabled ? 'healthy' : 'idle',
  };
  res.json({ scanner: scanners[idx] });
});

router.post('/scanners/:id/run', (req, res) => {
  const { id } = req.params;
  const idx = scanners.findIndex(s => s.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Scanner not found' });
    return;
  }
  if (!scanners[idx].enabled) {
    res.status(400).json({ error: 'Scanner is disabled' });
    return;
  }

  const now = new Date().toISOString();
  const next = new Date(Date.now() + 86_400_000).toISOString();
  scanners[idx] = {
    ...scanners[idx],
    lastRun: now,
    nextRun: next,
    status: 'healthy',
    errorMessage: undefined,
    signalsToday: scanners[idx].signalsToday + Math.floor(Math.random() * 3 + 1),
  };

  res.json({ message: `Scanner "${scanners[idx].name}" triggered successfully. Results will appear in the feed within minutes.` });
});

// ── Recalibration Memos ───────────────────────────────────────────────────────
router.get('/memos', (_req, res) => {
  res.json({ memos: RECALIBRATION_MEMOS });
});

router.get('/memos/:id', (req, res) => {
  const memo = RECALIBRATION_MEMOS.find(m => m.id === req.params.id);
  if (!memo) {
    res.status(404).json({ error: 'Memo not found' });
    return;
  }
  res.json({ memo });
});

// ── MCP endpoint (Mythos query for portfolio agents) ──────────────────────────
router.post('/mcp', (req, res) => {
  const { query, entity, benchmark } = req.body as Record<string, string>;

  if (entity) {
    const node = MYTHOS_NODES.find(n => n.label.toLowerCase() === entity.toLowerCase());
    if (node) {
      const edges = MYTHOS_EDGES.filter(e => e.source === node.id || e.target === node.id);
      res.json({ type: 'entity', node, edges, signals: SIGNALS.filter(s => s.entities.includes(entity)) });
      return;
    }
  }

  if (benchmark) {
    const scores = BENCHMARK_SCORES.filter(s => s.benchmark === benchmark);
    res.json({ type: 'benchmark', benchmark, scores });
    return;
  }

  if (query) {
    const lower = query.toLowerCase();
    const relevantSignals = SIGNALS.filter(s =>
      s.title.toLowerCase().includes(lower) || s.summary.toLowerCase().includes(lower)
    ).slice(0, 5);
    const relevantNodes = MYTHOS_NODES.filter(n =>
      n.label.toLowerCase().includes(lower) || n.description.toLowerCase().includes(lower)
    ).slice(0, 5);
    res.json({ type: 'query', query, signals: relevantSignals, nodes: relevantNodes });
    return;
  }

  res.status(400).json({ error: 'Provide query, entity, or benchmark parameter' });
});

// ── Frontier briefing (for Pulse widget) ──────────────────────────────────────
router.get('/frontier-briefing', (_req, res) => {
  const latestMemo = RECALIBRATION_MEMOS[0];
  const topProposals = proposals.filter(p => p.status === 'new').slice(0, 3);
  const recentSignals = SIGNALS.slice(0, 5);
  res.json({ memo: latestMemo, topProposals, recentSignals });
});

export default router;
