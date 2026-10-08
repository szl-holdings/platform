import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Diagnostics disclose identifiers and tracked repository locations only. SARIF
// messages, source snippets, URLs, and artifact contents are never printed.
export function locationDiagnostics(sarif, trackedPaths, coverage = {}) {
  if (!sarif || !Array.isArray(sarif.runs)) throw new Error('Invalid SARIF');
  const output = [];
  Object.assign(coverage, {
    runs: 0,
    results: 0,
    resolvedRules: 0,
    securityResults: 0,
    highCriticalResults: 0,
    sourceLocations: 0,
    flowLocations: 0,
  });
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
    if (!run?.tool?.driver || !Array.isArray(run.results)) throw new Error('Invalid SARIF run');
    const extensions = run.tool.extensions ?? [];
    if (!Array.isArray(extensions)) throw new Error('Invalid SARIF extensions');
    const components = [run.tool.driver, ...extensions];
    for (const component of components) {
      if (component.rules !== undefined && !Array.isArray(component.rules))
        throw new Error('Invalid component rules');
    }
    coverage.runs++;
    for (const result of run.results) {
      coverage.results++;
      const reference = result?.rule;
      const componentReference = reference?.toolComponent;
      let component;
      if (componentReference?.index !== undefined) {
        if (!Number.isInteger(componentReference.index) || componentReference.index < 0)
          throw new Error('Invalid component index');
        component = extensions[componentReference.index];
        if (
          !component ||
          (componentReference.name !== undefined && component.name !== componentReference.name) ||
          (componentReference.guid !== undefined && component.guid !== componentReference.guid)
        )
          throw new Error('Unresolved component');
      } else if (componentReference) {
        const matching = components.filter(
          (entry) =>
            (componentReference.name === undefined || entry.name === componentReference.name) &&
            (componentReference.guid === undefined || entry.guid === componentReference.guid),
        );
        if (matching.length !== 1) throw new Error('Ambiguous component');
        component = matching[0];
      }
      const id = reference?.id ?? result?.ruleId;
      const index = reference?.index ?? result?.ruleIndex;
      let rule;
      if (index !== undefined) {
        if (!Number.isInteger(index) || index < 0) throw new Error('Invalid rule index');
        rule = (component ?? run.tool.driver).rules?.[index];
        if (!rule || (id !== undefined && id !== rule.id))
          throw new Error('Unresolved indexed rule');
      } else {
        const matching = (component ? [component] : components)
          .flatMap((entry) => entry.rules ?? [])
          .filter((entry) => entry.id === id);
        if (matching.length !== 1) throw new Error('Unresolved or ambiguous rule');
        rule = matching[0];
      }
      if (result.ruleId !== undefined && result.ruleId !== rule.id)
        throw new Error('Inconsistent rule identifier');
      coverage.resolvedRules++;
      const severity = rule.properties?.['security-severity'];
      const security = rule.properties?.tags?.includes('security');
      if (severity === undefined && !security) continue;
      const score = Number(severity);
      if (
        severity === undefined ||
        severity === null ||
        severity === '' ||
        !Number.isFinite(score) ||
        score < 0 ||
        score > 10
      )
        throw new Error('Invalid security severity');
      coverage.securityResults++;
      if (score < 7) continue;
      coverage.highCriticalResults++;
      if (typeof rule.id !== 'string' || !/^[A-Za-z0-9_/-]{1,160}$/.test(rule.id))
        throw new Error('Invalid rule identifier');
      const locations = (result.locations ?? []).map(location).filter(Boolean);
      const flows = (result.codeFlows ?? []).flatMap((flow) =>
        (flow.threadFlows ?? []).map((thread) =>
          (thread.locations ?? []).map((entry) => location(entry.location)).filter(Boolean),
        ),
      );
      coverage.sourceLocations += locations.length;
      coverage.flowLocations += flows.reduce((sum, flow) => sum + flow.length, 0);
      output.push({ ruleId: rule.id, locations, flows });
    }
  }
  return output;
}

export function annotation(diagnostic) {
  // Keep valid JSON below GitHub's annotation truncation limit. Retain the
  // primary finding and the source/sink of each retained flow; count omissions.
  const flows = diagnostic.flows.map((flow) =>
    flow.filter((entry, index) => index === 0 || entry !== flow[index - 1]),
  );
  const bounded = {
    ruleId: diagnostic.ruleId,
    locations: [...diagnostic.locations],
    flows,
    omitted: { sourceLocations: 0, flowLocations: 0, flows: 0 },
    consecutiveDuplicates: diagnostic.flows.reduce(
      (sum, flow, index) => sum + flow.length - flows[index].length,
      0,
    ),
  };
  const encode = () =>
    JSON.stringify(bounded).replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
  while (encode().length >= 3400) {
    const interior = bounded.flows.findLast((flow) => flow.length > 2);
    if (interior) {
      interior.splice(interior.length - 2, 1);
      bounded.omitted.flowLocations++;
    } else if (bounded.flows.length > 1) {
      bounded.omitted.flowLocations += bounded.flows.pop().length;
      bounded.omitted.flows++;
    } else if (bounded.locations.length > 1) {
      bounded.locations.pop();
      bounded.omitted.sourceLocations++;
    } else {
      // Validated paths are at most 512 characters, so a primary location and
      // one flow's source/sink always fit. Unexpected inputs must fail safely.
      throw new Error('Diagnostic cannot fit annotation');
    }
  }
  return `::notice title=CodeQL location trace::${encode()}`;
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
      const coverage = {};
      const diagnostics = locationDiagnostics(
        JSON.parse(readFileSync(path.join(directory, name), 'utf8')),
        trackedPaths,
        coverage,
      );
      console.log(`::notice title=CodeQL diagnostic coverage::${JSON.stringify(coverage)}`);
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
