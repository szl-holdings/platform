/**
 * A11oy Leader-Grade Upgrades (Task #5172)
 *
 * Adds four enterprise-grade capabilities to existing A11oy surfaces:
 *  1. Eval Console diff + significance (Welch's t-test) + regression alerts
 *  2. Agent BOM CycloneDX + HTML attestation export + re-verification
 *  3. PRISM counterfactual decision replay
 *  4. Pattern Atlas usage telemetry + auto-graduation
 *
 * Endpoints (all mounted under /api):
 *   POST /a11oy/eval/compare
 *   GET  /a11oy/eval/alerts
 *   POST /a11oy/eval/alerts/baseline
 *   POST /a11oy/proof/bom/:agentId/cyclonedx
 *   GET  /a11oy/proof/bom/:agentId/attestation
 *   POST /a11oy/proof/verify
 *   POST /a11oy/decisions/counterfactual
 *   POST /a11oy/patterns/track
 *   GET  /a11oy/patterns/telemetry
 */

import { type Request, type Response, Router } from 'express';
import { createHash } from 'node:crypto';
import { ReceiptChain } from '@szl-holdings/szl-receipts';
import { runStore } from './evals';
import {
  handleRouteError,
  sendBadRequest,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';

const router = Router();

// ─── 1. Eval diff + significance ──────────────────────────────────────────────

interface CaseDiffEntry {
  caseId: string;
  label: string;
  domain?: string;
  baseline: { passed: boolean; score: number; latencyMs: number } | null;
  variant: { passed: boolean; score: number; latencyMs: number } | null;
  scoreDelta: number | null;
  latencyDelta: number | null;
  statusChange: 'pass→pass' | 'pass→fail' | 'fail→pass' | 'fail→fail' | 'added' | 'removed';
}

interface CompareSummary {
  baselineRunId: string;
  variantRunId: string;
  suiteId: string;
  baselineAvgScore: number;
  variantAvgScore: number;
  scoreDelta: number;
  baselinePassRate: number;
  variantPassRate: number;
  passRateDelta: number;
  baselineAvgLatencyMs: number;
  variantAvgLatencyMs: number;
  latencyDeltaMs: number;
  pValue: number;
  ci95: [number, number];
  significant: boolean;
  significanceLabel: 'significant_regression' | 'significant_improvement' | 'no_significant_change';
  alignedCases: number;
  cases: CaseDiffEntry[];
}

// Welch's t-test on two independent samples. Returns t-stat, df, two-sided p
// approximated via the survival function of a Student-t distribution.
function welchTTest(a: number[], b: number[]): { t: number; df: number; p: number; ci95: [number, number] } {
  const n1 = a.length;
  const n2 = b.length;
  if (n1 < 2 || n2 < 2) return { t: 0, df: 0, p: 1, ci95: [0, 0] };
  const mean1 = a.reduce((s, x) => s + x, 0) / n1;
  const mean2 = b.reduce((s, x) => s + x, 0) / n2;
  const var1 = a.reduce((s, x) => s + (x - mean1) ** 2, 0) / (n1 - 1);
  const var2 = b.reduce((s, x) => s + (x - mean2) ** 2, 0) / (n2 - 1);
  const se = Math.sqrt(var1 / n1 + var2 / n2);
  if (se === 0) {
    const delta = mean2 - mean1;
    return { t: 0, df: n1 + n2 - 2, p: delta === 0 ? 1 : 0, ci95: [delta, delta] };
  }
  const t = (mean2 - mean1) / se;
  const numer = (var1 / n1 + var2 / n2) ** 2;
  const denom = (var1 / n1) ** 2 / (n1 - 1) + (var2 / n2) ** 2 / (n2 - 1);
  const df = denom === 0 ? n1 + n2 - 2 : numer / denom;
  const p = 2 * studentTSurvival(Math.abs(t), df);
  // 95% CI for mean difference; t-critical ~1.96 for large df, use a small adj.
  const tCrit = df > 30 ? 1.96 : 2.262;
  const margin = tCrit * se;
  return { t, df, p, ci95: [mean2 - mean1 - margin, mean2 - mean1 + margin] };
}

// Survival function of Student-t — P(T > t) for t >= 0.
// Uses regularized incomplete beta via continued fraction (numerically stable
// for the modest df we get from eval runs).
function studentTSurvival(t: number, df: number): number {
  if (df <= 0) return 0.5;
  const x = df / (df + t * t);
  return 0.5 * incompleteBeta(x, df / 2, 0.5);
}

function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lnBeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lnBeta) / a;
  return front * betaContinuedFraction(x, a, b);
}

