import http from 'http';
import { flushSentry, initServerSentry } from './lib/sentry';

initServerSentry();

import app from './app';
import {
  durableJobQueue,
  durableScheduler,
  startDurableQueue,
  startDurableScheduler,
} from './lib/durable-init';
import { jobQueue } from './lib/job-queue';
import { logger } from './lib/logger';
import { startPrismBusBridge, stopPrismBusBridge } from './lib/prism-bus-bridge';
import { failFastOnInvalidConfig } from './lib/startup-validation';
import { initWebSocket } from './lib/websocket';
import './lib/platform-jobs';
import { agentScheduler, registerDefaultSchedules } from './lib/agent-scheduler';
import { registerApprovalNotificationHook } from './lib/approval-notifications';
import {
  startDomainNotificationGenerators,
  stopDomainNotificationGenerators,
} from './lib/domain-notifications';
import { processScheduledNotifications, verifyPushReceipts } from './lib/expo-push';
import {
  startHealthDegradationWatcher,
  stopHealthDegradationWatcher,
} from './lib/health-degradation-watcher';
import { knowledgeStore } from './lib/knowledge-store';
import { ensurePlatformFlags } from './lib/platform-flags';
import { runMigrations } from './lib/run-migrations';
import { startSelfMonitoring, stopSelfMonitoring } from './lib/self-monitor';
import './lib/terra-nyc-ingestion';
import { scheduleNycIngestionJob } from './lib/terra-nyc-ingestion';
import './lib/terra-nyc-extended-ingestion';
import { isSeedDataAllowed, resolveRuntimeMode } from '@szl-holdings/config';
import { otelReady, registerGraphQLHandler } from './app.js';
import { buildGraphQLMiddleware } from './graphql/index.js';
import { initCognitiveTelemetry } from './lib/cognitive-telemetry.js';
import { registerGenAITelemetryBridge } from './lib/genai-telemetry-bridge.js';
import { pingRedis } from './lib/redis-client.js';
import { seedAiBudgetPolicies } from './lib/seed-ai-budget';
import { seedConstellationData } from './lib/seed-constellation';
import { seedDreamscapeData } from './lib/seed-dreamscape';
import { seedGuardianDefaults, seedGuardianTiers } from './lib/seed-guardian';
import { seedKnowledgeBase } from './lib/seed-kb';
import { seedLyteActions } from './lib/seed-lyte-actions';
import { seedLyteSurfaces } from './lib/seed-lyte-surfaces';
import { seedMspData } from './lib/seed-msp';
import { seedPlatformData } from './lib/seed-platform';
import { scheduleNycExtendedIngestionJob } from './lib/terra-nyc-extended-ingestion';
import {
  prewarmIntelligenceCache,
  scheduleIntelligenceCachePruning,
  scheduleIntelligenceRefresh,
} from './routes/intelligence/index.js';
import { seedTerraPortfolioModules } from './routes/terra-portfolio-intel';
import { registerAllPrismJobHandlers } from './services/prism-job-handlers';
import { startPrismJobPoller } from './services/prism-queue';
import './lib/cross-app-notification-relay.js';
import { getAlloyRunManager } from './lib/alloy-run-manager-singleton';
import { registerAnalyticsJobHandlers } from './lib/analytics-jobs';
import { startMeshPublisher } from './lib/control-tower-mesh-publisher';
import { initializeAlloyDomainEventSubscriptions } from './lib/domain-events/alloy-wiring.js';
import { getWorkerStatus, startEmbeddingWorker, stopEmbeddingWorker } from './lib/embedding-worker';
import { initGuardianEngine } from './lib/guardian-engine';
import { initIngestionFramework } from './lib/ingestion-framework';
import { startIntelligenceFeeds, stopIntelligenceFeeds } from './lib/intelligence-feeds-init';
import { initDurablePersistence, stopDurablePersistence } from './lib/persistence-init';
import { providerHealth } from './lib/provider-health';
import { registerQueuedJobHandlers } from './lib/queued-jobs';
import { runAlertRuleEvaluation } from './routes/ops-management';

