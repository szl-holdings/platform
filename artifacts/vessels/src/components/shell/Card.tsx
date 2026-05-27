import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: string | number;
  accent?: boolean;
}

export function Card({ children, padding = '16px 20px', accent = false, style, className, ...rest }: CardProps) {
  return (
    <div
      className={className}
      style={{
        border: '1px solid rgba(255,255,255,0.06)',
        borderTop: accent ? '1px solid rgba(201,183,135,0.18)' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: 6,
        background: 'rgba(255,255,255,0.02)',
        padding,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface SectionProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Section({ title, description, actions, children, className }: SectionProps) {
  return (
    <section className={className} style={{ marginBottom: 32 }}>
      {(title || actions) && (
        <div className="flex items-baseline justify-between mb-3 gap-4">
          <div className="min-w-0">
            {title && (
              <h2
                className="font-display text-[#f5f5f5] m-0"
                style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em' }}
              >
                {title}
              </h2>
            )}
            {description && (
              <p className="text-[12px] mt-1" style={{ color: '#6e6e6e' }}>
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
