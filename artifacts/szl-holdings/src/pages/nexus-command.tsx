import { m } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Briefcase,
  ChevronRight,
  Clock,
  DollarSign,
  Eye,
  Globe,
  Layers,
  Scale,
  Shield,
  Ship,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { DataStateBadge } from '@/components/DataStateBadge';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteNav } from '@/components/SiteNav';

const PLATFORMS = [
  {
    key: 'lyte',
    name: 'KORA',
    desc: 'Business Observability',
    accent: '#22d3ee',
    icon: Eye,
    status: 'operational',
    uptime: '99.97%',
    latency: '12ms',
  },
  {
    key: 'vessels',
    name: 'SEXTANT',
    desc: 'Maritime Intelligence',
    accent: '#38bdf8',
    icon: Ship,
    status: 'operational',
    uptime: '99.92%',
    latency: '18ms',
  },
  {
    key: 'aegis',
    name: 'PARAGON',
    desc: 'Defense & Intel Command',
    accent: '#818cf8',
    icon: Shield,
    status: 'operational',
    uptime: '99.99%',
    latency: '8ms',
  },
  {
    key: 'terra',
    name: 'DOMAINE',
    desc: 'Real Estate Intelligence',
    accent: '#4ade80',
    icon: BarChart3,
    status: 'operational',
    uptime: '99.95%',
    latency: '15ms',
  },
  {
    key: 'prism',
    name: 'Counsel',
    desc: 'Legal Matter Command',
    accent: '#d4a054',
    icon: Scale,
    status: 'operational',
    uptime: '99.94%',
    latency: '22ms',
  },
  {
    key: 'continuum',
    name: 'Counsel',
    desc: 'Execution Fabric',
    accent: '#60a5fa',
    icon: Layers,
    status: 'operational',
    uptime: '99.98%',
    latency: '6ms',
  },
];

const AGGREGATE_KPIS = [
  {
    label: 'Total Revenue',
    value: '$4.2M',
    change: '+12.4%',
    up: true,
    icon: DollarSign,
    accent: '#3b82f6',
  },
  {
    label: 'Active Incidents',
    value: '7',
    change: '-23%',
    up: false,
    icon: AlertTriangle,
    accent: '#f59e0b',
  },
  {
    label: 'Fleet SEXTANT',
    value: '847',
    change: '+5.1%',
    up: true,
    icon: Ship,
    accent: '#38bdf8',
  },
  {
    label: 'Distress Properties',
    value: '1,429',
    change: '+8.7%',
    up: true,
    icon: Target,
    accent: '#4ade80',
  },
  {
    label: 'Security Findings',
    value: '23',
    change: '-41%',
    up: false,
    icon: Shield,
    accent: '#818cf8',
  },
  {
    label: 'Client Inquiries',
    value: '34',
    change: '+15%',
    up: true,
    icon: Users,
    accent: '#d4a054',
  },
];

const ACTIONS = [
  {
    id: 'A-1',
    title: 'Resolve C2 beacon alert — APT29 infrastructure detected',
    urgency: 'immediate' as const,
    owner: 'J. Chen',
    team: 'PARAGON SOC',
    due: '30m',
    value: 2400000,
  },
  {
    id: 'A-2',
    title: 'Approve vessel route deviation — MV Pacific Horizon sanctions zone',
    urgency: 'immediate' as const,
    owner: 'S. Park',
    team: 'SEXTANT Ops',
    due: '1h',
    value: 850000,
  },
  {
    id: 'A-3',
    title: 'Finalize demand package — Rodriguez v. National General',
    urgency: 'today' as const,
    owner: 'L. Martinez',
    team: 'PRAXIS Legal',
    due: '5h',
    value: 320000,
  },
  {
    id: 'A-4',
    title: 'Review distress scoring model update — Brooklyn submarket',
    urgency: 'today' as const,
    owner: 'M. Thompson',
    team: 'DOMAINE Engine',
    due: 'EOD',
    value: 1200000,
  },
  {
    id: 'A-5',
    title: 'Deploy Counsel workflow v3.2 — cross-platform signal routing',
    urgency: 'this_week' as const,
    owner: 'K. Nguyen',
    team: 'Counsel Core',
    due: 'Wed',
    value: 0,
  },
];

