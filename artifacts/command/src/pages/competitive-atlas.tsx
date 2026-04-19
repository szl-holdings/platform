import { useState } from "react";
import { ExternalLink, TrendingUp, Zap, CheckCircle2, Circle, ChevronDown, ChevronRight, Target, Shield, Scale, Building2, Ship, Brain, BarChart3, Cpu, Star } from "lucide-react";

type AdoptionStatus = "adopted" | "in-progress" | "planned";

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
  planned: { label: "Planned", color: "text-white/30", bg: "bg-white/5", border: "border-white/10", icon: Circle },
};

function AdoptionRow({ adoption }: { adoption: Adoption }) {
  const cfg = STATUS_CONFIG[adoption.status];
  const Icon = cfg.icon;
  return (
    <div className="flex gap-3 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.018)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="flex-shrink-0 mt-0.5">
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${cfg.bg} border ${cfg.border}`}>
          <Icon className={`w-2.5 h-2.5 ${cfg.color}`} />
          <span className={`text-[9px] font-mono uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="text-xs font-semibold text-white/80">{adoption.idea}</div>
          <div className="text-[9px] font-mono text-white/20 flex-shrink-0">from {adoption.source}</div>
        </div>
        <div className="text-xs text-white/45 mt-1 leading-relaxed">{adoption.ourVersion}</div>
        <div className="text-[9px] font-mono text-white/20 mt-1.5">{adoption.location}</div>
      </div>
    </div>
  );
}

function LaneSection({ lane }: { lane: Lane }) {
  const [open, setOpen] = useState(false);
  const Icon = lane.icon;
  const adoptedCount = lane.stealThis.filter(a => a.status === "adopted").length;

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
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex gap-1">
            {lane.stealThis.map((a, i) => {
              const cfg = STATUS_CONFIG[a.status];
              const Ic = cfg.icon;
              return <Ic key={i} className={`w-3.5 h-3.5 ${cfg.color}`} />;
            })}
          </div>
          {open ? <ChevronDown className="w-4 h-4 text-white/30" /> : <ChevronRight className="w-4 h-4 text-white/30" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-white/5 p-5 space-y-6">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/25 mb-3">Champions — What They Do Best</div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {lane.champions.map((c, i) => <ChampionCard key={i} champion={c} />)}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/25 mb-3">Steal This, Make It Ours — Adoption Log</div>
            <div className="space-y-2">
              {lane.stealThis.map((a, i) => <AdoptionRow key={i} adoption={a} />)}
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

export function CompetitiveAtlasPage() {
  const totalAdopted = LANES.flatMap(l => l.stealThis).filter(a => a.status === "adopted").length;
  const totalIdeas = LANES.flatMap(l => l.stealThis).length;

  return (
    <div className="min-h-screen p-6 lg:p-8" style={{ background: "#070b12", color: "#c8d8e8" }}>
      <div className="max-w-6xl mx-auto space-y-8">

        <header className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/25">
            <TrendingUp className="w-3 h-3" />
            <span>Internal · Competitive Intelligence</span>
          </div>
          <h1 className="text-3xl font-bold text-white/95 tracking-tight">Competitive Atlas</h1>
          <p className="text-sm text-white/45 max-w-2xl leading-relaxed">
            Per-lane research on global category champions, what they do exceptionally well, what we have adopted and reinterpreted, and what makes each SZL product genuinely one-of-one. Updated April 2026.
          </p>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Lanes Researched", value: LANES.length.toString() },
            { label: "Champions Studied", value: LANES.flatMap(l => l.champions).length.toString() },
            { label: "Ideas Adopted", value: `${totalAdopted}/${totalIdeas}` },
            { label: "One-of-One Theses", value: LANES.length.toString() },
          ].map(m => (
            <div key={m.label} className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-2xl font-bold text-white/90 tabular-nums">{m.value}</div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/30 mt-1">{m.label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {LANES.map(lane => <LaneSection key={lane.id} lane={lane} />)}
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
