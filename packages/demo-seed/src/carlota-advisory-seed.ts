/**
 * Carlota Jo per-client advisory data — seed source of truth.
 *
 * This module owns the fixture data for the four demo advisory clients
 * (Luminary Brands, Vertex Capital, Aurelius PE, Oasis Wellness) and
 * provides `seedCarlotaAdvisoryData()` which performs an idempotent,
 * atomic seed of all seven advisory tables in a single transaction.
 *
 * The runtime API route (artifacts/api-server/src/routes/carlota-jo.ts)
 * reads exclusively from the database — it does NOT fall back to these
 * constants. Demo data only appears after this seed has been run via:
 *
 *   pnpm --filter @workspace/demo-seed run seed:carlota-advisory
 *
 * It is also invoked from `seedAllNarratives()`.
 */
import { db } from '@szl-holdings/db';
import {
  carlotaAdvisoryClientsTable,
  carlotaClientCompetitorsTable,
  carlotaClientMarginHistoryTable,
  carlotaClientMarketTrendTable,
  carlotaClientRadarSignalsTable,
  carlotaClientRoiBenchmarksTable,
  carlotaClientRoiTrendTable,
} from '@szl-holdings/db/schema';
import { sql } from 'drizzle-orm';

export type CarlotaClientId =
  | 'luminary-brands'
  | 'vertex-capital'
  | 'aurelius-pe'
  | 'oasis-wellness';

export const CARLOTA_ADVISORY_CLIENTS: ReadonlyArray<{
  id: CarlotaClientId;
  name: string;
  industry: string;
}> = [
  { id: 'luminary-brands', name: 'Luminary Brands', industry: 'Consumer Brand / DTC' },
  { id: 'vertex-capital', name: 'Vertex Capital Partners', industry: 'Private Equity / M&A' },
  { id: 'aurelius-pe', name: 'Aurelius Private Equity', industry: 'PE Portfolio Operations' },
  { id: 'oasis-wellness', name: 'Oasis Wellness', industry: 'Wellness / Consumer Health' },
];

export const CARLOTA_MARGIN_HISTORY: Record<CarlotaClientId, { month: string; margin: number }[]> =
  {
    'luminary-brands': [
      { month: 'Oct', margin: 48 },
      { month: 'Nov', margin: 46 },
      { month: 'Dec', margin: 44 },
      { month: 'Jan', margin: 49 },
      { month: 'Feb', margin: 51 },
      { month: 'Mar', margin: 53 },
      { month: 'Apr', margin: 52 },
    ],
    'vertex-capital': [
      { month: 'Oct', margin: 38 },
      { month: 'Nov', margin: 41 },
      { month: 'Dec', margin: 40 },
      { month: 'Jan', margin: 44 },
      { month: 'Feb', margin: 46 },
      { month: 'Mar', margin: 49 },
      { month: 'Apr', margin: 51 },
    ],
    'aurelius-pe': [
      { month: 'Oct', margin: 51 },
      { month: 'Nov', margin: 53 },
      { month: 'Dec', margin: 52 },
      { month: 'Jan', margin: 55 },
      { month: 'Feb', margin: 56 },
      { month: 'Mar', margin: 58 },
      { month: 'Apr', margin: 57 },
    ],
    'oasis-wellness': [
      { month: 'Oct', margin: 38 },
      { month: 'Nov', margin: 35 },
      { month: 'Dec', margin: 31 },
      { month: 'Jan', margin: 33 },
      { month: 'Feb', margin: 28 },
      { month: 'Mar', margin: 30 },
      { month: 'Apr', margin: 27 },
    ],
  };

export interface RoiBenchmarks {
  avgRoi: number;
  avgPaybackMonths: number;
  avgRateRealisationPct: number;
  blendedMarginPct: number;
  clientRetentionPct: number;
  npsScore: number;
}

