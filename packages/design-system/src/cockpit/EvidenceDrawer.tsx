import { Clock, ExternalLink, Link2, Shield, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { ConfidenceMeter } from '../proof/ConfidenceMeter.js';
import { FreshnessChip, type FreshnessLevel } from '../proof/FreshnessChip.js';
import { type PolicyState, PolicyStateChip } from '../proof/PolicyStateChip.js';
import { color } from '../tokens/index.js';
import { cn } from '../utils.js';

export interface EvidenceItem {
  evidenceId: string;
  kind: 'raw' | 'normalized' | 'derived';
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

const KIND_LABELS: Record<EvidenceItem['kind'], { label: string; accentColor: string }> = {
  raw: { label: 'RAW', accentColor: color.accent.blue },
  normalized: { label: 'NORM', accentColor: color.accent.violet },
  derived: { label: 'DERIVED', accentColor: color.accent.violet },
};

export function EvidenceDrawer({
  open,
  onClose,
  title = 'Evidence',
  evidence,
  className,
  accent = color.accent.violet,
}: EvidenceDrawerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(6,11,18,0.65)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={ref}
        role="dialog"
        aria-label={title}
        className={cn(
          'fixed right-0 top-0 bottom-0 z-50 flex w-[420px] max-w-[95vw] flex-col shadow-2xl transition-transform duration-200',
          open ? 'translate-x-0' : 'translate-x-full',
          className,
        )}
        style={{ background: color.bg.surface, borderLeft: `2px solid ${accent}` }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${color.border.subtle}` }}
        >
          <div>
            <div className="text-sm font-semibold" style={{ color: color.text.primary }}>
              {title}
            </div>
            <div className="mt-0.5 text-xs" style={{ color: color.text.muted }}>
              {evidence.length} evidence item{evidence.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded transition-colors"
            style={{
              border: `1px solid ${color.border.subtle}`,
              color: color.text.muted,
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {evidence.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Shield className="mb-3 h-8 w-8" style={{ color: color.border.subtle }} />
              <p className="text-sm" style={{ color: color.text.muted }}>
                No evidence recorded
              </p>
            </div>
          )}

          {evidence.map((item) => {
            const kd = KIND_LABELS[item.kind];
            return (
              <div
                key={item.evidenceId}
                className="rounded-lg p-3 space-y-2"
                style={{
                  border: `1px solid ${color.border.subtle}`,
                  background: color.bg.overlay,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="shrink-0 rounded px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider"
                      style={{
                        color: kd.accentColor,
                        background: color.bg.surface,
                        border: `1px solid ${color.border.default}`,
                      }}
                    >
                      {kd.label}
                    </span>
                    <span
                      className="truncate text-xs font-medium"
                      style={{ color: color.text.primary }}
                    >
                      {item.source}
                    </span>
                  </div>
                  {item.drillUrl && (
                    <a
                      href={item.drillUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 transition-colors"
                      style={{ color: color.text.muted }}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <p className="text-xs leading-relaxed" style={{ color: color.text.secondary }}>
                  {item.summary}
                </p>

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
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                        style={{
                          border: `1px solid ${color.border.default}`,
                          color: color.text.secondary,
                        }}
                      >
                        <Link2 className="h-2.5 w-2.5" />
                        {el.label}
                      </span>
                    ))}
                  </div>
                )}

                {item.changeNote && (
                  <div
                    className="flex items-center gap-1.5 rounded px-2 py-1"
                    style={{
                      border: `1px solid ${color.border.default}`,
                      background: color.bg.surface,
                    }}
                  >
                    <Clock className="h-3 w-3 shrink-0" style={{ color: color.accent.amber }} />
                    <span className="text-xs" style={{ color: color.accent.amber }}>
                      {item.changeNote}
                    </span>
                  </div>
                )}

                <div className="font-mono text-xs" style={{ color: color.text.muted }}>
                  {item.ref}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
