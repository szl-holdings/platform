import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUserPreferences } from "@szl-holdings/shared-ui/use-user-preferences";
import {
  LayoutDashboard, AlertTriangle, GitBranch, Activity,
  Thermometer, Layers, ChevronRight, Menu, X, BookOpen, Brain,
  ChevronDown, Zap, Shield, Users, Radio, Network, Workflow,
  Terminal, Library, Lock, FlaskConical, Compass
} from "lucide-react";


// New 9 flagship surfaces + Decision Twin
const OverviewPage = lazy(() => import("@/pages/overview"));
const OnboardingPage = lazy(() => import("@/pages/onboarding"));
const SignalsConsolePage = lazy(() => import("@/pages/signals-console"));
const DecisionTwinPage = lazy(() => import("@/pages/decision-twin"));
const EntityGraphPage = lazy(() => import("@/pages/entity-graph"));
const DecisionCenterPage = lazy(() => import("@/pages/decision-center"));
const WorkflowHealthPage = lazy(() => import("@/pages/workflow-health"));
const RunConsolePage = lazy(() => import("@/pages/run-console"));
const EvidenceExplorerPage = lazy(() => import("@/pages/evidence-explorer"));
const PolicyCenterPage = lazy(() => import("@/pages/policy-center"));
const EvalStudioPage = lazy(() => import("@/pages/eval-studio"));

// Legacy surfaces (kept for historical nav)
const OwnershipDriftPage = lazy(() => import("@/pages/ownership-drift"));
const PressureMapPage = lazy(() => import("@/pages/pressure-map"));
const ActionDebtPage = lazy(() => import("@/pages/action-debt"));
const DecisionReplayPage = lazy(() => import("@/pages/decision-replay"));
const BoardViewPage = lazy(() => import("@/pages/board-view"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60000 } },
});

