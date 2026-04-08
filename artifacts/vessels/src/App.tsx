import { lazy, Suspense, useState } from "react";
import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@szl-holdings/shared-ui/ui/sonner";
import { McpOverlay } from "@szl-holdings/mcp-client";
import { PrismBusProvider } from "@szl-holdings/prism-bus";
import { AnalyticsProvider } from "@szl-holdings/shared-ui";
import { UserButton } from "@szl-holdings/shared-ui/UserButton";
import {
  Ship, AlertTriangle, Activity, LayoutDashboard, WifiOff,
  BarChart3, ChevronDown, User, ChevronRight, DollarSign, Wrench,
  MapPin, Radio, List, Globe, Navigation, EyeOff, ShieldAlert, Shield, Anchor, Brain, Menu, FileText
} from "lucide-react";
import { EcosystemNav } from "@szl-holdings/shared-ui/ecosystem-nav";
import { AgentCopilot } from "@szl-holdings/shared-ui/copilot";
import { helmsmanConfig } from "@szl-holdings/shared-ui/copilot-configs";
import { cn } from "@szl-holdings/shared-ui/utils";
import { toAlpha } from "@szl-holdings/shared-ui/utils";
import { AuthProvider, useAuth as useVesselsRoleAuth, roleLabels, type UserRole } from "@/contexts/auth-context";
import { useAuth } from "@szl-holdings/replit-auth-web";
import { PrivateAppGuard, useRealtimeChannel, RealtimeStatusIndicator, OnboardingWizard, GettingStartedChecklist, useOnboardingState, type OnboardingConfig } from "@szl-holdings/shared-ui";
import { CommandPalette, useCommandPalette, type CommandItem } from "@szl-holdings/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@szl-holdings/shared-ui/keyboard-shortcuts";
import { DemoModeProvider, SandboxModeProvider, SandboxModeBanner } from "@szl-holdings/shared-ui";
import { PackBanner } from "@/components/pack-banner";
import { LANE_ACCENT_HEX } from "@szl-holdings/shared-ui/lane-colors";
import { SidebarNav, type SidebarNavSection } from "@szl-holdings/shared-ui/design-system";
import { DashboardShell as SharedDashboardShell } from "@szl-holdings/shared-ui/design-system";

const VESSELS_ACCENT = LANE_ACCENT_HEX.vessels.primaryLight;

const VESSELS_ONBOARDING_CONFIG: OnboardingConfig = {
  appId: "vessels",
  appName: "Vessels",
  accentColor: VESSELS_ACCENT,
  steps: [
    {
      id: "welcome",
      title: "Welcome to Vessels",
      description: "Vessels is your maritime intelligence command — real-time AIS fleet tracking, voyage economics, risk scoring, dark vessel detection, and sanctions screening for 1,200+ vessels.",
      placement: "center",
      icon: Ship,
    },
    {
      id: "fleet-map",
      title: "Live Fleet Map",
      description: "The Fleet Map shows real-time vessel positions from AIS feeds. Click any vessel to drill into voyage details, fuel performance, ETAs, and flag risk indicators.",
      targetSelector: "a[href='/fleet']",
      placement: "right",
      icon: Globe,
    },
    {
      id: "command-overview",
      title: "Command Overview",
      description: "Your command dashboard surfaces fleet KPIs — vessels in port, at sea, flagged for exceptions, and distress signals — all in one operational view.",
      targetSelector: "a[href='/dashboard']",
      placement: "right",
      icon: LayoutDashboard,
    },
    {
      id: "alerts",
      title: "Alert Center",
      description: "The Alert Center consolidates all fleet alerts — geofence violations, AIS blackouts, sanctions exposure, and weather routing conflicts — with severity triage.",
      targetSelector: "a[href='/alerts']",
      placement: "right",
      icon: AlertTriangle,
    },
    {
      id: "intelligence",
      title: "Maritime Intelligence",
      description: "Go deeper with maritime intelligence: dark vessel detection, sanctions screening, corridor risk analysis, and cyber threat assessment for your fleet.",
      placement: "center",
      icon: Brain,
    },
  ],
  checklist: [
    { id: "view-fleet-map", label: "Explore the live fleet map", description: "Check real-time vessel positions" },
    { id: "review-dashboard", label: "Review command overview", description: "Check fleet KPIs and exception counts" },
    { id: "check-alerts", label: "Review active alerts", description: "Triage geofence and AIS blackout alerts" },
    { id: "view-voyage-economics", label: "Check voyage economics", description: "Review fuel costs and voyage P&L" },
    { id: "check-risk-scoring", label: "Review vessel risk scores", description: "Check sanctions and compliance flags" },
  ],
};

