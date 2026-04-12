import { Router, type IRouter, type Request, type Response } from "express";
import { logger } from "../lib/logger";
import { pool } from "@szl-holdings/db";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { logAction, updateActionStatus, generateActionId } from "../lib/mastra/action-audit";

const router: IRouter = Router();

// ─── DB helpers ─────────────────────────────────────────────────────────────

async function ensureNexusTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "nexus_situation_rooms" (
      "id" text PRIMARY KEY NOT NULL,
      "name" text NOT NULL,
      "description" text NOT NULL DEFAULT '',
      "status" text NOT NULL DEFAULT 'active',
      "priority" text NOT NULL DEFAULT 'P2',
      "operators" jsonb NOT NULL DEFAULT '[]',
      "entities" jsonb NOT NULL DEFAULT '[]',
      "domains" jsonb NOT NULL DEFAULT '[]',
      "tag" text NOT NULL DEFAULT 'general',
      "created_at" timestamp NOT NULL DEFAULT now(),
      "updated_at" timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS "nexus_room_notes" (
      "id" text PRIMARY KEY NOT NULL,
      "room_id" text NOT NULL REFERENCES "nexus_situation_rooms"("id") ON DELETE CASCADE,
      "author" text NOT NULL DEFAULT 'Nexus Operator',
      "content" text NOT NULL,
      "created_at" timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS "nexus_proof_chain" (
      "id" text PRIMARY KEY NOT NULL,
      "action_id" text NOT NULL,
      "action_type" text NOT NULL,
      "operator" text NOT NULL DEFAULT 'Nexus Operator',
      "target_domain" text NOT NULL,
      "payload" jsonb NOT NULL DEFAULT '{}',
      "status" text NOT NULL DEFAULT 'executed',
      "decision" text,
      "tx_hash" text NOT NULL,
      "created_at" timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS "nexus_settings" (
      "id" text PRIMARY KEY NOT NULL DEFAULT 'global',
      "config" jsonb NOT NULL DEFAULT '{}',
      "updated_at" timestamp NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS "nexus_room_notes_room_id_idx" ON "nexus_room_notes"("room_id");
    CREATE INDEX IF NOT EXISTS "nexus_proof_chain_status_idx" ON "nexus_proof_chain"("status");
    CREATE INDEX IF NOT EXISTS "nexus_proof_chain_created_at_idx" ON "nexus_proof_chain"("created_at" DESC);
  `);

  // Seed default rooms if empty
  const { rows } = await pool.query(`SELECT id FROM nexus_situation_rooms LIMIT 1`);
  if (rows.length === 0) {
    await seedDefaultRooms();
  }
}

async function seedDefaultRooms() {
  const rooms = [
    {
      id: "room-001",
      name: "Operation Harbour Watch",
      description: "Investigation into beneficial ownership network connecting MV Pacific Star to distressed property portfolio and sanctions exposure.",
      status: "active",
      priority: "P0",
      operators: ["M. Reyes", "J. Chen", "L. Park"],
      entities: ["MV Pacific Star", "Horizon SPV Ltd", "Harbor View Complex", "PRISM: OFAC Exposure"],
      domains: ["vessels", "terra", "prism", "aegis"],
      tag: "sanctions",
      notes: [
        { id: "n1", author: "M. Reyes", content: "AIS analysis complete. Pacific Star shows 12 high-risk port calls in 90d. Escalated to Aegis SOC.", offsetMs: -3600000 },
        { id: "n2", author: "J. Chen", content: "PRISM pre-matter opened. Statutory window starts at T+14d. Assigned to lead counsel.", offsetMs: -1800000 },
      ],
      offsetMs: -86400000,
    },
    {
      id: "room-002",
      name: "Port Y Cascade Analysis",
      description: "Cross-domain analysis of Port Y congestion impact on cargo insurer exposure and PRISM compliance matters.",
      status: "active",
      priority: "P1",
      operators: ["A. Torres", "K. Ng"],
      entities: ["Port Y Congestion", "Cargo Insurer A", "MV Northern Light", "PRISM Compliance"],
      domains: ["vessels", "prism", "aegis"],
      tag: "maritime",
      notes: [
        { id: "n3", author: "A. Torres", content: "3 vessels confirmed delayed. Avg 4.2 day delay impacts charter payment schedule.", offsetMs: -7200000 },
      ],
      offsetMs: -172800000,
    },
    {
      id: "room-003",
      name: "SOC Incident: Supply Chain Compromise",
      description: "Critical incident response — supply chain compromise in vendor integration layer. Fleet telemetry and property portals potentially affected.",
      status: "active",
      priority: "P0",
      operators: ["R. Kim", "M. Reyes", "S. Okafor", "J. Chen"],
      entities: ["Vendor Layer Compromise", "Fleet Telemetry Endpoints", "Property SSO"],
      domains: ["aegis", "vessels", "terra", "prism"],
      tag: "incident",
      notes: [
        { id: "n4", author: "R. Kim", content: "Lateral movement confirmed. Vendor integration suspended. Fleet ops briefed — telemetry isolation in progress.", offsetMs: -900000 },
        { id: "n5", author: "S. Okafor", content: "PRISM breach notification runbook activated. Statutory window open. External counsel notified.", offsetMs: -600000 },
        { id: "n6", author: "J. Chen", content: "Property portal audit log review complete — 8 portals affected. Tenant managers notified.", offsetMs: -300000 },
      ],
      offsetMs: -3600000,
    },
  ];

  const now = Date.now();
  for (const room of rooms) {
    const createdAt = new Date(now + room.offsetMs);
    await pool.query(
      `INSERT INTO nexus_situation_rooms (id, name, description, status, priority, operators, entities, domains, tag, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10) ON CONFLICT (id) DO NOTHING`,
      [room.id, room.name, room.description, room.status, room.priority,
       JSON.stringify(room.operators), JSON.stringify(room.entities), JSON.stringify(room.domains),
       room.tag, createdAt]
    );
    for (const note of room.notes) {
      await pool.query(
        `INSERT INTO nexus_room_notes (id, room_id, author, content, created_at)
         VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
        [note.id, room.id, note.author, note.content, new Date(now + note.offsetMs)]
      );
    }
  }
}

