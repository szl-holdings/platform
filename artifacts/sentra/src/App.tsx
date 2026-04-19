import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@szl-holdings/shared-ui/ui/sonner";
import { AnalyticsProvider } from "@szl-holdings/shared-ui/analytics-provider";
import { useUserPreferences, useEffectiveAccent } from "@szl-holdings/shared-ui/use-user-preferences";
import {
  LayoutDashboard, ShieldAlert, Shield, Activity, Zap, Cpu,
  AlertTriangle, RotateCcw, BarChart3, Lock, ShieldCheck, Menu
} from "lucide-react";
import { EcosystemNav } from "@szl-holdings/shared-ui/ecosystem-nav";
import { cn } from "@szl-holdings/shared-ui/utils";
import { SidebarNav, type SidebarNavSection } from "@szl-holdings/shared-ui/design-system";
import { DashboardShell as SharedDashboardShell } from "@szl-holdings/shared-ui/design-system";

const DashboardPage = lazy(() => import("@/pages/dashboard"));
const ResilienceScorecardPage = lazy(() => import("@/pages/resilience-scorecard"));
const ThreatOverviewPage = lazy(() => import("@/pages/threat-overview"));
const AssetRiskGraphPage = lazy(() => import("@/pages/asset-risk-graph"));
const RecoveryReadinessPage = lazy(() => import("@/pages/recovery-readiness"));
const IncidentCommanderPage = lazy(() => import("@/pages/incident-commander"));
const ExposureBoardPage = lazy(() => import("@/pages/exposure-board"));
const ControlDriftPage = lazy(() => import("@/pages/control-drift"));
const DecisionCenterPage = lazy(() => import("@/pages/decision-center"));
const TrustProvenancePage = lazy(() => import("@/pages/trust-provenance"));
const AlertsPage = lazy(() => import("@/pages/alerts"));
const ApprovalsPage = lazy(() => import("@/pages/approvals"));
const SentraLandingPage = lazy(() => import("@/pages/sentra-landing"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60000 } },
});

const SENTRA_BRAND_ACCENT = "#ef4444";

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-red-500/40 border-t-red-400 rounded-full animate-spin" />
    </div>
  );
}

function SentraSidebarContent({
  expanded,
  onMobileClose,
  onToggleCollapse,
}: {
  expanded: boolean;
  onMobileClose?: () => void;
  onToggleCollapse?: () => void;
}) {
  const [location, navigate] = useLocation();
  const accent = useEffectiveAccent(SENTRA_BRAND_ACCENT);

  const sections: SidebarNavSection[] = [
    {
      id: "os-layer",
      label: "OS Layer",
      items: [
        { id: "decision-center", label: "Decision Center", href: "/decision-center", icon: <Zap className="w-3.5 h-3.5" /> },
      ],
    },
    {
      id: "core",
      label: "Core",
      items: [
        { id: "/dashboard", label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
        { id: "/threats", label: "Threat Overview", href: "/threats", icon: <ShieldAlert className="w-3.5 h-3.5" /> },
        { id: "/assets", label: "Asset Risk Graph", href: "/assets", icon: <Cpu className="w-3.5 h-3.5" /> },
        { id: "/recovery", label: "Recovery Readiness", href: "/recovery", icon: <RotateCcw className="w-3.5 h-3.5" /> },
        { id: "/incident", label: "Incident Commander", href: "/incident", icon: <Activity className="w-3.5 h-3.5" /> },
        { id: "/exposure", label: "Exposure Board", href: "/exposure", icon: <BarChart3 className="w-3.5 h-3.5" /> },
        { id: "/controls", label: "Control Drift", href: "/controls", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
      ],
    },
    {
      id: "operations",
      label: "Operations",
      items: [
        { id: "/alerts", label: "Alerts", href: "/alerts", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
        { id: "/approvals", label: "Approvals", href: "/approvals", icon: <Shield className="w-3.5 h-3.5" /> },
        { id: "/trust", label: "Trust & Provenance", href: "/trust", icon: <Lock className="w-3.5 h-3.5" /> },
      ],
    },
  ];

  return (
    <SidebarNav
      sections={sections}
      currentPath={location}
      accentColor={accent}
      collapsed={!expanded}
      onNavigate={(item) => {
        if (item.href) navigate(item.href);
        onMobileClose?.();
      }}
      header={
        <div className="flex items-center gap-2.5 cursor-pointer">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.12)" }}
          >
            <Shield className="w-4 h-4 text-red-400" />
          </div>
          {expanded && (
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-red-50 truncate tracking-tight">Sentra</h1>
              <p className="text-[10px] truncate font-mono uppercase tracking-wider text-red-400/40">
                Cyber Resilience
              </p>
            </div>
          )}
        </div>
      }
      footer={
        expanded ? (
          <div className="space-y-2">
            <div
              className="rounded-lg px-3 py-3"
              style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.08)" }}
            >
              <div className="text-[9px] uppercase tracking-widest font-medium mb-2 text-red-400/50">
                Posture Status
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/35">Recovery posture</span>
                  <span className="text-[9px] font-mono text-red-400">42% critical</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/35">Active incidents</span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-[9px] font-mono text-red-400">1 open</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/35">Control drift</span>
                  <span className="text-[9px] font-mono text-amber-400">3 gaps</span>
                </div>
              </div>
            </div>
            <button
              onClick={onToggleCollapse}
              className="flex items-center justify-center w-full py-1 text-[10px] rounded transition-colors hover:bg-white/5 text-red-400/40"
              aria-label="Collapse sidebar"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M8 2L5 6l3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={onToggleCollapse}
            className="flex items-center justify-center w-7 h-7 mx-auto rounded transition-colors hover:bg-white/5 text-red-400/40"
            aria-label="Expand sidebar"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M4 2l3 4-3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )
      }
    />
  );
}

function DashboardRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/resilience" component={ResilienceScorecardPage} />
        <Route path="/threats" component={ThreatOverviewPage} />
        <Route path="/assets" component={AssetRiskGraphPage} />
        <Route path="/recovery" component={RecoveryReadinessPage} />
        <Route path="/incident" component={IncidentCommanderPage} />
        <Route path="/exposure" component={ExposureBoardPage} />
        <Route path="/controls" component={ControlDriftPage} />
        <Route path="/decision-center" component={DecisionCenterPage} />
        <Route path="/trust" component={TrustProvenancePage} />
        <Route path="/alerts" component={AlertsPage} />
        <Route path="/approvals" component={ApprovalsPage} />
        <Route path="/" component={SentraLandingPage} />
        <Route>
          <div className="flex items-center justify-center h-full">
            <p className="text-red-400/40">Page not found</p>
          </div>
        </Route>
      </Switch>
    </Suspense>
  );
}

