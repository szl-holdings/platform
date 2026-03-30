import { useState, useEffect, useRef, useMemo } from "react";
import { Activity, AlertTriangle, Lightbulb, ShieldAlert, ArrowUpRight, TrendingUp, Wifi, Server, Cpu, HardDrive, Network, Clock, Zap, BarChart3, GitCommit, Link as LinkIcon, Map, BookOpen, Target } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";
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
  critical: { dot: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse", border: "border-red-500/20", bg: "bg-red-500/5" },
  high: { dot: "bg-orange-500", border: "border-orange-500/10", bg: "" },
  medium: { dot: "bg-amber-500", border: "border-amber-500/10", bg: "" },
  low: { dot: "bg-blue-500", border: "border-blue-500/10", bg: "" },
};

const serviceMapNodes = [
  { id: "api-gateway", label: "API Gateway", health: "healthy", x: 50, y: 10, deps: ["auth-svc", "order-svc"] },
  { id: "auth-svc", label: "Auth Service", health: "healthy", x: 20, y: 40, deps: ["user-db"] },
  { id: "order-svc", label: "Order Service", health: "degraded", x: 80, y: 40, deps: ["payment-svc", "inventory-db"] },
  { id: "payment-svc", label: "Payment Service", health: "healthy", x: 65, y: 70, deps: [] },
  { id: "user-db", label: "User DB", health: "healthy", x: 10, y: 70, deps: [] },
  { id: "inventory-db", label: "Inventory DB", health: "critical", x: 90, y: 70, deps: [] },
];

const sloData = [
  { name: "API Availability", current: 99.94, target: 99.9, budget: 38, budgetUsed: 62 },
  { name: "Latency P99", current: 98.7, target: 99.5, budget: 18, budgetUsed: 82 },
  { name: "Error Rate", current: 99.98, target: 99.95, budget: 71, budgetUsed: 29 },
  { name: "Throughput SLO", current: 99.2, target: 99.0, budget: 85, budgetUsed: 15 },
];

const recentChanges = [
  { id: "DEP-4821", type: "deploy", service: "order-svc", desc: "v2.14.0 — fee calculation update", time: "14m ago", correlated: true },
  { id: "CFG-2201", type: "config", service: "api-gateway", desc: "Rate limit threshold changed 1k→2k rps", time: "1h ago", correlated: false },
  { id: "DEP-4820", type: "deploy", service: "payment-svc", desc: "v3.2.1 — Stripe API migration", time: "3h ago", correlated: false },
];

const correlatedIncidentId = "INC-8847";

