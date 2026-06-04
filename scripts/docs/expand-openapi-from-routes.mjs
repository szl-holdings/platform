#!/usr/bin/env node
/**
 * expand-openapi-from-routes.mjs
 *
 * Walks artifacts/api-server/src/routes/**.ts, extracts every
 * `router.{get,post,put,patch,delete}("/path", ...)` call, derives the full
 * mount prefix from routes/index.ts + routes/groups/*.ts, and APPENDS minimal
 * OpenAPI path stubs to lib/api-spec/openapi.yaml for any path/method tuple
 * that is not already present.
 *
 * The stubs are deliberately minimal (operationId + tag + summary +
 * "200 OK" response) so the catalogue can advertise full surface coverage
 * while richer schemas continue to be authored by hand.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, } from 'node:fs';
import { dirname, join, basename, } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..');

const ROUTES_DIR = join(ROOT, 'artifacts', 'api-server', 'src', 'routes');
const SPEC_PATH = join(ROOT, 'lib', 'api-spec', 'openapi.yaml');

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];

// ─── 1. Walk all .ts files under routes/, skipping tests + index.ts + groups/
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === '__tests__' || entry === 'groups') continue;
      out.push(...walk(full));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts') && entry !== 'index.ts') {
      out.push(full);
    }
  }
  return out;
}

const routeFiles = walk(ROUTES_DIR);

// ─── 2. Parse routes/index.ts + routes/groups/*.ts to build basename → prefix
const mountMap = new Map(); // basename (no .ts) → array of prefixes

function recordMount(basenameNoExt, prefix) {
  if (!basenameNoExt || !prefix) return;
  const arr = mountMap.get(basenameNoExt) ?? [];
  if (!arr.includes(prefix)) arr.push(prefix);
  mountMap.set(basenameNoExt, arr);
}

const indexSrc = readFileSync(join(ROUTES_DIR, 'index.ts'), 'utf8');
const groupFiles = readdirSync(join(ROUTES_DIR, 'groups'))
  .filter((f) => f.endsWith('.ts'))
  .map((f) => join(ROUTES_DIR, 'groups', f));

const allMountSrc = [indexSrc, ...groupFiles.map((f) => readFileSync(f, 'utf8'))].join('\n');

// Pattern A: lazyMatch("/prefix", () => import("./filename"), ...)
//            lazyMatch(["/p1","/p2"], () => import("./filename"), ...)
const lazyMatchRe = /lazyMatch\(\s*(\[[^\]]+\]|["'`][^"'`]+["'`])\s*,\s*\(\)\s*=>\s*import\(["'`]\.{1,2}\/([^"'`]+)["'`]\)/g;
let m;
while ((m = lazyMatchRe.exec(allMountSrc)) !== null) {
  const prefixesRaw = m[1];
  const importPath = m[2].replace(/\.js$/, '');
  const fileBase = basename(importPath);
  const prefixes = prefixesRaw.startsWith('[')
    ? [...prefixesRaw.matchAll(/["'`]([^"'`]+)["'`]/g)].map((mm) => mm[1])
    : [prefixesRaw.replace(/^["'`]|["'`]$/g, '')];
  for (const p of prefixes) recordMount(fileBase, p);
}

// Pattern B: router.use("/prefix", ..., lazyMount(() => import("./filename"), ...))
//            and the standalone "/prefix" near a lazyMount on the same statement.
const lazyMountRe = /router\.use\(\s*["'`]([^"'`]+)["'`][\s\S]*?lazyMount\(\s*\(\)\s*=>\s*import\(["'`]\.{1,2}\/([^"'`]+)["'`]\)/g;
while ((m = lazyMountRe.exec(allMountSrc)) !== null) {
  const prefix = m[1];
  const importPath = m[2].replace(/\.js$/, '');
  const fileBase = basename(importPath);
  recordMount(fileBase, prefix);
}

// Pattern C: router.use(lazyMatch(...)) is already covered by Pattern A.
// Pattern D: direct app.use('/api/X', someRouter) in app.ts
const appSrc = readFileSync(join(ROOT, 'artifacts', 'api-server', 'src', 'app.ts'), 'utf8');
// Map import name → file basename
const appImportRe = /import\s+(?:\*\s+as\s+)?(\w+)\s+from\s+["'`]\.\/routes\/([^"'`]+)["'`]/g;
const appImports = new Map();
while ((m = appImportRe.exec(appSrc)) !== null) {
  appImports.set(m[1], basename(m[2].replace(/\.js$/, '')));
}
const appUseRe = /app\.use\(\s*["'`](\/api(?:\/[^"'`]*)?)["'`]\s*,\s*(\w+)/g;
while ((m = appUseRe.exec(appSrc)) !== null) {
  const prefix = m[1].replace(/^\/api/, '') || '/';
  const fileBase = appImports.get(m[2]);
  if (fileBase) recordMount(fileBase, prefix === '/' ? '' : prefix);
}

// ─── 3. For each route file extract operations
function extractInnerPrefix(src) {
  // catch leading router.use('/x', ...) that defines a static prefix shared by
  // all router.METHOD calls below, e.g. agent-os.ts uses router.use('/agent-os',…)
  const re = /router\.use\(\s*["'`](\/[a-zA-Z0-9_\-/:]+)["'`]/g;
  const seen = new Set();
  let mm;
  while ((mm = re.exec(src)) !== null) seen.add(mm[1]);
  // Heuristic: a single, distinct inner mount that is NOT '/' becomes the inner prefix.
  if (seen.size === 1) {
    const only = [...seen][0];
    if (only !== '/') return only;
  }
  return '';
}

function joinPath(...parts) {
  const joined = parts
    .map((p) => p || '')
    .map((p) => (p.startsWith('/') || p === '' ? p : `/${p}`))
    .join('')
    .replace(/\/{2,}/g, '/');
  return joined || '/';
}

const operations = []; // { method, path, fileBase, tag }
for (const file of routeFiles) {
  const src = readFileSync(file, 'utf8');
  const fileBase = basename(file).replace(/\.ts$/, '');
  const prefixes = mountMap.get(fileBase) ?? [`/${fileBase}`];
  const innerPrefix = extractInnerPrefix(src);

  for (const method of HTTP_METHODS) {
    const re = new RegExp(`router\\.${method}\\(\\s*["'\\\`]([^"'\\\`]+)["'\\\`]`, 'g');
    let mm;
    while ((mm = re.exec(src)) !== null) {
      const innerPath = mm[1];
      // Skip if inner path is just "/" with prefix already covering it
      for (const prefix of prefixes) {
        // If the inner router.use prefix is already part of innerPath,
        // don't double-prepend it.
        const basePrefix = prefix;
        let path;
        if (innerPrefix && innerPath.startsWith(innerPrefix)) {
          path = joinPath(basePrefix, innerPath);
        } else if (innerPrefix && !innerPath.startsWith(innerPrefix)) {
          // inner router uses an inner prefix; combine
          path = joinPath(basePrefix, innerPrefix, innerPath);
        } else {
          path = joinPath(basePrefix, innerPath);
        }
        // Strip trailing slash unless root
        if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
        operations.push({ method, path, fileBase });
      }
    }
  }
}

// Dedupe (method, path)
const seenOps = new Set();
const uniqueOps = [];
for (const op of operations) {
  const key = `${op.method} ${op.path}`;
  if (seenOps.has(key)) continue;
  seenOps.add(key);
  uniqueOps.push(op);
}

// ─── 4. Load existing spec; figure out what's already covered
const specRaw = readFileSync(SPEC_PATH, 'utf8');
const spec = parse(specRaw);
const existingPaths = spec.paths ?? {};

const existingOpKeys = new Set();
for (const [p, item] of Object.entries(existingPaths)) {
  for (const method of HTTP_METHODS) {
    if (item[method]) existingOpKeys.add(`${method} ${p}`);
  }
}

// Existing tag set
const existingTags = new Set((spec.tags ?? []).map((t) => t.name));

// ─── 5. Build stub YAML for any operation not yet covered.
// IMPORTANT: skip any path that already exists in the spec (even if some
// methods on that path are not yet documented). The hand-authored spec owns
// those path blocks; we only stub net-new paths to avoid YAML duplicate-key
// errors. Path-rewritten Express params ({:id} → {id}) are also normalised
// before the existence check.
function normalisePath(p) {
  return p.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
}
const existingPathSet = new Set(Object.keys(existingPaths));
const missing = uniqueOps.filter(
  (op) =>
    !existingOpKeys.has(`${op.method} ${op.path}`) &&
    !existingPathSet.has(normalisePath(op.path)),
);

// Group missing operations by path so we emit one YAML path block per path
const byPath = new Map();
for (const op of missing) {
  if (!byPath.has(op.path)) byPath.set(op.path, []);
  byPath.get(op.path).push(op);
}

// Tag = file basename (kept stable & predictable for the catalogue grouping)
const newTags = new Set();

function summaryFor(method, path, fileBase) {
  const verb = { get: 'List/get', post: 'Create/invoke', put: 'Update', patch: 'Patch', delete: 'Delete' }[method] ?? method;
  return `[stub] ${verb} ${path} (${fileBase})`;
}

function operationIdFor(method, path, fileBase) {
  // Build a deterministic operationId — fileBase + method + path (sanitised)
  const slug = path
    .replace(/[{}]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `${fileBase.replace(/[^a-zA-Z0-9]+/g, '_')}_${method}_${slug}`.slice(0, 200);
}

function pathParamsFor(path) {
  const params = [...path.matchAll(/{([^}]+)}/g)].map((m) => m[1]);
  if (!params.length) return '';
  let out = '      parameters:\n';
  for (const p of params) {
    out += `        - in: path\n          name: ${p}\n          required: true\n          schema: { type: string }\n`;
  }
  return out;
}

const yamlChunks = [];
yamlChunks.push('');
yamlChunks.push('  # ──────────────────────────────────────────────────────────────────');
yamlChunks.push('  # Auto-generated route stubs (scripts/docs/expand-openapi-from-routes.mjs)');
yamlChunks.push('  # Minimal coverage so the API catalogue reflects the full surface area.');
yamlChunks.push('  # Hand-author richer entries above to override these stubs.');
yamlChunks.push('  # ──────────────────────────────────────────────────────────────────');

for (const [path, ops] of [...byPath.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  yamlChunks.push(`  ${path.includes(':') || path.includes('{') ? JSON.stringify(path) : path}:`);
  // Convert Express-style :param to OpenAPI {param} for spec correctness
  // (we already wrote the original path; rewrite if needed)
  const last = yamlChunks.length - 1;
  if (path.includes(':')) {
    const oapiPath = path.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
    yamlChunks[last] = `  ${JSON.stringify(oapiPath)}:`;
  }
  // Use the rewritten path for params extraction too
  const oapiPath = path.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
  for (const op of ops.sort((a, b) => HTTP_METHODS.indexOf(a.method) - HTTP_METHODS.indexOf(b.method))) {
    const tag = op.fileBase;
    newTags.add(tag);
    yamlChunks.push(`    ${op.method}:`);
    yamlChunks.push(`      operationId: ${operationIdFor(op.method, oapiPath, op.fileBase)}`);
    yamlChunks.push(`      tags: [${tag}]`);
    yamlChunks.push(`      summary: ${JSON.stringify(summaryFor(op.method, oapiPath, op.fileBase))}`);
    const params = pathParamsFor(oapiPath);
    if (params) yamlChunks.push(params.trimEnd());
    yamlChunks.push('      responses:');
    yamlChunks.push('        "200":');
    yamlChunks.push('          description: OK');
    yamlChunks.push('        "401":');
    yamlChunks.push('          $ref: "#/components/responses/Unauthorized"');
  }
}

const stubYaml = `${yamlChunks.join('\n')}\n`;

// ─── 6. Append stubs to openapi.yaml right at the end of `paths:` block.
//        Detect the next top-level key after `paths:` and insert before it.
function insertStubs(specText, stubBlock) {
  const lines = specText.split('\n');
  // Find the `paths:` line
  const pathsIdx = lines.findIndex((l) => /^paths:\s*$/.test(l));
  if (pathsIdx === -1) throw new Error('Could not find `paths:` in spec');
  // Find next top-level key (no indent) after pathsIdx
  let endIdx = lines.length;
  for (let i = pathsIdx + 1; i < lines.length; i++) {
    if (/^[a-zA-Z]/.test(lines[i])) { endIdx = i; break; }
  }
  const before = lines.slice(0, endIdx);
  const after = lines.slice(endIdx);
  return [...before, ...stubBlock.split('\n'), ...after].join('\n');
}

const _updatedSpec = specText => specText;

if (missing.length === 0) {
} else {
  const newSpec = insertStubs(specRaw, stubYaml);
  // Merge new tags into the spec — append entries at end of tags list
  const tagsToAdd = [...newTags].filter((t) => !existingTags.has(t)).sort();
  let withTags = newSpec;
  if (tagsToAdd.length) {
    const tagBlock = tagsToAdd
      .map((t) => `  - name: ${t}\n    description: "Auto-generated tag for ${t} route group"`)
      .join('\n');
    // Insert before `paths:` (after the last existing tag)
    const lines = withTags.split('\n');
    const pathsIdx = lines.findIndex((l) => /^paths:\s*$/.test(l));
    // Find last tag entry before pathsIdx
    let lastTagIdx = -1;
    for (let i = pathsIdx - 1; i >= 0; i--) {
      if (/^ {2}- name:\s/.test(lines[i])) { lastTagIdx = i; break; }
    }
    // Find end of that tag entry (next line that isn't indented further or starts with `  - `)
    let insertAt = lastTagIdx + 1;
    while (insertAt < pathsIdx && /^\s+\S/.test(lines[insertAt]) && !/^ {2}- /.test(lines[insertAt])) {
      insertAt++;
    }
    withTags = [...lines.slice(0, insertAt), ...tagBlock.split('\n'), ...lines.slice(insertAt)].join('\n');
  }
  writeFileSync(SPEC_PATH, withTags, 'utf8');
}
