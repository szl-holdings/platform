import React, { type ReactNode } from 'react';
import { color } from '../tokens/index.js';
import { cn } from '../utils.js';

export interface StepperStep {
  id: string;
  label: string;
  description?: string;
}

export type StepStatus = 'complete' | 'current' | 'upcoming' | 'error';

export interface StepperProps {
  steps: StepperStep[];
  currentStepId: string;
  getStepStatus?: (stepId: string) => StepStatus;
  onStepClick?: (stepId: string) => void;
  className?: string;
  children?: ReactNode;
}

const STATUS_DOT_COLOR: Record<StepStatus, string> = {
  complete: color.accent.green,
  current: color.accent.blue,
  upcoming: color.border.default,
  error: color.accent.red,
};

const STATUS_TEXT_COLOR: Record<StepStatus, string> = {
  complete: color.text.primary,
  current: color.text.primary,
  upcoming: color.text.muted,
  error: color.text.primary,
};

export function Stepper({
  steps,
  currentStepId,
  getStepStatus,
  onStepClick,
  className,
}: StepperProps) {
  const currentIdx = steps.findIndex((s) => s.id === currentStepId);

  function resolveStatus(stepId: string, idx: number): StepStatus {
    if (getStepStatus) return getStepStatus(stepId);
    if (idx < currentIdx) return 'complete';
    if (idx === currentIdx) return 'current';
    return 'upcoming';
  }

  return (
    <nav className={cn('flex items-center', className)} aria-label="Progress">
      {steps.map((step, idx) => {
        const status = resolveStatus(step.id, idx);
        const isLast = idx === steps.length - 1;
        return (
          <div key={step.id} className="flex items-center">
            <button
              type="button"
              onClick={() => onStepClick?.(step.id)}
              disabled={!onStepClick || status === 'upcoming'}
              className="flex flex-col items-center gap-1"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: onStepClick && status !== 'upcoming' ? 'pointer' : 'default',
                padding: '4px 8px',
              }}
            >
              <div
                className="rounded-full flex items-center justify-center font-semibold text-xs"
                style={{
                  width: '28px',
                  height: '28px',
                  background: status === 'upcoming' ? color.bg.overlay : STATUS_DOT_COLOR[status],
                  color: status === 'upcoming' ? color.text.muted : color.text.inverse,
                  border: `2px solid ${STATUS_DOT_COLOR[status]}`,
                }}
              >
                {status === 'complete' ? '✓' : status === 'error' ? '!' : idx + 1}
              </div>
              <span
                className="text-xs font-medium whitespace-nowrap"
                style={{ color: STATUS_TEXT_COLOR[status] }}
              >
                {step.label}
              </span>
            </button>
            {!isLast && (
              <div
                className="flex-shrink-0"
                style={{
                  height: '2px',
                  width: '40px',
                  background: idx < currentIdx ? color.accent.green : color.border.subtle,
                }}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
