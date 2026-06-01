import { AmbientBar, type AmbientSignal } from '@szl-holdings/shared-ui/ambient-intelligence';
import {
  CorrelationFeed,
  type CrossDomainCorrelation,
} from '@szl-holdings/shared-ui/cross-domain-correlation';
import { type EnergyMetrics, EnergyPulse } from '@szl-holdings/shared-ui/energy-heartbeat';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useMemo, useState } from 'react';

interface ProactiveCard {
  id: string;
  clientName: string;
  prediction: string;
  confidence: number;
  category: 'seasonal' | 'life_event' | 'property' | 'preference' | 'maintenance';
  triggerType: string;
  suggestedAction: string;
  anticipatedDate: string;
  historicalAccuracy: number;
  status: 'pending' | 'sent' | 'confirmed' | 'declined';
}

const DEMO_CARDS: ProactiveCard[] = [
  {
    id: 'pc-001',
    clientName: 'Harrison Family',
    prediction: 'Annual deep cleaning needed — last service was 11 months ago',
    confidence: 0.94,
    category: 'seasonal',
    triggerType: 'Annual cycle',
    suggestedAction: 'Schedule spring deep cleaning package + carpet treatment',
    anticipatedDate: 'Apr 22, 2026',
    historicalAccuracy: 0.91,
    status: 'pending',
  },
  {
    id: 'pc-002',
    clientName: 'Chen Residence',
    prediction: 'Upcoming anniversary dinner — booked catering last 3 years',
    confidence: 0.87,
    category: 'life_event',
    triggerType: 'Calendar pattern',
    suggestedAction: 'Pre-book preferred caterer (Lumière) and florist arrangement',
    anticipatedDate: 'May 3, 2026',
    historicalAccuracy: 0.89,
    status: 'sent',
  },
  {
    id: 'pc-003',
    clientName: 'Blackwell Estate',
    prediction: 'Pool opening needed — water temp reaching seasonal threshold',
    confidence: 0.96,
    category: 'property',
    triggerType: 'Weather + seasonal',
    suggestedAction: 'Schedule pool opening, chemical treatment, and equipment inspection',
    anticipatedDate: 'Apr 28, 2026',
    historicalAccuracy: 0.95,
    status: 'confirmed',
  },
  {
    id: 'pc-004',
    clientName: 'Park Penthouse',
    prediction: 'Wine collection temperature control service due',
    confidence: 0.78,
    category: 'maintenance',
    triggerType: 'Equipment cycle (6mo)',
    suggestedAction: 'Schedule wine cellar HVAC calibration and inventory audit',
    anticipatedDate: 'May 10, 2026',
    historicalAccuracy: 0.82,
    status: 'pending',
  },
  {
    id: 'pc-005',
    clientName: 'Rodriguez Villa',
    prediction: 'Summer travel prep — historically books home security upgrade pre-vacation',
    confidence: 0.72,
    category: 'preference',
    triggerType: 'Travel pattern',
    suggestedAction: 'Offer comprehensive pre-travel home security and plant care package',
    anticipatedDate: 'Jun 1, 2026',
    historicalAccuracy: 0.76,
    status: 'pending',
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  seasonal: '#10b981',
  life_event: '#ec4899',
  property: '#3b82f6',
  preference: '#f59e0b',
  maintenance: '#8b5cf6',
};
const CATEGORY_LABELS: Record<string, string> = {
  seasonal: 'Seasonal',
  life_event: 'Life Event',
  property: 'Property',
  preference: 'Preference',
  maintenance: 'Maintenance',
};
const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  sent: '#3b82f6',
  confirmed: '#10b981',
  declined: '#ef4444',
};

