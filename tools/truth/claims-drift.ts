import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const TRUTH_FILE = path.join(ROOT, 'artifacts', 'SOURCE_OF_TRUTH.json');
const ALLOWLIST_FILE = path.join(ROOT, '.truth-allowlist');
const WATCHED_LITERALS =
  /\b(?:218|1220|1,220|848|5524|5,524|126|76|144|23|27|19|26|15|24|22|9|8|7)\b/g;
const WATCHWORD_SOURCE = String.raw`\b(?:tests|surfaces|packages|endpoints|workflows|spaces|models|datasets|theorems)\b`;
const CLAIM_CONTEXT =
  /\b(?:canonical|current|total|public|passing|passed|locked|monorepo|ci|github actions|hugging face|hf|customer-facing|estate|organization|org)\b/i;
const MAX_CLAIM_DISTANCE = 36;
const EXTENSIONS = new Set(['.md', '.html', '.tsx']);
const EXCLUDED = new Set(['.git', 'node_modules', 'dist', 'coverage', 'archive']);

type AllowEntry = { path: string; literal: string };

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

function canonicalFor(watchword: string, metrics: Record<string, Record<string, unknown>>): string {
  if (/^surfaces?$/i.test(watchword)) return String(metrics.surfaces_customer_facing?.value);
  if (/^packages?$/i.test(watchword)) return String(metrics.monorepo_packages?.value);
  if (/^endpoints?$/i.test(watchword)) return String(metrics.api_endpoints?.value);
  if (/^workflows?$/i.test(watchword)) return String(metrics.ci_workflows?.value);
  if (/^spaces?$/i.test(watchword)) return String(metrics.hf_spaces?.value);
  if (/^models?$/i.test(watchword)) return String(metrics.hf_models?.value);
  if (/^datasets?$/i.test(watchword)) return String(metrics.hf_datasets?.value);
  if (/^theorems?$/i.test(watchword)) return String(metrics.lean_theorems_locked?.value);
  if (/^tests?$/i.test(watchword)) {
    const value = metrics.platform_tests;
    return String(value?.passed ?? value?.total ?? null);
  }
  return 'UNKNOWN';
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
      for (const match of line.matchAll(WATCHED_LITERALS)) {
        const literal = match[0];
        const literalIndex = match.index ?? 0;
        const nearest = watchwords
          .map((watchword) => ({
            watchword: watchword[0],
            distance: Math.abs((watchword.index ?? 0) - literalIndex),
          }))
          .sort((left, right) => left.distance - right.distance)[0];
        if (!nearest || nearest.distance > MAX_CLAIM_DISTANCE) continue;
        const canonical = canonicalFor(nearest.watchword, truth.metrics);
        if (canonical !== 'null' && canonical.replaceAll(',', '') === literal.replaceAll(',', '')) {
          continue;
        }
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
