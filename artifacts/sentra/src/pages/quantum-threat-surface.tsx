import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Lock,
  Shield,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { PageHeader, SeverityChip } from '@/lib/data-provenance';
import {
  quantumCryptoInventory,
  type MigrationStatus,
  type QuantumCryptoInventory,
} from '@/data/quantum-resilience';

const migrationColor: Record<MigrationStatus, string> = {
  migrated: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  in_progress: 'bg-[#c9b787]/10 text-[#c9b787] border-[#c9b787]/30',
  planned: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  not_started: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  blocked: 'bg-[#f5f5f5]/10 text-[#f5f5f5] border-[#f5f5f5]/30',
};

const migrationIcon: Record<MigrationStatus, typeof CheckCircle2> = {
  migrated: CheckCircle2,
  in_progress: ArrowRight,
  planned: Clock,
  not_started: XCircle,
  blocked: AlertTriangle,
};

function MigrationBadge({ status }: { status: MigrationStatus }) {
  const Icon = migrationIcon[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${migrationColor[status]}`}
    >
      <Icon className="w-2.5 h-2.5" />
      {status.replace(/_/g, ' ').toUpperCase()}
    </span>
  );
}

function daysUntil(iso: string): number {
  return Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

function InventoryRow({ item }: { item: QuantumCryptoInventory }) {
  const [expanded, setExpanded] = useState(false);
  const certDays = daysUntil(item.certificateExpiry);

  return (
    <>
      <tr
        className="hover:bg-slate-800/30 transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-5 py-4">
          <div className="font-bold text-slate-200 text-sm">{item.system}</div>
          <div className="text-[10px] text-slate-500 font-mono uppercase">{item.id}</div>
        </td>
        <td className="px-5 py-4">
          <span className="text-xs font-mono text-[#f5f5f5]">{item.currentAlgorithm}</span>
        </td>
        <td className="px-5 py-4">
          <div className="flex items-center gap-1.5">
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className="text-xs font-mono text-emerald-400">{item.targetAlgorithm}</span>
          </div>
        </td>
        <td className="px-5 py-4">
          <MigrationBadge status={item.migrationStatus} />
        </td>
        <td className="px-5 py-4">
          <SeverityChip severity={item.quantumRiskLevel} />
        </td>
        <td className="px-5 py-4">
          <span
            className={`text-xs font-mono ${certDays < 90 ? 'text-[#f5f5f5]' : certDays < 180 ? 'text-[#c9b787]' : 'text-slate-400'}`}
          >
            {certDays}d
          </span>
        </td>
        <td className="px-5 py-4">
          {item.harvestNowDecryptLaterRisk ? (
            <span className="px-2 py-0.5 rounded bg-[#f5f5f5]/10 border border-[#f5f5f5]/20 text-[10px] text-[#f5f5f5] font-mono">
              HNDL RISK
            </span>
          ) : (
            <span className="text-[10px] text-slate-600 font-mono">—</span>
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-900/60">
          <td colSpan={7} className="px-8 py-4 border-b border-slate-800">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Environment</div>
                <div className="text-slate-300 font-mono">{item.environment.toUpperCase()}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Owner</div>
                <div className="text-slate-300">{item.owner}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Data Classification</div>
                <div className="text-slate-300 font-mono">{item.dataClassification.replace(/_/g, ' ').toUpperCase()}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Est. Qbit Threshold</div>
                <div className="text-slate-300 font-mono">{item.estimatedQbitThreshold.toLocaleString()} logical qubits</div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function QuantumThreatSurface() {
  const migrated = quantumCryptoInventory.filter((i) => i.migrationStatus === 'migrated').length;
  const inProgress = quantumCryptoInventory.filter((i) => i.migrationStatus === 'in_progress').length;
  const hndlCount = quantumCryptoInventory.filter((i) => i.harvestNowDecryptLaterRisk).length;
  const criticalCount = quantumCryptoInventory.filter((i) => i.quantumRiskLevel === 'critical').length;
  const pct = Math.round((migrated / quantumCryptoInventory.length) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Quantum Threat Surface"
        subtitle="Post-quantum cryptography migration readiness and quantum attack timeline projections"
        provenance="seed"
        provenanceLabel="Demo Data"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="sentra-panel p-4 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">PQC Migration</div>
          <div className="text-2xl font-display font-bold text-emerald-400">{pct}%</div>
          <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="sentra-panel p-4 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">In Progress</div>
          <div className="text-2xl font-display font-bold text-[#c9b787]">{inProgress}</div>
        </div>
        <div className="sentra-panel p-4 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Critical Risk</div>
          <div className="text-2xl font-display font-bold text-[#f5f5f5]">{criticalCount}</div>
        </div>
        <div className="sentra-panel p-4 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">HNDL Exposed</div>
          <div className="text-2xl font-display font-bold text-[#f5f5f5]">{hndlCount}</div>
        </div>
      </div>

      <div className="sentra-panel p-5 space-y-3">
        <h2 className="text-sm font-display font-bold flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#f5f5f5]" />
          Quantum Attack Timeline Projection
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'RSA-2048 Break', years: '~7 years', qubits: '4,099', risk: 'critical' as const },
            { label: 'ECDSA-P256 Break', years: '~5 years', qubits: '2,330', risk: 'critical' as const },
            { label: 'AES-128 Grover Speedup', years: '~12 years', qubits: '6,681', risk: 'high' as const },
          ].map((t) => (
            <div key={t.label} className="sentra-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">{t.label}</span>
                <SeverityChip severity={t.risk} />
              </div>
              <div className="text-2xl font-display font-bold text-slate-100">{t.years}</div>
              <div className="text-[10px] text-slate-500 font-mono">
                Est. {t.qubits} logical qubits required
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#f5f5f5]"
                  style={{ width: t.risk === 'critical' ? '75%' : '40%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sentra-panel overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50 border-b border-[#f5f5f5]/10 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
              <th className="px-5 py-4 font-medium">System</th>
              <th className="px-5 py-4 font-medium">Current</th>
              <th className="px-5 py-4 font-medium">Target (PQC)</th>
              <th className="px-5 py-4 font-medium">Migration</th>
              <th className="px-5 py-4 font-medium">Risk</th>
              <th className="px-5 py-4 font-medium">Cert Expiry</th>
              <th className="px-5 py-4 font-medium">HNDL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {quantumCryptoInventory.map((item) => (
              <InventoryRow key={item.id} item={item} />
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-slate-800 text-[10px] text-slate-600 font-mono">
          {quantumCryptoInventory.length} cryptographic systems tracked · Click row for details
        </div>
      </div>
    </div>
  );
}
