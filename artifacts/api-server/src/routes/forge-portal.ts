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

const router: IRouter = Router();

// ─── Types ─────────────────────────────────────────────────────────────────

type Domain = "vessels" | "terra" | "legal" | "security";
type MatterStatus = "active" | "pending" | "resolved" | "on-hold";
type AssetStatus = "active" | "docked" | "transit" | "listed" | "under-contract";
type DocType = "report" | "filing" | "contract" | "briefing" | "invoice";
type MsgThreadStatus = "open" | "resolved" | "archived";

interface PortalClient {
  id: string;
  userId: number;
  name: string;
  companyName: string;
  email: string;
  relationship: string;
  memberSince: string;
  tier: "platinum" | "gold" | "silver";
  domains: Domain[];
  avatarInitials: string;
}

interface PortfolioHolding {
  id: string;
  clientId: string;
  name: string;
  domain: Domain;
  capitalDeployed: number;
  currentValue: number;
  irr: string;
  vintage: string;
  status: "active" | "exited" | "pending";
}

interface LegalMatter {
  id: string;
  clientId: string;
  title: string;
  type: string;
  status: MatterStatus;
  nextDeadline: string;
  recoveryProgress: number;
  leadAttorney: string;
  openedDate: string;
  description: string;
}

interface PortalAsset {
  id: string;
  clientId: string;
  name: string;
  domain: "vessels" | "terra";
  type: string;
  status: AssetStatus;
  value: string;
  lastUpdate: string;
  location: string;
  alert?: string;
  notificationThreshold?: number;
}

interface PortalDocument {
  id: string;
  clientId: string;
  title: string;
  domain: Domain | "general";
  type: DocType;
  uploadedBy: string;
  uploadedDate: string;
  size: string;
  version: string;
  accessLog: { userId: number; accessedAt: string }[];
}

interface MessageThread {
  id: string;
  clientId: string;
  subject: string;
  status: MsgThreadStatus;
  participants: { name: string; role: string; isClient: boolean }[];
  messages: {
    id: string;
    from: string;
    fromRole: string;
    content: string;
    timestamp: string;
    isClient: boolean;
    read: boolean;
  }[];
  createdAt: string;
  updatedAt: string;
}

// ─── In-memory store (demo persistence layer) ──────────────────────────────

const clientsStore = new Map<number, PortalClient>();
const holdingsStore = new Map<string, PortfolioHolding>();
const mattersStore = new Map<string, LegalMatter>();
const assetsStore = new Map<string, PortalAsset>();
const documentsStore = new Map<string, PortalDocument>();
const threadsStore = new Map<string, MessageThread>();

