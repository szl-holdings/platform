import http from 'node:http';
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
import { validateMarketDataConfig } from './lib/market-data-adapter';
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
import {
  markOpsReady,
  markStartupReady,
  runBootSeedSequence,
  type SeedTask,
} from './lib/boot-orchestrator';
import { runOpsMgmtBootInit } from './routes/ops-management';
import { startCacheInvalidationBus, stopCacheInvalidationBus } from './lib/cache-invalidation-bus';
import { ensurePlatformFlags } from './lib/platform-flags';
import { ensureRuntimeConfigDefaults } from './lib/runtime-config';
import { runMigrations } from './lib/run-migrations';
import { runStartupSmokeCheck } from './lib/startup-smoke-check';
import { validateHFConnectivity } from './lib/startup-validation';
import { startSelfMonitoring, stopSelfMonitoring } from './lib/self-monitor';
import { startScheduledTriggerChecks, stopScheduledTriggerChecks } from '@szl-holdings/ai-engine';
import './lib/terra-nyc-ingestion';
import './lib/terra-nyc-extended-ingestion';
import { startOtIcsStreamFeed } from './jobs/ot-ics-stream-feed';
import { startRosieEvolutionLoop } from './jobs/rosie-evolution-loop';
import { isSeedDataAllowed, resolveRuntimeMode } from '@szl-holdings/platform-registry';
import { shutdownTracer } from '@szl-holdings/observability';
import { otelReady, registerGraphQLHandler } from './app.js';
import { buildGraphQLMiddleware } from './graphql/index.js';
import { initCognitiveTelemetry } from './lib/cognitive-telemetry.js';
import { initSandboxRuntime } from './lib/sandbox-init.js';
import { registerGenAITelemetryBridge } from './lib/genai-telemetry-bridge.js';
import { registerInferenceLogBridge } from './lib/inference-log-bridge.js';
import { pingRedis } from './lib/redis-client.js';
import { providerCircuitBreaker } from './lib/ai-gateway.js';
import { seedAiBudgetPolicies } from './lib/seed-ai-budget';
import { seedConstellationData } from './lib/seed-constellation';
import { seedDreamscapeData } from './lib/seed-dreamscape';
import { seedGuardianDefaults, seedGuardianTiers } from './lib/seed-guardian';
import { seedKnowledgeBase } from './lib/seed-kb';
import { seedLyteActions } from './lib/seed-lyte-actions';
import { seedLyteSurfaces } from './lib/seed-lyte-surfaces';
import { seedMspData } from './lib/seed-msp';
import { seedPlatformData } from './lib/seed-platform';
import { seedBillingData } from './seed/seed-billing';
import { seedA11oyCognitive } from './lib/seed-a11oy-cognitive';
import { seedA11oyZeroTrust } from './lib/seed-a11oy-zero-trust';
import { seedDoctrineData } from './routes/doctrine-crud';
import {
  prewarmIntelligenceCache,
  scheduleIntelligenceCachePruning,
  scheduleIntelligenceRefresh,
} from './routes/intelligence/index.js';
import { scheduleSentraFeedRefresh } from './routes/sentra-threat-feeds.js';
import { seedTerraPortfolioModules } from './routes/terra-portfolio-intel';
import { seedTerraDemo, seedTerraOperatingModules } from './lib/terra-seed';
import { registerAllPrismJobHandlers } from './services/prism-job-handlers';
import { startPrismJobPoller } from './services/prism-queue';
import './lib/cross-app-notification-relay.js';
import { getAlloyRunManager } from './lib/alloy-run-manager-singleton';
import { registerAnalyticsJobHandlers } from './lib/analytics-jobs';
import { startMeshPublisher } from './lib/control-tower-mesh-publisher';
import { cleanupExpiredIdempotencyRecords } from './middlewares/idempotency';
import { stopLoadMetricsSampling } from './middlewares/load-shedder';
import { initializeAlloyDomainEventSubscriptions } from './lib/domain-events/alloy-wiring.js';
import { getWorkerStatus, startEmbeddingWorker, stopEmbeddingWorker } from './lib/embedding-worker';
import { initGuardianEngine } from './lib/guardian-engine';
import { initIngestionFramework } from './lib/ingestion-framework';
import { startIntelligenceFeeds, stopIntelligenceFeeds } from './lib/intelligence-feeds-init';
import { initDurablePersistence, stopDurablePersistence } from './lib/persistence-init';
import { initFusionPersistence } from './lib/fusion-persistence';
import { providerHealth } from './lib/provider-health';
import { registerQueuedJobHandlers } from './lib/queued-jobs';
import { startAtlasExportProcessor, stopAtlasExportProcessor } from './jobs/atlas-export-processor';
import { runPulsePushDelivery } from './jobs/pulse-push-delivery';
import { runAdversaryEmulationLoop } from './jobs/adversary-emulation-loop';
import { runAlertRuleEvaluation } from './routes/ops-management';
import { startSloComputationScheduler } from './lib/slo-engine';
import { bootstrapChainState } from './routes/signal-chains';
import { twinRegistry } from '@szl-holdings/ai-engine';
import { initializePersistentCA, setDefaultCA, setPersistentCAStore } from '@szl-holdings/pqc-identity';
import { DrizzlePersistentCAStore } from './lib/pqc-db-store';
import { bootstrapPlatformIdentity } from './lib/identity-bootstrap';
import { bootstrapSentraDefense } from './lib/sentra-defense-bootstrap';

failFastOnInvalidConfig();
validateMarketDataConfig();

initializeAlloyDomainEventSubscriptions();

registerGenAITelemetryBridge();
registerInferenceLogBridge();

// ── Model Passport resolver ─────────────────────────────────────────────────
// Installs the live-DB-backed passport resolver into the ai-engine model router
// so that every routerCall consults the signed passport registry for primary
// model selection and the downgrade ladder on failure. Passports in 'draft',
// 'proposed', 'deprecated', or 'revoked' state are never returned by the
// resolver — only 'active' passports with verified Ed25519 signatures govern
// routing. Falls back transparently to the static lane→model map when no
// active passport matches.
import { installPassportResolver } from './lib/passport-resolver-runtime.js';
installPassportResolver();

