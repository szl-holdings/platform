import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@szl-holdings/shared-ui";
import {
  Dna, Zap, AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown,
  Activity, Brain, Layers, Network, RefreshCw, ChevronRight, Lightbulb, Target,
  BarChart2, Shield, MessageSquare, Cpu, Star, Eye, EyeOff,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@szl-holdings/shared-ui/utils";

// ─── API Types ──────────────────────────────────────────────────────────────

interface CapabilityGap {
  id: number;
  gapType: "tool_missing" | "agent_skill" | "domain_coverage" | "pipeline_gap" | "cross_domain";
  title: string;
  description: string;
  frequency: number;
  severity: "critical" | "high" | "medium" | "low";
  affectedDomains: string[];
  suggestedRemediation: string;
  evidenceSamples: string[];
  detectedAt: string;
  status: "open" | "acknowledged" | "resolved";
}

interface InnovationProposal {
  id: number;
  title: string;
  proposalType: "new_tool" | "new_agent_skill" | "mesh_connection" | "new_pipeline" | "app_feature" | "ecosystem_alert";
  rationale: string;
  estimatedImpact: "transformative" | "high" | "medium" | "low";
  impactDescription: string;
  affectedVentures: string[];
  implementationComplexity: "simple" | "moderate" | "complex" | "extensive";
  implementationNotes: string;
  confidenceScore: number;
  status: "pending" | "approved" | "dismissed" | "in_progress" | "completed";
  generatedAt: string;
}

interface EcosystemAlert {
  alertType: string;
  title: string;
  message: string;
  severity: "critical" | "high" | "medium" | "info";
  affectedApps: string[];
  recommendation: string;
  generatedAt: string;
  isRead: boolean;
}

interface LearningAggregates {
  totalRecords: number;
  byEventType: Record<string, number>;
  byDomain: Record<string, { count: number; avgSuccess: number; avgLatency: number }>;
  topPerformingAgents: Array<{ agentId: string; avgScore: number; count: number }>;
  bottomPerformingAgents: Array<{ agentId: string; avgScore: number; count: number }>;
  recentFeedback: { positive: number; negative: number; neutral: number };
  periodStart: string;
  periodEnd: string;
}

interface RadarData {
  proposals: InnovationProposal[];
  gapHeatmap: Record<string, { gapCount: number; severity: string; topGap?: string }>;
  openGapCount: number;
  learningAggregates: LearningAggregates;
  evolutionStatus: {
    generation: number;
    bestFitness: number;
    avgFitness: number;
    status: string;
    domain: string;
    lastEvolved: string;
  } | null;
}

interface AuditTrailData {
  timeline: Array<{
    id: string;
    type: string;
    timestamp: string;
    title: string;
    description: string;
    metrics?: Record<string, unknown>;
  }>;
  totalEvents: number;
  performanceDeltas: { bestFitnessDelta: number; avgFitnessDelta: number; generationsElapsed: number } | null;
  learningAggregates: LearningAggregates;
  populationSummary: Array<{ generation: number; bestFitness: number; avgFitness: number; updatedAt: string }>;
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

function hasData<T>(r: { data: T } | T): r is { data: T } {
  return r !== null && typeof r === "object" && "data" in (r as object);
}

function useRadarData() {
  return useQuery<RadarData>({
    queryKey: ["evolutionRadar"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ data: RadarData } | RadarData>("/alloy/evolution/radar");
        return hasData(res) ? res.data : res;
      } catch {
        return EMPTY_RADAR;
      }
    },
    refetchInterval: 60_000,
  });
}

function useGaps() {
  return useQuery<CapabilityGap[]>({
    queryKey: ["capabilityGaps"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ gaps: CapabilityGap[] }>("/alloy/evolution/gaps");
        return res.gaps || [];
      } catch {
        return [];
      }
    },
    refetchInterval: 90_000,
  });
}

function useProposals() {
  return useQuery<InnovationProposal[]>({
    queryKey: ["innovationProposals"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ proposals: InnovationProposal[] }>("/alloy/evolution/proposals");
        return res.proposals || [];
      } catch {
        return [];
      }
    },
    refetchInterval: 60_000,
  });
}

