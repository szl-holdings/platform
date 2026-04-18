import { cn } from "../utils";
import { ConfidenceMeter } from "../proof/ConfidenceMeter";
import { PolicyStateChip, type PolicyState } from "../proof/PolicyStateChip";
import { FreshnessChip } from "../proof/FreshnessChip";
import { ChevronRight, BookOpen } from "lucide-react";

export interface RecommendationCardProps {
  recommendationId: string;
  title: string;
  summary: string;
  confidence: number;
  policyState?: PolicyState;
  domain?: string;
  generatedAt?: string | Date;
  evidenceCount?: number;
  modelId?: string;
  onInspect?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  className?: string;
  accentColor?: string;
  variant?: "compact" | "full";
}

const DOMAIN_COLORS: Record<string, string> = {
  lyte:    "#d4a054",
  vessels: "#0ea5e9",
  terra:   "#22c55e",
  prism:   "#a855f7",
  aegis:   "#ef4444",
  carlota: "#f59e0b",
};

export function RecommendationCard({
  recommendationId,
  title,
  summary,
  confidence,
  policyState,
  domain,
  generatedAt,
  evidenceCount,
  modelId,
  onInspect,
  onApprove,
  onReject,
  className,
  accentColor,
  variant = "full",
}: RecommendationCardProps) {
  const domainColor = domain ? (DOMAIN_COLORS[domain.toLowerCase()] ?? "#8b7ac8") : accentColor ?? "#8b7ac8";

  return (
    <div
      className={cn(
        "group rounded-lg border border-[#1a2535] bg-[#0d1520] transition-all",
        onInspect && "cursor-pointer hover:border-[#243040] hover:bg-[#111d2c]",
        className
      )}
      onClick={() => onInspect?.(recommendationId)}
      role={onInspect ? "button" : undefined}
      tabIndex={onInspect ? 0 : undefined}
      onKeyDown={(e) => e.key === "Enter" && onInspect?.(recommendationId)}
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded"
          style={{ background: `${domainColor}15`, border: `1px solid ${domainColor}30` }}
        >
          <BookOpen className="h-4 w-4" style={{ color: domainColor }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[13px] font-semibold text-white leading-snug">{title}</span>
            {domain && (
              <span
                className="shrink-0 rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                style={{ color: domainColor, background: `${domainColor}12`, border: `1px solid ${domainColor}25` }}
              >
                {domain}
              </span>
            )}
          </div>

          {variant === "full" && (
            <p className="mt-1 text-[12px] leading-relaxed text-[#64748b]">{summary}</p>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-3">
            <ConfidenceMeter value={confidence} variant="compact" />
            {policyState && <PolicyStateChip state={policyState} />}
            {generatedAt && <FreshnessChip timestamp={generatedAt} />}
            {evidenceCount !== undefined && (
              <span className="text-[11px] text-[#334155]">
                {evidenceCount} evidence source{evidenceCount !== 1 ? "s" : ""}
              </span>
            )}
            {modelId && (
              <span className="text-[11px] font-mono text-[#334155] truncate max-w-[120px]">{modelId}</span>
            )}
          </div>
        </div>

        {onInspect && (
          <ChevronRight
            className="h-4 w-4 shrink-0 self-center text-[#243040] transition-colors group-hover:text-[#475569]"
          />
        )}
      </div>

      {(onApprove || onReject) && (
        <div
          className="flex gap-2 border-t border-[#1a2535] px-4 py-3"
          onClick={(e) => e.stopPropagation()}
        >
          {onApprove && (
            <button
              onClick={() => onApprove(recommendationId)}
              className="flex-1 rounded border border-[#22c55e30] bg-[#22c55e0d] py-1.5 text-[11px] font-semibold text-[#22c55e] transition-colors hover:bg-[#22c55e1a]"
            >
              Approve
            </button>
          )}
          {onReject && (
            <button
              onClick={() => onReject(recommendationId)}
              className="flex-1 rounded border border-[#ef444430] bg-[#ef44440d] py-1.5 text-[11px] font-semibold text-[#ef4444] transition-colors hover:bg-[#ef44441a]"
            >
              Reject
            </button>
          )}
        </div>
      )}
    </div>
  );
}
