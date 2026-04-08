import { useState } from "react";
import { Building2, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";

const DEMO_INSURER_COHORTS = [
  { id: 1, carrier: "National General", matterCount: 8, avgSilenceDays: 24.2, avgResponseRating: 0.32, reserveIncreaseDetected: 5, offerMovement: "stalling", dragScore: 0.83, topMatters: ["Rodriguez v. National General", "Kim v. National General"], tactic: "Silent adjuster rotation, reserve increases without communication" },
  { id: 2, carrier: "Westfield Insurance", matterCount: 5, avgSilenceDays: 18.5, avgResponseRating: 0.45, reserveIncreaseDetected: 2, offerMovement: "minimal", dragScore: 0.69, topMatters: ["Thompson v. Westfield"], tactic: "Low offers, slow documentation responses" },
  { id: 3, carrier: "Allstate", matterCount: 11, avgSilenceDays: 9.4, avgResponseRating: 0.62, reserveIncreaseDetected: 1, offerMovement: "normal", dragScore: 0.41, topMatters: ["Martinez v. Allstate"], tactic: "Generally responsive; coverage disputes are primary friction" },
  { id: 4, carrier: "State Farm", matterCount: 7, avgSilenceDays: 7.2, avgResponseRating: 0.70, reserveIncreaseDetected: 0, offerMovement: "active", dragScore: 0.28, topMatters: ["Lee v. State Farm"], tactic: "Active negotiators; discovery compliance is main gap" },
  { id: 5, carrier: "Progressive", matterCount: 9, avgSilenceDays: 14.1, avgResponseRating: 0.55, reserveIncreaseDetected: 3, offerMovement: "minimal", dragScore: 0.58, topMatters: ["Johnson v. Progressive"], tactic: "Trial-happy posture; discovery pushback common" },
];

const DRAG_COLOR = (score: number) => score > 0.7 ? "#c45a4a" : score > 0.5 ? "#c8953c" : score > 0.3 ? "#d4a054" : "#4a90b8";

function TrendIcon({ t }: { t: string }) {
  if (t === "rising") return <TrendingUp className="w-3 h-3 text-[#c45a4a]" />;
  if (t === "stalling" || t === "minimal") return <Minus className="w-3 h-3 text-[#c8953c]" />;
  if (t === "normal" || t === "active") return <TrendingDown className="w-3 h-3 text-[#4a90b8]" />;
  return <Minus className="w-3 h-3 text-slate-500" />;
}

function InsurerRow({ cohort }: { cohort: typeof DEMO_INSURER_COHORTS[0] }) {
  const [expanded, setExpanded] = useState(false);
  const dc = DRAG_COLOR(cohort.dragScore);
  const pct = Math.round(cohort.dragScore * 100);

  return (
    <div className="rounded border border-white/[0.06] overflow-hidden" style={{ background: "#080c14" }}>
      <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/[0.02]" onClick={() => setExpanded(!expanded)}>
        <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: `${dc}15`, color: dc }}>{pct}%</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-200">{cohort.carrier}</span>
            <TrendIcon t={cohort.offerMovement} />
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-slate-500">{cohort.matterCount} matters</span>
            <span className="text-[10px] text-slate-600">•</span>
            <span className="text-[10px] text-slate-500">Avg silence: {cohort.avgSilenceDays}d</span>
            <span className="text-[10px] text-slate-600">•</span>
            <span className="text-[10px] text-slate-500">Offer: {cohort.offerMovement}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-white/[0.06] rounded-full">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: dc }} />
          </div>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
        </div>
      </div>
      {expanded && (
        <div className="border-t border-white/[0.06] p-3 grid grid-cols-3 gap-4">
          <div>
            <div className="text-[9px] text-slate-600 uppercase mb-1">Carrier Behavior Pattern</div>
            <div className="text-[10px] text-slate-400 leading-relaxed">{cohort.tactic}</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-600 uppercase mb-1">Top Affected Matters</div>
            {cohort.topMatters.map((m, i) => <div key={i} className="text-[10px] text-slate-400">• {m}</div>)}
            <div className="mt-2 text-[9px] text-slate-600">Reserve increases: {cohort.reserveIncreaseDetected}</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-600 uppercase mb-1">Actions</div>
            {["Escalate insurer silence", "Send demand to carrier", "View all matters"].map(a => (
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

export default function InsurerPressureBoardPage() {
  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#c8953c]" />
          <h1 className="text-lg font-semibold text-slate-100">Insurer Pressure Board</h1>
          <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-[#c8953c]/10 text-[#c8953c]">DEMO DATA</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">Which insurer cohorts are causing the most drag across the portfolio — ranked by pressure, silence, and offer behavior</p>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active Carriers", count: DEMO_INSURER_COHORTS.length, color: "#d4a054" },
          { label: "High Drag Carriers", count: DEMO_INSURER_COHORTS.filter(c => c.dragScore > 0.6).length, color: "#c45a4a" },
          { label: "Avg Silence Days", count: (DEMO_INSURER_COHORTS.reduce((s, c) => s + c.avgSilenceDays, 0) / DEMO_INSURER_COHORTS.length).toFixed(1), color: "#c8953c" },
          { label: "Reserve Increases", count: DEMO_INSURER_COHORTS.reduce((s, c) => s + c.reserveIncreaseDetected, 0), color: "#8b7ac8" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
            <div className="text-[10px] text-slate-500 mb-1">{s.label}</div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {DEMO_INSURER_COHORTS.map(c => <InsurerRow key={c.id} cohort={c} />)}
      </div>
    </div>
  );
}
