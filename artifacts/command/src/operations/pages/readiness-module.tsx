import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Button } from '@szl-holdings/shared-ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@szl-holdings/shared-ui/ui/card';
import { Progress } from '@szl-holdings/shared-ui/ui/progress';
import { toast } from '@szl-holdings/shared-ui/ui/sonner';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Package,
  Shield,
  User,
  XCircle,
  Zap,
} from 'lucide-react';

const ITEM_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  launch_gate: { label: 'Launch Gate', icon: Shield, color: 'text-[#d4a054]' },
  blocker: { label: 'Blocker', icon: XCircle, color: 'text-[#c45a4a]' },
  dependency: { label: 'Dependency', icon: ArrowRight, color: 'text-[#4a90b8]' },
  milestone: { label: 'Milestone', icon: CheckCircle, color: 'text-[#6b8f71]' },
  owner_check: { label: 'Owner Check', icon: User, color: 'text-[#8b7ac8]' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  not_started: {
    label: 'Not Started',
    color: 'text-zinc-400',
    bg: 'bg-zinc-500/15 border-zinc-500/30',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-[#4a90b8]',
    bg: 'bg-[#4a90b8]/15 border-[#4a90b8]/30',
  },
  blocked: { label: 'Blocked', color: 'text-[#c45a4a]', bg: 'bg-[#c45a4a]/15 border-[#c45a4a]/30' },
  complete: {
    label: 'Complete',
    color: 'text-[#6b8f71]',
    bg: 'bg-[#6b8f71]/15 border-[#6b8f71]/30',
  },
  waived: { label: 'Waived', color: 'text-zinc-400', bg: 'bg-zinc-500/10 border-zinc-500/20' },
};

const DEMO_READINESS = {
  items: [
    {
      id: 1,
      title: 'Security Review Sign-off',
      itemType: 'launch_gate',
      status: 'blocked',
      owner: 'Riley Torres',
      description: 'Awaiting infosec review of payment integration. CVE-2024-3891 flagged.',
      dueAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    },
    {
      id: 2,
      title: 'Load Testing — 10K concurrent users',
      itemType: 'launch_gate',
      status: 'in_progress',
      owner: 'Sam Park',
      description: 'Testing in progress on staging cluster. Results expected in 48h.',
      dueAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    },
    {
      id: 3,
      title: 'Legal Clearance — Data Processing Agreement',
      itemType: 'launch_gate',
      status: 'not_started',
      owner: 'Morgan Lee',
      description: 'DPA with three EU vendors not yet signed.',
      dueAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    },
    {
      id: 4,
      title: 'Customer Success Handoff Checklist',
      itemType: 'milestone',
      status: 'complete',
      owner: 'Alex Chen',
      description: 'All CS onboarding materials reviewed and approved.',
      dueAt: null,
    },
    {
      id: 5,
      title: 'Stripe Integration — PCI DSS Attestation',
      itemType: 'blocker',
      status: 'blocked',
      owner: 'Jordan Alvarez',
      description: 'PCI DSS SAQ-A must be submitted before processing live payments.',
      dueAt: new Date(Date.now() + 1 * 86400000).toISOString(),
    },
    {
      id: 6,
      title: 'Feature Flag Rollout Plan',
      itemType: 'dependency',
      status: 'complete',
      owner: 'Sam Park',
      description: 'Progressive rollout plan confirmed. Feature flags configured in admin panel.',
      dueAt: null,
    },
    {
      id: 7,
      title: 'Executive Sponsor Sign-off',
      itemType: 'owner_check',
      status: 'not_started',
      owner: 'Sarah Kim',
      description: 'Executive review of launch readiness deck pending.',
      dueAt: new Date(Date.now() + 4 * 86400000).toISOString(),
    },
    {
      id: 8,
      title: 'Runbook — Incident Response During Launch',
      itemType: 'dependency',
      status: 'in_progress',
      owner: 'Riley Torres',
      description: 'On-call runbook for launch window being finalized.',
      dueAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    },
  ],
  summary: { total: 8, complete: 2, blocked: 2, score: 25 },
};

function formatDate(isoDate: string | null): string {
  if (!isoDate) return 'No deadline';
  const d = new Date(isoDate);
  const diff = d.getTime() - Date.now();
  if (diff < 0) return 'OVERDUE';
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days}d`;
}

export default function ReadinessModulePage() {
  const queryClient = useQueryClient();

  const { data: rawData } = useStandardQuery({
    queryKey: ['lyte-readiness'],
    queryFn: () => apiFetch<typeof DEMO_READINESS>('/lyte/readiness'),
    placeholderData: DEMO_READINESS as any,
  });

  const data = rawData ?? DEMO_READINESS;
  const items = data.items ?? DEMO_READINESS.items;
  const summary = data.summary ?? DEMO_READINESS.summary;

  const updateStatus = useStandardMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiFetch(`/lyte/readiness/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: () => {
      toast.success('Readiness item updated');
      queryClient.invalidateQueries({ queryKey: ['lyte-readiness'] });
    },
    onError: () => toast.error('Failed to update item'),
  });

  const blockers = items.filter((i: any) => i.status === 'blocked');
  const gates = items.filter((i: any) => i.itemType === 'launch_gate');
  const gatesCleared = gates.filter((i: any) => i.status === 'complete').length;

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-[#d4a054]" />
            Command Readiness
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Launch gates, blockers, dependencies, and owner clarity
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#d4a054]/5 border-[#d4a054]/20">
          <CardContent className="p-4">
            <div className="text-xs text-[#d4a054] font-medium mb-1">Readiness Score</div>
            <div className="text-3xl font-bold text-[#d4a054]">{summary.score}%</div>
            <Progress value={summary.score} className="h-1 mt-2 bg-zinc-800" />
          </CardContent>
        </Card>
        <Card className="bg-[#6b8f71]/5 border-[#6b8f71]/20">
          <CardContent className="p-4">
            <div className="text-xs text-[#6b8f71] font-medium mb-1">Gates Cleared</div>
            <div className="text-3xl font-bold text-[#6b8f71]">
              {gatesCleared}/{gates.length}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">Launch gates</div>
          </CardContent>
        </Card>
        <Card className="bg-[#c45a4a]/5 border-[#c45a4a]/20">
          <CardContent className="p-4">
            <div className="text-xs text-[#c45a4a] font-medium mb-1">Blockers</div>
            <div className="text-3xl font-bold text-[#c45a4a]">{blockers.length}</div>
            <div className="text-[10px] text-zinc-500 mt-1">Must resolve first</div>
          </CardContent>
        </Card>
        <Card className="bg-[#4a90b8]/5 border-[#4a90b8]/20">
          <CardContent className="p-4">
            <div className="text-xs text-[#4a90b8] font-medium mb-1">Total Items</div>
            <div className="text-3xl font-bold text-[#4a90b8]">{summary.total}</div>
            <div className="text-[10px] text-zinc-500 mt-1">{summary.complete} complete</div>
          </CardContent>
        </Card>
      </div>

      {blockers.length > 0 && (
        <div className="rounded-xl border border-[#c45a4a]/30 bg-[#c45a4a]/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-[#c45a4a]" />
            <span className="text-sm font-semibold text-[#c45a4a]">Active Blockers</span>
          </div>
          <div className="space-y-2">
            {blockers.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <span className="text-white font-medium">{item.title}</span>
                  <span className="text-zinc-400 text-xs ml-2">— {item.owner}</span>
                </div>
                <div className="text-xs text-[#c45a4a] font-medium">{formatDate(item.dueAt)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item: any) => {
          const typeInfo = ITEM_TYPE_CONFIG[item.itemType] || {
            label: item.itemType,
            icon: Package,
            color: 'text-zinc-400',
          };
          const statusInfo = STATUS_CONFIG[item.status] || {
            label: item.status,
            color: 'text-zinc-400',
            bg: 'bg-zinc-800',
          };
          const TypeIcon = typeInfo.icon;
          const dueText = formatDate(item.dueAt);
          const isOverdue =
            item.dueAt && new Date(item.dueAt) < new Date() && item.status !== 'complete';

          return (
            <Card
              key={item.id}
              className={cn(
                'border transition-all',
                item.status === 'blocked'
                  ? 'border-[#c45a4a]/30 bg-[#c45a4a]/3'
                  : item.status === 'complete'
                    ? 'border-[#6b8f71]/20 bg-[#6b8f71]/3'
                    : 'border-zinc-800 bg-zinc-900/30',
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge
                        variant="outline"
                        className={statusInfo.bg + ' ' + statusInfo.color + ' text-[10px]'}
                      >
                        {statusInfo.label}
                      </Badge>
                      <div
                        className={`flex items-center gap-1 text-[10px] font-medium ${typeInfo.color}`}
                      >
                        <TypeIcon className="w-3 h-3" />
                        {typeInfo.label}
                      </div>
                      {isOverdue && (
                        <Badge
                          variant="outline"
                          className="bg-[#c45a4a]/10 text-[#c45a4a] border-[#c45a4a]/30 text-[10px]"
                        >
                          OVERDUE
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-white mb-1">{item.title}</div>
                    <div className="text-xs text-zinc-400 mb-2">{item.description}</div>
                    <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {item.owner}
                      </span>
                      <span
                        className={cn(
                          'font-medium',
                          isOverdue ? 'text-[#c45a4a]' : 'text-zinc-500',
                        )}
                      >
                        {dueText}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {item.status !== 'complete' && item.status !== 'waived' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-[10px] border-[#6b8f71]/30 text-[#6b8f71] hover:bg-[#6b8f71]/10"
                        onClick={() => updateStatus.mutate({ id: item.id, status: 'complete' })}
                        disabled={updateStatus.isPending}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Mark Done
                      </Button>
                    )}
                    {item.status === 'not_started' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-[10px] border-[#4a90b8]/30 text-[#4a90b8] hover:bg-[#4a90b8]/10"
                        onClick={() => updateStatus.mutate({ id: item.id, status: 'in_progress' })}
                        disabled={updateStatus.isPending}
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        Start
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
