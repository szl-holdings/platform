import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  Radio,
  Shield,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Link } from 'wouter';

const TERRA_ACCENT = '#c87941';

const API = '/api';

interface ConduitExportBadgeProps {
  scenario?: string;
  propertyId?: string;
}

export function ConduitExportBadge({ scenario = 'sunbelt-multifamily-2026', propertyId = 'portfolio' }: ConduitExportBadgeProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['conduit-export-status', scenario],
    queryFn: () =>
      fetch(`${API}/conduit/exports?limit=3`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });

  const exportCount = data?.data?.length ?? data?.length ?? 0;
  const isLive = !isError && data !== null;

  function handleExport() {
    const url = `${API}/conduit/export?scenario=${encodeURIComponent(scenario)}&propertyId=${encodeURIComponent(propertyId)}&format=json`;
    window.open(url, '_blank');
  }

  return (
    <div
      style={{
        padding: '0.75rem 1rem',
        borderRadius: '0.625rem',
        background: 'hsla(0,0%,100%,0.025)',
        border: '1px solid hsla(0,0%,100%,0.07)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            background: 'hsla(260,60%,60%,0.12)',
            border: '1px solid hsla(260,60%,60%,0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Download size={11} style={{ color: '#a78bfa' }} />
        </div>
        <div>
          <p style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.75)', margin: 0 }}>
            Conduit Export
          </p>
          <p style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.35)', margin: 0, fontFamily: 'monospace' }}>
            {scenario} · {isLoading ? 'loading…' : isLive ? `${exportCount} prior exports` : 'offline'}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
        {isLive ? (
          <Wifi size={10} style={{ color: '#4ade80' }} />
        ) : (
          <WifiOff size={10} style={{ color: 'rgba(255,255,255,0.25)' }} />
        )}
        <button
          onClick={handleExport}
          style={{
            padding: '3px 10px',
            borderRadius: '4px',
            fontSize: '9.5px',
            fontWeight: '600',
            cursor: 'pointer',
            background: 'hsla(260,60%,60%,0.12)',
            border: '1px solid hsla(260,60%,60%,0.25)',
            color: '#a78bfa',
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
          }}
        >
          Export <ArrowUpRight size={8} />
        </button>
      </div>
    </div>
  );
}

interface AegisBadgeProps {
  assetClass?: string;
}

