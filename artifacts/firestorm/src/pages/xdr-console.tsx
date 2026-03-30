import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Monitor, Wifi, Cloud, Users, Server, AlertTriangle, Activity, Shield, Layers, Eye } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const telemetryStreams = [
  { name: "Endpoint", icon: Monitor, events24h: 842341, alerts: 34, critical: 5, color: "#3b82f6" },
  { name: "Network", icon: Wifi, events24h: 2341892, alerts: 18, critical: 2, color: "#06b6d4" },
  { name: "Identity", icon: Users, events24h: 124567, alerts: 12, critical: 3, color: "#8b5cf6" },
  { name: "Cloud", icon: Cloud, events24h: 563421, alerts: 9, critical: 1, color: "#22c55e" },
];

const correlatedAlerts = [
  { id: "XDR-001", title: "Lateral Movement Campaign — Multi-Source Correlated", severity: "Critical", sources: ["Endpoint", "Network", "Identity"], confidence: 97, entities: ["WORKSTATION-142", "DC-PROD-03", "user.jsmith"], timeline: "Started 2h 14m ago", status: "Active" },
  { id: "XDR-002", title: "Credential Compromise with Cloud Escalation", severity: "Critical", sources: ["Identity", "Cloud"], confidence: 94, entities: ["user.mrodriguez", "Azure AD", "S3-prod-backup"], timeline: "Started 4h 32m ago", status: "Investigating" },
  { id: "XDR-003", title: "C2 Beaconing — DNS + TLS Fingerprint Match", severity: "High", sources: ["Network", "Endpoint"], confidence: 88, entities: ["192.168.10.45", "LAPTOP-778", "apt29.c2.domain"], timeline: "Started 6h 01m ago", status: "Investigating" },
  { id: "XDR-004", title: "Ransomware Pre-Stage — Staging + Exfil", severity: "High", sources: ["Endpoint", "Network"], confidence: 82, entities: ["FILE-SHARE-01", "BACKUP-SRV-02"], timeline: "Started 11h ago", status: "Contained" },
];

const entityRisk = [
  { entity: "WORKSTATION-142", type: "Endpoint", risk: 94, events: 2347, status: "Compromised" },
  { entity: "user.jsmith", type: "Identity", risk: 89, events: 543, status: "Anomalous" },
  { entity: "DC-PROD-03", type: "Server", risk: 81, events: 8912, status: "Under Review" },
  { entity: "192.168.10.45", type: "IP", risk: 76, events: 12341, status: "Suspicious" },
  { entity: "user.mrodriguez", type: "Identity", risk: 71, events: 321, status: "Anomalous" },
];

const timelineData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  endpoint: Math.floor(Math.random() * 50 + 10),
  network: Math.floor(Math.random() * 80 + 20),
  identity: Math.floor(Math.random() * 30 + 5),
  cloud: Math.floor(Math.random() * 20 + 3),
}));

const sevColor: Record<string, string> = {
  Critical: "bg-red-500/10 text-red-400 border-red-500/20",
  High: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export default function XDRConsole() {
  const [selected, setSelected] = useState(correlatedAlerts[0]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Layers className="w-6 h-6 text-primary" />
          Unified XDR Console
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Correlate endpoint, network, identity, and cloud telemetry in a single pane — powered by AI-driven behavioral analytics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {telemetryStreams.map((stream) => {
          const Icon = stream.icon;
          return (
            <Card key={stream.name}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color: stream.color }} />
                    <span className="text-sm font-semibold">{stream.name}</span>
                  </div>
                  <span className="text-xs text-red-400 font-bold">{stream.critical} critical</span>
                </div>
                <p className="text-xl font-bold">{stream.events24h.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">events/24h · {stream.alerts} alerts</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Cross-Source Alert Timeline (24h)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={3} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="endpoint" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} stackId="a" />
                  <Area type="monotone" dataKey="network" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.15} stackId="a" />
                  <Area type="monotone" dataKey="identity" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} stackId="a" />
                  <Area type="monotone" dataKey="cloud" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} stackId="a" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Correlated Alerts — Multi-Source</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {correlatedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => setSelected(alert)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${selected.id === alert.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold truncate">{alert.title}</span>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${sevColor[alert.severity]}`}>{alert.severity}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {alert.sources.map(s => (
                          <span key={s} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{s}</span>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{alert.timeline}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-primary">{alert.confidence}%</p>
                      <p className="text-[10px] text-muted-foreground">confidence</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Entity Risk Scores</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {entityRisk.map((e) => (
                <div key={e.entity} className="p-2.5 rounded-lg bg-muted/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold">{e.entity}</p>
                      <p className="text-[10px] text-muted-foreground">{e.type} · {e.events.toLocaleString()} events</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${e.risk >= 85 ? "text-red-400" : e.risk >= 70 ? "text-orange-400" : "text-amber-400"}`}>{e.risk}</p>
                      <p className={`text-[10px] ${e.status === "Compromised" ? "text-red-400" : e.status === "Anomalous" ? "text-amber-400" : "text-sky-400"}`}>{e.status}</p>
                    </div>
                  </div>
                  <div className="mt-1.5 h-1 bg-background rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${e.risk >= 85 ? "bg-red-500" : e.risk >= 70 ? "bg-orange-500" : "bg-amber-500"}`} style={{ width: `${e.risk}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Alert Detail — {selected.id}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs font-semibold">{selected.title}</p>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Affected Entities</p>
                {selected.entities.map(e => (
                  <div key={e} className="flex items-center gap-1.5 text-xs py-0.5">
                    <Eye className="w-3 h-3 text-primary" />{e}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-1 rounded border ${selected.status === "Active" ? "bg-red-500/10 text-red-400 border-red-500/20" : selected.status === "Contained" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>{selected.status}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
