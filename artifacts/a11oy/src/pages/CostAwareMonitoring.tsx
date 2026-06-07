import { useState } from 'react';

interface CostBucket {
  id: string;
  category: string;
  source: string;
  ingestGBDay: number;
  costPerGB: number;
  monthlySpend: number;
  budget: number;
  trend: 'rising' | 'stable' | 'falling';
  alerts: number;
  costPerAlert: number;
}

interface UsageTier {
  name: string;
  included: string;
  overage: string;
  features: string[];
  current: boolean;
}

const COST_BUCKETS: CostBucket[] = [
  { id: 'cb-1', category: 'Metrics', source: 'Infrastructure (APM)', ingestGBDay: 42.5, costPerGB: 0.10, monthlySpend: 127.50, budget: 150, trend: 'stable', alerts: 234, costPerAlert: 0.54 },
  { id: 'cb-2', category: 'Logs', source: 'Application Logs', ingestGBDay: 128.3, costPerGB: 0.05, monthlySpend: 192.45, budget: 200, trend: 'rising', alerts: 89, costPerAlert: 2.16 },
  { id: 'cb-3', category: 'Traces', source: 'Distributed Tracing', ingestGBDay: 67.8, costPerGB: 0.08, monthlySpend: 162.72, budget: 180, trend: 'stable', alerts: 156, costPerAlert: 1.04 },
  { id: 'cb-4', category: 'Synthetic', source: 'Synthetic Metrics', ingestGBDay: 0, costPerGB: 0, monthlySpend: 0, budget: 50, trend: 'stable', alerts: 312, costPerAlert: 0 },
  { id: 'cb-5', category: 'Events', source: 'K8s Events / Audit', ingestGBDay: 15.2, costPerGB: 0.03, monthlySpend: 13.68, budget: 30, trend: 'falling', alerts: 45, costPerAlert: 0.30 },
  { id: 'cb-6', category: 'Automation', source: 'Self-Healing Runs', ingestGBDay: 0, costPerGB: 0, monthlySpend: 85.00, budget: 100, trend: 'stable', alerts: 47, costPerAlert: 1.81 },
  { id: 'cb-7', category: 'AI / ML', source: 'Toto Inference', ingestGBDay: 0, costPerGB: 0, monthlySpend: 320.00, budget: 400, trend: 'rising', alerts: 0, costPerAlert: 0 },
  { id: 'cb-8', category: 'Storage', source: 'TSDB + Data Lake', ingestGBDay: 0, costPerGB: 0.02, monthlySpend: 445.60, budget: 500, trend: 'rising', alerts: 0, costPerAlert: 0 },
];

const USAGE_TIERS: UsageTier[] = [
  { name: 'Basic', included: '10 GB/day', overage: '$0.10/GB', features: ['Metrics', 'Dashboards', 'Basic Alerts'], current: false },
  { name: 'Pro', included: '100 GB/day', overage: '$0.07/GB', features: ['+ Logs/Traces', '+ Synthetic Metrics', '+ ML Anomaly', '+ SLOs'], current: true },
  { name: 'Enterprise', included: '1 TB/day', overage: '$0.04/GB', features: ['+ Toto Forecaster', '+ Causal RCA', '+ Self-Healing', '+ Custom Models', '+ SSO/SAML'], current: false },
];

function generateHistogram(): number[] {
  return Array.from({ length: 30 }, (_, i) => {
    const base = 200 + Math.sin(i / 4) * 40;
    const spike = i === 12 || i === 22 ? 80 : 0;
    return base + spike + (Math.random() - 0.5) * 30;
  });
}

function SpendChart({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const W = 500, H = 80;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[80px]" preserveAspectRatio="none">
      {data.map((v, i) => {
        const barW = (W - data.length) / data.length;
        const barH = (v / max) * (H - 8);
        const x = i * (barW + 1);
        const y = H - barH - 4;
        return (
          <rect key={i} x={x} y={y} width={barW} height={barH} rx="1"
            fill={v > max * 0.85 ? '#fb923c' : '#06b6d4'} opacity="0.6" />
        );
      })}
    </svg>
  );
}

