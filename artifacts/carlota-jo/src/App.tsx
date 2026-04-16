import { lazy, Suspense, type ReactNode } from "react";
import { AgentCopilot } from "@szl-holdings/shared-ui/copilot";
import { carlotaJoConfig } from "@szl-holdings/shared-ui/copilot-configs";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { CommandPalette, useCommandPalette, type CommandItem } from "@szl-holdings/shared-ui/command-palette";
import { McpOverlay } from "@szl-holdings/mcp-client";
import { PrismBusProvider } from "@szl-holdings/prism-bus";
import { PowerUserProvider, type KeyboardShortcut } from "@szl-holdings/shared-ui/keyboard-shortcuts";
import { SandboxModeProvider, AnalyticsProvider } from "@szl-holdings/shared-ui";
import { EcosystemNav } from "@szl-holdings/shared-ui/ecosystem-nav";
import { useAuth } from "@szl-holdings/replit-auth-web";
import { Users, MessageSquare } from "lucide-react";
import { LANE_ACCENT_HEX } from "@szl-holdings/shared-ui/lane-colors";

const CARLOTA_ACCENT = LANE_ACCENT_HEX.carlotaJo.primary;


const CarlotaJoPulse = lazy(() => import("@/pages/pulse"));
const Home = lazy(() => import("@/pages/PremiumHome"));
const ServicesPage = lazy(() => import("@/pages/Services"));
const ApproachPage = lazy(() => import("@/pages/Approach"));
const AboutPage = lazy(() => import("@/pages/About"));
const InquiriesPage = lazy(() => import("@/pages/Inquiries"));
const FounderPage = lazy(() => import("@/pages/founder"));
const WhoWeServePage = lazy(() => import("@/pages/who-we-serve"));
const ContactPage = lazy(() => import("@/pages/contact"));
const { ClientPortalOverview, ClientPortalDocuments, ClientPortalUpdates, ClientPortalMessages, ClientPortalSettings } = {
  ClientPortalOverview: lazy(() => import("@/pages/ClientPortal").then(m => ({ default: m.ClientPortalOverview }))),
  ClientPortalDocuments: lazy(() => import("@/pages/ClientPortal").then(m => ({ default: m.ClientPortalDocuments }))),
  ClientPortalUpdates: lazy(() => import("@/pages/ClientPortal").then(m => ({ default: m.ClientPortalUpdates }))),
  ClientPortalMessages: lazy(() => import("@/pages/ClientPortal").then(m => ({ default: m.ClientPortalMessages }))),
  ClientPortalSettings: lazy(() => import("@/pages/ClientPortal").then(m => ({ default: m.ClientPortalSettings }))),
};
const LegalPrivacyPage = lazy(() => import("@/pages/legal-privacy"));
const LegalTermsPage = lazy(() => import("@/pages/legal-terms"));
const BookingFlow = lazy(() => import("@/pages/BookingFlow"));
const BookingSuccess = lazy(() => import("@/pages/BookingSuccess"));
const BookingCancel = lazy(() => import("@/pages/BookingCancel"));
const BookingFollowUp = lazy(() => import("@/pages/BookingFollowUp"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const ObservabilityPage = lazy(() => import("@/pages/observability"));
const AdvisoryIntel = lazy(() => import("@/pages/AdvisoryIntel"));
const AIAdvisory = lazy(() => import("@/pages/ai-advisory"));
const EngagementIntake = lazy(() => import("@/pages/engagement-intake"));
const EngagementWorkflow = lazy(() => import("@/pages/engagement-workflow"));
const BookingPage = lazy(() => import("@/pages/booking"));
const ClientIntel = lazy(() => import("@/pages/client-intel"));
const ROICalculator = lazy(() => import("@/pages/roi-calculator"));
const BrandAudit = lazy(() => import("@/pages/brand-audit"));
const ContentStrategy = lazy(() => import("@/pages/content-strategy"));
const DocumentEngine = lazy(() => import("@/pages/document-engine"));
const MethodologyPage = lazy(() => import("@/pages/methodology"));
const StrategicDiagnostic = lazy(() => import("@/pages/strategic-diagnostic"));
const CompetitiveRadar = lazy(() => import("@/pages/competitive-radar"));
const EngagementROI = lazy(() => import("@/pages/engagement-roi"));
const ScenarioSimulator = lazy(() => import("@/pages/scenario-simulator"));
const ClientHealth = lazy(() => import("@/pages/client-health"));
const ProposalGenerator = lazy(() => import("@/pages/proposal-generator"));
const ConsultingOS = lazy(() => import("@/pages/consulting-os"));
const KnowledgeGraph = lazy(() => import("@/pages/knowledge-graph"));
const RevenueIntelligence = lazy(() => import("@/pages/revenue-intelligence"));
const WorkshopPlatform = lazy(() => import("@/pages/workshop-platform"));
const ExpertNetwork = lazy(() => import("@/pages/expert-network"));
const InvisibleServiceDesign = lazy(() => import("@/pages/invisible-service-design"));
const PortalAdmin = lazy(() => import("@/pages/portal-admin"));
const TimeTracking = lazy(() => import("@/pages/time-tracking"));
const CapacityPlanner = lazy(() => import("@/pages/capacity-planner"));
const KnowledgeVault = lazy(() => import("@/pages/knowledge-vault"));
const BenchmarkDatabase = lazy(() => import("@/pages/benchmark-database"));
const DeliverableWorkflow = lazy(() => import("@/pages/deliverable-workflow"));
const ProfitabilityAnalytics = lazy(() => import("@/pages/profitability-analytics"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function PortalAuthGuard({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, login } = useAuth();
  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 20, padding: "0 24px", textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${CARLOTA_ACCENT}20`, border: `1px solid ${CARLOTA_ACCENT}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={CARLOTA_ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a", margin: "0 0 8px 0" }}>Sign in required</h2>
          <p style={{ fontSize: 14, color: "#666", margin: 0, maxWidth: 340 }}>Please sign in to access your client portal.</p>
        </div>
        <button
          onClick={login}
          style={{ padding: "10px 28px", background: CARLOTA_ACCENT, borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", border: "none" }}
        >
          Sign in
        </button>
      </div>
    );
  }
  return <>{children}</>;
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Marketing / public pages */}
        <Route path="/pulse" component={CarlotaJoPulse} />
        <Route path="/" component={Home} />
        <Route path="/services" component={ServicesPage} />
        <Route path="/methodology" component={MethodologyPage} />
        <Route path="/who-we-serve" component={WhoWeServePage} />
        <Route path="/founder" component={FounderPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/approach" component={ApproachPage} />
        <Route path="/engage" component={EngagementIntake} />
        <Route path="/about" component={AboutPage} />
        <Route path="/inquiries" component={InquiriesPage} />
        <Route path="/legal/privacy" component={LegalPrivacyPage} />
        <Route path="/legal/terms" component={LegalTermsPage} />

        {/* Client Portal — protected routes */}
        <Route path="/client-portal">{() => <PortalAuthGuard><ClientPortalOverview /></PortalAuthGuard>}</Route>
        <Route path="/client-portal/documents">{() => <PortalAuthGuard><ClientPortalDocuments /></PortalAuthGuard>}</Route>
        <Route path="/client-portal/updates">{() => <PortalAuthGuard><ClientPortalUpdates /></PortalAuthGuard>}</Route>
        <Route path="/client-portal/messages">{() => <PortalAuthGuard><ClientPortalMessages /></PortalAuthGuard>}</Route>
        <Route path="/client-portal/settings">{() => <PortalAuthGuard><ClientPortalSettings /></PortalAuthGuard>}</Route>

        {/* Legacy routes */}
        <Route path="/book" component={BookingFlow} />
        <Route path="/booking/success" component={BookingSuccess} />
        <Route path="/booking/cancel" component={BookingCancel} />
        <Route path="/booking/follow-up" component={BookingFollowUp} />
        <Route path="/observability" component={ObservabilityPage} />
        <Route path="/advisory" component={AdvisoryIntel} />
        <Route path="/ai-advisory" component={AIAdvisory} />
        <Route path="/engagements" component={EngagementWorkflow} />
        <Route path="/booking" component={BookingPage} />
        <Route path="/client-intel" component={ClientIntel} />
        <Route path="/roi-calculator" component={ROICalculator} />
        <Route path="/brand-audit" component={BrandAudit} />
        <Route path="/content-strategy" component={ContentStrategy} />
        <Route path="/document-engine" component={DocumentEngine} />
        <Route path="/document-engine/:sub" component={DocumentEngine} />
        <Route path="/strategic-diagnostic" component={StrategicDiagnostic} />
        <Route path="/competitive-radar" component={CompetitiveRadar} />
        <Route path="/engagement-roi" component={EngagementROI} />
        <Route path="/scenario-simulator" component={ScenarioSimulator} />
        <Route path="/client-health" component={ClientHealth} />
        <Route path="/proposal-generator" component={ProposalGenerator} />
        <Route path="/consulting-os" component={ConsultingOS} />
        <Route path="/knowledge-graph" component={KnowledgeGraph} />
        <Route path="/revenue-intelligence" component={RevenueIntelligence} />
        <Route path="/workshop-platform" component={WorkshopPlatform} />
        <Route path="/expert-network" component={ExpertNetwork} />
        <Route path="/invisible-service-design" component={InvisibleServiceDesign} />
        <Route path="/portal-admin" component={PortalAdmin} />
        <Route path="/time-tracking" component={TimeTracking} />
        <Route path="/capacity-planner" component={CapacityPlanner} />
        <Route path="/knowledge-vault" component={KnowledgeVault} />
        <Route path="/benchmark-database" component={BenchmarkDatabase} />
        <Route path="/deliverable-workflow" component={DeliverableWorkflow} />
        <Route path="/profitability-analytics" component={ProfitabilityAnalytics} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

const carlotaCommands: CommandItem[] = [
  { id: "nav-home", label: "Home", icon: "✨", group: "Navigation", keywords: ["overview", "main"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/"); } },
  { id: "nav-services", label: "Services", icon: "📋", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/services"); } },
  { id: "nav-who-we-serve", label: "Who We Serve", icon: "👥", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/who-we-serve"); } },
  { id: "nav-founder", label: "About Carlota Jo", icon: "👤", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/founder"); } },
  { id: "nav-contact", label: "Request Consultation", icon: "📬", group: "Actions", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/contact"); } },
  { id: "nav-portal", label: "Client Portal", icon: "🔐", group: "Actions", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/client-portal"); } },
  { id: "nav-diagnostic", label: "Strategic Diagnostic Engine", icon: "🧠", group: "AI Platform", keywords: ["diagnosis", "strategy", "analysis", "market"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/strategic-diagnostic"); } },
  { id: "nav-radar", label: "Competitive Intelligence Radar", icon: "📡", group: "AI Platform", keywords: ["competitor", "competitive", "monitor", "intelligence"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/competitive-radar"); } },
  { id: "nav-roi", label: "Engagement ROI Tracker", icon: "📊", group: "AI Platform", keywords: ["roi", "impact", "return", "recommendations"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/engagement-roi"); } },
  { id: "nav-simulator", label: "Strategy Scenario Simulator", icon: "⚗️", group: "AI Platform", keywords: ["scenario", "what-if", "simulate", "model"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/scenario-simulator"); } },
  { id: "nav-health", label: "Client Health Score", icon: "❤️", group: "AI Platform", keywords: ["health", "client", "score", "risk"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/client-health"); } },
  { id: "nav-proposal", label: "Proposal Auto-Generator", icon: "📄", group: "AI Platform", keywords: ["proposal", "generate", "prospect", "pitch"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/proposal-generator"); } },
  { id: "nav-os", label: "Consulting OS Dashboard", icon: "🖥️", group: "AI Platform", keywords: ["dashboard", "os", "platform", "overview"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/consulting-os"); } },
  { id: "nav-knowledge", label: "Knowledge Graph & IP Library", icon: "🕸️", group: "AI Platform", keywords: ["knowledge", "graph", "ip", "library", "frameworks"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/knowledge-graph"); } },
  { id: "nav-revenue", label: "Revenue Intelligence & Pipeline", icon: "💹", group: "AI Platform", keywords: ["revenue", "pipeline", "deals", "forecast"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/revenue-intelligence"); } },
  { id: "nav-workshop", label: "Workshop & Training Platform", icon: "🎓", group: "AI Platform", keywords: ["workshop", "training", "agenda", "session"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/workshop-platform"); } },
  { id: "nav-experts", label: "Expert Network & Team Assembly", icon: "👥", group: "AI Platform", keywords: ["experts", "team", "assembly", "network", "skills"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/expert-network"); } },
  { id: "nav-time", label: "Time Tracking & Smart Billing", icon: "⏱️", group: "AI Platform", keywords: ["time", "billing", "invoice", "hours", "rate"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/time-tracking"); } },
  { id: "nav-capacity", label: "Resource & Capacity Planner", icon: "📊", group: "AI Platform", keywords: ["capacity", "resource", "utilisation", "heatmap", "allocation"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/capacity-planner"); } },
  { id: "nav-vault", label: "Knowledge Vault & Methodology Library", icon: "📚", group: "AI Platform", keywords: ["knowledge", "vault", "library", "playbook", "framework", "template"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/knowledge-vault"); } },
  { id: "nav-benchmarks", label: "Benchmark Database", icon: "📈", group: "AI Platform", keywords: ["benchmark", "industry", "data", "metrics", "comparison"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/benchmark-database"); } },
  { id: "nav-deliverables", label: "Deliverable Approval Workflow", icon: "✅", group: "AI Platform", keywords: ["deliverable", "approval", "review", "version", "sign-off"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/deliverable-workflow"); } },
  { id: "nav-profitability", label: "Engagement Profitability Analytics", icon: "💰", group: "AI Platform", keywords: ["profitability", "margin", "p&l", "write-off", "scope creep"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/profitability-analytics"); } },
  { id: "baseline-settings", label: "Account Settings", icon: "⚙", group: "Actions", keywords: ["settings", "preferences", "account", "profile"], action: () => { window.location.href = "/admin/platform-settings"; } },
  { id: "baseline-notifications", label: "Notifications", icon: "🔔", group: "Actions", keywords: ["notifications", "alerts", "inbox"], action: () => { window.location.href = "/notifications"; } },
  { id: "app-szl", label: "SZL Holdings", icon: "🏛️", group: "Switch App", description: "Portfolio", action: () => { window.location.href = "/"; } },
];

const carlotaShortcuts: KeyboardShortcut[] = [
  { key: "I", description: "Open private inquiry", category: "Actions" },
  { key: "S", description: "Go to Services", category: "Navigation" },
];

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(carlotaCommands);

  return (
    <AnalyticsProvider appName="carlota-jo">
    <PrismBusProvider domain="carlota-jo">
    <SandboxModeProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <PowerUserProvider shortcuts={carlotaShortcuts} appName="Carlota Jo" accentColor={CARLOTA_ACCENT}>
          <div style={{ minHeight: "100vh" }}>
            <EcosystemNav currentAppId="carlota-jo" currentAppName="Carlota Jo" accentColor={CARLOTA_ACCENT} />
            <Router />
          </div>
          <CommandPalette
            open={cmdOpen}
            onClose={() => setCmdOpen(false)}
            commands={carlotaCommands}
            appName="Carlota Jo"
            accentColor={CARLOTA_ACCENT}
          />
          <McpOverlay domain="carlota-jo" />
          <AgentCopilot config={carlotaJoConfig} />
        </PowerUserProvider>
      </WouterRouter>
    </SandboxModeProvider>
    </PrismBusProvider>
    </AnalyticsProvider>
  );
}

export default App;
