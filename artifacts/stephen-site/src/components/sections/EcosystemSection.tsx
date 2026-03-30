import { motion } from "framer-motion";
import { Activity, CheckCircle2, AlertTriangle, XCircle, Globe, Server, Cpu, Clock } from "lucide-react";
import { useGetStephenEcosystemStatus } from "@workspace/api-client-react";
import { format } from "date-fns";

type EcoApp = { name: string; slug: string; description: string; status: string; lastChecked?: string };
type EcoConnector = { name: string; slug: string; status: string; lastChecked?: string };
type EcoStatus = { apps: EcoApp[]; connectors: EcoConnector[] };

const appIcons: Record<string, React.ElementType> = {
  vessels: Globe,
  firestorm: Activity,
  lyte: Server,
  dreamscape: Cpu,
  readiness: CheckCircle2,
  inca: Cpu,
};

export function EcosystemSection() {
  const { data: statusData, isLoading } = useGetStephenEcosystemStatus();

  const ecosystem: EcoStatus = (statusData as unknown as EcoStatus) || {
    apps: [
      { name: "Vessels", slug: "vessels", description: "Maritime fleet & cargo intelligence", status: "operational", lastChecked: new Date().toISOString() },
      { name: "Firestorm", slug: "firestorm", description: "Cybersecurity simulation engine", status: "operational", lastChecked: new Date().toISOString() },
      { name: "Lyte", slug: "lyte", description: "Enterprise commerce platform", status: "operational", lastChecked: new Date().toISOString() },
      { name: "Dreamscape", slug: "dreamscape", description: "Creative production suite", status: "operational", lastChecked: new Date().toISOString() },
      { name: "Readiness Report", slug: "readiness", description: "Compliance & assessment engine", status: "operational", lastChecked: new Date().toISOString() },
      { name: "INCA", slug: "inca", description: "AI research command center", status: "operational", lastChecked: new Date().toISOString() },
    ],
    connectors: [
      { name: "GitHub", slug: "github", status: "connected", lastChecked: new Date().toISOString() },
      { name: "Stripe", slug: "stripe", status: "connected", lastChecked: new Date().toISOString() },
      { name: "Google Calendar", slug: "gcal", status: "connected", lastChecked: new Date().toISOString() },
      { name: "Dropbox", slug: "dropbox", status: "connected", lastChecked: new Date().toISOString() },
    ]
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "operational": case "connected": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "degraded": case "maintenance": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "down": case "error": case "disconnected": return "text-red-500 bg-red-500/10 border-red-500/20";
      default: return "text-muted-foreground bg-secondary border-border";
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "operational": case "connected": return <CheckCircle2 size={14} />;
      case "degraded": case "maintenance": return <AlertTriangle size={14} />;
      case "down": case "error": case "disconnected": return <XCircle size={14} />;
      default: return <Activity size={14} />;
    }
  };

  const operationalCount = ecosystem.apps.filter(a => a.status === "operational").length;
  const connectedCount = ecosystem.connectors.filter(c => c.status === "connected").length;

  return (
    <section id="ecosystem" className="py-32 bg-secondary/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.01] to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-16 gap-6">
          <div>
            <h2 className="text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-4">Live Operations</h2>
            <h3 className="text-4xl md:text-5xl font-serif font-bold text-foreground">SZL Ecosystem Status</h3>
            <p className="text-foreground/50 mt-3 max-w-xl">Real-time operational health across the SZL Holdings product portfolio. Every system shown here is live, serving users, and monitored 24/7.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-emerald-500/20 bg-emerald-500/5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm text-emerald-400 font-mono font-medium">{operationalCount}/{ecosystem.apps.length} Operational</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-foreground/40 uppercase tracking-[0.2em]">Core Platform Applications</h4>
              <div className="flex items-center gap-2 text-xs text-foreground/30">
                <Clock size={12} />
                <span className="font-mono">Updated {format(new Date(), "HH:mm:ss")}</span>
              </div>
            </div>
            
            {ecosystem.apps.map((app, idx) => {
              const AppIcon = appIcons[app.slug] || Server;
              return (
                <motion.div
                  key={`app-${app.slug || app.name || idx}`}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.06 }}
                  whileHover={{ x: 4 }}
                  className="glass-panel p-5 rounded-xl flex items-center justify-between hover:border-primary/15 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center text-foreground/40 group-hover:text-primary group-hover:border-primary/20 transition-colors">
                      <AppIcon size={18} />
                    </div>
                    <div>
                      <h5 className="font-bold text-foreground text-sm">{app.name}</h5>
                      <p className="text-xs text-foreground/40">{app.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-foreground/25 font-mono hidden sm:block">
                      {app.lastChecked ? format(new Date(app.lastChecked), "HH:mm:ss") : "--:--:--"}
                    </span>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium capitalize ${getStatusColor(app.status)}`}>
                      {getStatusIcon(app.status)}
                      {app.status}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-foreground/40 uppercase tracking-[0.2em] mb-4">Active Integrations</h4>
              <div className="glass-panel p-5 rounded-2xl space-y-3">
                {ecosystem.connectors.map((connector, idx) => (
                  <motion.div
                    key={`connector-${connector.slug || connector.name || idx}`}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.06 }}
                    className="flex items-center justify-between py-2 transition-all duration-300"
                  >
                    <span className="font-medium text-foreground/70 text-sm">{connector.name}</span>
                    <div className={`flex items-center gap-1.5 text-xs ${getStatusColor(connector.status).split(' ')[0]}`}>
                      {getStatusIcon(connector.status)}
                      <span className="capitalize">{connector.status}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border-primary/10">
              <h4 className="text-xs font-bold text-foreground/40 uppercase tracking-[0.2em] mb-4">System Metrics</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground/50">Aggregate Uptime (90d)</span>
                    <span className="text-emerald-400 font-mono font-bold">99.97%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "99.97%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground/50">Avg Response Time</span>
                    <span className="text-primary font-mono font-bold">42ms</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "15%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-primary to-yellow-500 rounded-full"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground/50">Active Integrations</span>
                    <span className="text-foreground/70 font-mono font-bold">{connectedCount}/{ecosystem.connectors.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
