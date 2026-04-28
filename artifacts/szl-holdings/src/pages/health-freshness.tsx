import { m } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Building2,
  Database,
  RefreshCw,
  Shield,
  Ship,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteNav } from '@/components/SiteNav';

const BG = 'hsl(214,16%,4%)';
const BORDER = 'hsla(0,0%,100%,0.07)';
const SURFACE = 'hsla(0,0%,100%,0.03)';
const TEXT = 'hsl(38,8%,94%)';
const TEXT_SEC = 'hsl(214,7%,60%)';
const TEXT_FAINT = 'hsl(214,7%,38%)';
const MONO = 'var(--font-mono)';

type FreshnessStatus = 'live' | 'fresh' | 'stale' | 'error' | 'unknown';

interface ConnectorHealth {
  id: string;
  name: string;
  domain: string;
  domainIcon: React.ElementType;
  domainColor: string;
  source: string;
  status: FreshnessStatus;
  fetchedAt: string;
  lastSuccessAt: string;
  lastErrorAt?: string;
  latencyMs: number;
  recordCount: number;
  maxStaleMinutes: number;
  errorMessage?: string;
  trend: FreshnessStatus[];
}

const STATUS_CONFIG: Record<
  FreshnessStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  live: {
    label: 'Live',
    color: 'hsl(142,60%,50%)',
    bg: 'hsla(142,60%,50%,0.08)',
    border: 'hsla(142,60%,50%,0.2)',
  },
  fresh: {
    label: 'Fresh',
    color: 'hsl(192,72%,48%)',
    bg: 'hsla(192,72%,48%,0.08)',
    border: 'hsla(192,72%,48%,0.2)',
  },
  stale: {
    label: 'Stale',
    color: 'hsl(48,90%,52%)',
    bg: 'hsla(48,90%,52%,0.08)',
    border: 'hsla(48,90%,52%,0.2)',
  },
  error: {
    label: 'Error',
    color: 'hsl(0,72%,54%)',
    bg: 'hsla(0,72%,54%,0.08)',
    border: 'hsla(0,72%,54%,0.2)',
  },
  unknown: {
    label: 'Unknown',
    color: 'hsl(214,7%,45%)',
    bg: 'hsla(0,0%,100%,0.04)',
    border: 'hsla(0,0%,100%,0.07)',
  },
};

