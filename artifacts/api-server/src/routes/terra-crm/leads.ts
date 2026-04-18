import type { IRouter } from "express";
import {
  db, terraLeadsTable, terraDealsTable, terraDistressPropertiesTable,
  eq, and, desc, ilike, or, sql,
  sendSuccess, sendBadRequest, handleRouteError, authMiddleware,
  CreateLeadSchema, UpdateLeadSchema, auditLog, nowStr,
} from "./_shared.js";
import type { InsertTerraLead } from "@szl-holdings/db";
import { validateBody, jsonObjectBodySchema, validateQuery, listQuerySchema} from "../../lib/validation";

export function register(router: IRouter): void {
  router.get("/terra/crm/leads", authMiddleware({ required: false }), validateQuery(listQuerySchema), async (req, res) => {
    try {
      const { stage, source, q, limit, offset } = req.query;
      const str = (v: unknown) => typeof v === "string" ? v : undefined;

      const conditions = [eq(terraLeadsTable.isActive, true)];
      if (stage) conditions.push(eq(terraLeadsTable.stage, stage as any));
      if (source) conditions.push(eq(terraLeadsTable.source, source as any));
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
        fetchedAt: new Date().toISOString(),
        dataMode: rows.length > 0 ? "live" : "empty",
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
      const { id } = req.params as Record<string, string>;
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

      let linkedDealValid = false;
      if (r.linkedDealId) {
        const dealCheck = await db.select({ id: terraDealsTable.id }).from(terraDealsTable)
          .where(and(eq(terraDealsTable.id, r.linkedDealId), eq(terraDealsTable.isActive, true)))
          .limit(1);
        linkedDealValid = dealCheck.length > 0;
      }

      let distressPropertyValid = false;
      if (r.distressPropertyId) {
        const propCheck = await db.select({ id: terraDistressPropertiesTable.id }).from(terraDistressPropertiesTable)
          .where(eq(terraDistressPropertiesTable.id, r.distressPropertyId))
          .limit(1);
        distressPropertyValid = propCheck.length > 0;
      }

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
        linkIntegrity: {
          linkedDealValid: r.linkedDealId ? linkedDealValid : null,
          distressPropertyValid: r.distressPropertyId ? distressPropertyValid : null,
        },
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

  router.post("/terra/crm/leads", authMiddleware({ required: true }), validateBody(jsonObjectBodySchema), async (req, res) => {
    try {
      const parsed = CreateLeadSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        sendBadRequest(res, parsed.error.errors.map(e => e.message).join(", "));
        return;
      }
      const body = parsed.data;

      const externalId = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const lead: InsertTerraLead = {
        externalId,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email ?? null,
        phone: body.phone ?? null,
        type: (body.type ?? "buyer") as any,
        source: (body.source ?? "manual") as any,
        stage: (body.stage ?? "new") as any,
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

      const inserted = await db.insert(terraLeadsTable).values(lead as any).returning();
      await auditLog("lead_created", "terra_lead", externalId, { source: lead.source, stage: lead.stage }, req.user?.id);

      sendSuccess(res, { id: externalId, lead: inserted[0] });
    } catch (err) { handleRouteError(res, err, "Failed to create lead"); }
  });

  router.patch("/terra/crm/leads/:id", authMiddleware({ required: true }), validateBody(jsonObjectBodySchema), async (req, res) => {
    try {
      const { id } = req.params as Record<string, string>;
      const parsed = UpdateLeadSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        sendBadRequest(res, parsed.error.errors.map(e => e.message).join(", "));
        return;
      }
      const body = parsed.data;

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
      const nowDate = new Date().toISOString().slice(0, 10);

      const updates: Partial<typeof terraLeadsTable.$inferSelect> = { updatedAt: new Date() };
      if (body.stage) updates.stage = body.stage as any;
      if (body.score !== undefined) updates.score = body.score;
      if (body.nextFollowUp !== undefined) updates.nextFollowUp = body.nextFollowUp;
      if (body.nextAction !== undefined) updates.nextAction = body.nextAction;
      if (body.notes !== undefined) updates.notes = body.notes;
      if (body.lastContact !== undefined) updates.lastContact = body.lastContact;

      if (body.addNote || body.timelineEvent) {
        const event = body.addNote ?? body.timelineEvent;
        const prevTimeline = (lead.timeline as any[]) ?? [];
        updates.timeline = [...prevTimeline, { date: nowDate, event, type: body.timelineType ?? "note" }] as any;
      }

      await db.update(terraLeadsTable).set(updates).where(eq(terraLeadsTable.id, lead.id));

      sendSuccess(res, { leadId: lead.externalId ?? String(lead.id), updated: Object.keys(updates) });
    } catch (err) { handleRouteError(res, err, "Failed to update lead"); }
  });
}
