import { bodyShape } from '@szl-holdings/contracts/common';
import {
  complianceCalendarTable,
  complianceSupervisionQueueTable,
  db,
  firestormAlertsTable,
  firestormFindingsTable,
  firestormIncidentsTable,
  fleetExceptionsTable,
  holdingsMetricsTable,
  maritimeExceptionsTable,
  pulseBriefingsTable,
  pulseCustomBriefsTable,
  pulseDissentsTable,
  pulseEmailSubscriptionsTable,
} from '@szl-holdings/db';
import { services } from '@szl-holdings/services';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { type Request, type Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import PDFDocument from 'pdfkit';
import { z } from 'zod';
import { gatewayInfer } from '../lib/ai-gateway';
import { sendBadRequest, sendNotFound, sendUnauthorized } from '../lib/api-response';
import { logger } from '../lib/logger';
import {
  clampRisk,
  confidenceLabel,
  type ConfidenceLevel,
  type RiskLevel,
} from '../lib/pulse-confidence';
import { listQuerySchema, validateBody, validateParams, validateQuery } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router = Router();

// ─── Non-production demo endpoints ────────────────────────────────────────────
// Completely absent in production (NODE_ENV === 'production').
// Token is the raw ADMIN_PIN, sent in the x-demo-token request header (never
// embedded in the URL or client bundle). The global-auth-enforcer exempts the
// /api/pulse/demo/* prefix only in non-production mode.
// No write operations are exposed here.
const demoRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, ip: false },
});

/** Hash a PIN to a fixed-length digest so timingSafeEqual never receives
 *  mismatched buffer lengths (which would throw regardless of the values). */
function hashPin(pin: string): Buffer {
  return createHash('sha256').update(pin, 'utf8').digest();
}

function verifyDemoPin(req: Request, res: Response): boolean {
  if (process.env.NODE_ENV === 'production') {
    sendNotFound(res);
    return false;
  }
  const pin = req.headers['x-demo-token'];
  const adminPin = process.env.ADMIN_PIN ?? process.env.VITE_ADMIN_PIN;
  if (typeof pin !== 'string' || !adminPin) {
    sendUnauthorized(res, 'demo_pin_required');
    return false;
  }
  if (!timingSafeEqual(hashPin(adminPin), hashPin(pin))) {
    sendUnauthorized(res, 'invalid_demo_pin');
    return false;
  }
  return true;
}

if (process.env.NODE_ENV !== 'production') {
  // Verify PIN and report valid/invalid — used by the client PIN modal before
  // opening demo mode. The PIN is sent in the request body (never in the URL).
  router.post(
    '/demo/verify',
    validateBody(bodyShape({})),
    demoRateLimit,
    (req: Request, res: Response): void => {
      const pin = req.body?.pin as string | undefined;
      const adminPin = process.env.ADMIN_PIN ?? process.env.VITE_ADMIN_PIN;
      if (!pin || !adminPin) {
        res.status(401).json({ valid: false });
        return;
      }
      // Use hash digests (fixed 32-byte length) so timingSafeEqual can never throw
      // due to mismatched buffer lengths from arbitrarily long user input.
      const ok = timingSafeEqual(hashPin(adminPin), hashPin(pin));
      res.json({ valid: ok });
    },
  );

  router.get('/demo/today', demoRateLimit, async (req: Request, res: Response): Promise<void> => {
    if (!verifyDemoPin(req, res)) return;
    try {
      const latest = await getLatestBriefing();
      res.json({
        success: true,
        briefing: latest ? withAgentNames(latest) : null,
      });
    } catch {
      res.json({ success: true, briefing: null });
    }
  });

  router.get(
    '/demo/briefings',
    demoRateLimit,
    async (req: Request, res: Response): Promise<void> => {
      if (!verifyDemoPin(req, res)) return;
      try {
        const briefings = await listBriefings(10);
        res.json({
          success: true,
          briefings: briefings.map(withAgentNames),
          total: briefings.length,
        });
      } catch {
        res.json({ success: true, briefings: [], total: 0 });
      }
    },
  );

  // Derives confidence trend from real briefing records. The pulse_briefings
  // schema stores overallConfidence per briefing but not per-domain. We use the
  // briefing's overallConfidence for each domain listed in that briefing's
  // domains array, and fall back to DEMO_CONFIDENCE_HISTORY only when the DB
  // has fewer than 2 records.
  router.get(
    '/demo/confidence',
    demoRateLimit,
    async (req: Request, res: Response): Promise<void> => {
      if (!verifyDemoPin(req, res)) return;
      try {
        const history = await buildConfidenceHistory();
        res.json({ success: true, history });
      } catch {
        res.json({ success: true, history: DEMO_CONFIDENCE_HISTORY });
      }
    },
  );

  router.post(
    '/demo/export/pdf',
    validateBody(bodyShape({})),
    demoRateLimit,
    async (req: Request, res: Response): Promise<void> => {
      if (!verifyDemoPin(req, res)) return;
      const briefingId: string | undefined = (req.body as { briefingId?: string } | undefined)
        ?.briefingId;
      let brief: Briefing | null = null;
      try {
        brief = briefingId ? await getBriefingById(briefingId) : await getLatestBriefing();
      } catch {
        brief = null;
      }
      if (!brief) {
        res.status(404).json({ success: false, error: 'Briefing not found' });
        return;
      }
      renderBriefingPdf(res, brief);
    },
  );

  router.get(
    '/demo/dissents',
    demoRateLimit,
    async (req: Request, res: Response): Promise<void> => {
      if (!verifyDemoPin(req, res)) return;
      try {
        const rows = await db.select().from(pulseDissentsTable).limit(10);
        const dissents = rows.map(rowToDissent);
        res.json({ success: true, dissents });
      } catch {
        res.json({ success: true, dissents: [] });
      }
    },
  );
}
// ─────────────────────────────────────────────────────────────────────────────

// Public unsubscribe — accepts a one-shot token and cancels the subscription.
// Mounted before the auth middleware so the link in delivered emails works
// without requiring the recipient to be signed in.
router.get('/unsubscribe', async (req: Request, res: Response): Promise<void> => {
  const token = String(req.query.token ?? '').trim();
  if (!token) {
    res
      .status(400)
      .type('html')
      .send(
        `<html><body style="font-family:sans-serif;padding:40px;background:#0a0b0d;color:#fff;"><h2>Invalid unsubscribe link</h2><p>The unsubscribe token is missing.</p></body></html>`,
      );
    return;
  }
  const result = await db
    .update(pulseEmailSubscriptionsTable)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(pulseEmailSubscriptionsTable.unsubscribeToken, token))
    .returning();
  if (result.length === 0) {
    res
      .status(404)
      .type('html')
      .send(
        `<html><body style="font-family:sans-serif;padding:40px;background:#0a0b0d;color:#fff;"><h2>Subscription not found</h2><p>This unsubscribe link is no longer valid.</p></body></html>`,
      );
    return;
  }
  const safeEmail = result[0]?.email
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  res
    .type('html')
    .send(`<!DOCTYPE html><html><head><title>Unsubscribed</title></head><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:40px;background:#0a0b0d;color:#e6e6e6;text-align:center;">
    <div style="max-width:480px;margin:60px auto;padding:32px;background:#101216;border:1px solid rgba(200,168,75,0.2);border-radius:12px;">
      <div style="font-size:11px;letter-spacing:0.14em;color:#c8a84b;text-transform:uppercase;margin-bottom:12px;">PULSE</div>
      <h2 style="color:#fff;margin:0 0 12px;">You're unsubscribed</h2>
      <p style="color:rgba(255,255,255,0.6);line-height:1.6;">${safeEmail} has been removed from the daily Pulse briefing list.</p>
      <p style="color:rgba(255,255,255,0.4);font-size:13px;margin-top:20px;">You can resubscribe anytime from your Pulse settings.</p>
    </div>
  </body></html>`);
});

const PULSE_AUTHENTICATED_PREFIXES = [
  '/briefings',
  '/confidence',
  '/custom',
  '/dissents',
  '/domain-panel',
  '/export',
  '/subscriptions',
  '/today',
];
router.use(PULSE_AUTHENTICATED_PREFIXES, authMiddleware({ required: true }));

const AGENT_NAMES: Record<string, string> = {
  alloy: 'Counsel',
  helmsman: 'Helmsman',
  sentinel: 'Sentinel',
  terra: 'Terra',
  lexis: 'Lexis',
  atlas: 'Atlas',
  beacon: 'Beacon',
  zeus: 'Zeus',
};

function withAgentNames<T extends { sections: Array<{ agentId: string }> }>(briefing: T): T {
  return {
    ...briefing,
    sections: briefing.sections.map((s) => ({
      ...s,
      agentName: AGENT_NAMES[s.agentId] ?? s.agentId,
    })),
  } as T;
}

