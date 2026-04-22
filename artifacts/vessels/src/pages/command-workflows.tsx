import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Button } from '@szl-holdings/shared-ui/ui/button';
import { Card, CardContent } from '@szl-holdings/shared-ui/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@szl-holdings/shared-ui/ui/select';
import { toast } from '@szl-holdings/shared-ui/ui/sonner';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Anchor,
  CheckCircle,
  Clock,
  Filter,
  Navigation,
  RefreshCw,
  Ship,
  TrendingDown,
  User,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { SubstrateWorkflowPanel } from '@/components/SubstrateWorkflowPanel';

const EVENT_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> =
  {
    status_change: { label: 'Status Change', icon: Ship, color: 'text-blue-400' },
    route_deviation: { label: 'Route Deviation', icon: Navigation, color: 'text-amber-400' },
    eta_drift: { label: 'ETA Drift', icon: Clock, color: 'text-orange-400' },
    weather_pressure: { label: 'Weather Pressure', icon: Wind, color: 'text-sky-400' },
    maintenance_watch: { label: 'Maintenance Watch', icon: Wrench, color: 'text-yellow-400' },
    port_congestion: { label: 'Port Congestion', icon: Anchor, color: 'text-purple-400' },
    delay_event: { label: 'Delay Event', icon: TrendingDown, color: 'text-red-400' },
    alert_classification: {
      label: 'Alert Classification',
      icon: AlertTriangle,
      color: 'text-rose-400',
    },
    ais_dark: { label: 'AIS Dark', icon: Ship, color: 'text-red-400' },
    speed_anomaly: { label: 'Speed Anomaly', icon: Zap, color: 'text-amber-400' },
  };

const WORKFLOW_TYPE_LABELS: Record<string, string> = {
  exception_queue: 'Exception Queue',
  owner_assignment: 'Owner Assignment',
  acknowledgment: 'Acknowledgment',
  escalation: 'Escalation',
  maintenance_followup: 'Maintenance Follow-up',
  route_intervention: 'Route Intervention',
};

