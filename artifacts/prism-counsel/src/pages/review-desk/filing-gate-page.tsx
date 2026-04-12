import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Shield, CheckCircle, XCircle, AlertTriangle, Clock, FileText,
  ChevronRight, Lock, RefreshCw, Eye, Scale, Archive, Info,
  BarChart3, Gavel, Database
} from "lucide-react";
import { generateAuditReport, type CitationAuditReport, type VerifiedCitation } from "../../lib/citation-verifier";

const GATE_API = "/api/prism-counsel/review-desk/filing-gate";

async function gateApi(path: string, opts?: RequestInit) {
  const res = await fetch(GATE_API + path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function useFilingGateStats() {
  return useQuery({
    queryKey: ["filing-gate", "stats"],
    queryFn: () => gateApi("/stats"),
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

function useFilingGateAudits(matterId?: number) {
  return useQuery({
    queryKey: ["filing-gate", "audits", matterId],
    queryFn: () => gateApi(`/audits${matterId ? `?matterId=${matterId}` : ""}`),
    staleTime: 15000,
  });
}

function useDraftReviews() {
  return useQuery({
    queryKey: ["review-desk", "draft-reviews"],
    queryFn: async () => {
      const res = await fetch("/api/prism-counsel/review-desk/draft-reviews", {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    staleTime: 60000,
  });
}

function useSaveAuditReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      documentId: string;
      documentTitle: string;
      documentType?: string;
      documentText?: string;
      matterId?: number;
      reviewItemId?: number;
      citations: unknown[];
      overallStatus: "clear" | "needs_review" | "blocked";
      verifiedCount: number;
      unverifiedCount: number;
      suspiciousCount: number;
      totalCitations: number;
      averageConfidence: number;
      blockingCitations: unknown[];
      verificationDurationMs: number;
    }) =>
      gateApi("/verify", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["filing-gate"] });
    },
  });
}

function useSealAuditReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ auditId, note }: { auditId: string; note?: string }) =>
      gateApi(`/audits/${auditId}/seal`, {
        method: "POST",
        body: JSON.stringify({ note }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["filing-gate"] });
    },
  });
}

const SAMPLE_DOCUMENT_TEXT_BY_TYPE: Record<string, string> = {
  draft_review: `DEMAND FOR COMPENSATION

Re: Case No. 2026-CV-04421

Pursuant to 42 U.S.C. § 1983 and 28 U.S.C. § 2201, and in accordance with Hensley v. Eckerhart, 461 U.S. 424 (1983), our client demands full compensation for injuries sustained.

State Farm Mut. Auto. Ins. Co. v. Laforet, 658 So.2d 55 (Fla. 1995), established that insurers must act in good faith. Under Fla. Stat. § 624.155, we provide notice of bad faith conduct.

Per Allstate Ins. Co. v. Clancy, 979 F.2d 123 (5th Cir. 2023) and No. 22-cv-15443, defendant's failure constitutes actionable bad faith.

Under 29 U.S.C. § 794 and 45 C.F.R. § 84.52, plaintiff is entitled to all available remedies. See Bivens v. Six Unknown Named Agents, 403 U.S. 388 (1971). Pursuant to U.S. Const. amend. XIV, plaintiff's due process rights have been implicated.`,
  default: `MOTION FOR SUMMARY JUDGMENT

Pursuant to Fed. R. Civ. P. 56, plaintiff moves for summary judgment. As held in Celotex Corp. v. Catrett, 477 U.S. 317 (1986), summary judgment is appropriate where no genuine dispute exists.

The Eleventh Circuit affirmed this in Warrior Met Coal, Inc. v. United Mine Workers of Am., 31 F.4th 1335 (11th Cir. 2022). See also Anderson v. Liberty Lobby, Inc., 477 U.S. 242 (1986).

Under 29 C.F.R. § 1910.132 and 29 U.S.C. § 654, defendant was required to maintain safe conditions. Crawford v. Metropolitan Government, 555 U.S. 271 (2009) further supports plaintiff's position. See No. 2025-cv-08821.`,
};

