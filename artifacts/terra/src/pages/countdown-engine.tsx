import { useState } from "react";
import {
  Timer, CheckCircle, AlertTriangle, Clock,
  Calendar, Flag, Zap, User
} from "lucide-react";
import {
  readinessGraphs,
  countdownMilestones,
  type CountdownMilestone,
} from "@/data/readiness-graph";

const ACCENT = "#40856a";
const DEMO_BADGE = (
  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase tracking-widest"
    style={{ background: "rgba(184,148,60,0.12)", color: "#b8943c", border: "1px solid rgba(184,148,60,0.2)" }}>
    Simulated Data
  </span>
);

const STATUS_CONFIG = {
  on_track: { color: ACCENT, label: "On Track", icon: CheckCircle },
  slipping: { color: "#b8943c", label: "Slipping", icon: Clock },
  escalate: { color: "#c04a2a", label: "Escalate", icon: AlertTriangle },
  complete: { color: "rgba(255,255,255,0.3)", label: "Complete", icon: CheckCircle },
};

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

function formatDays(n: number): string {
  if (n < 0) return `${Math.abs(n)}d overdue`;
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  return `${n} days`;
}

function CountdownRing({ days, total }: { days: number; total: number }) {
  const capped = Math.max(0, Math.min(total, days));
  const pct = total > 0 ? capped / total : 0;
  const color = days < 0 ? "#c04a2a" : days <= 7 ? "#b8943c" : ACCENT;
  const r = 44;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={100} height={100} viewBox="0 0 100 100" className="-rotate-90">
      <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
      <circle
        cx={50} cy={50} r={r} fill="none"
        stroke={color} strokeWidth={10}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
      />
      <text x={50} y={46} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={20} fontWeight="800"
        transform="rotate(90, 50, 50)">
        {days < 0 ? "!" : days}
      </text>
      <text x={50} y={62} textAnchor="middle" dominantBaseline="middle"
        fill="rgba(255,255,255,0.3)" fontSize={9}
        transform="rotate(90, 50, 50)">
        {days < 0 ? "OVERDUE" : "DAYS LEFT"}
      </text>
    </svg>
  );
}

