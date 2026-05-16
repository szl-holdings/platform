import { a2aTaskManager } from '@szl-holdings/ai-engine';
import { anthropic } from '@szl-holdings/ai-engine/providers/anthropic';
import { pool } from '@szl-holdings/db';
import { Router } from 'express';
import { callModel } from '../../services/ai/call-model';
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
import type { CapabilityProposal, RecalibrationMemo, Scanner, Signal } from './types';

const AGENT_ID_MAP: Record<string, string> = {
  'A11oy': 'alloy',
  'Sentra': 'sentinel',
  'Aegis': 'beacon',
  'Counsel': 'inca',
  'Vessels': 'compass',
  'Lyte': 'helmsman',
  'Zeus': 'zeus',
};

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
  const { status, reason } = req.body as { status: 'accepted' | 'deferred' | 'rejected'; reason?: string };

  if (!['accepted', 'deferred', 'rejected'].includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  const idx = proposals.findIndex(p => p.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Proposal not found' });
    return;
  }

  proposals[idx] = {
    ...proposals[idx],
    status,
    updatedAt: new Date().toISOString(),
    ...(reason ? { statusReason: reason } : {}),
  };
  res.json({ proposal: proposals[idx] });
});

// ── Promote proposal → A2A project task surface ───────────────────────────
// Tracks proposalId → a2aTaskId so we can detect double-promotes.
const promotedProposals = new Map<string, string>();

router.post('/proposals/:id/promote', (req, res) => {
  const { id } = req.params;
  const idx = proposals.findIndex(p => p.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Proposal not found' });
    return;
  }

  const existingTaskId = promotedProposals.get(id);
  if (existingTaskId) {
    const existing = a2aTaskManager.getTask(existingTaskId);
    const taskRef = `FI-${id.replace('prop-', '').padStart(3, '0')}`;
    res.json({ task: { taskRef, taskId: existingTaskId, ...(existing ?? {}) }, alreadyPromoted: true });
    return;
  }

  const proposal = proposals[idx];
  const agentId = AGENT_ID_MAP[proposal.targetAgent] ?? 'alloy';
  const taskRef = `FI-${id.replace('prop-', '').padStart(3, '0')}`;

  const a2aTask = a2aTaskManager.createTask(
    agentId,
    {
      query: `[${taskRef}] ${proposal.title}`,
      context: {
        proposalId: id,
        description: proposal.description,
        rationale: proposal.rationale,
        priority: proposal.priority,
        impactArea: proposal.impactArea,
        signalIds: proposal.signalIds,
        estimatedEffort: proposal.estimatedEffort,
        source: 'frontier-intelligence',
        taskRef,
      },
    },
    'frontier-intelligence',
    'A11oy Frontier',
  );

  promotedProposals.set(id, a2aTask.taskId);
  proposals[idx] = { ...proposals[idx], status: 'accepted', updatedAt: new Date().toISOString() };

  res.status(201).json({
    task: {
      taskRef,
      taskId: a2aTask.taskId,
      status: a2aTask.status,
      agentId,
      createdAt: a2aTask.createdAt,
      title: proposal.title,
      priority: proposal.priority,
    },
    proposal: proposals[idx],
  });
});

