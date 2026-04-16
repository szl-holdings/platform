import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { idempotencyMiddleware } from "../../middlewares/idempotency";
import { tenantScope } from "../../middlewares/tenant-scope";

import aiEngineRouter from "../ai-engine";
import copilotRouter from "../copilot";
import mcpRouter from "../mcp";
import nueroMeshRouter from "../nuro-mesh";
import nueroMeshAdvancedRouter from "../nuro-mesh-advanced";
import controlTowerRouter from "../control-tower";
import domainAgentsRouter from "../domain-agents/index";
import agentOsRouter from "../agent-os";
import agentTrainingRouter from "../agent-training";
import agentAutonomyRouter from "../agent-autonomy";
import agentFederationRouter from "../agent-federation";
import fineTuningRouter from "../fine-tuning";
import mlPipelineRouter from "../ml-pipeline";
import consciousnessRouter from "../consciousness";
import ontologyRouter from "../ontology";
import digitalTwinsRouter from "../digital-twins";
import fusionRouter from "../fusion";
import knowledgeGraphRouter from "../knowledge-graph";
import aiSafetyRouter from "../ai-safety";
import ragKnowledgeRouter from "../rag-knowledge";
import streamingIngestionRouter from "../streaming-ingestion";
import connectorHubRouter from "../connector-hub";
import a2aRouter from "../a2a";
import jobsRouter from "../jobs";

const _readLimiter = perUserApiSlidingLimiter;
const _writeLimiter = perUserWriteSlidingLimiter;

export function register(router: IRouter): void {
  router.use("/ai", _readLimiter);
  router.use("/ai/tools/execute", idempotencyMiddleware);
  router.use(aiEngineRouter);

  router.use("/copilot", _writeLimiter);
  router.use(copilotRouter);

  router.use("/mcp", _readLimiter);
  router.use(mcpRouter);

  router.use("/nuro-mesh", _readLimiter);
  router.use(nueroMeshRouter);
  router.use(nueroMeshAdvancedRouter);

  router.use("/control-tower", _readLimiter);
  router.use("/control-tower", _writeLimiter);
  router.use(controlTowerRouter);

  router.use("/domain-agents", _readLimiter);
  router.use(domainAgentsRouter);

  router.use("/agent-os", _readLimiter);
  router.use(agentOsRouter);

  router.use(agentTrainingRouter);

  router.use("/agent-autonomy", _readLimiter);
  router.use("/agent-autonomy", _writeLimiter);
  router.use(agentAutonomyRouter);

  router.use("/federation", _readLimiter);
  router.use(agentFederationRouter);

  router.use("/fine-tuning", _readLimiter);
  router.use("/fine-tuning", _writeLimiter);
  router.use(fineTuningRouter);

  router.use("/ml", _readLimiter);
  router.use("/ml", _writeLimiter);
  router.use(mlPipelineRouter);

  router.use(consciousnessRouter);

  router.use("/ontology", _readLimiter);
  router.use("/ontology", _writeLimiter);
  router.use(ontologyRouter);

  router.use("/digital-twins", _readLimiter);
  router.use("/digital-twins", _writeLimiter);
  router.use(digitalTwinsRouter);

  router.use("/fusion", _readLimiter);
  router.use("/fusion", _writeLimiter);
  router.use(fusionRouter);

  router.use("/knowledge", _readLimiter);
  router.use("/knowledge", _writeLimiter);
  router.use("/knowledge", knowledgeGraphRouter);

  router.use("/ai-safety", _readLimiter);
  router.use(aiSafetyRouter);

  router.use("/rag", _readLimiter);
  router.use(ragKnowledgeRouter);

  router.use("/stream", _readLimiter);
  router.use(streamingIngestionRouter);

  router.use("/connector-hub", _readLimiter);
  router.use("/connector-hub", _writeLimiter);
  router.use(connectorHubRouter);

  router.use("/a2a", _readLimiter);
  router.use("/a2a", _writeLimiter);
  router.use(a2aRouter);

  router.use("/jobs", _readLimiter);
  router.use("/jobs", tenantScope({ required: false }));
  router.use(jobsRouter);
}
