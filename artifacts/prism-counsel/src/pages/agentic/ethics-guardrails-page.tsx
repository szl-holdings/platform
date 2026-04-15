import { useState } from "react";
import { Shield, Lock, AlertTriangle, CheckCircle, Users, Eye, XCircle, Clock, FileText, Brain, Activity, ChevronRight, Scale } from "lucide-react";

const PRISM_GOLD = "#c8a96e";
const PRISM_BLUE = "#4a8ab0";
const PRISM_RED = "#b85a4a";

interface ConflictCheck {
  id: string;
  matter: string;
  parties: string[];
  status: "clear" | "potential" | "conflict";
  checkedDate: string;
  checkedBy: string;
  details: string;
  relatedMatters: string[];
}

interface EthicalWall {
  id: string;
  matter: string;
  restrictedPersonnel: string[];
  reason: string;
  createdDate: string;
  status: "active" | "expired";
  accessAttempts: number;
  violations: number;
}

interface AIActionLog {
  timestamp: string;
  action: string;
  model: string;
  matter: string;
  privilegeLevel: "public" | "confidential" | "privileged" | "restricted";
  user: string;
  outcome: string;
  auditId: string;
}

const CONFLICTS: ConflictCheck[] = [
  { id: "CC-2024-087", matter: "TechCorp Acquisition Advisory", parties: ["TechCorp Inc.", "DataVault Corp.", "Meridian Capital"], status: "clear", checkedDate: "2024-03-14", checkedBy: "AI Conflict Engine", details: "No adverse relationships found. TechCorp is existing client (CLM). DataVault — no prior representation. Meridian — NDA counterparty only, no fiduciary relationship.", relatedMatters: ["CLM-2024-002"] },
  { id: "CC-2024-088", matter: "Smith v. Pinnacle Technologies", parties: ["John Smith", "Pinnacle Technologies Inc."], status: "potential", checkedDate: "2024-03-15", checkedBy: "AI Conflict Engine", details: "Pinnacle Technologies is an existing client (22 matters). Potential adverse representation — plaintiff bringing employment discrimination claim against current client. Partner review required.", relatedMatters: ["CLM-2024-001", "DOC-2024-001"] },
  { id: "CC-2024-089", matter: "Harbor Point v. Global Reinsurance", parties: ["Harbor Point Insurance", "Global Reinsurance Ltd."], status: "conflict", checkedDate: "2024-03-15", checkedBy: "AI Conflict Engine + Partner Review", details: "Direct conflict: Firm represented Global Reinsurance in coverage dispute (2022-2023, Matter #MR-2022-0145). Cannot represent Harbor Point adverse to former client on substantially related matter without consent.", relatedMatters: ["MR-2022-0145"] },
];

const WALLS: EthicalWall[] = [
  { id: "EW-001", matter: "Harbor Point — Bad Faith Litigation", restrictedPersonnel: ["David Park", "Maria Rodriguez"], reason: "Prior representation of adverse party (Global Reinsurance) on related matters", createdDate: "2024-02-15", status: "active", accessAttempts: 3, violations: 0 },
  { id: "EW-002", matter: "Pinnacle Technologies — Patent Dispute", restrictedPersonnel: ["Alex Turner"], reason: "Lateral hire from opposing firm with access to confidential client information", createdDate: "2024-01-08", status: "active", accessAttempts: 1, violations: 0 },
  { id: "EW-003", matter: "Metro Transit — Workers' Comp #WC-2023-042", restrictedPersonnel: ["James Whitfield"], reason: "Personal relationship with claimant's family", createdDate: "2023-11-20", status: "expired", accessAttempts: 0, violations: 0 },
];

