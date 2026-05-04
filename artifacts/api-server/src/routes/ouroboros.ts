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
