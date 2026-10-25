import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const canonicalIssuer = 'zod.coerce.string().pipe(zod.url()).optional()';
const supportedIssuers = new Set([
  'zod.coerce.string().url().optional()',
  'zod.url().optional()',
  canonicalIssuer,
]);

// Preserve query string coercion for the URI-formatted issuer across Orval's
// legacy and Zod 4 output. Any new generated shape requires explicit review.
export function normalizeBrowserIssuer(source) {
  const declarations = source.match(/export const HandleBrowserLoginCallbackQueryParams\b/g) ?? [];
  const operation = /export const HandleBrowserLoginCallbackQueryParams = zod\.object\(\{([\s\S]*?)\r?\n\}\);?(?=[ \t]*(?:\r?\n|$))/g;
  const matches = [...source.matchAll(operation)];
  if (declarations.length !== 1 || matches.length !== 1) {
    throw new Error('Expected exactly one browser callback query schema');
  }
  const body = matches[0][1];
  const issuer = /^([ \t]*(?:iss|"iss"|'iss')[ \t]*:[ \t]*)([^\r\n]*)$/gm;
  const fields = [...body.matchAll(issuer)];
  if (fields.length !== 1) throw new Error('Expected exactly one browser callback issuer field');
  const expression = fields[0][2].trim().replace(/,$/, '').replace(/\s/g, '');
  if (!supportedIssuers.has(expression)) throw new Error('Unreviewed browser callback issuer schema');
  const replacement = body.replace(issuer, (_line, prefix, value) =>
    `${prefix}${canonicalIssuer}${value.trim().endsWith(',') ? ',' : ''}`);
  return source.replace(operation, (whole) => whole.replace(body, replacement));
}

export function normalizeGeneratedZodCoercion(root = packageRoot) {
  const target = resolve(root, '../api-zod/src/generated/api.ts');
  const source = readFileSync(target, 'utf8');
  const normalized = normalizeBrowserIssuer(source);
  if (normalized !== source) writeFileSync(target, normalized);
  return normalized !== source;
}

// Orval logs hook exceptions without failing its process. Preserve a failing
// exit status when its generated structure requires a new explicit review.
export function normalizeGeneratedZodCoercionHook(root = packageRoot) {
  try {
    normalizeGeneratedZodCoercion(root);
  } catch (error) {
    process.exitCode = 1;
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  normalizeGeneratedZodCoercion();
}