function MilestoneRow({ milestone }: { milestone: CountdownMilestone }) {
  const cfg = STATUS_CONFIG[milestone.status];
  const Icon = cfg.icon;
  const days = daysUntil(milestone.targetDate);

  return (
    <div className="flex items-start gap-4 py-3 border-b"
      style={{ borderColor: "rgba(255,255,255,0.04)" }}>
      <div className="flex-shrink-0 pt-0.5">
        <Icon size={15} style={{ color: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-sm font-medium"
            style={{ color: milestone.status === "complete" ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.85)" }}>
            {milestone.label}
          </span>
          {milestone.isCriticalPath && milestone.status !== "complete" && (
            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
              style={{ color: "#c04a2a", background: "rgba(192,74,42,0.12)", border: "1px solid rgba(192,74,42,0.2)" }}>
              Critical Path
            </span>
          )}
        </div>
        {milestone.riskNote && (
          <div className="flex items-start gap-1.5 text-[10px] mt-1"
            style={{ color: "#b8943c" }}>
            <AlertTriangle size={10} className="flex-shrink-0 mt-0.5" />
            {milestone.riskNote}
          </div>
        )}
        <div className="flex items-center gap-3 mt-1 text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
          {milestone.owner && (
            <span className="flex items-center gap-0.5">
              <User size={9} />
              {milestone.owner}
            </span>
          )}
          <span className="flex items-center gap-0.5">
            <Calendar size={9} />
            {new Date(milestone.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        <div className="text-xs font-bold font-mono"
          style={{ color: days < 0 ? "#c04a2a" : days <= 7 ? "#b8943c" : "rgba(255,255,255,0.6)" }}>
          {formatDays(days)}
        </div>
        <div className="text-[9px] mt-0.5 font-medium px-1.5 py-0.5 rounded"
          style={{ color: cfg.color, background: `${cfg.color}12` }}>
          {cfg.label}
        </div>
      </div>
    </div>
  );
}

function PropertyCountdown({ propertyId, propertyName, eventLabel, eventDate }: {
  propertyId: string;
  propertyName: string;
  eventLabel: string;
  eventDate: string;
}) {
  const milestones = countdownMilestones[propertyId] ?? [];
  const daysLeft = daysUntil(eventDate);
  const totalDays = 120;

  const escalate = milestones.filter(m => m.status === "escalate").length;
  const slipping = milestones.filter(m => m.status === "slipping").length;
  const onTrack = milestones.filter(m => m.status === "on_track").length;
  const complete = milestones.filter(m => m.status === "complete").length;

  const sorted = [...milestones].sort((a, b) => {
    const order = { escalate: 0, slipping: 1, on_track: 2, complete: 3 };
    return order[a.status] - order[b.status];
  });

  return (
    <div className="rounded-2xl border p-6"
      style={{
        background: "rgba(255,255,255,0.02)",
        borderColor: escalate > 0 ? "rgba(192,74,42,0.2)" : slipping > 0 ? "rgba(184,148,60,0.15)" : "rgba(64,133,106,0.12)",
      }}>
      <div className="flex items-start gap-5 mb-5">
        <CountdownRing days={daysLeft} total={totalDays} />
        <div className="flex-1 min-w-0">
          <div className="text-base font-bold mb-0.5" style={{ color: "rgba(255,255,255,0.95)" }}>
            {propertyName}
          </div>
          <div className="flex items-center gap-1.5 text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
            <Flag size={11} />
            <span>{eventLabel}</span>
            <span>·</span>
            <span>{new Date(eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {escalate > 0 && (
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg"
                style={{ background: "rgba(192,74,42,0.1)", color: "#c04a2a", border: "1px solid rgba(192,74,42,0.2)" }}>
                <AlertTriangle size={11} />
                {escalate} need escalation
              </div>
            )}
            {slipping > 0 && (
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg"
                style={{ background: "rgba(184,148,60,0.1)", color: "#b8943c", border: "1px solid rgba(184,148,60,0.2)" }}>
                <Clock size={11} />
                {slipping} slipping
              </div>
            )}
            {onTrack > 0 && (
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg"
                style={{ background: "rgba(64,133,106,0.1)", color: ACCENT, border: "1px solid rgba(64,133,106,0.2)" }}>
                <CheckCircle size={11} />
                {onTrack} on track
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-0">
        {sorted.map(m => <MilestoneRow key={m.id} milestone={m} />)}
      </div>

      {escalate > 0 && (
        <div className="mt-4 rounded-xl border p-3 flex items-start gap-2"
          style={{ background: "rgba(192,74,42,0.06)", borderColor: "rgba(192,74,42,0.2)" }}>
          <Zap size={13} style={{ color: "#c04a2a", flexShrink: 0, marginTop: 1 }} />
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
            <span className="font-bold" style={{ color: "#c04a2a" }}>Action required: </span>
            {escalate} milestone{escalate > 1 ? "s" : ""} need immediate escalation to prevent missing the {eventLabel} deadline.
          </div>
        </div>
      )}
    </div>
  );
}

export default function CountdownEngine() {
  const graphsWithMilestones = readinessGraphs.filter(g => g.countdownEvent);

  const totalEscalate = graphsWithMilestones.reduce((sum, g) => {
    const ms = countdownMilestones[g.propertyId] ?? [];
    return sum + ms.filter(m => m.status === "escalate").length;
  }, 0);

  const totalSlipping = graphsWithMilestones.reduce((sum, g) => {
    const ms = countdownMilestones[g.propertyId] ?? [];
    return sum + ms.filter(m => m.status === "slipping").length;
  }, 0);

  const totalOnTrack = graphsWithMilestones.reduce((sum, g) => {
    const ms = countdownMilestones[g.propertyId] ?? [];
    return sum + ms.filter(m => m.status === "on_track").length;
  }, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Timer size={18} style={{ color: ACCENT }} />
            <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>Countdown Engine</h1>
            {DEMO_BADGE}
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Closing, move-in, and occupancy countdowns with risk-adjusted milestones — on track, slipping, and escalation status per event
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active Countdowns", value: graphsWithMilestones.length.toString(), color: "rgba(255,255,255,0.8)" },
          { label: "Escalate Now", value: totalEscalate.toString(), color: totalEscalate > 0 ? "#c04a2a" : ACCENT, pulse: totalEscalate > 0 },
          { label: "Slipping", value: totalSlipping.toString(), color: totalSlipping > 0 ? "#b8943c" : ACCENT },
          { label: "On Track", value: totalOnTrack.toString(), color: ACCENT },
        ].map(m => (
          <div key={m.label} className="rounded-xl border p-4"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>{m.label}</div>
            <div className="flex items-center gap-1.5">
              <div className="text-2xl font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
              {m.pulse && (
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: m.color }} />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-5">
        {graphsWithMilestones.map(g => (
          <PropertyCountdown
            key={g.propertyId}
            propertyId={g.propertyId}
            propertyName={g.propertyName}
            eventLabel={g.countdownEvent!.label}
            eventDate={g.countdownEvent!.date}
          />
        ))}
      </div>
    </div>
  );
}
