import { lazy, Suspense, useState, useEffect, useCallback } from "react";
const AegisPulse = lazy(() => import("@/pages/pulse"));
const ConsciousnessPage = lazy(() => import("@/pages/consciousness"));
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { EcosystemNav } from "@szl-holdings/shared-ui/ecosystem-nav";
import { DemoModeProvider, useRealtimeChannel, RealtimeStatusIndicator, OnboardingWizard, GettingStartedChecklist, useOnboardingState, type OnboardingConfig, SandboxModeProvider, SandboxModeBanner, AnalyticsProvider, SyncStatusBadge, useWebSyncStatus } from "@szl-holdings/shared-ui";
import { IndexedDBAdapter, CommandQueue, ConflictResolver } from "@szl-holdings/offline-engine";
import { McpOverlay } from "@szl-holdings/mcp-client";
import { PrismBusProvider } from "@szl-holdings/prism-bus";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { persistQueryClient } from "@tanstack/query-persist-client-core";
import { Toaster } from "@szl-holdings/shared-ui/ui/sonner";
import { UserButton } from "@szl-holdings/shared-ui/UserButton";
import { useAuth } from "@szl-holdings/replit-auth-web";
import { RoleGate } from "@szl-holdings/shared-ui";
import {
  Shield, Target, BarChart3, FileText, Activity, AlertTriangle, Bell, Grid3X3,
  ClipboardCheck, Search, Rss, Layers, Users, ShieldCheck,
  Building2, TrendingUp, Brain as BrainIcon, Package, Bug, SlidersHorizontal,
  Play, LayoutDashboard, Ticket, Monitor, DollarSign, Wrench, Server,
  FlaskConical, Cpu, Cpu as CpuIcon, Network, Radio, Plus, Sun, Eye,
  Database, Trophy, Boxes, GitBranch, Link2, Flame, Menu, X, ChevronDown,
  Hexagon, Zap, Briefcase, Globe, Sparkles, Crosshair, Scale, Settings, Clock,
  FileSearch
} from "lucide-react";
import { AgentCopilot } from "@szl-holdings/shared-ui/copilot";
import { sentinelConfig } from "@szl-holdings/shared-ui/copilot-configs";
import { cn } from "@szl-holdings/shared-ui/utils";
import { toAlpha } from "@szl-holdings/shared-ui/utils";
import { CommandPalette, useCommandPalette, getEcosystemSwitchCommands, createBaselineWebActions, type CommandItem } from "@szl-holdings/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@szl-holdings/shared-ui/keyboard-shortcuts";
import { PackBanner } from "@szl-holdings/shared-ui";
import { LANE_ACCENT_HEX } from "@szl-holdings/shared-ui/lane-colors";
import { SidebarNav, type SidebarNavSection, DashboardShell as SharedDashboardShell } from "@szl-holdings/shared-ui/design-system";
import { StaleIndicator } from "@szl-holdings/shared-ui/stale-indicator";
import { ExecutiveSafeModeContext } from "./lib/executive-safe-mode-context";

const AEGIS_ACCENT = LANE_ACCENT_HEX.aegis.primary;

const _aegisStorage = new IndexedDBAdapter({ dbName: "szl-aegis-offline" });
const _aegisConflictResolver = new ConflictResolver({ storage: _aegisStorage });
const _aegisQueue = new CommandQueue({ storage: _aegisStorage, conflictResolver: _aegisConflictResolver });

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

export async function aegisEnqueueMutation(params: {
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
  type?: string;
  priority?: "critical" | "high" | "normal" | "low";
}): Promise<void> {
  await _aegisQueue.enqueue({
    domain: "aegis",
    type: params.type ?? "mutation",
    method: params.method,
    url: `${API_BASE}${params.path}`,
    body: params.body,
    maxRetries: 5,
    priority: params.priority ?? "normal",
  });
}

export async function aegisReplayQueue(token: string | null): Promise<{ replayed: number; failed: number; conflicts: number }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return _aegisQueue.replay(async () => headers, "aegis");
}

// ─── Legal Workspace (PRISM Counsel merged into Aegis) ────────────────────────
const LegalWorkspacePage = lazy(() => import("@/pages/legal-workspace"));

// ─── Security Operations pages ───────────────────────────────────────────────
const AegisAtlasArtifactsPage = lazy(() => import("@/pages/atlas-artifacts"));
const AegisAtlasRuntime = lazy(() => import("@/pages/atlas-runtime"));
const AegisReplay = lazy(() => import("@/pages/replay"));
const AegisScenarioBranches = lazy(() => import("@/pages/scenario-branches"));
const AegisMarketingHome = lazy(() => import("@/pages/aegis-home"));
const AegisPricingPage = lazy(() => import("@/pages/aegis-pricing"));
const EnterpriseDemo = lazy(() => import("@/pages/enterprise-demo"));
const SOCDashboard = lazy(() => import("@/pages/soc-dashboard"));
const ThreatIntelligence = lazy(() => import("@/pages/threat-intelligence"));
const ThreatIntelFeed = lazy(() => import("@/pages/threat-intel-feed"));
const IncidentsPage = lazy(() => import("@/pages/incidents-page"));
const FindingsPage = lazy(() => import("@/pages/findings-page"));
const MitreAttackPage = lazy(() => import("@/pages/mitre-attack-page"));
const CompliancePage = lazy(() => import("@/pages/compliance-page"));
const AlertsPage = lazy(() => import("@/pages/alerts-page"));
const RiskScoringPage = lazy(() => import("@/pages/risk-scoring"));
const ReportsPage = lazy(() => import("@/pages/reports-page"));
const ObservabilityPage = lazy(() => import("@/pages/observability"));
const SentinelDashboard = lazy(() => import("@/pages/sentinel-dashboard"));
const Watchlists = lazy(() => import("@/pages/watchlists"));
const ForensicsTimeline = lazy(() => import("@/pages/forensics-timeline"));
const XDRConsole = lazy(() => import("@/pages/xdr-console"));
const XDRIncidentWorkbench = lazy(() => import("@/pages/xdr-incident-workbench"));
const ThreatGraph = lazy(() => import("@/pages/threat-graph"));
const ThreatHunting = lazy(() => import("@/pages/threat-hunting"));
const ThreatKillChain = lazy(() => import("@/pages/threat-kill-chain"));
const IdentityThreat = lazy(() => import("@/pages/identity-threat"));
const ExecutiveRisk = lazy(() => import("@/pages/executive-risk"));
const SacsayhuamanShield = lazy(() => import("@/pages/sacsayhuaman-shield"));
const AdversaryEmulation = lazy(() => import("@/pages/simulation-runner"));
const AgentInsightsPage = lazy(() => import("@/pages/agent-insights"));
const AgentOpsExplorerPage = lazy(() => import("@/pages/agentops-explorer"));
const AssetInventoryPage = lazy(() => import("@/pages/asset-inventory"));
const VulnerabilityDashboard = lazy(() => import("@/pages/vulnerability-dashboard"));
const HardeningControlsPage = lazy(() => import("@/pages/hardening-controls"));
const CasesPage = lazy(() => import("@/pages/cases-page"));
const SimulationPanelPage = lazy(() => import("@/pages/simulation-panel"));
const PowerBiReport = lazy(() => import("@/pages/powerbi-report"));
const DocumentEngine = lazy(() => import("@/pages/document-engine"));
const ReadinessDashboard = lazy(() => import("@/pages/compliance/readiness-dashboard"));
const FrameworkScorecards = lazy(() => import("@/pages/compliance/framework-scorecards"));
const ComplianceRisks = lazy(() => import("@/pages/compliance/compliance-risks"));
const VendorRisk = lazy(() => import("@/pages/compliance/vendor-risk"));
const MilestonesTrends = lazy(() => import("@/pages/compliance/milestones-trends"));
const ReadinessAIInsights = lazy(() => import("@/pages/compliance/readiness-ai-insights"));
const FinancialCompliancePage = lazy(() => import("@/pages/compliance/financial-compliance"));
const SoarPlaybooks = lazy(() => import("@/pages/soar-playbooks"));
const StixTaxii = lazy(() => import("@/pages/stix-taxii"));
const TradecraftEnginePage = lazy(() => import("@/pages/tradecraft-engine"));
const AuditChainPage = lazy(() => import("@/pages/audit-chain"));
const TrustProvenancePage = lazy(() => import("@/pages/trust-provenance"));

// ─── CITADEL Crisis Command ───────────────────────────────────────────────────
const CitadelWarRoom = lazy(() => import("@/pages/citadel-war-room"));
const CitadelPlaybooks = lazy(() => import("@/pages/citadel-playbooks"));
const CitadelAfterAction = lazy(() => import("@/pages/citadel-after-action"));

// ─── Command Surfaces (Phase 1) ───────────────────────────────────────────────
const CommandHome = lazy(() => import("@/pages/command-home"));
const InvestigationsBoard = lazy(() => import("@/pages/investigations-board"));
const DecisionConsole = lazy(() => import("@/pages/decision-console"));
const ResponseOrchestration = lazy(() => import("@/pages/response-orchestration"));
const ExecutiveBoardView = lazy(() => import("@/pages/executive-board-view"));

