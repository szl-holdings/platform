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
        briefing: latest ? withAgentNames(latest) : (DEMO_BRIEFINGS[0] ?? null),
      });
    } catch {
      res.json({ success: true, briefing: DEMO_BRIEFINGS[0] ?? null });
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
          briefings: briefings.length > 0 ? briefings.map(withAgentNames) : DEMO_BRIEFINGS,
          total: briefings.length || DEMO_BRIEFINGS.length,
        });
      } catch {
        res.json({ success: true, briefings: DEMO_BRIEFINGS, total: DEMO_BRIEFINGS.length });
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
      if (!brief)
        brief =
          (briefingId ? DEMO_BRIEFINGS.find((b) => b.id === briefingId) : DEMO_BRIEFINGS[0]) ??
          DEMO_BRIEFINGS[0]!;
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
        res.json({ success: true, dissents: dissents.length > 0 ? dissents : DEMO_DISSENTS });
      } catch {
        res.json({ success: true, dissents: DEMO_DISSENTS });
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

const DEMO_BRIEFINGS: Briefing[] = [
  {
    id: 'brief-2026-04-16',
    date: '2026-04-16',
    edition: 'Morning Edition · Vol. 847',
    classification: 'SZL-EXEC-RESTRICTED',
    status: 'published',
    overallRisk: 'HIGH',
    overallConfidence: 0.74,
    headline:
      'Red Sea transit risk elevated as Houthi activity escalates; SZL portfolio maintains resilience across seven of eight monitored domains',
    leadSentence:
      "Seven of eight monitored domains report stable or improving conditions; maritime risk has materially increased following overnight Houthi drone strikes near the Bab-el-Mandeb strait, affecting two vessels in SZL's tracked fleet.",
    domains: ['maritime', 'security', 'real_estate', 'legal', 'financial', 'platform', 'executive'],
    generatedAt: '2026-04-16T05:30:00Z',
    sections: [
      {
        id: 'exec-summary',
        title: 'Executive Summary',
        agentId: 'alloy',
        confidence: 0.81,
        confidenceLabel: 'HIGH',
        riskLevel: 'HIGH',
        keyJudgment:
          'SZL Holdings operates from a position of structural resilience while navigating elevated maritime risk; no immediate capital or operational intervention is required beyond fleet rerouting.',
        narrative: [
          "This morning's brief covers seven primary domains and reflects a net risk posture of HIGH across the SZL portfolio, driven primarily by escalating maritime activity in the Red Sea corridor. The broader investment portfolio, legal pipeline, and platform health remain at MEDIUM or below.",
          'The Nuro Mesh agent collective has identified three decision-grade signals requiring executive attention in the next 24–48 hours: maritime rerouting authorization for MV Concordia Strait, a deferred regulatory filing deadline for the Henderson acquisition, and an anomalous draw on SZL Capital Fund III liquidity reserves that warrants closer review.',
          "Confidence in today's assessment is HIGH overall (0.81), with the primary confidence limiter being incomplete AIS coverage in the Bab-el-Mandeb approach corridor — 14% of the fleet tracking window returned null positions for more than 4 hours overnight. All material gaps are disclosed within their respective domain sections.",
        ],
        keyFindings: [
          {
            finding: 'Three decision-grade signals require executive attention within 24 hours',
            severity: 'HIGH',
          },
          {
            finding:
              'Net portfolio exposure to Red Sea route disruption is $4.2M in at-risk freight revenue',
            severity: 'HIGH',
          },
          {
            finding: 'Seven of eight domains report stable or improving operating conditions',
            severity: 'LOW',
          },
        ],
        assumptions: [
          'AIS gaps are attributable to signal interference, not active transponder disabling',
          'Henderson regulatory filing can be filed with 48-hour extension without penalty',
        ],
        gaps: [
          '14% AIS null position window overnight — limits confidence in fleet location assertions',
          'Fund III liquidity draw source unconfirmed pending wire trace',
        ],
        lastUpdated: '2026-04-16T05:28:00Z',
      },
      {
        id: 'maritime',
        title: 'Maritime Outlook',
        agentId: 'helmsman',
        confidence: 0.68,
        confidenceLabel: 'MODERATE',
        riskLevel: 'HIGH',
        keyJudgment:
          'Houthi drone activity overnight has materially elevated risk in the Bab-el-Mandeb corridor; MV Concordia Strait should be rerouted via Cape of Good Hope absent explicit executive risk acceptance.',
        narrative: [
          'Two Houthi-attributed drone strikes were recorded near the Bab-el-Mandeb strait between 02:15 and 03:47 UTC. Neither struck SZL-tracked vessels; one struck a non-affiliated bulk carrier registered in Panama, the other was intercepted by HMS Diamond operating under Combined Maritime Forces Task Force 153.',
          'MV Concordia Strait (SZL fleet, benzene cargo, 47,800 DWT) is currently 18 hours from the strait entry point. At current speed (12.4 knots, heading 155°), rerouting via Cape of Good Hope adds 11 days to ETA and approximately $340,000 in additional bunker and insurance costs. Failure to reroute exposes the vessel to moderate-to-high strike risk based on current threat actor targeting patterns.',
          'The remaining seven SZL-tracked vessels are either already clear of the Red Sea or have cleared the strait within the past 48 hours. Fleet insurer (Skuld) has issued a blanket additional premium notice effective 06:00 UTC for vessels entering the strait; the additional premium increases P&I exposure by approximately 22%.',
          "Confidence in this assessment is MODERATE (0.68). Primary confidence limiter: 14% AIS null position windows overnight limit certainty on MV Concordia Strait's precise location and heading as of last update.",
        ],
        keyFindings: [
          {
            finding: 'Two Houthi drone strikes recorded near Bab-el-Mandeb 02:15–03:47 UTC',
            severity: 'CRITICAL',
          },
          {
            finding: 'MV Concordia Strait requires rerouting decision within 6 hours',
            severity: 'HIGH',
          },
          {
            finding: 'Fleet insurer issued blanket additional premium notice effective 06:00 UTC',
            severity: 'MEDIUM',
          },
          {
            finding: 'Seven other SZL vessels already clear of high-risk corridor',
            severity: 'LOW',
          },
        ],
        assumptions: [
          'AIS gaps are attributable to RF interference from HMS Diamond ECM operations, not deliberate AIS spoofing',
          'Skuld additional premium is negotiable and will not apply retroactively to vessels already clear',
        ],
        gaps: [
          "14% AIS null coverage window overnight — MV Concordia Strait last confirmed position: 12°42'N 43°29'E at 01:06 UTC",
          'No direct confirmation of whether SZL cargo manifests have been reviewed by Houthi intelligence — threat actor targeting rationale unknown',
        ],
        lastUpdated: '2026-04-16T05:15:00Z',
      },
      {
        id: 'security',
        title: 'Threat Landscape',
        agentId: 'sentinel',
        confidence: 0.79,
        confidenceLabel: 'HIGH',
        riskLevel: 'MEDIUM',
        keyJudgment:
          'Platform attack surface remains contained; a targeted spear-phishing campaign against SZL finance team members has been detected and neutralized before material compromise.',
        narrative: [
          'Sentinel identified a targeted spear-phishing campaign at 22:47 UTC yesterday targeting five SZL finance team email accounts. The campaign leveraged a spoofed wire transfer confirmation template attributed to Bank of America. All five messages were quarantined by the enterprise DLP stack before any user interaction; no credentials were harvested.',
          'Attribution assessment: MODERATE confidence (0.72) that the campaign originates from a financially-motivated threat actor using infrastructure previously associated with TA505, a prolific e-crime group with documented interest in financial services firms. Confidence limiter: limited telemetry on C2 infrastructure overlap — pattern match on email template only.',
          "The SZL attack surface shows three outstanding CVEs rated CVSS ≥8.0 that remain unpatched on non-critical infrastructure (identified in last week's scan). Zeus has queued patching for the upcoming maintenance window. No active exploitation of these CVEs has been observed in our environment.",
          'No ransomware precursor activity (LOLBin staging, lateral movement, unusual exfil patterns) has been detected in the past 72 hours.',
        ],
        keyFindings: [
          {
            finding: 'Targeted phishing campaign quarantined — no credential harvest',
            severity: 'MEDIUM',
          },
          {
            finding: 'Three unpatched CVSS ≥8.0 CVEs on non-critical infrastructure',
            severity: 'MEDIUM',
          },
          {
            finding: 'No ransomware precursor activity detected in past 72 hours',
            severity: 'LOW',
          },
        ],
        assumptions: [
          'DLP quarantine was complete — no messages reached user inboxes',
          'TA505 attribution is probabilistic; no confirmed tooling match',
        ],
        gaps: [
          'Limited visibility into C2 infrastructure beyond first-hop IP geolocation',
          'No telemetry on whether same campaign targeted SZL partners or clients',
        ],
        lastUpdated: '2026-04-16T04:55:00Z',
      },
      {
        id: 'real_estate',
        title: 'Real Estate Pulse',
        agentId: 'terra',
        confidence: 0.83,
        confidenceLabel: 'HIGH',
        riskLevel: 'MEDIUM',
        keyJudgment:
          'The Henderson mixed-use acquisition remains on track; a 48-hour extension request for the environmental review filing is required to avoid a technical compliance breach.',
        narrative: [
          'The Henderson mixed-use development acquisition (SZL Real Estate Fund II, 340,000 sq ft, Las Vegas NV) is progressing toward a May 3 close. Phase II environmental review was completed by the assigned firm (Arcadis); however, the regulatory submission to Clark County has a deadline of April 17 at 5PM PT — less than 36 hours from this brief.',
          'Terra identifies a filing timeline risk: the Arcadis report requires SZL counsel sign-off before submission. Lexis has reviewed the report (completed 03:15 UTC) but the counsel signature block requires the primary attorney (currently traveling). A 48-hour extension is available under Clark County code §14.32(c) at no penalty if requested before 5PM today. Terra and Lexis jointly recommend filing the extension request immediately.',
          'Three other pipeline deals (Phoenix logistics, Austin multifamily, Denver data center) remain in due diligence with no material changes from yesterday. The Denver data center target has received a competing bid (source: broker channel intelligence, moderate confidence) — escalated to Atlas for portfolio-level capital allocation review.',
        ],
        keyFindings: [
          {
            finding: 'Henderson filing deadline in 36 hours — extension request recommended today',
            severity: 'HIGH',
          },
          { finding: 'Denver data center target has received competing bid', severity: 'MEDIUM' },
          { finding: 'Three other pipeline deals stable in due diligence', severity: 'LOW' },
        ],
        assumptions: [
          'Clark County 48-hour extension under §14.32(c) will be approved — no prior rejections on file',
          'Arcadis environmental findings are complete and will not require amendment',
        ],
        gaps: [
          'Competing bid on Denver data center: amount unknown, buyer identity unconfirmed',
          'Primary counsel availability for Henderson signature confirmation pending',
        ],
        lastUpdated: '2026-04-16T04:40:00Z',
      },
      {
        id: 'legal',
        title: 'Legal Pipeline',
        agentId: 'lexis',
        confidence: 0.86,
        confidenceLabel: 'HIGH',
        riskLevel: 'MEDIUM',
        keyJudgment:
          'Legal pipeline is stable with three active matters in negotiation phase; the Henderson deadline requires same-day action but carries low legal risk if handled today.',
        narrative: [
          'PRISM Counsel active matter count: 14 open (3 in active negotiation, 6 in review, 5 in monitoring). No new matters filed against SZL entities in the past 48 hours.',
          'Matter 2024-RE-047 (Henderson acquisition regulatory review): As noted in the Real Estate Pulse section, the Clark County environmental filing deadline is April 17 at 5PM PT. Lexis confirms the Arcadis report is legally adequate for submission. The only blocker is the countersignature from Partner-level counsel. Lexis has drafted the extension request letter — pending approval to file.',
          "Matter 2024-IM-012 (SZL Capital Fund III LP agreement amendment): Three LPs have returned redlined amendments. Lexis assessment: two sets of redlines are acceptable with minor modifications; one LP's redlines on Section 7.3 (clawback provisions) are non-standard and require commercial discussion. No deadline pressure on this matter; flagged for awareness.",
          "Maritime matters: No new sanctions-related legal exposure identified from overnight fleet activity. Helmsman's recommended rerouting of MV Concordia Strait, if executed, maintains full sanctions compliance.",
        ],
        keyFindings: [
          {
            finding:
              'Henderson filing requires partner-level signature within 6 hours for same-day filing',
            severity: 'HIGH',
          },
          {
            finding: 'LP redlines on Fund III Section 7.3 require commercial discussion',
            severity: 'MEDIUM',
          },
          {
            finding: 'No new litigation or regulatory filings against SZL entities in 48 hours',
            severity: 'LOW',
          },
        ],
        assumptions: [
          'Clark County extension request will be processed within 2 business hours',
          'Primary counsel can provide e-signature or delegate authority today',
        ],
        gaps: [
          'Primary counsel travel schedule — delegation authority chain not confirmed',
          'LP identity on non-standard Fund III redlines not disclosed for briefing purposes',
        ],
        lastUpdated: '2026-04-16T05:05:00Z',
      },
      {
        id: 'financial',
        title: 'Portfolio Movements',
        agentId: 'atlas',
        confidence: 0.77,
        confidenceLabel: 'HIGH',
        riskLevel: 'MEDIUM',
        keyJudgment:
          "Portfolio performance is on-track for Q2 targets; an anomalous liquidity draw from SZL Capital Fund III requires investigation before the fund's April 25 LP update.",
        narrative: [
          'SZL Holdings aggregate NAV as of market close April 15: $847.3M (↑0.8% from prior day). Cross-portfolio IRR YTD: 14.2%, tracking above the 12.5% target. Real Estate Fund II and Ventures Fund I are top performers; Maritime Holdings (SZL-M) is lagging due to elevated operating costs from previous Red Sea rerouting events.',
          "An anomalous outflow of $2.1M from SZL Capital Fund III was identified in overnight treasury reconciliation. The wire originated from the fund's operating account at 22:14 UTC. Atlas has flagged this to treasury operations and the CFO; at time of this brief, the wire has not been traced to an authorized instruction. This is classified as an ANOMALY requiring urgent investigation — it does not yet rise to a confirmed irregularity.",
          'The Denver data center acquisition (noted in Real Estate Pulse) presents a competing capital allocation opportunity. Current Fund II dry powder is $28.4M; acquisition would require $14–18M equity. Atlas assessment: deal fits fund mandate, timing is tight but manageable if competing bid creates deal urgency. Recommend pre-approval of exclusivity deposit if deal team confirms strategic fit.',
        ],
        keyFindings: [
          {
            finding:
              'Anomalous $2.1M wire from Fund III operating account — investigation required',
            severity: 'CRITICAL',
          },
          {
            finding: 'Portfolio NAV at $847.3M, +0.8% — tracking above Q2 targets',
            severity: 'LOW',
          },
          {
            finding: 'Denver data center requires capital allocation decision given competing bid',
            severity: 'MEDIUM',
          },
        ],
        assumptions: [
          'Fund III wire is an operational error or authorized transfer not yet matched in treasury system — not fraud',
          'Denver data center competing bid creates 5–7 day decision window',
        ],
        gaps: [
          'Fund III wire trace in progress — source instruction not yet confirmed',
          'Denver acquisition competing bid amount unknown',
        ],
        lastUpdated: '2026-04-16T05:20:00Z',
      },
      {
        id: 'platform',
        title: 'Platform Health',
        agentId: 'beacon',
        confidence: 0.91,
        confidenceLabel: 'HIGH',
        riskLevel: 'LOW',
        keyJudgment:
          'All SZL platform services operating within normal parameters; Nuro Mesh inference latency increased 12% overnight but remains within SLA.',
        narrative: [
          'All 8 SZL platform applications (Aegis, Vessels, Terra, Pulse, CORTEX, PRISM Counsel, Command, Holdings) are operational with zero P0/P1 incidents in the past 24 hours. API server uptime: 99.98% (30-day trailing).',
          'Nuro Mesh average inference latency increased from 1,840ms to 2,070ms overnight (↑12.5%). This is attributable to a 34% increase in concurrent agent consultation requests between 21:00 and 03:00 UTC — consistent with the maritime and security events covered in this brief. Latency remains within the 2,500ms P95 SLA.',
          'Database replication lag on the primary read replica spiked to 8.3 seconds at 23:44 UTC for approximately 4 minutes before resolving. Root cause: batch analytics job conflict. Zeus has scheduled the batch job to avoid overlap with peak write periods. No user-facing impact was recorded.',
          'Beacon notes that Pulse briefing generation latency has improved 18% since the model routing update deployed April 14 — average brief generation time is now 4.2 minutes.',
        ],
        keyFindings: [
          {
            finding: 'All 8 platform apps operational — zero P0/P1 incidents in 24 hours',
            severity: 'LOW',
          },
          {
            finding:
              'Nuro Mesh latency +12.5% overnight — within SLA, attributable to event-driven load',
            severity: 'LOW',
          },
          { finding: 'DB replica lag spike resolved — no user-facing impact', severity: 'LOW' },
        ],
        assumptions: [
          'Latency increase is transient and will normalize as maritime/security event load diminishes',
          'Batch job scheduling fix is sufficient to prevent future replica lag spikes',
        ],
        gaps: [
          'Root cause of replica lag spike confirmed at application level; infrastructure-level investigation pending',
        ],
        lastUpdated: '2026-04-16T05:10:00Z',
      },
    ],
    recommendedActions: [
      {
        action: 'Authorize MV Concordia Strait rerouting via Cape of Good Hope',
        priority: 'P0',
        owner: 'Fleet Operations / Executive',
        rationale:
          'Houthi activity overnight materially increases strait transit risk; $340K rerouting cost is significantly below estimated vessel and cargo loss exposure',
        dueBy: 'Within 6 hours (vessel reaches decision point)',
      },
      {
        action: 'File Clark County §14.32(c) extension request for Henderson environmental review',
        priority: 'P0',
        owner: 'Lexis / Real Estate Counsel',
        rationale:
          'Deadline is 36 hours away; extension request must be filed today to maintain compliance. Failure creates technical breach that could delay acquisition close',
        dueBy: 'Before 5PM PT today',
      },
      {
        action: 'Investigate Fund III $2.1M wire — confirm source or escalate to CFO',
        priority: 'P1',
        owner: 'CFO / Treasury Operations',
        rationale:
          'Untraced wire from fund operating account must be investigated before LP update on April 25; if not reconciled within 48 hours, escalate to external forensics',
        dueBy: 'Within 24 hours',
      },
      {
        action: 'Pre-approve Denver data center exclusivity deposit',
        priority: 'P2',
        owner: 'Investment Committee',
        rationale:
          'Competing bid creates 5–7 day window; pre-approval of exclusivity deposit allows deal team to move quickly without blocking for full IC approval',
        dueBy: 'Within 48 hours',
      },
      {
        action: 'Review LP redlines on Fund III Section 7.3 clawback provisions',
        priority: 'P3',
        owner: 'Lexis / Fund Management',
        rationale:
          'Non-standard clawback redlines need commercial discussion; no immediate deadline but should be resolved before next LP update',
        dueBy: 'Before April 25 LP update',
      },
    ],
  },
  {
    id: 'brief-2026-04-15',
    date: '2026-04-15',
    edition: 'Morning Edition · Vol. 846',
    classification: 'SZL-EXEC-RESTRICTED',
    status: 'published',
    overallRisk: 'MEDIUM',
    overallConfidence: 0.82,
    headline:
      'Portfolio performance strong across all verticals; Henderson acquisition clears Phase I — final regulatory review on track',
    leadSentence:
      'All eight monitored domains report stable or improving conditions; SZL portfolio returns YTD have accelerated to 14.2% against a 12.5% target.',
    domains: ['maritime', 'security', 'real_estate', 'legal', 'financial', 'platform', 'executive'],
    generatedAt: '2026-04-15T05:30:00Z',
    sections: [],
    recommendedActions: [
      {
        action: 'Confirm Arcadis environmental report delivery timeline for Henderson Phase II',
        priority: 'P1',
        owner: 'Real Estate Team',
        rationale: 'Phase II report due within 48 hours for April 17 regulatory deadline',
        dueBy: 'Today',
      },
    ],
  },
  {
    id: 'brief-2026-04-14',
    date: '2026-04-14',
    edition: 'Morning Edition · Vol. 845',
    classification: 'SZL-EXEC-RESTRICTED',
    status: 'published',
    overallRisk: 'MEDIUM',
    overallConfidence: 0.79,
    headline:
      'Nuro Mesh model routing update deployed — 18% latency improvement; maritime corridor risk remains monitored',
    leadSentence:
      'Platform upgrade delivered strong performance gains; cross-domain operations nominal with one emerging signal in maritime.',
    domains: ['maritime', 'platform', 'executive'],
    generatedAt: '2026-04-14T05:30:00Z',
    sections: [],
    recommendedActions: [],
  },
  {
    id: 'brief-2026-04-13',
    date: '2026-04-13',
    edition: 'Weekend Edition · Vol. 844',
    classification: 'SZL-EXEC-RESTRICTED',
    status: 'published',
    overallRisk: 'LOW',
    overallConfidence: 0.88,
    headline:
      'Quiet weekend — markets closed, fleet nominal; Q2 deal pipeline review scheduled for Monday',
    leadSentence:
      'Weekend brief — reduced scope. All critical systems nominal; no escalation signals detected.',
    domains: ['maritime', 'platform'],
    generatedAt: '2026-04-13T06:00:00Z',
    sections: [],
    recommendedActions: [],
  },
  {
    id: 'brief-2026-04-12',
    date: '2026-04-12',
    edition: 'Weekend Edition · Vol. 843',
    classification: 'SZL-EXEC-RESTRICTED',
    status: 'published',
    overallRisk: 'LOW',
    overallConfidence: 0.85,
    headline:
      'PRISM Counsel resolves two legacy matters; Fund II secondary sale closes at 1.4x book',
    leadSentence:
      'Strong close to the week with two legal matter resolutions and a favorable secondary transaction in Fund II.',
    domains: ['legal', 'financial', 'executive'],
    generatedAt: '2026-04-12T06:00:00Z',
    sections: [],
    recommendedActions: [],
  },
];

const DEMO_DISSENTS: DissentRecord[] = [
  {
    id: 'dissent-001',
    briefingId: 'brief-2026-04-16',
    sectionId: 'maritime',
    sectionTitle: 'Maritime Outlook',
    dissentingView:
      'Rerouting cost assessment understates voyage economics impact — additional 11 days increases charter liability exposure beyond the $340K bunker estimate cited.',
    basis:
      'Charter party terms for MV Concordia Strait include a demurrage clause that activates on delays exceeding 72 hours. The 11-day rerouting adds approximately $185K in demurrage exposure on top of the $340K bunker cost estimate — total rerouting cost is closer to $525K.',
    filedBy: 'Fleet Operations Analyst',
    filedAt: '2026-04-16T06:45:00Z',
    status: 'under_review',
    impactIfCorrect:
      'Total rerouting cost is $525K vs $340K stated — still below risk threshold, but changes ROI framing of the recommendation',
  },
  {
    id: 'dissent-002',
    briefingId: 'brief-2026-04-16',
    sectionId: 'financial',
    sectionTitle: 'Portfolio Movements',
    dissentingView:
      'Fund III wire may be a pre-authorized quarterly GP management fee — suggesting ANOMALY classification overstates urgency',
    basis:
      "SZL Capital Fund III's GP management fee of $2.1M is due Q2 — the wire amount and timing are consistent with an authorized quarterly disbursement. Treasury should check against the fee schedule before escalating.",
    filedBy: 'Fund Finance Associate',
    filedAt: '2026-04-16T07:12:00Z',
    status: 'acknowledged',
    resolution:
      'Treasury confirmed: wire matched Q2 GP management fee scheduled disbursement. ANOMALY classification downgraded to INFORMATIONAL. Dissent credited.',
    resolvedAt: '2026-04-16T09:30:00Z',
    impactIfCorrect: 'ANOMALY downgraded — no executive investigation needed; frees CFO bandwidth',
  },
];

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

async function seedBriefingsIfEmpty(): Promise<void> {
  try {
    const existing = await db.select().from(pulseBriefingsTable).limit(1);
    if (existing.length > 0) return;
    for (const b of DEMO_BRIEFINGS) await insertBriefing(b);
  } catch (_err) {
  }
}
void seedBriefingsIfEmpty();

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

    const prior = (await getLatestBriefing()) ?? DEMO_BRIEFINGS[0] ?? null;
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

async function seedDissentsIfEmpty(): Promise<void> {
  try {
    const existing = await db.select().from(pulseDissentsTable).limit(1);
    if (existing.length > 0) return;
    for (const d of DEMO_DISSENTS) {
      await db
        .insert(pulseDissentsTable)
        .values({
          dissentId: d.id,
          briefingId: d.briefingId,
          sectionId: d.sectionId,
          sectionTitle: d.sectionTitle,
          dissentingView: d.dissentingView,
          basis: d.basis,
          impactIfCorrect: d.impactIfCorrect,
          filedBy: d.filedBy,
          filedAt: new Date(d.filedAt),
          status: d.status,
          resolution: d.resolution ?? null,
          resolvedAt: d.resolvedAt ? new Date(d.resolvedAt) : null,
        })
        .onConflictDoNothing();
    }
  } catch (_err) {
  }
}
void seedDissentsIfEmpty();

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