const SAMPLE_CONNECTORS: ConnectorHealth[] = [
  {
    id: 'ais-marinetraffic',
    name: 'AIS Maritime Feed',
    domain: 'Vessels',
    domainIcon: Ship,
    domainColor: 'hsl(206,72%,54%)',
    source: 'MarineTraffic API',
    status: 'live',
    fetchedAt: 'T-02m',
    lastSuccessAt: 'T-02m',
    latencyMs: 214,
    recordCount: 4821,
    maxStaleMinutes: 10,
    trend: ['live', 'live', 'live', 'fresh', 'live', 'live'],
  },
  {
    id: 'gdelt-events',
    name: 'GDELT Event Feed',
    domain: 'Aegis',
    domainIcon: Shield,
    domainColor: 'hsl(222,60%,60%)',
    source: 'GDELT 2.0',
    status: 'fresh',
    fetchedAt: 'T-14m',
    lastSuccessAt: 'T-14m',
    latencyMs: 892,
    recordCount: 17340,
    maxStaleMinutes: 30,
    trend: ['fresh', 'live', 'fresh', 'fresh', 'fresh', 'fresh'],
  },
  {
    id: 'terra-nyc-transfers',
    name: 'NYC Property Transfers',
    domain: 'Terra',
    domainIcon: Building2,
    domainColor: 'hsl(142,52%,48%)',
    source: 'ACRIS / PLUTO',
    status: 'fresh',
    fetchedAt: 'T-4h',
    lastSuccessAt: 'T-4h',
    latencyMs: 3200,
    recordCount: 892,
    maxStaleMinutes: 1440,
    trend: ['fresh', 'fresh', 'stale', 'fresh', 'fresh', 'fresh'],
  },
  {
    id: 'continuum-workflow-events',
    name: 'Workflow State Events',
    domain: 'Counsel',
    domainIcon: Zap,
    domainColor: 'hsl(192,72%,48%)',
    source: 'Internal Event Bus',
    status: 'live',
    fetchedAt: 'T-01m',
    lastSuccessAt: 'T-01m',
    latencyMs: 48,
    recordCount: 341,
    maxStaleMinutes: 5,
    trend: ['live', 'live', 'live', 'live', 'live', 'live'],
  },
  {
    id: 'ofac-sdn',
    name: 'OFAC SDN List',
    domain: 'Vessels',
    domainIcon: Ship,
    domainColor: 'hsl(206,72%,54%)',
    source: 'OFAC.treas.gov',
    status: 'fresh',
    fetchedAt: 'T-6h',
    lastSuccessAt: 'T-6h',
    latencyMs: 1840,
    recordCount: 14220,
    maxStaleMinutes: 1440,
    trend: ['fresh', 'fresh', 'fresh', 'fresh', 'fresh', 'fresh'],
  },
  {
    id: 'nvd-cve',
    name: 'NVD CVE Feed',
    domain: 'Aegis',
    domainIcon: Shield,
    domainColor: 'hsl(222,60%,60%)',
    source: 'NIST NVD',
    status: 'stale',
    fetchedAt: 'T-3h',
    lastSuccessAt: 'T-27m',
    lastErrorAt: 'T-3h',
    errorMessage: 'Rate limit exceeded — retry in 14m',
    latencyMs: 0,
    recordCount: 28140,
    maxStaleMinutes: 60,
    trend: ['fresh', 'fresh', 'error', 'stale', 'stale', 'stale'],
  },
  {
    id: 'weather-noaa',
    name: 'NOAA Weather & Routing',
    domain: 'Vessels',
    domainIcon: Ship,
    domainColor: 'hsl(206,72%,54%)',
    source: 'NOAA / OPC',
    status: 'live',
    fetchedAt: 'T-08m',
    lastSuccessAt: 'T-08m',
    latencyMs: 412,
    recordCount: 5830,
    maxStaleMinutes: 30,
    trend: ['live', 'fresh', 'live', 'live', 'fresh', 'live'],
  },
  {
    id: 'continuum-ai-traces',
    name: 'AI Inference Traces',
    domain: 'Counsel',
    domainIcon: Zap,
    domainColor: 'hsl(192,72%,48%)',
    source: 'Internal Telemetry',
    status: 'live',
    fetchedAt: 'T-00m',
    lastSuccessAt: 'T-00m',
    latencyMs: 12,
    recordCount: 18412,
    maxStaleMinutes: 2,
    trend: ['live', 'live', 'live', 'live', 'live', 'live'],
  },
  {
    id: 'terra-costar',
    name: 'CoStar Market Data',
    domain: 'Terra',
    domainIcon: Building2,
    domainColor: 'hsl(142,52%,48%)',
    source: 'CoStar API',
    status: 'error',
    fetchedAt: 'T-5h',
    lastSuccessAt: 'T-5h',
    lastErrorAt: 'T-22m',
    errorMessage: 'Auth token expired — credentials refresh required',
    latencyMs: 0,
    recordCount: 0,
    maxStaleMinutes: 240,
    trend: ['fresh', 'fresh', 'fresh', 'stale', 'error', 'error'],
  },
  {
    id: 'internal-signals',
    name: 'Internal Signal Bus',
    domain: 'Counsel',
    domainIcon: Zap,
    domainColor: 'hsl(192,72%,48%)',
    source: 'PRAXIS Bus',
    status: 'live',
    fetchedAt: 'T-00m',
    lastSuccessAt: 'T-00m',
    latencyMs: 6,
    recordCount: 9201,
    maxStaleMinutes: 1,
    trend: ['live', 'live', 'live', 'live', 'live', 'live'],
  },
];

