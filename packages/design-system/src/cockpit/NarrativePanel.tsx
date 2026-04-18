import { useState } from "react";
import { ChevronDown, ChevronUp, Cpu } from "lucide-react";
import { cn } from "../utils";

export interface NarrativeParagraph {
  id: string;
  text: string;
  /** Optional inline highlight phrase */
  highlights?: string[];
}

export interface NarrativePanelProps {
  /** Short one-sentence headline */
  headline: string;
  paragraphs: NarrativeParagraph[];
  /** "Governed intelligence" attribution — e.g. "Synthesized by Alloy · 3 sources" */
  attribution?: string;
  /** Collapsible after N paragraphs */
  collapseAfter?: number;
  className?: string;
  /** Accent color for the headline rule */
  accentColor?: string;
}

function highlightText(text: string, highlights: string[]): React.ReactNode {
  if (!highlights.length) return text;
  const pattern = new RegExp(`(${highlights.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    highlights.some((h) => h.toLowerCase() === part.toLowerCase()) ? (
      <mark key={i} className="bg-[#00d4ff]/15 text-[#00d4ff] rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function NarrativePanel({
  headline,
  paragraphs,
  attribution,
  collapseAfter,
  className,
  accentColor = "#00d4ff",
}: NarrativePanelProps) {
  const [expanded, setExpanded] = useState(false);
  const shouldCollapse = collapseAfter !== undefined && paragraphs.length > collapseAfter;
  const visible = shouldCollapse && !expanded ? paragraphs.slice(0, collapseAfter) : paragraphs;

  return (
    <div
      className={cn(
        "rounded-lg border border-[#243040] bg-[#0d1520] px-4 py-4",
        className
      )}
    >
      <div
        className="mb-3 border-l-2 pl-3"
        style={{ borderColor: accentColor }}
      >
        <p className="text-sm font-semibold leading-snug text-[#c8d8e8]">{headline}</p>
      </div>

      <div className="space-y-2.5">
        {visible.map((p) => (
          <p key={p.id} className="text-[13px] leading-relaxed text-[#7a99b8]">
            {p.highlights?.length
              ? highlightText(p.text, p.highlights)
              : p.text}
          </p>
        ))}
      </div>

      {shouldCollapse && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 inline-flex items-center gap-1 text-[11px] text-[#4a6070] hover:text-[#c8d8e8] transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" /> Collapse
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              {paragraphs.length - (collapseAfter ?? 0)} more paragraph
              {paragraphs.length - (collapseAfter ?? 0) !== 1 ? "s" : ""}
            </>
          )}
        </button>
      )}

      {attribution && (
        <div className="mt-4 flex items-center gap-1.5 border-t border-[#1a2535] pt-3">
          <Cpu className="h-3 w-3 text-[#4a6070]" />
          <span className="text-[11px] text-[#4a6070]">{attribution}</span>
        </div>
      )}
    </div>
  );
}
