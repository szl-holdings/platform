import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { tenantScope } from "../../middlewares/tenant-scope";

import * as documents from "../documents";
import cmsRouter from "../cms";
import exportsRouter from "../exports";
import reportsRouter from "../reports";
import commentsRouter from "../comments";
import atlasRouter from "../atlas-artifacts";
import telemetryRouter from "../telemetry";
import doctrineRouter from "../doctrine";
import analyticsRouter from "../analytics";
import analyticsEngineRouter from "../analytics-engine";
import genAITelemetryRouter from "../genai-telemetry";
import outcomeGraphRouter from "../outcome-graph";
import pulseEvalsRouter from "../pulse-evals";
import receiptGraphRouter from "../receipt-graph";
import revenueIntelligenceRouter from "../revenue-intelligence";

const _readLimiter = perUserApiSlidingLimiter;
const _writeLimiter = perUserWriteSlidingLimiter;

export function register(router: IRouter): void {
  router.use("/documents", tenantScope({ required: true }));
  router.use("/exports", tenantScope({ required: true }));
  router.use("/comments", tenantScope({ required: true }));
  router.use("/cms", tenantScope({ required: true }));
  router.use("/reports", tenantScope({ required: true }));
  router.use("/atlas", tenantScope({ required: true }));
  router.use("/telemetry", tenantScope({ required: true }));
  router.use("/doctrine", tenantScope({ required: true }));
  router.use("/analytics", tenantScope({ required: true }));
  router.use("/analytics-engine", tenantScope({ required: true }));
  router.use("/genai-telemetry", tenantScope({ required: true }));
  router.use("/outcome-graph", tenantScope({ required: true }));
  router.use("/pulse-evals", tenantScope({ required: true }));
  router.use("/receipt-graph", tenantScope({ required: true }));
  router.use("/revenue-intelligence", tenantScope({ required: true }));

  router.use("/documents", _writeLimiter);
  documents.register(router);

  router.use("/cms", _readLimiter);
  router.use(cmsRouter);

  router.use("/exports", _writeLimiter);
  router.use(exportsRouter);

  router.use("/reports", _readLimiter);
  router.use(reportsRouter);

  router.use("/comments", _writeLimiter);
  router.use(commentsRouter);

  router.use("/atlas", _writeLimiter);
  router.use(atlasRouter);

  router.use("/telemetry", _writeLimiter);
  router.use(telemetryRouter);

  router.use("/doctrine", _readLimiter);
  router.use(doctrineRouter);

  router.use("/analytics", _writeLimiter);
  router.use(analyticsRouter);

  router.use("/analytics-engine", _readLimiter);
  router.use("/analytics-engine", _writeLimiter);
  router.use(analyticsEngineRouter);

  router.use("/genai-telemetry", _readLimiter);
  router.use("/genai-telemetry", _writeLimiter);
  router.use(genAITelemetryRouter);

  router.use("/outcome-graph", _writeLimiter);
  router.use(outcomeGraphRouter);

  router.use("/pulse-evals", _readLimiter);
  router.use("/pulse-evals", _writeLimiter);
  router.use(pulseEvalsRouter);

  router.use("/receipt-graph", _readLimiter);
  router.use("/receipt-graph", _writeLimiter);
  router.use(receiptGraphRouter);

  router.use("/revenue-intelligence", _readLimiter);
  router.use(revenueIntelligenceRouter);
}
