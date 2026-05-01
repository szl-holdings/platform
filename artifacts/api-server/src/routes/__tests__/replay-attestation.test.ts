import { describe, expect, it, beforeEach, afterAll, vi } from "vitest";
import express, { type Express } from "express";
import request from "supertest";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { canonicalize } from "@workspace/codex-kernel";
import { verifyBytes } from "../../lib/public-runs/keys.js";

// Per-suite tmpdir keeps tests hermetic from any persisted dev state.
const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "szl-attestation-test-"));
process.env.SZL_PUBLIC_RUNS_DIR = TMP_DIR;

async function buildApp(): Promise<Express> {
  // Reset all module-level caches (key cache, runs-store cache, seed flag)
  // by invalidating the module graph and re-importing.
  vi.resetModules();
  const router = (await import("../replay-attestation.js")).default;
  const a = express();
  a.use(express.json());
  a.use("/api", router);
  return a;
}

beforeEach(() => {
  vi.resetModules();
});

afterAll(() => {
  try { fs.rmSync(TMP_DIR, { recursive: true, force: true }); } catch { /* ignore */ }
});

describe("replay-attestation route (Track C-02 — REAL)", () => {
  describe("POST /api/v1/replay-attestation", () => {
    it("returns 400 for missing run_id", async () => {
      const res = await request(await buildApp()).post("/api/v1/replay-attestation").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("invalid_run_id");
    });

    it("returns 400 for empty run_id", async () => {
      const res = await request(await buildApp()).post("/api/v1/replay-attestation").send({ run_id: "" });
      expect(res.status).toBe(400);
    });

    it("returns 400 for run_id > 256 chars", async () => {
      const res = await request(await buildApp()).post("/api/v1/replay-attestation").send({ run_id: "x".repeat(257) });
      expect(res.status).toBe(400);
    });

    it("returns status: unknown_run for an obviously-fake ID after seeding", async () => {
      const res = await request(await buildApp()).post("/api/v1/replay-attestation").send({ run_id: "this-id-is-not-anchored" });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("unknown_run");
      expect(res.body.run_id_received).toBe("this-id-is-not-anchored");
      expect(res.body.note).toMatch(/anchored/);
    });

    it("returns status: match for a real anchored run, with a verifiable Ed25519 signature", async () => {
      const a = await buildApp();
      const ex = await request(a).get("/api/v1/replay-attestation/example");
      expect(ex.status).toBe(200);
      expect(ex.body.run_id).toBeTruthy();

      const verify = await request(a).post("/api/v1/replay-attestation").send({ run_id: ex.body.run_id });
      expect(verify.status).toBe(200);
      expect(verify.body.status).toBe("match");
      // Codex-kernel chain hash is FNV1a64 (32 hex chars / 128 bits) — fast replay-determinism.
      // Cryptographic integrity is provided by the Ed25519 signature over the canonical envelope.
      expect(verify.body.original_hash).toMatch(/^[0-9a-f]{32}$/);
      expect(verify.body.replay_hash).toBe(verify.body.original_hash);
      expect(verify.body.signing_key_fingerprint).toMatch(/^[0-9a-f]{16}$/);
      expect(verify.body.signature).toBeTruthy();

      // Independent signature verification using the published public key.
      const keysRes = await request(a).get("/api/.well-known/szl-attestation-keys.json");
      expect(keysRes.status).toBe(200);
      const pubRaw = keysRes.body.current.public_key_raw_base64 as string;

      const envelope = {
        schema: "szl/replay-attestation@1",
        run_id: verify.body.run_id,
        agent_id: verify.body.agent_id,
        agent_version: verify.body.agent_version,
        tenant: verify.body.tenant,
        original_hash: verify.body.original_hash,
        replay_hash: verify.body.replay_hash,
        final_state_hash: verify.body.ledger_anchor,
        ledger_anchor: verify.body.ledger_anchor,
        ledger_height_at_run: verify.body.ledger_height_at_run,
        ledger_height_at_replay: verify.body.ledger_height_at_replay,
        replayed_at: verify.body.replayed_at,
        kernel_version: verify.body.kernel_version,
      };
      const ok = verifyBytes(Buffer.from(canonicalize(envelope as never)), verify.body.signature, pubRaw);
      expect(ok).toBe(true);
    });

    it("rate-limits after 5 requests in 1 minute", async () => {
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "test";
      try {
        const a = await buildApp();
        const id = "test-client-A";
        for (let i = 0; i < 5; i++) {
          const r = await request(a).post("/api/v1/replay-attestation").set("X-Test-Client-Id", id).send({ run_id: `r${i}` });
          expect(r.status).toBe(200);
          expect(r.headers["x-ratelimit-limit"]).toBe("5");
          expect(Number(r.headers["x-ratelimit-remaining"])).toBe(4 - i);
        }
        const blocked = await request(a).post("/api/v1/replay-attestation").set("X-Test-Client-Id", id).send({ run_id: "r6" });
        expect(blocked.status).toBe(429);
        expect(blocked.body.error).toBe("rate_limited");
        expect(blocked.body.retry_after).toBeGreaterThan(0);
        expect(blocked.headers["retry-after"]).toBeDefined();
      } finally {
        process.env.NODE_ENV = prevEnv;
      }
    });
  });

  describe("GET /api/governance/stats", () => {
    it("returns real anchored_total ≥ 1 after seeding, and last_trust_publish 2026-04-30", async () => {
      const res = await request(await buildApp()).get("/api/governance/stats");
      expect(res.status).toBe(200);
      expect(res.body.anchored_total).toBeGreaterThanOrEqual(1);
      expect(res.body.last_anchored_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(res.body.agents).toContain("TrustDocAttestor");
      expect(res.body.last_trust_publish).toBe("2026-04-30");
      expect(res.body.schema).toBe("szl/governance-stats@1");
    });
  });

  describe("GET /api/.well-known/szl-attestation-keys.json", () => {
    it("returns a real Ed25519 public key (PEM + raw base64 + fingerprint)", async () => {
      const res = await request(await buildApp()).get("/api/.well-known/szl-attestation-keys.json");
      expect(res.status).toBe(200);
      expect(res.body.issuer).toBe("SZL Holdings");
      expect(res.body.current).toBeTruthy();
      expect(res.body.current.algorithm).toBe("Ed25519");
      expect(res.body.current.kid).toMatch(/^[0-9a-f]{16}$/);
      expect(res.body.current.public_key_pem).toContain("BEGIN PUBLIC KEY");
      expect(res.body.current.public_key_raw_base64).toBeTruthy();
      // Raw Ed25519 public keys decode to exactly 32 bytes.
      expect(Buffer.from(res.body.current.public_key_raw_base64, "base64").length).toBe(32);
    });
  });
});
