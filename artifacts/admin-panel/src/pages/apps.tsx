import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ExternalLink, CheckCircle, Clock, AlertTriangle, Layers, Search } from "lucide-react";
import { useState } from "react";

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <div className="h-7 w-36 bg-muted rounded animate-pulse" />
        <div className="h-4 w-56 bg-muted/60 rounded animate-pulse mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-3 w-full bg-muted/60 rounded animate-pulse" />
            <div className="h-3 w-2/3 bg-muted/60 rounded animate-pulse" />
            <div className="h-3 w-24 bg-muted/40 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <Layers className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium mb-1">No apps registered</h3>
      <p className="text-xs text-muted-foreground text-center max-w-sm">Applications will appear here once they are configured in the ecosystem.</p>
    </div>
  );
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  active: {
    icon: <CheckCircle className="w-4 h-4 text-emerald-400" />,
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    bg: "bg-emerald-500/5",
    border: "hover:border-emerald-500/30 hover:shadow-emerald-500/5",
  },
  planned: {
    icon: <Clock className="w-4 h-4 text-amber-400" />,
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    bg: "bg-amber-500/5",
    border: "hover:border-amber-500/30 hover:shadow-amber-500/5",
  },
  inactive: {
    icon: <AlertTriangle className="w-4 h-4 text-red-400" />,
    color: "text-red-400 border-red-500/30 bg-red-500/10",
    bg: "bg-red-500/5",
    border: "hover:border-red-500/30 hover:shadow-red-500/5",
  },
};

export default function AppsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-apps"],
    queryFn: api.getApps,
  });

  if (isLoading) return <LoadingSkeleton />;

  const apps = data?.apps ?? [];
  const filteredApps = apps.filter((a) =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase())
  );
  const activeCount = apps.filter(a => a.status === "active").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">App Registry</h1>
          <p className="text-sm text-muted-foreground mt-1">All SZL ecosystem applications</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400">{activeCount} active</span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-muted text-muted-foreground">{apps.length} total</span>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search apps..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      {filteredApps.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApps.map((app) => {
            const config = STATUS_CONFIG[app.status] ?? STATUS_CONFIG["inactive"]!;
            return (
              <div
                key={app.id}
                className={`rounded-xl border border-border bg-card p-5 transition-all hover:shadow-lg ${config.border} group relative overflow-hidden`}
              >
                <div className={`absolute inset-0 ${config.bg} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                        {config.icon}
                      </div>
                      <span className="text-sm font-medium">{app.name}</span>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${config.color}`}>
                      {app.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{app.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                    <ExternalLink className="w-3 h-3" />
                    <span className="font-mono truncate">{app.url}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