function freshnessAgeLabel(fetchedAt: string, maxStaleMinutes: number): string {
  const match = fetchedAt.match(/T-(\d+)(m|h)/);
  if (!match) return fetchedAt;
  const val = parseInt(match[1], 10);
  const unit = match[2];
  const ageMin = unit === 'h' ? val * 60 : val;
  const pct = Math.min(1, ageMin / maxStaleMinutes);
  if (pct < 0.5) return `${fetchedAt} ago — well within window`;
  if (pct < 0.9) return `${fetchedAt} ago — approaching stale`;
  return `${fetchedAt} ago — at or past stale threshold`;
}

function TrendPips({ trend }: { trend: FreshnessStatus[] }) {
  return (
    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
      {trend.map((s, i) => {
        const c = STATUS_CONFIG[s].color;
        return (
          <div
            key={i}
            style={{
              width: 6,
              height: 16,
              borderRadius: 2,
              background: i === trend.length - 1 ? c : `${c}55`,
            }}
          />
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: FreshnessStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      style={{
        fontSize: '0.575rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        fontFamily: MONO,
        padding: '2px 6px',
        borderRadius: 4,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
      }}
    >
      {cfg.label}
    </span>
  );
}

function LatencyBar({ ms, max = 5000 }: { ms: number; max?: number }) {
  if (ms === 0)
    return <span style={{ fontSize: '0.6875rem', fontFamily: MONO, color: TEXT_FAINT }}>—</span>;
  const pct = Math.min(1, ms / max);
  const color = pct < 0.3 ? 'hsl(142,60%,50%)' : pct < 0.7 ? 'hsl(48,90%,52%)' : 'hsl(0,72%,54%)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div
        style={{
          width: 60,
          height: 4,
          borderRadius: 2,
          background: 'hsla(0,0%,100%,0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{ height: '100%', width: `${pct * 100}%`, background: color, borderRadius: 2 }}
        />
      </div>
      <span style={{ fontSize: '0.6875rem', fontFamily: MONO, color }}>{ms}ms</span>
    </div>
  );
}

function ConnectorCard({ connector }: { connector: ConnectorHealth }) {
  const [expanded, setExpanded] = useState(false);
  const DomainIcon = connector.domainIcon;
  const cfg = STATUS_CONFIG[connector.status];
  const hasError = connector.status === 'error' || connector.lastErrorAt;

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: SURFACE,
        border: `1px solid ${hasError ? 'hsla(0,72%,54%,0.18)' : expanded ? cfg.border : BORDER}`,
        borderRadius: 10,
        overflow: 'hidden',
        transition: 'border-color 0.15s ease',
      }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '1rem 1.125rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: `${connector.domainColor}18`,
              border: `1px solid ${connector.domainColor}22`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <DomainIcon size={14} style={{ color: connector.domainColor }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.25rem',
              }}
            >
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: TEXT }}>
                {connector.name}
              </span>
              <StatusBadge status={connector.status} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.625rem', fontFamily: MONO, color: TEXT_FAINT }}>
                {connector.domain}
              </span>
              <span style={{ fontSize: '0.625rem', fontFamily: MONO, color: TEXT_FAINT }}>·</span>
              <span style={{ fontSize: '0.625rem', fontFamily: MONO, color: TEXT_FAINT }}>
                {connector.source}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
            <TrendPips trend={connector.trend} />
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.6875rem', fontFamily: MONO, color: cfg.color, margin: 0 }}>
                {connector.fetchedAt}
              </p>
              <p style={{ fontSize: '0.6rem', fontFamily: MONO, color: TEXT_FAINT, margin: 0 }}>
                {connector.recordCount.toLocaleString()} records
              </p>
            </div>
          </div>
        </div>

        {hasError && connector.errorMessage && (
          <div
            style={{
              marginTop: '0.625rem',
              padding: '0.5rem 0.75rem',
              background: 'hsla(0,72%,54%,0.06)',
              border: '1px solid hsla(0,72%,54%,0.15)',
              borderRadius: 6,
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'flex-start',
            }}
          >
            <AlertCircle
              size={11}
              style={{ color: 'hsl(0,72%,54%)', marginTop: '1px', flexShrink: 0 }}
            />
            <span style={{ fontSize: '0.6875rem', color: 'hsl(0,72%,54%)' }}>
              {connector.errorMessage}
            </span>
          </div>
        )}
      </button>

      {expanded && (
        <div style={{ padding: '0 1.125rem 1rem', borderTop: `1px solid ${BORDER}` }}>
          <div
            style={{
              paddingTop: '0.875rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {[
              { label: 'Last Success', value: `${connector.lastSuccessAt} ago` },
              {
                label: 'Last Error',
                value: connector.lastErrorAt ? `${connector.lastErrorAt} ago` : 'None',
              },
              { label: 'Ingest Latency', element: <LatencyBar ms={connector.latencyMs} /> },
              { label: 'Record Count', value: connector.recordCount.toLocaleString() },
              {
                label: 'Max Stale Window',
                value:
                  connector.maxStaleMinutes >= 1440
                    ? `${connector.maxStaleMinutes / 1440}d`
                    : `${connector.maxStaleMinutes}m`,
              },
              {
                label: 'Freshness Age',
                value: freshnessAgeLabel(connector.fetchedAt, connector.maxStaleMinutes),
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '0.625rem 0.75rem',
                  background: 'hsla(0,0%,100%,0.025)',
                  borderRadius: 6,
                  border: `1px solid ${BORDER}`,
                }}
              >
                <p
                  style={{
                    fontSize: '0.575rem',
                    fontFamily: MONO,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: TEXT_FAINT,
                    margin: '0 0 0.25rem',
                  }}
                >
                  {item.label}
                </p>
                {item.element ?? (
                  <p
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: MONO,
                      color: TEXT,
                      margin: 0,
                      wordBreak: 'break-all',
                    }}
                  >
                    {item.value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </m.div>
  );
}

function SummaryPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        padding: '0.625rem 1rem',
        background: `${color}08`,
        border: `1px solid ${color}22`,
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.125rem',
        minWidth: 80,
      }}
    >
      <span style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: MONO, color }}>{value}</span>
      <span
        style={{
          fontSize: '0.575rem',
          fontFamily: MONO,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: TEXT_FAINT,
        }}
      >
        {label}
      </span>
    </div>
  );
}

