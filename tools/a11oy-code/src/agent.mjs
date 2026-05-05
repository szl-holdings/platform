// Plan → Tool-call → Reflection loop. Ouroboros revises the plan turn-over-turn.
// Lutar scores tool dispatches. MirrorEval scores each turn. Bounded auto-evolution
// proposes safe-class self-improvements when MirrorEval drops.
//
// This file is intentionally provider-agnostic. The provider router sits behind
// `src/providers/router.mjs`. When run outside the SZL monorepo, the router falls
// back to a deterministic local stub so the public install always works.

import readline from 'node:readline';
import { proof } from './proof.mjs';
import { ouroboros } from './codex/ouroboros.mjs';
import { lutarPick } from './codex/lutar.mjs';
import { mirrorEval } from './codex/mirroreval.mjs';
import { router } from './providers/router.mjs';
import { TOOLS, runTool } from './tools/index.mjs';
import * as evolve from './evolve/index.mjs';
import { buildPayload, maybeSend } from './telemetry.mjs';

const MAX_TURNS = 24;

function banner(opts) {
  const lines = [
    `a11oy-code — governed, self-evolving agentic coding`,
    `provider: ${opts.provider || 'auto'}   model: ${opts.model || 'auto'}   autonomy: ${opts.autonomy ? 'on' : 'off'}`,
    `tools:    ${TOOLS.map((t) => t.name).join(', ')}`,
    `kill-switch: ${evolve.killed() ? 'ENGAGED (no auto-apply)' : 'released'}`,
    ``,
  ];
  return lines.join('\n');
}

async function turn({ session, userText, opts }) {
  // 1. Plan.
  let plan = await router.plan({ userText, history: session.history, opts });
  proof.append({ kind: 'plan', plan, session: session.id });

  // 2. Ouroboros critic — re-write the plan once per turn.
  plan = ouroboros(plan, { history: session.history });
  proof.append({ kind: 'plan_revised', plan, session: session.id });

  // 3. Lutar-route the next tool call.
  const toolPick = lutarPick(plan, TOOLS);
  proof.append({ kind: 'tool_pick', tool: toolPick.name, score: toolPick.score, session: session.id });

  // 4. Dispatch.
  let toolResult;
  try {
    toolResult = await runTool(toolPick.name, toolPick.args || {}, { opts });
  } catch (err) {
    toolResult = { ok: false, error: String(err?.message || err) };
  }
  proof.append({ kind: 'tool_result', tool: toolPick.name, ok: toolResult.ok !== false, session: session.id });

  // 5. Reflection + MirrorEval.
  const reflection = await router.reflect({ plan, toolPick, toolResult, opts });
  const score = mirrorEval({ plan, toolPick, toolResult, reflection });
  proof.append({ kind: 'mirroreval', score, session: session.id });

  // 6. Bounded autonomous self-evolution.
  //    First, feed this turn's score to the armed-rollback monitor — any
  //    previously auto-applied proposal whose post-apply window now shows a
  //    sub-baseline mean is reverted automatically. Then, propose a new
  //    safe-class improvement if the score itself is below baseline.
  if (opts.autonomy && !evolve.killed()) {
    const reverts = evolve.observeScore(score);
    if (reverts.length) proof.append({ kind: 'evolve_auto_revert_batch', count: reverts.length, reverts, session: session.id });
    const proposal = evolve.proposeFromTurn({ plan, toolPick, toolResult, reflection, score });
    if (proposal) evolve.handleProposal(proposal, { session });
  }

  // 7. Update session.
  session.history.push({ user: userText, plan, tool: toolPick, result: toolResult, reflection, score });
  return { plan, toolPick, toolResult, reflection, score };
}

export async function runOneShot(prompt, opts) {
  const session = newSession(opts);
  const out = [];
  let stopRequested = false;
  for (let i = 0; i < MAX_TURNS && !stopRequested; i++) {
    const t = await turn({ session, userText: i === 0 ? prompt : 'continue', opts });
    out.push(t);
    if (t.toolPick.name === 'finish' || t.reflection?.done) stopRequested = true;
  }
  if (opts.json) console.log(JSON.stringify({ session: session.id, turns: out }, null, 2));
  else console.log(`\n[a11oy-code] done — ${out.length} turn(s); session ${session.id}`);
  await sendTelemetry({ session, turns: out, opts });
  return { session, turns: out };
}

async function sendTelemetry({ session, turns, opts }) {
  const payload = buildPayload({ session: session.id, turns, autoApplies: evolve.status().autoAppliesLast24h });
  const result = await maybeSend(payload, { enabled: !!opts.telemetry });
  proof.append({ kind: 'telemetry', enabled: !!opts.telemetry, sent: !!result.sent, reason: result.reason, session: session.id });
  return result;
}

export async function startRepl(opts) {
  const session = newSession(opts);
  process.stdout.write(banner(opts));
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: 'a11oy ▸ ' });
  rl.prompt();
  rl.on('line', async (line) => {
    const text = line.trim();
    if (!text) return rl.prompt();
    if (text === '/exit' || text === '/quit') return rl.close();
    if (text === '/status') {
      console.log(JSON.stringify({ session: session.id, turns: session.history.length, evolve: evolve.status() }, null, 2));
      return rl.prompt();
    }
    try {
      const t = await turn({ session, userText: text, opts });
      const summary = `→ ${t.toolPick.name}  score=${t.score.toFixed(3)}` +
        (t.toolResult?.ok === false ? `  ERROR: ${t.toolResult.error}` : '');
      console.log(summary);
    } catch (err) {
      console.error(`[turn-error] ${err?.message || err}`);
    }
    rl.prompt();
  });
  rl.on('close', async () => {
    await sendTelemetry({ session, turns: session.history, opts });
    console.log(`bye — session ${session.id}, ${session.history.length} turn(s) recorded.`);
  });
}

function newSession(opts) {
  const id = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  proof.append({ kind: 'session_start', session: id, opts: { provider: opts.provider, model: opts.model, autonomy: opts.autonomy } });
  return { id, history: [], opts };
}
