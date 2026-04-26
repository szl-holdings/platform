import {
  Activity,
  AlertTriangle,
  Brain,
  Clock,
  Cpu,
  Crosshair,
  Database,
  Globe,
  Lock,
  Pause,
  Play,
  RadioTower,
  RotateCcw,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const ACCENT = '#f5f5f5';
const PHANTOM_ACCENT = '#8a8a8a';
const DS = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.06)',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    muted: 'rgba(255,255,255,0.25)',
  },
};

type AdversaryProfile =
  | 'nation-state-apt'
  | 'ransomware-gang'
  | 'insider-threat'
  | 'hacktivist'
  | 'cybercriminal';
type TargetVertical = 'financial' | 'healthcare' | 'critical-infra' | 'technology' | 'government';
type SophisticationLevel = 1 | 2 | 3 | 4 | 5;
type SimPhase = 'idle' | 'profiling' | 'generating' | 'running' | 'complete' | 'paused';
type KillChainStage = {
  id: string;
  label: string;
  mitre: string;
  color: string;
  description: string;
};

interface AttackStep {
  id: string;
  time: string;
  stage: string;
  mitre: string;
  tactic: string;
  technique: string;
  description: string;
  asset: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  detected: boolean;
  elapsed: number;
}

interface Campaign {
  name: string;
  actor: string;
  motivation: string;
  durationDays: number;
  blastRadius: number;
  steps: AttackStep[];
  ttps: string[];
  predictedImpact: string;
}

const ADVERSARY_PROFILES: Record<
  AdversaryProfile,
  { label: string; icon: typeof Globe; color: string; traits: string[] }
> = {
  'nation-state-apt': {
    label: 'Nation-State APT',
    icon: Globe,
    color: '#f5f5f5',
    traits: [
      'Long-dwell infiltration',
      'Supply chain compromise',
      'Zero-day exploits',
      'Strategic intelligence theft',
    ],
  },
  'ransomware-gang': {
    label: 'Ransomware Gang',
    icon: Lock,
    color: '#c9b787',
    traits: ['Double extortion', 'RaaS deployment', 'AD takeover', 'Backup destruction'],
  },
  'insider-threat': {
    label: 'Malicious Insider',
    icon: Users,
    color: '#c9b787',
    traits: [
      'Privileged access abuse',
      'Staged data theft',
      'Logic bomb planting',
      'Credential sharing',
    ],
  },
  hacktivist: {
    label: 'Hacktivist',
    icon: RadioTower,
    color: '#c9b787',
    traits: ['DDoS campaigns', 'Defacement', 'Data leaks', 'Disruptive attacks'],
  },
  cybercriminal: {
    label: 'Cybercriminal',
    icon: Database,
    color: '#8a8a8a',
    traits: ['BEC fraud', 'Credential theft', 'Cryptojacking', 'PII exfiltration'],
  },
};

const VERTICALS: Record<TargetVertical, { label: string; assets: string[] }> = {
  financial: {
    label: 'Financial Services',
    assets: [
      'Core Banking System',
      'SWIFT Gateway',
      'Trading Platform',
      'Customer PII DB',
      'Auth Infrastructure',
    ],
  },
  healthcare: {
    label: 'Healthcare',
    assets: ['EHR System', 'PACS Server', 'Pharmacy DB', 'Patient Portal', 'Medical Devices'],
  },
  'critical-infra': {
    label: 'Critical Infrastructure',
    assets: [
      'SCADA/ICS',
      'OT Network',
      'HMI Terminals',
      'Engineering Workstations',
      'Historian DB',
    ],
  },
  technology: {
    label: 'Technology',
    assets: [
      'Source Code Repo',
      'CI/CD Pipeline',
      'Customer Data Lake',
      'Auth Services',
      'Cloud Infrastructure',
    ],
  },
  government: {
    label: 'Government',
    assets: [
      'Classified Systems',
      'HR Database',
      'Comms Infrastructure',
      'Physical Access Control',
      'VPN Gateway',
    ],
  },
};

const CAMPAIGN_TEMPLATES: Record<AdversaryProfile, Partial<Campaign>> = {
  'nation-state-apt': {
    name: 'Operation Shadow Lattice',
    actor: 'APT29 (Cozy Bear)',
    motivation:
      'Strategic intelligence collection — long-term dwell for persistent access to decision-making data',
    durationDays: 127,
    blastRadius: 94,
    ttps: [
      'T1566.001',
      'T1059.001',
      'T1078.004',
      'T1021.002',
      'T1550.002',
      'T1003.001',
      'T1567.002',
      'T1573',
    ],
    predictedImpact:
      '$47.2M — classified data exfiltration, potential nation-state intelligence advantage, regulatory exposure under FISMA/GDPR',
  },
  'ransomware-gang': {
    name: 'Operation Black Frost',
    actor: 'BlackCat / ALPHV',
    motivation:
      'Financial extortion via double ransomware — encrypt + threaten public data release',
    durationDays: 14,
    blastRadius: 87,
    ttps: ['T1190', 'T1059.003', 'T1547', 'T1021.002', 'T1486', 'T1490', 'T1485', 'T1657'],
    predictedImpact:
      '$22.8M — 14-day operational shutdown, $4.2M ransom demand, regulatory breach notifications to 140K customers',
  },
  'insider-threat': {
    name: 'Operation Quiet Exodus',
    actor: 'Privileged Insider (Finance Dept.)',
    motivation: 'Competitor intelligence sale — premeditated data theft before resignation',
    durationDays: 89,
    blastRadius: 61,
    ttps: ['T1078', 'T1074.001', 'T1052.001', 'T1048.003', 'T1560.001', 'T1005'],
    predictedImpact:
      '$8.4M — IP theft, competitive intelligence loss, potential SEC disclosure, insider trading liability',
  },
  hacktivist: {
    name: 'Operation Digital Storm',
    actor: 'Anonymous-affiliated collective',
    motivation: 'Political protest — maximum disruption and reputational damage',
    durationDays: 7,
    blastRadius: 42,
    ttps: ['T1498.001', 'T1499', 'T1189', 'T1491.002', 'T1530'],
    predictedImpact:
      '$3.1M — 72-hour service outage, website defacement, 2.1GB customer data leaked on dark web',
  },
  cybercriminal: {
    name: 'Operation Phantom Harvest',
    actor: 'FIN7 Criminal Syndicate',
    motivation: 'Financial fraud — PII/payment data monetization via dark web sales',
    durationDays: 31,
    blastRadius: 68,
    ttps: ['T1566.002', 'T1059.007', 'T1055.001', 'T1003.001', 'T1041', 'T1657'],
    predictedImpact:
      '$14.7M — 847K payment records exfiltrated, PCI DSS violations, class action liability, brand damage',
  },
};

