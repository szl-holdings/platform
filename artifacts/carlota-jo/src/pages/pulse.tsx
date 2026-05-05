import {
  ParticleField,
  PulseEventFeed,
  PulseFlowDiagram,
  PulseHeader,
  PulseHealthGrid,
  PulseMetricCard,
  PulseTechStack,
  PulseThroughputChart,
} from '@szl-holdings/shared-ui/pulse';
import { PulseBriefingPanel } from '@szl-holdings/shared-ui/pulse-briefing-panel';
import { motion as m } from 'framer-motion';
import {
  Activity,
  Award,
  BarChart3,
  Calendar,
  Heart,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { CARLOTA_JO_RETENTION, metricDisplay } from '@/lib/claims';

function CarlotaIntelBrief() {
  const [data, setData] = useState<{
    metrics: { npsScore: number; retentionRate: number };
    anomalySummary: { anomalyLabel: string; topSignal: string };
    strategicAlert: { competitor: string; probability: number; predictedAction: string };
    caseStudy: { label: string; a11oyDeepLink: string };
  } | null>(null);

  useEffect(() => {
    const API = (import.meta.env.BASE_URL as string)?.replace(/\/$/, '') + '/api';
    fetch(`${API}/carlota/executive-brief`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => { if (json?.data) setData(json.data); })
      .catch(() => {});
  }, []);

  if (!data) return null;

  const alertColor = data.anomalySummary.anomalyLabel === 'elevated'
    ? '#ef4444' : data.anomalySummary.anomalyLabel === 'moderate'
    ? '#f59e0b' : '#10b981';

  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-lg p-4 mb-5"
      style={{ background: 'rgba(196,162,101,0.04)', border: '1px solid rgba(196,162,101,0.12)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-3.5 h-3.5" style={{ color: '#c4a265' }} />
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Advisory Intel Brief
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(196,162,101,0.12)', color: '#c4a265' }}>
          Live · Carlota Jo
        </span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-md p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[10px] mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>NPS</p>
          <p className="text-xl font-semibold" style={{ color: '#10b981' }}>{data.metrics.npsScore}</p>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Best in class</p>
        </div>
        <div className="rounded-md p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[10px] mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Retention</p>
          <p className="text-xl font-semibold" style={{ color: '#c4a265' }}>{Math.round(data.metrics.retentionRate * 100)}%</p>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Platform avg</p>
        </div>
        <div className="rounded-md p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[10px] mb-1 flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Anomaly
            <span className="px-1 rounded-sm text-[9px]" style={{ background: alertColor + '20', color: alertColor }}>{data.anomalySummary.anomalyLabel}</span>
          </p>
          <p className="text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,0.65)' }}>{data.anomalySummary.topSignal.slice(0, 60)}…</p>
        </div>
        <div className="rounded-md p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[10px] mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Strategic ({Math.round(data.strategicAlert.probability * 100)}%)
          </p>
          <p className="text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,0.65)' }}>{data.strategicAlert.competitor.split(' ')[0]}: {data.strategicAlert.predictedAction.slice(0, 45)}…</p>
        </div>
      </div>
      <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <a href={data.caseStudy.a11oyDeepLink} className="text-[10px] flex items-center gap-1 hover:opacity-80 transition-opacity" style={{ color: '#c4a265' }}>
          <Activity className="w-3 h-3" />
          Named Case Study: {data.caseStudy.label}
        </a>
      </div>
    </m.div>
  );
}

const AGENTS = [
  { name: 'Compass CJ', domain: 'strategy' },
  { name: 'Brand Analyst', domain: 'branding' },
  { name: 'Client Intel', domain: 'clients' },
  { name: 'Engagement Bot', domain: 'engagement' },
  { name: 'ROI Tracker', domain: 'analytics' },
];

const EVENT_TYPES = [
  {
    type: 'client_engagement',
    messages: [
      'UHNW client session completed: 4.9/5 rating',
      'Quarterly review prepared for 3 accounts',
      'Brand audit report delivered',
    ],
  },
  {
    type: 'brand_insight',
    messages: [
      'Competitor positioning shift detected',
      'Social sentiment: +12% positive',
      'Thought leadership opportunity flagged',
    ],
  },
  {
    type: 'pipeline_update',
    messages: [
      'New referral from existing client',
      'Proposal sent: $85K engagement',
      'Contract renewal: 18-month extension',
    ],
  },
  {
    type: 'roi_analysis',
    messages: [
      'Client ROI: 340% on brand strategy',
      'Revenue attribution: $2.1M influenced',
      'NPS score: 92 — exceptional',
    ],
  },
  {
    type: 'strategy_note',
    messages: [
      'Market positioning brief finalized',
      'Competitive landscape updated',
      'Advisory framework v3 published',
    ],
  },
];

function ClientSatisfaction() {
  const metrics = [
    { label: 'NPS Score', value: 92, max: 100, color: '#c4a265' },
    { label: 'Client Retention', value: 98, max: 100, color: '#10b981' },
    { label: 'Referral Rate', value: 67, max: 100, color: '#8b5cf6' },
    { label: 'Avg Rating', value: 49, max: 50, color: '#f59e0b' },
  ];
  return (
    <div className="space-y-3">
      {metrics.map((metric) => (
        <div key={metric.label}>
          <div className="flex justify-between mb-1">
            <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {metric.label}
            </span>
            <span className="text-[10px] font-bold tabular-nums" style={{ color: metric.color }}>
              {metric.label === 'Avg Rating' ? '4.9/5' : `${metric.value}%`}
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <m.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(metric.value / metric.max) * 100}%` }}
              transition={{ duration: 1.5, delay: 0.3 }}
              style={{ background: `linear-gradient(90deg, ${metric.color}60, ${metric.color})` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CarlotaJoPulse() {
  const [engagements, setEngagements] = useState(24);
  useEffect(() => {
    const t = setInterval(() => setEngagements((p) => p + (Math.random() > 0.7 ? 1 : 0)), 8000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="min-h-screen relative" style={{ background: '#070a10' }}>
      <ParticleField accentColor="#c4a265" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <PulseHeader
          title="Advisory Pulse"
          subtitle={`Client intelligence — ${engagements} active engagements · 5 advisory agents`}
          accentColor="#c4a265"
        />
        <div style={{ marginBottom: 20 }}>
          <PulseBriefingPanel domain="financial" />
        </div>
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg overflow-hidden mb-5 p-3"
          style={{
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5" style={{ color: '#c4a265' }} />
              <span
                className="text-[10px] font-medium uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                Engagement Activity
              </span>
            </div>
            <span className="text-[10px] tabular-nums font-medium" style={{ color: '#c4a265' }}>
              {engagements} active
            </span>
          </div>
          <PulseThroughputChart color="#c4a265" />
        </m.div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <PulseMetricCard
            label="Clients"
            value={engagements}
            icon={Users}
            color="#c4a265"
            trend="3 new this month"
            delay={0}
          />
          <PulseMetricCard
            label="Revenue"
            value={2}
            suffix=".1M"
            icon={TrendingUp}
            color="#10b981"
            trend="+18% YoY"
            delay={80}
          />
          <PulseMetricCard
            label="NPS Score"
            value={92}
            icon={Heart}
            color="#ec4899"
            trend="Best in class"
            delay={160}
          />
          <PulseMetricCard
            label="Sessions"
            value={187}
            icon={Calendar}
            color="#3b82f6"
            trend="42 this month"
            delay={240}
          />
          <PulseMetricCard
            label="Referrals"
            value={14}
            icon={Star}
            color="#f59e0b"
            trend="67% referral rate"
            delay={320}
          />
          <PulseMetricCard
            label="Deliverables"
            value={89}
            icon={Award}
            color="#8b5cf6"
            trend="All on schedule"
            delay={400}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-lg p-4"
            style={{
              background: 'rgba(255,255,255,0.015)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <h2
              className="text-[13px] font-semibold mb-3 flex items-center gap-2"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              <Heart className="w-4 h-4" style={{ color: '#c4a265' }} /> Client Satisfaction
            </h2>
            <ClientSatisfaction />
          </m.div>
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 rounded-lg p-4"
            style={{
              background: 'rgba(255,255,255,0.015)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <h2
              className="text-[13px] font-semibold mb-3 flex items-center gap-2"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              <Sparkles className="w-4 h-4" style={{ color: '#c4a265' }} /> Advisory Intelligence
            </h2>
            <PulseEventFeed agents={AGENTS} eventTypes={EVENT_TYPES} />
          </m.div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-lg p-4"
            style={{
              background: 'rgba(255,255,255,0.015)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <h2
              className="text-[13px] font-semibold mb-3 flex items-center gap-2"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              <Target className="w-4 h-4" style={{ color: '#c4a265' }} /> Client Journey Flow
            </h2>
            <PulseFlowDiagram
              flows={[
                {
                  from: 'Referral',
                  to: 'Intake',
                  type: 'Client Onboarding',
                  color: '#c4a265',
                  intensity: 4,
                },
                {
                  from: 'Brand',
                  to: 'Strategy',
                  type: 'Audit → Plan',
                  color: '#8b5cf6',
                  intensity: 3,
                },
                {
                  from: 'Execute',
                  to: 'Measure',
                  type: 'Deliverable → ROI',
                  color: '#10b981',
                  intensity: 5,
                },
                {
                  from: 'Review',
                  to: 'Renew',
                  type: 'QBR → Retention',
                  color: '#3b82f6',
                  intensity: 4,
                },
                {
                  from: 'Client',
                  to: 'Referral',
                  type: 'Advocacy Loop',
                  color: '#f59e0b',
                  intensity: 3,
                },
              ]}
            />
          </m.div>
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="rounded-lg p-4"
            style={{
              background: 'rgba(255,255,255,0.015)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <h2
              className="text-[13px] font-semibold mb-3 flex items-center gap-2"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              <Activity className="w-4 h-4" style={{ color: '#10b981' }} /> Service Health
            </h2>
            <PulseHealthGrid
              items={[
                { name: 'Brand Strategy', load: 72, color: '#c4a265' },
                { name: 'Digital Advisory', load: 58, color: '#3b82f6' },
                { name: 'Client Portal', load: 25, color: '#10b981' },
                { name: 'AI Advisory', load: 44, color: '#8b5cf6' },
                { name: 'Doc Engine', load: 33, color: '#f59e0b' },
                { name: 'ROI Tracking', load: 51, color: '#ec4899' },
                { name: 'Engagement Ops', load: 67, color: '#06b6d4' },
                { name: 'Brand Audit', load: 38, color: '#d4a054' },
              ]}
            />
          </m.div>
        </div>
        <div className="mt-5">
          <PulseTechStack
            items={[
              { label: 'Clients', value: '24', color: '#c4a265' },
              { label: 'Engagements', value: 'Active', color: '#10b981' },
              { label: 'NPS', value: '92', color: '#ec4899' },
              { label: 'Revenue', value: '$2.1M', color: '#d4a054' },
              { label: 'Retention', value: metricDisplay(CARLOTA_JO_RETENTION), color: '#3b82f6' },
              { label: 'Referral', value: '67%', color: '#f59e0b' },
              { label: 'CSAT', value: '4.9', color: '#8b5cf6' },
              { label: 'Deliverables', value: 'On Time', color: '#64748b' },
            ]}
            title="Advisory Operations"
          />
        </div>
        {/* Carlota Executive Intel Brief */}
        <CarlotaIntelBrief />
        <div className="text-center py-4 mt-4">
          <p
            className="text-[9px] uppercase tracking-[0.25em]"
            style={{ color: 'rgba(255,255,255,0.08)' }}
          >
            Carlota Jo Consulting — Advisory Pulse
          </p>
        </div>
      </div>
    </div>
  );
}
