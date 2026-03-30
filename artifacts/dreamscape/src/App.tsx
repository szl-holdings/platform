import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { museConfig } from "@workspace/shared-ui/copilot-configs";
import { Workspace } from "@/pages/workspace";
import { CampaignDetail } from "@/pages/campaign-detail";
import { AIStudio } from "@/pages/ai-studio";
import { ContentCalendar } from "@/pages/content-calendar";
import { SocialAssets } from "@/pages/social-assets";
import { ContentGuides } from "@/pages/content-guides";
import { GeneratorTools } from "@/pages/generator-tools";
import NotFound from "@/pages/not-found";
import ObservabilityPage from "@/pages/observability";

const queryClient = new QueryClient();

function Router() {
  return (
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
      <Route component={NotFound} />
    </Switch>
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
