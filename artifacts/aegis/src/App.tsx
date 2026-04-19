import { lazy, Suspense, useState, useCallback, useEffect, type ComponentType } from "react";
import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Layers, RotateCcw, GitBranch, Shield, Menu, X, ChevronRight, ChevronDown, Presentation, Play,
  Home as HomeIcon, AlertTriangle, Bug, Search, Crosshair, Network, Eye, Activity, Zap, Radio,
  Brain, FileSearch, Server, Lock, Users, Database, Settings as SettingsIcon, BarChart3, Target,
  ClipboardList, FileText, ListChecks, GitMerge, Cpu, Terminal, Workflow, ShieldCheck,
  TrendingUp, DollarSign, Globe, Hexagon, Boxes, BookOpen, Briefcase, Scale, Ticket, LifeBuoy,
  PieChart, Map, Wrench, Headphones, Receipt, Compass, Sparkles, MessageSquare, FileCode,
  Telescope, Microscope, Beaker, Bot, Layers3, Gauge, Heart, Atom, Filter, FlaskConical,
  Building2, Landmark, Banknote, ShieldAlert, Fingerprint, Camera, Antenna, KeyRound, Swords,
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

import S01Cover from "./pages/slides/S01Cover";
import S02SeriesProblem from "./pages/slides/S02SeriesProblem";
import S03Category from "./pages/slides/S03Category";
import S04Product from "./pages/slides/S04Product";
import S05Demo from "./pages/slides/S05Demo";
import S06Market from "./pages/slides/S06Market";
import S07SeriesDomains from "./pages/slides/S07SeriesDomains";
import S08BusinessModel from "./pages/slides/S08BusinessModel";
import S09Ask from "./pages/slides/S09Ask";

const SLIDES = [S01Cover, S02SeriesProblem, S03Category, S04Product, S05Demo, S06Market, S07SeriesDomains, S08BusinessModel, S09Ask];
const TOTAL = SLIDES.length;

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60000, retry: 1 } },
});

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type LazyComp = ReturnType<typeof lazy>;

type NavItem = {
  path: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  comp: LazyComp;
};

type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

const L = (importer: () => Promise<{ default: ComponentType<unknown> }>): LazyComp => lazy(importer);

