/**
 * Ventures data — public-facing metric values are sourced from the platform
 * claims registry (@szl-holdings/platform-registry/public-claims) via the local claims
 * adapter (src/lib/claims.ts). Hardcoded values were replaced as part of the
 * April 2026 audit proof-point migration (task-1786).
 *
 * Rules:
 *   - Claims with truthValue !== "verified" must use metricDisplay() so the
 *     [Demo] or [Projected] label is appended automatically.
 *   - Do not add new metric values as bare strings. Add to public-claims.ts
 *     first, then reference via the claims adapter.
 *
 * Audit ref: docs/audit/2026-04/public-claims-registry.md
 */
import {
  LYTE_SIGNAL_DETECTION_TIME,
  LYTE_SIGNALS_PER_DAY,
  LYTE_FALSE_POSITIVE_RATE,
  VESSELS_COUNT,
  VESSELS_DARK_DETECTION_LEAD,
  AEGIS_SIMULATIONS,
  metricDisplay,
} from "../lib/claims";

export type VentureStatus =
  | "Live"
  | "Pilot Ready"
  | "In Build"
  | "Private Demo"
  | "Internal"
  | "Conceptual"
  | "Strategic";

export type VentureCategory =
  | "Command Systems"
  | "Maritime Intelligence"
  | "AI / ML"
  | "Cybersecurity"
  | "Real Estate Tech"
  | "Creative Tech"
  | "Managed Services"
  | "Consulting";

export interface VentureMetric {
  label: string;
  value: string;
  trend?: "up" | "down" | "neutral";
}

export interface VentureMilestone {
  date: string;
  event: string;
  outcome?: string;
}

export interface VentureCaseStudy {
  title: string;
  problem: string;
  solution: string;
  result: string;
}

export interface Venture {
  id: string;
  name: string;
  tagline: string;
  oneLiner: string;
  audience: string;
  category: VentureCategory;
  status: VentureStatus;
  accentColor: string;
  description: string;
  painSolved: string;
  metrics: VentureMetric[];
  milestones: VentureMilestone[];
  caseStudies: VentureCaseStudy[];
  useCases: string[];
  capabilities: string[];
  nextMilestone: string;
  path: string;
  externalPath?: string;
}

