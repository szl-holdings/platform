import { EnvironmentLabel } from '@szl-holdings/shared-ui/alloy-decision-card';
import { AlertTriangle, CheckCircle, Clock, Network, WifiOff } from 'lucide-react';
import { useState } from 'react';

const BG = { page: '#080c14', surface: '#0c1018', elevated: '#10141e' } as const;
const BORDER = { subtle: 'rgba(255,255,255,0.04)', muted: 'rgba(255,255,255,0.07)' } as const;
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
  muted: 'rgba(255,255,255,0.14)',
} as const;
const ACCENT = '#d4a054';

type IntegrationStatus = 'healthy' | 'degraded' | 'down' | 'unknown';
type FilterValue = 'all' | IntegrationStatus;

interface IntegrationConfig {
  [key: string]: string | number | boolean | string[];
}

interface Integration {
  id: string;
  name: string;
  category: string;
  icon: string;
  status: IntegrationStatus;
  latency: string;
  successRate: number;
  lastCheck: string;
  workspace: string;
  eventsToday: number;
  errorsToday: number;
  config: IntegrationConfig;
  alert?: string;
}

interface UptimeBar {
  day: number;
  hasIssue: boolean;
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'slack',
    name: 'Slack',
    category: 'Notifications',
    icon: '💬',
    status: 'degraded',
    latency: '504ms',
    successRate: 82.3,
    lastCheck: '32s ago',
    workspace: '@acme',
    eventsToday: 31,
    errorsToday: 4,
    alert: 'Webhook timeouts — connector unreachable intermittently',
    config: { webhookUrl: 'https://hooks.slack.com/...', channel: '#lyte-alerts', retries: 3 },
  },
  {
    id: 'jira',
    name: 'Jira',
    category: 'Project Management',
    icon: '📋',
    status: 'healthy',
    latency: '214ms',
    successRate: 99.8,
    lastCheck: '12s ago',
    workspace: 'acme.atlassian.net',
    eventsToday: 88,
    errorsToday: 0,
    config: { project: 'OPS', issueType: 'Task', defaultAssignee: 'unassigned' },
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'Code & CI',
    icon: '🐙',
    status: 'healthy',
    latency: '128ms',
    successRate: 100,
    lastCheck: '8s ago',
    workspace: 'acme-org',
    eventsToday: 142,
    errorsToday: 0,
    config: { repos: ['platform', 'backend', 'frontend'], webhookEvents: ['push', 'pr', 'review'] },
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    category: 'Data Source',
    icon: '🐘',
    status: 'healthy',
    latency: '4ms',
    successRate: 100,
    lastCheck: '4s ago',
    workspace: 'prod-db.acme.io',
    eventsToday: 18400,
    errorsToday: 0,
    config: { pool: 10, queryTimeout: '30s', readOnly: false },
  },
  {
    id: 'azure-ad',
    name: 'Azure AD / SCIM',
    category: 'Identity',
    icon: '🔒',
    status: 'healthy',
    latency: '88ms',
    successRate: 99.6,
    lastCheck: '1m ago',
    workspace: 'acme.onmicrosoft.com',
    eventsToday: 24,
    errorsToday: 0,
    config: { tenantId: 'xxx-yyy-zzz', scimEndpoint: '/scim/v2', syncInterval: '15m' },
  },
  {
    id: 'email',
    name: 'Email (SMTP)',
    category: 'Notifications',
    icon: '📧',
    status: 'healthy',
    latency: '312ms',
    successRate: 98.2,
    lastCheck: '45s ago',
    workspace: 'alerts@acme.io',
    eventsToday: 14,
    errorsToday: 0,
    config: { host: 'smtp.sendgrid.net', from: 'alerts@acme.io', tls: true },
  },
  {
    id: 'webhook-generic',
    name: 'Generic Webhooks',
    category: 'Outbound',
    icon: '🔗',
    status: 'healthy',
    latency: '188ms',
    successRate: 97.4,
    lastCheck: '18s ago',
    workspace: '5 configured',
    eventsToday: 63,
    errorsToday: 1,
    config: { endpoints: 5, signatureSecret: 'configured', retries: 3 },
  },
  {
    id: 'openai',
    name: 'OpenAI (via Alloy)',
    category: 'AI Inference',
    icon: '🧠',
    status: 'healthy',
    latency: '842ms',
    successRate: 99.1,
    lastCheck: '12s ago',
    workspace: 'org:acme-ai',
    eventsToday: 184,
    errorsToday: 1,
    config: { models: ['gpt-4o', 'gpt-4o-mini'], maxTokens: 128000, budgetAlert: true },
  },
];

