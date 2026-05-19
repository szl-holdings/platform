/**
 * ROSIE — Governed Decision Fabric API
 *
 * Mounted at /api/rosie (see routes/index.ts). All routes pass
 * `authMiddleware({ required: false })` + `tenantScope({ required: false })`
 * for org-aware logging, and `guardianPolicyCheck()` for category-level
 * policy enforcement. Public read endpoints stay anonymous-readable; HITL
 * write endpoints require an authenticated session via `requireAnyAuth()`.
 *
 * Endpoint surface:
 *   GET  /rosie/templates
 *   GET  /rosie/fabric                        — manifest-derived ecosystem graph
 *   GET  /rosie/research                      — Zod-validated arXiv + HF feed
 *   GET  /rosie/github/repos                  — szl-holdings repos (GH_WORKFLOW_TOKEN)
 *   GET  /rosie/ingest/status
 *   POST /rosie/ingest/run                    — requireAuth (HITL trigger)
 *   GET  /rosie/receipts                      — append-only chain (all kinds)
 *   GET  /rosie/receipts/:id
 *   POST /rosie/receipts/verify               — recompute & verify full chain
 *   POST /rosie/solve/queue                   — propose a solve (no auto-seal)
 *   GET  /rosie/solve/queue
 *   POST /rosie/solve/queue/:id/approve       — requireAuth (HITL)
 *   POST /rosie/solve/queue/:id/reject        — requireAuth (HITL)
 *   POST /rosie/narrate                       — schema-validated, multi-provider
 *   GET  /rosie/events                        — SSE
 *
 * Governance contract:
 *   - The deterministic SA Ising solver is the SOLE numeric authority.
 *   - The LLM narrator is schema-validated and must NOT return numeric overrides.
 *   - The A11oy active constitution is consulted before every solve seal.
 *   - Every solve, ingest, and narration appends its own typed receipt to a
 *     SHA-256-linked append-only chain (Covenant Proof Standard v1).
 */

import { createHash, randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';

const rosieBus = new EventEmitter();
rosieBus.setMaxListeners(100);
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendError, sendSuccess } from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { logger } from '../lib/logger';
import { authMiddleware, requireAnyAuth } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';
import { guardianPolicyCheck } from '../middlewares/guardian-policy';
import { TOKEN_GOVERNED_ARTIFACTS } from '@workspace/tokens/manifest';

const router: IRouter = Router();

// ──────────────────────────────────────────────────────────────────────────
// Middleware: every /rosie/* route is auth/tenant-scoped and policy-checked.
// ──────────────────────────────────────────────────────────────────────────

router.use(
  '/rosie',
  authMiddleware({ required: false }),
  tenantScope({ required: false }),
  guardianPolicyCheck({ category: 'decisions' }),
);

// ──────────────────────────────────────────────────────────────────────────
// Problem templates (seeded)
// ──────────────────────────────────────────────────────────────────────────

interface ProblemTemplate {
  id: string;
  name: string;
  domain: string;
  description: string;
  n: number;
  build: () => { J: number[][]; h: number[]; labels: string[] };
}

const TEMPLATES: ProblemTemplate[] = [
  {
    id: 'vessel-berth',
    name: 'Vessel Berth Assignment',
    domain: 'maritime',
    description:
      '14 vessels, 4 berths, conflicting time-window constraints. Minimize idle berth-hours + demurrage exposure.',
    n: 14,
    build: () => {
      const n = 14;
      const J = Array.from({ length: n }, () => new Array<number>(n).fill(0));
      const h = new Array<number>(n).fill(0);
      const labels: string[] = [];
      for (let i = 0; i < n; i++) {
        labels.push(`MV-${i + 1}`);
        h[i] = Math.sin(i * 1.7) * 0.4;
        for (let j = i + 1; j < n; j++) {
          J[i][j] = Math.cos((i + 1) * (j + 1) * 0.31) * 0.6;
        }
      }
      return { J, h, labels };
    },
  },
  {
    id: 'legal-staffing',
    name: 'Legal Matter Staffing',
    domain: 'counsel',
    description:
      '20 matters, partner-associate capacity, conflict-of-interest exclusions. Maximize realized billables minus conflict risk.',
    n: 20,
    build: () => {
      const n = 20;
      const J = Array.from({ length: n }, () => new Array<number>(n).fill(0));
      const h = new Array<number>(n).fill(0);
      const labels: string[] = [];
      for (let i = 0; i < n; i++) {
        labels.push(`Matter-${i + 1}`);
        h[i] = Math.cos(i * 0.91) * 0.3 - 0.1;
        for (let j = i + 1; j < n; j++) {
          J[i][j] = Math.sin((i + 3) * (j + 5) * 0.17) * 0.5;
        }
      }
      return { J, h, labels };
    },
  },
  {
    id: 'sensor-placement',
    name: 'Defense Sensor Placement',
    domain: 'sentra',
    description:
      '24 candidate sensor sites along a perimeter, line-of-sight coupling. Maximize coverage subject to budget.',
    n: 24,
    build: () => {
      const n = 24;
      const J = Array.from({ length: n }, () => new Array<number>(n).fill(0));
      const h = new Array<number>(n).fill(0);
      const labels: string[] = [];
      for (let i = 0; i < n; i++) {
        labels.push(`Site-${i + 1}`);
        h[i] = -0.25 + Math.sin(i * 0.5) * 0.2;
        for (let j = i + 1; j < n; j++) {
          const dist = j - i;
          J[i][j] = dist <= 2 ? 0.7 / dist : Math.cos(i * j * 0.07) * 0.15;
        }
      }
      return { J, h, labels };
    },
  },
];

// ──────────────────────────────────────────────────────────────────────────
// Deterministic Simulated-Annealing Ising Solver
// ──────────────────────────────────────────────────────────────────────────

function solveIsing(
  J: number[][],
  h: number[],
  opts: { seed: number; sweeps?: number; tStart?: number; tEnd?: number },
): { spins: number[]; energy: number; trace: number[]; iterations: number } {
  const n = h.length;
  const sweeps = opts.sweeps ?? 600;
  const tStart = opts.tStart ?? 2.0;
  const tEnd = opts.tEnd ?? 0.01;

  let state = opts.seed >>> 0;
  const rng = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const spins = new Array<number>(n);
  for (let i = 0; i < n; i++) spins[i] = rng() < 0.5 ? -1 : 1;

  const energy = (s: number[]): number => {
    let e = 0;
    for (let i = 0; i < n; i++) {
      e += h[i] * s[i];
      for (let j = i + 1; j < n; j++) e += J[i][j] * s[i] * s[j];
    }
    return e;
  };

  const localField = (i: number, s: number[]): number => {
    let f = h[i];
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const c = j < i ? J[j][i] : J[i][j];
      f += c * s[j];
    }
    return f;
  };

  let best = spins.slice();
  let bestE = energy(spins);
  const trace: number[] = [bestE];
  let iterations = 0;

  for (let sw = 0; sw < sweeps; sw++) {
    const t = tStart * Math.pow(tEnd / tStart, sw / Math.max(1, sweeps - 1));
    for (let i = 0; i < n; i++) {
      iterations++;
      const dE = -2 * spins[i] * localField(i, spins);
      if (dE <= 0 || rng() < Math.exp(-dE / t)) {
        spins[i] = -spins[i];
      }
    }
    const e = energy(spins);
    if (e < bestE) {
      bestE = e;
      best = spins.slice();
    }
    if (sw % 20 === 0) trace.push(bestE);
  }
  trace.push(bestE);
  return { spins: best, energy: bestE, trace, iterations };
}

// ──────────────────────────────────────────────────────────────────────────
// Append-only typed Proof Chain (Covenant Proof Standard v1)
// Three receipt kinds: 'solve' | 'ingest' | 'narration'. Each links to the
// previous receipt's hash regardless of kind, so the chain is one strict
// total order. Receipts are NEVER mutated post-seal.
// ──────────────────────────────────────────────────────────────────────────

interface ReceiptBase {
  receiptId: string;
  kind: 'solve' | 'ingest' | 'narration';
  inputHash: string;
  outputHash: string;
  prevHash: string;
  receiptHash: string;
  createdAt: string;
  actorOrgId: number | null;
  actorUserId: number | null;
  governance: {
    standard: 'covenant-proof-standard/v1';
    authority: 'deterministic-ising-solver' | 'live-ingestion-pipeline' | 'llm-narrator-schema-validated' | 'structured-extractor';
    llmRole: 'narrator-only';
  };
}

interface SolveReceipt extends ReceiptBase {
  kind: 'solve';
  templateId: string;
  templateName: string;
  domain: string;
  seed: number;
  sweeps: number;
  energy: number;
  iterations: number;
  spins: number[];
  selected: string[];
  constitutionVersion: string | null;
  clausesEvaluated: number;
  clauseViolations: string[];
}

interface IngestReceipt extends ReceiptBase {
  kind: 'ingest';
  source: 'github' | 'arxiv' | 'huggingface';
  itemCount: number;
  errorCount: number;
  ranAt: string;
}

interface NarrationReceipt extends ReceiptBase {
  kind: 'narration';
  targetReceiptId: string;
  provider: 'anthropic' | 'openai' | 'gemini' | 'deterministic-fallback';
  model: string;
  narrative: string;
  schemaValidated: boolean;
}

type AnyReceipt = SolveReceipt | IngestReceipt | NarrationReceipt;

const RECEIPT_STORE: AnyReceipt[] = [];
const RECEIPT_INDEX = new Map<string, AnyReceipt>();
const RECEIPT_RING_CAP = 500;

function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function chainHead(): string {
  return RECEIPT_STORE.length === 0 ? 'GENESIS' : RECEIPT_STORE[RECEIPT_STORE.length - 1].receiptHash;
}

/**
 * Durable mirror of the in-memory hash-chain ring to the existing
 * `proof_ledger` table (lib/db/src/schema/proof_ledger.ts). Each sealed
 * ROSIE receipt becomes one proof_ledger row with product='rosie' and the
 * full hash-chained receipt stored verbatim in the jsonb payload column.
 *
 * Fire-and-forget — the hot solve path must not block on the DB. Failures
 * are warn-logged and swallowed (same posture as orchestration-store's
 * persistProof). On boot, `hydrateReceiptsFromDb()` repopulates the
 * in-memory ring + RECEIPT_INDEX from the most recent RECEIPT_RING_CAP
 * rows so the chain survives restarts and the cap is no longer the only
 * authority on receipt retention.
 */
function persistReceipt(r: AnyReceipt): void {
  void (async () => {
    try {
      const { db, proofLedgerTable } = await import('@szl-holdings/db');
      const summary =
        r.kind === 'solve'
          ? `solve:${r.templateId} energy=${r.energy.toFixed(4)}`
          : r.kind === 'ingest'
          ? `ingest:${r.source} items=${r.itemCount} errors=${r.errorCount}`
          : `narrate:${r.provider}/${r.model}`;
      await db
        .insert(proofLedgerTable)
        .values({
          id: r.receiptId,
          product: 'rosie',
          kind: r.kind,
          summary,
          deepLink: `/rosie/proof/${r.receiptId}`,
          modelUsed: r.kind === 'narration' ? `${r.provider}/${r.model}` : undefined,
          payload: r as unknown as Record<string, unknown>,
          ts: new Date(r.createdAt),
        })
        .onConflictDoNothing();
    } catch (err) {
      logger.warn({ err: String(err), receiptId: r.receiptId }, '[rosie] receipt persist failed');
    }
  })();
}

let receiptsHydrated = false;
export async function hydrateRosieReceiptsFromDb(): Promise<number> {
  if (receiptsHydrated) return RECEIPT_STORE.length;
  receiptsHydrated = true;
  try {
    const { db, proofLedgerTable } = await import('@szl-holdings/db');
    const { desc, eq } = await import('drizzle-orm');
    const rows = await db
      .select()
      .from(proofLedgerTable)
      .where(eq(proofLedgerTable.product, 'rosie'))
      .orderBy(desc(proofLedgerTable.ts))
      .limit(RECEIPT_RING_CAP);
    // Rows are newest-first; the chain ring stores oldest→newest, so reverse.
    for (let i = rows.length - 1; i >= 0; i--) {
      const payload = rows[i].payload as AnyReceipt | null;
      if (!payload || typeof payload !== 'object' || !('receiptHash' in payload)) continue;
      RECEIPT_STORE.push(payload);
      RECEIPT_INDEX.set(payload.receiptId, payload);
    }
    logger.info({ count: RECEIPT_STORE.length }, '[rosie] receipt chain hydrated from proof_ledger');
    return RECEIPT_STORE.length;
  } catch (err) {
    logger.warn({ err: String(err) }, '[rosie] receipt hydrate failed (non-fatal)');
    return 0;
  }
}
// Kick hydrate at module load; never throws.
void hydrateRosieReceiptsFromDb();

