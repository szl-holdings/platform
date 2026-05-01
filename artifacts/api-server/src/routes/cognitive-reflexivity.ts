/**
 * Cognitive Reflexivity API
 * ----------------------------------------------------------------------------
 * HTTP surface for the @workspace/cognitive-reflexivity engine. Provides:
 *
 *  - GET  /cognitive-reflexivity/strategies      — list strategies (filterable)
 *  - GET  /cognitive-reflexivity/strategies/:id  — strategy detail + provenance
 *  - POST /cognitive-reflexivity/strategies/:id/approve  — operator approval
 *  - POST /cognitive-reflexivity/strategies/:id/reject   — operator rejection
 *  - GET  /cognitive-reflexivity/traces          — recent decision traces
 *  - GET  /cognitive-reflexivity/health          — health score + components
 *  - POST /cognitive-reflexivity/observations    — emit a cognitive signal
 *  - GET  /cognitive-reflexivity/recent-signals  — last N signals
 *
 * The engine is bootstrapped once in `index.ts` via getReflexivityRuntime().
 */

import { Router, type IRouter, type Request, type Response } from 'express';
import { z } from 'zod';
import { getReflexivityRuntime } from '../lib/cognitive-reflexivity-runtime';

const router: IRouter = Router();

// IMPORTANT: keep these enums in lockstep with
// packages/cognitive-reflexivity/src/types.ts (StrategyStatusSchema /
// StrategyTierSchema). Sending an enum value not in the engine model would
// silently match nothing and look like a bug to operators.
const StrategyFilterSchema = z.object({
  status: z.enum(['proposed', 'approved', 'active', 'rejected', 'retired']).optional(),
  klass: z.string().optional(),
  tier: z.enum(['advisory', 'supervised', 'operator-approved', 'dual-approved']).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional().default(100),
});

router.get('/cognitive-reflexivity/strategies', (req: Request, res: Response) => {
  const parsed = StrategyFilterSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_query', issues: parsed.error.issues });
  }
  const runtime = getReflexivityRuntime();
  const all = runtime.registry.list({
    status: parsed.data.status,
    klass: parsed.data.klass,
    tier: parsed.data.tier,
  });
  res.json({ strategies: all.slice(0, parsed.data.limit), total: all.length });
});

router.get('/cognitive-reflexivity/strategies/:id', (req: Request, res: Response) => {
  const runtime = getReflexivityRuntime();
  const s = runtime.registry.get(req.params.id);
  if (!s) return res.status(404).json({ error: 'not_found' });
  res.json({ strategy: s });
});

router.post('/cognitive-reflexivity/strategies/:id/approve', (req: Request, res: Response) => {
  const runtime = getReflexivityRuntime();
  const operator =
    (req.body && typeof req.body.operator === 'string' && req.body.operator) || 'operator:unknown';
  try {
    const s = runtime.registry.approve(req.params.id, operator);
    res.json({ strategy: s });
  } catch (e) {
    res.status(404).json({ error: 'not_found_or_invalid', message: (e as Error).message });
  }
});

router.post('/cognitive-reflexivity/strategies/:id/reject', (req: Request, res: Response) => {
  const runtime = getReflexivityRuntime();
  const operator =
    (req.body && typeof req.body.operator === 'string' && req.body.operator) || 'operator:unknown';
  const reason = (req.body && typeof req.body.reason === 'string' && req.body.reason) || 'rejected';
  try {
    const s = runtime.registry.reject(req.params.id, operator, reason);
    res.json({ strategy: s });
  } catch (e) {
    res.status(404).json({ error: 'not_found_or_invalid', message: (e as Error).message });
  }
});

router.get('/cognitive-reflexivity/traces', (req: Request, res: Response) => {
  const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 100));
  const runtime = getReflexivityRuntime();
  res.json({ traces: runtime.registry.recentTraces().slice(0, limit) });
});

router.get('/cognitive-reflexivity/health', (_req: Request, res: Response) => {
  const runtime = getReflexivityRuntime();
  const score = runtime.computeHealth();
  res.json(score);
});

const ObservationSchema = z.object({
  subtype: z.string().min(1).max(80),
  observation: z.string().min(1).max(2000),
  intensity: z.number().min(0).max(1).optional().default(0.5),
  evidenceRefs: z.array(z.string()).max(50).optional().default([]),
  data: z.record(z.string(), z.unknown()).optional(),
  source: z.string().optional(),
});

router.post('/cognitive-reflexivity/observations', (req: Request, res: Response) => {
  const parsed = ObservationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_payload', issues: parsed.error.issues });
  }
  const runtime = getReflexivityRuntime();
  try {
    runtime.engine.emit({
      subtype: parsed.data.subtype,
      observation: parsed.data.observation,
      intensity: parsed.data.intensity,
      evidenceRefs: parsed.data.evidenceRefs,
      data: parsed.data.data,
      source: parsed.data.source,
    });
  } catch (err) {
    return res.status(400).json({
      error: 'invalid_subtype',
      message: err instanceof Error ? err.message : String(err),
      hint: 'subtype must be one of the cognitive-reflexive enum values (router.*, detection.*, sync.*, cognition.*, memory.*).',
    });
  }
  res.status(202).json({ status: 'accepted' });
});

router.get('/cognitive-reflexivity/recent-signals', (_req: Request, res: Response) => {
  const runtime = getReflexivityRuntime();
  res.json({ signals: runtime.recentSignals() });
});

export default router;
