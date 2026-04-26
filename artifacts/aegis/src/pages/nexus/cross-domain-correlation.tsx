import {
  Network,
  Zap,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

const ACCENT = '#c9b787';
const RED = '#f5f5f5';
const GREEN = '#c9b787';
const BLUE = '#c9b787';
const PURPLE = '#8a8a8a';

const DS = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.06)',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    muted: 'rgba(255,255,255,0.25)',
  },
};

interface DomainSignal {
  id: string;
  domain: 'maritime' | 'cyber' | 'legal' | 'financial' | 'real-estate' | 'infrastructure';
  source: string;
  timestamp: string;
  signal: string;
  severity: 'critical' | 'high' | 'medium';
  confidence: number;
}

interface Correlation {
  id: string;
  title: string;
  signals: string[];
  domains: string[];
  confidence: number;
  severity: 'critical' | 'high' | 'medium';
  description: string;
  recommendation: string;
  status: 'new' | 'investigating' | 'confirmed' | 'dismissed';
  detectedAt: string;
}

const SIGNALS: DomainSignal[] = [
  {
    id: 'SIG-001',
    domain: 'maritime',
    source: 'Vessels AIS Feed',
    timestamp: '2024-03-15T14:22:00Z',
    signal: '3 LNG carriers diverted from Red Sea corridor — unusual rerouting pattern',
    severity: 'high',
    confidence: 87,
  },
  {
    id: 'SIG-002',
    domain: 'cyber',
    source: 'PARAGON Threat Intel',
    timestamp: '2024-03-15T14:18:00Z',
    signal: 'APT-41 infrastructure detected targeting shipping logistics companies',
    severity: 'critical',
    confidence: 92,
  },
  {
    id: 'SIG-003',
    domain: 'financial',
    source: 'Aegis',
    timestamp: '2024-03-15T14:05:00Z',
    signal: 'Marine insurance premiums spiking 340% for Red Sea transit',
    severity: 'high',
    confidence: 95,
  },
  {
    id: 'SIG-004',
    domain: 'legal',
    source: 'Counsel',
    timestamp: '2024-03-15T13:48:00Z',
    signal: 'Force majeure clause reviews triggered across 12 maritime contracts',
    severity: 'medium',
    confidence: 88,
  },
  {
    id: 'SIG-005',
    domain: 'real-estate',
    source: 'Terra Intel',
    timestamp: '2024-03-15T13:30:00Z',
    signal: 'Port-adjacent warehouse vacancy rates dropping in Rotterdam & Singapore',
    severity: 'medium',
    confidence: 76,
  },
  {
    id: 'SIG-006',
    domain: 'infrastructure',
    source: 'Lyte AIOps',
    timestamp: '2024-03-15T13:15:00Z',
    signal: 'CDN edge node latency spike in MENA region — possible infrastructure targeting',
    severity: 'high',
    confidence: 81,
  },
  {
    id: 'SIG-007',
    domain: 'maritime',
    source: 'Vessels Fleet',
    timestamp: '2024-03-15T12:55:00Z',
    signal: 'Dark vessel activity increase near Bab al-Mandab strait — 4 AIS gaps detected',
    severity: 'critical',
    confidence: 89,
  },
  {
    id: 'SIG-008',
    domain: 'cyber',
    source: 'PARAGON SIEM',
    timestamp: '2024-03-15T12:40:00Z',
    signal: 'Spear-phishing campaign targeting logistics operations teams — OceanLotus TTPs',
    severity: 'high',
    confidence: 84,
  },
];

const INITIAL_CORRELATIONS: Correlation[] = [
  {
    id: 'COR-001',
    title: 'Red Sea Supply Chain Disruption — Multi-Domain Convergence',
    signals: ['SIG-001', 'SIG-002', 'SIG-003', 'SIG-004', 'SIG-007'],
    domains: ['maritime', 'cyber', 'financial', 'legal'],
    confidence: 94,
    severity: 'critical',
    description:
      'Five independent signals across four domains converge on a coordinated disruption of Red Sea maritime corridors. Vessel rerouting correlates with APT-41 targeting of logistics companies, insurance premium spikes, and dark vessel activity near Bab al-Mandab.',
    recommendation:
      'Reroute 3 LNG carriers via Cape of Good Hope. Activate force majeure on affected contracts. Escalate cyber threat to SOC P1. Brief C-suite on 72h exposure window.',
    status: 'new',
    detectedAt: '2024-03-15T14:25:00Z',
  },
  {
    id: 'COR-002',
    title: 'MENA Infrastructure + Cyber Attack PRAXIS',
    signals: ['SIG-006', 'SIG-008', 'SIG-002'],
    domains: ['infrastructure', 'cyber'],
    confidence: 78,
    severity: 'high',
    description:
      'CDN latency anomalies in MENA region correlate temporally with spear-phishing campaigns targeting logistics ops teams, suggesting coordinated digital infrastructure degradation.',
    recommendation:
      'Activate DDoS mitigation for MENA edge nodes. Issue security advisory to all logistics operations personnel. Monitor for lateral movement indicators.',
    status: 'new',
    detectedAt: '2024-03-15T14:30:00Z',
  },
  {
    id: 'COR-003',
    title: 'Real Estate Arbitrage — Port Congestion Signal',
    signals: ['SIG-001', 'SIG-005'],
    domains: ['maritime', 'real-estate'],
    confidence: 71,
    severity: 'medium',
    description:
      'Vessel rerouting patterns predict increased demand at alternative ports (Rotterdam, Singapore). Warehouse vacancy rates already declining — early mover advantage window of 2-3 weeks.',
    recommendation:
      'Accelerate Rotterdam warehouse acquisition pipeline. Lock in Singapore logistics space before pricing adjusts. Flag for Terra portfolio committee review.',
    status: 'new',
    detectedAt: '2024-03-15T14:35:00Z',
  },
];

