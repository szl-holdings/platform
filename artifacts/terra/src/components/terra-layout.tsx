import { Link, useLocation } from "wouter";
import { cn } from "@workspace/shared-ui/utils";
import { SectionErrorBoundary } from "@workspace/shared-ui/error-boundary";
import { ReactNode, useState, useCallback } from "react";
import {
  Building2, LayoutDashboard, Eye, Activity,
  BarChart3, Users, FileText, CheckSquare,
  Bell, Menu, X, Briefcase, Map, Globe, TrendingUp, BookOpen
} from "lucide-react";
import { useRealtimeChannel, RealtimeStatusIndicator, GettingStartedChecklist, OnboardingWizard, useOnboardingState, type OnboardingConfig } from "@workspace/shared-ui";
import { useQuery } from "@tanstack/react-query";

const TERRA_ONBOARDING_CONFIG: OnboardingConfig = {
  appId: "terra",
  appName: "Terra",
  accentColor: "#40856a",
  steps: [
    {
      id: "welcome",
      title: "Welcome to Terra",
      description: "Terra is your real estate intelligence platform — distress detection, deal pipeline, market analytics, and ownership intelligence for institutional-grade property operations.",
      placement: "center",
      icon: Building2,
    },
    {
      id: "dashboard",
      title: "Portfolio Overview",
      description: "The Overview dashboard gives you a real-time snapshot of your portfolio — active deals, distress signals, market conditions, and KPI performance across all assets.",
      targetSelector: "a[href='/dashboard']",
      placement: "right",
      icon: LayoutDashboard,
    },
    {
      id: "distress-engine",
      title: "Distress Engine & Watchlists",
      description: "The Distress Engine continuously scores assets for financial stress indicators — loan maturity risk, NOI compression, cap rate expansion — so you can act before distress becomes default.",
      targetSelector: "a[href='/distress-engine']",
      placement: "right",
      icon: Eye,
    },
    {
      id: "pipeline",
      title: "Deal Pipeline",
      description: "Track deals from initial sourcing through closing. Manage offers, approvals, and transaction milestones with full team collaboration and audit trails.",
      targetSelector: "a[href='/pipeline']",
      placement: "right",
      icon: Activity,
    },
    {
      id: "market",
      title: "Market Intelligence",
      description: "Benchmark your assets against real-time market data — cap rates, rent trends, transaction comps, and supply/demand signals across every submarket you operate in.",
      targetSelector: "a[href='/market']",
      placement: "right",
      icon: BarChart3,
    },
  ],
  checklist: [
    { id: "view-overview", label: "Review your portfolio overview", description: "Check active deals and distress signals" },
    { id: "check-distress", label: "Check the Distress Engine", description: "Review assets flagged for financial stress" },
    { id: "explore-pipeline", label: "Explore the deal pipeline", description: "Track deals from sourcing to closing" },
    { id: "view-market", label: "Check market conditions", description: "Review cap rates and rent trends" },
    { id: "review-listings", label: "Review your portfolio listings", description: "Browse and filter your asset portfolio" },
  ],
};

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API = "/api";

const NAV_SECTIONS = [
  {
    title: "Core",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/distress-engine", label: "Watchlists", icon: Eye },
      { href: "/market", label: "Market", icon: BarChart3 },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { href: "/pipeline", label: "Pipeline", icon: Activity },
      { href: "/investor-mode", label: "Ownership", icon: Globe },
    ],
  },
  {
    title: "Brokerage",
    items: [
      { href: "/deals", label: "Deals", icon: TrendingUp },
      { href: "/leads", label: "Brokers", icon: Users },
      { href: "/listings", label: "Portfolio", icon: Briefcase },
    ],
  },
  {
    title: "Reporting",
    items: [
      { href: "/lender-report", label: "Lender & LP Report", icon: BookOpen },
      { href: "/transactions", label: "Approvals", icon: CheckSquare },
      { href: "/broker-overview", label: "Admin", icon: FileText },
    ],
  },
];

