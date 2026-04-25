import { m } from 'framer-motion';
import {
  Activity,
  Layers,
  Plug,
  type Server,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useState } from 'react';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteNav } from '@/components/SiteNav';

const TABS = ['Registry', 'Health', 'Connectors', 'Feature Flags', 'Audit'] as const;
type Tab = (typeof TABS)[number];

const platformRegistry = [
  {
    name: 'SZL Holdings',
    slug: 'szl-holdings',
    type: 'Governed Platform',
    tier: 'Core',
    status: 'operational',
    uptime: '99.97%',
    version: '4.2.1',
    env: 'production',
    lastDeploy: '2026-03-28T14:22:00Z',
    owner: 'Stephen Lutar',
  },
  {
    name: 'Counsel',
    slug: 'alloy',
    type: 'Intelligence Engine',
    tier: 'Flagship',
    status: 'operational',
    uptime: '99.95%',
    version: '3.8.0',
    env: 'production',
    lastDeploy: '2026-03-27T09:15:00Z',
    owner: 'Platform Engineering',
  },
  {
    name: 'Command',
    slug: 'command',
    type: 'Decision Intelligence',
    tier: 'Flagship',
    status: 'operational',
    uptime: '99.92%',
    version: '2.6.3',
    env: 'production',
    lastDeploy: '2026-03-26T11:45:00Z',
    owner: 'Decision Intelligence Team',
  },
  {
    name: 'Vessels',
    slug: 'vessels',
    type: 'Maritime Command',
    tier: 'Flagship',
    status: 'operational',
    uptime: '99.98%',
    version: '3.1.2',
    env: 'production',
    lastDeploy: '2026-03-29T08:30:00Z',
    owner: 'Maritime Ops',
  },
  {
    name: 'Aegis',
    slug: 'aegis',
    type: 'Cyber Defense',
    tier: 'Platform',
    status: 'operational',
    uptime: '99.94%',
    version: '2.4.1',
    env: 'production',
    lastDeploy: '2026-03-25T16:20:00Z',
    owner: 'Security Engineering',
  },
  {
    name: 'APEX',
    slug: 'inca',
    type: 'AI Research Command',
    tier: 'Platform',
    status: 'operational',
    uptime: '99.89%',
    version: '2.1.0',
    env: 'production',
    lastDeploy: '2026-03-24T10:10:00Z',
    owner: 'AI Research',
  },
  {
    name: 'Terra',
    slug: 'terra',
    type: 'Portfolio Intelligence',
    tier: 'Platform',
    status: 'operational',
    uptime: '99.91%',
    version: '2.3.4',
    env: 'production',
    lastDeploy: '2026-03-28T13:55:00Z',
    owner: 'Real Estate Ops',
  },
  {
    name: 'Aegis Operations',
    slug: 'msp',
    type: 'Incident Command',
    tier: 'Platform',
    status: 'operational',
    uptime: '99.93%',
    version: '1.9.2',
    env: 'production',
    lastDeploy: '2026-03-27T15:40:00Z',
    owner: 'MSP Engineering',
  },
  {
    name: 'Carlota Jo',
    slug: 'carlota-jo',
    type: 'Premium Advisory',
    tier: 'Service',
    status: 'operational',
    uptime: '99.96%',
    version: '2.0.1',
    env: 'production',
    lastDeploy: '2026-03-23T14:00:00Z',
    owner: 'Advisory Services',
  },
  {
    name: 'SZL Leadership',
    slug: 'szl-leadership',
    type: 'Founder Identity',
    tier: 'Brand',
    status: 'operational',
    uptime: '99.99%',
    version: '2.0.0',
    env: 'production',
    lastDeploy: '2026-04-15T10:00:00Z',
    owner: 'Stephen Lutar',
  },
];

const healthServices = [
  {
    name: 'PostgreSQL Primary',
    type: 'Database',
    status: 'healthy',
    latency: '2.4ms',
    load: '34%',
    region: 'us-east-1',
  },
  {
    name: 'API Gateway',
    type: 'Compute',
    status: 'healthy',
    latency: '8ms',
    load: '22%',
    region: 'us-east-1',
  },
  {
    name: 'Authentication (OIDC)',
    type: 'Identity',
    status: 'healthy',
    latency: '45ms',
    load: '12%',
    region: 'global',
  },
  {
    name: 'Event Bus',
    type: 'Messaging',
    status: 'healthy',
    latency: '3ms',
    load: '18%',
    region: 'us-east-1',
  },
  {
    name: 'CDN Edge',
    type: 'Network',
    status: 'healthy',
    latency: '14ms',
    load: '41%',
    region: 'global',
  },
  {
    name: 'Object Storage',
    type: 'Storage',
    status: 'healthy',
    latency: '6ms',
    load: '28%',
    region: 'us-east-1',
  },
  {
    name: 'Redis Cache',
    type: 'Cache',
    status: 'healthy',
    latency: '0.8ms',
    load: '45%',
    region: 'us-east-1',
  },
  {
    name: 'AI Inference Proxy',
    type: 'AI/ML',
    status: 'healthy',
    latency: '120ms',
    load: '56%',
    region: 'us-east-1',
  },
];

