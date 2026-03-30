import { useState, useEffect, useRef, useMemo, type ComponentType } from "react";
import { Activity, AlertTriangle, Lightbulb, ShieldAlert, ArrowUpRight, TrendingUp, Wifi, Server, Cpu, HardDrive, Network, Clock, Zap, BarChart3, Radio } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, Cell, LineChart, Line } from "recharts";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useSignals, useIncidents, useRecommendations, usePlaybooks } from "@/hooks/use-lyte";
import { incidents as fallbackIncidents } from "@/lib/mock-data";

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
  { time: "00:00", signals: 1847, errors: 23, latency: 142 },
  { time: "04:00", signals: 1204, errors: 12, latency: 128 },
  { time: "08:00", signals: 2891, errors: 45, latency: 167 },
  { time: "12:00", signals: 3247, errors: 38, latency: 189 },
  { time: "16:00", signals: 2923, errors: 29, latency: 155 },
  { time: "20:00", signals: 2456, errors: 31, latency: 148 },
  { time: "Now", signals: 2104, errors: 18, latency: 134 },
];

const infraMetrics = [
  { name: "us-east-1", cpu: 67, memory: 74, pods: 142, healthy: 139 },
  { name: "us-west-2", cpu: 52, memory: 61, pods: 98, healthy: 97 },
  { name: "eu-west-1", cpu: 78, memory: 82, pods: 115, healthy: 112 },
  { name: "ap-southeast-1", cpu: 44, memory: 55, pods: 67, healthy: 67 },
];

const topologyNodes = [
  { id: "lb", label: "Load Balancer", x: 50, y: 15, status: "healthy", type: "network" },
  { id: "api1", label: "API Gateway", x: 25, y: 35, status: "healthy", type: "service" },
  { id: "api2", label: "API Gateway 2", x: 75, y: 35, status: "healthy", type: "service" },
  { id: "auth", label: "Auth Service", x: 15, y: 55, status: "healthy", type: "service" },
  { id: "core", label: "Core Engine", x: 40, y: 55, status: "degraded", type: "service" },
  { id: "data", label: "Data Pipeline", x: 60, y: 55, status: "healthy", type: "service" },
  { id: "ml", label: "ML Service", x: 85, y: 55, status: "healthy", type: "service" },
  { id: "db1", label: "Primary DB", x: 30, y: 78, status: "healthy", type: "database" },
  { id: "db2", label: "Replica DB", x: 50, y: 78, status: "healthy", type: "database" },
  { id: "cache", label: "Redis Cache", x: 70, y: 78, status: "healthy", type: "cache" },
];

const topologyEdges = [
  ["lb", "api1"], ["lb", "api2"],
  ["api1", "auth"], ["api1", "core"], ["api2", "data"], ["api2", "ml"],
  ["core", "db1"], ["data", "db2"], ["core", "cache"], ["ml", "cache"],
];

