import { useEffect, useRef } from "react";
import { X, ExternalLink, Clock, Shield, Link2 } from "lucide-react";
import { cn } from "../utils";
import { FreshnessChip, type FreshnessLevel } from "../proof/FreshnessChip";
import { ConfidenceMeter } from "../proof/ConfidenceMeter";
import { PolicyStateChip, type PolicyState } from "../proof/PolicyStateChip";

export interface EvidenceItem {
  evidenceId: string;
  kind: "raw" | "normalized" | "derived";
  source: string;
  ref: string;
  summary: string;
  confidence: number;
  freshness: FreshnessLevel;
  capturedAt: string | Date;
  entityLinks?: { entityId: string; label: string }[];
  policyState?: PolicyState;
  drillUrl?: string;
  changedAt?: string | Date;
  changeNote?: string;
}

export interface EvidenceDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  evidence: EvidenceItem[];
  className?: string;
  accent?: string;
}

const KIND_LABELS: Record<EvidenceItem["kind"], { label: string; color: string }> = {
  raw:        { label: "RAW",        color: "#0ea5e9" },
  normalized: { label: "NORM",       color: "#8b7ac8" },
  derived:    { label: "DERIVED",    color: "#a855f7" },
};

export function EvidenceDrawer({
  open,
  onClose,
  title = "Evidence",
  evidence,
  className,
  accent = "#8b7ac8",
}: EvidenceDrawerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={ref}
        role="dialog"
        aria-label={title}
        className={cn(
          "fixed right-0 top-0 bottom-0 z-50 flex w-[420px] max-w-[95vw] flex-col",
          "border-l border-[#1a2535] bg-[#090e18] shadow-2xl",
          "transition-transform duration-200",
          open ? "translate-x-0" : "translate-x-full",
          className
        )}
      >
        <div
          className="flex items-center justify-between border-b border-[#1a2535] px-5 py-4"
          style={{ borderLeftColor: accent, borderLeftWidth: 2 }}
        >
          <div>
            <div className="text-sm font-semibold text-white">{title}</div>
            <div className="mt-0.5 text-[11px] text-[#4a6070]">
              {evidence.length} evidence item{evidence.length !== 1 ? "s" : ""}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded border border-[#1a2535] text-[#4a6070] transition-colors hover:border-[#243040] hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {evidence.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Shield className="mb-3 h-8 w-8 text-[#1a2535]" />
              <p className="text-sm text-[#334155]">No evidence recorded</p>
            </div>
          )}

          {evidence.map((item) => {
            const kd = KIND_LABELS[item.kind];
            return (
              <div
                key={item.evidenceId}
                className="rounded-lg border border-[#1a2535] bg-[#0d1520] p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                      style={{ color: kd.color, background: `${kd.color}15`, border: `1px solid ${kd.color}30` }}
                    >
                      {kd.label}
                    </span>
                    <span className="truncate text-[11px] font-medium text-[rgba(255,255,255,0.7)]">
                      {item.source}
                    </span>
                  </div>
                  {item.drillUrl && (
                    <a
                      href={item.drillUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-[#334155] transition-colors hover:text-white"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <p className="text-[12px] leading-relaxed text-[#94a3b8]">{item.summary}</p>

                <div className="flex flex-wrap items-center gap-3">
                  <ConfidenceMeter value={item.confidence} variant="compact" />
                  <FreshnessChip timestamp={item.capturedAt} level={item.freshness} />
                  {item.policyState && <PolicyStateChip state={item.policyState} />}
                </div>

                {item.entityLinks && item.entityLinks.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.entityLinks.map((el) => (
                      <span
                        key={el.entityId}
                        className="inline-flex items-center gap-1 rounded-full border border-[#243040] px-2 py-0.5 text-[10px] text-[#475569]"
                      >
                        <Link2 className="h-2.5 w-2.5" />
                        {el.label}
                      </span>
                    ))}
                  </div>
                )}

                {item.changeNote && (
                  <div className="flex items-center gap-1.5 rounded border border-[#f59e0b30] bg-[#f59e0b08] px-2 py-1">
                    <Clock className="h-3 w-3 shrink-0 text-[#f59e0b]" />
                    <span className="text-[10px] text-[#f59e0b]">{item.changeNote}</span>
                  </div>
                )}

                <div className="font-mono text-[9px] text-[#243040]">{item.ref}</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
