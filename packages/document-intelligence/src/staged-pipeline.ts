/**
 * Document Intelligence — Staged ingest backbone.
 *
 * Re-expresses the existing OCR → layout → tables → charts → QA pipeline
 * as a `@szl-holdings/sequence-pipeline` `StagedPipeline`, with two
 * additional first-class stages:
 *
 *   - `visual-ground` (SeeingEye visual ingest), folded in as ONE stage
 *     type rather than a parallel path. When the document carries a
 *     companion frame, the stage emits a `vision.seeing-eye.v1` receipt
 *     and contributes `figure-caption` chunks; when it does not, the
 *     stage emits an explicit `notDetected: ['*']` skip-record so the
 *     receipt chain stays unbroken.
 *
 *   - `episodic-map` (memory-fabric recall), which surfaces prior
 *     accepted mapping decisions in scope so downstream review can cite
 *     them by episode id rather than re-deriving them.
 *
 * Every stage hashes its inputs/params/outputs into a per-stage receipt
 * (`pipeline.stage.v1`) carried on the returned `StagedDocumentResult`.
 */

import { createHash } from 'node:crypto';
import { StagedPipeline, type PipelineResult, type StageDefinition } from '@szl-holdings/sequence-pipeline';
import { groundVisualClaims, type RawDetection, type VisualGroundedResult } from '@workspace/seeing-eye';

import {
  NoOpChartExtractionAdapter,
  NoOpLayoutAdapter,
  NoOpOCRAdapter,
  NoOpQAAdapter,
  NoOpTableExtractionAdapter,
} from './adapters.js';
import type { DocumentPipelineAdapters } from './pipeline.js';
import {
  runChartStage,
  runLayoutStage,
  runOCRStage,
  runQAStage,
  runTableStage,
} from './pipeline.js';
import type {
  ChartExtractionResult,
  DocumentChunk,
  DocumentIngestionRequest,
  DocumentPipelineResult,
  DocumentProvenance,
  LayoutResult,
  OCRResult,
  StageProvenanceEntry,
  TableExtractionResult,
} from './types.js';

export type StagedDocumentStageName =
  | 'ocr'
  | 'layout'
  | 'tables'
  | 'charts'
  | 'visual-ground'
  | 'qa'
  | 'episodic-map';

const STAGED_PIPELINE_VERSION = '0.2.0';

export interface VisualGroundInput {
  /** Raw frame bytes — hashed into the receipt. */
  readonly frameBytes: Uint8Array;
  /** Labels the caller wants the extractor to look for. */
  readonly labels: ReadonlyArray<string>;
  /**
   * Caller-supplied raw detections (no decoder is shipped here — the
   * staged pipeline is structural). Each must carry a bbox.
   */
  readonly rawDetections: ReadonlyArray<RawDetection>;
  /** Optional schema ref; defaults to `amaru.visual.v1`. */
  readonly schemaRef?: string;
}

// Episodic recall *types* live in `./episodic-recall-types.ts` so the
// browser-safe main barrel can re-export them without dragging this
// file's Node-only deps (`@workspace/seeing-eye`, `node:crypto`) into
// the browser bundle. Only the runtime `runEpisodicRecall` is defined
// here.
export type {
  EpisodicRecallEpisode,
  EpisodicRecallInput,
  EpisodicRecallHit,
  EpisodicRecallResult,
} from './episodic-recall-types.js';

import type {
  EpisodicRecallInput,
  EpisodicRecallHit,
  EpisodicRecallResult,
} from './episodic-recall-types.js';

export interface StagedDocumentInput {
  readonly request: DocumentIngestionRequest;
  readonly questions?: ReadonlyArray<string>;
  readonly visual?: VisualGroundInput;
  readonly episodicRecall?: EpisodicRecallInput;
}

export interface StagedDocumentFinal {
  readonly document: DocumentPipelineResult;
  readonly visual: VisualGroundedResult | null;
  readonly episodicRecall: EpisodicRecallResult | null;
}

export interface RunStagedDocumentPipelineOptions {
  readonly pipelineId?: string;
  readonly adapters?: DocumentPipelineAdapters;
  readonly tooling?: Readonly<Record<string, string>>;
}

function stableHash(value: unknown): string {
  return createHash('sha256').update(stableStringify(value)).digest('hex');
}

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return JSON.stringify(value ?? null);
  if (typeof value !== 'object') return JSON.stringify(value);
  if (value instanceof Uint8Array) {
    return JSON.stringify({ __u8: createHash('sha256').update(value).digest('hex') });
  }
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

