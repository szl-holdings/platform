import { Activity, Cpu, Gauge, Thermometer, Zap } from 'lucide-react';

const BG = { page: 'var(--gi-bg-base)', surface: 'var(--gi-bg-surface)', elevated: 'var(--gi-bg-raised)' };
const BORDER = { subtle: 'rgba(255,255,255,0.04)', muted: 'rgba(255,255,255,0.06)' };
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
};
const GOLD = '#d4a054';
const GREEN = '#5fa364';
const AMBER = '#c8953c';

interface FleetRow {
  id: string;
  cluster: string;
  gpus: number;
  utilizationPct: number;
  tempC: number;
  powerKw: number;
  status: 'healthy' | 'warm' | 'saturated';
}

const FLEET: FleetRow[] = [
  { id: 'g1', cluster: 'us-east / a100-pool-01', gpus: 64, utilizationPct: 78, tempC: 71, powerKw: 18.4, status: 'healthy' },
  { id: 'g2', cluster: 'us-east / h100-pool-02', gpus: 32, utilizationPct: 92, tempC: 79, powerKw: 21.1, status: 'warm' },
  { id: 'g3', cluster: 'us-west / a100-pool-03', gpus: 48, utilizationPct: 64, tempC: 68, powerKw: 13.2, status: 'healthy' },
  { id: 'g4', cluster: 'eu-central / l40s-pool-04', gpus: 24, utilizationPct: 97, tempC: 84, powerKw: 9.6, status: 'saturated' },
];

const STATUS_COLOR: Record<FleetRow['status'], string> = {
  healthy: GREEN,
  warm: AMBER,
  saturated: '#c45a4a',
};

function Stat({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon: typeof Cpu }) {
  return (
    <div
      style={{
        background: BG.elevated,
        border: `1px solid ${BORDER.subtle}`,
        borderRadius: 10,
        padding: '14px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Icon size={14} color={GOLD} />
        <div style={{ color: TEXT.secondary, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' }}>{label}</div>
      </div>
      <div style={{ color: TEXT.primary, fontSize: 22, fontWeight: 600 }}>{value}</div>
      {sub ? <div style={{ color: TEXT.tertiary, fontSize: 11, marginTop: 4 }}>{sub}</div> : null}
    </div>
  );
}

export default function GpuObservatoryPage() {
  const totalGpus = FLEET.reduce((s, r) => s + r.gpus, 0);
  const avgUtil = Math.round(FLEET.reduce((s, r) => s + r.utilizationPct, 0) / FLEET.length);
  const totalPower = FLEET.reduce((s, r) => s + r.powerKw, 0).toFixed(1);

  return (
    <div style={{ background: BG.page, minHeight: '100vh', padding: '24px 28px' }}>
      <header style={{ marginBottom: 20 }}>
        <div style={{ color: TEXT.tertiary, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6 }}>
          OPERATIONS · OBSERVABILITY
        </div>
        <h1 style={{ color: TEXT.primary, fontSize: 22, fontWeight: 600, margin: 0 }}>GPU & AI Observatory</h1>
        <div style={{ color: TEXT.secondary, fontSize: 13, marginTop: 6, maxWidth: 720 }}>
          Cross-region GPU fleet utilization, thermals, and power draw. Use this surface to spot saturated pools
          before training jobs queue and to right-size capacity ahead of the next inference scale-up.
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 20 }}>
        <Stat label="Total GPUs" value={String(totalGpus)} sub="across 4 pools" icon={Cpu} />
        <Stat label="Avg utilization" value={`${avgUtil}%`} sub="rolling 5 min" icon={Gauge} />
        <Stat label="Total power" value={`${totalPower} kW`} sub="live draw" icon={Zap} />
        <Stat label="Saturated pools" value={String(FLEET.filter((r) => r.status === 'saturated').length)} sub="needs attention" icon={Activity} />
      </div>

      <section
        style={{
          background: BG.surface,
          border: `1px solid ${BORDER.muted}`,
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div style={{ color: TEXT.primary, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Fleet status</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ color: TEXT.tertiary, textAlign: 'left' }}>
              <th style={{ padding: '8px 10px', borderBottom: `1px solid ${BORDER.subtle}`, fontWeight: 500 }}>Cluster</th>
              <th style={{ padding: '8px 10px', borderBottom: `1px solid ${BORDER.subtle}`, fontWeight: 500 }}>GPUs</th>
              <th style={{ padding: '8px 10px', borderBottom: `1px solid ${BORDER.subtle}`, fontWeight: 500 }}>Util</th>
              <th style={{ padding: '8px 10px', borderBottom: `1px solid ${BORDER.subtle}`, fontWeight: 500 }}>Temp</th>
              <th style={{ padding: '8px 10px', borderBottom: `1px solid ${BORDER.subtle}`, fontWeight: 500 }}>Power</th>
              <th style={{ padding: '8px 10px', borderBottom: `1px solid ${BORDER.subtle}`, fontWeight: 500 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {FLEET.map((row) => (
              <tr key={row.id}>
                <td style={{ padding: '10px', color: TEXT.primary, borderBottom: `1px solid ${BORDER.subtle}` }}>{row.cluster}</td>
                <td style={{ padding: '10px', color: TEXT.primary, borderBottom: `1px solid ${BORDER.subtle}` }}>{row.gpus}</td>
                <td style={{ padding: '10px', color: TEXT.primary, borderBottom: `1px solid ${BORDER.subtle}` }}>{row.utilizationPct}%</td>
                <td style={{ padding: '10px', color: TEXT.secondary, borderBottom: `1px solid ${BORDER.subtle}` }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Thermometer size={12} color={row.tempC >= 80 ? '#c45a4a' : row.tempC >= 75 ? AMBER : TEXT.tertiary} />
                    {row.tempC}°C
                  </span>
                </td>
                <td style={{ padding: '10px', color: TEXT.secondary, borderBottom: `1px solid ${BORDER.subtle}` }}>{row.powerKw} kW</td>
                <td style={{ padding: '10px', borderBottom: `1px solid ${BORDER.subtle}` }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: `${STATUS_COLOR[row.status]}1f`,
                      color: STATUS_COLOR[row.status],
                      fontSize: 11,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ color: TEXT.tertiary, fontSize: 11, marginTop: 12 }}>
          Live integration with the GPU telemetry exporter is on the roadmap. Current values are illustrative
          baselines representative of steady-state production load.
        </div>
      </section>
    </div>
  );
}
