import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const TRUTH_FILE = path.join(ROOT, 'artifacts', 'SOURCE_OF_TRUTH.json');
const ALLOWLIST_FILE = path.join(ROOT, '.truth-allowlist');
const NUMBER_LITERAL = /(?<![\w.])(?:\d{1,3}(?:,\d{3})+|\d+)(?![\w.])/g;
const WATCHWORD_SOURCE = String.raw`\b(?:tests|surfaces|packages|endpoints|workflows|spaces|models|datasets|theorems)\b`;
const CLAIM_CONTEXT =
  /\b(?:canonical|current|total|public|passing|passed|locked|monorepo|ci|github actions|hugging face|hf|customer-facing|estate|organization|org)\b/i;
const EXTENSIONS = new Set(['.md', '.html', '.tsx']);
const EXCLUDED = new Set(['.git', 'node_modules', 'dist', 'coverage', 'archive']);

type AllowEntry = { path: string; literal: string };
type WatchwordMatch = RegExpMatchArray & { index: number };

async function walk(directory: string): Promise<string[]> {
  const output: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && EXCLUDED.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...(await walk(absolute)));
    else if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) output.push(absolute);
  }
  return output;
}

async function allowEntries(): Promise<AllowEntry[]> {
  if (!existsSync(ALLOWLIST_FILE)) return [];
  const entries: AllowEntry[] = [];
  for (const [index, raw] of (await readFile(ALLOWLIST_FILE, 'utf8')).split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const [entry, reason] = line.split(/\s+# reason:\s+/, 2);
    if (!reason) throw new Error(`.truth-allowlist:${index + 1} lacks # reason:`);
    const separator = entry.lastIndexOf('|');
    if (separator < 1) throw new Error(`.truth-allowlist:${index + 1} must be path|literal`);
    entries.push({ path: entry.slice(0, separator), literal: entry.slice(separator + 1) });
  }
  return entries;
}

function canonicalFor(
  watchword: string,
  metrics: Record<string, Record<string, unknown>>,
): string | null {
  let value: unknown;
  if (/^surfaces?$/i.test(watchword)) value = metrics.surfaces_customer_facing?.value;
  else if (/^packages?$/i.test(watchword)) value = metrics.monorepo_packages?.value;
  else if (/^endpoints?$/i.test(watchword)) value = metrics.api_endpoints?.value;
  else if (/^workflows?$/i.test(watchword)) value = metrics.ci_workflows?.value;
  else if (/^spaces?$/i.test(watchword)) value = metrics.hf_spaces?.value;
  else if (/^models?$/i.test(watchword)) value = metrics.hf_models?.value;
  else if (/^datasets?$/i.test(watchword)) value = metrics.hf_datasets?.value;
  else if (/^theorems?$/i.test(watchword)) value = metrics.lean_theorems_locked?.value;
  if (/^tests?$/i.test(watchword)) {
    const tests = metrics.platform_tests;
    value = tests?.passed ?? tests?.total;
  }
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : null;
}

function isMetricPair(line: string, literal: RegExpMatchArray, watchword: WatchwordMatch): boolean {
  const literalIndex = literal.index ?? 0;
  const literalEnd = literalIndex + literal[0].length;
  const watchwordIndex = watchword.index;
  const watchwordEnd = watchwordIndex + watchword[0].length;
  const word = watchword[0].toLowerCase();

  if (literalEnd <= watchwordIndex) {
    const modifier = line.slice(literalEnd, watchwordIndex).trim().toLowerCase();
    const allowedModifiers: Record<string, Set<string>> = {
      tests: new Set(['', 'passing', 'passed', 'platform', 'platform passing']),
      surfaces: new Set(['', 'customer-facing', 'public']),
      surface: new Set(['', 'customer-facing', 'public']),
      packages: new Set(['', 'monorepo', 'workspace', 'pnpm workspace']),
      package: new Set(['', 'monorepo', 'workspace', 'pnpm workspace']),
      endpoints: new Set(['', 'api', 'public api']),
      endpoint: new Set(['', 'api', 'public api']),
      workflows: new Set(['', 'ci', 'ci/cd', 'github', 'github actions']),
      workflow: new Set(['', 'ci', 'ci/cd', 'github', 'github actions']),
      spaces: new Set(['', 'public', 'hf', 'hugging face']),
      space: new Set(['', 'public', 'hf', 'hugging face']),
      models: new Set(['', 'public', 'hf', 'hugging face']),
      model: new Set(['', 'public', 'hf', 'hugging face']),
      datasets: new Set(['', 'public', 'hf', 'hugging face']),
      dataset: new Set(['', 'public', 'hf', 'hugging face']),
      theorems: new Set(['', 'locked']),
      theorem: new Set(['', 'locked']),
    };
    return allowedModifiers[word]?.has(modifier) ?? false;
  }

  if (watchwordEnd <= literalIndex) {
    const separator = line.slice(watchwordEnd, literalIndex).trim().toLowerCase();
    return /^(?:\||:|=|is|are|count|total|count:|total:)$/.test(separator);
  }
  return false;
}

async function main(): Promise<void> {
  const truth = JSON.parse(await readFile(TRUTH_FILE, 'utf8')) as {
    metrics: Record<string, Record<string, unknown>>;
  };
  const allowlist = await allowEntries();
  const failures: string[] = [];

  for (const file of await walk(ROOT)) {
    const relative = path.relative(ROOT, file).replaceAll('\\', '/');
    if (relative === 'artifacts/SOURCE_OF_TRUTH.json') continue;
    const lines = (await readFile(file, 'utf8')).split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      if (!CLAIM_CONTEXT.test(line)) continue;
      if (/^\s*#{1,6}\s+\d+[.)]?\s+/.test(line)) continue;
      const watchwords = [...line.matchAll(new RegExp(WATCHWORD_SOURCE, 'gi'))];
      if (watchwords.length === 0) continue;
      for (const match of line.matchAll(NUMBER_LITERAL)) {
        const literal = match[0];
        const nearest = watchwords
          .filter(
            (watchword): watchword is WatchwordMatch =>
              typeof watchword.index === 'number' &&
              isMetricPair(line, match, watchword as WatchwordMatch),
          )
          .sort(
            (left, right) =>
              Math.abs(left.index - (match.index ?? 0)) -
              Math.abs(right.index - (match.index ?? 0)),
          )[0];
        if (!nearest) continue;
        const canonical = canonicalFor(nearest[0], truth.metrics);
        const allowed = allowlist.some((entry) => {
          const wildcardPrefix = entry.path.endsWith('/**')
            ? entry.path.slice(0, -3).replace(/\/$/, '')
            : null;
          const pathMatches =
            wildcardPrefix !== null
              ? relative === wildcardPrefix || relative.startsWith(`${wildcardPrefix}/`)
              : entry.path === relative;
          const literalMatches = entry.literal === '*' || entry.literal === literal;
          return pathMatches && literalMatches;
        });
        if (canonical === null) {
          if (!allowed) {
            failures.push(
              `${relative}:${index + 1}: hardcoded ${literal}; canonical evidence for this context is unavailable`,
            );
          }
          continue;
        }
        if (canonical.replaceAll(',', '') === literal.replaceAll(',', '')) {
          continue;
        }
        if (!allowed) {
          failures.push(
            `${relative}:${index + 1}: hardcoded ${literal}; canonical value for this context is ${canonical}`,
          );
        }
      }
    }
  }

  if (failures.length > 0) {
    for (const failure of failures) process.stderr.write(`${failure}\n`);
    process.exit(1);
  }

  process.stdout.write('claims drift: PASS\n');
}

void main().catch((error: unknown) => {
  process.stderr.write(`claims drift failed: ${String(error)}\n`);
  process.exit(1);
});
