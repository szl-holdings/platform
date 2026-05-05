import { cn } from '@szl-holdings/shared-ui/utils';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  ExternalLink,
  Key,
  Lock,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';

type AlgorithmStatus = 'deployed' | 'in-progress' | 'planned' | 'not-started';

type PqcStandard = {
  fips: string;
  name: string;
  formerly: string;
  purpose: string;
  basis: string;
  securityLevels: string[];
  status: AlgorithmStatus;
  deployedIn: string[];
  planned: string[];
};

type MigrationPhase = {
  phase: string;
  status: AlgorithmStatus;
  tasks: string[];
};

type EcoSystem = {
  system: string;
  current: string;
  target: string;
  status: AlgorithmStatus;
};

const STATUS_CONFIG: Record<AlgorithmStatus, { label: string; icon: typeof Check; color: string }> = {
  deployed: { label: 'Deployed', icon: Check, color: 'text-emerald-400' },
  'in-progress': { label: 'In Progress', icon: Clock, color: 'text-amber-400' },
  planned: { label: 'Planned', icon: ArrowRight, color: 'text-blue-400' },
  'not-started': { label: 'Not Started', icon: X, color: 'text-white/25' },
};

const PQC_STANDARDS: PqcStandard[] = [
  {
    fips: 'FIPS 203',
    name: 'ML-KEM',
    formerly: 'CRYSTALS-Kyber',
    purpose: 'Key Encapsulation',
    basis: 'Module-Lattice (MLWE)',
    securityLevels: ['ML-KEM-512 (128-bit)', 'ML-KEM-768 (192-bit)', 'ML-KEM-1024 (256-bit)'],
    status: 'in-progress',
    deployedIn: ['Agent mesh inter-node TLS (hybrid X25519MLKEM768)', 'Proof chain key wrapping'],
    planned: ['Evidence ledger encryption', 'Covenant attestation key exchange'],
  },
  {
    fips: 'FIPS 204',
    name: 'ML-DSA',
    formerly: 'CRYSTALS-Dilithium',
    purpose: 'Digital Signatures',
    basis: 'Module-Lattice (MLWE + SelfTargetMSIS)',
    securityLevels: ['ML-DSA-44 (128-bit)', 'ML-DSA-65 (192-bit)', 'ML-DSA-87 (256-bit)'],
    status: 'deployed',
    deployedIn: [
      'Proof chain hybrid signing (Ed25519 + ML-DSA-65)',
      'MCP gateway response signing',
      'Governance covenant signatures',
      'Agent identity attestation',
    ],
    planned: ['Audit trail signing (full coverage)'],
  },
  {
    fips: 'FIPS 205',
    name: 'SLH-DSA',
    formerly: 'SPHINCS+',
    purpose: 'Hash-Based Signatures',
    basis: 'Stateless Hash-Based',
    securityLevels: ['SLH-DSA-128s/f', 'SLH-DSA-192s/f', 'SLH-DSA-256s/f'],
    status: 'planned',
    deployedIn: [],
    planned: ['Long-term evidence archival signatures', 'Root CA backup signatures'],
  },
  {
    fips: 'FIPS 206 (draft)',
    name: 'FN-DSA',
    formerly: 'FALCON',
    purpose: 'Compact Lattice Signatures',
    basis: 'FFT NTRU-Based',
    securityLevels: ['FN-DSA-512 (128-bit)', 'FN-DSA-1024 (256-bit)'],
    status: 'not-started',
    deployedIn: [],
    planned: ['Compact agent-to-agent signatures (bandwidth-constrained channels)'],
  },
];

