import { motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  Database,
  FileText,
  Minus,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';
import { usePageMeta } from '@/hooks/usePageMeta';

const GOLD = 'var(--color-gold)';

type BenchmarkCategory = {
  id: string;
  name: string;
  description: string;
  icon: typeof BarChart3;
  color: string;
  metrics: Benchmark[];
};

type Benchmark = {
  name: string;
  unit: string;
  p25: number | string;
  median: number | string;
  p75: number | string;
  topDecile: number | string;
  source: string;
  trend: 'up' | 'down' | 'flat';
  clientValue?: number | string;
  notes?: string;
};

const CATEGORIES: BenchmarkCategory[] = [
  {
    id: 'financial',
    name: 'Financial Performance',
    description:
      'Revenue, profitability, and capital efficiency benchmarks across professional services',
    icon: TrendingUp,
    color: '#059669',
    metrics: [
      {
        name: 'Revenue per Employee',
        unit: '£K/year',
        p25: 85,
        median: 120,
        p75: 185,
        topDecile: 280,
        source: 'Consulting Industry Survey 2025',
        trend: 'up',
        notes: 'Boutique firms outperform large firms at the top decile',
      },
      {
        name: 'EBITDA Margin',
        unit: '%',
        p25: 12,
        median: 18,
        p75: 26,
        topDecile: 38,
        source: 'Benchmarking Partners UK',
        trend: 'up',
      },
      {
        name: 'Client Revenue Concentration (Top 3)',
        unit: '%',
        p25: 55,
        median: 45,
        p75: 38,
        topDecile: 30,
        source: 'Industry analysis',
        trend: 'down',
        notes: 'Lower is better — indicates diversified revenue base',
      },
      {
        name: 'Revenue Growth (YoY)',
        unit: '%',
        p25: 4,
        median: 12,
        p75: 24,
        topDecile: 42,
        source: 'MCA UK Report 2025',
        trend: 'up',
      },
    ],
  },
  {
    id: 'delivery',
    name: 'Delivery Excellence',
    description: 'Operational metrics for consulting delivery quality and efficiency',
    icon: Target,
    color: '#0284C7',
    metrics: [
      {
        name: 'Project On-Time Delivery Rate',
        unit: '%',
        p25: 68,
        median: 79,
        p75: 89,
        topDecile: 96,
        source: 'PMI LUMINA of the Profession',
        trend: 'up',
      },
      {
        name: 'Scope Creep Rate (uncompensated)',
        unit: '%',
        p25: 28,
        median: 18,
        p75: 10,
        topDecile: 4,
        source: 'Consulting Ops Benchmark',
        trend: 'down',
        notes: 'Lower is better',
      },
      {
        name: 'Proposal Win Rate',
        unit: '%',
        p25: 28,
        median: 38,
        p75: 52,
        topDecile: 68,
        source: 'Hinge Research 2025',
        trend: 'up',
        clientValue: 94,
      },
      {
        name: 'Client Repeat Engagement Rate',
        unit: '%',
        p25: 45,
        median: 62,
        p75: 78,
        topDecile: 90,
        source: 'Industry Survey 2025',
        trend: 'up',
      },
    ],
  },
  {
    id: 'client',
    name: 'Client Relationships',
    description: 'Net Promoter Scores, satisfaction metrics, and relationship depth benchmarks',
    icon: Target,
    color: '#D97706',
    metrics: [
      {
        name: 'Net Promoter Score (NPS)',
        unit: 'points',
        p25: 28,
        median: 42,
        p75: 58,
        topDecile: 74,
        source: 'Bain NPS Benchmarks 2025',
        trend: 'up',
        clientValue: 76,
      },
      {
        name: 'Client Satisfaction Score (CSAT)',
        unit: '/10',
        p25: 7.1,
        median: 7.8,
        p75: 8.4,
        topDecile: 9.1,
        source: 'In-survey benchmark data',
        trend: 'up',
        clientValue: 8.7,
      },
      {
        name: 'Avg Engagement Length',
        unit: 'months',
        p25: 3,
        median: 5.5,
        p75: 9,
        topDecile: 18,
        source: 'Consulting practice data',
        trend: 'up',
      },
      {
        name: 'Revenue per Client (lifetime)',
        unit: '£K',
        p25: 45,
        median: 85,
        p75: 180,
        topDecile: 520,
        source: 'Boutique consulting survey',
        trend: 'up',
      },
    ],
  },
  {
    id: 'talent',
    name: 'Talent & Utilisation',
    description: 'Team utilisation, talent density, and workforce productivity metrics',
    icon: BarChart3,
    color: '#7C3AED',
    metrics: [
      {
        name: 'Billable Utilisation Rate',
        unit: '%',
        p25: 68,
        median: 76,
        p75: 84,
        topDecile: 91,
        source: 'SPI Research',
        trend: 'up',
        clientValue: 87,
      },
      {
        name: 'Revenue per Consultant',
        unit: '£K/year',
        p25: 180,
        median: 260,
        p75: 380,
        topDecile: 580,
        source: 'MCA UK 2025',
        trend: 'up',
      },
      {
        name: 'Staff Attrition Rate (annual)',
        unit: '%',
        p25: 22,
        median: 16,
        p75: 11,
        topDecile: 6,
        source: 'CIPD Consulting Sector',
        trend: 'down',
        notes: 'Lower is better',
      },
      {
        name: 'Training Investment',
        unit: '£K/consultant/yr',
        p25: 1.2,
        median: 2.4,
        p75: 4.1,
        topDecile: 8.5,
        source: 'L&D Benchmark Survey',
        trend: 'up',
      },
    ],
  },
];

const MATURITY_SCORES = [
  { dimension: 'Client Relationships', score: 88 },
  { dimension: 'Delivery Quality', score: 92 },
  { dimension: 'Knowledge Mgmt', score: 74 },
  { dimension: 'Talent & Utilisation', score: 85 },
  { dimension: 'Commercial Performance', score: 78 },
  { dimension: 'Innovation & IP', score: 70 },
];

const TREND_ICONS = { up: ArrowUp, down: ArrowDown, flat: Minus };

function MetricRow({
  m,
  onAdd,
  added,
}: {
  m: Benchmark;
  onAdd: (name: string) => void;
  added: boolean;
}) {
  const [open, setOpen] = useState(false);
  const TrendIcon = TREND_ICONS[m.trend];

  const getPosition = () => {
    if (!m.clientValue || typeof m.clientValue !== 'number' || typeof m.median !== 'number')
      return null;
    if (m.clientValue >= (m.topDecile as number)) return { label: 'Top Decile', color: '#059669' };
    if (m.clientValue >= (m.p75 as number)) return { label: 'Top Quartile', color: '#0284C7' };
    if (m.clientValue >= (m.median as number)) return { label: 'Above Median', color: '#D97706' };
    return { label: 'Below Median', color: '#DC2626' };
  };

  const position = getPosition();

  return (
    <div style={{ borderBottom: '1px solid #F0EBE0' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
          gap: 12,
          padding: '14px 0',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setOpen(!open)}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A14' }}>{m.name}</div>
          <div style={{ fontSize: 11, color: '#A89878' }}>{m.unit}</div>
        </div>
        <div style={{ fontSize: 13, color: '#6B5E47', textAlign: 'center' }}>
          {m.p25}
          {typeof m.p25 === 'number' ? '' : ''}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A14', textAlign: 'center' }}>
          {m.median}
        </div>
        <div style={{ fontSize: 13, color: '#6B5E47', textAlign: 'center' }}>{m.p75}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {m.clientValue ? (
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: position?.color,
                fontFamily: "'Cormorant Garamond', serif",
              }}
            >
              {m.clientValue}{' '}
              {position && (
                <span
                  style={{
                    fontSize: 10,
                    padding: '1px 6px',
                    borderRadius: 100,
                    background: `${position.color}12`,
                  }}
                >
                  {position.label}
                </span>
              )}
            </span>
          ) : (
            <span style={{ fontSize: 11, color: '#A89878' }}>—</span>
          )}
          {open ? (
            <ChevronUp size={12} color="#A89878" />
          ) : (
            <ChevronDown size={12} color="#A89878" />
          )}
        </div>
      </div>
      {open && (
        <div style={{ paddingBottom: 12, paddingLeft: 0 }}>
          <div
            style={{
              background: '#FAFAF8',
              borderRadius: 8,
              padding: '12px 16px',
              fontSize: 12,
              color: '#6B5E47',
              lineHeight: 1.6,
            }}
          >
            <div style={{ marginBottom: 4 }}>
              <strong>Source:</strong> {m.source}
            </div>
            {m.notes && (
              <div style={{ marginBottom: 4 }}>
                <strong>Note:</strong> {m.notes}
              </div>
            )}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <strong>Industry trend:</strong>
                <TrendIcon
                  size={12}
                  color={m.trend === 'up' ? '#059669' : m.trend === 'down' ? '#DC2626' : '#A89878'}
                />
                <span
                  style={{
                    color:
                      m.trend === 'up' ? '#059669' : m.trend === 'down' ? '#DC2626' : '#A89878',
                  }}
                >
                  {m.trend === 'up' ? 'Improving' : m.trend === 'down' ? 'Declining' : 'Stable'}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd(m.name);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 12px',
                  borderRadius: 100,
                  border: `1px solid ${added ? '#059669' : GOLD}`,
                  background: added ? '#059669' : 'transparent',
                  color: added ? '#fff' : '#6B5E47',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: added ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
              >
                {added ? (
                  <>
                    <Check size={11} /> Added
                  </>
                ) : (
                  <>
                    <Plus size={11} /> Add to Deliverable
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BenchmarkDatabase() {
  usePageMeta({
    title: 'Benchmark Database | Carlota Jo',
    description:
      'Industry benchmarks for consulting performance metrics — auto-populated into client deliverables and comparison charts.',
    canonical: 'https://szlholdings.com/carlota-jo/benchmark-database',
  });

  const [activeCategory, setActiveCategory] = useState<string>('financial');
  const [addedBenchmarks, setAddedBenchmarks] = useState<Set<string>>(new Set());

  const handleAddToDeliverable = (name: string) => {
    setAddedBenchmarks((prev) => new Set([...prev, name]));
  };

  const activeData = CATEGORIES.find((c) => c.id === activeCategory)!;

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', paddingTop: 64 }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #0A1A0F 0%, #0F2B1A 50%, #060F08 100%)',
          padding: '48px 0 40px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(5,150,105,0.2)',
                  border: '1px solid rgba(5,150,105,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Database size={16} color="#34D399" />
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  color: '#34D399',
                  textTransform: 'uppercase',
                }}
              >
                Benchmark Database
              </span>
            </div>
            <h1
              style={{
                fontSize: 'clamp(28px, 4vw, 44px)',
                fontWeight: 300,
                color: '#F5F0E8',
                fontFamily: "'Cormorant Garamond', serif",
                lineHeight: 1.1,
                marginBottom: 12,
              }}
            >
              Every Number in Context.
              <br />
              <em style={{ color: '#34D399' }}>Industry Benchmarks on Demand.</em>
            </h1>
            <p
              style={{
                fontSize: 15,
                color: '#4A7A63',
                maxWidth: 520,
                lineHeight: 1.7,
                marginBottom: 32,
              }}
            >
              Reference-quality industry benchmarks for consulting, professional services, and
              sector-specific metrics — auto-populated into client deliverables with one click.
            </p>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {[
                {
                  label: 'Benchmark Metrics',
                  value: CATEGORIES.reduce((s, c) => s + c.metrics.length, 0).toString(),
                },
                { label: 'Categories', value: CATEGORIES.length.toString() },
                { label: 'Updated', value: 'Q1 2026' },
                { label: 'Sources', value: '14 verified' },
              ].map((kpi) => (
                <div key={kpi.label}>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 600,
                      color: '#F5F0E8',
                      fontFamily: "'Cormorant Garamond', serif",
                    }}
                  >
                    {kpi.value}
                  </div>
                  <div style={{ fontSize: 11, color: '#4A7A63' }}>{kpi.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Maturity Radar */}
        <div
          style={{
            padding: '32px 0 0',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              background: '#fff',
              border: '1px solid #E8E2D6',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Sparkles size={16} color={GOLD} />
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1A1A14' }}>
                Carlota Jo vs Industry — Performance Radar
              </h2>
            </div>
            <p style={{ fontSize: 12, color: '#A89878', marginBottom: 16 }}>
              Percentile score across 6 consulting performance dimensions
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={MATURITY_SCORES}>
                <PolarGrid stroke="#E8E2D6" />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: '#A89878' }} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke={GOLD}
                  fill={GOLD}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              background: '#fff',
              border: '1px solid #E8E2D6',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <BarChart3 size={16} color={GOLD} />
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1A1A14' }}>
                Key Wins vs Industry
              </h2>
            </div>
            {[
              {
                metric: 'Proposal Win Rate',
                ourValue: '94%',
                benchmark: '38% median',
                color: '#059669',
                verdict: 'Top Decile',
              },
              {
                metric: 'Client NPS',
                ourValue: '76',
                benchmark: '42 median',
                color: '#059669',
                verdict: 'Top Decile',
              },
              {
                metric: 'CSAT Score',
                ourValue: '8.7/10',
                benchmark: '7.8 median',
                color: '#0284C7',
                verdict: 'Top Quartile',
              },
              {
                metric: 'Billable Utilisation',
                ourValue: '87%',
                benchmark: '76% median',
                color: '#0284C7',
                verdict: 'Top Quartile',
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: i < 3 ? '1px solid #F0EBE0' : 'none',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A14' }}>
                    {item.metric}
                  </div>
                  <div style={{ fontSize: 11, color: '#A89878' }}>Industry: {item.benchmark}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: item.color,
                      fontFamily: "'Cormorant Garamond', serif",
                    }}
                  >
                    {item.ourValue}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      padding: '1px 6px',
                      borderRadius: 100,
                      background: `${item.color}12`,
                      color: item.color,
                      fontWeight: 600,
                    }}
                  >
                    {item.verdict}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 18px',
                  borderRadius: 100,
                  border: `1px solid ${activeCategory === cat.id ? cat.color : '#E8E2D6'}`,
                  background: activeCategory === cat.id ? `${cat.color}12` : 'transparent',
                  color: activeCategory === cat.id ? cat.color : '#A89878',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontWeight: activeCategory === cat.id ? 600 : 400,
                }}
              >
                <CatIcon size={13} /> {cat.name}
              </button>
            );
          })}
        </div>

        {/* Benchmark Table */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #E8E2D6',
            borderRadius: 20,
            padding: 24,
            marginBottom: 64,
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A14' }}>{activeData.name}</div>
            <div style={{ fontSize: 12, color: '#A89878' }}>{activeData.description}</div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
              gap: 12,
              padding: '10px 0',
              borderBottom: '2px solid #E8E2D6',
              marginBottom: 4,
            }}
          >
            {['Metric', 'P25', 'Median', 'P75', 'Our Value'].map((h) => (
              <div
                key={h}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#A89878',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  textAlign: h !== 'Metric' ? 'center' : 'left',
                }}
              >
                {h}
              </div>
            ))}
          </div>
          {activeData.metrics.map((m, i) => (
            <MetricRow
              key={i}
              m={m}
              onAdd={handleAddToDeliverable}
              added={addedBenchmarks.has(m.name)}
            />
          ))}
          {addedBenchmarks.size > 0 ? (
            <div
              style={{
                marginTop: 16,
                padding: '12px 16px',
                background: '#F0FDF4',
                borderRadius: 8,
                border: '1px solid #86EFAC',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <FileText size={12} color="#16A34A" />
                <span>
                  <strong>
                    {addedBenchmarks.size} benchmark{addedBenchmarks.size > 1 ? 's' : ''} added to
                    deliverable:
                  </strong>{' '}
                  {Array.from(addedBenchmarks).join(', ')}.
                </span>
              </div>
            </div>
          ) : (
            <div
              style={{
                marginTop: 16,
                padding: '12px 16px',
                background: '#FFFBF0',
                borderRadius: 8,
                border: `1px solid ${GOLD}20`,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: '#6B5E47',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Sparkles size={12} color={GOLD} />
                <span>
                  Expand any metric row and click "Add to Deliverable" to auto-populate a comparison
                  chart into your current engagement template.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
