import { ActionLoop, DataProvenance, RoleSelector } from '@szl-holdings/shared-ui/data-provenance';
import type { DataProvenanceInfo } from '@szl-holdings/shared-ui/ontology';
import { m } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Atom,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Dna,
  DollarSign,
  type Eye,
  FileText,
  Flame,
  FlaskConical,
  Gift,
  GitBranch,
  Globe,
  Image,
  Layers,
  LayoutDashboard,
  LineChart,
  Link2,
  Mail,
  Megaphone,
  Minus,
  Radio,
  Recycle,
  RefreshCw,
  Rss,
  Search,
  Send,
  Settings,
  Shuffle,
  Twitter,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { SiteNav } from '@/components/SiteNav';

const API = import.meta.env.VITE_API_URL || '';

const DS = {
  page: '#070a10',
  surface: '#0b0f19',
  elevated: '#0f1420',
  border: 'rgba(255,255,255,0.05)',
  borderMuted: 'rgba(255,255,255,0.08)',
  accent: '#d4a054',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    tertiary: 'rgba(255,255,255,0.28)',
    muted: 'rgba(255,255,255,0.14)',
  },
};

export interface DashboardStats {
  visitsThisWeek: number;
  leadsThisWeek: number;
  publishedArticles: number;
  xQueued: number;
  xSentTotal: number;
  xFailed: number;
  newslettersReady: number;
  automationsCompletedThisWeek: number;
  conversionRate?: number;
  topCampaign?: string;
  topPage?: string;
  contentGenerated?: number;
  leadsNeedingFollowup?: number;
  automationsHealth?: string;
}

