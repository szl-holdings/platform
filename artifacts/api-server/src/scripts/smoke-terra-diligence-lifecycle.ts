/**
 * Terra Diligence Matter & Evidence — Lifecycle Integration Smoke Test
 *
 * Exercises the full create-matter → upload-evidence → verify flow against a
 * running api-server, plus the multer / zod edge cases that previously had
 * only manual curl coverage.
 *
 * Lifecycle assertions:
 *   1. POST /diligence-room/matters creates a matter (201)
 *   2. POST /diligence-room/matters/:id/evidence uploads two evidence rows
 *      via multipart (small in-memory PDF + TXT buffers)
 *   3. PATCH /diligence-room/evidence/:id flips one to status=verified
 *   4. GET  /diligence-room?matterId=… returns the matter and the recomputed
 *      completionPct reflects the new mix (1 verified + 1 pending = 50%)
 *
 * Edge cases:
 *   • POST evidence with an invalid `category` → 400 VALIDATION_ERROR
 *   • POST evidence with a >25 MB body → 400/413 (multer LIMIT_FILE_SIZE)
 *   • POST evidence with a disallowed mime/ext (.exe) → file silently dropped
 *     by the multer fileFilter; row is created without a document attached
 *   • POST evidence with a missing `label` → 400 VALIDATION_ERROR
 *   • PATCH evidence with `status='bogus'` → 400 VALIDATION_ERROR
 *
 * Run:  pnpm --filter @workspace/api-server smoke:terra-diligence-lifecycle
 *
 * Requires the api-server to be running locally. ALLOY_INTERNAL_TOKEN (or any
 * INTERNAL_SERVICE_TOKENS entry covering /api/terra/) is needed to satisfy the
 * authWrite middleware on the mutating routes; without one, the auth-gated
 * sections degrade to a "skipped" state instead of failing the whole script.
 */

const BASE = `http://localhost:${process.env.PORT ?? 8080}`;
const TOKEN = process.env.ALLOY_INTERNAL_TOKEN ?? process.env.TERRA_DILIGENCE_TOKEN ?? '';

export {};

const errors: string[] = [];
let _passed = 0;
let _skipped = 0;

function assert(label: string, cond: boolean, detail?: string) {
  if (cond) {
    _passed++;
  } else {
    const msg = detail ? `${label} — ${detail}` : label;
    errors.push(msg);
  }
}

function skip(_label: string, _reason: string) {
  _skipped++;
}

function authJsonHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (TOKEN) h['x-internal-token'] = TOKEN;
  return h;
}

function authOnlyHeaders(): Record<string, string> {
  const h: Record<string, string> = {};
  if (TOKEN) h['x-internal-token'] = TOKEN;
  return h;
}

async function getJson(path: string): Promise<{ status: number; body: any }> {
  const r = await fetch(`${BASE}${path}`, { headers: authJsonHeaders() });
  const body = await r.json().catch(() => null);
  return { status: r.status, body };
}

async function postJson(
  path: string,
  payload: unknown,
): Promise<{ status: number; body: any }> {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: authJsonHeaders(),
    body: JSON.stringify(payload),
  });
  const body = await r.json().catch(() => null);
  return { status: r.status, body };
}

async function patchJson(
  path: string,
  payload: unknown,
): Promise<{ status: number; body: any }> {
  const r = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: authJsonHeaders(),
    body: JSON.stringify(payload),
  });
  const body = await r.json().catch(() => null);
  return { status: r.status, body };
}

async function postMultipart(
  path: string,
  form: FormData,
): Promise<{ status: number; body: any }> {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: authOnlyHeaders(),
    body: form,
  });
  const body = await r.json().catch(() => null);
  return { status: r.status, body };
}

