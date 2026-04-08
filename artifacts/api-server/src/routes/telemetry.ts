import { Router, type IRouter } from "express";
import { db, dosAnalyticsEventsTable } from "@szl-holdings/db";

const router: IRouter = Router();

router.post("/telemetry/events", async (req, res) => {
  try {
    const { app, events } = req.body;
    if (!app || !Array.isArray(events) || events.length === 0) {
      res.status(400).json({ error: "app and events[] required" });
      return;
    }

    const rows = events.slice(0, 50).map((e: { name: string; properties?: Record<string, unknown>; timestamp?: number }) => ({
      eventType: e.name,
      eventData: { app, ...e.properties },
      createdAt: e.timestamp ? new Date(e.timestamp) : new Date(),
    }));

    await db.insert(dosAnalyticsEventsTable).values(rows);
    res.json({ ok: true, count: rows.length });
  } catch (err) {
    console.error("[telemetry] event ingest error:", err);
    res.status(500).json({ error: "ingest failed" });
  }
});

export default router;
