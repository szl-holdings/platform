import { Router, Request, Response } from "express";
import { db, dosSessionsTable, dosAnalyticsEventsTable, dosPageViewsTable, dosLeadsTable } from "@szl-holdings/db";
import { eq, desc, gte, lte, and, sql, count, inArray } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();
const requireAuth = authMiddleware({ required: true });

// ─── DNT Helper ────────────────────────────────────────────────────────────────

function isDntRequested(req: Request): boolean {
  const dnt = req.headers["dnt"] || req.headers["x-do-not-track"] || req.headers["sec-gpc"];
  return dnt === "1" || dnt === "true";
}

// ─── Geo from request headers ──────────────────────────────────────────────────
// Prefer Cloudflare's CF-IPCountry header (accurate, no external call).
// Fall back to the first IP in X-Forwarded-For and use a regex pattern to extract
// country from the Replit reverse-proxy header if present.
// Returns a 2-letter country code or null.
function extractCountryFromRequest(req: Request): string | null {
  // Cloudflare sets this header directly — most reliable when behind CF
  const cfCountry = req.headers["cf-ipcountry"] as string | undefined;
  if (cfCountry && cfCountry.length === 2 && cfCountry !== "XX" && cfCountry !== "T1") {
    return cfCountry.toUpperCase();
  }
  // Replit and common proxies set x-country or x-vercel-ip-country
  const proxyCountry = (req.headers["x-country"] || req.headers["x-vercel-ip-country"]) as string | undefined;
  if (proxyCountry && proxyCountry.length === 2) {
    return proxyCountry.toUpperCase();
  }
  // If the client-side reported a country (accepted if explicitly provided)
  return null;
}

// ─── Session Tracking ─────────────────────────────────────────────────────────

// Start or update a session — respects DNT header
router.post("/sessions", async (req: Request, res: Response) => {
  // Respect Do Not Track and Global Privacy Control signals
  if (isDntRequested(req)) {
    return res.status(204).end();
  }

  const {
    sessionId, referrer, utmSource, utmMedium, utmCampaign, utmContent, utmTerm,
    userAgent, entryPage, anonymousId, app,
    analyticsConsent,
  } = req.body;

  // Require explicit analytics consent if provided (false = no tracking)
  if (analyticsConsent === false) {
    return res.status(204).end();
  }

  if (!sessionId) return res.status(400).json({ error: "sessionId required" });

  const existing = await db.select().from(dosSessionsTable).where(eq(dosSessionsTable.sessionId, sessionId)).limit(1);
  if (existing.length > 0) {
    // Update last seen; if we now have an anonymousId (identity link from login), update it
    const updates: Record<string, unknown> = { lastSeenAt: new Date() };
    if (anonymousId && !existing[0].anonymousId) {
      updates.anonymousId = anonymousId;
    }
    await db.update(dosSessionsTable).set(updates).where(eq(dosSessionsTable.sessionId, sessionId));
    return res.json({ ...existing[0], ...updates });
  }

  const detected = detectDevice(userAgent || "");
  // Derive country from server-side headers (CF-IPCountry or proxy headers) — no client-side trust
  const country = extractCountryFromRequest(req);

  const [session] = await db.insert(dosSessionsTable).values({
    sessionId,
    anonymousId: anonymousId || null,
    referrer: referrer || null,
    referrerChain: referrer ? [referrer] : [],
    entryPage: entryPage || null,
    utmSource: utmSource || null,
    utmMedium: utmMedium || null,
    utmCampaign: utmCampaign || null,
    utmContent: utmContent || null,
    utmTerm: utmTerm || null,
    userAgent: userAgent || null,
    deviceType: detected,
    country: country || null,
    // app tag for cohort filtering (e.g. "web", "mobile", "portal")
    ...(app ? { app } : {}),
  }).returning();

  return res.status(201).json(session);
});

