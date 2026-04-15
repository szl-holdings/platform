import { useState } from "react";
import { Layers, Play, RefreshCw, Shield, AlertTriangle, CheckCircle, Target, Activity, Server, Network, Database, Globe, TrendingUp } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { toast } from "@szl-holdings/shared-ui/ui/sonner";

interface TwinNode {
  id: string;
  name: string;
  type: "server" | "workstation" | "network" | "cloud" | "database" | "firewall";
  syncState: "synced" | "drifted" | "offline";
  criticalityTier: 1 | 2 | 3;
  vulnerabilities: number;
  lastSync: string;
  ip: string;
}

interface RedTeamScenario {
  id: string;
  name: string;
  technique: string;
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  findings: number;
  criticalFindings: number;
  duration: string;
  startedAt?: string;
}

const NODES: TwinNode[] = [
  { id: "N-001", name: "PROD-DC-01", type: "server", syncState: "synced", criticalityTier: 1, vulnerabilities: 3, lastSync: "30s ago", ip: "10.0.1.10" },
  { id: "N-002", name: "PROD-DC-02", type: "server", syncState: "synced", criticalityTier: 1, vulnerabilities: 2, lastSync: "30s ago", ip: "10.0.1.11" },
  { id: "N-003", name: "DB-CRM-PROD", type: "database", syncState: "synced", criticalityTier: 1, vulnerabilities: 5, lastSync: "45s ago", ip: "10.0.2.50" },
  { id: "N-004", name: "SRV-WEB-CLUSTER", type: "server", syncState: "drifted", criticalityTier: 2, vulnerabilities: 8, lastSync: "5m ago", ip: "10.0.3.0/28" },
  { id: "N-005", name: "CORE-SWITCH-1", type: "network", syncState: "synced", criticalityTier: 1, vulnerabilities: 1, lastSync: "1m ago", ip: "10.0.0.1" },
  { id: "N-006", name: "PERIMETER-FW", type: "firewall", syncState: "synced", criticalityTier: 1, vulnerabilities: 0, lastSync: "30s ago", ip: "203.0.113.1" },
  { id: "N-007", name: "CLOUD-AWS-VPC", type: "cloud", syncState: "synced", criticalityTier: 2, vulnerabilities: 12, lastSync: "2m ago", ip: "AWS us-east-1" },
  { id: "N-008", name: "WORKSTATIONS-FLEET", type: "workstation", syncState: "drifted", criticalityTier: 3, vulnerabilities: 47, lastSync: "12m ago", ip: "10.12.0.0/20" },
  { id: "N-009", name: "VPN-GATEWAY", type: "network", syncState: "offline", criticalityTier: 2, vulnerabilities: 6, lastSync: "1h ago", ip: "10.0.0.254" },
];

const SCENARIOS: RedTeamScenario[] = [
  { id: "SIM-021", name: "APT-29 Initial Access Chain", technique: "T1566.001 + T1059.001 + T1078", status: "completed", progress: 100, findings: 7, criticalFindings: 2, duration: "4m 12s", startedAt: "14:20" },
  { id: "SIM-022", name: "Ransomware Lateral Movement", technique: "T1021 + T1047 + T1486", status: "running", progress: 67, findings: 4, criticalFindings: 1, duration: "ongoing", startedAt: "14:30" },
  { id: "SIM-023", name: "Cloud Privilege Escalation", technique: "T1078.004 + T1548 + T1530", status: "queued", progress: 0, findings: 0, criticalFindings: 0, duration: "—" },
  { id: "SIM-024", name: "Supply Chain Attack Simulation", technique: "T1195 + T1059 + T1041", status: "queued", progress: 0, findings: 0, criticalFindings: 0, duration: "—" },
  { id: "SIM-020", name: "Insider Threat Data Exfiltration", technique: "T1078 + T1048 + T1567", status: "failed", progress: 34, findings: 2, criticalFindings: 0, duration: "2m 45s", startedAt: "13:55" },
];

const typeIcon: Record<string, typeof Server> = { server: Server, workstation: Activity, network: Network, cloud: Globe, database: Database, firewall: Shield };
const typeColor: Record<string, string> = { server: "#3b82f6", workstation: "#10b981", network: "#06b6d4", cloud: "#8b5cf6", database: "#f97316", firewall: "#ef4444" };

const syncColor: Record<string, string> = {
  synced: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  drifted: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  offline: "text-red-400 bg-red-500/10 border-red-500/30",
};

const scenarioStatusColor: Record<string, string> = {
  queued: "text-zinc-400",
  running: "text-amber-400",
  completed: "text-emerald-400",
  failed: "text-red-400",
};

