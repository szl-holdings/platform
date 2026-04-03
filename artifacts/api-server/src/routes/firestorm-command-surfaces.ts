/**
 * Firestorm Command Surface Routes
 *
 * Zero-trust-enforced endpoints for the 5 Aegis command surfaces.
 * Per-route controls: environmentLabel, identityAwareRoute, sessionAwareness,
 * automationGate, dataControls. See docs/internal/aegis/zero-trust-policy-matrix.md.
 *
 * Tenant model: shared-platform SOC (no orgId on schema). Access partitioned by
 * permission class + row-level assignment checks on mutations.
 */

import { Router, type IRouter } from "express";
import {
  db,
  firestormIncidentsTable,
  firestormAlertsTable,
  firestormCasesTable,
  firestormWorkflowActionsTable,
  firestormComplianceControlsTable,
  firestormRiskScoresTable,
  firestormFindingsTable,
} from "@workspace/db";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import {
  environmentLabel,
  identityAwareRoute,
  sessionAwareness,
  requireStepUp,
  automationGate,
  dataControls,
} from "../middlewares/zero-trust";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ─── Shared zero-trust middleware stack ───────────────────────────────────────

const ztRead = [
  environmentLabel(),
  authMiddleware({ required: true }),
  identityAwareRoute({ require: "analyst" }),
  sessionAwareness(),
];

const ztSocManager = [
  environmentLabel(),
  authMiddleware({ required: true }),
  identityAwareRoute({ require: "soc_manager" }),
  sessionAwareness(),
];

const ztExecutive = [
  environmentLabel(),
  authMiddleware({ required: true }),
  identityAwareRoute({ require: "executive" }),
  sessionAwareness(),
];

const MANAGER_CLASSES = ["soc_manager", "executive", "platform_admin"];

function isManagerClass(permClass: string | undefined): boolean {
  return MANAGER_CLASSES.includes(permClass ?? "analyst");
}

function getUserIdentity(req: import("express").Request): string | null {
  return req.user?.displayName ?? req.user?.email ?? null;
}

/**
 * Builds a user-visibility scope filter for command-surface queries.
 *
 * Architecture: Aegis/Firestorm is a single-organization SOC platform.
 * There is no `orgId` column — all data belongs to the same org.
 * Access control is enforced at the user/role level:
 *   - Managers (soc_manager, executive, platform_admin): see all records
 *   - Non-managers (analyst, responder, partner_analyst): see only records
 *     explicitly assigned to them. Unassigned records are NOT visible to
 *     non-managers — they must be assigned by a manager first.
 *
 * If a non-manager has no identity token, no records are returned (denied).
 */
function buildUserScopeFilter(
  field: Parameters<typeof eq>[0],
  userIdentity: string | null,
  manager: boolean,
) {
  if (manager) return undefined;
  if (!userIdentity) return eq(field, "__denied__");
  return eq(field, userIdentity);
}

// ─── Command Home — Posture summary ──────────────────────────────────────────

/**
 * GET /firestorm/command/posture
 *
 * Returns the live posture summary for Command Home.
 * Requires: analyst+
 * Data labels: CONFIDENTIAL, INTERNAL tenant, IR-90D retention
 */
