import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendBadRequest,
  handleRouteError,
} from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

type Domain = "vessels" | "terra" | "legal" | "security";

interface OnboardingRecord {
  id: string;
  userId: number;
  status: "in_progress" | "completed" | "pending_review";
  currentStep: number;
  totalSteps: number;
  companyProfile: {
    name: string;
    industry: string;
    size: string;
    website: string;
    headquarters: string;
  } | null;
  domainInterests: Domain[];
  kycStatus: "pending" | "uploaded" | "verified" | "rejected";
  kycDocuments: { name: string; type: string; uploadedAt: string; status: string }[];
  portfolioConfig: {
    investmentHorizon: string;
    riskProfile: string;
    targetAllocation: Record<string, number>;
  } | null;
  teamInvitations: { email: string; role: string; status: string; sentAt: string }[];
  billingSetup: {
    tier: string;
    billingCycle: string;
    stripeCustomerId: string | null;
  } | null;
  startedAt: string;
  completedAt: string | null;
  lastUpdatedAt: string;
}

interface ClientHealthScore {
  clientId: string;
  overallScore: number;
  trend: "improving" | "stable" | "declining";
  trendDelta: number;
  dimensions: {
    engagement: number;
    adoption: number;
    satisfaction: number;
    growth: number;
    billing: number;
  };
  riskLevel: "low" | "medium" | "high" | "critical";
  churnProbability: number;
  daysSinceLastLogin: number;
  reportsViewedLast30d: number;
  featuresAdopted: number;
  totalFeatures: number;
  supportTicketsOpen: number;
  npsScore: number | null;
  recommendations: { action: string; impact: string; priority: "high" | "medium" | "low" }[];
  computedAt: string;
}

interface Proposal {
  id: string;
  clientId: string;
  title: string;
  type: "consulting" | "advisory" | "intelligence" | "custom";
  status: "draft" | "sent" | "viewed" | "accepted" | "declined" | "expired";
  executiveSummary: string;
  services: { name: string; description: string; deliverables: string[] }[];
  timeline: { phase: string; duration: string; milestones: string[] }[];
  pricing: {
    total: number;
    currency: string;
    breakdown: { item: string; amount: number }[];
    paymentTerms: string;
  };
  domains: Domain[];
  validUntil: string;
  createdAt: string;
  sentAt: string | null;
  viewedAt: string | null;
  respondedAt: string | null;
}

interface IntelligencePackage {
  id: string;
  name: string;
  slug: string;
  description: string;
  domains: Domain[];
  tier: "starter" | "professional" | "enterprise";
  features: { name: string; description: string; included: boolean }[];
  deliverables: { name: string; frequency: string }[];
  pricing: {
    monthly: number;
    annual: number;
    currency: string;
  };
  agentWorkflows: string[];
  usageLimits: { metric: string; limit: number; unit: string }[];
  subscriberCount: number;
  isActive: boolean;
}

interface Communication {
  id: string;
  clientId: string;
  type: "briefing" | "alert" | "milestone" | "newsletter" | "report";
  subject: string;
  summary: string;
  body: string;
  domain: Domain | "general";
  priority: "urgent" | "high" | "normal" | "low";
  status: "scheduled" | "sent" | "read" | "archived";
  scheduledAt: string;
  sentAt: string | null;
  readAt: string | null;
  metadata: Record<string, unknown>;
}

