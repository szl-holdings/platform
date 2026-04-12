import { useState } from "react";
import {
  Search, FileText, AlertTriangle, Shield, Star, CheckCircle,
  Clock, Tag, Filter, Eye, Brain, ChevronRight, Download,
  Loader2, RefreshCw, Lock, Flag, Hash
} from "lucide-react";

const ACCENT = "#c8a96e";
const BG = "#080c14";
const CARD = "#0c1220";
const BORDER = "rgba(255,255,255,0.06)";

type DocRelevance = "hot" | "relevant" | "marginal" | "irrelevant";
type PrivilegeStatus = "attorney-client" | "work-product" | "dual-purpose" | "none" | "review";

interface DiscoveryDocument {
  id: string;
  filename: string;
  dateCreated: string;
  pageCount: number;
  relevance: DocRelevance;
  relevanceScore: number;
  privilegeStatus: PrivilegeStatus;
  privilegeConfidence: number;
  autoTags: string[];
  keyExcerpt: string;
  flagReason?: string;
  author?: string;
  recipientCount?: number;
  isHotDoc: boolean;
  reviewStatus: "pending" | "reviewed" | "needs-escalation";
}

const DOCUMENTS: DiscoveryDocument[] = [
  {
    id: "d1",
    filename: "Claims_Adjuster_Email_Chain_Nov2024.eml",
    dateCreated: "2024-11-15",
    pageCount: 8,
    relevance: "hot",
    relevanceScore: 97,
    privilegeStatus: "none",
    privilegeConfidence: 96,
    autoTags: ["adjuster-communication", "reserve-discussion", "bad-faith-signal", "key-admission"],
    keyExcerpt: "\"We're going to hold this one below reserve as long as possible. The plaintiff's attorney hasn't pushed hard yet.\" — Adjuster Williams to supervisor Chen",
    flagReason: "Potential bad faith admission — adjuster explicitly states intent to underpay claim below reserve",
    author: "Mike Williams (Nationwide Adjuster)",
    recipientCount: 2,
    isHotDoc: true,
    reviewStatus: "needs-escalation",
  },
  {
    id: "d2",
    filename: "IME_Report_Dr_Harrison_Feb2026.pdf",
    dateCreated: "2026-02-28",
    pageCount: 22,
    relevance: "hot",
    relevanceScore: 94,
    privilegeStatus: "work-product",
    privilegeConfidence: 88,
    autoTags: ["IME-report", "damages-dispute", "expert-opinion", "opposing-expert"],
    keyExcerpt: "Dr. Harrison concludes maximum medical improvement was reached 6 months prior to plaintiff's claimed treatment end date. Contradicts treating physician.",
    flagReason: "Key defense expert report — contradicts treating physician. Must be countered at deposition.",
    author: "Dr. Robert Harrison MD",
    recipientCount: 3,
    isHotDoc: true,
    reviewStatus: "reviewed",
  },
  {
    id: "d3",
    filename: "Attorney_Client_Memo_Settlement_Auth.docx",
    dateCreated: "2025-08-10",
    pageCount: 4,
    relevance: "marginal",
    relevanceScore: 45,
    privilegeStatus: "attorney-client",
    privilegeConfidence: 99,
    autoTags: ["settlement-authority", "attorney-client"],
    keyExcerpt: "[PRIVILEGED — REDACTED]",
    flagReason: "High-confidence attorney-client privilege. Withhold and log.",
    author: "Davis & Hayes LLP",
    recipientCount: 1,
    isHotDoc: false,
    reviewStatus: "reviewed",
  },
  {
    id: "d4",
    filename: "Accident_Scene_Photos_Dec2024.zip",
    dateCreated: "2024-12-03",
    pageCount: 47,
    relevance: "relevant",
    relevanceScore: 82,
    privilegeStatus: "none",
    privilegeConfidence: 98,
    autoTags: ["accident-scene", "liability-evidence", "photographic-evidence"],
    keyExcerpt: "47 photographs of accident scene. 12 show skid marks consistent with defendant's excessive speed. 8 show inadequate lighting at intersection.",
    author: "Investigating Officer Garcia",
    recipientCount: 0,
    isHotDoc: false,
    reviewStatus: "reviewed",
  },
  {
    id: "d5",
    filename: "Nationwide_Reserve_Log_Q4_2024.xlsx",
    dateCreated: "2024-12-31",
    pageCount: 3,
    relevance: "hot",
    relevanceScore: 91,
    privilegeStatus: "review",
    privilegeConfidence: 72,
    autoTags: ["reserve-log", "financial-document", "bad-faith-potential", "privilege-uncertain"],
    keyExcerpt: "Reserve set at $45,000 on a claim with $180,000 in claimed damages. Reserve not adjusted after receiving treatment records.",
    flagReason: "Reserve set dramatically below claim value. Evidence of bad faith reserve manipulation. Privilege status uncertain — challenge attorney-client claim.",
    isHotDoc: true,
    reviewStatus: "needs-escalation",
  },
  {
    id: "d6",
    filename: "Police_Report_Incident_2024_89234.pdf",
    dateCreated: "2024-11-03",
    pageCount: 6,
    relevance: "relevant",
    relevanceScore: 88,
    privilegeStatus: "none",
    privilegeConfidence: 99,
    autoTags: ["police-report", "liability", "fault-determination", "witness-statements"],
    keyExcerpt: "Officer concludes defendant ran red light at approximately 45 mph. No fault attributed to plaintiff. Two independent witnesses corroborate.",
    author: "Officer J. Martinez, MDDP",
    recipientCount: 0,
    isHotDoc: false,
    reviewStatus: "reviewed",
  },
  {
    id: "d7",
    filename: "Medical_Records_Baptist_Health_2025.pdf",
    dateCreated: "2025-06-30",
    pageCount: 184,
    relevance: "relevant",
    relevanceScore: 85,
    privilegeStatus: "none",
    privilegeConfidence: 99,
    autoTags: ["medical-records", "treatment-history", "damages", "continuity-of-care"],
    keyExcerpt: "Continuous treatment from November 2024 through June 2025. No gaps in treatment. Consistent diagnosis of cervical disc herniation L4-L5.",
    author: "Baptist Health Medical Records",
    recipientCount: 0,
    isHotDoc: false,
    reviewStatus: "reviewed",
  },
  {
    id: "d8",
    filename: "Defendant_Internal_Claims_Manual.pdf",
    dateCreated: "2023-01-15",
    pageCount: 312,
    relevance: "hot",
    relevanceScore: 88,
    privilegeStatus: "review",
    privilegeConfidence: 65,
    autoTags: ["claims-manual", "internal-policy", "bad-faith-evidence", "industry-standard"],
    keyExcerpt: "Section 4.2 states adjusters should 'minimize reserve exposure' and 'delay assignment of independent counsel.' Conflicts with good faith claims handling standards.",
    flagReason: "Internal manual conflicts with Florida good faith obligations. Highly valuable for bad faith claim.",
    isHotDoc: true,
    reviewStatus: "needs-escalation",
  },
];

