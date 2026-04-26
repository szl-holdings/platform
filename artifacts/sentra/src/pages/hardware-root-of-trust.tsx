import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Check,
  CircuitBoard,
  Cpu,
  Lock,
  Scan,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';

type TrustAnchor = {
  id: string;
  name: string;
  type: 'hsm' | 'tpm' | 'enclave' | 'puf' | 'dielet';
  status: 'verified' | 'provisioned' | 'pending' | 'quarantined';
  darpaProgram: string;
  integrityScore: number;
  lastAttestation: string;
  description: string;
};

type CapabilityCompartment = {
  id: string;
  workcell: string;
  permissions: string[];
  isolationLevel: 'hardware' | 'process' | 'namespace';
  cheriEnforced: boolean;
  memoryBounds: { base: string; length: string };
  lastAudit: string;
};

type SupplyChainComponent = {
  id: string;
  name: string;
  vendor: string;
  type: 'silicon' | 'firmware' | 'fpga' | 'chiplet' | 'pcb';
  attestationStatus: 'attested' | 'pending' | 'failed';
  shieldDielet: boolean;
  thzInspected: boolean;
  provenance: string;
};

const TRUST_ANCHORS: TrustAnchor[] = [
  { id: 'HSM-001', name: 'Primary Key Vault', type: 'hsm', status: 'verified', darpaProgram: 'AISS', integrityScore: 99.7, lastAttestation: '2026-04-26T14:30:00Z', description: 'Master key hierarchy for Proof Chain signatures. Skyrmion-ready memory enclave for radiation-hardened key storage.' },
  { id: 'TPM-001', name: 'Governance Attestation Module', type: 'tpm', status: 'verified', darpaProgram: 'SSITH', integrityScore: 99.2, lastAttestation: '2026-04-26T14:28:00Z', description: 'Trusted Platform Module enforcing covenant policy measurement chains. CHERI capability bounds verified.' },
  { id: 'ENC-001', name: 'MirrorEval Secure Enclave', type: 'enclave', status: 'verified', darpaProgram: 'SSITH/CHERI', integrityScore: 98.9, lastAttestation: '2026-04-26T14:25:00Z', description: 'Hardware-isolated enclave for model evaluation. CHERI memory capabilities enforce strict bounds on agent workcells.' },
  { id: 'PUF-001', name: 'Agent Identity PUF Array', type: 'puf', status: 'provisioned', darpaProgram: 'SHIELD', integrityScore: 97.8, lastAttestation: '2026-04-26T13:00:00Z', description: 'Physically unclonable functions generating unique agent identity tokens. Each a11oy agent carries a hardware-bound identity.' },
  { id: 'DLT-001', name: 'Supply Chain Dielet', type: 'dielet', status: 'provisioned', darpaProgram: 'SHIELD', integrityScore: 96.5, lastAttestation: '2026-04-26T12:00:00Z', description: 'Micro-scale hardware root of trust embedded in component packages. Validates provenance through near-field cryptographic challenge-response.' },
  { id: 'ENC-002', name: 'Evidence Ledger Enclave', type: 'enclave', status: 'verified', darpaProgram: 'AISS', integrityScore: 99.5, lastAttestation: '2026-04-26T14:20:00Z', description: 'Secure enclave for immutable evidence storage. Post-quantum key wrapping with ML-KEM-1024 in hybrid mode.' },
];

const COMPARTMENTS: CapabilityCompartment[] = [
  { id: 'CC-001', workcell: 'Threat Intelligence Agent', permissions: ['read:intel-feeds', 'write:threat-graph', 'invoke:enrichment-tools'], isolationLevel: 'hardware', cheriEnforced: true, memoryBounds: { base: '0x7F00_0000', length: '256 MB' }, lastAudit: '2026-04-26T10:00:00Z' },
  { id: 'CC-002', workcell: 'Incident Response Agent', permissions: ['read:soc-events', 'write:case-actions', 'invoke:containment'], isolationLevel: 'hardware', cheriEnforced: true, memoryBounds: { base: '0x8F00_0000', length: '512 MB' }, lastAudit: '2026-04-26T10:00:00Z' },
  { id: 'CC-003', workcell: 'Compliance Validator', permissions: ['read:policy-store', 'read:evidence-ledger', 'write:audit-entries'], isolationLevel: 'process', cheriEnforced: true, memoryBounds: { base: '0x9F00_0000', length: '128 MB' }, lastAudit: '2026-04-26T09:30:00Z' },
  { id: 'CC-004', workcell: 'Model Evaluation Sandbox', permissions: ['read:model-registry', 'invoke:eval-harness'], isolationLevel: 'hardware', cheriEnforced: true, memoryBounds: { base: '0xAF00_0000', length: '1024 MB' }, lastAudit: '2026-04-26T09:00:00Z' },
  { id: 'CC-005', workcell: 'Hunt Proposer Agent', permissions: ['read:threat-feeds', 'read:asset-graph', 'write:hunt-proposals'], isolationLevel: 'process', cheriEnforced: true, memoryBounds: { base: '0xBF00_0000', length: '256 MB' }, lastAudit: '2026-04-26T08:30:00Z' },
];

