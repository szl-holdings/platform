/**
 * Cross-process Postgres backend for the Frontier Ingestion Engine.
 *
 * Both the Temporal worker process (which runs scheduled pulls via
 * activities) and the api-server process (which serves the operator
 * UI at /a11oy/frontier and /a11oy/frontier/inbox) must observe the
 * SAME state — discoveries, queued items, promotions, downstream
 * routing, spend meters. Without this, scheduled ingestion would be
 * invisible to the operator UI.
 *
 * Strategy
 * --------
 * - Lazy `pg` import via `@szl-holdings/db` so unit tests that have
 *   no DATABASE_URL still run with the in-memory backend.
 * - Idempotent CREATE TABLE IF NOT EXISTS bootstrap, run once per
 *   process on first use. Schema is intentionally narrow and self-
 *   contained (`frontier_*` namespace) so it doesn't entangle with
 *   the canonical drizzle schema.
 * - All mutating store/adapter calls fire-and-forget into the DB;
 *   read-side endpoints in api-server prefer the DB when enabled.
 * - Pluggable: callers check `isDbBackendEnabled()` and fall back to
 *   the in-memory store on transient DB errors so a flaky DB never
 *   blocks ingestion.
 */
import type {
  EvidencePack,
  FrontierArtifact,
  FrontierProvider,
  FrontierStats,
  InboxItem,
  PromotionTarget,
  TimelineEvent,
} from './types.js';

type PgPoolLike = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: Row[]; rowCount: number | null }>;
};

let pool: PgPoolLike | undefined;
let initialized = false;
let initPromise: Promise<void> | undefined;
let enabled = false;

function dbDisabledByEnv(): boolean {
  return process.env.FRONTIER_INGEST_DB_DISABLED === 'true';
}

