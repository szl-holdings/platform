import { Router, type IRouter } from "express";
import { db } from "@szl-holdings/db";
import {
  ownershipScenariosTable,
  ownershipAllocationsTable,
  controlRolesTable,
  officerRolesTable,
  managerRolesTable,
  signatureAuthorityRecordsTable,
  capitalContributionsTable,
  votingRightsTable,
  certificationReadinessRecordsTable,
  legalReviewFlagsTable,
  governanceDocumentsTable,
  ownershipDecisionLogsTable,
  featureFlagsTable,
} from "@szl-holdings/db";
import { eq, desc, asc, and, sql } from "drizzle-orm";
import { handleRouteError, sendSuccess, sendNotFound, parsePagination } from "../lib/api-response";
import { authMiddleware, requireRole, parseIdParam } from "../middlewares/auth";
import type { Request, Response, NextFunction } from "express";

const router: IRouter = Router();

// ─── Feature Flag Guard ───────────────────────────────────────────────────────

async function ownershipOsGuard(req: Request, res: Response, next: NextFunction) {
  try {
    const [flag] = await db
      .select()
      .from(featureFlagsTable)
      .where(eq(featureFlagsTable.key, "ownership_readiness_os_enabled"))
      .limit(1);
    if (!flag?.isEnabled) {
      res.status(403).json({ error: "Ownership Readiness OS is not enabled" });
      return;
    }
    next();
  } catch {
    res.status(500).json({ error: "Unable to verify feature flag — access denied" });
  }
}

// Auth + feature flag on all ownership routes
router.use("/ownership", authMiddleware(), requireRole("super_admin", "admin"), ownershipOsGuard);

// ─── Health ───────────────────────────────────────────────────────────────────

router.get("/ownership/health", (_req, res) => {
  res.json({ service: "ownership-control-os", status: "ok", timestamp: new Date().toISOString() });
});

// ─── SCENARIOS ────────────────────────────────────────────────────────────────

router.get("/ownership/scenarios", async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db
      .select()
      .from(ownershipScenariosTable)
      .orderBy(desc(ownershipScenariosTable.createdAt))
      .limit(limit)
      .offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(ownershipScenariosTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list ownership scenarios");
  }
});

router.get("/ownership/scenarios/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [scenario] = await db.select().from(ownershipScenariosTable).where(eq(ownershipScenariosTable.id, id));
    if (!scenario) { sendNotFound(res, "Ownership scenario"); return; }

    const [allocations, controlRoles, officerRoles, managerRoles, signatureAuth, capitalContribs, votingRights, certReadiness, legalFlags, govDocs, decisionLog] = await Promise.all([
      db.select().from(ownershipAllocationsTable).where(eq(ownershipAllocationsTable.scenarioId, id)).orderBy(asc(ownershipAllocationsTable.id)),
      db.select().from(controlRolesTable).where(eq(controlRolesTable.scenarioId, id)).orderBy(asc(controlRolesTable.id)),
      db.select().from(officerRolesTable).where(eq(officerRolesTable.scenarioId, id)).orderBy(asc(officerRolesTable.id)),
      db.select().from(managerRolesTable).where(eq(managerRolesTable.scenarioId, id)).orderBy(asc(managerRolesTable.id)),
      db.select().from(signatureAuthorityRecordsTable).where(eq(signatureAuthorityRecordsTable.scenarioId, id)).orderBy(asc(signatureAuthorityRecordsTable.id)),
      db.select().from(capitalContributionsTable).where(eq(capitalContributionsTable.scenarioId, id)).orderBy(asc(capitalContributionsTable.id)),
      db.select().from(votingRightsTable).where(eq(votingRightsTable.scenarioId, id)).orderBy(asc(votingRightsTable.id)),
      db.select().from(certificationReadinessRecordsTable).where(eq(certificationReadinessRecordsTable.scenarioId, id)).orderBy(asc(certificationReadinessRecordsTable.id)),
      db.select().from(legalReviewFlagsTable).where(eq(legalReviewFlagsTable.scenarioId, id)).orderBy(asc(legalReviewFlagsTable.priority)),
      db.select().from(governanceDocumentsTable).where(eq(governanceDocumentsTable.scenarioId, id)).orderBy(asc(governanceDocumentsTable.id)),
      db.select().from(ownershipDecisionLogsTable).where(eq(ownershipDecisionLogsTable.scenarioId, id)).orderBy(desc(ownershipDecisionLogsTable.occurredAt)).limit(50),
    ]);

    sendSuccess(res, {
      scenario,
      allocations,
      controlRoles,
      officerRoles,
      managerRoles,
      signatureAuth,
      capitalContribs,
      votingRights,
      certReadiness,
      legalFlags,
      govDocs,
      decisionLog,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get ownership scenario");
  }
});

