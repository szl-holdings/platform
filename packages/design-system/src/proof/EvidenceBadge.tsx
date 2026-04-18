import { useState, useRef, useEffect } from "react";
import { FileText, ExternalLink, ChevronDown } from "lucide-react";
import { cn } from "../utils";

export interface EvidenceSource {
  id: string;
  label: string;
  type?: "document" | "signal" | "api" | "user" | "model";
  url?: string;
  timestamp?: string;
  excerpt?: string;
}

export interface EvidenceBadgeProps {
  sources: EvidenceSource[];
  className?: string;
  /** When true, shows a condensed icon-only badge */
  compact?: boolean;
}

export function EvidenceBadge({ sources, className, compact = false }: EvidenceBadgeProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const count = sources.length;

  return (
    <div ref={ref} className={cn("relative inline-flex", className)}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`${count} evidence source${count !== 1 ? "s" : ""}`}
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium",
          "border border-[#243040] bg-[#111c2a] text-[#7a99b8]",
          "hover:border-[#00d4ff]/40 hover:text-[#00d4ff] transition-colors duration-150",
          "focus:outline-none focus-visible:ring-1 focus-visible:ring-[#00d4ff]/60"
        )}
      >
        <FileText className="h-3 w-3 shrink-0" />
        {!compact && <span>{count}</span>}
        {!compact && <ChevronDown className={cn("h-3 w-3 transition-transform duration-150", open && "rotate-180")} />}
        {compact && (
          <span className="ml-0.5 tabular-nums">{count}</span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Evidence sources"
          className={cn(
            "absolute left-0 top-full z-50 mt-1.5 w-72",
            "rounded-lg border border-[#243040] bg-[#0d1520]",
            "shadow-[0_8px_24px_rgba(0,0,0,0.7)]",
            "animate-in fade-in slide-in-from-top-1 duration-150"
          )}
        >
          <div className="border-b border-[#1a2535] px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#4a6070]">
              Evidence — {count} source{count !== 1 ? "s" : ""}
            </p>
          </div>
          <ul className="max-h-64 overflow-y-auto divide-y divide-[#1a2535]">
            {sources.map((src) => (
              <li key={src.id} className="px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-[#c8d8e8]">{src.label}</p>
                    {src.type && (
                      <span className="mt-0.5 inline-block text-[10px] uppercase tracking-wide text-[#4a6070]">
                        {src.type}
                      </span>
                    )}
                    {src.excerpt && (
                      <p className="mt-1 line-clamp-2 text-[11px] text-[#7a99b8]">{src.excerpt}</p>
                    )}
                    {src.timestamp && (
                      <p className="mt-1 text-[10px] text-[#4a6070]">{src.timestamp}</p>
                    )}
                  </div>
                  {src.url && (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-[#7a99b8] hover:text-[#00d4ff] transition-colors"
                      aria-label={`Open ${src.label}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