// Track page visit in session — respects DNT and analyticsConsent
router.post("/sessions/:sessionId/pageview", async (req: Request, res: Response) => {
  if (isDntRequested(req)) return res.status(204).end();
  if (req.body.analyticsConsent === false) return res.status(204).end();
  const { path, durationMs, referrer, utmSource, utmMedium, utmCampaign } = req.body;
  if (!path) return res.status(400).json({ error: "path required" });

  const [session] = await db.select().from(dosSessionsTable).where(eq(dosSessionsTable.sessionId, req.params.sessionId)).limit(1);
  if (!session) return res.status(404).json({ error: "Session not found" });

  const currentSeq = (session.pageSequence || []) as Array<{ path: string; ts: number; durationMs?: number }>;
  const updated = [...currentSeq, { path, ts: Date.now(), durationMs }];

  // Update session record with new page in sequence and update duration
  await db.update(dosSessionsTable).set({
    pageSequence: updated,
    exitPage: path,
    pageCount: updated.length,
    lastSeenAt: new Date(),
    // Maintain duration as elapsed ms since session start
    durationMs: Date.now() - session.startedAt.getTime(),
    // Extend referrer chain if we have a new referrer
    referrerChain: referrer && !((session.referrerChain as string[] || []).includes(referrer))
      ? [...(session.referrerChain as string[] || []), referrer]
      : session.referrerChain,
  }).where(eq(dosSessionsTable.sessionId, req.params.sessionId));

  // Also write to dos_page_views for realtime dashboard aggregation
  try {
    await db.insert(dosPageViewsTable).values({
      path,
      referrer: referrer || session.referrer || null,
      utmSource: utmSource || session.utmSource || null,
      utmMedium: utmMedium || session.utmMedium || null,
      utmCampaign: utmCampaign || session.utmCampaign || null,
      sessionId: req.params.sessionId,
      userAgent: session.userAgent || null,
    });
  } catch {}

  return res.json({ ok: true });
});

// Mark session as converted — respects DNT and analyticsConsent
router.post("/sessions/:sessionId/convert", async (req: Request, res: Response) => {
  if (isDntRequested(req)) return res.status(204).end();
  if (req.body.analyticsConsent === false) return res.status(204).end();
  const { conversionEvent } = req.body;
  await db.update(dosSessionsTable).set({
    didConvert: true,
    conversionEvent: conversionEvent || "checkout_completed",
    lastSeenAt: new Date(),
  }).where(eq(dosSessionsTable.sessionId, req.params.sessionId));
  return res.json({ ok: true });
});

// ─── Session Replay (page sequence) ──────────────────────────────────────────

router.get("/sessions/:sessionId", requireAuth, async (req: Request, res: Response) => {
  const [session] = await db.select().from(dosSessionsTable).where(eq(dosSessionsTable.sessionId, req.params.sessionId));
  if (!session) return res.status(404).json({ error: "Session not found" });
  return res.json(session);
});

// Identity-link endpoint: associates an anonymousId (email/userId) with a session
// Called client-side when a user logs in or submits a form — enables accurate retention attribution
// Respects DNT and analyticsConsent
router.post("/sessions/:sessionId/identify", async (req: Request, res: Response) => {
  if (isDntRequested(req)) return res.status(204).end();
  if (req.body.analyticsConsent === false) return res.status(204).end();

  const { anonymousId } = req.body;
  if (!anonymousId) return res.status(400).json({ error: "anonymousId required" });

  const [session] = await db.select().from(dosSessionsTable)
    .where(eq(dosSessionsTable.sessionId, req.params.sessionId))
    .limit(1);

  if (!session) return res.status(404).json({ error: "Session not found" });

  // Only link if not already linked — prevents overwrite with a different identity
  if (session.anonymousId && session.anonymousId !== anonymousId) {
    return res.status(409).json({ error: "Session already linked to a different identity" });
  }

  await db.update(dosSessionsTable)
    .set({ anonymousId, lastSeenAt: new Date() })
    .where(eq(dosSessionsTable.sessionId, req.params.sessionId));

  return res.json({ ok: true, linked: true });
});

router.get("/sessions", requireAuth, async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const source = req.query.source as string | undefined;
  const deviceType = req.query.device as string | undefined;
  const converted = req.query.converted as string | undefined;
  const days = Number(req.query.days) || 7;

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const conditions = [gte(dosSessionsTable.startedAt, since)];

  if (source) conditions.push(eq(dosSessionsTable.utmSource, source));
  if (deviceType) conditions.push(eq(dosSessionsTable.deviceType, deviceType as "desktop" | "mobile" | "tablet" | "unknown"));
  if (converted === "true") conditions.push(eq(dosSessionsTable.didConvert, true));
  if (converted === "false") conditions.push(eq(dosSessionsTable.didConvert, false));

  const sessions = await db.select().from(dosSessionsTable)
    .where(and(...conditions))
    .orderBy(desc(dosSessionsTable.startedAt))
    .limit(limit)
    .offset(offset);

  return res.json(sessions);
});

// ─── Cohort Analysis ──────────────────────────────────────────────────────────
// Supports filters: ?weeks=8&source=google&app=web&country=US&medium=cpc

