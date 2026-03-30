import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { ShieldAlert, AlertTriangle, CheckCircle, Search, Clock, Globe, Ship, Flag } from "lucide-react";

const screeningQueue = [
  { id: "SCR-001", vessel: "GULF NAVIGATOR", imo: "9345678", owner: "Gulf Maritime FZE", flag: "UAE", status: "Hit", lists: ["OFAC SDN", "EU Consolidated"], severity: "Critical", eta: "Jebel Ali in 6h" },
  { id: "SCR-002", vessel: "NEVA HORIZON", imo: "9667890", owner: "Neva Shipping Ltd", flag: "Russia", status: "Hit", lists: ["UK OFSI"], severity: "High", eta: "Rotterdam in 2d" },
  { id: "SCR-003", vessel: "SEA MERCHANT", imo: "9123890", owner: "Sea Trade Holdings", flag: "Liberia", status: "Review", lists: [], severity: "Pending", eta: "Singapore in 4h" },
  { id: "SCR-004", vessel: "PACIFIC TRADER", imo: "9456123", owner: "Pacific Maritime Co.", flag: "Singapore", status: "Clear", lists: [], severity: "Clear", eta: "Hong Kong in 1d" },
  { id: "SCR-005", vessel: "ATLAS PEARL", imo: "9789012", owner: "Atlas Marine LLC", flag: "Panama", status: "Clear", lists: [], severity: "Clear", eta: "Los Angeles in 5d" },
];

const recentAlerts = [
  { type: "Vessel Match", vessel: "GULF NAVIGATOR", list: "OFAC SDN", timestamp: "12 min ago", action: "Port Authority Notified" },
  { type: "Owner Match", vessel: "ARCTIC PIONEER", list: "EU Consolidated List", timestamp: "2h ago", action: "Cargo Hold Issued" },
  { type: "Beneficial Owner", vessel: "NEVA HORIZON", list: "UK OFSI", timestamp: "4h ago", action: "Under Investigation" },
  { type: "Port Call Denied", vessel: "SHADOW DAWN", list: "OFAC SDN — prior hit", timestamp: "7h ago", action: "Denied Entry" },
];

const lists = [
  { name: "OFAC SDN", region: "USA", entities: "12,847", vessels: 284, lastUpdated: "2h ago" },
  { name: "EU Consolidated", region: "European Union", entities: "8,234", vessels: 192, lastUpdated: "6h ago" },
  { name: "UK OFSI", region: "United Kingdom", entities: "4,521", vessels: 121, lastUpdated: "1d ago" },
  { name: "UN Security Council", region: "Global", entities: "2,183", vessels: 67, lastUpdated: "3d ago" },
  { name: "IMO High-Risk", region: "Global", entities: "3,400", vessels: 445, lastUpdated: "12h ago" },
];

const statusStyles: Record<string, string> = {
  Hit: "bg-red-500/10 text-red-400 border-red-500/20",
  Review: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Clear: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const StatusIcon = ({ s }: { s: string }) =>
  s === "Hit" ? <AlertTriangle className="w-3.5 h-3.5" /> :
  s === "Clear" ? <CheckCircle className="w-3.5 h-3.5" /> :
  <Clock className="w-3.5 h-3.5" />;

export default function SanctionsScreening() {
  const [search, setSearch] = useState("");
  const filtered = screeningQueue.filter(v =>
    v.vessel.toLowerCase().includes(search.toLowerCase()) ||
    v.imo.includes(search) ||
    v.owner.toLowerCase().includes(search.toLowerCase())
  );

  const hits = screeningQueue.filter(v => v.status === "Hit").length;
  const reviews = screeningQueue.filter(v => v.status === "Review").length;
  const clears = screeningQueue.filter(v => v.status === "Clear").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-red-400" />
          Sanctions Compliance Screening
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Continuous vessel, owner, and beneficial owner screening against global sanctions lists</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Sanctions Hits</p><p className="text-2xl font-bold text-red-400">{hits}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Under Review</p><p className="text-2xl font-bold text-amber-400">{reviews}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Cleared Today</p><p className="text-2xl font-bold text-emerald-400">{clears}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Lists Monitored</p><p className="text-2xl font-bold text-sky-400">5</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search vessel, IMO, or owner..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            {filtered.map((item) => (
              <Card key={item.id} className={item.status === "Hit" ? "border-red-500/30" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        item.status === "Hit" ? "bg-red-500/10" : item.status === "Review" ? "bg-amber-500/10" : "bg-emerald-500/10"
                      }`}>
                        <StatusIcon s={item.status} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{item.vessel}</span>
                          <Badge variant="outline" className="text-[10px]">IMO {item.imo}</Badge>
                          <Badge variant="outline" className={`text-[10px] ${statusStyles[item.status]}`}>
                            {item.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Owner: {item.owner} · Flag: {item.flag}</p>
                        {item.lists.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {item.lists.map(l => (
                              <span key={l} className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20">{l}</span>
                            ))}
                          </div>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">ETA: {item.eta}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recent Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentAlerts.map((alert, i) => (
                <div key={i} className="border-l-2 border-red-500/40 pl-3 py-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-red-400">{alert.type}</span>
                    <span className="text-[10px] text-muted-foreground">{alert.timestamp}</span>
                  </div>
                  <p className="text-xs mt-0.5">{alert.vessel}</p>
                  <p className="text-[10px] text-muted-foreground">{alert.list}</p>
                  <p className="text-[10px] text-emerald-400 mt-0.5">→ {alert.action}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Sanctions Lists Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lists.map((list) => (
                <div key={list.name} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium">{list.name}</p>
                    <p className="text-[10px] text-muted-foreground">{list.region} · {list.entities} entities</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold">{list.vessels} vessels</p>
                    <p className="text-[10px] text-emerald-400">Updated {list.lastUpdated}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
