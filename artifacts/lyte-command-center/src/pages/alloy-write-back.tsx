import { useState } from "react";
import { Shield, AlertTriangle, CheckCircle2, XCircle, Clock, Eye, ChevronRight, Lock, Download, Database, ArrowRight, FileText } from "lucide-react";

const BG = { page: "#080c14", surface: "#0c1018", elevated: "#10141e" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.06)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" };
const ALLOY = "#4B8BDB";
const ALLOY_DIM = "rgba(75,139,219,0.12)";

type GateStatus = "pending" | "approved" | "rejected" | "held";

interface WriteBackItem {
  id: string;
  type: "write_back" | "export";
  title: string;
  description: string;
  target: string;
  pack: string;
  packColor: string;
  status: GateStatus;
  requestedBy: string;
  requestedAt: string;
  dataScope: string;
  riskLevel: "high" | "medium" | "low";
  irreversible: boolean;
}

const GATE_ITEMS: WriteBackItem[] = [
  {
    id: "GW-1041",
    type: "write_back",
    title: "Q2 Pricing — Apply to charter rate table",
    description: "Approved Q2 pricing revision will be written to the charter rate system. This action is irreversible without a full rollback workflow.",
    target: "Charter Rate System",
    pack: "Vessels",
    packColor: "#38bdf8",
    status: "pending",
    requestedBy: "Fleet Ops",
    requestedAt: "22h ago",
    dataScope: "7 vessel charter rate records",
    riskLevel: "high",
    irreversible: true,
  },
  {
    id: "GW-1039",
    type: "export",
    title: "Portfolio Valuation Export — Q1 close",
    description: "Full asset valuation dataset export for external auditor. Contains appraisal values, income data, and cap rates for 14 assets.",
    target: "Secure Auditor Portal",
    pack: "Terra",
    packColor: "#a07848",
    status: "pending",
    requestedBy: "Finance",
    requestedAt: "4h ago",
    dataScope: "14 assets, 3 years historical",
    riskLevel: "medium",
    irreversible: false,
  },
  {
    id: "GW-1036",
    type: "write_back",
    title: "Asset NAV update — batch valuation results",
    description: "Asset valuation workflow completed. Results will overwrite existing NAV records in the asset management system.",
    target: "Asset Management System",
    pack: "Terra",
    packColor: "#a07848",
    status: "approved",
    requestedBy: "Finance",
    requestedAt: "1d ago",
    dataScope: "6 assets",
    riskLevel: "medium",
    irreversible: false,
  },
  {
    id: "GW-1033",
    type: "export",
    title: "Aegis — Security posture export for board",
    description: "Board-level security posture summary export. Sanitized for external distribution, no operational details included.",
    target: "Board Reporting Package",
    pack: "Aegis",
    packColor: "#4f6ef7",
    status: "approved",
    requestedBy: "Lisa Monroe",
    requestedAt: "6h ago",
    dataScope: "Executive summary, 94% score card",
    riskLevel: "low",
    irreversible: false,
  },
  {
    id: "GW-1030",
    type: "write_back",
    title: "Ownership conflict resolution — AR accounts",
    description: "System detected ownership conflict in 3 AR accounts. Proposed resolution will assign single owner and remove conflicting claims.",
    target: "PRISM Ownership Graph",
    pack: "PRISM",
    packColor: "#d4a054",
    status: "held",
    requestedBy: "System",
    requestedAt: "18h ago",
    dataScope: "3 AR accounts",
    riskLevel: "high",
    irreversible: false,
  },
];

const STATUS_CFG: Record<GateStatus, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: "Pending Review", color: "#d4a054", bg: "rgba(212,160,84,0.08)", icon: Clock },
  approved: { label: "Approved", color: "#22c55e", bg: "rgba(34,197,94,0.08)", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "#c45a4a", bg: "rgba(196,90,74,0.08)", icon: XCircle },
  held: { label: "On Hold", color: "#8b7ac8", bg: "rgba(139,122,200,0.08)", icon: AlertTriangle },
};

function StatusPill({ status }: { status: GateStatus }) {
  const cfg = STATUS_CFG[status];
  const Icon = cfg.icon;
  return (
    <span className="flex items-center gap-1 text-[8px] font-medium px-2 py-0.5 rounded-full" style={{ color: cfg.color, background: cfg.bg }}>
      <Icon className="w-2.5 h-2.5" /> {cfg.label}
    </span>
  );
}

function RiskBadge({ level }: { level: "high" | "medium" | "low" }) {
  const cfg = { high: { color: "#c45a4a", bg: "rgba(196,90,74,0.08)" }, medium: { color: "#c8953c", bg: "rgba(200,149,60,0.08)" }, low: { color: "#22c55e", bg: "rgba(34,197,94,0.08)" } }[level];
  return <span className="text-[7px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider capitalize" style={{ color: cfg.color, background: cfg.bg }}>{level} risk</span>;
}

