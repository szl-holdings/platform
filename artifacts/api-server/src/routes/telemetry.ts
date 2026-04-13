import { Router, type IRouter, type Request } from "express";
import { db, dosAnalyticsEventsTable, analyticsSessionsTable, analyticsPageViewsTable, analyticsConversionsTable, analyticsGoalsTable } from "@szl-holdings/db";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { sendMetaCAPIEvent, getMetaEventName } from "../lib/meta-capi";
import crypto from "crypto";

const router: IRouter = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(value: string | undefined): value is string {
  return !!value && UUID_RE.test(value);
}

const SESSION_INACTIVITY_MS = 30 * 60 * 1000;

const VALID_EVENT_TYPES = ["page_view", "cta_click", "subscribe", "form_start", "form_submit", "download", "share", "scroll_depth"] as const;
type AnalyticsEventType = typeof VALID_EVENT_TYPES[number];

function normalizeEventType(name: string): AnalyticsEventType {
  if (VALID_EVENT_TYPES.includes(name as AnalyticsEventType)) {
    return name as AnalyticsEventType;
  }
  if (name.includes("page") || name.includes("view")) return "page_view";
  if (name.includes("click") || name.includes("cta")) return "cta_click";
  if (name.includes("subscribe") || name.includes("signup")) return "subscribe";
  if (name.includes("form_start")) return "form_start";
  if (name.includes("form") || name.includes("submit")) return "form_submit";
  if (name.includes("download")) return "download";
  if (name.includes("share")) return "share";
  if (name.includes("scroll")) return "scroll_depth";
  return "cta_click";
}

function classifyChannel(referrer?: string, utmSource?: string, utmMedium?: string): string {
  if (utmMedium === "cpc" || utmMedium === "paid" || utmSource === "google_ads" || utmSource === "meta") return "paid";
  if (utmSource === "newsletter" || utmMedium === "email") return "email";
  if (utmMedium === "social" || ["twitter", "x", "facebook", "linkedin", "instagram"].includes(utmSource ?? "")) return "social";
  if (utmSource || utmMedium || utmSource === "referral") return "referral";
  if (!referrer || referrer === "") return "direct";
  try {
    const refHost = new URL(referrer).hostname;
    const currentHost = "szlholdings.com";
    if (refHost.includes(currentHost)) return "direct";
    if (["google.com", "bing.com", "yahoo.com", "duckduckgo.com", "search.yahoo.com"].some(h => refHost.includes(h))) return "organic";
    if (["twitter.com", "x.com", "facebook.com", "linkedin.com", "instagram.com", "t.co"].some(h => refHost.includes(h))) return "social";
  } catch {
    // invalid referrer URL — fall through to referral
  }
  return "referral";
}

function goalMatchesEvent(goal: {
  triggerEvent: string;
  urlMatch?: string | null;
  propertyConditions?: Record<string, unknown> | null;
}, eventName: string, path: string, properties: Record<string, unknown>): boolean {
  if (goal.triggerEvent !== eventName) return false;

  if (goal.urlMatch) {
    try {
      const re = new RegExp(goal.urlMatch);
      if (!re.test(path)) return false;
    } catch {
      if (!path.includes(goal.urlMatch)) return false;
    }
  }

  if (goal.propertyConditions && typeof goal.propertyConditions === "object") {
    for (const [key, expected] of Object.entries(goal.propertyConditions)) {
      if (properties[key] !== expected) return false;
    }
  }

  return true;
}

interface IncomingEvent {
  name?: string;
  properties?: Record<string, unknown>;
  timestamp?: number;
  path?: string;
  target?: string;
  value?: string;
  sessionId?: string;
  visitorId?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  viewportWidth?: number;
  viewportHeight?: number;
  deviceType?: string;
  browser?: string;
  timezone?: string;
  language?: string;
  scrollDepthPct?: number;
  clickCount?: number;
  pageDurationSeconds?: number;
}

const WRITE_BUFFER: Array<{ app: string; event: IncomingEvent; req?: { ip?: string; userAgent?: string; fbc?: string; fbp?: string } }> = [];
const WRITE_BUFFER_MAX = 100;
const FLUSH_INTERVAL_MS = 5_000;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const CONVERSION_EVENTS = new Set(["demo_requested", "demo_request", "contact_submitted", "form_submit", "checkout_completed"]);

const META_PIXEL_ID = process.env["META_PIXEL_ID"] ?? "";
const META_CAPI_ACCESS_TOKEN = process.env["META_CAPI_ACCESS_TOKEN"] ?? "";
const GOOGLE_ADS_ID = process.env["VITE_GOOGLE_ADS_ID"] ?? "";

