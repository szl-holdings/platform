import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  pcMattersTable,
  pcMatterClocksTable,
  pcClockEventsTable,
  pcClockRulesTable,
  pcNyRuleProfilesTable,
  pcNoFaultClaimsTable,
  pcVerificationRequestsTable,
  pcDenialsTable,
  pcAppealsTable,
  pcExternalAppealsTable,
  pcDisclaimersTable,
  pcCoveragePositionsTable,
  pcMedicalBillCyclesTable,
  pcOfferMovementsTable,
  pcReserveMovementsTable,
  pcMediationEventsTable,
  pcVenueProfilesTable,
  pcPartProfilesTable,
  pcInsurerProfilesTable,
  pcAdjusterProfilesTable,
  pcCommunicationWindowsTable,
  pcDemandPacketsTable,
  pcDemandReadinessSnapshotsTable,
  pcForecastRunsTable,
  pcForecastDriversTable,
  pcForecastExplanationsTable,
  pcAiReviewPacketsTable,
  pcDefensibilityScoresTable,
} from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";
import {
  sendSuccess,
  sendNotFound,
  sendForbidden,
  handleRouteError,
  sendBadRequest,
} from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";
import { runAllForecasts, runSingleForecast, type ForecastType } from "../lib/ny-forecast-engine";
import { seedNyDemoData } from "../lib/ny-demo-seed";

const router: IRouter = Router();

/* ── Helpers ── */

function getAuthOrgId(req: Request): number | null {
  const user = req.user;
  if (!user) return null;
  if (user.roles.includes("super_admin") || user.roles.includes("admin")) {
    return user.orgs[0]?.orgId ?? 1;
  }
  return user.orgs[0]?.orgId ?? null;
}

async function assertMatterAccess(matterId: number, orgId: number, res: Response): Promise<boolean> {
  const [matter] = await db.select({ id: pcMattersTable.id, orgId: pcMattersTable.orgId })
    .from(pcMattersTable).where(eq(pcMattersTable.id, matterId));
  if (!matter) { sendNotFound(res, "Matter not found"); return false; }
  if (matter.orgId !== orgId) { sendForbidden(res, "Access denied to this matter"); return false; }
  return true;
}

/* ── Health ── */
router.get("/prism-counsel/ny/health", (_req, res) => {
  res.json({ service: "prism-counsel-ny", status: "ok", timestamp: new Date().toISOString() });
});

/* ── Seed (admin only) ── */
router.post("/prism-counsel/ny/seed", authMiddleware(), async (req, res) => {
  try {
    const user = req.user;
    if (!user?.roles.includes("super_admin") && !user?.roles.includes("admin")) {
      return sendForbidden(res, "Admin access required");
    }
    const orgId = getAuthOrgId(req) ?? 1;
    await seedNyDemoData(orgId);
    sendSuccess(res, { message: "NY demo data seeded successfully", orgId });
  } catch (err) {
    handleRouteError(res, err, "POST /prism-counsel/ny/seed");
  }
});

/* ── Clock Rules ── */
router.get("/prism-counsel/ny/clock-rules", authMiddleware(), async (_req, res) => {
  try {
    const rules = await db.select().from(pcClockRulesTable).where(eq(pcClockRulesTable.isActive, true)).orderBy(pcClockRulesTable.clockType);
    sendSuccess(res, rules);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/clock-rules");
  }
});

router.get("/prism-counsel/ny/clock-rules/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [rule] = await db.select().from(pcClockRulesTable).where(eq(pcClockRulesTable.id, id));
    if (!rule) return sendNotFound(res, "Clock rule not found");
    sendSuccess(res, rule);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/clock-rules/:id");
  }
});

/* ── NY Rule Profiles ── */
router.get("/prism-counsel/ny/rule-profiles", authMiddleware(), async (_req, res) => {
  try {
    const profiles = await db.select().from(pcNyRuleProfilesTable).where(eq(pcNyRuleProfilesTable.isActive, true)).orderBy(pcNyRuleProfilesTable.category);
    sendSuccess(res, profiles);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/rule-profiles");
  }
});

