import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { CommandPalette, useCommandPalette, type CommandItem } from "@workspace/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@workspace/shared-ui/keyboard-shortcuts";
import { IncaAgentIndicator } from "@workspace/shared-ui/inca-agent-indicator";

const Home = lazy(() => import("@/pages/Home"));
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
        <Route path="/" component={Home} />
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
  { id: "nav-advisory", label: "Advisory Intel", icon: "🧠", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/advisory"); } },
  { id: "nav-ai-advisory", label: "AI Advisory", icon: "🤖", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/ai-advisory"); } },
  { id: "nav-engagements", label: "Engagements", icon: "🤝", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/engagements"); } },
  { id: "nav-client-intel", label: "Client Intel", icon: "📊", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/client-intel"); } },
  { id: "nav-roi", label: "ROI Calculator", icon: "💰", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/roi-calculator"); } },
  { id: "nav-brand-audit", label: "Brand Audit", icon: "🔍", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/brand-audit"); } },
  { id: "nav-content", label: "Content Strategy", icon: "📝", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/content-strategy"); } },
  { id: "nav-book", label: "Book Consultation", icon: "📅", group: "Actions", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/book"); } },
  { id: "app-dreamscape", label: "Switch to Dreamscape", icon: "🎨", group: "Switch App", description: "Creative Engine", action: () => { window.location.href = "/dreamscape/"; } },
];

const carlotaShortcuts: KeyboardShortcut[] = [
  { key: "B", description: "Book consultation", category: "Actions" },
  { key: "A", description: "Go to Advisory Intel", category: "Navigation" },
];

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(carlotaCommands);

  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <PowerUserProvider shortcuts={carlotaShortcuts} appName="Carlota Jo" accentColor="#f472b6">
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <EcosystemNav currentAppId="carlota-jo" currentAppName="Carlota Jo Consulting" accentColor="#f472b6" />
          <div style={{ flex: 1 }}>
            <Router />
          </div>
        </div>
        <CommandPalette
          open={cmdOpen}
          onClose={() => setCmdOpen(false)}
          commands={carlotaCommands}
          appName="Carlota Jo"
          accentColor="#f472b6"
        />
        <IncaAgentIndicator 
          agentName="Advisory Agent" 
          systemType="mama-quilla" 
          currentTask="Synthesising client readiness signals for next session" 
          confidence={0.87} 
        />
      </PowerUserProvider>
    </WouterRouter>
  );
}

export default App;