const VISUAL_LABEL_WILDCARD = '*';

/** Bag-of-tokens unit vector — dependency-free, deterministic. */
function hashEmbedding(text: string, dims = 32): number[] {
  const v = new Array<number>(dims).fill(0);
  const tokens = text.toLowerCase().split(/[^a-z0-9]+/g).filter(Boolean);
  for (const tok of tokens) {
    let h = 2166136261;
    for (let i = 0; i < tok.length; i++) h = Math.imul(h ^ tok.charCodeAt(i), 16777619);
    for (let i = 0; i < dims; i++) v[i] += ((h >>> i) & 1) ? 1 : -1;
  }
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

function cosine(a: readonly number[], b: readonly number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i]! * b[i]!;
  return Math.max(0, Math.min(1, dot));
}

function temporalScore(occurredAt: string, now: Date, halflifeDays: number): number {
  const dt = Math.max(0, now.getTime() - new Date(occurredAt).getTime());
  return Math.pow(0.5, dt / (halflifeDays * 86400_000));
}

function runEpisodicRecall(input: EpisodicRecallInput): EpisodicRecallResult {
  const now = input.now ?? new Date();
  const topK = input.topK ?? 3;
  const halflifeDays = input.halflifeDays ?? 180;
  const q = hashEmbedding(input.queryText);
  const scored: EpisodicRecallHit[] = input.episodes
    .filter((ep) => ep.scope === input.scope)
    .map((ep) => {
      const c = cosine(q, hashEmbedding(ep.text));
      const t = temporalScore(ep.occurredAt, now, halflifeDays);
      return {
        episodeId: ep.episodeId,
        scope: ep.scope,
        payload: ep.payload,
        contentSim: c,
        temporalSim: t,
        fused: Math.sqrt(c * t),
      };
    })
    .sort((a, b) => b.fused - a.fused)
    .slice(0, topK);
  const recallId = createHash('sha256')
    .update(`${input.queryText}|${input.scope}|${now.toISOString()}`)
    .digest('hex')
    .slice(0, 16);
  return { recallId, fusionRule: 'sqrt(content*temporal)', items: scored };
}

function visualToChunks(
  req: DocumentIngestionRequest,
  visual: VisualGroundedResult,
  completedAt: string,
): DocumentChunk[] {
  return visual.detections.map((d, i) => {
    const chunkId = `chunk_visual_${Date.now()}_${i.toString().padStart(4, '0')}`;
    return {
      chunkId,
      documentId: req.documentId,
      stage: 'visual-ground',
      page: null,
      bbox: [d.bbox[0], d.bbox[1], d.bbox[2], d.bbox[3]],
      section: d.label,
      text: `Visual claim: ${d.label} @ bbox=[${d.bbox.join(',')}] (frame=${d.frameHash.slice(0, 12)})`,
      confidence: d.confidence,
      contentType: 'visual-claim',
      evidenceRef: {
        documentId: req.documentId,
        chunkId,
        page: null,
        section: d.label,
        bbox: [d.bbox[0], d.bbox[1], d.bbox[2], d.bbox[3]],
        retrievedAt: completedAt,
      },
      provenance: {
        documentId: req.documentId,
        lane: req.lane,
        kind: req.kind,
        stage: 'visual-ground',
        adapterProvider: 'seeing-eye',
        confidence: d.confidence,
        generatedAt: completedAt,
      },
    };
  });
}

interface StagedDocumentResultBase {
  readonly pipelineResult: PipelineResult<StagedDocumentStageName, StagedDocumentFinal>;
  readonly document: DocumentPipelineResult;
  readonly visual: VisualGroundedResult | null;
  readonly episodicRecall: EpisodicRecallResult | null;
}

export type StagedDocumentResult = StagedDocumentResultBase;

let _stagedPipelineCounter = 0;
function newPipelineId(): string {
  return `pipe_${Date.now()}_${(++_stagedPipelineCounter).toString().padStart(5, '0')}`;
}

/**
 * Run the document intelligence pipeline as one `StagedPipeline`. Each
 * stage emits a hashed `pipeline.stage.v1` artefact; the terminal stage
 * returns the unified `DocumentPipelineResult` together with optional
 * visual and episodic-recall sub-results.
 */
