import { useState } from "react";
import { BarChart3, TrendingUp, TrendingDown, Minus, AlertTriangle, Users, Clock, Layers, ArrowRight, ChevronRight, RefreshCw } from "lucide-react";
import { Link } from "wouter";

const DEMO_SNAPSHOT = {
  totalMatters: 47,
  criticalPressureCount: 8,
  highPressureCount: 14,
  moderatePressureCount: 19,
  quietRiskCount: 6,
  highFrictionCount: 11,
  readyToMoveCount: 9,
  reviewBacklogSize: 23,
  signoffBacklogSize: 7,
  approvalBottleneckCount: 4,
  avgReviewLagDays: 3.8,
  avgSignoffLagDays: 1.9,
  insurerDragCount: 12,
  recoveryDragCount: 5,
  movementOpportunityCount: 9,
};

const DEMO_PRESSURE_BANDS = [
  { band: "Critical (>75%)", count: 8, pct: 17, color: "#c45a4a" },
  { band: "High (50–75%)", count: 14, pct: 30, color: "#c8953c" },
  { band: "Moderate (25–50%)", count: 19, pct: 40, color: "#d4a054" },
  { band: "Quiet (<25%)", count: 6, pct: 13, color: "#4a90b8" },
];

const DEMO_TEAM_THROUGHPUT = [
  { team: "Chen / Williams", clearRate: 0.91, matters: 12, color: "#4a90b8" },
  { team: "Patel / Cruz", clearRate: 0.78, matters: 9, color: "#d4a054" },
  { team: "Roberts Team", clearRate: 0.65, matters: 14, color: "#c8953c" },
  { team: "Nguyen / Davis", clearRate: 0.52, matters: 12, color: "#c45a4a" },
];

const DEMO_TOP_MATTERS = [
  { id: 1, title: "Rodriguez v. National General", pressure: 0.84, trend: "rising", status: "pre_trial" },
  { id: 2, title: "Thompson v. Westfield Ins.", pressure: 0.78, trend: "rising", status: "discovery" },
  { id: 3, title: "Martinez v. Allstate", pressure: 0.71, trend: "stable", status: "discovery" },
  { id: 4, title: "Chen v. GEICO Direct", pressure: 0.68, trend: "falling", status: "settlement" },
  { id: 5, title: "Johnson v. Progressive", pressure: 0.65, trend: "rising", status: "pre_trial" },
];

