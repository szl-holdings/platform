import { lazy, Suspense, useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { DemoModeProvider } from "@workspace/shared-ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@workspace/shared-ui/ui/sonner";
import { UserButton } from "@workspace/shared-ui/UserButton";
import {
  Shield, Target, BarChart3, FileText, Activity, AlertTriangle, Bell, Grid3X3,
  ClipboardCheck, Search, Rss, Layers, Users, ChevronRight, ShieldCheck,
  Building2, TrendingUp, Brain as BrainIcon, Package, Bug, SlidersHorizontal,
  Play, LayoutDashboard, Ticket, Monitor, DollarSign, Wrench, Server,
  FlaskConical, Cpu, Cpu as CpuIcon, Network, Radio, Plus, Sun, Eye,
  Database, Trophy, Boxes, GitBranch, Link2, Flame, Menu, X, ChevronDown,
  Hexagon, Zap, Briefcase
} from "lucide-react";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { sentinelConfig } from "@workspace/shared-ui/copilot-configs";
import { cn } from "@workspace/shared-ui/utils";
import { CommandPalette, useCommandPalette, type CommandItem } from "@workspace/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@workspace/shared-ui/keyboard-shortcuts";

// ─── Security Operations pages (from Firestorm) ──────────────────────────────
const AegisMarketingHome = lazy(() => import("@/pages/aegis-home"));
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
const ReadinessDashboard = lazy(() => import("@/pages/compliance/readiness-dashboard"));
const FrameworkScorecards = lazy(() => import("@/pages/compliance/framework-scorecards"));
const ComplianceRisks = lazy(() => import("@/pages/compliance/compliance-risks"));
const VendorRisk = lazy(() => import("@/pages/compliance/vendor-risk"));
const MilestonesTrends = lazy(() => import("@/pages/compliance/milestones-trends"));
const ReadinessAIInsights = lazy(() => import("@/pages/compliance/readiness-ai-insights"));

// ─── Managed Operations pages (from Rosie/MSP) ───────────────────────────────
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
const AgentSpawner = lazy(() => import("@/pages/intel/agent-spawner"));
const ChasquiRelay = lazy(() => import("@/pages/intel/chasqui-relay"));
const DualMindMonitor = lazy(() => import("@/pages/intel/dual-mind-monitor"));
const WillaqUmu = lazy(() => import("@/pages/intel/willaq-umu"));
const Experiments = lazy(() => import("@/pages/intel/experiments"));
const Models = lazy(() => import("@/pages/intel/models"));
const NeuralExplorer = lazy(() => import("@/pages/intel/neural-explorer"));
const Predictions = lazy(() => import("@/pages/intel/predictions"));
const GPUMonitoring = lazy(() => import("@/pages/intel/gpu-monitoring"));
const LLMEvaluation = lazy(() => import("@/pages/intel/llm-evaluation"));
const Benchmarking = lazy(() => import("@/pages/intel/benchmarking"));
const ModelRegistry = lazy(() => import("@/pages/intel/model-registry"));
const EnsembleStudio = lazy(() => import("@/pages/intel/ensemble-studio"));
const IntelProjects = lazy(() => import("@/pages/intel/projects"));
const IntelInsights = lazy(() => import("@/pages/intel/insights"));
const IntelAlertsManagement = lazy(() => import("@/pages/intel/alerts-management"));

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
];

const securityNavSecondary = [
  { path: "/xdr-console", label: "XDR Console", icon: Layers },
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
  { path: "/intel/experiments", label: "Experiments", icon: FlaskConical },
  { path: "/intel/models", label: "Model Registry", icon: Cpu },
  { path: "/intel/neural-explorer", label: "Neural Explorer", icon: BrainIcon },
  { path: "/intel/predictions", label: "Predictions", icon: TrendingUp },
  { path: "/intel/insights", label: "AI Insights", icon: Eye },
];

