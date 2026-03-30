import * as React from "react";
import { cn } from "../utils";

export interface HeroBadge {
  label: string;
  icon?: React.ReactNode;
}

export interface HeroAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  external?: boolean;
}

export interface HeroBlockProps {
  eyebrow?: string | HeroBadge;
  headline: string;
  headlineAccent?: string;
  subheadline?: string;
  actions?: HeroAction[];
  children?: React.ReactNode;
  className?: string;
  centered?: boolean;
  accentColor?: string;
  backgroundNode?: React.ReactNode;
  paddingTop?: string;
}

export function HeroBlock({
  eyebrow,
  headline,
  headlineAccent,
  subheadline,
  actions = [],
  children,
  className,
  centered = true,
  accentColor = "hsl(215 45% 32%)",
  backgroundNode,
  paddingTop = "pt-[60px]",
}: HeroBlockProps) {
  return (
    <section
      className={cn(
        "relative min-h-screen flex items-center justify-center overflow-hidden bg-white",
        paddingTop,
        className
      )}
    >
      {backgroundNode && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {backgroundNode}
        </div>
      )}

      <div
        className={cn(
          "relative z-10 max-w-5xl mx-auto px-6 py-20",
          centered && "text-center"
        )}
      >
        {eyebrow && (
          <div className="mb-7">
            {typeof eyebrow === "string" ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-neutral-200 bg-neutral-50 text-neutral-500 text-[11px] font-medium tracking-[0.08em] uppercase">
                {eyebrow}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-neutral-200 bg-neutral-50 text-neutral-500 text-[11px] font-medium tracking-[0.08em] uppercase">
                {eyebrow.icon}
                {eyebrow.label}
              </span>
            )}
          </div>
        )}

        <h1 className="text-[2.75rem] sm:text-[3.5rem] lg:text-[4.25rem] font-bold leading-[1.06] tracking-[-0.025em] text-neutral-900 mb-6">
          {headline}
          {headlineAccent && (
            <>
              <br />
              <span style={{ color: accentColor }}>{headlineAccent}</span>
            </>
          )}
        </h1>

        {subheadline && (
          <p className="text-neutral-500 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            {subheadline}
          </p>
        )}

        {actions.length > 0 && (
          <div
            className={cn(
              "flex flex-col sm:flex-row gap-3 mb-16",
              centered && "items-center justify-center"
            )}
          >
            {actions.map((action, i) => {
              const Tag = action.href ? "a" : "button";
              return (
                <Tag
                  key={i}
                  href={action.href}
                  onClick={action.onClick}
                  target={action.external ? "_blank" : undefined}
                  rel={action.external ? "noopener noreferrer" : undefined}
                  className={cn(
                    "inline-flex items-center gap-2 px-6 py-3 rounded text-[13.5px] font-semibold transition-all duration-200 shadow-sm",
                    (action.variant ?? "primary") === "primary" &&
                      "text-white hover:opacity-90",
                    action.variant === "secondary" &&
                      "text-neutral-600 border border-neutral-200 hover:border-neutral-300 hover:text-neutral-900",
                    action.variant === "ghost" && "text-neutral-600 hover:text-neutral-900"
                  )}
                  style={
                    (action.variant ?? "primary") === "primary"
                      ? { backgroundColor: accentColor }
                      : undefined
                  }
                >
                  {action.label}
                </Tag>
              );
            })}
          </div>
        )}

        {children}
      </div>
    </section>
  );
}
