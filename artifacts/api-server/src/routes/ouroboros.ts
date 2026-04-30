/**
 * Ouroboros v4 Runtime Routes
 *
 * Exposes the operational surface of replit_innovate_full_payload v4.0.0:
 * the A11oy control plane, Sentra/Amaru ingestion contracts, validator
 * registry, innovation engine, output paths, and v4 proof-route + domain
 * pack aliases. Backed by the pure @workspace/ouroboros runtime kernel.
 *
 * Mounting (see routes/index.ts):
 *   /api/ouroboros/manifest          — payload version, control plane, packs, cycles
 *   /api/ouroboros/validators        — validator registry
 *   /api/ouroboros/validators/check  — POST: classify validator results, return halt
 *   /api/ouroboros/packs             — domain pack registry (12 packs incl Sentra/Amaru)
 *   /api/ouroboros/route             — POST: route a task to a pack via TASK_TO_PACK_V4
 *   /api/ouroboros/proof-routes      — proof-route catalog with v4 aliases
 *   /api/ouroboros/innovation        — innovation engine loops + validation status
 *   /api/ouroboros/output-paths      — canonical output/* path constants
 *   /api/ouroboros/ingest/sentra     — POST: validate a Sentra ingestion payload
 *   /api/ouroboros/ingest/amaru      — POST: validate an Amaru ingestion payload
 *   /api/ouroboros/cycles            — almanac cycles (v3 + v4 aliases)
 *
 * All endpoints require an authenticated session. Mutating ingestion
 * endpoints additionally require the `admin` role since they exercise
 * runtime validators that drive halt/escalate decisions.
 */

import { type IRouter, Router } from 'express';
import { z } from 'zod';
import {
  // validator runtime
  VALIDATOR_REGISTRY,
  summarizeValidators,
  // domain packs
  DOMAIN_PACKS,
  TASK_TO_PACK,
  TASK_TO_PACK_V4,
  // proof routes
  PROOF_ROUTES,
  ROUTE_ID_V2_ALIASES,
  ROUTE_ID_V4_ALIASES,
  resolveV4ProofRouteId,
  // ingestion contracts
  INGESTION_CONTRACTS,
  validateIngestion,
  // innovation engine
  INNOVATION_LOOPS,
  INNOVATION_ENGINE_DEFAULT,
  validateInnovationEngine,
  // output paths
  OUTPUT_PATHS,
  resolveOutputPath,
  // almanac
  V3_CYCLES,
  V4_CYCLES,
  CYCLE_ID_V4_ALIASES,
} from '@workspace/ouroboros';
import { logger } from '../lib/logger.js';
import { authMiddleware, requireRole } from '../middlewares/auth.js';

const router: IRouter = Router();

// All ouroboros runtime endpoints require an authenticated session.
router.use(authMiddleware());

// ---------------------------------------------------------------------------
// GET /manifest — top-level v4 contract overview
// ---------------------------------------------------------------------------
router.get('/manifest', (_req, res) => {
  res.json({
    ok: true,
    data: {
      payload_version: '4.0.0',
      payload_name: 'replit_innovate_full_payload',
      control_plane: 'A11oy_core',
      ecosystem_runtimes: {
        A11oy: 'online',
        Sentra: 'ingest_ready',
        Amaru: 'ingest_ready',
      },
      counts: {
        validators: Object.keys(VALIDATOR_REGISTRY).length,
        domain_packs: Object.keys(DOMAIN_PACKS).length,
        proof_routes: PROOF_ROUTES.length,
        innovation_loops: INNOVATION_LOOPS.length,
        output_paths: Object.keys(OUTPUT_PATHS).length,
        v3_cycles: V3_CYCLES.length,
        v4_cycles: V4_CYCLES.length,
      },
    },
  });
});

// ---------------------------------------------------------------------------
// GET /validators
// ---------------------------------------------------------------------------
router.get('/validators', (_req, res) => {
  res.json({ ok: true, data: VALIDATOR_REGISTRY });
});

// POST /validators/check — classify validator results, return halt summary
const validatorCheckSchema = z.object({
  results: z
    .array(
      z.object({
        validator_id: z.string().min(1),
        passed: z.boolean(),
        message: z.string().optional(),
      })
    )
    .max(64),
});

router.post('/validators/check', (req, res) => {
  const parsed = validatorCheckSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }
  try {
    const summary = summarizeValidators(parsed.data.results);
    return res.json({ ok: true, data: summary });
  } catch (err) {
    logger.warn({ err }, '[ouroboros] validators/check error');
    return res.status(500).json({ ok: false, error: 'validator summary failed' });
  }
});

// ---------------------------------------------------------------------------
// GET /packs — domain pack registry
// ---------------------------------------------------------------------------
router.get('/packs', (_req, res) => {
  res.json({
    ok: true,
    data: {
      packs: DOMAIN_PACKS,
      task_to_pack_v3: TASK_TO_PACK,
      task_to_pack_v4: TASK_TO_PACK_V4,
    },
  });
});

// POST /route — route a task to a domain pack (prefer v4 routing)
const routeSchema = z.object({
  task_type: z.string().min(1).max(64),
  prefer: z.enum(['v3', 'v4']).default('v4'),
});

