import React, { useState } from "react";
import { Users, Shield, DollarSign, Cpu, TrendingUp, AlertTriangle, Check, Clock, ChevronDown, ChevronRight, Wifi } from "lucide-react";
import { COALITION_PARTNERS, type Partner, type Obligation } from "@/lib/strategic-data";
import { cn } from "@/lib/utils";

const TYPE_CONFIG = {
  TECHNOLOGY: { color: "#60a5fa", icon: Cpu },
  LEGAL: { color: "#a78bfa", icon: Shield },
  FINANCIAL: { color: "#c9a227", icon: DollarSign },
  STRATEGIC: { color: "#4ade80", icon: TrendingUp },
  OPERATIONAL: { color: "#fb923c", icon: Wifi },
};

const STATUS_CONFIG = {
  ACTIVE: { color: "#4ade80", label: "ACTIVE" },
  STRAINED: { color: "#fb923c", label: "STRAINED" },
  SUSPENDED: { color: "#ef4444", label: "SUSPENDED" },
  PENDING: { color: "#facc15", label: "PENDING" },
};

const OBL_STATUS = {
  ON_TRACK: { color: "#4ade80", icon: Check, label: "ON TRACK" },
  AT_RISK: { color: "#fb923c", icon: AlertTriangle, label: "AT RISK" },
  OVERDUE: { color: "#ef4444", icon: AlertTriangle, label: "OVERDUE" },
  COMPLETE: { color: "#94a3b8", icon: Check, label: "COMPLETE" },
};

function CommitmentBar({ score }: { score: number }) {
  const color = score >= 85 ? "#4ade80" : score >= 60 ? "#facc15" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="font-mono text-[10px] w-8 text-right" style={{ color }}>{score}</span>
    </div>
  );
}

function RiskPip({ score }: { score: number }) {
  const color = score < 20 ? "#4ade80" : score < 40 ? "#facc15" : score < 60 ? "#fb923c" : "#ef4444";
  const label = score < 20 ? "LOW" : score < 40 ? "MEDIUM" : score < 60 ? "HIGH" : "CRITICAL";
  return (
    <span className="px-2 py-0.5 rounded font-mono text-[9px] tracking-widest border"
      style={{ color, borderColor: `${color}30`, background: `${color}10` }}>
      {label}
    </span>
  );
}

function ObligationRow({ obl }: { obl: Obligation }) {
  const cfg = OBL_STATUS[obl.status];
  const Icon = cfg.icon;
  const daysLeft = Math.ceil((obl.dueDate.getTime() - Date.now()) / 86400000);
  return (
    <div className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
      <Icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: cfg.color }} />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-200">{obl.title}</div>
        <div className="text-[10px] text-slate-500 mt-0.5">{obl.description}</div>
        {obl.value > 0 && (
          <div className="text-[10px] font-mono text-gold-dim mt-0.5">${obl.value.toLocaleString()}</div>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <span className="px-1.5 py-0.5 rounded font-mono text-[8px] tracking-widest border"
          style={{ color: cfg.color, borderColor: `${cfg.color}30`, background: `${cfg.color}10` }}>
          {cfg.label}
        </span>
        <div className="text-[9px] font-mono mt-1" style={{ color: daysLeft < 14 ? "#fb923c" : "#94a3b8" }}>
          {daysLeft > 0 ? `${daysLeft}d` : "PAST DUE"}
        </div>
      </div>
    </div>
  );
}