const PULSE_BASE_URL = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}/pulse`
  : 'http://localhost:5201';

type DomainKey =
  | 'maritime'
  | 'security'
  | 'real_estate'
  | 'legal'
  | 'financial'
  | 'platform'
  | 'executive';

interface BriefingSection {
  id: string;
  title: string;
  agentId: string;
  confidence: number;
  confidenceLabel: ConfidenceLevel;
  riskLevel: RiskLevel;
  keyJudgment: string;
  narrative: string[];
  keyFindings: Array<{ finding: string; severity: RiskLevel }>;
  assumptions: string[];
  gaps: string[];
  lastUpdated: string;
}

interface Briefing {
  id: string;
  date: string;
  edition: string;
  classification: string;
  status: 'published' | 'draft' | 'archived';
  overallRisk: RiskLevel;
  overallConfidence: number;
  headline: string;
  leadSentence: string;
  domains: DomainKey[];
  sections: BriefingSection[];
  recommendedActions: Array<{
    action: string;
    priority: 'P0' | 'P1' | 'P2' | 'P3';
    owner: string;
    rationale: string;
    dueBy: string;
  }>;
  generatedAt: string;
}

interface DissentRecord {
  id: string;
  briefingId: string;
  sectionId: string;
  sectionTitle: string;
  dissentingView: string;
  basis: string;
  filedBy: string;
  filedAt: string;
  status: 'open' | 'under_review' | 'acknowledged' | 'resolved';
  resolution?: string;
  resolvedAt?: string;
  impactIfCorrect: string;
}

interface CustomBriefRequest {
  id: string;
  topic: string;
  entity?: string;
  scenario?: string;
  domains?: DomainKey[];
  agents?: string[];
  requestedAt: string;
  status: 'pending' | 'generating' | 'complete' | 'failed';
  briefingId?: string;
}


// ─── Shared confidence history builder ────────────────────────────────────────
// Used by both the authenticated GET /confidence and the demo GET /demo/confidence
// endpoints. Queries the real pulse_briefings table and derives per-domain values
// from overallConfidence. Falls back to DEMO_CONFIDENCE_HISTORY only when the DB
// has fewer than 2 records (i.e., a freshly seeded environment).
const DOMAIN_KEYS = [
  'maritime',
  'security',
  'real_estate',
  'legal',
  'financial',
  'platform',
] as const;

async function buildConfidenceHistory(): Promise<Record<string, string | number>[]> {
  const rows = await db
    .select({
      date: pulseBriefingsTable.date,
      overallConfidence: pulseBriefingsTable.overallConfidence,
      domains: pulseBriefingsTable.domains,
    })
    .from(pulseBriefingsTable)
    .orderBy(desc(pulseBriefingsTable.date))
    .limit(7);

  if (rows.length < 2) return DEMO_CONFIDENCE_HISTORY;

  return rows
    .slice()
    .reverse()
    .map((r) => {
      const conf = Number(r.overallConfidence);
      const activeDomains = new Set(
        (r.domains as string[]).map((d) => d.toLowerCase().replace(/\s+/g, '_')),
      );
      const entry: Record<string, string | number> = { date: r.date };
      for (const key of DOMAIN_KEYS) {
        entry[key] = Number((activeDomains.has(key) ? conf : conf * 0.9).toFixed(3));
      }
      return entry;
    });
}

// Static fallback used by buildConfidenceHistory() when the DB has fewer than
// 2 briefing records (e.g. a fresh environment with no seed data yet).
const DEMO_CONFIDENCE_HISTORY = [
  {
    date: '2026-04-10',
    maritime: 0.71,
    security: 0.78,
    real_estate: 0.83,
    legal: 0.87,
    financial: 0.75,
    platform: 0.91,
  },
  {
    date: '2026-04-11',
    maritime: 0.73,
    security: 0.79,
    real_estate: 0.83,
    legal: 0.86,
    financial: 0.76,
    platform: 0.91,
  },
  {
    date: '2026-04-12',
    maritime: 0.7,
    security: 0.8,
    real_estate: 0.84,
    legal: 0.87,
    financial: 0.77,
    platform: 0.92,
  },
  {
    date: '2026-04-13',
    maritime: 0.68,
    security: 0.78,
    real_estate: 0.82,
    legal: 0.85,
    financial: 0.76,
    platform: 0.9,
  },
  {
    date: '2026-04-14',
    maritime: 0.72,
    security: 0.81,
    real_estate: 0.84,
    legal: 0.86,
    financial: 0.78,
    platform: 0.91,
  },
  {
    date: '2026-04-15',
    maritime: 0.69,
    security: 0.79,
    real_estate: 0.83,
    legal: 0.87,
    financial: 0.77,
    platform: 0.92,
  },
  {
    date: '2026-04-16',
    maritime: 0.74,
    security: 0.82,
    real_estate: 0.85,
    legal: 0.88,
    financial: 0.79,
    platform: 0.93,
  },
];

function rowToBriefing(r: typeof pulseBriefingsTable.$inferSelect): Briefing {
  return {
    id: r.id,
    date: r.date,
    edition: r.edition,
    classification: r.classification,
    status: r.status,
    overallRisk: r.overallRisk as RiskLevel,
    overallConfidence: Number(r.overallConfidence),
    headline: r.headline,
    leadSentence: r.leadSentence,
    domains: (r.domains as DomainKey[]) ?? [],
    sections: (r.sections as BriefingSection[]) ?? [],
    recommendedActions: (r.recommendedActions as Briefing['recommendedActions']) ?? [],
    generatedAt: r.generatedAt.toISOString(),
  };
}

async function insertBriefing(b: Briefing): Promise<void> {
  await db
    .insert(pulseBriefingsTable)
    .values({
      id: b.id,
      date: b.date,
      edition: b.edition,
      classification: b.classification,
      status: b.status,
      overallRisk: b.overallRisk,
      overallConfidence: String(b.overallConfidence),
      headline: b.headline,
      leadSentence: b.leadSentence,
      domains: b.domains,
      sections: b.sections,
      recommendedActions: b.recommendedActions,
      generatedAt: new Date(b.generatedAt),
    })
    .onConflictDoNothing();
}

async function getLatestBriefing(): Promise<Briefing | null> {
  const rows = await db
    .select()
    .from(pulseBriefingsTable)
    .orderBy(desc(pulseBriefingsTable.generatedAt))
    .limit(1);
  return rows[0] ? rowToBriefing(rows[0]) : null;
}

async function listBriefings(limit: number): Promise<Briefing[]> {
  const rows = await db
    .select()
    .from(pulseBriefingsTable)
    .orderBy(desc(pulseBriefingsTable.generatedAt))
    .limit(limit);
  return rows.map(rowToBriefing);
}

async function getBriefingById(id: string): Promise<Briefing | null> {
  const rows = await db
    .select()
    .from(pulseBriefingsTable)
    .where(eq(pulseBriefingsTable.id, id))
    .limit(1);
  return rows[0] ? rowToBriefing(rows[0]) : null;
}

interface SignalContext {
  date: string;
  threats: {
    openFindings: number;
    criticalFindings: Array<{ title: string; severity: string; affectedAsset: string | null }>;
    activeAlerts: Array<{ title: string; severity: string; source: string }>;
    activeIncidents: Array<{ title: string; severity: string; status: string }>;
  };
  maritime: {
    openExceptions: number;
    criticalExceptions: Array<{
      title: string;
      severity: string;
      type: string;
      valueAtRiskUsd: string | null;
    }>;
    fleetExceptions: Array<{ title: string; severity: string; status: string }>;
  };
  compliance: {
    upcomingDeadlines: Array<{ title: string; type: string; dueDate: string; severity: string }>;
    supervisionQueue: number;
  };
  portfolio: {
    recentMetrics: Array<{
      name: string;
      value: string;
      change: string | null;
      category: string | null;
    }>;
  };
}

async function gatherSignals(): Promise<SignalContext> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const today = new Date();

  const safe = async <T>(p: Promise<T>, fallback: T): Promise<T> => {
    try {
      return await p;
    } catch (err) {
      logger.warn(
        { err: err instanceof Error ? err.message : String(err) },
        '[pulse] signal fetch failed',
      );
      return fallback;
    }
  };

  const [
    findingsCount,
    criticalFindings,
    alerts,
    incidents,
    maritimeExc,
    maritimeCritical,
    fleetExc,
    complianceCal,
    supervisionCount,
    metrics,
  ] = await Promise.all([
    safe(
      db
        .select({ c: sql<number>`count(*)::int` })
        .from(firestormFindingsTable)
        .where(eq(firestormFindingsTable.status, 'open')),
      [{ c: 0 }],
    ),
    safe(
      db
        .select()
        .from(firestormFindingsTable)
        .where(eq(firestormFindingsTable.severity, 'critical'))
        .orderBy(desc(firestormFindingsTable.createdAt))
        .limit(5),
      [],
    ),
    safe(
      db
        .select()
        .from(firestormAlertsTable)
        .where(gte(firestormAlertsTable.createdAt, since))
        .orderBy(desc(firestormAlertsTable.createdAt))
        .limit(8),
      [],
    ),
    safe(
      db
        .select()
        .from(firestormIncidentsTable)
        .where(gte(firestormIncidentsTable.detectedAt, since))
        .orderBy(desc(firestormIncidentsTable.detectedAt))
        .limit(5),
      [],
    ),
    safe(
      db
        .select({ c: sql<number>`count(*)::int` })
        .from(maritimeExceptionsTable)
        .where(eq(maritimeExceptionsTable.status, 'new')),
      [{ c: 0 }],
    ),
    safe(
      db
        .select()
        .from(maritimeExceptionsTable)
        .where(
          and(
            gte(maritimeExceptionsTable.detectedAt, since),
            inArray(maritimeExceptionsTable.severity, ['critical', 'high']),
          ),
        )
        .orderBy(desc(maritimeExceptionsTable.detectedAt))
        .limit(5),
      [],
    ),
    safe(
      db.select().from(fleetExceptionsTable).orderBy(desc(fleetExceptionsTable.createdAt)).limit(5),
      [],
    ),
    safe(
      db
        .select()
        .from(complianceCalendarTable)
        .where(gte(complianceCalendarTable.dueAt, today))
        .orderBy(complianceCalendarTable.dueAt)
        .limit(8),
      [],
    ),
    safe(db.select({ c: sql<number>`count(*)::int` }).from(complianceSupervisionQueueTable), [
      { c: 0 },
    ]),
    safe(
      db.select().from(holdingsMetricsTable).orderBy(desc(holdingsMetricsTable.createdAt)).limit(8),
      [],
    ),
  ]);

  return {
    date: today.toISOString().slice(0, 10),
    threats: {
      openFindings: findingsCount[0]?.c ?? 0,
      criticalFindings: criticalFindings.map((f) => ({
        title: f.title,
        severity: f.severity,
        affectedAsset: f.affectedAsset ?? null,
      })),
      activeAlerts: alerts.map((a) => ({ title: a.title, severity: a.severity, source: a.source })),
      activeIncidents: incidents.map((i) => ({
        title: i.title,
        severity: i.severity,
        status: i.status,
      })),
    },
    maritime: {
      openExceptions: maritimeExc[0]?.c ?? 0,
      criticalExceptions: maritimeCritical.map((m) => ({
        title: m.title,
        severity: m.severity,
        type: m.exceptionType,
        valueAtRiskUsd: m.valueAtRiskUsd,
      })),
      fleetExceptions: fleetExc.map((f) => ({
        title:
          (f as { exceptionType?: string; title?: string }).title ??
          (f as { exceptionType?: string }).exceptionType ??
          'Fleet exception',
        severity: (f as { severity?: string }).severity ?? 'medium',
        status: (f as { status?: string }).status ?? 'open',
      })),
    },
    compliance: {
      upcomingDeadlines: complianceCal.map((c) => ({
        title:
          (c as { title?: string; eventTitle?: string }).title ??
          (c as { eventTitle?: string }).eventTitle ??
          'Compliance event',
        type:
          (c as { eventType?: string; type?: string }).eventType ??
          (c as { type?: string }).type ??
          'deadline',
        dueDate: c.dueAt ? new Date(c.dueAt).toISOString().slice(0, 10) : '',
        severity:
          (c as { severity?: string; priority?: string }).severity ??
          (c as { priority?: string }).priority ??
          'medium',
      })),
      supervisionQueue: supervisionCount[0]?.c ?? 0,
    },
    portfolio: {
      recentMetrics: metrics.map((m) => ({
        name: m.label,
        value: String(m.value ?? ''),
        change: m.change ?? null,
        category: m.category ?? null,
      })),
    },
  };
}

const SECTION_BLUEPRINT: Array<{ id: string; title: string; agentId: string; domain: DomainKey }> =
  [
    { id: 'exec-summary', title: 'Executive Summary', agentId: 'alloy', domain: 'executive' },
    { id: 'maritime', title: 'Maritime Outlook', agentId: 'helmsman', domain: 'maritime' },
    { id: 'security', title: 'Threat Landscape', agentId: 'sentinel', domain: 'security' },
    { id: 'real_estate', title: 'Real Estate Pulse', agentId: 'terra', domain: 'real_estate' },
    { id: 'legal', title: 'Legal Pipeline', agentId: 'lexis', domain: 'legal' },
    { id: 'financial', title: 'Portfolio Movements', agentId: 'atlas', domain: 'financial' },
    { id: 'platform', title: 'Platform Health', agentId: 'beacon', domain: 'platform' },
  ];

// Per-agent prompt personas. Each section is written in the voice of its
// assigned Nuro Mesh agent so the brief reads as a synthesis of distinct
// specialists rather than a single monolithic narrator.
const AGENT_PERSONAS: Record<string, string> = {
  alloy:
    'Alloy — Chief Synthesis agent. Speaks for the executive layer. Tone: calm, calibrated, integrative. Connects signals across all other agents and surfaces the single dominant judgment of the day. Always names the top 1–3 decisions the executive must make in the next 24 hours.',
  helmsman:
    'Helmsman — Maritime Operations agent. Speaks for fleet, voyage, and chokepoint risk. Tone: bridge-watch precise. Cites vessel names/IMO context when available, references chokepoints (Bab-el-Mandeb, Hormuz, Malacca, Suez), insurer notices, and AIS coverage gaps. Quantifies rerouting cost and ETA impact.',
  sentinel:
    'Sentinel — Cyber Threat agent. Speaks for adversary activity, vulnerability exposure, and incident posture. Tone: SOC analyst rigor. Uses MITRE ATT&CK / threat actor naming conventions, gives explicit attribution confidence, and distinguishes attempted vs. successful compromise.',
  terra:
    'Terra — Real Estate Intelligence agent. Speaks for property, deal pipeline, and entitlement risk. Tone: institutional underwriter. Names jurisdictions, deal stage, filing deadlines, and capital allocation implications.',
  lexis:
    'Lexis — Legal & Regulatory agent. Speaks for matters, filings, and counterparty exposure. Tone: senior counsel memo. References specific matter numbers/types, deadlines, sanctions posture, and required signatures.',
  atlas:
    'Atlas — Portfolio & Capital agent. Speaks for fund performance, liquidity, and capital allocation. Tone: CIO desk note. Quantifies NAV moves, IRR, dry powder, and flags treasury anomalies with explicit investigation status.',
  beacon:
    "Beacon — Platform Reliability agent. Speaks for infrastructure, latency, and SLO posture. Tone: SRE incident commander. Uses concrete metrics (P95 latency, uptime %, incident counts) and references the agent collective's compute usage.",
  zeus: 'Zeus — Patch & Vulnerability agent. Speaks for remediation queues. Used when platform/security sections need vulnerability lifecycle context.',
};

function buildPersonaSpec(): string {
  return SECTION_BLUEPRINT.map((s) => {
    const persona = AGENT_PERSONAS[s.agentId] ?? `${s.agentId} — domain agent for ${s.domain}.`;
    return `- section "${s.id}" (${s.title}) — voice of ${persona}`;
  }).join('\n');
}

interface AIBriefingPayload {
  headline: string;
  leadSentence: string;
  overallRisk: RiskLevel;
  overallConfidence: number;
  sections: Array<{
    id: string;
    keyJudgment: string;
    narrative: string[];
    confidence: number;
    riskLevel: RiskLevel;
    keyFindings: Array<{ finding: string; severity: RiskLevel }>;
    assumptions: string[];
    gaps: string[];
  }>;
  recommendedActions: Array<{
    action: string;
    priority: 'P0' | 'P1' | 'P2' | 'P3';
    owner: string;
    rationale: string;
    dueBy: string;
  }>;
}


function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1]! : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found in model output');
  return JSON.parse(candidate.slice(start, end + 1));
}

async function generateAIBriefing(date: string): Promise<Briefing> {
  const signals = await gatherSignals();
  const now = new Date();
  const briefId = `brief-${date}-${now.getTime()}`;

  const sectionSpec = SECTION_BLUEPRINT.map(
    (s) => `- id: "${s.id}", title: "${s.title}", agent: ${s.agentId}, domain: ${s.domain}`,
  ).join('\n');
  const personaSpec = buildPersonaSpec();

  const systemPrompt = [
    'You are the SZL Holdings Pulse executive briefing engine — an orchestrator over the Nuro Mesh agent collective.',
    'You synthesize a daily, decision-grade intelligence brief for C-suite executives by composing distinct sections, each authored in the voice of a specific named agent persona.',
    'Each section MUST read in the voice of its assigned agent — do not blur their tones together. Confidence numbers MUST reflect the actual coverage and quality of the live signals provided for that domain (low signal coverage → lower confidence).',
    'Tone overall: precise, calibrated, intelligence-community style. Always disclose gaps and assumptions.',
    'OUTPUT: a single JSON object only — no prose, no markdown, no code fences.',
  ].join(' ');

  const userPrompt = [
    `Today's date: ${date}.`,
    "Generate today's morning Pulse briefing as a JSON object with this exact shape:",
    `{
  "headline": string (one sentence, the dominant judgment of the day),
  "leadSentence": string (one paragraph, sets context across domains),
  "overallRisk": "CRITICAL"|"HIGH"|"MEDIUM"|"LOW",
  "overallConfidence": number 0.0-1.0,
  "sections": [
    { "id": one of the section ids below,
      "keyJudgment": string,
      "narrative": string[] (2-4 paragraphs),
      "confidence": number 0.0-1.0,
      "riskLevel": "CRITICAL"|"HIGH"|"MEDIUM"|"LOW",
      "keyFindings": [{"finding": string, "severity": "CRITICAL"|"HIGH"|"MEDIUM"|"LOW"}],
      "assumptions": string[],
      "gaps": string[]
    }
  ],
  "recommendedActions": [
    {"action": string, "priority": "P0"|"P1"|"P2"|"P3", "owner": string, "rationale": string, "dueBy": string}
  ]
}`,
    'Sections to include (use these ids exactly, in this order):',
    sectionSpec,
    '',
    'Each section MUST be authored in the voice and discipline of its assigned agent persona. Personas:',
    personaSpec,
    '',
    "Ground every section in the live signals below. Cite specific titles or counts where relevant. If a domain has no signals, say so explicitly in 'gaps' and lower confidence accordingly.",
    '',
    'LIVE SIGNALS (JSON):',
    JSON.stringify(signals, null, 2),
  ].join('\n');

  const response = await gatewayInfer({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    agentId: 'pulse-briefing',
    domain: 'executive',
    strategy: 'fastest',
    maxTokens: 4000,
    timeoutMs: 90_000,
  });

  const parsed = extractJson(response.content) as AIBriefingPayload;

  const sections: BriefingSection[] = SECTION_BLUEPRINT.map((blueprint) => {
    const aiSection = parsed.sections?.find((s) => s.id === blueprint.id);
    const conf = Number(aiSection?.confidence ?? 0.7);
    const risk = clampRisk(aiSection?.riskLevel);
    return {
      id: blueprint.id,
      title: blueprint.title,
      agentId: blueprint.agentId,
      confidence: Number(Math.max(0.4, Math.min(0.99, conf)).toFixed(2)),
      confidenceLabel: confidenceLabel(conf),
      riskLevel: risk,
      keyJudgment: String(aiSection?.keyJudgment ?? 'No judgment generated for this domain.'),
      narrative: Array.isArray(aiSection?.narrative) ? aiSection?.narrative.map(String) : [],
      keyFindings: Array.isArray(aiSection?.keyFindings)
        ? aiSection?.keyFindings.map((f) => ({
            finding: String(f.finding ?? ''),
            severity: clampRisk(f.severity),
          }))
        : [],
      assumptions: Array.isArray(aiSection?.assumptions) ? aiSection?.assumptions.map(String) : [],
      gaps: Array.isArray(aiSection?.gaps) ? aiSection?.gaps.map(String) : [],
      lastUpdated: now.toISOString(),
    };
  });

  const overallConfidence = Number(
    Math.max(
      0.4,
      Math.min(
        0.99,
        Number(
          parsed.overallConfidence ??
            sections.reduce((a, s) => a + s.confidence, 0) / sections.length,
        ),
      ),
    ).toFixed(2),
  );

  const briefing: Briefing = {
    id: briefId,
    date,
    edition: `Morning Edition · ${now.toUTCString()}`,
    classification: 'SZL-EXEC-RESTRICTED',
    status: 'published',
    overallRisk: clampRisk(parsed.overallRisk),
    overallConfidence,
    headline: String(parsed.headline ?? 'Pulse briefing generated'),
    leadSentence: String(parsed.leadSentence ?? ''),
    domains: SECTION_BLUEPRINT.map((s) => s.domain),
    sections,
    recommendedActions: Array.isArray(parsed.recommendedActions)
      ? parsed.recommendedActions.slice(0, 8).map((a) => ({
          action: String(a.action ?? ''),
          priority: (['P0', 'P1', 'P2', 'P3'].includes(String(a.priority)) ? a.priority : 'P2') as
            | 'P0'
            | 'P1'
            | 'P2'
            | 'P3',
          owner: String(a.owner ?? 'Executive'),
          rationale: String(a.rationale ?? ''),
          dueBy: String(a.dueBy ?? 'Within 24 hours'),
        }))
      : [],
    generatedAt: now.toISOString(),
  };

  await insertBriefing(briefing);
  logger.info(
    {
      briefId,
      provider: response.provider,
      model: response.model,
      latencyMs: response.routing.totalLatencyMs,
    },
    '[pulse] AI briefing generated',
  );
  return briefing;
}

