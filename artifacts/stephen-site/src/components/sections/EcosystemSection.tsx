import { motion } from "framer-motion";
import { Activity, CheckCircle2, AlertTriangle, XCircle, Link as LinkIcon } from "lucide-react";
import { useGetStephenEcosystemStatus } from "@workspace/api-client-react";
import { format } from "date-fns";

export function EcosystemSection() {
  const { data: statusData, isLoading } = useGetStephenEcosystemStatus();

  const ecosystem = statusData || {
    apps: [
      { name: "Vessels App", slug: "vessels", description: "Integration Core", status: "operational", lastChecked: new Date().toISOString() },
      { name: "Firestorm API", slug: "firestorm", description: "Data Analytics", status: "degraded", lastChecked: new Date().toISOString() },
      { name: "Lyte Auth", slug: "lyte", description: "Identity Provider", status: "operational", lastChecked: new Date().toISOString() },
      { name: "Dreamscape", slug: "dreamscape", description: "Frontend Services", status: "maintenance", lastChecked: new Date().toISOString() },
    ],
    connectors: [
      { name: "GitHub", slug: "github", status: "connected", lastChecked: new Date().toISOString() },
      { name: "Stripe", slug: "stripe", status: "connected", lastChecked: new Date().toISOString() },
      { name: "Google Calendar", slug: "gcal", status: "error", lastChecked: new Date().toISOString() },
      { name: "Notion", slug: "notion", status: "connected", lastChecked: new Date().toISOString() },
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
      case "operational": case "connected": return <CheckCircle2 size={16} />;
      case "degraded": case "maintenance": return <AlertTriangle size={16} />;
      case "down": case "error": case "disconnected": return <XCircle size={16} />;
      default: return <Activity size={16} />;
    }
  };

  return (
    <section id="ecosystem" className="py-24 bg-secondary/20 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex flex-col md:flex-row items-center justify-between mb-16">
          <div>
            <h2 className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">Command Center</h2>
            <h3 className="text-4xl font-serif font-bold text-foreground">Live Ecosystem Status</h3>
          </div>
          <div className="mt-6 md:mt-0 flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-muted-foreground font-mono">System Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-lg font-semibold text-foreground mb-6">Core Applications</h4>
            {ecosystem.apps.map((app, idx) => (
              <motion.div
                key={`app-${app.slug || app.name || idx}`}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                whileHover={{ x: 4 }}
                className="glass-panel p-5 rounded-xl flex items-center justify-between hover:border-primary/20 transition-all duration-300"
              >
                <div>
                  <h5 className="font-bold text-foreground">{app.name}</h5>
                  <p className="text-sm text-muted-foreground">{app.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground font-mono hidden sm:block">
                    Pinged: {app.lastChecked ? format(new Date(app.lastChecked), "HH:mm:ss") : "--:--:--"}
                  </span>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium capitalize ${getStatusColor(app.status)}`}>
                    {getStatusIcon(app.status)}
                    {app.status}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground mb-6">Integrations</h4>
            <div className="glass-panel p-6 rounded-2xl grid grid-cols-1 gap-4">
              {ecosystem.connectors.map((connector, idx) => (
                <motion.div
                  key={`connector-${connector.slug || connector.name || idx}`}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  whileHover={{ x: -2 }}
                  className="flex items-center justify-between pb-4 border-b border-white/5 last:border-0 last:pb-0 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-foreground">
                      <LinkIcon size={14} />
                    </div>
                    <span className="font-medium text-foreground">{connector.name}</span>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(connector.status).split(' ')[0].replace('text-', 'bg-')}`}
                       title={connector.status} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
