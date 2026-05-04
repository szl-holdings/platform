/**
 * POST /v1/guard — Lambda-as-a-Service (LaaS)
 *
 * Public developer-facing endpoint that runs the full A11oy orchestrator
 * pipeline per request:
 *
 *   1. Guardrails (14 rails, tamper-evident receipt sealing)
 *   2. Lambda-9 (9-axis formal Lutar Invariant)
 *   3. Convergence Pulse (real-time trust heartbeat)
 *   4. Adaptive Depth Routing (cost optimization)
 *
 * Returns a sealed receipt with per-axis breakdown, routing decision,
 * and live pulse reading. One POST, one canonical trust artifact.
 *
 * GET /v1/guard/pulse  — current Convergence Pulse (read-only)
 * GET /v1/guard/axes   — axis catalogue + provenance
 * GET /v1/guard/health — service manifest
 */

import { Router, type IRouter, type Request, type Response } from 'express';
import { z } from 'zod';
import { A11oyOrchestrator } from '@workspace/ouroboros-integrations';

const router: IRouter = Router();

const laasOrchestrator = new A11oyOrchestrator({ pulseConfig: { windowSize: 200 } });

const V1GuardSchema = z.object({
  subject: z.string().min(1).max(256),
  prompt: z.string().min(1).max(32768),
  response: z.string().max(65536).optional(),
  citations: z.number().int().nonnegative().optional(),
  witnessCount: z.number().int().nonnegative().optional(),
  priorLambda: z.number().min(0).max(1).optional(),
  axisOverrides: z.object({
    cleanliness: z.number().min(0).max(1).optional(),
    horizon: z.number().min(0).max(1).optional(),
    resonance: z.number().min(0).max(1).optional(),
    frustum: z.number().min(0).max(1).optional(),
    gaussClosure: z.number().min(0).max(1).optional(),
    invariance: z.number().min(0).max(1).optional(),
    moralGrounding: z.number().min(0).max(1).optional(),
    ontologicalGrounding: z.number().min(0).max(1).optional(),
    measurabilityHonesty: z.number().min(0).max(1).optional(),
  }).strict().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

router.post('/v1/guard', async (req: Request, res: Response) => {
  const parsed = V1GuardSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'INVALID_GUARD_REQUEST',
      message: parsed.error.message,
      details: parsed.error.flatten(),
    });
    return;
  }

  try {
    const result = await laasOrchestrator.guard({
      ...parsed.data,
      axisOverrides: parsed.data.axisOverrides,
    });

    const receipt = result.receipt;
    const lambda9 = receipt.lambda9;

    res.json({
      requestId: result.requestId,
      version: 'v1',
      lambda: lambda9?.invariant ?? receipt.lambda,
      action: receipt.action,
      axes: lambda9 ? {
        values: lambda9.axisValues,
        formula: lambda9.formula,
        bound: lambda9.bound,
        weightSumExact: lambda9.weightSumExact,
        weight: lambda9.weight,
      } : null,
      routing: {
        modelTier: result.routing.modelTier,
        verificationPasses: result.routing.verificationPasses,
        skipExpensivePrimitives: result.routing.skipExpensivePrimitives,
        estimatedCostMultiplier: result.routing.estimatedCostMultiplier,
        rationale: result.routing.rationale,
      },
      pulse: {
        currentLambda: result.pulse.currentLambda,
        trajectory: result.pulse.trajectory,
        deltaPerSecond: result.pulse.deltaPerSecond,
        alertLevel: result.pulse.alertLevel,
        weakestAxis: result.pulse.weakestAxis,
        weakestAxisValue: result.pulse.weakestAxisValue,
        predictedBreachMs: result.pulse.predictedBreachMs,
      },
      receipt: {
        id: receipt.id,
        version: receipt.version,
        issuedAt: receipt.issuedAt,
        contentHash: receipt.contentHash,
        seal: receipt.seal,
        railCount: receipt.rails?.length ?? 0,
      },
      timestamp: result.timestamp,
    });
  } catch (e) {
    res.status(500).json({
      error: 'GUARD_PIPELINE_ERROR',
      message: (e as Error).message,
    });
  }
});

router.get('/v1/guard/pulse', (_req: Request, res: Response) => {
  const pulse = laasOrchestrator.currentPulse();
  const stats = laasOrchestrator.stats();
  res.json({
    pulse,
    stats: {
      totalGuards: stats.totalGuards,
      engineVersion: stats.engineVersion,
      costSavings: stats.costSavings,
    },
  });
});

router.get('/v1/guard/axes', (_req: Request, res: Response) => {
  res.json({
    version: 'v1',
    axisCount: 9,
    axes: [
      { key: 'cleanliness', symbol: 'C', name: 'Cleanliness', source: '@workspace/ouroboros-anchor', description: 'Cryptographic witness verification' },
      { key: 'horizon', symbol: 'H', name: 'Horizon', source: '@workspace/ouroboros-horizon', description: 'Page-curve bounded reversibility' },
      { key: 'resonance', symbol: 'R', name: 'Resonance', source: '@workspace/ouroboros-resonance', description: 'Q-factor / Landauer ceiling' },
      { key: 'frustum', symbol: 'F', name: 'Frustum', source: '@workspace/reconciliation', description: 'Three-witness Jaccard reconciliation' },
      { key: 'gaussClosure', symbol: 'G', name: 'Gauss Closure', source: '@workspace/ouroboros-gauss', description: 'Least-squares network adjustment' },
      { key: 'invariance', symbol: 'I', name: 'Invariance', source: '@workspace/ouroboros-blanca', description: 'Lorentz / equivalence / EPR-bound' },
      { key: 'moralGrounding', symbol: 'M', name: 'Moral Grounding', source: '@workspace/ouroboros-oppenheimer', description: 'Oppenheimer accountability ledger' },
      { key: 'ontologicalGrounding', symbol: 'B', name: 'Ontological Grounding', source: '@workspace/ouroboros-socrates', description: 'Socratic divided-line ontic grounding' },
      { key: 'measurabilityHonesty', symbol: 'N', name: 'Measurability Honesty', source: '@workspace/ouroboros-lara', description: 'Jamneshan-Shalom-Tao gap declarations' },
    ],
    formula: 'L9 = C^(1/9) * H^(1/9) * R^(1/9) * F^(1/9) * G^(1/9) * I^(1/9) * M^(1/9) * B^(1/9) * N^(1/9)',
    bound: '0 <= L9 <= min(axes) <= max(axes) <= 1',
    weights: 'Egyptian unit fraction 1/9 per axis (inspectable, sum-exact)',
  });
});

router.get('/v1/guard/health', (_req: Request, res: Response) => {
  const stats = laasOrchestrator.stats();
  res.json({
    service: 'Lambda-as-a-Service (LaaS)',
    version: 'v1',
    status: 'operational',
    engineVersion: stats.engineVersion,
    axisCount: 9,
    railCount: 14,
    differentiator: 'Closed-form L9 scalar + tamper-evident receipt + Convergence Pulse + Adaptive Depth Routing',
    compete_with: 'NVIDIA NeMo Guardrails, Guardrails AI',
    compliance: 'EU AI Act Art 12, NIST SP 800-53 AU-12, SR 11-7, DoD CDAO RAI Traceable',
    lineage: 'SZL Holdings / Ouroboros / ORCID 0009-0001-0110-4173',
    totalGuards: stats.totalGuards,
    currentPulse: stats.currentPulse.alertLevel,
  });
});

export default router;
