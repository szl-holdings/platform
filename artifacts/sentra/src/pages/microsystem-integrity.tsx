import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Fingerprint,
  Shield,
  XCircle,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { PageHeader, SeverityChip } from '@/lib/data-provenance';
import {
  microsystemIntegrityRecords,
  type AttestationResult,
  type MicrosystemIntegrityRecord,
} from '@/data/quantum-resilience';

const attestColor: Record<AttestationResult, string> = {
  pass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  fail: 'bg-[#f5f5f5]/10 text-[#f5f5f5] border-[#f5f5f5]/30',
  degraded: 'bg-[#c9b787]/10 text-[#c9b787] border-[#c9b787]/30',
  unavailable: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

const attestIcon: Record<AttestationResult, typeof CheckCircle2> = {
  pass: CheckCircle2,
  fail: XCircle,
  degraded: AlertTriangle,
  unavailable: XCircle,
};

function anomalyColor(score: number): string {
  if (score >= 80) return '#f5f5f5';
  if (score >= 50) return '#c9b787';
  if (score >= 30) return '#c9b787';
  return '#8a8a8a';
}

function DeviceCard({ record }: { record: MicrosystemIntegrityRecord }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = attestIcon[record.attestationResult];
  const hoursAgo = Math.round(
    (Date.now() - new Date(record.lastAttestationAt).getTime()) / 3_600_000
  );

  return (
    <div
      className={`sentra-card p-5 space-y-3 cursor-pointer transition-colors hover:bg-slate-800/20 ${record.anomalyScore >= 80 ? 'ring-1 ring-[#f5f5f5]/30' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#c9b787]" />
            {record.device}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {record.deviceType.replace(/_/g, ' ').toUpperCase()} · {record.zone}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="text-lg font-display font-bold"
            style={{ color: anomalyColor(record.anomalyScore) }}
          >
            {record.anomalyScore}
          </div>
          <div className="text-[9px] text-slate-500 font-mono">ANOMALY</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Attestation</div>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${attestColor[record.attestationResult]}`}
          >
            <Icon className="w-2.5 h-2.5" />
            {record.attestationResult.toUpperCase()}
          </span>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Root of Trust</div>
          <span className="text-xs font-mono text-slate-300">
            {record.rootOfTrustType === 'none' ? (
              <span className="text-[#f5f5f5]">NONE</span>
            ) : (
              record.rootOfTrustType.toUpperCase()
            )}
          </span>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Patch Level</div>
          <span
            className={`text-xs font-mono ${record.patchLevel === 'current' ? 'text-emerald-400' : record.patchLevel === 'behind' ? 'text-[#c9b787]' : 'text-[#f5f5f5]'}`}
          >
            {record.patchLevel.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {record.sideChannelAlerts.length > 0 && (
        <div className="space-y-2">
          {record.sideChannelAlerts.map((alert, i) => (
            <div
              key={i}
              className="flex items-start gap-2 px-3 py-2 rounded bg-[#f5f5f5]/5 border border-[#f5f5f5]/15"
            >
              <Zap className="w-3.5 h-3.5 text-[#f5f5f5] mt-0.5 shrink-0" />
              <div>
                <div className="text-[10px] font-mono font-bold text-[#f5f5f5]">
                  {alert.type.toUpperCase()} SIDE-CHANNEL · {alert.confidence}% confidence
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{alert.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-[10px] text-slate-600 font-mono">
        Last attestation: {hoursAgo}h ago · FW {record.firmwareVersion}
      </div>

      {expanded && (
        <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Firmware Hash</div>
              <div className="text-slate-400 font-mono text-[10px]">{record.firmwareHash}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Device ID</div>
              <div className="text-slate-400 font-mono text-[10px]">{record.id}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MicrosystemIntegrity() {
  const passing = microsystemIntegrityRecords.filter((r) => r.attestationResult === 'pass').length;
  const failing = microsystemIntegrityRecords.filter((r) => r.attestationResult === 'fail').length;
  const sideChannelTotal = microsystemIntegrityRecords.reduce(
    (a, r) => a + r.sideChannelAlerts.length,
    0
  );
  const avgAnomaly = Math.round(
    microsystemIntegrityRecords.reduce((a, r) => a + r.anomalyScore, 0) /
      microsystemIntegrityRecords.length
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Microsystem Integrity Monitor"
        subtitle="Firmware attestation, hardware root of trust verification, and side-channel attack detection"
        provenance="seed"
        provenanceLabel="Demo Data"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="sentra-panel p-4 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Attestation Pass</div>
          <div className="text-2xl font-display font-bold text-emerald-400">{passing}</div>
          <div className="text-[10px] text-slate-500 font-mono">
            of {microsystemIntegrityRecords.length}
          </div>
        </div>
        <div className="sentra-panel p-4 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Attestation Fail</div>
          <div className="text-2xl font-display font-bold text-[#f5f5f5]">{failing}</div>
        </div>
        <div className="sentra-panel p-4 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Side-Channel Alerts</div>
          <div className="text-2xl font-display font-bold text-[#f5f5f5]">{sideChannelTotal}</div>
        </div>
        <div className="sentra-panel p-4 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Avg Anomaly Score</div>
          <div
            className="text-2xl font-display font-bold"
            style={{ color: anomalyColor(avgAnomaly) }}
          >
            {avgAnomaly}
          </div>
        </div>
      </div>

      <div className="sentra-panel p-5 space-y-3">
        <h2 className="text-sm font-display font-bold flex items-center gap-2">
          <Fingerprint className="w-4 h-4 text-[#c9b787]" />
          Attestation Status by Root of Trust
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {['tpm_2.0', 'secure_enclave', 'puf', 'dice', 'none'].map((rot) => {
            const devices = microsystemIntegrityRecords.filter((r) => r.rootOfTrustType === rot);
            const passCount = devices.filter((d) => d.attestationResult === 'pass').length;
            return (
              <div key={rot} className="sentra-card p-3 text-center">
                <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">
                  {rot === 'none' ? 'NO RoT' : rot.replace(/_/g, ' ').toUpperCase()}
                </div>
                <div className="text-lg font-display font-bold text-slate-200">
                  {passCount}/{devices.length}
                </div>
                <div className="text-[9px] text-slate-600 font-mono">PASSING</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {microsystemIntegrityRecords
          .sort((a, b) => b.anomalyScore - a.anomalyScore)
          .map((record) => (
            <DeviceCard key={record.id} record={record} />
          ))}
      </div>

      <div className="text-[10px] text-slate-600 font-mono text-center">
        Hardware attestation via NIST SP 800-193 · Side-channel detection powered by silicon-level anomaly correlation
      </div>
    </div>
  );
}
