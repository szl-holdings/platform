// Opt-in anonymized telemetry. OFF by default — must be explicitly enabled
// with `--telemetry`. Payload is restricted to counts and scores; no source
// code, no diffs, no prompts, no file paths leave the machine.
//
// Endpoint: A11OY_TELEMETRY_ENDPOINT env var, or no-op if unset.

export function buildPayload({ session, turns, autoApplies }) {
  return {
    schema: 'a11oy-code/telemetry/v1',
    session_id_hash: hashId(session),
    turn_count: turns?.length ?? 0,
    mean_mirroreval: mean((turns || []).map((t) => t.score)),
    auto_apply_count: autoApplies ?? 0,
    ts: new Date().toISOString(),
    version: '1.0.0',
  };
}

export async function maybeSend(payload, { enabled }) {
  if (!enabled) return { sent: false, reason: 'telemetry disabled (default)' };
  const url = process.env.A11OY_TELEMETRY_ENDPOINT;
  if (!url) return { sent: false, reason: 'no endpoint configured' };
  try {
    await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    return { sent: true };
  } catch (e) { return { sent: false, reason: String(e?.message || e) }; }
}

function mean(xs) { return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0; }
function hashId(s) {
  let h = 5381; for (const c of String(s || '')) h = ((h << 5) + h) ^ c.charCodeAt(0);
  return (h >>> 0).toString(16);
}
