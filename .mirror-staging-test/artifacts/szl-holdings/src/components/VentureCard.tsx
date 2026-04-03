import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { type Venture } from "@/data/ventures";
import { StatusTag } from "@/components/StatusTag";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface VentureCardProps {
  venture: Venture;
  index?: number;
  size?: "default" | "featured";
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "201, 169, 110";
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

export function VentureCard({ venture, index = 0, size = "default" }: VentureCardProps) {
  const accentRgb = hexToRgb(venture.accentColor);

  const handleClick = () => {
    analytics.ventureCardClick(venture.id, venture.name);
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
    >
      <Link href={venture.path} onClick={handleClick}>
        <div
          className={cn(
            "group relative rounded-sm border cursor-pointer overflow-hidden h-full transition-all duration-250",
            size === "featured" ? "p-7" : "p-5"
          )}
          style={{
            background: "var(--color-szl-surface)",
            border: "1px solid var(--color-szl-border)",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = `rgba(${accentRgb}, 0.26)`;
            el.style.background = "var(--color-szl-elevated)";
            el.style.boxShadow = `0 0 18px rgba(${accentRgb}, 0.10), 0 4px 28px rgba(0,0,0,0.38)`;
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = "var(--color-szl-border)";
            el.style.background = "var(--color-szl-surface)";
            el.style.boxShadow = "none";
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(to right, transparent, rgba(${accentRgb}, 0) 0%, rgba(${accentRgb}, 0.6) 50%, transparent)` }}
          />

          <div className="flex items-start justify-between mb-4">
            <div
              className="w-10 h-10 rounded-sm flex items-center justify-center text-base font-bold shrink-0"
              style={{
                backgroundColor: `rgba(${accentRgb}, 0.10)`,
                color: venture.accentColor,
                fontFamily: "var(--font-display)",
                border: `1px solid rgba(${accentRgb}, 0.18)`,
              }}
            >
              {venture.name.slice(0, 1)}
            </div>
            <StatusTag status={venture.status} pulse size="sm" />
          </div>

          <h3
            className={cn("font-bold mb-0.5", size === "featured" ? "text-xl" : "text-[0.9375rem]")}
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-szl-text)",
              letterSpacing: "-0.02em",
              transition: "color 0.2s ease",
            }}
          >
            {venture.name}
          </h3>
          <p style={{ fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-szl-text-muted)", marginBottom: "0.75rem", fontFamily: "var(--font-mono)" }}>
            {venture.category}
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-szl-text-secondary)", lineHeight: 1.65, marginBottom: "1.25rem" }} className="line-clamp-2">
            {venture.oneLiner}
          </p>

          {size === "featured" && (
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {venture.metrics.slice(0, 2).map((m) => (
                <div
                  key={m.label}
                  className="rounded-sm p-3"
                  style={{ background: `rgba(${accentRgb}, 0.06)`, border: `1px solid rgba(${accentRgb}, 0.12)` }}
                >
                  <p style={{ fontFamily: "var(--font-mono)", fontWeight: 500, color: "var(--color-szl-text)", fontSize: "0.9375rem", letterSpacing: "-0.01em" }}>
                    {m.value}
                  </p>
                  <p style={{ fontSize: "0.625rem", color: "var(--color-szl-text-muted)", marginTop: "0.15rem", fontFamily: "var(--font-mono)" }}>{m.label}</p>
                </div>
              ))}
            </div>
          )}

          <div
            className="flex items-center gap-1.5 group-hover:translate-x-0.5 transition-transform"
            style={{ fontSize: "0.75rem", fontWeight: 600, color: venture.accentColor, fontFamily: "var(--font-mono)" }}
          >
            Explore {venture.name} <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </Link>
    </m.div>
  );
}
