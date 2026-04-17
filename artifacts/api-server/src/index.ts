import http from "http";
import { initServerSentry, flushSentry } from "./lib/sentry";
initServerSentry();
import app from "./app";
import { logger } from "./lib/logger";
import { failFastOnInvalidConfig } from "./lib/startup-validation";
import { initWebSocket } from "./lib/websocket";
import { startPrismBusBridge, stopPrismBusBridge } from "./lib/prism-bus-bridge";
import { jobQueue } from "./lib/job-queue";
import { startDurableQueue, startDurableScheduler, durableJobQueue, durableScheduler } from "./lib/durable-init";
import "./lib/platform-jobs";
import { ensurePlatformFlags } from "./lib/platform-flags";
import { startDomainNotificationGenerators, stopDomainNotificationGenerators } from "./lib/domain-notifications";
import { startSelfMonitoring, stopSelfMonitoring } from "./lib/self-monitor";
import { agentScheduler, registerDefaultSchedules } from "./lib/agent-scheduler";
import { knowledgeStore } from "./lib/knowledge-store";
import { runMigrations } from "./lib/run-migrations";
import { verifyPushReceipts, processScheduledNotifications } from "./lib/expo-push";
import "./lib/terra-nyc-ingestion";
import { scheduleNycIngestionJob } from "./lib/terra-nyc-ingestion";
import "./lib/terra-nyc-extended-ingestion";
import { scheduleNycExtendedIngestionJob } from "./lib/terra-nyc-extended-ingestion";
import { seedPlatformData } from "./lib/seed-platform";
import { seedConstellationData } from "./lib/seed-constellation";
import { seedGuardianDefaults } from "./lib/seed-guardian";
import { initializeOpenTelemetry } from "@szl-holdings/observability";
import { seedMspData } from "./lib/seed-msp";
import { seedDreamscapeData } from "./lib/seed-dreamscape";
import { isSeedDataAllowed, resolveRuntimeMode } from "@szl-holdings/config";
import { buildGraphQLMiddleware } from "./graphql/index.js";
import { registerGraphQLHandler } from "./app.js";
import { prewarmIntelligenceCache, scheduleIntelligenceRefresh, scheduleIntelligenceCachePruning } from "./routes/intelligence/index.js";
import { pingRedis } from "./lib/redis-client.js";
import { registerAllPrismJobHandlers } from "./services/prism-job-handlers";
import { startPrismJobPoller } from "./services/prism-queue";
import { registerGenAITelemetryBridge } from "./lib/genai-telemetry-bridge.js";
import "./lib/cross-app-notification-relay.js";
import { providerHealth } from "./lib/provider-health";
import { startEmbeddingWorker, stopEmbeddingWorker, getWorkerStatus } from "./lib/embedding-worker";
import { initIngestionFramework } from "./lib/ingestion-framework";
import { registerAnalyticsJobHandlers } from "./lib/analytics-jobs";
import { runAlertRuleEvaluation } from "./routes/ops-management";
import { initializeAlloyDomainEventSubscriptions } from "./lib/domain-events/alloy-wiring.js";
import { startIntelligenceFeeds, stopIntelligenceFeeds } from "./lib/intelligence-feeds-init";
import { startMeshPublisher } from "./lib/control-tower-mesh-publisher";
import { initDurablePersistence, stopDurablePersistence } from "./lib/persistence-init";
import { initGuardianEngine } from "./lib/guardian-engine";
import { getAlloyRunManager } from "./lib/alloy-run-manager-singleton";

failFastOnInvalidConfig();

initializeAlloyDomainEventSubscriptions();

registerGenAITelemetryBridge();

initializeOpenTelemetry({
  serviceName: process.env.OTEL_SERVICE_NAME ?? "szl-api",
  serviceVersion: process.env.npm_package_version ?? "1.0.0",
  otlpEndpoint: process.env.OTLP_ENDPOINT ?? process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  exportToAzureMonitor: !!process.env.AZURE_APP_INSIGHTS_CONNECTION_STRING,
  exportToNewRelic: !!process.env.NEW_RELIC_LICENSE_KEY,
  exportToConsole: process.env.OTEL_CONSOLE_EXPORT === "true",
}).catch(err => {
  logger.warn({ err }, "OpenTelemetry initialization failed — continuing without OTel");
});

