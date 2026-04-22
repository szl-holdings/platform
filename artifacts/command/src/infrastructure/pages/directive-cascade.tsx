import { ClassificationBadge } from '@imp/components/classification-badge';
import {
  type Classification,
  type Directive,
  type DirectivePriority,
  type DirectiveStatus,
} from '@imp/lib/imperium-data';
import { cn } from '@imp/lib/utils';
import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  ChevronDown,
  ChevronUp,
  Pause,
  Plus,
  RefreshCw,
  Search,
  Send,
  X,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';

const BASE_URL = (import.meta.env.BASE_URL ?? '/imperium/').replace(/\/$/, '');
const API_BASE = `${BASE_URL}/api/command/sync/directives`;

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

interface DirectiveDTO {
  id: string;
  title: string;
  body: string;
  priority: DirectivePriority;
  status: DirectiveStatus;
  classification: Classification;
  issuedBy: string;
  issuedAt: string;
  cascadedTo: string[];
  tags: string[];
  cascadeCount: number;
}

const DIRECTIVES_QUERY_KEY = ['command-sync', 'directives'] as const;

function dtoToDirective(d: DirectiveDTO): Directive {
  return { ...d, issuedAt: new Date(d.issuedAt) };
}

const COHORT_OPTIONS = [
  'GROUP — SECURITY',
  'GROUP — COMPUTE',
  'GROUP — DATA',
  'GROUP — FRONTEND',
  'REGION I — PRIMARY',
  'REGION II — STANDBY',
];

const PRIORITY_CONFIG: Record<DirectivePriority, { color: string; bg: string; border: string }> = {
  CRITICAL: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)' },
  HIGH: { color: '#fb923c', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.3)' },
  MEDIUM: { color: '#facc15', bg: 'rgba(250,204,21,0.08)', border: 'rgba(250,204,21,0.3)' },
  LOW: { color: '#94a3b8', bg: 'rgba(148,163,184,0.05)', border: 'rgba(148,163,184,0.2)' },
};

const STATUS_CONFIG: Record<DirectiveStatus, { label: string; color: string }> = {
  ACTIVE: { label: 'ACTIVE', color: '#4ade80' },
  CASCADING: { label: 'CASCADING', color: '#60a5fa' },
  SUSPENDED: { label: 'SUSPENDED', color: '#facc15' },
  ARCHIVED: { label: 'ARCHIVED', color: '#475569' },
};

interface NewDirectiveForm {
  title: string;
  body: string;
  priority: DirectivePriority;
  classification: Classification;
  cascadedTo: string[];
  tags: string;
}

const EMPTY_FORM: NewDirectiveForm = {
  title: '',
  body: '',
  priority: 'MEDIUM',
  classification: 'RESTRICTED',
  cascadedTo: [],
  tags: '',
};

