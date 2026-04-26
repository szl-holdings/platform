import { color } from '@szl-holdings/design-system';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Anchor,
  BarChart3,
  Building2,
  CheckCircle,
  ChevronRight,
  Globe,
  Layers,
  Map,
  Play,
  RotateCcw,
  Settings,
  Shield,
  Ship,
  Sliders,
  TrendingDown,
  TrendingUp,
  Wind,
  Zap,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { SiteNav } from '@/components/SiteNav';

type Domain = 'vessel' | 'property' | 'security';
type SimStatus = 'idle' | 'running' | 'complete';

interface VesselSim {
  name: string;
  imo: string;
  scenario: 'normal' | 'storm_diversion' | 'chokepoint_delay' | 'emergency_deviation';
  origin: string;
  destination: string;
  windSpeedKnots: number;
  waveHeightM: number;
  durationHours: number;
}

interface PropertySim {
  address: string;
  currentValuation: number;
  noi: number;
  capRate: number;
  occupancyRate: number;
  scenario: 'baseline' | 'stress_test' | 'vacancy_spike' | 'cap_rate_compression' | 'rate_shock';
  interestRateDelta: number;
  vacancyRateDelta: number;
  marketCapRateDelta: number;
}

interface SecuritySim {
  name: string;
  type: 'threat_simulation' | 'tabletop' | 'breach_rehearsal';
  threatActor: string;
  affectedSystems: string;
  postureScore: number;
}

interface SimResult {
  domain: Domain;
  scenario: string;
  fields: Array<{ label: string; before: string; after: string; delta?: string; direction: 'up' | 'down' | 'neutral' }>;
  warnings: string[];
  renderedAt: string;
}

const DEFAULT_VESSEL: VesselSim = {
  name: 'MV Arctic Eagle',
  imo: '9234567',
  scenario: 'storm_diversion',
  origin: 'Singapore (SGSIN)',
  destination: 'Rotterdam (NLRTM)',
  windSpeedKnots: 45,
  waveHeightM: 6.2,
  durationHours: 336,
};

const DEFAULT_PROPERTY: PropertySim = {
  address: '87 Ironside St, Brooklyn NY',
  currentValuation: 7100000,
  noi: 361100,
  capRate: 5.1,
  occupancyRate: 0.82,
  scenario: 'stress_test',
  interestRateDelta: 1.5,
  vacancyRateDelta: 0.15,
  marketCapRateDelta: 0.015,
};

const DEFAULT_SECURITY: SecuritySim = {
  name: 'Supply Chain Ransomware Q2-2026',
  type: 'threat_simulation',
  threatActor: 'LockBit 3.0 Affiliate',
  affectedSystems: 'ERP, Warehouse Mgmt, SCADA',
  postureScore: 67,
};

