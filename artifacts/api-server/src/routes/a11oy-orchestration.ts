/**
 * /api/a11oy/orchestration-traces — surface the in-memory ring of
 * `runOrchestration` traces from `@szl/a11oy-runtime` so the
 * reliquary can join sequence-pipeline stage receipts to Λ verdicts.
 *
 * Read-only by default. A POST handler exists for demo purposes
 * (seeds a deterministic trace so the reliquary panel is never blank
 * in a freshly-booted environment) and is rate-limited via the
 * standard writeLimiter.
 */
import { Router, type Request, type Response } from 'express';
import {
  getRecentOrchestrationTraces,
  runOrchestration,
  peaksToAmiContribution,
  type OrchestrationTrace,
} from '@szl/a11oy-runtime';
import { writeLimiter } from '../middlewares/rate-limiters';

const router = Router();

function ok<T>(res: Response, data: T): void {
  res.json({ ok: true, data, meta: { timestamp: new Date().toISOString() } });
}

function projectTrace(trace: OrchestrationTrace<unknown>) {
  return {
    pipelineId: trace.pipelineId,
    startedAt: trace.startedAt,
    finishedAt: trace.finishedAt,
    decision: trace.decision,
    lambdaReceiptId: trace.lambdaReceiptId,
    lambdaScore: trace.verdict.lambda_score,
    vertical: trace.verdict.receipt.vertical,
    action: trace.verdict.receipt.action,
    stages: trace.stages.map((s) => ({
      stageName: s.stageName,
      stageOrdinal: s.stageOrdinal,
      receiptClass: s.receiptClass,
      inputsHash: s.inputsHash,
      paramsHash: s.paramsHash,
      outputsHash: s.outputsHash,
    })),
    published: trace.published !== null,
  };
}

router.get('/a11oy/orchestration-traces', (req: Request, res: Response) => {
  const limit = Math.max(1, Math.min(64, Number(req.query.limit ?? 16)));
  const traces = getRecentOrchestrationTraces(limit).map(projectTrace);
  ok(res, traces);
});

router.post(
  '/a11oy/orchestration-traces/seed',
  writeLimiter,
  async (_req: Request, res: Response) => {
    try {
      // Deterministic demo: a brand-color-drift peaks burst leads to an
      // allow verdict on the platform vertical, with the peak-detector
      // contribution surfaced into the AMI noise/drift axes.
      const peakContribution = peaksToAmiContribution([
        { composite: 0.6 },
        { composite: 0.4 },
      ]);
      const trace = await runOrchestration({
        drift: () => ({
          signal: 'brand-color-drift',
          peakContribution,
        }),
        evaluate: () => ({
          action: 'publish_palette_update',
          vertical: 'platform' as const,
          context: {
            signals: {
              cleanliness: 0.92,
              horizon: 0.9,
              resonance: 0.91,
              frustum: 0.88,
              moralGrounding: 0.94,
              measurabilityHonesty: 0.9,
            },
            peakContribution,
          },
        }),
        approve: (v) => (v.allow ? ('allow' as const) : ('escalate' as const)),
        publish: () => ({
          publishedAt: new Date().toISOString(),
          target: 'brand-cdn',
          note: 'demo-seed',
        }),
      });
      ok(res, projectTrace(trace));
    } catch (err) {
      res
        .status(500)
        .json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  },
);

export default router;
