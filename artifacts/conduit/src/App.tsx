import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Toaster } from 'sonner';
import { Layout } from '@/components/layout';
import Dashboard from '@/pages/dashboard';
import ConnectionsList from '@/pages/connections/list';
import ConnectionsNew from '@/pages/connections/new';
import SyncsList from '@/pages/syncs/list';
import SyncsNew from '@/pages/syncs/new';
import SyncsDetail from '@/pages/syncs/detail';
import RunsList from '@/pages/runs/list';
import RunsDetail from '@/pages/runs/detail';
import TemplatesList from '@/pages/templates/list';
import Settings from '@/pages/settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/connections" component={ConnectionsList} />
        <Route path="/connections/new" component={ConnectionsNew} />
        <Route path="/syncs" component={SyncsList} />
        <Route path="/syncs/new" component={SyncsNew} />
        <Route path="/syncs/:id" component={SyncsDetail} />
        <Route path="/runs" component={RunsList} />
        <Route path="/runs/:id" component={RunsDetail} />
        <Route path="/templates" component={TemplatesList} />
        <Route path="/settings" component={Settings} />
        <Route>
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Page not found
          </div>
        </Route>
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <AppContent />
      </WouterRouter>
      <Toaster theme="dark" toastOptions={{ className: 'font-sans' }} />
    </QueryClientProvider>
  );
}

export default App;
