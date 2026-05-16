/**
 * @szl-holdings/payload/server — Node-only entry.
 *
 * Loads the full raw bundle from packages/payload/raw/ via fs.readFileSync
 * at module init. NOT browser safe. Used by the api-server's /api/payload/*
 * routes and the integrity verification script.
 */

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

// When bundled into another package's dist/ (e.g. api-server/dist/server.mjs),
// `import.meta.url` no longer points at packages/payload/src/, so the default
// `../raw` resolution misses. Probe a series of candidates and use the first
// one that actually contains payload.json.
import { existsSync } from "node:fs";
const RAW_CANDIDATES: string[] = [
  resolve(HERE, "..", "raw"),
  resolve(HERE, "..", "..", "raw"),
  resolve(HERE, "..", "..", "..", "packages", "payload", "raw"),
  resolve(HERE, "..", "..", "..", "..", "packages", "payload", "raw"),
  resolve(process.cwd(), "packages", "payload", "raw"),
  resolve(process.cwd(), "..", "..", "packages", "payload", "raw"),
  resolve(process.cwd(), "..", "packages", "payload", "raw"),
];
function pickRawRoot(): string {
  for (const c of RAW_CANDIDATES) {
    try {
      if (existsSync(join(c, "payload.json"))) return c;
    } catch {
      // continue
    }
  }
  throw new Error(
    `@szl-holdings/payload: cannot locate raw/payload.json; probed: ${RAW_CANDIDATES.join(", ")}`,
  );
}
const RAW_ROOT = pickRawRoot();

function readJson<T = unknown>(rel: string): T {
  return JSON.parse(readFileSync(join(RAW_ROOT, rel), "utf8")) as T;
}

export interface FileIntegrityEntry {
  sha256: string;
  size_bytes: number;
}

export interface RawMasterPayload {
  schema_version: string;
  generated_at: string;
  generated_by: string;
  identity: Record<string, string>;
  doctrine: Record<string, unknown>;
  components: Record<string, unknown>;
  org_summary: Record<string, unknown>;
  push_queue_ready_one_way_doors: ReadonlyArray<unknown>;
  push_queue_blocked: ReadonlyArray<unknown>;
  file_integrity: Record<string, FileIntegrityEntry>;
  [k: string]: unknown;
}

export const MASTER: RawMasterPayload = readJson<RawMasterPayload>(
  "payload.json",
);
export const THESIS = readJson("dev1_thesis/thesis_payload.json");
export const RUNTIME = readJson("dev2_runtime/runtime_payload.json");
export const AGI_V5 = readJson("dev3_agi_v5/agi_v5_payload.json");
export const OPS = readJson("dev4_ops/ops_payload.json");
export const GITHUB_INVENTORY = readJson(
  "github_pro/github_inventory.json",
);
export const GITHUB_CLONE_MANIFEST = readJson(
  "github_pro/clone_manifest.json",
);

export const COMPONENTS = {
  master: MASTER,
  thesis: THESIS,
  runtime: RUNTIME,
  agi_v5: AGI_V5,
  ops: OPS,
  github: {
    inventory: GITHUB_INVENTORY,
    cloneManifest: GITHUB_CLONE_MANIFEST,
  },
} as const;

export const RAW_PAYLOAD_ROOT = RAW_ROOT;

export { DOCTRINE, ORG_SUMMARY, REPOS, PANEL_FACTS, DOI_LEDGER_COUNT } from "./index.js";
