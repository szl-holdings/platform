import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ServiceHealth } from "@/lib/api";
import { useState } from "react";
import { Wifi, WifiOff, Server, RefreshCw, Zap, Search, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Clock, Activity, Power, ShieldCheck } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  if (status === "LIVE_CONFIGURED") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
        <Wifi className="w-3 h-3" /> Live
      </span>
    );
  }
  if (status === "MOCKED_DEMO_MODE") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
        <Server className="w-3 h-3" /> Demo Mode
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
      <WifiOff className="w-3 h-3" /> Not Configured
    </span>
  );
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function IntegrationHealthPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [testingConnector, setTestingConnector] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["integration-health"],
    queryFn: api.getIntegrationHealth,
    refetchInterval: 30000,
  });

  const testMutation = useMutation({
    mutationFn: api.testConnector,
    onSettled: () => {
      setTestingConnector(null);
      queryClient.invalidateQueries({ queryKey: ["integration-health"] });
      queryClient.invalidateQueries({ queryKey: ["integration-activity"] });
      queryClient.invalidateQueries({ queryKey: ["health-summary"] });
    },
  });

  const verifyAllMutation = useMutation({
    mutationFn: api.verifyAll,
    onSettled: () => {
      setIsVerifying(false);
      queryClient.invalidateQueries({ queryKey: ["integration-health"] });
      queryClient.invalidateQueries({ queryKey: ["integration-activity"] });
      queryClient.invalidateQueries({ queryKey: ["health-summary"] });
    },
  });

  const enableMutation = useMutation({
    mutationFn: ({ name, enabled }: { name: string; enabled: boolean }) => api.setConnectorEnabled(name, enabled),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["integration-health"] });
      queryClient.invalidateQueries({ queryKey: ["integration-activity"] });
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredServices = data.overall.services.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Integration Health</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time connectivity status across all {data.overall.summary.total} integrations</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setIsVerifying(true); verifyAllMutation.mutate(); }}
            disabled={isVerifying}
            className="inline-flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-md border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {isVerifying ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
            Verify All
          </button>
          <SummaryPill label="Live" count={data.overall.summary.liveConfigured} color="emerald" />
          <SummaryPill label="Demo" count={data.overall.summary.mockedDemoMode} color="amber" />
          <SummaryPill label="Down" count={data.overall.summary.manualRequired} color="red" />
        </div>
      </div>

      {data.alerts.unhealthyCount > 0 && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-red-400">{data.alerts.unhealthyCount} connector(s) require attention</div>
            <div className="text-xs text-muted-foreground mt-1">
              {data.alerts.unhealthyConnectors.join(", ")} — missing required configuration
            </div>
          </div>
        </div>
      )}

      {data.alerts.demoCount > 0 && data.alerts.unhealthyCount === 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
          <Server className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-amber-400">{data.alerts.demoCount} connector(s) running in demo mode</div>
            <div className="text-xs text-muted-foreground mt-1">Using simulated data. Configure environment variables for live data.</div>
          </div>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search integrations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Integration</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Last Checked</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">Response</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">Errors</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredServices.map((svc) => (
              <ConnectorRow
                key={svc.name}
                service={svc}
                isTesting={testingConnector === svc.name}
                onTest={() => {
                  setTestingConnector(svc.name);
                  testMutation.mutate(svc.name);
                }}
                onToggleEnabled={(enabled) => enableMutation.mutate({ name: svc.name, enabled })}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-4">Per-App Integration Status</h2>
        <div className="space-y-3">
          {Object.values(data.perApp).map((appData) => (
            <AppHealthCard
              key={appData.slug}
              appData={appData}
              isExpanded={expandedApp === appData.slug}
              onToggle={() => setExpandedApp(expandedApp === appData.slug ? null : appData.slug)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AppHealthCard({ appData, isExpanded, onToggle }: {
  appData: { slug: string; name: string; connectors: string[]; health: { services: ServiceHealth[]; summary: { liveConfigured: number; mockedDemoMode: number; manualRequired: number } } };
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const queryClient = useQueryClient();
  const [isTesting, setIsTesting] = useState(false);
  const testAllMutation = useMutation({
    mutationFn: () => api.testAppConnectors(appData.slug),
    onSettled: () => {
      setIsTesting(false);
      queryClient.invalidateQueries({ queryKey: ["integration-health"] });
      queryClient.invalidateQueries({ queryKey: ["integration-activity"] });
    },
  });

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
        <button onClick={onToggle} className="flex items-center gap-3 flex-1 text-left">
          <span className="text-sm font-medium">{appData.name}</span>
          <span className="text-xs text-muted-foreground">{appData.connectors.length} integrations</span>
          <AppHealthBadges health={appData.health.summary} />
          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setIsTesting(true); testAllMutation.mutate(); }}
          disabled={isTesting}
          className="inline-flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-md border border-border bg-muted/40 hover:bg-muted transition-colors disabled:opacity-50 ml-2"
        >
          {isTesting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
          Test All
        </button>
      </div>
      {isExpanded && (
        <div className="border-t border-border p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {appData.health.services.map((svc) => (
              <AppConnectorCard key={svc.name} service={svc} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AppConnectorCard({ service }: { service: ServiceHealth }) {
  const queryClient = useQueryClient();
  const [isTesting, setIsTesting] = useState(false);
  const testMutation = useMutation({
    mutationFn: () => api.testConnector(service.name),
    onSettled: () => {
      setIsTesting(false);
      queryClient.invalidateQueries({ queryKey: ["integration-health"] });
      queryClient.invalidateQueries({ queryKey: ["integration-activity"] });
    },
  });

  return (
    <div className="flex items-center gap-3 p-3 rounded-md bg-muted/30 border border-border/50">
      <StatusIcon status={service.status} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{service.name}</div>
        <div className="text-xs text-muted-foreground truncate">{service.description}</div>
        {service.lastChecked && (
          <div className="text-xs text-muted-foreground mt-0.5">{timeAgo(service.lastChecked)} · {service.responseTimeMs !== null ? `${service.responseTimeMs}ms` : ""}</div>
        )}
      </div>
      <button
        onClick={() => { setIsTesting(true); testMutation.mutate(); }}
        disabled={isTesting}
        className="inline-flex items-center gap-1 text-xs py-1 px-2 rounded border border-border bg-muted/40 hover:bg-muted transition-colors disabled:opacity-50 shrink-0"
      >
        {isTesting ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Zap className="w-2.5 h-2.5" />}
        Test
      </button>
    </div>
  );
}

function RetryBadge({ retryState, consecutiveFailures }: { retryState: string; consecutiveFailures: number }) {
  if (retryState === "idle") return null;
  if (retryState === "retrying") {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
        <RefreshCw className="w-2.5 h-2.5" /> {consecutiveFailures} fail{consecutiveFailures > 1 ? "s" : ""}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
      <AlertTriangle className="w-2.5 h-2.5" /> Failed ({consecutiveFailures}x)
    </span>
  );
}

function ConnectorRow({ service, isTesting, onTest, onToggleEnabled }: { service: ServiceHealth; isTesting: boolean; onTest: () => void; onToggleEnabled: (enabled: boolean) => void }) {
  return (
    <tr className={`border-b border-border/50 hover:bg-muted/10 transition-colors ${!service.enabled ? "opacity-50" : ""}`}>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="font-medium">{service.name}</div>
          <RetryBadge retryState={service.retryState} consecutiveFailures={service.consecutiveFailures} />
        </div>
        <div className="text-xs text-muted-foreground line-clamp-1">{service.description}</div>
        {service.lastSuccessfulCheck && (
          <div className="text-xs text-muted-foreground/60">Last success: {timeAgo(service.lastSuccessfulCheck)}</div>
        )}
      </td>
      <td className="py-3 px-4">
        {service.enabled ? <StatusBadge status={service.status} /> : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
            <Power className="w-3 h-3" /> Disabled
          </span>
        )}
      </td>
      <td className="py-3 px-4 hidden md:table-cell">
        <span className="text-xs text-muted-foreground">{timeAgo(service.lastChecked)}</span>
      </td>
      <td className="py-3 px-4 hidden lg:table-cell">
        <span className="text-xs font-mono text-muted-foreground">
          {service.responseTimeMs !== null ? `${service.responseTimeMs}ms` : "—"}
        </span>
      </td>
      <td className="py-3 px-4 hidden lg:table-cell">
        {service.errorCount > 0 ? (
          <span className="text-xs font-medium text-red-400">{service.errorCount}</span>
        ) : (
          <span className="text-xs text-muted-foreground">0</span>
        )}
      </td>
      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => onToggleEnabled(!service.enabled)}
            className={`inline-flex items-center gap-1 text-xs py-1 px-2 rounded border transition-colors ${service.enabled ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" : "border-border text-muted-foreground hover:bg-muted"}`}
            title={service.enabled ? "Disable connector" : "Enable connector"}
          >
            <Power className="w-3 h-3" />
          </button>
          <button
            onClick={onTest}
            disabled={isTesting || !service.enabled}
            className="inline-flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-md border border-border bg-muted/40 hover:bg-muted transition-colors disabled:opacity-50"
          >
            {isTesting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            Test
          </button>
        </div>
      </td>
    </tr>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "LIVE_CONFIGURED") return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
  if (status === "MOCKED_DEMO_MODE") return <Server className="w-4 h-4 text-amber-400 shrink-0" />;
  return <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />;
}

function AppHealthBadges({ health }: { health: { liveConfigured: number; mockedDemoMode: number; manualRequired: number } }) {
  return (
    <div className="flex gap-1.5">
      {health.liveConfigured > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">{health.liveConfigured} live</span>}
      {health.mockedDemoMode > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">{health.mockedDemoMode} demo</span>}
      {health.manualRequired > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">{health.manualRequired} down</span>}
    </div>
  );
}

function SummaryPill({ label, count, color }: { label: string; count: number; color: string }) {
  const styles: Record<string, string> = {
    emerald: "text-emerald-400 bg-emerald-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    red: "text-red-400 bg-red-500/10",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${styles[color]}`}>
      {count} {label}
    </span>
  );
}