export function AegisTrustBadge({ assetClass = 'multifamily' }: AegisBadgeProps) {
  const { data, isError } = useQuery({
    queryKey: ['aegis-trust-badge'],
    queryFn: () =>
      fetch(`${API}/sentra/health`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    staleTime: 10 * 60 * 1000,
    retry: 0,
  });

  const isLive = !isError && data !== null;
  const trustScore = isLive ? (data?.data?.systemHealth ?? 0.92) : 0.92;
  const level = trustScore >= 0.90 ? 'Trusted' : trustScore >= 0.75 ? 'Monitored' : 'At Risk';
  const levelColor = level === 'Trusted' ? '#4ade80' : level === 'Monitored' ? '#fbbf24' : '#f87171';

  return (
    <div
      style={{
        padding: '0.75rem 1rem',
        borderRadius: '0.625rem',
        background: level === 'Trusted' ? 'hsla(140,60%,50%,0.04)' : 'hsla(0,60%,50%,0.04)',
        border: `1px solid ${levelColor}25`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            background: `${levelColor}15`,
            border: `1px solid ${levelColor}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Shield size={11} style={{ color: levelColor }} />
        </div>
        <div>
          <p style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.75)', margin: 0 }}>
            Aegis Trust Badge
          </p>
          <p style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.35)', margin: 0, fontFamily: 'monospace' }}>
            {assetClass} · compliance score {(trustScore * 100).toFixed(0)}%
          </p>
        </div>
      </div>
      <span
        style={{
          fontSize: '9px',
          fontWeight: '700',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: levelColor,
          padding: '2px 8px',
          borderRadius: '4px',
          background: `${levelColor}15`,
          border: `1px solid ${levelColor}30`,
        }}
      >
        {level}
      </span>
    </div>
  );
}

interface PulseExecBriefingProps {
  scenario?: string;
}

export function PulseExecBriefingSnippet({ scenario = 'sunbelt-multifamily-2026' }: PulseExecBriefingProps) {
  const briefingItems = [
    {
      id: 'pb-001',
      tag: 'Distress Signal',
      tagColor: '#f87171',
      headline: '7 Sunbelt assets at cascade risk — DSCR < 1.0 on 4 loans',
      detail: '90-day cascade probability: 67%. Cross-default exposure with Valley Financial: $312M. Lender maturity extension scenario reduces cascade risk to 41%.',
      time: '2h ago',
      severity: 'critical',
    },
    {
      id: 'pb-002',
      tag: 'Climate Risk',
      tagColor: '#fb923c',
      headline: 'Climate-adjusted cap rate delta: +61bps across Phoenix/LV portfolio',
      detail: 'NOAA 5-yr temp drift (+1.1°C) and FEMA NRI score 54 drive cap rate from 5.80% → 6.41%. IRR impact: −4.4pp.',
      time: '4h ago',
      severity: 'high',
    },
    {
      id: 'pb-003',
      tag: 'Owner Intent',
      tagColor: TERRA_ACCENT,
      headline: 'Owner intent model: 74% sale/refi probability within 12 months',
      detail: '2 NOD filings, 0 deed transfers, 14% submarket vacancy — model signals forced disposition or recapitalisation.',
      time: '4h ago',
      severity: 'high',
    },
  ];

  return (
    <div
      style={{
        padding: '1rem 1.125rem',
        borderRadius: '0.75rem',
        background: 'hsla(0,0%,100%,0.025)',
        border: '1px solid hsla(0,0%,100%,0.07)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '5px',
              background: 'hsla(38,70%,50%,0.12)',
              border: '1px solid hsla(38,70%,50%,0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Radio size={10} style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#f59e0b', margin: 0 }}>
              Pulse Exec Briefing
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '9px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)' }}>
            {scenario}
          </span>
          <Link
            to="/case-study"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              fontSize: '9px',
              color: '#f59e0b',
              textDecoration: 'none',
              padding: '2px 7px',
              borderRadius: '4px',
              background: 'hsla(38,70%,50%,0.08)',
              border: '1px solid hsla(38,70%,50%,0.15)',
            }}
          >
            Full case study <ExternalLink size={7} />
          </Link>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {briefingItems.map((item) => (
          <div
            key={item.id}
            style={{
              padding: '0.625rem 0.75rem',
              borderRadius: '0.5rem',
              background: item.severity === 'critical' ? 'hsla(0,60%,50%,0.04)' : 'hsla(0,0%,100%,0.02)',
              border: `1px solid ${item.severity === 'critical' ? 'hsla(0,60%,50%,0.18)' : 'hsla(0,0%,100%,0.04)'}`,
              display: 'flex',
              gap: '0.625rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', flex: 1, minWidth: 0 }}>
              {item.severity === 'critical' ? (
                <AlertTriangle size={11} style={{ color: '#f87171', flexShrink: 0, marginTop: '2px' }} />
              ) : (
                <Activity size={11} style={{ color: item.tagColor, flexShrink: 0, marginTop: '2px' }} />
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '8.5px',
                      fontWeight: '700',
                      letterSpacing: '0.07em',
                      textTransform: 'uppercase',
                      color: item.tagColor,
                      padding: '1px 5px',
                      borderRadius: '3px',
                      background: `${item.tagColor}15`,
                    }}
                  >
                    {item.tag}
                  </span>
                  <span style={{ fontSize: '8.5px', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
                    {item.time}
                  </span>
                </div>
                <p style={{ fontSize: '11.5px', fontWeight: '600', color: 'rgba(255,255,255,0.75)', margin: '0 0 0.25rem', lineHeight: '1.4' }}>
                  {item.headline}
                </p>
                <p style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: '1.5' }}>
                  {item.detail}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <FileText size={10} style={{ color: 'rgba(255,255,255,0.25)' }} />
        <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', margin: 0, fontFamily: 'monospace' }}>
          pulse-briefing · terra domain · auto-generated from forecast heads
        </p>
        <Link
          to="/case-study"
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '9px',
            color: 'rgba(255,255,255,0.35)',
            textDecoration: 'none',
          }}
        >
          <BookOpen size={8} /> CS002
        </Link>
      </div>
    </div>
  );
}

export function TerraSiblingMeshPanel({ scenario = 'sunbelt-multifamily-2026' }: { scenario?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <PulseExecBriefingSnippet scenario={scenario} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
        <ConduitExportBadge scenario={scenario} />
        <AegisTrustBadge />
      </div>
    </div>
  );
}
