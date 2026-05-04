# Standards-Track Submission Plan

**Goal:** get the ten primitives into a draft standard or framework reference. Even a *rejected* submission with response on file is citable and makes the runtime defensible against competitors.

## Why standards matter

Styra didn't sell software. Styra sold OPA — a standard. Once OPA was the policy runtime in CNCF, every cloud-native deployment had a default. The acquirer (StateRAMP-adjacent buyers, eventually) paid for the moat the standard created, not the code.

Ouroboros has the same shape. Ten primitives, public-domain math, falsifiable claims. The standards-track play is the substrate move that makes the runtime acquirable at Tier 3+ pricing.

## Three submissions to make

### 1. OpenTelemetry Semantic Conventions for AI Trust

**Where:** OpenTelemetry SIG — semantic conventions working group.
**What:** propose a `gen_ai.trust.*` attribute namespace covering the ten primitives.
- `gen_ai.trust.page_curve.clean` (boolean)
- `gen_ai.trust.holographic.budget_bits` (int)
- `gen_ai.trust.holographic.consumed_bits` (int)
- `gen_ai.trust.no_cloning.violations` (counter)
- `gen_ai.trust.hawking.bits_per_second` (gauge)
- `gen_ai.trust.witness.root_hash` (string)
- `gen_ai.trust.cadence.match` (boolean)
- `gen_ai.trust.impedance.gamma` (gauge, 0..1)
- `gen_ai.trust.q_factor.value` (gauge)
- `gen_ai.trust.kuramoto.r` (gauge, 0..1)

**Why this works:** OpenTelemetry has an existing `gen_ai.*` namespace, owned by an active SIG, and is actively looking for governance signals. The runtime already emits these via `HorizonOtelBridge`.

**Path:** GitHub PR to `open-telemetry/semantic-conventions` with a CEP (Conventions Evolution Proposal). Expect 4–8 week review. Even if rejected, the PR is public.

### 2. NIST AI Risk Management Framework — Measure Function

**Where:** NIST AI RMF (AI 600-1) — Measure function, particularly MEASURE 2.7 (AI system security and resilience) and MEASURE 2.10 (AI system privacy).
**What:** submit a public comment proposing the ten primitives as a candidate measurement framework.

**Why this works:** NIST is actively soliciting concrete measurement proposals. The framework explicitly says "measurement is operationalized over the entire AI lifecycle." Ouroboros operationalizes ten of them.

**Path:** public comment via the NIST AI RMF mailing list / Federal Register notices. Reference the DOI of v2 thesis. Cite Page, Susskind, Landauer, Kuramoto.

### 3. MITRE ATLAS — Defensive Techniques

**Where:** MITRE ATLAS — Adversarial Threat Landscape for AI Systems. Specifically the *Mitigations* matrix.
**What:** propose three new defensive techniques:
- **AML.M####** — Witness-root anchoring (counter to AML.T0042 model exfiltration).
- **AML.M####** — Page-curve release monitoring (counter to AML.T0024 data exfiltration).
- **AML.M####** — Kuramoto coherence guards (counter to AML.T0048 multi-agent compromise).

**Path:** community contribution via the MITRE ATLAS GitHub. Acceptance rate is high if the technique is novel and concretely implementable.

## Submission timeline

- **Week 1–2:** OpenTelemetry SIG PR drafted and submitted.
- **Week 3–4:** NIST AI RMF public comment drafted and filed.
- **Week 5–6:** MITRE ATLAS GitHub contributions filed.
- **Week 8:** first feedback windows close. Iterate.
- **Week 12:** at least one submission accepted or under formal review.

## What to include in every submission

1. The DOI of v2 thesis.
2. Citation chain (Page, 't Hooft, Susskind, Wootters & Zurek, Landauer, Kuramoto, Pozar).
3. Reference implementation link (`github.com/szl-holdings/ouroboros`).
4. Test count (144).
5. The [NOT_THIS.md](../ouroboros-unified-payload/docs/NOT_THIS.md) page.
6. Stephen's ORCID.

## What NOT to include

- Pricing.
- Commercial licensing.
- A11oy / Sentra / Amaru product names. Keep the standards work substrate-only.
- Speculation about consciousness, AGI, simulation, or over-unity. Same NOT_THIS.md discipline.

## Outcome metrics

- 1 accepted technique in MITRE ATLAS within 90 days.
- 1 OpenTelemetry semantic-convention PR under formal review within 90 days.
- 1 NIST AI RMF public comment on file within 60 days.

These three together create a citable trail that makes Ouroboros the obvious reference implementation when standards bodies and acquirers go looking.
