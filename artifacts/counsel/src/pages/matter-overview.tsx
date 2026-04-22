import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Briefcase,
  Clock,
  Database,
  DollarSign,
  Plus,
  Scale,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';

interface Obligation {
  id: string;
  matterId: string;
  title: string;
  status: string;
  dueDate: string;
  assignee: string;
}

interface Matter {
  id: string;
  name: string;
  clientName: string;
  matterNumber: string;
  status: string;
  type: string;
  nextDeadline: string;
  leadCounsel: string;
  jurisdiction: string;
  estimatedExposure?: number;
  pressureScore: number;
  complexityScore: number;
  summary: string;
  obligations: Obligation[];
  provenance?: string;
}

interface MattersResponse {
  matters: Matter[];
  provenance?: string;
}

interface CreateMatterBody {
  name: string;
  matterNumber: string;
  clientName: string;
  leadCounsel: string;
  jurisdiction: string;
  summary: string;
  estimatedExposure?: number | null;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  escalated: 'bg-red-500/10 text-red-400 border-red-500/20',
  'on-hold': 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  closed: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

function SkeletonRow() {
  return (
    <tr>
      <td colSpan={6} className="px-4 py-3">
        <div className="h-10 bg-violet-500/5 rounded animate-pulse" />
      </td>
    </tr>
  );
}

function ProvenanceBadge({ provenance }: { provenance?: string }) {
  if (!provenance) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      <Database className="w-2.5 h-2.5" />
      {provenance === 'seeded' ? 'Demo Data' : 'Live DB'}
    </span>
  );
}

