import { Router, Route, Switch, useLocation } from "wouter";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { ModelIntelligence } from "./pages/ModelIntelligence";
import { NuroMeshCommand } from "./pages/NuroMeshCommand";
import { AIGatewayConsole } from "./pages/AIGatewayConsole";
import { DeploymentRunway } from "./pages/DeploymentRunway";
import { LLMOpsObservatory } from "./pages/LLMOpsObservatory";
import { ModelLab } from "./pages/ModelLab";

export type Page = "dashboard" | "intelligence" | "nuro-mesh" | "gateway" | "deployment" | "observatory" | "lab";

const PAGE_ROUTES: Record<Page, string> = {
  dashboard: "/inca-lab/",
  intelligence: "/inca-lab/intelligence",
  "nuro-mesh": "/inca-lab/nuro-mesh",
  gateway: "/inca-lab/gateway",
  deployment: "/inca-lab/deployment",
  observatory: "/inca-lab/observatory",
  lab: "/inca-lab/lab",
};

function AppShell() {
  const [location, setLocation] = useLocation();

  const currentPage: Page = (() => {
    if (location.startsWith("/inca-lab/intelligence")) return "intelligence";
    if (location.startsWith("/inca-lab/nuro-mesh")) return "nuro-mesh";
    if (location.startsWith("/inca-lab/gateway")) return "gateway";
    if (location.startsWith("/inca-lab/deployment")) return "deployment";
    if (location.startsWith("/inca-lab/observatory")) return "observatory";
    if (location.startsWith("/inca-lab/lab")) return "lab";
    return "dashboard";
  })();

  function onNavigate(page: Page) {
    setLocation(PAGE_ROUTES[page]);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      <main className="flex-1 overflow-auto">
        <Switch>
          <Route path="/inca-lab/intelligence" component={ModelIntelligence} />
          <Route path="/inca-lab/nuro-mesh" component={NuroMeshCommand} />
          <Route path="/inca-lab/gateway" component={AIGatewayConsole} />
          <Route path="/inca-lab/deployment" component={DeploymentRunway} />
          <Route path="/inca-lab/observatory" component={LLMOpsObservatory} />
          <Route path="/inca-lab/lab" component={ModelLab} />
          <Route>
            <Dashboard onNavigate={onNavigate} />
          </Route>
        </Switch>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}