const MIGRATION_PHASES: MigrationPhase[] = [
  {
    phase: 'Phase 1: Inventory & Assessment',
    status: 'deployed',
    tasks: [
      'Catalog all cryptographic primitives across a11oy ecosystem',
      'Identify quantum-vulnerable algorithms (RSA, ECDSA, ECDH, DH)',
      'Map key lifetimes and data sensitivity classifications',
      'Assess third-party integration crypto dependencies',
    ],
  },
  {
    phase: 'Phase 2: Hybrid Deployment',
    status: 'deployed',
    tasks: [
      'Deploy hybrid X25519MLKEM768 for agent mesh TLS',
      'Dual-sign governance attestations (Ed25519 + ML-DSA-65)',
      'Upgrade Proof Chain key wrapping to ML-KEM-768',
      'DID-based identity for tenants (did:web) and agents (did:key)',
    ],
  },
  {
    phase: 'Phase 3: Full PQC Migration',
    status: 'in-progress',
    tasks: [
      'Migrate all evidence ledger encryption to ML-KEM-1024',
      'SZL Root CA issuing PQC-hybrid certificates',
      'Certificate Transparency Merkle log operational',
      'MCP gateway signing every response with hybrid keypair',
    ],
  },
  {
    phase: 'Phase 4: Validation & Certification',
    status: 'planned',
    tasks: [
      'FIPS 140-3 validation for PQC module boundary',
      'Penetration testing against harvest-now-decrypt-later',
      'Performance benchmarking across all security levels',
      'Third-party cryptographic audit',
    ],
  },
];

const ECOSYSTEM_STATUS: EcoSystem[] = [
  { system: 'Agent Mesh TLS', current: 'X25519 + AES-256-GCM', target: 'X25519MLKEM768 + AES-256-GCM', status: 'in-progress' },
  { system: 'Proof Chain Signatures', current: 'Ed25519', target: 'Ed25519 + ML-DSA-65 (hybrid)', status: 'deployed' },
  { system: 'MCP Gateway Signing', current: 'Unsigned', target: 'Ed25519 + ML-DSA-65 (hybrid)', status: 'deployed' },
  { system: 'Agent Identity (DID)', current: 'API key / JWT', target: 'did:key + hybrid cert', status: 'deployed' },
  { system: 'Tenant Identity (DID)', current: 'Clerk auth', target: 'did:web + hybrid cert', status: 'deployed' },
  { system: 'Certificate Transparency', current: 'None', target: 'Merkle append-only log', status: 'deployed' },
  { system: 'Evidence Ledger Encryption', current: 'AES-256-GCM / X25519', target: 'ML-KEM-1024 / AES-256-GCM', status: 'planned' },
  { system: 'Covenant Attestation', current: 'ECDSA P-256', target: 'ML-DSA-65', status: 'deployed' },
  { system: 'Agent Identity Tokens', current: 'Ed25519 keypairs', target: 'ML-DSA-44 keypairs', status: 'in-progress' },
  { system: 'Archival Signing', current: 'Ed25519', target: 'SLH-DSA-256s', status: 'not-started' },
  { system: 'MirrorEval Hash Commitments', current: 'SHA-256', target: 'SHA-256 (quantum-safe)', status: 'deployed' },
  { system: 'Session Tokens', current: 'HS256 JWT', target: 'HS256 JWT (quantum-safe)', status: 'deployed' },
];

interface PQCLiveStatus {
  signingMode?: string;
  caIssuer?: string;
  totalCerts?: number;
  activeCerts?: number;
  transparencyLogSize?: number;
  merkleRoot?: string;
}