// ─── TTP Library: pools of techniques per stage per adversary profile ─────────
// Each stage has multiple options; the generator selects based on inputs.
const TTP_LIBRARY: Record<
  AdversaryProfile,
  Array<{
    stage: string;
    tactic: string;
    weight: number;
    pool: Array<{
      mitre: string;
      technique: string;
      descTemplate: string;
      severity: AttackStep['severity'];
    }>;
  }>
> = {
  'nation-state-apt': [
    {
      stage: 'Reconnaissance',
      tactic: 'Reconnaissance',
      weight: 1,
      pool: [
        {
          mitre: 'T1598.003',
          technique: 'Spearphishing for Info',
          descTemplate:
            'OSINT targeting: LinkedIn enumeration of {asset0} staff and passive DNS domain mapping over {dwell} days',
          severity: 'medium',
        },
        {
          mitre: 'T1597.001',
          technique: 'Purchased Threat Intel',
          descTemplate:
            'Procured active employee credentials from dark-web broker targeting {vertical} sector staff with {asset0} access',
          severity: 'medium',
        },
        {
          mitre: 'T1595.002',
          technique: 'Vulnerability Scanning',
          descTemplate:
            'Low-and-slow Shodan + Censys scan of {asset4} infrastructure to enumerate exposed services and software versions',
          severity: 'low',
        },
      ],
    },
    {
      stage: 'Initial Access',
      tactic: 'Initial Access',
      weight: 1,
      pool: [
        {
          mitre: 'T1566.001',
          technique: 'Spearphishing Attachment',
          descTemplate:
            'Weaponized document delivered to 3 {asset0} executives — zero-day exploit triggers stage-1 implant download',
          severity: 'critical',
        },
        {
          mitre: 'T1195.002',
          technique: 'Compromise Software Supply Chain',
          descTemplate:
            'Trojanized {vertical}-sector software update pushed via compromised vendor build pipeline — 14 systems implanted silently',
          severity: 'critical',
        },
        {
          mitre: 'T1078.004',
          technique: 'Cloud Account Takeover',
          descTemplate:
            "Credential-stuffed {asset4} login using harvested credentials — MFA bypassed via SIM-swap on target's mobile carrier",
          severity: 'critical',
        },
      ],
    },
    {
      stage: 'Execution',
      tactic: 'Execution',
      weight: 1,
      pool: [
        {
          mitre: 'T1059.001',
          technique: 'PowerShell',
          descTemplate:
            'Obfuscated PowerShell dropper downloads encrypted stage-2 payload from CDN staging node — AMSI bypass applied',
          severity: 'critical',
        },
        {
          mitre: 'T1053.005',
          technique: 'Scheduled Task',
          descTemplate:
            'SYSTEM-level scheduled task created to launch implant at logon — disguised as Windows Update helper process',
          severity: 'high',
        },
      ],
    },
    {
      stage: 'Persistence',
      tactic: 'Persistence',
      weight: 1,
      pool: [
        {
          mitre: 'T1547.001',
          technique: 'Registry Run Keys',
          descTemplate:
            'HKCU Run key + scheduled task combination — implant survives reboot and password reset on target workstation',
          severity: 'high',
        },
        {
          mitre: 'T1098.001',
          technique: 'Additional Cloud Credentials',
          descTemplate:
            'Rogue OAuth app registered in {asset4} tenant with Mail.Read + Files.ReadWrite permissions — persistent silent access',
          severity: 'high',
        },
      ],
    },
    {
      stage: 'Credential Access',
      tactic: 'Credential Access',
      weight: 1,
      pool: [
        {
          mitre: 'T1003.001',
          technique: 'LSASS Memory Dump',
          descTemplate:
            'Mimikatz variant extracts NTLM hashes from LSASS on {asset1} — 4 admin credentials recovered including domain admin',
          severity: 'critical',
        },
        {
          mitre: 'T1558.003',
          technique: 'Kerberoasting',
          descTemplate:
            '8 service account SPNs enumerated from AD — TGS tickets requested and cracked offline, 3 privileged accounts compromised',
          severity: 'critical',
        },
      ],
    },
    {
      stage: 'Lateral Movement',
      tactic: 'Lateral Movement',
      weight: 1,
      pool: [
        {
          mitre: 'T1550.002',
          technique: 'Pass-the-Hash',
          descTemplate:
            'Stolen domain admin NTLM hash used for PtH — pivots to {asset1} and {asset2}, accessing {sophCount} high-value servers',
          severity: 'critical',
        },
        {
          mitre: 'T1021.002',
          technique: 'SMB/Windows Admin Shares',
          descTemplate:
            'ADMIN$ share traversal using domain admin credentials — lateral spread to all domain-joined {vertical} systems',
          severity: 'critical',
        },
      ],
    },
    {
      stage: 'Collection',
      tactic: 'Collection',
      weight: 1,
      pool: [
        {
          mitre: 'T1005',
          technique: 'Data from Local System',
          descTemplate:
            'Systematic sweep of {asset2}: intellectual property, strategic plans, M&A documents — {sophCount}GB staged in encrypted container',
          severity: 'high',
        },
        {
          mitre: 'T1114.002',
          technique: 'Remote Email Collection',
          descTemplate:
            'Exchange Web Services API harvests 3 years of board and C-suite email — {sophCount}K messages exported silently',
          severity: 'high',
        },
      ],
    },
    {
      stage: 'Exfiltration',
      tactic: 'Exfiltration',
      weight: 1,
      pool: [
        {
          mitre: 'T1567.002',
          technique: 'Exfiltration to Cloud Storage',
          descTemplate:
            '47.3GB encrypted archive exfiltrated via legitimate OneDrive sync — mirrors normal {vertical} data-sync traffic pattern',
          severity: 'critical',
        },
        {
          mitre: 'T1048.001',
          technique: 'DNS Exfiltration',
          descTemplate:
            'Data chunked into DNS TXT record queries — {sophCount}GB exfiltrated via authoritative DNS server under attacker control',
          severity: 'critical',
        },
      ],
    },
  ],
  'ransomware-gang': [
    {
      stage: 'Initial Access',
      tactic: 'Initial Access',
      weight: 1,
      pool: [
        {
          mitre: 'T1190',
          technique: 'Exploit Public-Facing Application',
          descTemplate:
            'Critical CVE on exposed {asset4} service — unauthenticated RCE, immediate reverse shell via HTTPS beacon',
          severity: 'critical',
        },
        {
          mitre: 'T1566.001',
          technique: 'Phishing — Initial Vector',
          descTemplate:
            'Mass phishing campaign targeting {vertical} sector — malicious macro in HR document, 1-in-40 click rate, sufficient for initial foothold',
          severity: 'critical',
        },
      ],
    },
    {
      stage: 'Execution',
      tactic: 'Execution',
      weight: 1,
      pool: [
        {
          mitre: 'T1059.003',
          technique: 'Windows Command Shell',
          descTemplate:
            'Cobalt Strike beacon deployed via cmd.exe — C2 traffic tunneled over HTTPS to {sophCount} fallback domains',
          severity: 'critical',
        },
        {
          mitre: 'T1059.001',
          technique: 'PowerShell Payload Delivery',
          descTemplate:
            'Reflective DLL injection via PowerShell — stageless payload evades AV, establishes encrypted C2 channel',
          severity: 'critical',
        },
      ],
    },
    {
      stage: 'Privilege Escalation',
      tactic: 'Privilege Escalation',
      weight: 1,
      pool: [
        {
          mitre: 'T1078.004',
          technique: 'Kerberoast for Domain Admin',
          descTemplate:
            'Kerberoasting yields {sophCount} cracked service accounts — domain admin obtained without touching LSASS',
          severity: 'critical',
        },
        {
          mitre: 'T1548.002',
          technique: 'UAC Bypass',
          descTemplate:
            'fodhelper.exe UAC bypass elevates privileges to SYSTEM on initial foothold — no alert triggered',
          severity: 'high',
        },
      ],
    },
    {
      stage: 'Defense Evasion',
      tactic: 'Defense Evasion',
      weight: 1,
      pool: [
        {
          mitre: 'T1562.001',
          technique: 'Disable Security Tools',
          descTemplate:
            'EDR agent killed on {sophCount} endpoints via driver vulnerability — Windows Defender disabled via Group Policy push',
          severity: 'critical',
        },
        {
          mitre: 'T1070.001',
          technique: 'Clear Windows Event Logs',
          descTemplate:
            'Event log wipe across all domain controllers and {sophCount} member servers — forensic trail destroyed pre-encryption',
          severity: 'high',
        },
      ],
    },
    {
      stage: 'Impact — Destroy',
      tactic: 'Impact',
      weight: 1,
      pool: [
        {
          mitre: 'T1490',
          technique: 'Inhibit System Recovery',
          descTemplate:
            'Shadow copies deleted across all {sophCount} servers — vssadmin, wmic, and PowerShell methods used in parallel for speed',
          severity: 'critical',
        },
      ],
    },
    {
      stage: 'Impact — Encrypt',
      tactic: 'Impact',
      weight: 1,
      pool: [
        {
          mitre: 'T1486',
          technique: 'Data Encrypted for Impact',
          descTemplate:
            'Ransomware deployed via scheduled task — AES-256 + RSA-4096 encryption of {sophCount}TB across {asset0} and {asset1} in under 5 hours',
          severity: 'critical',
        },
      ],
    },
  ],
  'insider-threat': [
    {
      stage: 'Reconnaissance',
      tactic: 'Initial Access',
      weight: 1,
      pool: [
        {
          mitre: 'T1078',
          technique: 'Valid Accounts (Off-Hours)',
          descTemplate:
            'Legitimate credentials used at 18:32 outside shift — first after-hours {asset0} access in 4 months, no prior anomaly flagged',
          severity: 'medium',
        },
        {
          mitre: 'T1087.001',
          technique: 'Account Discovery',
          descTemplate:
            'AD user enumeration run via PowerShell — identifies users with {asset1} access to map targets for lateral data harvest',
          severity: 'medium',
        },
      ],
    },
    {
      stage: 'Collection',
      tactic: 'Collection',
      weight: 1,
      pool: [
        {
          mitre: 'T1074.001',
          technique: 'Local Data Staging',
          descTemplate:
            '{sophCount} confidential files from {asset2} staged to personal OneDrive — IP, financial projections, customer contracts targeted',
          severity: 'high',
        },
        {
          mitre: 'T1005',
          technique: 'Sensitive Data Harvest',
          descTemplate:
            'Screen-recording tool captures {asset0} credentials and document content over {dwell}-day window — zero DLP alerts due to local tool',
          severity: 'high',
        },
      ],
    },
    {
      stage: 'Exfiltration',
      tactic: 'Exfiltration',
      weight: 1,
      pool: [
        {
          mitre: 'T1048.003',
          technique: 'Exfil via Unencrypted Channel',
          descTemplate:
            '12.4GB transferred via personal {vertical}-unmonitored cloud service — DLP bypass using mislabeled archive files',
          severity: 'critical',
        },
        {
          mitre: 'T1052.001',
          technique: 'Exfil via USB Device',
          descTemplate:
            'Unregistered USB drive copies {sophCount}GB of {asset2} data — endpoint DLP inactive on legacy {vertical} system',
          severity: 'critical',
        },
      ],
    },
    {
      stage: 'Persistence',
      tactic: 'Persistence',
      weight: 1,
      pool: [
        {
          mitre: 'T1136.001',
          technique: 'Create Local Account',
          descTemplate:
            "Backdoor admin 'svc_helpdesk99' created in AD — provides persistent access intended for post-resignation use",
          severity: 'critical',
        },
      ],
    },
  ],
  hacktivist: [
    {
      stage: 'Reconnaissance',
      tactic: 'Reconnaissance',
      weight: 1,
      pool: [
        {
          mitre: 'T1595.001',
          technique: 'Scanning IP Blocks',
          descTemplate:
            'Mass port scan of {asset4} — web servers, admin panels, and API endpoints identified as attack surface',
          severity: 'medium',
        },
      ],
    },
    {
      stage: 'Initial Access',
      tactic: 'Initial Access',
      weight: 1,
      pool: [
        {
          mitre: 'T1189',
          technique: 'Drive-by Compromise (SQLi)',
          descTemplate:
            'SQL injection on {asset4} portal — auth bypass grants {sophCount}GB customer data extraction in 23 minutes',
          severity: 'critical',
        },
        {
          mitre: 'T1078.003',
          technique: 'Local Account Compromise',
          descTemplate:
            'Credential from prior {vertical} breach reused — admin panel accessed, content management system compromised',
          severity: 'critical',
        },
      ],
    },
    {
      stage: 'Impact — DDoS',
      tactic: 'Impact',
      weight: 1,
      pool: [
        {
          mitre: 'T1498.001',
          technique: 'Direct Network Flood',
          descTemplate:
            '400Gbps UDP flood via {sophCount}-node botnet — {asset4} and {asset0} down for 71 hours, $1.8M transaction loss',
          severity: 'critical',
        },
      ],
    },
    {
      stage: 'Impact — Defacement',
      tactic: 'Impact',
      weight: 1,
      pool: [
        {
          mitre: 'T1491.001',
          technique: 'Internal Defacement',
          descTemplate:
            'Homepage replaced with political manifesto on {sophCount} {vertical} regional sites — persisted {dwell} hours before recovery',
          severity: 'high',
        },
      ],
    },
    {
      stage: 'Exfiltration',
      tactic: 'Exfiltration',
      weight: 1,
      pool: [
        {
          mitre: 'T1530',
          technique: 'Data from Cloud Storage',
          descTemplate:
            '2.1GB customer records exfiltrated from misconfigured {asset3} bucket — posted publicly on activist forum',
          severity: 'critical',
        },
      ],
    },
  ],
  cybercriminal: [
    {
      stage: 'Initial Access',
      tactic: 'Initial Access',
      weight: 1,
      pool: [
        {
          mitre: 'T1566.002',
          technique: 'Spearphishing Link (BEC)',
          descTemplate:
            'BEC phishing targets {vertical} AP department — fake CFO wire-transfer email with credential harvesting link',
          severity: 'high',
        },
        {
          mitre: 'T1190',
          technique: 'Web App Exploit',
          descTemplate:
            'Known CVE exploited on public-facing {asset4} — unauthenticated access to payment processing backend',
          severity: 'critical',
        },
      ],
    },
    {
      stage: 'Execution',
      tactic: 'Execution',
      weight: 1,
      pool: [
        {
          mitre: 'T1059.007',
          technique: 'JavaScript Browser Implant',
          descTemplate:
            'Skimmer injected into {asset0} checkout page — keylogger captures card data for {sophCount}K transactions silently',
          severity: 'critical',
        },
      ],
    },
    {
      stage: 'Collection',
      tactic: 'Collection',
      weight: 1,
      pool: [
        {
          mitre: 'T1005',
          technique: 'Payment Card Harvest',
          descTemplate:
            '{asset0} queried via injected SQL — {sophCount}K card records harvested over 6 hours, rate-limited to avoid threshold alerts',
          severity: 'critical',
        },
      ],
    },
    {
      stage: 'Exfiltration',
      tactic: 'Exfiltration',
      weight: 1,
      pool: [
        {
          mitre: 'T1041',
          technique: 'Exfil Over C2 Channel',
          descTemplate:
            'Encrypted archive exfiltrated via HTTPS POST to Cloudflare-fronted C2 — {sophCount}GB in {sophCount2} chunks avoiding size anomaly detection',
          severity: 'critical',
        },
        {
          mitre: 'T1048.002',
          technique: 'Exfil Over SMTP',
          descTemplate:
            'Card data base64-encoded into outbound email attachments — {sophCount}K records per message to external relay',
          severity: 'critical',
        },
      ],
    },
  ],
};

