import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendBadRequest,
  sendForbidden,
  handleRouteError,
  sendNoContent,
  parsePagination,
} from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { logger } from "../lib/logger";
import {
  getPortalClient,
  upsertPortalClient,
  getClientHoldings,
  getHolding,
  upsertHolding,
  getClientMatters,
  getMatter,
  upsertMatter,
  getClientAssets,
  getAsset,
  upsertAsset,
  getClientDocuments,
  getDocument,
  upsertDocument,
  getClientThreads,
  getThread,
  upsertThread,
} from "../lib/forge-db";

const router: IRouter = Router();

type Domain = "vessels" | "terra" | "legal" | "security";

// ─── Seed helpers ────────────────────────────────────────────────────────────

async function seedClientData(userId: number): Promise<any> {
  const client = {
    id: `c-${userId}`,
    userId,
    name: "Marcus Hale",
    companyName: "Hale Capital Partners",
    email: "m.hale@halecap.com",
    relationship: "Managing Director — Investments",
    memberSince: "2021",
    tier: "platinum",
    domains: ["vessels", "terra", "legal", "security"],
    avatarInitials: "MH",
  };
  await upsertPortalClient(client);

  const cId = client.id;

  const holdings = [
    { id: `h-${cId}-1`, clientId: cId, name: "MV Pacific Sentinel", domain: "vessels", capitalDeployed: 18500000, currentValue: 22100000, irr: "+19.5%", vintage: "2022", status: "active" },
    { id: `h-${cId}-2`, clientId: cId, name: "MV Atlantic Horizon", domain: "vessels", capitalDeployed: 14200000, currentValue: 16400000, irr: "+15.5%", vintage: "2021", status: "active" },
    { id: `h-${cId}-3`, clientId: cId, name: "Harbor Logistics Hub", domain: "terra", capitalDeployed: 9800000, currentValue: 12400000, irr: "+26.5%", vintage: "2020", status: "active" },
    { id: `h-${cId}-4`, clientId: cId, name: "Coastal Industrial Park", domain: "terra", capitalDeployed: 11200000, currentValue: 13100000, irr: "+17.0%", vintage: "2021", status: "active" },
    { id: `h-${cId}-5`, clientId: cId, name: "MV Gulf Explorer", domain: "vessels", capitalDeployed: 7600000, currentValue: 8100000, irr: "+6.6%", vintage: "2023", status: "active" },
    { id: `h-${cId}-6`, clientId: cId, name: "Maritime Office Complex", domain: "terra", capitalDeployed: 5300000, currentValue: 0, irr: "+31.2%", vintage: "2019", status: "exited" },
  ];
  for (const h of holdings) await upsertHolding(h).catch(() => {});

  const matters = [
    { id: `m-${cId}-1`, clientId: cId, title: "Pacific Sentinel Charter Dispute", type: "Commercial Arbitration", status: "active", nextDeadline: "2026-04-28", recoveryProgress: 62, leadAttorney: "Sarah Chen", openedDate: "2025-11-12", description: "Arbitration regarding breach of charter party agreement with Kestrel Shipping Ltd." },
    { id: `m-${cId}-2`, clientId: cId, title: "Harbor Hub Lease Renewal", type: "Real Estate Contract", status: "pending", nextDeadline: "2026-05-15", recoveryProgress: 35, leadAttorney: "James Okafor", openedDate: "2026-01-08", description: "Negotiation for 10-year lease renewal on the Harbor Logistics Hub." },
    { id: `m-${cId}-3`, clientId: cId, title: "Atlantic Horizon Insurance Claim", type: "Maritime Insurance", status: "active", nextDeadline: "2026-04-22", recoveryProgress: 80, leadAttorney: "Elena Vasquez", openedDate: "2025-09-03", description: "Insurance claim for cargo damage during typhoon incident." },
    { id: `m-${cId}-4`, clientId: cId, title: "Gulf Explorer Crew Compliance", type: "Regulatory / STCW", status: "resolved", nextDeadline: "", recoveryProgress: 100, leadAttorney: "Mike Torres", openedDate: "2025-07-14", description: "STCW certification compliance review — all crew recertified." },
  ];
  for (const m of matters) await upsertMatter(m).catch(() => {});

  const assets = [
    { id: `a-${cId}-1`, clientId: cId, name: "MV Pacific Sentinel", domain: "vessels", type: "Bulk Carrier", status: "transit", value: "$22.1M", lastUpdate: "2026-04-12T08:14:00Z", location: "Pacific Ocean — 12.4°N, 142.8°E", notificationThreshold: 85 },
    { id: `a-${cId}-2`, clientId: cId, name: "MV Atlantic Horizon", domain: "vessels", type: "Container Ship", status: "docked", value: "$16.4M", lastUpdate: "2026-04-12T06:30:00Z", location: "Port of Rotterdam", notificationThreshold: 85 },
    { id: `a-${cId}-3`, clientId: cId, name: "MV Gulf Explorer", domain: "vessels", type: "Tanker", status: "active", value: "$8.1M", lastUpdate: "2026-04-12T09:05:00Z", location: "Gulf of Mexico — 25.1°N, 90.2°W", alert: "Cargo temp variance detected", notificationThreshold: 80 },
    { id: `a-${cId}-4`, clientId: cId, name: "Harbor Logistics Hub", domain: "terra", type: "Industrial Logistics", status: "active", value: "$12.4M", lastUpdate: "2026-04-11T16:00:00Z", location: "Long Beach, CA", notificationThreshold: 90 },
    { id: `a-${cId}-5`, clientId: cId, name: "Coastal Industrial Park", domain: "terra", type: "Industrial Campus", status: "active", value: "$13.1M", lastUpdate: "2026-04-10T12:00:00Z", location: "Houston, TX", notificationThreshold: 90 },
  ];
  for (const a of assets) await upsertAsset(a).catch(() => {});

  const docs = [
    { id: `d-${cId}-1`, clientId: cId, title: "Q1 2026 Maritime Portfolio Report", domain: "vessels", type: "report", uploadedBy: "SZL Analytics", uploadedDate: "2026-04-01", size: "4.2 MB", version: "1.0", accessLog: [] },
    { id: `d-${cId}-2`, clientId: cId, title: "Pacific Sentinel Charter Agreement", domain: "legal", type: "contract", uploadedBy: "Sarah Chen", uploadedDate: "2026-03-15", size: "1.1 MB", version: "3.2", accessLog: [] },
    { id: `d-${cId}-3`, clientId: cId, title: "Q4 2025 Terra Portfolio Statement", domain: "terra", type: "report", uploadedBy: "SZL Analytics", uploadedDate: "2026-01-10", size: "3.8 MB", version: "1.0", accessLog: [] },
    { id: `d-${cId}-4`, clientId: cId, title: "AML/KYC Compliance Filing 2025", domain: "legal", type: "filing", uploadedBy: "Compliance Team", uploadedDate: "2025-12-20", size: "820 KB", version: "2.0", accessLog: [] },
    { id: `d-${cId}-5`, clientId: cId, title: "Q1 2026 Security Posture Briefing", domain: "security", type: "briefing", uploadedBy: "Aegis Team", uploadedDate: "2026-04-05", size: "2.1 MB", version: "1.0", accessLog: [] },
    { id: `d-${cId}-6`, clientId: cId, title: "Q1 2026 Management Fee Invoice", domain: "general", type: "invoice", uploadedBy: "Finance", uploadedDate: "2026-04-02", size: "380 KB", version: "1.0", accessLog: [] },
  ];
  for (const d of docs) await upsertDocument(d).catch(() => {});

  const threads = [
    {
      id: `t-${cId}-1`, clientId: cId, subject: "Q1 2026 Portfolio Review — Follow-up", status: "open",
      participants: [{ name: "Marcus Hale", role: "Client", isClient: true }, { name: "Diana Reyes", role: "Relationship Manager", isClient: false }],
      messages: [
        { id: randomUUID(), from: "Diana Reyes", fromRole: "Relationship Manager", content: "Marcus, your Q1 portfolio report is now available in the documents section. Overall performance is strong — maritime holdings up 6.4% QoQ. Happy to schedule a call to review in detail.", timestamp: "2026-04-05T10:30:00Z", isClient: false, read: true },
        { id: randomUUID(), from: "Marcus Hale", fromRole: "Client", content: "Thanks Diana. I noticed the Gulf Explorer cargo alert — can you provide more context on the temperature variance?", timestamp: "2026-04-05T11:15:00Z", isClient: true, read: true },
        { id: randomUUID(), from: "Diana Reyes", fromRole: "Relationship Manager", content: "Absolutely. The variance was within normal operating parameters and has since self-corrected. The technical team will include a full status update in tomorrow's briefing.", timestamp: "2026-04-05T11:45:00Z", isClient: false, read: false },
      ],
      createdAt: "2026-04-05T10:30:00Z", updatedAt: "2026-04-05T11:45:00Z",
    },
    {
      id: `t-${cId}-2`, clientId: cId, subject: "Pacific Sentinel Arbitration Update", status: "open",
      participants: [{ name: "Marcus Hale", role: "Client", isClient: true }, { name: "Sarah Chen", role: "Senior Counsel", isClient: false }],
      messages: [
        { id: randomUUID(), from: "Sarah Chen", fromRole: "Senior Counsel", content: "The preliminary hearing is scheduled for April 28th. I have attached the latest brief to your matter file. We remain well-positioned given the documentation record.", timestamp: "2026-04-08T14:20:00Z", isClient: false, read: false },
      ],
      createdAt: "2026-04-08T14:20:00Z", updatedAt: "2026-04-08T14:20:00Z",
    },
  ];
  for (const t of threads) await upsertThread(t).catch(() => {});

  return client;
}

