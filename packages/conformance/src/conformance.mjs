import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  decodeDssePayload,
  payloadHash,
  publicKeyFingerprint,
  verifyDsseEnvelope,
} from './verify.mjs';

const PASS = 'PASS';
const FAIL = 'FAIL';

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

async function pathExists(path) {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}

async function fetchJson(fetchImpl, url) {
  const response = await fetchImpl(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });
  let body;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { status: response.status, body };
}

function tamperEnvelope(envelope) {
  const payload = Buffer.from(envelope.payload, 'base64');
  payload[payload.length - 1] ^= 1;
  return { ...envelope, payload: payload.toString('base64') };
}

function evaluateChain(surface, evidence) {
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
    const allSigned = receipts.every(
      (envelope) =>
        envelope.payloadType === 'application/vnd.szl.khipu.receipt+json' &&
        Array.isArray(envelope.signatures) &&
        envelope.signatures.length === 1,
    );
    return allSigned
      ? result(
          'khipu-chain',
          PASS,
          `${receipts.length} DSSE envelopes; cross-surface link verified`,
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

function evaluateOtel(evidence) {
  const spans = evidence?.otelSpans;
  if (!Array.isArray(spans) || spans.length === 0) {
    return result('otel-genai', FAIL, 'evidence.otelSpans is empty');
  }
  const canonical = spans.find((span) => {
    const attributes = span?.attributes || {};
    const isGenAI =
      typeof span?.semanticType === 'string' &&
      span.semanticType.startsWith('gen_ai.') &&
      typeof attributes['gen_ai.operation.name'] === 'string' &&
      typeof attributes['gen_ai.provider.name'] === 'string';
    const isMcp =
      typeof span?.semanticType === 'string' &&
      span.semanticType.startsWith('mcp.') &&
      typeof attributes['mcp.method.name'] === 'string';
    return (isGenAI || isMcp) && !Object.hasOwn(attributes, 'gen_ai.system');
  });
  return canonical
    ? result('otel-genai', PASS, `canonical ${canonical.semanticType} span found`)
    : result('otel-genai', FAIL, 'no current GenAI or MCP semantic-convention span found');
}

function evaluateOffline(evidence, publicKeyPem, expectedFingerprint) {
  const receipts = evidence?.receipts;
  if (!Array.isArray(receipts) || receipts.length === 0) {
    return result('offline-verify', FAIL, 'no receipts are available to verify');
  }
  if (!publicKeyPem || !expectedFingerprint) {
    return result('offline-verify', FAIL, 'pinned public key and fingerprint are required');
  }
  try {
    const actualFingerprint = publicKeyFingerprint(publicKeyPem);
    if (actualFingerprint !== expectedFingerprint) {
      return result(
        'offline-verify',
        FAIL,
        `public key fingerprint mismatch: ${actualFingerprint}`,
      );
    }
    const genuine = receipts.every(
      (envelope) => verifyDsseEnvelope(envelope, { publicKeyPem, expectedFingerprint }).valid,
    );
    const tampered = verifyDsseEnvelope(tamperEnvelope(receipts.at(-1)), {
      publicKeyPem,
      expectedFingerprint,
    });
    return genuine && !tampered.valid
      ? result('offline-verify', PASS, 'genuine receipts verify; tampered receipt fails')
      : result('offline-verify', FAIL, 'genuine/tampered exit contract was not satisfied');
  } catch (error) {
    return result('offline-verify', FAIL, error instanceof Error ? error.message : String(error));
  }
}

async function evaluateReadme(root, manifest) {
  try {
    const readme = await readFile(resolve(root, manifest.documentation.readme), 'utf8');
    const aboveFold = readme.split(/\r?\n/).slice(0, 40).join('\n');
    const hasStatus = /\b(LIVE|MODELED|PLANNED)\b/.test(aboveFold);
    const citesTruth = /SOURCE_OF_TRUTH/.test(aboveFold);
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

async function evaluateManifest(root, manifest) {
  try {
    const artifactPath = resolve(root, manifest.registration.artifactManifest);
    const artifactExists = await pathExists(artifactPath);
    const truth = await readJson(resolve(root, 'audit/source-of-truth.json'));
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
  publicKeyPem,
  expectedFingerprint,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (!surface) throw new TypeError('surface is required');
  const surfaceManifest =
    manifest || (await readJson(resolve(root, `packages/conformance/surfaces/${surface}.json`)));
  const checks = [];

  const resolvedBaseUrl = baseUrl || process.env[surfaceManifest.deployment.baseUrlEnv];
  const resolvedExpectedSha =
    expectedGitSha ||
    process.env[surfaceManifest.deployment.expectedGitShaEnv] ||
    process.env.GITHUB_SHA;
  const resolvedPublicKey = publicKeyPem || process.env[surfaceManifest.evidence.publicKeyEnv];
  const resolvedFingerprint =
    expectedFingerprint || process.env[surfaceManifest.evidence.publicKeyFingerprintEnv];

  let evidence = null;
  if (!resolvedBaseUrl || !resolvedExpectedSha) {
    checks.push(
      result(
        'runtime-endpoints',
        FAIL,
        `set ${surfaceManifest.deployment.baseUrlEnv} and ${surfaceManifest.deployment.expectedGitShaEnv}`,
      ),
    );
  } else {
    try {
      const normalized = normalizeBaseUrl(resolvedBaseUrl);
      const [health, version, evidenceResponse] = await Promise.all([
        fetchJson(fetchImpl, `${normalized}/healthz`),
        fetchJson(fetchImpl, `${normalized}/version`),
        fetchJson(fetchImpl, `${normalized}/evidence`),
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

  checks.push(evaluateChain(surface, evidence));
  checks.push(evaluateDenial(evidence));
  checks.push(evaluateOtel(evidence));
  checks.push(evaluateOffline(evidence, resolvedPublicKey, resolvedFingerprint));
  checks.push(await evaluateReadme(root, surfaceManifest));
  checks.push(await evaluateManifest(root, surfaceManifest));

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
    checkedAt: new Date().toISOString(),
    checks,
  };
}