function MetricCard({ label, value, sub, color, icon: Icon, href }: any) {
  const inner = (
    <div className="rounded-lg border border-white/[0.06] p-4 hover:border-white/[0.10] transition-colors cursor-pointer" style={{ background: "#0c1220" }}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-1">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function TrendIcon({ t }: { t: string }) {
  if (t === "rising") return <TrendingUp className="w-3 h-3 text-[#c45a4a]" />;
  if (t === "falling") return <TrendingDown className="w-3 h-3 text-[#4a90b8]" />;
  return <Minus className="w-3 h-3 text-slate-500" />;
}

export default function PortfolioOverviewPage() {
  const [lastRefreshed] = useState(() => new Date().toLocaleTimeString());
  const s = DEMO_SNAPSHOT;

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#d4a054]" />
            <h1 className="text-lg font-semibold text-slate-100">Portfolio Overview</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20">PILOT TWO</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-[#c8953c]/10 text-[#c8953c] border border-[#c8953c]/20">DEMO DATA</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Full portfolio operational view — pressure, friction, readiness, and movement</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <RefreshCw className="w-3 h-3" />
          <span>Refreshed {lastRefreshed}</span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <MetricCard label="Total Matters" value={s.totalMatters} sub="Across all open files" color="#d4a054" icon={Layers} />
        <MetricCard label="Critical Pressure" value={s.criticalPressureCount} sub="Need immediate action" color="#c45a4a" icon={AlertTriangle} href="/portfolio/pressure-board" />
        <MetricCard label="Review Backlog" value={s.reviewBacklogSize} sub={`Avg ${s.avgReviewLagDays}d lag`} color="#c8953c" icon={Clock} href="/portfolio/review-backlog" />
        <MetricCard label="Movement Ready" value={s.readyToMoveCount} sub="Can advance now" color="#4a90b8" icon={TrendingUp} href="/portfolio/movement-opportunity" />
        <MetricCard label="Approval Bottlenecks" value={s.approvalBottleneckCount} sub="Blocked on approval" color="#8b7ac8" icon={Users} href="/portfolio/approval-bottleneck" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-200">Pressure Band Distribution</h3>
            <Link href="/portfolio/pressure-board">
              <span className="text-[10px] text-slate-500 hover:text-[#d4a054] cursor-pointer flex items-center gap-1">View board <ChevronRight className="w-3 h-3" /></span>
            </Link>
          </div>
          <div className="space-y-2">
            {DEMO_PRESSURE_BANDS.map(b => (
              <div key={b.band} className="flex items-center gap-3">
                <div className="w-28 text-[10px] text-slate-400 truncate">{b.band}</div>
                <div className="flex-1 h-2 bg-white/[0.06] rounded-full">
                  <div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: b.color }} />
                </div>
                <div className="w-8 text-right font-mono text-[10px]" style={{ color: b.color }}>{b.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-200">Top Pressure Matters</h3>
            <Link href="/portfolio/pressure-board">
              <span className="text-[10px] text-slate-500 hover:text-[#d4a054] cursor-pointer flex items-center gap-1">All <ChevronRight className="w-3 h-3" /></span>
            </Link>
          </div>
          <div className="space-y-2">
            {DEMO_TOP_MATTERS.map(m => (
              <div key={m.id} className="flex items-center gap-3 py-1.5 border-b border-white/[0.04] last:border-0">
                <TrendIcon t={m.trend} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-slate-200 truncate">{m.title}</div>
                  <div className="text-[9px] text-slate-500">{m.status.replace("_", " ")}</div>
                </div>
                <div className="text-[11px] font-mono" style={{ color: m.pressure > 0.7 ? "#c45a4a" : m.pressure > 0.5 ? "#c8953c" : "#d4a054" }}>
                  {Math.round(m.pressure * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-200">Team Throughput</h3>
            <Link href="/portfolio/throughput">
              <span className="text-[10px] text-slate-500 hover:text-[#d4a054] cursor-pointer flex items-center gap-1">All <ChevronRight className="w-3 h-3" /></span>
            </Link>
          </div>
          <div className="space-y-2.5">
            {DEMO_TEAM_THROUGHPUT.map(t => (
              <div key={t.team}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-300">{t.team}</span>
                  <span className="text-[10px] font-mono" style={{ color: t.color }}>{Math.round(t.clearRate * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/[0.06] rounded-full">
                  <div className="h-full rounded-full" style={{ width: `${t.clearRate * 100}%`, background: t.color }} />
                </div>
                <div className="text-[9px] text-slate-600 mt-0.5">{t.matters} matters</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Insurer Drag", value: s.insurerDragCount, sub: "carrier behavior blocking", color: "#c8953c", href: "/portfolio/insurer-pressure" },
          { label: "Recovery/Lien Drag", value: s.recoveryDragCount, sub: "lien resolution blocking", color: "#c45a4a", href: "/portfolio/recovery-lien" },
          { label: "High Friction", value: s.highFrictionCount, sub: "settlement friction elevated", color: "#d4a054", href: "/portfolio/friction-board" },
          { label: "Quiet Risk", value: s.quietRiskCount, sub: "silently deteriorating", color: "#8b7ac8", href: "/portfolio/quiet-risk" },
        ].map(c => (
          <Link key={c.label} href={c.href}>
            <div className="rounded-lg border border-white/[0.06] p-3 hover:border-white/[0.10] transition-colors cursor-pointer" style={{ background: "#0c1220" }}>
              <div className="text-[10px] text-slate-500 mb-1">{c.label}</div>
              <div className="text-xl font-bold" style={{ color: c.color }}>{c.value}</div>
              <div className="text-[9px] text-slate-600 mt-0.5">{c.sub}</div>
              <div className="flex items-center gap-1 mt-2 text-[9px]" style={{ color: c.color }}>
                <span>Drill down</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
