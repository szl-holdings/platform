import * as React from "react";
import { cn } from "../utils";

export interface ServiceCardProps {
  id?: string;
  tag?: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  accentColor?: string;
  href?: string;
  onClick?: () => void;
  variant?: "light" | "dark" | "bordered";
  className?: string;
  features?: string[];
  cta?: { label: string; href?: string; onClick?: () => void };
}

export function ServiceCard({
  tag,
  title,
  description,
  icon,
  accentColor = "hsl(215 45% 32%)",
  href,
  onClick,
  variant = "dark",
  className,
  features,
  cta,
}: ServiceCardProps) {
  const isDark = variant === "dark";
  const isBordered = variant === "bordered";

  const content = (
    <div
      className={cn(
        "group rounded-2xl p-6 transition-all duration-300",
        isDark && "bg-white/3 border border-white/8 hover:border-white/16 hover:bg-white/5",
        !isDark && !isBordered && "bg-white border border-neutral-100 hover:border-neutral-200 hover:shadow-sm",
        isBordered && "border-2 border-neutral-200 hover:border-current bg-white",
        className
      )}
      style={isBordered ? { "--hover-border": accentColor } as React.CSSProperties : undefined}
    >
      {tag && (
        <p
          className={cn(
            "text-[10px] font-medium tracking-[0.25em] uppercase mb-4",
            isDark ? "text-white/40" : "text-neutral-400"
          )}
        >
          {tag}
        </p>
      )}

      {icon && (
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center mb-5"
          style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
        >
          {icon}
        </div>
      )}

      <h3
        className={cn(
          "text-base font-bold mb-3 leading-snug",
          isDark ? "text-white" : "text-neutral-900"
        )}
      >
        {title}
      </h3>

      <p
        className={cn(
          "text-sm leading-relaxed",
          isDark ? "text-white/50" : "text-neutral-500",
          (features || cta) ? "mb-5" : ""
        )}
      >
        {description}
      </p>

      {features && features.length > 0 && (
        <ul className="space-y-1.5 mb-5">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: accentColor }}
              />
              <span className={isDark ? "text-white/60" : "text-neutral-600"}>{f}</span>
            </li>
          ))}
        </ul>
      )}

      {cta && (
        <a
          href={cta.href ?? "#"}
          onClick={cta.onClick}
          className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
          style={{ color: accentColor }}
        >
          {cta.label} →
        </a>
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} onClick={onClick} className="block">
        {content}
      </a>
    );
  }

  return content;
}
