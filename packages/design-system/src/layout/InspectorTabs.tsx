import { type ReactNode, useState } from 'react';
import { color } from '../tokens/index.js';
import { cn } from '../utils.js';

export interface InspectorTab {
  id: string;
  label: string;
  content: ReactNode;
}

export interface InspectorTabsProps {
  tabs: InspectorTab[];
  defaultTab?: string;
  className?: string;
}

export function InspectorTabs({ tabs, defaultTab, className }: InspectorTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? '');
  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div
        className="flex border-b flex-shrink-0"
        style={{ borderColor: color.border.subtle }}
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className="px-3 text-xs font-medium transition-colors"
              style={{
                height: '36px',
                borderBottom: isActive ? `2px solid ${color.accent.blue}` : '2px solid transparent',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                color: isActive ? color.text.primary : color.text.secondary,
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto p-3">{activeContent}</div>
    </div>
  );
}
