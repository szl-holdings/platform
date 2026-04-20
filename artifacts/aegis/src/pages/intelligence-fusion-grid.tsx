import {
  Activity,
  AlertTriangle,
  Eye,
  Globe,
  Layers,
  Network,
  Radio,
  Shield,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const ACCENT = '#ef4444';
const PURPLE = '#8b5cf6';
const DS = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.06)',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    muted: 'rgba(255,255,255,0.25)',
  },
};

interface IntelSource {
  id: string;
  name: string;
  type: 'dark_web' | 'osint' | 'isp_threat' | 'geopolitical' | 'internal' | 'cti_feed';
  status: 'active' | 'delayed' | 'offline';
  lastFeed: number;
  alertCount: number;
  confidence: number;
  color: string;
}

interface FusedSignal {
  id: string;
  timestamp: number;
  title: string;
  sources: string[];
  confidence: number;
  severity: 'critical' | 'high' | 'medium';
  type:
    | 'ttp_match'
    | 'dark_web_mention'
    | 'geo_risk'
    | 'cross_domain_pattern'
    | 'adversary_movement';
  description: string;
  mitreTactics: string[];
  geographicRisk?: string;
  affectedSectors?: string[];
}

interface GeopoliticalRisk {
  region: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  threatActors: string[];
  primaryTTP: string;
  trend: 'escalating' | 'stable' | 'de-escalating';
}

interface TTPTrack {
  actor: string;
  alias: string;
  country: string;
  ttps: string[];
  lastSeen: number;
  targetSectors: string[];
  confidence: number;
  active: boolean;
}

const INTEL_SOURCES: IntelSource[] = [
  {
    id: 'dw1',
    name: 'Dark Web Monitor Alpha',
    type: 'dark_web',
    status: 'active',
    lastFeed: Date.now() - 90000,
    alertCount: 3,
    confidence: 72,
    color: '#8b5cf6',
  },
  {
    id: 'dw2',
    name: 'Paste / Forum Scraper',
    type: 'dark_web',
    status: 'active',
    lastFeed: Date.now() - 45000,
    alertCount: 1,
    confidence: 61,
    color: '#7c3aed',
  },
  {
    id: 'osint1',
    name: 'OSINT Aggregator v4',
    type: 'osint',
    status: 'active',
    lastFeed: Date.now() - 12000,
    alertCount: 7,
    confidence: 83,
    color: '#3b82f6',
  },
  {
    id: 'geo1',
    name: 'Geopolitical Risk Feed',
    type: 'geopolitical',
    status: 'active',
    lastFeed: Date.now() - 300000,
    alertCount: 2,
    confidence: 77,
    color: '#f59e0b',
  },
  {
    id: 'cti1',
    name: 'MITRE ATT&CK Enrichment',
    type: 'cti_feed',
    status: 'active',
    lastFeed: Date.now() - 5000,
    alertCount: 12,
    confidence: 96,
    color: '#10b981',
  },
  {
    id: 'cti2',
    name: 'FS-ISAC Threat Intel',
    type: 'cti_feed',
    status: 'delayed',
    lastFeed: Date.now() - 1800000,
    alertCount: 4,
    confidence: 88,
    color: '#14b8a6',
  },
  {
    id: 'int1',
    name: 'Internal SOC Correlation',
    type: 'internal',
    status: 'active',
    lastFeed: Date.now() - 2000,
    alertCount: 9,
    confidence: 95,
    color: '#ef4444',
  },
  {
    id: 'isp1',
    name: 'ISP Threat Exchange',
    type: 'isp_threat',
    status: 'active',
    lastFeed: Date.now() - 60000,
    alertCount: 5,
    confidence: 79,
    color: '#f97316',
  },
];

