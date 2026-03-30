import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Activity, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export default function ConnectorHealth() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-connectors"], queryFn: api.getConnectors });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Connector Health</h1>
        <p className="text-sm text-muted-foreground mt-1">Detailed health status per connector</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {data?.connectors.map((c) => (
            <div key={c.name} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.category}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  c.status === "LIVE_CONFIGURED" ? "bg-emerald-500/10 text-emerald-400" :
                  c.status === "MOCKED_DEMO_MODE" ? "bg-amber-500/10 text-amber-400" :
                  "bg-red-500/10 text-red-400"
                }`}>{c.status.replace(/_/g, " ").toLowerCase()}</span>
              </div>
              <p className="text-xs text-muted-foreground">{c.description}</p>
              {c.missingEnvVars?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.missingEnvVars.map(v => (
                    <span key={v} className="text-xs font-mono bg-red-500/10 text-red-400 px-2 py-0.5 rounded">{v}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
