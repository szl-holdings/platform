/**
 * JSONL-backed store for canonical public runs.
 *
 * Storage layout:
 *   <DATA_DIR>/runs/runs.jsonl   — one canonical run per line (append-only)
 *   <DATA_DIR>/runs/index.json   — { run_id -> file offset } for O(1) lookup
 *
 * Each line is one PublicRunRecord, fully self-contained: input, output_hash,
 * the kernel trace, the proof ledger, and the agent metadata. That makes the
 * file independently replayable by any third party who has the file + the
 * public key.
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { TraceEvent, ProofLedgerEntry } from "@workspace/codex-kernel";
import type { PublicAgentInput, AgentState } from "./agent.js";

export interface PublicRunRecord {
  run_id: string;
  agent_id: "TrustDocAttestor";
  agent_version: "1.0.0";
  tenant: "public";
  anchored_at: string;
  input: PublicAgentInput;
  final_state: AgentState;
  output_hash: string;
  /** Hash chain head — the kernel's final state hash. */
  final_state_hash: string;
  /** Immutable record of every step (replay reproduces this exactly). */
  trace: TraceEvent[];
  /** Append-only proof ledger entries (one per committed step). */
  proof_ledger: ProofLedgerEntry[];
  kernel_version: string;
}

export interface RunsStore {
  list(): PublicRunRecord[];
  get(runId: string): PublicRunRecord | null;
  count(): number;
  append(record: PublicRunRecord): void;
  isSeeded(): boolean;
}

class FsJsonlRunsStore implements RunsStore {
  private records: Map<string, PublicRunRecord> = new Map();
  private orderedIds: string[] = [];
  private loaded = false;

  constructor(private readonly dataDir: string) {}

  private runsFile(): string { return path.join(this.dataDir, "runs", "runs.jsonl"); }

  private ensureLoaded(): void {
    if (this.loaded) return;
    const file = this.runsFile();
    if (fs.existsSync(file)) {
      const text = fs.readFileSync(file, "utf8");
      for (const line of text.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const rec = JSON.parse(trimmed) as PublicRunRecord;
          if (!this.records.has(rec.run_id)) {
            this.records.set(rec.run_id, rec);
            this.orderedIds.push(rec.run_id);
          }
        } catch {
          // Skip malformed lines but keep going — append-only file.
        }
      }
    }
    this.loaded = true;
  }

  list(): PublicRunRecord[] {
    this.ensureLoaded();
    return this.orderedIds.map((id) => this.records.get(id)!).filter(Boolean);
  }

  get(runId: string): PublicRunRecord | null {
    this.ensureLoaded();
    return this.records.get(runId) ?? null;
  }

  count(): number {
    this.ensureLoaded();
    return this.records.size;
  }

  isSeeded(): boolean {
    this.ensureLoaded();
    return this.records.size > 0;
  }

  append(record: PublicRunRecord): void {
    this.ensureLoaded();
    if (this.records.has(record.run_id)) {
      throw new Error(`run_id already anchored: ${record.run_id}`);
    }
    const dir = path.dirname(this.runsFile());
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(this.runsFile(), JSON.stringify(record) + "\n");
    this.records.set(record.run_id, record);
    this.orderedIds.push(record.run_id);
  }
}

let cachedStore: RunsStore | null = null;
let cachedDataDir: string | null = null;

function defaultDataDir(): string {
  return (
    process.env.SZL_PUBLIC_RUNS_DIR ||
    path.resolve(process.cwd(), "..", "..", ".szl-public-runs")
  );
}

export function getRunsStore(opts: { dataDir?: string } = {}): RunsStore {
  const dataDir = opts.dataDir || defaultDataDir();
  if (cachedStore && cachedDataDir === dataDir) return cachedStore;
  cachedStore = new FsJsonlRunsStore(dataDir);
  cachedDataDir = dataDir;
  return cachedStore;
}

/** Test-only: clear the cached store so a different dataDir can be picked up. */
export function _clearRunsStoreCache(): void {
  cachedStore = null;
  cachedDataDir = null;
}

/**
 * Build a run_id that is FULLY content-addressable across the whole run identity:
 * the deterministic kernel output_hash, the agent identity, and the kernel version.
 *
 * Format: run_<doc_id>_<run_identity_sha256[:16]>
 *
 * Why output_hash and not doc-text-hash:
 *   The earlier implementation derived the suffix from the input doc text only,
 *   so two semantically different runs over the same doc (e.g., a future agent
 *   or kernel revision producing different output) would map to the same run_id.
 *   That is not actually content-addressable — it's input-addressable. Including
 *   the output_hash + agent + kernel ties the run_id to the full computation
 *   identity, so any change in the agent code, kernel version, or output state
 *   produces a new run_id. Idempotent re-runs (same inputs, same code) still
 *   collapse to the same id.
 *
 * 16 hex chars = 64 bits of suffix entropy (collision-resistant for the public
 * ledger's expected size; the doc_id prefix further partitions the space).
 */
export function buildRunId(args: {
  doc_id: string;
  output_hash: string;
  agent_id: string;
  agent_version: string;
  kernel_version: string;
}): string {
  const identity = JSON.stringify({
    doc_id: args.doc_id,
    output_hash: args.output_hash,
    agent_id: args.agent_id,
    agent_version: args.agent_version,
    kernel_version: args.kernel_version,
  });
  const suffix = createHash("sha256").update(identity).digest("hex").slice(0, 16);
  return `run_${args.doc_id}_${suffix}`;
}
