import { useState } from "react";
import { Shield, AlertTriangle, CheckCircle, Clock, GitBranch, TrendingUp, Calendar, Users, ChevronRight, Zap, RefreshCw, XCircle } from "lucide-react";

const GOLD = "#d4a054";
const DS = {
  surface: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.06)",
  text: { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.5)", muted: "rgba(255,255,255,0.25)" },
};

type ChangeStatus = "approved" | "pending" | "in_progress" | "completed" | "failed" | "blocked";
type RiskLevel = "critical" | "high" | "medium" | "low";

interface Change {
  id: string;
  title: string;
  type: string;
  owner: string;
  team: string;
  scheduledAt: number;
  status: ChangeStatus;
  riskScore: number;
  riskLevel: RiskLevel;
  blastRadius: string[];
  conflicts: string[];
  rollbackPlan: string;
  postChangeValidations: string[];
  regressions: string[];
  aiRiskFactors: string[];
  maintenanceWindow: string;
  services: string[];
  estimatedDuration: number;
}

const STATUS_COLOR: Record<ChangeStatus, string> = {
  approved: "#10b981",
  pending: GOLD,
  in_progress: "#3b82f6",
  completed: "#10b981",
  failed: "#ef4444",
  blocked: "#f97316",
};

const RISK_COLOR: Record<RiskLevel, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: GOLD,
  low: "#10b981",
};

const CHANGES: Change[] = [
  {
    id: "CHG-4441",
    title: "Order Processor v2.15.0 Deployment",
    type: "Software Deployment",
    owner: "Marcus Webb",
    team: "Platform Engineering",
    scheduledAt: Date.now() + 1000 * 60 * 60 * 2,
    status: "approved",
    riskScore: 72,
    riskLevel: "high",
    blastRadius: ["order-processor", "payment-processor", "inventory-service", "notification-service"],
    conflicts: [],
    rollbackPlan: "kubectl rollout undo deployment/order-processor — estimated 4m",
    postChangeValidations: ["Smoke test checkout flow", "Verify queue consumer lag < 500ms", "Confirm payment webhook delivery"],
    regressions: [],
    aiRiskFactors: ["Consumer performance regression in v2.14.1 not fully resolved", "High traffic window — 2PM EST", "No canary deploy configured"],
    maintenanceWindow: "Today 14:00–14:30 EST",
    services: ["order-processor", "payment-processor"],
    estimatedDuration: 30,
  },
  {
    id: "CHG-4440",
    title: "PostgreSQL Minor Version Upgrade (14.10 → 14.11)",
    type: "Database Upgrade",
    owner: "Priya Nair",
    team: "Database Reliability",
    scheduledAt: Date.now() + 1000 * 60 * 60 * 26,
    status: "pending",
    riskScore: 45,
    riskLevel: "medium",
    blastRadius: ["all services using postgres-primary"],
    conflicts: ["CHG-4439: Reporting schema migration (same DB window)"],
    rollbackPlan: "Restore from pre-upgrade snapshot — estimated 12m",
    postChangeValidations: ["Run pg_upgrade validation suite", "Verify replication lag < 1s", "Confirm connection pool health"],
    regressions: [],
    aiRiskFactors: ["Conflict with CHG-4439 in same maintenance window", "Upgrade requires 2-minute downtime window"],
    maintenanceWindow: "Tomorrow 02:00–03:00 EST",
    services: ["postgres-primary", "postgres-replica"],
    estimatedDuration: 60,
  },
  {
    id: "CHG-4438",
    title: "Kubernetes Node Pool Expansion (+4 nodes)",
    type: "Infrastructure Scaling",
    owner: "Jordan Lee",
    team: "Infrastructure",
    scheduledAt: Date.now() - 1000 * 60 * 60 * 1,
    status: "completed",
    riskScore: 22,
    riskLevel: "low",
    blastRadius: ["workload scheduling"],
    conflicts: [],
    rollbackPlan: "Drain and remove new nodes — estimated 8m",
    postChangeValidations: ["Node ready state", "Existing workload rescheduling verified"],
    regressions: [],
    aiRiskFactors: [],
    maintenanceWindow: "Today 08:00–09:00 EST",
    services: ["kubernetes-cluster"],
    estimatedDuration: 45,
  },
  {
    id: "CHG-4437",
    title: "Nginx Config Update — Rate Limiting",
    type: "Configuration Change",
    owner: "Sam Torres",
    team: "Security",
    scheduledAt: Date.now() - 1000 * 60 * 60 * 4,
    status: "failed",
    riskScore: 88,
    riskLevel: "critical",
    blastRadius: ["api-gateway", "all external clients"],
    conflicts: [],
    rollbackPlan: "Restore previous nginx.conf from git — estimated 2m",
    postChangeValidations: ["Rate limit test from synthetic client", "Verify legitimate traffic unblocked"],
    regressions: ["External clients receiving 429 on valid API calls", "P99 error rate spiked to 12%"],
    aiRiskFactors: ["Rate limit threshold set too aggressively (100 req/min vs baseline 850 req/min)"],
    maintenanceWindow: "Emergency — no window",
    services: ["api-gateway", "nginx"],
    estimatedDuration: 10,
  },
];

