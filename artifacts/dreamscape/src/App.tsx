import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { museConfig } from "@workspace/shared-ui/copilot-configs";

const Workspace = lazy(() => import("@/pages/workspace").then(m => ({ default: m.Workspace || m.default })));
const CampaignDetail = lazy(() => import("@/pages/campaign-detail").then(m => ({ default: m.CampaignDetail || m.default })));
const AIStudio = lazy(() => import("@/pages/ai-studio").then(m => ({ default: m.AIStudio || m.default })));
const ContentCalendar = lazy(() => import("@/pages/content-calendar").then(m => ({ default: m.ContentCalendar || m.default })));
const SocialAssets = lazy(() => import("@/pages/social-assets").then(m => ({ default: m.SocialAssets || m.default })));
const ContentGuides = lazy(() => import("@/pages/content-guides").then(m => ({ default: m.ContentGuides || m.default })));
const GeneratorTools = lazy(() => import("@/pages/generator-tools").then(m => ({ default: m.GeneratorTools || m.default })));
const AuroraGallery = lazy(() => import("@/pages/aurora-gallery"));
const NotFound = lazy(() => import("@/pages/not-found"));
const ObservabilityPage = lazy(() => import("@/pages/observability"));
const BrandVoiceEngine = lazy(() => import("@/pages/brand-voice-engine"));
const VoiceStudio = lazy(() => import("@/pages/voice-studio"));
const MotionGraphics = lazy(() => import("@/pages/motion-graphics"));
const CollaborativeWorkspace = lazy(() => import("@/pages/collaborative-workspace"));

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
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Layout>
          <Router />
        </Layout>
      </WouterRouter>
      <AgentCopilot config={museConfig} />
    </QueryClientProvider>
  );
}

export default App;
