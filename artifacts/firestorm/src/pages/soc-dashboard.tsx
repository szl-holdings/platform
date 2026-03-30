import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Shield, AlertTriangle, Activity, Clock, Users, Bell, Zap, TrendingUp, Crosshair, Flame, Eye, Target } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";

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
    { type: "incident", title: "Ransomware signature detected in email attachment", severity: "critical", timestamp: new Date(Date.now() - 2400000).toISOString() },
    { type: "alert", title: "DNS tunneling detected — encoded queries to suspect domain", severity: "high", timestamp: new Date(Date.now() - 2700000).toISOString() },
  ],
};

const mttdTrend = [
  { time: "00:00", value: 5.1 }, { time: "04:00", value: 4.8 }, { time: "08:00", value: 3.9 },
  { time: "12:00", value: 4.5 }, { time: "16:00", value: 4.2 }, { time: "20:00", value: 3.7 }, { time: "Now", value: 4.2 },
];
const mttrTrend = [
  { time: "00:00", value: 22 }, { time: "04:00", value: 19 }, { time: "08:00", value: 15 },
  { time: "12:00", value: 21 }, { time: "16:00", value: 17 }, { time: "20:00", value: 20 }, { time: "Now", value: 18 },
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
  "Collection": { "Data Staged": 7, "Screen Capture": 3, "Email Collection": 4 },
  "C2": { "Web Protocols": 12, "Encrypted Channel": 9, "DNS": 6 },
  "Exfiltration": { "Over C2": 5, "To Cloud": 4, "Over Web": 3 },
  "Impact": { "Data Encryption": 3, "Service Stop": 2, "Defacement": 1 },
};

const severityColors: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#3b82f6",
};