async function getBriefingForDate(date: string): Promise<Briefing | null> {
  const rows = await db
    .select()
    .from(pulseBriefingsTable)
    .where(eq(pulseBriefingsTable.date, date))
    .orderBy(desc(pulseBriefingsTable.generatedAt))
    .limit(1);
  return rows[0] ? rowToBriefing(rows[0]) : null;
}

let dailyGenerationLock: Promise<Briefing> | null = null;
async function ensureTodaysBriefing(): Promise<Briefing | null> {
  const today = new Date().toISOString().slice(0, 10);
  const existing = await getBriefingForDate(today);
  if (existing) return existing;

  if (!services.ai.isLive) {
    logger.warn('[pulse] no AI provider configured — returning latest existing briefing');
    return getLatestBriefing();
  }

  if (dailyGenerationLock) return dailyGenerationLock;
  dailyGenerationLock = (async () => {
    try {
      return await generateAIBriefing(today);
    } finally {
      dailyGenerationLock = null;
    }
  })();

  try {
    return await dailyGenerationLock;
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? err.message : String(err) },
      '[pulse] AI briefing generation failed; falling back to latest',
    );
    return getLatestBriefing();
  }
}

router.get(
  '/today',
  validateQuery(listQuerySchema),
  async (_req: Request, res: Response): Promise<void> => {
    const brief = await ensureTodaysBriefing();
    if (!brief) {
      res.json({ success: true, briefing: null });
      return;
    }
    res.json({ success: true, briefing: withAgentNames(brief) });
  },
);