// ─── Governance & Orchestration (Phase 3) ────────────────────────────────────
const OperatorAnalytics = lazy(() => import("@/pages/governance/operator-analytics"));
const AgentConfigPage = lazy(() => import("@/pages/governance/agent-config"));
const IncidentAnalytics = lazy(() => import("@/pages/governance/incident-analytics"));
const TrustAnalytics = lazy(() => import("@/pages/governance/trust-analytics"));
const EnterpriseGovernance = lazy(() => import("@/pages/governance/enterprise-governance"));
const ExecutiveReports = lazy(() => import("@/pages/governance/executive-reports"));
const IntegrationHub = lazy(() => import("@/pages/governance/integration-hub"));
const CanonicalDemo = lazy(() => import("@/pages/governance/canonical-demo"));
const TrustPositioning = lazy(() => import("@/pages/governance/trust-positioning"));

// ─── Managed Operations pages (Aegis Operations/MSP) ─────────────────────────
const MspDashboard = lazy(() => import("@/pages/msp/dashboard"));
const MspClients = lazy(() => import("@/pages/msp/clients"));
const MspTickets = lazy(() => import("@/pages/msp/tickets"));
const MspDevices = lazy(() => import("@/pages/msp/devices"));
const MspContracts = lazy(() => import("@/pages/msp/contracts"));
const MspNOC = lazy(() => import("@/pages/msp/noc"));
const MspRevenue = lazy(() => import("@/pages/msp/revenue"));
const MspTechnicians = lazy(() => import("@/pages/msp/technicians"));
const MspDispatch = lazy(() => import("@/pages/msp/dispatch"));
const MspRMM = lazy(() => import("@/pages/msp/rmm-console"));
const MspMRR = lazy(() => import("@/pages/msp/mrr-dashboard"));
const MspServiceDesk = lazy(() => import("@/pages/msp/service-desk"));
const MspProviderSettings = lazy(() => import("@/pages/msp/provider-settings"));
const AegisUnifiedSettings = lazy(() => import("@/pages/settings/unified-settings"));

// ─── Intelligence Engine pages (from INCA) ────────────────────────────────────
const IntelDashboard = lazy(() => import("@/pages/intel/dashboard"));
const QuipuCommand = lazy(() => import("@/pages/intel/quipu-command"));
const ChasquiRelay = lazy(() => import("@/pages/intel/chasqui-relay"));
const DualMindMonitor = lazy(() => import("@/pages/intel/dual-mind-monitor"));
const WillaqUmu = lazy(() => import("@/pages/intel/willaq-umu"));
const AgentAutonomyDashboard = lazy(() => import("@/pages/intel/agent-autonomy"));
const Models = lazy(() => import("@/pages/intel/models"));
const Predictions = lazy(() => import("@/pages/intel/predictions"));
const IntelProjects = lazy(() => import("@/pages/intel/projects"));
const IntelInsights = lazy(() => import("@/pages/intel/insights"));

const BreachCostPredictor = lazy(() => import("@/pages/breach-cost-predictor"));
const PurpleTeam = lazy(() => import("@/pages/purple-team"));
const APTEmulationPage = lazy(() => import("@/pages/apt-emulation"));

// ─── PHANTOM & SENTINEL (Task 566) ───────────────────────────────────────────
const PhantomWarRoom = lazy(() => import("@/pages/phantom-war-room"));
const PhantomPurpleExercise = lazy(() => import("@/pages/phantom-purple-exercise"));
const PhantomTabletop = lazy(() => import("@/pages/phantom-tabletop"));
const SentinelBehavioral = lazy(() => import("@/pages/sentinel-behavioral"));
const ThreatSimReport = lazy(() => import("@/pages/threat-sim-report"));
const ZeroTrustScorecard = lazy(() => import("@/pages/zero-trust-scorecard"));
const CyberInsuranceScore = lazy(() => import("@/pages/cyber-insurance-score"));
const AttackPathViz = lazy(() => import("@/pages/attack-path-viz"));
const ThreatActorProfiling = lazy(() => import("@/pages/threat-actor-profiling"));

const ThreatDesk = lazy(() => import("@/pages/threat-desk"));
const AegisWhatChanged = lazy(() => import("@/pages/aegis-what-changed"));
const ThreatCostTranslator = lazy(() => import("@/pages/threat-cost-translator"));
const ActionQueue = lazy(() => import("@/pages/action-queue"));
const IncidentReadinessView = lazy(() => import("@/pages/incident-readiness-view"));
const GovernanceReview = lazy(() => import("@/pages/governance-review"));

// ─── Living Intelligence Platform (new) ──────────────────────────────────────
const AutonomousThreatEngine = lazy(() => import("@/pages/autonomous-threat-engine"));
const IntelligenceFusionGrid = lazy(() => import("@/pages/intelligence-fusion-grid"));
const AegisBusinessSignalIntelligence = lazy(() => import("@/pages/business-signal-intelligence"));
const AegisPredictiveIntelligence = lazy(() => import("@/pages/predictive-intelligence"));

// ─── Agentic SOC & Autonomous Cyber Defense (Task 521) ───────────────────────
const AgenticSOC = lazy(() => import("@/pages/agentic-soc"));
const DeceptionGrid = lazy(() => import("@/pages/deception-grid"));
const MTDEngine = lazy(() => import("@/pages/mtd-engine"));
const DigitalTwin = lazy(() => import("@/pages/digital-twin"));
const HuntAgents = lazy(() => import("@/pages/hunt-agents"));
const ComplianceEvidence = lazy(() => import("@/pages/compliance-evidence"));
const VulnLifecycle = lazy(() => import("@/pages/vuln-lifecycle"));
const CyberInsuranceIntel = lazy(() => import("@/pages/cyber-insurance-intel"));
const SOARBuilder = lazy(() => import("@/pages/soar-builder"));
const AdversaryEngine = lazy(() => import("@/pages/adversary-engine"));

// ─── Nexus — Geopolitical AI Fusion & Predictive War-Gaming ──────────────────
const NexusCrossDomainCorrelation = lazy(() => import("@/pages/nexus/cross-domain-correlation"));
const NexusScenarioWargaming = lazy(() => import("@/pages/nexus/scenario-wargaming"));
const NexusExecutiveBriefing = lazy(() => import("@/pages/nexus/executive-briefing"));
const NexusGeopoliticalRiskScoring = lazy(() => import("@/pages/nexus/geopolitical-risk-scoring"));
const NexusOsintPipeline = lazy(() => import("@/pages/nexus/osint-pipeline"));
const NexusThreatActorProfiling = lazy(() => import("@/pages/nexus/threat-actor-profiling"));
const NexusEarlyWarning = lazy(() => import("@/pages/nexus/early-warning"));
const NexusDecisionSupport = lazy(() => import("@/pages/nexus/decision-support"));
const NexusAnalystWorkspace = lazy(() => import("@/pages/nexus/analyst-workspace"));
const NexusHistoricalPatterns = lazy(() => import("@/pages/nexus/historical-patterns"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60000,
      retry: (failureCount, error) => {
        const status = (error as { status?: number })?.status;
        if (status === 401 || status === 403) return false;
        return failureCount < 1;
      },
    },
  },
});

if (typeof window !== "undefined") {
  persistQueryClient({
    queryClient,
    persister: createSyncStoragePersister({ storage: window.localStorage, key: "aegis-web-rq-cache" }),
    maxAge: 1000 * 60 * 60,
    buster: "v1",
  });
}

// ─── Navigation definitions ───────────────────────────────────────────────────

const commandSurfacesNav = [
  { path: "/command-home", label: "Command Home", icon: LayoutDashboard },
  { path: "/investigations", label: "Investigations Board", icon: Search },
  { path: "/decision-console", label: "Decision Console", icon: ClipboardCheck },
  { path: "/response-orchestration", label: "Response Orchestration", icon: Zap },
  { path: "/executive-board", label: "Executive / Board View", icon: BarChart3 },
];

const citadelNav = [
  { path: "/citadel", label: "Incident Command", icon: Flame },
  { path: "/citadel/playbooks", label: "Crisis Playbooks", icon: Play },
  { path: "/citadel/after-action", label: "After-Action Report", icon: FileText },
];

const governanceNavItems = [
  { path: "/gov/operator-analytics", label: "Operator Analytics", icon: Activity },
  { path: "/gov/incident-analytics", label: "Incident Analytics", icon: BarChart3 },
  { path: "/gov/trust-analytics", label: "Trust Analytics", icon: Shield },
  { path: "/gov/governance", label: "Enterprise Governance", icon: Building2 },
  { path: "/gov/executive-reports", label: "Executive Reports", icon: FileText },
  { path: "/gov/integrations", label: "Integration Hub", icon: Globe },
  { path: "/gov/canonical-demo", label: "Canonical Demo", icon: Play },
  { path: "/gov/trust", label: "Trust & Security", icon: ShieldCheck },
  { path: "/trust-provenance", label: "Trust & Provenance Center", icon: FileSearch },
];