const THREAT_FEED = [
  { tag: 'CRITICAL', msg: 'APT29 lateral movement — DC-PROD-03', color: '#ef4444', time: '2m ago' },
  {
    tag: 'HIGH',
    msg: 'Sanctions match — MV Pacific Horizon crew manifest',
    color: '#f97316',
    time: '18m ago',
  },
  { tag: 'HIGH', msg: 'S3 exfil pattern — 3 buckets flagged', color: '#f97316', time: '34m ago' },
  {
    tag: 'MEDIUM',
    msg: 'Brute force campaign — 847 attempts blocked',
    color: '#eab308',
    time: '1h ago',
  },
  { tag: 'INFO', msg: '14 new IOCs added to block list', color: '#3b82f6', time: '2h ago' },
];

const CLIENT_PIPELINE = [
  {
    name: 'Meridian Capital',
    stage: 'Proposal',
    value: '$1.2M',
    confidence: 87,
    accent: '#3b82f6',
  },
  {
    name: 'Apex Maritime Group',
    stage: 'Negotiation',
    value: '$840K',
    confidence: 72,
    accent: '#38bdf8',
  },
  {
    name: 'Hartford Insurance',
    stage: 'Active',
    value: '$2.1M',
    confidence: 95,
    accent: '#4ade80',
  },
  {
    name: 'Brookfield RE Partners',
    stage: 'Pilot',
    value: '$650K',
    confidence: 64,
    accent: '#f59e0b',
  },
];

const URGENCY_CONFIG = {
  immediate: {
    color: '#ef4444',
    label: 'IMMEDIATE',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
  },
  today: {
    color: '#f59e0b',
    label: 'TODAY',
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.15)',
  },
  this_week: {
    color: '#3b82f6',
    label: 'THIS WEEK',
    bg: 'rgba(59,130,246,0.05)',
    border: 'rgba(59,130,246,0.12)',
  },
};

function LivePulse({ accent, size = 8 }: { accent: string; size?: number }) {
  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        width: `${size}px`,
        height: `${size}px`,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          backgroundColor: accent,
          opacity: 0.35,
          animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
        }}
      />
      <span
        style={{
          position: 'relative',
          borderRadius: '50%',
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: accent,
        }}
      />
    </span>
  );
}

function KPITile({
  label,
  value,
  change,
  up,
  icon: Icon,
  accent,
  delay,
}: (typeof AGGREGATE_KPIS)[0] & { delay: number }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        padding: '1rem',
        borderRadius: '12px',
        background: `radial-gradient(ellipse at top left, ${accent}08 0%, rgba(255,255,255,0.015) 60%)`,
        border: `1px solid ${accent}18`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, ${accent}60, transparent)`,
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '0.75rem',
        }}
      >
        <div
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            background: `${accent}12`,
            border: `1px solid ${accent}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={12} style={{ color: accent }} />
        </div>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: up ? '#10b981' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
          }}
        >
          <TrendingUp size={9} style={{ transform: up ? 'none' : 'scaleY(-1)' }} />
          {change}
        </span>
      </div>
      <div
        style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          color: accent,
          letterSpacing: '-0.04em',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: '10px',
          color: 'hsl(210,5%,45%)',
          marginTop: '0.25rem',
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </div>
    </m.div>
  );
}

