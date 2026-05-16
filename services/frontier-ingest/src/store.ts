import { randomUUID } from 'node:crypto';
import { applyPromotion } from './adapters.js';
import {
  dbAddSpend,
  dbGetInboxById,
  dbHasSeen,
  dbInsertArtifact,
  dbInsertInbox,
  dbInsertPromotion,
  dbInsertTimeline,
  dbAddSpendWindowIncrement,
  dbLoadSpendWindow,
  dbMarkSeen,
  dbResetSpendWindow,
  dbUpdateInboxStatus,
  ensureSchema as ensureDbSchema,
  isDbBackendEnabled,
  _resetDbBackendForTests,
} from './db-backend.js';

function fireAndForget(p: Promise<unknown>): void {
  // DB writes must never block ingestion. Errors are swallowed in db-backend.
  void p.catch(() => {});
}
import type {
  EvidencePack,
  FrontierArtifact,
  FrontierProvider,
  FrontierStats,
  InboxItem,
  PromotionTarget,
  SourceCostMeter,
  TimelineEvent,
} from './types.js';

const MAX_TIMELINE = 5_000;
const MAX_INBOX = 2_000;
const MAX_PROMOTED = 5_000;

const promoted: Array<{ artifact: FrontierArtifact; target: PromotionTarget; at: string; evidence: EvidencePack }> = [];
const inbox: InboxItem[] = [];
const timeline: TimelineEvent[] = [];
const seenIds = new Set<string>();
const costMeters = new Map<FrontierProvider, SourceCostMeter>();

let spendCapUsd = Number(process.env.FRONTIER_SPEND_CAP_USD ?? '5');
let dailySpendCapUsd = Number(process.env.FRONTIER_DAILY_SPEND_CAP_USD ?? '20');
let capReached = false;
let dailySpendUsd = 0;
let dailyWindowStartMs = Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;

let spendHydrated = false;
let spendHydratePromise: Promise<void> | undefined;
/**
 * Increments applied to dailySpendUsd before hydration completed.
 * Hydration adds these to the persisted total instead of overwriting
 * the local in-memory value with the stale persisted value. This
 * closes the cold-start race where a recordCost ran before
 * dbLoadSpendWindow finished and would otherwise be lost.
 */
let pendingDailyIncrements = 0;

/**
 * Hydrate the daily-spend window from the shared DB on first access.
 * Without this, every process restart would reset the daily meter to
 * 0 and allow another full daily cap of spend — defeating the cap.
 */
async function hydrateSpendWindow(): Promise<void> {
  if (spendHydrated) return;
  if (spendHydratePromise) return spendHydratePromise;
  spendHydratePromise = (async () => {
    try {
      await ensureDbSchema();
      if (!isDbBackendEnabled()) {
        // No DB to hydrate from — local increments stand as-is.
        return;
      }
      const row = await dbLoadSpendWindow();
      const now = Date.now();
      const localPending = pendingDailyIncrements;
      pendingDailyIncrements = 0;
      if (!row) {
        // First-ever write: atomically add the local pending so we
        // converge with any peer process racing the same insert.
        const result = await dbAddSpendWindowIncrement(localPending, new Date(dailyWindowStartMs).toISOString());
        if (result) {
          dailySpendUsd = result.dailyUsd;
          dailyWindowStartMs = new Date(result.windowStart).getTime();
        }
        return;
      }
      const startMs = new Date(row.windowStart).getTime();
      if (now - startMs >= DAY_MS) {
        // Persisted window expired — atomically roll it over and add
        // any pending local increments into the fresh window.
        dailyWindowStartMs = now;
        const result = await dbAddSpendWindowIncrement(localPending, new Date(dailyWindowStartMs).toISOString());
        dailySpendUsd = result?.dailyUsd ?? localPending;
        if (result) dailyWindowStartMs = new Date(result.windowStart).getTime();
      } else {
        // Adopt the persisted total + atomically fold in pending
        // increments so the durable counter reflects everything.
        dailyWindowStartMs = startMs;
        if (localPending > 0) {
          const result = await dbAddSpendWindowIncrement(localPending, new Date(dailyWindowStartMs).toISOString());
          dailySpendUsd = result?.dailyUsd ?? (row.dailyUsd + localPending);
          if (result) dailyWindowStartMs = new Date(result.windowStart).getTime();
        } else {
          dailySpendUsd = row.dailyUsd;
        }
      }
      // Re-evaluate cap state against the just-hydrated total so the
      // first post-restart pull is blocked when the persisted daily
      // spend already meets/exceeds the cap. Without this, a worker
      // could fire a pull (and pay) before any recordCost runs.
      recomputeCapReached();
    } finally {
      spendHydrated = true;
    }
  })();
  return spendHydratePromise;
}