router.get('/proposals/backlog', (_req, res) => {
  const tasks = Array.from(promotedProposals.entries()).map(([proposalId, taskId]) => {
    const task = a2aTaskManager.getTask(taskId);
    const taskRef = `FI-${proposalId.replace('prop-', '').padStart(3, '0')}`;
    return { taskRef, taskId, proposalId, ...(task ?? { status: 'unknown' }) };
  });
  res.json({ tasks, total: tasks.length });
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
// Memos generated by the synthesis pipeline are persisted to a Postgres table
// (`helios_recalibration_memos`) so that drafts survive process restarts. Seed
// memos remain in `RECALIBRATION_MEMOS` and are merged with stored memos on
// read, with stored entries (newer) taking precedence on id collision.

let _memoSchemaBootstrapped = false;
let _memoSchemaPromise: Promise<void> | null = null;

async function ensureMemoSchema(): Promise<void> {
  if (_memoSchemaBootstrapped) return;
  if (!_memoSchemaPromise) {
    _memoSchemaPromise = pool
      .query(
        `CREATE TABLE IF NOT EXISTS helios_recalibration_memos (
           id              TEXT PRIMARY KEY,
           week_of         TEXT NOT NULL,
           title           TEXT NOT NULL,
           audit           TEXT NOT NULL,
           blueprint       TEXT NOT NULL,
           roadmap         TEXT NOT NULL,
           signal_count    INTEGER NOT NULL,
           proposal_count  INTEGER NOT NULL,
           status          TEXT NOT NULL DEFAULT 'draft',
           generated       BOOLEAN NOT NULL DEFAULT TRUE,
           source_signals  JSONB NOT NULL DEFAULT '[]'::jsonb,
           created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
         )`,
      )
      .then(
        () => {
          _memoSchemaBootstrapped = true;
        },
        (err) => {
          // Clear the cached promise so a transient DB outage doesn't
          // permanently disable persistence — the next caller will retry.
          _memoSchemaPromise = null;
          throw err;
        },
      );
  }
  return _memoSchemaPromise;
}

interface StoredMemoRow {
  id: string;
  week_of: string;
  title: string;
  audit: string;
  blueprint: string;
  roadmap: string;
  signal_count: number;
  proposal_count: number;
  status: 'draft' | 'published';
  generated: boolean;
  source_signals: string[];
  created_at: Date;
}

function rowToMemo(row: StoredMemoRow): RecalibrationMemo & { sourceSignalIds: string[] } {
  return {
    id: row.id,
    weekOf: row.week_of,
    title: row.title,
    audit: row.audit,
    blueprint: row.blueprint,
    roadmap: row.roadmap,
    signalCount: row.signal_count,
    proposalCount: row.proposal_count,
    status: row.status,
    generated: row.generated,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    sourceSignalIds: Array.isArray(row.source_signals) ? row.source_signals : [],
  };
}

async function loadStoredMemos(): Promise<RecalibrationMemo[]> {
  try {
    await ensureMemoSchema();
    const r = await pool.query<StoredMemoRow>(
      `SELECT * FROM helios_recalibration_memos ORDER BY created_at DESC`,
    );
    return r.rows.map(rowToMemo);
  } catch {
    return [];
  }
}

async function listMemos(): Promise<RecalibrationMemo[]> {
  const stored = await loadStoredMemos();
  const storedIds = new Set(stored.map(m => m.id));
  const seeded = RECALIBRATION_MEMOS.filter(m => !storedIds.has(m.id));
  return [...stored, ...seeded];
}

router.get('/memos', async (_req, res) => {
  res.json({ memos: await listMemos() });
});

router.get('/memos/:id', async (req, res) => {
  const all = await listMemos();
  const memo = all.find(m => m.id === req.params.id);
  if (!memo) {
    res.status(404).json({ error: 'Memo not found' });
    return;
  }
  res.json({ memo });
});

// ── Memo synthesis pipeline ──────────────────────────────────────────────────
// Groups the week's top signals by theme, then drafts an audit/blueprint/roadmap
// memo. The output is persisted as `status: draft` for human review before it
// is marked published.
const SIGNAL_THEME_MAP: Record<string, 'capability' | 'regulatory' | 'vendor'> = {
  capability: 'capability',
  benchmark: 'capability',
  threat: 'capability',
  regulation: 'regulatory',
  market: 'vendor',
  vendor: 'vendor',
};

const THEME_LABEL: Record<'capability' | 'regulatory' | 'vendor', string> = {
  capability: 'Capability gaps',
  regulatory: 'Regulatory pressure',
  vendor: 'Vendor & market shifts',
};

function priorityFromImpact(impact: number): 'P0' | 'P1' | 'P2' | 'P3' {
  if (impact >= 0.9) return 'P0';
  if (impact >= 0.8) return 'P1';
  if (impact >= 0.65) return 'P2';
  return 'P3';
}

function weekOfMonday(d: Date): string {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day; // back to Monday
  copy.setDate(copy.getDate() + diff);
  return copy.toISOString().slice(0, 10);
}

interface MemoSections {
  audit: string;
  blueprint: string;
  roadmap: string;
}

interface GroupedSignals {
  capability: Signal[];
  regulatory: Signal[];
  vendor: Signal[];
}

function groupSignalsByTheme(signals: Signal[]): GroupedSignals {
  const grouped: GroupedSignals = { capability: [], regulatory: [], vendor: [] };
  for (const s of signals) {
    const theme = SIGNAL_THEME_MAP[s.kind] ?? 'capability';
    grouped[theme].push(s);
  }
  return grouped;
}

/** Deterministic fallback when AI synthesis is unavailable. */
function templatedSections(
  signals: Signal[],
  grouped: GroupedSignals,
  lookbackDays: number,
): { sections: MemoSections; proposalCount: number; affectedAgents: string[] } {
  const auditLines: string[] = [];
  const blueprintLines: string[] = [];
  const roadmapWeeks: Record<number, string[]> = { 1: [], 2: [], 3: [], 4: [] };
  const affectedAgents = new Set<string>();
  let weekCursor = 1;

  for (const theme of ['regulatory', 'capability', 'vendor'] as const) {
    const items = grouped[theme];
    if (items.length === 0) continue;
    auditLines.push(`▸ ${THEME_LABEL[theme]} (${items.length} signal${items.length === 1 ? '' : 's'}):`);
    for (const s of items) {
      auditLines.push(`  • ${s.title} — ${s.soWhat} [impact ${s.impactScore.toFixed(2)}, conf ${s.confidence.toFixed(2)}]`);
      s.affectedAgents.forEach(a => affectedAgents.add(a));
      const priority = priorityFromImpact(s.impactScore);
      const targets = s.affectedAgents.length > 0 ? s.affectedAgents.join(' + ') : 'Portfolio';
      blueprintLines.push(`${priority} — ${targets}: ${s.title}. Action: ${s.soWhat}`);
      const week = ((weekCursor - 1) % 4) + 1;
      roadmapWeeks[week].push(`${targets}: ${s.title.slice(0, 80)}${s.title.length > 80 ? '…' : ''}`);
      weekCursor += 1;
    }
    auditLines.push('');
  }

  const audit = `Auto-synthesised audit from ${signals.length} top signal${signals.length === 1 ? '' : 's'} over the last ${lookbackDays} days.\n\n${auditLines.join('\n').trim()}\n\nAffected agents: ${Array.from(affectedAgents).join(', ') || 'none flagged'}.`;
  const blueprint = `Recommended capability moves (priority ordered):\n\n${blueprintLines.join('\n\n')}`;
  const roadmap = [1, 2, 3, 4]
    .map(w => `Week ${w}:\n${(roadmapWeeks[w].length > 0 ? roadmapWeeks[w].map(x => `  • ${x}`).join('\n') : '  • (slack — verify earlier-week deliverables)')}`)
    .join('\n\n');

  return {
    sections: { audit, blueprint, roadmap },
    proposalCount: blueprintLines.length,
    affectedAgents: Array.from(affectedAgents),
  };
}

const MEMO_AI_MODEL = 'claude-3-5-sonnet-20241022';

/**
 * Drafts the audit/blueprint/roadmap sections using the api-server's AI route
 * helper (`callModel` → Anthropic). Falls back to deterministic templating if
 * the AI provider is unavailable, no API key is configured, or the JSON shape
 * does not validate. The fallback keeps the pipeline usable in dev/CI.
 */
async function aiSynthesizeSections(
  signals: Signal[],
  grouped: GroupedSignals,
  lookbackDays: number,
  orgId?: string,
): Promise<{ sections: MemoSections; usedAi: boolean }> {
  const fallback = templatedSections(signals, grouped, lookbackDays).sections;
  if (!process.env.ANTHROPIC_API_KEY) {
    return { sections: fallback, usedAi: false };
  }

  const themeBlocks = (['regulatory', 'capability', 'vendor'] as const)
    .map(theme => {
      const items = grouped[theme];
      if (items.length === 0) return '';
      const lines = items.map(s =>
        `- [${s.kind}] ${s.title} (impact ${s.impactScore.toFixed(2)}, conf ${s.confidence.toFixed(2)}, agents: ${s.affectedAgents.join(', ') || 'none'})\n  so-what: ${s.soWhat}`,
      );
      return `### ${THEME_LABEL[theme]}\n${lines.join('\n')}`;
    })
    .filter(Boolean)
    .join('\n\n');

  const systemPrompt = `You are A11oy's Recalibration Memo synthesiser. Given top frontier-intelligence signals from the last ${lookbackDays} days, produce a draft weekly memo. Output STRICT JSON with exactly three string fields: "audit", "blueprint", "roadmap". No markdown fences, no extra keys, no preamble.

- audit: 4-8 bullet-style lines summarising what the signals reveal (capability gaps, regulatory pressure, vendor moves). Reference signal titles.
- blueprint: priority-ranked recommended capability upgrades. Use P0/P1/P2/P3 prefixes and target specific agents from the signals when applicable.
- roadmap: 4-week execution sequence (Week 1 / Week 2 / Week 3 / Week 4) tying blueprint items to delivery weeks.`;

  const userPrompt = `Top signals (${signals.length}) grouped by theme:\n\n${themeBlocks}\n\nReturn JSON only.`;

  try {
    const { content } = await callModel({
      provider: 'anthropic',
      model: MEMO_AI_MODEL,
      surface: 'helios-memo-generate',
      orgId,
      estimatedInputTokens: 800,
      fn: async () => {
        const result = await anthropic.messages.create({
          model: MEMO_AI_MODEL,
          max_tokens: 2000,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        });
        const text = result.content[0]?.type === 'text' ? result.content[0].text : '';
        return {
          promptTokens: result.usage.input_tokens,
          completionTokens: result.usage.output_tokens,
          content: text,
        };
      },
    });

    const cleaned = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    const parsed = JSON.parse(cleaned) as Partial<MemoSections>;
    if (
      typeof parsed.audit === 'string' && parsed.audit.length > 0 &&
      typeof parsed.blueprint === 'string' && parsed.blueprint.length > 0 &&
      typeof parsed.roadmap === 'string' && parsed.roadmap.length > 0
    ) {
      return {
        sections: { audit: parsed.audit, blueprint: parsed.blueprint, roadmap: parsed.roadmap },
        usedAi: true,
      };
    }
    return { sections: fallback, usedAi: false };
  } catch {
    return { sections: fallback, usedAi: false };
  }
}

router.post('/memos/generate', async (req, res) => {
  const { lookbackDays = 7, topN = 8 } = (req.body ?? {}) as { lookbackDays?: number; topN?: number };
  const cutoff = Date.now() - Math.max(1, Number(lookbackDays)) * 86_400_000;

  const recent = SIGNALS
    .filter(s => new Date(s.createdAt).getTime() >= cutoff)
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, Math.max(1, Math.min(50, Number(topN))));

  if (recent.length === 0) {
    res.status(400).json({ error: 'No signals available in lookback window' });
    return;
  }

  const grouped = groupSignalsByTheme(recent);
  const orgId = (req as { user?: { orgId?: string } }).user?.orgId;
  const { sections, usedAi } = await aiSynthesizeSections(recent, grouped, Number(lookbackDays), orgId);
  const { proposalCount } = templatedSections(recent, grouped, Number(lookbackDays));

  const now = new Date();
  const id = `memo-gen-${now.getTime()}`;
  const weekOf = weekOfMonday(now);
  const weekLabel = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const topKindCounts = recent.reduce<Record<string, number>>((acc, s) => {
    acc[s.kind] = (acc[s.kind] ?? 0) + 1;
    return acc;
  }, {});
  const headline = Object.entries(topKindCounts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k).join(' & ');

  const memo: RecalibrationMemo = {
    id,
    weekOf,
    title: `[DRAFT] Week of ${weekLabel}: ${headline ? headline.replace(/\b\w/g, c => c.toUpperCase()) + ' Synthesis' : 'Auto-Synthesised Recalibration'}`,
    audit: sections.audit,
    blueprint: sections.blueprint,
    roadmap: sections.roadmap,
    signalCount: recent.length,
    proposalCount,
    createdAt: now.toISOString(),
    status: 'draft',
    generated: true,
  };

  // Persist to Postgres so drafts survive process restarts.
  let persisted = false;
  try {
    await ensureMemoSchema();
    await pool.query(
      `INSERT INTO helios_recalibration_memos
         (id, week_of, title, audit, blueprint, roadmap, signal_count, proposal_count, status, generated, source_signals, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         audit = EXCLUDED.audit,
         blueprint = EXCLUDED.blueprint,
         roadmap = EXCLUDED.roadmap,
         signal_count = EXCLUDED.signal_count,
         proposal_count = EXCLUDED.proposal_count,
         status = EXCLUDED.status,
         source_signals = EXCLUDED.source_signals`,
      [
        memo.id, memo.weekOf, memo.title, memo.audit, memo.blueprint, memo.roadmap,
        memo.signalCount, memo.proposalCount, memo.status ?? 'draft', memo.generated ?? true,
        JSON.stringify(recent.map(s => s.id)), now.toISOString(),
      ],
    );
    persisted = true;
  } catch {
    // Fall back to in-memory list so the response is still useful in dev/CI.
    RECALIBRATION_MEMOS.unshift(memo);
  }

  res.status(201).json({
    memo,
    sourceSignalIds: recent.map(s => s.id),
    themeCounts: {
      capability: grouped.capability.length,
      regulatory: grouped.regulatory.length,
      vendor: grouped.vendor.length,
    },
    aiUsed: usedAi,
    persisted,
  });
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
