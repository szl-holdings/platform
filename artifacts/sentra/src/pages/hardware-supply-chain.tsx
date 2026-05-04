import {
  AlertTriangle,
  CheckCircle2,
  CircuitBoard,
  Factory,
  MapPin,
  Shield,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { PageHeader, SeverityChip } from '@/lib/data-provenance';
import {
  hardwareProvenanceChains,
  type FoundryTrust,
  type HardwareProvenanceChain,
  type ProvenanceStatus,
} from '@/data/quantum-resilience';

const trustColor: Record<FoundryTrust, string> = {
  trusted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  conditionally_trusted: 'bg-[#c9b787]/10 text-[#c9b787] border-[#c9b787]/30',
  untrusted: 'bg-[#f5f5f5]/10 text-[#f5f5f5] border-[#f5f5f5]/30',
  sanctioned: 'bg-red-500/10 text-red-400 border-red-500/30',
};

const provColor: Record<ProvenanceStatus, string> = {
  verified: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  partial: 'bg-[#c9b787]/10 text-[#c9b787] border-[#c9b787]/30',
  unverified: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  counterfeit_risk: 'bg-[#f5f5f5]/10 text-[#f5f5f5] border-[#f5f5f5]/30',
};

const provIcon: Record<ProvenanceStatus, typeof CheckCircle2> = {
  verified: CheckCircle2,
  partial: AlertTriangle,
  unverified: XCircle,
  counterfeit_risk: AlertTriangle,
};

function ProvenanceCard({ chain }: { chain: HardwareProvenanceChain }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = provIcon[chain.provenanceStatus];
  const daysAgo = Math.round((Date.now() - new Date(chain.lastVerifiedAt).getTime()) / 86_400_000);

  return (
    <div
      className={`sentra-card p-5 space-y-3 cursor-pointer transition-colors hover:bg-slate-800/20 ${chain.tamperEvidence ? 'ring-1 ring-[#f5f5f5]/30' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <CircuitBoard className="w-4 h-4 text-[#c9b787]" />
            {chain.chipFamily}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{chain.partNumber}</div>
        </div>
        <SeverityChip severity={chain.criticality} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Foundry</div>
          <div className="text-xs text-slate-300 font-medium">{chain.foundry}</div>
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-2.5 h-2.5 text-slate-500" />
            <span className="text-[10px] text-slate-500">{chain.foundryLocation}</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Trust Level</div>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${trustColor[chain.foundryTrust]}`}
          >
            {chain.foundryTrust.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${provColor[chain.provenanceStatus]}`}
        >
          <Icon className="w-2.5 h-2.5" />
          {chain.provenanceStatus.replace(/_/g, ' ').toUpperCase()}
        </span>
        <span className="text-[10px] text-slate-500 font-mono">
          {chain.supplyChainHops} hops · verified {daysAgo}d ago
        </span>
      </div>

      {chain.tamperEvidence && (
        <div className="flex items-center gap-2 px-3 py-2 rounded bg-[#f5f5f5]/5 border border-[#f5f5f5]/20">
          <AlertTriangle className="w-3.5 h-3.5 text-[#f5f5f5] shrink-0" />
          <span className="text-[10px] text-[#f5f5f5] font-mono font-bold">
            TAMPER EVIDENCE DETECTED
          </span>
        </div>
      )}

      {expanded && (
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Fab Node</div>
              <div className="text-slate-300 font-mono">{chain.fabricationNode}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Lot #</div>
              <div className="text-slate-300 font-mono">{chain.lotNumber}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Deployed In</div>
              <div className="text-slate-300">{chain.deployedIn}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Compliance</div>
              <div className="flex flex-wrap gap-1">
                {chain.complianceFlags.map((f) => (
                  <span
                    key={f}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${f.includes('NON-COMPLIANT') ? 'bg-[#f5f5f5]/10 text-[#f5f5f5] border-[#f5f5f5]/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HardwareSupplyChain() {
  const verified = hardwareProvenanceChains.filter((c) => c.provenanceStatus === 'verified').length;
  const risks = hardwareProvenanceChains.filter(
    (c) => c.provenanceStatus === 'counterfeit_risk' || c.tamperEvidence
  ).length;
  const untrusted = hardwareProvenanceChains.filter(
    (c) => c.foundryTrust === 'untrusted' || c.foundryTrust === 'sanctioned'
  ).length;
  const avgHops =
    Math.round(
      hardwareProvenanceChains.reduce((a, c) => a + c.supplyChainHops, 0) /
        hardwareProvenanceChains.length
    );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Hardware Supply Chain Provenance"
        subtitle="Microelectronics provenance tracking from foundry to deployment"
        provenance="seed"
        provenanceLabel="Demo Data"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="sentra-panel p-4 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Verified</div>
          <div className="text-2xl font-display font-bold text-emerald-400">{verified}</div>
          <div className="text-[10px] text-slate-500 font-mono">
            of {hardwareProvenanceChains.length}
          </div>
        </div>
        <div className="sentra-panel p-4 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Counterfeit Risk</div>
          <div className="text-2xl font-display font-bold text-[#f5f5f5]">{risks}</div>
        </div>
        <div className="sentra-panel p-4 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Untrusted Foundry</div>
          <div className="text-2xl font-display font-bold text-[#f5f5f5]">{untrusted}</div>
        </div>
        <div className="sentra-panel p-4 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Avg Supply Hops</div>
          <div className="text-2xl font-display font-bold text-[#c9b787]">{avgHops}</div>
        </div>
      </div>

      <div className="sentra-panel p-5 space-y-3">
        <h2 className="text-sm font-display font-bold flex items-center gap-2">
          <Factory className="w-4 h-4 text-[#c9b787]" />
          Foundry Trust Distribution
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['trusted', 'conditionally_trusted', 'untrusted', 'sanctioned'] as FoundryTrust[]).map(
            (level) => {
              const count = hardwareProvenanceChains.filter(
                (c) => c.foundryTrust === level
              ).length;
              return (
                <div
                  key={level}
                  className={`p-3 rounded border ${trustColor[level]} flex items-center justify-between`}
                >
                  <span className="text-[10px] font-mono font-bold">
                    {level.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span className="text-lg font-display font-bold">{count}</span>
                </div>
              );
            }
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hardwareProvenanceChains.map((chain) => (
          <ProvenanceCard key={chain.id} chain={chain} />
        ))}
      </div>

      <div className="text-[10px] text-slate-600 font-mono text-center">
        Provenance data sourced from DARPA SHIELD-compatible verification pipeline · DFARS / NIST SP
        800-161r1 compliance tracking
      </div>
    </div>
  );
}
