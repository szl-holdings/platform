# a11oy.UDS — How I see it meshing in

**Author:** Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
**Audience:** Andrew Greene, co-founder, Defense Unicorns
**Length:** ~1,500 words.
**Purpose:** The short write-up Stephen promised on the call. Names
Options A / B / C in plain language, names the recommendation, lays out
the 2–3 week proof plan, names the success criteria Andrew can hold us
to, and lists the two problems as the targets for the proof.

---

## The shape

When we sketched this on the call, three meshing options fell out
naturally. They are not "three competing products" — they are three
points on a single ladder, and the ladder has a direction.

**Option A — a11oy.UDS as a Zarf bundle payload.** We ship a11oy's six
primitives — orchestration, approval, artifact registry, proof ledger,
Λ-9 invariant, recalibration memo — as three Zarf packages composed
into a single UDS bundle. That bundle drops into an existing UDS
cluster. It inherits Keycloak SSO, Istio tenant gateway routing, Pepr
admission, NetworkPolicies, and the Loki/Prometheus observability stack
as-is. Nothing about uds-core changes. We're a well-behaved tenant.

**Option B — a11oy primitives ported one-by-one to native UDS
components.** Some of a11oy's primitives are already shaped like UDS
citizens (the Λ-9 invariant runtime is structurally a Pepr admission
module — that PR is merged as pepr #5027). Some are not yet — the
artifact registry is a Postgres + OCI hybrid, the recalibration memo is
an HTTP endpoint. Option B is the work of unbundling each primitive
from the a11oy monorepo and giving it a clean UDS-native form.

**Option C — Full a11oy.UDS ecosystem port.** a11oy.UDS becomes a
first-class peer of uds-core. The six primitives are no longer "things
we deploy on UDS" — they are "things UDS adopters consume the same way
they consume Keycloak or Istio." A user installing UDS gets a checkbox
for governed-agent orchestration the same way they get one for SSO.

The recommendation is **A as a 2–3 week proof point, with C as the real
destination. B falls out along the way.**

That sequencing matters. Doing Option B as an independent project is a
multi-quarter refactor with no demo at the end. Doing it as the
*by-product* of Option A — where each port is forced by a concrete
demand from the bundle work — keeps the unbundling honest and ships a
working artifact each week. By the time the Option A proof point is in
your hands, half of Option B is done, and the rest is scoped.

## Why A first

A is the smallest credible thing that lets Andrew personally verify the
core claim. The core claim is:

> *a11oy's six primitives belong on the UDS surface, and they don't
> fight UDS to live there.*

The way to falsify that claim is to mount a11oy on a real UDS cluster
and see whether it breaks anything — whether Keycloak fights us,
whether Pepr denies us, whether Istio routes us wrong, whether the
NetworkPolicies isolate us into uselessness. If any of those happen,
the meshing thesis is wrong and we owe you a different conversation.

If none of them happen — and we have very strong reason to believe
none of them will, based on the merged work in uds-cli #5026, pepr
#5027, and the three Zarf packages — then the meshing thesis is proven
in the smallest possible footprint, and we can talk about C with the
right level of seriousness.

## Why C is the destination

Option A is the *demo*. Option C is the *product*. A is what we send
you next Tuesday; C is what a Defense Unicorns–SZL partnership looks
like in twelve months.

The reason is that the two problems we both named — trusted
agent-orchestration inside air-gapped environments, and a UDS-native
artifact spine for AI — are not solved by Option A. Option A
*demonstrates* that they can be solved, on a single cluster, with a
single bundle. Option C *systematically solves them* across the entire
UDS adopter base.

Concretely, under Option C:

- Every UDS adopter gets the artifact spine for free as part of their
  install. Their models, prompts, embeddings, agent definitions, and
  evals get the same SBOM-and-attestation treatment that their
  container images get today.
- Every Pepr-admitted agent invocation rides through the Λ-9 floor
  automatically. There is no "remembered to enable" — it is the
  default posture.
- The recalibration memo becomes a `uds-cli memos pull` subcommand
  that any operator can run against any installed bundle. Drift in
  embeddings or in eval scores becomes a first-class operator signal,
  not a custom dashboard.

That is the artifact spine, and that is the trusted-agent runtime, in
the same shape Zarf already gives you for container images.

## The two problems, restated as proof targets

The proof plan has to land both problems, or it doesn't count.

**Problem 1 — Trusted AI/agent orchestration inside air-gapped UDS
environments.** What we have to demonstrate by end of Week 3:

1. An agent invocation enters a11oy.UDS on a Defense Unicorns
   reference cluster.
2. The Λ-9 admission module (pepr #5027) evaluates its claimed
   provenance vector against the Doctrine V6 floor (0.90 conjunctive,
   0.95 moral, 0.95 measurability).
3. A human-in-the-loop approval gate fires. The approval is required;
   it cannot be configured around. The Pepr capability denies any
   invocation that bypasses the gate with
   `MATURITY_GATE_BLOCKED`.
4. Every tool call the agent makes lands in the proof ledger
   (Ed25519 + ML-DSA-65 hybrid signatures, append-only,
   hash-chained).
5. You can pull the cluster's network cable, run the agent, and the
   proof ledger still works. Re-attach, ship the ledger sidecar to
   a verifier, and `uds-cli bundle verify --offline` walks the chain
   clean.

**Problem 2 — A UDS-native artifact spine.** What we have to
demonstrate by end of Week 3:

1. A model, an embedding bundle, a prompt template, an agent
   definition, and an eval ship as `AIArtifact` CRs (sketch in
   `02_a11oy_uds_architecture.md` §5).
2. Each is attested with a Cosign-style signature, with an SBOM, with
   a Doctrine V6 Λ vector measured at promote time.
3. A passing eval in dev *means something in prod* — the same
   signed-eval artifact gates promotion.
4. Drift on an embedding bundle (we'll seed a small drift) gets
   flagged and surfaces in the next recalibration memo.
5. A bad artifact moves through the promote / queue / discard
   lifecycle and the right denial fires at each gate.

If we land both, the proof is done. If we land one, we owe you a hard
conversation about which we keep and which we drop. We are aiming to
land both.

## The 2–3 week proof plan, in one paragraph each

**Week 1 — Bundle, identity, observability.** Deploy the existing
three-package UDS bundle on a Defense Unicorns reference cluster. Wire
Keycloak SSO to the a11oy login flow. Confirm the Istio tenant
gateway routes traffic to the a11oy namespace per the NetworkPolicy
posture. Stand up the Loki/Prometheus exporters. End-of-week artifact:
a screenshot of the a11oy home page on the reference cluster, served
through the tenant gateway, after Keycloak SSO, with Loki ingesting
the request log.

**Week 2 — Approval gates, Λ-9 admission, audit chain.** Wire pepr
#5027 to a real agent invocation against a stub Mission App (whichever
one your team picks). Drive a deliberately-bad invocation
(moralGrounding = 0.92) and demonstrate the
`MATURITY_GATE_BLOCKED` denial. Drive a deliberately-good invocation
and demonstrate the approval queue prompt firing. End-of-week
artifact: the proof-ledger sidecar containing both denials and
approvals, walked clean by `uds-cli bundle verify --offline`.

**Week 3 — Artifact spine.** Stand up the `AIArtifact` CRD. Promote a
small model, a prompt, an embedding bundle, an agent def, and an eval
through the lifecycle. Seed embedding drift. Show the recalibration
memo flagging it. Show a promotion blocked because the eval signature
chain is broken. End-of-week artifact: a short recorded walkthrough
(≤ 5 min) of the whole flow, plus the proof-ledger sidecar Andrew can
verify on his own hardware.

## Success criteria, in Andrew's hands

Hold us to all five of these. If any one of them fails, the proof
point did not land:

1. The reference-cluster install completes without uds-core
   modifications.
2. The Λ-9 admission denial happens on the deliberately-bad
   invocation, with the exact reason `MATURITY_GATE_BLOCKED`.
3. The offline-verify path returns
   `OK chain=clean entries=N signer=did:plat:szl-a11oy-prod`
   after we pull the network cable.
4. Drift on the seeded embedding bundle appears in the next
   recalibration memo (≤ 24h).
5. The end-of-Week-3 walkthrough is a single contiguous demo — no
   cuts, no "imagine that this works." Either it runs or it doesn't.

## What we ask from Defense Unicorns

Three things, none of them costly:

- A Mission App target by end of Week 1. Doesn't have to be the
  flashy one; the bland-but-real one is better for the proof.
- Keycloak realm access on a reference cluster by end of Week 1.
- A 30-minute review window at the end of Week 3.

## Close

Option A is the smallest credible thing we can put in your hands that
proves the meshing thesis. Option C is what we both want at the end.
B is the work that falls out of doing A honestly. The recommendation
is to start A on go-ahead and let C scope itself in parallel.

— Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