async function getOrSeedClient(userId: number): Promise<any> {
  const existing = await getPortalClient(userId);
  if (existing) return existing;
  return seedClientData(userId);
}

async function requireClient(req: Request, res: Response): Promise<any | null> {
  if (!req.user) { sendForbidden(res, "Authentication required"); return null; }
  return getOrSeedClient(req.user.id);
}

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get("/forge-portal/me", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const client = await requireClient(req, res);
    if (!client) return;
    sendSuccess(res, client);
  } catch (err) {
    handleRouteError(res, err, "forge-portal me");
  }
});

// ── Portfolio ─────────────────────────────────────────────────────────────────

router.get("/forge-portal/portfolio", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const client = await requireClient(req, res);
    if (!client) return;
    const { domain, status } = req.query as Record<string, string>;
    let holdings = await getClientHoldings(client.id);
    if (domain) holdings = holdings.filter((h: any) => h.domain === domain);
    if (status) holdings = holdings.filter((h: any) => h.status === status);
    const totalValue = holdings.filter((h: any) => h.status !== "exited").reduce((acc: number, h: any) => acc + h.currentValue, 0);
    const totalDeployed = holdings.reduce((acc: number, h: any) => acc + h.capitalDeployed, 0);
    sendSuccess(res, { holdings, totalValue, totalDeployed, count: holdings.length });
  } catch (err) {
    handleRouteError(res, err, "forge-portal portfolio");
  }
});