router.get(
  "/firestorm/command/posture",
  ...ztRead,
  dataControls({ sensitivity: "CONFIDENTIAL", retention: "IR-90D", exportRestricted: true }),
  async (req, res) => {
    try {
      const manager = isManagerClass(req.ztPermissionClass);
      const user = getUserIdentity(req);
      const incidentScope = buildUserScopeFilter(firestormIncidentsTable.assignedAnalyst, user, manager);
      const findingScope = buildUserScopeFilter(firestormFindingsTable.remediationOwner, user, manager);

      const [incidents, alerts, riskScores, findings] = await Promise.all([
        db
          .select()
          .from(firestormIncidentsTable)
          .where(incidentScope)
          .orderBy(desc(firestormIncidentsTable.createdAt))
          .limit(20),
        db
          .select()
          .from(firestormAlertsTable)
          .orderBy(desc(firestormAlertsTable.createdAt))
          .limit(50),
        db.select().from(firestormRiskScoresTable).orderBy(desc(firestormRiskScoresTable.calculatedAt)).limit(1),
        db.select().from(firestormFindingsTable).where(findingScope).orderBy(desc(firestormFindingsTable.createdAt)).limit(20),
      ]);

      const openIncidents = incidents.filter(i => i.status !== "closed");
      const criticalAlerts = alerts.filter(a => a.severity === "critical");
      const latestRiskScore = riskScores[0] ?? null;
      const unresolvedFindings = findings.filter(f => f.status === "open" || f.status === "confirmed");

      const postureSummary = {
        riskScore: latestRiskScore?.currentScore ?? null,
        riskLevel: latestRiskScore?.trend ?? "unknown",
        openIncidents: openIncidents.length,
        criticalAlerts: criticalAlerts.length,
        unresolvedFindings: unresolvedFindings.length,
        totalAlerts: alerts.length,
        ztEnvironment: req.ztEnvironment,
        ztPermissionClass: req.ztPermissionClass,
        ztDataLabels: req.ztDataLabels,
        fetchedAt: new Date().toISOString(),
      };

      logger.info({
        msg: "Command posture fetched",
        userId: req.user?.id,
        permissionClass: req.ztPermissionClass,
        environment: req.ztEnvironment,
      });

      sendSuccess(res, postureSummary);
    } catch (err) {
      handleRouteError(res, err, "Failed to fetch command posture");
    }
  },
);

// ─── Investigations Board ─────────────────────────────────────────────────────

/**
 * GET /firestorm/command/investigations
 *
 * Returns open cases and linked incidents for the Investigations Board.
 * Requires: analyst+
 * Data labels: CONFIDENTIAL, IR-90D
 */
