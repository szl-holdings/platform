import { Router, type Request, type Response } from 'express';
import { db } from '@szl-holdings/db';
import { a11oyDefensePayloads } from '@szl-holdings/db';
import { eq } from 'drizzle-orm';
import { logger } from '../lib/logger';
import {
  DEFENSE_SEED_PAYLOADS,
  DEFENSE_SLUGS,
  type DefenseSlug,
} from '../data/internal-a11oy-defense-seed';

/**
 * A11oy Defense API — six read-only endpoints backing the PrecisionAI,
 * WeaponizedIntel, AgentZeroTrust, AtlasShield, SwarmOrchestrator, and
 * PlaybookEngine pages in the a11oy artifact.
 *
 * Data is persisted in the `a11oy_defense_payloads` table (slug → JSONB
 * payload + updated_at). On the first request for a slug, the seed payload
 * from data/internal-a11oy-defense-seed.ts is upserted; every subsequent
 * request returns the live row from the DB. The endpoint envelope's
 * `meta.timestamp` reflects the row's `updatedAt`, so admins can mutate
 * any payload (e.g. via SQL or a future admin UI) and the dashboards will
 * pick up the change on their next 30s poll without a deploy.
 */

const router = Router();

function ok(res: Response, data: unknown, updatedAt: Date) {
  res.json({
    ok: true,
    data,
    meta: {
      timestamp: updatedAt.toISOString(),
      visibility: 'internal',
    },
  });
}

function fail(res: Response, status: number, message: string) {
  res.status(status).json({ ok: false, error: { message } });
}

/**
 * Fetch a defense payload by slug. If no row exists yet, seed it from the
 * baseline payload defined in code, then return the freshly-seeded row.
 * Returns null when the slug has no seed (defensive — should not happen
 * because callers come from a closed enum).
 */
async function getDefensePayload(
  slug: DefenseSlug,
): Promise<{ payload: unknown; updatedAt: Date } | null> {
  const existing = await db
    .select()
    .from(a11oyDefensePayloads)
    .where(eq(a11oyDefensePayloads.slug, slug))
    .limit(1);

  if (existing.length > 0) {
    const row = existing[0];
    return { payload: row.payload, updatedAt: row.updatedAt };
  }

  const seed = DEFENSE_SEED_PAYLOADS[slug];
  if (!seed) return null;

  const [inserted] = await db
    .insert(a11oyDefensePayloads)
    .values({ slug, payload: seed })
    .onConflictDoNothing({ target: a11oyDefensePayloads.slug })
    .returning();

  if (inserted) {
    return { payload: inserted.payload, updatedAt: inserted.updatedAt };
  }

  // Race: another request seeded it first — re-read.
  const [row] = await db
    .select()
    .from(a11oyDefensePayloads)
    .where(eq(a11oyDefensePayloads.slug, slug))
    .limit(1);
  return row ? { payload: row.payload, updatedAt: row.updatedAt } : null;
}

for (const slug of DEFENSE_SLUGS) {
  router.get(`/internal/a11oy/defense/${slug}`, async (_req: Request, res: Response) => {
    try {
      const result = await getDefensePayload(slug);
      if (!result) {
        return fail(res, 404, `No defense payload registered for "${slug}"`);
      }
      return ok(res, result.payload, result.updatedAt);
    } catch (err) {
      logger.error(
        { err, slug },
        '[internal-a11oy-defense] failed to load defense payload',
      );
      return fail(res, 500, 'Failed to load defense payload');
    }
  });
}

logger.debug(
  { slugCount: DEFENSE_SLUGS.length },
  '[internal-a11oy-defense] defense routes registered',
);

export default router;