export default function InvisibleServiceDesign() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const _selected = DEMO_CARDS.find((c) => c.id === selectedId);

  const ambientSignals: AmbientSignal[] = [
    {
      id: 'sig-1',
      domain: 'carlota-jo',
      title: 'Service Anticipation',
      summary: '4 proactive service recommendations generated for VIP clients this week',
      severity: 'info',
      score: 0.44,
      timestamp: Date.now(),
    },
  ];
  const energyMetrics: EnergyMetrics = {
    apiCallsPerMinute: 28,
    wsMessagesPerMinute: 55,
    chartRendersPerMinute: 4,
    dataRefreshesPerMinute: 3,
    activeSubscriptions: 8,
    deferredUpdates: 0,
    totalBudget: 120,
    usedBudget: 22,
  };
  const correlations: CrossDomainCorrelation[] = [
    {
      id: 'cor-4',
      title: 'Client Engagement → Thought Leadership',
      description: 'Workshop engagement depth correlates with thought leadership reach',
      domains: ['carlota-jo', 'stephen'],
      confidence: 0.82,
      timestamp: Date.now(),
      signals: [
        { domain: 'carlota-jo', event: 'Workshop NPS at 92', severity: 'info' },
        { domain: 'stephen', event: 'Resonance score +34%', severity: 'info' },
      ],
      impact: 'medium',
    },
  ];

  const stats = useMemo(
    () => ({
      total: DEMO_CARDS.length,
      confirmed: DEMO_CARDS.filter((c) => c.status === 'confirmed').length,
      avgAccuracy: Math.round(
        (DEMO_CARDS.reduce((s, c) => s + c.historicalAccuracy, 0) / DEMO_CARDS.length) * 100,
      ),
      avgConfidence: Math.round(
        (DEMO_CARDS.reduce((s, c) => s + c.confidence, 0) / DEMO_CARDS.length) * 100,
      ),
    }),
    [],
  );

  return (
    <div className="min-h-screen bg-[#060810] text-white p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white/90">Invisible Service Design</h1>
        <p className="text-sm text-white/40 mt-1">
          Predictive client needs — anticipate requests before clients reach out
        </p>
      </div>
      <AmbientBar signals={ambientSignals} appDomain="carlota-jo" accentColor="#ec4899" compact />

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Active Predictions', value: stats.total.toString(), color: '#ec4899' },
          { label: 'Confirmed Services', value: stats.confirmed.toString(), color: '#10b981' },
          { label: 'Anticipation Accuracy', value: `${stats.avgAccuracy}%`, color: '#8b5cf6' },
          { label: 'Avg Confidence', value: `${stats.avgConfidence}%`, color: '#3b82f6' },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
            <div className="text-[10px] uppercase tracking-wider text-white/30">{kpi.label}</div>
            <div className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {DEMO_CARDS.map((card) => (
          <div
            key={card.id}
            className={cn(
              'rounded-xl border p-4 cursor-pointer transition-all',
              selectedId === card.id
                ? 'bg-white/[0.06] border-white/15'
                : 'bg-white/[0.02] border-white/5 hover:border-white/10',
            )}
            onClick={() => setSelectedId(selectedId === card.id ? null : card.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div
                  className="w-2 h-2 rounded-full mt-1.5"
                  style={{ background: CATEGORY_COLORS[card.category] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white/85">{card.clientName}</span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{
                        background: `${CATEGORY_COLORS[card.category]}20`,
                        color: CATEGORY_COLORS[card.category],
                      }}
                    >
                      {CATEGORY_LABELS[card.category]}
                    </span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{
                        background: `${STATUS_COLORS[card.status]}20`,
                        color: STATUS_COLORS[card.status],
                      }}
                    >
                      {card.status}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 mt-1">{card.prediction}</p>
                  <p className="text-[11px] text-white/30 mt-0.5">
                    Expected: {card.anticipatedDate} • Trigger: {card.triggerType}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-4">
                <div
                  className="text-sm font-mono font-medium"
                  style={{
                    color:
                      card.confidence >= 0.85
                        ? '#10b981'
                        : card.confidence >= 0.7
                          ? '#f59e0b'
                          : '#ef4444',
                  }}
                >
                  {Math.round(card.confidence * 100)}%
                </div>
                <div className="text-[9px] text-white/30">confidence</div>
              </div>
            </div>

            {selectedId === card.id && (
              <div className="mt-4 pt-3 border-t border-white/5 space-y-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-[10px] text-white/30 uppercase mb-1">Suggested Action</div>
                  <p className="text-xs text-white/70">{card.suggestedAction}</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-white/40">
                    Historical accuracy:{' '}
                    <span className="text-white/60 font-mono">
                      {Math.round(card.historicalAccuracy * 100)}%
                    </span>
                  </span>
                </div>
                <div className="flex gap-2">
                  <button className="text-[11px] px-3 py-1.5 rounded bg-pink-500/20 text-pink-400 hover:bg-pink-500/30">
                    Send to Client
                  </button>
                  <button className="text-[11px] px-3 py-1.5 rounded bg-white/10 text-white/50 hover:bg-white/15">
                    Schedule Service
                  </button>
                  <button className="text-[11px] px-3 py-1.5 rounded bg-white/5 text-white/30 hover:bg-white/10">
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/5">
        <div className="md:col-span-2">
          <CorrelationFeed
            correlations={correlations}
            currentDomain="carlota-jo"
            accentColor="#ec4899"
          />
        </div>
        <div className="flex items-start justify-center">
          <EnergyPulse
            metrics={energyMetrics}
            utilization={energyMetrics.usedBudget / energyMetrics.totalBudget}
            accentColor="#ec4899"
          />
        </div>
      </div>
    </div>
  );
}