const HEAP_LIMIT_MB = 512;
const HEAP_CRITICAL_THRESHOLD_MB = Math.round(HEAP_LIMIT_MB * 0.92);
const HEAP_WARN_THRESHOLD_MB = Math.round(HEAP_LIMIT_MB * 0.82);
const HEAP_GC_THRESHOLD_MB = Math.round(HEAP_LIMIT_MB * 0.70);

export { app };
export { getAlloyRunManager } from "./lib/alloy-run-manager-singleton";
export { getGuardianEngine, syncGuardianPolicies, recordGuardianAction } from "./lib/guardian-engine";

export async function bootstrap(server: http.Server, port: number): Promise<http.RequestListener> {
  buildGraphQLMiddleware(server)
    .then(middleware => {
      registerGraphQLHandler(middleware);
      logger.info("GraphQL endpoint mounted at /api/graphql");
      logger.info("GraphQL subscriptions available at wss://.../api/graphql/ws");
    })
    .catch(err => {
      logger.warn({ err }, "GraphQL initialization failed — continuing without GraphQL");
    });

  initWebSocket(server);
  startPrismBusBridge();
  startDomainNotificationGenerators();
  startSelfMonitoring();

  providerHealth.startActiveProbes();
  registerAllPrismJobHandlers();
  registerAnalyticsJobHandlers();
  const prismPoller = startPrismJobPoller(5000);

  const memoryMonitor = setInterval(() => {
    const { heapUsed, heapTotal } = process.memoryUsage();
    const heapUsedMb = Math.round(heapUsed / 1024 / 1024);
    const heapTotalMb = Math.round(heapTotal / 1024 / 1024);
    if (heapUsedMb >= HEAP_CRITICAL_THRESHOLD_MB) {
      logger.error({
        heapUsedMb,
        heapTotalMb,
        limitMb: HEAP_LIMIT_MB,
      }, "[memory] Heap usage critical — forcing GC");
      if (global.gc) { global.gc(); global.gc(); }
    } else if (heapUsedMb >= HEAP_WARN_THRESHOLD_MB) {
      logger.warn({
        heapUsedMb,
        heapTotalMb,
        limitMb: HEAP_LIMIT_MB,
      }, "[memory] Heap usage elevated — running GC");
      if (global.gc) global.gc();
    } else if (heapUsedMb >= HEAP_GC_THRESHOLD_MB) {
      if (global.gc) global.gc();
    }
  }, 20_000);
  memoryMonitor.unref();

  logger.info({ port, host: "0.0.0.0" }, "Server listening");

  // Schedule analytics aggregation every hour
  setInterval(() => {
    import("./lib/analytics-jobs.js").then(({ runMetricsAggregation }) => {
      runMetricsAggregation({ lookbackHours: 2 }).catch(err => {
        logger.warn({ err }, "[analytics] Hourly metrics aggregation failed (non-fatal)");
      });
    }).catch(err => logger.warn({ err }, "[analytics] Failed to load analytics-jobs for scheduling"));
  }, 60 * 60 * 1000);

  // Schedule anomaly scan every 6 hours
  setInterval(() => {
    import("./lib/analytics-jobs.js").then(({ runAnomalyScan }) => {
      runAnomalyScan({ lookbackDays: 14 }).catch(err => {
        logger.warn({ err }, "[analytics] Anomaly scan failed (non-fatal)");
      });
    }).catch(err => logger.warn({ err }, "[analytics] Failed to load analytics-jobs for anomaly scan"));
  }, 6 * 60 * 60 * 1000);

  // Schedule alert rule evaluation on a configurable interval (default: 5 minutes)
  const alertEvalIntervalMinutes = Math.max(
    1,
    parseInt(process.env["ALERT_EVAL_INTERVAL_MINUTES"] ?? "5", 10) || 5
  );
  const alertEvalIntervalMs = alertEvalIntervalMinutes * 60 * 1000;
  logger.info({ intervalMinutes: alertEvalIntervalMinutes }, "[alert-eval] Scheduling automatic alert rule evaluation");
  const alertEvalInterval = setInterval(() => {
    const runAt = new Date().toISOString();
    runAlertRuleEvaluation()
      .then(({ evaluated, fired, metrics }) => {
        logger.info({ runAt, evaluated, fired, metrics }, "[alert-eval] Scheduled evaluation complete");
      })
      .catch(err => {
        logger.warn({ err, runAt }, "[alert-eval] Scheduled evaluation failed (non-fatal)");
      });
  }, alertEvalIntervalMs);
  alertEvalInterval.unref();

  import("./routes/rmm").then(m => m.startSyncScheduler()).catch(err => logger.warn({ err }, "RMM sync scheduler start failed (non-fatal)"));
  pingRedis().catch(err => logger.warn({ err }, "[redis] Startup ping failed (non-fatal)"));
  prewarmIntelligenceCache().catch(err => {
    logger.warn({ err }, "[intelligence-cache] Prewarm failed (non-fatal)");
  });
  scheduleIntelligenceRefresh();
  scheduleIntelligenceCachePruning();

  import("@szl-holdings/ai-engine")
    .then(({ startCognitiveLearning }) => startCognitiveLearning())
    .catch(err => logger.warn({ err }, "[cognitive] Cognitive learning startup failed (non-fatal)"));

  startIntelligenceFeeds().catch(err => logger.warn({ err }, "[feeds] Intelligence feeds startup failed (non-fatal)"));
  startMeshPublisher(30_000);

  try {
    // Step 1: Run all migrations — single await, schema fully guaranteed before any seed executes
    // Retry up to 5 times with exponential backoff to handle transient DB connection issues on startup
    let migrationsComplete = false;
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        await runMigrations();
        migrationsComplete = true;
        break;
      } catch (migErr) {
        const isLast = attempt === 5;
        logger.warn({ migErr, attempt, isLast }, `[bootstrap] Migration attempt ${attempt} failed${isLast ? " — giving up" : " — retrying"}`);
        if (isLast) throw migErr;
        await new Promise(r => setTimeout(r, Math.min(1000 * attempt, 8000)));
      }
    }
    if (migrationsComplete) {
      logger.info("[bootstrap] All migrations complete");
    }

    // Step 2: Platform flags and knowledge store depend on schema being ready
    await ensurePlatformFlags();
    await knowledgeStore.loadFromDb();
    logger.info("[bootstrap] Platform flags and knowledge store loaded");

    // Step 2b: Wire Trace Graph and Memory Fabric to Postgres so traces,
    // approvals, audit trails, and agent memory survive restarts.
    await initDurablePersistence();

    // Step 2c: Hydrate the shared Guardian decision engine from policy rows
    // and warm the Alloy RunManager singleton so any agent endpoint can
    // submit work as soon as the server starts accepting traffic.
    await initGuardianEngine();
    getAlloyRunManager();
    logger.info("[bootstrap] Guardian engine and Alloy RunManager ready");

    // Step 3: Start durable (PostgreSQL-backed) job queue
    await startDurableQueue();

    startEmbeddingWorker();
    // Non-fatal health check: log embedding model/schema compatibility at startup.
    import("@szl-holdings/ai-engine/embedding-pipeline")
      .then(({ listEmbeddingProviders }) => {
        const providers = listEmbeddingProviders();
        const modelId = process.env["HF_EMBED_MODEL"] ?? "BAAI/bge-m3";
        const current = providers.find(p => p.id === modelId) ?? providers[0];
        const status = getWorkerStatus();
        logger.info({
          workerRunning: status.running,
          pollIntervalMs: status.pollIntervalMs,
          modelId: current?.id,
          schemaDimension: current?.schemaDimension,
          schemaCompatible: current?.schemaCompatible,
          normalisationApplied: current?.normalisationApplied,
          totalProviders: providers.length,
        }, "[embedding-health] Embedding worker started — model/schema compatibility report");
        if (current && !current.schemaCompatible) {
          logger.warn({
            model: current.id,
            schemaDimension: current.schemaDimension,
          }, "[embedding-health] Active model dimension does not match VECTOR_DIM — vectors will be normalised at write time");
        }
      })
      .catch(err => logger.warn({ err }, "[embedding-health] Startup compatibility check failed (non-fatal)"));

    // Push notification background jobs (receipt verification + scheduled sends)
    const RECEIPT_VERIFY_INTERVAL_MS = 5 * 60 * 1000;
    const receiptVerifyInterval = setInterval(() => {
      verifyPushReceipts().catch(err => logger.warn({ err }, "[push] Receipt verification error (non-fatal)"));
    }, RECEIPT_VERIFY_INTERVAL_MS);
    receiptVerifyInterval.unref();

    const SCHEDULED_NOTIF_INTERVAL_MS = 60 * 1000;
    const scheduledNotifInterval = setInterval(() => {
      processScheduledNotifications().catch(err => logger.warn({ err }, "[push] Scheduled notification processing error (non-fatal)"));
    }, SCHEDULED_NOTIF_INTERVAL_MS);
    scheduledNotifInterval.unref();

    // Step 3b: Register all job handlers and agent schedules BEFORE starting the scheduler.
    // This ensures no durable job is dequeued before its handler exists (prevents dead-lettering
    // on startup when the scheduler fires previously-due agent cron schedules from the DB).
    await registerDefaultSchedules();

    // Step 3c: Start the scheduler AFTER all handlers are registered
    await startDurableScheduler();

    // Step 4: Demo seeds — isolated from production data paths.
    // Gate is now enforced by isSeedDataAllowed() from @szl-holdings/config (runtime mode model).
    // Each seed function also guards itself independently for defense-in-depth.
    const currentMode = resolveRuntimeMode();
    if (isSeedDataAllowed()) {
      logger.info({ mode: currentMode }, "[seed] Demo seed enabled — running platform/MSP/Dreamscape seeds");
      seedPlatformData().catch(err => {
        logger.warn({ err }, "[seed-platform] Seed failed (non-fatal)");
      });
      seedMspData().catch(err => {
        logger.warn({ err }, "[msp-seed] MSP demo seed failed (non-fatal)");
      });
      seedDreamscapeData().catch(err => {
        logger.warn({ err }, "[seed-dreamscape] Creative Workflows seed failed (non-fatal)");
      });
      seedConstellationData().catch(err => {
        logger.warn({ err }, "[seed-constellation] Constellation graph seed failed (non-fatal)");
      });
    } else {
      logger.info({ mode: currentMode }, "[seed] Demo seeds suppressed — runtime mode does not permit seed data. Set DEMO_MODE=true or ENABLE_DEMO_SEED=true to enable in non-production environments.");
    }
    // Guardian default tier policies are operational data (not demo data) — always seed.
    seedGuardianDefaults().catch(err => {
      logger.warn({ err }, "[seed-guardian] Guardian defaults seed failed (non-fatal)");
    });
    initIngestionFramework().catch(err => {
      logger.warn({ err }, "[ingestion] Framework init failed (non-fatal)");
    });

    logger.info("[bootstrap] Bootstrap sequence complete — server fully ready");

    const startupMatrix = await (async () => {
      try {
        const { services: svc } = await import("@szl-holdings/services");
        return svc.getHealthMatrix?.() ?? { summary: { total: 0, liveConfigured: 0, mockedDemoMode: 0 }, services: [] };
      } catch {
        return { summary: { total: 0, liveConfigured: 0, mockedDemoMode: 0 }, services: [] };
      }
    })();

    const enabledFeatures: string[] = [];
    if (process.env.STRIPE_SECRET_KEY) enabledFeatures.push("stripe-payments");
    if (process.env.AZURE_AD_CLIENT_ID) enabledFeatures.push("azure-sso");
    if (process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY) enabledFeatures.push("email");
    if (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY) enabledFeatures.push("ai-engine");
    if (process.env.REDIS_URL || process.env.REDIS_HOST) enabledFeatures.push("redis");
    if (process.env.S3_BUCKET || process.env.OBJECT_STORE_BUCKET) enabledFeatures.push("object-storage");
    if (process.env.OTLP_ENDPOINT || process.env.OTEL_EXPORTER_OTLP_ENDPOINT) enabledFeatures.push("opentelemetry");
    if (process.env.AZURE_APP_INSIGHTS_CONNECTION_STRING) enabledFeatures.push("azure-monitor");
    if (process.env.NEW_RELIC_LICENSE_KEY) enabledFeatures.push("new-relic");
    if (process.env.EXPO_ACCESS_TOKEN) enabledFeatures.push("expo-push");

    const routeCount = (() => {
      interface RouterLayer {
        route?: unknown;
        handle?: { stack?: RouterLayer[] };
      }
      let count = 0;
      function countLayer(layer: RouterLayer) {
        if (layer.route) {
          count += 1;
        } else if (layer.handle?.stack) {
          layer.handle.stack.forEach(countLayer);
        }
      }
      try {
        const router = (app as unknown as { _router?: { stack?: RouterLayer[] } })._router;
        router?.stack?.forEach(countLayer);
      } catch { /* non-fatal */ }
      return count;
    })();

    logger.info({
      event: "server_startup",
      port,
      environment: process.env.NODE_ENV ?? "development",
      nodeVersion: process.version,
      enabledFeatures,
      featureCount: enabledFeatures.length,
      connectors: {
        total: startupMatrix.summary.total,
        live: startupMatrix.summary.liveConfigured,
        demo: startupMatrix.summary.mockedDemoMode,
      },
      services: {
        database: "postgresql",
        jobQueue: "durable-postgresql",
        websocket: "ws",
      },
      routeCount,
    }, "[startup] API server fully ready — configuration summary");
  } catch (err) {
    logger.fatal({ err }, "Schema bootstrap failed — cannot guarantee data integrity, shutting down");
    process.exit(1);
  }

  const SHUTDOWN_TIMEOUT_MS = 10_000;

  async function shutdown(signal: string) {
    logger.info({ signal }, "Graceful shutdown initiated");

    const shutdownTimer = setTimeout(() => {
      logger.error("Shutdown timeout exceeded — forcing exit");
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    shutdownTimer.unref();

    try {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      logger.info("HTTP server closed");
    } catch (err) {
      logger.warn({ err }, "Error closing HTTP server");
    }

    await flushSentry(2000).catch(() => {});

    stopDomainNotificationGenerators();
    stopSelfMonitoring();
    stopPrismBusBridge();
    stopEmbeddingWorker();
    await stopIntelligenceFeeds();
    providerHealth.stopActiveProbes();
    agentScheduler.stop();
    clearInterval(prismPoller);

    try {
      await jobQueue.shutdown();
      logger.info("Job queue flushed");
    } catch (err) {
      logger.warn({ err }, "Error flushing job queue");
    }

    try {
      durableScheduler.stop();
      await durableJobQueue.shutdown();
      logger.info("Durable job queue flushed");
    } catch (err) {
      logger.warn({ err }, "Error flushing durable job queue");
    }

    try {
      await stopDurablePersistence();
    } catch (err) {
      logger.warn({ err }, "Error flushing trace/memory persistence");
    }

    try {
      const { pool } = await import("@szl-holdings/db");
      await pool.end();
      logger.info("Database pool closed");
    } catch (err) {
      logger.warn({ err }, "Error closing DB pool (may not be configured)");
    }

    clearTimeout(shutdownTimer);
    logger.info("Graceful shutdown complete");
    process.exit(0);
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "Uncaught exception — shutting down");
    shutdown("uncaughtException");
  });

  process.on("unhandledRejection", (reason) => {
    logger.fatal({ reason }, "Unhandled promise rejection — shutting down");
    shutdown("unhandledRejection");
  });

  return app as unknown as http.RequestListener;
}

if (!process.env.__FAST_START_SERVER) {
  const rawPort = process.env["PORT"];
  if (!rawPort) {
    throw new Error("PORT environment variable is required but was not provided.");
  }
  const port = Number(rawPort);
  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  let readyHandler: http.RequestListener = app as unknown as http.RequestListener;
  let bootstrapDone = false;
  const startingHandler: http.RequestListener = (_req, res) => {
    if (bootstrapDone) return readyHandler(_req, res);
    (res as http.ServerResponse).writeHead(503, { "Content-Type": "application/json" });
    (res as http.ServerResponse).end(JSON.stringify({ status: "starting", message: "API server is initializing, please retry" }));
  };

  const server = http.createServer((req, res) => startingHandler(req, res));
  server.listen(port, "0.0.0.0", () => {
    logger.info({ port, host: "0.0.0.0" }, "Server listening (fast-start)");
    bootstrap(server, port)
      .then(handler => {
        readyHandler = handler;
        bootstrapDone = true;
        logger.info({ port }, "[api-server] Fully ready — switching to live handler");
      })
      .catch(err => {
        logger.fatal({ err }, "Bootstrap failed — shutting down");
        process.exit(1);
      });
  });
}
