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
  /\b(?:canonical|current|currently|total|public|passing|passed|locked|measured|monorepo|ci|github actions|hugging face|hf|customer-facing|estate|organization|org)\b/i;
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
  qualifier = '',
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
    if (/\b(?:passing|passed)\b/i.test(qualifier)) value = tests?.passed;
    else if (/\btotal\b/i.test(qualifier)) value = tests?.total;
    else value = tests?.passed ?? tests?.total;
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

function claimClause(text: string, literal: RegExpMatchArray): string {
  const start = literal.index ?? 0;
  const end = start + literal[0].length;
  const before = text.slice(0, start);
  const after = text.slice(end);
  const leftCharacters = Math.max(
    before.lastIndexOf('.'),
    before.lastIndexOf('!'),
    before.lastIndexOf('?'),
    before.lastIndexOf(';'),
    before.lastIndexOf('|'),
    before.lastIndexOf(','),
    before.lastIndexOf('('),
    before.lastIndexOf('['),
    before.lastIndexOf('{'),
    before.lastIndexOf('/'),
  );
  let leftWords = -1;
  for (const match of before.matchAll(/\b(?:and|but|of|whereas|while)\b/gi)) {
    leftWords = Math.max(leftWords, (match.index ?? -match[0].length) + match[0].length - 1);
  }

  const rightCharacters = [...after.matchAll(/[.!?;|,()[\]{}/]/g)]
    .map((match) => match.index ?? after.length)
    .sort((left, right) => left - right)[0];
  const rightWord = after.match(/\b(?:and|but|of|whereas|while)\b/i);
  const rightWords = rightWord?.index ?? after.length;
  const right = Math.min(rightCharacters ?? after.length, rightWords);

  return text.slice(Math.max(leftCharacters, leftWords) + 1, end + right);
}

function isRelatedPostpositiveTestCount(
  text: string,
  literal: RegExpMatchArray,
  watchword: WatchwordMatch,
): boolean {
  if (!/^tests?$/i.test(watchword[0])) return false;
  const literalIndex = literal.index ?? 0;
  const literalEnd = literalIndex + literal[0].length;
  const watchwordEnd = watchword.index + watchword[0].length;
  if (watchwordEnd > literalIndex) return false;

  const modifierBefore = text.slice(Math.max(0, literalIndex - 24), literalIndex);
  const modifierAfter = text.slice(literalEnd, Math.min(text.length, literalEnd + 24));
  if (
    !(
      /\b(?:passing|passed|total)\s*:?\s*$/i.test(modifierBefore) ||
      /^\s*(?:passing|passed|total)\b/i.test(modifierAfter)
    )
  ) {
    return false;
  }

  const separator = text.slice(watchwordEnd, literalIndex);
  return /^[\s():]*(?:in\s+total)?[\s():]*$/i.test(separator);
}

function claimFailuresForText(
  relative: string,
  text: string,
  lineNumberForOffset: (offset: number) => number,
  metrics: Record<string, Record<string, unknown>>,
  allowlist: AllowEntry[],
): string[] {
  const failures: string[] = [];
  if (!CLAIM_CONTEXT.test(text)) return failures;
  const watchwords = [...text.matchAll(new RegExp(WATCHWORD_SOURCE, 'gi'))];
  if (watchwords.length === 0) return failures;
  for (const match of text.matchAll(NUMBER_LITERAL)) {
    const literal = match[0];
    const qualifier = claimClause(text, match);
    const nearest = watchwords
      .filter(
        (watchword): watchword is WatchwordMatch =>
          typeof watchword.index === 'number' &&
          (isMetricPair(text, match, watchword as WatchwordMatch) ||
            isRelatedPostpositiveTestCount(text, match, watchword as WatchwordMatch)),
      )
      .sort(
        (left, right) =>
          Math.abs(left.index - (match.index ?? 0)) - Math.abs(right.index - (match.index ?? 0)),
      )[0];
    if (!nearest) continue;
    const canonical = canonicalFor(nearest[0], metrics, qualifier);
    if (!canonical) continue;
    if (
      canonical.value !== null &&
      canonical.value.replaceAll(',', '') === literal.replaceAll(',', '')
    ) {
      continue;
    }
    if (!isAllowed(relative, literal, allowlist)) {
      const lineNumber = lineNumberForOffset(match.index ?? 0);
      if (canonical.value === null) {
        failures.push(
          `${relative}:${lineNumber}: hardcoded ${literal}; canonical evidence for ${canonical.name} is UNAVAILABLE`,
        );
      } else {
        failures.push(
          `${relative}:${lineNumber}: hardcoded ${literal}; canonical value for this context is ${canonical.value}`,
        );
      }
    }
  }
  return failures;
}