failFastOnInvalidConfig();

initializeAlloyDomainEventSubscriptions();

registerGenAITelemetryBridge();

// Wire the cognitive-observability BatchingExporter so that agent-layer metrics
// (step traces, latency, cost, error rates, approval wait times) are flushed to
// the OTEL Collector rather than accumulating in memory.
const { shutdown: shutdownCognitiveTelemetry } = initCognitiveTelemetry(
  Number(process.env.COGNITIVE_TELEMETRY_FLUSH_INTERVAL_MS ?? '60000'),
);

// Must match the V8 --max-old-space-size flag passed in start.sh; otherwise the
// monitor under/over-reports pressure and floods logs with false criticals.
const HEAP_LIMIT_MB = Number(process.env['NODE_HEAP_LIMIT_MB'] ?? '1536');
const HEAP_CRITICAL_THRESHOLD_MB = Math.round(HEAP_LIMIT_MB * 0.92);
const HEAP_WARN_THRESHOLD_MB = Math.round(HEAP_LIMIT_MB * 0.82);
const HEAP_GC_THRESHOLD_MB = Math.round(HEAP_LIMIT_MB * 0.7);

export { getAlloyRunManager } from './lib/alloy-run-manager-singleton';
export {
  getGuardianEngine,
  recordGuardianAction,
  syncGuardianPolicies,
} from './lib/guardian-engine';
export { app };

