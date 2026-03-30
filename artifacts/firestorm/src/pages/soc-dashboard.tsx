import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Shield, AlertTriangle, Activity, Clock, Crosshair, Flame, Target, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type ActivityItem = { type: string; title: string; severity: string; timestamp: string };

const demoData = {
  activeIncidents: 7,
  openAlerts: 34,
  mttd: 4.2,
  mttr: 18,
  totalIncidents: 142,
  totalAlerts: 1847,
  openFindings: 23,
  criticalFindings: 5,
  alertsBySeverity: { critical: 8, high: 14, medium: 7, low: 5 },
  analystWorkload: { "J. Chen": 3, "M. Rodriguez": 2, "S. Park": 4, "K. Wilson": 1, "A. Thompson": 2 },
  recentActivity: [
    { type: "incident", title: "Lateral movement detected on DC-PROD-03", severity: "critical", timestamp: new Date(Date.now() - 120000).toISOString() },
    { type: "alert", title: "Brute force attempt — 847 failed logins from 103.45.x.x", severity: "critical", timestamp: new Date(Date.now() - 300000).toISOString() },
    { type: "alert", title: "Suspicious PowerShell execution on WORKSTATION-142", severity: "high", timestamp: new Date(Date.now() - 600000).toISOString() },
    { type: "incident", title: "C2 beacon traffic to known APT29 infrastructure", severity: "critical", timestamp: new Date(Date.now() - 900000).toISOString() },
    { type: "finding", title: "Unpatched CVE-2024-3400 on Palo Alto FW-EDGE-01", severity: "high", timestamp: new Date(Date.now() - 1200000).toISOString() },
    { type: "alert", title: "Data exfiltration pattern: 2.3GB to external S3 bucket", severity: "high", timestamp: new Date(Date.now() - 1500000).toISOString() },
    { type: "alert", title: "Azure AD impossible travel — user jsmith from US/Russia", severity: "medium", timestamp: new Date(Date.now() - 1800000).toISOString() },
    { type: "finding", title: "Exposed RDP on 3 production servers", severity: "medium", timestamp: new Date(Date.now() - 2100000).toISOString() },
  ],
};

const mttdTrend = [
  { time: "00:00", value: 5.1 }, { time: "04:00", value: 4.8 }, { time: "08:00", value: 3.9 },
  { time: "12:00", value: 4.5 }, { time: "16:00", value: 4.2 }, { time: "20:00", value: 3.7 }, { time: "Now", value: 4.2 },
];

const mitreData: Record<string, Record<string, number>> = {
  "Initial Access": { "Phishing": 14, "Valid Accounts": 8, "Exploit Public App": 5 },
  "Execution": { "PowerShell": 22, "Command Shell": 11, "Scripting": 9 },
  "Persistence": { "Registry Run Keys": 6, "Scheduled Task": 4, "Web Shell": 3 },
  "Privilege Esc.": { "Token Manipulation": 7, "Exploitation": 5, "Bypass UAC": 3 },
  "Defense Evasion": { "Obfuscation": 18, "Masquerading": 12, "Process Injection": 8 },
  "Credential Access": { "Brute Force": 15, "Credential Dump": 9, "Keylogging": 4 },
  "Discovery": { "Network Scan": 20, "Account Discovery": 13, "System Info": 11 },
  "Lateral Movement": { "Remote Services": 8, "Pass the Hash": 5, "RDP": 6 },
  "Collection": { "Data Staged": 7, "Screen Capture": 3, "Email Collect.": 4 },
  "C2": { "Web Protocols": 12, "Encrypted Chan.": 9, "DNS": 6 },
  "Exfiltration": { "Over C2": 5, "To Cloud": 4, "Over Web": 3 },
  "Impact": { "Data Encryption": 3, "Service Stop": 2, "Defacement": 1 },
};

type SOCData = typeof demoData;

function AnimatedCounter({ value, duration = 1200, decimals = 0 }: { value: number; duration?: number; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    if (Math.abs(diff) < 0.01) return;
    let cancelled = false;
    const startTime = performance.now();
    const step = (now: number) => {
      if (cancelled) return;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + diff * eased);
      if (progress < 1) requestAnimationFrame(step);
      else ref.current = value;
    };
    requestAnimationFrame(step);
    return () => { cancelled = true; };
  }, [value, duration]);
  return <>{decimals > 0 ? display.toFixed(decimals) : Math.round(display)}</>;
}