function betaContinuedFraction(x: number, a: number, b: number): number {
  const maxIter = 200;
  const eps = 3e-7;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= maxIter; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < eps) break;
  }
  return h;
}

function logGamma(x: number): number {
  const cof = [
    76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155,
    0.1208650973866179e-2, -0.5395239384953e-5,
  ];
  let y = x;
  const tmp = x + 5.5 - (x + 0.5) * Math.log(x + 5.5);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) {
    y += 1;
    ser += cof[j]! / y;
  }
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

router.post('/a11oy/eval/compare', (req: Request, res: Response) => {
  try {
    const body = req.body as { baselineRunId?: string; variantRunId?: string };
    const baselineRunId = body.baselineRunId;
    const variantRunId = body.variantRunId;
    if (!baselineRunId || !variantRunId) {
      return sendBadRequest(res, 'baselineRunId and variantRunId are required');
    }
    const baseline = runStore.get(baselineRunId);
    const variant = runStore.get(variantRunId);
    if (!baseline) return sendNotFound(res, `Baseline run ${baselineRunId}`);
    if (!variant) return sendNotFound(res, `Variant run ${variantRunId}`);
    if (baseline.suiteId !== variant.suiteId) {
      return sendBadRequest(
        res,
        `Suite mismatch: baseline=${baseline.suiteId}, variant=${variant.suiteId}`,
      );
    }

    const byCase = new Map<
      string,
      { base?: typeof baseline.caseResults[number]; vari?: typeof variant.caseResults[number] }
    >();
    for (const cr of baseline.caseResults) byCase.set(cr.caseId, { base: cr });
    for (const cr of variant.caseResults) {
      const e = byCase.get(cr.caseId) ?? {};
      e.vari = cr;
      byCase.set(cr.caseId, e);
    }

    const cases: CaseDiffEntry[] = [];
    const baseScores: number[] = [];
    const variScores: number[] = [];
    for (const [caseId, { base, vari }] of byCase) {
      const label = base?.label ?? vari?.label ?? caseId;
      const domain = base?.domain ?? vari?.domain;
      let statusChange: CaseDiffEntry['statusChange'];
      if (!base && vari) statusChange = 'added';
      else if (base && !vari) statusChange = 'removed';
      else if (base!.passed && vari!.passed) statusChange = 'pass→pass';
      else if (base!.passed && !vari!.passed) statusChange = 'pass→fail';
      else if (!base!.passed && vari!.passed) statusChange = 'fail→pass';
      else statusChange = 'fail→fail';
      if (base && vari) {
        baseScores.push(base.score);
        variScores.push(vari.score);
      }
      cases.push({
        caseId,
        label,
        ...(domain !== undefined ? { domain } : {}),
        baseline: base ? { passed: base.passed, score: base.score, latencyMs: base.latencyMs } : null,
        variant: vari ? { passed: vari.passed, score: vari.score, latencyMs: vari.latencyMs } : null,
        scoreDelta: base && vari ? Number((vari.score - base.score).toFixed(4)) : null,
        latencyDelta: base && vari ? vari.latencyMs - base.latencyMs : null,
        statusChange,
      });
    }

    const { p, ci95 } = welchTTest(baseScores, variScores);
    const scoreDelta = variant.avgScore - baseline.avgScore;
    const significant = p < 0.05;
    const significanceLabel: CompareSummary['significanceLabel'] = !significant
      ? 'no_significant_change'
      : scoreDelta < 0
        ? 'significant_regression'
        : 'significant_improvement';

    const summary: CompareSummary = {
      baselineRunId,
      variantRunId,
      suiteId: baseline.suiteId,
      baselineAvgScore: baseline.avgScore,
      variantAvgScore: variant.avgScore,
      scoreDelta: Number(scoreDelta.toFixed(4)),
      baselinePassRate: baseline.passRate,
      variantPassRate: variant.passRate,
      passRateDelta: Number((variant.passRate - baseline.passRate).toFixed(4)),
      baselineAvgLatencyMs: baseline.avgLatencyMs,
      variantAvgLatencyMs: variant.avgLatencyMs,
      latencyDeltaMs: variant.avgLatencyMs - baseline.avgLatencyMs,
      pValue: Number(p.toFixed(6)),
      ci95: [Number(ci95[0].toFixed(4)), Number(ci95[1].toFixed(4))],
      significant,
      significanceLabel,
      alignedCases: baseScores.length,
      cases,
    };

    sendSuccess(res, summary);
  } catch (err) {
    handleRouteError(res, err, 'POST /a11oy/eval/compare');
  }
});

