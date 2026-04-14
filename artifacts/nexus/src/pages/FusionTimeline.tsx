import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMeshFeed, fetchRoutingRules } from "@/lib/api";
import { useNexusSettings } from "@/lib/SettingsContext";
import { cn, formatTimeAgo } from "@/lib/utils";
import {
  Filter, RefreshCw, ChevronDown, ChevronRight,
  Ship, Shield, Building2, Scale, Activity,
  Eye, Zap, ArrowRight, Search
} from "lucide-react";
import { AIInsightCard } from "@szl-holdings/shared-ui/ai-insight-card";

const DOMAIN_META: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  vessels: { label: "Vessels", color: "hsl(206,72%,52%)", icon: Ship },
  aegis: { label: "Aegis", color: "hsl(222,60%,62%)", icon: Shield },
  terra: { label: "Terra", color: "hsl(140,50%,48%)", icon: Building2 },
  prism: { label: "PRISM", color: "hsl(38,72%,58%)", icon: Scale },
  lyte: { label: "Lyte", color: "hsl(192,85%,46%)", icon: Activity },
  "carlota-jo": { label: "Carlota Jo", color: "hsl(280,50%,65%)", icon: Shield },
};

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  threat: "Threat",
  distress: "Distress",
  incident: "Incident",
  compliance: "Compliance",
  anomaly: "Anomaly",
  risk: "Risk",
};

const TIME_RANGE_OPTIONS = [
  { label: "All time", value: "" },
  { label: "Last 1h", value: "1h" },
  { label: "Last 6h", value: "6h" },
  { label: "Last 24h", value: "24h" },
  { label: "Last 7d", value: "7d" },
];

function timeRangeToAfter(range: string): string | undefined {
  if (!range) return undefined;
  const now = Date.now();
  const map: Record<string, number> = {
    "1h": 3600_000,
    "6h": 21600_000,
    "24h": 86400_000,
    "7d": 604800_000,
  };
  const ms = map[range];
  if (!ms) return undefined;
  return new Date(now - ms).toISOString();
}

