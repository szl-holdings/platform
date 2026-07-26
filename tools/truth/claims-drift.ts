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
const MAX_VARIABLE_MAP_DECODED = 1_024;
const execFileAsync = promisify(execFile);
const UNICODE_DECIMAL = /^\p{Nd}$/u;
const UNICODE_DECIMAL_VALUE_CACHE = new Map<number, number>();

function unicodeDecimalDigitValue(character: string): number | null {
  const codePoint = character.codePointAt(0);
  if (codePoint === undefined || !UNICODE_DECIMAL.test(character)) return null;
  const cached = UNICODE_DECIMAL_VALUE_CACHE.get(codePoint);
  if (cached !== undefined) return cached;

  let runStart = codePoint;
  while (runStart > 0 && UNICODE_DECIMAL.test(String.fromCodePoint(runStart - 1))) runStart -= 1;
  const value = (codePoint - runStart) % 10;
  UNICODE_DECIMAL_VALUE_CACHE.set(codePoint, value);
  return value;
}

export type AllowEntry = { path: string; literal: string };
type WatchwordMatch = RegExpMatchArray & { index: number };
type CanonicalEvidence = { name: string; value: string | null };
type TestCountRole = 'ignored' | 'passed' | 'total';
type SourceAnchor = { lineNumber: number; column: number; scope: string };
type BlockEntry = SourceAnchor & { line: string };
type SourceMapSpan = {
  decodedStart: number;
  decodedEnd: number;
  sourceStart: number;
  sourceEnd: number;
  identity: boolean;
  decodedStride?: number;
  sourceStride?: number;
  variable?: boolean;
};
type DecodedText = {
  text: string;
  sourceText: string;
  sourceLength: number;
  spans: SourceMapSpan[];
};
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
    .replace(/[*_~`{}[\]'"]/g, ' ')
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
  const separator = String.raw`(?:[,;:]|[—–]|\(|\band\b)`;
  const patterns: Array<{ expression: RegExp; roles: [TestCountRole, TestCountRole] }> = [
    {
      expression: new RegExp(
        String.raw`(${number})\s*(?:passing|passed)?\s*(?:\/|(?:out\s+)?of)\s*(${number})\s*(?:total\s+)?(?:platform\s+)?tests?\b(?:\s*(?:passing|passed))?`,
        'gi',
      ),
      roles: ['passed', 'total'],
    },
    {
      expression: new RegExp(
        String.raw`(${number})\s*(?:total\s+)?(?:platform\s+)?tests?\s*(?:(?:in\s+)?total)?\s*${separator}\s*(?:and\s+|of\s+which\s+)?(${number})\s*(?:passing|passed)\b`,
        'gi',
      ),
      roles: ['total', 'passed'],
    },
    {
      expression: new RegExp(
        String.raw`(${number})\s*(?:passing|passed)\s+(?:platform\s+)?tests?\s*${separator}\s*(?:and\s+)?(${number})\s*(?:in\s+)?total\b`,
        'gi',
      ),
      roles: ['passed', 'total'],
    },
    {
      expression: new RegExp(
        String.raw`(${number})\s*(?:passing|passed)\s*${separator}\s*(?:and\s+)?(${number})\s*(?:in\s+)?total\s+(?:platform\s+)?tests?\b`,
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

  const roleForWord = (word: string | undefined): TestCountRole | undefined => {
    if (!word) return undefined;
    if (/^(?:pass|passes|passed|passing|success|successes|successful|succeeded)$/i.test(word)) {
      return 'passed';
    }
    if (/^(?:fail|fails|failed|failing|failure|failures|error|errors)$/i.test(word)) {
      return 'ignored';
    }
    if (/^total$/i.test(word)) return 'total';
    return undefined;
  };
  const roleCandidates: Array<{ offset: number; role: TestCountRole }> = [];
  for (const match of text.matchAll(new RegExp(number, 'g'))) {
    if (typeof match.index !== 'number' || roles.has(match.index)) continue;
    const start = match.index;
    const end = start + match[0].length;
    const before = text.slice(Math.max(0, start - 24), start);
    const after = text.slice(end, Math.min(text.length, end + 24));
    const beforeWord = before.match(/\b([A-Za-z]+)\s*:?\s*$/)?.[1];
    const afterWord = after.match(/^\s*(?:in\s+)?([A-Za-z]+)\b/)?.[1];
    const role = roleForWord(afterWord) ?? roleForWord(beforeWord);
    if (role) roleCandidates.push({ offset: start, role });
  }
  if (roleCandidates.length >= 2 && /\btests?\b/i.test(text)) {
    for (const candidate of roleCandidates) roles.set(candidate.offset, candidate.role);
  }
  return roles;
}

function claimIdentity(
  relative: string,
  literal: string,
  sourceLiteral: string,
  watchword: string,
  qualifier: string,
  role: TestCountRole | undefined,
  structuralScope: string,
): string {
  const normalizedQualifier = normalizeInlineMarkup(qualifier).toLowerCase();
  return createHash('sha256')
    .update(
      [
        relative,
        structuralScope,
        sourceLiteral,
        literal,
        watchword.toLowerCase(),
        normalizedQualifier,
        role ?? '',
      ].join('\0'),
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
  sourceLiteralForRange: (start: number, end: number) => string,
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
    if (compoundRole === 'ignored') continue;
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
    const sourceLiteral = sourceLiteralForRange(literalIndex, literalIndex + literal.length);
    const identity = claimIdentity(
      relative,
      literal,
      sourceLiteral,
      nearest[0],
      qualifier,
      compoundRole,
      anchor.scope,
    );
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

type MarkupToken = {
  start: number;
  end: number;
  kind: 'close' | 'fragment-close' | 'fragment-open' | 'open' | 'self-close';
  tag?: string;
};

function isAsciiLetter(character: string | undefined): boolean {
  if (!character) return false;
  const code = character.charCodeAt(0);
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

function isTagNameCharacter(character: string | undefined): boolean {
  if (!character) return false;
  const code = character.charCodeAt(0);
  return (
    isAsciiLetter(character) ||
    (code >= 48 && code <= 57) ||
    character === '_' ||
    character === '-' ||
    character === ':' ||
    character === '.'
  );
}

function tagEnd(text: string, start: number): number {
  let quote = '';
  for (let index = start; index < text.length; index += 1) {
    const character = text[index] ?? '';
    if (quote) {
      if (character === quote && text[index - 1] !== '\\') quote = '';
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '>') {
      return index + 1;
    }
  }
  return -1;
}

function markupTokenAt(text: string, start: number): MarkupToken | null {
  if (text[start] !== '<' || text.startsWith('<!--', start)) return null;
  if (text.startsWith('</>', start)) {
    return { start, end: start + 3, kind: 'fragment-close' };
  }
  if (text.startsWith('<>', start)) {
    return { start, end: start + 2, kind: 'fragment-open' };
  }

  const closing = text[start + 1] === '/';
  const nameStart = start + (closing ? 2 : 1);
  if (!isAsciiLetter(text[nameStart])) return null;
  let nameEnd = nameStart + 1;
  while (isTagNameCharacter(text[nameEnd])) nameEnd += 1;
  const end = tagEnd(text, nameEnd);
  if (end < 0) return null;
  const tag = text.slice(nameStart, nameEnd);
  if (closing) return { start, end, kind: 'close', tag };
  let marker = end - 2;
  while (marker > nameEnd && /\s/.test(text[marker] ?? '')) marker -= 1;
  return { start, end, kind: text[marker] === '/' ? 'self-close' : 'open', tag };
}

function nextMarkupToken(text: string, start: number): MarkupToken | null {
  let cursor = start;
  while (cursor < text.length) {
    const opening = text.indexOf('<', cursor);
    if (opening < 0) return null;
    if (text.startsWith('<!--', opening)) {
      const commentEnd = text.indexOf('-->', opening + 4);
      cursor = commentEnd < 0 ? text.length : commentEnd + 3;
      continue;
    }
    const token = markupTokenAt(text, opening);
    if (token) return token;
    cursor = opening + 1;
  }
  return null;
}

function staticWhitespaceExpressionEnd(text: string, start: number): number | null {
  if (text[start] !== '{') return null;
  let cursor = start + 1;
  while (/\s/.test(text[cursor] ?? '')) cursor += 1;
  const quote = text[cursor];
  if (quote !== "'" && quote !== '"') return null;
  cursor += 1;
  let content = '';
  while (cursor < text.length) {
    const character = text[cursor] ?? '';
    if (character === '\\') {
      const escaped = text[cursor + 1];
      if (!escaped) return null;
      if (![' ', 't', 'n', 'r'].includes(escaped)) return null;
      content += escaped === ' ' ? ' ' : '\t';
      cursor += 2;
      continue;
    }
    if (character === quote) break;
    content += character;
    cursor += 1;
  }
  if (text[cursor] !== quote || !/^\s*$/.test(content)) return null;
  cursor += 1;
  while (/\s/.test(text[cursor] ?? '')) cursor += 1;
  return text[cursor] === '}' ? cursor + 1 : null;
}

function nextSiblingStart(
  text: string,
  start: number,
  jsx: boolean,
): MarkupToken | { start: number; kind: 'expression' } | null {
  let cursor = start;
  while (cursor < text.length) {
    if (text.startsWith('<!--', cursor)) {
      const commentEnd = text.indexOf('-->', cursor + 4);
      if (commentEnd < 0) return null;
      cursor = commentEnd + 3;
      continue;
    }
    if (jsx && text.startsWith('{/*', cursor)) {
      const commentEnd = text.indexOf('*/}', cursor + 3);
      if (commentEnd < 0) return { start: cursor, kind: 'expression' };
      cursor = commentEnd + 3;
      continue;
    }
    if (jsx && text[cursor] === '{') {
      const staticWhitespaceEnd = staticWhitespaceExpressionEnd(text, cursor);
      if (staticWhitespaceEnd !== null) {
        cursor = staticWhitespaceEnd;
        continue;
      }
    }
    if (jsx && text[cursor] === '{') return { start: cursor, kind: 'expression' };
    if (text[cursor] === '<') return markupTokenAt(text, cursor);
    cursor += 1;
  }
  return null;
}

type SemanticTextNode = {
  start: number;
  end: number;
  text: string;
  barrierBefore: boolean;
};

const BLOCK_TAGS = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'div',
  'dl',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'li',
  'main',
  'nav',
  'ol',
  'p',
  'pre',
  'section',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'ul',
]);

function jsxExpressionEnd(text: string, start: number): number {
  let depth = 0;
  let quote = '';
  for (let cursor = start; cursor < text.length; cursor += 1) {
    const character = text[cursor] ?? '';
    if (quote) {
      if (character === '\\') cursor += 1;
      else if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'" || character === '`') {
      quote = character;
      continue;
    }
    if (text.startsWith('/*', cursor)) {
      const commentEnd = text.indexOf('*/', cursor + 2);
      if (commentEnd < 0) return text.length;
      cursor = commentEnd + 1;
      continue;
    }
    if (text.startsWith('//', cursor)) {
      const commentEnd = text.indexOf('\n', cursor + 2);
      if (commentEnd < 0) return text.length;
      cursor = commentEnd;
      continue;
    }
    if (character === '{') depth += 1;
    else if (character === '}') {
      depth -= 1;
      if (depth === 0) return cursor + 1;
    }
  }
  return text.length;
}