function MitreHeatMap() {
  const maxCount = Math.max(...Object.values(mitreData).flatMap(t => Object.values(t)));

  const getHeatStyle = (count: number): { bg: string; text: string } => {
    const ratio = count / maxCount;
    if (ratio >= 0.8) return { bg: "rgba(239,68,68,0.85)", text: "text-white" };
    if (ratio >= 0.6) return { bg: "rgba(239,68,68,0.55)", text: "text-white" };
    if (ratio >= 0.4) return { bg: "rgba(249,115,22,0.45)", text: "text-orange-100" };
    if (ratio >= 0.2) return { bg: "rgba(234,179,8,0.35)", text: "text-amber-100" };
    return { bg: "rgba(234,179,8,0.12)", text: "text-amber-400/80" };
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Target className="w-4 h-4 text-red-400" />
          <span className="font-display font-semibold text-sm text-foreground">MITRE ATT&CK Coverage Map</span>
          <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20 ml-1">30-Day Activity</Badge>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm inline-block" style={{ backgroundColor: "rgba(239,68,68,0.85)" }} />High Activity</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm inline-block" style={{ backgroundColor: "rgba(234,179,8,0.35)" }} />Low Activity</span>
        </div>
      </div>
      <div className="p-4 overflow-x-auto">
        <div className="grid grid-cols-12 gap-1 min-w-[900px]">
          {Object.entries(mitreData).map(([tactic, techniques]) => (
            <div key={tactic} className="space-y-1">
              <div className="text-[9px] font-mono text-red-400/70 uppercase tracking-wide text-center py-1 px-1 truncate" title={tactic}>{tactic}</div>
              {Object.entries(techniques).map(([tech, count]) => {
                const { bg, text } = getHeatStyle(count);
                return (
                  <div
                    key={tech}
                    className={`rounded-md px-1 py-2 text-center cursor-default transition-all hover:scale-105 hover:z-10 relative`}
                    style={{ backgroundColor: bg }}
                    title={`${tactic} › ${tech}: ${count} detections`}
                  >
                    <div className={`text-[8px] leading-tight truncate font-medium ${text}`}>{tech}</div>
                    <div className={`text-[11px] font-bold font-mono mt-0.5 ${text}`}>{count}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const severityDot: Record<string, string> = {
  critical: "bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.6)] animate-pulse",
  high: "bg-orange-400",
  medium: "bg-amber-400",
  low: "bg-blue-400",
};

const typeLabel: Record<string, string> = {
  incident: "bg-red-500/10 text-red-400 border-red-500/20",
  alert: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  finding: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export default function SOCDashboard() {
  const { data: apiData } = useQuery<SOCData>({
    queryKey: ["soc-dashboard"],
    queryFn: api.socDashboard.get as () => Promise<SOCData>,
    refetchInterval: 30000,
  });

  const data: SOCData = useMemo(() => {
    if (apiData && typeof apiData.activeIncidents === "number") return apiData;
    return demoData;
  }, [apiData]);

  const posturScore = Math.round(
    (98 * 0.25) + (94 * 0.25) + (87 * 0.25) + (99 * 0.25)
  );

  return (
    <div className="p-5 space-y-5 max-w-[1600px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg font-bold flex items-center gap-2">
            <Flame className="w-4.5 h-4.5 text-red-400" />
            Security Operations Center
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time threat detection and response</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
            SOC Active
          </Badge>
          <span className="text-[10px] font-mono text-muted-foreground">UTC {new Date().toISOString().slice(11, 19)}</span>
        </div>
      </div>

      {/* Threat Posture Banner — replaces 4 stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`bg-card border rounded-xl p-5 flex items-center gap-4 ${data.activeIncidents > 0 ? "border-red-500/30 ring-1 ring-red-500/10" : "border-border"}`}>
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 animate-pulse">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Active Incidents</p>
            <p className="text-4xl font-bold font-display mt-0.5 text-red-400"><AnimatedCounter value={data.activeIncidents} /></p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{data.totalIncidents} this quarter</p>
          </div>
        </div>

        <div className="col-span-1 bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Open Alerts</p>
            <p className="text-4xl font-bold font-display mt-0.5 text-amber-400"><AnimatedCounter value={data.openAlerts} /></p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{data.totalAlerts.toLocaleString()} processed</p>
          </div>
        </div>

        {/* Threat Posture Score — replaces MTTD / MTTR cards */}
        <div className="col-span-1 bg-card border border-border rounded-xl p-5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-3">Threat Posture</p>
          <div className="flex items-end gap-3 mb-3">
            <span className="text-4xl font-bold font-display text-emerald-400">{posturScore}%</span>
            <div className="pb-1 flex items-center gap-1 text-[11px] text-emerald-400">
              <TrendingUp className="w-3 h-3" /> +3% vs last week
            </div>
          </div>
          <div className="space-y-1.5">
            {[
              { label: "Endpoint Coverage", value: 98, color: "bg-emerald-400" },
              { label: "Patch Compliance", value: 94, color: "bg-emerald-400" },
              { label: "MFA Adoption", value: 87, color: "bg-amber-400" },
              { label: "EDR Health", value: 99, color: "bg-emerald-400" },
            ].map(m => (
              <div key={m.label} className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground w-28 shrink-0 font-mono">{m.label}</span>
                <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${m.color}`} style={{ width: `${m.value}%` }} />
                </div>
                <span className="text-[9px] font-mono text-foreground w-8 text-right">{m.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detection Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "MTTD", value: data.mttd, unit: "min", color: "text-primary", icon: Crosshair, trend: "12% faster", positive: true },
          { label: "MTTR", value: data.mttr, unit: "min", color: "text-emerald-400", icon: Zap, trend: "8% faster", positive: true },
          { label: "Open Findings", value: data.openFindings, unit: "", color: "text-blue-400", icon: Target, trend: `${data.criticalFindings} critical`, positive: false },
          { label: "Alerts Processed", value: data.totalAlerts, unit: "", color: "text-muted-foreground", icon: Activity, trend: "this month", positive: true },
        ].map(item => (
          <Card key={item.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">{item.label}</p>
                <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
              </div>
              <p className={`text-2xl font-bold font-display ${item.color}`}>
                <AnimatedCounter value={item.value} decimals={item.label === "MTTD" ? 1 : 0} />
                {item.unit && <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>}
              </p>
              <p className={`text-[10px] mt-1 flex items-center gap-1 ${item.positive ? "text-emerald-400/60" : "text-red-400/60"}`}>
                {item.positive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                {item.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MITRE Heatmap — the visual showpiece */}
      <MitreHeatMap />

      {/* Threat Timeline + MTTD Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-400 animate-pulse" />
              Threat Timeline
              <Badge variant="outline" className="ml-auto text-[10px] bg-red-500/10 text-red-400 border-red-500/20">Live</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {(data.recentActivity || [] as ActivityItem[]).map((item: ActivityItem, i: number) => (
                <div key={i} className="flex gap-3 group">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full shrink-0 mt-2 ${severityDot[item.severity] || "bg-gray-400"}`} />
                    {i < (data.recentActivity?.length || 0) - 1 && <div className="w-px flex-1 bg-border/50 my-1" />}
                  </div>
                  <div className="pb-3.5 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <Badge variant="outline" className={`text-[9px] ${typeLabel[item.type] || ""}`}>{item.type}</Badge>
                          <Badge variant="outline" className={`text-[9px] ${
                            item.severity === "critical" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            item.severity === "high" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                            "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}>{item.severity}</Badge>
                        </div>
                        <p className="text-xs text-foreground leading-snug">{item.title}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-sm flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-primary" />
              Detection Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mttdTrend}>
                  <defs>
                    <linearGradient id="mttdGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} domain={[0, 8]} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e1e2e', borderColor: '#333', borderRadius: '8px', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} fill="url(#mttdGrad)" name="MTTD (min)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2.5 border-t border-border pt-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Alert Distribution</p>
              {Object.entries(data.alertsBySeverity || {}).map(([sev, count]) => {
                const total = Object.values(data.alertsBySeverity || {}).reduce((a, b) => a + (b as number), 0);
                const pct = Math.round(((count as number) / total) * 100);
                const color = sev === "critical" ? "bg-red-400" : sev === "high" ? "bg-orange-400" : sev === "medium" ? "bg-amber-400" : "bg-blue-400";
                const textColor = sev === "critical" ? "text-red-400" : sev === "high" ? "text-orange-400" : sev === "medium" ? "text-amber-400" : "text-blue-400";
                return (
                  <div key={sev} className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono capitalize w-14 shrink-0 ${textColor}`}>{sev}</span>
                    <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-foreground w-6 text-right">{count as number}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
