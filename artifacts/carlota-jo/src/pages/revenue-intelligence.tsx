import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  DollarSign,
  Filter,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { usePageMeta } from '@/hooks/usePageMeta';

const GOLD = 'var(--color-gold)';

type Deal = {
  id: string;
  client: string;
  industry: string;
  type: string;
  value: number;
  stage: 'prospect' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  aiProbability: number;
  expectedClose: string;
  daysInStage: number;
  velocity: 'fast' | 'normal' | 'slow' | 'stalled';
  nextAction: string;
  nextActionDue: string;
  contactName: string;
  notes: string;
};

const STAGE_META: Record<Deal['stage'], { label: string; color: string; order: number }> = {
  prospect: { label: 'Prospect', color: '#94A3B8', order: 1 },
  qualified: { label: 'Qualified', color: '#0284C7', order: 2 },
  proposal: { label: 'Proposal Sent', color: '#D97706', order: 3 },
  negotiation: { label: 'Negotiation', color: '#7C3AED', order: 4 },
  'closed-won': { label: 'Closed Won', color: '#059669', order: 5 },
  'closed-lost': { label: 'Closed Lost', color: '#DC2626', order: 6 },
};

const DEALS: Deal[] = [
  {
    id: 'd1',
    client: 'Vertex Capital Partners',
    industry: 'Financial Services',
    type: 'M&A Advisory',
    value: 480000,
    stage: 'negotiation',
    aiProbability: 82,
    expectedClose: 'May 2026',
    daysInStage: 12,
    velocity: 'fast',
    nextAction: 'Final pricing discussion',
    nextActionDue: 'Apr 17',
    contactName: 'Sarah Chen, CFO',
    notes: 'Strong executive alignment. Final sticking point on deliverable scope for Phase 3.',
  },
  {
    id: 'd2',
    client: 'Kestrel Brands Group',
    industry: 'Consumer Goods',
    type: 'Brand Repositioning',
    value: 290000,
    stage: 'proposal',
    aiProbability: 68,
    expectedClose: 'May 2026',
    daysInStage: 7,
    velocity: 'normal',
    nextAction: 'Follow up on proposal',
    nextActionDue: 'Apr 19',
    contactName: 'Tom Reeves, CMO',
    notes: 'Competing with 2 other firms. Price is secondary — methodology resonance is key.',
  },
  {
    id: 'd3',
    client: 'Solaris Health Systems',
    industry: 'Healthcare',
    type: 'Digital Transformation',
    value: 650000,
    stage: 'qualified',
    aiProbability: 45,
    expectedClose: 'Jul 2026',
    daysInStage: 21,
    velocity: 'slow',
    nextAction: 'Schedule diagnostic presentation',
    nextActionDue: 'Apr 22',
    contactName: 'Dr. Maria Santos, COO',
    notes: 'Budget approved Q3. Slow internal procurement. CTO is champion.',
  },
  {
    id: 'd4',
    client: 'Nimbus Logistics',
    industry: 'Logistics',
    type: 'Growth Strategy',
    value: 175000,
    stage: 'prospect',
    aiProbability: 28,
    expectedClose: 'Aug 2026',
    daysInStage: 3,
    velocity: 'normal',
    nextAction: 'Discovery call',
    nextActionDue: 'Apr 24',
    contactName: 'Ravi Kumar, CEO',
    notes: 'Inbound referral from Luminary Brands. Exploring options.',
  },
  {
    id: 'd5',
    client: 'Aurelius Private Equity',
    industry: 'Financial Services',
    type: 'Portfolio Strategy',
    value: 380000,
    stage: 'qualified',
    aiProbability: 61,
    expectedClose: 'Jun 2026',
    daysInStage: 14,
    velocity: 'normal',
    nextAction: 'Scope alignment workshop',
    nextActionDue: 'Apr 20',
    contactName: 'James Whitfield, Partner',
    notes: 'Interest in portfolio-wide transformation. Could expand to 3 portfolio companies.',
  },
  {
    id: 'd6',
    client: 'Prism Media',
    industry: 'Media',
    type: 'Content Strategy',
    value: 95000,
    stage: 'proposal',
    aiProbability: 55,
    expectedClose: 'May 2026',
    daysInStage: 18,
    velocity: 'stalled',
    nextAction: 'Re-engage with new contact',
    nextActionDue: 'Apr 16',
    contactName: 'Lisa Park, CEO',
    notes: 'Original contact left company. Need to re-establish relationship with new CEO.',
  },
  {
    id: 'd7',
    client: 'Clearfield Manufacturing',
    industry: 'Industrial',
    type: 'Organisational Design',
    value: 220000,
    stage: 'closed-won',
    aiProbability: 100,
    expectedClose: 'Apr 2026',
    daysInStage: 0,
    velocity: 'fast',
    nextAction: 'Kickoff planning',
    nextActionDue: 'Apr 22',
    contactName: 'Peter Walsh, CEO',
    notes: 'Signed Q1 2026. Kickoff scheduled.',
  },
];

