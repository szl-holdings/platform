import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ExternalLink, CheckCircle, Clock, AlertTriangle } from "lucide-react";

export default function AppsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-apps"],
    queryFn: api.getApps,
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">App Registry</h1>
        <p className="text-sm text-muted-foreground mt-1">All SZL ecosystem applications</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.apps.map((app) => (
          <div key={app.id} className="rounded-lg border border-border bg-card p-5 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {app.status === "active" ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : app.status === "planned" ? (
                  <Clock className="w-4 h-4 text-amber-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                )}
                <span className="text-sm font-medium">{app.name}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${
                app.status === "active"
                  ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                  : "text-amber-400 border-amber-500/30 bg-amber-500/10"
              }`}>
                {app.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{app.description}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ExternalLink className="w-3 h-3" />
              <span className="font-mono">{app.url}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-7 w-40 bg-muted rounded animate-pulse" />
        <div className="h-4 w-60 bg-muted rounded animate-pulse mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-5 h-32 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
