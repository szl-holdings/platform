import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { Layout } from "@/components/layout";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { museConfig } from "@workspace/shared-ui/copilot-configs";
import { CommandPalette, useCommandPalette, type CommandItem } from "@workspace/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@workspace/shared-ui/keyboard-shortcuts";
import { IncaAgentIndicator } from "@workspace/shared-ui/inca-agent-indicator";
import { WelcomeOverlay } from "@workspace/shared-ui/WelcomeOverlay";
import { Palette, Sparkles, Calendar, FolderOpen } from "lucide-react";

const Workspace = lazy(() => import("@/pages/workspace").then(m => ({ default: m.Workspace })));
const CampaignDetail = lazy(() => import("@/pages/campaign-detail").then(m => ({ default: m.CampaignDetail })));
const AIStudio = lazy(() => import("@/pages/ai-studio").then(m => ({ default: m.AIStudio })));
const ContentCalendar = lazy(() => import("@/pages/content-calendar").then(m => ({ default: m.ContentCalendar })));
const SocialAssets = lazy(() => import("@/pages/social-assets").then(m => ({ default: m.SocialAssets })));
const ContentGuides = lazy(() => import("@/pages/content-guides").then(m => ({ default: m.ContentGuides })));
const GeneratorTools = lazy(() => import("@/pages/generator-tools").then(m => ({ default: m.GeneratorTools })));
const AuroraGallery = lazy(() => import("@/pages/aurora-gallery"));
const NotFound = lazy(() => import("@/pages/not-found"));
const ObservabilityPage = lazy(() => import("@/pages/observability"));
const BrandVoiceEngine = lazy(() => import("@/pages/brand-voice-engine"));
const VoiceStudio = lazy(() => import("@/pages/voice-studio"));
const MotionGraphics = lazy(() => import("@/pages/motion-graphics"));
const CollaborativeWorkspace = lazy(() => import("@/pages/collaborative-workspace"));
const AgentInsightsPage = lazy(() => import("@/pages/agent-insights"));

const queryClient = new QueryClient();

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
        <Route path="/" component={Workspace} />
        <Route path="/campaigns" component={Workspace} />
        <Route path="/campaigns/:id" component={CampaignDetail} />
        <Route path="/ai-studio" component={AIStudio} />
        <Route path="/observability" component={ObservabilityPage} />
        <Route path="/content-calendar" component={ContentCalendar} />
        <Route path="/social-assets" component={SocialAssets} />
        <Route path="/content-guides" component={ContentGuides} />
        <Route path="/generators" component={GeneratorTools} />
        <Route path="/aurora" component={AuroraGallery} />
        <Route path="/brand-voice" component={BrandVoiceEngine} />
        <Route path="/voice-studio" component={VoiceStudio} />
        <Route path="/motion-graphics" component={MotionGraphics} />
        <Route path="/collab" component={CollaborativeWorkspace} />
        <Route path="/agent-insights" component={AgentInsightsPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

const dreamscapeCommands: CommandItem[] = [
  { id: "nav-workspace", label: "Workspace", icon: "🎨", group: "Navigation", keywords: ["home", "campaigns", "overview"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/"); } },
  { id: "nav-ai-studio", label: "AI Studio", icon: "🤖", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/ai-studio"); } },
  { id: "nav-calendar", label: "Content Calendar", icon: "📅", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/content-calendar"); } },
  { id: "nav-social", label: "Social Assets", icon: "📱", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/social-assets"); } },
  { id: "nav-guides", label: "Content Guides", icon: "📖", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/content-guides"); } },
  { id: "nav-generators", label: "Generator Tools", icon: "⚡", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/generators"); } },
  { id: "nav-aurora", label: "Aurora Gallery", icon: "🌅", group: "Creative", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/aurora"); } },
  { id: "nav-brand-voice", label: "Brand Voice Engine", icon: "🎙️", group: "Creative", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/brand-voice"); } },
  { id: "nav-voice-studio", label: "Voice Studio", icon: "🎤", group: "Creative", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/voice-studio"); } },
  { id: "nav-motion", label: "Motion Graphics", icon: "🎬", group: "Creative", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/motion-graphics"); } },
  { id: "nav-collab", label: "Collaborative Workspace", icon: "👥", group: "Creative", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/collab"); } },
  { id: "app-carlota-jo", label: "Switch to Carlota Jo", icon: "✨", group: "Switch App", description: "Brand Consulting", action: () => { window.location.href = "/carlota-jo/"; } },
  { id: "app-inca", label: "Switch to INCA", icon: "🧠", group: "Switch App", description: "AI Research", action: () => { window.location.href = "/inca/"; } },
];

const dreamscapeShortcuts: KeyboardShortcut[] = [
  { key: "C", description: "Go to Content Calendar", category: "Navigation" },
  { key: "S", description: "Go to AI Studio", category: "Navigation" },
  { key: "G", description: "Go to Generator Tools", category: "Navigation" },
  { key: "B", description: "Go to Brand Voice Engine", category: "Navigation" },
];

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(dreamscapeCommands);

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <PowerUserProvider shortcuts={dreamscapeShortcuts} appName="Dreamscape" accentColor="#7c3aed">
          <div className="flex flex-col h-screen">
            <EcosystemNav currentAppId="dreamscape" currentAppName="Dreamscape Creative Engine" accentColor="#7c3aed" />
            <div className="flex-1 overflow-hidden">
              <Layout>
                <Router />
              </Layout>
            </div>
          </div>
          <CommandPalette
            open={cmdOpen}
            onClose={() => setCmdOpen(false)}
            commands={dreamscapeCommands}
            appName="Dreamscape"
            accentColor="#7c3aed"
          />
          <IncaAgentIndicator 
            agentName="Creative Director" 
            systemType="inti" 
            currentTask="Generating brand-aligned visual concepts for active campaigns" 
            confidence={0.93} 
          />
        </PowerUserProvider>
        <WelcomeOverlay
          appId="dreamscape"
          appName="Dreamscape"
          subtitle="Creative Engine"
          description="Studio-grade content operations — campaign workspace, asset management, content calendar, and AI creative tools built for serious creative teams."
          accentColor="#7c3aed"
          icon={Palette}
          features={[
            { icon: Sparkles, title: "AI Studio", description: "Generate copy, visuals, and scripts with AI assistance" },
            { icon: Calendar, title: "Content Calendar", description: "Schedule and track all content deliverables in one view" },
            { icon: FolderOpen, title: "Asset Library", description: "Centralized brand guidelines, templates, and media files" },
            { icon: Palette, title: "Campaigns", description: "Manage brand films, social campaigns, and product launches" },
          ]}
        />
      </WouterRouter>
      <AgentCopilot config={museConfig} />
    </QueryClientProvider>
  );
}

export default App;