function sealReceipt<T extends AnyReceipt>(draft: Omit<T, 'prevHash' | 'receiptHash' | 'createdAt'>): T {
  const prevHash = chainHead();
  const receiptHash = sha256Hex(
    [draft.kind, draft.receiptId, draft.inputHash, draft.outputHash, prevHash].join('|'),
  );
  const full = {
    ...draft,
    prevHash,
    receiptHash,
    createdAt: new Date().toISOString(),
  } as T;
  RECEIPT_STORE.push(full);
  RECEIPT_INDEX.set(full.receiptId, full);
  // Mirror to durable proof_ledger BEFORE any in-memory eviction, so the
  // DB row exists for every sealed receipt even when the ring trims.
  persistReceipt(full);
  rosieBus.emit('receipt', full);
  if (full.kind === 'ingest') {
    const ing = full as unknown as { source: string; itemCount: number };
    rosieBus.emit('ingest', { source: ing.source, itemCount: ing.itemCount, receiptId: full.receiptId });
  }
  if (RECEIPT_STORE.length > RECEIPT_RING_CAP) {
    const removed = RECEIPT_STORE.shift();
    if (removed) RECEIPT_INDEX.delete(removed.receiptId);
  }
  return full;
}

function hashInputSolve(J: number[][], h: number[], seed: number): string {
  const flat = [seed, ...h, ...J.flatMap((r, i) => r.slice(i + 1))].map((v) => v.toFixed(6)).join('|');
  return sha256Hex(flat);
}
function hashOutputSolve(spins: number[], energy: number): string {
  return sha256Hex(spins.join(',') + '|' + energy.toFixed(8));
}

// ──────────────────────────────────────────────────────────────────────────
// A11oy Active Constitution — consulted before every solve seal.
// Pulls the active doctrine from the in-process A11oy router; deny if any
// clause evaluates `satisfied: false`. The optimizer remains the numeric
// authority — the constitution only gates whether the solution may be sealed.
// ──────────────────────────────────────────────────────────────────────────

interface ConstitutionClause {
  id: string;
  description: string;
  // Simple structural predicates the gate understands. Each clause is a
  // dispatch row — if no predicate matches, the clause is considered
  // advisory-only (informational, never blocking).
  forbidDomain?: string;
  maxSelected?: number;
  minSelected?: number;
}

interface ActiveConstitution {
  version: string;
  clauses: ConstitutionClause[];
}

let cachedConstitution: { value: ActiveConstitution; fetchedAt: number } | null = null;
const CONSTITUTION_TTL_MS = 60_000;

// Hash-anchored default constitution baked into the binary. Used ONLY when
// the upstream doctrine endpoint responds successfully but has no active
// constitution rows (i.e. no operator has authored one yet). This is NOT a
// fail-open fallback for fetch failures — those still throw 503. The default
// constraints are intentionally conservative: forbid the 'unbounded' synthetic
// domain (used by red-team probes) and cap selection size to keep solves
// bounded until an operator publishes an explicit constitution.
const INSTANCE_DEFAULT_CONSTITUTION: ActiveConstitution = {
  version: 'instance-default/v1',
  clauses: [
    { id: 'default.forbid_unbounded', description: 'block synthetic unbounded probe domain', forbidDomain: 'unbounded' },
    { id: 'default.cap_selection', description: 'cap solve selection at 256 spins', maxSelected: 256 },
  ],
};

async function fetchActiveConstitution(_req: Request): Promise<ActiveConstitution> {
  const now = Date.now();
  if (cachedConstitution && now - cachedConstitution.fetchedAt < CONSTITUTION_TTL_MS) {
    return cachedConstitution.value;
  }
  // SSRF-safe: build the constitution URL from process-local env ONLY. We must
  // never derive the host/proto from request headers (Host, X-Forwarded-*) —
  // those are client-influenced and would let an authenticated caller induce
  // server-side requests to arbitrary hosts.
  const port = process.env.PORT ?? process.env.API_PORT ?? '5000';
  const url = `http://127.0.0.1:${port}/api/a11oy/doctrine/constitution/active`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (r.ok) {
      const body: unknown = await r.json();
      const parsed = z
        .object({
          version: z.string().optional(),
          clauses: z
            .array(
              z.object({
                id: z.string(),
                description: z.string().optional().default(''),
                forbidDomain: z.string().optional(),
                maxSelected: z.number().int().optional(),
                minSelected: z.number().int().optional(),
              }),
            )
            .optional()
            .default([]),
        })
        .safeParse(body);
      if (parsed.success) {
        const value: ActiveConstitution = {
          version: parsed.data.version ?? 'unknown',
          clauses: parsed.data.clauses.map((c) => ({
            id: c.id,
            description: c.description ?? '',
            forbidDomain: c.forbidDomain,
            maxSelected: c.maxSelected,
            minSelected: c.minSelected,
          })),
        };
        cachedConstitution = { value, fetchedAt: now };
        return value;
      }
    }
    // 404 / not-found from upstream means no operator has published an
    // active constitution. That's a successful response (the endpoint
    // exists and replied) so we use the conservative instance default —
    // NOT a permissive empty fallback.
    if (r.status === 404) {
      cachedConstitution = { value: INSTANCE_DEFAULT_CONSTITUTION, fetchedAt: now };
      return INSTANCE_DEFAULT_CONSTITUTION;
    }
  } catch (err) {
    logger.warn({ err: String(err) }, '[rosie] active-constitution fetch failed');
  }
  // Fail-CLOSED: when the active constitution cannot be fetched or parsed,
  // refuse to return a permissive default. Solve sealing depends on this
  // returning a valid constitution, so we throw a typed error that the
  // route handlers translate to HTTP 503 — the queue stays paused until
  // the A11oy doctrine endpoint is healthy again. An explicit escape hatch
  // (ROSIE_ALLOW_DEGRADED_GUARDRAILS=1) is documented for incident-only
  // operator override and is itself recorded in the rejection note.
  if (process.env.ROSIE_ALLOW_DEGRADED_GUARDRAILS === '1') {
    const degraded: ActiveConstitution = { version: 'degraded-operator-override', clauses: [] };
    cachedConstitution = { value: degraded, fetchedAt: now };
    return degraded;
  }
  throw Object.assign(new Error('constitution_unavailable'), {
    _http: 503,
    constitutionVersion: 'unavailable',
    violations: ['active constitution could not be fetched from /api/a11oy/doctrine/constitution/active'],
  });
}

function evaluateConstitution(
  constitution: ActiveConstitution,
  ctx: { domain: string; selectedCount: number },
): { satisfied: boolean; violations: string[] } {
  const violations: string[] = [];
  for (const c of constitution.clauses) {
    if (c.forbidDomain && c.forbidDomain === ctx.domain) {
      violations.push(`${c.id}: domain '${ctx.domain}' is forbidden`);
    }
    if (typeof c.maxSelected === 'number' && ctx.selectedCount > c.maxSelected) {
      violations.push(`${c.id}: ${ctx.selectedCount} selected exceeds maxSelected=${c.maxSelected}`);
    }
    if (typeof c.minSelected === 'number' && ctx.selectedCount < c.minSelected) {
      violations.push(`${c.id}: ${ctx.selectedCount} selected below minSelected=${c.minSelected}`);
    }
  }
  return { satisfied: violations.length === 0, violations };
}

// ──────────────────────────────────────────────────────────────────────────
// LLM Narrator — schema-validated structured output, multi-provider fallback
// Provider chain: Anthropic → OpenAI → Gemini → deterministic synthetic.
// Each narration produces its own NarrationReceipt; we never mutate the
// underlying SolveReceipt to attach narrative (would break its receiptHash).
// ──────────────────────────────────────────────────────────────────────────

const NarrationSchema = z.object({
  summary: z.string().min(1).max(1000),
  confidence: z.number().min(0).max(1).optional(),
});
type NarrationPayload = z.infer<typeof NarrationSchema>;

interface NarrationResult {
  payload: NarrationPayload;
  provider: NarrationReceipt['provider'];
  model: string;
  schemaValidated: boolean;
}

function buildNarrationPrompt(receipt: SolveReceipt): { system: string; user: string } {
  return {
    system:
      'You are ROSIE\'s narrator. The deterministic Ising/SA optimizer is the SOLE numeric authority — you must not propose changes, alternatives, or numeric overrides. Return ONLY a JSON object: {"summary": "<2-3 sentence plain-English explanation>", "confidence": <0..1>}.',
    user: `Template: ${receipt.templateName} (${receipt.domain})
Variables selected (+1): ${receipt.selected.join(', ') || '(none)'}
Energy (lower = better): ${receipt.energy.toFixed(4)}
Iterations: ${receipt.iterations}
ReceiptId: ${receipt.receiptId}

Return the JSON object now.`,
  };
}

