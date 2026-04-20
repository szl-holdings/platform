import { CheckCircle2, ChevronDown, ChevronUp, Circle, Rocket, X } from 'lucide-react';
import * as React from 'react';
import { cn } from '../utils';

export interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  completed: boolean;
  href?: string;
  action?: () => void;
}

export interface OnboardingChecklistProps {
  title?: string;
  items: ChecklistItem[];
  onDismiss?: () => void;
  onItemClick?: (item: ChecklistItem) => void;
  accentColor?: string;
  storageKey?: string;
  className?: string;
}

export function OnboardingChecklist({
  title = 'Getting Started',
  items,
  onDismiss,
  onItemClick,
  accentColor = '#8b7ac8',
  storageKey = 'onboarding_checklist',
  className,
}: OnboardingChecklistProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(() => {
    try {
      return localStorage.getItem(`szl_${storageKey}_dismissed`) === 'true';
    } catch {
      return false;
    }
  });

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allDone = completedCount === totalCount;

  const handleDismiss = React.useCallback(() => {
    try {
      localStorage.setItem(`szl_${storageKey}_dismissed`, 'true');
    } catch {}
    setDismissed(true);
    onDismiss?.();
  }, [storageKey, onDismiss]);

  if (dismissed) return null;

  return (
    <div
      className={cn(
        'w-72 rounded-2xl border border-border bg-card shadow-xl overflow-hidden',
        className,
      )}
      style={{
        boxShadow: `0 0 30px ${accentColor}10, 0 8px 32px rgba(0,0,0,0.2)`,
      }}
    >
      <div
        className="h-1"
        style={{
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}60)`,
          width: `${progress}%`,
          transition: 'width 0.4s ease',
        }}
      />

      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4" style={{ color: accentColor }} />
            <h4 className="text-sm font-display font-bold text-foreground">{title}</h4>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-3">
          {allDone ? "All set! You're ready to go." : `${completedCount} of ${totalCount} complete`}
        </p>

        {!collapsed && (
          <div className="space-y-1">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onItemClick?.(item);
                  item.action?.();
                }}
                className={cn(
                  'w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors',
                  item.completed ? 'opacity-60' : 'hover:bg-muted/50 cursor-pointer',
                )}
              >
                {item.completed ? (
                  <CheckCircle2
                    className="w-4 h-4 mt-0.5 shrink-0"
                    style={{ color: accentColor }}
                  />
                ) : (
                  <Circle className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0">
                  <span
                    className={cn(
                      'text-sm font-medium block',
                      item.completed ? 'line-through text-muted-foreground' : 'text-foreground',
                    )}
                  >
                    {item.label}
                  </span>
                  {item.description && !item.completed && (
                    <span className="text-xs text-muted-foreground leading-tight block mt-0.5">
                      {item.description}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {allDone && !collapsed && (
          <button
            onClick={handleDismiss}
            className="w-full mt-3 py-2 px-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
            }}
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