export const ventures: Venture[] = [
  {
    id: "lyte",
    name: "Lyte",
    tagline: "Signals → Insights → Actions",
    oneLiner: "Governed decision command layer that converts operational signals into prioritized, traceable, policy-gated decisions.",
    audience: "Executives, ops leaders, and delivery teams in complex service environments.",
    category: "Command Systems",
    status: "Live",
    accentColor: "#f59e0b",
    description:
      "Lyte is the observability layer that enterprises install when dashboards stop being enough. It continuously monitors operational signals across sales pipelines, delivery queues, finance, and team performance — surfacing anomalies, severity-ranked alerts, and root-cause context before issues become crises.",
    painSolved:
      "Executives are drowning in dashboards that show data but don't show problems. Lyte bridges the gap between raw metrics and actionable intelligence, applying severity-ranked signal detection, explainability, and autonomous playbooks that close the loop from observation to resolution.",
    metrics: [
      { label: "Avg. Signal Detection Time", value: metricDisplay(LYTE_SIGNAL_DETECTION_TIME), trend: "up" },
      { label: "False Positive Rate", value: metricDisplay(LYTE_FALSE_POSITIVE_RATE), trend: "up" },
      { label: "Playbooks Available", value: "120+", trend: "up" },
      { label: "Signals Processed / Day", value: metricDisplay(LYTE_SIGNALS_PER_DAY), trend: "up" },
    ],
    milestones: [
      { date: "Q1 2024", event: "Core signal engine launched", outcome: "Detection latency under 4 minutes" },
      { date: "Q3 2024", event: "Explainability framework deployed", outcome: "Human-readable root cause context" },
      { date: "Q1 2025", event: "Autonomous playbook library shipped", outcome: "120+ pre-built resolution paths" },
      { date: "Q4 2025", event: "Executive command view launched", outcome: "Role-based live ops intelligence" },
    ],
    caseStudies: [
      {
        title: "Approval Latency Reduction",
        problem: "A logistics operator had approval queues stalling at 48-72 hours, invisible to leadership.",
        solution: "Lyte flagged the latency anomaly within 6 minutes and surfaced the bottleneck to the ops lead with full context.",
        result: "Approval cycle reduced to 11 hours. Revenue leakage recovered: $340K/quarter.",
      },
      {
        title: "Stalled Deal Detection",
        problem: "Sales pipeline stalls were identified only at week-end reviews — too late to intervene.",
        solution: "Lyte's signal engine detected deal inactivity patterns 8 days earlier than manual review.",
        result: "Pipeline velocity improved 22%. Close rate increased 9 points.",
      },
    ],
    useCases: [
      "Approval latency detection and escalation",
      "Stalled deal and pipeline health monitoring",
      "Revenue leakage identification",
      "Delivery queue anomaly detection",
      "Team performance divergence alerts",
      "Autonomous remediation playbooks",
    ],
    capabilities: [
      "Real-time signal ingestion from 40+ data sources",
      "Severity-ranked alert engine with root cause context",
      "Explainability framework — every alert is human-readable",
      "Role-based views: executive, ops, delivery",
      "Autonomous playbooks with human approval gates",
      "Custom anomaly thresholds per business context",
    ],
    nextMilestone: "AI-native anomaly forecast layer (Q2 2026)",
    path: "/ventures/lyte",
    externalPath: "/command/operations/",
  },
  {
    id: "vessels",
    name: "Vessels",
    tagline: "Maritime Intelligence at Scale",
    oneLiner: "Full-spectrum maritime domain awareness — vessel tracking, sanctions compliance, and route intelligence in one unified command view.",
    audience: "Commodity traders, shipping operators, port authorities, financial institutions with maritime exposure.",
    category: "Maritime Intelligence",
    status: "Live",
    accentColor: "#3b82f6",
    description:
      "Vessels integrates AIS data, satellite imagery, optical sensing, port call records, and sanctions registries into a single intelligence layer. It detects dark vessel activity, flags sanctions exposure, and delivers voyage economics that traditional maritime data providers can't see.",
    painSolved:
      "Maritime oversight was designed for a different era. AIS alone can be spoofed, disabled, or laundered. Vessels applies multi-source signal fusion and behavioral modeling to detect what compliant-looking vessels are actually doing — and what the financial exposure is.",
    metrics: [
      { label: "Vessels Monitored", value: metricDisplay(VESSELS_COUNT), trend: "up" },
      { label: "Shipping Lanes", value: "340+", trend: "neutral" },
      { label: "Dark Vessel Detections (Avg Lead)", value: metricDisplay(VESSELS_DARK_DETECTION_LEAD), trend: "up" },
      { label: "Addressable Market", value: "$15.4B", trend: "up" },
    ],
    milestones: [
      { date: "Q2 2023", event: "AIS ingestion layer live", outcome: "52K vessel baseline tracking" },
      { date: "Q4 2023", event: "Sanctions reconciliation engine deployed" },
      { date: "Q2 2024", event: "Dark vessel behavioral model shipped", outcome: "34-day avg pre-designation detection" },
      { date: "Q1 2025", event: "Voyage economics layer launched", outcome: "Draft-based cargo inference at scale" },
    ],
    caseStudies: [
      {
        title: "Pre-Designation Dark Vessel Detection",
        problem: "A commodity trader needed to identify sanctions exposure before regulatory designation, not after.",
        solution: "Vessels' behavioral fingerprinting detected AIS spoofing and shadow transfer patterns 34 days ahead of formal designation.",
        result: "Client avoided $12M in exposure. Compliance team commended the intelligence lead time.",
      },
      {
        title: "Voyage Economics for Charter Decisions",
        problem: "Charterers were making fixture decisions on incomplete cargo load data.",
        solution: "Vessels' draft inference layer provided cargo weight estimates cross-referenced against manifests.",
        result: "Charter negotiation informed by actual versus declared cargo. Rate variance captured: 8%.",
      },
    ],
    useCases: [
      "Dark vessel and AIS gap detection",
      "Sanctions compliance and risk screening",
      "Voyage economics and cargo load inference",
      "Route deviation and behavioral anomaly alerts",
      "Port call network and fleet routing analysis",
      "Climate routing overlays for charter decisions",
    ],
    capabilities: [
      "Multi-source AIS: terrestrial + satellite reconciliation",
      "Behavioral fingerprinting per vessel across 5-year histories",
      "Hull draft inference via optical and radar satellite",
      "Graph network analysis of port call sequences",
      "Real-time sanctions watchlist integration",
      "Geopolitical risk scoring per lane and vessel",
    ],
    nextMilestone: "Climate risk overlay for charter optimization (Q3 2026)",
    path: "/ventures/vessels",
    externalPath: "/vessels/",
  },
  {
    id: "carlota-jo",
    name: "Carlota Jo",
    tagline: "White-Glove Lifestyle & Estate Services",
    oneLiner: "Discreet, high-trust lifestyle management and estate support for principals who expect the exceptional.",
    audience: "Ultra-high-net-worth individuals, family offices, and principals requiring end-to-end lifestyle infrastructure.",
    category: "Consulting",
    status: "Pilot Ready",
    accentColor: "#d97706",
    description:
      "Carlota Jo is a bespoke lifestyle and estate management service for principals with complex, high-value lives. The practice handles estate coordination, vendor relationships, travel architecture, household operations, and discreet project management — all under one trusted point of contact.",
    painSolved:
      "UHNW individuals don't lack resources — they lack trusted coordination. Household staff, vendors, travel, and project management exist in silos. Carlota Jo consolidates operational command so principals can focus on what matters, without managing the infrastructure of their own lives.",
    metrics: [
      { label: "Client Retention Rate", value: "100%", trend: "neutral" },
      { label: "Active Pilot Clients", value: "8", trend: "up" },
      { label: "Service Domains", value: "12", trend: "neutral" },
      { label: "Avg. Response SLA", value: "< 2 hours", trend: "neutral" },
    ],
    milestones: [
      { date: "Q3 2024", event: "Service architecture defined", outcome: "12-domain framework built" },
      { date: "Q4 2024", event: "Pilot cohort launched", outcome: "8 clients onboarded" },
      { date: "Q1 2025", event: "Estate coordination framework deployed" },
      { date: "Q3 2025", event: "Family office integration protocols built" },
    ],
    caseStudies: [
      {
        title: "Estate Activation for International Principal",
        problem: "A principal relocating between three residences across two continents had no unified coordination layer.",
        solution: "Carlota Jo built a full estate activation plan, coordinating 14 vendors, 6 household staff, and cross-border logistics.",
        result: "Principal described the transition as 'invisible.' Zero coordination gaps across 90-day relocation.",
      },
    ],
    useCases: [
      "Estate and residence management",
      "Household staff coordination and vetting",
      "Bespoke travel architecture",
      "Vendor relationship management",
      "Discreet project management",
      "Family office support integration",
    ],
    capabilities: [
      "Single trusted point of contact for all lifestyle operations",
      "Vetted vendor network across 40+ service categories",
      "Secure digital briefing system for principal preferences",
      "Cross-residence coordination infrastructure",
      "24/7 escalation protocol for urgent needs",
      "Absolute confidentiality and NDA-standard discretion",
    ],
    nextMilestone: "Expanded family office partnership program (Q2 2026)",
    path: "/ventures/carlota-jo",
    externalPath: "/carlota-jo/",
  },
  {
    id: "firestorm",
    name: "Aegis",
    tagline: "Continuous Adversarial Security Simulation",
    oneLiner: "Military-grade cyber range platform enabling continuous red team / blue team exercises at enterprise scale.",
    audience: "Enterprise CISOs, defense contractors, government agencies, and compliance-driven security teams.",
    category: "Cybersecurity",
    status: "Live",
    accentColor: "#ef4444",
    description:
      "Aegis replaces point-in-time penetration testing with continuous adversarial simulation across the full MITRE ATT&CK framework. The platform runs automated campaigns, adapts attack paths based on defensive responses, and delivers real-time security posture scoring with compliance-grade audit trails.",
    painSolved:
      "The annual pen test is a snapshot of a system that no longer exists. Adversaries operate continuously; defenders should too. Aegis makes continuous security validation economically viable by automating the full ATT&CK matrix coverage at machine speed.",
    metrics: [
      { label: "Simulations Executed", value: metricDisplay(AEGIS_SIMULATIONS), trend: "up" },
      { label: "ATT&CK Techniques Covered", value: "200+", trend: "neutral" },
      { label: "Avg Detection Lead Time", value: "vs. annual: +340 days", trend: "up" },
      { label: "Fortune 500 Clients", value: "3", trend: "up" },
    ],
    milestones: [
      { date: "Q1 2023", event: "MITRE ATT&CK automation engine live" },
      { date: "Q3 2023", event: "Adaptive campaign generator deployed", outcome: "RL-based attack path adaptation" },
      { date: "Q1 2024", event: "First Fortune 500 client signed" },
      { date: "Q4 2024", event: "Federal sector expansion program launched" },
    ],
    caseStudies: [
      {
        title: "Continuous vs. Annual: Security Posture Delta",
        problem: "A Fortune 500 CISO couldn't quantify their security posture improvement to the board.",
        solution: "Aegis implemented continuous simulation with quarterly board-ready posture reports.",
        result: "Security posture score improved from 62 to 78 over 2 quarters. Board approved expanded security budget.",
      },
    ],
    useCases: [
      "Continuous red team simulation across full ATT&CK matrix",
      "Adaptive campaign generation (RL-based attack path evolution)",
      "Real-time security posture scoring",
      "Compliance-grade audit trails (PCI, SOC 2, CMMC)",
      "Third-party and supply chain risk assessment",
      "Federal sector security validation",
    ],
    capabilities: [
      "Full MITRE ATT&CK framework coverage (200+ techniques)",
      "Automated campaign orchestration with adaptive path selection",
      "Reinforcement learning attack simulation engine",
      "Real-time detection vs. exploitation telemetry",
      "One-click remediation feedback loop",
      "Compliance posture mapping and audit report generation",
    ],
    nextMilestone: "Federal sector certification and FedRAMP path (Q3 2026)",
    path: "/ventures/aegis",
    externalPath: "/aegis/",
  },
  {
    id: "inca",
    name: "SZL Cortex",
    tagline: "AI Research Command Center",
    oneLiner: "Enterprise-grade LLM evaluation, model governance, and AI research management platform.",
    audience: "AI/ML teams, enterprise AI governance officers, and research organizations deploying models at scale.",
    category: "AI / ML",
    status: "Live",
    accentColor: "#8b5cf6",
    description:
      "SZL Cortex provides the evaluation and governance infrastructure that enterprise AI deployments need. It tests models against proprietary data distributions, detects behavioral drift, tracks experiments, and delivers the model registry and compliance trails that regulated industries require.",
    painSolved:
      "General benchmarks don't tell you how a model performs on your data, in your context, at your risk threshold. SZL Cortex closes the evaluation gap between public benchmarks and operational deployment — and maintains the governance layer that allows enterprises to deploy AI in regulated environments.",
    metrics: [
      { label: "Pilot Clients", value: "12", trend: "up" },
      { label: "Series A Raised", value: "$14M", trend: "neutral" },
      { label: "Data Sources Integrated", value: "45+", trend: "up" },
      { label: "Enterprise Footprint Growth", value: "340% YoY", trend: "up" },
    ],
    milestones: [
      { date: "Q2 2023", event: "Model evaluation framework designed" },
      { date: "Q4 2023", event: "Private alpha launched with 12 pilot clients" },
      { date: "Q1 2025", event: "$14M Series A closed" },
      { date: "Q2 2025", event: "GPU infrastructure expansion initiated" },
    ],
    caseStudies: [
      {
        title: "Domain-Specific Model Validation",
        problem: "An enterprise deploying LLMs for contract analysis found benchmark scores didn't correlate with accuracy on their document types.",
        solution: "SZL Cortex built a custom evaluation suite against their proprietary document corpus and operational edge cases.",
        result: "Model selection improved. Production failure rate dropped 67%.",
      },
    ],
    useCases: [
      "Domain-specific LLM evaluation against proprietary datasets",
      "Behavioral drift detection across model versions",
      "Model experiment tracking and registry",
      "AI governance and compliance trail generation",
      "Ensemble model management",
      "Regulatory AI risk assessment",
    ],
    capabilities: [
      "Custom evaluation harness against any proprietary data distribution",
      "Continuous model drift and behavioral monitoring",
      "Experiment tracking with full reproducibility",
      "Multi-model comparison and ensemble orchestration",
      "Compliance-grade audit trails for regulated industries",
      "GPU-efficient evaluation pipeline (40% vs. baseline)",
    ],
    nextMilestone: "Three new evaluation workflow modules (Q2 2026)",
    path: "/ventures/inca",
    externalPath: "/aegis/intel/dashboard",
  },
  {
    id: "terra",
    name: "Terra",
    tagline: "Operational Signal Intelligence — OBSERVE Layer",
    oneLiner: "Continuous operational decision intelligence detecting KPI movement, value leakage, and market anomalies across enterprise verticals.",
    audience: "Enterprise operators, fund managers, and business intelligence teams managing data-intensive portfolios.",
    category: "Command Systems",
    status: "Live",
    accentColor: "#0ea5e9",
    description:
      "Terra turns Census Bureau, BLS, FEMA, and SEC EDGAR data into continuous business telemetry — detecting KPI drift, market anomalies, and value leakage before they compound. Part of the OBSERVE layer in the SZL intelligence doctrine.",
    painSolved:
      "Enterprise teams are making billion-dollar decisions on fragmented, stale data. Terra consolidates market signals, climate exposure, and portfolio metrics so leadership has complete observability — not a patchwork of reports.",
    metrics: [
      { label: "Enterprise Clients", value: "34", trend: "up" },
      { label: "ARR", value: "$3.1M", trend: "up" },
      { label: "Assets Under Analysis", value: "$4.2B+", trend: "up" },
      { label: "Addressable Market", value: "$29B", trend: "up" },
    ],
    milestones: [
      { date: "Q3 2022", event: "Business intelligence engine launched" },
      { date: "Q2 2023", event: "Climate risk overlay released" },
      { date: "Q1 2024", event: "AI anomaly detection suite launched" },
      { date: "Q4 2024", event: "Institutional partnership program launched" },
    ],
    caseStudies: [
      {
        title: "Portfolio Climate Exposure Audit",
        problem: "An institutional manager needed to assess climate risk across a 140-asset portfolio for a regulatory disclosure.",
        solution: "Lyte ran a full climate overlay across the portfolio in 48 hours — flood, heat, and transition risk scored per asset.",
        result: "Regulatory disclosure completed on schedule. 12 assets flagged for remediation planning.",
      },
    ],
    useCases: [
      "Continuous KPI telemetry and drift detection",
      "Climate risk scoring per asset and portfolio",
      "Market trend and demand signal monitoring",
      "Portfolio performance attribution",
      "Due diligence automation for acquisitions",
      "Fund reporting and regulatory disclosure support",
    ],
    capabilities: [
      "Business telemetry engine across public data sources",
      "Climate risk scoring: flood, heat, transition risk",
      "Real-time market trend signals from 200+ sources",
      "Portfolio-level performance dashboard",
      "Automated due diligence report generation",
      "Integration with ARGUS, Yardi, and major CRE platforms",
    ],
    nextMilestone: "Business Telemetry API public launch (Q4 2026)",
    path: "/ventures/terra",
    externalPath: "/terra/",
  },
  {
    id: "alloy",
    name: "Alloy",
    tagline: "Execution Fabric — ENGINE Layer",
    oneLiner: "The engine powering workflows, scenario modeling, agent coordination, and confidence-scored decision intelligence across the SZL ecosystem.",
    audience: "Enterprise architects, platform teams, and operators deploying automated workflows at scale.",
    category: "Command Systems",
    status: "Live",
    accentColor: "#6366f1",
    description:
      "Alloy is the execution fabric of the SZL platform — orchestrating connectors, DAGs, automations, and the predictive intelligence layer into a unified engine. It is not a product sold standalone; it is the platform backbone that Lyte, Vessels, and every SZL subsidiary runs on.",
    painSolved:
      "Enterprise workflows break at integration points. Alloy eliminates the gap between observation and execution by providing a single orchestration layer with confidence-scored scenario modeling, agent coordination, and automated decision pathways.",
    metrics: [
      { label: "Prediction Models Deployed", value: "12,400+", trend: "up" },
      { label: "Automations Executed / Day", value: "48K+", trend: "up" },
      { label: "ARR (Embedded)", value: "$5.1M", trend: "up" },
      { label: "Avg Execution Latency", value: "< 200ms", trend: "up" },
    ],
    milestones: [
      { date: "Q4 2022", event: "Prediction engine launched" },
      { date: "Q2 2023", event: "Confidence scoring module released" },
      { date: "Q1 2024", event: "Agent coordination layer shipped" },
      { date: "Q3 2024", event: "Predictive intelligence unified into Alloy — full engine convergence" },
    ],
    caseStudies: [
      {
        title: "Supply Chain Disruption Modeling at Scale",
        problem: "A logistics operator needed to evaluate 200+ supply chain scenarios across a complex network in real time.",
        solution: "Alloy's predictive engine modeled each scenario with confidence bounds, assumption tracking, and automated sensitivity analysis.",
        result: "Decision time dropped from 3 weeks to 4 days. Confidence in selected path: 94%.",
      },
    ],
    useCases: [
      "Scenario modeling and what-if analysis",
      "Confidence-scored prediction outputs",
      "Agent workflow orchestration and DAG execution",
      "Cross-ecosystem connector management",
      "Automated decision pathway routing",
      "Platform-layer observability and telemetry",
    ],
    capabilities: [
      "Generative prediction suite: scenario, forecast, sensitivity",
      "Confidence scoring with uncertainty quantification",
      "Multi-agent coordination and policy enforcement",
      "DAG execution engine with retry and escalation",
      "Performance attribution per model variant",
      "Integration with SZL Cortex, Aegis, Lyte, and Vessels",
    ],
    nextMilestone: "Alloy Scenario Model Library public launch (Q2 2026)",
    path: "/ventures/alloy",
    externalPath: "/alloy/",
  },
  {
    id: "msp",
    name: "Aegis Operations",
    tagline: "Managed Services Command — OBSERVE Layer",
    oneLiner: "Evidence-backed incident command delivering threat detection, anomaly visibility, and MSP-grade operational intelligence.",
    audience: "MSPs, enterprise IT operators, and security teams managing multi-tenant threat environments.",
    category: "Managed Services",
    status: "Live",
    accentColor: "#ef4444",
    description:
      "Aegis Operations delivers the OBSERVE layer for threat and incident intelligence — combining endpoint monitoring, NOC operations, and FedRAMP-grade security telemetry into a unified command center. Evidence-backed incident command at enterprise scale.",
    painSolved:
      "Security and IT teams operate on stacks of disconnected tools: RMM, PSA, ticketing, billing, and reporting all live separately. Aegis Operations consolidates the operational layer so teams can scale clients without scaling headcount.",
    metrics: [
      { label: "Managed Client Environments", value: "240+", trend: "up" },
      { label: "SLA Compliance Rate", value: "99.2%", trend: "neutral" },
      { label: "Avg Ticket Resolution", value: "< 2 hours", trend: "up" },
      { label: "NOC Uptime", value: "99.97%", trend: "neutral" },
    ],
    milestones: [
      { date: "Q1 2022", event: "Core MSP platform launched" },
      { date: "Q3 2022", event: "NOC integration module released" },
      { date: "Q1 2023", event: "Billing and contract automation deployed" },
      { date: "Q3 2023", event: "AI-assisted ticket triage launched" },
    ],
    caseStudies: [
      {
        title: "Incident Command at MSP Scale Without Headcount Growth",
        problem: "An MSP managing 80 client environments was growing client count but couldn't scale service quality without hiring.",
        solution: "Aegis Operations consolidated 6 tools into one, with AI-assisted incident triage reducing L1 ticket volume by 34%.",
        result: "Client base grew from 80 to 140 environments. Team headcount unchanged. SLA compliance improved.",
      },
    ],
    useCases: [
      "Multi-tenant client environment management",
      "NOC monitoring and alerting",
      "Service desk and ticket workflow",
      "Contract and billing automation",
      "Security and patch management",
      "Performance reporting and SLA tracking",
    ],
    capabilities: [
      "Unified client management across unlimited environments",
      "24/7 NOC integration with AI-assisted triage",
      "PSA-grade ticketing with SLA enforcement",
      "Automated billing and contract lifecycle",
      "Patch management and compliance tracking",
      "Executive reporting suite per client",
    ],
    nextMilestone: "Lyte integration for AIOps signal-to-ticket automation (Q3 2026)",
    path: "/ventures/msp",
    externalPath: "/aegis/ops/dashboard",
  },
];

