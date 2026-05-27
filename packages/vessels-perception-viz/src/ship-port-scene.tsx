/**
 * Renders a procedural-kit Scene as a stylized 2D top-down diagram +
 * an inline USD round-trip preview (first N prims). The 3D-native
 * renderer is the operator tool downstream; here we draw what the
 * Scene composes so the deck and the live product share one source.
 *
 * Same `seed` ⇒ same Scene ⇒ same USD prim set, verified by the
 * fixture test.
 */

import { useMemo } from 'react';
import {
  bomOf,
  partGraphHash,
  type Scene,
} from '@szl-holdings/procedural-kit';
import { buildShipPortScene, shipPortMeshResolver } from './ship-library.js';
import { fromPartGraphAdapter } from './usd-adapter.js';
import type { UsdStageDescriptor } from './usd-adapter.js';

export interface ShipPortSceneProps {
  readonly seed: number;
  readonly rootTag?: 'ship-root' | 'port-root';
  readonly maxDepth?: number;
  readonly fillProbability?: number;
  readonly width?: number;
  readonly height?: number;
  readonly accentColor?: string;
  readonly mutedColor?: string;
  readonly textColor?: string;
  readonly showUsdSummary?: boolean;
  readonly className?: string;
  readonly ariaLabel?: string;
}

function djb2(value: string): string {
  let h = 5381;
  for (let i = 0; i < value.length; i++) {
    h = ((h << 5) + h + value.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function layoutScene(scene: Scene, width: number, height: number): Array<{
  partId: string;
  cx: number;
  cy: number;
  label: string;
}> {
  // Walk the scene and lay it out as concentric rings around the root.
  const nodes: Array<{ partId: string; depth: number; angle: number; idxAtDepth: number }> = [];
  const perDepth = new Map<number, number>();
  const walk = (node: Scene['root'], depth: number) => {
    const idx = perDepth.get(depth) ?? 0;
    nodes.push({ partId: node.partId, depth, angle: 0, idxAtDepth: idx });
    perDepth.set(depth, idx + 1);
    const slotKeys = Object.keys(node.slotBindings).sort();
    for (const k of slotKeys) {
      for (const child of node.slotBindings[k]!) walk(child, depth + 1);
    }
  };
  walk(scene.root, 0);

  const totals = new Map<number, number>(perDepth);
  return nodes.map((n) => {
    const total = totals.get(n.depth) ?? 1;
    const ringR = n.depth === 0 ? 0 : Math.min(width, height) * 0.18 * n.depth;
    const theta = total <= 1 ? 0 : (2 * Math.PI * n.idxAtDepth) / total;
    const cx = width / 2 + Math.cos(theta) * ringR;
    const cy = height / 2 + Math.sin(theta) * ringR;
    return { partId: n.partId, cx, cy, label: n.partId };
  });
}

export function ShipPortScene(props: ShipPortSceneProps) {
  const {
    seed,
    rootTag = 'ship-root',
    maxDepth = 2,
    fillProbability = 0.9,
    width = 360,
    height = 280,
    accentColor = '#c9b787',
    mutedColor = '#6a6a6a',
    textColor = '#f5f5f5',
    showUsdSummary = true,
    className,
    ariaLabel,
  } = props;

  const scene = useMemo(
    () => buildShipPortScene(seed, { rootTag, maxDepth, fillProbability }),
    [seed, rootTag, maxDepth, fillProbability],
  );
  const bomEntries = useMemo(() => Object.entries(bomOf(scene)), [scene]);
  const stage: UsdStageDescriptor = useMemo(
    () => fromPartGraphAdapter(scene, shipPortMeshResolver),
    [scene],
  );
  const sceneHash = useMemo(() => partGraphHash(scene, (v: unknown) => djb2(String(v))), [scene]);
  const positions = useMemo(() => layoutScene(scene, width, height), [scene, width, height]);

  return (
    <div
      className={className}
      data-component="ship-port-scene"
      data-seed={seed}
      data-scene-hash={sceneHash}
      data-prim-count={stage.prims.length}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: 'rgba(10,20,25,0.65)',
        border: `1px solid ${accentColor}33`,
        padding: 12,
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel ?? `Procedural ${rootTag} scene, seed ${seed}`}
      >
        <defs>
          <radialGradient id={`spg-${seed}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accentColor} stopOpacity={0.18} />
            <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect width={width} height={height} fill={`url(#spg-${seed})`} />
        {positions.map((p, i) => {
          const r = p.partId === scene.root.partId ? 14 : 9;
          const stroke = p.partId === scene.root.partId ? accentColor : `${accentColor}88`;
          return (
            <g key={`${p.partId}-${i}`}>
              <circle
                cx={p.cx}
                cy={p.cy}
                r={r}
                fill="rgba(10,20,25,0.95)"
                stroke={stroke}
                strokeWidth={1.25}
              />
              <text
                x={p.cx}
                y={p.cy + r + 11}
                fill={textColor}
                fontSize={9}
                fontFamily="DM Mono, monospace"
                textAnchor="middle"
              >
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
      {showUsdSummary ? (
        <div
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: 10,
            color: mutedColor,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 4,
          }}
        >
          <span>scene-hash: <span style={{ color: textColor }}>{sceneHash}</span></span>
          <span>parts: <span style={{ color: textColor }}>{bomEntries.length}</span></span>
          <span>usd-prims: <span style={{ color: textColor }}>{stage.prims.length}</span></span>
          <span>uv: <span style={{ color: textColor }}>{stage.uvStrategy}</span></span>
        </div>
      ) : null}
    </div>
  );
}
