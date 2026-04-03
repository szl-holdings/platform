import { useState } from "react";
import { Shield, CheckCircle, AlertTriangle, Clock, BarChart3, Plug, Activity } from "lucide-react";
import { incidentReadiness, threatTwins, exposureTwins } from "@/data/threat-twin";

const ACCENT = "hsl(220 72% 56%)";

const READINESS_COLOR: Record<string, string> = {
  ready: "#40856a",
  partial: "#c08a2c",
  degraded: "#c04a2a",
  not_ready: "#9b1c1c",
};

const READINESS_LABEL: Record<string, string> = {
  ready: "Ready",
  partial: "Partial",
  degraded: "Degraded",
  not_ready: "Not Ready",
};

const AREA_ICONS: Record<string, React.ElementType> = {
  detection: Activity,
  response: Shield,
  recovery: CheckCircle,
  communication: BarChart3,
  governance: Clock,
};

function RadialScore({ score, color, size = 60 }: { score: number; color: string; size?: number }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size * 0.1} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size * 0.1}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)} strokeLinecap="round" />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={size * 0.24} fontWeight="700"
        transform={`rotate(90, ${size/2}, ${size/2})`}>
        {score}
      </text>
    </svg>
  );
}

function ReadinessCard({ area }: { area: typeof incidentReadiness[0] }) {
  const color = READINESS_COLOR[area.status];
  const Icon = AREA_ICONS[area.area] ?? Activity;
  return (
    <div className="rounded-xl border p-5" style={{
      background: area.status === "degraded" || area.status === "not_ready" ? "#c04a2a05" : "rgba(255,255,255,0.02)",
      borderColor: area.status === "degraded" ? "#c04a2a25" : area.status === "not_ready" ? "#9b1c1c35" : "rgba(255,255,255,0.06)",
    }}>
      <div className="flex items-start gap-4 mb-3">
        <RadialScore score={area.score} color={color} size={64} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Icon size={14} style={{ color }} />
            <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{area.label}</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>
            {READINESS_LABEL[area.status]}
          </span>
          {area.lastTestedAt && (
            <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
              Last tested: {new Date(area.lastTestedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
      {area.issues.length > 0 && (
        <div className="space-y-1">
          {area.issues.map((issue, i) => (
            <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "#c08a2c" }}>
              <AlertTriangle size={10} />
              {issue}
            </div>
          ))}
        </div>
      )}
      {area.pendingActions > 0 && (
        <div className="mt-2 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
          {area.pendingActions} pending action{area.pendingActions > 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

const EXTERNAL_SOURCES = [
  { name: "CrowdStrike Falcon EDR", type: "EDR / Endpoint", status: "not_connected" },
  { name: "Splunk SIEM", type: "SIEM", status: "not_connected" },
  { name: "Tenable.io", type: "Vulnerability Scanner", status: "not_connected" },
  { name: "MISP Threat Intel", type: "Threat Intelligence", status: "not_connected" },
  { name: "Okta / Azure AD", type: "Identity Provider", status: "not_connected" },
];

export default function IncidentReadinessView() {
  const overallScore = Math.round(
    incidentReadiness.reduce((sum, a) => sum + a.score, 0) / incidentReadiness.length
  );
  const overallColor = overallScore >= 80 ? "#40856a" : overallScore >= 60 ? "#c08a2c" : "#c04a2a";
  const criticalThreats = threatTwins.filter(t => t.severity === "critical" && t.status !== "closed").length;
  const criticalExposures = exposureTwins.filter(e => e.severity === "critical" && e.remediationStatus === "open" || e.remediationStatus === "in_progress").length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>Incident Readiness</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Domain-by-domain readiness scoring across detection, response, recovery, communication, and governance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="col-span-1 rounded-xl border p-5 flex flex-col items-center justify-center" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <RadialScore score={overallScore} color={overallColor} size={80} />
          <div className="text-xs mt-2 text-center" style={{ color: "rgba(255,255,255,0.4)" }}>Overall Readiness</div>
        </div>
        <div className="rounded-xl border p-4" style={{ background: "#9b1c1c08", borderColor: "#9b1c1c30" }}>
          <div className="text-xs mb-1" style={{ color: "#f87171" }}>Active Critical Threats</div>
          <div className="text-2xl font-bold" style={{ color: "#f87171" }}>{criticalThreats}</div>
          <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>require immediate action</div>
        </div>
        <div className="rounded-xl border p-4" style={{ background: "#c04a2a08", borderColor: "#c04a2a25" }}>
          <div className="text-xs mb-1" style={{ color: "#c04a2a" }}>Open Critical Exposures</div>
          <div className="text-2xl font-bold" style={{ color: "#c04a2a" }}>{criticalExposures}</div>
        </div>
        <div className="rounded-xl border p-4" style={{ background: "#c08a2c08", borderColor: "#c08a2c25" }}>
          <div className="text-xs mb-1" style={{ color: "#c08a2c" }}>Areas Degraded</div>
          <div className="text-2xl font-bold" style={{ color: "#c08a2c" }}>
            {incidentReadiness.filter(a => a.status === "degraded" || a.status === "not_ready").length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {incidentReadiness.map(a => <ReadinessCard key={a.id} area={a} />)}
      </div>

      <div className="rounded-xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Plug size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
          <h3 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>External Tool Coverage</h3>
        </div>
        <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
          Connecting these tools would significantly improve detection and readiness scores. Connect credentials to enable live data.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {EXTERNAL_SOURCES.map(s => (
            <div key={s.name} className="flex items-center justify-between rounded-lg border p-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div>
                <div className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{s.name}</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{s.type}</div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)" }}>
                Connect
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
