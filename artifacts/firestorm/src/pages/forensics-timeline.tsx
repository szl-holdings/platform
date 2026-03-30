import { Clock, Shield, AlertTriangle, Eye, Search, Filter, FileText, Terminal, Globe, Lock, Unlock, Database } from "lucide-react";
import { useState } from "react";

interface ForensicEvent {
  id: string;
  timestamp: string;
  category: "network" | "endpoint" | "auth" | "file" | "process" | "registry";
  action: string;
  detail: string;
  source: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  artifact: string;
  linked: boolean;
}

const events: ForensicEvent[] = [
  { id: "FE-001", timestamp: "14:23:45.122", category: "network", action: "C2 Beacon Detected", detail: "Outbound connection to 185.220.101.34:443 — TLS encrypted, 30s interval beaconing pattern", source: "WS-042", severity: "critical", artifact: "PCAP-2024-0329-001", linked: true },
  { id: "FE-002", timestamp: "14:23:12.891", category: "process", action: "Suspicious Process Spawn", detail: "powershell.exe spawned by winword.exe — encoded command detected", source: "WS-042", severity: "critical", artifact: "MEM-DUMP-042", linked: true },
  { id: "FE-003", timestamp: "14:22:58.334", category: "file", action: "Macro Execution", detail: "Embedded macro executed from Invoice_March2024.docm", source: "WS-042", severity: "high", artifact: "FILE-INV-2024", linked: true },
  { id: "FE-004", timestamp: "14:22:45.001", category: "endpoint", action: "File Downloaded", detail: "Invoice_March2024.docm downloaded via Outlook — 2.4MB", source: "WS-042", severity: "high", artifact: "EMAIL-HDR-991", linked: true },
  { id: "FE-005", timestamp: "14:20:12.445", category: "auth", action: "Privilege Escalation", detail: "Local admin token obtained via UAC bypass technique", source: "WS-042", severity: "critical", artifact: "EVT-SEC-042", linked: true },
  { id: "FE-006", timestamp: "14:18:33.221", category: "network", action: "Lateral Movement", detail: "SMB connection attempt to DC-01 (10.0.1.10) from WS-042", source: "Network Sensor", severity: "critical", artifact: "PCAP-2024-0329-002", linked: false },
  { id: "FE-007", timestamp: "14:15:00.000", category: "auth", action: "Failed Login Burst", detail: "12 failed RDP attempts in 30 seconds — password spraying pattern", source: "DC-01", severity: "medium", artifact: "EVT-SEC-DC01", linked: false },
  { id: "FE-008", timestamp: "14:10:22.112", category: "file", action: "Registry Modification", detail: "Run key added: HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\svchost_update", source: "WS-042", severity: "high", artifact: "REG-SNAP-042", linked: true },
];

const categoryIcons: Record<string, typeof Globe> = {
  network: Globe, endpoint: Terminal, auth: Lock, file: FileText, process: Terminal, registry: Database,
};

const sevColors: Record<string, string> = {
  critical: "border-red-500 bg-red-500/10", high: "border-orange-500 bg-orange-500/10",
  medium: "border-amber-500 bg-amber-500/10", low: "border-emerald-500 bg-emerald-500/10",
  info: "border-blue-500 bg-blue-500/10",
};

const sevDots: Record<string, string> = {
  critical: "bg-red-400", high: "bg-orange-400", medium: "bg-amber-400", low: "bg-emerald-400", info: "bg-blue-400",
};

export default function ForensicsTimeline() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const filtered = categoryFilter === "all" ? events : events.filter(e => e.category === categoryFilter);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary" /> Forensics Timeline
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Forensic event reconstruction with artifact chain-of-custody, timeline correlation, and IOC extraction</p>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-400">Active Investigation: INC-2024-0329</p>
          <p className="text-xs text-muted-foreground">Suspected APT intrusion via weaponized document — Endpoint WS-042 compromised</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {["all", "network", "endpoint", "auth", "file", "process"].map((c) => (
          <button key={c} onClick={() => setCategoryFilter(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${categoryFilter === c ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}>
            {c === "all" ? "All Events" : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      <div className="relative pl-8">
        <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
        <div className="space-y-4">
          {filtered.map((event) => {
            const CatIcon = categoryIcons[event.category] || Globe;
            return (
              <div key={event.id} className={`relative rounded-xl border p-4 ${sevColors[event.severity]} transition-colors hover:bg-muted/20`}>
                <div className={`absolute -left-5 top-4 w-3 h-3 rounded-full border-2 border-background ${sevDots[event.severity]}`} />
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CatIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-mono text-muted-foreground">{event.timestamp}</span>
                    <span className="text-xs font-semibold uppercase text-primary">{event.action}</span>
                    {event.linked && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">LINKED</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">{event.source}</span>
                </div>
                <p className="text-sm">{event.detail}</p>
                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                  <FileText className="w-3 h-3" /> Artifact: {event.artifact}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
