import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router as WouterRouter, Switch, Route } from "wouter";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import TenantsPage from "./pages/TenantsPage";
import BrandingPage from "./pages/BrandingPage";
import DomainsPage from "./pages/DomainsPage";
import TeamPage from "./pages/TeamPage";
import UsagePage from "./pages/UsagePage";
import Layout from "./components/Layout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 30_000, retry: 1 },
  },
});

const BASE = import.meta.env.BASE_URL;

function AuthenticatedApp() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  return (
    <Layout user={user} onLogout={logout}>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/tenants" component={TenantsPage} />
        <Route path="/branding/:orgId" component={BrandingPage} />
        <Route path="/branding" component={BrandingPage} />
        <Route path="/domains/:orgId" component={DomainsPage} />
        <Route path="/domains" component={DomainsPage} />
        <Route path="/team" component={TeamPage} />
        <Route path="/usage" component={UsagePage} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WouterRouter base={BASE.replace(/\/$/, "")}>
          <AuthenticatedApp />
        </WouterRouter>
        <Toaster theme="dark" position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
