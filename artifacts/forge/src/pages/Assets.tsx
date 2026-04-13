import { AppShell } from "@/components/layout/AppShell";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { portalApi, type AssetsResponse } from "@/lib/api";
import { Anchor, Building2, MapPin, Clock, AlertTriangle, Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIInsightCard } from "@szl-holdings/shared-ui/ai-insight-card";
import { useDomainInsights, type DomainInsight } from "@szl-holdings/shared-ui/use-ai-agent";

type Tab = "all" | "vessels" | "terra";

const STATUS_CONFIG: Record<string, { label: string; color: string; badge: string }> = {
  transit: { label: "In Transit", color: "var(--color-forge-primary)", badge: "forge-badge-primary" },
  docked: { label: "Docked", color: "var(--color-forge-success)", badge: "forge-badge-success" },
  active: { label: "Active", color: "var(--color-forge-success)", badge: "forge-badge-success" },
  listed: { label: "Listed", color: "var(--color-forge-gold)", badge: "forge-badge-gold" },
  "under-contract": { label: "Under Contract", color: "var(--color-forge-warning)", badge: "forge-badge-warning" },
};

export default function Assets() {
  const [tab, setTab] = useState<Tab>("all");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<AssetsResponse>({
    queryKey: ["forge-portal", "assets"],
    queryFn: () => portalApi.getAssets(),
    retry: 1,
  });

  const { insights: assetInsights, isLoading: insightsLoading, isStale: assetInsightsStale } = useDomainInsights("forge", 3, 60_000);

  const thresholdMutation = useMutation({
    mutationFn: ({ id, threshold }: { id: string; threshold: number }) =>
      portalApi.updateAssetThreshold(id, threshold),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forge-portal", "assets"] }),
  });

  const assets = data?.assets ?? [];
  const filtered = assets.filter(a => tab === "all" ? true : a.domain === tab);
  const vessels = assets.filter(a => a.domain === "vessels");
  const terra = assets.filter(a => a.domain === "terra");

  return (
    <AppShell title="Asset Monitor" subtitle="Live tracking for maritime fleet and real estate portfolio">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
          <AssetKPI label="Active Vessels" value={isLoading ? "—" : String(vessels.length)} sub="Fleet total" color="var(--color-forge-vessels)" />
          <AssetKPI
            label="At Sea"
            value={isLoading ? "—" : String(vessels.filter(v => v.status === "transit").length)}
            sub="Currently underway"
            color="var(--color-forge-primary)"
          />
          <AssetKPI label="Properties" value={isLoading ? "—" : String(terra.length)} sub="Portfolio count" color="var(--color-forge-terra)" />
          <AssetKPI
            label="Active Alerts"
            value={isLoading ? "—" : String(assets.filter(a => a.alert).length)}
            sub="Requiring attention"
            color="var(--color-forge-warning)"
          />
        </div>

        <div className="animate-fade-in-up stagger-2">
          <AIInsightCard domain="forge" accentColor="hsl(38, 72%, 55%)" maxInsights={2} compact title="Asset Intelligence" />
        </div>

        {/* Live Asset Risk Signals */}
        {assetInsights.length > 0 && (
          <div className="animate-fade-in-up stagger-3 forge-card-elevated p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: "var(--color-forge-warning)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--color-forge-text)" }}>AI Asset Risk Flags</span>
              {assetInsightsStale && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">cached</span>}
            </div>
            <div className="space-y-1.5">
              {assetInsights.filter((ins: DomainInsight) => ins.recommendedAction).map((ins: DomainInsight) => (
                <div key={ins.id} className="flex items-start gap-2.5 p-2.5 rounded-lg" style={{ background: "var(--color-forge-surface)", border: "1px solid var(--color-forge-border)" }}>
                  <div className="mt-0.5 w-2 h-2 rounded-full shrink-0" style={{ background: ins.severity === "critical" || ins.severity === "high" ? "var(--color-forge-alert)" : "var(--color-forge-warning)" }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium leading-tight" style={{ color: "var(--color-forge-text)" }}>{ins.title}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "var(--color-forge-text-faint)" }}>{ins.recommendedAction}</div>
                  </div>
                  <span className="text-[9px] font-mono shrink-0 mt-0.5" style={{ color: "var(--color-forge-text-faint)" }}>{Math.round(ins.confidence * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab filter */}
        <div className="flex items-center gap-2">
          {(["all", "vessels", "terra"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-500 transition-all",
                tab === t
                  ? "text-white"
                  : "hover:bg-[var(--color-forge-bg-secondary)]"
              )}
              style={{
                background: tab === t ? (t === "vessels" ? "var(--color-forge-vessels)" : t === "terra" ? "var(--color-forge-terra)" : "var(--color-forge-primary)") : "transparent",
                color: tab === t ? "white" : "var(--color-forge-text-secondary)",
              }}
            >
              {t === "all" ? "All Assets" : t === "vessels" ? "Maritime Fleet" : "Real Estate"}
            </button>
          ))}
        </div>

        {/* Asset grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((asset, i) => {
            const cfg = STATUS_CONFIG[asset.status];
            const Icon = asset.domain === "vessels" ? Anchor : Building2;
            const domainColor = asset.domain === "vessels" ? "var(--color-forge-vessels)" : "var(--color-forge-terra)";
            return (
              <div
                key={asset.id}
                className={cn("forge-domain-card p-5 animate-fade-in-up", asset.domain === "vessels" ? "vessels" : "terra")}
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `color-mix(in srgb, ${domainColor} 12%, transparent)` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: domainColor }} />
                    </div>
                    <div>
                      <div className="text-sm font-600 leading-tight" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-display)" }}>{asset.name}</div>
                      <div className="text-xs" style={{ color: "var(--color-forge-text-muted)" }}>{asset.type}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const currentThreshold = asset.notificationThreshold ?? 85;
                      const newThreshold = currentThreshold > 0 ? 0 : 85;
                      thresholdMutation.mutate({ id: asset.id, threshold: newThreshold });
                    }}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ background: (asset.notificationThreshold ?? 0) > 0 ? "var(--color-forge-primary-muted)" : "var(--color-forge-bg-secondary)" }}
                    title={(asset.notificationThreshold ?? 0) > 0 ? "Disable alerts" : "Enable alerts"}
                  >
                    {(asset.notificationThreshold ?? 0) > 0
                      ? <Bell className="w-3.5 h-3.5" style={{ color: "var(--color-forge-primary)" }} />
                      : <BellOff className="w-3.5 h-3.5" style={{ color: "var(--color-forge-text-faint)" }} />
                    }
                  </button>
                </div>

                {asset.alert && (
                  <div
                    className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3"
                    style={{ background: "hsla(40, 90%, 44%, 0.08)", border: "1px solid hsla(40, 90%, 44%, 0.18)" }}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--color-forge-warning)" }} />
                    <span className="text-xs" style={{ color: "var(--color-forge-warning)" }}>{asset.alert}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "var(--color-forge-text-muted)" }}>Status</span>
                    <span className={`forge-badge ${cfg.badge}`}>{cfg.label}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "var(--color-forge-text-muted)" }}>Estimated Value</span>
                    <span className="text-sm font-600" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-mono)" }}>{asset.value}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1 text-xs" style={{ color: "var(--color-forge-text-muted)" }}>
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{asset.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-3 pt-3 text-xs" style={{ borderTop: "1px solid var(--color-forge-border)", color: "var(--color-forge-text-faint)" }}>
                  <Clock className="w-3 h-3" />
                  Updated {asset.lastUpdate}
                </div>
              </div>
            );
          })}
        </div>

        {/* Notification threshold note */}
        <div
          className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: "var(--color-forge-primary-muted)", border: "1px solid var(--color-forge-primary-border)" }}
        >
          <Bell className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--color-forge-primary)" }} />
          <div>
            <div className="text-sm font-600 mb-0.5" style={{ color: "var(--color-forge-primary)" }}>Notification Thresholds</div>
            <div className="text-xs" style={{ color: "var(--color-forge-text-secondary)" }}>
              Toggle the bell icon on any asset to enable real-time alerts. Your SZL team configures threshold rules — contact your relationship manager to adjust alert criteria (e.g., vessel deviation, property valuation swings).
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function AssetKPI({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="forge-card-elevated p-4">
      <div className="forge-eyebrow mb-2">{label}</div>
      <div className="forge-metric" style={{ color }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: "var(--color-forge-text-muted)" }}>{sub}</div>
    </div>
  );
}