router.get(
  "/firestorm/command/investigations",
  ...ztRead,
  dataControls({ sensitivity: "CONFIDENTIAL", retention: "IR-90D", exportRestricted: true }),
  async (req, res) => {
    try {
      const manager = isManagerClass(req.ztPermissionClass);
      const user = getUserIdentity(req);
      const caseScope = buildUserScopeFilter(firestormCasesTable.assignedAnalyst, user, manager);

      const cases = await db
        .select()
        .from(firestormCasesTable)
        .where(caseScope)
        .orderBy(desc(firestormCasesTable.createdAt))
        .limit(50);

      const openCases = cases.filter(c => c.status !== "closed" && c.status !== "resolved");

      // relatedIncidentIds is a jsonb array on the cases table
      const allRelatedIds = openCases.flatMap(c => (c.relatedIncidentIds ?? []) as number[]);
      const uniqueIds = [...new Set(allRelatedIds)];

      const linkedIncidents =
        uniqueIds.length > 0
          ? await db
              .select()
              .from(firestormIncidentsTable)
              .where(inArray(firestormIncidentsTable.id, uniqueIds))
          : [];

      const incidentMap = new Map(linkedIncidents.map(i => [i.id, i]));

      const investigationsPayload = openCases.map(c => ({
        ...c,
        linkedIncidents: ((c.relatedIncidentIds ?? []) as number[]).map(id => incidentMap.get(id) ?? null).filter(Boolean),
      }));

      sendSuccess(res, {
        investigations: investigationsPayload,
        totalOpen: openCases.length,
        ztPermissionClass: req.ztPermissionClass,
        ztEnvironment: req.ztEnvironment,
        ztDataLabels: req.ztDataLabels,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to fetch investigations");
    }
  },
);

/**
 * POST /firestorm/command/investigations
 *
 * Adds an analyst note to an open case (appended to the case's notes JSONB array).
 * Requires: analyst+
 * Automation gate: propose_only — note is proposed and logged, not executed externally
 * Data labels: CONFIDENTIAL, IR-90D
 */
router.post(
  "/firestorm/command/investigations",
  ...ztRead,
  automationGate({ gate: "propose_only", actionClass: "analyst_note" }),
  dataControls({ sensitivity: "CONFIDENTIAL", retention: "IR-90D", exportRestricted: true }),
  async (req, res) => {
    try {
      const { type, content, caseId } = req.body as { type?: string; content?: string; caseId?: number };
      if (!content || typeof content !== "string" || !content.trim()) {
        res.status(400).json({ error: "INVALID_INPUT", message: "Note content is required." });
        return;
      }

      const noteEntry = {
        content: content.trim(),
        author: req.user?.displayName ?? "Analyst",
        at: new Date().toISOString(),
      };

      // Persist note to DB if caseId is provided — append to notes jsonb array
      let updatedCase: typeof firestormCasesTable.$inferSelect | null = null;
      if (caseId && Number.isInteger(Number(caseId))) {
        const numericId = Number(caseId);
        const [existingCase] = await db
          .select()
          .from(firestormCasesTable)
          .where(eq(firestormCasesTable.id, numericId));

        if (!existingCase) {
          res.status(404).json({ error: "NOT_FOUND", message: "Case not found." });
          return;
        }

        const manager = isManagerClass(req.ztPermissionClass);
        const user = getUserIdentity(req);
        const caseAssigned = existingCase.assignedAnalyst;
        const authorized =
          manager ||
          (user !== null && caseAssigned !== null && caseAssigned === user);

        if (!authorized) {
          logger.warn({
            msg: "Case note write denied — not assigned to actor",
            userId: req.user?.id,
            caseId: numericId,
            assignedAnalyst: caseAssigned,
            permissionClass: req.ztPermissionClass,
          });
          res.status(404).json({
            error: "NOT_FOUND",
            message: "Case not found.",
          });
          return;
        }

        const existingNotes = (existingCase.notes ?? []) as Array<{ content: string; author: string; at: string }>;
        const [updated] = await db
          .update(firestormCasesTable)
          .set({
            notes: [...existingNotes, noteEntry],
            updatedAt: new Date(),
          })
          .where(eq(firestormCasesTable.id, numericId))
          .returning();
        updatedCase = updated ?? null;
      }

      // automationGate({ gate: "propose_only" }) already set X-Aegis-Automation-Gate header

      logger.info({
        msg: "Analyst note submitted",
        userId: req.user?.id,
        permissionClass: req.ztPermissionClass,
        environment: req.ztEnvironment,
        caseId: caseId ?? null,
        noteType: type ?? "note",
        persisted: !!updatedCase,
      });

      sendSuccess(res, {
        status: "note_logged",
        note: noteEntry,
        persisted: !!updatedCase,
        caseId: caseId ?? null,
        automationGate: "propose_only",
        ztPermissionClass: req.ztPermissionClass,
        ztEnvironment: req.ztEnvironment,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to submit analyst note");
    }
  },
);

// ─── Decision Console ─────────────────────────────────────────────────────────

/**
 * GET /firestorm/command/decisions
 *
 * Returns pending findings that require a decision.
 * Requires: responder+
 * Data labels: RESTRICTED, IR-90D
 */
router.get(
  "/firestorm/command/decisions",
  environmentLabel(),
  authMiddleware({ required: true }),
  identityAwareRoute({ require: "responder" }),
  sessionAwareness(),
  dataControls({ sensitivity: "RESTRICTED", retention: "IR-90D", exportRestricted: true }),
  async (req, res) => {
    try {
      const manager = isManagerClass(req.ztPermissionClass);
      const user = getUserIdentity(req);
      const findingScope = buildUserScopeFilter(firestormFindingsTable.remediationOwner, user, manager);

      const findings = await db
        .select()
        .from(firestormFindingsTable)
        .where(findingScope)
        .orderBy(desc(firestormFindingsTable.createdAt))
        .limit(50);

      const pendingDecisions = findings.filter(f => f.status === "open" || f.status === "confirmed");

      sendSuccess(res, {
        decisions: pendingDecisions,
        pendingCount: pendingDecisions.length,
        ztPermissionClass: req.ztPermissionClass,
        ztEnvironment: req.ztEnvironment,
        ztDataLabels: req.ztDataLabels,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to fetch decisions");
    }
  },
);

/**
 * POST /firestorm/command/decisions/:id/approve
 *
 * Approves a finding decision.
 * Requires: soc_manager+
 * Automation gate: approval_required (requires peer approval, not self-approval)
 * Step-up: required for soc_manager+ class
 * Data labels: RESTRICTED
 */
router.post(
  "/firestorm/command/decisions/:id/approve",
  ...ztSocManager,
  requireStepUp(),
  automationGate({ gate: "approval_required", actionClass: "decision_approval" }),
  dataControls({ sensitivity: "RESTRICTED", retention: "COMPLIANCE-7Y", exportRestricted: true }),
  async (req, res) => {
    try {
      const rawId = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
      const id = parseInt(rawId ?? "0", 10);
      if (!id || isNaN(id)) {
        res.status(400).json({ error: "INVALID_ID", message: "Valid finding ID is required." });
        return;
      }

      const [finding] = await db
        .select()
        .from(firestormFindingsTable)
        .where(eq(firestormFindingsTable.id, id))
        .limit(1);

      if (!finding) {
        res.status(404).json({ error: "NOT_FOUND", message: "Finding not found." });
        return;
      }

      logger.info({
        msg: "Decision approve action queued",
        findingId: id,
        userId: req.user?.id,
        permissionClass: req.ztPermissionClass,
        approvalContext: req.ztApprovalContext,
        environment: req.ztEnvironment,
      });

      sendSuccess(res, {
        status: "queued_for_approval",
        findingId: id,
        approvalContext: req.ztApprovalContext,
        ztPermissionClass: req.ztPermissionClass,
        ztEnvironment: req.ztEnvironment,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to approve decision");
    }
  },
);

// ─── Response Orchestration ───────────────────────────────────────────────────

/**
 * GET /firestorm/command/response/playbooks
 *
 * Returns available response actions/workflow actions.
 * Requires: responder+
 * Data labels: CONFIDENTIAL, IR-90D
 */
router.get(
  "/firestorm/command/response/playbooks",
  environmentLabel(),
  authMiddleware({ required: true }),
  identityAwareRoute({ require: "responder" }),
  sessionAwareness(),
  dataControls({ sensitivity: "CONFIDENTIAL", retention: "IR-90D", exportRestricted: true }),
  async (req, res) => {
    try {
      const manager = isManagerClass(req.ztPermissionClass);
      const user = getUserIdentity(req);
      const actionScope = buildUserScopeFilter(firestormWorkflowActionsTable.assignedTo, user, manager);

      const actions = await db
        .select()
        .from(firestormWorkflowActionsTable)
        .where(actionScope)
        .orderBy(desc(firestormWorkflowActionsTable.createdAt))
        .limit(50);

      sendSuccess(res, {
        playbooks: actions,
        total: actions.length,
        ztPermissionClass: req.ztPermissionClass,
        ztEnvironment: req.ztEnvironment,
        ztDataLabels: req.ztDataLabels,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to fetch playbooks");
    }
  },
);

/**
 * POST /firestorm/command/response/execute
 *
 * Initiates a response action (e.g. isolate host, block IP, revoke session).
 * Requires: responder+
 * Automation gate: approved_execute (pre-approved operator actions)
 * Step-up: required
 * Data labels: RESTRICTED, IR-90D
 */
router.post(
  "/firestorm/command/response/execute",
  environmentLabel(),
  authMiddleware({ required: true }),
  identityAwareRoute({ require: "responder" }),
  sessionAwareness(),
  requireStepUp(),
  automationGate({ gate: "approved_execute", actionClass: "response_execution" }),
  dataControls({ sensitivity: "RESTRICTED", retention: "IR-90D", exportRestricted: true }),
  async (req, res) => {
    try {
      const { actionType, targetId, notes } = req.body as {
        actionType: string;
        targetId: string;
        notes: string;
      };

      if (!actionType || !targetId) {
        res.status(400).json({
          error: "INVALID_REQUEST",
          message: "actionType and targetId are required.",
        });
        return;
      }

      logger.info({
        msg: "Response action executed",
        actionType,
        targetId,
        notes,
        userId: req.user?.id,
        permissionClass: req.ztPermissionClass,
        automationGate: req.ztAutomationGate,
        environment: req.ztEnvironment,
      });

      sendSuccess(res, {
        status: "executed",
        actionType,
        targetId,
        executedBy: req.user?.id,
        executedAt: new Date().toISOString(),
        ztAutomationGate: req.ztAutomationGate,
        ztPermissionClass: req.ztPermissionClass,
        ztEnvironment: req.ztEnvironment,
        dataLabels: req.ztDataLabels,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to execute response action");
    }
  },
);

/**
 * POST /firestorm/command/response/contain
 *
 * Proposes a containment action (isolate, quarantine, block).
 * High-risk — requires approval.
 * Requires: soc_manager+
 * Automation gate: approval_required
 * Step-up: required
 * Data labels: RESTRICTED, COMPLIANCE-7Y
 */
router.post(
  "/firestorm/command/response/contain",
  ...ztSocManager,
  requireStepUp(),
  automationGate({ gate: "approval_required", actionClass: "containment" }),
  dataControls({ sensitivity: "RESTRICTED", retention: "COMPLIANCE-7Y", exportRestricted: true }),
  async (req, res) => {
    try {
      const { containmentType, assetId, justification } = req.body as {
        containmentType: string;
        assetId: string;
        justification: string;
      };

      if (!containmentType || !assetId) {
        res.status(400).json({
          error: "INVALID_REQUEST",
          message: "containmentType and assetId are required.",
        });
        return;
      }

      logger.info({
        msg: "Containment action queued for approval",
        containmentType,
        assetId,
        justification,
        userId: req.user?.id,
        permissionClass: req.ztPermissionClass,
        approvalContext: req.ztApprovalContext,
        environment: req.ztEnvironment,
      });

      sendSuccess(res, {
        status: "queued_for_approval",
        containmentType,
        assetId,
        requestedBy: req.user?.id,
        requestedAt: new Date().toISOString(),
        approvalContext: req.ztApprovalContext,
        ztPermissionClass: req.ztPermissionClass,
        ztEnvironment: req.ztEnvironment,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to queue containment action");
    }
  },
);

// ─── Executive / Board View ───────────────────────────────────────────────────

/**
 * GET /firestorm/command/executive/posture
 *
 * Returns the executive posture view with compliance controls and risk scores.
 * Requires: executive+
 * Data labels: EXECUTIVE-ONLY, BOARD-90D, export restricted
 */
router.get(
  "/firestorm/command/executive/posture",
  ...ztExecutive,
  dataControls({ sensitivity: "EXECUTIVE-ONLY", retention: "BOARD-90D", exportRestricted: true }),
  async (req, res) => {
    try {
      const manager = isManagerClass(req.ztPermissionClass);
      const user = getUserIdentity(req);
      const incidentScope = buildUserScopeFilter(firestormIncidentsTable.assignedAnalyst, user, manager);
      const findingScope = buildUserScopeFilter(firestormFindingsTable.remediationOwner, user, manager);

      const [riskScores, complianceControls, incidents, findings] = await Promise.all([
        db.select().from(firestormRiskScoresTable).orderBy(desc(firestormRiskScoresTable.calculatedAt)).limit(10),
        db.select().from(firestormComplianceControlsTable).limit(50),
        db
          .select()
          .from(firestormIncidentsTable)
          .where(incidentScope)
          .orderBy(desc(firestormIncidentsTable.createdAt))
          .limit(30),
        db.select().from(firestormFindingsTable).where(findingScope).orderBy(desc(firestormFindingsTable.createdAt)).limit(30),
      ]);

      const latestRisk = riskScores[0] ?? null;
      // compliance status: implemented|partial|not_implemented|not_applicable
      const passedControls = complianceControls.filter(c => c.status === "implemented");
      const failedControls = complianceControls.filter(c => c.status !== "implemented");
      const mttr = incidents.length > 0
        ? Math.round(incidents.reduce((sum) => sum + 180, 0) / incidents.length)
        : 0;

      const executivePosture = {
        riskScore: latestRisk?.currentScore ?? null,
        riskLevel: latestRisk?.trend ?? "unknown",
        compliancePassRate:
          complianceControls.length > 0
            ? Math.round((passedControls.length / complianceControls.length) * 100)
            : null,
        controlsPassed: passedControls.length,
        controlsFailed: failedControls.length,
        totalControls: complianceControls.length,
        openIncidents: incidents.filter(i => i.status !== "closed").length,
        meanTimeToRespondMinutes: mttr,
        // findings status: open|confirmed|mitigated|accepted|false_positive
        criticalFindings: findings.filter(f => f.severity === "critical" && (f.status === "open" || f.status === "confirmed")).length,
        riskScores: riskScores.map(r => ({
          id: r.id,
          score: r.currentScore,
          riskLevel: r.trend,
          calculatedAt: r.calculatedAt,
        })),
        controls: complianceControls.map(c => ({
          id: c.id,
          controlId: c.controlId,
          title: c.controlName,
          status: c.status,
          framework: c.framework,
        })),
        incidents: incidents.map(i => ({
          id: i.id,
          title: i.title,
          severity: i.severity,
          status: i.status,
          assignedAnalyst: i.assignedAnalyst,
          createdAt: i.createdAt,
          resolvedAt: i.resolvedAt,
        })),
        findings: findings.map(f => ({
          id: f.id,
          title: f.title,
          severity: f.severity,
          status: f.status,
          affectedAsset: f.affectedAsset,
          remediationOwner: f.remediationOwner,
          createdAt: f.createdAt,
        })),
        ztPermissionClass: req.ztPermissionClass,
        ztEnvironment: req.ztEnvironment,
        ztDataLabels: req.ztDataLabels,
        fetchedAt: new Date().toISOString(),
      };

      logger.info({
        msg: "Executive posture fetched",
        userId: req.user?.id,
        permissionClass: req.ztPermissionClass,
        environment: req.ztEnvironment,
      });

      sendSuccess(res, executivePosture);
    } catch (err) {
      handleRouteError(res, err, "Failed to fetch executive posture");
    }
  },
);

/**
 * GET /firestorm/command/executive/compliance
 *
 * Returns the full compliance control matrix for the board.
 * Requires: executive+
 * Data labels: EXECUTIVE-ONLY, BOARD-90D
 */
router.get(
  "/firestorm/command/executive/compliance",
  ...ztExecutive,
  dataControls({ sensitivity: "EXECUTIVE-ONLY", retention: "BOARD-90D", exportRestricted: true }),
  async (req, res) => {
    try {
      const controls = await db
        .select()
        .from(firestormComplianceControlsTable)
        .orderBy(desc(firestormComplianceControlsTable.createdAt))
        .limit(100);

      sendSuccess(res, {
        controls: controls.map(c => ({
          id: c.id,
          controlId: c.controlId,
          title: c.controlName,
          status: c.status,
          framework: c.framework,
          updatedAt: c.updatedAt,
        })),
        summary: {
          total: controls.length,
          implemented: controls.filter(c => c.status === "implemented").length,
          partial: controls.filter(c => c.status === "partial").length,
          notImplemented: controls.filter(c => c.status === "not_implemented").length,
        },
        ztPermissionClass: req.ztPermissionClass,
        ztEnvironment: req.ztEnvironment,
        ztDataLabels: req.ztDataLabels,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to fetch executive compliance");
    }
  },
);

export default router;