const AI_LOG: AIActionLog[] = [
  { timestamp: "2024-03-15 14:23:18", action: "Contract clause extraction", model: "PRISM-CLM-v4.2", matter: "Martinez v. Pinnacle", privilegeLevel: "privileged", user: "Sarah Chen", outcome: "124 clauses extracted, privilege preserved", auditId: "AUD-2024-892847" },
  { timestamp: "2024-03-15 13:45:02", action: "Settlement prediction analysis", model: "PRISM-LPE-v4.2", matter: "Chen v. Harbor Point", privilegeLevel: "confidential", user: "David Park", outcome: "Prediction generated: 71% plaintiff win probability", auditId: "AUD-2024-892831" },
  { timestamp: "2024-03-15 12:18:44", action: "E-discovery relevance scoring", model: "PRISM-TAR-v3.1", matter: "Martinez v. Pinnacle", privilegeLevel: "privileged", user: "Maria Rodriguez", outcome: "2,400 documents scored, 18 privilege-flagged", auditId: "AUD-2024-892815" },
  { timestamp: "2024-03-15 11:02:31", action: "Regulatory change impact assessment", model: "PRISM-REG-v2.0", matter: "Firm-wide", privilegeLevel: "confidential", user: "System", outcome: "SEC Rule 10b5-1 amendments mapped to 3 policies", auditId: "AUD-2024-892798" },
  { timestamp: "2024-03-15 09:30:15", action: "Conflict of interest check", model: "PRISM-COI-v5.0", matter: "Smith v. Pinnacle", privilegeLevel: "restricted", user: "System", outcome: "Potential conflict detected — routed to partner review", auditId: "AUD-2024-892776" },
  { timestamp: "2024-03-14 16:45:22", action: "Privilege log entry generation", model: "PRISM-PRIV-v2.3", matter: "Martinez v. Pinnacle", privilegeLevel: "privileged", user: "James Whitfield", outcome: "42 new privilege log entries auto-generated", auditId: "AUD-2024-892754" },
];

const conflictColor = (s: string) => s === "clear" ? "#22c55e" : s === "potential" ? "#f59e0b" : "#ef4444";
const privColor = (p: string) => p === "public" ? "#22c55e" : p === "confidential" ? PRISM_BLUE : p === "privileged" ? PRISM_GOLD : "#ef4444";

