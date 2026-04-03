import { lazy, Suspense, useState, useEffect, useCallback } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { DemoModeProvider, useRealtimeChannel, RealtimeStatusIndicator, OnboardingWizard, GettingStartedChecklist, useOnboardingState, type OnboardingConfig, SandboxModeProvider, SandboxModeBanner } from "@workspace/shared-ui";
import { McpOverlay } from "@workspace/mcp-client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@workspace/shared-ui/ui/sonner";
import { UserButton } from "@workspace/shared-ui/UserButton";
import {
  Shield, Target, BarChart3, FileText, Activity, AlertTriangle, Bell, Grid3X3,
  ClipboardCheck, Search, Rss, Layers, Users, ShieldCheck,
  Building2, TrendingUp, Brain as BrainIcon, Package, Bug, SlidersHorizontal,
  Play, LayoutDashboard, Ticket, Monitor, DollarSign, Wrench, Server,
  FlaskConical, Cpu, Cpu as CpuIcon, Network, Radio, Plus, Sun, Eye,
  Database, Trophy, Boxes, GitBranch, Link2, Flame, Menu, X, ChevronDown,
  Hexagon, Zap, Briefcase, Globe
} from "lucide-react";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { sentinelConfig } from "@workspace/shared-ui/copilot-configs";
import { cn } from "@workspace/shared-ui/utils";
import { toAlpha } from "@workspace/shared-ui/utils";
import { CommandPalette, useCommandPalette, type CommandItem } from "@workspace/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@workspace/shared-ui/keyboard-shortcuts";
import { PackBanner } from "@/components/pack-banner";
import { LANE_ACCENT_HEX } from "@workspace/shared-ui/lane-colors";
import { SidebarNav, type SidebarNavSection, DashboardShell as SharedDashboardShell } from "@workspace/shared-ui/design-system";

const AEGIS_ACCENT = LANE_ACCENT_HEX.aegis.primary;

// ─── Security Operations pages (from Firestorm) ──────────────────────────────
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
const ThreatHunting = lazy(() => import("@/pages/threat-hunting"));
const ThreatKillChain = lazy(() => import("@/pages/threat-kill-chain"));
const IdentityThreat = lazy(() => import("@/pages/identity-threat"));
const ExecutiveRisk = lazy(() => import("@/pages/executive-risk"));
const SacsayhuamanShield = lazy(() => import("@/pages/sacsayhuaman-shield"));
const AdversaryEmulation = lazy(() => import("@/pages/simulation-runner"));
const AgentInsightsPage = lazy(() => import("@/pages/agent-insights"));
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
const SoarPlaybooks = lazy(() => import("@/pages/soar-playbooks"));
const StixTaxii = lazy(() => import("@/pages/stix-taxii"));
const TradecraftEnginePage = lazy(() => import("@/pages/tradecraft-engine"));

// ─── Command Surfaces (Phase 1) ───────────────────────────────────────────────
const CommandHome = lazy(() => import("@/pages/command-home"));
const InvestigationsBoard = lazy(() => import("@/pages/investigations-board"));
const DecisionConsole = lazy(() => import("@/pages/decision-console"));
const ResponseOrchestration = lazy(() => import("@/pages/response-orchestration"));
const ExecutiveBoardView = lazy(() => import("@/pages/executive-board-view"));

// ─── Governance & Orchestration (Phase 3) ────────────────────────────────────
const OperatorAnalytics = lazy(() => import("@/pages/governance/operator-analytics"));
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

// ─── Intelligence Engine pages (from INCA) ────────────────────────────────────
const IntelDashboard = lazy(() => import("@/pages/intel/dashboard"));
const QuipuCommand = lazy(() => import("@/pages/intel/quipu-command"));
const ChasquiRelay = lazy(() => import("@/pages/intel/chasqui-relay"));
const DualMindMonitor = lazy(() => import("@/pages/intel/dual-mind-monitor"));
const WillaqUmu = lazy(() => import("@/pages/intel/willaq-umu"));
const Models = lazy(() => import("@/pages/intel/models"));
const Predictions = lazy(() => import("@/pages/intel/predictions"));
const IntelProjects = lazy(() => import("@/pages/intel/projects"));
const IntelInsights = lazy(() => import("@/pages/intel/insights"));

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

// ─── Navigation definitions ───────────────────────────────────────────────────

const commandSurfacesNav = [
  { path: "/command-home", label: "Command Home", icon: LayoutDashboard },
  { path: "/investigations", label: "Investigations Board", icon: Search },
  { path: "/decision-console", label: "Decision Console", icon: ClipboardCheck },
  { path: "/response-orchestration", label: "Response Orchestration", icon: Zap },
  { path: "/executive-board", label: "Executive / Board View", icon: BarChart3 },
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
];

