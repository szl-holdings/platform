import { Router, type IRouter, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { services } from "@szl-holdings/services";
import { db, intelligenceCacheTable } from "@szl-holdings/db";
import { eq } from "drizzle-orm";

type SamGovOpportunity = { title: string; solicitationNumber?: string; type?: string; postedDate?: string; responseDeadLine?: string; naicsCode?: string; setAside?: string; placeOfPerformance?: string; department?: string; subtier?: string; office?: string; description?: string; pointOfContact?: { fullName?: string; email?: string; phone?: string }[] };
type SamGovEntity = { ueiSAM?: string; legalBusinessName?: string; entityStatus?: string; registrationDate?: string; expirationDate?: string; cageCode?: string; physicalAddress?: { city?: string; stateOrProvinceCode?: string; countryCode?: string } };

const router: IRouter = Router();

const samLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "SAM.gov rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

const samAdapter = (services as any).samgov;

const samMemCache = new Map<string, { data: unknown; expiresAt: number }>();

async function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const mem = samMemCache.get(key);
  if (mem && mem.expiresAt > Date.now()) return mem.data as T;
  const expiresAt = new Date(Date.now() + ttlMs);
  const dbKey = `sam-${key}`;
  try {
    const [row] = await db.select().from(intelligenceCacheTable).where(eq(intelligenceCacheTable.key, dbKey)).limit(1);
    if (row && new Date(row.expiresAt) > new Date()) {
      samMemCache.set(key, { data: row.data, expiresAt: new Date(row.expiresAt).getTime() });
      return row.data as T;
    }
  } catch (_e) { /* DB unavailable; fall through to live fetch */ }
  try {
    const data = await fetcher();
    samMemCache.set(key, { data, expiresAt: expiresAt.getTime() });
    await db.insert(intelligenceCacheTable).values({ key: dbKey, data: data as unknown, expiresAt, fetchedAt: new Date() })
      .onConflictDoUpdate({ target: intelligenceCacheTable.key, set: { data: data as unknown, expiresAt, fetchedAt: new Date() } })
      .catch(() => undefined);
    return data;
  } catch (err) {
    const [stale] = await db.select().from(intelligenceCacheTable).where(eq(intelligenceCacheTable.key, dbKey)).limit(1).catch(() => [null]);
    if (stale) return stale.data as T;
    throw err;
  }
}

const LYTE_RELEVANT_NAICS = [
  { code: "541511", name: "Custom Computer Programming Services" },
  { code: "541512", name: "Computer Systems Design Services" },
  { code: "541519", name: "Other Computer Related Services" },
  { code: "541330", name: "Engineering Services" },
  { code: "517110", name: "Wired Telecommunications Carriers" },
  { code: "541690", name: "Other Scientific/Technical Consulting" },
  { code: "561990", name: "All Other Support Services" },
];

type OppResult =
  | { status: "NOT_CONFIGURED"; note: string; opportunities: SamGovOpportunity[]; source: undefined }
  | { status: "live"; opportunities: SamGovOpportunity[]; source: string; count: number }
  | { status: "error"; opportunities: SamGovOpportunity[]; source: string; error: string };

type EntityResult =
  | { status: "NOT_CONFIGURED"; note: string; entities: SamGovEntity[] }
  | { status: "live"; entities: SamGovEntity[]; source: string }
  | { status: "error"; entities: SamGovEntity[]; source: string; error: string };

interface UsaSpendingAward {
  Award_ID?: string;
  Recipient_Name?: string;
  Award_Amount?: number;
  Awarding_Agency?: string;
  Award_Description?: string;
  NAICS_Code?: string;
  Contract_Award_Type?: string;
  Start_Date?: string;
}

interface UsaSpendingResponse { results?: UsaSpendingAward[]; }

type ContractSignalsResult = {
  recentAwards: { awardId: string; recipient: string; amount: number; agency: string; description: string; naics: string; type: string; date: string }[];
  totalAwarded: number;
  source: string;
};

