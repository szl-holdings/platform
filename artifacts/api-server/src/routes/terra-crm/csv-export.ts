import type { IRouter } from "express";
import {
  db, terraDistressPropertiesTable,
  eq, and, sql, ilike, or,
  handleRouteError, authMiddleware,
} from "./_shared.js";

export function register(router: IRouter): void {
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
}
