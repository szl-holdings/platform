import { Bell, Clock, ShieldAlert, AlertTriangle, ArrowUpRight, Activity } from "lucide-react";
import { matterTwins, obligationTwins } from "../data/counsel-twin";
import { cn } from "@szl-holdings/shared-ui/utils";

type AlertSeverity = "critical" | "high" | "medium" | "low";

interface CounselAlert {
  id: string;
  severity: AlertSeverity;
  type: "deadline" | "escalation" | "risk" | "drift";
  title: string;
  matter: string;
  detail: string;
  triggeredAt: string;
  confidence: number;
  recommendedAction: string;
}

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600000).toISOString();

const severityStyle: Record<AlertSeverity, { bg: string; border: string; text: string; dot: string; label: string }> = {
  critical: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-300", dot: "bg-red-400", label: "Critical" },
  high: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-300", dot: "bg-amber-400", label: "High" },
  medium: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-300", dot: "bg-violet-400", label: "Medium" },
  low: { bg: "bg-slate-500/10", border: "border-slate-500/30", text: "text-slate-300", dot: "bg-slate-400", label: "Low" },
};

const typeIcon: Record<CounselAlert["type"], typeof Clock> = {
  deadline: Clock,
  escalation: ArrowUpRight,
  risk: ShieldAlert,
  drift: Activity,
};

function timeSince(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 60) return `${Math.round(diff)}m ago`;
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
  return `${Math.round(diff / 1440)}d ago`;
}

const alerts: CounselAlert[] = [
  {
    id: "alert-001",
    severity: "critical",
    type: "deadline",
    title: "Discovery Request Response — 18 days overdue",
    matter: matterTwins[0]!.name,
    detail: "Morrison & Vance has not produced responsive documents. Missed deadline now blocks the regulatory filing chain.",
    triggeredAt: hoursAgo(2),
    confidence: 0.97,
    recommendedAction: "Escalate to Lead Counsel and request emergency status conference.",
  },
  {
    id: "alert-002",
    severity: "critical",
    type: "risk",
    title: "Final Filing Submission at-risk in 11 days",
    matter: matterTwins[0]!.name,
    detail: "Upstream blocker (Draft Regulatory Report) cannot complete in time without external counsel reassignment.",
    triggeredAt: hoursAgo(4),
    confidence: 0.92,
    recommendedAction: "Re-route Draft Regulatory Report to Sterling & Ross for parallel completion.",
  },
  {
    id: "alert-003",
    severity: "high",
    type: "escalation",
    title: "External counsel performance below threshold",
    matter: "Morrison & Vance — firm-wide",
    detail: "On-time delivery 68% vs. 85% SLA. Three deliverables overdue in current quarter.",
    triggeredAt: hoursAgo(8),
    confidence: 0.88,
    recommendedAction: "Trigger formal performance review under Master Engagement Letter §4.2.",
  },
  {
    id: "alert-004",
    severity: "high",
    type: "deadline",
    title: "Data Map Compilation due in 5 days",
    matter: matterTwins[3]!.name,
    detail: "Fenwick LLP confirms on-track; one inter-region clarification pending from EU privacy lead.",
    triggeredAt: hoursAgo(12),
    confidence: 0.74,
    recommendedAction: "Confirm EU lead availability; auto-draft clarification request from prior memo.",
  },
  {
    id: "alert-005",
    severity: "medium",
    type: "drift",
    title: "Privilege log drift detected",
    matter: matterTwins[1]!.name,
    detail: "12 newly produced documents lack matching privilege classifications versus baseline policy.",
    triggeredAt: hoursAgo(20),
    confidence: 0.81,
    recommendedAction: "Auto-classify with last-known model and queue for paralegal review.",
  },
  {
    id: "alert-006",
    severity: "medium",
    type: "risk",
    title: "Settlement exposure variance > 15%",
    matter: matterTwins[1]!.name,
    detail: "Counterparty's most recent offer increases probable exposure from $1.2M to $1.4M.",
    triggeredAt: hoursAgo(26),
    confidence: 0.69,
    recommendedAction: "Update reserve estimate and notify finance ahead of quarter close.",
  },
  {
    id: "alert-007",
    severity: "low",
    type: "deadline",
    title: "Due Diligence Review — 20 days to deadline",
    matter: matterTwins[2]!.name,
    detail: "Internal Legal on track. No upstream dependencies blocked.",
    triggeredAt: hoursAgo(36),
    confidence: 0.55,
    recommendedAction: "Acknowledge and continue monitoring weekly.",
  },
];