/* ── Matter Clocks ── */
router.get("/prism-counsel/ny/matters/:matterId/clocks", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const clocks = await db.select().from(pcMatterClocksTable).where(eq(pcMatterClocksTable.matterId, matterId)).orderBy(pcMatterClocksTable.deadlineAt);
    sendSuccess(res, clocks);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/matters/:matterId/clocks");
  }
});

router.post("/prism-counsel/ny/matters/:matterId/clocks", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const body = req.body as Record<string, unknown>;
    if (!body.clockType || !body.startedAt || !body.deadlineAt) return sendBadRequest(res, "clockType, startedAt, deadlineAt are required");
    const [clock] = await db.insert(pcMatterClocksTable).values({
      orgId,
      matterId,
      clockType: String(body.clockType) as typeof pcMatterClocksTable.$inferInsert["clockType"],
      startedAt: new Date(String(body.startedAt)),
      deadlineAt: new Date(String(body.deadlineAt)),
      ruleRef: body.ruleRef ? String(body.ruleRef) : undefined,
      notes: body.notes ? String(body.notes) : undefined,
      actorId: req.user?.id,
    }).returning();
    sendSuccess(res, clock, 201);
  } catch (err) {
    handleRouteError(res, err, "POST /prism-counsel/ny/matters/:matterId/clocks");
  }
});

/* ── Clock Events ── */
router.get("/prism-counsel/ny/clocks/:clockId/events", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const clockId = parseIdParam(req.params.clockId);
    const [clock] = await db.select().from(pcMatterClocksTable).where(eq(pcMatterClocksTable.id, clockId));
    if (!clock || clock.orgId !== orgId) return sendForbidden(res, "Access denied");
    const events = await db.select().from(pcClockEventsTable).where(eq(pcClockEventsTable.clockId, clockId)).orderBy(desc(pcClockEventsTable.occurredAt));
    sendSuccess(res, events);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/clocks/:clockId/events");
  }
});

/* ── No-Fault Claims ── */
router.get("/prism-counsel/ny/matters/:matterId/no-fault-claims", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const claims = await db.select().from(pcNoFaultClaimsTable).where(eq(pcNoFaultClaimsTable.matterId, matterId)).orderBy(desc(pcNoFaultClaimsTable.createdAt));
    sendSuccess(res, claims);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/matters/:matterId/no-fault-claims");
  }
});

router.post("/prism-counsel/ny/matters/:matterId/no-fault-claims", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const body = req.body as Record<string, unknown>;
    if (!body.claimantName || !body.dateOfLoss) return sendBadRequest(res, "claimantName, dateOfLoss required");
    const [claim] = await db.insert(pcNoFaultClaimsTable).values({
      orgId,
      matterId,
      claimantName: String(body.claimantName),
      carrierName: body.carrierName ? String(body.carrierName) : undefined,
      dateOfLoss: new Date(String(body.dateOfLoss)),
      actorId: req.user?.id,
    }).returning();
    sendSuccess(res, claim, 201);
  } catch (err) {
    handleRouteError(res, err, "POST /prism-counsel/ny/matters/:matterId/no-fault-claims");
  }
});

/* ── Verification Requests ── */
router.get("/prism-counsel/ny/matters/:matterId/verifications", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const reqs = await db.select().from(pcVerificationRequestsTable).where(eq(pcVerificationRequestsTable.matterId, matterId)).orderBy(desc(pcVerificationRequestsTable.requestedAt));
    sendSuccess(res, reqs);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/matters/:matterId/verifications");
  }
});

/* ── Denials ── */
router.get("/prism-counsel/ny/matters/:matterId/denials", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const denials = await db.select().from(pcDenialsTable).where(eq(pcDenialsTable.matterId, matterId)).orderBy(desc(pcDenialsTable.deniedAt));
    sendSuccess(res, denials);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/matters/:matterId/denials");
  }
});

