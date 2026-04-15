import { useState, lazy, Suspense } from "react";
import { Router, Route, Switch, useLocation } from "wouter";
import { CommandPalette, useCommandPalette, getEcosystemSwitchCommands, createBaselineWebActions, useRegisterCommands, type CommandItem } from "@szl-holdings/shared-ui/command-palette";
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
const OntologyGraph = lazy(() => import("./pages/OntologyGraph"));
const FusionAlerts = lazy(() => import("./pages/FusionAlerts"));

type Page = "timeline" | "canvas" | "correlations" | "rooms" | "actions" | "deal-autopilot" | "settings" | "multimodal" | "swarm" | "ontology" | "fusion-alerts";

const PAGE_TO_PATH: Record<Page, string> = {
  timeline:         "/nexus/timeline",
  canvas:           "/nexus/canvas",
  correlations:     "/nexus/correlations",
  rooms:            "/nexus/rooms",
  actions:          "/nexus/actions",
  "deal-autopilot": "/nexus/deal-autopilot",
  settings:         "/nexus/settings",
  multimodal:       "/nexus/multimodal",
  swarm:            "/nexus/swarm",
  ontology:         "/nexus/ontology",
  "fusion-alerts":  "/nexus/fusion-alerts",
};

const PATH_TO_PAGE: Record<string, Page> = Object.fromEntries(
  Object.entries(PAGE_TO_PATH).map(([k, v]) => [v, k as Page])
);

function buildNexusNavCommands(navigate: (path: string) => void): CommandItem[] {
  return [
    { id: "nav-timeline", label: "Fusion Timeline", description: "Real-time intelligence event stream", icon: "⚡", group: "Navigate", action: () => navigate("/nexus/timeline") },
    { id: "nav-canvas", label: "Entity Canvas", description: "Visual entity relationship mapping", icon: "🕸️", group: "Navigate", action: () => navigate("/nexus/canvas") },
    { id: "nav-correlations", label: "Correlation Engine", description: "Pattern & anomaly detection", icon: "🔗", group: "Navigate", action: () => navigate("/nexus/correlations") },
    { id: "nav-rooms", label: "Situation Rooms", description: "Collaborative command rooms", icon: "🏛️", group: "Navigate", action: () => navigate("/nexus/rooms") },
    { id: "nav-actions", label: "Command Actions", description: "Execute intelligence commands", icon: "⚙️", group: "Navigate", action: () => navigate("/nexus/actions") },
    { id: "nav-deal-autopilot", label: "Deal Autopilot", description: "Automated deal intelligence", icon: "🚀", group: "Navigate", action: () => navigate("/nexus/deal-autopilot") },
    { id: "nav-swarm", label: "Agent Swarm", description: "Multi-agent coordination", icon: "🤖", group: "Navigate", action: () => navigate("/nexus/swarm") },
    { id: "nav-ontology", label: "Ontology Graph", description: "Knowledge structure visualization", icon: "🌐", group: "Navigate", action: () => navigate("/nexus/ontology") },
    { id: "nav-fusion-alerts", label: "Fusion Alerts", description: "Cross-signal alert management", icon: "🚨", group: "Navigate", action: () => navigate("/nexus/fusion-alerts") },
    { id: "nav-multimodal", label: "Multimodal Gallery", description: "Multi-format data gallery", icon: "🎨", group: "Navigate", action: () => navigate("/nexus/multimodal") },
    ...getEcosystemSwitchCommands("nexus"),
  ];
}

function AppShell() {
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const nexusNavCmds = buildNexusNavCommands(navigate);
  const nexusCommands = useRegisterCommands(
    nexusNavCmds,
    createBaselineWebActions(navigate, {
      settingsPath: "/nexus/settings",
      helpUrl: "https://szlholdings.com/docs",
      themeToggle: {
        label: "Toggle Theme",
        action: () => { document.documentElement.classList.toggle("light"); },
      },
    })
  );
  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette(nexusCommands);

  const currentPage: Page = PATH_TO_PAGE[location] ?? "timeline";

  const handleNavigate = (page: Page) => {
    navigate(PAGE_TO_PATH[page]);
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={nexusCommands}
        appName="Nexus"
        accentColor="hsl(258, 80%, 62%)"
        placeholder="Search intelligence, rooms & entities..."
      />
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
            <Route path="/nexus/ontology">{() => <Suspense fallback={<div />}><OntologyGraph /></Suspense>}</Route>
            <Route path="/nexus/fusion-alerts">{() => <Suspense fallback={<div />}><FusionAlerts /></Suspense>}</Route>
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