router.post("/ownership/scenarios", async (req, res) => {
  try {
    const [row] = await db.insert(ownershipScenariosTable).values(req.body).returning();
    await db.insert(ownershipDecisionLogsTable).values({
      scenarioId: row.id,
      decisionType: "scenario_created",
      summary: `Scenario "${row.name}" was created`,
      madeBy: req.user?.displayName ?? "system",
    });
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create ownership scenario");
  }
});

router.patch("/ownership/scenarios/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db
      .update(ownershipScenariosTable)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(ownershipScenariosTable.id, id))
      .returning();
    if (!row) { sendNotFound(res, "Ownership scenario"); return; }
    if (req.body.isActive) {
      await db.insert(ownershipDecisionLogsTable).values({
        scenarioId: id,
        decisionType: "scenario_activated",
        summary: `Scenario "${row.name}" was activated as the current structure`,
        madeBy: req.user?.displayName ?? "system",
      });

      const existingFlags = await db.select().from(legalReviewFlagsTable).where(eq(legalReviewFlagsTable.scenarioId, id)).limit(1);
      if (existingFlags.length === 0) {
        const allocs = await db.select().from(ownershipAllocationsTable).where(eq(ownershipAllocationsTable.scenarioId, id));
        const controllingOwner = allocs.find(a => a.isControlling);
        const checklist = [
          { scenarioId: id, flagType: "attorney_review" as const, title: "Operating Agreement Review", description: "Operating agreement must document controlling owner's authority per certification standards.", priority: "critical" as const, status: "open" as const },
          { scenarioId: id, flagType: "banking_change" as const, title: "Bank Account Signature Authority", description: "Business bank accounts must reflect controlling owner as primary signatory.", priority: "critical" as const, status: "open" as const },
        ];
        if (controllingOwner && !controllingOwner.citizenshipConfirmed) {
          checklist.push({ scenarioId: id, flagType: "certification_docs" as any, title: `Citizenship Documentation — ${controllingOwner.personName}`, description: "U.S. citizenship must be confirmed before any certification application.", priority: "critical" as const, status: "open" as const });
        }
        checklist.push({ scenarioId: id, flagType: "cpa_review" as any, title: "Capital Contribution Valuation", description: "CPA review needed to value contributions and confirm equity alignment.", priority: "critical" as const, status: "open" as const });
        checklist.push({ scenarioId: id, flagType: "operating_agreement" as any, title: "Articles of Organization Alignment", description: "State registration must reflect controlling owner as primary officer.", priority: "critical" as const, status: "open" as const });
        await db.insert(legalReviewFlagsTable).values(checklist);
        await db.insert(ownershipDecisionLogsTable).values({
          scenarioId: id,
          decisionType: "legal_flag_raised",
          summary: `Auto-generated ${checklist.length} validation checklist items on activation`,
          madeBy: "system",
        });
      }
    }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update ownership scenario");
  }
});

router.delete("/ownership/scenarios/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(ownershipScenariosTable).where(eq(ownershipScenariosTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Ownership scenario"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete ownership scenario");
  }
});

// ─── ALLOCATIONS ─────────────────────────────────────────────────────────────

router.get("/ownership/scenarios/:id/allocations", async (req, res) => {
  try {
    const scenarioId = parseIdParam(req.params.id);
    const rows = await db.select().from(ownershipAllocationsTable).where(eq(ownershipAllocationsTable.scenarioId, scenarioId)).orderBy(asc(ownershipAllocationsTable.id));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list allocations");
  }
});

router.post("/ownership/scenarios/:id/allocations", async (req, res) => {
  try {
    const scenarioId = parseIdParam(req.params.id);
    const [row] = await db.insert(ownershipAllocationsTable).values({ ...req.body, scenarioId }).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create allocation");
  }
});

router.patch("/ownership/allocations/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(ownershipAllocationsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(ownershipAllocationsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Allocation"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update allocation");
  }
});

router.delete("/ownership/allocations/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(ownershipAllocationsTable).where(eq(ownershipAllocationsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Allocation"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete allocation");
  }
});

// ─── CONTROL ROLES ────────────────────────────────────────────────────────────

router.post("/ownership/scenarios/:id/control-roles", async (req, res) => {
  try {
    const scenarioId = parseIdParam(req.params.id);
    const [row] = await db.insert(controlRolesTable).values({ ...req.body, scenarioId }).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create control role");
  }
});