export default function AlloyWriteBackPage() {
  const [activeTab, setActiveTab] = useState<"all" | "write_back" | "export">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = GATE_ITEMS.filter(i => activeTab === "all" || i.type === activeTab);
  const pending = GATE_ITEMS.filter(i => i.status === "pending").length;

  return (
    <div className="p-4 md:p-5 space-y-5" style={{ background: BG.page }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-3.5 h-3.5" style={{ color: ALLOY }} />
            <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: ALLOY }}>Alloy Gating</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight" style={{ color: TEXT.primary }}>Write-Back & Export Gates</h1>
          <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>Review and authorize external system writes and data exports before they execute</p>
        </div>
        {pending > 0 && (
          <div className="rounded px-3 py-2 text-center shrink-0" style={{ background: "rgba(212,160,84,0.08)", border: "1px solid rgba(212,160,84,0.18)" }}>
            <div className="text-base font-mono font-bold" style={{ color: "#d4a054" }}>{pending}</div>
            <div className="text-[7px] uppercase tracking-wider" style={{ color: "rgba(212,160,84,0.55)" }}>Pending</div>
          </div>
        )}
      </div>

      {/* Safety notice */}
      <div className="rounded-md p-3 flex items-start gap-3" style={{ background: "rgba(75,139,219,0.04)", border: `1px solid ${ALLOY}20` }}>
        <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: ALLOY }} />
        <p className="text-[10px] leading-relaxed" style={{ color: TEXT.secondary }}>
          All external system writes and data exports pass through this gate before execution. Irreversible operations are flagged with additional confirmation requirements. No data leaves the platform without explicit authorization.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
        {[{ id: "all", label: "All Gates" }, { id: "write_back", label: "Write-Back" }, { id: "export", label: "Exports" }].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className="px-3 py-2 text-[9px] font-medium uppercase tracking-widest transition-colors"
            style={{
              color: activeTab === t.id ? TEXT.primary : TEXT.tertiary,
              borderBottom: activeTab === t.id ? `2px solid ${ALLOY}` : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Gate items */}
      <div className="space-y-2.5">
        {filtered.map(item => {
          const isExpanded = expanded === item.id;
          const cfg = STATUS_CFG[item.status];
          return (
            <div key={item.id} className="rounded-md overflow-hidden" style={{ background: BG.surface, border: `1px solid ${item.status === "pending" ? cfg.color + "25" : BORDER.subtle}` }}>
              <button
                onClick={() => setExpanded(isExpanded ? null : item.id)}
                className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/[0.015] transition-colors"
              >
                <div className="w-8 h-8 rounded flex items-center justify-center shrink-0" style={{ background: item.type === "write_back" ? "rgba(196,90,74,0.08)" : "rgba(75,139,219,0.08)" }}>
                  {item.type === "write_back" ? <Database className="w-4 h-4" style={{ color: "#c45a4a" }} /> : <Download className="w-4 h-4" style={{ color: ALLOY }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest" style={{ color: item.packColor, background: `${item.packColor}14` }}>{item.pack}</span>
                    <StatusPill status={item.status} />
                    <RiskBadge level={item.riskLevel} />
                    {item.irreversible && (
                      <span className="flex items-center gap-0.5 text-[7px] px-1.5 py-0.5 rounded" style={{ color: "#c45a4a", background: "rgba(196,90,74,0.06)" }}>
                        <AlertTriangle className="w-2 h-2" /> Irreversible
                      </span>
                    )}
                  </div>
                  <h3 className="text-[12px] font-medium" style={{ color: TEXT.primary }}>{item.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-[8px]">
                    <span style={{ color: TEXT.muted }}>Target: <span style={{ color: TEXT.tertiary }}>{item.target}</span></span>
                    <span style={{ color: TEXT.muted }}>· {item.requestedAt}</span>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>{item.id}</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} style={{ color: TEXT.muted }} />
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4" style={{ borderTop: `1px solid ${BORDER.subtle}` }}>
                  <div className="pt-3 space-y-3">
                    <p className="text-[11px] leading-relaxed" style={{ color: TEXT.secondary }}>{item.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-[9px]">
                      <div className="rounded p-2" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                        <span style={{ color: TEXT.muted }}>Data scope</span>
                        <p className="mt-0.5" style={{ color: TEXT.secondary }}>{item.dataScope}</p>
                      </div>
                      <div className="rounded p-2" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                        <span style={{ color: TEXT.muted }}>Requested by</span>
                        <p className="mt-0.5" style={{ color: TEXT.secondary }}>{item.requestedBy} · {item.requestedAt}</p>
                      </div>
                    </div>
                    {item.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] font-medium" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}>
                          <CheckCircle2 className="w-2.5 h-2.5" /> Approve & Execute
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] font-medium" style={{ background: "rgba(196,90,74,0.08)", border: "1px solid rgba(196,90,74,0.18)", color: "#c45a4a" }}>
                          <XCircle className="w-2.5 h-2.5" /> Reject
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] font-medium" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER.subtle}`, color: TEXT.secondary }}>
                          <Eye className="w-2.5 h-2.5" /> Preview Impact
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
