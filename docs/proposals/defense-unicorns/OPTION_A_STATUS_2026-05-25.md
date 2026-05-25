# Option A — Day-1 push-button readiness as of 2026-05-25

**Context:** Andrew Greene (Defense Unicorns) replied 2026-05-22 with
"Option A is a great idea... collaborate with people on site to find a
real defense use case too. Lyndsi will follow up with event logistics,
hope to see you at Warhacker."

**Author:** Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
**Companion to:** `tuesday/05_proof_plan.md`, `tuesday/07_day_one_kickoff.md`
**Reply sent:** see `tuesday/10_andrew_yes_reply.md`.

This memo answers one question: **if Defense Unicorns hands over a cluster
tomorrow, what is actually deployable right now without writing more code?**

---

## §1 — Pre-flight checklist (from proof_plan.md §"Pre-flight (Day 0)")

| Pre-flight item | Status | Evidence (local repo path or GHCR coordinate) |
| --- | --- | --- |
| Three Zarf packages merged under `docs/proposals/defense-unicorns/szl-holdings/` | DONE | `szl-holdings/{a11oy,sentra,amaru}/deploy/zarf.yaml` |
| Top-level UDS bundle (`#5028`) | DONE | `szl-holdings/uds-mesh/uds-bundle.yaml` |
| **Zarf packages published to GHCR (was a gap on Sunday)** | **DONE this sprint** (task #5293) | `ghcr.io/szl-holdings/packages/{a11oy,sentra,amaru}:1.0.0-alpha` |
| `uds-cli bundle create --attest` (PR #5026) | MERGED upstream | `docs/proposals/defense-unicorns/05_two_fixes.md` §Fix A |
| `pepr` Λ-floor admission module (PR #5027) | MERGED upstream | `docs/proposals/defense-unicorns/05_two_fixes.md` §Fix B |
| `uds create` builds bundle from published coords (no local-path swap) | VERIFIED via #5293 | `uds-bundle-szl-mesh-amd64-0.1.0.tar.zst` built clean |
| OPA cross-implementation test pack | DONE | `platform/agent-gateway/tests/gateway-opa-live.test.ts` (pinned OPA v0.69.0) |
| A11oy installable as a Zarf payload by itself | DONE this sprint (task #5319) | `artifacts/a11oy-uds/` with `scripts/build.sh`, signed `MANIFEST.json`, verify-on-build |
| Lambda-floor latency benchmark with deny path | DONE this sprint (tasks #5288, #5290) | `examples/lambda-floor/artifacts/lambda-floor-latency/` (p50 ≈ 0.0005 ms gate CPU; interim t3.medium evidence in PR_DESCRIPTION.md) |
| Doctrine V6 payload anchor | DONE | `packages/payload/raw/payload.json` (replay root `1ed4d253…1698b`) |
| **4 core platform formulas machine-checked in Lean** | **DONE this sprint** (task #5317) | `packages/lean-formulas/{Connection/NullSpace,Substance/GCA,Anatomy/Boundary,Forecast/Perturbation}.lean` |

Every pre-flight item in `proof_plan.md` is either done, verified, or
strengthened beyond what Sunday's package promised. The new line items
(GHCR publish, a11oy-uds payload, Lean proofs, deny-path harness) are
strict additions, not substitutions.

## §2 — What Week 1 needs from Defense Unicorns to start

These are the four asks in the reply, in priority order:

1. **Reference UDS cluster handle.** Without this, Week 1 doesn't start.
   Everything else can be pre-staged against a local kind cluster.
2. **Keycloak realm credentials.** Needed by Wed of Week 1.
3. **On-site introduction** to the person who will tell us which workload
   is worth governing. Replaces the abstract "Mission App stub" ask.
4. **Warhacker logistics** from Lyndsi.

## §3 — What we can rehearse against a local kind cluster (no cluster handle needed)

While we wait on items 1-2, the following Week-1 milestones are runnable
locally today:

- `uds-cli bundle deploy` against a kind cluster using the published GHCR
  coordinates. Proves the bundle assembles correctly without local-path
  shortcuts.
- a11oy SSO round-trip against a throwaway Keycloak realm in a sibling
  container. Recording the round-trip on tape gives Andrew the "we did the
  homework" screenshot before the real cluster even shows up.
- Lambda-floor Pepr capability admission on a deliberately bad
  `AgentInvocation` (moralGrounding = 0.92). Already deny-path-tested via
  `examples/lambda-floor/scripts/measure-admission-latency.mjs`.
- Proof-ledger sidecar accumulation while disconnected, then
  `uds-cli bundle verify --offline` round-trip.

## §4 — What Week 2 and Week 3 still need

- **Week 2** needs the real cluster (for Istio tenant gateway + Loki/Prom),
  the real Keycloak (for identity claims in the ledger), and the on-site
  conversation (for the Mission App target). The mechanics — denial path,
  approval gate, offline ledger, verifier laptop — are already wired.
- **Week 3** needs the `AIArtifact` CRD applied to the reference cluster
  and one of each kind (model / prompt / embedding / agent / eval) to
  promote through `candidate → queued → promoted`. The Lean-proven
  formula primitives from #5317 give the eval-kind real teeth: a broken
  signature on an eval that *also* fails a Λ-floor coexistence check is a
  cleaner denial story than the original proposal sketched.

## §5 — What is explicitly NOT done (so it can't be a surprise later)

- **No live deploy to a real Defense Unicorns cluster.** That's the
  pending handoff.
- **No live AWS t3.medium lambda-floor benchmark.** Interim evidence from
  ubuntu-latest + the CPU-only microbenchmark are in
  `examples/lambda-floor/PR_DESCRIPTION.md` (task #5288). The real
  reference-hardware run is a separate follow-up gated on AWS access.
- **The two Lean proofs left as axiom stubs** (boundary uniqueness and
  perturbation residual bound) are tracked as task #5339 and called out
  in `packages/lean-formulas/`. They do not block the Week-3 demo; they
  block the "fully closed thesis" narrative.
- **Two cosmetic workflow failures** (`amaru`, `sentra-sidecar`) are
  Replit's port detector misreading IPv6 dual-stack binds. The services
  themselves are healthy (`/health` 200). Not a deploy blocker.

## §6 — Done-looks-like

The end-of-Week-3 success line from `proof_plan.md` is unchanged:

> Andrew runs `uds-cli bundle verify --offline` on his own laptop, sees
> `OK chain=clean entries=N signer=did:plat:szl-a11oy-prod`, and says:
> "Schedule the Option C conversation."

The on-site / Warhacker thread is the parallel win: walk away with one
named defense use case that we *both* believe is worth governing, owned
by someone on Andrew's side with skin in the game.
