import { lookup } from 'node:dns/promises';
import { readFile } from 'node:fs/promises';
import { isIP } from 'node:net';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  decodeDssePayload,
  KHIPU_PAYLOAD_TYPE,
  payloadHash,
  publicKeyFingerprint,
  verifyDsseEnvelope,
} from './verify.mjs';

const PASS = 'PASS';
const FAIL = 'FAIL';
const SURFACE_PATTERN = /^[a-z0-9-]+$/;
const FULL_GIT_SHA_PATTERN = /^[0-9a-f]{40}$/;
const HASH_PATTERN = /^sha256:[0-9a-f]{64}$/;
const TRACE_ID_PATTERN = /^[0-9a-f]{32}$/;
const SPAN_ID_PATTERN = /^[0-9a-f]{16}$/;
const DEFAULT_MAX_EVIDENCE_AGE_MS = 15 * 60 * 1000;
const MAX_CLOCK_SKEW_MS = 60 * 1000;
const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_V1 = 'szl.vertical-conformance.manifest.v1';
const MANIFEST_V2 = 'szl.vertical-conformance.manifest.v2';

export function normalizeBaseUrl(baseUrl) {
  let end = baseUrl.length;
  while (end > 0 && baseUrl.charCodeAt(end - 1) === 47) {
    end -= 1;
  }
  return baseUrl.slice(0, end);
}