function recomputeCapReached(): void {
  const lifetime = totalSpend();
  const tripped = lifetime >= spendCapUsd || dailySpendUsd >= dailySpendCapUsd;
  if (tripped && !capReached) {
    capReached = true;
    const which = dailySpendUsd >= dailySpendCapUsd && lifetime < spendCapUsd ? 'daily' : 'lifetime';
    const message =
      which === 'daily'
        ? `Daily spend cap already reached on hydrate: $${dailySpendUsd.toFixed(4)} of $${dailySpendCapUsd.toFixed(2)} (24h window)`
        : `Lifetime spend cap already reached on hydrate: $${lifetime.toFixed(4)} of $${spendCapUsd.toFixed(2)}`;
    pushTimeline({ kind: 'cap-reached', message });
  } else if (!tripped && capReached) {
    capReached = false;
  }
}

// Kick off hydration eagerly so first recordCost sees persisted state.
fireAndForget(hydrateSpendWindow());

/** Await-able hydrated cap check — call from worker before first pull. */
export async function isCapReachedHydrated(): Promise<boolean> {
  await hydrateSpendWindow();
  rolloverDailyWindowIfNeeded();
  recomputeCapReached();
  return capReached;
}

type CapNotifier = (message: string, totals: { totalUsd: number; dailyUsd: number; capUsd: number; dailyCapUsd: number }) => void;
let capNotifier: CapNotifier | undefined;

export function onCapReached(fn: CapNotifier): () => void {
  capNotifier = fn;
  return () => { if (capNotifier === fn) capNotifier = undefined; };
}

function rolloverDailyWindowIfNeeded(): void {
  if (Date.now() - dailyWindowStartMs >= DAY_MS) {
    dailySpendUsd = 0;
    dailyWindowStartMs = Date.now();
    fireAndForget(dbResetSpendWindow(new Date(dailyWindowStartMs).toISOString()));
  }
}
let lastPullAt: string | undefined;
const lastPullPerSource = new Map<string, number>();

/**
 * Per-source rate-limit gate. Sources declare `ratePerHour`; a pull is
 * blocked if it would exceed that cadence (i.e. last pull was too recent).
 * Returns true if the source is allowed to pull right now.
 */
export function rateLimitAllows(sourceName: string, ratePerHour: number): boolean {
  if (!Number.isFinite(ratePerHour) || ratePerHour <= 0) return true;
  const minIntervalMs = (60 * 60 * 1000) / ratePerHour;
  const last = lastPullPerSource.get(sourceName);
  if (last === undefined) return true;
  return Date.now() - last >= minIntervalMs;
}

export function recordPullForRateLimit(sourceName: string): void {
  lastPullPerSource.set(sourceName, Date.now());
}

export function setSpendCap(usd: number): void {
  spendCapUsd = usd;
  if (totalSpend() < spendCapUsd) capReached = false;
}

export function getSpendCap(): number {
  return spendCapUsd;
}

export function totalSpend(): number {
  let total = 0;
  for (const m of costMeters.values()) total += m.spendUsd;
  return total;
}

export function recordCost(provider: FrontierProvider, usd: number): void {
  rolloverDailyWindowIfNeeded();
  const existing = costMeters.get(provider);
  if (existing) {
    existing.spendUsd += usd;
    existing.callCount += 1;
  } else {
    costMeters.set(provider, {
      provider,
      spendUsd: usd,
      callCount: 1,
      windowStart: new Date().toISOString(),
    });
  }
  dailySpendUsd += usd;
  fireAndForget(dbAddSpend(provider, usd));
  if (!spendHydrated) {
    // Hydration hasn't loaded the persisted window yet — buffer this
    // delta so hydration can atomically fold it into the persisted
    // row instead of overwriting it. We do NOT call the additive
    // SQL twice (here AND from hydration); deferring until hydration
    // is the single source of truth for cold-start increments.
    pendingDailyIncrements += usd;
    // Ensure hydration is in flight even if module-load kickoff was missed.
    fireAndForget(hydrateSpendWindow());
  } else {
    // Hot path: atomically add this delta to the durable row.
    // Returns the post-update total so we can correct dailySpendUsd
    // for any concurrent writer (e.g. the Temporal worker process).
    fireAndForget(
      dbAddSpendWindowIncrement(usd, new Date(dailyWindowStartMs).toISOString()).then((result) => {
        if (!result) return;
        // Adopt the durable total + window start so processes converge.
        dailySpendUsd = result.dailyUsd;
        dailyWindowStartMs = new Date(result.windowStart).getTime();
      }),
    );
  }

  const total = totalSpend();
  const triggerLifetime = total >= spendCapUsd;
  const triggerDaily = dailySpendUsd >= dailySpendCapUsd;
  if ((triggerLifetime || triggerDaily) && !capReached) {
    capReached = true;
    const which = triggerDaily && !triggerLifetime ? 'daily' : 'lifetime';
    const message =
      which === 'daily'
        ? `Daily spend cap reached: $${dailySpendUsd.toFixed(4)} of $${dailySpendCapUsd.toFixed(2)} (24h window)`
        : `Lifetime spend cap reached: $${total.toFixed(4)} of $${spendCapUsd.toFixed(2)}`;
    pushTimeline({ kind: 'cap-reached', message });
    if (capNotifier) {
      try {
        capNotifier(message, {
          totalUsd: total,
          dailyUsd: dailySpendUsd,
          capUsd: spendCapUsd,
          dailyCapUsd: dailySpendCapUsd,
        });
      } catch {
        // notifier must not break ingestion
      }
    }
  }
}

