import { useStandardQuery } from '@szl-holdings/api-client-react';
import { trackEvent } from '@szl-holdings/observability/react';
import { cn } from '@szl-holdings/shared-ui/utils';
import { AnimatePresence, motion as m } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Building2,
  Camera,
  CheckCircle,
  ChevronRight,
  DollarSign,
  Eye,
  Grid3X3,
  Layers,
  Loader2,
  Map,
  Maximize2,
  Moon,
  Move,
  Paintbrush,
  Palette,
  RotateCcw,
  Ruler,
  Sofa,
  Sun,
  Zap,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { api } from '@/lib/api';

interface Room {
  id: string;
  name: string;
  sqft: number;
  ceiling: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  features: string[];
  measurements: { label: string; value: string }[];
  renovationOptions: RenovationOption[];
}

interface RenovationOption {
  name: string;
  cost: number;
  valueAdd: number;
  timelineDays: number;
  description: string;
}

interface StagingPreset {
  id: string;
  name: string;
  style: string;
  monthlyRent: number;
  furnishingCost: number;
  items: string[];
}

interface PropertyWalkthrough {
  id: string;
  address: string;
  type: string;
  totalSqft: number;
  bedrooms: number;
  bathrooms: number;
  stories: number;
  rooms: Room[];
  stagingPresets: StagingPreset[];
}

const CONDITION_COLORS = {
  excellent: '#34d399',
  good: '#60a5fa',
  fair: '#fbbf24',
  poor: '#ef4444',
};

