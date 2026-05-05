import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Radio,
  Waves,
  Wifi,
  XCircle,
} from 'lucide-react';
import { useCallback } from 'react';
import { PageHeader } from '@/lib/data-provenance';
import {
  photonicSensorNodes as fallbackNodes,
  type PhotonicSensorNode,
  type SensorHealth,
} from '@/data/quantum-resilience';
import { listPhotonicSensorNodes } from '@/lib/sentra-api';
import { SourceBadge, useApiQuery } from '@/lib/use-api-query';

const healthColor: Record<SensorHealth, string> = {
  optimal: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  degraded: 'bg-[#c9b787]/10 text-[#c9b787] border-[#c9b787]/30',
  calibration_needed: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  offline: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  compromised: 'bg-[#f5f5f5]/10 text-[#f5f5f5] border-[#f5f5f5]/30',
};

const healthIcon: Record<SensorHealth, typeof CheckCircle2> = {
  optimal: CheckCircle2,
  degraded: AlertTriangle,
  calibration_needed: Activity,
  offline: XCircle,
  compromised: AlertTriangle,
};

function SensorCard({ node }: { node: PhotonicSensorNode }) {
  const Icon = healthIcon[node.health];
  const daysAgo = Math.round(
    (Date.now() - new Date(node.lastCalibrationAt).getTime()) / 86_400_000
  );

  return (
    <div
      className={`sentra-card p-5 space-y-4 ${node.eavesdroppingDetected ? 'ring-1 ring-[#f5f5f5]/40' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Waves className="w-4 h-4 text-[#c9b787]" />
            {node.name}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {node.type.replace(/_/g, ' ').toUpperCase()}
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${healthColor[node.health]}`}
        >
          <Icon className="w-2.5 h-2.5" />
          {node.health.replace(/_/g, ' ').toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Location</div>
          <div className="text-xs text-slate-300">{node.location}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Wavelength</div>
          <div className="text-xs text-slate-300 font-mono">{node.wavelength}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">SNR</div>
          <div
            className="text-lg font-display font-bold"
            style={{
              color: node.signalToNoiseRatio > 25 ? '#c9b787' : node.signalToNoiseRatio > 15 ? '#c9b787' : '#f5f5f5',
            }}
          >
            {node.signalToNoiseRatio}
          </div>
          <div className="text-[9px] text-slate-600 font-mono">dB</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">QBER</div>
          <div
            className="text-lg font-display font-bold"
            style={{
              color: node.quantumBitErrorRate < 2 ? '#c9b787' : node.quantumBitErrorRate < 5 ? '#c9b787' : '#f5f5f5',
            }}
          >
            {node.quantumBitErrorRate}%
          </div>
          <div className="text-[9px] text-slate-600 font-mono">error rate</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Throughput</div>
          <div className="text-lg font-display font-bold text-slate-200">
            {node.throughputGbps}
          </div>
          <div className="text-[9px] text-slate-600 font-mono">Gbps</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Drift</div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, node.driftPercentage * 5)}%`,
                  background:
                    node.driftPercentage < 2
                      ? '#34d399'
                      : node.driftPercentage < 5
                        ? '#c9b787'
                        : '#f5f5f5',
                }}
              />
            </div>
            <span
              className="text-xs font-mono"
              style={{
                color:
                  node.driftPercentage < 2
                    ? '#34d399'
                    : node.driftPercentage < 5
                      ? '#c9b787'
                      : '#f5f5f5',
              }}
            >
              {node.driftPercentage}%
            </span>
          </div>
        </div>
        <div className="text-[10px] text-slate-600 font-mono">
          Cal: {daysAgo}d ago
        </div>
      </div>

      {node.eavesdroppingDetected && (
        <div className="flex items-center gap-2 px-3 py-2 rounded bg-[#f5f5f5]/5 border border-[#f5f5f5]/20">
          <AlertTriangle className="w-3.5 h-3.5 text-[#f5f5f5] shrink-0" />
          <span className="text-[10px] text-[#f5f5f5] font-mono font-bold">
            EAVESDROPPING DETECTED — Channel security compromised
          </span>
        </div>
      )}

      <div className="text-[10px] text-slate-600 font-mono">
        Channel: {node.linkedChannelId}
      </div>
    </div>
  );
}

export default function PhotonicSensorGrid() {
  const fetcher = useCallback(() => listPhotonicSensorNodes(), []);
  const { data: photonicSensorNodes, source } = useApiQuery<PhotonicSensorNode[]>(fetcher, 'nodes', fallbackNodes);

  const optimal = photonicSensorNodes.filter((n) => n.health === 'optimal').length;
  const compromised = photonicSensorNodes.filter((n) => n.health === 'compromised').length;
  const eavesdropping = photonicSensorNodes.filter((n) => n.eavesdroppingDetected).length;
  const avgQber = photonicSensorNodes.length > 0 ?
    Math.round(
      (photonicSensorNodes.reduce((a, n) => a + n.quantumBitErrorRate, 0) /
        photonicSensorNodes.length) *
        10
    ) / 10 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Photonic & Quantum Sensor Grid"
        subtitle="Photonic interconnect monitoring, QKD channel security, and sensor calibration tracking"
        provenance={source}
        provenanceLabel={source === 'live' ? 'Live API' : 'Seed Data'}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="sentra-panel p-4 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Optimal Nodes</div>
          <div className="text-2xl font-display font-bold text-emerald-400">{optimal}</div>
          <div className="text-[10px] text-slate-500 font-mono">
            of {photonicSensorNodes.length}
          </div>
        </div>
        <div className="sentra-panel p-4 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Compromised</div>
          <div className="text-2xl font-display font-bold text-[#f5f5f5]">{compromised}</div>
        </div>
        <div className="sentra-panel p-4 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Eavesdrop Alerts</div>
          <div className="text-2xl font-display font-bold text-[#f5f5f5]">{eavesdropping}</div>
        </div>
        <div className="sentra-panel p-4 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Avg QBER</div>
          <div
            className="text-2xl font-display font-bold"
            style={{ color: avgQber < 3 ? '#c9b787' : '#f5f5f5' }}
          >
            {avgQber}%
          </div>
        </div>
      </div>

      <div className="sentra-panel p-5 space-y-3">
        <h2 className="text-sm font-display font-bold flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#c9b787]" />
          Channel Health Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from(new Set(photonicSensorNodes.map((n) => n.linkedChannelId))).map((chId) => {
            const nodes = photonicSensorNodes.filter((n) => n.linkedChannelId === chId);
            const worstHealth = nodes.some((n) => n.health === 'compromised')
              ? 'compromised'
              : nodes.some((n) => n.health === 'degraded')
                ? 'degraded'
                : nodes.some((n) => n.health === 'calibration_needed')
                  ? 'calibration_needed'
                  : 'optimal';
            const ChIcon = healthIcon[worstHealth];
            return (
              <div key={chId} className="sentra-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-200">{chId}</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${healthColor[worstHealth]}`}
                  >
                    <ChIcon className="w-2.5 h-2.5" />
                    {worstHealth.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {nodes.length} node{nodes.length > 1 ? 's' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {photonicSensorNodes.map((node) => (
          <SensorCard key={node.id} node={node} />
        ))}
      </div>

      <div className="text-[10px] text-slate-600 font-mono text-center">
        Photonic infrastructure monitoring · QKD security per ETSI GS QKD 014 · Drift thresholds calibrated per ITU-T G.694.1
      </div>
    </div>
  );
}
