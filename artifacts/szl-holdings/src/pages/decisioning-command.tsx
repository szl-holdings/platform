import { useState, useEffect, useCallback, useRef } from "react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  Brain,
  Shield,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ChevronDown,
  ChevronRight,
  Play,
  Eye,
  RefreshCw,
  FileText,
  TrendingUp,
  Lock,
  Unlock,
  History,
  ChevronLeft,
  Filter,
  Radio,
  Database,
} from "lucide-react";

interface StoredRun {
  runId: string;
  workflowId: string;
  workflowName: string;
  domain: string;
  status: string;
  initiatedBy?: string;
  approvedBy?: string;
  isDryRun: boolean;
  isSimulation: boolean;
  requiresApproval: boolean;
  durationMs?: number;
  recommendationId?: string;
  outcome?: string;
  outcomeSummary?: string;
  startedAt: string;
  completedAt?: string | null;
}

interface Evidence {
  label: string;
  value: string;
  source?: string;
}

interface PolicyEvaluation {
  effect: string;
  reasoning: string;
  matchedPolicies: Array<{ policyId: string; ruleName: string; effect: string }>;
  violations: Array<{ policyId: string; policyName: string; reason: string }>;
}

interface Recommendation {
  id: string;
  title: string;
  summary: string;
  reasoning: string;
  domain: string;
  confidence: number;
  urgency: "routine" | "moderate" | "urgent" | "critical";
  priority: number;
  suggestedAction: string;
  suggestedOwner?: string;
  estimatedCostUsd?: number;
  evidence?: Evidence[];
  policyState: "unchecked" | "allowed" | "requires_approval" | "blocked";
  approvalState: "none" | "pending" | "approved" | "rejected" | "escalated";
  executionStatus: "none" | "queued" | "running" | "completed" | "failed" | "rolled_back";
  policyEvaluation?: PolicyEvaluation;
  businessImpact: {
    financialExposureUsd?: number;
    reputationalRisk?: string;
    regulatoryExposure?: boolean;
    crossDomainBlastRadius?: string[];
  };
  sourceSignals: Array<{ id: string; domain: string; type: string; source: string }>;
}