const SUPPLY_CHAIN: SupplyChainComponent[] = [
  { id: 'SC-001', name: 'Inference Accelerator SoC', vendor: 'Trusted Foundry', type: 'silicon', attestationStatus: 'attested', shieldDielet: true, thzInspected: true, provenance: 'ITAR-compliant fab, lot #TF-2026-0412' },
  { id: 'SC-002', name: 'Secure Boot ROM', vendor: 'US Micro', type: 'firmware', attestationStatus: 'attested', shieldDielet: true, thzInspected: false, provenance: 'Code-signed with ML-DSA-65, version 4.2.1' },
  { id: 'SC-003', name: 'Governance FPGA', vendor: 'Xilinx/AMD', type: 'fpga', attestationStatus: 'attested', shieldDielet: false, thzInspected: true, provenance: 'Bitstream hash: SHA3-256, config locked' },
  { id: 'SC-004', name: 'PQC Crypto Chiplet', vendor: 'NGMM Partner', type: 'chiplet', attestationStatus: 'pending', shieldDielet: true, thzInspected: true, provenance: '3DHI chiplet, TIE fabrication lot #NGMM-2026-003' },
  { id: 'SC-005', name: 'Sensor Mesh Controller', vendor: 'Analog Devices', type: 'pcb', attestationStatus: 'attested', shieldDielet: false, thzInspected: false, provenance: 'Board rev C, IPC Class 3 certified' },
];

