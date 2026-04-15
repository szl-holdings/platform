import { useState, type ComponentType, type SVGProps } from "react";
import {
  Bell, Users, Clock, ChevronRight, Plus, Settings, Phone, Mail, Slack,
  AlertTriangle, CheckCircle, Pause, Play, Edit, Trash2, ArrowRight,
  Moon, Sun, Calendar, Shield, Zap, RefreshCw, MoreHorizontal, User, Globe
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";

type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number; className?: string }>;
type TabId = "active" | "rules" | "escalation" | "oncall";

type AlertSeverity = "critical" | "high" | "medium" | "low";
type ChannelType = "slack" | "pagerduty" | "email" | "sms" | "webhook";

interface AlertRule {
  id: string;
  name: string;
  service: string;
  condition: string;
  severity: AlertSeverity;
  enabled: boolean;
  channels: ChannelType[];
  lastFired?: string;
  fireCount: number;
  escalationPolicy: string;
}

interface OnCallSchedule {
  id: string;
  name: string;
  team: string;
  currentOncall: string;
  nextOncall: string;
  rotationType: "weekly" | "daily" | "follow_the_sun";
  members: string[];
}

interface EscalationPolicy {
  id: string;
  name: string;
  description: string;
  levels: EscalationLevel[];
}

interface EscalationLevel {
  level: number;
  delay_minutes: number;
  targets: string[];
  channels: ChannelType[];
}

interface ActiveAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  service: string;
  severity: AlertSeverity;
  message: string;
  firedAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  escalationLevel: number;
  totalEscalations: number;
}

const SEVERITY_CONFIG: Record<AlertSeverity, { color: string; bg: string; border: string }> = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)" },
  high: { color: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.25)" },
  medium: { color: "#eab308", bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.25)" },
  low: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.25)" },
};

const CHANNEL_CONFIG: Record<ChannelType, { icon: LucideIcon; label: string; color: string }> = {
  slack: { icon: Slack, label: "Slack", color: "#4a154b" },
  pagerduty: { icon: Phone, label: "PagerDuty", color: "#06ac38" },
  email: { icon: Mail, label: "Email", color: "#60a5fa" },
  sms: { icon: Phone, label: "SMS", color: "#f97316" },
  webhook: { icon: Globe, label: "Webhook", color: "#a78bfa" },
};

const ALERT_RULES: AlertRule[] = [
  { id: "AR-001", name: "P99 Latency > 2s", service: "api-gateway", condition: "p99_latency > 2000ms for 5m", severity: "critical", enabled: true, channels: ["pagerduty", "slack"], lastFired: "12m ago", fireCount: 3, escalationPolicy: "EP-001" },
  { id: "AR-002", name: "Error Rate > 5%", service: "payment-svc", condition: "error_rate > 5% for 2m", severity: "critical", enabled: true, channels: ["pagerduty", "slack", "sms"], lastFired: "2h ago", fireCount: 1, escalationPolicy: "EP-001" },
  { id: "AR-003", name: "Memory > 90%", service: "worker-pool", condition: "heap_used_pct > 90% for 10m", severity: "high", enabled: true, channels: ["slack", "email"], lastFired: "4h ago", fireCount: 7, escalationPolicy: "EP-002" },
  { id: "AR-004", name: "Cache Hit Rate < 50%", service: "cache-layer", condition: "cache_hit_rate < 0.5 for 15m", severity: "high", enabled: true, channels: ["slack"], lastFired: "1d ago", fireCount: 2, escalationPolicy: "EP-002" },
  { id: "AR-005", name: "DB Connection Pool < 10%", service: "db-primary", condition: "pool_available_pct < 10% for 3m", severity: "critical", enabled: true, channels: ["pagerduty", "slack", "sms"], lastFired: "3d ago", fireCount: 0, escalationPolicy: "EP-001" },
  { id: "AR-006", name: "Slow Queries > 10/min", service: "db-primary", condition: "slow_query_rate > 10 per minute", severity: "medium", enabled: true, channels: ["slack", "email"], lastFired: "2d ago", fireCount: 5, escalationPolicy: "EP-003" },
  { id: "AR-007", name: "ML Inference Latency", service: "ml-engine", condition: "inference_p95 > 800ms for 10m", severity: "medium", enabled: false, channels: ["slack"], fireCount: 0, escalationPolicy: "EP-003" },
  { id: "AR-008", name: "Auth Failure Spike", service: "auth-service", condition: "auth_failures > 100/min for 3m", severity: "high", enabled: true, channels: ["slack", "pagerduty"], lastFired: "5d ago", fireCount: 1, escalationPolicy: "EP-002" },
];

