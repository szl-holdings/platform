import express from 'express';
import { z } from 'zod';
import { createDefaultBackend } from './backends.js';
import { MicroBatcher } from './batcher.js';

const app: express.Express = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '20mb' }));

const BEARER = process.env['AEF_S2S_SECRET'] ?? 'dev-s2s-secret';

function authMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  const header = req.headers['authorization'];
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (token !== BEARER) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  next();
}

const backend = createDefaultBackend();
const batcher = new MicroBatcher(backend, {
  maxBatchSize: Number(process.env['AEF_EMBED_BATCH_SIZE'] ?? 32),
  maxWaitMs: Number(process.env['AEF_EMBED_FLUSH_MS'] ?? 20),
  maxQueueDepth: Number(process.env['AEF_EMBED_QUEUE_DEPTH'] ?? 512),
  oversizeTokenThreshold: Number(process.env['AEF_EMBED_OVERSIZE_TOKENS'] ?? 2048),
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

app.get('/health', async (_req, res) => {
  const available = await backend.isAvailable();
  res.json({
    status: available ? 'ok' : 'degraded',
    service: 'alloy-vector-worker',
    backend: backend.kind,
    modelRef: backend.modelRef,
    dimensions: backend.dimensions,
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

app.get('/stats', authMiddleware, (_req, res) => {
  res.json({ service: 'alloy-vector-worker', ...batcher.getStats() });
});

app.post('/embed', authMiddleware, async (req, res) => {
  const parsed = EmbedWorkerRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation_error', issues: parsed.error.issues });
    return;
  }

  const startMs = Date.now();

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

const PORT = Number(process.env['AEF_VECTOR_WORKER_PORT'] ?? process.env['PORT'] ?? 4202);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[alloy-vector-worker] Listening on port ${PORT}`);
  console.log(
    `[alloy-vector-worker] Backend: ${backend.kind} (${backend.modelRef}, ${backend.dimensions}d)`,
  );
});

export default app;
