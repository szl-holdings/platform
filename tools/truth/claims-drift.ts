import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const TRUTH_FILE = path.join(ROOT, 'artifacts', 'SOURCE_OF_TRUTH.json');
const ALLOWLIST_FILE = path.join(ROOT, '.truth-allowlist');
const NUMBER_LITERAL = /(?<![\w.])(?:\d{1,3}(?:,\d{3})+|\d+)(?![\w.])/g;
const WATCHWORD_SOURCE = String.raw`\b(?:tests?|surfaces?|packages?|endpoints?|workflows?|spaces?|models?|datasets?|theorems?)\b`;
const CLAIM_CONTEXT =
  /\b(?:canonical|current|currently|total|public|passing|passed|locked|measured|monorepo|ci|github actions|hugging face|hf|customer-facing|estate|organization|org)\b/i;
const EXTENSIONS = new Set(['.md', '.html', '.tsx']);
const EXCLUDED = new Set(['.git', 'node_modules', 'dist', 'coverage', 'archive']);
const MAX_BLOCK_LINES = 32;
const MAX_BLOCK_CHARACTERS = 16_384;
const MAX_CLAUSE_CHARACTERS = 256;
const MAX_PAIR_DISTANCE = 256;
const MAX_BLOCK_OVERLAP_LINES = 4;
const execFileAsync = promisify(execFile);

export type AllowEntry = { path: string; literal: string };
type WatchwordMatch = RegExpMatchArray & { index: number };
type CanonicalEvidence = { name: string; value: string | null };
type TestCountRole = 'passed' | 'total';
type SourceAnchor = { lineNumber: number; column: number };
type ClaimScanState = {
  seenOccurrences: Set<string>;
  identityCounts: Map<string, number>;
};

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

