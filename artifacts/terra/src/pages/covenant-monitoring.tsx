import { useStandardQuery } from '@szl-holdings/api-client-react';
import { HelpTip } from '@szl-holdings/shared-ui/onboarding';
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit2,
  FileText,
  GitMerge,
  Plus,
  RefreshCw,
  Shield,
  Tag,
  TrendingUp,
  X,
} from 'lucide-react';
import { type FormEvent, useRef, useState } from 'react';

interface CovenantEvidence {
  source: string;
  value: string;
  confidence: number;
}

interface CovenantRecord {
  id: string;
  property: string;
  propertyId: string;
  borough?: string | null;
  lender: string;
  loanAgreementId?: string | null;
  loanAgreementUrl?: string | null;
  type: string;
  label: string;
  threshold: number;
  comparator: 'gte' | 'lte';
  current: number;
  status: 'breach' | 'watch' | 'compliant';
  severity: string;
  breachDate?: string | null;
  remedyDeadline?: string | null;
  guardianActionId?: string | null;
  pendingApproval?: boolean;
  evidence?: CovenantEvidence[];
  requiredApprovers?: string[];
  remedyPeriodDays?: number;
  financialSource?: string | null;
  financialDate?: string | null;
}

const ACCENT = '#40856a';
const API = '/api';

function fetchCovenants() {
  return fetch(`${API}/terra/cognitive/covenants`)
    .then((r) => r.json())
    .then((d) => d.data ?? d);
}

