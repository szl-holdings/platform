import * as React from "react";

export interface MapContainerProps {
  width?: number;
  height?: number;
  viewBox?: string;
  className?: string;
  children?: React.ReactNode;
  preserveAspectRatio?: string;
  ariaLabel?: string;
  oceanGradientId?: string;
}

export function MapContainer({
  width = 1200,
  height = 560,
  viewBox,
  className,
  children,
  preserveAspectRatio = "xMidYMid meet",
  ariaLabel = "Fleet map",
  oceanGradientId = "mc-ocean-bg",
}: MapContainerProps) {
  const vb = viewBox ?? `0 0 ${width} ${height}`;

  return (
    <svg
      viewBox={vb}
      className={className ?? "w-full h-full"}
      preserveAspectRatio={preserveAspectRatio}
      aria-label={ariaLabel}
    >
      <defs>
        <radialGradient id={oceanGradientId} cx="50%" cy="40%" r="80%">
          <stop offset="0%" stopColor="#0d2847" />
          <stop offset="60%" stopColor="#080f1e" />
          <stop offset="100%" stopColor="#060c18" />
        </radialGradient>
        <filter id="mc-vessel-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="mc-port-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width={width} height={height} fill={`url(#${oceanGradientId})`} />

      <g opacity="0.08" stroke="rgba(56,189,248,0.5)" strokeWidth="0.4" fill="none">
        {[-60, -30, 0, 30, 60].map((lat) => {
          const y = height / 2 - (Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) * (height / 2);
          return <line key={`lat-${lat}`} x1={0} y1={y} x2={width} y2={y} strokeDasharray="3 5" />;
        })}
        {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((lon) => {
          const x = ((lon + 180) / 360) * width;
          return <line key={`lon-${lon}`} x1={x} y1={0} x2={x} y2={height} strokeDasharray="3 5" />;
        })}
      </g>

      {children}
    </svg>
  );
}