function useAuditTrail() {
  return useQuery<AuditTrailData>({
    queryKey: ["evolutionAuditTrail"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ data: AuditTrailData } | AuditTrailData>("/alloy/evolution/audit-trail");
        return hasData(res) ? res.data : res;
      } catch {
        return EMPTY_AUDIT;
      }
    },
    refetchInterval: 120_000,
  });
}

function useAlerts() {
  return useQuery<EcosystemAlert[]>({
    queryKey: ["ecosystemAlerts"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ alerts: EcosystemAlert[] }>("/alloy/evolution/ecosystem/alerts");
        return res.alerts || [];
      } catch {
        return [];
      }
    },
    refetchInterval: 120_000,
  });
}

// ─── Empty States ────────────────────────────────────────────────────────────

const EMPTY_RADAR: RadarData = {
  proposals: [],
  gapHeatmap: {},
  openGapCount: 0,
  learningAggregates: {
    totalRecords: 0,
    byEventType: {},
    byDomain: {},
    topPerformingAgents: [],
    bottomPerformingAgents: [],
    recentFeedback: { positive: 0, negative: 0, neutral: 0 },
    periodStart: new Date().toISOString(),
    periodEnd: new Date().toISOString(),
  },
  evolutionStatus: null,
};

const EMPTY_AUDIT: AuditTrailData = {
  timeline: [],
  totalEvents: 0,
  performanceDeltas: null,
  learningAggregates: EMPTY_RADAR.learningAggregates,
  populationSummary: [],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const IMPACT_COLORS: Record<string, string> = {
  transformative: "#7c3aed",
  high: "#4B8BDB",
  medium: "#f59e0b",
  low: "#6b7280",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#6b7280",
  info: "#4B8BDB",
};

const PROPOSAL_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  new_tool: Cpu,
  new_agent_skill: Brain,
  mesh_connection: Network,
  new_pipeline: Layers,
  app_feature: Zap,
  ecosystem_alert: AlertTriangle,
};

const PROPOSAL_TYPE_LABELS: Record<string, string> = {
  new_tool: "New Tool",
  new_agent_skill: "Agent Skill",
  mesh_connection: "Mesh Connection",
  new_pipeline: "New Pipeline",
  app_feature: "App Feature",
  ecosystem_alert: "Ecosystem Alert",
};

const VENTURE_COLORS: Record<string, string> = {
  vessels: "#0ea5e9",
  aegis: "#ef4444",
  terra: "#10b981",
  prism: "#8b5cf6",
  lyte: "#f59e0b",
  "carlota-jo": "#ec4899",
  "szl-holdings": "#4B8BDB",
};

const VENTURE_LABELS: Record<string, string> = {
  vessels: "Vessels",
  aegis: "Aegis",
  terra: "Terra",
  prism: "PRISM",
  lyte: "Lyte",
  "carlota-jo": "Carlota Jo",
  "szl-holdings": "SZL Holdings",
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, subtitle, actions }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(75,139,219,0.12)" }}>
          <Icon className="w-4 h-4" style={{ color: "#4B8BDB" }} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

