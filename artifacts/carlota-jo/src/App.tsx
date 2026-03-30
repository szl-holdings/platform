import { Switch, Route, Router as WouterRouter } from "wouter";
import Home from "@/pages/Home";
import BookingFlow from "@/pages/BookingFlow";
import BookingSuccess from "@/pages/BookingSuccess";
import BookingCancel from "@/pages/BookingCancel";
import BookingFollowUp from "@/pages/BookingFollowUp";
import NotFound from "@/pages/NotFound";
import ObservabilityPage from "@/pages/observability";
import AdvisoryIntel from "@/pages/AdvisoryIntel";

function Router() {
  return (
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
