import { seededRng } from './prng.js';

export type TlpLevel = 'WHITE' | 'GREEN' | 'AMBER' | 'RED';
export type IocType =
  | 'ipv4-addr'
  | 'domain-name'
  | 'file:hashes.MD5'
  | 'file:hashes.SHA-256'
  | 'url'
  | 'email-addr'
  | 'autonomous-system';
export type KillChainPhase =
  | 'reconnaissance'
  | 'weaponization'
  | 'delivery'
  | 'exploitation'
  | 'installation'
  | 'command-and-control'
  | 'actions-on-objectives';

export interface StixIoc {
  id: string;
  type: IocType;
  value: string;
  tlp: TlpLevel;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  sources: FeedSource[];
  tags: string[];
  killChainPhase: KillChainPhase;
  aptCampaign?: string;
  firstSeen: number;
  lastSeen: number;
  expiresAt?: number;
  mitreAttack: string[];
  description: string;
  relatedIocs: string[];
}

export interface AptCampaign {
  id: string;
  name: string;
  alias: string;
  actor: string;
  originCountry: string;
  motivation: 'espionage' | 'financial' | 'hacktivism' | 'sabotage';
  targetSectors: string[];
  activePhase: KillChainPhase;
  iocCount: number;
  confidence: number;
  tlp: TlpLevel;
  firstObserved: number;
  lastActivity: number;
  mitreAttack: string[];
  description: string;
}

export interface FeedSource {
  name: string;
  type: 'misp' | 'otx' | 'recorded_future' | 'greynoise' | 'abuse_ch' | 'internal';
  confidence: number;
  lastIngested: number;
  iocCount: number;
  staleness: 'fresh' | 'recent' | 'stale' | 'expired';
  ingestRatePerHour: number;
  status: 'active' | 'degraded' | 'offline';
}

export interface FeedHealthPanel {
  sources: FeedSource[];
  totalIocs: number;
  freshIocs: number;
  avgConfidence: number;
  lastFullRefresh: number;
}

const APT_CAMPAIGNS = [
  {
    name: 'Operation Darkwing',
    alias: 'APT29 / Cozy Bear',
    actor: 'APT29',
    originCountry: 'RU',
    motivation: 'espionage' as const,
    targetSectors: ['Finance', 'Government', 'Energy'],
    mitreAttack: [
      'T1566.001',
      'T1003.001',
      'T1021.002',
      'T1078',
      'T1071.001',
      'T1567.002',
      'T1105',
    ],
    description:
      'Sophisticated spear-phishing campaign targeting financial infrastructure. Uses SolarWinds-style supply chain TTPs.',
  },
  {
    name: 'Operation SilkRoad',
    alias: 'APT41 / Double Dragon',
    actor: 'APT41',
    originCountry: 'CN',
    motivation: 'espionage' as const,
    targetSectors: ['Technology', 'Healthcare', 'Defense'],
    mitreAttack: ['T1190', 'T1059.001', 'T1053.005', 'T1486', 'T1027', 'T1140'],
    description:
      'State-sponsored group targeting IP theft in semiconductor and pharmaceutical sectors.',
  },
  {
    name: 'Operation IronGate',
    alias: 'Sandworm / Voodoo Bear',
    actor: 'Sandworm',
    originCountry: 'RU',
    motivation: 'sabotage' as const,
    targetSectors: ['Energy', 'Industrial', 'Utilities'],
    mitreAttack: ['T1059.005', 'T1499', 'T1485', 'T1561.001', 'T1490'],
    description:
      'ICS/SCADA targeting campaign with history of power grid disruption in Eastern Europe.',
  },
  {
    name: 'Operation GhostNet',
    alias: 'Lazarus Group / Hidden Cobra',
    actor: 'Lazarus',
    originCountry: 'KP',
    motivation: 'financial' as const,
    targetSectors: ['Banking', 'Cryptocurrency', 'Defense'],
    mitreAttack: ['T1566', 'T1195', 'T1059.001', 'T1070.004', 'T1021.001', 'T1041'],
    description:
      'DPRK-attributed financially motivated APT targeting crypto exchanges and SWIFT banking network.',
  },
];

const FEED_SOURCES: Omit<
  FeedSource,
  'lastIngested' | 'iocCount' | 'staleness' | 'ingestRatePerHour' | 'status'