const ESCALATION_POLICIES: EscalationPolicy[] = [
  {
    id: "EP-001",
    name: "P0 Critical — Immediate",
    description: "Page on-call immediately, escalate to team lead in 5m, VP Engineering in 15m",
    levels: [
      { level: 1, delay_minutes: 0, targets: ["Current On-Call"], channels: ["pagerduty", "sms"] },
      { level: 2, delay_minutes: 5, targets: ["Team Lead"], channels: ["pagerduty", "slack"] },
      { level: 3, delay_minutes: 15, targets: ["VP Engineering"], channels: ["pagerduty", "email"] },
    ],
  },
  {
    id: "EP-002",
    name: "P1 High — 5m Delay",
    description: "Notify on-call via Slack, escalate to team lead if unacknowledged in 15m",
    levels: [
      { level: 1, delay_minutes: 0, targets: ["Current On-Call"], channels: ["slack", "email"] },
      { level: 2, delay_minutes: 15, targets: ["Team Lead"], channels: ["pagerduty", "slack"] },
    ],
  },
  {
    id: "EP-003",
    name: "P2 Medium — 30m Delay",
    description: "Email and Slack notification only. No paging.",
    levels: [
      { level: 1, delay_minutes: 0, targets: ["On-Call Team"], channels: ["slack", "email"] },
    ],
  },
];

const ONCALL_SCHEDULES: OnCallSchedule[] = [
  { id: "SC-001", name: "Platform Core", team: "Platform Engineering", currentOncall: "Maria Chen", nextOncall: "James Park", rotationType: "weekly", members: ["Maria Chen", "James Park", "Kevin Singh", "Anna Reyes"] },
  { id: "SC-002", name: "ML & Data", team: "AI/ML Team", currentOncall: "David Liu", nextOncall: "Priya Patel", rotationType: "weekly", members: ["David Liu", "Priya Patel", "Carlos Mendez"] },
  { id: "SC-003", name: "Security On-Call", team: "Security Ops", currentOncall: "Emma Torres", nextOncall: "Noah Kim", rotationType: "daily", members: ["Emma Torres", "Noah Kim", "Sara Johnson", "Mike Zhang"] },
];

const ACTIVE_ALERTS: ActiveAlert[] = [
  { id: "ALE-001", ruleId: "AR-001", ruleName: "P99 Latency > 2s", service: "api-gateway", severity: "critical", message: "p99 latency reached 3,842ms — threshold: 2,000ms. Affecting 8.4% of requests.", firedAt: "12m ago", acknowledged: false, escalationLevel: 2, totalEscalations: 2 },
  { id: "ALE-002", ruleId: "AR-003", ruleName: "Memory > 90%", service: "worker-pool", severity: "high", message: "Heap utilization at 92.4% on worker-pool-03. OOM risk if not addressed.", firedAt: "1h ago", acknowledged: true, acknowledgedBy: "K. Singh", escalationLevel: 1, totalEscalations: 1 },
];

