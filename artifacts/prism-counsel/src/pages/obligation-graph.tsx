import { useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import {
  Network, ChevronDown, Clock, AlertTriangle, CheckCircle, Circle,
  ArrowRight, Lock, User, Building, Scale, FileText, Gavel
} from "lucide-react";
import {
  SEED_MATTERS, getMatterById, getPrivilegeColor, getObligationStatusColor,
  formatDeadline, daysUntil, getPressureColor
} from "@/data/matters";
import type { Obligation, Party, PartyRole } from "@/data/matters";

const ACCENT = "#a78bfa";

const STATUS_ICONS: Record<string, React.ReactNode> = {
  complete: <CheckCircle className="w-3 h-3 text-green-400" />,
  "in-progress": <div className="w-3 h-3 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(167,139,250,0.2)", borderTopColor: ACCENT }} />,
  "at-risk": <AlertTriangle className="w-3 h-3 text-orange-400" />,
  overdue: <AlertTriangle className="w-3 h-3 text-red-400" />,
  pending: <Circle className="w-3 h-3 text-white/20" />,
};

const ROLE_ICONS: Record<PartyRole, React.ReactNode> = {
  client: <Building className="w-3.5 h-3.5" />,
  "opposing-counsel": <Scale className="w-3.5 h-3.5" />,
  regulator: <Gavel className="w-3.5 h-3.5" />,
  "third-party": <User className="w-3.5 h-3.5" />,
  expert: <FileText className="w-3.5 h-3.5" />,
  "co-counsel": <Scale className="w-3.5 h-3.5" />,
};

const ROLE_COLORS: Record<PartyRole, string> = {
  client: "#a78bfa",
  "opposing-counsel": "#f97316",
  regulator: "#ef4444",
  "third-party": "#6b7280",
  expert: "#38bdf8",
  "co-counsel": "#c4b5fd",
};

