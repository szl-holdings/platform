/**
 * Deterministic voyage trajectory animator backed by sim-kit's Verlet
 * integrator. Same voyageId + same waypoints ⇒ same frames, frame-by-
 * frame. Used by Vessels web (live voyage view) AND by Vessels-Pitch
 * (FleetTracking slide) so the deck and the product show identical
 * motion.
 *
 * The collision cone is computed from the rolling velocity vector
 * over the last N frames; no ad-hoc tweens or random easings.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { step, type Particle, type VerletOptions } from '@szl-holdings/sim-kit';

export interface TrajectoryWaypoint {
  readonly lat: number;
  readonly lon: number;
  readonly name?: string;
}

export interface TrajectoryFrame {
  readonly tIndex: number;
  readonly position: readonly [number, number];
  readonly velocity: readonly [number, number];
  readonly waypointIndex: number;
}

export interface DeterministicTrajectoryProps {
  readonly voyageId: string;
  readonly waypoints: readonly TrajectoryWaypoint[];
  /** Number of integration steps to bake. */
  readonly frameCount?: number;
  /** ms between animation ticks (0 = static, just render full path). */
  readonly tickMs?: number;
  /** Render width / height in CSS pixels. */
  readonly width?: number;
  readonly height?: number;
  /** Hex stroke for the planned route. */
  readonly routeStroke?: string;
  /** Hex stroke for the simulated trajectory. */
  readonly simStroke?: string;
  /** Collision-cone fill colour. */
  readonly coneFill?: string;
  readonly className?: string;
  readonly ariaLabel?: string;
}

/** djb2-style deterministic 32-bit hash. Public so callers (and tests)
 *  can prove "same voyageId ⇒ same seed" without reaching into the
 *  internals. */
