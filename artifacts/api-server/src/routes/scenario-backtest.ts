import { type IRouter, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendBadRequest, sendSuccess } from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';
import { SHOCK_LIBRARY, TRANSMISSION_RULES } from './scenarios';

const router: IRouter = Router();
const noAuth = authMiddleware({ required: false });

interface HistoricalShockEvent {
  id: string;
  date: string;
  shockId: string;
  shockName: string;
  actualMagnitude: number;
  unit: string;
  description: string;
  actualOutcomes: Record<string, { actualDelta: number; metricLabel: string }>;
}

interface BacktestResult {
  eventId: string;
  date: string;
  shockName: string;
  shockMagnitude: number;
  predictions: Array<{
    entityId: string;
    entityLabel: string;
    domain: string;
    metricLabel: string;
    predictedDelta: number;
    actualDelta: number;
    error: number;
    errorPct: number;
    direction: 'correct' | 'incorrect' | 'both_zero';
  }>;
  overallAccuracy: number;
  meanAbsoluteError: number;
  directionalAccuracy: number;
}

interface BacktestSummary {
  totalEvents: number;
  overallAccuracy: number;
  meanAbsoluteErrorM: number;
  directionalAccuracy: number;
  byShockType: Record<string, { eventCount: number; avgAccuracy: number; avgMAE: number; directionalAccuracy: number }>;
  results: BacktestResult[];
  modelVersion: string;
  generatedAt: string;
}

const HISTORICAL_EVENTS: HistoricalShockEvent[] = [
  {
    id: 'hist-001', date: '2024-Q2', shockId: 'oil-spike', shockName: 'Oil Price Shock', actualMagnitude: 18,
    unit: '$/bbl', description: 'OPEC+ surprise production cut drove Brent above $95/bbl.',
    actualOutcomes: {
      'vessels-mv-poseidon': { actualDelta: -3.1, metricLabel: 'Voyage P&L ($M)' },
      'vessels-mv-argo': { actualDelta: -1.8, metricLabel: 'Voyage P&L ($M)' },
      'szl-portfolio-nav': { actualDelta: -8.2, metricLabel: 'Portfolio NAV ($M)' },
    },
  },
  {
    id: 'hist-002', date: '2024-Q3', shockId: 'rate-hike', shockName: 'Interest Rate Move', actualMagnitude: 50,
    unit: 'bps', description: 'Fed paused after cumulative 50bp hike cycle, market adjusted.',
    actualOutcomes: {
      'terra-miami-commercial': { actualDelta: -2.8, metricLabel: 'Asset NAV ($M)' },
      'terra-austin-industrial': { actualDelta: -1.2, metricLabel: 'Asset NAV ($M)' },
      'szl-portfolio-nav': { actualDelta: -3.5, metricLabel: 'Portfolio NAV ($M)' },
    },
  },
  {
    id: 'hist-003', date: '2024-Q4', shockId: 'strait-closure', shockName: 'Strategic Strait Closure', actualMagnitude: 3,
    unit: 'weeks', description: 'Houthi Red Sea disruptions forced Suez Canal diversions for 3 weeks.',
    actualOutcomes: {
      'vessels-mv-poseidon': { actualDelta: -1.4, metricLabel: 'Voyage P&L ($M)' },
      'vessels-mv-argo': { actualDelta: -0.9, metricLabel: 'Voyage P&L ($M)' },
      'szl-portfolio-nav': { actualDelta: -1.1, metricLabel: 'Portfolio NAV ($M)' },
      'aegis-threat-surface': { actualDelta: 8, metricLabel: 'Attack Probability % change' },
    },
  },
  {
    id: 'hist-004', date: '2025-Q1', shockId: 'eu-sanctions', shockName: 'EU Sanctions Package', actualMagnitude: 4,
    unit: 'severity (1-5)', description: 'EU 14th sanctions package expanded Russian oil transport restrictions.',
    actualOutcomes: {
      'vessels-mv-poseidon': { actualDelta: -4.8, metricLabel: 'Voyage P&L ($M)' },
      'vessels-mv-argo': { actualDelta: -3.1, metricLabel: 'Voyage P&L ($M)' },
      'counsel-contracts': { actualDelta: 4, metricLabel: 'Clauses Triggered' },
      'szl-portfolio-nav': { actualDelta: -2.8, metricLabel: 'Portfolio NAV ($M)' },
    },
  },
  {
    id: 'hist-005', date: '2025-Q2', shockId: 'occupancy-delta', shockName: 'Commercial Occupancy Shift', actualMagnitude: -5,
    unit: 'ppt', description: 'Remote work acceleration reduced commercial occupancy across Class A office.',
    actualOutcomes: {
      'terra-miami-commercial': { actualDelta: -1.9, metricLabel: 'Asset NAV ($M)' },
      'terra-austin-industrial': { actualDelta: -0.3, metricLabel: 'Asset NAV ($M)' },
      'szl-portfolio-nav': { actualDelta: -0.8, metricLabel: 'Portfolio NAV ($M)' },
    },
  },
  {
    id: 'hist-006', date: '2025-Q3', shockId: 'fx-usd', shockName: 'USD FX Move', actualMagnitude: 8,
    unit: '%', description: 'Dollar strengthened amid safe-haven flows following EM currency crises.',
    actualOutcomes: {
      'vessels-mv-poseidon': { actualDelta: 1.2, metricLabel: 'Voyage P&L ($M)' },
      'terra-miami-commercial': { actualDelta: -0.6, metricLabel: 'Asset NAV ($M)' },
      'szl-portfolio-nav': { actualDelta: -9.2, metricLabel: 'Portfolio NAV ($M)' },
    },
  },
  {
    id: 'hist-007', date: '2025-Q4', shockId: 'geopolitical-threat', shockName: 'Geopolitical Threat Escalation', actualMagnitude: 4,
    unit: 'threat level (1-5)', description: 'Taiwan Strait tensions escalated maritime insurance premiums.',
    actualOutcomes: {
      'aegis-threat-surface': { actualDelta: 32, metricLabel: 'Attack Probability % change' },
      'szl-portfolio-nav': { actualDelta: -1.2, metricLabel: 'Portfolio NAV ($M)' },
    },
  },
];