export default function FusionTimeline() {
  const { refetchIntervalMs } = useNexusSettings();
  const [signalType, setSignalType] = useState<string>("");
  const [targetVenture, setTargetVenture] = useState<string>("");
  const [severity, setSeverity] = useState<string>("");
  const [timeRange, setTimeRange] = useState<string>("");
  const [entitySearch, setEntitySearch] = useState<string>("");
  const [entityInput, setEntityInput] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Tick drives "time ago" label repaints only — not cache key changes
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["mesh-feed", signalType, targetVenture, severity, timeRange, entitySearch],
    queryFn: () => fetchMeshFeed({
      limit: 50,
      signalType: signalType || undefined,
      targetVenture: targetVenture || undefined,
      severity: severity || undefined,
      after: timeRangeToAfter(timeRange),
      entity: entitySearch || undefined,
    }),
    refetchInterval: refetchIntervalMs,
  });

  const events = data?.events ?? [];
  const hasFilters = signalType || targetVenture || severity || timeRange || entitySearch;

  const clearFilters = () => {
    setSignalType(""); setTargetVenture(""); setSeverity("");
    setTimeRange(""); setEntitySearch(""); setEntityInput("");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-lg font-display font-bold text-foreground">Fusion Timeline</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cross-domain event stream — {events.length} events{data?.total > events.length ? ` of ${data.total}` : ""}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded border border-border hover:border-border/80 transition-colors"
        >
          <RefreshCw className={cn("w-3 h-3", isRefetching && "animate-spin")} />
          Refresh
        </button>
      </div>

      <div className="px-6 py-3 border-b border-border shrink-0">
        <AIInsightCard domain="nexus" accentColor="hsl(258, 80%, 62%)" maxInsights={2} compact title="Timeline Intelligence" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-border shrink-0">
        <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <select
          value={signalType}
          onChange={(e) => setSignalType(e.target.value)}
          className="text-xs bg-card border border-border text-foreground rounded px-2 py-1 focus:outline-none focus:border-[hsl(258_80%_62%)]"
        >
          <option value="">All Signal Types</option>
          {Object.entries(SIGNAL_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={targetVenture}
          onChange={(e) => setTargetVenture(e.target.value)}
          className="text-xs bg-card border border-border text-foreground rounded px-2 py-1 focus:outline-none focus:border-[hsl(258_80%_62%)]"
        >
          <option value="">All Domains</option>
          {Object.entries(DOMAIN_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="text-xs bg-card border border-border text-foreground rounded px-2 py-1 focus:outline-none focus:border-[hsl(258_80%_62%)]"
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="text-xs bg-card border border-border text-foreground rounded px-2 py-1 focus:outline-none focus:border-[hsl(258_80%_62%)]"
        >
          {TIME_RANGE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <form
          onSubmit={(e) => { e.preventDefault(); setEntitySearch(entityInput.trim()); }}
          className="flex items-center gap-1"
        >
          <div className="relative flex items-center">
            <Search className="absolute left-2 w-3 h-3 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={entityInput}
              onChange={(e) => setEntityInput(e.target.value)}
              placeholder="Entity / keyword..."
              className="text-xs bg-card border border-border text-foreground rounded pl-6 pr-2 py-1 w-36 focus:outline-none focus:border-[hsl(258_80%_62%)] placeholder-muted-foreground"
            />
          </div>
          <button
            type="submit"
            className="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            Filter
          </button>
          {entitySearch && (
            <button
              type="button"
              onClick={() => { setEntitySearch(""); setEntityInput(""); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ×
            </button>
          )}
        </form>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-[hsl(258_80%_62%)] hover:text-[hsl(258_80%_72%)] transition-colors ml-1"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Event stream */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={cn("h-16 skeleton rounded-lg", `stagger-${Math.min(i + 1, 6) as 1}`)} />
          ))
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Activity className="w-8 h-8 mb-3 opacity-30" />
            <p className="text-sm">No events match the current filters</p>
          </div>
        ) : (
          events.map((evt: Record<string, unknown>, idx: number) => {
            const id = evt.id as string;
            const isExpanded = expandedId === id;
            const src = DOMAIN_META[evt.sourceVenture as string];
            const tgt = DOMAIN_META[evt.targetVenture as string];
            const SrcIcon = src?.icon ?? Shield;
            const TgtIcon = tgt?.icon ?? Shield;
            const sev = evt.severity as string;

            return (
              <div
                key={id}
                className={cn(
                  "fusion-panel cursor-pointer animate-fade-in-up",
                  `severity-${sev}`
                )}
                style={{ animationDelay: `${idx * 0.03}s` }}
                onClick={() => setExpandedId(isExpanded ? null : id)}
              >
                <div className="flex items-start gap-3 p-3">
                  {/* Source → Target */}
                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ background: `${src?.color}18`, color: src?.color }}
                    >
                      <SrcIcon className="w-3.5 h-3.5" />
                    </div>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ background: `${tgt?.color}18`, color: tgt?.color }}
                    >
                      <TgtIcon className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground leading-snug line-clamp-1">
                        {evt.title as string}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={cn("badge-" + sev, "text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wide")}>
                          {sev}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {formatTimeAgo(evt.enrichedAt as string)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {src?.label ?? evt.sourceVenture as string}
                      </span>
                      <span className="text-[10px] text-muted-foreground">→</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {tgt?.label ?? evt.targetVenture as string}
                      </span>
                      <span className="w-px h-3 bg-border" />
                      <span className="text-[10px] text-muted-foreground font-mono capitalize">
                        {SIGNAL_TYPE_LABELS[evt.signalType as string] ?? evt.signalType as string}
                      </span>
                      <span className="text-[10px]" style={{ color: confidenceColor(evt.confidence as number) }}>
                        {Math.round((evt.confidence as number) * 100)}% confidence
                      </span>
                      {!!evt.compoundInsight && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-[hsla(258,80%,62%,0.1)] text-[hsl(258,80%,70%)] border border-[hsla(258,80%,62%,0.2)]">
                          COMPOUND
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expand */}
                  <div className="shrink-0 mt-0.5 text-muted-foreground">
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-border/50 animate-fade-in space-y-3">
                    <div>
                      <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1">Enrichment Context</div>
                      <p className="text-sm text-foreground/90 leading-relaxed">{evt.enrichmentContext as string}</p>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1">Recommended Action</div>
                      <p className="text-sm text-foreground/90 leading-relaxed">{evt.actionRecommendation as string}</p>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
                      <span>Routing rule: {evt.routingRule as string}</span>
                      <span>Signal: {evt.signalId as string}</span>
                      <span>Status: {evt.status as string}</span>
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

function confidenceColor(c: number): string {
  if (c >= 0.85) return "hsl(140,50%,52%)";
  if (c >= 0.7) return "hsl(45,85%,55%)";
  return "hsl(32,88%,55%)";
}
