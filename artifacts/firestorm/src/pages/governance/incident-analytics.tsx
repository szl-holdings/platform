import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Clock, TrendingUp, TrendingDown, Users, AlertTriangle, CheckCircle2,
  BarChart3, Activity, Target, Minus, Info
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, PieChart, Pie, Cell
} from "recharts";

interface Incident { id: number; status: string; severity: string; assignedAnalyst?: string; title?: string }
interface Finding { id: number; severity: string; status: string }

function DemoDataBanner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-amber-400/10 border border-amber-400/20 text-xs text-amber-400 font-mono">
      <Info size={12} />
      <span>{label} — seeded pilot data, not yet wired to live pipeline</span>
    </div>
  );
}

function MetricCard({ label, value, unit, sub, trend, icon: Icon, color = "#f59e0b" }: {
  label: string; value: string | number; unit?: string; sub?: string;
  trend?: "up" | "down" | "flat"; icon: React.ComponentType<{ size?: number; color?: string }>; color?: string;
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "#22c55e" : trend === "down" ? "#ef4444" : "#6b7280";
  return (
    <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono">{label}</span>
        <Icon size={16} color={color} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-white font-mono">{value}</span>
        {unit && <span className="text-sm text-[#8b9ab0] font-mono">{unit}</span>}
      </div>
      {sub && (
        <div className="flex items-center gap-1.5 text-xs">
          <TrendIcon size={12} color={trendColor} />
          <span style={{ color: trendColor }}>{sub}</span>
        </div>
      )}
    </div>
  );
}

const MTTD_DATA: Array<{ week: string; mttd: number; mttr: number }> = [];
const ESCALATION_DATA: Array<{ week: string; escalated: number; total: number; rate: number }> = [];
const APPROVAL_DELAY_DATA: Array<{ severity: string; avgDelayMin: number; slaMin: number }> = [];

export default function IncidentAnalyticsPage() {
  const { data: incidents } = useQuery<Incident[]>({ queryKey: ["incidents"], queryFn: () => api.incidents.list() });
  const { data: findings } = useQuery<Finding[]>({ queryKey: ["findings"], queryFn: () => api.findings.list() });
  const closedIncidents = incidents?.filter(i => i.status === "closed") ?? [];
  const activeIncidents = incidents?.filter(i => i.status !== "closed") ?? [];
  const criticalFindings = findings?.filter(f => f.severity === "critical" && f.status !== "mitigated").length ?? 0;
  const totalIncidents = incidents?.length ?? 0;
  const resolutionRate = totalIncidents > 0 ? Math.round((closedIncidents.length / totalIncidents) * 100) : 0;

  const resolutionBySeverity = [
    { name: "Critical", value: incidents?.filter(i => i.severity === "critical").length ?? 0, color: "#ef4444" },
    { name: "High", value: incidents?.filter(i => i.severity === "high").length ?? 0, color: "#f97316" },
    { name: "Medium", value: incidents?.filter(i => i.severity === "medium").length ?? 0, color: "#f59e0b" },
    { name: "Low", value: incidents?.filter(i => i.severity === "low").length ?? 0, color: "#3b82f6" },
  ].filter(s => s.value > 0);

  const analystWorkload = (() => {
    const map = new Map<string, { active: number; closed: number; escalated: number }>();
    for (const inc of incidents ?? []) {
      const name = inc.assignedAnalyst ?? "Unassigned";
      if (!map.has(name)) map.set(name, { active: 0, closed: 0, escalated: 0 });
      const entry = map.get(name)!;
      if (inc.status === "closed") entry.closed++;
      else entry.active++;
      if (inc.severity === "critical" || inc.severity === "high") entry.escalated++;
    }
    return Array.from(map.entries()).map(([analyst, data]) => ({ analyst, ...data }));
  })();

  void criticalFindings;

  return (
    <div className="min-h-screen bg-[#07090d] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-3 mb-1">
          <Activity size={22} className="text-amber-400" />
          <h1 className="text-xl font-bold text-white font-mono tracking-tight">Incident Analytics</h1>
        </div>
        <p className="text-xs text-[#8b9ab0] font-mono -mt-6">MTTD · MTTR · Escalation rate · Approval delay · Resolution rate · Analyst workload</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Mean Time to Detect" value={totalIncidents > 0 ? "—" : "—"} unit="" sub={totalIncidents > 0 ? "Requires timestamp telemetry" : "No incidents recorded"} trend="flat" icon={Clock} color="#6b7280" />
          <MetricCard label="Mean Time to Respond" value={totalIncidents > 0 ? "—" : "—"} unit="" sub={totalIncidents > 0 ? "Requires resolution timestamps" : "No incidents recorded"} trend="flat" icon={Target} color="#6b7280" />
          <MetricCard label="Active Incidents" value={activeIncidents.length} unit="" sub={`${totalIncidents} total in system`} trend="flat" icon={AlertTriangle} color="#f59e0b" />
          <MetricCard label="Resolution Rate" value={`${resolutionRate}%`} sub={`${closedIncidents.length} of ${totalIncidents} closed`} trend="up" icon={CheckCircle2} color="#22c55e" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-5">
            <h3 className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono mb-4">MTTD & MTTR Trend — 7 Weeks</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={MTTD_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                <XAxis dataKey="week" tick={{ fill: "#8b9ab0", fontSize: 10 }} />
                <YAxis tick={{ fill: "#8b9ab0", fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: "#0d1117", border: "1px solid #1e2a3a", borderRadius: 8 }} />
                <Line type="monotone" dataKey="mttd" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="MTTD (min)" />
                <Line type="monotone" dataKey="mttr" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="MTTR (min)" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
              {[{ label: "MTTD (min)", color: "#22c55e" }, { label: "MTTR (min)", color: "#f59e0b" }].map(l => (
                <div key={l.label} className="flex items-center gap-1"><div className="w-3 h-0.5" style={{ backgroundColor: l.color }} /><span className="text-xs text-[#8b9ab0]">{l.label}</span></div>
              ))}
            </div>
          </div>

          <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-5">
            <h3 className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono mb-4">Escalation Rate — 7 Weeks (%)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ESCALATION_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                <XAxis dataKey="week" tick={{ fill: "#8b9ab0", fontSize: 10 }} />
                <YAxis tick={{ fill: "#8b9ab0", fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: "#0d1117", border: "1px solid #1e2a3a", borderRadius: 8 }} />
                <Bar dataKey="rate" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Escalation %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-5">
            <h3 className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono mb-4">Approval Delay vs SLA (minutes)</h3>
            <div className="space-y-4">
              {APPROVAL_DELAY_DATA.map(d => (
                <div key={d.severity} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-white">{d.severity}</span>
                    <span className="text-[#8b9ab0]">{d.avgDelayMin}min avg / {d.slaMin}min SLA</span>
                  </div>
                  <div className="h-2 bg-[#1e2a3a] rounded-full overflow-hidden relative">
                    <div className="h-full rounded-full" style={{
                      width: `${Math.min(100, (d.avgDelayMin / d.slaMin) * 100)}%`,
                      backgroundColor: d.avgDelayMin > d.slaMin * 0.8 ? "#ef4444" : d.avgDelayMin > d.slaMin * 0.5 ? "#f59e0b" : "#22c55e"
                    }} />
                    <div className="absolute top-0 bottom-0 border-r-2 border-white/30" style={{ left: "80%" }} title="80% SLA" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-5">
            <h3 className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono mb-4">Incidents by Severity</h3>
            {resolutionBySeverity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <BarChart3 size={24} className="text-[#1e2a3a]" />
                <p className="text-xs text-[#8b9ab0] font-mono">No incident data</p>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={resolutionBySeverity} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65}>
                      {resolutionBySeverity.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1">
                  {resolutionBySeverity.map(s => (
                    <div key={s.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-xs text-[#8b9ab0]">{s.name}</span>
                      </div>
                      <span className="text-xs text-white font-mono">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-5">
          <h3 className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono mb-4">Analyst Workload</h3>
          {analystWorkload.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Users size={24} className="text-[#1e2a3a]" />
              <p className="text-xs text-[#8b9ab0] font-mono">No incidents with assigned analysts</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#1e2a3a]">
                    {["Analyst", "Active Cases", "Closed", "Critical/High"].map(h => (
                      <th key={h} className="text-left text-[#8b9ab0] pb-3 pr-6 font-normal uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0d1117]">
                  {analystWorkload.map(a => (
                    <tr key={a.analyst} className="hover:bg-[#0a0f16] transition-colors">
                      <td className="py-3 pr-6 text-white">{a.analyst}</td>
                      <td className="py-3 pr-6">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${a.active >= 6 ? "bg-red-500/20 text-red-400" : a.active >= 4 ? "bg-amber-500/20 text-amber-400" : "bg-green-500/20 text-green-400"}`}>{a.active}</span>
                      </td>
                      <td className="py-3 pr-6 text-[#8b9ab0]">{a.closed}</td>
                      <td className="py-3 pr-6">
                        <span className={a.escalated > 2 ? "text-red-400" : "text-[#8b9ab0]"}>{a.escalated}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