interface NewMatterModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function NewMatterModal({ onClose, onSuccess }: NewMatterModalProps) {
  const [exposureError, setExposureError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const mutation = useMutation({
    mutationFn: (body: CreateMatterBody) =>
      apiFetch<Matter>('/counsel/matters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setExposureError('');
    const fd = new FormData(e.currentTarget);
    const rawExposure = (fd.get('estimatedExposure') as string).trim();
    let estimatedExposure: number | null = null;
    if (rawExposure !== '') {
      const num = Number(rawExposure);
      if (Number.isNaN(num)) {
        setExposureError('Estimated exposure must be a number');
        return;
      }
      estimatedExposure = num;
    }
    const body: CreateMatterBody = {
      name: fd.get('name') as string,
      matterNumber: fd.get('matterNumber') as string,
      clientName: fd.get('clientName') as string,
      leadCounsel: fd.get('leadCounsel') as string,
      jurisdiction: fd.get('jurisdiction') as string,
      summary: fd.get('summary') as string,
      estimatedExposure,
    };
    mutation.mutate(body);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#0d0920] border border-violet-500/20 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-violet-500/10">
          <h2 className="text-sm font-semibold text-violet-100">New Matter</h2>
          <button
            onClick={onClose}
            className="text-violet-400/50 hover:text-violet-400 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          ref={formRef}
          data-testid="form-new-matter"
          onSubmit={handleSubmit}
          className="p-6 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[10px] font-medium text-violet-300/60 uppercase tracking-wider block mb-1">
                Matter Name <span className="text-red-400">*</span>
              </label>
              <input
                name="name"
                data-testid="input-matter-name"
                required
                className="w-full bg-violet-500/5 border border-violet-500/20 rounded-lg px-3 py-2 text-sm text-violet-100 placeholder-violet-400/30 focus:outline-none focus:border-violet-500/50"
                placeholder="e.g. Apex Capital — Series C Acquisition"
              />
            </div>

            <div>
              <label className="text-[10px] font-medium text-violet-300/60 uppercase tracking-wider block mb-1">
                Matter Number <span className="text-red-400">*</span>
              </label>
              <input
                name="matterNumber"
                data-testid="input-matter-number"
                required
                className="w-full bg-violet-500/5 border border-violet-500/20 rounded-lg px-3 py-2 text-sm text-violet-100 placeholder-violet-400/30 focus:outline-none focus:border-violet-500/50"
                placeholder="e.g. 2026-LIT-001"
              />
            </div>

            <div>
              <label className="text-[10px] font-medium text-violet-300/60 uppercase tracking-wider block mb-1">
                Client Name
              </label>
              <input
                name="clientName"
                data-testid="input-client-name"
                className="w-full bg-violet-500/5 border border-violet-500/20 rounded-lg px-3 py-2 text-sm text-violet-100 placeholder-violet-400/30 focus:outline-none focus:border-violet-500/50"
                placeholder="e.g. Apex Capital Partners LP"
              />
            </div>

            <div>
              <label className="text-[10px] font-medium text-violet-300/60 uppercase tracking-wider block mb-1">
                Lead Counsel <span className="text-red-400">*</span>
              </label>
              <input
                name="leadCounsel"
                data-testid="input-lead-counsel"
                required
                className="w-full bg-violet-500/5 border border-violet-500/20 rounded-lg px-3 py-2 text-sm text-violet-100 placeholder-violet-400/30 focus:outline-none focus:border-violet-500/50"
                placeholder="e.g. M. Farooq"
              />
            </div>

            <div>
              <label className="text-[10px] font-medium text-violet-300/60 uppercase tracking-wider block mb-1">
                Jurisdiction <span className="text-red-400">*</span>
              </label>
              <input
                name="jurisdiction"
                data-testid="input-jurisdiction"
                required
                className="w-full bg-violet-500/5 border border-violet-500/20 rounded-lg px-3 py-2 text-sm text-violet-100 placeholder-violet-400/30 focus:outline-none focus:border-violet-500/50"
                placeholder="e.g. Delaware / Federal"
              />
            </div>

            <div className="col-span-2">
              <label className="text-[10px] font-medium text-violet-300/60 uppercase tracking-wider block mb-1">
                Estimated Exposure (USD)
              </label>
              <input
                name="estimatedExposure"
                type="text"
                inputMode="numeric"
                className="w-full bg-violet-500/5 border border-violet-500/20 rounded-lg px-3 py-2 text-sm text-violet-100 placeholder-violet-400/30 focus:outline-none focus:border-violet-500/50"
                placeholder="e.g. 25000000"
              />
              {exposureError && (
                <p className="text-xs text-red-400 mt-1">{exposureError}</p>
              )}
            </div>

            <div className="col-span-2">
              <label className="text-[10px] font-medium text-violet-300/60 uppercase tracking-wider block mb-1">
                Summary <span className="text-red-400">*</span>
              </label>
              <textarea
                name="summary"
                data-testid="input-summary"
                required
                rows={3}
                className="w-full bg-violet-500/5 border border-violet-500/20 rounded-lg px-3 py-2 text-sm text-violet-100 placeholder-violet-400/30 focus:outline-none focus:border-violet-500/50 resize-none"
                placeholder="Brief description of the matter and key legal issues"
              />
            </div>
          </div>

          {mutation.error && (
            <div className="text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg p-3">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              {mutation.error instanceof Error
                ? mutation.error.message
                : 'Failed to create matter. Please try again.'}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-medium text-violet-300/60 hover:text-violet-300 border border-violet-500/20 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="button-create-matter"
              disabled={mutation.isPending}
              className="flex-1 py-2.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {mutation.isPending ? 'Creating…' : 'Create Matter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MatterOverview() {
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<MattersResponse>({
    queryKey: ['counsel-matters'],
    queryFn: () => apiFetch<MattersResponse>('/counsel/matters', { skipAuth: true }),
    staleTime: 30_000,
    retry: 2,
  });

  const matters = data?.matters ?? [];
  const provenance = data?.provenance;

  const totalExposure = matters.reduce((acc, m) => acc + (m.estimatedExposure ?? 0), 0);
  const avgExposure = matters.length > 0 ? totalExposure / matters.length : 0;
  const litigationCount = matters.filter(
    (m) => m.type === 'litigation' || m.type === 'ip' || m.type === 'employment',
  ).length;
  const maCount = matters.filter((m) => m.type === 'transaction').length;

  return (
    <>
      {showModal && (
        <NewMatterModal
          onClose={() => setShowModal(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['counsel-matters'] })}
        />
      )}

      <div className="p-6 space-y-6">
        <header className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-violet-100">Matter Overview</h1>
            <p className="text-violet-400/60 text-sm">Portfolio-wide legal matter tracking.</p>
          </div>
          <div className="flex items-center gap-3">
            <ProvenanceBadge provenance={provenance} />
            <button
              data-testid="button-new-matter"
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Matter
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {isLoading ? (
            [1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-violet-500/5 border border-violet-500/10 p-4 rounded-xl animate-pulse">
                  <div className="h-3 bg-violet-500/10 rounded w-1/2 mb-3" />
                  <div className="h-7 bg-violet-500/10 rounded w-1/3" />
                </div>
              ))
          ) : (
            [
                { label: 'Total Matters', value: matters.length, icon: Briefcase },
                { label: 'In Litigation', value: litigationCount, icon: Scale },
                { label: 'M&A / Transaction', value: maCount, icon: DollarSign },
                {
                  label: 'Avg Exposure',
                  value: avgExposure > 0 ? `$${(avgExposure / 1_000_000).toFixed(1)}M` : '—',
                  icon: ShieldAlert,
                },
              ].map((stat) => (
                <div key={stat.label} className="bg-violet-500/5 border border-violet-500/10 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <stat.icon className="w-3.5 h-3.5 text-violet-400/60" />
                    <span className="text-[10px] font-medium text-violet-300/50 uppercase tracking-wider">
                      {stat.label}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-violet-100">{stat.value}</div>
                </div>
              ))
          )}
        </div>

        <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl overflow-hidden">
          {error ? (
            <div className="p-8 text-center text-red-300 text-sm">
              <AlertTriangle className="w-5 h-5 inline mr-2" />
              {error instanceof Error ? error.message : 'Failed to load matters'}
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-violet-500/10 bg-violet-500/5">
                  <th className="px-4 py-3 text-[10px] font-semibold text-violet-300/50 uppercase tracking-wider">
                    Matter Name
                  </th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-violet-300/50 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-violet-300/50 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-violet-300/50 uppercase tracking-wider">
                    Next Deadline
                  </th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-violet-300/50 uppercase tracking-wider">
                    Lead Counsel
                  </th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-violet-300/50 uppercase tracking-wider text-right">
                    Exposure
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-500/5">
                {isLoading ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : matters.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-violet-400/40 text-sm">
                      <Briefcase className="w-6 h-6 mx-auto mb-3 opacity-30" />
                      No matters found. Create your first matter to get started.
                    </td>
                  </tr>
                ) : (
                  matters.map((m) => (
                    <tr key={m.id} className="hover:bg-violet-500/5 transition-colors group">
                      <td className="px-4 py-4">
                        <div className="text-xs font-medium text-violet-100">{m.name}</div>
                        <div className="text-[10px] text-violet-400/50 mt-0.5 truncate max-w-[200px]">
                          {m.matterNumber} · {m.clientName}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-medium border',
                            STATUS_COLORS[m.status] ??
                              'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
                          )}
                        >
                          {m.status.replace(/-/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-violet-300/70 capitalize">
                        {m.type.replace(/-/g, ' ')}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-violet-300/70">
                          <Clock className="w-3 h-3" />
                          {new Date(m.nextDeadline).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-violet-300/70">{m.leadCounsel}</td>
                      <td className="px-4 py-4 text-right text-xs font-bold text-violet-100">
                        {m.estimatedExposure
                          ? `$${(m.estimatedExposure / 1_000_000).toFixed(1)}M`
                          : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