const fmt = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n.toLocaleString()}`);

const ROOM_FLOOR_PLANS: Record<
  string,
  {
    walls: [number, number, number, number][];
    windows: [number, number, number, number][];
    doors: [number, number, number, number][];
    furniture: {
      shape: 'rect' | 'circle';
      x: number;
      y: number;
      w: number;
      h?: number;
      label: string;
    }[];
  }
> = {
  r1: {
    walls: [
      [20, 20, 580, 20],
      [580, 20, 580, 220],
      [580, 220, 20, 220],
      [20, 220, 20, 20],
    ],
    windows: [
      [80, 20, 200, 20],
      [300, 20, 460, 20],
    ],
    doors: [[540, 220, 580, 220]],
    furniture: [
      { shape: 'rect', x: 150, y: 50, w: 200, h: 80, label: 'Sofa' },
      { shape: 'rect', x: 190, y: 145, w: 120, h: 55, label: 'Coffee Table' },
      { shape: 'rect', x: 420, y: 50, w: 140, h: 140, label: 'Fireplace' },
      { shape: 'rect', x: 30, y: 50, w: 90, h: 90, label: 'Armchair' },
    ],
  },
  r2: {
    walls: [
      [20, 20, 500, 20],
      [500, 20, 500, 240],
      [500, 240, 20, 240],
      [20, 240, 20, 20],
    ],
    windows: [[200, 20, 400, 20]],
    doors: [[20, 180, 20, 240]],
    furniture: [
      { shape: 'rect', x: 120, y: 60, w: 220, h: 140, label: 'King Bed' },
      { shape: 'rect', x: 360, y: 60, w: 120, h: 60, label: 'Dresser' },
      { shape: 'rect', x: 30, y: 60, w: 75, h: 55, label: 'Nightstand' },
      { shape: 'rect', x: 360, y: 140, w: 120, h: 90, label: 'Walk-in Closet' },
    ],
  },
  r3: {
    walls: [
      [20, 20, 560, 20],
      [560, 20, 560, 240],
      [560, 240, 20, 240],
      [20, 240, 20, 20],
    ],
    windows: [[300, 20, 480, 20]],
    doors: [[500, 240, 560, 240]],
    furniture: [
      { shape: 'rect', x: 30, y: 40, w: 240, h: 160, label: 'Island' },
      { shape: 'rect', x: 290, y: 40, w: 80, h: 80, label: 'Range' },
      { shape: 'rect', x: 390, y: 40, w: 60, h: 60, label: 'Fridge' },
      { shape: 'rect', x: 460, y: 40, w: 80, h: 180, label: 'Pantry' },
      { shape: 'rect', x: 290, y: 130, w: 160, h: 50, label: 'Countertop' },
    ],
  },
  r4: {
    walls: [
      [20, 20, 440, 20],
      [440, 20, 440, 230],
      [440, 230, 20, 230],
      [20, 230, 20, 20],
    ],
    windows: [[160, 20, 340, 20]],
    doors: [[380, 230, 440, 230]],
    furniture: [
      { shape: 'rect', x: 30, y: 40, w: 160, h: 100, label: 'Soaking Tub' },
      { shape: 'rect', x: 210, y: 40, w: 80, h: 90, label: 'Shower' },
      { shape: 'rect', x: 310, y: 40, w: 120, h: 60, label: 'Double Vanity' },
      { shape: 'rect', x: 30, y: 160, w: 120, h: 50, label: 'Heated Floor' },
    ],
  },
  r5: {
    walls: [
      [20, 20, 580, 20],
      [580, 20, 580, 200],
      [580, 200, 20, 200],
      [20, 200, 20, 20],
    ],
    windows: [],
    doors: [[20, 140, 20, 200]],
    furniture: [
      { shape: 'rect', x: 30, y: 30, w: 200, h: 140, label: 'Deck Area' },
      { shape: 'rect', x: 250, y: 30, w: 120, h: 80, label: 'Outdoor Kitchen' },
      { shape: 'rect', x: 390, y: 30, w: 170, h: 140, label: 'Planters' },
      { shape: 'circle', x: 310, y: 150, w: 30, label: '' },
    ],
  },
};

interface PropertyRoomRect {
  id: string;
  name: string;
  sqft: number;
  condition: string;
  ceiling: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

function squarifyRooms(
  rooms: { id: string; name: string; sqft: number; condition: string; ceiling: number }[],
  W: number,
  H: number,
): PropertyRoomRect[] {
  if (rooms.length === 0) return [];
  const sorted = [...rooms].sort((a, b) => b.sqft - a.sqft);
  const totalSqft = sorted.reduce((s, r) => s + r.sqft, 0) || 1;
  const totalArea = W * H;
  const scaled = sorted.map((r) => ({ ...r, area: (r.sqft / totalSqft) * totalArea }));

  const placed: PropertyRoomRect[] = [];
  let rect = { x: 0, y: 0, w: W, h: H };
  let remaining = [...scaled];

  const worstRatio = (row: typeof scaled, side: number) => {
    const sum = row.reduce((s, r) => s + r.area, 0);
    if (sum === 0 || side === 0) return Infinity;
    let worst = 0;
    for (const r of row) {
      const a = r.area;
      const ratio = Math.max((side * side * a) / (sum * sum), (sum * sum) / (side * side * a));
      if (ratio > worst) worst = ratio;
    }
    return worst;
  };

  while (remaining.length > 0) {
    const side = Math.min(rect.w, rect.h);
    const row: typeof scaled = [];
    let bestRatio = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const trial = [...row, remaining[i]];
      const ratio = worstRatio(trial, side);
      if (ratio <= bestRatio || row.length === 0) {
        row.push(remaining[i]);
        bestRatio = ratio;
      } else {
        break;
      }
    }
    const rowSum = row.reduce((s, r) => s + r.area, 0);
    if (rect.w >= rect.h) {
      const rowW = rowSum / rect.h;
      let yy = rect.y;
      for (const r of row) {
        const itemH = (r.area / rowSum) * rect.h;
        placed.push({
          id: r.id,
          name: r.name,
          sqft: r.sqft,
          condition: r.condition,
          ceiling: r.ceiling,
          x: rect.x,
          y: yy,
          w: rowW,
          h: itemH,
        });
        yy += itemH;
      }
      rect = { x: rect.x + rowW, y: rect.y, w: rect.w - rowW, h: rect.h };
    } else {
      const rowH = rowSum / rect.w;
      let xx = rect.x;
      for (const r of row) {
        const itemW = (r.area / rowSum) * rect.w;
        placed.push({
          id: r.id,
          name: r.name,
          sqft: r.sqft,
          condition: r.condition,
          ceiling: r.ceiling,
          x: xx,
          y: rect.y,
          w: itemW,
          h: rowH,
        });
        xx += itemW;
      }
      rect = { x: rect.x, y: rect.y + rowH, w: rect.w, h: rect.h - rowH };
    }
    remaining = remaining.slice(row.length);
  }
  return placed;
}

function PropertyFloorPlanSVG({
  rooms,
  totalSqft,
  bedrooms,
  bathrooms,
  selectedRoomId,
  onSelectRoom,
}: {
  rooms: { id: string; name: string; sqft: number; condition: string; ceiling: number }[];
  totalSqft: number;
  bedrooms: number;
  bathrooms: number;
  selectedRoomId: string | null;
  onSelectRoom: (id: string) => void;
}) {
  const W = 900;
  const H = 420;
  const padding = 24;
  const innerW = W - padding * 2;
  const innerH = H - padding * 2;

  // Derive a rough footprint in feet from the actual property total sqft.
  // Use a 16:9-ish aspect to match the canvas so the linear scale is consistent.
  const aspect = innerW / innerH;
  const footprintWidthFt = Math.sqrt(totalSqft * aspect);
  const footprintDepthFt = totalSqft / Math.max(1, footprintWidthFt);

  const placed = squarifyRooms(rooms, innerW, innerH).map((r) => ({
    ...r,
    x: r.x + padding,
    y: r.y + padding,
  }));

  const onPerimeter = (r: PropertyRoomRect) => ({
    top: Math.abs(r.y - padding) < 0.5,
    bottom: Math.abs(r.y + r.h - (H - padding)) < 0.5,
    left: Math.abs(r.x - padding) < 0.5,
    right: Math.abs(r.x + r.w - (W - padding)) < 0.5,
  });

  // Doorway between two adjacent rooms — drop a small dashed gap on the shared wall midpoint.
  const doorways: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const a = placed[i];
      const b = placed[j];
      // Vertical shared wall
      const sharedX =
        Math.abs(a.x + a.w - b.x) < 0.5
          ? a.x + a.w
          : Math.abs(b.x + b.w - a.x) < 0.5
            ? b.x + b.w
            : null;
      if (sharedX !== null) {
        const yTop = Math.max(a.y, b.y);
        const yBot = Math.min(a.y + a.h, b.y + b.h);
        if (yBot - yTop > 30) {
          const mid = (yTop + yBot) / 2;
          doorways.push({ x1: sharedX, y1: mid - 12, x2: sharedX, y2: mid + 12 });
        }
        continue;
      }
      // Horizontal shared wall
      const sharedY =
        Math.abs(a.y + a.h - b.y) < 0.5
          ? a.y + a.h
          : Math.abs(b.y + b.h - a.y) < 0.5
            ? b.y + b.h
            : null;
      if (sharedY !== null) {
        const xLeft = Math.max(a.x, b.x);
        const xRight = Math.min(a.x + a.w, b.x + b.w);
        if (xRight - xLeft > 30) {
          const mid = (xLeft + xRight) / 2;
          doorways.push({ x1: mid - 12, y1: sharedY, x2: mid + 12, y2: sharedY });
        }
      }
    }
  }

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Property floor plan"
    >
      <defs>
        <pattern id="prop-fp-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M 20 0 L 0 0 0 20"
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#prop-fp-grid)" />

      {/* Footprint dimension labels — derived from actual property sqft */}
      <text
        x={W / 2}
        y={14}
        textAnchor="middle"
        fontSize="9"
        fill="rgba(255,255,255,0.32)"
        fontFamily="monospace"
      >
        {Math.round(footprintWidthFt)}'
      </text>
      <text
        x={12}
        y={H / 2}
        textAnchor="middle"
        fontSize="9"
        fill="rgba(255,255,255,0.32)"
        fontFamily="monospace"
        transform={`rotate(-90 12 ${H / 2})`}
      >
        {Math.round(footprintDepthFt)}'
      </text>

      {/* Scale bar — length is proportional to actual footprint, so bigger properties show a shorter bar.
          This gives a real visual sense of cross-property size, not just labels. */}
      {(() => {
        const scaleFeet = footprintWidthFt > 120 ? 25 : footprintWidthFt > 60 ? 10 : 5;
        const pxPerFt = innerW / Math.max(1, footprintWidthFt);
        const barLen = Math.max(20, Math.min(innerW * 0.4, scaleFeet * pxPerFt));
        const baseX = padding + 6;
        const baseY = H - 22;
        return (
          <g>
            <line
              x1={baseX}
              y1={baseY}
              x2={baseX + barLen}
              y2={baseY}
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="2"
            />
            <line
              x1={baseX}
              y1={baseY - 4}
              x2={baseX}
              y2={baseY + 4}
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="2"
            />
            <line
              x1={baseX + barLen}
              y1={baseY - 4}
              x2={baseX + barLen}
              y2={baseY + 4}
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="2"
            />
            <text
              x={baseX + barLen / 2}
              y={baseY - 7}
              textAnchor="middle"
              fontSize="9"
              fill="rgba(255,255,255,0.55)"
              fontFamily="monospace"
            >
              {scaleFeet}'
            </text>
          </g>
        );
      })()}

      {placed.map((r) => {
        const condColor =
          CONDITION_COLORS[r.condition as keyof typeof CONDITION_COLORS] ?? '#94a3b8';
        const isActive = selectedRoomId === r.id;
        const perim = onPerimeter(r);
        return (
          <g key={r.id} style={{ cursor: 'pointer' }} onClick={() => onSelectRoom(r.id)}>
            <rect
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.h}
              fill={`${condColor}${isActive ? '30' : '14'}`}
              stroke={isActive ? condColor : 'rgba(255,255,255,0.55)'}
              strokeWidth={isActive ? 2.5 : 1.8}
            />
            {/* Window markers on exterior walls */}
            {perim.top && r.w > 70 && (
              <line
                x1={r.x + r.w * 0.3}
                y1={r.y}
                x2={r.x + r.w * 0.7}
                y2={r.y}
                stroke="#38bdf8"
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}
            {perim.bottom && r.w > 70 && (
              <line
                x1={r.x + r.w * 0.3}
                y1={r.y + r.h}
                x2={r.x + r.w * 0.7}
                y2={r.y + r.h}
                stroke="#38bdf8"
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}
            {perim.left && r.h > 70 && (
              <line
                x1={r.x}
                y1={r.y + r.h * 0.3}
                x2={r.x}
                y2={r.y + r.h * 0.7}
                stroke="#38bdf8"
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}
            {perim.right && r.h > 70 && (
              <line
                x1={r.x + r.w}
                y1={r.y + r.h * 0.3}
                x2={r.x + r.w}
                y2={r.y + r.h * 0.7}
                stroke="#38bdf8"
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}
            {/* Condition swatch */}
            <circle cx={r.x + 12} cy={r.y + 12} r={4} fill={condColor} />
            {/* Room label */}
            {r.w > 60 && r.h > 40 && (
              <>
                <text
                  x={r.x + r.w / 2}
                  y={r.y + r.h / 2 - 6}
                  textAnchor="middle"
                  fontSize={r.w > 140 ? 13 : 11}
                  fontWeight="600"
                  fill="rgba(255,255,255,0.92)"
                >
                  {r.name}
                </text>
                <text
                  x={r.x + r.w / 2}
                  y={r.y + r.h / 2 + 9}
                  textAnchor="middle"
                  fontSize="9"
                  fill="rgba(255,255,255,0.5)"
                  fontFamily="monospace"
                >
                  {r.sqft} SF
                </text>
                {r.h > 70 && (
                  <text
                    x={r.x + r.w / 2}
                    y={r.y + r.h / 2 + 22}
                    textAnchor="middle"
                    fontSize="8"
                    fill={condColor}
                    fontFamily="monospace"
                    fontWeight="600"
                  >
                    {String(r.condition).toUpperCase()}
                  </text>
                )}
              </>
            )}
          </g>
        );
      })}

      {/* Doorway gaps drawn over walls */}
      {doorways.map((d, i) => (
        <line
          key={i}
          x1={d.x1}
          y1={d.y1}
          x2={d.x2}
          y2={d.y2}
          stroke="#fbbf24"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="6 3"
        />
      ))}

      {/* Outer wall outline */}
      <rect
        x={padding}
        y={padding}
        width={innerW}
        height={innerH}
        fill="none"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="2.5"
      />

      {/* Footer summary */}
      <text x={padding} y={H - 6} fontSize="8" fill="rgba(255,255,255,0.32)" fontFamily="monospace">
        {totalSqft.toLocaleString()} SF · {bedrooms}BD / {bathrooms}BA · {rooms.length} rooms mapped
      </text>
      <g transform={`translate(${W - 240} ${H - 14})`}>
        <circle cx={0} cy={-4} r={4} fill="#34d399" />
        <text x={8} y={-1} fontSize="8" fill="rgba(255,255,255,0.4)">
          excellent
        </text>
        <circle cx={62} cy={-4} r={4} fill="#60a5fa" />
        <text x={70} y={-1} fontSize="8" fill="rgba(255,255,255,0.4)">
          good
        </text>
        <circle cx={108} cy={-4} r={4} fill="#fbbf24" />
        <text x={116} y={-1} fontSize="8" fill="rgba(255,255,255,0.4)">
          fair
        </text>
        <circle cx={146} cy={-4} r={4} fill="#ef4444" />
        <text x={154} y={-1} fontSize="8" fill="rgba(255,255,255,0.4)">
          poor
        </text>
      </g>
    </svg>
  );
}

function FloorPlanSVG({ room }: { room: Room }) {
  const plan = ROOM_FLOOR_PLANS[room.id] ?? ROOM_FLOOR_PLANS.r1;
  const W = 600,
    H = 260;
  const condColor = CONDITION_COLORS[room.condition];
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${W} ${H}`}
      style={{ position: 'absolute', inset: 0 }}
    >
      <defs>
        <pattern id="fp-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M 20 0 L 0 0 0 20"
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#fp-grid)" />
      <rect x="18" y="18" width={W - 36} height={H - 36} fill="rgba(45,106,79,0.04)" />
      {plan.furniture.map((f, i) =>
        f.shape === 'rect' ? (
          <g key={i}>
            <rect
              x={f.x}
              y={f.y}
              width={f.w}
              height={f.h ?? f.w}
              rx="3"
              fill="rgba(45,106,79,0.12)"
              stroke="rgba(45,106,79,0.35)"
              strokeWidth="1"
            />
            {f.label && (
              <text
                x={f.x + f.w / 2}
                y={f.y + (f.h ?? f.w) / 2 + 3}
                textAnchor="middle"
                fontSize="8"
                fill="rgba(255,255,255,0.4)"
                fontFamily="monospace"
              >
                {f.label}
              </text>
            )}
          </g>
        ) : (
          <g key={i}>
            <circle
              cx={f.x}
              cy={f.y}
              r={f.w}
              fill="rgba(45,106,79,0.12)"
              stroke="rgba(45,106,79,0.35)"
              strokeWidth="1"
            />
          </g>
        ),
      )}
      {plan.walls.map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="2.5"
          strokeLinecap="square"
        />
      ))}
      {plan.windows.map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#38bdf8"
          strokeWidth="3"
          strokeLinecap="round"
        />
      ))}
      {plan.doors.map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#fbbf24"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="6 3"
        />
      ))}
      <circle
        cx={W - 30}
        cy={H - 30}
        r={18}
        fill="rgba(0,0,0,0.5)"
        stroke={condColor}
        strokeWidth="1.5"
      />
      <text
        x={W - 30}
        y={H - 26}
        textAnchor="middle"
        fontSize="7"
        fill="rgba(255,255,255,0.5)"
        fontFamily="monospace"
      >
        COND
      </text>
      <text
        x={W - 30}
        y={H - 17}
        textAnchor="middle"
        fontSize="8"
        fill={condColor}
        fontFamily="monospace"
        fontWeight="bold"
      >
        {room.condition.toUpperCase().slice(0, 4)}
      </text>
      <text
        x={W / 2}
        y={H - 8}
        textAnchor="middle"
        fontSize="8"
        fill="rgba(255,255,255,0.2)"
        fontFamily="monospace"
      >
        {room.sqft} SF · {room.ceiling > 0 ? `${room.ceiling}' ceiling` : 'Open Air'}
      </text>
      <g>
        <circle
          cx={35}
          cy={H - 18}
          r={6}
          fill="rgba(45,106,79,0.2)"
          stroke="#2d6a4f"
          strokeWidth="1"
        />
        <text x={45} y={H - 14} fontSize="7" fill="rgba(255,255,255,0.3)">
          furniture
        </text>
        <line x1={75} y1={H - 18} x2={95} y2={H - 18} stroke="#38bdf8" strokeWidth="2" />
        <text x={99} y={H - 14} fontSize="7" fill="rgba(255,255,255,0.3)">
          window
        </text>
        <line
          x1={135}
          y1={H - 18}
          x2={155}
          y2={H - 18}
          stroke="#fbbf24"
          strokeWidth="2"
          strokeDasharray="4 2"
        />
        <text x={159} y={H - 14} fontSize="7" fill="rgba(255,255,255,0.3)">
          door
        </text>
      </g>
    </svg>
  );
}

