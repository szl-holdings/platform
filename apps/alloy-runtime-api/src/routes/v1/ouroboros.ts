/**
 * Ouroboros API — apps/alloy-runtime-api
 *
 * HTTP surface for the @workspace/ouroboros-integrations adapters that
 * lift the Egyptian-mathematics primitives (Frustum / Seked /
 * Unit-Fractions / Doubling) into the three deployable products:
 *
 *   A11oy  — agent-fleet handoff reconciliation (Frustum, MMP-14)
 *   Amaru  — fleet coordination + thresholds (Seked + Unit-Fractions, RMP)
 *   Sentra — HSM-anchored governance accumulator (Doubling, RMP)
 *
 * Routes (all under /v1/ouroboros, mounted with apiKeyGuard):
 *
 *   POST /v1/ouroboros/a11oy/reconcile-handoff
 *   POST /v1/ouroboros/a11oy/audit-fleet
 *
 *   POST /v1/ouroboros/amaru/observe-metric
 *   POST /v1/ouroboros/amaru/audit-threshold
 *
 *   POST /v1/ouroboros/sentra/anchor-event
 *   POST /v1/ouroboros/sentra/anchor-batch
 *   POST /v1/ouroboros/sentra/verify-trace
 *   GET  /v1/ouroboros/sentra/anchor-state
 *
 * All input is validated with Zod. The adapters are pure functions; the
 * only mutable state is the in-memory Amaru monitor + Sentra accumulator
 * (process-local, scoped per server instance — replace with HSM/KMS-backed
 * accumulator in production).
 */

import { a11oy, amaru, sentra } from '@workspace/ouroboros-integrations';
import { type IRouter, type Request, type RequestHandler, type Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

const router: IRouter = Router();

// Rate-limit every Ouroboros route (IP-scoped, defence-in-depth on top of apiKeyGuard)
// so the CPU/allocation-heavy adapters can't be driven into resource exhaustion.
const ouroborosRateLimit = rateLimit({
  windowMs: Number(process.env.OUROBOROS_RATE_LIMIT_WINDOW_MS ?? 60_000),
  limit: Number(process.env.OUROBOROS_RATE_LIMIT_MAX ?? 120),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'RATE_LIMITED', detail: 'Too many requests; retry after the window resets.' },
});
router.use(ouroborosRateLimit as RequestHandler);

// ---------------------------------------------------------------------------
// A11oy — three-witness handoff reconciliation (MMP-14 frustum)
// ---------------------------------------------------------------------------

const HandoffSchema = z.object({
  handoffId: z.string().min(1).max(128),
  fromAgent: z.string().min(1).max(64),
  toAgent: z.string().min(1).max(64),
  observerAgent: z.string().min(1).max(64),
  fromLeaves: z.array(z.string().min(1).max(128)).min(1).max(256),
  toLeaves: z.array(z.string().min(1).max(128)).min(1).max(256),
  observerLeaves: z.array(z.string().min(1).max(128)).min(1).max(256),
  timestamp: z.number().int().nonnegative().optional(),
});

router.post('/a11oy/reconcile-handoff', (req: Request, res: Response): void => {
  const parsed = HandoffSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'INVALID_HANDOFF', issues: parsed.error.issues });
    return;
  }
  const event = { ...parsed.data, timestamp: parsed.data.timestamp ?? Date.now() };
  const verdict = a11oy.reconcileHandoff(event);
  res.status(200).json(verdict);
});

const AuditFleetSchema = z.object({
  handoffs: z.array(HandoffSchema).min(1).max(256),
});

router.post('/a11oy/audit-fleet', (req: Request, res: Response): void => {
  const parsed = AuditFleetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'INVALID_FLEET_AUDIT', issues: parsed.error.issues });
    return;
  }
  const events = parsed.data.handoffs.map((h) => ({
    ...h,
    timestamp: h.timestamp ?? Date.now(),
  }));
  const result = a11oy.auditFleetHandoffs(events);
  res.status(200).json(result);
});

// ---------------------------------------------------------------------------
// Amaru — seked slope monitoring + unit-fraction threshold inspection
// ---------------------------------------------------------------------------

// Process-local fleet monitor: keeps per-metric sliding windows.
// In production this would be replaced by a clustered store.
const amaruMonitor = new amaru.AmaruFleetMonitor(32);

const MetricSampleSchema = z.object({
  metricId: z.string().min(1).max(64),
  horizontal: z.number().positive().finite(),
  vertical: z.number().finite(),
  timestamp: z.number().int().nonnegative().optional(),
});

router.post('/amaru/observe-metric', (req: Request, res: Response): void => {
  const parsed = MetricSampleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'INVALID_SAMPLE', issues: parsed.error.issues });
    return;
  }
  const sample = { ...parsed.data, timestamp: parsed.data.timestamp ?? Date.now() };
  const signal = amaruMonitor.observe(sample);
  res.status(200).json(signal);
});