function AppShell({
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  onToggleCollapse,
  sidebarHovered,
  setSidebarHovered,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  sidebarCollapsed: boolean;
  onToggleCollapse: () => void;
  sidebarHovered: boolean;
  setSidebarHovered: (v: boolean) => void;
}) {
  const [location] = useLocation();
  const accent = useEffectiveAccent(SENTRA_BRAND_ACCENT);
  const sidebarExpanded = !sidebarCollapsed || sidebarHovered;

  if (location.startsWith("/resilience")) {
    return (
      <Suspense fallback={<div style={{ height: "100vh", background: "#060e1a" }} />}>
        <ResilienceScorecardPage />
      </Suspense>
    );
  }

  if (location === "/" || location === "") {
    return (
      <>
        <EcosystemNav
          currentAppId="sentra"
          currentAppName="Sentra Cyber Resilience"
          accentColor={accent}
        />
        <Suspense fallback={<div style={{ height: "100vh", background: "#0a0606" }} />}>
          <SentraLandingPage />
        </Suspense>
        <Toaster position="bottom-right" theme="dark" />
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: "#060e1a" }}>
      <EcosystemNav
        currentAppId="sentra"
        currentAppName="Sentra Cyber Resilience"
        accentColor={accent}
      />
      <SharedDashboardShell
        sidebar={
          <SentraSidebarContent
            expanded={sidebarExpanded}
            onMobileClose={() => setSidebarOpen(false)}
            onToggleCollapse={onToggleCollapse}
          />
        }
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        sidebarWidth={sidebarExpanded ? "13rem" : "3.5rem"}
        sidebarEvents={{
          onMouseEnter: () => setSidebarHovered(true),
          onMouseLeave: () => setSidebarHovered(false),
        }}
        theme={{ sidebarBg: "#060e1a", pageBg: "#060e1a", headerBg: "rgba(6,14,26,0.92)" }}
        accentColor={accent}
        topbar={
          <div className="flex items-center gap-3 w-full md:hidden">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded transition-colors text-red-400/50"
              aria-label="Toggle navigation"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono uppercase tracking-wider text-red-400/80">
              Sentra Cyber Resilience
            </span>
          </div>
        }
      >
        <main data-szl-shell-main className="flex-1 overflow-auto h-full">
          <DashboardRouter />
        </main>
      </SharedDashboardShell>
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { prefs, setPreference, isLoaded } = useUserPreferences();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => prefs.sidebar_collapsed);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const userOverriddenSidebarRef = useRef(false);

  useEffect(() => {
    if (isLoaded && !userOverriddenSidebarRef.current) {
      setSidebarCollapsed(prefs.sidebar_collapsed);
    }
  }, [isLoaded, prefs.sidebar_collapsed]);

  const toggleCollapsed = useCallback(() => {
    userOverriddenSidebarRef.current = true;
    setSidebarCollapsed((prev) => {
      const next = !prev;
      setPreference("sidebar_collapsed", next);
      return next;
    });
  }, [setPreference]);

  return (
    <AnalyticsProvider appName="sentra">
      <QueryClientProvider client={queryClient}>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppShell
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            sidebarCollapsed={sidebarCollapsed}
            onToggleCollapse={toggleCollapsed}
            sidebarHovered={sidebarHovered}
            setSidebarHovered={setSidebarHovered}
          />
        </WouterRouter>
      </QueryClientProvider>
    </AnalyticsProvider>
  );
}
