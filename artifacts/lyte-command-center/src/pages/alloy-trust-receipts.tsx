import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText, Shield, CheckCircle, ChevronRight, Download, Lock,
  Clock, Activity, Cpu, AlertTriangle, ArrowRight, Eye, Zap, Search, RefreshCw
} from "lucide-react";
import { api } from "@/lib/api";

const BG = { page: "#080c14", surface: "#0c1018", elevated: "#10141e" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.07)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" };
const ACCENT = "#d4a054";

interface PolicyDecision {
  rule: string;
  outcome: "approved" | "blocked" | "escalated" | "deferred";
  reason: string;
}

interface TrustReceipt {
  receiptId: string;
  runId: string;
  workflowName: string;
  pack: string;
  packColor: string;
  status: "verified" | "partial" | "failed";
  generatedAt: string;
  duration: string;
  triggeredBy: string;
  modelUsed?: string;
  inputs: Record<string, string>;
  outputs: Record<string, string>;
  policyDecisions: PolicyDecision[];
  evidence: string[];
  overallConfidence?: number;
  approvals: { role: string; approved: boolean; at?: string }[];
  signedBy: string;
  immutable: boolean;
}

const POLICY_OUTCOME_CFG = {
  approved:  { color: "#6b8f71", label: "Approved" },
  blocked:   { color: "#c45a4a", label: "Blocked" },
  escalated: { color: "#ec4899", label: "Escalated" },
  deferred:  { color: "#c8953c", label: "Deferred" },
};

