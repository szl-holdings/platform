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

export function VentureCard({ venture, index = 0, size = "default" }: VentureCardProps) {
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
            "group relative rounded-2xl border border-szl-border bg-white hover:border-szl-border-hover hover:shadow-md hover:shadow-black/5 transition-all duration-300 cursor-pointer overflow-hidden h-full",
            size === "featured" && "p-7",
            size === "default" && "p-6"
          )}
        >
          <div
            className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: `linear-gradient(to right, transparent, ${venture.accentColor}, transparent)` }}
          />

          <div className="flex items-start justify-between mb-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
              style={{
                backgroundColor: `${venture.accentColor}18`,
                color: venture.accentColor,
                fontFamily: "var(--font-display)",
              }}
            >
              {venture.name.slice(0, 1)}
            </div>
            <StatusTag status={venture.status} pulse size="sm" />
          </div>

          <h3 className={cn(
            "font-[var(--font-display)] font-bold text-szl-text mb-1 group-hover:text-szl-accent transition-colors",
            size === "featured" ? "text-xl" : "text-base"
          )}>
            {venture.name}
          </h3>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-szl-text-muted mb-3">
            {venture.category}
          </p>
          <p className="text-sm text-szl-text-secondary leading-relaxed mb-5 line-clamp-2">
            {venture.oneLiner}
          </p>

          {size === "featured" && (
            <div className="grid grid-cols-2 gap-3 mb-5">
              {venture.metrics.slice(0, 2).map((m) => (
                <div key={m.label} className="rounded-lg bg-szl-bg-secondary p-3">
                  <p className="font-[var(--font-display)] font-bold text-szl-text text-sm">{m.value}</p>
                  <p className="text-[10px] text-szl-text-muted mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs font-semibold text-szl-text-muted group-hover:text-szl-accent transition-colors">
            Explore {venture.name} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </Link>
    </m.div>
  );
}