router.patch("/ownership/control-roles/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(controlRolesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(controlRolesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Control role"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update control role");
  }
});

router.delete("/ownership/control-roles/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(controlRolesTable).where(eq(controlRolesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Control role"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete control role");
  }
});

// ─── OFFICER ROLES ────────────────────────────────────────────────────────────

router.post("/ownership/scenarios/:id/officer-roles", async (req, res) => {
  try {
    const scenarioId = parseIdParam(req.params.id);
    const [row] = await db.insert(officerRolesTable).values({ ...req.body, scenarioId }).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create officer role");
  }
});

router.patch("/ownership/officer-roles/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(officerRolesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(officerRolesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Officer role"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update officer role");
  }
});

router.delete("/ownership/officer-roles/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(officerRolesTable).where(eq(officerRolesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Officer role"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete officer role");
  }
});

// ─── MANAGER ROLES ────────────────────────────────────────────────────────────

router.post("/ownership/scenarios/:id/manager-roles", async (req, res) => {
  try {
    const scenarioId = parseIdParam(req.params.id);
    const [row] = await db.insert(managerRolesTable).values({ ...req.body, scenarioId }).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create manager role");
  }
});

router.patch("/ownership/manager-roles/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(managerRolesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(managerRolesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Manager role"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update manager role");
  }
});

router.delete("/ownership/manager-roles/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(managerRolesTable).where(eq(managerRolesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Manager role"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete manager role");
  }
});

// ─── SIGNATURE AUTHORITY ──────────────────────────────────────────────────────

router.post("/ownership/scenarios/:id/signature-authority", async (req, res) => {
  try {
    const scenarioId = parseIdParam(req.params.id);
    const [row] = await db.insert(signatureAuthorityRecordsTable).values({ ...req.body, scenarioId }).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create signature authority record");
  }
});

router.patch("/ownership/signature-authority/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(signatureAuthorityRecordsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(signatureAuthorityRecordsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Signature authority record"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update signature authority record");
  }
});

router.delete("/ownership/signature-authority/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(signatureAuthorityRecordsTable).where(eq(signatureAuthorityRecordsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Signature authority record"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete signature authority record");
  }
});

// ─── CAPITAL CONTRIBUTIONS ────────────────────────────────────────────────────

router.post("/ownership/scenarios/:id/capital-contributions", async (req, res) => {
  try {
    const scenarioId = parseIdParam(req.params.id);
    const [row] = await db.insert(capitalContributionsTable).values({ ...req.body, scenarioId }).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create capital contribution");
  }
});

router.patch("/ownership/capital-contributions/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(capitalContributionsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(capitalContributionsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Capital contribution"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update capital contribution");
  }
});

router.delete("/ownership/capital-contributions/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(capitalContributionsTable).where(eq(capitalContributionsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Capital contribution"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete capital contribution");
  }
});

// ─── VOTING RIGHTS ────────────────────────────────────────────────────────────

router.post("/ownership/scenarios/:id/voting-rights", async (req, res) => {
  try {
    const scenarioId = parseIdParam(req.params.id);
    const [row] = await db.insert(votingRightsTable).values({ ...req.body, scenarioId }).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create voting rights");
  }
});

router.patch("/ownership/voting-rights/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(votingRightsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(votingRightsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Voting rights"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update voting rights");
  }
});

router.delete("/ownership/voting-rights/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(votingRightsTable).where(eq(votingRightsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Voting rights"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete voting rights");
  }
});

// ─── CERTIFICATION READINESS ──────────────────────────────────────────────────

router.post("/ownership/scenarios/:id/certification-readiness", async (req, res) => {
  try {
    const scenarioId = parseIdParam(req.params.id);
    const [row] = await db.insert(certificationReadinessRecordsTable).values({ ...req.body, scenarioId }).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create certification readiness record");
  }
});

router.patch("/ownership/certification-readiness/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(certificationReadinessRecordsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(certificationReadinessRecordsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Certification readiness record"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update certification readiness record");
  }
});

router.delete("/ownership/certification-readiness/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(certificationReadinessRecordsTable).where(eq(certificationReadinessRecordsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Certification readiness record"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete certification readiness record");
  }
});

// ─── LEGAL REVIEW FLAGS ───────────────────────────────────────────────────────

router.get("/ownership/scenarios/:id/legal-flags", async (req, res) => {
  try {
    const scenarioId = parseIdParam(req.params.id);
    const rows = await db.select().from(legalReviewFlagsTable).where(eq(legalReviewFlagsTable.scenarioId, scenarioId)).orderBy(asc(legalReviewFlagsTable.priority));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list legal review flags");
  }
});

