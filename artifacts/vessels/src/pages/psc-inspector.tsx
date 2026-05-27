import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MapPin,
  Shield,
  Ship,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { LiveDataBadge } from '../lib/live-badge';

// ── Types matching the API responses ────────────────────────────────────────

type Result = 'passed' | 'deficiency' | 'detained';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
type ChecklistStatus = 'pass' | 'fail' | 'action_required';

interface PscProfile {
  vesselId: number;
  vessel: string;
  imo: string | null;
  flag: string | null;
  detentionRisk: number;
  detentionRiskLevel: RiskLevel;
  inspections90d: number;
  deficiencies90d: number;
  detentions12m: number;
  lastInspection: string | null;
  lastInspectionPort: string | null;
  lastInspectionResult: Result | null;
  lastInspectionRegime: string | null;
}

interface PscInspection {
  id: number;
  vesselId: number;
  port: string;
  portCountry: string | null;
  mouRegime: string;
  inspectionDate: string;
  result: Result;
  deficienciesCount: number;
  deficiencyCategories: string[];
  detained: boolean;
  detentionDays: number | null;
  inspector: string | null;
  notes: string | null;
}

interface ChecklistItem {
  id: number;
  vesselId: number;
  category: string;
  status: ChecklistStatus;
  note: string | null;
  sortOrder: number;
  updatedAt: string;
}

// ── Hooks ───────────────────────────────────────────────────────────────────

function useProfiles() {
  return useStandardQuery({
    queryKey: ['vessels', 'psc', 'profiles'],
    queryFn: () => apiFetch<PscProfile[]>('/vessels/psc/profiles'),
    refetchInterval: 60_000,
  });
}

function useInspections(vesselId: number | null) {
  return useStandardQuery({
    queryKey: ['vessels', 'psc', 'inspections', vesselId],
    queryFn: () => apiFetch<PscInspection[]>(`/vessels/${vesselId}/psc/inspections`),
    enabled: vesselId !== null,
  });
}

function useChecklist(vesselId: number | null) {
  return useStandardQuery({
    queryKey: ['vessels', 'psc', 'checklist', vesselId],
    queryFn: () => apiFetch<ChecklistItem[]>(`/vessels/${vesselId}/psc/checklist`),
    enabled: vesselId !== null,
  });
}

