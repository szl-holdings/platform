import {
  analyticsEventsTable,
  contactSubmissionsTable,
  db,
  leadStatusTable,
  sitesTable,
} from '@szl-holdings/db';
import { and, eq, gte, inArray, sql } from 'drizzle-orm';
import type { IRouter } from 'express';
import { logger } from '../../lib/logger.js';

const PUBLIC_DOMAIN = 'szl-holdings';

interface FunnelStage {
  key: string;
  label: string;
  count: number;
  conversionFromPrev: number | null;
  conversionFromTop: number | null;
}

const WINDOW_OPTIONS: Record<string, number> = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
};

async function distinctSessionCount(
  domain: string,
  eventNames: string[],
  windowStart: Date,
): Promise<number> {
  const rows = await db
    .select({
      count: sql<number>`count(distinct coalesce(${analyticsEventsTable.sessionId}, ${analyticsEventsTable.eventId}))::int`,
    })
    .from(analyticsEventsTable)
    .where(
      and(
        eq(analyticsEventsTable.domain, domain),
        inArray(analyticsEventsTable.eventName, eventNames),
        gte(analyticsEventsTable.occurredAt, windowStart),
      ),
    );
  return Number(rows[0]?.count ?? 0);
}

async function pageViewSessionCountWhereUrlLike(
  domain: string,
  patterns: string[],
  windowStart: Date,
): Promise<number> {
  const conds = patterns.map((p) => sql`${analyticsEventsTable.url} ILIKE ${'%' + p + '%'}`);
  const orExpr = conds.length === 1 ? conds[0] : sql.join(conds, sql` OR `);

  const rows = await db
    .select({
      count: sql<number>`count(distinct coalesce(${analyticsEventsTable.sessionId}, ${analyticsEventsTable.eventId}))::int`,
    })
    .from(analyticsEventsTable)
    .where(
      and(
        eq(analyticsEventsTable.domain, domain),
        eq(analyticsEventsTable.eventName, 'page_view'),
        gte(analyticsEventsTable.occurredAt, windowStart),
        sql`(${orExpr})`,
      ),
    );
  return Number(rows[0]?.count ?? 0);
}

export function register(router: IRouter): void {
  router.get('/admin/analytics/funnel', async (req, res) => {
    try {
      const window = (req.query.window as string) ?? '7d';
      const days = WINDOW_OPTIONS[window] ?? 7;
      const windowStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const [
        visitsRaw,
        productPagesRaw,
        trustViewsRaw,
        demoIntentRaw,
        demoSubmitRows,
        confirmedRows,
      ] = await Promise.all([
        // 1. Total distinct sessions with any page_view
        distinctSessionCount(PUBLIC_DOMAIN, ['page_view'], windowStart),

        // 2. Distinct sessions viewing a product/solution page
        pageViewSessionCountWhereUrlLike(
          PUBLIC_DOMAIN,
          [
            '/platform',
            '/solutions',
            '/lyte',
            '/aegis',
            '/terra',
            '/vessels',
            '/prism-counsel',
            '/carlota-jo',
          ],
          windowStart,
        ),

        // 3. Distinct sessions that viewed Trust Center signal
        distinctSessionCount(PUBLIC_DOMAIN, ['trust_center_viewed'], windowStart),

        // 4. Distinct sessions that clicked a demo CTA / hit /demo.
        // Matches the canonical funnel event name plus the events the
        // szl-holdings client actually emits today (hero CTAs are demo-driven,
        // demo_request fires from explicit demo-request CTAs).
        distinctSessionCount(
          PUBLIC_DOMAIN,
          ['demo_cta_clicked', 'demo_request', 'hero_cta_click'],
          windowStart,
        ),

        // 5. Demo form submissions (server-side, authoritative).
        // Scoped to szl-holdings via sitesTable.slug to avoid counting
        // submissions from other portfolio sites that share this table.
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(contactSubmissionsTable)
          .leftJoin(sitesTable, eq(sitesTable.id, contactSubmissionsTable.siteId))
          .where(
            and(
              gte(contactSubmissionsTable.createdAt, windowStart),
              eq(sitesTable.slug, PUBLIC_DOMAIN),
            ),
          ),

        // 6. Confirmed (lead moved past 'new'). Same site scope as step 5.
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(contactSubmissionsTable)
          .leftJoin(sitesTable, eq(sitesTable.id, contactSubmissionsTable.siteId))
          .leftJoin(
            leadStatusTable,
            eq(leadStatusTable.contactSubmissionId, contactSubmissionsTable.id),
          )
          .where(
            and(
              gte(contactSubmissionsTable.createdAt, windowStart),
              eq(sitesTable.slug, PUBLIC_DOMAIN),
              inArray(leadStatusTable.status, ['contacted', 'qualified'] as const),
            ),
          ),
      ]);

      const submitCount = Number(demoSubmitRows[0]?.count ?? 0);
      const confirmedCount = Number(confirmedRows[0]?.count ?? 0);

      const stagesRaw: Array<{ key: string; label: string; count: number }> = [
        { key: 'visits', label: 'Site Visits', count: visitsRaw },
        { key: 'products', label: 'Product Pages', count: productPagesRaw },
        { key: 'trust', label: 'Trust Center', count: trustViewsRaw },
        { key: 'demo_intent', label: 'Demo CTA', count: demoIntentRaw },
        { key: 'form_submit', label: 'Form Submit', count: submitCount },
        { key: 'confirmed', label: 'Confirmed', count: confirmedCount },
      ];

      const top = stagesRaw[0]?.count ?? 0;
      const stages: FunnelStage[] = stagesRaw.map((s, i) => {
        const prev = i === 0 ? null : stagesRaw[i - 1]!.count;
        return {
          key: s.key,
          label: s.label,
          count: s.count,
          conversionFromPrev: prev && prev > 0 ? Number(((s.count / prev) * 100).toFixed(1)) : null,
          conversionFromTop: top > 0 ? Number(((s.count / top) * 100).toFixed(1)) : null,
        };
      });

      // Determine if any meaningful client-side data is being captured.
      const hasClientData = visitsRaw > 0 || trustViewsRaw > 0 || demoIntentRaw > 0;

      res.json({
        window,
        windowStart: windowStart.toISOString(),
        stages,
        hasClientData,
        // Bottom-of-funnel always real because it's server-tracked
        hasServerData: submitCount > 0 || confirmedCount > 0,
      });
    } catch (err) {
      logger.error({ err }, '[admin/analytics/funnel] GET failed');
      res.status(500).json({ error: 'Failed to compute funnel' });
    }
  });
}