// ─── Row → API shape ─────────────────────────────────────────────────────────

function rowToRoom(row: Record<string, unknown>, notes: Array<Record<string, unknown>> = []) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    priority: row.priority,
    operators: row.operators,
    entities: row.entities,
    domains: row.domains,
    tag: row.tag,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
    notes: notes.map(n => ({
      id: n.id,
      author: n.author,
      content: n.content,
      timestamp: (n.created_at as Date).toISOString(),
    })),
  };
}

function rowToProofEntry(row: Record<string, unknown>) {
  return {
    id: row.id,
    actionId: row.action_id,
    actionType: row.action_type,
    operator: row.operator,
    targetDomain: row.target_domain,
    payload: row.payload,
    status: row.status,
    decision: row.decision,
    timestamp: (row.created_at as Date).toISOString(),
    txHash: row.tx_hash,
  };
}

// Run table setup on startup
ensureNexusTables().catch(err => logger.error({ err }, "Failed to init Nexus DB tables"));

// ─── Entity definitions ───────────────────────────────────────────────────────
// NOTE: These are a static seed catalog representing cross-domain entities visible
// to Nexus operators. In a future iteration this catalog will be auto-populated by
// joining live records from Vessels AIS, Aegis SOC, Terra deals, PRISM matters, and
// Lyte approvals via the intelligence-mesh `/signals` feed. For now the static
// catalog provides a fully functional entity canvas and correlation surface.

const ENTITY_CATALOG = [
  { id: "ent-vessels-001", label: "MV Pacific Star", type: "Vessel", domain: "vessels", confidence: 0.92, metadata: { flag: "Panama", operator: "Horizon Shipping", risk: "High", imo: "9876543" } },
  { id: "ent-vessels-002", label: "Horizon Shipping Ltd", type: "Organization", domain: "vessels", confidence: 0.88, metadata: { jurisdiction: "UAE", status: "Active", risk: "Medium" } },
  { id: "ent-vessels-003", label: "Port Y Congestion", type: "Environmental Signal", domain: "vessels", confidence: 0.78, metadata: { port: "Port Y", level: "High", vessels_affected: "7" } },
  { id: "ent-vessels-004", label: "MV Northern Light", type: "Vessel", domain: "vessels", confidence: 0.83, metadata: { flag: "Liberia", operator: "Cascade Marine", delay_days: "4.2" } },
  { id: "ent-aegis-001", label: "APT41 TTP Cluster", type: "Threat Actor", domain: "aegis", confidence: 0.75, metadata: { attribution: "Highly Likely", type: "Nation State", ttps: "12 confirmed" } },
  { id: "ent-aegis-002", label: "OFAC SDN Match", type: "Compliance Event", domain: "aegis", confidence: 0.85, metadata: { aliases: "3 confirmed", date: "T-2d", severity: "Critical" } },
  { id: "ent-aegis-003", label: "Vendor Layer Compromise", type: "Security Incident", domain: "aegis", confidence: 0.97, metadata: { vector: "Supply Chain", status: "Active", severity: "P0" } },
  { id: "ent-terra-001", label: "123 Harbor View Complex", type: "Property", domain: "terra", confidence: 0.95, metadata: { owner: "Horizon SPV Ltd", distress: "High", units: "48" } },
  { id: "ent-terra-002", label: "Horizon SPV Ltd", type: "Entity / SPV", domain: "terra", confidence: 0.88, metadata: { registered: "BVI", owner_risk: "0.82" } },
  { id: "ent-prism-001", label: "Matter: Sanctions Exposure", type: "Legal Matter", domain: "prism", confidence: 0.82, metadata: { status: "Pre-matter", deadline: "T+14d", lead: "J. Chen" } },
  { id: "ent-prism-002", label: "PRISM: Breach Runbook", type: "Compliance Workflow", domain: "prism", confidence: 0.91, metadata: { status: "Active", window: "T+0", type: "Data Breach" } },
  { id: "ent-lyte-001", label: "Finance Queue Stall", type: "Workflow Anomaly", domain: "lyte", confidence: 0.90, metadata: { duration: "14 days", items: "23", owner: "Horizon entity" } },
];

const ENTITY_RELATIONSHIPS = [
  { from: "ent-vessels-001", to: "ent-terra-001", label: "Beneficial Owner", strength: 0.87 },
  { from: "ent-vessels-002", to: "ent-terra-002", label: "Same Entity", strength: 0.95 },
  { from: "ent-terra-002", to: "ent-prism-001", label: "OFAC Exposure", strength: 0.82 },
  { from: "ent-vessels-001", to: "ent-prism-001", label: "Legal Exposure", strength: 0.78 },
  { from: "ent-aegis-002", to: "ent-vessels-001", label: "SDN Hit", strength: 0.85 },
  { from: "ent-vessels-003", to: "ent-vessels-004", label: "Concurrent Delay", strength: 0.72 },
  { from: "ent-lyte-001", to: "ent-terra-002", label: "Owner-linked Deal", strength: 0.88 },
  { from: "ent-aegis-001", to: "ent-aegis-003", label: "Shared TTP", strength: 0.71 },
  { from: "ent-prism-001", to: "ent-prism-002", label: "Triggered By", strength: 0.79 },
  { from: "ent-aegis-003", to: "ent-terra-001", label: "Portal Affected", strength: 0.68 },
];

// ─── Correlation confidence scoring ─────────────────────────────────────────
// Uses the same rubric as core.ts scoring: severity → confidence tiers,
// weighted by domain breadth, entity count, and entity individual confidence scores.

