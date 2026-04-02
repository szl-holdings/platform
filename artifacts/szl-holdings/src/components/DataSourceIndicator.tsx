import { Database, Wifi, Clock, FlaskConical, AlertCircle } from "lucide-react";

type DataSource = "live" | "cached" | "demo" | "not_connected" | "stale";

interface DataSourceIndicatorProps {
  source: DataSource;
  cachedAge?: string;
  className?: string;
  compact?: boolean;
}

const CONFIG: Record<DataSource, { icon: typeof Database; label: string; color: string; bg: string }> = {
  live: { icon: Wifi, label: "Live", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" },
  cached: { icon: Clock, label: "Cached", color: "text-[#4a90b8]", bg: "bg-[#4a90b8]/10 border-[#4a90b8]/20" },
  demo: { icon: FlaskConical, label: "Demo Data", color: "text-[#d4a054]", bg: "bg-[#d4a054]/10 border-[#d4a054]/20" },
  not_connected: { icon: AlertCircle, label: "Not Connected", color: "text-gray-500", bg: "bg-gray-500/10 border-gray-500/20" },
  stale: { icon: Clock, label: "Stale", color: "text-[#c8953c]", bg: "bg-[#c8953c]/10 border-[#c8953c]/20" },
};

export function DataSourceIndicator({ source, cachedAge, className = "", compact = false }: DataSourceIndicatorProps) {
  const c = CONFIG[source];
  const Icon = c.icon;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 ${c.color} ${className}`} title={`Data source: ${c.label}${cachedAge ? ` (${cachedAge})` : ""}`}>
        <Icon className="w-3 h-3" />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium rounded border ${c.bg} ${c.color} ${className}`}>
      <Icon className="w-2.5 h-2.5" />
      {c.label}
      {cachedAge && <span className="opacity-70">({cachedAge})</span>}
    </span>
  );
}

interface DemoModeBannerProps {
  isDemo?: boolean;
  isPilot?: boolean;
  className?: string;
}

export function DemoModeBanner({ isDemo = false, isPilot = false, className = "" }: DemoModeBannerProps) {
  if (!isDemo && !isPilot) return null;

  return (
    <div className={`w-full px-4 py-1.5 text-center text-xs font-medium ${isDemo ? "bg-[#d4a054]/15 text-[#d4a054] border-b border-[#d4a054]/20" : "bg-[#4a90b8]/15 text-[#4a90b8] border-b border-[#4a90b8]/20"} ${className}`}>
      {isDemo && (
        <span className="inline-flex items-center gap-1.5">
          <FlaskConical className="w-3 h-3" />
          Demo Mode — All data shown is seeded demonstration data, not production signals
        </span>
      )}
      {isPilot && !isDemo && (
        <span className="inline-flex items-center gap-1.5">
          <Database className="w-3 h-3" />
          Pilot Environment — Limited to design partner scope
        </span>
      )}
    </div>
  );
}

interface CapabilityBadgeProps {
  level: "production" | "beta" | "alpha" | "prototype" | "planned";
  className?: string;
}

const CAPABILITY_LEVELS: Record<string, { label: string; color: string; bg: string }> = {
  production: { label: "Production", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" },
  beta: { label: "Beta", color: "text-[#4a90b8]", bg: "bg-[#4a90b8]/10 border-[#4a90b8]/20" },
  alpha: { label: "Functional Alpha", color: "text-[#d4a054]", bg: "bg-[#d4a054]/10 border-[#d4a054]/20" },
  prototype: { label: "Prototype", color: "text-[#c8953c]", bg: "bg-[#c8953c]/10 border-[#c8953c]/20" },
  planned: { label: "Planned", color: "text-gray-500", bg: "bg-gray-500/10 border-gray-500/20" },
};

export function CapabilityBadge({ level, className = "" }: CapabilityBadgeProps) {
  const c = CAPABILITY_LEVELS[level] ?? CAPABILITY_LEVELS.alpha;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded border uppercase tracking-wider ${c.bg} ${c.color} ${className}`}>
      {c.label}
    </span>
  );
}
