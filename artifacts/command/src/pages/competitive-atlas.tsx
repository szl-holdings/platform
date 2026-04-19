import { useEffect, useMemo, useState } from "react";
import { ExternalLink, TrendingUp, Zap, CheckCircle2, Circle, ChevronDown, ChevronRight, Target, Shield, Scale, Building2, Ship, Brain, BarChart3, Cpu, Star, XCircle, Clock, PauseCircle, Download, StickyNote, Radio, X, RefreshCw, ArrowUpRight, Plus, Trash2, Play, Pause, Settings, AlertCircle } from "lucide-react";

type AdoptionStatus = "adopted" | "in-progress" | "evaluating" | "rejected" | "deferred";

type Recommendation = "adopt" | "counter" | "monitor";

interface IntelAlert {
  id: string;
  laneId: string;
  champion: string;
  title: string;
  summary: string;
  link: string;
  publishedAt: string;
  detectedAt: string;
  recommendation: Recommendation;
  recommendationReason: string;
  dismissed: boolean;
  source: "rss" | "seed";
}

interface IntelStatus {
  lastFullPollAt: string | null;
  pollRunCount: number;
  totalAlerts: number;
  activeAlerts: number;
  feeds: Array<{ feedId: string; champion: string; laneId: string; lastSuccessAt: string | null; lastError: string | null }>;
}

interface Champion {
  name: string;
  url: string;
  tagline: string;
  bestAt: string[];
}

interface Adoption {
  idea: string;
  source: string;
  ourVersion: string;
  status: AdoptionStatus;
  location: string;
}

interface Lane {
  id: string;
  name: string;
  artifact: string;
  artifactPath: string;
  accentColor: string;
  icon: React.ElementType;
  champions: Champion[];
  stealThis: Adoption[];
  oneOfOneThesis: string;
  oneOfOneEvidence: string[];
}

