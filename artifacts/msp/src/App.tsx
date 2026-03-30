import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useState } from "react";
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
} from "lucide-react";
import LandingPage from "@/pages/landing";
import ClientsPage from "@/pages/clients";
import ServiceDeskPage from "@/pages/service-desk";
import DevicesPage from "@/pages/devices";
import ContractsPage from "@/pages/contracts";
import NOCPage from "@/pages/noc";
import RevenuePage from "@/pages/revenue";
import TechniciansPage from "@/pages/technicians";
import NotFound from "@/pages/not-found";

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
    ],
  },
  {
    title: "Business",
    items: [
      { path: "/revenue", label: "Revenue & Billing", icon: DollarSign },
      { path: "/technicians", label: "Technician Dispatch", icon: Users },
    ],
  },
];

function Sidebar() {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn("bg-card border-r border-border flex flex-col h-screen sticky top-0 transition-all duration-300", collapsed ? "w-16" : "w-64")}>
      <div className={cn("p-4 border-b border-border flex items-center", collapsed ? "justify-center" : "gap-3")}>
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Hexagon className="w-5 h-5 text-primary" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="font-display text-base font-bold text-foreground truncate">MSP Command</h1>
            <p className="text-[10px] text-muted-foreground">Center</p>
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
                  <Link key={path} href={path}>
                    <div className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer relative overflow-hidden",
                      collapsed && "justify-center",
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )} title={collapsed ? label : undefined}>
                      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />}
                      <Icon className={cn("w-4 h-4 shrink-0 transition-transform duration-200", isActive && "scale-110")} />
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
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 border-t border-border text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/dashboard" component={ClientsPage} />
      <Route path="/tickets" component={ServiceDeskPage} />
      <Route path="/devices" component={DevicesPage} />
      <Route path="/contracts" component={ContractsPage} />
      <Route path="/noc" component={NOCPage} />
      <Route path="/revenue" component={RevenuePage} />
      <Route path="/technicians" component={TechniciansPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function DashboardLayout() {
  const [location] = useLocation();
  const isLanding = location === "/";

  if (isLanding) {
    return (
      <main className="flex-1 overflow-auto">
        <LandingPage />
      </main>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <AppRouter />
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <DashboardLayout />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
