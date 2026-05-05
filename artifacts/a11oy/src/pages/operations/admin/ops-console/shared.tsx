import { AlertTriangle, CheckCircle, WifiOff } from 'lucide-react';

export const BG = { card: 'rgba(255,255,255,0.025)', cardHover: 'rgba(255,255,255,0.04)', section: 'rgba(255,255,255,0.015)' };
export const BORDER = { subtle: 'rgba(255,255,255,0.06)', muted: 'rgba(255,255,255,0.04)' };
export const TEXT = { primary: 'rgba(255,255,255,0.88)', secondary: 'rgba(255,255,255,0.5)', tertiary: 'rgba(255,255,255,0.28)', muted: 'rgba(255,255,255,0.14)' };

export function StatusBadge({ status }: { status: 'healthy' | 'degraded' | 'down' | string }) {
  const map: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    healthy: { label: 'Healthy', color: '#6b8f71', bg: 'rgba(107,143,113,0.1)', dot: '#6b8f71' },
    degraded: { label: 'Degraded', color: '#d4a054', bg: 'rgba(212,160,84,0.1)', dot: '#d4a054' },
    down: { label: 'Down', color: '#c45a4a', bg: 'rgba(196,90,74,0.1)', dot: '#c45a4a' },
    ok: { label: 'OK', color: '#6b8f71', bg: 'rgba(107,143,113,0.1)', dot: '#6b8f71' },
    active: { label: 'Active', color: '#6b8f71', bg: 'rgba(107,143,113,0.1)', dot: '#6b8f71' },
  };
  const cfg = map[status] ?? { label: status, color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.04)', dot: 'rgba(255,255,255,0.3)' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}20`, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

export function StatusIcon({ status }: { status: string }) {
  if (status === 'healthy' || status === 'ok' || status === 'active') return <CheckCircle style={{ width: 14, height: 14, color: '#6b8f71' }} />;
  if (status === 'degraded') return <AlertTriangle style={{ width: 14, height: 14, color: '#d4a054' }} />;
  return <WifiOff style={{ width: 14, height: 14, color: '#c45a4a' }} />;
}

export function SectionHeader({ icon: Icon, title, subtitle, action }: { icon: any; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Icon style={{ width: 15, height: 15, color: '#d4a054' }} />
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT.primary }}>{title}</div>
          {subtitle && <div style={{ fontSize: '10px', color: TEXT.tertiary, marginTop: '1px' }}>{subtitle}</div>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function MetricCard({ icon: Icon, label, value, sub, color = '#d4a054' }: { icon: any; label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ padding: '1rem', borderRadius: '0.625rem', background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
        <Icon style={{ width: 13, height: 13, color }} />
        <span style={{ fontSize: '10px', color: TEXT.tertiary, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}>{label}</span>
      </div>
      <div style={{ fontSize: '20px', fontWeight: 700, color, letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: '10px', color: TEXT.muted, marginTop: '3px' }}>{sub}</div>}
    </div>
  );
}

export function ProgressBar({ pct, color = '#d4a054' }: { pct: number; color?: string }) {
  return (
    <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginTop: '6px' }}>
      <div style={{ height: '100%', borderRadius: '2px', background: color, width: `${Math.min(pct, 100)}%`, transition: 'width 0.3s ease' }} />
    </div>
  );
}

export function Sparkline({ values, color = '#d4a054', width = 96, height = 22 }: { values: number[]; color?: string; width?: number; height?: number }) {
  if (values.length === 0) {
    return (
      <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)' }}>
        no polls
      </div>
    );
  }
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  const points = values.map((v, i) => `${(i * step).toFixed(1)},${(height - (v / max) * height).toFixed(1)}`).join(' ');
  const areaPoints = `0,${height} ${points} ${width.toFixed(1)},${height}`;
  return (
    <svg width={width} height={height} style={{ display: 'block' }} aria-hidden="true">
      <polygon points={areaPoints} fill={color} fillOpacity={0.12} />
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
