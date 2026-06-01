import {
  AlertTriangle,
  Target,
  Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';

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

interface ThreatActor {
  id: string;
  name: string;
  aliases: string[];
  type: 'state' | 'criminal' | 'hacktivist' | 'insider';
  origin: string;
  active: boolean;
  threatLevel: 'critical' | 'high' | 'medium' | 'low';
  capabilities: string[];
  targetSectors: string[];
  mitreTTPs: string[];
  attributionConfidence: number;
  lastActivity: string;
  incidents: number;
  intent: string;
  description: string;
}

const ACTORS: ThreatActor[] = [
  {
    id: 'TA-001',
    name: 'APT-41 (Double Dragon)',
    aliases: ['Winnti', 'Barium', 'Wicked Panda'],
    type: 'state',
    origin: 'China',
    active: true,
    threatLevel: 'critical',
    capabilities: [
      'Supply chain compromise',
      'Zero-day exploitation',
      'Ransomware deployment',
      'Firmware implants',
      'Living-off-the-land',
    ],
    targetSectors: [
      'Telecommunications',
      'Healthcare',
      'Maritime Logistics',
      'Technology',
      'Financial Services',
    ],
    mitreTTPs: ['T1195.002', 'T1190', 'T1486', 'T1542.001', 'T1218'],
    attributionConfidence: 92,
    lastActivity: '2024-03-15T12:00:00Z',
    incidents: 47,
    intent:
      'Dual espionage and financial gain. State-directed strategic intelligence collection combined with independent criminal operations for personal profit.',
    description:
      'China-nexus threat actor conducting state-sponsored espionage and financially motivated operations. Known for sophisticated supply chain attacks and exploitation of managed service providers. Currently observed targeting maritime logistics companies and critical infrastructure in Southeast Asia.',
  },
  {
    id: 'TA-002',
    name: 'Sandworm',
    aliases: ['Voodoo Bear', 'IRIDIUM', 'Electrum'],
    type: 'state',
    origin: 'Russia (GRU Unit 74455)',
    active: true,
    threatLevel: 'critical',
    capabilities: [
      'Critical infrastructure disruption',
      'Wiper malware',
      'SCADA/ICS exploitation',
      'Olympic Destroyer variants',
      'Supply chain attacks',
    ],
    targetSectors: ['Energy', 'Transportation', 'Government', 'Maritime', 'Telecommunications'],
    mitreTTPs: ['T1485', 'T1495', 'T1059.001', 'T1071.001', 'T1027'],
    attributionConfidence: 96,
    lastActivity: '2024-03-14T18:00:00Z',
    incidents: 31,
    intent:
      'Destructive operations aligned with Russian state interests. Primary focus on critical infrastructure disruption in adversary nations. Escalation catalyst in geopolitical conflicts.',
    description:
      'Russian military intelligence (GRU) threat actor responsible for the most destructive cyber attacks in history including NotPetya, Olympic Destroyer, and Ukraine power grid attacks. Currently assessed as maintaining persistent access to Western critical infrastructure for potential future activation.',
  },
  {
    id: 'TA-003',
    name: 'FIN7 / Carbanak',
    aliases: ['Carbon Spider', 'Sangria Tempest'],
    type: 'criminal',
    origin: 'Eastern Europe (Ukraine/Russia)',
    active: true,
    threatLevel: 'high',
    capabilities: [
      'Point-of-sale malware',
      'Business email compromise',
      'Ransomware-as-a-Service',
      'Social engineering',
      'Cloud exploitation',
    ],
    targetSectors: [
      'Hospitality',
      'Retail',
      'Financial Services',
      'Food & Beverage',
      'Maritime Insurance',
    ],
    mitreTTPs: ['T1566.001', 'T1059.001', 'T1204.002', 'T1574.002', 'T1560'],
    attributionConfidence: 88,
    lastActivity: '2024-03-13T09:00:00Z',
    incidents: 23,
    intent:
      'Purely financial motivation. Operates as a criminal enterprise with corporate-like structure. Expanding into maritime insurance fraud and shipping documentation forgery.',
    description:
      'Sophisticated cybercrime group operating as an organized criminal enterprise. Known for large-scale financial theft and point-of-sale malware campaigns. Recently observed expanding operations into maritime insurance and logistics sectors.',
  },
  {
    id: 'TA-004',
    name: 'Anonymous Sudan',
    aliases: ['Storm-1359'],
    type: 'hacktivist',
    origin: 'Unknown (claimed Sudan)',
    active: true,
    threatLevel: 'medium',
    capabilities: [
      'Layer 7 DDoS',
      'Web application attacks',
      'Social media coordination',
      'API abuse',
    ],
    targetSectors: ['Government', 'Healthcare', 'Technology', 'Transportation'],
    mitreTTPs: ['T1498.001', 'T1499.002', 'T1498.002'],
    attributionConfidence: 61,
    lastActivity: '2024-03-12T15:00:00Z',
    incidents: 12,
    intent:
      'Ideologically motivated disruption with possible state backing. Operations frequently aligned with Russian strategic interests despite claimed Sudanese origin.',
    description:
      'Hacktivist group conducting high-volume DDoS attacks against Western organizations. Attribution complicated by possible state sponsorship. Operations often timed to coincide with geopolitical events.',
  },
];

const typeColor = (t: string) =>
  t === 'state' ? RED : t === 'criminal' ? ACCENT : t === 'hacktivist' ? PURPLE : BLUE;
const sevColor = (s: string) =>
  s === 'critical' ? RED : s === 'high' ? ACCENT : s === 'medium' ? BLUE : GREEN;

export default function ThreatActorProfilingPage() {
  const [selectedId, setSelectedId] = useState(ACTORS[0].id);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const selected = useMemo(
    () => ACTORS.find((a) => a.id === selectedId) ?? ACTORS[0],
    [selectedId],
  );
  const filtered = typeFilter === 'all' ? ACTORS : ACTORS.filter((a) => a.type === typeFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white tracking-tight">
          Threat Actor Profiling & Attribution
        </h1>
        <p className="text-[11px] mt-1" style={{ color: DS.text.muted }}>
          AI-built profiles of state actors, criminal organizations, hacktivist groups, and insider
          threats with behavioral pattern analysis
        </p>
      </div>

      <div className="flex gap-2">
        {['all', 'state', 'criminal', 'hacktivist', 'insider'].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            aria-label={`Filter ${t} actors`}
            className="text-[9px] uppercase tracking-wider font-semibold rounded-lg px-3 py-1.5 transition"
            style={{
              background:
                typeFilter === t ? `${t === 'all' ? ACCENT : typeColor(t)}15` : 'transparent',
              color: typeFilter === t ? (t === 'all' ? ACCENT : typeColor(t)) : DS.text.muted,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4 space-y-2">
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedId(a.id)}
              aria-label={`Select actor ${a.name}`}
              className="w-full text-left rounded-xl p-4 transition"
              style={{
                background: selectedId === a.id ? 'rgba(255,255,255,0.04)' : DS.surface,
                border: `1px solid ${selectedId === a.id ? 'rgba(255,255,255,0.12)' : DS.border}`,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ background: a.active ? GREEN : DS.text.muted }}
                />
                <span
                  className="text-[8px] uppercase font-bold rounded px-1.5 py-0.5"
                  style={{ background: `${typeColor(a.type)}15`, color: typeColor(a.type) }}
                >
                  {a.type}
                </span>
                <span
                  className="text-[8px] uppercase font-bold rounded px-1.5 py-0.5"
                  style={{
                    background: `${sevColor(a.threatLevel)}15`,
                    color: sevColor(a.threatLevel),
                  }}
                >
                  {a.threatLevel}
                </span>
              </div>
              <p className="text-sm font-medium text-white">{a.name}</p>
              <p className="text-[9px]" style={{ color: DS.text.muted }}>
                {a.origin} · {a.incidents} incidents · {a.attributionConfidence}% attribution
              </p>
            </button>
          ))}
        </div>

        <div className="col-span-8 space-y-4">
          <div
            className="rounded-xl p-5"
            style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center"
                style={{ background: `${typeColor(selected.type)}15` }}
              >
                <Target className="h-5 w-5" style={{ color: typeColor(selected.type) }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{selected.name}</h2>
                <p className="text-[10px]" style={{ color: DS.text.muted }}>
                  AKA: {selected.aliases.join(', ')}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span
                  className="text-[9px] font-semibold rounded-full px-2.5 py-0.5"
                  style={{
                    background: `${sevColor(selected.threatLevel)}15`,
                    color: sevColor(selected.threatLevel),
                  }}
                >
                  {selected.threatLevel.toUpperCase()}
                </span>
                <span
                  className="text-[9px] font-semibold rounded-full px-2.5 py-0.5"
                  style={{
                    background: selected.active ? `${GREEN}15` : 'rgba(255,255,255,0.03)',
                    color: selected.active ? GREEN : DS.text.muted,
                  }}
                >
                  {selected.active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            </div>

            <p className="text-[11px] leading-relaxed mb-4" style={{ color: DS.text.secondary }}>
              {selected.description}
            </p>

            <div
              className="rounded-lg p-3 mb-4"
              style={{ background: `${RED}06`, borderLeft: `2px solid ${RED}` }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="h-3 w-3" style={{ color: RED }} />
                <span
                  className="text-[9px] uppercase tracking-wider font-semibold"
                  style={{ color: RED }}
                >
                  Assessed Intent
                </span>
              </div>
              <p className="text-[10px] leading-relaxed" style={{ color: DS.text.secondary }}>
                {selected.intent}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h4
                  className="text-[9px] uppercase tracking-wider font-semibold mb-2"
                  style={{ color: DS.text.muted }}
                >
                  Capabilities
                </h4>
                <div className="space-y-1">
                  {selected.capabilities.map((c) => (
                    <div key={c} className="flex items-center gap-2">
                      <Zap className="h-2.5 w-2.5 flex-shrink-0" style={{ color: ACCENT }} />
                      <span className="text-[10px]" style={{ color: DS.text.secondary }}>
                        {c}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4
                  className="text-[9px] uppercase tracking-wider font-semibold mb-2"
                  style={{ color: DS.text.muted }}
                >
                  Target Sectors
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selected.targetSectors.map((s) => (
                    <span
                      key={s}
                      className="text-[8px] px-2 py-0.5 rounded-full"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${DS.border}`,
                        color: DS.text.secondary,
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: 'Attribution Confidence',
                  value: `${selected.attributionConfidence}%`,
                  color: selected.attributionConfidence > 80 ? GREEN : ACCENT,
                },
                { label: 'Known Incidents', value: selected.incidents.toString(), color: BLUE },
                {
                  label: 'Last Activity',
                  value: new Date(selected.lastActivity).toLocaleDateString(),
                  color: DS.text.secondary,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg p-3 text-center"
                  style={{
                    background: 'rgba(255,255,255,0.015)',
                    border: `1px solid ${DS.border}`,
                  }}
                >
                  <p
                    className="text-[8px] uppercase tracking-wider mb-1"
                    style={{ color: DS.text.muted }}
                  >
                    {s.label}
                  </p>
                  <p className="text-lg font-semibold" style={{ color: s.color }}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-xl p-5"
            style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
          >
            <h3
              className="text-[10px] uppercase tracking-wider font-semibold mb-2"
              style={{ color: DS.text.muted }}
            >
              MITRE ATT&CK TTPs
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {selected.mitreTTPs.map((t) => (
                <span
                  key={t}
                  className="text-[9px] font-mono px-2 py-1 rounded"
                  style={{ background: `${RED}10`, color: RED, border: `1px solid ${RED}20` }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
