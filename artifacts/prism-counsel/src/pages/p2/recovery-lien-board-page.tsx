import { useState } from "react";
import { DollarSign, TrendingDown, ChevronDown, ChevronUp, ArrowRight, AlertTriangle } from "lucide-react";

const DEMO_LIENS = [
  { id: 301, matterId: 2, matterTitle: "Thompson v. Westfield Ins.", lienHolder: "Medicare", lienType: "medicare", assertedAmount: 62400, negotiatedAmount: null, status: "negotiating", daysPending: 41, dragScore: 0.85, blocksSettlement: true, nextAction: "Request waiver — settlement < policy limits", notes: "BCRC contacted Mar 12; no response" },
  { id: 302, matterId: 1, matterTitle: "Rodriguez v. National General", lienHolder: "St. Luke's Hospital", lienType: "hospital", assertedAmount: 38200, negotiatedAmount: 22000, status: "negotiating", daysPending: 28, dragScore: 0.72, blocksSettlement: true, nextAction: "Counter at $18K — hospital shown flexibility", notes: "Ongoing negotiation; verbal indication of resolution" },
  { id: 303, matterId: 3, matterTitle: "Martinez v. Allstate", lienHolder: "Medicaid NY State", lienType: "medicaid", assertedAmount: 29800, negotiatedAmount: null, status: "asserted", daysPending: 55, dragScore: 0.68, blocksSettlement: true, nextAction: "File reduction request citing case value ceiling", notes: "State MMCO not yet engaged" },
  { id: 304, matterId: 7, matterTitle: "Garcia v. Travelers", lienHolder: "ERISA Plan — Employer", lienType: "erisa", assertedAmount: 15600, negotiatedAmount: null, status: "disputed", daysPending: 19, dragScore: 0.45, blocksSettlement: false, nextAction: "ERISA preemption analysis needed", notes: "Employer plan claims full reimbursement" },
];

const LIEN_TYPE_META: Record<string, { label: string; color: string }> = {
  medicare: { label: "Medicare", color: "#c45a4a" },
  medicaid: { label: "Medicaid", color: "#c8953c" },
  hospital: { label: "Hospital", color: "#d4a054" },
  erisa: { label: "ERISA", color: "#8b7ac8" },
  health_insurance: { label: "Health Ins", color: "#4a90b8" },
};

const STATUS_COLOR: Record<string, string> = {
  asserted: "#c45a4a",
  negotiating: "#c8953c",
  disputed: "#8b7ac8",
  resolved: "#4a90b8",
};

function LienRow({ item }: { item: typeof DEMO_LIENS[0] }) {
  const [expanded, setExpanded] = useState(false);
  const tm = LIEN_TYPE_META[item.lienType];
  const sc = STATUS_COLOR[item.status];
  const pct = Math.round(item.dragScore * 100);

  return (
    <div className="rounded border border-white/[0.06] overflow-hidden" style={{ background: "#080c14" }}>
      <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/[0.02]" onClick={() => setExpanded(!expanded)}>
        <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: `${sc}15`, color: sc }}>{pct}%</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-200">{item.matterTitle}</span>
            {tm && <span className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: `${tm.color}15`, color: tm.color }}>{tm.label}</span>}
            {item.blocksSettlement && <AlertTriangle className="w-3 h-3 text-[#c45a4a]" />}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-slate-500">{item.lienHolder}</span>
            <span className="text-[10px] text-slate-600">•</span>
            <span className="text-[10px] text-slate-500">${(item.assertedAmount / 1000).toFixed(0)}K asserted</span>
            {item.negotiatedAmount && <span className="text-[10px] text-slate-500">→ ${(item.negotiatedAmount / 1000).toFixed(0)}K negotiated</span>}
            <span className="text-[10px] text-slate-600">•</span>
            <span className="text-[10px] text-slate-500">{item.daysPending}d pending</span>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
      </div>
      {expanded && (
        <div className="border-t border-white/[0.06] p-3 grid grid-cols-3 gap-4">
          <div>
            <div className="text-[9px] text-slate-600 uppercase mb-1">Notes</div>
            <div className="text-[10px] text-slate-400 leading-relaxed">{item.notes}</div>
            <div className="mt-2 text-[9px] text-slate-600 uppercase mb-1">Next Action</div>
            <div className="text-[11px] text-slate-300 leading-relaxed">{item.nextAction}</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-600 uppercase mb-1">Drag Score</div>
            <div className="text-2xl font-bold" style={{ color: sc }}>{pct}%</div>
            <div className="w-full h-1.5 bg-white/[0.06] rounded-full mt-1">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: sc }} />
            </div>
            <div className="text-[9px] text-slate-500 mt-1">{item.blocksSettlement ? "Blocks settlement" : "Does not directly block"}</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-600 uppercase mb-1">Actions</div>
            {["Prioritize recovery review", "Request partner update", "Escalate matter"].map(a => (
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

export default function RecoveryLienBoardPage() {
  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-[#d4a054]" />
          <h1 className="text-lg font-semibold text-slate-100">Recovery / Lien Drag Board</h1>
          <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-[#c8953c]/10 text-[#c8953c]">DEMO DATA</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">Matters where lien resolution is dragging settlement — Medicare, Medicaid, hospital, ERISA</p>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Open Liens", count: DEMO_LIENS.length, color: "#d4a054" },
          { label: "Blocks Settlement", count: DEMO_LIENS.filter(l => l.blocksSettlement).length, color: "#c45a4a" },
          { label: "Avg Pending Days", count: Math.round(DEMO_LIENS.reduce((s, l) => s + l.daysPending, 0) / DEMO_LIENS.length), color: "#c8953c" },
          { label: "Total Asserted", count: `$${(DEMO_LIENS.reduce((s, l) => s + l.assertedAmount, 0) / 1000).toFixed(0)}K`, color: "#8b7ac8" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
            <div className="text-[10px] text-slate-500 mb-1">{s.label}</div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {DEMO_LIENS.map(item => <LienRow key={item.id} item={item} />)}
      </div>
    </div>
  );
}
