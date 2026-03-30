import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Activity, Clock, Bell, Shield, Wifi, Server, Database, Mail, Cloud, Monitor, ArrowUpRight, XCircle, Eye } from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";
import { alerts, uptimeData, incidentTimeline } from "@/data/mock-data";

function UptimeBar({ service, uptime, incidents }: { service: string; uptime: number; incidents: number }) {
  const color = uptime >= 99.9 ? "bg-emerald-400" : uptime >= 99 ? "bg-amber-400" : "bg-red-400";
  const textColor = uptime >= 99.9 ? "text-emerald-400" : uptime >= 99 ? "text-amber-400" : "text-red-400";
  return (
    <div className="flex items-center gap-4 py-2">
      <div className="w-40 text-sm text-foreground truncate">{service}</div>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${uptime}%` }} />
      </div>
      <span className={cn("text-sm font-mono w-16 text-right", textColor)}>{uptime}%</span>
      <span className="text-xs text-muted-foreground w-20 text-right">{incidents} incident{incidents !== 1 ? "s" : ""}</span>
    </div>
  );
}

function AlertRow({ alert, index }: { alert: typeof alerts[0]; index: number }) {
  const severityConfig = {
    critical: { color: "text-red-400 bg-red-500/10", icon: XCircle },
    warning: { color: "text-amber-400 bg-amber-500/10", icon: AlertTriangle },
    info: { color: "text-blue-400 bg-blue-500/10", icon: Activity },
  };
  const config = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.info;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className={cn("flex items-center gap-3 px-4 py-3 border-b border-border/30 hover:bg-muted/20 transition-colors", alert.severity === "critical" && !alert.acknowledged && "bg-red-500/5")}
    >
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", config.color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{alert.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{alert.source}</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">{alert.client}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {alert.acknowledged && <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> ACK</span>}
        <span className="text-xs text-muted-foreground">{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </motion.div>
  );
}

export default function NOCPage() {
  const criticalCount = alerts.filter(a => a.severity === "critical").length;
  const warningCount = alerts.filter(a => a.severity === "warning").length;
  const unacknowledged = alerts.filter(a => !a.acknowledged).length;
  const avgUptime = Math.round(uptimeData.reduce((s, u) => s + u.uptime, 0) / uptimeData.length * 100) / 100;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">NOC Operations</h1>
          <p className="text-sm text-muted-foreground mt-1">Network Operations Center — Real-time monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm text-emerald-400 font-medium">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Critical Alerts", value: criticalCount.toString(), color: "text-red-400", icon: XCircle },
          { label: "Warnings", value: warningCount.toString(), color: "text-amber-400", icon: AlertTriangle },
          { label: "Unacknowledged", value: unacknowledged.toString(), color: "text-orange-400", icon: Bell },
          { label: "Avg Uptime (30d)", value: `${avgUptime}%`, color: "text-emerald-400", icon: Activity },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
              <stat.icon className={cn("w-4 h-4", stat.color)} />
            </div>
            <p className={cn("text-3xl font-display font-bold mt-2", stat.color)}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass-card rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Active Alerts</h2>
            <span className="text-xs text-muted-foreground">{alerts.length} total</span>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {alerts.map((alert, i) => (
              <AlertRow key={alert.id} alert={alert} index={i} />
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
             <Eye className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-foreground">Incident Timeline</h2>
          </div>
          <div className="p-4 space-y-0 max-h-[500px] overflow-y-auto">
            {incidentTimeline.map((event, i) => {
              const color = event.severity === "critical" ? "bg-red-400" : event.severity === "warning" ? "bg-amber-400" : "bg-blue-400";
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  className="flex gap-3 pb-4 relative"
                >
                  <div className="flex flex-col items-center">
                    <div className={cn("w-2.5 h-2.5 rounded-full shrink-0 mt-1.5", color)} />
                    {i < incidentTimeline.length - 1 && <div className="w-px flex-1 bg-border/40 mt-1" />}
                  </div>
                  <div className="pb-1">
                    <p className="text-xs font-mono text-muted-foreground mb-0.5">{event.time}</p>
                    <p className="text-sm text-foreground">{event.event}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Service Uptime (30 Days)</h2>
          <span className={cn("text-sm font-mono", avgUptime >= 99.5 ? "text-emerald-400" : "text-amber-400")}>Avg: {avgUptime}%</span>
        </div>
        <div className="space-y-1">
          {uptimeData.map(u => (
            <UptimeBar key={u.service} {...u} />
          ))}
        </div>
      </div>
    </div>
  );
}