const LANES: Lane[] = [
  {
    id: "cyber",
    name: "Cyber Resilience",
    artifact: "Sentra",
    artifactPath: "/sentra/",
    accentColor: "#ef4444",
    icon: Shield,
    champions: [
      {
        name: "CrowdStrike Falcon",
        url: "https://crowdstrike.com",
        tagline: "AI-native endpoint and cloud security",
        bestAt: [
          "Persona-aware dynamic console (Project Kestrel) — workspaces adapt to analyst role",
          "Charlotte AI natural language threat queries — no CLI, no query syntax",
          "Single lightweight agent spanning endpoint, cloud, identity in one pane",
          "Real-time ARR/revenue transparency signals trust with enterprise buyers",
        ],
      },
      {
        name: "Darktrace",
        url: "https://darktrace.com",
        tagline: "Self-learning AI immune system",
        bestAt: [
          "'Pattern of Life' behavioral baseline per device — deviations trigger autonomous response",
          "Zero-day and insider threat detection without signature libraries",
          "Antigena autonomous neutralization with clear human-override controls",
          "Open architecture: embeds into existing SIEM/SOAR without ripping out tools",
        ],
      },
      {
        name: "Palo Alto Cortex XDR",
        url: "https://paloaltonetworks.com",
        tagline: "Unified XDR across endpoint, network, cloud",
        bestAt: [
          "Root-cause analysis that reconstructs the full attack chain visually",
          "Behavioral AI that reduces mean-time-to-detect by eliminating manual correlation",
          "SASE-native browser security extending zero-trust into the endpoint",
          "Strategic M&A to consolidate identity + AI pipeline security",
        ],
      },
    ],
    stealThis: [
      {
        idea: "Pattern of Life Behavioral Baseline",
        source: "Darktrace Enterprise Immune System",
        ourVersion: "Behavioral Baseline panel on the Sentra dashboard showing current vs. normal activity profiles for assets and users, with deviation score and autonomous response status",
        status: "adopted",
        location: "sentra/src/pages/dashboard.tsx",
      },
      {
        idea: "Natural Language Threat Query",
        source: "CrowdStrike Charlotte AI",
        ourVersion: "NL threat query bar on the Sentra dashboard — operators type plain English (e.g. 'show assets with unusual outbound connections in the last 6h') to surface filtered risk views",
        status: "adopted",
        location: "sentra/src/pages/dashboard.tsx",
      },
      {
        idea: "Attack Chain Reconstruction",
        source: "Palo Alto Cortex XDR",
        ourVersion: "Incident Commander page shows full MITRE ATT&CK chain with root cause reconstructed step-by-step with proof sources per node",
        status: "adopted",
        location: "sentra/src/pages/incident-commander.tsx",
      },
    ],
    oneOfOneThesis: "Sentra is the only cyber platform that wraps every detection and response decision in a Governed Autonomy proof envelope — showing not just what was detected, but which agent acted, with what confidence, approved by whom, and the full reversibility chain. Competitors show you threats. Sentra shows you the decision.",
    oneOfOneEvidence: [
      "Every incident has a reversible action log with named approver and policy tier",
      "Recovery Readiness score is calculated from agent-verified control states, not surveys",
      "Control Drift page shows which policy intents have drifted from enforced state with confidence-weighted evidence",
    ],
  },
  {
    id: "legal",
    name: "Legal Matter Command",
    artifact: "PRISM Counsel",
    artifactPath: "/prism-counsel/",
    accentColor: "#a78bfa",
    icon: Scale,
    champions: [
      {
        name: "Clio",
        url: "https://clio.com",
        tagline: "Cloud legal practice management for all firm sizes",
        bestAt: [
          "Matter Stages — visual kanban pipeline showing case lifecycle across the firm",
          "Matter Hub — single view linking every document, event, note, and invoice per matter",
          "Client Portal — secure client-facing window with real-time case access",
          "300+ integrations with clean API for custom workflow extensibility",
        ],
      },
      {
        name: "Thomson Reuters HighQ",
        url: "https://thomsonreuters.com",
        tagline: "Enterprise legal collaboration and matter management",
        bestAt: [
          "AI-assisted contract review with clause-level confidence scoring per obligation",
          "Matter-level privilege controls with attorney-client protected tagging",
          "Obligation timeline visualization — deadlines mapped against regulatory calendar",
          "Data room functionality with granular access tiers per stakeholder group",
        ],
      },
      {
        name: "Relativity",
        url: "https://relativity.com",
        tagline: "Legal data platform for eDiscovery and matter analytics",
        bestAt: [
          "AI-driven document review with training-based confidence thresholds",
          "Evidence graph linking documents to parties, dates, and claims",
          "Audit trail for every review decision with reviewer identity and timestamp",
          "Privilege log automation with export-ready formatting",
        ],
      },
    ],
    stealThis: [
      {
        idea: "Matter Stage Pipeline Rail",
        source: "Clio Matter Stages",
        ourVersion: "Visual stage progress rail at the top of the PRISM Counsel Matter Board showing matter count and value at each lifecycle stage (Intake → Discovery → Negotiation → Resolution) with drill-down filtering",
        status: "adopted",
        location: "prism-counsel/src/pages/matter-board.tsx",
      },
      {
        idea: "Clause-Level Confidence on Obligations",
        source: "Thomson Reuters HighQ AI contract review",
        ourVersion: "Each obligation in the Obligation Graph shows an AI confidence badge (High/Med/Low) indicating how reliably the obligation was extracted, with source clause excerpts on hover",
        status: "adopted",
        location: "prism-counsel/src/pages/obligation-graph.tsx",
      },
      {
        idea: "Evidence-Linked Audit Trail",
        source: "Relativity review audit",
        ourVersion: "Audit Trail page surfaces every agent decision linked to the underlying document or obligation evidence, with reviewer identity, timestamp, and policy state at time of review",
        status: "adopted",
        location: "prism-counsel/src/pages/audit-trail.tsx",
      },
    ],
    oneOfOneThesis: "PRISM Counsel is the only legal platform where every obligation is wrapped in a cryptographic proof chain — proving which agent extracted it, which human confirmed it, and what the governing policy was at decision time. Clio manages matters. PRISM Counsel proves them.",
    oneOfOneEvidence: [
      "Proof Chain Export generates a verifiable audit record of every obligation classification decision",
      "Privilege Controls enforce attorney-client tagging at the agent layer, not just the UI layer",
      "Obligation Graph links every deadline to its source document and agent confidence chain",
    ],
  },
  {
    id: "real-estate",
    name: "Real Estate Intelligence",
    artifact: "Terra",
    artifactPath: "/terra/",
    accentColor: "#00e878",
    icon: Building2,
    champions: [
      {
        name: "CoStar",
        url: "https://costar.com",
        tagline: "Commercial real estate data and analytics platform",
        bestAt: [
          "Ranked property results with relevance signals — most actionable first",
          "Loan data embedded directly in property views — no tab switching",
          "Guided search with filters that reduce cognitive load (Urbanist type, green/orange signal palette)",
          "Market comp density — the deepest transaction database in CRE",
        ],
      },
      {
        name: "ARGUS (Altus Group)",
        url: "https://altusgroup.com",
        tagline: "Asset management and DCF modeling for CRE",
        bestAt: [
          "Stress testing — multi-scenario DCF modeling with cap rate sensitivity",
          "Portfolio-level scenario branches (base / downside / upside) in one view",
          "Lender-grade underwriting model output trusted in institutional transactions",
          "Climate risk factored into NOI projections at the asset level",
        ],
      },
      {
        name: "CompStak",
        url: "https://compstak.com",
        tagline: "Lease and sale comp intelligence for commercial brokers",
        bestAt: [
          "Crowdsourced comp data with recency ranking — freshest comps first",
          "Broker-to-broker exchange model builds data moat competitors can't replicate",
          "Rent roll benchmarking against market comps per submarket",
          "Visual comparable heat map by PSF across a geographic cluster",
        ],
      },
    ],
    stealThis: [
      {
        idea: "Opportunity Score Ranking",
        source: "CoStar ranked property results",
        ourVersion: "Each property in Terra listings and pipeline shows an Opportunity Score (0–100) calculated from distress signals, cap rate delta, neighborhood momentum, and AI confidence — most actionable deals surface first",
        status: "adopted",
        location: "terra/src/pages/dashboard.tsx",
      },
      {
        idea: "Climate Risk in Underwriting",
        source: "ARGUS / Altus Group NOI stress testing",
        ourVersion: "Climate Risk Enhanced page and property cards embed a Climate Exposure Score that flows into the pro forma — showing flood/fire/transition risk as a quantified NOI haircut alongside base case",
        status: "adopted",
        location: "terra/src/pages/climate-risk-enhanced.tsx",
      },
      {
        idea: "Comp Recency Ranking",
        source: "CompStak crowdsourced comp freshness",
        ourVersion: "Comparable Sales and Market Intelligence pages sort and badge comps by freshness — live / recent / stale — so analysts know which data to weight",
        status: "adopted",
        location: "terra/src/pages/comparable-sales.tsx",
      },
    ],
    oneOfOneThesis: "Terra is the only real estate platform that fuses AI distress forecasting, climate risk quantification, and governed underwriting in a single proof chain — every acquisition thesis is backed by an evidence trail from data ingestion through to the decision. CoStar shows you the market. Terra tells you what to do about it and proves why.",
    oneOfOneEvidence: [
      "Distress Engine generates a scored distress forecast per property with agent-verified signals",
      "Property Twin renders a full underwriting model with scenario branches and AI confidence weights",
      "Trust & Provenance page shows data source lineage for every metric in the dashboard",
    ],
  },
  {
    id: "maritime",
    name: "Maritime Intelligence",
    artifact: "Vessels",
    artifactPath: "/vessels/",
    accentColor: "#3b82f6",
    icon: Ship,
    champions: [
      {
        name: "Windward",
        url: "https://windward.ai",
        tagline: "Maritime AI platform for exception management and global trade",
        bestAt: [
          "Exception management as the primary UX — prioritized queue of vessels needing attention, not a raw map",
          "Multi-source intelligence fusion: EO, SAR, RF GEOINT signals fused with AIS into one vessel profile",
          "Predictive risk scoring per vessel before incidents occur — not just post-event reporting",
          "Embeddable API so intelligence slots into existing ops tools without forcing a platform switch",
        ],
      },
      {
        name: "Kpler",
        url: "https://kpler.com",
        tagline: "Commodity flow and trade intelligence for energy and shipping",
        bestAt: [
          "Commodity flow tracking across trade corridors — shows what's moving where in real time",
          "Cargo-linked vessel tracking — search by cargo type, not just vessel name",
          "Supply/demand imbalance signals from port data that anticipate freight rate moves",
          "Clean API data model trusted by commodity desks for systematic trading signals",
        ],
      },
      {
        name: "Pole Star",
        url: "https://polestar.com",
        tagline: "Fleet tracking and maritime compliance platform",
        bestAt: [
          "Sanctions compliance screening with geofence alerting for restricted areas",
          "Crew certification tracking integrated with voyage planning",
          "Port state control (PSC) risk scoring ahead of port calls",
          "Long-term voyage history for audit and insurance dispute resolution",
        ],
      },
    ],
    stealThis: [
      {
        idea: "Exception-First Priority Queue",
        source: "Windward exception management UX",
        ourVersion: "Exceptions Center surfaces all fleet exceptions sorted by a composite Exception Priority Score (severity × financial impact × time sensitivity) — operators see what needs action first, not a map full of dots",
        status: "adopted",
        location: "vessels/src/pages/exceptions-center.tsx",
      },
      {
        idea: "Multi-Source Intelligence Fusion Indicator",
        source: "Windward EO/SAR/RF GEOINT fusion",
        ourVersion: "Each vessel in the fleet and exception views shows an Intelligence Sources badge indicating which signal types contributed (AIS · SAR · RF · Port · Sanctions) — operators know if a profile is AIS-only or multi-source verified",
        status: "adopted",
        location: "vessels/src/pages/fleet-dashboard.tsx",
      },
      {
        idea: "Cargo-Linked Corridor Intelligence",
        source: "Kpler commodity flow tracking",
        ourVersion: "Trade Flow Heatmap links corridors to commodity types with supply/demand imbalance signals — shows not just where vessels are but what they're carrying and what that means for freight rate exposure",
        status: "adopted",
        location: "vessels/src/pages/trade-flow-heatmap.tsx",
      },
    ],
    oneOfOneThesis: "Vessels is the only maritime platform where every dark vessel detection, sanctions match, and route anomaly generates a governed decision record — including which agent identified it, the confidence weight, and what action was taken under which policy tier. Windward shows risk. Vessels proves what was done about it.",
    oneOfOneEvidence: [
      "Dark Fleet Economics page quantifies the financial exposure of each dark vessel with proof-linked evidence",
      "Sanctions Chain Explorer traces the full corporate ownership chain behind each flagged entity",
      "Voyage Risk Twin generates a full risk narrative per voyage with confidence-weighted evidence per signal",
    ],
  },
  {
    id: "executive-briefing",
    name: "AI Executive Briefing",
    artifact: "Pulse",
    artifactPath: "/pulse/",
    accentColor: "#c8a84b",
    icon: Brain,
    champions: [
      {
        name: "Palantir AIP",
        url: "https://palantir.com",
        tagline: "AI operating system for enterprise data and operations",
        bestAt: [
          "AIP Assist — context-aware AI sidebar that surfaces relevant data without leaving your workflow",
          "Ontology-grounded intelligence — every AI output traceable to a defined data object with lineage",
          "Human-in-the-loop controls (Machinery) that require sign-off before autonomous actions propagate",
          "Workshop app builder lets non-engineers build AI-powered briefing surfaces for their teams",
        ],
      },
      {
        name: "Govini Ark",
        url: "https://govini.com",
        tagline: "Decision intelligence for defense and national security",
        bestAt: [
          "Structured decision packages — intelligence presented as a brief with recommendation, risk, and alternatives",
          "Source-cited evidence for every analytical claim — no unsourced conclusions",
          "Geopolitical and supply chain risk scoring per program — context beyond internal data",
          "Designed for principals: clean reading mode, minimal chrome, maximum signal",
        ],
      },
    ],
    stealThis: [
      {
        idea: "Source Provenance per Briefing Item",
        source: "Govini Ark source-cited evidence",
        ourVersion: "Each section card in Pulse Today's Brief shows a provenance strip — which agents contributed, which products fed data, and the data freshness — so principals know the intelligence pedigree before acting",
        status: "adopted",
        location: "pulse/src/pages/TodaysBrief.tsx",
      },
      {
        idea: "Context-Aware AI Sidebar",
        source: "Palantir AIP Assist",
        ourVersion: "Pulse Constellation page provides a cross-product intelligence assistant that surfaces connections between briefing items across Sentra, Vessels, Terra, and Lyte — one query spans the whole platform",
        status: "adopted",
        location: "pulse/src/pages/Constellation.tsx",
      },
      {
        idea: "Structured Decision Package Format",
        source: "Govini decision brief structure",
        ourVersion: "Each briefing item includes a Recommended Action, risk level, and Dissent Channel link — matching the govie decision brief structure so executives get recommendation + risk + alternatives in one card",
        status: "adopted",
        location: "pulse/src/pages/TodaysBrief.tsx",
      },
    ],
    oneOfOneThesis: "Pulse is the only executive briefing platform that synthesizes intelligence across cyber, legal, real estate, maritime, and operations into a single daily brief with a Governed Autonomy proof envelope on every insight. Govini briefs defense programs. Pulse briefs the whole enterprise — and shows its work.",
    oneOfOneEvidence: [
      "Today's Brief pulls from every SZL product via agent consensus — not a single-domain digest",
      "Dissent Channel lets any agent surface a minority view on a briefing conclusion before it reaches the principal",
      "Confidence Dashboard tracks the reliability of each agent over rolling 30-day windows",
    ],
  },
  {
    id: "decision-intelligence",
    name: "Decision Intelligence",
    artifact: "Lyte",
    artifactPath: "/lyte/",
    accentColor: "#ffb700",
    icon: BarChart3,
    champions: [
      {
        name: "ThoughtSpot",
        url: "https://thoughtspot.com",
        tagline: "AI-powered search and analytics for business users",
        bestAt: [
          "Natural language search for data — type a question, get an answer without SQL",
          "SpotIQ automated insight discovery — surfaces patterns users didn't know to ask for",
          "Liveboard for real-time data pinboarding that anyone can build without a BI team",
          "Embedding SDK so analytics surfaces inside existing enterprise products",
        ],
      },
      {
        name: "Pyramid Analytics",
        url: "https://pyramidanalytics.com",
        tagline: "Governed analytics and decision intelligence platform",
        bestAt: [
          "Decision confidence scoring — attaches uncertainty bands to every analytical conclusion",
          "Governed data model with role-based access that ensures clean lineage from source to insight",
          "What-if scenario modeling embedded in dashboards — no pivot to a separate planning tool",
          "Generative BI that auto-narrates findings in plain language for non-analysts",
        ],
      },
      {
        name: "Qlik Sense",
        url: "https://qlik.com",
        tagline: "Associative analytics platform for exploration and BI",
        bestAt: [
          "Associative engine — clicking any data point filters the entire dataset simultaneously",
          "Active Intelligence pipeline for event-driven, always-on analytics",
          "Integration with Databricks and Snowflake for large-scale data modeling",
          "Alerting on metric anomalies with configurable notification paths",
        ],
      },
    ],
    stealThis: [
      {
        idea: "Natural Language Signal Query",
        source: "ThoughtSpot NL search",
        ourVersion: "Signals Console NL query bar — operators type plain English ('show revenue risk signals escalated this week') and the console filters and ranks matching signals without requiring filter panel navigation",
        status: "adopted",
        location: "lyte-command-center/src/pages/signals-console.tsx",
      },
      {
        idea: "Decision Confidence Gauge",
        source: "Pyramid Analytics confidence scoring",
        ourVersion: "Each signal card in the Signals Console shows a PRISM Confidence gauge — a composite score across 5 dimensions (revenue, staffing, infrastructure, security, market timing) indicating how certain the recommendation is",
        status: "adopted",
        location: "lyte-command-center/src/pages/signals-console.tsx",
      },
      {
        idea: "What-If Scenario Toggle",
        source: "Pyramid Analytics what-if modeling",
        ourVersion: "Decision Twin page allows operators to toggle between Base / Accelerate / Delay / Monitor scenarios and instantly see PRISM impact deltas — no separate planning tool required",
        status: "adopted",
        location: "lyte-command-center/src/pages/decision-twin.tsx",
      },
    ],
    oneOfOneThesis: "Lyte is the only decision intelligence platform that attaches a governed proof chain to every workflow signal — showing not just the insight but the policy state, ownership assignment, and confidence drift over time. ThoughtSpot answers questions. Lyte governs decisions.",
    oneOfOneEvidence: [
      "Ownership Drift page tracks which decisions have gone unassigned and for how long, with financial exposure per gap",
      "Policy Center encodes guardrail rules that block or flag signals before they reach human review queues",
      "Decision Replay reconstructs any past decision with full agent reasoning and policy state at the moment",
    ],
  },
  {
    id: "holdings-strategy",
    name: "Holdings Strategy",
    artifact: "Command + SZL Holdings",
    artifactPath: "/command/",
    accentColor: "#8b7ac8",
    icon: Cpu,
    champions: [
      {
        name: "Palantir Foundry",
        url: "https://palantir.com",
        tagline: "Enterprise data operating system with ontology and pipeline tooling",
        bestAt: [
          "Ontology layer gives every data object a defined type, lineage, and permission model",
          "Pipeline builder for non-engineers: transform and join data without code",
          "Full audit trail of every data transformation from source to dashboard",
          "Contour dashboards for executive views with drill-down to underlying data",
        ],
      },
      {
        name: "Cascade Strategy",
        url: "https://cascade.app",
        tagline: "Strategy execution platform connecting goals to daily work",
        bestAt: [
          "OKR / goal hierarchy that flows from company strategy down to individual tasks",
          "Health score per goal with owner accountability and traffic-light status",
          "Cross-team alignment view showing where strategies are on-track vs. off-track",
          "Focus mode: clean reading view for executives that strips away dashboard clutter",
        ],
      },
      {
        name: "Visible.vc",
        url: "https://visible.vc",
        tagline: "Portfolio monitoring and investor reporting for VCs and holding companies",
        bestAt: [
          "Investor update templates with automated KPI pulls from portfolio companies",
          "Board deck generation from live data — no manual chart updates",
          "Benchmark comparison across portfolio companies on common metrics",
          "LP data room with granular document access logging",
        ],
      },
    ],
    stealThis: [
      {
        idea: "Goal Health Score per Domain",
        source: "Cascade Strategy health scoring",
        ourVersion: "Command Strategy Dashboard Domain Grid shows an Enterprise Health Score per subsidiary — a traffic-light composite score (Operations Health, Risk Posture, Market Position, Team Velocity) with owner accountability and trend arrow",
        status: "adopted",
        location: "command/src/pages/dashboard.tsx",
      },
      {
        idea: "Investor Update Automation",
        source: "Visible.vc automated KPI pulls",
        ourVersion: "SZL Holdings Investors Hub auto-compiles portfolio KPIs from Sentra, Vessels, Terra, and Lyte into an investor-ready view with last-updated timestamps per metric — no manual reporting",
        status: "adopted",
        location: "szl-holdings/src/pages/",
      },
      {
        idea: "Cross-Portfolio Benchmark",
        source: "Visible.vc portfolio benchmarking",
        ourVersion: "Command Correlation Map overlays performance signals across subsidiaries — showing where positive or negative patterns are correlated and which domains are outliers on composite risk/performance",
        status: "adopted",
        location: "command/src/pages/correlation-map.tsx",
      },
    ],
    oneOfOneThesis: "The SZL Command platform is the only holding company strategy system that unifies agentic AI governance across six operating domains in one proof chain — showing not just portfolio performance but which AI agents contributed to each insight, which humans approved actions, and the complete audit log from signal to decision. No portfolio monitoring tool has this. This is the Governed Autonomy stack made visible.",
    oneOfOneEvidence: [
      "Governed Cockpit surfaces every pending AI action across the entire portfolio in one approval queue",
      "Cognitive Command Center maintains a live Self-Model and World-Model for the enterprise — the only platform that knows what it knows",
      "Atlas KPI Section cross-links performance metrics to the agent runs that generated them",
    ],
  },
];

