import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface CTAItem {
  label: string;
  sublabel?: string;
  href: string;
  variant?: "primary" | "secondary" | "ghost";
  external?: boolean;
  trackLabel?: string;
}

interface CTAModuleProps {
  items: CTAItem[];
  layout?: "row" | "column" | "grid";
  className?: string;
}

export function CTAModule({ items, layout = "row", className }: CTAModuleProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={cn(
        "flex flex-wrap gap-3",
        layout === "column" && "flex-col items-start",
        layout === "grid" && "grid grid-cols-2 sm:grid-cols-4",
        className
      )}
    >
      {items.map((item) => {
        const handleClick = () => {
          if (item.trackLabel) {
            analytics.heroCTAClick(item.trackLabel);
          }
        };

        const baseClasses = cn(
          "inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200",
          item.variant === "primary" &&
            "bg-szl-primary text-white hover:bg-szl-primary-light shadow-sm hover:shadow",
          item.variant === "secondary" &&
            "border border-szl-border text-szl-text-secondary hover:text-szl-text hover:border-szl-border-hover hover:bg-szl-bg-secondary",
          item.variant === "ghost" &&
            "text-szl-text-secondary hover:text-szl-text"
        );

        if (item.external) {
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(baseClasses, "group")}
              onClick={handleClick}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>
                {item.label}
                {item.sublabel && (
                  <span className="block text-[10px] font-normal opacity-70 mt-0.5">{item.sublabel}</span>
                )}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </a>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(baseClasses, "group")}
            onClick={handleClick}
          >
            <span>
              {item.label}
              {item.sublabel && (
                <span className="block text-[10px] font-normal opacity-70 mt-0.5">{item.sublabel}</span>
              )}
            </span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </Link>
        );
      })}
    </m.div>
  );
}