export default function EthicsGuardrailsPage() {
  const [tab, setTab] = useState<"conflicts" | "walls" | "ai-log">("conflicts");

  const activeWalls = WALLS.filter(w => w.status === "active").length;
  const totalViolations = WALLS.reduce((s, w) => s + w.violations, 0);

  return (
    <div className="min-h-screen" style={{ background: "#080c14" }}>
      <div className="max-w-7xl mx-auto px-6 py-8 lg:px-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-white tracking-tight">Privilege & Ethics Guardrails</h1>
          <p className="text-[11px] text-white/30 mt-1">Automated conflict checking, ethical wall enforcement, privilege-aware AI logging, and information barrier monitoring</p>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-6">
          {[
            { label: "Conflicts Checked", value: CONFLICTS.length.toString(), icon: Scale, color: PRISM_GOLD },
            { label: "Active Walls", value: activeWalls.toString(), icon: Shield, color: PRISM_BLUE },
            { label: "Wall Violations", value: totalViolations.toString(), icon: XCircle, color: totalViolations > 0 ? "#ef4444" : "#22c55e" },
            { label: "AI Actions Logged", value: AI_LOG.length.toString(), icon: Brain, color: PRISM_GOLD },
            { label: "Blocked Access", value: WALLS.reduce((s, w) => s + w.accessAttempts, 0).toString(), icon: Lock, color: PRISM_RED },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <s.icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                <span className="text-[8px] uppercase tracking-wider text-white/25">{s.label}</span>
              </div>
              <p className="text-2xl font-semibold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          {(["conflicts", "walls", "ai-log"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              aria-label={`Show ${t === "conflicts" ? "Conflict Checks" : t === "walls" ? "Ethical Walls" : "AI Action Log"} tab`}
              className={`text-[10px] font-semibold uppercase tracking-wider rounded-lg px-4 py-2 transition ${tab === t ? "text-white" : "text-white/25 hover:text-white/40"}`}
              style={tab === t ? { background: PRISM_GOLD + "15", color: PRISM_GOLD } : {}}>
              {t === "conflicts" ? "Conflict Checks" : t === "walls" ? "Ethical Walls" : "AI Action Log"}
            </button>
          ))}
        </div>

        {tab === "conflicts" && (
          <div className="space-y-3">
            {CONFLICTS.map(c => (
              <div key={c.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-3 w-3 rounded-full" style={{ background: conflictColor(c.status) }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-mono text-white/20">{c.id}</span>
                      <span className="text-[8px] uppercase font-bold tracking-wider rounded px-1.5 py-0.5" style={{ background: conflictColor(c.status) + "15", color: conflictColor(c.status) }}>{c.status}</span>
                    </div>
                    <p className="text-sm font-medium text-white">{c.matter}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-white/25">{c.checkedDate}</p>
                    <p className="text-[9px] text-white/15">{c.checkedBy}</p>
                  </div>
                </div>
                <div className="flex gap-1.5 mb-3">
                  {c.parties.map(p => (
                    <span key={p} className="text-[9px] px-2 py-0.5 rounded-full border border-white/[0.06] bg-white/[0.02] text-white/35">{p}</span>
                  ))}
                </div>
                <div className="rounded-lg bg-white/[0.015] border border-white/[0.04] p-3">
                  <p className="text-[10px] text-white/45 leading-relaxed">{c.details}</p>
                </div>
                {c.relatedMatters.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[8px] text-white/15">Related:</span>
                    {c.relatedMatters.map(m => (
                      <span key={m} className="text-[9px] font-mono" style={{ color: PRISM_BLUE }}>{m}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "walls" && (
          <div className="space-y-3">
            {WALLS.map(w => (
              <div key={w.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" style={{ color: w.status === "active" ? PRISM_RED : "rgba(255,255,255,0.2)" }} />
                    <div>
                      <p className="text-sm font-medium text-white">{w.matter}</p>
                      <p className="text-[9px] text-white/25">{w.id} · Created {w.createdDate}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-semibold rounded-full px-2.5 py-0.5" style={{ background: w.status === "active" ? PRISM_RED + "15" : "rgba(255,255,255,0.03)", color: w.status === "active" ? PRISM_RED : "rgba(255,255,255,0.25)" }}>
                    {w.status}
                  </span>
                </div>
                <div className="rounded-lg bg-white/[0.015] border border-white/[0.04] p-3 mb-3">
                  <p className="text-[10px] text-white/45">{w.reason}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-[8px] uppercase tracking-wider text-white/20 mb-1">Restricted Personnel</p>
                    <div className="flex gap-1.5">
                      {w.restrictedPersonnel.map(p => (
                        <span key={p} className="text-[9px] px-2 py-0.5 rounded-full border border-red-500/20 bg-red-500/5 text-red-400/60">{p}</span>
                      ))}
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-[8px] uppercase tracking-wider text-white/20">Attempts</p>
                      <p className="text-sm font-semibold text-white">{w.accessAttempts}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] uppercase tracking-wider text-white/20">Violations</p>
                      <p className="text-sm font-semibold" style={{ color: w.violations > 0 ? "#ef4444" : "#22c55e" }}>{w.violations}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "ai-log" && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <div className="grid grid-cols-12 gap-0 p-3 border-b border-white/[0.04]">
              <span className="col-span-2 text-[8px] uppercase tracking-wider text-white/20 font-semibold">Timestamp</span>
              <span className="col-span-3 text-[8px] uppercase tracking-wider text-white/20 font-semibold">Action</span>
              <span className="col-span-2 text-[8px] uppercase tracking-wider text-white/20 font-semibold">Matter</span>
              <span className="col-span-1 text-[8px] uppercase tracking-wider text-white/20 font-semibold">Privilege</span>
              <span className="col-span-1 text-[8px] uppercase tracking-wider text-white/20 font-semibold">User</span>
              <span className="col-span-3 text-[8px] uppercase tracking-wider text-white/20 font-semibold">Outcome</span>
            </div>
            {AI_LOG.map(log => (
              <div key={log.auditId} className="grid grid-cols-12 gap-0 p-3 border-b border-white/[0.02] hover:bg-white/[0.015] transition items-center">
                <span className="col-span-2 text-[9px] font-mono text-white/25">{log.timestamp.slice(5)}</span>
                <div className="col-span-3">
                  <p className="text-[10px] text-white/50">{log.action}</p>
                  <p className="text-[8px] font-mono text-white/15">{log.model}</p>
                </div>
                <span className="col-span-2 text-[10px] text-white/40">{log.matter}</span>
                <span className="col-span-1">
                  <span className="text-[8px] uppercase font-bold tracking-wider rounded px-1.5 py-0.5" style={{ background: privColor(log.privilegeLevel) + "15", color: privColor(log.privilegeLevel) }}>{log.privilegeLevel}</span>
                </span>
                <span className="col-span-1 text-[9px] text-white/30">{log.user}</span>
                <span className="col-span-3 text-[9px] text-white/35">{log.outcome}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