// ─── Regression alerts (per-suite baselines) ──────────────────────────────────

interface SuiteBaseline {
  suiteId: string;
  baselineRunId: string;
  baselineAvgScore: number;
  regressionThreshold: number; // score drop fraction (default 0.05)
  setAt: string;
}

interface RegressionAlert {
  suiteId: string;
  baselineRunId: string;
  latestRunId: string;
  baselineAvgScore: number;
  latestAvgScore: number;
  delta: number;
  threshold: number;
  severity: 'critical' | 'major' | 'minor';
  detectedAt: string;
}

const suiteBaselines = new Map<string, SuiteBaseline>();

function computeAlerts(): RegressionAlert[] {
  const alerts: RegressionAlert[] = [];
  for (const baseline of suiteBaselines.values()) {
    const latest = Array.from(runStore.values())
      .filter((r) => r.suiteId === baseline.suiteId && r.runId !== baseline.baselineRunId)
      .sort((a, b) => b.runAt.localeCompare(a.runAt))[0];
    if (!latest) continue;
    const delta = latest.avgScore - baseline.baselineAvgScore;
    if (delta < -baseline.regressionThreshold) {
      const drop = Math.abs(delta);
      const severity: RegressionAlert['severity'] =
        drop >= baseline.regressionThreshold * 3
          ? 'critical'
          : drop >= baseline.regressionThreshold * 2
            ? 'major'
            : 'minor';
      alerts.push({
        suiteId: baseline.suiteId,
        baselineRunId: baseline.baselineRunId,
        latestRunId: latest.runId,
        baselineAvgScore: baseline.baselineAvgScore,
        latestAvgScore: latest.avgScore,
        delta: Number(delta.toFixed(4)),
        threshold: baseline.regressionThreshold,
        severity,
        detectedAt: latest.runAt,
      });
    }
  }
  return alerts;
}

router.get('/a11oy/eval/alerts', (_req: Request, res: Response) => {
  try {
    sendSuccess(res, { alerts: computeAlerts(), baselines: Array.from(suiteBaselines.values()) });
  } catch (err) {
    handleRouteError(res, err, 'GET /a11oy/eval/alerts');
  }
});

router.post('/a11oy/eval/alerts/baseline', (req: Request, res: Response) => {
  try {
    const body = req.body as { suiteId?: string; runId?: string; threshold?: number };
    if (!body.suiteId || !body.runId) return sendBadRequest(res, 'suiteId and runId are required');
    const run = runStore.get(body.runId);
    if (!run) return sendNotFound(res, `Run ${body.runId}`);
    if (run.suiteId !== body.suiteId) {
      return sendBadRequest(res, `Run ${body.runId} belongs to suite ${run.suiteId}`);
    }
    const threshold =
      typeof body.threshold === 'number' && body.threshold > 0 && body.threshold < 1
        ? body.threshold
        : 0.05;
    const baseline: SuiteBaseline = {
      suiteId: body.suiteId,
      baselineRunId: body.runId,
      baselineAvgScore: run.avgScore,
      regressionThreshold: threshold,
      setAt: new Date().toISOString(),
    };
    suiteBaselines.set(body.suiteId, baseline);
    sendSuccess(res, baseline);
  } catch (err) {
    handleRouteError(res, err, 'POST /a11oy/eval/alerts/baseline');
  }
});