// Marketing pages
const VesselsAtlasArtifactsPage = lazy(() => import("@/pages/atlas-artifacts"));
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
const CommodityFlowIntelligence = lazy(() => import("@/pages/commodity-flow-intelligence"));
const WeatherPage = lazy(() => import("@/pages/weather-page"));
const PortAnalyticsPage = lazy(() => import("@/pages/port-analytics"));
const CO2EmissionsPage = lazy(() => import("@/pages/co2-emissions"));
const RiskScoringPage = lazy(() => import("@/pages/risk-scoring"));
const DarkVesselDetection = lazy(() => import("@/pages/dark-vessel-detection"));
const SanctionsScreening = lazy(() => import("@/pages/sanctions-screening"));
const PortCongestion = lazy(() => import("@/pages/port-congestion"));
const CargoTracking = lazy(() => import("@/pages/cargo-tracking"));
const AisLiveTracking = lazy(() => import("@/pages/ais-live-tracking"));
const CyberThreatPanel = lazy(() => import("@/pages/cyber-threat-panel"));
const IncidentReporting = lazy(() => import("@/pages/incident-reporting"));
const CommandWorkflowsPage = lazy(() => import("@/pages/command-workflows"));
const DocumentEngine = lazy(() => import("@/pages/document-engine"));
const VoyageDeskPage = lazy(() => import("@/pages/voyage-desk"));
const FleetWhatChangedPage = lazy(() => import("@/pages/fleet-what-changed"));
const ExceptionQueuePage = lazy(() => import("@/pages/exception-queue"));
const RouteRiskPage = lazy(() => import("@/pages/route-risk"));
const VesselsApprovalReviewPage = lazy(() => import("@/pages/vessels-approval-review"));
const VoyageInterventionSimulatorPage = lazy(() => import("@/pages/voyage-intervention-simulator"));
const ReadinessDragIndexPage = lazy(() => import("@/pages/readiness-drag-index"));
const PortFrictionMemoryPage = lazy(() => import("@/pages/port-friction-memory"));
const FleetMorningBriefPage = lazy(() => import("@/pages/fleet-morning-brief"));
const CommandModeTogglePage = lazy(() => import("@/pages/command-mode-toggle"));

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
  { path: "/port-congestion", label: "Port Congestion", icon: Anchor },
  { path: "/cargo-tracking", label: "Cargo Tracking", icon: Ship },
  { path: "/ais-live", label: "AIS Live Tracking", icon: Activity },
  { path: "/commodity-flow", label: "Commodity Flow", icon: BarChart3 },
  { path: "/maintenance", label: "Maintenance", icon: Wrench },
  { path: "/command", label: "Command Mode", icon: Activity },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/intelligence", label: "Maritime Intel", icon: Globe },
  { path: "/corridors", label: "Corridors", icon: Navigation },
  { path: "/agent-insights", label: "Agent Insights", icon: Brain },
  { path: "/command-workflows", label: "Command Workflows", icon: ShieldAlert },
  { path: "/document-engine", label: "Document Engine", icon: FileText },
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
    <div className="border-b border-amber-500/10 px-4 py-1 flex items-center gap-2 shrink-0">
      <span className="text-[10px] font-mono text-amber-400/60 px-2 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/5">AIS</span>
      <span className="text-[10px] text-amber-400/50">Live AIS feed not connected — position data is indicative</span>
    </div>
  );
}

