import { useState } from "react";
import { Server, CheckCircle, AlertTriangle, Clock, BarChart3, FileText, Play, RefreshCw, Loader2, Activity } from "lucide-react";

const DIGEST_HEALTH = [
  { type: "weekly_partner", label: "Weekly Partner Digest", lastRun: "Apr 7, 7:03 AM", status: "healthy", nextRun: "Apr 14", matterCount: 47, failureCount: 0 },
  { type: "high_pressure", label: "High-Pressure Digest", lastRun: "Apr 6, 8:15 AM", status: "healthy", nextRun: "Apr 8 (when critical > 3)", matterCount: 22, failureCount: 0 },
  { type: "movement_opportunity", label: "Movement Opportunity Digest", lastRun: "Apr 2, 7:00 AM", status: "healthy", nextRun: "Apr 9", matterCount: 9, failureCount: 0 },
  { type: "bottleneck", label: "Bottleneck Digest", lastRun: "Apr 5, 6:55 AM", status: "degraded", nextRun: "Apr 8", matterCount: 30, failureCount: 1 },
  { type: "insurer_drag", label: "Insurer Drag Digest", lastRun: "Apr 4, 7:01 AM", status: "healthy", nextRun: "Apr 11", matterCount: 47, failureCount: 0 },
  { type: "recovery_lien_drag", label: "Recovery / Lien Drag Digest", lastRun: "Apr 3, 7:05 AM", status: "healthy", nextRun: "Apr 10", matterCount: 15, failureCount: 0 },
];

const INTERVENTION_TRACKING = [
  { id: 1, matter: "Rodriguez v. National General", type: "partner_escalation", intervenedBy: "J. Lutar", occurredAt: "Apr 6", outcome: "pending", leverageScore: 0.91, pressureBefore: 0.84, pressureAfter: null },
  { id: 2, matter: "Thompson v. Westfield", type: "evidence_push", intervenedBy: "R. Patel", occurredAt: "Apr 3", outcome: "unblocked", leverageScore: 0.75, pressureBefore: 0.82, pressureAfter: 0.71 },
  { id: 3, matter: "Chen v. GEICO Direct", type: "movement_push", intervenedBy: "J. Lutar", occurredAt: "Mar 29", outcome: "movement", leverageScore: 0.88, pressureBefore: 0.79, pressureAfter: 0.61 },
  { id: 4, matter: "Lee v. State Farm", type: "reassignment", intervenedBy: "Admin", occurredAt: "Mar 25", outcome: "no_effect", leverageScore: 0.32, pressureBefore: 0.54, pressureAfter: 0.58 },
];

const SNAPSHOT_HEALTH = {
  lastComputedAt: "Apr 7, 2026 6:45 AM",
  status: "healthy",
  mattersProcessed: 47,
  snapshotAge: "~2h ago",
  nextScheduled: "Apr 8, 6:45 AM",
};

const STATUS_META: Record<string, { icon: any; color: string }> = {
  healthy: { icon: CheckCircle, color: "#4a90b8" },
  degraded: { icon: AlertTriangle, color: "#c8953c" },
  failed: { icon: AlertTriangle, color: "#c45a4a" },
  pending: { icon: Clock, color: "#d4a054" },
};

const INTERVENTION_TYPE_LABELS: Record<string, string> = {
  partner_escalation: "Partner Escalation",
  evidence_push: "Evidence Push",
  movement_push: "Movement Push",
  reassignment: "Reassignment",
  insurer_escalation: "Insurer Escalation",
};

const OUTCOME_META: Record<string, { label: string; color: string }> = {
  movement: { label: "Movement", color: "#4a90b8" },
  unblocked: { label: "Unblocked", color: "#4a90b8" },
  resolved: { label: "Resolved", color: "#4a90b8" },
  pending: { label: "Pending", color: "#d4a054" },
  no_effect: { label: "No Effect", color: "#c8953c" },
};

