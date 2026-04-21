import { StatusBadge as DSStatusBadge, type StatusVariant, color as dsColor } from '@szl-holdings/design-system';
import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, m } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Circle,
  Clock,
  Database,
  FileSearch,
  Globe,
  Loader2,
  Map,
  RefreshCw,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const API = '/api';

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
    ...opts,
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const json = await res.json();
  return (json.data ?? json) as T;
}

interface CertProgram {
  id: number;
  slug: string;
  name: string;
  shortName?: string;
  programType: string;
  description?: string;
  requiresAttorneyReview: boolean;
  requiresCpaReview: boolean;
  status?: CertStatus | null;
  openTasks?: number;
  completedTasks?: number;
  totalTasks?: number;
}
interface CertStatus {
  id: number;
  programId: number;
  overallStatus: string;
  readinessScore: number;
  appliedAt?: string;
  approvedAt?: string;
  expiresAt?: string;
  notes?: string;
}
interface CertTask {
  id: number;
  programId: number;
  title: string;
  description?: string;
  taskType: string;
  priority: string;
  status: string;
  dueDate?: string;
  flagsReview: boolean;
  reviewType?: string;
  notes?: string;
}
interface CertRequirement {
  id: number;
  title: string;
  description?: string;
  category: string;
  isRequired: boolean;
  requiresReview: boolean;
  reviewType: string;
}
interface OwnershipScenario {
  id: number;
  scenarioName: string;
  description?: string;
  requiresAttorneyReview: boolean;
  requiresCpaReview: boolean;
  status: string;
  legalDisclaimerAcknowledged: boolean;
  flaggedIssues?: unknown;
  programEligibilityJson?: unknown;
}
interface Opportunity {
  id: number;
  title: string;
  opportunityType: string;
  source: string;
  agencyName?: string;
  estimatedValue?: string;
  dueDate?: string;
  status: string;
  fitScore?: number;
  naicsCodes?: unknown;
  setAsideType?: string;
  requiredCertifications?: unknown;
}
interface CalendarEvent {
  id: number;
  programId?: number;
  title: string;
  eventType: string;
  eventDate: string;
  status: string;
  reminderDays: number;
  notes?: string;
}
interface CertDashboard {
  programs: CertProgram[];
  upcomingDeadlines: CalendarEvent[];
  overdueTasks: CertTask[];
  trackingOpportunities: number;
  totalOpenTasks: number;
  flaggedForReview: number;
}

const STATUS_COLORS: Record<string, string> = {
  not_started: dsColor.accent.slate,
  assessing: dsColor.accent.amber,
  preparing: dsColor.accent.blue,
  applied: dsColor.accent.violet,
  in_review: dsColor.accent.violet,
  approved: dsColor.accent.green,
  denied: dsColor.accent.red,
  renewal_due: dsColor.accent.amber,
  expired: dsColor.accent.red,
  withdrawn: dsColor.accent.slate,
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: dsColor.accent.red,
  high: dsColor.accent.amber,
  medium: dsColor.accent.amber,
  low: dsColor.accent.slate,
};

const PROGRAM_COLORS: Record<string, string> = {
  'ny-mwbe': '#c9a96e',
  'ny-wbe': '#d4a85a',
  'federal-wosb': '#3b82f6',
  'federal-edwosb': '#2563eb',
  'vosb-sdvosb': '#10b981',
  'sba-8a': '#8b5cf6',
  'sam-registration': '#06b6d4',
};

const CERT_STATUS_VARIANT: Record<string, StatusVariant> = {
  not_started: 'neutral', withdrawn: 'neutral',
  assessing: 'warning', renewal_due: 'warning',
  preparing: 'info', applied: 'pending', in_review: 'pending',
  approved: 'approved',
  denied: 'error', expired: 'error',
};
function StatusBadge({ status }: { status: string }) {
  return <DSStatusBadge variant={CERT_STATUS_VARIANT[status] ?? 'neutral'} label={status.replace(/_/g, ' ')} />;
}