function InfraTopology() {
  const statusColors: Record<string, string> = {
    healthy: "#22c55e",
    degraded: "#eab308",
    down: "#ef4444",
  };

  return (
    <div className="bg-glass rounded-2xl p-5 border border-white/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[60px] rounded-full pointer-events-none" />
      <h3 className="text-sm font-display font-semibold text-white mb-4 flex items-center gap-2">
        <Network className="w-4 h-4 text-cyan-400" />
        Infrastructure Topology
      </h3>
      <div className="relative h-64">
        <svg viewBox="0 0 100 95" className="w-full h-full">
          {topologyEdges.map(([from, to], i) => {
            const fromNode = topologyNodes.find(n => n.id === from)!;
            const toNode = topologyNodes.find(n => n.id === to)!;
            return (
              <line key={i} x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y}
                stroke="rgba(6,182,212,0.15)" strokeWidth="0.5" strokeDasharray="2 2" />
            );
          })}
          {topologyNodes.map(node => (
            <g key={node.id}>
              <circle cx={node.x} cy={node.y} r={3.5}
                fill={statusColors[node.status]}
                opacity={0.2} />
              <circle cx={node.x} cy={node.y} r={2}
                fill={statusColors[node.status]} />
              {node.status === "degraded" && (
                <circle cx={node.x} cy={node.y} r={4} fill="none"
                  stroke={statusColors[node.status]} strokeWidth="0.5" opacity="0.5">
                  <animate attributeName="r" from="3" to="6" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
              <text x={node.x} y={node.y + 5.5} textAnchor="middle"
                fill="rgba(148,163,184,0.7)" fontSize="2.5" fontFamily="monospace">
                {node.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="flex items-center gap-4 mt-2">
        {[
          { label: "Healthy", color: "#22c55e", count: topologyNodes.filter(n => n.status === "healthy").length },
          { label: "Degraded", color: "#eab308", count: topologyNodes.filter(n => n.status === "degraded").length },
        ].map(s => (
          <span key={s.label} className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label} ({s.count})
          </span>
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
      recentIncidents: [...effectiveIncidents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
      playbookCount: playbooks.length || 8,
    };
  }, [signals, incidents, recommendations, playbooks]);

  const signalCount = useAnimatedCounter(data.totalSignals);
  const critCount = useAnimatedCounter(data.criticalSignalCount);
  const incCount = useAnimatedCounter(data.openIncidentCount);
  const recCount = useAnimatedCounter(data.pendingRecommendationCount);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-display font-bold text-white mb-1">Operations Command</h2>
          <p className="text-slate-400 text-sm">Real-time infrastructure telemetry across 4 regions, 47 services, 12 Kubernetes clusters.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
            <Wifi className="w-3.5 h-3.5" />
            <span className="text-slate-400">Uptime</span>
            <span className="font-mono font-bold">99.97%</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 bg-cyan-400/10 px-3 py-1.5 rounded-full border border-cyan-400/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            Live
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Signal Sources", value: signalCount, icon: Activity, trend: "+18%", color: "cyan", pulse: false },
          { title: "Critical Alerts", value: critCount, icon: ShieldAlert, trend: "+3", color: "red", pulse: true },
          { title: "Active Incidents", value: incCount, icon: AlertTriangle, trend: "+4", color: "orange", pulse: false },
          { title: "Recommendations", value: recCount, icon: Lightbulb, trend: "+2", color: "blue", pulse: false },
        ].map((m, i) => {
          const colors: Record<string, string> = {
            cyan: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
            red: "text-red-400 bg-red-400/10 border-red-400/20",
            orange: "text-orange-400 bg-orange-400/10 border-orange-400/20",
            blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
          };
          return (
            <div key={m.title} className="bg-glass rounded-2xl p-5 relative overflow-hidden group hover:border-white/10 transition-all">
              {m.pulse && <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />}
              <div className="flex justify-between items-start mb-3 relative z-10">
                <div className={cn("p-2.5 rounded-xl border", colors[m.color])}>
                  <m.icon className="w-5 h-5" />
                </div>
                <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                  <TrendingUp className="w-2.5 h-2.5" />{m.trend}
                </span>
              </div>
              <div className="relative z-10">
                <h4 className="text-slate-400 text-xs font-medium mb-0.5">{m.title}</h4>
                <div className="text-3xl font-display font-bold text-white">{m.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-glass rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="flex justify-between items-center mb-4 relative z-10">
            <div>
              <h3 className="text-base font-display font-semibold text-white">Signal Volume & Latency</h3>
              <p className="text-xs text-slate-400">24-hour aggregated signal telemetry</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-cyan-500 rounded-full" />Signals</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 rounded-full" />Errors</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-500 rounded-full" />Latency</span>
            </div>
          </div>
          <div className="h-56 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={signalVolumeData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="sigGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                <Area type="monotone" dataKey="signals" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#sigGrad)" />
                <Area type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={1.5} fillOpacity={0} />
                <Line type="monotone" dataKey="latency" stroke="#eab308" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-glass rounded-2xl p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-display font-semibold text-white">Incident Timeline</h3>
            <Link href="/incidents" className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2 flex-1">
            {data.recentIncidents.length > 0 ? data.recentIncidents.slice(0, 5).map((incident, i) => (
              <div key={incident.id} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/8 transition-all relative overflow-hidden">
                {incident.severity === "critical" && (
                  <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
                )}
                <div className="flex items-start gap-2 relative z-10">
                  <span className={cn("w-2 h-2 rounded-full mt-1 shrink-0",
                    incident.severity === "critical" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" :
                    incident.severity === "high" ? "bg-orange-500" : "bg-yellow-500"
                  )} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white leading-tight truncate">{incident.title}</p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                      <span className="capitalize">{incident.status}</span>
                      <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{new Date(incident.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-slate-500">No active incidents</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-glass rounded-2xl p-5">
          <h3 className="text-sm font-display font-semibold text-white mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            Regional Infrastructure
          </h3>
          <div className="space-y-3">
            {infraMetrics.map(region => (
              <div key={region.name} className="p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-cyan-400">{region.name}</span>
                  <span className="text-[10px] text-slate-400">{region.healthy}/{region.pods} pods healthy</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-slate-400 flex items-center gap-1"><Cpu className="w-2.5 h-2.5" />CPU</span>
                      <span className={cn("font-mono", region.cpu > 80 ? "text-red-400" : region.cpu > 60 ? "text-amber-400" : "text-emerald-400")}>{region.cpu}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", region.cpu > 80 ? "bg-red-400" : region.cpu > 60 ? "bg-amber-400" : "bg-emerald-400")} style={{ width: `${region.cpu}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-slate-400 flex items-center gap-1"><HardDrive className="w-2.5 h-2.5" />Memory</span>
                      <span className={cn("font-mono", region.memory > 80 ? "text-red-400" : region.memory > 60 ? "text-amber-400" : "text-emerald-400")}>{region.memory}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", region.memory > 80 ? "bg-red-400" : region.memory > 60 ? "bg-amber-400" : "bg-emerald-400")} style={{ width: `${region.memory}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <InfraTopology />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "MTTR (SEV-1)", value: "23m", sub: "18% faster vs 30-day avg" },
          { label: "Signal Throughput", value: "2.4k/hr", sub: "Peak: 4.1k/hr at 14:00 UTC" },
          { label: "Error Budget", value: "38%", sub: "8 days remaining in window" },
          { label: "Active Runbooks", value: String(data.playbookCount || 8), sub: "3 triggered in last 24h" },
        ].map(stat => (
          <div key={stat.label} className="bg-white/[0.03] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all">
            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1.5">{stat.label}</div>
            <div className="text-2xl font-display font-bold text-white">{stat.value}</div>
            <div className="text-[10px] text-slate-500 mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
