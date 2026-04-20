import type * as React from 'react';
import { cn } from '../utils';

export interface CTAItem {
  label: string;
  sublabel?: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  external?: boolean;
  icon?: React.ReactNode;
}

export interface CTAGroupProps {
  items: CTAItem[];
  layout?: 'row' | 'column' | 'grid';
  className?: string;
  accentColor?: string;
  onTrack?: (item: CTAItem) => void;
}

export function CTAGroup({
  items,
  layout = 'row',
  className,
  accentColor = 'hsl(215 45% 32%)',
  onTrack,
}: CTAGroupProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap gap-3',
        layout === 'column' && 'flex-col items-start',
        layout === 'grid' && 'grid grid-cols-2 sm:grid-cols-4',
        className,
      )}
    >
      {items.map((item, i) => {
        const Tag = item.href ? 'a' : 'button';
        const isPrimary = (item.variant ?? 'primary') === 'primary';
        const isSecondary = item.variant === 'secondary';
        return (
          <Tag
            key={i}
            href={item.href}
            onClick={() => {
              onTrack?.(item);
              item.onClick?.();
            }}
            target={item.external ? '_blank' : undefined}
            rel={item.external ? 'noopener noreferrer' : undefined}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 group',
              isPrimary && 'text-white hover:opacity-90 shadow-sm',
              isSecondary &&
                'border border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-neutral-900 hover:bg-neutral-50',
              item.variant === 'ghost' && 'text-neutral-500 hover:text-neutral-900',
            )}
            style={isPrimary ? { backgroundColor: accentColor } : undefined}
          >
            <span>
              {item.label}
              {item.sublabel && (
                <span className="block text-[10px] font-normal opacity-70 mt-0.5">
                  {item.sublabel}
                </span>
              )}
            </span>
            {item.icon && (
              <span className="group-hover:translate-x-0.5 transition-transform shrink-0">
                {item.icon}
              </span>
            )}
          </Tag>
        );
      })}
    </div>
  );
}
