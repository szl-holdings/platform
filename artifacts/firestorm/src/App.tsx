import { lazy, Suspense, useState } from "react";
import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@workspace/shared-ui/ui/sonner";
import { UserButton } from "@workspace/shared-ui/UserButton";
import { Flame, Shield, Target, BarChart3, FileText, Activity, AlertTriangle, Bell, Grid3X3, ClipboardCheck, Search, Rss, Layers, Users, ChevronRight, ShieldCheck, Building2, TrendingUp, Brain as BrainIcon } from "lucide-react";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { sentinelConfig } from "@workspace/shared-ui/copilot-configs";
import { cn } from "@workspace/shared-ui/utils";
import { CommandPalette, useCommandPalette, type CommandItem } from "@workspace/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@workspace/shared-ui/keyboard-shortcuts";
import { WelcomeOverlay } from "@workspace/shared-ui/WelcomeOverlay";

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
  { path: "/sacsayhuaman-shield", label: "Sacsayhuamán Shield", icon: ShieldCheck },
  { path: "/agent-insights", label: "Agent Insights", icon: BrainIcon },
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

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}


function Sidebar() {
  const [location] = useLocation();
  const [moreExpanded, setMoreExpanded] = useState(false);
  const [complianceExpanded, setComplianceExpanded] = useState(location.startsWith("/cr"));

  return (
    <aside className="w-56 bg-[#09080f]/95 border-r border-orange-500/10 flex flex-col h-screen sticky top-0">
      <div className="px-4 py-4 border-b border-primary/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-primary/8 border border-primary/14 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-sm font-semibold text-foreground tracking-tight">Firestorm</h1>
            <p className="text-[10px] text-primary/40 font-mono uppercase tracking-wider">Security Command</p>
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

      <div className="px-4 py-3 border-t border-primary/8 space-y-2">
        <UserButton showName className="w-full" />
        <div className="flex items-center gap-2 text-[10px] text-primary/25">
          <Flame className="w-3 h-3" />
          <span className="font-mono">SZL Holdings · SOC</span>
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
        <Route path="/sacsayhuaman-shield" component={SacsayhuamanShield} />
        <Route path="/adversary-emulation" component={AdversaryEmulation} />
        <Route path="/agent-insights" component={AgentInsightsPage} />
        <Route>
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Page not found</p>
          </div>
        </Route>
      </Switch>
    </Suspense>
  );
}

const firestormCommands: CommandItem[] = [
  { id: "nav-soc", label: "SOC Overview", icon: "🔴", group: "Navigation", keywords: ["dashboard", "home"], action: () => { window.location.hash = ""; window.location.pathname = window.location.pathname.replace(/\/[^/]*$/, "/"); } },
  { id: "nav-incidents", label: "Incidents", icon: "🛡️", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/incidents"); } },
  { id: "nav-alerts", label: "Alerts", icon: "🔔", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/alerts"); } },
  { id: "nav-mitre", label: "MITRE ATT&CK", icon: "🎯", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/mitre-attack"); } },
  { id: "nav-threat-intel", label: "Threat Intelligence", icon: "⚠️", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/threat-intel"); } },
  { id: "nav-findings", label: "Findings", icon: "🎯", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/findings"); } },
  { id: "nav-xdr", label: "XDR Console", icon: "🖥️", group: "SOC Tools", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/xdr-console"); } },
  { id: "nav-hunting", label: "Threat Hunting", icon: "🔍", group: "SOC Tools", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/threat-hunting"); } },
  { id: "nav-forensics", label: "Forensics Timeline", icon: "🔥", group: "SOC Tools", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/forensics"); } },
  { id: "nav-risk", label: "Risk Scoring", icon: "📊", group: "SOC Tools", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/risk-scoring"); } },
  { id: "nav-reports", label: "Reports", icon: "📄", group: "SOC Tools", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/reports"); } },
  { id: "nav-compliance", label: "Compliance Readiness", icon: "✅", group: "Compliance", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/cr/dashboard"); } },
  { id: "app-vessels", label: "Switch to Vessels", icon: "🚢", group: "Switch App", description: "Maritime Intelligence", action: () => { window.location.href = "/vessels/"; } },
  { id: "app-inca", label: "Switch to INCA", icon: "🧠", group: "Switch App", description: "AI Research", action: () => { window.location.href = "/inca/"; } },
  { id: "app-lyte", label: "Switch to Lyte", icon: "⚡", group: "Switch App", description: "Command Center", action: () => { window.location.href = "/lyte-command-center/"; } },
];

const firestormShortcuts: KeyboardShortcut[] = [
  { key: "I", description: "Go to Incidents", category: "Navigation" },
  { key: "A", description: "Go to Alerts", category: "Navigation" },
  { key: "T", description: "Go to Threat Intel", category: "Navigation" },
  { key: "R", description: "Go to Reports", category: "Navigation" },
];

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(firestormCommands);

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <PowerUserProvider shortcuts={firestormShortcuts} appName="Firestorm" accentColor="#ef4444">
          <div className="flex flex-col h-screen bg-background">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-orange-500 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium">
              Skip to main content
            </a>
            <EcosystemNav currentAppId="firestorm" currentAppName="Firestorm Cyber Command" accentColor="#ef4444" />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <div className="flex-1 flex flex-col overflow-auto">
                <main id="main-content" className="flex-1 overflow-auto" tabIndex={-1}>
                  <AppRouter />
                </main>
              </div>
            </div>
            <Toaster />
            <CommandPalette
              open={cmdOpen}
              onClose={() => setCmdOpen(false)}
              commands={firestormCommands}
              appName="Firestorm"
              accentColor="#ef4444"
            />
            <WelcomeOverlay
              appId="firestorm"
              appName="Firestorm"
              subtitle="Threat & Incident Command"
              description="Firestorm is a SOC-grade security command platform for teams who need to detect, triage, and respond — not just report. Full kill chain coverage, real-time incident management, and compliance readiness built for organisations where the cost of slow response is quantifiable."
              accentColor="#ef4444"
              icon={Flame}
              features={[
                { icon: Shield, title: "Incident command", description: "Real-time incident monitoring with response timer discipline. Threats are classified, attributed, and actioned — not just logged." },
                { icon: Target, title: "MITRE ATT&CK coverage", description: "Full kill chain mapping with visual heatmaps. Know where your coverage is and where adversaries can move undetected." },
                { icon: Search, title: "Threat hunting", description: "Natural language queries across event data. Surface attacker patterns before they trigger alerts." },
                { icon: Layers, title: "XDR correlation", description: "Correlated detection across endpoints, cloud, and network. One console for the signals that matter." },
              ]}
            />
          </div>
        </PowerUserProvider>
      </WouterRouter>
      <AgentCopilot config={sentinelConfig} />
    </QueryClientProvider>
  );
}

export default App;
