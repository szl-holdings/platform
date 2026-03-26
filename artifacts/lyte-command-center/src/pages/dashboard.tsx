import { useState, useEffect } from "react";
import { Activity, AlertTriangle, Lightbulb, ShieldAlert, ArrowUpRight, TrendingUp } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import * as mockDb from "@/lib/mock-data";

function buildSummary() {
  const openIncidents = mockDb.incidents.filter((i) => !["resolved", "closed"].includes(i.status));
  const criticalSignals = mockDb.signals.filter((s) => s.severity === "critical" && s.status === "new");
  const pendingRecs = mockDb.recommendations.filter((r) => r.status === "suggested");

  return {
    totalSignals: mockDb.signals.length,
    criticalSignalCount: criticalSignals.length,
    openIncidentCount: openIncidents.length,
    pendingRecommendationCount: pendingRecs.length,
    recentSignals: [...mockDb.signals].sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()).slice(0, 5),
    recentIncidents: [...mockDb.incidents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    chartData: Array.from({ length: 7 }).map((_, i) => ({
      name: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
      signals: Math.floor(Math.random() * 50) + 10,
      incidents: Math.floor(Math.random() * 5)
    }))
  };
}

export default function Dashboard() {
  const [data, setData] = useState<ReturnType<typeof buildSummary> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setData(buildSummary()), 300);
    return () => clearTimeout(timer);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-white mb-2">Executive Overview</h2>
          <p className="text-slate-400 text-lg">System operations and health telemetry across the SZL portfolio.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-cyan-400 bg-cyan-400/10 px-4 py-2 rounded-full border border-cyan-400/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          Live Sync Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Signals (24h)" value={data.totalSignals} icon={Activity} trend="+12%" color="cyan" />
        <MetricCard title="Critical Signals" value={data.criticalSignalCount} icon={ShieldAlert} trend="+2" color="red" />
        <MetricCard title="Open Incidents" value={data.openIncidentCount} icon={AlertTriangle} trend="-1" color="orange" />
        <MetricCard title="Pending Actions" value={data.pendingRecommendationCount} icon={Lightbulb} trend="0" color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-glass rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div>
              <h3 className="text-xl font-display font-semibold text-white">Signal Volume</h3>
              <p className="text-sm text-slate-400">Aggregated events over the last 7 days</p>
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
                </defs>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#06b6d4' }}
                />
                <Area type="monotone" dataKey="signals" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorSignals)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-glass rounded-2xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-display font-semibold text-white">Attention Required</h3>
            <Link href="/incidents" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="space-y-4 flex-1">
            {data.recentIncidents.slice(0,4).map((incident) => (
              <div key={incident.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      incident.severity === 'critical' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 
                      incident.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                    )} />
                    <span className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors line-clamp-1">{incident.title}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>{incident.status}</span>
                  <span>{incident.assignee}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, trend, color }: any) {
  const colors = {
    cyan: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
    red: "text-red-400 bg-red-400/10 border-red-400/20",
    orange: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  };

  return (
    <div className="bg-glass rounded-2xl p-6 flex flex-col justify-between group hover:border-white/10 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-3 rounded-xl border", colors[color as keyof typeof colors])}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
          <TrendingUp className="w-3 h-3" /> {trend}
        </div>
      </div>
      <div>
        <h4 className="text-slate-400 text-sm font-medium mb-1">{title}</h4>
        <div className="text-3xl font-display font-bold text-white tracking-tight">{value}</div>
      </div>
    </div>
  );
}
