# Track C-02 — Public Replay Attestation Endpoint (`/replay-attestation`)

**Document ID:** PROOF-C-02
**Target route (UI):** `/replay-attestation` on `artifacts/szl-holdings/`
**Target route (API):** `POST /api/v1/replay-attestation` on `artifacts/api-server/`
**Purpose:** A public, unauthenticated endpoint that lets anyone submit a SZL-issued run ID and get back a verifiable replay attestation. This is the single most discriminating piece of buyer-facing proof in the ecosystem.

---

## 1. Why this is the moat

Every AI vendor claims auditability. Almost none let you replay a production run end-to-end and get a verifiable hash back, in public, without a contract. This is hard to build for two reasons most vendors won't pay:

1. **Determinism.** The runtime has to be deterministic enough that a re-run produces the same result.
2. **Cryptographic anchoring.** The original run has to be hashed in a way that the replay can be verified against.

`codex-kernel` (the kernel that backs A11oy's deterministic execution) exists in part to provide this surface. This spec wires it to the public.

## 2. UI: `/replay-attestation`

### 2.1 Page elements

- Title: "Replay attestation"
- Sub: "Paste any SZL Holdings public run ID. We'll re-execute the run against the original inputs and return a hash you can verify."
- Input: textbox for run ID (placeholder `run_2026-04-30T14:08:12Z_a31f...`)
- Button: "Replay"
- Result panel (after submit):
  - Status: `match` | `mismatch` | `not_replayable_public` | `unknown_run`
  - Original hash (BLAKE3)
  - Replay hash (BLAKE3)
  - Signing fingerprint (Ed25519 public key fingerprint)
  - Timestamp
  - Two buttons: "Download attestation (JSON)", "Verify with our public key (CLI instructions)"
- Below: "How does this work?" expandable explainer (reuse content from C-01 §2.4)
- Below: "What can be replayed?" — note that **only public runs** are replayable from this page; tenant runs replay through the customer's authenticated console.

### 2.2 Threat model

The endpoint is public, so it must be:

- **Rate-limited** per IP and per run ID
- **Abuse-protected** against use as a free deterministic execution service (cap on concurrent replays per IP, cap on payload size)
- **Read-only** — no public run can be created via this endpoint, only replayed
- **Tenant-isolated** — public runs are explicitly tagged `public:true`; any other run returns `not_replayable_public`

## 3. API contract

### 3.1 Request

```http
POST /api/v1/replay-attestation
Content-Type: application/json

{
  "run_id": "run_2026-04-30T14:08:12Z_a31f3c..."
}
```

### 3.2 Response — match

```json
{
  "status": "match",
  "run_id": "run_2026-04-30T14:08:12Z_a31f3c...",
  "agent_id": "compliance-watcher",
  "agent_version": "1.0.4",
  "tenant": "public",
  "original_hash": "blake3:78c2a31f...",
  "replay_hash": "blake3:78c2a31f...",
  "signing_key_fingerprint": "ed25519:9a:b3:...",
  "signature": "base64:...",
  "ledger_anchor": "blake3:c0ffee...",
  "ledger_height_at_run": 142875,
  "ledger_height_at_replay": 287123,
  "replayed_at": "2026-04-30T14:09:01Z",
  "kernel_version": "codex-kernel@2.4.1",
  "evidence_url": "https://szlholdings.com/governance/anchor/c0ffee..."
}
```

### 3.3 Response — mismatch (rare; published if it happens)

```json
{
  "status": "mismatch",
  "run_id": "...",
  "original_hash": "blake3:...",
  "replay_hash": "blake3:...",
  "diff_summary": "step:summarize.output_tokens differ at index 142",
  "signing_key_fingerprint": "ed25519:...",
  "signature": "base64:...",
  "incident_record_url": "https://szlholdings.com/governance/incidents/2026-04-30-replay-mismatch"
}
```

A mismatch on a public run is itself a high-severity event. We commit to publishing the incident record automatically rather than hiding the result.

### 3.4 Response — not replayable

```json
{
  "status": "not_replayable_public",
  "reason": "Run is tenant-scoped; replay must be performed in the tenant's authenticated console.",
  "tenant_console_help": "https://szlholdings.com/docs/replay-attestation-tenant"
}
```

### 3.5 Response — unknown run

```json
{
  "status": "unknown_run",
  "run_id_received": "..."
}
```

### 3.6 Errors

- 400 — malformed input
- 429 — rate-limited (response includes `retry_after`)
- 503 — replay service paused (with reason)

## 4. Implementation

### 4.1 Backend route

Add to `artifacts/api-server/src/routes/replay-attestation.ts`:

```ts
import express from "express";
import { codexKernel } from "@szl/codex-kernel";
import { ledger } from "@szl/aef-evidence-ledger";
import { rateLimit } from "../middleware/rate-limit";

const router = express.Router();

router.post(
  "/api/v1/replay-attestation",
  rateLimit({ windowMs: 60_000, max: 5, keyGenerator: (req) => req.ip }),
  async (req, res) => {
    const { run_id } = req.body || {};
    if (typeof run_id !== "string" || run_id.length > 256) {
      return res.status(400).json({ error: "invalid_run_id" });
    }

    const run = await ledger.findRun(run_id);
    if (!run) return res.json({ status: "unknown_run", run_id_received: run_id });
    if (!run.public) {
      return res.json({
        status: "not_replayable_public",
        reason: "Run is tenant-scoped; replay must be performed in the tenant's authenticated console.",
        tenant_console_help: "https://szlholdings.com/docs/replay-attestation-tenant",
      });
    }

    const replay = await codexKernel.replay(run);
    const sig = await codexKernel.signAttestation({
      run_id,
      original_hash: run.hash,
      replay_hash: replay.hash,
      ledger_height_at_run: run.ledger_height,
      ledger_height_at_replay: replay.ledger_height,
    });

    if (run.hash === replay.hash) {
      return res.json({
        status: "match",
        run_id,
        agent_id: run.agent_id,
        agent_version: run.agent_version,
        tenant: "public",
        original_hash: run.hash,
        replay_hash: replay.hash,
        signing_key_fingerprint: sig.fingerprint,
        signature: sig.signature,
        ledger_anchor: run.anchor,
        ledger_height_at_run: run.ledger_height,
        ledger_height_at_replay: replay.ledger_height,
        replayed_at: new Date().toISOString(),
        kernel_version: codexKernel.version,
        evidence_url: `https://szlholdings.com/governance/anchor/${run.anchor}`,
      });
    }

    // mismatch — auto-incident
    const incident = await ledger.openIncident({
      kind: "public_replay_mismatch",
      run_id,
      original_hash: run.hash,
      replay_hash: replay.hash,
      diff: replay.diffSummary(run),
    });
    return res.json({
      status: "mismatch",
      run_id,
      original_hash: run.hash,
      replay_hash: replay.hash,
      diff_summary: replay.diffSummary(run),
      signing_key_fingerprint: sig.fingerprint,
      signature: sig.signature,
      incident_record_url: `https://szlholdings.com/governance/incidents/${incident.id}`,
    });
  },
);

