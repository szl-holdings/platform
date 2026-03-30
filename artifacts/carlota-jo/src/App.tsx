import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";

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

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <EcosystemNav currentAppId="carlota-jo" currentAppName="Carlota Jo Consulting" accentColor="#f472b6" />
        <div style={{ flex: 1 }}>
          <Router />
        </div>
      </div>
    </WouterRouter>
  );
}

export default App;