const DEMO_SIGNAL_GROUPS = [
  {
    domain: "szl-holdings",
    confidence: 0.82,
    suggestedAction: "Initiate portfolio rebalancing review",
    suggestedOwner: "Portfolio Committee",
    estimatedCostUsd: 0,
    businessImpact: {
      financialExposureUsd: 4200000,
      reputationalRisk: "medium",
      regulatoryExposure: false,
      crossDomainBlastRadius: ["terra", "vessels"],
    },
    customTitle: "Market Volatility Exceeds Rebalancing Threshold",
    customSummary: "Market volatility index reached 0.72 across logistics REITs and fixed-income positions, triggering a portfolio rebalancing review signal.",
    customReasoning: "Priority score: 74/100. Financial exposure: $4,200,000. Cross-domain impact detected in: terra, vessels. Based on 3 signal(s) from domain 'szl-holdings'. Signal sources: Bloomberg Terminal, Internal Risk Model, Quant Engine. Confidence: 82%.",
    signals: [
      { id: "s1", domain: "szl-holdings", type: "market_volatility_index", value: 0.72, source: "Bloomberg Terminal", timestamp: Date.now() - 3600000 },
      { id: "s2", domain: "szl-holdings", type: "portfolio_risk_score", value: 0.68, source: "Internal Risk Model", timestamp: Date.now() - 1800000 },
      { id: "s3", domain: "szl-holdings", type: "sector_exposure", value: "logistics_reit", source: "Quant Engine", timestamp: Date.now() - 900000 },
    ],
    evidence: [
      { label: "VIX Equivalent", value: "0.72 (threshold: 0.65)", source: "Bloomberg Terminal" },
      { label: "Portfolio Risk Score", value: "68/100 (elevated)", source: "Internal Risk Model" },
      { label: "Sector Exposure", value: "Logistics REITs 34% — overweight vs. target 22%", source: "Quant Engine" },
      { label: "Fixed Income Drift", value: "+6.2% vs. mandate cap", source: "Internal Risk Model" },
    ],
  },
  {
    domain: "aegis",
    confidence: 0.91,
    suggestedAction: "Escalate incident to legal for hold and disclosure review",
    suggestedOwner: "General Counsel",
    estimatedCostUsd: 0,
    businessImpact: {
      financialExposureUsd: 15000000,
      reputationalRisk: "critical",
      regulatoryExposure: true,
      crossDomainBlastRadius: ["prism", "szl-holdings"],
    },
    customTitle: "CRITICAL: APT Lateral Movement Detected — Legal Hold Required",
    customSummary: "Critical security incident INC-2026-0412 detected with APT-41 lateral movement across 3 subsidiaries. 47 assets affected. Regulatory disclosure review required.",
    customReasoning: "Priority score: 89/100. Financial exposure: $15,000,000. Regulatory exposure detected — legal review may be required. Cross-domain impact detected in: prism, szl-holdings. Confidence: 91%.",
    signals: [
      { id: "s4", domain: "aegis", type: "incident_severity", value: 0.91, source: "Aegis SIEM", timestamp: Date.now() - 7200000 },
      { id: "s5", domain: "aegis", type: "affected_assets", value: 47, source: "Aegis Asset Registry", timestamp: Date.now() - 7100000 },
    ],
    evidence: [
      { label: "Incident ID", value: "INC-2026-0412 (Critical)", source: "Aegis SIEM" },
      { label: "Threat Actor", value: "APT-41 — Lateral movement across 3 subsidiaries", source: "Threat Intelligence" },
      { label: "Assets Affected", value: "47 (23 classified systems)", source: "Aegis Asset Registry" },
      { label: "Regulatory Obligation", value: "SEC 72-hour disclosure window triggered", source: "Compliance Engine" },
    ],
  },
  {
    domain: "vessels",
    confidence: 0.76,
    suggestedAction: "Flag port-adjacent properties and review delivery contracts",
    suggestedOwner: "Operations Lead",
    estimatedCostUsd: 0,
    businessImpact: {
      financialExposureUsd: 890000,
      reputationalRisk: "low",
      regulatoryExposure: false,
      crossDomainBlastRadius: ["terra", "prism"],
    },
    customTitle: "Vessel Delay at Shanghai Exceeds 24h Threshold",
    customSummary: "MV Pacific Star reported a 32h delay at Port of Shanghai. 12 Terra properties flagged, 8 PRAXIS contracts may require force-majeure review.",
    customReasoning: "Priority score: 58/100. Financial exposure: $890,000. Cross-domain impact detected in: terra, prism. Confidence: 76%.",
    signals: [
      { id: "s6", domain: "vessels", type: "port_delay_hours", value: 32, source: "AIS Tracking", timestamp: Date.now() - 14400000 },
    ],
    evidence: [
      { label: "Vessel", value: "MV Pacific Star (IMO 9876543)", source: "AIS Tracking" },
      { label: "Delay", value: "32h at Port of Shanghai", source: "Port Authority" },
      { label: "Properties Flagged", value: "12 in Pudong logistics corridor", source: "Terra Intelligence" },
      { label: "Contracts at Risk", value: "8 with milestone delivery clauses", source: "Counsel" },
    ],
  },
];