function ObligationCard({ obligation, allObligations, index }: { obligation: Obligation; allObligations: Obligation[]; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const color = getObligationStatusColor(obligation.status);
  const privColor = getPrivilegeColor(obligation.privilegeLevel);
  const days = daysUntil(obligation.dueDate);
  const deps = obligation.dependencies.map((depId) => allObligations.find((o) => o.id === depId)).filter(Boolean);

  return (
    <div className="relative">
      {index > 0 && (
        <div className="absolute -top-3 left-5 w-px h-3" style={{ background: "rgba(255,255,255,0.08)" }} />
      )}
      <div
        className="rounded-xl border border-white/5 overflow-hidden hover:border-white/10 transition-colors"
        style={{ background: "rgba(255,255,255,0.02)" }}
      >
        <div
          className="p-4 cursor-pointer"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
              {STATUS_ICONS[obligation.status]}
              {deps.length > 0 && <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.08)" }} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-white/85 leading-snug">{obligation.title}</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  {obligation.filingRequired && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(167,139,250,0.12)", color: ACCENT }}>FILING</span>
                  )}
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase" style={{ background: `${privColor}20`, color: privColor }}>
                    {obligation.privilegeLevel}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                <div className="flex items-center gap-1" style={{ color }}>
                  <Clock className="w-2.5 h-2.5" />
                  {formatDeadline(obligation.dueDate)}
                </div>
                <span className="text-white/30">·</span>
                <span className="text-white/40">{obligation.assignee}</span>
                {obligation.courtId && (
                  <>
                    <span className="text-white/30">·</span>
                    <span className="font-mono text-white/30">{obligation.courtId}</span>
                  </>
                )}
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-white/20 shrink-0 mt-1 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </div>
        </div>

        {expanded && (
          <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
            <p className="text-xs text-white/50 leading-relaxed">{obligation.description}</p>

            {obligation.consequence && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}>
                <AlertTriangle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-400/80">{obligation.consequence}</p>
              </div>
            )}

            {deps.length > 0 && (
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Depends on</p>
                <div className="space-y-1.5">
                  {deps.map((dep) => dep && (
                    <div key={dep.id} className="flex items-center gap-2 text-[11px] text-white/40">
                      <ArrowRight className="w-2.5 h-2.5 text-white/20" />
                      <span>{dep.title}</span>
                      <span className="ml-auto" style={{ color: getObligationStatusColor(dep.status) }}>{dep.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PartyNode({ party }: { party: Party }) {
  const color = ROLE_COLORS[party.role];
  const icon = ROLE_ICONS[party.role];

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors" style={{ background: "rgba(255,255,255,0.02)" }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${color}18`, color }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white/80 leading-snug">{party.name}</p>
        <p className="text-[10px] capitalize mt-0.5" style={{ color }}>{party.role.replace("-", " ")}</p>
        {party.counsel && <p className="text-[10px] text-white/30 mt-0.5 truncate">{party.counsel}</p>}
        {party.jurisdiction && <p className="text-[10px] text-white/20 mt-0.5">{party.jurisdiction}</p>}
      </div>
    </div>
  );
}

export default function ObligationGraph() {
  const [, params] = useRoute("/obligation-graph/:matterId");
  const [, navigate] = useLocation();
  const [selectedMatterId, setSelectedMatterId] = useState(params?.matterId ?? SEED_MATTERS[0].id);
  const [expandedSection, setExpandedSection] = useState<"parties" | "obligations" | null>("obligations");

  const matter = useMemo(() => getMatterById(selectedMatterId) ?? SEED_MATTERS[0], [selectedMatterId]);

  const obligsByStatus = useMemo(() => ({
    critical: matter.obligations.filter((o) => o.status === "at-risk" || o.status === "overdue"),
    active: matter.obligations.filter((o) => o.status === "in-progress"),
    pending: matter.obligations.filter((o) => o.status === "pending"),
    complete: matter.obligations.filter((o) => o.status === "complete"),
  }), [matter]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Network className="w-4 h-4" style={{ color: ACCENT }} />
            <h1 className="text-lg font-semibold font-display text-white/90">Obligation Graph</h1>
          </div>
          <p className="text-xs text-white/30">Parties · Deadlines · Dependencies · Consequences</p>
        </div>
      </div>

      <div>
        <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-2">Matter</label>
        <select
          value={selectedMatterId}
          onChange={(e) => { setSelectedMatterId(e.target.value); navigate(`/obligation-graph/${e.target.value}`); }}
          className="text-sm bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white/70 focus:outline-none focus:border-purple-500/40 w-full max-w-md"
        >
          {SEED_MATTERS.map((m) => (
            <option key={m.id} value={m.id}>{m.name} ({m.matterNumber})</option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="p-5 border-b border-white/5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-sm font-semibold text-white/85">{matter.name}</h2>
              <p className="text-xs text-white/30 mt-0.5 font-mono">{matter.matterNumber} · {matter.jurisdiction}</p>
            </div>
            <div className="flex items-center gap-2">
              {matter.wall.enabled && (
                <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full privilege-glow" style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <Lock className="w-2.5 h-2.5" />
                  Matter Wall Active
                </span>
              )}
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: `${getPrivilegeColor(matter.privilegeLevel)}20`, color: getPrivilegeColor(matter.privilegeLevel) }}>
                {matter.privilegeLevel}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Obligations", value: String(matter.obligations.length) },
              { label: "At Risk", value: String(obligsByStatus.critical.length), color: "#f97316" },
              { label: "In Progress", value: String(obligsByStatus.active.length), color: ACCENT },
              { label: "Complete", value: String(obligsByStatus.complete.length), color: "#22c55e" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg p-3 border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
                <p className="text-[9px] text-white/25 mb-1">{s.label}</p>
                <p className="text-lg font-semibold font-mono" style={{ color: s.color || "rgba(255,255,255,0.7)" }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="divide-y divide-white/5">
          <div>
            <button
              onClick={() => setExpandedSection(expandedSection === "parties" ? null : "parties")}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/2 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-white/30" />
                <span className="text-xs font-semibold text-white/60">Parties & Relationships</span>
                <span className="text-[10px] text-white/30">({matter.parties.length})</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-white/20 transition-transform ${expandedSection === "parties" ? "rotate-180" : ""}`} />
            </button>
            {expandedSection === "parties" && (
              <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matter.parties.map((party) => <PartyNode key={party.id} party={party} />)}
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setExpandedSection(expandedSection === "obligations" ? null : "obligations")}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/2 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Network className="w-3.5 h-3.5 text-white/30" />
                <span className="text-xs font-semibold text-white/60">Obligation Chain</span>
                <span className="text-[10px] text-white/30">({matter.obligations.length} items)</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-white/20 transition-transform ${expandedSection === "obligations" ? "rotate-180" : ""}`} />
            </button>
            {expandedSection === "obligations" && (
              <div className="px-5 pb-5 space-y-3">
                {obligsByStatus.critical.length > 0 && (
                  <div>
                    <p className="text-[9px] text-orange-400/60 uppercase tracking-widest font-semibold mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" /> Urgent / At Risk
                    </p>
                    <div className="space-y-2">
                      {obligsByStatus.critical.map((o, i) => <ObligationCard key={o.id} obligation={o} allObligations={matter.obligations} index={i} />)}
                    </div>
                  </div>
                )}
                {obligsByStatus.active.length > 0 && (
                  <div>
                    <p className="text-[9px] text-purple-400/50 uppercase tracking-widest font-semibold mb-2">In Progress</p>
                    <div className="space-y-2">
                      {obligsByStatus.active.map((o, i) => <ObligationCard key={o.id} obligation={o} allObligations={matter.obligations} index={i} />)}
                    </div>
                  </div>
                )}
                {obligsByStatus.pending.length > 0 && (
                  <div>
                    <p className="text-[9px] text-white/20 uppercase tracking-widest font-semibold mb-2">Pending</p>
                    <div className="space-y-2">
                      {obligsByStatus.pending.map((o, i) => <ObligationCard key={o.id} obligation={o} allObligations={matter.obligations} index={i} />)}
                    </div>
                  </div>
                )}
                {obligsByStatus.complete.length > 0 && (
                  <div>
                    <p className="text-[9px] text-green-400/40 uppercase tracking-widest font-semibold mb-2">Complete</p>
                    <div className="space-y-2">
                      {obligsByStatus.complete.map((o, i) => <ObligationCard key={o.id} obligation={o} allObligations={matter.obligations} index={i} />)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {matter.wall.enabled && (
        <div className="rounded-xl p-4 border privilege-glow" style={{ background: "rgba(239,68,68,0.04)", borderColor: "rgba(239,68,68,0.2)" }}>
          <div className="flex items-start gap-3">
            <Lock className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-400 mb-1">Matter Wall Active</p>
              <p className="text-[11px] text-red-400/60 mb-2">{matter.wall.reason}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
                <span className="text-white/30">Approved: {matter.wall.approvedUsers.join(", ")}</span>
                <span className="text-red-400/50">Blocked roles: {matter.wall.blockedRoles.join(", ")}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
