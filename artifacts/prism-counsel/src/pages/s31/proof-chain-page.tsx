import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield, Link2, CheckCircle, Clock, XCircle, Eye, FileText, Lock, AlertTriangle, Archive } from "lucide-react";
import { useProofChainPending } from "../../hooks/use-prism-s31";
import { Link } from "wouter";

function useFilingGateAudits() {
  return useQuery({
    queryKey: ["filing-gate", "audits"],
    queryFn: async () => {
      const res = await fetch("/api/prism-counsel/review-desk/filing-gate/audits?limit=20", {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    staleTime: 30000,
    retry: false,
  });
}

const DEMO_ENTRIES = [
  { id: 1, outputType: "copilot_answer", outputHash: "a3f2c1...8b7e", sourceReferences: [{ type: "communication", id: 42 }, { type: "offer", id: 7 }], sourceClass: "internal", extractionConfidence: 0.92, modelLane: "reasoning", modelProvider: "anthropic", reviewState: "approved", approvalState: "approved", exportSafe: true, createdAt: "2026-04-03T09:30:00Z", outputContent: "Insurer communications summary for Rodriguez v. National General" },
  { id: 2, outputType: "extraction", outputHash: "b8d4e2...1c3a", sourceReferences: [{ type: "document", id: 18 }], sourceClass: "internal", extractionConfidence: 0.88, modelLane: "extraction", modelProvider: "openai", reviewState: "approved", approvalState: "pending", exportSafe: false, createdAt: "2026-04-03T08:15:00Z", outputContent: "Medical record extraction — Dr. Martinez treatment notes" },
  { id: 3, outputType: "forecast", outputHash: "c9e5f3...2d4b", sourceReferences: [{ type: "pressure_score", id: 12 }, { type: "data_product", id: 3 }], sourceClass: "computed", extractionConfidence: 0.75, modelLane: "forecast", modelProvider: "anthropic", reviewState: "pending_review", approvalState: "pending", exportSafe: false, createdAt: "2026-04-02T16:00:00Z", outputContent: "Settlement range forecast update — Rodriguez matter" },
  { id: 4, outputType: "chronology_section", outputHash: "d0f6g4...3e5c", sourceReferences: [{ type: "document", id: 14 }, { type: "document", id: 15 }, { type: "communication", id: 38 }], sourceClass: "internal", extractionConfidence: 0.85, modelLane: "extraction", modelProvider: "openai", reviewState: "reviewed", approvalState: "approved", exportSafe: true, createdAt: "2026-04-02T11:00:00Z", outputContent: "Chronology section: January 2026 treatment timeline" },
  { id: 5, outputType: "demand_section", outputHash: "e1g7h5...4f6d", sourceReferences: [{ type: "document", id: 20 }, { type: "damages", id: 5 }], sourceClass: "internal", extractionConfidence: 0.90, modelLane: "reasoning", modelProvider: "anthropic", reviewState: "pending_review", approvalState: "pending", exportSafe: false, createdAt: "2026-04-01T14:30:00Z", outputContent: "Demand letter section — damages summary with medical specials" },
  { id: 6, outputType: "copilot_answer", outputHash: "f2h8i6...5g7e", sourceReferences: [{ type: "worldline_signal", id: 23 }], sourceClass: "worldline", extractionConfidence: 0.68, modelLane: "reasoning", modelProvider: "anthropic", reviewState: "rejected", approvalState: "pending", exportSafe: false, createdAt: "2026-04-01T10:00:00Z", outputContent: "Weather context analysis — incident date conditions" },
];

const DEMO_FILING_GATE_ARTIFACTS = [
  {
    id: "audit_1712950800000_x3k9p1",
    documentId: "doc_001",
    documentTitle: "Demand Letter — Rodriguez v. National General Insurance",
    matterId: 1,
    verifiedAt: "2026-04-12T09:15:00Z",
    totalCitations: 11,
    verifiedCount: 7,
    unverifiedCount: 2,
    suspiciousCount: 2,
    overallStatus: "blocked" as const,
    averageConfidence: 0.64,
    sealedBy: "Sarah Chen",
    outputHash: "g7j2k4...9m1n",
  },
  {
    id: "audit_1712947200000_r8t5y2",
    documentId: "doc_002",
    documentTitle: "Motion for Summary Judgment — Thompson v. Westfield",
    matterId: 2,
    verifiedAt: "2026-04-12T08:00:00Z",
    totalCitations: 9,
    verifiedCount: 9,
    unverifiedCount: 0,
    suspiciousCount: 0,
    overallStatus: "clear" as const,
    averageConfidence: 0.87,
    sealedBy: "Marcus Williams",
    outputHash: "h8k3l5...0n2o",
  },
  {
    id: "audit_1712872800000_v6w9x3",
    documentId: "doc_003",
    documentTitle: "Interrogatory Responses — Martinez Commercial",
    matterId: 3,
    verifiedAt: "2026-04-11T11:30:00Z",
    totalCitations: 6,
    verifiedCount: 5,
    unverifiedCount: 1,
    suspiciousCount: 0,
    overallStatus: "needs_review" as const,
    averageConfidence: 0.78,
    sealedBy: "Sarah Chen",
    outputHash: "i9l4m6...1o3p",
  },
];

const stateColors: Record<string, string> = {
  approved: "#4a90b8", reviewed: "#4a90b8", pending_review: "#d4a054", pending: "#d4a054", rejected: "#c45a4a", not_reviewed: "#64748b",
};

const gateStatusConfig = {
  clear: { color: "#4a90b8", bg: "#4a90b815", label: "CLEARED", icon: CheckCircle },
  needs_review: { color: "#d4a054", bg: "#d4a05415", label: "NEEDS REVIEW", icon: AlertTriangle },
  blocked: { color: "#c45a4a", bg: "#c45a4a15", label: "BLOCKED", icon: XCircle },
};

export default function ProofChainPage() {
  const { data: pendingData } = useProofChainPending();
  const { data: auditData } = useFilingGateAudits();
  const [filter, setFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"chain" | "filing_gate">("chain");

  const entries = pendingData?.pending?.length > 0 ? pendingData.pending : DEMO_ENTRIES;
  const isDemo = !pendingData?.pending?.length;
  const filtered = filter === "all" ? entries : entries.filter((e: any) => e.reviewState === filter || e.approvalState === filter);

  const stats = {
    total: entries.length,
    exportSafe: entries.filter((e: any) => e.exportSafe).length,
    pendingReview: entries.filter((e: any) => e.reviewState === "pending_review").length,
    approved: entries.filter((e: any) => e.approvalState === "approved").length,
  };

  const liveAudits: Array<{
    auditId: string;
    documentId: string;
    documentTitle: string;
    matterId?: number;
    verifiedAt: string;
    totalCitations: number;
    verifiedCount: number;
    unverifiedCount: number;
    suspiciousCount: number;
    overallStatus: "clear" | "needs_review" | "blocked";
    averageConfidence: number;
    sealedAt?: string;
    sealedNote?: string;
  }> = (auditData?.reports ?? []).map((r: any) => ({
    auditId: r.auditId,
    documentId: r.documentId,
    documentTitle: r.documentTitle,
    matterId: r.matterId,
    verifiedAt: r.verifiedAt,
    totalCitations: r.totalCitations,
    verifiedCount: r.verifiedCount,
    unverifiedCount: r.unverifiedCount,
    suspiciousCount: r.suspiciousCount,
    overallStatus: r.overallStatus,
    averageConfidence: r.averageConfidence,
    sealedAt: r.sealedAt,
    sealedNote: r.sealedNote,
  }));

  const hasLiveAudits = liveAudits.length > 0;
  const displayAudits = hasLiveAudits ? liveAudits : DEMO_FILING_GATE_ARTIFACTS;

  const filingGateStats = {
    total: displayAudits.length,
    cleared: displayAudits.filter((a: any) => a.overallStatus === "clear").length,
    blocked: displayAudits.filter((a: any) => a.overallStatus === "blocked").length,
    totalCitations: displayAudits.reduce((s: number, a: any) => s + (a.totalCitations ?? 0), 0),
    suspiciousCaught: displayAudits.reduce((s: number, a: any) => s + (a.suspiciousCount ?? 0), 0),
  };

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#4a90b8]" />
          <h1 className="text-lg font-semibold text-slate-100">Proof Chain</h1>
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isDemo ? "bg-[#d4a054]/10 text-[#d4a054]" : "bg-[#4a90b8]/10 text-[#4a90b8]"}`}>{isDemo ? "DEMO" : "LIVE"}</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">SHA-256 hash integrity, source tracing, review/approval states, export safety, and Filing Gate audit trail</p>
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

      <div className="flex items-center gap-1 border-b border-white/[0.06]">
        {[
          { key: "chain" as const, label: "Chain Entries" },
          { key: "filing_gate" as const, label: "Filing Gate Audits" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-[#4a90b8] text-slate-200"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab.key === "filing_gate" && (
              <span className="text-[8px] px-1 py-0.5 rounded font-mono bg-[#c8a96e]/10 text-[#c8a96e]">{filingGateStats.total}</span>
            )}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "chain" && (
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
      )}

      {activeTab === "filing_gate" && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Audit Reports", value: filingGateStats.total, color: "#c8a96e" },
              { label: "Cleared", value: filingGateStats.cleared, color: "#4a90b8" },
              { label: "Blocked", value: filingGateStats.blocked, color: "#c45a4a" },
              { label: "Citations Caught", value: filingGateStats.suspiciousCaught, color: "#d4a054" },
            ].map((s, i) => (
              <div key={i} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
                <div className="text-[10px] text-slate-500 mb-1">{s.label}</div>
                <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Archive className="w-3.5 h-3.5 text-[#c8a96e]" />
                <h3 className="text-sm font-semibold text-slate-200">Citation Audit Reports</h3>
                <span className="text-[8px] px-1.5 py-0.5 rounded font-mono bg-[#c8a96e]/10 text-[#c8a96e]">IMMUTABLE COMPLIANCE ARTIFACTS</span>
              </div>
              <Link href="/review-desk/filing-gate">
                <span className="text-[10px] text-slate-500 hover:text-[#c8a96e] transition-colors cursor-pointer">
                  Open Filing Gate →
                </span>
              </Link>
            </div>
            <p className="text-[9px] text-slate-600 mb-3">
              Each report below was generated by the Filing Gate citation verifier and sealed as an immutable compliance artifact.
              These records prove that the firm verified all AI-generated citations prior to signing or filing each document.
            </p>
            {!hasLiveAudits && (
              <p className="text-[9px] text-slate-600 mb-2 italic">
                Showing sample data — run verification on a document in the Filing Gate to see live audit reports here.
              </p>
            )}
            <div className="space-y-3">
              {(displayAudits as any[]).map((artifact: any) => {
                const key = artifact.auditId ?? artifact.id;
                const cfg = gateStatusConfig[artifact.overallStatus as keyof typeof gateStatusConfig] ?? gateStatusConfig.needs_review;
                const Icon = cfg.icon;
                return (
                  <div key={key} className="rounded border border-white/[0.04] p-3" style={{ background: "#080c14" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Lock className="w-3 h-3 text-[#c8a96e] flex-shrink-0" />
                          <span className="text-xs font-medium text-slate-200 truncate">{artifact.documentTitle}</span>
                          <span className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
                            <Icon className="w-2.5 h-2.5" />
                            {cfg.label}
                          </span>
                          {artifact.sealedAt && (
                            <span className="text-[7px] px-1 py-0.5 rounded bg-[#4a90b8]/10 text-[#4a90b8] font-mono">SEALED</span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 text-[9px] text-slate-500 ml-5">
                          <span>ID: <span className="font-mono text-slate-400">{(artifact.auditId ?? artifact.id ?? "").slice(0, 22)}</span></span>
                          <span>Citations: <span className="text-slate-300">{artifact.totalCitations}</span></span>
                          <span>Avg conf: <span className="text-slate-300">{Math.round((artifact.averageConfidence ?? 0) * 100)}%</span></span>
                          <span>Verified: <span className="text-[#4a90b8]">{artifact.verifiedCount}</span></span>
                          <span>Unverified: <span className="text-[#d4a054]">{artifact.unverifiedCount}</span></span>
                          <span>Suspicious: <span className="text-[#c45a4a]">{artifact.suspiciousCount}</span></span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-[9px] text-slate-500">
                          {new Date(artifact.verifiedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          {" · "}
                          {new Date(artifact.verifiedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        {(artifact.sealedBy || artifact.sealedAt) && (
                          <div className="text-[9px] text-slate-600 mt-0.5">
                            {artifact.sealedBy ? `Sealed by ${artifact.sealedBy}` : `Sealed ${new Date(artifact.sealedAt).toLocaleDateString()}`}
                          </div>
                        )}
                        <div className="text-[8px] font-mono text-slate-700 mt-0.5">{artifact.auditId ?? artifact.id}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded border border-white/[0.04] p-3" style={{ background: "#080c14" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Shield className="w-3 h-3 text-slate-600" />
              <span className="text-[9px] text-slate-500 font-semibold">Compliance Note</span>
            </div>
            <p className="text-[8.5px] text-slate-600 leading-relaxed">
              Filing Gate audit reports are sealed and immutable upon attorney sign-off. Each report constitutes documentary evidence that the firm
              verified all AI-generated legal citations before filing — addressing the court sanctions risk from AI hallucinated citations.
              Reports are permanently linked to the matter record and cannot be altered after sealing.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
