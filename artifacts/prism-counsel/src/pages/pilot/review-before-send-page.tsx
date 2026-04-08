import { useState } from "react";
import { useReviews, useReview, useUpdateReviewState, useSubmitForSignoff } from "../../hooks/use-prism-pilot";
import { FileText, Shield, AlertTriangle, AlertCircle, Lock, CheckCircle, XCircle, Send, ChevronRight } from "lucide-react";

const DEMO_REVIEWS = [
  {
    id: 1, matterId: 1, reviewType: "chronology", title: "Reviewed Chronology — Rodriguez v. National General",
    draftContent: "CHRONOLOGY OF EVENTS\n\n2024-01-15: Motor vehicle accident at intersection of Queens Blvd and 63rd Road. Police report filed (#2024-QN-4782). Three vehicles involved.\n\n2024-01-16: Plaintiff transported to Queens Medical Center. Initial evaluation: cervical strain, lumbar disc herniation (L4-L5), right shoulder impingement.\n\n2024-01-22: Commenced physical therapy at Queens PT Associates. 3x/week protocol.\n\n2024-02-08: MRI confirms L4-L5 disc herniation. Referred to orthopedic specialist.\n\n2024-02-15: Orthopedic consultation with Dr. Martinez. Recommended continued PT, possible epidural injection.\n\n2024-03-01: First epidural injection (L4-L5). Partial relief reported.\n\n2024-03-28: Reserve increase notification from National General. Reserves raised from $15K to $28K.\n\n2024-03-30: IME report received — Dr. Whitmore (orthopedic). Findings consistent with treating physician.",
    sourceSupport: [
      { statement: "Police report filed (#2024-QN-4782)", source: "Police Report", confidence: 0.99 },
      { statement: "MRI confirms L4-L5 disc herniation", source: "Queens Medical Center MRI Report, Feb 8 2024", confidence: 0.97 },
      { statement: "Reserve increase from $15K to $28K", source: "National General correspondence, Mar 28 2024", confidence: 0.98 },
      { statement: "IME consistent with treating physician", source: "Dr. Whitmore IME Report, Mar 30 2024", confidence: 0.95 },
    ],
    unsupportedStatements: [
      { statement: "Three vehicles involved", note: "Police report mentions two vehicles. Verify with supplemental report." },
    ],
    contradictionWarnings: [],
    privilegeWarnings: [
      { content: "Draft chronology references internal case strategy discussion from Feb 20 meeting", type: "work_product" },
    ],
    reviewState: "pending", approvalState: "none", safeToSend: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 2, matterId: 1, reviewType: "partner_update", title: "Partner Update Memo — Rodriguez",
    draftContent: "PARTNER UPDATE\n\nRodriguez v. National General\nStatus: Active — Pre-Trial\n\nKey Development: Carrier raised reserves from $15K to $28K following updated medical documentation.\n\nRecommendation: Prepare revised demand package within 10 business days. Current demand readiness at 74%.",
    sourceSupport: [{ statement: "Reserves raised from $15K to $28K", source: "National General letter", confidence: 0.98 }],
    unsupportedStatements: [],
    contradictionWarnings: [],
    privilegeWarnings: [],
    reviewState: "reviewed", approvalState: "pending_signoff", safeToSend: false,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 3, matterId: 2, reviewType: "demand_section", title: "Demand Section — Chen v. Allstate (Damages)",
    draftContent: "DAMAGES SUMMARY\n\nMedical Expenses: $42,800\nLost Wages: $18,500\nPain & Suffering: $75,000 (estimated)\n\nTotal Special Damages: $61,300\nTotal Demand: $136,300",
    sourceSupport: [{ statement: "Medical expenses $42,800", source: "Medical billing summary", confidence: 0.96 }],
    unsupportedStatements: [{ statement: "Lost wages $18,500", note: "Wage verification incomplete — employer has not responded to verification request" }],
    contradictionWarnings: [{ items: ["Medical expenses claim of $42,800 vs billing summary showing $39,200", "Discrepancy of $3,600 requires reconciliation"] }],
    privilegeWarnings: [],
    reviewState: "pending", approvalState: "none", safeToSend: false,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
];

export default function ReviewBeforeSendPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data } = useReviews();
  const updateState = useUpdateReviewState();
  const submitSignoff = useSubmitForSignoff();

  const reviews = data?.reviews?.length ? data.reviews : DEMO_REVIEWS;
  const isDemo = !data?.reviews?.length;
  const selected = reviews.find((r: any) => r.id === selectedId) ?? reviews[0];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
            <Shield className="w-6 h-6 text-[#8b7ac8]" /> Review Before Send
          </h1>
          <p className="text-sm text-slate-400 mt-1">Governed review surface — verify source support, contradictions, and privilege before sign-off</p>
        </div>
        {isDemo && <span className="px-2 py-0.5 text-xs font-mono bg-amber-900/30 text-amber-400 rounded">DEMO</span>}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4 space-y-2">
          {reviews.map((r: any) => (
            <button key={r.id} onClick={() => setSelectedId(r.id)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${selected?.id === r.id ? "bg-slate-800/80 border-[#8b7ac8]/30" : "bg-slate-800/30 border-slate-700/30 hover:border-slate-600"}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-white truncate">{r.title}</span>
                <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge state={r.reviewState} />
                <span className="text-[10px] text-slate-500 capitalize">{r.reviewType?.replace(/_/g, " ")}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="col-span-8 space-y-4">
          {selected && (
            <>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-medium text-white">{selected.title}</h2>
                    <span className="text-xs text-slate-500 capitalize">{selected.reviewType?.replace(/_/g, " ")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <SafeToSendBadge safe={selected.safeToSend} />
                    <StatusBadge state={selected.reviewState} />
                    {selected.approvalState !== "none" && <StatusBadge state={selected.approvalState} />}
                  </div>
                </div>
                <div className="bg-slate-900/80 rounded-lg p-4 font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {selected.draftContent}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                  <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                    <CheckCircle className="w-3.5 h-3.5" /> Source Support ({selected.sourceSupport?.length ?? 0})
                  </h3>
                  <div className="space-y-2">
                    {(selected.sourceSupport ?? []).map((s: any, i: number) => (
                      <div key={i} className="p-2 rounded bg-slate-900/50 text-xs">
                        <span className="text-white">"{s.statement}"</span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-slate-500">{s.source}</span>
                          <span className="text-emerald-400 font-mono">{Math.round(s.confidence * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {(selected.unsupportedStatements?.length ?? 0) > 0 && (
                    <div className="bg-slate-800/50 border border-amber-700/30 rounded-lg p-4">
                      <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-3.5 h-3.5" /> Unsupported ({selected.unsupportedStatements.length})
                      </h3>
                      {selected.unsupportedStatements.map((u: any, i: number) => (
                        <div key={i} className="p-2 rounded bg-slate-900/50 text-xs mb-2">
                          <span className="text-amber-400">"{u.statement}"</span>
                          <p className="text-slate-500 mt-0.5">{u.note}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {(selected.contradictionWarnings?.length ?? 0) > 0 && (
                    <div className="bg-slate-800/50 border border-red-700/30 rounded-lg p-4">
                      <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                        <AlertCircle className="w-3.5 h-3.5" /> Contradictions ({selected.contradictionWarnings.length})
                      </h3>
                      {selected.contradictionWarnings.map((c: any, i: number) => (
                        <div key={i} className="p-2 rounded bg-slate-900/50 text-xs text-red-300 mb-2">
                          {c.items?.map((item: string, j: number) => <p key={j}>{item}</p>)}
                        </div>
                      ))}
                    </div>
                  )}

                  {(selected.privilegeWarnings?.length ?? 0) > 0 && (
                    <div className="bg-slate-800/50 border border-purple-700/30 rounded-lg p-4">
                      <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                        <Lock className="w-3.5 h-3.5" /> Privilege Warnings ({selected.privilegeWarnings.length})
                      </h3>
                      {selected.privilegeWarnings.map((p: any, i: number) => (
                        <div key={i} className="p-2 rounded bg-slate-900/50 text-xs text-purple-300">{p.content}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                {selected.reviewState === "pending" && (
                  <>
                    <button onClick={() => updateState.mutate({ id: selected.id, state: "needs_revision" })}
                      className="px-4 py-2 text-sm rounded-lg border border-amber-700/30 text-amber-400 hover:bg-amber-900/20 transition-colors flex items-center gap-2">
                      <XCircle className="w-4 h-4" /> Needs Revision
                    </button>
                    <button onClick={() => updateState.mutate({ id: selected.id, state: "approved" })}
                      className="px-4 py-2 text-sm rounded-lg border border-emerald-700/30 text-emerald-400 hover:bg-emerald-900/20 transition-colors flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Approve Review
                    </button>
                  </>
                )}
                {selected.reviewState === "approved" && selected.approvalState === "none" && (
                  <button onClick={() => submitSignoff.mutate(selected.id)}
                    className="px-4 py-2 text-sm rounded-lg bg-[#8b7ac8]/20 border border-[#8b7ac8]/30 text-[#8b7ac8] hover:bg-[#8b7ac8]/30 transition-colors flex items-center gap-2">
                    <Send className="w-4 h-4" /> Submit for Sign-Off
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ state }: { state: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-900/30 text-amber-400",
    reviewed: "bg-blue-900/30 text-blue-400",
    approved: "bg-emerald-900/30 text-emerald-400",
    needs_revision: "bg-red-900/30 text-red-400",
    pending_signoff: "bg-purple-900/30 text-purple-400",
    none: "bg-slate-700/50 text-slate-500",
  };
  return <span className={`px-1.5 py-0.5 text-[10px] rounded ${styles[state] ?? styles.none}`}>{state?.replace(/_/g, " ")}</span>;
}

function SafeToSendBadge({ safe }: { safe: boolean }) {
  return safe
    ? <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-900/30 text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Safe to Send</span>
    : <span className="px-2 py-0.5 text-[10px] rounded bg-slate-700/50 text-slate-500 flex items-center gap-1"><Lock className="w-3 h-3" /> Not Cleared</span>;
}
