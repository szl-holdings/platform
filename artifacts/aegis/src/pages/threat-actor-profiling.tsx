import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import {
  ChevronRight,
  Radio,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const DS = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.06)',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    tertiary: 'rgba(255,255,255,0.28)',
    muted: 'rgba(255,255,255,0.14)',
  },
};

interface ThreatActor {
  id: string;
  name: string;
  alias: string[];
  origin: string;
  flag: string;
  type: string;
  sophistication: string;
  threatLevel: 'critical' | 'high' | 'medium';
  activeStatus: 'active' | 'elevated' | 'monitoring';
  lastSeen: string;
  targetSectors: string[];
  ttps: { tactic: string; technique: string; id: string }[];
  likelyTargets: string[];
  predictedNextMoves: string[];
  activityHistory: { month: string; incidents: number }[];
  capabilityScores: { subject: string; score: number }[];
  iocs: { type: string; value: string }[];
  summary: string;
  motivation: string;
}

const ACTORS: ThreatActor[] = [
  {
    id: 'apt29',
    name: 'APT29',
    alias: ['Cozy Bear', 'The Dukes', 'Midnight Blizzard', 'NOBELIUM'],
    origin: 'Russia',
    flag: '🇷🇺',
    type: 'Nation-State',
    sophistication: 'Advanced',
    threatLevel: 'critical',
    activeStatus: 'active',
    lastSeen: 'Apr 13, 2026',
    targetSectors: ['Government', 'Defense', 'Technology', 'Healthcare', 'Financial Services'],
    ttps: [
      { tactic: 'Initial Access', technique: 'Spearphishing Attachment', id: 'T1566.001' },
      { tactic: 'Initial Access', technique: 'Valid Accounts — Cloud', id: 'T1078.004' },
      { tactic: 'Execution', technique: 'PowerShell', id: 'T1059.001' },
      { tactic: 'Persistence', technique: 'OAuth Application Abuse', id: 'T1550.001' },
      { tactic: 'Lateral Movement', technique: 'Remote Services: SMB', id: 'T1021.002' },
      { tactic: 'Credential Access', technique: 'OS Credential Dumping: LSASS', id: 'T1003.001' },
      { tactic: 'Exfiltration', technique: 'Exfiltration Over C2', id: 'T1041' },
      { tactic: 'C2', technique: 'Web Protocols — HTTPS', id: 'T1071.001' },
    ],
    likelyTargets: [
      'Microsoft 365 admin tenants',
      'Active Directory environments',
      'VPN endpoints',
      'Diplomatic email accounts',
    ],
    predictedNextMoves: [
      'Expand OAuth token abuse against M365 tenants in financial sector',
      'Target think tanks and defense contractors with SolarWinds-style supply chain attack',
      'Increased focus on cloud identity providers post-Midnight Blizzard disclosures',
      'Use of AI-generated spearphishing to improve delivery rates across sectors',
    ],
    activityHistory: [
      { month: 'Oct', incidents: 4 },
      { month: 'Nov', incidents: 6 },
      { month: 'Dec', incidents: 3 },
      { month: 'Jan', incidents: 8 },
      { month: 'Feb', incidents: 11 },
      { month: 'Mar', incidents: 14 },
      { month: 'Apr', incidents: 9 },
    ],
    capabilityScores: [
      { subject: 'Stealth', score: 95 },
      { subject: 'Persistence', score: 92 },
      { subject: 'Exfiltration', score: 88 },
      { subject: 'C2 Infra', score: 90 },
      { subject: 'Initial Access', score: 87 },
      { subject: 'Lateral Mvmt', score: 84 },
    ],
    iocs: [
      { type: 'Domain', value: 'msupdate[.]cloud' },
      { type: 'Domain', value: 'office365-auth[.]net' },
      { type: 'IP', value: '185.220.101.47' },
      { type: 'Hash', value: 'a3f1b2c9d4e7...' },
    ],
    summary:
      "APT29, attributed to Russia's SVR foreign intelligence service, is one of the world's most sophisticated persistent threat actors. Known for long-dwell intrusions targeting government, defense, and technology organizations, they are responsible for the SolarWinds SUNBURST campaign (2020) and repeated attacks on Microsoft corporate infrastructure. They prioritize intelligence collection over destructive operations.",
    motivation:
      'Foreign intelligence collection for Russian SVR — political, diplomatic, and defense intelligence',
  },
  {
    id: 'lazarus',
    name: 'Lazarus Group',
    alias: ['HIDDEN COBRA', 'Guardians of Peace', 'Zinc', 'Diamond Sleet'],
    origin: 'North Korea',
    flag: '🇰🇵',
    type: 'Nation-State / Criminal',
    sophistication: 'Advanced',
    threatLevel: 'critical',
    activeStatus: 'elevated',
    lastSeen: 'Apr 11, 2026',
    targetSectors: ['Financial Services', 'Cryptocurrency', 'Defense', 'Manufacturing'],
    ttps: [
      { tactic: 'Initial Access', technique: 'Drive-by Compromise', id: 'T1189' },
      { tactic: 'Initial Access', technique: 'Supply Chain Compromise', id: 'T1195' },
      { tactic: 'Execution', technique: 'JavaScript Malware', id: 'T1059.007' },
      { tactic: 'Persistence', technique: 'Backdoor — AppleJeus', id: 'T1542' },
      { tactic: 'Collection', technique: 'Keylogging', id: 'T1056.001' },
      { tactic: 'Exfiltration', technique: 'Financial Wire Fraud', id: 'T1657' },
    ],
    likelyTargets: [
      'Cryptocurrency exchanges',
      'DeFi protocols',
      'SWIFT-connected banks',
      'Defense contractors',
    ],
    predictedNextMoves: [
      'Targeting Ethereum L2 bridge protocols for multi-hundred million theft',
      'Job-offer lures against crypto developers on LinkedIn and Discord',
      'Increased macOS malware deployment against Web3 engineering teams',
      'SWIFT messaging system attack against Southeast Asian banks',
    ],
    activityHistory: [
      { month: 'Oct', incidents: 2 },
      { month: 'Nov', incidents: 5 },
      { month: 'Dec', incidents: 7 },
      { month: 'Jan', incidents: 4 },
      { month: 'Feb', incidents: 9 },
      { month: 'Mar', incidents: 12 },
      { month: 'Apr', incidents: 8 },
    ],
    capabilityScores: [
      { subject: 'Stealth', score: 78 },
      { subject: 'Persistence', score: 82 },
      { subject: 'Exfiltration', score: 95 },
      { subject: 'C2 Infra', score: 74 },
      { subject: 'Initial Access', score: 88 },
      { subject: 'Lateral Mvmt', score: 71 },
    ],
    iocs: [
      { type: 'Domain', value: 'crypto-jobs[.]pro' },
      { type: 'Domain', value: 'defi-careers[.]io' },
      { type: 'IP', value: '210.52.109.22' },
      { type: 'Hash', value: 'c7d9e4a2b1f8...' },
    ],
    summary:
      "Lazarus Group, attributed to North Korea's Reconnaissance General Bureau, operates at the intersection of espionage and cybercrime. Responsible for the $1.5B Bybit exchange hack (2025), WannaCry ransomware, and Bangladesh Bank SWIFT heist, they are estimated to have stolen $3B+ in cryptocurrency. They use sophisticated social engineering and supply chain attacks.",
    motivation:
      'Revenue generation for North Korean regime — bypassing international sanctions via cryptocurrency theft',
  },
  {
    id: 'sandworm',
    name: 'Sandworm',
    alias: ['Voodoo Bear', 'IRIDIUM', 'Seashell Blizzard', 'Unit 74455'],
    origin: 'Russia',
    flag: '🇷🇺',
    type: 'Nation-State / Destructive',
    sophistication: 'Advanced',
    threatLevel: 'critical',
    activeStatus: 'monitoring',
    lastSeen: 'Mar 28, 2026',
    targetSectors: ['Energy / OT', 'Critical Infrastructure', 'Government', 'Telecommunications'],
    ttps: [
      { tactic: 'Initial Access', technique: 'Exploit Public Facing App', id: 'T1190' },
      { tactic: 'Execution', technique: 'Scheduled Task', id: 'T1053.005' },
      { tactic: 'Impact', technique: 'Disk Wipe — Industroyer', id: 'T1561' },
      { tactic: 'Impact', technique: 'Service Stop', id: 'T1489' },
      { tactic: 'ICS Attack', technique: 'Modify Control Logic', id: 'T0833' },
    ],
    likelyTargets: [
      'Power grid SCADA systems',
      'Water treatment facilities',
      'Ukrainian critical infrastructure',
      'NATO defense networks',
    ],
    predictedNextMoves: [
      'Pre-positioning in Western European energy grid OT networks',
      'Wiper malware deployment against NATO logistics systems if conflict escalates',
      'Targeting satellite communications providers supporting Ukraine',
      'Supply chain attack against industrial control system vendors',
    ],
    activityHistory: [
      { month: 'Oct', incidents: 1 },
      { month: 'Nov', incidents: 1 },
      { month: 'Dec', incidents: 3 },
      { month: 'Jan', incidents: 2 },
      { month: 'Feb', incidents: 2 },
      { month: 'Mar', incidents: 4 },
      { month: 'Apr', incidents: 1 },
    ],
    capabilityScores: [
      { subject: 'Stealth', score: 70 },
      { subject: 'Persistence', score: 80 },
      { subject: 'Exfiltration', score: 60 },
      { subject: 'C2 Infra', score: 85 },
      { subject: 'Initial Access', score: 78 },
      { subject: 'Lateral Mvmt', score: 88 },
    ],
    iocs: [
      { type: 'Domain', value: 'sch-update[.]com' },
      { type: 'IP', value: '94.158.244.59' },
      { type: 'Hash', value: 'f2e3d1c8a9b5...' },
    ],
    summary:
      "Sandworm, attributed to GRU Unit 74455, is the world's most destructive threat actor. Responsible for NotPetya ($10B+ global damage), Ukraine power grid blackouts (2015, 2016), and Olympic Destroyer. They specialize in destructive operations against critical infrastructure and have demonstrated OT/ICS attack capabilities targeting industrial control systems.",
    motivation:
      'Sabotage and destruction in support of Russian military operations — geo-political coercion',
  },
];

