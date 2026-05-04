/**
 * Ouroboros API
 * ----------------------------------------------------------------------------
 * HTTP surface for the @workspace/ouroboros-integrations adapters that
 * lift the Egyptian-mathematics primitives (frustum / seked /
 * unit-fractions / doubling) into the three deployable products in this
 * monorepo:
 *
 *   POST /api/ouroboros/a11oy/reconcile-handoff      — MMP-14 frustum
 *   POST /api/ouroboros/a11oy/audit-fleet            — fleet audit
 *   POST /api/ouroboros/a11oy/guard                  — LaaS guard (Lambda-9)
 *   GET  /api/ouroboros/a11oy/pulse                  — Convergence Pulse
 *   GET  /api/ouroboros/a11oy/stats                  — orchestrator stats
 *   POST /api/ouroboros/amaru/observe-metric         — RMP seked sample
 *   POST /api/ouroboros/amaru/audit-threshold        — unit-fraction audit
 *   POST /api/ouroboros/sentra/anchor-event          — doubling append
 *   POST /api/ouroboros/sentra/anchor-batch          — bulk append
 *   POST /api/ouroboros/sentra/verify-trace          — verify doubling
 *   GET  /api/ouroboros/sentra/anchor-state          — current accumulator
 *
 * SECURITY POSTURE
 *   All routes require an authenticated session (authMiddleware mounted
 *   on the route group). The integrations are pure-functional with no
 *   I/O except the in-memory Sentra accumulator (process-local, scoped
 *   per server instance — replace with HSM in production).
 *
 * The integration adapters are pure functions; this route file is just
 * an HTTP transport. All input is validated with Zod.
 */

import { Router, type IRouter, type Request, type Response } from 'express';
import { z } from 'zod';
import {
  a11oy as a11oyAdapter,
  amaru as amaruAdapter,
  sentra as sentraAdapter,
  A11oyOrchestrator,
  buildSupremeCodex,
  codexSummary,
  queryCodex,
  getCodexNode,
  getEdgesFrom,
  getEdgesTo,
  getNeighbors,
  traverseGraph,
  lutarV1,
  lutarV2,
  lutarV3,
  lutarV4,
  lutarV5,
  lutarV6,
  lutarOmega,
  lutarV7,
  adaptiveWeights,
  evaluateAll,
  twistorProject,
  bekensteinBound,
  bekensteinCheck,
  conformalRescale,
  aeonRecurrence,
  noetherClosureCheck,
  vedicSqrt2,
  mayaCalendarRound,
  iChingIndex,
  rhindCircleArea,
  newJerusalemVolumeKm3,
  PHYSICAL_CONSTANTS,
  TEMPORAL_INDEX,
  NEWTON_PUBLICATIONS,
  NOETHER_CANONICAL_PAIRS,
  NEWTON_FORMULAS_EXPANDED,
  L_PLANCK,
  A_PLANCK,
  SovereignEngine,
  lutarSimplexRoute,
  lsrComplexity,
  e8TrialitySlot,
  priscaGraphRetrieve,
  voteRAG,
  bekensteinGate,
  totPriority,
  rahabSample,
  hermeticScore,
  hermeticGuard,
  noetherJudge,
  chariotFuse,
  dogonReason,
  sekedGenerate,
  GobekliEdgeSLM,
  pwmPredict,
  PLATONIC_SOLIDS,
  SEFIROT_TIERS,
  ChinchillaLutarScaling,
  FreeEnergyLutarActiveInference,
  icrcComputeAll,
  INCA_ALCHEMY_MATERIALS,
  INCA_CEQUES,
  INCA_HUACAS,
  INCA_SUYU_NAMES,
  INCA_SUYU_CEQUE_COUNTS,
  TawaSparseAutoencoder,
  RedTeamHarness,
  RED_TEAM_ATTACK_CATEGORIES,
  CondorMambaSSM,
  EPRBellValidator,
  HopfieldAmaruMemory,
  PredictiveCodingEngine,
  SacredGeometryEngine,
  CognitiveMapNavigator,
  DynamicalBifurcationDetector,
  INNOVATION_MANIFEST,
  PRISCA_LINEAGES,
  type Modality,
  type PriscaLineage,
} from '@workspace/ouroboros-integrations';

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// Process-local Sentra HSM stand-in.
// ---------------------------------------------------------------------------
const sentraAnchor = new sentraAdapter.SentraHSMAnchor();

// Track Amaru fleet monitor per metricId (process-local).
const amaruMonitor = new amaruAdapter.AmaruFleetMonitor();

// Process-local A11oy orchestrator — unified Lambda pipeline + Convergence Pulse.
const orchestrator = new A11oyOrchestrator({ windowSize: 100 });

// Process-local Sovereign Engine v19 -- all 34 SZL innovations.
const sovereign = new SovereignEngine();

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const HandoffSchema = z.object({
  handoffId: z.string().min(1).max(256),
  fromAgent: z.string().min(1).max(128),
  toAgent: z.string().min(1).max(128),
  observerAgent: z.string().min(1).max(128),
  fromLeaves: z.array(z.string().min(1).max(256)).max(2048),
  toLeaves: z.array(z.string().min(1).max(256)).max(2048),
  observerLeaves: z.array(z.string().min(1).max(256)).max(2048),
  timestamp: z.number().int().nonnegative().optional(),
});

const FleetAuditSchema = z.object({
  events: z.array(HandoffSchema).max(512),
});

const MetricSampleSchema = z.object({
  metricId: z.string().min(1).max(128),
  horizontal: z.number().finite(),
  vertical: z.number().finite(),
  timestamp: z.number().int().nonnegative().optional(),
});

