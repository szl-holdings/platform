import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Shield, AlertTriangle, Activity, Clock, Crosshair, Flame, Target, TrendingUp, TrendingDown, Zap, Terminal, Search, BookOpen, Network, ChevronRight, Eye, Radio } from "lucide-react";
import { CommentThread, ActivityFeed } from "@workspace/shared-ui/collaboration";
import { useState, useEffect, useRef, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@workspace/shared-ui/utils";

type ActivityItem = { type: string; title: string; severity: string; timestamp: string };

const IS_DEMO = false;

const fallbackData = {
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

type SOCData = typeof fallbackData;

function SOCLiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="text-[10px] font-mono text-muted-foreground/50 tabular-nums">
      UTC {time.toISOString().slice(11, 19)}
    </div>
  );
}

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

function ResponseTimer() {
  const [elapsed, setElapsed] = useState({ detect: 0, investigate: 0, contain: 0 });
  const startRef = useRef(Date.now() - 142000);

  useEffect(() => {
    const interval = setInterval(() => {
      const ms = Date.now() - startRef.current;
      const seconds = Math.floor(ms / 1000);
      setElapsed({
        detect: Math.min(seconds, 60),
        investigate: Math.max(0, Math.min(seconds - 60, 600)),
        contain: Math.max(0, Math.min(seconds - 660, 3600)),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const total = Math.floor((Date.now() - startRef.current) / 1000);
  const mins = Math.floor(total / 60);
  const secs = total % 60;

  const phases = [
    { label: "Detect", target: "1 min", current: elapsed.detect, max: 60, met: elapsed.detect <= 60, color: "emerald" },
    { label: "Investigate", target: "10 min", current: elapsed.investigate, max: 600, met: elapsed.investigate <= 600, color: "amber" },
    { label: "Contain", target: "60 min", current: elapsed.contain, max: 3600, met: elapsed.contain <= 3600, color: "blue" },
  ];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-red-400" />
          <span className="font-display font-semibold text-sm text-foreground">1-10-60 Response Timer</span>
          <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20 ml-1">Active Incident</Badge>
        </div>
        <div className="font-mono text-2xl font-bold text-red-400">{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</div>
      </div>
      <div className="p-4 grid grid-cols-3 gap-4">
        {phases.map((p) => {
          const pct = Math.min((p.current / p.max) * 100, 100);
          const colorMap: Record<string, { bar: string; text: string; bg: string }> = {
            emerald: { bar: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-400/10" },
            amber: { bar: "bg-amber-400", text: "text-amber-400", bg: "bg-amber-400/10" },
            blue: { bar: "bg-blue-400", text: "text-blue-400", bg: "bg-blue-400/10" },
          };
          const c = colorMap[p.color];
          return (
            <div key={p.label} className={`rounded-lg p-3 border border-border/50 ${p.met ? "" : "border-red-500/20"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-mono font-bold ${c.text}`}>{p.label}</span>
                <span className="text-[10px] text-muted-foreground">Target: {p.target}</span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full transition-all ${p.met ? c.bar : "bg-red-400"}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground font-mono">{Math.floor(p.current / 60)}m {p.current % 60}s</span>
                <span className={p.met ? "text-emerald-400" : "text-red-400"}>{p.met ? "✓ On Track" : "⚠ Delayed"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const triageQueue = [
  { id: "INC-2847", title: "Lateral movement — DC-PROD-03", technique: "T1021.002", score: 96, priority: "P1", playbook: "Lateral Movement Response", status: "Assigned" },
  { id: "INC-2846", title: "C2 beacon to APT29 infra", technique: "T1071.001", score: 91, priority: "P1", playbook: "C2 Containment", status: "In Progress" },
  { id: "ALT-5821", title: "Data exfil pattern — S3", technique: "T1567.002", score: 84, priority: "P2", playbook: "Data Exfiltration", status: "Queued" },
  { id: "ALT-5820", title: "Brute force — admin portal", technique: "T1110.001", score: 71, priority: "P2", playbook: "Credential Attack", status: "Queued" },
];

function AIThreatTriage() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center gap-2">
        <Crosshair className="w-4 h-4 text-primary animate-pulse" />
        <span className="font-display font-semibold text-sm text-foreground">AI Threat Triage</span>
        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 ml-1">Auto-classified</Badge>
      </div>
      <div className="divide-y divide-border/50">
        {triageQueue.map((item) => (
          <div key={item.id} className="px-5 py-3 hover:bg-muted/10 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-muted-foreground">{item.id}</span>
                  <Badge variant="outline" className={`text-[9px] ${item.priority === "P1" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-orange-500/10 text-orange-400 border-orange-500/20"}`}>{item.priority}</Badge>
                  <Badge variant="outline" className="text-[9px] bg-muted/50 text-muted-foreground">{item.technique}</Badge>
                </div>
                <p className="text-xs text-foreground font-medium truncate">{item.title}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-bold font-mono text-red-400">{item.score}</div>
                <div className="text-[9px] text-muted-foreground">AI Score</div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <BookOpen className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{item.playbook}</span>
              <span className={`text-[10px] font-mono ml-auto ${item.status === "In Progress" ? "text-amber-400" : item.status === "Assigned" ? "text-blue-400" : "text-muted-foreground"}`}>{item.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const nlQueries = [
  "Show me all PowerShell executions from non-admin accounts in the last 24 hours",
  "Find lateral movement attempts targeting domain controllers",
  "List all connections to known C2 IPs from internal hosts",
];

function NLThreatHunting() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runQuery = async (q: string) => {
    setQuery(q);
    setLoading(true);
    setResult(null);
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    setResult(`Found 14 matching events across 6 hosts.\n\nTop matches:\n• WORKSTATION-142: powershell.exe -enc JABj... (14:23 UTC)\n• SERVER-PROD-07: powershell.exe -ExecutionPolicy Bypass... (13:47 UTC)\n• DC-PROD-03: powershell.exe -WindowStyle Hidden... (12:31 UTC)\n\nRisk: HIGH — 3 events match known T1059.001 pattern`);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center gap-2">
        <Search className="w-4 h-4 text-purple-400" />
        <span className="font-display font-semibold text-sm text-foreground">Natural Language Threat Hunt</span>
        <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20 ml-1">Purple AI</Badge>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <input
            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            placeholder="Describe what you're hunting for..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && query && runQuery(query)}
          />
          <button onClick={() => query && runQuery(query)} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
            Hunt
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {nlQueries.map(q => (
            <button key={q} onClick={() => runQuery(q)} className="text-[10px] px-2 py-1 rounded border border-border/50 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-colors bg-muted/20 truncate max-w-[200px]">
              {q.slice(0, 35)}...
            </button>
          ))}
        </div>
        {loading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="w-3 h-3 border border-primary/50 border-t-primary rounded-full animate-spin" />Hunting across 847K events...</div>}
        {result && !loading && (
          <div className="bg-background rounded-lg border border-border p-3">
            <pre className="text-[10px] text-foreground whitespace-pre-wrap font-mono leading-relaxed">{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

const blastRadiusNodes = [
  { id: "DC-PROD-03", type: "compromised", x: 50, y: 50, risk: 96 },
  { id: "FILE-SERVER-01", type: "at-risk", x: 20, y: 25, risk: 78 },
  { id: "DB-PROD-02", type: "at-risk", x: 80, y: 25, risk: 82 },
  { id: "WEB-APP-01", type: "at-risk", x: 15, y: 65, risk: 61 },
  { id: "BACKUP-SRV", type: "at-risk", x: 85, y: 65, risk: 54 },
  { id: "WORKSTATION-142", type: "origin", x: 50, y: 85, risk: 100 },
];

function BlastRadiusViz() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center gap-2">
        <Network className="w-4 h-4 text-red-400" />
        <span className="font-display font-semibold text-sm text-foreground">Blast Radius — Lateral Movement Paths</span>
        <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20 ml-1">INC-2847</Badge>
      </div>
      <div className="p-4">
        <div className="relative h-52 bg-background rounded-lg border border-border/50 overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Edges */}
            {[
              [50, 50, 20, 25], [50, 50, 80, 25], [50, 50, 15, 65],
              [50, 50, 85, 65], [50, 85, 50, 50],
            ].map(([x1, y1, x2, y2], i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(239,68,68,0.3)" strokeWidth="0.8" strokeDasharray="2 2">
                <animate attributeName="stroke-opacity" from="0.1" to="0.6" dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" direction="alternate" />
              </line>
            ))}
            {/* Nodes */}
            {blastRadiusNodes.map((node) => {
              const color = node.type === "origin" ? "#f59e0b" : node.type === "compromised" ? "#ef4444" : "#f97316";
              return (
                <g key={node.id}>
                  <circle cx={node.x} cy={node.y} r="4" fill={color} opacity="0.2">
                    {node.type !== "origin" && <animate attributeName="r" from="4" to="8" dur="2s" repeatCount="indefinite" />}
                    {node.type !== "origin" && <animate attributeName="opacity" from="0.2" to="0" dur="2s" repeatCount="indefinite" />}
                  </circle>
                  <circle cx={node.x} cy={node.y} r="3" fill={color} opacity="0.9" />
                  <text x={node.x} y={node.y - 5} textAnchor="middle" fontSize="3" fill="rgba(255,255,255,0.7)" fontFamily="monospace">{node.id.split("-")[0]}</text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />Origin</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />Compromised</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />At Risk</span>
          <span className="ml-auto font-mono">5 hosts at risk</span>
        </div>
      </div>
    </div>
  );
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
  const { data: apiData, isLoading } = useQuery<SOCData>({
    queryKey: ["soc-dashboard"],
    queryFn: api.socDashboard.get as () => Promise<SOCData>,
    refetchInterval: 30000,
  });

  const data: SOCData | null = useMemo(() => {
    if (apiData && typeof apiData.activeIncidents === "number") return apiData;
    return null;
  }, [apiData]);

  const posturScore = useMemo(() => {
    if (!data) return 0;
    const totalOpen = (data.openFindings ?? 0) + (data.criticalFindings ?? 0);
    const base = Math.max(40, 100 - Math.min(totalOpen, 60));
    return Math.round(base);
  }, [data]);

  const safeData = data ?? fallbackData;

  if (isLoading && !data) {
    return (
      <div className="p-5 flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-red-500/40 border-t-red-400 rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-mono">Loading SOC data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5 max-w-[1600px]">
      {IS_DEMO && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-medium bg-orange-500/8 border border-orange-500/15 text-orange-400/70">
          <Radio className="w-3 h-3 shrink-0 animate-pulse" />
          Simulation Environment — Incidents, alerts, and metrics shown are illustrative training data. No real threats are represented.
        </div>
      )}

      {/* Command Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-mono text-red-400/50 uppercase tracking-widest">Firestorm / SOC</span>
            <span className="text-red-500/20">·</span>
            <span className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest">Threat Operations</span>
          </div>
          <h1 className="font-display text-xl font-bold text-foreground flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-red-400 shrink-0" />
            Security Operations Center
          </h1>
          <p className="text-[11px] text-muted-foreground mt-1">Threat detection, triage, and coordinated response · {safeData.totalAlerts?.toLocaleString()} events monitored</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-1">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/8 border border-red-500/15">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0" />
            <span className="text-[10px] font-mono text-red-400">{safeData.activeIncidents} ACTIVE</span>
          </div>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
            SOC LIVE
          </Badge>
          <SOCLiveClock />
        </div>
      </div>

      {/* Command Strip — KPI rail */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 divide-x-0 sm:divide-x divide-border/50">
          {[
            {
              label: "Active Incidents",
              value: <span className="text-red-400"><AnimatedCounter value={safeData.activeIncidents} /></span>,
              sub: `${safeData.totalIncidents} this quarter`,
              icon: AlertTriangle,
              accent: "text-red-400",
              pulse: safeData.activeIncidents > 0,
            },
            {
              label: "Open Alerts",
              value: <span className="text-amber-400"><AnimatedCounter value={safeData.openAlerts} /></span>,
              sub: `${safeData.alertsBySeverity?.critical ?? 0} critical`,
              icon: Shield,
              accent: "text-amber-400",
              pulse: false,
            },
            {
              label: "MTTD",
              value: <span className="text-sky-400"><AnimatedCounter value={safeData.mttd} decimals={1} /></span>,
              sub: "minutes avg detection",
              icon: Clock,
              accent: "text-sky-400",
              suffix: "min",
              pulse: false,
            },
            {
              label: "MTTR",
              value: <span className="text-violet-400"><AnimatedCounter value={safeData.mttr} /></span>,
              sub: "minutes avg response",
              icon: Zap,
              accent: "text-violet-400",
              suffix: "min",
              pulse: false,
            },
            {
              label: "Open Findings",
              value: <span className="text-orange-400"><AnimatedCounter value={safeData.openFindings} /></span>,
              sub: `${safeData.criticalFindings ?? 0} critical`,
              icon: Target,
              accent: "text-orange-400",
              pulse: false,
            },
            {
              label: "Posture Score",
              value: <span className="text-emerald-400">{posturScore}</span>,
              sub: "+3% vs last week",
              icon: Eye,
              accent: "text-emerald-400",
              suffix: "%",
              pulse: false,
            },
          ].map(({ label, value, sub, icon: Icon, accent, suffix, pulse }) => (
            <div key={label} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/5 transition-colors">
              <Icon className={cn("w-4 h-4 shrink-0", accent, pulse && "animate-pulse")} />
              <div className="min-w-0">
                <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider truncate">{label}</div>
                <div className="text-xl font-bold font-display leading-none mt-0.5 flex items-baseline gap-0.5">
                  {value}
                  {suffix && <span className={cn("text-sm font-normal", accent)}>{suffix}</span>}
                </div>
                <div className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Threat Posture mini-bars */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-display font-semibold">Threat Posture — {posturScore}% Secure</span>
            <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 ml-1">+3% WoW</Badge>
          </div>
          <span className="text-[9px] font-mono text-muted-foreground">Coverage indicators</span>
        </div>
        <div className="px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Endpoint Coverage", value: 98, color: "bg-emerald-400" },
            { label: "Patch Compliance", value: 94, color: "bg-emerald-400" },
            { label: "MFA Adoption", value: 87, color: "bg-amber-400" },
            { label: "EDR Health", value: 99, color: "bg-emerald-400" },
          ].map(m => (
            <div key={m.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-muted-foreground font-mono">{m.label}</span>
                <span className={cn("text-[10px] font-bold font-mono", m.color === "bg-emerald-400" ? "text-emerald-400" : "text-amber-400")}>{m.value}%</span>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", m.color)} style={{ width: `${m.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Triage + NL Hunting */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AIThreatTriage />
        <NLThreatHunting />
      </div>

      {/* Blast Radius + MITRE */}
      <BlastRadiusViz />
      <MitreHeatMap />

      {/* Collaboration: Active Incident Comments + Team Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CommentThread
          entityType="incident"
          entityId={triageQueue[0].id}
          title={`${triageQueue[0].id} Discussion`}
          collapsible={false}
        />
        <ActivityFeed entityType="incident" title="SOC Team Activity" limit={8} compact />
      </div>

      {/* Threat Timeline */}
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
              {(safeData.recentActivity || [] as ActivityItem[]).map((item: ActivityItem, i: number) => (
                <div key={i} className="flex gap-3 group">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full shrink-0 mt-2 ${severityDot[item.severity] || "bg-gray-400"}`} />
                    {i < (safeData.recentActivity?.length || 0) - 1 && <div className="w-px flex-1 bg-border/50 my-1" />}
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
              {Object.entries(safeData.alertsBySeverity || {}).map(([sev, count]) => {
                const total = Object.values(safeData.alertsBySeverity || {}).reduce((a, b) => a + (b as number), 0);
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
