import React, { type ReactNode } from 'react';
import { type InspectorTab, InspectorTabs } from '../layout/InspectorTabs.js';
import { color } from '../tokens/index.js';
import { cn } from '../utils.js';

export interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  tabs?: InspectorTab[];
  children?: ReactNode;
  width?: string;
  className?: string;
}

export function DetailDrawer({
  open,
  onClose,
  title,
  subtitle,
  tabs,
  children,
  width = '480px',
  className,
}: DetailDrawerProps) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(6,11,18,0.5)' }}
        onClick={onClose}
      />
      <aside
        className={cn('fixed right-0 top-0 bottom-0 z-50 flex flex-col shadow-2xl', className)}
        style={{
          width,
          background: color.bg.surface,
          borderLeft: `1px solid ${color.border.subtle}`,
        }}
      >
        <div
          className="flex items-start justify-between gap-4 px-5 pt-4 pb-3 border-b flex-shrink-0"
          style={{ borderColor: color.border.subtle }}
        >
          <div>
            <h2
              className="font-semibold text-base leading-tight"
              style={{ color: color.text.primary }}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs mt-0.5" style={{ color: color.text.secondary }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              color: color.text.muted,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              lineHeight: 1,
              flexShrink: 0,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          {tabs && tabs.length > 0 ? (
            <InspectorTabs tabs={tabs} />
          ) : (
            <div className="overflow-y-auto h-full p-5">{children}</div>
          )}
        </div>
      </aside>
    </>
  );
}