const typeColors: Record<string, string> = {
  incident: "bg-red-500/10 text-red-400 border-red-500/20",
  alert: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  finding: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

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
  const getColor = (count: number) => {
    if (count >= 15) return "bg-red-500/80 text-white";
    if (count >= 10) return "bg-orange-500/60 text-white";
    if (count >= 5) return "bg-amber-500/40 text-amber-100";
    return "bg-amber-500/15 text-amber-300/70";
  };

  return (
    <Card className="bg-card border-border col-span-full">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-sm flex items-center gap-2">
          <Target className="w-4 h-4 text-red-400" />
          MITRE ATT&CK Heat Map
          <Badge variant="outline" className="ml-auto text-[10px] bg-red-500/10 text-red-400 border-red-500/20">Last 30 Days</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-12 gap-0.5 text-[9px]">
          {Object.entries(mitreData).map(([tactic, techniques]) => (
            <div key={tactic} className="space-y-0.5">
              <div className="text-[8px] font-mono text-red-400/60 uppercase tracking-wider text-center py-1 truncate" title={tactic}>{tactic}</div>
              {Object.entries(techniques).map(([tech, count]) => (
                <div key={tech} className={`rounded px-1 py-1.5 text-center font-mono ${getColor(count)} transition-colors hover:ring-1 hover:ring-red-400/30 cursor-default`} title={`${tactic} > ${tech}: ${count} events`}>
                  <div className="truncate">{tech}</div>
                  <div className="font-bold text-[10px]">{count}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

type SOCData = typeof demoData;

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

  const donutData = Object.entries(data.alertsBySeverity || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: value as number,
    color: severityColors[name] || "#666",
  }));

  const totalAlertsBySev = donutData.reduce((s, d) => s + d.value, 0);

  const analystData = Object.entries(data.analystWorkload || {}).map(([name, count]) => ({
    name: name.split(" ").map(n => n[0]).join(""),
    fullName: name,
    incidents: count as number,
  }));

  return (
    <div className="p-5 space-y-5 max-w-[1600px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-400" />
            Security Operations Center
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time threat detection and response</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
            SOC Active
          </Badge>
          <span className="text-[10px] font-mono text-muted-foreground">UTC {new Date().toISOString().slice(11, 19)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`bg-card border-border hover:border-red-500/30 transition-all group ${data.activeIncidents > 0 ? "ring-1 ring-red-500/20" : ""}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Active Incidents</p>
                <p className="text-3xl font-bold font-display mt-1 text-red-400"><AnimatedCounter value={data.activeIncidents} /></p>
                <p className="text-[10px] text-red-400/50 mt-0.5">{data.totalIncidents} total this quarter</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-amber-500/30 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Open Alerts</p>
                <p className="text-3xl font-bold font-display mt-1 text-amber-400"><AnimatedCounter value={data.openAlerts} /></p>
                <p className="text-[10px] text-amber-400/50 mt-0.5">{data.totalAlerts} processed this month</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-primary/30 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">MTTD</p>
                <p className="text-3xl font-bold font-display mt-1">
                  <AnimatedCounter value={data.mttd} decimals={1} /><span className="text-sm text-muted-foreground ml-1">min</span>
                </p>
                <p className="text-[10px] text-emerald-400/60 mt-0.5 flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5" />12% faster vs last week</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Crosshair className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-emerald-500/30 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">MTTR</p>
                <p className="text-3xl font-bold font-display mt-1">
                  <AnimatedCounter value={data.mttr} /><span className="text-sm text-muted-foreground ml-1">min</span>
                </p>
                <p className="text-[10px] text-emerald-400/60 mt-0.5 flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5" />8% faster vs last week</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-400" />Alert Severity
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-display font-bold">{totalAlertsBySev}</span>
                <span className="text-[9px] text-muted-foreground uppercase">Total</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
              {donutData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-[10px]">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="font-bold" style={{ color: d.color }}>{d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-sm flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-primary" />MTTD Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mttdTrend}>
                  <defs>
                    <linearGradient id="mttdGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
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
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />MTTR Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mttrTrend}>
                  <defs>
                    <linearGradient id="mttrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} domain={[0, 30]} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e1e2e', borderColor: '#333', borderRadius: '8px', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} fill="url(#mttrGrad)" name="MTTR (min)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />Analyst Workload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analystData} layout="vertical">
                  <XAxis type="number" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} width={30} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e1e2e', borderColor: '#333', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(val: number | string, _: string, props: { payload?: { fullName?: string } }) => [`${val} incidents`, props.payload?.fullName ?? ""]}
                  />
                  <Bar dataKey="incidents" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <MitreHeatMap />

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
            <div className="relative space-y-0">
              {(data.recentActivity || [] as ActivityItem[]).map((item: ActivityItem, i: number) => (
                <div key={i} className="flex gap-3 group">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${item.severity === "critical" ? "bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" : item.severity === "high" ? "bg-orange-400" : item.severity === "medium" ? "bg-amber-400" : "bg-blue-400"}`} />
                    {i < (data.recentActivity?.length || 0) - 1 && <div className="w-px flex-1 bg-border/50 my-1" />}
                  </div>
                  <div className="pb-4 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <Badge variant="outline" className={`text-[9px] ${typeColors[item.type] || ""}`}>{item.type}</Badge>
                          <Badge variant="outline" className={`text-[9px] ${item.severity === "critical" ? "bg-red-500/10 text-red-400 border-red-500/20" : item.severity === "high" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>{item.severity}</Badge>
                        </div>
                        <p className="text-sm text-foreground leading-snug">{item.title}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1 mt-1">
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
              <Eye className="w-4 h-4 text-primary" />Operational Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Total Incidents (Quarter)", value: data.totalIncidents, color: "text-red-400" },
              { label: "Alerts Processed (Month)", value: data.totalAlerts, color: "text-amber-400" },
              { label: "Open Findings", value: data.openFindings, color: "text-blue-400" },
              { label: "Critical Findings", value: data.criticalFindings, color: "text-red-400", highlight: data.criticalFindings > 0 },
            ].map(item => (
              <div key={item.label} className={`flex items-center justify-between p-3 rounded-lg border ${item.highlight ? "bg-red-500/5 border-red-500/20" : "bg-background/50 border-border"}`}>
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className={`text-lg font-bold font-display ${item.color}`}>{item.value.toLocaleString()}</span>
              </div>
            ))}
            <div className="pt-2 space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Security Posture</p>
              {[
                { label: "Endpoint Coverage", value: 98, color: "bg-emerald-400" },
                { label: "Patch Compliance", value: 94, color: "bg-emerald-400" },
                { label: "MFA Adoption", value: 87, color: "bg-amber-400" },
                { label: "EDR Health", value: 99, color: "bg-emerald-400" },
              ].map(m => (
                <div key={m.label} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-28 shrink-0">{m.label}</span>
                  <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${m.color}`} style={{ width: `${m.value}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-foreground w-8 text-right">{m.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
