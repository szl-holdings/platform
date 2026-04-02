import { Hexagon, Zap } from "lucide-react";
import { cn } from "./utils";

export const PACK_ACCENT_COLORS = {
  security: "#3b82f6",
  maritime: "#0ea5e9",
  realestate: "#40856a",
  aiops: "#8b5cf6",
} as const;

export type PackVariant = keyof typeof PACK_ACCENT_COLORS;

export interface PackBannerProps {
  vertical: string;
  description?: string;
  accentColor?: string;
  variant?: PackVariant;
  className?: string;
  compact?: boolean;
}

export function PackBanner({
  vertical,
  description,
  accentColor,
  variant,
  className,
  compact = false,
}: PackBannerProps) {
  const color = accentColor ?? (variant ? PACK_ACCENT_COLORS[variant] : "#3b82f6");

  if (compact) {
    return (
      <div
        className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg", className)}
        style={{
          background: `${color}06`,
          border: `1px solid ${color}12`,
        }}
      >
        <Zap className="w-2.5 h-2.5 shrink-0" style={{ color: `${color}70` }} />
        <span className="text-[9px] font-mono" style={{ color: `${color}60` }}>
          Powered by{" "}
          <span className="font-semibold" style={{ color: `${color}90` }}>
            Lyte + Alloy
          </span>
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn("rounded-xl p-4 space-y-2", className)}
      style={{
        background: `linear-gradient(135deg, ${color}05, transparent)`,
        border: `1px solid ${color}12`,
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded flex items-center justify-center shrink-0"
          style={{ background: `${color}12`, border: `1px solid ${color}20` }}
        >
          <Hexagon className="w-3 h-3" style={{ color }} />
        </div>
        <div>
          <p className="text-[9px] font-mono uppercase tracking-[0.12em]" style={{ color: `${color}50` }}>
            Intelligence Pack
          </p>
          <p className="text-[10px] font-semibold" style={{ color: `${color}90` }}>
            {vertical}
          </p>
        </div>
      </div>
      {description && (
        <p className="text-[9px] leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>
          {description}
        </p>
      )}
      <div className="flex items-center gap-1.5 pt-0.5">
        <Zap className="w-2.5 h-2.5" style={{ color: "rgba(255,255,255,0.2)" }} />
        <span className="text-[8px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
          Powered by{" "}
          <a href="/lyte-command-center/" className="transition-opacity hover:opacity-80" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "underline" }}>
            Lyte
          </a>
          {" "}+{" "}
          <a href="/alloy/" className="transition-opacity hover:opacity-80" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "underline" }}>
            Alloy
          </a>
        </span>
      </div>
    </div>
  );
}