export function TerraLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
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
  const sidebarModeColor = sidebarDataMode === "Live" ? "#40856a" : "#9a7840";

  return (
    <div className="flex h-full overflow-hidden">
      <a href="#main-content" className="skip-to-content">Skip to main content</a>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside className={cn(
        "border-r flex flex-col shrink-0 z-20 transition-transform duration-200",
        "fixed md:relative inset-y-0 left-0 w-52",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )} style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(8,10,14,0.98)" }}
        role="navigation" aria-label="Sidebar navigation">

        <div className="h-14 flex items-center px-4 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg" style={{ background: "rgba(45,106,79,0.15)", border: "1px solid rgba(45,106,79,0.25)" }}>
              <Building2 className="w-4 h-4" style={{ color: "#40856a" }} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-white leading-none">Terra</span>
              <span className="text-[9px] uppercase tracking-widest leading-none mt-0.5" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>Property Intelligence</span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <nav className="flex-1 min-h-0 px-2 py-3 flex flex-col gap-2.5 overflow-y-auto">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title}>
                <p className="text-[9px] font-semibold uppercase tracking-widest mb-1 px-3" style={{ color: "rgba(255,255,255,0.45)" }}>{section.title}</p>
                <div className="flex flex-col gap-0.5">
                  {section.items.map((item) => {
                    const isActive = item.href === "/dashboard"
                      ? (location === "/dashboard" || location === "/" || location === "")
                      : location.startsWith(item.href);
                    return (
                      <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 relative",
                        isActive
                          ? "text-white"
                          : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]"
                      )} style={{
                        background: isActive ? "rgba(255,255,255,0.06)" : undefined
                      }}>
                        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full" style={{ background: "rgba(255,255,255,0.4)" }} />}
                        <item.icon className="w-3.5 h-3.5 shrink-0" style={{ color: isActive ? "rgba(255,255,255,0.8)" : undefined }} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {TERRA_ONBOARDING_CONFIG.checklist && (
            <div className="mx-2 mb-2">
              <GettingStartedChecklist
                appId={TERRA_ONBOARDING_CONFIG.appId}
                appName={TERRA_ONBOARDING_CONFIG.appName}
                items={TERRA_ONBOARDING_CONFIG.checklist}
                accentColor={TERRA_ONBOARDING_CONFIG.accentColor}
                onReplayTour={replayOnboarding}
                collapsed
              />
            </div>
          )}
          <div className="shrink-0 px-3 py-3 mx-2 mb-2 rounded-lg" style={{ background: "rgba(45,106,79,0.04)", border: "1px solid rgba(45,106,79,0.08)" }}>
            <div className="text-[9px] uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(64,133,106,0.5)" }}>System State</div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Data mode</span>
                <span className="text-[9px] font-mono font-semibold" style={{ color: sidebarModeColor }}>{sidebarDataMode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Distress signals</span>
                <span className="text-[9px] font-mono font-semibold" style={{ color: "#f59e0b" }}>3 flagged</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Portfolio value</span>
                <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>$2.4B</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-2 text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>
            <Building2 className="w-3 h-3" />
            <span>SZL Holdings · Real Estate</span>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-11 border-b flex items-center justify-between px-4 shrink-0 z-10" role="banner" style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(8,10,14,0.92)", backdropFilter: "blur(8px)" }}>
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              style={{ color: "rgba(255,255,255,0.7)" }}
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              aria-expanded={sidebarOpen}
              aria-controls="terra-sidebar"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <span className="w-1.5 h-1.5 rounded-full hidden sm:block" style={{ background: "rgba(45,106,79,0.6)" }} aria-hidden="true" />
            <span className="hidden sm:block font-mono text-[10px]" style={{ color: "rgba(255,255,255,0.55)" }}>Terra · Property Intelligence</span>
          </div>
          <div className="flex items-center gap-3">
            <RealtimeStatusIndicator status={wsStatus} compact />
            <button className="relative p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "rgba(255,255,255,0.6)" }} aria-label="Notifications">
              <Bell className="w-3.5 h-3.5" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#f59e0b" }} aria-hidden="true" />
            </button>
          </div>
        </header>
        <main id="main-content" className="flex-1 overflow-auto p-4 md:p-5" role="main" style={{ background: "#0a0c10" }}>
          <SectionErrorBoundary sectionName="Terra">
            {children}
          </SectionErrorBoundary>
        </main>
      </div>
      <OnboardingWizard config={TERRA_ONBOARDING_CONFIG} />
    </div>
  );
}
