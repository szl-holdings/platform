import { lazy, Suspense, useState } from "react";
import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  LayoutDashboard, AlertTriangle, GitBranch, TrendingUp, Activity,
  Thermometer, Layers, ChevronRight, Menu, X, BookOpen, Brain,
  ChevronDown, Zap, Shield, Users
} from "lucide-react";

const LandingPage = lazy(() => import("@/pages/landing"));
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
}

const NAV_ITEMS: NavItem[] = [
  { label: "Board View", href: "/board", icon: <LayoutDashboard className="w-3.5 h-3.5" />, badge: "6 risks" },
  { label: "Ownership Drift", href: "/ownership-drift", icon: <GitBranch className="w-3.5 h-3.5" />, badge: "6" },
  { label: "Pressure Map", href: "/pressure-map", icon: <Thermometer className="w-3.5 h-3.5" /> },
  { label: "Action Debt Index", href: "/action-debt", icon: <Layers className="w-3.5 h-3.5" />, badge: "43" },
  { label: "Decision Replay", href: "/decision-replay", icon: <Activity className="w-3.5 h-3.5" /> },
];

function Sidebar({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  const [location] = useLocation();

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
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {expanded && (
          <p className="text-[9px] font-mono text-amber-400/30 uppercase tracking-widest px-2 pb-2">Surfaces</p>
        )}
        {NAV_ITEMS.map((item) => {
          const href = `${BASE.replace(/\/$/, "")}${item.href}`;
          const active = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-2 py-2 rounded-md text-xs transition-all group relative ${
                active
                  ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                  : "text-amber-400/50 hover:text-amber-200 hover:bg-amber-500/5"
              }`}
            >
              <span className={active ? "text-amber-400" : "text-amber-400/40 group-hover:text-amber-400"}>
                {item.icon}
              </span>
              {expanded && (
                <>
                  <span className="flex-1 truncate font-medium">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm border ${
                      active
                        ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                        : "bg-amber-500/8 border-amber-500/15 text-amber-400/60"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {!expanded && item.badge && (
                <span className="absolute right-0.5 top-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </Link>
          );
        })}

        <div className="pt-3 mt-3 border-t border-amber-500/10" />
        {expanded && (
          <p className="text-[9px] font-mono text-amber-400/30 uppercase tracking-widest px-2 pb-2">Platform</p>
        )}
        <Link
          href="/"
          className="flex items-center gap-2.5 px-2 py-2 rounded-md text-xs text-amber-400/40 hover:text-amber-200 hover:bg-amber-500/5 transition-all"
        >
          <BookOpen className="w-3.5 h-3.5 shrink-0" />
          {expanded && <span className="truncate">About Lyte</span>}
        </Link>
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
              <p className="text-[9px] text-amber-400/40 font-mono">ALLOY-SEED-v1</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  const currentPage = NAV_ITEMS.find(n => location === n.href || location.startsWith(n.href + "/"));

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar expanded={sidebarExpanded} onToggle={() => setSidebarExpanded(v => !v)} />
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
            {location === "/" && <span className="text-amber-300/70">Platform</span>}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="proof-badge">
              <Shield className="w-2.5 h-2.5" />
              ALLOY-PROOF
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-amber-500/15 bg-amber-500/5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] text-amber-400/70 font-mono">LIVE</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
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
        <Route path="/board" component={BoardViewPage} />
        <Route path="/ownership-drift" component={OwnershipDriftPage} />
        <Route path="/pressure-map" component={PressureMapPage} />
        <Route path="/action-debt" component={ActionDebtPage} />
        <Route path="/decision-replay" component={DecisionReplayPage} />
        <Route path="/decision-replay/:id" component={DecisionReplayPage} />
        <Route component={LandingPage} />
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