async function resolveSession(
  visitorId: string,
  clientSessionId: string,
  eventTime: Date,
  path: string,
  channel: string,
  event: IncomingEvent,
  app: string
): Promise<{ sessionId: string; isNew: boolean }> {
  const thirtyMinAgo = new Date(eventTime.getTime() - SESSION_INACTIVITY_MS);

  try {
    const activeRows = await db.select({
      id: analyticsSessionsTable.id,
      sessionEnd: analyticsSessionsTable.sessionEnd,
    })
      .from(analyticsSessionsTable)
      .where(
        and(
          eq(analyticsSessionsTable.visitorId, visitorId),
          gte(analyticsSessionsTable.sessionEnd, thirtyMinAgo),
          eq(analyticsSessionsTable.appName, app),
        )
      )
      .orderBy(desc(analyticsSessionsTable.sessionEnd))
      .limit(1);

    if (activeRows.length > 0 && activeRows[0]) {
      return { sessionId: activeRows[0].id, isNew: false };
    }
  } catch (err) {
    logger.warn({ err, visitorId }, "[telemetry] session lookup failed — creating new session");
  }

  const newSessionId = isValidUUID(clientSessionId) ? clientSessionId : crypto.randomUUID();

  try {
    await db.insert(analyticsSessionsTable).values({
      id: newSessionId,
      visitorId,
      sessionStart: eventTime,
      sessionEnd: eventTime,
      pageCount: 0,
      entryPath: path,
      exitPath: path,
      referrer: event.referrer,
      utmSource: event.utmSource,
      utmMedium: event.utmMedium,
      utmCampaign: event.utmCampaign,
      utmTerm: event.utmTerm,
      utmContent: event.utmContent,
      channel,
      deviceType: event.deviceType,
      browser: event.browser,
      timezone: event.timezone,
      language: event.language,
      viewportWidth: event.viewportWidth,
      viewportHeight: event.viewportHeight,
      appName: app,
      bounced: true,
      converted: false,
    }).onConflictDoNothing();
  } catch (err) {
    logger.error({ err, newSessionId }, "[telemetry] failed to insert new session");
  }

  return { sessionId: newSessionId, isNew: true };
}

