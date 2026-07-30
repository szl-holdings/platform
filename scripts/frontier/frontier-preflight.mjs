#!/usr/bin/env node
import { execFile as execFileCallback } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { runConformance } from '../../packages/conformance/src/conformance.mjs';

const execFile = promisify(execFileCallback);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPOSITORY_ROOT = resolve(dirname(SCRIPT_PATH), '..', '..');
const MAX_RESPONSE_BYTES = 64 * 1024;
const DEFAULT_TIMEOUT_MS = 15_000;
const FULL_GIT_SHA = /^[0-9a-f]{40}$/;
const HOSTED_PROOF_ID = /^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,199}$/;
const HOSTED_TRACE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const HOSTED_PROOF_ATTRIBUTES = Object.freeze({
  receiptId: 'gen_ai.attestation.receipt.id',
  gitSha: 'vcs.ref.head.revision',
  environment: 'deployment.environment.name',
});
const DATADOG_SITES = new Set([
  'datadoghq.com',
  'us3.datadoghq.com',
  'us5.datadoghq.com',
  'datadoghq.eu',
  'ap1.datadoghq.com',
  'ap2.datadoghq.com',
  'ddog-gov.com',
]);
const LANGFUSE_HOSTS = new Set([
  'cloud.langfuse.com',
  'us.cloud.langfuse.com',
  'jp.cloud.langfuse.com',
  'hipaa.cloud.langfuse.com',
]);
const ARIZE_AX_HOSTS = new Set(['api.arize.com']);
const ARIZE_PHOENIX_HOSTS = new Set(['app.phoenix.arize.com']);

export const FRONTIER_TARGETS = Object.freeze({
  npm: [
    {
      name: '@szl/mcp-governor',
      version: '0.1.0',
      url: 'https://registry.npmjs.org/%40szl%2Fmcp-governor',
    },
    {
      name: '@szl/verify',
      version: '0.1.0',
      url: 'https://registry.npmjs.org/%40szl%2Fverify',
    },
  ],
  doi: {
    expectedTitlePattern: /decision[\s-]*slsa/i,
    conceptDoi: '10.5281/zenodo.19944926',
    recordUrl: 'https://zenodo.org/api/records/20490218',
  },
  surfaces: [
    {
      surface: 'sentra',
      canonicalRepository: null,
      baseUrl: null,
    },
    {
      surface: 'vessels',
      canonicalRepository: 'szl-holdings/killinchu',
      baseUrl: 'https://szlholdings-killinchu.hf.space',
    },
    {
      surface: 'insurance',
      canonicalRepository: 'szl-holdings/david-leads',
      baseUrl: 'https://szlholdings-david-leads.hf.space',
    },
  ],
});

function measured(status, detail, extra = {}) {
  return { evidenceState: 'MEASURED', status, detail, ...extra };
}

function unavailable(status, detail, extra = {}) {
  return { evidenceState: 'UNAVAILABLE', status, detail, ...extra };
}

async function boundedText(response, maxBytes = MAX_RESPONSE_BYTES) {
  if (!response.body?.getReader) {
    const text = await response.text();
    return { text: text.slice(0, maxBytes), truncated: text.length > maxBytes };
  }

  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  let truncated = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (size + value.byteLength > maxBytes) {
        chunks.push(value.subarray(0, Math.max(0, maxBytes - size)));
        truncated = true;
        await reader.cancel();
        break;
      }
      chunks.push(value);
      size += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }
  return {
    text: Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString('utf8'),
    truncated,
  };
}

