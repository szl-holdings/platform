/**
 * AEF Retrieval — Multimodal Retrieval Helpers
 *
 * Extends the retrieval contract to handle screenshots, diagrams, and audio
 * transcripts as first-class modalities alongside text.
 *
 * Each modality has:
 *  - A `ModalityAdapter` interface defining how to embed and index content.
 *  - A helper to build the canonical `ModalityMeta` for a retrieval chunk.
 *  - A score-weighting hint used by the reranker to treat modalities fairly.
 *
 * Modality pipeline position:
 *  1. Ingest → extract text representation per modality (OCR, caption, transcript)
 *  2. Embed → use text representation for dense retrieval
 *  3. Rerank → modality score weights applied to avoid text-only bias
 *  4. Cite  → ModalityMeta surfaced to the ProofChainViewer for transparency
 */

/**
 * First-class retrieval modalities.
 * Mirrored from @szl-holdings/shared-contracts RetrievalModality.
 */
export type MultimodalModality = 'text' | 'screenshot' | 'diagram' | 'audio_transcript';

export interface TextModalityMeta {
  modality: 'text';
  language?: string;
  pageNumber?: number;
  section?: string;
}

export interface ScreenshotModalityMeta {
  modality: 'screenshot';
  capturedAt?: string;
  url?: string;
  caption?: string;
  ocrText?: string;
  width?: number;
  height?: number;
}

export interface DiagramModalityMeta {
  modality: 'diagram';
  diagramType?: 'architecture' | 'flow' | 'erd' | 'sequence' | 'other';
  annotation?: string;
  nodes?: string[];
  edges?: Array<{ from: string; to: string; label?: string }>;
}

export interface AudioTranscriptModalityMeta {
  modality: 'audio_transcript';
  speaker?: string;
  startMs?: number;
  endMs?: number;
  language?: string;
  confidence?: number;
}

export type MultimodalMeta =
  | TextModalityMeta
  | ScreenshotModalityMeta
  | DiagramModalityMeta
  | AudioTranscriptModalityMeta;

// ─── Modality weights ─────────────────────────────────────────────────────────

/**
 * Per-modality score weight applied during the reranker pass.
 * Weights compensate for the fact that OCR / caption text is sparser than
 * full prose, which would otherwise disadvantage non-text modalities.
 */
export const MODALITY_RERANK_WEIGHT: Record<MultimodalModality, number> = {
  text: 1.0,
  screenshot: 1.1,
  diagram: 1.05,
  audio_transcript: 0.95,
};

// ─── ModalityMeta builders ────────────────────────────────────────────────────

export function buildTextMeta(
  opts: Omit<TextModalityMeta, 'modality'> = {},
): TextModalityMeta {
  return { modality: 'text', ...opts };
}

export function buildScreenshotMeta(
  opts: Omit<ScreenshotModalityMeta, 'modality'>,
): ScreenshotModalityMeta {
  return { modality: 'screenshot', ...opts };
}

export function buildDiagramMeta(
  opts: Omit<DiagramModalityMeta, 'modality'>,
): DiagramModalityMeta {
  return { modality: 'diagram', ...opts };
}

export function buildAudioTranscriptMeta(
  opts: Omit<AudioTranscriptModalityMeta, 'modality'>,
): AudioTranscriptModalityMeta {
  return { modality: 'audio_transcript', ...opts };
}

// ─── Text extraction per modality ─────────────────────────────────────────────

/**
 * Extract a plain-text representation from a chunk's ModalityMeta.
 * This text is used as the embedding input for non-text modalities.
 */
export function extractEmbeddingText(
  content: string,
  meta: MultimodalMeta | undefined,
): string {
  if (!meta) return content;

  switch (meta.modality) {
    case 'text':
      return content;

    case 'screenshot': {
      const parts: string[] = [];
      if (meta.caption) parts.push(`Caption: ${meta.caption}`);
      if (meta.ocrText) parts.push(`OCR: ${meta.ocrText}`);
      if (meta.url) parts.push(`URL: ${meta.url}`);
      return parts.length > 0 ? parts.join(' | ') : content;
    }

    case 'diagram': {
      const parts: string[] = [];
      if (meta.annotation) parts.push(meta.annotation);
      if (meta.nodes?.length) parts.push(`Nodes: ${meta.nodes.join(', ')}`);
      if (meta.edges?.length) {
        parts.push(
          `Edges: ${meta.edges.map((e) => `${e.from}→${e.to}${e.label ? ` (${e.label})` : ''}`).join(', ')}`,
        );
      }
      return parts.length > 0 ? `${content} | ${parts.join(' | ')}` : content;
    }

    case 'audio_transcript': {
      const parts: string[] = [content];
      if (meta.speaker) parts.push(`Speaker: ${meta.speaker}`);
      if (meta.startMs !== undefined && meta.endMs !== undefined) {
        parts.push(`[${formatMs(meta.startMs)}–${formatMs(meta.endMs)}]`);
      }
      return parts.join(' ');
    }

    default:
      return content;
  }
}

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// ─── Modality filter ──────────────────────────────────────────────────────────

/**
 * Filter chunks to only include requested modalities.
 * If `modalities` is undefined or empty, all modalities pass through.
 */
export function filterByModality<T extends { modality?: MultimodalModality }>(
  chunks: T[],
  modalities: MultimodalModality[] | undefined,
): T[] {
  if (!modalities || modalities.length === 0) return chunks;
  return chunks.filter((c) => {
    const m = c.modality ?? 'text';
    return modalities.includes(m);
  });
}

/**
 * Apply per-modality score weighting to a scored list.
 */
export function applyModalityWeights<T extends { score: number; modality?: MultimodalModality }>(
  chunks: T[],
): T[] {
  return chunks.map((c) => {
    const weight = MODALITY_RERANK_WEIGHT[c.modality ?? 'text'];
    return { ...c, score: Math.min(1, c.score * weight) };
  });
}