const connectors = [
  {
    name: 'Stripe',
    category: 'Billing',
    status: 'connected',
    lastSync: '2 min ago',
    events: '12.4K/mo',
  },
  { name: 'OpenAI', category: 'AI/ML', status: 'connected', lastSync: 'Active', events: '8.2K/mo' },
  {
    name: 'Anthropic',
    category: 'AI/ML',
    status: 'connected',
    lastSync: 'Active',
    events: '3.1K/mo',
  },
  {
    name: 'GitHub',
    category: 'Source Control',
    status: 'connected',
    lastSync: '1 min ago',
    events: '2.8K/mo',
  },
  {
    name: 'Slack',
    category: 'Communication',
    status: 'connected',
    lastSync: 'Live',
    events: '5.6K/mo',
  },
  {
    name: 'Plausible',
    category: 'Analytics',
    status: 'connected',
    lastSync: '5 min ago',
    events: '44K/mo',
  },
  {
    name: 'Resend',
    category: 'Email',
    status: 'connected',
    lastSync: '12 min ago',
    events: '1.2K/mo',
  },
  {
    name: 'HubSpot',
    category: 'CRM',
    status: 'connected',
    lastSync: '8 min ago',
    events: '890/mo',
  },
  {
    name: 'CISA KEV',
    category: 'Gov. Data Feed',
    status: 'connected',
    lastSync: '6 hr ago',
    events: '340/mo',
  },
  {
    name: 'NVD CVE',
    category: 'Gov. Data Feed',
    status: 'connected',
    lastSync: '4 hr ago',
    events: '1.8K/mo',
  },
  {
    name: 'AIS Maritime',
    category: 'Domain Feed',
    status: 'connected',
    lastSync: '30 sec ago',
    events: '89K/mo',
  },
  {
    name: 'SEC EDGAR',
    category: 'Gov. Data Feed',
    status: 'connected',
    lastSync: '1 hr ago',
    events: '240/mo',
  },
];

const featureFlags = [
  {
    key: 'ai_copilot_v2',
    label: 'AI Copilot v2 (Streaming)',
    scope: 'All Platforms',
    enabled: true,
    rollout: 100,
    owner: 'AI Team',
  },
  {
    key: 'predictive_scoring',
    label: 'Predictive Risk Scoring',
    scope: 'Aegis, Vessels',
    enabled: true,
    rollout: 100,
    owner: 'Platform',
  },
  {
    key: 'real_time_alerts',
    label: 'Real-Time Push Alerts',
    scope: 'All Platforms',
    enabled: true,
    rollout: 85,
    owner: 'Platform',
  },
  {
    key: 'multi_agent_orchestration',
    label: 'Multi-Agent Orchestration',
    scope: 'Counsel, SZL Cortex',
    enabled: true,
    rollout: 60,
    owner: 'AI Team',
  },
  {
    key: 'demo_mode_global',
    label: 'Global Demo Mode',
    scope: 'All Platforms',
    enabled: true,
    rollout: 100,
    owner: 'Product',
  },
  {
    key: 'advanced_analytics',
    label: 'Advanced Analytics Export',
    scope: 'Lyte, Terra',
    enabled: false,
    rollout: 0,
    owner: 'Analytics',
  },
  {
    key: 'voice_interface',
    label: 'Voice Command Interface',
    scope: 'Aegis Operations, Aegis',
    enabled: false,
    rollout: 0,
    owner: 'AI Team',
  },
  {
    key: 'cross_platform_search',
    label: 'Cross-Platform Search',
    scope: 'SZL Holdings',
    enabled: true,
    rollout: 40,
    owner: 'Platform',
  },
];

