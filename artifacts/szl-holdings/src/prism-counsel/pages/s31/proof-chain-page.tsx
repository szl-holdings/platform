import { useState } from "react";
import { Shield, Link2, CheckCircle, Clock, XCircle, Eye, FileText, Lock } from "lucide-react";
import { useProofChainPending } from "../../hooks/use-prism-s31";

const DEMO_ENTRIES = [
  { id: 1, outputType: "copilot_answer", outputHash: "a3f2c1...8b7e", sourceReferences: [{ type: "communication", id: 42 }, { type: "offer", id: 7 }], sourceClass: "internal", extractionConfidence: 0.92, modelLane: "reasoning", modelProvider: "anthropic", reviewState: "approved", approvalState: "approved", exportSafe: true, createdAt: "2026-04-03T09:30:00Z", outputContent: "Insurer communications summary for Rodriguez v. National General" },
  { id: 2, outputType: "extraction", outputHash: "b8d4e2...1c3a", sourceReferences: [{ type: "document", id: 18 }], sourceClass: "internal", extractionConfidence: 0.88, modelLane: "extraction", modelProvider: "openai", reviewState: "approved", approvalState: "pending", exportSafe: false, createdAt: "2026-04-03T08:15:00Z", outputContent: "Medical record extraction — Dr. Martinez treatment notes" },
  { id: 3, outputType: "forecast", outputHash: "c9e5f3...2d4b", sourceReferences: [{ type: "pressure_score", id: 12 }, { type: "data_product", id: 3 }], sourceClass: "computed", extractionConfidence: 0.75, modelLane: "forecast", modelProvider: "anthropic", reviewState: "pending_review", approvalState: "pending", exportSafe: false, createdAt: "2026-04-02T16:00:00Z", outputContent: "Settlement range forecast update — Rodriguez matter" },
  { id: 4, outputType: "chronology_section", outputHash: "d0f6g4...3e5c", sourceReferences: [{ type: "document", id: 14 }, { type: "document", id: 15 }, { type: "communication", id: 38 }], sourceClass: "internal", extractionConfidence: 0.85, modelLane: "extraction", modelProvider: "openai", reviewState: "reviewed", approvalState: "approved", exportSafe: true, createdAt: "2026-04-02T11:00:00Z", outputContent: "Chronology section: January 2026 treatment timeline" },
  { id: 5, outputType: "demand_section", outputHash: "e1g7h5...4f6d", sourceReferences: [{ type: "document", id: 20 }, { type: "damages", id: 5 }], sourceClass: "internal", extractionConfidence: 0.90, modelLane: "reasoning", modelProvider: "anthropic", reviewState: "pending_review", approvalState: "pending", exportSafe: false, createdAt: "2026-04-01T14:30:00Z", outputContent: "Demand letter section — damages summary with medical specials" },
  { id: 6, outputType: "copilot_answer", outputHash: "f2h8i6...5g7e", sourceReferences: [{ type: "worldline_signal", id: 23 }], sourceClass: "worldline", extractionConfidence: 0.68, modelLane: "reasoning", modelProvider: "anthropic", reviewState: "rejected", approvalState: "pending", exportSafe: false, createdAt: "2026-04-01T10:00:00Z", outputContent: "Weather context analysis — incident date conditions" },
];

const stateColors: Record<string, string> = {
  approved: "#4a90b8", reviewed: "#4a90b8", pending_review: "#d4a054", pending: "#d4a054", rejected: "#c45a4a", not_reviewed: "#64748b",
};

export default function ProofChainPage() {
  const { data: pendingData } = useProofChainPending();
  const [filter, setFilter] = useState<string>("all");

  const entries = pendingData?.pending?.length > 0 ? pendingData.pending : DEMO_ENTRIES;
  const isDemo = !pendingData?.pending?.length;
  const filtered = filter === "all" ? entries : entries.filter((e: any) => e.reviewState === filter || e.approvalState === filter);

  const stats = {
    total: entries.length,
    exportSafe: entries.filter((e: any) => e.exportSafe).length,
    pendingReview: entries.filter((e: any) => e.reviewState === "pending_review").length,
    approved: entries.filter((e: any) => e.approvalState === "approved").length,
  };

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#4a90b8]" />
          <h1 className="text-lg font-semibold text-slate-100">Proof Chain</h1>
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isDemo ? "bg-[#d4a054]/10 text-[#d4a054]" : "bg-[#4a90b8]/10 text-[#4a90b8]"}`}>{isDemo ? "DEMO" : "LIVE"}</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">SHA-256 hash integrity, source tracing, review/approval states, export safety</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Entries", value: stats.total, color: "#4a90b8" },
          { label: "Export Safe", value: stats.exportSafe, color: "#4a90b8" },
          { label: "Pending Review", value: stats.pendingReview, color: "#d4a054" },
          { label: "Approved", value: stats.approved, color: "#4a90b8" },
        ].map((s, i) => (
          <div key={i} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
            <div className="text-[10px] text-slate-500 mb-1">{s.label}</div>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-200">Chain Entries</h3>
          <div className="flex gap-1">
            {["all", "pending_review", "approved", "rejected"].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-2 py-0.5 rounded text-[9px] font-mono transition-colors ${filter === f ? "bg-[#4a90b8]/15 text-[#4a90b8]" : "text-slate-600 hover:text-slate-400"}`}>
                {f === "all" ? "ALL" : f.replace("_", " ").toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {filtered.map((entry: any) => (
            <div key={entry.id} className="flex items-start gap-3 py-3 border-b border-white/[0.04] last:border-0">
              <div className="mt-0.5">
                {entry.exportSafe ? <Lock className="w-4 h-4 text-[#4a90b8]" /> : <Eye className="w-4 h-4 text-slate-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-slate-200">{entry.outputContent ?? entry.outputType}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-500 font-mono">{entry.outputType}</span>
                </div>
                <div className="flex items-center gap-3 text-[9px] text-slate-500">
                  <span className="font-mono">Hash: {entry.outputHash}</span>
                  <span>Lane: {entry.modelLane}</span>
                  <span>Provider: {entry.modelProvider}</span>
                  <span>Conf: {((entry.extractionConfidence ?? 0) * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <Link2 className="w-3 h-3 text-slate-600" />
                  <span className="text-[9px] text-slate-500">{(entry.sourceReferences ?? []).length} source(s)</span>
                  {(entry.sourceReferences ?? []).slice(0, 3).map((ref: any, i: number) => (
                    <span key={i} className="text-[8px] px-1 py-0.5 rounded bg-white/[0.04] text-slate-500 font-mono">{ref.type}#{ref.id}</span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: `${stateColors[entry.reviewState] ?? "#64748b"}15`, color: stateColors[entry.reviewState] ?? "#64748b" }}>{entry.reviewState}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: `${stateColors[entry.approvalState] ?? "#64748b"}15`, color: stateColors[entry.approvalState] ?? "#64748b" }}>{entry.approvalState}</span>
                {entry.exportSafe && <span className="text-[8px] text-[#4a90b8] font-mono">EXPORT SAFE</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