const securityNavPrimary = [
  { path: "/soc", label: "SOC Overview", icon: Activity },
  { path: "/sacsayhuaman-shield", label: "Sacsayhuamán Shield", icon: ShieldCheck },
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

const securityNavSecondary = [
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
];

const complianceNavItems = [
  { path: "/cr/dashboard", label: "Readiness Index", icon: ShieldCheck },
  { path: "/cr/scorecards", label: "Framework Scorecards", icon: ClipboardCheck },
  { path: "/cr/risks", label: "Risk Register", icon: AlertTriangle },
  { path: "/cr/vendor-risk", label: "Vendor Risk", icon: Building2 },
  { path: "/cr/milestones", label: "Milestones & Trends", icon: TrendingUp },
  { path: "/cr/ai-insights", label: "AI Insights", icon: Target },
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
];

const intelNavPrimary = [
  { path: "/intel/dashboard", label: "Research Dashboard", icon: LayoutDashboard },
  { path: "/intel/projects", label: "Research Projects", icon: FlaskConical },
  { path: "/intel/models", label: "Model Registry", icon: Cpu },
  { path: "/intel/predictions", label: "Predictions", icon: TrendingUp },
  { path: "/intel/insights", label: "AI Insights", icon: Eye },
];

const intelCortexNav = [
  { path: "/intel/quipu-command", label: "Quipu Command", icon: Network },
  { path: "/intel/chasqui-relay", label: "Chasqui Relay", icon: Radio },
  { path: "/intel/dual-mind", label: "Dual-Mind Monitor", icon: Sun },
  { path: "/intel/willaq-umu", label: "Willaq Umu Oracle", icon: Eye },
  { path: "/agent-insights", label: "Agent Insights", icon: BrainIcon },
];

type Module = "security" | "operations" | "intelligence";

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-blue-500/40 border-t-blue-400 rounded-full animate-spin" />
    </div>
  );
}


function deriveModule(loc: string): Module {
  if (loc.startsWith("/ops/") || loc === "/ops") return "operations";
  if (loc.startsWith("/intel/") || loc === "/intel" || loc.startsWith("/agent-insights")) return "intelligence";
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
};

