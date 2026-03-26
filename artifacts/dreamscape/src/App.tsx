import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Workspace } from "@/pages/workspace";
import { CampaignDetail } from "@/pages/campaign-detail";
import { AIStudio } from "@/pages/ai-studio";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Workspace} />
      <Route path="/campaigns" component={Workspace} />
      <Route path="/campaigns/:id" component={CampaignDetail} />
      <Route path="/ai-studio" component={AIStudio} />
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
    </QueryClientProvider>
  );
}

export default App;
