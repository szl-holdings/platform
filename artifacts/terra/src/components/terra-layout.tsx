import { Link, useLocation } from "wouter";
import { cn } from "@szl-holdings/shared-ui/utils";
import { toAlpha } from "@szl-holdings/shared-ui/utils";
import { SectionErrorBoundary } from "@szl-holdings/shared-ui/error-boundary";
import { ReactNode, useState } from "react";
import { LANE_ACCENT_HEX } from "@szl-holdings/shared-ui/lane-colors";
import {
  Building2, LayoutDashboard, Eye, Activity,
  BarChart3, Users, FileText, CheckSquare,
  Bell, Menu, X, Briefcase, Map, Globe, TrendingUp, BookOpen,
  Shield, Layers, Radio, Search, PieChart
} from "lucide-react";
import { useRealtimeChannel, RealtimeStatusIndicator, GettingStartedChecklist, OnboardingWizard, useOnboardingState, type OnboardingConfig } from "@szl-holdings/shared-ui";
import { SidebarNav, type SidebarNavSection, DashboardShell as SharedDashboardShell } from "@szl-holdings/shared-ui/design-system";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing } from "@szl-holdings/shared-ui/tokens";

const TERRA_ACCENT = LANE_ACCENT_HEX.terra.primary;
const SIDEBAR_BG = "#080b0d";
const HEADER_BG = toAlpha("#080b0d", 0.92);

const TERRA_ONBOARDING_CONFIG: OnboardingConfig = {
  appId: "terra",
  appName: "Terra",
  accentColor: TERRA_ACCENT,
  steps: [
    { id: "welcome", title: "Welcome to Terra", description: "Terra is your real estate intelligence platform — distress detection, deal pipeline, market analytics, and ownership intelligence for institutional-grade property operations.", placement: "center", icon: Building2 },
    { id: "dashboard", title: "Portfolio Overview", description: "The Overview dashboard gives you a real-time snapshot of your portfolio — active deals, distress signals, market conditions, and KPI performance across all assets.", targetSelector: "a[href='/dashboard']", placement: "right", icon: LayoutDashboard },
    { id: "distress-engine", title: "Distress Engine & Watchlists", description: "The Distress Engine continuously scores assets for financial stress indicators — loan maturity risk, NOI compression, cap rate expansion — so you can act before distress becomes default.", targetSelector: "a[href='/distress-engine']", placement: "right", icon: Eye },
    { id: "pipeline", title: "Deal Pipeline", description: "Track deals from initial sourcing through closing. Manage offers, approvals, and transaction milestones with full team collaboration and audit trails.", targetSelector: "a[href='/pipeline']", placement: "right", icon: Activity },
    { id: "market", title: "Market Intelligence", description: "Benchmark your assets against real-time market data — cap rates, rent trends, transaction comps, and supply/demand signals across every submarket you operate in.", targetSelector: "a[href='/market']", placement: "right", icon: BarChart3 },
  ],
  checklist: [
    { id: "view-overview", label: "Review your portfolio overview", description: "Check active deals and distress signals" },
    { id: "check-distress", label: "Check the Distress Engine", description: "Review assets flagged for financial stress" },
    { id: "explore-pipeline", label: "Explore the deal pipeline", description: "Track deals from sourcing to closing" },
    { id: "view-market", label: "Check market conditions", description: "Review cap rates and rent trends" },
    { id: "review-listings", label: "Review your portfolio listings", description: "Browse and filter your asset portfolio" },
  ],
};

