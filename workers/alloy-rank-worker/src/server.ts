import express from "express";
import { z } from "zod";
import { rankCandidates } from "./scorer.js";
import type { RankMode } from "./scorer.js";

const app: express.Express = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "10mb" }));

const BEARER = process.env["AEF_S2S_SECRET"] ?? "dev-s2s-secret";
const DEFAULT_MODE: RankMode =
  (process.env["AEF_RANK_MODE"] as RankMode | undefined) ?? "cross-encoder";

function authMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  const header = req.headers["authorization"];
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (token !== BEARER) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  next();
}

const RankWorkerRequestSchema = z.object({
  query: z.string().min(1),
  candidates: z.array(
    z.object({
      id: z.string().min(1),
      text: z.string().min(1),
      score: z.number().optional(),
      metadata: z.record(z.unknown()).default({}),
    }),
  ).min(1).max(512),
  topK: z.number().int().positive().default(10),
  profileId: z.string().optional(),
  mode: z.enum(["cross-encoder", "fallback-inversion"]).optional(),
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "alloy-rank-worker",
    mode: DEFAULT_MODE,
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

app.post("/rerank", authMiddleware, (req, res) => {
  const parsed = RankWorkerRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", issues: parsed.error.issues });
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

const PORT = Number(process.env["AEF_RANK_WORKER_PORT"] ?? process.env["PORT"] ?? 4203);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[alloy-rank-worker] Listening on port ${PORT}`);
  console.log(`[alloy-rank-worker] Mode: ${DEFAULT_MODE}`);
});

export default app;
