# a11oy.UDS — Vision Deck (outline)

**Author:** Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
**Audience:** Andrew Greene, co-founder, Defense Unicorns
**Format:** ~14 slides. Markdown outline; rendered deck lives at
`artifacts/uds-deck/` and at `/uds` inside a11oy.

---

## Slide 01 — Title: a11oy.UDS

> **a11oy.UDS** — a UDS-native, governed agent runtime.
>
> Inheriting UDS guardrails. Carrying a11oy's orchestration DNA.

**Speaker notes:** One token name. Native to UDS. Not "a11oy on UDS" — a
single citizen of the UDS world. Reads like `uds-cli` or `uds-core`. We
arrived at this name after the call last week; everything in this deck
uses it.

---

## Slide 02 — Why this name, why this shape

> The Linux ethos thread: a kernel surface stays small, sharp, and
> verifiable. Capabilities mesh in at the policy and admission edges.
> a11oy is a capability. UDS is the kernel surface.

**Speaker notes:** Defense Unicorns has already made the Linux-style bet
on UDS Core + Pepr + Zarf. a11oy is built to be *the* governed-agent
capability that mounts cleanly on that surface — not a parallel platform
that competes with it.

---

## Slide 03 — What a11oy already carries

> Six primitives, in production today:
>
> 1. Orchestration plane (signal mesh, workcells, planner)
> 2. Approval gates (no material action without a human OK)
> 3. Artifact registry (models, prompts, embeddings, evals, agents)
> 4. Proof ledger (append-only, hash-chained, Ed25519 + ML-DSA-65)
> 5. Λ-9 invariant runtime (Doctrine V6 floor — 0.90 / 0.95 / 0.95)
> 6. Recalibration memo pipeline (weekly "what-changed" feed)

**Speaker notes:** Walk Andrew through the artifact registry slide
first — that's the half of a11oy that maps most directly to Zarf's
mental model.

---

## Slide 04 — What UDS already carries

> 1. Distribution substrate (Zarf packages, UDS bundles)
> 2. Cluster substrate (uds-core, Pepr admission, NetworkPolicies)
> 3. Identity substrate (Keycloak SSO, tenant realms)
> 4. Edge substrate (Istio tenant gateway)
> 5. Telemetry substrate (Loki, Prometheus, Grafana)

**Speaker notes:** Read straight off `uds-core`. Nothing speculative.
This is the surface a11oy.UDS mounts on.

---

## Slide 05 — The meshing thesis

