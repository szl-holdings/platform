/**
 * @workspace/seeing-eye
 *
 * Visual grounding primitive — the SeeingEye re-expression in SZL doctrine.
 *
 * A visual claim ("I see a vessel") is only emitted alongside:
 *   - a bounding box (normalised 0–1),
 *   - a frame hash (SHA-256 of the canonical frame bytes),
 *   - a perceptual hash (survives JPEG re-encoding),
 *   - a per-detection confidence.
 *
 * Negative claims — "asked about but absent" — are first-class outputs
 * (`notDetected[]`), not silent absences.
 *
 * Doctrine V6 receipt: `vision.seeing-eye.v1`.
 */

import { createHash } from 'node:crypto';

export type BoundingBox = readonly [number, number, number, number];

export interface VisualSchema {
  readonly schemaRef: string;
  /** Labels the caller wants the extractor to look for. */
  readonly labels: ReadonlyArray<string>;
}

export interface VisualDetection {
  readonly label: string;
  readonly bbox: BoundingBox;
  readonly confidence: number;
  readonly frameHash: string;
}

export interface VisualGroundedResult {
  readonly schemaRef: string;
  readonly frameHash: string;
  readonly perceptualHash: string;
  readonly detections: ReadonlyArray<VisualDetection>;
  readonly notDetected: ReadonlyArray<string>;
  readonly receipt: {
    readonly kind: 'vision.seeing-eye.v1';
    readonly producedAt: string;
    readonly receiptHash: string;
  };
}

export class UngroundedVisualClaimError extends Error {
  constructor(label: string) {
    super(`seeing-eye: refusing to emit visual claim '${label}' without bbox + frameHash`);
    this.name = 'UngroundedVisualClaimError';
  }
}

export function hashFrame(frameBytes: Uint8Array): string {
  return createHash('sha256').update(frameBytes).digest('hex');
}

/**
 * Lightweight perceptual hash (aHash) over a downsampled luminance grid.
 * Deterministic, dependency-free, and survives small re-encoding.
 *
 * Input is expected to be a raw RGBA grid (width * height * 4 bytes). For
 * callers that hand in opaque image bytes, pre-decode upstream — the hash is
 * structural, not a decoder.
 */
export function perceptualHashRgba(rgba: Uint8Array, width: number, height: number): string {
  if (rgba.length !== width * height * 4) {
    return createHash('sha1').update(rgba).digest('hex').slice(0, 16);
  }
  const cell = 8;
  const cw = Math.floor(width / cell) || 1;
  const ch = Math.floor(height / cell) || 1;
  const luminances: number[] = [];
  for (let by = 0; by < cell; by++) {
    for (let bx = 0; bx < cell; bx++) {
      let sum = 0;
      let n = 0;
      for (let y = by * ch; y < (by + 1) * ch && y < height; y++) {
        for (let x = bx * cw; x < (bx + 1) * cw && x < width; x++) {
          const i = (y * width + x) * 4;
          sum += 0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2];
          n++;
        }
      }
      luminances.push(n === 0 ? 0 : sum / n);
    }
  }
  const mean = luminances.reduce((a, b) => a + b, 0) / luminances.length;
  let bits = '';
  for (const l of luminances) bits += l >= mean ? '1' : '0';
  return BigInt(`0b${bits}`).toString(16).padStart(16, '0');
}

export interface RawDetection {
  readonly label: string;
  readonly bbox?: BoundingBox;
  readonly confidence?: number;
}

/**
 * Compose a grounded visual result. Throws if any detection is missing a bbox.
 * `frameBytes` is treated as opaque for the SHA-256; `rgba`/`width`/`height`
 * are optional and only used for the perceptual hash.
 */
export function groundVisualClaims(
  schema: VisualSchema,
  frameBytes: Uint8Array,
  rawDetections: ReadonlyArray<RawDetection>,
  opts?: { rgba?: Uint8Array; width?: number; height?: number },
): VisualGroundedResult {
  const frameHash = hashFrame(frameBytes);
  const perceptualHash = opts?.rgba && opts.width && opts.height
    ? perceptualHashRgba(opts.rgba, opts.width, opts.height)
    : createHash('sha1').update(frameBytes).digest('hex').slice(0, 16);

  const detections: VisualDetection[] = rawDetections.map((d) => {
    if (!d.bbox || d.bbox.length !== 4) throw new UngroundedVisualClaimError(d.label);
    return {
      label: d.label,
      bbox: d.bbox,
      confidence: d.confidence ?? 0.7,
      frameHash,
    };
  });

  const detectedLabels = new Set(detections.map((d) => d.label));
  const notDetected = schema.labels.filter((l) => !detectedLabels.has(l));

  const producedAt = new Date().toISOString();
  const canonical = JSON.stringify({
    schemaRef: schema.schemaRef,
    frameHash,
    perceptualHash,
    detections: detections.map((d) => ({ label: d.label, bbox: d.bbox })),
    notDetected,
  });
  const receiptHash = createHash('sha256').update(canonical, 'utf8').digest('hex');

  return {
    schemaRef: schema.schemaRef,
    frameHash,
    perceptualHash,
    detections,
    notDetected,
    receipt: { kind: 'vision.seeing-eye.v1', producedAt, receiptHash },
  };
}
