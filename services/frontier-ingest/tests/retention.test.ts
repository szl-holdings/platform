/**
 * Frontier retention sweep — DB-backed prune behavior.
 *
 * Verifies the task contract:
 *   - frontier_timeline rows older than FRONTIER_RETENTION_DAYS are deleted
 *   - discarded inbox items older than the discardedInboxDays cutoff are deleted
 *   - approved / promoted records are kept indefinitely
 *   - table-counts helper reflects post-prune state
 *
 * Skipped when DATABASE_URL is absent (same convention as cross-process.test.ts).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  _resetAdaptersForTests,
  _resetForTests,
  _resetDbBackendForTests,
  _truncateFrontierDbForTests,
  classify,
  dbGetFrontierTableCounts,
  dbListInboxShared,
  dbListPromotionsShared,
  dbListTimelineShared,
  ensureFrontierIngestDbSchema,
  isFrontierIngestDbEnabled,
  pruneFrontierRetention,
  recordDiscovered,
  recordPromoted,
  recordQueued,
  resolveFrontierRetentionConfig,
} from '../src/index.js';
import type { FrontierArtifact } from '../src/types.js';

const HAS_DB = !!process.env.DATABASE_URL;
const describeIfDb = HAS_DB ? describe : describe.skip;

function mkArtifact(id: string, partial: Partial<FrontierArtifact> = {}): FrontierArtifact {
  return {
    id,
    provider: 'anthropic',
    kind: 'model',
    externalId: id,
    title: `retention test ${id}`,
    url: `https://example.test/${id}`,
    summary: 'retention probe',
    publishedAt: new Date().toISOString(),
    tags: ['retention'],
    raw: {},
    discoveredAt: new Date().toISOString(),
    ...partial,
  };
}

describe('frontier retention — config resolution', () => {
  it('defaults to 30/30 days and a 24h interval when env is unset', () => {
    const prev = {
      a: process.env.FRONTIER_RETENTION_DAYS,
      b: process.env.FRONTIER_DISCARDED_INBOX_RETENTION_DAYS,
      c: process.env.FRONTIER_RETENTION_INTERVAL_MS,
    };
    try {
      delete process.env.FRONTIER_RETENTION_DAYS;
      delete process.env.FRONTIER_DISCARDED_INBOX_RETENTION_DAYS;
      delete process.env.FRONTIER_RETENTION_INTERVAL_MS;
      const cfg = resolveFrontierRetentionConfig();
      expect(cfg.timelineDays).toBe(30);
      expect(cfg.discardedInboxDays).toBe(30);
      expect(cfg.intervalMs).toBe(24 * 60 * 60 * 1000);
    } finally {
      if (prev.a !== undefined) process.env.FRONTIER_RETENTION_DAYS = prev.a;
      if (prev.b !== undefined) process.env.FRONTIER_DISCARDED_INBOX_RETENTION_DAYS = prev.b;
      if (prev.c !== undefined) process.env.FRONTIER_RETENTION_INTERVAL_MS = prev.c;
    }
  });

  it('respects FRONTIER_RETENTION_DAYS env override and inherits into discarded window', () => {
    const prev = process.env.FRONTIER_RETENTION_DAYS;
    try {
      process.env.FRONTIER_RETENTION_DAYS = '7';
      delete process.env.FRONTIER_DISCARDED_INBOX_RETENTION_DAYS;
      const cfg = resolveFrontierRetentionConfig();
      expect(cfg.timelineDays).toBe(7);
      expect(cfg.discardedInboxDays).toBe(7);
    } finally {
      if (prev !== undefined) process.env.FRONTIER_RETENTION_DAYS = prev;
      else delete process.env.FRONTIER_RETENTION_DAYS;
    }
  });

  it('pruneFrontierRetention returns undefined when DB backend is disabled', async () => {
    const original = process.env.DATABASE_URL;
    try {
      delete process.env.DATABASE_URL;
      _resetDbBackendForTests();
      const r = await pruneFrontierRetention();
      expect(r).toBeUndefined();
    } finally {
      if (original !== undefined) process.env.DATABASE_URL = original;
      _resetDbBackendForTests();
    }
  });
});

describeIfDb('frontier retention — DB-backed prune', () => {
  beforeAll(async () => {
    _resetDbBackendForTests();
    const ok = await ensureFrontierIngestDbSchema();
    if (ok) await _truncateFrontierDbForTests();
  }, 60_000);

  afterAll(async () => {
    if (isFrontierIngestDbEnabled()) await _truncateFrontierDbForTests();
    _resetAdaptersForTests();
    _resetForTests();
  }, 30_000);

  it(
    'deletes old timeline rows and old discarded inbox items; keeps promoted records',
    async () => {
      const ok = await ensureFrontierIngestDbSchema();
      if (!ok) return;
      await _truncateFrontierDbForTests();
      _resetAdaptersForTests();
      _resetForTests();

      // ── Seed: a promoted artifact (must survive prune) ─────────────────
      const promotedArtifact = mkArtifact('ret-promote-1', {
        kind: 'paper',
        title: 'retention probe — promoted paper',
      });
      const promotedClass = await classify(promotedArtifact);
      recordDiscovered(promotedArtifact);
      recordPromoted({
        artifact: promotedArtifact,
        score: promotedClass.score,
        decision: 'auto-promote' as const,
        promotionTarget: 'thesis_corpus' as const,
        evaluatedAt: new Date().toISOString(),
      });

      // ── Seed: a queued artifact that will be marked discarded long ago ─
      const discardedArtifact = mkArtifact('ret-discard-1', { kind: 'paper' });
      const discardedClass = await classify(discardedArtifact);
      recordDiscovered(discardedArtifact);
      const queued = recordQueued({
        artifact: discardedArtifact,
        score: discardedClass.score,
        decision: 'queue' as const,
        promotionTarget: 'thesis_corpus' as const,
        evaluatedAt: new Date().toISOString(),
      });
      // Allow fire-and-forget writes to drain before we hand-edit rows.
      await new Promise((r) => setTimeout(r, 250));

      // Hand-age the rows via direct SQL so the prune cutoffs trip.
      const { _truncateForTests: _, ...rest } = await import('../src/db-backend.js');
      void rest;
      const { pool } = (await import('@szl-holdings/db')) as { pool: { query: (q: string, p?: unknown[]) => Promise<unknown> } };
      const oldIso = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(); // 60d ago

      // Backdate the discarded artifact's timeline events + mark inbox discarded with old reviewed_at.
      await pool.query(`UPDATE frontier_timeline SET at = $1 WHERE artifact_id = $2`, [
        oldIso,
        discardedArtifact.id,
      ]);
      await pool.query(
        `UPDATE frontier_inbox SET status='discarded', reviewed_at=$1, reviewed_by='retention-test' WHERE id=$2`,
        [oldIso, queued.id],
      );
      await pool.query(`UPDATE frontier_artifacts SET discovered_at = $1 WHERE id = $2`, [
        oldIso,
        discardedArtifact.id,
      ]);

      // ── Sanity: counts before prune ────────────────────────────────────
      const before = await dbGetFrontierTableCounts();
      expect(before).toBeDefined();
      expect(before!.frontier_timeline).toBeGreaterThan(0);
      // Counts helper must cover every frontier_* table (including the
      // single-row spend window) so operators have full visibility.
      expect(Object.keys(before!).sort()).toEqual(
        [
          'frontier_artifacts',
          'frontier_downstream',
          'frontier_evidence',
          'frontier_inbox',
          'frontier_promotions',
          'frontier_seen',
          'frontier_spend',
          'frontier_spend_window',
          'frontier_timeline',
        ].sort(),
      );

      // ── Act ────────────────────────────────────────────────────────────
      const result = await pruneFrontierRetention({
        timelineDays: 30,
        discardedInboxDays: 30,
      });
      expect(result).toBeDefined();
      expect(result!.timelineDeleted).toBeGreaterThanOrEqual(1);
      expect(result!.discardedInboxDeleted).toBe(1);
      expect(result!.orphanArtifactsDeleted).toBe(1);

      // ── Assert: discarded artifact + its inbox + its timeline are gone ─
      const remainingInbox = await dbListInboxShared({ limit: 100 });
      expect(remainingInbox?.some((i) => i.id === queued.id)).toBe(false);
      const remainingTimeline = await dbListTimelineShared({ limit: 200 });
      expect(
        remainingTimeline?.some((e) => e.artifactId === discardedArtifact.id),
      ).toBe(false);

      // ── Assert: promoted record is preserved ───────────────────────────
      const promotions = await dbListPromotionsShared(100);
      expect(promotions?.some((p) => p.artifact.id === promotedArtifact.id)).toBe(true);

      // ── Assert: counts helper reflects post-prune shrinkage ────────────
      const after = await dbGetFrontierTableCounts();
      expect(after).toBeDefined();
      expect(after!.frontier_timeline).toBeLessThan(before!.frontier_timeline);
    },
    30_000,
  );
});
