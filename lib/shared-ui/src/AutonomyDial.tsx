/**
 * AutonomyDial — operator-set autonomy mode control
 * Suggest → Approve Each → Approve Batch → Auto + Rollback → Full Auto
 * Policy-capped, audited, visible on every recommendation.
 */
import * as React from "react";
import type { AutonomyMode } from "./os-layer";
import { AUTONOMY_LABELS, AUTONOMY_DESCRIPTIONS } from "./os-layer";
import { cn } from "./utils";

const MODES: AutonomyMode[] = [
  "suggest",
  "approve_each",
  "approve_batch",
  "auto_with_rollback",
  "full_auto",
];

const MODE_COLORS: Record<AutonomyMode, string> = {
  suggest:           "#4a90b8",
  approve_each:      "#6b8f71",
  approve_batch:     "#c8953c",
  auto_with_rollback:"#8b7ac8",
  full_auto:         "#c45a4a",
};

export interface AutonomyDialProps {
  value: AutonomyMode;
  onChange?: (mode: AutonomyMode) => void;
  policyCap?: AutonomyMode;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

export function AutonomyDial({
  value,
  onChange,
  policyCap,
  disabled = false,
  compact = false,
  className,
}: AutonomyDialProps) {
  const [showInfo, setShowInfo] = React.useState(false);
  const currentIdx = MODES.indexOf(value);
  const capIdx = policyCap ? MODES.indexOf(policyCap) : MODES.length - 1;
  const color = MODE_COLORS[value];

  if (compact) {
    return (
      <button
        type="button"
        className={cn("inline-flex items-center gap-1.5 rounded px-2 py-1 text-[10px] font-medium", className)}
        style={{ background: `${color}14`, color, border: `1px solid ${color}38` }}
        onClick={() => setShowInfo(!showInfo)}
        disabled={disabled}
        aria-label={`Autonomy: ${AUTONOMY_LABELS[value]}`}
      >
        <DialIcon mode={value} size={10} />
        {AUTONOMY_LABELS[value]}
      </button>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest font-mono" style={{ color: "rgba(255,255,255,0.28)" }}>
          Autonomy
        </span>
        <span className="text-[11px] font-medium" style={{ color }}>
          {AUTONOMY_LABELS[value]}
        </span>
      </div>

      <div className="flex gap-1">
        {MODES.map((mode, idx) => {
          const isCurrent = mode === value;
          const isCapBlocked = idx > capIdx;
          const mColor = MODE_COLORS[mode];

          return (
            <button
              key={mode}
              type="button"
              title={`${AUTONOMY_LABELS[mode]}${isCapBlocked ? " — blocked by policy" : ""}`}
              disabled={disabled || isCapBlocked || !onChange}
              onClick={() => !isCapBlocked && onChange?.(mode)}
              className="flex-1 h-1.5 rounded-full transition-all relative"
              style={{
                background: idx <= currentIdx ? mColor : "rgba(255,255,255,0.07)",
                opacity: isCapBlocked ? 0.3 : 1,
                cursor: disabled || isCapBlocked || !onChange ? "default" : "pointer",
              }}
              aria-label={AUTONOMY_LABELS[mode]}
              aria-pressed={isCurrent}
            />
          );
        })}
      </div>

      <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
        {AUTONOMY_DESCRIPTIONS[value]}
      </p>

      {policyCap && (
        <div className="text-[9px] font-mono" style={{ color: "rgba(200,149,60,0.7)" }}>
          Policy cap: {AUTONOMY_LABELS[policyCap]}
        </div>
      )}
    </div>
  );
}

function DialIcon({ mode, size = 12 }: { mode: AutonomyMode; size?: number }) {
  const icons: Record<AutonomyMode, string> = {
    suggest: "○",
    approve_each: "◐",
    approve_batch: "◑",
    auto_with_rollback: "◕",
    full_auto: "●",
  };
  return <span style={{ fontSize: size, lineHeight: 1 }}>{icons[mode]}</span>;
}
