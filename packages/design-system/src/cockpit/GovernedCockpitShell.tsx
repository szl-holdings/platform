import type { ComponentType, ReactNode } from 'react';
import { useState } from 'react';
import type { AutonomyMode } from '../proof/AutonomyModeToggle.js';
import { AutonomyModeToggle } from '../proof/AutonomyModeToggle.js';

export interface GovernedCockpitKpiCard {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}

export interface GovernedCockpitShellProps {
  accentColor: string;
  headerIcon: ReactNode;
  headerTitle: string;
  headerSubtitle: string;
  liveIndicatorLabel?: string;
  kpiCards?: GovernedCockpitKpiCard[];
  defaultAutonomyMode?: AutonomyMode;
  children: (autonomyMode: AutonomyMode, setAutonomyMode: (m: AutonomyMode) => void) => ReactNode;
}

export function GovernedCockpitShell({
  accentColor,
  headerIcon,
  headerTitle,
  headerSubtitle,
  liveIndicatorLabel,
  kpiCards,
  defaultAutonomyMode = 'draft',
  children,
}: GovernedCockpitShellProps) {
  const [autonomyMode, setAutonomyMode] = useState<AutonomyMode>(defaultAutonomyMode);

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'var(--gi-bg-base)',
        color: 'var(--gi-text-primary)',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div
        className="border-b"
        style={{ borderColor: 'var(--gi-border-subtle)', background: 'var(--gi-bg-surface)' }}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: `color-mix(in srgb, ${accentColor} 10%, transparent)`,
                border: `1px solid color-mix(in srgb, ${accentColor} 25%, transparent)`,
              }}
            >
              {headerIcon}
            </div>
            <div>
              <div
                className="text-sm font-semibold"
                style={{ color: 'var(--gi-text-primary)' }}
              >
                {headerTitle}
              </div>
              <div className="text-xs" style={{ color: 'var(--gi-text-muted)' }}>
                {headerSubtitle}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="text-xs uppercase tracking-widest"
              style={{ color: 'var(--gi-text-muted)' }}
            >
              Autonomy Mode
            </span>
            <AutonomyModeToggle value={autonomyMode} onChange={setAutonomyMode} variant="compact" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {liveIndicatorLabel && (
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: accentColor }}
            />
            <span
              className="text-xs uppercase tracking-widest font-semibold"
              style={{ color: 'var(--gi-text-muted)' }}
            >
              {liveIndicatorLabel}
            </span>
          </div>
        )}

        {kpiCards && kpiCards.length > 0 && (
          <div
            className="mb-6"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(kpiCards.length, 4)}, 1fr)`,
              gap: '1rem',
            }}
          >
            {kpiCards.map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="rounded-xl p-4"
                style={{
                  background: 'var(--gi-bg-surface)',
                  border: '1px solid var(--gi-border-subtle)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                  <span
                    className="text-xs uppercase tracking-wide"
                    style={{ color: 'var(--gi-text-muted)' }}
                  >
                    {label}
                  </span>
                </div>
                <div className="text-2xl font-bold" style={{ color }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        )}

        {children(autonomyMode, setAutonomyMode)}
      </div>
    </div>
  );
}