interface StatusStyle {
  color: string;
  bg: string;
  label: string;
  icon: React.ElementType;
}

const STATUS_CONFIG: Record<IntegrationStatus, StatusStyle> = {
  healthy: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', label: 'Healthy', icon: CheckCircle },
  degraded: {
    color: '#f97316',
    bg: 'rgba(249,115,22,0.1)',
    label: 'Degraded',
    icon: AlertTriangle,
  },
  down: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Down', icon: WifiOff },
  unknown: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: 'Unknown', icon: Clock },
};

function renderConfigValue(value: IntegrationConfig[string]): string {
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

function IntegrationCard({
  integration,
  selected,
  onClick,
}: {
  integration: Integration;
  selected: boolean;
  onClick: () => void;
}) {
  const s = STATUS_CONFIG[integration.status];
  const Icon = s.icon;
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3.5 transition-all hover:bg-white/[0.02]"
      style={{
        borderBottom: `1px solid ${BORDER.subtle}`,
        background: selected ? 'rgba(212,160,84,0.04)' : undefined,
        borderLeft: selected ? `2px solid ${ACCENT}` : '2px solid transparent',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
            style={{ background: BG.elevated }}
          >
            {integration.icon}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold truncate" style={{ color: TEXT.primary }}>
              {integration.name}
            </p>
            <p className="text-[10px]" style={{ color: TEXT.tertiary }}>
              {integration.category} · {integration.workspace}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p
              className="text-[11px] font-mono"
              style={{ color: integration.successRate > 95 ? '#22c55e' : '#f97316' }}
            >
              {integration.successRate}%
            </p>
            <p className="text-[9px]" style={{ color: TEXT.muted }}>
              success
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-mono" style={{ color: TEXT.secondary }}>
              {integration.latency}
            </p>
            <p className="text-[9px]" style={{ color: TEXT.muted }}>
              latency
            </p>
          </div>
          <div
            className="rounded-full px-2 py-0.5 text-[10px] font-medium flex items-center gap-1"
            style={{ background: s.bg, color: s.color }}
          >
            <Icon className="w-2.5 h-2.5" />
            {s.label}
          </div>
        </div>
      </div>
      {integration.alert && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px]" style={{ color: '#f97316' }}>
          <AlertTriangle className="w-3 h-3 shrink-0" />
          {integration.alert}
        </div>
      )}
    </button>
  );
}

interface DetailMetric {
  label: string;
  value: string;
  color: string;
}

