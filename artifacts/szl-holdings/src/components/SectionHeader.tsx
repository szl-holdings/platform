import { m } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
  accentWord?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "left",
  className,
  accentWord,
}: SectionHeaderProps) {
  const titleParts = accentWord
    ? title.split(accentWord)
    : [title];

  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={cn(
        "mb-12",
        align === "center" && "text-center",
        className
      )}
    >
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-widest text-szl-text-muted mb-3">
          {eyebrow}
        </p>
      )}
      <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-szl-text leading-tight">
        {accentWord && titleParts.length === 2 ? (
          <>
            {titleParts[0]}
            <span className="text-szl-accent">{accentWord}</span>
            {titleParts[1]}
          </>
        ) : (
          title
        )}
      </h2>
      {subtitle && (
        <p className={cn(
          "mt-4 text-szl-text-secondary text-base leading-relaxed",
          align === "center" ? "max-w-2xl mx-auto" : "max-w-xl"
        )}>
          {subtitle}
        </p>
      )}
    </m.div>
  );
}