function startsStructuralBlock(line: string): boolean {
  return /^(?:#{1,6}\s|[-+*]\s|\d+[.)]\s|\||```|~~~|[{}[\]])/.test(line.trim());
}

function canJoinWrappedLines(current: string, next: string, relative: string): boolean {
  const currentTrimmed = current.trim();
  const nextTrimmed = next.trim();
  if (!currentTrimmed || !nextTrimmed) return false;
  if (/[.!?]\s*$/.test(currentTrimmed)) return false;
  if (currentTrimmed.startsWith('|') || nextTrimmed.startsWith('|')) return false;
  if (startsStructuralBlock(nextTrimmed)) return false;
  if (startsStructuralBlock(currentTrimmed) && /^[{}[\]]/.test(currentTrimmed)) return false;
  if (
    path.extname(relative) === '.tsx' &&
    (/[,;[\]{}()]\s*$/.test(currentTrimmed) ||
      /^(?:const|let|var)\b.*(?:=|[([{])\s*$/.test(currentTrimmed) ||
      /^['"`].*['"`],?\s*$/.test(currentTrimmed) ||
      /^['"`].*['"`],?\s*$/.test(nextTrimmed) ||
      /^[\w$:.~-]+\s*=\s*(?:"[^"]*"|'[^']*'|{.*})[,/>]?\s*$/.test(currentTrimmed) ||
      /^[\w$:.~-]+\s*=\s*(?:"[^"]*"|'[^']*'|{.*})[,/>]?\s*$/.test(nextTrimmed) ||
      /^<\/?[A-Za-z][^>]*>\s*$/.test(currentTrimmed) ||
      /^<\/?[A-Za-z][^>]*>\s*$/.test(nextTrimmed))
  ) {
    return false;
  }
  return true;
}

export function claimFailuresForLines(
  relative: string,
  lines: string[],
  metrics: Record<string, Record<string, unknown>>,
  allowlist: AllowEntry[],
): string[] {
  const failures = new Set<string>();
  const heading = /^\s*#{1,6}\s+\d+[.)]?\s+/;

  for (const [index, line] of lines.entries()) {
    if (heading.test(line)) continue;
    for (const failure of claimFailuresForText(
      relative,
      line,
      () => index + 1,
      metrics,
      allowlist,
    )) {
      failures.add(failure);
    }
  }

  const scanBlock = (block: Array<{ line: string; lineNumber: number }>): void => {
    if (block.length < 2) return;
    const starts: number[] = [];
    let joined = '';
    for (const entry of block) {
      if (joined) joined += ' ';
      starts.push(joined.length);
      joined += entry.line;
    }
    for (const failure of claimFailuresForText(
      relative,
      joined,
      (offset) => {
        let selected = 0;
        for (let index = 1; index < starts.length; index += 1) {
          if ((starts[index] ?? Number.POSITIVE_INFINITY) > offset) break;
          selected = index;
        }
        return block[selected]?.lineNumber ?? block[0]?.lineNumber ?? 1;
      },
      metrics,
      allowlist,
    )) {
      failures.add(failure);
    }
  };

  let block: Array<{ line: string; lineNumber: number }> = [];
  for (const [index, line] of lines.entries()) {
    if (heading.test(line)) {
      scanBlock(block);
      block = [];
      continue;
    }
    if (block.length === 0) {
      block.push({ line, lineNumber: index + 1 });
      continue;
    }
    const previous = block[block.length - 1]?.line ?? '';
    if (canJoinWrappedLines(previous, line, relative)) {
      block.push({ line, lineNumber: index + 1 });
    } else {
      scanBlock(block);
      block = [{ line, lineNumber: index + 1 }];
    }
  }
  scanBlock(block);

  return [...failures];
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
