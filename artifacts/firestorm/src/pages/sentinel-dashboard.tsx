import { Shield, AlertTriangle, Eye, Clock, Activity, Target, Radio, Wifi, Lock, Zap } from "lucide-react";

const threatFeeds = [
  { source: "MITRE ATT&CK", threats: 142, severity: "high", lastUpdate: "2m ago", status: "active" },
  { source: "VirusTotal", threats: 89, severity: "medium", lastUpdate: "5m ago", status: "active" },
  { source: "AlienVault OTX", threats: 67, severity: "high", lastUpdate: "1m ago", status: "active" },
  { source: "Threat Grid", threats: 34, severity: "critical", lastUpdate: "30s ago", status: "active" },
  { source: "Abuse.ch", threats: 218, severity: "medium", lastUpdate: "3m ago", status: "active" },
];

const sentinelAlerts = [
  { id: "SEN-0421", type: "Intrusion Detection", message: "Suspicious lateral movement detected in subnet 10.0.2.x", severity: "critical", time: "1m ago", confidence: 94 },
  { id: "SEN-0420", type: "Malware Detection", message: "Known ransomware signature matched on endpoint WS-042", severity: "critical", time: "4m ago", confidence: 98 },
  { id: "SEN-0419", type: "Data Exfiltration", message: "Unusual outbound data transfer — 2.4GB to unknown IP", severity: "high", time: "12m ago", confidence: 87 },
  { id: "SEN-0418", type: "Brute Force", message: "Failed login attempts exceeding threshold on AD controller", severity: "medium", time: "18m ago", confidence: 92 },
  { id: "SEN-0417", type: "Policy Violation", message: "Unauthorized USB device connected to secure workstation", severity: "low", time: "25m ago", confidence: 100 },
];

const monitoringZones = [
  { zone: "Perimeter", status: "secured", devices: 24, events: 1420, threatLevel: "low" },
  { zone: "DMZ", status: "elevated", devices: 12, events: 892, threatLevel: "medium" },
  { zone: "Internal Network", status: "alert", devices: 156, events: 3240, threatLevel: "high" },
  { zone: "Cloud Services", status: "secured", devices: 38, events: 567, threatLevel: "low" },
  { zone: "Endpoints", status: "monitoring", devices: 284, events: 8910, threatLevel: "medium" },
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
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" /> Sentinel Threat Watch
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time threat detection and continuous monitoring</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-medium">SENTINEL ACTIVE</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" /> Sentinel Alerts
            </h2>
            <span className="text-xs text-muted-foreground">{sentinelAlerts.length} active</span>
          </div>
          <div className="divide-y divide-border">
            {sentinelAlerts.map((alert) => (
              <div key={alert.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${sevColors[alert.severity]}`}>{alert.severity}</span>
                    <span className="font-mono text-xs text-muted-foreground">{alert.id}</span>
                    <span className="text-xs text-muted-foreground">· {alert.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{alert.confidence}% confidence</span>
                    <span className="text-xs text-muted-foreground">{alert.time}</span>
                  </div>
                </div>
                <p className="text-sm">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border">
            <h2 className="font-display font-semibold flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400" /> Threat Intel Feeds
            </h2>
          </div>
          <div className="divide-y divide-border">
            {threatFeeds.map((feed) => (
              <div key={feed.source} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{feed.source}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${sevColors[feed.severity]}`}>{feed.severity}</span>
                </div>
                <div className="text-xs text-muted-foreground">{feed.threats} indicators · Updated {feed.lastUpdate}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