const RECEIPTS: TrustReceipt[] = [
  {
    receiptId: "TRC-3038-A",
    runId: "RUN-3038",
    workflowName: "Security Posture Audit",
    pack: "Aegis",
    packColor: "#4f6ef7",
    status: "verified",
    generatedAt: "2026-04-01T06:14:24Z",
    duration: "2.8s",
    triggeredBy: "Lisa Monroe",
    modelUsed: "gpt-4o",
    inputs: {
      "Trigger": "Manual — Lisa Monroe",
      "Scope": "47 security controls across 6 domains",
      "Framework": "NIST CSF v2.0",
      "Prior Score": "91% (Q4 2025)",
    },
    outputs: {
      "Score": "94% (+3% QoQ)",
      "Critical Findings": "0",
      "Medium Findings": "3",
      "Recommendations": "3 issued",
      "Report Destination": "GRC Platform + Board Package",
    },
    policyDecisions: [
      { rule: "Compliance events → audit log", outcome: "approved", reason: "Compliance category — audit trail appended" },
      { rule: "CISO review for findings report", outcome: "approved", reason: "CISO sign-off received from Lisa Monroe" },
    ],
    evidence: [
      "Control scan: 47/47 evaluated",
      "3 medium-severity gaps identified in access control domain",
      "All prior recommendations from Q4 2025 verified as resolved",
      "GRC export: hash SHA-256:a9f2c3d4e5...",
    ],
    overallConfidence: 0.97,
    approvals: [
      { role: "CISO", approved: true, at: "2026-04-01T06:14:23Z" },
    ],
    signedBy: "alloy-covenant-engine-v2",
    immutable: true,
  },
  {
    receiptId: "TRC-3041-B",
    runId: "RUN-3041",
    workflowName: "Q1 Financial Report Generation",
    pack: "PRISM",
    packColor: "#d4a054",
    status: "verified",
    generatedAt: "2026-04-01T04:02:12Z",
    duration: "1.2s",
    triggeredBy: "Stephen Lutar",
    modelUsed: "gpt-4o",
    inputs: {
      "Trigger": "Scheduled — Stephen Lutar",
      "KPI Sources": "PRISM, Terra, Vessels, Aegis",
      "Period": "Q1 2026 (Jan 1 – Mar 31)",
      "Data Completeness": "93%",
    },
    outputs: {
      "Pages": "47",
      "Exhibits": "14",
      "Distribution": "Exec review queue (pending CFO approval)",
      "Status": "Awaiting approval — not yet distributed",
    },
    policyDecisions: [
      { rule: "Financial actions → Finance review", outcome: "approved", reason: "CFO approval gate inserted — pending signature" },
      { rule: "Compliance events → audit log", outcome: "approved", reason: "Compliance audit trail appended" },
    ],
    evidence: [
      "KPIs aggregated from 4 pack data sources",
      "2 minor data gaps noted: early-stage pipeline metrics",
      "AI narrative: 3,840 tokens, gpt-4o",
      "Draft confidence: 93%",
    ],
    overallConfidence: 0.91,
    approvals: [
      { role: "CFO", approved: false },
    ],
    signedBy: "alloy-covenant-engine-v2",
    immutable: true,
  },
  {
    receiptId: "TRC-3039-F",
    runId: "RUN-3039",
    workflowName: "Fuel Surcharge Rate Calculator",
    pack: "Vessels",
    packColor: "#38bdf8",
    status: "failed",
    generatedAt: "2026-03-31T06:44:18Z",
    duration: "0.3s",
    triggeredBy: "System",
    inputs: {
      "Trigger": "System — Brent crude price update signal",
      "Impact Estimate": "~$72,000 fleet-wide",
      "Time of Day": "06:44 AM",
    },
    outputs: {
      "Rate Update": "NOT APPLIED — blocked by policy",
      "Failure Reason": "Approval chain timeout",
    },
    policyDecisions: [
      { rule: "Financial actions > $50K → Finance review", outcome: "escalated", reason: "Impact exceeds $50K threshold — Finance approval required" },
      { rule: "Approval SLA: 24h", outcome: "blocked", reason: "No approver responded within 24h SLA window" },
    ],
    evidence: [
      "Brent crude: $87.40/bbl",
      "Calculated surcharge delta: +$4.20/mt",
      "Fleet-wide impact: $72,000",
      "Approval gate timeout: 24h elapsed",
    ],
    overallConfidence: 0.88,
    approvals: [
      { role: "Finance", approved: false },
    ],
    signedBy: "alloy-covenant-engine-v2",
    immutable: true,
  },
  {
    receiptId: "TRC-3037-A",
    runId: "RUN-3037",
    workflowName: "Asset Valuation Batch",
    pack: "Terra",
    packColor: "#a07848",
    status: "verified",
    generatedAt: "2026-03-31T20:00:04Z",
    duration: "4.1s",
    triggeredBy: "Finance",
    inputs: {
      "Trigger": "Scheduled — Finance team",
      "Assets": "6 real estate assets (TA-001 through TA-006)",
      "Prior NAV": "$84.2M combined",
      "Valuation Method": "DCF + Cap Rate blend",
    },
    outputs: {
      "Updated NAV": "$89.7M (+6.5%)",
      "All Assets Updated": "Yes",
      "Variance Range": "All within ±5% of prior",
      "Report": "Published to Finance dashboard",
    },
    policyDecisions: [
      { rule: "Compliance events → audit log", outcome: "approved", reason: "Financial batch — audit trail appended" },
    ],
    evidence: [
      "6/6 assets successfully valued",
      "Market comps: 42 comparable sales ingested",
      "DCF model: 5-year horizon, 6.8% discount rate",
      "All valuations within ±5% variance band",
    ],
    overallConfidence: 0.93,
    approvals: [],
    signedBy: "alloy-covenant-engine-v2",
    immutable: true,
  },
];

const STATUS_CFG = {
  verified: { color: "#6b8f71", bg: "rgba(107,143,113,0.08)", label: "Verified",      icon: CheckCircle },
  partial:  { color: "#c8953c", bg: "rgba(200,149,60,0.08)",  label: "Partial",       icon: AlertTriangle },
  failed:   { color: "#c45a4a", bg: "rgba(196,90,74,0.08)",   label: "Run Failed",    icon: AlertTriangle },
};

