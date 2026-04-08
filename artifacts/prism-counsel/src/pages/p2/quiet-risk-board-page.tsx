import { useState } from "react";
import { Eye, TrendingDown, Minus, ChevronDown, ChevronUp, ArrowRight, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

const DEMO_QUIET_RISK = [
  { id: 6, matterId: 6, title: "Lee v. State Farm", quietRiskScore: 0.81, deterioratingRate: "fast", daysSinceActivity: 14, lastSignificantEvent: "Discovery responses sent Mar 19", hiddenRisks: ["SOL in 90 days — no mediation scheduled", "No contact from adjuster 21d", "Expert disclosure date unset"], recommendedAction: "Set mediation date; engage adjuster immediately", owner: "K. Roberts", confidence: 0.78 },
  { id: 7, matterId: 7, title: "Garcia v. Travelers", quietRiskScore: 0.67, deterioratingRate: "moderate", daysSinceActivity: 8, lastSignificantEvent: "Records received Mar 26", hiddenRisks: ["Coverage limit not confirmed", "No damages update in 45d"], recommendedAction: "Confirm policy limits; update damages register", owner: "T. Nguyen", confidence: 0.72 },
  { id: 8, matterId: 8, title: "Wilson v. Liberty Mutual", quietRiskScore: 0.58, deterioratingRate: "slow", daysSinceActivity: 5, lastSignificantEvent: "Mediation brief started Apr 1", hiddenRisks: ["No new evidence since Jan", "Recovery lien unaddressed"], recommendedAction: "Push lien; add evidence checklist review", owner: "L. Davis", confidence: 0.69 },
  { id: 9, matterId: 9, title: "Hernandez v. USAA", quietRiskScore: 0.52, deterioratingRate: "slow", daysSinceActivity: 21, lastSignificantEvent: "Initial demand Jan 14", hiddenRisks: ["No counter-offer from carrier", "Plaintiff non-responsive 3 weeks"], recommendedAction: "Client contact; file motion if no response", owner: "Unassigned", confidence: 0.65 },
];

const RATE_META: Record<string, { label: string; color: string }> = {
  fast: { label: "Fast Deterioration", color: "#c45a4a" },
  moderate: { label: "Moderate", color: "#c8953c" },
  slow: { label: "Slow", color: "#d4a054" },
};

const QR_COLOR = (score: number) => score > 0.7 ? "#c45a4a" : score > 0.5 ? "#c8953c" : "#d4a054";

function QuietRiskRow({ item }: { item: typeof DEMO_QUIET_RISK[0] }) {
  const [expanded, setExpanded] = useState(false);
  const rate = RATE_META[item.deterioratingRate];
  const color = QR_COLOR(item.quietRiskScore);
  const pct = Math.round(item.quietRiskScore * 100);

  return (
    <div className="rounded border border-white/[0.06] overflow-hidden" style={{ background: "#080c14" }}>
      <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/[0.02]" onClick={() => setExpanded(!expanded)}>
        <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: `${color}15`, color }}>{pct}%</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/prism-counsel/matters/${item.matterId}`}><span className="text-xs font-medium text-slate-200 hover:text-[#d4a054]">{item.title}</span></Link>
            {rate && <span className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: `${rate.color}15`, color: rate.color }}>{rate.label}</span>}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-slate-500">Silent {item.daysSinceActivity}d</span>
            <span className="text-[10px] text-slate-600">•</span>
            <span className="text-[10px] text-slate-500">{item.owner}</span>
            <span className="text-[10px] text-slate-600">•</span>
            <span className="text-[10px] text-slate-500">{item.hiddenRisks.length} hidden risks</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrendingDown className="w-3 h-3 text-[#c8953c]" />
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
        </div>
      </div>
      {expanded && (
        <div className="border-t border-white/[0.06] p-3 grid grid-cols-3 gap-4">
          <div>
            <div className="text-[9px] text-slate-600 uppercase mb-1">Hidden Risks</div>
            <div className="space-y-1">
              {item.hiddenRisks.map((r, i) => <div key={i} className="text-[10px] text-[#c8953c]">⚠ {r}</div>)}
            </div>
            <div className="mt-2 text-[9px] text-slate-600">Last event: {item.lastSignificantEvent}</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-600 uppercase mb-1">Recommended Action</div>
            <div className="text-[11px] text-slate-300 leading-relaxed">{item.recommendedAction}</div>
            <div className="mt-2 text-[9px] text-slate-500">Confidence: {Math.round(item.confidence * 100)}%</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-600 uppercase mb-1">Actions</div>
            {["Request partner update memo", "Escalate matter", "Assign reviewer"].map(a => (
              <button key={a} className="w-full text-left px-2 py-1 rounded text-[10px] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors flex items-center gap-1">
                <ArrowRight className="w-2.5 h-2.5" />{a}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuietRiskBoardPage() {
  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-[#8b7ac8]" />
          <h1 className="text-lg font-semibold text-slate-100">Quiet Risk Board</h1>
          <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-[#c8953c]/10 text-[#c8953c]">DEMO DATA</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">Matters silently deteriorating — low apparent pressure but hidden risks compounding below the surface</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Quiet Risk Matters", count: DEMO_QUIET_RISK.length, color: "#8b7ac8" },
          { label: "Fast Deterioration", count: DEMO_QUIET_RISK.filter(i => i.deterioratingRate === "fast").length, color: "#c45a4a" },
          { label: "Avg Days Silent", count: Math.round(DEMO_QUIET_RISK.reduce((s, i) => s + i.daysSinceActivity, 0) / DEMO_QUIET_RISK.length), color: "#c8953c" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
            <div className="text-[10px] text-slate-500 mb-1">{s.label}</div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {DEMO_QUIET_RISK.map(item => <QuietRiskRow key={item.id} item={item} />)}
      </div>
    </div>
  );
}
