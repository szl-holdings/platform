import * as React from "react";
import { cn } from "../utils";

export interface CaseStudyMetric {
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
}

export interface CaseStudyCardProps {
  client?: string;
  industry?: string;
  title: string;
  summary: string;
  metrics?: CaseStudyMetric[];
  image?: string;
  tags?: string[];
  href?: string;
  onClick?: () => void;
  accentColor?: string;
  variant?: "light" | "dark";
  featured?: boolean;
  className?: string;
}

export function CaseStudyCard({
  client,
  industry,
  title,
  summary,
  metrics,
  image,
  tags,
  href,
  onClick,
  accentColor = "hsl(215 45% 32%)",
  variant = "light",
  featured = false,
  className,
}: CaseStudyCardProps) {
  const isDark = variant === "dark";

  const content = (
    <div
      className={cn(
        "group rounded-2xl overflow-hidden border transition-all duration-300 h-full flex flex-col",
        isDark
          ? "bg-white/3 border-white/8 hover:border-white/16 hover:bg-white/5"
          : "bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-lg hover:shadow-black/5",
        className
      )}
      style={featured ? { outline: `2px solid ${accentColor}`, outlineOffset: "-1px" } : undefined}
    >
      {image && (
        <div className="aspect-[16/9] overflow-hidden shrink-0 relative">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
          {featured && (
            <span
              className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: accentColor }}
            >
              Featured
            </span>
          )}
        </div>
      )}

      <div className="p-6 flex flex-col flex-1">
        {(client || industry) && (
          <div className="flex items-center gap-2 mb-3">
            {industry && (
              <span
                className="text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ color: accentColor }}
              >
                {industry}
              </span>
            )}
            {client && industry && (
              <span className={cn("text-[10px]", isDark ? "text-white/20" : "text-neutral-300")}>
                ·
              </span>
            )}
            {client && (
              <span
                className={cn("text-[10px] font-medium", isDark ? "text-white/40" : "text-neutral-400")}
              >
                {client}
              </span>
            )}
          </div>
        )}

        <h3
          className={cn(
            "text-base font-bold leading-snug mb-2",
            isDark ? "text-white" : "text-neutral-900"
          )}
        >
          {title}
        </h3>

        <p
          className={cn(
            "text-sm leading-relaxed mb-5 flex-1 line-clamp-3",
            isDark ? "text-white/50" : "text-neutral-500"
          )}
        >
          {summary}
        </p>

        {metrics && metrics.length > 0 && (
          <div
            className={cn(
              "grid grid-cols-3 gap-3 mb-5 p-3 rounded-xl",
              isDark ? "bg-white/5" : "bg-neutral-50"
            )}
          >
            {metrics.slice(0, 3).map((m, i) => (
              <div key={i} className="text-center">
                <p
                  className={cn("text-base font-bold", isDark ? "text-white" : "text-neutral-900")}
                >
                  {m.value}
                </p>
                {m.delta && (
                  <p
                    className={cn(
                      "text-[9px] font-semibold",
                      m.positive ? "text-emerald-500" : "text-red-500"
                    )}
                  >
                    {m.delta}
                  </p>
                )}
                <p className={cn("text-[9px] mt-0.5", isDark ? "text-white/30" : "text-neutral-400")}>
                  {m.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {tags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  "text-[10px] font-medium px-2 py-0.5 rounded-full",
                  isDark ? "bg-white/8 text-white/40" : "bg-neutral-100 text-neutral-400"
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} onClick={onClick} className="block h-full">
        {content}
      </a>
    );
  }

  return content;
}