function RiskMeter({ score }: { score: number }) {
  const color = score >= 70 ? "#ef4444" : score >= 50 ? "#f97316" : score >= 30 ? GOLD : "#10b981";
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[9px]" style={{ color: DS.text.muted }}>Risk Score</span>
        <span className="text-[11px] font-mono font-bold" style={{ color }}>{score}/100</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}

export default function ChangeManagement() {
  const [selected, setSelected] = useState<Change>(CHANGES[0]);

  const pending = CHANGES.filter(c => c.status === "pending" || c.status === "approved").length;
  const failed = CHANGES.filter(c => c.status === "failed").length;
  const conflicted = CHANGES.filter(c => c.conflicts.length > 0).length;

  return (
    <div className="h-full overflow-auto" style={{ background: "#080c14" }}>
      <div className="max-w-[1400px] mx-auto p-4 space-y-4">

        <div>
          <h1 className="text-base font-bold tracking-tight" style={{ color: DS.text.primary }}>Change Management Intelligence</h1>
          <p className="text-[11px] mt-0.5" style={{ color: DS.text.muted }}>
            AI risk scoring · blast radius prediction · maintenance window optimization · regression detection
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Pending Changes", value: pending, color: GOLD },
            { label: "Conflicts Detected", value: conflicted, color: "#f97316" },
            { label: "Failed Changes", value: failed, color: "#ef4444" },
            { label: "Avg Risk Score", value: Math.round(CHANGES.reduce((a, c) => a + c.riskScore, 0) / CHANGES.length), color: DS.text.primary },
          ].map(k => (
            <div key={k.label} className="rounded-lg p-3" style={{ background: DS.surface, border: `1px solid ${DS.border}` }}>
              <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: DS.text.muted }}>{k.label}</div>
              <div className="text-2xl font-bold font-mono" style={{ color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
          {/* Change list */}
          <div className="space-y-2">
            <div className="text-[9px] uppercase tracking-widest px-1 mb-2" style={{ color: DS.text.muted }}>Change Calendar</div>
            {CHANGES.map(c => {
              const msFromNow = c.scheduledAt - Date.now();
              const timeLabel = msFromNow > 0 ? `in ${Math.round(msFromNow / 60000)}m` : `${Math.round(-msFromNow / 60000)}m ago`;
              return (
                <button key={c.id} onClick={() => setSelected(c)}
                  className="w-full text-left p-3 rounded-lg transition-all"
                  style={{ background: selected.id === c.id ? `${GOLD}08` : DS.surface, border: `1px solid ${selected.id === c.id ? GOLD + "30" : DS.border}` }}>
                  <div className="flex items-start gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: STATUS_COLOR[c.status] }} />
                    <div className="flex-1">
                      <div className="text-[10px] font-semibold mb-0.5" style={{ color: DS.text.primary }}>{c.title}</div>
                      <div className="flex items-center gap-2 text-[9px]">
                        <span style={{ color: RISK_COLOR[c.riskLevel] }}>Risk {c.riskScore}</span>
                        <span style={{ color: DS.text.muted }}>·</span>
                        <span style={{ color: DS.text.muted }}>{timeLabel}</span>
                      </div>
                    </div>
                    {c.conflicts.length > 0 && <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: "#f97316" }} />}
                  </div>
                  <div className="pl-4 text-[9px]" style={{ color: DS.text.muted }}>{c.type} · {c.owner}</div>
                </button>
              );
            })}
          </div>

          {/* Detail panel */}
          <div className="rounded-lg overflow-hidden" style={{ background: DS.surface, border: `1px solid ${DS.border}` }}>
            <div className="p-4 border-b" style={{ borderColor: DS.border }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono" style={{ color: DS.text.muted }}>{selected.id}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded font-mono capitalize" style={{ background: `${STATUS_COLOR[selected.status]}15`, color: STATUS_COLOR[selected.status] }}>{selected.status.replace("_", " ")}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded font-mono capitalize" style={{ background: `${RISK_COLOR[selected.riskLevel]}15`, color: RISK_COLOR[selected.riskLevel] }}>{selected.riskLevel} risk</span>
                  </div>
                  <h2 className="text-sm font-semibold" style={{ color: DS.text.primary }}>{selected.title}</h2>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-[10px]">
                <div><span style={{ color: DS.text.muted }}>Owner: </span><span style={{ color: DS.text.secondary }}>{selected.owner}</span></div>
                <div><span style={{ color: DS.text.muted }}>Window: </span><span style={{ color: DS.text.secondary }}>{selected.maintenanceWindow}</span></div>
                <div><span style={{ color: DS.text.muted }}>Duration: </span><span style={{ color: DS.text.secondary }}>{selected.estimatedDuration}m</span></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              <div className="space-y-4">
                <RiskMeter score={selected.riskScore} />

                <div>
                  <div className="text-[9px] uppercase tracking-widest mb-2" style={{ color: DS.text.muted }}>AI Risk Factors</div>
                  {selected.aiRiskFactors.length === 0 ? (
                    <div className="text-[10px] flex items-center gap-2" style={{ color: "#10b981" }}>
                      <CheckCircle className="w-3.5 h-3.5" /> No risk factors detected
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {selected.aiRiskFactors.map((f, i) => (
                        <div key={i} className="flex items-start gap-2 text-[10px]">
                          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" style={{ color: "#f97316" }} />
                          <span style={{ color: DS.text.secondary }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-[9px] uppercase tracking-widest mb-2" style={{ color: DS.text.muted }}>Blast Radius</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.blastRadius.map(b => (
                      <span key={b} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.06)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}>{b}</span>
                    ))}
                  </div>
                </div>

                {selected.conflicts.length > 0 && (
                  <div>
                    <div className="text-[9px] uppercase tracking-widest mb-2" style={{ color: "#f97316" }}>Conflicts</div>
                    {selected.conflicts.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 text-[10px] p-2 rounded" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
                        <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" style={{ color: "#f97316" }} />
                        <span style={{ color: DS.text.secondary }}>{c}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-[9px] uppercase tracking-widest mb-2" style={{ color: DS.text.muted }}>Rollback Plan</div>
                  <div className="p-2 rounded text-[10px] font-mono" style={{ background: "rgba(255,255,255,0.03)", color: DS.text.secondary }}>
                    {selected.rollbackPlan}
                  </div>
                </div>

                <div>
                  <div className="text-[9px] uppercase tracking-widest mb-2" style={{ color: DS.text.muted }}>Post-Change Validations</div>
                  <div className="space-y-1">
                    {selected.postChangeValidations.map((v, i) => (
                      <div key={i} className="flex items-start gap-2 text-[10px]">
                        <CheckCircle className="w-3 h-3 mt-0.5 shrink-0" style={{ color: DS.text.muted }} />
                        <span style={{ color: DS.text.secondary }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selected.regressions.length > 0 && (
                  <div>
                    <div className="text-[9px] uppercase tracking-widest mb-2" style={{ color: "#ef4444" }}>Regressions Detected</div>
                    <div className="space-y-1">
                      {selected.regressions.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 text-[10px] p-2 rounded" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                          <XCircle className="w-3 h-3 mt-0.5 shrink-0" style={{ color: "#ef4444" }} />
                          <span style={{ color: DS.text.secondary }}>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