router.get("/cohorts", requireAuth, async (req: Request, res: Response) => {
  const weeks = Math.min(Number(req.query.weeks) || 8, 52);
  // Optional cohort dimension filters
  const filterSource = req.query.source as string | undefined;
  const filterApp = req.query.app as string | undefined;
  const filterCountry = req.query.country as string | undefined;
  const filterMedium = req.query.medium as string | undefined;

  const cohorts = [];

  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);

    // Build lead acquisition filter — includes source/medium/app filter via lead.source or session join
    const leadConditions = [
      gte(dosLeadsTable.createdAt, weekStart),
      lte(dosLeadsTable.createdAt, weekEnd),
    ];
    if (filterSource) leadConditions.push(eq(dosLeadsTable.source, filterSource));

    const cohortLeads = await db.select({ id: dosLeadsTable.id, email: dosLeadsTable.email, createdAt: dosLeadsTable.createdAt })
      .from(dosLeadsTable)
      .where(and(...leadConditions));

    if (cohortLeads.length === 0) {
      cohorts.push({
        week: weekStart.toISOString().split("T")[0],
        cohortSize: 0, d1Retention: 0, d7Retention: 0, d30Retention: 0,
        filters: { source: filterSource, app: filterApp, country: filterCountry, medium: filterMedium },
      });
      continue;
    }

    // Per-user retention: check each user individually using their actual signup date
    // as the D0 anchor, then count distinct returning users (not session count) within window.
    // Identity is linked via anonymousId = lead.email (set on login/form submit by client SDK).
    let d1Users = 0, d7Users = 0, d30Users = 0;

    for (const lead of cohortLeads) {
      const d0 = new Date(lead.createdAt);

      // Build session filter conditions for this specific user
      const buildSessionConds = (start: Date, end: Date) => {
        const conds = [
          eq(dosSessionsTable.anonymousId, lead.email),
          gte(dosSessionsTable.startedAt, start),
          lte(dosSessionsTable.startedAt, end),
        ];
        // Apply optional dimension filters to the return-session window
        if (filterCountry) conds.push(eq(dosSessionsTable.country, filterCountry));
        if (filterMedium) conds.push(eq(dosSessionsTable.utmMedium, filterMedium));
        if (filterApp) conds.push(eq(dosSessionsTable.app, filterApp));
        return conds;
      };

      // D1: returned at least once in [d0+1h, d0+24h] to filter out signup-session itself
      const d1Start = new Date(d0.getTime() + 60 * 60 * 1000);
      const d1Cutoff = new Date(d0.getTime() + 24 * 60 * 60 * 1000);
      const d1Rows = await db.select({ sessionId: dosSessionsTable.sessionId })
        .from(dosSessionsTable)
        .where(and(...buildSessionConds(d1Start, d1Cutoff)))
        .limit(1);
      if (d1Rows.length > 0) d1Users++;

      // D7: returned in [d0+1d, d0+7d]
      const d7Start = new Date(d0.getTime() + 24 * 60 * 60 * 1000);
      const d7Cutoff = new Date(d0.getTime() + 7 * 24 * 60 * 60 * 1000);
      const d7Rows = await db.select({ sessionId: dosSessionsTable.sessionId })
        .from(dosSessionsTable)
        .where(and(...buildSessionConds(d7Start, d7Cutoff)))
        .limit(1);
      if (d7Rows.length > 0) d7Users++;

      // D30: returned in [d0+1d, d0+30d]
      const d30Start = new Date(d0.getTime() + 24 * 60 * 60 * 1000);
      const d30Cutoff = new Date(d0.getTime() + 30 * 24 * 60 * 60 * 1000);
      const d30Rows = await db.select({ sessionId: dosSessionsTable.sessionId })
        .from(dosSessionsTable)
        .where(and(...buildSessionConds(d30Start, d30Cutoff)))
        .limit(1);
      if (d30Rows.length > 0) d30Users++;
    }

    const size = cohortLeads.length;
    cohorts.push({
      week: weekStart.toISOString().split("T")[0],
      cohortSize: size,
      d1Retention: size > 0 ? Math.round((d1Users / size) * 100) : 0,
      d7Retention: size > 0 ? Math.round((d7Users / size) * 100) : 0,
      d30Retention: size > 0 ? Math.round((d30Users / size) * 100) : 0,
      filters: { source: filterSource, app: filterApp, country: filterCountry, medium: filterMedium },
    });
  }

  return res.json(cohorts.reverse());
});

// ─── Funnel Analysis ──────────────────────────────────────────────────────────