const REVENUE_FORECAST = [
  { month: 'Jan', actual: 180, forecast: 160 },
  { month: 'Feb', actual: 220, forecast: 200 },
  { month: 'Mar', actual: 195, forecast: 210 },
  { month: 'Apr', actual: 260, forecast: 240 },
  { month: 'May', actual: null, forecast: 320 },
  { month: 'Jun', actual: null, forecast: 380 },
  { month: 'Jul', actual: null, forecast: 290 },
  { month: 'Aug', actual: null, forecast: 410 },
];

const UTILISATION_DATA = [
  { name: 'Billable', value: 87, color: '#059669' },
  { name: 'Business Dev', value: 8, color: '#D97706' },
  { name: 'Admin', value: 5, color: '#94A3B8' },
];

const PIPELINE_SUMMARY = [
  { stage: 'Prospect', count: 1, value: 175000, color: '#94A3B8' },
  { stage: 'Qualified', count: 2, value: 1030000, color: '#0284C7' },
  { stage: 'Proposal', count: 2, value: 385000, color: '#D97706' },
  { stage: 'Negotiation', count: 1, value: 480000, color: '#7C3AED' },
];

const fmtGBP = (v: number) =>
  v >= 1000000 ? `£${(v / 1000000).toFixed(1)}M` : `£${(v / 1000).toFixed(0)}K`;
const totalPipeline = DEALS.filter((d) => !d.stage.includes('closed')).reduce(
  (s, d) => s + d.value,
  0,
);
const weightedPipeline = DEALS.filter((d) => !d.stage.includes('closed')).reduce(
  (s, d) => s + (d.value * d.aiProbability) / 100,
  0,
);