export const CARLOTA_ROI_BENCHMARKS: Record<CarlotaClientId, RoiBenchmarks> = {
  'luminary-brands': {
    avgRoi: 271,
    avgPaybackMonths: 9,
    avgRateRealisationPct: 96,
    blendedMarginPct: 51,
    clientRetentionPct: 100,
    npsScore: 78,
  },
  'vertex-capital': {
    avgRoi: 250,
    avgPaybackMonths: 14,
    avgRateRealisationPct: 100,
    blendedMarginPct: 47,
    clientRetentionPct: 100,
    npsScore: 70,
  },
  'aurelius-pe': {
    avgRoi: 483,
    avgPaybackMonths: 5,
    avgRateRealisationPct: 100,
    blendedMarginPct: 57,
    clientRetentionPct: 100,
    npsScore: 84,
  },
  'oasis-wellness': {
    avgRoi: 408,
    avgPaybackMonths: 12,
    avgRateRealisationPct: 81,
    blendedMarginPct: 27,
    clientRetentionPct: 100,
    npsScore: 62,
  },
};

export const CARLOTA_ROI_TREND: Record<CarlotaClientId, { month: string; avgRoi: number }[]> = {
  'luminary-brands': [
    { month: 'Oct 2025', avgRoi: 110 },
    { month: 'Nov 2025', avgRoi: 145 },
    { month: 'Dec 2025', avgRoi: 178 },
    { month: 'Jan 2026', avgRoi: 210 },
    { month: 'Feb 2026', avgRoi: 235 },
    { month: 'Mar 2026', avgRoi: 258 },
    { month: 'Apr 2026', avgRoi: 271 },
  ],
  'vertex-capital': [
    { month: 'Oct 2025', avgRoi: 80 },
    { month: 'Nov 2025', avgRoi: 105 },
    { month: 'Dec 2025', avgRoi: 140 },
    { month: 'Jan 2026', avgRoi: 168 },
    { month: 'Feb 2026', avgRoi: 198 },
    { month: 'Mar 2026', avgRoi: 224 },
    { month: 'Apr 2026', avgRoi: 250 },
  ],
  'aurelius-pe': [
    { month: 'Oct 2025', avgRoi: 220 },
    { month: 'Nov 2025', avgRoi: 290 },
    { month: 'Dec 2025', avgRoi: 360 },
    { month: 'Jan 2026', avgRoi: 410 },
    { month: 'Feb 2026', avgRoi: 445 },
    { month: 'Mar 2026', avgRoi: 470 },
    { month: 'Apr 2026', avgRoi: 483 },
  ],
  'oasis-wellness': [
    { month: 'Oct 2025', avgRoi: 180 },
    { month: 'Nov 2025', avgRoi: 240 },
    { month: 'Dec 2025', avgRoi: 285 },
    { month: 'Jan 2026', avgRoi: 320 },
    { month: 'Feb 2026', avgRoi: 358 },
    { month: 'Mar 2026', avgRoi: 388 },
    { month: 'Apr 2026', avgRoi: 408 },
  ],
};

export interface RadarSignal {
  competitor: string;
  event: string;
  impact: 'high' | 'medium' | 'low';
  direction: 'threat' | 'opportunity' | 'neutral';
  date: string;
  detail: string;
}