export default function DigitalTwin() {
  const [runningScenario, setRunningScenario] = useState<string | null>("SIM-022");
  const [syncing, setSyncing] = useState(false);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      toast.success("Digital twin synchronized — 847 config items updated from live infrastructure");
    }, 2000);
  };

  const handleRunScenario = (id: string) => {
    setRunningScenario(id);
    toast.success("Red team scenario launched against digital twin — live infrastructure unaffected");
  };

  const syncedNodes = NODES.filter(n => n.syncState === "synced").length;
  const totalVulns = NODES.reduce((s, n) => s + n.vulnerabilities, 0);

  return (
    <div className="p-6 space-y-6 max-w-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h1 className="text-lg font-semibold text-white">Cyber Digital Twin</h1>
          </div>
          <p className="text-xs text-zinc-500">Virtual replica of your entire network. Red team scenarios run against the twin to identify vulnerabilities before attackers do.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg", "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400")}>
            <Activity className="w-3 h-3 animate-pulse" />
            Live Sync Active
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-medium hover:bg-cyan-500/25 transition-colors"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", syncing && "animate-spin")} />
            Sync Twin
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Assets Modeled", value: NODES.length, sub: `${syncedNodes} synced, ${NODES.length - syncedNodes} drifted`, color: "#06b6d4", icon: Layers },
          { label: "Twin Fidelity", value: "99.1%", sub: "config accuracy vs live", color: "#10b981", icon: CheckCircle },
          { label: "Total Vulns Found", value: totalVulns, sub: "across all twin nodes", color: "#ef4444", icon: AlertTriangle },
          { label: "Scenarios Run Today", value: SCENARIOS.filter(s => s.status !== "queued").length, sub: `${SCENARIOS.filter(s => s.criticalFindings > 0).length} with critical findings`, color: "#8b5cf6", icon: Target },
        ].map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-xl border border-white/8 bg-white/3 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500">{m.label}</span>
                <Icon className="w-3.5 h-3.5" style={{ color: m.color }} />
              </div>
              <div className="text-2xl font-bold text-white">{m.value}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{m.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Infrastructure Map */}
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Twin Infrastructure Map</h2>
          <div className="space-y-1.5">
            {NODES.map(node => {
              const Icon = typeIcon[node.type] ?? Server;
              return (
                <div key={node.id} className="rounded-xl border border-white/8 bg-white/3 p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${typeColor[node.type]}20` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: typeColor[node.type] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white">{node.name}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{node.ip}</span>
                        <span className={cn("text-[10px] px-1 py-0.5 rounded", "text-zinc-500 bg-zinc-500/10")}>T{node.criticalityTier}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[10px]">
                        <span className="text-zinc-500">Sync: {node.lastSync}</span>
                        {node.vulnerabilities > 0 && <span className="text-red-400">{node.vulnerabilities} vulns</span>}
                      </div>
                    </div>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded border capitalize shrink-0", syncColor[node.syncState])}>
                      {node.syncState}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Red Team Scenarios */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Red Team Scenarios</h2>
            <button
              onClick={() => toast.success("Scenario library opened — 200+ MITRE ATT&CK attack chains available")}
              className="text-[10px] text-cyan-400 hover:text-cyan-300"
            >
              Browse Library →
            </button>
          </div>
          <div className="space-y-2">
            {SCENARIOS.map(scenario => (
              <div key={scenario.id} className={cn("rounded-xl border p-3", scenario.status === "running" ? "border-amber-500/30 bg-amber-500/5" : "border-white/8 bg-white/3")}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="text-xs font-medium text-white">{scenario.name}</div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{scenario.technique}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn("text-[10px] font-medium capitalize", scenarioStatusColor[scenario.status])}>
                      {scenario.status === "running" ? "⟳ Running" : scenario.status}
                    </span>
                    {scenario.status === "queued" && (
                      <button
                        onClick={() => handleRunScenario(scenario.id)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] hover:bg-cyan-500/25"
                      >
                        <Play className="w-2.5 h-2.5" /> Run
                      </button>
                    )}
                  </div>
                </div>
                {scenario.status === "running" && (
                  <div className="mb-2">
                    <div className="h-1.5 rounded-full bg-white/8">
                      <div className="h-full rounded-full bg-amber-400/60 transition-all" style={{ width: `${scenario.progress}%` }} />
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{scenario.progress}% complete</div>
                  </div>
                )}
                <div className="flex items-center gap-4 text-[10px] text-zinc-500">
                  <span>{scenario.duration}</span>
                  {scenario.findings > 0 && <span>{scenario.findings} findings</span>}
                  {scenario.criticalFindings > 0 && <span className="text-red-400">{scenario.criticalFindings} critical</span>}
                  {scenario.startedAt && <span>Started {scenario.startedAt}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Attack Surface Heatmap Summary */}
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 mt-3">
            <div className="text-xs font-semibold text-cyan-300 mb-3">Attack Surface Heatmap (Twin Analysis)</div>
            <div className="space-y-2">
              {[
                { area: "External Attack Surface", risk: 62, color: "#f97316" },
                { area: "Internal Lateral Movement", risk: 78, color: "#ef4444" },
                { area: "Privilege Escalation Paths", risk: 45, color: "#f59e0b" },
                { area: "Cloud / SaaS Exposure", risk: 55, color: "#8b5cf6" },
                { area: "Identity & Access Risk", risk: 71, color: "#ef4444" },
              ].map(item => (
                <div key={item.area}>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-zinc-400">{item.area}</span>
                    <span style={{ color: item.color }}>{item.risk}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5">
                    <div className="h-full rounded-full" style={{ width: `${item.risk}%`, background: item.color + "80" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