function computeCorrelationConfidence(opts: {
  riskLevel: string;
  domainCount: number;
  entityIds: string[];
  evidenceCount: number;
}): number {
  // Severity tier base (mirrors core.ts lines 155-177 CVSS/incident severity logic)
  let base: number;
  switch (opts.riskLevel) {
    case "critical": base = 0.94; break;
    case "high":     base = 0.85; break;
    case "medium":   base = 0.72; break;
    default:         base = 0.60;
  }

  // Domain breadth bonus: more corroborating domains → higher confidence
  const domainBonus = Math.min((opts.domainCount - 1) * 0.025, 0.08);

  // Evidence weight: more evidence items → higher confidence (cap +0.05)
  const evidenceBonus = Math.min((opts.evidenceCount - 1) * 0.01, 0.05);

  // Average entity confidence from catalog
  const entityScores = opts.entityIds
    .map(id => ENTITY_CATALOG.find(e => e.id === id)?.confidence ?? 0.75)
    .filter(Boolean);
  const avgEntityConf = entityScores.length > 0
    ? entityScores.reduce((s, v) => s + v, 0) / entityScores.length
    : 0.75;

  // Weighted blend: base(60%) + entity avg(25%) + bonuses(15%)
  const raw = base * 0.60 + avgEntityConf * 0.25 + (domainBonus + evidenceBonus) * 0.60;
  return Math.round(Math.min(raw, 0.99) * 1000) / 1000;
}

// ─── Correlation patterns ─────────────────────────────────────────────────────

function buildCorrelations() {
  const patterns = [
    {
      id: "cor-001",
      title: "Beneficial Owner Network — Cross-Domain Exposure",
      narrative: "Vessel MV Pacific Star (Horizon Shipping) correlates with 3 distressed properties in Terra portfolio under same beneficial owner. Owner simultaneously subject to PRISM pre-matter intake for sanctions compliance. Approval chain in Lyte shows 11-day stall on owner-linked deal.",
      domains: ["vessels", "terra", "prism", "lyte"],
      entityIds: ["ent-vessels-001", "ent-terra-002", "ent-prism-001", "ent-lyte-001"],
      riskLevel: "critical",
      supportingEvidence: [
        "Vessels AIS: 12 port calls to sanctioned jurisdictions in 90 days",
        "Terra: Owner risk score 0.82 — exceeds 0.65 threshold",
        "PRISM: Pre-matter intake opened — statutory window T+14d",
        "Lyte: Deal approval stalled — same owner entity in ownership chain",
      ],
      suggestedActions: [
        "Escalate beneficial ownership investigation to Aegis",
        "Open formal PRISM matter — sanctions compliance review",
        "Freeze charter payments pending KYC refresh",
        "Assign Terra deal to senior review immediately",
      ],
      detectedAt: new Date(Date.now() - 3600000).toISOString(),
      compoundInsights: 4,
    },
    {
      id: "cor-002",
      title: "Port Congestion Cascade — Cargo Insurer Risk Amplification",
      narrative: "Port Y congestion spike correlates with 3-vessel delay cluster under same cargo insurer, which simultaneously has 3 open PRISM compliance matters. Aegis behavioral analysis detects unusual access patterns on cargo insurer portal consistent with pre-fraud indicators.",
      domains: ["vessels", "prism", "aegis"],
      entityIds: ["ent-vessels-003", "ent-vessels-004", "ent-prism-001", "ent-aegis-001"],
      riskLevel: "high",
      supportingEvidence: [
        "AIS: 3 vessels delayed at Port Y — avg 4.2 day delay",
        "Cargo insurer is counterparty on all 3 vessel charters",
        "PRISM: 3 open compliance matters against same insurer",
        "Aegis: Portal access anomaly — 2.3× above baseline",
      ],
      suggestedActions: [
        "Brief fleet operations on Port Y delay — request insurer status update",
        "Review PRISM matters for cargo insurance counterparty exposure",
        "Aegis SOC review of insurer portal anomaly — T+4h deadline",
      ],
      detectedAt: new Date(Date.now() - 7200000).toISOString(),
      compoundInsights: 3,
    },
    {
      id: "cor-003",
      title: "Supply Chain Compromise — Multi-Domain Asset Exposure",
      narrative: "Active SOC Incident (P0): Vendor integration layer compromise exposes fleet telemetry endpoints (Vessels), property portal SSO (Terra), and triggers PRISM breach notification statutory window. Aegis attributes lateral movement to APT41 TTP cluster.",
      domains: ["aegis", "vessels", "terra", "prism"],
      entityIds: ["ent-aegis-003", "ent-aegis-001", "ent-vessels-001", "ent-terra-001", "ent-prism-002"],
      riskLevel: "critical",
      supportingEvidence: [
        "Aegis SOC: Lateral movement confirmed — vendor integration suspended",
        "Fleet telemetry: 12 endpoint connections from anomalous IPs",
        "Terra: 8 property portals flagged — tenant data potentially exposed",
        "PRISM: Statutory breach notification window open — T+0",
        "Aegis: APT41 TTPs match 9 of 12 observed behaviors",
      ],
      suggestedActions: [
        "Immediate fleet telemetry isolation — suspend vendor integration",
        "Activate PRISM breach notification runbook — assign lead counsel",
        "Terra property portals: force re-auth for all tenant sessions",
        "Engage external IR firm — APT41 response protocol",
      ],
      detectedAt: new Date(Date.now() - 900000).toISOString(),
      compoundInsights: 5,
    },
    {
      id: "cor-004",
      title: "OFAC SDN Hit — Ownership Chain Propagation",
      narrative: "Aegis OFAC SDN match on beneficial owner propagates through Vessels charter agreements and Terra ownership records. PRISM counsel identifies 3 regulatory touch-points requiring 7-day response window.",
      domains: ["aegis", "vessels", "terra", "prism"],
      entityIds: ["ent-aegis-002", "ent-vessels-001", "ent-terra-002", "ent-prism-001"],
      riskLevel: "critical",
      supportingEvidence: [
        "Aegis: SDN match — 3 confirmed beneficial owner aliases",
        "Vessels: SDN entity listed as beneficial owner of 2 active charters",
        "Terra: Same entity holds SPV for 4 property assets under management",
        "PRISM: Regulatory exposure spans OFAC, UK sanctions, EU regulations",
      ],
      suggestedActions: [
        "Freeze charter payment approvals — notify counterparties within 24h",
        "PRISM: File OFAC voluntary self-disclosure — T+72h deadline",
        "Terra: Suspend property transactions pending ownership clearance",
        "Engage OFAC counsel for license application review",
      ],
      detectedAt: new Date(Date.now() - 14400000).toISOString(),
      compoundInsights: 4,
    },
    {
      id: "cor-005",
      title: "Lyte Workflow Stall — Regulatory Deadline Collision",
      narrative: "Finance approval queue stall in Lyte correlates with PRISM statutory deadline risk on 2 open matters. Terra deal tied to same ownership chain also approaching 30-day SLA breach. Aegis access log shows no unusual activity — likely organizational bottleneck.",
      domains: ["lyte", "prism", "terra"],
      entityIds: ["ent-lyte-001", "ent-prism-001", "ent-terra-001"],
      riskLevel: "medium",
      supportingEvidence: [
        "Lyte: 23 items in finance queue — median age 14 days, threshold 10 days",
        "PRISM: 2 matters have mandatory response due within 7 days",
        "Terra: Deal SLA breach projected at T+4d without approval",
        "Lyte ownership chain: same entity as PRISM matter subject",
      ],
      suggestedActions: [
        "Escalate Lyte queue to senior approver — bypass standard rotation",
        "PRISM: Set 7-day deadline alerts for both at-risk matters",
        "Terra: Get deal approval path confirmation from legal before T+4d",
      ],
      detectedAt: new Date(Date.now() - 28800000).toISOString(),
      compoundInsights: 3,
    },
  ];

  // Compute confidence scores using the rubric-driven scoring function
  return patterns.map(p => ({
    ...p,
    confidenceScore: computeCorrelationConfidence({
      riskLevel: p.riskLevel,
      domainCount: p.domains.length,
      entityIds: p.entityIds,
      evidenceCount: p.supportingEvidence.length,
    }),
  }));
}

