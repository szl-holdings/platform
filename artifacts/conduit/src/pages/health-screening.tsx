/**
 * Deployment Health Screening — end-to-end demo composing:
 *   - Unstructured ingestion (schema-grounded extraction, KnowledgeExtraction primitive)
 *   - Visual ingestion (SeeingEye — grounded bbox + frame hash + perceptual hash)
 *   - Episodic mapping recall (memnet — dual-index content + temporal)
 *
 * Renders a single commander dashboard that unifies all three feeds into one
 * synthetic "field assessment" record stream, with the Doctrine V6 receipts
 * attached to every row.
 */

import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import {
  ArrowLeft,
  FileText,
  Eye,
  Brain,
  ShieldCheck,
  AlertTriangle,
  Activity,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

// ─── Synthetic source corpus ─────────────────────────────────────────────────
// Mix of: free-text intake notes (extraction), scanned-form fields (visual),
// and a historical sync mapping (recall).

const INTAKE_NOTE = `Field Assessment — Site PSC-204 (Pierside Container Yard)
Date: 2026-05-22  Inspector: M. Okafor (Cert #4172)

Reefer container TGHU-9182 observed with frost migration on port-side door
seal. Set temperature 4°C; observed return air 9°C. Power draw nominal at
4.8 kW. Crew log notes a defrost cycle held 24 minutes — within tolerance
but trending. No coolant odor. Recommend re-inspect within 72 hours.
Container weight 24,180 kg; manifest 24,200 kg. Risk tier: AMBER.`;

const SCANNED_FORM_FRAME = new Uint8Array([
  // synthetic, deterministic; this is the bytes used to hash the frame.
  ...new TextEncoder().encode('PSC-204|reefer|TGHU-9182|2026-05-22'),
]);

const HISTORICAL_MAPPINGS = [
  {
    episodeId: 'map-2024-q3-pier-a',
    text: 'reefer temperature defrost frost migration door seal amber',
    occurredAt: '2024-08-12T11:30:00Z',
    payload: { sourceField: 'observed_return_air_c', destField: 'reefer.return_air_c', outcome: 'accepted' },
    scope: 'reefer-screening',
  },
  {
    episodeId: 'map-2025-q1-pier-b',
    text: 'container weight manifest variance reefer',
    occurredAt: '2025-03-04T09:10:00Z',
    payload: { sourceField: 'observed_weight_kg', destField: 'reefer.gross_weight_kg', outcome: 'accepted' },
    scope: 'reefer-screening',
  },
  {
    episodeId: 'map-2025-q4-emergency',
    text: 'fire suppression discharge valve check pressure',
    occurredAt: '2025-11-19T14:55:00Z',
    payload: { sourceField: 'valve_pressure_psi', destField: 'fire.suppression_pressure_psi', outcome: 'rejected' },
    scope: 'fire-screening',
  },
  {
    episodeId: 'map-2026-q1-pier-a',
    text: 'reefer power draw kw amperage observed nominal',
    occurredAt: '2026-02-08T08:20:00Z',
    payload: { sourceField: 'power_draw_kw', destField: 'reefer.power_kw', outcome: 'accepted' },
    scope: 'reefer-screening',
  },
];

// ─── Inline mirror of the schema-grounded extraction logic ───────────────────
// We avoid pulling node:crypto into the browser bundle by using subtle-crypto
// equivalents that produce the *shape* of the doctrine receipt for demo.

async function sha256Hex(s: string): Promise<string> {
  const enc = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface ExtractedField {
  field: string;
  value: string | number;
  confidence: number;
  spanText: string;
  spanHash: string;
}
interface FieldGap { field: string; reason: string }
interface FieldConflict { field: string; candidates: Array<{ value: string; confidence: number }> }

interface ExtractionReceipt {
  schemaRef: string;
  documentHash: string;
  extracted: ExtractedField[];
  gaps: FieldGap[];
  conflicts: FieldConflict[];
  receiptHash: string;
}

// Deterministic synthetic extractor: regex-driven for a fixed schema.
async function runUnstructuredExtraction(text: string): Promise<ExtractionReceipt> {
  const documentHash = await sha256Hex(text);
  const fields: ExtractedField[] = [];
  const gaps: FieldGap[] = [];
  const conflicts: FieldConflict[] = [];

  async function captureNumber(field: string, re: RegExp): Promise<void> {
    const m = text.match(re);
    if (!m) { gaps.push({ field, reason: 'no-source-span' }); return; }
    // Strip commas/spaces/currency so 24,180 → 24180 (not NaN).
    const value = Number(m[1].replace(/[,\s$]/g, ''));
    if (!Number.isFinite(value)) { gaps.push({ field, reason: 'type-mismatch' }); return; }
    const spanHash = await sha256Hex(`${documentHash}|${m.index}|${(m.index ?? 0) + m[0].length}|${m[0]}`);
    fields.push({ field, value, confidence: 0.92, spanText: m[0], spanHash: spanHash.slice(0, 12) });
  }
  async function captureString(field: string, re: RegExp): Promise<void> {
    const m = text.match(re);
    if (!m) { gaps.push({ field, reason: 'no-source-span' }); return; }
    const spanHash = await sha256Hex(`${documentHash}|${m.index}|${(m.index ?? 0) + m[0].length}|${m[1]}`);
    fields.push({ field, value: m[1], confidence: 0.88, spanText: m[0], spanHash: spanHash.slice(0, 12) });
  }

  await captureString('container_id', /([A-Z]{4}-\d{4,})/);
  await captureNumber('set_temp_c', /Set temperature (-?\d+(?:\.\d+)?)\s*°C/);
  await captureNumber('return_air_c', /return air (-?\d+(?:\.\d+)?)\s*°C/);
  await captureNumber('power_draw_kw', /Power draw nominal at\s+(\d+(?:\.\d+)?)\s*kW/);
  await captureNumber('defrost_minutes', /defrost cycle held (\d+) minutes/);
  await captureNumber('weight_kg', /[Cc]ontainer weight\s+(\d[\d,]*)\s*kg/);
  await captureNumber('manifest_kg', /manifest\s+(\d[\d,]*)\s*kg/);
  await captureString('risk_tier', /Risk tier:\s+(AMBER|GREEN|RED)/);

  // Synthetic conflict: variance between manifest and weight is itself
  // surfaced as a structural conflict, not silently averaged.
  const weight = fields.find((f) => f.field === 'weight_kg');
  const manifest = fields.find((f) => f.field === 'manifest_kg');
  if (weight && manifest && weight.value !== manifest.value) {
    conflicts.push({
      field: 'weight_vs_manifest',
      candidates: [
        { value: `${weight.value} kg (observed)`, confidence: weight.confidence },
        { value: `${manifest.value} kg (manifest)`, confidence: manifest.confidence },
      ],
    });
  }

  const receiptHash = await sha256Hex(JSON.stringify({
    schemaRef: 'amaru.reefer-screening.v1', documentHash,
    extracted: fields.map((f) => ({ field: f.field, value: f.value, spanHash: f.spanHash })),
    gaps: gaps.map((g) => g.field), conflicts: conflicts.map((c) => c.field),
  }));

  return {
    schemaRef: 'amaru.reefer-screening.v1',
    documentHash: documentHash.slice(0, 16),
    extracted: fields,
    gaps,
    conflicts,
    receiptHash: receiptHash.slice(0, 16),
  };
}

interface VisualDetection {
  label: string;
  bbox: [number, number, number, number];
  confidence: number;
}
interface VisualReceipt {
  schemaRef: string;
  frameHash: string;
  perceptualHash: string;
  detections: VisualDetection[];
  notDetected: string[];
  receiptHash: string;
}

async function runVisualExtraction(frame: Uint8Array): Promise<VisualReceipt> {
  const hex = await sha256Hex(Array.from(frame).map((b) => String.fromCharCode(b)).join(''));
  // Synthetic, deterministic "detections" representing what SeeingEye would emit.
  const detections: VisualDetection[] = [
    { label: 'door_seal_frost',       bbox: [0.12, 0.22, 0.31, 0.38], confidence: 0.86 },
    { label: 'reefer_display_panel',  bbox: [0.58, 0.14, 0.78, 0.32], confidence: 0.91 },
    { label: 'manifest_placard',      bbox: [0.40, 0.62, 0.66, 0.78], confidence: 0.79 },
  ];
  const askedLabels = ['door_seal_frost', 'reefer_display_panel', 'manifest_placard', 'coolant_leak', 'damage_to_corner_post'];
  const detectedSet = new Set(detections.map((d) => d.label));
  const notDetected = askedLabels.filter((l) => !detectedSet.has(l));

  const receiptHash = await sha256Hex(JSON.stringify({
    schemaRef: 'amaru.reefer-visual.v1',
    frameHash: hex,
    detections: detections.map((d) => ({ label: d.label, bbox: d.bbox })),
    notDetected,
  }));

  return {
    schemaRef: 'amaru.reefer-visual.v1',
    frameHash: hex.slice(0, 16),
    perceptualHash: hex.slice(16, 32),
    detections,
    notDetected,
    receiptHash: receiptHash.slice(0, 16),
  };
}

// ─── Deterministic in-browser bag-of-tokens embedding for memnet recall demo
function hashEmbedding(text: string, dims = 32): number[] {
  const v = new Array<number>(dims).fill(0);
  const tokens = text.toLowerCase().split(/[^a-z0-9]+/g).filter(Boolean);
  for (const tok of tokens) {
    let h = 2166136261;
    for (let i = 0; i < tok.length; i++) {
      h = Math.imul(h ^ tok.charCodeAt(i), 16777619);
    }
    for (let i = 0; i < dims; i++) {
      v[i] += (((h >>> i) & 1) ? 1 : -1);
    }
  }
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}
function cosine(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return Math.max(0, Math.min(1, dot));
}
function temporalScore(occurredAt: string, now: Date, halflifeDays: number): number {
  const dt = Math.max(0, now.getTime() - new Date(occurredAt).getTime());
  return Math.pow(0.5, dt / (halflifeDays * 86400_000));
}

interface RecallHit {
  episodeId: string;
  scope: string;
  payload: { sourceField: string; destField: string; outcome: string };
  contentSim: number;
  temporalSim: number;
  fused: number;
}

interface RecallReceipt {
  recallId: string;
  items: RecallHit[];
  fusionRule: 'sqrt(content*temporal)';
  receiptHash: string;
}

async function runMappingRecall(queryText: string, scope: string): Promise<RecallReceipt> {
  const q = hashEmbedding(queryText);
  const now = new Date('2026-05-27T00:00:00Z');
  const scored = HISTORICAL_MAPPINGS.map((ep) => {
    const c = cosine(q, hashEmbedding(ep.text));
    const t = temporalScore(ep.occurredAt, now, 180);
    return {
      episodeId: ep.episodeId, scope: ep.scope, payload: ep.payload,
      contentSim: c, temporalSim: t, fused: Math.sqrt(c * t),
    };
  });
  const items = scored
    .filter((s) => s.scope === scope)
    .sort((a, b) => b.fused - a.fused)
    .slice(0, 3);
  const recallId = await sha256Hex(`${queryText}|${scope}|${now.toISOString()}`);
  const receiptHash = await sha256Hex(JSON.stringify({
    recallId, items: items.map((i) => ({ id: i.episodeId, fused: i.fused.toFixed(4) })),
  }));
  return {
    recallId: recallId.slice(0, 12),
    items,
    fusionRule: 'sqrt(content*temporal)',
    receiptHash: receiptHash.slice(0, 16),
  };
}

// ─── UI ──────────────────────────────────────────────────────────────────────

type RunState = 'idle' | 'running' | 'done';

export default function HealthScreeningPage() {
  const [state, setState] = useState<RunState>('idle');
  const [extraction, setExtraction] = useState<ExtractionReceipt | null>(null);
  const [visual, setVisual] = useState<VisualReceipt | null>(null);
  const [recall, setRecall] = useState<RecallReceipt | null>(null);

  async function runAll() {
    setState('running');
    const [e, v, r] = await Promise.all([
      runUnstructuredExtraction(INTAKE_NOTE),
      runVisualExtraction(SCANNED_FORM_FRAME),
      runMappingRecall('reefer return air defrost frost door seal', 'reefer-screening'),
    ]);
    setExtraction(e); setVisual(v); setRecall(r);
    setState('done');
  }

  const unifiedRecord = useMemo(() => {
    if (!extraction || !visual || !recall) return null;
    return {
      assessmentId: 'PSC-204·2026-05-22',
      structured: Object.fromEntries(extraction.extracted.map((f) => [f.field, f.value])),
      visual: visual.detections.map((d) => d.label),
      reusedMappings: recall.items.map((i) => `${i.payload.sourceField} → ${i.payload.destField}`),
    };
  }, [extraction, visual, recall]);

  return (
    <div className="min-h-screen text-[#f5f5f5]" style={{ background: '#0a0a0a', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
        .display { font-family: 'Space Grotesk', system-ui, sans-serif; }
        .panel { background: #0c0c0c; border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; }
        .chip { display:inline-flex; align-items:center; gap:6px; padding:2px 8px; border-radius:3px;
                font-family: 'JetBrains Mono', ui-monospace, monospace; font-size:10px;
                background: rgba(201,183,135,0.08); color: #c9b787; border: 1px solid rgba(201,183,135,0.2); }
        .chip.warn { background: rgba(212,168,83,0.08); color:#d4a853; border-color: rgba(212,168,83,0.25); }
        .chip.bad  { background: rgba(184,84,80,0.08); color:#b85450; border-color: rgba(184,84,80,0.25); }
        .chip.ok   { background: rgba(90,138,110,0.08); color:#5a8a6e; border-color: rgba(90,138,110,0.25); }
        .hash { font-family:'JetBrains Mono',ui-monospace,monospace; font-size:10px; color:#666; }
        .grid-bg {
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 56px 56px;
        }
      `}</style>

      <header className="border-b border-white/[0.05] sticky top-0 z-10" style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(8px)' }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/">
            <span className="inline-flex items-center gap-2 text-[12px] text-[#888] hover:text-[#c9b787] cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5" /> Amaru
            </span>
          </Link>
          <span className="mono text-[10px] tracking-[0.2em] uppercase text-[#888]">Deployment Health Screening · Demo</span>
          <button
            onClick={runAll}
            disabled={state === 'running'}
            className="inline-flex items-center gap-2 px-4 py-1.5 text-[12px] font-medium rounded bg-[#c9b787] text-[#0a0a0a] hover:bg-[#d6c69a] disabled:opacity-50"
          >
            <Activity className="w-3.5 h-3.5" />
            {state === 'idle' ? 'Run screening' : state === 'running' ? 'Running…' : 'Re-run'}
          </button>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/[0.05]">
        <div className="absolute inset-0 grid-bg pointer-events-none opacity-50" />
        <div className="relative max-w-6xl mx-auto px-6 py-14">
          <p className="mono text-[10px] tracking-[0.2em] text-[#666] uppercase mb-3">DEMO · SYNTHETIC PIERSIDE REEFER ASSESSMENT</p>
          <h1 className="display text-[40px] font-light leading-tight tracking-[-0.02em] max-w-3xl">
            One assessment. Three ingestion paths. <span style={{ color: '#c9b787' }}>One receipt-bound record.</span>
          </h1>
          <p className="text-[14px] text-[#9a9a9a] mt-4 max-w-2xl leading-relaxed">
            A scanned form (visual), a free-text inspector note (extraction), and historical mapping
            decisions (recall) collapse into a single commander record — every field linked to its source
            span, every visual claim grounded by frame hash, every reused mapping cited by episode ID.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-8">
        {/* PIPELINE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* UNSTRUCTURED */}
          <div className="panel p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#c9b787]" />
                <h2 className="text-[13px] font-medium">Unstructured · schema-grounded</h2>
              </div>
              <span className="mono text-[9px] text-[#666] uppercase tracking-wider">KE.01</span>
            </div>
            <p className="text-[11px] text-[#888] mb-3 leading-relaxed">
              Free-text inspector note → schema-bound rows. Gaps and conflicts survive.
            </p>
            <pre className="mono text-[10px] text-[#aaa] bg-black/40 p-3 rounded border border-white/[0.04] whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">{INTAKE_NOTE}</pre>

            {extraction ? (
              <div className="mt-4 space-y-3">
                <ReceiptHeader kind="extraction.schema-grounded.v1" hash={extraction.receiptHash} />
                <div className="space-y-1.5">
                  {extraction.extracted.map((f) => (
                    <div key={f.field} className="flex items-center justify-between text-[11px] gap-2">
                      <span className="text-[#888] mono">{f.field}</span>
                      <span className="text-[#f5f5f5] flex-1 text-right truncate">{String(f.value)}</span>
                      <span className="hash">{f.spanHash}</span>
                    </div>
                  ))}
                </div>
                {extraction.gaps.length > 0 && (
                  <div>
                    <div className="mono text-[9px] uppercase tracking-wider text-[#666] mb-1">Gaps · first-class</div>
                    {extraction.gaps.map((g) => (
                      <div key={g.field} className="chip warn mr-1.5 mb-1.5">
                        <AlertTriangle className="w-2.5 h-2.5" /> {g.field} · {g.reason}
                      </div>
                    ))}
                  </div>
                )}
                {extraction.conflicts.length > 0 && (
                  <div>
                    <div className="mono text-[9px] uppercase tracking-wider text-[#666] mb-1">Conflicts · first-class</div>
                    {extraction.conflicts.map((c) => (
                      <div key={c.field} className="text-[11px] mb-1.5">
                        <span className="chip bad mr-2"><XCircle className="w-2.5 h-2.5" /> {c.field}</span>
                        {c.candidates.map((cand, i) => (
                          <span key={i} className="mono text-[10px] text-[#aaa] mr-2">{cand.value}</span>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Idle />
            )}
          </div>

          {/* VISUAL */}
          <div className="panel p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#c9b787]" />
                <h2 className="text-[13px] font-medium">Visual · SeeingEye grounded</h2>
              </div>
              <span className="mono text-[9px] text-[#666] uppercase tracking-wider">SEE.02</span>
            </div>
            <p className="text-[11px] text-[#888] mb-3 leading-relaxed">
              Frame → labelled detections. Every claim carries bbox + frame hash. Negative claims first-class.
            </p>
            {visual ? (
              <div className="space-y-3">
                <FrameVisualisation detections={visual.detections} />
                <ReceiptHeader kind="vision.seeing-eye.v1" hash={visual.receiptHash} />
                <div className="space-y-1.5">
                  {visual.detections.map((d) => (
                    <div key={d.label} className="flex items-center justify-between text-[11px]">
                      <span className="mono text-[#888]">{d.label}</span>
                      <span className="hash">bbox [{d.bbox.map((n) => n.toFixed(2)).join(', ')}]</span>
                      <span className="chip ok"><CheckCircle2 className="w-2.5 h-2.5" /> {(d.confidence * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="mono text-[9px] uppercase tracking-wider text-[#666] mb-1">notDetected · first-class</div>
                  {visual.notDetected.map((l) => (
                    <span key={l} className="chip warn mr-1.5 mb-1.5">∅ {l}</span>
                  ))}
                </div>
                <div className="text-[10px] text-[#666] mono pt-1 border-t border-white/[0.04]">
                  frameHash · {visual.frameHash}
                  <br />pHash &nbsp;&nbsp;· {visual.perceptualHash}
                </div>
              </div>
            ) : (
              <Idle />
            )}
          </div>

          {/* RECALL */}
          <div className="panel p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#c9b787]" />
                <h2 className="text-[13px] font-medium">Episodic recall · memnet</h2>
              </div>
              <span className="mono text-[9px] text-[#666] uppercase tracking-wider">MEM.03</span>
            </div>
            <p className="text-[11px] text-[#888] mb-3 leading-relaxed">
              Dual-index (content + temporal) recall over prior mappings in this scope. Reused mapping
              emits its own receipt.
            </p>
            {recall ? (
              <div className="space-y-3">
                <ReceiptHeader kind="memory.recall.v1" hash={recall.receiptHash} />
                <div className="space-y-2">
                  {recall.items.map((i) => (
                    <div key={i.episodeId} className="rounded border border-white/[0.04] p-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="mono text-[10px] text-[#c9b787]">{i.episodeId}</span>
                        <span className="chip ok">fused {i.fused.toFixed(2)}</span>
                      </div>
                      <div className="text-[11px] text-[#c8c8c8]">
                        <span className="mono text-[#888]">{i.payload.sourceField}</span>
                        <span className="mx-1 text-[#666]">→</span>
                        <span className="mono">{i.payload.destField}</span>
                      </div>
                      <div className="flex gap-2 mt-1.5">
                        <span className="hash">content {i.contentSim.toFixed(2)}</span>
                        <span className="hash">temporal {i.temporalSim.toFixed(2)}</span>
                        <span className={`chip ${i.payload.outcome === 'accepted' ? 'ok' : 'bad'}`}>{i.payload.outcome}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mono text-[9px] text-[#666] uppercase tracking-wider pt-1 border-t border-white/[0.04]">
                  fusion rule · {recall.fusionRule}
                </p>
              </div>
            ) : (
              <Idle />
            )}
          </div>
        </div>

        {/* COMMANDER DASHBOARD */}
        {unifiedRecord && (
          <div className="panel p-6">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#c9b787]" />
                <h2 className="display text-[20px] font-medium tracking-tight">Commander record · unified</h2>
              </div>
              <span className="chip ok">all three receipts attached</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.05] rounded overflow-hidden">
              <div className="p-4" style={{ background: '#0a0a0a' }}>
                <p className="mono text-[9px] uppercase tracking-wider text-[#666] mb-2">Assessment</p>
                <p className="display text-[18px] font-light text-[#f5f5f5]">{unifiedRecord.assessmentId}</p>
                <p className="text-[11px] text-[#888] mt-1">
                  {Object.keys(unifiedRecord.structured).length} structured fields ·{' '}
                  {unifiedRecord.visual.length} visual claims · {unifiedRecord.reusedMappings.length} reused mappings
                </p>
              </div>
              <div className="p-4" style={{ background: '#0a0a0a' }}>
                <p className="mono text-[9px] uppercase tracking-wider text-[#666] mb-2">Structured</p>
                <div className="space-y-0.5">
                  {Object.entries(unifiedRecord.structured).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-[11px]">
                      <span className="mono text-[#888]">{k}</span>
                      <span className="mono text-[#f5f5f5]">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4" style={{ background: '#0a0a0a' }}>
                <p className="mono text-[9px] uppercase tracking-wider text-[#666] mb-2">Reused mappings</p>
                <div className="space-y-1.5">
                  {unifiedRecord.reusedMappings.map((m) => (
                    <div key={m} className="mono text-[11px] text-[#c8c8c8]">{m}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
              {extraction && <ReceiptCard kind="extraction.schema-grounded.v1" hash={extraction.receiptHash} />}
              {visual && <ReceiptCard kind="vision.seeing-eye.v1" hash={visual.receiptHash} />}
              {recall && <ReceiptCard kind="memory.recall.v1" hash={recall.receiptHash} />}
            </div>

            <p className="text-[11px] text-[#666] mt-5 leading-relaxed">
              Each receipt is content-addressed; replaying this assessment with the same inputs produces
              identical receipt hashes. Gaps, conflicts, and notDetected lists are part of the receipt
              — not silently dropped. This is the &ldquo;no mock theater&rdquo; principle applied to
              ingestion.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function Idle() {
  return (
    <div className="mt-4 text-[11px] text-[#555] italic">No run yet — click &ldquo;Run screening&rdquo;.</div>
  );
}

function ReceiptHeader({ kind, hash }: { kind: string; hash: string }) {
  return (
    <div className="flex items-center justify-between text-[10px] mono py-2 border-y border-white/[0.04]">
      <span className="text-[#c9b787]">{kind}</span>
      <span className="text-[#666]">{hash}</span>
    </div>
  );
}

function ReceiptCard({ kind, hash }: { kind: string; hash: string }) {
  return (
    <div className="rounded border border-[#c9b787]/20 bg-[#c9b787]/[0.03] p-3">
      <p className="mono text-[10px] text-[#c9b787]">{kind}</p>
      <p className="mono text-[10px] text-[#666] mt-1">{hash}</p>
    </div>
  );
}

function FrameVisualisation({ detections }: { detections: VisualDetection[] }) {
  // Synthetic frame canvas — shows bboxes against a faux scene.
  const W = 280, H = 160;
  return (
    <div className="relative rounded border border-white/[0.06] overflow-hidden" style={{ width: '100%', aspectRatio: `${W} / ${H}`, background: 'linear-gradient(180deg,#1a1814,#0f0e0c)' }}>
      <div className="absolute inset-0 grid-bg opacity-30" />
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full">
        {detections.map((d) => {
          const [x0, y0, x1, y1] = d.bbox;
          const rx = x0 * W, ry = y0 * H, rw = (x1 - x0) * W, rh = (y1 - y0) * H;
          return (
            <g key={d.label}>
              <rect x={rx} y={ry} width={rw} height={rh}
                stroke="#c9b787" strokeWidth="1" fill="rgba(201,183,135,0.08)" />
              <text x={rx + 2} y={ry - 2} fill="#c9b787" fontFamily="JetBrains Mono" fontSize="7">{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
