import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCorrelations, fetchCompoundValue } from "@/lib/api";
import { useNexusSettings } from "@/lib/SettingsContext";
import { cn, formatTimeAgo } from "@/lib/utils";
import {
  ChevronDown, ChevronRight, ArrowRight,
  Ship, Shield, Building2, Scale, Activity, Loader2, AlertCircle
} from "lucide-react";
import { AIInsightCard } from "@szl-holdings/shared-ui/ai-insight-card";
import { useMeshFeed, useDomainInsights, type MeshSignal, type DomainInsight } from "@szl-holdings/shared-ui/use-ai-agent";

interface CorrelationPattern {
  id: string;
  title: string;
  narrative: string;
  domains: string[];
  entityIds: string[];
  confidenceScore: number;
  riskLevel: "critical" | "high" | "medium" | "low";
  supportingEvidence: string[];
  suggestedActions: string[];
  detectedAt: string;
  compoundInsights: number;
}

const DOMAIN_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  vessels: Ship, aegis: Shield, terra: Building2, prism: Scale, lyte: Activity,
};
const DOMAIN_COLORS: Record<string, string> = {
  vessels: "hsl(206,72%,52%)", aegis: "hsl(222,60%,62%)", terra: "hsl(140,50%,48%)",
  prism: "hsl(38,72%,58%)", lyte: "hsl(192,85%,46%)",
};

function riskColor(level: string): string {
  const map: Record<string, string> = {
    critical: "hsl(0,72%,51%)", high: "hsl(32,88%,52%)",
    medium: "hsl(45,85%,52%)", low: "hsl(160,65%,42%)",
  };
  return map[level] ?? "hsl(258,80%,62%)";
}

