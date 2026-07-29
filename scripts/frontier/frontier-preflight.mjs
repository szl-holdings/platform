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

function inspectHostedObservability(env) {
  const providers = [
    {
      provider: 'Datadog',
      credentialInputsPresent: Boolean(
        (env.DATADOG_API_KEY || env.DD_API_KEY) && (env.DATADOG_APP_KEY || env.DD_APP_KEY),
      ),
    },
    {
      provider: 'Langfuse',
      credentialInputsPresent: Boolean(env.LANGFUSE_PUBLIC_KEY && env.LANGFUSE_SECRET_KEY),
    },
    {
      provider: 'Arize',
      credentialInputsPresent: Boolean(env.ARIZE_API_KEY),
    },
  ].map((provider) => ({
    ...provider,
    hostedProductionProofObserved: false,
  }));
  const anyCredentials = providers.some(({ credentialInputsPresent }) => credentialInputsPresent);
  return {
    evidenceState: anyCredentials ? 'UNVERIFIED' : 'UNAVAILABLE',
    status: 'UNVERIFIED',
    detail: 'No hosted production trace or receipt was retrieved from Datadog, Langfuse, or Arize.',
    operational: false,
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

  const [npm, doi, verticalConformance, hardware] = await Promise.all([
    inspectNpm(fetchImpl, timeoutMs),
    inspectDoi(fetchImpl, timeoutMs),
    inspectVerticals(fetchImpl, timeoutMs, conformanceImpl, conformanceRoot),
    inspectHardware(platform, execFileImpl),
  ]);
  const hostedObservability = inspectHostedObservability(env);
  const frontiers = { npm, doi, verticalConformance, hardware, hostedObservability };
  const operational = Object.values(frontiers).every((frontier) => frontier.operational === true);
  const blockers = Object.entries(frontiers)
    .filter(([, frontier]) => frontier.operational !== true)
    .map(([name]) => name);

  return {
    schemaVersion: 'szl.frontier-preflight.v1',
    checkedAt: new Date(nowMs).toISOString(),
    evidenceState: operational ? 'VERIFIED' : 'MEASURED',
    status: operational ? 'OPERATIONAL' : 'BLOCKED',
    operational,
    blockers,
    frontiers,
  };
}

function parseArgs(argv) {
  const parsed = { requireOperational: false };
  for (const argument of argv) {
    if (argument === '--require-operational') parsed.requireOperational = true;
    else throw new Error(`unknown argument: ${argument}`);
  }
  return parsed;
}

if (resolve(process.argv[1] || '') === SCRIPT_PATH) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const report = await runFrontierPreflight();
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (args.requireOperational && !report.operational) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(
      `frontier preflight failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 2;
  }
}