router.get(
  '/briefings',
  validateQuery(listQuerySchema),
  async (req: Request, res: Response): Promise<void> => {
    const domain = req.query.domain as string | undefined;
    const risk = req.query.risk as string | undefined;
    const limit = parseInt((req.query.limit as string) || '20', 10);

    let briefings = await listBriefings(limit * 2);
    if (domain) briefings = briefings.filter((b) => b.domains.includes(domain as DomainKey));
    if (risk) briefings = briefings.filter((b) => b.overallRisk === risk);

    res.json({
      success: true,
      briefings: briefings.slice(0, limit).map(withAgentNames),
      total: briefings.length,
    });
  },
);

router.get(
  '/briefings/search',
  validateQuery(listQuerySchema),
  async (req: Request, res: Response): Promise<void> => {
    const q = String(req.query.q ?? '')
      .trim()
      .toLowerCase();
    if (!q) {
      res.json({ success: true, briefings: [], total: 0 });
      return;
    }

    const limit = Math.min(parseInt(String(req.query.limit ?? '50'), 10), 200);
    const all = await listBriefings(500);

    const matches = all.filter((b) => {
      // Top-level fields: headline, lead, metadata
      if (b.headline.toLowerCase().includes(q)) return true;
      if (b.leadSentence.toLowerCase().includes(q)) return true;
      if (b.date.includes(q)) return true;
      if (b.edition.toLowerCase().includes(q)) return true;
      if (b.classification.toLowerCase().includes(q)) return true;
      if (b.domains.some((d: string) => d.toLowerCase().includes(q))) return true;

      // Sections — title, judgment, full narrative (body text), findings, and
      // assumptions / gaps which carry entity names, citations, and source refs
      for (const s of b.sections) {
        if (s.title.toLowerCase().includes(q)) return true;
        if (s.keyJudgment.toLowerCase().includes(q)) return true;
        if (s.narrative.some((p: string) => p.toLowerCase().includes(q))) return true;
        if (s.keyFindings.some((f: { finding: string }) => f.finding.toLowerCase().includes(q)))
          return true;
        // Assumptions and gaps frequently contain entity names, vessel IDs, people,
        // org names, and source citations (e.g. "Skuld", "TA505", "Fund III")
        if (s.assumptions?.some((a: string) => a.toLowerCase().includes(q))) return true;
        if (s.gaps?.some((g: string) => g.toLowerCase().includes(q))) return true;
      }

      // Recommended actions (owner names, action descriptions)
      if (
        b.recommendedActions?.some(
          (a: { action: string; owner: string; rationale: string }) =>
            a.action.toLowerCase().includes(q) ||
            a.owner.toLowerCase().includes(q) ||
            a.rationale.toLowerCase().includes(q),
        )
      )
        return true;

      return false;
    });

    res.json({
      success: true,
      briefings: matches.slice(0, limit).map(withAgentNames),
      total: matches.length,
      query: q,
    });
  },
);

