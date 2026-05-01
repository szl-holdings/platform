import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import replayAttestationRouter from "../replay-attestation";

function app() {
  const a = express();
  a.use(express.json());
  a.use("/api", replayAttestationRouter);
  return a;
}

describe("replay-attestation route (Track C-02)", () => {
  describe("POST /api/v1/replay-attestation", () => {
    it("returns 400 for missing run_id", async () => {
      const res = await request(app()).post("/api/v1/replay-attestation").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("invalid_run_id");
    });

    it("returns 400 for empty run_id", async () => {
      const res = await request(app()).post("/api/v1/replay-attestation").send({ run_id: "" });
      expect(res.status).toBe(400);
    });

    it("returns 400 for run_id > 256 chars", async () => {
      const res = await request(app()).post("/api/v1/replay-attestation").send({ run_id: "x".repeat(257) });
      expect(res.status).toBe(400);
    });

    it("returns status: unknown_run for any submitted ID (no public runs anchored yet)", async () => {
      const res = await request(app()).post("/api/v1/replay-attestation").send({ run_id: "run_2026-04-30T14:08:12Z_a31f3c" });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("unknown_run");
      expect(res.body.run_id_received).toBe("run_2026-04-30T14:08:12Z_a31f3c");
    });

    it("rate-limits after 5 requests in 1 minute", async () => {
      // NODE_ENV=test enables the X-Test-Client-Id key path so we can isolate
      // this test from other suites. We do NOT trust X-Forwarded-For in prod.
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "test";
      try {
        const a = app();
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
    it("returns honest zeros + last_trust_publish 2026-04-30", async () => {
      const res = await request(app()).get("/api/governance/stats");
      expect(res.status).toBe(200);
      expect(res.body.anchored_24h).toBe(0);
      expect(res.body.replays_24h).toBe(0);
      expect(res.body.open_findings).toBe(0);
      expect(res.body.last_trust_publish).toBe("2026-04-30");
    });
  });

  describe("GET /.well-known/szl-attestation-keys.json", () => {
    it("returns issuer + null current key + empty history (key not yet generated)", async () => {
      const res = await request(app()).get("/api/.well-known/szl-attestation-keys.json");
      expect(res.status).toBe(200);
      expect(res.body.issuer).toBe("SZL Holdings");
      expect(res.body.current).toBeNull();
      expect(res.body.history).toEqual([]);
    });
  });
});