router.get("/lyte/live/sam-opportunities", samLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const keywords = req.query.keywords as string;
    const naicsCode = req.query.naics as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 25);
    const cacheKey = `sam-opps-${keywords ?? "all"}-${naicsCode ?? "all"}-${limit}`;

    const result = await getCached<OppResult>(cacheKey, 3600000, async () => {
      if (!samAdapter.isLive) {
        return {
          status: "NOT_CONFIGURED",
          note: "Set SAM_GOV_API_KEY to access SAM.gov Contract Opportunities. Free registration at https://sam.gov/",
          opportunities: [],
          source: undefined,
        };
      }
      try {
        const opps = await samAdapter.searchOpportunities({ keywords, naicsCode, limit });
        return { status: "live", opportunities: opps, source: "SAM.gov API v2", count: opps.length };
      } catch (err: unknown) {
        return { status: "error", opportunities: [], source: "error", error: err instanceof Error ? err.message : String(err) };
      }
    });

    const byType = result.opportunities.reduce<Record<string, number>>((acc, o) => {
      if (o.type) acc[o.type] = (acc[o.type] ?? 0) + 1;
      return acc;
    }, {});

    sendSuccess(res, {
      source: "SAM.gov Contract Opportunities API v2",
      url: "https://sam.gov/opportunities/",
      apiDocs: "https://open.gsa.gov/api/get-opportunities-public-api/",
      configured: samAdapter.isLive,
      dataSource: result.source,
      liveData: result.source === "SAM.gov API v2",
      count: result.opportunities.length,
      opportunities: result.opportunities,
      summary: {
        byType,
        activeCount: result.opportunities.filter((o: any) => o.active).length,
        relevantNaicsCodes: LYTE_RELEVANT_NAICS,
      },
      ...("note" in result && result.note ? { note: result.note } : {}),
      ...("error" in result && result.error ? { error: result.error } : {}),
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch SAM.gov opportunities"); }
});

router.get("/lyte/live/sam-entities", samLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const entityName = req.query.name as string;
    const naicsCode = req.query.naics as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 25);
    const cacheKey = `sam-entities-${entityName ?? "all"}-${naicsCode ?? "all"}-${limit}`;

    const result = await getCached<EntityResult>(cacheKey, 3600000, async () => {
      if (!samAdapter.isLive) {
        return {
          status: "NOT_CONFIGURED",
          note: "Set SAM_GOV_API_KEY to access SAM.gov Entity Management. Free registration at https://sam.gov/",
          entities: [],
        };
      }
      try {
        const entities = await samAdapter.searchEntities({ entityName, naicsCode, limit });
        return { status: "live", entities, source: "SAM.gov API v3" };
      } catch (err: unknown) {
        return { status: "error", entities: [], source: "error", error: err instanceof Error ? err.message : String(err) };
      }
    });

    sendSuccess(res, {
      source: "SAM.gov Entity Management API v3",
      url: "https://sam.gov/",
      configured: samAdapter.isLive,
      dataSource: "source" in result ? result.source : undefined,
      liveData: "source" in result && result.source === "SAM.gov API v3",
      count: result.entities.length,
      entities: result.entities,
      ...("note" in result && result.note ? { note: result.note } : {}),
      ...("error" in result && result.error ? { error: result.error } : {}),
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch SAM.gov entities"); }
});

router.get("/lyte/live/contract-signals", samLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const result = await getCached<ContractSignalsResult>("lyte-contract-signals", 3600000, async () => {
      const [usaSpending] = await Promise.allSettled([
        (async (): Promise<UsaSpendingResponse> => {
          const r = await fetch("https://api.usaspending.gov/api/v2/search/spending_by_award/", {
            method: "POST",
            headers: { "Content-Type": "application/json", "User-Agent": "SZL-Lyte/1.0" },
            body: JSON.stringify({
              filters: {
                award_type_codes: ["A", "B", "C", "D"],
                naics_codes: LYTE_RELEVANT_NAICS.map(n => n.code),
              },
              page: 1,
              limit: 10,
              sort: "Award Amount",
              order: "desc",
            }),
            signal: AbortSignal.timeout(12000),
          });
          if (!r.ok) throw new Error(`USASpending HTTP ${r.status}`);
          return r.json() as Promise<UsaSpendingResponse>;
        })(),
      ]);

      const awards = usaSpending.status === "fulfilled" ? (usaSpending.value.results ?? []) : [];

      return {
        recentAwards: awards.slice(0, 10).map(a => ({
          awardId: a.Award_ID ?? "",
          recipient: a.Recipient_Name ?? "",
          amount: a.Award_Amount ?? 0,
          agency: a.Awarding_Agency ?? "",
          description: a.Award_Description ?? "",
          naics: a.NAICS_Code ?? "",
          type: a.Contract_Award_Type ?? "",
          date: a.Start_Date ?? "",
        })),
        totalAwarded: awards.reduce((s, a) => s + (a.Award_Amount ?? 0), 0),
        source: awards.length > 0 ? "live" : "unavailable",
      };
    });

    sendSuccess(res, {
      source: "Lyte Contract Intelligence — USASpending.gov + SAM.gov",
      url: "https://www.usaspending.gov/",
      relevantNaicsCodes: LYTE_RELEVANT_NAICS,
      samConfigured: samAdapter.isLive,
      samNote: samAdapter.isLive ? "SAM.gov live" : "Set SAM_GOV_API_KEY for live SAM.gov contract pipeline",
      recentAwards: result.recentAwards,
      totalAwarded: result.totalAwarded,
      dataSource: result.source,
      liveData: result.source === "live",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch contract signals"); }
});

export default router;
