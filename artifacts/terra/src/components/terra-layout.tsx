import { Link, useLocation } from "wouter";
import { cn } from "@workspace/shared-ui/utils";
import { ReactNode, useState } from "react";
import {
  Building2, LayoutDashboard, Activity, Flame, Home,
  UserCheck, Users, Brain, Zap, FileText, ClipboardList,
  ArrowLeftRight, Bell, Menu, X, Inbox, MapPin, BarChart3, Upload
} from "lucide-react";

const NAV = [
  { href: "/", label: "Command Center", icon: LayoutDashboard },
  { href: "/broker-overview", label: "Broker Overview", icon: BarChart3, highlight: false },
  { href: "/distress-engine", label: "Distress Engine", icon: Flame, highlight: true },
  { href: "/deals", label: "Deal Pipeline", icon: Activity },
  { href: "/listings", label: "Listings", icon: Home },
  { href: "/inquiries", label: "Inquiry Routing", icon: Inbox },
  { href: "/agents", label: "Agents + Brokerage", icon: Users },
  { href: "/leads", label: "Leads + CRM", icon: UserCheck },
  { href: "/ingestion", label: "Ingestion", icon: Upload },
  { href: "/offers", label: "Offers", icon: ArrowLeftRight },
  { href: "/transactions", label: "Transactions", icon: ClipboardList },
  { href: "/documents", label: "Docs + Compliance", icon: FileText },
  { href: "/team", label: "Team Performance", icon: Users },
  { href: "/predictions", label: "Alloy Intelligence", icon: Brain },
  { href: "/automations", label: "Alloy Workflows", icon: Zap },
  { href: "/case-study", label: "Case Study", icon: FileText },
];

export function TerraLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={cn(
        "border-r flex flex-col shrink-0 z-20 transition-transform duration-200",
        "fixed md:relative inset-y-0 left-0 w-56",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )} style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(10,12,18,0.97)" }}>
        <div className="h-14 flex items-center px-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg shadow-lg" style={{ background: "linear-gradient(135deg, #a07848, #c8a060)", boxShadow: "0 0 12px rgba(160,120,72,0.3)" }}>
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-wide text-white leading-none">TERRA</span>
              <span className="text-[9px] uppercase tracking-widest leading-none mt-0.5" style={{ color: "#a07848" }}>Real Estate Broker Platform</span>
            </div>
          </div>
        </div>

        <nav className="px-2 py-3 flex-1 flex flex-col gap-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
            const isDistress = item.highlight;
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group relative",
                isActive
                  ? isDistress
                    ? "text-orange-400"
                    : "text-[#c8a060]"
                  : isDistress
                  ? "text-orange-400/70 hover:text-orange-400 hover:bg-red-500/5"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )} style={{ background: isActive ? (isDistress ? "rgba(249,115,22,0.08)" : "rgba(160,120,72,0.08)") : undefined }}>
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full" style={{ background: isDistress ? "#f97316" : "#c8a060" }} />}
                <item.icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? (isDistress ? "text-orange-400" : "text-[#c8a060]") : "text-slate-500 group-hover:text-slate-300")} />
                <span>{item.label}</span>
                {isDistress && !isActive && (
                  <span className="ml-auto text-[8px] px-1 py-0.5 rounded font-bold uppercase" style={{ color: "#f97316", background: "rgba(249,115,22,0.12)" }}>NEW</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            <Building2 className="w-3 h-3" />
            <span>SZL Holdings Platform</span>
          </div>
          <div className="flex gap-1 mt-2 flex-wrap">
            <a href="/lyte-command-center/" className="text-[9px] px-1.5 py-0.5 rounded font-medium hover:opacity-80 transition-opacity" style={{ color: "#06b6d4", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)" }}>LYTE</a>
            <a href="/alloy/" className="text-[9px] px-1.5 py-0.5 rounded font-medium hover:opacity-80 transition-opacity" style={{ color: "#6e9ef5", background: "rgba(110,158,245,0.1)", border: "1px solid rgba(110,158,245,0.2)" }}>ALLOY</a>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 border-b flex items-center justify-between px-4 md:px-6 shrink-0 z-10" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(10,12,18,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="flex items-center gap-3 text-xs font-mono">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-1.5 rounded-lg hover:bg-white/5 transition-colors mr-2"
              style={{ color: "rgba(255,255,255,0.5)" }}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse hidden sm:block" style={{ background: "#f97316" }} />
            <span className="hidden sm:block" style={{ color: "#a07848" }}>Terra · Broker Platform</span>
            <span className="hidden sm:block" style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
            <span className="hidden sm:block" style={{ color: "rgba(255,255,255,0.4)" }}>SZL Holdings</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6" style={{ background: "#0a0e16" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