export default router;
```

### 4.2 Public-key publication

The Ed25519 verification public key is published at three locations:

- `https://szlholdings.com/.well-known/szl-attestation-keys.json`
- The page footer of `/governance`
- The repo at `docs/security/attestation-keys.md` with full fingerprint history

### 4.3 CLI helper

Ship a tiny verifier in `packages/szl-attest-cli`:

```bash
$ npx @szl/attest verify ./attestation.json
✓ signature valid (ed25519:9a:b3:...)
✓ original_hash matches replay_hash
✓ ledger anchor confirmed (height 142875)
```

### 4.4 Caching

Successful match responses are cached for 24 hours; mismatch responses are not cached. The cache key is the run ID.

### 4.5 Designating a run "public"

A run is public only if:

1. The agent definition lives in `agents/public/` in the canonical repo.
2. The agent's domain profile is in `aef-domain-profiles/public/`.
3. The run was executed against publicly available data sources only (Katzilla T1 feeds).
4. The run is anchored in a special public-tenant ledger partition.

The 90-second demo run is the first such public run. We expect to add a small handful per quarter (e.g., a daily federal-monitoring run, a weekly threat-feed-summary run).

## 5. Acceptance criteria

- `POST /api/v1/replay-attestation` returns the contract in §3 for a known public run ID.
- Replay is < 30 seconds wall-clock for canonical demo agents.
- Rate limiting fires correctly under abuse; verified by integration test.
- Public-key endpoint serves stable JSON.
- A non-SZL engineer can verify a downloaded attestation using only the published public key + the `npx @szl/attest verify` command, in under 5 minutes from cold.
- Mismatch path auto-creates an incident record and surfaces it on `/governance`.

## 6. Failure modes and disclosures

- **Replay service paused for maintenance** — endpoint returns 503 with a human-readable reason. We do not silently degrade.
- **Non-determinism in upstream model.** Foundation-model providers occasionally introduce non-determinism. Public agents pin the model and use temperature 0; if a provider breaks the pin, the run becomes `not_replayable_public` until SZL updates the agent's pinned version. The version change is itself logged and dated.
- **Ledger pruning.** We commit to retaining all public-tenant ledger rows indefinitely. Tenant rows follow the customer's retention policy.

## 7. The first 5 things to wire

1. Confirm `codex-kernel.replay()` exists and returns a hash today; if not, scaffold it with a deterministic re-execution against pinned inputs.
2. Confirm `aef-evidence-ledger.findRun()` exists.
3. Implement `signAttestation` with an Ed25519 key whose public half is published.
4. Add the route, the rate limiter, the unit tests.
5. Run the canonical demo agent once and capture the run ID for public reuse in the demo video.