const MAX_DENOMINATOR = 1_000_000;
const ThresholdSchema = z.object({
  p: z.number().int().positive().max(MAX_DENOMINATOR),
  q: z.number().int().positive().max(MAX_DENOMINATOR),
  maxTerms: z.number().int().min(1).max(8).optional(),
});

router.post('/amaru/audit-threshold', (req: Request, res: Response): void => {
  const parsed = ThresholdSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'INVALID_THRESHOLD', issues: parsed.error.issues });
    return;
  }
  try {
    const audit = amaru.auditThreshold(parsed.data.p, parsed.data.q, parsed.data.maxTerms ?? 4);
    res.status(200).json(audit);
  } catch (err) {
    res.status(400).json({
      error: 'THRESHOLD_AUDIT_FAILED',
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

// ---------------------------------------------------------------------------
// Sentra — HSM-anchored doubling accumulator (Egyptian RMP method)
// ---------------------------------------------------------------------------

// Process-local accumulator scoped per server instance. In production,
// instantiate against an HSM/KMS-backed prime + persistent state.
const sentraAnchor = new sentra.SentraHSMAnchor();

const HEX_256 = /^0x[0-9a-fA-F]{1,64}$/;

const EventSchema = z.object({
  eventId: z.string().min(1).max(128),
  leafHashHex: z.string().regex(HEX_256, 'leafHashHex must be 0x-prefixed hex, ≤256 bits'),
  timestamp: z.number().int().nonnegative().optional(),
});

function parseEvent(e: z.infer<typeof EventSchema>) {
  return {
    eventId: e.eventId,
    leafHash: BigInt(e.leafHashHex),
    timestamp: e.timestamp ?? Date.now(),
  };
}

// Serialize trace bigints → hex strings for safe JSON transit.
// Shape matches @workspace/reconciliation DoublingTrace exactly.
function serializeTrace(trace: {
  product: bigint;
  steps: ReadonlyArray<{ multiplier: bigint; doubled: bigint; selected: boolean }>;
}) {
  return {
    product: '0x' + trace.product.toString(16),
    steps: trace.steps.map((s) => ({
      multiplier: '0x' + s.multiplier.toString(16),
      doubled: '0x' + s.doubled.toString(16),
      selected: s.selected,
    })),
  };
}

function serializeState(state: {
  accumulator: bigint;
  eventCount: number;
  lastUpdate: number;
  prime: bigint;
}) {
  return {
    accumulatorHex: '0x' + state.accumulator.toString(16),
    eventCount: state.eventCount,
    lastUpdate: state.lastUpdate,
    primeHex: '0x' + state.prime.toString(16),
  };
}

router.post('/sentra/anchor-event', (req: Request, res: Response): void => {
  const parsed = EventSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'INVALID_EVENT', issues: parsed.error.issues });
    return;
  }
  const { state, trace } = sentraAnchor.append(parseEvent(parsed.data));
  res.status(200).json({
    state: serializeState(state),
    trace: serializeTrace(trace),
  });
});

const BatchSchema = z.object({
  events: z.array(EventSchema).min(1).max(64),
});

router.post('/sentra/anchor-batch', (req: Request, res: Response): void => {
  const parsed = BatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'INVALID_BATCH', issues: parsed.error.issues });
    return;
  }
  const events = parsed.data.events.map(parseEvent);
  const state = sentraAnchor.appendBatch(events);
  res.status(200).json({ count: events.length, state: serializeState(state) });
});

const VerifyTraceSchema = z.object({
  product: z.string().regex(/^0x[0-9a-fA-F]+$/),
  steps: z
    .array(
      z.object({
        multiplier: z.string().regex(/^0x[0-9a-fA-F]+$/),
        doubled: z.string().regex(/^0x[0-9a-fA-F]+$/),
        selected: z.boolean(),
      }),
    )
    .max(512),
});

// Trace verification accepts attacker-controlled arrays and performs BigInt
// reconstruction plus cryptographic-style arithmetic. Keep a route-local
// limiter in the registration itself so this expensive handler remains
// protected even if the router is mounted elsewhere without its global guard.
export const VERIFY_TRACE_RATE_LIMIT_MAX = 20;

router.post(
  '/sentra/verify-trace',
  rateLimit({
    windowMs: 60_000,
    limit: VERIFY_TRACE_RATE_LIMIT_MAX,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      error: 'RATE_LIMITED',
      detail: 'Too many trace-verification requests; retry after the window resets.',
    },
  }),
  (req: Request, res: Response): void => {
    const parsed = VerifyTraceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'INVALID_TRACE', issues: parsed.error.issues });
      return;
    }
    const trace = {
      product: BigInt(parsed.data.product),
      steps: parsed.data.steps.map((s) => ({
        multiplier: BigInt(s.multiplier),
        doubled: BigInt(s.doubled),
        selected: s.selected,
      })),
    };
    const valid = sentra.verifyHSMTrace(trace);
    res.status(200).json({ valid });
  },
);

router.get('/sentra/anchor-state', (_req: Request, res: Response): void => {
  res.status(200).json(serializeState(sentraAnchor.snapshot()));
});

export default router;
