import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Target, 
  GitCommit, 
  ShieldAlert, 
  BellRing, 
  TrendingUp,
  FileBarChart,
  Command
} from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scorecards", label: "Scorecards", icon: Target },
  { href: "/milestones", label: "Milestones", icon: GitCommit },
  { href: "/risks", label: "Risks & Blockers", icon: ShieldAlert },
  { href: "/alerts", label: "Alerting Center", icon: BellRing },
  { href: "/trends", label: "Trend History", icon: TrendingUp },
  { href: "/rollup", label: "Executive Rollup", icon: FileBarChart },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 border-r border-sidebar-border bg-sidebar flex flex-col h-screen flex-shrink-0 relative z-20">
      <div className="p-6 flex items-center gap-3 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
          <Command className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg leading-tight text-white tracking-wide">SZL Readiness</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Portfolio View</p>
        </div>
      </div>
      
      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
          Main Navigation
        </div>
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group relative overflow-hidden",
                  isActive 
                    ? "text-primary-foreground bg-primary/10 font-medium" 
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent z-0 border-l-2 border-primary"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={cn(
                  "w-5 h-5 relative z-10 transition-colors duration-200", 
                  isActive ? "text-primary" : "group-hover:text-white"
                )} />
                <span className="relative z-10 text-sm">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/5">
        <div className="bg-card rounded-xl p-4 border border-white/5 shadow-inner">
          <div className="text-xs font-medium text-muted-foreground mb-1">Active Program</div>
          <div className="font-semibold text-white text-sm truncate">Project Apollo</div>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full w-[82.5%]" />
            </div>
            <span className="text-xs font-bold text-primary">82.5</span>
          </div>
        </div>
      </div>
    </div>
  );
}
