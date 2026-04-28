import { Eye, Play } from 'lucide-react';
import { ACCENT, BG, BORDER, OUTCOME_CFG, TEXT } from './constants';
import { OutcomeBadge } from './shared';
import type { PreviewCase } from './types';

interface Props {
  previewCases: PreviewCase[];
  previewRan: boolean;
  compiled: unknown;
  runPreview: () => void;
}

export function PreviewTab({ previewCases, previewRan, compiled, runPreview }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[12px] font-semibold mb-0.5" style={{ color: TEXT.primary }}>Policy Preview</div>
          <div className="text-[10px] font-mono" style={{ color: TEXT.secondary }}>Run the compiled policy against 7 representative historical actions to see outcomes.</div>
        </div>
        <button onClick={runPreview} disabled={!compiled} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-semibold disabled:opacity-40" style={{ color: ACCENT, background: `${ACCENT}12`, border: `1px solid ${ACCENT}35` }}>
          <Play className="w-3 h-3" />
          {previewRan ? 'Re-run Preview' : 'Run Preview'}
        </button>
      </div>

      {!previewRan ? (
        <div className="rounded border p-8 flex flex-col items-center gap-2" style={{ background: BG.surface, borderColor: BORDER.subtle }}>
          <Eye className="w-8 h-8" style={{ color: TEXT.muted }} />
          <div className="text-[11px] font-mono" style={{ color: TEXT.tertiary }}>Compile a policy and run the preview to see outcomes</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {previewCases.map((pc) => {
            const outcomeKey = pc.outcome ?? 'allowed';
            const cfg = OUTCOME_CFG[outcomeKey];
            const changed = pc.previousOutcome && pc.previousOutcome !== pc.outcome;
            return (
              <div key={pc.id} className="rounded border p-3" style={{ background: BG.surface, borderColor: changed ? `${ACCENT}35` : BORDER.muted }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded uppercase" style={{ color: TEXT.muted, background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER.subtle}` }}>{pc.actionType}</span>
                      <span className="text-[12px] font-medium" style={{ color: TEXT.primary }}>{pc.description}</span>
                    </div>
                    {pc.matchedRule && <div className="text-[9px] font-mono mt-1" style={{ color: TEXT.tertiary }}>Matched: "{pc.matchedRule}"</div>}
                    {pc.reasoning && <div className="text-[9px] font-mono mt-0.5" style={{ color: TEXT.muted }}>{pc.reasoning}</div>}
                    <div className="flex gap-2 mt-1 flex-wrap text-[9px] font-mono" style={{ color: TEXT.tertiary }}>
                      {Object.entries(pc.context).map(([k, v]) => (
                        <span key={k}>{k}: {typeof v === 'number' ? `$${Number(v).toLocaleString()}` : String(v)}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <OutcomeBadge outcome={outcomeKey} />
                    {changed && pc.previousOutcome && (
                      <div className="flex items-center gap-1 text-[9px] font-mono" style={{ color: ACCENT }}>
                        was: <OutcomeBadge outcome={pc.previousOutcome} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="rounded border p-3 mt-2" style={{ background: BG.surface, borderColor: BORDER.subtle }}>
            <div className="text-[10px] font-mono font-semibold mb-2" style={{ color: TEXT.secondary }}>Outcome Summary</div>
            <div className="flex flex-wrap gap-2">
              {(['allowed', 'approval_required', 'escalated', 'blocked', 'audited'] as const).map((outcome) => {
                const count = previewCases.filter((p) => p.outcome === outcome).length;
                if (count === 0) return null;
                const cfg = OUTCOME_CFG[outcome];
                return (
                  <div key={outcome} className="flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-mono" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                    <cfg.Icon className="w-3 h-3" />{count} {cfg.label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