export function hashVoyageSeed(voyageId: string): number {
  let h = 5381;
  for (let i = 0; i < voyageId.length; i++) {
    h = ((h << 5) + h + voyageId.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Bake a deterministic trajectory from waypoints. Pure function. */
export function buildVesselTrajectory(
  voyageId: string,
  waypoints: readonly TrajectoryWaypoint[],
  frameCount = 120,
): readonly TrajectoryFrame[] {
  if (waypoints.length < 2) return [];
  const seed = hashVoyageSeed(voyageId);
  const rng = mulberry32(seed);
  // Map (lat, lon) into a [0,1] x [0,1] plane.
  const lats = waypoints.map((w) => w.lat);
  const lons = waypoints.map((w) => w.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const dLat = Math.max(maxLat - minLat, 1e-6);
  const dLon = Math.max(maxLon - minLon, 1e-6);
  const proj = (w: TrajectoryWaypoint): [number, number] => [
    (w.lon - minLon) / dLon,
    1 - (w.lat - minLat) / dLat,
  ];
  const targets = waypoints.map(proj);

  // Initial particle at first waypoint, prev nudged by a seeded micro
  // offset so the first verlet step has a defined heading.
  const jx = (rng() - 0.5) * 0.001;
  const jy = (rng() - 0.5) * 0.001;
  let particle: Particle = {
    id: voyageId,
    position: targets[0]!,
    prevPosition: [targets[0]![0] - jx, targets[0]![1] - jy],
    radius: 0.005,
    label: 'vessel',
  };

  const frames: TrajectoryFrame[] = [];
  const opts: VerletOptions = { damping: 0.18 };
  for (let t = 0; t < frameCount; t++) {
    // Determine which leg we are on by frame ratio.
    const u = t / Math.max(frameCount - 1, 1);
    const legCount = waypoints.length - 1;
    const legF = u * legCount;
    const legIdx = Math.min(Math.floor(legF), legCount - 1);
    const target = targets[legIdx + 1]!;
    // Steer toward the current leg's target with a bounded acceleration.
    const ax = (target[0] - particle.position[0]) * 0.6;
    const ay = (target[1] - particle.position[1]) * 0.6;
    const next = step([particle], 0.1, { ...opts, acceleration: [ax, ay] })[0]!;
    const vx = next.position[0] - next.prevPosition[0];
    const vy = next.position[1] - next.prevPosition[1];
    frames.push({
      tIndex: t,
      position: next.position,
      velocity: [vx, vy],
      waypointIndex: legIdx + 1,
    });
    particle = next;
  }
  return frames;
}

export function DeterministicTrajectory(props: DeterministicTrajectoryProps) {
  const {
    voyageId,
    waypoints,
    frameCount = 120,
    tickMs = 0,
    width = 700,
    height = 360,
    routeStroke = '#c9b787',
    simStroke = '#06607F',
    coneFill = 'rgba(238,53,36,0.18)',
    className,
    ariaLabel,
  } = props;

  const frames = useMemo(
    () => buildVesselTrajectory(voyageId, waypoints, frameCount),
    [voyageId, waypoints, frameCount],
  );

  const [headIndex, setHeadIndex] = useState(frames.length);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (tickMs <= 0 || frames.length === 0) {
      setHeadIndex(frames.length);
      return;
    }
    setHeadIndex(1);
    let last = 0;
    let cancelled = false;
    const tick = (now: number) => {
      if (cancelled) return;
      if (!last) last = now;
      const elapsed = now - last;
      if (elapsed >= tickMs) {
        last = now;
        setHeadIndex((i) => (i >= frames.length ? 1 : i + 1));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [frames, tickMs]);

  // Project frames to SVG coordinates.
  const toPx = (p: readonly [number, number]): [number, number] => [
    p[0] * width,
    p[1] * height,
  ];
  const routePath = waypoints.length >= 2
    ? waypoints
        .map((w, i) => {
          const [px, py] = toPx([
            (w.lon - Math.min(...waypoints.map((q) => q.lon))) /
              Math.max(
                Math.max(...waypoints.map((q) => q.lon)) -
                  Math.min(...waypoints.map((q) => q.lon)),
                1e-6,
              ),
            1 -
              (w.lat - Math.min(...waypoints.map((q) => q.lat))) /
                Math.max(
                  Math.max(...waypoints.map((q) => q.lat)) -
                    Math.min(...waypoints.map((q) => q.lat)),
                  1e-6,
                ),
          ]);
          return `${i === 0 ? 'M' : 'L'} ${px.toFixed(2)} ${py.toFixed(2)}`;
        })
        .join(' ')
    : '';

  const visible = frames.slice(0, headIndex);
  const simPath = visible
    .map((f, i) => {
      const [px, py] = toPx(f.position);
      return `${i === 0 ? 'M' : 'L'} ${px.toFixed(2)} ${py.toFixed(2)}`;
    })
    .join(' ');

  const head = visible[visible.length - 1];
  const cone = head
    ? (() => {
        const [hx, hy] = toPx(head.position);
        const vx = head.velocity[0];
        const vy = head.velocity[1];
        const mag = Math.hypot(vx, vy) || 1e-6;
        const nx = vx / mag;
        const ny = vy / mag;
        const reach = 40;
        const halfAngle = Math.PI / 8;
        const tipX = hx + nx * reach * width * 0.02;
        const tipY = hy + ny * reach * height * 0.02;
        const leftX = hx + (nx * Math.cos(halfAngle) - ny * Math.sin(halfAngle)) * reach * 0.6;
        const leftY = hy + (nx * Math.sin(halfAngle) + ny * Math.cos(halfAngle)) * reach * 0.6;
        const rightX = hx + (nx * Math.cos(-halfAngle) - ny * Math.sin(-halfAngle)) * reach * 0.6;
        const rightY = hy + (nx * Math.sin(-halfAngle) + ny * Math.cos(-halfAngle)) * reach * 0.6;
        return { hx, hy, tipX, tipY, leftX, leftY, rightX, rightY };
      })()
    : null;

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel ?? `Deterministic trajectory for voyage ${voyageId}`}
      data-voyage-id={voyageId}
      data-frame-count={frames.length}
    >
      <path d={routePath} stroke={routeStroke} strokeWidth={1.25} strokeDasharray="4 4" fill="none" opacity={0.55} />
      <path d={simPath} stroke={simStroke} strokeWidth={1.75} fill="none" />
      {waypoints.map((w, i) => {
        const dLon = Math.max(
          Math.max(...waypoints.map((q) => q.lon)) -
            Math.min(...waypoints.map((q) => q.lon)),
          1e-6,
        );
        const dLat = Math.max(
          Math.max(...waypoints.map((q) => q.lat)) -
            Math.min(...waypoints.map((q) => q.lat)),
          1e-6,
        );
        const px = ((w.lon - Math.min(...waypoints.map((q) => q.lon))) / dLon) * width;
        const py = (1 - (w.lat - Math.min(...waypoints.map((q) => q.lat))) / dLat) * height;
        return (
          <g key={`${w.name ?? i}-${i}`}>
            <circle cx={px} cy={py} r={3.5} fill={routeStroke} opacity={0.85} />
            {w.name ? (
              <text
                x={px + 6}
                y={py - 6}
                fill={routeStroke}
                fontSize={9}
                fontFamily="DM Mono, monospace"
              >
                {w.name}
              </text>
            ) : null}
          </g>
        );
      })}
      {cone ? (
        <>
          <polygon
            points={`${cone.hx},${cone.hy} ${cone.leftX},${cone.leftY} ${cone.tipX},${cone.tipY} ${cone.rightX},${cone.rightY}`}
            fill={coneFill}
          />
          <circle cx={cone.hx} cy={cone.hy} r={4.5} fill={simStroke} />
        </>
      ) : null}
    </svg>
  );
}
