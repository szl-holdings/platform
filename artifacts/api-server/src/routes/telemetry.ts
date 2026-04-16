import { Router, type IRouter } from "express";
import { db, dosAnalyticsEventsTable } from "@szl-holdings/db";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/telemetry/events", async (req, res) => {
  try {
    const { app, events } = req.body;
    if (!app || !Array.isArray(events) || events.length === 0) {
      res.status(400).json({ error: "app and events[] required" });
      return;
    }

    const rows = events.slice(0, 50).map((e: { name: string; properties?: Record<string, unknown>; timestamp?: number }) => ({
      eventType: "page_view" as const,
      path: typeof e.properties?.path === "string" ? e.properties.path : null,
      metadata: { app, eventName: e.name, ...e.properties },
    }));

    await db.insert(dosAnalyticsEventsTable).values(rows);
    res.json({ ok: true, count: rows.length });
  } catch (err) {
    logger.error({ err }, "[telemetry] event ingest error");
    res.status(500).json({ error: "ingest failed" });
  }
});

export default router;