function IntegrationDetail({ integration }: { integration: Integration }) {
  const s = STATUS_CONFIG[integration.status];
  const Icon = s.icon;

  const detailMetrics: DetailMetric[] = [
    {
      label: 'Success rate',
      value: `${integration.successRate}%`,
      color: integration.successRate > 95 ? '#22c55e' : '#f97316',
    },
    { label: 'Avg latency', value: integration.latency, color: TEXT.secondary },
    { label: 'Last checked', value: integration.lastCheck, color: TEXT.secondary },
    { label: 'Events today', value: String(integration.eventsToday), color: ACCENT },
    {
      label: 'Errors today',
      value: String(integration.errorsToday),
      color: integration.errorsToday > 0 ? '#f97316' : '#22c55e',
    },
    { label: 'Status', value: s.label, color: s.color },
  ];

  const uptimeBars: UptimeBar[] = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    hasIssue: integration.id === 'slack' && (i === 28 || i === 29),
  }));

  return (
    <div className="h-full overflow-y-auto" style={{ background: BG.surface }}>
      <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: BG.elevated }}
            >
              {integration.icon}
            </div>
            <div>
              <p className="text-[13px] font-semibold" style={{ color: TEXT.primary }}>
                {integration.name}
              </p>
              <p className="text-[11px]" style={{ color: TEXT.tertiary }}>
                {integration.category} · {integration.workspace}
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium"
            style={{ background: s.bg, color: s.color }}
          >
            <Icon className="w-3.5 h-3.5" />
            {s.label}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {detailMetrics.map((m) => (
            <div
              key={m.label}
              className="rounded-md px-3 py-2.5"
              style={{ background: BG.elevated }}
            >
              <p className="text-[10px] mb-1" style={{ color: TEXT.muted }}>
                {m.label}
              </p>
              <p className="text-[12px] font-mono font-semibold" style={{ color: m.color }}>
                {m.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {integration.alert && (
        <div
          className="mx-4 mt-4 rounded-lg px-4 py-3 flex items-start gap-2.5"
          style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}
        >
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#f97316' }} />
          <div>
            <p className="text-[11px] font-medium mb-1" style={{ color: '#f97316' }}>
              Integration alert
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(249,115,22,0.8)' }}>
              {integration.alert}
            </p>
          </div>
        </div>
      )}

      <div className="px-4 py-4">
        <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: TEXT.muted }}>
          Configuration
        </p>
        <div
          className="rounded-md overflow-hidden"
          style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
        >
          {Object.entries(integration.config).map(([key, value], i, arr) => (
            <div
              key={key}
              className="flex items-center justify-between px-4 py-2.5"
              style={{
                borderBottom: i < arr.length - 1 ? `1px solid ${BORDER.subtle}` : undefined,
              }}
            >
              <span className="text-[11px]" style={{ color: TEXT.tertiary }}>
                {key}
              </span>
              <span className="text-[11px] font-mono" style={{ color: TEXT.secondary }}>
                {renderConfigValue(value)}
              </span>
            </div>
          ))}
        </div>

        <p
          className="text-[10px] uppercase tracking-widest mb-3 mt-4"
          style={{ color: TEXT.muted }}
        >
          Uptime (last 30d)
        </p>
        <div className="flex gap-0.5">
          {uptimeBars.map((bar) => (
            <div
              key={bar.day}
              className="flex-1 h-8 rounded-sm"
              style={{ background: bar.hasIssue ? 'rgba(249,115,22,0.4)' : 'rgba(34,197,94,0.35)' }}
              title={`Day ${bar.day}`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1 text-[9px]" style={{ color: TEXT.muted }}>
          <span>30d ago</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}

export default function AlloyIntegrationHealthPage() {
  const [selected, setSelected] = useState<string>('slack');
  const [filter, setFilter] = useState<FilterValue>('all');
  const selectedIntegration = INTEGRATIONS.find((i) => i.id === selected);

  const counts: Record<IntegrationStatus, number> = {
    healthy: INTEGRATIONS.filter((i) => i.status === 'healthy').length,
    degraded: INTEGRATIONS.filter((i) => i.status === 'degraded').length,
    down: INTEGRATIONS.filter((i) => i.status === 'down').length,
    unknown: INTEGRATIONS.filter((i) => i.status === 'unknown').length,
  };

  const filterOptions: FilterValue[] = ['all', 'healthy', 'degraded'];
  const filtered =
    filter === 'all' ? INTEGRATIONS : INTEGRATIONS.filter((i) => i.status === filter);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: BG.page }}>
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: `1px solid ${BORDER.subtle}` }}
      >
        <div className="flex items-center gap-2.5">
          <Network className="w-4 h-4" style={{ color: ACCENT }} />
          <span className="text-[13px] font-semibold" style={{ color: TEXT.primary }}>
            Integration Health
          </span>
          <EnvironmentLabel environment="demo" />
        </div>
        <div className="flex gap-2">
          {filterOptions.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="rounded-full px-2.5 py-1 text-[10px] font-medium capitalize transition-all"
              style={{
                background: filter === f ? `${ACCENT}18` : 'rgba(255,255,255,0.04)',
                color: filter === f ? ACCENT : TEXT.tertiary,
              }}
            >
              {f}
              {f !== 'all' ? ` (${counts[f as IntegrationStatus]})` : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-[320px_1fr] overflow-hidden">
        <div className="overflow-y-auto" style={{ borderRight: `1px solid ${BORDER.subtle}` }}>
          <div
            className="px-4 py-2.5 flex items-center gap-4 text-[11px]"
            style={{ borderBottom: `1px solid ${BORDER.subtle}`, background: BG.elevated }}
          >
            <span style={{ color: '#22c55e' }}>{counts.healthy} healthy</span>
            {counts.degraded > 0 && (
              <span style={{ color: '#f97316' }}>{counts.degraded} degraded</span>
            )}
            {counts.down > 0 && <span style={{ color: '#ef4444' }}>{counts.down} down</span>}
          </div>
          {filtered.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              selected={selected === integration.id}
              onClick={() => setSelected(integration.id)}
            />
          ))}
        </div>
        {selectedIntegration && <IntegrationDetail integration={selectedIntegration} />}
      </div>
    </div>
  );
}