function semanticTextNodes(text: string, jsx: boolean): SemanticTextNode[] {
  const nodes: SemanticTextNode[] = [];
  let cursor = 0;
  let textStart = 0;
  let barrierBefore = false;
  const flushText = (end: number): void => {
    if (end <= textStart) return;
    const visible = normalizeInlineMarkup(decodeNumericEntities(text.slice(textStart, end)).text);
    if (!visible) return;
    nodes.push({ start: textStart, end, text: visible.toLowerCase(), barrierBefore });
    barrierBefore = false;
  };

  while (cursor < text.length) {
    if (text.startsWith('<!--', cursor)) {
      flushText(cursor);
      const commentEnd = text.indexOf('-->', cursor + 4);
      cursor = commentEnd < 0 ? text.length : commentEnd + 3;
      textStart = cursor;
      continue;
    }
    if (jsx && text.startsWith('{/*', cursor)) {
      flushText(cursor);
      const commentEnd = text.indexOf('*/}', cursor + 3);
      cursor = commentEnd < 0 ? text.length : commentEnd + 3;
      textStart = cursor;
      continue;
    }
    if (jsx && text[cursor] === '{') {
      const whitespaceEnd = staticWhitespaceExpressionEnd(text, cursor);
      flushText(cursor);
      if (whitespaceEnd !== null) {
        cursor = whitespaceEnd;
      } else {
        cursor = jsxExpressionEnd(text, cursor);
        barrierBefore = true;
      }
      textStart = cursor;
      continue;
    }
    if (text[cursor] === '<') {
      const token = markupTokenAt(text, cursor);
      if (token) {
        flushText(cursor);
        if (token.tag && BLOCK_TAGS.has(token.tag.toLowerCase()) && nodes.length > 0) {
          barrierBefore = true;
        }
        cursor = token.end;
        textStart = cursor;
        continue;
      }
    }
    cursor += 1;
  }
  flushText(text.length);
  return nodes;
}

