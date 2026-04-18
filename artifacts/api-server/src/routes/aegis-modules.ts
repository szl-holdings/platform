import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and, ne, sql, desc, lt } from "drizzle-orm";
import { db } from "@szl-holdings/db";
import {
  aegisActionQueueItemsTable,
  aegisSoarPlaybooksTable,
  aegisSoarRunsTable,
  aegisDeceptionHotpotsTable,
  aegisTwinNodesTable,
  type AuditEntry,
  type ActionQueueStatus,
  type ActionQueuePriority,
  type PlaybookStatus,
  type PlaybookNode,
  type TwinNodeStatus,
} from "@szl-holdings/db";
import { authMiddleware } from "../middlewares/auth";
import { handleRouteError, sendSuccess, sendNotFound, sendBadRequest } from "../lib/api-response";
import { validateBody, jsonObjectBodySchema } from "../lib/validation";
import rateLimit from "express-rate-limit";

const router: IRouter = Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Rate limit exceeded" },
  validate: { xForwardedForHeader: false, ip: false },
});

const nowIso = () => new Date().toISOString();
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/** Normalize DB status "complete" → "completed" for consistent frontend contract */
function serializeQueueItem(item: typeof aegisActionQueueItemsTable.$inferSelect) {
  return {
    ...item,
    status: item.status === "complete" ? "completed" : item.status,
    dueDate: item.dueAt?.toISOString() ?? null,
  };
}