const SEVERITY_COLORS: Record<string, string> = {
  watch: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-500/15 text-red-400 border-red-500/30',
  acknowledged: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  assigned: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  resolved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

const FALLBACK_VESSELS = [
  { id: 1, name: 'MV Atlantic Pioneer' },
  { id: 2, name: 'MV Pacific Guardian' },
  { id: 3, name: 'MV Nordic Crest' },
  { id: 4, name: 'MV Southern Cross' },
];

const FALLBACK_EVENTS = [
  {
    id: 1,
    vesselId: 1,
    eventType: 'eta_drift',
    severity: 'critical',
    status: 'open',
    title: 'ETA Drift — 34h delay on Atlantic Pioneer',
    description:
      'Route delay due to Strait of Gibraltar congestion. Port slot at Rotterdam at risk. Delay impact: $420K.',
    consequenceData: {
      delayHours: 34,
      marginImpact: 420000,
      routePressure: 'high',
      fuelImpact: 18000,
      portSlotRisk: true,
    },
    occurredAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 2,
    vesselId: 2,
    eventType: 'route_deviation',
    severity: 'warning',
    status: 'acknowledged',
    title: 'Route Deviation — Pacific Guardian off optimal lane',
    description:
      'Vessel deviated 42nm from planned route due to weather system. Monitoring fuel burn impact.',
    consequenceData: { deviationNm: 42, fuelImpact: 24000, weatherRisk: 'moderate', etaImpact: 8 },
    occurredAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    assignedTo: 'Helmsman AI',
  },
  {
    id: 3,
    vesselId: 3,
    eventType: 'maintenance_watch',
    severity: 'warning',
    status: 'open',
    title: 'Engine Maintenance Watch — Nordic Crest',
    description:
      'Predictive maintenance flag: Main engine bearing wear at 78% threshold. Recommend inspection at next port call.',
    consequenceData: {
      componentRisk: 'main_engine',
      wearPct: 78,
      inspectionDue: 'Rotterdam',
      operationalRisk: 'medium',
    },
    occurredAt: new Date(Date.now() - 18 * 3600000).toISOString(),
  },
  {
    id: 4,
    vesselId: 4,
    eventType: 'port_congestion',
    severity: 'watch',
    status: 'assigned',
    title: 'Port Congestion — Singapore Anchorage',
    description:
      'Average wait time at Singapore increased to 4.2 days. Southern Cross scheduled arrival may face anchor queue.',
    consequenceData: { waitDays: 4.2, congestionTrend: 'increasing', revenueImpact: 95000 },
    occurredAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    assignedTo: 'Ops Team',
  },
  {
    id: 5,
    vesselId: 1,
    eventType: 'weather_pressure',
    severity: 'critical',
    status: 'open',
    title: 'Severe Weather — Typhoon Track Intersecting Route',
    description:
      'Tropical storm tracking to intercept planned route. Rerouting required within 6h window.',
    consequenceData: {
      windKnots: 55,
      waveHeightM: 8.5,
      routePressure: 'severe',
      rerouting: 'recommended',
    },
    occurredAt: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
];

function formatCurrency(val: number): string {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  return `$${val}`;
}

function getTimeSince(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return `${Math.floor(diff / 60000)}m ago`;
  return `${hours}h ago`;
}

export default function CommandWorkflowsPage() {
  const queryClient = useQueryClient();
  const [vesselFilter, setVesselFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: rawEvents } = useStandardQuery({
    queryKey: ['vessel-events', vesselFilter],
    queryFn: () => {
      const q = vesselFilter !== 'all' ? `?vesselId=${vesselFilter}` : '';
      return apiFetch<any[]>(`/vessels/events${q}`);
    },
    placeholderData: FALLBACK_EVENTS as any,
  });

  const events: any[] =
    rawEvents && Array.isArray(rawEvents) && rawEvents.length > 0 ? rawEvents : FALLBACK_EVENTS;

  const acknowledgeEvent = useStandardMutation({
    mutationFn: ({ id }: { id: number }) =>
      apiFetch(`/vessels/events/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'acknowledged' }),
      }),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['vessel-events'] });
      const prev = queryClient.getQueriesData({ queryKey: ['vessel-events'] });
      queryClient.setQueriesData({ queryKey: ['vessel-events'] }, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.map((e: Record<string, unknown>) =>
          e.id === id ? { ...e, status: 'acknowledged' } : e,
        );
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) ctx.prev.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error('Failed to acknowledge event');
    },
    onSuccess: () => toast.success('Event acknowledged'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['vessel-events'] }),
  });

  const createWorkflow = useStandardMutation({
    mutationFn: ({ eventId, vesselId, workflowType, assignedTo }: any) =>
      apiFetch('/vessels/command-workflows', {
        method: 'POST',
        body: JSON.stringify({ eventId, vesselId, workflowType, assignedTo }),
      }),
    onSuccess: (_data, vars) => {
      toast.success(`Workflow "${WORKFLOW_TYPE_LABELS[vars.workflowType]}" created via FORGE`);
      queryClient.invalidateQueries({ queryKey: ['vessel-events'] });
    },
    onError: () => toast.error('Failed to create workflow'),
  });

  const filtered = events.filter((e: any) => {
    if (severityFilter !== 'all' && e.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (vesselFilter !== 'all' && String(e.vesselId) !== vesselFilter) return false;
    return true;
  });

  const criticalOpen = events.filter(
    (e: any) => e.severity === 'critical' && e.status === 'open',
  ).length;
  const totalDelayImpact = events.reduce(
    (s: number, e: any) =>
      s + (e.consequenceData?.marginImpact || e.consequenceData?.revenueImpact || 0),
    0,
  );

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Ship className="w-5 h-5 text-sky-400" />
            Command Workflows
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Exception queue, owner assignment, route interventions — powered by Alloy
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-slate-700 text-slate-300 hover:bg-slate-800 gap-1.5"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['vessel-events'] })}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="text-xs text-red-400 font-medium mb-1">Critical Open</div>
            <div className="text-3xl font-bold text-red-400">{criticalOpen}</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="text-xs text-amber-400 font-medium mb-1">Total Events</div>
            <div className="text-3xl font-bold text-amber-400">{events.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="text-xs text-orange-400 font-medium mb-1">Consequence Impact</div>
            <div className="text-3xl font-bold text-orange-400">
              {formatCurrency(totalDelayImpact)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="text-xs text-blue-400 font-medium mb-1">Monitored Vessels</div>
            <div className="text-3xl font-bold text-blue-400">{FALLBACK_VESSELS.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={vesselFilter} onValueChange={setVesselFilter}>
          <SelectTrigger className="w-44 h-8 bg-slate-900 border-slate-700 text-slate-300 text-sm">
            <SelectValue placeholder="Vessel" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="all">All Vessels</SelectItem>
            {FALLBACK_VESSELS.map((v) => (
              <SelectItem key={v.id} value={String(v.id)}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-36 h-8 bg-slate-900 border-slate-700 text-slate-300 text-sm">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="watch">Watch</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-8 bg-slate-900 border-slate-700 text-slate-300 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-1 text-xs text-slate-500">
          <Filter className="w-3 h-3" />
          {filtered.length} events
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-16 text-slate-500 text-sm">
            No events match the current filters.
          </div>
        )}
        {filtered.map((event: any) => {
          const typeInfo = EVENT_TYPE_CONFIG[event.eventType] || {
            label: event.eventType,
            icon: Ship,
            color: 'text-slate-400',
          };
          const TypeIcon = typeInfo.icon;
          const cd = event.consequenceData || {};
          const vessel = FALLBACK_VESSELS.find((v) => v.id === event.vesselId);

          return (
            <Card
              key={event.id}
              className={cn(
                'border transition-all',
                event.severity === 'critical'
                  ? 'border-red-500/30 bg-red-500/3'
                  : event.severity === 'warning'
                    ? 'border-amber-500/20 bg-amber-500/3'
                    : 'border-slate-800 bg-slate-900/30',
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <Badge variant="outline" className={SEVERITY_COLORS[event.severity] || ''}>
                        {event.severity}
                      </Badge>
                      <Badge variant="outline" className={STATUS_COLORS[event.status] || ''}>
                        {event.status}
                      </Badge>
                      <div
                        className={`flex items-center gap-1 text-[10px] font-medium ${typeInfo.color}`}
                      >
                        <TypeIcon className="w-3 h-3" />
                        {typeInfo.label}
                      </div>
                      {vessel && <span className="text-[10px] text-slate-400">{vessel.name}</span>}
                    </div>
                    <div className="text-sm font-semibold text-white mb-1">{event.title}</div>
                    <div className="text-xs text-slate-400 mb-2">{event.description}</div>

                    {Object.keys(cd).length > 0 && (
                      <div className="flex flex-wrap gap-3 mb-2">
                        {cd.delayHours && (
                          <span className="text-[10px] text-orange-400">
                            ⏱ {cd.delayHours}h delay
                          </span>
                        )}
                        {cd.marginImpact && (
                          <span className="text-[10px] text-red-400">
                            💰 {formatCurrency(cd.marginImpact)} margin impact
                          </span>
                        )}
                        {cd.revenueImpact && (
                          <span className="text-[10px] text-red-400">
                            💰 {formatCurrency(cd.revenueImpact)} revenue impact
                          </span>
                        )}
                        {cd.fuelImpact && (
                          <span className="text-[10px] text-amber-400">
                            ⛽ {formatCurrency(cd.fuelImpact)} fuel impact
                          </span>
                        )}
                        {cd.deviationNm && (
                          <span className="text-[10px] text-sky-400">
                            📍 {cd.deviationNm}nm deviation
                          </span>
                        )}
                        {cd.wearPct && (
                          <span className="text-[10px] text-yellow-400">🔧 {cd.wearPct}% wear</span>
                        )}
                        {cd.waitDays && (
                          <span className="text-[10px] text-purple-400">
                            ⚓ {cd.waitDays}d wait
                          </span>
                        )}
                        {cd.windKnots && (
                          <span className="text-[10px] text-sky-400">
                            💨 {cd.windKnots}kts wind
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-[10px] text-slate-500">
                      {event.assignedTo && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {event.assignedTo}
                        </span>
                      )}
                      <span>{getTimeSince(event.occurredAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {event.status === 'open' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-[10px] border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                        onClick={() => acknowledgeEvent.mutate({ id: event.id })}
                        disabled={acknowledgeEvent.isPending}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Ack
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-[10px] border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
                      onClick={() =>
                        createWorkflow.mutate({
                          eventId: event.id,
                          vesselId: event.vesselId,
                          workflowType:
                            event.severity === 'critical' ? 'escalation' : 'owner_assignment',
                          assignedTo: 'Alloy Workflow Engine',
                        })
                      }
                      disabled={createWorkflow.isPending}
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      Alloy
                    </Button>
                    {event.eventType === 'route_deviation' ||
                    event.eventType === 'weather_pressure' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-[10px] border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                        onClick={() =>
                          createWorkflow.mutate({
                            eventId: event.id,
                            vesselId: event.vesselId,
                            workflowType: 'route_intervention',
                          })
                        }
                        disabled={createWorkflow.isPending}
                      >
                        <Navigation className="w-3 h-3 mr-1" />
                        Reroute
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6">
        <SubstrateWorkflowPanel />
      </div>
    </div>
  );
}
