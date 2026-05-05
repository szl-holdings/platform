// Persistent state for the evolution subsystem.
//
// File: ~/.a11oy-code/state.json
//   killSwitch:           boolean (default false)
//   maxAutoAppliesPerDay: number  (default 50)
//   autoApplies:          [{ id, kind, ts, ... }]   (rolling, never deleted)
//   queued:               [{ id, ... }]             (boundary + doctrine + capped)

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { proof } from '../proof.mjs';
import * as applier from './applier.mjs';

const DIR = process.env.A11OY_CODE_HOME || join(homedir(), '.a11oy-code');
const FILE = join(DIR, 'state.json');
const DEFAULT_CAP = 50;

function load() {
  try { mkdirSync(DIR, { recursive: true }); } catch (_) { /* ignore */ }
  if (!existsSync(FILE)) return { killSwitch: false, maxAutoAppliesPerDay: DEFAULT_CAP, autoApplies: [], queued: [] };
  try { return JSON.parse(readFileSync(FILE, 'utf8')); }
  catch (_) { return { killSwitch: false, maxAutoAppliesPerDay: DEFAULT_CAP, autoApplies: [], queued: [] }; }
}

function save(s) { writeFileSync(FILE, JSON.stringify(s, null, 2)); }

export function status() {
  const s = load();
  const recent = recentAutoApplies(s);
  return {
    killSwitch: s.killSwitch,
    maxAutoAppliesPerDay: s.maxAutoAppliesPerDay ?? DEFAULT_CAP,
    autoAppliesLast24h: recent.length,
    queuedCount: s.queued?.length ?? 0,
    statePath: FILE,
  };
}

export function setKillSwitch(value, log = () => {}) {
  const s = load();
  s.killSwitch = !!value;
  save(s);
  proof.append({ kind: 'evolve_killswitch', value: s.killSwitch });
  log(`kill-switch ${s.killSwitch ? 'ENGAGED' : 'released'} — state: ${FILE}`);
}

export function canAutoApplyNow() {
  const s = load();
  if (s.killSwitch) return false;
  return recentAutoApplies(s).length < (s.maxAutoAppliesPerDay ?? DEFAULT_CAP);
}

export function recordAutoApply(proposal, { rollbackWindow, baseline }) {
  const s = load();
  s.autoApplies = s.autoApplies || [];
  s.autoApplies.push({
    ...proposal,
    ts: Date.now(),
    rollbackWindow,
    baseline,
    postScores: [],
    reverted: false,
  });
  save(s);
}

// Armed rollback: each unreverted auto-apply collects up to `rollbackWindow`
// post-apply MirrorEval scores. Once the window is full, if the mean drops
// below `baseline`, the proposal is automatically reverted and the revert
// is recorded in the proof ledger.
export function observeScore(score) {
  const s = load();
  const reverts = [];
  let mutated = false;
  for (const a of s.autoApplies || []) {
    if (a.reverted) continue;
    if ((a.postScores?.length ?? 0) >= a.rollbackWindow) continue;
    a.postScores = a.postScores || [];
    a.postScores.push(score);
    mutated = true;
    if (a.postScores.length >= a.rollbackWindow) {
      const mean = a.postScores.reduce((x, y) => x + y, 0) / a.postScores.length;
      if (mean < (a.baseline ?? 0.7)) {
        a.reverted = true;
        a.revertReason = `armed rollback: mean ${mean.toFixed(3)} < baseline ${(a.baseline ?? 0.7).toFixed(3)}`;
        // Actually undo the runtime mutation captured at apply time.
        const r = applier.revert(a, a.snapshot);
        a.revertOk = r.reverted;
        reverts.push({ id: a.id, kind: a.kind, reason: a.revertReason, revertOk: r.reverted });
        proof.append({ kind: 'evolve_armed_rollback', proposal: a });
      }
    }
  }
  if (mutated) save(s);
  return reverts;
}

export function queue(proposal) {
  const s = load();
  s.queued = s.queued || [];
  s.queued.push({ ...proposal, ts: Date.now() });
  save(s);
}

export function revertLast(n) {
  const s = load();
  const list = (s.autoApplies || []).filter((a) => !a.reverted);
  const target = list.slice(-Math.max(1, n));
  for (const t of target) {
    const ref = s.autoApplies.find((a) => a.id === t.id);
    if (ref) {
      ref.reverted = true;
      const r = applier.revert(ref, ref.snapshot);
      ref.revertOk = r.reverted;
    }
    proof.append({ kind: 'evolve_revert', proposal: ref });
  }
  save(s);
  return target;
}

function recentAutoApplies(s) {
  const cutoff = Date.now() - 24 * 3600 * 1000;
  return (s.autoApplies || []).filter((a) => a.ts >= cutoff && !a.reverted);
}
