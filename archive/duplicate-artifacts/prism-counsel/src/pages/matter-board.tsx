import {
  getCounselListMattersQueryKey,
  useCounselCreateMatter,
} from '@szl-holdings/api-client-react';
import { GraphCanvas } from '@szl-holdings/design-system';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ChevronDown,
  Clock,
  Eye,
  Filter,
  Lock,
  Network,
  Plus,
  Shield,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { type Matter, type MatterStatus, type MatterType, type PrivilegeLevel, daysUntil, formatCurrency, formatDeadline, getPressureColor, getPressureLabel, getPrivilegeColor, getStatusColor, useMatters } from '@/data/matters';
import { buildGraph } from '@/lib/obligation-graph-builder';

const ACCENT = '#a78bfa';

const STATUS_OPTIONS: { value: MatterStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'pending', label: 'Pending' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'closed', label: 'Closed' },
];

const TYPE_OPTIONS: { value: MatterType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'litigation', label: 'Litigation' },
  { value: 'ip', label: 'Intellectual Property' },
  { value: 'transaction', label: 'Transaction' },
  { value: 'regulatory', label: 'Regulatory' },
  { value: 'employment', label: 'Employment' },
  { value: 'contract', label: 'Contract' },
  { value: 'real-estate', label: 'Real Estate' },
];

const thumbnailLayoutCache = new Map<string, ReturnType<typeof buildGraph>>();

function getThumbnailGraph(matter: Matter) {
  const cached = thumbnailLayoutCache.get(matter.id);
  if (cached) return cached;
  const built = buildGraph(matter, { compact: true });
  thumbnailLayoutCache.set(matter.id, built);
  return built;
}

function MatterGraphThumbnail({ matter, onOpen }: { matter: Matter; onOpen: () => void }) {
  const { graphNodes, graphEdges } = useMemo(() => getThumbnailGraph(matter), [matter]);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      className="block w-full text-left relative rounded-lg overflow-hidden border border-white/5 hover:border-white/15 focus:outline-none focus:border-purple-500/40 transition-colors"
      style={{ background: 'rgba(255,255,255,0.015)' }}
      aria-label={`Open obligation graph for ${matter.name}`}
    >
      <div className="pointer-events-none">
        <GraphCanvas
          nodes={graphNodes}
          edges={graphEdges}
          height={92}
          background="transparent"
          showLabels={false}
          className="border-0 rounded-none"
        />
      </div>
      <div className="absolute top-1.5 left-2 flex items-center gap-1 text-[9px] uppercase tracking-wider text-white/30 pointer-events-none">
        <Network className="w-2.5 h-2.5" />
        <span>Obligation Graph</span>
      </div>
    </button>
  );
}

function PressureMeter({ score }: { score: number }) {
  const color = getPressureColor(score);
  const isCritical = score >= 90;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-white/30">Pressure</span>
        <span
          className={`font-mono font-bold ${isCritical ? 'pressure-critical' : ''}`}
          style={{ color }}
        >
          {score}
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className={`h-full rounded-full transition-all ${isCritical ? 'pressure-critical' : ''}`}
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color }}>
        {getPressureLabel(score)}
      </p>
    </div>
  );
}

interface NewMatterForm {
  name: string;
  clientName: string;
  matterNumber: string;
  type: MatterType;
  status: MatterStatus;
  privilegeLevel: PrivilegeLevel;
  leadCounsel: string;
  jurisdiction: string;
  summary: string;
  nextDeadline: string;
  nextDeadlineLabel: string;
  pressureScore: number;
  complexityScore: number;
  estimatedExposure: string;
  tagsRaw: string;
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0] as string;
}
function plusDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0] as string;
}

function emptyForm(): NewMatterForm {
  return {
    name: '',
    clientName: '',
    matterNumber: '',
    type: 'litigation',
    status: 'active',
    privilegeLevel: 'confidential',
    leadCounsel: '',
    jurisdiction: '',
    summary: '',
    nextDeadline: plusDaysIso(30),
    nextDeadlineLabel: 'Initial review',
    pressureScore: 50,
    complexityScore: 50,
    estimatedExposure: '',
    tagsRaw: '',
  };
}

function NewMatterModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<NewMatterForm>(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const create = useCounselCreateMatter();

  const set = <K extends keyof NewMatterForm>(k: K, v: NewMatterForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (
      !form.name.trim() ||
      !form.clientName.trim() ||
      !form.matterNumber.trim() ||
      !form.leadCounsel.trim() ||
      !form.jurisdiction.trim() ||
      !form.summary.trim()
    ) {
      setError('Please fill in all required fields.');
      return;
    }
    const exposure = form.estimatedExposure.trim();
    const exposureNum = exposure === '' ? null : Number(exposure.replace(/,/g, ''));
    if (exposureNum !== null && Number.isNaN(exposureNum)) {
      setError('Estimated exposure must be a number.');
      return;
    }
    create.mutate(
      {
        data: {
          name: form.name.trim(),
          clientName: form.clientName.trim(),
          matterNumber: form.matterNumber.trim(),
          type: form.type,
          status: form.status,
          privilegeLevel: form.privilegeLevel,
          pressureScore: Math.max(0, Math.min(100, Math.round(form.pressureScore))),
          complexityScore: Math.max(0, Math.min(100, Math.round(form.complexityScore))),
          openedDate: todayIso(),
          nextDeadline: form.nextDeadline,
          nextDeadlineLabel: form.nextDeadlineLabel.trim() || 'Initial review',
          leadCounsel: form.leadCounsel.trim(),
          jurisdiction: form.jurisdiction.trim(),
          estimatedExposure: exposureNum,
          summary: form.summary.trim(),
          tags: form.tagsRaw
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          wall: {
            enabled: false,
            reason: '',
            blockedRoles: [],
            approvedUsers: [],
            createdAt: '',
            createdBy: '',
          },
          parties: [],
        },
      },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: getCounselListMattersQueryKey() });
          onCreated();
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Failed to create matter.';
          setError(msg);
        },
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 p-6"
        style={{ background: 'rgba(15,15,20,0.98)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold font-display text-white/90">New Matter</h2>
            <p className="text-xs text-white/40 mt-1">
              Open a new legal matter. Obligations, audit, and proof-chain entries can be added
              after creation.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3" data-testid="form-new-matter">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Matter Name *">
              <input
                data-testid="input-matter-name"
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className={inputCls}
                placeholder="Apex — Series C Acquisition"
              />
            </Field>
            <Field label="Matter Number *">
              <input
                data-testid="input-matter-number"
                required
                value={form.matterNumber}
                onChange={(e) => set('matterNumber', e.target.value)}
                className={inputCls}
                placeholder="2026-MA-001"
              />
            </Field>
            <Field label="Client Name *">
              <input
                data-testid="input-client-name"
                required
                value={form.clientName}
                onChange={(e) => set('clientName', e.target.value)}
                className={inputCls}
                placeholder="Apex Capital Partners LP"
              />
            </Field>
            <Field label="Lead Counsel *">
              <input
                data-testid="input-lead-counsel"
                required
                value={form.leadCounsel}
                onChange={(e) => set('leadCounsel', e.target.value)}
                className={inputCls}
                placeholder="M. Farooq"
              />
            </Field>
            <Field label="Type">
              <select
                data-testid="select-matter-type"
                value={form.type}
                onChange={(e) => set('type', e.target.value as MatterType)}
                className={inputCls}
              >
                {(
                  [
                    'litigation',
                    'ip',
                    'transaction',
                    'regulatory',
                    'employment',
                    'contract',
                    'real-estate',
                  ] as MatterType[]
                ).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                data-testid="select-matter-status"
                value={form.status}
                onChange={(e) => set('status', e.target.value as MatterStatus)}
                className={inputCls}
              >
                {(['active', 'pending', 'escalated', 'on-hold', 'closed'] as MatterStatus[]).map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ),
                )}
              </select>
            </Field>
            <Field label="Privilege Level">
              <select
                data-testid="select-privilege-level"
                value={form.privilegeLevel}
                onChange={(e) => set('privilegeLevel', e.target.value as PrivilegeLevel)}
                className={inputCls}
              >
                {(['public', 'confidential', 'privileged', 'restricted'] as PrivilegeLevel[]).map(
                  (p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ),
                )}
              </select>
            </Field>
            <Field label="Jurisdiction *">
              <input
                data-testid="input-jurisdiction"
                required
                value={form.jurisdiction}
                onChange={(e) => set('jurisdiction', e.target.value)}
                className={inputCls}
                placeholder="Delaware / Federal"
              />
            </Field>
            <Field label="Next Deadline">
              <input
                data-testid="input-next-deadline"
                type="date"
                value={form.nextDeadline}
                onChange={(e) => set('nextDeadline', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Deadline Label">
              <input
                data-testid="input-deadline-label"
                value={form.nextDeadlineLabel}
                onChange={(e) => set('nextDeadlineLabel', e.target.value)}
                className={inputCls}
                placeholder="HSR Filing"
              />
            </Field>
            <Field label="Pressure Score (0-100)">
              <input
                type="number"
                min={0}
                max={100}
                value={form.pressureScore}
                onChange={(e) => set('pressureScore', Number(e.target.value))}
                className={inputCls}
              />
            </Field>
            <Field label="Complexity Score (0-100)">
              <input
                type="number"
                min={0}
                max={100}
                value={form.complexityScore}
                onChange={(e) => set('complexityScore', Number(e.target.value))}
                className={inputCls}
              />
            </Field>
            <Field label="Estimated Exposure ($)">
              <input
                value={form.estimatedExposure}
                onChange={(e) => set('estimatedExposure', e.target.value)}
                className={inputCls}
                placeholder="e.g. 25000000"
              />
            </Field>
            <Field label="Tags (comma separated)">
              <input
                value={form.tagsRaw}
                onChange={(e) => set('tagsRaw', e.target.value)}
                className={inputCls}
                placeholder="M&A, Antitrust"
              />
            </Field>
          </div>
          <Field label="Summary *">
            <textarea
              data-testid="input-summary"
              required
              rows={3}
              value={form.summary}
              onChange={(e) => set('summary', e.target.value)}
              className={inputCls}
              placeholder="Brief description of the matter and its current posture."
            />
          </Field>
          {error && (
            <div
              className="text-[11px] text-red-400 px-3 py-2 rounded-lg"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              {error}
            </div>
          )}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-3 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white/90 hover:border-white/20 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="button-create-matter"
              disabled={create.isPending}
              className="text-xs px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
              style={{
                background: 'rgba(167,139,250,0.18)',
                color: ACCENT,
                border: '1px solid rgba(167,139,250,0.35)',
              }}
            >
              {create.isPending ? 'Creating…' : 'Create Matter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  'w-full text-xs bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-white/85 placeholder:text-white/25 focus:outline-none focus:border-purple-500/40';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] text-white/35 uppercase tracking-wider block mb-1">{label}</span>
      {children}
    </label>
  );
}

export default function MatterBoard() {
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<MatterStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<MatterType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'pressure' | 'deadline' | 'exposure'>('pressure');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewMatter, setShowNewMatter] = useState(false);
  const { matters, isLoading } = useMatters();

  const totalExposure = matters.reduce((s, m) => s + (m.estimatedExposure || 0), 0);
  const criticalCount = matters.filter((m) => m.pressureScore >= 90).length;
  const overdueObligations = matters
    .flatMap((m) => m.obligations)
    .filter((o) => o.status === 'overdue' || o.status === 'at-risk').length;
  const sortedByDeadline = useMemo(
    () => [...matters].sort((a, b) => daysUntil(a.nextDeadline) - daysUntil(b.nextDeadline)),
    [matters],
  );

  const filtered = useMemo(() => {
    let ms = matters;
    if (statusFilter !== 'all') ms = ms.filter((m) => m.status === statusFilter);
    if (typeFilter !== 'all') ms = ms.filter((m) => m.type === typeFilter);
    return [...ms].sort((a, b) => {
      if (sortBy === 'pressure') return b.pressureScore - a.pressureScore;
      if (sortBy === 'deadline') return daysUntil(a.nextDeadline) - daysUntil(b.nextDeadline);
      return (b.estimatedExposure || 0) - (a.estimatedExposure || 0);
    });
  }, [matters, statusFilter, typeFilter, sortBy]);

  if (isLoading && matters.length === 0) {
    return <div className="p-6 text-xs text-white/30">Loading matters…</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold font-display text-white/90">Matter Board</h1>
          <p className="text-xs text-white/30 mt-0.5">
            {matters.length} active matters · {criticalCount} critical
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewMatter(true)}
            data-testid="button-new-matter"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all"
            style={{
              background: 'rgba(167,139,250,0.15)',
              color: ACCENT,
              borderColor: 'rgba(167,139,250,0.35)',
            }}
          >
            <Plus className="w-3 h-3" />
            New Matter
          </button>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-all"
          >
            <Filter className="w-3 h-3" />
            Filters
            <ChevronDown
              className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>
      {showNewMatter && (
        <NewMatterModal
          onClose={() => setShowNewMatter(false)}
          onCreated={() => setShowNewMatter(false)}
        />
      )}

      {/* Matter Stage Pipeline Rail — inspired by Clio Matter Stages */}
      {(() => {
        const STAGES = [
          { id: 'intake', label: 'Intake', statuses: ['pending'] as MatterStatus[] },
          { id: 'active', label: 'Active', statuses: ['active'] as MatterStatus[] },
          { id: 'escalated', label: 'Escalated', statuses: ['escalated'] as MatterStatus[] },
          { id: 'hold', label: 'On Hold', statuses: ['on-hold'] as MatterStatus[] },
          { id: 'closed', label: 'Closed', statuses: ['closed'] as MatterStatus[] },
        ];
        const totalExp = matters.reduce((s, m) => s + (m.estimatedExposure || 0), 0) || 1;
        return (
          <div
            className="rounded-xl border border-white/5 overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.015)' }}
          >
            <div className="flex items-center gap-2 px-4 pt-3 pb-0">
              <span
                className="text-[9px] font-mono uppercase tracking-widest"
                style={{ color: 'rgba(167,139,250,0.4)' }}
              >
                Matter Lifecycle Pipeline
              </span>
              <span className="text-[9px] font-mono text-white/15">
                · {matters.length} total · {formatCurrency(totalExposure)} aggregate exposure
              </span>
            </div>
            <div className="flex items-stretch gap-0 px-4 py-3 overflow-x-auto">
              {STAGES.map((stage, i) => {
                const stageMatters = matters.filter((m) => stage.statuses.includes(m.status));
                const stageExp = stageMatters.reduce((s, m) => s + (m.estimatedExposure || 0), 0);
                const pct = totalExposure > 0 ? Math.round((stageExp / totalExp) * 100) : 0;
                const isLast = i === STAGES.length - 1;
                return (
                  <div key={stage.id} className="flex items-center gap-0 flex-1 min-w-0">
                    <div
                      className="flex-1 min-w-0 rounded-lg px-3 py-2.5 cursor-pointer hover:opacity-80 transition-opacity"
                      style={{
                        background:
                          stageMatters.length > 0
                            ? 'rgba(167,139,250,0.06)'
                            : 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(167,139,250,0.12)',
                      }}
                      onClick={() => {
                        setStatusFilter(stage.statuses[0]);
                      }}
                    >
                      <div className="text-[9px] font-mono uppercase tracking-wider text-white/30 mb-1">
                        {stage.label}
                      </div>
                      <div
                        className="text-lg font-bold font-display"
                        style={{
                          color: stageMatters.length > 0 ? ACCENT : 'rgba(255,255,255,0.15)',
                        }}
                      >
                        {stageMatters.length}
                      </div>
                      <div className="text-[9px] text-white/20 mt-0.5">
                        {stageMatters.length > 0 ? formatCurrency(stageExp) : '—'}
                      </div>
                      {stageMatters.length > 0 && (
                        <div className="mt-2 w-full h-0.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.min(100, pct * 3)}%`, background: ACCENT }}
                          />
                        </div>
                      )}
                    </div>
                    {!isLast && (
                      <div className="flex-shrink-0 w-5 flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path
                            d="M2 2l6 3-6 3"
                            stroke="rgba(167,139,250,0.2)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Matters',
            value: String(matters.length),
            sub: `${criticalCount} critical`,
          },
          {
            label: 'Aggregate Exposure',
            value: formatCurrency(totalExposure),
            sub: 'across all matters',
          },
          {
            label: 'At-Risk Obligations',
            value: String(overdueObligations),
            sub: 'need attention now',
          },
          {
            label: 'Next Deadline',
            value: sortedByDeadline[0] ? formatDeadline(sortedByDeadline[0].nextDeadline) : '—',
            sub: sortedByDeadline[0]?.name.split(' — ')[0] ?? '',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4 border border-white/5"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <p className="text-[10px] text-white/30 mb-1">{s.label}</p>
            <p className="text-xl font-semibold font-display" style={{ color: ACCENT }}>
              {s.value}
            </p>
            <p className="text-[10px] text-white/20 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {showFilters && (
        <div
          className="flex flex-wrap gap-3 p-4 rounded-xl border border-white/5"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-white/30 uppercase tracking-wider">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as MatterStatus | 'all')}
              className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white/70 focus:outline-none focus:border-purple-500/40"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-white/30 uppercase tracking-wider">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as MatterType | 'all')}
              className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white/70 focus:outline-none focus:border-purple-500/40"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-white/30 uppercase tracking-wider">Sort</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'pressure' | 'deadline' | 'exposure')}
              className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white/70 focus:outline-none focus:border-purple-500/40"
            >
              <option value="pressure">Pressure Score</option>
              <option value="deadline">Next Deadline</option>
              <option value="exposure">Exposure</option>
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((matter) => {
          const daysLeft = daysUntil(matter.nextDeadline);
          const _pColor = getPressureColor(matter.pressureScore);
          const sColor = getStatusColor(matter.status);
          const privColor = getPrivilegeColor(matter.privilegeLevel);
          const openObligs = matter.obligations.filter((o) => o.status !== 'complete');
          const atRisk = matter.obligations.filter(
            (o) => o.status === 'at-risk' || o.status === 'overdue',
          );

          return (
            <div
              key={matter.id}
              onClick={() => navigate(`/obligation-graph/${matter.id}`)}
              className="rounded-xl p-5 border border-white/5 hover:border-white/10 transition-all cursor-pointer group"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs font-semibold text-white/85 leading-snug truncate group-hover:text-white transition-colors">
                    {matter.name}
                  </p>
                  <p className="text-[10px] text-white/30 mt-0.5 font-mono">
                    {matter.matterNumber}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span
                    className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                    style={{ background: `${sColor}20`, color: sColor }}
                  >
                    {matter.status}
                  </span>
                  {matter.wall.enabled && (
                    <span
                      className="flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full privilege-glow"
                      style={{
                        background: 'rgba(239,68,68,0.12)',
                        color: '#ef4444',
                        border: '1px solid rgba(239,68,68,0.2)',
                      }}
                    >
                      <Lock className="w-2 h-2" />
                      Wall
                    </span>
                  )}
                </div>
              </div>

              <PressureMeter score={matter.pressureScore} />

              <div className="mt-4">
                <MatterGraphThumbnail
                  matter={matter}
                  onOpen={() => navigate(`/obligation-graph/${matter.id}`)}
                />
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                <div className="flex items-center gap-1.5 text-[10px]">
                  <Clock
                    className={`w-2.5 h-2.5 shrink-0 ${daysLeft <= 3 ? 'text-red-400' : daysLeft <= 7 ? 'text-orange-400' : 'text-white/30'}`}
                  />
                  <span
                    className={`font-medium ${daysLeft <= 3 ? 'text-red-400' : daysLeft <= 7 ? 'text-orange-400' : 'text-white/40'}`}
                  >
                    {formatDeadline(matter.nextDeadline)}
                  </span>
                  <span className="text-white/20 truncate">· {matter.nextDeadlineLabel}</span>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-3">
                    <span className="text-white/30">{openObligs.length} obligations open</span>
                    {atRisk.length > 0 && (
                      <span className="flex items-center gap-1 text-orange-400">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        {atRisk.length} at risk
                      </span>
                    )}
                  </div>
                  <span
                    className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                    style={{ background: `${privColor}20`, color: privColor }}
                  >
                    {matter.privilegeLevel}
                  </span>
                </div>

                {matter.estimatedExposure && (
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/20">Exposure</span>
                    <span className="font-mono text-white/60">
                      {formatCurrency(matter.estimatedExposure)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-white/20">Lead Counsel</span>
                  <span className="text-white/50">{matter.leadCounsel}</span>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-white/20">Jurisdiction</span>
                  <span className="text-white/40 truncate max-w-[140px] text-right">
                    {matter.jurisdiction}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {matter.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(167,139,250,0.08)', color: 'rgba(167,139,250,0.6)' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="flex items-center gap-2 p-3 rounded-lg border border-white/5 text-[11px] text-white/20"
        style={{ background: 'rgba(255,255,255,0.01)' }}
      >
        <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: ACCENT }} />
        All matters subject to attorney-client privilege. Access logged. Do not share outside
        approved parties.
        <Eye className="w-3 h-3 ml-auto shrink-0" style={{ color: ACCENT }} />
      </div>
    </div>
  );
}
