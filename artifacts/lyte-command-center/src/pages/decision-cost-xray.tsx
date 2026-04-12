import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  DollarSign, TrendingUp, AlertTriangle, Clock, ChevronRight,
  BarChart3, Users, Zap, ArrowUpRight, Settings, ChevronDown, ChevronUp,
  Activity, Target, Layers
} from "lucide-react";
import {
  getEnrichedDecisions,
  getPressureAlerts,
  getTeamEconomics,
  getDecisionTypeEconomics,
  formatCostCompact,
  formatCostFull,
  PACK_COLORS,
  PRESSURE_ALERT_THRESHOLDS,
  HISTORICAL_DECISIONS,
  type DecisionWithCost,
  type CostRateModel,
  DEFAULT_RATES,
} from "@/lib/decision-cost-xray";

const BG = { page: "#080c14", surface: "#0c1018", elevated: "#10141e", panel: "#0e1219" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.06)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" };
const ELECTRIC = "#2dd4bf";
const ALARM = "#c45a4a";
const WARN = "#c8953c";
const GOLD = "#d4a054";

function costUrgencyColor(gradient: number): string {
  if (gradient >= 0.9) return "#ec4899";
  if (gradient >= 0.7) return "#c45a4a";
  if (gradient >= 0.45) return "#c8953c";
  if (gradient >= 0.2) return "#d4a054";
  return ELECTRIC;
}

function urgencyBg(gradient: number): string {
  const c = costUrgencyColor(gradient);
  return `${c}12`;
}

function CostTicker({ value, perHour, animate }: { value: number; perHour: number; animate?: boolean }) {
  const [displayed, setDisplayed] = useState(value);

  useEffect(() => {
    if (!animate) { setDisplayed(value); return; }
    const interval = setInterval(() => {
      setDisplayed(prev => prev + perHour / 3600);
    }, 1000);
    return () => clearInterval(interval);
  }, [animate, value, perHour]);

  const color = costUrgencyColor(Math.min(displayed / 100000, 1));

  return (
    <span className="font-mono font-bold tabular-nums" style={{ color }}>
      {formatCostCompact(displayed)}
    </span>
  );
}