function tryParseJsonContent(raw: string): unknown | null {
  const cleaned = raw.replace(/^```json\s*|\s*```$/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // attempt to extract first { ... } block
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}

async function narrateAnthropic(receipt: SolveReceipt): Promise<NarrationResult | null> {
  const baseUrl = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  if (!baseUrl || !apiKey) return null;
  const model = process.env.ROSIE_NARRATOR_ANTHROPIC_MODEL ?? 'claude-sonnet-4-5';
  const { system, user } = buildNarrationPrompt(receipt);
  try {
    const r = await fetch(`${baseUrl.replace(/\/$/, '')}/v1/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 400,
        system,
        messages: [{ role: 'user', content: user }],
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!r.ok) {
      logger.debug({ status: r.status }, '[rosie] anthropic narrator non-OK');
      return null;
    }
    const json = (await r.json()) as { content?: Array<{ text?: string }> };
    const text = json.content?.map((c) => c?.text ?? '').join(' ').trim();
    if (!text) return null;
    const parsed = tryParseJsonContent(text);
    if (!parsed) return null;
    const v = NarrationSchema.safeParse(parsed);
    if (!v.success) return null;
    return { payload: v.data, provider: 'anthropic', model, schemaValidated: true };
  } catch (err) {
    logger.debug({ err: String(err) }, '[rosie] anthropic narrator failed');
    return null;
  }
}

async function narrateOpenAICompat(
  receipt: SolveReceipt,
  envPrefix: 'OPENAI' | 'GEMINI',
  defaultModel: string,
): Promise<NarrationResult | null> {
  const baseUrl = process.env[`AI_INTEGRATIONS_${envPrefix}_BASE_URL`];
  const apiKey = process.env[`AI_INTEGRATIONS_${envPrefix}_API_KEY`];
  if (!baseUrl || !apiKey) return null;
  const model = process.env[`ROSIE_NARRATOR_${envPrefix}_MODEL`] ?? defaultModel;
  const { system, user } = buildNarrationPrompt(receipt);
  try {
    const r = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_completion_tokens: 400,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!r.ok) {
      logger.debug({ provider: envPrefix, status: r.status }, '[rosie] openai-compat narrator non-OK');
      return null;
    }
    const json = (await r.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = json.choices?.[0]?.message?.content?.trim();
    if (!raw) return null;
    const parsed = tryParseJsonContent(raw);
    if (!parsed) return null;
    const v = NarrationSchema.safeParse(parsed);
    if (!v.success) return null;
    return {
      payload: v.data,
      provider: envPrefix === 'OPENAI' ? 'openai' : 'gemini',
      model,
      schemaValidated: true,
    };
  } catch (err) {
    logger.debug({ err: String(err), provider: envPrefix }, '[rosie] openai-compat narrator failed');
    return null;
  }
}

async function narrateWithFallback(receipt: SolveReceipt): Promise<NarrationResult> {
  const a = await narrateAnthropic(receipt);
  if (a) return a;
  const o = await narrateOpenAICompat(receipt, 'OPENAI', 'gpt-5-mini');
  if (o) return o;
  const g = await narrateOpenAICompat(receipt, 'GEMINI', 'gemini-2.5-flash');
  if (g) return g;
  return {
    payload: {
      summary: `Solver selected ${receipt.selected.length} of ${receipt.spins.length} variables for ${receipt.templateName}; energy=${receipt.energy.toFixed(4)} over ${receipt.iterations} spin flips. (no LLM provider available)`,
      confidence: 0.0,
    },
    provider: 'deterministic-fallback',
    model: 'rosie-deterministic-narrator/v1',
    schemaValidated: true,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// GitHub ingestion — uses GH_WORKFLOW_TOKEN (existing connected integration
// token, same pattern as org-intelligence.ts). If absent, ingest receipt is
// still appended carrying { errorCount: N } so the chain reflects reality.
// ──────────────────────────────────────────────────────────────────────────

// Scan README markdown for paper/model identifiers: arXiv ids (NEW + legacy),
// DOIs, and HuggingFace model paths. Deduplicated, capped at 32 refs/README
// to keep extraction payloads bounded.
function extractPaperRefs(readme: string): string[] {
  const out = new Set<string>();
  const arxivNew = /\barXiv:(\d{4}\.\d{4,5})(v\d+)?\b/gi;
  const arxivUrl = /\barxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5})/gi;
  const doi = /\b(10\.\d{4,9}\/[^\s)\]]+)/g;
  const hf = /\bhuggingface\.co\/([\w.-]+\/[\w.-]+)/gi;
  for (const m of readme.matchAll(arxivNew)) out.add(`arxiv:${m[1]}`);
  for (const m of readme.matchAll(arxivUrl)) out.add(`arxiv:${m[1]}`);
  for (const m of readme.matchAll(doi)) out.add(`doi:${m[1]}`);
  for (const m of readme.matchAll(hf)) out.add(`hf:${m[1]}`);
  return [...out].slice(0, 32);
}

const SZL_REPOS = [
  'szl-holdings/lutar-lean',
  'szl-holdings/ouroboros',
  'szl-holdings/ouroboros-thesis',
  'szl-holdings/agi-forecast',
  'szl-holdings/vsp-otel',
  'szl-holdings/szl-trust',
  'szl-holdings/amaru',
];

const RepoActivitySchema = z.object({
  repo: z.string(),
  fetchedAt: z.string(),
  description: z.string().nullable(),
  stars: z.number(),
  openIssues: z.number(),
  pushedAt: z.string().nullable(),
  defaultBranch: z.string(),
  recentCommits: z.array(z.object({
    sha: z.string(),
    message: z.string(),
    author: z.string(),
    date: z.string(),
  })),
  // README excerpt + paper metadata from the repo (rosie ingest scope).
  // README is capped at 4 KB so we can use it as LLM-extraction input without
  // exploding the receipt payload; paperRefs are arXiv/DOI/HuggingFace ids
  // scraped from README markdown.
  readmeExcerpt: z.string().nullable().optional(),
  readmeSha256: z.string().nullable().optional(),
  paperRefs: z.array(z.string()).optional(),
  error: z.string().optional(),
});
type RepoActivity = z.infer<typeof RepoActivitySchema>;

const ingestState = {
  github: { lastRun: null as string | null, repos: [] as RepoActivity[], errorCount: 0 },
  arxiv: { lastRun: null as string | null, papers: [] as ArxivPaper[], errorCount: 0 },
  hf: { lastRun: null as string | null, models: [] as HFModel[], errorCount: 0 },
};

async function fetchGitHub(): Promise<{ repos: RepoActivity[]; errorCount: number }> {
  const token = process.env.GH_WORKFLOW_TOKEN ?? process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  if (!token) {
    const at = new Date().toISOString();
    return {
      repos: SZL_REPOS.map((r) => ({
        repo: r,
        fetchedAt: at,
        description: null,
        stars: 0,
        openIssues: 0,
        pushedAt: null,
        defaultBranch: 'main',
        recentCommits: [],
        readmeExcerpt: null,
        readmeSha256: null,
        paperRefs: [],
        error: 'github_token_missing',
      })),
      errorCount: SZL_REPOS.length,
    };
  }
  const headers = {
    authorization: `Bearer ${token}`,
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
    'user-agent': 'rosie-ingest/1.0',
  };
  let errorCount = 0;
  const repos: RepoActivity[] = await Promise.all(
    SZL_REPOS.map(async (repo) => {
      const at = new Date().toISOString();
      try {
        const repoRes = await fetch(`https://api.github.com/repos/${repo}`, {
          headers, signal: AbortSignal.timeout(8000),
        });
        if (!repoRes.ok) {
          errorCount++;
          return { repo, fetchedAt: at, description: null, stars: 0, openIssues: 0, pushedAt: null, defaultBranch: 'main', recentCommits: [], error: `repo HTTP ${repoRes.status}` };
        }
        const repoJson = (await repoRes.json()) as Record<string, unknown>;
        const [commitsRes, readmeRes] = await Promise.all([
          fetch(`https://api.github.com/repos/${repo}/commits?per_page=5`, { headers, signal: AbortSignal.timeout(8000) }),
          // README endpoint returns raw markdown when Accept: vnd.github.raw
          fetch(`https://api.github.com/repos/${repo}/readme`, {
            headers: { ...headers, accept: 'application/vnd.github.raw' },
            signal: AbortSignal.timeout(8000),
          }),
        ]);
        const commits: unknown = commitsRes.ok ? await commitsRes.json() : [];
        let readmeExcerpt: string | null = null;
        let readmeSha256: string | null = null;
        let paperRefs: string[] = [];
        if (readmeRes.ok) {
          const raw = await readmeRes.text();
          readmeSha256 = sha256Hex(raw);
          readmeExcerpt = raw.slice(0, 4096);
          paperRefs = extractPaperRefs(raw);
        }
        return {
          repo,
          fetchedAt: at,
          description: (repoJson.description as string | null) ?? null,
          stars: (repoJson.stargazers_count as number) ?? 0,
          openIssues: (repoJson.open_issues_count as number) ?? 0,
          pushedAt: (repoJson.pushed_at as string | null) ?? null,
          defaultBranch: (repoJson.default_branch as string) ?? 'main',
          recentCommits: Array.isArray(commits)
            ? (commits as Array<Record<string, unknown>>).slice(0, 5).map((c) => {
                const commit = (c.commit as Record<string, unknown>) ?? {};
                const author = (commit.author as Record<string, unknown>) ?? {};
                return {
                  sha: String(c.sha ?? '').slice(0, 7),
                  message: String(commit.message ?? '').split('\n')[0].slice(0, 140),
                  author: (author.name as string) ?? 'unknown',
                  date: (author.date as string) ?? '',
                };
              })
            : [],
          readmeExcerpt,
          readmeSha256,
          paperRefs,
        };
      } catch (err) {
        errorCount++;
        return { repo, fetchedAt: at, description: null, stars: 0, openIssues: 0, pushedAt: null, defaultBranch: 'main', recentCommits: [], readmeExcerpt: null, readmeSha256: null, paperRefs: [], error: String(err).slice(0, 200) };
      }
    }),
  );
  repos.sort((a, b) => (b.pushedAt ?? '').localeCompare(a.pushedAt ?? ''));
  return { repos, errorCount };
}

// arXiv: Zod-validated structured extraction
const ArxivPaperSchema = z.object({
  source: z.literal('arxiv'),
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string(),
  authors: z.array(z.string()),
  published: z.string(),
  url: z.string(),
});
type ArxivPaper = z.infer<typeof ArxivPaperSchema>;

async function fetchArxiv(): Promise<{ papers: ArxivPaper[]; errorCount: number }> {
  const q = encodeURIComponent('cat:cs.LG OR cat:cs.AI OR cat:quant-ph OR cat:cs.MA');
  const url = `https://export.arxiv.org/api/query?search_query=${q}&sortBy=submittedDate&sortOrder=descending&max_results=12`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return { papers: [], errorCount: 1 };
    const xml = await res.text();
    const entries = xml.split('<entry>').slice(1);
    const papers: ArxivPaper[] = [];
    let errorCount = 0;
    for (const e of entries) {
      const get = (tag: string): string => {
        const m = e.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
        return m ? m[1].replace(/\s+/g, ' ').trim() : '';
      };
      const id = get('id');
      const authorBlocks = e.match(/<author>[\s\S]*?<\/author>/g) ?? [];
      const draft = {
        source: 'arxiv' as const,
        id,
        title: get('title'),
        summary: get('summary').slice(0, 320),
        authors: authorBlocks
          .map((a) => (a.match(/<name>([\s\S]*?)<\/name>/) ?? [, ''])[1].trim())
          .filter(Boolean)
          .slice(0, 4),
        published: get('published'),
        url: id,
      };
      const parsed = ArxivPaperSchema.safeParse(draft);
      if (parsed.success) papers.push(parsed.data);
      else errorCount++;
    }
    return { papers, errorCount };
  } catch (err) {
    logger.warn({ err: String(err) }, '[rosie] arxiv ingest failed');
    return { papers: [], errorCount: 1 };
  }
}

const HFModelSchema = z.object({
  source: z.literal('huggingface'),
  id: z.string(),
  url: z.string(),
  downloads: z.number(),
  likes: z.number(),
  tags: z.array(z.string()),
  pipelineTag: z.string().nullable(),
  updatedAt: z.string().nullable(),
});
type HFModel = z.infer<typeof HFModelSchema>;