function ChampionCard({ champion }: { champion: Champion }) {
  return (
    <div className="rounded-lg p-4 space-y-3" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-white/90">{champion.name}</div>
          <div className="text-xs text-white/40 mt-0.5">{champion.tagline}</div>
        </div>
        <a
          href={champion.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-white/25 hover:text-white/50 transition-colors flex-shrink-0"
        >
          <ExternalLink className="w-2.5 h-2.5" />
          <span>ref</span>
        </a>
      </div>
      <ul className="space-y-1.5">
        {champion.bestAt.map((item, i) => (
          <li key={i} className="flex gap-2">
            <Star className="w-2.5 h-2.5 text-amber-400/40 flex-shrink-0 mt-1" />
            <span className="text-xs text-white/55 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const STATUS_CONFIG: Record<AdoptionStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  adopted: { label: "Adopted", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25", icon: CheckCircle2 },
  "in-progress": { label: "In Progress", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/25", icon: Zap },
  evaluating: { label: "Evaluating", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/25", icon: Clock },
  rejected: { label: "Rejected", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/25", icon: XCircle },
  deferred: { label: "Deferred", color: "text-white/40", bg: "bg-white/5", border: "border-white/10", icon: PauseCircle },
};

const STATUS_OPTIONS: AdoptionStatus[] = ["adopted", "in-progress", "evaluating", "rejected", "deferred"];

const STORAGE_KEY = "competitive-atlas-overrides-v1";

interface IdeaOverride {
  status?: AdoptionStatus;
  notes?: string;
}

type OverridesMap = Record<string, IdeaOverride>;

function loadOverrides(): OverridesMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as OverridesMap;
  } catch {
    return {};
  }
}

function saveOverrides(overrides: OverridesMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // ignore quota errors
  }
}

function ideaKey(laneId: string, idea: string) {
  return `${laneId}::${idea}`;
}

interface AdoptionRowProps {
  laneId: string;
  adoption: Adoption;
  effectiveStatus: AdoptionStatus;
  notes: string;
  onStatusChange: (status: AdoptionStatus) => void;
  onNotesChange: (notes: string) => void;
}

function AdoptionRow({ adoption, effectiveStatus, notes, onStatusChange, onNotesChange }: AdoptionRowProps) {
  const cfg = STATUS_CONFIG[effectiveStatus];
  const Icon = cfg.icon;
  const [showNotes, setShowNotes] = useState(notes.length > 0);

  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.018)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className={`relative inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${cfg.bg} border ${cfg.border}`}>
            <Icon className={`w-2.5 h-2.5 ${cfg.color}`} />
            <span className={`text-[9px] font-mono uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
            <select
              value={effectiveStatus}
              onChange={(e) => onStatusChange(e.target.value as AdoptionStatus)}
              aria-label={`Status for ${adoption.idea}`}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_CONFIG[s].label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="text-xs font-semibold text-white/80">{adoption.idea}</div>
            <div className="text-[9px] font-mono text-white/20 flex-shrink-0">from {adoption.source}</div>
          </div>
          <div className="text-xs text-white/45 mt-1 leading-relaxed">{adoption.ourVersion}</div>
          <div className="flex items-center justify-between gap-2 mt-1.5">
            <div className="text-[9px] font-mono text-white/20">{adoption.location}</div>
            <button
              onClick={() => setShowNotes((v) => !v)}
              className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-white/30 hover:text-white/60 transition-colors"
            >
              <StickyNote className="w-2.5 h-2.5" />
              <span>{notes.length > 0 ? "Note" : showNotes ? "Hide note" : "Add note"}</span>
            </button>
          </div>
        </div>
      </div>
      {showNotes && (
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Operator note — context, blockers, next steps…"
          rows={2}
          className="w-full text-xs text-white/75 bg-black/30 border border-white/10 rounded-md px-3 py-2 leading-relaxed focus:outline-none focus:border-white/25 placeholder:text-white/20"
        />
      )}
    </div>
  );
}

const REC_CONFIG: Record<Recommendation, { label: string; color: string; bg: string; border: string }> = {
  adopt: { label: "Adopt", color: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  counter: { label: "Counter", color: "text-rose-300", bg: "bg-rose-500/10", border: "border-rose-500/30" },
  monitor: { label: "Monitor", color: "text-sky-300", bg: "bg-sky-500/10", border: "border-sky-500/30" },
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "just now";
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function IntelUpdateCard({ alert, onDismiss, accentColor }: { alert: IntelAlert; onDismiss: (id: string) => void; accentColor: string }) {
  const cfg = REC_CONFIG[alert.recommendation];
  return (
    <div className="rounded-lg p-3.5 space-y-2.5" style={{ background: `${accentColor}06`, border: `1px solid ${accentColor}22` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded" style={{ background: `${accentColor}14`, border: `1px solid ${accentColor}28` }}>
            <Radio className="w-2.5 h-2.5" style={{ color: accentColor }} />
            <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: accentColor }}>Intel Update</span>
          </div>
          <span className="text-[10px] font-mono text-white/40 truncate">{alert.champion}</span>
          <span className="text-[10px] text-white/20">·</span>
          <span className="text-[10px] text-white/30 whitespace-nowrap">{timeAgo(alert.publishedAt)}</span>
        </div>
        <button
          onClick={() => onDismiss(alert.id)}
          className="flex-shrink-0 p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/70 transition-colors"
          aria-label="Dismiss alert"
          title="Dismiss"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="text-sm font-semibold text-white/85 leading-snug">{alert.title}</div>
      {alert.summary && <div className="text-xs text-white/50 leading-relaxed line-clamp-3">{alert.summary}</div>}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${cfg.bg} border ${cfg.border}`}>
          <span className={`text-[9px] font-mono uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
          <span className={`text-[10px] ${cfg.color} opacity-80`}>· {alert.recommendationReason}</span>
        </div>
        <a href={alert.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-white/40 hover:text-white/70 transition-colors flex-shrink-0">
          source <ArrowUpRight className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  );
}

interface LaneSectionProps {
  lane: Lane;
  overrides: OverridesMap;
  alerts: IntelAlert[];
  onStatusChange: (laneId: string, idea: string, status: AdoptionStatus) => void;
  onNotesChange: (laneId: string, idea: string, notes: string) => void;
  onDismiss: (id: string) => void;
}

function LaneSection({ lane, overrides, alerts, onStatusChange, onNotesChange, onDismiss }: LaneSectionProps) {
  const [open, setOpen] = useState(false);
  const Icon = lane.icon;
  const effective = lane.stealThis.map((a) => overrides[ideaKey(lane.id, a.idea)]?.status ?? a.status);
  const adoptedCount = effective.filter((s) => s === "adopted").length;
  const activeAlerts = alerts.filter(a => !a.dismissed);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${lane.accentColor}12`, border: `1px solid ${lane.accentColor}22` }}>
            <Icon className="w-4.5 h-4.5" style={{ color: lane.accentColor, width: 18, height: 18 }} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-semibold text-white/90">{lane.name}</span>
              <span className="text-[10px] font-mono text-white/25 px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {lane.artifact}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] text-white/30">{lane.champions.length} champions researched</span>
              <span className="text-[10px] text-white/20">·</span>
              <span className="text-[10px]" style={{ color: `${lane.accentColor}aa` }}>{adoptedCount}/{lane.stealThis.length} ideas adopted</span>
              {activeAlerts.length > 0 && (
                <>
                  <span className="text-[10px] text-white/20">·</span>
                  <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: lane.accentColor }}>
                    <Radio className="w-2.5 h-2.5" />
                    {activeAlerts.length} live intel
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex gap-1">
            {effective.map((s, i) => {
              const cfg = STATUS_CONFIG[s];
              const Ic = cfg.icon;
              return <Ic key={i} className={`w-3.5 h-3.5 ${cfg.color}`} />;
            })}
          </div>
          {open ? <ChevronDown className="w-4 h-4 text-white/30" /> : <ChevronRight className="w-4 h-4 text-white/30" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-white/5 p-5 space-y-6">
          {activeAlerts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: lane.accentColor }}>
                  Live Intel Updates · {activeAlerts.length}
                </div>
                <div className="text-[9px] font-mono text-white/25">Polled daily · dismissible</div>
              </div>
              <div className="space-y-2">
                {activeAlerts.map(a => (
                  <IntelUpdateCard key={a.id} alert={a} onDismiss={onDismiss} accentColor={lane.accentColor} />
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/25 mb-3">Champions — What They Do Best</div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {lane.champions.map((c, i) => <ChampionCard key={i} champion={c} />)}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/25 mb-3">Steal This, Make It Ours — Adoption Log</div>
            <div className="space-y-2">
              {lane.stealThis.map((a, i) => {
                const k = ideaKey(lane.id, a.idea);
                const ov = overrides[k] ?? {};
                return (
                  <AdoptionRow
                    key={i}
                    laneId={lane.id}
                    adoption={a}
                    effectiveStatus={ov.status ?? a.status}
                    notes={ov.notes ?? ""}
                    onStatusChange={(s) => onStatusChange(lane.id, a.idea, s)}
                    onNotesChange={(n) => onNotesChange(lane.id, a.idea, n)}
                  />
                );
              })}
            </div>
          </div>

          <div className="rounded-lg p-4 space-y-3" style={{ background: `${lane.accentColor}08`, border: `1px solid ${lane.accentColor}18` }}>
            <div className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5" style={{ color: lane.accentColor }} />
              <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: lane.accentColor }}>One-of-One Thesis</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">{lane.oneOfOneThesis}</p>
            <ul className="space-y-2 pt-1">
              {lane.oneOfOneEvidence.map((e, i) => (
                <li key={i} className="flex gap-2">
                  <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: lane.accentColor }} />
                  <span className="text-xs text-white/50 leading-relaxed">{e}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function buildMarkdownExport(overrides: OverridesMap): string {
  const today = new Date().toISOString().slice(0, 10);
  const lines: string[] = [];
  lines.push(`# Competitive Atlas — Adoption Brief`);
  lines.push(``);
  lines.push(`Generated ${today} · SZL Holdings Competitive Intelligence`);
  lines.push(``);

  const allIdeas = LANES.flatMap((l) =>
    l.stealThis.map((a) => ({
      laneId: l.id,
      laneName: l.name,
      idea: a,
      effective: overrides[ideaKey(l.id, a.idea)]?.status ?? a.status,
      notes: overrides[ideaKey(l.id, a.idea)]?.notes ?? "",
    }))
  );

  const counts: Record<AdoptionStatus, number> = {
    adopted: 0, "in-progress": 0, evaluating: 0, rejected: 0, deferred: 0,
  };
  for (const i of allIdeas) counts[i.effective]++;

  lines.push(`## Summary`);
  lines.push(``);
  lines.push(`- Total ideas: ${allIdeas.length}`);
  for (const s of STATUS_OPTIONS) {
    lines.push(`- ${STATUS_CONFIG[s].label}: ${counts[s]}`);
  }
  lines.push(``);

  for (const lane of LANES) {
    lines.push(`## ${lane.name} (${lane.artifact})`);
    lines.push(``);
    for (const a of lane.stealThis) {
      const k = ideaKey(lane.id, a.idea);
      const ov = overrides[k] ?? {};
      const status = ov.status ?? a.status;
      lines.push(`### ${a.idea}`);
      lines.push(``);
      lines.push(`- **Status:** ${STATUS_CONFIG[status].label}`);
      lines.push(`- **Source:** ${a.source}`);
      lines.push(`- **Our version:** ${a.ourVersion}`);
      lines.push(`- **Location:** \`${a.location}\``);
      if (ov.notes && ov.notes.trim().length > 0) {
        lines.push(`- **Operator note:** ${ov.notes.trim()}`);
      }
      lines.push(``);
    }
  }

  return lines.join("\n");
}

function useIntelMonitor() {
  const [alerts, setAlerts] = useState<IntelAlert[]>([]);
  const [status, setStatus] = useState<IntelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadAlerts() {
    try {
      const [aRes, sRes] = await Promise.all([
        fetch("/api/competitive-intel/alerts", { credentials: "include" }),
        fetch("/api/competitive-intel/status", { credentials: "include" }),
      ]);
      if (!aRes.ok) throw new Error(`alerts: HTTP ${aRes.status}`);
      const aJson = await aRes.json();
      setAlerts(Array.isArray(aJson?.alerts) ? aJson.alerts : []);
      if (sRes.ok) setStatus(await sRes.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load intel");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadAlerts(); }, []);

  function readCsrfToken(): string | null {
    const m = document.cookie.split(";").find(c => c.trim().startsWith("csrf_token="));
    return m ? decodeURIComponent(m.split("=")[1] ?? "") : null;
  }

  async function ensureCsrfToken(): Promise<string | null> {
    let t = readCsrfToken();
    if (t) return t;
    try {
      await fetch("/api/csrf-token", { credentials: "include" });
      t = readCsrfToken();
    } catch { /* ignore */ }
    return t;
  }

  async function dismiss(id: string) {
    setAlerts(prev => prev.filter(a => a.id !== id));
    try {
      const csrf = await ensureCsrfToken();
      await fetch(`/api/competitive-intel/alerts/${encodeURIComponent(id)}/dismiss`, {
        method: "POST",
        credentials: "include",
        headers: csrf ? { "X-CSRF-Token": csrf } : {},
      });
    } catch {
      void loadAlerts();
    }
  }

  async function refresh() {
    setRefreshing(true);
    try {
      const csrf = await ensureCsrfToken();
      await fetch("/api/competitive-intel/refresh", {
        method: "POST",
        credentials: "include",
        headers: csrf ? { "X-CSRF-Token": csrf } : {},
      });
      await loadAlerts();
    } finally {
      setRefreshing(false);
    }
  }

  return { alerts, status, loading, refreshing, error, dismiss, refresh, reload: loadAlerts };
}

interface ManagedFeed {
  id: string;
  laneId: string;
  champion: string;
  feedUrl: string;
  homeUrl: string;
  paused?: boolean;
  recommendationHint?: Recommendation | null;
  createdAt?: string;
  updatedAt?: string;
}

const REC_OPTIONS: Array<{ value: "" | Recommendation; label: string }> = [
  { value: "", label: "Auto (heuristic)" },
  { value: "adopt", label: "Adopt" },
  { value: "counter", label: "Counter" },
  { value: "monitor", label: "Monitor" },
];

async function readCsrf(): Promise<string | null> {
  const m = document.cookie.split(";").find(c => c.trim().startsWith("csrf_token="));
  if (m) return decodeURIComponent(m.split("=")[1] ?? "");
  try {
    await fetch("/api/csrf-token", { credentials: "include" });
    const m2 = document.cookie.split(";").find(c => c.trim().startsWith("csrf_token="));
    return m2 ? decodeURIComponent(m2.split("=")[1] ?? "") : null;
  } catch {
    return null;
  }
}

interface ManageFeedsPanelProps {
  onChanged: () => void;
}

function ManageFeedsPanel({ onChanged }: ManageFeedsPanelProps) {
  const [open, setOpen] = useState(false);
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [feeds, setFeeds] = useState<ManagedFeed[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [draftChampion, setDraftChampion] = useState("");
  const [draftLane, setDraftLane] = useState(LANES[0]?.id ?? "");
  const [draftFeedUrl, setDraftFeedUrl] = useState("");
  const [draftHomeUrl, setDraftHomeUrl] = useState("");
  const [draftHint, setDraftHint] = useState<"" | Recommendation>("");
  const [adding, setAdding] = useState(false);

  async function loadFeeds() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/competitive-intel/feeds", { credentials: "include" });
      if (res.status === 401 || res.status === 403) {
        setAdmin(false);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setAdmin(true);
      setFeeds(Array.isArray(json?.feeds) ? json.feeds : Array.isArray(json?.data?.feeds) ? json.data.feeds : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load feeds");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadFeeds(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!draftChampion.trim() || !draftFeedUrl.trim() || !draftLane) return;
    setAdding(true);
    setError(null);
    try {
      const csrf = await readCsrf();
      const res = await fetch("/api/competitive-intel/feeds", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(csrf ? { "X-CSRF-Token": csrf } : {}) },
        body: JSON.stringify({
          champion: draftChampion.trim(),
          laneId: draftLane,
          feedUrl: draftFeedUrl.trim(),
          homeUrl: draftHomeUrl.trim() || undefined,
          recommendationHint: draftHint || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? body?.error ?? `HTTP ${res.status}`);
      }
      setDraftChampion("");
      setDraftFeedUrl("");
      setDraftHomeUrl("");
      setDraftHint("");
      await loadFeeds();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add feed");
    } finally {
      setAdding(false);
    }
  }

  async function patchFeed(id: string, patch: Record<string, unknown>) {
    setBusyId(id);
    setError(null);
    try {
      const csrf = await readCsrf();
      const res = await fetch(`/api/competitive-intel/feeds/${encodeURIComponent(id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(csrf ? { "X-CSRF-Token": csrf } : {}) },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? body?.error ?? `HTTP ${res.status}`);
      }
      await loadFeeds();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update feed");
    } finally {
      setBusyId(null);
    }
  }

  async function removeFeed(id: string, champion: string) {
    if (typeof window !== "undefined" && !window.confirm(`Remove tracked competitor "${champion}"?`)) return;
    setBusyId(id);
    setError(null);
    try {
      const csrf = await readCsrf();
      const res = await fetch(`/api/competitive-intel/feeds/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
        headers: csrf ? { "X-CSRF-Token": csrf } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadFeeds();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove feed");
    } finally {
      setBusyId(null);
    }
  }

  if (admin === false) return null;
  if (admin === null && !loading) return null;

  const totalCount = feeds.length;
  const activeCount = feeds.filter(f => !f.paused).length;

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "rgba(140,120,200,0.04)", border: "1px solid rgba(140,120,200,0.18)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(140,120,200,0.1)", border: "1px solid rgba(140,120,200,0.25)" }}>
            <Settings className="w-4 h-4" style={{ color: "#a78bfa" }} />
          </div>
          <div>
            <div className="text-sm font-semibold text-white/85">Manage tracked competitors</div>
            <div className="text-[11px] text-white/45 mt-0.5">
              {activeCount} active · {totalCount - activeCount} paused · admin only · changes persist
            </div>
          </div>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-white/30" /> : <ChevronRight className="w-4 h-4 text-white/30" />}
      </button>

      {open && (
        <div className="border-t border-white/5 p-5 space-y-5">
          {error && (
            <div className="flex items-start gap-2 rounded-md p-3 text-xs" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)", color: "#fda4af" }}>
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdd} className="rounded-lg p-4 space-y-3" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/35">Add a feed</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">Champion</span>
                <input
                  required
                  value={draftChampion}
                  onChange={e => setDraftChampion(e.target.value)}
                  placeholder="e.g. Sevenseas Maritime AI"
                  className="w-full text-xs text-white/85 bg-black/30 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-white/25 placeholder:text-white/20"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">Lane</span>
                <select
                  value={draftLane}
                  onChange={e => setDraftLane(e.target.value)}
                  className="w-full text-xs text-white/85 bg-black/30 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-white/25"
                >
                  {LANES.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">RSS / Atom feed URL</span>
                <input
                  required
                  value={draftFeedUrl}
                  onChange={e => setDraftFeedUrl(e.target.value)}
                  placeholder="https://example.com/blog/feed/"
                  className="w-full text-xs text-white/85 bg-black/30 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-white/25 placeholder:text-white/20"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">Homepage (optional)</span>
                <input
                  value={draftHomeUrl}
                  onChange={e => setDraftHomeUrl(e.target.value)}
                  placeholder="https://example.com/blog/"
                  className="w-full text-xs text-white/85 bg-black/30 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-white/25 placeholder:text-white/20"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">Recommendation hint</span>
                <select
                  value={draftHint}
                  onChange={e => setDraftHint(e.target.value as "" | Recommendation)}
                  className="w-full text-xs text-white/85 bg-black/30 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-white/25"
                >
                  {REC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={adding}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-mono uppercase tracking-wider disabled:opacity-50"
                style={{ background: "rgba(140,120,200,0.12)", border: "1px solid rgba(140,120,200,0.3)", color: "#c4b5fd" }}
              >
                <Plus className="w-3 h-3" />
                {adding ? "Adding…" : "Add competitor"}
              </button>
            </div>
          </form>

          <div className="space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/35">Tracked feeds · {feeds.length}</div>
            {loading && feeds.length === 0 && (
              <div className="text-xs text-white/40 px-3 py-4">Loading…</div>
            )}
            {!loading && feeds.length === 0 && (
              <div className="text-xs text-white/40 px-3 py-4">No feeds yet. Add one above.</div>
            )}
            {feeds.map(feed => {
              const lane = LANES.find(l => l.id === feed.laneId);
              const accent = lane?.accentColor ?? "#8b7ac8";
              const busy = busyId === feed.id;
              return (
                <div key={feed.id} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white/85 truncate">{feed.champion}</span>
                        {feed.paused && (
                          <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}>
                            paused
                          </span>
                        )}
                        {feed.recommendationHint && (
                          <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: `${accent}14`, border: `1px solid ${accent}30`, color: accent }}>
                            hint: {feed.recommendationHint}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono text-white/35">
                        <span style={{ color: accent }}>{lane?.name ?? feed.laneId}</span>
                        <a href={feed.feedUrl} target="_blank" rel="noopener noreferrer" className="truncate hover:text-white/70 transition-colors max-w-[28rem]">
                          {feed.feedUrl}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        value={feed.laneId}
                        disabled={busy}
                        onChange={e => void patchFeed(feed.id, { laneId: e.target.value })}
                        aria-label={`Lane for ${feed.champion}`}
                        className="text-[10px] text-white/75 bg-black/30 border border-white/10 rounded-md px-2 py-1 focus:outline-none focus:border-white/25"
                      >
                        {LANES.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                      <select
                        value={feed.recommendationHint ?? ""}
                        disabled={busy}
                        onChange={e => void patchFeed(feed.id, { recommendationHint: e.target.value || null })}
                        aria-label={`Recommendation hint for ${feed.champion}`}
                        className="text-[10px] text-white/75 bg-black/30 border border-white/10 rounded-md px-2 py-1 focus:outline-none focus:border-white/25"
                      >
                        {REC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void patchFeed(feed.id, { paused: !feed.paused })}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider text-white/65 hover:text-white border border-white/10 hover:border-white/25 disabled:opacity-50"
                        title={feed.paused ? "Resume polling" : "Pause polling"}
                      >
                        {feed.paused ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
                        {feed.paused ? "Resume" : "Pause"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void removeFeed(feed.id, feed.champion)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider text-rose-300/80 hover:text-rose-200 border border-rose-500/20 hover:border-rose-500/40 disabled:opacity-50"
                        title="Remove feed"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function CompetitiveAtlasPage() {
  const [overrides, setOverrides] = useState<OverridesMap>(() => loadOverrides());

  useEffect(() => {
    saveOverrides(overrides);
  }, [overrides]);

  const handleStatusChange = (laneId: string, idea: string, status: AdoptionStatus) => {
    setOverrides((prev) => {
      const k = ideaKey(laneId, idea);
      return { ...prev, [k]: { ...prev[k], status } };
    });
  };

  const handleNotesChange = (laneId: string, idea: string, notes: string) => {
    setOverrides((prev) => {
      const k = ideaKey(laneId, idea);
      return { ...prev, [k]: { ...prev[k], notes } };
    });
  };

  const stats = useMemo(() => {
    const all = LANES.flatMap((l) =>
      l.stealThis.map((a) => overrides[ideaKey(l.id, a.idea)]?.status ?? a.status)
    );
    const counts: Record<AdoptionStatus, number> = {
      adopted: 0, "in-progress": 0, evaluating: 0, rejected: 0, deferred: 0,
    };
    for (const s of all) counts[s]++;
    return { total: all.length, counts };
  }, [overrides]);

  const handleExport = () => {
    const md = buildMarkdownExport(overrides);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `competitive-atlas-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (typeof window === "undefined") return;
    const ok = window.confirm("Reset all operator overrides (status changes and notes) to their defaults?");
    if (!ok) return;
    setOverrides({});
  };

  const overrideCount = Object.keys(overrides).length;

  const { alerts, status, refreshing, dismiss, refresh, reload } = useIntelMonitor();
  const alertsByLane = useMemo(() => {
    const map = new Map<string, IntelAlert[]>();
    for (const a of alerts) {
      const arr = map.get(a.laneId) ?? [];
      arr.push(a);
      map.set(a.laneId, arr);
    }
    return map;
  }, [alerts]);
  const activeIntelCount = alerts.filter(a => !a.dismissed).length;
  const lastPolled = status?.lastFullPollAt ? timeAgo(status.lastFullPollAt) : "never";

  return (
    <div className="min-h-screen p-6 lg:p-8" style={{ background: "#070b12", color: "#c8d8e8" }}>
      <div className="max-w-6xl mx-auto space-y-8">

        <header className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/25">
            <TrendingUp className="w-3 h-3" />
            <span>Internal · Competitive Intelligence</span>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white/95 tracking-tight">Competitive Atlas</h1>
              <p className="text-sm text-white/45 max-w-2xl leading-relaxed">
                Per-lane research on global category champions, what they do exceptionally well, what we have adopted and reinterpreted, and what makes each SZL product genuinely one-of-one. Operators can edit each idea's status and add notes — your changes are saved on this device.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {overrideCount > 0 && (
                <button
                  onClick={handleReset}
                  className="text-[10px] font-mono uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors px-3 py-2 rounded-md border border-white/10 hover:border-white/25"
                >
                  Reset overrides
                </button>
              )}
              <button
                onClick={handleExport}
                className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-white/80 hover:text-white transition-colors px-3 py-2 rounded-md bg-white/10 border border-white/15 hover:bg-white/15"
              >
                <Download className="w-3 h-3" />
                <span>Export brief</span>
              </button>
            </div>
          </div>
        </header>

        <div className="rounded-xl p-4 flex flex-wrap items-center justify-between gap-3" style={{ background: "rgba(120,180,255,0.04)", border: "1px solid rgba(120,180,255,0.15)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(120,180,255,0.1)", border: "1px solid rgba(120,180,255,0.25)" }}>
              <Radio className="w-4 h-4 text-sky-300" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white/85">Live Competitive Signal Monitor</div>
              <div className="text-[11px] text-white/45 mt-0.5">
                {activeIntelCount} active intel update{activeIntelCount === 1 ? "" : "s"} across {status?.feeds?.length ?? 8} tracked feeds · last poll {lastPolled}
              </div>
            </div>
          </div>
          <button
            onClick={() => void refresh()}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-mono uppercase tracking-wider disabled:opacity-50"
            style={{ background: "rgba(120,180,255,0.08)", border: "1px solid rgba(120,180,255,0.25)", color: "rgb(125,211,252)" }}
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Polling…" : "Poll feeds"}
          </button>
        </div>

        <ManageFeedsPanel onChanged={() => { void reload(); }} />

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Lanes Researched", value: LANES.length.toString() },
            { label: "Champions Studied", value: LANES.flatMap(l => l.champions).length.toString() },
            { label: "Ideas Adopted", value: `${stats.counts.adopted}/${stats.total}` },
            { label: "One-of-One Theses", value: LANES.length.toString() },
            { label: "Live Intel Updates", value: activeIntelCount.toString() },
          ].map(m => (
            <div key={m.label} className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-2xl font-bold text-white/90 tabular-nums">{m.value}</div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/30 mt-1">{m.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => {
            const cfg = STATUS_CONFIG[s];
            const Ic = cfg.icon;
            return (
              <div key={s} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${cfg.bg} border ${cfg.border}`}>
                <Ic className={`w-3 h-3 ${cfg.color}`} />
                <span className={`text-[10px] font-mono uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                <span className={`text-[10px] font-mono ${cfg.color} opacity-70`}>{stats.counts[s]}</span>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          {LANES.map(lane => (
            <LaneSection
              key={lane.id}
              lane={lane}
              overrides={overrides}
              onStatusChange={handleStatusChange}
              onNotesChange={handleNotesChange}
              alerts={alertsByLane.get(lane.id) ?? []}
              onDismiss={dismiss}
            />
          ))}
        </div>

        <footer className="pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="text-[10px] font-mono text-white/20 uppercase tracking-wider">
            Internal use only · SZL Holdings Competitive Intelligence · April 2026
          </div>
          <div className="text-[10px] font-mono text-white/15">
            No scraped logos · No verbatim copy · Every pattern reinterpreted in our voice
          </div>
        </footer>
      </div>
    </div>
  );
}

export default CompetitiveAtlasPage;