router.post('/route', (req, res) => {
  const parsed = routeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }
  const { task_type, prefer } = parsed.data;
  const v4 = (TASK_TO_PACK_V4 as Record<string, string | undefined>)[task_type];
  const v3 = (TASK_TO_PACK as Record<string, string | undefined>)[task_type];
  const pack_id = (prefer === 'v4' ? v4 ?? v3 : v3 ?? v4) ?? 'A11oy_core';
  return res.json({
    ok: true,
    data: {
      task_type,
      pack_id,
      pack: DOMAIN_PACKS[pack_id as keyof typeof DOMAIN_PACKS] ?? null,
      via: v4 && prefer === 'v4' ? 'TASK_TO_PACK_V4' : 'TASK_TO_PACK',
    },
  });
});

// ---------------------------------------------------------------------------
// GET /proof-routes
// ---------------------------------------------------------------------------
router.get('/proof-routes', (_req, res) => {
  res.json({
    ok: true,
    data: {
      routes: PROOF_ROUTES,
      v2_aliases: ROUTE_ID_V2_ALIASES,
      v4_aliases: ROUTE_ID_V4_ALIASES,
    },
  });
});

router.get('/proof-routes/resolve/:label', (req, res) => {
  const resolved = resolveV4ProofRouteId(req.params.label);
  if (!resolved) {
    return res.status(404).json({ ok: false, error: `unknown proof route '${req.params.label}'` });
  }
  return res.json({ ok: true, data: { input: req.params.label, route_id: resolved } });
});

// ---------------------------------------------------------------------------
// GET /innovation
// ---------------------------------------------------------------------------
router.get('/innovation', (_req, res) => {
  const missing = validateInnovationEngine(INNOVATION_ENGINE_DEFAULT);
  res.json({
    ok: true,
    data: {
      loops: INNOVATION_LOOPS,
      enabled: INNOVATION_ENGINE_DEFAULT.enabled,
      missingLoops: missing,
      complete: missing.length === 0,
    },
  });
});

// ---------------------------------------------------------------------------
// GET /output-paths
// ---------------------------------------------------------------------------
router.get('/output-paths', (_req, res) => {
  res.json({ ok: true, data: OUTPUT_PATHS });
});

router.get('/output-paths/:key', (req, res) => {
  const path = resolveOutputPath(req.params.key);
  if (!path) {
    return res.status(404).json({ ok: false, error: `unknown output path key '${req.params.key}'` });
  }
  return res.json({ ok: true, data: { key: req.params.key, path } });
});

// ---------------------------------------------------------------------------
// POST /ingest/sentra — Sentra ingestion contract validation
// POST /ingest/amaru  — Amaru  ingestion contract validation
// Admin-only: these mutate runtime trust by exercising validators.
// ---------------------------------------------------------------------------
const ingestSchema = z.object({
  ingest_type: z.string().min(1).max(64),
  validator_results: z
    .array(
      z.object({
        validator_id: z.string().min(1),
        passed: z.boolean(),
        message: z.string().optional(),
      })
    )
    .max(64),
  outputs: z.array(z.string().min(1).max(64)).max(32),
});

function runIngestion(target: 'Sentra' | 'Amaru', body: unknown) {
  const parsed = ingestSchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400 as const, payload: { ok: false, error: parsed.error.flatten() } };
  }
  const passedValidators = new Set(
    parsed.data.validator_results.filter((v) => v.passed).map((v) => v.validator_id),
  );
  const presentOutputs = new Set(parsed.data.outputs);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errors = validateIngestion({
    target,
    ingestType: parsed.data.ingest_type,
    presentOutputs: presentOutputs as any,
    passedValidators: passedValidators as any,
  });
  const validatorSummary = summarizeValidators(parsed.data.validator_results);
  return {
    status: 200 as const,
    payload: {
      ok: true,
      data: {
        target,
        ingestType: parsed.data.ingest_type,
        admissible: errors.length === 0 && !validatorSummary.halt,
        contractErrors: errors,
        validatorSummary,
      },
    },
  };
}

router.post('/ingest/sentra', requireRole('admin'), (req, res) => {
  try {
    const out = runIngestion('Sentra', req.body);
    return res.status(out.status).json(out.payload);
  } catch (err) {
    logger.warn({ err }, '[ouroboros] ingest/sentra error');
    return res.status(500).json({ ok: false, error: 'ingestion validation failed' });
  }
});

router.post('/ingest/amaru', requireRole('admin'), (req, res) => {
  try {
    const out = runIngestion('Amaru', req.body);
    return res.status(out.status).json(out.payload);
  } catch (err) {
    logger.warn({ err }, '[ouroboros] ingest/amaru error');
    return res.status(500).json({ ok: false, error: 'ingestion validation failed' });
  }
});

// Read-only ingestion contract definitions
router.get('/ingest/contracts', (_req, res) => {
  res.json({ ok: true, data: INGESTION_CONTRACTS });
});

// ---------------------------------------------------------------------------
// GET /cycles — almanac cycles + v4 aliases
// ---------------------------------------------------------------------------
router.get('/cycles', (_req, res) => {
  res.json({
    ok: true,
    data: {
      v3: V3_CYCLES,
      v4: V4_CYCLES,
      v4_aliases: CYCLE_ID_V4_ALIASES,
    },
  });
});

export default router;
