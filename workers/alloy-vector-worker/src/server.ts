import { timingSafeEqual } from 'node:crypto';
import { isProductionRuntime } from '@workspace/aef-contracts';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import {
  createDefaultBackend,
  DEFAULT_LOCAL_CPU_DIMENSIONS,
  DEFAULT_LOCAL_CPU_MODEL_ID,
  DEFAULT_LOCAL_CPU_MODEL_REVISION,
} from './backends.js';
import { MicroBatcher } from './batcher.js';

const app: express.Express = express();
app.set('trust proxy', 1);
// One aggregate bucket keeps limiter memory bounded even for rotating clients.
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: positiveIntegerEnvironment('AEF_VECTOR_RATE_LIMIT_RPM', 6000),
    keyGenerator: () => 'process',
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'rate_limit_exceeded' },
  }),
);
app.use(express.json({ limit: '20mb' }));

const BEARER = process.env.AEF_S2S_SECRET?.trim() ?? '';
if (!BEARER) {
  throw new Error('[alloy-vector-worker] AEF_S2S_SECRET is required');
}
const IS_PRODUCTION = isProductionRuntime(process.env, ['AEF_ENV', 'AEF_VECTOR_WORKER_ENV']);

function positiveIntegerEnvironment(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`[alloy-vector-worker] ${name} must be a positive integer`);
  }
  return value;
}

function secretsEqual(candidate: string, expected: string): boolean {
  // These are opaque API tokens, compared directly rather than stored password hashes.
  const candidateBytes = Buffer.from(candidate, 'utf8');
  const expectedBytes = Buffer.from(expected, 'utf8');
  return (
    candidateBytes.length === expectedBytes.length && timingSafeEqual(candidateBytes, expectedBytes)
  );
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

const backend = createDefaultBackend();
const APPROVED_LOCAL_MODEL_REF = `${DEFAULT_LOCAL_CPU_MODEL_ID}@${DEFAULT_LOCAL_CPU_MODEL_REVISION}`;
const backendMatchesApprovedConfiguration =
  backend.kind === 'local-cpu' &&
  backend.modelRef === APPROVED_LOCAL_MODEL_REF &&
  backend.dimensions === DEFAULT_LOCAL_CPU_DIMENSIONS;
// Configuration identity is necessary but is not artifact qualification.
// No signed promotion receipt or verified cache/artifact digest is wired yet.
const promotionReceiptVerified = false;
const backendIsProductionQualified =
  backendMatchesApprovedConfiguration && promotionReceiptVerified;

function productionHoldPayload(): Record<string, unknown> {
  return {
    ready: false,
    status: 'HOLD',
    code: 'EMBEDDING_BACKEND_UNQUALIFIED',
    evidenceState: 'UNAVAILABLE',
    service: 'alloy-vector-worker',
    backend: backend.kind,
    modelRef: backend.modelRef,
    backendConfigurationApproved: backendMatchesApprovedConfiguration,
    promotionReceiptVerified,
    message: `Production embedding is disabled until a verified promotion receipt and artifact/cache digest are wired for ${APPROVED_LOCAL_MODEL_REF} at ${DEFAULT_LOCAL_CPU_DIMENSIONS} dimensions. Configuration identity alone is not qualification evidence.`,
  };
}

function productionHoldMiddleware(
  _req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  if (!IS_PRODUCTION || backendIsProductionQualified) {
    next();
    return;
  }
  res.setHeader('X-Evidence-State', 'UNAVAILABLE');
  res.setHeader('Retry-After', '60');
  res.status(503).json(productionHoldPayload());
}

const batcher = new MicroBatcher(backend, {
  maxBatchSize: positiveIntegerEnvironment('AEF_EMBED_BATCH_SIZE', 32),
  maxWaitMs: positiveIntegerEnvironment('AEF_EMBED_FLUSH_MS', 20),
  maxQueueDepth: positiveIntegerEnvironment('AEF_EMBED_QUEUE_DEPTH', 512),
  oversizeTokenThreshold: positiveIntegerEnvironment('AEF_EMBED_OVERSIZE_TOKENS', 2048),
});

const EmbedWorkerRequestSchema = z.object({
  inputs: z
    .array(
      z.object({
        chunkId: z.string().min(1),
        text: z.string().min(1),
        modelRef: z.string().optional(),
        profileId: z.string().optional(),
        inputType: z.enum(['query', 'passage']).default('passage'),
      }),
    )
    .min(1)
    .max(256),
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'alive',
    service: 'alloy-vector-worker',
    backend: backend.kind,
    modelRef: backend.modelRef,
    dimensions: backend.dimensions,
    backendConfigurationApproved: backendMatchesApprovedConfiguration,
    promotionReceiptVerified,
    productionBackendQualified: false,
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'alive' });
});