/* ── Appeals ── */
router.get("/prism-counsel/ny/matters/:matterId/appeals", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const appeals = await db.select().from(pcAppealsTable).where(eq(pcAppealsTable.matterId, matterId)).orderBy(desc(pcAppealsTable.createdAt));
    sendSuccess(res, appeals);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/matters/:matterId/appeals");
  }
});

router.post("/prism-counsel/ny/matters/:matterId/appeals", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const body = req.body as Record<string, unknown>;
    if (!body.appealType) return sendBadRequest(res, "appealType required");
    const [appeal] = await db.insert(pcAppealsTable).values({
      orgId,
      matterId,
      appealType: String(body.appealType) as typeof pcAppealsTable.$inferInsert["appealType"],
      denialId: body.denialId ? Number(body.denialId) : undefined,
      groundsForAppeal: body.groundsForAppeal ? String(body.groundsForAppeal) : undefined,
      actorId: req.user?.id,
    }).returning();
    sendSuccess(res, appeal, 201);
  } catch (err) {
    handleRouteError(res, err, "POST /prism-counsel/ny/matters/:matterId/appeals");
  }
});

/* ── External Appeals ── */
router.get("/prism-counsel/ny/matters/:matterId/external-appeals", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const appeals = await db.select().from(pcExternalAppealsTable).where(eq(pcExternalAppealsTable.matterId, matterId)).orderBy(desc(pcExternalAppealsTable.createdAt));
    sendSuccess(res, appeals);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/matters/:matterId/external-appeals");
  }
});

/* ── Disclaimers ── */
router.get("/prism-counsel/ny/matters/:matterId/disclaimers", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const disclaimers = await db.select().from(pcDisclaimersTable).where(eq(pcDisclaimersTable.matterId, matterId)).orderBy(desc(pcDisclaimersTable.issuedAt));
    sendSuccess(res, disclaimers);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/matters/:matterId/disclaimers");
  }
});

/* ── Coverage Positions ── */
router.get("/prism-counsel/ny/matters/:matterId/coverage-positions", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const positions = await db.select().from(pcCoveragePositionsTable).where(eq(pcCoveragePositionsTable.matterId, matterId)).orderBy(desc(pcCoveragePositionsTable.positionDate));
    sendSuccess(res, positions);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/matters/:matterId/coverage-positions");
  }
});

/* ── Medical Bill Cycles ── */
router.get("/prism-counsel/ny/matters/:matterId/medical-bills", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const bills = await db.select().from(pcMedicalBillCyclesTable).where(eq(pcMedicalBillCyclesTable.matterId, matterId)).orderBy(desc(pcMedicalBillCyclesTable.serviceDate));
    sendSuccess(res, bills);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/matters/:matterId/medical-bills");
  }
});

/* ── Offer Movements ── */
router.get("/prism-counsel/ny/matters/:matterId/offer-movements", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const offers = await db.select().from(pcOfferMovementsTable).where(eq(pcOfferMovementsTable.matterId, matterId)).orderBy(desc(pcOfferMovementsTable.offeredAt));
    sendSuccess(res, offers);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/matters/:matterId/offer-movements");
  }
});

router.post("/prism-counsel/ny/matters/:matterId/offer-movements", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const body = req.body as Record<string, unknown>;
    if (!body.offerType || !body.amount || !body.offeredAt) return sendBadRequest(res, "offerType, amount, offeredAt required");
    const [offer] = await db.insert(pcOfferMovementsTable).values({
      orgId,
      matterId,
      offerType: String(body.offerType) as typeof pcOfferMovementsTable.$inferInsert["offerType"],
      amount: String(body.amount),
      offeredAt: new Date(String(body.offeredAt)),
      offeringParty: body.offeringParty ? String(body.offeringParty) : undefined,
      notes: body.notes ? String(body.notes) : undefined,
      actorId: req.user?.id,
    }).returning();
    sendSuccess(res, offer, 201);
  } catch (err) {
    handleRouteError(res, err, "POST /prism-counsel/ny/matters/:matterId/offer-movements");
  }
});

