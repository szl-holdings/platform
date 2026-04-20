import { DataProvenance } from '@szl-holdings/shared-ui/data-provenance';
import type { DataProvenanceInfo } from '@szl-holdings/shared-ui/ontology';
import { m } from 'framer-motion';
import {
  ArrowUpRight,
  BarChart2,
  DollarSign,
  GitBranch,
  MessageSquare,
  Mic,
  Package,
  Users,
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
  source: 'Distribution OS — Content Performance Attribution',
  lastUpdated: new Date().toISOString(),
  freshness: 'minutes',
  confidence: 'high',
  dataState: 'demo',
};

interface Funnel {
  views: number;
  uniqueReaders: number;
  emailCaptures: number;
  leads: number;
  consultingInquiries: number;
  productSales: number;
  revenueAttributed: number;
}
interface Outcome {
  type: string;
  value: string;
  detail: string;
}
interface ContentAttribution {
  id: number;
  title: string;
  publishedAt: string | null;
  funnel: Funnel;
  businessOutcomes: Outcome[];
  revenueImpactScore: number;
}
interface AttributionData {
  content: ContentAttribution[];
  summary: {
    totalRevenue: number;
    avgRevenuePerPiece: number;
    totalLeads: number;
    topPerformer: string | null;
  };
}

const OUTCOME_ICONS: Record<string, typeof DollarSign> = {
  consulting_inquiry: MessageSquare,
  revenue: DollarSign,
  speaking: Mic,
  product: Package,
};

function FunnelStep({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span
        style={{ fontSize: '0.625rem', color: DS.text.muted, minWidth: 90, textAlign: 'right' }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: 16,
          background: `${color}12`,
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <m.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 3 }}
        />
      </div>
      <span
        style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: DS.text.primary,
          minWidth: 40,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value.toLocaleString()}
      </span>
    </div>
  );
}

