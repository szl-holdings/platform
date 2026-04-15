import { useState } from "react";
import { Eye, Server, Database, Globe, Key, FileText, Activity, AlertTriangle, Zap, Shield, ChevronRight, RefreshCw, Play, TrendingUp, Network, HardDrive } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { toast } from "@szl-holdings/shared-ui/ui/sonner";

interface HoneypotAsset {
  id: string;
  name: string;
  type: "server" | "database" | "credential" | "fileshare" | "api" | "email";
  ip: string;
  status: "active" | "engaged" | "triggered" | "adapting";
  interactions: number;
  lastInteraction?: string;
  attackerProfile?: string;
  deceptionScore: number;
  generated: string;
}

interface DeceptionEvent {
  id: string;
  time: string;
  honeypot: string;
  event: string;
  severity: "critical" | "high" | "medium";
  attackerIp: string;
  technique: string;
  intel: string;
}

const HONEYPOTS: HoneypotAsset[] = [
  { id: "HP-001", name: "PROD-DB-REPLICA", type: "database", ip: "10.12.45.22", status: "engaged", interactions: 47, lastInteraction: "2m ago", attackerProfile: "APT-29 TTP match (93%)", deceptionScore: 97, generated: "GPT-4 schema replication" },
  { id: "HP-002", name: "BACKUP-SRV-02", type: "server", ip: "10.12.45.89", status: "triggered", interactions: 124, lastInteraction: "30s ago", attackerProfile: "FIN7 lateral movement", deceptionScore: 91, generated: "AI-synthesized AD attributes" },
  { id: "HP-003", name: "admin_creds_2024.txt", type: "credential", ip: "\\\\FS-CORP-01\\HR", status: "active", interactions: 3, lastInteraction: "1h ago", deceptionScore: 88, generated: "Generated canary token" },
  { id: "HP-004", name: "FINANCE-SHARE", type: "fileshare", ip: "10.12.46.10", status: "active", interactions: 8, lastInteraction: "4h ago", deceptionScore: 94, generated: "Realistic document library" },
  { id: "HP-005", name: "INTERNAL-API-GW", type: "api", ip: "10.12.44.200", status: "adapting", interactions: 29, lastInteraction: "15m ago", attackerProfile: "Scanning behavior detected", deceptionScore: 85, generated: "OpenAPI spec generation" },
  { id: "HP-006", name: "it-support@corp-internal.com", type: "email", ip: "mailbox", status: "active", interactions: 12, lastInteraction: "3h ago", deceptionScore: 92, generated: "Realistic inbox with bait threads" },
];

const EVENTS: DeceptionEvent[] = [
  { id: "DE-001", time: "14:33:42", honeypot: "BACKUP-SRV-02", event: "SSH brute force attempt — 47 password combinations", severity: "critical", attackerIp: "185.220.101.47", technique: "T1110.001 — Brute Force", intel: "Exit node matches Tor network. APT-29 pivot pattern." },
  { id: "DE-002", time: "14:31:15", honeypot: "PROD-DB-REPLICA", event: "SQL injection payload detected on login endpoint", severity: "high", attackerIp: "92.118.36.199", technique: "T1190 — Exploit Public-Facing App", intel: "Payload signature matches DARKSIDE ransomware reconnaissance kit." },
  { id: "DE-003", time: "14:28:05", honeypot: "admin_creds_2024.txt", event: "Canary token triggered — credential accessed", severity: "critical", attackerIp: "10.12.47.33", technique: "T1078 — Valid Accounts", intel: "INTERNAL THREAT: Source IP belongs to WORKSTATION-047 (compromised endpoint)." },
  { id: "DE-004", time: "14:22:30", honeypot: "INTERNAL-API-GW", event: "Automated vulnerability scanner detected — 1,200 probe requests", severity: "high", attackerIp: "104.21.45.87", technique: "T1595 — Active Scanning", intel: "Shodan crawler fingerprint. Likely pre-attack reconnaissance phase." },
  { id: "DE-005", time: "14:15:10", honeypot: "FINANCE-SHARE", event: "Mass file enumeration — 340 files accessed in 8s", severity: "high", attackerIp: "10.12.47.89", technique: "T1083 — File and Directory Discovery", intel: "Behavior consistent with ransomware pre-encryption staging." },
];

const typeIcon: Record<string, typeof Server> = {
  server: Server,
  database: Database,
  credential: Key,
  fileshare: HardDrive,
  api: Globe,
  email: FileText,
};

const typeColor: Record<string, string> = {
  server: "#3b82f6",
  database: "#8b5cf6",
  credential: "#f59e0b",
  fileshare: "#10b981",
  api: "#06b6d4",
  email: "#f97316",
};

