import { DataProvenance } from '@szl-holdings/shared-ui/data-provenance';
import type { DataProvenanceInfo } from '@szl-holdings/shared-ui/ontology';
import { m } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  Archive,
  ArrowUpRight,
  BarChart2,
  CheckCircle2,
  Clock,
  Flame,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { DistributionOsLayout } from './admin-dashboard';

const API = import.meta.env.VITE_API_URL || '';

const DS = {
  surface: '#0b0f19',
  elevated: '#0f1420',
  border: 'rgba(255,255,255,0.05)',
  borderMuted: 'rgba(255,255,255,0.08)',
  accent: '#d4a054',
  green: '#5a9c5a',
  blue: '#4a8ab8',
  red: '#c45a4a',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    tertiary: 'rgba(255,255,255,0.28)',
    muted: 'rgba(255,255,255,0.14)',
  },
};

const PROV: DataProvenanceInfo = {
  source: 'Distribution OS — Content Lifecycle Intelligence',
  lastUpdated: new Date().toISOString(),
  freshness: 'minutes',
  confidence: 'high',
  dataState: 'demo',
};

const STAGE_CONFIG: Record<string, { label: string; color: string; icon: typeof Activity }> = {
  ideation: { label: 'Ideation', color: DS.blue, icon: Clock },
  creation: { label: 'Creation', color: DS.accent, icon: Activity },
  published: { label: 'Published', color: DS.blue, icon: CheckCircle2 },
  distributing: { label: 'Distributing', color: DS.green, icon: ArrowUpRight },
  evergreen: { label: 'Evergreen', color: '#9b7fd4', icon: Flame },
  declining: { label: 'Declining', color: DS.red, icon: TrendingUp },
  archived: { label: 'Archived', color: DS.text.tertiary as string, icon: Archive },
};

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: typeof RefreshCw }> = {
  redistribute: { label: 'Redistribute', color: DS.green, icon: RefreshCw },
  update: { label: 'Update Content', color: DS.accent, icon: Activity },
  promote: { label: 'Promote', color: DS.blue, icon: ArrowUpRight },
  archive: { label: 'Archive', color: DS.red, icon: Archive },
  none: { label: 'Performing Well', color: DS.text.tertiary as string, icon: CheckCircle2 },
};

interface ContentLifecycle {
  id: number;
  title: string;
  lifecycleStage: string;
  contentHealthScore: number;
  isEvergreen: boolean;
  totalViews: number;
  monthlyViews: number;
  redistributionCount: number;
  recommendedAction: string;
  revenueGenerated: number;
  publishedAt: string | null;
  ageInDays: number | null;
}

interface LifecycleData {
  content: ContentLifecycle[];
  summary: {
    evergreen: number;
    needsAction: number;
    totalContent: number;
    avgHealthScore: number;
    redistributionCandidates: number;
  };
}

function HealthBar({ score }: { score: number }) {
  const color = score >= 70 ? DS.green : score >= 45 ? DS.accent : DS.red;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: 4, background: `${color}14`, borderRadius: 2, maxWidth: 80 }}>
        <div
          style={{
            height: '100%',
            width: `${score}%`,
            background: color,
            borderRadius: 2,
            transition: 'width 0.8s ease',
          }}
        />
      </div>
      <span
        style={{
          fontSize: '0.6875rem',
          fontWeight: 600,
          color,
          fontVariantNumeric: 'tabular-nums',
          minWidth: 24,
        }}
      >
        {score}
      </span>
    </div>
  );
}

