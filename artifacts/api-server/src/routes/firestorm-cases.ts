import { Router, type IRouter } from "express";
import {
  db,
  firestormCasesTable,
  firestormMitreDetectionsTable,
  firestormIncidentsTable,
  insertFirestormCaseSchema,
} from "@szl-holdings/db";
import { eq, desc, inArray } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, handleRouteError } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/firestorm/cases", authMiddleware({ required: false }), async (req, res) => {
  try {
    const statusFilter = req.query.status as string | undefined;
    const priorityFilter = req.query.priority as string | undefined;
    const cases = await db.select().from(firestormCasesTable).orderBy(desc(firestormCasesTable.createdAt));
    const filtered = cases.filter(c => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (priorityFilter && c.priority !== priorityFilter) return false;
      return true;
    });
    sendSuccess(res, filtered);
  } catch (err) { handleRouteError(res, err, "Failed to list cases"); }
});

router.get("/firestorm/cases/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [c] = await db.select().from(firestormCasesTable).where(eq(firestormCasesTable.id, id));
    if (!c) { sendNotFound(res, "Case"); return; }
    sendSuccess(res, c);
  } catch (err) { handleRouteError(res, err, "Failed to get case"); }
});

router.post("/firestorm/cases", authMiddleware({ required: true }), async (req, res) => {
  try {
    const data = insertFirestormCaseSchema.parse(req.body);
    const [c] = await db.insert(firestormCasesTable).values(data).returning();
    sendCreated(res, c);
  } catch (err) { handleRouteError(res, err, "Failed to create case"); }
});

router.patch("/firestorm/cases/:id", authMiddleware({ required: true }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const { status, priority, assignedAnalyst, note, evidenceItem } = req.body;
    const [current] = await db.select().from(firestormCasesTable).where(eq(firestormCasesTable.id, id));
    if (!current) { sendNotFound(res, "Case"); return; }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (assignedAnalyst !== undefined) updates.assignedAnalyst = assignedAnalyst;

    if (status === "in_progress" && current.status === "open" && !current.triagedAt) {
      updates.triagedAt = new Date();
    }
    if (status === "resolved" && !current.resolvedAt) {
      updates.resolvedAt = new Date();
    }

    const existingTrail = Array.isArray(current.auditTrail) ? current.auditTrail : [];
    const auditEntry = { action: `Status updated to ${status ?? current.status}`, user: req.body.updatedBy ?? "Operator", at: new Date().toISOString() };
    updates.auditTrail = [...existingTrail, auditEntry];

    if (note) {
      const existingNotes = Array.isArray(current.notes) ? current.notes : [];
      updates.notes = [...existingNotes, { content: note.content, author: note.author ?? "Analyst", at: new Date().toISOString() }];
    }

    if (evidenceItem) {
      const existingEvidence = Array.isArray(current.evidence) ? current.evidence : [];
      updates.evidence = [...existingEvidence, { ...evidenceItem, addedAt: new Date().toISOString() }];
    }

    const [updated] = await db.update(firestormCasesTable).set(updates).where(eq(firestormCasesTable.id, id)).returning();
    sendSuccess(res, updated);
  } catch (err) { handleRouteError(res, err, "Failed to update case"); }
});

router.get("/firestorm/mitre-detections", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const detections = await db.select().from(firestormMitreDetectionsTable).orderBy(desc(firestormMitreDetectionsTable.detectionCount));
    sendSuccess(res, detections);
  } catch (err) { handleRouteError(res, err, "Failed to list MITRE detections"); }
});

router.get("/firestorm/mitre-detections/:techniqueId", authMiddleware({ required: false }), async (req, res) => {
  try {
    const techniqueId = String(req.params.techniqueId);
    const [detection] = await db.select().from(firestormMitreDetectionsTable).where(eq(firestormMitreDetectionsTable.techniqueId, techniqueId));
    if (!detection) { sendNotFound(res, "MITRE detection"); return; }
    const relatedIncidents = detection.relatedIncidentIds?.length
      ? await db.select().from(firestormIncidentsTable).where(inArray(firestormIncidentsTable.id, detection.relatedIncidentIds as number[]))
      : [];
    sendSuccess(res, { ...detection, relatedIncidents });
  } catch (err) { handleRouteError(res, err, "Failed to get MITRE detection"); }
});

export default router;
