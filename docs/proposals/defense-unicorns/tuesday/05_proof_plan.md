# a11oy.UDS — Option A 2–3 week proof plan

**Author:** Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
**Companion to:** `03_meshing_writeup.md`, `04_problem_briefs.md`
**Scope:** Option A only — a11oy.UDS as a Zarf bundle payload deployed
onto a Defense Unicorns reference UDS cluster. Options B and C are
follow-ups gated on Andrew's response to this proof.

---

## Pre-flight (Day 0)

Done by SZL before Week 1 starts. Does not block kickoff.

- The three Zarf packages and the top-level UDS bundle are already
  merged under `docs/proposals/defense-unicorns/szl-holdings/`.
  Reference: #5028.
- `uds-cli` in-bundle attestation manifest is merged: PR #5026.
  Surface: `uds-cli bundle create --attest`, `uds-cli bundle verify
  --offline`. See `docs/proposals/defense-unicorns/05_two_fixes.md`
  §Fix A.
- `pepr` Λ-floor admission module is merged: PR #5027. Surface:
  `lambda-floor` capability + `AgentInvocation` CRD. See
  `docs/proposals/defense-unicorns/05_two_fixes.md` §Fix B.
- OPA cross-implementation test pack present at
  `platform/agent-gateway/tests/gateway-opa-live.test.ts` with
  pinned OPA v0.69.0 via
  `platform/agent-gateway/scripts/install-opa.sh`.
- Doctrine V6 payload anchored at
  `packages/payload/raw/payload.json` (replay root
  `1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b`).
- Tracking: #5118 (publish) and #5119 (validate) are open for the
  remaining upstream housekeeping; both are out of scope for this
  proof but are listed here so Andrew can see the surface.

## Week 1 — Bundle, identity, observability

**Objective:** a11oy.UDS deployed on a real UDS reference cluster,
behind real Keycloak SSO, behind the real Istio tenant gateway, with
real Loki/Prometheus ingest.

| Day | Milestone |
| --- | --------- |
| Mon | Receive Defense Unicorns reference cluster credentials and Keycloak realm details. Cut a `release/uds-week-1` tag of the bundle. |
| Tue | `uds-cli bundle deploy` of the three-package bundle. NetworkPolicies validated against UDS-default-deny. |
| Wed | Keycloak realm wired into a11oy login flow. SSO round-trip verified end-to-end (operator logs in, lands in a11oy home, identity claims surface in the request log). |
| Thu | Istio tenant gateway routes verified for `/`, `/api`, `/uds`. Loki/Prometheus exporters confirmed receiving from a11oy namespace. |
| Fri | End-of-week artifact captured. Sync with Defense Unicorns side for the Week 2 Mission App target. |

**End-of-week artifact:** Screenshot of the a11oy home page on the
reference cluster, served through the tenant gateway after Keycloak
SSO, with the matching request line visible in Loki.

**Success criteria for the week:**
- `uds-cli bundle deploy` exits 0.
- Keycloak SSO round-trip works for at least one Defense Unicorns
  test operator and one SZL operator.
- All three a11oy services (web, api, gateway) are routable through
  the Istio tenant gateway.
- No uds-core modifications were made to land the bundle.

## Week 2 — Approval gates, Λ-9 admission, audit chain

**Objective:** Demonstrate the trusted-orchestration story (Problem 1)
end-to-end with a real agent invocation against a Defense Unicorns–
selected stub Mission App.