const auditLog = [
  {
    id: 'AUD-2841',
    actor: 'Stephen Lutar',
    action: 'Feature flag updated',
    target: 'real_time_alerts → 85%',
    time: '12 min ago',
    severity: 'info',
  },
  {
    id: 'AUD-2840',
    actor: 'Platform CI',
    action: 'Deployment completed',
    target: 'Vessels v3.1.2 → production',
    time: '2 hr ago',
    severity: 'info',
  },
  {
    id: 'AUD-2839',
    actor: 'System',
    action: 'Health check recovered',
    target: 'AI Inference Proxy latency normalized',
    time: '4 hr ago',
    severity: 'warning',
  },
  {
    id: 'AUD-2838',
    actor: 'Stephen Lutar',
    action: 'Connector configured',
    target: 'SEC EDGAR feed activated',
    time: '6 hr ago',
    severity: 'info',
  },
  {
    id: 'AUD-2837',
    actor: 'Platform CI',
    action: 'Deployment completed',
    target: 'SZL Holdings v4.2.1 → production',
    time: '1 day ago',
    severity: 'info',
  },
  {
    id: 'AUD-2836',
    actor: 'Security Agent',
    action: 'Vulnerability scan completed',
    target: '0 critical, 2 medium findings',
    time: '1 day ago',
    severity: 'info',
  },
  {
    id: 'AUD-2835',
    actor: 'Stephen Lutar',
    action: 'Role assignment changed',
    target: 'Observer → Operator for demo account',
    time: '2 days ago',
    severity: 'warning',
  },
  {
    id: 'AUD-2834',
    actor: 'Platform CI',
    action: 'Deployment completed',
    target: 'Counsel v3.8.0 → production',
    time: '3 days ago',
    severity: 'info',
  },
];

const STATUS_COLORS: Record<string, string> = {
  operational: 'hsl(152,50%,42%)',
  degraded: 'hsl(38,88%,50%)',
  down: 'hsl(0,72%,52%)',
  healthy: 'hsl(152,50%,42%)',
  connected: 'hsl(152,50%,42%)',
  disconnected: 'hsl(0,72%,52%)',
};

const TIER_COLORS: Record<string, string> = {
  Core: 'hsl(38,55%,60%)',
  Flagship: 'hsl(218,72%,52%)',
  Platform: 'hsl(210,8%,66%)',
  Service: 'hsl(36,52%,54%)',
  Brand: 'hsl(210,8%,56%)',
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: typeof Server;
}) {
  return (
    <div
      style={{
        padding: '1.25rem 1.5rem',
        background: 'hsla(0,0%,100%,0.025)',
        border: '1px solid hsla(0,0%,100%,0.06)',
        borderRadius: '0.75rem',
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}
      >
        <Icon size={14} style={{ color: 'hsl(210,5%,42%)' }} />
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'hsl(210,5%,42%)',
          }}
        >
          {label}
        </span>
      </div>
      <p
        style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          letterSpacing: '-0.025em',
          color: 'hsl(38,12%,94%)',
          fontFamily: 'var(--font-display)',
        }}
      >
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: '11.5px', color: 'hsl(210,5%,48%)', marginTop: '0.25rem' }}>{sub}</p>
      )}
    </div>
  );
}

