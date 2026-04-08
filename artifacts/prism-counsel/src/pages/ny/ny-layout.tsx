import { Link, useLocation } from "wouter";
import {
  Scale, LayoutDashboard, AlertTriangle, Clock, FileText, ShieldOff,
  Activity, TrendingUp, Building2, MapPin, MessageSquare, Shield, ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

const NY_NAV = [
  { label: "Overview", href: "/ny", icon: Scale },
  { label: "Dashboard", href: "/ny/dashboard", icon: LayoutDashboard },
  { label: "Watchlist", href: "/ny/watchlist", icon: AlertTriangle },
  { label: "Deadlines", href: "/ny/deadlines", icon: Clock },
  { label: "No-Fault", href: "/ny/no-fault", icon: FileText },
  { label: "Coverage", href: "/ny/coverage", icon: ShieldOff },
  { label: "Mediation", href: "/ny/mediation", icon: Activity },
  { label: "Forecast", href: "/ny/forecast", icon: TrendingUp },
  { label: "Insurer Intel", href: "/ny/insurer-intel", icon: Building2 },
  { label: "Venue Intel", href: "/ny/venue-intel", icon: MapPin },
  { label: "Copilot", href: "/ny/copilot", icon: MessageSquare },
  { label: "Trust", href: "/ny/trust", icon: Shield },
];

export function NyLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen" style={{ background: "#080c14" }}>
      <aside className="w-[200px] flex flex-col border-r border-white/[0.06]" style={{ background: "#0a0f18" }}>
        <div className="px-3 py-3 border-b border-white/[0.06]">
          <Link href="/">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-400 cursor-pointer mb-2">
              <ChevronLeft className="w-3 h-3" /> PRISM Counsel
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-[#d4a054]/10">
              <Scale className="w-3 h-3 text-[#d4a054]" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-200 leading-none">NY INSURANCE</div>
              <div className="text-[9px] text-[#d4a054] leading-none mt-0.5">OBSERVABILITY LAYER</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {NY_NAV.map((item) => {
            const isActive = location === item.href || (item.href !== "/ny" && location.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 mx-1 rounded text-xs cursor-pointer transition-colors",
                    isActive
                      ? "bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                  )}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/[0.06] px-3 py-2">
          <div className="text-[9px] text-slate-600">NY Insurance Observability</div>
          <div className="text-[9px] text-slate-700">3 matters · 6 signals</div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
