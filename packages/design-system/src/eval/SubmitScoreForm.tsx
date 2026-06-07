/**
 * SubmitScoreForm — controlled form for submitting an eval result.
 *
 * Renders a compact submission form that validates fields and calls back
 * with the structured payload ready for POST /eval-registry/results.
 */

import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { v } from '../tokens/vars.js';
import { cn } from '../utils.js';

export interface SubmitScorePayload {
  version: '1';
  entityId: string;
  entityLabel: string;
  entityType: string;
  domain: string;
  results: Array<{
    datasetId: string;
    taskId: string;
    metric: string;
    value: number | string;
    unit?: string;
    higherIsBetter?: boolean;
    evaluationFramework?: string;
    verifyToken?: string;
    date?: string;
    sourceUrl?: string;
    notes?: string;
  }>;
}

export interface SubmitScoreFormProps {
  /** Preset entity context (e.g. from the entity detail page) */
  entityId?: string;
  entityLabel?: string;
  entityType?: string;
  domain?: string;
  /** Called with the validated payload */
  onSubmit?: (payload: SubmitScorePayload) => Promise<void>;
  className?: string;
}

const ENTITY_TYPES = ['agent', 'model', 'workflow', 'intelligence-product', 'dataset', 'tool'];
const FRAMEWORKS = ['szl-native', 'inspect-ai', 'math-arena', 'lm-evaluation-harness', 'helm', 'openai-evals', 'custom'];

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function SubmitScoreForm({
  entityId: defaultEntityId = '',
  entityLabel: defaultEntityLabel = '',
  entityType: defaultEntityType = 'agent',
  domain: defaultDomain = '',
  onSubmit,
  className,
}: SubmitScoreFormProps) {
  const [entityId, setEntityId] = useState(defaultEntityId);
  const [entityLabel, setEntityLabel] = useState(defaultEntityLabel);
  const [entityType, setEntityType] = useState(defaultEntityType);
  const [domain, setDomain] = useState(defaultDomain);
  const [datasetId, setDatasetId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [metric, setMetric] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [framework, setFramework] = useState('szl-native');
  const [verifyToken, setVerifyToken] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const isValid =
    entityId.trim() &&
    entityLabel.trim() &&
    domain.trim() &&
    datasetId.trim() &&
    taskId.trim() &&
    metric.trim() &&
    value.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || !onSubmit) return;

    setStatus('submitting');
    setErrorMsg('');
    try {
      const numericVal = Number(value);
      const payload: SubmitScorePayload = {
        version: '1',
        entityId: entityId.trim(),
        entityLabel: entityLabel.trim(),
        entityType: entityType,
        domain: domain.trim(),
        results: [
          {
            datasetId: datasetId.trim(),
            taskId: taskId.trim(),
            metric: metric.trim(),
            value: Number.isFinite(numericVal) ? numericVal : value.trim(),
            unit: unit.trim() || undefined,
            evaluationFramework: framework as SubmitScorePayload['results'][0]['evaluationFramework'],
            verifyToken: verifyToken.trim() || undefined,
            sourceUrl: sourceUrl.trim() || undefined,
            notes: notes.trim() || undefined,
          },
        ],
      };
      await onSubmit(payload);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Submission failed');
    }
  }

  const inputCls = cn(
    'w-full rounded border bg-transparent px-3 py-2 text-sm outline-none transition-colors',
    'focus:ring-1 focus:ring-[var(--gi-accent-blue)]',
  );
  const labelCls = 'text-[11px] font-medium uppercase tracking-wider block mb-1';

  if (status === 'success') {
    return (
      <div
        className={cn('flex flex-col items-center gap-3 rounded border p-8 text-center', className)}
        style={{ borderColor: 'rgba(34,197,94,0.3)', backgroundColor: 'rgba(34,197,94,0.06)' }}
      >
        <CheckCircle className="h-8 w-8" style={{ color: 'var(--gi-accent-green)' }} />
        <p className="text-sm font-medium" style={{ color: v.textPrimary }}>
          Score submitted successfully
        </p>
        <p className="text-xs" style={{ color: v.textMuted }}>
          Your result is now in community review. It will be promoted to verified after a
          sandboxed re-run.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="text-xs underline"
          style={{ color: v.accentBlue }}
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex flex-col gap-4 rounded border p-5', className)}
      style={{ borderColor: v.borderDefault, backgroundColor: v.bgSurface }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Upload className="h-4 w-4 shrink-0" style={{ color: v.accentBlue }} />
        <span className="text-sm font-semibold" style={{ color: v.textPrimary }}>
          Submit Eval Score
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={labelCls} style={{ color: v.textMuted }}>
            Entity ID *
          </label>
          <input
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            placeholder="e.g. maritime-threat-agent-v2"
            required
            className={inputCls}
            style={{ borderColor: v.borderDefault, color: v.textPrimary }}
          />
        </div>
        <div className="col-span-2">
          <label className={labelCls} style={{ color: v.textMuted }}>
            Entity Label *
          </label>
          <input
            value={entityLabel}
            onChange={(e) => setEntityLabel(e.target.value)}
            placeholder="e.g. Maritime Threat Agent v2"
            required
            className={inputCls}
            style={{ borderColor: v.borderDefault, color: v.textPrimary }}
          />
        </div>
        <div>
          <label className={labelCls} style={{ color: v.textMuted }}>
            Entity Type *
          </label>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className={inputCls}
            style={{ borderColor: v.borderDefault, color: v.textPrimary }}
          >
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} style={{ color: v.textMuted }}>
            Domain *
          </label>
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="maritime"
            required
            className={inputCls}
            style={{ borderColor: v.borderDefault, color: v.textPrimary }}
          />
        </div>
      </div>

      <hr style={{ borderColor: v.borderSubtle }} />

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={labelCls} style={{ color: v.textMuted }}>
            Benchmark ID *
          </label>
          <input
            value={datasetId}
            onChange={(e) => setDatasetId(e.target.value)}
            placeholder="maritime-threat-detection-v1"
            required
            className={inputCls}
            style={{ borderColor: v.borderDefault, color: v.textPrimary }}
          />
        </div>
        <div className="col-span-2">
          <label className={labelCls} style={{ color: v.textMuted }}>
            Task ID *
          </label>
          <input
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            placeholder="threat-detection"
            required
            className={inputCls}
            style={{ borderColor: v.borderDefault, color: v.textPrimary }}
          />
        </div>
        <div>
          <label className={labelCls} style={{ color: v.textMuted }}>
            Metric *
          </label>
          <input
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            placeholder="accuracy"
            required
            className={inputCls}
            style={{ borderColor: v.borderDefault, color: v.textPrimary }}
          />
        </div>
        <div>
          <label className={labelCls} style={{ color: v.textMuted }}>
            Value *
          </label>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0.94"
            required
            className={inputCls}
            style={{ borderColor: v.borderDefault, color: v.textPrimary }}
          />
        </div>
        <div>
          <label className={labelCls} style={{ color: v.textMuted }}>
            Unit
          </label>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="% or ms"
            className={inputCls}
            style={{ borderColor: v.borderDefault, color: v.textPrimary }}
          />
        </div>
        <div>
          <label className={labelCls} style={{ color: v.textMuted }}>
            Framework
          </label>
          <select
            value={framework}
            onChange={(e) => setFramework(e.target.value)}
            className={inputCls}
            style={{ borderColor: v.borderDefault, color: v.textPrimary }}
          >
            {FRAMEWORKS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelCls} style={{ color: v.textMuted }}>
            Verify Token{' '}
            <span className="text-[10px] normal-case" style={{ color: v.textMuted }}>
              (enables sandboxed re-run → verified badge)
            </span>
          </label>
          <input
            value={verifyToken}
            onChange={(e) => setVerifyToken(e.target.value)}
            placeholder="optional — from CI or SDK"
            className={inputCls}
            style={{ borderColor: v.borderDefault, color: v.textPrimary }}
          />
        </div>
        <div className="col-span-2">
          <label className={labelCls} style={{ color: v.textMuted }}>
            Source URL
          </label>
          <input
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://... (trace, paper, or report)"
            className={inputCls}
            style={{ borderColor: v.borderDefault, color: v.textPrimary }}
          />
        </div>
        <div className="col-span-2">
          <label className={labelCls} style={{ color: v.textMuted }}>
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Model config, caveats, evaluation setup…"
            rows={2}
            className={cn(inputCls, 'resize-none')}
            style={{ borderColor: v.borderDefault, color: v.textPrimary }}
          />
        </div>
      </div>

      {status === 'error' && (
        <div
          className="flex items-start gap-2 rounded border px-3 py-2 text-xs"
          style={{
            borderColor: 'rgba(239,68,68,0.3)',
            backgroundColor: 'rgba(239,68,68,0.08)',
            color: 'var(--gi-accent-red)',
          }}
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!isValid || status === 'submitting'}
        className="flex items-center justify-center gap-2 rounded px-4 py-2.5 text-sm font-medium transition-opacity disabled:opacity-50"
        style={{ backgroundColor: v.accentBlue, color: '#fff' }}
      >
        {status === 'submitting' ? (
          <>
            <span className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full" />
            Submitting…
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Submit Score
          </>
        )}
      </button>
    </form>
  );
}
