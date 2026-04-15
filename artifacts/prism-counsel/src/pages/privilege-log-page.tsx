import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Lock, Shield, CheckCircle2, AlertCircle, Download, Eye, RotateCcw, RefreshCw, FileText, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

type PrivilegeType = "attorney_client" | "work_product" | "joint_defense" | "common_interest" | "none";
type ReviewState = "unreviewed" | "confirmed" | "waived" | "disputed";
type PageTab = "log" | "review_queue" | "clawback";

interface PrivilegeLogEntry {
  id: string;
  matterId: number;
  documentType: string;
  title: string;
  date: string;
  author: string;
  recipients: string[];
  subject: string;
  privilegeType: PrivilegeType;
  basis: string;
  reviewState: ReviewState;
  clawbackStatus: "none" | "requested" | "approved";
}

interface ReviewQueueItem {
  id: string;
  matterId: number;
  title: string;
  documentType: string;
  privilegeType: PrivilegeType;
  basis: string;
  taggedAt: string;
}

const PRIVILEGE_COLORS: Record<PrivilegeType, string> = {
  attorney_client: "#8b7ac8",
  work_product: "#4a90b8",
  joint_defense: "#5aa87a",
  common_interest: "#d4a054",
  none: "#8a7a6a",
};

const PRIVILEGE_LABELS: Record<PrivilegeType, string> = {
  attorney_client: "Attorney-Client",
  work_product: "Work Product",
  joint_defense: "Joint Defense",
  common_interest: "Common Interest",
  none: "Not Privileged",
};

const DEMO_LOG = [
  {
    id: "priv_001", matterId: 1, documentType: "demand_letter",
    title: "Demand Letter Draft v3 — Rodriguez", date: "2026-04-01",
    author: "Sarah Chen (Attorney)", recipients: ["Maria Rodriguez (Client)"],
    subject: "Demand package for National General — Review and approval requested",
    privilegeType: "attorney_client" as PrivilegeType, basis: "Attorney-client privilege (Rule 1.6, FRE 502)",
    reviewState: "confirmed" as ReviewState, clawbackStatus: "none" as const,
  },
  {
    id: "priv_002", matterId: 1, documentType: "legal_memo",
    title: "Case Strategy Memo — Thompson Mediation", date: "2026-03-28",
    author: "James Whitfield (Attorney)", recipients: ["Sarah Chen (Attorney)", "Partner Committee"],
    subject: "Internal strategy memo — mediation approach and settlement range",
    privilegeType: "work_product" as PrivilegeType, basis: "Work product doctrine (FRCP 26(b)(3))",
    reviewState: "unreviewed" as ReviewState, clawbackStatus: "none" as const,
  },
  {
    id: "priv_003", matterId: 1, documentType: "agreement",
    title: "Joint Defense Agreement — Meridian coordination", date: "2026-03-20",
    author: "David Hargrove (Counsel)", recipients: ["Sarah Chen (Attorney)", "James Whitfield (Attorney)"],
    subject: "Joint defense agreement and shared investigation materials",
    privilegeType: "joint_defense" as PrivilegeType, basis: "Joint defense / common interest privilege",
    reviewState: "confirmed" as ReviewState, clawbackStatus: "none" as const,
  },
  {
    id: "priv_004", matterId: 2, documentType: "email",
    title: "Settlement authority discussion — Thompson", date: "2026-03-15",
    author: "Sarah Chen (Attorney)", recipients: ["Robert Thompson (Client)"],
    subject: "Settlement authority and recommended approach",
    privilegeType: "attorney_client" as PrivilegeType, basis: "Attorney-client privilege (Rule 1.6, FRE 502)",
    reviewState: "unreviewed" as ReviewState, clawbackStatus: "requested" as const,
  },
];

const DEMO_REVIEW_QUEUE = [
  {
    id: "priv_002", matterId: 1, title: "Case Strategy Memo — Thompson Mediation",
    documentType: "legal_memo", privilegeType: "work_product" as PrivilegeType,
    basis: "Work product doctrine (FRCP 26(b)(3))",
    taggedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "priv_004", matterId: 2, title: "Settlement authority discussion — Thompson",
    documentType: "email", privilegeType: "attorney_client" as PrivilegeType,
    basis: "Attorney-client privilege (Rule 1.6, FRE 502)",
    taggedAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE}/api/prism-counsel${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", "x-requested-with": "XMLHttpRequest", ...opts?.headers },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`API ${path} failed`);
  const json = await res.json();
  return json.data ?? json;
}

function ReviewStateBadge({ state }: { state: ReviewState }) {
  const cfg: Record<ReviewState, { color: string; label: string }> = {
    unreviewed: { color: "#d4a054", label: "UNREVIEWED" },
    confirmed: { color: "#5aa87a", label: "CONFIRMED" },
    waived: { color: "#c45a4a", label: "WAIVED" },
    disputed: { color: "#4a90b8", label: "DISPUTED" },
  };
  const c = cfg[state];
  return (
    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: c.color + "20", color: c.color }}>
      {c.label}
    </span>
  );
}

