import { DataProvenance } from '@szl-holdings/shared-ui/data-provenance';
import type { DataProvenanceInfo } from '@szl-holdings/shared-ui/ontology';
import { m } from 'framer-motion';
import {
  ArrowUpRight,
  BarChart2,
  DollarSign,
  Link2,
  Megaphone,
  Package,
  Target,
  TrendingUp,
  Zap,
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
  source: 'Distribution OS — Autonomous Monetization Optimizer',
  lastUpdated: new Date().toISOString(),
  freshness: 'minutes',
  confidence: 'high',
  dataState: 'demo',
};

const SOURCE_ICONS: Record<string, typeof DollarSign> = {
  Sponsorships: Megaphone,
  'Digital Products': Package,
  'Consulting Inquiries': Target,
  'Affiliate Links': Link2,
  'Ad Inventory': BarChart2,
};

interface RevenueSource {
  source: string;
  amount: number;
  share: number;
  trend: string;
  rateCard: number | null;
  demandScore: number;
}
interface Recommendation {
  priority: string;
  action: string;
  impact: string;
}
interface TopContent {
  title: string;
  revenue: number;
  conversions: number;
}
interface MonetizationData {
  monthlyRevenue: number;
  revenueGrowth: number;
  revenueBySource: RevenueSource[];
  recommendations: Recommendation[];
  topRevenueContent: TopContent[];
}
interface AttributionContent {
  id: number;
  title: string;
  directRevenue: number;
  influencedRevenue: number;
  leads: number;
  consultingInquiries: number;
  productSales: number;
  speakingEngagements: number;
}