async function loadPool(): Promise<PgPoolLike | undefined> {
  if (pool) return pool;
  if (dbDisabledByEnv()) return undefined;
  if (!process.env.DATABASE_URL) return undefined;
  try {
    // Lazy import: tests without DB still pass.
    const mod = (await import('@szl-holdings/db')) as { pool?: PgPoolLike };
    if (mod?.pool) {
      pool = mod.pool;
      return pool;
    }
  } catch {
    // @szl-holdings/db may not resolve in some test envs — fall back.
  }
  // No `pg` direct fallback — `@szl-holdings/db` is the canonical
  // workspace pool. Keeping this single-path avoids duplicate
  // connections and keeps the type surface clean (no @types/pg dep).
  return undefined;
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS frontier_artifacts (
  id            text PRIMARY KEY,
  provider      text NOT NULL,
  kind          text NOT NULL,
  external_id   text NOT NULL,
  title         text NOT NULL,
  url           text NOT NULL,
  summary       text,
  published_at  timestamptz,
  tags          jsonb NOT NULL DEFAULT '[]'::jsonb,
  raw           jsonb,
  discovered_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS frontier_evidence (
  artifact_id      text PRIMARY KEY REFERENCES frontier_artifacts(id) ON DELETE CASCADE,
  score            jsonb NOT NULL,
  decision         text  NOT NULL,
  promotion_target text,
  evaluated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS frontier_inbox (
  id           text PRIMARY KEY,
  artifact_id  text NOT NULL REFERENCES frontier_artifacts(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending',
  reviewed_at  timestamptz,
  reviewed_by  text,
  review_note  text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS frontier_inbox_status_idx ON frontier_inbox(status, created_at DESC);

CREATE TABLE IF NOT EXISTS frontier_promotions (
  id           bigserial PRIMARY KEY,
  artifact_id  text NOT NULL REFERENCES frontier_artifacts(id) ON DELETE CASCADE,
  target       text NOT NULL,
  promoted_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS frontier_promotions_target_idx ON frontier_promotions(target, promoted_at DESC);

CREATE TABLE IF NOT EXISTS frontier_downstream (
  id            bigserial PRIMARY KEY,
  target        text NOT NULL,
  artifact_id   text NOT NULL,
  proof_chain_ref text,
  payload       jsonb NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS frontier_downstream_target_idx ON frontier_downstream(target, created_at DESC);

CREATE TABLE IF NOT EXISTS frontier_timeline (
  id          text PRIMARY KEY,
  at          timestamptz NOT NULL DEFAULT now(),
  kind        text NOT NULL,
  provider    text,
  artifact_id text,
  inbox_id    text,
  message     text NOT NULL,
  cost_usd    numeric(12,6)
);
CREATE INDEX IF NOT EXISTS frontier_timeline_at_idx ON frontier_timeline(at DESC);

CREATE TABLE IF NOT EXISTS frontier_spend (
  provider     text PRIMARY KEY,
  spend_usd    numeric(14,6) NOT NULL DEFAULT 0,
  call_count   bigint NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS frontier_seen (
  artifact_id text PRIMARY KEY,
  seen_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS frontier_spend_window (
  id           integer PRIMARY KEY DEFAULT 1,
  daily_usd    numeric(14,6) NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now()
);
`;

export async function ensureSchema(): Promise<boolean> {
  if (initialized) return enabled;
  if (initPromise) {
    await initPromise;
    return enabled;
  }
  initPromise = (async () => {
    const p = await loadPool();
    if (!p) {
      enabled = false;
      initialized = true;
      return;
    }
    try {
      // Split on bare semicolons at end-of-line for portability.
      for (const stmt of SCHEMA_SQL.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean)) {
        await p.query(stmt);
      }
      enabled = true;
    } catch {
      enabled = false;
    } finally {
      initialized = true;
    }
  })();
  await initPromise;
  return enabled;
}

export function isDbBackendEnabled(): boolean {
  return enabled;
}

/** Force-disable for tests. */
export function _resetDbBackendForTests(): void {
  enabled = false;
  initialized = false;
  initPromise = undefined;
  pool = undefined;
}

async function safeQuery(text: string, params?: unknown[]): Promise<Row[] | undefined> {
  const ok = await ensureSchema();
  if (!ok || !pool) return undefined;
  try {
    const res = await pool.query(text, params);
    return res.rows ?? [];
  } catch {
    return undefined;
  }
}

export async function dbInsertArtifact(a: FrontierArtifact, ev: EvidencePack): Promise<void> {
  await safeQuery(
    `INSERT INTO frontier_artifacts (id, provider, kind, external_id, title, url, summary, published_at, tags, raw, discovered_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11)
     ON CONFLICT (id) DO NOTHING`,
    [
      a.id, a.provider, a.kind, a.externalId, a.title, a.url, a.summary ?? null,
      a.publishedAt ?? null, JSON.stringify(a.tags ?? []), JSON.stringify(a.raw ?? {}), a.discoveredAt,
    ],
  );
  await safeQuery(
    `INSERT INTO frontier_evidence (artifact_id, score, decision, promotion_target, evaluated_at)
     VALUES ($1, $2::jsonb, $3, $4, $5)
     ON CONFLICT (artifact_id) DO UPDATE
       SET score=EXCLUDED.score, decision=EXCLUDED.decision, promotion_target=EXCLUDED.promotion_target, evaluated_at=EXCLUDED.evaluated_at`,
    [a.id, JSON.stringify(ev.score), ev.decision, ev.promotionTarget ?? null, ev.evaluatedAt],
  );
}

export async function dbInsertInbox(item: InboxItem): Promise<void> {
  await safeQuery(
    `INSERT INTO frontier_inbox (id, artifact_id, status, created_at) VALUES ($1,$2,$3,now())
     ON CONFLICT (id) DO NOTHING`,
    [item.id, item.evidence.artifact.id, item.status],
  );
}

export async function dbUpdateInboxStatus(id: string, status: InboxItem['status'], reviewer: string, note?: string): Promise<void> {
  await safeQuery(
    `UPDATE frontier_inbox SET status=$2, reviewed_at=now(), reviewed_by=$3, review_note=$4 WHERE id=$1`,
    [id, status, reviewer, note ?? null],
  );
}

export async function dbListInbox(filter?: { status?: InboxItem['status']; limit?: number }): Promise<InboxItem[] | undefined> {
  const where = filter?.status ? `WHERE i.status=$1` : '';
  const params: unknown[] = filter?.status ? [filter.status] : [];
  const limit = Math.min(Math.max(filter?.limit ?? 200, 1), 500);
  const rows = await safeQuery(
    `SELECT i.id, i.status, i.reviewed_at, i.reviewed_by, i.review_note,
            a.id AS artifact_id, a.provider, a.kind, a.external_id, a.title, a.url, a.summary,
            a.published_at, a.tags, a.raw, a.discovered_at,
            e.score, e.decision, e.promotion_target, e.evaluated_at
       FROM frontier_inbox i
       JOIN frontier_artifacts a ON a.id = i.artifact_id
       JOIN frontier_evidence e ON e.artifact_id = a.id
       ${where}
       ORDER BY i.created_at DESC
       LIMIT ${limit}`,
    params,
  );
  if (!rows) return undefined;
  return rows.map(rowToInbox);
}

/**
 * Cross-process inbox lookup. Returns the inbox item by id from the
 * shared DB, including evidence/artifact joins. Used by the api-server
 * approve/discard routes when the in-memory inbox doesn't have the id
 * (because the queue entry was created by a different process — e.g.
 * the Temporal worker).
 */
export async function dbGetInboxById(id: string): Promise<InboxItem | undefined> {
  const rows = await safeQuery(
    `SELECT i.id, i.status, i.reviewed_at, i.reviewed_by, i.review_note,
            a.id AS artifact_id, a.provider, a.kind, a.external_id, a.title, a.url, a.summary,
            a.published_at, a.tags, a.raw, a.discovered_at,
            e.score, e.decision, e.promotion_target, e.evaluated_at
       FROM frontier_inbox i
       JOIN frontier_artifacts a ON a.id = i.artifact_id
       JOIN frontier_evidence e ON e.artifact_id = a.id
       WHERE i.id=$1
       LIMIT 1`,
    [id],
  );
  if (!rows || rows.length === 0) return undefined;
  return rowToInbox(rows[0]!);
}

export async function dbInsertPromotion(ev: EvidencePack): Promise<void> {
  if (!ev.promotionTarget) return;
  await safeQuery(
    `INSERT INTO frontier_promotions (artifact_id, target, promoted_at) VALUES ($1,$2,now())`,
    [ev.artifact.id, ev.promotionTarget],
  );
}

export async function dbListPromotions(limit = 100): Promise<Array<{ artifact: FrontierArtifact; target: PromotionTarget; at: string; evidence: EvidencePack }> | undefined> {
  const rows = await safeQuery(
    `SELECT p.target, p.promoted_at,
            a.id, a.provider, a.kind, a.external_id, a.title, a.url, a.summary,
            a.published_at, a.tags, a.raw, a.discovered_at,
            e.score, e.decision, e.promotion_target, e.evaluated_at
       FROM frontier_promotions p
       JOIN frontier_artifacts a ON a.id = p.artifact_id
       JOIN frontier_evidence e ON e.artifact_id = a.id
       ORDER BY p.promoted_at DESC
       LIMIT $1`,
    [Math.min(limit, 500)],
  );
  if (!rows) return undefined;
  return rows.map((r) => {
    const artifact = rowToArtifact(r);
    const evidence: EvidencePack = {
      artifact,
      score: parseJson<EvidencePack['score']>(r['score']) as EvidencePack['score'],
      decision: r['decision'] as EvidencePack['decision'],
      promotionTarget: (r['promotion_target'] as PromotionTarget | null) ?? undefined,
      evaluatedAt: toIso(r['evaluated_at']),
    };
    return {
      artifact,
      target: r['target'] as PromotionTarget,
      at: toIso(r['promoted_at']),
      evidence,
    };
  });
}

export async function dbInsertDownstream(target: PromotionTarget, artifactId: string, proofChainRef: string | undefined, payload: unknown): Promise<void> {
  await safeQuery(
    `INSERT INTO frontier_downstream (target, artifact_id, proof_chain_ref, payload) VALUES ($1,$2,$3,$4::jsonb)`,
    [target, artifactId, proofChainRef ?? null, JSON.stringify(payload)],
  );
}

export async function dbListDownstream(target?: PromotionTarget, limit = 100): Promise<Array<{ target: PromotionTarget; artifactId: string; proofChainRef?: string; payload: unknown; at: string }> | undefined> {
  const rows = target
    ? await safeQuery(
        `SELECT target, artifact_id, proof_chain_ref, payload, created_at FROM frontier_downstream WHERE target=$1 ORDER BY created_at DESC LIMIT $2`,
        [target, Math.min(limit, 500)],
      )
    : await safeQuery(
        `SELECT target, artifact_id, proof_chain_ref, payload, created_at FROM frontier_downstream ORDER BY created_at DESC LIMIT $1`,
        [Math.min(limit, 500)],
      );
  if (!rows) return undefined;
  return rows.map((r) => ({
    target: r['target'] as PromotionTarget,
    artifactId: String(r['artifact_id']),
    proofChainRef: (r['proof_chain_ref'] as string | null) ?? undefined,
    payload: parseJson<unknown>(r['payload']),
    at: toIso(r['created_at']),
  }));
}

export async function dbInsertTimeline(ev: TimelineEvent): Promise<void> {
  await safeQuery(
    `INSERT INTO frontier_timeline (id, at, kind, provider, artifact_id, inbox_id, message, cost_usd)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (id) DO NOTHING`,
    [ev.id, ev.at, ev.kind, ev.provider ?? null, ev.artifactId ?? null, ev.inboxId ?? null, ev.message, ev.costUsd ?? null],
  );
}

export async function dbListTimeline(filter?: { provider?: FrontierProvider; kind?: TimelineEvent['kind']; limit?: number }): Promise<TimelineEvent[] | undefined> {
  const wheres: string[] = [];
  const params: unknown[] = [];
  if (filter?.provider) { params.push(filter.provider); wheres.push(`provider=$${params.length}`); }
  if (filter?.kind) { params.push(filter.kind); wheres.push(`kind=$${params.length}`); }
  const where = wheres.length ? `WHERE ${wheres.join(' AND ')}` : '';
  const limit = Math.min(Math.max(filter?.limit ?? 200, 1), 1000);
  const rows = await safeQuery(
    `SELECT id, at, kind, provider, artifact_id, inbox_id, message, cost_usd
       FROM frontier_timeline ${where} ORDER BY at DESC LIMIT ${limit}`,
    params,
  );
  if (!rows) return undefined;
  return rows.map((r) => ({
    id: String(r['id']),
    at: toIso(r['at']),
    kind: r['kind'] as TimelineEvent['kind'],
    provider: (r['provider'] as FrontierProvider | null) ?? undefined,
    artifactId: (r['artifact_id'] as string | null) ?? undefined,
    inboxId: (r['inbox_id'] as string | null) ?? undefined,
    message: String(r['message']),
    costUsd: r['cost_usd'] != null ? Number(r['cost_usd']) : undefined,
  }));
}

export async function dbAddSpend(provider: FrontierProvider, usd: number): Promise<void> {
  await safeQuery(
    `INSERT INTO frontier_spend (provider, spend_usd, call_count, window_start)
     VALUES ($1, $2, 1, now())
     ON CONFLICT (provider) DO UPDATE
       SET spend_usd = frontier_spend.spend_usd + EXCLUDED.spend_usd,
           call_count = frontier_spend.call_count + 1`,
    [provider, usd],
  );
}

export async function dbGetStats(spendCapUsd: number, capReached: boolean, lastPullAt: string | undefined): Promise<FrontierStats | undefined> {
  const spendRows = await safeQuery(`SELECT provider, spend_usd, call_count, window_start FROM frontier_spend`);
  if (!spendRows) return undefined;
  const tlRows = await safeQuery(`SELECT kind, count(*)::int AS n FROM frontier_timeline GROUP BY kind`);
  const inboxRows = await safeQuery(`SELECT status, count(*)::int AS n FROM frontier_inbox GROUP BY status`);
  const promoRows = await safeQuery(`SELECT count(*)::int AS n FROM frontier_promotions`);
  const tlMap = new Map<string, number>((tlRows ?? []).map((r) => [String(r['kind']), Number(r['n'])]));
  const inboxMap = new Map<string, number>((inboxRows ?? []).map((r) => [String(r['status']), Number(r['n'])]));
  const totalInbox = (inboxRows ?? []).reduce((a, r) => a + Number(r['n']), 0);
  return {
    totalDiscovered: tlMap.get('discovered') ?? 0,
    totalPromoted: Number((promoRows ?? [])[0]?.['n'] ?? 0),
    totalQueued: totalInbox,
    totalDiscarded: tlMap.get('discarded') ?? 0,
    pendingInbox: inboxMap.get('pending') ?? 0,
    spend: spendRows.map((r) => ({
      provider: r['provider'] as FrontierProvider,
      spendUsd: Number(r['spend_usd']),
      callCount: Number(r['call_count']),
      windowStart: toIso(r['window_start']),
    })),
    spendCapUsd,
    capReached,
    lastPullAt,
  };
}

/**
 * Persist the rolling daily spend window so the daily cap survives
 * restarts. Without this, a process restart resets `dailySpendUsd` to
 * 0 and the engine could spend another full daily cap.
 */
/**
 * Atomic additive increment for the daily spend window. Two
 * processes (api-server + Temporal worker) write to this row; using
 * additive SQL avoids the lost-update race that a read-modify-write
 * of process-local totals would suffer.
 *
 * Semantics:
 * - If no row exists, insert (delta, windowStartIso).
 * - If incoming window_start is newer than persisted (rollover),
 *   replace the row with (delta, windowStartIso).
 * - Otherwise add delta to persisted daily_usd, keeping the older
 *   window_start (so both processes converge on the same window).
 *
 * Returns the post-update row so callers can keep their local
 * `dailySpendUsd` in sync with the durable truth.
 */
export async function dbAddSpendWindowIncrement(
  deltaUsd: number,
  windowStartIso: string,
): Promise<{ dailyUsd: number; windowStart: string } | undefined> {
  const rows = await safeQuery(
    `INSERT INTO frontier_spend_window (id, daily_usd, window_start)
     VALUES (1, $1, $2)
     ON CONFLICT (id) DO UPDATE
       SET daily_usd = CASE
             WHEN EXCLUDED.window_start > frontier_spend_window.window_start THEN EXCLUDED.daily_usd
             ELSE frontier_spend_window.daily_usd + EXCLUDED.daily_usd
           END,
           window_start = CASE
             WHEN EXCLUDED.window_start > frontier_spend_window.window_start THEN EXCLUDED.window_start
             ELSE frontier_spend_window.window_start
           END
     RETURNING daily_usd, window_start`,
    [deltaUsd, windowStartIso],
  );
  if (!rows || rows.length === 0) return undefined;
  return {
    dailyUsd: Number(rows[0]!['daily_usd'] ?? 0),
    windowStart: toIso(rows[0]!['window_start']),
  };
}

/**
 * Rollover-only write: forces the persisted window to a fresh
 * (0, windowStartIso) when the local process detected a 24h rollover.
 * Uses the same monotonic window_start comparison so a slower process
 * can't accidentally rewind the window.
 */
export async function dbResetSpendWindow(windowStartIso: string): Promise<void> {
  await safeQuery(
    `INSERT INTO frontier_spend_window (id, daily_usd, window_start)
     VALUES (1, 0, $1)
     ON CONFLICT (id) DO UPDATE
       SET daily_usd = CASE
             WHEN EXCLUDED.window_start > frontier_spend_window.window_start THEN 0
             ELSE frontier_spend_window.daily_usd
           END,
           window_start = CASE
             WHEN EXCLUDED.window_start > frontier_spend_window.window_start THEN EXCLUDED.window_start
             ELSE frontier_spend_window.window_start
           END`,
    [windowStartIso],
  );
}

export async function dbLoadSpendWindow(): Promise<{ dailyUsd: number; windowStart: string } | undefined> {
  const rows = await safeQuery(`SELECT daily_usd, window_start FROM frontier_spend_window WHERE id=1`);
  if (!rows || rows.length === 0) return undefined;
  return {
    dailyUsd: Number(rows[0]!['daily_usd'] ?? 0),
    windowStart: toIso(rows[0]!['window_start']),
  };
}

export async function dbHasSeen(artifactId: string): Promise<boolean | undefined> {
  const rows = await safeQuery(`SELECT 1 FROM frontier_seen WHERE artifact_id=$1`, [artifactId]);
  if (rows === undefined) return undefined;
  return rows.length > 0;
}

export async function dbMarkSeen(artifactId: string): Promise<void> {
  await safeQuery(`INSERT INTO frontier_seen (artifact_id) VALUES ($1) ON CONFLICT DO NOTHING`, [artifactId]);
}

/**
 * Untyped row helpers. Postgres returns each row as a string-keyed
 * record of unknowns once we strip pg's `any[]` default — keeping the
 * boundary explicit (instead of `any`) means every cast is visible
 * and reviewable, which is the whole point of the proof chain.
 */
type Row = Record<string, unknown>;

function toIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'string' || typeof v === 'number') return new Date(v).toISOString();
  return new Date().toISOString();
}

function parseJson<T>(v: unknown): T {
  if (typeof v === 'string') return JSON.parse(v) as T;
  return (v ?? {}) as T;
}

function rowToArtifact(r: Row): FrontierArtifact {
  // When this row comes from a JOIN with `frontier_inbox` (where `i.id` is
  // the inbox id and `a.id AS artifact_id` is the real artifact id), prefer
  // `artifact_id`. For plain artifact selects there's no `artifact_id`, so
  // we fall back to `id`.
  const id = (r['artifact_id'] ?? r['id']) as string;
  return {
    id,
    provider: r['provider'] as FrontierProvider,
    kind: r['kind'] as FrontierArtifact['kind'],
    externalId: String(r['external_id'] ?? ''),
    title: String(r['title'] ?? ''),
    url: String(r['url'] ?? ''),
    summary: (r['summary'] as string | null) ?? undefined,
    publishedAt: r['published_at'] ? toIso(r['published_at']) : undefined,
    tags: parseJson<string[]>(r['tags']) ?? [],
    raw: parseJson<Record<string, unknown>>(r['raw']),
    discoveredAt: r['discovered_at'] ? toIso(r['discovered_at']) : new Date().toISOString(),
  };
}

function rowToInbox(r: Row): InboxItem {
  const artifact = rowToArtifact(r);
  const evidence: EvidencePack = {
    artifact,
    score: parseJson<EvidencePack['score']>(r['score']) as EvidencePack['score'],
    decision: r['decision'] as EvidencePack['decision'],
    promotionTarget: (r['promotion_target'] as PromotionTarget | null) ?? undefined,
    evaluatedAt: toIso(r['evaluated_at']),
  };
  return {
    id: String(r['id']),
    evidence,
    status: r['status'] as InboxItem['status'],
    reviewedAt: r['reviewed_at'] ? toIso(r['reviewed_at']) : undefined,
    reviewedBy: (r['reviewed_by'] as string | null) ?? undefined,
    reviewNote: (r['review_note'] as string | null) ?? undefined,
  };
}

/**
 * One row per `frontier_*` table with its current row count. Exposed via
 * the admin endpoint so operators can watch table growth and verify that
 * retention sweeps are actually shrinking the tables they target.
 */
export interface FrontierTableCounts {
  frontier_artifacts: number;
  frontier_evidence: number;
  frontier_inbox: number;
  frontier_promotions: number;
  frontier_downstream: number;
  frontier_timeline: number;
  frontier_spend: number;
  frontier_spend_window: number;
  frontier_seen: number;
}

/**
 * Result of a single retention sweep. The cutoffs are returned so operators
 * (and the Temporal workflow log) can audit exactly which window the prune
 * applied to, even after retention env values are changed later.
 */
export interface FrontierRetentionResult {
  timelineDeleted: number;
  discardedInboxDeleted: number;
  orphanArtifactsDeleted: number;
  timelineCutoff: string;
  discardedInboxCutoff: string;
}

const FRONTIER_TABLES = [
  'frontier_artifacts',
  'frontier_evidence',
  'frontier_inbox',
  'frontier_promotions',
  'frontier_downstream',
  'frontier_timeline',
  'frontier_spend',
  'frontier_spend_window',
  'frontier_seen',
] as const;

/**
 * Return current row counts for every `frontier_*` table. Returns `undefined`
 * when the DB backend isn't available so callers can fall back to a "not
 * persisted" response instead of crashing.
 */
export async function dbGetFrontierTableCounts(): Promise<FrontierTableCounts | undefined> {
  const ok = await ensureSchema();
  if (!ok || !pool) return undefined;
  const counts = {
    frontier_artifacts: 0,
    frontier_evidence: 0,
    frontier_inbox: 0,
    frontier_promotions: 0,
    frontier_downstream: 0,
    frontier_timeline: 0,
    frontier_spend: 0,
    frontier_spend_window: 0,
    frontier_seen: 0,
  } as FrontierTableCounts;
  for (const t of FRONTIER_TABLES) {
    // Table names are a fixed allow-list above — safe to interpolate.
    const rows = await safeQuery(`SELECT count(*)::bigint AS n FROM ${t}`);
    if (rows && rows.length > 0) {
      counts[t] = Number(rows[0]!['n'] ?? 0);
    }
  }
  return counts;
}

/**
 * Delete frontier records older than the configured retention windows.
 *
 * What is kept:
 *  - Artifacts referenced by any `frontier_promotions` row — the promotion
 *    ledger is the proof-chain root and must not lose its source artifact.
 *  - Artifacts referenced by any non-discarded inbox row (pending or approved
 *    decisions are still operator-actionable / part of the approval chain).
 *  - `frontier_spend`, `frontier_spend_window`, `frontier_seen` — small,
 *    bounded-size meters that are not growth concerns.
 *
 * What is pruned:
 *  - `frontier_timeline` rows older than `timelineDays` (the dominant growth
 *    source — every pull-start/pull-complete/discovered/queued event lands
 *    here at tens of thousands of rows/week per provider).
 *  - `frontier_inbox` rows in `discarded` status with `reviewed_at` older
 *    than `discardedInboxDays`.
 *  - Artifacts that, after the above deletes, have no inbox row and no
 *    promotion (i.e. the operator marked them irrelevant long ago).
 *    Cascading FKs clean up evidence/seen.
 */
export async function dbPruneFrontierRetention(opts: {
  timelineDays: number;
  discardedInboxDays: number;
}): Promise<FrontierRetentionResult | undefined> {
  const ok = await ensureSchema();
  if (!ok || !pool) return undefined;

  const timelineDays = Math.max(1, Math.floor(opts.timelineDays));
  const discardedInboxDays = Math.max(1, Math.floor(opts.discardedInboxDays));
  const now = Date.now();
  const timelineCutoff = new Date(now - timelineDays * 24 * 60 * 60 * 1000).toISOString();
  const discardedInboxCutoff = new Date(
    now - discardedInboxDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  // NOTE: intentionally no try/catch wrapper — real SQL errors should
  // bubble up so the Temporal workflow records a failed activity and
  // retries, and the admin endpoint surfaces the failure to the operator.
  // The earlier `safeQuery` swallow-pattern is reserved for the read path
  // where partial unavailability is acceptable.
  const tlRes = await pool.query(
    `DELETE FROM frontier_timeline WHERE at < $1`,
    [timelineCutoff],
  );
  const timelineDeleted = tlRes.rowCount ?? 0;

  const inboxRes = await pool.query(
    `DELETE FROM frontier_inbox
       WHERE status = 'discarded'
         AND reviewed_at IS NOT NULL
         AND reviewed_at < $1`,
    [discardedInboxCutoff],
  );
  const discardedInboxDeleted = inboxRes.rowCount ?? 0;

  // Drop artifacts that no longer have any inbox row OR promotion — these
  // are pure discarded discoveries that long ago dropped out of the
  // operator queue. Their evidence/seen rows cascade on delete.
  const orphRes = await pool.query(
    `DELETE FROM frontier_artifacts a
       WHERE NOT EXISTS (SELECT 1 FROM frontier_inbox i WHERE i.artifact_id = a.id)
         AND NOT EXISTS (SELECT 1 FROM frontier_promotions p WHERE p.artifact_id = a.id)
         AND a.discovered_at < $1`,
    [discardedInboxCutoff],
  );
  const orphanArtifactsDeleted = orphRes.rowCount ?? 0;

  return {
    timelineDeleted,
    discardedInboxDeleted,
    orphanArtifactsDeleted,
    timelineCutoff,
    discardedInboxCutoff,
  };
}

/** Test helper: wipe all frontier_* tables. Use only with DATABASE_URL pointing at a test DB. */
export async function _truncateForTests(): Promise<void> {
  if (!(await ensureSchema()) || !pool) return;
  await pool.query(
    `TRUNCATE frontier_inbox, frontier_promotions, frontier_downstream, frontier_timeline, frontier_evidence, frontier_artifacts, frontier_spend, frontier_spend_window, frontier_seen RESTART IDENTITY CASCADE`,
  );
}
