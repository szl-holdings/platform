import { lazy, Suspense, useState } from "react";
import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@workspace/shared-ui/ui/sonner";
import { UserButton } from "@workspace/shared-ui/UserButton";
import { Flame, Shield, Target, BarChart3, FileText, Activity, AlertTriangle, Bell, Grid3X3, ClipboardCheck, Search, Rss, Layers, Users, ChevronRight, ShieldCheck, Building2, TrendingUp } from "lucide-react";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { sentinelConfig } from "@workspace/shared-ui/copilot-configs";
import { cn } from "@workspace/shared-ui/utils";

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

const ReadinessDashboard = lazy(() => import("@/pages/compliance/readiness-dashboard"));
const FrameworkScorecards = lazy(() => import("@/pages/compliance/framework-scorecards"));
const ComplianceRisks = lazy(() => import("@/pages/compliance/compliance-risks"));
const VendorRisk = lazy(() => import("@/pages/compliance/vendor-risk"));
const MilestonesTrends = lazy(() => import("@/pages/compliance/milestones-trends"));
const ReadinessAIInsights = lazy(() => import("@/pages/compliance/readiness-ai-insights"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60000 } },
});

const primaryNavItems = [
  { path: "/", label: "SOC Overview", icon: Activity },
  { path: "/incidents", label: "Incidents", icon: Shield },
  { path: "/alerts", label: "Alerts", icon: Bell },
  { path: "/mitre-attack", label: "MITRE ATT&CK", icon: Grid3X3 },
  { path: "/threat-intel", label: "Threat Intel", icon: AlertTriangle },
  { path: "/findings", label: "Findings", icon: Target },
];

const secondaryNavItems = [
  { path: "/xdr-console", label: "XDR Console", icon: Layers },
  { path: "/threat-hunting", label: "Threat Hunting", icon: Search },
  { path: "/identity-threat", label: "Identity Threats", icon: Users },
  { path: "/forensics", label: "Forensics", icon: Flame },
  { path: "/executive-risk", label: "Executive Risk", icon: BarChart3 },
  { path: "/compliance", label: "Compliance", icon: ClipboardCheck },
  { path: "/risk-scoring", label: "Risk Scoring", icon: BarChart3 },
  { path: "/threat-feed", label: "Threat Feed", icon: Rss },
  { path: "/reports", label: "Reports", icon: FileText },
  { path: "/sentinel", label: "Sentinel Watch", icon: Search },
  { path: "/watchlists", label: "Watchlists", icon: Target },
  { path: "/observability", label: "Observability", icon: Search },
];

const complianceNavItems = [
  { path: "/cr/dashboard", label: "Readiness Index", icon: ShieldCheck },
  { path: "/cr/scorecards", label: "Framework Scorecards", icon: ClipboardCheck },
  { path: "/cr/risks", label: "Risk Register", icon: AlertTriangle },
  { path: "/cr/vendor-risk", label: "Vendor Risk", icon: Building2 },
  { path: "/cr/milestones", label: "Milestones & Trends", icon: TrendingUp },
  { path: "/cr/ai-insights", label: "AI Insights", icon: Target },
];

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

interface AppHealthSummary {
  services: { name: string; status: string }[];
  summary: { total: number; liveConfigured: number; mockedDemoMode: number; manualRequired: number };
}

function DemoModeBanner() {
  const { data } = useQuery<AppHealthSummary>({
    queryKey: ["app-health-firestorm"],
    queryFn: () => fetch("/api/services/health/app/firestorm").then((r) => r.json()),
    refetchInterval: 60000,
  });

  if (!data) return null;
  const hasDemoMode = data.summary.mockedDemoMode > 0;
  const hasUnhealthy = data.summary.manualRequired > 0;
  if (!hasDemoMode && !hasUnhealthy) return null;

  if (hasUnhealthy) {
    return (
      <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-1.5 flex items-center gap-2 shrink-0">
        <span className="text-[11px] text-red-400">{data.summary.manualRequired} integration(s) not configured</span>
      </div>
    );
  }

  return (
    <div className="border-b border-orange-500/10 px-4 py-1 flex items-center gap-2 shrink-0">
      <span className="text-[10px] font-mono text-orange-400/50 px-2 py-0.5 rounded-full border border-orange-500/20 bg-orange-500/5">DEMO</span>
      <span className="text-[10px] text-orange-400/40">Simulated data</span>
    </div>
  );
}