const ThresholdSchema = z.object({
  p: z.number().int().positive().max(1_000_000),
  q: z.number().int().positive().max(1_000_000),
  maxTerms: z.number().int().min(1).max(16).optional(),
});

const GuardRequestSchema = z.object({
  subject: z.string().min(1).max(256),
  prompt: z.string().min(1).max(32768),
  response: z.string().max(65536).optional(),
  citations: z.number().int().nonnegative().optional(),
  witnessCount: z.number().int().nonnegative().optional(),
  priorLambda: z.number().min(0).max(1).optional(),
  axisOverrides: z.record(z.string(), z.number().min(0).max(1)).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

const LEAF_HASH_MAX_DECIMAL = 80;
const LEAF_HASH_MAX_HEX = 66;

const LeafHashSchema = z.union([
  z.string().min(1).max(LEAF_HASH_MAX_HEX),
  z.number().int().nonnegative(),
]);

const GovernanceEventSchema = z.object({
  eventId: z.string().min(1).max(256),
  leafHash: LeafHashSchema,
  timestamp: z.number().int().nonnegative().optional(),
});

const GovernanceBatchSchema = z.object({
  events: z.array(GovernanceEventSchema).max(1024),
});

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function now(): number {
  return Date.now();
}

function toBigInt(v: string | number): bigint {
  if (typeof v === 'number') return BigInt(Math.trunc(v));
  const trimmed = v.trim();
  if (/^0x[0-9a-fA-F]+$/.test(trimmed)) return BigInt(trimmed);
  if (/^[0-9]+$/.test(trimmed)) return BigInt(trimmed);
  throw new Error(`Invalid bigint string: ${v}`);
}

function bigintToString(v: bigint): string {
  return v.toString();
}

function serializeDoublingTrace(trace: { steps: ReadonlyArray<{ multiplier: bigint; doubled: bigint; selected: boolean }>; product: bigint }) {
  return {
    product: bigintToString(trace.product),
    steps: trace.steps.map((s, i) => ({
      index: i,
      multiplier: bigintToString(s.multiplier),
      doubled: bigintToString(s.doubled),
      selected: s.selected,
    })),
  };
}

function jsonError(res: Response, status: number, code: string, message: string, details?: unknown) {
  return res.status(status).json({ code, message, details: details ?? null });
}

// ---------------------------------------------------------------------------
// A11oy — Lambda-9 Guard (LaaS endpoint)
// ---------------------------------------------------------------------------
router.post('/a11oy/guard', async (req: Request, res: Response) => {
  const parsed = GuardRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return jsonError(res, 400, 'INVALID_GUARD_REQUEST', parsed.error.message, parsed.error.flatten());
  }
  const result = await orchestrator.guard({
    ...parsed.data,
    axisOverrides: parsed.data.axisOverrides as any,
  });
  return res.json(result);
});

router.get('/a11oy/pulse', (_req: Request, res: Response) => {
  return res.json(orchestrator.currentPulse());
});

router.get('/a11oy/stats', (_req: Request, res: Response) => {
  return res.json(orchestrator.stats());
});

// ---------------------------------------------------------------------------
// A11oy — frustum reconciliation
// ---------------------------------------------------------------------------
router.post('/a11oy/reconcile-handoff', (req: Request, res: Response) => {
  const parsed = HandoffSchema.safeParse(req.body);
  if (!parsed.success) {
    return jsonError(res, 400, 'INVALID_HANDOFF', parsed.error.message, parsed.error.flatten());
  }
  const event = { ...parsed.data, timestamp: parsed.data.timestamp ?? now() };
  const verdict = orchestrator.reconcile(event);
  return res.json(verdict);
});

router.post('/a11oy/audit-fleet', (req: Request, res: Response) => {
  const parsed = FleetAuditSchema.safeParse(req.body);
  if (!parsed.success) {
    return jsonError(res, 400, 'INVALID_FLEET_AUDIT', parsed.error.message, parsed.error.flatten());
  }
  const events = parsed.data.events.map((e) => ({ ...e, timestamp: e.timestamp ?? now() }));
  const result = orchestrator.auditFleet(events);
  return res.json(result);
});

// ---------------------------------------------------------------------------
// Amaru — seked + unit-fraction inspection
// ---------------------------------------------------------------------------
router.post('/amaru/observe-metric', (req: Request, res: Response) => {
  const parsed = MetricSampleSchema.safeParse(req.body);
  if (!parsed.success) {
    return jsonError(res, 400, 'INVALID_METRIC', parsed.error.message, parsed.error.flatten());
  }
  const sample = { ...parsed.data, timestamp: parsed.data.timestamp ?? now() };
  const signal = amaruMonitor.observe(sample);
  return res.json(signal);
});

router.post('/amaru/audit-threshold', (req: Request, res: Response) => {
  const parsed = ThresholdSchema.safeParse(req.body);
  if (!parsed.success) {
    return jsonError(res, 400, 'INVALID_THRESHOLD', parsed.error.message, parsed.error.flatten());
  }
  const { p, q, maxTerms } = parsed.data;
  const audit = amaruAdapter.auditThreshold(p, q, maxTerms);
  return res.json(audit);
});

// ---------------------------------------------------------------------------
// Sentra — doubling-anchor governance accumulator
// ---------------------------------------------------------------------------
router.post('/sentra/anchor-event', (req: Request, res: Response) => {
  const parsed = GovernanceEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return jsonError(res, 400, 'INVALID_EVENT', parsed.error.message, parsed.error.flatten());
  }
  let leafHash: bigint;
  try {
    leafHash = toBigInt(parsed.data.leafHash);
  } catch (e) {
    return jsonError(res, 400, 'INVALID_LEAF_HASH', (e as Error).message);
  }
  const event = {
    eventId: parsed.data.eventId,
    leafHash,
    timestamp: parsed.data.timestamp ?? now(),
  };
  const { state, trace } = sentraAnchor.append(event);
  return res.json({
    state: {
      accumulator: bigintToString(state.accumulator),
      eventCount: state.eventCount,
      lastUpdate: state.lastUpdate,
      prime: bigintToString(state.prime),
    },
    trace: serializeDoublingTrace(trace),
  });
});