function runVesselSim(sim: VesselSim): SimResult {
  const delaySuffix = sim.scenario === 'chokepoint_delay' ? '+18h delay' : sim.scenario === 'storm_diversion' ? '+41h deviation' : '';
  const etaDays = Math.ceil(sim.durationHours / 24) + (sim.scenario === 'storm_diversion' ? 2 : sim.scenario === 'chokepoint_delay' ? 1 : 0);
  const fuelImpact = sim.scenario === 'storm_diversion' ? '+12%' : sim.scenario === 'chokepoint_delay' ? '+4%' : 'nominal';
  const riskLevel = sim.scenario === 'emergency_deviation' || sim.scenario === 'storm_diversion' ? 'critical' : 'medium';
  return {
    domain: 'vessel',
    scenario: sim.scenario,
    fields: [
      { label: 'Route', before: `${sim.origin} → ${sim.destination}`, after: sim.scenario === 'storm_diversion' ? `${sim.origin} → Cape of Good Hope → ${sim.destination}` : `${sim.origin} → ${sim.destination}`, delta: sim.scenario === 'storm_diversion' ? '+3,200nm deviation' : undefined, direction: sim.scenario === 'normal' ? 'neutral' : 'down' },
      { label: 'ETA', before: `${sim.durationHours / 24} days`, after: `${etaDays} days ${delaySuffix}`, direction: sim.scenario === 'normal' ? 'neutral' : 'down' },
      { label: 'Fuel Consumption', before: 'Baseline', after: fuelImpact, direction: sim.scenario === 'normal' ? 'neutral' : 'down' },
      { label: 'Route Risk', before: 'medium', after: riskLevel, direction: riskLevel === 'critical' ? 'down' : 'neutral' },
      { label: 'Wind Speed', before: '—', after: `${sim.windSpeedKnots} knots`, direction: sim.windSpeedKnots > 35 ? 'down' : 'neutral' },
      { label: 'Wave Height', before: '—', after: `${sim.waveHeightM}m`, direction: sim.waveHeightM > 4 ? 'down' : 'neutral' },
    ],
    warnings: [
      ...(sim.scenario === 'storm_diversion' ? ['Storm diversion: alternate waypoints automatically inserted — voyage P&L impacted by ~$180K', 'Chokepoint delay scenario: ETA extended, fuel surcharge clause may apply'] : []),
      ...(sim.windSpeedKnots > 40 ? ['Wind speed exceeds 40 knots — structural stress on hull above comfort threshold'] : []),
      ...(sim.scenario === 'emergency_deviation' ? ['MAYDAY deviation — emergency heading change recorded, flag state notified'] : []),
    ],
    renderedAt: new Date().toISOString(),
  };
}

function runPropertySim(sim: PropertySim): SimResult {
  let adjustedNoi = sim.noi;
  let adjustedCapRate = sim.capRate;
  let adjustedOccupancy = sim.occupancyRate;
  let adjustedDscr = 1.22;

  if (sim.scenario === 'stress_test' || sim.scenario === 'vacancy_spike') {
    adjustedOccupancy = Math.max(0, sim.occupancyRate - sim.vacancyRateDelta);
    adjustedNoi = sim.noi * (adjustedOccupancy / sim.occupancyRate);
  }
  if (sim.scenario === 'stress_test' || sim.scenario === 'cap_rate_compression') {
    adjustedCapRate = sim.capRate + sim.marketCapRateDelta * 100;
  }
  if (sim.scenario === 'rate_shock') {
    adjustedDscr = Math.max(0.5, 1.22 - sim.interestRateDelta * 0.15);
  }

  const adjustedValuation = adjustedNoi / (adjustedCapRate / 100);
  const valueDelta = adjustedValuation - sim.currentValuation;
  const valuePct = ((valueDelta / sim.currentValuation) * 100).toFixed(1);

  return {
    domain: 'property',
    scenario: sim.scenario,
    fields: [
      { label: 'Valuation', before: `$${(sim.currentValuation / 1e6).toFixed(2)}M`, after: `$${(adjustedValuation / 1e6).toFixed(2)}M`, delta: `${valuePct}%`, direction: valueDelta >= 0 ? 'up' : 'down' },
      { label: 'NOI', before: `$${(sim.noi / 1000).toFixed(0)}K`, after: `$${(adjustedNoi / 1000).toFixed(0)}K`, direction: adjustedNoi >= sim.noi ? 'neutral' : 'down' },
      { label: 'Cap Rate', before: `${sim.capRate.toFixed(2)}%`, after: `${adjustedCapRate.toFixed(2)}%`, direction: adjustedCapRate > sim.capRate ? 'down' : 'up' },
      { label: 'Occupancy', before: `${(sim.occupancyRate * 100).toFixed(0)}%`, after: `${(adjustedOccupancy * 100).toFixed(0)}%`, direction: adjustedOccupancy < sim.occupancyRate ? 'down' : 'neutral' },
      { label: 'DSCR', before: '1.22x', after: `${adjustedDscr.toFixed(2)}x`, direction: adjustedDscr < 1.1 ? 'down' : 'neutral' },
    ],
    warnings: [
      ...(adjustedValuation < sim.currentValuation * 0.85 ? ['Simulated valuation decline exceeds 15% — material impairment threshold breached'] : []),
      ...(adjustedOccupancy < 0.65 ? ['Occupancy below 65% — NOI insufficient for debt service at current rates'] : []),
      ...(adjustedDscr < 1.1 ? ['DSCR approaching breach threshold (1.10x) — lender covenant risk elevated'] : []),
      ...(sim.scenario === 'stress_test' ? ['Stress test applied — figures reflect combined vacancy spike + cap rate expansion'] : []),
    ],
    renderedAt: new Date().toISOString(),
  };
}