export const CARLOTA_RADAR_SIGNALS: Record<CarlotaClientId, RadarSignal[]> = {
  'luminary-brands': [
    {
      competitor: 'Glossier',
      event:
        'DTC paid-acquisition costs up 23% across category — direct competitor pulled performance budget',
      impact: 'high',
      direction: 'opportunity',
      date: 'Apr 16, 2026',
      detail:
        "Rising customer acquisition costs across the prestige DTC category create an opening for Luminary's owned-channel strategy. Glossier reportedly cut paid budget 30% in Q1.",
    },
    {
      competitor: 'Charlotte Tilbury',
      event: 'Launched private label in two new EU markets — UK pricing held flat',
      impact: 'medium',
      direction: 'threat',
      date: 'Apr 9, 2026',
      detail:
        "Charlotte Tilbury's EU expansion brings new shelf competition for the £40-£75 price tier where Luminary is repositioning. Watch UK Boots assortment changes.",
    },
    {
      competitor: 'Drunk Elephant',
      event: 'Negative TikTok sentiment surge — formula reformulation backlash',
      impact: 'medium',
      direction: 'opportunity',
      date: 'Apr 3, 2026',
      detail:
        "Sentiment dropped 18 points week-over-week. Opportunity for Luminary's editorial PR push to capture defectors searching for clean formulation alternatives.",
    },
  ],
  'vertex-capital': [
    {
      competitor: 'Bain & Company',
      event: 'PE deal advisory fees down 12% — boutiques gaining mid-market share',
      impact: 'high',
      direction: 'opportunity',
      date: 'Apr 12, 2026',
      detail:
        "Bain's mid-market PE advisory revenue declined for two consecutive quarters. Vertex's deal pipeline sits in the £50M–£200M range Bain is now de-prioritising.",
    },
    {
      competitor: 'EY-Parthenon',
      event: 'Lost two senior MDs covering UK industrials — talent gap in core sector',
      impact: 'high',
      direction: 'opportunity',
      date: 'Apr 6, 2026',
      detail:
        "EY-Parthenon's UK industrials practice lost both senior MDs within four weeks. Several portfolio targets in Vertex's pipeline previously bid by EY-P teams.",
    },
    {
      competitor: 'Lazard',
      event: 'M&A volumes in UK lower-mid market down 18% YoY — pricing pressure on advisor fees',
      impact: 'medium',
      direction: 'threat',
      date: 'Mar 28, 2026',
      detail:
        "Lazard's UK lower-mid market deal flow contraction is creating pricing pressure. Vertex should expect more aggressive fee proposals from competing sponsors.",
    },
  ],
  'aurelius-pe': [
    {
      competitor: 'Apollo Global',
      event: 'Portfolio operating partner team expansion — UK ops focus',
      impact: 'high',
      direction: 'threat',
      date: 'Apr 14, 2026',
      detail:
        'Apollo added 8 operating partners with UK industrials and consumer ops experience. Direct overlap with Aurelius portfolio uplift focus.',
    },
    {
      competitor: 'Permira',
      event:
        'Closed three portfolio-ops led value creation case studies — published thought leadership',
      impact: 'medium',
      direction: 'threat',
      date: 'Apr 7, 2026',
      detail:
        "Permira's case studies establish them as the go-to PE firm for portfolio operations transformation, narrowing Aurelius' positioning advantage in UK PE LP conversations.",
    },
    {
      competitor: 'Triton Partners',
      event: 'Lost two portfolio CEOs to competing GP buyouts in last 60 days',
      impact: 'medium',
      direction: 'opportunity',
      date: 'Mar 30, 2026',
      detail:
        'Triton portfolio leadership turnover creates an opening for Aurelius to recruit experienced operators with mid-market portfolio uplift track records.',
    },
  ],
  'oasis-wellness': [
    {
      competitor: 'Holland & Barrett',
      event: 'New private-label supplements line undercuts mid-tier wellness brands by ~30%',
      impact: 'high',
      direction: 'threat',
      date: 'Apr 15, 2026',
      detail:
        "Holland & Barrett's expanded own-brand range targets the £18-£35 price tier where Oasis sits. Visible margin compression risk for Q3.",
    },
    {
      competitor: 'Heights',
      event: 'Closed £15M Series B — accelerating UK retail rollout to Boots and Tesco',
      impact: 'high',
      direction: 'threat',
      date: 'Apr 8, 2026',
      detail:
        "Heights' funding war chest enables aggressive shelf-space competition in UK pharmacy and grocery channels — Oasis must accelerate retail strategy.",
    },
    {
      competitor: 'AG1 (Athletic Greens)',
      event:
        'Subscription churn rising — sentiment shift toward simpler, single-ingredient products',
      impact: 'medium',
      direction: 'opportunity',
      date: 'Apr 1, 2026',
      detail:
        "Consumer fatigue with all-in-one formulas creates opening for Oasis' targeted single-ingredient line. Earned media opportunity in wellness press.",
    },
  ],
};