export function getDailySpend(): { usd: number; capUsd: number; windowStart: string } {
  fireAndForget(hydrateSpendWindow());
  rolloverDailyWindowIfNeeded();
  return {
    usd: dailySpendUsd,
    capUsd: dailySpendCapUsd,
    windowStart: new Date(dailyWindowStartMs).toISOString(),
  };
}

/**
 * Await-able variant for callers (e.g. stats endpoints) that want
 * the hydrated value rather than the eagerly-cached one. Useful in
 * tests and in the api-server's first request after a cold start.
 */
export async function getDailySpendHydrated(): Promise<{ usd: number; capUsd: number; windowStart: string }> {
  await hydrateSpendWindow();
  rolloverDailyWindowIfNeeded();
  return {
    usd: dailySpendUsd,
    capUsd: dailySpendCapUsd,
    windowStart: new Date(dailyWindowStartMs).toISOString(),
  };
}

export function setDailySpendCap(usd: number): void {
  dailySpendCapUsd = usd;
  rolloverDailyWindowIfNeeded();
  if (dailySpendUsd < dailySpendCapUsd && totalSpend() < spendCapUsd) capReached = false;
}

export function isCapReached(): boolean {
  return capReached;
}

export function markPullStart(provider: FrontierProvider, source: string): void {
  lastPullAt = new Date().toISOString();
  pushTimeline({ kind: 'pull-started', provider, message: `Pull started: ${source}` });
}

export function markPullComplete(provider: FrontierProvider, source: string, count: number, costUsd: number): void {
  recordPullForRateLimit(source);
  pushTimeline({
    kind: 'pull-completed',
    provider,
    message: `Pull complete: ${source} (${count} artifacts)`,
    costUsd,
  });
}

export function alreadySeen(artifactId: string): boolean {
  return seenIds.has(artifactId);
}

/**
 * Cross-process dedup. The Temporal worker pulls in one process; the
 * api-server may pull on-demand in another. Both must see the same
 * "already-seen" set or the operator UI will show duplicates.
 */
export async function alreadySeenShared(artifactId: string): Promise<boolean> {
  if (seenIds.has(artifactId)) return true;
  const dbSeen = await dbHasSeen(artifactId);
  if (dbSeen === true) {
    seenIds.add(artifactId);
    return true;
  }
  return false;
}

export function markSeen(artifactId: string): void {
  seenIds.add(artifactId);
  fireAndForget(dbMarkSeen(artifactId));
  if (seenIds.size > 50_000) {
    const arr = Array.from(seenIds);
    seenIds.clear();
    for (const id of arr.slice(-25_000)) seenIds.add(id);
  }
}

export function recordPromoted(evidence: EvidencePack): void {
  if (!evidence.promotionTarget) return;
  promoted.unshift({
    artifact: evidence.artifact,
    target: evidence.promotionTarget,
    at: new Date().toISOString(),
    evidence,
  });
  if (promoted.length > MAX_PROMOTED) promoted.length = MAX_PROMOTED;
  fireAndForget(dbInsertArtifact(evidence.artifact, evidence).then(() => dbInsertPromotion(evidence)));
  pushTimeline({
    kind: 'promoted',
    provider: evidence.artifact.provider,
    artifactId: evidence.artifact.id,
    message: `Auto-promoted ${evidence.artifact.kind} → ${evidence.promotionTarget}: ${evidence.artifact.title}`,
  });
}

