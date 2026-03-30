import { BarChart3, Users, Ticket, Server, AlertTriangle, CheckCircle, Clock, DollarSign, ArrowUp, ArrowDown, Activity, Wifi, Shield } from "lucide-react";

const stats = [
  { label: "Active Clients", value: "47", change: "+3", trend: "up", icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
  { label: "Open Tickets", value: "23", change: "-5", trend: "down", icon: Ticket, color: "text-amber-400", bg: "bg-amber-500/10" },
  { label: "Managed Devices", value: "1,284", change: "+42", trend: "up", icon: Server, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { label: "Monthly Revenue", value: "$184K", change: "+12%", trend: "up", icon: DollarSign, color: "text-violet-400", bg: "bg-violet-500/10" },
];

const activeAlerts = [
  { id: 1, severity: "critical", client: "Meridian Corp", message: "Server cluster unresponsive — 3 nodes down", time: "2 min ago" },
  { id: 2, severity: "warning", client: "Atlas Industries", message: "Firewall rule change detected — unauthorized modification", time: "8 min ago" },
  { id: 3, severity: "info", client: "Vertex Labs", message: "Backup completed successfully — 2.4TB processed", time: "15 min ago" },
  { id: 4, severity: "warning", client: "Pinnacle Health", message: "SSL certificate expiring in 7 days", time: "22 min ago" },
  { id: 5, severity: "critical", client: "NovaTech", message: "DDoS attack detected — mitigation in progress", time: "35 min ago" },
];

const recentTickets = [
  { id: "TKT-4521", client: "Meridian Corp", subject: "Email server migration", priority: "high", status: "in-progress", sla: "2h remaining" },
  { id: "TKT-4520", client: "Atlas Industries", subject: "VPN connectivity issues", priority: "medium", status: "assigned", sla: "4h remaining" },
  { id: "TKT-4519", client: "Vertex Labs", subject: "New workstation setup x5", priority: "low", status: "queued", sla: "8h remaining" },
  { id: "TKT-4518", client: "Pinnacle Health", subject: "HIPAA compliance audit prep", priority: "high", status: "in-progress", sla: "1d remaining" },
];

const sevColors: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const prioColors: Record<string, string> = {
  high: "bg-red-500/10 text-red-400",
  medium: "bg-amber-500/10 text-amber-400",
  low: "bg-emerald-500/10 text-emerald-400",
};

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">MSP Command Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Managed Service Provider Operations Overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <span className={`flex items-center gap-1 text-xs font-medium ${s.trend === "up" ? "text-emerald-400" : "text-red-400"}`}>
                {s.trend === "up" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {s.change}
              </span>
            </div>
            <div className="text-2xl font-display font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              NOC Alerts
            </h2>
            <span className="text-xs text-muted-foreground">{activeAlerts.length} active</span>
          </div>
          <div className="divide-y divide-border">
            {activeAlerts.map((alert) => (
              <div key={alert.id} className="p-4 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                <span className={`mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${sevColors[alert.severity]}`}>
                  {alert.severity}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.client} · {alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold flex items-center gap-2">
              <Ticket className="w-4 h-4 text-blue-400" />
              Recent Tickets
            </h2>
            <span className="text-xs text-muted-foreground">{recentTickets.length} latest</span>
          </div>
          <div className="divide-y divide-border">
            {recentTickets.map((ticket) => (
              <div key={ticket.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${prioColors[ticket.priority]}`}>
                    {ticket.priority}
                  </span>
                </div>
                <p className="text-sm font-medium">{ticket.subject}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-muted-foreground">{ticket.client}</span>
                  <span className="text-xs text-amber-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {ticket.sla}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold">System Uptime</span>
          </div>
          <div className="text-3xl font-display font-bold text-emerald-400">99.97%</div>
          <p className="text-xs text-muted-foreground mt-1">Across all managed infrastructure</p>
          <div className="mt-3 w-full bg-muted rounded-full h-2">
            <div className="bg-emerald-400 h-2 rounded-full" style={{ width: "99.97%" }} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold">SLA Compliance</span>
          </div>
          <div className="text-3xl font-display font-bold text-blue-400">96.4%</div>
          <p className="text-xs text-muted-foreground mt-1">Tickets resolved within SLA window</p>
          <div className="mt-3 w-full bg-muted rounded-full h-2">
            <div className="bg-blue-400 h-2 rounded-full" style={{ width: "96.4%" }} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wifi className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-semibold">Network Health</span>
          </div>
          <div className="text-3xl font-display font-bold text-violet-400">94.2%</div>
          <p className="text-xs text-muted-foreground mt-1">Average network performance score</p>
          <div className="mt-3 w-full bg-muted rounded-full h-2">
            <div className="bg-violet-400 h-2 rounded-full" style={{ width: "94.2%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