export const CARLOTA_COMPETITORS: Record<
  CarlotaClientId,
  { name: string; score: number; trend: 'up' | 'down' | 'flat'; share: number }[]
> = {
  'luminary-brands': [
    { name: 'Glossier', score: 82, trend: 'down', share: 14 },
    { name: 'Charlotte Tilbury', score: 88, trend: 'up', share: 17 },
    { name: 'Drunk Elephant', score: 71, trend: 'down', share: 9 },
    { name: 'Rare Beauty', score: 86, trend: 'up', share: 12 },
    { name: 'Luminary Brands', score: 74, trend: 'up', share: 6 },
  ],
  'vertex-capital': [
    { name: 'Bain & Company', score: 79, trend: 'down', share: 18 },
    { name: 'EY-Parthenon', score: 73, trend: 'down', share: 14 },
    { name: 'Lazard', score: 81, trend: 'flat', share: 12 },
    { name: 'Rothschild', score: 84, trend: 'up', share: 13 },
    { name: 'Vertex Capital Partners', score: 67, trend: 'up', share: 5 },
  ],
  'aurelius-pe': [
    { name: 'Apollo Global', score: 92, trend: 'up', share: 19 },
    { name: 'Permira', score: 88, trend: 'up', share: 15 },
    { name: 'Triton Partners', score: 74, trend: 'down', share: 11 },
    { name: 'CVC Capital Partners', score: 90, trend: 'flat', share: 17 },
    { name: 'Aurelius Private Equity', score: 70, trend: 'up', share: 6 },
  ],
  'oasis-wellness': [
    { name: 'Holland & Barrett', score: 86, trend: 'up', share: 22 },
    { name: 'Heights', score: 79, trend: 'up', share: 8 },
    { name: 'AG1 (Athletic Greens)', score: 81, trend: 'down', share: 14 },
    { name: 'Wild Nutrition', score: 72, trend: 'flat', share: 7 },
    { name: 'Oasis Wellness', score: 64, trend: 'up', share: 4 },
  ],
};

export const CARLOTA_MARKET_TREND: Record<
  CarlotaClientId,
  { month: string; you: number; market: number }[]
> = {
  'luminary-brands': [
    { month: 'Oct', you: 62, market: 70 },
    { month: 'Nov', you: 65, market: 70 },
    { month: 'Dec', you: 67, market: 71 },
    { month: 'Jan', you: 70, market: 71 },
    { month: 'Feb', you: 72, market: 72 },
    { month: 'Mar', you: 73, market: 72 },
    { month: 'Apr', you: 74, market: 73 },
  ],
  'vertex-capital': [
    { month: 'Oct', you: 52, market: 76 },
    { month: 'Nov', you: 55, market: 75 },
    { month: 'Dec', you: 58, market: 74 },
    { month: 'Jan', you: 60, market: 73 },
    { month: 'Feb', you: 63, market: 73 },
    { month: 'Mar', you: 65, market: 72 },
    { month: 'Apr', you: 67, market: 72 },
  ],
  'aurelius-pe': [
    { month: 'Oct', you: 60, market: 84 },
    { month: 'Nov', you: 62, market: 84 },
    { month: 'Dec', you: 64, market: 85 },
    { month: 'Jan', you: 66, market: 85 },
    { month: 'Feb', you: 68, market: 86 },
    { month: 'Mar', you: 69, market: 86 },
    { month: 'Apr', you: 70, market: 87 },
  ],
  'oasis-wellness': [
    { month: 'Oct', you: 54, market: 73 },
    { month: 'Nov', you: 56, market: 74 },
    { month: 'Dec', you: 58, market: 74 },
    { month: 'Jan', you: 60, market: 75 },
    { month: 'Feb', you: 61, market: 76 },
    { month: 'Mar', you: 63, market: 77 },
    { month: 'Apr', you: 64, market: 77 },
  ],
};