>[] = [
  { name: 'MISP Platform', type: 'misp', confidence: 88 },
  { name: 'AlienVault OTX', type: 'otx', confidence: 72 },
  { name: 'Recorded Future', type: 'recorded_future', confidence: 94 },
  { name: 'GreyNoise Intelligence', type: 'greynoise', confidence: 85 },
  { name: 'Abuse.ch URLhaus', type: 'abuse_ch', confidence: 78 },
  { name: 'Internal SOC', type: 'internal', confidence: 97 },
];

const IP_BLOCKS = ['185.234', '91.108', '203.0.113', '198.51.100', '45.33', '162.55', '194.165'];
const DOMAINS = [
  'update-service-win.com',
  'cdn-delivery-node.net',
  'secure-login-portal.org',
  'account-verification-api.com',
  'telemetry-beacon.io',
  'auth-service-proxy.net',
  'cloud-sync-agent.com',
  'mail-delivery-system.org',
  'ms-update-srv.com',
  'adobe-update-cdn.net',
  'vpn-gateway-secure.com',
  'antivirus-updater.net',
];
const SHA256_PREFIXES = ['a3f8c2', 'b7e4d1', '9c1a5f', '4d8b3e', 'f2c7a9', '1e6d4b', '8a2c5f'];
const MITRE_TECHNIQUES = [
  'T1566.001',
  'T1078',
  'T1021.002',
  'T1055',
  'T1486',
  'T1003.001',
  'T1071.001',
  'T1105',
  'T1059.001',
  'T1190',
  'T1027',
  'T1140',
  'T1548.002',
  'T1070.004',
  'T1053.005',
  'T1195',
  'T1499',
  'T1562.001',
];

function generateIpAddress(rng: ReturnType<typeof seededRng>): string {
  const block = rng.pick(IP_BLOCKS);
  return `${block}.${rng.int(1, 254)}.${rng.int(1, 254)}`;
}

function generateSha256(rng: ReturnType<typeof seededRng>): string {
  const prefix = rng.pick(SHA256_PREFIXES);
  const suffix = Array.from({ length: 58 }, () => '0123456789abcdef'[rng.int(0, 15)]).join('');
  return prefix + suffix;
}

export class ThreatFeedSimulator {
  private rng: ReturnType<typeof seededRng>;
  private seed: number;

  constructor(seed = 0xfeed1337) {
    this.seed = seed;
    this.rng = seededRng(seed);
  }

  reset() {
    this.rng = seededRng(this.seed);
  }

  generateFeedSources(nowMs = Date.now()): FeedSource[] {
    const rng = this.rng;
    return FEED_SOURCES.map((base) => {
      const hoursAgo = rng.range(0.1, 4);
      const isDegrade = rng.bool(0.15);
      return {
        ...base,
        lastIngested: nowMs - hoursAgo * 3_600_000,
        iocCount: rng.int(1200, 18000),
        staleness:
          hoursAgo < 1 ? 'fresh' : hoursAgo < 6 ? 'recent' : hoursAgo < 24 ? 'stale' : 'expired',
        ingestRatePerHour: rng.int(40, 800),
        status: isDegrade ? (rng.bool(0.3) ? 'offline' : 'degraded') : 'active',
      };
    });
  }

  generateAptCampaigns(nowMs = Date.now()): AptCampaign[] {
    const rng = this.rng;
    const killChainPhases: KillChainPhase[] = [
      'reconnaissance',
      'weaponization',
      'delivery',
      'exploitation',
      'installation',
      'command-and-control',
      'actions-on-objectives',
    ];

    return APT_CAMPAIGNS.map((c, i) => ({
      id: `campaign--${i.toString().padStart(4, '0')}-${c.actor.toLowerCase().replace(/\s/g, '-')}`,
      ...c,
      activePhase: rng.pick(killChainPhases),
      iocCount: rng.int(24, 148),
      confidence: c.motivation === 'espionage' ? rng.int(78, 97) : rng.int(65, 92),
      tlp: c.motivation === 'espionage' ? 'RED' : rng.pick(['AMBER', 'RED'] as TlpLevel[]),
      firstObserved: nowMs - rng.int(30, 365) * 86_400_000,
      lastActivity: nowMs - rng.int(0, 72) * 3_600_000,
    }));
  }