export async function bootstrap(
  server: http.Server,
  port: number,
  onMigrationsReady?: (handler: http.RequestListener) => void,
): Promise<http.RequestListener> {
  await otelReady;

  buildGraphQLMiddleware(server)
    .then((middleware) => {
      registerGraphQLHandler(middleware);
      logger.info('GraphQL endpoint mounted at /api/graphql');
      logger.info('GraphQL subscriptions available at wss://.../api/graphql/ws');
    })
    .catch((err) => {
      logger.warn({ err }, 'GraphQL initialization failed — continuing without GraphQL');
    });

  initWebSocket(server);
  startPrismBusBridge();
  startDomainNotificationGenerators();
  registerApprovalNotificationHook();
  startSelfMonitoring();
  startHealthDegradationWatcher();

  providerHealth.startActiveProbes();
  registerAllPrismJobHandlers();
  registerAnalyticsJobHandlers();
  registerQueuedJobHandlers();
  const prismPoller = startPrismJobPoller(5000);

  const memoryMonitor = setInterval(() => {
    const { heapUsed, heapTotal } = process.memoryUsage();
    const heapUsedMb = Math.round(heapUsed / 1024 / 1024);
    const heapTotalMb = Math.round(heapTotal / 1024 / 1024);
    if (heapUsedMb >= HEAP_CRITICAL_THRESHOLD_MB) {
      logger.error(
        {
          heapUsedMb,
          heapTotalMb,
          limitMb: HEAP_LIMIT_MB,
        },
        '[memory] Heap usage critical — forcing GC',
      );
      if (global.gc) {
        global.gc();
        global.gc();
      }
    } else if (heapUsedMb >= HEAP_WARN_THRESHOLD_MB) {
      logger.warn(
        {
          heapUsedMb,
          heapTotalMb,
          limitMb: HEAP_LIMIT_MB,
        },
        '[memory] Heap usage elevated — running GC',
      );
      if (global.gc) global.gc();
    } else if (heapUsedMb >= HEAP_GC_THRESHOLD_MB) {
      if (global.gc) global.gc();
    }
  }, 20_000);
  memoryMonitor.unref();

  logger.info({ port, host: '0.0.0.0' }, 'Server listening');

  // Schedule analytics aggregation every hour
  setInterval(
    () => {
      import('./lib/analytics-jobs.js')
        .then(({ runMetricsAggregation }) => {
          runMetricsAggregation({ lookbackHours: 2 }).catch((err) => {
            logger.warn({ err }, '[analytics] Hourly metrics aggregation failed (non-fatal)');
          });
        })
        .catch((err) =>
          logger.warn({ err }, '[analytics] Failed to load analytics-jobs for scheduling'),
        );
    },
    60 * 60 * 1000,
  );

  // Schedule anomaly scan every 6 hours
  setInterval(
    () => {
      import('./lib/analytics-jobs.js')
        .then(({ runAnomalyScan }) => {
          runAnomalyScan({ lookbackDays: 14 }).catch((err) => {
            logger.warn({ err }, '[analytics] Anomaly scan failed (non-fatal)');
          });
        })
        .catch((err) =>
          logger.warn({ err }, '[analytics] Failed to load analytics-jobs for anomaly scan'),
        );
    },
    6 * 60 * 60 * 1000,
  );

  // Schedule alert rule evaluation on a configurable interval (default: 5 minutes)
  const alertEvalIntervalMinutes = Math.max(
    1,
    parseInt(process.env['ALERT_EVAL_INTERVAL_MINUTES'] ?? '5', 10) || 5,
  );
  const alertEvalIntervalMs = alertEvalIntervalMinutes * 60 * 1000;
  logger.info(
    { intervalMinutes: alertEvalIntervalMinutes },
    '[alert-eval] Scheduling automatic alert rule evaluation',
  );
  const alertEvalInterval = setInterval(() => {
    const runAt = new Date().toISOString();
    runAlertRuleEvaluation()
      .then(({ evaluated, fired, metrics }) => {
        logger.info(
          { runAt, evaluated, fired, metrics },
          '[alert-eval] Scheduled evaluation complete',
        );
      })
      .catch((err) => {
        logger.warn({ err, runAt }, '[alert-eval] Scheduled evaluation failed (non-fatal)');
      });
  }, alertEvalIntervalMs);
  alertEvalInterval.unref();

  // Schedule background drift sampling so the Pulse Drift Trend chart grows
  // continuously even when nobody opens the System Health page. Configurable
  // via DRIFT_SAMPLE_INTERVAL_MINUTES (default: 15 minutes, minimum: 1).
  const driftSampleIntervalMinutes = Math.max(
    1,
    parseInt(process.env['DRIFT_SAMPLE_INTERVAL_MINUTES'] ?? '15', 10) || 15,
  );
  const driftSampleIntervalMs = driftSampleIntervalMinutes * 60 * 1000;
  logger.info(
    { intervalMinutes: driftSampleIntervalMinutes },
    '[drift] Scheduling automatic drift sampling',
  );
  const driftSampleInterval = setInterval(() => {
    import('./routes/drift.js')
      .then(({ sampleAndPersistDrift }) => {
        sampleAndPersistDrift()
          .then((summary) => {
            logger.info(
              {
                measuredAt: summary.measuredAt,
                overallDriftScore: summary.overallDriftScore,
                status: summary.status,
              },
              '[drift] Background drift snapshot recorded',
            );
          })
          .catch((err) => {
            logger.warn({ err }, '[drift] Background drift sampling failed (non-fatal)');
          });
      })
      .catch((err) => logger.warn({ err }, '[drift] Failed to load drift module for scheduling'));
  }, driftSampleIntervalMs);
  driftSampleInterval.unref();

  // Schedule automatic Lyte signal fusion runs so CONSTELLATION stays current
  // without requiring an operator to click "Run Fusion". Configurable via
  // SIGNAL_FUSION_INTERVAL_MINUTES (default: 15 minutes, minimum: 1).
  const signalFusionIntervalMinutes = Math.max(
    1,
    parseInt(process.env['SIGNAL_FUSION_INTERVAL_MINUTES'] ?? '15', 10) || 15,
  );
  const signalFusionIntervalMs = signalFusionIntervalMinutes * 60 * 1000;
  logger.info(
    { intervalMinutes: signalFusionIntervalMinutes },
    '[signal-fusion] Scheduling automatic signal fusion runs',
  );
  const runScheduledSignalFusion = () => {
    import('./routes/lyte-cognitive.js')
      .then(({ runSignalFusion }) => {
        runSignalFusion({ trigger: 'scheduled' })
          .then((result) => {
            logger.info(
              { ranAt: result.ranAt, fusedCount: result.fusedCount, errorCount: result.errorCount },
              '[signal-fusion] Scheduled fusion run complete',
            );
          })
          .catch((err) => {
            logger.warn({ err }, '[signal-fusion] Scheduled fusion run failed (non-fatal)');
          });
      })
      .catch((err) =>
        logger.warn({ err }, '[signal-fusion] Failed to load lyte-cognitive module for scheduling'),
      );
  };
  // Prime the state with an initial run shortly after boot so the Signal
  // Fusion tab shows a fresh lastFusion snapshot without needing a manual
  // trigger. Delayed so it doesn't contend with the bootstrap work above.
  const signalFusionKickoff = setTimeout(runScheduledSignalFusion, 30_000);
  signalFusionKickoff.unref();
  const signalFusionInterval = setInterval(runScheduledSignalFusion, signalFusionIntervalMs);
  signalFusionInterval.unref();

  import('./routes/rmm')
    .then((m) => m.startSyncScheduler())
    .catch((err) => logger.warn({ err }, 'RMM sync scheduler start failed (non-fatal)'));
  pingRedis().catch((err) => logger.warn({ err }, '[redis] Startup ping failed (non-fatal)'));
  prewarmIntelligenceCache().catch((err) => {
    logger.warn({ err }, '[intelligence-cache] Prewarm failed (non-fatal)');
  });
  scheduleIntelligenceRefresh();
  scheduleIntelligenceCachePruning();

  import('@szl-holdings/ai-engine')
    .then(({ startCognitiveLearning }) => startCognitiveLearning())
    .catch((err) =>
      logger.warn({ err }, '[cognitive] Cognitive learning startup failed (non-fatal)'),
    );

  startIntelligenceFeeds().catch((err) =>
    logger.warn({ err }, '[feeds] Intelligence feeds startup failed (non-fatal)'),
  );
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
        logger.warn(
          { migErr, attempt, isLast },
          `[bootstrap] Migration attempt ${attempt} failed${isLast ? ' — giving up' : ' — retrying'}`,
        );
        if (isLast) throw migErr;
        await new Promise((r) => setTimeout(r, Math.min(1000 * attempt, 8000)));
      }
    }
    if (migrationsComplete) {
      logger.info('[bootstrap] All migrations complete');
    }

    // Schema is durable — open the live handler now so the server can serve
    // traffic while the rest of the post-migration init proceeds in the
    // background. Without this, slow optional inits (Guardian engine, durable
    // queue, seeds, etc.) gate the entire HTTP surface behind a 503 wall.
    if (onMigrationsReady) {
      try {
        onMigrationsReady(app as unknown as http.RequestListener);
        logger.info('[bootstrap] Live HTTP handler activated — post-migration init continues in background');
      } catch (err) {
        logger.warn({ err }, '[bootstrap] onMigrationsReady callback threw (non-fatal)');
      }
    }

    // Step 2: Platform flags and knowledge store depend on schema being ready
    await ensurePlatformFlags();
    await knowledgeStore.loadFromDb();
    logger.info('[bootstrap] Platform flags and knowledge store loaded');

    // Step 2b: Wire Trace Graph and Memory Fabric to Postgres so traces,
    // approvals, audit trails, and agent memory survive restarts.
    await initDurablePersistence();

    // Step 2b-1: Wire the durable Postgres-backed evidence ledger so AUDIT
    // entries (the canonical chain INGEST→…→AUDIT→DELIVER) survive restarts
    // and are queryable by trace-id, entity, and workflow-run-id. Without
    // this swap, defaultEvidenceLedgerStore stays in-memory and AUDIT durability
    // collapses on every redeploy.
    try {
      const { pool } = await import('@szl-holdings/db');
      const { defaultEvidenceLedgerStore, PostgresEvidenceLedgerStore } = await import(
        '@szl-holdings/evidence-ledger'
      );
      const pgEvidenceStore = new PostgresEvidenceLedgerStore(pool);
      await pgEvidenceStore.ensureTable();
      defaultEvidenceLedgerStore.setBackend(pgEvidenceStore);
      logger.info('[bootstrap] Evidence ledger backend swapped to Postgres (durable)');
    } catch (err) {
      logger.warn(
        { err },
        '[bootstrap] Evidence ledger Postgres backend wiring failed — falling back to in-memory store. AUDIT entries will not survive restart.',
      );
    }

    // Step 2b-2: Wire AI evaluation traces and review queue to Postgres so
    // all AI ops data survives server restarts.
    const { initAiEvalsPersistence } = await import('./lib/ai-evals-persistence.js');
    await initAiEvalsPersistence();

    // Step 2b-2b: Wire the AEF DomainProfileRegistry to Postgres so that
    // tenant-scoped profile rotations (rotate_profile_version / rollback)
    // survive API server restarts instead of silently resetting to defaults.
    const { initAefProfileRegistryPersistence } = await import('./lib/aef-profile-store.js');
    await initAefProfileRegistryPersistence();

    // Step 2b-3: Bridge per-product domain events into the global signal
    // mesh so the Fabric page reflects live product activity.
    const { initSignalMeshBridge } = await import('./lib/domain-events/signal-mesh-bridge.js');
    initSignalMeshBridge();

    // Step 2c: Hydrate the shared Guardian decision engine from policy rows
    // and warm the Alloy RunManager singleton so any agent endpoint can
    // submit work as soon as the server starts accepting traffic.
    await initGuardianEngine();
    getAlloyRunManager();
    logger.info('[bootstrap] Guardian engine and Alloy RunManager ready');

    // Step 3: Start durable (PostgreSQL-backed) job queue
    await startDurableQueue();

    startEmbeddingWorker();
    // Non-fatal health check: log embedding model/schema compatibility at startup.
    import('@szl-holdings/ai-engine/embedding-pipeline')
      .then(({ listEmbeddingProviders }) => {
        const providers = listEmbeddingProviders();
        const modelId = process.env['HF_EMBED_MODEL'] ?? 'BAAI/bge-m3';
        const current = providers.find((p) => p.id === modelId) ?? providers[0];
        const status = getWorkerStatus();
        logger.info(
          {
            workerRunning: status.running,
            pollIntervalMs: status.pollIntervalMs,
            modelId: current?.id,
            schemaDimension: current?.schemaDimension,
            schemaCompatible: current?.schemaCompatible,
            normalisationApplied: current?.normalisationApplied,
            totalProviders: providers.length,
          },
          '[embedding-health] Embedding worker started — model/schema compatibility report',
        );
        if (current && !current.schemaCompatible) {
          logger.warn(
            {
              model: current.id,
              schemaDimension: current.schemaDimension,
            },
            '[embedding-health] Active model dimension does not match VECTOR_DIM — vectors will be normalised at write time',
          );
        }
      })
      .catch((err) =>
        logger.warn({ err }, '[embedding-health] Startup compatibility check failed (non-fatal)'),
      );

    // Push notification background jobs (receipt verification + scheduled sends)
    const RECEIPT_VERIFY_INTERVAL_MS = 5 * 60 * 1000;
    const receiptVerifyInterval = setInterval(() => {
      verifyPushReceipts().catch((err) =>
        logger.warn({ err }, '[push] Receipt verification error (non-fatal)'),
      );
    }, RECEIPT_VERIFY_INTERVAL_MS);
    receiptVerifyInterval.unref();

    const SCHEDULED_NOTIF_INTERVAL_MS = 60 * 1000;
    const scheduledNotifInterval = setInterval(() => {
      processScheduledNotifications().catch((err) =>
        logger.warn({ err }, '[push] Scheduled notification processing error (non-fatal)'),
      );
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
      logger.info(
        { mode: currentMode },
        '[seed] Demo seed enabled — running platform/MSP/Dreamscape seeds',
      );
      seedPlatformData().catch((err) => {
        logger.warn({ err }, '[seed-platform] Seed failed (non-fatal)');
      });
      seedMspData().catch((err) => {
        logger.warn({ err }, '[msp-seed] MSP demo seed failed (non-fatal)');
      });
      seedDreamscapeData().catch((err) => {
        logger.warn({ err }, '[seed-dreamscape] Creative Workflows seed failed (non-fatal)');
      });
      seedConstellationData().catch((err) => {
        logger.warn({ err }, '[seed-constellation] Constellation graph seed failed (non-fatal)');
      });
      seedLyteActions().catch((err) => {
        logger.warn({ err }, '[seed-lyte-actions] Lyte action queue seed failed (non-fatal)');
      });
      seedLyteSurfaces().catch((err) => {
        logger.warn({ err }, '[seed-lyte-surfaces] Lyte surfaces seed failed (non-fatal)');
      });
      seedTerraPortfolioModules().catch((err) => {
        logger.warn(
          { err },
          '[seed-terra-portfolio-modules] Terra portfolio module seed failed (non-fatal)',
        );
      });
    } else {
      logger.info(
        { mode: currentMode },
        '[seed] Demo seeds suppressed — runtime mode does not permit seed data. Set DEMO_MODE=true or ENABLE_DEMO_SEED=true to enable in non-production environments.',
      );
    }
    // Guardian default tier policies are operational data (not demo data) — always seed.
    seedGuardianDefaults().catch((err) => {
      logger.warn({ err }, '[seed-guardian] Guardian defaults seed failed (non-fatal)');
    });
    seedGuardianTiers().catch((err) => {
      logger.warn({ err }, '[seed-guardian] Guardian tier seed failed (non-fatal)');
    });
    // Knowledge base articles are operational content — always seed if table is empty.
    seedKnowledgeBase().catch((err) => {
      logger.warn({ err }, '[seed-kb] Knowledge base seed failed (non-fatal)');
    });
    // AI budget policies are operational controls — always register on startup.
    seedAiBudgetPolicies();
    initIngestionFramework().catch((err) => {
      logger.warn({ err }, '[ingestion] Framework init failed (non-fatal)');
    });

    logger.info('[bootstrap] Bootstrap sequence complete — server fully ready');

    const startupMatrix = await (async () => {
      try {
        const { services: svc } = await import('@szl-holdings/services');
        return (
          svc.getHealthMatrix?.() ?? {
            summary: { total: 0, liveConfigured: 0, mockedDemoMode: 0 },
            services: [],
          }
        );
      } catch {
        return { summary: { total: 0, liveConfigured: 0, mockedDemoMode: 0 }, services: [] };
      }
    })();

    const enabledFeatures: string[] = [];
    if (process.env.STRIPE_SECRET_KEY) enabledFeatures.push('stripe-payments');
    if (process.env.AZURE_AD_CLIENT_ID) enabledFeatures.push('azure-sso');
    if (process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY) enabledFeatures.push('email');
    if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY)
      enabledFeatures.push('ai-engine');
    if (process.env.REDIS_URL || process.env.REDIS_HOST) enabledFeatures.push('redis');
    if (process.env.S3_BUCKET || process.env.OBJECT_STORE_BUCKET)
      enabledFeatures.push('object-storage');
    if (process.env.OTLP_ENDPOINT || process.env.OTEL_EXPORTER_OTLP_ENDPOINT)
      enabledFeatures.push('opentelemetry');
    if (process.env.AZURE_APP_INSIGHTS_CONNECTION_STRING) enabledFeatures.push('azure-monitor');
    if (process.env.NEW_RELIC_LICENSE_KEY) enabledFeatures.push('new-relic');
    if (process.env.EXPO_ACCESS_TOKEN) enabledFeatures.push('expo-push');

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
      } catch {
        /* non-fatal */
      }
      return count;
    })();

    logger.info(
      {
        event: 'server_startup',
        port,
        environment: process.env.NODE_ENV ?? 'development',
        nodeVersion: process.version,
        enabledFeatures,
        featureCount: enabledFeatures.length,
        connectors: {
          total: startupMatrix.summary.total,
          live: startupMatrix.summary.liveConfigured,
          demo: startupMatrix.summary.mockedDemoMode,
        },
        services: {
          database: 'postgresql',
          jobQueue: 'durable-postgresql',
          websocket: 'ws',
        },
        routeCount,
      },
      '[startup] API server fully ready — configuration summary',
    );
  } catch (err) {
    logger.fatal(
      { err },
      'Schema bootstrap failed — cannot guarantee data integrity, shutting down',
    );
    process.exit(1);
  }

  const SHUTDOWN_TIMEOUT_MS = 10_000;

  async function shutdown(signal: string) {
    logger.info({ signal }, 'Graceful shutdown initiated');

    const shutdownTimer = setTimeout(() => {
      logger.error('Shutdown timeout exceeded — forcing exit');
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
      logger.info('HTTP server closed');
    } catch (err) {
      logger.warn({ err }, 'Error closing HTTP server');
    }

    await flushSentry(2000).catch(() => {});

    stopDomainNotificationGenerators();
    stopSelfMonitoring();
    stopHealthDegradationWatcher();
    stopPrismBusBridge();
    stopEmbeddingWorker();
    await stopIntelligenceFeeds();
    providerHealth.stopActiveProbes();
    agentScheduler.stop();
    clearInterval(prismPoller);

    try {
      await jobQueue.shutdown();
      logger.info('Job queue flushed');
    } catch (err) {
      logger.warn({ err }, 'Error flushing job queue');
    }

    try {
      durableScheduler.stop();
      await durableJobQueue.shutdown();
      logger.info('Durable job queue flushed');
    } catch (err) {
      logger.warn({ err }, 'Error flushing durable job queue');
    }

    try {
      await stopDurablePersistence();
    } catch (err) {
      logger.warn({ err }, 'Error flushing trace/memory persistence');
    }

    try {
      await shutdownCognitiveTelemetry();
    } catch (err) {
      logger.warn({ err }, 'Error flushing cognitive telemetry metrics');
    }

    try {
      const { pool, healthPool } = await import('@szl-holdings/db');
      await Promise.allSettled([pool.end(), healthPool.end()]);
      logger.info('Database pools closed');
    } catch (err) {
      logger.warn({ err }, 'Error closing DB pool (may not be configured)');
    }

    clearTimeout(shutdownTimer);
    logger.info('Graceful shutdown complete');
    process.exit(0);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception — shutting down');
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled promise rejection — shutting down');
    shutdown('unhandledRejection');
  });

  return app as unknown as http.RequestListener;
}