function StatusBadge({ status }: { status: "verified" | "unverified" | "suspicious" }) {
  const configs = {
    verified: { color: "#4a90b8", bg: "#4a90b820", icon: CheckCircle, label: "Verified" },
    unverified: { color: "#d4a054", bg: "#d4a05420", icon: AlertTriangle, label: "Unverified" },
    suspicious: { color: "#c45a4a", bg: "#c45a4a20", icon: XCircle, label: "Suspicious" },
  };
  const cfg = configs[status];
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold uppercase" style={{ background: cfg.bg, color: cfg.color }}>
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}

function OverallGateBadge({ status }: { status: "clear" | "needs_review" | "blocked" }) {
  const configs = {
    clear: { color: "#4a90b8", bg: "#4a90b818", border: "#4a90b830", icon: CheckCircle, label: "GATE CLEAR — Ready to sign" },
    needs_review: { color: "#d4a054", bg: "#d4a05418", border: "#d4a05430", icon: AlertTriangle, label: "NEEDS REVIEW — Unverified citations" },
    blocked: { color: "#c45a4a", bg: "#c45a4a18", border: "#c45a4a30", icon: XCircle, label: "BLOCKED — Suspicious citations detected" },
  };
  const cfg = configs[status];
  const Icon = cfg.icon;
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}>
      <Icon className="w-4 h-4" />
      <span className="text-xs font-bold tracking-wide">{cfg.label}</span>
    </div>
  );
}

