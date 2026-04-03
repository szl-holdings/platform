import { LENSES } from "@workspace/observability";
import type { LensScore, LensBarData } from "@workspace/observability";

const LENS_ICONS: Record<string, string> = {
  signal: "◎",
  impact: "$",
  anticipation: "◈",
  topology: "⬡",
  posture: "◆",
  velocity: "▲",
};

function MiniSparkline({ data, color = "from-indigo-500 to-violet-500" }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / range) * 100;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-16 h-5">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-indigo-400"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function LensScoreChip({ lens }: { lens: LensScore }) {
  const def = LENSES.find(l => l.id === lens.lensId);
  const icon = LENS_ICONS[lens.lensId] || "◆";
  const statusColors = {
    healthy: "text-[#6b8f71] border-[#6b8f71]/20",
    degraded: "text-[#d4a054] border-[#d4a054]/20",
    critical: "text-[#c45a4a] border-red-500/20",
    unknown: "text-white/40 border-white/10",
  };
  const color = statusColors[lens.status] || statusColors.unknown;

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border bg-white/[0.03] ${color}`}>
      <span className="text-[10px] font-bold opacity-70">{icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] text-white/40 capitalize leading-none mb-0.5">{lens.lensId}</div>
        <div className="text-xs font-bold leading-none">{lens.score}</div>
      </div>
    </div>
  );
}

export function LensBar({ data }: { data: LensBarData }) {
  const statusConfig = {
    healthy: { color: "text-[#6b8f71]", bg: "bg-[#6b8f71]", label: "Healthy" },
    degraded: { color: "text-[#d4a054]", bg: "bg-[#d4a054]", label: "Degraded" },
    critical: { color: "text-[#c45a4a]", bg: "bg-[#c45a4a]", label: "Critical" },
    unknown: { color: "text-white/40", bg: "bg-white/20", label: "Unknown" },
  };
  const status = statusConfig[data.overallStatus] || statusConfig.unknown;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.04] hover:border-white/15 transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-white/90 truncate">{data.appName}</h4>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-1.5 h-1.5 rounded-full ${status.bg}`} />
            <span className={`text-xs ${status.color}`}>{status.label}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-black text-white">{data.postureScore}</div>
          <div className="text-[9px] text-white/30 uppercase tracking-wider leading-none mt-0.5">{data.postureScoreName}</div>
        </div>
      </div>

      <div className="mb-3 py-2 px-3 rounded-lg bg-white/[0.03] border border-white/5">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-white/30 uppercase tracking-wider flex-shrink-0">Top Signal</span>
          <span className="text-xs text-white/70 truncate">{data.topSignal}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {data.lenses.map((lens) => (
          <LensScoreChip key={lens.lensId} lens={lens} />
        ))}
      </div>

      {data.velocityTrend && data.velocityTrend.length > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <span className="text-[9px] text-white/30 uppercase tracking-wider">Velocity</span>
          <MiniSparkline data={data.velocityTrend} />
        </div>
      )}
    </div>
  );
}

export function LensBarGrid({ items }: { items: LensBarData[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <LensBar key={item.appSlug} data={item} />
      ))}
    </div>
  );
}

export function PostureScore({ score, label, size = "md" }: { score: number; label?: string; size?: "sm" | "md" | "lg" }) {
  const status = score >= 80 ? "healthy" : score >= 50 ? "degraded" : "critical";
  const ringColors = {
    healthy: "text-emerald-500",
    degraded: "text-amber-500",
    critical: "text-red-500",
  };
  const sizeClasses = {
    sm: { outer: "w-16 h-16", text: "text-xl", label: "text-[8px]", stroke: 6 },
    md: { outer: "w-24 h-24", text: "text-3xl", label: "text-[9px]", stroke: 5 },
    lg: { outer: "w-32 h-32", text: "text-4xl", label: "text-[10px]", stroke: 4 },
  };
  const sc = sizeClasses[size];
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - score / 100);

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${sc.outer}`}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" strokeWidth={sc.stroke} className="text-white/5" stroke="currentColor" />
          <circle
            cx="50" cy="50" r={radius} fill="none"
            strokeWidth={sc.stroke}
            className={ringColors[status]}
            stroke="currentColor"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${sc.text} font-black text-white`}>{score}</span>
        </div>
      </div>
      {label && <span className={`${sc.label} text-white/30 uppercase tracking-wider text-center mt-1`}>{label}</span>}
    </div>
  );
}