export default function LifecycleIntelligencePage() {
  const [location] = useLocation();
  const [data, setData] = useState<LifecycleData | null>(null);
  const [filter, setFilter] = useState<'all' | 'evergreen' | 'needs-action' | 'redistribute'>(
    'all',
  );

  useEffect(() => {
    fetch(`${API}/api/distribution-os/lifecycle/overview`, { credentials: 'include' })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  const filtered = (data?.content ?? []).filter((c) => {
    if (filter === 'evergreen') return c.isEvergreen;
    if (filter === 'needs-action') return c.recommendedAction !== 'none';
    if (filter === 'redistribute') return c.recommendedAction === 'redistribute';
    return true;
  });

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: DS.text.primary,
                letterSpacing: '-0.025em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Activity size={18} style={{ color: DS.accent }} /> Content Lifecycle Intelligence
            </h1>
            <p style={{ fontSize: '0.75rem', color: DS.text.tertiary, marginTop: '0.25rem' }}>
              Health tracking, evergreen identification, and auto-redistribution recommendations
            </p>
          </div>
          <DataProvenance provenance={PROV} />
        </div>

        {/* Summary */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          {[
            {
              label: 'Total Content',
              value: data?.summary.totalContent ?? '—',
              color: DS.blue,
              icon: BarChart2,
            },
            {
              label: 'Evergreen Assets',
              value: data?.summary.evergreen ?? '—',
              color: '#9b7fd4',
              icon: Flame,
            },
            {
              label: 'Avg Health Score',
              value: data ? `${data.summary.avgHealthScore}/100` : '—',
              color: DS.green,
              icon: Activity,
            },
            {
              label: 'Needs Action',
              value: data?.summary.needsAction ?? '—',
              color: DS.accent,
              icon: AlertCircle,
            },
            {
              label: 'Redistribution Queue',
              value: data?.summary.redistributionCandidates ?? '—',
              color: DS.green,
              icon: RefreshCw,
            },
          ].map(({ label, value, color, icon: Icon }) => (
            <div
              key={label}
              style={{
                padding: '1rem 1.25rem',
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
              <Icon size={14} style={{ color, marginBottom: '0.5rem' }} />
              <div
                style={{
                  fontSize: '1.375rem',
                  fontWeight: 700,
                  color: DS.text.primary,
                  letterSpacing: '-0.025em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {value}
              </div>
              <div style={{ fontSize: '0.625rem', color: DS.text.tertiary, marginTop: '0.25rem' }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {(
            [
              { key: 'all', label: 'All Content' },
              { key: 'evergreen', label: 'Evergreen' },
              { key: 'needs-action', label: 'Needs Action' },
              { key: 'redistribute', label: 'Redistribute' },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: '6px',
                border: `1px solid ${filter === f.key ? `${DS.accent}40` : DS.border}`,
                background: filter === f.key ? `${DS.accent}10` : 'transparent',
                color: filter === f.key ? DS.accent : DS.text.tertiary,
                fontSize: '0.75rem',
                fontWeight: filter === f.key ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content table */}
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
              display: 'grid',
              gridTemplateColumns: '3fr 100px 90px 80px 80px 100px 120px',
              padding: '0.625rem 1rem',
              borderBottom: `1px solid ${DS.border}`,
              fontSize: '0.625rem',
              fontWeight: 700,
              color: DS.text.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              gap: '0.5rem',
            }}
          >
            <span>Content</span>
            <span>Stage</span>
            <span>Health</span>
            <span>Views/Mo</span>
            <span>Total $</span>
            <span>Distrib.</span>
            <span>Action</span>
          </div>
          {filtered.map((c) => {
            const stageCfg = STAGE_CONFIG[c.lifecycleStage] || STAGE_CONFIG.published;
            const actionCfg = ACTION_CONFIG[c.recommendedAction] || ACTION_CONFIG.none;
            const StageIcon = stageCfg.icon;
            const ActionIcon = actionCfg.icon;
            return (
              <m.div
                key={c.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '3fr 100px 90px 80px 80px 100px 120px',
                  padding: '0.75rem 1rem',
                  borderBottom: `1px solid ${DS.border}`,
                  gap: '0.5rem',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: DS.text.secondary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: '0.125rem',
                    }}
                  >
                    {c.title}
                  </div>
                  {c.isEvergreen && (
                    <span
                      style={{
                        fontSize: '0.5625rem',
                        padding: '0.1rem 0.375rem',
                        borderRadius: '3px',
                        background: '#9b7fd414',
                        color: '#9b7fd4',
                        fontWeight: 600,
                      }}
                    >
                      EVERGREEN
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <StageIcon size={11} style={{ color: stageCfg.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.6875rem', color: stageCfg.color }}>
                    {stageCfg.label}
                  </span>
                </div>
                <HealthBar score={c.contentHealthScore} />
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: DS.text.secondary,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {c.monthlyViews.toLocaleString()}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: c.revenueGenerated > 0 ? DS.green : DS.text.muted,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {c.revenueGenerated > 0 ? `$${(c.revenueGenerated / 1000).toFixed(1)}k` : '—'}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: DS.text.muted,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {c.redistributionCount}×
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <ActionIcon size={11} style={{ color: actionCfg.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.6875rem', color: actionCfg.color }}>
                    {actionCfg.label}
                  </span>
                </div>
              </m.div>
            );
          })}
        </div>
      </m.div>
    </DistributionOsLayout>
  );
}