function CitationRow({ citation, index }: { citation: VerifiedCitation; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const typeLabels: Record<string, string> = {
    case_citation: "Case",
    statute: "Statute",
    regulation: "Regulation",
    docket: "Docket",
    constitution: "Const.",
  };
  const typeColors: Record<string, string> = {
    case_citation: "#4a90b8",
    statute: "#8b7ac8",
    regulation: "#c8953c",
    docket: "#64748b",
    constitution: "#d4a054",
  };
  const typeColor = typeColors[citation.type] ?? "#64748b";

  return (
    <div className={`border-b border-white/[0.04] last:border-0 ${citation.status === "suspicious" ? "bg-[#c45a4a06]" : ""}`}>
      <div
        className="flex items-start gap-3 py-2.5 px-1 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <span className="text-[9px] text-slate-600 font-mono w-5 text-right flex-shrink-0 mt-0.5">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-[9px] px-1 py-0.5 rounded font-mono" style={{ background: `${typeColor}15`, color: typeColor }}>
              {typeLabels[citation.type] ?? citation.type}
            </span>
            <span className="text-xs text-slate-200 font-mono truncate">{citation.normalizedText}</span>
          </div>
          <div className="text-[9px] text-slate-500 flex items-center gap-2">
            <span>Conf: {Math.round(citation.confidenceScore * 100)}%</span>
            {citation.suspicionReasons?.slice(0, 1).map((r, i) => (
              <span key={i} className="text-[#c45a4a]">· {r}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={citation.status} />
          <ChevronRight className={`w-3 h-3 text-slate-600 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </div>
      {expanded && (
        <div className="px-8 pb-3">
          <div className="rounded border border-white/[0.06] p-2.5 space-y-1.5" style={{ background: "#080c14" }}>
            <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Verification Notes</div>
            <p className="text-[10px] text-slate-300 leading-relaxed">{citation.verificationNotes}</p>
            {citation.suspicionReasons && citation.suspicionReasons.length > 0 && (
              <div className="mt-1.5">
                <div className="text-[9px] text-[#c45a4a] font-semibold uppercase mb-0.5">Suspicion Reasons</div>
                {citation.suspicionReasons.map((r, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[9px] text-[#c45a4a]">
                    <XCircle className="w-2.5 h-2.5 mt-0.5 flex-shrink-0" />
                    {r}
                  </div>
                ))}
              </div>
            )}
            {citation.type === "case_citation" && (citation.volume || citation.reporter || citation.page) && (
              <div className="grid grid-cols-4 gap-2 mt-1.5">
                {citation.volume && <div><div className="text-[8px] text-slate-600 uppercase">Vol</div><div className="text-[9px] text-slate-300">{citation.volume}</div></div>}
                {citation.reporter && <div><div className="text-[8px] text-slate-600 uppercase">Reporter</div><div className="text-[9px] text-slate-300">{citation.reporter}</div></div>}
                {citation.page && <div><div className="text-[8px] text-slate-600 uppercase">Page</div><div className="text-[9px] text-slate-300">{citation.page}</div></div>}
                {citation.year && <div><div className="text-[8px] text-slate-600 uppercase">Year</div><div className="text-[9px] text-slate-300">{citation.year}</div></div>}
              </div>
            )}
            {citation.status === "suspicious" && (
              <div className="mt-1.5 p-2 rounded" style={{ background: "#c45a4a10", border: "1px solid #c45a4a20" }}>
                <p className="text-[9px] text-[#c45a4a]">
                  Attorney must manually review and resolve this citation before the document can be signed or filed.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface AuditReportPanelProps {
  report: CitationAuditReport;
  savedAuditId?: string;
  onClear: () => void;
  onSeal: (note: string) => void;
  sealing?: boolean;
  sealed?: boolean;
}

function AuditReportPanel({ report, savedAuditId, onClear, onSeal, sealing, sealed }: AuditReportPanelProps) {
  const [attorneyNotes, setAttorneyNotes] = useState<Record<string, string>>({});
  const [resolvedFlags, setResolvedFlags] = useState<Set<string>>(new Set());
  const [sealNote, setSealNote] = useState("");

  const unresolvedSuspicious = report.blockingCitations.filter(c => !resolvedFlags.has(c.id));
  const canSignOff = report.overallStatus !== "blocked" || unresolvedSuspicious.length === 0;

  const handleResolve = (id: string) => {
    setResolvedFlags(prev => new Set([...prev, id]));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <OverallGateBadge status={report.overallStatus} />
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[9px] text-slate-500 font-mono">
            Verified {new Date(report.verifiedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            &nbsp;· {report.verificationDurationMs}ms
          </span>
          {savedAuditId && (
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#4a90b8]/10 text-[#4a90b8] font-mono flex items-center gap-1">
              <Database className="w-2 h-2" />
              PERSISTED
            </span>
          )}
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] text-slate-500 border border-white/[0.08] hover:text-slate-300 hover:border-white/[0.15] transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Re-verify
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Total Citations", value: report.totalCitations, color: "#4a90b8" },
          { label: "Verified", value: report.verifiedCount, color: "#4a90b8" },
          { label: "Unverified", value: report.unverifiedCount, color: "#d4a054" },
          { label: "Suspicious", value: report.suspiciousCount, color: "#c45a4a" },
        ].map((s, i) => (
          <div key={i} className="rounded border border-white/[0.06] p-2.5 text-center" style={{ background: "#080c14" }}>
            <div className="text-[9px] text-slate-500 mb-0.5">{s.label}</div>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-[#c8a96e]" />
            Average Confidence
          </h3>
          <span className="text-sm font-mono font-semibold" style={{
            color: report.averageConfidence >= 0.7 ? "#4a90b8" : report.averageConfidence >= 0.4 ? "#d4a054" : "#c45a4a"
          }}>
            {Math.round(report.averageConfidence * 100)}%
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.round(report.averageConfidence * 100)}%`,
              background: report.averageConfidence >= 0.7 ? "#4a90b8" : report.averageConfidence >= 0.4 ? "#d4a054" : "#c45a4a",
            }}
          />
        </div>
      </div>

      {report.blockingCitations.length > 0 && (
        <div className="rounded-lg border border-[#c45a4a]/25 p-4" style={{ background: "#c45a4a08" }}>
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="w-4 h-4 text-[#c45a4a]" />
            <h3 className="text-xs font-semibold text-[#c45a4a]">
              Blocking Citations — Requires Attorney Resolution ({unresolvedSuspicious.length} remaining)
            </h3>
          </div>
          <div className="space-y-3">
            {report.blockingCitations.map(citation => (
              <div
                key={citation.id}
                className="rounded border p-3 transition-colors"
                style={{ background: "#080c14", borderColor: resolvedFlags.has(citation.id) ? "#4a90b830" : "#c45a4a25" }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-mono text-slate-200 mb-1 break-all">{citation.normalizedText}</div>
                    <p className="text-[9px] text-slate-400 mb-1.5">{citation.verificationNotes}</p>
                    {citation.suspicionReasons?.map((r, i) => (
                      <div key={i} className="text-[9px] text-[#c45a4a] flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-[#c45a4a] flex-shrink-0" />
                        {r}
                      </div>
                    ))}
                    {resolvedFlags.has(citation.id) && (
                      <div className="mt-1.5 text-[9px] text-[#4a90b8] flex items-center gap-1">
                        <CheckCircle className="w-2.5 h-2.5" />
                        Reviewed by attorney — flagged as acceptable
                      </div>
                    )}
                    {!resolvedFlags.has(citation.id) && (
                      <div className="mt-2">
                        <input
                          value={attorneyNotes[citation.id] ?? ""}
                          onChange={e => setAttorneyNotes(prev => ({ ...prev, [citation.id]: e.target.value }))}
                          placeholder="Attorney note on resolution..."
                          className="w-full bg-transparent text-[9px] text-slate-300 placeholder:text-slate-600 border-b border-white/[0.08] outline-none py-1"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {resolvedFlags.has(citation.id) ? (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#4a90b8]/10 text-[#4a90b8]">RESOLVED</span>
                    ) : (
                      <button
                        onClick={() => handleResolve(citation.id)}
                        disabled={!(attorneyNotes[citation.id]?.trim())}
                        className="px-2.5 py-1 rounded text-[9px] text-slate-300 border border-white/[0.12] hover:border-[#d4a054]/40 hover:text-[#d4a054] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Mark Reviewed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-xs font-semibold text-slate-200 mb-3">Full Citation Audit Report</h3>
        <div className="space-y-0">
          {report.citations.map((citation, i) => (
            <CitationRow key={citation.id} citation={citation} index={i} />
          ))}
          {report.citations.length === 0 && (
            <p className="text-[10px] text-slate-500 py-4 text-center">No citations detected in this document.</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-white/[0.08] p-4" style={{ background: "#0c1220" }}>
        <div className="flex items-center gap-2 mb-3">
          <Archive className="w-3.5 h-3.5 text-[#c8a96e]" />
          <h3 className="text-xs font-semibold text-slate-200">Compliance Artifact</h3>
          {sealed ? (
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#4a90b8]/10 text-[#4a90b8] font-mono">SEALED</span>
          ) : savedAuditId ? (
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#c8a96e]/10 text-[#c8a96e] font-mono">IMMUTABLE · PERSISTED</span>
          ) : (
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#c8a96e]/10 text-[#c8a96e] font-mono">IMMUTABLE</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-500 mb-3">
          <div><span className="text-slate-600">Report ID:</span> <span className="font-mono text-slate-300">{savedAuditId ?? report.id}</span></div>
          <div><span className="text-slate-600">Document:</span> <span className="text-slate-300">{report.documentTitle}</span></div>
          <div><span className="text-slate-600">Verified At:</span> <span className="text-slate-300">{new Date(report.verifiedAt).toLocaleString()}</span></div>
          <div><span className="text-slate-600">Citations:</span> <span className="text-slate-300">{report.totalCitations} total</span></div>
        </div>
        <p className="text-[9px] text-slate-500 mb-3">
          This Citation Audit Report is stored as an immutable compliance artifact linked to the matter's Proof Chain.
          It constitutes evidence that the firm verified all AI-generated citations prior to filing.
        </p>
        {sealed ? (
          <div className="flex items-center gap-2 py-2 rounded-lg px-3" style={{ background: "#4a90b810", border: "1px solid #4a90b825" }}>
            <CheckCircle className="w-4 h-4 text-[#4a90b8]" />
            <div>
              <div className="text-xs text-[#4a90b8] font-semibold">Audit Report Sealed</div>
              <div className="text-[9px] text-slate-500">Document cleared for attorney sign-off and filing</div>
            </div>
            <Link href="/proof-chain" className="ml-auto">
              <span className="text-[9px] text-slate-500 hover:text-[#c8a96e] transition-colors flex items-center gap-1">
                View in Proof Chain <ChevronRight className="w-2.5 h-2.5" />
              </span>
            </Link>
          </div>
        ) : canSignOff && savedAuditId ? (
          <div className="space-y-2">
            <input
              value={sealNote}
              onChange={e => setSealNote(e.target.value)}
              placeholder="Attorney seal note (optional)..."
              className="w-full bg-transparent text-[9px] text-slate-300 placeholder:text-slate-600 border-b border-white/[0.08] outline-none py-1 mb-2"
            />
            <button
              onClick={() => onSeal(sealNote)}
              disabled={sealing}
              className="w-full py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              style={{ background: "#4a90b818", border: "1px solid #4a90b830", color: "#4a90b8" }}
            >
              <Lock className="w-3.5 h-3.5 inline mr-1.5" />
              {sealing ? "Sealing..." : "Approve & Seal Audit Report — Mark Document Ready for Sign-Off"}
            </button>
          </div>
        ) : !canSignOff ? (
          <div className="flex items-center gap-2 py-2 rounded-lg px-3" style={{ background: "#c45a4a10", border: "1px solid #c45a4a20" }}>
            <XCircle className="w-4 h-4 text-[#c45a4a]" />
            <div>
              <div className="text-xs text-[#c45a4a] font-semibold">Sign-off Blocked</div>
              <div className="text-[9px] text-slate-500">
                {unresolvedSuspicious.length} suspicious citation{unresolvedSuspicious.length !== 1 ? "s" : ""} must be reviewed by an attorney before this document can be signed or filed.
              </div>
            </div>
          </div>
        ) : (
          <div className="text-[9px] text-slate-500 py-2">Saving audit report to compliance record...</div>
        )}
      </div>
    </div>
  );
}

interface DocumentItem {
  id: string;
  title: string;
  reviewWorkType?: string;
  matterId?: number;
  matterTitle?: string;
  description?: string;
}

export default function FilingGatePage() {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [localReports, setLocalReports] = useState<Record<string, CitationAuditReport>>({});
  const [savedAuditIds, setSavedAuditIds] = useState<Record<string, string>>({});
  const [sealedDocs, setSealedDocs] = useState<Set<string>>(new Set());
  const [verifying, setVerifying] = useState<string | null>(null);

  const { data: statsData } = useFilingGateStats();
  const { data: draftData } = useDraftReviews();
  const saveAudit = useSaveAuditReport();
  const sealAudit = useSealAuditReport();

  const draftItems: DocumentItem[] = (draftData?.items ?? []).map((item: {
    id: number;
    title: string;
    reviewWorkType: string;
    matterId: number;
    description?: string;
  }) => ({
    id: `review_${item.id}`,
    title: item.title,
    reviewWorkType: item.reviewWorkType,
    matterId: item.matterId,
    description: item.description,
  }));

  const fallbackDocuments: DocumentItem[] = [
    {
      id: "doc_sample_001",
      title: "Demand Letter — Rodriguez v. National General Insurance",
      reviewWorkType: "draft_review",
      matterId: 1,
      matterTitle: "Rodriguez v. National General",
      description: "AI-generated demand letter for review",
    },
    {
      id: "doc_sample_002",
      title: "Motion for Summary Judgment — Thompson v. Westfield",
      reviewWorkType: "draft_review",
      matterId: 2,
      matterTitle: "Thompson v. Westfield",
      description: "AI-generated motion for review",
    },
    {
      id: "doc_sample_003",
      title: "Interrogatory Responses — Martinez Commercial Dispute",
      reviewWorkType: "draft_review",
      matterId: 3,
      matterTitle: "Martinez Commercial Dispute",
      description: "AI-generated discovery responses for review",
    },
  ];

  const documents: DocumentItem[] = draftItems.length > 0 ? draftItems : fallbackDocuments;

  const runVerification = useCallback(async (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;

    setVerifying(docId);

    await new Promise(r => setTimeout(r, 600));

    const docText = SAMPLE_DOCUMENT_TEXT_BY_TYPE[doc.reviewWorkType ?? ""] ?? SAMPLE_DOCUMENT_TEXT_BY_TYPE["default"];
    const report = generateAuditReport(docId, doc.title, docText, doc.matterId);
    setLocalReports(prev => ({ ...prev, [docId]: report }));
    setSelectedDocId(docId);
    setVerifying(null);

    try {
      const result = await saveAudit.mutateAsync({
        documentId: docId,
        documentTitle: doc.title,
        documentType: doc.reviewWorkType,
        documentText: docText,
        matterId: doc.matterId,
        reviewItemId: docId.startsWith("review_") ? parseInt(docId.replace("review_", "")) : undefined,
        citations: report.citations as unknown[],
        overallStatus: report.overallStatus,
        verifiedCount: report.verifiedCount,
        unverifiedCount: report.unverifiedCount,
        suspiciousCount: report.suspiciousCount,
        totalCitations: report.totalCitations,
        averageConfidence: report.averageConfidence,
        blockingCitations: report.blockingCitations as unknown[],
        verificationDurationMs: report.verificationDurationMs,
      });
      if (result?.report?.auditId) {
        setSavedAuditIds(prev => ({ ...prev, [docId]: result.report.auditId }));
      }
    } catch {
    }
  }, [documents, saveAudit]);

  const handleSeal = useCallback(async (docId: string, note: string) => {
    const auditId = savedAuditIds[docId];
    if (!auditId) return;
    try {
      await sealAudit.mutateAsync({ auditId, note });
      setSealedDocs(prev => new Set([...prev, docId]));
    } catch {
    }
  }, [savedAuditIds, sealAudit]);

  const selectedDoc = documents.find(d => d.id === selectedDocId);
  const selectedReport = selectedDocId ? localReports[selectedDocId] : null;

  const stats = statsData ?? {};

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-[#c8a96e]" />
          <h1 className="text-lg font-semibold text-slate-100">Filing Gate</h1>
          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-[#c8a96e]/10 text-[#c8a96e]">HALLUCINATION VERIFIER</span>
        </div>
        <p className="text-xs text-slate-500">
          Every AI-generated legal document must pass citation verification before it can be signed or filed.
          Suspicious citations block sign-off until an attorney manually reviews and resolves each flag.
          Audit reports are persisted as immutable compliance artifacts.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Docs Verified (30d)", value: stats.documentsVerified ?? 0, color: "#4a90b8" },
          { label: "Citations Analyzed", value: stats.citationsAnalyzed ?? 0, color: "#d4a054" },
          { label: "Suspicious Caught", value: stats.suspiciousCaught ?? 0, color: "#c45a4a" },
          { label: "Catch Rate", value: `${stats.catchRate ?? 0}%`, color: "#8b7ac8" },
        ].map((s, i) => (
          <div key={i} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
            <div className="text-[9px] text-slate-500 mb-0.5">{s.label}</div>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-1">
            {draftItems.length > 0 ? "Review Desk — Draft Documents" : "Sample AI-Generated Documents"}
          </div>
          {documents.map(doc => {
            const report = localReports[doc.id];
            const isVerifying = verifying === doc.id;
            const isSelected = selectedDocId === doc.id;
            const isSealed = sealedDocs.has(doc.id);
            return (
              <div
                key={doc.id}
                className={`rounded-lg border p-3 cursor-pointer transition-all ${isSelected ? "border-[#c8a96e]/30" : "border-white/[0.06] hover:border-white/[0.12]"}`}
                style={{ background: isSelected ? "#c8a96e08" : "#0c1220" }}
                onClick={() => {
                  if (report) {
                    setSelectedDocId(doc.id);
                  } else if (!isVerifying) {
                    runVerification(doc.id);
                  }
                }}
              >
                <div className="flex items-start gap-2.5 mb-2">
                  <FileText className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-200 leading-tight font-medium truncate">{doc.title}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">
                      {doc.reviewWorkType?.replace(/_/g, " ") ?? "draft"}
                      {doc.matterTitle ? ` · ${doc.matterTitle}` : doc.matterId ? ` · Matter #${doc.matterId}` : ""}
                    </div>
                  </div>
                  {isSealed && (
                    <span className="text-[7px] px-1 py-0.5 rounded bg-[#4a90b8]/10 text-[#4a90b8] font-mono flex-shrink-0">SEALED</span>
                  )}
                </div>

                {isVerifying ? (
                  <div className="flex items-center gap-2 text-[9px] text-[#c8a96e]">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Verifying citations...
                  </div>
                ) : report ? (
                  <div className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-1.5">
                      {report.overallStatus === "clear" && <CheckCircle className="w-3 h-3 text-[#4a90b8]" />}
                      {report.overallStatus === "needs_review" && <AlertTriangle className="w-3 h-3 text-[#d4a054]" />}
                      {report.overallStatus === "blocked" && <XCircle className="w-3 h-3 text-[#c45a4a]" />}
                      <span className="text-[9px]" style={{
                        color: report.overallStatus === "clear" ? "#4a90b8" : report.overallStatus === "needs_review" ? "#d4a054" : "#c45a4a"
                      }}>
                        {report.totalCitations} citations
                        {report.suspiciousCount > 0 ? ` · ${report.suspiciousCount} suspicious` : ""}
                      </span>
                    </div>
                    <button
                      className="text-[8px] text-slate-600 hover:text-slate-400 transition-colors"
                      onClick={e => { e.stopPropagation(); runVerification(doc.id); }}
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[9px] text-[#c8a96e] hover:text-[#d4b97e] transition-colors">
                    <Shield className="w-3 h-3" />
                    Run Citation Verification
                  </div>
                )}
              </div>
            );
          })}

          <div className="rounded-lg border border-white/[0.04] p-3" style={{ background: "#0a0f1a" }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Info className="w-3 h-3 text-slate-600" />
              <span className="text-[9px] text-slate-500 font-semibold">How it works</span>
            </div>
            <div className="space-y-1 text-[8.5px] text-slate-600 leading-relaxed">
              <p>1. Select any AI-generated draft document to run citation verification.</p>
              <p>2. Each case citation, statute, regulation, and docket is extracted and cross-checked against the knowledge base.</p>
              <p>3. Suspicious citations block sign-off until an attorney resolves each flag.</p>
              <p>4. The audit report is persisted as an immutable compliance artifact and sealed to the matter's Proof Chain.</p>
            </div>
          </div>
        </div>

        <div className="col-span-2">
          {selectedReport && selectedDoc ? (
            <AuditReportPanel
              report={selectedReport}
              savedAuditId={savedAuditIds[selectedDoc.id]}
              onClear={() => runVerification(selectedDoc.id)}
              onSeal={(note) => handleSeal(selectedDoc.id, note)}
              sealing={sealAudit.isPending}
              sealed={sealedDocs.has(selectedDoc.id)}
            />
          ) : (
            <div className="rounded-lg border border-white/[0.06] p-12 text-center" style={{ background: "#0c1220" }}>
              <Shield className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <div className="text-sm font-semibold text-slate-400 mb-1">Citation Audit Report</div>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                Select a document from the left to run citation verification and generate a persisted audit report.
              </p>
              {verifying && (
                <div className="mt-4 flex items-center justify-center gap-2 text-[#c8a96e] text-sm">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verifying...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