const FUSED_SIGNALS: FusedSignal[] = [
  {
    id: 'fs001',
    timestamp: Date.now() - 120000,
    title: 'APT29 campaign targeting financial sector — 3 independent confirmations',
    sources: ['dw1', 'osint1', 'int1'],
    confidence: 91,
    severity: 'critical',
    type: 'adversary_movement',
    description:
      'Dark web forum mentions coordinated with OSINT detection of Cobalt Strike C2 infrastructure and internal lateral movement indicators. High-confidence APT29 attribution.',
    mitreTactics: ['Initial Access', 'Persistence', 'Lateral Movement'],
    geographicRisk: 'Eastern Europe',
    affectedSectors: ['Finance', 'Government'],
  },
  {
    id: 'fs002',
    timestamp: Date.now() - 240000,
    title: 'Ransomware-as-a-Service kit posted targeting MSPs',
    sources: ['dw1', 'dw2', 'cti1'],
    confidence: 84,
    severity: 'high',
    type: 'dark_web_mention',
    description:
      'New RaaS toolkit specifically targeting managed service providers detected across two dark web forums. IOC signatures extracted and loaded into detection rules.',
    mitreTactics: ['Defense Evasion', 'Impact'],
    affectedSectors: ['MSP', 'Technology'],
  },
  {
    id: 'fs003',
    timestamp: Date.now() - 480000,
    title: 'Geopolitical escalation: APAC cyber operations spike',
    sources: ['geo1', 'cti2', 'osint1'],
    confidence: 78,
    severity: 'high',
    type: 'geo_risk',
    description:
      'FS-ISAC and geopolitical risk feeds correlated with 340% spike in scanning activity originating from APAC region. Critical infrastructure targeting pattern.',
    mitreTactics: ['Reconnaissance', 'Resource Development'],
    geographicRisk: 'APAC',
    affectedSectors: ['Energy', 'Finance', 'Logistics'],
  },
  {
    id: 'fs004',
    timestamp: Date.now() - 720000,
    title: 'Cross-domain pattern: 5 client orgs share common IOC hash',
    sources: ['int1', 'cti1', 'isp1'],
    confidence: 88,
    severity: 'high',
    type: 'cross_domain_pattern',
    description:
      'Invisible to any single system — cross-portfolio analysis reveals shared malicious hash across 5 managed clients. Common supply chain compromise suspected.',
    mitreTactics: ['Initial Access', 'Execution'],
    affectedSectors: ['Multi-sector'],
  },
];

const GEO_RISKS: GeopoliticalRisk[] = [
  {
    region: 'Russia / Eastern Europe',
    riskLevel: 'critical',
    threatActors: ['APT29', 'APT28', 'Sandworm'],
    primaryTTP: 'Lateral Movement, Ransomware',
    trend: 'escalating',
  },
  {
    region: 'China / APAC',
    riskLevel: 'high',
    threatActors: ['APT41', 'Volt Typhoon'],
    primaryTTP: 'Living-off-the-land, Supply Chain',
    trend: 'escalating',
  },
  {
    region: 'North Korea',
    riskLevel: 'high',
    threatActors: ['Lazarus Group', 'Kimsuky'],
    primaryTTP: 'Financial Theft, Crypto Targeting',
    trend: 'stable',
  },
  {
    region: 'Iran',
    riskLevel: 'medium',
    threatActors: ['APT33', 'APT34'],
    primaryTTP: 'Spearphishing, Destructive Malware',
    trend: 'stable',
  },
  {
    region: 'Latin America',
    riskLevel: 'medium',
    threatActors: ['FIN7', 'eCrime'],
    primaryTTP: 'Business Email Compromise',
    trend: 'de-escalating',
  },
];

const TTP_TRACKS: TTPTrack[] = [
  {
    actor: 'APT29',
    alias: 'Cozy Bear',
    country: 'Russia',
    ttps: ['Pass-the-Hash', 'Cobalt Strike', 'LSASS Dump', 'DCSync'],
    lastSeen: Date.now() - 180000,
    targetSectors: ['Government', 'Finance', 'Energy'],
    confidence: 94,
    active: true,
  },
  {
    actor: 'FIN7',
    alias: 'Carbanak',
    country: 'eCrime',
    ttps: ['Spearphishing', 'Process Injection', 'Backdoor.Carbanak'],
    lastSeen: Date.now() - 900000,
    targetSectors: ['Finance', 'Retail', 'MSP'],
    confidence: 88,
    active: true,
  },
  {
    actor: 'Volt Typhoon',
    alias: 'Bronze Silhouette',
    country: 'China',
    ttps: ['Living-off-the-land', 'LOLBins', 'NTDS Dump'],
    lastSeen: Date.now() - 2400000,
    targetSectors: ['Critical Infrastructure', 'Government'],
    confidence: 77,
    active: false,
  },
];

