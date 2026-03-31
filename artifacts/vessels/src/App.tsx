import { lazy, Suspense, useState } from "react";
import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@workspace/shared-ui/ui/sonner";
import { UserButton } from "@workspace/shared-ui/UserButton";
import {
  Ship, AlertTriangle, Activity, LayoutDashboard, WifiOff,
  BarChart3, ChevronDown, User, ChevronRight, DollarSign, Wrench,
  MapPin, Radio, List, Globe, Navigation, EyeOff, ShieldAlert, Anchor, Brain, Menu
} from "lucide-react";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { helmsmanConfig } from "@workspace/shared-ui/copilot-configs";
import { cn } from "@workspace/shared-ui/utils";
import { AuthProvider, useAuth, roleLabels, type UserRole } from "@/contexts/auth-context";
import { PrivateAppGuard } from "@workspace/shared-ui";
import { CommandPalette, useCommandPalette, type CommandItem } from "@workspace/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@workspace/shared-ui/keyboard-shortcuts";
import { DemoModeProvider } from "@workspace/shared-ui";

// Marketing pages
const MarketingHomePage = lazy(() => import("@/pages/marketing-home"));
const MarketingPlatformPage = lazy(() => import("@/pages/marketing-platform"));
const MarketingCapabilitiesPage = lazy(() => import("@/pages/marketing-capabilities"));
const MarketingUseCasesPage = lazy(() => import("@/pages/marketing-use-cases"));
const MarketingSecurityPage = lazy(() => import("@/pages/marketing-security"));
const MarketingPricingPage = lazy(() => import("@/pages/marketing-pricing"));
const MarketingDemoPage = lazy(() => import("@/pages/marketing-demo"));
const SignInPage = lazy(() => import("@/pages/marketing-sign-in"));
const LegalPrivacyPage = lazy(() => import("@/pages/legal-privacy"));
const LegalTermsPage = lazy(() => import("@/pages/legal-terms"));

// Dashboard / product pages
const CommandOverviewPage = lazy(() => import("@/pages/command-overview"));
const FleetMapPage = lazy(() => import("@/pages/fleet-map"));
const VesselDetailEnhancedPage = lazy(() => import("@/pages/vessel-detail-enhanced"));
const VoyageEconomicsPage = lazy(() => import("@/pages/voyage-economics"));
const ExceptionsCenterPage = lazy(() => import("@/pages/exceptions-center"));
const MaintenanceReadinessPage = lazy(() => import("@/pages/maintenance-readiness"));
const CommandModePage = lazy(() => import("@/pages/command-mode"));
const PerformanceAnalyticsPage = lazy(() => import("@/pages/performance-analytics"));
const VesselsListPage = lazy(() => import("@/pages/vessels-list"));
const CorridorRoutesPage = lazy(() => import("@/pages/corridor-routes"));
const AlertCenterPage = lazy(() => import("@/pages/alert-center"));
const AgentInsightsPage = lazy(() => import("@/pages/agent-insights"));
const MaritimeIntelligence = lazy(() => import("@/pages/maritime-intelligence"));
const WeatherPage = lazy(() => import("@/pages/weather-page"));
const PortAnalyticsPage = lazy(() => import("@/pages/port-analytics"));
const CO2EmissionsPage = lazy(() => import("@/pages/co2-emissions"));
const RiskScoringPage = lazy(() => import("@/pages/risk-scoring"));
const DarkVesselDetection = lazy(() => import("@/pages/dark-vessel-detection"));
const SanctionsScreening = lazy(() => import("@/pages/sanctions-screening"));
const CyberThreatPanel = lazy(() => import("@/pages/cyber-threat-panel"));
const IncidentReporting = lazy(() => import("@/pages/incident-reporting"));
const CommandWorkflowsPage = lazy(() => import("@/pages/command-workflows"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60000 } },
});

