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
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Command", icon: LayoutDashboard },
  { href: "/signals", label: "Signal Feed", icon: Activity },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/recommendations", label: "Recommendations", icon: Lightbulb },
  { href: "/playbooks", label: "Playbooks", icon: BookOpen },
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
