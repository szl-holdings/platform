import * as React from "react";
import { useState, useMemo, useCallback } from "react";
import { toMapCoords, clusterVessels } from "./utils";

export type VesselStatus =
  | "at_sea"
  | "in_port"
  | "anchored"
  | "maintenance"
  | "delayed"
  | "loading"
  | "risk_watch"
  | "exception_active";

export interface VesselMapVessel {
  id: number | string;
  name: string;
  lat: number;
  lon: number;
  status: VesselStatus;
  alertCount?: number;
  imo?: string;
  flag?: string;
  type?: string;
}

export interface MapRoute {
  vesselId: number | string;
  from: { lat: number; lon: number };
  to: { lat: number; lon: number };
  color?: string;
}

export interface MapPort {
  name: string;
  lat: number;
  lon: number;
}

export interface VesselFilterState {
  region: string;
  status: string;
  vesselClass: string;
}

export interface VesselMapProps {
  vessels: VesselMapVessel[];
  routes?: MapRoute[];
  ports?: MapPort[];
  statusColors?: Partial<Record<VesselStatus, string>>;
  statusLabels?: Partial<Record<VesselStatus, string>>;
  width?: number;
  height?: number;
  onVesselClick?: (vessel: VesselMapVessel | null) => void;
  selectedVesselId?: number | string | null;
  clusterThreshold?: number;
  className?: string;
}

const DEFAULT_STATUS_COLORS: Record<VesselStatus, string> = {
  at_sea: "#22c55e",
  in_port: "#0ea5e9",
  anchored: "#f59e0b",
  maintenance: "#ef4444",
  delayed: "#f97316",
  loading: "#a78bfa",
  risk_watch: "#f59e0b",
  exception_active: "#ef4444",
};

const DEFAULT_STATUS_LABELS: Record<VesselStatus, string> = {
  at_sea: "At Sea",
  in_port: "In Port",
  anchored: "Anchored",
  maintenance: "Maintenance",
  delayed: "Delayed",
  loading: "Loading",
  risk_watch: "Risk Watch",
  exception_active: "Exception",
};

