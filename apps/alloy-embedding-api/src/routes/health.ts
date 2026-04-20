import { Router } from "express";
import type { Request, Response } from "express";
import { getDefaultEmbedWorker } from "@workspace/alloy-embed-worker";
import { getDefaultRerankWorker } from "@workspace/alloy-rerank-worker";

export const healthRouter = Router();

healthRouter.get("/health", async (_req: Request, res: Response) => {
  const { warmPool } = getDefaultEmbedWorker();
  const { primary, fallback } = getDefaultRerankWorker();

  const [embedHealth, primaryRerankHealth, fallbackRerankHealth] = await Promise.allSettled([
    warmPool.pingAll().then(() => warmPool.getStatus()),
    primary.health(),
    fallback.health(),
  ]);

  const status = {
    status: "ok",
    service: "alloy-embedding-api",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
    embedBackends:
      embedHealth.status === "fulfilled" ? embedHealth.value : { error: String((embedHealth as PromiseRejectedResult).reason) },
    rerankPrimary:
      primaryRerankHealth.status === "fulfilled" ? primaryRerankHealth.value : { healthy: false },
    rerankFallback:
      fallbackRerankHealth.status === "fulfilled" ? fallbackRerankHealth.value : { healthy: false },
  };

  res.status(200).json(status);
});