  generateIocs(count = 40, nowMs = Date.now()): StixIoc[] {
    const rng = this.rng;
    const campaigns = this.generateAptCampaigns(nowMs);
    const iocTypes: IocType[] = [
      'ipv4-addr',
      'domain-name',
      'file:hashes.SHA-256',
      'url',
      'email-addr',
      'autonomous-system',
    ];
    const killChainPhases: KillChainPhase[] = [
      'reconnaissance',
      'weaponization',
      'delivery',
      'exploitation',
      'installation',
      'command-and-control',
      'actions-on-objectives',
    ];

    const iocs: StixIoc[] = [];

    for (let i = 0; i < count; i++) {
      const iocType = rng.pick(iocTypes);
      const campaign = rng.bool(0.65) ? rng.pick(campaigns) : undefined;
      const confidence = campaign
        ? rng.int(campaign.confidence - 15, campaign.confidence + 5)
        : rng.int(40, 90);

      let value: string;
      switch (iocType) {
        case 'ipv4-addr':
          value = generateIpAddress(rng);
          break;
        case 'domain-name':
          value = rng.pick(DOMAINS);
          break;
        case 'file:hashes.SHA-256':
          value = generateSha256(rng);
          break;
        case 'url':
          value = `http://${rng.pick(DOMAINS)}/${rng.pick(['update', 'payload', 'exec', 'install'])}.exe`;
          break;
        case 'email-addr':
          value = `${rng.pick(['admin', 'noreply', 'security', 'support'])}@${rng.pick(DOMAINS)}`;
          break;
        case 'autonomous-system':
          value = `AS${rng.int(10000, 65535)}`;
          break;
        default:
          value = generateIpAddress(rng);
      }

      const severity: StixIoc['severity'] =
        confidence >= 90
          ? 'critical'
          : confidence >= 75
            ? 'high'
            : confidence >= 55
              ? 'medium'
              : 'low';

      const tlp: TlpLevel =
        severity === 'critical'
          ? 'RED'
          : severity === 'high'
            ? rng.pick(['AMBER', 'RED'] as TlpLevel[])
            : severity === 'medium'
              ? rng.pick(['GREEN', 'AMBER'] as TlpLevel[])
              : 'WHITE';

      const sourceCount = rng.int(1, 4);
      const allSources = this.generateFeedSources(nowMs);
      const sources = allSources
        .filter(() => rng.bool(0.5))
        .slice(0, sourceCount)
        .map((s) => ({ ...s, confidence: Math.min(100, s.confidence + rng.int(-10, 10)) }));

      const firstSeen = nowMs - rng.int(1, 90) * 86_400_000;
      const mitreCount = rng.int(1, 4);
      const mitreAttack = Array.from({ length: mitreCount }, () => rng.pick(MITRE_TECHNIQUES));

      iocs.push({
        id: `indicator--${i.toString().padStart(4, '0')}-${iocType.replace(/[:.]/g, '-').slice(0, 8)}`,
        type: iocType,
        value,
        tlp,
        confidence,
        severity,
        sources: sources.length > 0 ? sources : [allSources[0]!],
        tags: [
          campaign?.actor ?? 'unknown-actor',
          iocType.split(':')[0]!,
          severity,
          ...(campaign?.targetSectors.slice(0, 1) ?? []),
        ],
        killChainPhase: campaign ? campaign.activePhase : rng.pick(killChainPhases),
        ...(campaign?.name !== undefined ? { aptCampaign: campaign.name } : {}),
        firstSeen,
        lastSeen: firstSeen + rng.range(0, (nowMs - firstSeen) * 0.9),
        ...(rng.bool(0.4) ? { expiresAt: nowMs + rng.range(7, 90) * 86_400_000 } : {}),
        mitreAttack,
        description: campaign
          ? `IOC attributed to ${campaign.name} (${campaign.alias}). Linked to ${campaign.activePhase} phase activity targeting ${campaign.targetSectors.join(', ')}.`
          : `Suspicious ${iocType.replace(/[:.]/g, ' ')} observed in honeypot and threat intel cross-correlation.`,
        relatedIocs: [],
      });
    }

    return iocs;
  }

  generateFeedHealthPanel(nowMs = Date.now()): FeedHealthPanel {
    const sources = this.generateFeedSources(nowMs);
    const iocs = this.generateIocs(60, nowMs);
    const freshIocs = iocs.filter((i) => nowMs - i.lastSeen < 86_400_000).length;
    const avgConfidence = Math.round(iocs.reduce((s, i) => s + i.confidence, 0) / iocs.length);

    return {
      sources,
      totalIocs: sources.reduce((s, src) => s + src.iocCount, 0),
      freshIocs,
      avgConfidence,
      lastFullRefresh: nowMs - this.rng.range(0, 3_600_000),
    };
  }
}

export const defaultThreatFeedSimulator = new ThreatFeedSimulator(0xfeed1337);