// ── Matters ───────────────────────────────────────────────────────────────────

router.get("/forge-portal/matters", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const client = await requireClient(req, res);
    if (!client) return;
    if (!client.domains.includes("legal")) { sendForbidden(res, "Legal domain not enabled for this client"); return; }
    const { status } = req.query as Record<string, string>;
    let matters = await getClientMatters(client.id);
    if (status) matters = matters.filter((m: any) => m.status === status);
    sendSuccess(res, { matters, count: matters.length });
  } catch (err) {
    handleRouteError(res, err, "forge-portal matters");
  }
});

router.get("/forge-portal/matters/:matterId", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const client = await requireClient(req, res);
    if (!client) return;
    if (!client.domains.includes("legal")) { sendForbidden(res, "Legal domain not enabled"); return; }
    const matter = await getMatter(String(req.params.matterId));
    if (!matter || matter.clientId !== client.id) { sendNotFound(res, "Matter"); return; }
    sendSuccess(res, matter);
  } catch (err) {
    handleRouteError(res, err, "forge-portal matter detail");
  }
});

// ── Assets ────────────────────────────────────────────────────────────────────

router.get("/forge-portal/assets", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const client = await requireClient(req, res);
    if (!client) return;
    const { domain, status } = req.query as Record<string, string>;
    let assets = (await getClientAssets(client.id)).filter((a: any) =>
      (a.domain === "vessels" && client.domains.includes("vessels")) ||
      (a.domain === "terra" && client.domains.includes("terra"))
    );
    if (domain) assets = assets.filter((a: any) => a.domain === domain);
    if (status) assets = assets.filter((a: any) => a.status === status);
    sendSuccess(res, { assets, count: assets.length });
  } catch (err) {
    handleRouteError(res, err, "forge-portal assets");
  }
});

router.get("/forge-portal/assets/:assetId", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const client = await requireClient(req, res);
    if (!client) return;
    const asset = await getAsset(String(req.params.assetId));
    if (!asset || asset.clientId !== client.id) { sendNotFound(res, "Asset"); return; }
    const domainOk = (asset.domain === "vessels" && client.domains.includes("vessels")) ||
      (asset.domain === "terra" && client.domains.includes("terra"));
    if (!domainOk) { sendForbidden(res, "Domain not enabled"); return; }
    sendSuccess(res, asset);
  } catch (err) {
    handleRouteError(res, err, "forge-portal asset detail");
  }
});

