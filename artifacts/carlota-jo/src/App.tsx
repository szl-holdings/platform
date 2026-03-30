import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import Header from "@/components/Header";
import { CommandPalette, useCommandPalette, type CommandItem } from "@workspace/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@workspace/shared-ui/keyboard-shortcuts";

const Home = lazy(() => import("@/pages/Home"));
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
const EngagementWorkflow = lazy(() => import("@/pages/engagement-workflow"));
const ClientIntel = lazy(() => import("@/pages/client-intel"));
const ROICalculator = lazy(() => import("@/pages/roi-calculator"));
const BrandAudit = lazy(() => import("@/pages/brand-audit"));
const ContentStrategy = lazy(() => import("@/pages/content-strategy"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Marketing / public pages */}
        <Route path="/" component={Home} />
        <Route path="/services" component={ServicesPage} />
        <Route path="/who-we-serve" component={WhoWeServePage} />
        <Route path="/founder" component={FounderPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/approach" component={ApproachPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/inquiries" component={InquiriesPage} />
        <Route path="/legal/privacy" component={LegalPrivacyPage} />
        <Route path="/legal/terms" component={LegalTermsPage} />

        {/* Client Portal */}
        <Route path="/client-portal" component={ClientPortalOverview} />
        <Route path="/client-portal/documents" component={ClientPortalDocuments} />
        <Route path="/client-portal/updates" component={ClientPortalUpdates} />
        <Route path="/client-portal/messages" component={ClientPortalMessages} />
        <Route path="/client-portal/settings" component={ClientPortalSettings} />

        {/* Legacy routes */}
        <Route path="/book" component={BookingFlow} />
        <Route path="/booking/success" component={BookingSuccess} />
        <Route path="/booking/cancel" component={BookingCancel} />
        <Route path="/booking/follow-up" component={BookingFollowUp} />
        <Route path="/observability" component={ObservabilityPage} />
        <Route path="/advisory" component={AdvisoryIntel} />
        <Route path="/ai-advisory" component={AIAdvisory} />
        <Route path="/engagements" component={EngagementWorkflow} />
        <Route path="/client-intel" component={ClientIntel} />
        <Route path="/roi-calculator" component={ROICalculator} />
        <Route path="/brand-audit" component={BrandAudit} />
        <Route path="/content-strategy" component={ContentStrategy} />
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
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <PowerUserProvider shortcuts={carlotaShortcuts} appName="Carlota Jo" accentColor="#c8a96a">
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <Header />
          <div style={{ flex: 1 }}>
            <Router />
          </div>
        </div>
        <CommandPalette
          open={cmdOpen}
          onClose={() => setCmdOpen(false)}
          commands={carlotaCommands}
          appName="Carlota Jo"
          accentColor="#c8a96a"
        />
      </PowerUserProvider>
    </WouterRouter>
  );
}

export default App;
