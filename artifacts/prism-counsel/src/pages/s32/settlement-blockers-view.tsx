import { useState } from "react";
import { Link } from "wouter";
import {
  Layers, AlertTriangle, XCircle, CheckCircle, Building2,
  FileText, Clock, ShieldAlert, ChevronRight, Eye
} from "lucide-react";

const BLOCKER_TYPE_COLORS: Record<string, string> = {
  missing_evidence: "#c45a4a",
  missing_records: "#c8953c",
  contradiction: "#c45a4a",
  insurer_silence: "#d4a054",
  insurer_hardening: "#c45a4a",
  no_fault_support: "#c8953c",
  recovery_lien: "#c45a4a",
  approval: "#8b7ac8",
  review_backlog: "#d4a054",
  venue_timing: "#8b7ac8",
  document_confidence: "#c8953c",
  export_safety: "#c45a4a",
};

const BLOCKER_TYPE_LABELS: Record<string, string> = {
  missing_evidence: "Missing Evidence",
  missing_records: "Missing Records",
  contradiction: "Contradiction",
  insurer_silence: "Insurer Silence",
  insurer_hardening: "Insurer Hardening",
  no_fault_support: "No-Fault Support",
  recovery_lien: "Recovery / Lien",
  approval: "Approval",
  review_backlog: "Review Backlog",
  venue_timing: "Venue Timing",
  document_confidence: "Doc Confidence",
  export_safety: "Export Safety",
};

const MY_BLOCKERS = [
  {
    id: 1,
    matterTitle: "Rodriguez v. National General",
    blockerType: "recovery_lien",
    title: "Medicaid AHCA — amount not confirmed",
    severity: "critical",
    isExternal: true,
    daysOpen: 47,
    nextBestAction: "Send certified escalation letter to AHCA",
    blocksWhat: "Settlement distribution, export",
    status: "open",
  },
  {
    id: 2,
    matterTitle: "Rodriguez v. National General",
    blockerType: "missing_evidence",
    title: "Wage verification outstanding",
    severity: "high",
    isExternal: false,
    daysOpen: 22,
    nextBestAction: "Final demand to employer with 10-day deadline",
    blocksWhat: "Demand packet send",
    status: "in_progress",
  },
  {
    id: 3,
    matterTitle: "Thompson v. Westfield",
    blockerType: "missing_evidence",
    title: "Surveillance footage not produced",
    severity: "critical",
    isExternal: true,
    daysOpen: 31,
    nextBestAction: "File motion for sanctions; depose facilities manager",
    blocksWhat: "Trial readiness, mediation",
    status: "open",
  },
  {
    id: 4,
    matterTitle: "Thompson v. Westfield",
    blockerType: "recovery_lien",
    title: "BCBS NJ reimbursement — pending",
    severity: "high",
    isExternal: true,
    daysOpen: 8,
    nextBestAction: "Contact plan administrator; get EOB statements",
    blocksWhat: "Mediation prep, readiness",
    status: "open",
  },
];

export default function SettlementBlockersView() {
  const [view, setView] = useState<"all" | "clearing">("all");

  const criticalCount = MY_BLOCKERS.filter(b => b.severity === "critical").length;
  const externalCount = MY_BLOCKERS.filter(b => b.isExternal).length;
  const internalCount = MY_BLOCKERS.filter(b => !b.isExternal).length;

  return (
    <div className="p-5 max-w-[900px] mx-auto space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#d4a054]" />
            <h1 className="text-base font-semibold text-slate-100">What's Blocking Settlement?</h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Your open settlement blockers — sorted by severity and clearing effort</p>
        </div>
        <Link href="/prism-counsel/settlement-blockers">
          <button className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-slate-500 border border-white/[0.06] hover:text-slate-300 hover:border-white/[0.12] transition-colors">
            Firm View <ChevronRight className="w-3 h-3" />
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
          <div className="text-[9px] text-slate-600 uppercase mb-1">Critical</div>
          <div className="text-2xl font-bold text-[#c45a4a]">{criticalCount}</div>
        </div>
        <div className="rounded border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
          <div className="text-[9px] text-slate-600 uppercase mb-1">External</div>
          <div className="text-2xl font-bold text-[#d4a054]">{externalCount}</div>
        </div>
        <div className="rounded border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
          <div className="text-[9px] text-slate-600 uppercase mb-1">Internal</div>
          <div className="text-2xl font-bold text-[#4a90b8]">{internalCount}</div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={() => setView("all")} className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${view === "all" ? "bg-[#d4a054]/20 text-[#d4a054]" : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"}`}>
          All Blockers
        </button>
        <button onClick={() => setView("clearing")} className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${view === "clearing" ? "bg-[#d4a054]/20 text-[#d4a054]" : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"}`}>
          What I Can Clear
        </button>
      </div>

      <div className="space-y-2">
        {MY_BLOCKERS
          .filter(b => view === "all" || (!b.isExternal))
          .sort((a, b) => {
            const sev = { critical: 0, high: 1, medium: 2, low: 3 };
            return (sev[a.severity as keyof typeof sev] ?? 3) - (sev[b.severity as keyof typeof sev] ?? 3);
          })
          .map(blocker => {
            const color = BLOCKER_TYPE_COLORS[blocker.blockerType] ?? "#6b7280";
            const severityColor = blocker.severity === "critical" ? "#c45a4a" : blocker.severity === "high" ? "#d4a054" : "#c8953c";
            return (
              <div key={blocker.id} className="rounded-lg border p-3 transition-colors" style={{ background: "#0c1220", borderColor: blocker.severity === "critical" ? "#c45a4a25" : "rgba(255,255,255,0.06)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-slate-100">{blocker.title}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: `${severityColor}18`, color: severityColor }}>
                        {blocker.severity.toUpperCase()}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${blocker.isExternal ? "bg-[#8b7ac8]/10 text-[#8b7ac8]" : "bg-white/[0.04] text-slate-500"}`}>
                        {blocker.isExternal ? "EXTERNAL" : "INTERNAL"}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mb-1.5">
                      <span className="text-[#4a90b8]">{BLOCKER_TYPE_LABELS[blocker.blockerType]}</span>
                      <span className="mx-1">·</span>
                      <span>{blocker.matterTitle}</span>
                    </div>
                    <div className="rounded border border-white/[0.04] p-2 mb-1.5" style={{ background: "#080c14" }}>
                      <div className="text-[9px] text-slate-600 uppercase mb-0.5">Next Action</div>
                      <p className="text-[10px] text-[#4a90b8] leading-relaxed">{blocker.nextBestAction}</p>
                    </div>
                    <div className="text-[9px] text-slate-500">
                      Blocks: <span className="text-slate-400">{blocker.blocksWhat}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs font-mono text-slate-500">{blocker.daysOpen}d</div>
                    <div className={`text-[9px] mt-0.5 ${blocker.status === "open" ? "text-[#d4a054]" : "text-[#4a90b8]"}`}>
                      {blocker.status.replace("_", " ")}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