let readinessProbe: Promise<boolean> | undefined;

async function verifyBackendReadiness(): Promise<boolean> {
  if (!readinessProbe) {
    readinessProbe = (async () => {
      if (!(await backend.isAvailable())) return false;
      const probe = await backend.embed([
        {
          chunkId: 'readiness-probe',
          text: 'readiness probe',
          modelRef: backend.modelRef,
          profileId: 'readiness',
          inputType: 'passage',
        },
      ]);
      const output = probe[0];
      const vectorNorm = output
        ? Math.sqrt(output.vector.reduce((sum, value) => sum + value * value, 0))
        : 0;
      return Boolean(
        probe.length === 1 &&
          output &&
          output.chunkId === 'readiness-probe' &&
          output.dimensions === backend.dimensions &&
          output.vector.length === backend.dimensions &&
          output.vector.every(Number.isFinite) &&
          Number.isFinite(vectorNorm) &&
          Math.abs(vectorNorm - 1) <= 0.001 &&
          output.modelRef === backend.modelRef,
      );
    })()
      .catch(() => false)
      .finally(() => {
        readinessProbe = undefined;
      });
  }
  return readinessProbe;
}

app.get('/readyz', async (_req, res) => {
  if (IS_PRODUCTION && !backendIsProductionQualified) {
    res.setHeader('X-Evidence-State', 'UNAVAILABLE');
    res.setHeader('Retry-After', '60');
    res.status(503).json(productionHoldPayload());
    return;
  }
  const ready = await verifyBackendReadiness();
  res.status(ready ? 200 : 503).json({
    ready,
    service: 'alloy-vector-worker',
    backend: backend.kind,
    modelRef: backend.modelRef,
  });
});

app.get('/stats', authMiddleware, (_req, res) => {
  res.json({ service: 'alloy-vector-worker', ...batcher.getStats() });
});

app.post('/embed', authMiddleware, productionHoldMiddleware, async (req, res) => {
  const parsed = EmbedWorkerRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation_error', issues: parsed.error.issues });
    return;
  }

  const startMs = Date.now();

  if (
    parsed.data.inputs.some(
      (input) => input.modelRef !== undefined && input.modelRef !== backend.modelRef,
    )
  ) {
    res.status(400).json({
      error: 'model_ref_mismatch',
      message: 'modelRef is selected by the configured server backend and cannot be overridden.',
      modelRef: backend.modelRef,
    });
    return;
  }

  try {
    const outputs = await Promise.all(
      parsed.data.inputs.map((input) =>
        batcher.enqueue({
          chunkId: input.chunkId,
          text: input.text,
          modelRef: input.modelRef ?? backend.modelRef,
          profileId: input.profileId ?? 'default',
          inputType: input.inputType,
        }),
      ),
    );

    const authoritative = outputs.every((output, index) => {
      const input = parsed.data.inputs[index];
      const norm = Math.sqrt(output.vector.reduce((sum, value) => sum + value * value, 0));
      return Boolean(
        input &&
          output.chunkId === input.chunkId &&
          output.modelRef === backend.modelRef &&
          output.dimensions === backend.dimensions &&
          output.vector.length === backend.dimensions &&
          output.vector.every(Number.isFinite) &&
          Number.isFinite(norm) &&
          Math.abs(norm - 1) <= 0.001,
      );
    });
    if (!authoritative) {
      res.status(502).json({
        error: 'embedding_backend_contract_violation',
        evidenceState: 'UNAVAILABLE',
        message:
          'The backend returned outputs with invalid identity, dimensions, or normalization.',
      });
      return;
    }

    res.json({
      outputs,
      totalProcessingMs: Date.now() - startMs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('oversize') || message.includes('queue is full')) {
      res.status(429).json({ error: 'backpressure', message });
    } else {
      res.status(500).json({ error: 'embedding_failed', message });
    }
  }
});

const PORT = Number(process.env.AEF_VECTOR_WORKER_PORT ?? process.env.PORT ?? 4202);

app.listen(PORT, '0.0.0.0', () => {});

export default app;
