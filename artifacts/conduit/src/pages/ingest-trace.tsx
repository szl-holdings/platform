/**
 * Ingest Trace — Conduit surface for the perception/bio primitives.
 *
 * Browser-safe view that exercises the two primitives that don't
 * require Node crypto:
 *
 *   1. `rankExtractionConfidencePeaks` (peak-detector) — the review
 *      queue that surfaces extraction-confidence troughs.
 *   2. `composeEpisodicScene` + `episodicSceneToUsd` (procedural-kit
 *      → openusd-export) — the episodic-map recall scene with USD
 *      round-trip.
 *
 * The seven-stage `pipeline.stage.v1` ledger produced by
 * `runStagedDocumentPipeline` is Node-only; this page renders a
 * representation of the staged shape using deterministic browser-safe
 * hashes so reviewers can see the chain. The real runtime is exercised
 * in `packages/document-intelligence/src/__tests__/staged-pipeline.test.ts`.
 */

import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Activity, GitBranch, Mountain, Box } from 'lucide-react';
import {
  composeEpisodicScene,
  episodicSceneToUsd,
  rankExtractionConfidencePeaks,
  type EpisodicRecallResult,
  type RankedReviewItem,
  type DocumentPipelineResult,
  type DocumentChunk,
} from '@szl-holdings/document-intelligence';
import type { UsdStageDescriptor } from '@szl-holdings/openusd-export/from-part-graph';

const STAGE_NAMES = ['ocr', 'layout', 'tables', 'charts', 'visual-ground', 'qa', 'episodic-map'] as const;

const SYNTHETIC_BATCH: Array<{
  documentId: string;
  fileName: string;
  lane: 'counsel' | 'vessels' | 'terra';
  trace: number[];
  hasVisual: boolean;
  hasRecall: boolean;
}> = [
  { documentId: 'doc-alpha',   fileName: 'engagement-letter.pdf',  lane: 'counsel', trace: [0.95, 0.93, 0.92, 0.30, 0.91, 0.94, 0.93], hasVisual: false, hasRecall: false },
  { documentId: 'doc-bravo',   fileName: 'voyage-manifest.pdf',    lane: 'vessels', trace: [0.92, 0.93, 0.92, 0.91, 0.93, 0.92, 0.94], hasVisual: false, hasRecall: false },
  { documentId: 'doc-charlie', fileName: 'reefer-inspection.pdf',  lane: 'vessels', trace: [0.85, 0.82, 0.84, 0.65, 0.84, 0.83, 0.85], hasVisual: true,  hasRecall: true  },
  { documentId: 'doc-delta',   fileName: 'foreclosure-notice.pdf', lane: 'terra',   trace: [0.96, 0.95, 0.97, 0.10, 0.96, 0.95, 0.97], hasVisual: false, hasRecall: false },
];

const EPISODES = [
  { episodeId: 'ep-2024-q3', text: 'reefer return air defrost frost door seal', occurredAt: '2024-08-12T11:30:00Z', scope: 'reefer-screening' },
  { episodeId: 'ep-2025-q1', text: 'container weight manifest variance reefer', occurredAt: '2025-03-04T09:10:00Z', scope: 'reefer-screening' },
  { episodeId: 'ep-2026-q1', text: 'reefer power draw kw amperage nominal', occurredAt: '2026-02-08T08:20:00Z', scope: 'reefer-screening' },
];

