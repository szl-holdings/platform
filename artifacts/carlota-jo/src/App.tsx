import { lazy, Suspense, type ReactNode } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { CommandPalette, useCommandPalette, type CommandItem } from "@szl-holdings/shared-ui/command-palette";
import { McpOverlay } from "@szl-holdings/mcp-client";
import { PrismBusProvider } from "@szl-holdings/prism-bus";
import { PowerUserProvider, type KeyboardShortcut } from "@szl-holdings/shared-ui/keyboard-shortcuts";
import { SandboxModeProvider, AnalyticsProvider } from "@szl-holdings/shared-ui";
import { UserButton } from "@szl-holdings/shared-ui/UserButton";
import { useAuth } from "@szl-holdings/replit-auth-web";
import { Users, MessageSquare } from "lucide-react";
import { LANE_ACCENT_HEX } from "@szl-holdings/shared-ui/lane-colors";

const CARLOTA_ACCENT = LANE_ACCENT_HEX.carlotaJo.primary;


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
            <div style={{ position: "fixed", top: 12, right: 16, zIndex: 9999 }}>
              <UserButton />
            </div>
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
        </PowerUserProvider>
      </WouterRouter>
    </SandboxModeProvider>
    </PrismBusProvider>
    </AnalyticsProvider>
  );
}

export default App;