function useUpdateChecklist(vesselId: number | null) {
  const qc = useQueryClient();
  return useStandardMutation({
    mutationFn: ({ id, status, note }: { id: number; status?: ChecklistStatus; note?: string | null }) =>
      apiFetch<ChecklistItem>(`/vessels/psc/checklist/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, note }),
      }),
    onMutate: async ({ id, status, note }) => {
      await qc.cancelQueries({ queryKey: ['vessels', 'psc', 'checklist', vesselId] });
      const prev = qc.getQueryData<ChecklistItem[]>(['vessels', 'psc', 'checklist', vesselId]);
      qc.setQueryData<ChecklistItem[]>(
        ['vessels', 'psc', 'checklist', vesselId],
        (old) =>
          old?.map((it) =>
            it.id === id
              ? {
                  ...it,
                  status: status ?? it.status,
                  note: note !== undefined ? note : it.note,
                }
              : it,
          ) ?? old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(['vessels', 'psc', 'checklist', vesselId], ctx.prev);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vessels', 'psc', 'checklist', vesselId] });
    },
  });
}

// ── UI maps ─────────────────────────────────────────────────────────────────

const riskColor: Record<RiskLevel, string> = {
  low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const resultColor: Record<Result, string> = {
  passed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  deficiency: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  detained: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const checklistStatusIcon: Record<ChecklistStatus, typeof CheckCircle2> = {
  pass: CheckCircle2,
  fail: AlertTriangle,
  action_required: Clock,
};
const checklistStatusColor: Record<ChecklistStatus, string> = {
  pass: 'text-emerald-400',
  fail: 'text-red-400',
  action_required: 'text-amber-400',
};

const CHECKLIST_CYCLE: ChecklistStatus[] = ['pass', 'action_required', 'fail'];

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function PscInspectorPage() {
  const profilesQ = useProfiles();
  const profiles = profilesQ.data ?? [];

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tab, setTab] = useState<'risk' | 'history' | 'checklist'>('risk');

  // Auto-select the highest-risk vessel once data arrives.
  useEffect(() => {
    if (selectedId === null && profiles.length > 0) {
      setSelectedId(profiles[0].vesselId);
    }
  }, [profiles, selectedId]);

  const selected = useMemo(
    () => profiles.find((p) => p.vesselId === selectedId) ?? null,
    [profiles, selectedId],
  );

  const inspectionsQ = useInspections(selected?.vesselId ?? null);
  const checklistQ = useChecklist(selected?.vesselId ?? null);
  const updateChecklist = useUpdateChecklist(selected?.vesselId ?? null);

  const totals = useMemo(() => {
    const totalDetentions = profiles.reduce((a, v) => a + v.detentions12m, 0);
    const totalDeficiencies = profiles.reduce((a, v) => a + v.deficiencies90d, 0);
    const highRisk = profiles.filter(
      (v) => v.detentionRiskLevel === 'high' || v.detentionRiskLevel === 'critical',
    ).length;
    return { totalDetentions, totalDeficiencies, highRisk };
  }, [profiles]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-display text-xl font-bold text-[#f5f5f5] flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#c9b787]" />
            Port State Control Inspector
          </h1>
          <LiveDataBadge isLive={!profilesQ.isError} isLoading={profilesQ.isLoading} />
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-white/[0.08] bg-[#c9b787]/14 text-[#c9b787]/80 tracking-wider">
            Live DB · Paris MoU / Tokyo MoU methodology
          </span>
        </div>
        <p className="text-xs text-[#8a8a8a] mt-0.5">
          Detention risk predictor, deficiency history, and pre-inspection checklists — sourced
          from your fleet inspection records.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Vessels Tracked',
            value: profiles.length,
            color: 'text-[#d4c598]',
            icon: Ship,
          },
          {
            label: 'Detentions (12m)',
            value: totals.totalDetentions,
            color: 'text-red-400',
            icon: AlertTriangle,
          },
          {
            label: 'Deficiencies (90d)',
            value: totals.totalDeficiencies,
            color: 'text-amber-400',
            icon: FileText,
          },
          {
            label: 'High Risk Vessels',
            value: totals.highRisk,
            color: 'text-orange-400',
            icon: TrendingUp,
          },
        ].map((s) => (
          <div key={s.label} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={cn('w-3.5 h-3.5', s.color)} />
              <p className="text-[10px] text-[#6a6a6a] uppercase tracking-wider">{s.label}</p>
            </div>
            <p className={cn('text-xl font-bold font-display', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {profilesQ.isLoading && profiles.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-8 text-center">
          <Loader2 className="w-5 h-5 animate-spin text-[#c9b787] mx-auto mb-2" />
          <p className="text-xs text-[#9a9a9a]">Loading PSC fleet profile…</p>
        </div>
      ) : profilesQ.isError ? (
        <div className="bg-white/[0.02] border border-red-500/20 rounded-xl p-6 text-center">
          <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-2" />
          <p className="text-xs text-red-400">Unable to load PSC data.</p>
          <p className="text-[10px] text-[#6a6a6a] mt-1">
            {profilesQ.error instanceof Error ? profilesQ.error.message : 'Please try again.'}
          </p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-8 text-center">
          <Ship className="w-5 h-5 text-[#6a6a6a] mx-auto mb-2" />
          <p className="text-xs text-[#9a9a9a]">
            No vessels in your fleet yet. PSC inspector will populate once vessels and inspection
            records are available.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-[10px] text-[#6a6a6a] uppercase tracking-wider px-1">
              Fleet PSC Risk
            </p>
            {profiles.map((v) => (
              <button
                key={v.vesselId}
                onClick={() => setSelectedId(v.vesselId)}
                className={cn(
                  'w-full text-left bg-white/[0.02] border rounded-xl p-4 transition-all',
                  selected?.vesselId === v.vesselId
                    ? 'border-[#c9b787]/24 ring-1 ring-sky-500/15'
                    : v.detentionRiskLevel === 'high' || v.detentionRiskLevel === 'critical'
                      ? 'border-orange-500/20'
                      : 'border-white/[0.06] hover:border-white/[0.08]',
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-[#f5f5f5]">{v.vessel}</p>
                    <p className="text-[10px] text-[#8a8a8a]">
                      {v.flag ?? 'Unknown flag'} · IMO {v.imo ?? '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        'text-xl font-bold font-mono',
                        v.detentionRisk >= 70
                          ? 'text-red-400'
                          : v.detentionRisk >= 40
                            ? 'text-amber-400'
                            : 'text-emerald-400',
                      )}
                    >
                      {v.detentionRisk}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn('text-[9px]', riskColor[v.detentionRiskLevel])}
                    >
                      {v.detentionRiskLevel} risk
                    </Badge>
                  </div>
                </div>
                <div className="h-1.5 bg-[#c9b787]/10 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      v.detentionRisk >= 70
                        ? 'bg-red-400'
                        : v.detentionRisk >= 40
                          ? 'bg-amber-400'
                          : 'bg-emerald-400',
                    )}
                    style={{ width: `${v.detentionRisk}%` }}
                  />
                </div>
                <div className="flex gap-3 mt-2 text-[9px] text-[#6a6a6a]">
                  <span>{v.deficiencies90d} defic. (90d)</span>
                  <span>{v.detentions12m} detentions (12m)</span>
                  <span className="ml-auto flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" />
                    {v.lastInspectionPort ?? '—'}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2 space-y-3">
            <div className="flex gap-1">
              {(['risk', 'history', 'checklist'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-lg capitalize transition-colors',
                    tab === t
                      ? 'bg-[#c9b787]/10 text-[#d4c598] border border-white/[0.08]'
                      : 'text-[#8a8a8a] hover:text-[#d4c598]',
                  )}
                >
                  {t === 'risk'
                    ? 'Risk Profile'
                    : t === 'history'
                      ? 'Inspection History'
                      : 'Pre-Inspection Checklist'}
                </button>
              ))}
            </div>

            {selected && tab === 'risk' && <RiskTab selected={selected} />}
            {selected && tab === 'history' && (
              <HistoryTab
                inspections={inspectionsQ.data ?? []}
                isLoading={inspectionsQ.isLoading}
                isError={inspectionsQ.isError}
              />
            )}
            {selected && tab === 'checklist' && (
              <ChecklistTab
                vesselName={selected.vessel}
                lastPort={selected.lastInspectionPort}
                regime={selected.lastInspectionRegime}
                items={checklistQ.data ?? []}
                isLoading={checklistQ.isLoading}
                isError={checklistQ.isError}
                onCycle={(item) => {
                  const next =
                    CHECKLIST_CYCLE[(CHECKLIST_CYCLE.indexOf(item.status) + 1) % CHECKLIST_CYCLE.length];
                  updateChecklist.mutate({ id: item.id, status: next });
                }}
                pendingId={updateChecklist.isPending ? (updateChecklist.variables?.id ?? null) : null}
              />
            )}
          </div>
        </div>
      )}

      <div className="text-[9px] text-[#5a5a5a] flex items-center gap-1">
        <BarChart3 className="w-3 h-3" />
        Risk score blends recent deficiency density, detention history, and flag-state factors.
      </div>
    </div>
  );
}

function RiskTab({ selected }: { selected: PscProfile }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-[#f5f5f5]">{selected.vessel}</p>
          <p className="text-[10px] text-[#8a8a8a]">
            {selected.flag ?? 'Unknown flag'} · IMO {selected.imo ?? '—'}
          </p>
        </div>
        <Badge variant="outline" className={cn('text-[9px]', riskColor[selected.detentionRiskLevel])}>
          {selected.detentionRiskLevel} detention risk
        </Badge>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'Detention Risk Score', value: `${selected.detentionRisk}/100` },
          { label: 'Inspections (90d)', value: selected.inspections90d },
          { label: 'Deficiencies (90d)', value: selected.deficiencies90d },
          { label: 'Detentions (12m)', value: selected.detentions12m },
          { label: 'Last Inspection', value: formatDate(selected.lastInspection) },
          { label: 'Last Regime', value: selected.lastInspectionRegime ?? '—' },
        ].map((f) => (
          <div key={f.label} className="bg-[#c9b787]/8 rounded-lg p-3 border border-white/[0.06]">
            <p className="text-[9px] text-[#6a6a6a] uppercase tracking-wider">{f.label}</p>
            <p className="text-xs font-mono text-[#e0e0e0] mt-0.5">{f.value}</p>
          </div>
        ))}
      </div>
      {selected.lastInspectionPort && (
        <div className="bg-[#c9b787]/8 rounded-lg p-3 border border-white/[0.06]">
          <p className="text-[9px] text-[#6a6a6a] uppercase tracking-wider mb-1">
            Last Port of Inspection
          </p>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#c9b787]" />
            <p className="text-sm font-semibold text-[#e0e0e0]">{selected.lastInspectionPort}</p>
            {selected.lastInspectionRegime && (
              <Badge variant="outline" className="text-[9px] text-[#8a8a8a] border-white/[0.08]">
                {selected.lastInspectionRegime}
              </Badge>
            )}
            {selected.lastInspectionResult && (
              <Badge
                variant="outline"
                className={cn('text-[9px]', resultColor[selected.lastInspectionResult])}
              >
                {selected.lastInspectionResult}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryTab({
  inspections,
  isLoading,
  isError,
}: {
  inspections: PscInspection[];
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 text-center">
        <Loader2 className="w-4 h-4 animate-spin text-[#c9b787] mx-auto" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="bg-white/[0.02] border border-red-500/20 rounded-xl p-4 text-xs text-red-400">
        Unable to load inspection history.
      </div>
    );
  }
  if (inspections.length === 0) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 text-center text-xs text-[#9a9a9a]">
        No PSC inspections recorded for this vessel.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {inspections.map((rec) => (
        <div
          key={rec.id}
          className={cn(
            'bg-white/[0.02] border rounded-xl p-4',
            rec.detained
              ? 'border-red-500/20'
              : rec.result === 'deficiency'
                ? 'border-amber-500/20'
                : 'border-white/[0.06]',
          )}
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs font-semibold text-[#e0e0e0]">
                {rec.port}
                {rec.portCountry ? `, ${rec.portCountry}` : ''}
              </p>
              <p className="text-[10px] text-[#6a6a6a]">
                {rec.mouRegime} · {formatDate(rec.inspectionDate)}
                {rec.inspector ? ` · ${rec.inspector}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn('text-[9px]', resultColor[rec.result])}>
                {rec.result}
              </Badge>
              {rec.detained && rec.detentionDays !== null && (
                <Badge
                  variant="outline"
                  className="text-[9px] text-red-400 bg-red-500/10 border-red-500/20"
                >
                  {rec.detentionDays}d detained
                </Badge>
              )}
            </div>
          </div>
          {rec.deficienciesCount > 0 && (
            <div>
              <p className="text-[9px] text-[#6a6a6a] mb-1">
                {rec.deficienciesCount} deficiency items:
              </p>
              <div className="flex flex-wrap gap-1">
                {rec.deficiencyCategories.map((cat) => (
                  <span
                    key={cat}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}
          {rec.notes && (
            <p className="text-[10px] text-[#8a8a8a] mt-2 italic">{rec.notes}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function ChecklistTab({
  vesselName,
  lastPort,
  regime,
  items,
  isLoading,
  isError,
  onCycle,
  pendingId,
}: {
  vesselName: string;
  lastPort: string | null;
  regime: string | null;
  items: ChecklistItem[];
  isLoading: boolean;
  isError: boolean;
  onCycle: (item: ChecklistItem) => void;
  pendingId: number | null;
}) {
  if (isLoading) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 text-center">
        <Loader2 className="w-4 h-4 animate-spin text-[#c9b787] mx-auto" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="bg-white/[0.02] border border-red-500/20 rounded-xl p-4 text-xs text-red-400">
        Unable to load checklist.
      </div>
    );
  }
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <p className="text-xs font-semibold text-[#e0e0e0]">
          Pre-Inspection Checklist{lastPort ? ` — Last call ${lastPort}` : ''}
          {regime ? ` (${regime})` : ''}
        </p>
        <p className="text-[10px] text-[#6a6a6a]">
          Action items for vessel {vesselName} · click status to cycle pass → action → fail
        </p>
      </div>
      {items.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-[#9a9a9a]">
          No checklist items yet.
        </div>
      ) : (
        <div className="divide-y divide-sky-500/5">
          {items.map((item) => {
            const Icon = checklistStatusIcon[item.status];
            const isPending = pendingId === item.id;
            return (
              <div
                key={item.id}
                className={cn(
                  'px-4 py-3 flex items-start gap-3',
                  item.status === 'fail'
                    ? 'bg-red-500/3'
                    : item.status === 'action_required'
                      ? 'bg-amber-500/3'
                      : '',
                )}
              >
                <Icon
                  className={cn('w-4 h-4 shrink-0 mt-0.5', checklistStatusColor[item.status])}
                />
                <div className="flex-1">
                  <p className="text-xs text-[#e0e0e0]">{item.category}</p>
                  {item.note && (
                    <p className="text-[10px] text-[#8a8a8a] mt-0.5">{item.note}</p>
                  )}
                </div>
                <button
                  onClick={() => onCycle(item)}
                  disabled={isPending}
                  className={cn(
                    'shrink-0 disabled:opacity-50 transition-opacity',
                    isPending && 'cursor-wait',
                  )}
                  title="Click to cycle status"
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[9px] cursor-pointer',
                      item.status === 'pass'
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        : item.status === 'fail'
                          ? 'text-red-400 bg-red-500/10 border-red-500/20'
                          : 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                    )}
                  >
                    {isPending ? '…' : item.status.replace('_', ' ')}
                  </Badge>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