// FNV-1a 32-bit; sufficient for ledger display (real hashes are SHA-256, run server-side).
function fnv1a(s: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

interface DisplayStage {
  stageName: string;
  stageOrdinal: number;
  inputsHash: string;
  paramsHash: string;
  outputsHash: string;
}

function composeLedger(pipelineId: string, lane: string, traceLen: number, hasVisual: boolean, hasRecall: boolean): DisplayStage[] {
  let prev = fnv1a(`${pipelineId}|seed`);
  return STAGE_NAMES.map((name, i) => {
    const params = name === 'visual-ground' && !hasVisual ? 'skip'
      : name === 'episodic-map' && !hasRecall ? 'skip'
      : `${name}:${lane}:${traceLen}`;
    const inputsHash = prev;
    const paramsHash = fnv1a(params);
    const outputsHash = fnv1a(`${pipelineId}|${name}|${inputsHash}|${paramsHash}`);
    prev = outputsHash;
    return { stageName: name, stageOrdinal: i, inputsHash, paramsHash, outputsHash };
  });
}

function chunkFromTrace(documentId: string, lane: 'counsel' | 'vessels' | 'terra', idx: number, c: number): DocumentChunk {
  return {
    chunkId: `${documentId}-trace-${idx}`,
    documentId,
    stage: 'qa',
    page: 1,
    text: '',
    confidence: c,
    contentType: 'qa-answer',
    evidenceRef: { documentId, chunkId: `${documentId}-trace-${idx}`, page: 1, retrievedAt: '' },
    provenance: { documentId, lane, kind: 'filing', stage: 'qa', adapterProvider: 'trace', confidence: c, generatedAt: '' },
  };
}

function fixtureDoc(spec: typeof SYNTHETIC_BATCH[number]): DocumentPipelineResult {
  return {
    documentId: spec.documentId,
    kind: 'filing',
    lane: spec.lane,
    ocr: { documentId: spec.documentId, pages: [], totalPages: 0, provider: 'noop', processedAt: '' },
    layout: { documentId: spec.documentId, blocks: [], sections: [], provider: 'noop', processedAt: '' },
    tables: { documentId: spec.documentId, tables: [], provider: 'noop', processedAt: '' },
    charts: { documentId: spec.documentId, charts: [], provider: 'noop', processedAt: '' },
    qa: { documentId: spec.documentId, answers: [], provider: 'noop', processedAt: '' },
    chunks: spec.trace.map((c, i) => chunkFromTrace(spec.documentId, spec.lane, i, c)),
    provenance: {
      documentId: spec.documentId, kind: 'filing', lane: spec.lane,
      fileName: spec.fileName, mimeType: 'application/pdf',
      ingestedAt: '', pipelineVersion: '0.2.0', stages: [],
    },
    completedAt: '',
  };
}

interface PipelineLedger {
  pipelineId: string;
  documentId: string;
  lane: string;
  stages: DisplayStage[];
}

interface Output {
  ledgers: PipelineLedger[];
  ranked: RankedReviewItem[];
  recall: EpisodicRecallResult;
  usd: UsdStageDescriptor;
}

type RunState = 'idle' | 'running' | 'done';

// Browser-safe episodic recall (no node:crypto). Same fusion rule
// as `runEpisodicRecall` server-side; deterministic.
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
function cosine(a: number[], b: number[]): number {
  let d = 0; for (let i = 0; i < a.length; i++) d += a[i]! * b[i]!; return Math.max(0, Math.min(1, d));
}
function buildRecall(): EpisodicRecallResult {
  const q = hashEmbedding('reefer return air defrost frost door seal');
  const now = new Date('2026-05-27T00:00:00Z').getTime();
  const items = EPISODES.map((ep) => {
    const c = cosine(q, hashEmbedding(ep.text));
    const dt = Math.max(0, now - new Date(ep.occurredAt).getTime());
    const t = Math.pow(0.5, dt / (180 * 86400_000));
    return {
      episodeId: ep.episodeId,
      scope: ep.scope,
      payload: { outcome: 'accepted' as const },
      contentSim: c,
      temporalSim: t,
      fused: Math.sqrt(c * t),
    };
  })
  .sort((a, b) => b.fused - a.fused)
  .slice(0, 3);
  return { recallId: fnv1a('reefer-screening-recall'), fusionRule: 'sqrt(content*temporal)', items };
}

export default function IngestTracePage() {
  const [state, setState] = useState<RunState>('idle');
  const [output, setOutput] = useState<Output | null>(null);

  const [source, setSource] = useState<'live' | 'fixture'>('fixture');

  async function runAll() {
    setState('running');
    // Try the live api-server route first — it runs the *real*
    // `runStagedDocumentPipeline`, so the receipt chain is the actual
    // SHA-256 sequence-pipeline output. Fall back to the deterministic
    // browser fixture if the api-server is not reachable (or the user
    // is on a static deployment).
    const apiUrl = `${import.meta.env.BASE_URL}api/conduit/ingest-trace/run`;
    try {
      const res = await fetch(apiUrl, { headers: { accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json() as {
          staged: Array<{ pipelineId: string; stages: DisplayStage[]; document: DocumentPipelineResult }>;
          ranked: RankedReviewItem[];
          recall: EpisodicRecallResult | null;
          usd: UsdStageDescriptor | null;
        };
        const ledgers: PipelineLedger[] = data.staged.map((s) => ({
          pipelineId: s.pipelineId,
          documentId: s.document.documentId,
          lane: s.document.lane,
          stages: s.stages.map((st) => ({
            stageName: st.stageName,
            stageOrdinal: st.stageOrdinal,
            inputsHash: st.inputsHash,
            paramsHash: st.paramsHash,
            outputsHash: st.outputsHash,
          })),
        }));
        const recall = data.recall ?? buildRecall();
        const usd = data.usd ?? episodicSceneToUsd(composeEpisodicScene(recall));
        setOutput({ ledgers, ranked: data.ranked, recall, usd });
        setSource('live');
        setState('done');
        return;
      }
    } catch {
      // fall through to fixture
    }
    const ledgers: PipelineLedger[] = SYNTHETIC_BATCH.map((spec) => ({
      pipelineId: `pipe-${spec.documentId}`,
      documentId: spec.documentId,
      lane: spec.lane,
      stages: composeLedger(`pipe-${spec.documentId}`, spec.lane, spec.trace.length, spec.hasVisual, spec.hasRecall),
    }));
    const docs = SYNTHETIC_BATCH.map(fixtureDoc);
    const ranked = rankExtractionConfidencePeaks(docs, { mode: 'gap', topK: 4 });
    const recall = buildRecall();
    const scene = composeEpisodicScene(recall);
    const usd = episodicSceneToUsd(scene);
    setOutput({ ledgers, ranked, recall, usd });
    setSource('fixture');
    setState('done');
  }

  const totalStageReceipts = useMemo(
    () => output?.ledgers.reduce((sum, l) => sum + l.stages.length, 0) ?? 0,
    [output],
  );

  return (
    <div className="min-h-screen text-[#f5f5f5]" style={{ background: '#0a0a0a', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
        .display { font-family: 'Space Grotesk', system-ui, sans-serif; }
        .panel { background: #0c0c0c; border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; }
        .chip { display:inline-flex; align-items:center; gap:6px; padding:2px 8px; border-radius:3px;
                font-family: 'JetBrains Mono', ui-monospace, monospace; font-size:10px;
                background: rgba(201,183,135,0.08); color: #c9b787; border: 1px solid rgba(201,183,135,0.2); }
        .chip.ok { background: rgba(90,138,110,0.08); color:#5a8a6e; border-color: rgba(90,138,110,0.25); }
        .chip.skip { background: rgba(255,255,255,0.04); color:#666; border-color: rgba(255,255,255,0.08); }
        .hash { font-family:'JetBrains Mono',ui-monospace,monospace; font-size:10px; color:#666; }
        .grid-bg { background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
            background-size: 56px 56px; }
      `}</style>

      <header className="border-b border-white/[0.05] sticky top-0 z-10" style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(8px)' }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/">
            <span className="inline-flex items-center gap-2 text-[12px] text-[#888] hover:text-[#c9b787] cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5" /> Amaru
            </span>
          </Link>
          <span className="mono text-[10px] tracking-[0.2em] uppercase text-[#888]">Ingest Trace · sequence-pipeline backbone</span>
          <button
            type="button"
            onClick={runAll}
            disabled={state === 'running'}
            className="inline-flex items-center gap-2 px-4 py-1.5 text-[12px] font-medium rounded bg-[#c9b787] text-[#0a0a0a] hover:bg-[#d6c69a] disabled:opacity-50"
          >
            <Activity className="w-3.5 h-3.5" />
            {state === 'idle' ? 'Run batch' : state === 'running' ? 'Running…' : 'Re-run'}
          </button>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/[0.05]">
        <div className="absolute inset-0 grid-bg pointer-events-none opacity-50" />
        <div className="relative max-w-6xl mx-auto px-6 py-14">
          <p className="mono text-[10px] tracking-[0.2em] text-[#666] uppercase mb-3">PERCEPTION/BIO PRIMITIVES · WIRED INTO AMARU</p>
          <h1 className="display text-[40px] font-light leading-tight tracking-[-0.02em] max-w-3xl">
            One sequence-pipeline. <span style={{ color: '#c9b787' }}>Seven hashed stages.</span> Visual ingest is a stage, not a side-channel.
          </h1>
          <p className="text-[14px] text-[#9a9a9a] mt-4 max-w-2xl leading-relaxed">
            Every document flows through the same staged ledger: OCR → layout → tables → charts → visual-ground → QA → episodic-map.
            Extraction-confidence troughs are surfaced by the same peak detector that drives MS-DIAL.
            The recall scene is composed in procedural-kit and exported to USD with one call.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-8">
        <div className="panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-[#c9b787]" />
              <h2 className="text-[14px] font-medium">Stage ledger · pipeline.stage.v1</h2>
            </div>
            <span className="hash">{totalStageReceipts} receipts across {output?.ledgers.length ?? 0} pipelines</span>
          </div>
          {output ? (
            <div className="space-y-4">
              {output.ledgers.map((l) => (
                <div key={l.pipelineId} className="rounded border border-white/[0.04] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="mono text-[11px] text-[#c9b787]">{l.pipelineId}</span>
                    <span className="hash">{l.lane} · {l.documentId}</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {l.stages.map((st) => (
                      <div key={`${st.stageName}-${st.stageOrdinal}`} className="rounded border border-white/[0.04] p-2">
                        <div className="mono text-[9px] text-[#888] uppercase tracking-wider truncate">{st.stageName}</div>
                        <div className="hash mt-1 truncate">in {st.inputsHash}</div>
                        <div className="hash truncate">pa {st.paramsHash}</div>
                        <div className="hash truncate">ou {st.outputsHash}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <p className="hash mt-2">
                {source === 'live'
                  ? 'Source: live api-server · real SHA-256 pipeline.stage.v1 chain.'
                  : 'Source: browser fixture · FNV-1a preview hashes. Real SHA-256 chain runs server-side via /api/conduit/ingest-trace/run and is asserted by packages/document-intelligence/src/__tests__/staged-pipeline.test.ts.'}
              </p>
            </div>
          ) : <Idle label="Run the batch to populate the ledger." />}
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mountain className="w-4 h-4 text-[#c9b787]" />
              <h2 className="text-[14px] font-medium">Review queue · peak.detection.v1 (gap mode)</h2>
            </div>
            <span className="hash">α·prominence + β·s/n − γ·shape</span>
          </div>
          {output ? (
            <div className="space-y-2">
              {output.ranked.map((r) => (
                <div key={r.documentId} className="rounded border border-white/[0.04] p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="chip">#{r.rank}</span>
                    <span className="mono text-[12px] text-[#f5f5f5] truncate">{r.documentId}</span>
                    <span className="hash truncate">{r.anchorChunkId}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="hash">prom {r.peak.prominence.toFixed(3)}</span>
                    <span className="hash">s/n {r.peak.snRatio.toFixed(2)}</span>
                    <span className="chip ok">score {r.compositeScore.toFixed(3)}</span>
                  </div>
                </div>
              ))}
              {output.ranked.length === 0 && <p className="text-[11px] text-[#666]">No documents crossed the prominence threshold.</p>}
            </div>
          ) : <Idle label="Run the batch to surface confidence troughs." />}
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-[#c9b787]" />
              <h2 className="text-[14px] font-medium">Episodic map · procedural-kit → USD</h2>
            </div>
            {output ? <span className="hash">recall {output.recall.recallId} · {output.usd.prims.length} prims</span> : null}
          </div>
          {output ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <div className="mono text-[10px] uppercase tracking-wider text-[#666] mb-2">Scene · part graph</div>
                <div className="space-y-1">
                  {output.recall.items.map((hit, i) => (
                    <div key={hit.episodeId} className="rounded border border-white/[0.04] p-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="mono text-[11px] text-[#c9b787]">episode-{i} ← {hit.episodeId}</span>
                        <span className="chip ok">fused {hit.fused.toFixed(2)}</span>
                      </div>
                      <div className="hash">
                        t [0.00, {((hit.temporalSim - 0.5) * 2).toFixed(2)}, {(-Math.max(0, 1 - hit.fused) * 4).toFixed(2)}] · content {hit.contentSim.toFixed(2)} · temporal {hit.temporalSim.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="mono text-[10px] uppercase tracking-wider text-[#666] mb-2">USD stage · {output.usd.uvStrategy}</div>
                <pre className="mono text-[10px] text-[#aaa] bg-black/40 p-3 rounded border border-white/[0.04] max-h-72 overflow-y-auto leading-relaxed">
{output.usd.prims.map((p) => `${p.typeName.padEnd(5)} ${p.primPath}${p.meshRef ? `  ← ${p.meshRef}` : ''}`).join('\n')}
                </pre>
              </div>
            </div>
          ) : <Idle label="Run the batch to compose the recall scene." />}
        </div>
      </main>
    </div>
  );
}

function Idle({ label }: { label: string }) {
  return <p className="text-[11px] text-[#666] mono">{label}</p>;
}