const URGENCY_CONFIG = {
  critical: { label: "Critical", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", dot: "bg-red-500" },
  urgent: { label: "Urgent", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30", dot: "bg-orange-500" },
  moderate: { label: "Moderate", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", dot: "bg-yellow-500" },
  routine: { label: "Routine", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", dot: "bg-emerald-500" },
};

const POLICY_STATE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  allowed: { label: "Allowed", color: "text-emerald-400", icon: <Unlock className="w-3.5 h-3.5" /> },
  requires_approval: { label: "Requires Approval", color: "text-yellow-400", icon: <Clock className="w-3.5 h-3.5" /> },
  blocked: { label: "Blocked by Policy", color: "text-red-400", icon: <Lock className="w-3.5 h-3.5" /> },
  unchecked: { label: "Policy Unchecked", color: "text-slate-400", icon: <Shield className="w-3.5 h-3.5" /> },
};

const EXECUTION_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  none: { label: "Not Started", color: "text-slate-400" },
  queued: { label: "Queued", color: "text-blue-400" },
  running: { label: "Running", color: "text-yellow-400" },
  completed: { label: "Completed", color: "text-emerald-400" },
  failed: { label: "Failed", color: "text-red-400" },
  rolled_back: { label: "Rolled Back", color: "text-orange-400" },
};

const APPROVAL_STATE_CONFIG: Record<string, { label: string; color: string }> = {
  none: { label: "No Approval Required", color: "text-slate-400" },
  pending: { label: "Pending Approval", color: "text-yellow-400" },
  approved: { label: "Approved", color: "text-emerald-400" },
  rejected: { label: "Rejected", color: "text-red-400" },
  escalated: { label: "Escalated", color: "text-orange-400" },
};

function getApiBase(): string {
  if (typeof window !== "undefined" && window.location.hostname.includes("replit")) {
    return "/api";
  }
  return "/api";
}

function RecommendationCard({
  rec,
  onExecute,
  onDryRun,
}: {
  rec: Recommendation;
  onExecute: (id: string) => void;
  onDryRun: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const urgency = URGENCY_CONFIG[rec.urgency] ?? URGENCY_CONFIG.routine;
  const policyState = POLICY_STATE_CONFIG[rec.policyState] ?? POLICY_STATE_CONFIG.unchecked;
  const execStatus = EXECUTION_STATUS_CONFIG[rec.executionStatus] ?? EXECUTION_STATUS_CONFIG.none;
  const approvalStatus = APPROVAL_STATE_CONFIG[rec.approvalState] ?? APPROVAL_STATE_CONFIG.none;

  return (
    <div className={`rounded-lg border ${urgency.bg} transition-all duration-200`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${urgency.dot}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-sm font-semibold text-white leading-snug">{rec.title}</h3>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`text-xs font-mono font-bold ${urgency.color}`}>{rec.priority}/100</span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${urgency.color} bg-black/20`}>
                  {urgency.label}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">{rec.summary}</p>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-slate-500" />
                <span className={`text-xs font-medium ${policyState.color} flex items-center gap-1`}>
                  {policyState.icon} {policyState.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-slate-500" />
                <span className={`text-xs font-medium ${execStatus.color}`}>{execStatus.label}</span>
              </div>
              {rec.suggestedOwner && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3 h-3 text-slate-500" />
                  <span className="text-xs text-slate-300">{rec.suggestedOwner}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-500" />
                <span className={`text-xs ${approvalStatus.color}`}>{approvalStatus.label}</span>
              </div>
            </div>

            {rec.businessImpact.financialExposureUsd !== undefined && (
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-3 h-3 text-slate-500" />
                <span className="text-xs text-slate-400">
                  Financial exposure:{" "}
                  <span className="text-white font-medium">
                    ${rec.businessImpact.financialExposureUsd.toLocaleString()}
                  </span>
                </span>
                {rec.businessImpact.regulatoryExposure && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    Regulatory
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                Evidence & Reasoning
              </button>
              <div className="flex-1" />
              <button
                onClick={() => onDryRun(rec.id)}
                className="text-xs px-2.5 py-1 rounded border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 transition-all flex items-center gap-1.5"
              >
                <Eye className="w-3 h-3" />
                Dry Run
              </button>
              {rec.policyState !== "blocked" && (
                <button
                  onClick={() => onExecute(rec.id)}
                  className="text-xs px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3" />
                  {rec.policyState === "requires_approval" ? "Request Approval" : "Execute"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/10 p-4 space-y-3">
          {rec.evidence && rec.evidence.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Evidence</h4>
              <div className="space-y-1.5">
                {rec.evidence.map((e, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <FileText className="w-3 h-3 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs text-slate-400">{e.label}: </span>
                      <span className="text-xs text-white">{e.value}</span>
                      {e.source && <span className="text-xs text-slate-500 ml-1">— {e.source}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Reasoning</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{rec.reasoning}</p>
          </div>

          {rec.policyEvaluation && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Policy Evaluation</h4>
              <p className="text-xs text-slate-400 mb-1.5">{rec.policyEvaluation.reasoning}</p>
              {rec.policyEvaluation.matchedPolicies.length > 0 && (
                <div className="space-y-1">
                  {rec.policyEvaluation.matchedPolicies.map((mp, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Shield className="w-3 h-3 text-slate-500" />
                      <span className="text-xs text-slate-400">
                        Rule <span className="text-white">{mp.ruleName}</span>{" "}
                        <span className={mp.effect === "block" ? "text-red-400" : mp.effect === "require_approval" ? "text-yellow-400" : "text-emerald-400"}>
                          [{mp.effect}]
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {rec.businessImpact.crossDomainBlastRadius && rec.businessImpact.crossDomainBlastRadius.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Cross-Domain Impact</h4>
              <div className="flex flex-wrap gap-1.5">
                {rec.businessImpact.crossDomainBlastRadius.map(d => (
                  <span key={d} className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Source Signals</h4>
            <div className="flex flex-wrap gap-1.5">
              {rec.sourceSignals.map(s => (
                <span key={s.id} className="text-xs px-2 py-0.5 rounded bg-slate-700/50 text-slate-300 border border-slate-600/30">
                  {s.type} / {s.source}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ExecutionResult {
  run?: {
    runId: string;
    status: string;
    auditTrail: Array<{ at: number; action: string; detail?: string; actor?: string }>;
    isDryRun: boolean;
    steps: Array<{ stepName: string; status: string }>;
  };
  requiresApproval?: boolean;
  approvalRequest?: { approverRole: string; reason: string };
  dryRunSummary?: string;
  policyEvaluation?: PolicyEvaluation;
}

function ExecutionResultPanel({ result, onClose }: { result: ExecutionResult; onClose: () => void }) {
  const { run } = result;
  if (!run) return null;

  const statusColor = {
    completed: "text-emerald-400",
    failed: "text-red-400",
    pending_approval: "text-yellow-400",
    running: "text-blue-400",
    rolled_back: "text-orange-400",
  }[run.status] ?? "text-slate-400";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="p-5 border-b border-slate-700 flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">
              {run.isDryRun ? "Dry Run Result" : "Execution Result"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{run.runId}</p>
          </div>
          <span className={`text-xs font-semibold ${statusColor} capitalize`}>{run.status.replace("_", " ")}</span>
        </div>

        <div className="p-5 space-y-4">
          {result.dryRunSummary && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Dry Run Summary</h4>
              <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono bg-slate-800/50 rounded p-3">{result.dryRunSummary}</pre>
            </div>
          )}

          {result.requiresApproval && result.approvalRequest && (
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-semibold text-yellow-400">Awaiting Approval</span>
              </div>
              <p className="text-xs text-slate-300">{result.approvalRequest.reason}</p>
              <p className="text-xs text-slate-400 mt-1">Required approver role: <span className="text-white">{result.approvalRequest.approverRole}</span></p>
            </div>
          )}

          {run.steps && run.steps.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Steps</h4>
              <div className="space-y-1">
                {run.steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {step.status === "completed" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : step.status === "failed" ? (
                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span className="text-xs text-slate-300">{step.stepName}</span>
                    <span className={`text-xs ml-auto ${
                      step.status === "completed" ? "text-emerald-400" :
                      step.status === "failed" ? "text-red-400" : "text-slate-400"
                    }`}>{step.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {run.auditTrail && run.auditTrail.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Audit Trail</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {run.auditTrail.map((entry, i) => (
                  <div key={i} className="text-xs text-slate-400">
                    <span className="font-mono text-slate-500">{new Date(entry.at).toLocaleTimeString()}</span>
                    {" · "}
                    <span className="text-slate-300">{entry.action}</span>
                    {entry.detail && <span className="text-slate-500"> — {entry.detail}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  completed: "text-emerald-400",
  dry_run: "text-sky-400",
  simulated: "text-violet-400",
  pending_approval: "text-yellow-400",
  failed: "text-red-400",
  rolled_back: "text-orange-400",
};

function RunHistoryPanel({
  runs,
  total,
  page,
  pageSize,
  loading,
  statusFilter,
  domainFilter,
  onStatusChange,
  onDomainChange,
  onPageChange,
  onRefresh,
}: {
  runs: StoredRun[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  statusFilter: string;
  domainFilter: string;
  onStatusChange: (s: string) => void;
  onDomainChange: (d: string) => void;
  onPageChange: (p: number) => void;
  onRefresh: () => void;
}) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-white">Execution Run History</h2>
          <p className="text-xs text-slate-500 mt-0.5">{total} total runs persisted in the database</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 transition-all flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Filter className="w-3.5 h-3.5" />
          <span className="text-xs">Filter:</span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded px-2 py-1.5 focus:outline-none focus:border-slate-500"
        >
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="dry_run">Dry Run</option>
          <option value="simulated">Simulated</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="failed">Failed</option>
          <option value="rolled_back">Rolled Back</option>
        </select>
        <select
          value={domainFilter}
          onChange={(e) => onDomainChange(e.target.value)}
          className="text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded px-2 py-1.5 focus:outline-none focus:border-slate-500"
        >
          <option value="">All domains</option>
          <option value="szl-holdings">SZL Holdings</option>
          <option value="aegis">Aegis</option>
          <option value="vessels">Vessels</option>
          <option value="terra">Terra</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-14 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <div className="text-center py-12 text-slate-600 border border-slate-800 rounded-lg">
          <History className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm text-slate-500">No runs found</p>
          <p className="text-xs text-slate-600 mt-1">Execute a workflow from the Recommendations tab to generate history.</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-slate-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60">
                  <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Run ID</th>
                  <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Workflow</th>
                  <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Domain</th>
                  <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Status</th>
                  <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Mode</th>
                  <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Initiated By</th>
                  <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Started</th>
                  <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run, i) => (
                  <tr
                    key={run.runId}
                    className={`border-b border-slate-800/50 ${i % 2 === 0 ? "bg-slate-900/20" : ""} hover:bg-slate-800/30 transition-colors`}
                  >
                    <td className="px-4 py-2.5 font-mono text-slate-400 max-w-[140px] truncate" title={run.runId}>
                      {run.runId.slice(0, 18)}…
                    </td>
                    <td className="px-4 py-2.5 text-slate-200 max-w-[180px]">
                      <span className="truncate block">{run.workflowName}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                        {run.domain}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`font-medium capitalize ${STATUS_COLORS[run.status] ?? "text-slate-400"}`}>
                        {run.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-400">
                      {run.isDryRun ? "Dry Run" : run.isSimulation ? "Simulation" : "Live"}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 max-w-[120px] truncate">
                      {run.initiatedBy ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                      {new Date(run.startedAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-2.5">
                      {run.outcome ? (
                        <span className={`capitalize ${
                          run.outcome === "success" ? "text-emerald-400" :
                          run.outcome === "failed" ? "text-red-400" :
                          run.outcome === "partial" ? "text-yellow-400" : "text-slate-400"
                        }`}>{run.outcome}</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-slate-500">
                Page {page + 1} of {totalPages} · {total} total runs
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPageChange(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="text-xs px-2.5 py-1.5 rounded border border-slate-700 text-slate-300 hover:border-slate-500 disabled:opacity-40 flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-3 h-3" /> Prev
                </button>
                <button
                  onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="text-xs px-2.5 py-1.5 rounded border border-slate-700 text-slate-300 hover:border-slate-500 disabled:opacity-40 flex items-center gap-1 transition-colors"
                >
                  Next <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const AUTO_REFRESH_INTERVAL_MS = 90_000;

export default function DecisioningCommandPage() {
  const __pageMeta = usePageMeta({
    title: "Decisioning Command — Lyte",
    description: "SZL unified Decision, Policy & Action Engine surface — turn signals into governed, explainable, executable action.",
  });

  const [activeTab, setActiveTab] = useState<"recommendations" | "history">("recommendations");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [lastEvaluated, setLastEvaluated] = useState<number | null>(null);
  const [dataSource, setDataSource] = useState<"live" | "fallback" | null>(null);
  const [signalDomains, setSignalDomains] = useState<string[]>([]);
  const [stats, setStats] = useState<{
    decisionEngine?: { version: string };
    policyEngine?: { registeredPolicies: number; activePolicies: number };
    actionEngine?: { registeredWorkflows: number; total: number };
  } | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [historyRuns, setHistoryRuns] = useState<StoredRun[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyStatusFilter, setHistoryStatusFilter] = useState("");
  const [historyDomainFilter, setHistoryDomainFilter] = useState("");
  const HISTORY_PAGE_SIZE = 10;

  const evaluate = useCallback(async () => {
    setLoading(true);
    try {
      let signalGroups = DEMO_SIGNAL_GROUPS;
      let source: "live" | "fallback" = "fallback";
      let domains: string[] = [];

      try {
        const signalsResp = await fetch(`${getApiBase()}/decisioning/signals`, {
          credentials: "include",
        });
        if (signalsResp.ok) {
          const signalsData = await signalsResp.json();
          const fetchedGroups = signalsData.data?.groups ?? signalsData.groups ?? [];
          if (fetchedGroups.length > 0) {
            signalGroups = fetchedGroups;
            source = signalsData.data?.source ?? signalsData.source ?? "fallback";
            domains = signalsData.data?.domains ?? signalsData.domains ?? [];
          }
        }
      } catch {
        source = "fallback";
      }

      const resp = await fetch(`${getApiBase()}/decisioning/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groups: signalGroups }),
        credentials: "include",
      });

      if (resp.ok) {
        const data = await resp.json();
        setRecommendations(data.data?.recommendations ?? data.recommendations ?? []);
        setDataSource(source);
        setSignalDomains(domains);
        setLastEvaluated(Date.now());
      } else {
        setRecommendations(buildDemoRecs());
        setDataSource("fallback");
        setLastEvaluated(Date.now());
      }
    } catch {
      setRecommendations(buildDemoRecs());
      setDataSource("fallback");
      setLastEvaluated(Date.now());
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const resp = await fetch(`${getApiBase()}/decisioning/stats`, { credentials: "include" });
      if (resp.ok) {
        const data = await resp.json();
        setStats(data.data ?? data);
      }
    } catch {}
  }, []);

  const fetchHistory = useCallback(async (page: number, status: string, domain: string) => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(HISTORY_PAGE_SIZE),
        offset: String(page * HISTORY_PAGE_SIZE),
      });
      if (status) params.set("status", status);
      if (domain) params.set("domain", domain);
      const resp = await fetch(`${getApiBase()}/decisioning/runs?${params}`, { credentials: "include" });
      if (resp.ok) {
        const data = await resp.json();
        const payload = data.data ?? data;
        setHistoryRuns(payload.runs ?? []);
        setHistoryTotal(payload.total ?? 0);
      } else {
        setHistoryRuns([]);
        setHistoryTotal(0);
      }
    } catch {
      setHistoryRuns([]);
      setHistoryTotal(0);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    evaluate();
    fetchStats();
  }, [evaluate, fetchStats]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory(historyPage, historyStatusFilter, historyDomainFilter);
    }
  }, [activeTab, historyPage, historyStatusFilter, historyDomainFilter, fetchHistory]);

  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      evaluate();
    }, AUTO_REFRESH_INTERVAL_MS);
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [evaluate]);

  const handleExecute = async (recId: string) => {
    const rec = recommendations.find(r => r.id === recId);
    if (!rec) return;

    const workflowMap: Record<string, string> = {
      "szl-holdings": "portfolio-rebalance",
      "aegis": "security-legal-escalation",
      "vessels": "maritime-terra-alert",
    };

    const workflowId = workflowMap[rec.domain] ?? "portfolio-rebalance";

    try {
      const resp = await fetch(`${getApiBase()}/decisioning/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId, recommendationId: recId }),
        credentials: "include",
      });

      if (resp.ok || resp.status === 201) {
        const data = await resp.json();
        setExecutionResult(data.data ?? data);
        setRecommendations(prev => prev.map(r =>
          r.id === recId
            ? {
                ...r,
                executionStatus: data.data?.run?.status === "pending_approval" ? "queued" : "running",
                approvalState: data.data?.requiresApproval ? "pending" : r.approvalState,
              }
            : r
        ));
      } else {
        const simulatedResult: ExecutionResult = {
          run: {
            runId: `run-demo-${Date.now()}`,
            status: "pending_approval",
            isDryRun: false,
            steps: [
              { stepName: "Assess macro conditions", status: "pending" },
              { stepName: "Score asset classes", status: "pending" },
              { stepName: "Generate proposal", status: "pending" },
            ],
            auditTrail: [
              { at: Date.now(), action: "workflow.initiated", detail: "Mode: semi_auto", actor: "system" },
              { at: Date.now() + 1, action: "workflow.awaiting_approval", detail: "Execution paused pending human approval." },
            ],
          },
          requiresApproval: true,
          approvalRequest: { approverRole: "exec", reason: `Workflow requires explicit approval before execution.` },
        };
        setExecutionResult(simulatedResult);
        setRecommendations(prev => prev.map(r =>
          r.id === recId ? { ...r, executionStatus: "queued", approvalState: "pending" } : r
        ));
      }
    } catch {
      const simulatedResult: ExecutionResult = {
        run: {
          runId: `run-demo-${Date.now()}`,
          status: "pending_approval",
          isDryRun: false,
          steps: [],
          auditTrail: [{ at: Date.now(), action: "workflow.initiated", detail: "Demo mode" }],
        },
        requiresApproval: true,
        approvalRequest: { approverRole: "exec", reason: "Workflow requires executive approval." },
      };
      setExecutionResult(simulatedResult);
    }
  };

  const handleDryRun = async (recId: string) => {
    const rec = recommendations.find(r => r.id === recId);
    if (!rec) return;

    const workflowMap: Record<string, string> = {
      "szl-holdings": "portfolio-rebalance",
      "aegis": "security-legal-escalation",
      "vessels": "maritime-terra-alert",
    };

    const workflowId = workflowMap[rec.domain] ?? "portfolio-rebalance";

    try {
      const resp = await fetch(`${getApiBase()}/decisioning/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId, recommendationId: recId, isDryRun: true }),
        credentials: "include",
      });

      if (resp.ok || resp.status === 201) {
        const data = await resp.json();
        setExecutionResult(data.data ?? data);
      } else {
        setExecutionResult({
          run: {
            runId: `dryrun-demo-${Date.now()}`,
            status: "completed",
            isDryRun: true,
            steps: [
              { stepName: "Assess macro conditions", status: "completed" },
              { stepName: "Score asset classes", status: "completed" },
              { stepName: "Generate proposal", status: "completed" },
            ],
            auditTrail: [
              { at: Date.now(), action: "workflow.initiated", detail: "Mode: semi_auto (dry-run)" },
              { at: Date.now() + 10, action: "workflow.dry_run", detail: "Simulating execution without side effects." },
              { at: Date.now() + 20, action: "workflow.completed", detail: "All steps completed (dry-run, no side effects)." },
            ],
          },
          dryRunSummary: `Dry run for workflow.\nSteps: Assess macro conditions → Score asset classes → Generate proposal\nExecution mode: semi_auto\nNo side effects produced.`,
        });
      }
    } catch {
      setExecutionResult({
        run: {
          runId: `dryrun-demo-${Date.now()}`,
          status: "completed",
          isDryRun: true,
          steps: [],
          auditTrail: [{ at: Date.now(), action: "workflow.dry_run", detail: "Dry run simulation" }],
        },
        dryRunSummary: "Dry run completed. No side effects.",
      });
    }
  };

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen bg-slate-950 text-white">
        <SiteNav />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-400" />
                <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">Decision Engine</span>
              </div>
              <span className="text-slate-600">·</span>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-violet-400" />
                <span className="text-xs text-violet-400 font-semibold uppercase tracking-wider">Policy Engine</span>
              </div>
              <span className="text-slate-600">·</span>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-sky-400" />
                <span className="text-xs text-sky-400 font-semibold uppercase tracking-wider">Action Engine</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Decisioning Command</h1>
            <p className="text-slate-400 max-w-2xl">
              Signals ranked by business impact, urgency, and confidence. Every recommendation is policy-checked before
              it reaches an owner. Every approved action is executed as a governed, replayable workflow.
            </p>
          </div>
  
          {stats && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                <div className="text-xs text-slate-500 mb-1">Decision Engine</div>
                <div className="text-lg font-bold text-white">Active</div>
                <div className="text-xs text-indigo-400">v{stats.decisionEngine?.version}</div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                <div className="text-xs text-slate-500 mb-1">Active Policies</div>
                <div className="text-lg font-bold text-white">{stats.policyEngine?.activePolicies ?? "—"}</div>
                <div className="text-xs text-violet-400">{stats.policyEngine?.registeredPolicies} registered</div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                <div className="text-xs text-slate-500 mb-1">Registered Workflows</div>
                <div className="text-lg font-bold text-white">{stats.actionEngine?.registeredWorkflows ?? "—"}</div>
                <div className="text-xs text-sky-400">{stats.actionEngine?.total ?? 0} runs total</div>
              </div>
            </div>
          )}
  
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-base font-semibold text-white">Active Recommendations</h2>
                {dataSource === "live" && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
                    <Radio className="w-3 h-3" />
                    Live Feed
                  </span>
                )}
                {dataSource === "fallback" && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-700/50 border border-slate-600/50 text-slate-400 font-medium">
                    <Database className="w-3 h-3" />
                    Demo Mode
                  </span>
                )}
              </div>
              {lastEvaluated && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Evaluated {new Date(lastEvaluated).toLocaleTimeString()} · {recommendations.length} ranked recommendations
                  {dataSource === "live" && signalDomains.length > 0 && (
                    <span className="ml-1">· signals from {signalDomains.join(", ")}</span>
                  )}
                  {dataSource === "live" && <span className="ml-1">· auto-refreshes every 90s</span>}
                </p>
              )}
            </div>
          </div>
  
          <div className="flex items-center gap-1 mb-6 border-b border-slate-800">
            <button
              onClick={() => setActiveTab("recommendations")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === "recommendations"
                  ? "border-indigo-500 text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Brain className="w-4 h-4" />
              Recommendations
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === "history"
                  ? "border-indigo-500 text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <History className="w-4 h-4" />
              Run History
              {historyTotal > 0 && (
                <span className="text-xs bg-slate-700 text-slate-300 rounded-full px-1.5 py-0.5">{historyTotal}</span>
              )}
            </button>
          </div>
  
          {activeTab === "recommendations" && (
            <>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-semibold text-white">Active Recommendations</h2>
                  {lastEvaluated && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Evaluated {new Date(lastEvaluated).toLocaleTimeString()} · {recommendations.length} ranked recommendations
                    </p>
                  )}
                </div>
                <button
                  onClick={evaluate}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 rounded border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  Re-evaluate
                </button>
              </div>
  
              {loading && recommendations.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <Brain className="w-8 h-8 mx-auto mb-3 animate-pulse" />
                  <p className="text-sm">Evaluating signals…</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendations.map(rec => (
                    <RecommendationCard
                      key={rec.id}
                      rec={rec}
                      onExecute={handleExecute}
                      onDryRun={handleDryRun}
                    />
                  ))}
                </div>
              )}
            </>
          )}
  
          {activeTab === "history" && (
            <RunHistoryPanel
              runs={historyRuns}
              total={historyTotal}
              page={historyPage}
              pageSize={HISTORY_PAGE_SIZE}
              loading={historyLoading}
              statusFilter={historyStatusFilter}
              domainFilter={historyDomainFilter}
              onStatusChange={(s) => { setHistoryStatusFilter(s); setHistoryPage(0); }}
              onDomainChange={(d) => { setHistoryDomainFilter(d); setHistoryPage(0); }}
              onPageChange={setHistoryPage}
              onRefresh={() => fetchHistory(historyPage, historyStatusFilter, historyDomainFilter)}
            />
          )}
  
          <div className="mt-12 border-t border-slate-800 pt-8">
            <h2 className="text-base font-semibold text-white mb-4">How the Engines Work Together</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  icon: <Brain className="w-5 h-5 text-indigo-400" />,
                  title: "Decision Engine",
                  description: "Ranks signals by business impact (financial, reputational, regulatory), urgency, confidence, SLA proximity, and cross-domain blast radius. Outputs explainable recommendations with source attribution.",
                },
                {
                  icon: <Shield className="w-5 h-5 text-violet-400" />,
                  title: "Policy Engine",
                  description: "Hierarchical rule evaluation across tenant → domain → action levels. Determines: allow, require approval, escalate, or block. Built-in guardrails fire before AI recommendations.",
                },
                {
                  icon: <Zap className="w-5 h-5 text-sky-400" />,
                  title: "Action Engine",
                  description: "Turns approved recommendations into step-by-step workflows. Supports manual, semi-auto, and autonomous modes with dry run, simulation, approval gates, rollback hooks, and immutable audit trail.",
                },
              ].map((item) => (
                <div key={item.title} className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {item.icon}
                    <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
        <SiteFooter />
  
        {executionResult && (
          <ExecutionResultPanel result={executionResult} onClose={() => setExecutionResult(null)} />
        )}
      </div>
        </>
  );
}

function buildDemoRecs(): Recommendation[] {
  return DEMO_SIGNAL_GROUPS.map((g, i) => ({
    id: `demo-rec-${i}`,
    title: g.customTitle!,
    summary: g.customSummary!,
    reasoning: g.customReasoning!,
    domain: g.domain,
    confidence: g.confidence,
    urgency: (i === 0 ? "urgent" : i === 1 ? "critical" : "moderate") as "critical" | "moderate" | "urgent" | "routine",
    priority: i === 1 ? 89 : i === 0 ? 74 : 58,
    suggestedAction: g.suggestedAction,
    suggestedOwner: g.suggestedOwner,
    estimatedCostUsd: g.estimatedCostUsd,
    businessImpact: g.businessImpact,
    evidence: g.evidence,
    policyState: (i === 1 ? "requires_approval" : "allowed") as "unchecked" | "allowed" | "requires_approval" | "blocked",
    approvalState: "none" as "none" | "pending" | "approved" | "rejected" | "escalated",
    executionStatus: "none" as "none" | "queued" | "running" | "completed" | "failed" | "rolled_back",
    sourceSignals: g.signals.map(s => ({ id: s.id, domain: s.domain, type: s.type, source: s.source })),
    policyEvaluation: {
      effect: i === 1 ? "require_approval" : "allow",
      reasoning: i === 1
        ? "Evaluated 4 applicable policies, matched 2 rules. Action requires explicit human approval before execution."
        : "Evaluated 4 applicable policies, matched 1 rules. Action is permitted by applicable policies.",
      matchedPolicies: i === 1 ? [
        { policyId: "guardrail-regulatory-exposure", ruleName: "Escalate regulatory-exposed actions", effect: "require_approval" },
      ] : [],
      violations: [],
    },
  })).sort((a, b) => b.priority - a.priority);
}
