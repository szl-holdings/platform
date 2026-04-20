/**
 * Terra Cognitive Runtime — API Contract & Integration Smoke Tests
 *
 * Validates:
 *   1. All 6 GET cognitive endpoints respond with HTTP 200 and expected shape
 *   2. POST /covenants/submit-review rejects without auth (401/403)
 *   3. POST /covenants/submit-review succeeds with internal token and returns
 *      guardianActionId + requestId
 *   4. provenance block has required fields (source, traceRef, generatedAt,
 *      confidence, confidenceLabel)
 *   5. Lender exposure returns graphStats block (CONSTELLATION integration)
 *   6. Covenant monitor scheduledSkill block is present
 *   7. Re-submitting the same breach returns alreadyExisted=true (idempotency)
 *
 * Run:  pnpm --filter @workspace/api-server test:terra-cognitive
 */

const BASE = `http://localhost:${process.env['PORT'] ?? 8080}`;
const TOKEN = process.env['ALLOY_INTERNAL_TOKEN'] ?? '';

export {};

const errors: string[] = [];
let passed = 0;

function assert(label: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`[terra-cog] ✓  ${label}`);
    passed++;
  } else {
    const msg = detail ? `${label} — ${detail}` : label;
    console.error(`[terra-cog] ✗  ${msg}`);
    errors.push(msg);
  }
}

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (TOKEN) h['x-internal-token'] = TOKEN;
  return h;
}

async function get(path: string): Promise<{ status: number; body: unknown }> {
  const r = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  const body = await r.json().catch(() => null);
  return { status: r.status, body };
}

async function post(
  path: string,
  payload: unknown,
  withAuth = true,
): Promise<{ status: number; body: unknown }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (withAuth && TOKEN) headers['x-internal-token'] = TOKEN;
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const body = await r.json().catch(() => null);
  return { status: r.status, body };
}

function checkProvenance(label: string, prov: unknown) {
  const p = prov as Record<string, unknown> | null;
  assert(`${label}: provenance present`, !!p);
  if (!p) return;
  assert(`${label}: provenance.source is string`, typeof p.source === 'string');
  assert(`${label}: provenance.traceRef is string`, typeof p.traceRef === 'string');
  assert(`${label}: provenance.generatedAt is ISO date`, !isNaN(Date.parse(String(p.generatedAt))));
  assert(`${label}: provenance.confidence is number`, typeof p.confidence === 'number');
  assert(`${label}: provenance.confidenceLabel is string`, typeof p.confidenceLabel === 'string');
}

// ─────────────────────────────────────────────────────────────────────────────

async function testOwnershipGraph() {
  console.log('\n[terra-cog] === Ownership Graph ===');
  const { status, body } = await get('/api/terra/cognitive/ownership-graph');
  const b = body as Record<string, unknown>;
  assert('status 200', status === 200, `got ${status}`);
  assert(
    'graph.nodes is array',
    Array.isArray((b?.graph as Record<string, unknown> | null)?.nodes),
  );
  assert(
    'graph.edges is array',
    Array.isArray((b?.graph as Record<string, unknown> | null)?.edges),
  );
  assert('riskFlags is array', Array.isArray(b?.riskFlags));
  const summary = b?.summary as Record<string, unknown> | null;
  assert('summary present', !!summary);
  assert(
    'summary.ultimateBeneficialOwners is array',
    Array.isArray(summary?.ultimateBeneficialOwners),
  );
  assert(
    'summary.combinedLtv is number or null',
    summary?.combinedLtv === null || typeof summary?.combinedLtv === 'number',
  );
  checkProvenance('ownership-graph', b?.provenance);
}

async function testLenderExposure() {
  console.log('\n[terra-cog] === Lender Exposure ===');
  const { status, body } = await get('/api/terra/cognitive/lender-exposure');
  const b = body as Record<string, unknown>;
  assert('status 200', status === 200, `got ${status}`);
  assert('lenders is array', Array.isArray(b?.lenders));
  const lenders = (b?.lenders ?? []) as Record<string, unknown>[];
  if (lenders.length > 0) {
    assert('lender has avgRate', typeof lenders[0].avgRate === 'number');
    assert('lender has totalExposure', typeof lenders[0].totalExposure === 'number');
    assert('lender has maturities', typeof lenders[0].maturities === 'object');
  }
  assert('summary present', typeof b?.summary === 'object');
  assert('maturityLadder is array', Array.isArray(b?.maturityLadder));
  assert(
    'graphStats present',
    typeof b?.graphStats === 'object',
    'CONSTELLATION integration block missing',
  );
  const gs = b?.graphStats as Record<string, unknown> | null;
  assert('graphStats.lenderNodes is number', typeof gs?.lenderNodes === 'number');
  assert('graphStats.edges is number', typeof gs?.edges === 'number');
  checkProvenance('lender-exposure', b?.provenance);
}

