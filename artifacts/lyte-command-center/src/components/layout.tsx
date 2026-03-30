import { Link, useLocation } from "wouter";
import { 
  Activity, 
  AlertTriangle, 
  Lightbulb, 
  BookOpen, 
  LayoutDashboard, 
  Zap,
  Settings,
  Bell,
  Server,
  Wifi,
  WifiOff,
  CreditCard,
  Brain,
  Network,
  BarChart3,
  DollarSign,
  Phone,
  Target,
  ChevronRight
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { ReactNode, useState } from "react";
import { LyteLogo } from "./LyteLogo";

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

  if (hasUnhealthy) {
    return (
      <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-1.5 flex items-center gap-2 shrink-0">
        <WifiOff className="w-3 h-3 text-red-400" />
        <span className="text-[11px] text-red-400">{data.summary.manualRequired} integration(s) not configured</span>
      </div>
    );
  }

  return (
    <div className="border-b border-cyan-500/10 px-4 py-1 flex items-center gap-2 shrink-0">
      <span className="text-[10px] font-mono text-cyan-400/50 px-2 py-0.5 rounded-full border border-cyan-500/20 bg-cyan-500/5">DEMO</span>
      <span className="text-[10px] text-cyan-400/40">Simulated data</span>
    </div>
  );
}

const PRIMARY_NAV = [
  { href: "/", label: "Command", icon: LayoutDashboard },
  { href: "/signals", label: "Signal Feed", icon: Activity },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/recommendations", label: "Recommendations", icon: Lightbulb },
  { href: "/playbooks", label: "Playbooks", icon: BookOpen },
  { href: "/observability", label: "Observability", icon: Zap },
];

const SECONDARY_NAV = [
  { href: "/commerce", label: "Commerce", icon: CreditCard },
  { href: "/intelligence", label: "Intelligence", icon: Brain },
  { href: "/ai-ops", label: "AI Ops Center", icon: Activity },
  { href: "/portfolio-observability", label: "Portfolio Health", icon: Activity },
  { href: "/topology", label: "Topology", icon: Network },
  { href: "/meridian-analytics", label: "Analytics", icon: BarChart3 },
  { href: "/anomaly-detection", label: "AI Anomaly Detection", icon: Brain },
  { href: "/slo-tracking", label: "SLO / Error Budgets", icon: Target },
  { href: "/cloud-cost", label: "Cloud Cost", icon: DollarSign },
  { href: "/oncall", label: "On-Call", icon: Phone },
];

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [moreExpanded, setMoreExpanded] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/30">
      <aside className="w-56 border-r border-white/5 bg-card/40 backdrop-blur-xl flex flex-col shrink-0 relative z-20">
        <div className="h-14 flex items-center px-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-cyan-400 to-blue-600 p-1.5 rounded-lg shadow-lg shadow-cyan-500/20 relative shrink-0">
              <LyteLogo className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-sm tracking-[0.1em] text-white leading-none">LYTE</span>
              <span className="text-[9px] uppercase tracking-[0.15em] text-cyan-400/60 leading-none mt-0.5">Command Center</span>
            </div>
          </div>
        </div>

        <div className="px-2 py-3 flex-1 flex flex-col gap-0.5 overflow-y-auto">
          {PRIMARY_NAV.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group relative",
                  isActive 
                    ? "bg-cyan-500/10 text-cyan-400" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-cyan-400 rounded-r-full" />
                )}
                <item.icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300")} />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-2">
            <button
              onClick={() => setMoreExpanded(!moreExpanded)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all w-full"
            >
              <ChevronRight className={cn("w-3.5 h-3.5 shrink-0 transition-transform", moreExpanded && "rotate-90")} />
              More pages
            </button>
            {moreExpanded && (
              <div className="mt-0.5 space-y-0.5">
                {SECONDARY_NAV.map((item) => {
                  const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 group relative ml-2",
                        isActive 
                          ? "bg-cyan-500/10 text-cyan-400" 
                          : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                      )}
                    >
                      <item.icon className="w-3 h-3 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <Zap className="w-3 h-3" />
            <span>SZL Holdings</span>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <DemoModeBanner />
        <header className="h-12 border-b border-white/5 bg-background/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20">
          <h1 className="font-display font-semibold text-base text-white/90 capitalize tracking-wide">
            {[...PRIMARY_NAV, ...SECONDARY_NAV].find(i => i.href === location)?.label || "Command Center"}
          </h1>
          
          <div className="flex items-center gap-3">
            <button className="relative p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            </button>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-xs font-medium text-white">Exec User</div>
                <div className="text-[10px] text-cyan-400/70">SZL Holdings</div>
              </div>
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-800 flex items-center justify-center text-xs font-bold border border-white/10">
                EU
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto custom-scrollbar p-6 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
