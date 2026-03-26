import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CheckCircle, XCircle, Shield, Settings } from "lucide-react";

export default function EnvironmentPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-environment"],
    queryFn: api.getEnvironment,
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const readinessPercent = data.total > 0 ? Math.round((data.configured / data.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Environment Readiness</h1>
        <p className="text-sm text-muted-foreground mt-1">Configuration status for all integrations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Environment</span>
          </div>
          <div className="text-2xl font-semibold capitalize">{data.environment}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Configured</span>
          </div>
          <div className="text-2xl font-semibold text-emerald-400">{data.configured}/{data.total}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Readiness</span>
          </div>
          <div className="text-2xl font-semibold">{readinessPercent}%</div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${readinessPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Variable</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Used By</th>
            </tr>
          </thead>
          <tbody>
            {data.envVars.map((v) => (
              <tr key={v.name} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3">
                  <code className="text-sm font-mono">{v.name}</code>
                </td>
                <td className="px-5 py-3">
                  {v.configured ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                      <CheckCircle className="w-3.5 h-3.5" /> Configured
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-red-400">
                      <XCircle className="w-3.5 h-3.5" /> Missing
                    </span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1">
                    {v.usedBy.map((svc) => (
                      <span key={svc} className="text-xs px-1.5 py-0.5 rounded bg-muted font-mono">{svc}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
