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

// When bundled into another package's dist/ (e.g. api-server/dist/index.mjs),
// `import.meta.url` no longer points at packages/payload/src/, so the
// in-package `../raw` resolution would land on the consumer's own directory
// (e.g. `artifacts/api-server/raw`). Instead, walk up from HERE and from
// process.cwd() looking for `packages/payload/raw/payload.json` — this is the
// canonical location and the package's `files` glob ships it.
import { existsSync } from "node:fs";

function walkUpForPayloadRaw(start: string): string | null {
  let cur = resolve(start);
  for (let i = 0; i < 12; i += 1) {
    const candidate = join(cur, "packages", "payload", "raw");
    if (existsSync(join(candidate, "payload.json"))) return candidate;
    const parent = dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return null;
}

function pickRawRoot(): string {
  const probed: string[] = [];
  for (const start of [HERE, process.cwd()]) {
    const found = walkUpForPayloadRaw(start);
    if (found) return found;
    probed.push(start);
  }
  throw new Error(
    `@szl-holdings/payload: cannot locate packages/payload/raw/payload.json; walked up from: ${probed.join(", ")}`,
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