const intelCortexNav = [
  { path: "/intel/quipu-command", label: "Quipu Command", icon: Network },
  { path: "/intel/agent-spawner", label: "Agent Spawner", icon: Plus },
  { path: "/intel/chasqui-relay", label: "Chasqui Relay", icon: Radio },
  { path: "/intel/dual-mind", label: "Dual-Mind Monitor", icon: Sun },
  { path: "/intel/willaq-umu", label: "Willaq Umu Oracle", icon: Eye },
  { path: "/agent-insights", label: "Agent Insights", icon: BrainIcon },
];

const intelToolsNav = [
  { path: "/intel/ensemble", label: "Ensemble Studio", icon: Layers },
  { path: "/intel/benchmarking", label: "Benchmarking Suite", icon: Trophy },
  { path: "/intel/llm-eval", label: "LLM Evaluation", icon: FlaskConical },
  { path: "/intel/gpu-monitoring", label: "GPU Monitor", icon: Cpu },
  { path: "/intel/model-registry", label: "Version Registry", icon: Database },
];

type Module = "security" | "operations" | "intelligence";

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-blue-500/40 border-t-blue-400 rounded-full animate-spin" />
    </div>
  );
}

function ModuleSection({
  title,
  items,
  expanded,
  onToggle,
  location,
}: {
  title: string;
  items: { path: string; label: string; icon: typeof Shield }[];
  expanded: boolean;
  onToggle: () => void;
  location: string;
}) {
  return (
    <div className="pt-1">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-[0.15em] text-blue-400/40 hover:text-blue-400/70 transition-all w-full"
      >
        <ChevronRight className={cn("w-3 h-3 shrink-0 transition-transform", expanded && "rotate-90")} />
        {title}
      </button>
      {expanded && (
        <div className="mt-0.5 space-y-0.5">
          {items.map(({ path, label, icon: Icon }) => {
            const isActive = path === "/" ? location === "/" : location.startsWith(path);
            return (
              <Link key={path} href={path}>
                <div className={cn(
                  "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 cursor-pointer relative ml-2",
                  isActive
                    ? "bg-blue-500/10 text-blue-300"
                    : "text-blue-400/40 hover:text-blue-200 hover:bg-blue-500/5"
                )}>
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3.5 bg-blue-400 rounded-r-full" />}
                  <Icon className="w-3 h-3 shrink-0" />
                  {label}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function deriveModule(loc: string): Module {
  if (loc.startsWith("/ops/") || loc === "/ops") return "operations";
  if (loc.startsWith("/intel/") || loc === "/intel" || loc.startsWith("/agent-insights")) return "intelligence";
  return "security";
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [location] = useLocation();

  const [activeModule, setActiveModule] = useState<Module>(deriveModule(location));

  useEffect(() => {
    setActiveModule(deriveModule(location));
  }, [location]);

  const [socToolsExpanded, setSocToolsExpanded] = useState(false);
  const [complianceExpanded, setComplianceExpanded] = useState(location.startsWith("/cr"));
  const [cortexExpanded, setCortexExpanded] = useState(false);
  const [intelToolsExpanded, setIntelToolsExpanded] = useState(false);

  const navItemColors: Record<Module, { active: string; inactive: string; indicator: string }> = {
    security: {
      active: "bg-red-500/10 text-red-300",
      inactive: "text-red-400/50 hover:text-red-200 hover:bg-red-500/5",
      indicator: "bg-red-400",
    },
    operations: {
      active: "bg-blue-500/10 text-blue-300",
      inactive: "text-blue-400/50 hover:text-blue-200 hover:bg-blue-500/5",
      indicator: "bg-blue-400",
    },
    intelligence: {
      active: "bg-violet-500/10 text-violet-300",
      inactive: "text-violet-400/50 hover:text-violet-200 hover:bg-violet-500/5",
      indicator: "bg-violet-400",
    },
  };

  const colors = navItemColors[activeModule];

  const renderNavItems = (items: typeof securityNavPrimary) =>
    items.map(({ path, label, icon: Icon }) => {
      const isActive = path === "/soc" ? location === "/soc" || location === "/" : location.startsWith(path);
      return (
        <Link key={path} href={path}>
          <div className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer relative",
            isActive ? colors.active : colors.inactive
          )}>
            {isActive && <div className={cn("absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full", colors.indicator)} />}
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {label}
          </div>
        </Link>
      );
    });

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={onClose} />}
      <aside className={cn(
        "bg-[#0A0D14]/98 border-r border-white/5 flex flex-col h-screen sticky top-0 z-30 transition-transform duration-200",
        "fixed md:relative inset-y-0 left-0 w-60",
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )}>
        {/* Header */}
        <div className="px-4 py-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(139,92,246,0.2))" }}>
              <Hexagon className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h1 className="font-display text-sm font-bold text-foreground tracking-tight">Aegis</h1>
              <p className="text-[9px] text-blue-400/50 font-mono uppercase tracking-[0.12em]">Unified Defense Command</p>
            </div>
          </div>
        </div>

        {/* Module Tabs */}
        <div className="px-2 py-2 border-b border-white/5">
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
                  activeModule === id
                    ? id === "security" ? "bg-red-500/15 text-red-300 border border-red-500/20"
                      : id === "operations" ? "bg-blue-500/15 text-blue-300 border border-blue-500/20"
                      : "bg-violet-500/15 text-violet-300 border border-violet-500/20"
                    : "text-white/25 hover:text-white/50 hover:bg-white/5"
                )}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Nav Content */}
        <div className="flex-1 min-h-0 flex flex-col">
        <nav className="flex-1 min-h-0 px-2 py-2 space-y-0.5 overflow-y-auto">
          {activeModule === "security" && (
            <>
              {renderNavItems(securityNavPrimary)}
              <ModuleSection
                title="SOC Tools"
                items={securityNavSecondary}
                expanded={socToolsExpanded}
                onToggle={() => setSocToolsExpanded(!socToolsExpanded)}
                location={location}
              />
              <div className="pt-1">
                <button
                  onClick={() => setComplianceExpanded(!complianceExpanded)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-[0.15em] text-red-400/40 hover:text-red-400/70 transition-all w-full"
                >
                  <ChevronRight className={cn("w-3 h-3 shrink-0 transition-transform", complianceExpanded && "rotate-90")} />
                  Compliance & Readiness
                  {location.startsWith("/cr") && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
                </button>
                {complianceExpanded && (
                  <div className="mt-0.5 space-y-0.5">
                    {complianceNavItems.map(({ path, label, icon: Icon }) => {
                      const isActive = location.startsWith(path);
                      return (
                        <Link key={path} href={path}>
                          <div className={cn(
                            "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 cursor-pointer relative ml-2",
                            isActive ? "bg-red-500/10 text-red-300" : "text-red-400/40 hover:text-red-200 hover:bg-red-500/5"
                          )}>
                            <Icon className="w-3 h-3 shrink-0" />
                            {label}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {activeModule === "operations" && (
            <>
              {opsNavItems.map(({ path, label, icon: Icon }) => {
                const isActive = location.startsWith(path);
                return (
                  <Link key={path} href={path}>
                    <div className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer relative",
                      isActive ? "bg-blue-500/10 text-blue-300" : "text-blue-400/50 hover:text-blue-200 hover:bg-blue-500/5"
                    )}>
                      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-blue-400 rounded-r-full" />}
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      {label}
                    </div>
                  </Link>
                );
              })}
            </>
          )}

          {activeModule === "intelligence" && (
            <>
              {intelNavPrimary.map(({ path, label, icon: Icon }) => {
                const isActive = path === "/intel/dashboard" ? location === "/intel/dashboard" : location.startsWith(path);
                return (
                  <Link key={path} href={path}>
                    <div className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer relative",
                      isActive ? "bg-violet-500/10 text-violet-300" : "text-violet-400/50 hover:text-violet-200 hover:bg-violet-500/5"
                    )}>
                      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-violet-400 rounded-r-full" />}
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      {label}
                    </div>
                  </Link>
                );
              })}
              <div className="pt-1">
                <button
                  onClick={() => setCortexExpanded(!cortexExpanded)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-[0.15em] text-violet-400/40 hover:text-violet-400/70 transition-all w-full"
                >
                  <ChevronRight className={cn("w-3 h-3 shrink-0 transition-transform", cortexExpanded && "rotate-90")} />
                  Agentic Cortex
                </button>
                {cortexExpanded && (
                  <div className="mt-0.5 space-y-0.5">
                    {intelCortexNav.map(({ path, label, icon: Icon }) => {
                      const isActive = location.startsWith(path);
                      return (
                        <Link key={path} href={path}>
                          <div className={cn(
                            "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 cursor-pointer relative ml-2",
                            isActive ? "bg-violet-500/10 text-violet-300" : "text-violet-400/40 hover:text-violet-200 hover:bg-violet-500/5"
                          )}>
                            <Icon className="w-3 h-3 shrink-0" />
                            {label}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="pt-1">
                <button
                  onClick={() => setIntelToolsExpanded(!intelToolsExpanded)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-[0.15em] text-violet-400/30 hover:text-violet-400/60 transition-all w-full"
                >
                  <ChevronRight className={cn("w-3 h-3 shrink-0 transition-transform", intelToolsExpanded && "rotate-90")} />
                  Research Tools
                </button>
                {intelToolsExpanded && (
                  <div className="mt-0.5 space-y-0.5">
                    {intelToolsNav.map(({ path, label, icon: Icon }) => {
                      const isActive = location.startsWith(path);
                      return (
                        <Link key={path} href={path}>
                          <div className={cn(
                            "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 cursor-pointer relative ml-2",
                            isActive ? "bg-violet-500/10 text-violet-300" : "text-violet-400/30 hover:text-violet-200 hover:bg-violet-500/5"
                          )}>
                            <Icon className="w-3 h-3 shrink-0" />
                            {label}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </nav>

        <div className="mt-auto shrink-0 px-3 py-3 mx-2 mb-2 rounded-lg" style={{
          background: activeModule === "security" ? "rgba(239,68,68,0.04)" : activeModule === "operations" ? "rgba(59,130,246,0.04)" : "rgba(139,92,246,0.04)",
          border: `1px solid ${activeModule === "security" ? "rgba(239,68,68,0.1)" : activeModule === "operations" ? "rgba(59,130,246,0.1)" : "rgba(139,92,246,0.1)"}`,
        }}>
          <div className="text-[9px] uppercase tracking-widest font-medium mb-2" style={{ color: activeModule === "security" ? "rgba(239,68,68,0.5)" : activeModule === "operations" ? "rgba(59,130,246,0.5)" : "rgba(139,92,246,0.5)" }}>
            {activeModule === "security" ? "Threat Status" : activeModule === "operations" ? "Ops Status" : "Intel Status"}
          </div>
          <div className="space-y-1.5">
            {activeModule === "security" && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Threat level</span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-[9px] font-mono text-amber-400">ELEVATED</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Open incidents</span>
                  <span className="text-[9px] font-mono text-red-400">7 active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>IOCs tracked</span>
                  <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>142 feeds</span>
                </div>
              </>
            )}
            {activeModule === "operations" && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Systems online</span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[9px] font-mono text-emerald-400">98.7%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Active playbooks</span>
                  <span className="text-[9px] font-mono text-blue-400">14 running</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Alert queue</span>
                  <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>3 pending</span>
                </div>
              </>
            )}
            {activeModule === "intelligence" && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>OSINT sources</span>
                  <span className="text-[9px] font-mono text-violet-400">89 active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Cortex jobs</span>
                  <span className="text-[9px] font-mono text-violet-400">6 running</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Reports ready</span>
                  <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>11 queued</span>
                </div>
              </>
            )}
          </div>
        </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/5 space-y-2">
          <UserButton showName className="w-full" />
          <div className="flex items-center gap-2 text-[10px] text-white/20">
            <Hexagon className="w-3 h-3" />
            <span className="font-mono">SZL Holdings · Aegis</span>
          </div>
        </div>
      </aside>
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
        {/* Security Operations */}
        <Route path="/soc" component={SOCDashboard} />
        <Route path="/" component={SOCDashboard} />
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
        <Route path="/forensics" component={ForensicsTimeline} />
        <Route path="/xdr-console" component={XDRConsole} />
        <Route path="/threat-hunting" component={ThreatHunting} />
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
        <Route path="/intel/agent-spawner" component={AgentSpawner} />
        <Route path="/intel/chasqui-relay" component={ChasquiRelay} />
        <Route path="/intel/dual-mind" component={DualMindMonitor} />
        <Route path="/intel/willaq-umu" component={WillaqUmu} />
        <Route path="/intel/experiments" component={Experiments} />
        <Route path="/intel/models" component={Models} />
        <Route path="/intel/neural-explorer" component={NeuralExplorer} />
        <Route path="/intel/predictions" component={Predictions} />
        <Route path="/intel/gpu-monitoring" component={GPUMonitoring} />
        <Route path="/intel/llm-eval" component={LLMEvaluation} />
        <Route path="/intel/benchmarking" component={Benchmarking} />
        <Route path="/intel/model-registry" component={ModelRegistry} />
        <Route path="/intel/ensemble" component={EnsembleStudio} />
        <Route path="/intel/projects" component={IntelProjects} />
        <Route path="/intel/insights" component={IntelInsights} />
        <Route path="/intel/alerts" component={IntelAlertsManagement} />

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
  { id: "nav-experiments", label: "Experiments", icon: "🧪", group: "Intelligence Engine", action: nav("/intel/experiments") },
  { id: "nav-models", label: "Model Registry", icon: "⚙️", group: "Intelligence Engine", action: nav("/intel/models") },
  { id: "nav-neural", label: "Neural Explorer", icon: "🔬", group: "Intelligence Engine", action: nav("/intel/neural-explorer") },
  { id: "app-alloy", label: "Switch to Alloy", icon: "⬡", group: "Switch App", description: "Execution Fabric", action: () => { window.location.href = "/alloy/"; } },
  { id: "app-lyte", label: "Switch to Lyte", icon: "⚡", group: "Switch App", description: "Command Center", action: () => { window.location.href = "/lyte-command-center/"; } },
  { id: "app-vessels", label: "Switch to Vessels", icon: "⚓", group: "Switch App", description: "Maritime Intelligence", action: () => { window.location.href = "/vessels/"; } },
];

const aegisShortcuts: KeyboardShortcut[] = [
  { key: "I", description: "Go to Incidents", category: "Security" },
  { key: "A", description: "Go to Alerts", category: "Security" },
  { key: "T", description: "Go to Threat Intel", category: "Security" },
  { key: "N", description: "Go to NOC Operations", category: "Operations" },
  { key: "E", description: "Go to Experiments", category: "Intelligence" },
];

function AppContent({ cmdOpen, setCmdOpen }: { cmdOpen: boolean; setCmdOpen: (v: boolean) => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <PowerUserProvider shortcuts={aegisShortcuts} appName="Aegis" accentColor="#3b82f6">
      <div className="flex flex-col h-screen bg-[#0A0D14]">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-blue-500 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium">
          Skip to main content
        </a>
        <EcosystemNav currentAppId="aegis" currentAppName="Aegis — Unified Defense & Intelligence" accentColor="#3b82f6" />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="flex-1 flex flex-col overflow-auto min-w-0">
            <div className="h-10 flex items-center px-3 border-b border-white/5 bg-[#0A0D14]/80 md:hidden shrink-0">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded hover:bg-blue-500/10 text-blue-400/50 hover:text-blue-300 transition-colors" aria-label="Toggle navigation">
                <Menu className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono text-blue-400/40 ml-2">Aegis — Unified Defense & Intelligence</span>
            </div>
            <main id="main-content" className="flex-1 overflow-auto" tabIndex={-1}>
              <AppRouter />
            </main>
          </div>
        </div>
        <Toaster />
        <CommandPalette
          open={cmdOpen}
          onClose={() => setCmdOpen(false)}
          commands={aegisCommands}
          appName="Aegis"
          accentColor="#3b82f6"
        />
      </div>
    </PowerUserProvider>
  );
}

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(aegisCommands);

  return (
    <DemoModeProvider>
      <QueryClientProvider client={queryClient}>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppContent cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />
        </WouterRouter>
        <AgentCopilot config={sentinelConfig} />
      </QueryClientProvider>
    </DemoModeProvider>
  );
}

export default App;