export default function ContentAttributionPage() {
  const [location] = useLocation();
  const [data, setData] = useState<AttributionData | null>(null);
  const [selected, setSelected] = useState<ContentAttribution | null>(null);
  const [sortBy, setSortBy] = useState<'revenue' | 'leads' | 'views'>('revenue');

  useEffect(() => {
    fetch(`${API}/api/distribution-os/attribution/funnel`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (d.content?.length) setSelected(d.content[0]);
      })
      .catch(() => {});
  }, []);

  const sorted = [...(data?.content ?? [])].sort((a, b) => {
    if (sortBy === 'revenue') return b.funnel.revenueAttributed - a.funnel.revenueAttributed;
    if (sortBy === 'leads') return b.funnel.leads - a.funnel.leads;
    return b.funnel.views - a.funnel.views;
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
              <GitBranch size={18} style={{ color: DS.accent }} /> Content Performance Attribution
            </h1>
            <p style={{ fontSize: '0.75rem', color: DS.text.tertiary, marginTop: '0.25rem' }}>
              Full-funnel tracking from content to business outcome — revenue impact per piece
            </p>
          </div>
          <DataProvenance provenance={PROV} />
        </div>

        {/* Summary */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          {[
            {
              label: 'Total Attributed Revenue',
              value: data ? `$${data.summary.totalRevenue.toLocaleString()}` : '—',
              color: DS.green,
              icon: DollarSign,
            },
            {
              label: 'Avg Revenue / Piece',
              value: data ? `$${data.summary.avgRevenuePerPiece.toLocaleString()}` : '—',
              color: DS.accent,
              icon: BarChart2,
            },
            {
              label: 'Total Leads Generated',
              value: data?.summary.totalLeads?.toLocaleString() ?? '—',
              color: DS.blue,
              icon: Users,
            },
            {
              label: 'Content Tracked',
              value: data?.content.length ?? '—',
              color: '#9b7fd4',
              icon: GitBranch,
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
                  fontSize:
                    typeof value === 'string' && value.startsWith('$') ? '1.375rem' : '1.75rem',
                  fontWeight: 700,
                  color: DS.text.primary,
                  letterSpacing: '-0.025em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {value}
              </div>
              <div style={{ fontSize: '0.6875rem', color: DS.text.tertiary, marginTop: '0.25rem' }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Sort */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}
        >
          <span style={{ fontSize: '0.6875rem', color: DS.text.muted }}>Sort by:</span>
          {(['revenue', 'leads', 'views'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              style={{
                padding: '0.25rem 0.625rem',
                borderRadius: '5px',
                border: `1px solid ${sortBy === s ? DS.accent + '40' : DS.border}`,
                background: sortBy === s ? `${DS.accent}10` : 'transparent',
                color: sortBy === s ? DS.accent : DS.text.muted,
                fontSize: '0.6875rem',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1rem' }}>
          {/* Content list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {sorted.map((c) => {
              const isSelected = selected?.id === c.id;
              const impactColor =
                c.revenueImpactScore >= 70
                  ? DS.green
                  : c.revenueImpactScore >= 40
                    ? DS.accent
                    : DS.text.tertiary;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  style={{
                    padding: '0.875rem 1rem',
                    background: isSelected ? `${DS.accent}07` : DS.surface,
                    border: `1px solid ${isSelected ? DS.accent + '25' : DS.border}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
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
                    <span
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: DS.text.primary,
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginRight: '0.75rem',
                      }}
                    >
                      {c.title}
                    </span>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        background: `${impactColor}14`,
                        color: impactColor,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      Impact {c.revenueImpactScore}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.625rem', color: DS.text.muted }}>Revenue: </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: DS.green }}>
                        {c.funnel.revenueAttributed > 0
                          ? `$${c.funnel.revenueAttributed.toLocaleString()}`
                          : '—'}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.625rem', color: DS.text.muted }}>Leads: </span>
                      <span
                        style={{ fontSize: '0.75rem', fontWeight: 600, color: DS.text.primary }}
                      >
                        {c.funnel.leads}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.625rem', color: DS.text.muted }}>Views: </span>
                      <span style={{ fontSize: '0.75rem', color: DS.text.secondary }}>
                        {c.funnel.views.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail */}
          {selected && (
            <div
              style={{
                padding: '1.25rem',
                background: DS.surface,
                border: `1px solid ${DS.border}`,
                borderRadius: '10px',
                position: 'sticky',
                top: '1rem',
                maxHeight: 'calc(100vh - 8rem)',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: DS.text.primary,
                  marginBottom: '0.25rem',
                  lineHeight: 1.3,
                }}
              >
                {selected.title}
              </div>
              {selected.publishedAt && (
                <div style={{ fontSize: '0.6875rem', color: DS.text.muted, marginBottom: '1rem' }}>
                  {new Date(selected.publishedAt).toLocaleDateString()}
                </div>
              )}

              {/* Funnel visualization */}
              <div style={{ marginBottom: '1.125rem' }}>
                <div
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: DS.text.tertiary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '0.625rem',
                  }}
                >
                  Conversion Funnel
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <FunnelStep
                    label="Views"
                    value={selected.funnel.views}
                    total={selected.funnel.views}
                    color={DS.blue}
                  />
                  <FunnelStep
                    label="Unique Readers"
                    value={selected.funnel.uniqueReaders}
                    total={selected.funnel.views}
                    color={DS.blue}
                  />
                  <FunnelStep
                    label="Email Captures"
                    value={selected.funnel.emailCaptures}
                    total={selected.funnel.views}
                    color={DS.accent}
                  />
                  <FunnelStep
                    label="Leads"
                    value={selected.funnel.leads}
                    total={selected.funnel.views}
                    color={DS.accent}
                  />
                  <FunnelStep
                    label="Inquiries"
                    value={selected.funnel.consultingInquiries}
                    total={selected.funnel.views}
                    color={DS.green}
                  />
                  <FunnelStep
                    label="Product Sales"
                    value={selected.funnel.productSales}
                    total={selected.funnel.views}
                    color={DS.green}
                  />
                </div>
              </div>

              {/* Revenue */}
              <div
                style={{
                  padding: '0.875rem',
                  background: `${DS.green}08`,
                  border: `1px solid ${DS.green}18`,
                  borderRadius: '8px',
                  marginBottom: '1rem',
                }}
              >
                <div
                  style={{ fontSize: '0.625rem', color: DS.text.muted, marginBottom: '0.25rem' }}
                >
                  Revenue Attributed
                </div>
                <div
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: DS.green,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {selected.funnel.revenueAttributed > 0
                    ? `$${selected.funnel.revenueAttributed.toLocaleString()}`
                    : '—'}
                </div>
                <div style={{ fontSize: '0.625rem', color: DS.text.muted }}>
                  direct + influenced pipeline
                </div>
              </div>

              {/* Business outcomes */}
              {selected.businessOutcomes.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: DS.text.tertiary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Business Outcomes
                  </div>
                  {selected.businessOutcomes.map((o, i) => {
                    const Icon = OUTCOME_ICONS[o.type] || ArrowUpRight;
                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          marginBottom: '0.5rem',
                          padding: '0.625rem 0.75rem',
                          background: DS.elevated,
                          borderRadius: '7px',
                        }}
                      >
                        <Icon
                          size={13}
                          style={{ color: DS.accent, marginTop: '1px', flexShrink: 0 }}
                        />
                        <div>
                          <div
                            style={{ fontSize: '0.75rem', fontWeight: 600, color: DS.text.primary }}
                          >
                            {o.value}
                          </div>
                          <div style={{ fontSize: '0.625rem', color: DS.text.muted }}>
                            {o.detail}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </m.div>
    </DistributionOsLayout>
  );
}
