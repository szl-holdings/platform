import { bodyShape } from '@szl-holdings/contracts/common';
import { type IRouter, type RequestHandler, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { LRUCache } from 'lru-cache';
import { z } from 'zod';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

const tradingLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trading API rate limit exceeded.' },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

const cache = new LRUCache<string, { data: unknown; expiry: number; fetchedAt: number }>({
  max: 200,
});
function getCached<T>(key: string, ttlMs: number, fetcher: () => T): T {
  const c = cache.get(key);
  const now = Date.now();
  if (c && c.expiry > now) return c.data as T;
  const data = fetcher();
  cache.set(key, { data, expiry: now + ttlMs, fetchedAt: now });
  return data;
}

function seedRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const INSTRUMENTS = [
  {
    id: 1,
    symbol: 'BDI',
    name: 'Baltic Dry Index',
    instrumentType: 'dry_bulk',
    exchange: 'Baltic Exchange',
    currency: 'USD',
    unit: 'points',
    routeCode: 'BDI',
    description:
      'Composite index of average prices to ship raw materials across global shipping lanes',
  },
  {
    id: 2,
    symbol: 'BCI',
    name: 'Baltic Capesize Index',
    instrumentType: 'dry_bulk',
    exchange: 'Baltic Exchange',
    currency: 'USD',
    unit: '$/day',
    routeCode: 'C5TC',
    description: 'Time charter average for Capesize vessels (180,000 DWT)',
  },
  {
    id: 3,
    symbol: 'BPI',
    name: 'Baltic Panamax Index',
    instrumentType: 'dry_bulk',
    exchange: 'Baltic Exchange',
    currency: 'USD',
    unit: '$/day',
    routeCode: 'P4TC',
    description: 'Time charter average for Panamax vessels (75,000 DWT)',
  },
  {
    id: 4,
    symbol: 'BSI',
    name: 'Baltic Supramax Index',
    instrumentType: 'dry_bulk',
    exchange: 'Baltic Exchange',
    currency: 'USD',
    unit: '$/day',
    routeCode: 'S10TC',
    description: 'Time charter average for Supramax vessels (58,000 DWT)',
  },
  {
    id: 5,
    symbol: 'BDTI',
    name: 'Baltic Dirty Tanker Index',
    instrumentType: 'wet_bulk',
    exchange: 'Baltic Exchange',
    currency: 'USD',
    unit: 'WS points',
    routeCode: 'TD3C',
    description: 'Worldscale index for crude tankers on key routes',
  },
  {
    id: 6,
    symbol: 'BCTI',
    name: 'Baltic Clean Tanker Index',
    instrumentType: 'wet_bulk',
    exchange: 'Baltic Exchange',
    currency: 'USD',
    unit: 'WS points',
    routeCode: 'TC1',
    description: 'Worldscale index for clean product tankers',
  },
  {
    id: 7,
    symbol: 'IODEX',
    name: 'Platts Iron Ore Index (62% Fe CFR China)',
    instrumentType: 'iron_ore_swap',
    exchange: 'Platts',
    currency: 'USD',
    unit: '$/mt',
    routeCode: 'IRON62',
    description: 'Spot price for iron ore (62% Fe) CFR China',
  },
  {
    id: 8,
    symbol: 'VLSFO',
    name: 'Very Low Sulphur Fuel Oil (Rotterdam)',
    instrumentType: 'bunker_fuel',
    exchange: 'OTC',
    currency: 'USD',
    unit: '$/mt',
    routeCode: 'VLSFO-RTM',
    description: 'IMO 2020 compliant bunker fuel (max 0.5% S)',
  },
  {
    id: 9,
    symbol: 'SCRUB',
    name: 'Hi-5 Spread (HSFO vs VLSFO)',
    instrumentType: 'bunker_fuel',
    exchange: 'OTC',
    currency: 'USD',
    unit: '$/mt',
    routeCode: 'HI5',
    description: 'Price differential between HSFO and VLSFO — scrubber economics indicator',
  },
  {
    id: 10,
    symbol: 'CCFI',
    name: 'China Containerized Freight Index',
    instrumentType: 'container_rate',
    exchange: 'SSE',
    currency: 'USD',
    unit: 'points',
    routeCode: 'CCFI-COMP',
    description: 'Composite freight index for containerized exports from China',
  },
];

const BASE_PRICES: Record<string, number> = {
  BDI: 1843,
  BCI: 14250,
  BPI: 12800,
  BSI: 11200,
  BDTI: 845,
  BCTI: 620,
  IODEX: 104.5,
  VLSFO: 598,
  SCRUB: 195,
  CCFI: 924,
};

function generatePrice(symbol: string, offset: number, rng: () => number): number {
  const base = BASE_PRICES[symbol] ?? 1000;
  const volMap: Record<string, number> = {
    BDI: 0.04,
    BCI: 0.05,
    BPI: 0.04,
    BSI: 0.035,
    BDTI: 0.06,
    BCTI: 0.05,
    IODEX: 0.03,
    VLSFO: 0.025,
    SCRUB: 0.08,
    CCFI: 0.025,
  };
  const vol = volMap[symbol] ?? 0.03;
  const drift = (rng() - 0.499) * vol;
  return Math.round(base * (1 + drift) * (1 + offset * 0.001 * (rng() - 0.5)) * 100) / 100;
}

function getLiveInstruments() {
  const now = Date.now();
  const dayKey = Math.floor(now / 86400000);
  const rng = seedRng(dayKey + 42);
  return INSTRUMENTS.map((inst) => {
    const price = generatePrice(inst.symbol, 0, rng);
    const prev = generatePrice(inst.symbol, -1, seedRng(dayKey + 41));
    const high = Math.max(price, prev) * (1 + rng() * 0.015);
    const low = Math.min(price, prev) * (1 - rng() * 0.015);
    const change = price - prev;
    const changePct = (change / prev) * 100;
    return {
      ...inst,
      currentPrice: price,
      previousClose: Math.round(prev * 100) / 100,
      dayHigh: Math.round(high * 100) / 100,
      dayLow: Math.round(low * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePct: Math.round(changePct * 100) / 100,
      volume: Math.floor(rng() * 500 + 50),
      openInterest: Math.floor(rng() * 2000 + 200),
      isActive: true,
      lastUpdatedAt: new Date().toISOString(),
    };
  });
}

const DEMO_ORDERS: any[] = [
  {
    id: 1,
    instrumentId: 1,
    orderRef: 'ORD-BDI-001',
    orderType: 'limit',
    side: 'buy',
    status: 'filled',
    quantity: '5',
    limitPrice: '1820.00',
    avgFillPrice: '1822.50',
    filledQty: '5',
    remainingQty: '0',
    notionalValue: '9112.50',
    commission: '27.34',
    submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    filledAt: new Date(Date.now() - 3600000 * 1.9).toISOString(),
  },
  {
    id: 2,
    instrumentId: 2,
    orderRef: 'ORD-BCI-002',
    orderType: 'market',
    side: 'buy',
    status: 'filled',
    quantity: '2',
    avgFillPrice: '14100.00',
    filledQty: '2',
    remainingQty: '0',
    notionalValue: '28200.00',
    commission: '84.60',
    submittedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    filledAt: new Date(Date.now() - 3600000 * 4.9).toISOString(),
  },
  {
    id: 3,
    instrumentId: 8,
    orderRef: 'ORD-VLSFO-003',
    orderType: 'limit',
    side: 'sell',
    status: 'open',
    quantity: '100',
    limitPrice: '605.00',
    filledQty: '0',
    remainingQty: '100',
    notionalValue: '60500.00',
    commission: '0',
    submittedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 4,
    instrumentId: 5,
    orderRef: 'ORD-BDTI-004',
    orderType: 'limit',
    side: 'buy',
    status: 'partially_filled',
    quantity: '10',
    limitPrice: '850.00',
    avgFillPrice: '848.00',
    filledQty: '4',
    remainingQty: '6',
    notionalValue: '3392.00',
    commission: '10.18',
    submittedAt: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: 5,
    instrumentId: 3,
    orderRef: 'ORD-BPI-005',
    orderType: 'market',
    side: 'sell',
    status: 'filled',
    quantity: '3',
    avgFillPrice: '12750.00',
    filledQty: '3',
    remainingQty: '0',
    notionalValue: '38250.00',
    commission: '114.75',
    submittedAt: new Date(Date.now() - 7200000).toISOString(),
    filledAt: new Date(Date.now() - 7100000).toISOString(),
  },
];

const DEMO_POSITIONS: any[] = [
  {
    id: 1,
    instrumentId: 1,
    side: 'buy',
    quantity: '5',
    avgEntryPrice: '1822.50',
    openedAt: new Date(Date.now() - 3600000 * 1.9).toISOString(),
  },
  {
    id: 2,
    instrumentId: 2,
    side: 'buy',
    quantity: '2',
    avgEntryPrice: '14100.00',
    openedAt: new Date(Date.now() - 3600000 * 4.9).toISOString(),
  },
  {
    id: 3,
    instrumentId: 5,
    side: 'buy',
    quantity: '4',
    avgEntryPrice: '848.00',
    openedAt: new Date(Date.now() - 900000).toISOString(),
  },
];

const DEMO_FILLS: any[] = [
  {
    id: 1,
    orderId: 1,
    instrumentId: 1,
    fillRef: 'FILL-001',
    side: 'buy',
    quantity: '5',
    price: '1822.50',
    commission: '27.34',
    executionVenue: 'BIFFEX',
    filledAt: new Date(Date.now() - 3600000 * 1.9).toISOString(),
  },
  {
    id: 2,
    orderId: 2,
    instrumentId: 2,
    fillRef: 'FILL-002',
    side: 'buy',
    quantity: '2',
    price: '14100.00',
    commission: '84.60',
    executionVenue: 'BIFFEX',
    filledAt: new Date(Date.now() - 3600000 * 4.9).toISOString(),
  },
  {
    id: 3,
    orderId: 4,
    instrumentId: 5,
    fillRef: 'FILL-003',
    side: 'buy',
    quantity: '4',
    price: '848.00',
    commission: '10.18',
    executionVenue: 'BIFFEX',
    filledAt: new Date(Date.now() - 870000).toISOString(),
  },
  {
    id: 4,
    orderId: 5,
    instrumentId: 3,
    fillRef: 'FILL-004',
    side: 'sell',
    quantity: '3',
    price: '12750.00',
    commission: '114.75',
    executionVenue: 'BIFFEX',
    filledAt: new Date(Date.now() - 7100000).toISOString(),
  },
];

let nextOrderId = 6;
let nextFillId = 5;
const sessionOrders: any[] = [];
const sessionFills: any[] = [];

router.get(
  '/vessels/trading/instruments',
  tradingLimit,
  authMiddleware({ required: false }),
  (_req, res) => {
    try {
      const instruments = getCached('instruments', 30 * 1000, getLiveInstruments);
      sendSuccess(res, {
        instruments,
        count: instruments.length,
        exchange: 'Baltic Exchange / Platts / OTC',
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch instruments');
    }
  },
);

router.get(
  '/vessels/trading/instruments/:id',
  tradingLimit,
  authMiddleware({ required: false }),
  (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const instruments = getCached('instruments', 30 * 1000, getLiveInstruments);
      const inst = instruments.find((i) => i.id === id);
      if (!inst) {
        res.status(404).json({ error: 'Instrument not found' });
        return;
      }
      sendSuccess(res, { instrument: inst, fetchedAt: new Date().toISOString() });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch instrument');
    }
  },
);

router.get(
  '/vessels/trading/rates',
  tradingLimit,
  authMiddleware({ required: false }),
  (_req, res) => {
    try {
      const instruments = getCached('instruments', 30 * 1000, getLiveInstruments);
      const rates = instruments.reduce((acc: any, inst) => {
        acc[inst.symbol] = {
          price: inst.currentPrice,
          change: inst.change,
          changePct: inst.changePct,
          unit: inst.unit,
          currency: inst.currency,
        };
        return acc;
      }, {});
      sendSuccess(res, {
        rates,
        source: 'Baltic Exchange / Platts / OTC (simulated)',
        asOf: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch rates');
    }
  },
);

router.get(
  '/vessels/trading/orders',
  tradingLimit,
  authMiddleware({ required: false }),
  validateQuery(listQuerySchema),
  (req, res) => {
    try {
      const status = req.query.status as string;
      const allOrders = [...DEMO_ORDERS, ...sessionOrders];
      const filtered = status ? allOrders.filter((o) => o.status === status) : allOrders;
      const instruments = getCached('instruments', 30 * 1000, getLiveInstruments);
      const ordersWithInst = filtered.map((o) => ({
        ...o,
        instrument: instruments.find((i) => i.id === o.instrumentId) ?? null,
      }));
      sendSuccess(res, {
        orders: ordersWithInst.reverse(),
        count: ordersWithInst.length,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch orders');
    }
  },
);

router.post(
  '/vessels/trading/orders',
  tradingLimit,
  authMiddleware({ required: false }),
  validateBody(
    bodyShape({
      instrumentId: z.unknown().optional(),
      limitPrice: z.unknown().optional(),
      notes: z.unknown().optional(),
      orderType: z.unknown().optional(),
      quantity: z.unknown().optional(),
      side: z.unknown().optional(),
    }),
  ),
  (req, res) => {
    try {
      const { instrumentId, orderType, side, quantity, limitPrice, notes } = req.body;
      if (!instrumentId || !side || !quantity) {
        res.status(400).json({ error: 'instrumentId, side, and quantity are required' });
        return;
      }
      const instruments = getCached('instruments', 30 * 1000, getLiveInstruments);
      const inst = instruments.find((i) => i.id === parseInt(instrumentId));
      if (!inst) {
        res.status(404).json({ error: 'Instrument not found' });
        return;
      }

      const qty = parseFloat(quantity);
      const fillPrice =
        orderType === 'limit' && limitPrice ? parseFloat(limitPrice) : inst.currentPrice;
      const notional = qty * fillPrice;
      const commission = Math.round(notional * 0.003 * 100) / 100;
      const orderRef = `ORD-${inst.symbol}-${String(nextOrderId).padStart(3, '0')}`;

      const newOrder: any = {
        id: nextOrderId++,
        instrumentId: parseInt(instrumentId),
        orderRef,
        orderType: orderType ?? 'market',
        side,
        status: orderType === 'market' ? 'filled' : 'open',
        quantity: String(qty),
        limitPrice: limitPrice ? String(parseFloat(limitPrice)) : null,
        avgFillPrice: orderType === 'market' ? String(fillPrice) : null,
        filledQty: orderType === 'market' ? String(qty) : '0',
        remainingQty: orderType === 'market' ? '0' : String(qty),
        notionalValue: orderType === 'market' ? String(notional) : null,
        commission: orderType === 'market' ? String(commission) : '0',
        notes: notes ?? null,
        submittedAt: new Date().toISOString(),
        filledAt: orderType === 'market' ? new Date().toISOString() : null,
        instrument: inst,
      };

      sessionOrders.push(newOrder);

      if (orderType === 'market') {
        const fillRef = `FILL-${String(nextFillId++).padStart(3, '0')}`;
        sessionFills.push({
          id: nextFillId - 1,
          orderId: newOrder.id,
          instrumentId: parseInt(instrumentId),
          fillRef,
          side,
          quantity: String(qty),
          price: String(fillPrice),
          commission: String(commission),
          executionVenue: 'SZL-DEMO',
          filledAt: new Date().toISOString(),
        });
      }

      sendSuccess(res, {
        order: newOrder,
        filled: orderType === 'market',
        message:
          orderType === 'market'
            ? `Order filled at ${inst.currency} ${fillPrice}`
            : 'Limit order placed',
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to submit order');
    }
  },
);

router.delete(
  '/vessels/trading/orders/:id',
  validateBody(bodyShape({})),
  tradingLimit,
  authMiddleware({ required: false }),
  (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const idx = sessionOrders.findIndex((o) => o.id === id);
      const demoIdx = DEMO_ORDERS.findIndex((o) => o.id === id);
      if (idx >= 0) {
        if (sessionOrders[idx].status === 'filled') {
          res.status(400).json({ error: 'Cannot cancel filled order' });
          return;
        }
        sessionOrders[idx] = {
          ...sessionOrders[idx],
          status: 'cancelled',
          cancelledAt: new Date().toISOString(),
        };
      } else if (demoIdx >= 0) {
        if (DEMO_ORDERS[demoIdx].status === 'filled') {
          res.status(400).json({ error: 'Cannot cancel filled order' });
          return;
        }
        DEMO_ORDERS[demoIdx] = {
          ...DEMO_ORDERS[demoIdx],
          status: 'cancelled',
          cancelledAt: new Date().toISOString(),
        };
      } else {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      sendSuccess(res, { message: 'Order cancelled', orderId: id });
    } catch (err) {
      handleRouteError(res, err, 'Failed to cancel order');
    }
  },
);

router.get(
  '/vessels/trading/positions',
  tradingLimit,
  authMiddleware({ required: false }),
  (_req, res) => {
    try {
      const instruments = getCached('instruments', 30 * 1000, getLiveInstruments);
      const positions = DEMO_POSITIONS.map((pos) => {
        const inst = instruments.find((i) => i.id === pos.instrumentId);
        const currentPrice = inst?.currentPrice ?? parseFloat(pos.avgEntryPrice);
        const qty = parseFloat(pos.quantity);
        const entry = parseFloat(pos.avgEntryPrice);
        const unrealizedPnl =
          pos.side === 'buy'
            ? Math.round((currentPrice - entry) * qty * 100) / 100
            : Math.round((entry - currentPrice) * qty * 100) / 100;
        const notional = Math.round(currentPrice * qty * 100) / 100;
        return {
          ...pos,
          currentPrice,
          unrealizedPnl,
          realizedPnl: 0,
          totalPnl: unrealizedPnl,
          notionalValue: notional,
          instrument: inst ?? null,
        };
      });

      const totalUnrealized =
        Math.round(positions.reduce((s, p) => s + p.unrealizedPnl, 0) * 100) / 100;
      const totalNotional =
        Math.round(positions.reduce((s, p) => s + p.notionalValue, 0) * 100) / 100;

      sendSuccess(res, {
        positions,
        summary: {
          totalPositions: positions.length,
          totalUnrealizedPnl: totalUnrealized,
          totalNotionalValue: totalNotional,
        },
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch positions');
    }
  },
);

router.get(
  '/vessels/trading/fills',
  tradingLimit,
  authMiddleware({ required: false }),
  (_req, res) => {
    try {
      const allFills = [...DEMO_FILLS, ...sessionFills];
      const instruments = getCached('instruments', 30 * 1000, getLiveInstruments);
      const fills = allFills.map((f) => ({
        ...f,
        instrument: instruments.find((i) => i.id === f.instrumentId) ?? null,
      }));
      sendSuccess(res, {
        fills: fills.reverse(),
        count: fills.length,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch fills');
    }
  },
);

router.get(
  '/vessels/trading/pnl',
  tradingLimit,
  authMiddleware({ required: false }),
  (_req, res) => {
    try {
      const rng = seedRng(Math.floor(Date.now() / 86400000) + 99);
      const instruments = getCached('instruments', 30 * 1000, getLiveInstruments);
      const positions = DEMO_POSITIONS.map((pos) => {
        const inst = instruments.find((i) => i.id === pos.instrumentId);
        const currentPrice = inst?.currentPrice ?? parseFloat(pos.avgEntryPrice);
        const qty = parseFloat(pos.quantity);
        const entry = parseFloat(pos.avgEntryPrice);
        return pos.side === 'buy' ? (currentPrice - entry) * qty : (entry - currentPrice) * qty;
      });

      const unrealized = Math.round(positions.reduce((s, p) => s + p, 0) * 100) / 100;
      const realized =
        Math.round(
          DEMO_FILLS.reduce((s, f) => s + parseFloat(f.quantity) * parseFloat(f.price), 0) *
            0.006 *
            100,
        ) / 100;
      const commission =
        Math.round(DEMO_FILLS.reduce((s, f) => s + parseFloat(f.commission), 0) * 100) / 100;
      const net = Math.round((unrealized + realized - commission) * 100) / 100;

      const dailyHistory = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(Date.now() - (29 - i) * 86400000);
        const pnl = Math.round((rng() - 0.45) * 4000 * 100) / 100;
        return { date: d.toISOString().split('T')[0], pnl, cumulative: 0 };
      });
      let cum = 0;
      dailyHistory.forEach((d) => {
        cum = Math.round((cum + d.pnl) * 100) / 100;
        d.cumulative = cum;
      });

      sendSuccess(res, {
        summary: {
          unrealizedPnl: unrealized,
          realizedPnl: realized,
          totalCommission: commission,
          netPnl: net,
          openPositions: DEMO_POSITIONS.length,
          winRate: 62.5,
          sharpeRatio: 1.42,
        },
        dailyHistory,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch P&L');
    }
  },
);

router.get(
  '/vessels/trading/market-depth/:symbol',
  tradingLimit,
  authMiddleware({ required: false }),
  (req, res) => {
    try {
      const { symbol } = req.params as Record<string, string>;
      const instruments = getCached('instruments', 30 * 1000, getLiveInstruments);
      const inst = instruments.find((i) => i.symbol === symbol.toUpperCase());
      if (!inst) {
        res.status(404).json({ error: 'Instrument not found' });
        return;
      }
      const mid = inst.currentPrice;
      const rng = seedRng(Date.now() % 100000);
      const bids = Array.from({ length: 5 }, (_, i) => ({
        price: Math.round((mid - (i + 1) * mid * 0.002) * 100) / 100,
        size: Math.floor(rng() * 20 + 2),
      }));
      const asks = Array.from({ length: 5 }, (_, i) => ({
        price: Math.round((mid + (i + 1) * mid * 0.002) * 100) / 100,
        size: Math.floor(rng() * 20 + 2),
      }));
      sendSuccess(res, {
        symbol: inst.symbol,
        midPrice: mid,
        bids,
        asks,
        spread: Math.round((asks[0].price - bids[0].price) * 100) / 100,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch market depth');
    }
  },
);

export default router;
