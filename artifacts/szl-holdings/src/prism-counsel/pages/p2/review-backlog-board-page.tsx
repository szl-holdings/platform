import { useState } from "react";
import { ClipboardList, Clock, AlertTriangle, ChevronDown, ChevronUp, ArrowRight, Users } from "lucide-react";

const DEMO_BACKLOG = [
  { id: 101, title: "Rodriguez — Demand section AI draft", type: "draft_review", age: 4.2, priority: "critical", confidence: 0.82, matterId: 1, matterTitle: "Rodriguez v. National General", reviewer: "S. Chen", blocksExport: true, blocksPartner: true, riskIfDelayed: "Insurer deadline pressure — offer window closes in 8d" },
  { id: 102, title: "Thompson — Medicare chronology contradictions", type: "contradiction_review", age: 1.8, priority: "high", confidence: 0.61, matterId: 2, matterTitle: "Thompson v. Westfield", reviewer: "R. Patel", blocksExport: true, blocksPartner: false, riskIfDelayed: "Chronology error in demand could expose damages claim" },
  { id: 103, title: "Martinez — Coverage memo AI draft", type: "draft_review", age: 6.1, priority: "high", confidence: 0.78, matterId: 3, matterTitle: "Martinez v. Allstate", reviewer: "Unassigned", blocksExport: false, blocksPartner: true, riskIfDelayed: "Coverage motion deadline approaching 12d" },
  { id: 104, title: "Rodriguez — Lost wage extraction (low conf)", type: "low_confidence", age: 3.0, priority: "medium", confidence: 0.44, matterId: 1, matterTitle: "Rodriguez v. National General", reviewer: "J. Kim", blocksExport: true, blocksPartner: false, riskIfDelayed: "Wage figure error flows into demand calculation" },
  { id: 105, title: "Johnson — Expert report section", type: "draft_review", age: 0.5, priority: "medium", confidence: 0.87, matterId: 5, matterTitle: "Johnson v. Progressive", reviewer: "A. Cruz", blocksExport: false, blocksPartner: false, riskIfDelayed: "Expert disclosure deadline in 14d" },
  { id: 106, title: "Lee — Interrogatory draft responses", type: "draft_review", age: 2.3, priority: "high", confidence: 0.80, matterId: 6, matterTitle: "Lee v. State Farm", reviewer: "K. Roberts", blocksExport: false, blocksPartner: false, riskIfDelayed: "Responses overdue — opposing counsel may seek sanctions" },
];

const TYPE_META: Record<string, { label: string; color: string }> = {
  draft_review: { label: "Draft Review", color: "#4a90b8" },
  contradiction_review: { label: "Contradiction", color: "#c45a4a" },
  low_confidence: { label: "Low Confidence", color: "#c8953c" },
};

const PRIORITY_COLOR: Record<string, string> = { critical: "#c45a4a", high: "#c8953c", medium: "#d4a054" };

function BacklogRow({ item }: { item: typeof DEMO_BACKLOG[0] }) {
  const [expanded, setExpanded] = useState(false);
  const tm = TYPE_META[item.type];
  const pc = PRIORITY_COLOR[item.priority];

  return (
    <div className="rounded border border-white/[0.06] overflow-hidden" style={{ background: "#080c14" }}>
      <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/[0.02]" onClick={() => setExpanded(!expanded)}>
        <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: `${pc}15`, color: pc }}>{item.age.toFixed(1)}d</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-200">{item.title}</span>
            {tm && <span className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: `${tm.color}15`, color: tm.color }}>{tm.label}</span>}
            {item.blocksExport && <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#c45a4a]/10 text-[#c45a4a]">Blocks Export</span>}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-slate-500">{item.matterTitle}</span>
            <span className="text-[10px] text-slate-600">•</span>
            <span className="text-[10px] text-slate-500">Reviewer: {item.reviewer}</span>
            <span className="text-[10px] text-slate-600">•</span>
            <span className="text-[10px] text-slate-500">Conf: {Math.round(item.confidence * 100)}%</span>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
      </div>
      {expanded && (
        <div className="border-t border-white/[0.06] p-3 grid grid-cols-2 gap-4">
          <div>
            <div className="text-[9px] text-slate-600 uppercase mb-1">Risk If Delayed</div>
            <div className="text-[11px] text-[#c8953c]">{item.riskIfDelayed}</div>
            <div className="flex items-center gap-2 mt-2">
              {item.blocksExport && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#c45a4a]/10 text-[#c45a4a]">Blocks export</span>}
              {item.blocksPartner && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#8b7ac8]/10 text-[#8b7ac8]">Partner waiting</span>}
            </div>
          </div>
          <div>
            <div className="text-[9px] text-slate-600 uppercase mb-1">Actions</div>
            <div className="space-y-1">
              {["Reassign reviewer", "Escalate to partner", "Mark urgent"].map(a => (
                <button key={a} className="w-full text-left px-2 py-1 rounded text-[10px] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors flex items-center gap-1">
                  <ArrowRight className="w-2.5 h-2.5" />{a}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReviewBacklogBoardPage() {
  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-[#c8953c]" />
          <h1 className="text-lg font-semibold text-slate-100">Review Backlog Board</h1>
          <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-[#c8953c]/10 text-[#c8953c]">DEMO DATA</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">AI-generated work awaiting attorney or paralegal review — ranked by risk and downstream impact</p>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Pending", count: DEMO_BACKLOG.length, color: "#d4a054" },
          { label: "Critical Priority", count: DEMO_BACKLOG.filter(i => i.priority === "critical").length, color: "#c45a4a" },
          { label: "Blocks Export", count: DEMO_BACKLOG.filter(i => i.blocksExport).length, color: "#c8953c" },
          { label: "Avg Age (days)", count: (DEMO_BACKLOG.reduce((s, i) => s + i.age, 0) / DEMO_BACKLOG.length).toFixed(1), color: "#4a90b8" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
            <div className="text-[10px] text-slate-500 mb-1">{s.label}</div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {DEMO_BACKLOG.map(item => <BacklogRow key={item.id} item={item} />)}
      </div>
    </div>
  );
}
