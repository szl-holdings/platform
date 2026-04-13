import { Router, type Request, type Response } from "express";
import { logger } from "../lib/logger";
import { serverTelemetry } from "@szl-holdings/observability";

const analyticsRouter = Router();

const ALLOWED_EVENTS = new Set([
  "user_signed_up", "user_logged_in", "user_login_failed", "user_logged_out", "session_expired",
  "dashboard_viewed", "page_viewed", "search_executed", "filter_applied",
  "signal_viewed", "signal_dismissed", "signal_escalated",
  "alert_acknowledged", "alert_config_changed",
  "action_created", "action_approved", "action_rejected",
  "workflow_started", "workflow_completed", "workflow_failed",
  "approval_decision",
  "subscription_started", "subscription_upgraded", "subscription_downgraded", "subscription_cancelled",
  "payment_succeeded", "payment_failed", "invoice_generated",
  "trial_started", "trial_converted",
  "contact_form_submitted", "demo_requested", "demo_scheduled", "demo_completed",
  "ai_inference_called", "ai_recommendation_shown", "ai_recommendation_acted_on", "ai_provider_failure",
]);

const ALLOWED_PLATFORMS = new Set(["lyte", "aegis", "terra", "vessels", "carlota_jo", "admin", "api", "szl"]);

const pageHits: Record<string, number> = {};
const siteHits: Record<string, number> = {};
const funnelStages: Record<string, number> = {};
let sessionCount = 0;

function recordPageHit(page?: string, site?: string, eventType?: string, props?: Record<string, unknown>) {
  if (page && typeof page === "string") {
    const key = page.replace(/\?.*/,"").substring(0, 80);
    pageHits[key] = (pageHits[key] ?? 0) + 1;
  }
  if (site && typeof site === "string") {
    siteHits[site] = (siteHits[site] ?? 0) + 1;
  }
  if (eventType === "page_view") {
    sessionCount++;
  }
  if (eventType === "funnel_stage") {
    const stageKey = (props?.section as string | undefined) ?? page ?? "unknown";
    funnelStages[stageKey] = (funnelStages[stageKey] ?? 0) + 1;
  }
}

analyticsRouter.post("/analytics/event", (req: Request, res: Response) => {
  try {
    const { event, platform, timestamp, properties } = req.body as {
      event?: string;
      platform?: string;
      timestamp?: string;
      properties?: Record<string, unknown>;
    };

    if (!event || typeof event !== "string") {
      res.status(400).json({ error: "event is required" });
      return;
    }

    if (!ALLOWED_EVENTS.has(event)) {
      res.status(400).json({ error: "unknown event type" });
      return;
    }

    const resolvedPlatform = platform && ALLOWED_PLATFORMS.has(platform) ? platform : "unknown";

    const eventPayload = {
      type: event,
      metadata: {
        platform: resolvedPlatform,
        timestamp: timestamp ?? new Date().toISOString(),
        userId: (req as Request & { user?: { id?: number } }).user?.id,
        ...(properties && typeof properties === "object" ? properties : {}),
      },
    };

    serverTelemetry.recordBusinessEvent(eventPayload);

    logger.debug({ event, platform: resolvedPlatform }, "[analytics] event recorded");

    res.status(202).json({ ok: true });
  } catch (err) {
    logger.warn({ err }, "[analytics] Failed to record event");
    res.status(500).json({ error: "Failed to record event" });
  }
});

const BATCH_ALLOWED_EVENTS = new Set([
  "page_view", "cta_click", "form_submit", "demo_request", "access_request",
  "private_inquiry_submit", "download_asset", "sign_in", "sign_up",
  "dashboard_view", "alert_view", "report_view", "billing_portal_open",
  "checkout_started", "checkout_completed", "article_view", "case_study_view",
  "hero_cta_click", "venture_card_click", "founder_page_view",
  "contact_funnel_start", "contact_form_submit", "resume_download_click",
  "venture_detail_view", "scroll_depth", "ecosystem_node_click",
  "portfolio_filter", "insights_article_click", "nav_link_click",
  "pricing_tier_view", "pricing_cta_click", "email_capture",
  "exit_intent_shown", "chat_opened", "chat_message_sent",
  "funnel_stage", "demo_mode_engaged", "newsletter_subscribe", "time_on_page",
]);

const BATCH_ALLOWED_SITES = new Set([
  "szl-holdings", "lyte", "aegis", "terra", "vessels", "carlota_jo",
  "admin", "api", "szl", "stephen-site", "prism-counsel", "firestorm",
  "inca-lab", "nexus", "forge",
]);

analyticsRouter.post("/analytics/events", (req: Request, res: Response) => {
  try {
    const { events } = req.body as { events?: Array<{ event: string; properties?: Record<string, unknown>; timestamp?: string }> };
    if (!Array.isArray(events)) {
      res.status(400).json({ error: "events must be an array" });
      return;
    }
    let accepted = 0;
    let skipped = 0;
    for (const e of events) {
      if (!e.event || typeof e.event !== "string") { skipped++; continue; }
      if (!BATCH_ALLOWED_EVENTS.has(e.event)) { skipped++; continue; }
      const props = e.properties && typeof e.properties === "object" ? e.properties : {};
      const site = typeof props.site === "string" && BATCH_ALLOWED_SITES.has(props.site) ? props.site : "szl";
      const safeProps: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(props)) {
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
          safeProps[k.substring(0, 64)] = typeof v === "string" ? v.substring(0, 256) : v;
        }
      }
      serverTelemetry.recordBusinessEvent({
        type: e.event,
        metadata: {
          platform: site,
          timestamp: e.timestamp ?? new Date().toISOString(),
          ...safeProps,
        },
      });
      recordPageHit(
        (safeProps.page as string | undefined),
        site,
        e.event,
        safeProps,
      );
      accepted++;
    }
    logger.debug({ accepted, skipped }, "[analytics] batch events recorded");
    res.status(202).json({ ok: true, accepted, skipped });
  } catch (err) {
    logger.warn({ err }, "[analytics] Failed to record batch events");
    res.status(500).json({ error: "Failed to record events" });
  }
});

analyticsRouter.get("/analytics/summary", (req: Request, res: Response) => {
  try {
    const snapshot = serverTelemetry.getSnapshot();

    const topPages = Object.entries(pageHits)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, views]) => ({ path, views }));

    const topSites = Object.entries(siteHits)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([site, views]) => ({ site, views }));

    const funnelBreakdown = Object.entries(funnelStages)
      .sort((a, b) => b[1] - a[1])
      .map(([stage, count]) => ({ stage, count }));

    res.json({
      timestamp: new Date().toISOString(),
      businessEvents: snapshot.businessEvents,
      requestCount: snapshot.requestCount,
      errorRate: snapshot.errorRate,
      workflowCompletions: snapshot.workflowCompletions,
      jobFailures: snapshot.jobFailures,
      pageViews: sessionCount,
      topPages,
      topSites,
      funnelBreakdown,
    });
  } catch (err) {
    logger.warn({ err }, "[analytics] Failed to fetch summary");
    res.status(500).json({ error: "Failed to fetch analytics summary" });
  }
});

export default analyticsRouter;