export default function HealthFreshnessPage() {
  const [domainFilter, setDomainFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const domains = ['all', ...Array.from(new Set(SAMPLE_CONNECTORS.map((c) => c.domain)))];
  const statuses: (FreshnessStatus | 'all')[] = ['all', 'live', 'fresh', 'stale', 'error'];

  const filtered = SAMPLE_CONNECTORS.filter(
    (c) =>
      (domainFilter === 'all' || c.domain === domainFilter) &&
      (statusFilter === 'all' || c.status === statusFilter),
  );

  const counts = {
    live: SAMPLE_CONNECTORS.filter((c) => c.status === 'live').length,
    fresh: SAMPLE_CONNECTORS.filter((c) => c.status === 'fresh').length,
    stale: SAMPLE_CONNECTORS.filter((c) => c.status === 'stale').length,
    error: SAMPLE_CONNECTORS.filter((c) => c.status === 'error').length,
    unknown: SAMPLE_CONNECTORS.filter((c) => c.status === 'unknown').length,
  };

  const overallHealth =
    counts.error > 0 ? 'degraded' : counts.stale > 0 ? 'warning' : 'operational';

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT }}>
      <SiteNav />
      <main id="main-content">
        <section
          style={{ borderBottom: `1px solid ${BORDER}`, padding: 'clamp(5.5rem,10vw,7rem) 0 2rem' }}
        >
          <div
            style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 var(--space-content-x)' }}
          >
            <m.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.25rem',
                }}
              >
                <Link
                  href="/lyte"
                  style={{
                    fontSize: '0.6rem',
                    fontFamily: MONO,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: TEXT_FAINT,
                    textDecoration: 'none',
                  }}
                >
                  Lyte
                </Link>
                <span style={{ color: TEXT_FAINT, fontSize: '0.75rem' }}>›</span>
                <span
                  style={{
                    fontSize: '0.6rem',
                    fontFamily: MONO,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'hsl(192,72%,48%)',
                  }}
                >
                  Health & Freshness
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '2rem',
                  flexWrap: 'wrap',
                  marginBottom: '1.75rem',
                }}
              >
                <div>
                  <h1
                    style={{
                      fontSize: 'clamp(1.75rem,4vw,2.75rem)',
                      fontWeight: 700,
                      letterSpacing: '-0.025em',
                      lineHeight: 1.1,
                      marginBottom: '0.75rem',
                      color: TEXT,
                    }}
                  >
                    Data Health & Freshness
                  </h1>
                  <p
                    style={{ fontSize: '1rem', lineHeight: 1.7, color: TEXT_SEC, maxWidth: '52ch' }}
                  >
                    Per-connector status, ingest latency, record counts, freshness windows, and
                    stale-domain warnings — every data source in one surface.
                  </p>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    padding: '0.5rem 0.875rem',
                    background:
                      overallHealth === 'operational'
                        ? 'hsla(142,60%,50%,0.08)'
                        : overallHealth === 'warning'
                          ? 'hsla(48,90%,52%,0.08)'
                          : 'hsla(0,72%,54%,0.08)',
                    border: `1px solid ${overallHealth === 'operational' ? 'hsla(142,60%,50%,0.2)' : overallHealth === 'warning' ? 'hsla(48,90%,52%,0.2)' : 'hsla(0,72%,54%,0.2)'}`,
                    borderRadius: 8,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background:
                        overallHealth === 'operational'
                          ? 'hsl(142,60%,50%)'
                          : overallHealth === 'warning'
                            ? 'hsl(48,90%,52%)'
                            : 'hsl(0,72%,54%)',
                      boxShadow: `0 0 6px ${overallHealth === 'operational' ? 'hsl(142,60%,50%)' : overallHealth === 'warning' ? 'hsl(48,90%,52%)' : 'hsl(0,72%,54%)'}`,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontFamily: MONO,
                      fontWeight: 600,
                      color: TEXT,
                    }}
                  >
                    {overallHealth === 'operational'
                      ? 'All sources operational'
                      : overallHealth === 'warning'
                        ? 'Some sources stale'
                        : 'Sources degraded'}
                  </span>
                </div>
              </div>

              {/* Summary bar */}
              <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
                <SummaryPill label="Live" value={counts.live} color="hsl(142,60%,50%)" />
                <SummaryPill label="Fresh" value={counts.fresh} color="hsl(192,72%,48%)" />
                <SummaryPill label="Stale" value={counts.stale} color="hsl(48,90%,52%)" />
                <SummaryPill label="Error" value={counts.error} color="hsl(0,72%,54%)" />
              </div>
            </m.div>
          </div>
        </section>

        {/* Filters + list */}
        <section style={{ padding: '2rem 0 4rem' }}>
          <div
            style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 var(--space-content-x)' }}
          >
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.6875rem', fontFamily: MONO, color: TEXT_FAINT }}>
                  Domain:
                </span>
                {domains.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDomainFilter(d)}
                    style={{
                      padding: '0.25rem 0.625rem',
                      borderRadius: 4,
                      fontSize: '0.6875rem',
                      fontFamily: MONO,
                      fontWeight: 600,
                      border: `1px solid ${domainFilter === d ? 'hsla(192,72%,48%,0.4)' : BORDER}`,
                      background: domainFilter === d ? 'hsla(192,72%,48%,0.1)' : 'transparent',
                      color: domainFilter === d ? 'hsl(192,72%,48%)' : TEXT_FAINT,
                      cursor: 'pointer',
                    }}
                  >
                    {d === 'all' ? 'All' : d}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.6875rem', fontFamily: MONO, color: TEXT_FAINT }}>
                  Status:
                </span>
                {statuses.map((s) => {
                  const _cfg =
                    s === 'all'
                      ? { color: TEXT_FAINT, bg: 'transparent', border: BORDER }
                      : STATUS_CONFIG[s];
                  return (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      style={{
                        padding: '0.25rem 0.625rem',
                        borderRadius: 4,
                        fontSize: '0.6875rem',
                        fontFamily: MONO,
                        fontWeight: 600,
                        border: `1px solid ${statusFilter === s ? (s === 'all' ? BORDER : STATUS_CONFIG[s as FreshnessStatus].border) : BORDER}`,
                        background:
                          statusFilter === s && s !== 'all'
                            ? STATUS_CONFIG[s as FreshnessStatus].bg
                            : 'transparent',
                        color:
                          statusFilter === s
                            ? s === 'all'
                              ? TEXT
                              : STATUS_CONFIG[s as FreshnessStatus].color
                            : TEXT_FAINT,
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              <div
                style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  fontSize: '0.6875rem',
                  fontFamily: MONO,
                  color: TEXT_FAINT,
                }}
              >
                <RefreshCw size={11} />
                <span>Auto-refresh 30s</span>
              </div>
            </div>

            {/* Stale / error warnings banner */}
            {(counts.stale > 0 || counts.error > 0) && (
              <m.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginBottom: '1.25rem',
                  padding: '0.875rem 1rem',
                  background: 'hsla(0,72%,54%,0.06)',
                  border: '1px solid hsla(0,72%,54%,0.18)',
                  borderRadius: 10,
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                }}
              >
                <AlertTriangle
                  size={14}
                  style={{ color: 'hsl(0,72%,54%)', marginTop: '2px', flexShrink: 0 }}
                />
                <div>
                  <p
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: TEXT,
                      margin: '0 0 0.25rem',
                    }}
                  >
                    {counts.error} source{counts.error !== 1 ? 's' : ''} in error · {counts.stale}{' '}
                    stale
                  </p>
                  <p style={{ fontSize: '0.6875rem', color: TEXT_SEC, margin: 0 }}>
                    Stale or errored sources may produce outdated signals. Review affected
                    connectors and retry or escalate to platform ops.
                  </p>
                </div>
                <Link
                  href="/ops"
                  style={{
                    marginLeft: 'auto',
                    padding: '0.375rem 0.75rem',
                    background: 'hsla(0,72%,54%,0.1)',
                    border: '1px solid hsla(0,72%,54%,0.25)',
                    borderRadius: 6,
                    fontSize: '0.6875rem',
                    fontFamily: MONO,
                    color: 'hsl(0,72%,54%)',
                    textDecoration: 'none',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                  }}
                >
                  Ops Center <ArrowRight size={11} />
                </Link>
              </m.div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filtered.map((connector, i) => (
                <m.div
                  key={connector.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <ConnectorCard connector={connector} />
                </m.div>
              ))}
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: TEXT_FAINT }}>
                  <Database size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                  <p style={{ fontSize: '0.875rem' }}>No connectors match this filter</p>
                </div>
              )}
            </div>

            {/* Legend */}
            <div
              style={{
                marginTop: '2.5rem',
                padding: '1rem 1.25rem',
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: 10,
              }}
            >
              <p
                style={{
                  fontSize: '0.6rem',
                  fontFamily: MONO,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: TEXT_FAINT,
                  marginBottom: '0.75rem',
                }}
              >
                Freshness Status Definitions
              </p>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                {(
                  Object.entries(STATUS_CONFIG) as [
                    FreshnessStatus,
                    (typeof STATUS_CONFIG)[FreshnessStatus],
                  ][]
                )
                  .filter(([k]) => k !== 'unknown')
                  .map(([key, cfg]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color }}
                      />
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontFamily: MONO,
                          color: cfg.color,
                          fontWeight: 600,
                        }}
                      >
                        {cfg.label}
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: TEXT_FAINT }}>
                        {key === 'live' && '— updated within the last 2 minutes'}
                        {key === 'fresh' && '— within the configured stale window'}
                        {key === 'stale' && '— past the configured stale threshold'}
                        {key === 'error' && '— last fetch failed, data may be missing'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