function PartnerCard({ partner }: { partner: Partner }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[partner.type];
  const Icon = cfg.icon;
  const statusCfg = STATUS_CONFIG[partner.status];
  const daysSince = Math.ceil((Date.now() - partner.lastActivity.getTime()) / 86400000);
  const overdue = partner.obligations.filter((o) => o.status === "OVERDUE").length;
  const atRisk = partner.obligations.filter((o) => o.status === "AT_RISK").length;

  return (
    <div className="imperial-card rounded-lg overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 text-left hover:bg-white/2 transition-all">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center"
            style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}40` }}>
            <Icon className="w-5 h-5" style={{ color: cfg.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="font-semibold text-sm text-slate-200">{partner.name}</span>
              <span className="px-2 py-0.5 rounded font-mono text-[9px] tracking-widest border flex-shrink-0"
                style={{ color: statusCfg.color, borderColor: `${statusCfg.color}30`, background: `${statusCfg.color}10` }}>
                {statusCfg.label}
              </span>
            </div>
            <div className="text-[10px] text-slate-500">{partner.contactName} · {partner.contactRole}</div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-500" />
                <span className="text-[10px] text-slate-500">{daysSince}d since activity</span>
              </div>
              {(overdue > 0 || atRisk > 0) && (
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-orange-400" />
                  <span className="text-[10px] text-orange-400">
                    {overdue > 0 ? `${overdue} overdue` : `${atRisk} at risk`}
                  </span>
                </div>
              )}
            </div>
          </div>
          {expanded ? <ChevronDown className="w-4 h-4 text-slate-600 flex-shrink-0 mt-1" /> : <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0 mt-1" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded p-2.5 bg-white/3 text-center">
              <div className="text-[10px] text-slate-500 mb-1">Since</div>
              <div className="font-mono text-xs text-slate-300">{partner.since.toLocaleDateString("en-US", { month: "short", year: "numeric" })}</div>
            </div>
            <div className="rounded p-2.5 bg-white/3 text-center">
              <div className="text-[10px] text-slate-500 mb-1">Partnership Type</div>
              <div className="font-mono text-xs" style={{ color: cfg.color }}>{partner.type}</div>
            </div>
            <div className="rounded p-2.5 bg-white/3">
              <div className="text-[10px] text-slate-500 mb-1">Commitment Score</div>
              <CommitmentBar score={partner.commitmentScore} />
            </div>
            <div className="rounded p-2.5 bg-white/3 text-center">
              <div className="text-[10px] text-slate-500 mb-1">Partner Risk</div>
              <RiskPip score={partner.riskScore} />
            </div>
          </div>

          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">Shared Resources</div>
            <div className="flex flex-wrap gap-1.5">
              {partner.sharedResources.map((res) => (
                <span key={res} className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-slate-400 border border-white/8">{res}</span>
              ))}
            </div>
          </div>

          {partner.obligations.length > 0 && (
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">Obligations & Commitments</div>
              {partner.obligations.map((obl) => (
                <ObligationRow key={obl.id} obl={obl} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Coalition() {
  const [activeType, setActiveType] = useState<string | null>(null);
  const filtered = activeType ? COALITION_PARTNERS.filter((p) => p.type === activeType) : COALITION_PARTNERS;
  const activeCount = COALITION_PARTNERS.filter((p) => p.status === "ACTIVE").length;
  const strainedCount = COALITION_PARTNERS.filter((p) => p.status === "STRAINED").length;
  const overdueObls = COALITION_PARTNERS.flatMap((p) => p.obligations).filter((o) => o.status === "OVERDUE").length;
  const atRiskObls = COALITION_PARTNERS.flatMap((p) => p.obligations).filter((o) => o.status === "AT_RISK").length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Users className="w-5 h-5" style={{ color: "#c9a227" }} />
          <h1 className="font-display text-lg tracking-[0.2em] gold-text gold-glow font-bold uppercase">
            Coalition & Stakeholder Manager
          </h1>
        </div>
        <p className="text-xs text-slate-500 ml-8">
          Multi-organization coordination — partnership tracking · obligation management · shared resources · alliance health
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active Partners", value: activeCount, color: "#4ade80", icon: Check },
          { label: "Strained", value: strainedCount, color: strainedCount > 0 ? "#fb923c" : "#4ade80", icon: AlertTriangle },
          { label: "Overdue Obligations", value: overdueObls, color: overdueObls > 0 ? "#ef4444" : "#4ade80", icon: Clock },
          { label: "At-Risk Obligations", value: atRiskObls, color: atRiskObls > 0 ? "#fb923c" : "#4ade80", icon: AlertTriangle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="imperial-card rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon className="w-3.5 h-3.5" style={{ color }} />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
            </div>
            <div className="font-mono text-xl font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {(overdueObls > 0 || strainedCount > 0) && (
        <div className="rounded-lg p-3 border border-orange-900/50 bg-orange-950/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400 animate-pulse flex-shrink-0" />
            <div>
              <span className="font-display text-xs tracking-[0.12em] text-orange-400 uppercase font-bold">Coalition Health Alert</span>
              <div className="text-[10px] text-orange-300 mt-0.5">
                {overdueObls > 0 && `${overdueObls} overdue obligation${overdueObls > 1 ? "s" : ""} require immediate attention. `}
                {strainedCount > 0 && `${strainedCount} partner relationship${strainedCount > 1 ? "s" : ""} under strain.`}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {[null, "TECHNOLOGY", "LEGAL", "FINANCIAL", "STRATEGIC", "OPERATIONAL"].map((type) => (
          <button
            key={type || "all"}
            onClick={() => setActiveType(type)}
            className="px-3 py-1 rounded-full font-mono text-[10px] tracking-widest border transition-all"
            style={{
              color: type ? TYPE_CONFIG[type as keyof typeof TYPE_CONFIG].color : "#c9a227",
              borderColor: activeType === type ? (type ? TYPE_CONFIG[type as keyof typeof TYPE_CONFIG].color : "#c9a227") : "rgba(255,255,255,0.1)",
              background: activeType === type ? (type ? `${TYPE_CONFIG[type as keyof typeof TYPE_CONFIG].color}15` : "rgba(201,162,39,0.1)") : "transparent",
            }}
          >
            {type || "ALL PARTNERS"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((partner) => (
          <PartnerCard key={partner.id} partner={partner} />
        ))}
      </div>
    </div>
  );
}