function seedClientData(userId: number): PortalClient {
  const client: PortalClient = {
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
  clientsStore.set(userId, client);

  const cId = client.id;

  const holdings: Omit<PortfolioHolding, "clientId">[] = [
    { id: `h-${cId}-1`, name: "MV Pacific Sentinel", domain: "vessels", capitalDeployed: 18500000, currentValue: 22100000, irr: "+19.5%", vintage: "2022", status: "active" },
    { id: `h-${cId}-2`, name: "MV Atlantic Horizon", domain: "vessels", capitalDeployed: 14200000, currentValue: 16400000, irr: "+15.5%", vintage: "2021", status: "active" },
    { id: `h-${cId}-3`, name: "Harbor Logistics Hub", domain: "terra", capitalDeployed: 9800000, currentValue: 12400000, irr: "+26.5%", vintage: "2020", status: "active" },
    { id: `h-${cId}-4`, name: "Coastal Industrial Park", domain: "terra", capitalDeployed: 11200000, currentValue: 13100000, irr: "+17.0%", vintage: "2021", status: "active" },
    { id: `h-${cId}-5`, name: "MV Gulf Explorer", domain: "vessels", capitalDeployed: 7600000, currentValue: 8100000, irr: "+6.6%", vintage: "2023", status: "active" },
    { id: `h-${cId}-6`, name: "Maritime Office Complex", domain: "terra", capitalDeployed: 5300000, currentValue: 0, irr: "+31.2%", vintage: "2019", status: "exited" },
  ];
  for (const h of holdings) holdingsStore.set(h.id, { ...h, clientId: cId });

  const matters: Omit<LegalMatter, "clientId">[] = [
    { id: `m-${cId}-1`, title: "Pacific Sentinel Charter Dispute", type: "Commercial Arbitration", status: "active", nextDeadline: "2026-04-28", recoveryProgress: 62, leadAttorney: "Sarah Chen", openedDate: "2025-11-12", description: "Arbitration regarding breach of charter party agreement with Kestrel Shipping Ltd." },
    { id: `m-${cId}-2`, title: "Harbor Hub Lease Renewal", type: "Real Estate Contract", status: "pending", nextDeadline: "2026-05-15", recoveryProgress: 35, leadAttorney: "James Okafor", openedDate: "2026-01-08", description: "Negotiation for 10-year lease renewal on the Harbor Logistics Hub." },
    { id: `m-${cId}-3`, title: "Atlantic Horizon Insurance Claim", type: "Maritime Insurance", status: "active", nextDeadline: "2026-04-22", recoveryProgress: 80, leadAttorney: "Elena Vasquez", openedDate: "2025-09-03", description: "Insurance claim for cargo damage during typhoon incident." },
    { id: `m-${cId}-4`, title: "Gulf Explorer Crew Compliance", type: "Regulatory / STCW", status: "resolved", nextDeadline: "", recoveryProgress: 100, leadAttorney: "Mike Torres", openedDate: "2025-07-14", description: "STCW certification compliance review — all crew recertified." },
  ];
  for (const m of matters) mattersStore.set(m.id, { ...m, clientId: cId });

  const assets: Omit<PortalAsset, "clientId">[] = [
    { id: `a-${cId}-1`, name: "MV Pacific Sentinel", domain: "vessels", type: "Bulk Carrier", status: "transit", value: "$22.1M", lastUpdate: "2026-04-12T08:14:00Z", location: "Pacific Ocean — 12.4°N, 142.8°E", notificationThreshold: 85 },
    { id: `a-${cId}-2`, name: "MV Atlantic Horizon", domain: "vessels", type: "Container Ship", status: "docked", value: "$16.4M", lastUpdate: "2026-04-12T06:30:00Z", location: "Port of Rotterdam", notificationThreshold: 85 },
    { id: `a-${cId}-3`, name: "MV Gulf Explorer", domain: "vessels", type: "Tanker", status: "active", value: "$8.1M", lastUpdate: "2026-04-12T09:05:00Z", location: "Gulf of Mexico — 25.1°N, 90.2°W", alert: "Cargo temp variance detected", notificationThreshold: 80 },
    { id: `a-${cId}-4`, name: "Harbor Logistics Hub", domain: "terra", type: "Industrial Logistics", status: "active", value: "$12.4M", lastUpdate: "2026-04-11T16:00:00Z", location: "Long Beach, CA", notificationThreshold: 90 },
    { id: `a-${cId}-5`, name: "Coastal Industrial Park", domain: "terra", type: "Industrial Campus", status: "active", value: "$13.1M", lastUpdate: "2026-04-10T12:00:00Z", location: "Houston, TX", notificationThreshold: 90 },
  ];
  for (const a of assets) assetsStore.set(a.id, { ...a, clientId: cId });

  const docs: Omit<PortalDocument, "clientId" | "accessLog">[] = [
    { id: `d-${cId}-1`, title: "Q1 2026 Maritime Portfolio Report", domain: "vessels", type: "report", uploadedBy: "SZL Analytics", uploadedDate: "2026-04-01", size: "4.2 MB", version: "1.0" },
    { id: `d-${cId}-2`, title: "Pacific Sentinel Charter Agreement", domain: "legal", type: "contract", uploadedBy: "Sarah Chen", uploadedDate: "2026-03-15", size: "1.1 MB", version: "3.2" },
    { id: `d-${cId}-3`, title: "Q4 2025 Terra Portfolio Statement", domain: "terra", type: "report", uploadedBy: "SZL Analytics", uploadedDate: "2026-01-10", size: "3.8 MB", version: "1.0" },
    { id: `d-${cId}-4`, title: "AML/KYC Compliance Filing 2025", domain: "legal", type: "filing", uploadedBy: "Compliance Team", uploadedDate: "2025-12-20", size: "820 KB", version: "2.0" },
    { id: `d-${cId}-5`, title: "Q1 2026 Security Posture Briefing", domain: "security", type: "briefing", uploadedBy: "Aegis Team", uploadedDate: "2026-04-05", size: "2.1 MB", version: "1.0" },
    { id: `d-${cId}-6`, title: "Q1 2026 Management Fee Invoice", domain: "general", type: "invoice", uploadedBy: "Finance", uploadedDate: "2026-04-02", size: "380 KB", version: "1.0" },
  ];
  for (const d of docs) documentsStore.set(d.id, { ...d, clientId: cId, accessLog: [] });

  const threads: Omit<MessageThread, "clientId">[] = [
    {
      id: `t-${cId}-1`,
      subject: "Q1 2026 Portfolio Review — Follow-up",
      status: "open",
      participants: [
        { name: "Marcus Hale", role: "Client", isClient: true },
        { name: "Diana Reyes", role: "Relationship Manager", isClient: false },
      ],
      messages: [
        { id: randomUUID(), from: "Diana Reyes", fromRole: "Relationship Manager", content: "Marcus, your Q1 portfolio report is now available in the documents section. Overall performance is strong — maritime holdings up 6.4% QoQ. Happy to schedule a call to review in detail.", timestamp: "2026-04-05T10:30:00Z", isClient: false, read: true },
        { id: randomUUID(), from: "Marcus Hale", fromRole: "Client", content: "Thanks Diana. I noticed the Gulf Explorer cargo alert — can you provide more context on the temperature variance?", timestamp: "2026-04-05T11:15:00Z", isClient: true, read: true },
        { id: randomUUID(), from: "Diana Reyes", fromRole: "Relationship Manager", content: "Absolutely. The variance was within normal operating parameters and has since self-corrected. The technical team will include a full status update in tomorrow's briefing.", timestamp: "2026-04-05T11:45:00Z", isClient: false, read: false },
      ],
      createdAt: "2026-04-05T10:30:00Z",
      updatedAt: "2026-04-05T11:45:00Z",
    },
    {
      id: `t-${cId}-2`,
      subject: "Pacific Sentinel Arbitration Update",
      status: "open",
      participants: [
        { name: "Marcus Hale", role: "Client", isClient: true },
        { name: "Sarah Chen", role: "Senior Counsel", isClient: false },
      ],
      messages: [
        { id: randomUUID(), from: "Sarah Chen", fromRole: "Senior Counsel", content: "The preliminary hearing is scheduled for April 28th. I have attached the latest brief to your matter file. We remain well-positioned given the documentation record.", timestamp: "2026-04-08T14:20:00Z", isClient: false, read: false },
      ],
      createdAt: "2026-04-08T14:20:00Z",
      updatedAt: "2026-04-08T14:20:00Z",
    },
  ];
  for (const t of threads) threadsStore.set(t.id, { ...t, clientId: cId });

  return client;
}

// ─── Access helpers ─────────────────────────────────────────────────────────

function getOrSeedClient(userId: number): PortalClient {
  const existing = clientsStore.get(userId);
  if (existing) return existing;
  return seedClientData(userId);
}

function requireClient(req: Request, res: Response): PortalClient | null {
  if (!req.user) {
    sendForbidden(res, "Authentication required");
    return null;
  }
  return getOrSeedClient(req.user.id);
}

function clientHoldings(cId: string): PortfolioHolding[] {
  return [...holdingsStore.values()].filter(h => h.clientId === cId);
}

function clientMatters(cId: string): LegalMatter[] {
  return [...mattersStore.values()].filter(m => m.clientId === cId);
}

function clientAssets(cId: string): PortalAsset[] {
  return [...assetsStore.values()].filter(a => a.clientId === cId);
}

function clientDocs(cId: string): PortalDocument[] {
  return [...documentsStore.values()].filter(d => d.clientId === cId);
}

function clientThreads(cId: string): MessageThread[] {
  return [...threadsStore.values()].filter(t => t.clientId === cId);
}

// ─── Routes ────────────────────────────────────────────────────────────────

router.get("/forge-portal/me", authMiddleware(), (req: Request, res: Response) => {
  try {
    const client = requireClient(req, res);
    if (!client) return;
    sendSuccess(res, client);
  } catch (err) {
    handleRouteError(res, err, "forge-portal me");
  }
});

// ── Portfolio ─────────────────────────────────────────────────────────────

router.get("/forge-portal/portfolio", authMiddleware(), (req: Request, res: Response) => {
  try {
    const client = requireClient(req, res);
    if (!client) return;
    const { domain, status } = req.query as Record<string, string>;
    let holdings = clientHoldings(client.id);
    if (domain) holdings = holdings.filter(h => h.domain === domain);
    if (status) holdings = holdings.filter(h => h.status === status);
    const totalValue = holdings.filter(h => h.status !== "exited").reduce((acc, h) => acc + h.currentValue, 0);
    const totalDeployed = holdings.reduce((acc, h) => acc + h.capitalDeployed, 0);
    sendSuccess(res, { holdings, totalValue, totalDeployed, count: holdings.length });
  } catch (err) {
    handleRouteError(res, err, "forge-portal portfolio");
  }
});

// ── Matters ───────────────────────────────────────────────────────────────

router.get("/forge-portal/matters", authMiddleware(), (req: Request, res: Response) => {
  try {
    const client = requireClient(req, res);
    if (!client) return;
    if (!client.domains.includes("legal")) {
      sendForbidden(res, "Legal domain not enabled for this client");
      return;
    }
    const { status } = req.query as Record<string, string>;
    let matters = clientMatters(client.id);
    if (status) matters = matters.filter(m => m.status === status);
    sendSuccess(res, { matters, count: matters.length });
  } catch (err) {
    handleRouteError(res, err, "forge-portal matters");
  }
});

router.get("/forge-portal/matters/:matterId", authMiddleware(), (req: Request, res: Response) => {
  try {
    const client = requireClient(req, res);
    if (!client) return;
    if (!client.domains.includes("legal")) { sendForbidden(res, "Legal domain not enabled"); return; }
    const matter = mattersStore.get(String(req.params.matterId));
    if (!matter || matter.clientId !== client.id) { sendNotFound(res, "Matter"); return; }
    sendSuccess(res, matter);
  } catch (err) {
    handleRouteError(res, err, "forge-portal matter detail");
  }
});

// ── Assets ────────────────────────────────────────────────────────────────

router.get("/forge-portal/assets", authMiddleware(), (req: Request, res: Response) => {
  try {
    const client = requireClient(req, res);
    if (!client) return;
    const { domain, status } = req.query as Record<string, string>;
    let assets = clientAssets(client.id).filter(a =>
      (a.domain === "vessels" && client.domains.includes("vessels")) ||
      (a.domain === "terra" && client.domains.includes("terra"))
    );
    if (domain) assets = assets.filter(a => a.domain === domain);
    if (status) assets = assets.filter(a => a.status === status);
    sendSuccess(res, { assets, count: assets.length });
  } catch (err) {
    handleRouteError(res, err, "forge-portal assets");
  }
});

router.get("/forge-portal/assets/:assetId", authMiddleware(), (req: Request, res: Response) => {
  try {
    const client = requireClient(req, res);
    if (!client) return;
    const asset = assetsStore.get(String(req.params.assetId));
    if (!asset || asset.clientId !== client.id) { sendNotFound(res, "Asset"); return; }
    const domainOk = (asset.domain === "vessels" && client.domains.includes("vessels")) ||
      (asset.domain === "terra" && client.domains.includes("terra"));
    if (!domainOk) { sendForbidden(res, "Domain not enabled"); return; }
    sendSuccess(res, asset);
  } catch (err) {
    handleRouteError(res, err, "forge-portal asset detail");
  }
});

router.patch("/forge-portal/assets/:assetId/threshold", authMiddleware(), (req: Request, res: Response) => {
  try {
    const client = requireClient(req, res);
    if (!client) return;
    const asset = assetsStore.get(String(req.params.assetId));
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
    assetsStore.set(asset.id, asset);
    logger.info({ assetId: asset.id, threshold, userId: req.user?.id }, "forge-portal: asset threshold updated");
    sendSuccess(res, { id: asset.id, notificationThreshold: threshold });
  } catch (err) {
    handleRouteError(res, err, "forge-portal asset threshold");
  }
});

// ── Documents ─────────────────────────────────────────────────────────────

router.get("/forge-portal/documents", authMiddleware(), (req: Request, res: Response) => {
  try {
    const client = requireClient(req, res);
    if (!client) return;
    const { domain, type } = req.query as Record<string, string>;
    let docs = clientDocs(client.id).filter(d =>
      d.domain === "general" || client.domains.includes(d.domain as Domain)
    );
    if (domain) docs = docs.filter(d => d.domain === domain);
    if (type) docs = docs.filter(d => d.type === type);
    const safe = docs.map(({ accessLog: _al, ...d }) => d);
    sendSuccess(res, { documents: safe, count: safe.length });
  } catch (err) {
    handleRouteError(res, err, "forge-portal documents");
  }
});

router.get("/forge-portal/documents/:docId", authMiddleware(), (req: Request, res: Response) => {
  try {
    const client = requireClient(req, res);
    if (!client) return;
    const doc = documentsStore.get(String(req.params.docId));
    if (!doc || doc.clientId !== client.id) { sendNotFound(res, "Document"); return; }
    const domainOk = doc.domain === "general" || client.domains.includes(doc.domain as Domain);
    if (!domainOk) { sendForbidden(res, "Domain not enabled"); return; }
    doc.accessLog.push({ userId: req.user!.id, accessedAt: new Date().toISOString() });
    documentsStore.set(doc.id, doc);
    logger.info({ docId: doc.id, userId: req.user?.id }, "forge-portal: document accessed");
    sendSuccess(res, doc);
  } catch (err) {
    handleRouteError(res, err, "forge-portal document detail");
  }
});

router.post("/forge-portal/documents", authMiddleware(), (req: Request, res: Response) => {
  try {
    const client = requireClient(req, res);
    if (!client) return;
    const { title, domain, type, size } = req.body as Partial<PortalDocument>;
    if (!title || !domain || !type) {
      sendBadRequest(res, "title, domain, and type are required");
      return;
    }
    const allowed = ["general", ...client.domains];
    if (!allowed.includes(domain)) { sendForbidden(res, "Domain not enabled"); return; }
    const doc: PortalDocument = {
      id: `d-${client.id}-${Date.now()}`,
      clientId: client.id,
      title,
      domain,
      type: type as DocType,
      uploadedBy: req.user!.displayName,
      uploadedDate: new Date().toISOString().split("T")[0],
      size: size ?? "0 KB",
      version: "1.0",
      accessLog: [],
    };
    documentsStore.set(doc.id, doc);
    logger.info({ docId: doc.id, userId: req.user?.id }, "forge-portal: document uploaded");
    const { accessLog: _al, ...safe } = doc;
    sendCreated(res, safe);
  } catch (err) {
    handleRouteError(res, err, "forge-portal document upload");
  }
});

// ── Messages ──────────────────────────────────────────────────────────────

router.get("/forge-portal/messages", authMiddleware(), (req: Request, res: Response) => {
  try {
    const client = requireClient(req, res);
    if (!client) return;
    const threads = clientThreads(client.id).map(t => ({
      id: t.id,
      subject: t.subject,
      status: t.status,
      participants: t.participants,
      lastMessage: t.messages[t.messages.length - 1],
      unreadCount: t.messages.filter(m => !m.read && !m.isClient).length,
      updatedAt: t.updatedAt,
    }));
    const totalUnread = threads.reduce((s, t) => s + t.unreadCount, 0);
    sendSuccess(res, { threads, totalUnread, count: threads.length });
  } catch (err) {
    handleRouteError(res, err, "forge-portal messages");
  }
});

router.get("/forge-portal/messages/:threadId", authMiddleware(), (req: Request, res: Response) => {
  try {
    const client = requireClient(req, res);
    if (!client) return;
    const thread = threadsStore.get(String(req.params.threadId));
    if (!thread || thread.clientId !== client.id) { sendNotFound(res, "Thread"); return; }
    thread.messages.forEach(m => { if (!m.isClient) m.read = true; });
    thread.updatedAt = new Date().toISOString();
    threadsStore.set(thread.id, thread);
    sendSuccess(res, thread);
  } catch (err) {
    handleRouteError(res, err, "forge-portal thread detail");
  }
});

router.post("/forge-portal/messages/:threadId/reply", authMiddleware(), (req: Request, res: Response) => {
  try {
    const client = requireClient(req, res);
    if (!client) return;
    const thread = threadsStore.get(String(req.params.threadId));
    if (!thread || thread.clientId !== client.id) { sendNotFound(res, "Thread"); return; }
    if (thread.status === "resolved" || thread.status === "archived") {
      sendBadRequest(res, "Cannot reply to a resolved or archived thread");
      return;
    }
    const { content } = req.body as { content?: string };
    if (!content?.trim()) { sendBadRequest(res, "content is required"); return; }
    const msg = {
      id: randomUUID(),
      from: client.name,
      fromRole: "Client",
      content: content.trim(),
      timestamp: new Date().toISOString(),
      isClient: true,
      read: true,
    };
    thread.messages.push(msg);
    thread.updatedAt = msg.timestamp;
    threadsStore.set(thread.id, thread);
    logger.info({ threadId: thread.id, userId: req.user?.id }, "forge-portal: client reply sent");
    sendCreated(res, msg);
  } catch (err) {
    handleRouteError(res, err, "forge-portal reply");
  }
});

router.post("/forge-portal/messages", authMiddleware(), (req: Request, res: Response) => {
  try {
    const client = requireClient(req, res);
    if (!client) return;
    const { subject, content } = req.body as { subject?: string; content?: string };
    if (!subject?.trim() || !content?.trim()) {
      sendBadRequest(res, "subject and content are required");
      return;
    }
    const now = new Date().toISOString();
    const thread: MessageThread = {
      id: `t-${client.id}-${Date.now()}`,
      clientId: client.id,
      subject: subject.trim(),
      status: "open",
      participants: [
        { name: client.name, role: "Client", isClient: true },
        { name: "SZL Relationship Team", role: "Relationship Manager", isClient: false },
      ],
      messages: [{
        id: randomUUID(),
        from: client.name,
        fromRole: "Client",
        content: content.trim(),
        timestamp: now,
        isClient: true,
        read: true,
      }],
      createdAt: now,
      updatedAt: now,
    };
    threadsStore.set(thread.id, thread);
    logger.info({ threadId: thread.id, userId: req.user?.id }, "forge-portal: new thread created");
    sendCreated(res, { id: thread.id, subject: thread.subject, status: thread.status });
  } catch (err) {
    handleRouteError(res, err, "forge-portal new thread");
  }
});

// ── Dashboard summary ────────────────────────────────────────────────────

router.get("/forge-portal/dashboard", authMiddleware(), (req: Request, res: Response) => {
  try {
    const client = requireClient(req, res);
    if (!client) return;
    const holdings = clientHoldings(client.id);
    const matters = clientMatters(client.id);
    const threads = clientThreads(client.id);
    const activeHoldings = holdings.filter(h => h.status !== "exited");
    const totalValue = activeHoldings.reduce((s, h) => s + h.currentValue, 0);
    const totalDeployed = holdings.reduce((s, h) => s + h.capitalDeployed, 0);
    const totalReturn = totalDeployed > 0
      ? (((totalValue - totalDeployed) / totalDeployed) * 100).toFixed(1) + "%"
      : "0%";
    const openMatters = matters.filter(m => m.status === "active" || m.status === "pending").length;
    const unreadMessages = threads.reduce((s, t) => s + t.messages.filter(m => !m.read && !m.isClient).length, 0);
    const nextDeadline = matters
      .filter(m => m.nextDeadline && m.status !== "resolved")
      .sort((a, b) => a.nextDeadline.localeCompare(b.nextDeadline))[0] ?? null;
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
    });
  } catch (err) {
    handleRouteError(res, err, "forge-portal dashboard");
  }
});

export default router;