export default function Alerts() {
  const counts = alerts.reduce<Record<AlertSeverity, number>>(
    (acc, a) => ({ ...acc, [a.severity]: (acc[a.severity] || 0) + 1 }),
    { critical: 0, high: 0, medium: 0, low: 0 },
  );

  const overdueObligations = obligationTwins.filter(o => o.status === "overdue").length;

  return (
    <div className="p-6 space-y-6">
      <header>
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-4 h-4 text-violet-400" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-violet-400/60">Operations · Alerts</span>
        </div>
        <h1 className="text-2xl font-bold text-violet-100">Obligation & Escalation Alerts</h1>
        <p className="text-violet-400/60 text-sm">
          Live deadline, escalation, and policy-drift notifications scored by Counsel's confidence model.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(Object.keys(counts) as AlertSeverity[]).map(sev => {
          const s = severityStyle[sev];
          return (
            <div key={sev} className={cn("p-4 rounded-xl border", s.bg, s.border)}>
              <div className="flex items-center gap-2 mb-2">
                <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", s.dot)} />
                <span className={cn("text-[10px] font-mono uppercase tracking-widest", s.text)}>{s.label}</span>
              </div>
              <div className="text-3xl font-bold text-violet-50">{counts[sev]}</div>
              <div className="text-[10px] text-violet-400/50 mt-1">
                {sev === "critical" ? `${overdueObligations} overdue obligations` : "active alerts"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        {alerts.map(a => {
          const s = severityStyle[a.severity];
          const Icon = typeIcon[a.type];
          return (
            <div
              key={a.id}
              className={cn(
                "rounded-xl border p-4 bg-[#0a0614]",
                a.severity === "critical" ? "border-red-500/20" : "border-violet-500/10",
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border", s.bg, s.border)}>
                  <Icon className={cn("w-5 h-5", s.text)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border", s.bg, s.border, s.text)}>
                      {s.label}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-violet-500/5 border border-violet-500/10 text-[10px] font-mono uppercase tracking-wider text-violet-300/70">
                      {a.type}
                    </span>
                    <span className="text-[10px] font-mono text-violet-400/50">{timeSince(a.triggeredAt)}</span>
                  </div>
                  <div className="text-sm font-semibold text-violet-50">{a.title}</div>
                  <div className="text-[11px] text-violet-300/60 mt-0.5">Matter: {a.matter}</div>
                  <p className="text-xs text-violet-200/70 mt-2 leading-relaxed">{a.detail}</p>
                  <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-violet-500/5 border border-violet-500/10">
                    <AlertTriangle className="w-3.5 h-3.5 text-violet-300 mt-0.5 shrink-0" />
                    <div className="text-[11px] text-violet-200/80">
                      <span className="font-mono uppercase tracking-wider text-[9px] text-violet-400/60 mr-1">
                        Recommended
                      </span>
                      {a.recommendedAction}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[9px] font-mono uppercase tracking-widest text-violet-400/50 mb-1">
                    Confidence
                  </div>
                  <div className={cn(
                    "text-lg font-bold tabular-nums",
                    a.confidence >= 0.9 ? "text-emerald-300" : a.confidence >= 0.7 ? "text-violet-200" : "text-amber-300",
                  )}>
                    {(a.confidence * 100).toFixed(0)}%
                  </div>
                  <div className="mt-2 w-24 h-1 rounded-full bg-violet-500/10 overflow-hidden">
                    <div
                      className={cn(
                        "h-full",
                        a.confidence >= 0.9 ? "bg-emerald-400" : a.confidence >= 0.7 ? "bg-violet-400" : "bg-amber-400",
                      )}
                      style={{ width: `${a.confidence * 100}%` }}
                    />
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
