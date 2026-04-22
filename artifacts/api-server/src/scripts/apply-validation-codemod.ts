#!/usr/bin/env tsx
/**
 * apply-validation-codemod.ts
 *
 * Sweeps src/routes/ and applies a baseline Zod input validation safety net to
 * every route handler that lacks explicit validation:
 *
 *   - For mutating routes (router.post / put / patch / delete) without
 *     `validateBody(...)` in the middleware chain, inject
 *     `validateBody(jsonObjectBodySchema)` after the path argument.
 *   - For routes whose handler body references `req.query.` and which do not
 *     already have `validateQuery(...)` in the middleware chain, inject
 *     `validateQuery(anyQuerySchema)` after the path argument.
 *
 * Both `jsonObjectBodySchema` and `anyQuerySchema` are extremely permissive
 * baselines — `jsonObjectBodySchema` ensures the body is a plain object (not an
 * array or primitive), and `anyQuerySchema` accepts any keys without coercion.
 * They do not enforce specific shapes; the goal is to close the
 * "no validation at all" gap so that every route at minimum runs the input
 * through the validation pipeline. Routes with specific schemas are left
 * untouched.
 *
 * Run via:
 *   pnpm --filter @szl-holdings/api-server exec tsx src/scripts/apply-validation-codemod.ts
 *   # Dry run (report only, no writes):
 *   pnpm --filter @szl-holdings/api-server exec tsx src/scripts/apply-validation-codemod.ts --dry
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROUTES_DIR = join(__dirname, '../routes');
const DRY = process.argv.includes('--dry');

function collectRouteFiles(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (!['__tests__', 'groups'].includes(entry)) collectRouteFiles(full, files);
    } else if (
      entry.endsWith('.ts') &&
      entry !== 'index.ts' &&
      !entry.endsWith('.test.ts') &&
      !entry.endsWith('.spec.ts')
    ) {
      files.push(full);
    }
  }
  return files;
}

const ROUTE_CALL_RE = /\b(?:router|app|r)\s*\.\s*(get|post|put|patch|delete|all)\s*\(/g;
const MUTATING = new Set(['post', 'put', 'patch', 'delete']);

function findMatchingParen(src: string, openIdx: number): number {
  // openIdx points at '('
  let depth = 0;
  let i = openIdx;
  let inStr: string | null = null;
  let inTpl = false;
  let inLineComment = false;
  let inBlockComment = false;
  let _prev = '';
  while (i < src.length) {
    const c = src[i];
    const next = src[i + 1];
    if (inLineComment) {
      if (c === '\n') inLineComment = false;
    } else if (inBlockComment) {
      if (c === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
    } else if (inStr) {
      if (c === '\\') {
        i += 2;
        _prev = '';
        continue;
      }
      if (c === inStr) inStr = null;
    } else if (inTpl) {
      if (c === '\\') {
        i += 2;
        _prev = '';
        continue;
      }
      if (c === '`') inTpl = false;
      // (template substitutions can themselves contain (), but treating them
      // as opaque is fine for our purposes since we only count top-level parens)
    } else {
      if (c === '/' && next === '/') {
        inLineComment = true;
        i++;
      } else if (c === '/' && next === '*') {
        inBlockComment = true;
        i++;
      } else if (c === "'" || c === '"') inStr = c;
      else if (c === '`') inTpl = true;
      else if (c === '(') depth++;
      else if (c === ')') {
        depth--;
        if (depth === 0) return i;
      }
    }
    _prev = c;
    i++;
  }
  return -1;
}

interface FileResult {
  file: string;
  bodyAdds: number;
  queryAdds: number;
  routesScanned: number;
  unchangedValidated: number;
}

function processFile(filePath: string): FileResult {
  const original = readFileSync(filePath, 'utf-8');
  let src = original;
  let bodyAdds = 0;
  let queryAdds = 0;
  let routesScanned = 0;
  let unchangedValidated = 0;

  // We rewrite from end to start so indices stay valid.
  const matches: { idx: number; method: string; openParen: number }[] = [];
  ROUTE_CALL_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ROUTE_CALL_RE.exec(src)) !== null) {
    const openParen = m.index + m[0].length - 1;
    matches.push({ idx: m.index, method: m[1].toLowerCase(), openParen });
  }

  // Process in reverse order
  for (let mi = matches.length - 1; mi >= 0; mi--) {
    const { method, openParen } = matches[mi];
    const closeParen = findMatchingParen(src, openParen);
    if (closeParen < 0) continue;
    const block = src.slice(openParen + 1, closeParen);
    routesScanned++;

    const hasValidateBody = /\bvalidateBody\s*\(/.test(block);
    const hasValidateQuery = /\bvalidateQuery\s*\(/.test(block);
    const usesReqQuery = /\breq\.query\b/.test(block);

    const needsBody = MUTATING.has(method) && !hasValidateBody;
    const needsQuery = usesReqQuery && !hasValidateQuery;

    if (!needsBody && !needsQuery) {
      if (hasValidateBody || hasValidateQuery) unchangedValidated++;
      continue;
    }

    // Locate the end of the first argument (the path string).
    // Skip leading whitespace inside the paren.
    let i = openParen + 1;
    while (i < closeParen && /\s/.test(src[i])) i++;
    const firstChar = src[i];
    let pathEnd = -1;
    if (firstChar === '"' || firstChar === "'") {
      // walk until matching unescaped quote
      let j = i + 1;
      while (j < closeParen) {
        if (src[j] === '\\') {
          j += 2;
          continue;
        }
        if (src[j] === firstChar) {
          pathEnd = j;
          break;
        }
        j++;
      }
    } else if (firstChar === '`') {
      let j = i + 1;
      while (j < closeParen) {
        if (src[j] === '\\') {
          j += 2;
          continue;
        }
        if (src[j] === '`') {
          pathEnd = j;
          break;
        }
        j++;
      }
    } else if (firstChar === '[') {
      // array of paths, e.g. router.get(["/a","/b"], ...)
      let depth = 1;
      let j = i + 1;
      while (j < closeParen && depth > 0) {
        if (src[j] === '[') depth++;
        else if (src[j] === ']') depth--;
        j++;
      }
      pathEnd = j - 1;
    } else {
      // unrecognized first arg shape; skip
      continue;
    }
    if (pathEnd < 0) continue;

    // Insert middlewares immediately after pathEnd, before any following comma/whitespace.
    // Build insertion text.
    const inserts: string[] = [];
    if (needsBody) {
      inserts.push('validateBody(jsonObjectBodySchema)');
      bodyAdds++;
    }
    if (needsQuery) {
      inserts.push('validateQuery(anyQuerySchema)');
      queryAdds++;
    }
    const insertText = `, ${inserts.join(', ')}`;

    // Insert right after pathEnd (which is the closing quote/bracket index)
    src = src.slice(0, pathEnd + 1) + insertText + src.slice(pathEnd + 1);
  }

  if (bodyAdds === 0 && queryAdds === 0) {
    return { file: filePath, bodyAdds, queryAdds, routesScanned, unchangedValidated };
  }

  // Ensure imports are present.
  src = ensureValidationImports(filePath, src, {
    needBody: bodyAdds > 0,
    needQuery: queryAdds > 0,
  });

  if (!DRY) writeFileSync(filePath, src, 'utf-8');
  return { file: filePath, bodyAdds, queryAdds, routesScanned, unchangedValidated };
}

function ensureValidationImports(
  filePath: string,
  src: string,
  needs: { needBody: boolean; needQuery: boolean },
): string {
  const required = new Set<string>();
  if (needs.needBody) {
    required.add('validateBody');
    required.add('jsonObjectBodySchema');
  }
  if (needs.needQuery) {
    required.add('validateQuery');
    required.add('anyQuerySchema');
  }

  // Find an existing import from .../lib/validation
  const importRe = /import\s*\{([^}]*)\}\s*from\s*"((?:\.\.?\/)+lib\/validation)(\.js)?"\s*;?/m;
  const match = src.match(importRe);
  if (match) {
    const existing = match[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const set = new Set(existing);
    for (const name of required) set.add(name);
    const merged = Array.from(set).sort().join(', ');
    const replacement = `import { ${merged} } from "${match[2]}${match[3] ?? ''}";`;
    return src.replace(importRe, replacement);
  }

  // No existing validation import — compute relative path and add one.
  const rel = relative(dirname(filePath), join(ROUTES_DIR, '..', 'lib', 'validation')).replace(
    /\\/g,
    '/',
  );
  const importPath = rel.startsWith('.') ? rel : `./${rel}`;
  const names = Array.from(required).sort().join(', ');
  const importLine = `import { ${names} } from "${importPath}";\n`;

  // Insert after the last existing top-of-file import statement.
  const lastImportRe = /^(import[\s\S]*?from\s*"[^"]+"\s*;?\s*\n)+/m;
  const lastMatch = src.match(lastImportRe);
  if (lastMatch && lastMatch.index !== undefined) {
    const insertAt = lastMatch.index + lastMatch[0].length;
    return src.slice(0, insertAt) + importLine + src.slice(insertAt);
  }
  return importLine + src;
}

const files = collectRouteFiles(ROUTES_DIR);
const results = files.map(processFile);

let _totalBody = 0,
  _totalQuery = 0,
  filesChanged = 0,
  _totalRoutes = 0;
for (const r of results) {
  _totalBody += r.bodyAdds;
  _totalQuery += r.queryAdds;
  _totalRoutes += r.routesScanned;
  if (r.bodyAdds || r.queryAdds) filesChanged++;
}
if (filesChanged > 0 && filesChanged <= 50) {
  for (const r of results) {
    if (r.bodyAdds || r.queryAdds) {
    }
  }
}
