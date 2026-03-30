import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";

const Home = lazy(() => import("@/pages/Home"));
const BookingFlow = lazy(() => import("@/pages/BookingFlow"));
const BookingSuccess = lazy(() => import("@/pages/BookingSuccess"));
const BookingCancel = lazy(() => import("@/pages/BookingCancel"));
const BookingFollowUp = lazy(() => import("@/pages/BookingFollowUp"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const ObservabilityPage = lazy(() => import("@/pages/observability"));
const AdvisoryIntel = lazy(() => import("@/pages/AdvisoryIntel"));

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
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Router />
    </WouterRouter>
  );
}

export default App;
