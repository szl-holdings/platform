import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CheckCircle, XCircle, Shield, Settings, Search } from "lucide-react";
import { useState } from "react";

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <div className="h-7 w-52 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted/60 rounded animate-pulse mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 h-24 animate-pulse" />
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card h-64 animate-pulse" />
    </div>
  );
}

export default function EnvironmentPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-environment"],
    queryFn: api.getEnvironment,
  });

  if (isLoading || !data) return <LoadingSkeleton />;

  const readinessPercent = data.total > 0 ? Math.round((data.configured / data.total) * 100) : 0;
  const filtered = data.envVars.filter((v) =>
    !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.usedBy.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Environment Readiness</h1>
        <p className="text-sm text-muted-foreground mt-1">Configuration status for all integrations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Settings className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Environment</span>
          </div>
          <div className="text-2xl font-semibold capitalize">{data.environment}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Configured</span>
          </div>
          <div className="text-2xl font-semibold text-emerald-400">{data.configured}<span className="text-muted-foreground text-lg">/{data.total}</span></div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Readiness</span>
          </div>
          <div className="text-2xl font-semibold">{readinessPercent}%</div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                readinessPercent >= 80 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" :
                readinessPercent >= 50 ? "bg-gradient-to-r from-amber-500 to-amber-400" :
                "bg-gradient-to-r from-red-500 to-red-400"
              }`}
              style={{ width: `${readinessPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search variables..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Variable</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Used By</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.name} className={`border-b border-border/50 hover:bg-muted/30 transition-colors border-l-2 ${v.configured ? "border-l-emerald-500" : "border-l-red-500"}`}>
                <td className="px-5 py-3">
                  <code className="text-sm font-mono">{v.name}</code>
                </td>
                <td className="px-5 py-3">
                  {v.configured ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3.5 h-3.5" /> Configured
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-red-400 font-medium bg-red-500/10 px-2 py-0.5 rounded-full">
                      <XCircle className="w-3.5 h-3.5" /> Missing
                    </span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1">
                    {v.usedBy.map((svc) => (
                      <span key={svc} className="text-xs px-1.5 py-0.5 rounded bg-muted font-mono border border-border/50">{svc}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <p className="text-sm text-muted-foreground">No matching variables found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
