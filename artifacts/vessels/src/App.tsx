import { lazy, Suspense, useState } from "react";
import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@workspace/shared-ui/ui/sonner";
import { UserButton } from "@workspace/shared-ui/UserButton";
import {
  Ship, AlertTriangle, Activity, LayoutDashboard, WifiOff,
  BarChart3, ChevronDown, User, ChevronRight, DollarSign, Wrench,
  MapPin, Radio, List, Globe, Navigation, EyeOff, ShieldAlert, Anchor, Brain
} from "lucide-react";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { helmsmanConfig } from "@workspace/shared-ui/copilot-configs";
import { cn } from "@workspace/shared-ui/utils";
import { AuthProvider, useAuth, roleLabels, type UserRole } from "@/contexts/auth-context";
import { CommandPalette, useCommandPalette, type CommandItem } from "@workspace/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@workspace/shared-ui/keyboard-shortcuts";
import { IncaAgentIndicator } from "@workspace/shared-ui/inca-agent-indicator";
import { WelcomeOverlay } from "@workspace/shared-ui/WelcomeOverlay";

const VesselsLandingPage = lazy(() => import("@/pages/vessels-landing"));
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

const FleetDashboard = lazy(() => import("@/pages/fleet-dashboard"));
const VesselsHome = lazy(() => import("@/pages/vessels-home"));
const VesselDetailPage = lazy(() => import("@/pages/vessel-detail"));
const RoutePlanningPage = lazy(() => import("@/pages/route-planning"));
const AlertCenterPage = lazy(() => import("@/pages/alert-center"));
const WeatherPage = lazy(() => import("@/pages/weather-page"));
const SimulationsPage = lazy(() => import("@/pages/simulations-page"));
const MaritimeIntelligence = lazy(() => import("@/pages/maritime-intelligence"));
const FleetAPMPage = lazy(() => import("@/pages/fleet-apm"));
const PortAnalyticsPage = lazy(() => import("@/pages/port-analytics"));
const CO2EmissionsPage = lazy(() => import("@/pages/co2-emissions"));
const RiskScoringPage = lazy(() => import("@/pages/risk-scoring"));
const DarkVesselDetection = lazy(() => import("@/pages/dark-vessel-detection"));
const SanctionsScreening = lazy(() => import("@/pages/sanctions-screening"));
const CyberThreatPanel = lazy(() => import("@/pages/cyber-threat-panel"));
const IncidentReporting = lazy(() => import("@/pages/incident-reporting"));
const AgentInsightsPage = lazy(() => import("@/pages/agent-insights"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60000 } },
});

const primaryNavItems = [
  { path: "/platform", label: "Command Overview", icon: LayoutDashboard },
  { path: "/fleet", label: "Fleet Map", icon: MapPin },
  { path: "/vessels-list", label: "Vessel Roster", icon: List },
  { path: "/exceptions", label: "Exceptions", icon: AlertTriangle },
  { path: "/economics", label: "Voyage Economics", icon: DollarSign },
  { path: "/maintenance", label: "Maintenance", icon: Wrench },
  { path: "/corridors", label: "Corridors", icon: Navigation },
  { path: "/command", label: "Command Mode", icon: Activity },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/agent-insights", label: "Agent Insights", icon: Brain },
];