router.post("/ownership/scenarios/:id/legal-flags", async (req, res) => {
  try {
    const scenarioId = parseIdParam(req.params.id);
    const [row] = await db.insert(legalReviewFlagsTable).values({ ...req.body, scenarioId }).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create legal review flag");
  }
});

router.patch("/ownership/legal-flags/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(legalReviewFlagsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(legalReviewFlagsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Legal review flag"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update legal review flag");
  }
});

router.delete("/ownership/legal-flags/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(legalReviewFlagsTable).where(eq(legalReviewFlagsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Legal review flag"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete legal review flag");
  }
});

// ─── GOVERNANCE DOCUMENTS ─────────────────────────────────────────────────────

router.post("/ownership/scenarios/:id/governance-documents", async (req, res) => {
  try {
    const scenarioId = parseIdParam(req.params.id);
    const [row] = await db.insert(governanceDocumentsTable).values({ ...req.body, scenarioId }).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create governance document");
  }
});

router.patch("/ownership/governance-documents/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(governanceDocumentsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(governanceDocumentsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Governance document"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update governance document");
  }
});

router.delete("/ownership/governance-documents/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(governanceDocumentsTable).where(eq(governanceDocumentsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Governance document"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete governance document");
  }
});

// ─── DECISION LOG ─────────────────────────────────────────────────────────────

router.get("/ownership/scenarios/:id/decision-log", async (req, res) => {
  try {
    const scenarioId = parseIdParam(req.params.id);
    const { limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db
      .select()
      .from(ownershipDecisionLogsTable)
      .where(eq(ownershipDecisionLogsTable.scenarioId, scenarioId))
      .orderBy(desc(ownershipDecisionLogsTable.occurredAt))
      .limit(limit)
      .offset(offset);
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list decision log");
  }
});

router.post("/ownership/scenarios/:id/decision-log", async (req, res) => {
  try {
    const scenarioId = parseIdParam(req.params.id);
    const [row] = await db.insert(ownershipDecisionLogsTable).values({ ...req.body, scenarioId }).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create decision log entry");
  }
});

router.delete("/ownership/decision-log/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    await db.delete(ownershipDecisionLogsTable).where(eq(ownershipDecisionLogsTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete decision log entry");
  }
});

// ─── SEED: Mom-Led Preferred Template ────────────────────────────────────────

