# a11oy.UDS — Problem briefs (two one-pagers)

**Author:** Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
**Companion to:** `02_a11oy_uds_architecture.md`, `03_meshing_writeup.md`

---

## Brief 1 — Trusted AI/agent orchestration inside air-gapped UDS environments

**Problem statement (Stephen's words from the email):**
> *Defense-side operators want to run real LLM-driven agents inside
> air-gapped UDS clusters and have an evidence story that holds up to
> the program manager. They have strong image and chart provenance
> through Zarf and Cosign, strong identity through Keycloak, strong
> policy through Pepr — and no governed-agent runtime to mount on top
> of that surface.*

**Why it has been hard.**
The general-purpose LLM stacks are network-coupled by default: cloud
inference endpoints, cloud-side eval suites, cloud-side audit. Lifting
them into an air-gap usually means dropping the audit substrate and
saying "we'll log to a file." That trade is unacceptable to a defense
program. The right answer is a runtime that was *designed* to be
air-gap-native, with provenance, approval gates, and tool-call audit
baked into the substrate rather than layered on.

**What a11oy already does that addresses it.**
- Structural approval gates (`ApprovalQueue.tsx`,
  `platform/agent-gateway/`) — the gate cannot be configured around.
- Λ-9 invariant runtime (Doctrine V6 — 0.90 / 0.95 / 0.95 floor),
  payload-anchored at `packages/payload/raw/payload.json`.
- Append-only hash-chained proof ledger at `~/.a11oy-code/proof.jsonl`,
  hybrid Ed25519 + ML-DSA-65 signatures.
- Cross-implementation policy evaluation under real OPA
  (`platform/agent-gateway/tests/gateway-opa-live.test.ts`, 3 tests,
  pinned OPA v0.69.0).

**What changes under a11oy.UDS.**
- Approval gates fire through Pepr admission, not application code —
  no agent invocation reaches the workload without going through the
  UDS policy substrate (pepr #5027, merged).
- The proof ledger ships as a Zarf bundle sidecar at the well-known
  path `/uds-bundle/attestations.jsonl`, walkable offline by
  `uds-cli bundle verify --offline` (uds-cli #5026, merged).
- Agent identities are issued by Keycloak per agent class — no parallel
  identity provider.
- Tool-call audit lands in Loki and in the sidecar simultaneously,
  giving both the in-cluster operator and the offline verifier the
  same hash-chained record.

**Smallest credible demo (Week 2 of the proof plan).**
Drive a deliberately-bad agent invocation (claimed
moralGrounding = 0.92) at a stub Mission App on a Defense Unicorns
reference cluster. The Pepr admission module denies it with reason
exactly `MATURITY_GATE_BLOCKED`. Pull the network cable. Drive a
deliberately-good invocation. The approval gate fires; on approve, the
tool call executes; the proof ledger appends. Re-attach network. Ship
the sidecar to Andrew's laptop. `uds-cli bundle verify --offline`
returns `OK chain=clean entries=N signer=did:plat:szl-a11oy-prod`.

**Acceptance signal.**
The demo runs as a single contiguous take, with no cuts, and the
offline-verify exit code is 0.

---

## Brief 2 — A UDS-native artifact spine for AI

**Problem statement (Stephen's words from the email):**
> *Zarf already treats container images as first-class signed,
> versioned, attested artifacts with a promote / queue / discard
> lifecycle. Models, prompts, embeddings, agent definitions, and evals
> deserve the same treatment — and nobody has built that spine yet.
> Without it, a "good eval in dev" doesn't mean anything in prod, and
> drift on a deployed embedding bundle is invisible until a
> downstream incident.*

**Why it has been hard.**
AI artifacts don't fit the container shape cleanly. A model is too big
for a typical OCI flow without LFS, prompts are too small for SBOMs to
feel worthwhile, embeddings drift continuously without an obvious
"version bump" trigger, evals are usually informal scripts rather than
signed artifacts, and agent definitions live in YAML files that nobody
treats as deployable units. The instinct in the field has been to
build a parallel registry — but a parallel registry doesn't inherit
UDS's distribution substrate or its admission posture.

**What a11oy already does that addresses it.**
- A frontier registry and thesis-scoring layer (`pages/frontier/`,
  `pages/Frontier.tsx`) that already treats incoming AI artifacts as
  versioned, scored, lifecycled objects.
- A recalibration memo pipeline (`POST /api/helios/memos/generate`)
  that already produces weekly "what changed" feeds.
- The Λ-9 invariant runtime, which already evaluates artifacts against
  Doctrine V6 floors at decision time.
- Hash-chained ledger persistence riding on the same Postgres table
  family as `helios_recalibration_memos` (no new infra).

**What changes under a11oy.UDS.**
- The frontier registry becomes the `AIArtifact` CRD (sketch in
  `02_a11oy_uds_architecture.md` §5), with five `kind`s — model,
  prompt, embedding, agent, eval — and four lifecycle states —
  candidate, queued, promoted, discarded.
- Each artifact carries an OCI-registry SBOM and an in-toto
  attestation, identical in shape to the Zarf package flow.
- Lifecycle transitions are gated by Pepr admission against the Λ-9
  floor, mirroring container-image admission.
- Drift detection (cosine threshold for embeddings, eval-score
  threshold for evals, prompt-hash threshold for prompts) fires into
  the recalibration memo automatically.
- The memo becomes pullable per-cluster via a future
  `uds-cli memos pull` subcommand (Option C scope).

**Smallest credible demo (Week 3 of the proof plan).**
Stand up the `AIArtifact` CRD on the reference cluster. Promote one
artifact of each kind through candidate → queued → promoted. Seed a
small embedding drift on the promoted embedding bundle. Re-run the
recalibration memo. The memo names the drift, names the artifact,
names the threshold breach. Attempt to promote an eval whose
signature chain is broken; the admission gate denies the promotion
and the proof ledger records the denial.

**Acceptance signal.**
- All five `AIArtifact.kind`s round-trip the lifecycle.
- The drift seed surfaces in the next memo (≤ 24h after seed).
- The broken-signature promote attempt is denied with a structured
  Pepr error and is recorded in the proof ledger.

---

— Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
