import { Router, type Request, type Response } from "express";
import { db } from "@szl-holdings/db";
import {
  sessionRecordingsTable,
  sessionRecordingChunksTable,
  heatmapEventsTable,
  experimentsTable,
  experimentVariantsTable,
  experimentAssignmentsTable,
  consentAuditLogTable,
} from "@szl-holdings/db";
import { eq, and, desc, gte, lte, sql, inArray, count } from "drizzle-orm";
import { authMiddleware, requireRole, parseIdParam } from "../middlewares/auth";
import { sendSuccess, sendCreated, sendBadRequest, sendNotFound, handleRouteError } from "../lib/api-response";
import { logger } from "../lib/logger";

const router = Router();

const MAX_CHUNK_BYTES = 512 * 1024;
const MAX_CHUNKS_PER_RECORDING = 500;

function murmurHash(key: string): number {
  let h = 0xdeadbeef;
  for (let i = 0; i < key.length; i++) {
    h = Math.imul(h ^ key.charCodeAt(i), 2654435761);
  }
  return ((h ^ (h >>> 16)) >>> 0);
}

function bucketUser(userId: string, experimentKey: string): number {
  const combined = `${experimentKey}:${userId}`;
  return murmurHash(combined) % 100;
}

router.post("/analytics/recordings", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body as { sessionId?: string };
    if (!sessionId) {
      sendBadRequest(res, "sessionId is required");
      return;
    }
    const [recording] = await db.insert(sessionRecordingsTable).values({
      sessionId,
      status: "recording",
    }).returning();
    sendCreated(res, { id: recording.id });
  } catch (err) {
    handleRouteError(res, err, "Failed to create recording");
  }
});

