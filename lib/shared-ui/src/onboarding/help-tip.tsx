import * as React from "react";
import { HelpCircle, X, ExternalLink } from "lucide-react";
import { cn } from "../utils";

export interface HelpTipProps {
  title: string;
  content: string | React.ReactNode;
  learnMoreUrl?: string;
  learnMoreLabel?: string;
  placement?: "top" | "bottom" | "left" | "right";
  accentColor?: string;
  className?: string;
  iconSize?: number;
  /** Stable identifier for analytics. When set together with `platform`, opening
   *  the tip emits a `help_tip_opened` event to /api/analytics/event. */
  tipId?: string;
  /** Platform/app slug for analytics (e.g. "szl", "aegis", "vessels", "terra"). */
  platform?: string;
  /** Optional callback invoked the first time the tip is opened in this mount. */
  onOpen?: () => void;
}

function fireHelpTipAnalytics(tipId: string, platform: string) {
  try {
    fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "help_tip_opened",
        platform,
        timestamp: new Date().toISOString(),
        properties: { platform, tipId },
      }),
    }).catch(() => {});
  } catch {}
}

export function HelpTip({
  title,
  content,
  learnMoreUrl,
  learnMoreLabel = "Learn more",
  placement = "bottom",
  accentColor = "#8b7ac8",
  className,
  iconSize = 14,
  tipId,
  platform,
  onOpen,
}: HelpTipProps) {
  const [open, setOpen] = React.useState(false);
  const trackedRef = React.useRef(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleToggle = React.useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (next && !trackedRef.current) {
        trackedRef.current = true;
        if (tipId && platform) fireHelpTipAnalytics(tipId, platform);
        onOpen?.();
      }
      return next;
    });
  }, [tipId, platform, onOpen]);

  React.useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  const popoverPositionClass = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }[placement];

  return (
    <div ref={containerRef} className={cn("relative inline-flex", className)}>
      <button
        onClick={handleToggle}
        className={cn(
          "rounded-full p-0.5 transition-colors",
          open
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-label={`Help: ${title}`}
        aria-expanded={open}
      >
        <HelpCircle style={{ width: iconSize, height: iconSize }} />
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 w-64 rounded-xl border border-border bg-card shadow-xl p-4 animate-in fade-in-0 zoom-in-95",
            popoverPositionClass,
          )}
          style={{
            boxShadow: `0 0 20px ${accentColor}10, 0 8px 24px rgba(0,0,0,0.15)`,
          }}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-sm font-display font-bold text-foreground leading-tight">
              {title}
            </h4>
            <button
              onClick={() => setOpen(false)}
              className="p-0.5 rounded-md text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-xs text-muted-foreground leading-relaxed">
            {typeof content === "string" ? <p>{content}</p> : content}
          </div>

          {learnMoreUrl && (
            <a
              href={learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-3 text-xs font-medium transition-colors hover:opacity-80"
              style={{ color: accentColor }}
            >
              {learnMoreLabel}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
