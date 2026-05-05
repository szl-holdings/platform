/**
 * Lutar Router — the canonical model-selection loop. Picks the model that
 * maximises Ξ across a candidate set, taking into account context fit,
 * cost, latency, and goal alignment.
 *
 * All scoring happens via the formulas in this package; no external
 * provider calls are made. The router returns a `RouterDecision` which
 * downstream code (api-server, agent runtimes, UI badges) can render or
 * act on.
 */
import { lOmega, OMEGA_MODES, type ModelSpec, type OmegaWeights, type QuerySpec } from './omega.js';
import { propeller } from './propeller.js';
import { dialogEntropy, sigmoid, xi, type ChatTurn } from './xi.js';

export interface RouterModel extends ModelSpec {
  /** Stable identifier returned in the decision (e.g. `gpt-5.5`). */
  id: string;
  provider?: string;
  persona?: string;
}

export interface RouterRequest {
  prompt: string;
  history?: readonly ChatTurn[];
  maxOut?: number;
  /** A key from `OMEGA_MODES` or a custom OmegaWeights object. */
  mode?: keyof typeof OMEGA_MODES | OmegaWeights;
  require?: readonly string[];
  batch?: boolean;
  /** Pre-computed mean A_lang multiplier; defaults to 0 (neutral). */
  meanALang?: number;
  /** Goal vector for propeller alignment (defaults to [1, 0.8, 0.6]). */
  goalVec?: readonly number[];
}

export interface RouterDecision {
  modelId: string;
  persona: string;
  xi: number;
  lOmega: number;
  pLambda: number;
  thrust: number;
  froude: number;
  alignment: number;
  estCostUsd: number;
  estLatencyMs: number;
  arbitrageMultiplier: number;
  dialogEntropy: number;
  reason: string;
}

const DEFAULT_GOAL: readonly number[] = [1.0, 0.8, 0.6];

function approxTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function resolveWeights(mode: RouterRequest['mode']): OmegaWeights {
  if (!mode) return OMEGA_MODES.ultra;
  if (typeof mode === 'string') {
    const w = OMEGA_MODES[mode];
    if (!w) throw new RangeError(`Lutar router: unknown mode "${mode}"`);
    return w;
  }
  return mode;
}

function normaliseColumn(values: number[]): number[] {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = Math.max(hi - lo, 1e-9);
  return values.map((v) => (v - lo) / span);
}

/**
 * Picks the Ξ-maximising model. Pure function — no I/O — so it's safe to
 * run in browsers, edge functions, and server endpoints alike.
 */
export function routeWithXi(
  models: readonly RouterModel[],
  req: RouterRequest,
): RouterDecision {
  if (!models.length) {
    throw new Error('Lutar router: no candidate models supplied');
  }
  const maxOut = req.maxOut ?? 600;
  const inTok =
    approxTokens(req.prompt) +
    (req.history ?? []).reduce((acc, m) => acc + approxTokens(m.content ?? ''), 0);
  const q: QuerySpec = {
    inTokens: inTok,
    outTokens: maxOut,
    require: req.require ?? ['chat'],
    batch: req.batch ?? false,
  };
  const eligible = models.filter((m) => inTok + maxOut <= m.context);
  if (!eligible.length) {
    throw new Error('Lutar router: no model fits the requested context');
  }

  const w = resolveWeights(req.mode);

  // Compute raw L_Ω per candidate, then min/max-normalise so the score
  // is comparable across heterogeneous units (cost, latency, intel).
  const raw = eligible.map((m) => ({ id: m.id, score: lOmega(m, q, w), m }));
  const normScores = normaliseColumn(raw.map((r) => r.score));
  const goal = req.goalVec ?? DEFAULT_GOAL;
  const meanA = req.meanALang ?? 0;
  const arbMult = sigmoid(meanA);
  const turnWeight = 1 / (1 + dialogEntropy(req.history ?? []));

  let best: RouterDecision | null = null;
  for (let i = 0; i < raw.length; i++) {
    const m = raw[i].m;
    const scoreNorm = normScores[i];
    const omegaIn = raw[i].score * 0.5;
    const omegaOut = raw[i].score * (1 + 0.1 * scoreNorm);
    const step = [scoreNorm, m.tps / 400, 1 / (1 + m.inputCost)];
    const pr = propeller(m, q, omegaIn, omegaOut, goal, step);
    const xiValue = scoreNorm * Math.max(pr.P_lambda, 1e-3) * arbMult * turnWeight;
    if (!best || xiValue > best.xi) {
      const mult = q.batch ? 1 - m.batchDiscount : 1;
      const cost = ((q.inTokens * m.inputCost) + (maxOut * m.outputCost)) / 1e6 * mult;
      const lat = (maxOut / m.tps) * 1000;
      best = {
        modelId: m.id,
        persona: m.persona ?? '',
        xi: Math.round(xiValue * 1e4) / 1e4,
        lOmega: Math.round(scoreNorm * 1e4) / 1e4,
        pLambda: pr.P_lambda,
        thrust: pr.thrust,
        froude: pr.froude,
        alignment: pr.alignment,
        estCostUsd: Math.round(cost * 1e6) / 1e6,
        estLatencyMs: Math.round(lat),
        arbitrageMultiplier: Math.round(arbMult * 1e4) / 1e4,
        dialogEntropy: Math.round(dialogEntropy(req.history ?? []) * 1e4) / 1e4,
        reason:
          `Ξ→${m.id} L_Ω=${scoreNorm.toFixed(2)} P_Λ=${pr.P_lambda.toFixed(2)} ` +
          `Ξ=${xiValue.toFixed(2)} $${cost.toFixed(4)}`,
      };
    }
  }
  // Above loop guarantees a best given we already validated `eligible`.
  return best as RouterDecision;
}

/** Re-export for convenience: build a Ξ report from existing component scores. */
export { xi } from './xi.js';