// ─── 2. Agent BOM CycloneDX + HTML attestation + verification ─────────────────

interface BomAgentInput {
  agentId: string;
  agentName: string;
  modelProvider: string;
  modelSnapshot: string;
  modelHash: string;
  constitutionVersion: string;
  constitutionHash: string;
  systemPromptHash: string;
  toolManifest: { name: string; version: string; hash: string }[];
  welfarePosture?: string;
  dependencyGraph?: string[];
  bomVersion?: string;
  generatedAt?: string;
  proofLedgerSignature?: string;
  evalHistory?: { date: string; composite: number }[];
}

// Build a ReceiptChain over the BOM components and return its Merkle root.
// This is the "cosigned receipt hash" included in attestations.
async function buildBomReceiptRoot(bom: BomAgentInput): Promise<{
  merkleRoot: string;
  receiptCount: number;
  closureHash: string;
}> {
  const chain = new ReceiptChain({ operatorId: `a11oy-bom:${bom.agentId}` });
  await chain.append({
    endpoint: '/a11oy/bom/model',
    method: 'POST',
    params: { snapshot: bom.modelSnapshot, hash: bom.modelHash, provider: bom.modelProvider },
    result: { component: 'model' },
  });
  await chain.append({
    endpoint: '/a11oy/bom/constitution',
    method: 'POST',
    params: { version: bom.constitutionVersion, hash: bom.constitutionHash },
    result: { component: 'constitution' },
  });
  await chain.append({
    endpoint: '/a11oy/bom/system-prompt',
    method: 'POST',
    params: { hash: bom.systemPromptHash },
    result: { component: 'system_prompt' },
  });
  for (const tool of bom.toolManifest) {
    await chain.append({
      endpoint: '/a11oy/bom/tool',
      method: 'POST',
      params: { name: tool.name, version: tool.version, hash: tool.hash },
      result: { component: 'tool' },
    });
  }
  const merkleRoot = await chain.merkleRoot();
  const all = await chain.readAll();
  const closure = await chain.close();
  return { merkleRoot, receiptCount: all.length, closureHash: closure.selfHash };
}