const securityNavPrimary = [
  { path: "/soc", label: "SOC Overview", icon: Activity },
  { path: "/sacsayhuaman-shield", label: "Adaptive Defense", icon: ShieldCheck },
  { path: "/incidents", label: "Incidents", icon: Shield },
  { path: "/alerts", label: "Alerts", icon: Bell },
  { path: "/cases", label: "Case Management", icon: Briefcase },
  { path: "/asset-inventory", label: "Asset Inventory", icon: Package },
  { path: "/vulnerabilities", label: "Vulnerabilities", icon: Bug },
  { path: "/mitre-attack", label: "MITRE ATT&CK", icon: Grid3X3 },
  { path: "/threat-intel", label: "Threat Intel", icon: AlertTriangle },
  { path: "/findings", label: "Findings", icon: Target },
  { path: "/simulation-panel", label: "Simulation Panel", icon: Play },
  { path: "/hardening-controls", label: "Hardening Controls", icon: SlidersHorizontal },
  { path: "/document-engine", label: "Document Engine", icon: FileText },
];

const phantomSentinelNav = [
  { path: "/phantom/war-room", label: "Simulation Center", icon: Crosshair },
  { path: "/phantom/purple-exercise", label: "Security Exercise", icon: Shield },
  { path: "/phantom/tabletop", label: "Executive Tabletop", icon: FileText },
  { path: "/sentinel/behavioral", label: "Behavioral Analytics", icon: Eye },
  { path: "/threat-sim-report", label: "Simulation Reports", icon: FileText },
];

const agenticDefenseNav = [
  { path: "/agentic-soc", label: "Agentic SOC", icon: BrainIcon },
  { path: "/deception-grid", label: "Threat Decoys", icon: Eye },
  { path: "/mtd-engine", label: "Moving Target Defense", icon: Zap },
  { path: "/digital-twin", label: "Cyber Digital Twin", icon: Layers },
  { path: "/hunt-agents", label: "Threat Hunters", icon: Search },
  { path: "/compliance-evidence", label: "Compliance Evidence", icon: ClipboardCheck },
  { path: "/vuln-lifecycle", label: "Vuln Lifecycle", icon: Bug },
  { path: "/cyber-insurance-intel", label: "Cyber Insurance Intel", icon: DollarSign },
  { path: "/soar-builder", label: "SOAR Builder", icon: Zap },
  { path: "/adversary-engine", label: "Adversary Emulation Engine", icon: Target },
];

const securityNavSecondary = [
  { path: "/xdr-workbench", label: "Incident Workbench", icon: Zap },
  { path: "/threat-graph", label: "Threat Graph", icon: Network },
  { path: "/xdr-console", label: "XDR Console", icon: Layers },
  { path: "/threat-kill-chain", label: "Kill Chain Analysis", icon: Target },
  { path: "/threat-hunting", label: "Threat Hunting", icon: Search },
  { path: "/identity-threat", label: "Identity Threats", icon: Users },
  { path: "/forensics", label: "Forensics", icon: Flame },
  { path: "/executive-risk", label: "Executive Risk", icon: BarChart3 },
  { path: "/risk-scoring", label: "Risk Scoring", icon: BarChart3 },
  { path: "/threat-feed", label: "Threat Feed", icon: Rss },
  { path: "/reports", label: "Reports", icon: FileText },
  { path: "/powerbi", label: "Power BI Analytics", icon: BarChart3 },
  { path: "/sentinel", label: "Sentinel Watch", icon: Search },
  { path: "/watchlists", label: "Watchlists", icon: Target },
  { path: "/soar-playbooks", label: "SOAR Playbooks", icon: Zap },
  { path: "/stix-taxii", label: "STIX/TAXII Intel", icon: Link2 },
  { path: "/tradecraft", label: "Tradecraft Engine", icon: BrainIcon },
  { path: "/observability", label: "Observability", icon: Activity },
  { path: "/adversary-emulation", label: "Red Team Exercises", icon: Target },
  { path: "/breach-cost", label: "Breach Cost Predictor", icon: DollarSign },
  { path: "/purple-team", label: "Purple Team Simulation", icon: Crosshair },
  { path: "/apt-emulation", label: "APT Adversary Emulation", icon: Target },
  { path: "/zero-trust-scorecard", label: "NSA Zero Trust Scorecard", icon: ShieldCheck },
  { path: "/cyber-insurance", label: "Cyber Insurance Score", icon: ShieldCheck },
  { path: "/attack-path", label: "Attack Path Visualization", icon: Network },
  { path: "/threat-actors", label: "Threat Actor Profiling", icon: Users },
];

const livingIntelNav = [
  { path: "/autonomous-threat-engine", label: "Autonomous Threat Engine", icon: BrainIcon },
  { path: "/intelligence-fusion-grid", label: "Intelligence Fusion Grid", icon: Layers },
  { path: "/business-signal-intelligence", label: "Business Signal Intel", icon: DollarSign },
  { path: "/predictive-intelligence", label: "Predictive Intelligence", icon: TrendingUp },
  { path: "/threat-cost-translator", label: "Threat Cost Translator", icon: DollarSign },
];

const complianceNavItems = [
  { path: "/cr/dashboard", label: "Readiness Index", icon: ShieldCheck },
  { path: "/cr/scorecards", label: "Framework Scorecards", icon: ClipboardCheck },
  { path: "/cr/risks", label: "Risk Register", icon: AlertTriangle },
  { path: "/cr/vendor-risk", label: "Vendor Risk", icon: Building2 },
  { path: "/cr/milestones", label: "Milestones & Trends", icon: TrendingUp },
  { path: "/cr/ai-insights", label: "AI Insights", icon: Target },
  { path: "/cr/financial-compliance", label: "SEC/FINRA Compliance", icon: Scale },
];

const opsNavItems = [
  { path: "/ops/dashboard", label: "Ops Dashboard", icon: LayoutDashboard },
  { path: "/ops/noc", label: "NOC Operations", icon: Activity },
  { path: "/ops/clients", label: "Client Accounts", icon: Building2 },
  { path: "/ops/contracts", label: "Contracts & SLAs", icon: FileText },
  { path: "/ops/tickets", label: "Ticket Queue", icon: Ticket },
  { path: "/ops/service-desk", label: "Service Desk", icon: Ticket },
  { path: "/ops/devices", label: "Device Inventory", icon: Monitor },
  { path: "/ops/dispatch", label: "Technician Dispatch", icon: Wrench },
  { path: "/ops/technicians", label: "Technicians", icon: Users },
  { path: "/ops/revenue", label: "Revenue & Billing", icon: DollarSign },
  { path: "/ops/mrr", label: "MRR Dashboard", icon: TrendingUp },
  { path: "/ops/rmm", label: "RMM Console", icon: Server },
  { path: "/ops/provider-settings", label: "Provider Settings", icon: Settings },
];

const intelNavPrimary = [
  { path: "/intel/dashboard", label: "Research Dashboard", icon: LayoutDashboard },
  { path: "/intel/projects", label: "Research Projects", icon: FlaskConical },
  { path: "/intel/models", label: "Model Registry", icon: Cpu },
  { path: "/intel/predictions", label: "Predictions", icon: TrendingUp },
  { path: "/intel/insights", label: "AI Insights", icon: Eye },
];

const intelCortexNav = [
  { path: "/intel/quipu-command", label: "Agent Orchestration", icon: Network },
  { path: "/intel/chasqui-relay", label: "Signal Routing", icon: Radio },
  { path: "/intel/dual-mind", label: "Reasoning Monitor", icon: Sun },
  { path: "/intel/willaq-umu", label: "AI Advisor", icon: Eye },
  { path: "/intel/agent-autonomy", label: "Agent Autonomy", icon: BrainIcon },
  { path: "/intel/agent-autonomy/agents", label: "↳ Live Agents", icon: Users },
  { path: "/intel/agent-autonomy/a2a", label: "↳ A2A Graph", icon: Network },
  { path: "/intel/agent-autonomy/skills", label: "↳ Skill Analytics", icon: Zap },
  { path: "/intel/agent-autonomy/rag", label: "↳ RAG Monitor", icon: Database },
  { path: "/intel/agent-autonomy/connectors", label: "↳ Connector Health", icon: Link2 },
  { path: "/intel/agent-autonomy/self-improvement", label: "↳ Self-Improvement", icon: Sparkles },
  { path: "/agent-insights", label: "Agent Insights", icon: BrainIcon },
  { path: "/consciousness", label: "Consciousness", icon: Sparkles },
];

