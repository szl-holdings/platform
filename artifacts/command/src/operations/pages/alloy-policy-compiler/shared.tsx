import { ACCENT, BORDER, EFFECT_CFG, OUTCOME_CFG, TEXT } from './constants';
import type { OutcomeKey, PolicyEffect } from './types';

export function EffectBadge({ effect }: { effect: PolicyEffect }) {
  const cfg = EFFECT_CFG[effect];
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold tracking-wider px-1.5 py-0.5 rounded uppercase" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <cfg.Icon className="w-2.5 h-2.5" />{cfg.label}
    </span>
  );
}

export function OutcomeBadge({ outcome }: { outcome: OutcomeKey }) {
  const cfg = OUTCOME_CFG[outcome];
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold tracking-wider px-1.5 py-0.5 rounded uppercase" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
      <cfg.Icon className="w-2.5 h-2.5" />{cfg.label}
    </span>
  );
}

export function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = value >= 0.8 ? '#22c55e' : value >= 0.6 ? ACCENT : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono" style={{ color }}>{pct}%</span>
    </div>
  );
}

export function DiffLine({ type, text }: { type: 'added' | 'removed' | 'unchanged' | 'header'; text: string }) {
  const colors = {
    added: { bg: 'rgba(34,197,94,0.06)', color: '#86efac', border: 'rgba(34,197,94,0.15)' },
    removed: { bg: 'rgba(239,68,68,0.06)', color: '#fca5a5', border: 'rgba(239,68,68,0.15)' },
    unchanged: { bg: 'transparent', color: 'rgba(255,255,255,0.4)', border: 'transparent' },
    header: { bg: 'rgba(139,122,200,0.06)', color: '#a78bfa', border: 'rgba(139,122,200,0.2)' },
  };
  const c = colors[type];
  return <div className="px-3 py-0.5 font-mono text-[10px] rounded-sm" style={{ background: c.bg, color: c.color }}>{text}</div>;
}
