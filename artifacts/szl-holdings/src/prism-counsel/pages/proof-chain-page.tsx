import { useState } from "react";
import { useRoute } from "wouter";
import { Shield, CheckCircle2, AlertCircle, Eye, Lock, Download, GitBranch, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ProofChainApiResponse { data?: { entries?: unknown[] } }
interface ContradictionsApiResponse { data?: { contradictions?: unknown[] } }
interface AuditPacketsApiResponse { data?: { packets?: unknown[] } }

const PROOF_VIEWS = [
  { id: "entries", label: "Proof Entries" },
  { id: "audit_packets", label: "Audit Packets" },
  { id: "contradictions", label: "Contradictions" },
  { id: "export_safety", label: "Export Safety" },
] as const;

type ProofView = typeof PROOF_VIEWS[number]["id"];

function ReviewStateBadge({ state }: { state: string }) {
  const cfg: Record<string, { color: string; label: string }> = {
    unreviewed: { color: "#8a7a6a", label: "UNREVIEWED" },
    review_pending: { color: "#d4a054", label: "PENDING REVIEW" },
    reviewed: { color: "#4a90b8", label: "REVIEWED" },
    approved: { color: "#5aa87a", label: "APPROVED" },
    rejected: { color: "#c45a4a", label: "REJECTED" },
    exported: { color: "#8a7a6a", label: "EXPORTED" },
  };
  const c = cfg[state] ?? { color: "#8a7a6a", label: state.toUpperCase() };
  return (
    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: c.color + "20", color: c.color }}>
      {c.label}
    </span>
  );
}

function ProofEntryCard({ entry }: { entry: any }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-lg border border-white/[0.06] p-4 space-y-2" style={{ background: "#0c1220" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-[#d4a054]" />
          <span className="text-xs font-medium text-slate-200">{entry.outputType?.replace("_", " ")}</span>
        </div>
        <div className="flex items-center gap-2">
          <ReviewStateBadge state={entry.reviewState ?? "unreviewed"} />
          {entry.privilegeFlag && <Lock className="w-3 h-3 text-[#d4a054]" />}
          {entry.exportSafe && <CheckCircle2 className="w-3 h-3 text-[#5aa87a]" />}
        </div>
      </div>

      <div className="text-[10px] text-slate-500 font-mono">{entry.outputRef}</div>

      <div className="grid grid-cols-3 gap-2 text-[10px]">
        <div>
          <span className="text-slate-500">Lane:</span>
          <span className="text-slate-300 ml-1">{entry.modelLane ?? "—"}</span>
        </div>
        <div>
          <span className="text-slate-500">Provider:</span>
          <span className="text-slate-300 ml-1">{entry.modelProvider ?? "—"}</span>
        </div>
        <div>
          <span className="text-slate-500">Confidence:</span>
          <span className="text-slate-300 ml-1">
            {entry.extractionConfidence ? `${(entry.extractionConfidence * 100).toFixed(0)}%` : "—"}
          </span>
        </div>
      </div>

      {entry.sourceReferences && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-[#4a90b8] hover:text-[#5aa8d8] flex items-center gap-1"
        >
          <Eye className="w-3 h-3" /> {expanded ? "Hide" : "View"} source references
        </button>
      )}

      {expanded && entry.sourceReferences && (
        <div className="bg-black/20 rounded p-2 text-[10px] text-slate-400 font-mono">
          <pre className="whitespace-pre-wrap">{JSON.stringify(entry.sourceReferences, null, 2)}</pre>
        </div>
      )}

      <div className="text-[10px] text-slate-600">{new Date(entry.generatedAt).toLocaleString()}</div>
    </div>
  );
}