const NAV_SECTIONS: NavSection[] = [
  {
    id: "home",
    label: "Home",
    items: [
      { path: "/home", label: "Marketing Home", icon: HomeIcon, comp: L(() => import("./pages/aegis-home")) },
      { path: "/command-home", label: "Command Home", icon: Compass, comp: L(() => import("./pages/command-home")) },
      { path: "/marketing-home", label: "Marketing", icon: Sparkles, comp: L(() => import("./pages/marketing-home")) },
      { path: "/pricing", label: "Pricing", icon: DollarSign, comp: L(() => import("./pages/aegis-pricing")) },
      { path: "/what-changed", label: "What Changed", icon: TrendingUp, comp: L(() => import("./pages/aegis-what-changed")) },
      { path: "/enterprise-demo", label: "Enterprise Demo", icon: Briefcase, comp: L(() => import("./pages/enterprise-demo")) },
      { path: "/pulse", label: "Pulse", icon: Heart, comp: L(() => import("./pages/pulse")) },
    ],
  },
  {
    id: "soc",
    label: "SOC",
    items: [
      { path: "/soc", label: "SOC Dashboard", icon: Shield, comp: L(() => import("./pages/soc-dashboard")) },
      { path: "/agentic-soc", label: "Agentic SOC", icon: Bot, comp: L(() => import("./pages/agentic-soc")) },
      { path: "/alerts", label: "Alerts", icon: AlertTriangle, comp: L(() => import("./pages/alerts-page")) },
      { path: "/incidents", label: "Incidents", icon: Bug, comp: L(() => import("./pages/incidents-page")) },
      { path: "/investigations", label: "Investigations", icon: Search, comp: L(() => import("./pages/investigations-board")) },
      { path: "/cases", label: "Cases", icon: Briefcase, comp: L(() => import("./pages/cases-page")) },
      { path: "/findings", label: "Findings", icon: ListChecks, comp: L(() => import("./pages/findings-page")) },
      { path: "/threat-hunting", label: "Threat Hunting", icon: Crosshair, comp: L(() => import("./pages/threat-hunting")) },
      { path: "/hunt-agents", label: "Hunt Agents", icon: Bot, comp: L(() => import("./pages/hunt-agents")) },
      { path: "/mitre", label: "MITRE ATT&CK", icon: Hexagon, comp: L(() => import("./pages/mitre-attack-page")) },
      { path: "/sentinel", label: "Sentinel", icon: Eye, comp: L(() => import("./pages/sentinel-dashboard")) },
      { path: "/sentinel-behavioral", label: "Sentinel Behavioral", icon: Activity, comp: L(() => import("./pages/sentinel-behavioral")) },
      { path: "/xdr", label: "XDR Console", icon: Network, comp: L(() => import("./pages/xdr-console")) },
      { path: "/xdr-workbench", label: "XDR Workbench", icon: Terminal, comp: L(() => import("./pages/xdr-incident-workbench")) },
      { path: "/soar/builder", label: "SOAR Builder", icon: Workflow, comp: L(() => import("./pages/soar-builder")) },
      { path: "/soar/playbooks", label: "SOAR Playbooks", icon: BookOpen, comp: L(() => import("./pages/soar-playbooks")) },
      { path: "/response", label: "Response Orchestration", icon: Zap, comp: L(() => import("./pages/response-orchestration")) },
      { path: "/action-queue", label: "Action Queue", icon: ListChecks, comp: L(() => import("./pages/action-queue")) },
      { path: "/watchlists", label: "Watchlists", icon: Eye, comp: L(() => import("./pages/watchlists")) },
      { path: "/forensics", label: "Forensics Timeline", icon: Microscope, comp: L(() => import("./pages/forensics-timeline")) },
      { path: "/deception-grid", label: "Deception Grid", icon: Filter, comp: L(() => import("./pages/deception-grid")) },
      { path: "/ot-ics", label: "OT / ICS", icon: Cpu, comp: L(() => import("./pages/ot-ics-dashboard")) },
      { path: "/identity-threat", label: "Identity Threat", icon: Fingerprint, comp: L(() => import("./pages/identity-threat")) },
      { path: "/identity-blast-radius", label: "Identity Blast Radius", icon: ShieldAlert, comp: L(() => import("./pages/identity-blast-radius")) },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    items: [
      { path: "/threat-intelligence", label: "Threat Intelligence", icon: Brain, comp: L(() => import("./pages/threat-intelligence")) },
      { path: "/threat-intel", label: "Threat Intel", icon: Brain, comp: L(() => import("./pages/threat-intel")) },
      { path: "/threat-intel-feed", label: "Intel Feed", icon: Antenna, comp: L(() => import("./pages/threat-intel-feed")) },
      { path: "/threat-graph", label: "Threat Graph", icon: GitMerge, comp: L(() => import("./pages/threat-graph")) },
      { path: "/threat-actor", label: "Threat Actor Profiling", icon: Users, comp: L(() => import("./pages/threat-actor-profiling")) },
      { path: "/threat-desk", label: "Threat Desk", icon: Headphones, comp: L(() => import("./pages/threat-desk")) },
      { path: "/threat-kill-chain", label: "Kill Chain", icon: Swords, comp: L(() => import("./pages/threat-kill-chain")) },
      { path: "/threat-cost", label: "Threat Cost", icon: DollarSign, comp: L(() => import("./pages/threat-cost-translator")) },
      { path: "/threat-sim-report", label: "Sim Report", icon: FileText, comp: L(() => import("./pages/threat-sim-report")) },
      { path: "/predictive", label: "Predictive Intelligence", icon: TrendingUp, comp: L(() => import("./pages/predictive-intelligence")) },
      { path: "/fusion", label: "Fusion Grid", icon: Layers, comp: L(() => import("./pages/intelligence-fusion-grid")) },
      { path: "/business-signal", label: "Business Signal", icon: Radio, comp: L(() => import("./pages/business-signal-intelligence")) },
      { path: "/stix-taxii", label: "STIX/TAXII", icon: Database, comp: L(() => import("./pages/stix-taxii")) },
      { path: "/apt-emulation", label: "APT Emulation", icon: Swords, comp: L(() => import("./pages/apt-emulation")) },
      { path: "/attack-path", label: "Attack Paths", icon: GitBranch, comp: L(() => import("./pages/attack-path-viz")) },
      { path: "/cognitive-attack-path", label: "Cognitive Attack Path", icon: Brain, comp: L(() => import("./pages/cognitive-attack-path")) },
      { path: "/adversary", label: "Adversary Engine", icon: Crosshair, comp: L(() => import("./pages/adversary-engine")) },
      { path: "/adversary-narrative", label: "Narrative Engine", icon: BookOpen, comp: L(() => import("./pages/adversary-narrative-engine")) },
      { path: "/autonomous-threat", label: "Autonomous Threat", icon: Bot, comp: L(() => import("./pages/autonomous-threat-engine")) },
      { path: "/mtd", label: "MTD Engine", icon: Atom, comp: L(() => import("./pages/mtd-engine")) },
      { path: "/tradecraft", label: "Tradecraft Engine", icon: Wrench, comp: L(() => import("./pages/tradecraft-engine")) },
      { path: "/simulation", label: "Simulation Panel", icon: FlaskConical, comp: L(() => import("./pages/simulation-panel")) },
      { path: "/simulation-runner", label: "Simulation Runner", icon: Play, comp: L(() => import("./pages/simulation-runner")) },
      { path: "/scenario-library", label: "Scenario Library", icon: BookOpen, comp: L(() => import("./pages/scenario-library")) },
      { path: "/decision-center", label: "Decision Center", icon: Target, comp: L(() => import("./pages/decision-center")) },
      { path: "/decision-console", label: "Decision Console", icon: Terminal, comp: L(() => import("./pages/decision-console")) },
      { path: "/breach-cost", label: "Breach Cost", icon: DollarSign, comp: L(() => import("./pages/breach-cost-predictor")) },
      { path: "/business-impact", label: "Business Impact", icon: Map, comp: L(() => import("./pages/business-impact-map")) },
      { path: "/cyber-insurance", label: "Cyber Insurance Intel", icon: Banknote, comp: L(() => import("./pages/cyber-insurance-intel")) },
      { path: "/cyber-insurance-score", label: "Insurance Score", icon: Gauge, comp: L(() => import("./pages/cyber-insurance-score")) },
    ],
  },
  {
    id: "labs",
    label: "Labs",
    items: [
      { path: "/intel/dashboard", label: "Intel Dashboard", icon: Brain, comp: L(() => import("./pages/intel/dashboard")) },
      { path: "/intel/agent-autonomy", label: "Agent Autonomy", icon: Bot, comp: L(() => import("./pages/intel/agent-autonomy")) },
      { path: "/intel/agent-spawner", label: "Agent Spawner", icon: Sparkles, comp: L(() => import("./pages/intel/agent-spawner")) },
      { path: "/intel/ai-advisor", label: "AI Advisor", icon: MessageSquare, comp: L(() => import("./pages/intel/ai-advisor")) },
      { path: "/intel/ai-command-center", label: "AI Command Center", icon: Terminal, comp: L(() => import("./pages/intel/ai-command-center")) },
      { path: "/intel/alert-correlation", label: "Alert Correlation", icon: GitMerge, comp: L(() => import("./pages/intel/alert-correlation")) },
      { path: "/intel/alerts-management", label: "Alerts Management", icon: AlertTriangle, comp: L(() => import("./pages/intel/alerts-management")) },
      { path: "/intel/anomaly-timeline", label: "Anomaly Timeline", icon: Activity, comp: L(() => import("./pages/intel/anomaly-timeline")) },
      { path: "/intel/benchmarking", label: "Benchmarking", icon: BarChart3, comp: L(() => import("./pages/intel/benchmarking")) },
      { path: "/intel/confidence-histogram", label: "Confidence Histogram", icon: BarChart3, comp: L(() => import("./pages/intel/confidence-histogram")) },
      { path: "/intel/correlation-analysis", label: "Correlation Analysis", icon: GitMerge, comp: L(() => import("./pages/intel/correlation-analysis")) },
      { path: "/intel/dual-mind-monitor", label: "Dual Mind Monitor", icon: Brain, comp: L(() => import("./pages/intel/dual-mind-monitor")) },
      { path: "/intel/ensemble-studio", label: "Ensemble Studio", icon: Layers3, comp: L(() => import("./pages/intel/ensemble-studio")) },
      { path: "/intel/experiments", label: "Experiments", icon: Beaker, comp: L(() => import("./pages/intel/experiments")) },
      { path: "/intel/gpu-monitoring", label: "GPU Monitoring", icon: Cpu, comp: L(() => import("./pages/intel/gpu-monitoring")) },
      { path: "/intel/insights", label: "Insights", icon: Sparkles, comp: L(() => import("./pages/intel/insights")) },
      { path: "/intel/observability", label: "Intel Observability", icon: Telescope, comp: L(() => import("./pages/intel/intel-observability")) },
      { path: "/intel/llm-evaluation", label: "LLM Evaluation", icon: ClipboardList, comp: L(() => import("./pages/intel/llm-evaluation")) },
      { path: "/intel/model-registry", label: "Model Registry", icon: Database, comp: L(() => import("./pages/intel/model-registry")) },
      { path: "/intel/models", label: "Models", icon: Boxes, comp: L(() => import("./pages/intel/models")) },
      { path: "/intel/neural-explorer", label: "Neural Explorer", icon: Brain, comp: L(() => import("./pages/intel/neural-explorer")) },
      { path: "/intel/prediction-drift", label: "Prediction Drift", icon: TrendingUp, comp: L(() => import("./pages/intel/prediction-drift")) },
      { path: "/intel/predictions", label: "Predictions", icon: Target, comp: L(() => import("./pages/intel/predictions")) },
      { path: "/intel/projects", label: "Projects", icon: Briefcase, comp: L(() => import("./pages/intel/projects")) },
      { path: "/intel/scenario-builder", label: "Scenario Builder", icon: Workflow, comp: L(() => import("./pages/intel/scenario-builder")) },
      { path: "/intel/signal-relay", label: "Signal Relay", icon: Radio, comp: L(() => import("./pages/intel/signal-relay")) },
      { path: "/agent-insights", label: "Agent Insights", icon: Sparkles, comp: L(() => import("./pages/agent-insights")) },
      { path: "/agentops", label: "AgentOps Explorer", icon: Bot, comp: L(() => import("./pages/agentops-explorer")) },
    ],
  },
  {
    id: "compliance",
    label: "Compliance",
    items: [
      { path: "/compliance", label: "Compliance", icon: ShieldCheck, comp: L(() => import("./pages/compliance-page")) },
      { path: "/compliance/evidence", label: "Evidence", icon: FileText, comp: L(() => import("./pages/compliance-evidence")) },
      { path: "/compliance/control-graph", label: "Control Graph", icon: GitMerge, comp: L(() => import("./pages/control-evidence-graph")) },
      { path: "/compliance/audit-chain", label: "Audit Chain", icon: Lock, comp: L(() => import("./pages/audit-chain")) },
      { path: "/compliance/governance-review", label: "Governance Review", icon: Scale, comp: L(() => import("./pages/governance-review")) },
      { path: "/compliance/hardening", label: "Hardening Controls", icon: ShieldCheck, comp: L(() => import("./pages/hardening-controls")) },
      { path: "/compliance/zero-trust", label: "Zero Trust", icon: KeyRound, comp: L(() => import("./pages/zero-trust-scorecard")) },
      { path: "/compliance/vulnerabilities", label: "Vulnerabilities", icon: Bug, comp: L(() => import("./pages/vulnerability-dashboard")) },
      { path: "/compliance/vuln-lifecycle", label: "Vuln Lifecycle", icon: GitBranch, comp: L(() => import("./pages/vuln-lifecycle")) },
      { path: "/compliance/assets", label: "Asset Inventory", icon: Boxes, comp: L(() => import("./pages/asset-inventory")) },
      { path: "/compliance/risk-scoring", label: "Risk Scoring", icon: Gauge, comp: L(() => import("./pages/risk-scoring")) },
      { path: "/compliance/executive-risk", label: "Executive Risk", icon: TrendingUp, comp: L(() => import("./pages/executive-risk")) },
      { path: "/compliance/board-view", label: "Board View", icon: Landmark, comp: L(() => import("./pages/executive-board-view")) },
      { path: "/compliance/ciso", label: "CISO Dashboard", icon: Shield, comp: L(() => import("./pages/ciso-dashboard")) },
      { path: "/compliance/incident-readiness", label: "Incident Readiness", icon: ListChecks, comp: L(() => import("./pages/incident-readiness-view")) },
      { path: "/compliance/incident-proof", label: "Incident Proof", icon: Lock, comp: L(() => import("./pages/incident-proof-chain")) },
      { path: "/compliance/assessment", label: "Assessment", icon: ClipboardList, comp: L(() => import("./pages/assessment-dashboard")) },
      { path: "/compliance/trust-provenance", label: "Trust Provenance", icon: ShieldCheck, comp: L(() => import("./pages/trust-provenance")) },
      { path: "/compliance/risks", label: "Compliance Risks", icon: AlertTriangle, comp: L(() => import("./pages/compliance/compliance-risks")) },
      { path: "/compliance/financial", label: "Financial Compliance", icon: Receipt, comp: L(() => import("./pages/compliance/financial-compliance")) },
      { path: "/compliance/framework-scorecards", label: "Framework Scorecards", icon: BarChart3, comp: L(() => import("./pages/compliance/framework-scorecards")) },
      { path: "/compliance/milestones", label: "Milestones & Trends", icon: TrendingUp, comp: L(() => import("./pages/compliance/milestones-trends")) },
      { path: "/compliance/readiness-ai", label: "Readiness AI Insights", icon: Sparkles, comp: L(() => import("./pages/compliance/readiness-ai-insights")) },
      { path: "/compliance/readiness", label: "Readiness Dashboard", icon: Gauge, comp: L(() => import("./pages/compliance/readiness-dashboard")) },
      { path: "/compliance/vendor-risk", label: "Vendor Risk", icon: Building2, comp: L(() => import("./pages/compliance/vendor-risk")) },
    ],
  },
  {
    id: "ops",
    label: "Operations (MSP)",
    items: [
      { path: "/ops/dashboard", label: "Ops Dashboard", icon: Server, comp: L(() => import("./pages/msp/dashboard")) },
      { path: "/ops/clients", label: "Clients", icon: Users, comp: L(() => import("./pages/msp/clients")) },
      { path: "/ops/contracts", label: "Contracts", icon: FileText, comp: L(() => import("./pages/msp/contracts")) },
      { path: "/ops/devices", label: "Devices", icon: Cpu, comp: L(() => import("./pages/msp/devices")) },
      { path: "/ops/dispatch", label: "Dispatch", icon: Radio, comp: L(() => import("./pages/msp/dispatch")) },
      { path: "/ops/mrr", label: "MRR Dashboard", icon: DollarSign, comp: L(() => import("./pages/msp/mrr-dashboard")) },
      { path: "/ops/noc", label: "NOC", icon: Network, comp: L(() => import("./pages/msp/noc")) },
      { path: "/ops/observability", label: "Ops Observability", icon: Telescope, comp: L(() => import("./pages/msp/ops-observability")) },
      { path: "/ops/provider-settings", label: "Provider Settings", icon: SettingsIcon, comp: L(() => import("./pages/msp/provider-settings")) },
      { path: "/ops/revenue", label: "Revenue", icon: PieChart, comp: L(() => import("./pages/msp/revenue")) },
      { path: "/ops/rmm", label: "RMM Console", icon: Terminal, comp: L(() => import("./pages/msp/rmm-console")) },
      { path: "/ops/service-desk", label: "Service Desk", icon: LifeBuoy, comp: L(() => import("./pages/msp/service-desk")) },
      { path: "/ops/technicians", label: "Technicians", icon: Users, comp: L(() => import("./pages/msp/technicians")) },
      { path: "/ops/tickets", label: "Tickets", icon: Ticket, comp: L(() => import("./pages/msp/tickets")) },
    ],
  },
  {
    id: "nexus",
    label: "Nexus",
    items: [
      { path: "/nexus/analyst-workspace", label: "Analyst Workspace", icon: Terminal, comp: L(() => import("./pages/nexus/analyst-workspace")) },
      { path: "/nexus/cross-domain-correlation", label: "Cross-Domain Correlation", icon: GitMerge, comp: L(() => import("./pages/nexus/cross-domain-correlation")) },
      { path: "/nexus/decision-support", label: "Decision Support", icon: Target, comp: L(() => import("./pages/nexus/decision-support")) },
      { path: "/nexus/early-warning", label: "Early Warning", icon: AlertTriangle, comp: L(() => import("./pages/nexus/early-warning")) },
      { path: "/nexus/executive-briefing", label: "Executive Briefing", icon: FileText, comp: L(() => import("./pages/nexus/executive-briefing")) },
      { path: "/nexus/geopolitical-risk", label: "Geopolitical Risk", icon: Globe, comp: L(() => import("./pages/nexus/geopolitical-risk-scoring")) },
      { path: "/nexus/historical-patterns", label: "Historical Patterns", icon: BookOpen, comp: L(() => import("./pages/nexus/historical-patterns")) },
      { path: "/nexus/osint-pipeline", label: "OSINT Pipeline", icon: Search, comp: L(() => import("./pages/nexus/osint-pipeline")) },
      { path: "/nexus/scenario-wargaming", label: "Scenario Wargaming", icon: Swords, comp: L(() => import("./pages/nexus/scenario-wargaming")) },
      { path: "/nexus/threat-actor-profiling", label: "Actor Profiling", icon: Users, comp: L(() => import("./pages/nexus/threat-actor-profiling")) },
    ],
  },
  {
    id: "governance",
    label: "Governance",
    items: [
      { path: "/governance/agent-config", label: "Agent Config", icon: SettingsIcon, comp: L(() => import("./pages/governance/agent-config")) },
      { path: "/governance/canonical-demo", label: "Canonical Demo", icon: Play, comp: L(() => import("./pages/governance/canonical-demo")) },
      { path: "/governance/enterprise", label: "Enterprise Governance", icon: Building2, comp: L(() => import("./pages/governance/enterprise-governance")) },
      { path: "/governance/executive-reports", label: "Executive Reports", icon: FileText, comp: L(() => import("./pages/governance/executive-reports")) },
      { path: "/governance/incident-analytics", label: "Incident Analytics", icon: BarChart3, comp: L(() => import("./pages/governance/incident-analytics")) },
      { path: "/governance/integration-hub", label: "Integration Hub", icon: Boxes, comp: L(() => import("./pages/governance/integration-hub")) },
      { path: "/governance/operator-analytics", label: "Operator Analytics", icon: BarChart3, comp: L(() => import("./pages/governance/operator-analytics")) },
      { path: "/governance/trust-analytics", label: "Trust Analytics", icon: ShieldCheck, comp: L(() => import("./pages/governance/trust-analytics")) },
      { path: "/governance/trust-positioning", label: "Trust Positioning", icon: Target, comp: L(() => import("./pages/governance/trust-positioning")) },
      { path: "/governed-cockpit", label: "Governed Intelligence", icon: Shield, comp: L(() => import("./pages/governed-cockpit")) },
    ],
  },
  {
    id: "atlas",
    label: "ATLAS Spatial Runtime",
    items: [
      { path: "/atlas-runtime", label: "Threat Mesh", icon: Layers, comp: L(() => import("./pages/atlas-runtime")) },
      { path: "/atlas-runtime/correlation", label: "Worldline Correlation", icon: Network, comp: L(() => import("./pages/atlas-correlation")) },
      { path: "/threat-twin-view", label: "Threat Twin", icon: Shield, comp: L(() => import("./pages/threat-twin-view")) },
      { path: "/replay", label: "Incident Replay", icon: RotateCcw, comp: L(() => import("./pages/replay")) },
      { path: "/scenario-branches", label: "Scenario Branches", icon: GitBranch, comp: L(() => import("./pages/scenario-branches")) },
      { path: "/atlas-execute", label: "ATLAS Execute", icon: Play, comp: L(() => import("./pages/atlas-execute")) },
      { path: "/atlas-artifacts", label: "ATLAS Artifacts", icon: Boxes, comp: L(() => import("./pages/atlas-artifacts")) },
    ],
  },
  {
    id: "exercises",
    label: "Exercises & War Rooms",
    items: [
      { path: "/purple-team", label: "Purple Team", icon: Swords, comp: L(() => import("./pages/purple-team")) },
      { path: "/phantom-purple", label: "Phantom Purple", icon: Swords, comp: L(() => import("./pages/phantom-purple-exercise")) },
      { path: "/phantom-tabletop", label: "Phantom Tabletop", icon: ClipboardList, comp: L(() => import("./pages/phantom-tabletop")) },
      { path: "/phantom-war-room", label: "Phantom War Room", icon: Radio, comp: L(() => import("./pages/phantom-war-room")) },
      { path: "/citadel-war-room", label: "Citadel War Room", icon: Radio, comp: L(() => import("./pages/citadel-war-room")) },
      { path: "/citadel-playbooks", label: "Citadel Playbooks", icon: BookOpen, comp: L(() => import("./pages/citadel-playbooks")) },
      { path: "/citadel-after-action", label: "Citadel After Action", icon: FileText, comp: L(() => import("./pages/citadel-after-action")) },
    ],
  },
  {
    id: "advanced",
    label: "Advanced & Experimental",
    items: [
      { path: "/digital-twin", label: "Digital Twin", icon: Layers3, comp: L(() => import("./pages/digital-twin")) },
      { path: "/consciousness", label: "Consciousness", icon: Brain, comp: L(() => import("./pages/consciousness")) },
      { path: "/constellation", label: "Constellation", icon: Sparkles, comp: L(() => import("./pages/constellation")) },
      { path: "/worldline", label: "Worldline Registry", icon: Database, comp: L(() => import("./pages/worldline-registry")) },
      { path: "/adaptive-defense", label: "Adaptive Defense Shield", icon: Shield, comp: L(() => import("./pages/adaptive-defense-shield")) },
      { path: "/observability", label: "Observability", icon: Telescope, comp: L(() => import("./pages/observability")) },
      { path: "/reports", label: "Reports", icon: FileText, comp: L(() => import("./pages/reports-page")) },
      { path: "/document-engine", label: "Document Engine", icon: FileCode, comp: L(() => import("./pages/document-engine")) },
      { path: "/legal", label: "Legal Workspace", icon: Scale, comp: L(() => import("./pages/legal-workspace")) },
      { path: "/powerbi", label: "PowerBI Report", icon: BarChart3, comp: L(() => import("./pages/powerbi-report")) },
      { path: "/settings", label: "Settings", icon: SettingsIcon, comp: L(() => import("./pages/settings/unified-settings")) },
    ],
  },
];

const ALL_ROUTES: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <div className="w-5 h-5 border-2 border-red-500/40 border-t-red-400 rounded-full animate-spin" />
    </div>
  );
}

function AegisSidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const [location] = useLocation();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const sec of NAV_SECTIONS) {
      map[sec.id] = sec.items.some((i) => i.path === location);
    }
    return map;
  });

  useEffect(() => {
    setOpenSections((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const sec of NAV_SECTIONS) {
        if (sec.items.some((i) => i.path === location) && !next[sec.id]) {
          next[sec.id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [location]);

  const toggle = (id: string) => setOpenSections((s) => ({ ...s, [id]: !s[id] }));

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-[#09060e] border-r border-red-500/10 transition-transform duration-200",
          "lg:translate-x-0 lg:static lg:z-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-2 px-4 py-4 border-b border-red-500/10">
          <div className="w-6 h-6 rounded-md bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-red-100 leading-tight">AEGIS</p>
            <p className="text-[9px] text-red-400/50 leading-tight">SZL Holdings</p>
          </div>
          <button onClick={onClose} className="ml-auto lg:hidden text-red-400/50 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors",
              location === "/"
                ? "bg-red-500/10 text-red-300 border border-red-500/20"
                : "text-red-400/50 hover:text-red-300 hover:bg-red-500/5",
            )}
            onClick={onClose}
          >
            <HomeIcon className="w-3.5 h-3.5" />
            Home
          </Link>
          <Link
            href="/slides"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors",
              location.startsWith("/slides") || location.startsWith("/slide")
                ? "bg-red-500/10 text-red-300 border border-red-500/20"
                : "text-red-400/50 hover:text-red-300 hover:bg-red-500/5",
            )}
            onClick={onClose}
          >
            <Presentation className="w-3.5 h-3.5" />
            Investor Deck
          </Link>

          {NAV_SECTIONS.map((section) => {
            const isOpen = openSections[section.id];
            return (
              <div key={section.id} className="pt-3">
                <button
                  onClick={() => toggle(section.id)}
                  className="w-full flex items-center gap-1 px-3 mb-1 text-[9px] font-bold uppercase tracking-widest text-red-400/40 hover:text-red-300 transition-colors"
                >
                  {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  {section.label}
                </button>
                {isOpen && (
                  <div className="space-y-0.5">
                    {section.items.map(({ path, label, icon: Icon }) => {
                      const isActive = location === path;
                      return (
                        <Link
                          key={path}
                          href={path}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] transition-colors",
                            isActive
                              ? "bg-red-500/10 text-red-300 border border-red-500/20"
                              : "text-red-400/50 hover:text-red-300 hover:bg-red-500/5",
                          )}
                          onClick={onClose}
                        >
                          <Icon className="w-3 h-3 shrink-0" />
                          <span className="truncate">{label}</span>
                          {isActive && <ChevronRight className="w-3 h-3 ml-auto shrink-0" />}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-red-500/10">
          <div className="flex items-center gap-2 px-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-[10px] text-red-400/50 font-mono">AEGIS RUNTIME LIVE</span>
          </div>
        </div>
      </aside>
    </>
  );
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#080510]">
      <AegisSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-red-500/10 bg-[#09060e]/80 backdrop-blur-sm lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-red-400/60 hover:text-red-300">
            <Menu className="w-4 h-4" />
          </button>
          <Shield className="w-4 h-4 text-red-400" />
          <span className="text-sm font-bold text-red-100">AEGIS</span>
        </div>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

function SlideDeck() {
  function getInitialSlide(): number {
    const match = window.location.pathname.match(/slide(?:s\/)?(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n >= 1 && n <= TOTAL) return n;
    }
    return 1;
  }

  const [current, setCurrent] = useState(getInitialSlide);
  const Slide = SLIDES[current - 1];

  const goTo = useCallback((n: number) => {
    const clamped = Math.min(Math.max(n, 1), TOTAL);
    setCurrent(clamped);
    history.replaceState(null, "", `${BASE}/slides/${clamped}`);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        setCurrent((c) => {
          const next = Math.min(c + 1, TOTAL);
          history.replaceState(null, "", `${BASE}/slides/${next}`);
          return next;
        });
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        setCurrent((c) => {
          const prev = Math.max(c - 1, 1);
          history.replaceState(null, "", `${BASE}/slides/${prev}`);
          return prev;
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div
      style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}
      onClick={() => goTo(current + 1)}
    >
      <Slide />
      <div
        style={{
          position: "fixed",
          bottom: "2.5vh",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "0.5vw",
          zIndex: 100,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i + 1)}
            style={{
              width: i + 1 === current ? "2.2vw" : "0.55vw",
              height: "0.35vh",
              minHeight: "3px",
              borderRadius: "2px",
              background: i + 1 === current ? "#0cc8d9" : "rgba(255,255,255,0.18)",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          />
        ))}
      </div>
      <Link
        href="/"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: "2vh",
          left: "2vw",
          fontFamily: "Inter, sans-serif",
          fontSize: "11px",
          color: "rgba(255,255,255,0.4)",
          textDecoration: "none",
          padding: "6px 10px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "6px",
          zIndex: 100,
        }}
      >
        ← Exit deck
      </Link>
      <div
        style={{
          position: "fixed",
          bottom: "2.5vh",
          right: "2.5vw",
          fontFamily: "Inter, sans-serif",
          fontSize: "clamp(9px, 1vw, 13px)",
          color: "rgba(255,255,255,0.18)",
          zIndex: 100,
        }}
      >
        {current} / {TOTAL}
      </div>
    </div>
  );
}

const HomePage = lazy(() => import("./pages/aegis-home"));

function AppRoutes() {
  return (
    <Switch>
      <Route path="/slides">
        <SlideDeck />
      </Route>
      <Route path="/slides/:num">
        <SlideDeck />
      </Route>
      <Route path="/slide:num">
        <SlideDeck />
      </Route>

      {ALL_ROUTES.map(({ path, comp: Comp }) => (
        <Route key={path} path={path}>
          <DashboardLayout>
            <Suspense fallback={<PageLoader />}>
              <Comp />
            </Suspense>
          </DashboardLayout>
        </Route>
      ))}

      <Route path="/">
        <Suspense fallback={<PageLoader />}>
          <HomePage />
        </Suspense>
      </Route>

      <Route>
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center h-full p-10 text-center">
            <Shield className="w-10 h-10 text-red-400/50 mb-4" />
            <h1 className="text-xl font-bold text-red-100 mb-2">Page not found</h1>
            <p className="text-sm text-red-400/60 mb-6">That route isn't wired up yet.</p>
            <Link href="/" className="text-xs text-red-300 hover:text-red-200 underline">
              Return home
            </Link>
          </div>
        </DashboardLayout>
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={BASE}>
        <AppRoutes />
      </WouterRouter>
    </QueryClientProvider>
  );
}