const BASE = import.meta.env.BASE_URL ?? "/lyte/";

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <div className="w-5 h-5 border-2 border-amber-500/40 border-t-amber-400 rounded-full animate-spin" />
    </div>
  );
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: "red" | "amber" | "default";
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Command",
    items: [
      { label: "Get Started", href: "/onboarding", icon: <Compass className="w-3.5 h-3.5" />, badge: "NEW", badgeColor: "amber" },
      { label: "Overview", href: "/overview", icon: <LayoutDashboard className="w-3.5 h-3.5" />, badge: "6 critical", badgeColor: "red" },
      { label: "Signals Console", href: "/signals", icon: <Radio className="w-3.5 h-3.5" />, badge: "47", badgeColor: "red" },
      { label: "Entity Graph", href: "/entities", icon: <Network className="w-3.5 h-3.5" /> },
      { label: "Decision Center", href: "/decisions", icon: <Brain className="w-3.5 h-3.5" />, badge: "3 rec", badgeColor: "amber" },
      { label: "Decision Twin", href: "/decision-twin", icon: <GitBranch className="w-3.5 h-3.5" />, badge: "NEW", badgeColor: "amber" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Workflow Health", href: "/workflow-health", icon: <Workflow className="w-3.5 h-3.5" />, badge: "62%", badgeColor: "amber" },
      { label: "Run Console", href: "/runs", icon: <Terminal className="w-3.5 h-3.5" /> },
      { label: "Evidence Explorer", href: "/evidence", icon: <Library className="w-3.5 h-3.5" /> },
    ],
  },
  {
    label: "Governance",
    items: [
      { label: "Policy Center", href: "/policies", icon: <Lock className="w-3.5 h-3.5" /> },
      { label: "Eval Studio", href: "/eval", icon: <FlaskConical className="w-3.5 h-3.5" /> },
    ],
  },
  {
    label: "Legacy",
    items: [
      { label: "Board View", href: "/board", icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
      { label: "Ownership Drift", href: "/ownership-drift", icon: <GitBranch className="w-3.5 h-3.5" /> },
      { label: "Pressure Map", href: "/pressure-map", icon: <Thermometer className="w-3.5 h-3.5" /> },
      { label: "Action Debt", href: "/action-debt", icon: <Layers className="w-3.5 h-3.5" /> },
      { label: "Decision Replay", href: "/decision-replay", icon: <Activity className="w-3.5 h-3.5" /> },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap(g => g.items);

function Sidebar({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  const [location] = useLocation();

  const BADGE_COLOR_MAP = {
    red: "text-red-400 bg-red-500/8 border-red-500/20",
    amber: "text-amber-400 bg-amber-500/8 border-amber-500/20",
    default: "text-amber-400/60 bg-amber-500/8 border-amber-500/15",
  };

  return (
    <aside
      className="flex flex-col h-full border-r border-amber-500/10 bg-[hsl(220_30%_4%)] transition-all duration-300"
      style={{ width: expanded ? 220 : 56 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 h-14 border-b border-amber-500/10 shrink-0">
        <div className="w-7 h-7 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
        </div>
        {expanded && (
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-amber-100 font-display tracking-tight">Lyte</p>
            <p className="text-[10px] text-amber-400/50 font-mono">Decision Intelligence</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto p-1 rounded hover:bg-amber-500/5 text-amber-400/40 hover:text-amber-300 transition-colors shrink-0"
          aria-label="Toggle sidebar"
        >
          {expanded ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 rotate-90" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            {expanded && (
              <p className="text-[9px] font-mono text-amber-400/25 uppercase tracking-widest px-2 py-1.5">{group.label}</p>
            )}
            {!expanded && <div className="h-1" />}
            {group.items.map(item => {
              const active = location === item.href || location.startsWith(item.href + "/");
              const badgeClass = BADGE_COLOR_MAP[item.badgeColor ?? "default"];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-2 py-2 rounded-md text-xs transition-all group relative ${
                    active
                      ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                      : "text-amber-400/50 hover:text-amber-200 hover:bg-amber-500/5 border border-transparent"
                  }`}
                >
                  <span className={active ? "text-amber-400" : "text-amber-400/40 group-hover:text-amber-400"}>
                    {item.icon}
                  </span>
                  {expanded && (
                    <>
                      <span className="flex-1 truncate font-medium">{item.label}</span>
                      {item.badge && (
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${badgeClass}`}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {!expanded && item.badge && item.badgeColor === "red" && (
                    <span className="absolute right-0.5 top-0.5 w-1.5 h-1.5 rounded-full bg-red-400" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {expanded && (
        <div className="px-3 py-3 border-t border-amber-500/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Users className="w-3 h-3 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] text-amber-200/70">Demo Mode</p>
              <p className="text-[9px] text-amber-400/40 font-mono">LYTE-SEED-v2</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { prefs, setPreference, isLoaded } = useUserPreferences();
  const [sidebarExpanded, setSidebarExpanded] = useState(() => !prefs.sidebar_collapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const userOverriddenSidebarRef = useRef(false);

  useEffect(() => {
    if (isLoaded && !userOverriddenSidebarRef.current) {
      setSidebarExpanded(!prefs.sidebar_collapsed);
    }
  }, [isLoaded, prefs.sidebar_collapsed]);

  const toggleSidebar = useCallback(() => {
    userOverriddenSidebarRef.current = true;
    setSidebarExpanded((prev) => {
      const next = !prev;
      setPreference("sidebar_collapsed", !next);
      return next;
    });
  }, [setPreference]);

  const currentPage = ALL_NAV_ITEMS.find(n => location === n.href || location.startsWith(n.href + "/"));

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar expanded={sidebarExpanded} onToggle={toggleSidebar} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 flex flex-col w-56">
            <Sidebar expanded onToggle={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-amber-500/10 flex items-center gap-3 px-4 shrink-0">
          <button
            className="md:hidden p-1.5 rounded text-amber-400/50 hover:text-amber-300 hover:bg-amber-500/5 transition-colors"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-xs text-amber-400/40 font-mono">
            <span>LYTE</span>
            {currentPage && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-amber-300/70">{currentPage.label}</span>
              </>
            )}
            {!currentPage && location === "/" && <span className="text-amber-300/70">Platform</span>}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="proof-badge">
              <Shield className="w-2.5 h-2.5" />
              LYTE-PROOF
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-amber-500/15 bg-amber-500/5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] text-amber-400/70 font-mono">LIVE</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className={`flex-1 overflow-y-auto ${location === "/entities" ? "overflow-hidden flex flex-col" : ""}`}>
          <Suspense fallback={<PageLoader />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function DashboardRoutes() {
  return (
    <AppShell>
      <Switch>
        {/* Onboarding wizard (FLOW-001) */}
        <Route path="/onboarding" component={OnboardingPage} />
        {/* 9 flagship surfaces */}
        <Route path="/overview" component={OverviewPage} />
        <Route path="/signals" component={SignalsConsolePage} />
        <Route path="/entities" component={EntityGraphPage} />
        <Route path="/decisions" component={DecisionCenterPage} />
        <Route path="/decision-twin" component={DecisionTwinPage} />
        <Route path="/workflow-health" component={WorkflowHealthPage} />
        <Route path="/runs" component={RunConsolePage} />
        <Route path="/evidence" component={EvidenceExplorerPage} />
        <Route path="/policies" component={PolicyCenterPage} />
        <Route path="/eval" component={EvalStudioPage} />
        {/* Legacy surfaces */}
        <Route path="/board" component={BoardViewPage} />
        <Route path="/ownership-drift" component={OwnershipDriftPage} />
        <Route path="/pressure-map" component={PressureMapPage} />
        <Route path="/action-debt" component={ActionDebtPage} />
        <Route path="/decision-replay" component={DecisionReplayPage} />
        <Route path="/decision-replay/:id" component={DecisionReplayPage} />
        {/* Default: redirect to overview */}
        <Route component={OverviewPage} />
      </Switch>
    </AppShell>
  );
}

export default function App() {
  const base = BASE.replace(/\/$/, "");
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={base}>
        <Switch>
          <Route path="/*" component={DashboardRoutes} />
        </Switch>
      </WouterRouter>
    </QueryClientProvider>
  );
}