const statusConfig: Record<string, { color: string; label: string }> = {
  active: { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", label: "Active" },
  engaged: { color: "text-amber-400 bg-amber-500/10 border-amber-500/30", label: "Engaged" },
  triggered: { color: "text-red-400 bg-red-500/10 border-red-500/30", label: "🔴 Triggered" },
  adapting: { color: "text-blue-400 bg-blue-500/10 border-blue-500/30", label: "Adapting" },
};

export default function DeceptionGrid() {
  const [selectedEvent, setSelectedEvent] = useState<DeceptionEvent | null>(EVENTS[0]);
  const [generating, setGenerating] = useState(false);
  const handleDeploy = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      toast.success("New honeypot deployed: STAGE-ENV-03 — AI-generated Windows server with realistic AD attributes");
    }, 2200);
  };

  const totalInteractions = HONEYPOTS.reduce((s, h) => s + h.interactions, 0);

  return (
    <div className="p-6 space-y-6 max-w-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-5 h-5 text-purple-400" />
            <h1 className="text-lg font-semibold text-white">AI-Driven Honeypot & Deception Grid</h1>
          </div>
          <p className="text-xs text-zinc-500">Generative AI creates hyper-realistic fake assets. Honeypots adapt to attacker interaction patterns in real time.</p>
        </div>
        <button
          onClick={handleDeploy}
          disabled={generating}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-medium hover:bg-purple-500/25 transition-colors disabled:opacity-50"
        >
          {generating ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating...</> : <><Zap className="w-3.5 h-3.5" /> Deploy New Decoy</>}
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active Honeypots", value: HONEYPOTS.length, sub: "across 4 network segments", color: "#8b5cf6", icon: Eye },
          { label: "Total Interactions", value: totalInteractions, sub: "attacker engagements captured", color: "#ef4444", icon: Activity },
          { label: "Threat Intel Items", value: 34, sub: "extracted from attacker behavior", color: "#f97316", icon: TrendingUp },
          { label: "Avg Deception Score", value: `${Math.round(HONEYPOTS.reduce((s, h) => s + h.deceptionScore, 0) / HONEYPOTS.length)}%`, sub: "realism rating", color: "#10b981", icon: Shield },
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
        {/* Honeypot Grid */}
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Deception Assets</h2>
          <div className="grid grid-cols-1 gap-2">
            {HONEYPOTS.map(hp => {
              const Icon = typeIcon[hp.type] ?? Server;
              const sc = statusConfig[hp.status];
              return (
                <div key={hp.id} className={cn("rounded-xl border p-3 transition-all", hp.status === "triggered" ? "border-red-500/30 bg-red-500/5" : "border-white/8 bg-white/3")}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${typeColor[hp.type]}20`, border: `1px solid ${typeColor[hp.type]}30` }}>
                      <Icon className="w-4 h-4" style={{ color: typeColor[hp.type] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-white truncate">{hp.name}</span>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded border shrink-0", sc.color)}>{sc.label}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">{hp.ip} · {hp.generated}</div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-zinc-400">{hp.interactions} interactions</span>
                        {hp.lastInteraction && <span className="text-[10px] text-zinc-500">Last: {hp.lastInteraction}</span>}
                        <div className="ml-auto flex items-center gap-1">
                          <div className="w-12 h-1 rounded-full bg-white/5">
                            <div className="h-full rounded-full bg-purple-500/60" style={{ width: `${hp.deceptionScore}%` }} />
                          </div>
                          <span className="text-[10px] text-purple-400">{hp.deceptionScore}%</span>
                        </div>
                      </div>
                      {hp.attackerProfile && (
                        <div className="mt-1.5 text-[10px] text-amber-400 bg-amber-500/10 rounded px-1.5 py-0.5">{hp.attackerProfile}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deception Telemetry */}
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Deception Telemetry Feed</h2>
          <div className="space-y-2 mb-4">
            {EVENTS.map(evt => (
              <button
                key={evt.id}
                onClick={() => setSelectedEvent(evt)}
                className={cn("w-full rounded-xl border p-3 text-left transition-all", selectedEvent?.id === evt.id ? "border-purple-500/40 bg-purple-500/5" : "border-white/8 bg-white/3 hover:bg-white/5")}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-[11px] font-medium text-white leading-snug">{evt.event}</span>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded border shrink-0", evt.severity === "critical" ? "text-red-400 border-red-500/30 bg-red-500/10" : "text-orange-400 border-orange-500/30 bg-orange-500/10")}>{evt.severity}</span>
                </div>
                <div className="text-[10px] text-zinc-500">{evt.time} · {evt.honeypot} · {evt.attackerIp}</div>
              </button>
            ))}
          </div>

          {selectedEvent && (
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Network className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-semibold text-purple-300">Threat Intelligence Extracted</span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-0.5">MITRE Technique</div>
                  <div className="text-xs text-white font-mono">{selectedEvent.technique}</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-0.5">Attacker IP</div>
                  <div className="text-xs text-white font-mono">{selectedEvent.attackerIp}</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-0.5">Intel Analysis</div>
                  <div className="text-[11px] text-zinc-300 leading-relaxed">{selectedEvent.intel}</div>
                </div>
                <button
                  onClick={() => toast.success("IOC pushed to threat intel feeds and SIEM blocklist")}
                  className="w-full mt-2 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-medium hover:bg-purple-500/25 transition-colors"
                >
                  Push IOC to Threat Intel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
