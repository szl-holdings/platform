/**
 * Public attestation engine.
 *
 * Given a run_id, this module:
 *   1. Looks up the anchored run record from the runs store
 *   2. Re-executes the kernel with the original input (replay)
 *   3. Compares the replayed output_hash against the anchored output_hash
 *   4. Verifies the recorded trace replays to the same final_state_hash
 *      using the kernel's own `replay()` primitive (Article 12 contract)
 *   5. Builds a canonical attestation envelope and Ed25519-signs it
 *
 * Status outcomes:
 *   - "match"        → both hashes line up; signed attestation returned
 *   - "mismatch"     → output_hash or replay differ; high-severity record
 *   - "unknown_run"  → run_id is not anchored
 */

import { canonicalize, hashJson, replay as kernelReplay } from "@workspace/codex-kernel";
import { loadAttestationKeys, signBytes, type AttestationKeyPair } from "./keys.js";
import { buildKernelConfig, replayCanonicalRun } from "./agent.js";
import { getRunsStore } from "./runs-store.js";

export type AttestationOutcome =
  | {
      status: "match";
      run_id: string;
      agent_id: "TrustDocAttestor";
      agent_version: "1.0.0";
      tenant: "public";
      original_hash: string;
      replay_hash: string;
      signing_key_fingerprint: string;
      signature: string;
      ledger_anchor: string;
      ledger_height_at_run: number;
      ledger_height_at_replay: number;
      replayed_at: string;
      kernel_version: string;
      evidence_url: string;
    }
  | {
      status: "mismatch";
      run_id: string;
      original_hash: string;
      replay_hash: string;
      diff_summary: string;
      signing_key_fingerprint: string;
      signature: string;
      incident_record_url: string;
    }
  | { status: "unknown_run"; run_id_received: string; note: string };

const KERNEL_VERSION = "@workspace/codex-kernel@0.x";

export function attest(runId: string, opts: { dataDir?: string; nowIso?: string } = {}): AttestationOutcome {
  const store = getRunsStore({ dataDir: opts.dataDir });
  const record = store.get(runId);
  if (!record) {
    return {
      status: "unknown_run",
      run_id_received: runId,
      note: `No public run with id "${runId}" is anchored in the public ledger. ${store.count()} runs are anchored in total.`,
    };
  }

  // Replay step 1: re-execute the agent with the original input → expect identical output_hash.
  let replay: ReturnType<typeof replayCanonicalRun>;
  try {
    replay = replayCanonicalRun(record.input);
  } catch (err) {
    return buildMismatch(record.run_id, record.output_hash, "<replay-failed>", `agent re-execution threw: ${(err as Error).message}`);
  }
  const replayedOutputHash = replay.outputHash;

  // Replay step 2: kernel-level trace replay against the recorded trace
  // (this verifies the trace itself, not just the final hash). Article 12 contract.
  // The kernel's replay() needs the same initial_state that runLoop() started
  // from — for our agent that's a deterministic init derived from the input.
  const initialState = buildKernelConfig(record.input).initial_state;
  const traceReport = kernelReplay(initialState as never, record.trace, record.final_state_hash);

  if (replayedOutputHash !== record.output_hash || !traceReport.ok || traceReport.final_state_hash !== record.final_state_hash) {
    const diffParts = [];
    if (replayedOutputHash !== record.output_hash) diffParts.push(`output_hash: anchored=${record.output_hash} replay=${replayedOutputHash}`);
    if (!traceReport.ok) diffParts.push(`trace_replay_failed: ${traceReport.failure_reason}`);
    if (traceReport.final_state_hash !== record.final_state_hash) {
      diffParts.push(`final_state_hash: anchored=${record.final_state_hash} replay=${traceReport.final_state_hash}`);
    }
    return buildMismatch(record.run_id, record.output_hash, replayedOutputHash, diffParts.join("; "));
  }

  // MATCH path — build the canonical attestation envelope and sign it.
  const keys = loadAttestationKeys({ dataDir: opts.dataDir });
  const replayedAt = opts.nowIso || new Date().toISOString();

  const envelope = {
    schema: "szl/replay-attestation@1",
    run_id: record.run_id,
    agent_id: record.agent_id,
    agent_version: record.agent_version,
    tenant: record.tenant,
    original_hash: record.output_hash,
    replay_hash: replayedOutputHash,
    final_state_hash: record.final_state_hash,
    ledger_anchor: record.proof_ledger.at(-1)?.state_hash ?? record.final_state_hash,
    ledger_height_at_run: record.proof_ledger.length,
    ledger_height_at_replay: replay.result.ledger.length,
    replayed_at: replayedAt,
    kernel_version: KERNEL_VERSION,
  };

  const canonicalBytes = Buffer.from(canonicalize(envelope as never));
  const signature = signBytes(canonicalBytes, keys);

  return {
    status: "match",
    run_id: envelope.run_id,
    agent_id: envelope.agent_id,
    agent_version: envelope.agent_version,
    tenant: envelope.tenant,
    original_hash: envelope.original_hash,
    replay_hash: envelope.replay_hash,
    signing_key_fingerprint: keys.fingerprint,
    signature,
    ledger_anchor: envelope.ledger_anchor,
    ledger_height_at_run: envelope.ledger_height_at_run,
    ledger_height_at_replay: envelope.ledger_height_at_replay,
    replayed_at: envelope.replayed_at,
    kernel_version: envelope.kernel_version,
    evidence_url: `https://github.com/szl-holdings/szl-holdings-platform/blob/master/docs/trust/${record.input.doc_id}.md`,
  };
}

function buildMismatch(runId: string, anchored: string, replayed: string, diffSummary: string): AttestationOutcome {
  const keys = loadAttestationKeys();
  const env = {
    schema: "szl/replay-mismatch@1",
    run_id: runId,
    original_hash: anchored,
    replay_hash: replayed,
    diff_summary: diffSummary,
  };
  const sig = signBytes(Buffer.from(canonicalize(env as never)), keys);
  return {
    status: "mismatch",
    run_id: runId,
    original_hash: anchored,
    replay_hash: replayed,
    diff_summary: diffSummary,
    signing_key_fingerprint: keys.fingerprint,
    signature: sig,
    incident_record_url: `https://szlholdings.com/governance#incidents`,
  };
}

/** Quick stats for /api/governance/stats. */
export function publicStats(opts: { dataDir?: string } = {}): {
  anchored_total: number;
  last_anchored_at: string | null;
  agents: string[];
} {
  const store = getRunsStore({ dataDir: opts.dataDir });
  const runs = store.list();
  const lastAnchoredAt = runs.length > 0 ? runs[runs.length - 1].anchored_at : null;
  const agents = Array.from(new Set(runs.map((r) => r.agent_id)));
  return { anchored_total: runs.length, last_anchored_at: lastAnchoredAt, agents };
}

export { hashJson, canonicalize };