const nexusNavItems = [
  { path: "/nexus/correlation", label: "Cross-Domain Correlation", icon: Network },
  { path: "/nexus/war-gaming", label: "Scenario War-Gaming", icon: Target },
  { path: "/nexus/briefing", label: "Executive Briefing", icon: FileText },
  { path: "/nexus/geo-risk", label: "Geo Risk Scoring", icon: Globe },
  { path: "/nexus/osint", label: "OSINT Pipeline", icon: Rss },
  { path: "/nexus/actors", label: "Threat Actor Profiling", icon: Users },
  { path: "/nexus/early-warning", label: "Early Warning System", icon: AlertTriangle },
  { path: "/nexus/decisions", label: "Decision Support", icon: Zap },
  { path: "/nexus/workspace", label: "Analyst Workspace", icon: BrainIcon },
  { path: "/nexus/patterns", label: "Historical Patterns", icon: Clock },
];

type Module = "security" | "operations" | "intelligence" | "legal";

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-blue-500/40 border-t-blue-400 rounded-full animate-spin" />
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-3 text-center p-8">
      <Shield className="w-8 h-8" style={{ color: `${AEGIS_ACCENT}60` }} />
      <p className="text-sm" style={{ color: "#64748b" }}>You do not have permission to access this section.</p>
    </div>
  );
}

function deriveModule(loc: string): Module {
  if (loc.startsWith("/ops/") || loc === "/ops") return "operations";
  if (loc.startsWith("/intel/") || loc === "/intel" || loc.startsWith("/agent-insights") || loc.startsWith("/consciousness") || loc.startsWith("/nexus/") || loc === "/nexus") return "intelligence";
  if (loc.startsWith("/legal") || loc === "/legal") return "legal";
  return "security";
}

const AEGIS_ONBOARDING_CONFIG: OnboardingConfig = {
  appId: "aegis",
  appName: "Aegis",
  accentColor: AEGIS_ACCENT,
  steps: [
    {
      id: "welcome",
      title: "Welcome to Aegis",
      description: "Aegis is your unified defense and intelligence command — three workspaces (Defense, Command, Labs) sharing a single intelligence layer for complete operational visibility.",
      placement: "center",
      icon: Hexagon,
    },
    {
      id: "soc",
      title: "SOC Dashboard",
      description: "The SOC Dashboard is your command center. Monitor active incidents, review threat severity scores, and track real-time MTTD metrics across your entire security posture.",
      targetSelector: "a[href='/soc']",
      placement: "right",
      icon: Shield,
    },
    {
      id: "incidents",
      title: "Incident Management",
      description: "Track and triage P1/P2 security incidents with full MITRE ATT&CK mapping, assignee tracking, and evidence chains linking alerts to business impact.",
      targetSelector: "a[href='/incidents']",
      placement: "right",
      icon: AlertTriangle,
    },
    {
      id: "threat-intel",
      title: "Threat Intelligence",
      description: "Correlate IOCs from 142+ threat feeds, track APT actor activity, and surface actionable intelligence before alerts fire in your SIEM.",
      targetSelector: "a[href='/threat-intel']",
      placement: "right",
      icon: Target,
    },
    {
      id: "module-tabs",
      title: "Switch Workspaces",
      description: "Use the Defense / Command / Labs tabs to navigate between security operations, managed services, and the intelligence engine — all sharing the same data layer.",
      placement: "center",
      icon: Layers,
    },
  ],
  checklist: [
    { id: "explore-soc", label: "Review the SOC Dashboard", description: "Check active incidents and threat score" },
    { id: "explore-incidents", label: "View open incidents", description: "Triage P1/P2 incidents by severity" },
    { id: "explore-threat-intel", label: "Check threat intelligence feeds", description: "Review active IOCs and APT activity" },
    { id: "explore-compliance", label: "Review compliance posture", description: "Check NIST/SOC2 readiness scores" },
    { id: "explore-alerts", label: "Configure alert thresholds", description: "Set severity filters and notification rules" },
    { id: "explore-playbooks", label: "Review SOAR playbooks", description: "Check automated response playbooks" },
  ],
};

const MODULE_ACCENTS: Record<Module, string> = {
  security: "#ef4444",
  operations: "#3b82f6",
  intelligence: "#8b5cf6",
  legal: "#f59e0b",
};

const AEGIS_COLLAPSE_KEY = "aegis-sidebar-collapsed";

function readAegisCollapsed() {
  try { return localStorage.getItem(AEGIS_COLLAPSE_KEY) === "true"; } catch { return false; }
}

