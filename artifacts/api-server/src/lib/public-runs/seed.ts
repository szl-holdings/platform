/**
 * Seed canonical public runs at first use.
 *
 * Idempotent: anchors one run per trust doc using a content-addressable run_id
 * (run_<doc_id>_<sha-prefix>). Re-running is a no-op once seeded.
 *
 * This is what makes /governance/stats and /replay-attestation return REAL
 * numbers and a REAL match instead of stubs. Lazy by design — invoked on
 * first request, not at boot, to keep cold-starts cheap and tests trivial.
 */

import { PUBLIC_TRUST_DOC_IDS, executeCanonicalRun } from "./agent.js";
import { getRunsStore, buildRunId, type PublicRunRecord } from "./runs-store.js";

let seeding = false;
let seeded = false;

export interface SeedReport {
  total_anchored: number;
  newly_anchored: number;
  skipped: number;
  failed: Array<{ doc_id: string; error: string }>;
}

const ANCHORED_AT_FIXED = "2026-04-30T00:00:00.000Z"; // Stable timestamp for content-addressable records.
const KERNEL_VERSION = "@workspace/codex-kernel@0.x";

export function ensureSeeded(opts: { dataDir?: string; force?: boolean } = {}): SeedReport {
  const store = getRunsStore({ dataDir: opts.dataDir });

  if (!opts.force && (seeded || store.isSeeded())) {
    seeded = true;
    return { total_anchored: store.count(), newly_anchored: 0, skipped: PUBLIC_TRUST_DOC_IDS.length, failed: [] };
  }

  if (seeding) {
    return { total_anchored: store.count(), newly_anchored: 0, skipped: 0, failed: [{ doc_id: "*", error: "seed already in progress" }] };
  }

  seeding = true;
  let newly = 0;
  let skipped = 0;
  const failed: SeedReport["failed"] = [];
  try {
    for (const docId of PUBLIC_TRUST_DOC_IDS) {
      try {
        const { input, result, outputHash } = executeCanonicalRun(docId);
        const runId = buildRunId({
          doc_id: input.doc_id,
          output_hash: outputHash,
          agent_id: "TrustDocAttestor",
          agent_version: "1.0.0",
          kernel_version: KERNEL_VERSION,
        });
        if (store.get(runId)) { skipped++; continue; }
        const record: PublicRunRecord = {
          run_id: runId,
          agent_id: "TrustDocAttestor",
          agent_version: "1.0.0",
          tenant: "public",
          anchored_at: ANCHORED_AT_FIXED,
          input,
          final_state: result.final_state,
          output_hash: outputHash,
          final_state_hash: result.summary.final_state_hash,
          trace: result.trace,
          proof_ledger: result.ledger.slice(),
          kernel_version: KERNEL_VERSION,
        };
        store.append(record);
        newly++;
      } catch (err) {
        failed.push({ doc_id: docId, error: (err as Error).message });
      }
    }
  } finally {
    seeding = false;
    seeded = true;
  }

  return { total_anchored: store.count(), newly_anchored: newly, skipped, failed };
}

export function _resetSeedState(): void { seeded = false; seeding = false; }

/** Returns the first anchored run_id (for the page's "try this" example). */
export function exampleRunId(opts: { dataDir?: string } = {}): string | null {
  const store = getRunsStore({ dataDir: opts.dataDir });
  const runs = store.list();
  return runs[0]?.run_id ?? null;
}
