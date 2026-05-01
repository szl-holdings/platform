/**
 * Ouroboros · Gauß axis · Public API surface (SZL Holdings, 2026)
 *
 *   GET  /api/ouroboros/gauss/health   → framework header + primitive list
 *   POST /api/ouroboros/gauss/fit      → body { A, b, noiseSigma? } →
 *                                        least-squares network adjustment +
 *                                        closure axis G ∈ [0,1]
 *   POST /api/ouroboros/gauss/residuals → body { residuals } →
 *                                          Gaussian goodness-of-fit
 *                                          (Jarque–Bera) on supplied residuals
 *
 * All endpoints are stateless, Zod-validated, public (no auth/CSRF).
 *
 * Operationalises Primitives 17 + 20 from the Ouroboros v5 payload
 * (Gauß Nachlass, Cod. Ms. Gauß, Theoria combinationis 1823 / Theoria
 * motus 1809). The closure axis G is designed to plug into the SIGIL
 * weighted-geometric envelope as an additional convergence input.
 */

import type { IRouter } from 'express';
import { z } from 'zod';
import { sendError } from '../lib/api-response.js';
import {
  leastSquares,
  gaussClosureAxis,
  residualFit,
  type LeastSquaresInput,
} from '../lib/ouroboros-gauss/index.js';

const matrixSchema = z
  .array(z.array(z.number().finite()).min(1))
  .min(1)
  .max(256);

const fitSchema = z.object({
  A: matrixSchema,
  b: z.array(z.number().finite()).min(1).max(256),
  noiseSigma: z.number().positive().finite().optional(),
});

const residualsSchema = z.object({
  residuals: z.array(z.number().finite()).min(2).max(4096),
});

export function register(router: IRouter): void {
  router.get('/ouroboros/gauss/health', (_req, res) => {
    res.json({
      framework: 'Ouroboros · Gauß axis',
      version: 'v5.0',
      primitives: [
        { id: 17, name: 'Least-squares network adjustment', source: 'Theoria combinationis 1823' },
        { id: 20, name: 'Residual goodness-of-fit (Jarque–Bera)', source: 'Theoria motus 1809' },
      ],
      lineage:
        'Carl Friedrich Gauß Nachlass · Cod. Ms. Gauß · SUB Göttingen · Kalliope DE-611-BF-61709 · GND 104234644',
      closure_axis: 'G = exp(−||r||²₂ / (m · σ²)) ∈ (0,1]',
    });
  });

  router.post('/ouroboros/gauss/fit', (req, res) => {
    const parsed = fitSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Invalid least-squares payload', 400, 'VALIDATION_ERROR');
      return;
    }
    const { A, b, noiseSigma } = parsed.data;
    if (b.length !== A.length) {
      sendError(res, 'b length must equal row count of A', 400, 'GAUSS_SHAPE_MISMATCH');
      return;
    }
    const cols = A[0]!.length;
    if (A.some(row => row.length !== cols)) {
      sendError(res, 'A is ragged (rows have different lengths)', 400, 'GAUSS_RAGGED_MATRIX');
      return;
    }
    if (A.length < cols) {
      sendError(res, 'system is under-determined: rows < cols', 400, 'GAUSS_UNDERDETERMINED');
      return;
    }
    try {
      const report = leastSquares({ A, b } as LeastSquaresInput);
      const G = gaussClosureAxis(report, noiseSigma ?? 1);
      res.json({
        report,
        closureAxis: G,
        envelope: 'G ∈ (0,1] · 1 = perfectly closed witness network · 0 = divergent',
      });
    } catch (e) {
      sendError(res, (e as Error).message, 400, 'GAUSS_LAW_VIOLATION');
    }
  });

  router.post('/ouroboros/gauss/residuals', (req, res) => {
    const parsed = residualsSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Invalid residuals payload', 400, 'VALIDATION_ERROR');
      return;
    }
    try {
      const report = residualFit(parsed.data.residuals);
      res.json({
        report,
        interpretation:
          'Jarque–Bera ~ χ²(2). High JB means residuals deviate from Gaussian — possible adversarial bias.',
      });
    } catch (e) {
      sendError(res, (e as Error).message, 400, 'GAUSS_RESIDUAL_ERROR');
    }
  });
}
