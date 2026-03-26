import { Switch, Route, Router as WouterRouter, useLocation, Link } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardPage from "@/pages/dashboard";
import AppsPage from "@/pages/apps";
import ConnectorsPage from "@/pages/connectors";
import UsersPage from "@/pages/users";
import AuditLogPage from "@/pages/audit-log";
import WebhooksPage from "@/pages/webhooks";
import FeatureFlagsPage from "@/pages/feature-flags";
import BillingPage from "@/pages/billing";
import FilesPage from "@/pages/files";
import EnvironmentPage from "@/pages/environment";
import SeedManagerPage from "@/pages/seed-manager";
import NotFound from "@/pages/not-found";
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
}

const NAV_ITEMS: NavItem[] = [
  { path: "/", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" />, section: "System" },
  { path: "/apps", label: "App Registry", icon: <Layers className="w-4 h-4" /> },
  { path: "/connectors", label: "Connectors", icon: <Plug className="w-4 h-4" /> },
  { path: "/users", label: "Users & Roles", icon: <Users className="w-4 h-4" />, section: "Management" },
  { path: "/audit-log", label: "Audit Log", icon: <ScrollText className="w-4 h-4" /> },
  { path: "/webhooks", label: "Webhooks", icon: <Webhook className="w-4 h-4" /> },
  { path: "/feature-flags", label: "Feature Flags", icon: <Flag className="w-4 h-4" />, section: "Configuration" },
  { path: "/billing", label: "Billing", icon: <CreditCard className="w-4 h-4" /> },
  { path: "/files", label: "Files", icon: <FolderOpen className="w-4 h-4" /> },
  { path: "/environment", label: "Environment", icon: <Settings className="w-4 h-4" /> },
  { path: "/seed", label: "Seed Data", icon: <Database className="w-4 h-4" /> },
];

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
      <Route path="/apps" component={AppsPage} />
      <Route path="/connectors" component={ConnectorsPage} />
      <Route path="/users" component={UsersPage} />
      <Route path="/audit-log" component={AuditLogPage} />
      <Route path="/webhooks" component={WebhooksPage} />
      <Route path="/feature-flags" component={FeatureFlagsPage} />
      <Route path="/billing" component={BillingPage} />
      <Route path="/files" component={FilesPage} />
      <Route path="/environment" component={EnvironmentPage} />
      <Route path="/seed" component={SeedManagerPage} />
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
            <main className="flex-1 p-6 overflow-auto">
              <AppRouter />
            </main>
          </div>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