function result(id, status, detail) {
  return { id, status, detail };
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function resolveWithinRoot(root, relativePath, field) {
  if (typeof relativePath !== 'string' || !relativePath) {
    throw new TypeError(`${field} must be a non-empty relative path`);
  }
  if (isAbsolute(relativePath)) {
    throw new TypeError(`${field} must be relative to the repository root`);
  }
  const normalizedRoot = resolve(root);
  const candidate = resolve(normalizedRoot, relativePath);
  const pathFromRoot = relative(normalizedRoot, candidate);
  if (
    pathFromRoot === '..' ||
    pathFromRoot.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`)
  ) {
    throw new TypeError(`${field} must stay within the repository root`);
  }
  return candidate;
}

async function pathExists(path) {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}

function isPrivateAddress(address) {
  const normalized = address.toLowerCase().replace(/^\[|\]$/g, '');
  if (isIP(normalized) === 4) {
    const [first, second] = normalized.split('.').map(Number);
    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 100 && second >= 64 && second <= 127) ||
      first >= 224
    );
  }
  if (isIP(normalized) === 6) {
    if (normalized.startsWith('::ffff:')) {
      const mapped = normalized.slice('::ffff:'.length);
      if (isIP(mapped) === 4) return isPrivateAddress(mapped);
      const words = mapped.split(':');
      if (words.length === 2 && words.every((word) => /^[0-9a-f]{1,4}$/.test(word))) {
        const value = Number.parseInt(words[0], 16) * 65_536 + Number.parseInt(words[1], 16);
        const ipv4 = [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join('.');
        return isPrivateAddress(ipv4);
      }
      return true;
    }
    return (
      normalized === '::' ||
      normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe8') ||
      normalized.startsWith('fe9') ||
      normalized.startsWith('fea') ||
      normalized.startsWith('feb') ||
      normalized.startsWith('ff') ||
      normalized.startsWith('2001:db8:')
    );
  }
  return false;
}

function validateBaseUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError('baseUrl must be a non-empty URL');
  }
  const url = new URL(value);
  if (url.username || url.password || url.search || url.hash) {
    throw new TypeError('baseUrl must not include credentials, query parameters, or fragments');
  }
  if (url.pathname !== '/' && url.pathname !== '') {
    throw new TypeError('baseUrl must not include a path');
  }

  const hostname = url.hostname.toLowerCase();
  const loopback = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  const privateName =
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === 'metadata.google.internal';
  if (loopback && url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new TypeError('loopback baseUrl must use HTTP or HTTPS');
  }
  if (!loopback && url.protocol !== 'https:') {
    throw new TypeError('baseUrl must use HTTPS');
  }
  if (!loopback && (isPrivateAddress(hostname) || privateName)) {
    throw new TypeError('baseUrl must not target a private or link-local host');
  }
  return { normalized: normalizeBaseUrl(url.href), hostname, loopback };
}

async function assertPublicEndpoint(validatedUrl, lookupImpl) {
  if (validatedUrl.loopback || isIP(validatedUrl.hostname.replace(/^\[|\]$/g, ''))) return;
  const addresses = await lookupImpl(validatedUrl.hostname, { all: true, verbatim: true });
  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new TypeError('baseUrl hostname did not resolve');
  }
  if (addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new TypeError('baseUrl hostname resolves to a private or link-local address');
  }
}

async function fetchJson(fetchImpl, url, timeoutMs) {
  const response = await fetchImpl(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  let body;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { status: response.status, body };
}

function validateEvidenceWindow(payload, nowMs, maxEvidenceAgeMs) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new TypeError('receipt payload must be an object');
  }
  if (payload.schemaVersion !== 'szl.khipu.receipt.v1') {
    throw new TypeError('receipt schemaVersion must be szl.khipu.receipt.v1');
  }
  if (
    typeof payload.receiptId !== 'string' ||
    !/^[A-Za-z0-9._:-]{1,128}$/.test(payload.receiptId)
  ) {
    throw new TypeError('receiptId has an invalid format');
  }
  if (typeof payload.nonce !== 'string' || !/^[A-Za-z0-9._:-]{16,128}$/.test(payload.nonce)) {
    throw new TypeError('receipt nonce has an invalid format');
  }
  if (typeof payload.surface !== 'string' || !SURFACE_PATTERN.test(payload.surface)) {
    throw new TypeError('receipt surface has an invalid format');
  }
  if (payload.parentHash !== null && !HASH_PATTERN.test(payload.parentHash)) {
    throw new TypeError('receipt parentHash must be null or a SHA-256 digest');
  }
  if (payload.decision !== 'ALLOW' && payload.decision !== 'DENY') {
    throw new TypeError('receipt decision must be ALLOW or DENY');
  }
  if (!FULL_GIT_SHA_PATTERN.test(payload.gitSha)) {
    throw new TypeError('receipt gitSha must be a full 40-character lowercase commit');
  }

  const issuedAtMs = Date.parse(payload.issuedAt);
  const expiresAtMs = Date.parse(payload.expiresAt);
  if (!Number.isFinite(issuedAtMs) || !Number.isFinite(expiresAtMs)) {
    throw new TypeError('receipt issuedAt/expiresAt must be ISO timestamps');
  }
  if (issuedAtMs > nowMs + MAX_CLOCK_SKEW_MS) {
    throw new TypeError('receipt issuedAt is in the future');
  }
  if (expiresAtMs < nowMs - MAX_CLOCK_SKEW_MS) {
    throw new TypeError('receipt is expired');
  }
  if (expiresAtMs <= issuedAtMs || expiresAtMs - issuedAtMs > maxEvidenceAgeMs) {
    throw new TypeError('receipt lifetime exceeds the admitted evidence window');
  }
  if (nowMs - issuedAtMs > maxEvidenceAgeMs + MAX_CLOCK_SKEW_MS) {
    throw new TypeError('receipt is stale');
  }
}

function tamperEnvelope(envelope) {
  const payload = Buffer.from(envelope.payload, 'base64');
  payload[payload.length - 1] ^= 1;
  return { ...envelope, payload: payload.toString('base64') };
}

function evaluateChain(
  surface,
  evidence,
  { expectedRootGitSha, expectedGitSha, nowMs, maxEvidenceAgeMs },
) {
  const receipts = evidence?.receipts;
  if (!Array.isArray(receipts) || receipts.length < 2) {
    return result('khipu-chain', FAIL, 'evidence.receipts must contain at least two receipts');
  }

  try {
    const decoded = receipts.map((envelope) => ({
      envelope,
      payload: decodeDssePayload(envelope),
      hash: payloadHash(envelope),
    }));
    const receiptIds = new Set();
    const nonces = new Set();
    for (const [index, entry] of decoded.entries()) {
      if (entry.envelope.payloadType !== KHIPU_PAYLOAD_TYPE) {
        throw new TypeError(`receipt ${index} payloadType must be ${KHIPU_PAYLOAD_TYPE}`);
      }
      validateEvidenceWindow(entry.payload, nowMs, maxEvidenceAgeMs);
      const expectedCommit = index === 0 ? expectedRootGitSha : expectedGitSha;
      if (!FULL_GIT_SHA_PATTERN.test(expectedCommit || '')) {
        throw new TypeError(
          `${index === 0 ? 'root' : 'target'} expected Git SHA must be a full 40-character lowercase commit`,
        );
      }
      if (entry.payload.gitSha !== expectedCommit) {
        throw new TypeError(
          `receipt ${index} gitSha must match ${index === 0 ? 'root' : 'target'} commit ${expectedCommit}`,
        );
      }
      if (receiptIds.has(entry.payload.receiptId)) {
        throw new TypeError(`receipt ${index} replays receiptId ${entry.payload.receiptId}`);
      }
      if (nonces.has(entry.payload.nonce)) {
        throw new TypeError(`receipt ${index} replays nonce ${entry.payload.nonce}`);
      }
      receiptIds.add(entry.payload.receiptId);
      nonces.add(entry.payload.nonce);
    }
    if (decoded[0].payload.surface !== 'a11oy' || decoded[0].payload.parentHash !== null) {
      throw new TypeError('receipt chain must begin with an a11oy root whose parentHash is null');
    }
    if (decoded.at(-1).payload.surface !== surface) {
      throw new TypeError(`receipt chain must terminate at ${surface}`);
    }
    for (let index = 1; index < decoded.length; index += 1) {
      if (decoded[index].payload.parentHash !== decoded[index - 1].hash) {
        return result(
          'khipu-chain',
          FAIL,
          `receipt ${index} parentHash does not match receipt ${index - 1}`,
        );
      }
    }
    const crossesBoundary = decoded.some(
      (entry, index) =>
        index > 0 &&
        decoded[index - 1].payload.surface === 'a11oy' &&
        entry.payload.surface === surface,
    );
    if (!crossesBoundary) {
      return result('khipu-chain', FAIL, `no adjacent a11oy -> ${surface} parent link was found`);
    }
    const allSigned = decoded.every(
      ({ envelope }) => Array.isArray(envelope.signatures) && envelope.signatures.length === 1,
    );
    return allSigned
      ? result(
          'khipu-chain',
          PASS,
          `${receipts.length} fresh DSSE envelopes bound to root ${expectedRootGitSha} and target ${expectedGitSha}; cross-surface link verified`,
        )
      : result('khipu-chain', FAIL, 'one or more receipts lack the required DSSE envelope');
  } catch (error) {
    return result('khipu-chain', FAIL, error instanceof Error ? error.message : String(error));
  }
}

function evaluateDenial(evidence) {
  try {
    const receipts = evidence?.receipts || [];
    const denialId = evidence?.denialReceiptId;
    const denial = receipts
      .map((envelope) => decodeDssePayload(envelope))
      .find((payload) => payload.receiptId === denialId);
    return denial?.decision === 'DENY'
      ? result('denial-receipt', PASS, `DENY receipt ${denialId} is present`)
      : result('denial-receipt', FAIL, 'a referenced DENY receipt is required');
  } catch (error) {
    return result('denial-receipt', FAIL, error instanceof Error ? error.message : String(error));
  }
}

function evaluateOtel(evidence, nowMs, maxEvidenceAgeMs) {
  const spans = evidence?.otelSpans;
  if (!Array.isArray(spans) || spans.length === 0) {
    return result('otel-genai', FAIL, 'evidence.otelSpans is empty');
  }
  const canonical = spans.find((span) => {
    const attributes = span?.attributes || {};
    const startTimeMs = Date.parse(span?.startTime);
    const endTimeMs = Date.parse(span?.endTime);
    const hasTraceContext =
      TRACE_ID_PATTERN.test(span?.traceId) &&
      SPAN_ID_PATTERN.test(span?.spanId) &&
      Number.isFinite(startTimeMs) &&
      Number.isFinite(endTimeMs) &&
      endTimeMs >= startTimeMs &&
      endTimeMs <= nowMs + MAX_CLOCK_SKEW_MS &&
      nowMs - endTimeMs <= maxEvidenceAgeMs + MAX_CLOCK_SKEW_MS;
    const isGenAI =
      typeof span?.semanticType === 'string' &&
      span.semanticType.startsWith('gen_ai.') &&
      typeof attributes['gen_ai.operation.name'] === 'string' &&
      typeof attributes['gen_ai.provider.name'] === 'string';
    const isMcp =
      typeof span?.semanticType === 'string' &&
      span.semanticType.startsWith('mcp.') &&
      typeof attributes['mcp.method.name'] === 'string';
    return hasTraceContext && (isGenAI || isMcp) && !Object.hasOwn(attributes, 'gen_ai.system');
  });
  return canonical
    ? result(
        'otel-genai',
        PASS,
        `reported canonical ${canonical.semanticType} span structure with fresh trace context`,
      )
    : result(
        'otel-genai',
        FAIL,
        'no fresh reported GenAI or MCP semantic-convention span structure found',
      );
}

function validateTrustRoot(label, publicKeyPem, expectedFingerprint) {
  if (!publicKeyPem || !expectedFingerprint) {
    throw new TypeError(`pinned ${label} public key and fingerprint are required`);
  }
  const actualFingerprint = publicKeyFingerprint(publicKeyPem);
  if (actualFingerprint !== expectedFingerprint) {
    throw new TypeError(
      `${label} public key fingerprint mismatch: expected ${expectedFingerprint}, received ${actualFingerprint}`,
    );
  }
}

function verifyPinnedEnvelope(envelope, publicKeyPem, expectedFingerprint) {
  return verifyDsseEnvelope(envelope, {
    publicKeyPem,
    expectedFingerprint,
    expectedPayloadType: KHIPU_PAYLOAD_TYPE,
  }).valid;
}

function evaluateOffline(
  evidence,
  { rootPublicKeyPem, rootExpectedFingerprint, targetPublicKeyPem, targetExpectedFingerprint },
) {
  const receipts = evidence?.receipts;
  if (!Array.isArray(receipts) || receipts.length === 0) {
    return result('offline-verify', FAIL, 'no receipts are available to verify');
  }
  try {
    validateTrustRoot('a11oy root', rootPublicKeyPem, rootExpectedFingerprint);
    validateTrustRoot('target', targetPublicKeyPem, targetExpectedFingerprint);
    const rootValid = verifyPinnedEnvelope(receipts[0], rootPublicKeyPem, rootExpectedFingerprint);
    const targetValid = receipts
      .slice(1)
      .every((envelope) =>
        verifyPinnedEnvelope(envelope, targetPublicKeyPem, targetExpectedFingerprint),
      );
    const tamperedTargetValid = verifyPinnedEnvelope(
      tamperEnvelope(receipts.at(-1)),
      targetPublicKeyPem,
      targetExpectedFingerprint,
    );
    return rootValid && targetValid && !tamperedTargetValid
      ? result(
          'offline-verify',
          PASS,
          'a11oy root and target receipts verify under separately pinned trust roots; tampered target fails',
        )
      : result('offline-verify', FAIL, 'genuine/tampered exit contract was not satisfied');
  } catch (error) {
    return result('offline-verify', FAIL, error instanceof Error ? error.message : String(error));
  }
}

function evidenceContract(manifest) {
  if (manifest.schemaVersion === MANIFEST_V1) {
    return {
      rootGitShaEnv: manifest.deployment.expectedGitShaEnv,
      rootPublicKeyEnv: manifest.evidence.publicKeyEnv,
      rootPublicKeyFingerprintEnv: manifest.evidence.publicKeyFingerprintEnv,
      targetPublicKeyEnv: manifest.evidence.publicKeyEnv,
      targetPublicKeyFingerprintEnv: manifest.evidence.publicKeyFingerprintEnv,
    };
  }
  if (manifest.schemaVersion !== MANIFEST_V2) {
    throw new TypeError('unsupported conformance manifest schemaVersion');
  }
  const root = manifest.evidence?.root;
  const target = manifest.evidence?.target;
  const fields = {
    rootGitShaEnv: root?.expectedGitShaEnv,
    rootPublicKeyEnv: root?.publicKeyEnv,
    rootPublicKeyFingerprintEnv: root?.publicKeyFingerprintEnv,
    targetPublicKeyEnv: target?.publicKeyEnv,
    targetPublicKeyFingerprintEnv: target?.publicKeyFingerprintEnv,
  };
  for (const [field, value] of Object.entries(fields)) {
    if (typeof value !== 'string' || !/^[A-Z][A-Z0-9_]+$/.test(value)) {
      throw new TypeError(`manifest ${field} must name an environment variable`);
    }
  }
  return fields;
}

async function evaluateReadme(root, manifest) {
  try {
    const readme = await readFile(
      resolveWithinRoot(root, manifest.documentation.readme, 'documentation.readme'),
      'utf8',
    );
    const aboveFold = readme.split(/\r?\n/).slice(0, 40).join('\n');
    const hasStatus = /^>\s*\*\*Evidence status:\s*(LIVE|MODELED|PLANNED)\.\*\*/m.test(aboveFold);
    const citesTruth =
      /\[[^\]\r\n]*SOURCE_OF_TRUTH[^\]\r\n]*\]\([^)\r\n]*SOURCE_OF_TRUTH\.md(?:#[^)]+)?\)/.test(
        aboveFold,
      );
    return hasStatus && citesTruth
      ? result('readme-status', PASS, 'above-fold evidence status and canonical truth link found')
      : result(
          'readme-status',
          FAIL,
          'README first 40 lines must declare LIVE/MODELED/PLANNED and cite SOURCE_OF_TRUTH',
        );
  } catch (error) {
    return result('readme-status', FAIL, error instanceof Error ? error.message : String(error));
  }
}

async function evaluateManifest(root, manifest, surface) {
  try {
    if (![MANIFEST_V1, MANIFEST_V2].includes(manifest.schemaVersion)) {
      throw new TypeError('unsupported conformance manifest schemaVersion');
    }
    if (manifest.surface !== surface) {
      throw new TypeError(`manifest surface must match ${surface}`);
    }
    const artifactPath = resolveWithinRoot(
      root,
      manifest.registration.artifactManifest,
      'registration.artifactManifest',
    );
    const artifactExists = await pathExists(artifactPath);
    const truth = await readJson(resolveWithinRoot(root, 'audit/source-of-truth.json', 'truth'));
    const registered = truth.artifacts.registered.list.includes(manifest.registration.artifactId);
    const candidate = manifest.disposition === 'CANDIDATE';
    if (!artifactExists || !registered || !candidate) {
      return result(
        'product-manifest',
        FAIL,
        `artifact=${artifactExists} canonical=${registered} disposition=${manifest.disposition}`,
      );
    }
    return result('product-manifest', PASS, 'product manifest is canonical and candidate-scoped');
  } catch (error) {
    return result('product-manifest', FAIL, error instanceof Error ? error.message : String(error));
  }
}

export async function runConformance({
  surface,
  root = process.cwd(),
  manifest,
  baseUrl,
  expectedGitSha,
  expectedRootGitSha,
  publicKeyPem,
  expectedFingerprint,
  rootPublicKeyPem,
  rootExpectedFingerprint,
  fetchImpl = globalThis.fetch,
  lookupImpl = lookup,
  nowMs = Date.now(),
  maxEvidenceAgeMs = DEFAULT_MAX_EVIDENCE_AGE_MS,
  requestTimeoutMs = 10_000,
} = {}) {
  if (typeof surface !== 'string' || !SURFACE_PATTERN.test(surface)) {
    throw new TypeError('surface is required and must match [a-z0-9-]+');
  }
  if (!Number.isInteger(maxEvidenceAgeMs) || maxEvidenceAgeMs < 1 || maxEvidenceAgeMs > 3_600_000) {
    throw new TypeError('maxEvidenceAgeMs must be an integer between 1 and 3600000');
  }
  if (!Number.isInteger(requestTimeoutMs) || requestTimeoutMs < 1 || requestTimeoutMs > 60_000) {
    throw new TypeError('requestTimeoutMs must be an integer between 1 and 60000');
  }
  const surfaceManifest =
    manifest ||
    (await readJson(
      resolveWithinRoot(PACKAGE_ROOT, `surfaces/${surface}.json`, 'surface manifest'),
    ));
  if (surfaceManifest.surface !== surface) {
    throw new TypeError(`manifest surface must match ${surface}`);
  }
  const trust = evidenceContract(surfaceManifest);
  const checks = [];

  const resolvedBaseUrl = baseUrl || process.env[surfaceManifest.deployment.baseUrlEnv];
  const resolvedExpectedSha =
    expectedGitSha ||
    process.env[surfaceManifest.deployment.expectedGitShaEnv] ||
    process.env.GITHUB_SHA;
  const resolvedExpectedRootSha =
    expectedRootGitSha ||
    process.env[trust.rootGitShaEnv] ||
    (surfaceManifest.schemaVersion === MANIFEST_V1 ? resolvedExpectedSha : undefined);
  const resolvedTargetPublicKey = publicKeyPem || process.env[trust.targetPublicKeyEnv];
  const resolvedTargetFingerprint =
    expectedFingerprint || process.env[trust.targetPublicKeyFingerprintEnv];
  const resolvedRootPublicKey =
    rootPublicKeyPem ||
    process.env[trust.rootPublicKeyEnv] ||
    (surfaceManifest.schemaVersion === MANIFEST_V1 ? resolvedTargetPublicKey : undefined);
  const resolvedRootFingerprint =
    rootExpectedFingerprint ||
    process.env[trust.rootPublicKeyFingerprintEnv] ||
    (surfaceManifest.schemaVersion === MANIFEST_V1 ? resolvedTargetFingerprint : undefined);

  let evidence = null;
  if (!resolvedBaseUrl || !resolvedExpectedSha || !FULL_GIT_SHA_PATTERN.test(resolvedExpectedSha)) {
    checks.push(
      result(
        'runtime-endpoints',
        FAIL,
        `set ${surfaceManifest.deployment.baseUrlEnv} and a full 40-hex ${surfaceManifest.deployment.expectedGitShaEnv}`,
      ),
    );
  } else {
    try {
      const validatedBaseUrl = validateBaseUrl(resolvedBaseUrl);
      await assertPublicEndpoint(validatedBaseUrl, lookupImpl);
      const normalized = validatedBaseUrl.normalized;
      const [health, version, evidenceResponse] = await Promise.all([
        fetchJson(fetchImpl, `${normalized}/healthz`, requestTimeoutMs),
        fetchJson(fetchImpl, `${normalized}/version`, requestTimeoutMs),
        fetchJson(fetchImpl, `${normalized}/evidence`, requestTimeoutMs),
      ]);
      evidence = evidenceResponse.body;
      const all200 =
        health.status === 200 && version.status === 200 && evidenceResponse.status === 200;
      const shaMatches = version.body?.gitSha === resolvedExpectedSha;
      checks.push(
        all200 && shaMatches
          ? result('runtime-endpoints', PASS, `all endpoints 200; gitSha=${resolvedExpectedSha}`)
          : result(
              'runtime-endpoints',
              FAIL,
              `statuses=${health.status}/${version.status}/${evidenceResponse.status} gitSha=${version.body?.gitSha || 'missing'}`,
            ),
      );
    } catch (error) {
      checks.push(
        result('runtime-endpoints', FAIL, error instanceof Error ? error.message : String(error)),
      );
    }
  }

  checks.push(
    evaluateChain(surface, evidence, {
      expectedRootGitSha: resolvedExpectedRootSha,
      expectedGitSha: resolvedExpectedSha,
      nowMs,
      maxEvidenceAgeMs,
    }),
  );
  checks.push(evaluateDenial(evidence));
  checks.push(evaluateOtel(evidence, nowMs, maxEvidenceAgeMs));
  checks.push(
    evaluateOffline(evidence, {
      rootPublicKeyPem: resolvedRootPublicKey,
      rootExpectedFingerprint: resolvedRootFingerprint,
      targetPublicKeyPem: resolvedTargetPublicKey,
      targetExpectedFingerprint: resolvedTargetFingerprint,
    }),
  );
  checks.push(await evaluateReadme(root, surfaceManifest));
  checks.push(await evaluateManifest(root, surfaceManifest, surface));

  const orderedIds = [
    'khipu-chain',
    'runtime-endpoints',
    'denial-receipt',
    'otel-genai',
    'offline-verify',
    'readme-status',
    'product-manifest',
  ];
  checks.sort((left, right) => orderedIds.indexOf(left.id) - orderedIds.indexOf(right.id));
  const passed = checks.filter((check) => check.status === PASS).length;
  return {
    schemaVersion: 'szl.vertical-conformance.result.v1',
    surface,
    passed,
    total: checks.length,
    conformant: passed === checks.length,
    checkedAt: new Date(nowMs).toISOString(),
    checks,
  };
}
