import { useState } from "react";
import {
  CheckCircle, XCircle, RotateCcw, ArrowUpCircle, UserPlus, Ban, HelpCircle,
  FileDown, Package, MessageSquare, ChevronDown, ChevronUp, AlertTriangle,
  Shield, Zap, Users, Clock,
} from "lucide-react";
import { useReviewAction } from "../../hooks/use-prism-review";

const WORK_TYPE_LABELS: Record<string, string> = {
  draft_review: "Draft Review",
  chronology_review: "Chronology Review",
  evidence_review: "Evidence Review",
  contradiction_review: "Contradiction Review",
  low_confidence_extraction_review: "Low-Confidence Extraction",
  safe_to_send_review: "Safe-to-Send Review",
  safe_to_export_review: "Safe-to-Export Review",
  recovery_lien_review: "Recovery/Lien Review",
  approval_preparation_review: "Approval Prep Review",
};

const STATE_COLORS: Record<string, { color: string; bg: string }> = {
  new: { color: "#4a90b8", bg: "#4a90b820" },
  triaged: { color: "#d4a054", bg: "#d4a05420" },
  assigned: { color: "#8b7ac8", bg: "#8b7ac820" },
  in_review: { color: "#d4a054", bg: "#d4a05420" },
  needs_evidence: { color: "#c45a4a", bg: "#c45a4a20" },
  needs_attorney_review: { color: "#c45a4a", bg: "#c45a4a20" },
  needs_partner_review: { color: "#c45a4a", bg: "#c45a4a20" },
  approved: { color: "#4a90b8", bg: "#4a90b820" },
  rejected: { color: "#c45a4a", bg: "#c45a4a20" },
  revised: { color: "#8b7ac8", bg: "#8b7ac820" },
  blocked: { color: "#c45a4a", bg: "#c45a4a20" },
  exported: { color: "#4a90b8", bg: "#4a90b820" },
  closed: { color: "#64748b", bg: "#64748b20" },
};

