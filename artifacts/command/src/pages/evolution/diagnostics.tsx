/**
 * PER — Diagnostics
 *
 * Runtime profile, device capability snapshot, throughput, cache strategy,
 * latency trends, environment mode, simulated-vs-real labelling.
 */

import { useEffect, useState } from 'react';
import { apiUrl, fetchJson } from '../cognitive/shared';

const PER_ACCENT = '#d4a054';

interface DiagnosticsData {
  profile: string;
  environmentMode: string;
  cudaAvailable: boolean;
  bf16Supported: boolean;
  fp8Supported: boolean;
  remoteBackendConfigured: boolean;
  remoteBackendHealthy: boolean;
  inferenceBackend: string;
  trainingBackend: string;
  evaluationBackend: string;
  evolutionMode: string;
  promotionMode: string;
  calibrationMode: string;
  driftGuardActive: boolean;
  throughputTokensPerSec: number;
  avgLatencyMs: number;
  cacheStrategy: string;
  activeJobCount: number;
  queueDepth: number;
  detectedAt: string;
  simulated: boolean;
}

function SimBadge() {
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color: '#f59e0b', background: '#f59e0b18', padding: '2px 8px', borderRadius: 4, border: '1px solid #f59e0b40', letterSpacing: 1 }}>
      SIMULATED
    </span>
  );
}

function CapabilityRow({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1a1d24' }}>
      <span style={{ fontSize: 13, color: '#9ca3af' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: active ? '#22c55e' : '#6b7280' }}>
        {active ? '✓ ' : '✗ '}{value}
      </span>
    </div>
  );
}

const PROFILE_DESCRIPTIONS: Record<string, string> = {
  cpu_safe: 'CPU-only execution. Safe for all environments. No GPU required.',
  cuda_bf16: 'CUDA BF16. Requires NVIDIA GPU (Ampere or later).',
  cuda_fp8_linear: 'CUDA FP8 Linear. Requires NVIDIA Hopper (H100) or later.',
  cuda_fp8_linear_kv: 'CUDA FP8 + KV-cache quantisation. Requires NVIDIA Hopper (H100) or later.',
  remote_accelerated: 'Remote GPU backend. Requires REMOTE_INFERENCE_HEALTH_URL.',
  future_blackwell_path: 'Reserved for NVIDIA Blackwell (B100/B200). Not yet available.',
};

export default function PERDiagnostics() {
  const [data, setData] = useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const resp = await fetchJson<{ ok: boolean; data: DiagnosticsData }>(apiUrl('/evolution/diagnostics'));
        setData(resp.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load diagnostics');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) return <div style={{ padding: 40, color: '#6b7280' }}>Running diagnostics…</div>;
  if (error || !data) return <div style={{ padding: 40, color: '#ef4444' }}>Error: {error ?? 'No data'}</div>;

  return (
    <div style={{ padding: 32, background: '#080a0d', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f9fafb', margin: 0 }}>Diagnostics</h1>
        {data.simulated && <SimBadge />}
      </div>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 32, margin: '0 0 32px' }}>
        Runtime profile · Device capabilities · Throughput · Cache strategy · Environment mode
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: '#0f1015', border: '1px solid #1e2028', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
            Active Precision Profile
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: PER_ACCENT, marginBottom: 8 }}>
            {data.profile}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
            {PROFILE_DESCRIPTIONS[data.profile] ?? data.profile}
          </div>
          <div style={{ marginTop: 16, padding: '8px 12px', background: '#090c10', borderRadius: 6 }}>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Environment Mode</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f9fafb', marginTop: 2 }}>{data.environmentMode}</div>
          </div>
        </div>

        <div style={{ background: '#0f1015', border: '1px solid #1e2028', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            Device Capabilities
          </div>
          <CapabilityRow label="CUDA Available" value={data.cudaAvailable ? 'Yes' : 'No'} active={data.cudaAvailable} />
          <CapabilityRow label="BF16 Supported" value={data.bf16Supported ? 'Yes' : 'No'} active={data.bf16Supported} />
          <CapabilityRow label="FP8 Supported" value={data.fp8Supported ? 'Yes' : 'No'} active={data.fp8Supported} />
          <CapabilityRow label="Remote Backend Configured" value={data.remoteBackendConfigured ? 'Yes' : 'No'} active={data.remoteBackendConfigured} />
          <CapabilityRow label="Remote Backend Healthy" value={data.remoteBackendHealthy ? 'Yes' : 'No'} active={data.remoteBackendHealthy} />
          {data.simulated && (
            <div style={{ marginTop: 10, fontSize: 10, color: '#f59e0b', padding: '4px 8px', background: '#f59e0b08', borderRadius: 4 }}>
              ⚠ All capability flags reflect simulated environment. No GPU present.
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Throughput', value: `${data.throughputTokensPerSec?.toFixed(0) ?? '—'} tok/s`, color: '#22c55e' },
          { label: 'Avg Latency', value: `${data.avgLatencyMs?.toFixed(0) ?? '—'} ms`, color: '#f9fafb' },
          { label: 'Cache Strategy', value: data.cacheStrategy ?? '—', color: '#60a5fa' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#0f1015', border: '1px solid #1e2028', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color, marginTop: 8 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#0f1015', border: '1px solid #1e2028', borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
          Configuration
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { label: 'Evolution Mode', value: data.evolutionMode },
            { label: 'Promotion Mode', value: data.promotionMode },
            { label: 'Calibration Mode', value: data.calibrationMode },
            { label: 'Inference Backend', value: data.inferenceBackend },
            { label: 'Training Backend', value: data.trainingBackend },
            { label: 'Evaluation Backend', value: data.evaluationBackend },
            { label: 'Drift Guard', value: data.driftGuardActive ? 'Active' : 'Disabled' },
            { label: 'Active Jobs', value: String(data.activeJobCount ?? 0) },
            { label: 'Queue Depth', value: String(data.queueDepth ?? 0) },
          ].map((item) => (
            <div key={item.label} style={{ background: '#090c10', borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>{item.label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f9fafb', marginTop: 4 }}>{item.value}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, fontSize: 11, color: '#6b7280' }}>
          Snapshot taken: {data.detectedAt ? new Date(data.detectedAt).toLocaleString() : 'unknown'}
        </div>
      </div>
    </div>
  );
}
