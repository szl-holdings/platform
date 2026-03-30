import { Server, Globe, Database, Shield, Network, HardDrive, Bell, Lock, Box, Cloud, Layers, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const infraModules = [
  { name: "Container App", icon: Box, status: "healthy", type: "Compute", details: "Azure Container Apps", config: { cpu: "2 vCPU", memory: "4 GiB", replicas: "2-8 (auto-scale)", image: "szl-platform:latest", ingress: "External (HTTPS)" } },
  { name: "Front Door", icon: Globe, status: "healthy", type: "CDN/WAF", details: "Azure Front Door Premium", config: { tier: "Premium", waf: "Enabled (Prevention)", caching: "Enabled", ssl: "Managed Certificate", origins: "3 backends" } },
  { name: "PostgreSQL", icon: Database, status: "healthy", type: "Database", details: "Azure Database for PostgreSQL", config: { tier: "Flexible Server", version: "16", sku: "GP_Standard_D2ds_v5", storage: "128 GB (auto-grow)", ha: "Zone-redundant", backup: "35 day retention" } },
  { name: "Redis Cache", icon: HardDrive, status: "healthy", type: "Cache", details: "Azure Cache for Redis", config: { tier: "Standard C1", size: "2.5 GB", version: "7.0", tls: "Required", eviction: "allkeys-lru" } },
  { name: "Key Vault", icon: Lock, status: "healthy", type: "Secrets", details: "Azure Key Vault", config: { sku: "Standard", softDelete: "Enabled", purgeProtection: "Enabled", secrets: "24 managed", rbac: "RBAC authorization" } },
  { name: "Virtual Network", icon: Network, status: "healthy", type: "Networking", details: "Azure VNet", config: { addressSpace: "10.0.0.0/16", subnets: "4 (app, db, cache, services)", nsg: "3 security groups", peering: "Hub-spoke topology", dnsZones: "2 private zones" } },
  { name: "Storage Account", icon: HardDrive, status: "healthy", type: "Storage", details: "Azure Blob Storage", config: { tier: "Standard LRS", kind: "StorageV2", containers: "4 (assets, backups, logs, uploads)", lifecycle: "30-day cool tier policy", encryption: "Microsoft-managed keys" } },
  { name: "Alerting", icon: Bell, status: "healthy", type: "Monitoring", details: "Azure Monitor & Alerts", config: { actionGroups: "2 (ops-team, critical)", rules: "18 alert rules", logAnalytics: "90-day retention", appInsights: "Enabled", budgetAlerts: "$5K threshold" } },
];

const topology = [
  { from: "Front Door", to: "Container App", protocol: "HTTPS", latency: "< 5ms" },
  { from: "Container App", to: "PostgreSQL", protocol: "TCP/5432", latency: "< 2ms" },
  { from: "Container App", to: "Redis Cache", protocol: "TCP/6380 (TLS)", latency: "< 1ms" },
  { from: "Container App", to: "Key Vault", protocol: "HTTPS", latency: "< 3ms" },
  { from: "Container App", to: "Storage Account", protocol: "HTTPS", latency: "< 5ms" },
];

export default function Infrastructure() {
  const healthyCount = infraModules.filter(m => m.status === "healthy").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-3">
          <Cloud className="w-5 h-5 text-primary" />
          Infrastructure Architecture
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Azure production stack topology from Bicep deployment templates</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Modules</p>
          <p className="text-2xl font-semibold text-foreground">{infraModules.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Healthy</p>
          <p className="text-2xl font-semibold text-emerald-400">{healthyCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Connections</p>
          <p className="text-2xl font-semibold text-cyan-400">{topology.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Cloud</p>
          <p className="text-2xl font-semibold text-foreground">Azure</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" /> Network Topology
        </h3>
        <div className="space-y-2">
          {topology.map((t, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/20">
              <span className="text-sm font-medium text-foreground w-40">{t.from}</span>
              <div className="flex-1 flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-mono text-primary px-2 py-1 rounded bg-primary/10">{t.protocol}</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <span className="text-sm font-medium text-foreground w-40 text-right">{t.to}</span>
              <span className="text-xs text-muted-foreground w-16 text-right">{t.latency}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {infraModules.map((mod) => {
          const ModIcon = mod.icon;
          return (
            <div key={mod.name} className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ModIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">{mod.name}</h3>
                  <p className="text-xs text-muted-foreground">{mod.details}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted">{mod.type}</span>
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {mod.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(mod.config).map(([key, value]) => (
                  <div key={key} className="text-xs">
                    <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1").trim()}: </span>
                    <span className="text-foreground font-mono">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
