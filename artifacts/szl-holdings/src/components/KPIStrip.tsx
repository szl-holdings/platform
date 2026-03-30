import { m } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPIItem {
  value: string;
  label: string;
  trend?: "up" | "down" | "neutral";
  note?: string;
}

interface KPIStripProps {
  items: KPIItem[];
  variant?: "default" | "dark" | "border";
  className?: string;
}

export function KPIStrip({ items, variant = "default", className }: KPIStripProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={cn(
        "grid gap-px rounded-2xl overflow-hidden",
        items.length === 2 && "grid-cols-2",
        items.length === 3 && "grid-cols-3",
        items.length === 4 && "grid-cols-2 sm:grid-cols-4",
        items.length === 5 && "grid-cols-2 sm:grid-cols-5",
        variant === "border" && "border border-szl-border",
        className
      )}
      style={{
        background: variant === "border" ? undefined : "var(--color-szl-border)",
      }}
    >
      {items.map((item, i) => (
        <m.div
          key={i}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.05 * i }}
          className={cn(
            "px-6 py-5 text-center",
            variant === "dark"
              ? "bg-slate-800"
              : "bg-white"
          )}
        >
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <p className={cn(
              "font-[var(--font-display)] font-bold text-2xl sm:text-3xl",
              variant === "dark" ? "text-white" : "text-szl-text"
            )}>
              {item.value}
            </p>
            {item.trend === "up" && <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />}
            {item.trend === "down" && <TrendingDown className="w-4 h-4 text-red-500 shrink-0" />}
            {item.trend === "neutral" && <Minus className="w-4 h-4 text-slate-400 shrink-0" />}
          </div>
          <p className={cn(
            "text-[11px] font-medium uppercase tracking-wider",
            variant === "dark" ? "text-slate-400" : "text-szl-text-muted"
          )}>
            {item.label}
          </p>
          {item.note && (
            <p className="text-[10px] text-szl-text-muted mt-0.5">{item.note}</p>
          )}
        </m.div>
      ))}
    </m.div>
  );
}