const primaryNavItems = [
  { path: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { path: "/dashboard/fleet", label: "Fleet", icon: MapPin },
  { path: "/dashboard/vessels", label: "Vessels", icon: List },
  { path: "/dashboard/routes", label: "Routes", icon: Navigation },
  { path: "/dashboard/alerts", label: "Alerts", icon: AlertTriangle },
  { path: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { path: "/dashboard/billing", label: "Billing", icon: DollarSign },
  { path: "/dashboard/settings", label: "Settings", icon: Wrench },
];

const adminNavItems = [
  { path: "/dashboard/team", label: "Team", icon: Radio },
  { path: "/dashboard/audit-log", label: "Audit Log", icon: Activity },
];

const legacyNavItems = [
  { path: "/fleet", label: "Fleet Map", icon: Globe },
  { path: "/exceptions", label: "Exceptions", icon: AlertTriangle },
  { path: "/economics", label: "Voyage Economics", icon: DollarSign },
  { path: "/maintenance", label: "Maintenance", icon: Wrench },
  { path: "/command", label: "Command Mode", icon: Activity },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/intelligence", label: "Maritime Intel", icon: Globe },
  { path: "/corridors", label: "Corridors", icon: Navigation },
  { path: "/agent-insights", label: "Agent Insights", icon: Brain },
  { path: "/command-workflows", label: "Command Workflows", icon: ShieldAlert },
];

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-sky-500/40 border-t-sky-400 rounded-full animate-spin" />
    </div>
  );
}

interface AppHealthSummary {
  services: { name: string; status: string }[];
  summary: { total: number; liveConfigured: number; mockedDemoMode: number; manualRequired: number };
}

function DemoModeBanner() {
  const { data } = useQuery<AppHealthSummary>({
    queryKey: ["app-health-vessels"],
    queryFn: () => fetch("/api/services/health/app/vessels").then((r) => r.json()),
    refetchInterval: 60000,
  });

  if (!data) return null;
  const hasDemoMode = data.summary.mockedDemoMode > 0;
  const hasUnhealthy = data.summary.manualRequired > 0;
  if (!hasDemoMode && !hasUnhealthy) return null;

  if (hasUnhealthy) {
    return (
      <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-1.5 flex items-center gap-2 shrink-0">
        <WifiOff className="w-3 h-3 text-red-400" />
        <span className="text-[11px] text-red-400">{data.summary.manualRequired} integration(s) not configured</span>
      </div>
    );
  }

  return (
    <div className="border-b border-sky-500/10 px-4 py-1 flex items-center gap-2 shrink-0">
      <span className="text-[10px] font-mono text-sky-400/50 px-2 py-0.5 rounded-full border border-sky-500/20 bg-sky-500/5">DEMO</span>
      <span className="text-[10px] text-sky-400/40">Simulated operational data · 10 vessels</span>
    </div>
  );
}