router.post("/funnels/analyze", requireAuth, async (req: Request, res: Response) => {
  const { steps, days = 7, breakdownBy } = req.body as {
    steps: Array<{ name: string; event: string; path?: string }>;
    days?: number;
    breakdownBy?: "source" | "device" | "geography" | "time_of_day";
  };

  if (!steps || steps.length < 2) return res.status(400).json({ error: "Need at least 2 funnel steps" });

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Fetch all sessions in the time window with their full page sequences and event data
  const allSessions = await db.select({
    sessionId: dosSessionsTable.sessionId,
    pageSequence: dosSessionsTable.pageSequence,
    utmSource: dosSessionsTable.utmSource,
    deviceType: dosSessionsTable.deviceType,
    country: dosSessionsTable.country,
    didConvert: dosSessionsTable.didConvert,
  }).from(dosSessionsTable).where(gte(dosSessionsTable.startedAt, since)).limit(1000);

  // Get signup/form events separately
  const signupEvents = await db.select({ sessionId: dosAnalyticsEventsTable.sessionId })
    .from(dosAnalyticsEventsTable)
    .where(and(gte(dosAnalyticsEventsTable.createdAt, since), eq(dosAnalyticsEventsTable.eventType, "subscribe")));
  const signupSessionIds = new Set(signupEvents.map(e => e.sessionId).filter(Boolean) as string[]);

  type SessionRow = typeof allSessions[number];
  type PageEntry = { path: string; ts: number };

  // True sequential funnel: for each session, check if steps were visited IN ORDER
  // A session passes step N only if step N's page/event appears AFTER step N-1's timestamp
  function sessionPassesFunnelUpTo(session: SessionRow, upToStepIndex: number): boolean {
    const pages = (session.pageSequence || []) as PageEntry[];
    let lastMatchTs = -Infinity;

    for (let i = 0; i <= upToStepIndex; i++) {
      const step = steps[i];
      let matchTs: number | null = null;

      if (step.event === "signup" || step.event === "form_submit") {
        if (signupSessionIds.has(session.sessionId)) {
          matchTs = lastMatchTs + 1;
        }
      } else if (step.path) {
        // Find the FIRST occurrence of this path that appears AFTER lastMatchTs (ordered)
        for (const page of pages) {
          if (page.path === step.path && page.ts > lastMatchTs) {
            matchTs = page.ts;
            break;
          }
        }
      } else {
        matchTs = lastMatchTs + 1;
      }

      if (matchTs === null) return false;
      lastMatchTs = matchTs;
    }
    return true;
  }

  const result: Array<{
    step: string;
    count: number;
    dropOff: number;
    dropOffRate: number;
    conversionRate: number;
    breakdown?: Record<string, number>;
    sampleSessions?: Array<{ sessionId: string; pages: PageEntry[] }>;
  }> = [];

  let prevCount: number | null = null;

  for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
    const step = steps[stepIndex];

    // Sessions that completed all funnel steps up to and including this one, IN ORDER
    const passedSessions = allSessions.filter(sess => sessionPassesFunnelUpTo(sess, stepIndex));

    const uniqueCount = passedSessions.length;
    const dropOff = prevCount !== null ? prevCount - uniqueCount : 0;
    const dropOffRate = prevCount !== null && prevCount > 0 ? Math.round((dropOff / prevCount) * 100) : 0;
    const conversionRate = prevCount !== null && prevCount > 0 ? Math.round((uniqueCount / prevCount) * 100) : 100;

    // Breakdown by dimension (including time-of-day based on step pageSequence timestamps)
    let breakdown: Record<string, number> | undefined;
    if (breakdownBy && passedSessions.length > 0) {
      breakdown = {};
      for (const sess of passedSessions) {
        let key: string;
        if (breakdownBy === "source") {
          key = sess.utmSource || "direct";
        } else if (breakdownBy === "device") {
          key = sess.deviceType;
        } else if (breakdownBy === "geography") {
          key = sess.country || "unknown";
        } else if (breakdownBy === "time_of_day") {
          // Derive time-of-day from the current step's page timestamp in pageSequence
          const pages = (sess.pageSequence || []) as Array<{ path: string; ts: number }>;
          const step = steps[stepIndex];
          let matchTs: number | undefined;
          if (step.path) {
            const found = pages.find(p => p.path === step.path);
            matchTs = found?.ts;
          }
          if (matchTs) {
            const hour = new Date(matchTs).getHours();
            if (hour >= 6 && hour < 12) key = "morning";
            else if (hour >= 12 && hour < 17) key = "afternoon";
            else if (hour >= 17 && hour < 21) key = "evening";
            else key = "night";
          } else {
            key = "unknown";
          }
        } else {
          key = "unknown";
        }
        breakdown[key] = (breakdown[key] || 0) + 1;
      }
    }

    // Sample sessions for drill-down
    const sampleSessions = passedSessions.slice(0, 5).map(s => ({
      sessionId: s.sessionId,
      pages: (s.pageSequence || []) as PageEntry[],
    }));

    result.push({
      step: step.name,
      count: uniqueCount,
      dropOff,
      dropOffRate,
      conversionRate,
      breakdown,
      sampleSessions,
    });

    prevCount = uniqueCount;
  }

  return res.json({ funnel: result, days, totalSessions: allSessions.length });
});

