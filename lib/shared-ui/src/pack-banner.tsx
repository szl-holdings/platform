import { Hexagon, Zap } from 'lucide-react';
import { colors } from './tokens';
import { cn, toAlpha } from './utils';

export const PACK_ACCENT_COLORS = {
  security: colors.laneAccents.aegis.primary,
  maritime: colors.laneAccents.vessels.primary,
  realestate: colors.laneAccents.terra.primary,
  aiops: colors.laneAccents.lyte.primary,
  executive: colors.laneAccents.szl.primary,
  alloy: colors.laneAccents.alloy.primary,
  carlota: colors.laneAccents.carlotaJo.primary,
  stephen: colors.laneAccents.stephen.primary,
} as const;

export type PackVariant = keyof typeof PACK_ACCENT_COLORS;

export interface PackBannerProps {
  vertical: string;
  description?: string;
  accentColor?: string;
  variant?: PackVariant;
  className?: string;
  compact?: boolean;
}

export function PackBanner({
  vertical,
  description,
  accentColor,
  variant,
  className,
  compact = false,
}: PackBannerProps) {
  const color =
    accentColor ?? (variant ? PACK_ACCENT_COLORS[variant] : colors.laneAccents.alloy.primary);

  if (compact) {
    return (
      <div
        className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg', className)}
        style={{
          background: toAlpha(color, 0.03),
          border: `1px solid ${toAlpha(color, 0.09)}`,
        }}
      >
        <Zap className="w-2.5 h-2.5 shrink-0" style={{ color: toAlpha(color, 0.5) }} />
        <span className="text-[9px] font-mono" style={{ color: toAlpha(color, 0.44) }}>
          Powered by{' '}
          <span className="font-semibold" style={{ color: toAlpha(color, 0.67) }}>
            Lyte + Counsel
          </span>
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn('rounded-xl p-4 space-y-2', className)}
      style={{
        background: `linear-gradient(135deg, ${toAlpha(color, 0.02)}, transparent)`,
        border: `1px solid ${toAlpha(color, 0.08)}`,
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded flex items-center justify-center shrink-0"
          style={{ background: toAlpha(color, 0.08), border: `1px solid ${toAlpha(color, 0.13)}` }}
        >
          <Hexagon className="w-3 h-3" style={{ color }} />
        </div>
        <div>
          <p
            className="text-[9px] font-mono uppercase tracking-[0.12em]"
            style={{ color: toAlpha(color, 0.38) }}
          >
            Intelligence Pack
          </p>
          <p className="text-[10px] font-semibold" style={{ color: toAlpha(color, 0.67) }}>
            {vertical}
          </p>
        </div>
      </div>
      {description && (
        <p className="text-[9px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.30)' }}>
          {description}
        </p>
      )}
      <div className="flex items-center gap-1.5 pt-0.5">
        <Zap className="w-2.5 h-2.5" style={{ color: 'rgba(255,255,255,0.20)' }} />
        <span className="text-[8px] font-mono" style={{ color: 'rgba(255,255,255,0.20)' }}>
          Powered by{' '}
          <a
            href="/command/operations/"
            className="transition-opacity hover:opacity-80"
            style={{ color: 'rgba(255,255,255,0.40)', textDecoration: 'underline' }}
          >
            Lyte
          </a>{' '}
          +{' '}
          <a
            href="/alloy/"
            className="transition-opacity hover:opacity-80"
            style={{ color: 'rgba(255,255,255,0.40)', textDecoration: 'underline' }}
          >
            Counsel
          </a>
        </span>
      </div>
    </div>
  );
}
