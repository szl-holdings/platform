import { useState, useEffect, useRef, useMemo } from "react";
import { Activity, AlertTriangle, Lightbulb, ShieldAlert, ArrowUpRight, TrendingUp, Wifi, Server, Cpu, HardDrive, Network, Clock, Zap, BarChart3 } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useSignals, useIncidents, useRecommendations, usePlaybooks } from "@/hooks/use-lyte";
import { incidents as fallbackIncidents } from "@/lib/mock-data";
import { LiveDataBadge } from "@/lib/live-badge";
import { api } from "@/lib/api";

function useAnimatedCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration]);
  return count;
}

const signalVolumeData = [
  { time: "00:00", signals: 1847, errors: 23 },
  { time: "04:00", signals: 1204, errors: 12 },
  { time: "08:00", signals: 2891, errors: 45 },
  { time: "12:00", signals: 3247, errors: 38 },
  { time: "16:00", signals: 2923, errors: 29 },
  { time: "20:00", signals: 2456, errors: 31 },
  { time: "Now", signals: 2104, errors: 18 },
];

const infraMetrics = [
  { name: "us-east-1", cpu: 67, memory: 74, pods: 142, healthy: 139 },
  { name: "us-west-2", cpu: 52, memory: 61, pods: 98, healthy: 97 },
  { name: "eu-west-1", cpu: 78, memory: 82, pods: 115, healthy: 112 },
  { name: "ap-southeast-1", cpu: 44, memory: 55, pods: 67, healthy: 67 },
];

const severityConfig: Record<string, { dot: string; border: string; bg: string }> = {
  critical: {
    dot: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse",
    border: "border-red-500/20",
    bg: "bg-red-500/5",
  },
  high: {
    dot: "bg-orange-500",
    border: "border-orange-500/10",
    bg: "",
  },
  medium: {
    dot: "bg-amber-500",
    border: "border-amber-500/10",
    bg: "",
  },
  low: {
    dot: "bg-blue-500",
    border: "border-blue-500/10",
    bg: "",
  },
};

