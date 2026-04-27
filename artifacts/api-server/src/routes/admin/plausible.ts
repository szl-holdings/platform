import type { IRouter } from 'express';
import { logger } from '../../lib/logger.js';

const PLAUSIBLE_BASE = 'https://plausible.io/api/v1';

interface PlausibleAggregateResult {
  visitors: { value: number };
  pageviews: { value: number };
  events?: { value: number };
}

interface PlausibleBreakdownItem {
  source?: string;
  page?: string;
  visitors: number;
  pageviews?: number;
}

interface PlausibleBreakdownResult {
  results: PlausibleBreakdownItem[];
}

interface PlausibleAggregateResponse {
  results: PlausibleAggregateResult;
}

async function plausibleFetch<T>(
  path: string,
  apiKey: string,
  params: Record<string, string>,
): Promise<T> {
  const url = new URL(`${PLAUSIBLE_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Plausible ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export function register(router: IRouter): void {
  router.get('/admin/analytics/plausible', async (_req, res) => {
    const apiKey = process.env.PLAUSIBLE_API_KEY;
    const siteId = process.env.PLAUSIBLE_SITE_ID;

    if (!apiKey || !siteId) {
      return res.json({
        configured: false,
        visitors7d: null,
        topSources: [],
        topPages: [],
        investorPageViews: null,
        deckClickEvents: null,
      });
    }

    try {
      const [aggregate, sources, pages, investorViews, deckClicks] = await Promise.allSettled([
        plausibleFetch<PlausibleAggregateResponse>('/stats/aggregate', apiKey, {
          site_id: siteId,
          period: '7d',
          metrics: 'visitors,pageviews',
        }),

        plausibleFetch<PlausibleBreakdownResult>('/stats/breakdown', apiKey, {
          site_id: siteId,
          period: '7d',
          property: 'visit:source',
          metrics: 'visitors',
          limit: '8',
        }),

        plausibleFetch<PlausibleBreakdownResult>('/stats/breakdown', apiKey, {
          site_id: siteId,
          period: '7d',
          property: 'event:page',
          metrics: 'visitors,pageviews',
          limit: '10',
        }),

        plausibleFetch<PlausibleAggregateResponse>('/stats/aggregate', apiKey, {
          site_id: siteId,
          period: '7d',
          metrics: 'visitors,pageviews',
          filters: 'event:page==/investors',
        }),

        plausibleFetch<PlausibleAggregateResponse>('/stats/aggregate', apiKey, {
          site_id: siteId,
          period: '7d',
          metrics: 'events',
          filters: 'event:name==deck_click',
        }),
      ]);

      const visitors7d =
        aggregate.status === 'fulfilled' ? aggregate.value.results.visitors.value : null;

      const topSources =
        sources.status === 'fulfilled'
          ? sources.value.results.map((r) => ({ source: r.source ?? '(direct)', visitors: r.visitors }))
          : [];

      const topPages =
        pages.status === 'fulfilled'
          ? pages.value.results.map((r) => ({
              page: r.page ?? '/',
              visitors: r.visitors,
              pageviews: r.pageviews ?? r.visitors,
            }))
          : [];

      const investorPageViews =
        investorViews.status === 'fulfilled'
          ? investorViews.value.results.pageviews.value
          : null;

      const deckClickEvents =
        deckClicks.status === 'fulfilled'
          ? (deckClicks.value.results.events?.value ?? null)
          : null;

      if (aggregate.status === 'rejected') {
        logger.warn({ err: aggregate.reason }, '[admin/analytics/plausible] aggregate fetch failed');
      }

      return res.json({
        configured: true,
        visitors7d,
        topSources,
        topPages,
        investorPageViews,
        deckClickEvents,
      });
    } catch (err) {
      logger.error({ err }, '[admin/analytics/plausible] GET failed');
      return res.status(502).json({ error: 'Failed to fetch Plausible data' });
    }
  });
}
