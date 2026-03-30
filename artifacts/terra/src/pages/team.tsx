import { motion } from "framer-motion";
import { useState } from "react";
import { Users, TrendingUp, AlertTriangle, Award, Target } from "lucide-react";
import { agents, teams, type Agent } from "@/data/brokerage";
import { formatCurrency, AgentAvatar } from "@/components/brokerage-ui";
import { cn } from "@workspace/shared-ui/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

function StatBar({ value, max, color = "bg-terra-primary" }: { value: number; max: number; color?: string }) {
  return (
    <div className="h-1.5 bg-terra-border rounded-full overflow-hidden w-full">
      <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  );
}

function AgentCard({ agent }: { agent: Agent }) {
  const performanceScore = Math.round((agent.conversionRate * 0.4 + (1 - agent.stalledDeals / 10) * 0.3 + (1 - agent.avgDaysToClose / 60) * 0.3) * 100);
  const needsCoaching = agent.conversionRate < 0.35 || agent.stalledDeals >= 3 || agent.avgDaysToClose > 45;

  return (
    <div className={cn(
      "rounded-xl border bg-terra-surface/50 overflow-hidden",
      needsCoaching ? "border-amber-500/30" : "border-terra-border"
    )}>
      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <AgentAvatar name={agent.name} avatar={agent.avatar} className="w-10 h-10 text-sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-display font-bold text-terra-text">{agent.name}</p>
              {needsCoaching && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">coaching opportunity</span>
              )}
            </div>
            <p className="text-xs text-terra-text-muted capitalize">{agent.role} · {agent.team}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] text-terra-text-muted">Perf. Score</p>
            <p className={cn("text-xl font-display font-bold",
              performanceScore >= 70 ? "text-emerald-400" : performanceScore >= 50 ? "text-amber-400" : "text-rose-400"
            )}>{performanceScore}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: "Commission MTD", value: formatCurrency(agent.commissionMTD), color: "text-terra-primary" },
            { label: "Pipeline Value", value: formatCurrency(agent.pipelineValue), color: "text-terra-text" },
            { label: "Active Listings", value: agent.activeListings, color: "text-terra-text" },
            { label: "Active Deals", value: agent.activeDeals, color: "text-terra-text" },
          ].map(m => (
            <div key={m.label} className="rounded-lg bg-terra-bg border border-terra-border p-2.5">
              <p className="text-[10px] text-terra-text-muted">{m.label}</p>
              <p className={cn("text-sm font-bold mt-0.5", m.color)}>{m.value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-terra-text-muted">Conversion Rate</span>
              <span className={cn("font-semibold", agent.conversionRate >= 0.40 ? "text-emerald-400" : agent.conversionRate >= 0.30 ? "text-amber-400" : "text-rose-400")}>
                {Math.round(agent.conversionRate * 100)}%
              </span>
            </div>
            <StatBar value={agent.conversionRate * 100} max={60} color={agent.conversionRate >= 0.40 ? "bg-emerald-500" : agent.conversionRate >= 0.30 ? "bg-amber-500" : "bg-rose-500"} />
          </div>
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-terra-text-muted">Avg Days to Close</span>
              <span className={cn("font-semibold", agent.avgDaysToClose <= 35 ? "text-emerald-400" : agent.avgDaysToClose <= 45 ? "text-amber-400" : "text-rose-400")}>
                {agent.avgDaysToClose}d
              </span>
            </div>
            <StatBar value={Math.max(0, 60 - agent.avgDaysToClose)} max={60} color={agent.avgDaysToClose <= 35 ? "bg-emerald-500" : agent.avgDaysToClose <= 45 ? "bg-amber-500" : "bg-rose-500"} />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-terra-border text-xs">
          <span className="text-terra-text-muted">Closings MTD: <span className="text-terra-text font-semibold">{agent.closingsThisMonth}</span></span>
          <span className="text-terra-text-muted">Leads: <span className="text-terra-text font-semibold">{agent.leadsAssigned}</span></span>
          {agent.stalledDeals > 0 && (
            <span className="text-rose-400 font-semibold flex items-center gap-1 ml-auto">
              <AlertTriangle className="w-3 h-3" />
              {agent.stalledDeals} stalled
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const [view, setView] = useState<"agents" | "teams">("agents");

  const commissionData = agents.map(a => ({
    name: a.name.split(" ")[0],
    commission: a.commissionMTD / 1000,
    deals: a.activeDeals,
  })).sort((a, b) => b.commission - a.commission);

  const radarData = agents.slice(0, 4).map(a => ({
    name: a.name.split(" ")[0],
    conversion: Math.round(a.conversionRate * 100),
    speed: Math.max(0, 60 - a.avgDaysToClose),
    listings: a.activeListings * 5,
    pipeline: Math.min(60, a.pipelineValue / 100000),
  }));

  return (
    <div className="p-6 space-y-6 overflow-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-terra-text">Team Performance</h1>
            <p className="text-sm text-terra-text-secondary mt-1">Deal volume, conversion, days-to-close, coaching, and workload distribution</p>
          </div>
          <div className="flex rounded-lg border border-terra-border overflow-hidden">
            <button onClick={() => setView("agents")} className={cn("px-3 py-2 text-xs font-medium", view === "agents" ? "bg-terra-primary text-white" : "bg-terra-surface text-terra-text-muted")}>Agents</button>
            <button onClick={() => setView("teams")} className={cn("px-3 py-2 text-xs font-medium", view === "teams" ? "bg-terra-primary text-white" : "bg-terra-surface text-terra-text-muted")}>Teams</button>
          </div>
        </div>
      </motion.div>

      {/* Brokerage Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Agents", value: agents.length },
          { label: "Total Commission MTD", value: formatCurrency(agents.reduce((s, a) => s + a.commissionMTD, 0)) },
          { label: "Total Closings MTD", value: agents.reduce((s, a) => s + a.closingsThisMonth, 0) },
          { label: "Coaching Opportunities", value: agents.filter(a => a.conversionRate < 0.35 || a.stalledDeals >= 3 || a.avgDaysToClose > 45).length, alert: true },
        ].map(m => (
          <div key={m.label} className={cn("rounded-xl border p-4 bg-terra-surface/50", (m as any).alert && m.value > 0 ? "border-amber-500/30" : "border-terra-border")}>
            <p className="text-[10px] text-terra-text-muted uppercase tracking-wider">{m.label}</p>
            <p className={cn("text-2xl font-display font-bold mt-1", (m as any).alert && m.value > 0 ? "text-amber-400" : "text-terra-text")}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-terra-border bg-terra-surface/50 p-5">
          <h3 className="font-display font-bold text-terra-text mb-4">Commission MTD by Agent ($K)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={commissionData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(60,100,160,0.08)" />
                <XAxis dataKey="name" tick={{ fill: "#4e5d80", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4e5d80", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}K`} />
                <Tooltip formatter={(v: number) => `$${v}K`} contentStyle={{ backgroundColor: "#0f1626", border: "1px solid #1e2d45", borderRadius: "8px" }} />
                <Bar dataKey="commission" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Commission ($K)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-terra-border bg-terra-surface/50 p-5">
          <h3 className="font-display font-bold text-terra-text mb-4">Agent Performance Radar</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="rgba(60,100,160,0.1)" />
                <PolarAngleAxis dataKey="name" tick={{ fill: "#8b9bc0", fontSize: 10 }} />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <Radar dataKey="conversion" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} name="Conversion" />
                <Radar dataKey="speed" stroke="#10b981" fill="#10b981" fillOpacity={0.08} name="Speed" />
                <Radar dataKey="pipeline" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.08} name="Pipeline" />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {view === "agents" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...agents].sort((a, b) => b.commissionMTD - a.commissionMTD).map(agent => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {teams.map(team => (
            <div key={team.id} className="rounded-xl border border-terra-border bg-terra-surface/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-terra-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-terra-text">{team.name}</h3>
                    <p className="text-xs text-terra-text-secondary mt-0.5">Lead: {team.leadName} · {team.region} · {team.specialization}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-6 text-center">
                    {[
                      { label: "Commission MTD", value: formatCurrency(team.commissionMTD) },
                      { label: "Pipeline Value", value: formatCurrency(team.pipelineValue) },
                      { label: "Conv. Rate", value: `${Math.round(team.conversionRate * 100)}%` },
                    ].map(m => (
                      <div key={m.label}>
                        <p className="text-[10px] text-terra-text-muted">{m.label}</p>
                        <p className="text-sm font-bold text-terra-text">{m.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <p className="text-terra-text-muted">Active Listings</p>
                    <p className="text-2xl font-display font-bold text-terra-text">{team.activeListings}</p>
                  </div>
                  <div>
                    <p className="text-terra-text-muted">Active Deals</p>
                    <p className="text-2xl font-display font-bold text-terra-text">{team.activeDeals}</p>
                  </div>
                  <div>
                    <p className="text-terra-text-muted">Closings MTD</p>
                    <p className="text-2xl font-display font-bold text-emerald-400">{team.closingsThisMonth}</p>
                  </div>
                  <div>
                    <p className="text-terra-text-muted">Members</p>
                    <p className="text-2xl font-display font-bold text-terra-text">{team.members.length}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