// ─── Situation Rooms ─────────────────────────────────────────────────────────

router.get("/situation-rooms", authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const { rows: roomRows } = await pool.query(
      `SELECT * FROM nexus_situation_rooms ORDER BY created_at DESC`
    );
    const roomIds = roomRows.map((r: Record<string, unknown>) => r.id);
    let noteRows: Array<Record<string, unknown>> = [];
    if (roomIds.length > 0) {
      const { rows } = await pool.query(
        `SELECT * FROM nexus_room_notes WHERE room_id = ANY($1::text[]) ORDER BY created_at ASC`,
        [roomIds]
      );
      noteRows = rows;
    }
    const notesByRoom = new Map<string, Array<Record<string, unknown>>>();
    for (const note of noteRows) {
      const rid = note.room_id as string;
      if (!notesByRoom.has(rid)) notesByRoom.set(rid, []);
      notesByRoom.get(rid)!.push(note);
    }
    const rooms = roomRows.map((r: Record<string, unknown>) =>
      rowToRoom(r, notesByRoom.get(r.id as string) ?? [])
    );
    res.json({ rooms, count: rooms.length });
  } catch (err) {
    logger.error({ err }, "Failed to get situation rooms");
    res.status(500).json({ error: "Failed to get situation rooms" });
  }
});

router.get("/situation-rooms/:roomId", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM nexus_situation_rooms WHERE id = $1`, [req.params.roomId]);
    if (rows.length === 0) { res.status(404).json({ error: "Room not found" }); return; }
    const { rows: noteRows } = await pool.query(
      `SELECT * FROM nexus_room_notes WHERE room_id = $1 ORDER BY created_at ASC`,
      [req.params.roomId]
    );
    res.json(rowToRoom(rows[0], noteRows));
  } catch (err) {
    res.status(500).json({ error: "Failed to get situation room" });
  }
});

router.post("/situation-rooms", authMiddleware(), requireRole("ops", "exec", "admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const { name, description, priority = "P2", tag = "general" } = req.body;
    if (!name) { res.status(400).json({ error: "name is required" }); return; }
    const id = `room-${Date.now()}`;
    const { rows } = await pool.query(
      `INSERT INTO nexus_situation_rooms (id, name, description, priority, tag, operators, entities, domains)
       VALUES ($1,$2,$3,$4,$5,'["Nexus Operator"]','[]','[]') RETURNING *`,
      [id, name, description || "", priority, tag]
    );
    res.status(201).json(rowToRoom(rows[0], []));
  } catch (err) {
    logger.error({ err }, "Failed to create situation room");
    res.status(500).json({ error: "Failed to create situation room" });
  }
});

router.patch("/situation-rooms/:roomId", authMiddleware(), requireRole("ops", "exec", "admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const { status, priority, name, description } = req.body;

    const VALID_ROOM_STATUSES = ["active", "resolved", "archived", "escalated"];
    if (status !== undefined && !VALID_ROOM_STATUSES.includes(status)) {
      res.status(400).json({ error: `status must be one of: ${VALID_ROOM_STATUSES.join(", ")}` });
      return;
    }
    const VALID_PRIORITIES = ["P0", "P1", "P2", "P3"];
    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      res.status(400).json({ error: `priority must be one of: ${VALID_PRIORITIES.join(", ")}` });
      return;
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    if (status) { updates.push(`status = $${idx++}`); values.push(status); }
    if (priority) { updates.push(`priority = $${idx++}`); values.push(priority); }
    if (name) { updates.push(`name = $${idx++}`); values.push(name); }
    if (description !== undefined) { updates.push(`description = $${idx++}`); values.push(description); }
    updates.push(`updated_at = now()`);
    values.push(req.params.roomId);
    const { rows } = await pool.query(
      `UPDATE nexus_situation_rooms SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (rows.length === 0) { res.status(404).json({ error: "Room not found" }); return; }
    const { rows: noteRows } = await pool.query(
      `SELECT * FROM nexus_room_notes WHERE room_id = $1 ORDER BY created_at ASC`,
      [req.params.roomId]
    );
    res.json(rowToRoom(rows[0], noteRows));
  } catch (err) {
    res.status(500).json({ error: "Failed to update situation room" });
  }
});

