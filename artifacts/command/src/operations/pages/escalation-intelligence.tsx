import {
  AlertTriangle,
  Brain,
  CheckCircle,
  ChevronRight,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  Shield,
  Users,
} from 'lucide-react';
import { useState } from 'react';

const GOLD = '#d4a054';
const DS = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.06)',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    muted: 'rgba(255,255,255,0.25)',
  },
};

type EscalationStatus = 'pending' | 'routed' | 'acknowledged' | 'resolved';
type ComplexityLevel = 'L1' | 'L2' | 'L3';
type Timezone = 'US/East' | 'US/West' | 'EU/London' | 'APAC/Sing';

interface Engineer {
  id: string;
  name: string;
  initials: string;
  timezone: Timezone;
  expertise: string[];
  currentLoad: number;
  maxLoad: number;
  availabilityScore: number;
  onCall: boolean;
  avgResponseMins: number;
}

interface EscalationRoute {
  id: string;
  incidentId: string;
  title: string;
  severity: 'critical' | 'high' | 'medium';
  complexity: ComplexityLevel;
  status: EscalationStatus;
  createdAt: number;
  routedAt?: number;
  acknowledgedAt?: number;
  assignedEngineer: Engineer;
  alternativeEngineers: Engineer[];
  routingScore: number;
  routingFactors: { factor: string; score: number; weight: number }[];
  contextPackage: string[];
  aiReasoning: string;
}

const ENGINEERS: Engineer[] = [
  {
    id: 'e1',
    name: 'Priya Sharma',
    initials: 'PS',
    timezone: 'US/East',
    expertise: ['kubernetes', 'distributed-systems', 'postgres'],
    currentLoad: 2,
    maxLoad: 4,
    availabilityScore: 82,
    onCall: true,
    avgResponseMins: 4,
  },
  {
    id: 'e2',
    name: 'David Chen',
    initials: 'DC',
    timezone: 'US/West',
    expertise: ['networking', 'security', 'incident-response'],
    currentLoad: 0,
    maxLoad: 4,
    availabilityScore: 96,
    onCall: false,
    avgResponseMins: 7,
  },
  {
    id: 'e3',
    name: 'Amara Osei',
    initials: 'AO',
    timezone: 'EU/London',
    expertise: ['ml-infrastructure', 'gpu-systems', 'python'],
    currentLoad: 3,
    maxLoad: 4,
    availabilityScore: 58,
    onCall: false,
    avgResponseMins: 11,
  },
  {
    id: 'e4',
    name: 'Lukas Müller',
    initials: 'LM',
    timezone: 'EU/London',
    expertise: ['databases', 'replication', 'postgres', 'redis'],
    currentLoad: 1,
    maxLoad: 4,
    availabilityScore: 88,
    onCall: true,
    avgResponseMins: 5,
  },
  {
    id: 'e5',
    name: 'Kenji Tanaka',
    initials: 'KT',
    timezone: 'APAC/Sing',
    expertise: ['api-gateway', 'load-balancing', 'observability'],
    currentLoad: 0,
    maxLoad: 4,
    availabilityScore: 94,
    onCall: true,
    avgResponseMins: 3,
  },
];

const SEV_COLOR: Record<EscalationRoute['severity'], string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
};

const COMPLEXITY_COLOR: Record<ComplexityLevel, string> = {
  L1: '#10b981',
  L2: '#f59e0b',
  L3: '#ef4444',
};

const STATUS_COLOR: Record<EscalationStatus, string> = {
  pending: '#6b7280',
  routed: '#3b82f6',
  acknowledged: '#f59e0b',
  resolved: '#10b981',
};

