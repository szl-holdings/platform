import { createHash, timingSafeEqual } from 'node:crypto';
import { isProductionRuntime } from '@workspace/aef-contracts';
import express from 'express';
import { z } from 'zod';
import { type RankMode, rankCandidates } from './scorer.js';

const app: express.Express = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));

const BEARER = process.env.AEF_S2S_SECRET?.trim() ?? '';
if (!BEARER) {
  throw new Error('[alloy-rank-worker] AEF_S2S_SECRET is required');
}
const IS_PRODUCTION = isProductionRuntime(process.env, ['AEF_ENV', 'AEF_RANK_WORKER_ENV']);
const RankModeSchema = z.enum(['lexical-overlap', 'score-passthrough']);
const DEFAULT_MODE: RankMode = RankModeSchema.parse(process.env.AEF_RANK_MODE ?? 'lexical-overlap');

function secretsEqual(candidate: string, expected: string): boolean {
  const candidateDigest = createHash('sha256').update(candidate).digest();
  const expectedDigest = createHash('sha256').update(expected).digest();
  return timingSafeEqual(candidateDigest, expectedDigest);
}

function authMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  const header = req.headers.authorization;
  const match = typeof header === 'string' ? /^Bearer\s+(\S+)$/i.exec(header) : null;
  const token = match?.[1];
  if (!token || !secretsEqual(token, BEARER)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  next();
}

function productionHoldPayload(): Record<string, unknown> {
  return {
    ready: false,
    status: 'HOLD',
    code: 'RANKING_BACKEND_UNAVAILABLE',
    evidenceState: 'UNAVAILABLE',
    service: 'alloy-rank-worker',
    message:
      'Production reranking is disabled until a qualified immutable model artifact is wired and verified.',
    holds: [
      {
        capability: 'qualified-reranking-model',
        status: 'UNAVAILABLE',
        reason:
          'lexical-overlap and score-passthrough are development heuristics, not qualified production rerankers.',
      },
    ],
  };
}

function productionHoldMiddleware(
  _req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  if (!IS_PRODUCTION) {
    next();
    return;
  }
  res.setHeader('X-Evidence-State', 'UNAVAILABLE');
  res.setHeader('Retry-After', '60');
  res.status(503).json(productionHoldPayload());
}

const RankWorkerRequestSchema = z.object({
  query: z.string().min(1),
  candidates: z
    .array(
      z.object({
        id: z.string().min(1),
        text: z.string().min(1),
        score: z.number().optional(),
        metadata: z.record(z.unknown()).default({}),
      }),
    )
    .min(1)
    .max(512),
  topK: z.number().int().positive().default(10),
  profileId: z.string().optional(),
  mode: RankModeSchema.optional(),
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'alive',
    service: 'alloy-rank-worker',
    mode: DEFAULT_MODE,
    productionReady: !IS_PRODUCTION,
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'alive' });
});

app.get('/readyz', (_req, res) => {
  if (IS_PRODUCTION) {
    res.setHeader('X-Evidence-State', 'UNAVAILABLE');
    res.setHeader('Retry-After', '60');
    res.status(503).json(productionHoldPayload());
    return;
  }
  res.status(200).json({ ready: true, status: 'development-only', mode: DEFAULT_MODE });
});

app.post('/rerank', authMiddleware, productionHoldMiddleware, (req, res) => {
  const parsed = RankWorkerRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation_error', issues: parsed.error.issues });
    return;
  }

  const { query, candidates, topK, mode } = parsed.data;
  const rankMode: RankMode = mode ?? DEFAULT_MODE;
  const startMs = Date.now();

  // exactOptionalPropertyTypes requires stripping undefined before passing to typed interface
  const rankInput = candidates.map((c) => ({
    id: c.id,
    text: c.text,
    metadata: c.metadata,
    ...(c.score !== undefined ? { score: c.score } : {}),
  }));
  const results = rankCandidates(query, rankInput, topK, rankMode);

  res.json({
    results,
    query,
    mode: rankMode,
    totalCandidates: candidates.length,
    processingMs: Date.now() - startMs,
  });
});

const PORT = Number(process.env.AEF_RANK_WORKER_PORT ?? process.env.PORT ?? 4203);

app.listen(PORT, '0.0.0.0', () => {});

export default app;
