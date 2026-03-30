import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Layers, ExternalLink, CheckCircle2, Activity } from "lucide-react";

export default function AppsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-apps"], queryFn: api.getApps });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">App Registry</h1>
        <p className="text-sm text-muted-foreground mt-1">All registered platform applications</p>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data?.apps.map((app) => (
            <div key={app.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-primary" />
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  app.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"
                }`}>
                  {app.status}
                </span>
              </div>
              <h3 className="font-semibold text-sm mt-2">{app.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{app.description}</p>
              <div className="mt-3 flex items-center gap-2">
                <Activity className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-mono">{app.url}</span>
                <a href={app.url} target="_blank" rel="noopener noreferrer" className="ml-auto text-muted-foreground hover:text-primary">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
