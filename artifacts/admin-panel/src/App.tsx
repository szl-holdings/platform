import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Link } from "wouter";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { CommandPalette, useCommandPalette, type CommandItem } from "@workspace/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@workspace/shared-ui/keyboard-shortcuts";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@workspace/shared-ui/ui/toaster";
import { TooltipProvider } from "@workspace/shared-ui/ui/tooltip";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { nexusConfig } from "@workspace/shared-ui/copilot-configs";
import { UserButton } from "@workspace/shared-ui/UserButton";
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
  MessageSquare,
  Cloud,
  GraduationCap,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { useState } from "react";

const DashboardPage = lazy(() => import("@/pages/dashboard"));
const AppsPage = lazy(() => import("@/pages/apps"));
const ConnectorsPage = lazy(() => import("@/pages/connectors"));
const IntegrationHealthPage = lazy(() => import("@/pages/integration-health"));
const IntegrationActivityPage = lazy(() => import("@/pages/integration-activity"));
const UsersPage = lazy(() => import("@/pages/users"));
const AuditLogPage = lazy(() => import("@/pages/audit-log"));
const WebhooksPage = lazy(() => import("@/pages/webhooks"));
const FeatureFlagsPage = lazy(() => import("@/pages/feature-flags"));
const BillingPage = lazy(() => import("@/pages/billing"));
const FilesPage = lazy(() => import("@/pages/files"));
const EnvironmentPage = lazy(() => import("@/pages/environment"));
const SeedManagerPage = lazy(() => import("@/pages/seed-manager"));
const SystemHealthPage = lazy(() => import("@/pages/system-health"));
const IntelligenceOverview = lazy(() => import("@/pages/intelligence-overview"));
const AIIntelligence = lazy(() => import("@/pages/ai-intelligence"));
const SystemObservability = lazy(() => import("@/pages/observability"));
const AlloyChatPage = lazy(() => import("@/pages/alloy-chat"));
const InfrastructurePage = lazy(() => import("@/pages/infrastructure"));
const PlatformHealthPage = lazy(() => import("@/pages/platform-health"));
const LoadTestDashboardPage = lazy(() => import("@/pages/load-test-dashboard"));
const WorkflowAutomation = lazy(() => import("@/pages/workflow-automation"));
const DeveloperPortal = lazy(() => import("@/pages/developer-portal"));
const NuroMesh = lazy(() => import("@/pages/nuro-mesh"));
const AgentTrainingPage = lazy(() => import("@/pages/agent-training"));
const NotFound = lazy(() => import("@/pages/not-found"));
const ConnectorHealth = lazy(() => import("@/pages/connector-health"));
const AgentOSPage = lazy(() => import("@/pages/agent-os"));

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
  badge?: "health";
}

interface NavSection {
  title: string;
  items: NavItem[];
  collapsible?: boolean;
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "System",
    items: [
      { path: "/", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
      { path: "/health", label: "System Health", icon: <HeartPulse className="w-4 h-4" /> },
      { path: "/integration-health", label: "Integration Health", icon: <Activity className="w-4 h-4" />, badge: "health" },
      { path: "/apps", label: "App Registry", icon: <Layers className="w-4 h-4" /> },
      { path: "/connectors", label: "Connectors", icon: <Plug className="w-4 h-4" /> },
    ],
  },
  {
    title: "Management",
    items: [
      { path: "/users", label: "Users & Roles", icon: <Users className="w-4 h-4" /> },
      { path: "/audit-log", label: "Audit Log", icon: <ScrollText className="w-4 h-4" /> },
      { path: "/billing", label: "Billing", icon: <CreditCard className="w-4 h-4" /> },
    ],
  },
  {
    title: "Configuration",
    collapsible: true,
    items: [
      { path: "/feature-flags", label: "Feature Flags", icon: <Flag className="w-4 h-4" /> },
      { path: "/webhooks", label: "Webhooks", icon: <Webhook className="w-4 h-4" /> },
      { path: "/environment", label: "Environment", icon: <Settings className="w-4 h-4" /> },
      { path: "/files", label: "Files", icon: <FolderOpen className="w-4 h-4" /> },
      { path: "/seed", label: "Seed Data", icon: <Database className="w-4 h-4" /> },
    ],
  },
  {
    title: "Intelligence",
    collapsible: true,
    items: [
      { path: "/agent-os", label: "Agent OS", icon: <Brain className="w-4 h-4" /> },
      { path: "/intelligence", label: "Overview", icon: <Globe className="w-4 h-4" /> },
      { path: "/ai-analyzer", label: "AI Observability", icon: <Brain className="w-4 h-4" /> },
      { path: "/nuro-mesh", label: "Nuro Mesh", icon: <Activity className="w-4 h-4" /> },
      { path: "/agent-training", label: "Training Studio", icon: <GraduationCap className="w-4 h-4" /> },
    ],
  },
  {
    title: "Operations",
    collapsible: true,
    items: [
      { path: "/alloy-chat", label: "AlloyChat", icon: <MessageSquare className="w-4 h-4" /> },
      { path: "/infrastructure", label: "Infrastructure", icon: <Cloud className="w-4 h-4" /> },
      { path: "/observability", label: "Observability", icon: <Activity className="w-4 h-4" /> },
      { path: "/workflows", label: "Workflows", icon: <Activity className="w-4 h-4" /> },
      { path: "/developer", label: "Developer Portal", icon: <Globe className="w-4 h-4" /> },
    ],
  },
];

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

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
      <span className="text-xs text-amber-400 font-medium">Sandbox Environment</span>
      <span className="text-xs text-amber-400/60">— {data.demoCount} of {data.total} integrations using simulated data</span>
    </div>
  );
}