function RoleSelector({ expanded }: { expanded: boolean }) {
  const { user, setRole } = useAuth();
  const [open, setOpen] = useState(false);
  const roles: UserRole[] = ["exec", "ops", "compliance", "maintenance"];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-2 py-2 rounded-lg hover:bg-sky-500/5 transition-colors text-left"
        aria-label={`Current role: ${roleLabels[user.role]}`}
      >
        <div className="w-7 h-7 rounded-full bg-sky-500/10 flex items-center justify-center shrink-0">
          <User className="w-3.5 h-3.5 text-sky-400" />
        </div>
        {expanded && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sky-100 truncate">{user.name}</p>
              <p className="text-[10px] text-sky-400/50">{roleLabels[user.role]}</p>
            </div>
            <ChevronDown className={cn("w-3 h-3 text-sky-400/40 transition-transform shrink-0", open && "rotate-180")} />
          </>
        )}
      </button>
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#0a1628] border border-sky-500/20 rounded-lg shadow-xl z-50 overflow-hidden" style={{ minWidth: 160 }}>
          <div className="p-2 border-b border-sky-500/10">
            <p className="text-[10px] text-sky-400/50 uppercase tracking-wider px-2">Switch Role</p>
          </div>
          {roles.map(r => (
            <button
              key={r}
              onClick={() => { setRole(r); setOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-2 text-xs transition-colors",
                user.role === r ? "bg-sky-500/10 text-sky-400" : "text-sky-300/50 hover:text-sky-100 hover:bg-sky-500/5"
              )}
            >
              {roleLabels[r]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Sidebar({ mobileOpen, onMobileClose }: { mobileOpen?: boolean; onMobileClose?: () => void }) {
  const [location] = useLocation();
  const [hovered, setHovered] = useState(false);
  const [legacyExpanded, setLegacyExpanded] = useState(false);
  const expanded = hovered || (mobileOpen ?? false);

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={onMobileClose} />
      )}
    <aside
      className={cn(
        "bg-[#060e1a]/95 border-r border-sky-500/10 flex flex-col h-screen transition-all duration-200 ease-out z-30",
        "fixed md:sticky top-0 inset-y-0 left-0",
        mobileOpen ? "w-52 translate-x-0" : "-translate-x-full md:translate-x-0",
        "md:w-14 md:hover:w-52",
        expanded && "md:w-52",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setLegacyExpanded(false); }}
    >
      <Link href="/">
        <div className="px-3 py-4 border-b border-sky-500/10 flex items-center gap-2.5 overflow-hidden cursor-pointer hover:bg-sky-500/5 transition-colors">
          <div className="w-8 h-8 rounded-md bg-sky-500/8 border border-sky-500/12 flex items-center justify-center shrink-0">
            <Ship className="w-4 h-4 text-sky-400 animate-wave-float" />
          </div>
          {expanded && (
            <div className="flex-1 min-w-0 overflow-hidden">
              <h1 className="font-display text-sm font-semibold text-sky-50 truncate tracking-tight">Vessels</h1>
              <p className="text-[10px] text-sky-400/40 truncate font-mono uppercase tracking-wider">Maritime Command</p>
            </div>
          )}
        </div>
      </Link>

      <div className="flex-1 min-h-0 flex flex-col">
      <nav className="flex-1 min-h-0 px-1.5 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {primaryNavItems.map(({ path, label, icon: Icon }) => {
          const isActive = location === path || location.startsWith(path + "/");
          return (
            <Link key={path} href={path}>
              <div
                className={cn(
                  "flex items-center rounded-lg transition-all duration-150 cursor-pointer relative",
                  expanded ? "gap-2.5 px-3 py-2" : "justify-center px-0 py-2.5",
                  isActive
                    ? "bg-sky-500/10 text-sky-300"
                    : "text-sky-400/50 hover:text-sky-200 hover:bg-sky-500/5"
                )}
                title={!expanded ? label : undefined}
              >
                {isActive && expanded && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-sky-400 rounded-r-full" />
                )}
                <Icon className={cn("shrink-0", expanded ? "w-3.5 h-3.5" : "w-5 h-5")} />
                {expanded && <span className="text-xs font-medium truncate">{label}</span>}
              </div>
            </Link>
          );
        })}

        {expanded && (
          <div className="pt-3">
            <p className="text-[9px] font-mono text-sky-400/30 uppercase tracking-[0.12em] px-3 mb-1.5">Admin</p>
            {adminNavItems.map(({ path, label, icon: Icon }) => {
              const isActive = location === path;
              return (
                <Link key={path} href={path}>
                  <div className={cn(
                    "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer",
                    isActive ? "bg-sky-500/10 text-sky-300" : "text-sky-400/30 hover:text-sky-200 hover:bg-sky-500/5"
                  )}>
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {label}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {expanded && (
          <div className="pt-2">
            <button
              onClick={() => setLegacyExpanded(!legacyExpanded)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-sky-400/30 hover:text-sky-300 hover:bg-sky-500/5 transition-all w-full"
            >
              <ChevronRight className={cn("w-3.5 h-3.5 shrink-0 transition-transform", legacyExpanded && "rotate-90")} />
              More pages
            </button>
            {legacyExpanded && (
              <div className="mt-0.5 space-y-0.5">
                {legacyNavItems.map(({ path, label, icon: Icon }) => {
                  const isActive = location.startsWith(path);
                  return (
                    <Link key={path} href={path}>
                      <div className={cn(
                        "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 cursor-pointer relative ml-2",
                        isActive
                          ? "bg-sky-500/10 text-sky-300"
                          : "text-sky-400/30 hover:text-sky-200 hover:bg-sky-500/5"
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
        )}
      </nav>

      {expanded && (
        <div className="mt-auto shrink-0 px-3 py-3 mx-1.5 mb-2 rounded-lg" style={{ background: "rgba(14,165,233,0.04)", border: "1px solid rgba(14,165,233,0.08)" }}>
          <div className="text-[9px] uppercase tracking-widest font-medium mb-2" style={{ color: "rgba(14,165,233,0.4)" }}>Fleet Status</div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Vessels tracked</span>
              <span className="text-[9px] font-mono" style={{ color: "#38bdf8" }}>1,247 live</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Distress signals</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-[9px] font-mono text-red-400">2 active</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Zones monitored</span>
              <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>18 regions</span>
            </div>
          </div>
          <div className="mt-2 h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full" style={{ width: "94%", background: "linear-gradient(90deg, #0ea5e9, #38bdf8)" }} />
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.2)" }}>AIS coverage</span>
            <span className="text-[8px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>94%</span>
          </div>
        </div>
      )}
      </div>

      <div className="px-1.5 py-3 border-t border-sky-500/10 space-y-2">
        {expanded && (
          <Link href="/platform">
            <div className="w-full text-xs font-medium bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 rounded-lg px-3 py-2 transition-colors text-center cursor-pointer">
              Request demo
            </div>
          </Link>
        )}
        <UserButton showName={expanded} className="w-full" />
        <RoleSelector expanded={expanded} />
        {expanded && (
          <a href="/alloy/" className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg w-full transition-colors hover:bg-sky-500/5" title="Alloy Intelligence Layer">
            <span className="text-[10px] text-sky-400/50 font-medium">⬡ Powered by Alloy</span>
          </a>
        )}
      </div>
    </aside>
    </>
  );
}

function DashboardRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/dashboard" component={CommandOverviewPage} />
        <Route path="/dashboard/fleet" component={FleetMapPage} />
        <Route path="/dashboard/vessels/:id" component={VesselDetailEnhancedPage} />
        <Route path="/dashboard/vessels" component={VesselsListPage} />
        <Route path="/dashboard/routes" component={CorridorRoutesPage} />
        <Route path="/dashboard/alerts" component={AlertCenterPage} />
        <Route path="/dashboard/reports" component={PerformanceAnalyticsPage} />
        <Route path="/dashboard/billing">
          <div className="p-6 max-w-xl mx-auto space-y-4">
            <h1 className="font-display text-xl font-bold text-sky-50">Billing</h1>
            <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-5">
              <p className="text-sm font-medium text-sky-100 mb-1">Active subscription</p>
              <p className="text-xs text-sky-400/40">Fleet Command Plan · 10 vessels · Billed annually</p>
            </div>
          </div>
        </Route>
        <Route path="/dashboard/settings">
          <div className="p-6 max-w-xl mx-auto space-y-4">
            <h1 className="font-display text-xl font-bold text-sky-50">Settings</h1>
            <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-5">
              <p className="text-sm font-medium text-sky-100 mb-1">Organisation settings</p>
              <p className="text-xs text-sky-400/40">Configure fleet parameters, API integrations, and user preferences.</p>
            </div>
          </div>
        </Route>
        <Route path="/dashboard/team">
          <div className="p-6 max-w-xl mx-auto space-y-4">
            <h1 className="font-display text-xl font-bold text-sky-50">Team</h1>
            <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-5">
              <p className="text-sm font-medium text-sky-100 mb-1">Team management</p>
              <p className="text-xs text-sky-400/40">Invite members, assign roles, and manage fleet access permissions.</p>
            </div>
          </div>
        </Route>
        <Route path="/dashboard/audit-log">
          <div className="p-6 max-w-xl mx-auto space-y-4">
            <h1 className="font-display text-xl font-bold text-sky-50">Audit Log</h1>
            <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-5">
              <p className="text-sm font-medium text-sky-100 mb-1">Activity history</p>
              <p className="text-xs text-sky-400/40">Full audit trail of user actions, data access, and configuration changes.</p>
            </div>
          </div>
        </Route>
        {/* Legacy routes preserved */}
        <Route path="/fleet" component={FleetMapPage} />
        <Route path="/vessel/:id" component={VesselDetailEnhancedPage} />
        <Route path="/vessels/:id" component={VesselDetailEnhancedPage} />
        <Route path="/vessels-list" component={VesselsListPage} />
        <Route path="/corridors" component={CorridorRoutesPage} />
        <Route path="/exceptions" component={ExceptionsCenterPage} />
        <Route path="/economics" component={VoyageEconomicsPage} />
        <Route path="/maintenance" component={MaintenanceReadinessPage} />
        <Route path="/command" component={CommandModePage} />
        <Route path="/analytics" component={PerformanceAnalyticsPage} />
        <Route path="/intelligence" component={MaritimeIntelligence} />
        <Route path="/routes" component={CorridorRoutesPage} />
        <Route path="/alerts" component={AlertCenterPage} />
        <Route path="/weather" component={WeatherPage} />
        <Route path="/port-analytics" component={PortAnalyticsPage} />
        <Route path="/co2-emissions" component={CO2EmissionsPage} />
        <Route path="/risk-scoring" component={RiskScoringPage} />
        <Route path="/dark-vessel-detection" component={DarkVesselDetection} />
        <Route path="/sanctions-screening" component={SanctionsScreening} />
        <Route path="/cyber-threats" component={CyberThreatPanel} />
        <Route path="/incidents" component={IncidentReporting} />
        <Route path="/agent-insights" component={AgentInsightsPage} />
        <Route path="/command-workflows" component={CommandWorkflowsPage} />
        <Route>
          <div className="flex items-center justify-center h-full">
            <p className="text-sky-400/40">Page not found</p>
          </div>
        </Route>
      </Switch>
    </Suspense>
  );
}

const vesselsCommands: CommandItem[] = [
  { id: "nav-dashboard", label: "Dashboard Overview", icon: "📊", group: "Navigation", keywords: ["dashboard", "overview", "kpi"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/dashboard"); } },
  { id: "nav-fleet", label: "Fleet Map", icon: "🗺️", group: "Navigation", keywords: ["map", "fleet", "positions"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/dashboard/fleet"); } },
  { id: "nav-vessels", label: "Vessel Roster", icon: "📋", group: "Navigation", keywords: ["list", "roster", "vessels"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/dashboard/vessels"); } },
  { id: "nav-alerts", label: "Alerts", icon: "⚠️", group: "Navigation", keywords: ["alerts", "exceptions", "issues"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/dashboard/alerts"); } },
  { id: "nav-economics", label: "Voyage Economics", icon: "💰", group: "Navigation", keywords: ["economics", "revenue", "margin"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/economics"); } },
  { id: "nav-command", label: "Command Mode", icon: "🎯", group: "Navigation", keywords: ["command", "operational", "focused"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/command"); } },
  { id: "app-lyte", label: "Switch to Lyte", icon: "⚡", group: "Switch App", description: "Business Observability", action: () => { window.location.href = "/lyte-command-center/"; } },
  { id: "app-alloy", label: "Switch to Alloy", icon: "⬡", group: "Switch App", description: "Execution Fabric", action: () => { window.location.href = "/alloy/"; } },
];

const vesselsShortcuts: KeyboardShortcut[] = [
  { key: "D", description: "Go to Dashboard", category: "Navigation" },
  { key: "F", description: "Go to Fleet Map", category: "Navigation" },
  { key: "A", description: "Go to Alerts", category: "Navigation" },
  { key: "C", description: "Go to Command Mode", category: "Navigation" },
];

function DashboardShell({ cmdOpen, setCmdOpen }: { cmdOpen: boolean; setCmdOpen: (v: boolean) => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <PowerUserProvider shortcuts={vesselsShortcuts} appName="Vessels" accentColor="#0ea5e9">
      <div className="flex flex-col h-screen bg-[#060e1a]">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-sky-500 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium">
          Skip to main content
        </a>
        <EcosystemNav currentAppId="vessels" currentAppName="Vessels Maritime Intelligence" accentColor="#0ea5e9" />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
          <div className="flex-1 flex flex-col overflow-auto min-w-0">
            <DemoModeBanner />
            <div className="h-10 flex items-center px-3 border-b border-sky-500/8 bg-[#060e1a]/80 md:hidden shrink-0">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded hover:bg-sky-500/10 text-sky-400/50 hover:text-sky-300 transition-colors" aria-label="Toggle navigation">
                <Menu className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono text-sky-400/30 ml-2 uppercase tracking-wider">Vessels Maritime Intelligence</span>
            </div>
            <main id="main-content" className="flex-1 overflow-auto" tabIndex={-1}>
              <DashboardRouter />
            </main>
          </div>
        </div>
      </div>
      <Toaster />
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        commands={vesselsCommands}
        appName="Vessels"
        accentColor="#0ea5e9"
      />
    </PowerUserProvider>
  );
}

function AppContent({ cmdOpen, setCmdOpen }: { cmdOpen: boolean; setCmdOpen: (v: boolean) => void }) {
  const [location] = useLocation();
  const isDashboard = location.startsWith("/dashboard") ||
    location.startsWith("/fleet") || location.startsWith("/vessel") ||
    location.startsWith("/exceptions") || location.startsWith("/economics") ||
    location.startsWith("/maintenance") || location.startsWith("/command") ||
    location.startsWith("/analytics") || location.startsWith("/intelligence") ||
    location.startsWith("/corridors") || location.startsWith("/alerts") ||
    location.startsWith("/weather") || location.startsWith("/port-analytics") ||
    location.startsWith("/co2-emissions") || location.startsWith("/risk-scoring") ||
    location.startsWith("/dark-vessel-detection") || location.startsWith("/sanctions-screening") ||
    location.startsWith("/cyber-threats") || location.startsWith("/incidents") ||
    location.startsWith("/agent-insights") || location.startsWith("/vessels-list") ||
    location.startsWith("/routes") || location.startsWith("/command-workflows");

  if (isDashboard) {
    return (
      <PrivateAppGuard appName="Vessels" accentColor="#0ea5e9">
        <DashboardShell cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />
      </PrivateAppGuard>
    );
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-[#060e1a]"><div className="w-6 h-6 border-2 border-sky-500/40 border-t-sky-400 rounded-full animate-spin" /></div>}>
      <Switch>
        <Route path="/" component={MarketingHomePage} />
        <Route path="/platform" component={MarketingPlatformPage} />
        <Route path="/capabilities" component={MarketingCapabilitiesPage} />
        <Route path="/use-cases" component={MarketingUseCasesPage} />
        <Route path="/security" component={MarketingSecurityPage} />
        <Route path="/pricing" component={MarketingPricingPage} />
        <Route path="/demo" component={MarketingDemoPage} />
        <Route path="/sign-in" component={SignInPage} />
        <Route path="/legal/privacy" component={LegalPrivacyPage} />
        <Route path="/legal/terms" component={LegalTermsPage} />
        <Route component={MarketingHomePage} />
      </Switch>
    </Suspense>
  );
}

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(vesselsCommands);

  return (
    <DemoModeProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppContent cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />
        </WouterRouter>
      </AuthProvider>
      <AgentCopilot config={helmsmanConfig} />
    </QueryClientProvider>
    </DemoModeProvider>
  );
}

export default App;