async function probe(fetchImpl, url, timeoutMs) {
  try {
    const response = await fetchImpl(url, {
      headers: { accept: 'application/json' },
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
    });
    const contentType = response.headers.get('content-type') || '';
    const { text, truncated } = await boundedText(response);
    let json = null;
    if (contentType.toLowerCase().includes('application/json')) {
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }
    return {
      reachable: true,
      httpStatus: response.status,
      contentType: contentType.split(';', 1)[0] || 'unknown',
      json,
      truncated,
    };
  } catch (error) {
    return {
      reachable: false,
      httpStatus: null,
      contentType: null,
      json: null,
      truncated: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function hostedJsonRequest(fetchImpl, url, init, timeoutMs) {
  try {
    const response = await fetchImpl(url, {
      ...init,
      redirect: 'error',
      signal: AbortSignal.timeout(timeoutMs),
    });
    const contentType = response.headers.get('content-type') || '';
    const { text, truncated } = await boundedText(response);
    let json = null;
    if (!truncated && contentType.toLowerCase().includes('application/json')) {
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }
    return {
      httpStatus: response.status,
      responseJson: json !== null,
      truncated,
      json,
      requestFailed: false,
    };
  } catch {
    return {
      httpStatus: null,
      responseJson: false,
      truncated: false,
      json: null,
      requestFailed: true,
    };
  }
}

function exactAttributeObserved(root, attribute, expected) {
  const stack = [root];
  let visited = 0;
  while (stack.length > 0 && visited < 20_000) {
    const value = stack.pop();
    visited += 1;
    if (!value || typeof value !== 'object') continue;
    if (!Array.isArray(value) && Object.hasOwn(value, attribute) && value[attribute] === expected) {
      return true;
    }
    for (const child of Object.values(value)) {
      if (child && typeof child === 'object') stack.push(child);
    }
  }
  return false;
}

function exactHostedRecordObserved(json, expected, recordKey = 'data') {
  const records = Array.isArray(json?.[recordKey]) ? json[recordKey] : [];
  const matchingRecordObserved = records.some(
    (record) =>
      exactAttributeObserved(record, HOSTED_PROOF_ATTRIBUTES.receiptId, expected.receiptId) &&
      exactAttributeObserved(record, HOSTED_PROOF_ATTRIBUTES.gitSha, expected.gitSha) &&
      exactAttributeObserved(record, HOSTED_PROOF_ATTRIBUTES.environment, expected.environment),
  );
  return { matchingRecordObserved, recordsExamined: records.length };
}

function validatedHostedBaseUrl(candidate, fallback, allowedHosts) {
  try {
    const url = new URL(candidate || fallback);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !allowedHosts.has(url.hostname.toLowerCase())
    ) {
      return null;
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function hostedProviderUnavailable(provider, credentialInputsPresent, proofIdentityInputsPresent) {
  return {
    provider,
    evidenceState: credentialInputsPresent ? 'UNVERIFIED' : 'UNAVAILABLE',
    status: credentialInputsPresent ? 'CONFIGURATION_INCOMPLETE' : 'CREDENTIALS_UNAVAILABLE',
    credentialInputsPresent,
    proofIdentityInputsPresent,
    queryAttempted: false,
    httpStatus: null,
    responseJson: false,
    responseTruncated: false,
    matchingRecordObserved: false,
    recordsExamined: 0,
    hostedProductionProofObserved: false,
  };
}

function hostedProviderResult(provider, request, match) {
  const hostedProductionProofObserved =
    request.httpStatus === 200 &&
    request.responseJson &&
    !request.truncated &&
    match.matchingRecordObserved;
  return {
    provider,
    evidenceState: hostedProductionProofObserved ? 'VERIFIED' : 'UNVERIFIED',
    status: hostedProductionProofObserved
      ? 'OPERATIONAL'
      : request.requestFailed
        ? 'REQUEST_FAILED'
        : request.httpStatus !== 200
          ? 'HTTP_ERROR'
          : request.truncated
            ? 'RESPONSE_TOO_LARGE'
            : !request.responseJson
              ? 'INVALID_RESPONSE'
              : 'PROOF_MISMATCH',
    credentialInputsPresent: true,
    proofIdentityInputsPresent: true,
    queryAttempted: true,
    httpStatus: request.httpStatus,
    responseJson: request.responseJson,
    responseTruncated: request.truncated,
    matchingRecordObserved: match.matchingRecordObserved,
    recordsExamined: match.recordsExamined,
    hostedProductionProofObserved,
  };
}

function hostedWindow(env, nowMs) {
  const rawHours = env.SZL_OBSERVABILITY_LOOKBACK_HOURS || '24';
  if (!/^\d{1,3}$/.test(rawHours)) return null;
  const hours = Number(rawHours);
  if (!Number.isInteger(hours) || hours < 1 || hours > 168) return null;
  return {
    hours,
    from: new Date(nowMs - hours * 60 * 60 * 1000).toISOString(),
    to: new Date(nowMs).toISOString(),
  };
}

async function inspectDatadog(fetchImpl, env, expected, window, timeoutMs) {
  const apiKey = env.DATADOG_API_KEY || env.DD_API_KEY;
  const appKey = env.DATADOG_APP_KEY || env.DD_APP_KEY;
  const credentialInputsPresent = Boolean(apiKey && appKey);
  const site = env.DATADOG_SITE || env.DD_SITE || 'datadoghq.com';
  const proofIdentityInputsPresent = Boolean(expected && window && DATADOG_SITES.has(site));
  if (!credentialInputsPresent || !proofIdentityInputsPresent) {
    return hostedProviderUnavailable(
      'Datadog',
      credentialInputsPresent,
      proofIdentityInputsPresent,
    );
  }

  const query = [
    `@${HOSTED_PROOF_ATTRIBUTES.receiptId}:"${expected.receiptId}"`,
    `@${HOSTED_PROOF_ATTRIBUTES.gitSha}:"${expected.gitSha}"`,
    `@${HOSTED_PROOF_ATTRIBUTES.environment}:"${expected.environment}"`,
  ].join(' AND ');
  const request = await hostedJsonRequest(
    fetchImpl,
    `https://api.${site}/api/v2/spans/events/search`,
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'DD-API-KEY': apiKey,
        'DD-APPLICATION-KEY': appKey,
      },
      body: JSON.stringify({
        data: {
          type: 'search_request',
          attributes: {
            filter: { from: window.from, to: window.to, query },
            page: { limit: 25 },
            sort: 'timestamp',
          },
        },
      }),
    },
    timeoutMs,
  );
  return hostedProviderResult(
    'Datadog',
    request,
    exactHostedRecordObserved(request.json, expected),
  );
}

async function inspectLangfuse(fetchImpl, env, expected, window, timeoutMs) {
  const publicKey = env.LANGFUSE_PUBLIC_KEY;
  const secretKey = env.LANGFUSE_SECRET_KEY;
  const traceId = env.LANGFUSE_TRACE_ID;
  const credentialInputsPresent = Boolean(publicKey && secretKey);
  const baseUrl = validatedHostedBaseUrl(
    env.LANGFUSE_BASE_URL,
    'https://cloud.langfuse.com',
    LANGFUSE_HOSTS,
  );
  const proofIdentityInputsPresent = Boolean(
    expected && window && baseUrl && traceId && HOSTED_TRACE_ID.test(traceId),
  );
  if (!credentialInputsPresent || !proofIdentityInputsPresent) {
    return hostedProviderUnavailable(
      'Langfuse',
      credentialInputsPresent,
      proofIdentityInputsPresent,
    );
  }

  const url = new URL('/api/public/v2/observations', baseUrl);
  url.searchParams.set('fields', 'core,basic,metadata,trace_context');
  url.searchParams.set('traceId', traceId);
  url.searchParams.set('fromStartTime', window.from);
  url.searchParams.set('toStartTime', window.to);
  url.searchParams.set('limit', '100');
  const request = await hostedJsonRequest(
    fetchImpl,
    url,
    {
      method: 'GET',
      headers: {
        accept: 'application/json',
        authorization: `Basic ${Buffer.from(`${publicKey}:${secretKey}`, 'utf8').toString('base64')}`,
      },
    },
    timeoutMs,
  );
  return hostedProviderResult(
    'Langfuse',
    request,
    exactHostedRecordObserved(request.json, expected),
  );
}

async function inspectArizeAx(fetchImpl, env, expected, window, timeoutMs) {
  const apiKey = env.ARIZE_API_KEY;
  const project = env.ARIZE_PROJECT_ID;
  const credentialInputsPresent = Boolean(apiKey);
  const baseUrl = validatedHostedBaseUrl(
    env.ARIZE_BASE_URL,
    'https://api.arize.com/v2',
    ARIZE_AX_HOSTS,
  );
  const proofIdentityInputsPresent = Boolean(
    expected && window && baseUrl && project && project.trim().length <= 200,
  );
  if (!credentialInputsPresent || !proofIdentityInputsPresent) {
    return hostedProviderUnavailable(
      'Arize AX',
      credentialInputsPresent,
      proofIdentityInputsPresent,
    );
  }

  const filter = [
    `"attributes.${HOSTED_PROOF_ATTRIBUTES.receiptId}" = '${expected.receiptId}'`,
    `"attributes.${HOSTED_PROOF_ATTRIBUTES.gitSha}" = '${expected.gitSha}'`,
    `"attributes.${HOSTED_PROOF_ATTRIBUTES.environment}" = '${expected.environment}'`,
  ].join(' AND ');
  const url = new URL(`${baseUrl}/spans`);
  url.searchParams.set('limit', '100');
  const request = await hostedJsonRequest(
    fetchImpl,
    url,
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        project_id: project.trim(),
        start_time: window.from,
        end_time: window.to,
        filter,
      }),
    },
    timeoutMs,
  );
  return hostedProviderResult(
    'Arize AX',
    request,
    exactHostedRecordObserved(request.json, expected, 'spans'),
  );
}