function ServiceMap() {
  const healthColor = (h: string) => h === "healthy" ? "#22c55e" : h === "degraded" ? "#f59e0b" : "#ef4444";
  return (
    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-display font-semibold text-white flex items-center gap-2">
          <Map className="w-4 h-4 text-cyan-400" />
          Unified Service Map
        </h3>
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Healthy</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Degraded</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Critical</span>
        </div>
      </div>
      <div className="relative h-52 bg-white/[0.02] rounded-lg border border-white/5 overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 100 90" preserveAspectRatio="none">
          {serviceMapNodes.flatMap(node =>
            node.deps.map(dep => {
              const target = serviceMapNodes.find(n => n.id === dep);
              if (!target) return null;
              return (
                <line key={`${node.id}-${dep}`}
                  x1={node.x} y1={node.y + 3} x2={target.x} y2={target.y + 3}
                  stroke="rgba(6,182,212,0.2)" strokeWidth="0.5" />
              );
            })
          )}
          {serviceMapNodes.map(node => {
            const color = healthColor(node.health);
            return (
              <g key={node.id}>
                <circle cx={node.x} cy={node.y + 3} r={node.health === "critical" ? "5" : "4"} fill={color} opacity="0.2">
                  {node.health === "critical" && <animate attributeName="r" from="4" to="8" dur="1.5s" repeatCount="indefinite" />}
                  {node.health === "critical" && <animate attributeName="opacity" from="0.2" to="0" dur="1.5s" repeatCount="indefinite" />}
                </circle>
                <circle cx={node.x} cy={node.y + 3} r="3" fill={color} opacity="0.9" />
                <text x={node.x} y={node.y - 2} textAnchor="middle" fontSize="3.5" fill="rgba(255,255,255,0.6)" fontFamily="monospace">{node.label}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="text-[10px] text-slate-500 mt-2">Live health propagation across 47 services · Mock Data</p>
    </div>
  );
}

function SLOBurnRate() {
  return (
    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-display font-semibold text-white flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-400" />
          SLO Error Budget Tracking
        </h3>
        <span className="text-[10px] text-slate-500">30-day window</span>
      </div>
      <div className="space-y-3">
        {sloData.map((slo) => (
          <div key={slo.name}>
            <div className="flex items-center justify-between mb-1 text-[11px]">
              <span className="text-slate-300 font-medium">{slo.name}</span>
              <div className="flex items-center gap-3">
                <span className={cn("font-mono font-bold", slo.current >= slo.target ? "text-emerald-400" : "text-red-400")}>{slo.current.toFixed(2)}%</span>
                <span className="text-slate-500">target {slo.target}%</span>
              </div>
            </div>
            <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
              <div className={cn("absolute inset-y-0 left-0 rounded-full transition-all", slo.budgetUsed > 80 ? "bg-red-400" : slo.budgetUsed > 60 ? "bg-amber-400" : "bg-emerald-400")} style={{ width: `${slo.budgetUsed}%` }} />
            </div>
            <div className="flex items-center justify-between mt-0.5 text-[10px] text-slate-600">
              <span>Budget used: {slo.budgetUsed}%</span>
              <span className={slo.budget < 30 ? "text-red-400" : "text-slate-500"}>{slo.budget}% remaining</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChangeIntelligence() {
  return (
    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-display font-semibold text-white flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-violet-400" />
          Change Intelligence
        </h3>
        <span className="text-[10px] text-red-400 font-mono">1 correlated incident</span>
      </div>
      <div className="space-y-2">
        {recentChanges.map(c => (
          <div key={c.id} className={cn("p-3 rounded-lg border", c.correlated ? "border-orange-500/30 bg-orange-500/5" : "border-white/5 bg-white/[0.02]")}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded border", c.type === "deploy" ? "text-blue-400 bg-blue-400/10 border-blue-400/20" : "text-violet-400 bg-violet-400/10 border-violet-400/20")}>{c.type}</span>
                <span className="text-[10px] font-mono text-cyan-400">{c.service}</span>
              </div>
              <div className="flex items-center gap-2">
                {c.correlated && <span className="text-[9px] text-orange-400 font-mono">→ {correlatedIncidentId}</span>}
                <span className="text-[10px] text-slate-500">{c.time}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-300">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RunbookAutomation() {
  const runbooks = [
    { name: "High Memory Alert", trigger: "Memory > 85%", lastRun: "12m ago", status: "auto-resolved", runs: 14 },
    { name: "Pod Restart Loop", trigger: "Restart > 3x/5min", lastRun: "1h ago", status: "escalated", runs: 3 },
    { name: "DB Connection Pool", trigger: "Conn pool > 90%", lastRun: "3h ago", status: "auto-resolved", runs: 7 },
  ];
  return (
    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
      <h3 className="text-sm font-display font-semibold text-white flex items-center gap-2 mb-3">
        <BookOpen className="w-4 h-4 text-emerald-400" />
        Runbook Automation
      </h3>
      <div className="space-y-2">
        {runbooks.map(r => (
          <div key={r.name} className="p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-semibold text-white">{r.name}</p>
              <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-mono", r.status === "auto-resolved" ? "text-emerald-400 bg-emerald-400/10" : "text-orange-400 bg-orange-400/10")}>
                {r.status}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>Trigger: {r.trigger}</span>
              <span>{r.runs} runs · last {r.lastRun}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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

      {/* Service Map */}
      <ServiceMap />

      {/* SLO Burn Rate + Change Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SLOBurnRate />
        <ChangeIntelligence />
      </div>

      {/* Runbook Automation */}
      <RunbookAutomation />

      {/* Signal Volume + Incident Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
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

        <div className="lg:col-span-3 bg-white/[0.03] rounded-xl p-4 border border-white/5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-display font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-red-400 animate-pulse" />
                Incident Timeline
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Active & recent incidents</p>
            </div>
            <Link href="/incidents" className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {data.recentIncidents.length > 0 ? data.recentIncidents.map((incident) => {
              const sev = severityConfig[incident.severity] || severityConfig.medium;
              return (
                <div key={incident.id} className={cn("p-3 rounded-lg border flex items-start gap-3 hover:bg-white/[0.04] transition-all relative overflow-hidden", sev.border, sev.bg)}>
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
