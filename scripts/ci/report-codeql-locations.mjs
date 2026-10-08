import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Diagnostics disclose identifiers and tracked repository locations only. SARIF
// messages, source snippets, URLs, and artifact contents are never printed.
export function locationDiagnostics(sarif, trackedPaths) {
  if (!sarif || !Array.isArray(sarif.runs)) throw new Error('Invalid SARIF');
  const output = [];
  const location = (entry) => {
    const physical = entry?.physicalLocation;
    const uri = physical?.artifactLocation?.uri;
    const line = physical?.region?.startLine;
    if (
      typeof uri !== 'string' ||
      !/^[A-Za-z0-9_./@+-]{1,512}$/.test(uri) ||
      uri.startsWith('/') ||
      uri.split('/').some((part) => part === '..' || part === '.') ||
      !trackedPaths.has(uri) ||
      !Number.isSafeInteger(line) ||
      line < 1
    )
      return undefined;
    return `${uri}:${line}`;
  };
  for (const run of sarif.runs) {
    if (!Array.isArray(run?.tool?.driver?.rules) || !Array.isArray(run.results)) {
      throw new Error('Invalid SARIF run');
    }
    const rules = new Map(run.tool.driver.rules.map((rule) => [rule.id, rule]));
    for (const result of run.results) {
      const rule = rules.get(result?.ruleId);
      const score = Number(rule?.properties?.['security-severity']);
      if (!Number.isFinite(score) || score < 7) continue;
      if (typeof result.ruleId !== 'string' || !/^[A-Za-z0-9_/-]{1,160}$/.test(result.ruleId)) {
        throw new Error('Invalid rule identifier');
      }
      const locations = (result.locations ?? []).map(location).filter(Boolean);
      const flows = (result.codeFlows ?? []).flatMap((flow) =>
        (flow.threadFlows ?? []).map((thread) =>
          (thread.locations ?? []).map((entry) => location(entry.location)).filter(Boolean),
        ),
      );
      output.push({ ruleId: result.ruleId, locations, flows });
    }
  }
  return output;
}

export function annotation(diagnostic) {
  // Escape workflow command delimiters even though the location/ID validators
  // reject control characters. JSON retains flow order without SARIF messages.
  const message = JSON.stringify(diagnostic)
    .replaceAll('%', '%25')
    .replaceAll('\r', '%0D')
    .replaceAll('\n', '%0A');
  return `::warning title=CodeQL location trace::${message}`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const directory = process.argv[2];
    if (!directory) throw new Error('Missing SARIF directory');
    const trackedPaths = new Set(
      execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0'),
    );
    const files = readdirSync(directory).filter((name) => name.endsWith('.sarif'));
    if (files.length === 0) throw new Error('No SARIF files');
    for (const name of files) {
      const diagnostics = locationDiagnostics(
        JSON.parse(readFileSync(path.join(directory, name), 'utf8')),
        trackedPaths,
      );
      for (const diagnostic of diagnostics) console.log(annotation(diagnostic));
    }
  } catch {
    // Never echo parse errors or file contents: either could contain secrets.
    console.error(
      '::error title=CodeQL diagnostics unavailable::Unable to validate local SARIF location diagnostics. Analysis and severity gate remain required.',
    );
    process.exitCode = 1;
  }
}
