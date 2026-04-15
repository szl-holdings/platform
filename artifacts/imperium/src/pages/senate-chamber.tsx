import React, { useState } from "react";
import { BookOpen, Check, X, Gavel, AlertTriangle, Clock, ChevronDown, ChevronUp, Shield, Cpu, Network } from "lucide-react";
import { SENATE_PROPOSALS, getClassificationColor } from "@/lib/imperium-data";
import { ClassificationBadge } from "@/components/classification-badge";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<string, React.ElementType> = {
  SCALING: Cpu,
  SECURITY: Shield,
  NETWORK: Network,
};

const STATUS_CONFIG = {
  PENDING_VOTE: { label: "PENDING VOTE", color: "#facc15", bg: "rgba(250,204,21,0.1)", border: "rgba(250,204,21,0.3)" },
  APPROVED: { label: "APPROVED", color: "#4ade80", bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.25)" },
  VETOED: { label: "VETOED", color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)" },
  EXECUTED: { label: "EXECUTED", color: "#94a3b8", bg: "rgba(148,163,184,0.05)", border: "rgba(148,163,184,0.2)" },
};

function VoteBar({ votes }: { votes: typeof SENATE_PROPOSALS[0]["votes"] }) {
  const filled = votes.aye;
  const empty = votes.required - votes.aye - votes.nay;
  const nay = votes.nay;

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-500 font-mono w-8 text-right">{votes.aye}</span>
      <div className="flex gap-1">
        {Array.from({ length: votes.required }).map((_, i) => {
          let fill = "rgba(255,255,255,0.08)";
          if (i < votes.aye) fill = "#4ade80";
          else if (i >= votes.required - votes.nay) fill = "#ef4444";
          return (
            <div
              key={i}
              className="w-5 h-5 rounded-sm border border-white/10 transition-all"
              style={{ backgroundColor: fill, borderColor: fill !== "rgba(255,255,255,0.08)" ? fill : undefined }}
            />
          );
        })}
      </div>
      <span className="text-[10px] text-slate-500 font-mono">/{votes.required}</span>
    </div>
  );
}

