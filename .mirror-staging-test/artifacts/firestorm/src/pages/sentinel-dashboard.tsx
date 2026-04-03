import { useQuery } from "@tanstack/react-query";
import { Shield, AlertTriangle, Eye, Clock, Activity, Target, Radio, Wifi, Lock, Zap, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";

const threatFeeds = [
  { source: "MITRE ATT&CK", threats: 142, severity: "high", lastUpdate: "2m ago", status: "active" },
  { source: "AlienVault OTX", threats: 248, severity: "high", lastUpdate: "1m ago", status: "active" },
  { source: "CISA KEV", threats: 1082, severity: "critical", lastUpdate: "1h ago", status: "active" },
  { source: "FS-ISAC TAXII", threats: 328, severity: "critical", lastUpdate: "15m ago", status: "active" },
  { source: "CrowdStrike Intel", threats: 94, severity: "high", lastUpdate: "8m ago", status: "active" },
];

const sentinelAlerts = [
  { id: "SEN-0428", type: "APT Campaign", message: "Operation Darkwing — Phase 3 Lateral Movement (APT29 / Cozy Bear) · WORKSTATION-142 → DC-PROD-03", severity: "critical", time: "LIVE", confidence: 97 },
  { id: "SEN-0427", type: "Credential Theft", message: "LSASS process memory dump on WORKSTATION-142 — T1003.001 confirmed", severity: "critical", time: "1h ago", confidence: 99 },
  { id: "SEN-0426", type: "C2 Beaconing", message: "Outbound TLS beacon to apt29.c2.domain:443 — 30s interval, 6h duration", severity: "critical", time: "6h ago", confidence: 93 },
  { id: "SEN-0425", type: "Cloud Exfil Attempt", message: "S3 bucket upload detected — szl-backups-prod · 4.2GB staged, blocked at egress", severity: "high", time: "11h ago", confidence: 89 },
  { id: "SEN-0424", type: "Identity Anomaly", message: "user.mrodriguez — Azure AD anomalous OAuth token request from unknown device", severity: "high", time: "18h ago", confidence: 84 },
  { id: "SEN-0421", type: "Intrusion Detection", message: "Suspicious lateral movement detected in subnet 10.0.2.x", severity: "critical", time: "6h ago", confidence: 94 },
];

const monitoringZones = [
  { zone: "Perimeter", status: "secured", devices: 24, events: 1420, threatLevel: "low" },
  { zone: "DMZ", status: "elevated", devices: 12, events: 892, threatLevel: "medium" },
  { zone: "Internal Network", status: "alert", devices: 156, events: 12847, threatLevel: "high" },
  { zone: "Cloud Services", status: "elevated", devices: 38, events: 2341, threatLevel: "medium" },
  { zone: "Endpoints", status: "alert", devices: 284, events: 18910, threatLevel: "high" },
];

const MITRE_COVERAGE = [
  { tactic: "Initial Access", techniques: 9, covered: 8, detected: 7, color: "#3b82f6" },
  { tactic: "Execution", techniques: 12, covered: 10, detected: 9, color: "#8b5cf6" },
  { tactic: "Persistence", techniques: 19, covered: 14, detected: 12, color: "#06b6d4" },
  { tactic: "Privilege Escalation", techniques: 13, covered: 11, detected: 10, color: "#10b981" },
  { tactic: "Defense Evasion", techniques: 42, covered: 29, detected: 24, color: "#f59e0b" },
  { tactic: "Credential Access", techniques: 17, covered: 13, detected: 11, color: "#ef4444" },
  { tactic: "Discovery", techniques: 31, covered: 18, detected: 14, color: "#f97316" },
  { tactic: "Lateral Movement", techniques: 9, covered: 8, detected: 7, color: "#ec4899" },
  { tactic: "Collection", techniques: 17, covered: 11, detected: 9, color: "#14b8a6" },
  { tactic: "Exfiltration", techniques: 9, covered: 7, detected: 6, color: "#6366f1" },
  { tactic: "Command & Control", techniques: 16, covered: 12, detected: 10, color: "#84cc16" },
  { tactic: "Impact", techniques: 13, covered: 9, detected: 7, color: "#f43f5e" },
];

const sevColors: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const zoneStyles: Record<string, string> = {
  secured: "text-emerald-400",
  elevated: "text-amber-400",
  alert: "text-red-400",
  monitoring: "text-blue-400",
};

export default function SentinelDashboard() {
  const { data: mitreCoverageData } = useQuery({
    queryKey: ["mitre-coverage"],
    queryFn: () => api.mitre.coverage(),
    staleTime: 300_000,
    retry: false,
  });

  const { data: threatSummaryData } = useQuery({
    queryKey: ["threat-summary"],
    queryFn: () => api.liveData.threatSummary(),
    staleTime: 30_000,
    retry: false,
  });

  const mitreCoverage = mitreCoverageData?.data?.coverage ?? MITRE_COVERAGE;
  const aptCampaign = threatSummaryData?.data?.aptCampaign;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Sentinel Watch
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Cross-layer threat detection · MITRE ATT&CK coverage · Real-time correlation</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px] text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20">
            <Radio className="w-3 h-3 animate-pulse" /> 3 CRITICAL ACTIVE
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
            <Radio className="w-3 h-3 animate-pulse text-emerald-400" /> SENTINEL ACTIVE
          </div>
        </div>
      </div>

      {/* Operation Darkwing Banner */}
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 flex items-center gap-3">
        <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse shrink-0" />
        <span className="text-xs font-bold text-red-300">SENTINEL ALERT — Operation Darkwing (APT29):</span>
        <span className="text-[10px] text-muted-foreground flex-1 min-w-0">Phase 3 lateral movement active · WORKSTATION-142 compromised · DC-PROD-03 targeted</span>
        <div className="flex items-center gap-1 text-[10px] text-red-400 shrink-0">
          <ChevronRight className="w-3 h-3" /> Respond
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {monitoringZones.map((zone) => (
          <div key={zone.zone} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">{zone.zone}</span>
              <span className={`w-2 h-2 rounded-full ${zone.threatLevel === "high" ? "bg-red-400 animate-pulse" : zone.threatLevel === "medium" ? "bg-amber-400" : "bg-emerald-400"}`} />
            </div>
            <div className={`text-sm font-semibold capitalize ${zoneStyles[zone.status]}`}>{zone.status}</div>
            <div className="text-[10px] text-muted-foreground mt-1">{zone.devices} devices · {zone.events.toLocaleString()} events</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" /> Sentinel Alerts
            </h2>
            <span className="text-xs text-muted-foreground">{sentinelAlerts.length} active</span>
          </div>
          <div className="divide-y divide-border">
            {sentinelAlerts.map((alert) => (
              <div key={alert.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${sevColors[alert.severity]}`}>{alert.severity}</span>
                    <span className="font-mono text-xs text-muted-foreground">{alert.id}</span>
                    <span className="text-xs text-muted-foreground">· {alert.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{alert.confidence}%</span>
                    <span className={`text-xs font-mono ${alert.time === "LIVE" ? "text-red-400 animate-pulse" : "text-muted-foreground"}`}>{alert.time}</span>
                  </div>
                </div>
                <p className="text-xs">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-400" /> Intel Feeds
              </h2>
            </div>
            <div className="divide-y divide-border">
              {threatFeeds.map((feed) => (
                <div key={feed.source} className="p-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium">{feed.source}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${sevColors[feed.severity]}`}>{feed.severity}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">{feed.threats.toLocaleString()} indicators · {feed.lastUpdate}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MITRE ATT&CK Coverage */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-violet-400" /> MITRE ATT&CK Detection Coverage — Enterprise v14
          </h2>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500/60 inline-block" /> Covered</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500/60 inline-block" /> Detected in Wild</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {mitreCoverage.map((tactic: any) => {
            const coveragePct = Math.round((tactic.covered / tactic.techniques) * 100);
            const detectionPct = Math.round((tactic.detected / tactic.techniques) * 100);
            return (
              <div key={tactic.tactic} className="p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-white/70">{tactic.tactic}</span>
                  <span className="text-[9px] font-mono" style={{ color: tactic.color }}>{coveragePct}%</span>
                </div>
                <div className="space-y-1">
                  <div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-0.5">
                      <div className="h-full rounded-full" style={{ width: `${coveragePct}%`, background: tactic.color, opacity: 0.7 }} />
                    </div>
                  </div>
                  <div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${detectionPct}%`, opacity: 0.6 }} />
                    </div>
                  </div>
                </div>
                <div className="flex justify-between text-[8px] text-white/25 mt-1.5">
                  <span>{tactic.covered}/{tactic.techniques} covered</span>
                  <span>{tactic.detected} detected</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10 text-center">
            <p className="text-lg font-bold text-violet-400">{Math.round(mitreCoverage.reduce((a: any, t: any) => a + (t.covered / t.techniques), 0) / mitreCoverage.length * 100)}%</p>
            <p className="text-[9px] text-muted-foreground">Overall Coverage</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-center">
            <p className="text-lg font-bold text-emerald-400">{mitreCoverage.reduce((a: any, t: any) => a + t.covered, 0)}</p>
            <p className="text-[9px] text-muted-foreground">Techniques Covered</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-center">
            <p className="text-lg font-bold text-amber-400">{mitreCoverage.reduce((a: any, t: any) => a + t.techniques, 0) - mitreCoverage.reduce((a: any, t: any) => a + t.covered, 0)}</p>
            <p className="text-[9px] text-muted-foreground">Coverage Gaps</p>
          </div>
        </div>
      </div>
    </div>
  );
}
