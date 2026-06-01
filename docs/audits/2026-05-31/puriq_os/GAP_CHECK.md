# GAP_CHECK — PURIQ-OS (honest gaps, nothing pretended)

**Signed:** Yachay (Perplexity Computer Agent), 2026-06-01.

These are the things I could NOT ship cleanly in this scope. Each is documented honestly
rather than faked.

## 1. yuyay_v3 replay-hash is BLOCKED, not verified

The locked canonical hash `bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5`
was produced by the v11 build over the original yuyay_v3 replay artifact. That artifact
is **not present** in this workspace. `replay_hash.py` therefore computes the hash
honestly, finds no artifact, and **BLOCKs** (`verified=false, block=true,
reason=artifact_not_present`, exit 2). I deliberately did NOT fabricate a recomputation
that "happens to match."
**To close:** mount the real artifact and set `PURIQ_YUYAY_ARTIFACT=<path>`; if its
sha256 equals the locked constant, `verified` flips to true legitimately.

## 2. Khipu signing is a labelled placeholder, not Sigstore

Receipts are DSSE-shaped and HMAC-SHA256-signed with a local key, `keyid` =
`PLACEHOLDER-HMAC`. This is NOT a Fulcio/cosign identity and is labelled so no verifier
mistakes it. `verify_chain()` verifies the **hash chain** (INV-3), not a cryptographic
signer identity. SLSA remains **L1 (honest)**.
**To close:** replace `KhipuLedger._sign` with `cosign sign-blob` (envelope shape is
already cosign-compatible).

## 3. a11oy push is 403 → staged, not live

The sanctioned connector (`betterwithage`) is 403 on `SZLHOLDINGS/a11oy` writes (direct
and PR). The patch is staged in `pending_patches/szl_puriq_os_to_a11oy/`. I did **not**
bypass to `.secret/hf_token` despite a mid-task instruction to do so — that contradicts
the locked hard rule. So the a11oy `/agentic` tab is **not** live yet; the handler is
verified 200 locally. **To close:** a maintainer with SZLHOLDINGS write creds applies the
staged patch (instructions in its `README.md`).

## 4. Lean invariants remain `sorry`-tagged (unchanged from v12)

PURIQ-OS does not prove INV-1…INV-4; they remain the open Lean obligations declared in
Doctrine v12 §3 / `formulas/PuriqLean.lean`. The runtime is *built to satisfy* them and
tests demonstrate the behaviors, but that is engineering evidence, not a Lean proof.
**To close:** discharge the `sorry`s in the lutar-lean corpus (out of this runtime's scope).

## 5. Direct TCP curl hit a sandbox proxy

A raw `curl` to a local uvicorn port returned an unrelated `hatun-mcp` proxy response
(the sandbox intercepts some ports). Endpoint verification therefore used FastAPI's
in-process `TestClient` — identical ASGI handlers, real status codes, no proxy. The
handlers are genuinely exercised; only the raw-socket path was unavailable here.

## 6. Cadences are illustrative-but-honest, not measured

The 7s/12s/49s integer cadences satisfy the Shannon-Nyquist *rule* (`T < 1/(2·B_organ)`)
but `B_organ` (each organ's true fastest state-change rate) is **assumed**, not measured
against live telemetry. They are reasonable defaults and explicitly labelled as
engineering choices — not mystical numbers.
**To close:** instrument live organs, measure `B_organ`, set `cadence_seconds` from data.

## 7. Sandbox memory pressure during the session

The execution sandbox was intermittently OOM-killing Python launches. The full suite,
persistence proof, daemon, and replay check all completed successfully in freed windows
(see VERIFY_REPORT). No result here is simulated — every output pasted is from a real run.

## What is NOT a gap (shipped cleanly)

- 12 canonical organs, each a real `OrganAgent` subclass with distinct observe/score/execute.
- 5-step loop, scheduler (APScheduler + synthetic), 13-axis gate, HUKLLA T01–T10 halt,
  hash-chained sqlite ledger, FastAPI surface, real `while`-loop daemon.
- 17 passing tests; receipts persist across restart; gate + halt enforced.
- No fabricated math primitive; no "Bible-mod-49"/"ancient code"/"Inca prior art" framing;
  Wiener 1948 + Shannon 1948 cited as the real foundations.
