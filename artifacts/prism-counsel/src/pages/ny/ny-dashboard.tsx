import { AlertTriangle, Clock, Activity, Building2, ShieldOff, Shield, FileText, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

function useNyDashboardSummary() {
  return useQuery({
    queryKey: ["ny-dashboard-summary"],
    queryFn: async () => {
      const res = await fetch("/api/prism-counsel/ny/dashboard");
      if (!res.ok) throw new Error("Failed to load NY dashboard summary");
      const json = await res.json();
      return json.data as { activeMatters: number; criticalClocks: number; breachedClocks: number; pendingAppeals: number };
    },
    staleTime: 60_000,
  });
}

function Widget({ title, children, href }: { title: string; children: React.ReactNode; href?: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-300">{title}</h3>
        {href && (
          <Link href={href}>
            <span className="text-[10px] text-slate-500 hover:text-[#d4a054] cursor-pointer flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </span>
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyWidgetState({ message = "No data" }: { message?: string }) {
  return (
    <div className="py-6 text-center">
      <p className="text-[10px] text-slate-600">{message}</p>
    </div>
  );
}

export default function NyDashboard() {
  const { data: summary, isLoading: summaryLoading } = useNyDashboardSummary();

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">NY Insurance Command Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">New York signal intelligence · {summaryLoading ? "—" : `${summary?.activeMatters ?? 0} active matters`}</p>
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Breached Clocks", value: summaryLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-500" /> : <span>{summary?.breachedClocks ?? 0}</span>, sub: "NY statutory clocks", color: (summary?.breachedClocks ?? 0) > 0 ? "#c45a4a" : "#4a90b8", icon: ShieldOff },
          { label: "Critical Clocks", value: summaryLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-500" /> : <span>{summary?.criticalClocks ?? 0}</span>, sub: "Clocks ≤ 7 days", color: (summary?.criticalClocks ?? 0) > 0 ? "#c45a4a" : "#4a90b8", icon: AlertTriangle },
          { label: "Active Matters", value: summaryLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-500" /> : <span>{summary?.activeMatters ?? 0}</span>, sub: "NY matters (live)", color: "#4a90b8", icon: Shield },
          { label: "Pending Appeals", value: summaryLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-500" /> : <span>{summary?.pendingAppeals ?? 0}</span>, sub: "No-fault appeals", color: "#d4a054", icon: FileText },
          { label: "Scheduled Mediations", value: <span>—</span>, sub: "Connect mediation data", color: "#8b9ab0", icon: Activity },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">{kpi.label}</span>
              </div>
              <div className="text-2xl font-semibold" style={{ color: kpi.color }}>{kpi.value}</div>
              <div className="text-[10px] text-slate-600 mt-0.5">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Widget title="Deadline Breach Watchlist" href="/prism-counsel/ny/watchlist">
          <EmptyWidgetState message="Connect NY statutory clock data to populate" />
        </Widget>

        <Widget title="Demand Readiness Leaderboard" href="/prism-counsel/ny/no-fault">
          <EmptyWidgetState message="Connect demand packet data to populate" />
        </Widget>

        <Widget title="Mediation Windows" href="/prism-counsel/ny/mediation">
          <EmptyWidgetState message="Connect mediation data to populate" />
        </Widget>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Widget title="Reserve / Offer Tracker" href="/prism-counsel/ny/forecast">
          <EmptyWidgetState message="Connect offer movement data to populate" />
        </Widget>

        <Widget title="Communication Silence Tracker" href="/prism-counsel/ny/insurer-intel">
          <EmptyWidgetState message="Connect insurer communication data to populate" />
        </Widget>

        <Widget title="Chronology Integrity / AI Defensibility" href="/prism-counsel/ny/trust">
          <EmptyWidgetState message="Connect chronology data to populate" />
        </Widget>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Widget title="Disclaimer Vulnerability Queue" href="/prism-counsel/ny/coverage">
          <EmptyWidgetState message="No active disclaimer challenges" />
        </Widget>

        <Widget title="Damages / Lien Gaps" href="/prism-counsel/ny/no-fault">
          <EmptyWidgetState message="Connect demand packet data to populate" />
        </Widget>

        <Widget title="Approval Queue — NY Matters">
          <EmptyWidgetState message="No pending approvals" />
        </Widget>
      </div>
    </div>
  );
}