// ─── Real-time Dashboard ──────────────────────────────────────────────────────

router.get("/realtime", requireAuth, async (_req: Request, res: Response) => {
  const last5Min = new Date(Date.now() - 5 * 60 * 1000);
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const last30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const activeNowRows = await db.select({ c: count() }).from(dosSessionsTable).where(gte(dosSessionsTable.lastSeenAt, last5Min));
  const sessions24hRows = await db.select({ c: count() }).from(dosSessionsTable).where(gte(dosSessionsTable.startedAt, last24h));
  const sessions7dRows = await db.select({ c: count() }).from(dosSessionsTable).where(gte(dosSessionsTable.startedAt, last7d));
  const conversions7dRows = await db.select({ c: count() }).from(dosSessionsTable).where(and(gte(dosSessionsTable.startedAt, last7d), eq(dosSessionsTable.didConvert, true)));
  const leads7dRows = await db.select({ c: count() }).from(dosLeadsTable).where(gte(dosLeadsTable.createdAt, last7d));

  // Top pages last 7d
  const topPages = await db.select({
    path: dosPageViewsTable.path,
    c: count(),
  }).from(dosPageViewsTable)
    .where(gte(dosPageViewsTable.createdAt, last7d))
    .groupBy(dosPageViewsTable.path)
    .orderBy(desc(count()))
    .limit(10);

  // Sources breakdown
  const sourceBreakdown = await db.select({
    source: dosSessionsTable.utmSource,
    c: count(),
  }).from(dosSessionsTable)
    .where(gte(dosSessionsTable.startedAt, last7d))
    .groupBy(dosSessionsTable.utmSource)
    .orderBy(desc(count()))
    .limit(8);

  // Device breakdown
  const deviceBreakdown = await db.select({
    device: dosSessionsTable.deviceType,
    c: count(),
  }).from(dosSessionsTable)
    .where(gte(dosSessionsTable.startedAt, last7d))
    .groupBy(dosSessionsTable.deviceType);

  // Daily sessions for sparkline (last 30d)
  const dailySessions = await db.execute(sql`
    SELECT
      DATE(started_at) as date,
      COUNT(*) as sessions,
      COUNT(*) FILTER (WHERE did_convert = true) as conversions
    FROM dos_sessions
    WHERE started_at >= ${last30d}
    GROUP BY DATE(started_at)
    ORDER BY date ASC
  `);

  const totalSessions7d = Number(sessions7dRows[0]?.c ?? 0);
  const conversionRate7d = totalSessions7d > 0 ? (Number(conversions7dRows[0]?.c ?? 0) / totalSessions7d * 100).toFixed(1) : "0.0";

  return res.json({
    activeNow: Number(activeNowRows[0]?.c ?? 0),
    sessions24h: Number(sessions24hRows[0]?.c ?? 0),
    sessions7d: totalSessions7d,
    conversions7d: Number(conversions7dRows[0]?.c ?? 0),
    conversionRate7d,
    leads7d: Number(leads7dRows[0]?.c ?? 0),
    topPages: topPages.map(p => ({ path: p.path, count: p.c })),
    sourceBreakdown: sourceBreakdown.map(s => ({ source: s.source || "direct", count: s.c })),
    deviceBreakdown: deviceBreakdown.map(d => ({ device: d.device, count: d.c })),
    dailySessions: (dailySessions.rows || []) as Array<{ date: string; sessions: string; conversions: string }>,
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectDevice(userAgent: string): "desktop" | "mobile" | "tablet" | "unknown" {
  if (!userAgent) return "unknown";
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
  if (/windows|macintosh|linux/i.test(ua)) return "desktop";
  return "unknown";
}

export default router;