function runBacktestForEvent(event: HistoricalShockEvent, horizonWeeks: number): BacktestResult {
  const matchingRules = TRANSMISSION_RULES.filter((r) => r.shockId === event.shockId);
  const predictions: BacktestResult['predictions'] = [];

  for (const rule of matchingRules) {
    const predictedDelta = rule.computeDeltaM(event.actualMagnitude, horizonWeeks);
    const actual = event.actualOutcomes[rule.entityId];

    if (actual) {
      const error = Math.abs(predictedDelta - actual.actualDelta);
      const errorPct = actual.actualDelta !== 0 ? (error / Math.abs(actual.actualDelta)) * 100 : predictedDelta !== 0 ? 100 : 0;
      const dirCorrect = predictedDelta === 0 && actual.actualDelta === 0 ? 'both_zero' : (predictedDelta < 0) === (actual.actualDelta < 0) ? 'correct' : 'incorrect';

      predictions.push({
        entityId: rule.entityId,
        entityLabel: rule.entityLabel,
        domain: rule.domain,
        metricLabel: rule.metricLabel,
        predictedDelta: parseFloat(predictedDelta.toFixed(2)),
        actualDelta: actual.actualDelta,
        error: parseFloat(error.toFixed(2)),
        errorPct: parseFloat(errorPct.toFixed(1)),
        direction: dirCorrect,
      });
    }
  }

  const nonZero = predictions.filter((p) => p.direction !== 'both_zero');
  const directionalCorrect = nonZero.filter((p) => p.direction === 'correct').length;
  const directionalAccuracy = nonZero.length > 0 ? directionalCorrect / nonZero.length : 1;
  const mae = predictions.length > 0 ? predictions.reduce((s, p) => s + p.error, 0) / predictions.length : 0;
  const maxError = predictions.length > 0 ? Math.max(...predictions.map((p) => p.errorPct)) : 0;
  const accuracy = Math.max(0, 1 - maxError / 200);

  return {
    eventId: event.id,
    date: event.date,
    shockName: event.shockName,
    shockMagnitude: event.actualMagnitude,
    predictions,
    overallAccuracy: parseFloat(accuracy.toFixed(3)),
    meanAbsoluteError: parseFloat(mae.toFixed(2)),
    directionalAccuracy: parseFloat(directionalAccuracy.toFixed(3)),
  };
}

router.get('/scenarios/backtest/events', noAuth, (_req, res) => {
  sendSuccess(res, {
    events: HISTORICAL_EVENTS.map((e) => ({
      id: e.id,
      date: e.date,
      shockId: e.shockId,
      shockName: e.shockName,
      actualMagnitude: e.actualMagnitude,
      unit: e.unit,
      description: e.description,
      outcomeCount: Object.keys(e.actualOutcomes).length,
    })),
    count: HISTORICAL_EVENTS.length,
  });
});

