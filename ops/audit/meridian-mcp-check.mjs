#!/usr/bin/env node
/**
 * meridian-mcp-check.mjs
 *
 * Audit script for the Meridian MCP registry.
 * Reads the registry TypeScript source, extracts each server entry,
 * verifies every server has required fields, confirms activation-order
 * numbers are unique and contiguous (1–N), and exits non-zero on any issue.
 *
 * Usage:
 *   node ops/audit/meridian-mcp-check.mjs
 *   pnpm audit:mcp-registry
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../');

const registryPath = resolve(
  repoRoot,
  'artifacts/api-server/src/services/meridian-mcp-registry.ts',
);

let source;
try {
  source = readFileSync(registryPath, 'utf8');
} catch (e) {
  console.error(`❌ Cannot read registry file: ${registryPath}`);
  console.error(e.message);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Tokeniser: walk the source character by character producing tokens.
// We need to reliably extract key-value pairs from TypeScript object literals.
// ---------------------------------------------------------------------------

function tokenise(src) {
  const tokens = [];
  let i = 0;
  const len = src.length;

  while (i < len) {
    // Skip single-line comments
    if (src[i] === '/' && src[i + 1] === '/') {
      while (i < len && src[i] !== '\n') i++;
      continue;
    }
    // Skip block comments
    if (src[i] === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < len && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    // String literal
    if (src[i] === '"' || src[i] === "'" || src[i] === '`') {
      const delim = src[i];
      let val = '';
      i++;
      while (i < len) {
        if (src[i] === '\\') { i++; val += src[i] ?? ''; i++; continue; }
        if (src[i] === delim) { i++; break; }
        val += src[i];
        i++;
      }
      tokens.push({ type: 'string', val });
      continue;
    }
    // Numbers
    if (/[0-9]/.test(src[i])) {
      let num = '';
      while (i < len && /[0-9]/.test(src[i])) { num += src[i]; i++; }
      tokens.push({ type: 'number', val: parseInt(num, 10) });
      continue;
    }
    // Identifiers / keywords
    if (/[a-zA-Z_$]/.test(src[i])) {
      let id = '';
      while (i < len && /[a-zA-Z_$0-9]/.test(src[i])) { id += src[i]; i++; }
      tokens.push({ type: 'ident', val: id });
      continue;
    }
    // Structural characters
    if ('{}[],:'.includes(src[i])) {
      tokens.push({ type: src[i], val: src[i] });
      i++;
      continue;
    }
    // Skip whitespace and other chars
    i++;
  }
  return tokens;
}

// ---------------------------------------------------------------------------
// Find the MCP_REGISTRY constant and parse its array entries.
// ---------------------------------------------------------------------------

function parseRegistry(tokens) {
  // Find MCP_REGISTRY and then Object.freeze([
  let i = 0;
  const len = tokens.length;

  // Locate MCP_REGISTRY
  while (i < len && !(tokens[i]?.type === 'ident' && tokens[i]?.val === 'MCP_REGISTRY')) i++;
  if (i >= len) return null;

  // Skip past MCP_REGISTRY to find 'Object' identifier (skip any type annotations like `: readonly McpServerEntry[]`)
  // We want the '[' that follows 'Object.freeze(' specifically.
  // Skip to 'Object' ident
  while (i < len && !(tokens[i]?.type === 'ident' && tokens[i]?.val === 'Object')) i++;
  if (i >= len) return null;

  // Skip past Object, freeze, and opening bracket
  while (i < len && tokens[i]?.type !== '[') i++;
  if (i >= len) return null;
  i++; // consume '['

  const servers = [];

  while (i < len) {
    // Skip commas
    if (tokens[i]?.type === ',') { i++; continue; }
    // End of array
    if (tokens[i]?.type === ']') break;
    // Parse object
    if (tokens[i]?.type === '{') {
      const [obj, next] = parseObject(tokens, i);
      servers.push(obj);
      i = next;
      continue;
    }
    i++;
  }

  return servers;
}

function parseObject(tokens, start) {
  let i = start + 1; // skip '{'
  const obj = {};
  const len = tokens.length;

  while (i < len) {
    if (tokens[i]?.type === '}') { i++; break; }
    if (tokens[i]?.type === ',') { i++; continue; }

    // Key
    const keyTok = tokens[i];
    if (keyTok?.type !== 'ident' && keyTok?.type !== 'string') { i++; continue; }
    const key = keyTok.val;
    i++;

    // Colon
    if (tokens[i]?.type === ':') i++;

    // Value
    const valTok = tokens[i];
    if (!valTok) break;

    if (valTok.type === 'string') {
      obj[key] = valTok.val;
      i++;
    } else if (valTok.type === 'number') {
      obj[key] = valTok.val;
      i++;
    } else if (valTok.type === 'ident' && valTok.val === 'true') {
      obj[key] = true;
      i++;
    } else if (valTok.type === 'ident' && valTok.val === 'false') {
      obj[key] = false;
      i++;
    } else if (valTok.type === '[') {
      // Array of strings
      i++; // skip '['
      const arr = [];
      while (i < len && tokens[i]?.type !== ']') {
        if (tokens[i]?.type === 'string') arr.push(tokens[i].val);
        i++;
      }
      i++; // skip ']'
      obj[key] = arr;
    } else {
      i++;
    }
  }

  return [obj, i];
}

const tokens = tokenise(source);
const servers = parseRegistry(tokens);

if (!servers || servers.length === 0) {
  console.error('❌ Could not locate any server entries in MCP_REGISTRY array.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Audit checks
// ---------------------------------------------------------------------------

const REQUIRED_FIELDS = [
  'activationOrder',
  'slug',
  'displayName',
  'category',
  'declaredScopes',
  'riskClass',
  'readOnlyReady',
  'governanceNote',
  'docLink',
];

const VALID_RISK_CLASSES = ['low', 'medium', 'high', 'mutating'];

let errors = 0;
let warnings = 0;

function fail(msg) { console.error(`  ❌ FAIL  ${msg}`); errors++; }
function warn(msg) { console.warn(`  ⚠️  WARN  ${msg}`); warnings++; }
function ok(msg) { console.log(`  ✅ OK    ${msg}`); }

console.log('\n🛡️  Meridian MCP Registry Audit\n');
console.log(`  Registry path : ${registryPath}`);
console.log(`  Servers found : ${servers.length}\n`);

// [1] Required fields
console.log('[1/4] Required fields');
let prevErr = errors;
for (const s of servers) {
  const order = s.activationOrder ?? '?';
  for (const field of REQUIRED_FIELDS) {
    const val = s[field];
    const isMissing = val === undefined || val === null || val === '';
    if (isMissing) fail(`Server #${order} (${s.slug ?? 'unknown'}) missing field: ${field}`);
  }
}
if (errors === prevErr) ok('All servers have required fields.');

// [2] Unique activation orders
prevErr = errors;
console.log('\n[2/4] Unique activation orders');
const orderSeen = new Map();
for (const s of servers) {
  const o = s.activationOrder;
  if (orderSeen.has(o)) {
    fail(`Duplicate activationOrder=${o} on slug="${s.slug}" (first: "${orderSeen.get(o)}")`);
  } else {
    orderSeen.set(o, s.slug);
  }
}
if (errors === prevErr) ok('All activation orders are unique.');

// [3] Contiguous 1–N
prevErr = errors;
console.log('\n[3/4] Contiguous order (1–N)');
const orders = [...orderSeen.keys()].sort((a, b) => a - b);
const expected = Array.from({ length: servers.length }, (_, i) => i + 1);
const missing = expected.filter((n) => !orders.includes(n));
const extra = orders.filter((n) => n < 1 || n > servers.length);
if (missing.length > 0) fail(`Missing activation orders: ${missing.join(', ')}`);
if (extra.length > 0) fail(`Out-of-range orders: ${extra.join(', ')}`);
if (errors === prevErr) ok(`Activation orders are contiguous from 1 to ${servers.length}.`);

// [4] Risk class validity
prevErr = errors;
console.log('\n[4/4] Risk class validity');
for (const s of servers) {
  if (!VALID_RISK_CLASSES.includes(s.riskClass)) {
    fail(
      `Server #${s.activationOrder} (${s.slug}) invalid riskClass="${s.riskClass}". ` +
        `Valid: ${VALID_RISK_CLASSES.join(', ')}`,
    );
  }
  if (!Array.isArray(s.declaredScopes) || s.declaredScopes.length === 0) {
    warn(`Server #${s.activationOrder} (${s.slug}) has empty declaredScopes.`);
  }
  if (s.readOnlyReady !== true && s.readOnlyReady !== false) {
    fail(`Server #${s.activationOrder} (${s.slug}) readOnlyReady must be boolean.`);
  }
}
if (errors === prevErr) ok('All risk classes are valid.');

// Summary
console.log('\n────────────────────────────────────────');
if (errors === 0 && warnings === 0) {
  console.log('✅  Registry audit passed — no issues found.\n');
  process.exit(0);
} else if (errors === 0) {
  console.log(`⚠️   Registry audit passed with ${warnings} warning(s).\n`);
  process.exit(0);
} else {
  console.error(`❌  Registry audit FAILED: ${errors} error(s), ${warnings} warning(s).\n`);
  process.exit(1);
}
