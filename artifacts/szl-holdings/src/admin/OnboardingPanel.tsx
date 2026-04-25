import { useStandardQuery } from '@szl-holdings/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { apiFetch } from './api';

// ─── Onboarding Status Panel ──────────────────────────────────────────────────

interface OnboardingRow {
  orgId: number;
  orgName: string;
  orgSlug: string;
  plan: string;
  orgStatus: string;
  createdAt: string;
  onboarding: {
    status: 'complete' | 'in_progress' | 'not_started';
    progress: number;
    completedSteps: string[];
    currentStep: string;
    completedAt: string | null;
    lastUpdatedAt: string | null;
    totalSteps: number;
  };
}

interface OnboardingStatusData {
  totals: {
    orgs: number;
    complete: number;
    inProgress: number;
    notStarted: number;
  };
  rows: OnboardingRow[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All orgs' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'not_started', label: 'Not started' },
  { value: 'complete', label: 'Complete' },
] as const;

const STEP_LABELS: Record<string, string> = {
  profile: 'Organization Profile',
  team: 'Invite Team',
  notifications: 'Notifications',
  integrations: 'Integrations',
  complete: 'Complete',
};

function OnboardingBadge({ status }: { status: OnboardingRow['onboarding']['status'] }) {
  if (status === 'complete') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
        <CheckCircle2 className="w-3 h-3" /> Complete
      </span>
    );
  }
  if (status === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
        <Clock className="w-3 h-3" /> In progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border">
      <AlertCircle className="w-3 h-3" /> Not started
    </span>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            progress === 100
              ? 'bg-emerald-500'
              : progress > 0
                ? 'bg-amber-500'
                : 'bg-muted-foreground/20',
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">
        {progress}%
      </span>
    </div>
  );
}

function OnboardingPanel() {
  const [statusFilter, setStatusFilter] = useState('');
  const [orgSearch, setOrgSearch] = useState('');
  const [expandedOrg, setExpandedOrg] = useState<number | null>(null);
  const qc = useQueryClient();

  const queryParams = new URLSearchParams();
  if (statusFilter) queryParams.set('status', statusFilter);
  if (orgSearch) queryParams.set('org', orgSearch);
  queryParams.set('limit', '200');

  const queryString = queryParams.toString();

  const { data, isLoading, error } = useStandardQuery<OnboardingStatusData>({
    queryKey: ['admin-onboarding-status', statusFilter, orgSearch],
    queryFn: () =>
      apiFetch<OnboardingStatusData>(
        `/admin/onboarding-status${queryString ? `?${queryString}` : ''}`,
      ),
  });

  const rows = data?.rows ?? [];
  const totals = data?.totals;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" /> Onboarding Status
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track which organizations have completed setup and which are still mid-onboarding.
          </p>
        </div>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ['admin-onboarding-status'] })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {totals && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Total orgs',
              value: totals.orgs,
              color: 'text-foreground',
              bg: 'bg-card',
            },
            {
              label: 'Complete',
              value: totals.complete,
              color: 'text-emerald-600',
              bg: 'bg-emerald-500/5',
            },
            {
              label: 'In progress',
              value: totals.inProgress,
              color: 'text-amber-600',
              bg: 'bg-amber-500/5',
            },
            {
              label: 'Not started',
              value: totals.notStarted,
              color: 'text-muted-foreground',
              bg: 'bg-muted/30',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={cn(
                'rounded-xl border border-border px-4 py-3',
                stat.bg,
              )}
            >
              <div className={cn('text-2xl font-bold tabular-nums', stat.color)}>
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by org name or slug…"
          value={orgSearch}
          onChange={(e) => setOrgSearch(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading onboarding data…
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" /> Failed to load onboarding status. Ensure
          you have admin access.
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium text-foreground">No organizations found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {statusFilter || orgSearch
              ? 'Try adjusting the search or filter.'
              : 'No organizations have been provisioned yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.orgId}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => setExpandedOrg(expandedOrg === row.orgId ? null : row.orgId)}
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground truncate">
                      {row.orgName}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {row.orgSlug}
                    </span>
                    <OnboardingBadge status={row.onboarding.status} />
                  </div>
                  <div className="mt-1.5 max-w-xs">
                    <ProgressBar progress={row.onboarding.progress} />
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-[10px] font-medium text-muted-foreground capitalize hidden sm:block">
                    {row.plan}
                  </span>
                  {expandedOrg === row.orgId ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {expandedOrg === row.orgId && (
                <div className="border-t border-border/50 px-4 py-4 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="text-muted-foreground">Current step</div>
                      <div className="font-medium text-foreground mt-0.5 capitalize">
                        {STEP_LABELS[row.onboarding.currentStep] ?? row.onboarding.currentStep}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Steps done</div>
                      <div className="font-medium text-foreground mt-0.5">
                        {row.onboarding.completedSteps.length} / {row.onboarding.totalSteps}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Completed at</div>
                      <div className="font-medium text-foreground mt-0.5">
                        {row.onboarding.completedAt
                          ? new Date(row.onboarding.completedAt).toLocaleDateString()
                          : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Last activity</div>
                      <div className="font-medium text-foreground mt-0.5">
                        {row.onboarding.lastUpdatedAt
                          ? new Date(row.onboarding.lastUpdatedAt).toLocaleDateString()
                          : '—'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Step breakdown</div>
                    <div className="flex flex-wrap gap-1.5">
                      {['profile', 'team', 'notifications', 'integrations'].map((step) => {
                        const done = row.onboarding.completedSteps.includes(step);
                        const isCurrent = row.onboarding.currentStep === step && !done;
                        return (
                          <span
                            key={step}
                            className={cn(
                              'inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border',
                              done
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : isCurrent
                                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                  : 'bg-muted/40 text-muted-foreground border-border',
                            )}
                          >
                            {done ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : isCurrent ? (
                              <Clock className="w-3 h-3" />
                            ) : null}
                            {STEP_LABELS[step]}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Org created:{' '}
                    <span className="text-foreground font-medium">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </span>
                    {' · '}
                    Plan:{' '}
                    <span className="text-foreground font-medium capitalize">{row.plan}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {data?.pagination.hasMore && (
        <p className="text-center text-xs text-muted-foreground">
          Showing {rows.length} of {data.pagination.total} organizations.
        </p>
      )}
    </div>
  );
}

export { OnboardingPanel };