async function runScan() {
  const r = await fetch(`${API}/terra/cognitive/covenants/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  return r.json();
}

async function createCovenant(payload: Record<string, unknown>): Promise<{ error?: string; data?: unknown }> {
  const r = await fetch(`${API}/terra/cognitive/covenants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await r.json();
  if (!r.ok) {
    return { error: body?.error ?? `Server error ${r.status}` };
  }
  return body;
}

async function patchCovenant(id: string, payload: Record<string, unknown>): Promise<{ error?: string; data?: unknown }> {
  const r = await fetch(`${API}/terra/cognitive/covenants/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await r.json();
  if (!r.ok) {
    return { error: body?.error ?? `Server error ${r.status}` };
  }
  return body;
}

async function deactivateCovenant(id: string): Promise<{ ok: boolean; error?: string }> {
  const r = await fetch(`${API}/terra/cognitive/covenants/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  const body = await r.json();
  if (!r.ok) {
    return { ok: false, error: body?.error ?? `Server error ${r.status}` };
  }
  return { ok: true };
}

const STATUS_CONFIG: Record<string, { color: string; Icon: typeof CheckCircle; label: string }> = {
  breach: { color: '#c04a2a', Icon: AlertTriangle, label: 'Breach' },
  watch: { color: '#c8a060', Icon: Clock, label: 'Watch' },
  compliant: { color: '#40856a', Icon: CheckCircle, label: 'Compliant' },
};

const COVENANT_TYPE_LABELS: Record<string, string> = {
  dscr: 'DSCR (Debt Service Coverage)',
  ltv: 'LTV (Loan-to-Value)',
  occupancy: 'Occupancy',
  debt_yield: 'Debt Yield',
};

const TYPE_DEFAULTS: Record<string, { threshold: number; comparator: 'gte' | 'lte' }> = {
  dscr: { threshold: 1.2, comparator: 'gte' },
  ltv: { threshold: 0.75, comparator: 'lte' },
  occupancy: { threshold: 0.85, comparator: 'gte' },
  debt_yield: { threshold: 0.08, comparator: 'gte' },
};

function ConfidencePill({ value }: { value: number }) {
  const color = value >= 0.85 ? '#40856a' : value >= 0.65 ? '#c8a060' : '#c04a2a';
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-mono"
      style={{ background: `${color}18`, border: `1px solid ${color}30`, color }}
    >
      {(value * 100).toFixed(0)}% conf
    </span>
  );
}

// ─── Editor Modal ─────────────────────────────────────────────────────────────

interface CovenantFormState {
  propertyExternalId: string;
  propertyAddress: string;
  borough: string;
  lender: string;
  covenantType: string;
  label: string;
  thresholdValue: string;
  comparator: 'gte' | 'lte';
  loanAgreementId: string;
  loanAgreementUrl: string;
  requiredApprovers: string;
  remedyPeriodDays: string;
}

const EMPTY_FORM: CovenantFormState = {
  propertyExternalId: '',
  propertyAddress: '',
  borough: '',
  lender: '',
  covenantType: 'dscr',
  label: '',
  thresholdValue: '1.2',
  comparator: 'gte',
  loanAgreementId: '',
  loanAgreementUrl: '',
  requiredApprovers: 'terra-risk-officer',
  remedyPeriodDays: '60',
};

function covenantToForm(c: CovenantRecord): CovenantFormState {
  return {
    propertyExternalId: c.propertyId ?? '',
    propertyAddress: c.property ?? '',
    borough: c.borough ?? '',
    lender: c.lender ?? '',
    covenantType: c.type ?? 'dscr',
    label: c.label ?? '',
    thresholdValue: String(c.threshold ?? '1.2'),
    comparator: c.comparator ?? 'gte',
    loanAgreementId: c.loanAgreementId ?? '',
    loanAgreementUrl: c.loanAgreementUrl ?? '',
    requiredApprovers: Array.isArray(c.requiredApprovers)
      ? c.requiredApprovers.join(', ')
      : 'terra-risk-officer',
    remedyPeriodDays: String(c.remedyPeriodDays ?? 60),
  };
}

interface EditorModalProps {
  mode: 'create' | 'edit';
  initial: CovenantFormState;
  covenantId?: string;
  onClose: () => void;
  onSaved: () => void;
}

function EditorModal({ mode, initial, covenantId, onClose, onSaved }: EditorModalProps) {
  const [form, setForm] = useState<CovenantFormState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  function set(field: keyof CovenantFormState, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'covenantType') {
        const def = TYPE_DEFAULTS[value as keyof typeof TYPE_DEFAULTS];
        if (def) {
          next.thresholdValue = String(def.threshold);
          next.comparator = def.comparator;
        }
      }
      return next;
    });
  }

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const approvers = form.requiredApprovers
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (mode === 'create') {
        const result = await createCovenant({
          propertyExternalId: form.propertyExternalId,
          propertyAddress: form.propertyAddress,
          borough: form.borough || undefined,
          lender: form.lender,
          covenantType: form.covenantType,
          label: form.label || undefined,
          thresholdValue: parseFloat(form.thresholdValue),
          comparator: form.comparator,
          loanAgreementId: form.loanAgreementId || undefined,
          loanAgreementUrl: form.loanAgreementUrl || undefined,
          requiredApprovers: approvers.length ? approvers : ['terra-risk-officer'],
          remedyPeriodDays: parseInt(form.remedyPeriodDays, 10) || 60,
        });
        if (result.error) {
          setError(result.error);
          return;
        }
      } else {
        const result = await patchCovenant(covenantId!, {
          lender: form.lender,
          label: form.label || undefined,
          thresholdValue: parseFloat(form.thresholdValue),
          comparator: form.comparator,
          loanAgreementId: form.loanAgreementId || undefined,
          loanAgreementUrl: form.loanAgreementUrl || undefined,
          requiredApprovers: approvers.length ? approvers : ['terra-risk-officer'],
          remedyPeriodDays: parseInt(form.remedyPeriodDays, 10) || 60,
        });
        if (result.error) {
          setError(result.error);
          return;
        }
      }
      onSaved();
    } catch {
      setError('Failed to save covenant. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    'w-full px-3 py-2 rounded-lg text-xs font-mono outline-none transition-colors';
  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#e8edf8',
  };
  const labelCls = 'text-[10px] font-medium uppercase tracking-wider mb-1 block';
  const labelStyle = { color: 'rgba(255,255,255,0.45)' };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: '#111821',
          border: '1px solid rgba(255,255,255,0.1)',
          maxHeight: '90vh',
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="text-sm font-semibold" style={{ color: '#e8edf8' }}>
              {mode === 'create' ? 'Add Covenant' : 'Edit Covenant'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
          >
            <X className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
          {mode === 'create' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls} style={labelStyle}>
                  Property External ID *
                </label>
                <input
                  required
                  className={inputCls}
                  style={inputStyle}
                  placeholder="prop-abc123"
                  value={form.propertyExternalId}
                  onChange={(e) => set('propertyExternalId', e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls} style={labelStyle}>
                  Property Address *
                </label>
                <input
                  required
                  className={inputCls}
                  style={inputStyle}
                  placeholder="245 Park Avenue South"
                  value={form.propertyAddress}
                  onChange={(e) => set('propertyAddress', e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>
                  Borough
                </label>
                <input
                  className={inputCls}
                  style={inputStyle}
                  placeholder="Manhattan"
                  value={form.borough}
                  onChange={(e) => set('borough', e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>
                  Covenant Type *
                </label>
                <select
                  required
                  className={inputCls}
                  style={{ ...inputStyle, appearance: 'none' }}
                  value={form.covenantType}
                  onChange={(e) => set('covenantType', e.target.value)}
                >
                  {Object.entries(COVENANT_TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v} style={{ background: '#111821' }}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {mode === 'edit' && (
            <div
              className="rounded-lg px-3 py-2.5 text-xs"
              style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)' }}
            >
              <span className="font-medium" style={{ color: '#e8edf8' }}>
                {initial.propertyAddress}
              </span>{' '}
              · {COVENANT_TYPE_LABELS[form.covenantType] ?? form.covenantType}
            </div>
          )}

          <div>
            <label className={labelCls} style={labelStyle}>
              Lender *
            </label>
            <input
              required
              className={inputCls}
              style={inputStyle}
              placeholder="Pacific Bridge Capital"
              value={form.lender}
              onChange={(e) => set('lender', e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>
              Label
            </label>
            <input
              className={inputCls}
              style={inputStyle}
              placeholder="Debt Service Coverage Ratio"
              value={form.label}
              onChange={(e) => set('label', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={labelStyle}>
                Threshold *
              </label>
              <input
                required
                type="number"
                step="0.001"
                min="0"
                className={inputCls}
                style={inputStyle}
                value={form.thresholdValue}
                onChange={(e) => set('thresholdValue', e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>
                Comparator *
              </label>
              <select
                required
                className={inputCls}
                style={{ ...inputStyle, appearance: 'none' }}
                value={form.comparator}
                onChange={(e) => set('comparator', e.target.value as 'gte' | 'lte')}
              >
                <option value="gte" style={{ background: '#111821' }}>
                  ≥ (must be at or above)
                </option>
                <option value="lte" style={{ background: '#111821' }}>
                  ≤ (must be at or below)
                </option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={labelStyle}>
                Loan Agreement ID
              </label>
              <input
                className={inputCls}
                style={inputStyle}
                placeholder="LA-ABC123"
                value={form.loanAgreementId}
                onChange={(e) => set('loanAgreementId', e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>
                Remedy Period (days)
              </label>
              <input
                type="number"
                min="1"
                className={inputCls}
                style={inputStyle}
                value={form.remedyPeriodDays}
                onChange={(e) => set('remedyPeriodDays', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>
              Loan Agreement URL
            </label>
            <input
              type="url"
              className={inputCls}
              style={inputStyle}
              placeholder="https://docs.example.com/loan-agreement.pdf"
              value={form.loanAgreementUrl}
              onChange={(e) => set('loanAgreementUrl', e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>
              Required Approvers (comma-separated)
            </label>
            <input
              className={inputCls}
              style={inputStyle}
              placeholder="terra-risk-officer, cfo"
              value={form.requiredApprovers}
              onChange={(e) => set('requiredApprovers', e.target.value)}
            />
          </div>

          {error && (
            <div
              className="rounded-lg px-3 py-2 text-xs"
              style={{ background: 'rgba(192,74,42,0.1)', color: '#c04a2a', border: '1px solid rgba(192,74,42,0.25)' }}
            >
              {error}
            </div>
          )}
        </form>

        <div
          className="flex items-center justify-end gap-2 px-5 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { void handleSubmit(); }}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-60"
            style={{ background: ACCENT, color: '#fff', border: 'none' }}
          >
            {saving ? (
              <>
                <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : mode === 'create' ? (
              <>
                <Plus className="w-3 h-3" />
                Create Covenant
              </>
            ) : (
              <>
                <Edit2 className="w-3 h-3" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Covenant Card ────────────────────────────────────────────────────────────

function CovenantCard({
  covenant,
  onEdit,
  onDeactivate,
}: {
  covenant: CovenantRecord;
  onEdit: (c: CovenantRecord) => void;
  onDeactivate: (c: CovenantRecord) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[covenant.status] ?? STATUS_CONFIG.compliant;
  const Icon = cfg.Icon;
  const isBreachOrWatch = covenant.status === 'breach' || covenant.status === 'watch';
  const pct = covenant.current / covenant.threshold;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: `1px solid ${covenant.status === 'breach' ? 'rgba(192,74,42,0.25)' : covenant.status === 'watch' ? 'rgba(200,160,96,0.2)' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      <div
        className="p-4"
        style={{
          background:
            covenant.status === 'breach' ? 'rgba(192,74,42,0.05)' : 'rgba(255,255,255,0.02)',
        }}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg flex-shrink-0" style={{ background: `${cfg.color}18` }}>
            <Icon className="w-4 h-4" style={{ color: cfg.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <div className="text-sm font-semibold" style={{ color: '#e8edf8' }}>
                  {covenant.property}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {covenant.lender} · {covenant.label}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: `${cfg.color}18`, color: cfg.color }}
                >
                  {cfg.label}
                </span>
                <button
                  onClick={() => onEdit(covenant)}
                  className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
                  title="Edit covenant"
                >
                  <Edit2 className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.35)' }} />
                </button>
              </div>
            </div>

            <div className="mt-3 mb-2">
              <div
                className="flex justify-between text-[10px] mb-1"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                <span>
                  Current:{' '}
                  <span
                    className="font-mono font-semibold"
                    style={{ color: isBreachOrWatch ? cfg.color : '#e8edf8' }}
                  >
                    {covenant.type === 'ltv' || covenant.type === 'occupancy'
                      ? `${(covenant.current * 100).toFixed(0)}%`
                      : `${covenant.current.toFixed(2)}x`}
                  </span>
                </span>
                <span>
                  Threshold:{' '}
                  <span className="font-mono font-semibold" style={{ color: '#e8edf8' }}>
                    {covenant.type === 'ltv' || covenant.type === 'occupancy'
                      ? `${(covenant.threshold * 100).toFixed(0)}%`
                      : `${covenant.threshold.toFixed(2)}x`}
                  </span>
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(pct * 100, 100)}%`,
                    background:
                      covenant.status === 'breach'
                        ? '#c04a2a'
                        : covenant.status === 'watch'
                          ? '#c8a060'
                          : ACCENT,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {covenant.financialSource && (
                <span
                  className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(64,133,106,0.12)', color: ACCENT, border: `1px solid rgba(64,133,106,0.2)` }}
                  title={covenant.financialDate ? `Statement date: ${covenant.financialDate}` : undefined}
                >
                  <TrendingUp className="w-2.5 h-2.5" />
                  {covenant.financialSource}
                  {covenant.financialDate && (
                    <span style={{ color: 'rgba(64,133,106,0.7)' }}> · {covenant.financialDate}</span>
                  )}
                </span>
              )}
              {covenant.breachDate && (
                <span className="flex items-center gap-1 text-[9px]" style={{ color: '#c04a2a' }}>
                  <AlertTriangle className="w-2.5 h-2.5" />
                  Breach: {covenant.breachDate}
                </span>
              )}
              {covenant.remedyDeadline && (
                <span className="flex items-center gap-1 text-[9px]" style={{ color: '#c8a060' }}>
                  <Clock className="w-2.5 h-2.5" />
                  Remedy by: {covenant.remedyDeadline}
                </span>
              )}
              {covenant.pendingApproval && (
                <span
                  className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(74,125,200,0.15)', color: '#4a7dc8' }}
                >
                  <GitMerge className="w-2.5 h-2.5" />
                  Approval pending
                </span>
              )}
              {covenant.loanAgreementUrl && (
                <a
                  href={covenant.loanAgreementUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded transition-colors"
                  style={{ background: `${ACCENT}12`, color: ACCENT }}
                >
                  <FileText className="w-2.5 h-2.5" />
                  Loan Agreement
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[10px] transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Evidence chain ({covenant.evidence?.length ?? 0})
          </button>
          <button
            onClick={() => onDeactivate(covenant)}
            className="text-[9px] px-2 py-0.5 rounded transition-colors"
            style={{ color: 'rgba(192,74,42,0.6)', background: 'rgba(192,74,42,0.06)' }}
          >
            Deactivate
          </button>
        </div>
      </div>

      {expanded && (covenant.evidence?.length ?? 0) > 0 && covenant.evidence && (
        <div
          className="p-4 space-y-2"
          style={{ background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          {covenant.evidence.map((ev: CovenantEvidence, i: number) => (
            <div
              key={i}
              className="flex items-start gap-2 p-2 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <FileText className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-medium" style={{ color: '#e8edf8' }}>
                    {ev.source}
                  </span>
                  <ConfidencePill value={ev.confidence} />
                </div>
                <div
                  className="text-[10px] mt-0.5 italic"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  {ev.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; covenant: CovenantRecord }
  | { type: 'confirmDeactivate'; covenant: CovenantRecord };

export default function CovenantMonitoringPage() {
  const { data, isLoading, refetch } = useStandardQuery({
    queryKey: ['terra-covenants'],
    queryFn: fetchCovenants,
  });

  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  const covenants: CovenantRecord[] = (data?.covenants ?? []) as CovenantRecord[];
  const summary = data?.summary;
  const skill = data?.scheduledSkill;
  const prov = data?.provenance;

  async function handleDeactivateConfirm(covenant: CovenantRecord) {
    setDeactivating(true);
    setDeactivateError(null);
    try {
      const result = await deactivateCovenant(covenant.id);
      if (!result.ok) {
        setDeactivateError(result.error ?? 'Failed to deactivate covenant.');
        return;
      }
      setModal({ type: 'none' });
      refetch();
    } catch {
      setDeactivateError('Failed to deactivate covenant. Please try again.');
    } finally {
      setDeactivating(false);
    }
  }

  return (
    <div style={{ padding: '28px 28px 40px', maxWidth: 1280, margin: '0 auto' }}>
      {modal.type === 'create' && (
        <EditorModal
          mode="create"
          initial={EMPTY_FORM}
          onClose={() => setModal({ type: 'none' })}
          onSaved={() => {
            setModal({ type: 'none' });
            refetch();
          }}
        />
      )}
      {modal.type === 'edit' && (
        <EditorModal
          mode="edit"
          initial={covenantToForm(modal.covenant)}
          covenantId={modal.covenant.id}
          onClose={() => setModal({ type: 'none' })}
          onSaved={() => {
            setModal({ type: 'none' });
            refetch();
          }}
        />
      )}
      {modal.type === 'confirmDeactivate' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: '#111821', border: '1px solid rgba(192,74,42,0.3)' }}
          >
            <AlertTriangle className="w-5 h-5 mb-3" style={{ color: '#c04a2a' }} />
            <div className="text-sm font-semibold mb-1" style={{ color: '#e8edf8' }}>
              Deactivate Covenant?
            </div>
            <div className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              This will stop monitoring{' '}
              <span className="font-medium" style={{ color: '#e8edf8' }}>
                {modal.covenant.label}
              </span>{' '}
              for <span className="font-medium" style={{ color: '#e8edf8' }}>{modal.covenant.property}</span>.
              It will no longer appear in scans.
            </div>
            {deactivateError && (
              <div
                className="rounded-lg px-3 py-2 text-xs mb-4"
                style={{ background: 'rgba(192,74,42,0.1)', color: '#c04a2a', border: '1px solid rgba(192,74,42,0.25)' }}
              >
                {deactivateError}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { setModal({ type: 'none' }); setDeactivateError(null); }}
                className="flex-1 py-2 rounded-lg text-xs font-medium"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeactivateConfirm(modal.covenant)}
                disabled={deactivating}
                className="flex-1 py-2 rounded-lg text-xs font-medium disabled:opacity-60"
                style={{ background: '#c04a2a', color: '#fff' }}
              >
                {deactivating ? 'Deactivating…' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4" style={{ color: ACCENT }} />
            <h1
              className="text-xl font-semibold flex items-center gap-1.5"
              style={{ color: '#e8edf8' }}
            >
              Covenant Monitoring
              <HelpTip
                tipId="terra.covenant-monitoring"
                platform="terra"
                title="Covenant Monitoring"
                content="A scheduled skill that re-evaluates loan covenants — DSCR, LTV, occupancy, payment status — across every active position. Any breach automatically opens a guardian approval, never a silent override."
                accentColor="#84cc16"
                iconSize={13}
              />
            </h1>
          </div>
          <p className="text-sm" style={{ color: '#94a3b8' }}>
            Scheduled skill tracks loan covenants across all active positions. Violations
            automatically create guardian approvals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModal({ type: 'create' })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: `${ACCENT}22`, border: `1px solid ${ACCENT}40`, color: ACCENT }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Covenant
          </button>
          <button
            onClick={async () => {
              try {
                await runScan();
              } catch {
                /* swallowed; refetch will reflect cached state */
              }
              refetch();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}30`, color: ACCENT }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Run Check
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div
            className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{ borderColor: `${ACCENT}30`, borderTopColor: ACCENT }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Covenants', value: summary?.total ?? 0, color: '#64748b' },
              { label: 'In Breach', value: summary?.breach ?? 0, color: '#c04a2a' },
              { label: 'Watch', value: summary?.watch ?? 0, color: '#c8a060' },
              {
                label: 'Pending Approvals',
                value: summary?.pendingApprovals ?? 0,
                color: '#4a7dc8',
              },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-xl p-4"
                style={{ background: `${m.color}08`, border: `1px solid ${m.color}20` }}
              >
                <Bell className="w-3.5 h-3.5 mb-2" style={{ color: m.color }} />
                <div
                  className="text-2xl font-bold font-mono"
                  style={{
                    color: m.value > 0 && m.label !== 'Total Covenants' ? m.color : '#e8edf8',
                  }}
                >
                  {m.value}
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {m.label}
                </div>
              </div>
            ))}
          </div>

          {skill && (
            <div
              className="rounded-xl p-4"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: ACCENT }}
                  />
                  <span className="text-xs font-semibold" style={{ color: ACCENT }}>
                    Scheduled Skill Active
                  </span>
                </div>
                <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {skill.name}
                </span>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  · {skill.cadence}
                </span>
                <div
                  className="ml-auto flex items-center gap-3 text-[10px]"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  <span>Last: {new Date(skill.lastRun).toLocaleString()}</span>
                  <span>Next: {new Date(skill.nextRun).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-3">
              {covenants.length === 0 ? (
                <div
                  className="rounded-xl p-8 flex flex-col items-center gap-3 text-center"
                  style={{ border: '1px dashed rgba(255,255,255,0.1)' }}
                >
                  <Shield className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.15)' }} />
                  <div className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    No active covenants found
                  </div>
                  <button
                    onClick={() => setModal({ type: 'create' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium mt-1"
                    style={{ background: `${ACCENT}22`, color: ACCENT }}
                  >
                    <Plus className="w-3 h-3" />
                    Add your first covenant
                  </button>
                </div>
              ) : (
                covenants.map((c) => (
                  <CovenantCard
                    key={c.id}
                    covenant={c}
                    onEdit={(cov) => setModal({ type: 'edit', covenant: cov })}
                    onDeactivate={(cov) => setModal({ type: 'confirmDeactivate', covenant: cov })}
                  />
                ))
              )}
            </div>

            <div className="space-y-4">
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="text-xs font-semibold mb-3 uppercase tracking-wider"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  Covenant Types Monitored
                </div>
                {[
                  {
                    label: 'DSCR (Debt Service Coverage)',
                    desc: 'Minimum cash flow vs debt payments',
                    active: true,
                  },
                  {
                    label: 'LTV (Loan-to-Value)',
                    desc: 'Property value vs outstanding debt',
                    active: true,
                  },
                  { label: 'Occupancy', desc: 'Minimum physical/economic occupancy', active: true },
                  {
                    label: 'Debt Yield',
                    desc: 'NOI divided by outstanding loan balance',
                    active: true,
                  },
                  {
                    label: 'Capital Reserve',
                    desc: 'Required reserve fund maintenance',
                    active: false,
                  },
                ].map((t) => (
                  <div
                    key={t.label}
                    className="flex items-start gap-2 py-2"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: t.active ? ACCENT : 'rgba(255,255,255,0.15)' }}
                    />
                    <div>
                      <div
                        className="text-xs font-medium"
                        style={{ color: t.active ? '#e8edf8' : 'rgba(255,255,255,0.3)' }}
                      >
                        {t.label}
                      </div>
                      <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {t.desc}
                      </div>
                    </div>
                    <span
                      className="ml-auto text-[9px]"
                      style={{ color: t.active ? ACCENT : 'rgba(255,255,255,0.2)' }}
                    >
                      {t.active ? 'Active' : 'Soon'}
                    </span>
                  </div>
                ))}
              </div>

              {prov && (
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                    <span
                      className="text-xs font-semibold"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      Provenance
                    </span>
                  </div>
                  <div
                    className="text-[10px] font-mono mb-1"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                  >
                    {prov.source}
                  </div>
                  <div className="text-[9px]" style={{ color: 'rgba(64,133,106,0.5)' }}>
                    {prov.traceRef}
                  </div>
                  <div className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    {prov.runtime}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