const ESCALATIONS: EscalationRoute[] = [
  {
    id: 'ESC-0921',
    incidentId: 'INC-2847',
    title: 'API Gateway Critical Latency — Production SLA Breach',
    severity: 'critical',
    complexity: 'L3',
    status: 'routed',
    createdAt: Date.now() - 8 * 60000,
    routedAt: Date.now() - 7.5 * 60000,
    assignedEngineer: ENGINEERS[0]!,
    alternativeEngineers: [ENGINEERS[4]!, ENGINEERS[3]!],
    routingScore: 91,
    routingFactors: [
      { factor: 'Expertise match (k8s + distributed systems)', score: 95, weight: 0.35 },
      { factor: 'On-call availability', score: 100, weight: 0.25 },
      { factor: 'Current workload headroom', score: 75, weight: 0.2 },
      { factor: 'Timezone (US/East — peak hours)', score: 88, weight: 0.2 },
    ],
    contextPackage: [
      'INC-2847: API Gateway P95 latency at 1.2s (SLA: 200ms) — active 38 minutes',
      '14 clients impacted — Northgate, Meridian, Pacific Logistics in top 3',
      'Revenue impact: $254.8k and growing at $6.7k/min',
      'Recent changes: k8s resource limits updated 4h ago by deploy #4821',
      'Similar incident RCA: connection pool exhaustion (INC-2801, 3 weeks ago)',
      'Recommended first action: Check connection pool stats on api-gateway-prod-* pods',
    ],
    aiReasoning:
      'Priya matched on distributed systems + kubernetes expertise (direct relevance to k8s config change). On-call status confirms pager availability. Load at 50% — sufficient headroom for L3 incident. Timezone aligns with client impact window (US business hours).',
  },
  {
    id: 'ESC-0919',
    incidentId: 'INC-2845',
    title: 'ML Inference OOM — Batch Pipeline Failures',
    severity: 'high',
    complexity: 'L2',
    status: 'acknowledged',
    createdAt: Date.now() - 35 * 60000,
    routedAt: Date.now() - 34 * 60000,
    acknowledgedAt: Date.now() - 29 * 60000,
    assignedEngineer: ENGINEERS[2]!,
    alternativeEngineers: [ENGINEERS[1]!],
    routingScore: 88,
    routingFactors: [
      { factor: 'Expertise match (ml-infrastructure + gpu-systems)', score: 98, weight: 0.35 },
      { factor: 'On-call availability', score: 0, weight: 0.25 },
      { factor: 'Current workload headroom', score: 60, weight: 0.2 },
      { factor: 'Timezone (EU/London — available)', score: 82, weight: 0.2 },
    ],
    contextPackage: [
      'INC-2845: ML inference service OOM on 3 of 5 pods — batch jobs failing',
      '6 clients affected — BlueSky, TechBridge among key accounts',
      'Queue depth at 34k (normal: 8k) — growing',
      'GPU memory allocation increased 28% after model update last Tuesday',
      'Similar pattern: prior OOM during peak batch load (INC-2790)',
    ],
    aiReasoning:
      'Amara is the domain expert for ML infrastructure — strong expertise match despite not being on-call. Workload allows capacity. EU timezone coverage fills gap during US evening. Acknowledged within 5 minutes of route.',
  },
  {
    id: 'ESC-0918',
    incidentId: 'INC-2843',
    title: 'Redis Session Cache Degradation — Auth Latency Rising',
    severity: 'medium',
    complexity: 'L2',
    status: 'pending',
    createdAt: Date.now() - 3 * 60000,
    assignedEngineer: ENGINEERS[3]!,
    alternativeEngineers: [ENGINEERS[0]!],
    routingScore: 94,
    routingFactors: [
      { factor: 'Expertise match (redis + databases)', score: 98, weight: 0.35 },
      { factor: 'On-call availability', score: 100, weight: 0.25 },
      { factor: 'Current workload headroom', score: 88, weight: 0.2 },
      { factor: 'Timezone (EU/London)', score: 88, weight: 0.2 },
    ],
    contextPackage: [
      'Auth service latency rising: P99 at 340ms (normal: 80ms)',
      'Redis eviction rate: 340 keys/min vs baseline 40',
      'Session cache hit rate: 87% (dropping from 94% over 12h)',
      'maxmemory-policy: allkeys-lru — aggressive eviction under load',
      'No recent Redis config changes — likely organic growth',
    ],
    aiReasoning:
      'Lukas is the database + Redis specialist — highest relevance for cache degradation investigation. On-call and at 25% load. EU timezone provides current availability coverage.',
  },
];

function fmtAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function LoadBar({ current, max }: { current: number; max: number }) {
  const pct = (current / max) * 100;
  const color = pct >= 75 ? '#ef4444' : pct >= 50 ? '#f59e0b' : '#10b981';
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex-1 h-1 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[9px] font-mono" style={{ color }}>
        {current}/{max}
      </span>
    </div>
  );
}

function RoutingFactorBar({
  factor,
  score,
  weight,
}: {
  factor: string;
  score: number;
  weight: number;
}) {
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="text-[10px]">
      <div className="flex justify-between mb-0.5">
        <span style={{ color: DS.text.secondary }}>{factor}</span>
        <div className="flex items-center gap-2">
          <span className="text-[8px]" style={{ color: DS.text.muted }}>
            ×{weight}
          </span>
          <span className="font-mono" style={{ color }}>
            {score}
          </span>
        </div>
      </div>
      <div
        className="h-1 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      >
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}

