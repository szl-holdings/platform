import { useState } from "react";
import { Scale, TrendingUp, TrendingDown, Minus, AlertTriangle, Zap, Move, Clock, ArrowRight, ChevronRight, Building2, Users } from "lucide-react";
import { Link } from "wouter";

const PARTNER_CONTEXT = {
  name: "J. Lutar",
  date: new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
  totalMatters: 47,
  pendingApprovals: 4,
};

const TOP_PRESSURE_MATTERS = [
  { id: 1, title: "Rodriguez v. National General", pressure: 0.84, trend: "rising", urgentAction: "Insurer silent 28d — escalation needed today", daysToDeadline: 45 },
  { id: 2, title: "Thompson v. Westfield Ins.", pressure: 0.78, trend: "rising", urgentAction: "Demand must send in 8d before mediation window", daysToDeadline: 22 },
  { id: 3, title: "Martinez v. Allstate", pressure: 0.71, trend: "stable", urgentAction: "Coverage motion before April 15", daysToDeadline: 12 },
];

const SLIPPING_MATTERS = [
  { id: 6, title: "Lee v. State Farm", pressure: 0.58, change: +0.12, reason: "Discovery non-compliance; no mediation set", daysSilent: 14 },
  { id: 9, title: "Hernandez v. USAA", pressure: 0.52, change: +0.08, reason: "Client unresponsive 21d; no counter-offer", daysSilent: 21 },
];

const CLOSE_TO_MOVEMENT = [
  { id: 4, title: "Chen v. GEICO Direct", score: 0.89, type: "Insurer Softening", action: "Counter offer now — window closing", estimatedDays: 3 },
  { id: 1, title: "Rodriguez v. National General", score: 0.76, type: "Demand Ready", action: "Finalize and send demand this week", estimatedDays: 5 },
  { id: 2, title: "Thompson v. Westfield Ins.", score: 0.68, type: "Mediation Ready", action: "Complete brief; push lien", estimatedDays: 10 },
];

const BACKLOG_HOTSPOTS = [
  { label: "Pending Partner Approvals", count: 4, urgency: "critical", color: "#c45a4a", href: "/portfolio/approval-bottleneck" },
  { label: "Review Items Blocking Export", count: 5, urgency: "high", color: "#c8953c", href: "/portfolio/review-backlog" },
  { label: "Critical Lien Issues", count: 3, urgency: "high", color: "#c45a4a", href: "/portfolio/recovery-lien" },
  { label: "Approval Lag Decisions", count: 2, urgency: "critical", color: "#c45a4a", href: "/portfolio/approval-bottleneck" },
];

const INTERVENTION_LEVERAGE = [
  { id: 1, title: "Rodriguez settlement approval", leverageScore: 0.91, impact: "Carrier offer expires in 7d — $385K settlement at risk", action: "Approve settlement acceptance" },
  { id: 2, title: "Thompson demand send", leverageScore: 0.82, impact: "Mediation in 22d requires demand 14d prior", action: "Approve demand for send" },
  { id: 3, title: "Martinez expert engagement", leverageScore: 0.68, impact: "Expert disclosure 14d — without expert report, trial risk increases", action: "Approve expert fee" },
];

function TrendIcon({ t }: { t: string }) {
  if (t === "rising") return <TrendingUp className="w-3 h-3 text-[#c45a4a]" />;
  if (t === "falling") return <TrendingDown className="w-3 h-3 text-[#4a90b8]" />;
  return <Minus className="w-3 h-3 text-slate-500" />;
}

