// Public replay-attestation API route — Track C-02
//
// Per operational payload §4 hard constraint #3: "No fake hashes, no fake run IDs".
// Until Ed25519 keys are generated and a canonical public run is anchored, the
// endpoint truthfully returns `unknown_run` for every submission and zero-valued
// public stats with `last_trust_publish: 2026-04-30`. The schema and the
// transport contract are the deliverable; the populated values arrive when
// codexKernel.replay()/signAttestation() and ledger.findRun() are wired to the
// real ledger and signing key (tracked under follow-up).
//
// Wired at routes/index.ts via:
//   router.use(lazyMatch(["/v1/replay-attestation", "/governance/stats", "/.well-known"], () => import("./replay-attestation"), "replay-attestation"));

import express, { type Request, type Response } from "express";

const router = express.Router();
router.use(express.json({ limit: "1kb" }));

// ---- Light per-IP rate limiter (5 req/min per IP) ----
type Bucket = { tokens: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

function rateLimit(req: Request, res: Response): boolean {
  const xff = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim();
  const ip = xff || req.ip || "unknown";
  const now = Date.now();
  const bucket = buckets.get(ip) ?? { tokens: RATE_LIMIT_MAX, resetAt: now + RATE_LIMIT_WINDOW_MS };
  if (now > bucket.resetAt) {
    bucket.tokens = RATE_LIMIT_MAX;
    bucket.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }
  if (bucket.tokens <= 0) {
    res.status(429).json({ error: "rate_limited", retry_after: Math.ceil((bucket.resetAt - now) / 1000) });
    buckets.set(ip, bucket);
    return false;
  }
  bucket.tokens -= 1;
  buckets.set(ip, bucket);
  return true;
}

// ---- POST /api/v1/replay-attestation ----
router.post("/v1/replay-attestation", async (req: Request, res: Response) => {
  if (!rateLimit(req, res)) return;

  const body = (req.body ?? {}) as { run_id?: unknown };
  const runId = body.run_id;
  if (typeof runId !== "string" || runId.length === 0 || runId.length > 256) {
    return res.status(400).json({ error: "invalid_run_id", message: "run_id must be a non-empty string ≤ 256 chars" });
  }

  // Honest behavior until canonical public runs are anchored: every run_id is unknown.
  // When ledger.findRun() + codexKernel.replay() are wired, this becomes a real lookup.
  return res.json({
    status: "unknown_run",
    run_id_received: runId,
    note: "No public runs are anchored to the ledger yet. The first canonical run will publish with the demo video (Track B).",
  });
});

// ---- GET /api/governance/stats ----
router.get("/governance/stats", async (_req: Request, res: Response) => {
  // Honest zeros + last_trust_publish from Track A doc reviews (2026-04-30).
  return res.json({
    anchored_24h: 0,
    replays_24h: 0,
    open_findings: 0,
    last_trust_publish: "2026-04-30",
    note: "Counters initialise at zero. They will populate once the public ledger is anchoring real production events.",
  });
});

// ---- GET /.well-known/szl-attestation-keys.json ----
router.get("/.well-known/szl-attestation-keys.json", (_req: Request, res: Response) => {
  return res.json({
    issuer: "SZL Holdings",
    current: null,
    history: [],
    documentation: "https://szlholdings.com/governance",
    note: "Ed25519 attestation keypair has not yet been generated and published. Until then, no signed attestations are issued. Tracked under operational payload Track C-02 §3.",
  });
});

export default router;