async function testCovenants() {
  console.log('\n[terra-cog] === Covenant Monitor ===');
  const { status, body } = await get('/api/terra/cognitive/covenants');
  const b = body as Record<string, unknown>;
  assert('status 200', status === 200, `got ${status}`);
  assert('covenants is array', Array.isArray(b?.covenants));
  assert('summary present', typeof b?.summary === 'object');
  assert(
    'scheduledSkill present',
    typeof b?.scheduledSkill === 'object',
    'scheduled skill block missing',
  );
  const sk = b?.scheduledSkill as Record<string, unknown> | null;
  assert(
    'scheduledSkill.agentId = terra-covenant-monitor',
    sk?.agentId === 'terra-covenant-monitor',
  );
  checkProvenance('covenants', b?.provenance);
}

async function testCovenantSubmitReview() {
  console.log('\n[terra-cog] === Covenant Submit-Review (mutation) ===');

  // Without auth: expect rejection
  const noAuth = await post(
    '/api/terra/cognitive/covenants/submit-review',
    {
      propertyId: 'smoke-prop-001',
      covenantType: 'dscr',
    },
    false,
  );
  assert(
    'no-auth rejected (401 or 403)',
    noAuth.status === 401 || noAuth.status === 403,
    `got ${noAuth.status}`,
  );

  if (!TOKEN) {
    console.warn(
      '[terra-cog] ⚠  No ALLOY_INTERNAL_TOKEN — skipping authenticated submit-review test',
    );
    return;
  }

  const body = {
    propertyId: 'smoke-prop-cog-test-001',
    covenantType: 'dscr',
    score: 85,
    address: 'Smoke Test Property',
    distressType: 'foreclosure',
    debtAmount: 15000000,
    estimatedValue: 18000000,
  };

  const { status: s1, body: b1 } = await post('/api/terra/cognitive/covenants/submit-review', body);
  const r1 = b1 as Record<string, unknown>;
  assert('submit-review status 200', s1 === 200, `got ${s1}`);
  assert('returns requestId', typeof r1?.requestId === 'string');
  assert('returns outcome=require-approval', r1?.outcome === 'require-approval');
  const wasNew = r1?.alreadyExisted === false;
  assert('first call: alreadyExisted=false OR idempotent', wasNew || r1?.alreadyExisted === true);

  // Idempotency: second call with same payload
  const { status: s2, body: b2 } = await post('/api/terra/cognitive/covenants/submit-review', body);
  const r2 = b2 as Record<string, unknown>;
  assert('idempotent re-submit status 200', s2 === 200, `got ${s2}`);
  assert(
    're-submit alreadyExisted=true',
    r2?.alreadyExisted === true,
    `alreadyExisted=${r2?.alreadyExisted}`,
  );
  assert('requestId is stable across calls', r1?.requestId === r2?.requestId);
}

async function testDistressForecast() {
  console.log('\n[terra-cog] === Distress Forecast ===');
  const { status, body } = await get('/api/terra/cognitive/distress-forecast?limit=5');
  const b = body as Record<string, unknown>;
  assert('status 200', status === 200, `got ${status}`);
  assert('ranked is array', Array.isArray(b?.ranked));
  assert('summary present', typeof b?.summary === 'object');
  checkProvenance('distress-forecast', b?.provenance);
}

async function testUnderwritingCopilot() {
  console.log('\n[terra-cog] === Underwriting Copilot ===');
  const { status, body } = await get(
    '/api/terra/cognitive/underwriting-copilot?propertyId=test-001',
  );
  const b = body as Record<string, unknown>;
  assert('status 200', status === 200, `got ${status}`);
  assert('recommendation present', typeof b?.recommendation === 'object');
  assert('marketContext present', typeof b?.marketContext === 'object');
  checkProvenance('underwriting-copilot', b?.provenance);
}

async function testDiligenceRoom() {
  console.log('\n[terra-cog] === Diligence Room ===');
  const { status, body } = await get('/api/terra/cognitive/diligence-room');
  const b = body as Record<string, unknown>;
  assert('status 200', status === 200, `got ${status}`);
  assert('documents is array', Array.isArray(b?.documents));
  assert('summary present', typeof b?.summary === 'object');
  checkProvenance('diligence-room', b?.provenance);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log(`[terra-cog] Terra Cognitive API Smoke Tests — ${BASE}\n`);

  await testOwnershipGraph();
  await testLenderExposure();
  await testCovenants();
  await testCovenantSubmitReview();
  await testDistressForecast();
  await testUnderwritingCopilot();
  await testDiligenceRoom();

  console.log('\n─────────────────────────────────────────────────────────────');
  console.log(`[terra-cog] Passed: ${passed}  Failed: ${errors.length}`);

  if (errors.length === 0) {
    console.log('[terra-cog] ✓  All Terra cognitive API contract tests PASSED');
    process.exit(0);
  } else {
    console.error('[terra-cog] ✗  Failures:');
    errors.forEach((e) => console.error(`         • ${e}`));
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('[terra-cog] Unexpected error:', err);
  process.exit(1);
});