function MetricCard({ label, value, sub, trend, icon: Icon, accent }: {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accent?: string;
}) {
  const color = accent || "#4B8BDB";
  return (
    <div className="rounded-xl border border-white/5 p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400">{label}</span>
        {Icon && <Icon className="w-3.5 h-3.5" style={{ color }} />}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-xl font-bold text-white">{value}</span>
        {trend && (
          trend === "up" ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400 mb-0.5" /> :
          trend === "down" ? <TrendingDown className="w-3.5 h-3.5 text-red-400 mb-0.5" /> : null
        )}
      </div>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function ProposalCard({ proposal, onApprove, onDismiss, approving, dismissing }: {
  proposal: InnovationProposal;
  onApprove: (id: number) => void;
  onDismiss: (id: number) => void;
  approving: boolean;
  dismissing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const TypeIcon = PROPOSAL_TYPE_ICONS[proposal.proposalType] || Zap;
  const impact = proposal.estimatedImpact;
  const impactColor = IMPACT_COLORS[impact] || "#6b7280";

  return (
    <div className={cn(
      "rounded-xl border transition-all duration-200",
      proposal.status === "pending" ? "border-white/8" : "border-white/4 opacity-60"
    )} style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 shrink-0"
               style={{ background: `${impactColor}18` }}>
            <span style={{ color: impactColor }} className="flex items-center justify-center">
              <TypeIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-sm font-medium text-white leading-snug">{proposal.title}</p>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                      style={{ color: impactColor, background: `${impactColor}18` }}>
                  {impact}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-slate-400">{PROPOSAL_TYPE_LABELS[proposal.proposalType]}</span>
              <span className="w-0.5 h-0.5 rounded-full bg-slate-600" />
              <span className="text-[10px] text-slate-400">{proposal.implementationComplexity}</span>
              <span className="w-0.5 h-0.5 rounded-full bg-slate-600" />
              <span className="text-[10px] text-slate-400">{Math.round(proposal.confidenceScore * 100)}% confidence</span>
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {(proposal.affectedVentures || []).map(v => (
                <span key={v} className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ color: VENTURE_COLORS[v] || "#6b7280", background: `${VENTURE_COLORS[v] || "#6b7280"}18` }}>
                  {VENTURE_LABELS[v] || v}
                </span>
              ))}
            </div>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Rationale</p>
              <p className="text-xs text-slate-300">{proposal.rationale}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Impact</p>
              <p className="text-xs text-slate-300">{proposal.impactDescription}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Implementation</p>
              <p className="text-xs text-slate-300 whitespace-pre-wrap">{proposal.implementationNotes}</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => setExpanded(x => !x)}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
          >
            {expanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {expanded ? "Collapse" : "Details"}
          </button>

          {proposal.status === "pending" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onDismiss(proposal.id)}
                disabled={dismissing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/8 transition-all disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                Dismiss
              </button>
              <button
                onClick={() => onApprove(proposal.id)}
                disabled={approving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all disabled:opacity-50"
                style={{ color: "#4B8BDB", background: "rgba(75,139,219,0.12)" }}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Approve
              </button>
            </div>
          )}

          {proposal.status === "approved" && (
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Approved
            </span>
          )}
          {proposal.status === "dismissed" && (
            <span className="text-[10px] text-red-400 flex items-center gap-1">
              <XCircle className="w-3 h-3" /> Dismissed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function AlertBanner({ alert, onDismiss }: { alert: EcosystemAlert; onDismiss: () => void }) {
  const color = SEVERITY_COLORS[alert.severity] || "#6b7280";
  return (
    <div className="rounded-xl border p-4 transition-all" style={{ borderColor: `${color}30`, background: `${color}08` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color }} />
          <div>
            <p className="text-sm font-medium text-white mb-1">{alert.title}</p>
            <p className="text-xs text-slate-400 mb-2">{alert.message}</p>
            <div className="flex items-start gap-1.5 text-xs text-slate-300">
              <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" style={{ color }} />
              <span>{alert.recommendation}</span>
            </div>
            <div className="flex gap-1 mt-2">
              {alert.affectedApps.map(app => (
                <span key={app} className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ color: VENTURE_COLORS[app] || color, background: `${VENTURE_COLORS[app] || color}18` }}>
                  {VENTURE_LABELS[app] || app}
                </span>
              ))}
            </div>
          </div>
        </div>
        <button onClick={onDismiss} className="shrink-0 p-1 rounded hover:bg-white/5 transition-colors">
          <XCircle className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
        </button>
      </div>
    </div>
  );
}

function GapHeatmapCell({ venture, data }: {
  venture: string;
  data: { gapCount: number; severity: string; topGap?: string };
}) {
  const color = SEVERITY_COLORS[data.severity] || "#6b7280";
  const ventureColor = VENTURE_COLORS[venture] || "#6b7280";
  const intensity = Math.min(data.gapCount / 10, 1);

  return (
    <div className="rounded-xl border border-white/5 p-3 flex flex-col gap-2"
         style={{ background: `rgba(${hexToRgb(color)}, ${0.04 + intensity * 0.08})` }}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold" style={{ color: ventureColor }}>
          {VENTURE_LABELS[venture] || venture}
        </span>
        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
              style={{ color, background: `${color}22` }}>
          {data.severity}
        </span>
      </div>
      <div className="flex items-end gap-1">
        <span className="text-lg font-bold text-white">{data.gapCount}</span>
        <span className="text-xs text-slate-400 mb-0.5">gap{data.gapCount !== 1 ? "s" : ""}</span>
      </div>
      {data.topGap && (
        <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">{data.topGap}</p>
      )}
    </div>
  );
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "75,139,219";
  return `${parseInt(result[1]!, 16)},${parseInt(result[2]!, 16)},${parseInt(result[3]!, 16)}`;
}

function AuditTimelineItem({ event }: {
  event: { id: string; type: string; timestamp: string; title: string; description: string; metrics?: Record<string, unknown> };
}) {
  const [expanded, setExpanded] = useState(false);

  const typeConfig: Record<string, { color: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }> = {
    evolution_cycle: { color: "#4B8BDB", icon: Dna },
    proposal_approved: { color: "#10b981", icon: CheckCircle },
    proposal_dismissed: { color: "#ef4444", icon: XCircle },
    gap_detected: { color: "#f59e0b", icon: AlertTriangle },
    learning_update: { color: "#8b5cf6", icon: Brain },
  };

  const cfg = typeConfig[event.type] || { color: "#6b7280", icon: Activity };
  const Icon = cfg.icon;

  return (
    <div className="flex gap-3 group">
      <div className="flex flex-col items-center">
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
             style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}>
          <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
        </div>
        <div className="w-px flex-1 mt-1" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>
      <div className="pb-5 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium text-slate-200">{event.title}</p>
          <span className="text-[10px] text-slate-500 shrink-0">{formatTimeAgo(event.timestamp)}</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{event.description}</p>

        {event.metrics && Object.keys(event.metrics).length > 0 && (
          <button onClick={() => setExpanded(x => !x)} className="mt-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1">
            <BarChart2 className="w-3 h-3" />
            {expanded ? "Hide metrics" : "Show metrics"}
          </button>
        )}

        {expanded && event.metrics && (
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(event.metrics).map(([k, v]) => (
              v !== null && v !== undefined ? (
                <span key={k} className="text-[10px] px-2 py-1 rounded-lg text-slate-300"
                      style={{ background: "rgba(255,255,255,0.05)" }}>
                  <span className="text-slate-500">{k}:</span> {typeof v === "number" ? v.toFixed(3) : String(v)}
                </span>
              ) : null
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FourLaneStatusGrid({ lanes }: { lanes: string[] }) {
  const LANES = [
    { id: "rag", label: "RAG", description: "Knowledge Context Pull", icon: Brain, color: "#8b5cf6" },
    { id: "mcp", label: "MCP", description: "Tool Discovery & Execution", icon: Cpu, color: "#4B8BDB" },
    { id: "a2a", label: "A2A", description: "Agent-to-Agent Delegation", icon: Network, color: "#0ea5e9" },
    { id: "llm", label: "LLM", description: "Inference & Generation", icon: MessageSquare, color: "#10b981" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {LANES.map(lane => {
        const active = lanes.includes(lane.id);
        const Icon = lane.icon;
        return (
          <div key={lane.id} className={cn(
            "rounded-xl border p-3 flex items-center gap-3 transition-all",
            active ? "border-white/10" : "border-white/4 opacity-50"
          )} style={{ background: active ? `${lane.color}10` : "rgba(255,255,255,0.02)" }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                 style={{ background: `${lane.color}20` }}>
              <Icon className="w-3.5 h-3.5" style={{ color: lane.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white">{lane.label}</p>
              <p className="text-[10px] text-slate-400 leading-tight">{lane.description}</p>
            </div>
            <div className="ml-auto shrink-0">
              {active ? (
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-slate-600" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

type Tab = "radar" | "gaps" | "proposals" | "audit" | "alerts" | "four-lane";

export function AlloyEvolutionPage() {
  const [activeTab, setActiveTab] = useState<Tab>("radar");
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<number>>(new Set());
  const [generatingProposals, setGeneratingProposals] = useState(false);
  const [detectionRunning, setDetectionRunning] = useState(false);
  const [fourLaneQuery, setFourLaneQuery] = useState("");
  const [fourLaneResult, setFourLaneResult] = useState<null | {
    response: string; lanesActivated: string[]; metrics: Record<string, unknown>; tokensUsed: number
  }>(null);
  const [fourLaneRunning, setFourLaneRunning] = useState(false);

  const queryClient = useQueryClient();

  const radarQuery = useRadarData();
  const gapsQuery = useGaps();
  const proposalsQuery = useProposals();
  const auditQuery = useAuditTrail();
  const alertsQuery = useAlerts();

  const approveMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/alloy/evolution/proposals/${id}/approve`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["innovationProposals"] });
      queryClient.invalidateQueries({ queryKey: ["evolutionRadar"] });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/alloy/evolution/proposals/${id}/dismiss`, { method: "POST", body: JSON.stringify({ reason: "Dismissed via Innovation Radar" }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["innovationProposals"] });
      queryClient.invalidateQueries({ queryKey: ["evolutionRadar"] });
    },
  });

  const radar = radarQuery.data || EMPTY_RADAR;
  const gaps = gapsQuery.data || [];
  const proposals = proposalsQuery.data || [];
  const audit = auditQuery.data || EMPTY_AUDIT;
  const alerts = (alertsQuery.data || []).filter((_, i) => !dismissedAlerts.has(i));

  const handleGenerateProposals = async () => {
    setGeneratingProposals(true);
    try {
      await apiFetch("/alloy/evolution/proposals/generate", { method: "POST", body: JSON.stringify({ windowHours: 48, useAI: true }) });
      queryClient.invalidateQueries({ queryKey: ["innovationProposals"] });
      queryClient.invalidateQueries({ queryKey: ["evolutionRadar"] });
    } finally {
      setGeneratingProposals(false);
    }
  };

  const handleRunDetection = async () => {
    setDetectionRunning(true);
    try {
      await apiFetch("/alloy/evolution/gaps/detect", { method: "POST", body: JSON.stringify({ windowHours: 48 }) });
      queryClient.invalidateQueries({ queryKey: ["capabilityGaps"] });
      queryClient.invalidateQueries({ queryKey: ["evolutionRadar"] });
    } finally {
      setDetectionRunning(false);
    }
  };

  const handleFourLane = async () => {
    if (!fourLaneQuery.trim()) return;
    setFourLaneRunning(true);
    setFourLaneResult(null);
    type FourLaneApiResult = { response: string; lanesActivated: string[]; metrics: Record<string, unknown>; tokensUsed: number };
    try {
      const result = await apiFetch<{ data: FourLaneApiResult } | FourLaneApiResult>("/alloy/evolution/four-lane/execute", {
        method: "POST",
        body: JSON.stringify({ query: fourLaneQuery, agentId: "alloy-radar-test", domain: "general" }),
      });
      setFourLaneResult(hasData(result) ? result.data : result);
    } catch {
      setFourLaneResult({ response: "Four-lane execution failed. Check API server logs.", lanesActivated: [], metrics: {}, tokensUsed: 0 });
    } finally {
      setFourLaneRunning(false);
    }
  };

  const TABS: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "radar", label: "Innovation Radar", icon: Target },
    { id: "gaps", label: `Gaps (${gaps.length})`, icon: AlertTriangle },
    { id: "proposals", label: `Proposals (${proposals.length})`, icon: Lightbulb },
    { id: "audit", label: "Audit Trail", icon: Activity },
    { id: "alerts", label: `Alerts (${alerts.length})`, icon: Shield },
    { id: "four-lane", label: "Four-Lane", icon: Layers },
  ] as const;

  const pendingProposals = proposals.filter(p => p.status === "pending");
  const approvedProposals = proposals.filter(p => p.status === "approved");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="border-b border-white/6 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                 style={{ background: "rgba(75,139,219,0.15)", border: "1px solid rgba(75,139,219,0.2)" }}>
              <Dna className="w-5 h-5" style={{ color: "#4B8BDB" }} />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">Innovation Radar</h1>
              <p className="text-xs text-slate-400 mt-0.5">Four-Lane Architecture · Self-Evolving AI Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {radar.evolutionStatus && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium text-slate-300"
                   style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Gen {radar.evolutionStatus.generation} · {(radar.evolutionStatus.bestFitness * 100).toFixed(1)}% fit
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-1 mt-4 overflow-x-auto scrollbar-none">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                  activeTab === tab.id
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                )}
                style={activeTab === tab.id ? { background: "rgba(75,139,219,0.12)", color: "#4B8BDB" } : undefined}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {activeTab === "radar" && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard
                label="Open Gaps"
                value={radar.openGapCount}
                sub={`${gaps.filter(g => g.severity === "critical").length} critical`}
                trend={radar.openGapCount > 0 ? "down" : "neutral"}
                icon={AlertTriangle}
                accent="#f59e0b"
              />
              <MetricCard
                label="Pending Proposals"
                value={pendingProposals.length}
                sub={`${approvedProposals.length} approved`}
                icon={Lightbulb}
                accent="#4B8BDB"
              />
              <MetricCard
                label="Learning Events"
                value={radar.learningAggregates.totalRecords.toLocaleString()}
                sub="7-day window"
                icon={Brain}
                accent="#8b5cf6"
              />
              <MetricCard
                label="Evolution Gen"
                value={radar.evolutionStatus?.generation ?? "—"}
                sub={radar.evolutionStatus ? `Fitness: ${(radar.evolutionStatus.bestFitness * 100).toFixed(1)}%` : "No active population"}
                trend={radar.evolutionStatus ? "up" : "neutral"}
                icon={Dna}
                accent="#10b981"
              />
            </div>

            {Object.keys(radar.gapHeatmap).length > 0 && (
              <div>
                <SectionHeader icon={Target} title="Gap Heatmap" subtitle="Capability gaps by venture" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(radar.gapHeatmap).map(([venture, data]) => (
                    <GapHeatmapCell key={venture} venture={venture} data={data} />
                  ))}
                </div>
              </div>
            )}

            {pendingProposals.length > 0 && (
              <div>
                <SectionHeader
                  icon={Lightbulb}
                  title="Pending Innovation Proposals"
                  subtitle={`${pendingProposals.length} proposals awaiting review`}
                  actions={
                    <button onClick={() => setActiveTab("proposals")} className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors">
                      View all <ChevronRight className="w-3 h-3" />
                    </button>
                  }
                />
                <div className="space-y-3">
                  {pendingProposals.slice(0, 3).map(p => (
                    <ProposalCard
                      key={p.id}
                      proposal={p}
                      onApprove={id => approveMutation.mutate(id)}
                      onDismiss={id => dismissMutation.mutate(id)}
                      approving={approveMutation.isPending}
                      dismissing={dismissMutation.isPending}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <SectionHeader icon={TrendingUp} title="Learning Momentum" subtitle="Platform behavior across all agents" />
              <div className="grid grid-cols-3 gap-3">
                <MetricCard
                  label="Positive Feedback"
                  value={radar.learningAggregates.recentFeedback.positive}
                  icon={Star}
                  accent="#10b981"
                />
                <MetricCard
                  label="Neutral Signals"
                  value={radar.learningAggregates.recentFeedback.neutral}
                  icon={Activity}
                  accent="#6b7280"
                />
                <MetricCard
                  label="Negative Signals"
                  value={radar.learningAggregates.recentFeedback.negative}
                  icon={AlertTriangle}
                  accent="#ef4444"
                />
              </div>

              {radar.learningAggregates.topPerformingAgents.length > 0 && (
                <div className="mt-3 rounded-xl border border-white/5 p-4" style={{ background: "rgba(255,255,255,0.025)" }}>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Top Agents</p>
                  <div className="space-y-2">
                    {radar.learningAggregates.topPerformingAgents.slice(0, 5).map(a => (
                      <div key={a.agentId} className="flex items-center justify-between">
                        <span className="text-xs text-slate-300 font-mono">{a.agentId}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500">{a.count} runs</span>
                          <div className="w-16 h-1.5 rounded-full bg-slate-700">
                            <div className="h-full rounded-full" style={{ width: `${a.avgScore * 100}%`, background: "#10b981" }} />
                          </div>
                          <span className="text-[10px] text-emerald-400 font-medium w-8 text-right">{(a.avgScore * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "gaps" && (
          <div>
            <SectionHeader
              icon={AlertTriangle}
              title="Capability Gaps"
              subtitle="Detected weaknesses in platform coverage"
              actions={
                <button
                  onClick={handleRunDetection}
                  disabled={detectionRunning}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all disabled:opacity-50"
                  style={{ color: "#4B8BDB", background: "rgba(75,139,219,0.12)" }}
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", detectionRunning && "animate-spin")} />
                  {detectionRunning ? "Detecting..." : "Run Detection"}
                </button>
              }
            />
            {gaps.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No gaps detected yet. Run detection to analyze the platform.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {gaps.map((gap, i) => {
                  const sev = gap.severity;
                  const col = SEVERITY_COLORS[sev] || "#6b7280";
                  return (
                    <div key={gap.id || i} className="rounded-xl border border-white/6 p-4"
                         style={{ background: "rgba(255,255,255,0.025)" }}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                                  style={{ color: col, background: `${col}22` }}>
                              {sev}
                            </span>
                            <span className="text-[10px] text-slate-400">{gap.gapType.replace(/_/g, " ")}</span>
                          </div>
                          <p className="text-sm font-medium text-white">{gap.title}</p>
                        </div>
                        <span className="text-[10px] text-slate-500 shrink-0 mt-1">{gap.frequency}x detected</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{gap.description}</p>
                      <div className="flex items-start gap-1.5 text-xs text-slate-300 bg-white/3 rounded-lg p-2">
                        <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" style={{ color: col }} />
                        <span>{gap.suggestedRemediation}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(gap.affectedDomains || []).map(d => (
                          <span key={d} className="text-[9px] px-1.5 py-0.5 rounded text-slate-400"
                                style={{ background: "rgba(255,255,255,0.06)" }}>
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "proposals" && (
          <div>
            <SectionHeader
              icon={Lightbulb}
              title="Innovation Proposals"
              subtitle="AI-generated and rule-based improvement suggestions"
              actions={
                <button
                  onClick={handleGenerateProposals}
                  disabled={generatingProposals}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all disabled:opacity-50"
                  style={{ color: "#4B8BDB", background: "rgba(75,139,219,0.12)" }}
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", generatingProposals && "animate-spin")} />
                  {generatingProposals ? "Generating..." : "Generate New"}
                </button>
              }
            />

            {proposals.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Lightbulb className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm mb-3">No proposals yet. Generate proposals from detected gaps.</p>
                <button
                  onClick={handleGenerateProposals}
                  disabled={generatingProposals}
                  className="text-xs px-4 py-2 rounded-lg font-medium transition-all"
                  style={{ color: "#4B8BDB", background: "rgba(75,139,219,0.12)" }}
                >
                  Generate Proposals
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {proposals.map((p, i) => (
                  <ProposalCard
                    key={p.id || i}
                    proposal={p}
                    onApprove={id => approveMutation.mutate(id)}
                    onDismiss={id => dismissMutation.mutate(id)}
                    approving={approveMutation.isPending}
                    dismissing={dismissMutation.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "audit" && (
          <div>
            <SectionHeader icon={Activity} title="Evolution Audit Trail" subtitle="Complete history of platform self-improvement events" />

            {audit.performanceDeltas && (
              <div className="grid grid-cols-3 gap-3 mb-5">
                <MetricCard
                  label="Fitness Delta"
                  value={`+${(audit.performanceDeltas.bestFitnessDelta * 100).toFixed(2)}%`}
                  sub="Best fitness improvement"
                  trend={audit.performanceDeltas.bestFitnessDelta > 0 ? "up" : "down"}
                  icon={TrendingUp}
                  accent="#10b981"
                />
                <MetricCard
                  label="Avg Fitness Delta"
                  value={`+${(audit.performanceDeltas.avgFitnessDelta * 100).toFixed(2)}%`}
                  sub="Population average"
                  trend={audit.performanceDeltas.avgFitnessDelta > 0 ? "up" : "down"}
                  icon={BarChart2}
                  accent="#4B8BDB"
                />
                <MetricCard
                  label="Generations"
                  value={audit.performanceDeltas.generationsElapsed}
                  sub="Tracked in history"
                  icon={Dna}
                  accent="#8b5cf6"
                />
              </div>
            )}

            {audit.timeline.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Activity className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No evolution events recorded yet. Run workflows and evolution cycles to populate the trail.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-white/5 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                {audit.timeline.slice(0, 30).map(event => (
                  <AuditTimelineItem key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "alerts" && (
          <div>
            <SectionHeader icon={AlertTriangle} title="Ecosystem Alerts" subtitle="Proactive intelligence on cross-venture opportunities and risks" />

            {alerts.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <CheckCircle className="w-8 h-8 mx-auto mb-3 text-emerald-400 opacity-50" />
                <p className="text-sm">No active alerts. All ventures appear healthy.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert, i) => (
                  <AlertBanner
                    key={i}
                    alert={alert}
                    onDismiss={() => setDismissedAlerts(prev => new Set([...prev, i]))}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "four-lane" && (
          <div>
            <SectionHeader
              icon={Layers}
              title="Four-Lane Coordinator"
              subtitle="Unified RAG + MCP + A2A + LLM orchestration"
            />

            <div className="mb-5">
              <FourLaneStatusGrid lanes={fourLaneResult?.lanesActivated || ["rag", "mcp", "a2a", "llm"]} />
            </div>

            <div className="rounded-xl border border-white/6 p-4" style={{ background: "rgba(255,255,255,0.025)" }}>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Test Query</p>
              <textarea
                value={fourLaneQuery}
                onChange={e => setFourLaneQuery(e.target.value)}
                placeholder="Ask anything — the coordinator will pull RAG context, discover MCP tools, check A2A agents, and generate a response..."
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none resize-none"
                rows={3}
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleFourLane}
                  disabled={fourLaneRunning || !fourLaneQuery.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                  style={{ color: "#fff", background: "rgba(75,139,219,0.3)" }}
                >
                  <Zap className={cn("w-3.5 h-3.5", fourLaneRunning && "animate-pulse")} />
                  {fourLaneRunning ? "Orchestrating..." : "Execute Four-Lane"}
                </button>
              </div>
            </div>

            {fourLaneResult && (
              <div className="space-y-3 mt-4">
                <div className="rounded-xl border border-white/6 p-4" style={{ background: "rgba(255,255,255,0.025)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Response</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <span>{fourLaneResult.tokensUsed} tokens</span>
                      <span>Lanes: {fourLaneResult.lanesActivated.join(", ")}</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{fourLaneResult.response}</p>
                </div>

                {Object.keys(fourLaneResult.metrics || {}).length > 0 && (
                  <div className="rounded-xl border border-white/5 p-4" style={{ background: "rgba(255,255,255,0.015)" }}>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Lane Metrics</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(fourLaneResult.metrics).map(([k, v]) => (
                        v !== null && v !== undefined ? (
                          <div key={k} className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">{k.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                            <span className="text-white font-medium">{typeof v === "number" && v > 100 ? `${v.toLocaleString()}ms` : String(v)}</span>
                          </div>
                        ) : null
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
