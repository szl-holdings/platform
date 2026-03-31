import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { AlloyIntelligenceLayout } from "@/components/alloy-intelligence-layout";
import { CommandPalette, useCommandPalette, type CommandItem } from "@workspace/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@workspace/shared-ui/keyboard-shortcuts";
import { Film, Sparkles } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 1000 * 60 * 5, retry: 1 },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const WorkspacePage = lazy(() => import("@/pages/workspace"));
const CampaignDetailPage = lazy(() => import("@/pages/campaign-detail").then((m) => ({ default: m.CampaignDetail })));
const BrandVoiceEngine = lazy(() => import("@/pages/brand-voice-engine"));
const AiStudio = lazy(() => import("@/pages/ai-studio"));
const ContentCalendar = lazy(() => import("@/pages/content-calendar"));
const MotionGraphics = lazy(() => import("@/pages/motion-graphics"));
const VoiceStudio = lazy(() => import("@/pages/voice-studio"));
const SocialAssets = lazy(() => import("@/pages/social-assets"));
const ContentGuides = lazy(() => import("@/pages/content-guides"));
const GeneratorTools = lazy(() => import("@/pages/generator-tools"));
const AuroraGallery = lazy(() => import("@/pages/aurora-gallery"));
const CollaborativeWorkspace = lazy(() => import("@/pages/collaborative-workspace"));
const ObservabilityPage = lazy(() => import("@/pages/observability"));

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={WorkspacePage} />
        <Route path="/campaigns/:id" component={CampaignDetailPage} />
        <Route path="/brand-voice" component={BrandVoiceEngine} />
        <Route path="/ai-studio" component={AiStudio} />
        <Route path="/content-calendar" component={ContentCalendar} />
        <Route path="/motion-graphics" component={MotionGraphics} />
        <Route path="/voice-studio" component={VoiceStudio} />
        <Route path="/social-assets" component={SocialAssets} />
        <Route path="/content-guides" component={ContentGuides} />
        <Route path="/generator-tools" component={GeneratorTools} />
        <Route path="/aurora-gallery" component={AuroraGallery} />
        <Route path="/workspace" component={CollaborativeWorkspace} />
        <Route path="/observability" component={ObservabilityPage} />
        <Route>
          <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Page not found</div>
        </Route>
      </Switch>
    </Suspense>
  );
}

const BASE = (import.meta.env.BASE_URL ?? "/dreamscape/").replace(/\/$/, "");
function navTo(path: string) { return () => { window.location.href = `${BASE}${path}`; }; }

const dreamscapeCommands: CommandItem[] = [
  { id: "nav-hub", label: "Campaign Hub", icon: "🎬", group: "Navigation", keywords: ["home", "campaigns", "overview"], action: navTo("/") },
  { id: "nav-brand-voice", label: "Brand Voice Engine", icon: "✨", group: "Navigation", action: navTo("/brand-voice") },
  { id: "nav-ai-studio", label: "AI Studio", icon: "🎥", group: "Navigation", action: navTo("/ai-studio") },
  { id: "nav-calendar", label: "Content Calendar", icon: "📅", group: "Production", action: navTo("/content-calendar") },
  { id: "nav-motion", label: "Motion Graphics", icon: "🎞️", group: "Production", action: navTo("/motion-graphics") },
  { id: "nav-voice", label: "Voice Studio", icon: "🎤", group: "Production", action: navTo("/voice-studio") },
  { id: "nav-social", label: "Social Assets", icon: "📱", group: "Production", action: navTo("/social-assets") },
  { id: "nav-guides", label: "Content Guides", icon: "📖", group: "Intelligence", action: navTo("/content-guides") },
  { id: "nav-generator", label: "Generator Tools", icon: "⚡", group: "Intelligence", action: navTo("/generator-tools") },
  { id: "nav-gallery", label: "Aurora Gallery", icon: "🌅", group: "Intelligence", action: navTo("/aurora-gallery") },
  { id: "app-alloy", label: "Switch to Alloy", icon: "⚡", group: "Switch App", description: "Execution Fabric", action: () => { window.location.href = "/alloy/"; } },
  { id: "app-lyte", label: "Switch to Lyte", icon: "💡", group: "Switch App", description: "Command Center", action: () => { window.location.href = "/lyte-command-center/"; } },
];

const dreamscapeShortcuts: KeyboardShortcut[] = [
  { key: "C", description: "Campaign Hub", category: "Navigation" },
  { key: "B", description: "Brand Voice Engine", category: "Navigation" },
  { key: "V", description: "Voice Studio", category: "Production" },
  { key: "G", description: "Generator Tools", category: "Intelligence" },
];

function AppContent({ cmdOpen, setCmdOpen }: { cmdOpen: boolean; setCmdOpen: (v: boolean) => void }) {
  return (
    <PowerUserProvider shortcuts={dreamscapeShortcuts} appName="Dreamscape" accentColor="#ec4899">
      <div className="flex flex-col h-screen" style={{ background: "#080614" }}>
        <EcosystemNav currentAppId="dreamscape" currentAppName="Dreamscape — Creative Studio" accentColor="#ec4899" />
        <div className="flex-1 overflow-hidden">
          <AlloyIntelligenceLayout>
            <Router />
          </AlloyIntelligenceLayout>
        </div>
      </div>
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        commands={dreamscapeCommands}
        appName="Dreamscape"
        accentColor="#ec4899"
      />
    </PowerUserProvider>
  );
}

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(dreamscapeCommands);

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AppContent cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
