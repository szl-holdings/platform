import { Settings, AlertTriangle, Layers, TrendingDown, Ban, Package, Loader2 } from "lucide-react";
import { useReviewAdminView } from "../../hooks/use-prism-review";

const DEMO_ADMIN = {
  backlogByType: {
    draft_review: 8,
    chronology_review: 4,
    evidence_review: 3,
    contradiction_review: 3,
    low_confidence_extraction_review: 2,
    safe_to_send_review: 1,
    safe_to_export_review: 1,
  },
  backlogByState: {
    new: 5,
    triaged: 6,
    assigned: 7,
    in_review: 4,
    needs_evidence: 3,
    needs_attorney_review: 2,
    needs_partner_review: 1,
    blocked: 2,
  },
  slaBreaches: [
    { id: 1001, title: "Settlement demand section — Rodriguez", reviewWorkType: "draft_review", lifecycleState: "in_review", breachedAt: new Date(Date.now() - 8 * 3600000).toISOString(), priorityScore: 0.88 },
    { id: 1003, title: "Lost wage extraction — Rodriguez", reviewWorkType: "low_confidence_extraction_review", lifecycleState: "triaged", breachedAt: new Date(Date.now() - 2 * 3600000).toISOString(), priorityScore: 0.52 },
  ],
  contradictionBacklog: 3,
  lowConfidenceBacklog: 2,
  reviewPacketFailures: 1,
  totalActive: 22,
};

const TYPE_LABELS: Record<string, string> = {
  draft_review: "Draft Review",
  chronology_review: "Chronology",
  evidence_review: "Evidence",
  contradiction_review: "Contradiction",
  low_confidence_extraction_review: "Low Confidence",
  safe_to_send_review: "Safe to Send",
  safe_to_export_review: "Safe to Export",
  recovery_lien_review: "Recovery/Lien",
  approval_preparation_review: "Approval Prep",
};

const STATE_COLORS: Record<string, string> = {
  new: "#4a90b8",
  triaged: "#d4a054",
  assigned: "#8b7ac8",
  in_review: "#d4a054",
  needs_evidence: "#c45a4a",
  needs_attorney_review: "#c45a4a",
  needs_partner_review: "#c45a4a",
  blocked: "#c45a4a",
};

export default function ReviewAdminPage() {
  const { data, isLoading } = useReviewAdminView();
  const d = data ?? DEMO_ADMIN;
  const isLive = !!data;

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#d4a054]" />
          <h1 className="text-lg font-semibold text-slate-100">Review Admin</h1>
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isLive ? "bg-[#4a90b8]/10 text-[#4a90b8]" : "bg-[#d4a054]/10 text-[#d4a054]"}`}>
            {isLive ? "LIVE" : "DEMO"}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">Backlog by type/team, SLA breaches, packet failures, and queue health</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total Active", value: d.totalActive, icon: Layers, color: "#d4a054" },
              { label: "SLA Breaches", value: d.slaBreaches.length, icon: AlertTriangle, color: "#c45a4a" },
              { label: "Contradiction Backlog", value: d.contradictionBacklog, icon: TrendingDown, color: "#c45a4a" },
              { label: "Low-Conf Backlog", value: d.lowConfidenceBacklog, icon: Package, color: "#d4a054" },
            ].map(k => {
              const Icon = k.icon;
              return (
                <div key={k.label} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-3.5 h-3.5" style={{ color: k.color }} />
                    <span className="text-[10px] text-slate-500">{k.label}</span>
                  </div>
                  <div className="text-2xl font-semibold" style={{ color: k.value > 0 ? k.color : "#64748b" }}>{k.value}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Backlog by Work Type</h3>
              <div className="space-y-2">
                {(Object.entries(d.backlogByType ?? {}) as [string, number][]).sort(([, a], [, b]) => b - a).map(([type, count]) => {
                  const max = Math.max(...(Object.values(d.backlogByType ?? {}) as number[]));
                  const pct = max > 0 ? (count / max) * 100 : 0;
                  const color = pct >= 50 ? "#c45a4a" : pct >= 25 ? "#d4a054" : "#4a90b8";
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400 w-36 truncate">{TYPE_LABELS[type] ?? type}</span>
                      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 w-4 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Backlog by Lifecycle State</h3>
              <div className="space-y-2">
                {(Object.entries(d.backlogByState ?? {}) as [string, number][]).sort(([, a], [, b]) => b - a).map(([state, count]) => (
                  <div key={state} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: STATE_COLORS[state] ?? "#64748b" }} />
                    <span className="text-[10px] text-slate-400 flex-1">{state.replace(/_/g, " ")}</span>
                    <span className="text-[10px] font-mono text-slate-400">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#c45a4a]" />
              SLA Breaches ({d.slaBreaches.length})
            </h3>
            {d.slaBreaches.length === 0 ? (
              <p className="text-xs text-slate-500">No active SLA breaches</p>
            ) : (
              <div className="space-y-2">
                {d.slaBreaches.map((b: any) => {
                  const breachAge = Math.round((Date.now() - new Date(b.breachedAt).getTime()) / 3600000);
                  return (
                    <div key={b.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                      <Ban className="w-3.5 h-3.5 text-[#c45a4a] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-200 truncate">{b.title}</div>
                        <div className="text-[9px] text-slate-500">
                          {TYPE_LABELS[b.reviewWorkType] ?? b.reviewWorkType} · {b.lifecycleState.replace(/_/g, " ")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-mono text-[#c45a4a]">{breachAge}h over SLA</div>
                        <div className="text-[9px] text-slate-500">Priority: {Math.round(b.priorityScore * 100)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {d.reviewPacketFailures > 0 && (
            <div className="rounded-lg border border-[#c45a4a]/20 p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#c45a4a]" />
                <h3 className="text-sm font-semibold text-[#c45a4a]">Review Packet Failures</h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#c45a4a]/10 text-[#c45a4a] font-mono">{d.reviewPacketFailures}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Items with audit packet refs that are blocked — check generation queue</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
