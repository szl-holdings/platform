import { Clock } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { useState } from 'react';

export interface AtlasTab<T extends string = string> {
  id: T;
  label: string;
  icon: ComponentType<{ style?: React.CSSProperties }>;
  content: ReactNode;
}

export interface AtlasScanePanelProps<T extends string = string> {
  headerTitle: string;
  footerLabel: string;
  accentColor: string;
  displayId?: string;
  headerRight?: ReactNode;
  isDemo?: boolean;
  tabs: AtlasTab<T>[];
  defaultTab?: T;
}

export function AtlasScenePanel<T extends string = string>({
  headerTitle,
  headerRight,
  footerLabel,
  accentColor,
  displayId,
  isDemo,
  tabs,
  defaultTab,
}: AtlasScanePanelProps<T>) {
  const [activeTab, setActiveTab] = useState<T>(defaultTab ?? tabs[0]?.id);

  return (
    <div
      style={{
        borderRadius: '0.75rem',
        background: `color-mix(in srgb, ${accentColor} 4%, var(--gi-bg-base))`,
        border: `1px solid color-mix(in srgb, ${accentColor} 14%, transparent)`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem 0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: accentColor,
            }}
          >
            {headerTitle}
          </span>
          {isDemo && (
            <span
              style={{
                fontSize: '0.6rem',
                fontFamily: 'monospace',
                padding: '0.1rem 0.4rem',
                borderRadius: '2rem',
                background: `color-mix(in srgb, ${accentColor} 10%, transparent)`,
                color: accentColor,
                border: `1px solid color-mix(in srgb, ${accentColor} 25%, transparent)`,
              }}
            >
              DEMO
            </span>
          )}
        </div>
        {headerRight ??
          (displayId ? (
            <span
              style={{
                fontSize: '0.6875rem',
                fontFamily: 'monospace',
                color: 'var(--gi-text-muted)',
              }}
            >
              {displayId}
            </span>
          ) : null)}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: '1px solid var(--gi-border-subtle)',
          margin: '0.875rem 1.25rem 0',
          paddingBottom: 0,
        }}
      >
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                fontSize: '0.6875rem',
                fontFamily: 'monospace',
                fontWeight: 500,
                padding: '0.4rem 0.875rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: activeTab === t.id ? accentColor : 'var(--gi-text-muted)',
                borderBottom:
                  activeTab === t.id ? `2px solid ${accentColor}` : '2px solid transparent',
                marginBottom: -1,
                transition: 'color 0.12s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <Icon style={{ width: 11, height: 11 }} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: '1rem 1.25rem 1.25rem' }}>
        {tabs.find((t) => t.id === activeTab)?.content}
      </div>

      <div
        style={{
          padding: '0.625rem 1.25rem',
          borderTop: '1px solid var(--gi-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <Clock style={{ width: 10, height: 10, color: 'var(--gi-text-muted)' }} />
        <span
          style={{
            fontSize: '0.6rem',
            fontFamily: 'monospace',
            color: 'var(--gi-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {footerLabel}
        </span>
      </div>
    </div>
  );
}