router.patch("/forge-portal/assets/:assetId/threshold", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const client = await requireClient(req, res);
    if (!client) return;
    const asset = await getAsset(String(req.params.assetId));
    if (!asset || asset.clientId !== client.id) { sendNotFound(res, "Asset"); return; }
    const domainOk = (asset.domain === "vessels" && client.domains.includes("vessels")) ||
      (asset.domain === "terra" && client.domains.includes("terra"));
    if (!domainOk) { sendForbidden(res, "Domain not enabled"); return; }
    const { threshold } = req.body as { threshold?: unknown };
    if (typeof threshold !== "number" || threshold < 0 || threshold > 100) {
      sendBadRequest(res, "threshold must be a number between 0 and 100");
      return;
    }
    asset.notificationThreshold = threshold;
    await upsertAsset(asset);
    logger.info({ assetId: asset.id, threshold, userId: req.user?.id }, "forge-portal: asset threshold updated");
    sendSuccess(res, { id: asset.id, notificationThreshold: threshold });
  } catch (err) {
    handleRouteError(res, err, "forge-portal asset threshold");
  }
});

// ── Documents ─────────────────────────────────────────────────────────────────

router.get("/forge-portal/documents", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const client = await requireClient(req, res);
    if (!client) return;
    const { domain, type } = req.query as Record<string, string>;
    let docs = (await getClientDocuments(client.id)).filter((d: any) =>
      d.domain === "general" || client.domains.includes(d.domain)
    );
    if (domain) docs = docs.filter((d: any) => d.domain === domain);
    if (type) docs = docs.filter((d: any) => d.type === type);
    const safe = docs.map(({ accessLog: _al, ...d }: any) => d);
    sendSuccess(res, { documents: safe, count: safe.length });
  } catch (err) {
    handleRouteError(res, err, "forge-portal documents");
  }
});

router.get("/forge-portal/documents/:docId", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const client = await requireClient(req, res);
    if (!client) return;
    const doc = await getDocument(String(req.params.docId));
    if (!doc || doc.clientId !== client.id) { sendNotFound(res, "Document"); return; }
    const domainOk = doc.domain === "general" || client.domains.includes(doc.domain);
    if (!domainOk) { sendForbidden(res, "Domain not enabled"); return; }
    doc.accessLog = [...(doc.accessLog ?? []), { userId: req.user!.id, accessedAt: new Date().toISOString() }];
    await upsertDocument(doc);
    logger.info({ docId: doc.id, userId: req.user?.id }, "forge-portal: document accessed");
    sendSuccess(res, doc);
  } catch (err) {
    handleRouteError(res, err, "forge-portal document detail");
  }
});

router.post("/forge-portal/documents", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const client = await requireClient(req, res);
    if (!client) return;
    const { title, domain, type, size } = req.body as { title?: string; domain?: string; type?: string; size?: string };
    if (!title || !domain || !type) { sendBadRequest(res, "title, domain, and type are required"); return; }
    const allowed = ["general", ...client.domains];
    if (!allowed.includes(domain)) { sendForbidden(res, "Domain not enabled"); return; }
    const doc = {
      id: `d-${client.id}-${Date.now()}`, clientId: client.id,
      title, domain, type, uploadedBy: req.user!.displayName,
      uploadedDate: new Date().toISOString().split("T")[0],
      size: size ?? "0 KB", version: "1.0", accessLog: [],
    };
    await upsertDocument(doc);
    logger.info({ docId: doc.id, userId: req.user?.id }, "forge-portal: document uploaded");
    const { accessLog: _al, ...safe } = doc;
    sendCreated(res, safe);
  } catch (err) {
    handleRouteError(res, err, "forge-portal document upload");
  }
});

// ── Messages ──────────────────────────────────────────────────────────────────

router.get("/forge-portal/messages", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const client = await requireClient(req, res);
    if (!client) return;
    const threads = (await getClientThreads(client.id)).map((t: any) => ({
      id: t.id, subject: t.subject, status: t.status, participants: t.participants,
      lastMessage: t.messages[t.messages.length - 1],
      unreadCount: t.messages.filter((m: any) => !m.read && !m.isClient).length,
      updatedAt: t.updatedAt,
    }));
    const totalUnread = threads.reduce((s: number, t: any) => s + t.unreadCount, 0);
    sendSuccess(res, { threads, totalUnread, count: threads.length });
  } catch (err) {
    handleRouteError(res, err, "forge-portal messages");
  }
});

router.get("/forge-portal/messages/:threadId", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const client = await requireClient(req, res);
    if (!client) return;
    const thread = await getThread(String(req.params.threadId));
    if (!thread || thread.clientId !== client.id) { sendNotFound(res, "Thread"); return; }
    thread.messages.forEach((m: any) => { if (!m.isClient) m.read = true; });
    thread.updatedAt = new Date().toISOString();
    await upsertThread(thread);
    sendSuccess(res, thread);
  } catch (err) {
    handleRouteError(res, err, "forge-portal thread detail");
  }
});