const STATUS_COLORS: Record<string, string> = {
  verified: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  provisioned: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  quarantined: 'bg-red-500/10 text-red-400 border-red-500/20',
  attested: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const TYPE_ICONS: Record<string, typeof Shield> = {
  hsm: Lock,
  tpm: ShieldCheck,
  enclave: CircuitBoard,
  puf: Scan,
  dielet: Cpu,
};

type TabId = 'anchors' | 'compartments' | 'supply-chain';

export default function HardwareRootOfTrust() {
  const [activeTab, setActiveTab] = useState<TabId>('anchors');
  const [selectedAnchor, setSelectedAnchor] = useState<string | null>(null);

  const verifiedAnchors = TRUST_ANCHORS.filter((a) => a.status === 'verified').length;
  const avgIntegrity = Math.round(TRUST_ANCHORS.reduce((sum, a) => sum + a.integrityScore, 0) / TRUST_ANCHORS.length * 10) / 10;
  const cheriCompartments = COMPARTMENTS.filter((c) => c.cheriEnforced).length;
  const attestedComponents = SUPPLY_CHAIN.filter((c) => c.attestationStatus === 'attested').length;

  const anchor = TRUST_ANCHORS.find((a) => a.id === selectedAnchor);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold text-white">Hardware Root of Trust</h1>
            <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
              DARPA SSITH / CHERI / SHIELD
            </span>
          </div>
          <p className="text-[13px] text-white/35">
            Hardware-enforced trust anchors, CHERI capability compartments, and supply chain attestation
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white/20" aria-hidden="true">
            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[10px] text-white/20">a11oy orchestrated</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 text-center">
          <p className="text-2xl font-semibold text-emerald-400">{verifiedAnchors}/{TRUST_ANCHORS.length}</p>
          <p className="text-[10px] uppercase tracking-wider text-white/25 mt-0.5">Trust Anchors Verified</p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 text-center">
          <p className="text-2xl font-semibold text-white">{avgIntegrity}%</p>
          <p className="text-[10px] uppercase tracking-wider text-white/25 mt-0.5">Avg Integrity Score</p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 text-center">
          <p className="text-2xl font-semibold text-blue-400">{cheriCompartments}</p>
          <p className="text-[10px] uppercase tracking-wider text-white/25 mt-0.5">CHERI Compartments</p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 text-center">
          <p className="text-2xl font-semibold text-white">{attestedComponents}/{SUPPLY_CHAIN.length}</p>
          <p className="text-[10px] uppercase tracking-wider text-white/25 mt-0.5">Supply Chain Attested</p>
        </div>
      </div>

      <div className="flex gap-2">
        {([['anchors', 'Trust Anchors'], ['compartments', 'CHERI Compartments'], ['supply-chain', 'Supply Chain']] as const).map(([id, label]) => (
          <button
            type="button"
            key={id}
            onClick={() => { setActiveTab(id); setSelectedAnchor(null); }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[12px] border transition-colors',
              activeTab === id
                ? 'bg-white/[0.06] border-white/[0.12] text-white'
                : 'bg-transparent border-white/[0.06] text-white/40 hover:text-white/60',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'anchors' && !anchor && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {TRUST_ANCHORS.map((ta) => {
            const Icon = TYPE_ICONS[ta.type] ?? Shield;
            return (
              <button
                type="button"
                key={ta.id}
                onClick={() => setSelectedAnchor(ta.id)}
                className="text-left bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.04] hover:border-white/[0.10] transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <Icon className="w-5 h-5 text-white/25 group-hover:text-white/50 transition-colors" />
                  <span className={cn('text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border', STATUS_COLORS[ta.status])}>
                    {ta.status}
                  </span>
                </div>
                <h3 className="text-[14px] font-medium text-white mb-1">{ta.name}</h3>
                <p className="text-[11px] font-mono text-white/25 mb-2">{ta.id} · {ta.type.toUpperCase()}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-white/20">{ta.darpaProgram}</span>
                  <span className="text-[12px] font-mono text-emerald-400">{ta.integrityScore}%</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {activeTab === 'anchors' && anchor && (
        <div className="space-y-4">
          <button type="button" onClick={() => setSelectedAnchor(null)} className="text-[12px] text-white/40 hover:text-white/60 transition-colors">← Back to trust anchors</button>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-medium text-white">{anchor.name}</h2>
                <p className="text-[11px] font-mono text-white/25">{anchor.id} · {anchor.type.toUpperCase()} · {anchor.darpaProgram}</p>
              </div>
              <span className={cn('text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border', STATUS_COLORS[anchor.status])}>{anchor.status}</span>
            </div>
            <p className="text-[13px] text-white/45 leading-relaxed mb-4">{anchor.description}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3">
                <p className="text-[10px] font-mono text-white/20 uppercase">Integrity Score</p>
                <p className="text-xl font-semibold text-emerald-400">{anchor.integrityScore}%</p>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3">
                <p className="text-[10px] font-mono text-white/20 uppercase">Last Attestation</p>
                <p className="text-[13px] text-white/60">{new Date(anchor.lastAttestation).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'compartments' && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-5 py-2.5 border-b border-white/[0.04] text-[10px] font-mono uppercase tracking-wider text-white/25">
            <div className="col-span-3">Workcell</div>
            <div className="col-span-3">Permissions</div>
            <div className="col-span-2">Isolation</div>
            <div className="col-span-2">Memory Bounds</div>
            <div className="col-span-2">CHERI</div>
          </div>
          {COMPARTMENTS.map((c) => (
            <div key={c.id} className="grid grid-cols-12 gap-3 items-center px-5 py-3 border-b border-white/[0.03] hover:bg-white/[0.015] transition-colors">
              <div className="col-span-3">
                <p className="text-[12px] text-white/60">{c.workcell}</p>
                <p className="text-[10px] font-mono text-white/20">{c.id}</p>
              </div>
              <div className="col-span-3">
                <div className="flex flex-wrap gap-1">
                  {c.permissions.map((p) => (
                    <span key={p} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/30 border border-white/[0.06]">{p}</span>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <span className={cn('text-[10px] px-2 py-0.5 rounded border', c.isolationLevel === 'hardware' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400')}>
                  {c.isolationLevel}
                </span>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-mono text-white/30">{c.memoryBounds.base}</p>
                <p className="text-[9px] font-mono text-white/15">{c.memoryBounds.length}</p>
              </div>
              <div className="col-span-2">
                {c.cheriEnforced ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400"><Check className="w-3 h-3" /> Enforced</span>
                ) : (
                  <span className="text-[10px] text-white/20">Pending</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'supply-chain' && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-5 py-2.5 border-b border-white/[0.04] text-[10px] font-mono uppercase tracking-wider text-white/25">
            <div className="col-span-3">Component</div>
            <div className="col-span-2">Vendor</div>
            <div className="col-span-1">Type</div>
            <div className="col-span-2">Attestation</div>
            <div className="col-span-1">SHIELD</div>
            <div className="col-span-1">THz</div>
            <div className="col-span-2">Provenance</div>
          </div>
          {SUPPLY_CHAIN.map((sc) => (
            <div key={sc.id} className="grid grid-cols-12 gap-3 items-center px-5 py-3 border-b border-white/[0.03] hover:bg-white/[0.015] transition-colors">
              <div className="col-span-3">
                <p className="text-[12px] text-white/60">{sc.name}</p>
                <p className="text-[10px] font-mono text-white/20">{sc.id}</p>
              </div>
              <div className="col-span-2 text-[11px] text-white/35">{sc.vendor}</div>
              <div className="col-span-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/30 border border-white/[0.06]">{sc.type}</span>
              </div>
              <div className="col-span-2">
                <span className={cn('text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border', STATUS_COLORS[sc.attestationStatus])}>
                  {sc.attestationStatus}
                </span>
              </div>
              <div className="col-span-1">
                {sc.shieldDielet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="text-[10px] text-white/15">—</span>}
              </div>
              <div className="col-span-1">
                {sc.thzInspected ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="text-[10px] text-white/15">—</span>}
              </div>
              <div className="col-span-2 text-[10px] text-white/25 leading-snug">{sc.provenance}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
