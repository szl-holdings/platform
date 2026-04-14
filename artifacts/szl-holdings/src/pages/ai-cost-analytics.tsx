import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, Zap, Bot, AlertTriangle, CheckCircle, BarChart3, RefreshCw } from "lucide-react";

const API_BASE = "/api";

interface SpendRecord {
  workflowId: string;
  model: string;
  provider: string;
  tokensUsed: number;
  costUsd: number;
  agentId: string;
  recordedAt: string;
}

interface CostAnalytics {
  totalSpend: number;
  byModel: Record<string, { spend: number; tokens: number; calls: number }>;
  byAgent: Record<string, { spend: number; tokens: number }>;
  byWorkflow: Record<string, { spend: number; tokens: number }>;
  recentRecords: SpendRecord[];
  modelPricing: Array<{ model: string; provider: string; inputCostPer1KTokens: number; outputCostPer1KTokens: number; tier: string }>;
  budgetStatuses: Array<{ workflowId: string; budgetUsd: number; usedUsd: number; remainingUsd: number; percentUsed: number; status: string }>;
}

interface FlywheelStats {
  totalCaptured: number;
  totalGolden: number;
  avgQualityScore: number;
  avgConfidence: number;
}

function MetricCard({ label, value, sub, icon: Icon, color, bg }: { label: string; value: string; sub?: string; icon: typeof DollarSign; color: string; bg: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <span className="text-xs text-white/50">{label}</span>
      </div>
      <div className="text-xl font-bold text-white">{value}</div>
      {sub && <div className="text-[10px] text-white/30 mt-0.5">{sub}</div>}
    </div>
  );
}