router.post("/ownership/seed-preferred-template", async (req, res) => {
  try {
    const existing = await db
      .select()
      .from(ownershipScenariosTable)
      .where(and(eq(ownershipScenariosTable.isTemplate, true), eq(ownershipScenariosTable.isPreferred, true)))
      .limit(1);

    if (existing.length > 0) {
      sendSuccess(res, { seeded: false, message: "Preferred template already exists", scenarioId: existing[0].id });
      return;
    }

    const [scenario] = await db.insert(ownershipScenariosTable).values({
      name: "Preferred Mom-Led Structure",
      description: "Strategic mom-led ownership structure optimized for women/minority business certification, banking readiness, and fundraising clarity. Mom holds 51%+ equity with full controlling officer authority. Stephen operates as founder/builder. Dad holds optional non-controlling advisory stake.",
      isTemplate: true,
      isActive: true,
      isPreferred: true,
      status: "approved",
      certificationFitSummary: "Strong fit for WOSB (Women-Owned Small Business), SBA 8(a) pathway (if applicable), and state-level MWBE programs. Mom must be citizenship-confirmed U.S. citizen. Controlling officer role, day-to-day authority, and documented signature authority are all required for certification.",
      fundraisingFitScore: 78,
      bankFitScore: 85,
      investorClarityScore: 82,
      notes: "This is a readiness analysis scenario only. No certification has been applied for or claimed. All eligibility determinations require attorney review.",
    }).returning();

    const sid = scenario.id;

    await Promise.all([
      db.insert(ownershipAllocationsTable).values([
        { scenarioId: sid, personName: "Mom", role: "primary_owner", equityPct: "51.000", votingRightsPct: "51.000", isControlling: true, isMajorityOwner: true, citizenshipConfirmed: false, notes: "Must be confirmed U.S. citizen for WOSB/MWBE certification eligibility. Citizenship documentation required." },
        { scenarioId: sid, personName: "Stephen", role: "co_owner", equityPct: "30.000", votingRightsPct: "30.000", isControlling: false, isMajorityOwner: false, citizenshipConfirmed: true, notes: "Founder, operator, and builder. Non-controlling minority owner under this structure." },
        { scenarioId: sid, personName: "Dad", role: "minority_owner", equityPct: "19.000", votingRightsPct: "19.000", isControlling: false, isMajorityOwner: false, citizenshipConfirmed: true, notes: "Strategic advisor and optional non-controlling owner. Dad's role does not impact certification eligibility as long as Mom retains 51%+ and controlling authority." },
      ]),
      db.insert(controlRolesTable).values([
        { scenarioId: sid, personName: "Mom", hasDayToDayControl: true, hasLongTermDecisionAuthority: true, hasHiringFiringAuthority: true, hasStrategicVeto: true, controlDescription: "Mom has full day-to-day operational control, long-term strategic authority, and hiring/firing power. This is required for WOSB and MWBE certification." },
        { scenarioId: sid, personName: "Stephen", hasDayToDayControl: false, hasLongTermDecisionAuthority: false, hasHiringFiringAuthority: false, hasStrategicVeto: false, controlDescription: "Stephen executes operational and product work under Mom's authority. Does not hold controlling authority for certification purposes." },
        { scenarioId: sid, personName: "Dad", hasDayToDayControl: false, hasLongTermDecisionAuthority: false, hasHiringFiringAuthority: false, hasStrategicVeto: false, controlDescription: "Dad serves as strategic advisor with no day-to-day or authority control." },
      ]),
      db.insert(officerRolesTable).values([
        { scenarioId: sid, personName: "Mom", title: "President / CEO", isPrimaryOfficer: true, isOnRegistration: true, isOnBankAccount: true, isOnOperatingAgreement: true, notes: "Mom must be listed as President/CEO on state registration, operating agreement, and bank accounts for certification." },
        { scenarioId: sid, personName: "Stephen", title: "Chief Operating Officer / Founder", isPrimaryOfficer: false, isOnRegistration: false, isOnBankAccount: false, isOnOperatingAgreement: true, notes: "Listed in operating agreement as non-controlling officer. Not the primary registered officer." },
      ]),
      db.insert(managerRolesTable).values([
        { scenarioId: sid, personName: "Mom", managementArea: "finance", responsibility: "Oversees financial decisions, approves major expenditures, signs financial documents.", isDocumented: false },
        { scenarioId: sid, personName: "Mom", managementArea: "certifications", responsibility: "Owns all certification applications, renewals, and government procurement relationships.", isDocumented: false },
        { scenarioId: sid, personName: "Mom", managementArea: "operations", responsibility: "Has final authority on operational decisions.", isDocumented: false },
        { scenarioId: sid, personName: "Stephen", managementArea: "product", responsibility: "Leads product development, technology, and platform execution under Mom's strategic authority.", isDocumented: false },
        { scenarioId: sid, personName: "Stephen", managementArea: "sales", responsibility: "Manages business development and sales pipeline.", isDocumented: false },
        { scenarioId: sid, personName: "Dad", managementArea: "other", responsibility: "Strategic advisor — no formal management area. Available for guidance on deal structure, relationships, and market access.", isDocumented: false },
      ]),
      db.insert(signatureAuthorityRecordsTable).values([
        { scenarioId: sid, personName: "Mom", authorityType: "bank_primary", institution: "TBD", isActive: true, documentationStatus: "not_started", notes: "Mom must be the primary signatory on all business bank accounts for certification compliance." },
        { scenarioId: sid, personName: "Mom", authorityType: "contracts", isActive: true, documentationStatus: "not_started", notes: "Mom holds primary contract signature authority." },
        { scenarioId: sid, personName: "Mom", authorityType: "government_forms", isActive: true, documentationStatus: "not_started", notes: "Mom must sign all government certification forms and procurement documents." },
        { scenarioId: sid, personName: "Mom", authorityType: "payroll", isActive: true, documentationStatus: "not_started", notes: "Mom should be the authorized signatory on payroll accounts." },
        { scenarioId: sid, personName: "Stephen", authorityType: "bank_secondary", isActive: true, documentationStatus: "not_started", notes: "Stephen may be a secondary bank signatory for operational continuity." },
      ]),
      db.insert(capitalContributionsTable).values([
        { scenarioId: sid, personName: "Mom", contributionType: "services", description: "Strategic leadership, certification management, and ownership establishment.", isDocumented: false, notes: "Non-cash contribution — requires valuation and documentation in operating agreement." },
        { scenarioId: sid, personName: "Stephen", contributionType: "services", description: "Platform development, operations, product, and business development.", isDocumented: false, notes: "Non-cash contribution — requires valuation and documentation in operating agreement." },
        { scenarioId: sid, personName: "Dad", contributionType: "other", description: "Strategic advisory and relationship capital.", isDocumented: false, notes: "Advisory equity or optional cash contribution. Document clearly to avoid control attribution." },
      ]),
      db.insert(votingRightsTable).values([
        { scenarioId: sid, personName: "Mom", votingPct: "51.000", hasVetoRight: true, restrictions: null, notes: "51% voting majority with strategic veto rights." },
        { scenarioId: sid, personName: "Stephen", votingPct: "30.000", hasVetoRight: false, notes: "Minority voting stake." },
        { scenarioId: sid, personName: "Dad", votingPct: "19.000", hasVetoRight: false, notes: "Minority advisory stake — no veto rights." },
      ]),
      db.insert(certificationReadinessRecordsTable).values([
        {
          scenarioId: sid,
          certificationName: "WOSB — Women-Owned Small Business",
          certificationBody: "SBA / WOSB Program",
          fitLevel: "strong",
          keyRequirements: "51%+ unconditional ownership by U.S. citizen woman. Woman must control management and daily operations. Woman must hold highest officer title.",
          gapSummary: "Mom's citizenship must be confirmed. Operating agreement must document Mom's control authority. Bank accounts and registration must reflect Mom as primary officer.",
          requiredDocuments: ["Citizenship documentation", "Operating agreement", "State registration (Mom as President)", "Bank account signature cards", "Management documentation", "Payroll records (if applicable)"],
        },
        {
          scenarioId: sid,
          certificationName: "MWBE — Minority/Women Business Enterprise",
          certificationBody: "State/Regional Agency (varies)",
          fitLevel: "strong",
          keyRequirements: "51%+ ownership by minority or woman. Full operational control. Officer title alignment. Day-to-day decision authority documented.",
          gapSummary: "Requirements vary by state. Attorney review required to match operating agreement language to state MWBE standards.",
          requiredDocuments: ["Operating agreement", "State registration", "Proof of ownership", "Control documentation", "Bank statements", "Tax returns"],
        },
        {
          scenarioId: sid,
          certificationName: "SBA 8(a) Business Development Program",
          certificationBody: "SBA",
          fitLevel: "moderate",
          keyRequirements: "Socially and economically disadvantaged individual must own 51%+. Requires additional personal financial qualification and program commitment.",
          gapSummary: "Eligibility depends on Mom's individual financial profile and socially disadvantaged status determination. Requires dedicated attorney and SBA review.",
          requiredDocuments: ["Personal financial statements", "Tax returns (3 years)", "Ownership documentation", "Business financial statements", "Operating agreement", "Disadvantaged status documentation"],
        },
      ]),
      db.insert(legalReviewFlagsTable).values([
        { scenarioId: sid, flagType: "attorney_review", title: "Operating Agreement Review", description: "Operating agreement must be reviewed by an attorney to ensure Mom's controlling authority is explicitly and unconditionally documented per certification standards.", priority: "critical", status: "open" },
        { scenarioId: sid, flagType: "cpa_review", title: "Capital Contribution Valuation", description: "CPA review needed to value non-cash service contributions for all three owners to ensure proper equity alignment in financials.", priority: "high", status: "open" },
        { scenarioId: sid, flagType: "banking_change", title: "Bank Account Signature Authority", description: "All business bank accounts must reflect Mom as the primary signatory. Coordinate with banking institution to update account records.", priority: "critical", status: "open" },
        { scenarioId: sid, flagType: "certification_docs", title: "Citizenship Documentation — Mom", description: "Mom's U.S. citizenship must be confirmed and documented (passport, birth certificate, or naturalization certificate) before any certification application.", priority: "critical", status: "open" },
        { scenarioId: sid, flagType: "operating_agreement", title: "Articles of Organization Update", description: "State registration (Articles of Organization or equivalent) must list Mom as the primary officer/registered agent as required for most certifications.", priority: "high", status: "open" },
        { scenarioId: sid, flagType: "payroll_alignment", title: "Payroll Authorization Review", description: "Payroll platform must be configured with Mom as the authorized account holder. Review payroll signatory requirements.", priority: "medium", status: "open" },
      ]),
      db.insert(governanceDocumentsTable).values([
        { scenarioId: sid, documentType: "operating_agreement", title: "Operating Agreement", status: "needs_update", notes: "Must explicitly document Mom's 51%+ unconditional ownership, controlling officer role, day-to-day authority, and signature authority." },
        { scenarioId: sid, documentType: "articles_of_organization", title: "Articles of Organization", status: "needs_update", notes: "Must reflect Mom as primary officer/registered agent." },
        { scenarioId: sid, documentType: "officer_appointment", title: "Officer Appointment Resolution", status: "missing", notes: "Formal board/member resolution appointing Mom as President/CEO required." },
        { scenarioId: sid, documentType: "ownership_certificate", title: "Ownership Interest Certificate", status: "missing", notes: "Documentation of each member's ownership percentage." },
        { scenarioId: sid, documentType: "shareholder_agreement", title: "Member/Shareholder Agreement", status: "missing", notes: "Defines rights and restrictions on ownership transfers and voting." },
      ]),
    ]);

    await db.insert(ownershipDecisionLogsTable).values({
      scenarioId: sid,
      decisionType: "scenario_created",
      summary: "Preferred Mom-Led Structure template seeded",
      madeBy: "system",
      rationale: "Strategic scenario: Mom 51%+ controlling owner, Stephen founder/operator, Dad advisory minority stake. Optimized for WOSB/MWBE certification readiness.",
    });

    const [altScenario] = await db.insert(ownershipScenariosTable).values({
      name: "Equal Partnership (Non-Cert)",
      description: "50/50 partnership between Mom and Stephen. This structure does NOT meet majority-ownership requirements for WOSB/MWBE certification but may simplify banking and governance for a non-certification path.",
      isTemplate: true,
      isActive: false,
      isPreferred: false,
      status: "draft",
      certificationFitSummary: "Does not meet WOSB/MWBE majority-ownership thresholds. Not recommended if certification is a strategic priority.",
      fundraisingFitScore: 70,
      bankFitScore: 75,
      investorClarityScore: 65,
      notes: "Readiness analysis only — included for structural comparison. No certification has been applied for or claimed.",
    }).returning();

    const altId = altScenario.id;
    await Promise.all([
      db.insert(ownershipAllocationsTable).values([
        { scenarioId: altId, personName: "Mom", role: "co_owner" as const, equityPct: "50.000", votingRightsPct: "50.000", isControlling: false, isMajorityOwner: false, citizenshipConfirmed: false },
        { scenarioId: altId, personName: "Stephen", role: "co_owner" as const, equityPct: "50.000", votingRightsPct: "50.000", isControlling: false, isMajorityOwner: false, citizenshipConfirmed: true },
      ]),
      db.insert(controlRolesTable).values([
        { scenarioId: altId, personName: "Mom", hasDayToDayControl: true, hasLongTermDecisionAuthority: true, hasHiringFiringAuthority: false, hasStrategicVeto: false, controlDescription: "Shared decision authority with Stephen." },
        { scenarioId: altId, personName: "Stephen", hasDayToDayControl: true, hasLongTermDecisionAuthority: true, hasHiringFiringAuthority: false, hasStrategicVeto: false, controlDescription: "Shared decision authority with Mom." },
      ]),
      db.insert(officerRolesTable).values([
        { scenarioId: altId, personName: "Mom", title: "Co-Managing Member", isPrimaryOfficer: false, isOnRegistration: true, isOnBankAccount: true, isOnOperatingAgreement: true },
        { scenarioId: altId, personName: "Stephen", title: "Co-Managing Member", isPrimaryOfficer: false, isOnRegistration: true, isOnBankAccount: true, isOnOperatingAgreement: true },
      ]),
      db.insert(certificationReadinessRecordsTable).values([
        { scenarioId: altId, certificationName: "WOSB — Women-Owned Small Business", certificationBody: "SBA / WOSB Program", fitLevel: "weak" as const, keyRequirements: "Requires 51%+ ownership by a woman.", gapSummary: "50/50 split does not satisfy the 51%+ majority-ownership requirement." },
        { scenarioId: altId, certificationName: "MWBE — Minority/Women Business Enterprise", certificationBody: "State/Regional Agency", fitLevel: "weak" as const, keyRequirements: "Requires 51%+ ownership by minority or woman.", gapSummary: "50/50 split does not satisfy majority-ownership threshold." },
      ]),
      db.insert(ownershipDecisionLogsTable).values({
        scenarioId: altId,
        decisionType: "scenario_created",
        summary: "Equal Partnership comparison scenario seeded",
        madeBy: "system",
        rationale: "Non-certification comparison scenario to illustrate why majority ownership is strategic.",
      }),
    ]);

    const [altScenario2] = await db.insert(ownershipScenariosTable).values({
      name: "Mom 60% / Stephen 40% (No Dad)",
      description: "Two-member structure with Mom as 60% majority owner and Stephen at 40%. Removes Dad's advisory stake for simplicity. Strong certification position with cleaner cap table.",
      isTemplate: true,
      isActive: false,
      isPreferred: false,
      status: "draft",
      certificationFitSummary: "Strong fit for WOSB and MWBE. Simpler cap table with only two members reduces governance complexity.",
      fundraisingFitScore: 72,
      bankFitScore: 88,
      investorClarityScore: 85,
      notes: "Readiness analysis only — no certification has been applied for or claimed.",
    }).returning();

    const alt2Id = altScenario2.id;
    await Promise.all([
      db.insert(ownershipAllocationsTable).values([
        { scenarioId: alt2Id, personName: "Mom", role: "primary_owner" as const, equityPct: "60.000", votingRightsPct: "60.000", isControlling: true, isMajorityOwner: true, citizenshipConfirmed: false, notes: "Majority owner with full control." },
        { scenarioId: alt2Id, personName: "Stephen", role: "co_owner" as const, equityPct: "40.000", votingRightsPct: "40.000", isControlling: false, isMajorityOwner: false, citizenshipConfirmed: true, notes: "Minority owner and operator." },
      ]),
      db.insert(controlRolesTable).values([
        { scenarioId: alt2Id, personName: "Mom", hasDayToDayControl: true, hasLongTermDecisionAuthority: true, hasHiringFiringAuthority: true, hasStrategicVeto: true, controlDescription: "Full controlling authority as 60% owner." },
        { scenarioId: alt2Id, personName: "Stephen", hasDayToDayControl: false, hasLongTermDecisionAuthority: false, hasHiringFiringAuthority: false, hasStrategicVeto: false, controlDescription: "Operational executor under Mom's authority." },
      ]),
      db.insert(officerRolesTable).values([
        { scenarioId: alt2Id, personName: "Mom", title: "President / CEO", isPrimaryOfficer: true, isOnRegistration: true, isOnBankAccount: true, isOnOperatingAgreement: true },
        { scenarioId: alt2Id, personName: "Stephen", title: "COO / Founder", isPrimaryOfficer: false, isOnRegistration: false, isOnBankAccount: false, isOnOperatingAgreement: true },
      ]),
      db.insert(certificationReadinessRecordsTable).values([
        { scenarioId: alt2Id, certificationName: "WOSB — Women-Owned Small Business", certificationBody: "SBA / WOSB Program", fitLevel: "strong" as const, keyRequirements: "51%+ ownership by U.S. citizen woman with full control.", gapSummary: "Citizenship confirmation still required. Simpler structure than 3-member preferred." },
        { scenarioId: alt2Id, certificationName: "MWBE — Minority/Women Business Enterprise", certificationBody: "State/Regional Agency", fitLevel: "strong" as const, keyRequirements: "51%+ ownership and control by minority or woman.", gapSummary: "Fewer governance documents needed due to two-member structure." },
      ]),
      db.insert(ownershipDecisionLogsTable).values({
        scenarioId: alt2Id,
        decisionType: "scenario_created",
        summary: "Mom 60% / Stephen 40% comparison scenario seeded",
        madeBy: "system",
        rationale: "Two-member alternative for cleaner cap table with strong certification fit.",
      }),
    ]);

    sendSuccess(res, { seeded: true, scenarioId: sid, alternativeScenarioIds: [altId, alt2Id] }, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to seed preferred template");
  }
});

// ─── SUMMARY: next-actions queue ─────────────────────────────────────────────

router.get("/ownership/next-actions", async (req, res) => {
  try {
    const openFlags = await db
      .select()
      .from(legalReviewFlagsTable)
      .where(eq(legalReviewFlagsTable.status, "open"))
      .orderBy(asc(legalReviewFlagsTable.priority));

    const missingDocs = await db
      .select()
      .from(governanceDocumentsTable)
      .where(eq(governanceDocumentsTable.status, "missing"));

    const needsUpdateDocs = await db
      .select()
      .from(governanceDocumentsTable)
      .where(eq(governanceDocumentsTable.status, "needs_update"));

    const unconfirmedCitizenship = await db
      .select()
      .from(ownershipAllocationsTable)
      .where(and(eq(ownershipAllocationsTable.isControlling, true), eq(ownershipAllocationsTable.citizenshipConfirmed, false)));

    const pendingSignatures = await db
      .select()
      .from(signatureAuthorityRecordsTable)
      .where(eq(signatureAuthorityRecordsTable.documentationStatus, "not_started"));

    sendSuccess(res, {
      openLegalFlags: openFlags,
      missingDocuments: missingDocs,
      documentsNeedingUpdate: needsUpdateDocs,
      unconfirmedCitizenships: unconfirmedCitizenship,
      pendingSignatureAuthority: pendingSignatures,
      totalActionItems: openFlags.length + missingDocs.length + needsUpdateDocs.length + unconfirmedCitizenship.length + pendingSignatures.length,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get next actions");
  }
});

export default router;