const MAPS_SATELLITE_URL = `${import.meta.env.BASE_URL}api/maps/static?center=425+Park+Ave+New+York+NY&zoom=17&size=900x220&maptype=satellite&markers=color:red|425+Park+Ave+New+York+NY`;

async function initiateTerraCheckout(planId: string): Promise<void> {
  const origin = window.location.origin;
  const res = await fetch(`${import.meta.env.BASE_URL}api/billing/terra/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      planId,
      successUrl: `${origin}/terra?checkout=success`,
      cancelUrl: `${origin}/terra/property`,
    }),
  });
  const data = await res.json();
  if (data?.data?.url) {
    window.location.href = data.data.url;
  }
}

export default function SpatialWalkthroughPage() {
  const [, params] = useRoute<{ propertyId: string }>('/spatial-walkthrough/:propertyId');
  const propertyId = params?.propertyId;

  const { data: propertyData, isLoading: propertyLoading } = useStandardQuery({
    queryKey: ['terra-spatial-walkthrough', propertyId],
    queryFn: () => api.properties.spatialWalkthrough(propertyId!),
    enabled: !!propertyId,
    staleTime: 300_000,
  });

  const {
    data: portfolioData,
    isLoading: portfolioLoading,
    isError: portfolioError,
  } = useStandardQuery({
    queryKey: ['terra-portfolio-spatial-walkthrough'],
    queryFn: () => api.portfolio.spatialWalkthrough(),
    enabled: !propertyId,
    staleTime: 300_000,
  });

  const PROPERTY: PropertyWalkthrough | null =
    (portfolioData?.property as PropertyWalkthrough | undefined) ?? null;

  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [showRenovation, setShowRenovation] = useState(false);
  const [selectedStaging, setSelectedStaging] = useState<string | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [selectedPropRoom, setSelectedPropRoom] = useState<string | null>(null);

  useEffect(() => {
    if (PROPERTY && !selectedRoom) {
      setSelectedRoom(PROPERTY.rooms[0]?.id ?? '');
    }
  }, [PROPERTY, selectedRoom]);

  const room = PROPERTY?.rooms.find((r) => r.id === selectedRoom) ?? PROPERTY?.rooms[0];

  const totalRenovCost =
    PROPERTY?.rooms.reduce(
      (s, r) => s + r.renovationOptions.reduce((rs, o) => rs + o.cost, 0),
      0,
    ) ?? 0;
  const totalValueAdd =
    PROPERTY?.rooms.reduce(
      (s, r) => s + r.renovationOptions.reduce((rs, o) => rs + o.valueAdd, 0),
      0,
    ) ?? 0;

  async function handleTerraUpgrade() {
    setUpgradeLoading(true);
    trackEvent('upgrade_clicked', { feature: 'terra_walkthrough', plan: 'terra-starter-monthly' });
    try {
      await initiateTerraCheckout('terra-starter-monthly');
    } finally {
      setUpgradeLoading(false);
    }
  }

  if (propertyId) {
    const d = propertyData?.data;
    const activePropRoom = d?.rooms.find((r) => r.id === selectedPropRoom) ?? null;
    return (
      <div className="min-h-screen" style={{ background: '#0a0c10' }}>
        <div className="mx-auto max-w-5xl px-6 py-8">
          <Link href={`/property/${propertyId}`}>
            <span
              className="inline-flex items-center gap-1 text-xs mb-5 cursor-pointer"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Property
            </span>
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">
            Spatial Computing
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Interactive Property Walkthrough
          </h1>
          <p className="mt-1 text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
            AI-powered spatial analysis for property{' '}
            <code style={{ color: '#2d6a4f' }}>{propertyId}</code>
          </p>

          {propertyLoading || !d ? (
            <div
              className="flex items-center gap-3 p-8 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#2d6a4f' }} />
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Loading spatial data…
              </p>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                {[
                  {
                    label: 'Total SF',
                    value: `${d.totalSqft.toLocaleString()} SF`,
                    color: '#2d6a4f',
                  },
                  {
                    label: 'Bed / Bath',
                    value: `${d.bedrooms}BD / ${d.bathrooms}BA`,
                    color: '#60a5fa',
                  },
                  {
                    label: 'Renovation Budget',
                    value: fmt(d.totalRenovationBudget),
                    color: '#fbbf24',
                  },
                  { label: 'Value-Add Potential', value: fmt(d.totalValueAdd), color: '#34d399' },
                ].map((mm) => (
                  <div
                    key={mm.label}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/35 mb-2">
                      {mm.label}
                    </div>
                    <div className="text-xl font-semibold text-white">{mm.value}</div>
                  </div>
                ))}
              </div>

              {/* Visual Floor Plan Schematic — adapts to this property's actual rooms, sqft, and conditions */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Floor Plan — Click a Room to Inspect
                  </p>
                  <p className="text-[10px] text-white/35 font-mono">
                    Property <span style={{ color: '#2d6a4f' }}>{propertyId}</span> · scaled to{' '}
                    {d.totalSqft.toLocaleString()} SF
                  </p>
                </div>
                <div
                  style={{
                    background: '#06090e',
                    borderRadius: 10,
                    padding: 8,
                    width: '100%',
                    aspectRatio: '900 / 420',
                  }}
                >
                  <PropertyFloorPlanSVG
                    rooms={d.rooms}
                    totalSqft={d.totalSqft}
                    bedrooms={d.bedrooms}
                    bathrooms={d.bathrooms}
                    selectedRoomId={selectedPropRoom}
                    onSelectRoom={(id) => setSelectedPropRoom(selectedPropRoom === id ? null : id)}
                  />
                </div>

                {/* Room Detail Panel */}
                {activePropRoom && (
                  <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-sm font-semibold text-white">
                          {activePropRoom.name}
                        </span>
                        <span
                          className="ml-2 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{
                            background: `${CONDITION_COLORS[activePropRoom.condition as keyof typeof CONDITION_COLORS]}20`,
                            color:
                              CONDITION_COLORS[
                                activePropRoom.condition as keyof typeof CONDITION_COLORS
                              ],
                          }}
                        >
                          {activePropRoom.condition}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/30">
                        {activePropRoom.sqft} SF · {activePropRoom.ceiling}' ceiling
                      </span>
                    </div>
                    <p className="text-[10px] text-white/40 mb-3">Renovation Options</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {activePropRoom.renovationOptions.map((opt) => (
                        <div
                          key={opt.name}
                          className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-white">{opt.name}</span>
                            <span className="text-[9px] font-semibold" style={{ color: '#fbbf24' }}>
                              {fmt(opt.cost)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[9px] text-white/40">
                            <span>
                              Value add:{' '}
                              <span className="text-emerald-400 font-semibold">
                                {fmt(opt.valueAdd)}
                              </span>
                            </span>
                            <span>{opt.timelineWeeks}wk timeline</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Staging Options */}
              <div className="grid gap-6 lg:grid-cols-2 mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Virtual Staging Options</h3>
                  <div className="space-y-2">
                    {d.stagingOptions.map((sp) => (
                      <div
                        key={sp.name}
                        className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">{sp.name}</span>
                          <span className="text-xs font-semibold" style={{ color: '#2d6a4f' }}>
                            {fmt(sp.estimatedValue)}
                          </span>
                        </div>
                        <div className="text-[10px] text-white/40 mt-0.5">{sp.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Room Condition Summary</h3>
                  <div className="space-y-2">
                    {d.rooms.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            background:
                              CONDITION_COLORS[r.condition as keyof typeof CONDITION_COLORS] ??
                              '#94a3b8',
                          }}
                        />
                        <span className="text-xs text-white flex-1">{r.name}</span>
                        <span className="text-[9px] text-white/30">{r.sqft} SF</span>
                        <span
                          className="text-[9px] font-semibold"
                          style={{
                            color: CONDITION_COLORS[r.condition as keyof typeof CONDITION_COLORS],
                          }}
                        >
                          {r.condition}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Source: {d.dataSource}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (portfolioLoading || (!PROPERTY && !portfolioError)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#0a0c10' }}
      >
        <div
          className="flex items-center gap-3 px-6 py-4 rounded-xl"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          <p className="text-sm text-white/50">Loading walkthrough property…</p>
        </div>
      </div>
    );
  }

  if (portfolioError || !PROPERTY || !room) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#0a0c10' }}
      >
        <div
          className="px-6 py-4 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}
        >
          <p className="text-sm text-red-400">Unable to load walkthrough property.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0c10' }}>
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">
              Spatial Computing
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Interactive Property Walkthrough
            </h1>
            <p className="mt-1 text-sm text-white/40">
              {PROPERTY.address} · {PROPERTY.type} · {PROPERTY.totalSqft.toLocaleString()} SF
            </p>
          </div>
          <button
            onClick={handleTerraUpgrade}
            disabled={upgradeLoading}
            className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all disabled:opacity-60"
            style={{ background: '#2d6a4f', color: '#fff' }}
          >
            <Zap className="w-3.5 h-3.5" />
            {upgradeLoading ? 'Redirecting…' : 'Upgrade to Terra Pro'}
            {!upgradeLoading && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="mb-6 rounded-2xl overflow-hidden border border-white/[0.06] relative">
          <img
            src={MAPS_SATELLITE_URL}
            alt={`Google Maps satellite view of ${PROPERTY.address}`}
            className="w-full h-48 object-cover"
            style={{ objectPosition: 'center' }}
          />
          <div
            className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
            style={{ background: 'rgba(0,0,0,0.7)', color: 'rgba(255,255,255,0.8)' }}
          >
            <Map className="w-3 h-3" />
            Satellite · Google Maps · {PROPERTY.address}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          {[
            {
              label: 'Total SF',
              value: `${PROPERTY.totalSqft.toLocaleString()}`,
              color: '#2d6a4f',
            },
            { label: 'Rooms', value: String(PROPERTY.rooms.length), color: '#60a5fa' },
            {
              label: 'Bed/Bath',
              value: `${PROPERTY.bedrooms}BD / ${PROPERTY.bathrooms}BA`,
              color: '#a78bfa',
            },
            {
              label: 'Renovation Potential',
              value: fmt(totalValueAdd - totalRenovCost),
              color: '#34d399',
            },
            {
              label: 'Staging Options',
              value: String(PROPERTY.stagingPresets.length),
              color: '#fbbf24',
            },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/35 mb-2">
                {m.label}
              </div>
              <div className="text-xl font-semibold text-white">{m.value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white mb-3">Rooms</h3>
            {PROPERTY.rooms.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRoom(r.id)}
                className={cn(
                  'w-full text-left rounded-xl border p-3 transition',
                  r.id === selectedRoom
                    ? 'border-[#2d6a4f]/40 bg-[#2d6a4f]/10'
                    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{r.name}</span>
                  <span
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: `${CONDITION_COLORS[r.condition]}15`,
                      color: CONDITION_COLORS[r.condition],
                    }}
                  >
                    {r.condition}
                  </span>
                </div>
                <div className="text-[10px] text-white/30 mt-0.5">
                  {r.sqft} SF · {r.ceiling > 0 ? `${r.ceiling}' ceiling` : 'Open air'} ·{' '}
                  {r.renovationOptions.length} upgrades
                </div>
              </button>
            ))}

            <div className="mt-4">
              <h3 className="text-sm font-semibold text-white mb-3">Virtual Staging</h3>
              {PROPERTY.stagingPresets.map((sp) => (
                <button
                  key={sp.id}
                  onClick={() => setSelectedStaging(sp.id === selectedStaging ? null : sp.id)}
                  className={cn(
                    'w-full text-left rounded-xl border p-3 mb-2 transition',
                    sp.id === selectedStaging
                      ? 'border-[#fbbf24]/30 bg-[#fbbf24]/[0.05]'
                      : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{sp.name}</span>
                    <span className="text-xs text-white/40">{sp.style}</span>
                  </div>
                  <div className="text-[10px] text-white/30 mt-0.5">
                    Furnishing: {fmt(sp.furnishingCost)} · Projected rent: $
                    {sp.monthlyRent.toLocaleString()}/mo
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <m.div
                key={room.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden mb-4">
                  <div className="relative" style={{ height: 260, background: '#06090e' }}>
                    <FloorPlanSVG room={room} />
                    <div className="absolute bottom-3 right-3 flex gap-1.5">
                      {(
                        [
                          [Maximize2, 'Fullscreen'],
                          [Grid3X3, 'Toggle grid'],
                          [RotateCcw, 'Reset'],
                        ] as const
                      ).map(([Icon, label], i) => (
                        <button
                          key={i}
                          aria-label={label}
                          title={label}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 border border-white/10 text-white/30 hover:text-white/70 transition"
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </button>
                      ))}
                    </div>
                    <div className="absolute top-3 left-3">
                      <span
                        className="text-[9px] font-semibold px-2 py-1 rounded-lg"
                        style={{
                          background: 'rgba(0,0,0,0.6)',
                          color: '#2d6a4f',
                          border: '1px solid #2d6a4f30',
                        }}
                      >
                        Floor Plan · {room.name} · {room.sqft} SF
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      <button className="flex items-center gap-1 rounded-lg bg-black/60 border border-white/10 px-2 py-1 text-[10px] text-amber-400">
                        <Sun className="h-3 w-3" /> Day
                      </button>
                      <button className="flex items-center gap-1 rounded-lg bg-black/60 border border-white/10 px-2 py-1 text-[10px] text-blue-400">
                        <Moon className="h-3 w-3" /> Night
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 mb-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-white/35 mb-3">
                    Measurements & Features
                  </h4>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {room.measurements.map((m) => (
                      <div
                        key={m.label}
                        className="flex items-center gap-2 rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 py-2"
                      >
                        <Ruler className="h-3 w-3 text-white/20" />
                        <span className="text-[10px] text-white/30">{m.label}</span>
                        <span className="text-xs font-semibold text-white ml-auto">{m.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {room.features.map((f) => (
                      <span
                        key={f}
                        className="text-[9px] px-2 py-1 rounded-full border border-white/[0.06] bg-white/[0.02] text-white/40"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-white/35">
                      Renovation Options
                    </h4>
                    <button
                      onClick={() => setShowRenovation(!showRenovation)}
                      className="text-[10px] font-semibold"
                      style={{ color: '#2d6a4f' }}
                    >
                      {showRenovation ? 'Hide Details' : 'Show Details'}
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {room.renovationOptions.map((opt, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-white">{opt.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/40">{fmt(opt.cost)}</span>
                            <ArrowRight className="h-3 w-3 text-white/20" />
                            <span className="text-xs font-semibold" style={{ color: '#34d399' }}>
                              +{fmt(opt.valueAdd)}
                            </span>
                          </div>
                        </div>
                        {showRenovation && (
                          <m.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                          >
                            <p className="text-[10px] text-white/35 mt-1">{opt.description}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/25">
                              <span>Timeline: {opt.timelineDays} days</span>
                              <span>
                                ROI: {Math.round(((opt.valueAdd - opt.cost) / opt.cost) * 100)}%
                              </span>
                            </div>
                          </m.div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <AnimatePresence>
                  {selectedStaging &&
                    (() => {
                      const staging = PROPERTY.stagingPresets.find((s) => s.id === selectedStaging);
                      if (!staging) return null;
                      return (
                        <m.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="mt-4"
                        >
                          <div className="rounded-2xl border border-[#fbbf24]/20 bg-[#fbbf24]/[0.04] p-5">
                            <h4
                              className="text-xs font-semibold uppercase tracking-wider mb-3"
                              style={{ color: '#fbbf24' }}
                            >
                              Virtual Staging — {staging.name}
                            </h4>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {staging.items.map((item) => (
                                <span
                                  key={item}
                                  className="text-[9px] px-2 py-1 rounded-full border text-white/50"
                                  style={{ borderColor: '#fbbf2420', background: '#fbbf2408' }}
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                            <div className="flex gap-4 text-[10px] text-white/30">
                              <span>
                                Furnishing cost:{' '}
                                <span className="text-white/50">{fmt(staging.furnishingCost)}</span>
                              </span>
                              <span>
                                Projected rent:{' '}
                                <span className="text-white/50">
                                  ${staging.monthlyRent.toLocaleString()}/mo
                                </span>
                              </span>
                            </div>
                          </div>
                        </m.div>
                      );
                    })()}
                </AnimatePresence>
              </m.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