export default function PartnerLifeOsPage() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#d4a054]" />
            <h1 className="text-lg font-semibold text-slate-100">Partner Portfolio View</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20">PILOT TWO</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-[#c8953c]/10 text-[#c8953c]">DEMO DATA</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">What demands your attention, where you can make the biggest difference, and what is slipping</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-medium text-slate-300">{PARTNER_CONTEXT.name}</div>
          <div className="text-[10px] text-slate-500">{PARTNER_CONTEXT.date}</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active Matters", value: PARTNER_CONTEXT.totalMatters, color: "#d4a054", href: "/portfolio" },
          { label: "Pending Approvals", value: PARTNER_CONTEXT.pendingApprovals, color: "#c45a4a", href: "/portfolio/approval-bottleneck" },
          { label: "Close to Movement", value: CLOSE_TO_MOVEMENT.length, color: "#4a90b8", href: "/portfolio/movement-opportunity" },
          { label: "Slipping Quietly", value: SLIPPING_MATTERS.length, color: "#8b7ac8", href: "/portfolio/quiet-risk" },
        ].map(s => (
          <Link key={s.label} href={s.href}>
            <div className="rounded-lg border border-white/[0.06] p-3 hover:border-white/[0.10] cursor-pointer transition-colors" style={{ background: "#0c1220" }}>
              <div className="text-[10px] text-slate-500">{s.label}</div>
              <div className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#c45a4a]" />
              <h3 className="text-sm font-semibold text-slate-200">Top Pressure Matters</h3>
            </div>
            <Link href="/portfolio/pressure-board">
              <span className="text-[10px] text-slate-500 hover:text-[#d4a054] cursor-pointer flex items-center gap-1">All <ChevronRight className="w-3 h-3" /></span>
            </Link>
          </div>
          <div className="space-y-3">
            {TOP_PRESSURE_MATTERS.map(m => (
              <div key={m.id} className="py-2 border-b border-white/[0.04] last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <TrendIcon t={m.trend} />
                  <Link href={`/prism-counsel/matters/${m.id}`}><span className="text-[11px] font-medium text-slate-200 hover:text-[#d4a054] cursor-pointer">{m.title}</span></Link>
                  <span className="ml-auto text-[11px] font-mono text-[#c45a4a]">{Math.round(m.pressure * 100)}%</span>
                </div>
                <div className="text-[9px] text-[#c8953c]">{m.urgentAction}</div>
                <div className="text-[9px] text-slate-600 mt-0.5">SOL: {m.daysToDeadline}d remaining</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#4a90b8]" />
              <h3 className="text-sm font-semibold text-slate-200">Close to Movement</h3>
            </div>
            <Link href="/portfolio/movement-opportunity">
              <span className="text-[10px] text-slate-500 hover:text-[#d4a054] cursor-pointer flex items-center gap-1">All <ChevronRight className="w-3 h-3" /></span>
            </Link>
          </div>
          <div className="space-y-3">
            {CLOSE_TO_MOVEMENT.map(m => (
              <div key={m.id} className="py-2 border-b border-white/[0.04] last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link href={`/prism-counsel/matters/${m.id}`}><span className="text-[11px] font-medium text-slate-200 hover:text-[#d4a054] cursor-pointer">{m.title}</span></Link>
                  <span className="ml-auto text-[11px] font-mono text-[#4a90b8]">{Math.round(m.score * 100)}%</span>
                </div>
                <div className="text-[9px] text-[#4a90b8]">{m.type}</div>
                <div className="text-[9px] text-slate-400 mt-0.5">{m.action}</div>
                <div className="text-[9px] text-slate-600 mt-0.5">Act within ~{m.estimatedDays}d</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-[#8b7ac8]" />
                <h3 className="text-sm font-semibold text-slate-200">Slipping Matters</h3>
              </div>
              <Link href="/portfolio/quiet-risk">
                <span className="text-[10px] text-slate-500 hover:text-[#d4a054] cursor-pointer flex items-center gap-1">All <ChevronRight className="w-3 h-3" /></span>
              </Link>
            </div>
            <div className="space-y-2">
              {SLIPPING_MATTERS.map(m => (
                <div key={m.id} className="py-1.5 border-b border-white/[0.04] last:border-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/prism-counsel/matters/${m.id}`}><span className="text-[11px] text-slate-200 hover:text-[#d4a054] cursor-pointer">{m.title}</span></Link>
                    <span className="text-[10px] font-mono text-[#c8953c] ml-auto">+{Math.round(m.change * 100)}%</span>
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{m.reason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-[#d4a054]" />
            <h3 className="text-sm font-semibold text-slate-200">Backlog Hotspots</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {BACKLOG_HOTSPOTS.map(b => (
              <Link key={b.label} href={b.href}>
                <div className="rounded border border-white/[0.06] p-2.5 hover:border-white/[0.10] cursor-pointer transition-colors" style={{ background: "#080c14" }}>
                  <div className="text-xl font-bold" style={{ color: b.color }}>{b.count}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{b.label}</div>
                  <div className="flex items-center gap-1 mt-1 text-[8px]" style={{ color: b.color }}><ArrowRight className="w-2 h-2" />View</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <div className="flex items-center gap-2 mb-3">
            <Scale className="w-4 h-4 text-[#8b7ac8]" />
            <h3 className="text-sm font-semibold text-slate-200">Where Intervention Matters Most</h3>
          </div>
          <div className="space-y-2">
            {INTERVENTION_LEVERAGE.map(item => (
              <div key={item.id} className="py-2 border-b border-white/[0.04] last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-medium text-slate-200">{item.title}</span>
                  <span className="ml-auto text-[10px] font-mono text-[#8b7ac8]">{Math.round(item.leverageScore * 100)}%</span>
                </div>
                <div className="text-[9px] text-slate-500 mb-1">{item.impact}</div>
                <button className="flex items-center gap-1 text-[9px] text-[#d4a054] hover:text-[#d4a054]/80">
                  <ArrowRight className="w-2.5 h-2.5" />{item.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
