import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { logger } from '../../lib/logger.js';

export type CodexKind =
  | 'thesis'
  | 'ouroboros'
  | 'formula'
  | 'codex-payload'
  | 'doctrine'
  | 'finding'
  | 'audit'
  | 'manifesto'
  | 'task-brief'
  | 'payload'
  | 'doc';

export interface CodexEntry {
  id: string;
  kind: CodexKind;
  title: string;
  relativePath: string;
  absolutePath: string;
  bytes: number;
  modifiedAt: string;
  tags: string[];
  summary: string;
  snippet: string;
  weight: number;
}

interface ScanRoot {
  dir: string;
  recursive: boolean;
  extensions: string[];
  /** Optional filename keyword filter — if any keyword matches the filename (case-insensitive) we keep the file. */
  keywords?: string[];
  /** Optional max depth (relative to the scan root). */
  maxDepth?: number;
}

const REPO_ROOT = path.resolve(process.cwd().includes('artifacts/api-server') ? path.join(process.cwd(), '..', '..') : process.cwd());

const CORPUS_KEYWORDS = ['thesis', 'ouroboros', 'orbor', 'formula', 'codex', 'finding', 'audit', 'payload', 'mythos', 'manifesto', 'doctrine', 'evolution', 'a11oy', 'alloy', 'rosie', 'apex', 'sentra', 'aegis', 'mythos', 'replit'];

// Scan roots are deliberately restricted to material that is already part of
// the public GitHub repo. We do NOT index .local/* (workspace-only operational
// briefs), node_modules, build artifacts, or any directory that could leak
// secrets/keys/internal-only material.
const SCAN_ROOTS: ScanRoot[] = [
  // Public docs — keyword-filtered to keep build fast.
  { dir: path.join(REPO_ROOT, 'docs'),               recursive: true,  extensions: ['.md', '.mdx'], maxDepth: 5, keywords: CORPUS_KEYWORDS },
  // Public attached assets — keyword-filtered to corpus topics.
  {
    dir: path.join(REPO_ROOT, 'attached_assets'),
    recursive: false,
    extensions: ['.md', '.txt', '.json'],
    keywords: CORPUS_KEYWORDS,
  },
  // Root-level public operating docs (AGENTS.md, replit.md, doctrines, theses).
  { dir: REPO_ROOT, recursive: false, extensions: ['.md'], keywords: ['agents', 'replit', 'architecture', 'audit', 'manifesto', 'doctrine', 'thesis'], maxDepth: 1 },
];

const FILENAME_HINTS: Array<{ test: (s: string) => boolean; kind: CodexKind; weight: number }> = [
  { test: s => /ouroboros|\borbor\b/i.test(s),                     kind: 'ouroboros',     weight: 95 },
  { test: s => /thesis/i.test(s),                                  kind: 'thesis',        weight: 90 },
  { test: s => /\bformula(s)?\b|propeller|lutar|omega/i.test(s),   kind: 'formula',       weight: 88 },
  { test: s => /codex/i.test(s),                                   kind: 'codex-payload', weight: 85 },
  { test: s => /manifesto/i.test(s),                               kind: 'manifesto',     weight: 70 },
  { test: s => /doctrine/i.test(s),                                kind: 'doctrine',      weight: 65 },
  { test: s => /\bfinding(s)?\b|gap[-_ ]report/i.test(s),          kind: 'finding',       weight: 80 },
  { test: s => /\baudit\b|\bsweep\b/i.test(s),                     kind: 'audit',         weight: 60 },
  { test: s => /payload|mythos|evolution/i.test(s),                kind: 'payload',       weight: 55 },
];

function classify(relativePath: string): { kind: CodexKind; weight: number } {
  for (const hint of FILENAME_HINTS) {
    if (hint.test(relativePath)) return { kind: hint.kind, weight: hint.weight };
  }
  return { kind: 'doc', weight: 30 };
}

