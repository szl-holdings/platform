import { lazy, Suspense, useState } from "react";
import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { UserButton } from "@workspace/shared-ui/UserButton";
import { Toaster } from "sonner";
import { cn } from "@workspace/shared-ui/utils";
import { CommandPalette, useCommandPalette, type CommandItem } from "@workspace/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@workspace/shared-ui/keyboard-shortcuts";
import { IncaAgentIndicator } from "@workspace/shared-ui/inca-agent-indicator";
import { WelcomeOverlay } from "@workspace/shared-ui/WelcomeOverlay";
import {
  LayoutDashboard,
  Building2,
  Ticket,
  Monitor,
  FileText,
  Activity,
  DollarSign,
  Users,
  Hexagon,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Server,
  Wrench,
  Brain,
  Menu,
  X,
} from "lucide-react";

const LandingPage = lazy(() => import("@/pages/landing"));
const DashboardPage = lazy(() => import("@/pages/dashboard"));
const ClientsPage = lazy(() => import("@/pages/clients"));
const ServiceDeskPage = lazy(() => import("@/pages/service-desk"));
const TicketsPage = lazy(() => import("@/pages/tickets"));
const DevicesPage = lazy(() => import("@/pages/devices"));
const ContractsPage = lazy(() => import("@/pages/contracts"));
const NOCPage = lazy(() => import("@/pages/noc"));
const RevenuePage = lazy(() => import("@/pages/revenue"));
const TechniciansPage = lazy(() => import("@/pages/technicians"));
const DispatchPage = lazy(() => import("@/pages/dispatch"));
const ObservabilityPage = lazy(() => import("@/pages/observability"));
const NotFound = lazy(() => import("@/pages/not-found"));
const RMMConsole = lazy(() => import("@/pages/rmm-console"));
const MRRDashboard = lazy(() => import("@/pages/mrr-dashboard"));
const AgentInsightsPage = lazy(() => import("@/pages/agent-insights"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60000 } },
});

interface NavSection {
  title: string;
  items: { path: string; label: string; icon: typeof LayoutDashboard }[];
}

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { path: "/dashboard", label: "Client Dashboard", icon: Building2 },
      { path: "/noc", label: "NOC Operations", icon: Activity },
    ],
  },
  {
    title: "Service Management",
    items: [
      { path: "/tickets", label: "Service Desk", icon: Ticket },
      { path: "/devices", label: "Device Inventory", icon: Monitor },
      { path: "/contracts", label: "Contracts & SLAs", icon: FileText },
      { path: "/dispatch", label: "Technician Dispatch", icon: Wrench },
    ],
  },
  {
    title: "Business",
    items: [
      { path: "/revenue", label: "Revenue & Billing", icon: DollarSign },
      { path: "/technicians", label: "Technicians", icon: Users },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { path: "/rmm", label: "RMM Console", icon: Monitor },
      { path: "/mrr", label: "MRR Dashboard", icon: DollarSign },
      { path: "/agent-insights", label: "Agent Insights", icon: Brain },
      { path: "/observability", label: "Observability", icon: Activity },
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

function Sidebar({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn("bg-card border-r border-border flex flex-col h-screen sticky top-0 transition-all duration-300", collapsed ? "w-16" : "w-64")}>
      <div className={cn("p-4 border-b border-border flex items-center", collapsed ? "justify-center" : "gap-3")}>
        <div className="w-9 h-9 rounded-md bg-primary/8 border border-primary/14 flex items-center justify-center shrink-0">
          <Hexagon className="w-5 h-5 text-primary" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="font-display text-base font-bold text-foreground truncate">Rosie</h1>
            <p className="text-[10px] text-muted-foreground">Incident Command</p>
          </div>
        )}
      </div>

      <nav className="flex-1 p-2 space-y-3 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-3 mb-1.5 font-medium">{section.title}</p>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ path, label, icon: Icon }) => {
                const isActive = location === path;
                return (
                  <Link key={path} href={path} aria-current={isActive ? "page" : undefined} onClick={onClose}>
                    <div className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer relative overflow-hidden",
                      collapsed && "justify-center",
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )} title={collapsed ? label : undefined}>
                      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" aria-hidden="true" />}
                      <Icon className={cn("w-4 h-4 shrink-0 transition-transform duration-200", isActive && "scale-110")} aria-hidden="true" />
                      {!collapsed && label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-2 border-t border-border space-y-1">
        <a href="/szl-holdings/" className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors", collapsed && "justify-center")}>
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          {!collapsed && "SZL Holdings"}
        </a>
        <a href="/" className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors", collapsed && "justify-center")}>
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          {!collapsed && "Portfolio"}
        </a>
        <div className={cn("flex items-center gap-2 px-3 py-2 text-[10px] text-emerald-400 font-medium", collapsed && "justify-center")}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          {!collapsed && "Systems Operational"}
        </div>
        <UserButton showName={!collapsed} className="w-full" />
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="p-3 border-t border-border text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" aria-hidden="true" /> : <ChevronLeft className="w-4 h-4" aria-hidden="true" />}
      </button>
    </aside>
  );
}

