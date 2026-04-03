import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, CheckCircle, Clock, AlertTriangle, FileText, Users,
  ChevronRight, ChevronDown, Shield, TrendingUp, ExternalLink,
  BarChart3, Plug, Info, ArrowRight, Plus, Eye, RefreshCw
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { EmptyState } from "@szl-holdings/shared-ui";
import { propertyTwins, whatChangedFeed, type PropertyTwin, type DiligenceTask } from "@/data/property-twin";

const ACCENT = "#40856a";

function fmt(n: number, opts?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("en-US", opts).format(n);
}
function fmtM(n: number) {
  return `$${(n / 1_000_000).toFixed(1)}M`;
}
function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  under_review: "Under Review",
  pending_diligence: "Pending Diligence",
  distress_watch: "Distress Watch",
  approved: "Approved",
  closed: "Closed",
};

const STATUS_COLOR: Record<string, string> = {
  active: "#40856a",
  under_review: "#c08a2c",
  pending_diligence: "#4a7dc8",
  distress_watch: "#c04a2a",
  approved: "#40856a",
  closed: "rgba(255,255,255,0.3)",
};

const DISTRESS_COLOR: Record<string, string> = {
  none: "rgba(255,255,255,0.2)",
  watch: "#c08a2c",
  elevated: "#c04a2a",
  critical: "#9b1c1c",
};

const TASK_STATUS_COLOR: Record<string, string> = {
  complete: "#40856a",
  in_progress: "#4a7dc8",
  not_started: "rgba(255,255,255,0.2)",
  blocked: "#c04a2a",
  waived: "rgba(255,255,255,0.15)",
};

function DiligenceProgress({ pct, stage }: { pct: number; stage: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: "rgba(255,255,255,0.5)" }}>Diligence Progress</span>
        <span style={{ color: ACCENT }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: ACCENT }}
        />
      </div>
      <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
        Stage: <span style={{ color: "rgba(255,255,255,0.65)" }}>{stage.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
      </div>
    </div>
  );
}

function ConnectorPanel({ connectors }: { connectors: PropertyTwin["externalDataConnectors"] }) {
  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
        <Plug size={12} />
        <span>LOCAL CONTEXT SOURCES</span>
      </div>
      {connectors.map(c => (
        <div key={c.name} className="flex items-center justify-between text-sm">
          <span style={{ color: "rgba(255,255,255,0.6)" }}>{c.name}</span>
          {c.status === "not_connected" ? (
            <button className="flex items-center gap-1 text-xs px-2 py-0.5 rounded border transition-colors hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.35)" }}>
              <Plug size={10} />
              Connect to enable
            </button>
          ) : c.status === "connected" ? (
            <span className="text-xs" style={{ color: ACCENT }}>Connected</span>
          ) : (
            <span className="text-xs text-red-400">Error</span>
          )}
        </div>
      ))}
    </div>
  );
}

function TaskRow({ task }: { task: DiligenceTask }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: TASK_STATUS_COLOR[task.status] }} />
      <span className="flex-1 text-sm" style={{ color: task.status === "complete" ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.75)" }}>
        {task.label}
      </span>
      {task.assignedTo && (
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{task.assignedTo}</span>
      )}
      <span className="text-xs capitalize px-2 py-0.5 rounded-full" style={{
        background: `${TASK_STATUS_COLOR[task.status]}20`,
        color: TASK_STATUS_COLOR[task.status],
      }}>
        {task.status.replace(/_/g, " ")}
      </span>
    </div>
  );
}

function ReadinessMeter({ score }: { score: number }) {
  const color = score >= 80 ? "#40856a" : score >= 55 ? "#c08a2c" : "#c04a2a";
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-14 h-14">
        <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
          <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle cx="28" cy="28" r="22" fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 22}`}
            strokeDashoffset={`${2 * Math.PI * 22 * (1 - score / 100)}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold" style={{ color }}>
          {score}
        </div>
      </div>
      <div>
        <div className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>Readiness</div>
        <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
          {score >= 80 ? "Ready to advance" : score >= 55 ? "Needs attention" : "Not ready"}
        </div>
      </div>
    </div>
  );
}