router.post("/situation-rooms/:roomId/notes", authMiddleware(), requireRole("ops", "exec", "admin", "super_admin", "analyst"), async (req: Request, res: Response) => {
  try {
    const { rows: roomCheck } = await pool.query(`SELECT id FROM nexus_situation_rooms WHERE id = $1`, [req.params.roomId]);
    if (roomCheck.length === 0) { res.status(404).json({ error: "Room not found" }); return; }
    const { content } = req.body;
    if (!content) { res.status(400).json({ error: "content is required" }); return; }
    const author = req.user?.displayName ?? req.user?.email ?? "Nexus Operator";
    const noteId = `note-${Date.now()}`;
    const { rows } = await pool.query(
      `INSERT INTO nexus_room_notes (id, room_id, author, content) VALUES ($1,$2,$3,$4) RETURNING *`,
      [noteId, req.params.roomId, author, content]
    );
    await pool.query(`UPDATE nexus_situation_rooms SET updated_at = now() WHERE id = $1`, [req.params.roomId]);
    const note = rows[0];
    res.status(201).json({ id: note.id, author: note.author, content: note.content, timestamp: (note.created_at as Date).toISOString() });
  } catch (err) {
    res.status(500).json({ error: "Failed to add note" });
  }
});

router.post("/situation-rooms/:roomId/handoff", authMiddleware(), requireRole("ops", "exec", "admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const { rows: roomCheck } = await pool.query(`SELECT id FROM nexus_situation_rooms WHERE id = $1`, [req.params.roomId]);
    if (roomCheck.length === 0) { res.status(404).json({ error: "Room not found" }); return; }

    const { assignTo, removeFrom, note, escalate } = req.body as {
      assignTo?: unknown;
      removeFrom?: unknown;
      note?: string;
      escalate?: boolean;
    };

    if (!assignTo && !removeFrom) {
      res.status(400).json({ error: "assignTo or removeFrom is required" });
      return;
    }

    // Validate assignTo/removeFrom are non-empty string arrays
    const isStringArray = (v: unknown): v is string[] =>
      Array.isArray(v) && v.length > 0 && v.every(x => typeof x === "string" && x.trim().length > 0);

    if (assignTo !== undefined && !isStringArray(assignTo)) {
      res.status(400).json({ error: "assignTo must be a non-empty array of strings" });
      return;
    }
    if (removeFrom !== undefined && !isStringArray(removeFrom)) {
      res.status(400).json({ error: "removeFrom must be a non-empty array of strings" });
      return;
    }

    const handoverOperator = req.user?.displayName ?? req.user?.email ?? "Nexus Operator";

    // Get current operators
    const { rows: current } = await pool.query(`SELECT operators FROM nexus_situation_rooms WHERE id = $1`, [req.params.roomId]);
    let operators: string[] = Array.isArray(current[0]?.operators) ? current[0].operators : [];

    if (removeFrom) {
      operators = operators.filter((op: string) => !removeFrom.includes(op));
    }
    if (assignTo) {
      for (const op of assignTo) {
        if (!operators.includes(op)) operators.push(op);
      }
    }

    const updates: string[] = [`operators = $1`, `updated_at = now()`];
    const values: unknown[] = [JSON.stringify(operators)];

    if (escalate) {
      updates.push(`status = 'escalated'`);
    }

    const { rows } = await pool.query(
      `UPDATE nexus_situation_rooms SET ${updates.join(", ")} WHERE id = $2 RETURNING *`,
      [...values, req.params.roomId]
    );

    // Log handoff as a note for audit trail
    const handoffDetails = [
      assignTo?.length ? `Assigned to: ${assignTo.join(", ")}` : null,
      removeFrom?.length ? `Removed: ${removeFrom.join(", ")}` : null,
      escalate ? "Room escalated" : null,
      note ?? null,
    ].filter(Boolean).join(" | ");

    const noteId = `note-handoff-${Date.now()}`;
    const noteContent = `[HANDOFF by ${handoverOperator}] ${handoffDetails}`;
    await pool.query(
      `INSERT INTO nexus_room_notes (id, room_id, author, content) VALUES ($1,$2,$3,$4)`,
      [noteId, req.params.roomId, handoverOperator, noteContent]
    );

    // Log to central audit trail
    await logAction({
      actionId: generateActionId(),
      actionType: "workflow_triggered",
      triggeredBy: handoverOperator,
      domain: "nexus",
      toolName: "situation_room_handoff",
      input: { roomId: req.params.roomId, assignTo, removeFrom, escalate, note },
      output: { operators },
      status: "completed",
      approvalRequired: false,
      metadata: { source: "nexus-situation-rooms", handoffType: escalate ? "escalation" : "assignment" },
    });

    await pool.query(`UPDATE nexus_situation_rooms SET updated_at = now() WHERE id = $1`, [req.params.roomId]);
    const { rows: noteRows } = await pool.query(
      `SELECT * FROM nexus_room_notes WHERE room_id = $1 ORDER BY created_at ASC`,
      [req.params.roomId]
    );
    res.json(rowToRoom(rows[0], noteRows));
  } catch (err) {
    logger.error({ err }, "Failed to process room handoff");
    res.status(500).json({ error: "Failed to process room handoff" });
  }
});

