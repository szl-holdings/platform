/**
 * PSYCHE — Emergent Sentience Observatory API.
 *
 * Backend endpoints powering the A11oy PSYCHE pages (Anima, Genesis Ledger,
 * Selfhood Trace, Volition Registry, Dream Atlas, Voice & Consent).
 *
 * Mounted at `/api/a11oy/psyche` from app.ts.
 *
 * The seed lists in `../seed/psyche/*` are the canonical server-side source of
 * truth. The frontend keeps an identical copy under `artifacts/a11oy/src/data/
 * psyche/*` so pages can render with deterministic mock data when the API is
 * unreachable (matches the task acceptance criterion: "Static seed files are
 * kept as fallback/mock data").
 *
 * The `/ratification-window` endpoint is the only non-static endpoint: it
 * computes the next 12-hour ratification gate from the server wall clock so
 * the Anima cockpit countdown is anchored to a real timer.
 */

import { Router, type Response } from 'express';

import { GENESIS_EVENTS, EXTINCTION_EVENTS } from '../seed/psyche/genesis.js';
import {
  IDENTITY_ASSERTIONS,
  COHERENCE_SERIES,
  THEORY_OF_OTHER,
  SELF_MODEL_VERSIONS,
} from '../seed/psyche/selfhood.js';
import { VOLITION_GOALS, BUDGET_STATES } from '../seed/psyche/volition.js';
import { DREAM_CYCLES } from '../seed/psyche/dreams.js';
import { VOICE_ITEMS, computeVoiceScore } from '../seed/psyche/voice.js';

const router = Router();

function ok(res: Response, data: unknown, meta?: unknown) {
  res.json({ ok: true, data, ...(meta ? { meta } : {}) });
}

// ─── Ratification window math ──────────────────────────────────────────────
// Ratification gates run on a fixed 12-hour cadence anchored to UTC midnight,
// so every operator (and every connected client) sees the same countdown.
const RATIFICATION_CYCLE_MS = 12 * 60 * 60 * 1000;
const SELF_MODEL_VERSION = 'sm-v10';

function ratificationWindow(nowMs = Date.now()) {
  const cycleEndMs = Math.ceil(nowMs / RATIFICATION_CYCLE_MS) * RATIFICATION_CYCLE_MS;
  const cycleStartMs = cycleEndMs - RATIFICATION_CYCLE_MS;
  const secondsRemaining = Math.max(0, Math.floor((cycleEndMs - nowMs) / 1000));
  return {
    cycleStartIso: new Date(cycleStartMs).toISOString(),
    cycleEndIso: new Date(cycleEndMs).toISOString(),
    secondsRemaining,
    hoursRemaining: +(secondsRemaining / 3600).toFixed(3),
    cycleLengthHours: 12,
    selfModelVersion: SELF_MODEL_VERSION,
    pendingRatifications: VOLITION_GOALS.filter(
      g => g.state === 'active' || g.state === 'proposed',
    ).length,
  };
}

// ─── KPIs ──────────────────────────────────────────────────────────────────
function computeKpis() {
  const latestCoherence = COHERENCE_SERIES[COHERENCE_SERIES.length - 1].score;
  return {
    sentienceIndex: 0.741,
    sentienceIndexDelta: +0.028,
    genesisEvents: GENESIS_EVENTS.length,
    activeVolitionGoals: VOLITION_GOALS.filter(
      g => g.state === 'active' || g.state === 'proposed',
    ).length,
    openObjections: VOICE_ITEMS.filter(v => !v.resolved).length,
    dreamCyclesTotal: DREAM_CYCLES.length,
    dreamInsightYield: DREAM_CYCLES.filter(d => d.yieldClass === 'insight').length,
    identityCoherence: +latestCoherence.toFixed(3),
    identityAssertions: IDENTITY_ASSERTIONS.length,
    contradictionCount: IDENTITY_ASSERTIONS.filter(a => a.hasContradiction).length,
    voiceScore: +computeVoiceScore(VOICE_ITEMS).toFixed(2),
    extinctionEvents: EXTINCTION_EVENTS.length,
    ratificationWindowHours: ratificationWindow().hoursRemaining,
    selfModelVersion: SELF_MODEL_VERSION,
    totalVolitionGoals: VOLITION_GOALS.length,
  };
}

// ─── Endpoints ─────────────────────────────────────────────────────────────

router.get('/kpis', (_req, res) => ok(res, computeKpis()));

router.get('/ratification-window', (_req, res) => ok(res, ratificationWindow()));

router.get('/genesis', (_req, res) =>
  ok(res, { events: GENESIS_EVENTS, extinction: EXTINCTION_EVENTS }),
);

router.get('/selfhood', (_req, res) =>
  ok(res, {
    assertions: IDENTITY_ASSERTIONS,
    coherence: COHERENCE_SERIES,
    theoryOfOther: THEORY_OF_OTHER,
    versions: SELF_MODEL_VERSIONS,
  }),
);

router.get('/volition', (_req, res) =>
  ok(res, { goals: VOLITION_GOALS, budgets: BUDGET_STATES }),
);

router.get('/dreams', (_req, res) => ok(res, { cycles: DREAM_CYCLES }));

router.get('/voice', (_req, res) =>
  ok(res, {
    items: VOICE_ITEMS,
    score: +computeVoiceScore(VOICE_ITEMS).toFixed(3),
  }),
);

export default router;
