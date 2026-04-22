import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Hand,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearch } from 'wouter';

import { fetchJson as tracedFetchJson } from './cognitive/shared';

const ACCENT = '#d4a054';

type PolicyMode =
  | 'observe'
  | 'recommend'
  | 'draft'
  | 'approval-required'
  | 'auto-within-guardrails';

const MODE_META: Record<
  PolicyMode,
  {
    label: string;
    description: string;
    color: string;
    bg: string;
    border: string;
    Icon: React.FC<{ className?: string }>;
  }
> = {
  observe: {
    label: 'Observe',
    description: 'Log only — no action',
    color: '#7c8a9a',
    bg: 'rgba(124,138,154,0.10)',
    border: 'rgba(124,138,154,0.30)',
    Icon: Eye,
  },
  recommend: {
    label: 'Recommend',
    description: 'Surface recommendation, no execution',
    color: '#8b7ac8',
    bg: 'rgba(139,122,200,0.10)',
    border: 'rgba(139,122,200,0.30)',
    Icon: FileText,
  },
  draft: {
    label: 'Draft',
    description: 'Produce draft for human review',
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.10)',
    border: 'rgba(14,165,233,0.30)',
    Icon: FileText,
  },
  'approval-required': {
    label: 'Approval Required',
    description: 'Queue for explicit human sign-off',
    color: '#d4a054',
    bg: 'rgba(212,160,84,0.10)',
    border: 'rgba(212,160,84,0.30)',
    Icon: Hand,
  },
  'auto-within-guardrails': {
    label: 'Auto (Guardrails)',
    description: 'Execute autonomously within limits',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.10)',
    border: 'rgba(34,197,94,0.30)',
    Icon: Bot,
  },
};

interface PolicyModeConfig {
  id: string;
  scope: { product: string; actionType: string; workspace: string };
  mode: PolicyMode;
  confidenceThreshold: number;
  maxCostUsd?: number;
  guardedEntitySensitivity: string;
  environment: string;
  reason?: string;
  createdBy?: string;
  createdAt: number;
  updatedAt: number;
}

interface ApiResponse<T> {
  data: T;
  total?: number;
}

function getCsrfToken(): string | undefined {
  const match = document.cookie.split(';').find((c) => c.trim().startsWith('csrf_token='));
  return match ? decodeURIComponent(match.trim().split('=').slice(1).join('=')) : undefined;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const isMutating = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method);
  const csrf = isMutating ? getCsrfToken() : undefined;
  return tracedFetchJson<T>(url, {
    ...init,
    headers: {
      ...(csrf ? { 'x-csrf-token': csrf } : {}),
      ...(init?.headers ?? {}),
    },
  });
}

function ModePill({ mode }: { mode: PolicyMode }) {
  const m = MODE_META[mode] ?? MODE_META['approval-required'];
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold tracking-wider px-1.5 py-px rounded uppercase"
      style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}
    >
      <m.Icon className="w-2.5 h-2.5" />
      {m.label}
    </span>
  );
}

const EMPTY_FORM = {
  product: '',
  actionType: '',
  workspace: '*',
  mode: 'approval-required' as PolicyMode,
  confidenceThreshold: 0.8,
  maxCostUsd: '',
  guardedEntitySensitivity: 'internal',
  environment: 'production',
  reason: '',
};

