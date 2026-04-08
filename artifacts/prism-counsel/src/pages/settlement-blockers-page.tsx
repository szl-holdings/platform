import { useState } from "react";
import { Link } from "wouter";
import {
  Layers, AlertTriangle, Clock, ChevronRight, Building2,
  FileText, Shield, XCircle, CheckCircle, Eye, RefreshCw,
  Gavel, MapPin, ShieldAlert, TrendingDown
} from "lucide-react";

const BLOCKER_TYPE_META: Record<string, { icon: any; color: string; label: string }> = {
  missing_evidence: { icon: FileText, color: "#c45a4a", label: "Missing Evidence" },
  missing_records: { icon: FileText, color: "#c8953c", label: "Missing Records" },
  contradiction: { icon: AlertTriangle, color: "#c45a4a", label: "Contradiction" },
  insurer_silence: { icon: Building2, color: "#d4a054", label: "Insurer Silence" },
  insurer_hardening: { icon: Building2, color: "#c45a4a", label: "Insurer Hardening" },
  no_fault_support: { icon: Shield, color: "#c8953c", label: "No-Fault Support" },
  recovery_lien: { icon: ShieldAlert, color: "#c45a4a", label: "Recovery / Lien" },
  approval: { icon: CheckCircle, color: "#8b7ac8", label: "Approval" },
  review_backlog: { icon: Clock, color: "#d4a054", label: "Review Backlog" },
  venue_timing: { icon: MapPin, color: "#8b7ac8", label: "Venue Timing" },
  document_confidence: { icon: Eye, color: "#c8953c", label: "Document Confidence" },
  export_safety: { icon: Shield, color: "#c45a4a", label: "Export Safety" },
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#c45a4a",
  high: "#d4a054",
  medium: "#c8953c",
  low: "#4a90b8",
};

