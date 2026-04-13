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
import AgentConsole from "./pages/AgentConsole";
import { AgentMarketplace } from "./pages/AgentMarketplace";
import { PerformanceArena } from "./pages/PerformanceArena";
import { CognitiveVisualizer } from "./pages/CognitiveVisualizer";
import { SlaManagement } from "./pages/SlaManagement";
import { WhiteLabelPackaging } from "./pages/WhiteLabelPackaging";
import { RevenueRoi } from "./pages/RevenueRoi";
import { SkillPlayground } from "./pages/SkillPlayground";

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
  | "consensus"
  | "agent-console"
  | "agent-marketplace"
  | "performance-arena"
  | "cognitive-visualizer"
  | "sla-management"
  | "white-label"
  | "revenue-roi"
  | "skill-playground";

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
  "agent-console": "/inca-lab/agent-console",
  "agent-marketplace": "/inca-lab/agent-marketplace",
  "performance-arena": "/inca-lab/performance-arena",
  "cognitive-visualizer": "/inca-lab/cognitive-visualizer",
  "sla-management": "/inca-lab/sla-management",
  "white-label": "/inca-lab/white-label",
  "revenue-roi": "/inca-lab/revenue-roi",
  "skill-playground": "/inca-lab/skill-playground",
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
    if (location.startsWith("/inca-lab/agent-console")) return "agent-console";
    if (location.startsWith("/inca-lab/agent-marketplace")) return "agent-marketplace";
    if (location.startsWith("/inca-lab/performance-arena")) return "performance-arena";
    if (location.startsWith("/inca-lab/cognitive-visualizer")) return "cognitive-visualizer";
    if (location.startsWith("/inca-lab/sla-management")) return "sla-management";
    if (location.startsWith("/inca-lab/white-label")) return "white-label";
    if (location.startsWith("/inca-lab/revenue-roi")) return "revenue-roi";
    if (location.startsWith("/inca-lab/skill-playground")) return "skill-playground";
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
          <Route path="/inca-lab/agent-console" component={AgentConsole} />
          <Route path="/inca-lab/agent-marketplace" component={AgentMarketplace} />
          <Route path="/inca-lab/performance-arena" component={PerformanceArena} />
          <Route path="/inca-lab/cognitive-visualizer" component={CognitiveVisualizer} />
          <Route path="/inca-lab/sla-management" component={SlaManagement} />
          <Route path="/inca-lab/white-label" component={WhiteLabelPackaging} />
          <Route path="/inca-lab/revenue-roi" component={RevenueRoi} />
          <Route path="/inca-lab/skill-playground" component={SkillPlayground} />
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
