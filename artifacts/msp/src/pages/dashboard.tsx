import { BarChart3, Users, Ticket, Server, AlertTriangle, CheckCircle, Clock, DollarSign, ArrowUp, ArrowDown, Activity, Wifi, Shield, TrendingUp, ChevronRight, Bell, MapPin, Star, UserCheck, AlertCircle } from "lucide-react";
import { useState } from "react";

const activeAlerts = [
  { id: 1, severity: "critical", client: "Meridian Corp", message: "Server cluster unresponsive — 3 nodes down", time: "2 min ago" },
  { id: 2, severity: "warning", client: "Atlas Industries", message: "Firewall rule change — unauthorized modification", time: "8 min ago" },
  { id: 3, severity: "info", client: "Vertex Labs", message: "Backup completed — 2.4TB processed", time: "15 min ago" },
  { id: 4, severity: "warning", client: "Pinnacle Health", message: "SSL certificate expiring in 7 days", time: "22 min ago" },
  { id: 5, severity: "critical", client: "NovaTech", message: "DDoS attack detected — mitigation active", time: "35 min ago" },
];

const recentTickets = [
  { id: "TKT-4521", client: "Meridian Corp", subject: "Email server migration", priority: "high", status: "in-progress", sla: "2h remaining", slaPct: 75 },
  { id: "TKT-4520", client: "Atlas Industries", subject: "VPN connectivity issues", priority: "medium", status: "assigned", sla: "4h remaining", slaPct: 50 },
  { id: "TKT-4519", client: "Vertex Labs", subject: "New workstation setup x5", priority: "low", status: "queued", sla: "8h remaining", slaPct: 25 },
  { id: "TKT-4518", client: "Pinnacle Health", subject: "HIPAA compliance audit prep", priority: "high", status: "in-progress", sla: "1d remaining", slaPct: 90 },
];

const clients = [
  { name: "Meridian Corp", devices: 284, tickets: 3, health: 62, status: "at-risk", mrr: 14800, cost: 9200, churnRisk: 72, tickets30d: 14 },
  { name: "Atlas Industries", devices: 198, tickets: 1, health: 88, status: "healthy", mrr: 9400, cost: 5100, churnRisk: 18, tickets30d: 3 },
  { name: "Vertex Labs", devices: 156, tickets: 1, health: 95, status: "healthy", mrr: 7200, cost: 3800, churnRisk: 8, tickets30d: 2 },
  { name: "Pinnacle Health", devices: 312, tickets: 2, health: 74, status: "warning", mrr: 16200, cost: 10900, churnRisk: 41, tickets30d: 9 },
  { name: "NovaTech", devices: 89, tickets: 4, health: 41, status: "at-risk", mrr: 5100, cost: 4800, churnRisk: 84, tickets30d: 21 },
  { name: "Solaris Energy", devices: 245, tickets: 0, health: 98, status: "healthy", mrr: 11600, cost: 5800, churnRisk: 5, tickets30d: 1 },
];

const technicians = [
  { name: "J. Chen", skill: "Network", available: true, lat: 37.7, lon: -122.4, queue: 2, distance: "0.8 mi" },
  { name: "M. Rodriguez", skill: "Security", available: true, lat: 37.8, lon: -122.3, queue: 1, distance: "1.2 mi" },
  { name: "S. Park", skill: "Server", available: false, lat: 37.6, lon: -122.5, queue: 3, distance: "2.4 mi" },
  { name: "K. Wilson", skill: "Endpoint", available: true, lat: 37.9, lon: -122.2, queue: 0, distance: "3.1 mi" },
];

const slaBreaches = [
  { id: "TKT-4521", client: "Meridian Corp", subject: "Email server migration", hoursLeft: 1.8, tier: "P1", breachRisk: "critical" },
  { id: "TKT-4515", client: "NovaTech", subject: "DDoS remediation", hoursLeft: 0.4, tier: "P1", breachRisk: "imminent" },
  { id: "TKT-4509", client: "Pinnacle Health", subject: "DR test verification", hoursLeft: 4.2, tier: "P2", breachRisk: "warning" },
];

