import * as React from "react";

export interface RouteLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  opacity?: number;
  strokeWidth?: number;
  dashed?: boolean;
  dashArray?: string;
  animated?: boolean;
}

export function RouteLine({
  x1,
  y1,
  x2,
  y2,
  color = "#0ea5e9",
  opacity = 0.2,
  strokeWidth = 0.8,
  dashed = true,
  dashArray = "4 4",
  animated = false,
}: RouteLineProps) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth={strokeWidth}
      opacity={opacity}
      strokeDasharray={dashed ? dashArray : undefined}
    >
      {animated && (
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="-20"
          dur="1s"
          repeatCount="indefinite"
        />
      )}
    </line>
  );
}

export interface RouteLineFromLatLonProps {
  fromLat: number;
  fromLon: number;
  toLat: number;
  toLon: number;
  mapWidth: number;
  mapHeight: number;
  color?: string;
  opacity?: number;
  strokeWidth?: number;
  dashed?: boolean;
  dashArray?: string;
  animated?: boolean;
}

function toXY(lat: number, lon: number, w: number, h: number) {
  const x = ((lon + 180) / 360) * w;
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = h / 2 - (mercN / Math.PI) * (h / 2);
  return { x, y };
}

export function RouteLineFromLatLon({
  fromLat,
  fromLon,
  toLat,
  toLon,
  mapWidth,
  mapHeight,
  ...rest
}: RouteLineFromLatLonProps) {
  const from = toXY(fromLat, fromLon, mapWidth, mapHeight);
  const to = toXY(toLat, toLon, mapWidth, mapHeight);
  return <RouteLine x1={from.x} y1={from.y} x2={to.x} y2={to.y} {...rest} />;
}