function RoleSelector({ expanded }: { expanded: boolean }) {
  const { user, setRole } = useVesselsRoleAuth();
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

function VesselsSidebarContent({ expanded, onMobileClose }: { expanded: boolean; onMobileClose?: () => void }) {
  const [location, navigate] = useLocation();

  const primarySections: SidebarNavSection[] = [
    {
      id: "primary",
      items: primaryNavItems.map(({ path, label, icon: Icon }) => ({
        id: path,
        label,
        href: path,
        icon: <Icon className="w-3.5 h-3.5" />,
      })),
    },
    {
      id: "operations",
      label: "Operations",
      items: [
        { id: "fleet-morning-brief", label: "Morning Brief", href: "/fleet-morning-brief", icon: <Activity className="w-3.5 h-3.5" /> },
        { id: "voyage-desk", label: "Voyage Desk", href: "/voyage-desk", icon: <Anchor className="w-3.5 h-3.5" /> },
        { id: "what-changed", label: "What Changed", href: "/what-changed", icon: <Radio className="w-3.5 h-3.5" /> },
        { id: "exception-queue", label: "Exceptions", href: "/exception-queue", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
        { id: "route-risk", label: "Route Risk", href: "/route-risk", icon: <Navigation className="w-3.5 h-3.5" /> },
        { id: "approval-review", label: "Review & Approval", href: "/approval-review", icon: <Shield className="w-3.5 h-3.5" /> },
        { id: "voyage-intervention-simulator", label: "Intervention Simulator", href: "/voyage-intervention-simulator", icon: <BarChart3 className="w-3.5 h-3.5" /> },
        { id: "readiness-drag-index", label: "Drag Index", href: "/readiness-drag-index", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
        { id: "port-friction-memory", label: "Port Friction", href: "/port-friction-memory", icon: <MapPin className="w-3.5 h-3.5" /> },
        { id: "command-mode-toggle", label: "Captain / Exec Mode", href: "/command-mode-toggle", icon: <User className="w-3.5 h-3.5" /> },
      ]
    },
    {
      id: "admin",
      label: "Admin",
      items: adminNavItems.map(({ path, label, icon: Icon }) => ({
        id: path,
        label,
        href: path,
        icon: <Icon className="w-3.5 h-3.5" />,
      })),
    },
    {
      id: "legacy",
      label: "More pages",
      items: legacyNavItems.map(({ path, label, icon: Icon }) => ({
        id: path,
        label,
        href: path,
        icon: <Icon className="w-3 h-3" />,
      })),
    },
  ];

  const fleetStatusFooter = expanded ? (
    <div className="space-y-3">
      <div className="rounded-lg px-3 py-3" style={{ background: toAlpha(VESSELS_ACCENT, 0.04), border: `1px solid ${toAlpha(VESSELS_ACCENT, 0.08)}` }}>
        <div className="text-[9px] uppercase tracking-widest font-medium mb-2" style={{ color: toAlpha(VESSELS_ACCENT, 0.5) }}>Fleet Status</div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/35">Vessels tracked</span>
            <span className="text-[9px] font-mono" style={{ color: VESSELS_ACCENT }}>1,247 live</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/35">Distress signals</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[9px] font-mono text-red-400">2 active</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/35">Zones monitored</span>
            <span className="text-[9px] font-mono text-white/40">18 regions</span>
          </div>
        </div>
        <div className="mt-2 h-0.5 rounded-full overflow-hidden bg-white/6">
          <div className="h-full rounded-full" style={{ width: "94%", background: `linear-gradient(90deg, ${VESSELS_ACCENT}, ${toAlpha(VESSELS_ACCENT, 0.6)})` }} />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[8px] text-white/20">AIS coverage</span>
          <span className="text-[8px] font-mono text-white/30">94%</span>
        </div>
      </div>
      {VESSELS_ONBOARDING_CONFIG.checklist && (
        <GettingStartedChecklist
          appId={VESSELS_ONBOARDING_CONFIG.appId}
          appName={VESSELS_ONBOARDING_CONFIG.appName}
          items={VESSELS_ONBOARDING_CONFIG.checklist}
          accentColor={VESSELS_ONBOARDING_CONFIG.accentColor}
          collapsed
        />
      )}
      <Link href="/platform">
        <div className="w-full text-xs font-medium text-center px-3 py-2 rounded-lg cursor-pointer transition-colors" style={{ background: toAlpha(VESSELS_ACCENT, 0.10), color: VESSELS_ACCENT }}>
          Request demo
        </div>
      </Link>
      <UserButton showName className="w-full" />
      <RoleSelector expanded={expanded} />
      <PackBanner vertical="Maritime Intelligence Pack" accentColor={VESSELS_ACCENT} compact />
    </div>
  ) : (
    <div className="space-y-2">
      <UserButton className="w-full" />
      <RoleSelector expanded={false} />
    </div>
  );

  return (
    <SidebarNav
      sections={primarySections}
      currentPath={location}
      accentColor={VESSELS_ACCENT}
      collapsed={!expanded}
      onNavigate={(item) => { if (item.href) navigate(item.href); onMobileClose?.(); }}
      header={
        <Link href="/">
          <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ background: toAlpha(VESSELS_ACCENT, 0.08), border: `1px solid ${toAlpha(VESSELS_ACCENT, 0.12)}` }}>
              <Ship className="w-4 h-4" style={{ color: VESSELS_ACCENT }} />
            </div>
            {expanded && (
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-semibold text-sky-50 truncate tracking-tight">Vessels</h1>
                <p className="text-[10px] truncate font-mono uppercase tracking-wider" style={{ color: toAlpha(VESSELS_ACCENT, 0.4) }}>Maritime Intelligence Pack</p>
              </div>
            )}
          </div>
        </Link>
      }
      footer={fleetStatusFooter}
    />
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
        <Route path="/port-congestion" component={PortCongestion} />
        <Route path="/cargo-tracking" component={CargoTracking} />
        <Route path="/ais-live" component={AisLiveTracking} />
        <Route path="/commodity-flow" component={CommodityFlowIntelligence} />
        <Route path="/cyber-threats" component={CyberThreatPanel} />
        <Route path="/incidents" component={IncidentReporting} />
        <Route path="/agent-insights" component={AgentInsightsPage} />
        <Route path="/command-workflows" component={CommandWorkflowsPage} />
        <Route path="/document-engine" component={DocumentEngine} />
        <Route path="/document-engine/:sub" component={DocumentEngine} />
        <Route path="/atlas-artifacts" component={VesselsAtlasArtifactsPage} />
        <Route path="/voyage-desk" component={VoyageDeskPage} />
        <Route path="/what-changed" component={FleetWhatChangedPage} />
        <Route path="/exception-queue" component={ExceptionQueuePage} />
        <Route path="/route-risk" component={RouteRiskPage} />
        <Route path="/approval-review" component={VesselsApprovalReviewPage} />
        <Route path="/voyage-intervention-simulator" component={VoyageInterventionSimulatorPage} />
        <Route path="/readiness-drag-index" component={ReadinessDragIndexPage} />
        <Route path="/port-friction-memory" component={PortFrictionMemoryPage} />
        <Route path="/fleet-morning-brief" component={FleetMorningBriefPage} />
        <Route path="/command-mode-toggle" component={CommandModeTogglePage} />
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
  { id: "app-alloy", label: "Switch to Alloy", icon: "⬡", group: "Switch App", description: "Execution Fabric", action: () => { window.location.href = "/alloy"; } },
];

const vesselsShortcuts: KeyboardShortcut[] = [
  { key: "D", description: "Go to Dashboard", category: "Navigation" },
  { key: "F", description: "Go to Fleet Map", category: "Navigation" },
  { key: "A", description: "Go to Alerts", category: "Navigation" },
  { key: "C", description: "Go to Command Mode", category: "Navigation" },
];

function VesselsDashboard({ cmdOpen, setCmdOpen }: { cmdOpen: boolean; setCmdOpen: (v: boolean) => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const sidebarExpanded = sidebarHovered || sidebarOpen;
  const { status: wsStatus } = useRealtimeChannel("vessel-positions");
  return (
    <PowerUserProvider shortcuts={vesselsShortcuts} appName="Vessels" accentColor={VESSELS_ACCENT}>
      <div className="flex flex-col h-screen" style={{ background: "#060e1a" }}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium" style={{ background: VESSELS_ACCENT, color: "#fff" }}>
          Skip to main content
        </a>
        <EcosystemNav currentAppId="vessels" currentAppName="Vessels Maritime Intelligence" accentColor={VESSELS_ACCENT} />
        <SandboxModeBanner />
        <DemoModeBanner />
        <SharedDashboardShell
          sidebar={<VesselsSidebarContent expanded={sidebarExpanded} onMobileClose={() => setSidebarOpen(false)} />}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
          sidebarWidth={sidebarExpanded ? "13rem" : "3.5rem"}
          sidebarEvents={{ onMouseEnter: () => setSidebarHovered(true), onMouseLeave: () => setSidebarHovered(false) }}
          theme={{ sidebarBg: "#060e1a", pageBg: "#060e1a", headerBg: toAlpha("#060e1a", 0.92) }}
          accentColor={VESSELS_ACCENT}
          topbar={
            <div className="flex items-center gap-3 w-full md:hidden">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded transition-colors" style={{ color: toAlpha(VESSELS_ACCENT, 0.5) }} aria-label="Toggle navigation">
                <Menu className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: toAlpha(VESSELS_ACCENT, 0.8) }}>Vessels Maritime Intelligence</span>
              <div className="ml-auto pr-1"><RealtimeStatusIndicator status={wsStatus} compact /></div>
            </div>
          }
        >
          <main id="main-content" role="main" className="flex-1 overflow-auto h-full" tabIndex={-1}>
            <DashboardRouter />
          </main>
        </SharedDashboardShell>
      </div>
      <Toaster />
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        commands={vesselsCommands}
        appName="Vessels"
        accentColor={VESSELS_ACCENT}
      />
      <OnboardingWizard config={VESSELS_ONBOARDING_CONFIG} />
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
    location.startsWith("/routes") || location.startsWith("/command-workflows") ||
    location.startsWith("/document-engine") ||
    location.startsWith("/voyage-desk") || location.startsWith("/what-changed") ||
    location.startsWith("/exception-queue") || location.startsWith("/route-risk") ||
    location.startsWith("/approval-review") ||
    location.startsWith("/voyage-intervention-simulator") || location.startsWith("/readiness-drag-index") ||
    location.startsWith("/port-friction-memory") || location.startsWith("/fleet-morning-brief") ||
    location.startsWith("/command-mode-toggle");

  if (isDashboard) {
    return (
      <PrivateAppGuard appName="Vessels" accentColor={VESSELS_ACCENT}>
        <VesselsDashboard cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />
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
    <AnalyticsProvider appName="vessels">
    <PrismBusProvider domain="vessels">
    <SandboxModeProvider>
      <DemoModeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppContent cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />
            </WouterRouter>
          </AuthProvider>
          <AgentCopilot config={helmsmanConfig} />
          <McpOverlay domain="vessels" />
        </QueryClientProvider>
      </DemoModeProvider>
    </SandboxModeProvider>
    </PrismBusProvider>
    </AnalyticsProvider>
  );
}

export default App;