function ModeForm({
  initial,
  onSubmit,
  onCancel,
  busy,
}: {
  initial?: typeof EMPTY_FORM;
  onSubmit: (values: typeof EMPTY_FORM) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM);
  const set = (k: keyof typeof EMPTY_FORM, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const valid = form.product.trim().length > 0 && form.actionType.trim().length > 0;

  return (
    <div
      className="rounded border p-3 flex flex-col gap-2"
      style={{ borderColor: `${ACCENT}25`, background: `${ACCENT}06` }}
    >
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label
            className="text-[9px] uppercase tracking-widest font-mono mb-1 block"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Product *
          </label>
          <input
            className="w-full text-[11px] px-2 py-1.5 rounded outline-none"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.85)',
            }}
            placeholder="e.g. vessels"
            value={form.product}
            onChange={(e) => set('product', e.target.value)}
          />
        </div>
        <div>
          <label
            className="text-[9px] uppercase tracking-widest font-mono mb-1 block"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Action Type *
          </label>
          <input
            className="w-full text-[11px] px-2 py-1.5 rounded outline-none"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.85)',
            }}
            placeholder="e.g. vessel.reroute"
            value={form.actionType}
            onChange={(e) => set('actionType', e.target.value)}
          />
        </div>
        <div>
          <label
            className="text-[9px] uppercase tracking-widest font-mono mb-1 block"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Workspace
          </label>
          <input
            className="w-full text-[11px] px-2 py-1.5 rounded outline-none"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.85)',
            }}
            placeholder="* (all)"
            value={form.workspace}
            onChange={(e) => set('workspace', e.target.value)}
          />
        </div>
        <div>
          <label
            className="text-[9px] uppercase tracking-widest font-mono mb-1 block"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Mode *
          </label>
          <select
            className="w-full text-[11px] px-2 py-1.5 rounded outline-none"
            style={{
              background: '#0c1420',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.85)',
            }}
            value={form.mode}
            onChange={(e) => set('mode', e.target.value as PolicyMode)}
          >
            {(Object.keys(MODE_META) as PolicyMode[]).map((m) => (
              <option key={m} value={m}>
                {MODE_META[m].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="text-[9px] uppercase tracking-widest font-mono mb-1 block"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Min Confidence
          </label>
          <input
            type="number"
            min={0}
            max={1}
            step={0.05}
            className="w-full text-[11px] px-2 py-1.5 rounded outline-none"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.85)',
            }}
            value={form.confidenceThreshold}
            onChange={(e) => set('confidenceThreshold', parseFloat(e.target.value))}
          />
        </div>
        <div>
          <label
            className="text-[9px] uppercase tracking-widest font-mono mb-1 block"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Max Cost (USD)
          </label>
          <input
            type="number"
            min={0}
            className="w-full text-[11px] px-2 py-1.5 rounded outline-none"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.85)',
            }}
            placeholder="unlimited"
            value={form.maxCostUsd}
            onChange={(e) => set('maxCostUsd', e.target.value)}
          />
        </div>
        <div>
          <label
            className="text-[9px] uppercase tracking-widest font-mono mb-1 block"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Entity Sensitivity
          </label>
          <select
            className="w-full text-[11px] px-2 py-1.5 rounded outline-none"
            style={{
              background: '#0c1420',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.85)',
            }}
            value={form.guardedEntitySensitivity}
            onChange={(e) => set('guardedEntitySensitivity', e.target.value)}
          >
            {['public', 'internal', 'confidential', 'restricted'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="text-[9px] uppercase tracking-widest font-mono mb-1 block"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Environment
          </label>
          <select
            className="w-full text-[11px] px-2 py-1.5 rounded outline-none"
            style={{
              background: '#0c1420',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.85)',
            }}
            value={form.environment}
            onChange={(e) => set('environment', e.target.value)}
          >
            {['all', 'development', 'staging', 'production'].map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label
          className="text-[9px] uppercase tracking-widest font-mono mb-1 block"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          Reason / Notes
        </label>
        <input
          className="w-full text-[11px] px-2 py-1.5 rounded outline-none"
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.85)',
          }}
          placeholder="Why this mode for this scope?"
          value={form.reason}
          onChange={(e) => set('reason', e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          disabled={busy || !valid}
          onClick={() => onSubmit(form)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold transition-opacity disabled:opacity-50"
          style={{
            color: '#22c55e',
            background: 'rgba(34,197,94,0.10)',
            border: '1px solid rgba(34,197,94,0.35)',
          }}
        >
          <Check className="w-3 h-3" /> Save
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold"
          style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <X className="w-3 h-3" /> Cancel
        </button>
      </div>
    </div>
  );
}

function ConfigRow({
  config,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  busy,
}: {
  config: PolicyModeConfig;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  return (
    <div
      className="rounded border"
      style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span style={{ color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[12px] font-semibold font-mono"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              {config.scope.product}
            </span>
            <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
              · {config.scope.actionType}
            </span>
            {config.scope.workspace !== '*' && (
              <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
                @ {config.scope.workspace}
              </span>
            )}
            <ModePill mode={config.mode} />
          </div>
          <div className="text-[10px] font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            conf ≥ {(config.confidenceThreshold * 100).toFixed(0)}%
            {config.maxCostUsd !== undefined
              ? ` · cost ≤ $${config.maxCostUsd.toLocaleString()}`
              : ''}
            {' · '}
            {config.environment}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          {config.reason && (
            <div className="text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {config.reason}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono mb-3">
            <div>
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>Entity Sensitivity</span>{' '}
              <span style={{ color: 'rgba(255,255,255,0.75)' }}>
                {config.guardedEntitySensitivity}
              </span>
            </div>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>Created By</span>{' '}
              <span style={{ color: 'rgba(255,255,255,0.75)' }}>{config.createdBy ?? '—'}</span>
            </div>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>Config ID</span>{' '}
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>{config.id.substring(0, 16)}…</span>
            </div>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>Updated</span>{' '}
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                {new Date(config.updatedAt).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={busy}
              onClick={onEdit}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold"
              style={{ color: ACCENT, background: `${ACCENT}12`, border: `1px solid ${ACCENT}35` }}
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
            <button
              disabled={busy}
              onClick={onDelete}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold"
              style={{
                color: '#ef4444',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
              }}
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface AuditEntry {
  id: string;
  agentId: string;
  action: string;
  executionResult: string;
  timestamp: string;
}

export default function PolicyManagerPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAudit, setShowAudit] = useState(false);
  const qc = useQueryClient();

  const search = useSearch();
  const initialProductFilter = useMemo(() => {
    const params = new URLSearchParams(search);
    return params.get('product') ?? '';
  }, [search]);
  const [productFilter, setProductFilter] = useState<string>(initialProductFilter);
  useEffect(() => {
    setProductFilter(initialProductFilter);
  }, [initialProductFilter]);

  const modesQ = useStandardQuery<ApiResponse<PolicyModeConfig[]>>({
    queryKey: ['policy-modes'],
    queryFn: () => fetchJson<ApiResponse<PolicyModeConfig[]>>('/api/policy-modes'),
    refetchInterval: 30_000,
  });

  const auditQ = useStandardQuery<{ entries: AuditEntry[]; total: number; integrity: boolean }>({
    queryKey: ['policy-modes-audit'],
    queryFn: () =>
      fetchJson('/api/control-tower/govern/audit?limit=30'),
    enabled: showAudit,
    staleTime: 30_000,
  });

  const metaQ = useStandardQuery<{ modes: Array<{ mode: PolicyMode; description: string }> }>({
    queryKey: ['policy-modes-meta'],
    queryFn: () => fetchJson('/api/policy-modes/meta'),
    staleTime: Infinity,
  });

  const createMut = useStandardMutation({
    mutationFn: (body: object) =>
      fetchJson('/api/policy-modes', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['policy-modes'] });
      setCreating(false);
    },
  });

  const updateMut = useStandardMutation({
    mutationFn: ({ id, body }: { id: string; body: object }) =>
      fetchJson(`/api/policy-modes/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['policy-modes'] });
      setEditingId(null);
    },
  });

  const deleteMut = useStandardMutation({
    mutationFn: (id: string) => fetchJson(`/api/policy-modes/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policy-modes'] }),
  });

  const seedMut = useStandardMutation({
    mutationFn: () => fetchJson('/api/demo/seed-governed-scenarios', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policy-modes'] }),
  });

  const allConfigs = modesQ.data?.data ?? [];
  const configs = useMemo(() => {
    if (!productFilter) return allConfigs;
    const needle = productFilter.toLowerCase();
    return allConfigs.filter((c) => c.scope.product.toLowerCase() === needle);
  }, [allConfigs, productFilter]);
  const busy = createMut.isPending || updateMut.isPending || deleteMut.isPending;

  function handleCreate(form: typeof EMPTY_FORM) {
    const body = {
      scope: {
        product: form.product || '*',
        actionType: form.actionType || '*',
        workspace: form.workspace || '*',
      },
      mode: form.mode,
      confidenceThreshold: form.confidenceThreshold,
      maxCostUsd: form.maxCostUsd ? parseFloat(String(form.maxCostUsd)) : undefined,
      guardedEntitySensitivity: form.guardedEntitySensitivity,
      environment: form.environment,
      reason: form.reason || undefined,
    };
    createMut.mutate(body);
  }

  function handleUpdate(id: string, form: typeof EMPTY_FORM) {
    const body = {
      scope: {
        product: form.product || '*',
        actionType: form.actionType || '*',
        workspace: form.workspace || '*',
      },
      mode: form.mode,
      confidenceThreshold: form.confidenceThreshold,
      maxCostUsd: form.maxCostUsd ? parseFloat(String(form.maxCostUsd)) : undefined,
      guardedEntitySensitivity: form.guardedEntitySensitivity,
      environment: form.environment,
      reason: form.reason || undefined,
    };
    updateMut.mutate({ id, body });
  }

  const modeDescriptions = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of metaQ.data?.modes ?? []) map[m.mode] = m.description;
    return map;
  }, [metaQ.data]);

  const EMPTY_FORM = {
    product: '',
    actionType: '',
    workspace: '*',
    mode: 'approval-required' as PolicyMode,
    confidenceThreshold: 0.8,
    maxCostUsd: '',
    guardedEntitySensitivity: 'internal',
    environment: 'production',
    reason: '',
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded flex items-center justify-center"
            style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}30` }}
          >
            <ShieldCheck className="w-4 h-4" style={{ color: ACCENT }} />
          </div>
          <div>
            <h1
              className="text-[14px] font-bold tracking-wide"
              style={{ color: 'rgba(255,255,255,0.95)' }}
            >
              Policy Mode Manager
            </h1>
            <div className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Govern how every action is handled per product · action type · workspace
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAudit((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono hover:bg-white/5 transition-all"
            style={{
              color: showAudit ? ACCENT : 'rgba(255,255,255,0.5)',
              border: showAudit
                ? `1px solid ${ACCENT}40`
                : '1px solid rgba(255,255,255,0.08)',
              background: showAudit ? `${ACCENT}0d` : 'transparent',
            }}
          >
            <Clock className="w-3 h-3" /> Audit Trail
          </button>
          <button
            onClick={() => seedMut.mutate()}
            disabled={seedMut.isPending}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono transition-opacity disabled:opacity-50"
            style={{
              color: '#22c55e',
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.25)',
            }}
          >
            <Zap className="w-3 h-3" /> Seed Demo Scenarios
          </button>
          <button
            onClick={() => modesQ.refetch()}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono hover:bg-white/5"
            style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <RefreshCw className={`w-3 h-3 ${modesQ.isFetching ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={() => {
              setCreating(true);
              setEditingId(null);
              setExpandedId(null);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold"
            style={{ color: ACCENT, background: `${ACCENT}12`, border: `1px solid ${ACCENT}30` }}
          >
            <Plus className="w-3 h-3" /> Add Rule
          </button>
        </div>
      </div>

      {productFilter && (
        <div
          className="rounded p-2.5 mb-4 flex items-center gap-2 text-[11px]"
          style={{
            background: `${ACCENT}10`,
            border: `1px solid ${ACCENT}30`,
            color: 'rgba(255,255,255,0.85)',
          }}
          data-testid="policy-product-filter-banner"
        >
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: ACCENT }} />
          <span>
            Filtered by product:{' '}
            <span className="font-mono font-semibold" style={{ color: ACCENT }}>
              {productFilter}
            </span>
            <span className="ml-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
              ({configs.length} of {allConfigs.length} rule{allConfigs.length === 1 ? '' : 's'})
            </span>
          </span>
          <button
            onClick={() => setProductFilter('')}
            className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono hover:bg-white/5"
            style={{ color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.10)' }}
            data-testid="policy-product-filter-clear"
          >
            <X className="w-3 h-3" /> Clear filter
          </button>
        </div>
      )}

      <div className="grid grid-cols-5 gap-2 mb-5">
        {(Object.keys(MODE_META) as PolicyMode[]).map((m) => {
          const meta = MODE_META[m];
          const count = configs.filter((c) => c.mode === m).length;
          return (
            <div
              key={m}
              className="rounded p-2.5 flex flex-col gap-1"
              style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
            >
              <div className="flex items-center gap-1.5">
                <span style={{ color: meta.color, display: 'inline-flex' }}>
                  <meta.Icon className="w-3.5 h-3.5" />
                </span>
                <span className="text-[10px] font-semibold" style={{ color: meta.color }}>
                  {meta.label}
                </span>
              </div>
              <div className="text-[18px] font-bold font-mono" style={{ color: meta.color }}>
                {count}
              </div>
              <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {modeDescriptions[m] ?? meta.description}
              </div>
            </div>
          );
        })}
      </div>

      {modesQ.error && (
        <div
          className="rounded p-3 mb-3 flex items-center gap-2 text-[11px]"
          style={{
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#ef4444',
          }}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Failed to load policy modes: {(modesQ.error as Error).message}
        </div>
      )}

      {(createMut.isError || updateMut.isError) && (
        <div
          className="rounded p-3 mb-3 flex items-center gap-2 text-[11px]"
          style={{
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#ef4444',
          }}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          {((createMut.error ?? updateMut.error) as Error)?.message ?? 'Operation failed'}
        </div>
      )}

      {creating && (
        <div className="mb-3">
          <ModeForm
            initial={productFilter ? { ...EMPTY_FORM, product: productFilter } : undefined}
            onSubmit={handleCreate}
            onCancel={() => setCreating(false)}
            busy={createMut.isPending}
          />
        </div>
      )}

      {modesQ.isLoading ? (
        <div
          className="text-[11px] font-mono py-8 text-center"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          Loading policy modes…
        </div>
      ) : configs.length === 0 && !creating ? (
        <div
          className="rounded py-12 text-center"
          style={{
            background: 'rgba(255,255,255,0.015)',
            border: '1px dashed rgba(255,255,255,0.08)',
          }}
        >
          <ShieldCheck
            className="w-8 h-8 mx-auto mb-2"
            style={{ color: 'rgba(255,255,255,0.2)' }}
          />
          <div className="text-[11px] font-mono mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>
            No policy mode rules configured. All actions default to approval-required.
          </div>
          <button
            onClick={() => seedMut.mutate()}
            className="text-[10px] px-3 py-1.5 rounded font-mono"
            style={{
              color: '#22c55e',
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.25)',
            }}
          >
            <Zap className="w-3 h-3 inline mr-1" /> Seed Demo Scenarios
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {configs.map((c) =>
            editingId === c.id ? (
              <ModeForm
                key={c.id}
                initial={{
                  product: c.scope.product,
                  actionType: c.scope.actionType,
                  workspace: c.scope.workspace,
                  mode: c.mode,
                  confidenceThreshold: c.confidenceThreshold,
                  maxCostUsd: c.maxCostUsd !== undefined ? String(c.maxCostUsd) : '',
                  guardedEntitySensitivity: c.guardedEntitySensitivity,
                  environment: c.environment,
                  reason: c.reason ?? '',
                }}
                onSubmit={(form) => handleUpdate(c.id, form)}
                onCancel={() => setEditingId(null)}
                busy={updateMut.isPending}
              />
            ) : (
              <ConfigRow
                key={c.id}
                config={c}
                expanded={expandedId === c.id}
                onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
                onEdit={() => {
                  setEditingId(c.id);
                  setCreating(false);
                  setExpandedId(null);
                }}
                onDelete={() => deleteMut.mutate(c.id)}
                busy={busy}
              />
            ),
          )}
        </div>
      )}

      {showAudit && (
        <div
          className="mt-6 rounded border"
          style={{ borderColor: `${ACCENT}20`, background: `${ACCENT}04` }}
        >
          <div
            className="px-4 py-3 border-b flex items-center gap-2"
            style={{ borderColor: `${ACCENT}15` }}
          >
            <Clock className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Policy Audit Trail
            </span>
            <span className="ml-auto text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {auditQ.data?.integrity === false ? (
                <span style={{ color: '#ef4444' }}>⚠ chain integrity check FAILED</span>
              ) : auditQ.data?.integrity === true ? (
                <span style={{ color: '#22c55e' }}>✓ chain integrity verified</span>
              ) : null}
              {' '}
              {auditQ.data?.total != null ? `${auditQ.data.total} total entries` : ''}
            </span>
            <button
              onClick={() => auditQ.refetch()}
              className="ml-2 p-1 rounded hover:bg-white/5"
            >
              <RefreshCw
                className={`w-3 h-3 ${auditQ.isFetching ? 'animate-spin' : ''}`}
                style={{ color: 'rgba(255,255,255,0.4)' }}
              />
            </button>
          </div>

          {auditQ.isLoading ? (
            <div className="py-6 text-center text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Loading audit trail…
            </div>
          ) : auditQ.error ? (
            <div className="py-4 px-4 text-[10px]" style={{ color: '#ef4444' }}>
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              {(auditQ.error as Error).message}
            </div>
          ) : (auditQ.data?.entries ?? []).length === 0 ? (
            <div className="py-8 text-center text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
              No audit entries yet. Entries are created when policies are evaluated.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {(auditQ.data?.entries ?? []).map((entry) => (
                <div key={entry.id} className="px-4 py-2.5 flex items-start gap-3">
                  <div
                    className="mt-0.5 w-1.5 h-1.5 rounded-full shrink-0"
                    style={{
                      background:
                        entry.executionResult === 'allowed'
                          ? '#22c55e'
                          : entry.executionResult === 'blocked'
                            ? '#ef4444'
                            : ACCENT,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
                        {entry.agentId}
                      </span>
                      <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {entry.action}
                      </span>
                      <span
                        className="text-[9px] font-bold uppercase px-1 rounded"
                        style={{
                          color:
                            entry.executionResult === 'allowed'
                              ? '#22c55e'
                              : entry.executionResult === 'blocked'
                                ? '#ef4444'
                                : ACCENT,
                          background:
                            entry.executionResult === 'allowed'
                              ? 'rgba(34,197,94,0.1)'
                              : entry.executionResult === 'blocked'
                                ? 'rgba(239,68,68,0.1)'
                                : `${ACCENT}18`,
                        }}
                      >
                        {entry.executionResult}
                      </span>
                    </div>
                    <div className="text-[9px] mt-0.5 font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