export default function AlertManagementPage() {
  const [tab, setTab] = useState<TabId>("active");
  const [selectedRule, setSelectedRule] = useState<AlertRule | null>(null);

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: "#080f1c" }}>
      {/* Header */}
      <div className="px-5 py-3 border-b flex items-center justify-between shrink-0" style={{ borderColor: "rgba(212,160,84,0.12)" }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(212,160,84,0.1)" }}>
            <Bell className="w-3.5 h-3.5" style={{ color: "#d4a054" }} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Alert Management</h1>
            <p className="text-[9px] text-white/30">Multi-channel alerting · escalation policies · on-call schedules</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded border text-[10px]" style={{ borderColor: "rgba(239,68,68,0.2)", color: "#ef4444", background: "rgba(239,68,68,0.06)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            {ACTIVE_ALERTS.filter(a => !a.acknowledged).length} Active
          </div>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px]" style={{ borderColor: "rgba(212,160,84,0.2)", color: "#d4a054", background: "rgba(212,160,84,0.06)" }}>
            <Plus className="w-3 h-3" /> New Rule
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 border-b flex items-center gap-0 shrink-0" style={{ borderColor: "rgba(212,160,84,0.08)" }}>
        {(["active", "rules", "escalation", "oncall"] as const).map((id) => {
          const tabMeta: Record<TabId, { label: string; count?: number }> = {
            active: { label: "Active Alerts", count: ACTIVE_ALERTS.length },
            rules: { label: "Alert Rules", count: ALERT_RULES.length },
            escalation: { label: "Escalation Policies" },
            oncall: { label: "On-Call Schedules" },
          };
          const t = tabMeta[id];
          return (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-medium border-b-2 transition-all"
            style={{
              borderColor: tab === id ? "#d4a054" : "transparent",
              color: tab === id ? "#d4a054" : "rgba(255,255,255,0.3)",
            }}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="px-1 py-0.5 rounded text-[8px] font-mono" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>{t.count}</span>
            )}
          </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {/* Active Alerts */}
        {tab === "active" && (
          <div className="space-y-4">
            {ACTIVE_ALERTS.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48">
                <CheckCircle className="w-8 h-8 text-emerald-400/30 mb-3" />
                <p className="text-sm text-white/30">All clear — no active alerts</p>
              </div>
            ) : (
              ACTIVE_ALERTS.map(alert => {
                const sev = SEVERITY_CONFIG[alert.severity];
                return (
                  <div key={alert.id} className="rounded-xl border p-4" style={{ borderColor: sev.border, background: sev.bg }}>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold border" style={{ color: sev.color, borderColor: sev.border, background: `${sev.color}15` }}>
                            {alert.severity.toUpperCase()}
                          </span>
                          <span className="text-xs font-bold text-white">{alert.ruleName}</span>
                          <span className="text-[9px] text-white/40">· {alert.service}</span>
                          <span className="text-[9px] text-white/30">{alert.firedAt}</span>
                        </div>
                        <p className="text-[11px] text-white/60 leading-relaxed">{alert.message}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {alert.acknowledged ? (
                          <span className="flex items-center gap-1 text-[9px] text-emerald-400">
                            <CheckCircle className="w-3 h-3" /> Ack by {alert.acknowledgedBy}
                          </span>
                        ) : (
                          <button className="px-2.5 py-1 rounded text-[9px] font-medium border transition-all" style={{ borderColor: sev.border, color: sev.color, background: `${sev.color}10` }}>
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-[9px] text-white/30">
                      <span>Escalation Level {alert.escalationLevel}/{alert.totalEscalations}</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                      <span>Next: Team Lead (5m remaining)</span>
                    </div>
                  </div>
                );
              })
            )}

            {/* Recent resolved */}
            <div>
              <h3 className="text-[10px] text-white/30 font-medium mb-3 uppercase tracking-wider">Recently Resolved</h3>
              <div className="space-y-2">
                {["Error Rate Spike — payment-svc", "Memory Alert — ml-engine", "DB Connection Pressure"].map((name, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "rgba(34,197,94,0.12)", background: "rgba(34,197,94,0.04)" }}>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[11px] text-white/50 flex-1">{name}</span>
                    <span className="text-[9px] text-white/20">{[22, 45, 180][i]}m ago</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Alert Rules */}
        {tab === "rules" && (
          <div className="space-y-2">
            {ALERT_RULES.map(rule => {
              const sev = SEVERITY_CONFIG[rule.severity];
              return (
                <div
                  key={rule.id}
                  className="flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:border-opacity-60"
                  style={{ borderColor: rule.enabled ? sev.border : "rgba(255,255,255,0.06)", background: rule.enabled ? sev.bg : "rgba(255,255,255,0.02)", opacity: rule.enabled ? 1 : 0.5 }}
                  onClick={() => setSelectedRule(selectedRule?.id === rule.id ? null : rule)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-white">{rule.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold" style={{ color: sev.color, background: `${sev.color}15` }}>{rule.severity.toUpperCase()}</span>
                      <span className="text-[9px] text-white/30">· {rule.service}</span>
                    </div>
                    <p className="text-[10px] font-mono text-white/40">{rule.condition}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {rule.channels.map(ch => {
                      const cfg = CHANNEL_CONFIG[ch];
                      const Icon = cfg.icon;
                      return <Icon key={ch} className="w-3.5 h-3.5 text-white/30" aria-label={cfg.label} />;
                    })}
                    <span className="text-[9px] text-white/25">{rule.fireCount}x</span>
                    <div className={cn("w-8 h-4 rounded-full transition-all relative", rule.enabled ? "bg-emerald-500/40" : "bg-white/10")}>
                      <div className={cn("absolute top-0.5 w-3 h-3 rounded-full transition-all", rule.enabled ? "left-4 bg-emerald-400" : "left-0.5 bg-white/30")} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Escalation Policies */}
        {tab === "escalation" && (
          <div className="space-y-4">
            {ESCALATION_POLICIES.map(policy => (
              <div key={policy.id} className="rounded-xl border p-4" style={{ borderColor: "rgba(212,160,84,0.15)", background: "rgba(212,160,84,0.04)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-0.5">{policy.name}</h3>
                    <p className="text-[10px] text-white/40">{policy.description}</p>
                  </div>
                  <span className="text-[9px] font-mono text-white/20">{policy.id}</span>
                </div>
                <div className="space-y-2">
                  {policy.levels.map(level => (
                    <div key={level.level} className="flex items-center gap-4 p-3 rounded-lg border" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(212,160,84,0.15)", color: "#d4a054" }}>
                        <span className="text-[9px] font-bold">{level.level}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="font-medium text-white/70">{level.targets.join(", ")}</span>
                          <span className="text-white/20">via</span>
                          {level.channels.map(ch => {
                            const cfg = CHANNEL_CONFIG[ch];
                            return <span key={ch} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>{cfg.label}</span>;
                          })}
                        </div>
                      </div>
                      <span className="text-[9px] text-white/30 shrink-0">
                        {level.delay_minutes === 0 ? "Immediately" : `After ${level.delay_minutes}m`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* On-Call Schedules */}
        {tab === "oncall" && (
          <div className="space-y-4">
            {ONCALL_SCHEDULES.map(schedule => (
              <div key={schedule.id} className="rounded-xl border p-4" style={{ borderColor: "rgba(96,165,250,0.15)", background: "rgba(96,165,250,0.04)" }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-0.5">{schedule.name}</h3>
                    <p className="text-[10px] text-white/40">{schedule.team} · {schedule.rotationType.replace(/_/g, " ")} rotation</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] border" style={{ borderColor: "rgba(34,197,94,0.2)", color: "#22c55e", background: "rgba(34,197,94,0.08)" }}>
                    Active
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-lg border" style={{ borderColor: "rgba(34,197,94,0.2)", background: "rgba(34,197,94,0.06)" }}>
                    <p className="text-[8px] text-emerald-400/50 mb-1">CURRENT ON-CALL</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <User className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span className="text-[11px] font-bold text-emerald-300">{schedule.currentOncall}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                    <p className="text-[8px] text-white/20 mb-1">UP NEXT</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                        <User className="w-3 h-3 text-white/30" />
                      </div>
                      <span className="text-[11px] text-white/50">{schedule.nextOncall}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[8px] text-white/20 mb-2">ROTATION MEMBERS</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {schedule.members.map((member, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9px]" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" }}>
                        <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <span className="text-[7px] text-blue-400 font-bold">{member[0]}</span>
                        </div>
                        <span className="text-white/50">{member}</span>
                        {i === 0 && <span className="text-[7px] text-emerald-400">● Active</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
