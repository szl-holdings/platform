import { type IRouter, type RequestHandler, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { LRUCache } from 'lru-cache';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

const freightLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Freight benchmark rate limit exceeded.' },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

interface ClassBaseline {
  key: string;
  label: string;
  dwt: string;
  color: string;
  baseTce: number;
  volatility: number;
  routes: string[];
  pnlAlias?: string[];
}

const CLASS_BASELINES: ClassBaseline[] = [
  {
    key: 'vlcc',
    label: 'VLCC',
    dwt: '200,000+ DWT',
    color: '#f472b6',
    baseTce: 58200,
    volatility: 0.05,
    routes: ['TD3C (AG→CHN)', 'TD15 (WAF→CHN)', 'TD22 (USG→CHN)'],
  },
  {
    key: 'suezmax',
    label: 'Suezmax',
    dwt: '120,000–200,000 DWT',
    color: '#a78bfa',
    baseTce: 41600,
    volatility: 0.045,
    routes: ['TD20 (WAF→CONT)', 'TD6 (BSEA→MED)', 'TD23 (AG→MED)'],
  },
  {
    key: 'aframax',
    label: 'Aframax',
    dwt: '80,000–120,000 DWT',
    color: '#fbbf24',
    baseTce: 32400,
    volatility: 0.055,
    routes: ['TD7 (NSEA→CONT)', 'TD25 (USG→UKC)', 'TD17 (BALT→UKC)'],
  },
  {
    key: 'capesize',
    label: 'Capesize',
    dwt: '100,000–180,000 DWT',
    color: '#38bdf8',
    baseTce: 28450,
    volatility: 0.07,
    routes: ['C5 (WA→CHN)', 'C3 (BRA→CHN)', 'Transatlantic'],
  },
  {
    key: 'panamax',
    label: 'Panamax',
    dwt: '60,000–100,000 DWT',
    color: '#818cf8',
    baseTce: 16280,
    volatility: 0.06,
    routes: ['P1A (Transatlantic)', 'P2A (Fronthaul)', 'P3A (Backhaul)'],
  },
  {
    key: 'supramax',
    label: 'Supramax',
    dwt: '45,000–65,000 DWT',
    color: '#34d399',
    baseTce: 13840,
    volatility: 0.05,
    routes: ['S1C (USG→FE)', 'S5 (USG/Cont)', 'S4B (USG/SKorea)'],
  },
  {
    key: 'handysize',
    label: 'Handysize',
    dwt: '25,000–45,000 DWT',
    color: '#fb923c',
    baseTce: 12150,
    volatility: 0.045,
    routes: ['HS1 (Cont→FE)', 'HS2 (FE→Cont)', 'HS3 (USG→FE)'],
  },
  {
    key: 'lng',
    label: 'LNG Carrier',
    dwt: '160,000–180,000 cbm',
    color: '#22d3ee',
    baseTce: 78500,
    volatility: 0.04,
    routes: ['BLNG1g (AG→JPN)', 'BLNG2g (USG→UKC)', 'BLNG3g (USG→JPN)'],
    pnlAlias: ['LNG Carrier'],
  },
];

const ROUTE_BASELINES = [
  {
    route: 'C5 — W. Australia → China (Iron Ore)',
    classKey: 'capesize',
    baseRate: 11.2,
    unit: '$/MT',
    volatility: 0.08,
  },
  {
    route: 'C3 — Tubarão → Qingdao (Iron Ore)',
    classKey: 'capesize',
    baseRate: 28.1,
    unit: '$/MT',
    volatility: 0.07,
  },
  {
    route: 'P1A — Transatlantic Round',
    classKey: 'panamax',
    baseRate: 16280,
    unit: '$/day',
    volatility: 0.06,
  },
  {
    route: 'P2A — Fronthaul (AMS → FEast)',
    classKey: 'panamax',
    baseRate: 22400,
    unit: '$/day',
    volatility: 0.06,
  },
  {
    route: 'S1C — USG → Far East',
    classKey: 'supramax',
    baseRate: 24800,
    unit: '$/day',
    volatility: 0.05,
  },
  {
    route: 'S5 — USG → Cont/Med',
    classKey: 'supramax',
    baseRate: 18200,
    unit: '$/day',
    volatility: 0.05,
  },
  {
    route: 'HS1 — Cont → Far East (MV)',
    classKey: 'handysize',
    baseRate: 13800,
    unit: '$/day',
    volatility: 0.05,
  },
  {
    route: 'HS3 — USG → Far East',
    classKey: 'handysize',
    baseRate: 14900,
    unit: '$/day',
    volatility: 0.05,
  },
];

function deterministicWiggle(seed: number, t: number): number {
  // Multi-frequency sinusoidal drift in [-1, 1]
  return (
    0.55 * Math.sin(t * 0.85 + seed * 1.7) +
    0.3 * Math.sin(t * 0.31 + seed * 2.9) +
    0.15 * Math.sin(t * 1.93 + seed * 0.6)
  );
}

function computeSnapshot(now: Date) {
  // Slot the world into 5-minute buckets so the value is stable within a refresh window
  const tHours =
    Math.floor(now.getTime() / REFRESH_INTERVAL_MS) * (REFRESH_INTERVAL_MS / 3_600_000);

  const benchmarks = CLASS_BASELINES.map((c, idx) => {
    const seed = idx + 1;
    const drift = deterministicWiggle(seed, tHours);
    const driftPrev = deterministicWiggle(seed, tHours - 168); // 1 week back

    const tce = Math.round(c.baseTce * (1 + drift * c.volatility));
    const tcePrev = Math.round(c.baseTce * (1 + driftPrev * c.volatility));
    const changePct = tcePrev !== 0 ? +(((tce - tcePrev) / tcePrev) * 100).toFixed(2) : 0;

    const change = tce - tcePrev;
    const fleetAvg = Math.round(
      tce * (0.94 + Math.abs(deterministicWiggle(seed + 11, tHours)) * 0.04),
    );
    const topQuartile = Math.round(
      tce * (1.13 + Math.abs(deterministicWiggle(seed + 23, tHours)) * 0.03),
    );
    const bottomQuartile = Math.round(
      tce * (0.81 + Math.abs(deterministicWiggle(seed + 41, tHours)) * 0.03),
    );

    // Forward curve (6 months out) — gentle drift seeded from class + month
    const forward = Array.from({ length: 6 }, (_, m) => {
      const fwdDrift = deterministicWiggle(seed + (m + 1) * 7, tHours);
      return Math.round(tce * (1 + fwdDrift * c.volatility * 0.8));
    });

    return {
      key: c.key,
      label: c.label,
      dwt: c.dwt,
      color: c.color,
      tce,
      change,
      changePct,
      fleetAvg,
      topQuartile,
      bottomQuartile,
      routes: c.routes,
      forward,
      pnlAlias: c.pnlAlias ?? [c.label],
    };
  });

  const benchmarksByLabel: Record<string, (typeof benchmarks)[number]> = {};
  for (const b of benchmarks) {
    benchmarksByLabel[b.label] = b;
    for (const alias of b.pnlAlias) benchmarksByLabel[alias] = b;
  }

  const routes = ROUTE_BASELINES.map((r, idx) => {
    const seed = idx + 100;
    const drift = deterministicWiggle(seed, tHours);
    const driftPrev = deterministicWiggle(seed, tHours - 24);
    const rate = +(r.baseRate * (1 + drift * r.volatility)).toFixed(r.unit === '$/MT' ? 1 : 0);
    const ratePrev = +(r.baseRate * (1 + driftPrev * r.volatility)).toFixed(
      r.unit === '$/MT' ? 1 : 0,
    );
    const change = +(rate - ratePrev).toFixed(r.unit === '$/MT' ? 1 : 0);
    return {
      route: r.route,
      classKey: r.classKey,
      rate,
      change,
      unit: r.unit,
    };
  });

  return { benchmarks, benchmarksByLabel, routes };
}

interface SnapshotPayload {
  asOf: string;
  source: string;
  methodology: string;
  refreshIntervalSeconds: number;
  nextRefreshAt: string;
  benchmarks: ReturnType<typeof computeSnapshot>['benchmarks'];
  benchmarksByLabel: ReturnType<typeof computeSnapshot>['benchmarksByLabel'];
  routes: ReturnType<typeof computeSnapshot>['routes'];
}

const cache = new LRUCache<string, { value: SnapshotPayload; expiresAt: number }>({ max: 4 });

function buildPayload(): SnapshotPayload {
  const now = new Date();
  const slotMs = Math.floor(now.getTime() / REFRESH_INTERVAL_MS) * REFRESH_INTERVAL_MS;
  const cached = cache.get('snapshot');
  if (cached && cached.expiresAt > now.getTime()) return cached.value;

  const snap = computeSnapshot(new Date(slotMs));
  const payload: SnapshotPayload = {
    asOf: new Date(slotMs).toISOString(),
    source: 'Baltic Exchange — TCE benchmarks (synthesized feed)',
    methodology:
      'Time-banded TCE drift seeded from Baltic Exchange published baselines; refreshed on a fixed cadence so all surfaces share the same snapshot.',
    refreshIntervalSeconds: REFRESH_INTERVAL_MS / 1000,
    nextRefreshAt: new Date(slotMs + REFRESH_INTERVAL_MS).toISOString(),
    benchmarks: snap.benchmarks,
    benchmarksByLabel: snap.benchmarksByLabel,
    routes: snap.routes,
  };
  cache.set('snapshot', { value: payload, expiresAt: slotMs + REFRESH_INTERVAL_MS });
  return payload;
}

router.get(
  '/vessels/freight/benchmarks',
  freightLimit,
  authMiddleware({ required: false }),
  async (_req, res) => {
    try {
      const payload = buildPayload();
      sendSuccess(res, payload);
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch freight benchmarks');
    }
  },
);

export default router;
