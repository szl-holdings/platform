import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Settings, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function EnvironmentPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-environment"], queryFn: api.getEnvironment });
  const [showValues, setShowValues] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Environment</h1>
          <p className="text-sm text-muted-foreground mt-1">Environment variables and configuration</p>
        </div>
        <button
          onClick={() => setShowValues(!showValues)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          {showValues ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showValues ? "Hide Values" : "Show Values"}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {data?.groups?.map((group) => (
            <div key={group.name} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-muted/30">
                <h3 className="text-sm font-semibold">{group.name}</h3>
              </div>
              <div className="divide-y divide-border">
                {group.vars.map((v) => (
                  <div key={v.key} className="flex items-center gap-4 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-xs">{v.key}</span>
                      {v.description && <p className="text-xs text-muted-foreground mt-0.5">{v.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {v.isSet ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          {showValues ? (
                            <span className="font-mono text-xs text-muted-foreground">{v.value || "***"}</span>
                          ) : (
                            <span className="font-mono text-xs text-muted-foreground">•••••••••</span>
                          )}
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-red-400" />
                          <span className="text-xs text-red-400">not set</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )) ?? (
            <div className="bg-card border border-border rounded-xl px-5 py-12 text-center text-muted-foreground text-sm">
              No environment data available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