/** Deterministic-ish seeded hash from input string */
function inputHash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Fill description template with vertical-specific asset names and sophistication-driven values */
function fillDesc(
  template: string,
  assets: string[],
  sophication: number,
  dwellDays: number,
): string {
  const sophCount = Math.round(10 + sophication * 8).toString();
  const sophCount2 = Math.round(20 + sophication * 9).toString();
  return template
    .replace('{asset0}', assets[0] ?? 'Primary System')
    .replace('{asset1}', assets[1] ?? 'Secondary System')
    .replace('{asset2}', assets[2] ?? 'Data Store')
    .replace('{asset3}', assets[3] ?? 'Cloud Service')
    .replace('{asset4}', assets[4] ?? 'Web Infrastructure')
    .replace('{vertical}', 'sector')
    .replace('{sophCount}', sophCount)
    .replace('{sophCount2}', sophCount2)
    .replace('{dwell}', dwellDays.toString());
}

/** Format elapsed seconds into D+N HH:MM string */
function fmtTime(elapsedSecs: number): string {
  const days = Math.floor(elapsedSecs / 86400);
  const hh = Math.floor((elapsedSecs % 86400) / 3600);
  const mm = Math.floor((elapsedSecs % 3600) / 60);
  return `D+${days} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/**
 * Dynamic multi-stage attack path generator.
 * Selects TTPs from per-profile pools based on adversary profile, target vertical,
 * sophistication level, and motivation text — each unique combination produces a
 * distinct attack graph with varying techniques, timing, and asset targeting.
 */
function generateSteps(
  profile: AdversaryProfile,
  vertical: TargetVertical,
  sophistication: SophisticationLevel,
  motivation: string,
): AttackStep[] {
  const assets = VERTICALS[vertical].assets;
  const stages = TTP_LIBRARY[profile];
  const seed = inputHash(`${profile}:${vertical}:${sophistication}:${motivation.slice(0, 32)}`);

  // Dwell time: nation-state APTs linger; ransomware gangs move fast
  const baseDwellDays: Record<AdversaryProfile, number> = {
    'nation-state-apt': 45 + sophistication * 15,
    'ransomware-gang': 2 + sophistication,
    'insider-threat': 30 + sophistication * 10,
    hacktivist: 1 + sophistication,
    cybercriminal: 3 + sophistication * 2,
  };
  const dwellDays = baseDwellDays[profile];

  // Detection probability: higher sophistication = fewer detections
  const detectionProb = Math.max(0.05, 0.55 - sophistication * 0.08);

  let totalElapsed = 0;
  const steps: AttackStep[] = [];

  stages.forEach((stageDef, stageIdx) => {
    // Select TTP from pool using seeded selection
    const ttpIdx = (seed + stageIdx * 7 + stageIdx) % stageDef.pool.length;
    const ttp = stageDef.pool[ttpIdx];

    // Compute timing: steps spread across dwell window proportionally
    const stageFraction = stageIdx / Math.max(stages.length - 1, 1);
    const targetElapsed = Math.round(stageFraction * dwellDays * 86400);
    const jitter = (seed >> (stageIdx % 8)) % 3600;
    totalElapsed = Math.max(totalElapsed + 3600, targetElapsed + jitter);

    // Detection varies: later stages are more likely to be detected at higher sophistication
    const detectionRoll = ((seed * (stageIdx + 1) * 1327) % 100) / 100;
    const stageDetectionBias =
      stageDef.stage.includes('Impact') || stageDef.stage.includes('Exfil') ? 0.15 : 0;
    const detected = detectionRoll < detectionProb + stageDetectionBias;

    const desc = fillDesc(ttp.descTemplate, assets, sophistication, dwellDays);

    steps.push({
      id: `s${stageIdx + 1}`,
      time: fmtTime(stageIdx === 0 ? 0 : totalElapsed),
      stage: stageDef.stage,
      mitre: ttp.mitre,
      tactic: stageDef.tactic,
      technique: ttp.technique,
      description: desc,
      asset: assets[stageIdx % assets.length] ?? stageDef.stage,
      severity: ttp.severity,
      detected,
      elapsed: stageIdx === 0 ? 0 : totalElapsed,
    });
  });

  return steps;
}

const KILL_CHAIN_STAGES = [
  { id: 'recon', label: 'Recon', color: '#6b7280' },
  { id: 'initial-access', label: 'Access', color: '#8a8a8a' },
  { id: 'execution', label: 'Exec', color: '#c9b787' },
  { id: 'persistence', label: 'Persist', color: '#8a8a8a' },
  { id: 'escalation', label: 'Priv Esc', color: '#c9b787' },
  { id: 'lateral', label: 'Lateral', color: '#c9b787' },
  { id: 'collection', label: 'Collect', color: '#f5f5f5' },
  { id: 'exfil-impact', label: 'Impact', color: '#f5f5f5' },
];

const STAGE_TO_CHAIN: Record<string, string> = {
  Recon: 'recon',
  Reconnaissance: 'recon',
  'Initial Access': 'initial-access',
  Execution: 'execution',
  Persistence: 'persistence',
  'Privilege Escalation': 'escalation',
  'Credential Access': 'escalation',
  'Defense Evasion': 'lateral',
  'Lateral Movement': 'lateral',
  Collection: 'collection',
  Exfiltration: 'exfil-impact',
  'Impact — Destroy': 'exfil-impact',
  'Impact — Encrypt': 'exfil-impact',
  'Impact — DDoS': 'exfil-impact',
  'Impact — Defacement': 'exfil-impact',
};

export default function PhantomWarRoom() {
  const [profile, setProfile] = useState<AdversaryProfile>('nation-state-apt');
  const [vertical, setVertical] = useState<TargetVertical>('financial');
  const [sophistication, setSophistication] = useState<SophisticationLevel>(4);
  const [motivation, setMotivation] = useState('');
  const [phase, setPhase] = useState<SimPhase>('idle');
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [simClock, setSimClock] = useState(0);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopSim = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (clockRef.current) clearInterval(clockRef.current);
  }, []);

  useEffect(() => () => stopSim(), [stopSim]);

  function startGeneration() {
    setPhase('profiling');
    setTimeout(() => {
      setPhase('generating');
      setTimeout(() => {
        const template = CAMPAIGN_TEMPLATES[profile];
        const steps = generateSteps(profile, vertical, sophistication, motivation);
        const derivedMotivation = motivation.trim()
          ? motivation.trim()
          : (template.motivation ?? '');
        const derivedTtps = [...new Set([...steps.map((s) => s.mitre), ...(template.ttps ?? [])])];
        const gen: Campaign = {
          name: template.name!,
          actor: template.actor!,
          motivation: derivedMotivation,
          durationDays: template.durationDays!,
          blastRadius: Math.min(100, (template.blastRadius ?? 70) + (sophistication - 3) * 6),
          steps,
          ttps: derivedTtps,
          predictedImpact: template.predictedImpact!,
        };
        setCampaign(gen);
        setCurrentStepIdx(-1);
        setSimClock(0);
        setPhase('running');
        runSimulation(gen, steps);
      }, 1400);
    }, 1000);
  }

  function runSimulation(_gen: Campaign, steps: AttackStep[]) {
    let idx = -1;
    clockRef.current = setInterval(() => setSimClock((c) => c + 1), 200);
    intervalRef.current = setInterval(() => {
      idx += 1;
      if (idx >= steps.length) {
        stopSim();
        setPhase('complete');
        setCurrentStepIdx(steps.length - 1);
        return;
      }
      setCurrentStepIdx(idx);
      setActiveStepId(steps[idx].id);
    }, 1800);
  }

  function pauseResume() {
    if (phase === 'running') {
      stopSim();
      setPhase('paused');
    } else if (phase === 'paused' && campaign) {
      const _remaining = campaign.steps.slice(currentStepIdx + 1);
      setPhase('running');
      clockRef.current = setInterval(() => setSimClock((c) => c + 1), 200);
      let idx = currentStepIdx;
      intervalRef.current = setInterval(() => {
        idx += 1;
        if (idx >= campaign.steps.length) {
          stopSim();
          setPhase('complete');
          setCurrentStepIdx(campaign.steps.length - 1);
          return;
        }
        setCurrentStepIdx(idx);
        setActiveStepId(campaign.steps[idx].id);
      }, 1800);
    }
  }

  function reset() {
    stopSim();
    setCampaign(null);
    setCurrentStepIdx(-1);
    setSimClock(0);
    setActiveStepId(null);
    setPhase('idle');
  }

  const profileConfig = ADVERSARY_PROFILES[profile];
  const _ProfileIcon = profileConfig.icon;

  const visibleSteps = campaign ? campaign.steps.slice(0, currentStepIdx + 1) : [];
  const currentChainStage =
    campaign && currentStepIdx >= 0
      ? (STAGE_TO_CHAIN[campaign.steps[currentStepIdx]?.stage ?? ''] ?? 'recon')
      : null;
  const chainIdx = currentChainStage
    ? KILL_CHAIN_STAGES.findIndex((s) => s.id === currentChainStage)
    : -1;

  const detectedCount = visibleSteps.filter((s) => s.detected).length;
  const missedCount = visibleSteps.filter((s) => !s.detected).length;
  const detectionRate =
    visibleSteps.length > 0 ? Math.round((detectedCount / visibleSteps.length) * 100) : 0;

  const formatClock = (ticks: number) => {
    const secs = ticks * 0.2;
    const days = Math.floor(secs / (3600 * 24));
    const hrs = Math.floor((secs % (3600 * 24)) / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    return `D+${days} ${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen p-5 space-y-5" style={{ background: '#080B12' }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crosshair className="w-3.5 h-3.5" style={{ color: PHANTOM_ACCENT }} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest font-mono"
              style={{ color: PHANTOM_ACCENT }}
            >
              Adversary Simulation Engine
            </span>
            <span
              className="px-1.5 py-0.5 rounded text-[8px] font-bold"
              style={{ background: 'rgba(168,85,247,0.15)', color: PHANTOM_ACCENT }}
            >
              SIMULATION
            </span>
          </div>
          <h1 className="text-xl font-bold text-white">Simulation Center</h1>
          <p className="text-[11px] mt-0.5" style={{ color: DS.text.muted }}>
            NSA-inspired adversary simulation — AI-generated attack campaigns mapped to MITRE ATT&CK
            with real-time kill chain visualization
          </p>
        </div>
        {phase !== 'idle' && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg border font-mono text-sm font-bold"
            style={{
              borderColor: 'rgba(168,85,247,0.3)',
              background: 'rgba(168,85,247,0.08)',
              color: PHANTOM_ACCENT,
            }}
          >
            <Clock className="w-3.5 h-3.5" />
            {formatClock(simClock)}
          </div>
        )}
      </div>

      {(phase === 'idle' || phase === 'profiling' || phase === 'generating') && (
        <div className="grid grid-cols-12 gap-4">
          <div
            className="col-span-4 rounded-xl border p-4 space-y-4"
            style={{ borderColor: DS.border, background: DS.surface }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: DS.text.muted }}
            >
              Adversary Profile
            </div>
            <div className="space-y-2">
              {(
                Object.entries(ADVERSARY_PROFILES) as [
                  AdversaryProfile,
                  (typeof ADVERSARY_PROFILES)[AdversaryProfile],
                ][]
              ).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setProfile(key)}
                    className="w-full text-left flex items-start gap-3 p-2.5 rounded-lg transition-all"
                    style={{
                      background: profile === key ? `${cfg.color}12` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${profile === key ? `${cfg.color}35` : 'transparent'}`,
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${cfg.color}18` }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-white">{cfg.label}</div>
                      <div className="text-[9px] mt-0.5 space-y-0.5">
                        {cfg.traits.slice(0, 2).map((t) => (
                          <div key={t} style={{ color: DS.text.muted }}>
                            · {t}
                          </div>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className="col-span-4 rounded-xl border p-4 space-y-4"
            style={{ borderColor: DS.border, background: DS.surface }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: DS.text.muted }}
            >
              Target Vertical
            </div>
            <div className="space-y-1.5">
              {(
                Object.entries(VERTICALS) as [TargetVertical, (typeof VERTICALS)[TargetVertical]][]
              ).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setVertical(key)}
                  className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all"
                  style={{
                    background:
                      vertical === key ? 'rgba(168,85,247,0.1)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${vertical === key ? 'rgba(168,85,247,0.3)' : 'transparent'}`,
                  }}
                >
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: vertical === key ? PHANTOM_ACCENT : 'rgba(255,255,255,0.7)' }}
                  >
                    {cfg.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-2">
              <div
                className="text-[10px] font-bold uppercase tracking-wider mb-3"
                style={{ color: DS.text.muted }}
              >
                Adversary Sophistication
              </div>
              <div className="flex gap-1.5">
                {([1, 2, 3, 4, 5] as SophisticationLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSophistication(lvl)}
                    className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background:
                        sophistication >= lvl ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.04)',
                      color: sophistication >= lvl ? PHANTOM_ACCENT : DS.text.muted,
                      border: `1px solid ${sophistication >= lvl ? 'rgba(168,85,247,0.3)' : 'transparent'}`,
                    }}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              <div
                className="flex justify-between text-[8px] mt-1"
                style={{ color: DS.text.muted }}
              >
                <span>Script Kiddie</span>
                <span>Nation-State</span>
              </div>
            </div>

            <div className="pt-2">
              <div
                className="text-[10px] font-bold uppercase tracking-wider mb-2"
                style={{ color: DS.text.muted }}
              >
                Attack Motivation / Objective
                <span
                  className="ml-2 text-[8px] font-normal normal-case"
                  style={{ color: DS.text.muted }}
                >
                  (shapes TTP selection)
                </span>
              </div>
              <textarea
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                placeholder={`e.g. "Steal ${VERTICALS[vertical].assets[0]} credentials for competitor resale" or leave blank for profile default`}
                rows={3}
                className="w-full text-[10px] rounded-lg px-3 py-2 outline-none resize-none leading-relaxed"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: motivation.trim()
                    ? '1px solid rgba(168,85,247,0.35)'
                    : '1px solid rgba(255,255,255,0.08)',
                  color: motivation.trim() ? 'rgba(255,255,255,0.85)' : DS.text.muted,
                  fontFamily: 'monospace',
                }}
              />
              {motivation.trim() && (
                <div className="text-[8px] mt-1" style={{ color: PHANTOM_ACCENT }}>
                  Custom objective active — will seed TTP variant selection
                </div>
              )}
            </div>
          </div>

          <div
            className="col-span-4 rounded-xl border p-4 flex flex-col"
            style={{ borderColor: 'rgba(168,85,247,0.2)', background: 'rgba(168,85,247,0.04)' }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-wider mb-3"
              style={{ color: PHANTOM_ACCENT }}
            >
              Campaign Preview
            </div>
            {(() => {
              const tmpl = CAMPAIGN_TEMPLATES[profile];
              const pcfg = ADVERSARY_PROFILES[profile];
              return (
                <div className="space-y-3 flex-1">
                  <div>
                    <div className="text-[9px] mb-1" style={{ color: DS.text.muted }}>
                      Campaign Name
                    </div>
                    <div className="text-sm font-bold text-white">{tmpl.name}</div>
                  </div>
                  <div>
                    <div className="text-[9px] mb-1" style={{ color: DS.text.muted }}>
                      Threat Actor
                    </div>
                    <div className="text-[11px]" style={{ color: pcfg.color }}>
                      {tmpl.actor}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] mb-1" style={{ color: DS.text.muted }}>
                      Motivation
                    </div>
                    <div
                      className="text-[10px] leading-relaxed"
                      style={{ color: 'rgba(255,255,255,0.6)' }}
                    >
                      {tmpl.motivation?.slice(0, 120)}…
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      className="rounded-lg p-2 text-center"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      <div className="text-sm font-bold font-mono" style={{ color: ACCENT }}>
                        {tmpl.durationDays}d
                      </div>
                      <div className="text-[9px]" style={{ color: DS.text.muted }}>
                        Campaign Duration
                      </div>
                    </div>
                    <div
                      className="rounded-lg p-2 text-center"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      <div className="text-sm font-bold font-mono" style={{ color: '#c9b787' }}>
                        {Math.min(100, (tmpl.blastRadius ?? 70) + (sophistication - 3) * 6)}%
                      </div>
                      <div className="text-[9px]" style={{ color: DS.text.muted }}>
                        Predicted Blast Radius
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
            <button
              onClick={startGeneration}
              disabled={phase !== 'idle'}
              className="mt-4 w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              style={{
                background: phase === 'idle' ? 'rgba(168,85,247,0.25)' : 'rgba(168,85,247,0.1)',
                color: PHANTOM_ACCENT,
                border: '1px solid rgba(168,85,247,0.4)',
              }}
            >
              {phase === 'profiling' && (
                <>
                  <Cpu className="w-4 h-4 animate-spin" /> Profiling adversary…
                </>
              )}
              {phase === 'generating' && (
                <>
                  <Brain className="w-4 h-4 animate-pulse" /> Generating campaign…
                </>
              )}
              {phase === 'idle' && (
                <>
                  <Play className="w-4 h-4" /> Launch Simulation
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {(phase === 'running' || phase === 'paused' || phase === 'complete') && campaign && (
        <>
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                label: 'Active Stage',
                value: campaign.steps[currentStepIdx]?.stage ?? 'Initializing',
                color: PHANTOM_ACCENT,
              },
              {
                label: 'Detection Rate',
                value: `${detectionRate}%`,
                color: detectionRate > 60 ? '#6b8f71' : '#f5f5f5',
              },
              {
                label: 'Steps Detected',
                value: `${detectedCount} / ${visibleSteps.length}`,
                color: '#c9b787',
              },
              { label: 'Blast Radius', value: `${campaign.blastRadius}%`, color: '#f5f5f5' },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-xl border p-3 text-center"
                style={{ borderColor: `${c.color}20`, background: `${c.color}06` }}
              >
                <div className="text-lg font-bold font-mono" style={{ color: c.color }}>
                  {c.value}
                </div>
                <div
                  className="text-[9px] mt-0.5 uppercase tracking-wider"
                  style={{ color: DS.text.muted }}
                >
                  {c.label}
                </div>
              </div>
            ))}
          </div>

          <div
            className="rounded-xl border p-4"
            style={{ borderColor: DS.border, background: DS.surface }}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: DS.text.muted }}
              >
                Kill Chain Progress
              </div>
              <div className="flex gap-2">
                {(phase === 'running' || phase === 'paused') && (
                  <button
                    onClick={pauseResume}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      background: 'rgba(168,85,247,0.12)',
                      color: PHANTOM_ACCENT,
                      border: '1px solid rgba(168,85,247,0.25)',
                    }}
                  >
                    {phase === 'running' ? (
                      <>
                        <Pause className="w-3 h-3" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" /> Resume
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: 'rgba(255,255,255,0.05)', color: DS.text.secondary }}
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {KILL_CHAIN_STAGES.map((s, i) => {
                const reached = i <= chainIdx;
                const active = i === chainIdx && phase === 'running';
                return (
                  <div key={s.id} className="flex items-center gap-1.5 shrink-0">
                    <div
                      className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all"
                      style={{
                        background: reached ? `${s.color}22` : 'rgba(255,255,255,0.03)',
                        color: reached ? s.color : 'rgba(255,255,255,0.2)',
                        border: `1px solid ${active ? `${s.color}80` : reached ? `${s.color}35` : 'transparent'}`,
                        animation: active ? 'pulse 1s ease-in-out infinite' : 'none',
                      }}
                    >
                      {s.label}
                    </div>
                    {i < KILL_CHAIN_STAGES.length - 1 && (
                      <div
                        className="w-4 h-px"
                        style={{ background: reached ? `${s.color}40` : 'rgba(255,255,255,0.05)' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div
              className="col-span-7 rounded-xl border"
              style={{ borderColor: DS.border, background: DS.surface }}
            >
              <div
                className="flex items-center gap-2 px-4 py-3 border-b"
                style={{ borderColor: DS.border }}
              >
                <Activity className="w-3.5 h-3.5" style={{ color: PHANTOM_ACCENT }} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                  Attack Timeline — {campaign.name}
                </span>
                <span className="ml-auto text-[9px] font-mono" style={{ color: PHANTOM_ACCENT }}>
                  {phase === 'running' ? '● LIVE' : phase === 'complete' ? 'COMPLETE' : 'PAUSED'}
                </span>
              </div>
              <div
                className="divide-y max-h-80 overflow-y-auto"
                style={{ borderColor: 'rgba(255,255,255,0.03)' }}
              >
                {visibleSteps.map((step, _i) => (
                  <div
                    key={step.id}
                    className="flex gap-3 px-4 py-3 transition-all"
                    style={{
                      background:
                        activeStepId === step.id ? 'rgba(168,85,247,0.05)' : 'transparent',
                    }}
                  >
                    <div
                      className="w-16 shrink-0 text-[9px] font-mono pt-0.5"
                      style={{ color: DS.text.muted }}
                    >
                      {step.time}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-semibold text-white">
                          {step.technique}
                        </span>
                        <span
                          className="text-[8px] px-1.5 py-0.5 rounded font-mono"
                          style={{ background: 'rgba(168,85,247,0.15)', color: PHANTOM_ACCENT }}
                        >
                          {step.mitre}
                        </span>
                        <span
                          className={`text-[8px] px-1.5 py-0.5 rounded font-bold ml-auto ${step.detected ? 'text-[#c9b787]' : 'text-[#f5f5f5]'}`}
                          style={{
                            background: step.detected
                              ? 'rgba(74,222,128,0.12)'
                              : 'rgba(245,245,245,0.12)',
                          }}
                        >
                          {step.detected ? 'DETECTED' : 'MISSED'}
                        </span>
                      </div>
                      <div className="text-[10px]" style={{ color: DS.text.muted }}>
                        {step.description}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-[8px] px-1 py-0.5 rounded"
                          style={{ background: 'rgba(255,255,255,0.05)', color: DS.text.muted }}
                        >
                          {step.stage}
                        </span>
                        <span className="text-[8px]" style={{ color: DS.text.muted }}>
                          → {step.asset}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {visibleSteps.length === 0 && (
                  <div className="py-8 text-center text-[11px]" style={{ color: DS.text.muted }}>
                    Initializing attack sequence…
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-5 space-y-3">
              <div
                className="rounded-xl border p-4"
                style={{ borderColor: DS.border, background: DS.surface }}
              >
                <div
                  className="text-[10px] font-bold uppercase tracking-wider mb-3"
                  style={{ color: DS.text.muted }}
                >
                  Campaign Intelligence
                </div>
                <div className="space-y-2.5">
                  <div>
                    <div className="text-[9px] mb-1" style={{ color: DS.text.muted }}>
                      Threat Actor
                    </div>
                    <div
                      className="text-[11px] font-semibold"
                      style={{ color: ADVERSARY_PROFILES[profile].color }}
                    >
                      {campaign.actor}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] mb-1" style={{ color: DS.text.muted }}>
                      TTPs (MITRE ATT&CK)
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {campaign.ttps.map((t) => (
                        <span
                          key={t}
                          className="text-[8px] px-1.5 py-0.5 rounded font-mono"
                          style={{ background: 'rgba(168,85,247,0.12)', color: PHANTOM_ACCENT }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] mb-1" style={{ color: DS.text.muted }}>
                      Predicted Financial Impact
                    </div>
                    <div className="text-[10px] leading-relaxed" style={{ color: '#f5f5f5' }}>
                      {campaign.predictedImpact}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="rounded-xl border p-4"
                style={{ borderColor: 'rgba(245,245,245,0.2)', background: 'rgba(245,245,245,0.03)' }}
              >
                <div
                  className="text-[10px] font-bold uppercase tracking-wider mb-3"
                  style={{ color: '#f5f5f5' }}
                >
                  Detection Coverage Gaps
                </div>
                <div className="space-y-2">
                  {visibleSteps
                    .filter((s) => !s.detected)
                    .map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-2 p-2 rounded-lg"
                        style={{ background: 'rgba(245,245,245,0.08)' }}
                      >
                        <AlertTriangle className="w-3 h-3 text-[#f5f5f5] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-semibold text-[#f5f5f5] truncate">
                            {s.technique}
                          </div>
                          <div className="text-[9px] font-mono" style={{ color: DS.text.muted }}>
                            {s.mitre} · {s.asset}
                          </div>
                        </div>
                      </div>
                    ))}
                  {visibleSteps.filter((s) => !s.detected).length === 0 && (
                    <div className="text-[10px] text-center py-2" style={{ color: DS.text.muted }}>
                      {visibleSteps.length === 0
                        ? 'Awaiting simulation…'
                        : 'No gaps detected so far'}
                    </div>
                  )}
                </div>
              </div>

              {phase === 'complete' && (
                <div
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: 'rgba(168,85,247,0.3)',
                    background: 'rgba(168,85,247,0.06)',
                  }}
                >
                  <div
                    className="text-[10px] font-bold uppercase tracking-wider mb-2"
                    style={{ color: PHANTOM_ACCENT }}
                  >
                    Simulation Complete
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div
                      className="text-center rounded-lg p-2"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      <div
                        className="text-lg font-bold font-mono"
                        style={{ color: detectionRate > 60 ? '#6b8f71' : ACCENT }}
                      >
                        {detectionRate}%
                      </div>
                      <div className="text-[9px]" style={{ color: DS.text.muted }}>
                        Detection Rate
                      </div>
                    </div>
                    <div
                      className="text-center rounded-lg p-2"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      <div className="text-lg font-bold font-mono text-[#f5f5f5]">{missedCount}</div>
                      <div className="text-[9px]" style={{ color: DS.text.muted }}>
                        Gaps Found
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={reset}
                    className="w-full py-2 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: 'rgba(168,85,247,0.2)',
                      color: PHANTOM_ACCENT,
                      border: '1px solid rgba(168,85,247,0.3)',
                    }}
                  >
                    Run New Simulation
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