const THREAT_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#ef4444',
  elevated: '#f97316',
  monitoring: '#eab308',
};

export default function ThreatActorProfiling() {
  const [selected, setSelected] = useState<ThreatActor>(ACTORS[0]);
  const [tab, setTab] = useState<'overview' | 'ttps' | 'predictions' | 'iocs'>('overview');

  return (
    <div
      className="min-h-screen p-6 space-y-5"
      style={{ background: '#080B12', color: DS.text.primary }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: 'rgba(168,85,247,0.15)' }}
            >
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">Threat Actor Profiling</h1>
          </div>
          <p className="text-sm" style={{ color: DS.text.secondary }}>
            AI-generated intelligence dossiers — TTPs, targeting patterns, and predicted next moves
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)' }}
        >
          <Radio className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[10px] font-mono text-purple-400">
            {ACTORS.filter((a) => a.activeStatus === 'active').length} Active Threat Groups
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {/* Actor list */}
        <div className="space-y-2">
          <h2
            className="text-[10px] font-semibold uppercase tracking-wider mb-3"
            style={{ color: DS.text.tertiary }}
          >
            Tracked Threat Groups
          </h2>
          {ACTORS.map((actor) => (
            <button
              key={actor.id}
              onClick={() => {
                setSelected(actor);
                setTab('overview');
              }}
              className="w-full text-left rounded-xl p-4 transition-all"
              style={{
                background:
                  selected.id === actor.id ? `${THREAT_COLORS[actor.threatLevel]}08` : DS.surface,
                border: `1px solid ${selected.id === actor.id ? `${THREAT_COLORS[actor.threatLevel]}30` : DS.border}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{actor.flag}</span>
                <div>
                  <p className="text-xs font-bold">{actor.name}</p>
                  <p className="text-[9px]" style={{ color: DS.text.tertiary }}>
                    {actor.alias[0]}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge
                  className="text-[9px] px-1.5 py-0"
                  style={{
                    background: `${THREAT_COLORS[actor.threatLevel]}12`,
                    color: THREAT_COLORS[actor.threatLevel],
                    border: 'none',
                  }}
                >
                  {actor.threatLevel.toUpperCase()}
                </Badge>
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: STATUS_COLORS[actor.activeStatus] }}
                />
                <span className="text-[9px]" style={{ color: STATUS_COLORS[actor.activeStatus] }}>
                  {actor.activeStatus.charAt(0).toUpperCase() + actor.activeStatus.slice(1)}
                </span>
              </div>
              <p className="text-[10px] mt-1.5" style={{ color: DS.text.muted }}>
                Last seen: {actor.lastSeen}
              </p>
            </button>
          ))}
        </div>

        {/* Dossier */}
        <div className="col-span-3 space-y-4">
          {/* Actor header */}
          <div
            className="rounded-xl p-5"
            style={{
              background: DS.surface,
              border: `1px solid ${THREAT_COLORS[selected.threatLevel]}20`,
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selected.flag}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{selected.name}</h2>
                    <Badge
                      className="text-[9px] px-1.5 py-0"
                      style={{
                        background: `${THREAT_COLORS[selected.threatLevel]}12`,
                        color: THREAT_COLORS[selected.threatLevel],
                        border: `1px solid ${THREAT_COLORS[selected.threatLevel]}25`,
                      }}
                    >
                      {selected.threatLevel.toUpperCase()} THREAT
                    </Badge>
                    <div className="flex items-center gap-1">
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ background: STATUS_COLORS[selected.activeStatus] }}
                      />
                      <span
                        className="text-[10px] font-mono uppercase"
                        style={{ color: STATUS_COLORS[selected.activeStatus] }}
                      >
                        {selected.activeStatus}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {selected.alias.map((a) => (
                      <span
                        key={a}
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(255,255,255,0.05)', color: DS.text.tertiary }}
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium">{selected.type}</p>
                <p className="text-[10px]" style={{ color: DS.text.secondary }}>
                  {selected.origin} · {selected.sophistication}
                </p>
              </div>
            </div>
            <p className="text-xs leading-relaxed mb-4" style={{ color: DS.text.secondary }}>
              {selected.summary}
            </p>
            <div
              className="px-3 py-2 rounded-lg text-xs"
              style={{
                background: 'rgba(168,85,247,0.06)',
                border: '1px solid rgba(168,85,247,0.12)',
                color: '#c4b5fd',
              }}
            >
              <span className="font-semibold">Motivation: </span>
              {selected.motivation}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {(['overview', 'ttps', 'predictions', 'iocs'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all capitalize"
                style={{
                  background: tab === t ? 'rgba(168,85,247,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${tab === t ? 'rgba(168,85,247,0.3)' : DS.border}`,
                  color: tab === t ? '#c4b5fd' : DS.text.secondary,
                }}
              >
                {t === 'ttps'
                  ? 'TTPs'
                  : t === 'iocs'
                    ? 'IOCs'
                    : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="grid grid-cols-2 gap-4">
              {/* Capability radar */}
              <div
                className="rounded-xl p-4"
                style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
              >
                <h3
                  className="text-[10px] font-semibold uppercase tracking-wider mb-3"
                  style={{ color: DS.text.tertiary }}
                >
                  Capability Profile
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={selected.capabilityScores}>
                      <PolarGrid stroke="rgba(255,255,255,0.06)" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: DS.text.secondary, fontSize: 9 }}
                      />
                      <Radar
                        dataKey="score"
                        stroke={THREAT_COLORS[selected.threatLevel]}
                        fill={THREAT_COLORS[selected.threatLevel]}
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Activity + targets */}
              <div className="space-y-3">
                <div
                  className="rounded-xl p-4"
                  style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
                >
                  <h3
                    className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                    style={{ color: DS.text.tertiary }}
                  >
                    7-Month Activity
                  </h3>
                  <div className="h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selected.activityHistory}>
                        <defs>
                          <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop
                              offset="5%"
                              stopColor={THREAT_COLORS[selected.threatLevel]}
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor={THREAT_COLORS[selected.threatLevel]}
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="month"
                          tick={{ fill: DS.text.muted, fontSize: 9 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: DS.text.muted, fontSize: 9 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#0F1319',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 8,
                            fontSize: 11,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="incidents"
                          stroke={THREAT_COLORS[selected.threatLevel]}
                          fill="url(#actGrad)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div
                  className="rounded-xl p-4"
                  style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
                >
                  <h3
                    className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                    style={{ color: DS.text.tertiary }}
                  >
                    Target Sectors
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.targetSectors.map((s) => (
                      <span
                        key={s}
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          background: `${THREAT_COLORS[selected.threatLevel]}10`,
                          color: THREAT_COLORS[selected.threatLevel],
                          border: `1px solid ${THREAT_COLORS[selected.threatLevel]}20`,
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'ttps' && (
            <div
              className="rounded-xl p-5"
              style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
            >
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-4"
                style={{ color: DS.text.tertiary }}
              >
                MITRE ATT&CK Techniques
              </h3>
              <div className="space-y-2">
                {selected.ttps.map((ttp, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2.5 rounded-lg"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: `1px solid ${DS.border}`,
                    }}
                  >
                    <span
                      className="text-[9px] font-mono px-2 py-0.5 rounded"
                      style={{ background: 'rgba(168,85,247,0.12)', color: '#c4b5fd' }}
                    >
                      {ttp.id}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{ttp.technique}</p>
                    </div>
                    <span
                      className="text-[9px] px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: 'rgba(255,255,255,0.05)', color: DS.text.tertiary }}
                    >
                      {ttp.tactic}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'predictions' && (
            <div className="grid grid-cols-2 gap-4">
              <div
                className="rounded-xl p-5"
                style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-semibold text-purple-400">Predicted Next Moves</h3>
                </div>
                <div className="space-y-3">
                  {selected.predictedNextMoves.map((move, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span
                        className="text-[9px] font-mono w-4 shrink-0 mt-0.5"
                        style={{ color: '#8b5cf6' }}
                      >
                        {i + 1}.
                      </span>
                      <p
                        className="text-[11px] leading-relaxed"
                        style={{ color: DS.text.secondary }}
                      >
                        {move}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div
                className="rounded-xl p-5"
                style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-4 h-4 text-red-400" />
                  <h3 className="text-xs font-semibold text-red-400">Likely Target Profiles</h3>
                </div>
                <div className="space-y-2">
                  {selected.likelyTargets.map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded-lg"
                      style={{
                        background: 'rgba(239,68,68,0.05)',
                        border: '1px solid rgba(239,68,68,0.1)',
                      }}
                    >
                      <ChevronRight className="w-3 h-3 text-red-400/60 shrink-0" />
                      <p className="text-[11px]" style={{ color: DS.text.secondary }}>
                        {t}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'iocs' && (
            <div
              className="rounded-xl p-5"
              style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
            >
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-4"
                style={{ color: DS.text.tertiary }}
              >
                Indicators of Compromise
              </h3>
              <div className="space-y-2">
                {selected.iocs.map((ioc, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2.5 rounded-lg"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: `1px solid ${DS.border}`,
                    }}
                  >
                    <span
                      className="text-[9px] font-mono px-2 py-0.5 rounded w-16 text-center shrink-0"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}
                    >
                      {ioc.type}
                    </span>
                    <span className="text-xs font-mono" style={{ color: DS.text.secondary }}>
                      {ioc.value}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] mt-4" style={{ color: DS.text.muted }}>
                Full IOC list available via STIX/TAXII export — navigate to STIX/TAXII Intel for
                bulk integration with your SIEM.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