function PlatformCard({ platform, delay }: { platform: (typeof PLATFORMS)[0]; delay: number }) {
  const Icon = platform.icon;
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ borderColor: `${platform.accent}30`, transition: { duration: 0.15 } }}
      style={{
        padding: '0.875rem',
        borderRadius: '10px',
        background: `${platform.accent}05`,
        border: `1px solid ${platform.accent}12`,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: `${platform.accent}10`,
          border: `1px solid ${platform.accent}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={14} style={{ color: platform.accent }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(210,10%,90%)' }}>
            {platform.name}
          </span>
          <LivePulse accent="#10b981" size={5} />
        </div>
        <span style={{ fontSize: '10px', color: 'hsl(210,5%,45%)' }}>{platform.desc}</span>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981' }}>{platform.uptime}</div>
        <div style={{ fontSize: '9px', color: 'hsl(210,5%,38%)' }}>{platform.latency}</div>
      </div>
    </m.div>
  );
}

function ActionRow({ action, delay }: { action: (typeof ACTIONS)[0]; delay: number }) {
  const u = URGENCY_CONFIG[action.urgency];
  return (
    <m.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay }}
      style={{
        padding: '0.75rem 1rem',
        borderRadius: '10px',
        background: u.bg,
        border: `1px solid ${u.border}`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '3px',
          borderRadius: '10px 0 0 10px',
          background: u.color,
        }}
      />
      <div style={{ flex: 1, minWidth: 0, paddingLeft: '0.25rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.375rem',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: '8px',
              fontWeight: 800,
              letterSpacing: '0.1em',
              color: u.color,
              padding: '1px 6px',
              borderRadius: '3px',
              background: `${u.color}15`,
              border: `1px solid ${u.color}25`,
            }}
          >
            {u.label}
          </span>
          <span style={{ fontSize: '10px', color: 'hsl(210,5%,42%)' }}>
            <Clock
              size={9}
              style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }}
            />
            Due {action.due}
          </span>
        </div>
        <div
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: 'hsl(210,10%,88%)',
            lineHeight: 1.5,
            marginBottom: '0.25rem',
          }}
        >
          {action.title}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '10px',
            color: 'hsl(210,5%,40%)',
          }}
        >
          <span>{action.owner}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>{action.team}</span>
          {action.value > 0 && (
            <>
              <span style={{ opacity: 0.4 }}>·</span>
              <span style={{ color: '#4ade80', fontWeight: 600 }}>
                ${(action.value / 1e6).toFixed(1)}M at risk
              </span>
            </>
          )}
        </div>
      </div>
    </m.div>
  );
}

function ThreatRow({ item }: { item: (typeof THREAT_FEED)[0] }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.625rem',
        padding: '0.5rem 0',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
      }}
    >
      <span
        style={{
          fontSize: '8px',
          fontWeight: 800,
          letterSpacing: '0.08em',
          color: item.color,
          fontFamily: 'monospace',
          flexShrink: 0,
          marginTop: '2px',
        }}
      >
        [{item.tag}]
      </span>
      <span style={{ fontSize: '11px', color: 'hsl(210,5%,60%)', flex: 1, lineHeight: 1.5 }}>
        {item.msg}
      </span>
      <span style={{ fontSize: '9px', color: 'hsl(210,5%,35%)', flexShrink: 0 }}>{item.time}</span>
    </div>
  );
}

function PipelineRow({ client, delay }: { client: (typeof CLIENT_PIPELINE)[0]; delay: number }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.625rem 0',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
      }}
    >
      <div
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: client.accent,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(210,10%,88%)' }}>
          {client.name}
        </div>
        <div style={{ fontSize: '10px', color: 'hsl(210,5%,42%)' }}>{client.stage}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: client.accent }}>
          {client.value}
        </div>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end' }}
        >
          <div
            style={{
              width: '40px',
              height: '3px',
              borderRadius: '2px',
              background: 'rgba(255,255,255,0.06)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${client.confidence}%`,
                height: '100%',
                background: client.accent,
                borderRadius: '2px',
              }}
            />
          </div>
          <span style={{ fontSize: '9px', color: 'hsl(210,5%,40%)' }}>{client.confidence}%</span>
        </div>
      </div>
    </m.div>
  );
}

