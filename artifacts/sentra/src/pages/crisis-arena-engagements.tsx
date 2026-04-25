import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  Loader2,
  Plus,
  Shield,
  Users,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'wouter';

const BASE = '/api';

type ThreatArchetype =
  | 'ransomware'
  | 'insider'
  | 'supply_chain'
  | 'regulatory'
  | 'cascade'
  | 'black_swan';
type SubmissionStatus = 'pending' | 'accepted' | 'duplicate' | 'out_of_scope' | 'rejected' | 'graduated';
type EngagementStatus = 'open' | 'accepting' | 'closed' | 'archived';

interface Submission {
  id: string;
  engagementId: string;
  architectId: string;
  title: string;
  narrative: string;
  archetype: ThreatArchetype;
  businessImpactScore: number;
  status: SubmissionStatus;
  reputationAwarded: number;
  payoutAwarded: number;
  triageJustification?: string;
  submittedAt: string;
  updatedAt: string;
  graduatedIncidentId?: string;
  impactEstimate: {
    revenueAtRiskUsd: number;
    rtoBreach: number;
    rpoBreach: number;
    regulatoryExposureUsd: number;
    blastRadiusDomains: string[];
  };
  killChain: Array<{ phase: string; technique: string; description: string }>;
}

interface Engagement {
  id: string;
  title: string;
  description: string;
  scopedAssets: string[];
  scopedDomains: string[];
  archetypeFilter: ThreatArchetype[];
  payoutPool: number;
  deadline: string;
  status: EngagementStatus;
  createdAt: string;
  submissionCount: number;
  acceptedCount: number;
  submissions?: Submission[];
}

const ARCHETYPE_COLORS: Record<ThreatArchetype, string> = {
  ransomware: 'text-red-300',
  cascade: 'text-orange-300',
  supply_chain: 'text-amber-300',
  regulatory: 'text-violet-300',
  insider: 'text-rose-300',
  black_swan: 'text-red-400',
};

const STATUS_STYLE: Record<SubmissionStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  accepted: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  graduated: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  rejected: 'bg-red-500/10 text-red-300 border-red-500/30',
  duplicate: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  out_of_scope: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

function formatUsd(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function daysUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return 'Expired';
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  return `${days}d left`;
}

async function readCsrfToken(): Promise<string | null> {
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  if (m) return decodeURIComponent(m[1]);
  try {
    await fetch(`${BASE}/csrf-token`, { credentials: 'include' });
    const m2 = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
    return m2 ? decodeURIComponent(m2[1]) : null;
  } catch {
    return null;
  }
}

