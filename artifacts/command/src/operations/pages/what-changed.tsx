import { useStandardQuery } from '@szl-holdings/api-client-react';

import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Clock,
  Filter,
  Layers,
  Loader2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

type ChangeType =
  | 'drift_resolved'
  | 'drift_detected'
  | 'approval_granted'
  | 'approval_pending'
  | 'incident_opened'
  | 'incident_resolved'
  | 'twin_synced'
  | 'worldline_branched';
type Domain = 'aegis' | 'terra' | 'vessels' | 'alloy' | 'prism' | 'lyte' | 'all';

interface TwinChange {
  id: string;
  timestamp: string;
  domain: Domain;
  twinName: string;
  changeType: ChangeType;
  summary: string;
  driftDelta?: number;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  worldline?: string;
  actor: string;
}

interface ApiChangeEvent {
  id: number;
  cursor: number;
  entityType: string;
  entityId: string;
  actorId: string;
  delta: Record<string, unknown>;
  crdtClock: Record<string, unknown>;
  appSource: string | null;
  timestamp: string;
}

const CHANGE_CONFIG: Record<ChangeType, { label: string; color: string; icon: typeof Activity }> = {
  drift_detected: { label: 'Drift Detected', color: '#f59e0b', icon: AlertTriangle },
  drift_resolved: { label: 'Drift Resolved', color: '#10b981', icon: CheckCircle },
  approval_granted: { label: 'Approval Granted', color: '#10b981', icon: CheckCircle },
  approval_pending: { label: 'Approval Pending', color: '#8b7ac8', icon: Clock },
  incident_opened: { label: 'Incident Opened', color: '#ef4444', icon: AlertTriangle },
  incident_resolved: { label: 'Incident Resolved', color: '#10b981', icon: CheckCircle },
  twin_synced: { label: 'Twin Synced', color: '#4B8BDB', icon: Activity },
  worldline_branched: { label: 'Worldline Branched', color: '#8b7ac8', icon: Layers },
};

const DOMAIN_COLORS: Record<Domain, string> = {
  aegis: '#ef4444',
  terra: '#10b981',
  vessels: '#06b6d4',
  alloy: '#4B8BDB',
  prism: '#f59e0b',
  lyte: '#d4a054',
  all: '#8b7ac8',
};

const ENTITY_TYPE_CHANGE: Record<string, ChangeType> = {
  twin: 'twin_synced',
  approval: 'approval_pending',
  incident: 'incident_opened',
  drift: 'drift_detected',
  worldline: 'worldline_branched',
};

const ENTITY_TYPE_DOMAIN: Record<string, Domain> = {
  aegis: 'aegis',
  terra: 'terra',
  vessels: 'vessels',
  alloy: 'alloy',
  prism: 'prism',
  lyte: 'lyte',
};

