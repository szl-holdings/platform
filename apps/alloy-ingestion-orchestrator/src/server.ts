/**
 * AEF Ingestion Orchestrator — Standalone Server
 *
 * Starts the orchestrator as an independent HTTP service.
 * In the monorepo, the orchestrator is mounted into the API gateway.
 */

import express, { type Express } from "express";
import cors from "cors";
import { createOrchestratorRouter } from "./router.js";

const app: Express = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const router = createOrchestratorRouter();
app.use("/orchestrator", router);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "alloy-ingestion-orchestrator" });
});

const PORT = process.env["PORT"] ? parseInt(process.env["PORT"], 10) : 3003;

app.listen(PORT, () => {
  console.log(`[alloy-ingestion-orchestrator] Listening on port ${PORT}`);
});

export { app };