> a11oy.UDS = a11oy's six primitives, expressed natively as UDS
> citizens.
>
> | a11oy primitive | UDS primitive it inherits from |
> | --- | --- |
> | Orchestration | Pepr operators, Istio tenant gateway |
> | Approval gates | UDS policy engine, Pepr admission |
> | Artifact registry | Zarf packages, OCI registry, SBOM flow |
> | Proof ledger | Loki + signed attestation sidecar |
> | Λ-9 invariant | Pepr admission module (#5027, merged) |
> | Recalibration memo | NetworkPolicy-aware cluster inventory feed |

**Speaker notes:** This is the slide we built the architecture doc
around. Each row is concrete, each row already has either merged code
or a named insertion point.

---

## Slide 06 — Problem 1 (Trusted AI/agent orchestration in air-gap)

> Air-gapped UDS clusters today have:
> - Strong image / chart provenance (Zarf, Cosign).
> - Strong identity (Keycloak), strong policy (Pepr).
>
> Air-gapped UDS clusters today **do not** have:
> - A governed-agent runtime with structural approval gates.
> - An immutable, in-cluster tool-call audit chain.
> - A disconnected-mode posture that still produces verifiable proof.

**Speaker notes:** This is "Problem 1" verbatim from the email thread.
We're not inventing a need — Andrew named it.

---

## Slide 07 — Problem 2 (UDS-native artifact spine for AI)

> Zarf already treats container images as first-class signed,
> versioned, attested artifacts.
>
> Models, prompts, embeddings, agent definitions, and evals deserve
> the same treatment:
> - SBOM-style attestation per artifact class.
> - Signed evals (so a passing score in dev means something in prod).
> - Drift detection on the artifact (embedding drift, prompt drift,
>   eval-score drift).
> - Promote / queue / discard flow mirroring Zarf's package flow.

**Speaker notes:** The frontier-ingest + thesis-scoring layer inside
a11oy is the working prototype. We're not asking UDS to build this —
we're asking UDS to host it as a native citizen.

---

## Slide 08 — The A / B / C ladder

> **A —** a11oy.UDS as a Zarf bundle payload, mounted into an existing
> UDS cluster. Inherits UDS Keycloak, Pepr, NetworkPolicies as-is.
> **2–3 week proof point.**
>
> **B —** a11oy primitives ported one-by-one to native UDS components
> (Pepr capabilities, OPA bundles, Keycloak clients). Falls out of A.
>
> **C —** Full a11oy.UDS ecosystem port — a11oy's six primitives become
> first-class peers of uds-core. **The real destination.**

**Speaker notes:** Recommendation is A as the proof point, C as the
destination, B falls out along the way. This is the language we used on
the call.

---

## Slide 09 — The 2–3 week proof plan (Option A)

> **Week 1 —** Bundle + smoke test on a Defense Unicorns reference
> cluster. Demonstrate Keycloak SSO, Istio tenant gateway routing, and
> the proof ledger writing into Loki.
>
> **Week 2 —** Wire the Λ-9 admission module (Pepr, already merged
> #5027) to a real agent invocation against a Mission App. Demonstrate
> a denied invocation with `MATURITY_GATE_BLOCKED`.
>
> **Week 3 —** Run the artifact-spine flow against a real model + eval
> bundle. Promote → queue → discard a candidate. Hand Andrew the proof
> ledger he can verify offline.

**Speaker notes:** Cross-references `05_proof_plan.md`. Every week has
a concrete artifact Andrew can hold us to.

---

## Slide 10 — What "the wires are set up" looks like

> Already merged:
> - **uds-cli #5026** — in-bundle hash-chained attestation manifest.
> - **pepr #5027** — Λ-floor admission module.
> - **Three Zarf packages + UDS bundle** under
>   `docs/proposals/defense-unicorns/szl-holdings/`.
> - **OPA gateway test pack** (3 tests, pinned OPA v0.69.0).
>
> Tracked:
> - **#5118 / #5119** — publish + validate steps for the merged work.

**Speaker notes:** This is the credibility slide. Every claim points to
a merged ref or a tracked task. Nothing is "we'll get to it."

---

## Slide 11 — What credibly-auditable agents unlock for the DoD side

> - Defensible deployment of LLM-driven decision support inside SCIFs.
> - Cross-coalition evidence sharing without releasing the underlying
>   model.
> - Insurance-grade posture claims (Sentra inheritance) for AI-driven
>   ops.
> - A foundation for autonomy that the program manager can sign off on.

**Speaker notes:** This is the "so what" slide. Don't oversell —
Andrew's instinct is for engineering reality. But name the doors this
opens.

---

## Slide 12 — Risks we've named

> - **License surface.** AGPL ↔ Apache mismatch managed by dual-license
>   contributions on every upstream PR.
> - **Doctrine drift.** Λ-floor values are payload-anchored at
>   `packages/payload/raw/payload.json` → `doctrine`; any change is a
>   replay event.
> - **Scope creep.** Option C is deliberately a follow-up, gated on
>   Andrew's response to A.

**Speaker notes:** Naming the risks up front earns the room. Each one
has a managed answer.

---

## Slide 13 — The ask

> 1. A Mission App target for the Week-3 demo.
> 2. Keycloak realm access on a reference cluster.
> 3. A 30-minute review window at the end of Week 3.
> 4. A thumbs-up to schedule the Option C scoping conversation.

**Speaker notes:** Four asks. Each is small. None costs more than an
hour of Andrew's team's time.

---

## Slide 14 — Close

> a11oy.UDS is the bet that **governed agency** is the next primitive
> the UDS surface deserves — and that we can prove it in three weeks
> without you having to take our word for any of it.
>
> — Lutar, Stephen P. · SZL Holdings

**Speaker notes:** End on the inheritance line — a11oy.UDS *belongs*
on the UDS surface; this is not a sales pitch, it's an architectural
claim with a proof plan attached.