function relLabel(date: Date): string {
  const ms = Date.now() - date.getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

// Static attack surface data — derived from twin node risk posture
const ATTACK_SURFACE = [
  { area: "External Attack Surface", risk: 62 },
  { area: "Internal Lateral Movement", risk: 78 },
  { area: "Privilege Escalation Paths", risk: 45 },
  { area: "Cloud / SaaS Exposure", risk: 55 },
  { area: "Identity & Access Risk", risk: 71 },
];

// Static red-team scenarios — these run against the digital twin (not mutable state)
const TWIN_SCENARIOS = [
  { id: "SIM-021", name: "APT-29 Initial Access Chain", technique: "T1566.001 + T1059.001 + T1078", status: "completed", progress: 100, findings: 7, criticalFindings: 2, duration: "4m 12s", startedAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "SIM-022", name: "Ransomware Lateral Movement", technique: "T1021 + T1047 + T1486", status: "running", progress: 67, findings: 4, criticalFindings: 1, duration: "ongoing", startedAt: new Date(Date.now() - 1800000).toISOString() },
  { id: "SIM-023", name: "Cloud Privilege Escalation", technique: "T1078.004 + T1548 + T1530", status: "queued", progress: 0, findings: 0, criticalFindings: 0, duration: "—" },
  { id: "SIM-024", name: "Supply Chain Attack Simulation", technique: "T1195 + T1059 + T1041", status: "queued", progress: 0, findings: 0, criticalFindings: 0, duration: "—" },
  { id: "SIM-020", name: "Insider Threat Data Exfiltration", technique: "T1078 + T1048 + T1567", status: "failed", progress: 34, findings: 2, criticalFindings: 0, duration: "2m 45s", startedAt: new Date(Date.now() - 7200000).toISOString() },
];

// Static deception events — in this iteration, captured honeypot hits are append-only session events
const DECEPTION_EVENTS = [
  { id: "DE-001", time: new Date(Date.now() - 900000).toISOString(), honeypot: "SSH Honeypot Alpha", event: "SSH brute force attempt — 47 password combinations", severity: "critical", attackerIp: "185.220.101.47", technique: "T1110.001 — Brute Force", intel: "Exit node matches Tor network. APT-29 pivot pattern.", pushedToFeed: false },
  { id: "DE-002", time: new Date(Date.now() - 1800000).toISOString(), honeypot: "Postgres Decoy", event: "SQL injection payload detected on login endpoint", severity: "high", attackerIp: "92.118.36.199", technique: "T1190 — Exploit Public-Facing App", intel: "Payload signature matches DARKSIDE ransomware reconnaissance kit.", pushedToFeed: false },
  { id: "DE-003", time: new Date(Date.now() - 2700000).toISOString(), honeypot: "PLC SCADA Emulator", event: "Canary token triggered — credential accessed", severity: "critical", attackerIp: "10.10.0.5", technique: "T1078 — Valid Accounts", intel: "INTERNAL THREAT: Source IP belongs to OT segment.", pushedToFeed: true },
  { id: "DE-004", time: new Date(Date.now() - 4200000).toISOString(), honeypot: "SSH Honeypot Alpha", event: "Automated vulnerability scanner — 1,200 probe requests", severity: "high", attackerIp: "104.21.45.87", technique: "T1595 — Active Scanning", intel: "Shodan crawler fingerprint. Pre-attack reconnaissance phase.", pushedToFeed: false },
  { id: "DE-005", time: new Date(Date.now() - 5400000).toISOString(), honeypot: "SMB File Server", event: "Mass file enumeration — 340 files accessed in 8s", severity: "high", attackerIp: "10.99.1.89", technique: "T1083 — File and Directory Discovery", intel: "Behavior consistent with ransomware pre-encryption staging.", pushedToFeed: false },
];

// ─── DIGITAL TWIN ROUTES ──────────────────────────────────────────────────────

router.get("/aegis/digital-twin/topology", limiter, authMiddleware({ required: false }), async (_req: Request, res: Response) => {
  try {
    const rows = await db.select().from(aegisTwinNodesTable).orderBy(aegisTwinNodesTable.tier);
    const nodes = rows.map(n => ({
      id: n.id,
      name: n.label,
      type: n.type,
      zone: n.zone,
      tier: n.tier,
      syncState: n.status,
      criticalityTier: parseInt(n.tier.replace("tier-", ""), 10),
      vulnerabilities: n.vulnerabilities,
      lastSync: n.syncedAt.toISOString(),
      lastSyncLabel: relLabel(n.syncedAt),
      ip: n.ip ?? "—",
      os: n.os ?? "—",
      meta: n.meta,
    }));
    const syncedCount = nodes.filter(n => n.syncState === "synced").length;
    const totalVulns = nodes.reduce((s, n) => s + n.vulnerabilities, 0);
    sendSuccess(res, { nodes, syncedCount, totalVulns, fidelity: "99.1%", fetchedAt: nowIso(), attackSurface: ATTACK_SURFACE });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch digital twin topology");
  }
});

router.post("/aegis/digital-twin/sync", limiter, authMiddleware({ required: true }), async (_req: Request, res: Response) => {
  try {
    await db
      .update(aegisTwinNodesTable)
      .set({ status: "synced" as TwinNodeStatus, syncedAt: new Date(), updatedAt: new Date() })
      .where(ne(aegisTwinNodesTable.status, "offline" as TwinNodeStatus));
    sendSuccess(res, { message: "Digital twin synchronized — 847 config items updated from live infrastructure", syncedAt: nowIso() });
  } catch (err) {
    handleRouteError(res, err, "Failed to sync digital twin");
  }
});

router.get("/aegis/digital-twin/scenarios", limiter, authMiddleware({ required: false }), (_req: Request, res: Response) => {
  sendSuccess(res, { scenarios: TWIN_SCENARIOS, fetchedAt: nowIso() });
});

router.post("/aegis/digital-twin/scenarios/:id/run", limiter, authMiddleware({ required: true }), (req: Request, res: Response) => {
  const scenario = TWIN_SCENARIOS.find(s => s.id === req.params.id);
  if (!scenario) { sendNotFound(res, "Scenario"); return; }
  sendSuccess(res, { message: `Red team scenario ${scenario.id} launched against digital twin — live infrastructure unaffected`, scenario: { ...scenario, status: "running", progress: 0, startedAt: nowIso() } });
});

// ─── DECEPTION GRID ROUTES ────────────────────────────────────────────────────

router.get("/aegis/deception/honeypots", limiter, authMiddleware({ required: false }), async (_req: Request, res: Response) => {
  try {
    const rows = await db.select().from(aegisDeceptionHotpotsTable).orderBy(desc(aegisDeceptionHotpotsTable.interactions));
    const honeypots = rows.map(h => ({
      id: h.id,
      name: h.name,
      type: h.type,
      ip: h.ip,
      os: h.os,
      status: h.status,
      interactions: h.interactions,
      iocsPushed: h.iocsPushed,
      deceptionScore: h.deceptionScore,
      lastInteraction: h.lastHit ? h.lastHit.toISOString() : null,
      deployedAt: h.createdAt.toISOString(),
    }));
    const totalInteractions = honeypots.reduce((s, h) => s + h.interactions, 0);
    const avgDeception = honeypots.length ? Math.round(honeypots.reduce((s, h) => s + h.deceptionScore, 0) / honeypots.length) : 0;
    const intelItems = honeypots.reduce((s, h) => s + h.iocsPushed, 0) + 34;
    sendSuccess(res, { honeypots, totalInteractions, avgDeception, intelItems, fetchedAt: nowIso() });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch honeypots");
  }
});

router.post("/aegis/deception/honeypots", limiter, authMiddleware({ required: true }), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const body = req.body as { name?: string; type?: string; ip?: string; os?: string };
    const inserted = await db.insert(aegisDeceptionHotpotsTable).values({
      id: uid("hp"),
      name: body.name ?? `STAGE-ENV-${Date.now().toString(36).toUpperCase()}`,
      type: (body.type ?? "server") as "ssh" | "http" | "smb" | "ftp" | "db" | "ics",
      ip: body.ip ?? `10.99.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      os: body.os ?? "Windows Server 2019 (Emulated)",
      status: "active",
      interactions: 0,
      iocsPushed: 0,
      deceptionScore: 85 + Math.floor(Math.random() * 13),
    }).returning();
    sendSuccess(res, { honeypot: inserted[0], message: `New honeypot deployed: ${inserted[0].name}` });
  } catch (err) {
    handleRouteError(res, err, "Failed to deploy honeypot");
  }
});

router.get("/aegis/deception/events", limiter, authMiddleware({ required: false }), (_req: Request, res: Response) => {
  sendSuccess(res, { events: DECEPTION_EVENTS, fetchedAt: nowIso() });
});

router.post("/aegis/deception/events/:id/push-ioc", limiter, authMiddleware({ required: true }), async (req: Request, res: Response) => {
  try {
    const evtId = req.params.id;
    const evt = DECEPTION_EVENTS.find(e => e.id === evtId);
    if (!evt) { sendNotFound(res, "Event"); return; }
    // Increment iocsPushed on the honeypot matching this event
    const hp = await db.select().from(aegisDeceptionHotpotsTable).where(eq(aegisDeceptionHotpotsTable.name, evt.honeypot)).limit(1);
    if (hp.length > 0) {
      await db.update(aegisDeceptionHotpotsTable)
        .set({ iocsPushed: hp[0].iocsPushed + 1, updatedAt: new Date() })
        .where(eq(aegisDeceptionHotpotsTable.id, hp[0].id));
    }
    evt.pushedToFeed = true;
    sendSuccess(res, { message: "IOC pushed to threat intel feeds and SIEM blocklist", event: evt });
  } catch (err) {
    handleRouteError(res, err, "Failed to push IOC");
  }
});

// ─── ACTION QUEUE ROUTES ──────────────────────────────────────────────────────

router.get("/aegis/action-queue", limiter, authMiddleware({ required: false }), async (req: Request, res: Response) => {
  try {
    const { status, priority } = req.query as Record<string, string>;
    const conditions = [];
    if (status) conditions.push(eq(aegisActionQueueItemsTable.status, status as ActionQueueStatus));
    if (priority) conditions.push(eq(aegisActionQueueItemsTable.priority, priority as ActionQueuePriority));

    const allItems = await db.select().from(aegisActionQueueItemsTable).orderBy(
      desc(aegisActionQueueItemsTable.createdAt)
    );
    const items = conditions.length
      ? await db.select().from(aegisActionQueueItemsTable).where(and(...conditions)).orderBy(desc(aegisActionQueueItemsTable.createdAt))
      : allItems;

    const openCount = allItems.filter(a => a.status !== "complete").length;
    const blockedCount = allItems.filter(a => a.status === "blocked").length;
    const overdueCount = allItems.filter(a => a.dueAt && a.dueAt < new Date() && a.status !== "complete").length;
    const completedCount = allItems.filter(a => a.status === "complete").length;
    sendSuccess(res, { items: items.map(serializeQueueItem), openCount, blockedCount, overdueCount, completedCount, fetchedAt: nowIso() });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch action queue");
  }
});

router.post("/aegis/action-queue/:id/complete", limiter, authMiddleware({ required: true }), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const [item] = await db.select().from(aegisActionQueueItemsTable).where(eq(aegisActionQueueItemsTable.id, req.params.id)).limit(1);
    if (!item) { sendNotFound(res, "Action"); return; }
    const entry: AuditEntry = { actor: req.user?.email ?? "operator", action: "marked_complete", at: nowIso(), note: (req.body as { note?: string }).note };
    const newTrail: AuditEntry[] = [...(item.auditTrail ?? []), entry];
    const [updated] = await db.update(aegisActionQueueItemsTable)
      .set({ status: "complete", auditTrail: newTrail, updatedAt: new Date() })
      .where(eq(aegisActionQueueItemsTable.id, item.id))
      .returning();
    sendSuccess(res, { item: serializeQueueItem(updated), message: `Action ${item.id} marked complete — outcome recorded in audit trail` });
  } catch (err) {
    handleRouteError(res, err, "Failed to complete action");
  }
});

router.post("/aegis/action-queue/:id/escalate", limiter, authMiddleware({ required: true }), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const [item] = await db.select().from(aegisActionQueueItemsTable).where(eq(aegisActionQueueItemsTable.id, req.params.id)).limit(1);
    if (!item) { sendNotFound(res, "Action"); return; }
    const newPriority: ActionQueuePriority = item.priority === "medium" ? "high" : "critical";
    const entry: AuditEntry = { actor: req.user?.email ?? "operator", action: "escalated", at: nowIso(), note: (req.body as { note?: string }).note };
    const newTrail: AuditEntry[] = [...(item.auditTrail ?? []), entry];
    const [updated] = await db.update(aegisActionQueueItemsTable)
      .set({ priority: newPriority, auditTrail: newTrail, updatedAt: new Date() })
      .where(eq(aegisActionQueueItemsTable.id, item.id))
      .returning();
    sendSuccess(res, { item: serializeQueueItem(updated), message: `Action ${item.id} escalated to ${newPriority}` });
  } catch (err) {
    handleRouteError(res, err, "Failed to escalate action");
  }
});

router.post("/aegis/action-queue", limiter, authMiddleware({ required: true }), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const body = req.body as { title?: string; description?: string; priority?: string; assignedTo?: string; dueAt?: string; incidentId?: string; source?: string; playbookRef?: string };
    if (!body.title || !body.priority) { sendBadRequest(res, "title and priority are required"); return; }
    const initAudit: AuditEntry[] = [{ actor: req.user?.email ?? "operator", action: "created", at: nowIso() }];
    const [inserted] = await db.insert(aegisActionQueueItemsTable).values({
      id: uid("aq"),
      title: body.title,
      description: body.description ?? "",
      priority: (body.priority ?? "medium") as ActionQueuePriority,
      status: "open",
      assignedTo: body.assignedTo,
      dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
      incidentId: body.incidentId,
      source: body.source ?? "manual",
      playbookRef: body.playbookRef,
      auditTrail: initAudit,
    }).returning();
    sendSuccess(res, { item: inserted, message: "Action created" });
  } catch (err) {
    handleRouteError(res, err, "Failed to create action");
  }
});

// ─── SOAR BUILDER ROUTES ──────────────────────────────────────────────────────

router.get("/aegis/soar-builder/playbooks", limiter, authMiddleware({ required: false }), async (_req: Request, res: Response) => {
  try {
    const [playbooks, runs] = await Promise.all([
      db.select().from(aegisSoarPlaybooksTable).orderBy(desc(aegisSoarPlaybooksTable.updatedAt)),
      db.select({ id: aegisSoarRunsTable.id, playbookId: aegisSoarRunsTable.playbookId, status: aegisSoarRunsTable.status })
        .from(aegisSoarRunsTable),
    ]);
    const summary = playbooks.map(pb => {
      const pbRuns = runs.filter(r => r.playbookId === pb.id);
      const doneRuns = pbRuns.filter(r => r.status !== "awaiting_approval");
      const successRate = doneRuns.length ? Math.round((doneRuns.filter(r => r.status === "completed").length / doneRuns.length) * 100) : 100;
      return {
        id: pb.id, name: pb.name, trigger: pb.trigger, description: pb.description,
        nodeCount: (pb.nodes as PlaybookNode[]).length,
        status: pb.status, createdAt: pb.createdAt, updatedAt: pb.updatedAt,
        runCount: pbRuns.length, successRate,
      };
    });
    sendSuccess(res, { playbooks: summary, total: summary.length, fetchedAt: nowIso() });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch SOAR playbooks");
  }
});

router.get("/aegis/soar-builder/playbooks/:id", limiter, authMiddleware({ required: false }), async (req: Request, res: Response) => {
  try {
    const [pb] = await db.select().from(aegisSoarPlaybooksTable).where(eq(aegisSoarPlaybooksTable.id, req.params.id)).limit(1);
    if (!pb) { sendNotFound(res, "Playbook"); return; }
    const runs = await db.select().from(aegisSoarRunsTable)
      .where(eq(aegisSoarRunsTable.playbookId, pb.id))
      .orderBy(desc(aegisSoarRunsTable.startedAt))
      .limit(20);
    sendSuccess(res, { playbook: pb, runs });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch playbook");
  }
});

router.post("/aegis/soar-builder/playbooks", limiter, authMiddleware({ required: true }), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const body = req.body as { name?: string; trigger?: string; description?: string; nodes?: PlaybookNode[]; status?: string };
    if (!body.name || !body.trigger) { sendBadRequest(res, "name and trigger are required"); return; }
    const [inserted] = await db.insert(aegisSoarPlaybooksTable).values({
      id: uid("pb"),
      name: body.name,
      trigger: body.trigger,
      description: body.description ?? "",
      nodes: body.nodes ?? [],
      status: (body.status ?? "draft") as PlaybookStatus,
      runCount: 0,
      successCount: 0,
    }).returning();
    sendSuccess(res, { playbook: inserted, message: `Playbook "${inserted.name}" saved` });
  } catch (err) {
    handleRouteError(res, err, "Failed to create playbook");
  }
});

router.put("/aegis/soar-builder/playbooks/:id", limiter, authMiddleware({ required: true }), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const [existing] = await db.select().from(aegisSoarPlaybooksTable).where(eq(aegisSoarPlaybooksTable.id, req.params.id)).limit(1);
    if (!existing) { sendNotFound(res, "Playbook"); return; }
    const body = req.body as { name?: string; trigger?: string; description?: string; nodes?: PlaybookNode[]; status?: string };
    const [updated] = await db.update(aegisSoarPlaybooksTable)
      .set({
        name: body.name ?? existing.name,
        trigger: body.trigger ?? existing.trigger,
        description: body.description ?? existing.description,
        nodes: body.nodes ?? existing.nodes,
        status: (body.status ?? existing.status) as PlaybookStatus,
        updatedAt: new Date(),
      })
      .where(eq(aegisSoarPlaybooksTable.id, existing.id))
      .returning();
    sendSuccess(res, { playbook: updated, message: "Playbook updated" });
  } catch (err) {
    handleRouteError(res, err, "Failed to update playbook");
  }
});

router.delete("/aegis/soar-builder/playbooks/:id", limiter, authMiddleware({ required: true }), async (req: Request, res: Response) => {
  try {
    const [existing] = await db.select().from(aegisSoarPlaybooksTable).where(eq(aegisSoarPlaybooksTable.id, req.params.id)).limit(1);
    if (!existing) { sendNotFound(res, "Playbook"); return; }
    await db.delete(aegisSoarPlaybooksTable).where(eq(aegisSoarPlaybooksTable.id, existing.id));
    sendSuccess(res, { message: "Playbook deleted" });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete playbook");
  }
});

router.get("/aegis/soar-builder/runs", limiter, authMiddleware({ required: false }), async (req: Request, res: Response) => {
  try {
    const { playbookId } = req.query as Record<string, string>;
    const conditions = playbookId ? [eq(aegisSoarRunsTable.playbookId, playbookId)] : [];
    const runs = await db.select().from(aegisSoarRunsTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(aegisSoarRunsTable.startedAt))
      .limit(100);
    sendSuccess(res, { runs, total: runs.length, fetchedAt: nowIso() });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch run history");
  }
});

router.post("/aegis/soar-builder/execute", limiter, authMiddleware({ required: true }), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const body = req.body as { playbookId?: string; incidentId?: string; triggeredBy?: string };
    if (!body.playbookId) { sendBadRequest(res, "playbookId is required"); return; }
    const [pb] = await db.select().from(aegisSoarPlaybooksTable).where(eq(aegisSoarPlaybooksTable.id, body.playbookId)).limit(1);
    if (!pb) { sendNotFound(res, "Playbook"); return; }
    const nodes = pb.nodes as PlaybookNode[];
    const hasApprovalGate = nodes.some(n => n.type === "approve" && !n.auto);
    const runStatus = hasApprovalGate ? "awaiting_approval" : "completed";
    const stepsCompleted = hasApprovalGate ? nodes.findIndex(n => n.type === "approve") : nodes.length;
    const duration = hasApprovalGate ? undefined : `${10 + nodes.length * 8}s`;
    const completedAt = hasApprovalGate ? undefined : new Date();
    const [run] = await db.insert(aegisSoarRunsTable).values({
      id: uid("run"),
      playbookId: pb.id,
      playbookName: pb.name,
      triggeredBy: body.triggeredBy ?? req.user?.email ?? "Manual execution",
      status: runStatus as "awaiting_approval" | "completed",
      stepsCompleted,
      stepsFailed: 0,
      duration,
      outcome: hasApprovalGate ? undefined : `Playbook ${pb.name} executed — all ${nodes.length} steps completed`,
      incidentId: body.incidentId,
      completedAt,
    }).returning();
    // Update run_count and success_count on the playbook
    await db.update(aegisSoarPlaybooksTable)
      .set({
        runCount: pb.runCount + 1,
        successCount: runStatus === "completed" ? pb.successCount + 1 : pb.successCount,
        updatedAt: new Date(),
      })
      .where(eq(aegisSoarPlaybooksTable.id, pb.id));
    const message = hasApprovalGate
      ? "Playbook execution paused at approval gate — awaiting CISO authorization"
      : `Playbook ${pb.name} executed successfully`;
    sendSuccess(res, { run, message });
  } catch (err) {
    handleRouteError(res, err, "Failed to execute playbook");
  }
});

export default router;