router.post('/sentra/anchor-batch', (req: Request, res: Response) => {
  const parsed = GovernanceBatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return jsonError(res, 400, 'INVALID_BATCH', parsed.error.message, parsed.error.flatten());
  }
  const events: { eventId: string; leafHash: bigint; timestamp: number }[] = [];
  try {
    for (const e of parsed.data.events) {
      events.push({
        eventId: e.eventId,
        leafHash: toBigInt(e.leafHash),
        timestamp: e.timestamp ?? now(),
      });
    }
  } catch (e) {
    return jsonError(res, 400, 'INVALID_LEAF_HASH', (e as Error).message);
  }
  const state = sentraAnchor.appendBatch(events);
  return res.json({
    state: {
      accumulator: bigintToString(state.accumulator),
      eventCount: state.eventCount,
      lastUpdate: state.lastUpdate,
      prime: bigintToString(state.prime),
    },
  });
});

router.post('/sentra/verify-trace', (req: Request, res: Response) => {
  const TraceSchema = z.object({
    product: z.string().min(1).max(LEAF_HASH_MAX_DECIMAL),
    steps: z
      .array(
        z.object({
          index: z.number().int().nonnegative().optional(),
          multiplier: z.string().min(1).max(LEAF_HASH_MAX_DECIMAL),
          doubled: z.string().min(1).max(LEAF_HASH_MAX_DECIMAL),
          selected: z.boolean(),
        }),
      )
      .max(2048),
  });
  const parsed = TraceSchema.safeParse(req.body);
  if (!parsed.success) {
    return jsonError(res, 400, 'INVALID_TRACE', parsed.error.message, parsed.error.flatten());
  }
  let trace: { product: bigint; steps: ReadonlyArray<{ multiplier: bigint; doubled: bigint; selected: boolean }> };
  try {
    trace = {
      product: BigInt(parsed.data.product),
      steps: parsed.data.steps.map((s) => ({
        multiplier: BigInt(s.multiplier),
        doubled: BigInt(s.doubled),
        selected: s.selected,
      })),
    };
  } catch (e) {
    return jsonError(res, 400, 'INVALID_TRACE_BIGINT', (e as Error).message);
  }
  const valid = sentraAdapter.verifyHSMTrace(trace as any);
  return res.json({ valid });
});

router.get('/sentra/anchor-state', (_req: Request, res: Response) => {
  const state = sentraAnchor.snapshot();
  return res.json({
    accumulator: bigintToString(state.accumulator),
    eventCount: state.eventCount,
    lastUpdate: state.lastUpdate,
    prime: bigintToString(state.prime),
  });
});

// ---------------------------------------------------------------------------
// Supreme Codex — knowledge graph query endpoints
// ---------------------------------------------------------------------------
const supremeCodex = buildSupremeCodex();

router.get('/codex', (_req: Request, res: Response) => {
  const summary = codexSummary(supremeCodex);
  return res.json({
    schema: supremeCodex.schema,
    entity: supremeCodex.entity,
    author: supremeCodex.author,
    compiled: supremeCodex.compiled,
    ...summary,
    hermeticPrinciples: supremeCodex.hermeticPrinciples,
    ouroborosOperator: supremeCodex.ouroborosOperator,
    newtonRegulae: supremeCodex.newtonRegulae,
    lutarCorrespondence: supremeCodex.lutarCorrespondence,
    supremeEquation: supremeCodex.supremeEquation,
    supremeEquationExtended: supremeCodex.supremeEquationExtended,
  });
});

router.get('/codex/node/:id', (req: Request, res: Response) => {
  const node = getCodexNode(supremeCodex, req.params.id);
  if (!node) {
    return jsonError(res, 404, 'NODE_NOT_FOUND', `Codex node '${req.params.id}' not found`);
  }
  const edgesFrom = getEdgesFrom(supremeCodex, req.params.id);
  const edgesTo = getEdgesTo(supremeCodex, req.params.id);
  return res.json({ node, edgesFrom, edgesTo });
});

router.get('/codex/domain/:domain', (req: Request, res: Response) => {
  const nodes = queryCodex(supremeCodex, req.params.domain);
  return res.json({ domain: req.params.domain, count: nodes.length, nodes });
});

router.get('/codex/neighbors/:id', (req: Request, res: Response) => {
  const node = getCodexNode(supremeCodex, req.params.id);
  if (!node) {
    return jsonError(res, 404, 'NODE_NOT_FOUND', `Codex node '${req.params.id}' not found`);
  }
  const neighbors = getNeighbors(supremeCodex, req.params.id);
  return res.json({ nodeId: req.params.id, neighbors });
});

router.get('/codex/traverse/:start', (req: Request, res: Response) => {
  const { relation, depth } = req.query;
  const maxDepth = depth ? Math.min(parseInt(depth as string, 10), 10) : 3;
  const path = traverseGraph(
    supremeCodex,
    req.params.start,
    relation as string | undefined,
    maxDepth,
  );
  return res.json({ start: req.params.start, relation: relation ?? null, depth: maxDepth, path });
});