function buildCyclonedx(bom: BomAgentInput, cosigned: { merkleRoot: string; closureHash: string }) {
  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.7',
    serialNumber: `urn:uuid:bom-${bom.agentId}-${Date.now()}`,
    version: 1,
    metadata: {
      timestamp: bom.generatedAt ?? new Date().toISOString(),
      tools: [{ vendor: 'a11oy', name: 'Agent-BOM Generator', version: '1.0.0' }],
      properties: [
        { name: 'a11oy:cosigned-receipt-merkle-root', value: cosigned.merkleRoot },
        { name: 'a11oy:cosigned-receipt-closure-hash', value: cosigned.closureHash },
      ],
    },
    components: [
      {
        type: 'machine-learning-model',
        name: bom.agentName,
        version: bom.constitutionVersion,
        'bom-ref': bom.agentId,
        hashes: [
          { alg: 'SHA-256', content: bom.modelHash },
          { alg: 'SHA-256', content: bom.constitutionHash },
          { alg: 'SHA-256', content: bom.systemPromptHash },
        ],
        properties: [
          { name: 'a11oy:model-provider', value: bom.modelProvider },
          { name: 'a11oy:model-snapshot', value: bom.modelSnapshot },
          { name: 'a11oy:welfare-posture', value: bom.welfarePosture ?? 'nominal' },
          { name: 'a11oy:proof-signature', value: bom.proofLedgerSignature ?? cosigned.merkleRoot },
        ],
      },
      ...bom.toolManifest.map((t) => ({
        type: 'library',
        name: t.name,
        version: t.version,
        hashes: [{ alg: 'SHA-256', content: t.hash }],
      })),
    ],
    dependencies: (bom.dependencyGraph ?? []).map((d) => ({ ref: d })),
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildAttestationHtml(
  bom: BomAgentInput,
  cosigned: { merkleRoot: string; closureHash: string; receiptCount: number },
): string {
  const tools = bom.toolManifest
    .map(
      (t) =>
        `<tr><td>${escapeHtml(t.name)}</td><td>v${escapeHtml(t.version)}</td><td class="mono">${escapeHtml(t.hash)}</td></tr>`,
    )
    .join('\n');
  const deps = (bom.dependencyGraph ?? []).map((d) => `<li>${escapeHtml(d)}</li>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Agent BOM Attestation — ${escapeHtml(bom.agentName)}</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; max-width: 880px; margin: 2rem auto; padding: 0 1.5rem; color: #1a1a1a; }
  h1 { font-size: 1.6rem; margin: 0 0 0.25rem 0; }
  .sub { color: #555; font-size: 0.875rem; margin-bottom: 1.5rem; }
  .label { font-size: 0.7rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #999; margin-bottom: 0.25rem; }
  .card { border: 1px solid #e5e5e5; border-radius: 6px; padding: 1rem; margin-bottom: 1rem; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.8rem; word-break: break-all; }
  table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  th, td { text-align: left; padding: 0.4rem 0.5rem; border-bottom: 1px solid #eee; }
  th { color: #666; font-weight: 600; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .seal { background: #f7f5ee; border: 1px solid #c9b787; color: #6b5b29; padding: 1rem; border-radius: 6px; }
  .seal .mono { color: #3a3215; }
  ul { margin: 0; padding-left: 1.25rem; }
  .footer { color: #999; font-size: 0.75rem; margin-top: 2rem; border-top: 1px solid #eee; padding-top: 1rem; }
  @media print { body { margin: 0.5rem; } }
</style>
</head>
<body>
  <h1>Agent BOM Attestation</h1>
  <div class="sub">${escapeHtml(bom.agentName)} · BOM v${escapeHtml(bom.bomVersion ?? '1.0.0')} · Generated ${escapeHtml(bom.generatedAt ?? new Date().toISOString())}</div>

  <div class="grid">
    <div class="card">
      <div class="label">Model</div>
      <div><strong>${escapeHtml(bom.modelProvider)}</strong></div>
      <div class="mono">${escapeHtml(bom.modelSnapshot)}</div>
      <div class="mono">${escapeHtml(bom.modelHash)}</div>
    </div>
    <div class="card">
      <div class="label">Constitution</div>
      <div><strong>v${escapeHtml(bom.constitutionVersion)}</strong></div>
      <div class="mono">${escapeHtml(bom.constitutionHash)}</div>
      <div class="label" style="margin-top:0.5rem">System Prompt</div>
      <div class="mono">${escapeHtml(bom.systemPromptHash)}</div>
    </div>
  </div>

  <div class="card">
    <div class="label">Tool Manifest (${bom.toolManifest.length})</div>
    <table>
      <thead><tr><th>Name</th><th>Version</th><th>SHA-256</th></tr></thead>
      <tbody>${tools}</tbody>
    </table>
  </div>

  ${deps ? `<div class="card"><div class="label">Dependency Graph</div><ul>${deps}</ul></div>` : ''}

  <div class="seal">
    <div class="label" style="color:#6b5b29">Cosigned Λ-Receipt Attestation</div>
    <div style="margin: 0.5rem 0">
      <div><strong>Merkle root</strong></div>
      <div class="mono">${escapeHtml(cosigned.merkleRoot)}</div>
    </div>
    <div style="margin: 0.5rem 0">
      <div><strong>Closure hash</strong></div>
      <div class="mono">${escapeHtml(cosigned.closureHash)}</div>
    </div>
    <div style="font-size: 0.8rem">${cosigned.receiptCount} receipt rows · sealed via @szl-holdings/szl-receipts chain · verify via POST /api/a11oy/proof/verify</div>
  </div>

  <div class="footer">
    This document is machine-verifiable. Print to PDF or upload to your supply-chain auditor.
    Re-verification endpoint: <span class="mono">POST /api/a11oy/proof/verify</span> with body
    <span class="mono">{"agentId":"…","expectedMerkleRoot":"…","bom":{…}}</span>.
  </div>
</body>
</html>`;
}

router.post('/a11oy/proof/bom/:agentId/cyclonedx', async (req: Request, res: Response) => {
  try {
    const body = req.body as { bom?: BomAgentInput };
    if (!body.bom) return sendBadRequest(res, 'bom is required in body');
    if (body.bom.agentId !== req.params['agentId']) {
      return sendBadRequest(res, 'agentId in body does not match URL');
    }
    const cosigned = await buildBomReceiptRoot(body.bom);
    const cyclonedx = buildCyclonedx(body.bom, cosigned);
    sendSuccess(res, {
      cyclonedx,
      cosigned: {
        merkleRoot: cosigned.merkleRoot,
        closureHash: cosigned.closureHash,
        receiptCount: cosigned.receiptCount,
      },
    });
  } catch (err) {
    handleRouteError(res, err, 'POST /a11oy/proof/bom/:agentId/cyclonedx');
  }
});

router.post('/a11oy/proof/bom/:agentId/attestation', async (req: Request, res: Response) => {
  try {
    const body = req.body as { bom?: BomAgentInput };
    if (!body.bom) return sendBadRequest(res, 'bom is required in body');
    if (body.bom.agentId !== req.params['agentId']) {
      return sendBadRequest(res, 'agentId in body does not match URL');
    }
    const cosigned = await buildBomReceiptRoot(body.bom);
    const html = buildAttestationHtml(body.bom, cosigned);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${body.bom.agentId}-attestation.html"`,
    );
    res.status(200).send(html);
  } catch (err) {
    handleRouteError(res, err, 'POST /a11oy/proof/bom/:agentId/attestation');
  }
});

router.post('/a11oy/proof/verify', async (req: Request, res: Response) => {
  try {
    const body = req.body as { bom?: BomAgentInput; expectedMerkleRoot?: string };
    if (!body.bom) return sendBadRequest(res, 'bom is required in body');
    const cosigned = await buildBomReceiptRoot(body.bom);
    const matches = body.expectedMerkleRoot
      ? cosigned.merkleRoot === body.expectedMerkleRoot
      : true;
    sendSuccess(res, {
      valid: matches,
      computedMerkleRoot: cosigned.merkleRoot,
      computedClosureHash: cosigned.closureHash,
      receiptCount: cosigned.receiptCount,
      ...(body.expectedMerkleRoot
        ? { expectedMerkleRoot: body.expectedMerkleRoot, matches }
        : {}),
    });
  } catch (err) {
    handleRouteError(res, err, 'POST /a11oy/proof/verify');
  }
});

// ─── 3. PRISM counterfactual replay ───────────────────────────────────────────

interface DecisionInput {
  decisionId: string;
  scenario: string;
  domain: string;
  inputs: Record<string, number | string | boolean>;
  rulesFired: string[];
  scores: { alignment: number; confidence: number; risk: number };
  outcome: string;
  downstreamEffects: { label: string; valueUsd: number }[];
}

interface CounterfactualResult {
  base: DecisionInput;
  branch: DecisionInput;
  diff: {
    inputs: Array<{ key: string; baseValue: unknown; branchValue: unknown }>;
    rulesFiredAdded: string[];
    rulesFiredRemoved: string[];
    scoreDeltas: { alignment: number; confidence: number; risk: number };
    outcomeChanged: boolean;
    downstreamDeltaUsd: number;
  };
  proofHash: string;
}

// Deterministic counterfactual replay. Re-runs a tiny rules engine that
// considers each input override, perturbs scores/effects accordingly, and
// reports the structural diff. The same hashing path produces a stable proof.
function replayDecision(base: DecisionInput, overrides: Record<string, number | string | boolean>): DecisionInput {
  const inputs = { ...base.inputs, ...overrides };
  const rulesFired: string[] = [];
  let alignment = base.scores.alignment;
  let confidence = base.scores.confidence;
  let risk = base.scores.risk;
  let outcome = base.outcome;
  const downstreamEffects = base.downstreamEffects.map((e) => ({ ...e }));

  for (const [k, v] of Object.entries(overrides)) {
    const baseVal = base.inputs[k];
    if (baseVal === undefined) {
      rulesFired.push(`new-input:${k}`);
    } else if (typeof v === 'number' && typeof baseVal === 'number') {
      const delta = v - baseVal;
      const relative = baseVal === 0 ? Math.sign(delta) : delta / Math.abs(baseVal);
      if (Math.abs(relative) > 0.001) {
        rulesFired.push(`input-shifted:${k}:${relative > 0 ? 'up' : 'down'}`);
        // Larger negative shifts on key inputs degrade alignment/confidence
        // and raise risk; positive shifts do the opposite, capped to [0,100].
        alignment = clamp(alignment - relative * 8, 0, 100);
        confidence = clamp(confidence - relative * 12, 0, 100);
        risk = clamp(risk + relative * 15, 0, 100);
        for (const effect of downstreamEffects) {
          effect.valueUsd = Math.round(effect.valueUsd * (1 + relative));
        }
      }
    } else if (v !== baseVal) {
      rulesFired.push(`input-toggled:${k}`);
      alignment = clamp(alignment - 4, 0, 100);
      risk = clamp(risk + 6, 0, 100);
    }
  }

  // Re-evaluate outcome guard rails based on perturbed scores.
  if (alignment < 70 || risk > 75) {
    outcome = base.outcome + ' (counterfactual: blocked by guard-rails)';
    rulesFired.push('guard-rail:alignment-floor');
  } else if (confidence < 60) {
    outcome = base.outcome + ' (counterfactual: escalated for human review)';
    rulesFired.push('guard-rail:confidence-floor');
  }

  // Preserve original rules that should still apply (those not contradicted).
  const survivingBaseRules = base.rulesFired.filter((r) => !r.startsWith('input-'));
  const allRules = Array.from(new Set([...survivingBaseRules, ...rulesFired]));

  return {
    decisionId: `${base.decisionId}-cf-${Date.now().toString(36)}`,
    scenario: base.scenario,
    domain: base.domain,
    inputs,
    rulesFired: allRules,
    scores: {
      alignment: Number(alignment.toFixed(2)),
      confidence: Number(confidence.toFixed(2)),
      risk: Number(risk.toFixed(2)),
    },
    outcome,
    downstreamEffects,
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

router.post('/a11oy/decisions/counterfactual', (req: Request, res: Response) => {
  try {
    const body = req.body as {
      base?: DecisionInput;
      overrides?: Record<string, number | string | boolean>;
    };
    if (!body.base) return sendBadRequest(res, 'base decision is required');
    if (!body.overrides || Object.keys(body.overrides).length === 0) {
      return sendBadRequest(res, 'at least one override is required');
    }
    const branch = replayDecision(body.base, body.overrides);
    const inputKeys = Array.from(
      new Set([...Object.keys(body.base.inputs), ...Object.keys(branch.inputs)]),
    );
    const inputsDiff = inputKeys
      .filter((k) => body.base!.inputs[k] !== branch.inputs[k])
      .map((k) => ({ key: k, baseValue: body.base!.inputs[k], branchValue: branch.inputs[k] }));
    const baseRules = new Set(body.base.rulesFired);
    const branchRules = new Set(branch.rulesFired);
    const rulesFiredAdded = Array.from(branchRules).filter((r) => !baseRules.has(r));
    const rulesFiredRemoved = Array.from(baseRules).filter((r) => !branchRules.has(r));
    const downstreamDeltaUsd =
      branch.downstreamEffects.reduce((s, e) => s + e.valueUsd, 0) -
      body.base.downstreamEffects.reduce((s, e) => s + e.valueUsd, 0);

    const result: CounterfactualResult = {
      base: body.base,
      branch,
      diff: {
        inputs: inputsDiff,
        rulesFiredAdded,
        rulesFiredRemoved,
        scoreDeltas: {
          alignment: Number((branch.scores.alignment - body.base.scores.alignment).toFixed(2)),
          confidence: Number((branch.scores.confidence - body.base.scores.confidence).toFixed(2)),
          risk: Number((branch.scores.risk - body.base.scores.risk).toFixed(2)),
        },
        outcomeChanged: branch.outcome !== body.base.outcome,
        downstreamDeltaUsd,
      },
      proofHash: createHash('sha256')
        .update(JSON.stringify({ base: body.base, overrides: body.overrides, branch }))
        .digest('hex'),
    };
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, 'POST /a11oy/decisions/counterfactual');
  }
});

// ─── 4. Pattern Atlas telemetry + maturity ────────────────────────────────────

interface PatternStat {
  patternKey: string;
  callCount: number;
  lastUsedAt: string;
  firstUsedAt: string;
  consumers: string[];
  maturity: 'experimental' | 'beta' | 'stable';
}

interface PatternTrackerConfig {
  experimentalToBetaUses: number;
  betaToStableUses: number;
  stableMinAgeMs: number;
}

const PATTERN_CONFIG: PatternTrackerConfig = {
  experimentalToBetaUses: 25,
  betaToStableUses: 200,
  stableMinAgeMs: 7 * 24 * 60 * 60 * 1000,
};

const patternStats = new Map<string, PatternStat>();

function deriveMaturity(stat: Omit<PatternStat, 'maturity'>): PatternStat['maturity'] {
  const ageMs = Date.now() - new Date(stat.firstUsedAt).getTime();
  if (stat.callCount >= PATTERN_CONFIG.betaToStableUses && ageMs >= PATTERN_CONFIG.stableMinAgeMs) {
    return 'stable';
  }
  if (stat.callCount >= PATTERN_CONFIG.experimentalToBetaUses) return 'beta';
  return 'experimental';
}

router.post('/a11oy/patterns/track', (req: Request, res: Response) => {
  try {
    const body = req.body as { patternKey?: string; consumer?: string; count?: number };
    const patternKey = body.patternKey;
    if (!patternKey || typeof patternKey !== 'string') {
      return sendBadRequest(res, 'patternKey is required');
    }
    const inc = typeof body.count === 'number' && body.count > 0 ? Math.min(body.count, 100) : 1;
    const now = new Date().toISOString();
    const existing = patternStats.get(patternKey);
    const consumers = new Set(existing?.consumers ?? []);
    if (body.consumer) consumers.add(body.consumer);
    const next: Omit<PatternStat, 'maturity'> = {
      patternKey,
      callCount: (existing?.callCount ?? 0) + inc,
      lastUsedAt: now,
      firstUsedAt: existing?.firstUsedAt ?? now,
      consumers: Array.from(consumers).slice(0, 32),
    };
    const stat: PatternStat = { ...next, maturity: deriveMaturity(next) };
    patternStats.set(patternKey, stat);
    sendSuccess(res, stat);
  } catch (err) {
    handleRouteError(res, err, 'POST /a11oy/patterns/track');
  }
});

router.get('/a11oy/patterns/telemetry', (_req: Request, res: Response) => {
  try {
    const stats = Array.from(patternStats.values()).map((s) => ({
      ...s,
      maturity: deriveMaturity(s),
    }));
    const counts = {
      total: stats.length,
      stable: stats.filter((s) => s.maturity === 'stable').length,
      beta: stats.filter((s) => s.maturity === 'beta').length,
      experimental: stats.filter((s) => s.maturity === 'experimental').length,
    };
    sendSuccess(res, { stats, counts, config: PATTERN_CONFIG });
  } catch (err) {
    handleRouteError(res, err, 'GET /a11oy/patterns/telemetry');
  }
});

export default router;
