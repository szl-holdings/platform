import * as React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Film, Video, Mic, FolderOpen, Search, Bell, Settings, Server, Wifi, WifiOff, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "./ui";

interface AppHealthSummary {
  services: { name: string; status: string }[];
  summary: { total: number; liveConfigured: number; mockedDemoMode: number; manualRequired: number };
}

function DemoModeBanner() {
  const { data } = useQuery<AppHealthSummary>({
    queryKey: ["app-health-dreamscape"],
    queryFn: () => fetch("/api/services/health/app/dreamscape").then((r) => r.json()),
    refetchInterval: 60000,
  });
  if (!data) return null;
  const hasDemoMode = data.summary.mockedDemoMode > 0;
  const hasUnhealthy = data.summary.manualRequired > 0;
  if (!hasDemoMode && !hasUnhealthy) return null;
  const demoNames = data.services.filter((s) => s.status === "MOCKED_DEMO_MODE").map((s) => s.name);
  if (hasUnhealthy) {
    return (
      <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 flex items-center gap-2 shrink-0">
        <WifiOff className="w-4 h-4 text-red-400" />
        <span className="text-xs text-red-400 font-medium">{data.summary.manualRequired} integration(s) not configured</span>
      </div>
    );
  }
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center gap-2 shrink-0">
      <Server className="w-4 h-4 text-amber-400" />
      <span className="text-xs text-amber-400 font-medium">Demo Mode</span>
      <span className="text-xs text-amber-400/60">— {demoNames.join(", ")} using simulated data</span>
    </div>
  );
}

function IntegrationStatusFooter() {
  const { data } = useQuery<AppHealthSummary>({
    queryKey: ["app-health-dreamscape"],
    queryFn: () => fetch("/api/services/health/app/dreamscape").then((r) => r.json()),
    refetchInterval: 60000,
  });
  if (!data) return null;
  return (
    <div className="px-6 pb-2 space-y-2">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Integrations</div>
      <div className="flex flex-wrap gap-1">
        {data.services.map((svc) => (
          <span key={svc.name} className={cn(
            "inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded",
            svc.status === "LIVE_CONFIGURED" ? "bg-emerald-500/10 text-emerald-400" :
            svc.status === "MOCKED_DEMO_MODE" ? "bg-amber-500/10 text-amber-400" :
            "bg-red-500/10 text-red-400"
          )}>
            {svc.status === "LIVE_CONFIGURED" ? <Wifi className="w-2.5 h-2.5" /> :
             svc.status === "MOCKED_DEMO_MODE" ? <Server className="w-2.5 h-2.5" /> :
             <WifiOff className="w-2.5 h-2.5" />}
            {svc.name}
          </span>
        ))}
      </div>
    </div>
  );
}

const navItems = [
  { name: "Workspace", href: "/", icon: LayoutDashboard },
  { name: "Campaigns", href: "/campaigns", icon: Film },
  { name: "Global Assets", href: "/assets", icon: FolderOpen },
  { name: "Voices", href: "/voice", icon: Mic },
  { name: "AI Studio", href: "/ai-studio", icon: Sparkles },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background flex w-full overflow-hidden text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-xl flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary via-amber-400 to-amber-300 flex items-center justify-center shadow-lg shadow-primary/30 cinematic-glow">
                <Video className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-base tracking-[0.2em] text-foreground leading-none">DREAMSCAPE</span>
                <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground/60 leading-none mt-0.5">Creative Engine</span>
              </div>
            </div>
          </div>
          
          <nav className="p-4 space-y-1">
            {navItems.map(item => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link key={item.name} href={item.href} className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}>
                  <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <IntegrationStatusFooter />
        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-muted-foreground">SJ</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none">Sarah Jenkins</span>
              <span className="text-xs text-muted-foreground mt-1">Creative Director</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <DemoModeBanner />
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-64 md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search campaigns, scripts, assets..." 
                className="w-full bg-muted/50 border border-border/50 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-muted-foreground hover:text-primary transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute 1 top-0 right-0 w-2 h-2 bg-primary rounded-full"></span>
            </button>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
