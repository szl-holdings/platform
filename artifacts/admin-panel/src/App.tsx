import { Switch, Route, Router as WouterRouter, useLocation, Link } from "wouter";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { nexusConfig } from "@workspace/shared-ui/copilot-configs";
import DashboardPage from "@/pages/dashboard";
import AppsPage from "@/pages/apps";
import ConnectorsPage from "@/pages/connectors";
import IntegrationHealthPage from "@/pages/integration-health";
import IntegrationActivityPage from "@/pages/integration-activity";
import UsersPage from "@/pages/users";
import AuditLogPage from "@/pages/audit-log";
import WebhooksPage from "@/pages/webhooks";
import FeatureFlagsPage from "@/pages/feature-flags";
import BillingPage from "@/pages/billing";
import FilesPage from "@/pages/files";
import EnvironmentPage from "@/pages/environment";
import SeedManagerPage from "@/pages/seed-manager";
import SystemHealthPage from "@/pages/system-health";
import IntelligenceOverview from "@/pages/intelligence-overview";
import AIIntelligence from "@/pages/ai-intelligence";
import NotFound from "@/pages/not-found";
import { api } from "@/lib/api";
import {
  LayoutDashboard,
  Layers,
  Plug,
  Users,
  ScrollText,
  Webhook,
  Flag,
  CreditCard,
  FolderOpen,
  Settings,
  Database,
  Hexagon,
  HeartPulse,
  Activity,
  AlertTriangle,
  Server,
  Brain,
  Globe,
} from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  section?: string;
  badge?: "health";
}

const NAV_ITEMS: NavItem[] = [
  { path: "/", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" />, section: "System" },
  { path: "/health", label: "System Health", icon: <HeartPulse className="w-4 h-4" /> },
  { path: "/apps", label: "App Registry", icon: <Layers className="w-4 h-4" /> },
  { path: "/connectors", label: "Connectors", icon: <Plug className="w-4 h-4" /> },
  { path: "/integration-health", label: "Integration Health", icon: <HeartPulse className="w-4 h-4" />, badge: "health" },
  { path: "/integration-activity", label: "Activity Feed", icon: <Activity className="w-4 h-4" /> },
  { path: "/users", label: "Users & Roles", icon: <Users className="w-4 h-4" />, section: "Management" },
  { path: "/audit-log", label: "Audit Log", icon: <ScrollText className="w-4 h-4" /> },
  { path: "/webhooks", label: "Webhooks", icon: <Webhook className="w-4 h-4" /> },
  { path: "/feature-flags", label: "Feature Flags", icon: <Flag className="w-4 h-4" />, section: "Configuration" },
  { path: "/billing", label: "Billing", icon: <CreditCard className="w-4 h-4" /> },
  { path: "/files", label: "Files", icon: <FolderOpen className="w-4 h-4" /> },
  { path: "/environment", label: "Environment", icon: <Settings className="w-4 h-4" /> },
  { path: "/seed", label: "Seed Data", icon: <Database className="w-4 h-4" /> },
  { path: "/intelligence", label: "Intelligence", icon: <Globe className="w-4 h-4" />, section: "Intelligence" },
  { path: "/ai-analyzer", label: "AI Analyzer", icon: <Brain className="w-4 h-4" /> },
];

function HealthBadge() {
  const { data } = useQuery({
    queryKey: ["health-summary"],
    queryFn: api.getHealthSummary,
    refetchInterval: 30000,
  });

  if (!data) return null;

  if (data.hasUnhealthy) {
    return (
      <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 text-red-400">
        <AlertTriangle className="w-3 h-3" />
      </span>
    );
  }

  if (data.hasDemoMode) {
    return (
      <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400">
        <Server className="w-3 h-3" />
      </span>
    );
  }

  return null;
}

function DemoModeBanner() {
  const { data } = useQuery({
    queryKey: ["health-summary"],
    queryFn: api.getHealthSummary,
    refetchInterval: 60000,
  });

  if (!data || (!data.hasDemoMode && !data.hasUnhealthy)) return null;

  if (data.hasUnhealthy) {
    return (
      <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-400" />
        <span className="text-xs text-red-400 font-medium">{data.unhealthyCount} integration(s) not configured</span>
        <span className="text-xs text-red-400/60">— Some features may be unavailable</span>
      </div>
    );
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center gap-2">
      <Server className="w-4 h-4 text-amber-400" />
      <span className="text-xs text-amber-400 font-medium">Demo Mode Active</span>
      <span className="text-xs text-amber-400/60">— {data.demoCount} of {data.total} integrations using simulated data</span>
    </div>
  );
}

function Sidebar() {
  const [location] = useLocation();
  let currentSection = "";

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-sidebar flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Hexagon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">SZL Admin</div>
            <div className="text-xs text-muted-foreground">Control Plane</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {NAV_ITEMS.map((item) => {
          const showSection = item.section && item.section !== currentSection;
          if (item.section) currentSection = item.section;
          const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));

          return (
            <div key={item.path}>
              {showSection && (
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 pt-4 pb-2">
                  {item.section}
                </div>
              )}
              <Link
                href={item.path}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                {item.icon}
                {item.label}
                {item.badge === "health" && <HealthBadge />}
              </Link>
            </div>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <span className="text-xs text-muted-foreground">System Online</span>
        </div>
      </div>
    </aside>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/health" component={SystemHealthPage} />
      <Route path="/apps" component={AppsPage} />
      <Route path="/connectors" component={ConnectorsPage} />
      <Route path="/integration-health" component={IntegrationHealthPage} />
      <Route path="/integration-activity" component={IntegrationActivityPage} />
      <Route path="/users" component={UsersPage} />
      <Route path="/audit-log" component={AuditLogPage} />
      <Route path="/webhooks" component={WebhooksPage} />
      <Route path="/feature-flags" component={FeatureFlagsPage} />
      <Route path="/billing" component={BillingPage} />
      <Route path="/files" component={FilesPage} />
      <Route path="/environment" component={EnvironmentPage} />
      <Route path="/seed" component={SeedManagerPage} />
      <Route path="/intelligence" component={IntelligenceOverview} />
      <Route path="/ai-analyzer" component={AIIntelligence} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <div className="flex min-h-screen bg-background">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-auto">
              <DemoModeBanner />
              <main className="flex-1 p-6">
                <AppRouter />
              </main>
            </div>
          </div>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
      <AgentCopilot config={nexusConfig} />
    </QueryClientProvider>
  );
}

export default App;