export default function MonetizationOptimizerPage() {
  const [location] = useLocation();
  const [data, setData] = useState<MonetizationData | null>(null);
  const [attribution, setAttribution] = useState<{ content: AttributionContent[] } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'attribution'>('overview');

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/distribution-os/monetization/overview`, { credentials: 'include' }).then(
        (r) => r.json(),
      ),
      fetch(`${API}/api/distribution-os/monetization/attribution`, { credentials: 'include' }).then(
        (r) => r.json(),
      ),
    ])
      .then(([o, a]) => {
        setData(o);
        setAttribution(a);
      })
      .catch(() => {});
  }, []);

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
              <DollarSign size={18} style={{ color: DS.accent }} /> Autonomous Monetization
              Optimizer
            </h1>
            <p style={{ fontSize: '0.75rem', color: DS.text.tertiary, marginTop: '0.25rem' }}>
              Dynamic rate adjustment, placement optimization, and full-funnel revenue attribution
            </p>
          </div>
          <DataProvenance provenance={PROV} />
        </div>

        {/* Revenue summary */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          <div
            style={{
              padding: '1.25rem',
              background: DS.surface,
              border: `1px solid ${DS.border}`,
              borderRadius: '10px',
              position: 'relative',
              overflow: 'hidden',
              gridColumn: 'span 1',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: `linear-gradient(90deg, ${DS.accent}60, transparent)`,
              }}
            />
            <DollarSign size={14} style={{ color: DS.accent, marginBottom: '0.5rem' }} />
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 700,
                color: DS.text.primary,
                letterSpacing: '-0.03em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              ${data?.monthlyRevenue.toLocaleString() ?? '—'}
            </div>
            <div style={{ fontSize: '0.6875rem', color: DS.text.tertiary }}>Monthly Revenue</div>
            {data?.revenueGrowth && (
              <div
                style={{
                  marginTop: '0.375rem',
                  fontSize: '0.75rem',
                  color: DS.green,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <ArrowUpRight size={12} /> +{data.revenueGrowth}% month-over-month
              </div>
            )}
          </div>
          <div
            style={{
              padding: '1.25rem',
              background: DS.surface,
              border: `1px solid ${DS.border}`,
              borderRadius: '10px',
              gridColumn: 'span 2',
            }}
          >
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: DS.text.tertiary,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.875rem',
              }}
            >
              Revenue by Source
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {data?.revenueBySource.map((src) => {
                const Icon = SOURCE_ICONS[src.source] || DollarSign;
                const trendColor =
                  src.trend === 'up' ? DS.green : src.trend === 'down' ? DS.red : DS.text.tertiary;
                return (
                  <div
                    key={src.source}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                  >
                    <Icon size={13} style={{ color: DS.accent, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.75rem', color: DS.text.secondary, minWidth: 140 }}>
                      {src.source}
                    </span>
                    <div
                      style={{ flex: 1, height: 4, background: `${DS.accent}14`, borderRadius: 2 }}
                    >
                      <m.div
                        initial={{ width: 0 }}
                        animate={{ width: `${src.share}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{ height: '100%', background: DS.accent, borderRadius: 2 }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: DS.text.primary,
                        minWidth: 64,
                        textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      ${src.amount.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: trendColor, minWidth: 28 }}>
                      {src.demandScore}/100
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {(['overview', 'attribution'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.375rem 0.875rem',
                borderRadius: '6px',
                border: `1px solid ${activeTab === tab ? DS.accent + '40' : DS.border}`,
                background: activeTab === tab ? `${DS.accent}10` : 'transparent',
                color: activeTab === tab ? DS.accent : DS.text.tertiary,
                fontSize: '0.8125rem',
                fontWeight: activeTab === tab ? 600 : 400,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* AI recommendations */}
            <div
              style={{
                padding: '1.25rem',
                background: DS.surface,
                border: `1px solid ${DS.border}`,
                borderRadius: '10px',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: DS.text.tertiary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}
              >
                <Zap size={12} style={{ color: DS.accent }} /> AI Monetization Recommendations
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {data?.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '0.875rem',
                      background: DS.elevated,
                      border: `1px solid ${rec.priority === 'high' ? DS.accent + '20' : DS.border}`,
                      borderRadius: '8px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.375rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.625rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: rec.priority === 'high' ? DS.accent : DS.text.tertiary,
                          padding: '0.1rem 0.5rem',
                          borderRadius: '4px',
                          background:
                            rec.priority === 'high' ? `${DS.accent}14` : `${DS.text.tertiary}14`,
                        }}
                      >
                        {rec.priority}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: DS.green }}>
                        {rec.impact}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: '0.75rem',
                        color: DS.text.secondary,
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {rec.action}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top revenue content */}
            <div
              style={{
                padding: '1.25rem',
                background: DS.surface,
                border: `1px solid ${DS.border}`,
                borderRadius: '10px',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: DS.text.tertiary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '0.875rem',
                }}
              >
                Top Revenue-Generating Content
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {data?.topRevenueContent.map((c, i) => (
                  <div
                    key={i}
                    style={{ padding: '0.875rem', background: DS.elevated, borderRadius: '8px' }}
                  >
                    <div
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: DS.text.primary,
                        marginBottom: '0.5rem',
                        lineHeight: 1.3,
                      }}
                    >
                      {c.title}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.6875rem', color: DS.text.muted }}>Revenue</div>
                        <div
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: DS.green,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          ${c.revenue.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.6875rem', color: DS.text.muted }}>
                          Conversions
                        </div>
                        <div
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: DS.text.primary,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {c.conversions}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attribution' && (
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
                gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr 1fr',
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
              <span>Direct $</span>
              <span>Influenced $</span>
              <span>Leads</span>
              <span>Inquiries</span>
              <span>Products</span>
            </div>
            {attribution?.content.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr 1fr',
                  padding: '0.75rem 1rem',
                  borderBottom: `1px solid ${DS.border}`,
                  gap: '0.5rem',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: DS.text.secondary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c.title}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: c.directRevenue > 0 ? DS.green : DS.text.muted,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {c.directRevenue > 0 ? `$${c.directRevenue.toLocaleString()}` : '—'}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: DS.text.secondary,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {c.influencedRevenue > 0 ? `$${c.influencedRevenue.toLocaleString()}` : '—'}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: DS.text.secondary,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {c.leads}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: c.consultingInquiries > 0 ? DS.accent : DS.text.muted,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {c.consultingInquiries || '—'}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: c.productSales > 0 ? DS.blue : DS.text.muted,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {c.productSales || '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </m.div>
    </DistributionOsLayout>
  );
}
