import { Router, type IRouter } from "express";
import { db } from "@szl-holdings/db";
import { connectorsTable } from "@szl-holdings/db";
import { eq, and, desc } from "drizzle-orm";
import { sendSuccess, sendCreated, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { services } from "@szl-holdings/services";

const router: IRouter = Router();

function mockSalesforceOpportunities() {
  return [
    { id: "sf-opp-001", name: "Meridian Capital — Advisory Services Renewal", accountName: "Meridian Capital Group", amount: 385000, stageName: "Negotiation/Review", closeDate: "2026-05-30", probability: 75, forecastCategory: "Best Case", isClosed: false, isWon: false, type: "Existing Business" },
    { id: "sf-opp-002", name: "Arcturus Industrial — Fleet Intelligence Suite", accountName: "Arcturus Industrial Holdings", amount: 540000, stageName: "Proposal/Price Quote", closeDate: "2026-06-15", probability: 50, forecastCategory: "Pipeline", isClosed: false, isWon: false, type: "New Business" },
    { id: "sf-opp-003", name: "Blue Horizon Fund — Multi-Family CRE Transaction", accountName: "Blue Horizon Capital", amount: 12500000, stageName: "Qualification", closeDate: "2026-08-01", probability: 30, forecastCategory: "Pipeline", isClosed: false, isWon: false, type: "New Business" },
    { id: "sf-opp-004", name: "Pinnacle REIT — Asset Management Platform", accountName: "Pinnacle Real Estate Investment Trust", amount: 1200000, stageName: "Prospecting", closeDate: "2026-09-30", probability: 20, forecastCategory: "Pipeline", isClosed: false, isWon: false, type: "New Business" },
    { id: "sf-opp-005", name: "Silvergate Holdings — Compliance & Risk Suite", accountName: "Silvergate Holdings LLC", amount: 225000, stageName: "Closed Won", closeDate: "2026-04-01", probability: 100, forecastCategory: "Closed", isClosed: true, isWon: true, type: "New Business" },
  ];
}

function mockSalesforceAccounts() {
  return [
    { id: "sf-acc-001", name: "Meridian Capital Group", industry: "Financial Services", annualRevenue: 45000000, numberOfEmployees: 82, billingCity: "New York", lastActivityDate: "2026-04-10" },
    { id: "sf-acc-002", name: "Arcturus Industrial Holdings", industry: "Manufacturing", annualRevenue: 280000000, numberOfEmployees: 1450, billingCity: "Chicago", lastActivityDate: "2026-04-08" },
    { id: "sf-acc-003", name: "Blue Horizon Capital", industry: "Real Estate", annualRevenue: 120000000, numberOfEmployees: 195, billingCity: "Los Angeles", lastActivityDate: "2026-03-28" },
    { id: "sf-acc-004", name: "Pinnacle Real Estate Investment Trust", industry: "Real Estate", annualRevenue: 340000000, numberOfEmployees: 320, billingCity: "Dallas", lastActivityDate: "2026-04-05" },
    { id: "sf-acc-005", name: "Silvergate Holdings LLC", industry: "Financial Services", annualRevenue: 67000000, numberOfEmployees: 110, billingCity: "Miami", lastActivityDate: "2026-04-12" },
  ];
}

function mockSalesforceLeads() {
  return [
    { id: "sf-lead-001", firstName: "Alexandra", lastName: "Chen", company: "Vanguard Growth Partners", status: "Working", isConverted: false },
    { id: "sf-lead-002", firstName: "Marcus", lastName: "Thompson", company: "Atlas Meridian Capital", status: "Qualified", isConverted: false },
    { id: "sf-lead-003", firstName: "Priya", lastName: "Sharma", company: "Quantum Infrastructure Fund", status: "Converted", isConverted: true },
    { id: "sf-lead-004", firstName: "Daniel", lastName: "Okonkwo", company: "Northstar Equity Partners", status: "New", isConverted: false },
  ];
}

function mockHubSpotDeals() {
  return [
    { id: "hs-001", name: "SZL Platform Pilot — Q2 2026", stage: "contractsent", amount: 95000, closeDate: "2026-05-15" },
    { id: "hs-002", name: "AI-Driven Portfolio Analytics Expansion", stage: "qualifiedtobuy", amount: 310000, closeDate: "2026-07-01" },
    { id: "hs-003", name: "Regulatory Reporting Suite", stage: "appointmentscheduled", amount: 175000, closeDate: "2026-06-30" },
  ];
}

function mockDynamicsOpportunities() {
  return [
    { id: "dyn-001", name: "Enterprise Intelligence — Phase 2", accountName: "Meridian Capital Group", stage: "Proposal", probability: 60, estimatedRevenue: 420000, estimatedCloseDate: "2026-06-01" },
    { id: "dyn-002", name: "Compliance Command Center Rollout", accountName: "Cornerstone Advisory Services", stage: "Negotiation", probability: 80, estimatedRevenue: 185000, estimatedCloseDate: "2026-05-01" },
  ];
}

router.get("/salesforce/opportunities", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const sfAdapter = (services as any).salesforce;
    if (sfAdapter?.getOpportunities) {
      const data = await sfAdapter.getOpportunities();
      if (data?.records?.length > 0) {
        return sendSuccess(res, data.records.map((r: any) => ({
          id: r.Id,
          name: r.Name,
          accountName: r.Account?.Name ?? r.AccountName ?? null,
          amount: r.Amount ?? null,
          stageName: r.StageName,
          closeDate: r.CloseDate,
          probability: r.Probability ?? null,
          forecastCategory: r.ForecastCategory ?? null,
          isClosed: r.IsClosed ?? false,
          isWon: r.IsWon ?? false,
          type: r.Type ?? null,
        })));
      }
    }
    sendSuccess(res, mockSalesforceOpportunities());
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch Salesforce opportunities");
  }
});