function AegisSidebarContent({ location, onNavigate }: { location: string; onNavigate?: (path: string) => void }) {
  const [activeModule, setActiveModule] = useState<Module>(deriveModule(location));

  useEffect(() => {
    setActiveModule(deriveModule(location));
  }, [location]);

  const moduleAccent = MODULE_ACCENTS[activeModule];

  const securitySections: SidebarNavSection[] = [
    {
      id: "command-surfaces",
      label: "Command Surfaces",
      items: commandSurfacesNav.map(({ path, label, icon: Icon }) => ({ id: path, label, href: path, icon: <Icon className="w-3.5 h-3.5" /> })),
    },
    {
      id: "security-ops",
      label: "Security Operations",
      items: securityNavPrimary.map(({ path, label, icon: Icon }) => ({ id: path, label, href: path, icon: <Icon className="w-3.5 h-3.5" /> })),
    },
    {
      id: "soc-tools",
      label: "SOC Tools",
      items: securityNavSecondary.map(({ path, label, icon: Icon }) => ({ id: path, label, href: path, icon: <Icon className="w-3 h-3" /> })),
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
      id: "ops",
      label: "Managed Operations",
      items: opsNavItems.map(({ path, label, icon: Icon }) => ({ id: path, label, href: path, icon: <Icon className="w-3.5 h-3.5" /> })),
    },
  ];

  const intelligenceSections: SidebarNavSection[] = [
    {
      id: "intel",
      label: "Research & Intelligence",
      items: intelNavPrimary.map(({ path, label, icon: Icon }) => ({ id: path, label, href: path, icon: <Icon className="w-3.5 h-3.5" /> })),
    },
    {
      id: "cortex",
      label: "Agentic Cortex",
      items: intelCortexNav.map(({ path, label, icon: Icon }) => ({ id: path, label, href: path, icon: <Icon className="w-3 h-3" /> })),
    },
  ];

  const activeSections =
    activeModule === "security" ? securitySections
    : activeModule === "operations" ? operationsSections
    : intelligenceSections;

  const statusWidget = (
    <div className="rounded-lg px-3 py-3" style={{ background: toAlpha(moduleAccent, 0.04), border: `1px solid ${toAlpha(moduleAccent, 0.10)}` }}>
      <div className="text-[9px] uppercase tracking-widest font-medium mb-2" style={{ color: toAlpha(moduleAccent, 0.5) }}>
        {activeModule === "security" ? "Threat Status" : activeModule === "operations" ? "Ops Status" : "Intel Status"}
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
      <div className="flex gap-1">
        {([
          { id: "security" as Module, label: "Defense", icon: Shield },
          { id: "operations" as Module, label: "Command", icon: Server },
          { id: "intelligence" as Module, label: "Labs", icon: BrainIcon },
        ] as { id: Module; label: string; icon: typeof Shield }[]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveModule(id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-semibold transition-all",
              activeModule === id ? "" : "text-white/60 hover:text-white/80 hover:bg-white/5"
            )}
            style={activeModule === id ? {
              background: toAlpha(MODULE_ACCENTS[id], 0.15),
              color: id === "security" ? "#fca5a5" : id === "operations" ? "#93c5fd" : "#c4b5fd",
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

  return (
    <SidebarNav
      sections={activeSections}
      currentPath={location}
      accentColor={moduleAccent}
      onNavigate={(item) => { if (item.href) onNavigate?.(item.href); }}
      header={moduleTabHeader}
      footer={statusWidget}
    />
  );
}

function SidebarContent({ onNavigate, onReplayTour }: { onNavigate: (path: string) => void; onReplayTour?: () => void }) {
  const [location] = useLocation();
  return (
    <>
      <AegisSidebarContent location={location} onNavigate={onNavigate} />
      <div className="shrink-0 px-4 py-3 space-y-2" style={{ borderTop: `1px solid ${toAlpha("#ffffff", 0.05)}`, background: toAlpha("#0A0D14", 0.98) }}>
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
        {/* Aegis Home & Enterprise */}
        <Route path="/home" component={AegisMarketingHome} />
        <Route path="/demo" component={EnterpriseDemo} />
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
        <Route path="/sacsayhuaman-shield" component={SacsayhuamanShield} />
        <Route path="/adversary-emulation" component={AdversaryEmulation} />
        <Route path="/agent-insights" component={AgentInsightsPage} />
        <Route path="/vulnerabilities" component={VulnerabilityDashboard} />
        <Route path="/hardening-controls" component={HardeningControlsPage} />
        <Route path="/cases" component={CasesPage} />
        <Route path="/simulation-panel" component={SimulationPanelPage} />
        <Route path="/powerbi" component={PowerBiReport} />
        <Route path="/document-engine" component={DocumentEngine} />
        <Route path="/document-engine/:sub" component={DocumentEngine} />

        {/* Governance & Reporting (Phase 3) */}
        <Route path="/gov/operator-analytics" component={OperatorAnalytics} />
        <Route path="/gov/incident-analytics" component={IncidentAnalytics} />
        <Route path="/gov/trust-analytics" component={TrustAnalytics} />
        <Route path="/gov/governance" component={EnterpriseGovernance} />
        <Route path="/gov/executive-reports" component={ExecutiveReports} />
        <Route path="/gov/integrations" component={IntegrationHub} />
        <Route path="/gov/canonical-demo" component={CanonicalDemo} />
        <Route path="/gov/trust" component={TrustPositioning} />

        {/* Managed Operations */}
        <Route path="/ops/dashboard" component={MspDashboard} />
        <Route path="/ops/noc" component={MspNOC} />
        <Route path="/ops/clients" component={MspClients} />
        <Route path="/ops/tickets" component={MspTickets} />
        <Route path="/ops/devices" component={MspDevices} />
        <Route path="/ops/contracts" component={MspContracts} />
        <Route path="/ops/revenue" component={MspRevenue} />
        <Route path="/ops/technicians" component={MspTechnicians} />
        <Route path="/ops/dispatch" component={MspDispatch} />
        <Route path="/ops/rmm" component={MspRMM} />
        <Route path="/ops/mrr" component={MspMRR} />
        <Route path="/ops/service-desk" component={MspServiceDesk} />

        {/* Intelligence Engine */}
        <Route path="/intel/dashboard" component={IntelDashboard} />
        <Route path="/intel/quipu-command" component={QuipuCommand} />
        <Route path="/intel/chasqui-relay" component={ChasquiRelay} />
        <Route path="/intel/dual-mind" component={DualMindMonitor} />
        <Route path="/intel/willaq-umu" component={WillaqUmu} />
        <Route path="/intel/models" component={Models} />
        <Route path="/intel/predictions" component={Predictions} />
        <Route path="/intel/projects" component={IntelProjects} />
        <Route path="/intel/insights" component={IntelInsights} />

        <Route>
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Page not found</p>
          </div>
        </Route>
      </Switch>
    </Suspense>
  );
}

const BASE = import.meta.env.BASE_URL || "/firestorm/";

function nav(path: string) {
  return () => { window.location.href = BASE + path.replace(/^\//, ""); };
}

const aegisCommands: CommandItem[] = [
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
  { id: "nav-quipu", label: "Quipu Command", icon: "🕸️", group: "Intelligence Engine", action: nav("/intel/quipu-command") },
  { id: "nav-models", label: "Models", icon: "⚙️", group: "Intelligence Engine", action: nav("/intel/models") },
  { id: "nav-predictions", label: "Predictions", icon: "📈", group: "Intelligence Engine", action: nav("/intel/predictions") },
  { id: "nav-intel-insights", label: "Intel Insights", icon: "💡", group: "Intelligence Engine", action: nav("/intel/insights") },
  { id: "app-alloy", label: "Switch to Alloy", icon: "⬡", group: "Switch App", description: "Execution Fabric", action: () => { window.location.href = "/alloy/"; } },
  { id: "app-lyte", label: "Switch to Lyte", icon: "⚡", group: "Switch App", description: "Command Center", action: () => { window.location.href = "/lyte-command-center/"; } },
  { id: "app-vessels", label: "Switch to Vessels", icon: "⚓", group: "Switch App", description: "Maritime Intelligence", action: () => { window.location.href = "/vessels/"; } },
];

const aegisShortcuts: KeyboardShortcut[] = [
  { key: "I", description: "Go to Incidents", category: "Security" },
  { key: "A", description: "Go to Alerts", category: "Security" },
  { key: "T", description: "Go to Threat Intel", category: "Security" },
  { key: "N", description: "Go to NOC Operations", category: "Operations" },
  { key: "E", description: "Go to Intelligence Dashboard", category: "Intelligence" },
];

const MARKETING_ROUTES = ["/", "/home", "/demo"];

function AppContent({ cmdOpen, setCmdOpen }: { cmdOpen: boolean; setCmdOpen: (v: boolean) => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { status: wsStatus } = useRealtimeChannel("aegis-incidents");
  const [location, navigate] = useLocation();
  const { replay: replayOnboarding } = useOnboardingState("aegis");

  const normalizedPath = location.replace(/\/+$/, "") || "/";
  const isMarketing = MARKETING_ROUTES.includes(normalizedPath);

  if (isMarketing) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/home" component={AegisMarketingHome} />
          <Route path="/demo" component={EnterpriseDemo} />
          <Route path="/" component={AegisMarketingHome} />
        </Switch>
        <Toaster />
      </Suspense>
    );
  }

  return (
    <PowerUserProvider shortcuts={aegisShortcuts} appName="Aegis" accentColor={AEGIS_ACCENT}>
      <div className="flex flex-col h-screen" style={{ background: "#0A0D14" }}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium" style={{ background: AEGIS_ACCENT, color: "#fff" }}>
          Skip to main content
        </a>
        <EcosystemNav currentAppId="aegis" currentAppName="Aegis — Unified Defense & Intelligence" accentColor={AEGIS_ACCENT} />
        <SandboxModeBanner />
        <SharedDashboardShell
          sidebar={<SidebarContent onNavigate={(path) => { navigate(path); setSidebarOpen(false); }} onReplayTour={replayOnboarding} />}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
          theme={{ sidebarBg: "#0A0D14", pageBg: "#0A0D14", headerBg: toAlpha("#0A0D14", 0.92) }}
          accentColor={AEGIS_ACCENT}
          topbar={
            <div className="flex items-center gap-3 w-full md:hidden">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded transition-colors" style={{ color: toAlpha(AEGIS_ACCENT, 0.8) }} aria-label={sidebarOpen ? "Close navigation" : "Open navigation"} aria-expanded={sidebarOpen}>
                <Menu className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono ml-2" style={{ color: toAlpha(AEGIS_ACCENT, 0.8) }}>Aegis — Unified Defense & Intelligence</span>
              <div className="ml-auto pr-1"><RealtimeStatusIndicator status={wsStatus} compact /></div>
            </div>
          }
        >
          <main id="main-content" role="main" className="flex-1 overflow-auto h-full" tabIndex={-1}>
            <AppRouter />
          </main>
        </SharedDashboardShell>
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
    <SandboxModeProvider>
      <DemoModeProvider>
        <QueryClientProvider client={queryClient}>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppContent cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />
          </WouterRouter>
          <AgentCopilot config={sentinelConfig} />
          <McpOverlay domain="aegis" />
        </QueryClientProvider>
      </DemoModeProvider>
    </SandboxModeProvider>
  );
}

export default App;