function runSecuritySim(sim: SecuritySim): SimResult {
  const postureAfter = Math.max(10, sim.postureScore - Math.floor(15 + Math.random() * 30));
  const mttd = Math.floor(180 + Math.random() * 240);
  const mttr = Math.floor(3000 + Math.random() * 2000);
  const blastRadius = Math.floor(30 + Math.random() * 30);
  return {
    domain: 'security',
    scenario: sim.type,
    fields: [
      { label: 'Posture Score', before: `${sim.postureScore}/100`, after: `${postureAfter}/100`, delta: `-${sim.postureScore - postureAfter}`, direction: 'down' },
      { label: 'Threat Actor', before: '—', after: sim.threatActor, direction: 'down' },
      { label: 'Affected Systems', before: '—', after: sim.affectedSystems, direction: 'down' },
      { label: 'MTTD (Estimated)', before: '—', after: `${Math.round(mttd / 60)}h ${mttd % 60}m`, direction: 'down' },
      { label: 'MTTR (Estimated)', before: '—', after: `${Math.round(mttr / 60)}h`, direction: 'down' },
      { label: 'Blast Radius', before: '—', after: `${blastRadius}% of systems`, direction: 'down' },
    ],
    warnings: [
      ...(postureAfter < 40 ? ['Critical posture drop — consider immediate defensive controls and tabletop rehearsal'] : []),
      'Supply chain ransomware scenario: tier-2 vendor access is primary entry vector',
      'Recommend: MFA enforcement on all ERP service accounts prior to next assessment',
    ],
    renderedAt: new Date().toISOString(),
  };
}

function VesselRouteCanvas({ scenario }: { scenario: string }) {
  const waypoints = scenario === 'storm_diversion'
    ? [{ x: 80, y: 200, label: 'Singapore' }, { x: 160, y: 260, label: 'Colombo' }, { x: 230, y: 310, label: 'Cape of GH' }, { x: 350, y: 180, label: 'Dakar' }, { x: 480, y: 120, label: 'Rotterdam' }]
    : [{ x: 80, y: 200, label: 'Singapore' }, { x: 200, y: 180, label: 'Aden' }, { x: 320, y: 150, label: 'Suez' }, { x: 480, y: 120, label: 'Rotterdam' }];

  return (
    <svg viewBox="0 0 560 360" className="w-full h-full" style={{ background: 'transparent' }}>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#60a5fa" />
        </marker>
      </defs>
      <rect x="0" y="0" width="560" height="360" rx="12" fill="rgba(6,18,42,0.6)" />
      {Array.from({ length: 6 }, (_, i) => (
        <line key={i} x1="0" y1={60 * i} x2="560" y2={60 * i} stroke="rgba(96,165,250,0.04)" strokeWidth="1" />
      ))}
      <polyline
        points={waypoints.map((w) => `${w.x},${w.y}`).join(' ')}
        fill="none"
        stroke={scenario === 'storm_diversion' ? '#f97316' : '#60a5fa'}
        strokeWidth="1.5"
        strokeDasharray={scenario === 'storm_diversion' ? '6 3' : 'none'}
        markerEnd="url(#arrow)"
      />
      {waypoints.map((wp, i) => (
        <g key={i}>
          <circle cx={wp.x} cy={wp.y} r="5" fill={i === 0 ? '#4ade80' : i === waypoints.length - 1 ? '#60a5fa' : '#f59e0b'} />
          <text x={wp.x} y={wp.y - 10} fontSize="9" fill="rgba(255,255,255,0.6)" textAnchor="middle">{wp.label}</text>
        </g>
      ))}
      {scenario === 'storm_diversion' && (
        <g>
          <circle cx="195" cy="280" r="35" fill="rgba(239,68,68,0.08)" stroke="rgba(239,68,68,0.3)" strokeWidth="1" strokeDasharray="4 2" />
          <text x="195" y="283" fontSize="8" fill="rgba(239,68,68,0.7)" textAnchor="middle">⛈ Storm</text>
        </g>
      )}
      <text x="280" y="340" fontSize="9" fill="rgba(255,255,255,0.3)" textAnchor="middle">
        {scenario === 'storm_diversion' ? 'Route: Cape of Good Hope diversion — +3,200nm' : 'Route: Suez Canal (standard)'}
      </text>
    </svg>
  );
}

