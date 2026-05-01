#!/usr/bin/env node
/**
 * SZL Holdings — independent attestation verifier.
 *
 * Usage:
 *   node scripts/verify-attestation.mjs <run_id> [--base-url=https://szlholdings.com]
 *
 * What it does:
 *   1. Fetches the published Ed25519 public key from /.well-known/szl-attestation-keys.json
 *   2. POSTs the run_id to /api/v1/replay-attestation
 *   3. Re-canonicalizes the attestation envelope locally
 *   4. Verifies the Ed25519 signature against the published public key
 *   5. Prints MATCH / MISMATCH / UNKNOWN_RUN / ERROR
 *
 * Zero dependencies — uses only Node core (>=18). Anyone can run it.
 *
 * Exit codes:
 *   0 = signature verified AND status=match
 *   1 = signature verified BUT status=mismatch (anchored discrepancy)
 *   2 = unknown_run (no such anchored run)
 *   3 = transport / verification failure
 */

import { createPublicKey, verify as cryptoVerify } from "node:crypto";
import { argv, exit, stdout, stderr } from "node:process";

const args = argv.slice(2);
const runId = args.find((a) => !a.startsWith("--"));
const baseUrl = (args.find((a) => a.startsWith("--base-url=")) || "--base-url=http://localhost:3000").split("=")[1];

if (!runId) {
  stderr.write("Usage: node scripts/verify-attestation.mjs <run_id> [--base-url=https://szlholdings.com]\n");
  exit(3);
}

// Canonicalize JSON exactly as the server does (sorted keys, no whitespace).
// Same algorithm as @workspace/codex-kernel canonicalize().
function canonicalize(value) {
  if (value === null || typeof value === "boolean" || typeof value === "number") return JSON.stringify(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalize).join(",") + "]";
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalize(value[k])).join(",") + "}";
  }
  throw new Error("non-canonicalizable value: " + typeof value);
}

function reconstructPubKey(rawBase64) {
  const raw = Buffer.from(rawBase64, "base64");
  if (raw.length !== 32) throw new Error("Ed25519 public key must be 32 raw bytes; got " + raw.length);
  // Standard SPKI prefix for Ed25519 (12 bytes)
  const prefix = Buffer.from([0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00]);
  return createPublicKey({ key: Buffer.concat([prefix, raw]), format: "der", type: "spki" });
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

(async () => {
  try {
    stdout.write(`SZL Verify — base_url=${baseUrl}\n`);

    stdout.write("→ fetching public key...\n");
    const keys = await fetchJson(`${baseUrl}/api/.well-known/szl-attestation-keys.json`);
    if (!keys?.current?.public_key_raw_base64) {
      stderr.write("✗ No current public key published.\n");
      exit(3);
    }
    const pubRawB64 = keys.current.public_key_raw_base64;
    const expectedKid = keys.current.kid;
    stdout.write(`  algorithm=${keys.current.algorithm} kid=${expectedKid}\n`);

    stdout.write(`→ submitting run_id=${runId}...\n`);
    const att = await fetchJson(`${baseUrl}/api/v1/replay-attestation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ run_id: runId }),
    });

    if (att.status === "unknown_run") {
      stdout.write(`? UNKNOWN_RUN — ${att.note ?? ""}\n`);
      exit(2);
    }
    if (att.status === "mismatch") {
      stdout.write(`✗ MISMATCH — ${att.diff_summary}\n`);
      stdout.write(`  signature_kid=${att.signing_key_fingerprint}\n`);
      exit(1);
    }
    if (att.status !== "match") {
      stderr.write(`✗ unexpected status=${att.status}\n`);
      exit(3);
    }

    if (att.signing_key_fingerprint !== expectedKid) {
      stderr.write(`✗ KID mismatch: published=${expectedKid} attestation=${att.signing_key_fingerprint}\n`);
      exit(3);
    }

    // Reconstruct the canonical envelope EXACTLY as the server signs it.
    const envelope = {
      schema: "szl/replay-attestation@1",
      run_id: att.run_id,
      agent_id: att.agent_id,
      agent_version: att.agent_version,
      tenant: att.tenant,
      original_hash: att.original_hash,
      replay_hash: att.replay_hash,
      final_state_hash: att.ledger_anchor,
      ledger_anchor: att.ledger_anchor,
      ledger_height_at_run: att.ledger_height_at_run,
      ledger_height_at_replay: att.ledger_height_at_replay,
      replayed_at: att.replayed_at,
      kernel_version: att.kernel_version,
    };
    const canonicalBytes = Buffer.from(canonicalize(envelope));

    stdout.write("→ verifying Ed25519 signature locally...\n");
    const pubKey = reconstructPubKey(pubRawB64);
    const ok = cryptoVerify(null, canonicalBytes, pubKey, Buffer.from(att.signature, "base64"));
    if (!ok) {
      stderr.write("✗ Ed25519 signature INVALID — attestation cannot be trusted.\n");
      exit(3);
    }

    stdout.write("\n");
    stdout.write("✓ MATCH — attestation is genuine and the run is reproducible.\n");
    stdout.write(`  run_id        = ${att.run_id}\n`);
    stdout.write(`  agent         = ${att.agent_id}@${att.agent_version}\n`);
    stdout.write(`  original_hash = ${att.original_hash}\n`);
    stdout.write(`  replay_hash   = ${att.replay_hash}\n`);
    stdout.write(`  signing_key   = ${att.signing_key_fingerprint} (Ed25519)\n`);
    stdout.write(`  evidence      = ${att.evidence_url}\n`);
    exit(0);
  } catch (err) {
    stderr.write(`✗ verifier error: ${err?.message ?? String(err)}\n`);
    exit(3);
  }
})();