function ContradictionCard({ c }: { c: any }) {
  return (
    <div className={cn(
      "rounded-lg border p-4 space-y-2",
      c.severity === "critical" ? "border-[#c45a4a]/30" : "border-white/[0.06]"
    )} style={{ background: "#0c1220" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className={`w-3.5 h-3.5 ${c.severity === "critical" ? "text-[#c45a4a]" : "text-[#d4a054]"}`} />
          <span className="text-xs font-medium text-slate-200">{c.contradictionType?.replace("_", " ")}</span>
        </div>
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${c.severity === "critical" ? "bg-[#c45a4a]/10 text-[#c45a4a]" : "bg-[#d4a054]/10 text-[#d4a054]"}`}>
          {c.severity?.toUpperCase()}
        </span>
      </div>
      <div className="text-xs text-slate-300">{c.description}</div>
      {(c.sourceARef || c.sourceBRef) && (
        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
          {c.sourceARef && <div>A: {c.sourceARef}</div>}
          {c.sourceBRef && <div>B: {c.sourceBRef}</div>}
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className={`px-1.5 py-0.5 rounded text-[9px] ${c.status === "open" ? "bg-[#c45a4a]/10 text-[#c45a4a]" : "bg-[#5aa87a]/10 text-[#5aa87a]"}`}>
          {c.status?.toUpperCase()}
        </span>
        {c.detectedByLane && <span className="text-[10px] text-slate-500">{c.detectedByLane}</span>}
      </div>
    </div>
  );
}

export default function ProofChainPage() {
  const [, params] = useRoute("/prism-counsel/matters/:id/proof-chain");
  const [view, setView] = useState<ProofView>("entries");
  const matterId = parseInt(params?.id ?? "0");

  const { data: proofData, isLoading: pcLoading } = useQuery({
    queryKey: ["proof-chain", matterId],
    queryFn: () => apiRequest<ProofChainApiResponse>("GET", `/api/prism-counsel/matters/${matterId}/proof-chain`),
    enabled: matterId > 0 && view === "entries",
  });

  const { data: contradictionData, isLoading: cdLoading } = useQuery({
    queryKey: ["contradictions", matterId],
    queryFn: () => apiRequest<ContradictionsApiResponse>("GET", `/api/prism-counsel/matters/${matterId}/contradictions`),
    enabled: matterId > 0 && view === "contradictions",
  });

  const { data: auditData } = useQuery({
    queryKey: ["audit-packets", matterId],
    queryFn: () => apiRequest<AuditPacketsApiResponse>("GET", `/api/prism-counsel/matters/${matterId}/audit-packets`),
    enabled: matterId > 0 && view === "audit_packets",
  });

  const entries = proofData?.data?.entries ?? [];
  const contradictions = contradictionData?.data?.contradictions ?? [];
  const packets = auditData?.data?.packets ?? [];

  const approved = entries.filter((e: any) => e.reviewState === "approved").length;
  const exportSafe = entries.filter((e: any) => e.exportSafe).length;
  const privileged = entries.filter((e: any) => e.privilegeFlag).length;
  const criticalContradictions = contradictions.filter((c: any) => c.severity === "critical").length;

  return (
    <div className="p-5 max-w-[1000px] mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-[#4a90b8]" />
        <h1 className="text-sm font-semibold text-slate-200">Proof Chain</h1>
        <span className="px-2 py-0.5 rounded text-[9px] bg-[#4a90b8]/10 text-[#4a90b8] border border-[#4a90b8]/20">
          DEFENSIBILITY LAYER
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Entries", value: entries.length },
          { label: "Approved", value: approved, color: "#5aa87a" },
          { label: "Export Safe", value: exportSafe, color: "#4a90b8" },
          { label: "Privileged", value: privileged, color: "#d4a054" },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
            <div className="text-[10px] text-slate-500 mb-1">{kpi.label}</div>
            <div className="text-xl font-bold" style={{ color: kpi.color ?? "#slate-100" }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {criticalContradictions > 0 && (
        <div className="rounded-lg border border-[#c45a4a]/30 p-3 flex items-center gap-2 text-xs text-[#c45a4a]" style={{ background: "#0c1220" }}>
          <AlertCircle className="w-4 h-4" />
          {criticalContradictions} critical contradiction(s) detected — review before export
        </div>
      )}

      <div className="flex gap-2">
        {PROOF_VIEWS.map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              view === v.id
                ? "bg-white/[0.08] text-slate-100"
                : "text-slate-400 hover:text-slate-200 bg-white/[0.02]"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "entries" && (
        <div className="space-y-3">
          {pcLoading && <div className="text-xs text-slate-500">Loading proof chain…</div>}
          {!pcLoading && entries.length === 0 && <div className="text-xs text-slate-500">No proof chain entries yet</div>}
          {entries.map((entry: any) => <ProofEntryCard key={entry.id} entry={entry} />)}
        </div>
      )}

      {view === "contradictions" && (
        <div className="space-y-3">
          {cdLoading && <div className="text-xs text-slate-500">Loading…</div>}
          {!cdLoading && contradictions.length === 0 && <div className="text-xs text-slate-500">No contradictions detected</div>}
          {contradictions.map((c: any) => <ContradictionCard key={c.id} c={c} />)}
        </div>
      )}

      {view === "audit_packets" && (
        <div className="space-y-3">
          {packets.length === 0 && <div className="text-xs text-slate-500">No audit packets generated yet</div>}
          {packets.map((p: any) => (
            <div key={p.id} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-slate-200">{p.title}</div>
                <div className="flex items-center gap-2">
                  {p.exportSafe && <CheckCircle2 className="w-3.5 h-3.5 text-[#5aa87a]" />}
                  {p.privilegeChecked && <Lock className="w-3 h-3 text-[#d4a054]" />}
                </div>
              </div>
              <div className="text-[10px] text-slate-500">{p.packetType?.replace("_", " ")} · {new Date(p.generatedAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}

      {view === "export_safety" && (
        <div className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
          <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <Download className="w-4 h-4 text-[#5aa87a]" /> Export Safety Panel
          </h3>
          <div className="space-y-3 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              {exportSafe === entries.length && entries.length > 0 ? (
                <CheckCircle2 className="w-4 h-4 text-[#5aa87a]" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#d4a054]" />
              )}
              <span>{exportSafe}/{entries.length} entries marked export-safe</span>
            </div>
            <div className="flex items-center gap-3">
              {privileged > 0 ? (
                <Lock className="w-4 h-4 text-[#d4a054]" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#5aa87a]" />
              )}
              <span>{privileged} privileged entries — will be excluded from client exports</span>
            </div>
            <div className="flex items-center gap-3">
              {criticalContradictions > 0 ? (
                <X className="w-4 h-4 text-[#c45a4a]" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#5aa87a]" />
              )}
              <span>{criticalContradictions} critical contradictions blocking export</span>
            </div>
          </div>
          {criticalContradictions === 0 && privileged === 0 && exportSafe === entries.length && entries.length > 0 && (
            <div className="mt-4 p-3 rounded bg-[#5aa87a]/10 border border-[#5aa87a]/20 text-xs text-[#5aa87a]">
              Export safety check passed — this matter is ready for export
            </div>
          )}
        </div>
      )}
    </div>
  );
}