function DirectiveCard({
  directive,
  onStatusChange,
  onCascade,
  onDelete,
}: {
  directive: Directive;
  onStatusChange: (id: string, status: DirectiveStatus) => void;
  onCascade: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(
    directive.status === 'ACTIVE' || directive.status === 'CASCADING',
  );
  const priority = PRIORITY_CONFIG[directive.priority];
  const statusCfg = STATUS_CONFIG[directive.status];
  const timeAgo = Math.round((Date.now() - directive.issuedAt.getTime()) / 3600000);

  return (
    <div
      className="rounded-lg overflow-hidden border transition-all"
      style={{ background: 'rgba(10,13,26,0.95)', borderColor: priority.border }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/2 transition-all"
      >
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5"
          style={{ backgroundColor: priority.color, boxShadow: `0 0 6px ${priority.color}60` }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <span className="font-semibold text-sm text-slate-200 leading-tight">
              {directive.title}
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className="px-2 py-0.5 rounded font-mono text-[9px] tracking-widest border"
                style={{
                  color: priority.color,
                  background: priority.bg,
                  borderColor: priority.border,
                }}
              >
                {directive.priority}
              </span>
              <span
                className="px-2 py-0.5 rounded font-mono text-[9px] tracking-widest"
                style={{ color: statusCfg.color }}
              >
                {statusCfg.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <ClassificationBadge classification={directive.classification} size="xs" />
            <span className="text-[10px] text-slate-500">
              {timeAgo}h ago · {directive.issuedBy}
            </span>
            {directive.cascadeCount > 0 && (
              <span className="text-[10px] font-mono text-blue-400">
                ↓ {directive.cascadeCount} cascade{directive.cascadeCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
          <p className="text-xs text-slate-400 leading-relaxed">{directive.body}</p>

          {directive.cascadedTo.length > 0 && (
            <div>
              <div className="text-[10px] font-mono text-slate-500 tracking-wider mb-1.5">
                CASCADED TO
              </div>
              <div className="flex flex-wrap gap-1.5">
                {directive.cascadedTo.map((g) => (
                  <span
                    key={g}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950/40 border border-blue-900/30 text-blue-400"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {directive.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {directive.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/3 border border-white/5 text-slate-400"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {directive.status !== 'ARCHIVED' && (
              <>
                <button
                  onClick={() => onCascade(directive.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-[10px] tracking-widest border transition-all hover:bg-blue-500/10"
                  style={{ borderColor: '#3b82f640', color: '#60a5fa' }}
                >
                  <Send className="w-3 h-3" /> CASCADE
                </button>
                {directive.status === 'ACTIVE' && (
                  <button
                    onClick={() => onStatusChange(directive.id, 'SUSPENDED')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-[10px] tracking-widest border transition-all hover:bg-yellow-500/10"
                    style={{ borderColor: '#facc1540', color: '#facc15' }}
                  >
                    <Pause className="w-3 h-3" /> SUSPEND
                  </button>
                )}
                {directive.status === 'SUSPENDED' && (
                  <button
                    onClick={() => onStatusChange(directive.id, 'ACTIVE')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-[10px] tracking-widest border transition-all hover:bg-green-500/10"
                    style={{ borderColor: '#4ade8040', color: '#4ade80' }}
                  >
                    <RefreshCw className="w-3 h-3" /> REINSTATE
                  </button>
                )}
                <button
                  onClick={() => onStatusChange(directive.id, 'ARCHIVED')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-[10px] tracking-widest border transition-all hover:bg-white/5"
                  style={{ borderColor: '#47556940', color: '#94a3b8' }}
                >
                  <Archive className="w-3 h-3" /> ARCHIVE
                </button>
              </>
            )}
            <button
              onClick={() => onDelete(directive.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-[10px] tracking-widest border transition-all hover:bg-red-500/10 ml-auto"
              style={{ borderColor: '#ef444430', color: '#ef4444' }}
            >
              <X className="w-3 h-3" /> DELETE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NewDirectiveModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (d: Directive) => void;
}) {
  const [form, setForm] = useState<NewDirectiveForm>(EMPTY_FORM);

  function toggleCohort(cohort: string) {
    setForm((f) => ({
      ...f,
      cascadedTo: f.cascadedTo.includes(cohort)
        ? f.cascadedTo.filter((c) => c !== cohort)
        : [...f.cascadedTo, cohort],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    const directive: Directive = {
      id: `dir-${Date.now()}`,
      title: form.title.trim(),
      body: form.body.trim(),
      priority: form.priority,
      status: form.cascadedTo.length > 0 ? 'CASCADING' : 'ACTIVE',
      classification: form.classification,
      issuedBy: 'Commander — Direct Issue',
      issuedAt: new Date(),
      cascadedTo: form.cascadedTo,
      tags: form.tags
        .split(',')
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean),
      cascadeCount: form.cascadedTo.length,
    };
    onSubmit(directive);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div
        className="w-full max-w-lg rounded-xl border p-6 shadow-2xl"
        style={{ background: '#0a0d1a', borderColor: 'rgba(201,162,39,0.25)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: '#c9a227' }} />
            <span className="font-display text-sm tracking-[0.15em] gold-text uppercase">
              Issue New Directive
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono tracking-wider text-slate-500 mb-1.5">
              DIRECTIVE TITLE *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. BRAVO PROTOCOL — Rotate DB Credentials"
              className="w-full bg-white/3 border border-white/10 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-gold/30 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono tracking-wider text-slate-500 mb-1.5">
              DIRECTIVE BODY *
            </label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="Describe the directive in full operational terms..."
              rows={3}
              className="w-full bg-white/3 border border-white/10 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-gold/30 transition-colors resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono tracking-wider text-slate-500 mb-1.5">
                PRIORITY
              </label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priority: e.target.value as DirectivePriority }))
                }
                className="w-full bg-[#0a0d1a] border border-white/10 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-gold/30 transition-colors"
              >
                {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as DirectivePriority[]).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono tracking-wider text-slate-500 mb-1.5">
                CLASSIFICATION
              </label>
              <select
                value={form.classification}
                onChange={(e) =>
                  setForm((f) => ({ ...f, classification: e.target.value as Classification }))
                }
                className="w-full bg-[#0a0d1a] border border-white/10 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-gold/30 transition-colors"
              >
                {(['OPEN', 'RESTRICTED', 'CONFIDENTIAL', 'SOVEREIGN'] as Classification[]).map(
                  (c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono tracking-wider text-slate-500 mb-1.5">
              CASCADE TO (select groups)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {COHORT_OPTIONS.map((cohort) => (
                <button
                  type="button"
                  key={cohort}
                  onClick={() => toggleCohort(cohort)}
                  className={cn(
                    'text-left px-2.5 py-1.5 rounded border font-mono text-[10px] transition-all',
                    form.cascadedTo.includes(cohort)
                      ? 'border-blue-500/50 bg-blue-950/40 text-blue-400'
                      : 'border-white/5 bg-white/2 text-slate-500 hover:border-white/10',
                  )}
                >
                  {cohort}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono tracking-wider text-slate-500 mb-1.5">
              TAGS (comma-separated)
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="SECURITY, PROTOCOL, Q2"
              className="w-full bg-white/3 border border-white/10 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-gold/30 transition-colors"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded font-mono text-[11px] tracking-widest border border-white/10 text-slate-400 hover:bg-white/3 transition-all"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded font-mono text-[11px] tracking-widest font-bold border transition-all hover:bg-gold/10"
              style={{ borderColor: 'rgba(201,162,39,0.4)', color: '#c9a227' }}
            >
              ISSUE DIRECTIVE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const CLASSIFICATION_CONFIG: Record<Classification, { color: string; bg: string; border: string }> = {
  OPEN: { color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.3)' },
  RESTRICTED: { color: '#fb923c', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.3)' },
  CONFIDENTIAL: { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.3)' },
  SOVEREIGN: { color: '#c9a227', bg: 'rgba(201,162,39,0.08)', border: 'rgba(201,162,39,0.3)' },
};

export default function DirectiveCascade() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<DirectiveStatus | 'ALL'>('ALL');
  const [classificationFilter, setClassificationFilter] = useState<Classification | 'ALL'>('ALL');
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const listQ = useStandardQuery<{ data: DirectiveDTO[] }>({
    queryKey: DIRECTIVES_QUERY_KEY,
    queryFn: () => fetchJson<{ data: DirectiveDTO[] }>(API_BASE),
  });

  const directives: Directive[] = (listQ.data?.data ?? []).map(dtoToDirective);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const invalidate = () => qc.invalidateQueries({ queryKey: DIRECTIVES_QUERY_KEY });

  // Snapshot current cache so onError can roll back the optimistic write.
  // The react-query cache is mirrored to localStorage by the app-level
  // persistQueryClient, so optimistic writes hit localStorage immediately
  // and revert there too on failure.
  function snapshot(): { data: DirectiveDTO[] } {
    return (
      qc.getQueryData<{ data: DirectiveDTO[] }>(DIRECTIVES_QUERY_KEY) ?? { data: [] }
    );
  }

  const createMut = useStandardMutation({
    mutationFn: (d: Directive) =>
      fetchJson(API_BASE, {
        method: 'POST',
        body: JSON.stringify({ ...d, issuedAt: d.issuedAt.toISOString() }),
      }),
    onMutate: async (d: Directive) => {
      await qc.cancelQueries({ queryKey: DIRECTIVES_QUERY_KEY });
      const prev = snapshot();
      const optimistic: DirectiveDTO = {
        id: d.id,
        title: d.title,
        body: d.body,
        priority: d.priority,
        status: d.status,
        classification: d.classification,
        issuedBy: d.issuedBy,
        issuedAt: d.issuedAt.toISOString(),
        cascadedTo: d.cascadedTo,
        tags: d.tags,
        cascadeCount: d.cascadeCount,
      };
      qc.setQueryData<{ data: DirectiveDTO[] }>(DIRECTIVES_QUERY_KEY, {
        data: [optimistic, ...prev.data],
      });
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(DIRECTIVES_QUERY_KEY, ctx.prev);
      showToast(`Failed to issue directive: ${e.message}`);
    },
    onSuccess: () => {
      setShowModal(false);
      showToast('Directive issued successfully');
    },
    onSettled: () => invalidate(),
  });

  const patchMut = useStandardMutation({
    mutationFn: ({ id, body }: { id: string; body: object }) =>
      fetchJson(`${API_BASE}/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onMutate: async ({ id, body }) => {
      await qc.cancelQueries({ queryKey: DIRECTIVES_QUERY_KEY });
      const prev = snapshot();
      qc.setQueryData<{ data: DirectiveDTO[] }>(DIRECTIVES_QUERY_KEY, {
        data: prev.data.map((d) => (d.id === id ? { ...d, ...(body as object) } : d)),
      });
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(DIRECTIVES_QUERY_KEY, ctx.prev);
      showToast(`Update failed: ${e.message}`);
    },
    onSettled: () => invalidate(),
  });

  const deleteMut = useStandardMutation({
    mutationFn: (id: string) =>
      fetchJson(`${API_BASE}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: DIRECTIVES_QUERY_KEY });
      const prev = snapshot();
      qc.setQueryData<{ data: DirectiveDTO[] }>(DIRECTIVES_QUERY_KEY, {
        data: prev.data.filter((d) => d.id !== id),
      });
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(DIRECTIVES_QUERY_KEY, ctx.prev);
      showToast(`Delete failed: ${e.message}`);
    },
    onSuccess: () => showToast('Directive removed'),
    onSettled: () => invalidate(),
  });

  const allTags = Array.from(new Set(directives.flatMap((d) => d.tags))).sort();

  function toggleTag(tag: string) {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  function handleStatusChange(id: string, status: DirectiveStatus) {
    patchMut.mutate({ id, body: { status } });
    showToast(`Directive status updated to ${status}`);
  }

  function handleCascade(id: string) {
    const d = directives.find((x) => x.id === id);
    if (!d) return;
    patchMut.mutate({
      id,
      body: { status: 'CASCADING', cascadeCount: d.cascadeCount + 1 },
    });
    showToast('Directive cascaded to all assigned groups');
  }

  function handleDelete(id: string) {
    deleteMut.mutate(id);
  }

  function handleAdd(directive: Directive) {
    createMut.mutate(directive);
  }

  const query = searchQuery.trim().toLowerCase();

  const filtered = directives.filter((d) => {
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    if (classificationFilter !== 'ALL' && d.classification !== classificationFilter) return false;
    if (activeTags.size > 0 && !d.tags.some((t) => activeTags.has(t))) return false;
    if (query && !d.title.toLowerCase().includes(query) && !d.body.toLowerCase().includes(query))
      return false;
    return true;
  });

  const counts = {
    ACTIVE: directives.filter((d) => d.status === 'ACTIVE').length,
    CASCADING: directives.filter((d) => d.status === 'CASCADING').length,
    SUSPENDED: directives.filter((d) => d.status === 'SUSPENDED').length,
    ARCHIVED: directives.filter((d) => d.status === 'ARCHIVED').length,
  };

  const hasActiveFilters =
    statusFilter !== 'ALL' || classificationFilter !== 'ALL' || activeTags.size > 0 || query;

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg border font-mono text-xs tracking-wider shadow-xl"
          style={{ background: '#0a0d1a', borderColor: 'rgba(201,162,39,0.4)', color: '#c9a227' }}
        >
          {toast}
        </div>
      )}

      {showModal && <NewDirectiveModal onClose={() => setShowModal(false)} onSubmit={handleAdd} />}

      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5" style={{ color: '#c9a227' }} />
            <h1 className="font-display text-lg tracking-[0.2em] gold-text gold-glow font-bold uppercase">
              Directive Cascade Engine
            </h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded font-mono text-[11px] tracking-widest font-bold border transition-all hover:bg-gold/10"
            style={{ borderColor: 'rgba(201,162,39,0.4)', color: '#c9a227' }}
          >
            <Plus className="w-3.5 h-3.5" /> ISSUE DIRECTIVE
          </button>
        </div>
        <p className="text-xs text-slate-500 ml-8">
          Command directives cascade to assigned groups — create, update, suspend, or archive
        </p>
      </div>

      {listQ.isError && (
        <div className="rounded-lg border border-red-900/40 bg-red-950/20 p-3 text-xs font-mono text-red-400">
          Failed to load directives: {(listQ.error as Error).message}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['ACTIVE', 'CASCADING', 'SUSPENDED', 'ARCHIVED'] as DirectiveStatus[]).map((s) => {
          const cfg = STATUS_CONFIG[s];
          return (
            <div key={s} className="imperial-card rounded-lg p-3 text-center">
              <div className="font-mono text-2xl font-bold" style={{ color: cfg.color }}>
                {counts[s]}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 tracking-wider">{s}</div>
            </div>
          );
        })}
      </div>

      <div
        className="imperial-card rounded-lg p-4 space-y-4"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search directives by title or body text..."
            className="w-full bg-white/3 border border-white/8 rounded px-3 py-2 pl-9 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-white/20 transition-colors font-mono text-[11px] tracking-wide"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-white/5 rounded transition-colors"
            >
              <X className="w-3 h-3 text-slate-500" />
            </button>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-[9px] font-mono tracking-widest text-slate-600 uppercase">Status</div>
          <div className="flex gap-2 flex-wrap">
            {(['ALL', 'ACTIVE', 'CASCADING', 'SUSPENDED', 'ARCHIVED'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded font-mono text-[10px] tracking-widest border transition-all',
                  statusFilter === f
                    ? 'border-gold/40 bg-gold/10 text-gold'
                    : 'border-white/5 text-slate-500 hover:border-white/10',
                )}
              >
                {f === 'ALL' ? `ALL (${directives.length})` : `${f} (${counts[f]})`}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-[9px] font-mono tracking-widest text-slate-600 uppercase">
            Classification
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['ALL', 'OPEN', 'RESTRICTED', 'CONFIDENTIAL', 'SOVEREIGN'] as const).map((c) => {
              const cfg = c === 'ALL' ? null : CLASSIFICATION_CONFIG[c];
              return (
                <button
                  key={c}
                  onClick={() => setClassificationFilter(c)}
                  className={cn(
                    'px-3 py-1.5 rounded font-mono text-[10px] tracking-widest border transition-all',
                    classificationFilter === c
                      ? 'border-gold/40 bg-gold/10 text-gold'
                      : 'border-white/5 text-slate-500 hover:border-white/10',
                  )}
                  style={
                    classificationFilter === c && cfg
                      ? { borderColor: cfg.border, background: cfg.bg, color: cfg.color }
                      : undefined
                  }
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[9px] font-mono tracking-widest text-slate-600 uppercase">
                Tags
              </div>
              {activeTags.size > 0 && (
                <button
                  onClick={() => setActiveTags(new Set())}
                  className="text-[9px] font-mono tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
                >
                  CLEAR
                </button>
              )}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'px-2 py-1 rounded font-mono text-[10px] transition-all border',
                    activeTags.has(tag)
                      ? 'border-blue-500/50 bg-blue-950/40 text-blue-400'
                      : 'border-white/5 bg-white/2 text-slate-500 hover:border-white/10',
                  )}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-1 border-t border-white/5">
            <span className="text-[10px] font-mono text-slate-500">
              Showing {filtered.length} of {directives.length}
            </span>
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setClassificationFilter('ALL');
                setActiveTags(new Set());
                setSearchQuery('');
              }}
              className="text-[10px] font-mono tracking-wider text-gold hover:text-gold/80 transition-colors"
            >
              CLEAR ALL FILTERS
            </button>
          </div>
        )}
      </div>

      {listQ.isLoading && directives.length === 0 ? (
        <div className="text-center py-12 text-slate-600 text-sm font-mono">
          LOADING DIRECTIVES…
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((d) => (
            <DirectiveCard
              key={d.id}
              directive={d}
              onStatusChange={handleStatusChange}
              onCascade={handleCascade}
              onDelete={handleDelete}
            />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-600 text-sm font-mono">
              NO DIRECTIVES MATCH FILTERS
            </div>
          )}
        </div>
      )}
    </div>
  );
}