const DEMO_BLOCKERS = [
  {
    id: 1,
    matterId: 1,
    matterTitle: "Rodriguez v. National General Insurance",
    caseNumber: "2025-CV-04821",
    blockerType: "recovery_lien",
    title: "Medicaid AHCA lien — amount not confirmed",
    description: "Conditional payment letter received Jan 2026. Amount requested but not provided. Settlement cannot proceed without resolution.",
    severity: "critical",
    confidence: 0.87,
    isInternal: false,
    isExternal: true,
    ownerId: 1,
    ownerRole: "Paralegal",
    status: "open",
    nextBestAction: "Escalate to AHCA with certified letter; include case summary and settlement timeline",
    consequencesIfIgnored: "Cannot distribute settlement funds. MSP compliance exposure. Potential clawback liability.",
    blocksWhat: "Settlement distribution, export, demand finalization",
    daysOpen: 47,
  },
  {
    id: 2,
    matterId: 1,
    matterTitle: "Rodriguez v. National General Insurance",
    caseNumber: "2025-CV-04821",
    blockerType: "missing_evidence",
    title: "Wage verification letter outstanding",
    description: "Employer has not provided formal wage verification after 3 requests. Demand packet cannot be finalized.",
    severity: "high",
    confidence: 0.92,
    isInternal: true,
    isExternal: false,
    ownerId: 2,
    ownerRole: "Attorney",
    status: "in_progress",
    nextBestAction: "Issue final written demand to employer with 10-day deadline; prepare affidavit alternative",
    consequencesIfIgnored: "Lost wages component weakened. Demand packet 78% complete — cannot send.",
    blocksWhat: "Demand packet send, settlement demand",
    daysOpen: 22,
  },
  {
    id: 3,
    matterId: 1,
    matterTitle: "Rodriguez v. National General Insurance",
    caseNumber: "2025-CV-04821",
    blockerType: "recovery_lien",
    title: "Jackson Memorial hospital lien — dispute active",
    description: "Hospital asserted $5,600 lien. Firm contested overage. Hospital has not responded to dispute letter.",
    severity: "high",
    confidence: 0.72,
    isInternal: false,
    isExternal: true,
    ownerId: 1,
    ownerRole: "Paralegal",
    status: "open",
    nextBestAction: "Follow up dispute letter; set 14-day response deadline; prepare for mediation with hospital",
    consequencesIfIgnored: "Export blocked. Dispute will delay settlement distribution.",
    blocksWhat: "Export, settlement distribution",
    daysOpen: 12,
  },
  {
    id: 4,
    matterId: 2,
    matterTitle: "Thompson v. Westfield Mall Holdings",
    caseNumber: "2025-CV-07293",
    blockerType: "missing_evidence",
    title: "Surveillance footage not produced",
    description: "Mall management has not produced interior camera footage despite motion to compel filed.",
    severity: "critical",
    confidence: 0.94,
    isInternal: false,
    isExternal: true,
    ownerId: 2,
    ownerRole: "Attorney",
    status: "open",
    nextBestAction: "File motion for sanctions; request adverse inference instruction; depose facilities manager",
    consequencesIfIgnored: "Liability contested without objective evidence. Mediation position weakened. Exposure to low offer.",
    blocksWhat: "Trial readiness, mediation strategy, liability proof",
    daysOpen: 31,
  },
  {
    id: 5,
    matterId: 2,
    matterTitle: "Thompson v. Westfield Mall Holdings",
    caseNumber: "2025-CV-07293",
    blockerType: "recovery_lien",
    title: "BCBS NJ reimbursement claim — documentation pending",
    description: "ERISA plan. Documentation requested. No confirmation of lien amount before mediation date.",
    severity: "high",
    confidence: 0.78,
    isInternal: false,
    isExternal: true,
    ownerId: 1,
    ownerRole: "Paralegal",
    status: "open",
    nextBestAction: "Contact BCBS NJ plan administrator; obtain EOB statements; flag for mediation memo",
    consequencesIfIgnored: "Mediation settlement at risk without confirmed lien exposure. Net-to-client estimate unreliable.",
    blocksWhat: "Settlement readiness, mediation preparation",
    daysOpen: 8,
  },
  {
    id: 6,
    matterId: 3,
    matterTitle: "Meridian Holdings v. Atlantic Casualty",
    caseNumber: "2025-CV-11047",
    blockerType: "insurer_silence",
    title: "Atlantic Casualty non-responsive — 60+ days",
    description: "No response to coverage demand or counter-proposal in 62 days. Silence strengthening bad faith argument.",
    severity: "high",
    confidence: 0.85,
    isInternal: false,
    isExternal: true,
    ownerId: 2,
    ownerRole: "Attorney",
    status: "open",
    nextBestAction: "Formal demand letter citing silence as evidence of bad faith; set 10-day response ultimatum",
    consequencesIfIgnored: "Settlement momentum stalled. Motion for partial summary judgment on bad faith may be necessary.",
    blocksWhat: "Settlement negotiations, demand progression",
    daysOpen: 62,
  },
  {
    id: 7,
    matterId: 3,
    matterTitle: "Meridian Holdings v. Atlantic Casualty",
    caseNumber: "2025-CV-11047",
    blockerType: "missing_records",
    title: "Underwriting file not produced",
    description: "Subpoena served 28 days ago. No compliance. Critical for bad faith and coverage argument.",
    severity: "medium",
    confidence: 0.80,
    isInternal: false,
    isExternal: true,
    ownerId: 2,
    ownerRole: "Attorney",
    status: "in_progress",
    nextBestAction: "File motion to compel with sanctions request; schedule hearing",
    consequencesIfIgnored: "Coverage argument incomplete. Bad faith claim less supportable without underwriting file.",
    blocksWhat: "Coverage analysis, discovery completion",
    daysOpen: 28,
  },
];

type BlockerFilter = "all" | "critical" | "internal" | "external" | "open";

