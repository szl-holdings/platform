import { useQuery } from "@tanstack/react-query";
import { fetchCompoundValue, fetchMeshSignals } from "@/lib/api";
import { useNexusSettings } from "@/lib/SettingsContext";
import { cn } from "@/lib/utils";
import { AlertTriangle, Ship, Building2, Scale, Activity, Zap } from "lucide-react";

const DOMAIN_VITALS = [
  { id: "aegis", label: "Active Threats", icon: AlertTriangle, color: "hsl(222,60%,62%)" },
  { id: "vessels", label: "Vessel Alerts", icon: Ship, color: "hsl(206,72%,52%)" },
  { id: "terra", label: "Distress Signals", icon: Building2, color: "hsl(140,50%,48%)" },
  { id: "prism", label: "Matter Deadlines", icon: Scale, color: "hsl(38,72%,58%)" },
  { id: "lyte", label: "Anomalies", icon: Activity, color: "hsl(192,85%,46%)" },
];

export default function LivePulseStrip() {
  const { refetchIntervalMs } = useNexusSettings();

  const { data: signals } = useQuery({
    queryKey: ["mesh-signals"],
    queryFn: fetchMeshSignals,
    refetchInterval: refetchIntervalMs,
  });

  const { data: compound } = useQuery({
    queryKey: ["compound-value"],
    queryFn: fetchCompoundValue,
    refetchInterval: refetchIntervalMs * 2,
  });

  const getCount = (domain: string) => {
    if (!signals?.signals) return "—";
    const count = signals.signals.filter(
      (s: { sourceVenture: string; severity: string }) =>
        s.sourceVenture === domain && (s.severity === "critical" || s.severity === "high")
    ).length;
    return count;
  };

  return (
    <div className="pulse-strip flex items-center px-4 py-2 gap-6 overflow-x-auto shrink-0" style={{ minHeight: "44px" }}>
      {/* Identity */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-[hsl(258_80%_62%)] animate-pulse-dot" />
        <span className="text-[10px] font-mono text-[hsl(258_80%_70%)] uppercase tracking-widest">NEXUS LIVE</span>
      </div>

      <div className="w-px h-5 bg-border shrink-0" />

      {/* Domain vitals */}
      {DOMAIN_VITALS.map((vital) => {
        const Icon = vital.icon;
        const count = getCount(vital.id);
        return (
          <div key={vital.id} className="flex items-center gap-1.5 shrink-0">
            <Icon className="w-3 h-3" style={{ color: vital.color }} />
            <span className="text-[10px] text-muted-foreground font-mono">{vital.label}:</span>
            <span className="text-[10px] font-mono font-semibold" style={{ color: vital.color }}>
              {count}
            </span>
          </div>
        );
      })}

      <div className="w-px h-5 bg-border shrink-0" />

      {/* Mesh health */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Zap className="w-3 h-3 text-[hsl(258_80%_62%)]" />
        <span className="text-[10px] text-muted-foreground font-mono">Mesh Routes:</span>
        <span className="text-[10px] font-mono font-semibold text-[hsl(258_80%_70%)]">
          {compound?.totalCrossVentureRoutes ?? "—"}
        </span>
      </div>

      {compound?.enrichmentRate != null && (
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-muted-foreground font-mono">Enrichment Rate:</span>
          <span className="text-[10px] font-mono font-semibold text-[hsl(140_50%_48%)]">
            {(compound.enrichmentRate * 100).toFixed(0)}%
          </span>
        </div>
      )}

      <div className="ml-auto shrink-0">
        <span className="text-[9px] text-muted-foreground font-mono">
          {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
          {" UTC"}
        </span>
      </div>
    </div>
  );
}