export default function AdminPortfolioPage() {
  const [regenerating, setRegenerating] = useState<string | null>(null);

  const handleRegenerate = (type: string) => {
    setRegenerating(type);
    setTimeout(() => setRegenerating(null), 1800);
  };

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-[#d4a054]" />
          <h1 className="text-lg font-semibold text-slate-100">Portfolio Admin</h1>
          <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-[#c8953c]/10 text-[#c8953c]">DEMO DATA</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">Digest generation health, portfolio snapshot status, partner intervention tracking</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Snapshot Status", value: SNAPSHOT_HEALTH.status.toUpperCase(), sub: SNAPSHOT_HEALTH.snapshotAge, color: "#4a90b8" },
          { label: "Digest Runs (7d)", value: DIGEST_HEALTH.length, sub: `${DIGEST_HEALTH.filter(d => d.status === "healthy").length} healthy`, color: "#d4a054" },
          { label: "Interventions Tracked", value: INTERVENTION_TRACKING.length, sub: `${INTERVENTION_TRACKING.filter(i => i.outcome === "movement").length} led to movement`, color: "#8b7ac8" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
            <div className="text-[10px] text-slate-500 mb-1">{s.label}</div>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[9px] text-slate-500 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#d4a054]" />
            <h3 className="text-sm font-semibold text-slate-200">Portfolio Snapshot</h3>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[#4a90b8]">
            <CheckCircle className="w-3 h-3" />
            Healthy
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Last Computed", value: SNAPSHOT_HEALTH.lastComputedAt },
            { label: "Matters Processed", value: SNAPSHOT_HEALTH.mattersProcessed },
            { label: "Next Scheduled", value: SNAPSHOT_HEALTH.nextScheduled },
            { label: "Snapshot Age", value: SNAPSHOT_HEALTH.snapshotAge },
          ].map(s => (
            <div key={s.label} className="rounded border border-white/[0.04] p-2.5" style={{ background: "#080c14" }}>
              <div className="text-[9px] text-slate-600">{s.label}</div>
              <div className="text-[11px] text-slate-300 mt-0.5">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-[#d4a054]" />
          <h3 className="text-sm font-semibold text-slate-200">Digest Generation Health</h3>
        </div>
        <div className="space-y-2">
          {DIGEST_HEALTH.map(d => {
            const sm = STATUS_META[d.status];
            const Icon = sm.icon;
            return (
              <div key={d.type} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: sm.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-200">{d.label}</div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-slate-500">Last: {d.lastRun}</span>
                    <span className="text-[10px] text-slate-600">•</span>
                    <span className="text-[10px] text-slate-500">Next: {d.nextRun}</span>
                    <span className="text-[10px] text-slate-600">•</span>
                    <span className="text-[10px] text-slate-500">{d.matterCount} matters</span>
                    {d.failureCount > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#c8953c]/10 text-[#c8953c]">{d.failureCount} failure</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleRegenerate(d.type)}
                  disabled={regenerating === d.type}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[9px] text-slate-400 hover:text-slate-200 bg-white/[0.04] hover:bg-white/[0.08] transition-colors disabled:opacity-50"
                >
                  {regenerating === d.type ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <RefreshCw className="w-2.5 h-2.5" />}
                  {regenerating === d.type ? "Running" : "Run Now"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-[#8b7ac8]" />
          <h3 className="text-sm font-semibold text-slate-200">Partner Intervention Tracking</h3>
        </div>
        <div className="space-y-2">
          {INTERVENTION_TRACKING.map(item => {
            const om = OUTCOME_META[item.outcome];
            return (
              <div key={item.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-200">{item.matter}</div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-slate-500">{INTERVENTION_TYPE_LABELS[item.type] || item.type}</span>
                    <span className="text-[10px] text-slate-600">•</span>
                    <span className="text-[10px] text-slate-500">By: {item.intervenedBy}</span>
                    <span className="text-[10px] text-slate-600">•</span>
                    <span className="text-[10px] text-slate-500">{item.occurredAt}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: `${om.color}15`, color: om.color }}>{om.label}</span>
                  <div className="text-[9px] text-slate-600 mt-0.5">Leverage: {Math.round(item.leverageScore * 100)}%</div>
                </div>
                {item.pressureAfter !== null && (
                  <div className="text-right w-16">
                    <div className="text-[9px] text-slate-600">Pressure</div>
                    <div className="text-[9px] font-mono text-slate-400">
                      {Math.round(item.pressureBefore * 100)}% → {Math.round((item.pressureAfter ?? 0) * 100)}%
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
