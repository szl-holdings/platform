import { BarChart3, Users, Ticket, Server, AlertTriangle, CheckCircle, Clock, DollarSign, ArrowUp, ArrowDown, Activity, Wifi, Shield, TrendingUp, ChevronRight } from "lucide-react";

const activeAlerts = [
  { id: 1, severity: "critical", client: "Meridian Corp", message: "Server cluster unresponsive — 3 nodes down", time: "2 min ago" },
  { id: 2, severity: "warning", client: "Atlas Industries", message: "Firewall rule change — unauthorized modification", time: "8 min ago" },
  { id: 3, severity: "info", client: "Vertex Labs", message: "Backup completed — 2.4TB processed", time: "15 min ago" },
  { id: 4, severity: "warning", client: "Pinnacle Health", message: "SSL certificate expiring in 7 days", time: "22 min ago" },
  { id: 5, severity: "critical", client: "NovaTech", message: "DDoS attack detected — mitigation active", time: "35 min ago" },
];

const recentTickets = [
  { id: "TKT-4521", client: "Meridian Corp", subject: "Email server migration", priority: "high", status: "in-progress", sla: "2h remaining" },
  { id: "TKT-4520", client: "Atlas Industries", subject: "VPN connectivity issues", priority: "medium", status: "assigned", sla: "4h remaining" },
  { id: "TKT-4519", client: "Vertex Labs", subject: "New workstation setup x5", priority: "low", status: "queued", sla: "8h remaining" },
  { id: "TKT-4518", client: "Pinnacle Health", subject: "HIPAA compliance audit prep", priority: "high", status: "in-progress", sla: "1d remaining" },
];

const clients = [
  { name: "Meridian Corp", devices: 284, tickets: 3, health: 62, status: "at-risk" },
  { name: "Atlas Industries", devices: 198, tickets: 1, health: 88, status: "healthy" },
  { name: "Vertex Labs", devices: 156, tickets: 1, health: 95, status: "healthy" },
  { name: "Pinnacle Health", devices: 312, tickets: 2, health: 74, status: "warning" },
  { name: "NovaTech", devices: 89, tickets: 4, health: 41, status: "at-risk" },
  { name: "Solaris Energy", devices: 245, tickets: 0, health: 98, status: "healthy" },
];

const sevColors: Record<string, { dot: string; badge: string; label: string }> = {
  critical: { dot: "bg-red-500", badge: "bg-red-500/10 text-red-500 border border-red-500/20", label: "Critical" },
  warning: { dot: "bg-amber-500", badge: "bg-amber-500/10 text-amber-500 border border-amber-500/20", label: "Warning" },
  info: { dot: "bg-blue-500", badge: "bg-blue-500/10 text-blue-500 border border-blue-500/20", label: "Info" },
};

const prioColors: Record<string, string> = {
  high: "bg-red-500/10 text-red-500",
  medium: "bg-amber-500/10 text-amber-600",
  low: "bg-emerald-500/10 text-emerald-600",
};

const statusColors: Record<string, string> = {
  "in-progress": "bg-blue-500/10 text-blue-500",
  assigned: "bg-violet-500/10 text-violet-500",
  queued: "bg-muted text-muted-foreground",
};

function HealthBar({ value, status }: { value: number; status: string }) {
  const color = status === "healthy" ? "bg-emerald-500" : status === "warning" ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-xs font-semibold tabular-nums ${status === "healthy" ? "text-emerald-500" : status === "warning" ? "text-amber-500" : "text-red-500"}`}>{value}</span>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Client Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">47 active clients · All critical systems monitored</p>
      </div>

      {/* Hero Revenue Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-violet-700 p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 50%, white 0%, transparent 60%)" }} />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-white/70 uppercase tracking-wider mb-1">Monthly Recurring Revenue</p>
            <div className="text-5xl font-display font-bold tracking-tight">$184,200</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center gap-1 text-sm font-semibold text-emerald-300">
                <ArrowUp className="w-4 h-4" /> +12%
              </span>
              <span className="text-white/50 text-sm">vs last month</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {[
              { label: "Active Clients", value: "47", icon: Users },
              { label: "Open Tickets", value: "23", icon: Ticket },
              { label: "Managed Devices", value: "1,284", icon: Server },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <s.icon className="w-5 h-5 text-white/50 mx-auto mb-1" />
                <div className="text-2xl font-display font-bold">{s.value}</div>
                <div className="text-xs text-white/60 mt-0.5 whitespace-nowrap">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Client Health Table + NOC Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Client Table */}
        <div className="xl:col-span-3 rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Client Health
            </h2>
            <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-border">
            {clients.map((client) => (
              <div key={client.name} className="px-4 py-3 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{client.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{client.devices} devices · {client.tickets} {client.tickets === 1 ? "ticket" : "tickets"}</p>
                </div>
                <div className="w-32 shrink-0">
                  <HealthBar value={client.health} status={client.status} />
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                  client.status === "healthy" ? "bg-emerald-500/10 text-emerald-600"
                  : client.status === "warning" ? "bg-amber-500/10 text-amber-600"
                  : "bg-red-500/10 text-red-500"
                }`}>
                  {client.status === "at-risk" ? "At Risk" : client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* NOC Alerts */}
        <div className="xl:col-span-2 rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              NOC Alerts
            </h2>
            <span className="text-xs text-muted-foreground">{activeAlerts.length} active</span>
          </div>
          <div className="divide-y divide-border">
            {activeAlerts.map((alert) => (
              <div key={alert.id} className="p-4 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${sevColors[alert.severity].dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${sevColors[alert.severity].badge}`}>
                      {sevColors[alert.severity].label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{alert.time}</span>
                  </div>
                  <p className="text-sm font-medium leading-snug">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.client}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tickets + Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Tickets */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold flex items-center gap-2">
              <Ticket className="w-4 h-4 text-blue-500" />
              Recent Tickets
            </h2>
            <span className="text-xs text-muted-foreground">{recentTickets.length} latest</span>
          </div>
          <div className="divide-y divide-border">
            {recentTickets.map((ticket) => (
              <div key={ticket.id} className="px-4 py-3 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${prioColors[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate">{ticket.subject}</p>
                  <p className="text-xs text-muted-foreground">{ticket.client}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${statusColors[ticket.status]}`}>
                    {ticket.status.replace("-", " ")}
                  </span>
                  <p className="text-xs text-amber-500 flex items-center gap-1 justify-end mt-1">
                    <Clock className="w-3 h-3" /> {ticket.sla}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Stats */}
        <div className="lg:col-span-2 space-y-4">
          {[
            { label: "System Uptime", value: "99.97%", sub: "Across all managed infrastructure", color: "text-emerald-500", bg: "bg-emerald-500", pct: 99.97, icon: Activity },
            { label: "SLA Compliance", value: "96.4%", sub: "Tickets resolved within SLA", color: "text-blue-500", bg: "bg-blue-500", pct: 96.4, icon: Shield },
            { label: "Network Health", value: "94.2%", sub: "Average network performance", color: "text-violet-500", bg: "bg-violet-500", pct: 94.2, icon: Wifi },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <m.icon className={`w-4 h-4 ${m.color}`} />
                  <span className="text-sm font-semibold">{m.label}</span>
                </div>
                <span className={`text-2xl font-display font-bold ${m.color}`}>{m.value}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mb-1.5">
                <div className={`${m.bg} h-1.5 rounded-full transition-all duration-1000`} style={{ width: `${m.pct}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">{m.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