export default function PrivilegeLogPage() {
  const [tab, setTab] = useState<PageTab>("log");
  const [matterFilter, setMatterFilter] = useState<number | "all">("all");
  const [reviewDecisions, setReviewDecisions] = useState<Record<string, ReviewState>>({});
  const [clawbackId, setClawbackId] = useState<string | null>(null);
  const [clawbackReason, setClawbackReason] = useState("");
  const [resolving, setResolving] = useState<string | null>(null);
  const [requesting, setRequesting] = useState<string | null>(null);
  const qc = useQueryClient();

  const logQuery = useQuery({
    queryKey: ["privilege-log", matterFilter],
    queryFn: () => apiFetch(`/privilege/log?matterId=${matterFilter}`),
    enabled: matterFilter !== "all",
    staleTime: 30000,
    retry: 1,
  });

  const queueQuery = useQuery({
    queryKey: ["privilege-review-queue"],
    queryFn: () => apiFetch("/privilege/review-queue"),
    enabled: tab === "review_queue",
    staleTime: 30000,
    retry: 1,
  });

  const logEntries = logQuery.data?.entries?.length
    ? logQuery.data.entries
    : DEMO_LOG.filter(e => matterFilter === "all" || e.matterId === matterFilter);
  const queueItems = queueQuery.data?.items?.length ? queueQuery.data.items : DEMO_REVIEW_QUEUE;
  const isLive = matterFilter !== "all" && !!logQuery.data?.entries?.length;

  async function handleResolve(tagId: string, decision: "confirmed" | "waived" | "disputed") {
    if (!isLive) return;
    const numericId = Number(tagId);
    if (isNaN(numericId)) return;
    setResolving(tagId);
    try {
      await apiFetch(`/privilege/review/${numericId}/resolve`, {
        method: "POST",
        body: JSON.stringify({ decision, reviewedBy: 1 }),
      });
      setReviewDecisions(prev => ({ ...prev, [tagId]: decision }));
      qc.invalidateQueries({ queryKey: ["privilege-log"] });
      qc.invalidateQueries({ queryKey: ["privilege-review-queue"] });
      qc.invalidateQueries({ queryKey: ["privilege-stats"] });
    } catch { /* error is silently skipped; retry on next refresh */ }
    setResolving(null);
  }

  async function handleClawback(tagId: string) {
    if (!isLive) return;
    if (!clawbackReason.trim()) return;
    const numericId = Number(tagId);
    if (isNaN(numericId)) return;
    setRequesting(tagId);
    try {
      await apiFetch(`/privilege/clawback/${numericId}`, {
        method: "POST",
        body: JSON.stringify({ reason: clawbackReason, requestedBy: 1 }),
      });
      qc.invalidateQueries({ queryKey: ["privilege-log"] });
      setClawbackId(null);
      setClawbackReason("");
    } catch { /* error is silently skipped; retry on next refresh */ }
    setRequesting(null);
  }

  const tabs: { id: PageTab; label: string; count?: number }[] = [
    { id: "log", label: "Privilege Log", count: logEntries.length },
    { id: "review_queue", label: "Review Queue", count: (queueItems as ReviewQueueItem[]).filter(q => !reviewDecisions[q.id]).length },
    { id: "clawback", label: "Clawback Tracker", count: (logEntries as PrivilegeLogEntry[]).filter(e => e.clawbackStatus === "requested").length },
  ];

  return (
    <div className="p-5 max-w-[1000px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#8b7ac8]" />
          <h1 className="text-sm font-semibold text-slate-200">Privilege Log & Review</h1>
          <span className={cn(
            "px-1.5 py-0.5 rounded text-[9px] font-medium",
            isLive ? "bg-[#5aa87a]/10 text-[#5aa87a] border border-[#5aa87a]/20" : "bg-slate-500/10 text-slate-500 border border-white/[0.06]"
          )}>
            {isLive ? "LIVE" : "DEMO"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={String(matterFilter)}
            onChange={e => setMatterFilter(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            className="px-2 py-1 rounded text-[11px] bg-white/[0.04] border border-white/[0.08] text-slate-300 focus:outline-none"
          >
            <option value="all" style={{ background: "#0c1220" }}>All Matters</option>
            <option value="1" style={{ background: "#0c1220" }}>Matter #1 — Rodriguez</option>
            <option value="2" style={{ background: "#0c1220" }}>Matter #2 — Thompson</option>
          </select>
          <button
            onClick={() => { logQuery.refetch(); queueQuery.refetch(); }}
            className="p-1.5 rounded border border-white/[0.06] text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Privileged", value: logEntries.length, color: "#8b7ac8" },
          { label: "Unreviewed", value: (logEntries as PrivilegeLogEntry[]).filter(e => (reviewDecisions[e.id] ?? e.reviewState) === "unreviewed").length, color: "#d4a054" },
          { label: "Confirmed", value: (logEntries as PrivilegeLogEntry[]).filter(e => (reviewDecisions[e.id] ?? e.reviewState) === "confirmed").length, color: "#5aa87a" },
          { label: "Clawback Req", value: (logEntries as PrivilegeLogEntry[]).filter(e => e.clawbackStatus === "requested").length, color: "#c45a4a" },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
            <div className="text-[10px] text-slate-500 mb-1">{kpi.label}</div>
            <div className="text-xl font-bold font-mono" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-white/[0.06] pb-px">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-xs rounded-t transition-colors",
              tab === t.id ? "bg-white/[0.06] text-slate-100 border-b-2 border-[#8b7ac8]" : "text-slate-500 hover:text-slate-300"
            )}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="px-1 rounded text-[9px] bg-[#8b7ac8]/20 text-[#8b7ac8]">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "log" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-slate-500">{logEntries.length} privileged items · Auto-generated privilege log</div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-[#4a90b8]/10 border border-[#4a90b8]/20 text-[#4a90b8] hover:bg-[#4a90b8]/20 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export Privilege Log
            </button>
          </div>
          {(logEntries as PrivilegeLogEntry[]).map((entry) => {
            const displayState = reviewDecisions[entry.id] ?? entry.reviewState;
            return (
              <div key={entry.id} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{entry.title}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{entry.documentType?.replace("_", " ")} · {entry.date}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: PRIVILEGE_COLORS[entry.privilegeType as PrivilegeType] + "20", color: PRIVILEGE_COLORS[entry.privilegeType as PrivilegeType] }}>
                      {PRIVILEGE_LABELS[entry.privilegeType as PrivilegeType]}
                    </span>
                    <ReviewStateBadge state={displayState} />
                    {entry.clawbackStatus === "requested" && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#c45a4a]/10 text-[#c45a4a]">CLAWBACK</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 mb-2">
                  <div><span className="text-slate-400">Author:</span> {entry.author}</div>
                  <div><span className="text-slate-400">Recipients:</span> {entry.recipients?.join(", ")}</div>
                  <div className="col-span-2"><span className="text-slate-400">Subject:</span> {entry.subject}</div>
                  <div className="col-span-2"><span className="text-slate-400">Basis:</span> {entry.basis}</div>
                </div>
              </div>
            );
          })}
          {logEntries.length === 0 && (
            <div className="rounded-lg border border-white/[0.06] p-8 text-center text-xs text-slate-500" style={{ background: "#0c1220" }}>
              No privileged items logged for this matter
            </div>
          )}
        </div>
      )}

      {tab === "review_queue" && (
        <div className="space-y-3">
          <div className="text-[10px] text-slate-500">
            Attorney review required — confirm, waive, or dispute each privilege designation
          </div>
          {(queueItems as ReviewQueueItem[]).filter((item) => !reviewDecisions[item.id]).map((item) => (
            <div key={item.id} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="text-xs font-semibold text-slate-200">{item.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{item.documentType?.replace("_", " ")}</div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium flex-shrink-0" style={{ background: PRIVILEGE_COLORS[item.privilegeType as PrivilegeType] + "20", color: PRIVILEGE_COLORS[item.privilegeType as PrivilegeType] }}>
                  {PRIVILEGE_LABELS[item.privilegeType as PrivilegeType]}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mb-3">{item.basis}</div>
              {!isLive && (
                <div className="text-[10px] text-slate-500 italic mb-1">Select a specific matter above to enable live review actions</div>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleResolve(item.id, "confirmed")}
                  disabled={resolving === item.id || !isLive}
                  title={!isLive ? "Select a matter to enable" : "Confirm privilege designation"}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] bg-[#5aa87a]/10 border border-[#5aa87a]/20 text-[#5aa87a] hover:bg-[#5aa87a]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckCircle2 className="w-3 h-3" /> Confirm Privilege
                </button>
                <button
                  onClick={() => handleResolve(item.id, "waived")}
                  disabled={resolving === item.id || !isLive}
                  title={!isLive ? "Select a matter to enable" : "Waive privilege"}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] bg-[#c45a4a]/10 border border-[#c45a4a]/20 text-[#c45a4a] hover:bg-[#c45a4a]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <AlertCircle className="w-3 h-3" /> Waive
                </button>
                <button
                  onClick={() => handleResolve(item.id, "disputed")}
                  disabled={resolving === item.id || !isLive}
                  title={!isLive ? "Select a matter to enable" : "Dispute privilege designation"}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] bg-[#4a90b8]/10 border border-[#4a90b8]/20 text-[#4a90b8] hover:bg-[#4a90b8]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Eye className="w-3 h-3" /> Dispute
                </button>
                {resolving === item.id && <RefreshCw className="w-3.5 h-3.5 text-slate-500 animate-spin" />}
              </div>
            </div>
          ))}
          {Object.keys(reviewDecisions).length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] text-slate-500">Resolved in this session</div>
              {Object.entries(reviewDecisions).map(([id, decision]) => {
                const item = (queueItems as ReviewQueueItem[]).find(q => q.id === id);
                if (!item) return null;
                return (
                  <div key={id} className="rounded-lg border border-white/[0.04] p-3 flex items-center justify-between" style={{ background: "#080c14" }}>
                    <div className="text-xs text-slate-400">{item.title}</div>
                    <ReviewStateBadge state={decision} />
                  </div>
                );
              })}
            </div>
          )}
          {(queueItems as ReviewQueueItem[]).filter(item => !reviewDecisions[item.id]).length === 0 && Object.keys(reviewDecisions).length === 0 && (
            <div className="rounded-lg border border-white/[0.06] p-8 text-center" style={{ background: "#0c1220" }}>
              <CheckCircle2 className="w-6 h-6 text-[#5aa87a] mx-auto mb-2" />
              <div className="text-xs text-slate-400">No items pending privilege review</div>
            </div>
          )}
        </div>
      )}

      {tab === "clawback" && (
        <div className="space-y-3">
          <div className="text-[10px] text-slate-500 p-3 rounded border border-[#d4a054]/20 bg-[#d4a054]/5 text-[#d4a054]">
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            Clawback workflow — for inadvertently disclosed privileged documents under FRE 502(b). All clawback requests are logged in the audit trail.
          </div>
          {(logEntries as PrivilegeLogEntry[]).map((entry) => (
            <div key={entry.id} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="text-xs font-semibold text-slate-200">{entry.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{entry.date}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ background: PRIVILEGE_COLORS[entry.privilegeType as PrivilegeType] + "20", color: PRIVILEGE_COLORS[entry.privilegeType as PrivilegeType] }}>
                    {PRIVILEGE_LABELS[entry.privilegeType as PrivilegeType]}
                  </span>
                  {entry.clawbackStatus === "requested" && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#c45a4a]/10 text-[#c45a4a]">CLAWBACK REQUESTED</span>
                  )}
                </div>
              </div>
              {entry.clawbackStatus !== "requested" && (
                <>
                  {clawbackId === entry.id ? (
                    <div className="space-y-2 mt-2">
                      <textarea
                        value={clawbackReason}
                        onChange={e => setClawbackReason(e.target.value)}
                        placeholder="Describe the inadvertent disclosure and reason for clawback..."
                        rows={2}
                        className="w-full px-2 py-1.5 rounded text-xs bg-black/20 border border-white/[0.08] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#8b7ac8]/40 resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleClawback(entry.id)}
                          disabled={!clawbackReason.trim() || requesting === entry.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] bg-[#c45a4a]/10 border border-[#c45a4a]/20 text-[#c45a4a] hover:bg-[#c45a4a]/20 disabled:opacity-50 transition-colors"
                        >
                          {requesting === entry.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                          Submit Clawback Request
                        </button>
                        <button onClick={() => { setClawbackId(null); setClawbackReason(""); }} className="text-[10px] text-slate-500 hover:text-slate-300">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setClawbackId(entry.id)}
                      className="mt-2 flex items-center gap-1 text-[10px] text-[#c45a4a] hover:text-[#d46a5a] transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" /> Request Clawback
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