export function getVentureById(id: string): Venture | undefined {
  return ventures.find((v) => v.id === id);
}

export function getVenturesByCategory(category: VentureCategory | "All"): Venture[] {
  if (category === "All") return ventures;
  return ventures.filter((v) => v.category === category);
}

export function getVenturesByStatus(status: VentureStatus | "All"): Venture[] {
  if (status === "All") return ventures;
  return ventures.filter((v) => v.status === status);
}

export const STATUS_STYLES: Record<VentureStatus, { bg: string; text: string; dot: string; border: string }> = {
  Live: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-200",
  },
  "Pilot Ready": {
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    border: "border-blue-200",
  },
  "In Build": {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    border: "border-amber-200",
  },
  "Private Demo": {
    bg: "bg-violet-50",
    text: "text-violet-700",
    dot: "bg-violet-500",
    border: "border-violet-200",
  },
  Internal: {
    bg: "bg-slate-50",
    text: "text-slate-600",
    dot: "bg-slate-400",
    border: "border-slate-200",
  },
  Conceptual: {
    bg: "bg-gray-50",
    text: "text-gray-500",
    dot: "bg-gray-400",
    border: "border-gray-200",
  },
  Strategic: {
    bg: "bg-zinc-50",
    text: "text-zinc-600",
    dot: "bg-zinc-400",
    border: "border-zinc-200",
  },
};
