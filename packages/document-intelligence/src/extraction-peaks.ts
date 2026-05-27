/**
 * Document Intelligence — Extraction-confidence peak surfacer.
 *
 * Wraps `@workspace/anomaly-fabric/peak-detector` so the Conduit review
 * queue can rank documents by *where* extraction confidence peaks (and
 * troughs) sit across pages, without a fixed threshold. The peak score
 * components — prominence, S/N ratio, shape residual — are itemised on
 * the returned record so the reviewer can see *why* a peak floated up.
 *
 * Re-expression of the MS-DIAL LC-MS peak picker, applied to the
 * confidence trace of a document's chunks.
 */

import { detectPeaks, type Peak, type SurfacePoint } from '@workspace/anomaly-fabric/peak-detector';

import type { DocumentChunk, DocumentPipelineResult } from './types.js';

export interface DocumentConfidencePeak {
  /** Document the peak belongs to. */
  readonly documentId: string;
  /** Composite score from the peak detector — used as the rank key. */
  readonly compositeScore: number;
  /** Raw peak data from the detector (index, width, prominence, ...). */
  readonly peak: Peak;
  /** Anchor chunk (closest to the peak x-coordinate). */
  readonly anchorChunk: DocumentChunk;
}

export interface RankedReviewItem {
  readonly documentId: string;
  readonly rank: number;
  readonly compositeScore: number;
  readonly anchorChunkId: string;
  readonly peak: Peak;
  /** Stable string suitable for direct rendering in a queue. */
  readonly summary: string;
}

export interface RankExtractionConfidencePeaksOptions {
  /** Forwarded to `detectPeaks`. */
  readonly minProminence?: number;
  readonly minSnRatio?: number;
  readonly halfWindow?: number;
  /** Top-K — defaults to 5. */
  readonly topK?: number;
  /**
   * Direction of the peak: `confidence` ranks high-confidence islands,
   * `gap` inverts the trace and ranks confidence troughs (i.e. "what
   * looks weakest, surface it first"). Default `gap`.
   */
  readonly mode?: 'confidence' | 'gap';
}

function chunkSurface(chunks: readonly DocumentChunk[], mode: 'confidence' | 'gap'): SurfacePoint[] {
  return chunks.map((c, i) => ({
    x: i,
    intensity: mode === 'gap' ? 1 - c.confidence : c.confidence,
  }));
}

/**
 * Detect confidence peaks for a single document. Returns the peaks
 * ranked by composite score (descending) with their anchor chunks.
 */
export function detectDocumentConfidencePeaks(
  doc: DocumentPipelineResult,
  options: RankExtractionConfidencePeaksOptions = {},
): DocumentConfidencePeak[] {
  const mode = options.mode ?? 'gap';
  if (doc.chunks.length === 0) return [];
  const surface = chunkSurface(doc.chunks, mode);
  const peaks = detectPeaks(surface, {
    minProminence: options.minProminence ?? 0.05,
    minSnRatio: options.minSnRatio ?? 1.0,
    halfWindow: options.halfWindow ?? 2,
  });
  return peaks
    .map((peak) => ({
      documentId: doc.documentId,
      compositeScore: peak.scoreComponents.composite,
      peak,
      anchorChunk: doc.chunks[peak.index]!,
    }))
    .sort((a, b) => b.compositeScore - a.compositeScore);
}

/**
 * Rank a batch of documents into a single review queue. Each document
 * contributes its top peak; ties are broken by `documentId` (lexical)
 * so the ranking is reproducible across runs.
 */
export function rankExtractionConfidencePeaks(
  docs: ReadonlyArray<DocumentPipelineResult>,
  options: RankExtractionConfidencePeaksOptions = {},
): RankedReviewItem[] {
  const topK = options.topK ?? 5;
  const candidates: DocumentConfidencePeak[] = [];
  for (const doc of docs) {
    const peaks = detectDocumentConfidencePeaks(doc, options);
    if (peaks.length > 0) candidates.push(peaks[0]!);
  }
  candidates.sort((a, b) => {
    const d = b.compositeScore - a.compositeScore;
    if (d !== 0) return d;
    return a.documentId.localeCompare(b.documentId);
  });
  return candidates.slice(0, topK).map((c, i) => ({
    documentId: c.documentId,
    rank: i + 1,
    compositeScore: c.compositeScore,
    anchorChunkId: c.anchorChunk.chunkId,
    peak: c.peak,
    summary:
      `#${i + 1} · ${c.documentId} · score=${c.compositeScore.toFixed(3)}` +
      ` · prom=${c.peak.prominence.toFixed(3)} · s/n=${c.peak.snRatio.toFixed(2)}` +
      ` · chunk=${c.anchorChunk.stage}/${c.anchorChunk.chunkId.slice(-8)}` +
      ` · conf=${c.anchorChunk.confidence.toFixed(2)}`,
  }));
}