function apiChangeToTwinChange(ev: ApiChangeEvent): TwinChange {
  const delta = ev.delta ?? {};
  const source = ev.appSource ?? '';
  const domain =
    (Object.keys(ENTITY_TYPE_DOMAIN).find(
      (k) => source.includes(k) || ev.entityType.includes(k),
    ) as Domain) ?? 'alloy';
  const changeType: ChangeType =
    ENTITY_TYPE_CHANGE[ev.entityType] ??
    (delta.status === 'resolved'
      ? 'drift_resolved'
      : delta.status === 'pending'
        ? 'approval_pending'
        : 'twin_synced');

  return {
    id: `api-${ev.id}`,
    timestamp: new Date(ev.timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    domain,
    twinName: (delta.twinName as string) ?? (delta.name as string) ?? ev.entityId,
    changeType,
    summary:
      (delta.summary as string) ??
      (delta.description as string) ??
      `${ev.entityType} updated — actor: ${ev.actorId}`,
    driftDelta: delta.driftScore as number | undefined,
    severity: delta.severity as TwinChange['severity'] | undefined,
    worldline: delta.worldline as string | undefined,
    actor: ev.actorId,
  };
}

const SEED_CHANGES: TwinChange[] = [
  {
    id: 'c-001',
    timestamp: '14:38:12',
    domain: 'aegis',
    twinName: 'AWS-VPC-PROD',
    changeType: 'drift_detected',
    summary:
      'IAM drift escalated — 3 security groups misconfigured vs. approved baseline. Blast radius: 47%.',
    driftDelta: 31,
    severity: 'critical',
    worldline: 'WL-BETA',
    actor: 'ATLAS Spatial Runtime',
  },
  {
    id: 'c-002',
    timestamp: '14:32:07',
    domain: 'lyte',
    twinName: 'Command AIOps Twin',
    changeType: 'incident_opened',
    summary:
      'SLO breach on payment-api service. P95 latency 847ms vs. 200ms target. Autonomous NOC engaged.',
    severity: 'high',
    actor: 'Autonomous NOC Engine',
  },
  {
    id: 'c-003',
    timestamp: '14:28:45',
    domain: 'aegis',
    twinName: 'APP-TIER-K8S',
    changeType: 'drift_detected',
    summary:
      '6 pod security contexts drifted from approved spec. CVE-2024-3890 exposed on 2 containers.',
    driftDelta: 24,
    severity: 'critical',
    worldline: 'WL-BETA',
    actor: 'ATLAS Spatial Runtime',
  },
  {
    id: 'c-004',
    timestamp: '14:21:33',
    domain: 'alloy',
    twinName: 'Counsel Execution Fabric',
    changeType: 'approval_granted',
    summary:
      'ATLAS Approvals: APT29 containment workflow approved by SOC Lead. Handoff to Counsel execution gate complete.',
    actor: 'SOC Lead — M. Rivera',
  },
  {
    id: 'c-005',
    timestamp: '14:18:01',
    domain: 'aegis',
    twinName: 'OT-SCADA-CONTROL',
    changeType: 'approval_pending',
    summary:
      'PLC firmware reconciliation awaiting CISO + OT Lead dual approval. Scheduled maintenance window T+4h.',
    worldline: 'WL-GAMMA',
    actor: 'ATLAS OT Runtime',
  },
  {
    id: 'c-006',
    timestamp: '14:12:55',
    domain: 'vessels',
    twinName: 'Vessels Cargo Twin',
    changeType: 'approval_pending',
    summary:
      'Cargo manifest variance on VES-MV-047. Port authority confirmation pending. Worldline WL-DELTA active.',
    worldline: 'WL-DELTA',
    actor: 'Vessels Fleet Runtime',
  },
  {
    id: 'c-007',
    timestamp: '14:08:22',
    domain: 'aegis',
    twinName: 'PROD-DC-CLUSTER',
    changeType: 'twin_synced',
    summary:
      'Full baseline re-sync after Kerberos reissue. Hash verified, drift score reset to Δ2%. Proof chain updated.',
    driftDelta: 2,
    actor: 'ATLAS Replay Engine',
  },
  {
    id: 'c-008',
    timestamp: '14:02:11',
    domain: 'lyte',
    twinName: 'Command AIOps Twin',
    changeType: 'drift_detected',
    summary:
      '4 SLO contracts breached in last 30 minutes. Escalation path activated for payment-api. Runbook triggered.',
    driftDelta: 21,
    severity: 'high',
    actor: 'SLO Monitor',
  },
  {
    id: 'c-009',
    timestamp: '13:58:44',
    domain: 'alloy',
    twinName: 'Counsel Execution Fabric',
    changeType: 'twin_synced',
    summary:
      '247 workflow executions completed within SLA. Proof chain fully intact. 0 governance violations.',
    actor: 'Counsel Runtime',
  },
  {
    id: 'c-010',
    timestamp: '13:52:19',
    domain: 'aegis',
    twinName: 'CORE-NETWORK-FABRIC',
    changeType: 'worldline_branched',
    summary:
      'Worldline WL-GAMMA branched from WL-ALPHA following OT/ICS anomaly detection. 2 twins now on divergent path.',
    worldline: 'WL-GAMMA',
    actor: 'ATLAS Worldline Engine',
  },
  {
    id: 'c-011',
    timestamp: '13:45:07',
    domain: 'terra',
    twinName: 'Terra Property Fabric',
    changeType: 'twin_synced',
    summary:
      'Portfolio twin refreshed with Q2 2026 market comps. 14 properties revalued. All within ±3% of last cycle.',
    actor: 'Terra Valuation Engine',
  },
  {
    id: 'c-012',
    timestamp: '13:38:33',
    domain: 'prism',
    twinName: 'Prism Counsel Twin',
    changeType: 'approval_granted',
    summary:
      'NDA review batch approved. 3 counterparty agreements signed. Registry updated, proof chain intact.',
    actor: 'Legal Counsel — D. Park',
  },
  {
    id: 'c-013',
    timestamp: '13:30:15',
    domain: 'lyte',
    twinName: 'Command AIOps Twin',
    changeType: 'incident_resolved',
    summary:
      'P2 incident on auth-service resolved by self-healing playbook. Root cause: memory leak in session handler.',
    actor: 'Self-Healing Engine',
  },
  {
    id: 'c-014',
    timestamp: '13:22:48',
    domain: 'vessels',
    twinName: 'Vessels Fleet Twin',
    changeType: 'twin_synced',
    summary:
      'AIS data synced for all 14 vessels. All within assigned geofences. ETA updates applied to voyage P&L.',
    actor: 'Fleet AIS Connector',
  },
  {
    id: 'c-015',
    timestamp: '13:15:02',
    domain: 'aegis',
    twinName: 'AWS-VPC-PROD',
    changeType: 'drift_resolved',
    summary:
      'SG misconfiguration remediated post-approval. Drift score reset to Δ4%. Worldline re-merged to WL-ALPHA.',
    driftDelta: 4,
    worldline: 'WL-ALPHA',
    actor: 'PARAGON Remediation Engine',
  },
];

function DriftPill({ delta }: { delta: number }) {
  const color = delta <= 5 ? '#10b981' : delta <= 20 ? '#f59e0b' : '#ef4444';
  return (
    <span
      className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded ml-1"
      style={{ color, background: `${color}15`, border: `1px solid ${color}25` }}
    >
      Δ{delta}%
    </span>
  );
}

export default function WhatChanged() {
  const [domainFilter, setDomainFilter] = useState<Domain | 'all'>('all');
  const [typeFilter, _setTypeFilter] = useState<ChangeType | 'all'>('all');

  const {
    data: changeData,
    isLoading,
    refetch,
  } = useStandardQuery<{ events: ApiChangeEvent[]; cursor: number; hasMore: boolean }>({
    queryKey: ['twin-changes'],
    queryFn: () =>
      fetch('/api/changes?limit=50')
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((r) => r.data ?? r),
    staleTime: 15000,
    retry: 1,
  });

  const apiChanges: TwinChange[] = (changeData?.events ?? []).map(apiChangeToTwinChange);
  const allChanges =
    apiChanges.length > 0 ? [...apiChanges, ...SEED_CHANGES].slice(0, 30) : SEED_CHANGES;

  const isLiveData = apiChanges.length > 0;

  const filtered = allChanges.filter(
    (c) =>
      (domainFilter === 'all' || c.domain === domainFilter) &&
      (typeFilter === 'all' || c.changeType === typeFilter),
  );

  const driftEvents = allChanges.filter((c) => c.changeType === 'drift_detected');
  const pendingApprovals = allChanges.filter((c) => c.changeType === 'approval_pending');
  const resolvedToday = allChanges.filter(
    (c) => c.changeType === 'drift_resolved' || c.changeType === 'incident_resolved',
  );

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-3.5 h-3.5" style={{ color: '#d4a054' }} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest font-mono"
              style={{ color: '#d4a054' }}
            >
              Command · What Changed
            </span>
            {isLoading && (
              <Loader2 className="w-3 h-3 animate-spin" style={{ color: 'rgba(212,160,84,0.5)' }} />
            )}
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Twin State Change Feed</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            A real-time summary of twin drift events, worldline branches, and approval decisions
            across all domains.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-[11px] border px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors shrink-0"
          style={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {isLiveData && (
        <div
          className="rounded-xl border px-4 py-2.5 flex items-center gap-3"
          style={{ borderColor: 'rgba(212,160,84,0.12)', background: 'rgba(212,160,84,0.02)' }}
        >
          <Zap className="w-3 h-3 shrink-0" style={{ color: '#d4a054' }} />
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <span className="font-bold font-mono" style={{ color: '#d4a054' }}>
              {apiChanges.length}
            </span>{' '}
            live change event{apiChanges.length !== 1 ? 's' : ''} from the change feed — merged with
            historical context
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Active Drift Events',
            value: driftEvents.length,
            color: '#f59e0b',
            icon: AlertTriangle,
          },
          {
            label: 'Pending Approvals',
            value: pendingApprovals.length,
            color: '#8b7ac8',
            icon: Clock,
          },
          {
            label: 'Resolved Today',
            value: resolvedToday.length,
            color: '#10b981',
            icon: CheckCircle,
          },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border p-4"
            style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.015)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <c.icon className="w-3 h-3" style={{ color: c.color }} />
              <div
                className="text-[9px] font-medium uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                {c.label}
              </div>
            </div>
            <div className="text-2xl font-bold font-mono" style={{ color: c.color }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="flex items-center gap-1 text-[10px]"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          <Filter className="w-3 h-3" /> Domain:
        </div>
        <div className="flex gap-1 flex-wrap">
          {(['all', 'aegis', 'lyte', 'alloy', 'vessels', 'terra', 'prism'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDomainFilter(d)}
              className="text-[9px] px-2.5 py-1 rounded-lg border capitalize transition-all"
              style={{
                background:
                  domainFilter === d
                    ? `${DOMAIN_COLORS[d] ?? '#8b7ac8'}15`
                    : 'rgba(255,255,255,0.02)',
                borderColor:
                  domainFilter === d
                    ? `${DOMAIN_COLORS[d] ?? '#8b7ac8'}40`
                    : 'rgba(255,255,255,0.06)',
                color:
                  domainFilter === d ? (DOMAIN_COLORS[d] ?? '#8b7ac8') : 'rgba(255,255,255,0.35)',
              }}
            >
              {d}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {filtered.length} events{isLiveData ? ' · live' : ''}
        </span>
      </div>

      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <div className="divide-y divide-white/[0.04]">
          {filtered.map((change) => {
            const cfg = CHANGE_CONFIG[change.changeType];
            const CIcon = cfg.icon;
            const domainColor = DOMAIN_COLORS[change.domain] ?? '#8b7ac8';
            return (
              <div key={change.id} className="p-4 hover:bg-white/2 transition-colors">
                <div className="flex items-start gap-3">
                  <div
                    className="p-1.5 rounded-lg shrink-0 mt-0.5"
                    style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}20` }}
                  >
                    <CIcon className="w-3 h-3" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span
                        className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                        style={{ color: cfg.color, background: `${cfg.color}12` }}
                      >
                        {cfg.label}
                      </span>
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded"
                        style={{ color: domainColor, background: `${domainColor}12` }}
                      >
                        {change.domain}
                      </span>
                      {change.driftDelta !== undefined && <DriftPill delta={change.driftDelta} />}
                      {change.severity && (
                        <span
                          className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded"
                          style={{
                            color:
                              change.severity === 'critical'
                                ? '#ef4444'
                                : change.severity === 'high'
                                  ? '#f59e0b'
                                  : '#6b7280',
                            background: 'rgba(255,255,255,0.04)',
                          }}
                        >
                          {change.severity}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-semibold" style={{ color: domainColor }}>
                        {change.twinName}
                      </span>
                      {change.worldline && (
                        <span
                          className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                          style={{ color: '#8b7ac8', background: 'rgba(139,122,200,0.08)' }}
                        >
                          {change.worldline}
                        </span>
                      )}
                    </div>
                    <div
                      className="text-[10px] leading-snug"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      {change.summary}
                    </div>
                    <div
                      className="flex items-center gap-2 mt-1 text-[9px]"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      <span>{change.timestamp}</span>
                      <ChevronRight className="w-2.5 h-2.5" />
                      <span>{change.actor}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