const suppressedAlerts = [
  { condition: "Backup completion events", count: 1247, client: "All", suppressed: true },
  { condition: "SSL renewal confirmations", count: 89, client: "All", suppressed: true },
  { condition: "Scheduled maintenance windows", count: 342, client: "Meridian Corp", suppressed: true },
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

function ClientProfitabilityPanel() {
  const [sortBy, setSortBy] = useState<"margin" | "churn">("margin");
  const sorted = [...clients].sort((a, b) => {
    if (sortBy === "margin") return (b.mrr - b.cost) - (a.mrr - a.cost);
    return b.churnRisk - a.churnRisk;
  });
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-display font-semibold flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-500" />
          Client Profitability
        </h2>
        <div className="flex items-center gap-1">
          <button onClick={() => setSortBy("margin")} className={`text-[10px] px-2 py-1 rounded transition-colors ${sortBy === "margin" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>By Margin</button>
          <button onClick={() => setSortBy("churn")} className={`text-[10px] px-2 py-1 rounded transition-colors ${sortBy === "churn" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>By Churn Risk</button>
        </div>
      </div>
      <div className="divide-y divide-border">
        {sorted.map((c) => {
          const margin = c.mrr - c.cost;
          const marginPct = Math.round((margin / c.mrr) * 100);
          return (
            <div key={c.name} className="px-4 py-3 flex items-center gap-4 hover:bg-muted/20 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">MRR: ${c.mrr.toLocaleString()} · Cost: ${c.cost.toLocaleString()}</p>
              </div>
              <div className="text-right shrink-0 w-28">
                <p className={`text-sm font-bold ${margin > 5000 ? "text-emerald-500" : margin > 2000 ? "text-amber-500" : "text-red-500"}`}>
                  ${margin.toLocaleString()} <span className="text-[10px]">({marginPct}%)</span>
                </p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] text-muted-foreground">Churn Risk:</span>
                  <span className={`text-[10px] font-bold ${c.churnRisk >= 70 ? "text-red-500" : c.churnRisk >= 40 ? "text-amber-500" : "text-emerald-500"}`}>{c.churnRisk}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">Total MRR: ${clients.reduce((s, c) => s + c.mrr, 0).toLocaleString()}</span>
        <span className="text-xs font-bold text-emerald-500">Avg Margin: {Math.round(clients.reduce((s, c) => s + (c.mrr - c.cost) / c.mrr * 100, 0) / clients.length)}%</span>
      </div>
    </div>
  );
}

function DispatchBoard() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-display font-semibold flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-500" />
          Technician Dispatch Board
        </h2>
        <span className="text-[10px] text-muted-foreground">Skill-matched · Proximity-routed</span>
      </div>
      <div className="divide-y divide-border">
        {technicians.map((t) => (
          <div key={t.name} className="px-4 py-3 flex items-center gap-4 hover:bg-muted/20 transition-colors">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${t.available ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-muted text-muted-foreground border border-border"}`}>
              {t.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{t.name}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-mono">{t.skill}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t.queue} in queue · {t.distance}</p>
            </div>
            <div className="text-right shrink-0">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.available ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                {t.available ? "Available" : "On-site"}
              </span>
              {t.available && (
                <button className="block ml-auto mt-1 text-[10px] text-primary hover:underline">Assign →</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SLABreachPrediction() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-display font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
          SLA Breach Prediction
        </h2>
        <span className="text-[10px] font-mono text-red-500">{slaBreaches.length} at risk</span>
      </div>
      <div className="divide-y divide-border">
        {slaBreaches.map((s) => (
          <div key={s.id} className={`px-4 py-3 hover:bg-muted/20 transition-colors ${s.breachRisk === "imminent" ? "bg-red-500/5" : ""}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">{s.id}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-mono">{s.tier}</span>
              </div>
              <span className={`text-[10px] font-bold ${s.breachRisk === "imminent" ? "text-red-500 animate-pulse" : s.breachRisk === "critical" ? "text-orange-500" : "text-amber-500"}`}>
                {s.breachRisk === "imminent" ? "⚠ IMMINENT" : s.breachRisk === "critical" ? "● Critical" : "● Warning"}
              </span>
            </div>
            <p className="text-sm font-medium truncate">{s.subject}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">{s.client}</p>
              <p className={`text-xs font-mono font-bold flex items-center gap-1 ${s.hoursLeft < 1 ? "text-red-500" : s.hoursLeft < 3 ? "text-orange-500" : "text-amber-500"}`}>
                <Clock className="w-3 h-3" />{s.hoursLeft}h until breach
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertSuppressionPanel() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-display font-semibold flex items-center gap-2">
          <Bell className="w-4 h-4 text-violet-500" />
          Intelligent Alert Suppression
        </h2>
        <span className="text-[10px] text-emerald-500 font-mono">1,678 suppressed today</span>
      </div>
      <div className="divide-y divide-border">
        {suppressedAlerts.map((a) => (
          <div key={a.condition} className="px-4 py-3 flex items-center gap-4 hover:bg-muted/20 transition-colors">
            <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{a.condition}</p>
              <p className="text-xs text-muted-foreground">{a.client}</p>
            </div>
            <span className="text-sm font-bold text-muted-foreground shrink-0 font-mono">{a.count.toLocaleString()}</span>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-border">
        <p className="text-[10px] text-muted-foreground text-center">1,200+ pre-built suppression conditions · Mock Data</p>
      </div>
    </div>
  );
}

function ClientChurnHeatmap() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="font-display font-semibold flex items-center gap-2 mb-4">
        <Star className="w-4 h-4 text-amber-500" />
        Client Health Scoring — Churn Risk
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {clients.map((c) => (
          <div key={c.name} className={`rounded-lg p-3 border ${c.churnRisk >= 70 ? "border-red-500/20 bg-red-500/5" : c.churnRisk >= 40 ? "border-amber-500/20 bg-amber-500/5" : "border-emerald-500/20 bg-emerald-500/5"}`}>
            <p className="text-xs font-semibold truncate">{c.name}</p>
            <div className="flex items-end justify-between mt-2">
              <div>
                <p className="text-[10px] text-muted-foreground">Tickets/30d</p>
                <p className="text-sm font-bold">{c.tickets30d}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Churn Risk</p>
                <p className={`text-lg font-bold ${c.churnRisk >= 70 ? "text-red-500" : c.churnRisk >= 40 ? "text-amber-500" : "text-emerald-500"}`}>{c.churnRisk}%</p>
              </div>
            </div>
            <div className="h-1 bg-border rounded-full mt-2 overflow-hidden">
              <div className={`h-full rounded-full ${c.churnRisk >= 70 ? "bg-red-500" : c.churnRisk >= 40 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${c.churnRisk}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
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

      {/* SLA Breach + Dispatch + Alert Suppression */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SLABreachPrediction />
        <DispatchBoard />
        <AlertSuppressionPanel />
      </div>

      {/* Profitability Calculator */}
      <ClientProfitabilityPanel />

      {/* Churn Risk Heatmap */}
      <ClientChurnHeatmap />

      {/* Client Health Table + NOC Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
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