export default function Dashboard() {
  const { data: signals = [] } = useSignals();
  const { data: incidents = [] } = useIncidents();
  const { data: recommendations = [] } = useRecommendations();
  const { data: playbooks = [] } = usePlaybooks();
  const { data: blsData, isLoading: blsLoading } = useQuery({
    queryKey: ["lyte-bls-employment"],
    queryFn: () => api.live.blsEmployment(),
    staleTime: 86400000,
    refetchInterval: 86400000,
  });

  const data = useMemo(() => {
    const effectiveIncidents = incidents.length > 0 ? incidents : fallbackIncidents;
    const openIncidents = effectiveIncidents.filter(i => !["resolved", "closed"].includes(i.status));
    const criticalSignals = signals.filter(s => s.severity === "critical" && s.status === "new");
    const pendingRecs = recommendations.filter(r => r.status === "suggested");
    return {
      totalSignals: signals.length || 847,
      criticalSignalCount: criticalSignals.length || 12,
      openIncidentCount: openIncidents.length || 7,
      pendingRecommendationCount: pendingRecs.length || 15,
      recentIncidents: [...effectiveIncidents]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 8),
      playbookCount: playbooks.length || 8,
    };
  }, [signals, incidents, recommendations, playbooks]);

  const critCount = useAnimatedCounter(data.criticalSignalCount);
  const incCount = useAnimatedCounter(data.openIncidentCount);
  const recCount = useAnimatedCounter(data.pendingRecommendationCount);

  return (
    <div className="max-w-[1600px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-display font-bold text-white">Operations Command</h2>
          <p className="text-slate-400 text-xs mt-0.5">4 regions · 47 services · 12 Kubernetes clusters</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
            <Wifi className="w-3 h-3" />
            <span className="text-slate-400 text-[11px]">Uptime</span>
            <span className="font-mono font-bold">99.97%</span>
          </div>
          <LiveDataBadge isLive={blsData?.liveData} isLoading={blsLoading} />
        </div>
      </div>

      {/* Critical KPI row — 3 most important metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { title: "Critical Alerts", value: critCount, icon: ShieldAlert, color: "red", pulse: true, sub: `${data.openIncidentCount} open incidents` },
          { title: "Active Incidents", value: incCount, icon: AlertTriangle, color: "orange", pulse: false, sub: "pending resolution" },
          { title: "Recommendations", value: recCount, icon: Lightbulb, color: "blue", pulse: false, sub: "action required" },
        ].map((m) => {
          const colors: Record<string, { icon: string; border: string; bg: string }> = {
            cyan: { icon: "text-cyan-400", border: "border-cyan-400/10", bg: "bg-cyan-400/10" },
            red: { icon: "text-red-400", border: "border-red-400/20", bg: "bg-red-400/10" },
            orange: { icon: "text-orange-400", border: "border-orange-400/10", bg: "bg-orange-400/10" },
            blue: { icon: "text-blue-400", border: "border-blue-400/10", bg: "bg-blue-400/10" },
          };
          const c = colors[m.color];
          return (
            <div key={m.title} className={cn("bg-white/[0.03] rounded-xl p-4 border relative overflow-hidden hover:bg-white/[0.05] transition-all", c.border)}>
              {m.pulse && <div className="absolute inset-0 bg-red-500/3 animate-pulse pointer-events-none" />}
              <div className="flex justify-between items-start mb-2 relative z-10">
                <div className={cn("p-2 rounded-lg border", c.bg, c.border)}>
                  <m.icon className={cn("w-4 h-4", c.icon)} />
                </div>
              </div>
              <div className="relative z-10">
                <div className="text-3xl font-display font-bold text-white">{m.value}</div>
                <h4 className="text-slate-400 text-[11px] font-medium mt-0.5">{m.title}</h4>
                <p className="text-[10px] text-slate-600 mt-0.5 font-mono">{m.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hero section: Incident Timeline (right, larger) + Signal Volume (left) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Signal Volume Chart — 2/5 */}
        <div className="lg:col-span-2 bg-white/[0.03] rounded-xl p-4 border border-white/5">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-sm font-display font-semibold text-white">Signal Volume</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">24-hour aggregated telemetry</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-cyan-500 rounded-full" />Signals</span>
              <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-red-500 rounded-full" />Errors</span>
            </div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={signalVolumeData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="sigGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                <Area type="monotone" dataKey="signals" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#sigGrad)" />
                <Area type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={1.5} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incident Timeline Hero — 3/5 */}
        <div className="lg:col-span-3 bg-white/[0.03] rounded-xl p-4 border border-white/5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-display font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-red-400 animate-pulse" />
                Incident Timeline
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Active & recent incidents requiring attention</p>
            </div>
            <Link href="/incidents" className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {data.recentIncidents.length > 0 ? data.recentIncidents.map((incident) => {
              const sev = severityConfig[incident.severity] || severityConfig.medium;
              return (
                <div key={incident.id} className={cn(
                  "p-3 rounded-lg border flex items-start gap-3 hover:bg-white/[0.04] transition-all relative overflow-hidden",
                  sev.border, sev.bg
                )}>
                  <span className={cn("w-2 h-2 rounded-full mt-1 shrink-0", sev.dot)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white leading-tight truncate">{incident.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                      <span className="capitalize font-mono">{incident.status}</span>
                      <span className={cn("uppercase font-mono font-medium",
                        incident.severity === "critical" ? "text-red-400" :
                        incident.severity === "high" ? "text-orange-400" :
                        incident.severity === "medium" ? "text-amber-400" : "text-blue-400"
                      )}>{incident.severity}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(incident.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            }) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-xs text-slate-500">No active incidents</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Regional Infrastructure */}
      <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
        <h3 className="text-sm font-display font-semibold text-white mb-4 flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" />
          Regional Infrastructure
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {infraMetrics.map(region => (
            <div key={region.name} className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-mono text-cyan-400">{region.name}</span>
                <span className="text-[10px] text-slate-500">{region.healthy}/{region.pods} pods</span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-slate-500 flex items-center gap-1"><Cpu className="w-2.5 h-2.5" />CPU</span>
                    <span className={cn("font-mono", region.cpu > 80 ? "text-red-400" : region.cpu > 60 ? "text-amber-400" : "text-emerald-400")}>{region.cpu}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", region.cpu > 80 ? "bg-red-400" : region.cpu > 60 ? "bg-amber-400" : "bg-emerald-400")} style={{ width: `${region.cpu}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-slate-500 flex items-center gap-1"><HardDrive className="w-2.5 h-2.5" />Memory</span>
                    <span className={cn("font-mono", region.memory > 80 ? "text-red-400" : region.memory > 60 ? "text-amber-400" : "text-emerald-400")}>{region.memory}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", region.memory > 80 ? "bg-red-400" : region.memory > 60 ? "bg-amber-400" : "bg-emerald-400")} style={{ width: `${region.memory}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom metrics row — 3 key stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "MTTR (SEV-1)", value: "23m", sub: "18% faster vs 30-day avg", color: "text-emerald-400", icon: Zap },
          { label: "Error Budget", value: "38%", sub: "8 days remaining in window", color: "text-amber-400", icon: BarChart3 },
          {
            label: blsData?.liveData ? `Unemployment Rate (${blsData?.data?.period ?? "BLS"})` : "Active Runbooks",
            value: blsData?.liveData ? `${blsData.data?.data?.unemploymentRate ?? "—"}%` : String(data.playbookCount || 8),
            sub: blsData?.liveData
              ? `${blsData.data?.data?.trend === "improving" ? "▼ improving" : "▲ worsening"} vs prior period · BLS Live`
              : "3 triggered in last 24h",
            color: "text-cyan-400",
            icon: Network,
          },
        ].map(stat => (
          <div key={stat.label} className="bg-white/[0.03] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-0.5">{stat.label}</div>
              <div className={cn("text-2xl font-display font-bold", stat.color)}>{stat.value}</div>
              <div className="text-[10px] text-slate-600 mt-0.5">{stat.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
