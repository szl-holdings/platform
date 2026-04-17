import { Switch, Route, useLocation } from "wouter";
import Shell from "./components/Shell";
import TodaysBrief from "./pages/TodaysBrief";
import Library from "./pages/Library";
import ConfidenceDashboard from "./pages/ConfidenceDashboard";
import CustomBrief from "./pages/CustomBrief";
import DissentChannel from "./pages/DissentChannel";
import Settings from "./pages/Settings";
import BriefingDetail from "./pages/BriefingDetail";
import SystemHealth from "./pages/SystemHealth";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "/pulse";

export default function App() {
  return (
    <Shell>
      <Switch>
        <Route path={`${BASE}/`} component={TodaysBrief} />
        <Route path={`${BASE}`} component={TodaysBrief} />
        <Route path={`${BASE}/library`} component={Library} />
        <Route path={`${BASE}/library/:id`} component={BriefingDetail} />
        <Route path={`${BASE}/confidence`} component={ConfidenceDashboard} />
        <Route path={`${BASE}/custom`} component={CustomBrief} />
        <Route path={`${BASE}/dissent`} component={DissentChannel} />
        <Route path={`${BASE}/system`} component={SystemHealth} />
        <Route path={`${BASE}/settings`} component={Settings} />
        <Route component={TodaysBrief} />
      </Switch>
    </Shell>
  );
}