export function recordQueued(evidence: EvidencePack): InboxItem {
  const item: InboxItem = {
    id: `inbox-${randomUUID().slice(0, 12)}`,
    evidence,
    status: 'pending',
  };
  inbox.unshift(item);
  if (inbox.length > MAX_INBOX) inbox.length = MAX_INBOX;
  fireAndForget(dbInsertArtifact(evidence.artifact, evidence).then(() => dbInsertInbox(item)));
  pushTimeline({
    kind: 'queued',
    provider: evidence.artifact.provider,
    artifactId: evidence.artifact.id,
    inboxId: item.id,
    message: `Queued for operator review: ${evidence.artifact.title}`,
  });
  return item;
}

export function recordDiscarded(evidence: EvidencePack): void {
  pushTimeline({
    kind: 'discarded',
    provider: evidence.artifact.provider,
    artifactId: evidence.artifact.id,
    message: `Discarded (${evidence.score.rationale[0] ?? 'low signal'}): ${evidence.artifact.title}`,
  });
}

export function approveInboxItem(id: string, reviewer: string, note?: string): InboxItem | undefined {
  const item = inbox.find((i) => i.id === id);
  if (!item || item.status !== 'pending') return item;
  item.status = 'approved';
  item.reviewedAt = new Date().toISOString();
  item.reviewedBy = reviewer;
  item.reviewNote = note;
  fireAndForget(dbUpdateInboxStatus(item.id, 'approved', reviewer, note));
  // Single promotion pipeline: approving an inbox item must execute the same
  // adapter-dispatch path as auto-promote so model registry / thesis corpus /
  // eval harness / tool proposals all see the new artifact.
  recordPromoted(item.evidence);
  applyPromotion(item.evidence);
  pushTimeline({
    kind: 'approved',
    provider: item.evidence.artifact.provider,
    artifactId: item.evidence.artifact.id,
    inboxId: item.id,
    message: `Operator approved: ${item.evidence.artifact.title}`,
  });
  return item;
}

/**
 * Cross-process approve. Tries the in-memory inbox first; if not
 * found and the DB backend is enabled, hydrates the InboxItem from
 * `frontier_inbox`/`frontier_evidence`/`frontier_artifacts`, marks it
 * approved (DB + in-memory), and runs the same promotion pipeline as
 * `approveInboxItem` so the model registry / thesis corpus / eval
 * harness / tool proposals downstreams see the new artifact whether
 * the queue entry was created here or by the Temporal worker process.
 *
 * Returns the updated item or `undefined` if no such id exists in
 * either backend.
 */
export async function approveInboxItemShared(
  id: string,
  reviewer: string,
  note?: string,
): Promise<InboxItem | undefined> {
  const local = inbox.find((i) => i.id === id);
  if (local) return approveInboxItem(id, reviewer, note);
  if (!(await isDbBackendEnabled())) return undefined;
  const item = await dbGetInboxById(id);
  if (!item) return undefined;
  if (item.status !== 'pending') return item;
  item.status = 'approved';
  item.reviewedAt = new Date().toISOString();
  item.reviewedBy = reviewer;
  item.reviewNote = note;
  inbox.unshift(item);
  if (inbox.length > MAX_INBOX) inbox.length = MAX_INBOX;
  fireAndForget(dbUpdateInboxStatus(item.id, 'approved', reviewer, note));
  recordPromoted(item.evidence);
  applyPromotion(item.evidence);
  pushTimeline({
    kind: 'approved',
    provider: item.evidence.artifact.provider,
    artifactId: item.evidence.artifact.id,
    inboxId: item.id,
    message: `Operator approved (cross-process): ${item.evidence.artifact.title}`,
  });
  return item;
}

/**
 * Cross-process discard. Mirror of `approveInboxItemShared` for the
 * reject path — hydrates from DB if needed and writes the rejected
 * status + timeline entry through both backends.
 */
export async function discardInboxItemShared(
  id: string,
  reviewer: string,
  note?: string,
): Promise<InboxItem | undefined> {
  const local = inbox.find((i) => i.id === id);
  if (local) return discardInboxItem(id, reviewer, note);
  if (!(await isDbBackendEnabled())) return undefined;
  const item = await dbGetInboxById(id);
  if (!item) return undefined;
  if (item.status !== 'pending') return item;
  item.status = 'discarded';
  item.reviewedAt = new Date().toISOString();
  item.reviewedBy = reviewer;
  item.reviewNote = note;
  inbox.unshift(item);
  if (inbox.length > MAX_INBOX) inbox.length = MAX_INBOX;
  fireAndForget(dbUpdateInboxStatus(item.id, 'discarded', reviewer, note));
  pushTimeline({
    kind: 'rejected',
    provider: item.evidence.artifact.provider,
    artifactId: item.evidence.artifact.id,
    inboxId: item.id,
    message: `Operator rejected (cross-process): ${item.evidence.artifact.title}`,
  });
  return item;
}

