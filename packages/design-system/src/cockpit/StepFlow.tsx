import type { ReactNode } from 'react';
import { type DensityMode, color, densityConfig, motion, semanticColors } from '../tokens/index.js';
import { cn } from '../utils.js';

export type StepFlowStatus = 'pending' | 'active' | 'complete' | 'blocked' | 'skipped';

export interface StepFlowStep {
  id: string;
  label: string;
  description?: string;
  status: StepFlowStatus;
  icon?: ReactNode;
  accentColor?: string;
  branch?: StepFlowStep[];
  metadata?: string;
}

export interface StepFlowProps {
  steps: StepFlowStep[];
  direction?: 'horizontal' | 'vertical';
  density?: DensityMode;
  className?: string;
  onStepClick?: (step: StepFlowStep) => void;
  showLabels?: boolean;
}

const STATUS_CONFIG: Record<
  StepFlowStatus,
  { bg: string; border: string; text: string; lineColor: string; icon: string }
> = {
  pending: {
    bg: color.bg.overlay,
    border: color.border.default,
    text: color.text.muted,
    lineColor: color.border.subtle,
    icon: '',
  },
  active: {
    bg: color.bg.active,
    border: color.accent.blue,
    text: color.accent.blue,
    lineColor: color.accent.blue,
    icon: '●',
  },
  complete: {
    bg: semanticColors.success.bg,
    border: semanticColors.success.text,
    text: semanticColors.success.text,
    lineColor: semanticColors.success.text,
    icon: '✓',
  },
  blocked: {
    bg: semanticColors.error.bg,
    border: semanticColors.error.text,
    text: semanticColors.error.text,
    lineColor: semanticColors.error.text,
    icon: '✕',
  },
  skipped: {
    bg: color.bg.overlay,
    border: color.border.subtle,
    text: color.text.muted,
    lineColor: color.border.subtle,
    icon: '—',
  },
};

interface StatusIconProps {
  status: StepFlowStatus;
  icon?: ReactNode;
  size: number;
}

function StatusIcon({ status, icon, size }: StatusIconProps) {
  const cfg = STATUS_CONFIG[status];
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 font-semibold"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: cfg.bg,
        border: `1.5px solid ${cfg.border}`,
        color: cfg.text,
        fontSize: status === 'active' ? `${Math.round(size * 0.4)}px` : `${Math.round(size * 0.52)}px`,
        transition: `all ${motion.duration.fast} ${motion.easing.standard}`,
      }}
      aria-hidden="true"
    >
      {icon ?? cfg.icon}
    </div>
  );
}

interface ConnectorLineProps {
  status: StepFlowStatus;
  direction: 'horizontal' | 'vertical';
  size: string;
}

function ConnectorLine({ status, direction, size }: ConnectorLineProps) {
  const cfg = STATUS_CONFIG[status];
  const isH = direction === 'horizontal';
  return (
    <div
      style={{
        [isH ? 'width' : 'height']: size,
        [isH ? 'height' : 'width']: '1.5px',
        background: cfg.lineColor,
        opacity: status === 'pending' || status === 'skipped' ? 0.3 : 0.65,
        transition: `background ${motion.duration.normal} ${motion.easing.standard}`,
        flexShrink: 0,
      }}
    />
  );
}

interface StepNodeProps {
  step: StepFlowStep;
  isLast: boolean;
  direction: 'horizontal' | 'vertical';
  onClick?: (step: StepFlowStep) => void;
  showLabels: boolean;
  iconSize: number;
  connectorSize: string;
  fontSize: string;
}