function styledClaimRanges(text: string, jsx: boolean): Array<{ start: number; end: number }> {
  const nodes = semanticTextNodes(text, jsx);
  const ranges: Array<{ start: number; end: number }> = [];
  for (const [index, node] of nodes.entries()) {
    if (!/^(?:\d{1,3}(?:,\d{3})+|\d+)$/.test(node.text) || node.barrierBefore) continue;

    const left: SemanticTextNode[] = [];
    for (let cursor = index - 1; cursor >= 0 && left.length < 8; cursor -= 1) {
      const candidate = nodes[cursor];
      if (!candidate) break;
      left.unshift(candidate);
      if (candidate.barrierBefore) break;
    }
    if (!CLAIM_CONTEXT.test(left.map((candidate) => candidate.text).join(' '))) continue;

    let metricNode: SemanticTextNode | undefined;
    for (let cursor = index + 1; cursor < nodes.length && cursor <= index + 8; cursor += 1) {
      const candidate = nodes[cursor];
      if (!candidate || candidate.barrierBefore) break;
      const metricOffset = candidate.text.search(new RegExp(WATCHWORD_SOURCE, 'i'));
      if (metricOffset >= 0 && metricOffset <= 32) {
        metricNode = candidate;
        break;
      }
    }
    const first = left[0];
    if (first && metricNode) ranges.push({ start: first.start, end: metricNode.end });
  }
  return ranges;
}

