import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { Ship, Anchor, Navigation, AlertTriangle, CloudRain, Activity, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import FleetDashboard from "@/pages/fleet-dashboard";
import VesselDetailPage from "@/pages/vessel-detail";
import RoutePlanningPage from "@/pages/route-planning";
import AlertCenterPage from "@/pages/alert-center";
import WeatherPage from "@/pages/weather-page";
import SimulationsPage from "@/pages/simulations-page";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60000 } },
});

const navItems = [
  { path: "/", label: "Fleet Dashboard", icon: LayoutDashboard },
  { path: "/routes", label: "Route Planning", icon: Navigation },
  { path: "/weather", label: "Weather Impact", icon: CloudRain },
  { path: "/simulations", label: "Simulations", icon: Activity },
  { path: "/alerts", label: "Alert Center", icon: AlertTriangle },
];

function Sidebar() {
  const [location] = useLocation();
  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Ship className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">Vessels</h1>
            <p className="text-xs text-muted-foreground">Maritime Intelligence</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = path === "/" ? location === "/" : location.startsWith(path);
          return (
            <Link key={path} href={path}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}>
                <Icon className="w-4 h-4" />
                {label}
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Anchor className="w-3 h-3" />
          <span>SZL Holdings Platform</span>
        </div>
      </div>
    </aside>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={FleetDashboard} />
      <Route path="/vessel/:id" component={VesselDetailPage} />
      <Route path="/routes" component={RoutePlanningPage} />
      <Route path="/weather" component={WeatherPage} />
      <Route path="/simulations" component={SimulationsPage} />
      <Route path="/alerts" component={AlertCenterPage} />
      <Route>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Page not found</p>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <AppRouter />
          </main>
        </div>
        <Toaster />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