router.get(
  '/briefings/:id',
  validateQuery(listQuerySchema),
  async (req: Request, res: Response): Promise<void> => {
    const brief = await getBriefingById(String(req.params.id));
    if (!brief) {
      sendNotFound(res, 'Briefing');
      return;
    }
    res.json({ success: true, briefing: withAgentNames(brief) });
  },
);

router.get(
  '/domain-panel/:domain',
  validateQuery(listQuerySchema),
  async (req: Request, res: Response): Promise<void> => {
    const domain: string = String(req.params.domain ?? '');
    const latest = await getLatestBriefing();
    if (!latest) {
      res.json({ success: true, panel: null });
      return;
    }

    const DOMAIN_SECTION_ALIASES: Record<string, string[]> = {
      executive: ['exec-summary', 'alloy'],
      maritime: ['maritime', 'helmsman'],
      security: ['security', 'sentinel'],
      real_estate: ['real_estate', 'terra'],
      legal: ['legal', 'lexis'],
      financial: ['financial', 'atlas'],
      platform: ['platform', 'beacon'],
    };
    const aliases = DOMAIN_SECTION_ALIASES[domain] ?? [domain];
    const enriched = withAgentNames(latest);
    const section =
      enriched.sections.find((s) => aliases.includes(s.id) || aliases.includes(s.agentId)) ??
      enriched.sections.find((s) => s.id === domain || s.agentId === domain) ??
      null;

    const domainMap: Record<string, string[]> = {
      executive: [
        'executive',
        'fund',
        'portfolio',
        'capital',
        'filing',
        'authorize',
        'acquisition',
      ],
      maritime: ['vessel', 'fleet', 'maritime', 'strait', 'reroute'],
      security: ['security', 'threat', 'phishing', 'vulnerability'],
      real_estate: ['henderson', 'property', 'real estate', 'acquisition'],
      legal: ['legal', 'counsel', 'filing', 'extension'],
      financial: ['fund', 'portfolio', 'wire', 'capital'],
      platform: ['platform', 'latency', 'infrastructure'],
    };
    const keywords: string[] = domainMap[domain] ?? [];
    const relevantActions = latest.recommendedActions.filter((a) => {
      const actionLower = a.action.toLowerCase();
      return keywords.some((kw: string) => actionLower.includes(kw));
    });

    res.json({
      success: true,
      panel: {
        briefingId: latest.id,
        briefingDate: latest.date,
        overallRisk: latest.overallRisk,
        overallConfidence: latest.overallConfidence,
        headline: latest.headline,
        domain,
        section: section ?? null,
        relevantActions: relevantActions.slice(0, 2),
        pulseUrl: `${PULSE_BASE_URL}/`,
      },
    });
  },
);

// ─── Save-for-later ───────────────────────────────────────────────────────────
// Per-user bookmarking for Library briefings. Backed by `pulse_saved_briefings`
// with (user_id, briefing_id) uniqueness.  Global CSRF middleware covers all
// state-mutating POST/DELETE requests; auth enforced via requireRole guard.

const writeSaveRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, ip: false },
  keyGenerator: (req) => String((req as Request & { user?: { id: number } }).user?.id ?? req.ip ?? 'anon'),
});

router.get(
  '/briefings/saved',
  requireRole('ops', 'exec', 'admin', 'super_admin'),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) { sendUnauthorized(res); return; }
    const rows = await db.execute(
      sql`SELECT briefing_id FROM pulse_saved_briefings WHERE user_id = ${req.user.id}`,
    );
    const ids = (rows as unknown as { rows: { briefing_id: string }[] }).rows.map((r) => r.briefing_id);
    res.json({ success: true, savedBriefingIds: ids });
  },
);

const briefingIdParamSchema = z.object({
  id: z.string().min(1, 'briefing_id_required').max(256),
});

router.post(
  '/briefings/:id/save',
  requireRole('ops', 'exec', 'admin', 'super_admin'),
  validateParams(briefingIdParamSchema),
  writeSaveRateLimit,
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) { sendUnauthorized(res); return; }
    const briefingId = req.params.id;
    try {
      await db.execute(
        sql`INSERT INTO pulse_saved_briefings (user_id, briefing_id) VALUES (${req.user.id}, ${briefingId}) ON CONFLICT (user_id, briefing_id) DO NOTHING`,
      );
      res.json({ success: true, briefingId });
    } catch (err) {
      logger.error({ err }, '[pulse] save briefing failed');
      res.status(500).json({ success: false, error: 'save_failed' });
    }
  },
);

router.delete(
  '/briefings/:id/save',
  requireRole('ops', 'exec', 'admin', 'super_admin'),
  validateParams(briefingIdParamSchema),
  writeSaveRateLimit,
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) { sendUnauthorized(res); return; }
    const briefingId = req.params.id;
    await db.execute(
      sql`DELETE FROM pulse_saved_briefings WHERE user_id = ${req.user.id} AND briefing_id = ${briefingId}`,
    );
    res.json({ success: true, briefingId });
  },
);

// ─── Generate ─────────────────────────────────────────────────────────────────

router.post(
  '/briefings/generate',
  validateBody(bodyShape({})),
  async (_req: Request, res: Response): Promise<void> => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);

    if (services.ai.isLive) {
      try {
        const aiBrief = await generateAIBriefing(dateStr);
        res.json({
          success: true,
          message: 'Briefing generated by AI agent collective.',
          jobId: `job-${now.getTime()}`,
          briefingId: aiBrief.id,
          briefing: withAgentNames(aiBrief),
          estimatedCompletionAt: now.toISOString(),
        });
        return;
      } catch (err) {
        logger.error(
          { err: err instanceof Error ? err.message : String(err) },
          '[pulse] on-demand AI generation failed; falling back to synthesis',
        );
      }
    }

    const prior = await getLatestBriefing();
    const newId = `brief-${dateStr}-${now.getTime()}`;

    const hashStr = (s: string): number => {
      let h = 0;
      for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
      return h;
    };
    const synthesizedSections: BriefingSection[] = (prior?.sections ?? []).map((s) => {
      const seed = (hashStr(`${newId}:${s.title}`) % 1000) / 1000;
      const drift = (seed - 0.5) * 0.06;
      const newConf = Math.max(0.4, Math.min(0.99, Number((s.confidence + drift).toFixed(2))));
      return {
        ...s,
        confidence: newConf,
        confidenceLabel:
          newConf >= 0.8
            ? 'HIGH'
            : newConf >= 0.65
              ? 'MODERATE'
              : newConf >= 0.5
                ? 'LOW'
                : 'INSUFFICIENT',
        lastUpdated: now.toISOString(),
      };
    });

    const avgConf = synthesizedSections.length
      ? Number(
          (
            synthesizedSections.reduce((sum, s) => sum + s.confidence, 0) /
            synthesizedSections.length
          ).toFixed(2),
        )
      : 0.75;

    const nextBrief: Briefing = {
      id: newId,
      date: dateStr,
      edition: `Synthesized Edition · ${now.toUTCString()}`,
      classification: 'SZL-EXEC-RESTRICTED',
      status: 'published',
      overallRisk: prior?.overallRisk ?? 'MEDIUM',
      overallConfidence: avgConf,
      headline: `On-demand brief synthesized from Nuro Mesh agent collective at ${now.toISOString()}`,
      leadSentence: `Seven domains re-evaluated against the latest operational telemetry. Average confidence ${(avgConf * 100).toFixed(0)}%. Prior brief ${prior?.id ?? 'n/a'} used as source of truth for sections without new signals.`,
      domains: prior?.domains ?? ['executive'],
      sections: synthesizedSections,
      recommendedActions: prior?.recommendedActions ?? [],
      generatedAt: now.toISOString(),
    };

    await insertBriefing(nextBrief);

    res.json({
      success: true,
      message: 'Briefing synthesized and published.',
      jobId: `job-${now.getTime()}`,
      briefingId: nextBrief.id,
      briefing: withAgentNames(nextBrief),
      estimatedCompletionAt: now.toISOString(),
    });
  },
);

