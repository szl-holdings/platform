import { Link, useLocation } from "wouter";
import { 
  Activity, 
  AlertTriangle, 
  Lightbulb, 
  BookOpen, 
  LayoutDashboard, 
  Zap,
  Settings,
  LogOut,
  Bell,
  Server,
  Wifi,
  WifiOff,
  CreditCard,
  Brain
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface AppHealthSummary {
  services: { name: string; status: string }[];
  summary: { total: number; liveConfigured: number; mockedDemoMode: number; manualRequired: number };
}

function DemoModeBanner() {
  const { data } = useQuery<AppHealthSummary>({
    queryKey: ["app-health-lyte"],
    queryFn: () => fetch("/api/services/health/app/lyte").then((r) => r.json()),
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
    queryKey: ["app-health-lyte"],
    queryFn: () => fetch("/api/services/health/app/lyte").then((r) => r.json()),
    refetchInterval: 60000,
  });
  if (!data) return null;
  return (
    <div className="px-4 pb-2 space-y-2">
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Integrations</div>
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

const NAV_ITEMS = [
  { href: "/", label: "Command", icon: LayoutDashboard },
  { href: "/signals", label: "Signal Feed", icon: Activity },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/recommendations", label: "Recommendations", icon: Lightbulb },
  { href: "/playbooks", label: "Playbooks", icon: BookOpen },
  { href: "/commerce", label: "Commerce", icon: CreditCard },
  { href: "/intelligence", label: "Intelligence", icon: Brain },
  { href: "/ai-ops", label: "AI Ops Center", icon: Activity },
  { href: "/observability", label: "Observability", icon: Zap },
  { href: "/portfolio-observability", label: "Portfolio Health", icon: Activity },
];

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-card/40 backdrop-blur-xl flex flex-col shrink-0 relative z-20">
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-cyan-400 to-blue-600 p-1.5 rounded-lg shadow-lg shadow-cyan-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg tracking-wide text-white">LYTE</span>
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4 px-2">Core Platform</div>
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 group relative",
                  isActive 
                    ? "bg-primary/10 text-cyan-400" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-cyan-400 rounded-r-full shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                )}
                <item.icon className={cn("w-5 h-5", isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300")} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <IntegrationStatusFooter />
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white transition-colors cursor-pointer rounded-xl hover:bg-white/5">
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white transition-colors cursor-pointer rounded-xl hover:bg-white/5">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <DemoModeBanner />
        <header className="h-16 border-b border-white/5 bg-background/50 backdrop-blur-md flex items-center justify-between px-8 shrink-0 z-20">
          <h1 className="font-display font-semibold text-xl text-white/90 capitalize tracking-wide">
            {NAV_ITEMS.find(i => i.href === location)?.label || "Command Center"}
          </h1>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
            </button>
            <div className="h-8 w-px bg-white/10 mx-2" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-white">Exec User</div>
                <div className="text-xs text-cyan-400">SZL Holdings</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-800 flex items-center justify-center text-sm font-bold shadow-lg border border-white/10">
                EU
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto custom-scrollbar p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
