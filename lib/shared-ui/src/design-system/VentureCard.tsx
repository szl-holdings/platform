import * as React from "react";
import { cn } from "../utils";

export type VentureStatus = "live" | "beta" | "dev" | "acquired" | "sunset";

export interface VentureMetric {
  label: string;
  value: string;
}

export interface VentureCardData {
  id: string;
  name: string;
  category: string;
  oneLiner: string;
  status: VentureStatus;
  accentColor: string;
  path?: string;
  metrics?: VentureMetric[];
  logoInitial?: string;
}

export interface VentureCardProps {
  venture: VentureCardData;
  index?: number;
  size?: "default" | "featured";
  onClick?: (venture: VentureCardData) => void;
  renderLink?: (href: string, children: React.ReactNode, onClick?: () => void) => React.ReactNode;
  className?: string;
}

const STATUS_COLORS: Record<VentureStatus, string> = {
  live: "bg-emerald-500 text-white",
  beta: "bg-amber-400 text-white",
  dev: "bg-neutral-300 text-neutral-700",
  acquired: "bg-sky-500 text-white",
  sunset: "bg-neutral-400 text-white",
};

const STATUS_LABELS: Record<VentureStatus, string> = {
  live: "Live",
  beta: "Beta",
  dev: "Dev",
  acquired: "Acquired",
  sunset: "Sunset",
};

export function VentureCard({
  venture,
  index = 0,
  size = "default",
  onClick,
  renderLink,
  className,
}: VentureCardProps) {
  const handleClick = () => onClick?.(venture);

  const card = (
    <div
      className={cn(
        "group relative rounded-2xl border border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md hover:shadow-black/5 transition-all duration-300 cursor-pointer overflow-hidden h-full",
        size === "featured" ? "p-7" : "p-6",
        className
      )}
    >
      <div
        className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(to right, transparent, ${venture.accentColor}, transparent)`,
        }}
      />

      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
          style={{
            backgroundColor: `${venture.accentColor}18`,
            color: venture.accentColor,
          }}
        >
          {venture.logoInitial ?? venture.name.slice(0, 1)}
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold",
            STATUS_COLORS[venture.status]
          )}
        >
          {venture.status === "live" && (
            <span className="w-1 h-1 rounded-full bg-white/80 animate-pulse" />
          )}
          {STATUS_LABELS[venture.status]}
        </span>
      </div>

      <h3
        className={cn(
          "font-bold text-neutral-900 mb-1 group-hover:transition-colors",
          size === "featured" ? "text-xl" : "text-base"
        )}
        style={{ "--hover-color": venture.accentColor } as React.CSSProperties}
      >
        {venture.name}
      </h3>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-3">
        {venture.category}
      </p>
      <p className="text-sm text-neutral-500 leading-relaxed mb-5 line-clamp-2">
        {venture.oneLiner}
      </p>

      {size === "featured" && venture.metrics && venture.metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          {venture.metrics.slice(0, 2).map((m) => (
            <div key={m.label} className="rounded-lg bg-neutral-50 p-3">
              <p className="font-bold text-neutral-900 text-sm">{m.value}</p>
              <p className="text-[10px] text-neutral-400 mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
      )}

      <div
        className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 group-hover:transition-colors"
        style={{ color: venture.accentColor }}
      >
        Enter Lane →
      </div>
    </div>
  );

  if (renderLink && venture.path) {
    return (
      <div style={{ animationDelay: `${index * 0.06}s` }}>
        {renderLink(venture.path, card, handleClick)}
      </div>
    );
  }

  return (
    <a
      href={venture.path ?? "#"}
      onClick={handleClick}
      className="block"
    >
      {card}
    </a>
  );
}