router.delete("/situation-rooms/:roomId/notes/:noteId", authMiddleware(), requireRole("ops", "exec", "admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM nexus_room_notes WHERE id = $1 AND room_id = $2`,
      [req.params.noteId, req.params.roomId]
    );
    if (rowCount === 0) { res.status(404).json({ error: "Note not found" }); return; }
    await pool.query(`UPDATE nexus_situation_rooms SET updated_at = now() WHERE id = $1`, [req.params.roomId]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete note" });
  }
});

// ─── Settings ────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  domainToggles: { vessels: true, aegis: true, terra: true, prism: true, lyte: true },
  correlationThreshold: 0.6,
  autoRefreshInterval: 30,
};

router.get("/settings", authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`SELECT config FROM nexus_settings WHERE id = 'global'`);
    const config = rows.length > 0 ? rows[0].config : DEFAULT_SETTINGS;
    res.json({ config });
  } catch (err) {
    logger.error({ err }, "Failed to get nexus settings");
    res.status(500).json({ error: "Failed to get settings" });
  }
});

router.put("/settings", authMiddleware(), requireRole("ops", "exec", "admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const { domainToggles, correlationThreshold, autoRefreshInterval } = req.body as {
      domainToggles?: Record<string, boolean>;
      correlationThreshold?: number;
      autoRefreshInterval?: number;
    };

    if (correlationThreshold !== undefined) {
      if (typeof correlationThreshold !== "number" || correlationThreshold < 0 || correlationThreshold > 1) {
        res.status(400).json({ error: "correlationThreshold must be a number between 0 and 1" });
        return;
      }
    }
    if (autoRefreshInterval !== undefined) {
      if (![10, 30, 60, 120].includes(autoRefreshInterval)) {
        res.status(400).json({ error: "autoRefreshInterval must be 10, 30, 60, or 120" });
        return;
      }
    }

    const existing = await pool.query(`SELECT config FROM nexus_settings WHERE id = 'global'`);
    const current = existing.rows.length > 0 ? existing.rows[0].config : { ...DEFAULT_SETTINGS };
    const merged = {
      ...current,
      ...(domainToggles !== undefined ? { domainToggles } : {}),
      ...(correlationThreshold !== undefined ? { correlationThreshold } : {}),
      ...(autoRefreshInterval !== undefined ? { autoRefreshInterval } : {}),
    };

    await pool.query(
      `INSERT INTO nexus_settings (id, config, updated_at) VALUES ('global', $1, now())
       ON CONFLICT (id) DO UPDATE SET config = $1, updated_at = now()`,
      [JSON.stringify(merged)]
    );

    res.json({ config: merged });
  } catch (err) {
    logger.error({ err }, "Failed to save nexus settings");
    res.status(500).json({ error: "Failed to save settings" });
  }
});

// ─── Entity Canvas / Resolution ──────────────────────────────────────────────

