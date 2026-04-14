import { useState, lazy, Suspense } from "react";
import { Router, Route, Switch, useLocation } from "wouter";
import { SettingsProvider } from "./lib/SettingsContext";
import LivePulseStrip from "./components/LivePulseStrip";
import Sidebar from "./components/Sidebar";
import { AgentCopilot } from "@szl-holdings/shared-ui/copilot";
import { nexusConfig } from "@szl-holdings/shared-ui/copilot-configs";
import { AIStatusBar } from "@szl-holdings/shared-ui/ai-status-bar";
import FusionTimeline from "./pages/FusionTimeline";
import EntityCanvas from "./pages/EntityCanvas";
import CorrelationEngine from "./pages/CorrelationEngine";
import SituationRooms from "./pages/SituationRooms";
import CommandActions from "./pages/CommandActions";
import Settings from "./pages/Settings";
import MultimodalGallery from "./pages/MultimodalGallery";
import AgentSwarm from "./pages/AgentSwarm";
import DealAutopilot from "./pages/DealAutopilot";
const NexusPulse = lazy(() => import("./pages/pulse"));

type Page = "timeline" | "canvas" | "correlations" | "rooms" | "actions" | "deal-autopilot" | "settings" | "multimodal" | "swarm";

const PAGE_TO_PATH: Record<Page, string> = {
  timeline:       "/nexus/timeline",
  canvas:         "/nexus/canvas",
  correlations:   "/nexus/correlations",
  rooms:          "/nexus/rooms",
  actions:        "/nexus/actions",
  "deal-autopilot": "/nexus/deal-autopilot",
  settings:       "/nexus/settings",
  multimodal:     "/nexus/multimodal",
  swarm:          "/nexus/swarm",
};

const PATH_TO_PAGE: Record<string, Page> = Object.fromEntries(
  Object.entries(PAGE_TO_PATH).map(([k, v]) => [v, k as Page])
);

function AppShell() {
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentPage: Page = PATH_TO_PAGE[location] ?? "timeline";

  const handleNavigate = (page: Page) => {
    navigate(PAGE_TO_PATH[page]);
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <LivePulseStrip />
      <AIStatusBar domain="nexus" accentColor="hsl(258, 80%, 62%)" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-hidden flex flex-col">
          <Switch>
            <Route path="/nexus/pulse">{() => <Suspense fallback={<div />}><NexusPulse /></Suspense>}</Route>
            <Route path="/nexus/canvas" component={EntityCanvas} />
            <Route path="/nexus/correlations" component={CorrelationEngine} />
            <Route path="/nexus/rooms" component={SituationRooms} />
            <Route path="/nexus/actions" component={CommandActions} />
            <Route path="/nexus/deal-autopilot" component={DealAutopilot} />
            <Route path="/nexus/settings" component={Settings} />
            <Route path="/nexus/multimodal" component={MultimodalGallery} />
            <Route path="/nexus/swarm" component={AgentSwarm} />
            <Route component={FusionTimeline} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router base="">
      <SettingsProvider>
        <AppShell />
        <AgentCopilot config={nexusConfig} />
      </SettingsProvider>
    </Router>
  );
}