function deriveTitle(content: string, relativePath: string): string {
  const lines = content.split(/\r?\n/);
  for (const raw of lines.slice(0, 40)) {
    const line = raw.trim();
    if (!line) continue;
    const md = line.match(/^#{1,3}\s+(.+?)\s*#*\s*$/);
    if (md) return md[1].slice(0, 160);
    if (line.length > 4 && line.length < 200 && !line.startsWith('---') && !line.startsWith('```') && !line.startsWith('|')) {
      return line.slice(0, 160);
    }
  }
  return path.basename(relativePath).replace(/\.(md|mdx|txt|json)$/i, '').replace(/[-_]+/g, ' ').slice(0, 160);
}

function deriveSnippet(content: string, max: number = 360): string {
  const stripped = content
    .replace(/^---[\s\S]*?---\s*/m, '')
    .replace(/```[\s\S]*?```/g, '[code]')
    .replace(/^#{1,6}\s+.*$/gm, '')
    .replace(/[*_`>#-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped.length > max ? stripped.slice(0, max) + '…' : stripped;
}

function deriveTags(relativePath: string, content: string): string[] {
  const tagSet = new Set<string>();
  const seg = relativePath.split('/').slice(0, -1).join(' ').toLowerCase();
  for (const t of seg.split(/[\s/_-]+/)) {
    if (t && t.length >= 3 && t.length <= 24 && !/^\d+$/.test(t)) tagSet.add(t);
  }
  for (const kw of ['thesis', 'formula', 'codex', 'ouroboros', 'mythos', 'rosie', 'a11oy', 'alloy', 'sentra', 'aegis', 'counsel', 'terra', 'vessels', 'lyte', 'doctrine', 'manifesto', 'audit', 'finding', 'evolution', 'governance', 'proof', 'attestation', 'routing']) {
    if (new RegExp(`\\b${kw}\\b`, 'i').test(content.slice(0, 2000)) || new RegExp(kw, 'i').test(relativePath)) tagSet.add(kw);
  }
  return [...tagSet].slice(0, 12);
}

function makeId(relativePath: string): string {
  const h = createHash('sha1').update(relativePath).digest('hex').slice(0, 8);
  const slug = relativePath.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return `${slug}-${h}`;
}

async function* walk(rootDir: string, recursive: boolean, maxDepth: number, depth = 0): AsyncIterable<string> {
  let entries: import('node:fs').Dirent[];
  try {
    entries = await fs.readdir(rootDir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    // Exclude every hidden dir (including .local, .git, .replit, .cache, ...).
    // Public-repo material under docs/ and attached_assets/ never starts with a dot.
    if (e.name.startsWith('.')) continue;
    const full = path.join(rootDir, e.name);
    if (e.isDirectory()) {
      if (recursive && depth < maxDepth) yield* walk(full, recursive, maxDepth, depth + 1);
    } else if (e.isFile()) {
      yield full;
    }
  }
}

let CACHE: CodexEntry[] = [];
let CACHE_BY_ID: Map<string, CodexEntry> = new Map();
let lastBuiltAt: string | null = null;
let buildPromise: Promise<void> | null = null;

async function buildIndex(): Promise<void> {
  const t0 = Date.now();
  const out: CodexEntry[] = [];
  let scanned = 0;
  for (const root of SCAN_ROOTS) {
    const maxDepth = root.maxDepth ?? (root.recursive ? 5 : 1);
    for await (const file of walk(root.dir, root.recursive, maxDepth)) {
      scanned++;
      const ext = path.extname(file).toLowerCase();
      if (!root.extensions.includes(ext)) continue;
      const base = path.basename(file).toLowerCase();
      if (root.keywords && !root.keywords.some(k => base.includes(k))) continue;

      let stat: Awaited<ReturnType<typeof fs.stat>>;
      let content: string;
      try {
        stat = await fs.stat(file);
        if (stat.size > 750_000) continue;
        content = await fs.readFile(file, 'utf8');
      } catch {
        continue;
      }
      const relativePath = path.relative(REPO_ROOT, file);
      const { kind, weight } = classify(relativePath);
      const title = deriveTitle(content, relativePath);
      const snippet = deriveSnippet(content, 360);
      const summary = deriveSnippet(content, 140);
      const tags = deriveTags(relativePath, content);
      const id = makeId(relativePath);
      out.push({
        id,
        kind,
        title,
        relativePath,
        absolutePath: file,
        bytes: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        tags,
        summary,
        snippet,
        weight,
      });
    }
  }
  out.sort((a, b) => b.weight - a.weight || a.title.localeCompare(b.title));
  CACHE = out;
  CACHE_BY_ID = new Map(out.map(e => [e.id, e]));
  lastBuiltAt = new Date().toISOString();
  logger.info({ scanned, indexed: out.length, ms: Date.now() - t0 }, '[codex-index] built');
}

export async function ensureIndex(): Promise<void> {
  if (CACHE.length > 0) return;
  if (!buildPromise) buildPromise = buildIndex().catch(e => { logger.error({ err: e }, '[codex-index] build failed'); }).finally(() => { buildPromise = null; });
  await buildPromise;
}

export async function rebuildIndex(): Promise<{ count: number; lastBuiltAt: string }> {
  await buildIndex();
  return { count: CACHE.length, lastBuiltAt: lastBuiltAt! };
}

export async function getCatalog(): Promise<{ entries: CodexEntry[]; total: number; byKind: Record<string, number>; lastBuiltAt: string | null }> {
  await ensureIndex();
  const byKind: Record<string, number> = {};
  for (const e of CACHE) byKind[e.kind] = (byKind[e.kind] ?? 0) + 1;
  return { entries: CACHE, total: CACHE.length, byKind, lastBuiltAt };
}

export async function searchEntries(query: string, kind?: string, limit: number = 80): Promise<CodexEntry[]> {
  await ensureIndex();
  const q = query.trim().toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);
  let pool = CACHE;
  if (kind) pool = pool.filter(e => e.kind === kind);
  if (terms.length === 0) return pool.slice(0, limit);
  const scored: Array<{ e: CodexEntry; s: number }> = [];
  for (const e of pool) {
    const hay = `${e.title} ${e.relativePath} ${e.tags.join(' ')} ${e.snippet}`.toLowerCase();
    let s = 0;
    for (const t of terms) {
      const idxTitle = e.title.toLowerCase().indexOf(t);
      if (idxTitle >= 0) s += 8;
      const idxPath = e.relativePath.toLowerCase().indexOf(t);
      if (idxPath >= 0) s += 4;
      const tagHit = e.tags.some(tg => tg.includes(t));
      if (tagHit) s += 5;
      const snipHit = hay.indexOf(t);
      if (snipHit >= 0) s += 1;
    }
    if (s > 0) scored.push({ e, s: s + e.weight / 25 });
  }
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, limit).map(x => x.e);
}

export async function getEntry(id: string): Promise<CodexEntry | undefined> {
  await ensureIndex();
  return CACHE_BY_ID.get(id);
}

export async function readEntryRaw(id: string, maxBytes: number = 400_000): Promise<{ entry: CodexEntry; content: string; truncated: boolean } | undefined> {
  await ensureIndex();
  const entry = CACHE_BY_ID.get(id);
  if (!entry) return undefined;
  let content: string;
  try {
    content = await fs.readFile(entry.absolutePath, 'utf8');
  } catch {
    return undefined;
  }
  let truncated = false;
  if (content.length > maxBytes) {
    content = content.slice(0, maxBytes);
    truncated = true;
  }
  return { entry, content, truncated };
}

// Index is built lazily on first request via ensureIndex().