function EngineerChip({ eng, primary }: { eng: Engineer; primary?: boolean }) {
  const loadPct = (eng.currentLoad / eng.maxLoad) * 100;
  const loadColor = loadPct >= 75 ? '#ef4444' : loadPct >= 50 ? '#f59e0b' : '#10b981';
  return (
    <div
      className="flex items-center gap-2 p-2 rounded-lg"
      style={{
        background: primary ? 'rgba(212,160,84,0.06)' : DS.surface,
        border: `1px solid ${primary ? 'rgba(212,160,84,0.2)' : DS.border}`,
      }}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
        style={{
          background: primary ? 'rgba(212,160,84,0.15)' : 'rgba(255,255,255,0.06)',
          color: primary ? GOLD : DS.text.secondary,
        }}
      >
        {eng.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-[10px] font-medium truncate"
          style={{ color: primary ? GOLD : DS.text.secondary }}
        >
          {eng.name}{' '}
          {primary && (
            <span className="text-[8px]" style={{ color: 'rgba(212,160,84,0.6)' }}>
              · PRIMARY
            </span>
          )}
        </div>
        <div className="text-[8px]" style={{ color: DS.text.muted }}>
          {eng.timezone} · {eng.avgResponseMins}m avg response
        </div>
      </div>
      {eng.onCall && (
        <span
          className="text-[7px] px-1 py-0.5 rounded"
          style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}
        >
          ON-CALL
        </span>
      )}
    </div>
  );
}

