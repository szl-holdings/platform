import * as React from "react";

export interface VesselMarkerProps {
  x: number;
  y: number;
  color?: string;
  isSelected?: boolean;
  isHovered?: boolean;
  hasAlert?: boolean;
  isPulsing?: boolean;
  size?: "sm" | "md" | "lg";
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
  ariaLabel?: string;
}

const SIZE_MAP = {
  sm: { base: 3, selected: 5 },
  md: { base: 4, selected: 6 },
  lg: { base: 5, selected: 8 },
};

export function VesselMarker({
  x,
  y,
  color = "#22c55e",
  isSelected = false,
  isHovered = false,
  hasAlert = false,
  isPulsing = false,
  size = "md",
  onMouseEnter,
  onMouseLeave,
  onClick,
  ariaLabel,
}: VesselMarkerProps) {
  const { base, selected: sel } = SIZE_MAP[size];
  const radius = isSelected || isHovered ? sel : base;

  return (
    <g
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
      role={onClick ? "button" : undefined}
      aria-label={ariaLabel}
    >
      <circle cx={x} cy={y} r={20} fill="transparent" />

      {(isSelected || isHovered) && (
        <circle cx={x} cy={y} r={radius * 2.5} fill={color} opacity={0.1} />
      )}

      {isPulsing && (
        <circle cx={x} cy={y} r={base} fill="none" stroke={color} strokeWidth="0.8" opacity="0.35">
          <animate attributeName="r" from={String(base - 1)} to={String(base * 3.5)} dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.35" to="0" dur="2.4s" repeatCount="indefinite" />
        </circle>
      )}

      {isSelected && (
        <circle cx={x} cy={y} r={radius * 1.8} fill="none" stroke={color} strokeWidth="1" opacity={0.5}>
          <animate attributeName="r" from={String(radius * 1.8)} to={String(radius * 3.5)} dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.5" to="0" dur="1.6s" repeatCount="indefinite" />
        </circle>
      )}

      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={color}
        filter={isSelected || isHovered ? "url(#mc-vessel-glow)" : undefined}
      />

      {hasAlert && !isSelected && (
        <circle cx={x + base + 1} cy={y - base - 1} r={3} fill="#ef4444">
          <animate attributeName="opacity" values="1;0.4;1" dur="1.2s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  );
}