function ReceiptRow({ receipt }: { receipt: TrustReceipt }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[receipt.status];
  const Icon = cfg.icon;

  return (
    <div className="rounded-md overflow-hidden" style={{ background: BG.surface, border: `1px solid ${receipt.status === "failed" ? "rgba(196,90,74,0.15)" : BORDER.subtle}` }}>
      <button
        className="w-full flex items-start gap-3 p-3.5 text-left hover:bg-white/[0.015] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(107,143,113,0.08)", border: "1px solid rgba(107,143,113,0.15)" }}>
          <Shield className="w-4 h-4" style={{ color: "#6b8f71" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest" style={{ color: receipt.packColor, background: `${receipt.packColor}14` }}>{receipt.pack}</span>
            <span className="flex items-center gap-1 text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ color: cfg.color, background: cfg.bg }}>
              <Icon className="w-2.5 h-2.5" /> {cfg.label}
            </span>
            <span className="text-[7px] font-mono" style={{ color: TEXT.muted }}>{receipt.receiptId}</span>
            {receipt.immutable && (
              <span className="flex items-center gap-0.5 text-[7px] font-mono px-1 py-px rounded" style={{ color: "#6b8f71", background: "rgba(107,143,113,0.06)" }}>
                <Lock className="w-2 h-2" /> Sealed
              </span>
            )}
          </div>
          <div className="text-[11px] font-medium" style={{ color: TEXT.primary }}>{receipt.workflowName}</div>
          <div className="flex items-center gap-3 mt-0.5 text-[8px]" style={{ color: TEXT.muted }}>
            <span className="font-mono">{receipt.runId}</span>
            <span>·</span>
            <span>By {receipt.triggeredBy}</span>
            <span>·</span>
            <span>{receipt.duration}</span>
            <span>·</span>
            {receipt.overallConfidence != null && <span>{Math.round(receipt.overallConfidence * 100)}% confidence</span>}
          </div>
        </div>
        <ChevronRight className={`w-3.5 h-3.5 shrink-0 mt-1 transition-transform ${expanded ? "rotate-90" : ""}`} style={{ color: TEXT.muted }} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4" style={{ borderTop: `1px solid ${BORDER.subtle}` }}>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
            <div>
              <div className="text-[8px] uppercase tracking-widest mb-2" style={{ color: TEXT.muted }}>Inputs</div>
              <div className="rounded-md overflow-hidden" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                {Object.entries(receipt.inputs).map(([k, v]) => (
                  <div key={k} className="flex items-start gap-2 px-2.5 py-1.5" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
                    <span className="text-[8px] font-mono shrink-0" style={{ color: TEXT.muted, minWidth: 100 }}>{k}</span>
                    <span className="text-[8px]" style={{ color: TEXT.secondary }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[8px] uppercase tracking-widest mb-2" style={{ color: TEXT.muted }}>Outputs</div>
              <div className="rounded-md overflow-hidden" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                {Object.entries(receipt.outputs).map(([k, v]) => (
                  <div key={k} className="flex items-start gap-2 px-2.5 py-1.5" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
                    <span className="text-[8px] font-mono shrink-0" style={{ color: TEXT.muted, minWidth: 100 }}>{k}</span>
                    <span className="text-[8px]" style={{ color: TEXT.secondary }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="text-[8px] uppercase tracking-widest mb-2" style={{ color: TEXT.muted }}>Policy Decisions</div>
            <div className="space-y-1.5">
              {receipt.policyDecisions.map((d, i) => (
                <div key={i} className="flex items-start gap-2 rounded-md px-2.5 py-2" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded shrink-0" style={{ color: POLICY_OUTCOME_CFG[d.outcome].color, background: `${POLICY_OUTCOME_CFG[d.outcome].color}10` }}>
                    {POLICY_OUTCOME_CFG[d.outcome].label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-medium" style={{ color: TEXT.secondary }}>{d.rule}</div>
                    <div className="text-[8px] mt-0.5" style={{ color: TEXT.muted }}>{d.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[8px] uppercase tracking-widest mb-2" style={{ color: TEXT.muted }}>Evidence Chain</div>
            <div className="space-y-1">
              {receipt.evidence.map((e, i) => (
                <div key={i} className="flex items-start gap-2 text-[9px]">
                  <ArrowRight className="w-2.5 h-2.5 shrink-0 mt-0.5" style={{ color: TEXT.muted }} />
                  <span style={{ color: TEXT.secondary }}>{e}</span>
                </div>
              ))}
            </div>
          </div>

          {receipt.approvals.length > 0 && (
            <div>
              <div className="text-[8px] uppercase tracking-widest mb-2" style={{ color: TEXT.muted }}>Approval Record</div>
              <div className="space-y-1.5">
                {receipt.approvals.map((a, i) => (
                  <div key={i} className="flex items-center gap-2.5 rounded-md px-2.5 py-2" style={{ background: BG.elevated, border: `1px solid ${a.approved ? "rgba(107,143,113,0.15)" : "rgba(200,149,60,0.12)"}` }}>
                    <Shield className="w-3 h-3" style={{ color: a.approved ? "#6b8f71" : "#c8953c" }} />
                    <span className="text-[9px] font-medium" style={{ color: TEXT.secondary }}>{a.role}</span>
                    <span className="text-[8px]" style={{ color: a.approved ? "#6b8f71" : "#c8953c" }}>
                      {a.approved ? "Approved" : "Pending"}{a.at ? ` · ${a.at}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-md px-3 py-2.5" style={{ background: "rgba(107,143,113,0.04)", border: "1px solid rgba(107,143,113,0.12)" }}>
            <div className="flex items-center gap-2">
              <Lock className="w-3 h-3" style={{ color: "#6b8f71" }} />
              <div>
                <div className="text-[9px] font-semibold" style={{ color: "#6b8f71" }}>Issued by {receipt.signedBy}</div>
                <div className="text-[7px] font-mono mt-0.5" style={{ color: TEXT.muted }}>Generated: {receipt.generatedAt}</div>
              </div>
            </div>
            <button className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[8px] font-medium opacity-60 cursor-not-allowed" style={{ background: "rgba(107,143,113,0.08)", border: "1px solid rgba(107,143,113,0.15)", color: "#6b8f71" }}>
              <Download className="w-2.5 h-2.5" /> Export
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const RECEIPT_STATUS_MAP: Record<string, TrustReceipt["status"]> = {
  approved: "verified",
  verified: "verified",
  rejected: "failed",
  failed: "failed",
};

function mapApiReceipt(r: Record<string, unknown>): TrustReceipt {
  const provenance = (r.provenance as Record<string, unknown>) ?? {};
  const rawStatus = typeof r.status === "string" ? r.status : "unknown";
  return {
    receiptId: String(r.receiptId ?? r.id ?? `REC-${Date.now()}`),
    runId: String(provenance.correlationId ?? r.contentId ?? "—"),
    workflowName: String(r.contentType ?? "Workflow"),
    pack: "Alloy",
    packColor: "#d4a054",
    status: RECEIPT_STATUS_MAP[rawStatus] ?? "partial",
    generatedAt: String(r.createdAt ?? new Date().toISOString()),
    duration: "—",
    triggeredBy: String(provenance.modelId ?? provenance.modelProvider ?? "alloy-engine"),
    modelUsed: String(provenance.modelId ?? "—"),
    inputs: {
      "Content Type": String(r.contentType ?? "—"),
      "Content ID": String(r.contentId ?? "—"),
      "Receipt Class": String(r.receiptClass ?? "—"),
      "Policy Class": String(r.policyClass ?? "—"),
    },
    outputs: {
      "Status": rawStatus,
      "Confidence": typeof r.confidenceScore === "number" ? `${Math.round(r.confidenceScore * 100)}%` : "—",
    },
    policyDecisions: [],
    evidence: Array.isArray(provenance.whatWasSeen) ? (provenance.whatWasSeen as string[]) : [],
    overallConfidence: typeof r.confidenceScore === "number" ? r.confidenceScore : undefined,
    approvals: [],
    signedBy: String(r.serviceAttribution ?? "alloy-receipt-graph"),
    immutable: false,
  };
}

export default function AlloyTrustReceiptsPage() {
  const [search, setSearch] = useState("");

  const { data: receiptsData, isLoading: receiptsLoading } = useQuery({
    queryKey: ["receipt-graph-list"],
    queryFn: () => api.receipts.list({ limit: 20 }),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const { data: trustSummary } = useQuery({
    queryKey: ["receipt-graph-trust-summary"],
    queryFn: () => api.receipts.executiveSummary(),
    staleTime: 60_000,
  });

  const apiReceipts: TrustReceipt[] = (receiptsData?.receipts ?? []).map(mapApiReceipt);
  const allReceipts = apiReceipts.length > 0 ? [...apiReceipts, ...RECEIPTS] : RECEIPTS;

  const filtered = search ? allReceipts.filter(r =>
    r.workflowName.toLowerCase().includes(search.toLowerCase()) ||
    r.runId.toLowerCase().includes(search.toLowerCase()) ||
    r.receiptId.toLowerCase().includes(search.toLowerCase())
  ) : allReceipts;

  const verified = allReceipts.filter(r => r.status === "verified").length;
  const failed = allReceipts.filter(r => r.status === "failed").length;

  return (
    <div className="p-4 md:p-5 space-y-5" style={{ background: BG.page, minHeight: "100vh" }}>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-3.5 h-3.5" style={{ color: ACCENT }} />
          <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: ACCENT }}>Alloy · Trust Layer</span>
        </div>
        <h1 className="text-lg font-bold tracking-tight" style={{ color: TEXT.primary }}>Run-grade Trust Receipts</h1>
        <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>
          Every completed run produces a structured receipt capturing inputs, outputs, policy decisions, evidence, and confidence levels.
        </p>
      </div>

      <div className="rounded-md p-3 flex items-start gap-2" style={{ background: "rgba(107,143,113,0.04)", border: "1px solid rgba(107,143,113,0.12)" }}>
        <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "#6b8f71" }} />
        <p className="text-[9px] leading-relaxed" style={{ color: TEXT.secondary }}>
          Trust receipts are structured audit records issued by the COVENANT policy engine. They capture the full chain of custody for every run — what was seen, what was decided, who approved, and what changed. Receipts are exportable for compliance, capital review, and customer diligence.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Total Receipts",    value: receiptsLoading ? "…" : allReceipts.length, color: TEXT.secondary },
          { label: "Verified",          value: receiptsLoading ? "…" : verified,            color: "#6b8f71" },
          { label: "Failed Runs",       value: receiptsLoading ? "…" : failed,              color: "#c45a4a" },
        ].map(m => (
          <div key={m.label} className="rounded-md p-3 text-center" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
            <div className="text-base font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
            <div className="text-[8px] uppercase tracking-widest mt-0.5" style={{ color: TEXT.muted }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: TEXT.muted }} />
        <input
          type="text"
          placeholder="Search receipts by workflow name, run ID, or receipt ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded pl-8 pr-3 py-2 text-[10px] outline-none"
          style={{ background: BG.surface, border: `1px solid ${BORDER.muted}`, color: TEXT.primary }}
        />
      </div>

      <div className="space-y-2">
        {filtered.map(r => <ReceiptRow key={r.receiptId} receipt={r} />)}
        {filtered.length === 0 && (
          <div className="rounded-md py-12 flex flex-col items-center gap-3" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
            <FileText className="w-6 h-6" style={{ color: TEXT.muted }} />
            <p className="text-[11px]" style={{ color: TEXT.tertiary }}>No receipts match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
