import { useState } from "react";
import { Move, TrendingUp, ChevronDown, ChevronUp, ArrowRight, Zap } from "lucide-react";
import { Link } from "wouter";

const DEMO_OPPORTUNITIES = [
  { id: 1, matterId: 4, title: "Chen v. GEICO Direct", opportunityScore: 0.89, opportunityType: "insurer_softening", drivers: ["Adjuster change detected", "New reserve pattern — downward", "Settlement offer increased 12% last round"], recommendedAction: "Propose counter — close the gap now", estimatedDays: 3, confidence: 0.85, owner: "K. Roberts", settledInRange: "$340K–$360K" },
  { id: 2, matterId: 1, title: "Rodriguez v. National General", opportunityScore: 0.76, opportunityType: "demand_ready", drivers: ["All medical records received", "Damages 94% verified", "Expert report filed"], recommendedAction: "Finalize and send demand this week", estimatedDays: 5, confidence: 0.80, owner: "S. Chen", settledInRange: "$380K–$420K" },
  { id: 3, matterId: 2, title: "Thompson v. Westfield Ins.", opportunityScore: 0.68, opportunityType: "mediation_ready", drivers: ["Mediation booked Apr 22", "Brief draft 80% complete", "Lien negotiation active"], recommendedAction: "Complete mediation brief; push lien resolution", estimatedDays: 10, confidence: 0.75, owner: "R. Patel", settledInRange: "$480K–$530K" },
  { id: 4, matterId: 8, title: "Wilson v. Liberty Mutual", opportunityScore: 0.61, opportunityType: "follow_up_effective", drivers: ["Last follow-up triggered offer increase", "Adjuster responsive pattern emerging"], recommendedAction: "Schedule follow-up call; escalate with data", estimatedDays: 7, confidence: 0.70, owner: "L. Davis", settledInRange: "$220K–$260K" },
  { id: 5, matterId: 7, title: "Garcia v. Travelers", opportunityScore: 0.55, opportunityType: "evidence_complete", drivers: ["All records received this week", "No outstanding discovery"], recommendedAction: "Update demand; trigger settlement discussion", estimatedDays: 14, confidence: 0.68, owner: "T. Nguyen", settledInRange: "$195K–$230K" },
];

const OPP_META: Record<string, { label: string; color: string }> = {
  insurer_softening: { label: "Insurer Softening", color: "#4a90b8" },
  demand_ready: { label: "Demand Ready", color: "#d4a054" },
  mediation_ready: { label: "Mediation Ready", color: "#8b7ac8" },
  follow_up_effective: { label: "Follow-Up Effective", color: "#4a90b8" },
  evidence_complete: { label: "Evidence Complete", color: "#4a90b8" },
};

const OPP_COLOR = (score: number) => score > 0.8 ? "#4a90b8" : score > 0.6 ? "#d4a054" : "#c8953c";

function OppRow({ item }: { item: typeof DEMO_OPPORTUNITIES[0] }) {
  const [expanded, setExpanded] = useState(false);
  const meta = OPP_META[item.opportunityType];
  const color = OPP_COLOR(item.opportunityScore);
  const pct = Math.round(item.opportunityScore * 100);

  return (
    <div className="rounded border border-white/[0.06] overflow-hidden" style={{ background: "#080c14" }}>
      <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/[0.02]" onClick={() => setExpanded(!expanded)}>
        <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: `${color}15`, color }}>{pct}%</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/prism-counsel/matters/${item.matterId}`}><span className="text-xs font-medium text-slate-200 hover:text-[#d4a054]">{item.title}</span></Link>
            {meta && <span className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: `${meta.color}15`, color: meta.color }}>{meta.label}</span>}
            <Zap className="w-3 h-3 text-[#4a90b8]" />
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-slate-500">{item.owner}</span>
            <span className="text-[10px] text-slate-600">•</span>
            <span className="text-[10px] text-slate-500">Act within ~{item.estimatedDays}d</span>
            <span className="text-[10px] text-slate-600">•</span>
            <span className="text-[10px] text-slate-500">{item.settledInRange}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3 h-3 text-[#4a90b8]" />
          <div className="w-20 h-1.5 bg-white/[0.06] rounded-full">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
          </div>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
        </div>
      </div>
      {expanded && (
        <div className="border-t border-white/[0.06] p-3 grid grid-cols-3 gap-4">
          <div>
            <div className="text-[9px] text-slate-600 uppercase mb-1">Why Now</div>
            <div className="space-y-1">
              {item.drivers.map((d, i) => <div key={i} className="text-[10px] text-slate-400">• {d}</div>)}
            </div>
          </div>
          <div>
            <div className="text-[9px] text-slate-600 uppercase mb-1">Recommended Action</div>
            <div className="text-[11px] text-slate-300 leading-relaxed">{item.recommendedAction}</div>
            <div className="mt-2 text-[9px] text-slate-500">Confidence: {Math.round(item.confidence * 100)}%</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-600 uppercase mb-1">Actions</div>
            {["Request movement memo", "Escalate to partner", "Schedule follow-up"].map(a => (
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

export default function MovementOpportunityBoardPage() {
  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Move className="w-5 h-5 text-[#4a90b8]" />
          <h1 className="text-lg font-semibold text-slate-100">Movement Opportunity Board</h1>
          <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-[#c8953c]/10 text-[#c8953c]">DEMO DATA</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">Matters closest to meaningful movement — insurer softening, evidence complete, mediation ready, effective follow-up patterns</p>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "High Opportunity", count: DEMO_OPPORTUNITIES.filter(o => o.opportunityScore > 0.75).length, color: "#4a90b8" },
          { label: "Act Within 7 Days", count: DEMO_OPPORTUNITIES.filter(o => o.estimatedDays <= 7).length, color: "#d4a054" },
          { label: "Insurer Softening", count: DEMO_OPPORTUNITIES.filter(o => o.opportunityType === "insurer_softening").length, color: "#c8953c" },
          { label: "Total $ In Range", count: "$1.63M", color: "#8b7ac8" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
            <div className="text-[10px] text-slate-500 mb-1">{s.label}</div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {DEMO_OPPORTUNITIES.map(o => <OppRow key={o.id} item={o} />)}
      </div>
    </div>
  );
}
