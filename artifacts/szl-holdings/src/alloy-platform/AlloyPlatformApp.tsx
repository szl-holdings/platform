import { Switch, Route, Redirect, useLocation, Router as WouterRouter } from "wouter";
import { Suspense, lazy, type ReactNode } from "react";

const LandingPage = lazy(() => import("./pages/Landing"));
const ChatPage = lazy(() => import("./pages/Chat"));
const AgentsPage = lazy(() => import("./pages/Agents"));
const WorkflowsPage = lazy(() => import("./pages/Workflows"));
const MultimodalPage = lazy(() => import("./pages/Multimodal"));
const ConnectorsPage = lazy(() => import("./pages/Connectors"));
const GovernancePage = lazy(() => import("./pages/Governance"));
const DeveloperPage = lazy(() => import("./pages/Developer"));
const AccountPage = lazy(() => import("./pages/Account"));

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const alloyBase = basePath + "/alloy-platform";

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#080c14]">
    <div className="w-6 h-6 border-2 border-[#4B8BDB]/20 border-t-[#4B8BDB] rounded-full animate-spin"></div>
  </div>
);

function AlloyRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/app/chat" component={ChatPage} />
        <Route path="/app/agents" component={AgentsPage} />
        <Route path="/app/workflows" component={WorkflowsPage} />
        <Route path="/app/multimodal" component={MultimodalPage} />
        <Route path="/app/connectors" component={ConnectorsPage} />
        <Route path="/app/governance" component={GovernancePage} />
        <Route path="/app/developer" component={DeveloperPage} />
        <Route path="/app/account" component={AccountPage} />
        <Route>
          <div className="flex min-h-screen items-center justify-center bg-[#080c14] text-white">
            404 | Page Not Found
          </div>
        </Route>
      </Switch>
    </Suspense>
  );
}

export default function AlloyPlatformApp() {
  return (
    <WouterRouter base={alloyBase}>
      <AlloyRoutes />
    </WouterRouter>
  );
}