function PropertyStressCanvas({ scenario, valuationPct }: { scenario: string; valuationPct: number }) {
  const bars = [
    { label: 'Baseline', value: 100, color: '#4ade80' },
    { label: 'Vacancy', value: scenario === 'vacancy_spike' ? 78 : scenario === 'stress_test' ? 85 : 100, color: '#f59e0b' },
    { label: 'Cap Rate', value: scenario === 'cap_rate_compression' || scenario === 'stress_test' ? 88 : 100, color: '#f97316' },
    { label: 'Rate Shock', value: scenario === 'rate_shock' || scenario === 'stress_test' ? 82 : 100, color: '#ef4444' },
    { label: 'Combined', value: Math.max(60, 100 + valuationPct), color: scenario === 'stress_test' ? '#ef4444' : '#4ade80' },
  ];

  return (
    <svg viewBox="0 0 480 240" className="w-full h-full">
      <rect x="0" y="0" width="480" height="240" rx="12" fill="rgba(6,18,42,0.6)" />
      {bars.map((bar, i) => {
        const x = 40 + i * 82;
        const barH = (bar.value / 100) * 140;
        const y = 180 - barH;
        return (
          <g key={bar.label}>
            <rect x={x} y={y} width="52" height={barH} rx="4" fill={`${bar.color}40`} stroke={bar.color} strokeWidth="1" />
            <text x={x + 26} y={y - 6} fontSize="11" fill={bar.color} textAnchor="middle" fontWeight="bold">{bar.value}%</text>
            <text x={x + 26} y="200" fontSize="8" fill="rgba(255,255,255,0.4)" textAnchor="middle">{bar.label}</text>
          </g>
        );
      })}
      <line x1="30" y1="180" x2="450" y2="180" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <text x="240" y="228" fontSize="9" fill="rgba(255,255,255,0.3)" textAnchor="middle">Portfolio Stress Scenarios — Relative Valuation Index</text>
    </svg>
  );
}

function SecurityRadarCanvas({ postureScore }: { postureScore: number }) {
  const cx = 200, cy = 120, r = 90;
  const axes = ['Access Control', 'Detection', 'Response', 'Resilience', 'Compliance', 'Identity'];
  const scores = [postureScore * 0.8, postureScore * 0.65, postureScore * 0.72, postureScore * 0.6, postureScore * 0.9, postureScore * 0.7];

  function polarToXY(angle: number, radius: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  const axisAngle = 360 / axes.length;
  const points = scores.map((s, i) => polarToXY(i * axisAngle, (s / 100) * r));
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg viewBox="0 0 400 240" className="w-full h-full">
      <rect x="0" y="0" width="400" height="240" rx="12" fill="rgba(6,18,42,0.6)" />
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={axes.map((_, i) => {
            const p = polarToXY(i * axisAngle, level * r);
            return `${p.x},${p.y}`;
          }).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}
      {axes.map((_, i) => {
        const end = polarToXY(i * axisAngle, r);
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
      })}
      <polygon
        points={points.map((p) => `${p.x},${p.y}`).join(' ')}
        fill="rgba(239,68,68,0.12)"
        stroke="#ef4444"
        strokeWidth="1.5"
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#ef4444" />
      ))}
      {axes.map((label, i) => {
        const pos = polarToXY(i * axisAngle, r + 16);
        return <text key={i} x={pos.x} y={pos.y} fontSize="7.5" fill="rgba(255,255,255,0.5)" textAnchor="middle" dominantBaseline="middle">{label}</text>;
      })}
      <text x="310" y="80" fontSize="11" fill="rgba(255,255,255,0.5)" textAnchor="middle">Score</text>
      <text x="310" y="96" fontSize="22" fill="#ef4444" textAnchor="middle" fontWeight="bold">{postureScore}</text>
      <text x="310" y="112" fontSize="9" fill="rgba(255,255,255,0.3)" textAnchor="middle">/100 posture</text>
    </svg>
  );
}