const backtestSchema = z.object({
  eventIds: z.array(z.string()).min(1).max(20).optional(),
  horizonWeeks: z.number().int().min(1).max(52).optional(),
});

router.post('/scenarios/backtest/run', noAuth, validateBody(backtestSchema), (req, res) => {
  try {
    const { eventIds, horizonWeeks = 12 } = req.body as z.infer<typeof backtestSchema>;

    let events = HISTORICAL_EVENTS;
    if (eventIds && eventIds.length > 0) {
      events = events.filter((e) => eventIds.includes(e.id));
    }

    if (events.length === 0) {
      sendBadRequest(res, 'No matching historical events found');
      return;
    }

    const results = events.map((e) => runBacktestForEvent(e, horizonWeeks));

    const overallAccuracy = results.reduce((s, r) => s + r.overallAccuracy, 0) / results.length;
    const overallMAE = results.reduce((s, r) => s + r.meanAbsoluteError, 0) / results.length;
    const overallDirAcc = results.reduce((s, r) => s + r.directionalAccuracy, 0) / results.length;

    const byShockType: BacktestSummary['byShockType'] = {};
    for (const r of results) {
      const event = HISTORICAL_EVENTS.find((e) => e.id === r.eventId)!;
      const key = event.shockId;
      if (!byShockType[key]) {
        byShockType[key] = { eventCount: 0, avgAccuracy: 0, avgMAE: 0, directionalAccuracy: 0 };
      }
      byShockType[key].eventCount++;
      byShockType[key].avgAccuracy += r.overallAccuracy;
      byShockType[key].avgMAE += r.meanAbsoluteError;
      byShockType[key].directionalAccuracy += r.directionalAccuracy;
    }
    for (const key of Object.keys(byShockType)) {
      const entry = byShockType[key];
      entry.avgAccuracy = parseFloat((entry.avgAccuracy / entry.eventCount).toFixed(3));
      entry.avgMAE = parseFloat((entry.avgMAE / entry.eventCount).toFixed(2));
      entry.directionalAccuracy = parseFloat((entry.directionalAccuracy / entry.eventCount).toFixed(3));
    }

    const summary: BacktestSummary = {
      totalEvents: results.length,
      overallAccuracy: parseFloat(overallAccuracy.toFixed(3)),
      meanAbsoluteErrorM: parseFloat(overallMAE.toFixed(2)),
      directionalAccuracy: parseFloat(overallDirAcc.toFixed(3)),
      byShockType,
      results,
      modelVersion: 'rule-graph-v1',
      generatedAt: new Date().toISOString(),
    };

    sendSuccess(res, summary);
  } catch (err) {
    handleRouteError(res, err, 'Failed to run backtest');
  }
});

router.get('/scenarios/backtest/accuracy', noAuth, (_req, res) => {
  try {
    const results = HISTORICAL_EVENTS.map((e) => runBacktestForEvent(e, 12));
    const overallAccuracy = results.reduce((s, r) => s + r.overallAccuracy, 0) / results.length;
    const overallMAE = results.reduce((s, r) => s + r.meanAbsoluteError, 0) / results.length;
    const dirAccuracy = results.reduce((s, r) => s + r.directionalAccuracy, 0) / results.length;

    const byShock: Record<string, { accuracy: number; mae: number; count: number }> = {};
    for (const r of results) {
      const event = HISTORICAL_EVENTS.find((e) => e.id === r.eventId)!;
      if (!byShock[event.shockId]) byShock[event.shockId] = { accuracy: 0, mae: 0, count: 0 };
      byShock[event.shockId].accuracy += r.overallAccuracy;
      byShock[event.shockId].mae += r.meanAbsoluteError;
      byShock[event.shockId].count++;
    }

    sendSuccess(res, {
      overallAccuracy: parseFloat(overallAccuracy.toFixed(3)),
      meanAbsoluteErrorM: parseFloat(overallMAE.toFixed(2)),
      directionalAccuracy: parseFloat(dirAccuracy.toFixed(3)),
      totalEvents: results.length,
      byShockType: Object.fromEntries(
        Object.entries(byShock).map(([k, v]) => [
          k,
          {
            accuracy: parseFloat((v.accuracy / v.count).toFixed(3)),
            mae: parseFloat((v.mae / v.count).toFixed(2)),
            eventCount: v.count,
          },
        ]),
      ),
      modelVersion: 'rule-graph-v1',
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get accuracy metrics');
  }
});

export default router;