async function inspectArizePhoenix(fetchImpl, env, expected, window, timeoutMs) {
  const apiKey = env.PHOENIX_API_KEY;
  const project = env.PHOENIX_PROJECT_ID;
  const credentialInputsPresent = Boolean(apiKey);
  const baseUrl = validatedHostedBaseUrl(
    env.PHOENIX_BASE_URL,
    'https://app.phoenix.arize.com',
    ARIZE_PHOENIX_HOSTS,
  );
  const proofIdentityInputsPresent = Boolean(
    expected && window && baseUrl && project && project.trim().length <= 200,
  );
  if (!credentialInputsPresent || !proofIdentityInputsPresent) {
    return hostedProviderUnavailable(
      'Arize Phoenix',
      credentialInputsPresent,
      proofIdentityInputsPresent,
    );
  }

  const url = new URL(`/v1/projects/${encodeURIComponent(project.trim())}/spans`, baseUrl);
  url.searchParams.append(
    'attribute',
    `${HOSTED_PROOF_ATTRIBUTES.receiptId}:${expected.receiptId}`,
  );
  url.searchParams.append('attribute', `${HOSTED_PROOF_ATTRIBUTES.gitSha}:${expected.gitSha}`);
  url.searchParams.append(
    'attribute',
    `${HOSTED_PROOF_ATTRIBUTES.environment}:${expected.environment}`,
  );
  url.searchParams.set('start_time', window.from);
  url.searchParams.set('end_time', window.to);
  url.searchParams.set('limit', '100');
  const request = await hostedJsonRequest(
    fetchImpl,
    url,
    {
      method: 'GET',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
    },
    timeoutMs,
  );
  return hostedProviderResult(
    'Arize Phoenix',
    request,
    exactHostedRecordObserved(request.json, expected),
  );
}