router.post("/analytics/recordings/:id/chunks", async (req: Request, res: Response) => {
  try {
    const recordingId = parseIdParam(req.params.id);
    if (isNaN(recordingId)) { sendBadRequest(res, "Invalid recording id"); return; }

    const { sequence, events } = req.body as { sequence?: number; events?: unknown[] };
    if (typeof sequence !== "number" || !Array.isArray(events)) {
      sendBadRequest(res, "sequence (number) and events (array) are required");
      return;
    }

    const payloadSize = JSON.stringify(events).length;
    if (payloadSize > MAX_CHUNK_BYTES) {
      sendBadRequest(res, "Chunk too large");
      return;
    }

    const [existing] = await db.select({ id: sessionRecordingsTable.id, chunkCount: sessionRecordingsTable.chunkCount })
      .from(sessionRecordingsTable)
      .where(eq(sessionRecordingsTable.id, recordingId))
      .limit(1);

    if (!existing) { sendNotFound(res, "Recording"); return; }
    if ((existing.chunkCount ?? 0) >= MAX_CHUNKS_PER_RECORDING) {
      await db.update(sessionRecordingsTable)
        .set({ status: "truncated", endedAt: new Date() })
        .where(eq(sessionRecordingsTable.id, recordingId));
      res.json({ ok: true, truncated: true });
      return;
    }

    await db.insert(sessionRecordingChunksTable).values({
      recordingId,
      sequence,
      events: events as unknown[],
      sizeBytes: payloadSize,
    });

    await db.update(sessionRecordingsTable).set({
      chunkCount: sql`${sessionRecordingsTable.chunkCount} + 1`,
      totalSizeBytes: sql`${sessionRecordingsTable.totalSizeBytes} + ${payloadSize}`,
    }).where(eq(sessionRecordingsTable.id, recordingId));

    res.json({ ok: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to store chunk");
  }
});

router.patch("/analytics/recordings/:id", async (req: Request, res: Response) => {
  try {
    const recordingId = parseIdParam(req.params.id);
    if (isNaN(recordingId)) { sendBadRequest(res, "Invalid recording id"); return; }
    const { didConvert, conversionEvent, status } = req.body as { didConvert?: boolean; conversionEvent?: string; status?: string };
    const updates: Record<string, unknown> = {};
    if (didConvert !== undefined) updates.didConvert = didConvert;
    if (conversionEvent) updates.conversionEvent = conversionEvent;
    if (status) updates.status = status;
    if (status === "complete" || status === "truncated") updates.endedAt = new Date();
    await db.update(sessionRecordingsTable).set(updates).where(eq(sessionRecordingsTable.id, recordingId));
    res.json({ ok: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to update recording");
  }
});

router.get("/analytics/recordings", authMiddleware(), requireRole("ops", "admin"), async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt((req.query.limit as string) || "50", 10), 100);
    const offset = parseInt((req.query.offset as string) || "0", 10);
    const convertedOnly = req.query.converted === "true";

    let q = db.select().from(sessionRecordingsTable);
    if (convertedOnly) {
      q = q.where(eq(sessionRecordingsTable.didConvert, true)) as typeof q;
    }
    const recordings = await q.orderBy(desc(sessionRecordingsTable.startedAt)).limit(limit).offset(offset);
    sendSuccess(res, { recordings, total: recordings.length, limit, offset });
  } catch (err) {
    handleRouteError(res, err, "Failed to list recordings");
  }
});

router.get("/analytics/recordings/:id", authMiddleware(), requireRole("ops", "admin"), async (req: Request, res: Response) => {
  try {
    const recordingId = parseIdParam(req.params.id);
    if (isNaN(recordingId)) { sendBadRequest(res, "Invalid recording id"); return; }

    const [recording] = await db.select().from(sessionRecordingsTable)
      .where(eq(sessionRecordingsTable.id, recordingId)).limit(1);
    if (!recording) { sendNotFound(res, "Recording"); return; }

    const chunks = await db.select().from(sessionRecordingChunksTable)
      .where(eq(sessionRecordingChunksTable.recordingId, recordingId))
      .orderBy(sessionRecordingChunksTable.sequence);

    sendSuccess(res, { recording, chunks });
  } catch (err) {
    handleRouteError(res, err, "Failed to get recording");
  }
});

router.post("/analytics/heatmap-events", async (req: Request, res: Response) => {
  try {
    const { events } = req.body as { events?: unknown[] };
    if (!Array.isArray(events) || events.length === 0) {
      sendBadRequest(res, "events[] required");
      return;
    }

    const rows = events.slice(0, 100).map((e) => {
      const ev = e as Record<string, unknown>;
      return {
        sessionId: typeof ev.sessionId === "string" ? ev.sessionId : undefined,
        pagePath: typeof ev.pagePath === "string" ? ev.pagePath.substring(0, 255) : "/",
        eventType: (["click", "move", "scroll"].includes(ev.eventType as string) ? ev.eventType : "click") as "click" | "move" | "scroll",
        x: typeof ev.x === "number" ? ev.x : undefined,
        y: typeof ev.y === "number" ? ev.y : undefined,
        xPct: typeof ev.xPct === "number" ? ev.xPct : undefined,
        yPct: typeof ev.yPct === "number" ? ev.yPct : undefined,
        scrollDepthPct: typeof ev.scrollDepthPct === "number" ? ev.scrollDepthPct : undefined,
        elementTag: typeof ev.elementTag === "string" ? ev.elementTag.substring(0, 50) : undefined,
        elementClass: typeof ev.elementClass === "string" ? ev.elementClass.substring(0, 100) : undefined,
        elementText: typeof ev.elementText === "string" ? ev.elementText.substring(0, 100) : undefined,
        viewportWidth: typeof ev.viewportWidth === "number" ? ev.viewportWidth : undefined,
        viewportHeight: typeof ev.viewportHeight === "number" ? ev.viewportHeight : undefined,
      };
    });

    await db.insert(heatmapEventsTable).values(rows);
    res.json({ ok: true, count: rows.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to store heatmap events");
  }
});

router.get("/analytics/heatmap", authMiddleware(), requireRole("ops", "admin"), async (req: Request, res: Response) => {
  try {
    const pagePath = (req.query.path as string) || "/";
    const eventType = (req.query.type as string) || "click";
    const days = parseInt((req.query.days as string) || "30", 10);
    const since = new Date(Date.now() - days * 86400_000);

    let conditions = and(
      eq(heatmapEventsTable.pagePath, pagePath),
      gte(heatmapEventsTable.createdAt, since),
    );

    if (eventType !== "all") {
      conditions = and(conditions, eq(heatmapEventsTable.eventType, eventType as "click" | "move" | "scroll")) as typeof conditions;
    }

    const events = await db.select({
      x: heatmapEventsTable.x,
      y: heatmapEventsTable.y,
      xPct: heatmapEventsTable.xPct,
      yPct: heatmapEventsTable.yPct,
      scrollDepthPct: heatmapEventsTable.scrollDepthPct,
      elementTag: heatmapEventsTable.elementTag,
      elementClass: heatmapEventsTable.elementClass,
      elementText: heatmapEventsTable.elementText,
      eventType: heatmapEventsTable.eventType,
    }).from(heatmapEventsTable).where(conditions).limit(2000);

    const gridSize = 20;
    const grid: Record<string, number> = {};
    for (const ev of events) {
      if (ev.xPct !== null && ev.yPct !== null) {
        const gx = Math.floor((ev.xPct ?? 0) / gridSize);
        const gy = Math.floor((ev.yPct ?? 0) / gridSize);
        const key = `${gx},${gy}`;
        grid[key] = (grid[key] ?? 0) + 1;
      }
    }

    const scrollBuckets: Record<number, number> = {};
    for (const ev of events) {
      if (ev.eventType === "scroll" && ev.scrollDepthPct !== null) {
        const bucket = Math.floor((ev.scrollDepthPct ?? 0) / 10) * 10;
        scrollBuckets[bucket] = (scrollBuckets[bucket] ?? 0) + 1;
      }
    }

    const elementCounts: Record<string, { count: number; tag: string; class: string }> = {};
    for (const ev of events) {
      if (ev.eventType === "click" && ev.elementText) {
        const key = `${ev.elementTag}::${ev.elementText?.substring(0, 40)}`;
        if (!elementCounts[key]) elementCounts[key] = { count: 0, tag: ev.elementTag ?? "", class: ev.elementClass ?? "" };
        elementCounts[key].count++;
      }
    }

    const topElements = Object.entries(elementCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([key, v]) => ({ element: key, ...v }));

    sendSuccess(res, {
      pagePath,
      eventType,
      days,
      totalEvents: events.length,
      densityGrid: grid,
      scrollMap: scrollBuckets,
      topElements,
      rawEvents: eventType === "click" ? events.slice(0, 500) : [],
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get heatmap data");
  }
});

router.post("/analytics/consent", async (req: Request, res: Response) => {
  try {
    const { sessionId, anonymousId, consentVersion, essential, analytics, marketing, functional, action, userAgent, ipCountry } = req.body as Record<string, unknown>;

    if (!action || !["granted", "declined", "updated", "withdrawn"].includes(action as string)) {
      sendBadRequest(res, "Valid action required (granted|declined|updated|withdrawn)");
      return;
    }

    await db.insert(consentAuditLogTable).values({
      sessionId: typeof sessionId === "string" ? sessionId : undefined,
      anonymousId: typeof anonymousId === "string" ? anonymousId : undefined,
      consentVersion: typeof consentVersion === "string" ? consentVersion : "2.0",
      essential: essential !== false,
      analytics: analytics === true,
      marketing: marketing === true,
      functional: functional === true,
      action: action as "granted" | "declined" | "updated" | "withdrawn",
      ipCountry: typeof ipCountry === "string" ? ipCountry : undefined,
      userAgent: typeof userAgent === "string" ? userAgent?.substring(0, 500) : undefined,
    });

    res.json({ ok: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to log consent");
  }
});

router.get("/analytics/consent/audit", authMiddleware(), requireRole("ops", "admin"), async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt((req.query.limit as string) || "100", 10), 500);
    const offset = parseInt((req.query.offset as string) || "0", 10);
    const logs = await db.select().from(consentAuditLogTable)
      .orderBy(desc(consentAuditLogTable.createdAt))
      .limit(limit).offset(offset);
    sendSuccess(res, { logs, total: logs.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to get consent audit log");
  }
});

router.get("/analytics/experiments", authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const experiments = await db.select().from(experimentsTable).orderBy(desc(experimentsTable.createdAt));
    const variants = await db.select().from(experimentVariantsTable);
    const variantsByExp = new Map<number, typeof variants>();
    for (const v of variants) {
      if (!variantsByExp.has(v.experimentId)) variantsByExp.set(v.experimentId, []);
      variantsByExp.get(v.experimentId)!.push(v);
    }
    const enriched = experiments.map(exp => ({
      ...exp,
      variants: variantsByExp.get(exp.id) || [],
    }));
    sendSuccess(res, { experiments: enriched });
  } catch (err) {
    handleRouteError(res, err, "Failed to list experiments");
  }
});

router.post("/analytics/experiments", authMiddleware(), requireRole("ops", "admin"), async (req: Request, res: Response) => {
  try {
    const { key, name, hypothesis, description, primaryMetricEvent, metricType, mutualExclusionGroup, trafficAllocation, variants } = req.body as {
      key: string;
      name: string;
      hypothesis?: string;
      description?: string;
      primaryMetricEvent: string;
      metricType?: string;
      mutualExclusionGroup?: string;
      trafficAllocation?: number;
      variants: Array<{ key: string; name: string; weight: number; isControl?: boolean; description?: string }>;
    };

    if (!key || !name || !primaryMetricEvent || !Array.isArray(variants) || variants.length < 2) {
      sendBadRequest(res, "key, name, primaryMetricEvent, and at least 2 variants are required");
      return;
    }

    const [experiment] = await db.insert(experimentsTable).values({
      key,
      name,
      hypothesis,
      description,
      primaryMetricEvent,
      metricType: (metricType as "conversion" | "continuous") ?? "conversion",
      mutualExclusionGroup,
      trafficAllocation: trafficAllocation ?? 100,
    }).returning();

    const variantRows = await db.insert(experimentVariantsTable).values(
      variants.map(v => ({
        experimentId: experiment.id,
        key: v.key,
        name: v.name,
        description: v.description,
        weight: v.weight,
        isControl: v.isControl ?? false,
      }))
    ).returning();

    sendCreated(res, { experiment, variants: variantRows });
  } catch (err) {
    handleRouteError(res, err, "Failed to create experiment");
  }
});

router.patch("/analytics/experiments/:id", authMiddleware(), requireRole("ops", "admin"), async (req: Request, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    if (isNaN(id)) { sendBadRequest(res, "Invalid experiment id"); return; }

    const { status, winnerVariantId, ...rest } = req.body as Record<string, unknown>;
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (status) {
      updates.status = status;
      if (status === "running" && !rest.startedAt) updates.startedAt = new Date();
      if ((status === "completed" || status === "archived") && !rest.endedAt) updates.endedAt = new Date();
    }
    if (winnerVariantId) updates.winnerVariantId = winnerVariantId;

    const [updated] = await db.update(experimentsTable).set(updates).where(eq(experimentsTable.id, id)).returning();
    if (!updated) { sendNotFound(res, "Experiment"); return; }

    if (winnerVariantId) {
      const [winner] = await db.select().from(experimentVariantsTable)
        .where(eq(experimentVariantsTable.id, Number(winnerVariantId))).limit(1);
      if (winner) {
        logger.info({ experimentId: id, winnerId: winnerVariantId, winnerKey: winner.key }, "[experiments] Winner declared");
      }
    }

    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to update experiment");
  }
});

router.get("/analytics/experiments/:id/assign", async (req: Request, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    if (isNaN(id)) { sendBadRequest(res, "Invalid experiment id"); return; }
    const userId = (req.query.userId as string) || (req as Request & { user?: { id?: number } }).user?.id?.toString() || "anonymous";

    const [experiment] = await db.select().from(experimentsTable)
      .where(and(eq(experimentsTable.id, id), eq(experimentsTable.status, "running")))
      .limit(1);

    if (!experiment) {
      res.json({ assigned: false, reason: "experiment_not_running" });
      return;
    }

    const [existing] = await db.select({
      variantId: experimentAssignmentsTable.variantId,
    }).from(experimentAssignmentsTable).where(
      and(
        eq(experimentAssignmentsTable.experimentId, id),
        eq(experimentAssignmentsTable.userId, userId),
      )
    ).limit(1);

    if (existing) {
      const [variant] = await db.select().from(experimentVariantsTable)
        .where(eq(experimentVariantsTable.id, existing.variantId)).limit(1);
      res.json({ assigned: true, variant, cached: true });
      return;
    }

    const trafficBucket = murmurHash(`traffic:${experiment.key}:${userId}`) % 100;
    if (trafficBucket >= (experiment.trafficAllocation ?? 100)) {
      res.json({ assigned: false, reason: "outside_traffic_allocation" });
      return;
    }

    const variants = await db.select().from(experimentVariantsTable)
      .where(eq(experimentVariantsTable.experimentId, id))
      .orderBy(experimentVariantsTable.id);

    if (variants.length === 0) {
      res.json({ assigned: false, reason: "no_variants" });
      return;
    }

    const bucket = bucketUser(userId, experiment.key);
    const totalWeight = variants.reduce((sum, v) => sum + (v.weight ?? 0), 0);
    let cumulative = 0;
    let selected = variants[0];
    const scaled = bucket / 100 * totalWeight;
    for (const v of variants) {
      cumulative += v.weight ?? 0;
      if (scaled < cumulative) { selected = v; break; }
    }

    await db.insert(experimentAssignmentsTable).values({
      experimentId: id,
      variantId: selected.id,
      userId,
    }).onConflictDoNothing();

    await db.update(experimentVariantsTable).set({
      sampleSize: sql`${experimentVariantsTable.sampleSize} + 1`,
    }).where(eq(experimentVariantsTable.id, selected.id));

    res.json({ assigned: true, variant: selected, cached: false });
  } catch (err) {
    handleRouteError(res, err, "Failed to assign experiment variant");
  }
});

router.post("/analytics/experiments/:id/convert", async (req: Request, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    if (isNaN(id)) { sendBadRequest(res, "Invalid experiment id"); return; }
    const userId = (req.body.userId as string) || (req as Request & { user?: { id?: number } }).user?.id?.toString();
    const value = typeof req.body.value === "number" ? req.body.value : 1;

    if (!userId) { sendBadRequest(res, "userId required"); return; }

    const [assignment] = await db.select().from(experimentAssignmentsTable)
      .where(and(
        eq(experimentAssignmentsTable.experimentId, id),
        eq(experimentAssignmentsTable.userId, userId),
      )).limit(1);

    if (!assignment) {
      res.json({ ok: false, reason: "not_assigned" });
      return;
    }

    await db.update(experimentVariantsTable).set({
      conversions: sql`${experimentVariantsTable.conversions} + 1`,
      totalValue: sql`${experimentVariantsTable.totalValue} + ${value}`,
    }).where(eq(experimentVariantsTable.id, assignment.variantId));

    res.json({ ok: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to record conversion");
  }
});

router.get("/analytics/experiments/:id/results", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    if (isNaN(id)) { sendBadRequest(res, "Invalid experiment id"); return; }

    const [experiment] = await db.select().from(experimentsTable).where(eq(experimentsTable.id, id)).limit(1);
    if (!experiment) { sendNotFound(res, "Experiment"); return; }

    const variants = await db.select().from(experimentVariantsTable)
      .where(eq(experimentVariantsTable.experimentId, id))
      .orderBy(experimentVariantsTable.id);

    const control = variants.find(v => v.isControl) ?? variants[0];

    const results = variants.map(v => {
      const convRate = v.sampleSize > 0 ? v.conversions / v.sampleSize : 0;
      const controlRate = control.sampleSize > 0 ? control.conversions / control.sampleSize : 0;
      const lift = controlRate > 0 ? ((convRate - controlRate) / controlRate) * 100 : 0;

      let chiSquared = 0;
      let pValue = 1;
      if (control && v.id !== control.id && v.sampleSize > 0 && control.sampleSize > 0) {
        const total = v.sampleSize + control.sampleSize;
        const totalConv = v.conversions + control.conversions;
        const expected = (totalConv / total);
        const varExpected = expected * v.sampleSize;
        const controlExpected = expected * control.sampleSize;
        if (varExpected > 0 && controlExpected > 0) {
          chiSquared = Math.pow(v.conversions - varExpected, 2) / varExpected +
                       Math.pow(control.conversions - controlExpected, 2) / controlExpected;
          pValue = Math.exp(-chiSquared / 2);
        }
      }

      const significant = pValue < 0.05 && v.sampleSize >= 30 && control.sampleSize >= 30;
      const ciHalfWidth = v.sampleSize > 0 ? 1.96 * Math.sqrt((convRate * (1 - convRate)) / v.sampleSize) : 0;

      return {
        ...v,
        conversionRate: Math.round(convRate * 10000) / 100,
        lift: Math.round(lift * 100) / 100,
        ciLower: Math.round((convRate - ciHalfWidth) * 10000) / 100,
        ciUpper: Math.round((convRate + ciHalfWidth) * 10000) / 100,
        chiSquared: Math.round(chiSquared * 100) / 100,
        pValue: Math.round(pValue * 1000) / 1000,
        significant,
        isControl: v.isControl,
      };
    });

    sendSuccess(res, { experiment, results });
  } catch (err) {
    handleRouteError(res, err, "Failed to get experiment results");
  }
});

export default router;