export default function PqcReadiness() {
  const [expandedStandard, setExpandedStandard] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<PQCLiveStatus | null>(null);

  useEffect(() => {
    const base = (import.meta.env.BASE_URL ?? '/sentra/').replace(/\/$/, '');
    const apiBase = base.replace('/sentra', '/api');
    fetch(`${apiBase}/pqc/status`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.data) {
          setLiveStatus({
            signingMode: data.data.signingMode,
            caIssuer: data.data.ca?.issuer,
            totalCerts: data.data.ca?.certificates?.totalIssued,
            activeCerts: data.data.ca?.certificates?.totalActive,
            transparencyLogSize: data.data.transparencyLog?.treeSize,
            merkleRoot: data.data.transparencyLog?.merkleRoot,
          });
        }
      })
      .catch(() => {});
  }, []);

  const deployedCount = ECOSYSTEM_STATUS.filter((s) => s.status === 'deployed').length;
  const inProgressCount = ECOSYSTEM_STATUS.filter((s) => s.status === 'in-progress').length;
  const totalSystems = ECOSYSTEM_STATUS.length;
  const readinessScore = Math.round(((deployedCount * 1 + inProgressCount * 0.5) / totalSystems) * 100);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold text-white">Post-Quantum Cryptography Readiness</h1>
            <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
              OPERATIONAL
            </span>
          </div>
          <p className="text-[13px] text-white/35">
            Quantum-resistant cryptography migration status across the a11oy governance ecosystem
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white/20">
            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[10px] text-white/20">a11oy orchestrated</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 text-center">
          <p className="text-2xl font-semibold text-white">{readinessScore}%</p>
          <p className="text-[10px] uppercase tracking-wider text-white/25 mt-0.5">PQC Readiness</p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 text-center">
          <p className="text-2xl font-semibold text-emerald-400">{deployedCount}</p>
          <p className="text-[10px] uppercase tracking-wider text-white/25 mt-0.5">Systems Quantum-Safe</p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 text-center">
          <p className="text-2xl font-semibold text-amber-400">{inProgressCount}</p>
          <p className="text-[10px] uppercase tracking-wider text-white/25 mt-0.5">In Migration</p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 text-center">
          <p className="text-2xl font-semibold text-white">4</p>
          <p className="text-[10px] uppercase tracking-wider text-white/25 mt-0.5">NIST Standards</p>
        </div>
      </div>

      {liveStatus && (
        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-[13px] font-medium text-emerald-400">Live PQC Stack Status</h3>
            <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-400/10 text-emerald-400">LIVE</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <div className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Signing Mode</div>
              <div className="text-[13px] font-mono text-emerald-400">{liveStatus.signingMode ?? 'hybrid'}</div>
            </div>
            <div>
              <div className="text-[10px] text-white/25 uppercase tracking-wider mb-1">CA Issuer</div>
              <div className="text-[13px] font-mono text-white/50">{liveStatus.caIssuer ?? 'SZL Holdings Root CA v1'}</div>
            </div>
            <div>
              <div className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Active Certificates</div>
              <div className="text-[13px] font-mono text-white/50">{liveStatus.activeCerts ?? 0} / {liveStatus.totalCerts ?? 0}</div>
            </div>
            <div>
              <div className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Transparency Log</div>
              <div className="text-[13px] font-mono text-white/50">{liveStatus.transparencyLogSize ?? 0} entries</div>
            </div>
          </div>
          {liveStatus.merkleRoot && (
            <div className="mt-3 pt-3 border-t border-emerald-500/10">
              <div className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Merkle Root</div>
              <div className="text-[11px] font-mono text-white/30 break-all">{liveStatus.merkleRoot}</div>
            </div>
          )}
        </div>
      )}

      <div>
        <h2 className="text-[13px] font-medium text-white mb-3 flex items-center gap-2">
          <Key className="w-3.5 h-3.5 text-white/30" /> NIST Post-Quantum Standards
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PQC_STANDARDS.map((std) => {
            const statusConfig = STATUS_CONFIG[std.status];
            const expanded = expandedStandard === std.fips;
            return (
              <button
                key={std.fips}
                onClick={() => setExpandedStandard(expanded ? null : std.fips)}
                className={cn(
                  'text-left bg-white/[0.02] border rounded-xl p-5 transition-all',
                  expanded ? 'border-white/[0.12]' : 'border-white/[0.06] hover:border-white/[0.10]',
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-[10px] font-mono text-white/25">{std.fips}</span>
                    <h3 className="text-[15px] font-medium text-white">{std.name}</h3>
                    <p className="text-[11px] text-white/25">formerly {std.formerly}</p>
                  </div>
                  <span className={cn('flex items-center gap-1 text-[10px] font-mono', statusConfig.color)}>
                    <statusConfig.icon className="w-3 h-3" />
                    {statusConfig.label}
                  </span>
                </div>
                <p className="text-[12px] text-white/40 mb-2">{std.purpose} · {std.basis}</p>
                {expanded && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-3">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-white/25 mb-1.5">Security Levels</p>
                      <div className="flex flex-wrap gap-1.5">
                        {std.securityLevels.map((level) => (
                          <span key={level} className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-white/40 border border-white/[0.06]">
                            {level}
                          </span>
                        ))}
                      </div>
                    </div>
                    {std.deployedIn.length > 0 && (
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/60 mb-1.5">Deployed In</p>
                        {std.deployedIn.map((d) => (
                          <p key={d} className="text-[11px] text-white/40 flex items-center gap-1.5">
                            <Check className="w-3 h-3 text-emerald-400" /> {d}
                          </p>
                        ))}
                      </div>
                    )}
                    {std.planned.length > 0 && (
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-white/20 mb-1.5">Planned</p>
                        {std.planned.map((p) => (
                          <p key={p} className="text-[11px] text-white/30 flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-white/15" /> {p}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-[13px] font-medium text-white mb-3 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-white/30" /> Ecosystem Migration Status
        </h2>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-5 py-2.5 border-b border-white/[0.04] text-[10px] font-mono uppercase tracking-wider text-white/25">
            <div className="col-span-3">System</div>
            <div className="col-span-3">Current</div>
            <div className="col-span-4">Target (PQC)</div>
            <div className="col-span-2">Status</div>
          </div>
          {ECOSYSTEM_STATUS.map((sys) => {
            const statusConfig = STATUS_CONFIG[sys.status];
            return (
              <div
                key={sys.system}
                className="grid grid-cols-12 gap-3 items-center px-5 py-3 border-b border-white/[0.03]"
              >
                <div className="col-span-3 text-[12px] text-white/60">{sys.system}</div>
                <div className="col-span-3 text-[11px] font-mono text-white/30">{sys.current}</div>
                <div className="col-span-4 text-[11px] font-mono text-white/45">{sys.target}</div>
                <div className="col-span-2">
                  <span className={cn('flex items-center gap-1 text-[10px] font-mono', statusConfig.color)}>
                    <statusConfig.icon className="w-3 h-3" />
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-[13px] font-medium text-white mb-3 flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-white/30" /> Migration Roadmap
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {MIGRATION_PHASES.map((phase) => {
            const statusConfig = STATUS_CONFIG[phase.status];
            return (
              <div
                key={phase.phase}
                className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={cn('flex items-center gap-1 text-[10px] font-mono', statusConfig.color)}>
                    <statusConfig.icon className="w-3 h-3" />
                    {statusConfig.label}
                  </span>
                </div>
                <h3 className="text-[13px] font-medium text-white mb-3">{phase.phase}</h3>
                <ul className="space-y-1.5">
                  {phase.tasks.map((task) => (
                    <li key={task} className="text-[11px] text-white/30 flex gap-1.5">
                      <span className="text-white/15 shrink-0 mt-0.5">&#x2022;</span>
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="text-[13px] font-medium text-amber-400">Harvest-Now Decrypt-Later Risk Assessment</h3>
        </div>
        <p className="text-[12px] text-white/35 leading-relaxed mb-4">
          Adversaries are already capturing encrypted traffic for future quantum decryption.
          Every day of delay increases the volume of harvestable ciphertext. The a11oy governance
          layer prioritizes PQC migration based on data sensitivity and key lifetime — starting
          with long-lived keys and highly sensitive evidence chains that will remain valuable to
          adversaries for decades.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Estimated Harvestable Traffic', value: '4.7 PB', detail: 'Since monitoring began (18 months)', risk: 'critical' },
            { label: 'High-Value Targets', value: '23', detail: 'Systems with 10+ year data sensitivity', risk: 'critical' },
            { label: 'Avg Key Lifetime', value: '7.2 years', detail: 'Across vulnerable cryptographic assets', risk: 'high' },
            { label: 'Nation-State Interest', value: 'HIGH', detail: 'APT groups known to harvest encrypted data', risk: 'critical' },
          ].map((item) => (
            <div key={item.label} className={cn(
              'rounded-lg p-3 border',
              item.risk === 'critical' ? 'bg-red-500/5 border-red-500/15' : 'bg-amber-500/5 border-amber-500/15',
            )}>
              <div className="text-[10px] text-white/25 uppercase tracking-wider mb-1">{item.label}</div>
              <div className={cn(
                'text-lg font-bold font-mono',
                item.risk === 'critical' ? 'text-red-400' : 'text-amber-400',
              )}>
                {item.value}
              </div>
              <div className="text-[10px] text-white/25 mt-0.5">{item.detail}</div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <h4 className="text-[11px] font-medium text-white/50">Priority Data Categories</h4>
          {[
            { category: 'Executive Communications', sensitivity: '25+ years', volume: '340 GB/month', priority: 1, migrated: false },
            { category: 'M&A Transaction Data', sensitivity: '15+ years', volume: '89 GB/month', priority: 2, migrated: false },
            { category: 'Customer PII & Financial', sensitivity: '10+ years', volume: '1.2 TB/month', priority: 3, migrated: true },
            { category: 'IP & Trade Secrets', sensitivity: '20+ years', volume: '560 GB/month', priority: 4, migrated: false },
            { category: 'Government Contract Data', sensitivity: '30+ years', volume: '78 GB/month', priority: 5, migrated: false },
          ].map((cat) => (
            <div key={cat.category} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] font-mono text-white/25 w-6">P{cat.priority}</span>
              <span className="text-[11px] text-white/50 flex-1">{cat.category}</span>
              <span className="text-[10px] text-white/25 font-mono">{cat.sensitivity}</span>
              <span className="text-[10px] text-white/25 font-mono">{cat.volume}</span>
              <span className={cn(
                'text-[9px] px-1.5 py-0.5 rounded font-mono',
                cat.migrated ? 'text-emerald-400 bg-emerald-400/10' : 'text-amber-400 bg-amber-400/10',
              )}>
                {cat.migrated ? 'PQC Migrated' : 'Vulnerable'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-[13px] font-medium text-white mb-3 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-white/30" /> Quantum Threat Timeline
        </h2>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-white/[0.08]" />
            <div className="space-y-6">
              {[
                { year: '2024', label: 'NIST Finalization', description: 'NIST finalizes FIPS 203/204/205 standards. Hybrid implementations begin. Harvest-now-decrypt-later attacks accelerate.', status: 'deployed' as const, highlight: true },
                { year: '2025', label: 'Hybrid Deployment', description: 'Deploy hybrid classical+PQC for all agent mesh TLS. Begin dual-signing governance attestations. First PQC-protected evidence chains.', status: 'deployed' as const, highlight: true },
                { year: '2026', label: 'PQC Identity Gateway', description: 'Ed25519 + ML-DSA-65 hybrid signing operational. DID-based identity for tenants and agents. SZL Root CA issuing PQC-hybrid certificates. Certificate Transparency log active. MCP gateway signing all responses.', status: 'deployed' as const, highlight: true },
                { year: '2027', label: 'Validation & Certification', description: 'FIPS 140-3 validation for PQC module. Third-party audit. Performance benchmarking across all security levels.', status: 'planned' as const, highlight: false },
                { year: '2028–2030', label: 'Quantum Computing Threat Window', description: 'Leading estimates suggest cryptographically-relevant quantum computers may emerge. Organizations without PQC migration face catastrophic data exposure.', status: 'not-started' as const, highlight: false },
              ].map((milestone) => {
                const sc = STATUS_CONFIG[milestone.status];
                return (
                  <div key={milestone.year} className="relative pl-10">
                    <div className={cn(
                      'absolute left-[10px] w-3 h-3 rounded-full border-2',
                      milestone.status === 'deployed' ? 'bg-emerald-400 border-emerald-400/50' :
                      milestone.status === 'in-progress' ? 'bg-amber-400 border-amber-400/50 animate-pulse' :
                      'bg-white/10 border-white/20',
                    )} />
                    <div className={cn(
                      'rounded-lg p-4 border',
                      milestone.highlight ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-white/[0.01] border-white/[0.04]',
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12px] font-bold text-white font-mono">{milestone.year}</span>
                        <span className="text-[11px] text-white/50">{milestone.label}</span>
                        <span className={cn('flex items-center gap-1 text-[10px] font-mono ml-auto', sc.color)}>
                          <sc.icon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/30 leading-relaxed">{milestone.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
        <h2 className="text-[13px] font-medium text-white mb-3 flex items-center gap-2">
          <Key className="w-3.5 h-3.5 text-white/30" /> Cryptographic Algorithm Inventory
        </h2>
        <div className="grid grid-cols-12 gap-3 px-3 py-2 border-b border-white/[0.04] text-[10px] font-mono uppercase tracking-wider text-white/25">
          <div className="col-span-3">Algorithm</div>
          <div className="col-span-2">Usage</div>
          <div className="col-span-2">Instances</div>
          <div className="col-span-3">Quantum Risk</div>
          <div className="col-span-2">Migration</div>
        </div>
        {[
          { algo: 'RSA-2048', usage: 'TLS Certificates', instances: 142, risk: 'Broken by Shor\'s', migration: 'ML-KEM-768' },
          { algo: 'ECDSA P-256', usage: 'Code Signing', instances: 89, risk: 'Broken by Shor\'s', migration: 'ML-DSA-65' },
          { algo: 'ECDH P-256', usage: 'Key Exchange', instances: 234, risk: 'Broken by Shor\'s', migration: 'ML-KEM-768' },
          { algo: 'Ed25519', usage: 'Agent Identities', instances: 456, risk: 'Broken by Shor\'s', migration: 'Hybrid (Ed25519 + ML-DSA-65)' },
          { algo: 'AES-256-GCM', usage: 'Data Encryption', instances: 1_847, risk: 'Weakened (Grover)', migration: 'AES-256 (safe)' },
          { algo: 'SHA-256', usage: 'Hash Functions', instances: 3_291, risk: 'Weakened (Grover)', migration: 'SHA-256 (safe)' },
          { algo: 'X25519', usage: 'Key Agreement', instances: 567, risk: 'Broken by Shor\'s', migration: 'X25519MLKEM768' },
        ].map((row) => {
          const isBroken = row.risk.includes('Broken');
          return (
            <div key={row.algo} className="grid grid-cols-12 gap-3 items-center px-3 py-2.5 border-b border-white/[0.03]">
              <div className="col-span-3 text-[11px] font-mono text-white/50">{row.algo}</div>
              <div className="col-span-2 text-[11px] text-white/30">{row.usage}</div>
              <div className="col-span-2 text-[11px] font-mono text-white/40">{row.instances.toLocaleString()}</div>
              <div className="col-span-3">
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded',
                  isBroken ? 'text-red-400 bg-red-400/10' : 'text-amber-400 bg-amber-400/10',
                )}>
                  {row.risk}
                </span>
              </div>
              <div className="col-span-2 text-[10px] font-mono text-white/30">{row.migration}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