export async function runStagedDocumentPipeline(
  input: StagedDocumentInput,
  options: RunStagedDocumentPipelineOptions = {},
): Promise<StagedDocumentResult> {
  const adapters = options.adapters ?? {};
  const ocrAdapter = adapters.ocr ?? new NoOpOCRAdapter();
  const layoutAdapter = adapters.layout ?? new NoOpLayoutAdapter();
  const tableAdapter = adapters.tables ?? new NoOpTableExtractionAdapter();
  const chartAdapter = adapters.charts ?? new NoOpChartExtractionAdapter();
  const qaAdapter = adapters.qa ?? new NoOpQAAdapter();

  const req = input.request;
  const stageEntries: StageProvenanceEntry[] = [];
  const allChunks: DocumentChunk[] = [];

  interface OcrCarrier { req: DocumentIngestionRequest; ocr: OCRResult }
  interface LayoutCarrier extends OcrCarrier { layout: LayoutResult }
  interface TableCarrier extends LayoutCarrier { tables: TableExtractionResult }
  interface ChartCarrier extends TableCarrier { charts: ChartExtractionResult }
  interface VisualCarrier extends ChartCarrier { visual: VisualGroundedResult | null }
  interface QaCarrier extends VisualCarrier { qa: ChunkBundleQa }
  interface ChunkBundleQa { result: Awaited<ReturnType<typeof runQAStage>>['result'] }
  interface FinalCarrier extends QaCarrier { episodicRecall: EpisodicRecallResult | null }

  const ocrStage: StageDefinition<StagedDocumentStageName, unknown, OcrCarrier> = {
    name: 'ocr',
    params: { adapter: ocrAdapter.providerId },
    run: async () => {
      const out = await runOCRStage(req, ocrAdapter);
      allChunks.push(...out.chunks);
      stageEntries.push(out.entry);
      return { req, ocr: out.result };
    },
  };

  const layoutStage: StageDefinition<StagedDocumentStageName, OcrCarrier, LayoutCarrier> = {
    name: 'layout',
    params: { adapter: layoutAdapter.providerId },
    run: async (prev) => {
      const out = await runLayoutStage(req, prev.ocr, layoutAdapter);
      allChunks.push(...out.chunks);
      stageEntries.push(out.entry);
      return { ...prev, layout: out.result };
    },
  };

  const tablesStage: StageDefinition<StagedDocumentStageName, LayoutCarrier, TableCarrier> = {
    name: 'tables',
    params: { adapter: tableAdapter.providerId },
    run: async (prev) => {
      const out = await runTableStage(req, prev.ocr, prev.layout, tableAdapter);
      allChunks.push(...out.chunks);
      stageEntries.push(out.entry);
      return { ...prev, tables: out.result };
    },
  };

  const chartsStage: StageDefinition<StagedDocumentStageName, TableCarrier, ChartCarrier> = {
    name: 'charts',
    params: { adapter: chartAdapter.providerId },
    run: async (prev) => {
      const out = await runChartStage(req, prev.ocr, prev.layout, chartAdapter);
      allChunks.push(...out.chunks);
      stageEntries.push(out.entry);
      return { ...prev, charts: out.result };
    },
  };

  const visualInput = input.visual;
  const visualStage: StageDefinition<StagedDocumentStageName, ChartCarrier, VisualCarrier> = {
    name: 'visual-ground',
    params: visualInput
      ? { schemaRef: visualInput.schemaRef ?? 'amaru.visual.v1', labels: [...visualInput.labels] }
      : { skip: true },
    run: (prev) => {
      const startedAt = new Date().toISOString();
      if (!visualInput) {
        const completedAt = new Date().toISOString();
        stageEntries.push({
          stage: 'visual-ground',
          startedAt,
          completedAt,
          durationMs: 0,
          adapterProvider: 'seeing-eye:skip',
          chunkCount: 0,
          errorCount: 0,
          notes: `notDetected=[${VISUAL_LABEL_WILDCARD}]`,
        });
        return { ...prev, visual: null };
      }
      const visual = groundVisualClaims(
        { schemaRef: visualInput.schemaRef ?? 'amaru.visual.v1', labels: visualInput.labels },
        visualInput.frameBytes,
        visualInput.rawDetections,
      );
      const completedAt = new Date().toISOString();
      const chunks = visualToChunks(req, visual, completedAt);
      allChunks.push(...chunks);
      stageEntries.push({
        stage: 'visual-ground',
        startedAt,
        completedAt,
        durationMs: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
        adapterProvider: 'seeing-eye',
        chunkCount: chunks.length,
        errorCount: 0,
        notes: `frame=${visual.frameHash.slice(0, 12)} pHash=${visual.perceptualHash.slice(0, 12)}`,
      });
      return { ...prev, visual };
    },
  };

  const qaStage: StageDefinition<StagedDocumentStageName, VisualCarrier, QaCarrier> = {
    name: 'qa',
    params: { adapter: qaAdapter.providerId, questions: input.questions ?? [] },
    run: async (prev) => {
      const out = await runQAStage(req, allChunks, qaAdapter, input.questions ? [...input.questions] : undefined);
      allChunks.push(...out.chunks);
      stageEntries.push(out.entry);
      return { ...prev, qa: { result: out.result } };
    },
  };

  const episodicInput = input.episodicRecall;
  const episodicStage: StageDefinition<StagedDocumentStageName, QaCarrier, FinalCarrier> = {
    name: 'episodic-map',
    params: episodicInput
      ? {
          scope: episodicInput.scope,
          topK: episodicInput.topK ?? 3,
          halflifeDays: episodicInput.halflifeDays ?? 180,
        }
      : { skip: true },
    run: (prev) => {
      if (!episodicInput) return { ...prev, episodicRecall: null };
      const startedAt = new Date().toISOString();
      const recall = runEpisodicRecall(episodicInput);
      const completedAt = new Date().toISOString();
      stageEntries.push({
        stage: 'episodic-map',
        startedAt,
        completedAt,
        durationMs: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
        adapterProvider: 'memory-fabric:episodic-recall',
        chunkCount: recall.items.length,
        errorCount: 0,
        notes: `recallId=${recall.recallId}`,
      });
      return { ...prev, episodicRecall: recall };
    },
  };

  const stages = [
    ocrStage,
    layoutStage,
    tablesStage,
    chartsStage,
    visualStage,
    qaStage,
    episodicStage,
  ] as unknown as readonly StageDefinition<StagedDocumentStageName, unknown, unknown>[];

  const pipeline = new StagedPipeline({
    pipelineId: options.pipelineId ?? newPipelineId(),
    tooling: {
      'document-intelligence': STAGED_PIPELINE_VERSION,
      'sequence-pipeline': '0.1.0',
      ...options.tooling,
    },
    hash: stableHash,
  });

  const result = await pipeline.run<StagedDocumentStageName, unknown, StagedDocumentFinal>(
    undefined,
    stages,
    () => undefined,
  );

  const final = result.final as unknown as FinalCarrier;
  const completedAt = new Date().toISOString();

  const provenance: DocumentProvenance = {
    documentId: req.documentId,
    kind: req.kind,
    lane: req.lane,
    fileName: req.fileName,
    mimeType: req.mimeType,
    tenantId: req.tenantId,
    ingestedAt: stageEntries[0]?.startedAt ?? completedAt,
    pipelineVersion: STAGED_PIPELINE_VERSION,
    stages: stageEntries,
    metadata: req.metadata,
  };

  const document: DocumentPipelineResult = {
    documentId: req.documentId,
    kind: req.kind,
    lane: req.lane,
    ocr: final.ocr,
    layout: final.layout,
    tables: final.tables,
    charts: final.charts,
    qa: final.qa.result,
    chunks: allChunks,
    provenance,
    completedAt,
  };

  // Repackage `final` so callers downstream see the unified shape.
  const repackedFinal: StagedDocumentFinal = {
    document,
    visual: final.visual,
    episodicRecall: final.episodicRecall,
  };

  return {
    pipelineResult: {
      pipelineId: result.pipelineId,
      stages: result.stages,
      final: repackedFinal,
    },
    document,
    visual: final.visual,
    episodicRecall: final.episodicRecall,
  };
}

/**
 * Server-side convenience: ingest a document through the full staged
 * backbone and return the complete `StagedDocumentResult` (per-stage
 * receipts + unified document + optional visual + optional recall).
 *
 * This is the canonical server ingest path. The browser-safe variant
 * `ingestDocument` (in `./ingestion.ts`, re-exported from the main
 * barrel) runs the simpler `runDocumentPipeline` so the main barrel
 * does not transitively pull `node:crypto`.
 */
export async function ingestDocumentStaged(
  input: StagedDocumentInput,
  options: { adapters?: DocumentPipelineAdapters; pipelineId?: string } = {},
): Promise<StagedDocumentResult> {
  return runStagedDocumentPipeline(input, options);
}
