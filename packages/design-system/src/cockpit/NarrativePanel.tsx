import { ChevronDown, ChevronUp, Cpu } from 'lucide-react';
import { useState } from 'react';
import { color } from '../tokens/index.js';
import { cn } from '../utils.js';

export interface NarrativeParagraph {
  id: string;
  text: string;
  highlights?: string[];
}

export interface NarrativePanelProps {
  headline: string;
  paragraphs: NarrativeParagraph[];
  attribution?: string;
  collapseAfter?: number;
  className?: string;
  accentColor?: string;
}

function highlightText(text: string, highlights: string[]): React.ReactNode {
  if (!highlights.length) return text;
  const pattern = new RegExp(
    `(${highlights.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'gi',
  );
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    highlights.some((h) => h.toLowerCase() === part.toLowerCase()) ? (
      <mark
        key={i}
        className="rounded-sm px-0.5"
        style={{ background: `${color.accent.blue}28`, color: color.accent.blue }}
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export function NarrativePanel({
  headline,
  paragraphs,
  attribution,
  collapseAfter,
  className,
  accentColor = color.accent.blue,
}: NarrativePanelProps) {
  const [expanded, setExpanded] = useState(false);
  const shouldCollapse = collapseAfter !== undefined && paragraphs.length > collapseAfter;
  const visible = shouldCollapse && !expanded ? paragraphs.slice(0, collapseAfter) : paragraphs;

  return (
    <div
      className={cn('rounded-lg px-4 py-4', className)}
      style={{ border: `1px solid ${color.border.default}`, background: color.bg.surface }}
    >
      <div className="mb-3 border-l-2 pl-3" style={{ borderColor: accentColor }}>
        <p className="text-sm font-semibold leading-snug" style={{ color: color.text.primary }}>
          {headline}
        </p>
      </div>

      <div className="space-y-2.5">
        {visible.map((p) => (
          <p key={p.id} className="text-sm leading-relaxed" style={{ color: color.text.secondary }}>
            {p.highlights?.length ? highlightText(p.text, p.highlights) : p.text}
          </p>
        ))}
      </div>

      {shouldCollapse && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 inline-flex items-center gap-1 text-xs transition-colors"
          style={{
            color: color.text.muted,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" /> Collapse
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              {paragraphs.length - (collapseAfter ?? 0)} more paragraph
              {paragraphs.length - (collapseAfter ?? 0) !== 1 ? 's' : ''}
            </>
          )}
        </button>
      )}

      {attribution && (
        <div
          className="mt-4 flex items-center gap-1.5 pt-3"
          style={{ borderTop: `1px solid ${color.border.subtle}` }}
        >
          <Cpu className="h-3 w-3" style={{ color: color.text.muted }} />
          <span className="text-xs" style={{ color: color.text.muted }}>
            {attribution}
          </span>
        </div>
      )}
    </div>
  );
}
