// Public replay-attestation API route — Track C-02 (REAL implementation)
//
// What this route guarantees, post Phase 2:
//   - POST /api/v1/replay-attestation { run_id }
//       Looks up the run in the public ledger, re-executes the deterministic
//       agent (codex-kernel runLoop), verifies the trace (codex-kernel replay),
//       and returns an Ed25519-signed attestation envelope on match.
//   - GET /api/governance/stats
//       Returns REAL counts from the public ledger (anchored_total,
//       last_anchored_at, agents) plus the last_trust_publish marker.
//   - GET /api/.well-known/szl-attestation-keys.json
//       Returns the real Ed25519 public key (PEM + raw base64 + fingerprint),
//       generated/loaded at first request and persisted server-side.
//
// Per operational payload §4 hard constraint #3 ("no fake hashes/run IDs"):
// every value returned here is computed from real cryptography and the real
// codex-kernel primitives over public, replayable inputs.

import express, { type Request, type Response } from "express";
import { loadAttestationKeys } from "../lib/public-runs/keys.js";
import { attest, publicStats } from "../lib/public-runs/attestation.js";
import { ensureSeeded } from "../lib/public-runs/seed.js";
import { getRunsStore } from "../lib/public-runs/runs-store.js";
import { authMiddleware } from "../middlewares/auth";

const router = express.Router();
router.use(express.json({ limit: "1kb" }));

// All routes in this file are intentionally PUBLIC — anyone in the world must
// be able to verify attestations, fetch the published Ed25519 public key, and
// see aggregate ledger counts without authenticating. Without this, the auth
// middleware mounted at the app root would 401 anonymous verifiers.
const publicNoAuth = authMiddleware({ required: false });

// ---- Light per-IP rate limiter (5 req/min per IP) ----
type Bucket = { tokens: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

function rateLimit(req: Request, res: Response): boolean {
  // Use req.ip directly — Express resolves it via the trust-proxy setting at the
  // app level (production sets trust proxy = true behind the load balancer).
  // We deliberately do NOT trust X-Forwarded-For ourselves: an unconfigured app
  // would otherwise let any client spoof their key by sending the header.
  // Tests inject `req.ip` via Express's req-builder, but to keep them
  // deterministic we also accept an explicit `X-Test-Client-Id` header (test only).
  const testKey = process.env.NODE_ENV === "test" ? (req.headers["x-test-client-id"] as string | undefined) : undefined;
  const key = testKey || req.ip || "unknown";
  const now = Date.now();
  const bucket = buckets.get(key) ?? { tokens: RATE_LIMIT_MAX, resetAt: now + RATE_LIMIT_WINDOW_MS };
  if (now > bucket.resetAt) {
    bucket.tokens = RATE_LIMIT_MAX;
    bucket.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }
  res.setHeader("X-RateLimit-Limit", String(RATE_LIMIT_MAX));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));
  if (bucket.tokens <= 0) {
    res.setHeader("X-RateLimit-Remaining", "0");
    res.setHeader("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
    res.status(429).json({ error: "rate_limited", retry_after: Math.ceil((bucket.resetAt - now) / 1000) });
    buckets.set(key, bucket);
    return false;
  }
  bucket.tokens -= 1;
  res.setHeader("X-RateLimit-Remaining", String(bucket.tokens));
  buckets.set(key, bucket);
  return true;
}

// Lazy seed — first request triggers, subsequent requests no-op via the
// store's `isSeeded()` check. Wrapped in try/catch so a bad data dir or a
// missing trust doc does not 500 the whole route; the lookup itself will
// then return unknown_run truthfully.
function seedIfNeeded(): void {
  try { ensureSeeded(); } catch { /* see attestation.ts for honest fallback */ }
}

// ---- POST /api/v1/replay-attestation ----
router.post("/v1/replay-attestation", publicNoAuth, async (req: Request, res: Response) => {
  if (!rateLimit(req, res)) return;

  const body = (req.body ?? {}) as { run_id?: unknown };
  const runId = body.run_id;
  if (typeof runId !== "string" || runId.length === 0 || runId.length > 256) {
    return res.status(400).json({ error: "invalid_run_id", message: "run_id must be a non-empty string ≤ 256 chars" });
  }

  seedIfNeeded();
  const outcome = attest(runId);
  return res.json(outcome);
});

// ---- GET /api/governance/stats ----
router.get("/governance/stats", publicNoAuth, async (_req: Request, res: Response) => {
  seedIfNeeded();
  const stats = publicStats();
  return res.json({
    anchored_total: stats.anchored_total,
    last_anchored_at: stats.last_anchored_at,
    agents: stats.agents,
    last_trust_publish: "2026-04-30",
    schema: "szl/governance-stats@1",
  });
});

// ---- GET /.well-known/szl-attestation-keys.json ----
router.get("/.well-known/szl-attestation-keys.json", publicNoAuth, (_req: Request, res: Response) => {
  const keys = loadAttestationKeys();
  return res.json({
    issuer: "SZL Holdings",
    schema: "szl/attestation-keys@1",
    current: {
      kid: keys.fingerprint,
      algorithm: "Ed25519",
      use: "sig",
      public_key_pem: keys.publicKeyPem,
      public_key_raw_base64: keys.publicKeyRawBase64,
      generated_at: keys.generatedAt,
    },
    history: [],
    documentation: "https://szlholdings.com/governance",
    verifier_cli: "node scripts/verify-attestation.mjs <run_id>",
  });
});

// ---- GET /api/v1/replay-attestation/example — convenience for the frontend ----
router.get("/v1/replay-attestation/example", publicNoAuth, async (_req: Request, res: Response) => {
  seedIfNeeded();
  const store = getRunsStore();
  const first = store.list()[0];
  if (!first) {
    return res.status(503).json({ error: "no_runs_anchored", note: "Public ledger is empty; seeding may have failed." });
  }
  return res.json({
    run_id: first.run_id,
    agent_id: first.agent_id,
    doc_id: first.input.doc_id,
    note: "Submit this run_id to POST /api/v1/replay-attestation to verify a real signed match.",
  });
});

export default router;