function PriorityBar({ score }: { score: number }) {
  const color = score >= 0.70 ? "#c45a4a" : score >= 0.40 ? "#d4a054" : "#4a90b8";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.round(score * 100)}%`, background: color }} />
      </div>
      <span className="text-[9px] font-mono" style={{ color }}>{Math.round(score * 100)}</span>
    </div>
  );
}

interface ReviewItemRaw {
  id: number;
  title: string;
  reviewWorkType: string;
  lifecycleState: string;
  matterId: number;
  description?: string;
  priorityScore: number;
  confidence?: number;
  privilegeSensitive?: boolean;
  exportSafe?: boolean;
  sendSafe?: boolean;
  whatThisIs?: string;
  whyItsHere?: string;
  whatSupportsIt?: unknown;
  whatsMissing?: unknown;
  whatRiskExists?: string;
  whatActionClearsIt?: string;
  whoIsWaiting?: unknown;
  whatItUnblocks?: unknown;
  assignedTo?: number;
  blockedReason?: string;
  escalatedTo?: string;
  dueBy?: string;
  createdAt: string;
  deadlineRiskScore?: number;
  contradictionSeverityScore?: number;
  lowConfidenceScore?: number;
  workUnblockedScore?: number;
  partnerUrgencyScore?: number;
}

export function ReviewCard({ item, compact = false }: { item: ReviewItemRaw; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const actions = useReviewAction();

  const sc = STATE_COLORS[item.lifecycleState] ?? STATE_COLORS.new;
  const age = Math.round((Date.now() - new Date(item.createdAt).getTime()) / 3600000);

  const isPending = actions.approve.isPending || actions.reject.isPending || actions.revise.isPending
    || actions.escalate.isPending || actions.block.isPending;

  return (
    <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
      <div className="flex items-start gap-3">
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase"
              style={{ background: sc.bg, color: sc.color }}
            >
              {item.lifecycleState.replace(/_/g, " ")}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/[0.04] text-slate-500">
              {WORK_TYPE_LABELS[item.reviewWorkType] ?? item.reviewWorkType}
            </span>
            {item.privilegeSensitive && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#c45a4a]/10 text-[#c45a4a]">
                <Shield className="w-2.5 h-2.5" /> PRIVILEGE
              </span>
            )}
            {item.exportSafe && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#4a90b8]/10 text-[#4a90b8]">EXPORT SAFE</span>
            )}
            {item.confidence !== null && item.confidence !== undefined && (
              <span className="text-[9px] font-mono text-slate-500">
                conf: {Math.round(item.confidence * 100)}%
              </span>
            )}
          </div>

          <div className="text-xs font-medium text-slate-200 mt-0.5">{item.title}</div>

          {!compact && (
            <div className="mt-1">
              <PriorityBar score={item.priorityScore} />
            </div>
          )}

          {item.whatThisIs && !compact && (
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{item.whatThisIs}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[9px] text-slate-600 font-mono flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> {age}h
          </span>
          <button onClick={() => setExpanded(!expanded)} className="text-slate-500 hover:text-slate-300">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3 border-t border-white/[0.04] pt-3">
          <div className="grid grid-cols-2 gap-3">
            {item.whyItsHere && (
              <div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Why It's Here</div>
                <p className="text-[10px] text-slate-400 leading-relaxed">{item.whyItsHere}</p>
              </div>
            )}
            {item.whatRiskExists && (
              <div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Risk</div>
                <p className="text-[10px] text-[#c45a4a] leading-relaxed">{item.whatRiskExists}</p>
              </div>
            )}
            {item.whatActionClearsIt && (
              <div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Action That Clears It</div>
                <p className="text-[10px] text-[#4a90b8] leading-relaxed">{item.whatActionClearsIt}</p>
              </div>
            )}
            {item.whatsMissing && (
              <div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">What's Missing</div>
                <p className="text-[10px] text-[#d4a054] leading-relaxed">
                  {Array.isArray(item.whatsMissing) ? (item.whatsMissing as string[]).join(", ") : JSON.stringify(item.whatsMissing)}
                </p>
              </div>
            )}
            {item.whatItUnblocks && (
              <div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">
                  <span className="flex items-center gap-1"><Zap className="w-2.5 h-2.5 text-[#d4a054]" /> Unblocks</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {Array.isArray(item.whatItUnblocks) ? (item.whatItUnblocks as string[]).join(", ") : JSON.stringify(item.whatItUnblocks)}
                </p>
              </div>
            )}
            {item.whoIsWaiting && (
              <div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">
                  <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" /> Who's Waiting</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {Array.isArray(item.whoIsWaiting) ? (item.whoIsWaiting as string[]).join(", ") : JSON.stringify(item.whoIsWaiting)}
                </p>
              </div>
            )}
          </div>

          {item.blockedReason && (
            <div className="flex items-start gap-2 p-2 rounded bg-[#c45a4a]/10 border border-[#c45a4a]/20">
              <Ban className="w-3 h-3 text-[#c45a4a] mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-[#c45a4a]">Blocked: {item.blockedReason}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Deadline Risk", value: item.deadlineRiskScore },
              { label: "Contradiction", value: item.contradictionSeverityScore },
              { label: "Low Conf", value: item.lowConfidenceScore },
              { label: "Unblocks", value: item.workUnblockedScore },
              { label: "Partner Urgency", value: item.partnerUrgencyScore },
            ].filter(s => s.value !== undefined && s.value !== null && s.value! > 0).map(s => (
              <div key={s.label} className="text-center">
                <div className="text-[9px] text-slate-600 mb-0.5">{s.label}</div>
                <div className="text-[11px] font-mono text-slate-400">{Math.round((s.value ?? 0) * 100)}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {["approved", "rejected"].some(s => item.lifecycleState === s) ? null : (
              <>
                {["in_review", "needs_attorney_review", "needs_partner_review", "triaged", "assigned"].includes(item.lifecycleState) && (
                  <button
                    onClick={() => actions.approve.mutate({ id: item.id })}
                    disabled={isPending}
                    className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] bg-[#4a90b8]/10 text-[#4a90b8] border border-[#4a90b8]/20 hover:bg-[#4a90b8]/20 disabled:opacity-40"
                  >
                    <CheckCircle className="w-3 h-3" /> Approve
                  </button>
                )}
                {["in_review", "needs_attorney_review", "needs_partner_review"].includes(item.lifecycleState) && (
                  <>
                    <button
                      onClick={() => actions.reject.mutate({ id: item.id, reason: "Rejected by reviewer" })}
                      disabled={isPending}
                      className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] bg-[#c45a4a]/10 text-[#c45a4a] border border-[#c45a4a]/20 hover:bg-[#c45a4a]/20 disabled:opacity-40"
                    >
                      <XCircle className="w-3 h-3" /> Reject
                    </button>
                    <button
                      onClick={() => actions.revise.mutate({ id: item.id })}
                      disabled={isPending}
                      className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] bg-[#8b7ac8]/10 text-[#8b7ac8] border border-[#8b7ac8]/20 hover:bg-[#8b7ac8]/20 disabled:opacity-40"
                    >
                      <RotateCcw className="w-3 h-3" /> Revise
                    </button>
                    <button
                      onClick={() => actions.escalate.mutate({ id: item.id, escalateTo: "attorney" })}
                      disabled={isPending}
                      className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20 hover:bg-[#d4a054]/20 disabled:opacity-40"
                    >
                      <ArrowUpCircle className="w-3 h-3" /> Escalate
                    </button>
                    <button
                      onClick={() => actions.requestSupport.mutate({ id: item.id, request: "Additional support needed" })}
                      disabled={isPending}
                      className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] bg-white/[0.04] text-slate-400 border border-white/[0.08] hover:bg-white/[0.08] disabled:opacity-40"
                    >
                      <HelpCircle className="w-3 h-3" /> Request Support
                    </button>
                  </>
                )}
                {["new", "triaged"].includes(item.lifecycleState) && (
                  <button
                    onClick={() => actions.block.mutate({ id: item.id, reason: "Blocked pending information" })}
                    disabled={isPending}
                    className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] bg-white/[0.04] text-slate-400 border border-white/[0.08] hover:bg-white/[0.08] disabled:opacity-40"
                  >
                    <Ban className="w-3 h-3" /> Mark Blocked
                  </button>
                )}
                {item.lifecycleState === "approved" && item.exportSafe && (
                  <button
                    onClick={() => actions.exportPacket.mutate({ id: item.id })}
                    disabled={isPending}
                    className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] bg-[#4a90b8]/10 text-[#4a90b8] border border-[#4a90b8]/20 hover:bg-[#4a90b8]/20 disabled:opacity-40"
                  >
                    <FileDown className="w-3 h-3" /> Export Packet
                  </button>
                )}
                <button
                  onClick={() => actions.generateReviewPacket.mutate({ id: item.id })}
                  disabled={isPending}
                  className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] bg-white/[0.04] text-slate-400 border border-white/[0.08] hover:bg-white/[0.08] disabled:opacity-40"
                >
                  <Package className="w-3 h-3" /> Review Packet
                </button>
                <button
                  onClick={() => setShowNoteInput(!showNoteInput)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] bg-white/[0.04] text-slate-400 border border-white/[0.08] hover:bg-white/[0.08]"
                >
                  <MessageSquare className="w-3 h-3" /> Note
                </button>
              </>
            )}
          </div>

          {showNoteInput && (
            <div className="flex gap-2">
              <input
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                placeholder="Add a note..."
                className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded px-2 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-white/[0.12]"
              />
              <button
                onClick={() => {
                  if (noteInput.trim()) {
                    actions.addNote.mutate({ id: item.id, content: noteInput.trim() });
                    setNoteInput("");
                    setShowNoteInput(false);
                  }
                }}
                className="px-3 py-1.5 rounded text-[10px] bg-[#4a90b8]/10 text-[#4a90b8] border border-[#4a90b8]/20 hover:bg-[#4a90b8]/20"
              >
                Save
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