export default function SettlementBlockersPage() {
  const [filter, setFilter] = useState<BlockerFilter>("all");

  const filtered = DEMO_BLOCKERS.filter(b => {
    if (filter === "all") return true;
    if (filter === "critical") return b.severity === "critical" || b.severity === "high";
    if (filter === "internal") return b.isInternal;
    if (filter === "external") return b.isExternal;
    if (filter === "open") return b.status === "open";
    return true;
  });

  const criticalCount = DEMO_BLOCKERS.filter(b => b.severity === "critical").length;
  const highCount = DEMO_BLOCKERS.filter(b => b.severity === "high").length;
  const openCount = DEMO_BLOCKERS.filter(b => b.status === "open").length;
  const externalCount = DEMO_BLOCKERS.filter(b => b.isExternal).length;

  return (
    <div className="p-6 max-w-[1300px] mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#d4a054]" />
            <h1 className="text-lg font-semibold text-slate-100">Settlement Blocker Intelligence</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20">PILOT TWO</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">12-type blocker classification — severity, ownership, consequences, clearing actions</p>
        </div>
        <Link href="/recovery-ops">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#c45a4a]/10 text-[#c45a4a] border border-[#c45a4a]/20 hover:bg-[#c45a4a]/20 transition-colors">
            <ShieldAlert className="w-3.5 h-3.5" />
            Recovery & Lien Ops
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Critical Blockers", value: criticalCount, icon: XCircle, accent: "#c45a4a" },
          { label: "High Priority", value: highCount, icon: AlertTriangle, accent: "#d4a054" },
          { label: "Open", value: openCount, icon: Clock, accent: "#c8953c" },
          { label: "External Blockers", value: externalCount, icon: Building2, accent: "#8b7ac8" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className="w-3.5 h-3.5" style={{ color: stat.accent }} />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</span>
              </div>
              <div className="text-xl font-semibold text-slate-100">{stat.value}</div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        {([
          { key: "all", label: "All Blockers" },
          { key: "critical", label: "Critical / High" },
          { key: "external", label: "External" },
          { key: "internal", label: "Internal" },
          { key: "open", label: "Open" },
        ] as { key: BlockerFilter; label: string }[]).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
              filter === f.key
                ? "bg-[#d4a054]/20 text-[#d4a054]"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(blocker => {
          const meta = BLOCKER_TYPE_META[blocker.blockerType];
          const Icon = meta?.icon ?? AlertTriangle;
          const severityColor = SEVERITY_COLORS[blocker.severity] ?? "#6b7280";

          return (
            <div key={blocker.id} className="rounded-lg border p-4 transition-colors" style={{ background: "#0c1220", borderColor: blocker.severity === "critical" ? "#c45a4a30" : "rgba(255,255,255,0.06)" }}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg flex-shrink-0" style={{ background: `${meta?.color ?? "#6b7280"}15` }}>
                  <Icon className="w-4 h-4" style={{ color: meta?.color ?? "#6b7280" }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-slate-100">{blocker.title}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: `${severityColor}18`, color: severityColor }}>
                          {blocker.severity.toUpperCase()}
                        </span>
                        {blocker.isExternal && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#8b7ac8]/10 text-[#8b7ac8]">EXTERNAL</span>
                        )}
                        {blocker.isInternal && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/[0.06] text-slate-400">INTERNAL</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <span className="text-[#4a90b8]">{meta?.label}</span>
                        <span>·</span>
                        <span className="truncate">{blocker.matterTitle.split(" v. ")[0]}</span>
                        <span>·</span>
                        <span className="font-mono">{blocker.caseNumber}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-mono text-slate-500">{blocker.daysOpen}d open</div>
                      <div className="text-[9px] text-slate-600">conf: {Math.round(blocker.confidence * 100)}%</div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">{blocker.description}</p>

                  <div className="grid grid-cols-3 gap-3 mt-2">
                    <div className="rounded border border-white/[0.04] p-2.5" style={{ background: "#080c14" }}>
                      <div className="text-[9px] text-slate-600 uppercase mb-1">What It Blocks</div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">{blocker.blocksWhat}</p>
                    </div>
                    <div className="rounded border border-white/[0.04] p-2.5" style={{ background: "#080c14" }}>
                      <div className="text-[9px] text-slate-600 uppercase mb-1">Next Best Action</div>
                      <p className="text-[10px] text-[#4a90b8] leading-relaxed">{blocker.nextBestAction}</p>
                    </div>
                    <div className="rounded border border-[#c45a4a]/10 p-2.5" style={{ background: "#080c14" }}>
                      <div className="text-[9px] text-[#c45a4a] uppercase mb-1">If Ignored</div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">{blocker.consequencesIfIgnored}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3 pt-2 border-t border-white/[0.04]">
                    <span className="text-[9px] text-slate-600">Owner: <span className="text-slate-400">{blocker.ownerRole}</span></span>
                    <span className="text-[9px] text-slate-600">Status: <span className={`${blocker.status === "open" ? "text-[#d4a054]" : "text-[#4a90b8]"}`}>{blocker.status.replace("_", " ")}</span></span>
                    <div className="flex-1" />
                    <button className="px-2 py-0.5 rounded text-[9px] text-[#4a90b8] border border-[#4a90b8]/20 hover:bg-[#4a90b8]/10 transition-colors">
                      Take Action
                    </button>
                    <button className="px-2 py-0.5 rounded text-[9px] text-slate-400 border border-white/[0.06] hover:border-white/[0.12] hover:text-slate-200 transition-colors">
                      Mark Resolved
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