function CostBar({ breakdown, total }: { breakdown: DecisionWithCost["costBreakdown"]; total: number }) {
  const segments = [
    { key: "Stalled Revenue", value: breakdown.stalledRevenue, color: "#c45a4a" },
    { key: "Idle Team Time", value: breakdown.idleTeamTime, color: "#c8953c" },
    { key: "Opp. Decay", value: breakdown.opportunityDecay, color: "#d4a054" },
    { key: "Downstream", value: breakdown.downstreamDependency, color: "#8b7ac8" },
  ];

  return (
    <div className="space-y-1">
      <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
        {segments.map(s => s.value > 0 && (
          <div
            key={s.key}
            className="h-full"
            style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            title={`${s.key}: ${formatCostFull(s.value)}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {segments.map(s => s.value > 0 && (
          <div key={s.key} className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
            <span className="text-[8px]" style={{ color: TEXT.tertiary }}>{s.key} <span className="font-mono" style={{ color: TEXT.secondary }}>{formatCostCompact(s.value)}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeaderboardCard({ rank, decision, isExpanded, onToggle }: {
  rank: number;
  decision: DecisionWithCost;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const color = costUrgencyColor(decision.urgencyGradient);
  const packColor = PACK_COLORS[decision.pack] ?? TEXT.tertiary;

  return (
    <div
      className="rounded-md overflow-hidden transition-all"
      style={{
        background: BG.surface,
        border: `1px solid ${decision.thresholdBreached ? color + "28" : BORDER.subtle}`,
        boxShadow: decision.thresholdBreached ? `0 0 0 1px ${color}14` : undefined,
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.015] transition-colors" onClick={onToggle}>
        <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 text-[11px] font-bold font-mono" style={{
          background: rank <= 3 ? `${color}12` : "rgba(255,255,255,0.03)",
          color: rank <= 3 ? color : TEXT.tertiary,
          border: `1px solid ${rank <= 3 ? color + "25" : BORDER.subtle}`,
        }}>
          {rank}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[8px] font-bold px-1 rounded" style={{ color: packColor, background: packColor + "12" }}>{decision.pack}</span>
            {decision.thresholdBreached && (
              <span className="text-[7px] font-bold uppercase tracking-widest px-1 rounded animate-pulse" style={{ color, background: color + "12" }}>
                THRESHOLD BREACHED
              </span>
            )}
          </div>
          <p className="text-[11px] font-medium truncate" style={{ color: TEXT.primary }}>{decision.title}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[8px] flex items-center gap-1" style={{ color: TEXT.muted }}>
              <Clock className="w-2.5 h-2.5" /> {decision.ageHours}h stalled
            </span>
            <span className="text-[8px]" style={{ color: TEXT.tertiary }}>
              {decision.approver} · {decision.approverTeam}
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <CostTicker value={decision.totalCostOfDelay} perHour={decision.costPerHour} animate />
          <div className="text-[7px] uppercase tracking-wider mt-0.5" style={{ color: TEXT.muted }}>cost of delay</div>
          <div className="text-[7px] font-mono mt-0.5" style={{ color: TEXT.tertiary }}>+{formatCostCompact(decision.costPerHour)}/hr</div>
        </div>

        <div className="shrink-0 ml-1">
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" style={{ color: TEXT.tertiary }} /> : <ChevronDown className="w-3.5 h-3.5" style={{ color: TEXT.tertiary }} />}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${BORDER.subtle}` }}>
          <div className="pt-3">
            <div className="text-[9px] font-medium uppercase tracking-widest mb-2" style={{ color: TEXT.muted }}>Cost Breakdown</div>
            <CostBar breakdown={decision.costBreakdown} total={decision.totalCostOfDelay} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: "Revenue at Stake", value: formatCostCompact(decision.revenueAtStake), color: ALARM },
              { label: "Blocked Headcount", value: `${decision.blockedHeadcount} people`, color: WARN },
              { label: "Stalled Deals", value: `${decision.stalledDealCount} deals`, color: GOLD },
              { label: "Dependencies", value: `${decision.dependencyCount} blocked`, color: "#8b7ac8" },
            ].map(m => (
              <div key={m.label} className="rounded p-2" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER.subtle}` }}>
                <div className="text-[10px] font-mono font-semibold" style={{ color: m.color }}>{m.value}</div>
                <div className="text-[7px] uppercase tracking-widest mt-px" style={{ color: TEXT.muted }}>{m.label}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <Link href="/approvals">
              <div className="flex items-center gap-1.5 text-[9px] px-3 py-1.5 rounded cursor-pointer transition-all hover:opacity-80"
                style={{ background: color + "12", border: `1px solid ${color}25`, color }}>
                <Zap className="w-3 h-3" /> Escalate Now
              </div>
            </Link>
            <Link href="/approvals">
              <div className="flex items-center gap-1.5 text-[9px] px-3 py-1.5 rounded cursor-pointer transition-all hover:opacity-80"
                style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER.muted}`, color: TEXT.secondary }}>
                <ArrowUpRight className="w-3 h-3" /> Go to Approval
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

type EscalationStatus = "detected" | "dispatched" | "acknowledged";

interface AlertState {
  id: string;
  status: EscalationStatus;
  dispatchedAt?: number;
  acknowledgedAt?: number;
}

function PressureAlertsPanel({ decisions, rates }: { decisions: DecisionWithCost[]; rates: CostRateModel }) {
  const alerts = getPressureAlerts(decisions);
  const [alertStates, setAlertStates] = useState<Map<string, AlertState>>(new Map());
  const [liveCosts, setLiveCosts] = useState<Map<string, number>>(new Map());
  const [recentEscalations, setRecentEscalations] = useState<{ id: string; title: string; ts: number }[]>([]);

  useEffect(() => {
    const initial = new Map<string, number>();
    alerts.forEach(({ decision }) => {
      initial.set(decision.id, decision.totalCostOfDelay);
    });
    setLiveCosts(initial);

    const interval = setInterval(() => {
      setLiveCosts(prev => {
        const next = new Map(prev);
        alerts.forEach(({ decision }) => {
          const current = next.get(decision.id) ?? decision.totalCostOfDelay;
          next.set(decision.id, current + decision.costPerHour / 3600);
        });
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [alerts.length]);

  useEffect(() => {
    alerts.forEach(({ decision, threshold }) => {
      const key = `${decision.id}_${threshold.value}`;
      if (!alertStates.has(key)) {
        setAlertStates(prev => {
          const next = new Map(prev);
          next.set(key, { id: key, status: "detected" });
          return next;
        });
        const delay = 3000 + Math.random() * 4000;
        setTimeout(() => {
          setAlertStates(prev => {
            const next = new Map(prev);
            const existing = next.get(key);
            if (existing?.status === "detected") {
              next.set(key, { ...existing, status: "dispatched", dispatchedAt: Date.now() });
              setRecentEscalations(prev2 => [
                { id: key, title: decision.title, ts: Date.now() },
                ...prev2.slice(0, 4),
              ]);
            }
            return next;
          });
        }, delay);
      }
    });
  }, [alerts.length]);

  function handleAcknowledge(alertKey: string) {
    setAlertStates(prev => {
      const next = new Map(prev);
      const existing = next.get(alertKey);
      if (existing) {
        next.set(alertKey, { ...existing, status: "acknowledged", acknowledgedAt: Date.now() });
      }
      return next;
    });
  }

  if (alerts.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-[11px]" style={{ color: TEXT.tertiary }}>
        No active threshold breaches
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recentEscalations.length > 0 && (
        <div className="rounded-md px-4 py-3 flex items-center gap-3" style={{ background: "rgba(236,72,153,0.05)", border: "1px solid rgba(236,72,153,0.15)" }}>
          <div className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: "#ec4899" }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#ec4899" }} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-medium" style={{ color: "#ec4899" }}>
              Auto-escalation dispatched: <span className="text-white">{recentEscalations[0].title}</span>
            </span>
            <p className="text-[8px] mt-0.5" style={{ color: TEXT.tertiary }}>
              Notification sent to decision-maker and executive chain · {new Date(recentEscalations[0].ts).toLocaleTimeString()}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {alerts.map(({ decision, threshold, crossedAt }) => {
          const alertKey = `${decision.id}_${threshold.value}`;
          const state = alertStates.get(alertKey);
          const liveCost = liveCosts.get(decision.id) ?? decision.totalCostOfDelay;
          const isDispatched = state?.status === "dispatched";
          const isAcknowledged = state?.status === "acknowledged";

          return (
            <div
              key={alertKey}
              className="rounded-md transition-all"
              style={{
                background: isAcknowledged ? "rgba(255,255,255,0.01)" : threshold.color + "08",
                border: `1px solid ${isAcknowledged ? BORDER.subtle : threshold.color + "25"}`,
                opacity: isAcknowledged ? 0.6 : 1,
              }}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="shrink-0">
                  {isAcknowledged ? (
                    <div className="w-2 h-2 rounded-full" style={{ background: "#22c55e" }} />
                  ) : (
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: threshold.color }} />
                      <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: threshold.color }} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[11px] font-medium" style={{ color: TEXT.primary }}>
                      {decision.title}
                    </p>
                    {isDispatched && !isAcknowledged && (
                      <span className="text-[7px] font-bold uppercase tracking-widest px-1 rounded" style={{ color: "#ec4899", background: "rgba(236,72,153,0.1)" }}>
                        ESCALATED
                      </span>
                    )}
                    {isAcknowledged && (
                      <span className="text-[7px] font-bold uppercase tracking-widest px-1 rounded" style={{ color: "#22c55e", background: "rgba(34,197,94,0.1)" }}>
                        ACKNOWLEDGED
                      </span>
                    )}
                  </div>
                  <p className="text-[9px]" style={{ color: TEXT.secondary }}>
                    Crossed <span className="font-mono" style={{ color: threshold.color }}>{threshold.label}</span> threshold {crossedAt} · Approver: {decision.approver}
                  </p>
                  {isDispatched && !isAcknowledged && (
                    <p className="text-[8px] mt-0.5" style={{ color: "#ec4899" }}>
                      Auto-escalation dispatched to {decision.approverTeam} leadership
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[11px] font-mono font-bold tabular-nums" style={{ color: threshold.color }}>
                    {formatCostCompact(liveCost)}
                  </div>
                  <div className="text-[7px] uppercase tracking-wider" style={{ color: TEXT.muted }}>accrued</div>
                  <div className="text-[7px] font-mono" style={{ color: TEXT.muted }}>+{formatCostCompact(decision.costPerHour)}/hr</div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: threshold.color + "10" }}>
                    <AlertTriangle className="w-3 h-3" style={{ color: threshold.color }} />
                  </div>
                  {!isAcknowledged && (
                    <button
                      onClick={() => handleAcknowledge(alertKey)}
                      className="text-[7px] px-1 py-0.5 rounded font-medium transition-all hover:opacity-80"
                      style={{ color: TEXT.tertiary, background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER.subtle}` }}
                    >
                      ACK
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DecisionEconomicsDashboard() {
  const teamEcon = getTeamEconomics();
  const typeEcon = getDecisionTypeEconomics();
  const totalHistorical = HISTORICAL_DECISIONS.reduce((s, d) => s + d.totalCostAccrued, 0);
  const avgResolutionHours = HISTORICAL_DECISIONS.reduce((s, d) => s + d.ageHoursWhenResolved, 0) / HISTORICAL_DECISIONS.length;
  const escalatedCount = HISTORICAL_DECISIONS.filter(d => d.wasEscalated).length;

  const maxTeamCost = Math.max(...teamEcon.map(t => t.totalCostAccrued));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Indecision Cost (90d)", value: formatCostCompact(totalHistorical), icon: DollarSign, color: ALARM },
          { label: "Avg Resolution Time", value: `${avgResolutionHours.toFixed(1)}h`, icon: Clock, color: WARN },
          { label: "Decisions Escalated", value: `${escalatedCount} of ${HISTORICAL_DECISIONS.length}`, icon: AlertTriangle, color: GOLD },
          { label: "Highest Single Decision", value: formatCostCompact(Math.max(...HISTORICAL_DECISIONS.map(d => d.totalCostAccrued))), icon: TrendingUp, color: "#ec4899" },
        ].map(k => (
          <div key={k.label} className="rounded-md p-3 flex items-center gap-3" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
            <div className="w-8 h-8 rounded flex items-center justify-center shrink-0" style={{ background: k.color + "12" }}>
              <k.icon className="w-4 h-4" style={{ color: k.color }} />
            </div>
            <div>
              <div className="text-sm font-bold font-mono" style={{ color: k.color }}>{k.value}</div>
              <div className="text-[8px]" style={{ color: TEXT.secondary }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-md overflow-hidden" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
            <Users className="w-3.5 h-3.5" style={{ color: GOLD }} />
            <span className="text-[11px] font-medium" style={{ color: TEXT.primary }}>Cost by Approver Team</span>
          </div>
          <div className="divide-y" style={{ "--tw-divide-opacity": 1 } as any}>
            {teamEcon.map(t => (
              <div key={t.team} className="px-4 py-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-[10px] font-medium" style={{ color: TEXT.primary }}>{t.team}</span>
                    <span className="text-[8px] ml-2 px-1 rounded" style={{ color: PACK_COLORS[t.pack] ?? TEXT.tertiary, background: (PACK_COLORS[t.pack] ?? "#fff") + "10" }}>{t.pack}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono font-semibold" style={{ color: ALARM }}>{formatCostCompact(t.totalCostAccrued)}</span>
                    <span className="text-[7px] ml-1" style={{ color: TEXT.muted }}>{t.totalDecisions} decisions</span>
                  </div>
                </div>
                <div className="relative h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="absolute inset-y-0 left-0 rounded-full" style={{
                    width: `${(t.totalCostAccrued / maxTeamCost) * 100}%`,
                    background: `linear-gradient(90deg, ${ALARM}80, ${ALARM})`,
                  }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[7px]" style={{ color: TEXT.muted }}>Avg resolution: {t.avgResolutionHours.toFixed(0)}h</span>
                  <span className="text-[7px]" style={{ color: TEXT.muted }}>Escalation rate: {(t.escalationRate * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md overflow-hidden" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
            <Layers className="w-3.5 h-3.5" style={{ color: ELECTRIC }} />
            <span className="text-[11px] font-medium" style={{ color: TEXT.primary }}>Cost by Decision Category</span>
          </div>
          <div className="divide-y" style={{ "--tw-divide-opacity": 1 } as any}>
            {typeEcon.map((t, i) => {
              const barColors = [ALARM, WARN, GOLD, ELECTRIC, "#8b7ac8", "#22c55e"];
              const barColor = barColors[i % barColors.length];
              const maxCat = Math.max(...typeEcon.map(e => e.totalCostAccrued));
              return (
                <div key={t.category} className="px-4 py-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded capitalize" style={{ color: barColor, background: barColor + "12" }}>{t.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono font-semibold" style={{ color: barColor }}>{formatCostCompact(t.totalCostAccrued)}</span>
                      <span className="text-[7px] ml-1" style={{ color: TEXT.muted }}>{t.totalDecisions} decisions</span>
                    </div>
                  </div>
                  <div className="relative h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="absolute inset-y-0 left-0 rounded-full" style={{
                      width: `${(t.totalCostAccrued / maxCat) * 100}%`,
                      background: barColor,
                    }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[7px]" style={{ color: TEXT.muted }}>Avg: {t.avgResolutionHours.toFixed(0)}h</span>
                    <span className="text-[7px]" style={{ color: TEXT.muted }}>Worst case: {formatCostCompact(t.worstCase)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-md overflow-hidden" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
          <Activity className="w-3.5 h-3.5" style={{ color: WARN }} />
          <span className="text-[11px] font-medium" style={{ color: TEXT.primary }}>Recent Decision History</span>
        </div>
        <div className="divide-y" style={{ "--tw-divide-opacity": 1 } as any}>
          {HISTORICAL_DECISIONS.slice(0, 8).map(d => (
            <div key={d.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.01] transition-colors">
              <span className="text-[8px] font-mono shrink-0" style={{ color: TEXT.muted }}>{d.id}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] truncate" style={{ color: TEXT.secondary }}>{d.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[7px] px-1 rounded" style={{ color: PACK_COLORS[d.pack] ?? TEXT.tertiary, background: (PACK_COLORS[d.pack] ?? "#fff") + "10" }}>{d.pack}</span>
                  <span className="text-[7px]" style={{ color: TEXT.muted }}>{d.approverTeam}</span>
                  <span className="text-[7px]" style={{ color: TEXT.muted }}>{d.ageHoursWhenResolved}h to resolve</span>
                  {d.wasEscalated && <span className="text-[7px] font-bold" style={{ color: "#ec4899" }}>ESCALATED</span>}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[10px] font-mono" style={{ color: ALARM }}>{formatCostCompact(d.totalCostAccrued)}</div>
                <div className="text-[7px] capitalize" style={{
                  color: d.outcome === "approved" ? "#22c55e" : d.outcome === "rejected" ? ALARM : WARN,
                }}>{d.outcome}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RatesPanel({ rates, onUpdate }: { rates: CostRateModel; onUpdate: (r: CostRateModel) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(rates);

  function handleSave() {
    onUpdate(draft);
    setEditing(false);
  }

  return (
    <div className="rounded-md p-4" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Settings className="w-3.5 h-3.5" style={{ color: TEXT.tertiary }} />
          <span className="text-[10px] font-medium" style={{ color: TEXT.secondary }}>Cost Rate Model</span>
        </div>
        <button
          onClick={() => editing ? handleSave() : setEditing(true)}
          className="text-[9px] px-2 py-1 rounded transition-all"
          style={{ color: ELECTRIC, background: ELECTRIC + "10", border: `1px solid ${ELECTRIC}20` }}
        >
          {editing ? "Save" : "Configure"}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { key: "stalledRevenuePerHour" as const, label: "Stalled Revenue /hr", color: ALARM },
          { key: "idleTeamCostPerHour" as const, label: "Idle Team Cost /hr", color: WARN },
          { key: "opportunityDecayPerHour" as const, label: "Opp. Decay /hr", color: GOLD },
          { key: "downstreamDependencyPerHour" as const, label: "Downstream /hr", color: "#8b7ac8" },
        ].map(r => (
          <div key={r.key} className="rounded p-2" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER.subtle}` }}>
            <div className="text-[7px] uppercase tracking-widest mb-1" style={{ color: TEXT.muted }}>{r.label}</div>
            {editing ? (
              <input
                type="number"
                value={draft[r.key]}
                onChange={e => setDraft(prev => ({ ...prev, [r.key]: Number(e.target.value) }))}
                className="w-full text-[10px] font-mono bg-transparent outline-none border-b"
                style={{ color: r.color, borderColor: r.color + "40" }}
              />
            ) : (
              <div className="text-[10px] font-mono font-semibold" style={{ color: r.color }}>
                ${rates[r.key].toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

type Tab = "leaderboard" | "alerts" | "economics";

export default function DecisionCostXRay() {
  const [tab, setTab] = useState<Tab>("leaderboard");
  const [rates, setRates] = useState<CostRateModel>(DEFAULT_RATES);
  const [expanded, setExpanded] = useState<string | null>(null);

  const decisions = getEnrichedDecisions(rates);
  const totalCost = decisions.reduce((s, d) => s + d.totalCostOfDelay, 0);
  const thresholdBreaches = decisions.filter(d => d.thresholdBreached).length;
  const alerts = getPressureAlerts(decisions);

  return (
    <div className="p-4 md:p-5 space-y-5" style={{ background: BG.page }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ALARM }} />
            <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: ALARM }}>Decision Cost X-Ray</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight" style={{ color: TEXT.primary }}>Dollar Cost of Indecision</h1>
          <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>
            Real-time financial impact of stalled approvals, ownership gaps, and delayed decisions across the organization
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="rounded px-2.5 py-1.5 text-center" style={{ background: ALARM + "10", border: `1px solid ${ALARM}20` }}>
            <div className="text-[11px] font-mono font-bold" style={{ color: ALARM }}>{formatCostCompact(totalCost)}</div>
            <div className="text-[7px] uppercase tracking-wider" style={{ color: ALARM + "88" }}>Live Cost Accruing</div>
          </div>
          {thresholdBreaches > 0 && (
            <div className="rounded px-2.5 py-1.5 text-center animate-pulse" style={{ background: "#ec489910", border: `1px solid #ec489925` }}>
              <div className="text-[11px] font-mono font-bold" style={{ color: "#ec4899" }}>{thresholdBreaches}</div>
              <div className="text-[7px] uppercase tracking-wider" style={{ color: "#ec489988" }}>Threshold Breached</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Decisions Pending", value: String(decisions.length), color: ELECTRIC, icon: Target },
          { label: "Accruing /hr", value: formatCostCompact(decisions.reduce((s, d) => s + d.costPerHour, 0)), color: WARN, icon: TrendingUp },
          { label: "Pressure Alerts", value: String(alerts.length), color: ALARM, icon: AlertTriangle },
          { label: "Threshold Breaches", value: String(thresholdBreaches), color: "#ec4899", icon: Zap },
        ].map(k => (
          <div key={k.label} className="rounded-md p-3 flex items-center gap-3" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
            <div className="w-8 h-8 rounded flex items-center justify-center shrink-0" style={{ background: k.color + "12" }}>
              <k.icon className="w-4 h-4" style={{ color: k.color }} />
            </div>
            <div>
              <div className="text-base font-bold font-mono" style={{ color: k.color }}>{k.value}</div>
              <div className="text-[8px]" style={{ color: TEXT.secondary }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      <RatesPanel rates={rates} onUpdate={setRates} />

      <div className="rounded-md overflow-hidden" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
        <div className="flex items-center gap-0" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
          {([
            { key: "leaderboard", label: "Decision Latency Leaderboard" },
            { key: "alerts", label: `Pressure Alerts${alerts.length > 0 ? ` (${alerts.length})` : ""}` },
            { key: "economics", label: "Decision Economics" },
          ] as { key: Tab; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest transition-colors"
              style={{
                color: tab === t.key ? TEXT.primary : TEXT.tertiary,
                borderBottom: tab === t.key ? `2px solid ${ALARM}` : "2px solid transparent",
                marginBottom: "-1px",
              }}
            >
              {t.label}
            </button>
          ))}
          <div className="ml-auto px-4 flex items-center gap-2">
            <Link href="/approvals">
              <span className="text-[8px] flex items-center gap-1" style={{ color: TEXT.tertiary }}>
                Go to Approvals <ChevronRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
        </div>

        <div className="p-4">
          {tab === "leaderboard" && (
            <div className="space-y-2">
              {decisions.length === 0 ? (
                <div className="py-8 text-center text-[11px]" style={{ color: TEXT.tertiary }}>No pending decisions</div>
              ) : (
                decisions.map((d, i) => (
                  <LeaderboardCard
                    key={d.id}
                    rank={i + 1}
                    decision={d}
                    isExpanded={expanded === d.id}
                    onToggle={() => setExpanded(expanded === d.id ? null : d.id)}
                  />
                ))
              )}
            </div>
          )}

          {tab === "alerts" && <PressureAlertsPanel decisions={decisions} rates={rates} />}

          {tab === "economics" && <DecisionEconomicsDashboard />}
        </div>
      </div>

      <div className="rounded-md p-4" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
        <div className="text-[9px] font-medium uppercase tracking-widest mb-3" style={{ color: TEXT.muted }}>Alert Thresholds</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {PRESSURE_ALERT_THRESHOLDS.map(t => {
            const count = decisions.filter(d => d.totalCostOfDelay >= t.value).length;
            return (
              <div key={t.label} className="rounded p-2.5 flex items-center justify-between" style={{
                background: count > 0 ? t.color + "08" : "rgba(255,255,255,0.02)",
                border: `1px solid ${count > 0 ? t.color + "20" : BORDER.subtle}`,
              }}>
                <span className="text-[9px] font-mono font-semibold" style={{ color: t.color }}>{t.label}</span>
                <span className="text-[10px] font-bold font-mono" style={{ color: count > 0 ? t.color : TEXT.muted }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
