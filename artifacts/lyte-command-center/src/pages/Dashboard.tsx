import { ArrowRight, Brain, DollarSign, Search, TrendingUp, Zap } from 'lucide-react';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

const KPIS = [
  { label: 'Portfolio Entities', value: '14', delta: '+2 this quarter', color: 'text-cyan-400' },
  { label: 'Active Intel Feeds', value: '6', delta: '2 pending auth', color: 'text-emerald-400' },
  { label: 'Avg ROI Signal', value: '2.3×', delta: 'vs 1.8× baseline', color: 'text-lime-400' },
  { label: 'Open Alerts', value: '3', delta: '1 critical', color: 'text-amber-400' },
];

const RECENT = [
  { entity: 'Carlota Jo Consulting', type: 'Entity deep dive', time: '2h ago', status: 'complete' },
  { entity: 'SZL Holdings LLC', type: 'ROI lens', time: '4h ago', status: 'complete' },
  { entity: 'NEXUS Platform', type: 'Finance terminal', time: '1d ago', status: 'complete' },
  { entity: 'Vessels Maritime', type: 'Entity deep dive', time: '2d ago', status: 'stale' },
];

export default function Dashboard() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#e2e8f0] tracking-tight">Command Overview</h1>
        <p className="text-sm text-[#64748b] mt-1">
          KORA aggregates entity intelligence, finance-grade data, and portfolio metrics across the
          SZL Holdings ecosystem.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-[#1a2436] bg-[#0e1520] p-4 space-y-1"
          >
            <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-[#e2e8f0]">{k.label}</p>
            <p className="text-[10px] text-[#64748b]">{k.delta}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <a
          href={`${base}/deep-dive`}
          className="group rounded-2xl border border-[#1a2436] bg-[#0e1520] p-6 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Search className="w-5 h-5 text-cyan-400" />
            </div>
            <ArrowRight className="w-4 h-4 text-[#64748b] group-hover:text-cyan-400 transition-colors" />
          </div>
          <h2 className="text-base font-semibold text-[#e2e8f0]">Deep Dive on Entity</h2>
          <p className="text-sm text-[#64748b] mt-1 leading-relaxed">
            Finance-grade entity analysis via Fincept Terminal (AGPL-isolated MCP proxy). Company
            financials, ownership graph, regulatory filings, and AI narrative.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-1 rounded-md border border-cyan-500/20 text-cyan-400 bg-cyan-500/5">
              finance.terminal
            </span>
            <span className="text-[10px] font-mono px-2 py-1 rounded-md border border-[#1a2436] text-[#64748b]">
              fincept@v0.9-mcp
            </span>
          </div>
        </a>

        <a
          href={`${base}/roi-lens`}
          className="group rounded-2xl border border-[#1a2436] bg-[#0e1520] p-6 hover:border-lime-500/30 hover:bg-lime-500/5 transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-lime-400" />
            </div>
            <ArrowRight className="w-4 h-4 text-[#64748b] group-hover:text-lime-400 transition-colors" />
          </div>
          <h2 className="text-base font-semibold text-[#e2e8f0]">SZL Holdings — ROI Lens</h2>
          <p className="text-sm text-[#64748b] mt-1 leading-relaxed">
            Portfolio-wide return analysis across SZL holdings — NEXUS, Carlota Jo, Vessels,
            Sentra, and Counsel — with waterfall breakdowns and scenario overlays.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-1 rounded-md border border-lime-500/20 text-lime-400 bg-lime-500/5">
              portfolio.roi
            </span>
            <span className="text-[10px] font-mono px-2 py-1 rounded-md border border-[#1a2436] text-[#64748b]">
              PRAXIS v2
            </span>
          </div>
        </a>
      </div>

      <div className="rounded-2xl border border-[#1a2436] bg-[#0e1520] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#1a2436] flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[#64748b]" />
          <span className="text-xs text-[#e2e8f0] font-medium">Recent Activity</span>
        </div>
        <div className="divide-y divide-[#1a2436]">
          {RECENT.map((r) => (
            <div key={r.entity + r.type} className="px-5 py-3 flex items-center gap-3">
              <div
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${r.status === 'complete' ? 'bg-emerald-400' : 'bg-amber-400'}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#e2e8f0] truncate">{r.entity}</p>
                <p className="text-[10px] text-[#64748b]">{r.type}</p>
              </div>
              <span className="text-[10px] text-[#64748b] shrink-0">{r.time}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Brain, label: 'PRAXIS AI Layer', desc: 'GPT-4o router active — 98.4% uptime this week', color: 'text-purple-400', border: 'border-purple-500/20' },
          { icon: TrendingUp, label: 'Fincept Terminal', desc: 'AGPL-isolated MCP proxy · REST bridge healthy', color: 'text-cyan-400', border: 'border-cyan-500/20' },
          { icon: Zap, label: 'Tool Bridge', desc: '3 new adapters registered: marketing.audit, seo.audit, finance.terminal', color: 'text-lime-400', border: 'border-lime-500/20' },
        ].map(({ icon: Icon, label, desc, color, border }) => (
          <div key={label} className={`rounded-xl border ${border} bg-[#0e1520] p-4`}>
            <Icon className={`w-4 h-4 ${color} mb-2`} />
            <p className="text-sm font-medium text-[#e2e8f0]">{label}</p>
            <p className="text-[11px] text-[#64748b] mt-0.5 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