/* ── Reserve Movements ── */
router.get("/prism-counsel/ny/matters/:matterId/reserve-movements", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const reserves = await db.select().from(pcReserveMovementsTable).where(eq(pcReserveMovementsTable.matterId, matterId)).orderBy(desc(pcReserveMovementsTable.reserveDate));
    sendSuccess(res, reserves);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/matters/:matterId/reserve-movements");
  }
});

/* ── Mediation Events ── */
router.get("/prism-counsel/ny/matters/:matterId/mediation-events", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const events = await db.select().from(pcMediationEventsTable).where(eq(pcMediationEventsTable.matterId, matterId)).orderBy(desc(pcMediationEventsTable.createdAt));
    sendSuccess(res, events);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/matters/:matterId/mediation-events");
  }
});

/* ── Communication Windows ── */
router.get("/prism-counsel/ny/matters/:matterId/communication-windows", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const windows = await db.select().from(pcCommunicationWindowsTable).where(eq(pcCommunicationWindowsTable.matterId, matterId)).orderBy(desc(pcCommunicationWindowsTable.updatedAt));
    sendSuccess(res, windows);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/matters/:matterId/communication-windows");
  }
});

/* ── Demand Packets ── */
router.get("/prism-counsel/ny/matters/:matterId/demand-packets", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const packets = await db.select().from(pcDemandPacketsTable).where(eq(pcDemandPacketsTable.matterId, matterId)).orderBy(desc(pcDemandPacketsTable.version));
    sendSuccess(res, packets);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/matters/:matterId/demand-packets");
  }
});

router.post("/prism-counsel/ny/matters/:matterId/demand-packets", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const body = req.body as Record<string, unknown>;
    const [packet] = await db.insert(pcDemandPacketsTable).values({
      orgId,
      matterId,
      demandAmount: body.demandAmount ? String(body.demandAmount) : undefined,
      notes: body.notes ? String(body.notes) : undefined,
      actorId: req.user?.id,
    }).returning();
    sendSuccess(res, packet, 201);
  } catch (err) {
    handleRouteError(res, err, "POST /prism-counsel/ny/matters/:matterId/demand-packets");
  }
});

/* ── Demand Readiness Snapshots ── */
router.get("/prism-counsel/ny/matters/:matterId/readiness-snapshots", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const snapshots = await db.select().from(pcDemandReadinessSnapshotsTable).where(eq(pcDemandReadinessSnapshotsTable.matterId, matterId)).orderBy(desc(pcDemandReadinessSnapshotsTable.computedAt));
    sendSuccess(res, snapshots);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/matters/:matterId/readiness-snapshots");
  }
});

/* ── Venue Profiles ── */
router.get("/prism-counsel/ny/venue-profiles", authMiddleware(), async (_req, res) => {
  try {
    const venues = await db.select().from(pcVenueProfilesTable).orderBy(pcVenueProfilesTable.county);
    sendSuccess(res, venues);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/venue-profiles");
  }
});

router.get("/prism-counsel/ny/venue-profiles/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [venue] = await db.select().from(pcVenueProfilesTable).where(eq(pcVenueProfilesTable.id, id));
    if (!venue) return sendNotFound(res, "Venue profile not found");
    const parts = await db.select().from(pcPartProfilesTable).where(eq(pcPartProfilesTable.venueId, id));
    sendSuccess(res, { ...venue, parts });
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/venue-profiles/:id");
  }
});

/* ── Insurer Profiles ── */
router.get("/prism-counsel/ny/insurer-profiles", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const insurers = await db.select().from(pcInsurerProfilesTable).where(eq(pcInsurerProfilesTable.orgId, orgId)).orderBy(pcInsurerProfilesTable.carrierName);
    sendSuccess(res, insurers);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/insurer-profiles");
  }
});

router.get("/prism-counsel/ny/insurer-profiles/:id", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const id = parseIdParam(req.params.id);
    const [insurer] = await db.select().from(pcInsurerProfilesTable).where(and(eq(pcInsurerProfilesTable.id, id), eq(pcInsurerProfilesTable.orgId, orgId)));
    if (!insurer) return sendNotFound(res, "Insurer profile not found");
    const adjusters = await db.select().from(pcAdjusterProfilesTable).where(eq(pcAdjusterProfilesTable.insurerProfileId, id));
    sendSuccess(res, { ...insurer, adjusters });
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/insurer-profiles/:id");
  }
});