const domainColor = (d: string) =>
  d === 'maritime'
    ? BLUE
    : d === 'cyber'
      ? RED
      : d === 'legal'
        ? PURPLE
        : d === 'financial'
          ? ACCENT
          : d === 'real-estate'
            ? GREEN
            : '#8a8a8a';
const sevColor = (s: string) => (s === 'critical' ? RED : s === 'high' ? ACCENT : '#6b7280');

export default function CrossDomainCorrelationPage() {
  const [correlations, setCorrelations] = useState<Correlation[]>(() =>
    INITIAL_CORRELATIONS.map((c) => ({ ...c })),
  );
  const [selectedCorrelation, setSelectedCorrelation] = useState<string>(
    INITIAL_CORRELATIONS[0].id,
  );
  const [domainFilter, setDomainFilter] = useState<string>('all');

  const selected = useMemo(
    () => correlations.find((c) => c.id === selectedCorrelation) ?? correlations[0],
    [correlations, selectedCorrelation],
  );
  const matchedSignals = useMemo(
    () => SIGNALS.filter((s) => selected.signals.includes(s.id)),
    [selected],
  );

  const handleStatusChange = useCallback((id: string, status: Correlation['status']) => {
    setCorrelations((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  }, []);

  const filteredSignals =
    domainFilter === 'all' ? SIGNALS : SIGNALS.filter((s) => s.domain === domainFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white tracking-tight">
          Cross-Domain Correlation Engine
        </h1>
        <p className="text-[11px] mt-1" style={{ color: DS.text.muted }}>
          AI agents continuously correlate signals across maritime, cyber, legal, financial,
          real-estate, and infrastructure domains
        </p>
      </div>

      <div className="grid grid-cols-6 gap-3">
        {(
          ['maritime', 'cyber', 'financial', 'legal', 'real-estate', 'infrastructure'] as const
        ).map((d) => {
          const count = SIGNALS.filter((s) => s.domain === d).length;
          return (
            <button
              key={d}
              onClick={() => setDomainFilter(domainFilter === d ? 'all' : d)}
              aria-label={`Filter ${d} domain`}
              className="rounded-xl p-3 text-left transition"
              style={{
                background: domainFilter === d ? `${domainColor(d)}15` : DS.surface,
                border: `1px solid ${domainFilter === d ? `${domainColor(d)}30` : DS.border}`,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2 w-2 rounded-full" style={{ background: domainColor(d) }} />
                <span
                  className="text-[9px] uppercase tracking-wider font-semibold"
                  style={{ color: domainColor(d) }}
                >
                  {d.replace('-', ' ')}
                </span>
              </div>
              <p className="text-lg font-semibold text-white">{count}</p>
              <p className="text-[9px]" style={{ color: DS.text.muted }}>
                active signals
              </p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-5 space-y-3">
          <h3
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: DS.text.muted }}
          >
            Live Signal Feed ({filteredSignals.length})
          </h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredSignals.map((s) => (
              <div
                key={s.id}
                className="rounded-xl p-3"
                style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ background: domainColor(s.domain) }}
                  />
                  <span className="text-[9px] font-mono" style={{ color: DS.text.muted }}>
                    {s.id}
                  </span>
                  <span
                    className="text-[8px] uppercase font-bold tracking-wider rounded px-1.5 py-0.5"
                    style={{ background: `${sevColor(s.severity)}15`, color: sevColor(s.severity) }}
                  >
                    {s.severity}
                  </span>
                  <span className="text-[9px] ml-auto font-mono" style={{ color: DS.text.muted }}>
                    {s.confidence}%
                  </span>
                </div>
                <p className="text-[11px] text-white leading-relaxed">{s.signal}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[8px]" style={{ color: domainColor(s.domain) }}>
                    {s.source}
                  </span>
                  <span className="text-[8px]" style={{ color: DS.text.muted }}>
                    {new Date(s.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-7 space-y-4">
          <h3
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: DS.text.muted }}
          >
            AI-Detected Correlations ({correlations.length})
          </h3>
          <div className="space-y-3">
            {correlations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCorrelation(c.id)}
                aria-label={`Select correlation ${c.title}`}
                className="w-full text-left rounded-xl p-4 transition"
                style={{
                  background: selectedCorrelation === c.id ? 'rgba(255,255,255,0.04)' : DS.surface,
                  border: `1px solid ${selectedCorrelation === c.id ? 'rgba(255,255,255,0.12)' : DS.border}`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-mono" style={{ color: DS.text.muted }}>
                    {c.id}
                  </span>
                  <span
                    className="text-[8px] uppercase font-bold rounded px-1.5 py-0.5"
                    style={{ background: `${sevColor(c.severity)}15`, color: sevColor(c.severity) }}
                  >
                    {c.severity}
                  </span>
                  <span className="text-[9px] font-semibold" style={{ color: ACCENT }}>
                    {c.confidence}% confidence
                  </span>
                  <span
                    className="text-[8px] uppercase font-bold rounded px-1.5 py-0.5 ml-auto"
                    style={{
                      background:
                        c.status === 'confirmed'
                          ? `${GREEN}15`
                          : c.status === 'dismissed'
                            ? 'rgba(255,255,255,0.03)'
                            : c.status === 'investigating'
                              ? `${BLUE}15`
                              : `${ACCENT}15`,
                      color:
                        c.status === 'confirmed'
                          ? GREEN
                          : c.status === 'dismissed'
                            ? DS.text.muted
                            : c.status === 'investigating'
                              ? BLUE
                              : ACCENT,
                    }}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="text-sm font-medium text-white mb-1">{c.title}</p>
                <div className="flex gap-1.5">
                  {c.domains.map((d) => (
                    <span
                      key={d}
                      className="text-[8px] px-1.5 py-0.5 rounded-full"
                      style={{
                        background: `${domainColor(d)}12`,
                        color: domainColor(d),
                        border: `1px solid ${domainColor(d)}20`,
                      }}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {selected && (
            <div
              className="rounded-xl p-5"
              style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Network className="h-4 w-4" style={{ color: ACCENT }} />
                <h3
                  className="text-[10px] uppercase tracking-wider font-semibold"
                  style={{ color: DS.text.muted }}
                >
                  Correlation Analysis
                </h3>
              </div>
              <p className="text-[11px] leading-relaxed mb-4" style={{ color: DS.text.secondary }}>
                {selected.description}
              </p>

              <h4
                className="text-[9px] uppercase tracking-wider font-semibold mb-2"
                style={{ color: DS.text.muted }}
              >
                Contributing Signals ({matchedSignals.length})
              </h4>
              <div className="space-y-1.5 mb-4">
                {matchedSignals.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 rounded-lg p-2"
                    style={{
                      background: 'rgba(255,255,255,0.015)',
                      border: `1px solid ${DS.border}`,
                    }}
                  >
                    <div
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: domainColor(s.domain) }}
                    />
                    <span className="text-[9px] font-mono" style={{ color: DS.text.muted }}>
                      {s.id}
                    </span>
                    <span
                      className="text-[10px] flex-1 line-clamp-1"
                      style={{ color: DS.text.secondary }}
                    >
                      {s.signal}
                    </span>
                  </div>
                ))}
              </div>

              <div
                className="rounded-lg p-3 mb-4"
                style={{ background: `${ACCENT}08`, borderLeft: `2px solid ${ACCENT}` }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className="h-3 w-3" style={{ color: ACCENT }} />
                  <span
                    className="text-[9px] uppercase tracking-wider font-semibold"
                    style={{ color: ACCENT }}
                  >
                    Recommended Action
                  </span>
                </div>
                <p className="text-[10px] leading-relaxed" style={{ color: DS.text.secondary }}>
                  {selected.recommendation}
                </p>
              </div>

              {selected.status === 'new' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStatusChange(selected.id, 'investigating')}
                    aria-label="Begin investigation"
                    className="text-[9px] font-semibold rounded-lg px-3 py-1.5 hover:brightness-125 transition"
                    style={{ background: `${BLUE}20`, color: BLUE }}
                  >
                    Investigate
                  </button>
                  <button
                    onClick={() => handleStatusChange(selected.id, 'confirmed')}
                    aria-label="Confirm correlation"
                    className="text-[9px] font-semibold rounded-lg px-3 py-1.5 hover:brightness-125 transition"
                    style={{ background: `${GREEN}20`, color: GREEN }}
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => handleStatusChange(selected.id, 'dismissed')}
                    aria-label="Dismiss correlation"
                    className="text-[9px] font-semibold rounded-lg px-3 py-1.5 hover:brightness-125 transition"
                    style={{ background: 'rgba(255,255,255,0.04)', color: DS.text.muted }}
                  >
                    Dismiss
                  </button>
                </div>
              )}
              {selected.status === 'investigating' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStatusChange(selected.id, 'confirmed')}
                    aria-label="Confirm correlation"
                    className="text-[9px] font-semibold rounded-lg px-3 py-1.5 hover:brightness-125 transition"
                    style={{ background: `${GREEN}20`, color: GREEN }}
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => handleStatusChange(selected.id, 'dismissed')}
                    aria-label="Dismiss correlation"
                    className="text-[9px] font-semibold rounded-lg px-3 py-1.5 hover:brightness-125 transition"
                    style={{ background: 'rgba(255,255,255,0.04)', color: DS.text.muted }}
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