export function VesselMap({
  vessels,
  routes = [],
  ports = [],
  statusColors = {},
  statusLabels = {},
  width = 1200,
  height = 560,
  onVesselClick,
  selectedVesselId,
  clusterThreshold = 30,
  className,
}: VesselMapProps) {
  const [hovered, setHovered] = useState<VesselMapVessel | null>(null);

  const resolvedStatusColors = { ...DEFAULT_STATUS_COLORS, ...statusColors };
  const resolvedStatusLabels = { ...DEFAULT_STATUS_LABELS, ...statusLabels };

  const clusters = useMemo(
    () => clusterVessels(vessels, width, height, clusterThreshold),
    [vessels, width, height, clusterThreshold]
  );

  const handleVesselClick = useCallback(
    (vessel: VesselMapVessel) => {
      const isSame = selectedVesselId === vessel.id;
      onVesselClick?.(isSame ? null : vessel);
    },
    [selectedVesselId, onVesselClick]
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className ?? "w-full h-full"}
      preserveAspectRatio="xMidYMid meet"
      aria-label="Fleet map"
    >
      <defs>
        <radialGradient id="vm-ocean-bg" cx="50%" cy="40%" r="80%">
          <stop offset="0%" stopColor="#0d2847" />
          <stop offset="60%" stopColor="#080f1e" />
          <stop offset="100%" stopColor="#060c18" />
        </radialGradient>
        <filter id="vm-vessel-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="vm-port-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width={width} height={height} fill="url(#vm-ocean-bg)" />

      <g opacity="0.08" stroke="rgba(56,189,248,0.5)" strokeWidth="0.4" fill="none">
        {[-60, -30, 0, 30, 60].map((lat) => {
          const { y } = toMapCoords(lat, 0, width, height);
          return <line key={`lat-${lat}`} x1={0} y1={y} x2={width} y2={y} strokeDasharray="3 5" />;
        })}
        {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((lon) => {
          const { x } = toMapCoords(0, lon, width, height);
          return <line key={`lon-${lon}`} x1={x} y1={0} x2={x} y2={height} strokeDasharray="3 5" />;
        })}
      </g>

      {routes.map((route) => {
        const from = toMapCoords(route.from.lat, route.from.lon, width, height);
        const to = toMapCoords(route.to.lat, route.to.lon, width, height);
        const vessel = vessels.find((v) => v.id === route.vesselId);
        if (!vessel) return null;
        const color = route.color ?? resolvedStatusColors[vessel.status] ?? "#666";
        return (
          <line
            key={`route-${route.vesselId}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={color}
            strokeWidth="0.8"
            opacity="0.2"
            strokeDasharray="4 4"
          />
        );
      })}

      {ports.map((port) => {
        const { x, y } = toMapCoords(port.lat, port.lon, width, height);
        return (
          <g key={port.name} filter="url(#vm-port-glow)">
            <rect
              x={x - 3}
              y={y - 3}
              width={6}
              height={6}
              fill="#0ea5e9"
              opacity={0.5}
              transform={`rotate(45 ${x} ${y})`}
            />
            <text x={x + 6} y={y + 3} fill="rgba(56,189,248,0.4)" fontSize="7" fontFamily="monospace">
              {port.name}
            </text>
          </g>
        );
      })}

      {clusters.map((cluster, ci) => {
        if (cluster.vessels.length === 1) {
          const vessel = cluster.vessels[0];
          const { x, y } = toMapCoords(vessel.lat, vessel.lon, width, height);
          const color = resolvedStatusColors[vessel.status] ?? "#666";
          const isSelected = selectedVesselId === vessel.id;
          const isHovered = hovered?.id === vessel.id;
          const hasAlert = (vessel.alertCount ?? 0) > 0;

          return (
            <g
              key={vessel.id}
              onMouseEnter={() => setHovered(vessel)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleVesselClick(vessel)}
              style={{ cursor: "pointer" }}
              role="button"
              aria-label={`${vessel.name} — ${resolvedStatusLabels[vessel.status]}`}
            >
              <circle cx={x} cy={y} r={20} fill="transparent" />
              {(isSelected || isHovered) && (
                <circle cx={x} cy={y} r={14} fill={color} opacity={0.1} />
              )}
              {vessel.status === "at_sea" && (
                <circle cx={x} cy={y} r={6} fill="none" stroke={color} strokeWidth="0.8" opacity="0.35">
                  <animate attributeName="r" from="5" to="14" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.35" to="0" dur="2.4s" repeatCount="indefinite" />
                </circle>
              )}
              {isSelected && (
                <circle cx={x} cy={y} r={10} fill="none" stroke={color} strokeWidth="1" opacity={0.5}>
                  <animate attributeName="r" from="10" to="20" dur="1.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.5" to="0" dur="1.6s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={x}
                cy={y}
                r={isSelected || isHovered ? 6 : 4}
                fill={color}
                filter={isSelected || isHovered ? "url(#vm-vessel-glow)" : undefined}
              />
              {hasAlert && !isSelected && (
                <circle cx={x + 4} cy={y - 4} r={3} fill="#ef4444">
                  <animate attributeName="opacity" values="1;0.4;1" dur="1.2s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        }

        const { cx, cy } = cluster;
        const hasAlert = cluster.vessels.some((v) => (v.alertCount ?? 0) > 0);
        const hasCritical = cluster.vessels.some((v) =>
          ["exception_active", "maintenance"].includes(v.status)
        );
        const clusterColor = hasCritical ? "#ef4444" : hasAlert ? "#f97316" : "#0ea5e9";
        const isSelected = cluster.vessels.some((v) => selectedVesselId === v.id);

        return (
          <g
            key={`cluster-${ci}`}
            onClick={() => {
              const target = cluster.vessels.find((v) => selectedVesselId !== v.id);
              if (target) handleVesselClick(target);
            }}
            style={{ cursor: "pointer" }}
            role="button"
            aria-label={`${cluster.vessels.length} vessels clustered`}
          >
            <circle cx={cx} cy={cy} r={22} fill={clusterColor} opacity={0.08} />
            <circle cx={cx} cy={cy} r={16} fill={clusterColor} opacity={0.12} />
            <circle cx={cx} cy={cy} r={12} fill={clusterColor} opacity={0.25} />
            {isSelected && (
              <circle cx={cx} cy={cy} r={14} fill="none" stroke={clusterColor} strokeWidth="1" opacity={0.6}>
                <animate attributeName="r" from="12" to="24" dur="1.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="1.8s" repeatCount="indefinite" />
              </circle>
            )}
            <text
              x={cx}
              y={cy + 4}
              textAnchor="middle"
              fill={clusterColor}
              fontSize="9"
              fontWeight="700"
              fontFamily="monospace"
            >
              {cluster.vessels.length}
            </text>
            {hasAlert && (
              <circle cx={cx + 10} cy={cy - 10} r={4} fill="#ef4444">
                <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}
    </svg>
  );
}