function ProposalCard({ proposal }: { proposal: typeof SENATE_PROPOSALS[0] }) {
  const [expanded, setExpanded] = useState(proposal.status === "PENDING_VOTE");
  const status = STATUS_CONFIG[proposal.status];
  const TypeIcon = TYPE_ICONS[proposal.type] || AlertTriangle;
  const classColor = getClassificationColor(proposal.classification);
  const timeAgo = Math.round((Date.now() - proposal.proposedAt.getTime()) / 3600000);

  return (
    <div
      className="rounded-lg overflow-hidden border transition-all"
      style={{ background: "rgba(10,13,26,0.95)", borderColor: status.border }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/2 transition-all"
      >
        <TypeIcon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: classColor }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className="font-semibold text-sm text-slate-200 leading-tight">{proposal.title}</span>
            <div
              className="px-2 py-0.5 rounded font-mono text-[9px] tracking-widest flex-shrink-0 border"
              style={{ color: status.color, background: status.bg, borderColor: status.border }}
            >
              {status.label}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <ClassificationBadge classification={proposal.classification} size="xs" />
            <span className="text-[10px] text-slate-500 font-mono">{proposal.type}</span>
            <span className="text-[10px] text-slate-600">{timeAgo}h ago · {proposal.proposedBy}</span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3">
          <p className="text-xs text-slate-400 leading-relaxed mb-4">{proposal.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="text-center rounded p-2.5 bg-white/3">
              <div className="text-xs font-semibold text-slate-300">{proposal.impact}</div>
              <div className="text-[9px] text-slate-600 mt-0.5">Impact</div>
            </div>
            <div className="text-center rounded p-2.5 bg-white/3">
              <div className="text-xs font-semibold" style={{ color: proposal.costDelta.startsWith("+") ? "#fb923c" : "#4ade80" }}>
                {proposal.costDelta}
              </div>
              <div className="text-[9px] text-slate-600 mt-0.5">Cost Delta</div>
            </div>
            <div className="col-span-2">
              {proposal.status === "PENDING_VOTE" && (
                <div className="flex flex-col gap-1.5">
                  <div className="text-[10px] text-slate-500 font-mono tracking-wider">SENATE VOTE</div>
                  <VoteBar votes={proposal.votes} />
                </div>
              )}
              {proposal.status === "VETOED" && (
                <div className="rounded p-2.5 bg-red-950/30 border border-red-900/30">
                  <div className="text-[10px] font-mono text-red-400 font-bold tracking-wider">TRIBUNE VETO</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    <span className="text-slate-300">{proposal.vetoBy}:</span> {proposal.vetoReason}
                  </div>
                </div>
              )}
              {proposal.status === "APPROVED" && (
                <div className="rounded p-2.5 bg-green-950/30 border border-green-900/30 flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <div className="text-[11px] text-green-400 font-mono">SENATUS CONSULTUM — APPROVED</div>
                </div>
              )}
            </div>
          </div>

          {proposal.status === "PENDING_VOTE" && (
            <div className="flex gap-2">
              <button
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded font-mono text-[11px] tracking-widest font-bold border transition-all hover:bg-green-500/10"
                style={{ borderColor: "#4ade8040", color: "#4ade80" }}
              >
                <Check className="w-3.5 h-3.5" /> AYE
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded font-mono text-[11px] tracking-widest font-bold border transition-all hover:bg-red-500/10"
                style={{ borderColor: "#ef444440", color: "#ef4444" }}
              >
                <X className="w-3.5 h-3.5" /> NAY
              </button>
              <button
                className="flex items-center justify-center gap-2 px-4 py-2 rounded font-mono text-[11px] tracking-widest font-bold border transition-all hover:bg-orange-500/10"
                style={{ borderColor: "#fb923c40", color: "#fb923c" }}
              >
                <Gavel className="w-3.5 h-3.5" /> VETO
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SenateChamber() {
  const pending = SENATE_PROPOSALS.filter((p) => p.status === "PENDING_VOTE");
  const decided = SENATE_PROPOSALS.filter((p) => p.status !== "PENDING_VOTE");

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <BookOpen className="w-5 h-5" style={{ color: "#c9a227" }} />
          <h1 className="font-display text-lg tracking-[0.2em] gold-text gold-glow font-bold uppercase">
            Senate Chamber
          </h1>
        </div>
        <p className="text-xs text-slate-500 ml-8">
          Multi-party governance — critical changes require Senate vote · Tribune veto capability
        </p>
      </div>

      {/* Senate stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Pending Vote", value: pending.length, color: "#facc15" },
          { label: "Approved", value: SENATE_PROPOSALS.filter((p) => p.status === "APPROVED").length, color: "#4ade80" },
          { label: "Vetoed", value: SENATE_PROPOSALS.filter((p) => p.status === "VETOED").length, color: "#ef4444" },
          { label: "Quorum Required", value: "3/3", color: "#c9a227" },
        ].map(({ label, value, color }) => (
          <div key={label} className="imperial-card rounded-lg p-3 text-center">
            <div className="font-mono text-2xl font-bold" style={{ color }}>{value}</div>
            <div className="text-[10px] text-slate-500 mt-1 tracking-wider">{label}</div>
          </div>
        ))}
      </div>

      {/* Governance charter */}
      <div className="imperial-card rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Gavel className="w-4 h-4" style={{ color: "#c9a227" }} />
          <span className="font-display text-xs tracking-[0.15em] gold-text uppercase">Lex Imperium — Governance Charter</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-400">
          <div className="rounded p-3 bg-white/3 border border-white/5">
            <div className="font-display text-[10px] tracking-[0.12em] gold-text mb-1 uppercase">Scaling Changes</div>
            Require 3 Senate votes. Impact analysis by Centurion AI required before proposal.
          </div>
          <div className="rounded p-3 bg-white/3 border border-white/5">
            <div className="font-display text-[10px] tracking-[0.12em] gold-text mb-1 uppercase">Security Changes</div>
            SOVEREIGN/CONFIDENTIAL resources require Senate vote + Praetorian review.
          </div>
          <div className="rounded p-3 bg-white/3 border border-white/5">
            <div className="font-display text-[10px] tracking-[0.12em] gold-text mb-1 uppercase">Tribune Veto</div>
            Any designated Tribune may veto pending proposals. Veto requires written justification logged immutably.
          </div>
        </div>
      </div>

      {/* Pending proposals */}
      {pending.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="font-display text-xs tracking-[0.12em] text-yellow-400 uppercase">Awaiting Senate Vote ({pending.length})</span>
          </div>
          <div className="space-y-3">
            {pending.map((p) => <ProposalCard key={p.id} proposal={p} />)}
          </div>
        </div>
      )}

      {/* Decided proposals */}
      {decided.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Check className="w-4 h-4 text-slate-500" />
            <span className="font-display text-xs tracking-[0.12em] text-slate-500 uppercase">Decided — Immutable Receipts</span>
          </div>
          <div className="space-y-3">
            {decided.map((p) => <ProposalCard key={p.id} proposal={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