if (!process.env.__FAST_START_SERVER) {
  const rawPort = process.env['PORT'];
  if (!rawPort) {
    throw new Error('PORT environment variable is required but was not provided.');
  }
  const port = Number(rawPort);
  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  let readyHandler: http.RequestListener = app as unknown as http.RequestListener;
  let bootstrapDone = false;
  const startingHandler: http.RequestListener = (_req, res) => {
    if (bootstrapDone) return readyHandler(_req, res);
    (res as http.ServerResponse).writeHead(503, { 'Content-Type': 'application/json' });
    (res as http.ServerResponse).end(
      JSON.stringify({ status: 'starting', message: 'API server is initializing, please retry' }),
    );
  };

  const server = http.createServer((req, res) => startingHandler(req, res));
  server.listen(port, '0.0.0.0', () => {
    logger.info({ port, host: '0.0.0.0' }, 'Server listening (fast-start)');
    bootstrap(server, port, (handler) => {
      readyHandler = handler;
      bootstrapDone = true;
      logger.info({ port }, '[api-server] Live handler activated post-migrations — accepting traffic');
    })
      .then((handler) => {
        readyHandler = handler;
        bootstrapDone = true;
        logger.info({ port }, '[api-server] Fully ready — switching to live handler');
      })
      .catch((err) => {
        logger.fatal({ err }, 'Bootstrap failed — shutting down');
        process.exit(1);
      });
  });
}