function StepNode({ step, isLast, direction, onClick, showLabels, iconSize, connectorSize, fontSize }: StepNodeProps) {
  const cfg = STATUS_CONFIG[step.status];
  const isHorizontal = direction === 'horizontal';
  const accentColor = step.accentColor ?? cfg.border;
  const isInteractive = !!onClick;

  const handleActivate = () => { if (!isInteractive) return; onClick(step); };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && isInteractive) {
      e.preventDefault();
      onClick(step);
    }
  };

  return (
    <div
      role="listitem"
      className={cn('flex items-center', {
        'flex-col': !isHorizontal,
        'flex-row': isHorizontal,
      })}
    >
      <div
        className={cn('flex items-center gap-2', {
          'flex-col': isHorizontal && showLabels,
        })}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        aria-label={isInteractive ? `${step.label}: ${step.status}` : undefined}
        onClick={handleActivate}
        onKeyDown={handleKeyDown}
        style={{
          cursor: isInteractive ? 'pointer' : 'default',
          color: accentColor,
        }}
      >
        <StatusIcon status={step.status} icon={step.icon} size={iconSize} />

        {showLabels && (
          <div
            className={cn('flex flex-col', { 'items-center text-center': isHorizontal })}
          >
            <span
              className="font-medium leading-snug"
              style={{
                fontSize,
                color:
                  step.status === 'active'
                    ? color.text.primary
                    : step.status === 'pending'
                      ? color.text.muted
                      : cfg.text,
                maxWidth: isHorizontal ? '80px' : undefined,
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: isHorizontal ? 'nowrap' : undefined,
              }}
            >
              {step.label}
            </span>
            {step.description && (
              <span style={{ fontSize: '10px', color: color.text.muted, marginTop: '1px', display: 'block' }}>
                {step.description}
              </span>
            )}
            {step.metadata && (
              <span
                className="font-mono"
                style={{ fontSize: '9px', color: color.text.muted, marginTop: '1px', display: 'block' }}
              >
                {step.metadata}
              </span>
            )}
          </div>
        )}
      </div>

      {step.branch && step.branch.length > 0 && (
        <div
          className="flex gap-2 items-center"
          style={{ marginLeft: isHorizontal ? '6px' : undefined, marginTop: isHorizontal ? undefined : '4px' }}
        >
          <div
            style={{
              width: '10px',
              height: '1.5px',
              background: color.border.default,
              opacity: 0.4,
            }}
            aria-hidden="true"
          />
          <div className="flex gap-2">
            {step.branch.map((branchStep) => (
              <div key={branchStep.id} className="flex items-center gap-1.5">
                <StatusIcon status={branchStep.status} size={Math.round(iconSize * 0.75)} />
                {showLabels && (
                  <span style={{ fontSize: '10px', color: color.text.muted }}>{branchStep.label}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLast && (
        <div
          className="flex items-center justify-center"
          style={{
            margin: isHorizontal
              ? `0 ${showLabels ? '6px' : '8px'}`
              : `4px 0`,
            [isHorizontal ? 'minWidth' : 'minHeight']: connectorSize,
          }}
          aria-hidden="true"
        >
          <ConnectorLine status={step.status} direction={direction} size={connectorSize} />
        </div>
      )}
    </div>
  );
}

export function StepFlow({
  steps,
  direction = 'horizontal',
  density = 'comfortable',
  className,
  onStepClick,
  showLabels = true,
}: StepFlowProps) {
  const dc = densityConfig[density];
  const iconSize = density === 'dense' ? 20 : density === 'compact' ? 23 : 26;
  const connectorSize = density === 'dense' ? '20px' : density === 'compact' ? '24px' : '32px';
  const isHorizontal = direction === 'horizontal';

  return (
    <div
      role="list"
      aria-label="Step progress"
      className={cn(
        'flex items-center',
        {
          'flex-row flex-wrap': isHorizontal,
          'flex-col items-start': !isHorizontal,
        },
        className,
      )}
      style={{ gap: density === 'dense' ? dc.sectionGap : undefined }}
    >
      {steps.map((step, idx) => (
        <StepNode
          key={step.id}
          step={step}
          isLast={idx === steps.length - 1}
          direction={direction}
          onClick={onStepClick}
          showLabels={showLabels}
          iconSize={iconSize}
          connectorSize={connectorSize}
          fontSize={dc.fontSize}
        />
      ))}
    </div>
  );
}