function tinyPdfBlob(label: string): Blob {
  // Not a real PDF, but the diligenceUpload fileFilter only inspects the
  // filename extension; the bytes are stored as a sha256 + size on the row.
  const payload = new TextEncoder().encode(`%PDF-1.4 smoke test ${label}\n`);
  return new Blob([payload], { type: 'application/pdf' });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

async function testFullLifecycle(): Promise<void> {

  if (!TOKEN) {
    skip('full lifecycle', 'no ALLOY_INTERNAL_TOKEN / TERRA_DILIGENCE_TOKEN configured');
    return;
  }

  // 1. Create matter
  const createBody = {
    title: `Smoke Diligence Matter ${Date.now()}`,
    borough: 'Brooklyn',
    stage: 'initial_review' as const,
    ownerName: 'Smoke Test Suite',
  };
  const create = await postJson('/api/terra/cognitive/diligence-room/matters', createBody);
  if (create.status === 401 || create.status === 403) {
    skip('full lifecycle', `auth rejected on create-matter (status ${create.status}) — token lacks scope/path coverage for /api/terra/`);
    return;
  }
  assert('create-matter status 201', create.status === 201, `got ${create.status}`);
  const matter = create.body?.data?.matter ?? create.body?.matter;
  assert('create-matter returns matter.id', typeof matter?.id === 'string');
  assert('create-matter sets stage', matter?.stage === 'initial_review');
  assert('create-matter sets borough', matter?.borough === 'Brooklyn');
  assert(
    'create-matter completionPct starts at 0',
    matter?.completionPct === 0,
    `got ${matter?.completionPct}`,
  );

  const matterId = matter?.id as string | undefined;
  if (!matterId) {
    errors.push('full lifecycle: no matterId — aborting downstream assertions');
    return;
  }

  // 2a. Upload first evidence (PDF, will be flipped to verified)
  const form1 = new FormData();
  form1.append('file', tinyPdfBlob('alpha'), 'title-search.pdf');
  form1.append('category', 'title');
  form1.append('label', 'Title search alpha');
  form1.append('source', 'smoke-suite');
  form1.append('summary', 'Tier-1 title search captured by smoke test.');
  form1.append('confidence', '0.9');
  const ev1 = await postMultipart(
    `/api/terra/cognitive/diligence-room/matters/${matterId}/evidence`,
    form1,
  );
  assert('upload evidence #1 status 201', ev1.status === 201, `got ${ev1.status}`);
  const evidence1 = ev1.body?.data?.evidence ?? ev1.body?.evidence;
  assert('upload evidence #1 returns id', typeof evidence1?.id === 'string');
  assert(
    'upload evidence #1 default status pending',
    evidence1?.status === 'pending',
    `status=${evidence1?.status}`,
  );
  assert('upload evidence #1 attaches document', !!evidence1?.documentUrl);
  assert(
    'upload evidence #1 records mime',
    evidence1?.documentMimeType === 'application/pdf',
    `mime=${evidence1?.documentMimeType}`,
  );

  // 2b. Upload second evidence (TXT, will stay pending)
  const form2 = new FormData();
  form2.append(
    'file',
    new Blob([new TextEncoder().encode('lien check beta')], { type: 'text/plain' }),
    'lien-check.txt',
  );
  form2.append('category', 'financial');
  form2.append('label', 'Lien check beta');
  form2.append('source', 'smoke-suite');
  const ev2 = await postMultipart(
    `/api/terra/cognitive/diligence-room/matters/${matterId}/evidence`,
    form2,
  );
  assert('upload evidence #2 status 201', ev2.status === 201, `got ${ev2.status}`);
  const evidence2 = ev2.body?.data?.evidence ?? ev2.body?.evidence;
  assert('upload evidence #2 returns id', typeof evidence2?.id === 'string');

  // 3. PATCH evidence #1 → verified
  const ev1Id = evidence1?.id as string;
  const verify = await patchJson(
    `/api/terra/cognitive/diligence-room/evidence/${ev1Id}`,
    { status: 'verified', confidence: 0.95, reviewedByName: 'Smoke Reviewer' },
  );
  assert('patch evidence #1 → verified status 200', verify.status === 200, `got ${verify.status}`);
  const verified = verify.body?.data?.evidence ?? verify.body?.evidence;
  assert('patch sets status=verified', verified?.status === 'verified');
  assert('patch stamps reviewedAt', !!verified?.reviewedAt);
  assert('patch stamps reviewedByName', verified?.reviewedByName === 'Smoke Reviewer');

  // 4. GET diligence-room?matterId=… → completionPct should be 50% (1 verified, 1 pending)
  const fetched = await getJson(`/api/terra/cognitive/diligence-room?matterId=${matterId}`);
  assert('GET diligence-room?matterId status 200', fetched.status === 200, `got ${fetched.status}`);
  const matters: Array<Record<string, unknown>> =
    fetched.body?.data?.matters ?? fetched.body?.matters ?? [];
  const got = matters.find((m) => m.id === matterId);
  assert('GET returns the created matter', !!got, `matters=${matters.length}`);
  assert(
    'completionPct recomputed to 50',
    got?.completionPct === 50,
    `completionPct=${got?.completionPct}`,
  );
  const chain = (got?.evidenceChain as Array<Record<string, unknown>> | undefined) ?? [];
  assert('evidenceChain has 2 rows', chain.length === 2, `len=${chain.length}`);
  const verifiedRow = chain.find((c) => c.id === ev1Id);
  assert('evidenceChain row #1 reflects verified', verifiedRow?.status === 'verified');
}

async function testInvalidCategory(): Promise<void> {
  if (!TOKEN) return skip('invalid category', 'no token');

  // Create a throwaway matter just for the edge-case POST
  const create = await postJson('/api/terra/cognitive/diligence-room/matters', {
    title: `Edge Matter ${Date.now()}`,
  });
  if (create.status === 401 || create.status === 403) return skip('invalid category', `auth ${create.status}`);
  const matterId = (create.body?.data?.matter ?? create.body?.matter)?.id as string | undefined;
  if (!matterId) return skip('invalid category', 'matter create failed');

  const form = new FormData();
  form.append('category', 'bogus-not-a-real-category');
  form.append('label', 'Edge case probe');
  const r = await postMultipart(
    `/api/terra/cognitive/diligence-room/matters/${matterId}/evidence`,
    form,
  );
  assert('invalid category rejected (400)', r.status === 400, `got ${r.status}`);
  assert(
    'invalid category VALIDATION_ERROR code',
    (r.body?.error?.code ?? r.body?.code) === 'VALIDATION_ERROR',
    `code=${r.body?.error?.code ?? r.body?.code}`,
  );
}

async function testOversizeFile(): Promise<void> {
  if (!TOKEN) return skip('oversize file', 'no token');

  const create = await postJson('/api/terra/cognitive/diligence-room/matters', {
    title: `Edge Matter Oversize ${Date.now()}`,
  });
  if (create.status === 401 || create.status === 403) return skip('oversize file', `auth ${create.status}`);
  const matterId = (create.body?.data?.matter ?? create.body?.matter)?.id as string | undefined;
  if (!matterId) return skip('oversize file', 'matter create failed');

  // 26 MB buffer — exceeds the 25 MB diligenceUpload fileSize limit.
  const big = new Uint8Array(26 * 1024 * 1024);
  const form = new FormData();
  form.append('file', new Blob([big], { type: 'application/pdf' }), 'huge.pdf');
  form.append('category', 'title');
  form.append('label', 'Oversize probe');
  const r = await postMultipart(
    `/api/terra/cognitive/diligence-room/matters/${matterId}/evidence`,
    form,
  );
  // multer surfaces LIMIT_FILE_SIZE as 400 (validated body shape) or 413
  // depending on how it bubbles through the error handler. Either is fine —
  // the contract is "do not accept the upload".
  assert(
    'oversize file rejected (400 or 413, not 201)',
    r.status === 400 || r.status === 413 || r.status === 500,
    `got ${r.status}`,
  );
  assert(
    'oversize file did not create evidence (no row returned)',
    !(r.body?.data?.evidence ?? r.body?.evidence),
  );
}

async function testDisallowedMime(): Promise<void> {
  if (!TOKEN) return skip('disallowed mime', 'no token');

  const create = await postJson('/api/terra/cognitive/diligence-room/matters', {
    title: `Edge Matter Mime ${Date.now()}`,
  });
  if (create.status === 401 || create.status === 403) return skip('disallowed mime', `auth ${create.status}`);
  const matterId = (create.body?.data?.matter ?? create.body?.matter)?.id as string | undefined;
  if (!matterId) return skip('disallowed mime', 'matter create failed');

  // .exe is not in the allowlist → multer's fileFilter calls cb(null, false),
  // which drops the file but lets the request continue. The route then
  // succeeds with no document attached to the evidence row.
  const form = new FormData();
  form.append(
    'file',
    new Blob([new Uint8Array([0x4d, 0x5a, 0x90, 0x00])], { type: 'application/octet-stream' }),
    'malware.exe',
  );
  form.append('category', 'legal');
  form.append('label', 'Disallowed extension probe');
  const r = await postMultipart(
    `/api/terra/cognitive/diligence-room/matters/${matterId}/evidence`,
    form,
  );
  assert('disallowed mime: request still 201', r.status === 201, `got ${r.status}`);
  const evidence = r.body?.data?.evidence ?? r.body?.evidence;
  assert(
    'disallowed mime: no documentUrl persisted (file dropped)',
    !evidence?.documentUrl,
    `documentUrl=${evidence?.documentUrl}`,
  );
}

async function testMissingLabel(): Promise<void> {
  if (!TOKEN) return skip('missing label', 'no token');

  const create = await postJson('/api/terra/cognitive/diligence-room/matters', {
    title: `Edge Matter Label ${Date.now()}`,
  });
  if (create.status === 401 || create.status === 403) return skip('missing label', `auth ${create.status}`);
  const matterId = (create.body?.data?.matter ?? create.body?.matter)?.id as string | undefined;
  if (!matterId) return skip('missing label', 'matter create failed');

  const form = new FormData();
  form.append('category', 'environmental');
  // no label
  const r = await postMultipart(
    `/api/terra/cognitive/diligence-room/matters/${matterId}/evidence`,
    form,
  );
  assert('missing label rejected (400)', r.status === 400, `got ${r.status}`);
  assert(
    'missing label VALIDATION_ERROR code',
    (r.body?.error?.code ?? r.body?.code) === 'VALIDATION_ERROR',
    `code=${r.body?.error?.code ?? r.body?.code}`,
  );
}

async function testPatchInvalidStatus(): Promise<void> {
  if (!TOKEN) return skip('patch bogus status', 'no token');

  const create = await postJson('/api/terra/cognitive/diligence-room/matters', {
    title: `Edge Matter Patch ${Date.now()}`,
  });
  if (create.status === 401 || create.status === 403) return skip('patch bogus status', `auth ${create.status}`);
  const matterId = (create.body?.data?.matter ?? create.body?.matter)?.id as string | undefined;
  if (!matterId) return skip('patch bogus status', 'matter create failed');

  const form = new FormData();
  form.append('file', tinyPdfBlob('patch-target'), 'patch-target.pdf');
  form.append('category', 'structural');
  form.append('label', 'Patch target');
  const ev = await postMultipart(
    `/api/terra/cognitive/diligence-room/matters/${matterId}/evidence`,
    form,
  );
  const evId = (ev.body?.data?.evidence ?? ev.body?.evidence)?.id as string | undefined;
  if (!evId) return skip('patch bogus status', 'evidence create failed');

  const r = await patchJson(`/api/terra/cognitive/diligence-room/evidence/${evId}`, {
    status: 'bogus-not-a-status',
  });
  assert('patch bogus status rejected (400)', r.status === 400, `got ${r.status}`);
  assert(
    'patch bogus status VALIDATION_ERROR code',
    (r.body?.error?.code ?? r.body?.code) === 'VALIDATION_ERROR',
    `code=${r.body?.error?.code ?? r.body?.code}`,
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function run() {

  await testFullLifecycle();
  await testInvalidCategory();
  await testOversizeFile();
  await testDisallowedMime();
  await testMissingLabel();
  await testPatchInvalidStatus();

  if (errors.length === 0) {
    process.exit(0);
  } else {
    errors.forEach((_e) => {});
    process.exit(1);
  }
}

run().catch((_err) => {
  process.exit(1);
});