function NavSection({ section }: { section: NavSection }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(section.collapsible ?? false);

  const isAnyActive = section.items.some(item =>
    location === item.path || (item.path !== "/" && location.startsWith(item.path))
  );

  const showExpanded = !collapsed || isAnyActive;

  return (
    <div>
      <button
        onClick={() => section.collapsible && setCollapsed(!collapsed)}
        className={`w-full flex items-center justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 pt-5 pb-1.5 ${section.collapsible ? "hover:text-foreground cursor-pointer transition-colors" : "cursor-default"}`}
      >
        {section.title}
        {section.collapsible && (
          <span className="opacity-40">
            {showExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
          </span>
        )}
      </button>
      {showExpanded && (
        <div className="space-y-0.5">
          {section.items.map((item) => {
            const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
            return (
              <Link
                key={item.path}
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
            );
          })}
        </div>
      )}
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-border bg-sidebar flex flex-col h-screen sticky top-0">
      <div className="px-4 py-4 border-b border-border">
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
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {NAV_SECTIONS.map((section) => (
          <NavSection key={section.title} section={section} />
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-border space-y-2">
        <UserButton showName className="w-full justify-between" />
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-muted-foreground">System Online</span>
        </div>
      </div>
    </aside>
  );
}

function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/health" component={SystemHealthPage} />
        <Route path="/apps" component={AppsPage} />
        <Route path="/connectors" component={ConnectorsPage} />
        <Route path="/connector-health" component={ConnectorHealth} />
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
        <Route path="/nuro-mesh" component={NuroMesh} />
        <Route path="/intelligence" component={IntelligenceOverview} />
        <Route path="/ai-analyzer" component={AIIntelligence} />
        <Route path="/observability" component={SystemObservability} />
        <Route path="/alloy-chat" component={AlloyChatPage} />
        <Route path="/infrastructure" component={InfrastructurePage} />
        <Route path="/platform-health" component={PlatformHealthPage} />
        <Route path="/load-tests" component={LoadTestDashboardPage} />
        <Route path="/workflows" component={WorkflowAutomation} />
        <Route path="/developer" component={DeveloperPortal} />
        <Route path="/agent-training" component={AgentTrainingPage} />
        <Route path="/agent-os" component={AgentOSPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

const adminCommands: CommandItem[] = [
  { id: "nav-dashboard", label: "Dashboard", icon: "⚙️", group: "Navigation", keywords: ["home", "overview"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/"); } },
  { id: "nav-apps", label: "Apps", icon: "📱", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/apps"); } },
  { id: "nav-connectors", label: "Connectors", icon: "🔌", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/connectors"); } },
  { id: "nav-users", label: "Users", icon: "👥", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/users"); } },
  { id: "nav-audit-log", label: "Audit Log", icon: "📋", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/audit-log"); } },
  { id: "nav-feature-flags", label: "Feature Flags", icon: "🚩", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/feature-flags"); } },
  { id: "nav-system-health", label: "System Health", icon: "❤️", group: "Monitoring", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/system-health"); } },
  { id: "nav-platform-health", label: "Platform Health", icon: "🏥", group: "Monitoring", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/platform-health"); } },
  { id: "nav-observability", label: "Observability", icon: "📊", group: "Monitoring", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/observability"); } },
  { id: "nav-infrastructure", label: "Infrastructure", icon: "🏗️", group: "Monitoring", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/infrastructure"); } },
  { id: "nav-workflows", label: "Workflow Automation", icon: "🔄", group: "Tools", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/workflows"); } },
  { id: "nav-developer", label: "Developer Portal", icon: "👨‍💻", group: "Tools", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/developer"); } },
  { id: "app-firestorm", label: "Switch to Firestorm", icon: "🔥", group: "Switch App", description: "Security Simulation", action: () => { window.location.href = "/firestorm/"; } },
  { id: "app-lyte", label: "Switch to Lyte", icon: "⚡", group: "Switch App", description: "Command Center", action: () => { window.location.href = "/lyte-command-center/"; } },
];

const adminShortcuts: KeyboardShortcut[] = [
  { key: "C", description: "Go to Connectors", category: "Navigation" },
  { key: "U", description: "Go to Users", category: "Navigation" },
  { key: "H", description: "Go to System Health", category: "Navigation" },
  { key: "F", description: "Go to Feature Flags", category: "Navigation" },
];

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(adminCommands);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <PowerUserProvider shortcuts={adminShortcuts} appName="Admin Panel" accentColor="#f97316">
            <div className="flex flex-col min-h-screen bg-background">
              <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:text-sm focus:font-medium">
                Skip to main content
              </a>
              <EcosystemNav currentAppId="admin" currentAppName="Admin Control Plane" accentColor="#f97316" />
              <div className="flex flex-1 overflow-auto">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-auto">
                  <DemoModeBanner />
                  <main id="main-content" className="flex-1 p-6" tabIndex={-1}>
                    <AppRouter />
                  </main>
                </div>
              </div>
            </div>
            <CommandPalette
              open={cmdOpen}
              onClose={() => setCmdOpen(false)}
              commands={adminCommands}
              appName="Admin Panel"
              accentColor="#f97316"
            />
          </PowerUserProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
      <AgentCopilot config={nexusConfig} />
    </QueryClientProvider>
  );
}

export default App;
