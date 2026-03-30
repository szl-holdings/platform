import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Monitor, Wifi, AlertTriangle, CheckCircle, Clock, RefreshCw, Shield, Package, Terminal } from "lucide-react";

const endpoints = [
  { id: "EP-001", name: "WORKSTATION-142", client: "Apex Tech Corp", os: "Windows 11 Pro", cpu: 34, ram: 67, disk: 42, lastSeen: "2 min ago", status: "Online", patches: 3, threats: 0 },
  { id: "EP-002", name: "SERVER-DC-01", client: "Apex Tech Corp", os: "Windows Server 2022", cpu: 78, ram: 84, disk: 71, lastSeen: "Just now", status: "Alert", patches: 0, threats: 1 },
  { id: "EP-003", name: "LAPTOP-445", client: "Meridian Financial", os: "Windows 11 Pro", cpu: 22, ram: 45, disk: 38, lastSeen: "5 min ago", status: "Online", patches: 7, threats: 0 },
  { id: "EP-004", name: "MAC-CREATIVE-01", client: "Blue Sky Design", os: "macOS 15 Sequoia", cpu: 41, ram: 52, disk: 64, lastSeen: "1 min ago", status: "Online", patches: 1, threats: 0 },
  { id: "EP-005", name: "FILESERVER-01", client: "Harbor Legal", os: "Windows Server 2019", cpu: 15, ram: 34, disk: 88, lastSeen: "3 min ago", status: "Warning", patches: 12, threats: 0 },
  { id: "EP-006", name: "SWITCH-CORE-01", client: "Harbor Legal", os: "Cisco IOS 17.x", cpu: 8, ram: 22, disk: 18, lastSeen: "Just now", status: "Online", patches: 0, threats: 0 },
];

const patchGroups = [
  { name: "Critical Security (0-day)", count: 14, severity: "Critical", autoApprove: false },
  { name: "High Priority Security", count: 47, severity: "High", autoApprove: true },
  { name: "Feature Updates", count: 132, severity: "Medium", autoApprove: false },
  { name: "Driver Updates", count: 28, severity: "Low", autoApprove: false },
];

const statusColor: Record<string, string> = {
  Online: "text-emerald-400 bg-emerald-500/10",
  Alert: "text-red-400 bg-red-500/10",
  Warning: "text-amber-400 bg-amber-500/10",
  Offline: "text-muted-foreground bg-muted",
};

function MetricBar({ value, label }: { value: number; label: string }) {
  const color = value >= 85 ? "bg-red-500" : value >= 70 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-0.5"><span className="text-muted-foreground">{label}</span><span>{value}%</span></div>
      <div className="h-1 bg-muted rounded-full overflow-hidden"><div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} /></div>
    </div>
  );
}

export default function RMMConsole() {
  const [search, setSearch] = useState("");
  const filtered = endpoints.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.client.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Monitor className="w-6 h-6 text-primary" />
          RMM Console — Endpoint Monitoring
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Remote monitoring across managed endpoints — patch management, threat status, and remote access</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Endpoints", value: endpoints.length, color: "text-sky-400" },
          { label: "Online", value: endpoints.filter(e => e.status === "Online").length, color: "text-emerald-400" },
          { label: "Alerts / Warnings", value: endpoints.filter(e => e.status !== "Online").length, color: "text-red-400" },
          { label: "Patches Pending", value: patchGroups.reduce((a, p) => a + p.count, 0), color: "text-amber-400" },
        ].map(({ label, value, color }) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-2xl font-bold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-3">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search endpoints or clients..." className="flex-1 px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary" />
            <button className="flex items-center gap-1.5 text-xs px-3 py-2 bg-muted border border-border rounded-lg hover:bg-muted/80 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh All
            </button>
          </div>
          <div className="space-y-2">
            {filtered.map((ep) => (
              <Card key={ep.id} className={ep.status === "Alert" ? "border-red-500/30" : ep.status === "Warning" ? "border-amber-500/20" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${ep.status === "Online" ? "bg-emerald-500" : ep.status === "Alert" ? "bg-red-500 animate-pulse" : "bg-amber-500"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm font-mono">{ep.name}</span>
                        <Badge variant="outline" className="text-[10px]">{ep.client}</Badge>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColor[ep.status]}`}>{ep.status}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{ep.os} · Last: {ep.lastSeen}</p>
                      <div className="grid grid-cols-3 gap-3 mt-2">
                        <MetricBar value={ep.cpu} label="CPU" />
                        <MetricBar value={ep.ram} label="RAM" />
                        <MetricBar value={ep.disk} label="Disk" />
                      </div>
                      <div className="flex gap-3 mt-2">
                        {ep.patches > 0 && <span className="flex items-center gap-1 text-[10px] text-amber-400"><Package className="w-3 h-3" />{ep.patches} patches</span>}
                        {ep.threats > 0 && <span className="flex items-center gap-1 text-[10px] text-red-400"><Shield className="w-3 h-3" />{ep.threats} threat</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button className="text-[10px] px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors flex items-center gap-1"><Terminal className="w-3 h-3" />Remote</button>
                      <button className="text-[10px] px-2 py-1 bg-muted border border-border rounded hover:bg-muted/80 transition-colors">Patch</button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Patch Approval Queue</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {patchGroups.map((g) => (
                <div key={g.name} className="p-3 rounded-lg bg-muted/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold">{g.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{g.count} patches pending</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className={`text-[10px] ${g.severity === "Critical" ? "text-red-400 bg-red-500/10 border-red-500/20" : g.severity === "High" ? "text-orange-400 bg-orange-500/10 border-orange-500/20" : "text-muted-foreground"}`}>{g.severity}</Badge>
                      {g.autoApprove && <span className="text-[10px] text-emerald-400">Auto-approved</span>}
                    </div>
                  </div>
                  {!g.autoApprove && <button className="mt-2 text-[10px] px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors w-full">Review & Deploy</button>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
