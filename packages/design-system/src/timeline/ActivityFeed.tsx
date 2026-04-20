import React, { type ReactNode } from 'react';
import { color } from '../tokens/index.js';
import { cn } from '../utils.js';

export interface ActivityFeedItem {
  id: string;
  actor?: string;
  action: string;
  target?: string;
  timestamp: string;
  icon?: ReactNode;
  traceId?: string;
  policyResult?: 'allowed' | 'requires-approval' | 'blocked';
}

export interface ActivityFeedProps {
  items: ActivityFeedItem[];
  className?: string;
}

const POLICY_COLORS: Record<string, string> = {
  allowed: color.accent.green,
  'requires-approval': color.accent.amber,
  blocked: color.accent.red,
};

export function ActivityFeed({ items, className }: ActivityFeedProps) {
  return (
    <div
      className={cn('flex flex-col divide-y', className)}
      style={{ borderColor: color.border.subtle }}
    >
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-3 py-3">
          {item.icon && (
            <div className="flex-shrink-0 mt-0.5" style={{ color: color.text.muted }}>
              {item.icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-tight" style={{ color: color.text.primary }}>
              {item.actor && (
                <span className="font-medium" style={{ color: color.text.primary }}>
                  {item.actor}{' '}
                </span>
              )}
              <span style={{ color: color.text.secondary }}>{item.action}</span>
              {item.target && <span style={{ color: color.text.primary }}> {item.target}</span>}
            </p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs" style={{ color: color.text.muted }}>
                {item.timestamp}
              </span>
              {item.traceId && (
                <span className="text-xs font-mono" style={{ color: color.text.muted }}>
                  {item.traceId}
                </span>
              )}
              {item.policyResult && (
                <span className="text-xs" style={{ color: POLICY_COLORS[item.policyResult] }}>
                  {item.policyResult}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