interface CommunicationPreferences {
  clientId: string;
  briefingFrequency: "daily" | "weekly" | "monthly";
  alertThreshold: "all" | "high" | "critical";
  newsletterOptIn: boolean;
  emailNotifications: boolean;
  inPortalNotifications: boolean;
  domainPreferences: Record<Domain, boolean>;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

const onboardingStore = new Map<number, OnboardingRecord>();
const healthStore = new Map<string, ClientHealthScore>();
const proposalsStore = new Map<string, Proposal>();
const packagesStore = new Map<string, IntelligencePackage>();
const communicationsStore = new Map<string, Communication>();
const preferencesStore = new Map<string, CommunicationPreferences>();

function seedPackages() {
  if (packagesStore.size > 0) return;
  const pkgs: IntelligencePackage[] = [
    {
      id: "pkg-maritime-risk",
      name: "Maritime Risk Premium",
      slug: "maritime-risk-premium",
      description: "Comprehensive maritime risk intelligence with real-time fleet monitoring, anomaly detection, and strategic threat briefings.",
      domains: ["vessels"],
      tier: "professional",
      features: [
        { name: "Real-Time Fleet Tracking", description: "AIS-powered vessel position monitoring with ETA predictions", included: true },
        { name: "Anomaly Detection", description: "AI-driven route deviation and behavioral anomaly alerts", included: true },
        { name: "Weekly Risk Reports", description: "Automated weekly maritime risk assessment reports", included: true },
        { name: "Quarterly Strategic Briefing", description: "Expert-authored strategic maritime intelligence briefing", included: true },
        { name: "Port Congestion Analytics", description: "Real-time port congestion and delay forecasting", included: true },
        { name: "Custom Agent Workflows", description: "Dedicated AI agents for custom maritime intelligence tasks", included: false },
      ],
      deliverables: [
        { name: "Fleet Risk Dashboard", frequency: "Real-time" },
        { name: "Risk Assessment Report", frequency: "Weekly" },
        { name: "Anomaly Alert Digest", frequency: "Daily" },
        { name: "Strategic Briefing", frequency: "Quarterly" },
      ],
      pricing: { monthly: 4500, annual: 48600, currency: "USD" },
      agentWorkflows: ["vessel-monitor", "route-anomaly-detector", "risk-report-generator"],
      usageLimits: [
        { metric: "Monitored Vessels", limit: 25, unit: "vessels" },
        { metric: "API Calls", limit: 50000, unit: "calls/month" },
        { metric: "Custom Reports", limit: 10, unit: "reports/month" },
      ],
      subscriberCount: 14,
      isActive: true,
    },
    {
      id: "pkg-real-estate-alpha",
      name: "Real Estate Alpha",
      slug: "real-estate-alpha",
      description: "AI-powered real estate intelligence for distress signal monitoring, market pulse analysis, and opportunity scoring across key markets.",
      domains: ["terra"],
      tier: "professional",
      features: [
        { name: "Distress Signal Monitoring", description: "Automated detection of foreclosures, tax liens, and covenant breaches", included: true },
        { name: "Market Pulse Analytics", description: "Real-time market trend analysis with predictive scoring", included: true },
        { name: "Opportunity Scoring", description: "AI-ranked investment opportunities based on risk-adjusted returns", included: true },
        { name: "Portfolio Health Dashboard", description: "Interactive portfolio performance and risk visualization", included: true },
        { name: "Comparable Sales Intelligence", description: "Automated comp analysis for target properties", included: true },
        { name: "Predictive Valuation Models", description: "ML-powered property valuation forecasting", included: false },
      ],
      deliverables: [
        { name: "Distress Alert Feed", frequency: "Real-time" },
        { name: "Market Pulse Report", frequency: "Weekly" },
        { name: "Opportunity Scorecard", frequency: "Daily" },
        { name: "Portfolio Review", frequency: "Monthly" },
      ],
      pricing: { monthly: 3800, annual: 41040, currency: "USD" },
      agentWorkflows: ["distress-monitor", "market-pulse-engine", "opportunity-scorer"],
      usageLimits: [
        { metric: "Tracked Properties", limit: 100, unit: "properties" },
        { metric: "Market Reports", limit: 20, unit: "reports/month" },
        { metric: "Opportunity Scores", limit: 500, unit: "scores/month" },
      ],
      subscriberCount: 22,
      isActive: true,
    },
    {
      id: "pkg-legal-shield",
      name: "Legal Shield Pro",
      slug: "legal-shield-pro",
      description: "Proactive legal intelligence with deadline management, compliance monitoring, and automated court filing analysis.",
      domains: ["legal"],
      tier: "professional",
      features: [
        { name: "Deadline Management", description: "Automated court deadline tracking with escalation alerts", included: true },
        { name: "Compliance Monitoring", description: "Continuous regulatory compliance scanning across jurisdictions", included: true },
        { name: "Filing Analysis", description: "AI-powered analysis of court filings and case developments", included: true },
        { name: "Matter Timeline", description: "Visual timeline of all active matters with milestone tracking", included: true },
        { name: "Risk Assessment", description: "Case outcome probability scoring", included: true },
        { name: "Custom Playbooks", description: "Tailored legal response playbooks for your industry", included: false },
      ],
      deliverables: [
        { name: "Deadline Dashboard", frequency: "Real-time" },
        { name: "Compliance Report", frequency: "Weekly" },
        { name: "Case Analysis Brief", frequency: "Per Filing" },
        { name: "Risk Scorecard", frequency: "Monthly" },
      ],
      pricing: { monthly: 5200, annual: 56160, currency: "USD" },
      agentWorkflows: ["deadline-scanner", "compliance-monitor", "filing-analyzer"],
      usageLimits: [
        { metric: "Active Matters", limit: 50, unit: "matters" },
        { metric: "Filing Analyses", limit: 100, unit: "analyses/month" },
        { metric: "Compliance Scans", limit: 500, unit: "scans/month" },
      ],
      subscriberCount: 8,
      isActive: true,
    },
    {
      id: "pkg-security-sentinel",
      name: "Security Sentinel",
      slug: "security-sentinel",
      description: "Enterprise-grade security intelligence combining cyber threat monitoring, vulnerability scanning, and incident response automation.",
      domains: ["security"],
      tier: "enterprise",
      features: [
        { name: "Threat Intelligence Feed", description: "Real-time CTI from NVD, MITRE ATT&CK, and OSINT sources", included: true },
        { name: "Vulnerability Scanning", description: "Continuous vulnerability assessment with CVSS scoring", included: true },
        { name: "Incident Response", description: "Automated incident playbooks with GitHub issue creation", included: true },
        { name: "Posture Dashboard", description: "SOC 2 / ISO 27001 compliance posture visualization", included: true },
        { name: "Executive Briefings", description: "C-level security posture briefings with trend analysis", included: true },
        { name: "Red Team Simulations", description: "AI-assisted attack surface analysis and pen test scoping", included: true },
      ],
      deliverables: [
        { name: "Threat Feed", frequency: "Real-time" },
        { name: "Vulnerability Report", frequency: "Weekly" },
        { name: "Security Posture Brief", frequency: "Monthly" },
        { name: "Executive Summary", frequency: "Quarterly" },
      ],
      pricing: { monthly: 8500, annual: 91800, currency: "USD" },
      agentWorkflows: ["threat-monitor", "vuln-scanner", "incident-responder", "posture-analyzer"],
      usageLimits: [
        { metric: "Monitored Assets", limit: 200, unit: "assets" },
        { metric: "Vulnerability Scans", limit: 1000, unit: "scans/month" },
        { metric: "Incident Playbooks", limit: 50, unit: "playbooks/month" },
      ],
      subscriberCount: 6,
      isActive: true,
    },
    {
      id: "pkg-cross-domain",
      name: "Cross-Domain Fusion",
      slug: "cross-domain-fusion",
      description: "The ultimate intelligence package — unified cross-domain analytics, AI-powered decision support, and full Alloy cognitive engine access.",
      domains: ["vessels", "terra", "legal", "security"],
      tier: "enterprise",
      features: [
        { name: "Unified Intelligence Canvas", description: "Cross-domain event correlation and pattern detection", included: true },
        { name: "AI Decision Support", description: "Cognitive engine recommendations across all domains", included: true },
        { name: "Custom Agent Fleet", description: "Dedicated AI agent deployment for your workflows", included: true },
        { name: "Executive Command Center", description: "Real-time executive dashboard with all verticals", included: true },
        { name: "Priority Support", description: "24/7 dedicated relationship manager and SLA guarantees", included: true },
        { name: "Quarterly Strategy Session", description: "In-person strategic intelligence review with SZL leadership", included: true },
      ],
      deliverables: [
        { name: "Unified Intelligence Feed", frequency: "Real-time" },
        { name: "Cross-Domain Report", frequency: "Weekly" },
        { name: "Executive Briefing", frequency: "Monthly" },
        { name: "Strategy Session", frequency: "Quarterly" },
      ],
      pricing: { monthly: 18500, annual: 199800, currency: "USD" },
      agentWorkflows: ["fusion-engine", "cross-domain-correlator", "executive-briefer", "strategy-agent"],
      usageLimits: [
        { metric: "Monitored Entities", limit: 500, unit: "entities" },
        { metric: "AI Agent Hours", limit: 200, unit: "hours/month" },
        { metric: "Custom Reports", limit: 50, unit: "reports/month" },
      ],
      subscriberCount: 3,
      isActive: true,
    },
  ];
  for (const pkg of pkgs) packagesStore.set(pkg.id, pkg);
}

function seedClientHealth(clientId: string): ClientHealthScore {
  const score: ClientHealthScore = {
    clientId,
    overallScore: 82,
    trend: "improving",
    trendDelta: 4.2,
    dimensions: {
      engagement: 78,
      adoption: 85,
      satisfaction: 88,
      growth: 72,
      billing: 95,
    },
    riskLevel: "low",
    churnProbability: 8.3,
    daysSinceLastLogin: 1,
    reportsViewedLast30d: 18,
    featuresAdopted: 14,
    totalFeatures: 19,
    supportTicketsOpen: 0,
    npsScore: 9,
    recommendations: [
      { action: "Introduce Maritime Risk Premium package — client views fleet reports 3x/week", impact: "Potential $4,500/mo upsell", priority: "high" },
      { action: "Schedule quarterly strategy review — last session was 4 months ago", impact: "Retention reinforcement", priority: "medium" },
      { action: "Enable predictive property scoring — client has 5 active Terra assets", impact: "Feature adoption +6%", priority: "medium" },
      { action: "Send personalized market pulse briefing for Gulf region", impact: "Engagement boost", priority: "low" },
    ],
    computedAt: new Date().toISOString(),
  };
  healthStore.set(clientId, score);
  return score;
}

function seedProposals(clientId: string) {
  if ([...proposalsStore.values()].some(p => p.clientId === clientId)) return;
  const proposals: Proposal[] = [
    {
      id: `prop-${clientId}-1`,
      clientId,
      title: "Strategic Maritime Intelligence Advisory",
      type: "advisory",
      status: "sent",
      executiveSummary: "A comprehensive advisory engagement to optimize your maritime portfolio through AI-powered intelligence, risk modeling, and strategic fleet positioning. Leveraging SZL's Alloy cognitive engine for cross-domain insights.",
      services: [
        { name: "Fleet Risk Assessment", description: "Deep analysis of current fleet exposure across geopolitical, weather, and market risk factors", deliverables: ["Risk Matrix Report", "Mitigation Strategy", "Insurance Optimization Plan"] },
        { name: "Route Optimization Study", description: "AI-driven analysis of current routes with recommendations for cost and time savings", deliverables: ["Route Analysis Report", "Savings Projection", "Implementation Roadmap"] },
        { name: "Market Intelligence Brief", description: "Quarterly strategic analysis of maritime market trends, charter rates, and competitive positioning", deliverables: ["Market Brief", "Competitive Landscape", "Opportunity Register"] },
      ],
      timeline: [
        { phase: "Discovery & Assessment", duration: "2 weeks", milestones: ["Kickoff call", "Data collection complete", "Initial assessment delivered"] },
        { phase: "Analysis & Modeling", duration: "4 weeks", milestones: ["Risk model built", "Route optimization complete", "Market brief drafted"] },
        { phase: "Strategy & Recommendations", duration: "2 weeks", milestones: ["Final report delivered", "Strategy session conducted", "Implementation plan approved"] },
      ],
      pricing: {
        total: 125000,
        currency: "USD",
        breakdown: [
          { item: "Fleet Risk Assessment", amount: 45000 },
          { item: "Route Optimization Study", amount: 55000 },
          { item: "Market Intelligence Brief", amount: 25000 },
        ],
        paymentTerms: "50% upon engagement, 25% at Phase 2, 25% upon delivery",
      },
      domains: ["vessels"],
      validUntil: "2026-05-15",
      createdAt: "2026-04-01T09:00:00Z",
      sentAt: "2026-04-02T10:30:00Z",
      viewedAt: "2026-04-03T14:15:00Z",
      respondedAt: null,
    },
    {
      id: `prop-${clientId}-2`,
      clientId,
      title: "Real Estate Portfolio Intelligence Enhancement",
      type: "intelligence",
      status: "draft",
      executiveSummary: "An intelligence upgrade package to enhance your real estate portfolio monitoring with predictive analytics, distress signal detection, and automated opportunity scoring.",
      services: [
        { name: "Predictive Analytics Integration", description: "Deploy ML models for property valuation forecasting and market trend prediction", deliverables: ["Model Deployment", "Dashboard Integration", "Training Session"] },
        { name: "Distress Signal Engine", description: "Configure automated monitoring for foreclosure, tax lien, and covenant breach signals", deliverables: ["Alert Configuration", "Signal Feed Setup", "Escalation Workflow"] },
      ],
      timeline: [
        { phase: "Configuration", duration: "1 week", milestones: ["System audit", "Configuration complete"] },
        { phase: "Deployment", duration: "2 weeks", milestones: ["Models deployed", "Alerts active", "Dashboard live"] },
      ],
      pricing: {
        total: 68000,
        currency: "USD",
        breakdown: [
          { item: "Predictive Analytics Integration", amount: 42000 },
          { item: "Distress Signal Engine", amount: 26000 },
        ],
        paymentTerms: "Net 30",
      },
      domains: ["terra"],
      validUntil: "2026-06-01",
      createdAt: "2026-04-10T11:00:00Z",
      sentAt: null,
      viewedAt: null,
      respondedAt: null,
    },
  ];
  for (const p of proposals) proposalsStore.set(p.id, p);
}

function seedCommunications(clientId: string) {
  if ([...communicationsStore.values()].some(c => c.clientId === clientId)) return;
  const comms: Communication[] = [
    {
      id: `comm-${clientId}-1`,
      clientId,
      type: "briefing",
      subject: "Weekly Maritime Intelligence Briefing — Apr 7-13, 2026",
      summary: "Fleet performance strong. Pacific Sentinel on-schedule. Gulf Explorer cargo temp variance resolved. No new sanctions risks detected.",
      body: "Your fleet of 3 active vessels performed within normal parameters this week. MV Pacific Sentinel is tracking on-schedule for Rotterdam arrival (ETA Apr 18). The Gulf Explorer cargo temperature variance detected on Apr 11 self-corrected within 4 hours — root cause: brief engine room ventilation cycle during tropical weather transit. No sanctions or compliance flags were triggered across your portfolio this period.",
      domain: "vessels",
      priority: "normal",
      status: "sent",
      scheduledAt: "2026-04-13T06:00:00Z",
      sentAt: "2026-04-13T06:02:14Z",
      readAt: null,
      metadata: { weekOf: "2026-04-07", vesselCount: 3 },
    },
    {
      id: `comm-${clientId}-2`,
      clientId,
      type: "alert",
      subject: "Alert: Gulf Explorer Cargo Temperature Variance",
      summary: "Cargo temperature variance detected on MV Gulf Explorer. Monitoring situation. No action required at this time.",
      body: "Our monitoring systems detected a cargo temperature variance on MV Gulf Explorer (IMO 9876543) at 09:05 UTC on April 12, 2026. Current position: Gulf of Mexico — 25.1°N, 90.2°W. The variance was 2.3°C above the threshold for 47 minutes before self-correcting. The technical team has confirmed this was caused by a routine engine room ventilation cycle during tropical weather transit. No cargo damage is expected. We will continue monitoring and provide an update in tomorrow's daily digest.",
      domain: "vessels",
      priority: "high",
      status: "read",
      scheduledAt: "2026-04-12T09:10:00Z",
      sentAt: "2026-04-12T09:10:22Z",
      readAt: "2026-04-12T09:45:00Z",
      metadata: { vesselName: "MV Gulf Explorer", alertType: "cargo_temp" },
    },
    {
      id: `comm-${clientId}-3`,
      clientId,
      type: "milestone",
      subject: "Milestone: Harbor Logistics Hub Lease Renewal — Negotiation Entered",
      summary: "Lease renewal negotiations have formally commenced for Harbor Logistics Hub in Long Beach, CA.",
      body: "We are pleased to confirm that lease renewal negotiations for Harbor Logistics Hub (Long Beach, CA) have formally commenced as of April 8, 2026. Your legal counsel, James Okafor, is leading negotiations for a 10-year renewal term. Current terms expire on May 15, 2026. Next deadline: Counter-offer review by April 22. We will provide weekly updates on negotiation progress through this communication channel.",
      domain: "terra",
      priority: "normal",
      status: "sent",
      scheduledAt: "2026-04-08T14:00:00Z",
      sentAt: "2026-04-08T14:01:33Z",
      readAt: null,
      metadata: { propertyName: "Harbor Logistics Hub", matterType: "lease_renewal" },
    },
    {
      id: `comm-${clientId}-4`,
      clientId,
      type: "newsletter",
      subject: "SZL Holdings Monthly Intelligence Digest — March 2026",
      summary: "March recap: Portfolio up 3.2% QoQ, 2 new distress opportunities identified, maritime market outlook positive.",
      body: "March 2026 was a strong month across your portfolio. Maritime holdings gained 6.4% QoQ driven by favorable charter rates in the Pacific basin. Real estate portfolio NAV increased 3.2% with strong occupancy across industrial assets. Your legal team resolved the Gulf Explorer Crew Compliance matter, achieving full STCW certification for all crew members. Looking ahead: We've identified 2 distress property opportunities in the Houston market that match your investment criteria. Your relationship manager will reach out to discuss further.",
      domain: "general",
      priority: "low",
      status: "read",
      scheduledAt: "2026-04-01T08:00:00Z",
      sentAt: "2026-04-01T08:00:45Z",
      readAt: "2026-04-02T11:22:00Z",
      metadata: { month: "March 2026", portfolioReturn: "+3.2%" },
    },
    {
      id: `comm-${clientId}-5`,
      clientId,
      type: "report",
      subject: "Q1 2026 Security Posture Assessment",
      summary: "Overall security posture: Strong. SOC 2 compliance maintained. Zero breaches. 3 advisories addressed.",
      body: "Your Q1 2026 security posture assessment is complete. Key findings: (1) SOC 2 Type II compliance maintained with zero audit findings. (2) No security breaches or incidents detected across your infrastructure. (3) Three CVE advisories were proactively addressed — CVE-2026-1842 (critical, patched within 4 hours), CVE-2026-2104 (high, mitigated), CVE-2026-2291 (medium, scheduled patch). (4) Employee security awareness training completion rate: 96%. Recommendation: Schedule annual penetration test for Q2 to maintain compliance posture.",
      domain: "security",
      priority: "normal",
      status: "sent",
      scheduledAt: "2026-04-05T09:00:00Z",
      sentAt: "2026-04-05T09:01:12Z",
      readAt: null,
      metadata: { quarter: "Q1 2026", complianceStatus: "maintained" },
    },
  ];
  for (const c of comms) communicationsStore.set(c.id, c);
}

function getClientId(userId: number): string {
  return `c-${userId}`;
}

seedPackages();

router.get("/forge-portal/onboarding/status", authMiddleware(), (req: Request, res: Response) => {
  try {
    if (!req.user) { sendBadRequest(res, "Auth required"); return; }
    const record = onboardingStore.get(req.user.id);
    if (!record) {
      sendSuccess(res, { status: "not_started", currentStep: 0, totalSteps: 6 });
      return;
    }
    sendSuccess(res, record);
  } catch (err) {
    handleRouteError(res, err, "forge-revenue onboarding status");
  }
});

router.post("/forge-portal/onboarding/submit", authMiddleware(), (req: Request, res: Response) => {
  try {
    if (!req.user) { sendBadRequest(res, "Auth required"); return; }
    const { step, data } = req.body as { step: number; data: Record<string, unknown> };
    if (typeof step !== "number" || step < 1 || step > 6) { sendBadRequest(res, "step must be 1-6"); return; }

    let record = onboardingStore.get(req.user.id);
    const now = new Date().toISOString();

    if (!record) {
      record = {
        id: `onboard-${req.user.id}`,
        userId: req.user.id,
        status: "in_progress",
        currentStep: 1,
        totalSteps: 6,
        companyProfile: null,
        domainInterests: [],
        kycStatus: "pending",
        kycDocuments: [],
        portfolioConfig: null,
        teamInvitations: [],
        billingSetup: null,
        startedAt: now,
        completedAt: null,
        lastUpdatedAt: now,
      };
    }

    if (record.status === "completed") { sendBadRequest(res, "Onboarding already completed"); return; }
    if (step !== record.currentStep) { sendBadRequest(res, `Expected step ${record.currentStep}, got ${step}`); return; }

    switch (step) {
      case 1:
        record.companyProfile = data as OnboardingRecord["companyProfile"];
        record.currentStep = 2;
        break;
      case 2:
        record.domainInterests = (data.domains as Domain[]) ?? [];
        record.currentStep = 3;
        break;
      case 3:
        record.kycStatus = "uploaded";
        record.kycDocuments = (data.documents as OnboardingRecord["kycDocuments"]) ?? [];
        record.currentStep = 4;
        break;
      case 4:
        record.portfolioConfig = data as OnboardingRecord["portfolioConfig"];
        record.currentStep = 5;
        break;
      case 5:
        record.teamInvitations = (data.invitations as OnboardingRecord["teamInvitations"]) ?? [];
        record.currentStep = 6;
        break;
      case 6:
        record.billingSetup = data as OnboardingRecord["billingSetup"];
        record.status = "completed";
        record.completedAt = now;
        record.kycStatus = "verified";
        break;
    }

    record.lastUpdatedAt = now;
    onboardingStore.set(req.user.id, record);
    logger.info({ userId: req.user.id, step, status: record.status }, "forge-revenue: onboarding step submitted");
    sendSuccess(res, record);
  } catch (err) {
    handleRouteError(res, err, "forge-revenue onboarding submit");
  }
});

router.get("/forge-portal/health-score", authMiddleware(), (req: Request, res: Response) => {
  try {
    if (!req.user) { sendBadRequest(res, "Auth required"); return; }
    const clientId = getClientId(req.user.id);
    let score = healthStore.get(clientId);
    if (!score) score = seedClientHealth(clientId);
    sendSuccess(res, score);
  } catch (err) {
    handleRouteError(res, err, "forge-revenue health score");
  }
});

router.get("/forge-portal/proposals", authMiddleware(), (req: Request, res: Response) => {
  try {
    if (!req.user) { sendBadRequest(res, "Auth required"); return; }
    const clientId = getClientId(req.user.id);
    seedProposals(clientId);
    const proposals = [...proposalsStore.values()].filter(p => p.clientId === clientId);
    const { status } = req.query as Record<string, string>;
    const filtered = status ? proposals.filter(p => p.status === status) : proposals;
    sendSuccess(res, { proposals: filtered, count: filtered.length });
  } catch (err) {
    handleRouteError(res, err, "forge-revenue proposals list");
  }
});

router.get("/forge-portal/proposals/:proposalId", authMiddleware(), (req: Request, res: Response) => {
  try {
    if (!req.user) { sendBadRequest(res, "Auth required"); return; }
    const clientId = getClientId(req.user.id);
    seedProposals(clientId);
    const proposal = proposalsStore.get(String(req.params.proposalId));
    if (!proposal || proposal.clientId !== clientId) { sendNotFound(res, "Proposal"); return; }
    if (proposal.status === "sent") {
      proposal.status = "viewed";
      proposal.viewedAt = new Date().toISOString();
      proposalsStore.set(proposal.id, proposal);
    }
    sendSuccess(res, proposal);
  } catch (err) {
    handleRouteError(res, err, "forge-revenue proposal detail");
  }
});

router.post("/forge-portal/proposals/generate", authMiddleware(), (req: Request, res: Response) => {
  try {
    if (!req.user) { sendBadRequest(res, "Auth required"); return; }
    const clientId = getClientId(req.user.id);
    const { title, type, domains, description } = req.body as {
      title?: string; type?: string; domains?: string[]; description?: string;
    };
    if (!title) { sendBadRequest(res, "title is required"); return; }

    const now = new Date().toISOString();
    const proposal: Proposal = {
      id: `prop-${clientId}-${Date.now()}`,
      clientId,
      title,
      type: (type as Proposal["type"]) ?? "consulting",
      status: "draft",
      executiveSummary: description ?? `AI-generated proposal for ${title}. This engagement leverages SZL's cross-domain intelligence capabilities to deliver actionable insights and measurable outcomes.`,
      services: [
        { name: "Discovery & Assessment", description: "Comprehensive analysis of current state and requirements", deliverables: ["Assessment Report", "Gap Analysis", "Recommendations"] },
        { name: "Solution Design & Implementation", description: "Custom solution architecture and deployment", deliverables: ["Solution Blueprint", "Implementation Plan", "Go-Live Support"] },
      ],
      timeline: [
        { phase: "Discovery", duration: "2 weeks", milestones: ["Kickoff", "Assessment Complete"] },
        { phase: "Implementation", duration: "4 weeks", milestones: ["Solution Deployed", "UAT Complete", "Go-Live"] },
      ],
      pricing: {
        total: 75000,
        currency: "USD",
        breakdown: [
          { item: "Discovery & Assessment", amount: 25000 },
          { item: "Solution Design & Implementation", amount: 50000 },
        ],
        paymentTerms: "Net 30",
      },
      domains: (domains as Domain[]) ?? [],
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      createdAt: now,
      sentAt: null,
      viewedAt: null,
      respondedAt: null,
    };
    proposalsStore.set(proposal.id, proposal);
    logger.info({ proposalId: proposal.id, clientId }, "forge-revenue: proposal generated");
    sendCreated(res, proposal);
  } catch (err) {
    handleRouteError(res, err, "forge-revenue proposal generate");
  }
});

router.patch("/forge-portal/proposals/:proposalId/accept", authMiddleware(), (req: Request, res: Response) => {
  try {
    if (!req.user) { sendBadRequest(res, "Auth required"); return; }
    const clientId = getClientId(req.user.id);
    const proposal = proposalsStore.get(String(req.params.proposalId));
    if (!proposal || proposal.clientId !== clientId) { sendNotFound(res, "Proposal"); return; }
    if (proposal.status === "accepted") { sendBadRequest(res, "Proposal already accepted"); return; }
    if (proposal.status === "expired") { sendBadRequest(res, "Proposal has expired"); return; }
    proposal.status = "accepted";
    proposal.respondedAt = new Date().toISOString();
    proposalsStore.set(proposal.id, proposal);
    const engagementId = `eng-${Date.now()}`;
    const engagement = {
      id: engagementId,
      proposalId: proposal.id,
      clientId,
      title: proposal.title,
      type: proposal.type ?? "consulting",
      status: "active",
      domains: proposal.domains ?? [],
      startDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    logger.info({ proposalId: proposal.id, clientId, engagementId }, "forge-revenue: proposal accepted, engagement auto-created");
    sendSuccess(res, { ...proposal, engagement });
  } catch (err) {
    handleRouteError(res, err, "forge-revenue proposal accept");
  }
});

router.get("/forge-portal/packages", authMiddleware(), (_req: Request, res: Response) => {
  try {
    seedPackages();
    const packages = [...packagesStore.values()].filter(p => p.isActive);
    sendSuccess(res, { packages, count: packages.length });
  } catch (err) {
    handleRouteError(res, err, "forge-revenue packages list");
  }
});

router.get("/forge-portal/packages/:packageId", authMiddleware(), (req: Request, res: Response) => {
  try {
    seedPackages();
    const pkg = packagesStore.get(String(req.params.packageId));
    if (!pkg) { sendNotFound(res, "Package"); return; }
    sendSuccess(res, pkg);
  } catch (err) {
    handleRouteError(res, err, "forge-revenue package detail");
  }
});

router.post("/forge-portal/packages/:packageId/subscribe", authMiddleware(), (req: Request, res: Response) => {
  try {
    if (!req.user) { sendBadRequest(res, "Auth required"); return; }
    const pkg = packagesStore.get(String(req.params.packageId));
    if (!pkg) { sendNotFound(res, "Package"); return; }
    const { billingCycle } = req.body as { billingCycle?: "monthly" | "annual" };
    const price = billingCycle === "annual" ? pkg.pricing.annual : pkg.pricing.monthly;
    pkg.subscriberCount += 1;
    packagesStore.set(pkg.id, pkg);
    logger.info({ packageId: pkg.id, userId: req.user.id, billingCycle }, "forge-revenue: package subscribed");
    sendCreated(res, {
      subscriptionId: `sub-${pkg.id}-${Date.now()}`,
      packageId: pkg.id,
      packageName: pkg.name,
      billingCycle: billingCycle ?? "monthly",
      price,
      currency: pkg.pricing.currency,
      status: "active",
      activatedAt: new Date().toISOString(),
      agentWorkflows: pkg.agentWorkflows,
    });
  } catch (err) {
    handleRouteError(res, err, "forge-revenue package subscribe");
  }
});

router.get("/forge-portal/communications", authMiddleware(), (req: Request, res: Response) => {
  try {
    if (!req.user) { sendBadRequest(res, "Auth required"); return; }
    const clientId = getClientId(req.user.id);
    seedCommunications(clientId);
    let comms = [...communicationsStore.values()].filter(c => c.clientId === clientId);
    const { type, domain, status } = req.query as Record<string, string>;
    if (type) comms = comms.filter(c => c.type === type);
    if (domain) comms = comms.filter(c => c.domain === domain);
    if (status) comms = comms.filter(c => c.status === status);
    comms.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
    const unread = comms.filter(c => c.status === "sent").length;
    sendSuccess(res, { communications: comms, unread, count: comms.length });
  } catch (err) {
    handleRouteError(res, err, "forge-revenue communications list");
  }
});

router.get("/forge-portal/communications/preferences", authMiddleware(), (req: Request, res: Response) => {
  try {
    if (!req.user) { sendBadRequest(res, "Auth required"); return; }
    const clientId = getClientId(req.user.id);
    let prefs = preferencesStore.get(clientId);
    if (!prefs) {
      prefs = {
        clientId,
        briefingFrequency: "weekly",
        alertThreshold: "high",
        newsletterOptIn: true,
        emailNotifications: true,
        inPortalNotifications: true,
        domainPreferences: { vessels: true, terra: true, legal: true, security: true },
        quietHoursStart: null,
        quietHoursEnd: null,
      };
      preferencesStore.set(clientId, prefs);
    }
    sendSuccess(res, prefs);
  } catch (err) {
    handleRouteError(res, err, "forge-revenue communication preferences");
  }
});

router.patch("/forge-portal/communications/preferences", authMiddleware(), (req: Request, res: Response) => {
  try {
    if (!req.user) { sendBadRequest(res, "Auth required"); return; }
    const clientId = getClientId(req.user.id);
    let prefs = preferencesStore.get(clientId);
    if (!prefs) {
      prefs = {
        clientId,
        briefingFrequency: "weekly",
        alertThreshold: "high",
        newsletterOptIn: true,
        emailNotifications: true,
        inPortalNotifications: true,
        domainPreferences: { vessels: true, terra: true, legal: true, security: true },
        quietHoursStart: null,
        quietHoursEnd: null,
      };
    }
    const updates = req.body as Partial<CommunicationPreferences>;
    Object.assign(prefs, updates, { clientId });
    preferencesStore.set(clientId, prefs);
    logger.info({ clientId, userId: req.user.id }, "forge-revenue: communication preferences updated");
    sendSuccess(res, prefs);
  } catch (err) {
    handleRouteError(res, err, "forge-revenue update preferences");
  }
});

router.get("/forge-portal/communications/:commId", authMiddleware(), (req: Request, res: Response) => {
  try {
    if (!req.user) { sendBadRequest(res, "Auth required"); return; }
    const clientId = getClientId(req.user.id);
    const comm = communicationsStore.get(String(req.params.commId));
    if (!comm || comm.clientId !== clientId) { sendNotFound(res, "Communication"); return; }
    if (comm.status === "sent") {
      comm.status = "read";
      comm.readAt = new Date().toISOString();
      communicationsStore.set(comm.id, comm);
    }
    sendSuccess(res, comm);
  } catch (err) {
    handleRouteError(res, err, "forge-revenue communication detail");
  }
});

router.get("/forge-portal/revenue/summary", authMiddleware(), (req: Request, res: Response) => {
  try {
    if (!req.user) { sendBadRequest(res, "Auth required"); return; }
    const userRoles: string[] = (req.user as unknown as { roles?: string[] }).roles ?? [];
    const isInternal = userRoles.some(r => ["admin", "super_admin", "ops", "executive"].includes(r));
    if (!isInternal) { res.status(403).json({ ok: false, error: "Insufficient permissions — internal access only" }); return; }
    const summary = {
      mrr: 287500,
      arr: 3450000,
      mrrGrowth: 8.4,
      totalClients: 42,
      activeClients: 38,
      churnRate: 2.1,
      avgLtv: 248000,
      avgContractValue: 82000,
      pipeline: {
        prospects: 15,
        onboarding: 4,
        active: 38,
        expanded: 12,
        churned: 2,
      },
      revenueByDomain: [
        { domain: "Maritime", revenue: 112500, percentage: 39.1, clients: 14 },
        { domain: "Real Estate", revenue: 83600, percentage: 29.1, clients: 12 },
        { domain: "Legal", revenue: 46800, percentage: 16.3, clients: 8 },
        { domain: "Security", revenue: 44600, percentage: 15.5, clients: 6 },
      ],
      revenueByPackage: [
        { package: "Cross-Domain Fusion", revenue: 55500, subscribers: 3 },
        { package: "Maritime Risk Premium", revenue: 63000, subscribers: 14 },
        { package: "Real Estate Alpha", revenue: 83600, subscribers: 22 },
        { package: "Legal Shield Pro", revenue: 41600, subscribers: 8 },
        { package: "Security Sentinel", revenue: 51000, subscribers: 6 },
      ],
      monthlyTrend: [
        { month: "Nov 2025", mrr: 218000, clients: 32 },
        { month: "Dec 2025", mrr: 232000, clients: 34 },
        { month: "Jan 2026", mrr: 248000, clients: 35 },
        { month: "Feb 2026", mrr: 261000, clients: 37 },
        { month: "Mar 2026", mrr: 274000, clients: 39 },
        { month: "Apr 2026", mrr: 287500, clients: 42 },
      ],
      churnRisk: {
        low: 28,
        medium: 7,
        high: 2,
        critical: 1,
      },
      upsellOpportunities: [
        { clientName: "Hale Capital Partners", currentPackage: "Maritime Risk Premium", recommended: "Cross-Domain Fusion", incrementalMrr: 14000, probability: 72 },
        { clientName: "Oceanic Holdings", currentPackage: "Real Estate Alpha", recommended: "Real Estate Alpha + Legal Shield", incrementalMrr: 5200, probability: 65 },
        { clientName: "Vanguard Maritime", currentPackage: "Maritime Risk Premium", recommended: "Maritime Risk Premium + Security Sentinel", incrementalMrr: 8500, probability: 58 },
      ],
      aiAttributedRevenue: {
        total: 84200,
        percentage: 29.3,
        topInsights: [
          { insight: "Distress property alert led to $12M acquisition", attributedRevenue: 26000 },
          { insight: "Route optimization saved $2.1M in fuel costs", attributedRevenue: 31500 },
          { insight: "Proactive compliance alert prevented $800K fine", attributedRevenue: 26700 },
        ],
      },
      computedAt: new Date().toISOString(),
    };
    sendSuccess(res, summary);
  } catch (err) {
    handleRouteError(res, err, "forge-revenue summary");
  }
});

router.get("/forge-portal/upgrades", authMiddleware(), (req: Request, res: Response) => {
  try {
    if (!req.user) { sendBadRequest(res, "Auth required"); return; }
    const upgrades = {
      currentTier: "platinum",
      currentDomains: ["vessels", "terra", "legal", "security"],
      currentPackages: [
        { id: "pkg-maritime-risk", name: "Maritime Risk Premium", status: "active", since: "2025-06-15" },
      ],
      availableUpgrades: [
        {
          id: "upgrade-cross-domain",
          type: "package",
          name: "Cross-Domain Fusion",
          description: "Unlock unified cross-domain analytics and full Alloy cognitive engine access",
          currentCost: 4500,
          upgradeCost: 18500,
          incrementalCost: 14000,
          currency: "USD",
          benefits: ["Unified Intelligence Canvas", "AI Decision Support", "Custom Agent Fleet", "Priority Support"],
        },
        {
          id: "upgrade-real-estate-alpha",
          type: "package",
          name: "Real Estate Alpha",
          description: "Add AI-powered real estate intelligence to your portfolio",
          currentCost: 0,
          upgradeCost: 3800,
          incrementalCost: 3800,
          currency: "USD",
          benefits: ["Distress Signal Monitoring", "Opportunity Scoring", "Market Pulse Analytics"],
        },
        {
          id: "upgrade-legal-shield",
          type: "package",
          name: "Legal Shield Pro",
          description: "Proactive legal intelligence and compliance monitoring",
          currentCost: 0,
          upgradeCost: 5200,
          incrementalCost: 5200,
          currency: "USD",
          benefits: ["Deadline Management", "Compliance Monitoring", "Filing Analysis"],
        },
        {
          id: "upgrade-security-sentinel",
          type: "package",
          name: "Security Sentinel",
          description: "Enterprise-grade security intelligence and incident response",
          currentCost: 0,
          upgradeCost: 8500,
          incrementalCost: 8500,
          currency: "USD",
          benefits: ["Threat Intelligence Feed", "Vulnerability Scanning", "Incident Response Automation"],
        },
      ],
      seatManagement: {
        currentSeats: 3,
        maxSeats: 10,
        pricePerSeat: 250,
        currency: "USD",
      },
      customAgentDeployment: {
        available: true,
        basePrice: 2500,
        currency: "USD",
        description: "Deploy custom AI agents tailored to your specific workflows",
        examples: ["Custom risk model agent", "Proprietary data integration agent", "Automated reporting agent"],
      },
    };
    sendSuccess(res, upgrades);
  } catch (err) {
    handleRouteError(res, err, "forge-revenue upgrades list");
  }
});

router.post("/forge-portal/upgrades/request", authMiddleware(), (req: Request, res: Response) => {
  try {
    if (!req.user) { sendBadRequest(res, "Auth required"); return; }
    const { upgradeId, type, details } = req.body as {
      upgradeId?: string; type?: string; details?: Record<string, unknown>;
    };
    if (!upgradeId || !type) { sendBadRequest(res, "upgradeId and type are required"); return; }
    logger.info({ userId: req.user.id, upgradeId, type }, "forge-revenue: upgrade provisioned");
    sendCreated(res, {
      requestId: `req-${Date.now()}`,
      upgradeId,
      type,
      status: "provisioned",
      provisionedAt: new Date().toISOString(),
      message: "Upgrade has been automatically provisioned and is now active.",
      details,
      requestedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "forge-revenue upgrade request");
  }
});

export default router;
