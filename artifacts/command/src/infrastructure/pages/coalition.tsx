import { ClassificationBadge } from '@imp/components/classification-badge';
import {
  type Classification,
  type CoalitionPartner,
  type CoalitionStatus,
} from '@imp/lib/imperium-data';
import { cn } from '@imp/lib/utils';
import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Anchor,
  Check,
  Clock,
  Edit2,
  Plus,
  RotateCcw,
  Scale,
  Shield,
  Users,
  X,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';

const BASE_URL = (import.meta.env.BASE_URL ?? '/imperium/').replace(/\/$/, '');
const API_BASE = `${BASE_URL}/api/command/sync/coalition`;

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

interface PartnerDTO {
  id: string;
  name: string;
  role: string;
  domain: string;
  trustScore: number;
  status: CoalitionStatus;
  classification: Classification;
  lastContact: string;
  notes: string;
  alerts: number;
}

const COALITION_QUERY_KEY = ['command-sync', 'coalition'] as const;

function dtoToPartner(p: PartnerDTO): CoalitionPartner {
  return { ...p, lastContact: new Date(p.lastContact) };
}

const STATUS_CONFIG: Record<
  CoalitionStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  ACTIVE: {
    label: 'ACTIVE',
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.08)',
    border: 'rgba(74,222,128,0.25)',
  },
  OBSERVING: {
    label: 'OBSERVING',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.08)',
    border: 'rgba(96,165,250,0.25)',
  },
  SUSPENDED: {
    label: 'SUSPENDED',
    color: '#facc15',
    bg: 'rgba(250,204,21,0.08)',
    border: 'rgba(250,204,21,0.25)',
  },
  TERMINATED: {
    label: 'TERMINATED',
    color: '#475569',
    bg: 'rgba(71,85,105,0.05)',
    border: 'rgba(71,85,105,0.2)',
  },
};

function domainIcon(domain: string): React.ElementType {
  if (domain === 'Security') return Shield;
  if (domain === 'Finance') return Zap;
  if (domain === 'Legal') return Scale;
  if (domain === 'Operations') return Anchor;
  return Users;
}

