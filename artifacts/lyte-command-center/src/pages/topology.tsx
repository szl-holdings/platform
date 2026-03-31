import { Network, Server, Database, Globe, Cloud, Shield, Wifi, ArrowRight, Activity, AlertTriangle } from "lucide-react";

interface ServiceNode {
  id: string;
  name: string;
  type: "service" | "database" | "cdn" | "gateway" | "queue" | "cache";
  status: "healthy" | "degraded" | "down";
  region: string;
  latency: string;
  load: number;
  connections: string[];
}

const services: ServiceNode[] = [
  { id: "gw-1", name: "API Gateway", type: "gateway", status: "healthy", region: "us-east-1", latency: "12ms", load: 45, connections: ["svc-auth", "svc-core", "svc-data"] },
  { id: "svc-auth", name: "Auth Service", type: "service", status: "healthy", region: "us-east-1", latency: "8ms", load: 32, connections: ["db-users", "cache-sessions"] },
  { id: "svc-core", name: "Core Engine", type: "service", status: "degraded", region: "us-east-1", latency: "45ms", load: 89, connections: ["db-main", "queue-events", "svc-data"] },
  { id: "svc-data", name: "Data Pipeline", type: "service", status: "healthy", region: "us-west-2", latency: "22ms", load: 61, connections: ["db-analytics", "cache-results"] },
  { id: "db-main", name: "Primary DB", type: "database", status: "healthy", region: "us-east-1", latency: "3ms", load: 72, connections: [] },
  { id: "db-users", name: "Users DB", type: "database", status: "healthy", region: "us-east-1", latency: "2ms", load: 28, connections: [] },
  { id: "db-analytics", name: "Analytics DB", type: "database", status: "healthy", region: "us-west-2", latency: "5ms", load: 55, connections: [] },
  { id: "cache-sessions", name: "Session Cache", type: "cache", status: "healthy", region: "us-east-1", latency: "1ms", load: 40, connections: [] },
  { id: "cache-results", name: "Results Cache", type: "cache", status: "healthy", region: "us-west-2", latency: "1ms", load: 35, connections: [] },
  { id: "queue-events", name: "Event Queue", type: "queue", status: "healthy", region: "us-east-1", latency: "4ms", load: 62, connections: ["svc-data"] },
  { id: "cdn-1", name: "CDN Edge", type: "cdn", status: "healthy", region: "Global", latency: "15ms", load: 38, connections: ["gw-1"] },
];

const typeIcons: Record<string, typeof Server> = {
  service: Server, database: Database, cdn: Globe, gateway: Shield, queue: Activity, cache: Wifi,
};

const statusStyles: Record<string, { dot: string; bg: string }> = {
  healthy: { dot: "bg-[#6b8f71]", bg: "border-[#6b8f71]/20" },
  degraded: { dot: "bg-[#d4a054] animate-pulse", bg: "border-[#d4a054]/30 bg-[#d4a054]/5" },
  down: { dot: "bg-[#c45a4a] animate-pulse", bg: "border-[#c45a4a]/30 bg-[#c45a4a]/5" },
};

const regions = [...new Set(services.map(s => s.region))];

export default function Topology() {
  const healthyCount = services.filter(s => s.status === "healthy").length;
  const degradedCount = services.filter(s => s.status === "degraded").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Network className="w-6 h-6 text-primary" /> Infrastructure Topology
        </h1>
        <p className="text-sm text-muted-foreground mt-1">System dependency mapping and cross-service navigation</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <Server className="w-5 h-5 text-[#4a90b8]" />
          <div><div className="text-xl font-bold">{services.length}</div><div className="text-xs text-muted-foreground">Total Services</div></div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <Activity className="w-5 h-5 text-[#6b8f71]" />
          <div><div className="text-xl font-bold">{healthyCount}</div><div className="text-xs text-muted-foreground">Healthy</div></div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-[#d4a054]" />
          <div><div className="text-xl font-bold">{degradedCount}</div><div className="text-xs text-muted-foreground">Degraded</div></div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <Globe className="w-5 h-5 text-violet-400" />
          <div><div className="text-xl font-bold">{regions.length}</div><div className="text-xs text-muted-foreground">Regions</div></div>
        </div>
      </div>

      {regions.map((region) => (
        <div key={region} className="rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Cloud className="w-4 h-4 text-[#4a90b8]" />
            <h2 className="font-display font-semibold">{region}</h2>
            <span className="text-xs text-muted-foreground">({services.filter(s => s.region === region).length} services)</span>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {services.filter(s => s.region === region).map((svc) => {
              const Icon = typeIcons[svc.type] || Server;
              const st = statusStyles[svc.status];
              return (
                <div key={svc.id} className={`rounded-lg border p-4 ${st.bg} hover:bg-muted/30 transition-colors cursor-pointer`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">{svc.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                      <span className="text-xs capitalize text-muted-foreground">{svc.status}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div><span className="text-muted-foreground">Latency:</span> <span className="font-medium">{svc.latency}</span></div>
                    <div><span className="text-muted-foreground">Load:</span> <span className={`font-medium ${svc.load > 80 ? "text-[#c45a4a]" : svc.load > 60 ? "text-[#d4a054]" : "text-[#6b8f71]"}`}>{svc.load}%</span></div>
                    <div><span className="text-muted-foreground">Type:</span> <span className="font-medium capitalize">{svc.type}</span></div>
                  </div>
                  {svc.connections.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-wrap">
                      <ArrowRight className="w-3 h-3" />
                      {svc.connections.map((c) => (
                        <span key={c} className="px-1.5 py-0.5 rounded bg-muted">{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