async function inspectArize(fetchImpl, env, expected, window, timeoutMs) {
  if (env.PHOENIX_API_KEY || env.PHOENIX_PROJECT_ID || env.PHOENIX_BASE_URL) {
    return inspectArizePhoenix(fetchImpl, env, expected, window, timeoutMs);
  }
  return inspectArizeAx(fetchImpl, env, expected, window, timeoutMs);
}

async function inspectNpm(fetchImpl, timeoutMs) {
  const packages = await Promise.all(
    FRONTIER_TARGETS.npm.map(async (target) => {
      const response = await probe(fetchImpl, target.url, timeoutMs);
      const published =
        response.httpStatus === 200 &&
        response.json?.name === target.name &&
        Object.hasOwn(response.json?.versions || {}, target.version);
      return {
        name: target.name,
        version: target.version,
        published,
        httpStatus: response.httpStatus,
        registryMetadataJson: response.json !== null,
        error: response.error,
      };
    }),
  );
  const operational = packages.every(({ published }) => published);
  return measured(
    operational ? 'OPERATIONAL' : 'BLOCKED',
    operational
      ? 'Both exact package versions are present in the public npm registry.'
      : 'One or more exact package versions are absent from the public npm registry.',
    { operational, packages },
  );
}

async function inspectDoi(fetchImpl, timeoutMs) {
  const response = await probe(fetchImpl, FRONTIER_TARGETS.doi.recordUrl, timeoutMs);
  const metadata = response.json?.metadata;
  const title = typeof metadata?.title === 'string' ? metadata.title : null;
  const parentDoiUrl = response.json?.links?.parent_doi;
  const conceptDoi =
    typeof parentDoiUrl === 'string'
      ? parentDoiUrl.replace(/^https:\/\/doi\.org\//, '')
      : typeof metadata?.relations?.version?.[0]?.parent?.pid_value === 'string'
        ? metadata.relations.version[0].parent.pid_value
        : metadata?.doi || null;
  const expectedRecord =
    response.httpStatus === 200 &&
    FRONTIER_TARGETS.doi.expectedTitlePattern.test(title || '') &&
    conceptDoi === FRONTIER_TARGETS.doi.conceptDoi;
  return measured(
    expectedRecord ? 'OPERATIONAL' : 'MISMATCH',
    expectedRecord
      ? 'The configured concept DOI resolves to a Decision-SLSA record.'
      : 'The configured concept DOI does not resolve to a Decision-SLSA record.',
    {
      operational: expectedRecord,
      httpStatus: response.httpStatus,
      observedTitle: title,
      observedDoi: metadata?.doi || null,
      observedConceptDoi: conceptDoi,
      expectedConceptDoi: FRONTIER_TARGETS.doi.conceptDoi,
      error: response.error,
    },
  );
}

function endpointSummary(response) {
  return {
    reachable: response.reachable,
    httpStatus: response.httpStatus,
    contentType: response.contentType,
    json: response.json !== null,
    truncated: response.truncated,
    error: response.error,
  };
}

async function inspectSurface(fetchImpl, target, timeoutMs) {
  if (!target.baseUrl) {
    return unavailable(
      'ABSENT',
      'No public canonical deployment target is configured for this surface.',
      {
        surface: target.surface,
        canonicalRepository: target.canonicalRepository,
        baseUrl: null,
        conformanceEndpointContract: false,
        receiptMinted: false,
      },
    );
  }

  const paths = ['/healthz', '/version', '/evidence', '/api/build-info', '/readyz'];
  const responses = await Promise.all(
    paths.map(async (path) => [
      path,
      await probe(fetchImpl, `${target.baseUrl}${path}`, timeoutMs),
    ]),
  );
  const byPath = Object.fromEntries(responses);
  const versionGitSha = byPath['/version'].json?.gitSha;
  const conformanceEndpointContract =
    byPath['/healthz'].httpStatus === 200 &&
    byPath['/healthz'].json !== null &&
    byPath['/version'].httpStatus === 200 &&
    FULL_GIT_SHA.test(versionGitSha || '') &&
    byPath['/evidence'].httpStatus === 200 &&
    Array.isArray(byPath['/evidence'].json?.receipts);
  const receiptMinted = byPath['/api/build-info'].json?.receipt_minted === true;
  const runtimeReady =
    byPath['/healthz'].httpStatus === 200 &&
    byPath['/healthz'].json !== null &&
    byPath['/readyz'].httpStatus === 200 &&
    byPath['/readyz'].json !== null;

  return measured(
    conformanceEndpointContract && receiptMinted ? 'CANDIDATE' : 'NON_CONFORMANT',
    conformanceEndpointContract
      ? receiptMinted
        ? 'Runtime endpoints and a minted build receipt are visible; the remaining gates still require evaluation.'
        : 'Runtime endpoints are shaped for conformance, but no minted build receipt is visible.'
      : 'The live deployment does not expose the required JSON /healthz, /version, and /evidence contract.',
    {
      surface: target.surface,
      canonicalRepository: target.canonicalRepository,
      baseUrl: target.baseUrl,
      runtimeReady,
      conformanceEndpointContract,
      receiptMinted,
      observedGitSha: FULL_GIT_SHA.test(versionGitSha || '') ? versionGitSha : null,
      endpoints: Object.fromEntries(paths.map((path) => [path, endpointSummary(byPath[path])])),
    },
  );
}

async function inspectVerticals(fetchImpl, timeoutMs, conformanceImpl, conformanceRoot) {
  const [surfaces, conformanceResults] = await Promise.all(
    [
      FRONTIER_TARGETS.surfaces.map((target) => inspectSurface(fetchImpl, target, timeoutMs)),
      FRONTIER_TARGETS.surfaces.map(async ({ surface }) => {
        const report = await conformanceImpl({
          surface,
          root: conformanceRoot,
          fetchImpl,
          requestTimeoutMs: timeoutMs,
        });
        return {
          surface,
          passed: report.passed,
          total: report.total,
          conformant: report.conformant,
          checks: report.checks,
        };
      }),
    ].map((promises) => Promise.all(promises)),
  );
  const verified = conformanceResults.filter(({ conformant }) => conformant).length;
  const operational = verified === conformanceResults.length;
  return measured(
    operational ? 'OPERATIONAL' : 'UNVERIFIED',
    operational
      ? 'Every target passed all seven conformance gates at its exact deployed commit.'
      : `${verified}/${conformanceResults.length} targets passed all seven conformance gates at exact deployed commits.`,
    {
      operational,
      verified,
      total: surfaces.length,
      surfaces,
      conformanceResults,
    },
  );
}

async function command(execFileImpl, file, args) {
  try {
    const result = await execFileImpl(file, args, {
      encoding: 'utf8',
      timeout: 10_000,
      windowsHide: true,
    });
    return {
      ok: true,
      stdout: String(result.stdout || ''),
      stderr: String(result.stderr || ''),
    };
  } catch (error) {
    return {
      ok: false,
      stdout: String(error?.stdout || ''),
      stderr: String(error?.stderr || ''),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function inspectHardware(platform, execFileImpl) {
  if (platform !== 'win32') {
    return unavailable(
      'UNAVAILABLE',
      'This preflight currently measures local TPM readiness only on Windows.',
      {
        operational: false,
        tpmPresent: false,
        tpmReadyForAttestation: false,
        pcrLogMatchesHardware: false,
        quoteToolAvailable: false,
        authorizedAttestationResultObserved: false,
      },
    );
  }

  const [device, pcr, ...quoteTools] = await Promise.all([
    command(execFileImpl, 'tpmtool.exe', ['getdeviceinformation']),
    command(execFileImpl, 'tpmtool.exe', ['comparepcr', 'sha256']),
    ...['tpm2_quote.exe', 'PCPTool.exe', 'Tpm2Tester.exe', 'TssTool.exe'].map((tool) =>
      command(execFileImpl, 'where.exe', [tool]),
    ),
  ]);
  const deviceText = `${device.stdout}\n${device.stderr}`;
  const pcrText = `${pcr.stdout}\n${pcr.stderr}`;
  const tpmPresent = /TPM Present:\s*True/i.test(deviceText);
  const tpmReadyForAttestation =
    /Ready For Attestation:\s*True/i.test(deviceText) &&
    /Is Capable For Attestation:\s*True/i.test(deviceText);
  const pcrLogMatchesHardware = /TCG Log and Hardware PCRs match!/i.test(pcrText);
  const quoteToolAvailable = quoteTools.some(({ ok }) => ok);

  return unavailable(
    'NO_AUTHORIZED_RESULT',
    'Local TPM readiness is measured, but no signed quote plus authorized verifier result was observed.',
    {
      operational: false,
      localReadinessEvidenceState: 'MEASURED',
      tpmPresent,
      tpmReadyForAttestation,
      pcrLogMatchesHardware,
      quoteToolAvailable,
      authorizedAttestationResultObserved: false,
      deviceProbeError: device.error,
      pcrProbeError: pcr.error,
    },
  );
}

async function inspectHostedObservability(fetchImpl, env, nowMs, timeoutMs) {
  const receiptId = env.SZL_OBSERVABILITY_RECEIPT_ID;
  const gitSha = env.SZL_OBSERVABILITY_GIT_SHA;
  const environment = env.SZL_OBSERVABILITY_ENVIRONMENT || 'production';
  const expected =
    receiptId &&
    HOSTED_PROOF_ID.test(receiptId) &&
    gitSha &&
    FULL_GIT_SHA.test(gitSha) &&
    ['production', 'staging'].includes(environment)
      ? { receiptId, gitSha, environment }
      : null;
  const window = hostedWindow(env, nowMs);
  const providers = await Promise.all([
    inspectDatadog(fetchImpl, env, expected, window, timeoutMs),
    inspectLangfuse(fetchImpl, env, expected, window, timeoutMs),
    inspectArize(fetchImpl, env, expected, window, timeoutMs),
  ]);
  const anyCredentials = providers.some(({ credentialInputsPresent }) => credentialInputsPresent);
  const operational = providers.every(
    ({ hostedProductionProofObserved }) => hostedProductionProofObserved,
  );
  return {
    evidenceState: operational ? 'VERIFIED' : anyCredentials ? 'UNVERIFIED' : 'UNAVAILABLE',
    status: operational ? 'OPERATIONAL' : 'UNVERIFIED',
    detail: operational
      ? 'All hosted providers returned one record containing the exact receipt, commit, and environment attributes.'
      : 'Hosted proof remains unverified until every provider returns one record containing the exact receipt, commit, and environment attributes.',
    operational,
    proofIdentityInputsPresent: Boolean(expected && window),
    expectedAttributeNames: HOSTED_PROOF_ATTRIBUTES,
    lookbackHours: window?.hours || null,
    providers,
  };
}

export async function runFrontierPreflight({
  fetchImpl = globalThis.fetch,
  env = process.env,
  platform = process.platform,
  execFileImpl = execFile,
  conformanceImpl = runConformance,
  conformanceRoot = REPOSITORY_ROOT,
  nowMs = Date.now(),
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('fetchImpl must be a function');
  if (typeof conformanceImpl !== 'function') {
    throw new TypeError('conformanceImpl must be a function');
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000) {
    throw new TypeError('timeoutMs must be an integer between 1 and 60000');
  }

  const [npm, doi, verticalConformance, hardware, hostedObservability] = await Promise.all([
    inspectNpm(fetchImpl, timeoutMs),
    inspectDoi(fetchImpl, timeoutMs),
    inspectVerticals(fetchImpl, timeoutMs, conformanceImpl, conformanceRoot),
    inspectHardware(platform, execFileImpl),
    inspectHostedObservability(fetchImpl, env, nowMs, timeoutMs),
  ]);
  const frontiers = { npm, doi, verticalConformance, hardware, hostedObservability };
  const operational = Object.values(frontiers).every((frontier) => frontier.operational === true);
  const blockers = Object.entries(frontiers)
    .filter(([, frontier]) => frontier.operational !== true)
    .map(([name]) => name);

  return {
    schemaVersion: 'szl.frontier-preflight.v2',
    checkedAt: new Date(nowMs).toISOString(),
    evidenceState: operational ? 'VERIFIED' : 'MEASURED',
    status: operational ? 'OPERATIONAL' : 'BLOCKED',
    operational,
    blockers,
    frontiers,
  };
}

function parseArgs(argv) {
  const parsed = { requireOperational: false, requireHostedObservability: false };
  for (const argument of argv) {
    if (argument === '--require-operational') parsed.requireOperational = true;
    else if (argument === '--require-hosted-observability') {
      parsed.requireHostedObservability = true;
    } else throw new Error(`unknown argument: ${argument}`);
  }
  return parsed;
}

if (resolve(process.argv[1] || '') === SCRIPT_PATH) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const report = await runFrontierPreflight();
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (
      (args.requireOperational && !report.operational) ||
      (args.requireHostedObservability && !report.frontiers.hostedObservability.operational)
    ) {
      process.exitCode = 1;
    }
  } catch (error) {
    process.stderr.write(
      `frontier preflight failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 2;
  }
}
