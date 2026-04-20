import { useState, useRef, useEffect } from "react";
import { FileText, ExternalLink, ChevronDown } from "lucide-react";
import { cn } from "../utils";
import { v } from "../tokens/vars.js";

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
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`${count} evidence source${count !== 1 ? "s" : ""}`}
        aria-expanded={open}
        style={{
          borderColor: v.borderDefault,
          backgroundColor: v.bgOverlay,
          color: v.textSecondary,
        }}
        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium border transition-colors duration-150 focus:outline-none focus-visible:ring-1"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = v.accentBlue;
          (e.currentTarget as HTMLButtonElement).style.borderColor = v.accentBlue;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = v.textSecondary;
          (e.currentTarget as HTMLButtonElement).style.borderColor = v.borderDefault;
        }}
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
          style={{
            borderColor: v.borderDefault,
            backgroundColor: v.bgSurface,
          }}
          className="absolute left-0 top-full z-50 mt-1.5 w-72 rounded-lg border shadow-lg animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div style={{ borderColor: v.borderSubtle }} className="border-b px-3 py-2">
            <p style={{ color: v.textMuted }} className="text-[11px] font-semibold uppercase tracking-wider">
              Evidence — {count} source{count !== 1 ? "s" : ""}
            </p>
          </div>
          <ul style={{ borderColor: v.borderSubtle }} className="max-h-64 overflow-y-auto divide-y">
            {sources.map((src) => (
              <li key={src.id} style={{ borderColor: v.borderSubtle }} className="px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p style={{ color: v.textPrimary }} className="truncate text-xs font-medium">{src.label}</p>
                    {src.type && (
                      <span style={{ color: v.textMuted }} className="mt-0.5 inline-block text-[10px] uppercase tracking-wide">
                        {src.type}
                      </span>
                    )}
                    {src.excerpt && (
                      <p style={{ color: v.textSecondary }} className="mt-1 line-clamp-2 text-[11px]">{src.excerpt}</p>
                    )}
                    {src.timestamp && (
                      <p style={{ color: v.textMuted }} className="mt-1 text-[10px]">{src.timestamp}</p>
                    )}
                  </div>
                  {src.url && (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: v.textSecondary }}
                      className="shrink-0 transition-colors"
                      aria-label={`Open ${src.label}`}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = v.accentBlue)}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = v.textSecondary)}
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
