import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const escape = (value) =>
  String(value).replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');

export function safeFindings(report) {
  if (!Array.isArray(report)) throw new Error('Expected a Gitleaks findings array');
  return report.map((finding) => {
    if (
      !finding ||
      typeof finding.RuleID !== 'string' ||
      typeof finding.File !== 'string' ||
      !Number.isSafeInteger(finding.StartLine) ||
      finding.StartLine < 1
    ) {
      throw new Error('Invalid Gitleaks finding metadata');
    }
    return { rule: finding.RuleID, file: finding.File, line: finding.StartLine };
  });
}

export function annotations(findings) {
  return findings
    .map(
      ({ rule, file, line }) =>
        `::error title=Gitleaks finding::${escape(`${rule}: ${file}:${line}`)}`,
    )
    .join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const findings = safeFindings(JSON.parse(readFileSync(process.argv[2], 'utf8')));
    writeFileSync(process.argv[3], `${JSON.stringify(findings, null, 2)}\n`);
    if (findings.length) console.log(annotations(findings));
    console.log(
      `Gitleaks findings: ${findings.length}; only rule, file, and line metadata retained.`,
    );
  } catch {
    // Never echo parser input or scanner errors: they may contain credentials.
    console.error(
      '::error title=Gitleaks diagnostics::Unable to read valid scanner metadata; scan remains failed.',
    );
    process.exitCode = 1;
  }
}