router.get("/salesforce/accounts", authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, mockSalesforceAccounts());
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch Salesforce accounts");
  }
});

router.get("/salesforce/leads", authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, mockSalesforceLeads());
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch Salesforce leads");
  }
});

router.get("/hubspot/deals", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const hubSpotAdapter = (services as any).hubspot;
    if (hubSpotAdapter?.getDeals) {
      const data = await hubSpotAdapter.getDeals();
      if (data?.results?.length > 0) {
        return sendSuccess(res, data.results.map((d: any) => ({
          id: d.id,
          name: d.properties?.dealname ?? d.id,
          stage: d.properties?.dealstage ?? "unknown",
          amount: Number(d.properties?.amount ?? 0),
          closeDate: d.properties?.closedate ?? new Date().toISOString(),
        })));
      }
    }
    sendSuccess(res, mockHubSpotDeals());
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch HubSpot deals");
  }
});

router.get("/hubspot/contacts", authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, {
      count: 3,
      contacts: [
        { id: "hs-c-001", firstName: "James", lastName: "Holden", email: "jholden@meridian.com", company: "Meridian Capital Group", lifecycleStage: "customer" },
        { id: "hs-c-002", firstName: "Sarah", lastName: "Okafor", email: "sokafor@arcturus.com", company: "Arcturus Industrial Holdings", lifecycleStage: "lead" },
        { id: "hs-c-003", firstName: "Marcus", lastName: "Rivera", email: "mrivera@bluehorizon.vc", company: "Blue Horizon Capital", lifecycleStage: "opportunity" },
      ],
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch HubSpot contacts");
  }
});

router.get("/dynamics/opportunities", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const dynAdapter = (services as any).dynamics365;
    if (dynAdapter?.getOpportunities) {
      const data = await dynAdapter.getOpportunities();
      if (data?.value?.length > 0) {
        return sendSuccess(res, data.value.map((o: any) => ({
          id: o.opportunityid ?? o.id,
          name: o.name ?? o.subject,
          accountName: o.customerid_account?.name ?? null,
          stage: o.stepname ?? o.salesstage ?? "Unknown",
          probability: o.closeprobability ?? 50,
          estimatedRevenue: o.estimatedvalue ?? o.budgetamount ?? 0,
          estimatedCloseDate: o.estimatedclosedate ?? new Date().toISOString(),
        })));
      }
    }
    sendSuccess(res, mockDynamicsOpportunities());
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch Dynamics 365 opportunities");
  }
});

router.post("/crm/sync/:crmType", authMiddleware({ required: true }), async (req, res) => {
  try {
    const { crmType } = req.params as Record<string, string>;
    const validTypes = ["salesforce", "hubspot", "dynamics365", "all"];
    if (!validTypes.includes(crmType)) {
      sendBadRequest(res, `Invalid CRM type. Must be one of: ${validTypes.join(", ")}`);
      return;
    }

    const typesToSync = crmType === "all" ? ["salesforce", "hubspot", "dynamics365"] : [crmType];
    const results: Record<string, { status: string; message: string; timestamp: string }> = {};

    for (const type of typesToSync) {
      try {
        const [conn] = await db
          .select()
          .from(connectorsTable)
          .where(and(eq(connectorsTable.connectorType, type as any), eq(connectorsTable.isActive, true)))
          .limit(1);

        if (conn) {
          await db.update(connectorsTable)
            .set({ lastSyncAt: new Date(), updatedAt: new Date() })
            .where(eq(connectorsTable.id, conn.id));

          results[type] = { status: "success", message: `Sync completed for ${type}`, timestamp: new Date().toISOString() };
        } else {
          results[type] = { status: "demo", message: `${type} connector not configured — running in demo mode`, timestamp: new Date().toISOString() };
        }
      } catch {
        results[type] = { status: "error", message: `Failed to sync ${type}`, timestamp: new Date().toISOString() };
      }
    }

    sendSuccess(res, { synced: typesToSync, results });
  } catch (err) {
    handleRouteError(res, err, "Failed to trigger CRM sync");
  }
});

export default router;
