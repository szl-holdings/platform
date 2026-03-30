import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Wifi, WifiOff, CheckCircle, AlertTriangle, RefreshCw, Activity, Clock, Zap, type LucideIcon } from "lucide-react";

const connectors = [
  { id: "CONN-001", app: "Vessels", name: "AIS Stream — MarineTraffic", type: "REST/WebSocket", status: "Live", latency: "84ms", uptime: 99.97, lastSync: "2 sec ago", errorRate: 0.01, rps: 1240 },
  { id: "CONN-002", app: "Vessels", name: "Sanctions DB — OFAC", type: "REST API", status: "Live", latency: "210ms", uptime: 99.9, lastSync: "5 min ago", errorRate: 0.0, rps: 12 },
  { id: "CONN-003", app: "Firestorm", name: "Threat Intel — VirusTotal", type: "REST API", status: "Degraded", latency: "1840ms", uptime: 97.2, lastSync: "3 min ago", errorRate: 4.2, rps: 45 },
  { id: "CONN-004", app: "Firestorm", name: "SIEM — Splunk", type: "Webhook", status: "Live", latency: "42ms", uptime: 99.99, lastSync: "1 sec ago", errorRate: 0.0, rps: 8400 },
  { id: "CONN-005", app: "Lyte", name: "Metrics — DataDog", type: "REST API", status: "Live", latency: "120ms", uptime: 99.95, lastSync: "10 sec ago", errorRate: 0.1, rps: 890 },
  { id: "CONN-006", app: "Terra", name: "Property Data — CoStar", type: "REST API", status: "Demo Mode", latency: "—", uptime: null, lastSync: "N/A (simulated)", errorRate: null, rps: null },
  { id: "CONN-007", app: "MSP", name: "PSA — ConnectWise", type: "REST API", status: "Live", latency: "340ms", uptime: 99.7, lastSync: "30 sec ago", errorRate: 0.3, rps: 28 },
  { id: "CONN-008", app: "INCA", name: "W&B Experiment Tracking", type: "REST API", status: "Live", latency: "190ms", uptime: 99.8, lastSync: "1 min ago", errorRate: 0.2, rps: 180 },
];

const statusConfig: Record<string, { color: string; icon: LucideIcon; badge: string }> = {
  Live: { color: "text-emerald-400", icon: CheckCircle, badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  Degraded: { color: "text-red-400", icon: AlertTriangle, badge: "text-red-400 bg-red-500/10 border-red-500/20" },
  "Demo Mode": { color: "text-amber-400", icon: Activity, badge: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
};

export default function ConnectorHealth() {
  const live = connectors.filter(c => c.status === "Live").length;
  const degraded = connectors.filter(c => c.status === "Degraded").length;
  const demo = connectors.filter(c => c.status === "Demo Mode").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wifi className="w-6 h-6 text-primary" />
          Connector Health Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time integration status across all SZL ecosystem applications — latency, error rates, and sync status</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Live Connectors", value: live, color: "text-emerald-400" },
          { label: "Degraded", value: degraded, color: "text-red-400" },
          { label: "Demo Mode", value: demo, color: "text-amber-400" },
          { label: "Total Connectors", value: connectors.length, color: "text-primary" },
        ].map(({ label, value, color }) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-2xl font-bold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <div className="space-y-3">
        {connectors.map((conn) => {
          const cfg = statusConfig[conn.status];
          const Icon = cfg.icon;
          return (
            <Card key={conn.id} className={conn.status === "Degraded" ? "border-red-500/30" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Icon className={`w-5 h-5 ${cfg.color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{conn.name}</span>
                      <Badge variant="outline" className="text-[10px]">{conn.app}</Badge>
                      <Badge variant="outline" className="text-[10px]">{conn.type}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${cfg.badge}`}>{conn.status}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-1.5 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Latency: <span className={conn.status === "Degraded" ? "text-red-400 font-bold" : "text-foreground"}>{conn.latency}</span></span>
                      {conn.uptime && <span>Uptime: <span className={conn.uptime >= 99.9 ? "text-emerald-400" : conn.uptime >= 99 ? "text-amber-400" : "text-red-400"}>{conn.uptime}%</span></span>}
                      {conn.errorRate !== null && <span>Error Rate: <span className={conn.errorRate >= 2 ? "text-red-400 font-bold" : conn.errorRate >= 0.5 ? "text-amber-400" : "text-emerald-400"}>{conn.errorRate}%</span></span>}
                      {conn.rps !== null && <span>RPS: <span className="text-foreground">{conn.rps.toLocaleString()}</span></span>}
                      <span>Last sync: {conn.lastSync}</span>
                    </div>
                  </div>
                  <button className="text-[10px] px-2 py-1.5 bg-muted border border-border rounded hover:bg-muted/80 transition-colors flex items-center gap-1 shrink-0">
                    <RefreshCw className="w-3 h-3" /> Test
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
