// Append-only proof ledger. JSON-Lines, hash-chained, persisted under
// ~/.a11oy-code/proof.jsonl. Every step, every tool dispatch, every
// MirrorEval, every self-evolution proposal lands here.

import { mkdirSync, appendFileSync, readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const DIR = process.env.A11OY_CODE_HOME || join(homedir(), '.a11oy-code');
const FILE = join(DIR, 'proof.jsonl');

function ensureDir() {
  try { mkdirSync(DIR, { recursive: true }); } catch (_) { /* ignore */ }
}

function tailHash() {
  if (!existsSync(FILE)) return 'GENESIS';
  try {
    const lines = readFileSync(FILE, 'utf8').trim().split('\n').filter(Boolean);
    if (lines.length === 0) return 'GENESIS';
    const last = JSON.parse(lines[lines.length - 1]);
    return last.hash || 'GENESIS';
  } catch (_) { return 'GENESIS'; }
}

function hashOf(prevHash, payload) {
  return createHash('sha256').update(prevHash).update(JSON.stringify(payload)).digest('hex').slice(0, 16);
}

export const proof = {
  append(entry) {
    ensureDir();
    const prev = tailHash();
    const payload = { ts: new Date().toISOString(), prev, ...entry };
    const hash = hashOf(prev, payload);
    appendFileSync(FILE, JSON.stringify({ ...payload, hash }) + '\n');
    return hash;
  },
  read({ session, kind, limit = 200 } = {}) {
    if (!existsSync(FILE)) return [];
    const lines = readFileSync(FILE, 'utf8').trim().split('\n').filter(Boolean);
    const out = [];
    for (let i = lines.length - 1; i >= 0 && out.length < limit; i--) {
      try {
        const e = JSON.parse(lines[i]);
        if (session && e.session !== session) continue;
        if (kind && e.kind !== kind) continue;
        out.push(e);
      } catch (_) { /* skip malformed */ }
    }
    return out.reverse();
  },
  path: FILE,
};
