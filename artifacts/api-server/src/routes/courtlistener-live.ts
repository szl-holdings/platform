import { Router, type IRouter, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { services, type CourtListenerDocket, type CourtListenerOpinion } from "@szl-holdings/services";
import { db, intelligenceCacheTable } from "@szl-holdings/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const clLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "CourtListener rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

const clAdapter = services.courtlistener;

const clMemCache = new Map<string, { data: unknown; expiresAt: number }>();

async function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const mem = clMemCache.get(key);
  if (mem && mem.expiresAt > Date.now()) return mem.data as T;
  const expiresAt = new Date(Date.now() + ttlMs);
  const dbKey = `cl-${key}`;
  try {
    const [row] = await db.select().from(intelligenceCacheTable).where(eq(intelligenceCacheTable.key, dbKey)).limit(1);
    if (row && new Date(row.expiresAt) > new Date()) {
      clMemCache.set(key, { data: row.data, expiresAt: new Date(row.expiresAt).getTime() });
      return row.data as T;
    }
  } catch (_e) { /* DB unavailable; fall through to live fetch */ }
  const data = await fetcher();
  clMemCache.set(key, { data, expiresAt: expiresAt.getTime() });
  await db.insert(intelligenceCacheTable).values({ key: dbKey, data: data as unknown, expiresAt, fetchedAt: new Date() })
    .onConflictDoUpdate({ target: intelligenceCacheTable.key, set: { data: data as unknown, expiresAt, fetchedAt: new Date() } })
    .catch(() => undefined);
  return data;
}

const FEDERAL_CIRCUITS = [
  { id: "ca1", name: "First Circuit" },
  { id: "ca2", name: "Second Circuit (NY)" },
  { id: "ca9", name: "Ninth Circuit" },
  { id: "scotus", name: "Supreme Court" },
  { id: "dcd", name: "D.C. Circuit" },
];

type DocketResult = { status: string; dockets: CourtListenerDocket[]; source?: string; error?: string };
type OpinionResult = { status: string; opinions: CourtListenerOpinion[]; source?: string; error?: string };
type RecapResult = { status: string; docket: CourtListenerDocket | null; error?: string };

router.get("/prism/live/dockets", clLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const q = (req.query.q as string) || "breach of contract";
    const court = req.query.court as string;
    const pageSize = Math.min(parseInt(req.query.limit as string) || 10, 25);
    const cacheKey = `dockets-${q}-${court ?? "all"}-${pageSize}`;

    const dockets = await getCached<DocketResult>(cacheKey, 3600000, async () => {
      try {
        const results = await clAdapter.searchDockets(q, court, pageSize);
        return { status: "live", dockets: results, source: "CourtListener API v4" };
      } catch (err: unknown) {
        return { status: "error", error: err instanceof Error ? err.message : String(err), dockets: [], source: "CourtListener API v4" };
      }
    });

    sendSuccess(res, {
      source: "CourtListener REST API v4 — Free Public Legal Database",
      url: "https://www.courtlistener.com/",
      authenticated: clAdapter.authenticatedAccess,
      query: q,
      court,
      federalCircuits: FEDERAL_CIRCUITS,
      ...dockets,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch CourtListener dockets"); }
});

router.get("/prism/live/opinions", clLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const q = (req.query.q as string) || "negligence damages";
    const court = req.query.court as string;
    const pageSize = Math.min(parseInt(req.query.limit as string) || 10, 25);
    const cacheKey = `opinions-${q}-${court ?? "all"}-${pageSize}`;

    const opinions = await getCached<OpinionResult>(cacheKey, 3600000, async () => {
      try {
        const results = await clAdapter.searchOpinions(q, court, pageSize);
        return { status: "live", opinions: results, source: "CourtListener API v4" };
      } catch (err: unknown) {
        return { status: "error", error: err instanceof Error ? err.message : String(err), opinions: [] };
      }
    });

    sendSuccess(res, {
      source: "CourtListener REST API v4 — Federal Court Opinions",
      url: "https://www.courtlistener.com/",
      authenticated: clAdapter.authenticatedAccess,
      query: q,
      court,
      ...opinions,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch CourtListener opinions"); }
});

router.get("/prism/live/recap/:docketId", clLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const docketId = String(req.params["docketId"] ?? "");
    const cacheKey = `recap-docket-${docketId}`;

    const docket = await getCached<RecapResult>(cacheKey, 3600000, async () => {
      try {
        const result = await clAdapter.getRecapDocket(docketId);
        return { status: "live", docket: result };
      } catch (err: unknown) {
        return { status: "error", error: err instanceof Error ? err.message : String(err), docket: null };
      }
    });

    sendSuccess(res, {
      source: "CourtListener RECAP Archive",
      url: `https://www.courtlistener.com/docket/${docketId}/`,
      docketId,
      authenticated: clAdapter.authenticatedAccess,
      ...docket,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch RECAP docket"); }
});

router.get("/prism/live/courts", clLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, {
      source: "CourtListener Court Directory",
      url: "https://www.courtlistener.com/",
      federalCircuits: FEDERAL_CIRCUITS,
      districtCourts: [
        { id: "nysd", name: "S.D.N.Y. — Southern District of New York" },
        { id: "nyed", name: "E.D.N.Y. — Eastern District of New York" },
        { id: "cacd", name: "C.D. Cal. — Central District of California" },
        { id: "txsd", name: "S.D. Tex. — Southern District of Texas" },
        { id: "ilnd", name: "N.D. Ill. — Northern District of Illinois" },
        { id: "flsd", name: "S.D. Fla. — Southern District of Florida" },
      ],
      apiAccess: {
        anonymous: "Publicly accessible at https://www.courtlistener.com/api/rest/v4/",
        dockets: "https://www.courtlistener.com/api/rest/v4/dockets/",
        opinions: "https://www.courtlistener.com/api/rest/v4/opinions/",
        recap: "https://www.courtlistener.com/api/rest/v4/recap/",
        enhancedRateLimit: "Set COURTLISTENER_API_TOKEN env var for higher rate limits — free at https://www.courtlistener.com/sign-in/",
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch court directory"); }
});

export default router;
