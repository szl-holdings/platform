import { Link, useLocation } from "wouter";
import { cn } from "@workspace/shared-ui/utils";
import { ReactNode, useState } from "react";
import {
  LayoutDashboard, Activity, TrendingDown, Radar, GitBranch,
  Bell, ChevronRight, Zap, Eye
} from "lucide-react";

const COMMAND_LOOP = [
  { phase: "DETECT", color: "#0ea5e9", active: true },
  { phase: "INTERPRET", color: "#f59e0b", active: false, link: "/lyte-command-center/" },
  { phase: "DECIDE", color: "#8b5cf6", active: false, link: "/dreamscape/" },
  { phase: "EXECUTE", color: "#00d4ff", active: false, link: "/alloy/" },
  { phase: "VERIFY", color: "#10b981", active: true },
];

const NAV = [
  { href: "/", label: "Executive Overview", icon: LayoutDashboard, phase: "DETECT" },
  { href: "/workflow-health", label: "Workflow Health", icon: Activity, phase: "DETECT" },
  { href: "/value-recovery", label: "Value Recovery", icon: TrendingDown, phase: "VERIFY" },
  { href: "/drift-detection", label: "Drift Detection", icon: Radar, phase: "DETECT" },
  { href: "/causal-drilldown", label: "Causal Drilldown", icon: GitBranch, phase: "DETECT" },
];

export function BeaconLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-full overflow-hidden">
      <aside className="w-56 border-r flex flex-col shrink-0 relative z-20" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(8,12,20,0.95)" }}>
        <div className="h-14 flex items-center px-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg shadow-lg" style={{ background: "linear-gradient(135deg, #0ea5e9, #3b82f6)", boxShadow: "0 0 12px rgba(14,165,233,0.3)" }}>
              <Eye className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-wide text-white leading-none">BEACON</span>
              <span className="text-[9px] uppercase tracking-widest leading-none mt-0.5" style={{ color: "#0ea5e9" }}>Observability Core</span>
            </div>
          </div>
        </div>

        <div className="px-3 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          <div className="text-[9px] uppercase tracking-widest mb-2 font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>Command Loop</div>
          <div className="flex items-center gap-1">
            {COMMAND_LOOP.map((p, i) => (
              <div key={p.phase} className="flex items-center gap-1">
                {p.link ? (
                  <a href={p.link} className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded transition-all hover:opacity-80" style={{
                    color: p.active ? p.color : "rgba(255,255,255,0.25)",
                    background: p.active ? `${p.color}20` : "transparent",
                    border: `1px solid ${p.active ? p.color + "50" : "transparent"}`,
                  }}>
                    {p.phase}
                  </a>
                ) : (
                  <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{
                    color: p.active ? p.color : "rgba(255,255,255,0.25)",
                    background: p.active ? `${p.color}20` : "transparent",
                    border: `1px solid ${p.active ? p.color + "50" : "transparent"}`,
                  }}>
                    {p.phase}
                  </span>
                )}
                {i < COMMAND_LOOP.length - 1 && (
                  <ChevronRight className="w-2.5 h-2.5 shrink-0" style={{ color: "rgba(255,255,255,0.15)" }} />
                )}
              </div>
            ))}
          </div>
        </div>

        <nav className="px-2 py-3 flex-1 flex flex-col gap-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group relative",
                isActive ? "text-sky-400" : "text-slate-400 hover:text-white hover:bg-white/5"
              )} style={{ background: isActive ? "rgba(14,165,233,0.08)" : undefined }}>
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full" style={{ background: "#0ea5e9" }} />}
                <item.icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-sky-400" : "text-slate-500 group-hover:text-slate-300")} />
                <span>{item.label}</span>
                {item.phase === "VERIFY" && isActive && (
                  <span className="ml-auto text-[8px] px-1 py-0.5 rounded font-bold uppercase" style={{ color: "#10b981", background: "rgba(16,185,129,0.15)" }}>VERIFY</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            <Zap className="w-3 h-3" />
            <span>SZL Business OS</span>
          </div>
          <div className="flex gap-1 mt-2">
            <a href="/lyte-command-center/" className="text-[9px] px-1.5 py-0.5 rounded font-medium hover:opacity-80 transition-opacity" style={{ color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>LYTE</a>
            <a href="/alloy/" className="text-[9px] px-1.5 py-0.5 rounded font-medium hover:opacity-80 transition-opacity" style={{ color: "#6366f1", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>ALLOY</a>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 border-b flex items-center justify-between px-6 shrink-0 z-10" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(8,12,20,0.8)", backdropFilter: "blur(8px)" }}>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#ef4444" }} />
            <span style={{ color: "#ef4444" }}>2 Critical</span>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
            <span style={{ color: "#f97316" }}>3 High</span>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
            <span style={{ color: "#f59e0b" }}>$4.02M value at risk</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            </button>
            <div className="h-5 w-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-xs font-medium text-white">Exec User</div>
                <div className="text-[10px]" style={{ color: "rgba(14,165,233,0.7)" }}>SZL Holdings</div>
              </div>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border" style={{ background: "linear-gradient(135deg, #0ea5e9, #3b82f6)", borderColor: "rgba(255,255,255,0.1)" }}>EU</div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6" style={{ background: "#080c14" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