async function persistBatch(batch: Array<{ app: string; event: IncomingEvent; req?: { ip?: string; userAgent?: string; fbc?: string; fbp?: string } }>) {
  if (batch.length === 0) return;

  let activeGoals: typeof analyticsGoalsTable.$inferSelect[] = [];
  try {
    activeGoals = await db.select().from(analyticsGoalsTable).where(eq(analyticsGoalsTable.active, true));
  } catch (err) {
    logger.warn({ err }, "[telemetry] could not load active goals — skipping goal evaluation");
  }

  for (const { app, event, req: reqMeta } of batch) {
    const clientSessionId = event.sessionId ?? "";
    const visitorId = event.visitorId;
    const eventTime = event.timestamp ? new Date(event.timestamp) : new Date();
    const path = event.path ?? (event.properties?.["path"] as string | undefined) ?? "/";
    const properties = event.properties ?? {};

    if (!visitorId) {
      logger.debug({ eventName: event.name }, "[telemetry] skipping event — missing visitorId");
      continue;
    }

    const channel = classifyChannel(event.referrer, event.utmSource, event.utmMedium);

    const { sessionId } = await resolveSession(visitorId, clientSessionId, eventTime, path, channel, event, app);

    if (event.name === "page_view") {
      try {
        await db.insert(analyticsPageViewsTable).values({
          sessionId,
          visitorId,
          path,
          title: event.properties?.["title"] as string | undefined,
          referrer: event.referrer,
          enterAt: eventTime,
          exitAt: event.pageDurationSeconds ? new Date(eventTime.getTime() + event.pageDurationSeconds * 1000) : undefined,
          durationSeconds: event.pageDurationSeconds,
          scrollDepthPct: event.scrollDepthPct ?? (event.properties?.["scroll_depth"] as number | undefined),
          clickCount: event.clickCount ?? 0,
          viewportWidth: event.viewportWidth,
          viewportHeight: event.viewportHeight,
          appName: app,
          properties,
        });
      } catch (err) {
        logger.error({ err, sessionId, path }, "[telemetry] failed to insert page view");
      }

      try {
        await db.update(analyticsSessionsTable)
          .set({
            sessionEnd: eventTime,
            exitPath: path,
            pageCount: sql`${analyticsSessionsTable.pageCount} + 1`,
            bounced: sql`CASE WHEN ${analyticsSessionsTable.pageCount} >= 1 THEN false ELSE true END`,
            updatedAt: new Date(),
          })
          .where(eq(analyticsSessionsTable.id, sessionId));
      } catch (err) {
        logger.error({ err, sessionId }, "[telemetry] failed to update session on page_view");
      }
    } else {
      try {
        await db.update(analyticsSessionsTable)
          .set({ sessionEnd: eventTime, updatedAt: new Date() })
          .where(eq(analyticsSessionsTable.id, sessionId));
      } catch (err) {
        logger.error({ err, sessionId }, "[telemetry] failed to update session last activity");
      }
    }

    if (event.name && CONVERSION_EVENTS.has(event.name)) {
      const matchingGoals = activeGoals.filter(g =>
        goalMatchesEvent(
          { triggerEvent: g.triggerEvent, urlMatch: g.urlMatch, propertyConditions: g.propertyConditions as Record<string, unknown> | null },
          event.name!,
          path,
          properties
        )
      );

      let sessionStart: Date | undefined;
      if (matchingGoals.length > 0) {
        try {
          const rows = await db.select({ sessionStart: analyticsSessionsTable.sessionStart })
            .from(analyticsSessionsTable)
            .where(eq(analyticsSessionsTable.id, sessionId))
            .limit(1);
          sessionStart = rows[0]?.sessionStart ?? undefined;
        } catch (err) {
          logger.warn({ err, sessionId }, "[telemetry] could not fetch session start for conversion timing");
        }
      }

      for (const goal of matchingGoals) {
        try {
          const timeToConversion = sessionStart
            ? Math.round((eventTime.getTime() - sessionStart.getTime()) / 1000)
            : undefined;

          await db.insert(analyticsConversionsTable).values({
            sessionId,
            visitorId,
            goalId: goal.id,
            goalName: goal.name,
            triggerEvent: event.name!,
            value: goal.value ?? undefined,
            currency: goal.currency ?? undefined,
            properties,
            path,
            timeToConversionSeconds: timeToConversion,
          });

          await db.update(analyticsSessionsTable)
            .set({
              converted: true,
              conversionCount: sql`COALESCE(${analyticsSessionsTable.conversionCount}, 0) + 1`,
              updatedAt: new Date(),
            })
            .where(eq(analyticsSessionsTable.id, sessionId));
        } catch (err) {
          logger.error({ err, sessionId, goalId: goal.id }, "[telemetry] failed to insert conversion");
        }
      }

      if (META_PIXEL_ID && META_CAPI_ACCESS_TOKEN) {
        const metaEventName = getMetaEventName(event.name);
        if (metaEventName) {
          const dedupeEventId = `${event.name}_${sessionId}_${eventTime.getTime()}`;
          sendMetaCAPIEvent(META_PIXEL_ID, META_CAPI_ACCESS_TOKEN, {
            eventName: metaEventName,
            eventId: dedupeEventId,
            eventTime: Math.floor(eventTime.getTime() / 1000),
            sourceUrl: path ? `https://szlholdings.com${path}` : undefined,
            userData: {
              clientUserAgent: reqMeta?.userAgent,
              clientIpAddress: reqMeta?.ip,
              fbc: reqMeta?.fbc,
              fbp: reqMeta?.fbp,
            },
            customData: {
              value: properties["value"],
              currency: (properties["currency"] as string | undefined) ?? "USD",
            },
          }).catch(err => logger.error({ err }, "[telemetry] meta capi fire error"));
        }
      }

      void GOOGLE_ADS_ID;
    }
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(async () => {
    flushTimer = null;
    if (WRITE_BUFFER.length === 0) return;
    const batch = WRITE_BUFFER.splice(0, WRITE_BUFFER_MAX);
    persistBatch(batch).catch(err => logger.error({ err }, "[telemetry] scheduled flush error"));
  }, FLUSH_INTERVAL_MS);
}

router.post("/telemetry/events", async (req: Request, res) => {
  try {
    const { app, events } = req.body as { app?: string; events?: unknown[] };
    if (!app || !Array.isArray(events) || events.length === 0) {
      res.status(400).json({ error: "app and events[] required" });
      return;
    }

    const userAgent = req.headers["user-agent"] ?? "";
    const clientIp = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? req.socket.remoteAddress ?? "";
    const fbc = req.cookies?.["_fbc"];
    const fbp = req.cookies?.["_fbp"];

    const rows = events.slice(0, 50).map((e) => {
      const ev = e as IncomingEvent;
      return {
        eventType: normalizeEventType(ev.name ?? "cta_click"),
        path: ev.path ?? ev.properties?.["path"] as string | undefined,
        target: ev.target ?? ev.properties?.["target"] as string | undefined,
        value: ev.value ?? ev.properties?.["value"] as string | undefined,
        sessionId: isValidUUID(ev.sessionId) ? ev.sessionId : undefined,
        metadata: { app, eventName: ev.name, ...ev.properties },
        createdAt: ev.timestamp ? new Date(ev.timestamp) : new Date(),
      };
    });

    try {
      await db.insert(dosAnalyticsEventsTable).values(rows);
    } catch (err) {
      logger.warn({ err }, "[telemetry] failed to insert raw events — continuing");
    }

    const enrichedEvents = events.slice(0, 50).map((e) => ({
      app,
      event: e as IncomingEvent,
      req: { ip: clientIp, userAgent, fbc, fbp },
    }));
    WRITE_BUFFER.push(...enrichedEvents);

    if (WRITE_BUFFER.length >= WRITE_BUFFER_MAX) {
      const batch = WRITE_BUFFER.splice(0, WRITE_BUFFER_MAX);
      persistBatch(batch).catch(err => logger.error({ err }, "[telemetry] persist error"));
    } else {
      scheduleFlush();
    }

    res.json({ ok: true, count: rows.length });
  } catch (err) {
    logger.error({ err }, "[telemetry] event ingest error");
    res.status(500).json({ error: "ingest failed" });
  }
});

export default router;
