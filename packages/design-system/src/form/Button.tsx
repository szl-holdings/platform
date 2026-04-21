import React, { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { color } from '../tokens/index.js';
import { cn } from '../utils.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: color.accent.blue,
    color: color.bg.base,
    border: 'none',
  },
  secondary: {
    background: color.bg.raised,
    color: color.text.primary,
    border: `1px solid ${color.border.default}`,
  },
  ghost: {
    background: 'transparent',
    color: color.text.secondary,
    border: 'none',
  },
  destructive: {
    background: color.accent.red,
    color: '#fff',
    border: 'none',
  },
  outline: {
    background: 'transparent',
    color: color.text.primary,
    border: `1px solid ${color.border.default}`,
  },
};

const SIZE_CONFIG: Record<ButtonSize, { height: string; px: string; fontSize: string; iconSize: number }> = {
  xs: { height: '24px', px: '8px',  fontSize: '11px', iconSize: 12 },
  sm: { height: '30px', px: '10px', fontSize: '12px', iconSize: 14 },
  md: { height: '36px', px: '14px', fontSize: '13px', iconSize: 16 },
  lg: { height: '42px', px: '18px', fontSize: '14px', iconSize: 18 },
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  children,
  className,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const s = SIZE_CONFIG[size];
  const v = VARIANT_STYLES[variant];
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={cn('inline-flex items-center justify-center gap-2 rounded font-medium cursor-pointer transition-opacity', className)}
      style={{
        height: s.height,
        paddingInline: s.px,
        fontSize: s.fontSize,
        borderRadius: '4px',
        opacity: isDisabled ? 0.5 : 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        letterSpacing: '0.01em',
        fontWeight: 500,
        transitionDuration: '120ms',
        ...v,
        ...style,
      }}
    >
      {loading ? (
        <SpinnerIcon size={s.iconSize} />
      ) : (
        icon && <span className="flex-shrink-0" style={{ lineHeight: 0 }}>{icon}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && iconRight && <span className="flex-shrink-0" style={{ lineHeight: 0 }}>{iconRight}</span>}
    </button>
  );
}

function SpinnerIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={{ animation: 'spin 0.65s linear infinite' }}
      aria-hidden="true"
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