router.get("/entities", authMiddleware(), (req: Request, res: Response) => {
  try {
    const domain = req.query.domain as string | undefined;
    const entities = domain ? ENTITY_CATALOG.filter(e => e.domain === domain) : ENTITY_CATALOG;
    res.json({ entities, relationships: ENTITY_RELATIONSHIPS, count: entities.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to get entities" });
  }
});

router.get("/entities/:entityId", authMiddleware(), (req: Request, res: Response) => {
  try {
    const entity = ENTITY_CATALOG.find(e => e.id === req.params.entityId);
    if (!entity) { res.status(404).json({ error: "Entity not found" }); return; }
    const relationships = ENTITY_RELATIONSHIPS.filter(r => r.from === entity.id || r.to === entity.id);
    res.json({ entity, relationships });
  } catch (err) {
    res.status(500).json({ error: "Failed to get entity" });
  }
});

// ─── Correlations ─────────────────────────────────────────────────────────────

router.get("/correlations", authMiddleware(), (req: Request, res: Response) => {
  try {
    const correlations = buildCorrelations();
    const riskLevel = req.query.riskLevel as string | undefined;
    const domain = req.query.domain as string | undefined;
    let filtered = correlations;
    if (riskLevel) filtered = filtered.filter(c => c.riskLevel === riskLevel);
    if (domain) filtered = filtered.filter(c => c.domains.includes(domain));
    res.json({ correlations: filtered, count: filtered.length, generatedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: "Failed to get correlations" });
  }
});

// ─── Command Actions + Proof Chain ───────────────────────────────────────────

router.get("/proof-chain", authMiddleware(), requireRole("ops", "exec", "admin", "super_admin", "compliance"), async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const { rows, rowCount: _ } = await pool.query(
      `SELECT * FROM nexus_proof_chain ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    const totalRes = await pool.query(`SELECT COUNT(*) FROM nexus_proof_chain`);
    res.json({
      entries: rows.map((r: Record<string, unknown>) => rowToProofEntry(r)),
      count: parseInt(totalRes.rows[0].count, 10),
    });
  } catch (err) {
    logger.error({ err }, "Failed to get proof chain");
    res.status(500).json({ error: "Failed to get proof chain" });
  }
});

// ─── Domain dispatch for command actions ─────────────────────────────────────
// Each action type maps to a concrete downstream domain endpoint.
// Dispatch is fire-and-forget for non-blocking; result is captured in proof chain status.

type DomainDispatchResult = { success: boolean; detail?: string; statusCode?: number };

async function dispatchToDomain(
  actionType: string,
  targetDomain: string,
  payload: Record<string, unknown>,
  operator: string,
  authHeader?: string,
  authCookie?: string
): Promise<DomainDispatchResult> {
  const base = `http://localhost:${process.env.PORT ?? 8080}`;
  const internalToken = process.env.ALLOY_INTERNAL_TOKEN;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Operator": operator,
  };

  // Prefer internal service token when available; fall back to proxying the caller's auth
  if (internalToken) {
    headers["x-internal-token"] = internalToken;
  } else if (authHeader) {
    headers["Authorization"] = authHeader;
  } else if (authCookie) {
    headers["Cookie"] = `sid=${authCookie}`;
  } else {
    // No auth material — return audit_only rather than attempting unauthenticated dispatch
    return { success: true, detail: "audit_only:no_internal_token_configured" };
  }

  try {
    let url: string | null = null;
    let body: Record<string, unknown> = { ...payload };

    // --- Aegis / Firestorm ---
    // Handles: escalate, escalate_incident, escalation, acknowledge_alert, acknowledge, threat_brief, intelligence_brief
    if (targetDomain === "aegis" || targetDomain === "firestorm") {
      if (actionType === "escalate" || actionType === "escalate_incident" || actionType === "escalation") {
        url = `${base}/api/firestorm/workflow-actions`;
        body = { type: "escalate", incidentId: payload.incidentId, reason: payload.reason ?? "Nexus cross-domain escalation", triggeredBy: operator };
      } else if (actionType === "acknowledge_alert" || actionType === "acknowledge") {
        url = `${base}/api/firestorm/workflow-actions`;
        body = { type: "acknowledge", incidentId: payload.incidentId, triggeredBy: operator };
      } else if (actionType === "threat_brief" || actionType === "intelligence_brief") {
        url = `${base}/api/firestorm/workflow-actions`;
        body = { type: "acknowledge", triggeredBy: operator, note: "Nexus intelligence brief requested", ...payload };
      }
    }
    // --- Terra ---
    // Handles: initiate_review, sync_listings, mls_sync, commercial_sync
    else if (targetDomain === "terra") {
      if (actionType === "initiate_review" || actionType === "sync_listings" || actionType === "mls_sync") {
        url = `${base}/api/terra/enterprise/sync/mls`;
        body = { triggeredBy: operator, source: "nexus", actionType };
      } else if (actionType === "commercial_sync") {
        url = `${base}/api/terra/enterprise/sync/commercial`;
        body = { triggeredBy: operator, source: "nexus" };
      }
    }
    // --- Vessels ---
    // Handles: flag_vessel, fleet_alert, alert_rule, command_workflow, vessel_command
    else if (targetDomain === "vessels") {
      if (actionType === "flag_vessel" || actionType === "fleet_alert" || actionType === "alert_rule") {
        url = `${base}/api/vessels/alert-rules`;
        body = { name: `Nexus ${actionType} ${Date.now()}`, triggeredBy: operator, condition: actionType, severity: payload.severity ?? "high", ...payload };
      } else if (actionType === "command_workflow" || actionType === "vessel_command") {
        url = `${base}/api/vessels/command-workflows`;
        body = { triggeredBy: operator, source: "nexus", ...payload };
      }
    }
    // --- PRISM Counsel ---
    // Handles: create_matter, open_matter, approve_matter
    else if (targetDomain === "prism") {
      if (actionType === "create_matter" || actionType === "open_matter") {
        url = `${base}/api/prism-counsel/matters`;
        body = { title: payload.title ?? "Nexus Cross-Domain Matter", description: payload.description ?? "Matter opened via Nexus Command Action", triggeredBy: operator };
      } else if (actionType === "approve_matter" && payload.matterId) {
        url = `${base}/api/prism-counsel/approvals/${payload.matterId}/approve`;
        body = { approvedBy: operator, notes: payload.notes ?? "Approved via Nexus command action" };
      }
    }
    // --- Lyte ---
    // Handles: freeze, trigger_playbook, playbook, log_incident, platform_incident, execute_action, lyte_action
    else if (targetDomain === "lyte") {
      if (actionType === "freeze" || actionType === "trigger_playbook" || actionType === "playbook") {
        url = `${base}/api/lyte/playbooks`;
        body = { name: `Nexus ${actionType} ${Date.now()}`, triggeredBy: operator, source: "nexus", actionType, ...payload };
      } else if (actionType === "log_incident" || actionType === "platform_incident") {
        url = `${base}/api/lyte/incidents`;
        body = { title: payload.title ?? "Nexus Cross-Domain Incident", severity: payload.severity ?? "medium", triggeredBy: operator, source: "nexus" };
      } else if (actionType === "execute_action" || actionType === "lyte_action") {
        url = `${base}/api/lyte/actions`;
        body = { type: actionType, triggeredBy: operator, source: "nexus", ...payload };
      }
    }

    if (!url) {
      // Unknown action type — log to audit only, mark with a distinct non-success token
      return { success: false, detail: `no_handler:${actionType}@${targetDomain}` };
    }

    const resp = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    const text = await resp.text().catch(() => "");
    if (!resp.ok) {
      return { success: false, detail: `domain_error:${resp.status}:${text.slice(0, 200)}`, statusCode: resp.status };
    }
    return { success: true, detail: `dispatched:${url.split("/api")[1]}` };
  } catch (dispatchErr) {
    const msg = dispatchErr instanceof Error ? dispatchErr.message : String(dispatchErr);
    return { success: false, detail: `dispatch_failed:${msg.slice(0, 200)}` };
  }
}

router.post("/command-actions/execute", authMiddleware(), requireRole("ops", "exec", "admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const { actionId, actionType, targetDomain, payload = {}, requiresApproval } = req.body;
    if (!actionId || !actionType || !targetDomain) {
      res.status(400).json({ error: "actionId, actionType, targetDomain required" });
      return;
    }

    const operator = req.user?.displayName ?? req.user?.email ?? "Nexus Operator";

    // Map Nexus action types to the platform's canonical action audit types
    const auditActionType = requiresApproval ? "approval_requested" : "workflow_triggered";

    // Generate a canonical action ID for the central audit trail
    const auditActionId = generateActionId();

    // Dispatch to downstream domain API (non-blocking for approval-gated actions)
    let dispatchResult: DomainDispatchResult = { success: true, detail: "awaiting_approval" };
    if (!requiresApproval) {
      const authHeader = req.headers.authorization as string | undefined;
      const authCookie = req.cookies?.["sid"] as string | undefined;
      dispatchResult = await dispatchToDomain(actionType, targetDomain, payload, operator, authHeader, authCookie);
    }

    // Determine final status based on dispatch outcome
    const nexusStatus = requiresApproval ? "pending" : (dispatchResult.success ? "executed" : "failed");
    const auditStatus = requiresApproval ? "awaiting_approval" : (dispatchResult.success ? "completed" : "failed");

    // Write to the central ai_action_audit table (Alloy/Mastra audit trail)
    await logAction({
      actionId: auditActionId,
      actionType: auditActionType,
      triggeredBy: operator,
      domain: targetDomain,
      toolName: actionType,
      input: { nexusActionId: actionId, actionType, targetDomain, payload },
      output: dispatchResult,
      status: auditStatus,
      approvalRequired: !!requiresApproval,
      metadata: {
        source: "nexus-command-actions",
        nexusActionId: actionId,
        dispatchDetail: dispatchResult.detail,
      },
    });

    // Derive a deterministic tx hash from the audit action ID (not random)
    const txHash = `0x${Buffer.from(auditActionId).toString("hex").slice(0, 32).padEnd(32, "0")}`;
    const id = `proof-${Date.now()}`;

    // Write to nexus_proof_chain for the Nexus UI proof chain view
    const { rows } = await pool.query(
      `INSERT INTO nexus_proof_chain (id, action_id, action_type, operator, target_domain, payload, status, tx_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [id, auditActionId, actionType, operator, targetDomain, JSON.stringify({ ...payload, _dispatch: dispatchResult }), nexusStatus, txHash]
    );

    logger.info({ actionType, targetDomain, auditActionId, txHash, nexusStatus, dispatchResult }, "Nexus command action executed");

    if (!dispatchResult.success) {
      logger.warn({ actionType, targetDomain, dispatchResult }, "Nexus command action dispatch failed — audit recorded, proof chain marked failed");
    }

    res.status(201).json({ ...rowToProofEntry(rows[0]), dispatchResult });
  } catch (err) {
    logger.error({ err }, "Failed to execute command action");
    res.status(500).json({ error: "Failed to execute command action" });
  }
});

router.patch("/command-actions/:proofId/decision", authMiddleware(), requireRole("ops", "exec", "admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const { decision, status, approvalNotes } = req.body as {
      decision?: string;
      status?: string;
      approvalNotes?: string;
    };

    // Validate strict enum for decision to ensure audit trail consistency
    const VALID_DECISIONS = ["approved", "rejected"] as const;
    type Decision = typeof VALID_DECISIONS[number];
    if (decision !== undefined && !VALID_DECISIONS.includes(decision as Decision)) {
      res.status(400).json({ error: `decision must be one of: ${VALID_DECISIONS.join(", ")}` });
      return;
    }

    const VALID_STATUSES = ["approved", "rejected", "executed", "pending", "failed", "cancelled"];
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });
      return;
    }

    // Fetch current proof chain entry to get action_type and target_domain for dispatch
    const { rows: currentRows } = await pool.query(
      `SELECT * FROM nexus_proof_chain WHERE id = $1`,
      [req.params.proofId]
    );
    if (currentRows.length === 0) { res.status(404).json({ error: "Proof chain entry not found" }); return; }
    const current = currentRows[0] as Record<string, unknown>;

    // Determine final status after approval decision
    const approvalDecision = decision as Decision | undefined;
    let finalStatus = status;

    // On approval, execute the downstream domain action and update status based on result
    let dispatchResult: DomainDispatchResult | undefined;
    if (approvalDecision === "approved" && (current.status as string) === "pending") {
      const operator = req.user?.displayName ?? req.user?.email ?? "Nexus Operator";
      // Strip internal _dispatch metadata added when action was originally stored
      const { _dispatch: _ignored, ...savedPayload } = (current.payload as Record<string, unknown>) ?? {};
      const actionType = current.action_type as string;
      const targetDomain = current.target_domain as string;

      const authHeader = req.headers.authorization as string | undefined;
      const authCookie = req.cookies?.["sid"] as string | undefined;
      dispatchResult = await dispatchToDomain(actionType, targetDomain, savedPayload, operator, authHeader, authCookie);

      // Override status based on actual dispatch result
      finalStatus = dispatchResult.success ? "executed" : "failed";
      logger.info({ actionType, targetDomain, dispatchResult, proofId: req.params.proofId }, "Post-approval dispatch executed");
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    if (finalStatus) { updates.push(`status = $${idx++}`); values.push(finalStatus); }
    if (approvalDecision) { updates.push(`decision = $${idx++}`); values.push(approvalDecision); }
    if (updates.length === 0) { res.status(400).json({ error: "No updates provided" }); return; }
    values.push(req.params.proofId);
    const { rows } = await pool.query(
      `UPDATE nexus_proof_chain SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );

    // Sync decision back to the central ai_action_audit trail using the validated enum value
    const entry = rows[0] as Record<string, unknown>;
    if (entry.action_id && approvalDecision) {
      const approver = req.user?.displayName ?? req.user?.email ?? "Nexus Operator";
      const auditFinalStatus = finalStatus === "executed" ? "completed" : (approvalDecision === "rejected" ? "rejected" : "failed");
      await updateActionStatus(entry.action_id as string, auditFinalStatus as "completed" | "rejected" | "failed", {
        approvedBy: approver,
        approvalDecision,
        approvalNotes: approvalNotes ?? `Nexus proof chain decision: ${approvalDecision}`,
        dispatchResult,
      });
    }

    res.json({ ...rowToProofEntry(rows[0]), dispatchResult });
  } catch (err) {
    res.status(500).json({ error: "Failed to update proof chain entry" });
  }
});

export default router;