function AegisSidebarContent({ location, onNavigate, collapsed, onToggleCollapse }: { location: string; onNavigate?: (path: string) => void; collapsed?: boolean; onToggleCollapse?: () => void }) {
  const [activeModule, setActiveModule] = useState<Module>(deriveModule(location));

  useEffect(() => {
    setActiveModule(deriveModule(location));
  }, [location]);

  const moduleAccent = MODULE_ACCENTS[activeModule];

  const securitySections: SidebarNavSection[] = [
    {
      id: "atlas-runtime",
      label: "ATLAS Spatial Runtime",
      items: [
        { id: "/atlas-runtime", label: "Posture Twin Theater", href: "/atlas-runtime", icon: <Layers className="w-3.5 h-3.5" /> },
        { id: "/replay", label: "Attack Path Replay", href: "/replay", icon: <Play className="w-3.5 h-3.5" /> },
        { id: "/scenario-branches", label: "Blast Radius Simulation", href: "/scenario-branches", icon: <GitBranch className="w-3.5 h-3.5" /> },
      ],
    },
    {
      id: "citadel",
      label: "CITADEL Crisis Command",
      items: citadelNav.map(({ path, label, icon: Icon }) => ({ id: path, label, href: path, icon: <Icon className="w-3.5 h-3.5" /> })),
    },
    {
      id: "core",
      label: "Core",
      items: [
        ...commandSurfacesNav.map(({ path, label, icon: Icon }) => ({ id: path, label, href: path, icon: <Icon className="w-3.5 h-3.5" /> })),
        ...securityNavPrimary.map(({ path, label, icon: Icon }) => ({ id: path + "-so", label, href: path, icon: <Icon className="w-3.5 h-3.5" /> })),
      ],
    },
    {
      id: "intelligence",
      label: "Intelligence",
      items: [
        ...securityNavSecondary.map(({ path, label, icon: Icon }) => ({ id: path, label, href: path, icon: <Icon className="w-3 h-3" /> })),
        ...livingIntelNav.map(({ path, label, icon: Icon }) => ({ id: path + "-li", label, href: path, icon: <Icon className="w-3.5 h-3.5" /> })),
      ],
    },
    {
      id: "operations",
      label: "Operations",
      items: [
        { id: "threat-desk", label: "Threat Desk", href: "/soc/threat-desk", icon: <Shield className="w-3.5 h-3.5" /> },
        { id: "what-changed", label: "What Changed", href: "/soc/what-changed", icon: <Activity className="w-3.5 h-3.5" /> },
        { id: "action-queue", label: "Action Queue", href: "/soc/action-queue", icon: <Zap className="w-3.5 h-3.5" /> },
        { id: "readiness", label: "Incident Readiness", href: "/soc/readiness", icon: <BarChart3 className="w-3.5 h-3.5" /> },
        { id: "governance-review", label: "Governance Review", href: "/soc/governance", icon: <FileText className="w-3.5 h-3.5" /> },
        ...governanceNavItems.map(({ path, label, icon: Icon }) => ({ id: path + "-gov", label, href: path, icon: <Icon className="w-3 h-3" /> })),
      ],
    },
    {
      id: "agentic-defense",
      label: "Agentic Defense",
      items: agenticDefenseNav.map(({ path, label, icon: Icon }) => ({ id: path, label, href: path, icon: <Icon className="w-3.5 h-3.5" /> })),
    },
    {
      id: "phantom-sentinel",
      label: "Simulation & Analytics",
      items: phantomSentinelNav.map(({ path, label, icon: Icon }) => ({ id: path, label, href: path, icon: <Icon className="w-3.5 h-3.5" /> })),
    },
    {
      id: "living-intel",
      label: "Living Intelligence",
      items: livingIntelNav.map(({ path, label, icon: Icon }) => ({ id: path, label, href: path, icon: <Icon className="w-3.5 h-3.5" /> })),
    },
    {
      id: "governance",
      label: "Governance & Reporting",
      items: governanceNavItems.map(({ path, label, icon: Icon }) => ({ id: path, label, href: path, icon: <Icon className="w-3 h-3" /> })),
    },
    {
      id: "compliance",
      label: "Compliance & Readiness",
      items: complianceNavItems.map(({ path, label, icon: Icon }) => ({ id: path, label, href: path, icon: <Icon className="w-3 h-3" /> })),
    },
  ];

  const operationsSections: SidebarNavSection[] = [
    {
      id: "core",
      label: "Core",
      items: opsNavItems.map(({ path, label, icon: Icon }) => ({ id: path, label, href: path, icon: <Icon className="w-3.5 h-3.5" /> })),
    },
  ];

  const intelligenceSections: SidebarNavSection[] = [
    {
      id: "core",
      label: "Core",
      items: intelNavPrimary.map(({ path, label, icon: Icon }) => ({ id: path, label, href: path, icon: <Icon className="w-3.5 h-3.5" /> })),
    },
    {
      id: "intelligence",
      label: "Intelligence",
      items: intelCortexNav.map(({ path, label, icon: Icon }) => ({ id: path, label, href: path, icon: <Icon className="w-3 h-3" /> })),
    },
    {
      id: "nexus",
      label: "NEXUS — Geopolitical AI Fusion",
      items: nexusNavItems.map(({ path, label, icon: Icon }) => ({ id: path, label, href: path, icon: <Icon className="w-3 h-3" /> })),
    },
  ];

  const legalSections: SidebarNavSection[] = [
    {
      id: "legal-core",
      label: "Legal Command",
      items: [
        { id: "/legal", label: "Matter Overview", href: "/legal", icon: <Scale className="w-3.5 h-3.5" /> },
        { id: "/legal/matters", label: "Active Matters", href: "/legal", icon: <Scale className="w-3.5 h-3.5" /> },
        { id: "/legal/deadlines", label: "Deadline Risk Queue", href: "/legal", icon: <Clock className="w-3.5 h-3.5" /> },
        { id: "/legal/ai", label: "AI Recommendations", href: "/legal", icon: <BrainIcon className="w-3.5 h-3.5" /> },
      ],
    },
  ];

  const activeSections =
    activeModule === "security" ? securitySections
    : activeModule === "operations" ? operationsSections
    : activeModule === "legal" ? legalSections
    : intelligenceSections;

  const statusWidget = (
    <div className="rounded-lg px-3 py-3" style={{ background: toAlpha(moduleAccent, 0.04), border: `1px solid ${toAlpha(moduleAccent, 0.10)}` }}>
      <div className="text-[9px] uppercase tracking-widest font-medium mb-2" style={{ color: toAlpha(moduleAccent, 0.5) }}>
        {activeModule === "security" ? "Threat Status" : activeModule === "operations" ? "Ops Status" : activeModule === "legal" ? "Legal Status" : "Intel Status"}
      </div>
      <div className="space-y-1.5">
        {activeModule === "security" && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/35">Threat level</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[9px] font-mono text-amber-400">ELEVATED</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/35">Open incidents</span>
              <span className="text-[9px] font-mono text-red-400">7 active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/35">IOCs tracked</span>
              <span className="text-[9px] font-mono text-white/40">142 feeds</span>
            </div>
          </>
        )}
        {activeModule === "operations" && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/35">Systems online</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[9px] font-mono text-emerald-400">98.7%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/35">Active playbooks</span>
              <span className="text-[9px] font-mono text-blue-400">14 running</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/35">Alert queue</span>
              <span className="text-[9px] font-mono text-white/40">3 pending</span>
            </div>
          </>
        )}
        {activeModule === "intelligence" && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/35">OSINT sources</span>
              <span className="text-[9px] font-mono text-violet-400">89 active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/35">Cortex jobs</span>
              <span className="text-[9px] font-mono text-violet-400">6 running</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/35">Reports ready</span>
              <span className="text-[9px] font-mono text-white/40">11 queued</span>
            </div>
          </>
        )}
        {activeModule === "legal" && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/35">Active matters</span>
              <span className="text-[9px] font-mono text-amber-400">12 open</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/35">Deadline risk</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-[9px] font-mono text-red-400">3 critical</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/35">AI recommendations</span>
              <span className="text-[9px] font-mono text-white/40">5 pending</span>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const moduleTabHeader = (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
          style={{ background: `linear-gradient(135deg, ${toAlpha("#3b82f6", 0.25)}, ${toAlpha("#8b5cf6", 0.20)})` }}>
          <Hexagon className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight">Aegis</h1>
          <p className="text-[9px] font-mono uppercase tracking-[0.12em]" style={{ color: toAlpha(AEGIS_ACCENT, 0.5) }}>Security Intelligence Pack</p>
        </div>
      </div>
      <div className="flex gap-1 flex-wrap">
        {([
          { id: "security" as Module, label: "Defense", icon: Shield, activeColor: "#fca5a5" },
          { id: "operations" as Module, label: "Command", icon: Server, activeColor: "#93c5fd" },
          { id: "intelligence" as Module, label: "Labs", icon: BrainIcon, activeColor: "#c4b5fd" },
          { id: "legal" as Module, label: "Legal", icon: Scale, activeColor: "#fcd34d" },
        ] as { id: Module; label: string; icon: typeof Shield; activeColor: string }[]).map(({ id, label, icon: Icon, activeColor }) => (
          <button
            key={id}
            onClick={() => { setActiveModule(id); if (id === "legal" && onNavigate) onNavigate("/legal"); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-semibold transition-all",
              activeModule === id ? "" : "text-white/60 hover:text-white/80 hover:bg-white/5"
            )}
            style={activeModule === id ? {
              background: toAlpha(MODULE_ACCENTS[id], 0.15),
              color: activeColor,
              border: `1px solid ${toAlpha(MODULE_ACCENTS[id], 0.20)}`,
            } : {}}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  const collapseBtn = (
    <button
      onClick={onToggleCollapse}
      className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-white/8 shrink-0"
      style={{ color: toAlpha(moduleAccent, 0.5) }}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        {collapsed
          ? <path d="M4 2l3 4-3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          : <path d="M8 2L5 6l3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
    </button>
  );

  return (
    <SidebarNav
      sections={activeSections}
      currentPath={location}
      accentColor={moduleAccent}
      collapsed={collapsed}
      onNavigate={(item) => { if (item.href) onNavigate?.(item.href); }}
      header={moduleTabHeader}
      footer={collapsed ? collapseBtn : (
        <div className="space-y-3">
          {collapseBtn}
          {statusWidget}
        </div>
      )}
    />
  );
}

function SidebarContent({ onNavigate, onReplayTour, collapsed, onToggleCollapse, executiveSafeMode, onToggleSafeMode }: { onNavigate: (path: string) => void; onReplayTour?: () => void; collapsed?: boolean; onToggleCollapse?: () => void; executiveSafeMode?: boolean; onToggleSafeMode?: () => void }) {
  const [location] = useLocation();
  return (
    <>
      <AegisSidebarContent location={location} onNavigate={onNavigate} collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
      <div className="shrink-0 px-4 py-3 space-y-2" style={{ borderTop: `1px solid ${toAlpha("#ffffff", 0.05)}`, background: toAlpha("#0A0D14", 0.98) }}>
        {!collapsed && (
          <button
            onClick={onToggleSafeMode}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all"
            style={executiveSafeMode ? { color: "#8b7ac8", background: "rgba(139,122,200,0.12)", border: "1px solid rgba(139,122,200,0.3)" } : { color: "rgba(255,255,255,0.25)", background: "transparent", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Shield className="w-3 h-3 shrink-0" />
            {executiveSafeMode ? "Safe Mode Active" : "Executive Safe Mode"}
            <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: executiveSafeMode ? "#8b7ac8" : "rgba(255,255,255,0.15)" }} />
          </button>
        )}
        {AEGIS_ONBOARDING_CONFIG.checklist && (
          <div className="mb-1">
            <GettingStartedChecklist
              appId={AEGIS_ONBOARDING_CONFIG.appId}
              appName={AEGIS_ONBOARDING_CONFIG.appName}
              items={AEGIS_ONBOARDING_CONFIG.checklist}
              accentColor={AEGIS_ONBOARDING_CONFIG.accentColor}
              onReplayTour={onReplayTour}
              collapsed
            />
          </div>
        )}
        <UserButton showName className="w-full" />
        <PackBanner vertical="Security Intelligence Pack" accentColor={AEGIS_ACCENT} compact />
      </div>
    </>
  );
}

function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Legal Workspace (PRISM Counsel) */}
        <Route path="/legal" component={LegalWorkspacePage} />

        {/* Aegis Home & Enterprise */}
        <Route path="/home" component={AegisMarketingHome} />
        <Route path="/demo" component={EnterpriseDemo} />
        {/* CITADEL Crisis Command */}
        <Route path="/citadel" component={CitadelWarRoom} />
        <Route path="/citadel/playbooks" component={CitadelPlaybooks} />
        <Route path="/citadel/after-action" component={CitadelAfterAction} />

        {/* Command Surfaces (Phase 1) */}
        <Route path="/command-home" component={CommandHome} />
        <Route path="/investigations" component={InvestigationsBoard} />
        <Route path="/decision-console" component={DecisionConsole} />
        <Route path="/response-orchestration" component={ResponseOrchestration} />
        <Route path="/executive-board" component={ExecutiveBoardView} />
        {/* Security Operations */}
        <Route path="/soc" component={SOCDashboard} />
        <Route path="/" component={AegisMarketingHome} />
        <Route path="/pricing" component={AegisPricingPage} />
        <Route path="/asset-inventory" component={AssetInventoryPage} />
        <Route path="/threat-intel" component={ThreatIntelligence} />
        <Route path="/threat-feed" component={ThreatIntelFeed} />
        <Route path="/incidents" component={IncidentsPage} />
        <Route path="/findings" component={FindingsPage} />
        <Route path="/mitre-attack" component={MitreAttackPage} />
        <Route path="/compliance" component={CompliancePage} />
        <Route path="/cr/financial-compliance" component={FinancialCompliancePage} />
        <Route path="/alerts" component={AlertsPage} />
        <Route path="/risk-scoring" component={RiskScoringPage} />
        <Route path="/reports" component={ReportsPage} />
        <Route path="/observability" component={ObservabilityPage} />
        <Route path="/sentinel" component={SentinelDashboard} />
        <Route path="/watchlists" component={Watchlists} />
        <Route path="/soar-playbooks" component={SoarPlaybooks} />
        <Route path="/stix-taxii" component={StixTaxii} />
        <Route path="/tradecraft" component={TradecraftEnginePage} />
        <Route path="/forensics" component={ForensicsTimeline} />
        <Route path="/xdr-console" component={XDRConsole} />
        <Route path="/xdr-workbench" component={XDRIncidentWorkbench} />
        <Route path="/threat-graph" component={ThreatGraph} />
        <Route path="/threat-hunting" component={ThreatHunting} />
        <Route path="/threat-kill-chain" component={ThreatKillChain} />
        <Route path="/identity-threat" component={IdentityThreat} />
        <Route path="/executive-risk" component={ExecutiveRisk} />
        <Route path="/cr/dashboard" component={ReadinessDashboard} />
        <Route path="/cr/scorecards" component={FrameworkScorecards} />
        <Route path="/cr/risks" component={ComplianceRisks} />
        <Route path="/cr/vendor-risk" component={VendorRisk} />
        <Route path="/cr/milestones" component={MilestonesTrends} />
        <Route path="/cr/ai-insights" component={ReadinessAIInsights} />
        <Route path="/audit-chain" component={AuditChainPage} />
        <Route path="/trust-provenance" component={TrustProvenancePage} />
        <Route path="/sacsayhuaman-shield" component={SacsayhuamanShield} />
        <Route path="/adversary-emulation" component={AdversaryEmulation} />
        <Route path="/agent-insights" component={AgentInsightsPage} />
        <Route path="/agentops-explorer" component={AgentOpsExplorerPage} />
        <Route path="/vulnerabilities" component={VulnerabilityDashboard} />
        <Route path="/hardening-controls" component={HardeningControlsPage} />
        <Route path="/cases" component={CasesPage} />
        <Route path="/simulation-panel" component={SimulationPanelPage} />
        <Route path="/powerbi" component={PowerBiReport} />
        <Route path="/document-engine" component={DocumentEngine} />
        <Route path="/document-engine/:sub" component={DocumentEngine} />
        <Route path="/atlas-artifacts" component={AegisAtlasArtifactsPage} />
        <Route path="/atlas-runtime" component={AegisAtlasRuntime} />
        <Route path="/replay" component={AegisReplay} />
        <Route path="/scenario-branches" component={AegisScenarioBranches} />
        <Route path="/consciousness" component={ConsciousnessPage} />

        {/* Governance & Reporting (Phase 3) */}
        <Route path="/gov/agent-config" component={AgentConfigPage} />
        <Route path="/gov/operator-analytics" component={OperatorAnalytics} />
        <Route path="/gov/incident-analytics" component={IncidentAnalytics} />
        <Route path="/gov/trust-analytics" component={TrustAnalytics} />
        <Route path="/gov/governance" component={EnterpriseGovernance} />
        <Route path="/gov/executive-reports" component={ExecutiveReports} />
        <Route path="/gov/integrations" component={IntegrationHub} />
        <Route path="/gov/canonical-demo" component={CanonicalDemo} />
        <Route path="/gov/trust" component={TrustPositioning} />

        {/* Managed Operations — requires operator or admin role */}
        <Route path="/ops/dashboard">{() => <RoleGate requires={["operator", "admin"]} fallback={<AccessDenied />}><MspDashboard /></RoleGate>}</Route>
        <Route path="/ops/noc">{() => <RoleGate requires={["operator", "admin"]} fallback={<AccessDenied />}><MspNOC /></RoleGate>}</Route>
        <Route path="/ops/clients">{() => <RoleGate requires={["operator", "admin"]} fallback={<AccessDenied />}><MspClients /></RoleGate>}</Route>
        <Route path="/ops/tickets">{() => <RoleGate requires={["operator", "admin"]} fallback={<AccessDenied />}><MspTickets /></RoleGate>}</Route>
        <Route path="/ops/devices">{() => <RoleGate requires={["operator", "admin"]} fallback={<AccessDenied />}><MspDevices /></RoleGate>}</Route>
        <Route path="/ops/contracts">{() => <RoleGate requires={["operator", "admin"]} fallback={<AccessDenied />}><MspContracts /></RoleGate>}</Route>
        <Route path="/ops/revenue">{() => <RoleGate requires={["operator", "admin"]} fallback={<AccessDenied />}><MspRevenue /></RoleGate>}</Route>
        <Route path="/ops/technicians">{() => <RoleGate requires={["operator", "admin"]} fallback={<AccessDenied />}><MspTechnicians /></RoleGate>}</Route>
        <Route path="/ops/dispatch">{() => <RoleGate requires={["operator", "admin"]} fallback={<AccessDenied />}><MspDispatch /></RoleGate>}</Route>
        <Route path="/ops/rmm">{() => <RoleGate requires={["operator", "admin"]} fallback={<AccessDenied />}><MspRMM /></RoleGate>}</Route>
        <Route path="/ops/mrr">{() => <RoleGate requires={["operator", "admin"]} fallback={<AccessDenied />}><MspMRR /></RoleGate>}</Route>
        <Route path="/ops/service-desk">{() => <RoleGate requires={["operator", "admin"]} fallback={<AccessDenied />}><MspServiceDesk /></RoleGate>}</Route>
        <Route path="/ops/provider-settings">{() => <RoleGate requires={["admin"]} fallback={<AccessDenied />}><MspProviderSettings /></RoleGate>}</Route>
        <Route path="/ops/settings">{() => <RoleGate requires={["admin"]} fallback={<AccessDenied />}><AegisUnifiedSettings /></RoleGate>}</Route>

        {/* Intelligence Engine — requires security or admin role */}
        <Route path="/intel/dashboard">{() => <RoleGate requires={["security", "admin"]} fallback={<AccessDenied />}><IntelDashboard /></RoleGate>}</Route>
        <Route path="/intel/quipu-command">{() => <RoleGate requires={["security", "admin"]} fallback={<AccessDenied />}><QuipuCommand /></RoleGate>}</Route>
        <Route path="/intel/chasqui-relay">{() => <RoleGate requires={["security", "admin"]} fallback={<AccessDenied />}><ChasquiRelay /></RoleGate>}</Route>
        <Route path="/intel/dual-mind">{() => <RoleGate requires={["security", "admin"]} fallback={<AccessDenied />}><DualMindMonitor /></RoleGate>}</Route>
        <Route path="/intel/willaq-umu">{() => <RoleGate requires={["security", "admin"]} fallback={<AccessDenied />}><WillaqUmu /></RoleGate>}</Route>
        <Route path="/intel/agent-autonomy">{() => <RoleGate requires={["security", "admin"]} fallback={<AccessDenied />}><AgentAutonomyDashboard /></RoleGate>}</Route>
        <Route path="/intel/agent-autonomy/agents">{() => <RoleGate requires={["security", "admin"]} fallback={<AccessDenied />}><AgentAutonomyDashboard /></RoleGate>}</Route>
        <Route path="/intel/agent-autonomy/a2a">{() => <RoleGate requires={["security", "admin"]} fallback={<AccessDenied />}><AgentAutonomyDashboard /></RoleGate>}</Route>
        <Route path="/intel/agent-autonomy/skills">{() => <RoleGate requires={["security", "admin"]} fallback={<AccessDenied />}><AgentAutonomyDashboard /></RoleGate>}</Route>
        <Route path="/intel/agent-autonomy/rag">{() => <RoleGate requires={["security", "admin"]} fallback={<AccessDenied />}><AgentAutonomyDashboard /></RoleGate>}</Route>
        <Route path="/intel/agent-autonomy/connectors">{() => <RoleGate requires={["security", "admin"]} fallback={<AccessDenied />}><AgentAutonomyDashboard /></RoleGate>}</Route>
        <Route path="/intel/agent-autonomy/self-improvement">{() => <RoleGate requires={["security", "admin"]} fallback={<AccessDenied />}><AgentAutonomyDashboard /></RoleGate>}</Route>
        <Route path="/intel/models">{() => <RoleGate requires={["security", "admin"]} fallback={<AccessDenied />}><Models /></RoleGate>}</Route>
        <Route path="/intel/predictions">{() => <RoleGate requires={["security", "admin"]} fallback={<AccessDenied />}><Predictions /></RoleGate>}</Route>
        <Route path="/intel/projects">{() => <RoleGate requires={["security", "admin"]} fallback={<AccessDenied />}><IntelProjects /></RoleGate>}</Route>
        <Route path="/intel/insights">{() => <RoleGate requires={["security", "admin"]} fallback={<AccessDenied />}><IntelInsights /></RoleGate>}</Route>

        {/* NEXUS — Geopolitical AI Fusion & Predictive War-Gaming */}
        <Route path="/nexus/correlation">{() => <RoleGate requires={["security", "admin"]} fallback={<AccessDenied />}><NexusCrossDomainCorrelation /></RoleGate>}</Route>
        <Route path="/nexus/war-gaming">{() => <RoleGate requires={["security", "admin"]} fallback={<AccessDenied />}><NexusScenarioWargaming /></RoleGate>}</Route>
        <Route path="/nexus/briefing">{() => <RoleGate requires={["security", "admin"]} fallback={<AccessDenied />}><NexusExecutiveBriefing /></RoleGate>}</Route>
        <Route path="/nexus/geo-risk">{() => <RoleGate requires={["security", "admin"]} fallback={<AccessDenied />}><NexusGeopoliticalRiskScoring /></RoleGate>}</Route>
        <Route path="/nexus/osint">{() => <RoleGate requires={["security", "admin"]} fallback={<AccessDenied />}><NexusOsintPipeline /></RoleGate>}</Route>
        <Route path="/nexus/actors">{() => <RoleGate requires={["security", "admin"]} fallback={<AccessDenied />}><NexusThreatActorProfiling /></RoleGate>}</Route>
        <Route path="/nexus/early-warning">{() => <RoleGate requires={["security", "admin"]} fallback={<AccessDenied />}><NexusEarlyWarning /></RoleGate>}</Route>
        <Route path="/nexus/decisions">{() => <RoleGate requires={["security", "admin"]} fallback={<AccessDenied />}><NexusDecisionSupport /></RoleGate>}</Route>
        <Route path="/nexus/workspace">{() => <RoleGate requires={["security", "admin"]} fallback={<AccessDenied />}><NexusAnalystWorkspace /></RoleGate>}</Route>
        <Route path="/nexus/patterns">{() => <RoleGate requires={["security", "admin"]} fallback={<AccessDenied />}><NexusHistoricalPatterns /></RoleGate>}</Route>

        <Route path="/breach-cost" component={BreachCostPredictor} />
        <Route path="/purple-team" component={PurpleTeam} />
        <Route path="/apt-emulation" component={APTEmulationPage} />

        {/* PHANTOM & SENTINEL */}
        <Route path="/phantom/war-room" component={PhantomWarRoom} />
        <Route path="/phantom/purple-exercise" component={PhantomPurpleExercise} />
        <Route path="/phantom/tabletop" component={PhantomTabletop} />
        <Route path="/sentinel/behavioral" component={SentinelBehavioral} />
        <Route path="/threat-sim-report" component={ThreatSimReport} />
        <Route path="/zero-trust-scorecard" component={ZeroTrustScorecard} />
        <Route path="/cyber-insurance" component={CyberInsuranceScore} />
        <Route path="/attack-path" component={AttackPathViz} />
        <Route path="/threat-actors" component={ThreatActorProfiling} />

        <Route path="/soc/threat-desk" component={ThreatDesk} />
        <Route path="/soc/what-changed" component={AegisWhatChanged} />
        <Route path="/soc/action-queue" component={ActionQueue} />
        <Route path="/soc/readiness" component={IncidentReadinessView} />
        <Route path="/soc/governance" component={GovernanceReview} />

        {/* Living Intelligence Platform */}
        <Route path="/autonomous-threat-engine" component={AutonomousThreatEngine} />
        <Route path="/intelligence-fusion-grid" component={IntelligenceFusionGrid} />
        <Route path="/business-signal-intelligence" component={AegisBusinessSignalIntelligence} />
        <Route path="/predictive-intelligence" component={AegisPredictiveIntelligence} />
        <Route path="/threat-cost-translator" component={ThreatCostTranslator} />

        {/* Agentic SOC & Autonomous Cyber Defense (Task 521) */}
        <Route path="/agentic-soc" component={AgenticSOC} />
        <Route path="/deception-grid" component={DeceptionGrid} />
        <Route path="/mtd-engine" component={MTDEngine} />
        <Route path="/digital-twin" component={DigitalTwin} />
        <Route path="/hunt-agents" component={HuntAgents} />
        <Route path="/compliance-evidence" component={ComplianceEvidence} />
        <Route path="/vuln-lifecycle" component={VulnLifecycle} />
        <Route path="/cyber-insurance-intel" component={CyberInsuranceIntel} />
        <Route path="/soar-builder" component={SOARBuilder} />
        <Route path="/adversary-engine" component={AdversaryEngine} />

        <Route>
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Page not found</p>
          </div>
        </Route>
      </Switch>
    </Suspense>
  );
}

const BASE = import.meta.env.BASE_URL || "/aegis/";

function nav(path: string) {
  return () => { window.location.href = BASE + path.replace(/^\//, ""); };
}

const aegisCommands: CommandItem[] = [
  { id: "nav-citadel-war-room", label: "CITADEL Crisis Center", icon: "🔥", group: "CITADEL Crisis Response", keywords: ["crisis", "crisis response", "incident command", "ics", "emergency"], action: nav("/citadel") },
  { id: "nav-citadel-playbooks", label: "Crisis Playbooks", icon: "⚡", group: "CITADEL Crisis Response", keywords: ["playbook", "crisis", "response", "apt", "ransomware", "scenario"], action: nav("/citadel/playbooks") },
  { id: "nav-citadel-aar", label: "After-Action Report", icon: "📋", group: "CITADEL Crisis Response", keywords: ["after action", "aar", "post incident", "report", "lessons learned"], action: nav("/citadel/after-action") },
  { id: "nav-command-home", label: "Command Home", icon: "🏠", group: "Command Surfaces", keywords: ["home", "dashboard", "command", "operator"], action: nav("/command-home") },
  { id: "nav-investigations", label: "Investigations Board", icon: "🔍", group: "Command Surfaces", keywords: ["investigation", "case", "timeline", "entities"], action: nav("/investigations") },
  { id: "nav-decision-console", label: "Decision Console", icon: "📋", group: "Command Surfaces", keywords: ["decision", "confidence", "evidence", "approve"], action: nav("/decision-console") },
  { id: "nav-response-orchestration", label: "Response Orchestration", icon: "⚡", group: "Command Surfaces", keywords: ["playbook", "response", "orchestration", "containment"], action: nav("/response-orchestration") },
  { id: "nav-executive-board", label: "Executive / Board View", icon: "📊", group: "Command Surfaces", keywords: ["executive", "board", "posture", "ciso"], action: nav("/executive-board") },
  { id: "nav-soc", label: "SOC Overview", icon: "🛡️", group: "Security Operations", keywords: ["dashboard", "home", "soc"], action: nav("/soc") },
  { id: "nav-incidents", label: "Incidents", icon: "🚨", group: "Security Operations", action: nav("/incidents") },
  { id: "nav-alerts", label: "Alerts", icon: "🔔", group: "Security Operations", action: nav("/alerts") },
  { id: "nav-mitre", label: "MITRE ATT&CK", icon: "🎯", group: "Security Operations", action: nav("/mitre-attack") },
  { id: "nav-xdr", label: "XDR Console", icon: "🖥️", group: "Security Operations", action: nav("/xdr-console") },
  { id: "nav-threat-intel", label: "Threat Intelligence", icon: "⚠️", group: "Security Operations", action: nav("/threat-intel") },
  { id: "nav-vulns", label: "Vulnerability Dashboard", icon: "🐛", group: "Security Operations", action: nav("/vulnerabilities") },
  { id: "nav-compliance", label: "Compliance Readiness", icon: "✅", group: "Security Operations", action: nav("/cr/dashboard") },
  { id: "nav-ops-dashboard", label: "Operations Dashboard", icon: "📡", group: "Managed Operations", action: nav("/ops/dashboard") },
  { id: "nav-noc", label: "NOC Operations", icon: "🖥️", group: "Managed Operations", action: nav("/ops/noc") },
  { id: "nav-tickets", label: "Service Desk Tickets", icon: "🎫", group: "Managed Operations", action: nav("/ops/tickets") },
  { id: "nav-service-desk", label: "Service Desk", icon: "🎫", group: "Managed Operations", action: nav("/ops/service-desk") },
  { id: "nav-clients", label: "Client Accounts", icon: "🏢", group: "Managed Operations", action: nav("/ops/clients") },
  { id: "nav-devices", label: "Device Inventory", icon: "💻", group: "Managed Operations", action: nav("/ops/devices") },
  { id: "nav-dispatch", label: "Technician Dispatch", icon: "🔧", group: "Managed Operations", action: nav("/ops/dispatch") },
  { id: "nav-intel-dashboard", label: "Intelligence Dashboard", icon: "🧠", group: "Intelligence Engine", action: nav("/intel/dashboard") },
  { id: "nav-quipu", label: "Agent Console", icon: "🕸️", group: "Intelligence Engine", action: nav("/intel/quipu-command") },
  { id: "nav-models", label: "Models", icon: "⚙️", group: "Intelligence Engine", action: nav("/intel/models") },
  { id: "nav-predictions", label: "Predictions", icon: "📈", group: "Intelligence Engine", action: nav("/intel/predictions") },
  { id: "nav-intel-insights", label: "Intel Insights", icon: "💡", group: "Intelligence Engine", action: nav("/intel/insights") },
  { id: "nav-legal", label: "Matter Overview", icon: "⚖️", group: "Legal Command", keywords: ["legal", "matter", "overview", "prism"], action: nav("/legal") },
  { id: "nav-legal-matters", label: "Active Matters", icon: "📂", group: "Legal Command", keywords: ["legal", "matters", "cases", "active", "litigation"], action: nav("/legal") },
  { id: "nav-legal-deadlines", label: "Deadline Risk Queue", icon: "⏰", group: "Legal Command", keywords: ["legal", "deadline", "risk", "queue", "calendar"], action: nav("/legal") },
  { id: "nav-legal-ai", label: "AI Recommendations", icon: "🤖", group: "Legal Command", keywords: ["legal", "ai", "recommendations", "settlement", "prediction"], action: nav("/legal") },
  ...createBaselineWebActions(
    (path) => { window.location.href = BASE + path.replace(/^\//, ""); },
    {
      settingsPath: "/admin/platform-settings",
      profilePath: "/admin/platform-settings",
      notificationsPath: "/notifications",
      helpUrl: "https://szlholdings.com/docs",
      themeToggle: {
        label: "Toggle Theme",
        action: () => { document.documentElement.classList.toggle("light"); },
      },
    }
  ),
  ...getEcosystemSwitchCommands("aegis"),
];

const aegisShortcuts: KeyboardShortcut[] = [
  { key: "I", description: "Go to Incidents", category: "Security" },
  { key: "A", description: "Go to Alerts", category: "Security" },
  { key: "T", description: "Go to Threat Intel", category: "Security" },
  { key: "N", description: "Go to NOC Operations", category: "Operations" },
  { key: "E", description: "Go to Intelligence Dashboard", category: "Intelligence" },
  { key: "L", description: "Go to Legal Overview", category: "Legal" },
];

const MARKETING_ROUTES = ["/", "/home", "/demo", "/pulse"];

function AppContent({ cmdOpen, setCmdOpen }: { cmdOpen: boolean; setCmdOpen: (v: boolean) => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readAegisCollapsed);
  const [executiveSafeMode, setExecutiveSafeMode] = useState(() => { try { return localStorage.getItem("aegis-executive-safe-mode") === "1"; } catch { return false; } });
  const toggleSafeMode = () => setExecutiveSafeMode(prev => { const next = !prev; try { localStorage.setItem("aegis-executive-safe-mode", next ? "1" : "0"); } catch {} return next; });
  const { status: wsStatus } = useRealtimeChannel("aegis-incidents");
  const { syncState: aegisSyncState, lastSyncedAt: aegisLastSynced, pendingCount: aegisPending, conflictCount: aegisConflicts } = useWebSyncStatus({
    domain: "aegis",
    syncEndpoint: `${import.meta.env.BASE_URL}api/aegis/sync`,
    syncIntervalMs: 120_000,
    getPendingCount: () => _aegisQueue.count("aegis"),
    getConflictCount: () => _aegisConflictResolver.getConflictCount("aegis"),
  });
  const [location, navigate] = useLocation();
  const { replay: replayOnboarding } = useOnboardingState("aegis");
  const { isLoading, isAuthenticated, login } = useAuth();

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(AEGIS_COLLAPSE_KEY, String(next)); } catch {}
      return next;
    });
  };

  const params = new URLSearchParams(window.location.search);
  const demoMode = params.get("view") === "app" || params.get("demo") === "true";

  const normalizedPath = location.replace(/\/+$/, "") || "/";
  const isMarketing = MARKETING_ROUTES.includes(normalizedPath);

  if (isMarketing) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/pulse" component={AegisPulse} />
          <Route path="/home" component={AegisMarketingHome} />
          <Route path="/demo" component={EnterpriseDemo} />
          <Route path="/" component={AegisMarketingHome} />
        </Switch>
        <Toaster />
      </Suspense>
    );
  }

  if (!demoMode) {
    if (isLoading) {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0A0D14" }}>
          <div style={{ width: 24, height: 24, border: `2px solid ${AEGIS_ACCENT}30`, borderTopColor: AEGIS_ACCENT, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      );
    }
    if (!isAuthenticated) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0A0D14", gap: 24, padding: "0 24px", textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${AEGIS_ACCENT}20`, border: `1px solid ${AEGIS_ACCENT}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={AEGIS_ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#e2e8f0", margin: "0 0 8px 0" }}>Sign in to Aegis</h2>
            <p style={{ fontSize: 14, color: "#64748b", margin: 0, maxWidth: 360 }}>Unified Defense & Intelligence Command requires authentication.</p>
          </div>
          <button onClick={login} style={{ padding: "10px 28px", background: `${AEGIS_ACCENT}20`, border: `1px solid ${AEGIS_ACCENT}60`, borderRadius: 8, color: AEGIS_ACCENT, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
            Sign in
          </button>
          <a href="/aegis/home" style={{ fontSize: 13, color: "#475569", textDecoration: "none" }}>View product overview →</a>
        </div>
      );
    }
  }

  return (
    <PowerUserProvider shortcuts={aegisShortcuts} appName="Aegis" accentColor={AEGIS_ACCENT}>
      <div className="flex flex-col h-screen" style={{ background: "#0A0D14" }}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium" style={{ background: AEGIS_ACCENT, color: "#fff" }}>
          Skip to main content
        </a>
        <EcosystemNav currentAppId="aegis" currentAppName="Aegis — Unified Defense & Intelligence" accentColor={AEGIS_ACCENT} />
        <SandboxModeBanner />
        <ExecutiveSafeModeContext.Provider value={executiveSafeMode}>
        {executiveSafeMode && (
          <div className="flex items-center justify-between gap-4 px-4 py-2 text-[10px] font-bold uppercase tracking-widest shrink-0" style={{ background: "rgba(139,122,200,0.12)", borderBottom: "1px solid rgba(139,122,200,0.25)", color: "#8b7ac8" }}>
            <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" /> Executive Safe Mode — Only approved risk states shown. Degraded &amp; blocked outputs filtered until reviewed.</span>
            <button onClick={toggleSafeMode} className="text-[9px] px-2 py-0.5 rounded border border-purple-500/30 hover:bg-purple-500/10 transition-colors">Exit Safe Mode</button>
          </div>
        )}
        <SharedDashboardShell
          sidebar={<SidebarContent onNavigate={(path) => { navigate(path); setSidebarOpen(false); }} onReplayTour={replayOnboarding} collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebarCollapse} executiveSafeMode={executiveSafeMode} onToggleSafeMode={toggleSafeMode} />}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
          sidebarWidth={sidebarCollapsed ? "3.5rem" : "14rem"}
          theme={{ sidebarBg: "#0A0D14", pageBg: "#0A0D14", headerBg: toAlpha("#0A0D14", 0.92) }}
          accentColor={AEGIS_ACCENT}
          topbar={
            <div className="flex items-center gap-3 w-full md:hidden">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded transition-colors" style={{ color: toAlpha(AEGIS_ACCENT, 0.8) }} aria-label={sidebarOpen ? "Close navigation" : "Open navigation"} aria-expanded={sidebarOpen}>
                <Menu className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono ml-2" style={{ color: toAlpha(AEGIS_ACCENT, 0.8) }}>Aegis — Unified Defense & Intelligence</span>
              <div className="ml-auto pr-1 flex items-center gap-2">
                <SyncStatusBadge syncState={aegisSyncState} lastSyncedAt={aegisLastSynced} pendingCount={aegisPending} conflictCount={aegisConflicts} size="xs" showLabel={false} />
                <RealtimeStatusIndicator status={wsStatus} compact />
              </div>
            </div>
          }
        >
          <main id="main-content" role="main" className="flex-1 overflow-auto h-full" tabIndex={-1}>
            <AppRouter />
          </main>
        </SharedDashboardShell>
        </ExecutiveSafeModeContext.Provider>
        <Toaster />
        <CommandPalette
          open={cmdOpen}
          onClose={() => setCmdOpen(false)}
          commands={aegisCommands}
          appName="Aegis"
          accentColor={AEGIS_ACCENT}
        />
        <OnboardingWizard config={AEGIS_ONBOARDING_CONFIG} />
      </div>
    </PowerUserProvider>
  );
}

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(aegisCommands);

  return (
    <AnalyticsProvider appName="aegis">
    <PrismBusProvider domain="aegis">
    <SandboxModeProvider>
      <DemoModeProvider>
        <QueryClientProvider client={queryClient}>
          <StaleIndicator accentColor={AEGIS_ACCENT} />
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppContent cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />
          </WouterRouter>
          <AgentCopilot config={sentinelConfig} />
          <McpOverlay domain="aegis" />
        </QueryClientProvider>
      </DemoModeProvider>
    </SandboxModeProvider>
    </PrismBusProvider>
    </AnalyticsProvider>
  );
}

export default App;
