#!/usr/bin/env node
/**
 * baseline.mjs — regenerate or verify lib/db/baseline/0000_baseline_from_schema.sql.
 *
 *   node scripts/baseline.mjs --check   # CI: fail if src/schema changed but the baseline was not regenerated
 *   node scripts/baseline.mjs --write   # regenerate baseline + BASELINE.json sha (review the diff!)
 *
 * Generation is offline: drizzle-kit generate from src/schema/index.ts into a
 * temp folder; no DATABASE_URL is read and no database is contacted.
 */
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const META = path.join(DB_ROOT, 'baseline/BASELINE.json');
const mode = process.argv[2];
if (mode !== '--check' && mode !== '--write') { console.error('usage: baseline.mjs --check|--write'); process.exit(2); }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'szl-baseline-'));
const cfg = path.join(tmp, 'drizzle.baseline.config.mjs');
fs.writeFileSync(cfg, `export default { schema: ${JSON.stringify(path.join(DB_ROOT, 'src/schema/index.ts'))}, out: ${JSON.stringify(path.join(tmp, 'out'))}, dialect: 'postgresql' };\n`);
const env = { ...process.env };
delete env.DATABASE_URL; // generation never needs a connection string
execFileSync('npx', ['--no-install', 'drizzle-kit', 'generate', '--config', cfg, '--name', 'baseline_from_schema'], { cwd: DB_ROOT, env, stdio: ['ignore', 'ignore', 'inherit'] });
const sql = fs.readFileSync(path.join(tmp, 'out/0000_baseline_from_schema.sql'), 'utf8');
const sha = crypto.createHash('sha256').update(sql).digest('hex');
fs.rmSync(tmp, { recursive: true, force: true });
const meta = JSON.parse(fs.readFileSync(META, 'utf8'));
if (mode === '--check') {
  if (sha !== meta.sha256) {
    console.error(`[baseline] STALE: src/schema generates ${sha}, BASELINE.json pins ${meta.sha256}. Run 'node scripts/baseline.mjs --write' and review.`);
    process.exit(1);
  }
  console.log(`[baseline] ok — ${sha}`);
} else {
  fs.writeFileSync(path.join(DB_ROOT, 'baseline', meta.file), sql);
  meta.sha256 = sha;
  meta.generated_at = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(META, `${JSON.stringify(meta, null, 2)}\n`);
  console.log(`[baseline] written — ${sha}`);
}