function TrustBar({ score }: { score: number }) {
  const color =
    score >= 90 ? '#4ade80' : score >= 75 ? '#facc15' : score >= 60 ? '#fb923c' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-mono text-xs w-7 text-right" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

function PartnerCard({
  partner,
  onUpdate,
  onDelete,
}: {
  partner: CoalitionPartner;
  onUpdate: (id: string, changes: Partial<CoalitionPartner>) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [trustDraft, setTrustDraft] = useState(partner.trustScore);
  const [statusDraft, setStatusDraft] = useState<CoalitionStatus>(partner.status);
  const [notesDraft, setNotesDraft] = useState(partner.notes);

  const statusCfg = STATUS_CONFIG[partner.status];
  const DomainIcon = domainIcon(partner.domain);
  const timeAgo = Math.round((Date.now() - partner.lastContact.getTime()) / 60000);
  const timeLabel = timeAgo < 60 ? `${timeAgo}m ago` : `${Math.round(timeAgo / 60)}h ago`;

  function handleSave() {
    onUpdate(partner.id, {
      trustScore: trustDraft,
      status: statusDraft,
      notes: notesDraft,
    });
    setEditing(false);
  }

  function handleCancel() {
    setTrustDraft(partner.trustScore);
    setStatusDraft(partner.status);
    setNotesDraft(partner.notes);
    setEditing(false);
  }

  return (
    <div
      className="rounded-lg border p-4 transition-all"
      style={{ background: 'rgba(10,13,26,0.95)', borderColor: statusCfg.border }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
            style={{ background: `${statusCfg.color}15`, border: `1px solid ${statusCfg.color}30` }}
          >
            <DomainIcon className="w-4 h-4" style={{ color: statusCfg.color }} />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-slate-200 truncate">{partner.name}</div>
            <div className="text-[11px] text-slate-500 truncate">{partner.role}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {partner.alerts > 0 && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-red-950/40 border border-red-900/30 text-red-400">
              <AlertTriangle className="w-2.5 h-2.5" /> {partner.alerts}
            </span>
          )}
          <span
            className="px-2 py-0.5 rounded font-mono text-[9px] tracking-widest border"
            style={{
              color: statusCfg.color,
              background: statusCfg.bg,
              borderColor: statusCfg.border,
            }}
          >
            {statusCfg.label}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono text-slate-500 tracking-wider">TRUST SCORE</span>
          {editing ? (
            <div className="flex items-center gap-2 flex-1 max-w-[200px]">
              <input
                type="range"
                min={0}
                max={100}
                value={trustDraft}
                onChange={(e) => setTrustDraft(Number(e.target.value))}
                className="flex-1 accent-gold h-1"
              />
              <span className="font-mono text-xs w-7 text-right text-slate-300">{trustDraft}</span>
            </div>
          ) : (
            <div className="flex-1 max-w-[200px]">
              <TrustBar score={partner.trustScore} />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-500 tracking-wider">STATUS</span>
          {editing ? (
            <select
              value={statusDraft}
              onChange={(e) => setStatusDraft(e.target.value as CoalitionStatus)}
              className="bg-[#0a0d1a] border border-white/10 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-gold/30 transition-colors"
            >
              {(['ACTIVE', 'OBSERVING', 'SUSPENDED', 'TERMINATED'] as CoalitionStatus[]).map(
                (s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ),
              )}
            </select>
          ) : (
            <div className="flex items-center gap-1.5">
              <ClassificationBadge classification={partner.classification} size="xs" />
              <span className="text-[10px] text-slate-500">{partner.domain}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-[10px] text-slate-600">
          <Clock className="w-3 h-3" />
          <span>Last contact: {timeLabel}</span>
        </div>
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            rows={2}
            className="w-full bg-white/3 border border-white/10 rounded px-2.5 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-gold/30 transition-colors resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded font-mono text-[10px] tracking-widest font-bold border transition-all hover:bg-green-500/10"
              style={{ borderColor: '#4ade8040', color: '#4ade80' }}
            >
              <Check className="w-3 h-3" /> SAVE
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded font-mono text-[10px] tracking-widest border transition-all hover:bg-white/5"
              style={{ borderColor: '#47556940', color: '#94a3b8' }}
            >
              <X className="w-3 h-3" /> CANCEL
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-500 leading-relaxed">{partner.notes}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-[10px] tracking-widest border transition-all hover:bg-gold/10"
              style={{ borderColor: 'rgba(201,162,39,0.3)', color: '#c9a227' }}
            >
              <Edit2 className="w-3 h-3" /> EDIT
            </button>
            <button
              onClick={() => onDelete(partner.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-[10px] tracking-widest border transition-all hover:bg-red-500/10 ml-auto"
              style={{ borderColor: '#ef444430', color: '#ef4444' }}
            >
              <X className="w-3 h-3" /> REMOVE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface NewPartnerForm {
  name: string;
  role: string;
  domain: string;
  classification: Classification;
  notes: string;
}

const EMPTY_PARTNER_FORM: NewPartnerForm = {
  name: '',
  role: '',
  domain: 'Security',
  classification: 'RESTRICTED',
  notes: '',
};

function AddPartnerModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (p: CoalitionPartner) => void;
}) {
  const [form, setForm] = useState<NewPartnerForm>(EMPTY_PARTNER_FORM);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim()) return;
    const partner: CoalitionPartner = {
      id: `cp-${Date.now()}`,
      name: form.name.trim(),
      role: form.role.trim(),
      domain: form.domain,
      trustScore: 75,
      status: 'OBSERVING',
      classification: form.classification,
      lastContact: new Date(),
      notes: form.notes.trim() || 'New coalition partner — monitoring phase.',
      alerts: 0,
    };
    onSubmit(partner);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div
        className="w-full max-w-md rounded-xl border p-6 shadow-2xl"
        style={{ background: '#0a0d1a', borderColor: 'rgba(201,162,39,0.25)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: '#c9a227' }} />
            <span className="font-display text-sm tracking-[0.15em] gold-text uppercase">
              Add Coalition Partner
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono tracking-wider text-slate-500 mb-1.5">
              PARTNER NAME *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Sentinel One — EDR Feed"
              className="w-full bg-white/3 border border-white/10 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-gold/30 transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono tracking-wider text-slate-500 mb-1.5">
              ROLE / FUNCTION *
            </label>
            <input
              type="text"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              placeholder="e.g. Endpoint Detection & Response"
              className="w-full bg-white/3 border border-white/10 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-gold/30 transition-colors"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono tracking-wider text-slate-500 mb-1.5">
                DOMAIN
              </label>
              <select
                value={form.domain}
                onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
                className="w-full bg-[#0a0d1a] border border-white/10 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-gold/30 transition-colors"
              >
                {['Security', 'Finance', 'Legal', 'Operations', 'Engineering', 'Compliance'].map(
                  (d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ),
                )}
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
              NOTES
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Integration details, SLA, access scope..."
              rows={2}
              className="w-full bg-white/3 border border-white/10 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-gold/30 transition-colors resize-none"
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
              ADD PARTNER
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Coalition() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [filterDomain, setFilterDomain] = useState<string>('ALL');

  const listQ = useStandardQuery<{ data: PartnerDTO[] }>({
    queryKey: COALITION_QUERY_KEY,
    queryFn: () => fetchJson<{ data: PartnerDTO[] }>(API_BASE),
  });

  const partners: CoalitionPartner[] = (listQ.data?.data ?? []).map(dtoToPartner);

  const invalidate = () => qc.invalidateQueries({ queryKey: COALITION_QUERY_KEY });

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // Snapshot helper — react-query cache is mirrored to localStorage by the
  // app-level persistQueryClient, so optimistic writes/rollbacks naturally
  // hit the localStorage cache layer.
  function snapshot(): { data: PartnerDTO[] } {
    return qc.getQueryData<{ data: PartnerDTO[] }>(COALITION_QUERY_KEY) ?? { data: [] };
  }

  const createMut = useStandardMutation({
    mutationFn: (p: CoalitionPartner) =>
      fetchJson(API_BASE, {
        method: 'POST',
        body: JSON.stringify({ ...p, lastContact: p.lastContact.toISOString() }),
      }),
    onMutate: async (p: CoalitionPartner) => {
      await qc.cancelQueries({ queryKey: COALITION_QUERY_KEY });
      const prev = snapshot();
      const optimistic: PartnerDTO = {
        id: p.id,
        name: p.name,
        role: p.role,
        domain: p.domain,
        trustScore: p.trustScore,
        status: p.status,
        classification: p.classification,
        lastContact: p.lastContact.toISOString(),
        notes: p.notes,
        alerts: p.alerts,
      };
      qc.setQueryData<{ data: PartnerDTO[] }>(COALITION_QUERY_KEY, {
        data: [...prev.data, optimistic],
      });
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(COALITION_QUERY_KEY, ctx.prev);
      showToast(`Failed to add partner: ${e.message}`);
    },
    onSuccess: () => {
      setShowModal(false);
      showToast('Coalition partner added — observing');
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
      await qc.cancelQueries({ queryKey: COALITION_QUERY_KEY });
      const prev = snapshot();
      qc.setQueryData<{ data: PartnerDTO[] }>(COALITION_QUERY_KEY, {
        data: prev.data.map((p) => (p.id === id ? { ...p, ...(body as object) } : p)),
      });
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(COALITION_QUERY_KEY, ctx.prev);
      showToast(`Update failed: ${e.message}`);
    },
    onSuccess: () => showToast('Partner record updated'),
    onSettled: () => invalidate(),
  });

  const deleteMut = useStandardMutation({
    mutationFn: (id: string) =>
      fetchJson(`${API_BASE}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: COALITION_QUERY_KEY });
      const prev = snapshot();
      qc.setQueryData<{ data: PartnerDTO[] }>(COALITION_QUERY_KEY, {
        data: prev.data.filter((p) => p.id !== id),
      });
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(COALITION_QUERY_KEY, ctx.prev);
      showToast(`Removal failed: ${e.message}`);
    },
    onSuccess: () => showToast('Partner removed from coalition'),
    onSettled: () => invalidate(),
  });

  function handleUpdate(id: string, changes: Partial<CoalitionPartner>) {
    const body: Record<string, unknown> = {};
    if (changes.trustScore !== undefined) body.trustScore = changes.trustScore;
    if (changes.status !== undefined) body.status = changes.status;
    if (changes.notes !== undefined) body.notes = changes.notes;
    if (changes.name !== undefined) body.name = changes.name;
    if (changes.role !== undefined) body.role = changes.role;
    if (changes.domain !== undefined) body.domain = changes.domain;
    if (changes.classification !== undefined) body.classification = changes.classification;
    if (changes.alerts !== undefined) body.alerts = changes.alerts;
    patchMut.mutate({ id, body });
  }

  function handleDelete(id: string) {
    deleteMut.mutate(id);
  }

  function handleAdd(partner: CoalitionPartner) {
    createMut.mutate(partner);
  }

  const resetMut = useStandardMutation({
    mutationFn: () =>
      fetchJson<{ data: PartnerDTO[] }>(`${API_BASE}/reset`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    onSuccess: (resp) => {
      qc.setQueryData<{ data: PartnerDTO[] }>(COALITION_QUERY_KEY, resp);
      showToast('Coalition reset to defaults');
    },
    onError: (e: Error) => showToast(`Reset failed: ${e.message}`),
    onSettled: () => invalidate(),
  });

  function handleReset() {
    if (
      window.confirm(
        'Reset the coalition to the original demo partners? Any partners you added or changed will be lost.',
      )
    ) {
      resetMut.mutate();
    }
  }

  const domains = ['ALL', ...Array.from(new Set(partners.map((p) => p.domain)))];
  const filtered =
    filterDomain === 'ALL' ? partners : partners.filter((p) => p.domain === filterDomain);

  const avgTrust = partners.length
    ? Math.round(partners.reduce((s, p) => s + p.trustScore, 0) / partners.length)
    : 0;

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

      {showModal && <AddPartnerModal onClose={() => setShowModal(false)} onSubmit={handleAdd} />}

      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5" style={{ color: '#c9a227' }} />
            <h1 className="font-display text-lg tracking-[0.2em] gold-text gold-glow font-bold uppercase">
              Coalition & Stakeholder Manager
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2 rounded font-mono text-[11px] tracking-widest border transition-all hover:bg-white/5"
              style={{ borderColor: 'rgba(148,163,184,0.25)', color: '#94a3b8' }}
              title="Restore the original demo coalition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> RESET TO DEFAULTS
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-3 py-2 rounded font-mono text-[11px] tracking-widest font-bold border transition-all hover:bg-gold/10"
              style={{ borderColor: 'rgba(201,162,39,0.4)', color: '#c9a227' }}
            >
              <Plus className="w-3.5 h-3.5" /> ADD PARTNER
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500 ml-8">
          Edit partner trust scores and engagement status — changes reflected immediately
        </p>
      </div>

      {listQ.isError && (
        <div className="rounded-lg border border-red-900/40 bg-red-950/20 p-3 text-xs font-mono text-red-400">
          Failed to load coalition partners: {(listQ.error as Error).message}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Partners', value: partners.length, color: '#c9a227' },
          {
            label: 'Active',
            value: partners.filter((p) => p.status === 'ACTIVE').length,
            color: '#4ade80',
          },
          { label: 'Alerts', value: partners.reduce((s, p) => s + p.alerts, 0), color: '#ef4444' },
          {
            label: 'Avg Trust',
            value: `${avgTrust}/100`,
            color: avgTrust >= 90 ? '#4ade80' : avgTrust >= 75 ? '#facc15' : '#fb923c',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="imperial-card rounded-lg p-3 text-center">
            <div className="font-mono text-2xl font-bold" style={{ color }}>
              {value}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 tracking-wider">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {domains.map((d) => (
          <button
            key={d}
            onClick={() => setFilterDomain(d)}
            className={cn(
              'px-3 py-1.5 rounded font-mono text-[10px] tracking-widest border transition-all',
              filterDomain === d
                ? 'border-gold/40 bg-gold/10 text-gold'
                : 'border-white/5 text-slate-500 hover:border-white/10',
            )}
          >
            {d}
          </button>
        ))}
      </div>

      {listQ.isLoading && partners.length === 0 ? (
        <div className="text-center py-12 text-slate-600 text-sm font-mono">
          LOADING PARTNERS…
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((p) => (
            <PartnerCard key={p.id} partner={p} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-12 text-slate-600 text-sm font-mono">
              NO PARTNERS IN THIS DOMAIN
            </div>
          )}
        </div>
      )}
    </div>
  );
}
