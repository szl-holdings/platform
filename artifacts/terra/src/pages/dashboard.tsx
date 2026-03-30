import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp, Clock, DollarSign, Home, Users, CheckCircle, Zap, Shield, Activity } from "lucide-react";
import { brokerageSummary, brokerageDeals, riskSignals, agents, automationRuns } from "@/data/brokerage";
import { RiskBadge, StageBadge, DealHealthCard, formatCurrency, AgentAvatar, StatusIndicator } from "@/components/brokerage-ui";
import { cn } from "@workspace/shared-ui/utils";
import { Link } from "wouter";

const commandLoopItems = [
  { label: "DETECT", desc: "Pipeline & listing health", icon: Activity, color: "text-blue-400" },
  { label: "INTERPRET", desc: "Risk signals & Nimbus intel", icon: Shield, color: "text-violet-400" },
  { label: "DECIDE", desc: "Owner actions & approvals", icon: Users, color: "text-amber-400" },
  { label: "EXECUTE", desc: "AlloyScape automations", icon: Zap, color: "text-emerald-400" },
  { label: "VERIFY", desc: "Compliance & audit trail", icon: CheckCircle, color: "text-terra-primary" },
];

export default function DashboardPage() {
  const activeSignals = riskSignals.filter(s => !s.acknowledged);
  const criticalSignals = activeSignals.filter(s => s.severity === "critical");
  const topAgents = [...agents].sort((a, b) => b.commissionMTD - a.commissionMTD).slice(0, 6);
  const recentRuns = automationRuns.slice(0, 4);

  return (
    <div className="p-6 space-y-6 overflow-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-terra-text">Brokerage Command Center</h1>
            <p className="text-sm text-terra-text-secondary mt-1">Real-time visibility across listings, deals, leads, and pipeline — March 30, 2026</p>
          </div>
          <div className="flex items-center gap-2">
            {criticalSignals.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/10 border border-red-500/20 text-xs text-red-400 font-semibold animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                {criticalSignals.length} Critical
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              {activeSignals.length} Active Signals
            </div>
          </div>
        </div>
      </motion.div>

      {/* Command Loop */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
        className="flex gap-2 overflow-x-auto pb-1">
        {commandLoopItems.map((item, i) => (
          <div key={item.label} className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-terra-surface border border-terra-border">
              <item.icon className={cn("w-3.5 h-3.5", item.color)} />
              <div>
                <p className={cn("text-[10px] font-bold uppercase tracking-wider", item.color)}>{item.label}</p>
                <p className="text-[10px] text-terra-text-muted hidden sm:block">{item.desc}</p>
              </div>
            </div>
            {i < commandLoopItems.length - 1 && <div className="text-terra-text-muted text-xs flex-shrink-0">→</div>}
          </div>
        ))}
      </motion.div>

      {/* KPI Strip */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Active Listings", value: brokerageSummary.activeListings, icon: Home, color: "from-blue-500 to-cyan-400" },
            { label: "Active Buyers", value: brokerageSummary.activeBuyers, icon: Users, color: "from-violet-500 to-purple-400" },
            { label: "Active Deals", value: brokerageSummary.activeDeals, icon: Activity, color: "from-emerald-500 to-green-400" },
            { label: "Pending Offers", value: brokerageSummary.pendingOffers, icon: DollarSign, color: "from-amber-500 to-yellow-400" },
            { label: "Under Contract", value: brokerageSummary.underContract, icon: CheckCircle, color: "from-terra-primary to-terra-accent" },
            { label: "Closings MTD", value: brokerageSummary.closingsThisMonth, icon: TrendingUp, color: "from-emerald-500 to-teal-400" },
          ].map((m) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-terra-border p-4 bg-terra-surface/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 opacity-5">
                <div className={cn("w-full h-full rounded-bl-full bg-gradient-to-br", m.color)} />
              </div>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br mb-2", m.color)}>
                <m.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-[10px] text-terra-text-muted uppercase tracking-wider">{m.label}</p>
              <p className="text-2xl font-display font-bold text-terra-text">{m.value}</p>
            </motion.div>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "Pipeline Value", value: formatCurrency(brokerageSummary.pipelineValue), sub: "Active deals", alert: false },
            { label: "Commission MTD", value: formatCurrency(brokerageSummary.totalCommissionMTD), sub: "All agents", alert: false },
            { label: "Commission at Risk", value: formatCurrency(brokerageSummary.commissionAtRisk), sub: "High/critical deals", alert: true },
            { label: "Avg Days to Close", value: `${brokerageSummary.avgDaysToClose}d`, sub: "Team average", alert: false },
            { label: "Stalled Deals", value: brokerageSummary.stalledDeals, sub: "Need intervention", alert: brokerageSummary.stalledDeals > 0 },
          ].map((m) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={cn("rounded-xl border p-4 bg-terra-surface/50", m.alert ? "border-rose-500/30 bg-rose-500/5" : "border-terra-border")}>
              <p className="text-[10px] text-terra-text-muted uppercase tracking-wider">{m.label}</p>
              <p className={cn("text-xl font-display font-bold mt-1", m.alert ? "text-rose-400" : "text-terra-text")}>{m.value}</p>
              {m.sub && <p className="text-[10px] text-terra-text-muted mt-0.5">{m.sub}</p>}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Signal Panel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
          <div className="rounded-xl border border-terra-border bg-terra-surface/50 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-terra-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h3 className="font-display font-bold text-terra-text">Risk Signals — Beacon</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400">{activeSignals.length} active</span>
              </div>
              <Link href="/deals">
                <span className="text-xs text-terra-text-muted hover:text-terra-primary cursor-pointer transition-colors">View All →</span>
              </Link>
            </div>
            <div className="divide-y divide-terra-border">
              {activeSignals.slice(0, 5).map((signal) => (
                <div key={signal.id} className={cn("px-5 py-4 hover:bg-terra-surface-hover transition-colors", signal.severity === "critical" && "bg-red-600/5")}>
                  <div className="flex items-start gap-3">
                    <RiskBadge level={signal.severity} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-terra-text">{signal.title}</p>
                      <p className="text-xs text-terra-text-secondary mt-0.5 line-clamp-1">{signal.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded truncate">→ {signal.actionRequired}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] text-terra-text-muted">{signal.daysOpen === 0 ? "Today" : `${signal.daysOpen}d`}</span>
                      <p className="text-[10px] text-terra-text-muted mt-0.5">{signal.assignedTo}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Urgent Items */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-amber-500/20 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="font-display font-bold text-terra-text">Action Needed</h3>
            </div>
            <div className="p-4 space-y-3">
              {brokerageDeals.filter(d => d.hasUrgentIssue && !["closed","lost-stalled"].includes(d.stage)).slice(0,4).map(deal => (
                <div key={deal.id} className="rounded-lg border border-amber-500/20 bg-terra-surface p-3">
                  <p className="text-xs font-semibold text-terra-text">{deal.address.split(",")[0]}</p>
                  <p className="text-[10px] text-amber-400 mt-0.5">{deal.urgentIssue}</p>
                  <div className="flex items-center justify-between mt-2">
                    <StageBadge stage={deal.stage} />
                    <span className="text-[10px] text-terra-text-muted">{deal.nextActionOwner}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stalled Deals */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="rounded-xl border border-terra-border bg-terra-surface/50 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-terra-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-400" />
                <h3 className="font-display font-bold text-terra-text">Stalled Deals</h3>
              </div>
              <Link href="/deals">
                <span className="text-xs text-terra-text-muted hover:text-terra-primary cursor-pointer">View Pipeline →</span>
              </Link>
            </div>
            <div className="divide-y divide-terra-border">
              {brokerageDeals.filter(d => d.isStalled).map(deal => (
                <div key={deal.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <DealHealthCard score={deal.dealHealthScore} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-terra-text">{deal.address.split(",")[0]}</p>
                      <p className="text-xs text-terra-text-secondary mt-0.5">{deal.stalledReason}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <StageBadge stage={deal.stage} />
                        <span className="text-[10px] text-terra-text-muted">{deal.daysInStage}d in stage</span>
                      </div>
                    </div>
                    <RiskBadge level={deal.riskLevel} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Automation Runs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <div className="rounded-xl border border-terra-border bg-terra-surface/50 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-terra-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-terra-primary" />
                <h3 className="font-display font-bold text-terra-text">AlloyScape — Recent Runs</h3>
              </div>
              <Link href="/automations">
                <span className="text-xs text-terra-text-muted hover:text-terra-primary cursor-pointer">View All →</span>
              </Link>
            </div>
            <div className="divide-y divide-terra-border">
              {recentRuns.map(run => (
                <div key={run.id} className="px-5 py-3.5 flex items-start gap-3">
                  <StatusIndicator status={run.status === "success" ? "success" : run.status === "failed" ? "error" : "warning"} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-terra-text">{run.automationName}</p>
                    <p className="text-[10px] text-terra-text-muted">{run.affectedEntity}</p>
                    {run.errorMessage && <p className="text-[10px] text-rose-400 mt-0.5">{run.errorMessage}</p>}
                  </div>
                  <span className="text-[10px] text-terra-text-muted flex-shrink-0">{new Date(run.startedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Agent Leaderboard */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <div className="rounded-xl border border-terra-border bg-terra-surface/50 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-terra-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-terra-primary" />
              <h3 className="font-display font-bold text-terra-text">Agent Leaderboard — MTD</h3>
            </div>
            <Link href="/team">
              <span className="text-xs text-terra-text-muted hover:text-terra-primary cursor-pointer">Full Report →</span>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-terra-border">
                  {["Agent", "Team", "Listings", "Deals", "Commission MTD", "Conv. Rate", "Avg DTC", "Stalled"].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topAgents.map((agent) => (
                  <tr key={agent.id} className="border-b border-terra-border/50 hover:bg-terra-surface-hover transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <AgentAvatar name={agent.name} avatar={agent.avatar} className="w-7 h-7 text-[10px]" />
                        <div>
                          <p className="text-xs font-semibold text-terra-text">{agent.name}</p>
                          <p className="text-[10px] text-terra-text-muted capitalize">{agent.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-terra-text-secondary">{agent.team}</td>
                    <td className="py-3 px-4 text-xs text-terra-text">{agent.activeListings}</td>
                    <td className="py-3 px-4 text-xs text-terra-text">{agent.activeDeals}</td>
                    <td className="py-3 px-4 text-xs font-semibold text-terra-primary">{formatCurrency(agent.commissionMTD)}</td>
                    <td className="py-3 px-4 text-xs">
                      <span className={cn(agent.conversionRate >= 0.40 ? "text-emerald-400" : agent.conversionRate >= 0.30 ? "text-amber-400" : "text-rose-400")}>
                        {Math.round(agent.conversionRate * 100)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-terra-text">{agent.avgDaysToClose}d</td>
                    <td className="py-3 px-4">
                      {agent.stalledDeals > 0 ? (
                        <span className="text-xs font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">{agent.stalledDeals}</span>
                      ) : (
                        <span className="text-xs text-emerald-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