const legacyNavItems = [
  { path: "/intelligence", label: "Maritime Intel", icon: Globe },
  { path: "/routes", label: "Route Planning", icon: Navigation },
  { path: "/alerts", label: "Alerts", icon: AlertTriangle },
  { path: "/weather", label: "Weather", icon: Activity },
  { path: "/port-analytics", label: "Port Analytics", icon: Ship },
  { path: "/co2-emissions", label: "CO2 & Emissions", icon: Activity },
  { path: "/risk-scoring", label: "Risk Scoring", icon: Activity },
  { path: "/dark-vessel-detection", label: "Dark Vessels", icon: Activity },
  { path: "/sanctions-screening", label: "Sanctions", icon: Activity },
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

function Sidebar() {
  const [location] = useLocation();
  const [hovered, setHovered] = useState(false);
  const [legacyExpanded, setLegacyExpanded] = useState(false);
  const expanded = hovered;

  return (
    <aside
      className={cn(
        "bg-[#060e1a]/95 border-r border-sky-500/10 flex flex-col h-screen sticky top-0 transition-all duration-200 ease-out z-30",
        expanded ? "w-52" : "w-14"
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

      <nav className="flex-1 px-1.5 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {primaryNavItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.startsWith(path);
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

      <div className="px-1.5 py-3 border-t border-sky-500/10 space-y-2">
        <UserButton showName={expanded} className="w-full" />
        <RoleSelector expanded={expanded} />
      </div>
    </aside>
  );
}

function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={VesselsLandingPage} />
        <Route path="/platform" component={CommandOverviewPage} />
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
        <Route path="/simulations" component={SimulationsPage} />
        <Route path="/fleet-apm" component={FleetAPMPage} />
        <Route path="/port-analytics" component={PortAnalyticsPage} />
        <Route path="/co2-emissions" component={CO2EmissionsPage} />
        <Route path="/risk-scoring" component={RiskScoringPage} />
        <Route path="/dark-vessel-detection" component={DarkVesselDetection} />
        <Route path="/sanctions-screening" component={SanctionsScreening} />
        <Route path="/cyber-threats" component={CyberThreatPanel} />
        <Route path="/incidents" component={IncidentReporting} />
        <Route path="/agent-insights" component={AgentInsightsPage} />
        <Route path="/use-cases">
          <div className="p-6 max-w-2xl mx-auto space-y-6">
            <h1 className="font-display text-2xl font-bold text-sky-50">Use Cases</h1>
            <p className="text-sky-400/50 text-sm">Vessels is designed for three core operational personas: fleet executives who need portfolio-level margin visibility, operations teams who manage exceptions and ETA deviations in real time, and commercial teams tracking charter performance and voyage P&L.</p>
            <div className="grid gap-4">
              {[{ title: "Fleet Executive", desc: "Strategic fleet position — utilization, TCE, margin, and exception exposure at a glance." }, { title: "Fleet Operations", desc: "Real-time exception triage, vessel status, ETA monitoring, and maintenance readiness." }, { title: "Commercial", desc: "Voyage charter performance, route profitability, and delay cost impact per voyage." }].map(u => (
                <div key={u.title} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
                  <p className="text-sm font-semibold text-sky-100">{u.title}</p>
                  <p className="text-xs text-sky-400/50 mt-1">{u.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Route>
        <Route path="/contact">
          <div className="p-6 max-w-xl mx-auto space-y-4">
            <h1 className="font-display text-2xl font-bold text-sky-50">Contact</h1>
            <p className="text-sky-400/50 text-sm">For fleet demo requests, commercial inquiries, and integration questions:</p>
            <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4 space-y-2">
              {[{ label: "Maritime Operations", value: "maritime@vessels.io" }, { label: "Commercial Enquiries", value: "commercial@vessels.io" }, { label: "Demo Request", value: "demo@vessels.io" }].map(c => (
                <div key={c.label} className="flex items-center gap-3">
                  <span className="text-[10px] text-sky-400/40 w-32 shrink-0">{c.label}</span>
                  <span className="text-xs font-mono text-sky-300">{c.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Route>
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
  { id: "nav-landing", label: "Vessels Home", icon: "🚢", group: "Navigation", keywords: ["landing", "home", "start"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/"); } },
  { id: "nav-platform", label: "Command Overview", icon: "📊", group: "Navigation", keywords: ["dashboard", "overview", "kpi"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/platform"); } },
  { id: "nav-fleet", label: "Fleet Map", icon: "🗺️", group: "Navigation", keywords: ["map", "fleet", "positions"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/fleet"); } },
  { id: "nav-vessels-list", label: "Vessel Roster", icon: "📋", group: "Navigation", keywords: ["list", "roster", "vessels"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/vessels-list"); } },
  { id: "nav-exceptions", label: "Exceptions Center", icon: "⚠️", group: "Navigation", keywords: ["exceptions", "alerts", "issues"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/exceptions"); } },
  { id: "nav-economics", label: "Voyage Economics", icon: "💰", group: "Navigation", keywords: ["economics", "revenue", "margin"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/economics"); } },
  { id: "nav-maintenance", label: "Maintenance Readiness", icon: "🔧", group: "Navigation", keywords: ["maintenance", "readiness", "health"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/maintenance"); } },
  { id: "nav-command", label: "Command Mode", icon: "🎯", group: "Navigation", keywords: ["command", "operational", "focused"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/command"); } },
  { id: "nav-analytics", label: "Performance Analytics", icon: "📈", group: "Navigation", keywords: ["analytics", "performance", "trends"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/analytics"); } },
  { id: "app-firestorm", label: "Switch to Firestorm", icon: "🔥", group: "Switch App", description: "Security Simulation", action: () => { window.location.href = "/firestorm/"; } },
  { id: "app-inca", label: "Switch to INCA", icon: "🧠", group: "Switch App", description: "AI Research", action: () => { window.location.href = "/inca/"; } },
];

const vesselsShortcuts: KeyboardShortcut[] = [
  { key: "P", description: "Go to Command Overview", category: "Navigation" },
  { key: "F", description: "Go to Fleet Map", category: "Navigation" },
  { key: "E", description: "Go to Exceptions Center", category: "Navigation" },
  { key: "C", description: "Go to Command Mode", category: "Navigation" },
];

function AppShell({ cmdOpen, setCmdOpen }: { cmdOpen: boolean; setCmdOpen: (v: boolean) => void }) {
  const [location] = useLocation();
  const isPublicHome = location === "/home";

  if (isPublicHome) {
    return (
      <Suspense fallback={<PageLoader />}>
        <VesselsHome />
      </Suspense>
    );
  }

  return (
    <PowerUserProvider shortcuts={vesselsShortcuts} appName="Vessels" accentColor="#0ea5e9">
      <div className="flex flex-col h-screen bg-[#060e1a]">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-sky-500 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium">
          Skip to main content
        </a>
        <EcosystemNav currentAppId="vessels" currentAppName="Vessels Maritime Intelligence" accentColor="#0ea5e9" />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-auto min-w-0">
            <DemoModeBanner />
            <main id="main-content" className="flex-1 overflow-auto" tabIndex={-1}>
              <AppRouter />
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
      <IncaAgentIndicator agentName="Maritime Analyst" systemType="inti" currentTask="Scanning AIS transponder anomalies across fleet" confidence={0.91} />
    </PowerUserProvider>
  );
}

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(vesselsCommands);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppShell cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />
          <WelcomeOverlay
            appId="vessels"
            appName="Vessels"
            subtitle="Maritime Intelligence Platform"
            description="Real-time maritime operations with AIS tracking, sanctions screening, dark vessel detection, and port congestion forecasting across global shipping lanes."
            accentColor="#0ea5e9"
            icon={Ship}
            features={[
              { icon: Globe, title: "Fleet Tracking", description: "Live AIS positions for vessels worldwide with behavioral AI scoring" },
              { icon: EyeOff, title: "Dark Vessels", description: "Detect AIS manipulation and signal gaps in high-risk zones" },
              { icon: ShieldAlert, title: "Sanctions Screening", description: "Real-time OFAC and EU sanctions list matching" },
              { icon: Anchor, title: "Port Analytics", description: "Congestion forecasting and wait time prediction" },
            ]}
          />
        </WouterRouter>
      </AuthProvider>
      <AgentCopilot config={helmsmanConfig} />
    </QueryClientProvider>
  );
}

export default App;
