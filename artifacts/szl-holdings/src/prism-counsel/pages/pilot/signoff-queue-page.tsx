import { usePendingSignoffs, useResolveSignoff, useSignoffs } from "../../hooks/use-prism-pilot";
import { useState } from "react";
import { Shield, CheckCircle, XCircle, AlertTriangle, FileText, Clock } from "lucide-react";

const DEMO_SIGNOFFS = [
  {
    id: 1, matterId: 1, requestType: "chronology", title: "Reviewed Chronology — Rodriguez v. National General",
    reason: "Chronology has been reviewed and source-verified. Ready for partner distribution.",
    supportSummary: "4 sources supporting this output — all verified at 95%+ confidence",
    riskSummary: "1 privilege warning (work product reference in Feb 20 entry). 1 minor unsupported statement (vehicle count).",
    ifApproved: "Output will be marked safe to send. Word export can be generated and distributed to partner.",
    ifRejected: "Output will be returned to reviewing attorney for revision. Author will be notified with feedback.",
    status: "pending", createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 2, matterId: 1, requestType: "partner_update", title: "Partner Update Memo — Rodriguez",
    reason: "Weekly partner update summarizing reserve increase and case strategy adjustment.",
    supportSummary: "1 source verified — carrier correspondence from March 28",
    riskSummary: "No contradictions or privilege warnings detected.",
    ifApproved: "Memo will be finalized and exported as Word document for partner review meeting.",
    ifRejected: "Memo will be returned for revision with detailed feedback.",
    status: "pending", createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: 3, matterId: 3, requestType: "demand_section", title: "Discovery Extension Motion — Vasquez v. GEICO",
    reason: "Motion to compel has been drafted and reviewed. Sources verified.",
    supportSummary: "3 sources supporting — court rules, prior correspondence, discovery log",
    riskSummary: "No warnings. All statements source-grounded.",
    ifApproved: "Motion will be finalized for filing. Calendar entry will be updated.",
    ifRejected: "Motion will be revised. Filing deadline reminder will remain active.",
    status: "pending", createdAt: new Date(Date.now() - 28800000).toISOString(),
  },
];

export default function SignoffQueuePage() {
  const { data } = usePendingSignoffs();
  const { data: allData } = useSignoffs();
  const resolveSignoff = useResolveSignoff();
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

  const pending = data?.signoffs?.length ? data.signoffs : DEMO_SIGNOFFS;
  const all = allData?.signoffs ?? [];
  const resolved = all.filter((s: any) => s.status !== "pending");
  const isDemo = !data?.signoffs?.length;

  const items = activeTab === "pending" ? pending : resolved;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
            <Shield className="w-6 h-6 text-[#8b7ac8]" /> Sign-Off Queue
          </h1>
          <p className="text-sm text-slate-400 mt-1">{pending.length} pending approval{pending.length !== 1 ? "s" : ""} — review risk and decide</p>
        </div>
        <div className="flex items-center gap-3">
          {isDemo && <span className="px-2 py-0.5 text-xs font-mono bg-amber-900/30 text-amber-400 rounded">DEMO</span>}
          <div className="flex gap-1 bg-slate-800/50 rounded p-0.5">
            <button onClick={() => setActiveTab("pending")}
              className={`px-3 py-1 text-xs rounded ${activeTab === "pending" ? "bg-slate-700 text-white" : "text-slate-500"}`}>
              Pending ({pending.length})
            </button>
            <button onClick={() => setActiveTab("history")}
              className={`px-3 py-1 text-xs rounded ${activeTab === "history" ? "bg-slate-700 text-white" : "text-slate-500"}`}>
              History ({resolved.length})
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((s: any) => (
          <div key={s.id} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-base font-medium text-white">{s.title}</h2>
                <span className="text-xs text-slate-500 capitalize">{s.requestType?.replace(/_/g, " ")} · Matter #{s.matterId}</span>
              </div>
              <StatusBadge status={s.status} />
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Why Action Is Requested</h3>
              <p className="text-sm text-slate-300">{s.reason}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 rounded bg-slate-900/50">
                <h4 className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mb-1"><CheckCircle className="w-3 h-3" /> What Supports It</h4>
                <p className="text-xs text-slate-400">{s.supportSummary}</p>
              </div>
              <div className="p-3 rounded bg-slate-900/50">
                <h4 className="text-xs font-semibold text-amber-400 flex items-center gap-1 mb-1"><AlertTriangle className="w-3 h-3" /> What Risk Exists</h4>
                <p className="text-xs text-slate-400">{s.riskSummary}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 rounded bg-emerald-900/10 border border-emerald-700/20">
                <h4 className="text-xs font-semibold text-emerald-400 mb-1">If Approved</h4>
                <p className="text-xs text-slate-400">{s.ifApproved}</p>
              </div>
              <div className="p-3 rounded bg-red-900/10 border border-red-700/20">
                <h4 className="text-xs font-semibold text-red-400 mb-1">If Rejected</h4>
                <p className="text-xs text-slate-400">{s.ifRejected}</p>
              </div>
            </div>

            {s.status === "pending" && (
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-700/30">
                <button onClick={() => resolveSignoff.mutate({ id: s.id, decision: "rejected" })}
                  className="px-4 py-2 text-sm rounded-lg border border-red-700/30 text-red-400 hover:bg-red-900/20 transition-colors flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button onClick={() => resolveSignoff.mutate({ id: s.id, decision: "approved" })}
                  className="px-4 py-2 text-sm rounded-lg bg-emerald-900/20 border border-emerald-700/30 text-emerald-400 hover:bg-emerald-900/30 transition-colors flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Approve & Sign Off
                </button>
              </div>
            )}
          </div>
        ))}

        {items.length === 0 && (
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-12 text-center">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm text-slate-400">{activeTab === "pending" ? "No pending sign-offs — you're all clear" : "No sign-off history yet"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-900/30 text-amber-400",
    approved: "bg-emerald-900/30 text-emerald-400",
    rejected: "bg-red-900/30 text-red-400",
  };
  return <span className={`px-2 py-0.5 text-xs rounded ${styles[status] ?? "bg-slate-700/50 text-slate-500"}`}>{status}</span>;
}
