import { lazy, Suspense, useState } from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@szl-holdings/shared-ui/ui/sonner";
import { AnalyticsProvider } from "@szl-holdings/shared-ui";
import {
  LayoutDashboard, Scale, Clock, Network, BarChart3, ShieldAlert,
  Zap, Bell, CheckCircle2, Shield, Menu, Briefcase
} from "lucide-react";
import { EcosystemNav } from "@szl-holdings/shared-ui/ecosystem-nav";
import { SidebarNav, type SidebarNavSection } from "@szl-holdings/shared-ui/design-system";
import { DashboardShell as SharedDashboardShell } from "@szl-holdings/shared-ui/design-system";

const COUNSEL_ACCENT = "#8b5cf6";

const DashboardPage = lazy(() => import("./pages/dashboard"));
const MatterOverviewPage = lazy(() => import("./pages/matter-overview"));
const ObligationTimelinePage = lazy(() => import("./pages/obligation-timeline"));
const DependencyGraphPage = lazy(() => import("./pages/dependency-graph"));
const CounselPerformancePage = lazy(() => import("./pages/counsel-performance"));
const RiskExposureDeskPage = lazy(() => import("./pages/risk-exposure-desk"));
const DecisionCenterPage = lazy(() => import("./pages/decision-center"));

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-violet-100 mb-4">{title}</h1>
    <p className="text-violet-400/60">This operational surface is coming soon.</p>
  </div>
);

const AlertsPage = () => <PlaceholderPage title="Alerts" />;
const ApprovalsPage = () => <PlaceholderPage title="Approvals" />;
const TrustProvenancePage = () => <PlaceholderPage title="Trust & Provenance" />;

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60000 } },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-violet-500/40 border-t-violet-400 rounded-full animate-spin" />
    </div>
  );
}

function CounselSidebarContent({
  expanded,
  onMobileClose,
  onToggleCollapse,
}: {
  expanded: boolean;
  onMobileClose?: () => void;
  onToggleCollapse?: () => void;
}) {
  const [location, navigate] = useLocation();

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
        { id: "/", label: "Dashboard", href: "/", icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
        { id: "/matters", label: "Matter Overview", href: "/matters", icon: <Briefcase className="w-3.5 h-3.5" /> },
        { id: "/obligations", label: "Obligation Timeline", href: "/obligations", icon: <Clock className="w-3.5 h-3.5" /> },
        { id: "/dependencies", label: "Dependency Graph", href: "/dependencies", icon: <Network className="w-3.5 h-3.5" /> },
        { id: "/performance", label: "Counsel Performance", href: "/performance", icon: <Scale className="w-3.5 h-3.5" /> },
        { id: "/risk", label: "Risk & Exposure Desk", href: "/risk", icon: <ShieldAlert className="w-3.5 h-3.5" /> },
      ],
    },
    {
      id: "operations",
      label: "Operations",
      items: [
        { id: "/alerts", label: "Alerts", href: "/alerts", icon: <Bell className="w-3.5 h-3.5" /> },
        { id: "/approvals", label: "Approvals", href: "/approvals", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
        { id: "/trust", label: "Trust & Provenance", href: "/trust", icon: <Shield className="w-3.5 h-3.5" /> },
      ],
    },
  ];

  return (
    <SidebarNav
      sections={sections}
      currentPath={location}
      accentColor={COUNSEL_ACCENT}
      collapsed={!expanded}
      onNavigate={(item) => {
        if (item.href) navigate(item.href);
        onMobileClose?.();
      }}
      header={
        <div className="flex items-center gap-2.5 cursor-pointer">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
            style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.12)" }}
          >
            <Scale className="w-4 h-4 text-violet-400" />
          </div>
          {expanded && (
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-violet-50 truncate tracking-tight">Counsel</h1>
              <p className="text-[10px] truncate font-mono uppercase tracking-wider text-violet-400/40">
                Legal Matter Command
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
              style={{ background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.08)" }}
            >
              <div className="text-[9px] uppercase tracking-widest font-medium mb-2 text-violet-400/50">
                Matter Status
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/35">Active matters</span>
                  <span className="text-[9px] font-mono text-violet-400">4 matters</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/35">Urgent deadlines</span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-[9px] font-mono text-amber-400">2 in 14 days</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/35">Exposure</span>
                  <span className="text-[9px] font-mono text-red-400">$6.4M at risk</span>
                </div>
              </div>
            </div>
            <button
              onClick={onToggleCollapse}
              className="flex items-center justify-center w-full py-1 text-[10px] rounded transition-colors hover:bg-white/5 text-violet-400/40"
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
            className="flex items-center justify-center w-7 h-7 mx-auto rounded transition-colors hover:bg-white/5 text-violet-400/40"
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
        <Route path="/" component={DashboardPage} />
        <Route path="/matters" component={MatterOverviewPage} />
        <Route path="/obligations" component={ObligationTimelinePage} />
        <Route path="/dependencies" component={DependencyGraphPage} />
        <Route path="/performance" component={CounselPerformancePage} />
        <Route path="/risk" component={RiskExposureDeskPage} />
        <Route path="/decision-center" component={DecisionCenterPage} />
        <Route path="/alerts" component={AlertsPage} />
        <Route path="/approvals" component={ApprovalsPage} />
        <Route path="/trust" component={TrustProvenancePage} />
        <Route>
          <div className="flex items-center justify-center h-full">
            <p className="text-violet-400/40">Page not found</p>
          </div>
        </Route>
      </Switch>
    </Suspense>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);

  const sidebarExpanded = !sidebarCollapsed || sidebarHovered;

  return (
    <AnalyticsProvider appName="counsel">
      <QueryClientProvider client={queryClient}>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <div className="flex flex-col h-screen" style={{ background: "#0a0614" }}>
            <EcosystemNav
              currentAppId="counsel"
              currentAppName="Counsel Legal Matter Command"
              accentColor={COUNSEL_ACCENT}
            />
            <SharedDashboardShell
              sidebar={
                <CounselSidebarContent
                  expanded={sidebarExpanded}
                  onMobileClose={() => setSidebarOpen(false)}
                  onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
                />
              }
              mobileOpen={sidebarOpen}
              onMobileClose={() => setSidebarOpen(false)}
              sidebarWidth={sidebarExpanded ? "13rem" : "3.5rem"}
              sidebarEvents={{
                onMouseEnter: () => setSidebarHovered(true),
                onMouseLeave: () => setSidebarHovered(false),
              }}
              theme={{ sidebarBg: "#0a0614", pageBg: "#0a0614", headerBg: "rgba(10,6,20,0.92)" }}
              accentColor={COUNSEL_ACCENT}
              topbar={
                <div className="flex items-center gap-3 w-full md:hidden">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-1.5 rounded transition-colors text-violet-400/50"
                    aria-label="Toggle navigation"
                  >
                    <Menu className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-violet-400/80">
                    Counsel
                  </span>
                </div>
              }
            >
              <main className="flex-1 overflow-auto h-full">
                <DashboardRouter />
              </main>
            </SharedDashboardShell>
            <Toaster position="bottom-right" theme="dark" />
          </div>
        </WouterRouter>
      </QueryClientProvider>
    </AnalyticsProvider>
  );
}