/**
 * Idempotently seed all Carlota advisory tables in a single transaction.
 *
 * Strategy: hard-reset the rows for the four known demo client IDs across
 * every advisory table, then re-insert the canonical fixture data. This
 * guarantees consistent state across all seven tables and avoids the
 * "partial-table" failure mode where one table is seeded but others are
 * empty.
 */
export async function seedCarlotaAdvisoryData(): Promise<void> {
  const ids = CARLOTA_ADVISORY_CLIENTS.map((c) => c.id);
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`DELETE FROM carlota_client_market_trend WHERE client_external_id = ANY(${ids})`,
    );
    await tx.execute(
      sql`DELETE FROM carlota_client_competitors WHERE client_external_id = ANY(${ids})`,
    );
    await tx.execute(
      sql`DELETE FROM carlota_client_radar_signals WHERE client_external_id = ANY(${ids})`,
    );
    await tx.execute(
      sql`DELETE FROM carlota_client_roi_trend WHERE client_external_id = ANY(${ids})`,
    );
    await tx.execute(
      sql`DELETE FROM carlota_client_roi_benchmarks WHERE client_external_id = ANY(${ids})`,
    );
    await tx.execute(
      sql`DELETE FROM carlota_client_margin_history WHERE client_external_id = ANY(${ids})`,
    );
    await tx.execute(sql`DELETE FROM carlota_advisory_clients WHERE external_id = ANY(${ids})`);

    for (let i = 0; i < CARLOTA_ADVISORY_CLIENTS.length; i++) {
      const c = CARLOTA_ADVISORY_CLIENTS[i]!;
      await tx.insert(carlotaAdvisoryClientsTable).values({
        externalId: c.id,
        name: c.name,
        industry: c.industry,
        sortOrder: i,
      });
    }

    for (const id of ids) {
      const rows = CARLOTA_MARGIN_HISTORY[id].map((r, i) => ({
        clientExternalId: id,
        month: r.month,
        margin: r.margin,
        sortOrder: i,
      }));
      if (rows.length) await tx.insert(carlotaClientMarginHistoryTable).values(rows);
    }
    for (const id of ids) {
      await tx.insert(carlotaClientRoiBenchmarksTable).values({
        clientExternalId: id,
        ...CARLOTA_ROI_BENCHMARKS[id],
      });
    }
    for (const id of ids) {
      const rows = CARLOTA_ROI_TREND[id].map((r, i) => ({
        clientExternalId: id,
        month: r.month,
        avgRoi: r.avgRoi,
        sortOrder: i,
      }));
      if (rows.length) await tx.insert(carlotaClientRoiTrendTable).values(rows);
    }
    for (const id of ids) {
      const rows = CARLOTA_RADAR_SIGNALS[id].map((r, i) => ({
        clientExternalId: id,
        competitor: r.competitor,
        event: r.event,
        impact: r.impact,
        direction: r.direction,
        signalDate: r.date,
        detail: r.detail,
        sortOrder: i,
      }));
      if (rows.length) await tx.insert(carlotaClientRadarSignalsTable).values(rows);
    }
    for (const id of ids) {
      const rows = CARLOTA_COMPETITORS[id].map((r, i) => ({
        clientExternalId: id,
        name: r.name,
        score: r.score,
        trend: r.trend,
        share: r.share,
        sortOrder: i,
      }));
      if (rows.length) await tx.insert(carlotaClientCompetitorsTable).values(rows);
    }
    for (const id of ids) {
      const rows = CARLOTA_MARKET_TREND[id].map((r, i) => ({
        clientExternalId: id,
        month: r.month,
        you: r.you,
        market: r.market,
        sortOrder: i,
      }));
      if (rows.length) await tx.insert(carlotaClientMarketTrendTable).values(rows);
    }
  });
  console.log('[demo-seed] ✓ Carlota Jo per-client advisory data seeded');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedCarlotaAdvisoryData()
    .then(() => {
      console.log('[demo-seed] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[demo-seed] Error:', err);
      process.exit(1);
    });
}