/* ── Forecast Engine ── */
router.get("/prism-counsel/ny/matters/:matterId/forecasts", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const { type } = req.query as Record<string, string>;
    const conditions = type
      ? and(eq(pcForecastRunsTable.matterId, matterId), eq(pcForecastRunsTable.forecastType, type as ForecastType))
      : eq(pcForecastRunsTable.matterId, matterId);
    const forecasts = await db.select().from(pcForecastRunsTable).where(conditions).orderBy(desc(pcForecastRunsTable.runAt));
    sendSuccess(res, forecasts);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/matters/:matterId/forecasts");
  }
});

router.post("/prism-counsel/ny/matters/:matterId/forecasts/compute", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const { type } = req.body as { type?: string };
    if (type) {
      const result = await runSingleForecast(matterId, orgId, type as ForecastType, req.user?.id);
      sendSuccess(res, result, 201);
    } else {
      const results = await runAllForecasts(matterId, orgId, req.user?.id);
      sendSuccess(res, results, 201);
    }
  } catch (err) {
    handleRouteError(res, err, "POST /prism-counsel/ny/matters/:matterId/forecasts/compute");
  }
});

router.get("/prism-counsel/ny/matters/:matterId/forecasts/latest", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const FORECAST_TYPES: ForecastType[] = [
      "deadline_breach_risk", "no_fault_evidence_lock_risk", "disclaimer_vulnerability_score",
      "demand_readiness_score", "offer_movement_forecast", "mediation_conversion_probability",
      "venue_velocity_forecast", "ai_defensibility_score",
    ];
    const results = await Promise.all(
      FORECAST_TYPES.map((ft) =>
        db.select().from(pcForecastRunsTable)
          .where(and(eq(pcForecastRunsTable.matterId, matterId), eq(pcForecastRunsTable.forecastType, ft)))
          .orderBy(desc(pcForecastRunsTable.runAt)).limit(1)
          .then((rows) => rows[0] ?? null)
      )
    );
    sendSuccess(res, results.filter(Boolean));
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/matters/:matterId/forecasts/latest");
  }
});

/* ── AI Review Packets ── */
router.get("/prism-counsel/ny/matters/:matterId/ai-reviews", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const reviews = await db.select().from(pcAiReviewPacketsTable).where(and(eq(pcAiReviewPacketsTable.matterId, matterId), eq(pcAiReviewPacketsTable.orgId, orgId))).orderBy(desc(pcAiReviewPacketsTable.createdAt));
    sendSuccess(res, reviews);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/matters/:matterId/ai-reviews");
  }
});

router.patch("/prism-counsel/ny/ai-reviews/:id/approve", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const id = parseIdParam(req.params.id);
    const [review] = await db.select().from(pcAiReviewPacketsTable).where(and(eq(pcAiReviewPacketsTable.id, id), eq(pcAiReviewPacketsTable.orgId, orgId)));
    if (!review) return sendNotFound(res, "AI review packet not found");
    const [updated] = await db.update(pcAiReviewPacketsTable)
      .set({ status: "approved", approvedBy: req.user?.id, approvedAt: new Date() })
      .where(eq(pcAiReviewPacketsTable.id, id)).returning();
    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "PATCH /prism-counsel/ny/ai-reviews/:id/approve");
  }
});

/* ── Defensibility Scores ── */
router.get("/prism-counsel/ny/matters/:matterId/defensibility", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const [score] = await db.select().from(pcDefensibilityScoresTable).where(and(eq(pcDefensibilityScoresTable.matterId, matterId), eq(pcDefensibilityScoresTable.orgId, orgId))).orderBy(desc(pcDefensibilityScoresTable.computedAt)).limit(1);
    if (!score) return sendNotFound(res, "No defensibility score found");
    sendSuccess(res, score);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/matters/:matterId/defensibility");
  }
});