function Sidebar() {
  const [location] = useLocation();
  const [moreExpanded, setMoreExpanded] = useState(false);
  const [complianceExpanded, setComplianceExpanded] = useState(location.startsWith("/cr"));

  return (
    <aside className="w-56 bg-[#09080f]/95 border-r border-orange-500/10 flex flex-col h-screen sticky top-0">
      <div className="px-4 py-4 border-b border-orange-500/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h1 className="font-display text-sm font-bold text-orange-50">Firestorm</h1>
            <p className="text-[10px] text-orange-400/50">Security Operations</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {primaryNavItems.map(({ path, label, icon: Icon }) => {
          const isActive = path === "/" ? location === "/" : location.startsWith(path);
          return (
            <Link key={path} href={path}>
              <div className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer relative",
                isActive
                  ? "bg-orange-500/10 text-orange-300"
                  : "text-orange-400/50 hover:text-orange-200 hover:bg-orange-500/5"
              )}>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-orange-400 rounded-r-full" />
                )}
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
              </div>
            </Link>
          );
        })}

        <div className="pt-2">
          <button
            onClick={() => setMoreExpanded(!moreExpanded)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-orange-400/40 hover:text-orange-300 hover:bg-orange-500/5 transition-all w-full"
          >
            <ChevronRight className={cn("w-3.5 h-3.5 shrink-0 transition-transform", moreExpanded && "rotate-90")} />
            SOC Tools
          </button>
          {moreExpanded && (
            <div className="mt-0.5 space-y-0.5">
              {secondaryNavItems.map(({ path, label, icon: Icon }) => {
                const isActive = path === "/" ? location === "/" : location.startsWith(path);
                return (
                  <Link key={path} href={path}>
                    <div className={cn(
                      "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 cursor-pointer relative ml-2",
                      isActive
                        ? "bg-orange-500/10 text-orange-300"
                        : "text-orange-400/40 hover:text-orange-200 hover:bg-orange-500/5"
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

        <div className="pt-2">
          <button
            onClick={() => setComplianceExpanded(!complianceExpanded)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-orange-400/40 hover:text-orange-300 hover:bg-orange-500/5 transition-all w-full"
          >
            <ChevronRight className={cn("w-3.5 h-3.5 shrink-0 transition-transform", complianceExpanded && "rotate-90")} />
            <span className="flex-1 text-left">Compliance & Readiness</span>
            {location.startsWith("/cr") && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />}
          </button>
          {complianceExpanded && (
            <div className="mt-0.5 space-y-0.5">
              {complianceNavItems.map(({ path, label, icon: Icon }) => {
                const isActive = location.startsWith(path);
                return (
                  <Link key={path} href={path}>
                    <div className={cn(
                      "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 cursor-pointer relative ml-2",
                      isActive
                        ? "bg-orange-500/10 text-orange-300"
                        : "text-orange-400/40 hover:text-orange-200 hover:bg-orange-500/5"
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
      </nav>

      <div className="px-4 py-3 border-t border-orange-500/10 space-y-2">
        <UserButton showName className="w-full" />
        <div className="flex items-center gap-2 text-[10px] text-orange-400/30">
          <Flame className="w-3 h-3" />
          <span>SZL Holdings Platform</span>
        </div>
      </div>
    </aside>
  );
}

function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={SOCDashboard} />
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
        <Route>
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Page not found</p>
          </div>
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <div className="flex flex-col h-screen bg-background">
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-orange-500 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium">
            Skip to main content
          </a>
          <EcosystemNav currentAppId="firestorm" currentAppName="Firestorm Security Simulation" accentColor="#ef4444" />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-auto">
              <DemoModeBanner />
              <main id="main-content" className="flex-1 overflow-auto" tabIndex={-1}>
                <AppRouter />
              </main>
            </div>
          </div>
        </div>
        <Toaster />
      </WouterRouter>
      <AgentCopilot config={sentinelConfig} />
    </QueryClientProvider>
  );
}

export default App;