export default function DigitalTwinSimulator() {
  const [activeDomain, setActiveDomain] = useState<Domain>('vessel');
  const [vesselSim, setVesselSim] = useState<VesselSim>(DEFAULT_VESSEL);
  const [propertySim, setPropertySim] = useState<PropertySim>(DEFAULT_PROPERTY);
  const [securitySim, setSecuritySim] = useState<SecuritySim>(DEFAULT_SECURITY);
  const [simStatus, setSimStatus] = useState<SimStatus>('idle');
  const [simResult, setSimResult] = useState<SimResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSim = useCallback(() => {
    setSimStatus('running');
    setSimResult(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const result =
        activeDomain === 'vessel' ? runVesselSim(vesselSim) :
        activeDomain === 'property' ? runPropertySim(propertySim) :
        runSecuritySim(securitySim);
      setSimResult(result);
      setSimStatus('complete');
    }, 2000);
  }, [activeDomain, vesselSim, propertySim, securitySim]);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSimStatus('idle');
    setSimResult(null);
  }, []);

  const domains: Array<{ id: Domain; label: string; icon: React.ElementType }> = [
    { id: 'vessel', label: 'Vessel Route', icon: Ship },
    { id: 'property', label: 'Property Portfolio', icon: Building2 },
    { id: 'security', label: 'Security Posture', icon: Shield },
  ];

  const valuationPct = simResult?.domain === 'property'
    ? parseFloat(simResult.fields[0]?.delta ?? '0')
    : 0;

  return (
    <div className="min-h-screen" style={{ background: color.bg.base }}>
      <SiteNav />
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-6 h-6" style={{ color: color.accent.blue }} />
            <h1 className="text-2xl font-bold" style={{ color: color.text.primary }}>Digital Twin Simulator</h1>
          </div>
          <p className="text-sm" style={{ color: color.text.muted }}>
            In-browser simulation mesh — vessel route replay, property stress testing, security posture rehearsals.
            Powered by the OpenUSD export infrastructure.
          </p>
        </div>

        {/* Domain Tabs */}
        <div className="flex gap-2 mb-6">
          {domains.map((d) => {
            const Icon = d.icon;
            return (
              <button
                key={d.id}
                onClick={() => { setActiveDomain(d.id); reset(); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: activeDomain === d.id ? `${color.accent.blue}20` : 'rgba(255,255,255,0.04)',
                  color: activeDomain === d.id ? color.accent.blue : color.text.muted,
                  border: `1px solid ${activeDomain === d.id ? `${color.accent.blue}40` : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <Icon className="w-4 h-4" />
                {d.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Config Panel */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="w-4 h-4" style={{ color: color.text.muted }} />
              <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: color.text.muted }}>Simulation Parameters</h3>
            </div>

            {/* Vessel Config */}
            {activeDomain === 'vessel' && (
              <div className="space-y-3">
                {([['scenario', 'Scenario', [['normal', 'Normal Route'], ['storm_diversion', 'Storm Diversion'], ['chokepoint_delay', 'Chokepoint Delay'], ['emergency_deviation', 'Emergency Deviation']]]] as const).map(([key, label, options]) => (
                  <div key={key}>
                    <label className="text-[11px]" style={{ color: color.text.muted }}>{label}</label>
                    <select
                      value={vesselSim[key]}
                      onChange={(e) => setVesselSim((v) => ({ ...v, [key]: e.target.value as VesselSim['scenario'] }))}
                      className="w-full mt-1 px-3 py-2 rounded-lg text-xs"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: color.text.primary }}
                    >
                      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                ))}
                <div>
                  <label className="text-[11px]" style={{ color: color.text.muted }}>Wind Speed (knots)</label>
                  <input type="range" min="0" max="80" value={vesselSim.windSpeedKnots} onChange={(e) => setVesselSim((v) => ({ ...v, windSpeedKnots: Number(e.target.value) }))} className="w-full mt-1" />
                  <span className="text-[11px]" style={{ color: color.text.muted }}>{vesselSim.windSpeedKnots} knots</span>
                </div>
                <div>
                  <label className="text-[11px]" style={{ color: color.text.muted }}>Wave Height (m)</label>
                  <input type="range" min="0" max="12" step="0.1" value={vesselSim.waveHeightM} onChange={(e) => setVesselSim((v) => ({ ...v, waveHeightM: Number(e.target.value) }))} className="w-full mt-1" />
                  <span className="text-[11px]" style={{ color: color.text.muted }}>{vesselSim.waveHeightM.toFixed(1)}m</span>
                </div>
              </div>
            )}

            {/* Property Config */}
            {activeDomain === 'property' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px]" style={{ color: color.text.muted }}>Scenario</label>
                  <select
                    value={propertySim.scenario}
                    onChange={(e) => setPropertySim((p) => ({ ...p, scenario: e.target.value as PropertySim['scenario'] }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-xs"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: color.text.primary }}
                  >
                    <option value="baseline">Baseline</option>
                    <option value="stress_test">Stress Test</option>
                    <option value="vacancy_spike">Vacancy Spike</option>
                    <option value="cap_rate_compression">Cap Rate Compression</option>
                    <option value="rate_shock">Rate Shock</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px]" style={{ color: color.text.muted }}>Vacancy Rate Delta</label>
                  <input type="range" min="0" max="0.4" step="0.01" value={propertySim.vacancyRateDelta} onChange={(e) => setPropertySim((p) => ({ ...p, vacancyRateDelta: Number(e.target.value) }))} className="w-full mt-1" />
                  <span className="text-[11px]" style={{ color: color.text.muted }}>+{(propertySim.vacancyRateDelta * 100).toFixed(0)}% vacancy</span>
                </div>
                <div>
                  <label className="text-[11px]" style={{ color: color.text.muted }}>Cap Rate Delta (bps)</label>
                  <input type="range" min="0" max="0.03" step="0.001" value={propertySim.marketCapRateDelta} onChange={(e) => setPropertySim((p) => ({ ...p, marketCapRateDelta: Number(e.target.value) }))} className="w-full mt-1" />
                  <span className="text-[11px]" style={{ color: color.text.muted }}>+{(propertySim.marketCapRateDelta * 10000).toFixed(0)}bps cap rate</span>
                </div>
                <div>
                  <label className="text-[11px]" style={{ color: color.text.muted }}>Interest Rate Delta</label>
                  <input type="range" min="0" max="3" step="0.25" value={propertySim.interestRateDelta} onChange={(e) => setPropertySim((p) => ({ ...p, interestRateDelta: Number(e.target.value) }))} className="w-full mt-1" />
                  <span className="text-[11px]" style={{ color: color.text.muted }}>+{propertySim.interestRateDelta.toFixed(2)}% rate</span>
                </div>
              </div>
            )}

            {/* Security Config */}
            {activeDomain === 'security' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px]" style={{ color: color.text.muted }}>Simulation Type</label>
                  <select
                    value={securitySim.type}
                    onChange={(e) => setSecuritySim((s) => ({ ...s, type: e.target.value as SecuritySim['type'] }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-xs"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: color.text.primary }}
                  >
                    <option value="threat_simulation">Threat Simulation</option>
                    <option value="tabletop">Tabletop Exercise</option>
                    <option value="breach_rehearsal">Breach Rehearsal</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px]" style={{ color: color.text.muted }}>Current Posture Score</label>
                  <input type="range" min="20" max="100" value={securitySim.postureScore} onChange={(e) => setSecuritySim((s) => ({ ...s, postureScore: Number(e.target.value) }))} className="w-full mt-1" />
                  <span className="text-[11px]" style={{ color: color.text.muted }}>{securitySim.postureScore}/100</span>
                </div>
                <div>
                  <label className="text-[11px]" style={{ color: color.text.muted }}>Threat Actor</label>
                  <input value={securitySim.threatActor} onChange={(e) => setSecuritySim((s) => ({ ...s, threatActor: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: color.text.primary }} />
                </div>
              </div>
            )}

            <button
              onClick={simStatus === 'running' ? undefined : runSim}
              disabled={simStatus === 'running'}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: simStatus === 'running' ? 'rgba(255,255,255,0.06)' : color.accent.blue,
                color: simStatus === 'running' ? color.text.muted : 'white',
              }}
            >
              {simStatus === 'running' ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Running Simulation…</>
              ) : (
                <><Play className="w-4 h-4" /> Run Simulation</>
              )}
            </button>
            {simStatus !== 'idle' && (
              <button
                onClick={reset}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all"
                style={{ color: color.text.muted }}
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          {/* Visualization + Results */}
          <div className="lg:col-span-2 space-y-5">
            {/* Canvas */}
            <div className="rounded-2xl overflow-hidden aspect-[16/7]" style={{ background: 'rgba(6,18,42,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {activeDomain === 'vessel' && (
                <VesselRouteCanvas scenario={simResult ? vesselSim.scenario : 'normal'} />
              )}
              {activeDomain === 'property' && (
                <PropertyStressCanvas scenario={propertySim.scenario} valuationPct={valuationPct} />
              )}
              {activeDomain === 'security' && (
                <SecurityRadarCanvas postureScore={simResult ? (simResult.fields[0] ? parseInt(simResult.fields[0].after) : securitySim.postureScore) : securitySim.postureScore} />
              )}
            </div>

            {/* Results */}
            <AnimatePresence>
              {simResult && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-5 space-y-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: color.text.muted }}>Simulation Results</h3>
                    <span className="text-[10px]" style={{ color: color.text.muted }}>Rendered {new Date(simResult.renderedAt).toLocaleTimeString()}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {simResult.fields.map((field, i) => (
                      <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p className="text-[10px]" style={{ color: color.text.muted }}>{field.label}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {field.before !== '—' && (
                            <>
                              <span className="text-[11px]" style={{ color: color.text.muted }}>{field.before}</span>
                              <ChevronRight className="w-3 h-3" style={{ color: color.text.muted }} />
                            </>
                          )}
                          <span className="text-sm font-bold" style={{ color: field.direction === 'down' ? color.accent.red : field.direction === 'up' ? color.accent.green : color.text.primary }}>
                            {field.after}
                          </span>
                          {field.delta && (
                            <span className="text-[10px]" style={{ color: field.direction === 'down' ? color.accent.red : color.accent.green }}>
                              ({field.delta})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {simResult.warnings.length > 0 && (
                    <div className="space-y-1.5">
                      {simResult.warnings.map((w, i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: color.accent.amber }} />
                          <span className="text-[11px]" style={{ color: `${color.text.primary}cc` }}>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {simStatus === 'idle' && (
              <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Activity className="w-8 h-8 mx-auto mb-3" style={{ color: `${color.text.muted}60` }} />
                <p className="text-sm" style={{ color: color.text.muted }}>Configure parameters and run the simulation to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