function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/clients" component={ClientsPage} />
        <Route path="/tickets" component={TicketsPage} />
        <Route path="/service-desk" component={ServiceDeskPage} />
        <Route path="/devices" component={DevicesPage} />
        <Route path="/contracts" component={ContractsPage} />
        <Route path="/noc" component={NOCPage} />
        <Route path="/revenue" component={RevenuePage} />
        <Route path="/technicians" component={TechniciansPage} />
        <Route path="/dispatch" component={DispatchPage} />
        <Route path="/rmm" component={RMMConsole} />
        <Route path="/mrr" component={MRRDashboard} />
        <Route path="/observability" component={ObservabilityPage} />
        <Route path="/agent-insights" component={AgentInsightsPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function DashboardLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:text-sm focus:font-medium">
        Skip to main content
      </a>
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 md:relative md:translate-x-0 transition-transform duration-200",
        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <Sidebar onClose={() => setMobileSidebarOpen(false)} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-10 md:hidden border-b border-border bg-background flex items-center px-3 shrink-0">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
          <span className="ml-2 text-sm font-semibold text-foreground">Rosie</span>
        </div>
        <main id="main-content" className="flex-1 overflow-auto" tabIndex={-1}>
          <AppRouter />
        </main>
      </div>
    </div>
  );
}

const mspCommands: CommandItem[] = [
  { id: "nav-dashboard", label: "Client Dashboard", icon: "🏢", group: "Navigation", keywords: ["home", "overview", "clients"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/dashboard"); } },
  { id: "nav-noc", label: "NOC Operations", icon: "📡", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/noc"); } },
  { id: "nav-tickets", label: "Service Desk", icon: "🎫", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/tickets"); } },
  { id: "nav-devices", label: "Device Inventory", icon: "🖥️", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/devices"); } },
  { id: "nav-contracts", label: "Contracts & SLAs", icon: "📄", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/contracts"); } },
  { id: "nav-dispatch", label: "Technician Dispatch", icon: "🔧", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/dispatch"); } },
  { id: "nav-revenue", label: "Revenue & Billing", icon: "💰", group: "Business", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/revenue"); } },
  { id: "nav-technicians", label: "Technicians", icon: "👥", group: "Business", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/technicians"); } },
  { id: "nav-rmm", label: "RMM Console", icon: "🖥️", group: "Intelligence", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/rmm"); } },
  { id: "nav-mrr", label: "MRR Dashboard", icon: "📈", group: "Intelligence", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/mrr"); } },
  { id: "app-firestorm", label: "Switch to Firestorm", icon: "🔥", group: "Switch App", description: "Security Simulation", action: () => { window.location.href = "/firestorm/"; } },
  { id: "app-lyte", label: "Switch to Lyte", icon: "⚡", group: "Switch App", description: "Command Center", action: () => { window.location.href = "/lyte-command-center/"; } },
];

const mspShortcuts: KeyboardShortcut[] = [
  { key: "T", description: "Go to Service Desk", category: "Navigation" },
  { key: "D", description: "Go to Device Inventory", category: "Navigation" },
  { key: "N", description: "Go to NOC Operations", category: "Navigation" },
  { key: "R", description: "Go to Revenue & Billing", category: "Navigation" },
];

function App() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(mspCommands);

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={basePath}>
        <PowerUserProvider shortcuts={mspShortcuts} appName="Rosie" accentColor="#ef4444">
          <div className="flex flex-col h-screen">
            <EcosystemNav currentAppId="rosie" currentAppName="Rosie — Threat & Incident Command" accentColor="#ef4444" />
            <div className="flex-1 overflow-hidden">
              <DashboardLayout />
            </div>
          </div>
          <CommandPalette
            open={cmdOpen}
            onClose={() => setCmdOpen(false)}
            commands={mspCommands}
            appName="Rosie"
            accentColor="#ef4444"
          />
          <IncaAgentIndicator agentName="IT Sentinel" systemType="mama-quilla" currentTask="Monitoring endpoint health and anomaly signals across managed clients" confidence={0.88} />
        </PowerUserProvider>
        <WelcomeOverlay
          appId="rosie"
          appName="Rosie"
          subtitle="Threat & Incident Command"
          description="Rosie gives managed service providers a single command surface for incident triage, client health, service desk operations, and revenue visibility. Built for MSP teams who need to move from alert to action without losing context."
          accentColor="#ef4444"
          icon={Monitor}
          features={[
            { icon: Building2, title: "Client command", description: "Health scoring and churn risk for every managed account. Know which clients need attention before they escalate." },
            { icon: Ticket, title: "Service desk", description: "Priority-based ticketing with SLA breach prediction and technician dispatch. Triage at speed, resolve with context." },
            { icon: Activity, title: "NOC operations", description: "Real-time alerts across all managed environments. Every anomaly is classified, attributed, and actioned — not just logged." },
            { icon: DollarSign, title: "Revenue clarity", description: "Per-client margin, MRR, and profitability tracking. Know where you make money and where you lose it." },
          ]}
        />
      </WouterRouter>
      <Toaster position="bottom-right" richColors />
    </QueryClientProvider>
  );
}

export default App;