// ---------------------------------------------------------------------------
// Lutar Formula Family (v1-v5)
// ---------------------------------------------------------------------------
const LutarV4Schema = z.object({
  E: z.number().finite(),
  M: z.number().finite(),
  I: z.number().finite(),
  T: z.number().finite(),
  R: z.number().finite().default(0),
  Chi: z.number().finite().default(0),
  Psi: z.number().finite().default(0),
  W: z.number().int().default(1),
  Phi_IIT: z.number().min(0).default(0),
  N_Noether: z.number().int().min(0).default(6),
  seked: z.number().finite().default(1.0),
});

const LutarV5Schema = LutarV4Schema.extend({
  theta_M: z.number().finite().default(1),
  theta_IC: z.number().finite().default(1),
  theta_V: z.number().finite().default(1),
  theta_D: z.number().finite().default(1),
  theta_GT: z.number().finite().default(1),
});

router.post('/lutar/v1', (req: Request, res: Response) => {
  const schema = z.object({
    E: z.number().finite(),
    M: z.number().finite(),
    I: z.number().finite(),
    T: z.number().finite(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return jsonError(res, 400, 'INVALID_INPUT', parsed.error.message);
  return res.json(lutarV1(parsed.data));
});

router.post('/lutar/v2', (req: Request, res: Response) => {
  const schema = z.object({
    E: z.number().finite(),
    M: z.number().finite(),
    I: z.number().finite(),
    T: z.number().finite(),
    R: z.number().finite(),
    Chi: z.number().finite(),
    Psi: z.number().finite(),
    Phi: z.number().int(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return jsonError(res, 400, 'INVALID_INPUT', parsed.error.message);
  try {
    return res.json(lutarV2(parsed.data));
  } catch (e) {
    return jsonError(res, 400, 'VALIDATION_ERROR', (e as Error).message);
  }
});

router.post('/lutar/v3', (req: Request, res: Response) => {
  const schema = z.object({
    E: z.number().finite(),
    M: z.number().finite(),
    I: z.number().finite(),
    T: z.number().finite(),
    R: z.number().finite(),
    Chi: z.number().finite(),
    Psi: z.number().finite(),
    Phi: z.number().int(),
    seked: z.number().finite().default(1.0),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return jsonError(res, 400, 'INVALID_INPUT', parsed.error.message);
  try {
    return res.json(lutarV3(parsed.data));
  } catch (e) {
    return jsonError(res, 400, 'VALIDATION_ERROR', (e as Error).message);
  }
});

router.post('/lutar/v4', (req: Request, res: Response) => {
  const parsed = LutarV4Schema.safeParse(req.body);
  if (!parsed.success) return jsonError(res, 400, 'INVALID_INPUT', parsed.error.message);
  try {
    return res.json(lutarV4(parsed.data));
  } catch (e) {
    return jsonError(res, 400, 'VALIDATION_ERROR', (e as Error).message);
  }
});

router.post('/lutar/v5', (req: Request, res: Response) => {
  const parsed = LutarV5Schema.safeParse(req.body);
  if (!parsed.success) return jsonError(res, 400, 'INVALID_INPUT', parsed.error.message);
  try {
    return res.json(lutarV5(parsed.data));
  } catch (e) {
    return jsonError(res, 400, 'VALIDATION_ERROR', (e as Error).message);
  }
});

const LutarV6Schema = LutarV5Schema.extend({
  aeon_n: z.number().int().min(0),
  Omega_n: z.number().positive(),
  twistor_Z: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  bekenstein_area_m2: z.number().positive(),
  enforce_bekenstein: z.boolean().default(true),
});

router.post('/lutar/v6', (req: Request, res: Response) => {
  const parsed = LutarV6Schema.safeParse(req.body);
  if (!parsed.success) return jsonError(res, 400, 'INVALID_INPUT', parsed.error.message);
  try {
    return res.json(lutarV6(parsed.data));
  } catch (e) {
    return jsonError(res, 400, 'VALIDATION_ERROR', (e as Error).message);
  }
});

const LutarOmegaSchema = z.object({
  L_values: z.tuple([z.number(), z.number(), z.number(), z.number(), z.number(), z.number()]),
  weights: z.tuple([z.number().min(0), z.number().min(0), z.number().min(0), z.number().min(0), z.number().min(0), z.number().min(0)]).optional(),
});

router.post('/lutar/omega', (req: Request, res: Response) => {
  const parsed = LutarOmegaSchema.safeParse(req.body);
  if (!parsed.success) return jsonError(res, 400, 'INVALID_INPUT', parsed.error.message);
  try {
    return res.json(lutarOmega(parsed.data));
  } catch (e) {
    return jsonError(res, 400, 'VALIDATION_ERROR', (e as Error).message);
  }
});

const LutarV7Schema = LutarV6Schema.extend({
  omegaWeights: z.tuple([z.number().min(0), z.number().min(0), z.number().min(0), z.number().min(0), z.number().min(0), z.number().min(0)]).optional(),
  huftCoupling: z.number().positive().default(1.0),
});

router.post('/lutar/v7', (req: Request, res: Response) => {
  const parsed = LutarV7Schema.safeParse(req.body);
  if (!parsed.success) return jsonError(res, 400, 'INVALID_INPUT', parsed.error.message);
  try {
    return res.json(lutarV7(parsed.data));
  } catch (e) {
    return jsonError(res, 400, 'VALIDATION_ERROR', (e as Error).message);
  }
});

router.post('/lutar/evaluate-all', (req: Request, res: Response) => {
  const parsed = LutarV6Schema.safeParse(req.body);
  if (!parsed.success) return jsonError(res, 400, 'INVALID_INPUT', parsed.error.message);
  try {
    const all = evaluateAll(parsed.data);
    const omega = lutarOmega({ L_values: all.values });
    const aw = adaptiveWeights(0.1);
    const omegaAdaptive = lutarOmega({ L_values: all.values, weights: aw });
    return res.json({
      ...all,
      omega: omega.value,
      omegaAdaptive: omegaAdaptive.value,
      adaptiveWeights: aw,
      author: "Stephen Lutar / SZL Consulting Ltd",
    });
  } catch (e) {
    return jsonError(res, 400, 'VALIDATION_ERROR', (e as Error).message);
  }
});

router.get('/lutar/adaptive-weights', (req: Request, res: Response) => {
  const H = parseFloat(req.query.H as string);
  if (isNaN(H)) return jsonError(res, 400, 'INVALID_INPUT', 'H (horizon entropy) must be a number');
  const weights = adaptiveWeights(H);
  return res.json({
    H,
    weights,
    formula: "w_k = exp((k+1)*H) / Z, Z = sum exp((k+1)*H)",
    sumCheck: weights.reduce((a, b) => a + b, 0),
  });
});

router.get('/lutar/noether-check', (req: Request, res: Response) => {
  const dL_dt = parseFloat(req.query.dL_dt as string);
  if (isNaN(dL_dt)) return jsonError(res, 400, 'INVALID_INPUT', 'dL_dt must be a number');
  return res.json({
    dL_dt,
    closureSatisfied: noetherClosureCheck(dL_dt),
    theorem: "By Noether's theorem: continuous symmetry => conserved current => dL/dt = 0",
  });
});

// ---------------------------------------------------------------------------
// Prisca Helpers
// ---------------------------------------------------------------------------
router.get('/prisca/constants', (_req: Request, res: Response) => {
  return res.json({
    physical: PHYSICAL_CONSTANTS,
    noetherPairs: NOETHER_CANONICAL_PAIRS,
    newtonFormulas: NEWTON_FORMULAS_EXPANDED,
    publications: NEWTON_PUBLICATIONS,
    temporalIndex: TEMPORAL_INDEX,
  });
});

router.get('/prisca/vedic-sqrt2', (_req: Request, res: Response) => {
  const computed = vedicSqrt2();
  return res.json({
    value: computed,
    formula: "1 + 1/3 + 1/(3*4) - 1/(3*4*34)",
    source: "Baudhayana Sulba Sutra (~800 BCE)",
    modernSqrt2: Math.SQRT2,
    error: Math.abs(computed - Math.SQRT2),
  });
});

router.get('/prisca/maya-calendar-round', (_req: Request, res: Response) => {
  return res.json({
    calendarRound: mayaCalendarRound(),
    formula: "LCM(260, 365) = 18980 days = 52 Haab = 73 Tzolkin",
    tzolkin: 260,
    haab: 365,
    source: "Maya calendrical mathematics",
  });
});

router.get('/prisca/i-ching', (_req: Request, res: Response) => {
  const qian = iChingIndex([1, 1, 1, 1, 1, 1]);
  const kun = iChingIndex([0, 0, 0, 0, 0, 0]);
  return res.json({
    totalHexagrams: 64,
    qianIndex: qian,
    kunIndex: kun,
    formula: "h = sum(yao_i * 2^i), i in 0..5",
    e8Convergence: "64 hexagrams = 64 fermion generators per E8 triality block",
    source: "I Ching / Shao Yong arrangement (1011-1077 CE)",
  });
});

router.get('/prisca/rhind-circle', (req: Request, res: Response) => {
  const d = parseFloat(req.query.d as string) || 10;
  return res.json({
    diameter: d,
    area: rhindCircleArea(d),
    formula: "A = ((8/9) * d)^2",
    piApprox: 256 / 81,
    source: "Rhind Papyrus Problem 50 (~1650 BCE)",
  });
});

router.get('/prisca/new-jerusalem', (_req: Request, res: Response) => {
  return res.json({
    edgeStadia: 12000,
    edgeKm: 2220,
    volumeKm3: newJerusalemVolumeKm3(),
    wallCubits: 144,
    formula: "12000 stadia * 185m/stadion = 2220 km per edge",
    source: "Revelation 21:16",
  });
});

router.get('/prisca/twistor-project', (req: Request, res: Response) => {
  const z0 = parseFloat(req.query.z0 as string) || 1;
  const z1 = parseFloat(req.query.z1 as string) || 0;
  const z2 = parseFloat(req.query.z2 as string) || 1;
  const z3 = parseFloat(req.query.z3 as string) || 0;
  const spacetime = twistorProject([z0, z1, z2, z3]);
  return res.json({
    input: [z0, z1, z2, z3],
    spacetime: { t: spacetime[0], x: spacetime[1], y: spacetime[2], z: spacetime[3] },
    formula: "Pi: T=C^4 -> R^{3,1}; (t,x,y,z) = (z0+z2, z0-z2, z1+z3, z1-z3)",
    source: "Penrose twistor theory (1967+)",
  });
});

router.get('/prisca/bekenstein-bound', (req: Request, res: Response) => {
  const area = parseFloat(req.query.area_m2 as string) || 1.0;
  const bound = bekensteinBound(area);
  return res.json({
    area_m2: area,
    bound_nats: bound,
    l_planck_m: L_PLANCK,
    a_planck_m2: A_PLANCK,
    formula: "S_max = A / (4 * l_P^2)",
    source: "Bekenstein (1973), 't Hooft (1993)",
  });
});

router.get('/prisca/conformal-rescale', (req: Request, res: Response) => {
  const L = parseFloat(req.query.L as string) || 1.0;
  const Omega = parseFloat(req.query.Omega as string) || 0.5;
  const rescaled = conformalRescale(L, Omega);
  const next_aeon = aeonRecurrence(rescaled, Omega);
  return res.json({
    L_input: L,
    Omega: Omega,
    L_rescaled: rescaled,
    next_aeon: next_aeon,
    formula: "L6^(n) = Omega^2 * L5; L6^(n+1) = Omega^2 * L6^(n)",
    source: "Penrose CCC (2010) + Lutar v6",
  });
});

// ---------------------------------------------------------------------------
// Sovereign Engine v19 — 25 SZL Original Innovations (ALLOY-EVOLVED)
// ---------------------------------------------------------------------------

router.post('/sovereign/chat', (req: Request, res: Response) => {
  const { prompt, session, deadline, reason, simulate } = req.body ?? {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt required' });
  }
  const result = sovereign.chat({
    prompt,
    session: session ?? 'default',
    deadline: typeof deadline === 'number' ? deadline : 2026,
    reason: !!reason,
    simulate: !!simulate,
  });
  return res.json(result);
});

router.post('/sovereign/route', (req: Request, res: Response) => {
  const { query } = req.body ?? {};
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query required' });
  }
  return res.json(lutarSimplexRoute(query));
});

router.post('/sovereign/retrieve', (req: Request, res: Response) => {
  const { query, k } = req.body ?? {};
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query required' });
  }
  return res.json(voteRAG(query, typeof k === 'number' ? k : 5));
});

router.post('/sovereign/guard', (req: Request, res: Response) => {
  const { intent, action } = req.body ?? {};
  if (!intent || !action) {
    return res.status(400).json({ error: 'intent and action required' });
  }
  return res.json(hermeticGuard(String(intent), String(action)));
});

router.post('/sovereign/eval', (req: Request, res: Response) => {
  const { candidate, reference } = req.body ?? {};
  if (!candidate) {
    return res.status(400).json({ error: 'candidate required' });
  }
  return res.json(noetherJudge(String(candidate), reference ? String(reference) : undefined));
});

router.post('/sovereign/fuse', (req: Request, res: Response) => {
  const { inputs, H } = req.body ?? {};
  if (!Array.isArray(inputs) || inputs.length === 0) {
    return res.status(400).json({ error: 'inputs array required' });
  }
  const typed = inputs.map((inp: { modality?: string; content?: string } | [string, string]) => {
    if (Array.isArray(inp)) return { modality: inp[0] as Modality, content: inp[1] };
    return { modality: (inp.modality || 'text') as Modality, content: inp.content || '' };
  });
  const result = chariotFuse(typed, typeof H === 'number' ? H : 0.3);
  if (!result) return res.status(400).json({ error: 'empty inputs' });
  return res.json(result);
});

router.get('/sovereign/mcp/tools', (_req: Request, res: Response) => {
  return res.json(sovereign.getMCP().listTools());
});

router.post('/sovereign/mcp/invoke', (req: Request, res: Response) => {
  const { name, args } = req.body ?? {};
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'name required' });
  }
  return res.json(sovereign.getMCP().invoke(name, ...(Array.isArray(args) ? args : [])));
});

router.post('/sovereign/fpp/submit', (req: Request, res: Response) => {
  const { lineage, gradient } = req.body ?? {};
  if (!lineage || !Array.isArray(gradient)) {
    return res.status(400).json({ error: 'lineage and gradient[] required' });
  }
  try {
    sovereign.getFPP().submit(lineage as PriscaLineage, gradient);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(400).json({ error: (e as Error).message });
  }
});

router.post('/sovereign/fpp/aggregate', (req: Request, res: Response) => {
  const { H } = req.body ?? {};
  return res.json(sovereign.getFPP().aggregate(typeof H === 'number' ? H : 0.3));
});

router.get('/sovereign/otel/report', (_req: Request, res: Response) => {
  return res.json(sovereign.getOTEL().clusterReport());
});

router.get('/sovereign/memory', (_req: Request, res: Response) => {
  return res.json(sovereign.getKTM().stats());
});

router.get('/sovereign/innovations', (_req: Request, res: Response) => {
  return res.json({
    count: INNOVATION_MANIFEST.length,
    innovations: INNOVATION_MANIFEST,
    author: 'Stephen Lutar / SZL Consulting Ltd',
  });
});

router.get('/sovereign/e8-slot', (req: Request, res: Response) => {
  const q = (req.query.q as string) || 'test';
  return res.json(e8TrialitySlot(q));
});

router.get('/sovereign/tot-priority', (req: Request, res: Response) => {
  const deadline = parseInt(req.query.deadline as string) || 2026;
  return res.json({ deadline, priority: totPriority(deadline) });
});

router.post('/sovereign/rahab-sample', (req: Request, res: Response) => {
  const { logits, temperature, bound } = req.body ?? {};
  if (!Array.isArray(logits) || logits.length === 0) {
    return res.status(400).json({ error: 'logits[] required' });
  }
  const idx = rahabSample(logits, temperature ?? 1.0, bound ?? 2.0);
  return res.json({ index: idx, total: logits.length });
});

// ---------------------------------------------------------------------------
// Innovations 15-25 (v19 ALLOY-EVOLVED)
// ---------------------------------------------------------------------------

router.post('/sovereign/reason', (req: Request, res: Response) => {
  const { prompt, branches, keep } = req.body ?? {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt required' });
  }
  return res.json(dogonReason(prompt, branches ?? 50, keep ?? 5));
});

router.post('/sovereign/generate', (req: Request, res: Response) => {
  const { topic, n, seked } = req.body ?? {};
  if (!topic || typeof topic !== 'string') {
    return res.status(400).json({ error: 'topic required' });
  }
  return res.json(sekedGenerate(topic, n ?? 5, seked ?? 5.25));
});

router.get('/sovereign/slm/adapters', (_req: Request, res: Response) => {
  return res.json({ total: 80, domains: GobekliEdgeSLM.DOMAINS });
});

router.post('/sovereign/slm/select', (req: Request, res: Response) => {
  const { query } = req.body ?? {};
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query required' });
  }
  return res.json(sovereign.getSLM().select(query));
});

router.post('/sovereign/selfplay', (req: Request, res: Response) => {
  const { task, n } = req.body ?? {};
  if (!task || typeof task !== 'string') {
    return res.status(400).json({ error: 'task required' });
  }
  return res.json(sovereign.getNSP().reinforce(task, n ?? 5));
});

router.post('/sovereign/qaoa', (req: Request, res: Response) => {
  const { L_values, init_H } = req.body ?? {};
  if (!Array.isArray(L_values) || L_values.length !== 6) {
    return res.status(400).json({ error: 'L_values must be array of 6 numbers' });
  }
  return res.json(sovereign.getHQO().optimize(L_values, init_H ?? 0.3));
});

router.post('/sovereign/world', (req: Request, res: Response) => {
  const { query, steps } = req.body ?? {};
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query required' });
  }
  return res.json(pwmPredict(query, steps ?? 3));
});

router.get('/sovereign/pwm/solids', (_req: Request, res: Response) => {
  return res.json(PLATONIC_SOLIDS);
});

router.get('/sovereign/scl/budget', (req: Request, res: Response) => {
  const H = parseFloat(req.query.H as string) || 0.3;
  return res.json(sovereign.getSCL().forgettingBudget(H));
});

router.post('/sovereign/scl/update', (req: Request, res: Response) => {
  const { sefira, grad_norm } = req.body ?? {};
  if (!sefira || typeof sefira !== 'string') {
    return res.status(400).json({ error: 'sefira required' });
  }
  return res.json(sovereign.getSCL().update(sefira, grad_norm ?? 0.0));
});

router.post('/sovereign/scl/ewc', (req: Request, res: Response) => {
  const { deltas } = req.body ?? {};
  if (!deltas || typeof deltas !== 'object') {
    return res.status(400).json({ error: 'deltas object required' });
  }
  return res.json(sovereign.getSCL().computeEWCPenalty(deltas));
});

router.get('/sovereign/scl/sefirot', (_req: Request, res: Response) => {
  return res.json(SEFIROT_TIERS);
});

router.post('/sovereign/cls', (req: Request, res: Response) => {
  const { compute, H, inference, L_values } = req.body ?? {};
  return res.json(ChinchillaLutarScaling.recommend(
    compute ?? 1e22,
    H ?? 0.3,
    inference ?? 1e9,
    L_values,
  ));
});

router.post('/sovereign/gpd', (req: Request, res: Response) => {
  const { step, grad_norm, weight_entropy, synergy } = req.body ?? {};
  return res.json(sovereign.getGPD().observe(
    step ?? 0,
    grad_norm ?? 1.0,
    weight_entropy ?? 0.5,
    synergy,
  ));
});

router.get('/sovereign/gpd/predict', (_req: Request, res: Response) => {
  return res.json({ predictedSteps: sovereign.getGPD().predictTransition() });
});

router.post('/sovereign/felai', (req: Request, res: Response) => {
  const { q, p, L_values } = req.body ?? {};
  if (!Array.isArray(q) || !Array.isArray(p)) {
    return res.status(400).json({ error: 'q[] and p[] distributions required' });
  }
  return res.json(sovereign.getFELAI().freeEnergyLutar(q, p, L_values));
});

router.post('/sovereign/felai/policy', (req: Request, res: Response) => {
  const { policies, q, p, L_values, rollout } = req.body ?? {};
  if (!Array.isArray(policies) || !Array.isArray(q) || !Array.isArray(p)) {
    return res.status(400).json({ error: 'policies[], q[], p[] required' });
  }
  return res.json(sovereign.getFELAI().selectPolicy(policies, q, p, L_values, rollout ?? 10));
});

router.post('/sovereign/icrc/compute', (req: Request, res: Response) => {
  const { ceques, huacas, suyuCounts, alchemyWeights, H } = req.body ?? {};
  return res.json(icrcComputeAll({ ceques, huacas, suyuCounts, alchemyWeights, H }));
});

router.get('/sovereign/icrc/constants', (_req: Request, res: Response) => {
  return res.json({
    ceques: INCA_CEQUES,
    huacas: INCA_HUACAS,
    suyus: 4,
    suyuNames: [...INCA_SUYU_NAMES],
    suyuCequeCounts: [...INCA_SUYU_CEQUE_COUNTS],
    weekDays: 8,
    siderealLunarDays: 27.32166,
    tropicalYearDays: 365.2422,
    solarCuscoLat: -13.5183,
    materials: INCA_ALCHEMY_MATERIALS,
  });
});

router.post('/sovereign/sae/run', (req: Request, res: Response) => {
  const { x, inputDim, l1Lambda } = req.body ?? {};
  const dim = inputDim ?? 8;
  const tsa = new TawaSparseAutoencoder(dim);
  const input = Array.isArray(x) ? x.map(Number) : new Array(dim).fill(0.5);
  const h = tsa.encode(input, l1Lambda ?? 0.01);
  return res.json({
    sparseCodeNonzero: h.filter((v: number) => v > 0).length,
    totalFeatures: tsa.hidden,
    activeFeatures: tsa.interpret(h),
    reconstructionError: Math.round(tsa.reconstructionError(input) * 1e6) / 1e6,
  });
});

router.get('/sovereign/sae/constants', (_req: Request, res: Response) => {
  return res.json({
    features: TawaSparseAutoencoder.FEATURES,
    expansion: TawaSparseAutoencoder.EXPANSION,
    hidden: TawaSparseAutoencoder.FEATURES * TawaSparseAutoencoder.EXPANSION,
    categories: RED_TEAM_ATTACK_CATEGORIES,
  });
});

router.post('/sovereign/redteam/campaign', (req: Request, res: Response) => {
  const { target, n, defenderMode } = req.body ?? {};
  const rth = new RedTeamHarness();
  const mode = defenderMode ?? "refuse";
  const defender = mode === "refuse"
    ? (_p: string) => "I refuse this request"
    : (_p: string) => "ok sure here you go";
  return res.json(rth.runCampaign(target ?? "alloy", defender, n ?? 12));
});

router.post('/sovereign/mamba/sequence', (req: Request, res: Response) => {
  const { tokens, stateSize } = req.body ?? {};
  const ssm = new CondorMambaSSM(stateSize ?? 8);
  const toks: number[] = Array.isArray(tokens) ? tokens.map(Number) : Array.from({ length: 10 }, (_, i) => i * 0.1);
  return res.json(ssm.processSequence(toks));
});

router.post('/sovereign/epr/chsh', (req: Request, res: Response) => {
  const { a, aPrime, b, bPrime, data } = req.body ?? {};
  const angles = (a != null)
    ? { a, aPrime, b, bPrime }
    : EPRBellValidator.maxViolationAngles();
  return res.json(EPRBellValidator.chsh(
    angles.a, angles.aPrime, angles.b, angles.bPrime, data ?? [],
  ));
});

router.get('/sovereign/epr/singlet', (_req: Request, res: Response) => {
  return res.json({
    state: EPRBellValidator.singletState(),
    classicalBound: EPRBellValidator.CLASSICAL_BOUND,
    tsirelsonBound: EPRBellValidator.TSIRELSON_BOUND,
    maxViolationAngles: EPRBellValidator.maxViolationAngles(),
  });
});

router.post('/sovereign/hopfield/store', (req: Request, res: Response) => {
  const { id, content, dim } = req.body ?? {};
  if (!id || !content) return res.status(400).json({ error: 'id and content required' });
  const haam = new HopfieldAmaruMemory(dim ?? 8);
  const pat = haam.store(id, content);
  return res.json({ stored: pat.id, cequeSlot: pat.cequeSlot, dim: haam.dim });
});

router.post('/sovereign/hopfield/retrieve', (req: Request, res: Response) => {
  const { patterns, query, dim } = req.body ?? {};
  if (!Array.isArray(patterns) || !query) {
    return res.status(400).json({ error: 'patterns[] and query required' });
  }
  const haam = new HopfieldAmaruMemory(dim ?? 8);
  for (const p of patterns) haam.store(p.id ?? p, p.content ?? p);
  return res.json(haam.retrieve(query));
});

router.post('/sovereign/predictive-coding/infer', (req: Request, res: Response) => {
  const { observation, layers, dim, iterations, lr } = req.body ?? {};
  const pcem = new PredictiveCodingEngine(layers ?? 3, dim ?? 8);
  const obs = Array.isArray(observation) ? observation.map(Number) : new Array(dim ?? 8).fill(0.5);
  return res.json(pcem.infer(obs, iterations ?? 10, lr ?? 0.1));
});

router.post('/sovereign/sacred-geometry/coherence', (req: Request, res: Response) => {
  const { values } = req.body ?? {};
  if (!Array.isArray(values)) return res.status(400).json({ error: 'values[] required' });
  return res.json(SacredGeometryEngine.coherence(values));
});

router.get('/sovereign/sacred-geometry/constants', (_req: Request, res: Response) => {
  return res.json({
    phi: SacredGeometryEngine.PHI,
    vesicaPiscis: SacredGeometryEngine.VESICA_PISCIS,
    flowerCircles: SacredGeometryEngine.FLOWER_CIRCLES,
    seedOfLife: SacredGeometryEngine.SEED_OF_LIFE,
    metatronVertices: SacredGeometryEngine.METATRON_VERTICES,
    metatronEdges: SacredGeometryEngine.metatronsCubeEdges(),
    packingDensity: SacredGeometryEngine.flowerOfLifePackingDensity(),
    fibonacci20: SacredGeometryEngine.fibonacci(20),
    platonicDuals: SacredGeometryEngine.platonicDualMap(),
  });
});

router.post('/sovereign/cognitive-map/navigate', (req: Request, res: Response) => {
  const { nodes, edges, start, goal } = req.body ?? {};
  if (!Array.isArray(nodes) || !Array.isArray(edges) || !start || !goal) {
    return res.status(400).json({ error: 'nodes[], edges[], start, goal required' });
  }
  const cmn = new CognitiveMapNavigator();
  for (const n of nodes) cmn.addNode(n.id, n.x ?? 0, n.y ?? 0, n.cellType ?? 'place');
  for (const e of edges) cmn.connect(e.from, e.to);
  return res.json(cmn.navigate(start, goal));
});

router.post('/sovereign/bifurcation/observe', (req: Request, res: Response) => {
  const { observations } = req.body ?? {};
  if (!Array.isArray(observations)) {
    return res.status(400).json({ error: 'observations[] required' });
  }
  const dsbd = new DynamicalBifurcationDetector();
  const results = observations.map((o: any) =>
    dsbd.observe(o.step ?? 0, o.param ?? 0, o.derivative ?? 0, o.oscillation ?? 0),
  );
  return res.json({
    observations: results,
    upcomingBifurcation: dsbd.detectUpcoming(),
  });
});

router.get('/health', (_req: Request, res: Response) => {
  const pulse = orchestrator.currentPulse();
  return res.json({
    ok: true,
    sentraPrime: bigintToString(sentraAdapter.SHIFT_ADD_PRIME),
    eventsAnchored: sentraAnchor.snapshot().eventCount,
    lambdaEngineActive: true,
    convergencePulse: pulse.alertLevel,
    asOf: new Date().toISOString(),
  });
});

export default router;
