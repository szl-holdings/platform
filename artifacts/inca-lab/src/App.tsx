import { Router, Route, Switch, useLocation } from "wouter";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { ModelIntelligence } from "./pages/ModelIntelligence";
import { NuroMeshCommand } from "./pages/NuroMeshCommand";
import { AIGatewayConsole } from "./pages/AIGatewayConsole";
import { DeploymentRunway } from "./pages/DeploymentRunway";
import { LLMOpsObservatory } from "./pages/LLMOpsObservatory";
import { ModelLab } from "./pages/ModelLab";
import { AgentCrewBuilder } from "./pages/AgentCrewBuilder";
import { WorkflowForge } from "./pages/WorkflowForge";
import { ProtocolBridge } from "./pages/ProtocolBridge";
import { DomainAgentLibrary } from "./pages/DomainAgentLibrary";
import { SecurityPosture } from "./pages/SecurityPosture";
import { AgentMemoryViewer } from "./pages/AgentMemoryViewer";
import { ConsensusChamber } from "./pages/ConsensusChamber";

export type Page =
  | "dashboard"
  | "intelligence"
  | "nuro-mesh"
  | "gateway"
  | "deployment"
  | "observatory"
  | "lab"
  | "crew-builder"
  | "workflow-forge"
  | "protocol-bridge"
  | "agent-library"
  | "security"
  | "memory"
  | "consensus";

const PAGE_ROUTES: Record<Page, string> = {
  dashboard: "/inca-lab/",
  intelligence: "/inca-lab/intelligence",
  "nuro-mesh": "/inca-lab/nuro-mesh",
  gateway: "/inca-lab/gateway",
  deployment: "/inca-lab/deployment",
  observatory: "/inca-lab/observatory",
  lab: "/inca-lab/lab",
  "crew-builder": "/inca-lab/crew-builder",
  "workflow-forge": "/inca-lab/workflow-forge",
  "protocol-bridge": "/inca-lab/protocol-bridge",
  "agent-library": "/inca-lab/agent-library",
  security: "/inca-lab/security",
  memory: "/inca-lab/memory",
  consensus: "/inca-lab/consensus",
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
    if (location.startsWith("/inca-lab/crew-builder")) return "crew-builder";
    if (location.startsWith("/inca-lab/workflow-forge")) return "workflow-forge";
    if (location.startsWith("/inca-lab/protocol-bridge")) return "protocol-bridge";
    if (location.startsWith("/inca-lab/agent-library")) return "agent-library";
    if (location.startsWith("/inca-lab/security")) return "security";
    if (location.startsWith("/inca-lab/memory")) return "memory";
    if (location.startsWith("/inca-lab/consensus")) return "consensus";
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
          <Route path="/inca-lab/nuro-mesh">
            <NuroMeshCommand onNavigate={onNavigate} />
          </Route>
          <Route path="/inca-lab/gateway" component={AIGatewayConsole} />
          <Route path="/inca-lab/deployment" component={DeploymentRunway} />
          <Route path="/inca-lab/observatory" component={LLMOpsObservatory} />
          <Route path="/inca-lab/lab" component={ModelLab} />
          <Route path="/inca-lab/crew-builder" component={AgentCrewBuilder} />
          <Route path="/inca-lab/workflow-forge" component={WorkflowForge} />
          <Route path="/inca-lab/protocol-bridge" component={ProtocolBridge} />
          <Route path="/inca-lab/agent-library" component={DomainAgentLibrary} />
          <Route path="/inca-lab/security" component={SecurityPosture} />
          <Route path="/inca-lab/memory">
            <AgentMemoryViewer />
          </Route>
          <Route path="/inca-lab/consensus" component={ConsensusChamber} />
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
