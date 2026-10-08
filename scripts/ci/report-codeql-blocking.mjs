import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { annotation, locationDiagnostics } from './report-codeql-locations.mjs';

const safeIdentifier = (value) =>
  typeof value === 'string' && /^[A-Za-z0-9_./:@() -]{1,256}$/.test(value);
export function blockingContexts(pages, trackedPaths, expectedRef) {
  if (!Array.isArray(pages) || pages.some((page) => !Array.isArray(page)))
    throw new Error('Invalid pages');
  return pages
    .flat()
    .filter((alert) =>
      ['high', 'critical'].includes(alert.rule?.security_severity_level ?? alert.rule?.severity),
    )
    .map((alert) => {
      const instance = alert.most_recent_instance;
      const ruleId = alert.rule?.id;
      const uri = instance?.location?.path;
      const line = instance?.location?.start_line;
      if (
        alert.tool?.name !== 'CodeQL' ||
        instance?.ref !== expectedRef ||
        !Number.isSafeInteger(alert.number) ||
        alert.number < 1 ||
        !/^[A-Za-z0-9_/-]{1,160}$/.test(ruleId ?? '') ||
        !trackedPaths.has(uri) ||
        !/^[A-Za-z0-9_./@+-]{1,512}$/.test(uri ?? '') ||
        !Number.isSafeInteger(line) ||
        line < 1 ||
        !/^[a-f0-9]{40}$/.test(instance.commit_sha ?? '') ||
        !safeIdentifier(instance.analysis_key) ||
        !safeIdentifier(instance.category)
      )
        throw new Error('Invalid blocking context');
      return {
        number: alert.number,
        ruleId,
        location: `${uri}:${line}`,
        commit: instance.commit_sha,
        analysisKey: instance.analysis_key,
        category: instance.category,
      };
    });
}

export function matchingAnalyses(pages, contexts, expectedRef) {
  if (!Array.isArray(pages) || pages.some((page) => !Array.isArray(page)))
    throw new Error('Invalid analyses');
  return pages
    .flat()
    .filter(
      (analysis) =>
        analysis.tool?.name === 'CodeQL' &&
        analysis.ref === expectedRef &&
        contexts.some(
          (context) =>
            context.commit === analysis.commit_sha &&
            context.analysisKey === analysis.analysis_key &&
            context.category === analysis.category,
        ),
    )
    .map((analysis) => {
      if (!Number.isSafeInteger(analysis.id) || analysis.id < 1)
        throw new Error('Invalid analysis ID');
      return analysis;
    });
}

export function blockingTraces(sarif, trackedPaths, contexts) {
  const diagnostics = locationDiagnostics(
    sarif,
    trackedPaths,
    {},
    new Set(contexts.map((context) => context.ruleId)),
  );
  return diagnostics.filter((diagnostic) =>
    contexts.some(
      (context) =>
        context.ruleId === diagnostic.ruleId && diagnostic.locations.includes(context.location),
    ),
  );
}

export function reportBlocking(pages, trackedPaths, repository, expectedRef, api, emit) {
  const contexts = blockingContexts(pages, trackedPaths, expectedRef);
  // Reserve annotations for the actual open blocking alerts, never every raw
  // result. One context plus at most seven traces stays within the step quota.
  if (contexts.length === 0) return;
  const context = contexts[0];
  emit(`::notice title=CodeQL blocking provenance::${JSON.stringify(context)}`);
  const analyses = matchingAnalyses(
    api(`repos/${repository}/code-scanning/analyses`, 'application/vnd.github+json', {
      ref: expectedRef,
      tool_name: 'CodeQL',
    }),
    contexts,
    expectedRef,
  );
  if (analyses.length === 0) throw new Error('No matching analysis');
  const traces = [];
  for (const analysis of analyses) {
    const boundContexts = contexts.filter(
      (entry) =>
        entry.commit === analysis.commit_sha &&
        entry.analysisKey === analysis.analysis_key &&
        entry.category === analysis.category,
    );
    const sarif = api(
      `repos/${repository}/code-scanning/analyses/${analysis.id}`,
      'application/sarif+json',
    );
    traces.push(...blockingTraces(sarif, trackedPaths, boundContexts));
  }
  if (traces.length === 0) throw new Error('No matching trace');
  for (const trace of traces.slice(0, 7)) emit(annotation(trace));
  if (traces.length > 7 || contexts.length > 1)
    emit(
      `::notice title=CodeQL blocking diagnostic omissions::${JSON.stringify({ traces: Math.max(0, traces.length - 7), contexts: contexts.length - 1 })}`,
    );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const repository = process.env.CODEQL_REPOSITORY;
    const ref = process.env.CODEQL_REF;
    if (
      !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository ?? '') ||
      !/^refs\/pull\/[0-9]+\/merge$/.test(ref ?? '')
    )
      throw new Error('Invalid repository/ref');
    const tracked = new Set(
      execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0'),
    );
    const api = (endpoint, accept, query) => {
      const args = [
        'api',
        '--method',
        'GET',
        '-H',
        `Accept: ${accept}`,
        '-H',
        'X-GitHub-Api-Version: 2022-11-28',
        endpoint,
      ];
      if (query) {
        args.push('--paginate', '--slurp', '-F', 'per_page=100');
        for (const [key, value] of Object.entries(query)) args.push('-f', `${key}=${value}`);
      }
      return JSON.parse(
        execFileSync('gh', args, {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
          maxBuffer: 64 * 1024 * 1024,
        }),
      );
    };
    reportBlocking(
      JSON.parse(readFileSync(process.argv[2], 'utf8')),
      tracked,
      repository,
      ref,
      api,
      console.log,
    );
  } catch {
    console.error(
      '::notice title=CodeQL blocking trace unavailable::Unable to obtain a validated matching analysis trace. Open high or critical alerts still block merge.',
    );
    process.exitCode = 1;
  }
}
