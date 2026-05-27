/**
 * Ranks anomaly streams by the peak-detector composite score. The
 * ranking is the source of truth for the signal-mesh; the fixture test
 * locks the order against a frozen input series.
 *
 * Used by Vessels web (signal-mesh dock) AND by the Vessels-Pitch
 * DarkVesselDetection slide so the deck shows the same ranking the
 * product would.
 */

import { useMemo } from 'react';
import { detectPeaks, type SurfacePoint } from '@workspace/anomaly-fabric/peak-detector';

export interface SignalSeriesInput {
  readonly streamId: string;
  readonly label: string;
  readonly units?: string;
  readonly series: readonly SurfacePoint[];
  readonly category?: string;
}

export interface RankedSignal {
  readonly streamId: string;
  readonly label: string;
  readonly units?: string;
  readonly category?: string;
  readonly composite: number;
  readonly prominence: number;
  readonly snRatio: number;
  readonly shapeResidual: number;
  readonly xCenter: number;
  readonly height: number;
}

/** Pure ranker — fixture-locked. */
export function rankSignalsByPeak(
  streams: readonly SignalSeriesInput[],
  options?: { readonly halfWindow?: number; readonly minProminence?: number; readonly minSnRatio?: number },
): readonly RankedSignal[] {
  const ranked: RankedSignal[] = [];
  for (const s of streams) {
    const peaks = detectPeaks(s.series, {
      halfWindow: options?.halfWindow ?? 3,
      minProminence: options?.minProminence ?? 0,
      minSnRatio: options?.minSnRatio ?? 0,
    });
    if (peaks.length === 0) continue;
    // Pick the peak with the largest composite score for this stream.
    let best = peaks[0]!;
    for (const p of peaks) {
      if (p.scoreComponents.composite > best.scoreComponents.composite) best = p;
    }
    ranked.push({
      streamId: s.streamId,
      label: s.label,
      units: s.units,
      category: s.category,
      composite: best.scoreComponents.composite,
      prominence: best.prominence,
      snRatio: best.snRatio,
      shapeResidual: best.scoreComponents.shapeResidual,
      xCenter: best.xCenter,
      height: best.height,
    });
  }
  ranked.sort((a, b) => b.composite - a.composite);
  return ranked;
}

export interface RankedSignalMeshProps {
  readonly streams: readonly SignalSeriesInput[];
  readonly limit?: number;
  readonly halfWindow?: number;
  readonly minProminence?: number;
  readonly minSnRatio?: number;
  readonly className?: string;
  readonly accentColor?: string;
  readonly mutedColor?: string;
  readonly textColor?: string;
}

export function RankedSignalMesh(props: RankedSignalMeshProps) {
  const {
    streams,
    limit = 6,
    halfWindow,
    minProminence,
    minSnRatio,
    className,
    accentColor = '#c9b787',
    mutedColor = '#6a6a6a',
    textColor = '#f5f5f5',
  } = props;
  const ranked = useMemo(
    () => rankSignalsByPeak(streams, { halfWindow, minProminence, minSnRatio }),
    [streams, halfWindow, minProminence, minSnRatio],
  );
  const visible = ranked.slice(0, limit);
  if (visible.length === 0) {
    return (
      <div
        className={className}
        role="status"
        style={{
          padding: '0.75rem 1rem',
          fontFamily: 'DM Mono, monospace',
          fontSize: 12,
          color: mutedColor,
          border: `1px solid ${mutedColor}33`,
          background: 'rgba(10,20,25,0.6)',
        }}
      >
        signal-mesh: no peaks above thresholds
      </div>
    );
  }
  return (
    <ol
      className={className}
      data-component="ranked-signal-mesh"
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {visible.map((r, i) => (
        <li
          key={r.streamId}
          data-stream-id={r.streamId}
          data-rank={i + 1}
          style={{
            display: 'grid',
            gridTemplateColumns: '24px 1fr auto',
            alignItems: 'center',
            gap: 10,
            padding: '8px 10px',
            border: `1px solid ${accentColor}33`,
            background: 'rgba(10,20,25,0.65)',
            fontFamily: 'DM Mono, monospace',
            fontSize: 12,
            color: textColor,
          }}
        >
          <span style={{ color: accentColor }}>{(i + 1).toString().padStart(2, '0')}</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: textColor }}>{r.label}</span>
            <span style={{ color: mutedColor, fontSize: 10 }}>
              {r.category ? `${r.category} · ` : ''}prom {r.prominence.toFixed(2)} · S/N {r.snRatio.toFixed(2)}
              {r.units ? ` · ${r.units}` : ''}
            </span>
          </div>
          <span style={{ color: accentColor, fontWeight: 600 }}>
            {r.composite.toFixed(2)}
          </span>
        </li>
      ))}
    </ol>
  );
}