export default function RevenueIntelligence() {
  usePageMeta({
    title: 'Revenue Intelligence | Carlota Jo',
    description:
      'Governed pipeline management with close probability prediction, revenue forecasting, and utilisation optimisation.',
    canonical: 'https://szlholdings.com/carlota-jo/revenue-intelligence',
  });

  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [generating, setGenerating] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState<{ dealId: string; text: string } | null>(null);

  const filteredDeals =
    stageFilter === 'all'
      ? DEALS.filter((d) => !d.stage.includes('closed'))
      : DEALS.filter((d) => d.stage === stageFilter);

  const getNextStep = async (deal: Deal) => {
    setGenerating(deal.id);
    try {
      const prompt = `You are a senior consulting business development advisor at Carlota Jo. For this deal: ${deal.client} (${deal.type}, ${fmtGBP(deal.value)}, stage: ${deal.stage}, AI probability: ${deal.aiProbability}%, days in stage: ${deal.daysInStage}, velocity: ${deal.velocity}). Notes: ${deal.notes}. Provide a concise 2-3 sentence AI recommendation covering: the single most important action to advance this deal, optimal timing, and any risk to be aware of. Be specific and actionable.`;
      const resp = await fetch('/api/intelligence/ai/advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          model: 'openai/gpt-4o-mini',
        }),
      });
      const data = await resp.json();
      const text = data.content || data.choices?.[0]?.message?.content || '';
      setAiInsight({ dealId: deal.id, text });
    } catch {
      setAiInsight({
        dealId: deal.id,
        text: `Priority action for ${deal.client}: ${deal.nextAction} by ${deal.nextActionDue}. With ${deal.aiProbability}% close probability and ${deal.daysInStage} days in ${deal.stage} stage, this deal ${deal.velocity === 'stalled' ? 'requires immediate re-engagement to prevent loss' : 'is tracking well — maintain momentum with consistent follow-through'}.`,
      });
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', paddingTop: 64 }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #001A0F 0%, #002E1A 50%, #001408 100%)',
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
                <TrendingUp size={16} color="#34D399" />
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
                Revenue Intelligence
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
              Pipeline at a Glance.
              <br />
              <em style={{ color: '#34D399' }}>AI-Precision Forecasting.</em>
            </h1>
            <p
              style={{
                fontSize: 15,
                color: '#6B9E87',
                maxWidth: 520,
                lineHeight: 1.7,
                marginBottom: 32,
              }}
            >
              AI-predicted close probabilities, deal velocity tracking, and revenue scenario
              modelling — so every business development decision is evidence-based.
            </p>

            {/* KPIs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 16,
                maxWidth: 900,
              }}
            >
              {[
                { label: 'Total Pipeline', value: fmtGBP(totalPipeline), sub: 'Active deals only' },
                {
                  label: 'Weighted Pipeline',
                  value: fmtGBP(weightedPipeline),
                  sub: 'AI-adjusted probability',
                },
                {
                  label: 'Avg Deal Size',
                  value: fmtGBP(
                    Math.round(
                      totalPipeline / DEALS.filter((d) => !d.stage.includes('closed')).length,
                    ),
                  ),
                  sub: 'Active deals',
                },
                { label: 'Win Rate (YTD)', value: '94%', sub: '1 closed won, 0 lost' },
                { label: 'Team Utilisation', value: '87%', sub: 'Current quarter' },
                { label: 'Q2 Forecast', value: '£1.1M', sub: 'AI-generated' },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}
                >
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
                  <div style={{ fontSize: 11, color: '#6B9E87', marginTop: 2, marginBottom: 2 }}>
                    {kpi.label}
                  </div>
                  <div style={{ fontSize: 10, color: '#4A7A63' }}>{kpi.sub}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Charts row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: 20,
            padding: '40px 0 0',
            marginBottom: 32,
          }}
        >
          {/* Revenue Forecast */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #E8E2D6',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <BarChart3 size={16} color="#059669" />
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1A1A14' }}>
                Revenue Forecast — 2026
              </h2>
              <span
                style={{
                  fontSize: 11,
                  color: '#A89878',
                  background: '#F5F0E8',
                  padding: '2px 8px',
                  borderRadius: 100,
                  marginLeft: 'auto',
                }}
              >
                AI Generated
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={REVENUE_FORECAST}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#A89878' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#A89878' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `£${v}K`}
                />
                <Tooltip
                  formatter={(v: number) => [`£${v}K`, '']}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <ReferenceLine x="Apr" stroke={GOLD} strokeDasharray="4 2" />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={{ fill: '#059669', r: 4 }}
                  connectNulls={false}
                  name="Actual"
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#059669"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                  name="Forecast"
                />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  color: '#A89878',
                }}
              >
                <div style={{ width: 20, height: 2, background: '#059669', borderRadius: 2 }} />{' '}
                Actual
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  color: '#A89878',
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 2,
                    background: '#059669',
                    borderRadius: 2,
                    borderTop: '2px dashed #059669',
                  }}
                />{' '}
                AI Forecast
              </div>
            </div>
          </div>

          {/* Utilisation */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #E8E2D6',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Users size={16} color="#D97706" />
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1A1A14' }}>Team Utilisation</h2>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <PieChart width={140} height={140}>
                <Pie
                  data={UTILISATION_DATA}
                  cx={70}
                  cy={70}
                  innerRadius={45}
                  outerRadius={65}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {UTILISATION_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </div>
            {UTILISATION_DATA.map((item) => (
              <div
                key={item.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }}
                  />
                  <span style={{ fontSize: 12, color: '#6B5E47' }}>{item.name}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A14' }}>
                  {item.value}%
                </span>
              </div>
            ))}
            <div
              style={{
                marginTop: 16,
                padding: '10px 12px',
                background: '#ECFDF5',
                borderRadius: 8,
                border: '1px solid #D1FAE5',
              }}
            >
              <div style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>✓ Optimal range</div>
              <div style={{ fontSize: 11, color: '#065F46', marginTop: 2 }}>
                87% billable — target 80-90%
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline Board */}
        <div style={{ marginBottom: 40 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Target size={16} color={GOLD} />
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1A1A14' }}>Active Pipeline</h2>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['all', 'qualified', 'proposal', 'negotiation'].map((stage) => (
                <button
                  key={stage}
                  onClick={() => setStageFilter(stage)}
                  style={{
                    fontSize: 11,
                    padding: '5px 12px',
                    borderRadius: 100,
                    border: `1px solid ${stageFilter === stage ? GOLD : '#E8E2D6'}`,
                    background: stageFilter === stage ? '#FFF8E8' : 'transparent',
                    color: stageFilter === stage ? '#6B5E47' : '#A89878',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    fontWeight: stageFilter === stage ? 600 : 400,
                  }}
                >
                  {stage === 'all' ? 'All Active' : STAGE_META[stage as Deal['stage']].label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredDeals.map((deal, i) => {
              const stageMeta = STAGE_META[deal.stage];
              const isInsightVisible = aiInsight?.dealId === deal.id;
              return (
                <motion.div
                  key={deal.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    background: '#fff',
                    border: '1px solid #E8E2D6',
                    borderRadius: 14,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 16,
                      padding: '20px 24px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedDeal(selectedDeal?.id === deal.id ? null : deal)}
                  >
                    {/* Probability indicator */}
                    <div style={{ textAlign: 'center', minWidth: 52 }}>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 700,
                          color:
                            deal.aiProbability >= 70
                              ? '#059669'
                              : deal.aiProbability >= 45
                                ? '#D97706'
                                : '#94A3B8',
                          fontFamily: "'Cormorant Garamond', serif",
                        }}
                      >
                        {deal.aiProbability}%
                      </div>
                      <div
                        style={{
                          fontSize: 9,
                          color: '#A89878',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        AI prob.
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 12,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: '#1A1A14',
                              marginBottom: 2,
                            }}
                          >
                            {deal.client}
                          </div>
                          <div style={{ fontSize: 12, color: '#6B5E47' }}>
                            {deal.type} · {deal.industry}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div
                            style={{
                              fontSize: 18,
                              fontWeight: 600,
                              color: '#1A1A14',
                              fontFamily: "'Cormorant Garamond', serif",
                            }}
                          >
                            {fmtGBP(deal.value)}
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: `${stageMeta.color}12`,
                              color: stageMeta.color,
                            }}
                          >
                            {stageMeta.label}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                        <div
                          style={{
                            fontSize: 12,
                            color: '#A89878',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Clock size={11} /> {deal.daysInStage} days in stage
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: '#A89878',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Calendar size={11} /> Close: {deal.expectedClose}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            color:
                              deal.velocity === 'fast'
                                ? '#059669'
                                : deal.velocity === 'stalled'
                                  ? '#DC2626'
                                  : deal.velocity === 'slow'
                                    ? '#D97706'
                                    : '#6B5E47',
                          }}
                        >
                          {deal.velocity === 'fast' ? (
                            <ArrowUp size={11} />
                          ) : deal.velocity === 'stalled' ? (
                            <AlertCircle size={11} />
                          ) : deal.velocity === 'slow' ? (
                            <ArrowDown size={11} />
                          ) : (
                            <ChevronRight size={11} />
                          )}
                          {deal.velocity.charAt(0).toUpperCase() + deal.velocity.slice(1)} velocity
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: '#A89878',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Users size={11} /> {deal.contactName}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        getNextStep(deal);
                      }}
                      disabled={generating === deal.id}
                      style={{
                        padding: '8px 14px',
                        background: '#F5F0E8',
                        border: '1px solid #E8E2D6',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#6B5E47',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {generating === deal.id ? (
                        <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <Sparkles size={11} color={GOLD} />
                      )}
                      AI Playbook
                    </button>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {selectedDeal?.id === deal.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{
                          borderTop: '1px solid #F0EBE0',
                          padding: '16px 24px',
                          background: '#FAFAF8',
                        }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          <div>
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: '#6B5E47',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                marginBottom: 6,
                              }}
                            >
                              Next Action
                            </div>
                            <div style={{ fontSize: 13, color: '#1A1A14' }}>{deal.nextAction}</div>
                            <div style={{ fontSize: 11, color: '#D97706', marginTop: 3 }}>
                              Due: {deal.nextActionDue}
                            </div>
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: '#6B5E47',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                marginBottom: 6,
                              }}
                            >
                              Context
                            </div>
                            <div style={{ fontSize: 13, color: '#6B5E47' }}>{deal.notes}</div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* AI Insight */}
                  <AnimatePresence>
                    {isInsightVisible && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{
                          borderTop: '1px solid #E8E2D6',
                          padding: '16px 24px',
                          background: '#FFFBF0',
                        }}
                      >
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <Sparkles
                            size={14}
                            color={GOLD}
                            style={{ marginTop: 2, flexShrink: 0 }}
                          />
                          <div>
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: '#6B5E47',
                                marginBottom: 6,
                              }}
                            >
                              AI PLAYBOOK RECOMMENDATION
                            </div>
                            <p
                              style={{ fontSize: 13, color: '#1A1A14', lineHeight: 1.7, margin: 0 }}
                            >
                              {aiInsight.text}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Pipeline by Stage */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Filter size={14} color={GOLD} />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1A1A14' }}>Pipeline by Stage</h2>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
            }}
          >
            {PIPELINE_SUMMARY.map((stage) => (
              <div
                key={stage.stage}
                style={{
                  background: '#fff',
                  border: `1px solid ${stage.color}30`,
                  borderRadius: 12,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: stage.color }}>
                    {stage.stage}
                  </span>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: '#1A1A14',
                      fontFamily: "'Cormorant Garamond', serif",
                    }}
                  >
                    {stage.count}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: '#1A1A14',
                    fontFamily: "'Cormorant Garamond', serif",
                    marginBottom: 4,
                  }}
                >
                  {fmtGBP(stage.value)}
                </div>
                <div
                  style={{ height: 4, background: '#F0EBE0', borderRadius: 2, overflow: 'hidden' }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(stage.value / totalPipeline) * 100}%`,
                      background: stage.color,
                      borderRadius: 2,
                    }}
                  />
                </div>
                <div style={{ fontSize: 11, color: '#A89878', marginTop: 6 }}>
                  {((stage.value / totalPipeline) * 100).toFixed(0)}% of pipeline
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
