import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { Radio, Activity, RefreshCw, Hash } from "lucide-react";

import { cn } from "@/lib/utils";

import { API_BASE, SEVERITY_COLORS, DOMAIN_COLORS } from "./constants";

import { SectionCard, TimeAgo } from "./components";

export function SenseLayer() {
  const [domainFilter, setDomainFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");

  const { data: signalData, isLoading: signalLoading, refetch } = useQuery<{ data: Record<string, unknown> }>({
    queryKey: ["ct-signals", domainFilter, severityFilter],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "60" });
      if (domainFilter) params.set("domain", domainFilter);
      if (severityFilter) params.set("severity", severityFilter);
      return fetch(`${API_BASE}/control-tower/sense/signals?${params}`).then(r => r.json());
    },
    refetchInterval: 10000,
  });

  const { data: domainSnapshot } = useQuery<{ data: Record<string, unknown> }>({
    queryKey: ["ct-domain-snapshot"],
    queryFn: () => fetch(`${API_BASE}/control-tower/sense/domain-snapshot`).then(r => r.json()),
    refetchInterval: 15000,
  });

  const signals = (signalData?.data as Record<string, unknown>)?.events as unknown[] ?? [];
  const snapshot = (signalData?.data as Record<string, unknown>)?.snapshot as Record<string, unknown> | undefined;
  const domainSummary = (snapshot?.domainSummary as Record<string, unknown>[]) ?? [];
  const simSignals = ((domainSnapshot?.data as Record<string, unknown>)?.signals as unknown[]) ?? [];

  const combinedSignals = [...simSignals.slice(0, 20), ...signals.slice(0, 20)].slice(0, 40);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Published", value: snapshot?.totalSignals ?? 0, color: "text-sky-400" },
          { label: "Active Subscribers", value: snapshot?.activeSubscribers ?? 0, color: "text-violet-400" },
          { label: "History Buffer", value: snapshot?.historyWindowSize ?? 0, color: "text-amber-400" },
          { label: "Domain Sources", value: domainSummary.length, color: "text-emerald-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className={cn("text-xl font-bold font-mono", color)}>{String(value)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <SectionCard title="Live Signal Feed" icon={Radio} color="text-sky-400">
            <div className="flex items-center gap-2 mb-3">
              <select
                className="text-xs bg-muted/30 border border-border rounded px-2 py-1 text-foreground"
                value={domainFilter}
                onChange={e => setDomainFilter(e.target.value)}
              >
                <option value="">All Domains</option>
                {["aegis", "vessels", "terra", "lyte", "prism", "alloy", "orchestration"].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                className="text-xs bg-muted/30 border border-border rounded px-2 py-1 text-foreground"
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
              >
                <option value="">All Severity</option>
                {["critical", "high", "medium", "low", "info"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                onClick={() => refetch()}
                className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 border border-border rounded transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>
            <div className="space-y-1 max-h-96 overflow-y-auto scrollbar-thin">
              {signalLoading ? (
                <div className="space-y-1">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-8 bg-muted/20 rounded animate-pulse" />
                  ))}
                </div>
              ) : combinedSignals.length === 0 ? (
                <div className="text-center py-8">
                  <Radio className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No signals in window</p>
                </div>
              ) : (
                combinedSignals.map((sig: unknown, i) => {
                  const s = sig as Record<string, unknown>;
                  const severity = String(s.severity ?? "info");
                  const domain = String(s.domain ?? s.sourceDomain ?? "unknown");
                  const type = String(s.type ?? "unknown");
                  const ts = s.timestamp ?? s.ts;
                  return (
                    <div
                      key={String(s.id ?? i)}
                      className={cn("flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[10px]", SEVERITY_COLORS[severity] ?? SEVERITY_COLORS.info)}
                    >
                      <span className={cn("font-mono font-medium shrink-0", DOMAIN_COLORS[domain] ?? "text-muted-foreground")}>{domain}</span>
                      <span className="text-muted-foreground mx-0.5">›</span>
                      <span className="font-medium flex-1 truncate">{String(s.title ?? type.replace(/_/g, " "))}</span>
                      <span className={cn("shrink-0 px-1 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide border", SEVERITY_COLORS[severity] ?? "")}>
                        {severity}
                      </span>
                      <TimeAgo ts={ts as string} />
                    </div>
                  );
                })
              )}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Domain Activity" icon={Activity} color="text-violet-400">
            <div className="space-y-2">
              {domainSummary.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No domain activity yet</p>
              ) : (
                domainSummary.map((d: unknown) => {
                  const dom = d as Record<string, unknown>;
                  const domain = String(dom.domain ?? "unknown");
                  return (
                    <div key={domain} className="flex items-center gap-2">
                      <span className={cn("text-[10px] font-mono w-20 shrink-0", DOMAIN_COLORS[domain] ?? "text-muted-foreground")}>{domain}</span>
                      <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", DOMAIN_COLORS[domain]?.replace("text-", "bg-") ?? "bg-muted")}
                          style={{ width: `${Math.min(100, (Number(dom.count ?? 0) / 50) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground w-6 text-right">{String(dom.count ?? 0)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </SectionCard>

          <SectionCard title="Event Types" icon={Hash} color="text-sky-400">
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {Object.entries((snapshot?.eventsByType as Record<string, number>) ?? {}).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No event data yet</p>
              ) : (
                Object.entries((snapshot?.eventsByType as Record<string, number>) ?? {})
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 12)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground truncate">{type.replace(/_/g, " ")}</span>
                      <span className="text-[10px] font-mono text-foreground">{count}</span>
                    </div>
                  ))
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
