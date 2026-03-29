import { useState, useEffect, useRef, useMemo, type ComponentType } from "react";
import { Activity, AlertTriangle, Lightbulb, ShieldAlert, ArrowUpRight, TrendingUp, Wifi } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useSignals, useIncidents, useRecommendations, usePlaybooks } from "@/hooks/use-lyte";

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
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration]);

  return count;
}

const chartData = [
  { name: "Mon", signals: 1847, incidents: 3 },
  { name: "Tue", signals: 2104, incidents: 5 },
  { name: "Wed", signals: 1923, incidents: 2 },
  { name: "Thu", signals: 2891, incidents: 8 },
  { name: "Fri", signals: 3247, incidents: 12 },
  { name: "Sat", signals: 1456, incidents: 4 },
  { name: "Sun", signals: 1102, incidents: 2 },
];

export default function Dashboard() {
  const { data: signals = [], isLoading: sLoading } = useSignals();
  const { data: incidents = [], isLoading: iLoading } = useIncidents();
  const { data: recommendations = [], isLoading: rLoading } = useRecommendations();
  const { data: playbooks = [] } = usePlaybooks();

  const data = useMemo(() => {
    const openIncidents = incidents.filter(i => !["resolved", "closed"].includes(i.status));
    const criticalSignals = signals.filter(s => s.severity === "critical" && s.status === "new");
    const pendingRecs = recommendations.filter(r => r.status === "suggested");

    return {
      totalSignals: signals.length,
      criticalSignalCount: criticalSignals.length,
      openIncidentCount: openIncidents.length,
      pendingRecommendationCount: pendingRecs.length,
      recentIncidents: [...incidents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
      playbookCount: playbooks.length,
      chartData,
    };
  }, [signals, incidents, recommendations, playbooks]);

  const isLoading = sLoading || iLoading || rLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-b-blue-500/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <span className="text-sm text-slate-500 animate-pulse">Initializing telemetry...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end mb-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-3xl font-display font-bold text-white mb-2">Operations Command</h2>
          <p className="text-slate-400 text-lg">Real-time infrastructure telemetry across 4 regions, 47 services, 12 Kubernetes clusters.</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3"
        >
          <SystemHealthPill label="Uptime" value="99.97%" icon={Wifi} />
          <div className="flex items-center gap-2 text-sm text-cyan-400 bg-cyan-400/10 px-4 py-2 rounded-full border border-cyan-400/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            Live Sync Active
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Active Signal Sources" value={data.totalSignals} icon={Activity} trend="+18%" color="cyan" delay={0} />
        <MetricCard title="Critical Alerts" value={data.criticalSignalCount} icon={ShieldAlert} trend="+3" color="red" delay={0.1} pulse />
        <MetricCard title="Active Incidents" value={data.openIncidentCount} icon={AlertTriangle} trend="+4" color="orange" delay={0.2} />
        <MetricCard title="Open Recommendations" value={data.pendingRecommendationCount} icon={Lightbulb} trend="+2" color="blue" delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-glass rounded-2xl p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-32 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 p-24 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div>
              <h3 className="text-xl font-display font-semibold text-white">Signal Volume</h3>
              <p className="text-sm text-slate-400">Aggregated signal volume and incident count over the last 7 days</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-3 h-0.5 bg-cyan-500 rounded-full" />
              <span>Signals</span>
              <span className="w-3 h-0.5 bg-orange-500 rounded-full ml-3" />
              <span>Incidents</span>
            </div>
          </div>
          <div className="h-72 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSignals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#06b6d4' }}
                />
                <Area type="monotone" dataKey="incidents" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorIncidents)" />
                <Area type="monotone" dataKey="signals" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorSignals)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-glass rounded-2xl p-6 flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-display font-semibold text-white">Attention Required</h3>
            <Link href="/incidents" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="space-y-3 flex-1">
            {data.recentIncidents.slice(0,4).map((incident, i) => (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group cursor-pointer relative overflow-hidden"
              >
                {incident.severity === 'critical' && (
                  <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
                )}
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-2.5 h-2.5 rounded-full",
                      incident.severity === 'critical' ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse' : 
                      incident.severity === 'high' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'bg-yellow-500'
                    )} />
                    <span className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors line-clamp-1">{incident.title}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 relative z-10">
                  <span className="capitalize">{incident.status}</span>
                  <span>{incident.assignee}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { label: "MTTR (SEV-1)", value: "23m", sub: "↓ 18% vs. 30-day avg (28m)" },
          { label: "Signal Throughput", value: "2.4k/hr", sub: "Peak: 4.1k/hr (14:00 UTC)" },
          { label: "Error Budget", value: "38%", sub: "8 days remaining in window" },
          { label: "Active Runbooks", value: String(data.playbookCount || 8), sub: "3 triggered in last 24h" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + i * 0.05 }}
            className="bg-white/[0.03] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all"
          >
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">{stat.label}</div>
            <div className="text-2xl font-display font-bold text-white">{stat.value}</div>
            <div className="text-xs text-slate-500 mt-1">{stat.sub}</div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function SystemHealthPill({ label, value, icon: Icon }: { label: string; value: string; icon: ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-400/10 px-3 py-2 rounded-full border border-emerald-400/20">
      <Icon className="w-3.5 h-3.5" />
      <span className="text-slate-400">{label}</span>
      <span className="font-mono font-bold">{value}</span>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, trend, color, delay = 0, pulse = false }: { title: string; value: number; icon: ComponentType<{ className?: string }>; trend: string; color: string; delay?: number; pulse?: boolean }) {
  const animatedValue = useAnimatedCounter(value);

  const colors: Record<string, string> = {
    cyan: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
    red: "text-red-400 bg-red-400/10 border-red-400/20",
    orange: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  };

  const glowColors: Record<string, string> = {
    cyan: "shadow-[0_0_30px_rgba(6,182,212,0.15)]",
    red: "shadow-[0_0_30px_rgba(239,68,68,0.15)]",
    orange: "shadow-[0_0_30px_rgba(249,115,22,0.15)]",
    blue: "shadow-[0_0_30px_rgba(59,130,246,0.15)]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        "bg-glass rounded-2xl p-6 flex flex-col justify-between group hover:border-white/10 transition-all relative overflow-hidden",
        glowColors[color]
      )}
    >
      {pulse && (
        <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
      )}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={cn("p-3 rounded-xl border", colors[color])}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
          <TrendingUp className="w-3 h-3" /> {trend}
        </div>
      </div>
      <div className="relative z-10">
        <h4 className="text-slate-400 text-sm font-medium mb-1">{title}</h4>
        <div className="text-3xl font-display font-bold text-white tracking-tight">{animatedValue}</div>
      </div>
    </motion.div>
  );
}