function markupSiblingSegments(
  text: string,
  relative: string,
): Array<{ text: string; start: number }> {
  if (!['.html', '.tsx'].includes(path.extname(relative))) return [{ text, start: 0 }];
  const segments: Array<{ text: string; start: number }> = [];
  let start = 0;
  let token = nextMarkupToken(text, 0);
  const jsx = path.extname(relative) === '.tsx';
  const continuationRanges = styledClaimRanges(text, jsx);
  while (token) {
    if (['close', 'fragment-close', 'self-close'].includes(token.kind)) {
      const next = nextSiblingStart(text, token.end, jsx);
      const opensSibling = next?.kind === 'open' || next?.kind === 'fragment-open';
      const startsExpression = next?.kind === 'expression';
      if (next && (opensSibling || startsExpression)) {
        const continuesStyledClaim =
          opensSibling &&
          continuationRanges.some((range) => range.start < token.end && range.end > next.start);
        if (startsExpression || !continuesStyledClaim) {
          if (next.start > start) segments.push({ text: text.slice(start, next.start), start });
          start = next.start;
        }
      }
    }
    token = nextMarkupToken(text, token.end);
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

function decodeNumericEntities(text: string): DecodedText {
  const pieces: string[] = [];
  let pieceBuffer = '';
  const spans: SourceMapSpan[] = [];
  let decodedLength = 0;
  let cursor = 0;
  const flushPieces = (): void => {
    if (!pieceBuffer) return;
    pieces.push(pieceBuffer);
    pieceBuffer = '';
  };
  const append = (
    value: string,
    sourceStart: number,
    sourceEnd: number,
    identity: boolean,
  ): void => {
    if (!value) return;
    pieceBuffer += value;
    if (pieceBuffer.length >= 8_192) flushPieces();
    const previous = spans.at(-1);
    if (
      previous?.variable &&
      previous.sourceEnd === sourceStart &&
      previous.decodedEnd === decodedLength &&
      previous.decodedEnd - previous.decodedStart + value.length <= MAX_VARIABLE_MAP_DECODED
    ) {
      previous.decodedEnd += value.length;
      previous.sourceEnd = sourceEnd;
    } else if (
      identity &&
      previous?.identity &&
      !previous.variable &&
      previous.decodedEnd === decodedLength &&
      previous.sourceEnd === sourceStart
    ) {
      previous.decodedEnd += value.length;
      previous.sourceEnd = sourceEnd;
    } else if (!identity && previous && !previous.identity) {
      const decodedStride = previous.decodedStride ?? previous.decodedEnd - previous.decodedStart;
      const sourceStride = previous.sourceStride ?? previous.sourceEnd - previous.sourceStart;
      if (
        previous.decodedEnd === decodedLength &&
        previous.sourceEnd === sourceStart &&
        decodedStride === value.length &&
        sourceStride === sourceEnd - sourceStart
      ) {
        previous.decodedStride = decodedStride;
        previous.sourceStride = sourceStride;
        previous.decodedEnd += value.length;
        previous.sourceEnd = sourceEnd;
      } else {
        const previousLength = previous.decodedEnd - previous.decodedStart;
        if (
          previous.sourceEnd === sourceStart &&
          previous.decodedEnd === decodedLength &&
          previousLength + value.length <= MAX_VARIABLE_MAP_DECODED
        ) {
          previous.decodedEnd += value.length;
          previous.sourceEnd = sourceEnd;
          previous.variable = true;
          previous.decodedStride = undefined;
          previous.sourceStride = undefined;
        } else {
          spans.push({
            decodedStart: decodedLength,
            decodedEnd: decodedLength + value.length,
            sourceStart,
            sourceEnd,
            identity,
          });
        }
      }
    } else if (
      previous &&
      previous.sourceEnd === sourceStart &&
      previous.decodedEnd === decodedLength &&
      previous.decodedEnd - previous.decodedStart + value.length <= MAX_VARIABLE_MAP_DECODED
    ) {
      previous.decodedEnd += value.length;
      previous.sourceEnd = sourceEnd;
      previous.identity = false;
      previous.variable = true;
      previous.decodedStride = undefined;
      previous.sourceStride = undefined;
    } else {
      spans.push({
        decodedStart: decodedLength,
        decodedEnd: decodedLength + value.length,
        sourceStart,
        sourceEnd,
        identity,
      });
    }
    decodedLength += value.length;
  };

  const expression = /&#(?:x([\da-f]+)|(\d+));?|(?![0-9])\p{Nd}/giu;
  for (const match of text.matchAll(expression)) {
    if (typeof match.index !== 'number') continue;
    if (match.index > cursor) {
      append(text.slice(cursor, match.index), cursor, match.index, true);
    }

    const sourceStart = match.index;
    const sourceEnd = sourceStart + match[0].length;
    if (UNICODE_DECIMAL.test(match[0])) {
      const digit = unicodeDecimalDigitValue(match[0]);
      append(
        digit === null ? match[0] : String(digit),
        sourceStart,
        sourceEnd,
        match[0].length === 1,
      );
    } else {
      const value = Number.parseInt(match[1] ?? match[2] ?? '', match[1] ? 16 : 10);
      let replacement = match[0];
      if (Number.isInteger(value) && value >= 0 && value <= 0x10ffff) {
        try {
          const decodedCodePoint = String.fromCodePoint(value);
          const digit = UNICODE_DECIMAL.test(decodedCodePoint)
            ? unicodeDecimalDigitValue(decodedCodePoint)
            : null;
          const decoded = digit === null ? decodedCodePoint : String(digit);
          if (!/[<>{}]/.test(decoded)) replacement = decoded;
        } catch {
          replacement = match[0];
        }
      }
      append(replacement, sourceStart, sourceEnd, replacement.length === match[0].length);
    }
    cursor = sourceEnd;
  }
  if (cursor < text.length) append(text.slice(cursor), cursor, text.length, true);
  flushPieces();
  return { text: pieces.join(''), sourceText: text, sourceLength: text.length, spans };
}

function sourceSpanForDecodedOffset(
  decoded: DecodedText,
  offset: number,
): SourceMapSpan | undefined {
  let low = 0;
  let high = decoded.spans.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    const span = decoded.spans[middle];
    if (!span || span.decodedEnd <= offset) low = middle + 1;
    else high = middle;
  }
  return decoded.spans[low];
}

function variableSourceBounds(
  decoded: DecodedText,
  span: SourceMapSpan,
  offset: number,
): { start: number; end: number } {
  let decodedCursor = span.decodedStart;
  let sourceCursor = span.sourceStart;
  const source = decoded.sourceText.slice(span.sourceStart, span.sourceEnd);
  for (const match of source.matchAll(/&#(?:x([\da-f]+)|(\d+));?|(?![0-9])\p{Nd}/giu)) {
    const relativeStart = match.index ?? 0;
    const matchStart = span.sourceStart + relativeStart;
    if (matchStart > sourceCursor) {
      const identityLength = matchStart - sourceCursor;
      if (offset < decodedCursor + identityLength) {
        const start = sourceCursor + (offset - decodedCursor);
        return { start, end: start + 1 };
      }
      decodedCursor += identityLength;
    }

    const matchEnd = matchStart + match[0].length;
    let replacement = match[0];
    if (UNICODE_DECIMAL.test(match[0])) {
      const digit = unicodeDecimalDigitValue(match[0]);
      if (digit !== null) replacement = String(digit);
    } else {
      const value = Number.parseInt(match[1] ?? match[2] ?? '', match[1] ? 16 : 10);
      if (Number.isInteger(value) && value >= 0 && value <= 0x10ffff) {
        const decodedCodePoint = String.fromCodePoint(value);
        const digit = UNICODE_DECIMAL.test(decodedCodePoint)
          ? unicodeDecimalDigitValue(decodedCodePoint)
          : null;
        const candidate = digit === null ? decodedCodePoint : String(digit);
        if (!/[<>{}]/.test(candidate)) replacement = candidate;
      }
    }
    if (offset < decodedCursor + replacement.length) {
      return replacement.length === match[0].length
        ? {
            start: matchStart + (offset - decodedCursor),
            end: matchStart + (offset - decodedCursor) + 1,
          }
        : { start: matchStart, end: matchEnd };
    }
    decodedCursor += replacement.length;
    sourceCursor = matchEnd;
  }

  const start = Math.min(span.sourceEnd, sourceCursor + Math.max(0, offset - decodedCursor));
  return { start, end: Math.min(span.sourceEnd, start + 1) };
}

function sourceStartForDecodedOffset(decoded: DecodedText, offset: number): number {
  if (offset >= decoded.text.length) return decoded.sourceLength;
  const span = sourceSpanForDecodedOffset(decoded, Math.max(0, offset));
  if (!span) return decoded.sourceLength;
  if (span.variable) return variableSourceBounds(decoded, span, offset).start;
  if (span.identity) return span.sourceStart + Math.max(0, offset - span.decodedStart);
  if (span.decodedStride && span.sourceStride) {
    const unit = Math.floor((offset - span.decodedStart) / span.decodedStride);
    return span.sourceStart + unit * span.sourceStride;
  }
  return span.sourceStart;
}

function sourceEndForDecodedOffset(decoded: DecodedText, offset: number): number {
  if (offset < 0) return 0;
  const span = sourceSpanForDecodedOffset(
    decoded,
    Math.min(offset, Math.max(0, decoded.text.length - 1)),
  );
  if (!span) return decoded.sourceLength;
  if (span.variable) return variableSourceBounds(decoded, span, offset).end;
  if (span.identity) return span.sourceStart + (offset - span.decodedStart) + 1;
  if (span.decodedStride && span.sourceStride) {
    const unit = Math.floor((offset - span.decodedStart) / span.decodedStride);
    return Math.min(span.sourceEnd, span.sourceStart + (unit + 1) * span.sourceStride);
  }
  return span.sourceEnd;
}

export function semanticSourceSpanCount(text: string): number {
  return decodeNumericEntities(text).spans.length;
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
  return markupSiblingSegments(text, relative).flatMap((markupSegment) => {
    const decoded = decodeNumericEntities(markupSegment.text);
    return boundedTextSegments(decoded.text).flatMap((boundedSegment) => {
      const decodedStart = boundedSegment.start;
      return claimFailuresForText(
        relative,
        boundedSegment.text,
        (offset) => {
          const originalOffset = sourceStartForDecodedOffset(decoded, decodedStart + offset);
          return sourceAnchorForOffset(markupSegment.start + originalOffset);
        },
        (start, end) => {
          const originalStart = sourceStartForDecodedOffset(decoded, decodedStart + start);
          const originalEnd = sourceEndForDecodedOffset(
            decoded,
            decodedStart + Math.max(start, end - 1),
          );
          return markupSegment.text.slice(originalStart, originalEnd);
        },
        metrics,
        allowlist,
        baselineClaimIdentities,
        scanState,
        identitySink,
      );
    });
  });
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

function structuralScopesForLines(lines: string[]): string[] {
  const headings: string[] = [];
  const normalized = lines.map((line) => {
    const quote = line.match(/^\s*((?:>\s*)+)([\s\S]*)$/);
    return {
      quoteDepth: quote ? [...quote[1]].filter((character) => character === '>').length : 0,
      text: quote?.[2] ?? line,
    };
  });
  return normalized.map((entry, index) => {
    const markdown = entry.text.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
    const html = entry.text.match(/^\s*<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>\s*$/i);
    const next = normalized[index + 1];
    const setext =
      !markdown && !html && entry.text.trim() && next?.quoteDepth === entry.quoteDepth
        ? next.text.match(/^\s*(=+|-+)\s*$/)
        : null;
    const level =
      markdown?.[1]?.length ??
      (html?.[1]
        ? Number.parseInt(html[1], 10)
        : setext?.[1]?.startsWith('=')
          ? 1
          : setext
            ? 2
            : 0);
    const headingText = normalizeInlineMarkup(
      markdown?.[2] ?? html?.[2] ?? (setext ? entry.text : ''),
    )
      .toLowerCase()
      .trim();
    if (level > 0 && headingText) {
      headings.length = level - 1;
      headings[level - 1] =
        entry.quoteDepth > 0 ? `quote-${entry.quoteDepth}:${headingText}` : headingText;
    }
    const path = headings
      .map((heading, index) => (heading ? `${index + 1}:${heading}` : ''))
      .filter(Boolean)
      .join('/');
    return path || 'document-root';
  });
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
  const structuralScopes = structuralScopesForLines(lines);

  for (const [index, line] of lines.entries()) {
    const scannedLine = line.replace(ordinalHeading, (heading) =>
      heading.replace(/\d+[.)]\s+$/, (ordinal) => ' '.repeat(ordinal.length)),
    );
    for (const failure of claimFailuresForSegmentedText(
      relative,
      scannedLine,
      (offset) => ({
        lineNumber: index + 1,
        column: offset,
        scope: structuralScopes[index] ?? 'document-root',
      }),
      metrics,
      allowlist,
      baselineClaimIdentities,
      scanState,
      identitySink,
    )) {
      failures.add(failure);
    }
  }

  const scanBlock = (block: BlockEntry[]): void => {
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
        const entry = block[selected] ?? block[0];
        return {
          lineNumber: entry?.lineNumber ?? 1,
          column: (entry?.column ?? 0) + offset - (starts[selected] ?? 0),
          scope: entry?.scope ?? 'document-root',
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

  let block: BlockEntry[] = [];
  const overlapFor = (previousBlock: BlockEntry[]): BlockEntry[] => {
    const characterBudget = MAX_PAIR_DISTANCE;
    const overlap: BlockEntry[] = [];
    let size = 0;
    for (let index = previousBlock.length - 1; index >= 0 && size < characterBudget; index -= 1) {
      const entry = previousBlock[index];
      if (!entry) continue;
      const separatorSize = overlap.length > 0 ? 1 : 0;
      const remaining = characterBudget - size - separatorSize;
      if (remaining <= 0) break;
      const decodedEntry = decodeNumericEntities(entry.line);
      if (decodedEntry.text.length <= remaining) {
        overlap.unshift(entry);
        size += decodedEntry.text.length + separatorSize;
        continue;
      }
      const decodedStart = decodedEntry.text.length - remaining;
      const start = sourceStartForDecodedOffset(decodedEntry, decodedStart);
      overlap.unshift({
        ...entry,
        line: entry.line.slice(start),
        column: entry.column + start,
      });
      size += remaining + separatorSize;
      break;
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
      block.push({
        line,
        lineNumber: index + 1,
        column: 0,
        scope: structuralScopes[index] ?? 'document-root',
      });
      continue;
    }
    const previous = block[block.length - 1]?.line ?? '';
    const nextSize = block.reduce((total, entry) => total + entry.line.length + 1, 0) + line.length;
    const joinable = canJoinWrappedLines(previous, line, relative);
    if (joinable && block.length < MAX_BLOCK_LINES && nextSize <= MAX_BLOCK_CHARACTERS) {
      block.push({
        line,
        lineNumber: index + 1,
        column: 0,
        scope: structuralScopes[index] ?? 'document-root',
      });
    } else {
      scanBlock(block);
      block = joinable
        ? [
            ...overlapFor(block),
            {
              line,
              lineNumber: index + 1,
              column: 0,
              scope: structuralScopes[index] ?? 'document-root',
            },
          ]
        : [
            {
              line,
              lineNumber: index + 1,
              column: 0,
              scope: structuralScopes[index] ?? 'document-root',
            },
          ];
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

const FULL_COMMIT_ID = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i;

export function validateImmutableBaselineCandidate(
  candidate: string,
  resolved: string,
  head: string,
  isAncestor: boolean,
): string {
  if (!FULL_COMMIT_ID.test(candidate) || /^0+$/.test(candidate)) {
    throw new Error('immutable allowlist baseline must be a full nonzero commit SHA');
  }
  if (!FULL_COMMIT_ID.test(resolved) || /^0+$/.test(resolved)) {
    throw new Error('immutable allowlist baseline did not resolve to a full commit SHA');
  }
  if (!FULL_COMMIT_ID.test(head) || /^0+$/.test(head)) {
    throw new Error('current HEAD did not resolve to a full commit SHA');
  }
  if (resolved.toLowerCase() === head.toLowerCase()) {
    throw new Error('immutable allowlist baseline must not resolve to current HEAD');
  }
  if (!isAncestor) {
    throw new Error('immutable allowlist baseline must be an ancestor of current HEAD');
  }
  return resolved;
}

export function selectNonHeadBaselineCandidate(
  mergeBase: string,
  head: string,
  firstParent: string | undefined,
): string {
  if (mergeBase.toLowerCase() !== head.toLowerCase()) return mergeBase;
  if (firstParent) return firstParent;
  throw new Error('current HEAD has no immutable ancestor baseline');
}

async function resolveImmutableBaseline(candidate: string, head: string): Promise<string> {
  const resolved = await gitOutput(['rev-parse', '--verify', `${candidate}^{commit}`]);
  let isAncestor = false;
  try {
    await gitOutput(['merge-base', '--is-ancestor', resolved, head]);
    isAncestor = true;
  } catch {
    isAncestor = false;
  }
  return validateImmutableBaselineCandidate(candidate, resolved, head, isAncestor);
}

async function baselineSha(): Promise<string> {
  const head = await gitOutput(['rev-parse', '--verify', 'HEAD^{commit}']);
  const explicit = process.env.TRUTH_ALLOWLIST_BASE_SHA;
  if (explicit) {
    return resolveImmutableBaseline(explicit, head);
  }

  let eventBase: string | undefined;
  if (process.env.GITHUB_EVENT_PATH && existsSync(process.env.GITHUB_EVENT_PATH)) {
    const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8')) as {
      before?: string;
      pull_request?: { base?: { sha?: string } };
    };
    eventBase = event.pull_request?.base?.sha || event.before;
  }
  if (eventBase && !/^0+$/.test(eventBase)) {
    try {
      return await resolveImmutableBaseline(eventBase, head);
    } catch {
      // Event payloads may carry a non-ancestor or the current head. Fall back to the merge base.
    }
  }

  try {
    const mergeBase = await gitOutput(['merge-base', head, 'origin/main']);
    let firstParent: string | undefined;
    if (mergeBase.toLowerCase() === head.toLowerCase()) {
      try {
        firstParent = await gitOutput(['rev-parse', '--verify', `${head}^1`]);
      } catch {
        firstParent = undefined;
      }
    }
    return await resolveImmutableBaseline(
      selectNonHeadBaselineCandidate(mergeBase, head, firstParent),
      head,
    );
  } catch {
    throw new Error(
      'immutable allowlist baseline unavailable; set TRUTH_ALLOWLIST_BASE_SHA to a full ancestor commit SHA or provide origin/main',
    );
  }
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