router.post("/forge-portal/messages/:threadId/reply", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const client = await requireClient(req, res);
    if (!client) return;
    const thread = await getThread(String(req.params.threadId));
    if (!thread || thread.clientId !== client.id) { sendNotFound(res, "Thread"); return; }
    if (thread.status === "resolved" || thread.status === "archived") {
      sendBadRequest(res, "Cannot reply to a resolved or archived thread");
      return;
    }
    const { content } = req.body as { content?: string };
    if (!content?.trim()) { sendBadRequest(res, "content is required"); return; }
    const msg = { id: randomUUID(), from: client.name, fromRole: "Client", content: content.trim(), timestamp: new Date().toISOString(), isClient: true, read: true };
    thread.messages.push(msg);
    thread.updatedAt = msg.timestamp;
    await upsertThread(thread);
    logger.info({ threadId: thread.id, userId: req.user?.id }, "forge-portal: client reply sent");
    sendCreated(res, msg);
  } catch (err) {
    handleRouteError(res, err, "forge-portal reply");
  }
});

router.post("/forge-portal/messages", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const client = await requireClient(req, res);
    if (!client) return;
    const { subject, content } = req.body as { subject?: string; content?: string };
    if (!subject?.trim() || !content?.trim()) { sendBadRequest(res, "subject and content are required"); return; }
    const now = new Date().toISOString();
    const thread = {
      id: `t-${client.id}-${Date.now()}`, clientId: client.id, subject: subject.trim(), status: "open",
      participants: [{ name: client.name, role: "Client", isClient: true }, { name: "SZL Relationship Team", role: "Relationship Manager", isClient: false }],
      messages: [{ id: randomUUID(), from: client.name, fromRole: "Client", content: content.trim(), timestamp: now, isClient: true, read: true }],
      createdAt: now, updatedAt: now,
    };
    await upsertThread(thread);
    logger.info({ threadId: thread.id, userId: req.user?.id }, "forge-portal: new thread created");
    sendCreated(res, { id: thread.id, subject: thread.subject, status: thread.status });
  } catch (err) {
    handleRouteError(res, err, "forge-portal new thread");
  }
});

// ── Dashboard summary ─────────────────────────────────────────────────────────

router.get("/forge-portal/dashboard", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const client = await requireClient(req, res);
    if (!client) return;
    const [holdings, matters, threads] = await Promise.all([
      getClientHoldings(client.id),
      getClientMatters(client.id),
      getClientThreads(client.id),
    ]);
    const activeHoldings = holdings.filter((h: any) => h.status !== "exited");
    const totalValue = activeHoldings.reduce((s: number, h: any) => s + h.currentValue, 0);
    const totalDeployed = holdings.reduce((s: number, h: any) => s + h.capitalDeployed, 0);
    const totalReturn = totalDeployed > 0 ? (((totalValue - totalDeployed) / totalDeployed) * 100).toFixed(1) + "%" : "0%";
    const openMatters = matters.filter((m: any) => m.status === "active" || m.status === "pending").length;
    const unreadMessages = threads.reduce((s: number, t: any) => s + t.messages.filter((m: any) => !m.read && !m.isClient).length, 0);
    const nextDeadline = matters.filter((m: any) => m.nextDeadline && m.status !== "resolved").sort((a: any, b: any) => a.nextDeadline.localeCompare(b.nextDeadline))[0] ?? null;
    const demoMode = process.env["DEMO_MODE"] === "true";
    sendSuccess(res, {
      client,
      summary: { totalValue, totalDeployed, totalReturn, openMatters, unreadMessages },
      nextDeadline: nextDeadline ? { title: nextDeadline.title, date: nextDeadline.nextDeadline, leadAttorney: nextDeadline.leadAttorney } : null,
      recentActivity: [
        { type: "document", description: "Q1 2026 Maritime Portfolio Report uploaded", date: "2026-04-01" },
        { type: "matter", description: "Pacific Sentinel hearing scheduled for Apr 28", date: "2026-04-08" },
        { type: "message", description: "New message from Diana Reyes re: Q1 Review", date: "2026-04-05" },
        { type: "alert", description: "Gulf Explorer cargo temp variance flagged", date: "2026-04-11" },
      ],
      demoMode,
    });
  } catch (err) {
    handleRouteError(res, err, "forge-portal dashboard");
  }
});

export default router;