const RELEVANCE_CONFIG: Record<DocRelevance, { color: string; bg: string; label: string }> = {
  hot: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "Hot Doc" },
  relevant: { color: ACCENT, bg: `${ACCENT}15`, label: "Relevant" },
  marginal: { color: "#64748b", bg: "rgba(100,116,139,0.1)", label: "Marginal" },
  irrelevant: { color: "#374151", bg: "rgba(55,65,81,0.1)", label: "Irrelevant" },
};

const PRIVILEGE_CONFIG: Record<PrivilegeStatus, { color: string; bg: string; label: string }> = {
  "attorney-client": { color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", label: "A-C Privilege" },
  "work-product": { color: "#3b82f6", bg: "rgba(59,130,246,0.1)", label: "Work Product" },
  "dual-purpose": { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "Dual Purpose" },
  "none": { color: "#22c55e", bg: "rgba(34,197,94,0.1)", label: "No Privilege" },
  "review": { color: "#f97316", bg: "rgba(249,115,22,0.1)", label: "Needs Review" },
};

export default function SmartDiscoveryAutopilotPage() {
  const [filter, setFilter] = useState<"all" | "hot" | "privilege" | "escalation">("all");
  const [selected, setSelected] = useState<string | null>("d1");
  const [running, setRunning] = useState(false);
  const [processed, setProcessed] = useState(true);

  const filtered = DOCUMENTS.filter((d) => {
    if (filter === "hot") return d.isHotDoc;
    if (filter === "privilege") return d.privilegeStatus !== "none";
    if (filter === "escalation") return d.reviewStatus === "needs-escalation";
    return true;
  });

  const selectedDoc = DOCUMENTS.find((d) => d.id === selected);
  const hotDocs = DOCUMENTS.filter((d) => d.isHotDoc).length;
  const privilegeDocs = DOCUMENTS.filter((d) => d.privilegeStatus !== "none").length;
  const escalations = DOCUMENTS.filter((d) => d.reviewStatus === "needs-escalation").length;

  function runAutopilot() {
    setRunning(true);
    setProcessed(false);
    setTimeout(() => { setRunning(false); setProcessed(true); }, 2500);
  }

  return (
    <div className="flex h-full" style={{ background: BG }}>
      <div className="w-72 shrink-0 flex flex-col border-r" style={{ borderColor: BORDER }}>
        <div className="p-4 border-b" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4" style={{ color: ACCENT }} />
            <h1 className="text-sm font-bold text-slate-100">Discovery Autopilot</h1>
          </div>
          <p className="text-[9px] text-slate-500 mb-3">AI auto-tagging, privilege detection, and hot document flagging</p>

          <div className="grid grid-cols-3 gap-1.5 mb-3">
            <div className="rounded p-2 text-center" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <div className="text-base font-bold font-mono text-red-400">{hotDocs}</div>
              <div className="text-[8px] text-slate-500">Hot Docs</div>
            </div>
            <div className="rounded p-2 text-center" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
              <div className="text-base font-bold font-mono text-purple-400">{privilegeDocs}</div>
              <div className="text-[8px] text-slate-500">Privilege</div>
            </div>
            <div className="rounded p-2 text-center" style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)" }}>
              <div className="text-base font-bold font-mono text-orange-400">{escalations}</div>
              <div className="text-[8px] text-slate-500">Escalate</div>
            </div>
          </div>

          <button
            onClick={runAutopilot}
            disabled={running}
            className="w-full flex items-center justify-center gap-2 py-2 rounded text-[10px] font-medium"
            style={{ background: `${ACCENT}12`, color: ACCENT, border: `1px solid ${ACCENT}25` }}
          >
            {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {running ? "Processing…" : "Re-run Autopilot"}
          </button>
        </div>

        <div className="p-2 border-b flex gap-1" style={{ borderColor: BORDER }}>
          {(["all", "hot", "privilege", "escalation"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="flex-1 py-1 rounded text-[9px] font-medium capitalize transition-all"
              style={{
                background: filter === f ? `${ACCENT}15` : "rgba(255,255,255,0.03)",
                color: filter === f ? ACCENT : "#64748b",
                border: `1px solid ${filter === f ? `${ACCENT}25` : "transparent"}`,
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filtered.map((doc) => {
            const relCfg = RELEVANCE_CONFIG[doc.relevance];
            return (
              <button
                key={doc.id}
                onClick={() => setSelected(doc.id)}
                className="w-full text-left rounded-lg border p-2.5 transition-all"
                style={{
                  background: selected === doc.id ? relCfg.bg : "rgba(255,255,255,0.02)",
                  borderColor: selected === doc.id ? relCfg.color + "40" : BORDER,
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {doc.isHotDoc && <Star className="w-2.5 h-2.5 text-red-400 shrink-0" />}
                  {doc.reviewStatus === "needs-escalation" && <Flag className="w-2.5 h-2.5 text-orange-400 shrink-0" />}
                  {doc.privilegeStatus !== "none" && <Lock className="w-2.5 h-2.5 text-purple-400 shrink-0" />}
                  <span className="text-[9px] font-mono font-medium truncate" style={{ color: relCfg.color }}>
                    {doc.relevance === "hot" ? "🔥 " : ""}{doc.filename.slice(0, 30)}…
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[8px]" style={{ color: relCfg.color }}>{relCfg.label}</span>
                  <span className="text-[8px] font-mono text-slate-600">{doc.relevanceScore}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {selectedDoc ? (
          <>
            <div className="rounded-lg border p-5" style={{ background: CARD, borderColor: BORDER }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {selectedDoc.isHotDoc && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: "#ef4444", background: "rgba(239,68,68,0.12)" }}>
                        🔥 HOT DOCUMENT
                      </span>
                    )}
                    <span
                      className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                      style={{ color: PRIVILEGE_CONFIG[selectedDoc.privilegeStatus].color, background: PRIVILEGE_CONFIG[selectedDoc.privilegeStatus].bg }}
                    >
                      {PRIVILEGE_CONFIG[selectedDoc.privilegeStatus].label} ({selectedDoc.privilegeConfidence}% confidence)
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-100 font-mono">{selectedDoc.filename}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {selectedDoc.dateCreated} · {selectedDoc.pageCount} pages {selectedDoc.author && `· ${selectedDoc.author}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest">Relevance Score</div>
                  <div className="text-2xl font-bold font-mono" style={{ color: RELEVANCE_CONFIG[selectedDoc.relevance].color }}>
                    {selectedDoc.relevanceScore}%
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-md" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Key Excerpt (AI-Identified)</div>
                <p className="text-[11px] text-slate-300 leading-relaxed italic">"{selectedDoc.keyExcerpt}"</p>
              </div>

              {selectedDoc.flagReason && (
                <div className="mt-3 p-3 rounded-md flex items-start gap-2" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[9px] uppercase tracking-widest text-red-400 mb-0.5">Flag Reason</div>
                    <p className="text-[10px] text-slate-300">{selectedDoc.flagReason}</p>
                  </div>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-1">
                {selectedDoc.autoTags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <Tag className="w-2 h-2" />{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-lg border p-5" style={{ background: CARD, borderColor: BORDER }}>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-slate-100">Privilege Analysis</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div className="h-full rounded-full" style={{ width: `${selectedDoc.privilegeConfidence}%`, background: PRIVILEGE_CONFIG[selectedDoc.privilegeStatus].color }} />
                </div>
                <span className="text-sm font-bold font-mono" style={{ color: PRIVILEGE_CONFIG[selectedDoc.privilegeStatus].color }}>
                  {selectedDoc.privilegeConfidence}% confidence
                </span>
              </div>
              <div className="mt-3 text-[10px] text-slate-400 leading-relaxed">
                {selectedDoc.privilegeStatus === "attorney-client" && "High-confidence attorney-client privilege detected. Recommend withholding with privilege log entry. Standard format: Date, Author, Recipients, Privilege Basis."}
                {selectedDoc.privilegeStatus === "work-product" && "Work product protection likely applies. Review to confirm prepared in anticipation of litigation. If shared with non-attorney, assess waiver risk."}
                {selectedDoc.privilegeStatus === "review" && "Privilege status uncertain. Document appears to be dual-purpose — some attorney involvement but unclear whether primary purpose was legal advice. Requires attorney review before production decision."}
                {selectedDoc.privilegeStatus === "none" && "No privilege detected. Document is likely producible. Confirm no embedded attachments with separate privilege status."}
              </div>
            </div>

            <div className="rounded-lg border p-4 flex items-center justify-between" style={{ background: CARD, borderColor: BORDER }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: selectedDoc.reviewStatus === "reviewed" ? "rgba(34,197,94,0.1)" : selectedDoc.reviewStatus === "needs-escalation" ? "rgba(249,115,22,0.1)" : "rgba(255,255,255,0.05)" }}>
                  {selectedDoc.reviewStatus === "reviewed" ? <CheckCircle className="w-4 h-4 text-green-400" /> : selectedDoc.reviewStatus === "needs-escalation" ? <Flag className="w-4 h-4 text-orange-400" /> : <Clock className="w-4 h-4 text-slate-400" />}
                </div>
                <div>
                  <div className="text-[10px] font-medium text-slate-200">
                    {selectedDoc.reviewStatus === "reviewed" ? "Reviewed" : selectedDoc.reviewStatus === "needs-escalation" ? "Needs Attorney Escalation" : "Pending Review"}
                  </div>
                  <div className="text-[9px] text-slate-500">Review status</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="text-[10px] px-3 py-1.5 rounded" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                  Mark Reviewed
                </button>
                <button className="text-[10px] px-3 py-1.5 rounded" style={{ background: "rgba(249,115,22,0.1)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.2)" }}>
                  Escalate
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center h-64">
            <div className="text-center">
              <FileText className="w-8 h-8 text-slate-700 mx-auto mb-3" />
              <div className="text-sm text-slate-500">Select a document to review</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
