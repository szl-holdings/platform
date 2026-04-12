import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchNexusSettings, saveNexusSettings, fetchRoutingRules, type NexusSettings } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Settings2, Ship, Shield, Building2, Scale, Activity,
  ToggleLeft, ToggleRight, Info, Loader2, CheckCircle2
} from "lucide-react";

const DOMAINS = [
  { id: "vessels", label: "Vessels Maritime Intelligence", Icon: Ship, color: "hsl(206,72%,52%)", description: "AIS tracking, fleet analytics, charter intelligence, cargo risk" },
  { id: "aegis", label: "Aegis Unified Defense", Icon: Shield, color: "hsl(222,60%,62%)", description: "SOC alerts, threat intelligence, behavioral analytics, incident response" },
  { id: "terra", label: "Terra Real Estate Intelligence", Icon: Building2, color: "hsl(140,50%,48%)", description: "Property intelligence, deal flow, owner risk scoring, portfolio analytics" },
  { id: "prism", label: "PRISM Counsel", Icon: Scale, color: "hsl(38,72%,58%)", description: "Legal matter management, compliance tracking, statutory deadlines" },
  { id: "lyte", label: "Lyte Command Center", Icon: Activity, color: "hsl(192,85%,46%)", description: "Approval workflow analytics, ownership gaps, SLA monitoring" },
];

const DEFAULT_CONFIG: NexusSettings = {
  domainToggles: { vessels: true, aegis: true, terra: true, prism: true, lyte: true },
  correlationThreshold: 0.6,
  autoRefreshInterval: 30,
};

export default function Settings() {
  const qc = useQueryClient();
  const [local, setLocal] = useState<NexusSettings>(DEFAULT_CONFIG);

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ["nexus-settings"],
    queryFn: fetchNexusSettings,
  });

  const { data: routingData, isLoading: rulesLoading } = useQuery({
    queryKey: ["routing-rules"],
    queryFn: fetchRoutingRules,
  });

  // Sync fetched settings into local state
  useEffect(() => {
    if (settingsData?.config) {
      setLocal({ ...DEFAULT_CONFIG, ...settingsData.config });
    }
  }, [settingsData]);

  const saveMutation = useMutation({
    mutationFn: saveNexusSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nexus-settings"] });
    },
  });

  const routingRules = routingData?.rules ?? [];
  const isDirty = JSON.stringify(local) !== JSON.stringify({ ...DEFAULT_CONFIG, ...settingsData?.config });

  const handleSave = () => {
    saveMutation.mutate(local);
  };

  if (settingsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-border shrink-0">
        <h1 className="text-lg font-display font-bold text-foreground">Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure domain sources, correlation thresholds, and routing rules
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 max-w-3xl">

        {/* Domain Toggles */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="w-4 h-4 text-[hsl(258_80%_70%)]" />
            <h2 className="text-sm font-semibold text-foreground">Active Intelligence Domains</h2>
          </div>
          <div className="space-y-2">
            {DOMAINS.map(({ id, label, Icon, color, description }) => {
              const enabled = local.domainToggles[id] ?? true;
              return (
                <div
                  key={id}
                  className={cn(
                    "fusion-panel p-4 flex items-center gap-4 transition-opacity",
                    !enabled && "opacity-50"
                  )}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18`, color }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
                  </div>
                  <button
                    onClick={() => setLocal(prev => ({ ...prev, domainToggles: { ...prev.domainToggles, [id]: !enabled } }))}
                    className="shrink-0 transition-colors"
                    style={{ color: enabled ? color : "hsl(220,15%,35%)" }}
                  >
                    {enabled
                      ? <ToggleRight className="w-6 h-6" />
                      : <ToggleLeft className="w-6 h-6" />}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Correlation Thresholds */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="w-4 h-4 text-[hsl(258_80%_70%)]" />
            <h2 className="text-sm font-semibold text-foreground">Correlation Engine</h2>
          </div>
          <div className="fusion-panel p-5 space-y-5">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Minimum Confidence Threshold
              </label>
              <p className="text-[11px] text-muted-foreground mb-3">
                Correlations below this score are suppressed from the Correlation Engine view.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.3"
                  max="0.95"
                  step="0.05"
                  value={local.correlationThreshold}
                  onChange={e => setLocal(prev => ({ ...prev, correlationThreshold: parseFloat(e.target.value) }))}
                  className="flex-1 accent-[hsl(258,80%,62%)]"
                />
                <span className="text-sm font-mono font-bold text-[hsl(258_80%_70%)] w-12 text-right">
                  {Math.round(local.correlationThreshold * 100)}%
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Auto-Refresh Interval
              </label>
              <p className="text-[11px] text-muted-foreground mb-3">
                How often the fusion timeline and live pulse strip poll for new signals.
              </p>
              <div className="flex items-center gap-2">
                {[10, 30, 60, 120].map(val => (
                  <button
                    key={val}
                    onClick={() => setLocal(prev => ({ ...prev, autoRefreshInterval: val }))}
                    className={cn(
                      "px-3 py-1 rounded text-xs font-mono border transition-colors",
                      local.autoRefreshInterval === val
                        ? "bg-[hsla(258,80%,62%,0.15)] border-[hsla(258,80%,62%,0.4)] text-[hsl(258_80%_70%)]"
                        : "bg-card border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {val}s
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Routing Rules */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="w-4 h-4 text-[hsl(258_80%_70%)]" />
            <h2 className="text-sm font-semibold text-foreground">Intelligence Routing Rules</h2>
          </div>
          <div className="fusion-panel p-4">
            {rulesLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : routingRules.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4 justify-center">
                <Info className="w-4 h-4" />
                <p className="text-xs">No routing rules configured</p>
              </div>
            ) : (
              <div className="space-y-2">
                {routingRules.map((rule: Record<string, unknown>, i: number) => (
                  <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-border/40 last:border-0">
                    <div>
                      <div className="text-xs font-medium text-foreground">{rule.name as string}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {rule.sourceVenture as string} → {rule.targetVenture as string} · {rule.signalType as string}
                      </div>
                    </div>
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0",
                      rule.enabled ? "bg-[hsla(140,50%,48%,0.1)] text-[hsl(140,50%,56%)] border border-[hsla(140,50%,48%,0.25)]" : "bg-muted text-muted-foreground"
                    )}>
                      {rule.enabled ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Save button */}
        <div className="flex items-center justify-end gap-3">
          {saveMutation.isSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-[hsl(140,50%,56%)]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Settings saved
            </span>
          )}
          {saveMutation.isError && (
            <span className="text-xs text-red-400">Failed to save — please try again</span>
          )}
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending || !isDirty}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50",
              "bg-[hsl(258_80%_62%)] text-white hover:bg-[hsl(258_80%_55%)]"
            )}
          >
            {saveMutation.isPending ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
