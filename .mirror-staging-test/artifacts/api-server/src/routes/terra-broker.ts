import { Router, type IRouter, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { db } from "@workspace/db";
import {
  terraListingsTable,
  terraAgentsTable,
  terraBrokeragesTable,
  terraInquiriesTable,
  terraTransactionsTable,
  terraPropertiesTable,
} from "@workspace/db";
import { eq, desc, and, or, ilike, sql, asc, gte, lte } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

const terraRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terra broker rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

const auth = authMiddleware({ required: true });

// ─── Query validators ──────────────────────────────────────────────────────────

const LISTING_STATUSES = ["active", "pending", "under_contract", "closed", "expired", "withdrawn"] as const;
const PROPERTY_TYPES = ["office", "retail", "industrial", "multifamily", "mixed-use", "land", "hospitality", "other"] as const;
const AGENT_SPECIALTIES = ["office", "retail", "industrial", "multifamily", "mixed-use", "land", "residential"] as const;
const AGENT_STATUSES = ["active", "inactive", "on_leave"] as const;
const INQUIRY_STATUSES = ["new", "contacted", "qualified", "showing_scheduled", "offer_submitted", "converted", "lost", "do_not_contact"] as const;
const INQUIRY_BUYER_TYPES = ["investor", "owner_occupant", "developer", "family_office", "reit", "unknown"] as const;
const INQUIRY_FINANCING = ["cash", "pre_approved", "seeking_financing", "unknown"] as const;
const INQUIRY_SOURCES = ["web", "email", "phone", "referral", "portal", "direct", "other"] as const;
const TX_STATUSES = ["completed", "fallen_through", "pending_recording"] as const;
const TX_FINANCING = ["cash", "conventional", "bridge", "cmbs", "life_co", "agency", "other"] as const;


// ─── Listing query helpers ─────────────────────────────────────────────────────

const ListingsQuerySchema = z.object({
  status: z.enum(LISTING_STATUSES).optional(),
  type: z.enum(PROPERTY_TYPES).optional(),
  submarket: z.string().optional(),
  sort: z.enum(["price_asc", "price_desc", "dom_asc", "dom_desc", "score_desc"]).optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const ListingCreateSchema = z.object({
  propertyId: z.number().int().positive(),
  agentId: z.number().int().positive().optional(),
  brokerageId: z.number().int().positive().optional(),
  status: z.enum(LISTING_STATUSES).default("active"),
  listPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "listPrice must be a numeric string"),
  originalListPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  pricePerSqft: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  capRate: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  noi: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  listDate: z.string(),
  opportunityScore: z.number().int().min(0).max(100).optional(),
  isDemo: z.boolean().default(false),
});

const ListingPatchSchema = ListingCreateSchema.partial().omit({ propertyId: true, isDemo: true });

// ─── GET /terra/broker/listings ────────────────────────────────────────────────

router.get("/terra/broker/listings", terraRateLimit, auth, async (req, res) => {
  try {
    const parsed = ListingsQuerySchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: "Invalid query parameters", issues: parsed.error.issues }); return; }

    const { status, type, submarket, sort, q, limit: limitN, offset: offsetN } = parsed.data;

    const conditions: ReturnType<typeof and>[] = [];
    if (status) conditions.push(eq(terraListingsTable.status, status));
    if (submarket) conditions.push(ilike(terraPropertiesTable.submarket, `%${submarket}%`));
    if (type) conditions.push(eq(terraPropertiesTable.propertyType, type));
    if (q) {
      const q_ = `%${q}%`;
      conditions.push(or(ilike(terraPropertiesTable.address, q_), ilike(terraPropertiesTable.submarket, q_))!);
    }

    const orderCol = (() => {
      switch (sort) {
        case "price_asc": return asc(terraListingsTable.listPrice);
        case "price_desc": return desc(terraListingsTable.listPrice);
        case "dom_asc": return asc(terraListingsTable.daysOnMarket);
        case "dom_desc": return desc(terraListingsTable.daysOnMarket);
        default: return desc(terraListingsTable.opportunityScore);
      }
    })();

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: terraListingsTable.id,
        address: terraPropertiesTable.address,
        city: terraPropertiesTable.city,
        state: terraPropertiesTable.state,
        submarket: terraPropertiesTable.submarket,
        propertyType: terraPropertiesTable.propertyType,
        sqft: terraPropertiesTable.sqft,
        status: terraListingsTable.status,
        listPrice: terraListingsTable.listPrice,
        pricePerSqft: terraListingsTable.pricePerSqft,
        capRate: terraListingsTable.capRate,
        noi: terraListingsTable.noi,
        daysOnMarket: terraListingsTable.daysOnMarket,
        inquiryCount: terraListingsTable.inquiryCount,
        viewCount: terraListingsTable.viewCount,
        priceReductions: terraListingsTable.priceReductions,
        opportunityScore: terraListingsTable.opportunityScore,
        listDate: terraListingsTable.listDate,
        agentFirst: terraAgentsTable.firstName,
        agentLast: terraAgentsTable.lastName,
        brokerageName: terraBrokeragesTable.name,
      })
      .from(terraListingsTable)
      .innerJoin(terraPropertiesTable, eq(terraListingsTable.propertyId, terraPropertiesTable.id))
      .leftJoin(terraAgentsTable, eq(terraListingsTable.agentId, terraAgentsTable.id))
      .leftJoin(terraBrokeragesTable, eq(terraListingsTable.brokerageId, terraBrokeragesTable.id))
      .where(whereClause)
      .orderBy(orderCol)
      .limit(limitN)
      .offset(offsetN);

    const [totals] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(terraListingsTable)
      .innerJoin(terraPropertiesTable, eq(terraListingsTable.propertyId, terraPropertiesTable.id))
      .where(whereClause);

    const [agg] = await db
      .select({
        totalValue: sql<string>`coalesce(sum(list_price::numeric), 0)`,
        avgDom: sql<number>`round(avg(days_on_market))::int`,
        avgScore: sql<number>`round(avg(opportunity_score))::int`,
        activeCount: sql<number>`count(*) filter (where status = 'active')::int`,
        pendingCount: sql<number>`count(*) filter (where status = 'under_contract')::int`,
      })
      .from(terraListingsTable);

    sendSuccess(res, {
      source: "Terra Listings Command",
      total: totals?.count ?? 0,
      count: rows.length,
      offset: offsetN,
      listings: rows.map(r => ({
        id: r.id,
        address: `${r.address}, ${r.city}, ${r.state}`,
        submarket: r.submarket,
        type: r.propertyType,
        sqft: r.sqft,
        status: r.status,
        listPrice: Number(r.listPrice),
        pricePerSqft: r.pricePerSqft ? Number(r.pricePerSqft) : null,
        capRate: r.capRate ? Number(r.capRate) : null,
        noi: r.noi ? Number(r.noi) : null,
        daysOnMarket: r.daysOnMarket,
        inquiryCount: r.inquiryCount,
        viewCount: r.viewCount,
        priceReductions: r.priceReductions,
        opportunityScore: r.opportunityScore,
        listDate: r.listDate,
        agentName: r.agentFirst ? `${r.agentLast}, ${r.agentFirst.charAt(0)}.` : null,
        brokerage: r.brokerageName,
      })),
      aggregate: {
        totalValue: Number(agg?.totalValue ?? 0),
        avgDaysOnMarket: agg?.avgDom ?? 0,
        avgOpportunityScore: agg?.avgScore ?? 0,
        activeCount: agg?.activeCount ?? 0,
        pendingCount: agg?.pendingCount ?? 0,
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch listings"); }
});

// ─── POST /terra/broker/listings ───────────────────────────────────────────────

router.post("/terra/broker/listings", terraRateLimit, auth, async (req, res) => {
  try {
    const parsed = ListingCreateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid listing data", issues: parsed.error.issues }); return; }

    const { propertyId, agentId, brokerageId, status, listPrice, originalListPrice, pricePerSqft, capRate, noi, listDate, opportunityScore, isDemo } = parsed.data;

    const [listing] = await db.insert(terraListingsTable).values({
      propertyId,
      agentId,
      brokerageId,
      status,
      listPrice,
      originalListPrice,
      pricePerSqft,
      capRate,
      noi,
      listDate,
      opportunityScore,
      isDemo,
    }).returning();

    sendSuccess(res, { listing, createdAt: new Date().toISOString() }, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create listing"); }
});

// ─── GET /terra/broker/listings/:id ───────────────────────────────────────────

router.get("/terra/broker/listings/:id", terraRateLimit, auth, async (req, res) => {
  try {
    const idN = Number(req.params.id);
    if (!Number.isInteger(idN) || idN < 1) { res.status(400).json({ error: "Invalid listing id" }); return; }

    const [row] = await db
      .select({
        id: terraListingsTable.id,
        status: terraListingsTable.status,
        listPrice: terraListingsTable.listPrice,
        originalListPrice: terraListingsTable.originalListPrice,
        pricePerSqft: terraListingsTable.pricePerSqft,
        capRate: terraListingsTable.capRate,
        noi: terraListingsTable.noi,
        daysOnMarket: terraListingsTable.daysOnMarket,
        inquiryCount: terraListingsTable.inquiryCount,
        viewCount: terraListingsTable.viewCount,
        priceReductions: terraListingsTable.priceReductions,
        opportunityScore: terraListingsTable.opportunityScore,
        listDate: terraListingsTable.listDate,
        property: {
          id: terraPropertiesTable.id,
          address: terraPropertiesTable.address,
          city: terraPropertiesTable.city,
          state: terraPropertiesTable.state,
          zipCode: terraPropertiesTable.zipCode,
          submarket: terraPropertiesTable.submarket,
          propertyType: terraPropertiesTable.propertyType,
          sqft: terraPropertiesTable.sqft,
          yearBuilt: terraPropertiesTable.yearBuilt,
          floors: terraPropertiesTable.floors,
          latitude: terraPropertiesTable.latitude,
          longitude: terraPropertiesTable.longitude,
          ownerName: terraPropertiesTable.ownerName,
          zoning: terraPropertiesTable.zoning,
        },
        agent: {
          id: terraAgentsTable.id,
          firstName: terraAgentsTable.firstName,
          lastName: terraAgentsTable.lastName,
          email: terraAgentsTable.email,
          specialty: terraAgentsTable.specialty,
        },
        brokerage: {
          name: terraBrokeragesTable.name,
          city: terraBrokeragesTable.city,
        },
      })
      .from(terraListingsTable)
      .innerJoin(terraPropertiesTable, eq(terraListingsTable.propertyId, terraPropertiesTable.id))
      .leftJoin(terraAgentsTable, eq(terraListingsTable.agentId, terraAgentsTable.id))
      .leftJoin(terraBrokeragesTable, eq(terraListingsTable.brokerageId, terraBrokeragesTable.id))
      .where(eq(terraListingsTable.id, idN))
      .limit(1);

    if (!row) { res.status(404).json({ error: "Listing not found" }); return; }

    const inquiries = await db
      .select()
      .from(terraInquiriesTable)
      .where(eq(terraInquiriesTable.listingId, idN))
      .orderBy(desc(terraInquiriesTable.qualificationScore));

    const dom = row.daysOnMarket ?? 0;
    const reductions = row.priceReductions ?? 0;
    const score = row.opportunityScore ?? 50;

    sendSuccess(res, {
      listing: {
        ...row,
        listPrice: Number(row.listPrice),
        originalListPrice: row.originalListPrice ? Number(row.originalListPrice) : null,
        pricePerSqft: row.pricePerSqft ? Number(row.pricePerSqft) : null,
        capRate: row.capRate ? Number(row.capRate) : null,
        noi: row.noi ? Number(row.noi) : null,
      },
      inquiries,
      analysis: {
        signal: dom > 90
          ? "Extended time on market — seller motivation likely increasing. Review pricing strategy."
          : dom < 30
          ? "Fresh listing with strong early activity. Maintain pricing discipline."
          : "Mid-market listing. Track inquiry conversion closely.",
        action: reductions > 0
          ? `${reductions} price reduction(s) on record. Consider market comp refresh before further reductions.`
          : "No price reductions. Holding price signal is strong.",
        riskFlag: score < 50
          ? "Low opportunity score — review agent engagement and inquiry routing."
          : null,
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch listing detail"); }
});

// ─── PATCH /terra/broker/listings/:id ─────────────────────────────────────────

router.patch("/terra/broker/listings/:id", terraRateLimit, auth, async (req, res) => {
  try {
    const idN = Number(req.params.id);
    if (!Number.isInteger(idN) || idN < 1) { res.status(400).json({ error: "Invalid listing id" }); return; }

    const parsed = ListingPatchSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid update data", issues: parsed.error.issues }); return; }
    if (Object.keys(parsed.data).length === 0) { res.status(400).json({ error: "No update fields provided" }); return; }

    const [updated] = await db
      .update(terraListingsTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(terraListingsTable.id, idN))
      .returning();

    if (!updated) { res.status(404).json({ error: "Listing not found" }); return; }
    sendSuccess(res, { listing: updated, updatedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to update listing"); }
});

// ─── DELETE /terra/broker/listings/:id ────────────────────────────────────────

router.delete("/terra/broker/listings/:id", terraRateLimit, auth, async (req, res) => {
  try {
    const idN = Number(req.params.id);
    if (!Number.isInteger(idN) || idN < 1) { res.status(400).json({ error: "Invalid listing id" }); return; }

    const [deleted] = await db
      .delete(terraListingsTable)
      .where(eq(terraListingsTable.id, idN))
      .returning({ id: terraListingsTable.id });

    if (!deleted) { res.status(404).json({ error: "Listing not found" }); return; }
    sendSuccess(res, { deleted: { id: deleted.id }, deletedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to delete listing"); }
});

// ─── GET /terra/broker/inquiries ──────────────────────────────────────────────

const InquiriesQuerySchema = z.object({
  status: z.enum(INQUIRY_STATUSES).optional(),
  listingId: z.coerce.number().int().positive().optional(),
  agentId: z.coerce.number().int().positive().optional(),
  sort: z.enum(["score_desc", "recent"]).optional(),
});

router.get("/terra/broker/inquiries", terraRateLimit, auth, async (req, res) => {
  try {
    const parsed = InquiriesQuerySchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: "Invalid query parameters", issues: parsed.error.issues }); return; }

    const { status, listingId, agentId, sort } = parsed.data;
    const conditions: ReturnType<typeof and>[] = [];
    if (status) conditions.push(eq(terraInquiriesTable.status, status));
    if (listingId) conditions.push(eq(terraInquiriesTable.listingId, listingId));
    if (agentId) conditions.push(eq(terraInquiriesTable.assignedAgentId, agentId));

    const orderCol = sort === "recent"
      ? desc(terraInquiriesTable.createdAt)
      : desc(terraInquiriesTable.qualificationScore);

    const inquiries = await db
      .select({
        id: terraInquiriesTable.id,
        listingId: terraInquiriesTable.listingId,
        buyerName: terraInquiriesTable.buyerName,
        buyerEmail: terraInquiriesTable.buyerEmail,
        buyerType: terraInquiriesTable.buyerType,
        financingStatus: terraInquiriesTable.financingStatus,
        qualificationScore: terraInquiriesTable.qualificationScore,
        status: terraInquiriesTable.status,
        source: terraInquiriesTable.source,
        message: terraInquiriesTable.message,
        routingReason: terraInquiriesTable.routingReason,
        assignedAgentId: terraInquiriesTable.assignedAgentId,
        agentFirst: terraAgentsTable.firstName,
        agentLast: terraAgentsTable.lastName,
        propertyAddress: terraPropertiesTable.address,
        propertyCity: terraPropertiesTable.city,
        createdAt: terraInquiriesTable.createdAt,
      })
      .from(terraInquiriesTable)
      .leftJoin(terraAgentsTable, eq(terraInquiriesTable.assignedAgentId, terraAgentsTable.id))
      .leftJoin(terraListingsTable, eq(terraInquiriesTable.listingId, terraListingsTable.id))
      .leftJoin(terraPropertiesTable, eq(terraListingsTable.propertyId, terraPropertiesTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderCol);

    sendSuccess(res, {
      source: "Terra Inquiry Routing Engine",
      total: inquiries.length,
      inquiries: inquiries.map(i => ({
        ...i,
        assignedAgent: i.agentFirst ? `${i.agentLast}, ${i.agentFirst.charAt(0)}.` : null,
        propertyAddress: i.propertyAddress && i.propertyCity ? `${i.propertyAddress}, ${i.propertyCity}` : null,
      })),
      routingRules: [
        { rule: "cash-buyer-priority", description: "Cash buyers automatically scored +15 and escalated", active: true },
        { rule: "qualification-threshold", description: "Score < 60 held for manual review before agent assignment", active: true },
        { rule: "specialty-match", description: "Inquiries matched to agents by property type specialty", active: true },
        { rule: "workload-balance", description: "Routing respects agent active inquiry cap of 20", active: true },
      ],
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch inquiries"); }
});

// ─── POST /terra/broker/inquiries ─────────────────────────────────────────────

const InquiryCreateSchema = z.object({
  listingId: z.number().int().positive(),
  assignedAgentId: z.number().int().positive().optional(),
  buyerName: z.string().min(1),
  buyerEmail: z.string().email().optional(),
  buyerType: z.enum(INQUIRY_BUYER_TYPES).default("unknown"),
  financingStatus: z.enum(INQUIRY_FINANCING).default("unknown"),
  qualificationScore: z.number().int().min(0).max(100).default(50),
  status: z.enum(INQUIRY_STATUSES).default("new"),
  source: z.enum(INQUIRY_SOURCES).default("web"),
  message: z.string().optional(),
  routingReason: z.string().optional(),
  isDemo: z.boolean().default(false),
});

router.post("/terra/broker/inquiries", terraRateLimit, auth, async (req, res) => {
  try {
    const parsed = InquiryCreateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid inquiry data", issues: parsed.error.issues }); return; }

    const [inquiry] = await db.insert(terraInquiriesTable).values(parsed.data).returning();
    sendSuccess(res, { inquiry, createdAt: new Date().toISOString() }, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create inquiry"); }
});

// ─── PATCH /terra/broker/inquiries/:id ────────────────────────────────────────

router.patch("/terra/broker/inquiries/:id", terraRateLimit, auth, async (req, res) => {
  try {
    const idN = Number(req.params.id);
    if (!Number.isInteger(idN) || idN < 1) { res.status(400).json({ error: "Invalid inquiry id" }); return; }

    const PatchSchema = InquiryCreateSchema.partial().omit({ listingId: true, isDemo: true });
    const parsed = PatchSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid update data", issues: parsed.error.issues }); return; }
    if (Object.keys(parsed.data).length === 0) { res.status(400).json({ error: "No update fields provided" }); return; }

    const [updated] = await db
      .update(terraInquiriesTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(terraInquiriesTable.id, idN))
      .returning();

    if (!updated) { res.status(404).json({ error: "Inquiry not found" }); return; }
    sendSuccess(res, { inquiry: updated, updatedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to update inquiry"); }
});

// ─── GET /terra/broker/agents ──────────────────────────────────────────────────

const AgentsQuerySchema = z.object({
  brokerageId: z.coerce.number().int().positive().optional(),
  specialty: z.enum(AGENT_SPECIALTIES).optional(),
  sort: z.enum(["close_rate", "closed_ltm", "active_listings"]).optional(),
});

router.get("/terra/broker/agents", terraRateLimit, auth, async (req, res) => {
  try {
    const parsed = AgentsQuerySchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: "Invalid query parameters", issues: parsed.error.issues }); return; }

    const { brokerageId: brokId, specialty, sort } = parsed.data;
    const conditions: ReturnType<typeof and>[] = [];
    if (brokId) conditions.push(eq(terraAgentsTable.brokerageId, brokId));
    if (specialty) conditions.push(eq(terraAgentsTable.specialty, specialty));

    const orderCol = (() => {
      switch (sort) {
        case "close_rate": return desc(terraAgentsTable.closeRatePct);
        case "closed_ltm": return desc(terraAgentsTable.closedDealsLtm);
        case "active_listings": return desc(terraAgentsTable.activeListings);
        default: return desc(terraAgentsTable.closeRatePct);
      }
    })();

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const agents = await db
      .select({
        id: terraAgentsTable.id,
        firstName: terraAgentsTable.firstName,
        lastName: terraAgentsTable.lastName,
        email: terraAgentsTable.email,
        phone: terraAgentsTable.phone,
        specialty: terraAgentsTable.specialty,
        status: terraAgentsTable.status,
        activeListings: terraAgentsTable.activeListings,
        closedDealsLtm: terraAgentsTable.closedDealsLtm,
        closeRatePct: terraAgentsTable.closeRatePct,
        avgDaysToContract: terraAgentsTable.avgDaysToContract,
        inquiryConversionPct: terraAgentsTable.inquiryConversionPct,
        brokerageId: terraAgentsTable.brokerageId,
        brokerageName: terraBrokeragesTable.name,
      })
      .from(terraAgentsTable)
      .leftJoin(terraBrokeragesTable, eq(terraAgentsTable.brokerageId, terraBrokeragesTable.id))
      .where(whereClause)
      .orderBy(orderCol);

    const [brokAgg] = await db
      .select({
        totalActive: sql<number>`coalesce(sum(active_listings), 0)::int`,
        totalClosed: sql<number>`coalesce(sum(closed_deals_ltm), 0)::int`,
        avgClose: sql<number>`round(avg(close_rate_pct))::int`,
        avgDays: sql<number>`round(avg(avg_days_to_contract))::int`,
      })
      .from(terraAgentsTable)
      .where(whereClause);

    sendSuccess(res, {
      source: "Terra Agent Workload View",
      brokerage: {
        totalActiveListings: brokAgg?.totalActive ?? 0,
        totalClosedDealsLtm: brokAgg?.totalClosed ?? 0,
        avgCloseRatePct: brokAgg?.avgClose ?? 0,
        avgDaysToContract: brokAgg?.avgDays ?? 0,
      },
      agents: agents.map(a => ({
        ...a,
        closeRatePct: a.closeRatePct ? Number(a.closeRatePct) : null,
        inquiryConversionPct: a.inquiryConversionPct ? Number(a.inquiryConversionPct) : null,
      })),
      count: agents.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch agent workload"); }
});

// ─── GET /terra/broker/brokerage ──────────────────────────────────────────────

router.get("/terra/broker/brokerage", terraRateLimit, auth, async (req, res) => {
  try {
    const brokerages = await db
      .select()
      .from(terraBrokeragesTable)
      .where(eq(terraBrokeragesTable.status, "active"))
      .orderBy(asc(terraBrokeragesTable.name));

    const [listingAgg] = await db
      .select({
        active: sql<number>`count(*) filter (where status = 'active')::int`,
        underContract: sql<number>`count(*) filter (where status = 'under_contract')::int`,
        totalValue: sql<string>`coalesce(sum(list_price::numeric), 0)`,
        avgDom: sql<number>`round(avg(days_on_market))::int`,
      })
      .from(terraListingsTable);

    const [txAgg] = await db
      .select({
        totalVolume: sql<string>`coalesce(sum(sale_price::numeric), 0)`,
        totalCommission: sql<string>`coalesce(sum(commission::numeric), 0)`,
        count: sql<number>`count(*)::int`,
        avgDaysToClose: sql<number>`round(avg(days_to_close))::int`,
      })
      .from(terraTransactionsTable)
      .where(eq(terraTransactionsTable.status, "completed"));

    sendSuccess(res, {
      source: "Terra Brokerage Visibility Layer",
      brokerages: brokerages.map(b => ({
        ...b,
        closedVolumeLtm: b.closedVolumeLtm ? Number(b.closedVolumeLtm) : null,
      })),
      aggregate: {
        activeListings: listingAgg?.active ?? 0,
        underContractListings: listingAgg?.underContract ?? 0,
        totalActivePipelineValue: Number(listingAgg?.totalValue ?? 0),
        avgDaysOnMarket: listingAgg?.avgDom ?? 0,
        closedVolumeLtm: Number(txAgg?.totalVolume ?? 0),
        totalCommissionLtm: Number(txAgg?.totalCommission ?? 0),
        closedDealsLtm: txAgg?.count ?? 0,
        avgDaysToClose: txAgg?.avgDaysToClose ?? 0,
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch brokerage visibility"); }
});

// ─── GET /terra/broker/map ────────────────────────────────────────────────────

router.get("/terra/broker/map", terraRateLimit, auth, async (req, res) => {
  try {
    const listings = await db
      .select({
        id: terraListingsTable.id,
        status: terraListingsTable.status,
        listPrice: terraListingsTable.listPrice,
        opportunityScore: terraListingsTable.opportunityScore,
        daysOnMarket: terraListingsTable.daysOnMarket,
        inquiryCount: terraListingsTable.inquiryCount,
        address: terraPropertiesTable.address,
        city: terraPropertiesTable.city,
        state: terraPropertiesTable.state,
        submarket: terraPropertiesTable.submarket,
        propertyType: terraPropertiesTable.propertyType,
        latitude: terraPropertiesTable.latitude,
        longitude: terraPropertiesTable.longitude,
      })
      .from(terraListingsTable)
      .innerJoin(terraPropertiesTable, eq(terraListingsTable.propertyId, terraPropertiesTable.id))
      .orderBy(desc(terraListingsTable.opportunityScore));

    const submarketGroups = listings.reduce<Record<string, { listings: number; totalPrice: number; totalInquiries: number }>>(
      (acc, l) => {
        const sm = l.submarket ?? "Unknown";
        if (!acc[sm]) acc[sm] = { listings: 0, totalPrice: 0, totalInquiries: 0 };
        acc[sm].listings++;
        acc[sm].totalPrice += Number(l.listPrice);
        acc[sm].totalInquiries += l.inquiryCount ?? 0;
        return acc;
      },
      {}
    );

    const submarkets = Object.entries(submarketGroups).map(([name, data]) => ({
      name,
      listings: data.listings,
      avgPrice: Math.round(data.totalPrice / data.listings),
      totalInquiries: data.totalInquiries,
    }));

    sendSuccess(res, {
      source: "Terra Property Map Intelligence",
      listings: listings.map(l => ({
        id: l.id,
        address: `${l.address}, ${l.city}, ${l.state}`,
        submarket: l.submarket,
        type: l.propertyType,
        status: l.status,
        listPrice: Number(l.listPrice),
        opportunityScore: l.opportunityScore,
        daysOnMarket: l.daysOnMarket,
        inquiryCount: l.inquiryCount,
        latitude: l.latitude ? Number(l.latitude) : null,
        longitude: l.longitude ? Number(l.longitude) : null,
      })),
      submarkets,
      featureFlag: "terra_map_mode_enabled",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch map payload"); }
});

// ─── GET /terra/broker/transactions ──────────────────────────────────────────

const TxQuerySchema = z.object({
  agentId: z.coerce.number().int().positive().optional(),
  brokerageId: z.coerce.number().int().positive().optional(),
  status: z.enum(TX_STATUSES).optional(),
});

router.get("/terra/broker/transactions", terraRateLimit, auth, async (req, res) => {
  try {
    const parsed = TxQuerySchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: "Invalid query parameters", issues: parsed.error.issues }); return; }

    const { agentId, brokerageId: brokId, status } = parsed.data;
    const conditions: ReturnType<typeof and>[] = [];
    if (agentId) conditions.push(eq(terraTransactionsTable.agentId, agentId));
    if (brokId) conditions.push(eq(terraTransactionsTable.brokerageId, brokId));
    if (status) conditions.push(eq(terraTransactionsTable.status, status));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const transactions = await db
      .select({
        id: terraTransactionsTable.id,
        salePrice: terraTransactionsTable.salePrice,
        listPrice: terraTransactionsTable.listPrice,
        commission: terraTransactionsTable.commission,
        commissionPct: terraTransactionsTable.commissionPct,
        daysOnMarket: terraTransactionsTable.daysOnMarket,
        daysToClose: terraTransactionsTable.daysToClose,
        closedDate: terraTransactionsTable.closedDate,
        buyerName: terraTransactionsTable.buyerName,
        sellerName: terraTransactionsTable.sellerName,
        financingType: terraTransactionsTable.financingType,
        status: terraTransactionsTable.status,
        propertyAddress: terraPropertiesTable.address,
        propertyCity: terraPropertiesTable.city,
        propertyType: terraPropertiesTable.propertyType,
        agentFirst: terraAgentsTable.firstName,
        agentLast: terraAgentsTable.lastName,
      })
      .from(terraTransactionsTable)
      .leftJoin(terraPropertiesTable, eq(terraTransactionsTable.propertyId, terraPropertiesTable.id))
      .leftJoin(terraAgentsTable, eq(terraTransactionsTable.agentId, terraAgentsTable.id))
      .where(whereClause)
      .orderBy(desc(terraTransactionsTable.closedDate));

    const [agg] = await db
      .select({
        totalVolume: sql<string>`coalesce(sum(sale_price::numeric), 0)`,
        totalCommission: sql<string>`coalesce(sum(commission::numeric), 0)`,
        avgSaleToPriceRatio: sql<string>`avg(sale_price::numeric / nullif(list_price::numeric, 0))`,
        avgDaysToClose: sql<number>`round(avg(days_to_close))::int`,
      })
      .from(terraTransactionsTable)
      .where(whereClause);

    sendSuccess(res, {
      source: "Terra Transaction Log",
      count: transactions.length,
      transactions: transactions.map(t => ({
        ...t,
        salePrice: Number(t.salePrice),
        listPrice: Number(t.listPrice),
        commission: t.commission ? Number(t.commission) : null,
        commissionPct: t.commissionPct ? Number(t.commissionPct) : null,
        address: t.propertyAddress && t.propertyCity ? `${t.propertyAddress}, ${t.propertyCity}` : null,
        type: t.propertyType,
        agent: t.agentFirst ? `${t.agentLast}, ${t.agentFirst.charAt(0)}.` : null,
      })),
      aggregate: {
        totalVolume: Number(agg?.totalVolume ?? 0),
        totalCommission: Number(agg?.totalCommission ?? 0),
        avgSaleToPriceRatio: agg?.avgSaleToPriceRatio ? Number(agg.avgSaleToPriceRatio) : null,
        avgDaysToClose: agg?.avgDaysToClose ?? 0,
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch transactions"); }
});

// ─── GET /terra/broker/search ─────────────────────────────────────────────────

const SearchSchema = z.object({
  q: z.string().optional(),
  type: z.enum(PROPERTY_TYPES).optional(),
  status: z.enum(LISTING_STATUSES).optional(),
  submarket: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  maxDom: z.coerce.number().int().min(0).optional(),
});

router.get("/terra/broker/search", terraRateLimit, auth, async (req, res) => {
  try {
    const parsed = SearchSchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: "Invalid search parameters", issues: parsed.error.issues }); return; }

    const { q, type, status, submarket, minPrice, maxPrice, minScore, maxDom } = parsed.data;

    const conditions: ReturnType<typeof and>[] = [];
    if (q) {
      const q_ = `%${q}%`;
      conditions.push(or(
        ilike(terraPropertiesTable.address, q_),
        ilike(terraPropertiesTable.submarket, q_),
        ilike(terraPropertiesTable.city, q_),
      )!);
    }
    if (type) conditions.push(eq(terraPropertiesTable.propertyType, type));
    if (status) conditions.push(eq(terraListingsTable.status, status));
    if (submarket) conditions.push(ilike(terraPropertiesTable.submarket, `%${submarket}%`));
    if (minPrice !== undefined) conditions.push(gte(sql`${terraListingsTable.listPrice}::numeric`, sql`${minPrice}`));
    if (maxPrice !== undefined) conditions.push(lte(sql`${terraListingsTable.listPrice}::numeric`, sql`${maxPrice}`));
    if (minScore !== undefined) conditions.push(gte(terraListingsTable.opportunityScore, minScore));
    if (maxDom !== undefined) conditions.push(lte(terraListingsTable.daysOnMarket, maxDom));

    const results = await db
      .select({
        id: terraListingsTable.id,
        address: terraPropertiesTable.address,
        city: terraPropertiesTable.city,
        state: terraPropertiesTable.state,
        submarket: terraPropertiesTable.submarket,
        propertyType: terraPropertiesTable.propertyType,
        sqft: terraPropertiesTable.sqft,
        status: terraListingsTable.status,
        listPrice: terraListingsTable.listPrice,
        pricePerSqft: terraListingsTable.pricePerSqft,
        opportunityScore: terraListingsTable.opportunityScore,
        daysOnMarket: terraListingsTable.daysOnMarket,
        inquiryCount: terraListingsTable.inquiryCount,
      })
      .from(terraListingsTable)
      .innerJoin(terraPropertiesTable, eq(terraListingsTable.propertyId, terraPropertiesTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(terraListingsTable.opportunityScore))
      .limit(100);

    sendSuccess(res, {
      source: "Terra Filter & Search",
      query: req.query,
      count: results.length,
      listings: results.map(r => ({
        ...r,
        listPrice: Number(r.listPrice),
        pricePerSqft: r.pricePerSqft ? Number(r.pricePerSqft) : null,
        address: `${r.address}, ${r.city}, ${r.state}`,
      })),
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to execute search"); }
});

export default router;
