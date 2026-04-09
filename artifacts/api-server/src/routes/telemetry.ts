import { Router, type IRouter } from "express";
import { db, dosAnalyticsEventsTable } from "@szl-holdings/db";

const router: IRouter = Router();

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

router.post("/telemetry/events", async (req, res) => {
  try {
    const { app, events } = req.body as { app?: string; events?: unknown[] };
    if (!app || !Array.isArray(events) || events.length === 0) {
      res.status(400).json({ error: "app and events[] required" });
      return;
    }

    const rows = events.slice(0, 50).map((e) => {
      const ev = e as { name?: string; properties?: Record<string, unknown>; timestamp?: number; path?: string; target?: string; value?: string; sessionId?: string };
      return {
        eventType: normalizeEventType(ev.name ?? "cta_click"),
        path: ev.path ?? ev.properties?.["path"] as string | undefined,
        target: ev.target ?? ev.properties?.["target"] as string | undefined,
        value: ev.value ?? ev.properties?.["value"] as string | undefined,
        sessionId: ev.sessionId ?? ev.properties?.["sessionId"] as string | undefined,
        metadata: { app, eventName: ev.name, ...ev.properties },
        createdAt: ev.timestamp ? new Date(ev.timestamp) : new Date(),
      };
    });

    await db.insert(dosAnalyticsEventsTable).values(rows);
    res.json({ ok: true, count: rows.length });
  } catch (err) {
    console.error("[telemetry] event ingest error:", err);
    res.status(500).json({ error: "ingest failed" });
  }
});

export default router;