function SectionHeader({
  title,
  icon: Icon,
  accent,
  action,
}: {
  title: string;
  icon: React.ElementType;
  accent: string;
  action?: { label: string; href: string };
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.875rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: `${accent}12`,
            border: `1px solid ${accent}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={11} style={{ color: accent }} />
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: 'hsl(210,5%,55%)',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </span>
      </div>
      {action && (
        <Link href={action.href}>
          <span
            style={{
              fontSize: '10px',
              color: accent,
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              cursor: 'pointer',
              opacity: 0.7,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = '0.7';
            }}
          >
            {action.label} <ChevronRight size={10} />
          </span>
        </Link>
      )}
    </div>
  );
}

export default function PRAXISCommandPage() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    document.title = 'PRAXIS Command — SZL Holdings';
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const totalPipelineValue = CLIENT_PIPELINE.reduce(
    (s, c) => s + parseFloat(c.value.replace(/[$KM,]/g, '')) * (c.value.includes('M') ? 1e6 : 1e3),
    0,
  );
  const immediateActions = ACTIONS.filter((a) => a.urgency === 'immediate').length;
  const totalAtRisk = ACTIONS.reduce((s, a) => s + a.value, 0);

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(220,14%,4%)', position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '-25%',
            left: '5%',
            width: '55vw',
            height: '55vw',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(96,165,250,0.04) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            right: '0',
            width: '40vw',
            height: '40vw',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(129,140,248,0.03) 0%, transparent 70%)',
          }}
        />
      </div>
      <SiteNav />
      <main className="pt-24" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '2rem 0 4rem' }}>
          <div className="max-w-[1360px] mx-auto px-6 lg:px-10">
            <m.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <DataStateBadge
                state="DEMO DATA"
                position="top-left"
                style={{
                  position: 'relative',
                  top: 'auto',
                  left: 'auto',
                  display: 'inline-flex',
                  marginBottom: '0.5rem',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  marginBottom: '0.375rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background:
                        'linear-gradient(135deg, rgba(96,165,250,0.2), rgba(129,140,248,0.12))',
                      border: '1px solid rgba(96,165,250,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Globe size={17} style={{ color: '#60a5fa' }} />
                  </div>
                  <div>
                    <h1
                      style={{
                        fontSize: 'clamp(1.5rem, 2.8vw, 2rem)',
                        fontWeight: 800,
                        letterSpacing: '-0.035em',
                        color: 'hsl(210,10%,95%)',
                        lineHeight: 1,
                      }}
                    >
                      PRAXIS Command
                    </h1>
                    <p style={{ fontSize: '11px', color: 'hsl(210,5%,40%)', marginTop: '2px' }}>
                      Unified ecosystem intelligence · {now.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {immediateActions > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.18)',
                      }}
                    >
                      <LivePulse accent="#ef4444" size={6} />
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444' }}>
                        {immediateActions} IMMEDIATE
                      </span>
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'rgba(16,185,129,0.06)',
                      border: '1px solid rgba(16,185,129,0.15)',
                    }}
                  >
                    <LivePulse accent="#10b981" size={5} />
                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#10b981' }}>
                      ALL SYSTEMS OPERATIONAL
                    </span>
                  </div>
                </div>
              </div>
            </m.div>

            <div style={{ marginTop: '1.75rem' }}>
              <SectionHeader
                title="Ecosystem KPIs"
                icon={Zap}
                accent="#60a5fa"
                action={{ label: 'Full Dashboard', href: '/kpis' }}
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {AGGREGATE_KPIS.map((kpi, i) => (
                  <KPITile key={kpi.label} {...kpi} delay={i * 0.04} />
                ))}
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-5" style={{ marginTop: '2rem' }}>
              <div className="lg:col-span-7 space-y-5">
                <m.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  style={{
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '1.25rem',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background:
                        'linear-gradient(90deg, rgba(239,68,68,0.5), rgba(245,158,11,0.3), transparent)',
                    }}
                  />
                  <SectionHeader
                    title="Action Center"
                    icon={Activity}
                    accent="#f59e0b"
                    action={{ label: 'Full Queue', href: '/ops' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div
                      style={{
                        padding: '0.375rem 0.75rem',
                        borderRadius: '6px',
                        background: 'rgba(239,68,68,0.06)',
                        border: '1px solid rgba(239,68,68,0.12)',
                        fontSize: '10px',
                      }}
                    >
                      <span style={{ color: '#ef4444', fontWeight: 700 }}>{immediateActions}</span>
                      <span style={{ color: 'hsl(210,5%,42%)', marginLeft: '4px' }}>immediate</span>
                    </div>
                    <div
                      style={{
                        padding: '0.375rem 0.75rem',
                        borderRadius: '6px',
                        background: 'rgba(245,158,11,0.06)',
                        border: '1px solid rgba(245,158,11,0.1)',
                        fontSize: '10px',
                      }}
                    >
                      <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                        {ACTIONS.filter((a) => a.urgency === 'today').length}
                      </span>
                      <span style={{ color: 'hsl(210,5%,42%)', marginLeft: '4px' }}>today</span>
                    </div>
                    <div
                      style={{
                        padding: '0.375rem 0.75rem',
                        borderRadius: '6px',
                        background: 'rgba(59,130,246,0.05)',
                        border: '1px solid rgba(59,130,246,0.1)',
                        fontSize: '10px',
                      }}
                    >
                      <span style={{ color: '#3b82f6', fontWeight: 700 }}>
                        ${(totalAtRisk / 1e6).toFixed(1)}M
                      </span>
                      <span style={{ color: 'hsl(210,5%,42%)', marginLeft: '4px' }}>at risk</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {ACTIONS.map((a, i) => (
                      <ActionRow key={a.id} action={a} delay={0.25 + i * 0.05} />
                    ))}
                  </div>
                </m.div>

                <m.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                  style={{
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '1.25rem',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: 'linear-gradient(90deg, rgba(129,140,248,0.5), transparent)',
                    }}
                  />
                  <SectionHeader title="Threat Intelligence" icon={Shield} accent="#818cf8" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {THREAT_FEED.map((item) => (
                      <ThreatRow key={item.msg} item={item} />
                    ))}
                  </div>
                </m.div>
              </div>

              <div className="lg:col-span-5 space-y-5">
                <m.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  style={{
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '1.25rem',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: 'linear-gradient(90deg, rgba(16,185,129,0.5), transparent)',
                    }}
                  />
                  <SectionHeader title="Platform Health" icon={Activity} accent="#10b981" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {PLATFORMS.map((p, i) => (
                      <PlatformCard key={p.key} platform={p} delay={0.2 + i * 0.04} />
                    ))}
                  </div>
                </m.div>

                <m.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  style={{
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '1.25rem',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: 'linear-gradient(90deg, rgba(59,130,246,0.5), transparent)',
                    }}
                  />
                  <SectionHeader title="Client Pipeline" icon={Briefcase} accent="#3b82f6" />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.75rem',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      background: 'rgba(59,130,246,0.05)',
                      border: '1px solid rgba(59,130,246,0.1)',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '9px',
                          color: 'hsl(210,5%,42%)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        }}
                      >
                        Active Pipeline
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#3b82f6' }}>
                        ${(totalPipelineValue / 1e6).toFixed(1)}M
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: '9px',
                          color: 'hsl(210,5%,42%)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        }}
                      >
                        Engagements
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: 'hsl(210,10%,88%)' }}>
                        {CLIENT_PIPELINE.length}
                      </div>
                    </div>
                  </div>
                  <div>
                    {CLIENT_PIPELINE.map((c, i) => (
                      <PipelineRow key={c.name} client={c} delay={0.35 + i * 0.04} />
                    ))}
                  </div>
                </m.div>

                <m.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  style={{
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '1.25rem',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: 'linear-gradient(90deg, rgba(212,160,84,0.5), transparent)',
                    }}
                  />
                  <SectionHeader title="AI Intelligence" icon={Sparkles} accent="#d4a054" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {[
                      {
                        insight:
                          'Sanctions risk elevated for 3 vessels transiting Red Sea corridor',
                        source: 'SEXTANT + PARAGON',
                        accent: '#38bdf8',
                      },
                      {
                        insight:
                          'Brooklyn distress score up 12% — 4 new acquisition targets identified',
                        source: 'DOMAINE Engine',
                        accent: '#4ade80',
                      },
                      {
                        insight: 'Settlement forecast for Rodriguez matter increased to $320K',
                        source: 'Counsel',
                        accent: '#d4a054',
                      },
                      {
                        insight:
                          'Cross-platform signal: insurance fraud pattern detected across DOMAINE + PRAXIS',
                        source: 'Counsel Correlation',
                        accent: '#818cf8',
                      },
                    ].map((item, idx) => (
                      <div
                        key={item.source}
                        style={{
                          display: 'flex',
                          gap: '0.625rem',
                          padding: '0.5rem 0',
                          borderBottom: idx < 3 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                        }}
                      >
                        <div
                          style={{
                            width: '4px',
                            borderRadius: '2px',
                            background: item.accent,
                            flexShrink: 0,
                            marginTop: '2px',
                          }}
                        />
                        <div>
                          <div
                            style={{ fontSize: '11px', color: 'hsl(210,10%,78%)', lineHeight: 1.6 }}
                          >
                            {item.insight}
                          </div>
                          <div
                            style={{ fontSize: '9px', color: 'hsl(210,5%,38%)', marginTop: '2px' }}
                          >
                            Source: {item.source}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </m.div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
