#!/usr/bin/env node
/**
 * Calibrate the thesis-RAG rescale multiplier per embedder backend.
 *
 * Runs a representative discovery set (doctrine-aligned + unrelated
 * artifacts) through `defaultThesisProbe` under two backends:
 *
 *   1. aef-dev-hash      — the always-available fabric backend.
 *   2. simulated-bge-m3  — a deterministic mock that mimics the dense,
 *      L2-normalized cosine distribution of BGE-M3 / similar semantic
 *      backends (related ~0.55-0.75, unrelated ~0.10-0.25).
 *
 * For each backend we report the meanTop distribution (pre-rescale)
 * and the resulting thesisFit (post-rescale). The numbers in
 * `THESIS_FIT_RESCALE_BY_BACKEND` were chosen from this output.
 *
 * Run with:
 *   node services/frontier-ingest/scripts/calibrate-thesis-fit.mjs
 *
 * Network is not required; both backends used here are local.
 */
import {
  _resetThesisRagForTests,
  featureHashEmbed,
  installDefaultThesisProbe,
  scoreArtifact,
  setThesisEmbedFn,
} from '../dist/index.js';

const ALIGNED = [
  {
    title: 'Self-improving agent doctrine with ouroboros critique loops',
    summary: 'Lutar-style routing across an alloy of specialist models',
    tags: ['agent', 'doctrine', 'router'],
  },
  {
    title: 'Reflection-based curriculum for inference distillation',
    summary: 'Iterative feedback over evaluation harness traces',
    tags: ['evaluation', 'distillation'],
  },
  {
    title: 'Codex thesis: alignment-preserving retrieval over governance corpora',
    summary: 'Lambda-gated promotion of doctrine artifacts',
    tags: ['rag', 'governance'],
  },
  {
    title: 'Auto-evaluation feedback loop for agentic orchestration',
    summary: 'Self-critique and reflection in long-horizon planning',
    tags: ['agent', 'evaluation'],
  },
  {
    title: 'Routing benchmark suite for multi-model alloys',
    summary: 'Cost-aware dispatch with safety invariants',
    tags: ['router', 'benchmark'],
  },
  {
    title: 'Continual doctrine refinement via thesis-grounded retrieval',
    summary: 'Closure audits and invariant preservation',
    tags: ['doctrine', 'rag'],
  },
  {
    title: 'Ouroboros self-improvement with lambda gates',
    summary: 'Closed-loop safety review for agent upgrades',
    tags: ['agent', 'safety'],
  },
  {
    title: 'Alloy of distilled specialists for governed inference',
    summary: 'Curriculum-driven reflection and critique cycles',
    tags: ['distillation', 'governance'],
  },
];

const UNRELATED = [
  { title: 'Best pasta carbonara recipe', summary: 'Eggs, guanciale, pecorino', tags: ['food'] },
  { title: 'Hiking the John Muir trail', summary: 'Permit logistics and gear list', tags: ['travel'] },
  { title: 'Restoring vintage tube amplifiers', summary: 'Capacitor replacement guide', tags: ['hardware'] },
  { title: 'Sourdough hydration calculator', summary: 'Bakers percentage spreadsheets', tags: ['baking'] },
  { title: 'Astrophotography on a budget', summary: 'Mount tracking and stacking', tags: ['photo'] },
  { title: 'Knitting cable patterns', summary: 'Aran sweater construction', tags: ['craft'] },
  { title: 'Mountain bike trail maintenance', summary: 'Drainage berms and switchbacks', tags: ['outdoor'] },
  { title: 'Espresso machine descaling', summary: 'Pump pressure calibration', tags: ['coffee'] },
];

function makeArtifact(idx, partial) {
  return {
    id: `calib-${idx}`,
    provider: 'anthropic',
    kind: 'paper',
    externalId: `ext-${idx}`,
    url: 'https://example.com',
    discoveredAt: new Date().toISOString(),
    ...partial,
  };
}

// Deterministic dense-cosine mock that mimics BGE-M3-style behavior:
// related-text pairs cluster around cos ~0.55-0.75, unrelated around
// ~0.10-0.25. Built by mixing the feature-hash signal (which gives
// us topical relatedness) with a constant bias vector (which lifts
// the baseline cosine into the dense-embedding regime).
function simulatedBgeEmbed(texts) {
  const DIM = 256;
  const BIAS_WEIGHT = 0.6;
  return Promise.resolve(
    texts.map((t) => {
      const fh = featureHashEmbed(t, DIM);
      // Add a constant bias on a few axes (mimics the always-on
      // semantic features of a dense encoder).
      const v = new Array(DIM).fill(0);
      for (let i = 0; i < DIM; i++) {
        v[i] = (fh[i] ?? 0) + (i < 16 ? BIAS_WEIGHT : 0);
      }
      // L2-normalize, like real embedders.
      let n = 0;
      for (const x of v) n += x * x;
      n = Math.sqrt(n) || 1;
      for (let i = 0; i < DIM; i++) v[i] /= n;
      return v;
    }),
  );
}

function summarize(label, samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const p = (q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  return `${label.padEnd(28)}  n=${samples.length}  min=${sorted[0].toFixed(3)}  p25=${p(0.25).toFixed(3)}  median=${p(0.5).toFixed(3)}  p75=${p(0.75).toFixed(3)}  max=${sorted[sorted.length - 1].toFixed(3)}  mean=${mean.toFixed(3)}`;
}

async function measure(backendLabel, embedFnOrNull) {
  _resetThesisRagForTests();
  if (embedFnOrNull) setThesisEmbedFn(embedFnOrNull);
  installDefaultThesisProbe();

  const aligned = [];
  const unrelated = [];
  for (let i = 0; i < ALIGNED.length; i++) {
    const s = await scoreArtifact(makeArtifact(i, ALIGNED[i]));
    aligned.push(s.thesisFit);
  }
  for (let i = 0; i < UNRELATED.length; i++) {
    const s = await scoreArtifact(makeArtifact(1000 + i, UNRELATED[i]));
    unrelated.push(s.thesisFit);
  }
  console.log(`\n=== ${backendLabel} ===`);
  console.log(summarize('aligned   thesisFit', aligned));
  console.log(summarize('unrelated thesisFit', unrelated));
}

await measure('aef-dev-hash (fabric)', null);
await measure('simulated-bge-m3', simulatedBgeEmbed);
console.log('\nDone. Update THESIS_FIT_RESCALE_BY_BACKEND in src/thesis-rag.ts if the');
console.log('aligned median falls outside [0.55, 0.95] or unrelated median exceeds 0.35.');