function SourceBadge({ source }: { source: IntelSource }) {
  const statusColor =
    source.status === 'active' ? '#6b8f71' : source.status === 'delayed' ? '#d4a054' : '#6b7280';
  return (
    <div
      className="flex items-center gap-2 p-2 rounded-lg"
      style={{ background: `${source.color}08`, border: `1px solid ${source.color}20` }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{
          background: statusColor,
          boxShadow: source.status === 'active' ? `0 0 4px ${statusColor}` : 'none',
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-medium text-white/80 truncate">{source.name}</div>
        <div className="text-[8px]" style={{ color: DS.text.muted }}>
          {source.alertCount} alerts · conf {source.confidence}%
        </div>
      </div>
      <div className="text-[8px] font-mono" style={{ color: source.color }}>
        {Math.round((Date.now() - source.lastFeed) / 60000)}m
      </div>
    </div>
  );
}

function SignalCard({ signal }: { signal: FusedSignal }) {
  const typeColors: Record<FusedSignal['type'], string> = {
    ttp_match: '#ef4444',
    dark_web_mention: '#8b5cf6',
    geo_risk: '#f59e0b',
    cross_domain_pattern: '#3b82f6',
    adversary_movement: '#ef4444',
  };
  const typeColor = typeColors[signal.type];
  const severityColor =
    signal.severity === 'critical' ? ACCENT : signal.severity === 'high' ? '#f97316' : '#f59e0b';
  const sourcedFrom = INTEL_SOURCES.filter((s) => signal.sources.includes(s.id));

  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: `${typeColor}25`, background: `${typeColor}05` }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold text-white mb-0.5">{signal.title}</div>
          <div className="text-[9px] font-mono" style={{ color: DS.text.muted }}>
            {Math.round((Date.now() - signal.timestamp) / 60000)}m ago · {signal.sources.length}{' '}
            sources correlated
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span
            className="px-1.5 py-0.5 rounded text-[9px] font-bold"
            style={{ background: `${severityColor}15`, color: severityColor }}
          >
            {signal.severity}
          </span>
          <span className="text-[10px] font-bold font-mono" style={{ color: typeColor }}>
            {signal.confidence}%
          </span>
        </div>
      </div>

      <p className="text-[10px] leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {signal.description}
      </p>

      <div className="flex flex-wrap gap-1 mb-2">
        {signal.mitreTactics.map((t) => (
          <span
            key={t}
            className="px-1.5 py-0.5 rounded text-[8px]"
            style={{
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.4)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {t}
          </span>
        ))}
        {signal.geographicRisk && (
          <span
            className="px-1.5 py-0.5 rounded text-[8px]"
            style={{ background: '#f59e0b15', color: '#f59e0b' }}
          >
            🌐 {signal.geographicRisk}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <span className="text-[9px]" style={{ color: DS.text.muted }}>
          Sourced from:
        </span>
        {sourcedFrom.map((s) => (
          <span
            key={s.id}
            className="text-[8px] px-1 py-0.5 rounded"
            style={{ background: `${s.color}15`, color: s.color }}
          >
            {s.name.split(' ')[0]}
          </span>
        ))}
      </div>
    </div>
  );
}

function GeoRiskRow({ risk }: { risk: GeopoliticalRisk }) {
  const riskColors = { critical: ACCENT, high: '#f97316', medium: '#f59e0b', low: '#6b8f71' };
  const trendColors = { escalating: ACCENT, stable: '#f59e0b', 'de-escalating': '#6b8f71' };
  const rc = riskColors[risk.riskLevel];
  const tc = trendColors[risk.trend];

  return (
    <div
      className="flex items-center gap-3 py-2 px-3 rounded-lg"
      style={{ background: `${rc}06`, border: `1px solid ${rc}12` }}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold text-white">{risk.region}</div>
        <div className="text-[9px]" style={{ color: DS.text.muted }}>
          {risk.threatActors.join(', ')}
        </div>
      </div>
      <div className="text-right">
        <div
          className="text-[9px] font-mono truncate max-w-[140px]"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          {risk.primaryTTP}
        </div>
      </div>
      <span
        className="px-1.5 py-0.5 rounded text-[8px] font-bold shrink-0"
        style={{ background: `${rc}15`, color: rc }}
      >
        {risk.riskLevel}
      </span>
      <span className="text-[8px] shrink-0" style={{ color: tc }}>
        {risk.trend === 'escalating' ? '↑' : risk.trend === 'de-escalating' ? '↓' : '→'}{' '}
        {risk.trend}
      </span>
    </div>
  );
}

export default function IntelligenceFusionGrid() {
  const [activeSignals, setActiveSignals] = useState(FUSED_SIGNALS);
  const [sourceUpdates, setSourceUpdates] = useState(0);
  const [tab, setTab] = useState<'fusion' | 'geo' | 'ttp'>('fusion');

  useEffect(() => {
    const t = setInterval(() => setSourceUpdates((p) => p + 1), 3000);
    return () => clearInterval(t);
  }, []);

  const totalAlerts = INTEL_SOURCES.reduce((s, src) => s + src.alertCount, 0);
  const activeSources = INTEL_SOURCES.filter((s) => s.status === 'active').length;
  const criticalSignals = activeSignals.filter((s) => s.severity === 'critical').length;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-3.5 h-3.5" style={{ color: PURPLE }} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest font-mono"
              style={{ color: PURPLE }}
            >
              Aegis · Intelligence Fusion Grid
            </span>
            <span
              className="px-1.5 py-0.5 rounded text-[8px] font-bold"
              style={{ background: 'rgba(139,92,246,0.15)', color: PURPLE }}
            >
              MULTI-SOURCE
            </span>
          </div>
          <h1 className="text-xl font-bold text-white">Intelligence Fusion Grid</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            NSA/CIA-inspired multi-source intelligence correlation — dark web monitoring, adversary
            TTP tracking, geopolitical risk overlays, and cross-domain pattern recognition.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: 'Active Sources',
            value: `${activeSources}/${INTEL_SOURCES.length}`,
            color: '#6b8f71',
          },
          { label: 'Fused Signals', value: activeSignals.length.toString(), color: PURPLE },
          {
            label: 'Critical Signals',
            value: criticalSignals.toString(),
            color: ACCENT,
            pulse: criticalSignals > 0,
          },
          { label: 'Total Alerts (24h)', value: totalAlerts.toString(), color: '#f59e0b' },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border p-4 text-center"
            style={{ borderColor: `${c.color}20`, background: `${c.color}06` }}
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="text-2xl font-bold font-mono" style={{ color: c.color }}>
                {c.value}
              </span>
              {(c as { pulse?: boolean }).pulse && (
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: c.color }}
                />
              )}
            </div>
            <div
              className="text-[9px] uppercase tracking-wider"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              {c.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          <div
            className="text-[10px] font-bold uppercase tracking-wider mb-3"
            style={{ color: DS.text.muted }}
          >
            Intelligence Sources
          </div>
          {INTEL_SOURCES.map((src) => (
            <SourceBadge key={src.id} source={src} />
          ))}
        </div>

        <div className="col-span-3 space-y-4">
          <div
            className="flex items-center gap-1 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            {[
              { id: 'fusion' as const, label: 'Fused Signals' },
              { id: 'geo' as const, label: 'Geopolitical Risk' },
              { id: 'ttp' as const, label: 'Adversary TTP Tracking' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="px-4 py-2 text-xs font-medium transition-colors"
                style={{
                  color: tab === t.id ? 'white' : 'rgba(255,255,255,0.4)',
                  borderBottom: tab === t.id ? `2px solid ${PURPLE}` : '2px solid transparent',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'fusion' && (
            <div className="space-y-3">
              {activeSignals.map((s) => (
                <SignalCard key={s.id} signal={s} />
              ))}
            </div>
          )}

          {tab === 'geo' && (
            <div className="space-y-3">
              <div
                className="rounded-xl border p-4"
                style={{ borderColor: DS.border, background: DS.surface }}
              >
                <div className="text-xs font-bold text-white mb-4">Geopolitical Risk Overlay</div>
                <div className="space-y-2">
                  {GEO_RISKS.map((r) => (
                    <GeoRiskRow key={r.region} risk={r} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'ttp' && (
            <div className="space-y-3">
              {TTP_TRACKS.map((actor) => (
                <div
                  key={actor.actor}
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: actor.active ? `${ACCENT}20` : DS.border,
                    background: actor.active ? `${ACCENT}04` : DS.surface,
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-bold text-white">{actor.actor}</div>
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded"
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            color: 'rgba(255,255,255,0.4)',
                          }}
                        >
                          {actor.alias}
                        </span>
                        {actor.active && (
                          <span
                            className="w-1.5 h-1.5 rounded-full animate-pulse"
                            style={{ background: ACCENT }}
                          />
                        )}
                      </div>
                      <div className="text-[9px] mt-0.5" style={{ color: DS.text.muted }}>
                        {actor.country} · Confidence: {actor.confidence}% · Last seen{' '}
                        {Math.round((Date.now() - actor.lastSeen) / 60000)}m ago
                      </div>
                    </div>
                    <span
                      className="text-[9px] px-2 py-1 rounded-full font-bold"
                      style={{
                        background: actor.active ? `${ACCENT}15` : 'rgba(255,255,255,0.04)',
                        color: actor.active ? ACCENT : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      {actor.active ? 'ACTIVE' : 'DORMANT'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {actor.ttps.map((t) => (
                      <span
                        key={t}
                        className="px-1.5 py-0.5 rounded text-[8px]"
                        style={{ background: `${ACCENT}12`, color: ACCENT }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div
                    className="flex items-center gap-2 text-[9px]"
                    style={{ color: DS.text.muted }}
                  >
                    <span>Targets:</span>
                    {actor.targetSectors.map((s) => (
                      <span
                        key={s}
                        className="px-1.5 py-0.5 rounded"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          color: 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
