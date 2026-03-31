import { Router, type IRouter } from "express";
import { sendSuccess, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { db, pool } from "@workspace/db";
import {
  terraLeadsTable,
  terraDealsTable,
  terraSavedOpportunitiesTable,
  terraDistressPropertiesTable,
  auditLogsTable,
  type InsertTerraLead,
  type InsertTerraDeal,
} from "@workspace/db";
import { eq, and, desc, ilike, or, sql } from "drizzle-orm";
import { scoreDistressProperty } from "../lib/terra-ai-scoring";

const router: IRouter = Router();

async function auditLog(
  actionType: string,
  entityType: string,
  entityId?: string,
  payload?: Record<string, unknown>,
  actorUserId?: number
) {
  try {
    await db.insert(auditLogsTable).values({
      actionType,
      entityType,
      entityId,
      payloadJson: payload ?? {},
      actorUserId,
    });
  } catch {
    /* non-fatal */
  }
}

function nowStr() {
  return new Date().toISOString().slice(0, 10);
}

// ─── LEADS ────────────────────────────────────────────────────────────────────

router.get("/terra/crm/leads", authMiddleware({ required: false }), async (req, res) => {
  try {
    const { stage, source, q, limit, offset } = req.query;
    const str = (v: unknown) => typeof v === "string" ? v : undefined;

    const conditions = [eq(terraLeadsTable.isActive, true)];
    if (stage) conditions.push(eq(terraLeadsTable.stage, stage as string));
    if (source) conditions.push(eq(terraLeadsTable.source, source as string));
    if (q) {
      const qStr = str(q)!;
      conditions.push(
        or(
          ilike(terraLeadsTable.firstName, `%${qStr}%`),
          ilike(terraLeadsTable.lastName, `%${qStr}%`),
          ilike(terraLeadsTable.email, `%${qStr}%`)
        )!
      );
    }

    const lim = Math.min(Number(limit ?? 100), 500);
    const off = Number(offset ?? 0);

    const rows = await db
      .select()
      .from(terraLeadsTable)
      .where(and(...conditions))
      .orderBy(desc(terraLeadsTable.score))
      .limit(lim)
      .offset(off);

    sendSuccess(res, {
      count: rows.length,
      leads: rows.map(r => ({
        id: r.externalId ?? String(r.id),
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.email,
        phone: r.phone,
        type: r.type,
        source: r.source,
        stage: r.stage,
        score: r.score,
        conversionProbability: Number(r.conversionProbability),
        ownerName: r.ownerName,
        lastContact: r.lastContact,
        nextFollowUp: r.nextFollowUp,
        nextAction: r.nextAction,
        distressPropertyId: r.distressPropertyExternalId ?? (r.distressPropertyId ? String(r.distressPropertyId) : null),
        linkedDealId: r.linkedDealId ? String(r.linkedDealId) : null,
        tags: r.tags ?? [],
        notes: r.notes,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch leads"); }
});

router.get("/terra/crm/leads/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const { id } = req.params;
    let rows = await db.select().from(terraLeadsTable)
      .where(and(eq(terraLeadsTable.externalId, id), eq(terraLeadsTable.isActive, true)))
      .limit(1);

    if (rows.length === 0) {
      const numId = parseInt(id, 10);
      if (!isNaN(numId)) {
        rows = await db.select().from(terraLeadsTable)
          .where(and(eq(terraLeadsTable.id, numId), eq(terraLeadsTable.isActive, true)))
          .limit(1);
      }
    }

    if (rows.length === 0) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    const r = rows[0]!;
    sendSuccess(res, {
      id: r.externalId ?? String(r.id),
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      phone: r.phone,
      type: r.type,
      source: r.source,
      stage: r.stage,
      score: r.score,
      conversionProbability: Number(r.conversionProbability),
      ownerName: r.ownerName,
      ownerUserId: r.ownerUserId,
      assignedDate: r.assignedDate,
      lastContact: r.lastContact,
      nextFollowUp: r.nextFollowUp,
      nextAction: r.nextAction,
      distressPropertyId: r.distressPropertyExternalId ?? (r.distressPropertyId ? String(r.distressPropertyId) : null),
      linkedDealId: r.linkedDealId ? String(r.linkedDealId) : null,
      budget: r.budget,
      desiredAreas: r.desiredAreas ?? [],
      notes: r.notes,
      tags: r.tags ?? [],
      timeline: r.timeline ?? [],
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch lead"); }
});

router.post("/terra/crm/leads", authMiddleware({ required: false }), async (req, res) => {
  try {
    const body = req.body ?? {};
    if (!body.firstName || !body.lastName) {
      sendBadRequest(res, "firstName and lastName are required");
      return;
    }

    const externalId = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const lead: InsertTerraLead = {
      externalId,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email ?? null,
      phone: body.phone ?? null,
      type: body.type ?? "buyer",
      source: body.source ?? "manual",
      stage: body.stage ?? "new",
      score: body.score ?? 50,
      conversionProbability: String(body.conversionProbability ?? "0.5"),
      ownerName: body.ownerName ?? null,
      ownerUserId: body.ownerUserId ?? null,
      assignedDate: nowStr(),
      lastContact: nowStr(),
      nextFollowUp: body.nextFollowUp ?? null,
      distressPropertyId: body.distressPropertyId ? Number(body.distressPropertyId) : null,
      distressPropertyExternalId: body.distressPropertyExternalId ?? null,
      notes: body.notes ?? null,
      tags: body.tags ?? [],
      timeline: [{ date: nowStr(), event: "Lead created", type: "created" }],
      nextAction: body.nextAction ?? "Initial outreach",
      isActive: true,
    };

    const inserted = await db.insert(terraLeadsTable).values(lead).returning();
    await auditLog("lead_created", "terra_lead", externalId, { source: lead.source, stage: lead.stage }, req.user?.id);

    sendSuccess(res, { id: externalId, lead: inserted[0] });
  } catch (err) { handleRouteError(res, err, "Failed to create lead"); }
});

// ─── DEALS ────────────────────────────────────────────────────────────────────

router.get("/terra/pipeline/deals", authMiddleware({ required: false }), async (req, res) => {
  try {
    const { stage, q, limit, offset } = req.query;

    const conditions = [eq(terraDealsTable.isActive, true)];
    if (stage) conditions.push(eq(terraDealsTable.stage, stage as string));
    if (q) {
      const qStr = String(q);
      conditions.push(
        or(
          ilike(terraDealsTable.address, `%${qStr}%`),
          ilike(terraDealsTable.clientName, `%${qStr}%`)
        )!
      );
    }

    const lim = Math.min(Number(limit ?? 100), 500);
    const off = Number(offset ?? 0);

    const rows = await db
      .select()
      .from(terraDealsTable)
      .where(and(...conditions))
      .orderBy(desc(terraDealsTable.createdAt))
      .limit(lim)
      .offset(off);

    sendSuccess(res, {
      count: rows.length,
      deals: rows.map(r => ({
        id: r.externalId ?? String(r.id),
        address: r.address,
        borough: r.borough,
        county: r.county,
        zipCode: r.zipCode,
        stage: r.stage,
        type: r.type,
        price: r.price ? Number(r.price) : null,
        askingPrice: r.askingPrice ? Number(r.askingPrice) : null,
        arv: r.arv ? Number(r.arv) : null,
        probability: r.probability,
        riskLevel: r.riskLevel,
        ownerName: r.ownerName,
        clientName: r.clientName,
        distressPropertyId: r.distressPropertyExternalId ?? (r.distressPropertyId ? String(r.distressPropertyId) : null),
        leadId: r.leadId ? String(r.leadId) : null,
        estimatedCloseDate: r.estimatedCloseDate,
        nextAction: r.nextAction,
        stageEnteredAt: r.stageEnteredAt,
        daysInStage: Math.ceil((Date.now() - new Date(r.stageEnteredAt).getTime()) / 86400000),
        createdAt: r.createdAt,
      })),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch deals"); }
});

router.post("/terra/pipeline/deals", authMiddleware({ required: false }), async (req, res) => {
  try {
    const body = req.body ?? {};
    if (!body.address) {
      sendBadRequest(res, "address is required");
      return;
    }

    const externalId = `deal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const deal: InsertTerraDeal = {
      externalId,
      address: body.address,
      borough: body.borough ?? null,
      county: body.county ?? null,
      zipCode: body.zipCode ?? null,
      stage: body.stage ?? "lead",
      type: body.type ?? "acquisition",
      price: body.price ? String(body.price) : null,
      askingPrice: body.askingPrice ? String(body.askingPrice) : null,
      arv: body.arv ? String(body.arv) : null,
      probability: body.probability ?? 25,
      riskLevel: body.riskLevel ?? "medium",
      ownerName: body.ownerName ?? null,
      ownerUserId: body.ownerUserId ?? null,
      clientName: body.clientName ?? null,
      distressPropertyId: body.distressPropertyId ? Number(body.distressPropertyId) : null,
      distressPropertyExternalId: body.distressPropertyExternalId ?? null,
      leadId: body.leadId ? Number(body.leadId) : null,
      estimatedCloseDate: body.estimatedCloseDate ?? null,
      nextAction: body.nextAction ?? "Initial review",
      notes: body.notes ?? null,
      timeline: [{ date: nowStr(), event: "Deal created", type: "created" }],
      isActive: true,
    };

    const inserted = await db.insert(terraDealsTable).values(deal).returning();
    await auditLog("deal_created", "terra_deal", externalId, { stage: deal.stage, address: deal.address }, req.user?.id);

    sendSuccess(res, { id: externalId, deal: inserted[0] });
  } catch (err) { handleRouteError(res, err, "Failed to create deal"); }
});

// ─── CONVERSION FLOWS ─────────────────────────────────────────────────────────

router.post("/terra/convert/distress-to-lead", authMiddleware({ required: false }), async (req, res) => {
  try {
    const body = req.body ?? {};
    const { propertyId, ownerName, ownerUserId, notes } = body;
    if (!propertyId) {
      sendBadRequest(res, "propertyId is required");
      return;
    }

    // Find the property
    let propRows = await db.select().from(terraDistressPropertiesTable)
      .where(eq(terraDistressPropertiesTable.externalId, String(propertyId)))
      .limit(1);

    if (propRows.length === 0) {
      const numId = parseInt(String(propertyId), 10);
      if (!isNaN(numId)) {
        propRows = await db.select().from(terraDistressPropertiesTable)
          .where(eq(terraDistressPropertiesTable.id, numId))
          .limit(1);
      }
    }

    if (propRows.length === 0) {
      res.status(404).json({ error: "Distress property not found" });
      return;
    }

    const prop = propRows[0]!;
    const nameParts = prop.ownerName.split(" ");
    const firstName = nameParts[0] ?? prop.ownerName;
    const lastName = nameParts.slice(1).join(" ") || "—";

    const externalId = `lead-distress-${prop.id}-${Date.now()}`;
    const lead: InsertTerraLead = {
      externalId,
      firstName,
      lastName,
      type: "seller",
      source: "distress-engine",
      stage: "new",
      score: prop.opportunityScore,
      conversionProbability: prop.opportunityScore >= 80 ? "0.75" : prop.opportunityScore >= 60 ? "0.50" : "0.25",
      ownerName: ownerName ?? null,
      ownerUserId: ownerUserId ?? null,
      assignedDate: nowStr(),
      lastContact: nowStr(),
      distressPropertyId: prop.id,
      distressPropertyExternalId: prop.externalId ?? String(prop.id),
      notes: notes ?? `Converted from distress engine — ${prop.distressType} at ${prop.address}`,
      tags: [prop.distressType, prop.borough, "distress-converted"],
      timeline: [{ date: nowStr(), event: "Converted from Distress Engine", type: "conversion" }],
      nextAction: `Outreach to ${prop.ownerName} — ${prop.distressType}`,
      isActive: true,
    };

    const inserted = await db.insert(terraLeadsTable).values(lead).returning();
    const leadRow = inserted[0]!;

    // Mark property as linked
    await db.update(terraDistressPropertiesTable)
      .set({ linkedDealId: String(leadRow.id), updatedAt: new Date() })
      .where(eq(terraDistressPropertiesTable.id, prop.id));

    await auditLog("distress_converted_to_lead", "terra_lead", externalId, {
      propertyId: prop.externalId ?? String(prop.id),
      address: prop.address,
      distressType: prop.distressType,
    }, req.user?.id);

    sendSuccess(res, {
      leadId: externalId,
      lead: leadRow,
      property: { id: prop.externalId ?? String(prop.id), address: prop.address },
      workflowRun: { trigger: "distress-to-lead", status: "enqueued", leadId: externalId },
    });
  } catch (err) { handleRouteError(res, err, "Failed to convert distress property to lead"); }
});

router.post("/terra/convert/lead-to-deal", authMiddleware({ required: false }), async (req, res) => {
  try {
    const body = req.body ?? {};
    const { leadId, price, ownerName, notes } = body;
    if (!leadId) {
      sendBadRequest(res, "leadId is required");
      return;
    }

    let leadRows = await db.select().from(terraLeadsTable)
      .where(eq(terraLeadsTable.externalId, String(leadId)))
      .limit(1);

    if (leadRows.length === 0) {
      const numId = parseInt(String(leadId), 10);
      if (!isNaN(numId)) {
        leadRows = await db.select().from(terraLeadsTable)
          .where(eq(terraLeadsTable.id, numId))
          .limit(1);
      }
    }

    if (leadRows.length === 0) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    const lead = leadRows[0]!;

    // Get property address if linked
    let address = `Lead ${lead.firstName} ${lead.lastName}`;
    let borough: string | null = null;
    let county: string | null = null;
    let zipCode: string | null = null;

    if (lead.distressPropertyId) {
      const propRows = await db.select().from(terraDistressPropertiesTable)
        .where(eq(terraDistressPropertiesTable.id, lead.distressPropertyId))
        .limit(1);
      if (propRows.length > 0) {
        const p = propRows[0]!;
        address = p.address;
        borough = p.borough;
        county = p.county;
        zipCode = p.zipCode ?? null;
      }
    }

    const externalId = `deal-lead-${lead.id}-${Date.now()}`;
    const deal: InsertTerraDeal = {
      externalId,
      address,
      borough,
      county,
      zipCode,
      stage: "qualified",
      type: "acquisition",
      price: price ? String(price) : null,
      probability: Math.round(Number(lead.conversionProbability) * 100),
      riskLevel: "medium",
      ownerName: ownerName ?? null,
      ownerUserId: body.ownerUserId ?? null,
      clientName: `${lead.firstName} ${lead.lastName}`,
      distressPropertyId: lead.distressPropertyId,
      distressPropertyExternalId: lead.distressPropertyExternalId,
      leadId: lead.id,
      nextAction: "Schedule property showing",
      notes: notes ?? `Converted from lead — ${lead.firstName} ${lead.lastName}`,
      timeline: [{ date: nowStr(), event: "Converted from Lead", type: "conversion" }],
      isActive: true,
    };

    const inserted = await db.insert(terraDealsTable).values(deal).returning();
    const dealRow = inserted[0]!;

    // Update lead as converted
    await db.update(terraLeadsTable)
      .set({ stage: "converted", linkedDealId: dealRow.id, updatedAt: new Date() })
      .where(eq(terraLeadsTable.id, lead.id));

    await auditLog("lead_converted_to_deal", "terra_deal", externalId, {
      leadId: lead.externalId ?? String(lead.id),
      address,
    }, req.user?.id);

    sendSuccess(res, {
      dealId: externalId,
      deal: dealRow,
      lead: { id: lead.externalId ?? String(lead.id), name: `${lead.firstName} ${lead.lastName}` },
      workflowRun: { trigger: "lead-to-deal", status: "enqueued", dealId: externalId },
    });
  } catch (err) { handleRouteError(res, err, "Failed to convert lead to deal"); }
});

// ─── SAVED OPPORTUNITIES ──────────────────────────────────────────────────────

router.get("/terra/opportunities/saved", authMiddleware({ required: false }), async (req, res) => {
  try {
    const userId = req.user?.id ?? null;

    const rows = await db
      .select({
        id: terraSavedOpportunitiesTable.id,
        note: terraSavedOpportunitiesTable.note,
        savedAt: terraSavedOpportunitiesTable.savedAt,
        propertyId: terraDistressPropertiesTable.externalId,
        address: terraDistressPropertiesTable.address,
        borough: terraDistressPropertiesTable.borough,
        distressType: terraDistressPropertiesTable.distressType,
        opportunityScore: terraDistressPropertiesTable.opportunityScore,
        estimatedValue: terraDistressPropertiesTable.estimatedValue,
        stage: terraDistressPropertiesTable.stage,
      })
      .from(terraSavedOpportunitiesTable)
      .leftJoin(terraDistressPropertiesTable, eq(terraSavedOpportunitiesTable.distressPropertyId, terraDistressPropertiesTable.id))
      .where(userId ? eq(terraSavedOpportunitiesTable.userId, userId) : sql`1=1`)
      .orderBy(desc(terraSavedOpportunitiesTable.savedAt))
      .limit(200);

    sendSuccess(res, { count: rows.length, opportunities: rows });
  } catch (err) { handleRouteError(res, err, "Failed to fetch saved opportunities"); }
});

router.post("/terra/opportunities/save", authMiddleware({ required: false }), async (req, res) => {
  try {
    const body = req.body ?? {};
    const { propertyId, note } = body;
    if (!propertyId) {
      sendBadRequest(res, "propertyId is required");
      return;
    }

    let propRows = await db.select().from(terraDistressPropertiesTable)
      .where(eq(terraDistressPropertiesTable.externalId, String(propertyId)))
      .limit(1);

    if (propRows.length === 0) {
      const numId = parseInt(String(propertyId), 10);
      if (!isNaN(numId)) {
        propRows = await db.select().from(terraDistressPropertiesTable)
          .where(eq(terraDistressPropertiesTable.id, numId))
          .limit(1);
      }
    }

    if (propRows.length === 0) {
      res.status(404).json({ error: "Distress property not found" });
      return;
    }

    const prop = propRows[0]!;
    const userId = req.user?.id ?? null;

    const inserted = await db.insert(terraSavedOpportunitiesTable).values({
      userId,
      distressPropertyId: prop.id,
      note: note ?? null,
    }).returning();

    sendSuccess(res, {
      savedId: inserted[0]?.id,
      property: { id: prop.externalId ?? String(prop.id), address: prop.address },
    });
  } catch (err) { handleRouteError(res, err, "Failed to save opportunity"); }
});

// ─── AI SCORING ───────────────────────────────────────────────────────────────

router.post("/terra/distress/ai-score", authMiddleware({ required: false }), async (req, res) => {
  try {
    const body = req.body ?? {};
    const { propertyId } = body;

    if (!propertyId) {
      sendBadRequest(res, "propertyId is required");
      return;
    }

    let propRows = await db.select().from(terraDistressPropertiesTable)
      .where(eq(terraDistressPropertiesTable.externalId, String(propertyId)))
      .limit(1);

    if (propRows.length === 0) {
      const numId = parseInt(String(propertyId), 10);
      if (!isNaN(numId)) {
        propRows = await db.select().from(terraDistressPropertiesTable)
          .where(eq(terraDistressPropertiesTable.id, numId))
          .limit(1);
      }
    }

    if (propRows.length === 0) {
      res.status(404).json({ error: "Distress property not found" });
      return;
    }

    const prop = propRows[0]!;
    const result = await scoreDistressProperty(prop);

    // Update the score in the DB
    await db.update(terraDistressPropertiesTable)
      .set({
        opportunityScore: result.score,
        confidenceLevel: result.confidence,
        scoreRationale: result.reasoning,
        updatedAt: new Date(),
      })
      .where(eq(terraDistressPropertiesTable.id, prop.id));

    sendSuccess(res, {
      propertyId: prop.externalId ?? String(prop.id),
      address: prop.address,
      ...result,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to AI-score property"); }
});

// ─── BROKER OVERVIEW ──────────────────────────────────────────────────────────

router.get("/terra/broker/overview", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const [
      totalDistress,
      savedOps,
      totalLeads,
      convertedLeads,
      totalDeals,
      closedDeals,
      boroughCounts,
      scoreDistribution,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(terraDistressPropertiesTable)
        .where(eq(terraDistressPropertiesTable.isActive, true)),
      db.select({ count: sql<number>`count(*)` }).from(terraSavedOpportunitiesTable),
      db.select({ count: sql<number>`count(*)` }).from(terraLeadsTable)
        .where(eq(terraLeadsTable.isActive, true)),
      db.select({ count: sql<number>`count(*)` }).from(terraLeadsTable)
        .where(and(eq(terraLeadsTable.isActive, true), eq(terraLeadsTable.stage, "converted"))),
      db.select({ count: sql<number>`count(*)` }).from(terraDealsTable)
        .where(eq(terraDealsTable.isActive, true)),
      db.select({ count: sql<number>`count(*)` }).from(terraDealsTable)
        .where(and(eq(terraDealsTable.isActive, true), eq(terraDealsTable.stage, "closed"))),
      db.select({
        borough: terraDistressPropertiesTable.borough,
        count: sql<number>`count(*)`,
        avgScore: sql<number>`round(avg(${terraDistressPropertiesTable.opportunityScore}))`,
      })
        .from(terraDistressPropertiesTable)
        .where(eq(terraDistressPropertiesTable.isActive, true))
        .groupBy(terraDistressPropertiesTable.borough)
        .orderBy(sql`count(*) desc`),
      db.select({
        bucket: sql<string>`
          CASE
            WHEN ${terraDistressPropertiesTable.opportunityScore} >= 85 THEN '85-100'
            WHEN ${terraDistressPropertiesTable.opportunityScore} >= 70 THEN '70-84'
            WHEN ${terraDistressPropertiesTable.opportunityScore} >= 55 THEN '55-69'
            WHEN ${terraDistressPropertiesTable.opportunityScore} >= 40 THEN '40-54'
            ELSE '0-39'
          END`,
        count: sql<number>`count(*)`,
      })
        .from(terraDistressPropertiesTable)
        .where(eq(terraDistressPropertiesTable.isActive, true))
        .groupBy(sql`
          CASE
            WHEN ${terraDistressPropertiesTable.opportunityScore} >= 85 THEN '85-100'
            WHEN ${terraDistressPropertiesTable.opportunityScore} >= 70 THEN '70-84'
            WHEN ${terraDistressPropertiesTable.opportunityScore} >= 55 THEN '55-69'
            WHEN ${terraDistressPropertiesTable.opportunityScore} >= 40 THEN '40-54'
            ELSE '0-39'
          END`)
        .orderBy(sql`
          CASE
            WHEN ${terraDistressPropertiesTable.opportunityScore} >= 85 THEN '85-100'
            WHEN ${terraDistressPropertiesTable.opportunityScore} >= 70 THEN '70-84'
            WHEN ${terraDistressPropertiesTable.opportunityScore} >= 55 THEN '55-69'
            WHEN ${terraDistressPropertiesTable.opportunityScore} >= 40 THEN '40-54'
            ELSE '0-39'
          END desc`),
    ]);

    sendSuccess(res, {
      metrics: {
        totalDistressOpportunities: Number(totalDistress[0]?.count ?? 0),
        savedOpportunities: Number(savedOps[0]?.count ?? 0),
        totalLeads: Number(totalLeads[0]?.count ?? 0),
        convertedLeads: Number(convertedLeads[0]?.count ?? 0),
        leadConversionRate: totalLeads[0]?.count
          ? Math.round((Number(convertedLeads[0]?.count ?? 0) / Number(totalLeads[0].count)) * 100)
          : 0,
        totalDeals: Number(totalDeals[0]?.count ?? 0),
        closedDeals: Number(closedDeals[0]?.count ?? 0),
      },
      topBoroughs: boroughCounts.map(b => ({
        borough: b.borough,
        count: Number(b.count),
        avgScore: Number(b.avgScore),
      })),
      scoreDistribution: scoreDistribution.map(s => ({
        range: s.bucket,
        count: Number(s.count),
      })),
      generatedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch broker overview"); }
});

// ─── DISTRESS DASHBOARD ────────────────────────────────────────────────────────

router.get("/terra/distress/dashboard", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const [
      summaryResult,
      byTypeResult,
      byBoroughResult,
      byCountyResult,
      top10Result,
      scoreDistResult,
    ] = await Promise.all([
      pool.query(`
        SELECT
          count(*) as total,
          sum(estimated_value) as total_value,
          round(avg(estimated_value)) as avg_value,
          sum(case when opportunity_score >= 70 then 1 else 0 end) as high_opportunity,
          count(*) filter (where filing_date >= (current_date - interval '30 days')::text) as recent_filings
        FROM terra_distress_properties
        WHERE is_active = true
      `),
      pool.query(`
        SELECT
          distress_type,
          count(*) as count,
          round(avg(opportunity_score)) as avg_score,
          sum(estimated_value) as total_value
        FROM terra_distress_properties
        WHERE is_active = true
        GROUP BY distress_type
        ORDER BY count(*) DESC
      `),
      pool.query(`
        SELECT
          borough,
          count(*) as count,
          round(avg(opportunity_score)) as avg_score,
          sum(case when opportunity_score >= 70 then 1 else 0 end) as high_count
        FROM terra_distress_properties
        WHERE is_active = true
        GROUP BY borough
        ORDER BY count(*) DESC
      `),
      pool.query(`
        SELECT
          county,
          count(*) as count,
          round(avg(opportunity_score)) as avg_score
        FROM terra_distress_properties
        WHERE is_active = true
        GROUP BY county
        ORDER BY count(*) DESC
        LIMIT 15
      `),
      pool.query(`
        SELECT
          id, external_id, address, borough, county, zip_code,
          distress_type, stage, opportunity_score, estimated_value,
          owner_name, owner_type, days_in_distress, confidence_level,
          filing_date, auction_date
        FROM terra_distress_properties
        WHERE is_active = true
        ORDER BY opportunity_score DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT
          CASE
            WHEN opportunity_score >= 85 THEN '85-100'
            WHEN opportunity_score >= 70 THEN '70-84'
            WHEN opportunity_score >= 55 THEN '55-69'
            WHEN opportunity_score >= 40 THEN '40-54'
            ELSE '0-39'
          END as bucket,
          count(*) as count,
          round(avg(opportunity_score)) as avg_score
        FROM terra_distress_properties
        WHERE is_active = true
        GROUP BY 1
        ORDER BY min(opportunity_score) DESC
      `),
    ]);

    const s = summaryResult.rows[0];

    sendSuccess(res, {
      summary: {
        totalDistressedProperties: Number(s.total ?? 0),
        recentFilings30d: Number(s.recent_filings ?? 0),
        totalDistressValue: Number(s.total_value ?? 0),
        avgDistressValue: Math.round(Number(s.avg_value ?? 0)),
        highOpportunity: Number(s.high_opportunity ?? 0),
      },
      byDistressType: byTypeResult.rows.map((t: Record<string, unknown>) => ({
        type: t.distress_type,
        count: Number(t.count),
        avgScore: Number(t.avg_score),
        totalValue: Number(t.total_value),
      })),
      byBorough: byBoroughResult.rows.map((b: Record<string, unknown>) => ({
        borough: b.borough,
        count: Number(b.count),
        avgScore: Number(b.avg_score),
        highOpportunityCount: Number(b.high_count),
      })),
      byCounty: byCountyResult.rows.map((c: Record<string, unknown>) => ({
        county: c.county,
        count: Number(c.count),
        avgScore: Number(c.avg_score),
      })),
      top10Properties: top10Result.rows.map((p: Record<string, unknown>) => ({
        id: p.external_id ?? String(p.id),
        address: p.address,
        borough: p.borough,
        county: p.county,
        zipCode: p.zip_code,
        distressType: p.distress_type,
        stage: p.stage,
        opportunityScore: Number(p.opportunity_score),
        estimatedValue: Number(p.estimated_value),
        ownerName: p.owner_name,
        ownerType: p.owner_type,
        daysInDistress: p.days_in_distress,
        confidenceLevel: p.confidence_level,
        filingDate: p.filing_date,
        auctionDate: p.auction_date,
      })),
      scoreDistribution: scoreDistResult.rows.map((s: Record<string, unknown>) => ({
        range: s.bucket,
        count: Number(s.count),
        avgScore: Number(s.avg_score),
      })),
      generatedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch distress dashboard"); }
});

// ─── INVESTOR MODE ─────────────────────────────────────────────────────────────

router.get("/terra/investor/opportunities", authMiddleware({ required: false }), async (req, res) => {
  try {
    const { minScore, borough, type, limit, offset } = req.query;
    const str = (v: unknown) => typeof v === "string" ? v : undefined;
    const scoreThreshold = minScore ? Number(minScore) : 70;

    const conditions = [
      eq(terraDistressPropertiesTable.isActive, true),
      sql`${terraDistressPropertiesTable.opportunityScore} >= ${scoreThreshold}`,
    ];
    if (borough) conditions.push(eq(terraDistressPropertiesTable.borough, str(borough) as any));
    if (type) conditions.push(eq(terraDistressPropertiesTable.distressType, str(type) as any));

    const lim = Math.min(Number(limit ?? 100), 500);
    const off = Number(offset ?? 0);

    const [properties, totalCount, avgScore, totalValue] = await Promise.all([
      db.select()
        .from(terraDistressPropertiesTable)
        .where(and(...conditions))
        .orderBy(sql`${terraDistressPropertiesTable.opportunityScore} desc`)
        .limit(lim)
        .offset(off),
      db.select({ count: sql<number>`count(*)` })
        .from(terraDistressPropertiesTable)
        .where(and(...conditions)),
      db.select({ avg: sql<number>`round(avg(${terraDistressPropertiesTable.opportunityScore}))` })
        .from(terraDistressPropertiesTable)
        .where(and(...conditions)),
      db.select({ total: sql<number>`sum(${terraDistressPropertiesTable.estimatedValue}::numeric)` })
        .from(terraDistressPropertiesTable)
        .where(and(...conditions)),
    ]);

    sendSuccess(res, {
      summary: {
        totalCount: Number(totalCount[0]?.count ?? 0),
        avgScore: Number(avgScore[0]?.avg ?? 0),
        totalValue: Number(totalValue[0]?.total ?? 0),
      },
      properties: properties.map(p => ({
        id: p.externalId ?? String(p.id),
        address: p.address,
        borough: p.borough,
        county: p.county,
        zipCode: p.zipCode,
        propertyType: p.propertyType,
        distressType: p.distressType,
        stage: p.stage,
        opportunityScore: p.opportunityScore,
        confidenceLevel: p.confidenceLevel,
        estimatedValue: Number(p.estimatedValue),
        debtAmount: p.debtAmount ? Number(p.debtAmount) : null,
        lienAmount: p.lienAmount ? Number(p.lienAmount) : null,
        equityPercent: p.debtAmount ? Math.round(((Number(p.estimatedValue) - Number(p.debtAmount)) / Number(p.estimatedValue)) * 100) : null,
        ownerName: p.ownerName,
        ownerType: p.ownerType,
        daysInDistress: p.daysInDistress,
        auctionDate: p.auctionDate,
        filingDate: p.filingDate,
        sqft: p.sqft,
        yearBuilt: p.yearBuilt,
        scoreRationale: p.scoreRationale,
        tags: p.tags,
      })),
      criteria: { minScore: scoreThreshold, borough: str(borough) ?? "all", type: str(type) ?? "all" },
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch investor opportunities"); }
});

// ─── DEAL PIPELINE STAGE TRANSITION ───────────────────────────────────────────

router.patch("/terra/pipeline/deals/:id/stage", authMiddleware({ required: false }), async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, notes } = req.body ?? {};

    const VALID_STAGES = ["lead","qualified","showing","offer","negotiation","accepted","inspection","financing","under-contract","clear-to-close","closed","lost"];
    if (!stage || !VALID_STAGES.includes(stage)) {
      res.status(400).json({ error: `Invalid stage. Valid: ${VALID_STAGES.join(", ")}` });
      return;
    }

    let rows = await db.select().from(terraDealsTable)
      .where(eq(terraDealsTable.externalId, id))
      .limit(1);

    if (rows.length === 0) {
      const numId = parseInt(id, 10);
      if (!isNaN(numId)) {
        rows = await db.select().from(terraDealsTable)
          .where(eq(terraDealsTable.id, numId))
          .limit(1);
      }
    }

    if (rows.length === 0) {
      res.status(404).json({ error: "Deal not found" });
      return;
    }

    const deal = rows[0]!;
    const prevStage = deal.stage;
    const STAGE_ORDER = ["lead","qualified","showing","offer","negotiation","accepted","inspection","financing","under-contract","clear-to-close","closed","lost"];
    const prevIdx = STAGE_ORDER.indexOf(prevStage);
    const nextIdx = STAGE_ORDER.indexOf(stage);

    if (nextIdx < prevIdx - 1 && stage !== "lost") {
      res.status(422).json({ error: `Cannot regress from ${prevStage} to ${stage} — stage transitions must be forward`, prevStage, proposedStage: stage });
      return;
    }

    const nowStr = new Date().toISOString().slice(0, 10);
    const newTimeline = [
      ...((deal.timeline as any[]) ?? []),
      { date: nowStr, event: `Stage changed: ${prevStage} → ${stage}`, type: "stage_change", ...(notes ? { notes } : {}) },
    ];

    const probability = stage === "closed" ? 100 : stage === "lost" ? 5 :
      stage === "clear-to-close" ? 95 : stage === "under-contract" ? 85 :
      stage === "financing" ? 78 : stage === "inspection" ? 70 :
      stage === "accepted" ? 65 : stage === "negotiation" ? 55 :
      stage === "offer" ? 40 : stage === "showing" ? 30 :
      stage === "qualified" ? 20 : 10;

    await db.update(terraDealsTable)
      .set({
        stage: stage as any,
        stageEnteredAt: new Date(),
        probability,
        actualCloseDate: stage === "closed" ? nowStr : deal.actualCloseDate,
        timeline: newTimeline,
        updatedAt: new Date(),
      })
      .where(eq(terraDealsTable.id, deal.id));

    await auditLog("deal_stage_changed", "terra_deal", deal.externalId ?? String(deal.id), {
      prevStage, newStage: stage, address: deal.address,
    }, req.user?.id);

    sendSuccess(res, {
      dealId: deal.externalId ?? String(deal.id),
      prevStage,
      newStage: stage,
      probability,
      message: `Deal moved from ${prevStage} to ${stage}`,
    });
  } catch (err) { handleRouteError(res, err, "Failed to update deal stage"); }
});

// ─── LEAD UPDATE ────────────────────────────────────────────────────────────────

router.patch("/terra/crm/leads/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body ?? {};

    let rows = await db.select().from(terraLeadsTable)
      .where(eq(terraLeadsTable.externalId, id))
      .limit(1);

    if (rows.length === 0) {
      const numId = parseInt(id, 10);
      if (!isNaN(numId)) {
        rows = await db.select().from(terraLeadsTable)
          .where(eq(terraLeadsTable.id, numId))
          .limit(1);
      }
    }

    if (rows.length === 0) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    const lead = rows[0]!;
    const nowStr = new Date().toISOString().slice(0, 10);

    const updates: Partial<typeof terraLeadsTable.$inferSelect> = { updatedAt: new Date() };
    if (body.stage) updates.stage = body.stage;
    if (body.score !== undefined) updates.score = body.score;
    if (body.nextFollowUp !== undefined) updates.nextFollowUp = body.nextFollowUp;
    if (body.nextAction !== undefined) updates.nextAction = body.nextAction;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.lastContact !== undefined) updates.lastContact = body.lastContact;

    if (body.addNote || body.timelineEvent) {
      const event = body.addNote ?? body.timelineEvent;
      const prevTimeline = (lead.timeline as any[]) ?? [];
      updates.timeline = [...prevTimeline, { date: nowStr, event, type: body.timelineType ?? "note" }] as any;
    }

    await db.update(terraLeadsTable).set(updates).where(eq(terraLeadsTable.id, lead.id));

    sendSuccess(res, { leadId: lead.externalId ?? String(lead.id), updated: Object.keys(updates) });
  } catch (err) { handleRouteError(res, err, "Failed to update lead"); }
});

// ─── CSV EXPORT ─────────────────────────────────────────────────────────────────

router.get("/terra/distress/export/csv", authMiddleware({ required: false }), async (req, res) => {
  try {
    const { borough, distressType, minScore, q } = req.query;
    const str = (v: unknown) => typeof v === "string" ? v : undefined;

    const conditions = [eq(terraDistressPropertiesTable.isActive, true)];
    if (borough) conditions.push(eq(terraDistressPropertiesTable.borough, str(borough) as any));
    if (distressType) conditions.push(eq(terraDistressPropertiesTable.distressType, str(distressType) as any));
    if (minScore) conditions.push(sql`${terraDistressPropertiesTable.opportunityScore} >= ${Number(minScore)}`);
    if (q) {
      const qStr = str(q)!;
      conditions.push(
        or(
          ilike(terraDistressPropertiesTable.address, `%${qStr}%`),
          ilike(terraDistressPropertiesTable.ownerName, `%${qStr}%`)
        )!
      );
    }

    const props = await db.select()
      .from(terraDistressPropertiesTable)
      .where(and(...conditions))
      .orderBy(sql`${terraDistressPropertiesTable.opportunityScore} desc`)
      .limit(1000);

    const headers = ["ID","Address","Borough","County","Zip","Property Type","Distress Type","Stage","Est. Value","Debt Amount","Lien Amount","Opportunity Score","Confidence","Owner Name","Owner Type","Filing Date","Auction Date","Days in Distress","SQFT","Year Built","Score Rationale","Source","Tags"];
    const rows = props.map(p => [
      p.externalId ?? String(p.id),
      p.address,
      p.borough,
      p.county,
      p.zipCode ?? "",
      p.propertyType,
      p.distressType,
      p.stage,
      p.estimatedValue,
      p.debtAmount ?? "",
      p.lienAmount ?? "",
      p.opportunityScore,
      p.confidenceLevel,
      p.ownerName,
      p.ownerType,
      p.filingDate,
      p.auctionDate ?? "",
      p.daysInDistress,
      p.sqft ?? "",
      p.yearBuilt ?? "",
      (p.scoreRationale ?? "").replace(/,/g, ";"),
      p.connectorSource,
      ((p.tags as string[]) ?? []).join("|"),
    ]);

    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="terra-distress-export-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (err) { handleRouteError(res, err, "Failed to export CSV"); }
});

export default router;