// ── Model Passport drift auto-proposal ─────────────────────────────────────
// Registers a DriftSignal handler on the module-level driftDetector singleton.
// When a live passport's cost/latency/accuracy crosses declared SLO thresholds,
// a Covenant Policy approval request is automatically filed with deltas pre-filled,
// routing it into the Approval Queue without requiring a manual trigger.
import { registerDriftProposalHandler } from './lib/passport-drift-runtime.js';
registerDriftProposalHandler();

// Wire the cognitive-observability BatchingExporter so that agent-layer metrics
// (step traces, latency, cost, error rates, approval wait times) are flushed to
// the OTEL Collector rather than accumulating in memory.
const { shutdown: shutdownCognitiveTelemetry } = initCognitiveTelemetry(
  Number(process.env.COGNITIVE_TELEMETRY_FLUSH_INTERVAL_MS ?? '60000'),
);

// Must match the V8 --max-old-space-size flag passed in start.sh; otherwise the
// monitor under/over-reports pressure and floods logs with false criticals.
const HEAP_LIMIT_MB = Number(process.env.NODE_HEAP_LIMIT_MB ?? '1536');
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
  // Register process-level error handlers FIRST, before any await, so that
  // unhandled rejections from fire-and-forget background tasks started during
  // bootstrap are always intercepted regardless of which await suspended us.
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception — shutting down');
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    // In development, DB pool pressure from background tasks can produce
    // connection-timeout rejections that aren't consistently caught.
    // Only hard-crash in production where an uncaught rejection genuinely
    // indicates a serious bug that warrants a restart.
    const errMsg = reason instanceof Error ? reason.message : String(reason);
    const errStack = reason instanceof Error ? reason.stack : undefined;
    if (process.env.NODE_ENV === 'production') {
      logger.fatal({ err: reason, errMsg }, 'Unhandled promise rejection — shutting down');
      shutdown('unhandledRejection');
    } else {
      logger.error(
        { errMsg, errStack },
        'Unhandled promise rejection (development — not crashing; investigate if repeated)',
      );
    }
  });

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
  initFusionPersistence().catch((err) =>
    logger.warn({ err }, '[fusion-persistence] initFusionPersistence startup error (non-fatal)'),
  );
  twinRegistry.initialize().catch((err) =>
    logger.warn({ err }, '[twin-registry] Failed to initialize twin registry from DB (non-fatal)'),
  );
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
  startAtlasExportProcessor();

  const idempotencyCleanupInterval = setInterval(() => {
    cleanupExpiredIdempotencyRecords().catch((err) =>
      logger.warn({ err }, '[idempotency] Scheduled cleanup error (non-fatal)'),
    );
  }, 60 * 60 * 1000);
  idempotencyCleanupInterval.unref();

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

  // Best-effort artifact reachability smoke check. Deferred ~6s after
  // listen so the shared proxy / artifact dev servers have a moment to
  // bind their ports — running too early generates noisy false
  // negatives during cold-start. Never blocks startup.
  setTimeout(() => {
    runStartupSmokeCheck(logger).catch((err) =>
      logger.warn({ err }, '[smoke] Startup smoke check failed (non-fatal)'),
    );
  }, 6_000).unref();

  // Best-effort HuggingFace connectivity probe. Confirms Qwen3-8B is
  // reachable when HF_TOKEN is set; warns clearly when absent.
  // Never blocks startup.
  validateHFConnectivity().catch((err) =>
    logger.warn({ err }, '[hf] HuggingFace connectivity probe failed (non-fatal)'),
  );

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
    parseInt(process.env.ALERT_EVAL_INTERVAL_MINUTES ?? '5', 10) || 5,
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

  // Schedule SLO compliance computation every 5 minutes (Google multi-window burn-rate alerting)
  startSloComputationScheduler(
    Math.max(60_000, parseInt(process.env.SLO_COMPUTE_INTERVAL_MS ?? '300000', 10) || 300_000),
  );

  // Schedule background drift sampling so the Pulse Drift Trend chart grows
  // continuously even when nobody opens the System Health page. Configurable
  // via DRIFT_SAMPLE_INTERVAL_MINUTES (default: 15 minutes, minimum: 1).
  const driftSampleIntervalMinutes = Math.max(
    1,
    parseInt(process.env.DRIFT_SAMPLE_INTERVAL_MINUTES ?? '15', 10) || 15,
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
    parseInt(process.env.SIGNAL_FUSION_INTERVAL_MINUTES ?? '15', 10) || 15,
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

  // Poll active fine-tuning jobs every 60 seconds so status updates flow into
  // the DB automatically without requiring manual refresh from the admin UI.
  const ftPollerInterval = setInterval(() => {
    import('@szl-holdings/ai-engine')
      .then(({ listFineTuningJobs, pollJobStatus }) => {
        listFineTuningJobs()
          .then(async (jobs) => {
            const active = jobs.filter((j) =>
              ['pending', 'preparing', 'running'].includes(j.status),
            );
            for (const job of active) {
              await pollJobStatus(job.jobId).catch((err) => {
                logger.warn({ err, jobId: job.jobId }, '[fine-tuning-poller] poll error (non-fatal)');
              });
            }
            if (active.length > 0) {
              logger.info(
                { polled: active.length },
                '[fine-tuning-poller] Active job statuses refreshed',
              );
            }
          })
          .catch((err) => {
            logger.warn({ err }, '[fine-tuning-poller] Failed to list jobs (non-fatal)');
          });
      })
      .catch((err) => {
        logger.warn({ err }, '[fine-tuning-poller] Failed to import ai-engine (non-fatal)');
      });
  }, 60_000);
  ftPollerInterval.unref();

  import('./routes/rmm')
    .then((m) => m.startSyncScheduler())
    .catch((err) => logger.warn({ err }, 'RMM sync scheduler start failed (non-fatal)'));
  pingRedis().catch((err) => logger.warn({ err }, '[redis] Startup ping failed (non-fatal)'));
  providerCircuitBreaker
    .initialize()
    .catch((err) =>
      logger.warn({ err }, '[circuit-breaker] Failed to restore state from Redis (non-fatal)'),
    );
  prewarmIntelligenceCache().catch((err) => {
    logger.warn({ err }, '[intelligence-cache] Prewarm failed (non-fatal)');
  });
  scheduleIntelligenceRefresh();
  scheduleIntelligenceCachePruning();
  scheduleSentraFeedRefresh();

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
    // Step 1: Run all migrations — single await, schema fully guaranteed before any seed executes.
    // Retry up to 8 times with jittered exponential backoff so a single
    // transient DB connection timeout cannot crash the bootstrap. The inner
    // run-migrations module also retries the dedicated CONNECT step
    // independently, so genuine outages are bounded by both layers and
    // total wall time stays under ~2 minutes even in the worst case.
    let migrationsComplete = false;
    const MIGRATION_ATTEMPTS = 8;
    for (let attempt = 1; attempt <= MIGRATION_ATTEMPTS; attempt++) {
      try {
        await runMigrations();
        migrationsComplete = true;
        break;
      } catch (migErr) {
        const isLast = attempt === MIGRATION_ATTEMPTS;
        logger.warn(
          { migErr, attempt, isLast },
          `[bootstrap] Migration attempt ${attempt} failed${isLast ? ' — giving up' : ' — retrying with jittered backoff'}`,
        );
        if (isLast) throw migErr;
        const baseMs = Math.min(1000 * 2 ** (attempt - 1), 12_000);
        const jitter = Math.floor(Math.random() * 750);
        await new Promise((r) => setTimeout(r, baseMs + jitter));
      }
    }
    if (migrationsComplete) {
      logger.info('[bootstrap] All migrations complete');
      // Bootstrap Sentra Active Defense Fabric — registers DB-backed writers
      // for the evidence ledger, response queue, and event bus so that all
      // defense actions are persisted. Called after migrations so tables exist.
      bootstrapSentraDefense();

      // Start the live OT/ICS protocol stream feed (synthetic mode) only when
      // explicitly enabled — this prevents simulated data from polluting
      // production telemetry if the feed is not yet connected to a real source.
      if (process.env.OT_ICS_FEED_ENABLED === 'true') {
        startOtIcsStreamFeed();
      } else {
        logger.info(
          '[ot-ics-feed] Synthetic stream feed disabled (OT_ICS_FEED_ENABLED != "true"). Set OT_ICS_FEED_ENABLED=true to enable.',
        );
      }

      // ROSIE continuous-evolution loop — drains the formula drift
      // detector every ROSIE_LOOP_INTERVAL_MINUTES (default 15) and
      // posts tuning proposals into the A11oy /formulas Codex queue.
      // The loop is bounded autonomy — proposals never apply without
      // an operator decision. Disable with ROSIE_LOOP_ENABLED=false.
      if (process.env.ROSIE_LOOP_ENABLED !== 'false') {
        startRosieEvolutionLoop();
      } else {
        logger.info(
          '[rosie-loop] Disabled (ROSIE_LOOP_ENABLED=false). Unset or set to "true" to enable.',
        );
      }

      // Frontier Ingestion Engine — continuous pulls from Anthropic/OpenAI/
      // Google/NVIDIA/HuggingFace. Default OFF so we never make surprise
      // outbound calls; flip FRONTIER_INGEST_ENABLED=true to arm.
      // Subscribe downstream registries to promotion events. This is the
      // auto-routing seam: when the codex auto-promotes (or an operator
      // approves) an artifact, it lands in the operator model registry / chat
      // router availability list / thesis corpus / eval harness / tool-
      // proposal queue without further worker coupling. Listeners log their
      // dispatch into pino so the proof-chain is visible in workflow logs.
      try {
        const { onPromotion, onCapReached, ensureFrontierIngestDbSchema, isFrontierIngestDbEnabled, dbListPromotionsShared } = await import('@workspace/frontier-ingest');
        // Bootstrap the cross-process Postgres backend so the api-server,
        // the Temporal worker process, and any on-demand pulls share the
        // same artifacts/inbox/timeline/promotions/downstream state.
        try {
          await ensureFrontierIngestDbSchema();
          if (isFrontierIngestDbEnabled()) {
            logger.info('[frontier-ingest] postgres-shared backend ready (cross-process state)');
          } else {
            logger.warn('[frontier-ingest] DB backend unavailable — running in-memory only (single process)');
          }
        } catch (dbErr) {
          logger.warn({ err: dbErr }, '[frontier-ingest] DB backend bootstrap failed — falling back to in-memory');
        }
        const { addModelToRegistry } = await import('./a11oy/runtime/model-registry.js');
        const { appendDownstream } = await import('./a11oy/runtime/frontier-downstream.js');
        const { registerPromotedModel, enqueueToolProposalImprovement } = await import('./routes/a11oy-chat.js');

        // Cost-cap notifier: when either the lifetime or 24h-rolling cap
        // trips, log a warning so the proof-chain shows operators why
        // ingestion paused. (Webhook/email notifier is intentionally
        // pluggable — replace this listener with the platform's alerting
        // adapter when needed.)
        onCapReached((message, totals) => {
          logger.warn(
            { ...totals },
            `[frontier-ingest] cost cap reached — ingestion paused: ${message}`,
          );
        });

        const dispatchPromotion = (event: {
          target: string;
          at: string;
          artifact: {
            id: string;
            kind: string;
            externalId: string;
            title: string;
            url: string;
            summary?: string;
            provider: string;
          };
          evidence: { score: { composite: number }; decision: string };
        }) => {
          // Real downstream wiring — when an artifact is auto-promoted (or
          // operator-approved), if it targets the operator model registry
          // and is a model, register it into the live in-memory registry.
          // The registry entry starts gated (productionApproved=false,
          // sensitivityAllowance='restricted') so the chat router won't
          // route real traffic to it until an operator explicitly approves
          // — matching the existing addModelToRegistry contract.
          try {
            switch (event.target) {
              case 'operator_model_registry':
                if (event.artifact.kind === 'model') {
                  addModelToRegistry({
                    id: event.artifact.id,
                    hfModelId: event.artifact.externalId,
                    displayName: event.artifact.title,
                    provider: event.artifact.provider,
                    capabilities: ['reasoning'],
                    tier: 'experimental',
                    contextWindow: 0,
                    maxOutputTokens: 0,
                    inputCostPer1kTokens: 0,
                    outputCostPer1kTokens: 0,
                    license: 'unknown',
                    description:
                      event.artifact.summary ?? `Frontier-ingest discovery: ${event.artifact.title}`,
                  });
                  // Surface the promoted model in the A11oy chat router
                  // model picker immediately, with the codex composite
                  // score for the tooltip. This is the auto-wiring seam
                  // requested by #4888 — no manual router refresh.
                  registerPromotedModel({
                    artifactId: event.artifact.id,
                    externalId: event.artifact.externalId,
                    displayName: event.artifact.title,
                    provider: event.artifact.provider,
                    codexScore: event.evidence.score.composite,
                    summary: event.artifact.summary,
                    promotedAt: event.at,
                  });
                }
                break;
              case 'tool_proposals':
                // #4888: feed tool-proposal promotions into the #4786
                // improvement queue so operators review them in the
                // same surface they already use for low-MirrorEval turns.
                enqueueToolProposalImprovement({
                  artifactId: event.artifact.id,
                  title: event.artifact.title,
                  summary: event.artifact.summary,
                  codexScore: event.evidence.score.composite,
                  promotedAt: event.at,
                });
                // fall through to also append the downstream store entry
                // (operators still see it in /a11oy/frontier/downstream).
                // eslint-disable-next-line no-fallthrough
              case 'thesis_corpus':
              case 'eval_harness':
              case 'benchmark_registry': {
                // Concrete adapter: append to the in-process downstream
                // store so the queue is queryable via
                // /api/a11oy/frontier/downstream/:target. This is the
                // proof-chain seam — operators can verify a discovery
                // actually landed in its downstream system.
                appendDownstream(event.target, {
                  artifactId: event.artifact.id,
                  provider: event.artifact.provider,
                  kind: event.artifact.kind,
                  title: event.artifact.title,
                  url: event.artifact.url,
                  summary: event.artifact.summary,
                  codexScore: event.evidence.score.composite,
                  source: event.artifact.id.split(':')[0] ?? event.artifact.provider,
                  receivedAt: event.at,
                  proofChainRef: `frontier:${event.artifact.id}@${event.at}`,
                });
                logger.info(
                  {
                    target: event.target,
                    artifactId: event.artifact.id,
                    provider: event.artifact.provider,
                    kind: event.artifact.kind,
                  },
                  `[frontier-ingest] ${event.target}.append`,
                );
                break;
              }
            }
          } catch (regErr) {
            logger.warn({ err: regErr }, '[frontier-ingest] downstream registry write failed');
          }
          logger.info(
            {
              target: event.target,
              provider: event.artifact.provider,
              kind: event.artifact.kind,
              artifactId: event.artifact.id,
              decision: event.evidence.decision,
            },
            '[frontier-ingest] promotion dispatched downstream',
          );
        };
        onPromotion(dispatchPromotion);
        logger.info('[frontier-ingest] downstream promotion listeners armed');

        // Cross-process promotion poller — when the Temporal worker
        // process (or any other api-server replica) writes to
        // `frontier_promotions`, the in-process onPromotion EventEmitter
        // doesn't fire here. Poll the shared DB on a slow cadence and
        // dispatch any promotions newer than `lastSeenAt` so the
        // downstream wiring (model registry / thesis corpus / eval
        // harness / tool-proposals / benchmark-registry) stays
        // consistent across the whole stack. Dedup by artifactId+target.
        try {
          if (await isFrontierIngestDbEnabled()) {
            const seenKey = (target: string, artifactId: string) => `${target}::${artifactId}`;
            const seen = new Set<string>();
            // Seed `seen` with whatever's already in the DB so we don't
            // re-dispatch historical promotions on every restart.
            const initial = (await dbListPromotionsShared(500)) ?? [];
            let lastSeenAt = 0;
            for (const p of initial) {
              seen.add(seenKey(p.target, p.artifact.id));
              const t = Date.parse(p.at);
              if (Number.isFinite(t) && t > lastSeenAt) lastSeenAt = t;
            }
            const pollMs = Number(process.env.FRONTIER_PROMOTION_POLL_MS ?? '5000');
            const timer = setInterval(async () => {
              try {
                const rows = (await dbListPromotionsShared(200)) ?? [];
                for (const p of rows) {
                  const k = seenKey(p.target, p.artifact.id);
                  if (seen.has(k)) continue;
                  const t = Date.parse(p.at);
                  if (!Number.isFinite(t) || t <= lastSeenAt) {
                    seen.add(k);
                    continue;
                  }
                  seen.add(k);
                  if (t > lastSeenAt) lastSeenAt = t;
                  dispatchPromotion({
                    target: p.target,
                    at: p.at,
                    artifact: p.artifact,
                    evidence: { score: p.evidence.score, decision: p.evidence.decision },
                  });
                  logger.info(
                    { target: p.target, artifactId: p.artifact.id, source: 'cross-process-poller' },
                    '[frontier-ingest] cross-process promotion dispatched',
                  );
                }
              } catch (pollErr) {
                logger.warn({ err: pollErr }, '[frontier-ingest] cross-process promotion poll failed');
              }
            }, Math.max(1000, pollMs));
            timer.unref?.();
            logger.info(
              { pollMs, seeded: seen.size },
              '[frontier-ingest] cross-process promotion poller armed',
            );
          }
        } catch (pollSetupErr) {
          logger.warn({ err: pollSetupErr }, '[frontier-ingest] cross-process promotion poller setup failed');
        }
      } catch (err) {
        logger.warn({ err }, '[frontier-ingest] failed to arm downstream listeners');
      }

      if (process.env.FRONTIER_INGEST_ENABLED === 'true') {
        try {
          // Production scheduler is Temporal: try to ensure the durable
          // schedule exists. The actual workflow execution happens in the
          // dedicated Temporal worker process — api-server only owns the
          // schedule lifecycle. If Temporal is unreachable we fall back
          // to the in-process dev loop ONLY when the operator opts in via
          // FRONTIER_INGEST_DEV_WORKER=true. This guarantees production
          // never silently runs the setInterval fallback.
          const { ensureFrontierIngestSchedule, startWorker } = await import(
            '@workspace/frontier-ingest'
          );
          const scheduleResult = await ensureFrontierIngestSchedule();
          if (scheduleResult.ok) {
            logger.info(
              {
                scheduleId: scheduleResult.scheduleId,
                workflowType: scheduleResult.workflowType,
                taskQueue: scheduleResult.taskQueue,
              },
              '[frontier-ingest] Temporal schedule ensured (production scheduler)',
            );
          } else if (process.env.FRONTIER_INGEST_DEV_WORKER === 'true') {
            startWorker({ force: true });
            logger.warn(
              { reason: scheduleResult.reason },
              '[frontier-ingest] Temporal unavailable — dev in-process worker armed (FRONTIER_INGEST_DEV_WORKER=true)',
            );
          } else {
            logger.warn(
              { reason: scheduleResult.reason },
              '[frontier-ingest] Temporal unavailable and FRONTIER_INGEST_DEV_WORKER!=true — ingestion not scheduled',
            );
          }
        } catch (err) {
          logger.warn({ err }, '[frontier-ingest] failed to start scheduler');
        }
      } else {
        logger.info(
          '[frontier-ingest] Worker disabled (FRONTIER_INGEST_ENABLED != "true"). Operators can pull-on-demand from /a11oy/frontier-engine.',
        );
      }
    }

    try {
      const pqcStore = new DrizzlePersistentCAStore();
      setPersistentCAStore(pqcStore);
      const ca = await initializePersistentCA('SZL Holdings Root CA v1', pqcStore);
      setDefaultCA(ca);
      const stats = ca.getStats();
      logger.info(
        { certs: stats.totalIssued, logSize: stats.transparencyLogSize },
        '[pqc] Persistent CA initialized (DB-backed) — before HTTP handler',
      );
    } catch (pqcErr) {
      if (process.env.NODE_ENV === 'production') {
        logger.fatal({ err: pqcErr }, '[pqc] Persistent CA initialization failed — aborting in production');
        process.exit(1);
      } else {
        logger.warn({ err: pqcErr }, '[pqc] Persistent CA initialization failed (dev — continuing with ephemeral CA)');
      }
    }

    // Bootstrap the platform identity layer: mint/verify the platform-service DID
    // and its hybrid signing key (Ed25519 + ML-DSA-65). Must run after PQC CA
    // so the CA root is available if needed for future DID-bound cert issuance.
    // Runs before HTTP handler opens so the platform DID is available for signing
    // the very first audit event.
    try {
      const { platformServiceDid, bootstrapTimestamp } = await bootstrapPlatformIdentity();
      logger.info(
        { platformServiceDid, bootstrapTimestamp },
        '[identity] Platform identity bootstrapped — hybrid audit chain signing active',
      );
    } catch (identityErr) {
      if (process.env.NODE_ENV === 'production') {
        logger.fatal({ err: identityErr }, '[identity] Platform identity bootstrap failed — aborting in production');
        process.exit(1);
      } else {
        logger.warn(
          { err: identityErr },
          '[identity] Platform identity bootstrap failed (dev — audit events will be legacy_unsigned)',
        );
      }
    }

    // Schema is durable — open the live handler IMMEDIATELY so the server can
    // serve traffic while the rest of the post-migration init proceeds in the
    // background. Without this, slow optional inits (Guardian engine, durable
    // queue, seeds, chain state hydration, etc.) gate the entire HTTP surface
    // behind a 503 wall — and any one of them hanging (e.g. a query against a
    // table the migration order failed to create) takes the whole API down.
    if (onMigrationsReady) {
      try {
        onMigrationsReady(app as unknown as http.RequestListener);
        logger.info('[bootstrap] Live HTTP handler activated — post-migration init continues in background');
      } catch (err) {
        logger.warn({ err }, '[bootstrap] onMigrationsReady callback threw (non-fatal)');
      }
    }

    // Hydrate in-memory Signal Chain state from DB. Fire-and-forget with a
    // hard timeout so a hung query (missing relation, lock contention, etc.)
    // can never re-block the bootstrap sequence. The very first
    // /signal-chains request may see hardcoded defaults for a few hundred ms
    // until this resolves; that is far better than a permanent 503.
    //
    // IMPORTANT: bootstrapChainState() is attached its own .catch() BEFORE
    // being raced. This is critical — Promise.race() settling does NOT cancel
    // the original promise; if it later rejects (e.g. after DB statement_timeout
    // fires ~60 s), the rejection must already be handled to prevent an
    // unhandledRejection that would trigger process shutdown.
    // Allow up to 30 s for chainState to hydrate from the DB before falling
    // back to in-memory defaults.  The longer window accommodates cold-start
    // DB connection warm-up without generating spurious timeout warnings.
    const CHAIN_STATE_HYDRATE_TIMEOUT_MS = 30_000;
    const _chainStatePromise = bootstrapChainState().catch((err) => {
      logger.warn({ err }, '[bootstrap] chainState background hydration error (non-fatal)');
    });
    void Promise.race([
      _chainStatePromise,
      new Promise<void>((_, reject) =>
        setTimeout(
          () => reject(new Error(`bootstrapChainState exceeded ${CHAIN_STATE_HYDRATE_TIMEOUT_MS}ms`)),
          CHAIN_STATE_HYDRATE_TIMEOUT_MS,
        ),
      ),
    ]).catch((err) => {
      logger.info(
        { err },
        '[bootstrap] chainState hydration timed out — continuing with in-memory defaults (non-fatal)',
      );
    });

    // Per-step bootstrap timeout helper — ensures no single awaited init can
    // block the bootstrap sequence indefinitely (e.g. zombie DB connections,
    // slow migrations, or missing relations). Each step gets at most 20 s
    // before it is logged as timed-out and the chain continues regardless.
    const bootstrapStep = async (name: string, fn: () => Promise<unknown>, timeoutMs = 20_000) => {
      const t = Date.now();
      // Capture the fn() promise BEFORE racing so we can attach a .catch()
      // to prevent unhandled rejections if the timeout wins. When Promise.race()
      // settles on the timeout side, the original fn() promise is orphaned — it
      // keeps running in background and if it later rejects (e.g. pool timeout),
      // that rejection must already be caught or it surfaces as an unhandled
      // rejection and (in production) would crash the process.
      const fnPromise = fn();
      fnPromise.catch((err) => {
        logger.warn({ err }, `[bootstrap] ${name} background completion error (step already timed out — non-fatal)`);
      });
      try {
        await Promise.race([
          fnPromise,
          new Promise<void>((_, rej) =>
            setTimeout(() => rej(new Error(`${name} timed out after ${timeoutMs}ms`)), timeoutMs),
          ),
        ]);
        logger.info({ durationMs: Date.now() - t }, `[bootstrap] ${name} OK`);
      } catch (err) {
        logger.warn({ err, durationMs: Date.now() - t }, `[bootstrap] ${name} failed or timed out — continuing`);
      }
    };

    // Step 2: Platform flags, runtime config, and knowledge store depend on schema being ready
    await bootstrapStep('ensurePlatformFlags', ensurePlatformFlags);
    await bootstrapStep('ensureRuntimeConfigDefaults', ensureRuntimeConfigDefaults);
    // Cross-process cache invalidation bus: subscribes to Postgres
    // LISTEN/NOTIFY so a flag/config write on this worker is visible
    // on all other workers without waiting for the per-worker TTL to
    // expire. Failure here is non-fatal — invalidation falls back to
    // the existing TTL until the next reconnect succeeds.
    await bootstrapStep('startCacheInvalidationBus', () => startCacheInvalidationBus());
    await bootstrapStep('knowledgeStore.loadFromDb', () => knowledgeStore.loadFromDb());

    // Step 2b: Wire Trace Graph and Memory Fabric to Postgres so traces,
    // approvals, audit trails, and agent memory survive restarts.
    //
    // IMPORTANT: do NOT use bootstrapStep() here. bootstrapStep is fail-open and
    // timeout-based — it attaches a background .catch() and resolves the outer
    // await after the timeout regardless of whether initDurablePersistence has
    // actually finished. That would cause markStartupReady() to fire while
    // hydration is still running in the background, making /readyz report "ready"
    // prematurely. Instead we await initDurablePersistence() directly with a
    // hard timeout that rejects only after the promise settles or the limit elapses,
    // so the gate always reflects the true completion state.
    const DURABLE_PERSISTENCE_TIMEOUT_MS = 60_000;
    const durableHydrationStart = Date.now();
    try {
      await Promise.race([
        initDurablePersistence(),
        new Promise<void>((_, reject) =>
          setTimeout(
            () => reject(new Error(`initDurablePersistence exceeded ${DURABLE_PERSISTENCE_TIMEOUT_MS}ms`)),
            DURABLE_PERSISTENCE_TIMEOUT_MS,
          ),
        ),
      ]);
      logger.info(
        { durationMs: Date.now() - durableHydrationStart },
        '[bootstrap] initDurablePersistence OK',
      );
    } catch (err) {
      logger.warn(
        { err, durationMs: Date.now() - durableHydrationStart },
        '[bootstrap] initDurablePersistence failed or timed out — continuing with in-memory fallbacks',
      );
    }

    // Migrations complete + critical hydration settled (succeeded OR failed with
    // graceful fallback): flip the startup readiness gate so /readyz returns 200.
    // We mark ready even on hydration failure because initDurablePersistence
    // falls back to in-memory stores — the server can still serve requests,
    // just without durable persistence until a restart.
    markStartupReady();
    logger.info('[bootstrap] Startup readiness gate open — /readyz now returns 200');

    // Step 2b-1: Wire the durable Postgres-backed evidence ledger so AUDIT
    // entries (the canonical chain INGEST→…→AUDIT→DELIVER) survive restarts
    // and are queryable by trace-id, entity, and workflow-run-id. Without
    // this swap, defaultEvidenceLedgerStore stays in-memory and AUDIT durability
    // collapses on every redeploy.
    await bootstrapStep('evidenceLedger.ensureTable', async () => {
      const { pool } = await import('@szl-holdings/db');
      const { defaultEvidenceLedgerStore, PostgresEvidenceLedgerStore } = await import(
        '@szl-holdings/evidence-ledger'
      );
      const pgEvidenceStore = new PostgresEvidenceLedgerStore(pool);
      await pgEvidenceStore.ensureTable();
      defaultEvidenceLedgerStore.setBackend(pgEvidenceStore);
      logger.info('[bootstrap] Evidence ledger backend swapped to Postgres (durable)');
    });

    // Step 2b-2: Wire AI evaluation traces and review queue to Postgres so
    // all AI ops data survives server restarts.
    await bootstrapStep('initAiEvalsPersistence', async () => {
      const { initAiEvalsPersistence } = await import('./lib/ai-evals-persistence.js');
      await initAiEvalsPersistence();
    });

    // Step 2b-2b: Wire the AEF DomainProfileRegistry to Postgres so that
    // tenant-scoped profile rotations (rotate_profile_version / rollback)
    // survive API server restarts instead of silently resetting to defaults.
    await bootstrapStep('initAefProfileRegistryPersistence', async () => {
      const { initAefProfileRegistryPersistence } = await import('./lib/aef-profile-store.js');
      await initAefProfileRegistryPersistence();
    });

    // Step 2b-3: Bridge per-product domain events into the global signal
    // mesh so the Fabric page reflects live product activity.
    await bootstrapStep('initSignalMeshBridge', async () => {
      const { initSignalMeshBridge } = await import('./lib/domain-events/signal-mesh-bridge.js');
      initSignalMeshBridge();
    });
    await bootstrapStep('initSignalBusRuleEngine', async () => {
      const { initSignalBusRuleEngine } = await import('./routes/signal-bus.js');
      initSignalBusRuleEngine();
    });

    // Step 2c: Hydrate the shared Guardian decision engine from policy rows
    // and warm the Alloy RunManager singleton so any agent endpoint can
    // submit work as soon as the server starts accepting traffic.
    await bootstrapStep('initGuardianEngine', async () => {
      await initGuardianEngine();
      getAlloyRunManager();
      logger.info('[bootstrap] Guardian engine and Alloy RunManager ready');
    });

    // Step 2c.1: Bootstrap the Cognitive Reflexivity Engine. The engine
    // subscribes to type='cognitive-reflexive' on the global SignalBus,
    // dialectically reasons via Inner Monologue, persists strategies in the
    // Self-Model and routes non-advisory tier proposals through the Approvals
    // Inbox. Lazy-loaded singleton — getReflexivityRuntime() is idempotent.
    await bootstrapStep('initCognitiveReflexivity', async () => {
      const { getReflexivityRuntime } = await import('./lib/cognitive-reflexivity-runtime');
      getReflexivityRuntime();
      logger.info('[bootstrap] Cognitive Reflexivity Engine started');
    });

    // Step 2d: Register governed sandbox tools in the Tool Mesh gateway.
    // Must run at startup (not on first route load) so MCP clients can
    // discover sandbox tools via capability negotiation before any route
    // handler is invoked.
    await bootstrapStep('initSandboxRuntime', async () => {
      await initSandboxRuntime();
    });

    await bootstrapStep('initConduitEngine', async () => {
      const { initConduitEngine } = await import('./lib/conduit/index');
      initConduitEngine();
    });

    // Sync operator model registry + gate configs + active bypasses from DB
    // into the runtime in-memory registry so checkHfLiveRoutingGate reads
    // per-model overrides immediately (not just global env-var defaults).
    await bootstrapStep('syncModelRegistryFromDb', async () => {
      const { syncModelRegistryFromDb, expireStaleBypasses } = await import('./a11oy/runtime/model-registry.js');
      await syncModelRegistryFromDb();
      // Background sweeper: persistently deactivates expired bypass rows in DB every 5 min
      // so governance audit state stays accurate even when governance read endpoints are idle.
      setInterval(() => { void expireStaleBypasses(); }, 5 * 60 * 1000).unref();
    });

    // Step 3: Start durable (PostgreSQL-backed) job queue
    await bootstrapStep('startDurableQueue', startDurableQueue);

    startEmbeddingWorker();
    // Non-fatal health check: log embedding model/schema compatibility at startup.
    import('@szl-holdings/ai-engine/embedding-pipeline')
      .then(({ listEmbeddingProviders }) => {
        const providers = listEmbeddingProviders();
        const modelId = process.env.HF_EMBED_MODEL ?? 'BAAI/bge-m3';
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

    // Pulse morning briefing push delivery: runs every 15 minutes, dispatches
    // to users whose delivery_hour_utc matches the current UTC hour and who
    // have not already received a push today. No-ops outside configured hours.
    const PULSE_PUSH_INTERVAL_MS = 15 * 60 * 1000;
    const pulsePushInterval = setInterval(() => {
      runPulsePushDelivery().catch((err) =>
        logger.warn({ err }, '[pulse-push] Delivery run error (non-fatal)'),
      );
    }, PULSE_PUSH_INTERVAL_MS);
    pulsePushInterval.unref();

    // Adversary emulation loop: runs weekly (every 7 days). Executes ATT&CK-mapped
    // simulations against the three flagship CPS payloads, scores MTTD/MTTC/blast-radius/
    // FP-burden/analyst-hours, persists scorecards, and emits Cyber Resilience Trend
    // signals into the KORA/Lyte decision stream. Also alerts on regressions.
    const EMULATION_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
    const emulationInterval = setInterval(() => {
      runAdversaryEmulationLoop().catch((err) =>
        logger.warn({ err }, '[emulation-loop] Weekly run error (non-fatal)'),
      );
    }, EMULATION_INTERVAL_MS);
    emulationInterval.unref();
    // Kick off an initial run 5 minutes after boot so the scorecard is populated
    // without waiting a full week on first deployment.
    setTimeout(() => {
      runAdversaryEmulationLoop().catch((err) =>
        logger.warn({ err }, '[emulation-loop] Boot-time initial run error (non-fatal)'),
      );
    }, 5 * 60 * 1000).unref();

    // Step 3b: Register all job handlers and agent schedules BEFORE starting the scheduler.
    // This ensures no durable job is dequeued before its handler exists (prevents dead-lettering
    // on startup when the scheduler fires previously-due agent cron schedules from the DB).
    await bootstrapStep('registerDefaultSchedules', registerDefaultSchedules, 30_000);

    // Step 3c: Start the scheduler AFTER all handlers are registered
    await bootstrapStep('startDurableScheduler', startDurableScheduler, 30_000);

    // Step 3d: Start autonomous fine-tuning trigger checks (non-blocking, check hourly)
    if (process.env.AUTONOMOUS_TRAINING_ENABLED === 'true') {
      startScheduledTriggerChecks(60 * 60 * 1000);
      logger.info('[fine-tuning] Autonomous training trigger scheduler started');
    }

    // Step 4: Demo seeds + ops-mgmt init — SERIALISED behind a single
    // background chain (OBS-007 root-cause fix).
    //
    // Previously these helpers fired as ~11 concurrent fire-and-forget
    // promises plus a separate 60 s setTimeout for runOpsMgmtBootInit.
    // With DB_POOL_MAX=10 the resulting checkout fan-out produced ~30
    // long-checkout warnings per cold start and forced /ops endpoints to
    // silently read pre-seed state for the first minute.
    //
    // The orchestrator runs every seed sequentially behind try/catch (one
    // failed seed cannot abort the chain), then runs ops-mgmt schema
    // init, then flips the `opsReady` gate so /ops routes stop returning
    // 503 (see `requireOpsReady`). Synchronous `seedAiBudgetPolicies` and
    // sync ingestion-framework init still happen inline to preserve the
    // prior contract that they're available the moment listen() returns.
    const currentMode = resolveRuntimeMode();
    seedAiBudgetPolicies();

    const seedTasks: SeedTask[] = [];
    if (isSeedDataAllowed()) {
      logger.info(
        { mode: currentMode },
        '[seed] Demo seed enabled — sequencing platform/MSP/Dreamscape seeds',
      );
      seedTasks.push(
        { name: 'seedPlatformData', fn: seedPlatformData },
        { name: 'seedMspData', fn: seedMspData },
        { name: 'seedDreamscapeData', fn: seedDreamscapeData },
        { name: 'seedConstellationData', fn: seedConstellationData },
        { name: 'seedLyteActions', fn: seedLyteActions },
        { name: 'seedLyteSurfaces', fn: seedLyteSurfaces },
        { name: 'seedTerraPortfolioModules', fn: seedTerraPortfolioModules },
        { name: 'seedTerraDemo', fn: seedTerraDemo },
        { name: 'seedTerraOperatingModules', fn: seedTerraOperatingModules },
        { name: 'seedBillingData', fn: seedBillingData },
        { name: 'seedA11oyCognitive', fn: seedA11oyCognitive },
        { name: 'seedA11oyZeroTrust', fn: seedA11oyZeroTrust },
        { name: 'seedDoctrineData', fn: async () => {
          const { db, doctrineConstitutionsTable } = await import('@szl-holdings/db');
          const existing = await db.select().from(doctrineConstitutionsTable).limit(1);
          if (existing.length === 0) await seedDoctrineData();
        }},
      );
    } else {
      logger.info(
        { mode: currentMode },
        '[seed] Demo seeds suppressed — runtime mode does not permit seed data. Set DEMO_MODE=true or ENABLE_DEMO_SEED=true to enable in non-production environments.',
      );
    }
    // PQC Identity CA is initialized synchronously before the HTTP handler
    // opens (see above) — no need to include it in the deferred seed chain.

    // Guardian, knowledge base, and ingestion-framework tasks are
    // operational (not demo) — always sequence them.
    seedTasks.push(
      { name: 'seedGuardianDefaults', fn: seedGuardianDefaults },
      { name: 'seedGuardianTiers', fn: seedGuardianTiers },
      { name: 'seedKnowledgeBase', fn: seedKnowledgeBase },
      { name: 'initIngestionFramework', fn: initIngestionFramework },
      { name: 'runOpsMgmtBootInit', fn: () => runOpsMgmtBootInit() },
      {
        name: 'ensureCarlotaModelsRegistered',
        fn: async () => {
          const { ensureCarlotaModelsRegistered } = await import('./lib/carlota-model-seeder.js');
          const result = await ensureCarlotaModelsRegistered();
          logger.info(result, '[carlota-seeder] Carlota ML models seeded');
        },
      },
      {
        name: 'ensureCarlotaCaseStudySeeded',
        fn: async () => {
          const { ensureCaseStudySeeded } = await import('./lib/carlota-case-study-seed.js');
          await ensureCaseStudySeeded();
        },
      },
    );

    // Defer seed execution to the next event-loop iteration so that any
    // pool connections released by the hydration steps above are fully
    // returned before the seed chain begins its first checkout. This
    // prevents the seed fan-out from competing with residual hydration
    // connection teardown and eliminates the last source of OBS-007
    // warnings on cold start (serialised hydration + deferred seeding).
    setImmediate(() => {
      void runBootSeedSequence(seedTasks)
        .then(() => markOpsReady())
        .catch((err) => {
          logger.error({ err }, '[boot-seed] sequenced chain crashed unexpectedly');
          // Fail-open: even if the chain crashed, flip the gate so admin
          // endpoints aren't permanently 503'd. The individual seed
          // failures will already be logged inside runBootSeedSequence.
          markOpsReady();
        });
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

  const _shutdownEnv = Number(process.env.SHUTDOWN_TIMEOUT_MS);
  const SHUTDOWN_TIMEOUT_MS =
    Number.isFinite(_shutdownEnv) && _shutdownEnv >= 1000 ? _shutdownEnv : 10_000;

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

    try {
      await shutdownTracer(4000);
      logger.info('OTel tracer flushed');
    } catch (err) {
      logger.warn({ err }, 'Error flushing OTel tracer');
    }

    stopDomainNotificationGenerators();
    stopSelfMonitoring();
    // Release the dedicated LISTEN connection used by the cross-process
    // cache invalidation bus so it does not linger past graceful shutdown.
    await stopCacheInvalidationBus().catch((err) => {
      logger.warn({ err }, 'Error stopping cache invalidation bus');
    });
    stopScheduledTriggerChecks();
    stopHealthDegradationWatcher();
    stopPrismBusBridge();
    stopAtlasExportProcessor();
    stopEmbeddingWorker();
    stopLoadMetricsSampling();
    await stopIntelligenceFeeds();
    providerHealth.stopActiveProbes();
    agentScheduler.stop();
    clearInterval(prismPoller);
    clearInterval(ftPollerInterval);
    clearInterval(idempotencyCleanupInterval);

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

  return app as unknown as http.RequestListener;
}

if (!process.env.__FAST_START_SERVER) {
  const rawPort = process.env.PORT;
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
