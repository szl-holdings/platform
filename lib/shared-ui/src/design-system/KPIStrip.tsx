import * as React from "react";
import { cn } from "../utils";

export interface KPIItem {
  value: string;
  label: string;
  trend?: "up" | "down" | "neutral";
  note?: string;
  delta?: string;
}

export interface KPIStripProps {
  items: KPIItem[];
  variant?: "default" | "dark" | "border" | "glass";
  className?: string;
  accentColor?: string;
}

function TrendIcon({ trend }: { trend: "up" | "down" | "neutral" }) {
  if (trend === "up") return <span className="text-emerald-500 text-sm">↑</span>;
  if (trend === "down") return <span className="text-red-500 text-sm">↓</span>;
  return <span className="text-neutral-400 text-sm">—</span>;
}

export function KPIStrip({ items, variant = "default", className, accentColor }: KPIStripProps) {
  const isDark = variant === "dark" || variant === "glass";

  return (
    <div
      className={cn(
        "grid gap-px rounded-2xl overflow-hidden",
        items.length === 2 && "grid-cols-2",
        items.length === 3 && "grid-cols-3",
        items.length === 4 && "grid-cols-2 sm:grid-cols-4",
        items.length === 5 && "grid-cols-2 sm:grid-cols-5",
        items.length > 5 && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
        variant === "border" && "border border-neutral-200",
        variant === "glass" && "border border-white/8",
        className
      )}
      style={{
        background:
          variant === "border"
            ? undefined
            : variant === "glass"
            ? "rgba(255,255,255,0.04)"
            : variant === "dark"
            ? "#1e293b"
            : "#e5e7eb",
      }}
    >
      {items.map((item, i) => (
        <div
          key={i}
          className={cn(
            "px-6 py-5 text-center",
            isDark ? "bg-slate-800" : "bg-white"
          )}
        >
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <p
              className={cn(
                "font-bold text-2xl sm:text-3xl",
                isDark ? "text-white" : "text-neutral-900"
              )}
            >
              {item.value}
            </p>
            {item.trend && <TrendIcon trend={item.trend} />}
          </div>
          <p
            className={cn(
              "text-[11px] font-medium uppercase tracking-wider",
              isDark ? "text-slate-400" : "text-neutral-400"
            )}
          >
            {item.label}
          </p>
          {item.note && (
            <p className={cn("text-[10px] mt-0.5", isDark ? "text-slate-500" : "text-neutral-400")}>
              {item.note}
            </p>
          )}
          {item.delta && (
            <p
              className={cn(
                "text-[10px] font-semibold mt-0.5",
                item.trend === "up" ? "text-emerald-500" : item.trend === "down" ? "text-red-500" : "text-neutral-400"
              )}
            >
              {item.delta}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
