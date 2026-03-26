import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ConnectorDetail } from "@/lib/api";
import { useState } from "react";
import { Wifi, WifiOff, Server, RefreshCw, Zap, Search, Filter } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  Payments: "text-green-400 bg-green-500/10 border-green-500/30",
  Development: "text-violet-400 bg-violet-500/10 border-violet-500/30",
  Communication: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  Productivity: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  Storage: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  Platform: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  Data: "text-teal-400 bg-teal-500/10 border-teal-500/30",
  Logistics: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  Observability: "text-rose-400 bg-rose-500/10 border-rose-500/30",
  Analytics: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
  CRM: "text-pink-400 bg-pink-500/10 border-pink-500/30",
  "AI & ML": "text-sky-400 bg-sky-500/10 border-sky-500/30",
  Design: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30",
  Other: "text-gray-400 bg-gray-500/10 border-gray-500/30",
};

const STATUS_BORDER: Record<string, string> = {
  LIVE_CONFIGURED: "border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-emerald-500/5",
  MOCKED_DEMO_MODE: "border-amber-500/20 hover:border-amber-500/40 hover:shadow-amber-500/5",
  MANUAL_REQUIRED: "border-red-500/20 hover:border-red-500/40 hover:shadow-red-500/5",
};

function StatusIcon({ status }: { status: string }) {
  if (status === "LIVE_CONFIGURED") return <Wifi className="w-4 h-4 text-emerald-400" />;
  if (status === "MOCKED_DEMO_MODE") return <Server className="w-4 h-4 text-amber-400" />;
  return <WifiOff className="w-4 h-4 text-red-400" />;
}

function statusLabel(status: string) {
  if (status === "LIVE_CONFIGURED") return "Live";
  if (status === "MOCKED_DEMO_MODE") return "Demo Mode";
  return "Not Configured";
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-7 w-32 bg-muted rounded animate-pulse" />
          <div className="h-4 w-52 bg-muted/60 rounded animate-pulse mt-2" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-7 w-16 bg-muted rounded-md animate-pulse" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 h-44 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function ConnectorsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [testingConnector, setTestingConnector] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-connectors"],
    queryFn: api.getConnectors,
  });

  const testMutation = useMutation({
    mutationFn: api.testConnector,
    onSettled: () => {
      setTestingConnector(null);
      queryClient.invalidateQueries({ queryKey: ["admin-connectors"] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: api.syncConnector,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-connectors"] });
    },
  });

  if (isLoading || !data) return <LoadingSkeleton />;

  const categories = Array.from(new Set(data.connectors.map((c) => c.category)));
  const filtered = data.connectors.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Connectors</h1>
          <p className="text-sm text-muted-foreground mt-1">{data.summary.total} integrations configured</p>
        </div>
        <div className="flex gap-2">
          <SummaryBadge label="Live" count={data.summary.liveConfigured} color="text-emerald-400 bg-emerald-500/10" />
          <SummaryBadge label="Demo" count={data.summary.mockedDemoMode} color="text-amber-400 bg-amber-500/10" />
          <SummaryBadge label="Missing" count={data.summary.manualRequired} color="text-red-400 bg-red-500/10" />
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search connectors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="pl-9 pr-8 py-2 text-sm rounded-lg border border-border bg-muted/40 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer transition-all"
          >
            <option value="all">All Categories</option>
            {categories.sort().map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-border bg-muted/40 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer transition-all"
        >
          <option value="all">All Status</option>
          <option value="LIVE_CONFIGURED">Live</option>
          <option value="MOCKED_DEMO_MODE">Demo</option>
          <option value="MANUAL_REQUIRED">Not Configured</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
            <Wifi className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium mb-1">No connectors found</h3>
          <p className="text-xs text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((connector) => (
            <ConnectorCard
              key={connector.name}
              connector={connector}
              isTesting={testingConnector === connector.name}
              onTest={() => {
                setTestingConnector(connector.name);
                testMutation.mutate(connector.name);
              }}
              onSync={() => syncMutation.mutate(connector.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ConnectorCard({
  connector,
  isTesting,
  onTest,
  onSync,
}: {
  connector: ConnectorDetail;
  isTesting: boolean;
  onTest: () => void;
  onSync: () => void;
}) {
  const catStyle = CATEGORY_COLORS[connector.category] ?? CATEGORY_COLORS["Other"];
  const borderStyle = STATUS_BORDER[connector.status] ?? "";

  return (
    <div className={`rounded-xl border bg-card p-5 transition-all hover:shadow-lg group ${borderStyle}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            connector.status === "LIVE_CONFIGURED" ? "bg-emerald-500/10" :
            connector.status === "MOCKED_DEMO_MODE" ? "bg-amber-500/10" : "bg-red-500/10"
          }`}>
            <StatusIcon status={connector.status} />
          </div>
          <span className="text-sm font-medium">{connector.name}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${catStyle}`}>
          {connector.category}
        </span>
      </div>

      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{connector.description}</p>

      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
          connector.status === "LIVE_CONFIGURED" ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/30"
            : connector.status === "MOCKED_DEMO_MODE" ? "text-amber-400 bg-amber-500/10 border border-amber-500/30"
            : "text-red-400 bg-red-500/10 border border-red-500/30"
        }`}>
          <span className="relative">
            <span className={`block w-1.5 h-1.5 rounded-full ${
              connector.status === "LIVE_CONFIGURED" ? "bg-emerald-400" :
              connector.status === "MOCKED_DEMO_MODE" ? "bg-amber-400" : "bg-red-400"
            }`} />
            {connector.status === "LIVE_CONFIGURED" && (
              <span className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-40" />
            )}
          </span>
          {statusLabel(connector.status)}
        </span>
        {connector.missingEnvVars.length > 0 && (
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{connector.missingEnvVars.length} missing</span>
        )}
      </div>

      {connector.missingEnvVars.length > 0 && (
        <div className="mb-3 p-2.5 rounded-lg bg-red-500/5 border border-red-500/10">
          <div className="text-xs text-muted-foreground mb-1.5 font-medium">Missing env vars:</div>
          <div className="flex flex-wrap gap-1">
            {connector.missingEnvVars.map((v) => (
              <code key={v} className="text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-mono">{v}</code>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onTest}
          disabled={isTesting}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-all disabled:opacity-50"
        >
          {isTesting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
          Test
        </button>
        <button
          onClick={onSync}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary transition-all"
        >
          <RefreshCw className="w-3 h-3" />
          Sync
        </button>
      </div>
    </div>
  );
}

function SummaryBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${color}`}>
      {count} {label}
    </span>
  );
}