function EscalationCard({ esc }: { esc: EscalationRoute }) {
  const [expanded, setExpanded] = useState(esc.status === 'pending' || esc.status === 'routed');
  const sc = SEV_COLOR[esc.severity];
  const stc = STATUS_COLOR[esc.status];
  const cc = COMPLEXITY_COLOR[esc.complexity];

  return (
    <div className="rounded-xl border" style={{ borderColor: `${sc}25`, background: `${sc}03` }}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase"
                style={{ background: `${sc}15`, color: sc }}
              >
                {esc.severity}
              </span>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                style={{ background: `${cc}15`, color: cc }}
              >
                {esc.complexity}
              </span>
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: DS.surface, color: DS.text.muted }}
              >
                #{esc.id}
              </span>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded capitalize"
                style={{ background: `${stc}12`, color: stc }}
              >
                {esc.status}
              </span>
              <span className="ml-auto text-[9px] font-mono" style={{ color: DS.text.muted }}>
                AI score: <span style={{ color: GOLD }}>{esc.routingScore}</span>
              </span>
            </div>
            <div className="text-[12px] font-semibold mb-0.5" style={{ color: DS.text.primary }}>
              {esc.title}
            </div>
            <div className="text-[9px]" style={{ color: DS.text.muted }}>
              Created {fmtAgo(esc.createdAt)}
              {esc.routedAt && ` · Routed ${fmtAgo(esc.routedAt)}`}
              {esc.acknowledgedAt && ` · Ack'd ${fmtAgo(esc.acknowledgedAt)}`}
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 p-1 rounded hover:bg-white/5 transition-colors"
          >
            <ChevronRight
              className="w-3.5 h-3.5 transition-transform"
              style={{ color: DS.text.muted, transform: expanded ? 'rotate(90deg)' : 'none' }}
            />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="md:col-span-1">
            <EngineerChip eng={esc.assignedEngineer} primary />
          </div>
          {esc.alternativeEngineers.slice(0, 2).map((eng) => (
            <div key={eng.id}>
              <EngineerChip eng={eng} />
            </div>
          ))}
        </div>
      </div>

      {expanded && (
        <div className="border-t" style={{ borderColor: DS.border }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="p-4" style={{ borderRight: `1px solid ${DS.border}` }}>
              <div
                className="text-[9px] uppercase tracking-widest font-medium mb-3"
                style={{ color: DS.text.muted }}
              >
                AI Routing Decision Factors
              </div>
              <div className="space-y-2.5 mb-4">
                {esc.routingFactors.map((f, i) => (
                  <RoutingFactorBar key={i} {...f} />
                ))}
              </div>
              <div
                className="p-3 rounded-lg"
                style={{
                  background: 'rgba(139,92,246,0.06)',
                  border: '1px solid rgba(139,92,246,0.15)',
                }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Brain className="w-3 h-3" style={{ color: '#8b5cf6' }} />
                  <span className="text-[9px] font-medium" style={{ color: '#8b5cf6' }}>
                    Alloy Routing Reasoning
                  </span>
                </div>
                <p className="text-[10px] leading-relaxed" style={{ color: DS.text.secondary }}>
                  {esc.aiReasoning}
                </p>
              </div>
            </div>
            <div className="p-4">
              <div
                className="text-[9px] uppercase tracking-widest font-medium mb-3"
                style={{ color: DS.text.muted }}
              >
                Context Package (Delivered to Engineer)
              </div>
              <div className="space-y-1.5">
                {esc.contextPackage.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-[10px] p-2 rounded-lg"
                    style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
                  >
                    <Shield className="w-2.5 h-2.5 shrink-0 mt-0.5" style={{ color: GOLD }} />
                    <span style={{ color: DS.text.secondary }}>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] transition-all hover:opacity-80"
                  style={{
                    background: 'rgba(16,185,129,0.08)',
                    color: '#10b981',
                    border: '1px solid rgba(16,185,129,0.2)',
                  }}
                >
                  <Phone className="w-3 h-3" />
                  Page Engineer
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] transition-all hover:opacity-80"
                  style={{
                    background: DS.surface,
                    color: DS.text.secondary,
                    border: `1px solid ${DS.border}`,
                  }}
                >
                  <MessageSquare className="w-3 h-3" />
                  Slack Thread
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EscalationIntelligencePage() {
  const avgRoutingScore = Math.round(
    ESCALATIONS.reduce((s, e) => s + e.routingScore, 0) / ESCALATIONS.length,
  );
  const ackRate = Math.round(
    (ESCALATIONS.filter((e) => e.acknowledgedAt).length / ESCALATIONS.length) * 100,
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-4 h-4" style={{ color: GOLD }} />
            <h1 className="text-[15px] font-bold" style={{ color: DS.text.primary }}>
              Escalation Intelligence
            </h1>
            <span
              className="text-[8px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider"
              style={{
                background: 'rgba(139,92,246,0.08)',
                color: '#8b5cf6',
                border: '1px solid rgba(139,92,246,0.2)',
              }}
            >
              AI-POWERED
            </span>
          </div>
          <p className="text-[11px]" style={{ color: DS.text.muted }}>
            AI routes incidents to the right engineer — factoring expertise, timezone, workload, and
            complexity. Context packages auto-assembled for immediate action.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Active Escalations',
            value: String(ESCALATIONS.filter((e) => e.status !== 'resolved').length),
            color: '#f59e0b',
            icon: AlertTriangle,
          },
          { label: 'Avg Routing Score', value: `${avgRoutingScore}/100`, color: GOLD, icon: Brain },
          { label: 'Acknowledged', value: `${ackRate}%`, color: '#10b981', icon: CheckCircle },
          {
            label: 'Engineers Available',
            value: String(ENGINEERS.filter((e) => e.availabilityScore >= 70).length),
            color: '#3b82f6',
            icon: Users,
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-xl border p-4"
            style={{ borderColor: DS.border, background: DS.surface }}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[9px] uppercase tracking-widest"
                style={{ color: DS.text.muted }}
              >
                {k.label}
              </span>
              <k.icon className="w-3.5 h-3.5" style={{ color: k.color }} />
            </div>
            <div className="text-[20px] font-bold font-mono" style={{ color: k.color }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      <div
        className="rounded-xl border p-4"
        style={{ borderColor: DS.border, background: DS.surface }}
      >
        <div className="text-[10px] font-medium mb-3" style={{ color: DS.text.secondary }}>
          Engineer Availability Matrix
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {ENGINEERS.map((eng) => {
            const availColor =
              eng.availabilityScore >= 80
                ? '#10b981'
                : eng.availabilityScore >= 60
                  ? '#f59e0b'
                  : '#ef4444';
            return (
              <div
                key={eng.id}
                className="rounded-lg p-3"
                style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                    style={{ background: 'rgba(255,255,255,0.06)', color: DS.text.secondary }}
                  >
                    {eng.initials}
                  </div>
                  <div className="min-w-0">
                    <div
                      className="text-[9px] font-medium truncate"
                      style={{ color: DS.text.primary }}
                    >
                      {eng.name.split(' ')[0]}
                    </div>
                    <div className="text-[7px]" style={{ color: DS.text.muted }}>
                      {eng.timezone}
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[8px]" style={{ color: DS.text.muted }}>
                    <span>Availability</span>
                    <span style={{ color: availColor }}>{eng.availabilityScore}%</span>
                  </div>
                  <div
                    className="h-1 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${eng.availabilityScore}%`, background: availColor }}
                    />
                  </div>
                  <LoadBar current={eng.currentLoad} max={eng.maxLoad} />
                  {eng.onCall && (
                    <div className="text-[7px] text-center" style={{ color: '#10b981' }}>
                      ● ON-CALL
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-[11px] font-semibold mb-3" style={{ color: DS.text.primary }}>
          Active Escalation Queue
        </div>
        <div className="space-y-3">
          {ESCALATIONS.map((esc) => (
            <EscalationCard key={esc.id} esc={esc} />
          ))}
        </div>
      </div>
    </div>
  );
}