export function CostAwareMonitoring() {
  const [histogram] = useState(generateHistogram);

  const totalMonthly = COST_BUCKETS.reduce((s, b) => s + b.monthlySpend, 0);
  const totalBudget = COST_BUCKETS.reduce((s, b) => s + b.budget, 0);
  const budgetUsed = (totalMonthly / totalBudget) * 100;
  const totalIngest = COST_BUCKETS.reduce((s, b) => s + b.ingestGBDay, 0);
  const syntheticAlerts = COST_BUCKETS.find(b => b.category === 'Synthetic')?.alerts || 0;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#f5f5f5]/40 mb-1">A11OY · PLATFORM · COST MONITORING</p>
        <h1 className="text-2xl font-bold tracking-tight text-[#f5f5f5]">Cost-Aware Monitoring</h1>
        <p className="text-sm text-[#f5f5f5]/50 mt-1 max-w-3xl">
          Full visibility into observability costs — ingestion, storage, compute, and AI inference.
          Budget tracking, cost-per-alert attribution, and optimization recommendations.
          Synthetic metrics deliver {syntheticAlerts} alerts at zero ingestion cost.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Monthly Spend', value: `$${totalMonthly.toFixed(0)}`, color: '#06b6d4' },
          { label: 'Monthly Budget', value: `$${totalBudget.toFixed(0)}`, color: '#c9b787' },
          { label: 'Budget Used', value: `${budgetUsed.toFixed(1)}%`, color: budgetUsed > 85 ? '#fb923c' : '#4ade80' },
          { label: 'Daily Ingest', value: `${totalIngest.toFixed(0)} GB`, color: '#a78bfa' },
          { label: 'Zero-Cost Alerts', value: syntheticAlerts, color: '#4ade80' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-3 space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">{kpi.label}</p>
            <p className="text-xl font-mono font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-5">
        <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-white/70 mb-3">30-Day Spend Trend</h2>
        <SpendChart data={histogram} />
        <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-white/25">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>

      <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg overflow-hidden">
        <div className="p-5 border-b border-white/[0.06]">
          <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-white/70">Cost Breakdown by Category</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.06] text-white/30">
                <th className="text-left px-5 py-2 font-medium uppercase tracking-wider">Category</th>
                <th className="text-left px-3 py-2 font-medium uppercase tracking-wider">Source</th>
                <th className="text-right px-3 py-2 font-medium uppercase tracking-wider">Ingest/day</th>
                <th className="text-right px-3 py-2 font-medium uppercase tracking-wider">$/GB</th>
                <th className="text-right px-3 py-2 font-medium uppercase tracking-wider">Monthly</th>
                <th className="text-right px-3 py-2 font-medium uppercase tracking-wider">Budget</th>
                <th className="text-right px-3 py-2 font-medium uppercase tracking-wider">$/Alert</th>
                <th className="text-right px-5 py-2 font-medium uppercase tracking-wider">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {COST_BUCKETS.map(b => {
                const pct = b.budget > 0 ? (b.monthlySpend / b.budget) * 100 : 0;
                return (
                  <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-2 font-bold text-white/80">{b.category}</td>
                    <td className="px-3 py-2 text-white/50">{b.source}</td>
                    <td className="px-3 py-2 text-right text-white/50">{b.ingestGBDay > 0 ? `${b.ingestGBDay} GB` : '—'}</td>
                    <td className="px-3 py-2 text-right text-white/50">{b.costPerGB > 0 ? `$${b.costPerGB.toFixed(2)}` : '—'}</td>
                    <td className="px-3 py-2 text-right">
                      <span className={pct > 85 ? 'text-orange-400' : 'text-white/70'}>${b.monthlySpend.toFixed(0)}</span>
                    </td>
                    <td className="px-3 py-2 text-right text-white/40">${b.budget}</td>
                    <td className="px-3 py-2 text-right">
                      {b.costPerAlert > 0 ? (
                        <span className={b.costPerAlert > 1.5 ? 'text-orange-400' : 'text-green-400'}>${b.costPerAlert.toFixed(2)}</span>
                      ) : (
                        <span className="text-green-400">$0</span>
                      )}
                    </td>
                    <td className="px-5 py-2 text-right">
                      <span className={b.trend === 'rising' ? 'text-orange-400' : b.trend === 'falling' ? 'text-green-400' : 'text-white/40'}>
                        {b.trend === 'rising' ? '↗' : b.trend === 'falling' ? '↘' : '→'} {b.trend}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/[0.06] font-bold">
                <td className="px-5 py-2 text-white/80" colSpan={4}>Total</td>
                <td className="px-3 py-2 text-right text-[#06b6d4]">${totalMonthly.toFixed(0)}</td>
                <td className="px-3 py-2 text-right text-white/40">${totalBudget}</td>
                <td className="px-3 py-2 text-right" colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {USAGE_TIERS.map(tier => (
          <div key={tier.name} className={`bg-[#0a0a0f] border rounded-lg p-5 ${tier.current ? 'border-[#c9b787]/30' : 'border-white/[0.06]'}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-mono font-bold text-white/80">{tier.name}</h3>
              {tier.current && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#c9b787]/10 text-[#c9b787] border border-[#c9b787]/20">CURRENT</span>}
            </div>
            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-white/40">Included</span>
                <span className="text-white/70">{tier.included}</span>
              </div>
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-white/40">Overage</span>
                <span className="text-white/70">{tier.overage}</span>
              </div>
            </div>
            <div className="space-y-1">
              {tier.features.map(f => (
                <p key={f} className="text-[10px] font-mono text-white/40">{f}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-5">
        <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-white/70 mb-3">Optimization Recommendations</h2>
        <div className="space-y-2">
          {[
            { action: 'Convert 3 high-volume log alerts to synthetic metrics', impact: 'Save ~$45/month in log ingestion', priority: 'high' },
            { action: 'Enable adaptive sampling on trace collection (keep 10% of healthy traces)', impact: 'Save ~$65/month in trace storage', priority: 'high' },
            { action: 'Archive metrics older than 90 days to cold storage tier', impact: 'Save ~$120/month in TSDB costs', priority: 'medium' },
            { action: 'Consolidate 12 overlapping alert rules into 4 composite monitors', impact: 'Reduce alert fatigue + $8/month compute savings', priority: 'low' },
          ].map((rec, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded bg-white/[0.02] border border-white/[0.04]">
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border flex-shrink-0 mt-0.5 uppercase ${
                rec.priority === 'high' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                rec.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                'bg-white/5 text-white/40 border-white/10'
              }`}>{rec.priority}</span>
              <div>
                <p className="text-[11px] text-white/70">{rec.action}</p>
                <p className="text-[10px] text-green-400/60 mt-0.5">{rec.impact}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
