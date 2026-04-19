/**
 * Durable job entrypoints for AI inference, email, and external-alert
 * dispatch.
 *
 * The platform runs on a Postgres-backed DurableJobQueue (see
 * lib/forge-runtime/src/durable-job-queue.ts) — equivalent to BullMQ/Redis for
 * our durability needs (persistence across restarts, retries with exponential
 * backoff, dead-letter queue, heartbeats, stale-job recovery). These helpers
 * give the rest of the codebase a single place to enqueue work that must
 * survive a process restart.
 *
 * Job types registered here:
 *   - JOB_TYPES.EMAIL_SEND      → wraps lib/email.sendEmail
 *   - JOB_TYPES.AI_INFERENCE    → wraps lib/ai-gateway.gatewayInfer
 *   - JOB_TYPES.EXTERNAL_ALERT  → wraps lib/notification-dispatch.dispatchExternalAlert
 *
 * Routes / scheduled jobs that previously called these helpers inline can use
 * the `queue*` wrappers below to keep work from being lost when the API
 * server restarts mid-request.
 */
import { durableJobQueue } from "@szl-holdings/forge-runtime";
import { JOB_TYPES } from "./job-queue";
import { logger } from "./logger";
import { sendEmail, type EmailOptions } from "./email";
import { gatewayInfer, type GatewayRequest } from "./ai-gateway";
import { dispatchExternalAlert, type AlertDispatchParams } from "./notification-dispatch";

let registered = false;

export function registerQueuedJobHandlers(): void {
  if (registered) return;
  registered = true;

  // --- EMAIL_SEND --------------------------------------------------------
  // Replaces the historical no-op stub in durable-init. Failures throw so the
  // durable queue retries with backoff; the job is persisted in Postgres so a
  // crash mid-send does not lose the message.
  durableJobQueue.register(JOB_TYPES.EMAIL_SEND, async (job) => {
    const opts = job.payload as EmailOptions;
    const result = await sendEmail(opts);
    if (!result.success) {
      logger.warn(
        { jobId: job.id, to: opts.to, subject: opts.subject, error: result.error },
        "[queued-email] Email delivery failed — will retry via durable queue"
      );
      throw new Error(`Email delivery failed: ${result.error ?? "unknown"}`);
    }
    logger.info(
      { jobId: job.id, to: opts.to, provider: result.provider, messageId: result.messageId },
      "[queued-email] Email delivered"
    );
  });

  // --- AI_INFERENCE ------------------------------------------------------
  // For fire-and-forget agent work (digest generation, background reasoning,
  // reranking) where the caller does not need an inline response. Latency-
  // sensitive request/response inference still goes direct through
  // gatewayInfer.
  durableJobQueue.register(JOB_TYPES.AI_INFERENCE, async (job) => {
    const { request, callback } = job.payload as {
      request: GatewayRequest;
      callback?: { url: string; headers?: Record<string, string> };
    };
    const response = await gatewayInfer(request);
    logger.info(
      { jobId: job.id, agentId: request.agentId, provider: response.provider, latencyMs: response.routing.totalLatencyMs },
      "[queued-ai] Inference complete"
    );
    if (callback?.url) {
      const res = await fetch(callback.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(callback.headers ?? {}) },
        body: JSON.stringify({ jobId: job.id, response }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        throw new Error(`AI inference callback failed: HTTP ${res.status}`);
      }
    }
  });

  // --- EXTERNAL_ALERT ----------------------------------------------------
  // Routes external alert dispatch (Slack, Teams, email, SMS, voice, push)
  // through the durable queue so a server restart mid-fanout does not drop
  // critical alerts.
  durableJobQueue.register(JOB_TYPES.EXTERNAL_ALERT, async (job) => {
    const params = job.payload as AlertDispatchParams;
    await dispatchExternalAlert(params);
    logger.info(
      { jobId: job.id, appName: params.appName, severity: params.severity },
      "[queued-alert] External alert dispatch complete"
    );
  });

  logger.info("[queued-jobs] Registered handlers: EMAIL_SEND, AI_INFERENCE, EXTERNAL_ALERT");
}

/** Enqueue an email for durable delivery. Returns the job id. */
export async function queueEmail(opts: EmailOptions, queueName: "critical" | "high" | "default" | "low" = "default"): Promise<string> {
  const job = await durableJobQueue.enqueue(JOB_TYPES.EMAIL_SEND, opts, { queue: queueName, maxRetries: 5 });
  return job.id;
}

/** Enqueue an AI inference call for durable, retryable execution. */
export async function queueAiInference(
  request: GatewayRequest,
  callback?: { url: string; headers?: Record<string, string> },
): Promise<string> {
  const job = await durableJobQueue.enqueue(
    JOB_TYPES.AI_INFERENCE,
    { request, callback },
    { queue: "agents", maxRetries: 3 },
  );
  return job.id;
}

/** Enqueue an external alert for durable fanout to Slack/Teams/email/SMS/voice/push. */
export async function queueExternalAlert(
  params: AlertDispatchParams,
  queueName: "critical" | "high" | "default" = "high",
): Promise<string> {
  const job = await durableJobQueue.enqueue(JOB_TYPES.EXTERNAL_ALERT, params, { queue: queueName, maxRetries: 4 });
  return job.id;
}