| Day | Milestone |
| --- | --------- |
| Mon | `lambda-floor` Pepr capability (pepr #5027) enabled in the reference cluster's uds-core capability list. |
| Tue | `AgentInvocation` CR shape wired to the a11oy approval queue. Deliberate-bad invocation (moralGrounding = 0.92) drives the denial path; `MATURITY_GATE_BLOCKED` observed in admission webhook log. |
| Wed | Deliberate-good invocation drives the approval queue prompt. Human operator approves; the tool call executes against the stub Mission App. |
| Thu | Network cable pulled. Three offline invocations executed. Proof-ledger sidecar accumulates all three. |
| Fri | Network restored. Sidecar shipped to a Defense Unicorns verifier laptop. `uds-cli bundle verify --offline` returns `OK chain=clean entries=N signer=did:plat:szl-a11oy-prod`. End-of-week artifact captured. |

**End-of-week artifact:** The proof-ledger sidecar
(`attestations.jsonl`) from the cluster, plus a recorded terminal of
`uds-cli bundle verify --offline` against it on a clean machine.

**Success criteria for the week:**
- Pepr denial fires with exact reason `MATURITY_GATE_BLOCKED` on the
  bad invocation, and the failing axis name + value are in the error
  body.
- Approval queue gate fires on the good invocation, and the gate
  cannot be bypassed via the CR `spec`.
- All offline invocations are present in the sidecar with
  monotonically increasing `i` and unbroken `prev_hash`.
- `verify --offline` exits 0.

## Week 3 — Artifact spine

**Objective:** Demonstrate the artifact-spine story (Problem 2) for
all five AI artifact kinds: model, prompt, embedding, agent, eval.

| Day | Milestone |
| --- | --------- |
| Mon | `AIArtifact` CRD applied to the reference cluster. (Spec in `02_a11oy_uds_architecture.md` §5.) |
| Tue | Promote one of each kind from `candidate` → `queued` → `promoted`. Each artifact carries an OCI SBOM and an in-toto attestation. |
| Wed | Seed a small embedding drift (cosine delta 0.08 against the `driftPolicy.threshold` of 0.06). Re-run the recalibration memo. |
| Thu | Attempt promotion of an `eval` whose Cosign signature chain is broken. Pepr admission denies; proof ledger records the denial. |
| Fri | End-of-Week-3 demo recorded as a single contiguous take ≤ 5 minutes. 30-minute review window with Andrew. |

**End-of-week artifact:**
1. A `≤ 5-min` recorded walkthrough of: deploy → SSO → bad invocation →
   approval gate → good invocation → offline verify → AIArtifact
   promote → drift surface → broken-signature denial.
2. The final proof-ledger sidecar from the end-to-end run.

**Success criteria for the week:**
- All five `AIArtifact.kind`s round-trip the lifecycle.
- The seeded drift surfaces in the next recalibration memo within
  24 hours.
- The broken-signature promote is denied with a structured Pepr error
  and is recorded in the proof ledger.
- The walkthrough is a single take — no cuts, no "imagine that this
  works."

## What we ask from Defense Unicorns

| Ask | When needed | Why |
| --- | ----------- | --- |
| Reference UDS cluster credentials + Keycloak realm | Day 1 of Week 1 | Required for any of Week 1 to start. |
| Mission App target (stub is fine; bland-but-real is best) | End of Week 1 | Required to wire Week 2 against a real workload. |
| 30-minute review window with Andrew | End of Week 3 | The proof point is a conversation, not a deliverable drop. |
| Thumbs-up to schedule Option C scoping | Post-review | Gating signal for the Option B/C follow-up tasks. |

## Demo script for the working session (end of Week 3)

Total: 25 minutes of demo + 5 minutes of Q&A.

1. **(3 min) Cluster posture.** Show the reference-cluster bundle
   inventory via `uds-cli bundle inspect`. Confirm the three Zarf
   packages are present and signed.
2. **(4 min) SSO + tenant gateway.** Log in through Keycloak. Land
   on `/uds` inside a11oy. Show the same identity claims surfacing in
   Loki for the request.
3. **(5 min) Λ-9 admission + approval gate.** Drive the bad
   invocation, show the denial. Drive the good invocation, show the
   approval prompt. Approve, show the tool call lands.
4. **(4 min) Offline proof.** Pull the cable. Drive three more
   invocations. Re-attach. Hand Andrew the sidecar; he runs
   `uds-cli bundle verify --offline` himself.
5. **(7 min) Artifact spine.** Walk the lifecycle for an embedding
   and an eval. Surface the seeded drift. Attempt the broken-signature
   promotion; show the denial in the proof ledger.
6. **(2 min) Wrap.** Restate Option C as the destination; ask for the
   thumbs-up to scope.

## What success looks like at the end of Week 3

> Andrew runs `uds-cli bundle verify --offline` on his own laptop,
> sees `OK chain=clean entries=N signer=did:plat:szl-a11oy-prod`,
> and says: *"Schedule the Option C conversation."*

If we get that, the proof point landed. If we get a "not yet," we
adjust on what we heard. If we get a "different shape," we listen.

---

— Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