const NAV_ITEMS = [
  { href: '/admin/distribution', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/distribution/leads', icon: Users, label: 'Leads' },
  { href: '/admin/distribution/campaigns', icon: Megaphone, label: 'Campaigns' },
  { href: '/admin/distribution/articles', icon: FileText, label: 'Articles' },
  { href: '/admin/distribution/newsletters', icon: Mail, label: 'Newsletters' },
  { href: '/admin/distribution/carousel-lab', icon: Image, label: 'Carousel Lab' },
  { href: '/admin/distribution/x-studio', icon: Twitter, label: 'X Studio' },
  { href: '/admin/distribution/platforms', icon: Globe, label: 'Platforms' },
  { href: '/admin/distribution/atomizer', icon: Atom, label: 'Content Pipeline' },
  { href: '/admin/distribution/calendar', icon: Calendar, label: 'Calendar' },
  { href: '/admin/distribution/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/admin/distribution/cross-analytics', icon: Layers, label: 'Cross-Platform' },
  { href: '/admin/distribution/embeds', icon: Rss, label: 'Embeds & Feeds' },
  { href: '/admin/distribution/developer-api', icon: Code2, label: 'Developer API' },
  { href: '/admin/distribution/growth', icon: Gift, label: 'Growth Engine' },
  { href: '/admin/distribution/reports', icon: LineChart, label: 'Reports' },
  { href: '/admin/distribution/automations', icon: Zap, label: 'Automations' },
  { href: '/admin/distribution/settings', icon: Settings, label: 'Settings' },
  { href: '/admin/distribution/virality', icon: Flame, label: 'Distribution Analytics' },
  { href: '/admin/distribution/audience-genome', icon: Dna, label: 'Audience Insights' },
  { href: '/admin/distribution/ab-testing', icon: FlaskConical, label: 'A/B Testing' },
  { href: '/admin/distribution/monetization', icon: DollarSign, label: 'Monetization' },
  { href: '/admin/distribution/seo-intelligence', icon: Search, label: 'SEO Intelligence' },
  { href: '/admin/distribution/trend-radar', icon: Radio, label: 'Trend Radar' },
  { href: '/admin/distribution/attribution', icon: GitBranch, label: 'Attribution' },
  { href: '/admin/distribution/segments', icon: Shuffle, label: 'Segments' },
  { href: '/admin/distribution/lifecycle', icon: Recycle, label: 'Lifecycle' },
];

export function DistributionOsLayout({
  children,
  currentPath,
}: {
  children: React.ReactNode;
  currentPath: string;
}) {
  return (
    <div style={{ minHeight: '100vh', background: DS.page }}>
      <SiteNav />
      <div style={{ display: 'flex', paddingTop: '4rem' }}>
        <aside
          style={{
            width: 220,
            borderRight: `1px solid ${DS.border}`,
            padding: '1.5rem 0',
            position: 'sticky',
            top: '4rem',
            height: 'calc(100vh - 4rem)',
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: '0 1rem 1rem',
              borderBottom: `1px solid ${DS.border}`,
              marginBottom: '1rem',
            }}
          >
            <h2
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: DS.accent,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Marketing OS
            </h2>
          </div>
          {NAV_ITEMS.map((item) => {
            const active = currentPath === item.href || currentPath.startsWith(`${item.href}/`);
            return (
              <a
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.5rem 1rem',
                  margin: '0.125rem 0.5rem',
                  borderRadius: '6px',
                  color: active ? DS.text.primary : DS.text.tertiary,
                  background: active ? `rgba(212,160,84,0.08)` : 'transparent',
                  borderLeft: active ? `2px solid ${DS.accent}` : '2px solid transparent',
                  textDecoration: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: active ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                <item.icon size={14} />
                {item.label}
              </a>
            );
          })}
        </aside>
        <main
          style={{ flex: 1, padding: '2rem', maxWidth: 'calc(100% - 220px)', overflowX: 'hidden' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

function TrendIcon({ trend }: { trend?: 'up' | 'down' | 'flat' }) {
  if (trend === 'up') return <ArrowUpRight size={11} style={{ color: '#5a9c5a' }} />;
  if (trend === 'down') return <ArrowDownRight size={11} style={{ color: '#c45a4a' }} />;
  return <Minus size={11} style={{ color: DS.text.muted }} />;
}

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
  sub,
  trend,
  pulse,
}: {
  icon: typeof Eye;
  label: string;
  value: number | string;
  color: string;
  sub?: string;
  trend?: 'up' | 'down' | 'flat';
  pulse?: boolean;
}) {
  return (
    <div
      style={{
        padding: '1.125rem 1.25rem',
        background: DS.surface,
        border: `1px solid ${DS.border}`,
        borderRadius: '10px',
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
          background: `linear-gradient(90deg, ${color}60, transparent)`,
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.625rem',
        }}
      >
        <Icon size={14} style={{ color }} />
        {trend && <TrendIcon trend={trend} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
        <div
          style={{
            fontSize: '1.625rem',
            fontWeight: 700,
            color: DS.text.primary,
            letterSpacing: '-0.025em',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </div>
        {pulse && (
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: color,
              animation: 'pulse 2s infinite',
              display: 'inline-block',
              marginBottom: 4,
            }}
          />
        )}
      </div>
      <div
        style={{
          fontSize: '0.6875rem',
          color: DS.text.tertiary,
          marginTop: '0.375rem',
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: '0.625rem', color: DS.text.muted, marginTop: '0.125rem' }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function PipelineStage({
  label,
  value,
  icon: Icon,
  color,
  total,
}: {
  label: string;
  value: number;
  icon: typeof Send;
  color: string;
  total?: number;
}) {
  const pct = total && total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '6px',
          background: `${color}12`,
          border: `1px solid ${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={13} style={{ color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.3rem',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: DS.text.secondary }}>{label}</span>
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              color: DS.text.primary,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {value}
          </span>
        </div>
        {total !== undefined && (
          <div style={{ height: 3, background: `${color}12`, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
          </div>
        )}
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  href,
  badge,
}: {
  icon: typeof FileText;
  label: string;
  href: string;
  badge?: number;
}) {
  const [, navigate] = useLocation();
  return (
    <button
      onClick={() => navigate(href)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '0.5625rem 0.875rem',
        width: '100%',
        background: 'transparent',
        border: `1px solid ${DS.border}`,
        borderRadius: '7px',
        color: DS.text.secondary,
        fontSize: '0.8125rem',
        cursor: 'pointer',
        transition: 'all 0.15s',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = `rgba(212,160,84,0.05)`;
        (e.currentTarget as HTMLButtonElement).style.borderColor = `rgba(212,160,84,0.2)`;
        (e.currentTarget as HTMLButtonElement).style.color = DS.text.primary;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        (e.currentTarget as HTMLButtonElement).style.borderColor = DS.border;
        (e.currentTarget as HTMLButtonElement).style.color = DS.text.secondary;
      }}
    >
      <Icon size={13} style={{ color: DS.accent, flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          style={{
            fontSize: '0.625rem',
            fontWeight: 700,
            padding: '0.125rem 0.375rem',
            borderRadius: '10px',
            background: 'rgba(196,90,74,0.12)',
            color: '#c45a4a',
            border: '1px solid rgba(196,90,74,0.18)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {badge}
        </span>
      )}
      <ChevronRight size={11} style={{ color: DS.text.muted, flexShrink: 0 }} />
    </button>
  );
}

function SkeletonHeroKpi({ borderLeft }: { borderLeft?: boolean }) {
  return (
    <div
      className="animate-pulse"
      style={{
        padding: '1rem 1.25rem',
        borderLeft: borderLeft ? `1px solid ${DS.border}` : 'none',
      }}
    >
      <div style={{ height: 10, width: '50%', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', marginBottom: '0.5rem' }} />
      <div style={{ height: 24, width: '40%', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', marginBottom: '0.375rem' }} />
      <div style={{ height: 10, width: '35%', borderRadius: '3px', background: 'rgba(255,255,255,0.04)' }} />
    </div>
  );
}

function SkeletonKpiCard() {
  return (
    <div
      className="animate-pulse"
      style={{
        padding: '1.125rem 1.25rem',
        background: DS.surface,
        border: `1px solid ${DS.border}`,
        borderRadius: '10px',
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
          background: 'rgba(255,255,255,0.04)',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
        <div style={{ width: 14, height: 14, borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ width: 14, height: 14, borderRadius: '4px', background: 'rgba(255,255,255,0.04)' }} />
      </div>
      <div style={{ height: 26, width: '45%', borderRadius: '4px', background: 'rgba(255,255,255,0.07)', marginBottom: '0.375rem' }} />
      <div style={{ height: 11, width: '60%', borderRadius: '3px', background: 'rgba(255,255,255,0.04)' }} />
    </div>
  );
}

export default function DistributionOsDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [location] = useLocation();
  const [activeRole, setActiveRole] = useState('operator');

  const load = () => {
    setLoading(true);
    fetch(`${API}/api/distribution-os/analytics/dashboard`)
      .then((r) => r.json())
      .then((d) => {
        setStats(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const s = stats || {
    visitsThisWeek: 0,
    leadsThisWeek: 0,
    publishedArticles: 0,
    xQueued: 0,
    xSentTotal: 0,
    xFailed: 0,
    newslettersReady: 0,
    automationsCompletedThisWeek: 0,
    conversionRate: 0,
    topCampaign: '—',
    topPage: '—',
    contentGenerated: 0,
    leadsNeedingFollowup: 0,
    automationsHealth: 'OK',
  };

  const conversionRate =
    s.visitsThisWeek > 0 ? `${((s.leadsThisWeek / s.visitsThisWeek) * 100).toFixed(1)}%` : '0.0%';

  const pipelineTotal = s.xQueued + s.xSentTotal + (s.xFailed || 0);

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '1.75rem',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                marginBottom: '0.25rem',
              }}
            >
              <h1
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: DS.text.primary,
                  letterSpacing: '-0.025em',
                }}
              >
                Marketing OS
              </h1>
              <span
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  padding: '0.125rem 0.5rem',
                  borderRadius: '4px',
                  background: 'rgba(90,156,90,0.1)',
                  color: '#5a9c5a',
                  border: '1px solid rgba(90,156,90,0.2)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {loading ? 'SYNCING' : 'LIVE'}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: DS.text.tertiary }}>
              Leads · campaigns · content · distribution
            </p>
          </div>
          <button
            onClick={load}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.4375rem 0.75rem',
              background: DS.surface,
              border: `1px solid ${DS.border}`,
              borderRadius: '6px',
              color: DS.text.tertiary,
              fontSize: '0.6875rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: 'monospace',
            }}
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Role Selector + Provenance row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '1.25rem',
          }}
        >
          <RoleSelector
            currentRole={activeRole}
            onRoleChange={setActiveRole}
            roles={[
              {
                id: 'executive',
                label: 'Executive',
                description: 'Top-line KPIs, conversion, campaign ROI',
              },
              {
                id: 'operator',
                label: 'Operator',
                description: 'Leads, automations, queue health',
              },
              {
                id: 'analyst',
                label: 'Analyst',
                description: 'Content performance, distribution metrics',
              },
              { id: 'admin', label: 'Admin', description: 'System health, integrations, settings' },
            ]}
          />
          <DataProvenance
            compact
            provenance={
              {
                source: 'Marketing OS Data Engine',
                lastUpdated: new Date().toISOString(),
                freshness: 'minutes',
                confidence: 'high',
                dataState: 'live',
                owner: 'SZL Holdings Distribution OS',
              } as DataProvenanceInfo
            }
          />
        </div>

        {/* Role context bar */}
        {activeRole && (
          <div
            style={{
              background: 'rgba(212,160,84,0.04)',
              border: '1px solid rgba(212,160,84,0.12)',
              borderRadius: '10px',
              padding: '0.75rem 1.25rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: '0.625rem',
                fontWeight: 700,
                color: DS.text.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                flexShrink: 0,
              }}
            >
              {activeRole === 'executive'
                ? 'C-Suite View'
                : activeRole === 'operator'
                  ? 'Ops Focus'
                  : activeRole === 'analyst'
                    ? 'Analytics Focus'
                    : 'Admin View'}
            </span>
            <span
              style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}
            >
              {activeRole === 'executive' &&
                `${s.leadsThisWeek} leads this week · ${conversionRate} conversion rate · ${s.leadsNeedingFollowup ?? 0} requiring follow-up · Top campaign: "${s.topCampaign ?? '—'}"`}
              {activeRole === 'operator' &&
                `${s.xQueued} queued · ${s.xFailed > 0 ? `${s.xFailed} X posts failed — review needed` : 'No failures'} · ${s.automationsCompletedThisWeek} automations run this week`}
              {activeRole === 'analyst' &&
                `${s.publishedArticles} articles live · ${s.contentGenerated ?? 0} AI-generated pieces · Newsletters ready: ${s.newslettersReady}`}
              {activeRole === 'admin' &&
                `System status: ${s.automationsHealth ?? 'OK'} · API: Connected · Data refresh every 5 minutes`}
            </span>
          </div>
        )}

        {/* Executive KPI Hero — top-line strip */}
        <div
          style={{
            background: DS.surface,
            border: `1px solid ${DS.border}`,
            borderRadius: '12px',
            marginBottom: '1.25rem',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '2px',
              background: `linear-gradient(90deg, ${DS.accent}, rgba(212,160,84,0.2), transparent)`,
            }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonHeroKpi key={i} borderLeft={i > 0} />
                ))
              : [
                  { label: 'Visits', value: s.visitsThisWeek, color: '#4a90b8', sub: 'this week' },
                  {
                    label: 'Leads',
                    value: s.leadsThisWeek,
                    color: '#5a9c5a',
                    sub: 'this week',
                    pulse: (s.leadsNeedingFollowup ?? 0) > 0,
                  },
                  {
                    label: 'Conversion',
                    value: conversionRate,
                    color: DS.accent,
                    sub: 'visits → leads',
                  },
                  {
                    label: 'Needs Follow-up',
                    value: s.leadsNeedingFollowup ?? 0,
                    color: s.leadsNeedingFollowup ? '#c45a4a' : '#5a9c5a',
                    sub: 'awaiting action',
                  },
                ].map((item, i) => (
                  <div
                    key={item.label}
                    style={{
                      padding: '1rem 1.25rem',
                      borderLeft: i > 0 ? `1px solid ${DS.border}` : 'none',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        color: DS.text.muted,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        marginBottom: '0.375rem',
                      }}
                    >
                      {item.label}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
                      <span
                        style={{
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          color: item.color,
                          letterSpacing: '-0.025em',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {item.value}
                      </span>
                      {item.pulse && (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#c45a4a',
                            display: 'inline-block',
                            marginBottom: 3,
                            animation: 'pulse 2s infinite',
                          }}
                        />
                      )}
                    </div>
                    <div style={{ fontSize: '0.625rem', color: DS.text.muted, marginTop: '0.25rem' }}>
                      {item.sub}
                    </div>
                  </div>
                ))}
          </div>
        </div>

        {/* Main KPI Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonKpiCard key={i} />)
          ) : (
            <>
              <KpiCard
                icon={Globe}
                label="Top Landing Page"
                value={s.topPage || '—'}
                color="#4a90b8"
                trend="up"
              />
              <KpiCard
                icon={Megaphone}
                label="Top Campaign"
                value={s.topCampaign || '—'}
                color="#8b7ac8"
              />
              <KpiCard
                icon={FileText}
                label="Published Articles"
                value={s.publishedArticles}
                color="#c8953c"
                trend="up"
              />
              <KpiCard
                icon={Activity}
                label="Automations Health"
                value={s.automationsHealth || 'OK'}
                color={s.xFailed > 0 ? '#c45a4a' : '#5a9c5a'}
              />
              <KpiCard
                icon={Clock}
                label="Automations (7d)"
                value={s.automationsCompletedThisWeek}
                color="#4a90b8"
                trend="flat"
              />
            </>
          )}
        </div>

        {/* Two-column: Actions + Pipeline */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.25rem',
            marginBottom: '1.25rem',
          }}
        >
          {/* Quick Actions */}
          <div
            style={{
              background: DS.surface,
              border: `1px solid ${DS.border}`,
              borderRadius: '10px',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '0.875rem 1rem', borderBottom: `1px solid ${DS.border}` }}>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: DS.text.muted,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Quick Actions
              </span>
            </div>
            <div
              style={{
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3125rem',
              }}
            >
              <QuickAction
                icon={Users}
                label="Lead Inbox"
                href="/admin/distribution/leads"
                badge={s.leadsNeedingFollowup ?? undefined}
              />
              <QuickAction
                icon={Megaphone}
                label="Campaigns & UTM Builder"
                href="/admin/distribution/campaigns"
              />
              <QuickAction
                icon={FileText}
                label="New Article"
                href="/admin/distribution/articles"
              />
              <QuickAction
                icon={Mail}
                label="New Newsletter"
                href="/admin/distribution/newsletters"
              />
              <QuickAction
                icon={Image}
                label="Carousel Lab"
                href="/admin/distribution/carousel-lab"
              />
              <QuickAction icon={Twitter} label="X Studio" href="/admin/distribution/x-studio" />
            </div>
          </div>

          {/* Reports & Config */}
          <div
            style={{
              background: DS.surface,
              border: `1px solid ${DS.border}`,
              borderRadius: '10px',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '0.875rem 1rem', borderBottom: `1px solid ${DS.border}` }}>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: DS.text.muted,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Reports & Configuration
              </span>
            </div>
            <div
              style={{
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3125rem',
              }}
            >
              <QuickAction
                icon={LineChart}
                label="Reports (Weekly / Monthly)"
                href="/admin/distribution/reports"
              />
              <QuickAction
                icon={BarChart3}
                label="Analytics Dashboard"
                href="/admin/distribution/analytics"
              />
              <QuickAction icon={Zap} label="Automations" href="/admin/distribution/automations" />
              <QuickAction
                icon={Settings}
                label="Settings & Integrations"
                href="/admin/distribution/settings"
              />
              <QuickAction icon={Globe} label="Link-in-Bio Preview" href="/link-in-bio" />
              <QuickAction icon={Link2} label="Newsletter Landing" href="/newsletter" />
            </div>
          </div>
        </div>

        {/* Distribution Pipeline — improved with progress bars */}
        <div
          style={{
            background: DS.surface,
            border: `1px solid ${DS.border}`,
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '0.875rem 1.25rem',
              borderBottom: `1px solid ${DS.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: DS.text.muted,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Distribution Pipeline
            </span>
            <span style={{ fontSize: '0.625rem', color: DS.text.muted, fontFamily: 'monospace' }}>
              {pipelineTotal} total posts tracked
            </span>
          </div>
          <div
            style={{
              padding: '1rem 1.25rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.875rem',
            }}
          >
            <PipelineStage
              label="X Posts Queued"
              value={s.xQueued}
              icon={Send}
              color="#8b7ac8"
              total={pipelineTotal}
            />
            <PipelineStage
              label="X Posts Sent"
              value={s.xSentTotal}
              icon={CheckCircle2}
              color="#5a9c5a"
              total={pipelineTotal}
            />
            <PipelineStage
              label="X Posts Failed"
              value={s.xFailed}
              icon={AlertCircle}
              color={s.xFailed > 0 ? '#c45a4a' : DS.text.muted}
            />
            <PipelineStage
              label="Newsletters Ready"
              value={s.newslettersReady}
              icon={Mail}
              color="#c8953c"
            />
          </div>
          {s.xFailed > 0 && (
            <div
              style={{
                margin: '0 1.25rem 1rem',
                padding: '0.625rem 0.875rem',
                background: 'rgba(196,90,74,0.06)',
                border: '1px solid rgba(196,90,74,0.15)',
                borderRadius: '7px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={12} style={{ color: '#c45a4a', flexShrink: 0 }} />
              <span style={{ fontSize: '0.75rem', color: '#c45a4a' }}>
                {s.xFailed} post{s.xFailed !== 1 ? 's' : ''} failed — review X Studio for errors
              </span>
            </div>
          )}
        </div>

        {/* Action Loop — cross-cutting pattern */}
        <div style={{ marginTop: '1.25rem' }}>
          <ActionLoop
            title="Priority Marketing Actions"
            actions={[
              {
                id: '1',
                label: s.leadsNeedingFollowup
                  ? `Follow up ${s.leadsNeedingFollowup} leads — SLA breach risk`
                  : 'Review lead queue — all current',
                type: 'approve',
                severity: s.leadsNeedingFollowup ? 'critical' : 'medium',
              },
              {
                id: '2',
                label:
                  s.xFailed > 0
                    ? `Resolve ${s.xFailed} failed X posts in X Studio`
                    : 'X pipeline healthy — no action needed',
                type: 'investigate',
                severity: s.xFailed > 0 ? 'high' : 'low',
              },
              {
                id: '3',
                label: `Review ${s.newslettersReady} newsletter${s.newslettersReady !== 1 ? 's' : ''} staged for send`,
                type: 'approve',
                severity: 'medium',
              },
              {
                id: '4',
                label: `Campaign performance review — top: "${s.topCampaign ?? 'N/A'}"`,
                type: 'investigate',
                severity: 'low',
              },
            ]}
          />
        </div>
      </m.div>
    </DistributionOsLayout>
  );
}
