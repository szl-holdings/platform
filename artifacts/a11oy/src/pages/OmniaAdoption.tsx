import {
  Activity,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Globe,
  RefreshCw,
  Shield,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const ACCENT = '#c9b787';
const OMNIA_PURPLE = '#8b7ac8';

const ARTIFACT_META: Record<string, { color: string; name: string }> = {
  command: { color: '#6366f1', name: 'Command' },
  holdings: { color: '#c9b787', name: 'SZL Holdings' },
  aegis: { color: '#ef4444', name: 'Aegis' },
  tenax: { color: '#22c55e', name: 'TENAX' },
  terra: { color: '#22c55e', name: 'Terra' },
  vessels: { color: '#4d8fcc', name: 'Vessels' },
  counsel: { color: '#8b5cf6', name: 'Counsel' },
  a11oy: { color: '#c9b787', name: 'A11oy' },
  pulse: { color: '#f59e0b', name: 'Pulse' },
  'carlota-jo': { color: '#8b7ac8', name: 'Carlota Jo' },
  lyte: { color: '#3b82f6', name: 'Lyte' },
  praxis: { color: '#8b7ac8', name: 'Praxis' },
};

const TOTAL_ARTIFACTS = Object.keys(ARTIFACT_META).length;

interface AdoptionStatus {
  artifactId: string;
  shellVersion: string;
  commandPaletteWired: boolean;
  lastBeacon: string;
  status: 'adopted' | 'partial' | 'pending';
}

interface AdoptionData {
  adoption: AdoptionStatus[];
  totalArtifacts: number;
  adoptedCount: number;
  adoptionRate: number;
  lastUpdated: string;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

const MOCK_DATA: AdoptionData = {
  adoption: [
    { artifactId: 'command', shellVersion: '1.0.0', commandPaletteWired: true, lastBeacon: new Date(Date.now() - 45_000).toISOString(), status: 'adopted' },
    { artifactId: 'holdings', shellVersion: '1.0.0', commandPaletteWired: true, lastBeacon: new Date(Date.now() - 2 * 60_000).toISOString(), status: 'adopted' },
    { artifactId: 'aegis', shellVersion: '1.0.0', commandPaletteWired: true, lastBeacon: new Date(Date.now() - 5 * 60_000).toISOString(), status: 'adopted' },
    { artifactId: 'tenax', shellVersion: '1.0.0', commandPaletteWired: true, lastBeacon: new Date(Date.now() - 8 * 60_000).toISOString(), status: 'adopted' },
    { artifactId: 'terra', shellVersion: '1.0.0', commandPaletteWired: true, lastBeacon: new Date(Date.now() - 12 * 60_000).toISOString(), status: 'adopted' },
    { artifactId: 'vessels', shellVersion: '1.0.0', commandPaletteWired: true, lastBeacon: new Date(Date.now() - 15 * 60_000).toISOString(), status: 'adopted' },
    { artifactId: 'counsel', shellVersion: '1.0.0', commandPaletteWired: true, lastBeacon: new Date(Date.now() - 20 * 60_000).toISOString(), status: 'adopted' },
    { artifactId: 'a11oy', shellVersion: '1.0.0', commandPaletteWired: true, lastBeacon: new Date(Date.now() - 30 * 60_000).toISOString(), status: 'adopted' },
    { artifactId: 'pulse', shellVersion: '1.0.0', commandPaletteWired: true, lastBeacon: new Date(Date.now() - 35 * 60_000).toISOString(), status: 'adopted' },
    { artifactId: 'carlota-jo', shellVersion: '1.0.0', commandPaletteWired: false, lastBeacon: new Date(Date.now() - 60 * 60_000).toISOString(), status: 'partial' },
    { artifactId: 'lyte', shellVersion: '1.0.0', commandPaletteWired: true, lastBeacon: new Date(Date.now() - 45 * 60_000).toISOString(), status: 'adopted' },
    { artifactId: 'praxis', shellVersion: '0.9.0', commandPaletteWired: false, lastBeacon: new Date(Date.now() - 2 * 3600_000).toISOString(), status: 'partial' },
  ],
  totalArtifacts: TOTAL_ARTIFACTS,
  adoptedCount: 10,
  adoptionRate: 0.83,
  lastUpdated: new Date(Date.now() - 2 * 60_000).toISOString(),
};

const STATUS_COLORS = {
  adopted: '#22c55e',
  partial: '#f59e0b',
  pending: '#6b7280',
};

const STATUS_LABELS = {
  adopted: 'Adopted',
  partial: 'Partial',
  pending: 'Pending',
};

export function OmniaAdoption() {
  const [data, setData] = useState<AdoptionData>(MOCK_DATA);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async (showR = false) => {
    if (showR) setRefreshing(true);
    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, '').replace(/\/a11oy$/, '');
      const res = await fetch(`${base}/api/omnia/adoption`);
      if (res.ok) setData(await res.json());
    } catch {
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30_000);
    return () => clearInterval(t);
  }, []);

  const adoptedArtifacts = data.adoption.filter((a) => a.status === 'adopted');
  const partialArtifacts = data.adoption.filter((a) => a.status === 'partial');
  const pendingArtifacts = data.adoption.filter((a) => a.status === 'pending');
  const adoptionPct = Math.round(data.adoptionRate * 100);

  return (
    <div
      style={{
        padding: '0 0 40px',
        maxWidth: 900,
        color: 'rgba(235,230,220,0.9)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 28,
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 6,
            }}
          >
            <Globe size={20} style={{ color: OMNIA_PURPLE }} />
            <h1
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: 'rgba(235,230,220,0.95)',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              OMNIA Shell Adoption
            </h1>
          </div>
          <p
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.45)',
              margin: 0,
            }}
          >
            Shell health · command palette coverage · version drift across the portfolio
          </p>
        </div>
        <button
          onClick={() => refresh(true)}
          disabled={refreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            background: `${OMNIA_PURPLE}12`,
            border: `1px solid ${OMNIA_PURPLE}30`,
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 12,
            color: OMNIA_PURPLE,
          }}
        >
          <RefreshCw
            size={11}
            style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}
          />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
          marginBottom: 28,
        }}
      >
        {[
          {
            label: 'Adoption Rate',
            value: `${adoptionPct}%`,
            sub: `${data.adoptedCount} of ${data.totalArtifacts} artifacts`,
            color: adoptionPct >= 80 ? '#22c55e' : '#f59e0b',
            icon: TrendingUp,
          },
          {
            label: 'Fully Adopted',
            value: adoptedArtifacts.length,
            sub: 'command palette + beacon',
            color: '#22c55e',
            icon: CheckCircle2,
          },
          {
            label: 'Partial Adoption',
            value: partialArtifacts.length,
            sub: 'shell present, gaps remain',
            color: '#f59e0b',
            icon: Activity,
          },
          {
            label: 'Shell Version',
            value: '1.0.0',
            sub: 'OMNIA Shell current',
            color: OMNIA_PURPLE,
            icon: Zap,
          },
        ].map(({ label, value, sub, color, icon: Icon }) => (
          <div
            key={label}
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12,
              padding: '16px 18px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 10,
              }}
            >
              <Icon size={14} style={{ color, opacity: 0.8 }} />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                {label}
              </span>
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                color,
                marginBottom: 4,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {value}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{sub}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14,
          overflow: 'hidden',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            Artifact Status
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
            Updated {relativeTime(data.lastUpdated)}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {data.adoption.map((artifact, i) => {
            const meta = ARTIFACT_META[artifact.artifactId] ?? {
              color: OMNIA_PURPLE,
              name: artifact.artifactId,
            };
            const statusColor = STATUS_COLORS[artifact.status];
            const isLast = i >= data.adoption.length - (data.adoption.length % 3 || 3);
            return (
              <div
                key={artifact.artifactId}
                style={{
                  padding: '14px 18px',
                  borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
                  borderRight:
                    (i + 1) % 3 !== 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  background:
                    artifact.status === 'pending'
                      ? 'rgba(107,114,128,0.04)'
                      : 'transparent',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: meta.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'rgba(235,230,220,0.85)',
                      flex: 1,
                    }}
                  >
                    {meta.name}
                  </span>
                  <span
                    style={{
                      padding: '2px 8px',
                      background: `${statusColor}15`,
                      border: `1px solid ${statusColor}30`,
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 700,
                      color: statusColor,
                    }}
                  >
                    {STATUS_LABELS[artifact.status]}
                  </span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 4,
                  }}
                >
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                    Shell v{artifact.shellVersion}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                    {artifact.commandPaletteWired ? (
                      <span style={{ color: '#22c55e' }}>⌘K wired</span>
                    ) : (
                      <span style={{ color: '#f59e0b' }}>⌘K missing</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                    Active {relativeTime(artifact.lastBeacon)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          background: `${OMNIA_PURPLE}08`,
          border: `1px solid ${OMNIA_PURPLE}20`,
          borderRadius: 10,
        }}
      >
        <Shield size={16} style={{ color: OMNIA_PURPLE, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: OMNIA_PURPLE, marginBottom: 2 }}>
            OMNIA Adoption Policy
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
            All portfolio artifacts must adopt OMNIA Shell v1.0+ to maintain governed autonomy
            classification. Partial adoption artifacts have 14 days to close gaps before
            downgrade to SUPERVISED tier.
          </div>
        </div>
        <a
          href="/command/omnia"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            color: OMNIA_PURPLE,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            padding: '5px 10px',
            background: `${OMNIA_PURPLE}12`,
            border: `1px solid ${OMNIA_PURPLE}25`,
            borderRadius: 6,
          }}
        >
          OMNIA Hub <ExternalLink size={10} />
        </a>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
