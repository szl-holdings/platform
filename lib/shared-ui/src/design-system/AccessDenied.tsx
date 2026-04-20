import type * as React from 'react';
import { cn } from '../utils';

export interface AccessDeniedProps {
  title?: string;
  description?: string;
  requiredRole?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  secondaryCta?: { label: string; href?: string; onClick?: () => void };
  icon?: React.ReactNode;
  className?: string;
  variant?: 'dark' | 'light' | 'page';
  accentColor?: string;
}

export function AccessDenied({
  title = 'Access Restricted',
  description = "You don't have permission to view this content. Request access below or contact your administrator.",
  requiredRole,
  ctaLabel = 'Request Access',
  ctaHref,
  onCtaClick,
  secondaryCta,
  icon,
  className,
  variant = 'page',
  accentColor = 'hsl(215 45% 32%)',
}: AccessDeniedProps) {
  const isPage = variant === 'page';
  const isDark = variant === 'dark' || variant === 'page';

  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center max-w-md mx-auto px-6',
        isPage ? 'min-h-screen' : 'py-16',
        className,
      )}
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
        }}
      >
        {icon ?? (
          <span className="text-4xl" role="img" aria-label="Lock">
            🔒
          </span>
        )}
      </div>

      <div
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border mb-5 text-[11px] font-medium uppercase tracking-wider"
        style={{
          borderColor: 'rgba(239,68,68,0.25)',
          backgroundColor: 'rgba(239,68,68,0.06)',
          color: '#f87171',
        }}
      >
        {requiredRole ? `Requires: ${requiredRole}` : 'Permission Required'}
      </div>

      <h1
        className={cn(
          'text-2xl sm:text-3xl font-bold mb-3',
          isDark ? 'text-white' : 'text-neutral-900',
        )}
      >
        {title}
      </h1>

      <p
        className={cn(
          'text-sm leading-relaxed mb-8',
          isDark ? 'text-white/50' : 'text-neutral-500',
        )}
      >
        {description}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
        <a
          href={ctaHref ?? '#'}
          onClick={onCtaClick}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm"
          style={{ backgroundColor: accentColor }}
        >
          {ctaLabel}
        </a>
        {secondaryCta && (
          <a
            href={secondaryCta.href ?? '#'}
            onClick={secondaryCta.onClick}
            className={cn(
              'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm border transition-colors',
              isDark
                ? 'border-white/12 text-white/50 hover:border-white/20 hover:text-white'
                : 'border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-neutral-900',
            )}
          >
            {secondaryCta.label}
          </a>
        )}
      </div>
    </div>
  );

  if (isPage) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, hsl(220 20% 4%), hsl(220 18% 7%))',
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}
