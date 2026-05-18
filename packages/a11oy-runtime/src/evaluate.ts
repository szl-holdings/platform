/**
 * a11oy-runtime — `evaluate()` facade (task #5173).
 *
 * One entry point. Pass `{ action, vertical, context }`, get back a
 * structured verdict `{ allow, deny_reason, escalate_to, receipt,
 * lambda_score }`. Wraps three things behind one call:
 *
 *   1. Policy lookup    — `policy-registry.ts` is the source of truth.
 *                         Verticals × action kinds get a default policy
 *                         and a per-vertical override list.
 *   2. Λ-scoring        — delegates to `@szl-holdings/lambda-math`
 *                         `computeLambda` over the canonical six-axis
 *                         component vector. NO local re-implementation.
 *   3. Provenance       — emits a receipt to yawar-bus topic
 *                         `a11oy.proof`. Receipt envelope is the same
 *                         shape persisted by the `yawar_events` table.
 *
 * Tests live in `evaluate.test.ts`; the matrix covers
 *   allow / deny / escalate × 10 verticals × 3 action kinds.
 */
import { computeLambda, type LambdaComponent } from '@szl-holdings/lambda-math';
import {
  type EvaluatePolicy,
  type Vertical,
  type ActionKind,
  resolvePolicy,
} from './policy-registry.js';

export type Verdict = 'allow' | 'deny' | 'escalate';

export interface EvaluateInput {
  action: string;
  vertical: Vertical;
  /**
   * Free-form context. Specific keys are read by the scoring layer:
   *   - `signals.cleanliness`, `.horizon`, `.resonance`, `.frustum`,
   *     `.moralGrounding`, `.measurabilityHonesty` (numbers in [0,1])
   *   - `actor`, `requestId` (passthrough to the receipt)
   */
  context?: Record<string, unknown>;
}

export interface EvaluateReceipt {
  receiptId: string;
  topic: 'a11oy.proof';
  ts: string;
  action: string;
  vertical: Vertical;
  verdict: Verdict;
  lambda_score: number;
  policy: { id: string; allowThreshold: number; escalateThreshold: number };
  context?: Record<string, unknown>;
}

export interface EvaluateResult {
  allow: boolean;
  deny_reason: string | null;
  escalate_to: string | null;
  lambda_score: number;
  receipt: EvaluateReceipt;
}

/**
 * Publisher hook. The api-server wires this to `publishYawarEvent` from
 * `routes/yawar.ts`; tests and isolated callers can leave it as the
 * default in-memory no-op (the returned receipt is still well-formed).
 */
export type YawarPublisher = (event: EvaluateReceipt) => Promise<unknown> | unknown;

let publisher: YawarPublisher = () => undefined;

export function setYawarPublisher(p: YawarPublisher): void {
  publisher = p;
}

function readSignal(ctx: Record<string, unknown> | undefined, key: string): number {
  const signals = (ctx?.signals as Record<string, unknown> | undefined) ?? {};
  const raw = signals[key];
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.max(0, Math.min(1, raw));
  }
  // Sensible neutral prior so missing telemetry doesn't auto-deny; the
  // policy thresholds still gate the verdict.
  return 0.85;
}

/**
 * Six canonical Λ components. Weights are Egyptian-fraction strings so
 * the operator stays inspectable: weights sum to 1 by construction
 * (1/6 × 6 = 1).
 */
function buildComponents(ctx: Record<string, unknown> | undefined): LambdaComponent[] {
  return [
    { name: 'cleanliness', weight: '1/6', score: readSignal(ctx, 'cleanliness') },
    { name: 'horizon', weight: '1/6', score: readSignal(ctx, 'horizon') },
    { name: 'resonance', weight: '1/6', score: readSignal(ctx, 'resonance') },
    { name: 'frustum', weight: '1/6', score: readSignal(ctx, 'frustum') },
    { name: 'moralGrounding', weight: '1/6', score: readSignal(ctx, 'moralGrounding') },
    {
      name: 'measurabilityHonesty',
      weight: '1/6',
      score: readSignal(ctx, 'measurabilityHonesty'),
    },
  ];
}

function uuid(): string {
  // Local UUIDv4 — avoid pulling node:crypto into the package surface so
  // the runtime stays edge-deployable.
  const b = new Uint8Array(16);
  for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export async function evaluate(input: EvaluateInput): Promise<EvaluateResult> {
  if (!input || typeof input.action !== 'string' || !input.action) {
    throw new Error('a11oy-runtime.evaluate: `action` is required');
  }
  if (!input.vertical) {
    throw new Error('a11oy-runtime.evaluate: `vertical` is required');
  }
  const policy: EvaluatePolicy = resolvePolicy(input.vertical, input.action);
  const components = buildComponents(input.context);
  const { lambda } = computeLambda({ components });

  let verdict: Verdict;
  let denyReason: string | null = null;
  let escalateTo: string | null = null;

  if (policy.forceDeny) {
    verdict = 'deny';
    denyReason = policy.denyReason ?? `action "${input.action}" is force-denied in ${input.vertical}`;
  } else if (lambda < policy.escalateThreshold) {
    verdict = 'deny';
    denyReason =
      policy.denyReason ??
      `Λ=${lambda.toFixed(4)} below escalate threshold ${policy.escalateThreshold} for ${policy.id}`;
  } else if (lambda < policy.allowThreshold) {
    verdict = 'escalate';
    escalateTo = policy.escalateTo;
  } else {
    verdict = 'allow';
  }

  const receipt: EvaluateReceipt = {
    receiptId: uuid(),
    topic: 'a11oy.proof',
    ts: new Date().toISOString(),
    action: input.action,
    vertical: input.vertical,
    verdict,
    lambda_score: lambda,
    policy: {
      id: policy.id,
      allowThreshold: policy.allowThreshold,
      escalateThreshold: policy.escalateThreshold,
    },
    ...(input.context ? { context: input.context } : {}),
  };

  // Fire-and-await the publish so a bus failure surfaces immediately
  // (fails-loud). If callers want best-effort, they can wrap the
  // publisher themselves.
  await publisher(receipt);

  return {
    allow: verdict === 'allow',
    deny_reason: denyReason,
    escalate_to: escalateTo,
    lambda_score: lambda,
    receipt,
  };
}
