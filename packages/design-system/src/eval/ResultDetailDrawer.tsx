/**
 * ResultDetailDrawer — slide-out panel showing full details of an eval result.
 */

import { X, ExternalLink, Calendar, Hash, Code } from 'lucide-react';
import { EvalBadge, type EvalBadgeState } from './EvalBadge.js';
import { ScoreChip } from './ScoreChip.js';
import { v } from '../tokens/vars.js';
import { cn } from '../utils.js';

export interface EvalResultDetail {
  resultId: string;
  benchmarkId: string;
  benchmarkName?: string;
  taskId: string;
  entityId: string;
  entityLabel: string;
  entityType: string;
  domain: string;
  metric: string;
  value: string | number;
  numericValue?: string | null;
  unit?: string | null;
  higherIsBetter?: boolean;
  badgeState: EvalBadgeState;
  evaluationFramework?: string | null;
  evalDate?: string | null;
  sourceUrl?: string | null;
  notes?: string | null;
  tags?: string[];
  submittedBy?: string | null;
  createdAt?: string;
}

export interface ResultDetailDrawerProps {
  result: EvalResultDetail | null;
  open: boolean;
  onClose: () => void;
  className?: string;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="text-[10px] font-medium uppercase tracking-wider"
        style={{ color: v.textMuted }}
      >
        {label}
      </span>
      <span className="text-sm" style={{ color: v.textPrimary }}>
        {value}
      </span>
    </div>
  );
}

export function ResultDetailDrawer({ result, open, onClose, className }: ResultDetailDrawerProps) {
  if (!open || !result) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-label="Eval result details"
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l shadow-2xl',
          className,
        )}
        style={{ backgroundColor: v.bgSurface, borderColor: v.borderDefault }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 border-b"
          style={{ backgroundColor: v.bgSurface, borderColor: v.borderSubtle }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <EvalBadge state={result.badgeState} />
            <span className="font-semibold text-sm truncate" style={{ color: v.textPrimary }}>
              {result.entityLabel}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1.5 transition-colors"
            aria-label="Close"
            style={{ color: v.textMuted }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.backgroundColor = v.bgHover)
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '')
            }
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-5 px-5 py-5">
          {/* Score */}
          <div>
            <span
              className="text-[10px] font-medium uppercase tracking-wider"
              style={{ color: v.textMuted }}
            >
              Score
            </span>
            <div className="mt-2">
              <ScoreChip
                metric={result.metric}
                value={
                  typeof result.value === 'number'
                    ? result.value
                    : Number(result.numericValue ?? result.value) || result.value
                }
                unit={result.unit ?? undefined}
                higherIsBetter={result.higherIsBetter ?? true}
                strong={result.badgeState === 'verified'}
              />
            </div>
          </div>

          {/* Divider */}
          <hr style={{ borderColor: v.borderSubtle }} />

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Entity type" value={result.entityType} />
            <Field label="Domain" value={result.domain} />
            <Field label="Benchmark" value={result.benchmarkName ?? result.benchmarkId} />
            <Field label="Task" value={result.taskId} />
            <Field label="Framework" value={result.evaluationFramework} />
            <Field label="Eval date" value={result.evalDate} />
            {result.submittedBy && <Field label="Submitted by" value={result.submittedBy} />}
          </div>

          {/* Notes */}
          {result.notes && (
            <>
              <hr style={{ borderColor: v.borderSubtle }} />
              <div>
                <span
                  className="text-[10px] font-medium uppercase tracking-wider"
                  style={{ color: v.textMuted }}
                >
                  Notes
                </span>
                <p
                  className="mt-1 text-sm leading-relaxed"
                  style={{ color: v.textSecondary }}
                >
                  {result.notes}
                </p>
              </div>
            </>
          )}

          {/* Tags */}
          {result.tags && result.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {result.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded border"
                  style={{
                    color: v.textSecondary,
                    borderColor: v.borderSubtle,
                    backgroundColor: v.bgOverlay,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* IDs */}
          <hr style={{ borderColor: v.borderSubtle }} />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Hash className="h-3 w-3 shrink-0" style={{ color: v.textMuted }} />
              <span className="font-mono text-[11px] truncate" style={{ color: v.textMuted }}>
                {result.resultId}
              </span>
            </div>
            {result.sourceUrl && (
              <a
                href={result.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-medium"
                style={{ color: v.accentBlue }}
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                View source / traces
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