export default function ControlPlanePage() {
  const [activeTab, setActiveTab] = useState<Tab>('Registry');

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(210,12%,5%)' }}>
      <SiteNav />
      <main className="pt-24">
        <section style={{ padding: '3rem 0 2rem' }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'hsl(152,50%,42%)',
                  }}
                />
                <p
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'hsl(210,5%,42%)',
                  }}
                >
                  Internal Operations
                </p>
              </div>
              <h1
                style={{
                  fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  color: 'hsl(38,12%,94%)',
                  lineHeight: 1.1,
                  marginBottom: '0.75rem',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Governance API
              </h1>
              <p
                style={{
                  fontSize: '0.9375rem',
                  lineHeight: 1.7,
                  color: 'hsl(210,5%,58%)',
                  maxWidth: '34rem',
                }}
              >
                Centralized platform operations, service health, connector management, and feature
                governance across the SZL ecosystem.
              </p>
            </m.div>
          </div>
        </section>

        <section style={{ padding: '0 0 1.5rem' }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                label="Platforms"
                value={platformRegistry.length}
                sub="All operational"
                icon={Layers}
              />
              <StatCard
                label="Services"
                value={healthServices.length}
                sub="All healthy"
                icon={Activity}
              />
              <StatCard
                label="Connectors"
                value={connectors.length}
                sub="All connected"
                icon={Plug}
              />
              <StatCard
                label="Feature Flags"
                value={featureFlags.length}
                sub={`${featureFlags.filter((f) => f.enabled).length} enabled`}
                icon={ToggleRight}
              />
            </div>
          </div>
        </section>

        <section style={{ padding: '0 0 4rem' }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div
              style={{
                display: 'flex',
                gap: '0.25rem',
                marginBottom: '1.5rem',
                overflowX: 'auto',
                paddingBottom: '0.25rem',
              }}
            >
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '12.5px',
                    fontWeight: 500,
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    background: activeTab === tab ? 'hsla(0,0%,100%,0.08)' : 'transparent',
                    color: activeTab === tab ? 'hsl(38,12%,94%)' : 'hsl(210,5%,48%)',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'Registry' && (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  style={{
                    background: 'hsla(0,0%,100%,0.02)',
                    border: '1px solid hsla(0,0%,100%,0.06)',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    className="hidden md:grid"
                    style={{
                      gridTemplateColumns: '2fr 1.2fr 0.8fr 0.8fr 0.8fr 1fr 1.2fr',
                      padding: '0.75rem 1.25rem',
                      borderBottom: '1px solid hsla(0,0%,100%,0.06)',
                    }}
                  >
                    {['Platform', 'Type', 'Tier', 'Status', 'Uptime', 'Version', 'Last Deploy'].map(
                      (h) => (
                        <span
                          key={h}
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: 'hsl(210,5%,38%)',
                          }}
                        >
                          {h}
                        </span>
                      ),
                    )}
                  </div>
                  {platformRegistry.map((p, i) => (
                    <m.div
                      key={p.slug}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.35 }}
                      className="grid grid-cols-2 md:grid-cols-[2fr_1.2fr_0.8fr_0.8fr_0.8fr_1fr_1.2fr]"
                      style={{
                        padding: '0.875rem 1.25rem',
                        borderBottom:
                          i < platformRegistry.length - 1
                            ? '1px solid hsla(0,0%,100%,0.04)'
                            : 'none',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: STATUS_COLORS[p.status],
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(38,12%,92%)' }}
                        >
                          {p.name}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'hsl(210,5%,54%)' }}>{p.type}</span>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: `${TIER_COLORS[p.tier]}12`,
                          border: `1px solid ${TIER_COLORS[p.tier]}25`,
                          color: TIER_COLORS[p.tier],
                          width: 'fit-content',
                        }}
                      >
                        {p.tier}
                      </span>
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 500,
                          color: STATUS_COLORS[p.status],
                        }}
                      >
                        {p.status}
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          color: 'hsl(210,5%,54%)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {p.uptime}
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          color: 'hsl(210,5%,48%)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        v{p.version}
                      </span>
                      <span style={{ fontSize: '11.5px', color: 'hsl(210,5%,42%)' }}>
                        {new Date(p.lastDeploy).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </m.div>
                  ))}
                </div>
              </m.div>
            )}

            {activeTab === 'Health' && (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                {healthServices.map((s, i) => (
                  <m.div
                    key={s.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.35 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.25rem',
                      background: 'hsla(0,0%,100%,0.025)',
                      border: '1px solid hsla(0,0%,100%,0.06)',
                      borderRadius: '0.75rem',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        minWidth: '200px',
                      }}
                    >
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: STATUS_COLORS[s.status],
                        }}
                      />
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(38,12%,92%)' }}>
                          {s.name}
                        </p>
                        <p style={{ fontSize: '11px', color: 'hsl(210,5%,42%)' }}>
                          {s.type} · {s.region}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                      <div>
                        <p
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: 'hsl(210,5%,38%)',
                          }}
                        >
                          Latency
                        </p>
                        <p
                          style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'hsl(38,12%,88%)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {s.latency}
                        </p>
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: 'hsl(210,5%,38%)',
                          }}
                        >
                          Load
                        </p>
                        <p
                          style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'hsl(38,12%,88%)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {s.load}
                        </p>
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: 'hsl(210,5%,38%)',
                          }}
                        >
                          Status
                        </p>
                        <p
                          style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: STATUS_COLORS[s.status],
                          }}
                        >
                          {s.status}
                        </p>
                      </div>
                    </div>
                  </m.div>
                ))}
              </m.div>
            )}

            {activeTab === 'Connectors' && (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {connectors.map((c, i) => (
                    <m.div
                      key={c.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.35 }}
                      style={{
                        padding: '1.125rem 1.25rem',
                        background: 'hsla(0,0%,100%,0.025)',
                        border: '1px solid hsla(0,0%,100%,0.06)',
                        borderRadius: '0.75rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <p
                          style={{ fontSize: '13.5px', fontWeight: 600, color: 'hsl(38,12%,92%)' }}
                        >
                          {c.name}
                        </p>
                        <div
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: STATUS_COLORS[c.status],
                          }}
                        />
                      </div>
                      <p
                        style={{
                          fontSize: '11px',
                          color: 'hsl(210,5%,48%)',
                          marginBottom: '0.75rem',
                        }}
                      >
                        {c.category}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', color: 'hsl(210,5%,42%)' }}>
                          Sync: {c.lastSync}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            color: 'hsl(210,5%,42%)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {c.events}
                        </span>
                      </div>
                    </m.div>
                  ))}
                </div>
              </m.div>
            )}

            {activeTab === 'Feature Flags' && (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-2"
              >
                {featureFlags.map((f, i) => (
                  <m.div
                    key={f.key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.35 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.25rem',
                      background: 'hsla(0,0%,100%,0.025)',
                      border: '1px solid hsla(0,0%,100%,0.06)',
                      borderRadius: '0.75rem',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.25rem',
                        }}
                      >
                        {f.enabled ? (
                          <ToggleRight size={16} style={{ color: 'hsl(152,50%,42%)' }} />
                        ) : (
                          <ToggleLeft size={16} style={{ color: 'hsl(210,5%,32%)' }} />
                        )}
                        <p
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: f.enabled ? 'hsl(38,12%,92%)' : 'hsl(210,5%,50%)',
                          }}
                        >
                          {f.label}
                        </p>
                      </div>
                      <p
                        style={{ fontSize: '11px', color: 'hsl(210,5%,42%)', marginLeft: '1.5rem' }}
                      >
                        {f.scope}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div>
                        <p
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: 'hsl(210,5%,38%)',
                          }}
                        >
                          Rollout
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div
                            style={{
                              width: '48px',
                              height: '4px',
                              borderRadius: '2px',
                              background: 'hsla(0,0%,100%,0.06)',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${f.rollout}%`,
                                height: '100%',
                                borderRadius: '2px',
                                background: f.enabled ? 'hsl(152,50%,42%)' : 'hsl(210,5%,24%)',
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: '11.5px',
                              fontFamily: 'var(--font-mono)',
                              color: 'hsl(210,5%,54%)',
                            }}
                          >
                            {f.rollout}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: 'hsl(210,5%,38%)',
                          }}
                        >
                          Owner
                        </p>
                        <p style={{ fontSize: '12px', color: 'hsl(210,5%,54%)' }}>{f.owner}</p>
                      </div>
                    </div>
                  </m.div>
                ))}
              </m.div>
            )}

            {activeTab === 'Audit' && (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  style={{
                    background: 'hsla(0,0%,100%,0.02)',
                    border: '1px solid hsla(0,0%,100%,0.06)',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                  }}
                >
                  {auditLog.map((e, i) => (
                    <m.div
                      key={e.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        padding: '1rem 1.25rem',
                        borderBottom:
                          i < auditLog.length - 1 ? '1px solid hsla(0,0%,100%,0.04)' : 'none',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          color: 'hsl(210,5%,36%)',
                          minWidth: '72px',
                          flexShrink: 0,
                        }}
                      >
                        {e.id}
                      </span>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.2rem',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '12.5px',
                              fontWeight: 600,
                              color: 'hsl(38,12%,88%)',
                            }}
                          >
                            {e.actor}
                          </span>
                          <span style={{ fontSize: '12px', color: 'hsl(210,5%,54%)' }}>
                            {e.action}
                          </span>
                        </div>
                        <p style={{ fontSize: '11.5px', color: 'hsl(210,5%,44%)' }}>{e.target}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 500,
                            padding: '2px 6px',
                            borderRadius: '3px',
                            background:
                              e.severity === 'warning'
                                ? 'hsla(38,88%,50%,0.1)'
                                : 'hsla(210,8%,50%,0.1)',
                            color: e.severity === 'warning' ? 'hsl(38,88%,50%)' : 'hsl(210,5%,54%)',
                            border: `1px solid ${e.severity === 'warning' ? 'hsla(38,88%,50%,0.2)' : 'hsla(210,8%,50%,0.15)'}`,
                          }}
                        >
                          {e.severity}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            color: 'hsl(210,5%,38%)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {e.time}
                        </span>
                      </div>
                    </m.div>
                  ))}
                </div>
              </m.div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