export function discardInboxItem(id: string, reviewer: string, note?: string): InboxItem | undefined {
  const item = inbox.find((i) => i.id === id);
  if (!item || item.status !== 'pending') return item;
  item.status = 'discarded';
  item.reviewedAt = new Date().toISOString();
  item.reviewedBy = reviewer;
  item.reviewNote = note;
  fireAndForget(dbUpdateInboxStatus(item.id, 'discarded', reviewer, note));
  pushTimeline({
    kind: 'rejected',
    provider: item.evidence.artifact.provider,
    artifactId: item.evidence.artifact.id,
    inboxId: item.id,
    message: `Operator rejected: ${item.evidence.artifact.title}`,
  });
  return item;
}

export function listInbox(filter?: { status?: InboxItem['status']; limit?: number }): InboxItem[] {
  let items = inbox.slice();
  if (filter?.status) items = items.filter((i) => i.status === filter.status);
  if (filter?.limit) items = items.slice(0, filter.limit);
  return items;
}

export function listTimeline(filter?: {
  provider?: FrontierProvider;
  kind?: TimelineEvent['kind'];
  limit?: number;
}): TimelineEvent[] {
  let events = timeline.slice();
  if (filter?.provider) events = events.filter((e) => e.provider === filter.provider);
  if (filter?.kind) events = events.filter((e) => e.kind === filter.kind);
  return events.slice(0, filter?.limit ?? 200);
}

export function listPromoted(limit = 100): typeof promoted {
  return promoted.slice(0, limit);
}

export function getStats(): FrontierStats {
  return {
    totalDiscovered: timeline.filter((e) => e.kind === 'discovered').length,
    totalPromoted: promoted.length,
    totalQueued: inbox.length,
    totalDiscarded: timeline.filter((e) => e.kind === 'discarded').length,
    pendingInbox: inbox.filter((i) => i.status === 'pending').length,
    spend: Array.from(costMeters.values()),
    spendCapUsd,
    capReached,
    lastPullAt,
  };
}

function pushTimeline(partial: Omit<TimelineEvent, 'id' | 'at'>): TimelineEvent {
  const event: TimelineEvent = {
    id: `tl-${randomUUID().slice(0, 10)}`,
    at: new Date().toISOString(),
    ...partial,
  };
  timeline.unshift(event);
  if (timeline.length > MAX_TIMELINE) timeline.length = MAX_TIMELINE;
  fireAndForget(dbInsertTimeline(event));
  return event;
}

export function recordDiscovered(artifact: FrontierArtifact): void {
  pushTimeline({
    kind: 'discovered',
    provider: artifact.provider,
    artifactId: artifact.id,
    message: `Discovered ${artifact.kind}: ${artifact.title}`,
  });
}

/** Test/diagnostic helper. */
export function _resetForTests(): void {
  promoted.length = 0;
  inbox.length = 0;
  timeline.length = 0;
  seenIds.clear();
  costMeters.clear();
  capReached = false;
  lastPullAt = undefined;
  lastPullPerSource.clear();
  dailySpendUsd = 0;
  dailyWindowStartMs = Date.now();
  capNotifier = undefined;
  spendHydrated = false;
  spendHydratePromise = undefined;
  pendingDailyIncrements = 0;
}

/**
 * Test-only adapter: force the in-memory store to be the sole backend
 * for the duration of a test. Disables the DB-backend (env flag +
 * re-initializes the backend module state so any prior DB pool is
 * dropped) so reads/writes stay process-local. Pairs with
 * `_resetForTests()` for clean isolation.
 *
 * Production code must NOT call this — the DB-backed store is the
 * canonical durable store post-restart; the in-memory arrays are only
 * a hot cache for the current process.
 */
export function _useInMemoryStoreForTests(): void {
  process.env.FRONTIER_INGEST_DB_DISABLED = 'true';
  // Drop any cached pool / initialized=true so ensureSchema re-evaluates
  // the env flag and refuses to connect. Without this, a test that
  // already touched the DB backend would keep the live pool.
  _resetDbBackendForTests();
  // Treat hydration as complete: there's nothing durable to load and
  // we don't want to keep increments in the pending queue.
  spendHydrated = true;
  spendHydratePromise = undefined;
  pendingDailyIncrements = 0;
}