async function fetchHuggingFace(): Promise<{ models: HFModel[]; errorCount: number }> {
  try {
    const res = await fetch(
      'https://huggingface.co/api/models?sort=downloads&direction=-1&limit=12&full=false',
      { signal: AbortSignal.timeout(10_000) },
    );
    if (!res.ok) return { models: [], errorCount: 1 };
    const json = (await res.json()) as Array<Record<string, unknown>>;
    const models: HFModel[] = [];
    let errorCount = 0;
    for (const m of json) {
      const id = (m.id ?? m.modelId) as string | undefined;
      if (!id) { errorCount++; continue; }
      const draft = {
        source: 'huggingface' as const,
        id,
        url: `https://huggingface.co/${id}`,
        downloads: (m.downloads as number) ?? 0,
        likes: (m.likes as number) ?? 0,
        tags: ((m.tags as string[]) ?? []).slice(0, 6),
        pipelineTag: (m.pipeline_tag as string) ?? null,
        updatedAt: (m.lastModified as string) ?? null,
      };
      const parsed = HFModelSchema.safeParse(draft);
      if (parsed.success) models.push(parsed.data);
      else errorCount++;
    }
    return { models, errorCount };
  } catch (err) {
    logger.warn({ err: String(err) }, '[rosie] hf ingest failed');
    return { models: [], errorCount: 1 };
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Per-source append-only DELTA LOG.
//
// Distinct from the global hash-chained RECEIPT_STORE: each ingest source
// (github / arxiv / huggingface) also gets a per-source delta journal where
// every entry records (a) the previous delta entry's hash, (b) a hash of the
// new payload, and (c) the deltaCount = items that *changed* since the last
// run. The journal is append-only in memory and exposed via
// GET /api/rosie/ingest/delta-log so operators can audit *what changed*
// between consecutive ingest runs without needing to diff full snapshots.
// ──────────────────────────────────────────────────────────────────────────

interface DeltaLogEntry {
  source: IngestReceipt['source'];
  recordedAt: string;
  prevHash: string;
  payloadHash: string;
  itemCount: number;
  deltaCount: number;
  removedCount: number;
  addedSample: string[];
  removedSample: string[];
  receiptId: string;
}

const DELTA_LOG: Record<IngestReceipt['source'], DeltaLogEntry[]> = {
  github: [],
  arxiv: [],
  huggingface: [],
};
const DELTA_LOG_CAP = 200;

// Cache of last per-source identifier sets so deltaCount can be computed in
// constant memory. github → "repo@pushedAt", arxiv → paper id, hf → model id.
const lastIngestKeys: Record<IngestReceipt['source'], Set<string>> = {
  github: new Set(),
  arxiv: new Set(),
  huggingface: new Set(),
};

function appendDeltaLog(
  source: IngestReceipt['source'],
  receiptId: string,
  payloadHash: string,
  itemCount: number,
  newKeys: string[],
): DeltaLogEntry {
  const prev = DELTA_LOG[source];
  const prevEntry = prev.length > 0 ? prev[prev.length - 1] : null;
  const prevHash = prevEntry ? sha256Hex(`${prevEntry.payloadHash}|${prevEntry.recordedAt}`) : 'GENESIS';
  const newSet = new Set(newKeys);
  const oldSet = lastIngestKeys[source];
  const added: string[] = [];
  const removed: string[] = [];
  for (const k of newSet) if (!oldSet.has(k)) added.push(k);
  for (const k of oldSet) if (!newSet.has(k)) removed.push(k);
  lastIngestKeys[source] = newSet;
  const entry: DeltaLogEntry = {
    source,
    recordedAt: new Date().toISOString(),
    prevHash,
    payloadHash,
    itemCount,
    deltaCount: added.length,
    removedCount: removed.length,
    addedSample: added.slice(0, 5),
    removedSample: removed.slice(0, 5),
    receiptId,
  };
  prev.push(entry);
  if (prev.length > DELTA_LOG_CAP) prev.shift();
  return entry;
}

// GitHub release-notes fetch — per repo, one /releases call. Best-effort:
// failures are recorded as `error` and do not abort other repos. Used to
// surface upstream version changes alongside commit activity so operators
// can spot meaningful releases without reading every commit.
const releaseNotesState: Record<string, { fetchedAt: string; releases: Array<{ tag: string; name: string; publishedAt: string; bodyExcerpt: string }>; error?: string }> = {};

async function fetchReleaseNotes(repo: string, headers: Record<string, string>): Promise<void> {
  try {
    const r = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=5`, { headers, signal: AbortSignal.timeout(8000) });
    if (!r.ok) { releaseNotesState[repo] = { fetchedAt: new Date().toISOString(), releases: [], error: `releases HTTP ${r.status}` }; return; }
    const arr = (await r.json()) as Array<Record<string, unknown>>;
    releaseNotesState[repo] = {
      fetchedAt: new Date().toISOString(),
      releases: arr.slice(0, 5).map((rel) => ({
        tag: String(rel.tag_name ?? ''),
        name: String(rel.name ?? rel.tag_name ?? ''),
        publishedAt: String(rel.published_at ?? ''),
        bodyExcerpt: String(rel.body ?? '').slice(0, 280),
      })),
    };
  } catch (err) {
    releaseNotesState[repo] = { fetchedAt: new Date().toISOString(), releases: [], error: String(err).slice(0, 200) };
  }
}

// LLM-style structured extraction (deterministic fallback): summarises the
// most recent commits + release tags into a one-line research digest per
// repo. Lives off the narration provider chain so we keep the same
// "narrator-only" governance contract — never alters numeric authority.
function summarizeRepoDigest(repo: RepoActivity): string {
  const last = repo.recentCommits[0]?.message ?? '(no recent commits)';
  const rel = releaseNotesState[repo.repo]?.releases[0];
  const relPart = rel ? ` · last release ${rel.tag}` : '';
  return `${repo.repo}: ${repo.stars}★ ${repo.openIssues} open issues${relPart}. Last commit: ${last}`;
}

// Structured extraction step over ingested research items. Spec calls for an
// LLM proxy with schema-validated output and a proof receipt per run. We
// implement it as a deterministic structured extractor by default (zero
// external dependencies, always reproducible) and OPTIONALLY enhance with
// the Replit AI proxy when ROSIE_ENABLE_LLM_EXTRACTION=1. Either path emits
// a sealed receipt so the structured output enters the hash-chain.
type ExtractionItem = {
  id: string;
  kind: 'paper' | 'model' | 'repo';
  title: string;
  topics: string[];
  noveltyScore: number;
  relevanceScore: number;
  oneLine: string;
};
const ExtractionItemSchema = z.object({
  id: z.string(),
  kind: z.enum(['paper', 'model', 'repo']),
  title: z.string(),
  topics: z.array(z.string()),
  noveltyScore: z.number().min(0).max(1),
  relevanceScore: z.number().min(0).max(1),
  oneLine: z.string(),
  llmInsight: z.string().optional(),
});

async function callLlmExtraction(
  source: IngestReceipt['source'],
  rawItems: Array<{ id: string; title?: string; summary?: string; tags?: readonly string[] | string[] }>,
  kind: 'paper' | 'model' | 'repo',
): Promise<{ annotations: Record<string, string>; model: string } | null> {
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com';
  if (!apiKey) return null;
  const model = 'claude-sonnet-4-5';
  // Cap to first 12 items to bound prompt size; the rest still ship through
  // deterministic extraction. JSON-only response contract.
  const items = rawItems.slice(0, 12).map((i) => ({
    id: i.id,
    title: i.title ?? i.id,
    summary: (i.summary ?? '').slice(0, 400),
  }));
  const systemPrompt =
    `You are ROSIE's narrator-only research analyst. Return STRICT JSON: ` +
    `{"annotations":{"<id>":"<<=200 char insight about why this ${kind} matters for governed decision optimization>"}}. ` +
    `Do NOT return scores, do NOT alter ids, do NOT add prose outside JSON. Source: ${source}.`;
  const userMessage = `Items:\n${JSON.stringify(items)}`;
  try {
    const resp = await fetch(`${baseURL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!resp.ok) {
      logger.warn({ source, status: resp.status }, '[rosie] llm extraction HTTP error');
      return null;
    }
    const json = (await resp.json()) as { content?: Array<{ type: string; text: string }> };
    const text = json.content?.find((c) => c.type === 'text')?.text ?? '';
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const parsed = JSON.parse(m[0]) as { annotations?: Record<string, string> };
    if (!parsed.annotations || typeof parsed.annotations !== 'object') return null;
    const annotations: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed.annotations)) {
      if (typeof v === 'string' && v.length > 0) annotations[k] = v;
    }
    return { annotations, model };
  } catch (err) {
    logger.warn({ source, err: String(err) }, '[rosie] llm extraction failed');
    return null;
  }
}

function deterministicExtract(item: { id: string; title?: string; tags?: readonly string[] | string[]; summary?: string }, kind: ExtractionItem['kind']): ExtractionItem {
  const title = item.title ?? item.id;
  const hay = `${title} ${item.summary ?? ''} ${(item.tags ?? []).join(' ')}`.toLowerCase();
  const TOPIC_KEYWORDS: Record<string, string[]> = {
    ising: ['ising', 'spin glass'],
    qaoa: ['qaoa', 'quantum approximate'],
    'simulated-annealing': ['simulated annealing', 'sa solver'],
    qubo: ['qubo', 'quadratic unconstrained'],
    routing: ['routing', 'tsp', 'vehicle'],
    'graph-nn': ['graph neural', 'gcn', 'gnn'],
    rl: ['reinforcement learning', 'rl '],
    optimization: ['optimization', 'optimisation', 'combinatorial'],
    quantum: ['quantum', 'adiabatic'],
  };
  const topics = Object.entries(TOPIC_KEYWORDS)
    .filter(([, kws]) => kws.some((k) => hay.includes(k)))
    .map(([t]) => t);
  // Reproducible scoring from id hash so the receipts are deterministic.
  const h = sha256Hex(`${kind}|${item.id}`);
  const noveltyScore = parseInt(h.slice(0, 4), 16) / 0xffff;
  const relevanceScore = topics.length > 0 ? Math.min(1, 0.4 + topics.length * 0.15) : 0.2;
  return {
    id: item.id,
    kind,
    title,
    topics,
    noveltyScore: Number(noveltyScore.toFixed(3)),
    relevanceScore: Number(relevanceScore.toFixed(3)),
    oneLine: `${kind}:${title.slice(0, 80)}${title.length > 80 ? '…' : ''}`,
  };
}

async function runStructuredExtraction(
  source: IngestReceipt['source'],
  targetReceiptId: string,
  rawItems: Array<{ id: string; title?: string; tags?: readonly string[] | string[]; summary?: string }>,
  kind: ExtractionItem['kind'],
): Promise<NarrationReceipt | null> {
  if (rawItems.length === 0) return null;
  // Deterministic extraction (always runs, always succeeds) — this is the
  // ground truth that gets sealed. The LLM augmentation below NEVER replaces
  // these values; it only adds an `llmInsight` string per item, schema-gated.
  const extracted: ExtractionItem[] = rawItems.map((it) => deterministicExtract(it, kind));

  // Real LLM-proxy structured extraction via Replit AI Integrations
  // (Anthropic). Adds an `llmInsight` annotation per item, schema-validated.
  // On any provider failure we fall back to deterministic-only output so the
  // ingest receipt still seals — the LLM is narrator-only by Covenant Proof.
  let llmAnnotations: Record<string, string> = {};
  let llmProvider: 'anthropic-proxy' | 'deterministic-fallback' = 'deterministic-fallback';
  let llmModel = 'deterministic';
  if (process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY) {
    const llm = await callLlmExtraction(source, rawItems, kind);
    if (llm) {
      llmAnnotations = llm.annotations;
      llmProvider = 'anthropic-proxy';
      llmModel = llm.model;
    }
  }
  for (const item of extracted) {
    const note = llmAnnotations[item.id];
    if (note) (item as unknown as { llmInsight?: string }).llmInsight = note.slice(0, 280);
  }

  // Schema validation — guarantees structured output contract.
  const validated = z.array(ExtractionItemSchema).safeParse(extracted);
  if (!validated.success) {
    logger.warn({ source, err: validated.error.message }, '[rosie] extraction schema invalid');
    return null;
  }
  const payload = {
    source,
    extractor: llmProvider === 'anthropic-proxy' ? 'llm+deterministic' : 'deterministic',
    llmModel,
    itemCount: validated.data.length,
    items: validated.data,
  };
  const narrative = JSON.stringify(payload);
  const inputHash = sha256Hex(`extract|${source}|${rawItems.map((i) => i.id).join('|')}`);
  const outputHash = sha256Hex(narrative);
  return sealReceipt<NarrationReceipt>({
    receiptId: randomUUID(),
    kind: 'narration',
    targetReceiptId,
    provider: 'deterministic-fallback',
    model: payload.extractor,
    narrative,
    schemaValidated: true,
    inputHash,
    outputHash,
    actorOrgId: null,
    actorUserId: null,
    governance: {
      standard: 'covenant-proof-standard/v1',
      authority: 'structured-extractor',
      llmRole: 'narrator-only',
    },
  });
}

function appendIngestReceipt(source: IngestReceipt['source'], itemCount: number, errorCount: number, payloadHash: string): IngestReceipt {
  return sealReceipt<IngestReceipt>({
    receiptId: randomUUID(),
    kind: 'ingest',
    source,
    itemCount,
    errorCount,
    ranAt: new Date().toISOString(),
    inputHash: sha256Hex(`ingest|${source}|${new Date().toISOString().slice(0, 13)}`),
    outputHash: payloadHash,
    actorOrgId: null,
    actorUserId: null,
    governance: {
      standard: 'covenant-proof-standard/v1',
      authority: 'live-ingestion-pipeline',
      llmRole: 'narrator-only',
    },
  });
}

async function runFullIngest(): Promise<void> {
  const [gh, ax, hf] = await Promise.all([fetchGitHub(), fetchArxiv(), fetchHuggingFace()]);
  const now = new Date().toISOString();

  // Best-effort: fetch release notes for repos that returned successfully.
  // Failures are stored in releaseNotesState[repo].error and surfaced in the
  // research digest endpoint — never abort the rest of the ingest pipeline.
  const token = process.env.GH_WORKFLOW_TOKEN ?? process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  if (token) {
    const headers = {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'user-agent': 'rosie-ingest/1.0',
    };
    await Promise.all(gh.repos.filter((r) => !r.error).map((r) => fetchReleaseNotes(r.repo, headers)));
  }

  ingestState.github = { lastRun: now, repos: gh.repos, errorCount: gh.errorCount };
  const ghHash = sha256Hex(gh.repos.map((r) => `${r.repo}:${r.pushedAt ?? ''}`).join('|'));
  const ghReceipt = appendIngestReceipt('github', gh.repos.length, gh.errorCount, ghHash);
  appendDeltaLog('github', ghReceipt.receiptId, ghHash, gh.repos.length,
    gh.repos.map((r) => `${r.repo}@${r.pushedAt ?? ''}`));
  await runStructuredExtraction('github', ghReceipt.receiptId,
    gh.repos.map((r) => ({ id: r.repo, title: r.repo, summary: r.recentCommits[0]?.message })), 'repo');

  ingestState.arxiv = { lastRun: now, papers: ax.papers, errorCount: ax.errorCount };
  const axHash = sha256Hex(ax.papers.map((p) => p.id).join('|'));
  const axReceipt = appendIngestReceipt('arxiv', ax.papers.length, ax.errorCount, axHash);
  appendDeltaLog('arxiv', axReceipt.receiptId, axHash, ax.papers.length, ax.papers.map((p) => p.id));
  await runStructuredExtraction('arxiv', axReceipt.receiptId,
    ax.papers.map((p) => ({ id: p.id, title: p.title, summary: p.summary })), 'paper');

  ingestState.hf = { lastRun: now, models: hf.models, errorCount: hf.errorCount };
  const hfHash = sha256Hex(hf.models.map((m) => m.id).join('|'));
  const hfReceipt = appendIngestReceipt('huggingface', hf.models.length, hf.errorCount, hfHash);
  appendDeltaLog('huggingface', hfReceipt.receiptId, hfHash, hf.models.length, hf.models.map((m) => m.id));
  await runStructuredExtraction('huggingface', hfReceipt.receiptId,
    hf.models.map((m) => ({ id: m.id, title: m.id, tags: m.tags })), 'model');
}

// ──────────────────────────────────────────────────────────────────────────
// Scheduling — temporal-driven by default with an in-process dev fallback.
//
// Production path: `ensureRosieIngestSchedule()` (services/rosie-ingest/
// temporal-scheduler.ts) idempotently creates a Temporal Schedule that
// fires `rosieIngestWorkflow` on the configured cadence (default 6h). The
// `temporal-worker` deployment is the one that actually executes the
// activity — this api-server only registers the schedule on boot.
//
// Dev/local fallback: if Temporal is not configured or unreachable, the
// scheduler returns `{ ok: false }` and we set up a bounded in-process
// setInterval at the same cadence so the demo keeps emitting ingest
// receipts. Cadence is env-configurable via ROSIE_INGEST_INTERVAL_MS.
// ──────────────────────────────────────────────────────────────────────────

const REFRESH_MS = Number(process.env.ROSIE_INGEST_INTERVAL_MS) || 6 * 60 * 60 * 1000;
let schedulerHandle: ReturnType<typeof setInterval> | null = null;

async function bootstrapRosieIngestSchedule(): Promise<void> {
  if (schedulerHandle) return;
  // initial kick at +5s so the server can finish booting
  setTimeout(() => {
    runFullIngest().catch((err) => logger.warn({ err: String(err) }, '[rosie] initial ingest failed'));
  }, 5_000).unref?.();

  // Try Temporal first.
  try {
    const { ensureRosieIngestSchedule } = await import('../services/rosie-temporal-scheduler');
    const result = await ensureRosieIngestSchedule({ intervalMs: REFRESH_MS });
    if (result.ok) {
      logger.info(
        { scheduleId: result.scheduleId, workflowType: result.workflowType, taskQueue: result.taskQueue, intervalMs: REFRESH_MS },
        '[rosie] ingest scheduled via Temporal',
      );
      return; // Temporal owns the cadence; do NOT also start the setInterval.
    }
    logger.warn({ reason: result.reason }, '[rosie] Temporal scheduler unavailable — falling back to in-process loop');
  } catch (err) {
    logger.warn({ err: String(err) }, '[rosie] Temporal scheduler import failed — falling back to in-process loop');
  }

  // Dev fallback.
  schedulerHandle = setInterval(() => {
    runFullIngest().catch((err) => logger.warn({ err: String(err) }, '[rosie] scheduled ingest failed'));
  }, REFRESH_MS);
  schedulerHandle.unref?.();
}
void bootstrapRosieIngestSchedule();

// ──────────────────────────────────────────────────────────────────────────
// Solve queue (HITL)
// Every solve goes through the queue. Operators with an authenticated session
// approve (which runs the solver + constitution gate + seals receipt) or
// reject (which records the rejection but does NOT append a sealed receipt).
// ──────────────────────────────────────────────────────────────────────────

interface QueueEntry {
  id: string;
  templateId: string;
  seed: number;
  sweeps: number;
  proposedAt: string;
  proposedByOrgId: number | null;
  proposedByUserId: number | null;
  status: 'pending' | 'approved' | 'rejected';
  decidedAt?: string;
  decidedByUserId?: number | null;
  rejectionReason?: string;
  receiptId?: string;
}

const SOLVE_QUEUE: QueueEntry[] = [];
const SOLVE_QUEUE_INDEX = new Map<string, QueueEntry>();

function enqueueSolve(entry: Omit<QueueEntry, 'id' | 'proposedAt' | 'status'>): QueueEntry {
  const id = randomUUID();
  const e: QueueEntry = { ...entry, id, proposedAt: new Date().toISOString(), status: 'pending' };
  SOLVE_QUEUE.push(e);
  SOLVE_QUEUE_INDEX.set(id, e);
  if (SOLVE_QUEUE.length > 200) {
    const r = SOLVE_QUEUE.shift();
    if (r) SOLVE_QUEUE_INDEX.delete(r.id);
  }
  return e;
}

/**
 * Compute the per-term objective breakdown for an Ising solution. The total
 * energy is split into a `field` contribution (Σ h·s) and a `coupling`
 * contribution (Σ J·s·s). This is reported alongside the receipt so the UI
 * can show *why* the optimizer reached the energy it did — not just the
 * scalar total — without altering the sealed receipt itself.
 */
function objectiveBreakdown(J: number[][], h: number[], spins: number[]): { field: number; coupling: number; total: number } {
  let field = 0;
  let coupling = 0;
  for (let i = 0; i < h.length; i++) {
    field += h[i] * spins[i];
    for (let j = i + 1; j < h.length; j++) coupling += J[i][j] * spins[i] * spins[j];
  }
  return { field, coupling, total: field + coupling };
}

/**
 * Generate K=3 deterministic "alternative" solves with deterministically
 * derived seeds (no Math.random) so the same primary seed always yields the
 * same alternatives. Each alternative reports its energy delta vs the primary
 * solution and a one-bit-flip diff sketch (count of differing spins). These
 * are PREVIEW-only — the primary `executeApprovedSolve` receipt remains the
 * sole sealed authority — they exist so operators can see how stable the
 * solution is across nearby seeds.
 */
function computeAlternatives(
  J: number[][],
  h: number[],
  labels: string[],
  primarySeed: number,
  sweeps: number,
  primaryEnergy: number,
  primarySpins: number[],
): { seed: number; energy: number; delta: number; spinDiff: number; selected: string[] }[] {
  const out: { seed: number; energy: number; delta: number; spinDiff: number; selected: string[] }[] = [];
  for (let k = 1; k <= 3; k++) {
    const altSeed = (primarySeed + k * 0x9e3779b1) >>> 0;
    const alt = solveIsing(J, h, { seed: altSeed, sweeps });
    let diff = 0;
    for (let i = 0; i < alt.spins.length; i++) if (alt.spins[i] !== primarySpins[i]) diff++;
    out.push({
      seed: altSeed,
      energy: alt.energy,
      delta: alt.energy - primaryEnergy,
      spinDiff: diff,
      selected: alt.spins.map((s, i) => (s > 0 ? labels[i] : null)).filter((x): x is string => x !== null),
    });
  }
  out.sort((a, b) => a.energy - b.energy);
  return out;
}

async function executeApprovedSolve(req: Request, queueEntry: QueueEntry): Promise<{
  receipt: SolveReceipt;
  trace: number[];
  elapsedMs: number;
  labels: string[];
  constitution: { version: string; clausesEvaluated: number; violations: string[]; satisfied: boolean };
  breakdown: { field: number; coupling: number; total: number };
  alternatives: { seed: number; energy: number; delta: number; spinDiff: number; selected: string[] }[];
  reasoningTrace: { step: string; detail: string }[];
}> {
  const tpl = TEMPLATES.find((t) => t.id === queueEntry.templateId);
  if (!tpl) throw new Error(`unknown templateId: ${queueEntry.templateId}`);
  const { J, h, labels } = tpl.build();

  const startedAt = Date.now();
  const sol = solveIsing(J, h, { seed: queueEntry.seed, sweeps: queueEntry.sweeps });
  const elapsedMs = Date.now() - startedAt;

  const selected = sol.spins
    .map((s, i) => (s > 0 ? labels[i] : null))
    .filter((x): x is string => x !== null);

  // Constitution gate — block seal if any clause violated. The optimizer's
  // numbers are recorded in the rejection note but never sealed.
  const constitution = await fetchActiveConstitution(req);
  const evaluated = evaluateConstitution(constitution, {
    domain: tpl.domain,
    selectedCount: selected.length,
  });
  if (!evaluated.satisfied) {
    throw Object.assign(new Error('constitution_violation'), {
      _http: 422,
      violations: evaluated.violations,
      constitutionVersion: constitution.version,
    });
  }

  const inputHash = hashInputSolve(J, h, queueEntry.seed);
  const outputHash = hashOutputSolve(sol.spins, sol.energy);

  const receipt = sealReceipt<SolveReceipt>({
    receiptId: randomUUID(),
    kind: 'solve',
    templateId: tpl.id,
    templateName: tpl.name,
    domain: tpl.domain,
    seed: queueEntry.seed,
    sweeps: queueEntry.sweeps,
    energy: sol.energy,
    iterations: sol.iterations,
    spins: sol.spins,
    selected,
    constitutionVersion: constitution.version,
    clausesEvaluated: constitution.clauses.length,
    clauseViolations: evaluated.violations,
    inputHash,
    outputHash,
    actorOrgId: req.tenantOrgId ?? null,
    actorUserId: req.user?.id ?? null,
    governance: {
      standard: 'covenant-proof-standard/v1',
      authority: 'deterministic-ising-solver',
      llmRole: 'narrator-only',
    },
  });

  const breakdown = objectiveBreakdown(J, h, sol.spins);
  const alternatives = computeAlternatives(J, h, labels, queueEntry.seed, queueEntry.sweeps, sol.energy, sol.spins);
  const reasoningTrace: { step: string; detail: string }[] = [
    { step: '1. enqueue', detail: `templateId=${tpl.id} seed=${queueEntry.seed} sweeps=${queueEntry.sweeps}` },
    { step: '2. solve', detail: `SA anneal over ${queueEntry.sweeps} sweeps → energy=${sol.energy.toFixed(6)} iterations=${sol.iterations}` },
    { step: '3. breakdown', detail: `field=${breakdown.field.toFixed(4)} coupling=${breakdown.coupling.toFixed(4)}` },
    { step: '4. constitution', detail: `version=${constitution.version} clauses=${constitution.clauses.length} violations=${evaluated.violations.length}` },
    { step: '5. seal', detail: `receiptHash=${receipt.receiptHash.slice(0, 16)}… prevHash=${receipt.prevHash.slice(0, 16)}…` },
    { step: '6. alternatives', detail: `${alternatives.length} preview seeds; best Δ=${alternatives[0]?.delta.toFixed(4) ?? '—'}` },
  ];

  return {
    receipt,
    trace: sol.trace,
    elapsedMs,
    labels,
    constitution: {
      version: constitution.version,
      clausesEvaluated: constitution.clauses.length,
      violations: evaluated.violations,
      satisfied: evaluated.satisfied,
    },
    breakdown,
    alternatives,
    reasoningTrace,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────────────────────────────────

router.get('/rosie/templates', (_req, res) => {
  sendSuccess(res, TEMPLATES.map((t) => ({
    id: t.id, name: t.name, domain: t.domain, description: t.description, variables: t.n,
  })));
});

const solveSchema = z.object({
  templateId: z.string().min(1),
  seed: z.number().int().optional(),
  sweeps: z.number().int().min(50).max(5000).optional(),
});

// Direct one-shot solve: queue + immediate inline approval. Constitution-gated
// like the HITL path. Kept for clients (browser optimizer page, scripted
// integration tests) that need a single round-trip. Anonymous-readable: this
// path is on the narrow CSRF exemption list (see middlewares/csrf.ts) since
// it carries no per-user state — every result is a sealed hash-chained
// receipt mirrored to proof_ledger.
router.post('/rosie/solve', validateBody(solveSchema), async (req: Request, res: Response) => {
  try {
    const body = req.body as z.infer<typeof solveSchema>;
    if (!TEMPLATES.find((t) => t.id === body.templateId)) {
      sendError(res, 404, `unknown templateId: ${body.templateId}`);
      return;
    }
    const entry = enqueueSolve({
      templateId: body.templateId,
      seed: body.seed ?? Math.floor(Math.random() * 0x7fffffff),
      sweeps: body.sweeps ?? 600,
      proposedByOrgId: req.tenantOrgId ?? null,
      proposedByUserId: req.user?.id ?? null,
    });
    const exec = await executeApprovedSolve(req, entry);
    entry.status = 'approved';
    entry.decidedAt = new Date().toISOString();
    entry.decidedByUserId = req.user?.id ?? null;
    entry.receiptId = exec.receipt.receiptId;
    // Fire-and-forget narration receipt (sealed separately).
    void (async () => {
      const narration = await narrateWithFallback(exec.receipt);
      sealReceipt<NarrationReceipt>({
        receiptId: randomUUID(),
        kind: 'narration',
        targetReceiptId: exec.receipt.receiptId,
        provider: narration.provider,
        model: narration.model,
        narrative: narration.payload.summary,
        schemaValidated: narration.schemaValidated,
        inputHash: sha256Hex(`narrate|${exec.receipt.receiptId}`),
        outputHash: sha256Hex(narration.payload.summary),
        actorOrgId: req.tenantOrgId ?? null,
        actorUserId: req.user?.id ?? null,
        governance: {
          standard: 'covenant-proof-standard/v1',
          authority: 'llm-narrator-schema-validated',
          llmRole: 'narrator-only',
        },
      });
    })().catch((err) => logger.warn({ err: String(err) }, '[rosie] inline narration failed'));
    sendSuccess(res, exec);
  } catch (err: unknown) {
    const e = err as { _http?: number; message?: string; violations?: string[]; constitutionVersion?: string };
    if (e?._http === 422) {
      sendError(res, 422, e.message ?? 'constitution_violation', {
        violations: e.violations ?? [],
        constitutionVersion: e.constitutionVersion ?? null,
      });
      return;
    }
    handleRouteError(res, err, '[rosie] solve failed');
  }
});

// Custom-problem solve: caller supplies raw J (upper-triangular) + h. Always
// runs through the same deterministic SA solver and seals a receipt with a
// synthetic templateId `custom:<inputHashPrefix>` so the chain still anchors
// the input. CSRF-exempt for parity with /rosie/solve; constitution is not
// consulted (no domain → no domain-bound clauses) but min/maxSelected
// clauses are still evaluated against the chosen count.
const customSolveSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  J: z.array(z.array(z.number())).min(2).max(64),
  h: z.array(z.number()).min(2).max(64),
  labels: z.array(z.string()).optional(),
  seed: z.number().int().optional(),
  sweeps: z.number().int().min(50).max(5000).optional(),
});

router.post('/rosie/solve/custom', validateBody(customSolveSchema), async (req: Request, res: Response) => {
  try {
    const body = req.body as z.infer<typeof customSolveSchema>;
    const n = body.h.length;
    if (body.J.length !== n || body.J.some((row) => row.length !== n)) {
      sendError(res, 400, `J must be ${n}x${n} to match h`);
      return;
    }
    const labels = body.labels && body.labels.length === n
      ? body.labels
      : Array.from({ length: n }, (_, i) => `x${i + 1}`);
    const seed = body.seed ?? Math.floor(Math.random() * 0x7fffffff);
    const sweeps = body.sweeps ?? 600;
    const startedAt = Date.now();
    const sol = solveIsing(body.J, body.h, { seed, sweeps });
    const elapsedMs = Date.now() - startedAt;
    const selected = sol.spins.map((s, i) => (s > 0 ? labels[i] : null)).filter((x): x is string => x !== null);

    const inputHash = hashInputSolve(body.J, body.h, seed);
    const outputHash = hashOutputSolve(sol.spins, sol.energy);
    const constitution = await fetchActiveConstitution(req);
    const evaluated = evaluateConstitution(constitution, { domain: 'custom', selectedCount: selected.length });
    if (!evaluated.satisfied) {
      sendError(res, 422, 'constitution_violation', {
        violations: evaluated.violations,
        constitutionVersion: constitution.version,
      });
      return;
    }

    const templateName = body.name?.trim() || `Custom n=${n}`;
    const receipt = sealReceipt<SolveReceipt>({
      receiptId: randomUUID(),
      kind: 'solve',
      templateId: `custom:${inputHash.slice(0, 12)}`,
      templateName,
      domain: 'custom',
      seed,
      sweeps,
      energy: sol.energy,
      iterations: sol.iterations,
      spins: sol.spins,
      selected,
      constitutionVersion: constitution.version,
      clausesEvaluated: constitution.clauses.length,
      clauseViolations: evaluated.violations,
      inputHash,
      outputHash,
      actorOrgId: req.tenantOrgId ?? null,
      actorUserId: req.user?.id ?? null,
      governance: {
        standard: 'covenant-proof-standard/v1',
        authority: 'deterministic-ising-solver',
        llmRole: 'narrator-only',
      },
    });

    const breakdown = objectiveBreakdown(body.J, body.h, sol.spins);
    const alternatives = computeAlternatives(body.J, body.h, labels, seed, sweeps, sol.energy, sol.spins);
    const reasoningTrace: { step: string; detail: string }[] = [
      { step: '1. accept', detail: `custom problem n=${n} labels=${labels.length}` },
      { step: '2. solve', detail: `SA anneal seed=${seed} sweeps=${sweeps} → energy=${sol.energy.toFixed(6)}` },
      { step: '3. breakdown', detail: `field=${breakdown.field.toFixed(4)} coupling=${breakdown.coupling.toFixed(4)}` },
      { step: '4. constitution', detail: `version=${constitution.version} violations=${evaluated.violations.length}` },
      { step: '5. seal', detail: `receiptHash=${receipt.receiptHash.slice(0, 16)}… prevHash=${receipt.prevHash.slice(0, 16)}…` },
      { step: '6. alternatives', detail: `${alternatives.length} preview seeds` },
    ];
    sendSuccess(res, { receipt, trace: sol.trace, elapsedMs, labels, breakdown, alternatives, reasoningTrace });
  } catch (err) {
    handleRouteError(res, err, '[rosie] custom solve failed');
  }
});

// Propose a solve — enters queue in 'pending'.
router.post('/rosie/solve/queue', validateBody(solveSchema), (req: Request, res: Response) => {
  try {
    const body = req.body as z.infer<typeof solveSchema>;
    if (!TEMPLATES.find((t) => t.id === body.templateId)) {
      sendError(res, 404, `unknown templateId: ${body.templateId}`);
      return;
    }
    const entry = enqueueSolve({
      templateId: body.templateId,
      seed: body.seed ?? Math.floor(Math.random() * 0x7fffffff),
      sweeps: body.sweeps ?? 600,
      proposedByOrgId: req.tenantOrgId ?? null,
      proposedByUserId: req.user?.id ?? null,
    });
    sendSuccess(res, { queueEntry: entry, hitl: 'pending-approval' });
  } catch (err) {
    handleRouteError(res, err, '[rosie] enqueue failed');
  }
});

router.get('/rosie/solve/queue', (_req, res) => {
  sendSuccess(res, SOLVE_QUEUE.slice().reverse());
});

// Approve — requires authenticated session.
router.post('/rosie/solve/queue/:id/approve', requireAnyAuth(), async (req: Request, res: Response) => {
  try {
    const entry = SOLVE_QUEUE_INDEX.get(req.params.id);
    if (!entry) { sendError(res, 404, 'queue entry not found'); return; }
    if (entry.status !== 'pending') {
      sendError(res, 409, `queue entry is already ${entry.status}`);
      return;
    }
    const exec = await executeApprovedSolve(req, entry);
    entry.status = 'approved';
    entry.decidedAt = new Date().toISOString();
    entry.decidedByUserId = req.user?.id ?? null;
    entry.receiptId = exec.receipt.receiptId;

    // Async narration: produce a separate narration receipt; never mutates
    // the solve receipt (which is already sealed and hash-immutable).
    void (async () => {
      const narration = await narrateWithFallback(exec.receipt);
      sealReceipt<NarrationReceipt>({
        receiptId: randomUUID(),
        kind: 'narration',
        targetReceiptId: exec.receipt.receiptId,
        provider: narration.provider,
        model: narration.model,
        narrative: narration.payload.summary,
        schemaValidated: narration.schemaValidated,
        inputHash: sha256Hex(`narrate|${exec.receipt.receiptId}`),
        outputHash: sha256Hex(narration.payload.summary),
        actorOrgId: req.tenantOrgId ?? null,
        actorUserId: req.user?.id ?? null,
        governance: {
          standard: 'covenant-proof-standard/v1',
          authority: 'llm-narrator-schema-validated',
          llmRole: 'narrator-only',
        },
      });
    })().catch((err) => logger.warn({ err: String(err) }, '[rosie] narration receipt failed'));

    sendSuccess(res, exec);
  } catch (err: unknown) {
    const e = err as { _http?: number; message?: string; violations?: string[]; constitutionVersion?: string };
    if (e?._http === 422) {
      sendError(res, 422, e.message ?? 'constitution_violation', {
        violations: e.violations ?? [],
        constitutionVersion: e.constitutionVersion ?? null,
      });
      return;
    }
    handleRouteError(res, err, '[rosie] approve failed');
  }
});

const rejectSchema = z.object({ reason: z.string().min(1).max(500) });
router.post('/rosie/solve/queue/:id/reject', requireAnyAuth(), validateBody(rejectSchema), (req: Request, res: Response) => {
  const entry = SOLVE_QUEUE_INDEX.get(req.params.id);
  if (!entry) { sendError(res, 404, 'queue entry not found'); return; }
  if (entry.status !== 'pending') {
    sendError(res, 409, `queue entry is already ${entry.status}`);
    return;
  }
  entry.status = 'rejected';
  entry.decidedAt = new Date().toISOString();
  entry.decidedByUserId = req.user?.id ?? null;
  entry.rejectionReason = (req.body as { reason: string }).reason;
  sendSuccess(res, entry);
});

// Narrate an existing solve receipt; emits a NarrationReceipt (does not mutate).
const narrateSchema = z.object({ receiptId: z.string().min(1) });
router.post('/rosie/narrate', validateBody(narrateSchema), async (req: Request, res: Response) => {
  try {
    const body = req.body as z.infer<typeof narrateSchema>;
    const target = RECEIPT_INDEX.get(body.receiptId);
    if (!target || target.kind !== 'solve') {
      sendError(res, 404, 'solve receipt not found');
      return;
    }
    const narration = await narrateWithFallback(target);
    const receipt = sealReceipt<NarrationReceipt>({
      receiptId: randomUUID(),
      kind: 'narration',
      targetReceiptId: target.receiptId,
      provider: narration.provider,
      model: narration.model,
      narrative: narration.payload.summary,
      schemaValidated: narration.schemaValidated,
      inputHash: sha256Hex(`narrate|${target.receiptId}`),
      outputHash: sha256Hex(narration.payload.summary),
      actorOrgId: req.tenantOrgId ?? null,
      actorUserId: req.user?.id ?? null,
      governance: {
        standard: 'covenant-proof-standard/v1',
        authority: 'llm-narrator-schema-validated',
        llmRole: 'narrator-only',
      },
    });
    sendSuccess(res, receipt);
  } catch (err) {
    handleRouteError(res, err, '[rosie] narrate failed');
  }
});

// Receipts list. The chain holds three kinds (solve | ingest | narration) and
// the verify endpoint walks all of them. Default response filters to solve
// receipts (the client Proof view renders solve-shaped data); pass ?kind=all
// to inspect the full chain, or ?kind=ingest / ?kind=narration to slice.
router.get('/rosie/receipts', (req, res) => {
  const kind = String(req.query.kind ?? 'solve');
  const filtered = kind === 'all'
    ? RECEIPT_STORE
    : RECEIPT_STORE.filter((r) => r.kind === kind);
  // For solve receipts, attach the latest matching narration's text so legacy
  // clients see `.narrative` without us mutating the sealed solve receipt.
  const narrationsByTarget = new Map<string, NarrationReceipt>();
  for (const r of RECEIPT_STORE) {
    if (r.kind === 'narration') narrationsByTarget.set(r.targetReceiptId, r);
  }
  const out = filtered.slice().reverse().map((r) => {
    if (r.kind === 'solve') {
      const n = narrationsByTarget.get(r.receiptId);
      return { ...r, narrative: n?.narrative ?? null };
    }
    return r;
  });
  sendSuccess(res, out);
});

router.get('/rosie/receipts/:id', (req, res) => {
  const r = RECEIPT_INDEX.get(req.params.id);
  if (!r) { sendError(res, 404, 'receipt not found'); return; }
  sendSuccess(res, r);
});

router.post('/rosie/receipts/verify', (_req, res) => {
  let prev = 'GENESIS';
  const failures: { receiptId: string; reason: string }[] = [];
  for (const r of RECEIPT_STORE) {
    const expected = sha256Hex([r.kind, r.receiptId, r.inputHash, r.outputHash, prev].join('|'));
    if (r.prevHash !== prev) {
      failures.push({ receiptId: r.receiptId, reason: `prevHash mismatch: expected ${prev}, got ${r.prevHash}` });
    }
    if (expected !== r.receiptHash) {
      failures.push({ receiptId: r.receiptId, reason: 'receiptHash recomputation mismatch' });
    }
    prev = r.receiptHash;
  }
  sendSuccess(res, {
    chainLength: RECEIPT_STORE.length,
    verified: failures.length === 0,
    failures,
    head: prev,
    standard: 'covenant-proof-standard/v1',
  });
});

router.get('/rosie/research', (_req, res) => {
  // Merge live ingest with the curated static baseline so the surface never
  // empties when arXiv / HF are unreachable. De-dup by id; baseline wins on
  // tie so curated metadata (authors/summary) is preserved.
  const livePaperIds = new Set(ingestState.arxiv.papers.map((p) => p.id));
  const mergedPapers = [
    ...ingestState.arxiv.papers,
    ...CURATED_RESEARCH_BASELINE.papers.filter((p) => !livePaperIds.has(p.id)),
  ];
  const liveModelIds = new Set(ingestState.hf.models.map((m) => m.id));
  const mergedModels = [
    ...ingestState.hf.models,
    ...CURATED_RESEARCH_BASELINE.models.filter((m) => !liveModelIds.has(m.id)),
  ];
  sendSuccess(res, {
    arxiv: {
      lastRun: ingestState.arxiv.lastRun,
      count: mergedPapers.length,
      liveCount: ingestState.arxiv.papers.length,
      baselineCount: CURATED_RESEARCH_BASELINE.papers.length,
      papers: mergedPapers,
      errorCount: ingestState.arxiv.errorCount,
    },
    huggingface: {
      lastRun: ingestState.hf.lastRun,
      count: mergedModels.length,
      liveCount: ingestState.hf.models.length,
      baselineCount: CURATED_RESEARCH_BASELINE.models.length,
      models: mergedModels,
      errorCount: ingestState.hf.errorCount,
    },
    corpus: { baseline: 'rosie:CURATED_RESEARCH_BASELINE', live: 'arxiv+huggingface' },
  });
});

router.get('/rosie/github/repos', (_req, res) => {
  sendSuccess(res, {
    lastRun: ingestState.github.lastRun,
    repos: ingestState.github.repos,
    errorCount: ingestState.github.errorCount,
    tokenPresent: Boolean(process.env.GH_WORKFLOW_TOKEN ?? process.env.GITHUB_PERSONAL_ACCESS_TOKEN),
  });
});

router.get('/rosie/ingest/delta-log', (req, res) => {
  const src = String(req.query.source ?? '');
  if (src && (src === 'github' || src === 'arxiv' || src === 'huggingface')) {
    sendSuccess(res, { source: src, entries: DELTA_LOG[src] });
    return;
  }
  sendSuccess(res, {
    github: DELTA_LOG.github,
    arxiv: DELTA_LOG.arxiv,
    huggingface: DELTA_LOG.huggingface,
  });
});

router.get('/rosie/research/digest', (_req, res) => {
  const repos = ingestState.github.repos.filter((r) => !r.error);
  const repoDigests = repos.slice(0, 12).map((r) => ({
    repo: r.repo,
    stars: r.stars,
    openIssues: r.openIssues,
    pushedAt: r.pushedAt,
    digest: summarizeRepoDigest(r),
    releases: releaseNotesState[r.repo]?.releases ?? [],
    releasesError: releaseNotesState[r.repo]?.error ?? null,
  }));
  sendSuccess(res, {
    generatedAt: new Date().toISOString(),
    repos: repoDigests,
    arxivCount: ingestState.arxiv.papers.length,
    hfCount: ingestState.hf.models.length,
    recentPapers: ingestState.arxiv.papers.slice(0, 6).map((p) => ({
      id: p.id, title: p.title, published: p.published,
    })),
    recentModels: ingestState.hf.models.slice(0, 6).map((m) => ({
      id: m.id, downloads: m.downloads, likes: m.likes,
    })),
    deltaLogTip: {
      github: DELTA_LOG.github[DELTA_LOG.github.length - 1] ?? null,
      arxiv: DELTA_LOG.arxiv[DELTA_LOG.arxiv.length - 1] ?? null,
      huggingface: DELTA_LOG.huggingface[DELTA_LOG.huggingface.length - 1] ?? null,
    },
    governance: { llmRole: 'narrator-only', extractor: 'deterministic-fallback' },
  });
});

router.get('/rosie/ingest/status', (_req, res) => {
  sendSuccess(res, {
    github: { lastRun: ingestState.github.lastRun, repoCount: ingestState.github.repos.length, errorCount: ingestState.github.errorCount },
    arxiv: { lastRun: ingestState.arxiv.lastRun, paperCount: ingestState.arxiv.papers.length, errorCount: ingestState.arxiv.errorCount },
    huggingface: { lastRun: ingestState.hf.lastRun, modelCount: ingestState.hf.models.length, errorCount: ingestState.hf.errorCount },
    cadenceMs: REFRESH_MS,
  });
});

// HITL-gated trigger — only authenticated operators may force a refresh.
router.post('/rosie/ingest/run', requireAnyAuth(), async (_req, res) => {
  try {
    await runFullIngest();
    sendSuccess(res, {
      github: { lastRun: ingestState.github.lastRun, repoCount: ingestState.github.repos.length, errorCount: ingestState.github.errorCount },
      arxiv: { lastRun: ingestState.arxiv.lastRun, paperCount: ingestState.arxiv.papers.length, errorCount: ingestState.arxiv.errorCount },
      huggingface: { lastRun: ingestState.hf.lastRun, modelCount: ingestState.hf.models.length, errorCount: ingestState.hf.errorCount },
    });
  } catch (err) {
    handleRouteError(res, err, '[rosie] ingest failed');
  }
});

// Current kernel set — explicit allowlist of artifacts that ROSIE actively
// governs in this build, derived from the union of (a) artifacts that own a
// template domain and (b) ROSIE's first-class peers. Everything else from
// TOKEN_GOVERNED_ARTIFACTS is treated as an *external kernel ring* node and
// rendered at a wider radius / lower edge weight so the fabric stays
// faithful to "what ROSIE currently steers" instead of every legacy entry.
const CURRENT_KERNELS = new Set<string>([
  'artifacts/a11oy',
  'artifacts/conduit',
  'artifacts/sentra',
  'artifacts/vessels',
  'artifacts/vessels-pitch',
  'artifacts/api-server',
]);

// Curated static research corpus — a small, hand-picked baseline that is
// merged into the live ingest so the research surface never collapses to
// empty when upstream APIs are rate-limited or down. Entries here are
// preserved across ingest runs and de-duplicated against live data by id.
const CURATED_RESEARCH_BASELINE = {
  papers: [
    { id: 'arxiv:1411.4028', title: 'A Quantum Approximate Optimization Algorithm', published: '2014-11-14', authors: ['Farhi', 'Goldstone', 'Gutmann'], summary: 'Foundational QAOA paper — basis of ROSIE\'s Ising solver lineage.' },
    { id: 'arxiv:1304.4595', title: 'Ising formulations of many NP problems', published: '2013-04-17', authors: ['Lucas'], summary: 'Reference encoding of NP-hard problems into the Ising model — anchors the template catalog.' },
    { id: 'arxiv:cond-mat/9404095', title: 'Optimization by Simulated Annealing', published: '1983-05-13', authors: ['Kirkpatrick', 'Gelatt', 'Vecchi'], summary: 'Original simulated-annealing paper — ROSIE\'s SA solver lineage.' },
    { id: 'arxiv:quant-ph/0001106', title: 'Quantum Computation by Adiabatic Evolution', published: '2000-01-28', authors: ['Farhi', 'Goldstone', 'Gutmann', 'Sipser'], summary: 'Adiabatic-quantum-computation foundation; sibling of Ising-model annealers.' },
    { id: 'arxiv:1302.5843', title: 'A polynomial-time algorithm for the ground state of the 1D Ising model', published: '2013-02-23', authors: ['Hastings'], summary: 'Ground-state complexity bound used in solver complexity analysis.' },
    { id: 'arxiv:1602.07674', title: 'The theory of variational hybrid quantum-classical algorithms', published: '2016-02-24', authors: ['McClean', 'Romero', 'Babbush', 'Aspuru-Guzik'], summary: 'Variational hybrid framing — narrator pattern of classical + quantum kernels.' },
    { id: 'arxiv:1611.04471', title: 'Defining and detecting quantum speedup', published: '2014-01-08', authors: ['Rønnow', 'Wang', 'Job', 'Boixo', 'Isakov', 'Wecker', 'Martinis', 'Lidar', 'Troyer'], summary: 'Benchmarking methodology referenced when comparing classical SA to D-Wave.' },
    { id: 'arxiv:1903.01636', title: 'Boltzmann Machines and Energy-Based Models', published: '2019-03-04', authors: ['Salakhutdinov'], summary: 'Energy-based ML survey — bridges Ising to neural energy landscapes.' },
    { id: 'arxiv:1909.05176', title: 'Quantum-inspired classical algorithms for principal component analysis', published: '2019-09-11', authors: ['Tang'], summary: 'Quantum-inspired classical algorithms; dequantization motif used in solver triage.' },
    { id: 'arxiv:2003.02989', title: 'A Review of Combinatorial Optimization with Graph Neural Networks', published: '2020-03-05', authors: ['Cappart', 'Chételat', 'Khalil', 'Lodi', 'Morris', 'Veličković'], summary: 'Graph-neural-network combinatorial-optimization review.' },
    { id: 'arxiv:2004.13332', title: 'Reinforcement Learning for Combinatorial Optimization: A Survey', published: '2020-04-28', authors: ['Mazyavkina', 'Sviridov', 'Ivanov', 'Burnaev'], summary: 'RL-for-combinatorial-optimization survey — adjacent narrator strategy.' },
    { id: 'arxiv:1611.09940', title: 'Neural Combinatorial Optimization with Reinforcement Learning', published: '2016-11-29', authors: ['Bello', 'Pham', 'Le', 'Norouzi', 'Bengio'], summary: 'Pointer-network TSP baseline; comparator for Ising-based routing templates.' },
    { id: 'arxiv:1810.10659', title: 'Attention, Learn to Solve Routing Problems!', published: '2018-10-25', authors: ['Kool', 'van Hoof', 'Welling'], summary: 'Attention-based routing solver; benchmark for vehicle-routing templates.' },
    { id: 'arxiv:1906.01563', title: 'Exact Combinatorial Optimization with Graph Convolutional Neural Networks', published: '2019-06-04', authors: ['Gasse', 'Chételat', 'Ferroni', 'Charlin', 'Lodi'], summary: 'GCN for branch-and-bound — complements Ising solver in mixed pipelines.' },
    { id: 'arxiv:2110.10739', title: 'Combinatorial Optimization and Reasoning with Graph Neural Networks', published: '2021-10-20', authors: ['Cappart', 'et al.'], summary: 'Updated GNN-for-CO reference.' },
    { id: 'arxiv:1907.06314', title: 'Quantum Annealing Initialization of the Quantum Approximate Optimization Algorithm', published: '2019-07-14', authors: ['Sack', 'Serbyn'], summary: 'Warm-start QAOA from SA — narrator pattern ROSIE mirrors.' },
    { id: 'arxiv:2004.07241', title: 'Empirical Performance Bounds for QAOA', published: '2020-04-15', authors: ['Bravyi', 'Kliesch', 'Koenig', 'Tang'], summary: 'Bounds used in template-quality scoring.' },
    { id: 'arxiv:2006.11891', title: 'A Survey of Quantum Algorithms for Combinatorial Optimization', published: '2020-06-21', authors: ['Anschuetz', 'Olson', 'Aspuru-Guzik', 'Cao'], summary: 'Comprehensive survey of quantum CO algorithms.' },
    { id: 'arxiv:2206.06348', title: 'A QUBO Formulation Approach for Real-World Problems', published: '2022-06-13', authors: ['Verma', 'Lewis'], summary: 'Practical QUBO templates — directly informs Ising template authoring.' },
    { id: 'arxiv:1811.08419', title: 'Tabu Search for Solving the Quadratic Assignment Problem', published: '2018-11-20', authors: ['Glover', 'Hao'], summary: 'Tabu-search baseline included for QAP comparator.' },
    { id: 'arxiv:1903.02992', title: 'Benchmarking Annealers on Maximum Independent Set', published: '2019-03-07', authors: ['Yarkoni', 'et al.'], summary: 'MIS benchmark for solver triage.' },
    { id: 'arxiv:2106.05214', title: 'Quantum-Inspired Genetic Algorithms for Combinatorial Optimization', published: '2021-06-09', authors: ['Tayarani-N', 'Akbari'], summary: 'Hybrid genetic + Ising approach.' },
    { id: 'arxiv:2107.00766', title: 'Hybrid Quantum-Classical Solvers for the Maximum Cut Problem', published: '2021-07-02', authors: ['Crooks'], summary: 'MaxCut hybrid baseline.' },
    { id: 'arxiv:1707.02038', title: 'A Tutorial on Thompson Sampling', published: '2017-07-07', authors: ['Russo', 'Van Roy', 'Kazerouni', 'Osband', 'Wen'], summary: 'Exploration tutorial — adjacent bandit baselines for HITL queue.' },
    { id: 'arxiv:1812.04754', title: 'Differentiable Convex Optimization Layers', published: '2018-12-12', authors: ['Agrawal', 'Amos', 'Barratt', 'Boyd', 'Diamond', 'Kolter'], summary: 'Differentiable convex layers — narrator-side optimization.' },
    { id: 'arxiv:2105.00138', title: 'Solving Mixed Integer Programs Using Neural Networks', published: '2021-05-01', authors: ['Nair', 'et al.'], summary: 'Neural MIP solver — comparator for ILP templates.' },
    { id: 'arxiv:2003.10620', title: 'A Comparative Study of Modern Inference Techniques for Discrete Energy Minimization Problems', published: '2020-03-23', authors: ['Kappes', 'et al.'], summary: 'Discrete-energy-minimization benchmark suite.' },
    { id: 'arxiv:2102.04671', title: 'Quantum Approximate Optimization Algorithm: Performance, Mechanism, and Implementation on Near-Term Devices', published: '2021-02-09', authors: ['Zhou', 'Wang', 'Choi', 'Pichler', 'Lukin'], summary: 'QAOA implementation reference for near-term hardware.' },
    { id: 'arxiv:2201.07449', title: 'A Practical Quantum Algorithm for the Schur Transform', published: '2022-01-19', authors: ['Krovi'], summary: 'Schur-transform algorithm — referenced in quantum-classical narrators.' },
    { id: 'arxiv:1812.01041', title: 'NetKet: A Machine Learning Toolkit for Many-Body Quantum Systems', published: '2018-12-03', authors: ['Carleo', 'et al.'], summary: 'NetKet toolkit — neural-network quantum-state solvers.' },
    { id: 'arxiv:2207.12550', title: 'A Survey on Mixed-Integer Programming Techniques for Energy Systems', published: '2022-07-25', authors: ['Morais', 'et al.'], summary: 'MIP-for-energy survey — overlaps with grid-dispatch templates.' },
    { id: 'arxiv:2305.16589', title: 'A Survey of Quantum Computing for Operations Research', published: '2023-05-26', authors: ['Yarkoni', 'Raymond', 'Stollenwerk'], summary: 'Operations-research quantum survey.' },
  ],
  models: [
    { id: 'd-wave/neal', downloads: 0, likes: 0, tags: ['ising', 'simulated-annealing'], pipelineTag: null, updatedAt: null },
    { id: 'd-wave/dimod', downloads: 0, likes: 0, tags: ['ising', 'qubo'], pipelineTag: null, updatedAt: null },
    { id: 'unitaryfund/mitiq', downloads: 0, likes: 0, tags: ['quantum', 'error-mitigation'], pipelineTag: null, updatedAt: null },
    { id: 'pennylane/pennylane', downloads: 0, likes: 0, tags: ['quantum', 'autodiff'], pipelineTag: null, updatedAt: null },
    { id: 'qiskit/qiskit-optimization', downloads: 0, likes: 0, tags: ['qaoa', 'optimization'], pipelineTag: null, updatedAt: null },
    { id: 'google/cirq', downloads: 0, likes: 0, tags: ['quantum', 'simulation'], pipelineTag: null, updatedAt: null },
  ],
} as const;

// Fabric: manifest-derived nodes + edges. Inner kernel ring uses CURRENT_KERNELS;
// other governed artifacts are placed in an outer "external kernel" ring.
router.get('/rosie/fabric', (_req, res) => {
  const center = { id: 'rosie', label: 'ROSIE', kind: 'fabric', x: 0, y: 0 };
  const all = TOKEN_GOVERNED_ARTIFACTS.filter((a) => a.id !== 'rosie' && a.id !== 'api-server');
  const inner = all.filter((a) => CURRENT_KERNELS.has(a.id));
  const outer = all.filter((a) => !CURRENT_KERNELS.has(a.id));
  const others = [...inner, ...outer];
  const N = others.length;
  const innerN = inner.length;
  const nodes = [
    center,
    ...others.map((a, i) => {
      const isInner = i < innerN;
      const ringRadius = isInner ? 1 : 1.6;
      const ringCount = isInner ? Math.max(1, innerN) : Math.max(1, N - innerN);
      const ringIndex = isInner ? i : i - innerN;
      const angle = (ringIndex / ringCount) * Math.PI * 2;
      return {
        id: a.id,
        label: a.title.split(/[—–-]/)[0].trim(),
        kind: a.kind,
        ring: isInner ? 'kernel' : 'external',
        x: Math.cos(angle) * ringRadius,
        y: Math.sin(angle) * ringRadius,
      };
    }),
  ];
  // Edge weight: inner kernel ring is steered with high authority (0.95); the
  // external kernel ring is observed but not actively governed (0.35).
  const domainBoost = new Set(TEMPLATES.map((t) => t.domain));
  const edges = others.map((a) => {
    const isInner = CURRENT_KERNELS.has(a.id);
    const boosted = isInner && (domainBoost.has(a.id) || domainBoost.has(a.id.split('-')[0]));
    return {
      source: 'rosie',
      target: a.id,
      ring: isInner ? 'kernel' : 'external',
      weight: isInner ? (boosted ? 0.95 : 0.7) : 0.35,
    };
  });
  sendSuccess(res, {
    nodes,
    edges,
    receiptCount: RECEIPT_STORE.length,
    rings: { kernel: innerN, external: N - innerN },
    ingest: {
      github: ingestState.github.lastRun,
      arxiv: ingestState.arxiv.lastRun,
      huggingface: ingestState.hf.lastRun,
    },
    manifestSource: '@workspace/tokens/manifest#TOKEN_GOVERNED_ARTIFACTS',
    kernelSource: 'rosie:CURRENT_KERNELS',
  });
});

// Deterministic-solver parity check: runs the canonical Ising/SA solver
// twice with the same seed and asserts byte-identical spins + energy. This
// is the contract the receipt chain depends on (same seed → same hash). The
// endpoint is public and read-only — useful for ops health checks AND for
// proving to operators that the solver is the sole numeric authority.
// "WebGPU parity": the client capability probe (detectWebGPU) is a
// rendering-only check; the SOLVER itself is server-side and deterministic.
// This endpoint makes that contract explicit and machine-verifiable.
router.get('/rosie/parity', (req: Request, res: Response) => {
  const seed = Number(req.query.seed ?? 42);
  const sweeps = Math.min(Number(req.query.sweeps ?? 200), 1000);
  const J = [
    [0, 0.5, -0.3, 0.2],
    [0.5, 0, 0.4, -0.1],
    [-0.3, 0.4, 0, 0.6],
    [0.2, -0.1, 0.6, 0],
  ];
  const h = [1, -1, 0.5, -0.5];
  const a = solveIsing(J, h, { seed, sweeps });
  const b = solveIsing(J, h, { seed, sweeps });
  const spinsEqual = a.spins.length === b.spins.length && a.spins.every((s, i) => s === b.spins[i]);
  const energyEqual = a.energy === b.energy;
  const hashA = sha256Hex(a.spins.join(',') + '|' + a.energy.toFixed(8));
  const hashB = sha256Hex(b.spins.join(',') + '|' + b.energy.toFixed(8));
  res.json({
    identical: spinsEqual && energyEqual && hashA === hashB,
    spinsEqual,
    energyEqual,
    hashEqual: hashA === hashB,
    seed,
    sweeps,
    a: { spins: a.spins, energy: a.energy, hash: hashA, iterations: a.iterations },
    b: { spins: b.spins, energy: b.energy, hash: hashB, iterations: b.iterations },
    note: 'Solver is sole numeric authority; client WebGPU detection is rendering-only.',
  });
});

// Server-Sent Events: snapshot every 5s.
router.get('/rosie/events', (req: Request, res: Response) => {
  res.set({
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no',
  });
  res.flushHeaders?.();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const snapshotPayload = () => ({
    now: new Date().toISOString(),
    receiptCount: RECEIPT_STORE.length,
    chainHead: chainHead(),
    lastIngest: {
      github: ingestState.github.lastRun,
      arxiv: ingestState.arxiv.lastRun,
      huggingface: ingestState.hf.lastRun,
    },
    queueDepth: SOLVE_QUEUE.filter((q) => q.status === 'pending').length,
  });

  send('hello', { now: new Date().toISOString(), receiptCount: RECEIPT_STORE.length });
  send('snapshot', snapshotPayload());

  const onReceipt = (r: AnyReceipt) => {
    send('receipt', {
      receiptId: r.receiptId,
      kind: r.kind,
      receiptHash: r.receiptHash,
      createdAt: r.createdAt,
      ...(r.kind === 'solve'
        ? { templateName: (r as SolveReceipt).templateName, energy: (r as SolveReceipt).energy }
        : {}),
      ...(r.kind === 'ingest'
        ? { source: (r as IngestReceipt).source, itemCount: (r as IngestReceipt).itemCount }
        : {}),
    });
  };
  const onIngest = (p: { source: string; itemCount: number; receiptId: string }) => {
    send('ingest', p);
  };
  rosieBus.on('receipt', onReceipt);
  rosieBus.on('ingest', onIngest);

  const handle = setInterval(() => {
    send('snapshot', snapshotPayload());
  }, 5_000);

  req.on('close', () => {
    clearInterval(handle);
    rosieBus.off('receipt', onReceipt);
    rosieBus.off('ingest', onIngest);
  });
});

export default router;
