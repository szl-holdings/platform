import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const TRUTH_FILE = path.join(ROOT, 'artifacts', 'SOURCE_OF_TRUTH.json');
const ALLOWLIST_FILE = path.join(ROOT, '.truth-allowlist');
const NUMBER_LITERAL = /(?<![\w.])(?:\d{1,3}(?:,\d{3})+|\d+)(?![\w.])/g;
const WATCHWORD_SOURCE = String.raw`\b(?:tests|surfaces|packages|endpoints|workflows|spaces|models|datasets|theorems)\b`;
const CLAIM_CONTEXT =
  /\b(?:canonical|current|currently|total|public|passing|passed|locked|monorepo|ci|github actions|hugging face|hf|customer-facing|estate|organization|org)\b/i;
const EXTENSIONS = new Set(['.md', '.html', '.tsx']);
const EXCLUDED = new Set(['.git', 'node_modules', 'dist', 'coverage', 'archive']);

export type AllowEntry = { path: string; literal: string };
type WatchwordMatch = RegExpMatchArray & { index: number };
type CanonicalEvidence = { name: string; value: string | null };

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

export function canonicalFor(
  watchword: string,
  metrics: Record<string, Record<string, unknown>>,
): CanonicalEvidence | null {
  let name: string | null = null;
  let value: unknown;
  if (/^surfaces?$/i.test(watchword)) name = 'surfaces_customer_facing';
  else if (/^packages?$/i.test(watchword)) name = 'monorepo_packages';
  else if (/^endpoints?$/i.test(watchword)) name = 'api_endpoints';
  else if (/^workflows?$/i.test(watchword)) name = 'ci_workflows';
  else if (/^spaces?$/i.test(watchword)) name = 'hf_spaces';
  else if (/^models?$/i.test(watchword)) name = 'hf_models';
  else if (/^datasets?$/i.test(watchword)) name = 'hf_datasets';
  else if (/^theorems?$/i.test(watchword)) name = 'lean_theorems_locked';
  if (/^tests?$/i.test(watchword)) {
    name = 'platform_tests';
    const tests = metrics.platform_tests;
    value = tests?.passed ?? tests?.total;
  } else if (name) {
    value = metrics[name]?.value;
  }
  if (!name) return null;
  return {
    name,
    value: typeof value === 'number' && Number.isFinite(value) ? String(value) : null,
  };
}

function isMetricPair(line: string, literal: RegExpMatchArray, watchword: WatchwordMatch): boolean {
  const literalIndex = literal.index ?? 0;
  const literalEnd = literalIndex + literal[0].length;
  const watchwordIndex = watchword.index;
  const watchwordEnd = watchwordIndex + watchword[0].length;
  const word = watchword[0].toLowerCase();

  if (literalEnd <= watchwordIndex) {
    const modifier = line
      .slice(literalEnd, watchwordIndex)
      .trim()
      .toLowerCase()
      .replace(/\b(?:current|currently|total)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
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

function isAllowed(relative: string, literal: string, allowlist: AllowEntry[]): boolean {
  return allowlist.some((entry) => {
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
}

export function claimFailuresForLines(
  relative: string,
  lines: string[],
  metrics: Record<string, Record<string, unknown>>,
  allowlist: AllowEntry[],
): string[] {
  const failures: string[] = [];
  const seen = new Set<string>();
  const scan = (
    line: string,
    index: number,
    secondLineOffset: number | null,
    crossLineOnly = false,
  ): void => {
    if (!CLAIM_CONTEXT.test(line)) return;
    if (/^\s*#{1,6}\s+\d+[.)]?\s+/.test(line)) return;
    const watchwords = [...line.matchAll(new RegExp(WATCHWORD_SOURCE, 'gi'))];
    if (watchwords.length === 0) return;
    for (const match of line.matchAll(NUMBER_LITERAL)) {
      const literal = match[0];
      const nearest = watchwords
        .filter(
          (watchword): watchword is WatchwordMatch =>
            typeof watchword.index === 'number' &&
            (!crossLineOnly ||
              (match.index ?? 0) > (secondLineOffset ?? Number.MAX_SAFE_INTEGER) !==
                watchword.index > (secondLineOffset ?? Number.MAX_SAFE_INTEGER)) &&
            isMetricPair(line, match, watchword as WatchwordMatch),
        )
        .sort(
          (left, right) =>
            Math.abs(left.index - (match.index ?? 0)) - Math.abs(right.index - (match.index ?? 0)),
        )[0];
      if (!nearest) continue;
      const canonical = canonicalFor(nearest[0], metrics);
      if (!canonical) continue;
      if (
        canonical.value !== null &&
        canonical.value.replaceAll(',', '') === literal.replaceAll(',', '')
      ) {
        continue;
      }
      if (!isAllowed(relative, literal, allowlist)) {
        const physicalLine =
          secondLineOffset !== null && (match.index ?? 0) > secondLineOffset
            ? index + 2
            : index + 1;
        const key = `${physicalLine}:${literal}:${canonical.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (canonical.value === null) {
          failures.push(
            `${relative}:${physicalLine}: hardcoded ${literal}; canonical evidence for ${canonical.name} is UNAVAILABLE`,
          );
        } else {
          failures.push(
            `${relative}:${physicalLine}: hardcoded ${literal}; canonical value for this context is ${canonical.value}`,
          );
        }
      }
    }
  };

  for (const [index, line] of lines.entries()) {
    scan(line, index, null);
    const next = lines[index + 1];
    if (
      line.trim() &&
      next?.trim() &&
      !line.trimStart().startsWith('|') &&
      !next.trimStart().startsWith('|')
    ) {
      scan(`${line}\n${next}`, index, line.length, true);
    }
  }
  return failures;
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
    failures.push(...claimFailuresForLines(relative, lines, truth.metrics, allowlist));
  }

  if (failures.length > 0) {
    for (const failure of failures) process.stderr.write(`${failure}\n`);
    process.exit(1);
  }

  process.stdout.write('claims drift: PASS\n');
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]).toLowerCase() : '';
if (invokedPath === fileURLToPath(import.meta.url).toLowerCase()) {
  void main().catch((error: unknown) => {
    process.stderr.write(`claims drift failed: ${String(error)}\n`);
    process.exit(1);
  });
}