function BudgetStatusBar({ workflowId, percentUsed, status, budgetUsd, usedUsd }: {
  workflowId: string;
  percentUsed: number;
  status: string;
  budgetUsd: number;
  usedUsd: number;
}) {
  const barColor = status === "exceeded" ? "bg-red-500" : status === "critical" ? "bg-orange-500" : status === "warning" ? "bg-amber-500" : "bg-green-500";
  const textColor = status === "exceeded" ? "text-red-400" : status === "critical" ? "text-orange-400" : status === "warning" ? "text-amber-400" : "text-green-400";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/60 truncate max-w-[160px]">{workflowId}</span>
        <span className={`${textColor} font-medium`}>{status.toUpperCase()}</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${Math.min(100, percentUsed)}%` }} />
      </div>
      <div className="flex items-center justify-between text-[10px] text-white/30">
        <span>${usedUsd.toFixed(4)} spent</span>
        <span>of ${budgetUsd.toFixed(2)}</span>
      </div>
    </div>
  );
}

export default function AICostAnalyticsPage() {
  const { data: costData, isLoading, refetch } = useQuery<CostAnalytics>({
    queryKey: ["ai-cost-analytics"],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/nuro-mesh/cost/analytics`);
      return r.json();
    },
    refetchInterval: 30000,
  });

  const { data: flywheelStats } = useQuery<FlywheelStats>({
    queryKey: ["flywheel-stats"],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/nuro-mesh/flywheel/stats`);
      return r.json();
    },
    refetchInterval: 60000,
  });

  const totalTokens = Object.values(costData?.byModel ?? {}).reduce((s, m) => s + m.tokens, 0);
  const topModel = Object.entries(costData?.byModel ?? {}).sort((a, b) => b[1].spend - a[1].spend)[0];
  const topAgent = Object.entries(costData?.byAgent ?? {}).sort((a, b) => b[1].spend - a[1].spend)[0];
  const activeBudgets = (costData?.budgetStatuses ?? []).filter(b => b.status !== "ok");

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI Cost & Budget Intelligence</h1>
            <p className="text-xs text-white/40">Real-time spend tracking, model cost breakdown, and budget management</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total AI Spend"
          value={`$${(costData?.totalSpend ?? 0).toFixed(4)}`}
          sub="All workflows"
          icon={DollarSign}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <MetricCard
          label="Total Tokens"
          value={totalTokens > 1000000 ? `${(totalTokens / 1000000).toFixed(1)}M` : totalTokens > 1000 ? `${(totalTokens / 1000).toFixed(0)}K` : String(totalTokens)}
          sub="Across all agents"
          icon={Zap}
          color="text-blue-400"
          bg="bg-blue-500/10"
        />
        <MetricCard
          label="Top Spend Model"
          value={topModel?.[0] ?? "—"}
          sub={topModel ? `$${topModel[1].spend.toFixed(4)}` : "No data"}
          icon={TrendingUp}
          color="text-purple-400"
          bg="bg-purple-500/10"
        />
        <MetricCard
          label="Golden Runs"
          value={String(flywheelStats?.totalGolden ?? 0)}
          sub={`of ${flywheelStats?.totalCaptured ?? 0} captured`}
          icon={CheckCircle}
          color="text-amber-400"
          bg="bg-amber-500/10"
        />
      </div>

      {activeBudgets.length > 0 && (
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-orange-300">Budget Alerts ({activeBudgets.length})</span>
          </div>
          <div className="space-y-3">
            {activeBudgets.map(b => (
              <BudgetStatusBar key={b.workflowId} {...b} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white">Spend by Model</span>
          </div>
          {Object.keys(costData?.byModel ?? {}).length === 0 ? (
            <p className="text-xs text-white/30 text-center py-4">No spend data yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(costData?.byModel ?? {})
                .sort((a, b) => b[1].spend - a[1].spend)
                .slice(0, 6)
                .map(([model, data]) => {
                  const maxSpend = Math.max(...Object.values(costData?.byModel ?? {}).map(m => m.spend), 0.0001);
                  const pct = (data.spend / maxSpend) * 100;
                  return (
                    <div key={model} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/70 truncate max-w-[200px]">{model}</span>
                        <div className="flex items-center gap-3 text-white/40">
                          <span>{data.calls} calls</span>
                          <span className="text-white/70 font-medium">${data.spend.toFixed(4)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500/60 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-white">Spend by Agent</span>
          </div>
          {Object.keys(costData?.byAgent ?? {}).length === 0 ? (
            <p className="text-xs text-white/30 text-center py-4">No agent data yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(costData?.byAgent ?? {})
                .sort((a, b) => b[1].spend - a[1].spend)
                .map(([agentId, data]) => {
                  const maxSpend = Math.max(...Object.values(costData?.byAgent ?? {}).map(m => m.spend), 0.0001);
                  const pct = (data.spend / maxSpend) * 100;
                  return (
                    <div key={agentId} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/70 capitalize">{agentId}</span>
                        <div className="flex items-center gap-3 text-white/40">
                          <span>{(data.tokens / 1000).toFixed(0)}K tokens</span>
                          <span className="text-white/70 font-medium">${data.spend.toFixed(4)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500/60 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-white">Model Pricing Reference</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-white/30 border-b border-white/10">
                <th className="text-left pb-2">Model</th>
                <th className="text-left pb-2">Provider</th>
                <th className="text-left pb-2">Tier</th>
                <th className="text-right pb-2">Input /1K</th>
                <th className="text-right pb-2">Output /1K</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(costData?.modelPricing ?? []).map(m => (
                <tr key={m.model} className="text-white/60">
                  <td className="py-2 font-medium text-white/80">{m.model}</td>
                  <td className="py-2 capitalize">{m.provider}</td>
                  <td className="py-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${m.tier === "premium" ? "bg-amber-500/20 text-amber-400" : m.tier === "standard" ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"}`}>
                      {m.tier}
                    </span>
                  </td>
                  <td className="py-2 text-right font-mono">${m.inputCostPer1KTokens.toFixed(5)}</td>
                  <td className="py-2 text-right font-mono">${m.outputCostPer1KTokens.toFixed(5)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(costData?.recentRecords ?? []).length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-sm font-medium text-white mb-3">Recent Spend Events</h3>
          <div className="space-y-2">
            {(costData?.recentRecords ?? []).slice(0, 10).map((record, i) => (
              <div key={i} className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                <div className="flex items-center gap-3">
                  <span className="text-white/50 font-mono">{record.agentId}</span>
                  <span className="text-white/40">{record.model}</span>
                  <span className="text-white/30">{record.tokensUsed.toLocaleString()} tokens</span>
                </div>
                <span className="text-emerald-400 font-medium">${record.costUsd.toFixed(5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