/* ── Matters List ── */
router.get("/prism-counsel/ny/matters", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matters = await db.select().from(pcMattersTable).where(eq(pcMattersTable.orgId, orgId)).orderBy(desc(pcMattersTable.updatedAt));
    sendSuccess(res, matters);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/matters");
  }
});

/* ── Matter Detail ── */
router.get("/prism-counsel/ny/matters/:matterId", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const [matter] = await db.select().from(pcMattersTable).where(and(eq(pcMattersTable.id, matterId), eq(pcMattersTable.orgId, orgId)));
    if (!matter) return sendNotFound(res, "Matter not found");
    sendSuccess(res, matter);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/matters/:matterId");
  }
});

/* ── Part Profiles ── */
router.get("/prism-counsel/ny/part-profiles", authMiddleware(), async (_req, res) => {
  try {
    const parts = await db.select().from(pcPartProfilesTable).orderBy(pcPartProfilesTable.partName);
    sendSuccess(res, parts);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/part-profiles");
  }
});

/* ── Demand Readiness (alias) ── */
router.get("/prism-counsel/ny/matters/:matterId/demand-readiness", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const [snap] = await db.select().from(pcDemandReadinessSnapshotsTable).where(and(eq(pcDemandReadinessSnapshotsTable.matterId, matterId), eq(pcDemandReadinessSnapshotsTable.orgId, orgId))).orderBy(desc(pcDemandReadinessSnapshotsTable.computedAt)).limit(1);
    if (!snap) return sendNotFound(res, "No readiness snapshot found");
    sendSuccess(res, snap);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/matters/:matterId/demand-readiness");
  }
});

/* ── Offer Movements (alias /offers) ── */
router.get("/prism-counsel/ny/matters/:matterId/offers", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const offers = await db.select().from(pcOfferMovementsTable).where(and(eq(pcOfferMovementsTable.matterId, matterId), eq(pcOfferMovementsTable.orgId, orgId))).orderBy(pcOfferMovementsTable.offeredAt);
    sendSuccess(res, offers);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/matters/:matterId/offers");
  }
});

/* ── Mediations (alias) ── */
router.get("/prism-counsel/ny/matters/:matterId/mediations", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const matterId = parseIdParam(req.params.matterId);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const evts = await db.select().from(pcMediationEventsTable).where(and(eq(pcMediationEventsTable.matterId, matterId), eq(pcMediationEventsTable.orgId, orgId))).orderBy(pcMediationEventsTable.scheduledAt);
    sendSuccess(res, evts);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/matters/:matterId/mediations");
  }
});

/* ── NY Dashboard Summary ── */
router.get("/prism-counsel/ny/dashboard", authMiddleware(), async (req, res) => {
  try {
    const orgId = getAuthOrgId(req);
    if (!orgId) return sendForbidden(res, "Authentication required");
    const [
      [{ activeMatters }],
      [{ criticalClocks }],
      [{ breachedClocks }],
      [{ pendingAppeals }],
    ] = await Promise.all([
      db.select({ activeMatters: sql<number>`count(*)::int` }).from(pcMattersTable).where(eq(pcMattersTable.orgId, orgId)),
      db.select({ criticalClocks: sql<number>`count(*)::int` }).from(pcMatterClocksTable).where(and(eq(pcMatterClocksTable.orgId, orgId), eq(pcMatterClocksTable.status, "running"))),
      db.select({ breachedClocks: sql<number>`count(*)::int` }).from(pcMatterClocksTable).where(and(eq(pcMatterClocksTable.orgId, orgId), eq(pcMatterClocksTable.isBreached, true))),
      db.select({ pendingAppeals: sql<number>`count(*)::int` }).from(pcAppealsTable).where(and(eq(pcAppealsTable.orgId, orgId), eq(pcAppealsTable.status, "pending"))),
    ]);
    sendSuccess(res, { activeMatters, criticalClocks, breachedClocks, pendingAppeals });
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/ny/dashboard");
  }
});

export default router;