function normalizeInlineMarkup(value: string): string {
  return value
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/?[A-Za-z][^>]*>/g, ' ')
    .replace(/\]\([^)\r\n]*\)/g, ' ')
    .replace(/[*_~`{}[\]]/g, ' ')
    .replace(/&(?:[A-Za-z][\w-]*|#\d+|#x[\da-f]+);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isMetricPair(line: string, literal: RegExpMatchArray, watchword: WatchwordMatch): boolean {
  const literalIndex = literal.index ?? 0;
  const literalEnd = literalIndex + literal[0].length;
  const watchwordIndex = watchword.index;
  const watchwordEnd = watchwordIndex + watchword[0].length;
  const word = watchword[0].toLowerCase();

  if (literalEnd <= watchwordIndex) {
    const modifier = normalizeInlineMarkup(line.slice(literalEnd, watchwordIndex))
      .toLowerCase()
      .replace(/\b(?:current|currently|total)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const allowedModifiers: Record<string, Set<string>> = {
      tests: new Set(['', 'passing', 'passed', 'platform', 'platform passing']),
      test: new Set(['', 'passing', 'passed', 'platform', 'platform passing']),
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
    if (
      word === 'test' &&
      !/^\s*(?:$|[.,;:!?)]|\b(?:passing|passed|total)\b)/i.test(line.slice(watchwordEnd))
    ) {
      return false;
    }
    return allowedModifiers[word]?.has(modifier) ?? false;
  }

  if (watchwordEnd <= literalIndex) {
    const separator = normalizeInlineMarkup(line.slice(watchwordEnd, literalIndex)).toLowerCase();
    if (!/^(?:\||:|is|are|count|total|count:|total:)$/.test(separator)) return false;
    if (separator === '|') {
      const cellStart = line.lastIndexOf('|', Math.max(0, watchwordIndex - 1));
      const prefix = normalizeInlineMarkup(line.slice(cellStart + 1, watchwordIndex))
        .toLowerCase()
        .replace(/\b(?:current|currently|total)\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      const allowedPrefixes: Record<string, Set<string>> = {
        tests: new Set(['', 'platform', 'platform passing', 'passing', 'passed']),
        test: new Set(['', 'platform', 'platform passing', 'passing', 'passed']),
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
      return allowedPrefixes[word]?.has(prefix) ?? false;
    }
    return true;
  }
  return false;
}

function pathMatchesAllowEntry(relative: string, entry: AllowEntry): boolean {
  const wildcardPrefix = entry.path.endsWith('/**')
    ? entry.path.slice(0, -3).replace(/\/$/, '')
    : null;
  return wildcardPrefix !== null
    ? relative === wildcardPrefix || relative.startsWith(`${wildcardPrefix}/`)
    : entry.path === relative;
}

function isAllowed(
  relative: string,
  literal: string,
  identity: string,
  occurrence: number,
  allowlist: AllowEntry[],
  baselineClaimIdentities: ReadonlyMap<string, number>,
): boolean {
  return (
    (baselineClaimIdentities.get(identity) ?? 0) >= occurrence &&
    allowlist.some((entry) => {
      const literalMatches = entry.literal === '*' || entry.literal === literal;
      return pathMatchesAllowEntry(relative, entry) && literalMatches;
    })
  );
}

function claimClause(text: string, literal: RegExpMatchArray): string {
  const start = literal.index ?? 0;
  const end = start + literal[0].length;
  const beforeStart = Math.max(0, start - MAX_CLAUSE_CHARACTERS);
  const before = text.slice(beforeStart, start);
  const after = text.slice(end, Math.min(text.length, end + MAX_CLAUSE_CHARACTERS));
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

  return text.slice(beforeStart + Math.max(leftCharacters, leftWords) + 1, end + right);
}

function compoundTestRoles(text: string): Map<number, TestCountRole> {
  const roles = new Map<number, TestCountRole>();
  const number = String.raw`(?:\d{1,3}(?:,\d{3})+|\d+)`;
  const patterns: Array<{ expression: RegExp; roles: [TestCountRole, TestCountRole] }> = [
    {
      expression: new RegExp(
        String.raw`(${number})\s*(?:passing|passed)?\s*(?:\/|(?:out\s+)?of)\s*(${number})\s*(?:total\s+)?tests?\b(?:\s*(?:passing|passed))?`,
        'gi',
      ),
      roles: ['passed', 'total'],
    },
    {
      expression: new RegExp(
        String.raw`(${number})\s*(?:total\s+)?tests?\s*(?:(?:in\s+)?total)?\s*(?:[,;:]|\(|\band\b)\s*(?:and\s+|of\s+which\s+)?(${number})\s*(?:passing|passed)\b`,
        'gi',
      ),
      roles: ['total', 'passed'],
    },
    {
      expression: new RegExp(
        String.raw`(${number})\s*(?:passing|passed)\s+tests?\s*(?:[,;]|\band\b)\s*(?:and\s+)?(${number})\s*(?:in\s+)?total\b`,
        'gi',
      ),
      roles: ['passed', 'total'],
    },
    {
      expression: new RegExp(
        String.raw`(${number})\s*(?:passing|passed)\s*(?:[,;]|\band\b)\s*(?:and\s+)?(${number})\s*(?:in\s+)?total\s+tests?\b`,
        'gi',
      ),
      roles: ['passed', 'total'],
    },
    {
      expression: new RegExp(
        String.raw`(${number})\s+tests?\s+(?:passing|passed)\s+(?:out\s+of|\/)\s+(${number})\s*(?:in\s+)?total(?:\s+tests?)?\b`,
        'gi',
      ),
      roles: ['passed', 'total'],
    },
  ];

  for (const { expression, roles: pairRoles } of patterns) {
    for (const match of text.matchAll(expression)) {
      const first = match[1];
      const second = match[2];
      if (!first || !second || typeof match.index !== 'number') continue;
      const firstOffset = match.index + match[0].indexOf(first);
      const secondOffset =
        match.index + match[0].indexOf(second, match[0].indexOf(first) + first.length);
      roles.set(firstOffset, pairRoles[0]);
      roles.set(secondOffset, pairRoles[1]);
    }
  }
  return roles;
}

function claimIdentity(
  relative: string,
  literal: string,
  watchword: string,
  qualifier: string,
  role: TestCountRole | undefined,
): string {
  const normalizedQualifier = normalizeInlineMarkup(qualifier).toLowerCase();
  return createHash('sha256')
    .update(
      [relative, literal, watchword.toLowerCase(), normalizedQualifier, role ?? ''].join('\0'),
    )
    .digest('hex');
}

function lowerBoundByIndex(matches: WatchwordMatch[], target: number): number {
  let low = 0;
  let high = matches.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if ((matches[middle]?.index ?? Number.POSITIVE_INFINITY) < target) low = middle + 1;
    else high = middle;
  }
  return low;
}

function isOrdinalLiteral(text: string, literal: RegExpMatchArray): boolean {
  const start = literal.index ?? 0;
  const end = start + literal[0].length;
  const before = text.slice(Math.max(0, start - 2), start);
  const after = text.slice(end, Math.min(text.length, end + 3));
  return (
    (/[(]\s*$/.test(before) && /^\s*[)](?:\s|$)/.test(after)) ||
    (/(?:^|\s)\s*$/.test(before) && /^\s*[.)]\s/.test(after)) ||
    /\b(?:tier|phase|step|wave|task|version|v)\s*$/i.test(
      text.slice(Math.max(0, start - 16), start),
    )
  );
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
  sourceAnchorForOffset: (offset: number) => SourceAnchor,
  metrics: Record<string, Record<string, unknown>>,
  allowlist: AllowEntry[],
  baselineClaimIdentities: ReadonlyMap<string, number>,
  scanState: ClaimScanState,
  identitySink?: Map<string, number>,
): string[] {
  const failures: string[] = [];
  if (!CLAIM_CONTEXT.test(text)) return failures;
  const watchwords = [...text.matchAll(new RegExp(WATCHWORD_SOURCE, 'gi'))];
  if (watchwords.length === 0) return failures;
  const compoundRoles = compoundTestRoles(text);
  for (const match of text.matchAll(NUMBER_LITERAL)) {
    if (isOrdinalLiteral(text, match)) continue;
    const literal = match[0];
    const qualifier = claimClause(text, match);
    const literalIndex = match.index ?? 0;
    const compoundRole = compoundRoles.get(literalIndex);
    const insertion = lowerBoundByIndex(watchwords as WatchwordMatch[], literalIndex);
    const nearby = (watchwords as WatchwordMatch[]).slice(
      Math.max(0, insertion - 8),
      Math.min(watchwords.length, insertion + 8),
    );
    const nearest = nearby
      .filter((watchword) => {
        if (Math.abs(watchword.index - literalIndex) > MAX_PAIR_DISTANCE) return false;
        if (compoundRole && /^tests?$/i.test(watchword[0])) return true;
        return (
          isMetricPair(text, match, watchword) ||
          isRelatedPostpositiveTestCount(text, match, watchword)
        );
      })
      .sort(
        (left, right) => Math.abs(left.index - literalIndex) - Math.abs(right.index - literalIndex),
      )[0];
    if (!nearest) continue;
    const canonical = canonicalFor(
      nearest[0],
      metrics,
      compoundRole === 'passed' ? 'passing' : compoundRole === 'total' ? 'total' : qualifier,
    );
    if (!canonical) continue;
    const anchor = sourceAnchorForOffset(literalIndex);
    const identity = claimIdentity(relative, literal, nearest[0], qualifier, compoundRole);
    const occurrenceKey = [identity, String(anchor.lineNumber), String(anchor.column)].join('\0');
    if (scanState.seenOccurrences.has(occurrenceKey)) continue;
    scanState.seenOccurrences.add(occurrenceKey);
    const occurrence = (scanState.identityCounts.get(identity) ?? 0) + 1;
    scanState.identityCounts.set(identity, occurrence);
    identitySink?.set(identity, occurrence);
    if (
      canonical.value !== null &&
      canonical.value.replaceAll(',', '') === literal.replaceAll(',', '')
    ) {
      continue;
    }
    if (!isAllowed(relative, literal, identity, occurrence, allowlist, baselineClaimIdentities)) {
      if (canonical.value === null) {
        failures.push(
          `${relative}:${anchor.lineNumber}: hardcoded ${literal}; canonical evidence for ${canonical.name} is UNAVAILABLE`,
        );
      } else {
        failures.push(
          `${relative}:${anchor.lineNumber}: hardcoded ${literal}; canonical value for this context is ${canonical.value}`,
        );
      }
    }
  }
  return failures;
}

function markupSiblingSegments(
  text: string,
  relative: string,
): Array<{ text: string; start: number }> {
  if (!['.html', '.tsx'].includes(path.extname(relative))) return [{ text, start: 0 }];
  const segments: Array<{ text: string; start: number }> = [];
  const boundary = /(?:<\/[A-Za-z][\w:.-]*>|\/>)\s*(?=<[A-Za-z])/g;
  let start = 0;
  for (const match of text.matchAll(boundary)) {
    if (typeof match.index !== 'number') continue;
    const end = match.index + match[0].length;
    if (end > start) segments.push({ text: text.slice(start, end), start });
    start = end;
  }
  if (start < text.length) segments.push({ text: text.slice(start), start });
  return segments.length > 0 ? segments : [{ text, start: 0 }];
}

function boundedTextSegments(text: string): Array<{ text: string; start: number }> {
  if (text.length <= MAX_BLOCK_CHARACTERS) return [{ text, start: 0 }];
  const stride = MAX_BLOCK_CHARACTERS - MAX_PAIR_DISTANCE;
  const segments: Array<{ text: string; start: number }> = [];
  for (let start = 0; start < text.length; start += stride) {
    segments.push({
      text: text.slice(start, Math.min(text.length, start + MAX_BLOCK_CHARACTERS)),
      start,
    });
  }
  return segments;
}

function decodeNumericEntities(text: string): { text: string; originalOffsets: number[] } {
  const originalOffsets: number[] = [];
  let decoded = '';
  let cursor = 0;
  const expression = /&#(?:x([\da-f]+)|(\d+));/gi;
  for (const match of text.matchAll(expression)) {
    if (typeof match.index !== 'number') continue;
    for (let index = cursor; index < match.index; index += 1) {
      decoded += text[index] ?? '';
      originalOffsets.push(index);
    }
    const value = Number.parseInt(match[1] ?? match[2] ?? '', match[1] ? 16 : 10);
    let replacement = match[0];
    if (Number.isInteger(value) && value >= 0 && value <= 0x10ffff) {
      try {
        replacement = String.fromCodePoint(value);
      } catch {
        replacement = match[0];
      }
    }
    decoded += replacement;
    for (let index = 0; index < replacement.length; index += 1) {
      originalOffsets.push(match.index);
    }
    cursor = match.index + match[0].length;
  }
  for (let index = cursor; index < text.length; index += 1) {
    decoded += text[index] ?? '';
    originalOffsets.push(index);
  }
  return { text: decoded, originalOffsets };
}

function claimFailuresForSegmentedText(
  relative: string,
  text: string,
  sourceAnchorForOffset: (offset: number) => SourceAnchor,
  metrics: Record<string, Record<string, unknown>>,
  allowlist: AllowEntry[],
  baselineClaimIdentities: ReadonlyMap<string, number>,
  scanState: ClaimScanState,
  identitySink?: Map<string, number>,
): string[] {
  return markupSiblingSegments(text, relative).flatMap((markupSegment) =>
    boundedTextSegments(markupSegment.text).flatMap((boundedSegment) => {
      const decoded = decodeNumericEntities(boundedSegment.text);
      return claimFailuresForText(
        relative,
        decoded.text,
        (offset) => {
          const originalOffset = decoded.originalOffsets[offset] ?? boundedSegment.text.length;
          return sourceAnchorForOffset(markupSegment.start + boundedSegment.start + originalOffset);
        },
        metrics,
        allowlist,
        baselineClaimIdentities,
        scanState,
        identitySink,
      );
    }),
  );
}

function startsStructuralBlock(line: string): boolean {
  return /^(?:#{1,6}\s|[-+*]\s|\d+[.)]\s|\||```|~~~|[{}[\]])/.test(line.trim());
}

function isCompleteElementLine(line: string): boolean {
  const trimmed = line.trim();
  const opening = trimmed.match(/^<([A-Za-z][\w:.-]*)\b[^>]*>/);
  return Boolean(opening && new RegExp(String.raw`</${opening[1]}>\s*[,;]?$`).test(trimmed));
}

function isCompleteMarkdownInlineLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    (/^\*\*[^*]+:\*\*/.test(trimmed) ||
      /^\*\*[\s\S]*\*\*$/.test(trimmed) ||
      /^__[\s\S]*__$/.test(trimmed) ||
      /^`[^`]+`$/.test(trimmed)) &&
    !/[.!?]\s*$/.test(trimmed)
  );
}

function canJoinWrappedLines(current: string, next: string, relative: string): boolean {
  const currentTrimmed = current.trim();
  const nextTrimmed = next.trim();
  if (!currentTrimmed || !nextTrimmed) return false;
  if (/[.!?]\s*$/.test(currentTrimmed)) return false;
  if (currentTrimmed.startsWith('>') || nextTrimmed.startsWith('>')) return false;
  if (currentTrimmed.startsWith('|') || nextTrimmed.startsWith('|')) return false;
  if (isCompleteMarkdownInlineLine(currentTrimmed) || isCompleteMarkdownInlineLine(nextTrimmed)) {
    return false;
  }
  if (startsStructuralBlock(nextTrimmed)) return false;
  if (startsStructuralBlock(currentTrimmed) && /^[{}[\]]/.test(currentTrimmed)) return false;
  if (
    ['.html', '.tsx'].includes(path.extname(relative)) &&
    ((isCompleteElementLine(currentTrimmed) && isCompleteElementLine(nextTrimmed)) ||
      /^<\/?[A-Za-z][^>]*>\s*$/.test(currentTrimmed) ||
      /^<\/?[A-Za-z][^>]*>\s*$/.test(nextTrimmed))
  ) {
    return false;
  }
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
  baselineClaimIdentities: ReadonlyMap<string, number> = new Map(),
  identitySink?: Map<string, number>,
): string[] {
  const failures = new Set<string>();
  const ordinalHeading = /^\s*#{1,6}\s+\d+[.)]\s+/;
  const scanState: ClaimScanState = {
    seenOccurrences: new Set(),
    identityCounts: new Map(),
  };

  for (const [index, line] of lines.entries()) {
    const scannedLine = line.replace(ordinalHeading, (heading) =>
      heading.replace(/\d+[.)]\s+$/, (ordinal) => ' '.repeat(ordinal.length)),
    );
    for (const failure of claimFailuresForSegmentedText(
      relative,
      scannedLine,
      (offset) => ({ lineNumber: index + 1, column: offset }),
      metrics,
      allowlist,
      baselineClaimIdentities,
      scanState,
      identitySink,
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
    for (const failure of claimFailuresForSegmentedText(
      relative,
      joined,
      (offset) => {
        let selected = 0;
        for (let index = 1; index < starts.length; index += 1) {
          if ((starts[index] ?? Number.POSITIVE_INFINITY) > offset) break;
          selected = index;
        }
        return {
          lineNumber: block[selected]?.lineNumber ?? block[0]?.lineNumber ?? 1,
          column: offset - (starts[selected] ?? 0),
        };
      },
      metrics,
      allowlist,
      baselineClaimIdentities,
      scanState,
      identitySink,
    )) {
      failures.add(failure);
    }
  };

  let block: Array<{ line: string; lineNumber: number }> = [];
  const overlapFor = (
    previousBlock: Array<{ line: string; lineNumber: number }>,
    nextLine: string,
  ): Array<{ line: string; lineNumber: number }> => {
    const characterBudget = Math.min(
      MAX_PAIR_DISTANCE,
      Math.max(0, MAX_BLOCK_CHARACTERS - nextLine.length - 1),
    );
    const overlap: Array<{ line: string; lineNumber: number }> = [];
    let size = 0;
    for (
      let index = previousBlock.length - 1;
      index >= 0 && overlap.length < MAX_BLOCK_OVERLAP_LINES;
      index -= 1
    ) {
      const entry = previousBlock[index];
      if (!entry) continue;
      const entrySize = entry.line.length + (overlap.length > 0 ? 1 : 0);
      if (size + entrySize > characterBudget) break;
      overlap.unshift(entry);
      size += entrySize;
    }
    return overlap;
  };
  for (const [index, line] of lines.entries()) {
    if (ordinalHeading.test(line)) {
      scanBlock(block);
      block = [];
      continue;
    }
    if (block.length === 0) {
      block.push({ line, lineNumber: index + 1 });
      continue;
    }
    const previous = block[block.length - 1]?.line ?? '';
    const nextSize = block.reduce((total, entry) => total + entry.line.length + 1, 0) + line.length;
    const joinable = canJoinWrappedLines(previous, line, relative);
    if (joinable && block.length < MAX_BLOCK_LINES && nextSize <= MAX_BLOCK_CHARACTERS) {
      block.push({ line, lineNumber: index + 1 });
    } else {
      scanBlock(block);
      block = joinable
        ? [...overlapFor(block, line), { line, lineNumber: index + 1 }]
        : [{ line, lineNumber: index + 1 }];
    }
  }
  scanBlock(block);

  return [...failures];
}

export function claimIdentitiesForLines(
  relative: string,
  lines: string[],
  metrics: Record<string, Record<string, unknown>>,
): Map<string, number> {
  const identities = new Map<string, number>();
  claimFailuresForLines(relative, lines, metrics, [], new Map(), identities);
  return identities;
}

async function gitOutput(arguments_: string[]): Promise<string> {
  const gitBinary = process.env.GIT_BINARY || 'git';
  const { stdout } = await execFileAsync(gitBinary, arguments_, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  return stdout.trim();
}

export function selectImmutableBaseline(
  explicit: string | undefined,
  eventBase: string | undefined,
  mergeBase: string | undefined,
): string {
  for (const candidate of [explicit, eventBase, mergeBase]) {
    if (candidate && !/^0+$/.test(candidate)) return candidate;
  }
  throw new Error(
    'immutable allowlist baseline unavailable; set TRUTH_ALLOWLIST_BASE_SHA or provide origin/main',
  );
}

async function baselineSha(): Promise<string> {
  let eventBase: string | undefined;
  if (process.env.GITHUB_EVENT_PATH && existsSync(process.env.GITHUB_EVENT_PATH)) {
    const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8')) as {
      before?: string;
      pull_request?: { base?: { sha?: string } };
    };
    eventBase = event.pull_request?.base?.sha || event.before;
  }
  let mergeBase: string | undefined;
  try {
    mergeBase = await gitOutput(['merge-base', 'HEAD', 'origin/main']);
  } catch {
    mergeBase = undefined;
  }
  return selectImmutableBaseline(process.env.TRUTH_ALLOWLIST_BASE_SHA, eventBase, mergeBase);
}

async function main(): Promise<void> {
  const truth = JSON.parse(await readFile(TRUTH_FILE, 'utf8')) as {
    metrics: Record<string, Record<string, unknown>>;
  };
  const allowlist = await allowEntries();
  const failures: string[] = [];
  const base = await baselineSha();
  const changedPaths = new Set(
    (await gitOutput(['diff', '--name-only', base, '--']))
      .split(/\r?\n/)
      .filter(Boolean)
      .map((entry) => entry.replaceAll('\\', '/')),
  );

  for (const file of await walk(ROOT)) {
    const relative = path.relative(ROOT, file).replaceAll('\\', '/');
    if (relative === 'artifacts/SOURCE_OF_TRUTH.json') continue;
    const lines = (await readFile(file, 'utf8')).split(/\r?\n/);
    let baselineClaimIdentities = new Map<string, number>();
    if (allowlist.some((entry) => pathMatchesAllowEntry(relative, entry))) {
      if (!changedPaths.has(relative)) {
        baselineClaimIdentities = claimIdentitiesForLines(relative, lines, truth.metrics);
      } else {
        try {
          const baselineText = await gitOutput(['show', `${base}:${relative}`]);
          baselineClaimIdentities = claimIdentitiesForLines(
            relative,
            baselineText.split(/\r?\n/),
            truth.metrics,
          );
        } catch {
          baselineClaimIdentities = new Map();
        }
      }
    }
    failures.push(
      ...claimFailuresForLines(relative, lines, truth.metrics, allowlist, baselineClaimIdentities),
    );
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