function TwinCard({ twin, selected, onSelect }: { twin: PropertyTwin; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left rounded-xl border p-4 transition-all duration-200 hover:bg-white/4"
      style={{
        background: selected ? `${ACCENT}10` : "rgba(255,255,255,0.02)",
        borderColor: selected ? `${ACCENT}40` : "rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{twin.name}</div>
          <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{twin.city}, {twin.state}</div>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{
          background: `${STATUS_COLOR[twin.status]}20`,
          color: STATUS_COLOR[twin.status],
        }}>
          {STATUS_LABEL[twin.status]}
        </span>
      </div>
      <div className="flex items-center gap-3 mt-3">
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
          {fmtM(twin.value)} · {twin.capRate}% cap
        </span>
        {twin.distressSignal !== "none" && (
          <span className="text-xs px-1.5 py-0.5 rounded" style={{
            background: `${DISTRESS_COLOR[twin.distressSignal]}20`,
            color: DISTRESS_COLOR[twin.distressSignal],
          }}>
            ⚠ {twin.distressSignal}
          </span>
        )}
      </div>
      <div className="mt-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span style={{ color: "rgba(255,255,255,0.3)" }}>Diligence</span>
          <span style={{ color: ACCENT }}>{twin.diligenceCompletionPct}%</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-full rounded-full" style={{ width: `${twin.diligenceCompletionPct}%`, background: ACCENT }} />
        </div>
      </div>
    </button>
  );
}

export default function PropertyDesk() {
  const [selectedId, setSelectedId] = useState(propertyTwins[0]?.id ?? null);
  const twin = propertyTwins.find(t => t.id === selectedId) ?? propertyTwins[0];
  const pendingApprovals = twin?.approvals.filter(a => a.status === "pending") ?? [];
  const recentChanges = whatChangedFeed.filter(e => e.propertyId === twin?.propertyId).slice(0, 4);

  return (
    <div className="flex h-full" style={{ background: "hsl(20 7% 8%)" }}>
      <aside className="w-72 flex-shrink-0 border-r overflow-y-auto p-4 space-y-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
            Property Twins
          </h2>
          <button className="p-1 rounded hover:bg-white/5 transition-colors">
            <RefreshCw size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
          </button>
        </div>
        {propertyTwins.map(t => (
          <TwinCard key={t.id} twin={t} selected={t.id === selectedId} onSelect={() => setSelectedId(t.id)} />
        ))}
      </aside>

      {twin ? (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Building2 size={20} style={{ color: ACCENT }} />
                <h1 className="text-xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>{twin.name}</h1>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{
                  background: `${STATUS_COLOR[twin.status]}20`,
                  color: STATUS_COLOR[twin.status],
                }}>
                  {STATUS_LABEL[twin.status]}
                </span>
                {twin.distressSignal !== "none" && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{
                    background: `${DISTRESS_COLOR[twin.distressSignal]}20`,
                    color: DISTRESS_COLOR[twin.distressSignal],
                  }}>
                    <AlertTriangle size={10} />
                    Distress: {twin.distressSignal}
                  </span>
                )}
              </div>
              <div className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                {twin.address}, {twin.city}, {twin.state} · {twin.propertyType.replace(/-/g, " ")} · Updated {relTime(twin.lastChangedAt)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pendingApprovals.length > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "#c04a2a20", color: "#c04a2a" }}>
                  {pendingApprovals.length} pending approval{pendingApprovals.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Value", value: fmtM(twin.value), sub: `${twin.capRate}% cap rate` },
              { label: "NOI", value: fmtM(twin.noi), sub: "Annual" },
              { label: "Occupancy", value: `${twin.occupancy}%`, sub: twin.sqft.toLocaleString() + " sqft" },
              { label: "Readiness", value: `${twin.readinessScore}`, sub: twin.readinessScore >= 80 ? "Ready" : twin.readinessScore >= 55 ? "Needs attention" : "Not ready" },
            ].map(m => (
              <div key={m.label} className="rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{m.label}</div>
                <div className="text-xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>{m.value}</div>
                <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{m.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <div className="rounded-xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>Diligence Checklist</h3>
                  <DiligenceProgress pct={twin.diligenceCompletionPct} stage={twin.diligenceStage} />
                </div>
                <div className="space-y-0.5">
                  {twin.diligenceTasks.map(t => <TaskRow key={t.id} task={t} />)}
                </div>
              </div>

              {twin.approvals.length > 0 && (
                <div className="rounded-xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                  <h3 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.8)" }}>Pending Approvals</h3>
                  {twin.approvals.map(a => (
                    <div key={a.id} className="rounded-lg border p-3 space-y-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>{a.title}</div>
                          <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{a.description}</div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{
                          background: a.priority === "critical" ? "#c04a2a20" : a.priority === "high" ? "#c08a2c20" : "#4a7dc820",
                          color: a.priority === "critical" ? "#c04a2a" : a.priority === "high" ? "#c08a2c" : "#4a7dc8",
                        }}>
                          {a.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                        <span>Requested by {a.requestedBy}</span>
                        <span>· {relTime(a.requestedAt)}</span>
                        {a.comments.length > 0 && <span>· {a.comments.length} comment{a.comments.length > 1 ? "s" : ""}</span>}
                      </div>
                      <div className="flex gap-2">
                        <button className="text-xs px-3 py-1 rounded-md font-medium transition-colors" style={{ background: ACCENT, color: "white" }}>
                          Approve
                        </button>
                        <button className="text-xs px-3 py-1 rounded-md transition-colors hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.8)" }}>Documents</h3>
                {twin.documents.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    headline="No documents"
                    description="Upload documents to begin the diligence process."
                    compact
                    accentColor={ACCENT}
                  />
                ) : (
                  <div className="space-y-2">
                    {twin.documents.map(d => (
                      <div key={d.id} className="flex items-center justify-between text-sm py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                        <div className="flex items-center gap-2">
                          <FileText size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
                          <span style={{ color: "rgba(255,255,255,0.75)" }}>{d.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {d.reviewedBy && <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{d.reviewedBy}</span>}
                          <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{
                            background: d.status === "approved" ? "#40856a20" : d.status === "rejected" ? "#c04a2a20" : "rgba(255,255,255,0.04)",
                            color: d.status === "approved" ? "#40856a" : d.status === "rejected" ? "#c04a2a" : "rgba(255,255,255,0.4)",
                          }}>
                            {d.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.8)" }}>Audit Trail</h3>
                <div className="space-y-3">
                  {twin.auditTrail.slice().reverse().map(e => (
                    <div key={e.id} className="flex gap-3 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: ACCENT }} />
                      <div>
                        <span className="font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                          {e.action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                        <span style={{ color: "rgba(255,255,255,0.35)" }}> · {e.actor} ({e.actorRole}) · {relTime(e.at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <ReadinessMeter score={twin.readinessScore} />

              <div className="rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>Ownership</h3>
                {twin.owners.map(o => (
                  <div key={o.id} className="py-2 border-b last:border-b-0" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <div className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>{o.name}</div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                      <span>{o.type.toUpperCase()}</span>
                      <span>·</span>
                      <span>{o.ownershipPct}%</span>
                      <span>·</span>
                      <span>Since {o.since.slice(0, 4)}</span>
                    </div>
                    {o.flags && o.flags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {o.flags.map(f => (
                          <span key={f} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#c08a2c20", color: "#c08a2c" }}>
                            {f.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {twin.localContextNotes && (
                <div className="rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2 mb-2 text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
                    <Info size={12} />
                    LOCAL CONTEXT
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{twin.localContextNotes}</p>
                </div>
              )}

              <ConnectorPanel connectors={twin.externalDataConnectors} />

              {recentChanges.length > 0 && (
                <div className="rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>Recent Changes</div>
                  <div className="space-y-2">
                    {recentChanges.map(e => (
                      <div key={e.id} className="text-xs py-1.5 border-b last:border-b-0" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                        <div className="font-medium" style={{ color: e.severity === "critical" ? "#c04a2a" : e.severity === "warning" ? "#c08a2c" : "rgba(255,255,255,0.65)" }}>
                          {e.summary}
                        </div>
                        <div className="mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{relTime(e.occurredAt)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState icon={Building2} headline="Select a property" description="Choose a property from the list to view its twin." accentColor={ACCENT} />
        </div>
      )}
    </div>
  );
}