export default function CorrelationEngine() {
  const { refetchIntervalMs } = useNexusSettings();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [riskFilter, setRiskFilter] = useState<string>("");
  const [domainFilter, setDomainFilter] = useState<string>("");

  const { data: corrData, isLoading, error } = useQuery({
    queryKey: ["correlations", riskFilter, domainFilter],
    queryFn: () => fetchCorrelations({
      riskLevel: riskFilter || undefined,
      domain: domainFilter || undefined,
    }),
    refetchInterval: refetchIntervalMs,
  });

  const { data: compound } = useQuery({
    queryKey: ["compound-value"],
    queryFn: fetchCompoundValue,
    refetchInterval: refetchIntervalMs,
  });

  const { signals: liveSignals, isLoading: signalsLoading, isStale: signalsStale } = useMeshFeed({
    limit: 8,
    pollIntervalMs: 30_000,
  });

  const { insights: correlationInsights, isLoading: insightsLoading, isStale: insightsStale } = useDomainInsights("nexus", 4, 60_000);

  const patterns: CorrelationPattern[] = corrData?.correlations ?? [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-lg font-display font-bold text-foreground">Correlation Engine</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            AI-driven cross-domain pattern detection — {patterns.length} active correlations
          </p>
        </div>
        <div className="flex items-center gap-3">
          {compound && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Compound insights missed in isolation</div>
              <div className="text-sm font-mono font-bold text-[hsl(258_80%_70%)]">{compound.signalsMissedInIsolation}</div>
            </div>
          )}
        </div>
      </div>

      {/* Stats bar */}
      {compound && (
        <div className="grid grid-cols-4 divide-x divide-border border-b border-border shrink-0">
          {[
            { label: "Total Signals", value: compound.totalSignalsGenerated, color: "hsl(258,80%,62%)" },
            { label: "Cross-Domain Routes", value: compound.totalCrossVentureRoutes, color: "hsl(206,72%,52%)" },
            { label: "Enrichment Rate", value: `${(compound.enrichmentRate * 100).toFixed(0)}%`, color: "hsl(140,50%,48%)" },
            { label: "Missed in Isolation", value: compound.signalsMissedInIsolation, color: "hsl(32,88%,52%)" },
          ].map((stat) => (
            <div key={stat.label} className="px-4 py-3">
              <div className="text-[10px] text-muted-foreground font-mono">{stat.label}</div>
              <div className="text-lg font-mono font-bold mt-0.5" style={{ color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border shrink-0">
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="text-xs bg-card border border-border text-foreground rounded px-2 py-1 focus:outline-none focus:border-[hsl(258_80%_62%)]"
        >
          <option value="">All Risk Levels</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          className="text-xs bg-card border border-border text-foreground rounded px-2 py-1 focus:outline-none focus:border-[hsl(258_80%_62%)]"
        >
          <option value="">All Domains</option>
          {Object.keys(DOMAIN_ICONS).map(d => (
            <option key={d} value={d} className="capitalize">{d}</option>
          ))}
        </select>
      </div>

      {/* AI Insight Panel */}
      <div className="px-6 py-3 border-b border-border shrink-0">
        <AIInsightCard domain="nexus" accentColor="hsl(258, 80%, 62%)" maxInsights={2} compact title="AI Cross-Domain Signals" />
      </div>

      {/* Live Cross-Domain Intelligence Feed */}
      {(liveSignals.length > 0 || signalsLoading) && (
        <div className="px-6 py-3 border-b border-border shrink-0">
          <div className="text-[10px] font-mono text-muted-foreground mb-2 flex items-center gap-2">
            <Activity className="w-3 h-3 text-[hsl(258,80%,62%)]" />
            <span className="uppercase tracking-widest text-[hsl(258,80%,62%)]">Live Intelligence Feed</span>
            {!signalsLoading && <span className="opacity-50">· {liveSignals.length} cross-domain events</span>}
            {signalsStale && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">cached</span>}
          </div>
          {signalsLoading ? (
            <div className="text-xs text-muted-foreground py-2">Connecting to intelligence mesh…</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {liveSignals.map((sig: MeshSignal, i: number) => (
                <div
                  key={sig.id ?? i}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono"
                  style={{
                    background: sig.severity === "critical" ? "hsla(0,80%,50%,0.08)" : sig.severity === "high" ? "hsla(32,88%,52%,0.08)" : "hsla(258,80%,62%,0.06)",
                    border: sig.severity === "critical" ? "1px solid hsla(0,80%,50%,0.2)" : sig.severity === "high" ? "1px solid hsla(32,88%,52%,0.2)" : "1px solid hsla(258,80%,62%,0.15)",
                    color: sig.severity === "critical" ? "hsl(0,80%,65%)" : sig.severity === "high" ? "hsl(32,88%,60%)" : "hsl(258,80%,72%)",
                    maxWidth: "280px",
                  }}
                  title={sig.title}
                >
                  <span className="shrink-0 opacity-60">{sig.sourceVenture ?? "mesh"} →</span>
                  <span className="truncate">{sig.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Correlation Recommendations */}
      {correlationInsights.length > 0 && (
        <div className="px-6 py-3 border-b border-border shrink-0">
          <div className="text-[10px] font-mono text-muted-foreground mb-2 uppercase tracking-widest text-[hsl(258,80%,62%)] flex items-center gap-2">AI Correlation Recommendations{insightsStale && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">cached</span>}</div>
          <div className="space-y-1.5">
            {correlationInsights.filter((ins: DomainInsight) => ins.recommendedAction).map((ins: DomainInsight) => (
              <div key={ins.id} className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "hsla(258,80%,62%,0.04)", border: "1px solid hsla(258,80%,62%,0.12)" }}>
                <ArrowRight className="w-3 h-3 mt-0.5 shrink-0 text-[hsl(258,80%,62%)]" />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-foreground">{ins.title}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{ins.recommendedAction}</div>
                </div>
                <span className="text-[9px] font-mono shrink-0 text-muted-foreground">{Math.round(ins.confidence * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patterns */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <p className="text-sm">Failed to load correlations</p>
          </div>
        ) : patterns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p className="text-sm">No correlations match current filters</p>
          </div>
        ) : (
          patterns.map((pattern, idx) => {
            const isExpanded = expandedId === pattern.id;
            return (
              <div
                key={pattern.id}
                className="correlation-card cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.04}s` }}
                onClick={() => setExpandedId(isExpanded ? null : pattern.id)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-2">
                        {pattern.domains.map((domain) => {
                          const Icon = DOMAIN_ICONS[domain] ?? Shield;
                          return (
                            <div
                              key={domain}
                              className="w-5 h-5 rounded flex items-center justify-center"
                              style={{ background: `${DOMAIN_COLORS[domain]}18`, color: DOMAIN_COLORS[domain] }}
                            >
                              <Icon className="w-3 h-3" />
                            </div>
                          );
                        })}
                        <span className="text-[10px] text-muted-foreground font-mono ml-1">
                          {pattern.domains.length}-domain correlation
                        </span>
                        <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded font-mono bg-[hsla(258,80%,62%,0.1)] text-[hsl(258,80%,70%)] border border-[hsla(258,80%,62%,0.2)]">
                          {pattern.compoundInsights} COMPOUND INSIGHTS
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-foreground leading-snug">{pattern.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{pattern.narrative}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={cn("badge-" + pattern.riskLevel, "text-[9px] px-1.5 py-0.5 rounded font-mono uppercase")}>
                        {pattern.riskLevel}
                      </span>
                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground font-mono">Confidence</div>
                        <div className="text-sm font-mono font-bold text-[hsl(258_80%_70%)]">
                          {Math.round(pattern.confidenceScore * 100)}%
                        </div>
                      </div>
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1 rounded bg-border overflow-hidden">
                      <div
                        className="h-full rounded transition-all"
                        style={{ width: `${pattern.confidenceScore * 100}%`, background: riskColor(pattern.riskLevel) }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">{formatTimeAgo(pattern.detectedAt)}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border/50 pt-3 animate-fade-in space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-2">Supporting Evidence</div>
                        <ul className="space-y-1.5">
                          {pattern.supportingEvidence.map((ev, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/80">
                              <span className="text-[hsl(258_80%_62%)] mt-0.5">·</span>
                              {ev}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-2">Suggested Actions</div>
                        <ul className="space-y-1.5">
                          {pattern.suggestedActions.map((action, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/80">
                              <ArrowRight className="w-3 h-3 text-[hsl(258_80%_62%)] mt-0.5 shrink-0" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1.5">Involved Entities</div>
                      <div className="flex flex-wrap gap-1.5">
                        {pattern.entityIds.map((eid) => (
                          <span key={eid} className="text-[10px] px-2 py-0.5 rounded bg-[hsla(258,80%,62%,0.07)] border border-[hsla(258,80%,62%,0.18)] text-foreground/80 font-mono">
                            {eid}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
