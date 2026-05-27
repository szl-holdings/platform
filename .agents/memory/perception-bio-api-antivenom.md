---
name: Perception-bio API antivenom (nonce + freshness window)
description: How the /perception/verify endpoint enforces "no frames, only feature vectors" and rejects replay/forgery/stale-capture at the route boundary.
---

The perception/bio API surface (`/perception`, `/sequence-pipeline`,
`/peak-detector`, `/procedural-kit`) in `api-server` is the only place
those three shared packages are reachable from non-trusted callers. Two
non-obvious contracts to preserve when touching it:

## 1. Antivenom: nonce ttl == freshness window, by construction

`POST /perception/verify` requires a server-issued, single-use nonce
from `POST /perception/nonce`. The nonce's `expiresAt` **is** the
freshness window — they are the same number (`PERCEPTION_FRESHNESS_WINDOW_MS`,
default 30s). The verify route additionally rejects a nonce when the
client's `capturedAt` falls outside `[issuedAt-1s, expiresAt+1s]` —
this is what blocks the "fresh nonce, stale capture" spoof.

**Why:** if you let the window be longer than the nonce ttl, you have
to maintain two independently-tunable knobs and a forgotten attacker
can replay inside the looser one. Tying them together collapses the
attack surface to a single dial.

**How to apply:** don't introduce a separate `MAX_CAPTURE_AGE_MS`
constant. If you need a longer client window, raise
`PERCEPTION_FRESHNESS_WINDOW_MS` and accept the nonce-table growth.

## 2. Server never sees frames — only feature vectors

The verify schema is intentionally a *summary* of a
`PerceptionEnvelope`: per-head detection **counts** (no boxes, no
keypoints, no image data), the client-computed liveness confidence,
and a frame hash. The route reconstructs a stub envelope with empty
detection objects purely so `summariseDetections()` produces the same
shape the client built — this is for receipt provenance, not for
re-running detection.

**Why:** the perception package was specced so frames stay on-device.
The receipt class `perception.envelope.v1` is meaningful as a witness
of what the client computed, not as raw evidence the server can
re-derive.

**How to apply:** never add frame-bearing fields (base64 image,
keypoints, boxes) to `FeatureVectorSchema`. If you need richer
analysis, do it client-side and add the result to the summary, not the
raw pixels.

## 3. Doctrine V6 pillar tags live in `policyReason`

`ProofEnvelope` has no native `pillar` field, so this surface encodes
both pillar and receipt class in `policyReason` as
`pillar:<P>;receipt:<R>`. Downstream audit can filter on the string
without a schema migration.

**Why:** avoided changing `shared-contracts` for one cross-cutting
metadata field that only matters for Doctrine V6 reporting.

**How to apply:** if you add a new endpoint here, follow the same
encoding via `emitLedger({ pillar, receiptClass, ... })`. If you ever
add a real pillar field to `ProofEnvelope`, migrate all five entries
in this route together.
