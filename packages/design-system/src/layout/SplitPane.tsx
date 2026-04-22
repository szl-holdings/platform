import { type ReactNode, useState } from 'react';
import { color } from '../tokens/index.js';
import { cn } from '../utils.js';

export interface SplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  defaultSplit?: number;
  className?: string;
}

export function SplitPane({ left, right, defaultSplit = 60, className }: SplitPaneProps) {
  const [split] = useState(defaultSplit);
  return (
    <div className={cn('flex h-full min-h-0', className)}>
      <div className="overflow-y-auto" style={{ width: `${split}%`, flexShrink: 0 }}>
        {left}
      </div>
      <div className="flex-shrink-0" style={{ width: '1px', background: color.border.subtle }} />
      <div className="flex-1 overflow-y-auto">{right}</div>
    </div>
  );
}