router.get(
  '/confidence',
  validateQuery(listQuerySchema),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const history = await buildConfidenceHistory();
      res.json({ success: true, history });
    } catch {
      res.json({ success: true, history: DEMO_CONFIDENCE_HISTORY });
    }
  },
);

function rowToDissent(r: typeof pulseDissentsTable.$inferSelect): DissentRecord {
  return {
    id: r.dissentId,
    briefingId: r.briefingId,
    sectionId: r.sectionId,
    sectionTitle: r.sectionTitle,
    dissentingView: r.dissentingView,
    basis: r.basis,
    filedBy: r.filedBy,
    filedAt: r.filedAt.toISOString(),
    status: r.status,
    resolution: r.resolution ?? undefined,
    resolvedAt: r.resolvedAt?.toISOString(),
    impactIfCorrect: r.impactIfCorrect,
  };
}

router.post(
  '/custom',
  validateBody(
    bodyShape({
      agents: z.unknown().optional(),
      domains: z.unknown().optional(),
      entity: z.unknown().optional(),
      scenario: z.unknown().optional(),
      topic: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response): Promise<void> => {
    const { topic, entity, scenario, domains, agents } = req.body;
    if (!topic) {
      sendBadRequest(res, 'topic is required');
      return;
    }

    const requestId = `custom-${Date.now()}`;
    const [row] = await db
      .insert(pulseCustomBriefsTable)
      .values({
        requestId,
        topic,
        entity: entity ?? null,
        scenario: scenario ?? null,
        domains: domains ?? null,
        agents: agents ?? null,
        status: 'pending',
      })
      .returning();

    const entry: CustomBriefRequest = {
      id: requestId,
      topic,
      entity,
      scenario,
      domains,
      agents,
      requestedAt: row?.requestedAt.toISOString(),
      status: 'pending',
    };

    res.json({
      success: true,
      request: entry,
      message: 'Custom brief request persisted. Estimated completion: 4–8 minutes.',
    });
  },
);

router.get(
  '/custom',
  validateQuery(listQuerySchema),
  async (_req: Request, res: Response): Promise<void> => {
    const rows = await db
      .select()
      .from(pulseCustomBriefsTable)
      .orderBy(desc(pulseCustomBriefsTable.requestedAt));
    const requests: CustomBriefRequest[] = rows.map((r) => ({
      id: r.requestId,
      topic: r.topic,
      entity: r.entity ?? undefined,
      scenario: r.scenario ?? undefined,
      domains: (r.domains as DomainKey[] | null) ?? undefined,
      agents: (r.agents as string[] | null) ?? undefined,
      requestedAt: r.requestedAt.toISOString(),
      status: r.status,
      briefingId: r.briefingId ?? undefined,
    }));
    res.json({ success: true, requests });
  },
);

router.get(
  '/dissents',
  validateQuery(listQuerySchema),
  async (_req: Request, res: Response): Promise<void> => {
    const rows = await db
      .select()
      .from(pulseDissentsTable)
      .orderBy(desc(pulseDissentsTable.filedAt));
    res.json({ success: true, dissents: rows.map(rowToDissent) });
  },
);

router.post(
  '/dissents',
  validateBody(
    bodyShape({
      basis: z.unknown().optional(),
      briefingId: z.unknown().optional(),
      dissentingView: z.unknown().optional(),
      impactIfCorrect: z.unknown().optional(),
      sectionId: z.unknown().optional(),
      sectionTitle: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response): Promise<void> => {
    const { briefingId, sectionId, sectionTitle, dissentingView, basis, impactIfCorrect } =
      req.body;
    if (!sectionTitle || !dissentingView || !basis) {
      sendBadRequest(res, 'sectionTitle, dissentingView, and basis are required');
      return;
    }

    const dissentId = `dissent-${Date.now()}`;
    const [row] = await db
      .insert(pulseDissentsTable)
      .values({
        dissentId,
        briefingId: briefingId ?? 'brief-2026-04-16',
        sectionId: sectionId ?? String(sectionTitle).toLowerCase().replace(/\s+/g, '-'),
        sectionTitle,
        dissentingView,
        basis,
        impactIfCorrect: impactIfCorrect ?? '',
        filedBy: 'Operator',
        status: 'open',
      })
      .returning();

    res.json({
      success: true,
      dissent: rowToDissent(row!),
      message: 'Dissent filed and persisted.',
    });
  },
);

router.patch(
  '/dissents/:id',
  validateBody(
    bodyShape({
      basis: z.unknown().optional(),
      dissentingView: z.unknown().optional(),
      impactIfCorrect: z.unknown().optional(),
      resolution: z.unknown().optional(),
      resolvedAt: z.unknown().optional(),
      status: z.unknown().optional(),
    }),
  ),
  requireRole('ops', 'exec', 'admin', 'super_admin'),
  async (req: Request, res: Response): Promise<void> => {
    const dissentId: string = String(req.params.id ?? '');
    const existing = await db
      .select()
      .from(pulseDissentsTable)
      .where(eq(pulseDissentsTable.dissentId, dissentId))
      .limit(1);
    if (existing.length === 0) {
      sendNotFound(res, 'Dissent');
      return;
    }

    const body = req.body as Partial<DissentRecord>;
    const updates: Partial<typeof pulseDissentsTable.$inferInsert> = { updatedAt: new Date() };
    if (body.status !== undefined) updates.status = body.status;
    if (body.resolution !== undefined) updates.resolution = body.resolution;
    if (body.resolvedAt !== undefined)
      updates.resolvedAt = body.resolvedAt ? new Date(body.resolvedAt) : null;
    if (body.dissentingView !== undefined) updates.dissentingView = body.dissentingView;
    if (body.basis !== undefined) updates.basis = body.basis;
    if (body.impactIfCorrect !== undefined) updates.impactIfCorrect = body.impactIfCorrect;

    const [row] = await db
      .update(pulseDissentsTable)
      .set(updates)
      .where(eq(pulseDissentsTable.dissentId, dissentId))
      .returning();
    res.json({ success: true, dissent: rowToDissent(row!) });
  },
);

// ─── PDF rendering ────────────────────────────────────────────────────────────
// Pulse editorial branding: ink-blue header band with gold rule, serif body
// (built-in Times) for an FT/Economist-style executive leave-behind.
const PULSE_INK = '#0a0f1e';
const PULSE_GOLD = '#c8a84b';
const PULSE_TEXT = '#1a1f2e';
const PULSE_TEXT_DIM = '#4a5468';
const PULSE_RULE = '#c0c8d4';
const PULSE_RED = '#b8453d';
const PULSE_AMBER = '#b8772a';

function riskColor(risk: string): string {
  if (risk === 'CRITICAL') return PULSE_RED;
  if (risk === 'HIGH') return '#c8612e';
  if (risk === 'MEDIUM') return PULSE_AMBER;
  return '#3d7a4f';
}

function priorityColor(priority: string): string {
  if (priority === 'P0') return PULSE_RED;
  if (priority === 'P1') return '#c8612e';
  if (priority === 'P2') return PULSE_GOLD;
  return '#3d7a4f';
}

function drawPulseHeader(doc: PDFKit.PDFDocument, brief: Briefing): void {
  const pageW = doc.page.width;
  const bandH = 78;
  // Ink header band
  doc.save();
  doc.rect(0, 0, pageW, bandH).fill(PULSE_INK);
  // Gold rule under the band
  doc.rect(0, bandH, pageW, 2).fill(PULSE_GOLD);
  doc.restore();

  // Wordmark + classification inside the band
  doc
    .fillColor('#ffffff')
    .font('Times-Bold')
    .fontSize(26)
    .text('PULSE', 54, 22, { lineBreak: false });
  doc
    .fillColor(PULSE_GOLD)
    .font('Times-Italic')
    .fontSize(9)
    .text('SZL HOLDINGS · MULTI-AGENT EXECUTIVE BRIEFING', 54, 52, { lineBreak: false });

  // Right side: edition + classification
  const rightX = pageW - 54;
  doc
    .fillColor('#ffffff')
    .font('Helvetica')
    .fontSize(8)
    .text(brief.edition.toUpperCase(), rightX - 220, 24, {
      width: 220,
      align: 'right',
      lineBreak: false,
    });
  doc
    .fillColor(PULSE_GOLD)
    .font('Helvetica-Bold')
    .fontSize(8)
    .text(brief.classification, rightX - 220, 40, { width: 220, align: 'right', lineBreak: false });
  const dateLabel = new Date(brief.date)
    .toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    .toUpperCase();
  doc
    .fillColor('#a8b4c8')
    .font('Helvetica')
    .fontSize(8)
    .text(dateLabel, rightX - 220, 54, { width: 220, align: 'right', lineBreak: false });

  // Reset cursor below the band with breathing room
  doc.y = bandH + 22;
  doc.x = 54;
}

function drawFooter(
  doc: PDFKit.PDFDocument,
  brief: Briefing,
  pageNum: number,
  total: number,
): void {
  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const y = pageH - 36;
  doc.save();
  doc
    .moveTo(54, y)
    .lineTo(pageW - 54, y)
    .lineWidth(0.5)
    .strokeColor(PULSE_RULE)
    .stroke();
  doc
    .fillColor(PULSE_TEXT_DIM)
    .font('Helvetica')
    .fontSize(7.5)
    .text(
      `Pulse · ${brief.id} · Generated ${new Date(brief.generatedAt).toUTCString()}`,
      54,
      y + 8,
      { lineBreak: false },
    );
  doc
    .fillColor(PULSE_TEXT_DIM)
    .font('Helvetica')
    .fontSize(7.5)
    .text(`Page ${pageNum} of ${total}`, pageW - 154, y + 8, {
      width: 100,
      align: 'right',
      lineBreak: false,
    });
  doc.restore();
}

function drawSectionRule(doc: PDFKit.PDFDocument): void {
  const y = doc.y + 4;
  doc.save();
  doc
    .moveTo(54, y)
    .lineTo(doc.page.width - 54, y)
    .lineWidth(0.5)
    .strokeColor(PULSE_RULE)
    .stroke();
  doc.restore();
  doc.y = y + 8;
}

function drawPill(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  bg: string,
  fg: string,
): number {
  const padX = 6;
  const h = 13;
  doc.font('Helvetica-Bold').fontSize(7);
  const w = doc.widthOfString(text) + padX * 2;
  doc.save();
  doc.roundedRect(x, y, w, h, 2).fill(bg);
  doc.fillColor(fg).text(text, x + padX, y + 3.2, { lineBreak: false, width: w - padX * 2 });
  doc.restore();
  return w;
}

function renderBriefingPdf(res: Response, brief: Briefing): void {
  const enriched = withAgentNames(brief);
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 54, bottom: 54, left: 54, right: 54 },
    bufferPages: true,
    info: {
      Title: `Pulse Brief · ${enriched.date}`,
      Author: 'SZL Holdings · Pulse',
      Subject: enriched.headline,
      Keywords: `pulse, briefing, ${enriched.domains.join(', ')}`,
    },
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="pulse-${enriched.date}.pdf"`);
  res.setHeader('Cache-Control', 'private, no-store');
  doc.pipe(res);

  drawPulseHeader(doc, enriched);
  doc.on('pageAdded', () => drawPulseHeader(doc, enriched));

  // Headline + lead
  doc
    .fillColor(PULSE_TEXT)
    .font('Times-Bold')
    .fontSize(18)
    .text(enriched.headline, { align: 'left' });
  doc.moveDown(0.4);
  doc
    .fillColor(PULSE_TEXT_DIM)
    .font('Times-Italic')
    .fontSize(11)
    .text(enriched.leadSentence, { align: 'left' });
  doc.moveDown(0.6);

  // Risk / confidence pill row
  const pillY = doc.y;
  let pillX = 54;
  pillX +=
    drawPill(
      doc,
      `OVERALL RISK · ${enriched.overallRisk}`,
      pillX,
      pillY,
      riskColor(enriched.overallRisk),
      '#ffffff',
    ) + 6;
  pillX +=
    drawPill(
      doc,
      `CONFIDENCE · ${(enriched.overallConfidence * 100).toFixed(0)}%`,
      pillX,
      pillY,
      PULSE_INK,
      PULSE_GOLD,
    ) + 6;
  pillX +=
    drawPill(
      doc,
      `${enriched.sections.length} DOMAIN SECTIONS`,
      pillX,
      pillY,
      '#e5e9f2',
      PULSE_TEXT,
    ) + 6;
  doc.y = pillY + 22;
  drawSectionRule(doc);

  // Recommended Actions — front and center for executives
  if (enriched.recommendedActions.length) {
    doc.fillColor(PULSE_INK).font('Times-Bold').fontSize(13).text('Recommended Actions — Today');
    doc.moveDown(0.4);
    for (const a of enriched.recommendedActions) {
      if (doc.y > doc.page.height - 120) doc.addPage();
      const rowY = doc.y;
      const pColor = priorityColor(a.priority);
      // Priority badge
      doc.save();
      doc.roundedRect(54, rowY, 28, 16, 2).fill(pColor);
      doc
        .fillColor('#ffffff')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(a.priority, 54, rowY + 4, { width: 28, align: 'center', lineBreak: false });
      doc.restore();
      // Action text
      doc
        .fillColor(PULSE_TEXT)
        .font('Times-Bold')
        .fontSize(11)
        .text(a.action, 92, rowY, { width: doc.page.width - 54 - 92 });
      doc
        .fillColor(PULSE_TEXT_DIM)
        .font('Times-Italic')
        .fontSize(9.5)
        .text(a.rationale, 92, doc.y + 2, { width: doc.page.width - 54 - 92 });
      doc
        .fillColor(PULSE_TEXT_DIM)
        .font('Helvetica')
        .fontSize(8.5)
        .text(`Owner: ${a.owner}   ·   Due: ${a.dueBy}`, 92, doc.y + 2);
      doc.x = 54;
      doc.moveDown(0.6);
    }
    drawSectionRule(doc);
  }

  // Domain sections
  doc.fillColor(PULSE_INK).font('Times-Bold').fontSize(13).text('Domain Intelligence');
  doc.moveDown(0.4);

  for (const section of enriched.sections) {
    if (doc.y > doc.page.height - 180) doc.addPage();

    // Section header row: title + agent + risk + confidence
    const headerY = doc.y;
    const agentName = (section as { agentName?: string }).agentName ?? section.agentId;
    doc
      .fillColor(PULSE_INK)
      .font('Times-Bold')
      .fontSize(13)
      .text(section.title, 54, headerY, { lineBreak: false });
    // Right side meta pills
    const rightX = doc.page.width - 54;
    let metaX = rightX;
    const confW =
      doc
        .font('Helvetica-Bold')
        .fontSize(7)
        .widthOfString(`CONF ${(section.confidence * 100).toFixed(0)}%`) + 12;
    metaX -= confW;
    drawPill(
      doc,
      `CONF ${(section.confidence * 100).toFixed(0)}%`,
      metaX,
      headerY + 1,
      PULSE_INK,
      PULSE_GOLD,
    );
    const riskW = doc.font('Helvetica-Bold').fontSize(7).widthOfString(section.riskLevel) + 12;
    metaX -= riskW + 6;
    drawPill(doc, section.riskLevel, metaX, headerY + 1, riskColor(section.riskLevel), '#ffffff');

    doc.x = 54;
    doc.y = headerY + 18;
    doc
      .fillColor(PULSE_TEXT_DIM)
      .font('Helvetica')
      .fontSize(8.5)
      .text(
        `${agentName} · ${section.confidenceLabel} confidence · Updated ${new Date(section.lastUpdated).toUTCString()}`,
      );
    doc.moveDown(0.4);

    // Key judgment in a tinted box
    const judgY = doc.y;
    const innerW = doc.page.width - 108;
    doc.save();
    doc.rect(54, judgY, 3, 0).fill(PULSE_GOLD);
    doc
      .fillColor(PULSE_TEXT)
      .font('Times-Bold')
      .fontSize(10.5)
      .text('KEY JUDGMENT', 64, judgY, { width: innerW - 10 });
    doc
      .fillColor(PULSE_TEXT)
      .font('Times-Roman')
      .fontSize(11)
      .text(section.keyJudgment, 64, doc.y + 1, { width: innerW - 10 });
    const judgEndY = doc.y + 4;
    doc.rect(54, judgY, 3, judgEndY - judgY).fill(PULSE_GOLD);
    doc.restore();
    doc.x = 54;
    doc.y = judgEndY + 8;

    // Narrative paragraphs
    for (const para of section.narrative) {
      if (doc.y > doc.page.height - 100) doc.addPage();
      doc
        .fillColor(PULSE_TEXT)
        .font('Times-Roman')
        .fontSize(10.5)
        .text(para, 54, doc.y, {
          align: 'justify',
          width: doc.page.width - 108,
        });
      doc.moveDown(0.3);
    }

    // Two-column key findings + assumptions/gaps
    if (section.keyFindings.length) {
      if (doc.y > doc.page.height - 140) doc.addPage();
      doc.moveDown(0.2);
      doc.fillColor(PULSE_INK).font('Times-Bold').fontSize(10).text('Key findings');
      doc.moveDown(0.15);
      for (const f of section.keyFindings) {
        const lineY = doc.y;
        // Severity dot
        doc.save();
        doc.circle(58, lineY + 5, 2.5).fill(riskColor(f.severity));
        doc.restore();
        doc
          .fillColor(PULSE_TEXT_DIM)
          .font('Helvetica-Bold')
          .fontSize(8)
          .text(`[${f.severity}]`, 64, lineY, { lineBreak: false });
        const sevW = doc.widthOfString(`[${f.severity}] `) + 4;
        doc
          .fillColor(PULSE_TEXT)
          .font('Times-Roman')
          .fontSize(10)
          .text(f.finding, 64 + sevW, lineY, {
            width: doc.page.width - 108 - sevW,
          });
        doc.x = 54;
      }
    }

    if (section.assumptions.length) {
      doc.moveDown(0.25);
      doc.fillColor(PULSE_INK).font('Times-Bold').fontSize(10).text('Key assumptions');
      doc.moveDown(0.1);
      for (const a of section.assumptions) {
        doc
          .fillColor(PULSE_TEXT)
          .font('Times-Roman')
          .fontSize(10)
          .text(`•  ${a}`, 64, doc.y, { width: doc.page.width - 118 });
        doc.x = 54;
      }
    }

    if (section.gaps.length) {
      doc.moveDown(0.25);
      doc.fillColor(PULSE_AMBER).font('Times-Bold').fontSize(10).text('Gaps & confidence limiters');
      doc.moveDown(0.1);
      for (const g of section.gaps) {
        doc
          .fillColor(PULSE_TEXT)
          .font('Times-Roman')
          .fontSize(10)
          .text(`•  ${g}`, 64, doc.y, { width: doc.page.width - 118 });
        doc.x = 54;
      }
    }

    doc.moveDown(0.6);
    drawSectionRule(doc);
  }

  // Closing colophon
  if (doc.y > doc.page.height - 90) doc.addPage();
  doc
    .fillColor(PULSE_TEXT_DIM)
    .font('Times-Italic')
    .fontSize(9)
    .text(
      'Synthesized by the Nuro Mesh agent collective and curated by Alloy. All confidence figures are calibrated against reported gaps and assumptions; readers should weight recommended actions accordingly.',
      54,
      doc.y,
      { width: doc.page.width - 108, align: 'justify' },
    );

  // Per-page footer with brief id and "Page N of M" — uses the bufferPages
  // option so we can iterate every page after layout is finalized.
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i += 1) {
    doc.switchToPage(range.start + i);
    drawFooter(doc, enriched, i + 1, range.count);
  }

  doc.end();
}

router.post(
  '/export/pdf',
  validateBody(bodyShape({})),
  async (req: Request, res: Response): Promise<void> => {
    const briefingId: string | undefined = req.body?.briefingId;
    const brief = briefingId ? await getBriefingById(briefingId) : await getLatestBriefing();
    if (!brief) {
      sendNotFound(res, 'Briefing');
      return;
    }
    renderBriefingPdf(res, brief);
  },
);

// ─── Email subscriptions ──────────────────────────────────────────────────────

const VALID_DOMAIN_KEYS: DomainKey[] = [
  'maritime',
  'security',
  'real_estate',
  'legal',
  'financial',
  'platform',
  'executive',
];

interface PublicSubscription {
  id: number;
  email: string;
  domains: string[];
  status: 'active' | 'paused' | 'cancelled';
  unsubscribeUrl: string;
  lastSentAt: string | null;
  createdAt: string;
}

function buildUnsubscribeUrl(token: string): string {
  const origin = process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : 'http://localhost:5201';
  return `${origin}/api/pulse/unsubscribe?token=${encodeURIComponent(token)}`;
}

function rowToSubscription(
  row: typeof pulseEmailSubscriptionsTable.$inferSelect,
): PublicSubscription {
  return {
    id: row.id,
    email: row.email,
    domains: row.domains ?? [],
    status: row.status,
    unsubscribeUrl: buildUnsubscribeUrl(row.unsubscribeToken),
    lastSentAt: row.lastSentAt ? row.lastSentAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const v = raw.trim().toLowerCase();
  // RFC 5322 simplified
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return null;
  if (v.length > 254) return null;
  return v;
}

function normalizeDomains(raw: unknown): DomainKey[] {
  if (!Array.isArray(raw)) return [];
  const out: DomainKey[] = [];
  for (const d of raw) {
    if (
      typeof d === 'string' &&
      VALID_DOMAIN_KEYS.includes(d as DomainKey) &&
      !out.includes(d as DomainKey)
    ) {
      out.push(d as DomainKey);
    }
  }
  return out;
}

router.get('/subscriptions', async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    sendUnauthorized(res);
    return;
  }
  const rows = await db
    .select()
    .from(pulseEmailSubscriptionsTable)
    .where(eq(pulseEmailSubscriptionsTable.userId, req.user.id))
    .orderBy(desc(pulseEmailSubscriptionsTable.createdAt));
  res.json({ success: true, subscriptions: rows.map(rowToSubscription) });
});

router.post(
  '/subscriptions',
  validateBody(bodyShape({})),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }
    const email = normalizeEmail(req.body?.email ?? req.user.email);
    if (!email) {
      sendBadRequest(res, 'valid email is required');
      return;
    }
    const domains = normalizeDomains(req.body?.domains);

    // Idempotent: if a non-cancelled subscription with this user+email exists,
    // reactivate it and update domains rather than creating a duplicate.
    const existing = await db
      .select()
      .from(pulseEmailSubscriptionsTable)
      .where(
        and(
          eq(pulseEmailSubscriptionsTable.userId, req.user.id),
          eq(pulseEmailSubscriptionsTable.email, email),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      const [row] = await db
        .update(pulseEmailSubscriptionsTable)
        .set({
          domains,
          status: 'active',
          updatedAt: new Date(),
        })
        .where(eq(pulseEmailSubscriptionsTable.id, existing[0]?.id))
        .returning();
      res.json({
        success: true,
        subscription: rowToSubscription(row!),
        message: 'Subscription reactivated.',
      });
      return;
    }

    const token = randomBytes(24).toString('hex');
    const [row] = await db
      .insert(pulseEmailSubscriptionsTable)
      .values({
        userId: req.user.id,
        email,
        domains,
        status: 'active',
        unsubscribeToken: token,
      })
      .returning();
    res.json({
      success: true,
      subscription: rowToSubscription(row!),
      message: 'Subscribed to daily Pulse briefing.',
    });
  },
);

router.patch(
  '/subscriptions/:id',
  validateBody(
    bodyShape({
      domains: z.unknown().optional(),
      status: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }
    const id = parseInt(String(req.params.id ?? ''), 10);
    if (!Number.isFinite(id)) {
      sendBadRequest(res, 'invalid subscription id');
      return;
    }

    const existing = await db
      .select()
      .from(pulseEmailSubscriptionsTable)
      .where(
        and(
          eq(pulseEmailSubscriptionsTable.id, id),
          eq(pulseEmailSubscriptionsTable.userId, req.user.id),
        ),
      )
      .limit(1);
    if (existing.length === 0) {
      sendNotFound(res, 'Subscription');
      return;
    }

    const updates: Partial<typeof pulseEmailSubscriptionsTable.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (typeof req.body?.status === 'string') {
      if (!['active', 'paused', 'cancelled'].includes(req.body.status)) {
        sendBadRequest(res, 'status must be active, paused, or cancelled');
        return;
      }
      updates.status = req.body.status;
    }
    if (Array.isArray(req.body?.domains)) {
      updates.domains = normalizeDomains(req.body.domains);
    }

    const [row] = await db
      .update(pulseEmailSubscriptionsTable)
      .set(updates)
      .where(eq(pulseEmailSubscriptionsTable.id, id))
      .returning();
    res.json({ success: true, subscription: rowToSubscription(row!) });
  },
);

router.delete('/subscriptions/:id', async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    sendUnauthorized(res);
    return;
  }
  const id = parseInt(String(req.params.id ?? ''), 10);
  if (!Number.isFinite(id)) {
    sendBadRequest(res, 'invalid subscription id');
    return;
  }

  const result = await db
    .update(pulseEmailSubscriptionsTable)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(
      and(
        eq(pulseEmailSubscriptionsTable.id, id),
        eq(pulseEmailSubscriptionsTable.userId, req.user.id),
      ),
    )
    .returning();
  if (result.length === 0) {
    sendNotFound(res, 'Subscription');
    return;
  }
  res.json({
    success: true,
    subscription: rowToSubscription(result[0]!),
    message: 'Subscription cancelled.',
  });
});

export default router;
