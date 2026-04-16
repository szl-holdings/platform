import type { IRouter } from "express";
import {
  db, terraLeadsTable, terraDealsTable, terraDistressPropertiesTable,
  eq,
  sendSuccess, sendBadRequest, handleRouteError, authMiddleware,
  ConvertDistressToLeadSchema, ConvertLeadToDealSchema, auditLog, nowStr,
} from "./_shared.js";
import type { InsertTerraLead, InsertTerraDeal } from "@szl-holdings/db";

export function register(router: IRouter): void {
  router.post("/terra/convert/distress-to-lead", authMiddleware({ required: true }), async (req, res) => {
    try {
      const parsed = ConvertDistressToLeadSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        sendBadRequest(res, parsed.error.errors.map(e => e.message).join(", "));
        return;
      }
      const { propertyId, ownerName, ownerUserId, notes } = parsed.data;

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

      const inserted = await db.insert(terraLeadsTable).values(lead as any).returning();
      const leadRow = inserted[0]!;

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

  router.post("/terra/convert/lead-to-deal", authMiddleware({ required: true }), async (req, res) => {
    try {
      const parsed = ConvertLeadToDealSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        sendBadRequest(res, parsed.error.errors.map(e => e.message).join(", "));
        return;
      }
      const { leadId, price, ownerName, ownerUserId, notes } = parsed.data;

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
        ownerUserId: ownerUserId ?? null,
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
}