const NAV_SECTIONS: SidebarNavSection[] = [
  {
    id: "core",
    label: "Core",
    items: [
      { id: "dashboard", href: "/dashboard", label: "Overview", icon: <LayoutDashboard className="w-full h-full" /> },
      { id: "distress-engine", href: "/distress-engine", label: "Watchlists", icon: <Eye className="w-full h-full" /> },
      { id: "market", href: "/market", label: "Market", icon: <BarChart3 className="w-full h-full" /> },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    items: [
      { id: "pipeline", href: "/pipeline", label: "Pipeline", icon: <Activity className="w-full h-full" /> },
      { id: "investor-mode", href: "/investor-mode", label: "Ownership", icon: <Globe className="w-full h-full" /> },
    ],
  },
  {
    id: "brokerage",
    label: "Brokerage",
    items: [
      { id: "deals", href: "/deals", label: "Deals", icon: <TrendingUp className="w-full h-full" /> },
      { id: "leads", href: "/leads", label: "Brokers", icon: <Users className="w-full h-full" /> },
      { id: "listings", href: "/listings", label: "Portfolio", icon: <Briefcase className="w-full h-full" /> },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      { id: "property-desk", href: "/property-desk", label: "Property Desk", icon: <Layers className="w-full h-full" /> },
      { id: "what-changed", href: "/what-changed", label: "What Changed", icon: <Radio className="w-full h-full" /> },
      { id: "diligence-prep", href: "/diligence-prep", label: "Diligence Prep", icon: <Search className="w-full h-full" /> },
      { id: "readiness-board", href: "/readiness-board", label: "Readiness Board", icon: <BarChart3 className="w-full h-full" /> },
      { id: "approval-review", href: "/approval-review", label: "Review & Approval", icon: <Shield className="w-full h-full" /> },
    ],
  },
  {
    id: "reporting",
    label: "Reporting",
    items: [
      { id: "market-analytics", href: "/market-analytics", label: "Market Analytics", icon: <TrendingUp className="w-full h-full" /> },
      { id: "comparable-sales", href: "/comparable-sales", label: "Comparable Sales", icon: <BarChart3 className="w-full h-full" /> },
      { id: "portfolio-dashboard", href: "/portfolio-dashboard", label: "Portfolio Dashboard", icon: <PieChart className="w-full h-full" /> },
      { id: "distress-pipeline", href: "/distress-pipeline", label: "Distress Pipeline", icon: <Activity className="w-full h-full" /> },
      { id: "lender-report", href: "/lender-report", label: "Lender & LP Report", icon: <BookOpen className="w-full h-full" /> },
      { id: "transactions", href: "/transactions", label: "Approvals", icon: <CheckSquare className="w-full h-full" /> },
      { id: "broker-overview", href: "/broker-overview", label: "Admin", icon: <FileText className="w-full h-full" /> },
    ],
  },
];

const API = "/api";

export function TerraLayout({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { status: wsStatus } = useRealtimeChannel("terra-signals");
  const { replay: replayOnboarding } = useOnboardingState("terra");

  const { data: apiHealth, isError: apiDown } = useQuery({
    queryKey: ["terra-api-health"],
    queryFn: () => fetch(`${API}/terra/pipeline/deals?limit=1`).then(r => r.json()).then(d => d.data ?? d),
    staleTime: 60000,
    retry: 1,
  });
  const sidebarDataMode = (!apiDown && apiHealth?.dataMode === "live") ? "Live" : "Demo";
  const sidebarModeColor = sidebarDataMode === "Live" ? TERRA_ACCENT : colors.semantic.warning;

  const sidebarHeader = (
    <div className="h-14 flex items-center px-2">
      <div className="flex items-center gap-2.5">
        <div
          className="p-1.5 rounded-lg"
          style={{
            background: toAlpha(TERRA_ACCENT, 0.12),
            border: `1px solid ${toAlpha(TERRA_ACCENT, 0.22)}`,
          }}
        >
          <Building2 className="w-4 h-4" style={{ color: TERRA_ACCENT }} />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-tight text-white leading-none">Terra</span>
          <span className="text-[9px] uppercase tracking-widest leading-none mt-0.5" style={{ color: colors.text.subtle, fontFamily: "monospace" }}>
            Property Intelligence
          </span>
        </div>
      </div>
    </div>
  );

  const sidebarFooter = (
    <div className="space-y-2">
      {TERRA_ONBOARDING_CONFIG.checklist && (
        <GettingStartedChecklist
          appId={TERRA_ONBOARDING_CONFIG.appId}
          appName={TERRA_ONBOARDING_CONFIG.appName}
          items={TERRA_ONBOARDING_CONFIG.checklist}
          accentColor={TERRA_ACCENT}
          onReplayTour={replayOnboarding}
          collapsed
        />
      )}
      <div
        className="rounded-lg p-2.5 space-y-1.5"
        style={{
          background: toAlpha(TERRA_ACCENT, 0.04),
          border: `1px solid ${toAlpha(TERRA_ACCENT, 0.08)}`,
        }}
      >
        <div className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: toAlpha(TERRA_ACCENT, 0.55) }}>
          System State
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px]" style={{ color: colors.text.subtle }}>Data mode</span>
          <span className="text-[9px] font-mono font-semibold" style={{ color: sidebarModeColor }}>
            {sidebarDataMode}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px]" style={{ color: colors.text.subtle }}>Distress signals</span>
          <span className="text-[9px] font-mono font-semibold" style={{ color: colors.semantic.warning }}>
            3 flagged
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2" style={{ color: colors.text.subtle }}>
        <Building2 className="w-3 h-3" />
        <span className="text-[9px]">SZL Holdings · Real Estate</span>
      </div>
    </div>
  );

  const terraTopbar = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: colors.text.muted }}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
        <span
          className="w-1.5 h-1.5 rounded-full hidden sm:block"
          style={{ background: toAlpha(TERRA_ACCENT, 0.7) }}
          aria-hidden="true"
        />
        <span className="hidden sm:block font-mono text-[10px]" style={{ color: colors.text.muted }}>
          Terra · Property Intelligence
        </span>
      </div>
      <div className="flex items-center gap-3">
        <RealtimeStatusIndicator status={wsStatus} compact />
        <button
          className="relative p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: colors.text.muted }}
          aria-label="Notifications"
        >
          <Bell className="w-3.5 h-3.5" />
          <span
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: colors.semantic.warning }}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );

  const terraSidebar = (
    <SidebarNav
      sections={NAV_SECTIONS}
      currentPath={location}
      accentColor={TERRA_ACCENT}
      header={sidebarHeader}
      footer={sidebarFooter}
      onNavigate={(item) => { if (item.href) navigate(item.href); setSidebarOpen(false); }}
    />
  );

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
        style={{ background: TERRA_ACCENT, color: "#fff" }}
      >
        Skip to main content
      </a>
      <SharedDashboardShell
        sidebar={terraSidebar}
        topbar={terraTopbar}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        theme={{ sidebarBg: SIDEBAR_BG, pageBg: colors.background.primary, headerBg: HEADER_BG }}
        accentColor={TERRA_ACCENT}
      >
        <main id="main-content" className="flex-1 overflow-auto p-4 md:p-5" role="main" tabIndex={-1}>
          <SectionErrorBoundary sectionName="Terra">
            {children}
          </SectionErrorBoundary>
        </main>
      </SharedDashboardShell>
      <OnboardingWizard config={TERRA_ONBOARDING_CONFIG} />
    </>
  );
}