async function apiPost<T>(path: string, body: unknown): Promise<T | null> {
  const csrf = await readCsrfToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (csrf) headers['X-CSRF-Token'] = csrf;
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

interface CreateEngagementModalProps {
  onClose: () => void;
  onCreate: (eng: Engagement) => void;
}

function CreateEngagementModal({ onClose, onCreate }: CreateEngagementModalProps) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    scopedAssets: '',
    scopedDomains: 'Sentra,Counsel',
    archetypeFilter: ['ransomware'] as ThreatArchetype[],
    payoutPool: 10000,
    deadline: new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const archetypes: ThreatArchetype[] = [
    'ransomware',
    'insider',
    'supply_chain',
    'regulatory',
    'cascade',
    'black_swan',
  ];

  const toggleArchetype = (a: ThreatArchetype) =>
    setForm((f) => ({
      ...f,
      archetypeFilter: f.archetypeFilter.includes(a)
        ? f.archetypeFilter.filter((x) => x !== a)
        : [...f.archetypeFilter, a],
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.scopedAssets) {
      setError('Title, description, and assets are required.');
      return;
    }
    if (form.archetypeFilter.length === 0) {
      setError('Select at least one archetype.');
      return;
    }
    setSaving(true);
    setError(null);
    const result = await apiPost<Engagement>('/crisis-arena/engagements', {
      title: form.title,
      description: form.description,
      scopedAssets: form.scopedAssets
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      scopedDomains: form.scopedDomains
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      archetypeFilter: form.archetypeFilter,
      payoutPool: form.payoutPool,
      deadline: new Date(form.deadline).toISOString(),
    });
    setSaving(false);
    if (!result) {
      setError('Failed to create engagement.');
      return;
    }
    onCreate(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-red-500/20 bg-[#0f0808] shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-red-500/10">
          <h2 className="text-sm font-bold text-red-100">Create Engagement</h2>
          <button onClick={onClose} className="text-red-400/50 hover:text-red-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="p-5 space-y-4"
        >
          <div>
            <label className="text-[10px] text-red-400/50 font-mono uppercase tracking-wider block mb-1">
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Q4 Billing Cluster Resilience"
              className="w-full bg-[#1a0d0d] border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-200 placeholder:text-red-400/30 outline-none focus:border-red-500/40"
            />
          </div>
          <div>
            <label className="text-[10px] text-red-400/50 font-mono uppercase tracking-wider block mb-1">
              Description *
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Describe the scenario scope and what crisis architects should model..."
              className="w-full bg-[#1a0d0d] border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-200 placeholder:text-red-400/30 outline-none focus:border-red-500/40 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-red-400/50 font-mono uppercase tracking-wider block mb-1">
                Scoped Assets (comma-separated)
              </label>
              <input
                type="text"
                value={form.scopedAssets}
                onChange={(e) => setForm({ ...form, scopedAssets: e.target.value })}
                placeholder="billing-cluster, erp-system"
                className="w-full bg-[#1a0d0d] border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-200 placeholder:text-red-400/30 outline-none focus:border-red-500/40"
              />
            </div>
            <div>
              <label className="text-[10px] text-red-400/50 font-mono uppercase tracking-wider block mb-1">
                Payout Pool ($)
              </label>
              <input
                type="number"
                value={form.payoutPool}
                onChange={(e) => setForm({ ...form, payoutPool: Number(e.target.value) })}
                className="w-full bg-[#1a0d0d] border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-200 outline-none focus:border-red-500/40"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-red-400/50 font-mono uppercase tracking-wider block mb-1">
              Archetype Filter
            </label>
            <div className="flex flex-wrap gap-2">
              {(['ransomware', 'insider', 'supply_chain', 'regulatory', 'cascade', 'black_swan'] as ThreatArchetype[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleArchetype(a)}
                  className={cn(
                    'px-2 py-1 rounded text-[10px] font-mono border transition-colors',
                    form.archetypeFilter.includes(a)
                      ? 'bg-red-500/20 border-red-500/40 text-red-300'
                      : 'bg-transparent border-red-500/10 text-red-400/40 hover:border-red-500/20',
                  )}
                >
                  {a.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-red-400/50 font-mono uppercase tracking-wider block mb-1">
              Deadline
            </label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="w-full bg-[#1a0d0d] border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-200 outline-none focus:border-red-500/40"
            />
          </div>
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs text-red-400/60 hover:bg-red-500/5 border border-red-500/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              Create Engagement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface TriageModalProps {
  submission: Submission;
  onClose: () => void;
  onTriage: (sub: Submission) => void;
}

function TriageModal({ submission, onClose, onTriage }: TriageModalProps) {
  const [action, setAction] = useState<'accept' | 'reject' | 'duplicate' | 'out_of_scope'>('accept');
  const [justification, setJustification] = useState('');
  const [saving, setSaving] = useState(false);
  const [graduating, setGraduating] = useState(false);

  const handleTriage = async () => {
    if (!justification.trim()) return;
    setSaving(true);
    const result = await apiPost<Submission>(`/crisis-arena/submissions/${submission.id}/triage`, {
      action,
      justification,
    });
    setSaving(false);
    if (result) onTriage(result);
  };

  const handleGraduate = async () => {
    setGraduating(true);
    const result = await apiPost<{ submission: Submission; incidentId: string }>(
      `/crisis-arena/submissions/${submission.id}/graduate`,
      {},
    );
    setGraduating(false);
    if (result) onTriage(result.submission);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-red-500/20 bg-[#0f0808] shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-red-500/10">
          <h2 className="text-sm font-bold text-red-100">Triage Submission</h2>
          <button onClick={onClose} className="text-red-400/50 hover:text-red-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-red-500/5 rounded-lg p-4 border border-red-500/10">
            <div className="text-xs font-bold text-red-100 mb-1">{submission.title}</div>
            <div className="flex items-center gap-3 text-[10px] text-red-400/50">
              <span>BIS: {submission.businessImpactScore}</span>
              <span>{submission.archetype.replace('_', ' ')}</span>
              <span>Rev at risk: {formatUsd(submission.impactEstimate.revenueAtRiskUsd)}</span>
            </div>
          </div>

          {submission.status === 'accepted' && (
            <div className="space-y-2">
              <div className="text-[11px] text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Already accepted. You can graduate it to a
                tabletop exercise.
              </div>
              <button
                onClick={() => void handleGraduate()}
                disabled={graduating}
                className="w-full px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                {graduating && <Loader2 className="w-3 h-3 animate-spin" />}
                Graduate to Incident Commander
              </button>
            </div>
          )}

          {submission.status === 'pending' && (
            <>
              <div>
                <label className="text-[10px] text-red-400/50 font-mono uppercase tracking-wider block mb-2">
                  Action
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { v: 'accept', label: 'Accept', color: 'hover:border-emerald-500/40 hover:text-emerald-300' },
                      { v: 'reject', label: 'Reject', color: 'hover:border-red-500/40 hover:text-red-300' },
                      { v: 'duplicate', label: 'Duplicate', color: 'hover:border-slate-500/40' },
                      { v: 'out_of_scope', label: 'Out of Scope', color: 'hover:border-amber-500/40' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setAction(opt.v)}
                      className={cn(
                        'px-3 py-2 rounded-lg text-xs border transition-colors',
                        action === opt.v
                          ? 'bg-red-500/15 border-red-500/40 text-red-200'
                          : `bg-transparent border-red-500/10 text-red-400/50 ${opt.color}`,
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-red-400/50 font-mono uppercase tracking-wider block mb-1">
                  Justification *
                </label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={3}
                  placeholder="Explain the triage decision..."
                  className="w-full bg-[#1a0d0d] border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-200 placeholder:text-red-400/30 outline-none focus:border-red-500/40 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs text-red-400/60 hover:bg-red-500/5 border border-red-500/10"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleTriage()}
                  disabled={saving || !justification.trim()}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                  Submit Triage
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface AwardPayoutModalProps {
  submission: Submission;
  payoutPool: number;
  onClose: () => void;
  onAwarded: (sub: Submission) => void;
}

function AwardPayoutModal({ submission, payoutPool, onClose, onAwarded }: AwardPayoutModalProps) {
  const [amount, setAmount] = useState(Math.round(payoutPool * 0.5));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAward = async () => {
    if (amount <= 0) {
      setError('Payout amount must be greater than zero.');
      return;
    }
    setSaving(true);
    setError(null);
    const result = await apiPost<Submission>(`/crisis-arena/submissions/${submission.id}/award`, {
      payoutAmount: amount,
      note: note || undefined,
    });
    setSaving(false);
    if (!result) {
      setError('Failed to record payout. Make sure you own this engagement.');
      return;
    }
    onAwarded(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-emerald-500/20 bg-[#080f0a] shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-emerald-500/10">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-emerald-100">Award Payout</h2>
          </div>
          <button onClick={onClose} className="text-emerald-400/50 hover:text-emerald-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/10">
            <div className="text-xs font-bold text-emerald-100 mb-1">{submission.title}</div>
            <div className="flex items-center gap-3 text-[10px] text-emerald-400/50">
              <span>BIS: {submission.businessImpactScore}</span>
              <span className="capitalize">{submission.archetype.replace('_', ' ')}</span>
              <span>Pool: {formatUsd(payoutPool)}</span>
            </div>
          </div>
          {submission.payoutAwarded > 0 && (
            <div className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-3 py-2">
              Existing payout: {formatUsd(submission.payoutAwarded)} — submitting will overwrite.
            </div>
          )}
          <div>
            <label className="text-[10px] text-emerald-400/50 font-mono uppercase tracking-wider block mb-1">
              Payout Amount ($)
            </label>
            <input
              type="number"
              min={1}
              max={payoutPool}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-[#0d1a10] border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-emerald-200 outline-none focus:border-emerald-500/40"
            />
          </div>
          <div>
            <label className="text-[10px] text-emerald-400/50 font-mono uppercase tracking-wider block mb-1">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Outstanding kill chain analysis"
              className="w-full bg-[#0d1a10] border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-emerald-200 placeholder:text-emerald-400/30 outline-none focus:border-emerald-500/40"
            />
          </div>
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs text-emerald-400/60 hover:bg-emerald-500/5 border border-emerald-500/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleAward()}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              <DollarSign className="w-3 h-3" /> Record Payout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CrisisArenaEngagements() {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<Engagement | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [triageSub, setTriageSub] = useState<Submission | null>(null);
  const [awardSub, setAwardSub] = useState<{ sub: Submission; pool: number } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`${BASE}/crisis-arena/engagements`, { credentials: 'include' });
      if (res.status === 401 || res.status === 403) {
        setRequiresAuth(true);
      } else if (res.ok) {
        const body = (await res.json()) as { data?: { engagements: Engagement[] }; engagements?: Engagement[] };
        setEngagements(body.data?.engagements ?? (body as unknown as { engagements: Engagement[] }).engagements ?? []);
      }
      setLoading(false);
    }
    void load();
  }, []);

  const selectEngagement = async (id: string) => {
    if (selected === id) {
      setSelected(null);
      setSelectedDetail(null);
      return;
    }
    setSelected(id);
    setLoadingDetail(true);
    const res = await fetch(`${BASE}/crisis-arena/engagements/${id}`);
    if (res.ok) {
      const body = (await res.json()) as Engagement;
      setSelectedDetail(body);
    }
    setLoadingDetail(false);
  };

  const handleTriaged = (updated: Submission) => {
    setTriageSub(null);
    if (!selectedDetail) return;
    const subs = selectedDetail.submissions?.map((s) => (s.id === updated.id ? updated : s)) ?? [];
    setSelectedDetail({ ...selectedDetail, submissions: subs });
  };

  const statusColors: Record<EngagementStatus, string> = {
    accepting: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    open: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    closed: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    archived: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  };

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-6xl mx-auto">
      {createOpen && (
        <CreateEngagementModal
          onClose={() => setCreateOpen(false)}
          onCreate={(eng) => {
            setEngagements((prev) => [eng, ...prev]);
            setCreateOpen(false);
          }}
        />
      )}
      {triageSub && (
        <TriageModal
          submission={triageSub}
          onClose={() => setTriageSub(null)}
          onTriage={handleTriaged}
        />
      )}
      {awardSub && (
        <AwardPayoutModal
          submission={awardSub.sub}
          payoutPool={awardSub.pool}
          onClose={() => setAwardSub(null)}
          onAwarded={(updated) => {
            setAwardSub(null);
            if (!selectedDetail) return;
            const subs = selectedDetail.submissions?.map((s) => (s.id === updated.id ? updated : s)) ?? [];
            setSelectedDetail({ ...selectedDetail, submissions: subs });
          }}
        />
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5" style={{ color: 'var(--gi-accent-red)' }} />
            <h1 className="text-2xl font-bold" style={{ color: 'var(--gi-text-primary)' }}>Adversarial Simulation — Engagements</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--gi-text-muted)' }}>
            Post a scoped crisis scenario brief and manage incoming analyst submissions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/crisis-arena/leaderboard">
            <button className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md transition-colors" style={{ background: 'var(--gi-bg-surface)', border: '1px solid var(--gi-border-default)', color: 'var(--gi-text-secondary)' }}>
              <Users className="w-3.5 h-3.5" /> Rankings
            </button>
          </Link>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Engagement
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
        </div>
      )}

      {!loading && requiresAuth && (
        <div className="flex flex-col items-center justify-center py-24 gap-5">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Shield className="w-7 h-7 text-red-400/60" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-red-100 mb-1">Sign in to access client engagements</p>
            <p className="text-xs max-w-xs" style={{ color: 'var(--gi-text-muted)' }}>
              The engagements board is a private workspace for authenticated clients. The analyst performance registry is available without sign-in.
            </p>
          </div>
          <Link href="/crisis-arena/leaderboard">
            <button className="flex items-center gap-2 px-4 py-2 text-xs rounded-md transition-colors" style={{ background: 'var(--gi-bg-surface)', border: '1px solid var(--gi-border-default)', color: 'var(--gi-text-secondary)' }}>
              <Users className="w-3.5 h-3.5" style={{ color: 'var(--gi-accent-amber)' }} /> View Analyst Rankings
            </button>
          </Link>
        </div>
      )}

      {!loading && !requiresAuth && (
        <div className="space-y-4">
          {engagements.map((eng) => (
            <div
              key={eng.id}
              className={cn(
                'bg-[#0f0808]/80 border rounded-xl overflow-hidden',
                selected === eng.id ? 'border-red-500/30' : 'border-red-500/10',
              )}
            >
              <button
                className="w-full text-left p-5 hover:bg-red-500/5 transition-colors"
                onClick={() => void selectEngagement(eng.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider border',
                          statusColors[eng.status],
                        )}
                      >
                        {eng.status}
                      </span>
                      {eng.archetypeFilter.slice(0, 3).map((a) => (
                        <span
                          key={a}
                          className={cn(
                            'text-[9px] font-mono uppercase tracking-wider',
                            ARCHETYPE_COLORS[a],
                          )}
                        >
                          {a.replace('_', ' ')}
                        </span>
                      ))}
                      <span className="text-[9px] font-mono text-red-400/30 ml-auto flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {daysUntil(eng.deadline)}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-red-100 mb-1">{eng.title}</h3>
                    <p className="text-[11px] text-red-300/50 line-clamp-2">{eng.description}</p>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-300 font-mono">
                        {formatUsd(eng.payoutPool)}
                      </div>
                      <div className="text-[9px] text-red-400/40 uppercase">Payout Pool</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-amber-300 font-mono">
                        {eng.submissionCount}
                      </div>
                      <div className="text-[9px] text-red-400/40 uppercase">Submissions</div>
                    </div>
                    <ChevronRight
                      className={cn(
                        'w-4 h-4 text-red-400/40 transition-transform',
                        selected === eng.id && 'rotate-90',
                      )}
                    />
                  </div>
                </div>
              </button>

              {selected === eng.id && (
                <div className="border-t border-red-500/10">
                  {loadingDetail && (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-5 h-5 text-red-400 animate-spin" />
                    </div>
                  )}
                  {!loadingDetail && selectedDetail && (
                    <div className="p-5">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        {[
                          { label: 'Scoped Assets', value: eng.scopedAssets.slice(0, 2).join(', '), extra: eng.scopedAssets.length > 2 ? ` +${eng.scopedAssets.length - 2}` : '' },
                          { label: 'Domains', value: eng.scopedDomains.join(', '), extra: '' },
                          { label: 'Accepted', value: String(eng.acceptedCount), extra: '' },
                          { label: 'Deadline', value: new Date(eng.deadline).toLocaleDateString(), extra: '' },
                        ].map((info) => (
                          <div key={info.label} className="bg-red-500/5 rounded-lg p-3">
                            <div className="text-[9px] text-red-400/40 uppercase tracking-wider mb-1">
                              {info.label}
                            </div>
                            <div className="text-[11px] text-red-200 font-mono">
                              {info.value}{info.extra}
                            </div>
                          </div>
                        ))}
                      </div>

                      <h4 className="text-[10px] text-red-400/50 font-mono uppercase tracking-wider mb-3">
                        Submission Inbox ({(selectedDetail.submissions ?? []).length})
                      </h4>

                      {(selectedDetail.submissions ?? []).length === 0 && (
                        <div className="text-center py-8 text-red-400/30 text-xs">
                          No submissions yet. Share the engagement with crisis architects.
                        </div>
                      )}

                      <div className="space-y-3">
                        {(selectedDetail.submissions ?? [])
                          .sort((a, b) => b.businessImpactScore - a.businessImpactScore)
                          .map((sub) => (
                            <div
                              key={sub.id}
                              className="bg-[#1a0d0d]/60 border border-red-500/10 rounded-lg p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span
                                      className={cn(
                                        'px-1.5 py-0.5 rounded text-[9px] font-mono border uppercase',
                                        STATUS_STYLE[sub.status],
                                      )}
                                    >
                                      {sub.status}
                                    </span>
                                    <span
                                      className={cn(
                                        'text-[9px] font-mono uppercase',
                                        ARCHETYPE_COLORS[sub.archetype],
                                      )}
                                    >
                                      {sub.archetype.replace('_', ' ')}
                                    </span>
                                    <span className="text-[9px] text-red-400/30 ml-auto">
                                      {relativeTime(sub.submittedAt)}
                                    </span>
                                  </div>
                                  <div className="text-xs font-bold text-red-100 mb-1">
                                    {sub.title}
                                  </div>
                                  <div className="flex items-center gap-4 text-[10px] text-red-400/40 font-mono">
                                    <span>BIS: {sub.businessImpactScore}</span>
                                    <span>Rev: {formatUsd(sub.impactEstimate.revenueAtRiskUsd)}</span>
                                    <span>
                                      Blast:{' '}
                                      {sub.impactEstimate.blastRadiusDomains.join(', ')}
                                    </span>
                                  </div>
                                  {sub.triageJustification && (
                                    <p className="text-[10px] text-red-300/40 mt-1 italic">
                                      {sub.triageJustification}
                                    </p>
                                  )}
                                  {sub.graduatedIncidentId && (
                                    <div className="flex items-center gap-1 text-[10px] text-sky-400 mt-1">
                                      <Shield className="w-2.5 h-2.5" /> Graduated →{' '}
                                      <Link href="/incident">
                                        <span className="underline cursor-pointer">
                                          {sub.graduatedIncidentId}
                                        </span>
                                      </Link>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="text-center">
                                    <div
                                      className={cn(
                                        'text-base font-bold font-mono',
                                        sub.businessImpactScore >= 80
                                          ? 'text-red-400'
                                          : sub.businessImpactScore >= 60
                                            ? 'text-amber-400'
                                            : 'text-slate-400',
                                      )}
                                    >
                                      {sub.businessImpactScore}
                                    </div>
                                    <div className="text-[8px] text-red-400/30 uppercase">BIS</div>
                                  </div>
                                  {['accepted', 'graduated'].includes(sub.status) && (
                                    <button
                                      onClick={() => setAwardSub({ sub, pool: eng.payoutPool })}
                                      className="px-3 py-1.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[10px] font-mono border border-emerald-500/20 transition-colors flex items-center gap-1"
                                      title={sub.payoutAwarded > 0 ? `Current: ${formatUsd(sub.payoutAwarded)}` : 'Award payout'}
                                    >
                                      <DollarSign className="w-2.5 h-2.5" />
                                      {sub.payoutAwarded > 0 ? formatUsd(sub.payoutAwarded) : 'Award'}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setTriageSub(sub)}
                                    className="px-3 py-1.5 rounded bg-red-500/15 hover:bg-red-500/25 text-red-300 text-[10px] font-mono border border-red-500/20 transition-colors"
                                  >
                                    Triage
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