function TaskRow({ task }: { task: CertTask }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const priorityColor = PRIORITY_COLORS[task.priority] ?? '#6b7280';
  const statusIcon =
    task.status === 'complete' ? (
      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
    ) : task.status === 'in_progress' ? (
      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
    ) : task.status === 'blocked' ? (
      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
    ) : (
      <Circle className="w-4 h-4 text-border shrink-0" />
    );

  const mut = useStandardMutation({
    mutationFn: (status: string) =>
      apiFetch(`/certification/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cert-tasks'] }),
  });

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'complete';

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden',
        isOverdue ? 'border-red-500/30' : 'border-border',
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/20 transition-colors"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            const next =
              task.status === 'open'
                ? 'in_progress'
                : task.status === 'in_progress'
                  ? 'complete'
                  : 'open';
            mut.mutate(next);
          }}
        >
          {statusIcon}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                'text-xs font-medium',
                task.status === 'complete'
                  ? 'line-through text-muted-foreground'
                  : 'text-foreground',
              )}
            >
              {task.title}
            </p>
            {task.flagsReview && <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />}
          </div>
          {task.dueDate && (
            <p
              className={cn(
                'text-[10px] mt-0.5',
                isOverdue ? 'text-red-500' : 'text-muted-foreground',
              )}
            >
              Due: {new Date(task.dueDate).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: `${priorityColor}18`, color: priorityColor }}
          >
            {task.priority}
          </span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 space-y-2 bg-muted/10 border-t border-border">
              {task.description && (
                <p className="text-xs text-muted-foreground">{task.description}</p>
              )}
              {task.flagsReview && (
                <div className="flex items-start gap-1.5 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-600">
                    Requires {task.reviewType ?? 'professional'} review before proceeding. Not a
                    legal or financial conclusion.
                  </p>
                </div>
              )}
              {task.notes && (
                <p className="text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1.5">
                  {task.notes}
                </p>
              )}
              <div className="flex gap-2">
                {['open', 'in_progress', 'blocked', 'complete', 'na'].map((s) => (
                  <button
                    key={s}
                    onClick={() => mut.mutate(s)}
                    className={cn(
                      'text-[10px] px-2 py-1 rounded transition-colors',
                      task.status === s
                        ? 'bg-primary text-white'
                        : 'bg-card border border-border text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProgramCard({ program, onSelect }: { program: CertProgram; onSelect: () => void }) {
  const accentColor = PROGRAM_COLORS[program.slug] ?? '#6b7280';
  const statusColor = STATUS_COLORS[program.status?.overallStatus ?? 'not_started'] ?? '#6b7280';
  const score = program.status?.readinessScore ?? 0;

  return (
    <button
      onClick={onSelect}
      className="w-full text-left bg-card border border-border rounded-xl p-4 hover:bg-muted/20 transition-colors space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: accentColor }} />
            <p className="text-sm font-semibold text-foreground">{program.name}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{program.description}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <StatusBadge status={program.status?.overallStatus ?? 'not_started'} />
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Readiness</span>
          <span className="text-xs font-semibold" style={{ color: statusColor }}>
            {score}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${score}%`, background: accentColor }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {program.requiresAttorneyReview && (
          <span className="text-[10px] flex items-center gap-1 text-amber-600">
            <AlertTriangle className="w-3 h-3" /> Attorney Review
          </span>
        )}
        {program.requiresCpaReview && (
          <span className="text-[10px] flex items-center gap-1 text-amber-600">
            <AlertTriangle className="w-3 h-3" /> CPA Review
          </span>
        )}
        {program.totalTasks != null && program.totalTasks > 0 && (
          <span className="text-[10px] text-muted-foreground ml-auto">
            {program.completedTasks}/{program.totalTasks} tasks
          </span>
        )}
      </div>
    </button>
  );
}

function ProgramDetail({ program }: { program: CertProgram }) {
  const { data: detail } = useStandardQuery<
    CertProgram & { requirements: CertRequirement[]; tasks: CertTask[] }
  >({
    queryKey: ['cert-program-detail', program.id],
    queryFn: () => apiFetch(`/certification/programs/${program.id}`),
  });

  const qc = useQueryClient();
  const updateStatus = useStandardMutation({
    mutationFn: ({ status }: { status: string }) =>
      apiFetch(`/certification/status/${program.status?.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ overallStatus: status }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cert-dashboard'] });
      qc.invalidateQueries({ queryKey: ['cert-program-detail', program.id] });
    },
  });

  const [tab, setTab] = useState<'requirements' | 'tasks'>('requirements');
  const accentColor = PROGRAM_COLORS[program.slug] ?? '#6b7280';

  const STATUS_OPTIONS = [
    'not_started',
    'assessing',
    'preparing',
    'applied',
    'in_review',
    'approved',
    'denied',
    'renewal_due',
    'withdrawn',
  ];

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-foreground">{program.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{program.description}</p>
          </div>
          <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: accentColor }} />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Status:</span>
          <select
            value={program.status?.overallStatus ?? 'not_started'}
            onChange={(e) => program.status?.id && updateStatus.mutate({ status: e.target.value })}
            className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          {updateStatus.isPending && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
          )}
        </div>

        {(program.requiresAttorneyReview || program.requiresCpaReview) && (
          <div className="mt-3 flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-600">
              This program requires{' '}
              {[program.requiresAttorneyReview && 'attorney', program.requiresCpaReview && 'CPA']
                .filter(Boolean)
                .join(' and ')}{' '}
              review. Flagged items require professional consultation — this module does not
              auto-conclude eligibility.
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-1">
        {(['requirements', 'tasks'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              tab === t
                ? 'bg-primary text-white'
                : 'bg-card border border-border text-muted-foreground',
            )}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'requirements' && (
        <div className="space-y-2">
          {(detail?.requirements ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No requirements configured.
            </p>
          ) : (
            (detail?.requirements ?? []).map((req) => (
              <div key={req.id} className="bg-card border border-border rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-foreground">{req.title}</p>
                      {req.requiresReview && (
                        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                      )}
                    </div>
                    {req.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{req.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded">
                        {req.category}
                      </span>
                      {req.isRequired && (
                        <span className="text-[10px] text-muted-foreground">Required</span>
                      )}
                      {req.requiresReview && (
                        <span className="text-[10px] text-amber-600">
                          {req.reviewType} review required
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'tasks' && (
        <div className="space-y-2">
          {(detail?.tasks ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No tasks configured.</p>
          ) : (
            (detail?.tasks ?? []).map((task) => <TaskRow key={task.id} task={task} />)
          )}
        </div>
      )}
    </div>
  );
}

function OwnershipScenarioPlanner() {
  const { data: scenarios = [], isLoading } = useStandardQuery<OwnershipScenario[]>({
    queryKey: ['ownership-scenarios'],
    queryFn: () => apiFetch('/certification/ownership-scenarios'),
  });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground">
          Ownership / Control Scenario Planner
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Internal decision matrix for evaluating how ownership structures affect certification
          eligibility. Does not auto-conclude legal eligibility.
        </p>
      </div>

      <div className="bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">
            Legal Disclaimer: Ownership and control analysis for certification eligibility is a
            legal determination. This planner is for internal decision support only. All scenarios
            flagged for review require consultation with qualified legal counsel before any
            certification application is submitted.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Loading scenarios...</span>
        </div>
      ) : scenarios.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <Map className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No ownership scenarios yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Ownership scenarios are added via the API or admin panel when evaluating certification
            eligibility.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {scenarios.map((s) => (
            <div key={s.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{s.scenarioName}</p>
                  {s.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                  )}
                </div>
                <span
                  className={cn(
                    'text-[10px] font-mono px-2 py-0.5 rounded shrink-0',
                    s.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {s.status}
                </span>
              </div>
              {(s.requiresAttorneyReview || s.requiresCpaReview) && (
                <div className="flex items-center gap-2">
                  {s.requiresAttorneyReview && (
                    <span className="text-[10px] flex items-center gap-1 text-amber-600 bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1">
                      <AlertTriangle className="w-3 h-3" />
                      Attorney review required
                    </span>
                  )}
                  {s.requiresCpaReview && (
                    <span className="text-[10px] flex items-center gap-1 text-amber-600 bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1">
                      <AlertTriangle className="w-3 h-3" />
                      CPA review required
                    </span>
                  )}
                </div>
              )}
              {!s.legalDisclaimerAcknowledged && (
                <p className="text-[10px] text-red-500">Legal disclaimer not yet acknowledged</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OpportunityTracker() {
  const { data: opportunities = [], isLoading } = useStandardQuery<Opportunity[]>({
    queryKey: ['cert-opportunities'],
    queryFn: () => apiFetch('/certification/opportunities'),
  });
  const [filter, setFilter] = useState('all');

  const statusColors: Record<string, string> = {
    tracking: '#3b82f6',
    qualifying: '#f59e0b',
    pursuing: '#8b5cf6',
    submitted: '#6366f1',
    awarded: '#10b981',
    lost: '#ef4444',
    no_bid: '#6b7280',
  };

  const filtered =
    filter === 'all' ? opportunities : opportunities.filter((o) => o.status === filter);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Procurement Opportunity Tracker</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          NY state and federal procurement opportunities with fit scores
        </p>
      </div>

      <div className="flex gap-1 flex-wrap">
        {['all', 'tracking', 'qualifying', 'pursuing', 'submitted'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
              filter === s
                ? 'bg-primary text-white'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <Globe className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No opportunities tracked</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add procurement opportunities to track fit and deadlines.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((opp) => {
            const color = statusColors[opp.status] ?? '#6b7280';
            const isOverdue = opp.dueDate && new Date(opp.dueDate) < new Date();
            return (
              <div
                key={opp.id}
                className={cn(
                  'bg-card border rounded-xl p-4',
                  isOverdue ? 'border-red-500/30' : 'border-border',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{opp.title}</p>
                    {opp.agencyName && (
                      <p className="text-xs text-muted-foreground mt-0.5">{opp.agencyName}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
                        {opp.source.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      {opp.setAsideType && (
                        <span className="text-[10px] text-muted-foreground">
                          {opp.setAsideType}
                        </span>
                      )}
                      {opp.estimatedValue && (
                        <span className="text-[10px] text-muted-foreground">
                          {opp.estimatedValue}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded"
                      style={{ background: `${color}18`, color }}
                    >
                      {opp.status}
                    </span>
                    {opp.fitScore != null && (
                      <span className="text-xs font-semibold" style={{ color }}>
                        Fit: {opp.fitScore}/10
                      </span>
                    )}
                  </div>
                </div>
                {opp.dueDate && (
                  <p
                    className={cn(
                      'text-xs mt-2',
                      isOverdue ? 'text-red-500' : 'text-muted-foreground',
                    )}
                  >
                    Due: {new Date(opp.dueDate).toLocaleDateString()} {isOverdue ? '(OVERDUE)' : ''}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface NaicsCode {
  id: number;
  naicsCode: string;
  title: string;
  description?: string;
  businessLine?: string;
  isSetAsideEligible: boolean;
  notes?: string;
}

interface LegalReview {
  id: number;
  programId?: number;
  taskId?: number;
  title: string;
  description?: string;
  reviewType: string;
  status: string;
  isMandatory: boolean;
  reviewerName?: string;
  scheduledAt?: string;
  completedAt?: string;
  legalDisclaimerAcknowledged: boolean;
  outcomeNotes?: string;
}

function NaicsView() {
  const { data: naics = [], isLoading } = useStandardQuery<NaicsCode[]>({
    queryKey: ['cert-naics'],
    queryFn: () => apiFetch('/certification/naics'),
  });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground">NAICS Code Mapping</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          SZL business lines mapped to federal procurement NAICS codes.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : naics.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <Database className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-foreground">No NAICS codes yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Seed certification data to populate NAICS codes.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {naics.map((n) => (
            <div key={n.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-primary">{n.naicsCode}</span>
                    <span className="text-sm font-medium text-foreground">{n.title}</span>
                  </div>
                  {n.businessLine && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Business line: {n.businessLine}
                    </p>
                  )}
                  {n.notes && <p className="text-xs text-muted-foreground mt-1">{n.notes}</p>}
                </div>
                {n.isSetAsideEligible && (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded shrink-0">
                    Set-aside eligible
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LegalReviewsView() {
  const { data: reviews = [], isLoading } = useStandardQuery<LegalReview[]>({
    queryKey: ['cert-legal-reviews'],
    queryFn: () => apiFetch('/certification/legal-reviews'),
  });

  const statusColors: Record<string, string> = {
    pending: dsColor.accent.amber,
    scheduled: dsColor.accent.blue,
    in_review: dsColor.accent.violet,
    complete: dsColor.accent.green,
    waived: dsColor.accent.slate,
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Legal Review Checkpoints</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Attorney and CPA review requirements before certification submissions.
        </p>
      </div>

      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            This module tracks review requirements only. It does not provide legal advice or
            conclusions. All items marked "attorney review required" must be reviewed by qualified
            legal counsel before any certification application is submitted.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-foreground">No legal review checkpoints</p>
          <p className="text-xs text-muted-foreground mt-1">
            Legal review items are added when certification tasks require professional review.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => {
            const color = statusColors[r.status] ?? '#6b7280';
            return (
              <div key={r.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{r.title}</p>
                      {r.isMandatory && (
                        <span className="text-[10px] bg-red-500/10 text-red-600 border border-red-500/20 rounded px-1.5 py-0.5">
                          Mandatory
                        </span>
                      )}
                    </div>
                    {r.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-mono bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded">
                        {r.reviewType} review
                      </span>
                      {r.reviewerName && (
                        <span className="text-[10px] text-muted-foreground">
                          Reviewer: {r.reviewerName}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded shrink-0"
                    style={{ background: `${color}18`, color }}
                  >
                    {r.status}
                  </span>
                </div>
                {!r.legalDisclaimerAcknowledged && (
                  <p className="text-[10px] text-red-500 mt-2">
                    Legal disclaimer not yet acknowledged
                  </p>
                )}
                {r.outcomeNotes && (
                  <p className="text-xs text-muted-foreground mt-2 bg-muted/30 rounded px-2 py-1.5">
                    {r.outcomeNotes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface MomLedRequirement {
  id: number;
  requirementKey: string;
  title: string;
  description?: string;
  category: string;
  isRequired: boolean;
  reviewType: string;
  status: 'met' | 'unmet' | 'check' | 'legal_review';
  note: string;
}
interface MomLedProgramReadiness {
  programId: number;
  slug: string;
  name: string;
  shortName?: string;
  programType: string;
  requiresAttorneyReview: boolean;
  requiresCpaReview: boolean;
  isSecondaryOnly: boolean;
  requiresLegalReview: boolean;
  requirementCount: number;
  gapCount: number;
  legalItemCount: number;
  checkItemCount: number;
  metItemCount: number;
  requirements: MomLedRequirement[];
}
interface MomLedReadinessData {
  preferredScenario: {
    id: number;
    scenarioName: string;
    description?: string;
    status: string;
  } | null;
  programReadiness: MomLedProgramReadiness[];
}

function MomLedSummary() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const { data, isLoading, isError } = useStandardQuery<MomLedReadinessData>({
    queryKey: ['cert-mom-led-readiness'],
    queryFn: () => apiFetch('/certification/mom-led-readiness'),
  });

  const priorityOrder = [
    'sam-registration',
    'ny-mwbe',
    'ny-wbe',
    'federal-wosb',
    'federal-edwosb',
    'sba-8a',
    'vosb-sdvosb',
  ];
  const sorted = [...(data?.programReadiness ?? [])].sort((a, b) => {
    const ai = priorityOrder.indexOf(a.slug);
    const bi = priorityOrder.indexOf(b.slug);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">Loading readiness data...</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
        <p className="text-xs text-red-600">
          Failed to load mom-led readiness. Ensure programs are seeded and you have access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Mom-Led Eligibility Readiness</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Per-program readiness evaluation derived from stored requirements and the preferred
          ownership scenario.
          {data.preferredScenario ? (
            <>
              {' '}
              Active scenario:{' '}
              <span className="font-medium">{data.preferredScenario.scenarioName}</span>.
            </>
          ) : (
            <>
              {' '}
              No preferred ownership scenario set — add one in the Ownership tab to improve
              accuracy.
            </>
          )}
        </p>
      </div>

      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Internal decision support only. "Check" items require verification. "Legal review" items
            require attorney consultation before any application. No certification eligibility is
            determined or claimed here.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {sorted.map((program) => {
          const isExpanded = selectedSlug === program.slug;
          const accentColor = PROGRAM_COLORS[program.slug] ?? '#6b7280';

          return (
            <div
              key={program.programId}
              className={cn(
                'bg-card border rounded-xl overflow-hidden',
                program.isSecondaryOnly ? 'border-muted opacity-70' : 'border-border',
              )}
            >
              <button
                onClick={() => setSelectedSlug(isExpanded ? null : program.slug)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: accentColor }}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {program.shortName ?? program.name}
                    </p>
                    {program.isSecondaryOnly && (
                      <p className="text-[10px] text-muted-foreground">
                        Secondary / separate entity only
                      </p>
                    )}
                    {program.requiresLegalReview && !program.isSecondaryOnly && (
                      <p className="text-[10px] text-amber-600">Attorney review required</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {program.metItemCount > 0 && (
                    <span className="text-[10px] text-emerald-600">{program.metItemCount} met</span>
                  )}
                  {program.gapCount > 0 && (
                    <span className="text-[10px] text-red-500">
                      {program.gapCount} gap{program.gapCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {program.legalItemCount > 0 && (
                    <span className="text-[10px] text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Legal
                    </span>
                  )}
                  {program.checkItemCount > 0 && (
                    <span className="text-[10px] text-blue-500">
                      {program.checkItemCount} to verify
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <m.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2 border-t border-border bg-muted/5">
                      {program.requirements.length === 0 ? (
                        <p className="text-xs text-muted-foreground pt-3">
                          No requirements loaded for this program. Run seed to populate.
                        </p>
                      ) : (
                        program.requirements.map((req) => (
                          <div key={req.id} className="flex items-start gap-2 pt-2">
                            {req.status === 'met' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            ) : req.status === 'unmet' ? (
                              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            ) : req.status === 'legal_review' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-foreground">{req.title}</p>
                              <p className="text-[10px] text-muted-foreground">{req.note}</p>
                              {req.description && req.description !== req.title && (
                                <p className="text-[10px] text-muted-foreground/70 mt-0.5 italic">
                                  {req.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type CertTab =
  | 'dashboard'
  | 'programs'
  | 'mom-led'
  | 'ownership'
  | 'calendar'
  | 'opportunities'
  | 'naics'
  | 'legal-reviews';

export function CertificationReadinessOS() {
  const [activeTab, setActiveTab] = useState<CertTab>('dashboard');
  const [selectedProgram, setSelectedProgram] = useState<CertProgram | null>(null);
  const qc = useQueryClient();

  const { data: dashboard, isLoading: dashLoading } = useStandardQuery<CertDashboard>({
    queryKey: ['cert-dashboard'],
    queryFn: () => apiFetch('/certification/dashboard'),
  });

  const { data: calendar = [] } = useStandardQuery<CalendarEvent[]>({
    queryKey: ['cert-calendar'],
    queryFn: () => apiFetch('/certification/calendar'),
    enabled: activeTab === 'calendar',
  });

  const seedMut = useStandardMutation({
    mutationFn: () => apiFetch('/certification/seed', { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cert-dashboard'] });
      qc.invalidateQueries({ queryKey: ['cert-naics'] });
    },
  });

  const hasPrograms = (dashboard?.programs?.length ?? 0) > 0;

  const TABS: { id: CertTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Shield },
    { id: 'programs', label: 'Programs', icon: CheckSquare },
    { id: 'mom-led', label: 'Mom-Led Summary', icon: Users },
    { id: 'ownership', label: 'Ownership', icon: Map },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'opportunities', label: 'Opportunities', icon: Globe },
    { id: 'naics', label: 'NAICS', icon: Database },
    { id: 'legal-reviews', label: 'Legal Reviews', icon: BookOpen },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Certification & Procurement Readiness OS
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            NY MWBE, WOSB/EDWOSB, VOSB/SDVOSB, 8(a), SAM — readiness and decision support only.
          </p>
        </div>
        {!hasPrograms && (
          <button
            onClick={() => seedMut.mutate()}
            disabled={seedMut.isPending}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-60 shrink-0 transition-colors"
          >
            {seedMut.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {seedMut.isPending ? 'Seeding...' : 'Seed Programs'}
          </button>
        )}
      </div>

      {seedMut.isSuccess && !hasPrograms && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3">
          <p className="text-xs text-emerald-600">
            Certification programs seeded successfully. Refresh to see all programs.
          </p>
        </div>
      )}

      <div className="flex gap-1 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSelectedProgram(null);
            }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground',
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-5">
          {dashLoading ? (
            <div className="flex items-center gap-2 py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : !hasPrograms ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">
                No certification programs loaded
              </p>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-xs mx-auto">
                Click "Seed Programs" above to load real data for NY MWBE, WOSB/EDWOSB, SAM, 8(a),
                and more.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Open Tasks', value: dashboard?.totalOpenTasks ?? 0, color: '#3b82f6' },
                  {
                    label: 'Flagged for Review',
                    value: dashboard?.flaggedForReview ?? 0,
                    color: '#f59e0b',
                  },
                  {
                    label: 'Tracking Opps',
                    value: dashboard?.trackingOpportunities ?? 0,
                    color: '#10b981',
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="bg-card border border-border rounded-xl p-3 text-center"
                  >
                    <p className="text-2xl font-bold" style={{ color: m.color }}>
                      {m.value}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{m.label}</p>
                  </div>
                ))}
              </div>

              {(dashboard?.overdueTasks ?? []).length > 0 && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Overdue Tasks (
                    {dashboard!.overdueTasks.length})
                  </p>
                  <div className="space-y-1.5">
                    {dashboard!.overdueTasks.slice(0, 3).map((t) => (
                      <p key={t.id} className="text-xs text-foreground">
                        {t.title}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Certification Programs
                </p>
                {(dashboard?.programs ?? []).map((p) => (
                  <ProgramCard
                    key={p.id}
                    program={p}
                    onSelect={() => {
                      setSelectedProgram(p);
                      setActiveTab('programs');
                    }}
                  />
                ))}
              </div>

              {(dashboard?.upcomingDeadlines ?? []).length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Upcoming Deadlines
                  </p>
                  <div className="space-y-2.5">
                    {dashboard!.upcomingDeadlines.map((e) => (
                      <div key={e.id} className="flex items-center gap-3">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{e.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(e.eventDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'programs' && (
        <div className="space-y-4">
          {selectedProgram ? (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedProgram(null)}
                className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
              >
                ← Back to programs
              </button>
              <ProgramDetail program={selectedProgram} />
            </div>
          ) : (
            <div className="space-y-3">
              {(dashboard?.programs ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No programs yet. Use "Seed Programs" to load data.
                </p>
              ) : (
                (dashboard?.programs ?? []).map((p) => (
                  <ProgramCard key={p.id} program={p} onSelect={() => setSelectedProgram(p)} />
                ))
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'mom-led' && <MomLedSummary />}

      {activeTab === 'ownership' && <OwnershipScenarioPlanner />}

      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-foreground">Certification Calendar</p>
          {calendar.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-foreground">No calendar events yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add renewal and deadline events to track important dates.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {calendar.map((e) => {
                const isPast = new Date(e.eventDate) < new Date();
                return (
                  <div
                    key={e.id}
                    className={cn(
                      'bg-card border rounded-xl p-4 flex items-start gap-3',
                      isPast ? 'border-red-500/20' : 'border-border',
                    )}
                  >
                    <Calendar
                      className={cn(
                        'w-4 h-4 shrink-0 mt-0.5',
                        isPast ? 'text-red-500' : 'text-muted-foreground',
                      )}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{e.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(e.eventDate).toLocaleDateString()} ·{' '}
                        {e.eventType.replace(/_/g, ' ')}
                      </p>
                      {e.notes && <p className="text-xs text-muted-foreground mt-1">{e.notes}</p>}
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-mono px-2 py-0.5 rounded shrink-0',
                        e.status === 'complete'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : e.status === 'overdue' || isPast
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-primary/10 text-primary',
                      )}
                    >
                      {e.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'opportunities' && <OpportunityTracker />}
      {activeTab === 'naics' && <NaicsView />}
      {activeTab === 'legal-reviews' && <LegalReviewsView />}
    </div>
  );
}
