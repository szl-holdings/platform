# Series A positioning — evidence before copy

> **Status: INTERNAL PROPOSAL — NOT APPROVED OR PUBLISHED EXTERNALLY.**
>
> **Evidence observed at:** `2026-07-26T01:10:01.9253595Z`
>
> This document separates published facts from proposed investor language. It does not authorize changes to the organization card, website, deck, social channels, or deployment surfaces.

## Claim labels

| Label | Meaning in this document |
|---|---|
| **MEASURED** | Directly observed or computed in the W4 evidence audit. |
| **REPORTED** | Stated by an authoritative source or by the current platform repository; not independently tested here. |
| **MODELED** | Proposed positioning or product behavior that still needs validation. |
| **CONJECTURE** | A falsifiable strategic hypothesis, not an established fact. |
| **UNKNOWN** | The reviewed evidence did not establish the claim. |
| **UNAVAILABLE** | Required evidence was not supplied or obtained in this workcell. |

## 1. Published facts

| ID | Claim | Label and source | Use boundary |
|---|---|---|---|
| F1 | An American Arbitration Association survey of 500 senior legal and executive leaders found that 87% reported formal AI governance principles or policies, while 22% said those structures work effectively in practice. | **REPORTED:** [American Arbitration Association, “The AI Governance Gap”](https://www.adr.org/news-and-insights/ai-governance-gap/) | Preserve the surveyed population and the publisher's wording. Do not present the percentages as a global census. |
| F2 | The survey did not assess A11oy. | **MEASURED:** The reviewed survey source contains no A11oy product evaluation. | “A11oy is the 22%” is **UNKNOWN** and blocked. |
| F3 | Arthur AI's reviewed official announcements establish at least $57M in announced rounds. | **REPORTED:** [$15M Series A](https://www.arthur.ai/blog/announcing-series-a) plus [$42M Series B](https://www.arthur.ai/blog/making-ai-work-for-even-more-people) | Do not use the payload's $63M figure unless a later authoritative source establishes it. |
| F4 | Several named vendors report runtime controls, decision records, audit trails, tracing, or governance gates. | **REPORTED:** See the source-by-source [competitor matrix](COMPETITOR_MATRIX.md). | Do not claim competitors are merely documentation, dashboards, or process layers. |
| F5 | The current platform repository describes an offline Ed25519 DSSE verifier with external-key fingerprint pinning and a tamper-negative test. | **REPORTED:** [Verifier source at the exact inspected base](https://github.com/szl-holdings/platform/blob/36e924f2c8ec34d7e725fa1da6606dfa609e9eda/packages/conformance/src/verify.mjs) and [conformance documentation](https://github.com/szl-holdings/platform/blob/36e924f2c8ec34d7e725fa1da6606dfa609e9eda/docs/conformance/VERTICAL_CONFORMANCE.md) | This is repository evidence, not an independent product benchmark or customer outcome. |
| F6 | The repository reports that none of the assessed public target surfaces currently pass every required conformance gate. | **REPORTED:** [Vertical conformance documentation](https://github.com/szl-holdings/platform/blob/36e924f2c8ec34d7e725fa1da6606dfa609e9eda/docs/conformance/VERTICAL_CONFORMANCE.md) | Preserve the fail-closed result. Do not turn a local reference fixture into a public deployment claim. |
| F7 | No customer, revenue, LOI, design-partner outcome, or independent receipt-verification evidence was supplied to this workcell. | **UNAVAILABLE:** Outside the scope and evidence set of the W4 audit. | Do not add traction claims to investor copy from this document. |

## 2. Positioning thesis

### Category tension

**REPORTED:** The AAA survey identifies a gap between formal governance adoption and reported operational effectiveness within its surveyed population.

### Product thesis

**MODELED:** A11oy is an active prototype designed to bind governed agent decisions to signed, tamper-evident receipts that a verifier can check offline under an explicit identity policy.

### Differentiation hypothesis

**CONJECTURE:** If an independent evaluator can reproduce the receipt, tamper-negative, identity-pinning, parent-link, and offline-verification results across a real workflow, that evidence may create a useful category distinction between reviewing platform-generated records and independently checking a portable decision artifact.

### Current limit

**UNKNOWN:** This workcell does not establish that A11oy is the only vendor with this mechanism, that every A11oy workflow produces such a receipt, or that customers value the mechanism enough to buy.

## 3. Proposed investor copy

The following language is proposed copy, not a published fact set.

### Opening

> **REPORTED:** An American Arbitration Association survey of 500 senior legal and executive leaders found that 87% reported formal AI governance principles or policies, while 22% said those structures work effectively in practice. **MODELED:** A11oy is being built to close that execution gap with verifiable, receipt-bound controls.

### One-sentence position

> **MODELED:** A11oy is an active prototype designed to turn governed agent decisions into signed, tamper-evident receipts that can be checked offline—shifting diligence from trusting a dashboard to testing an artifact.

### Thirty-second narrative

> **REPORTED:** Current governance and observability vendors report substantial capabilities across policy, monitoring, runtime controls, tracing, decision records, and audit evidence. **MODELED:** A11oy's narrower design target is a portable decision receipt with explicit signer identity, integrity checks, parent linkage, and offline verification. **CONJECTURE:** The differentiation is not that other platforms have no evidence; it is that an evaluator may be able to test A11oy's evidence without relying on the service that produced it. **UNKNOWN:** Independent comparison and customer validation are still required.

### Honest proof line

> **REPORTED:** The repository contains a local offline-verification reference and intentionally reports that current public vertical conformance remains unearned. **MODELED:** The next proof milestone is an external party reproducing a valid receipt verification and a tampered receipt failure on a clean machine.

## 4. Copy that remains blocked

| Blocked wording | Label | Reason |
|---|---|---|
| “A11oy is the 22%.” | **UNKNOWN** | The survey did not evaluate A11oy. |
| “Nobody else provides decision provenance.” | **UNKNOWN** | Reviewed vendors report decision logs, reasoning traces, tool logs, lineage, versioned records, or audit trails. |
| “A11oy is the only platform with signed offline-verifiable receipts.” | **UNKNOWN** | No controlled market-wide feature test was performed. |
| “Arthur AI has raised $63M.” | **UNKNOWN** | Reviewed official announcements establish at least $57M. |
| “Credo AI is documentation only.” | **UNKNOWN** | Credo AI reports executable controls and lifecycle orchestration. |
| “OneTrust is only compliance workflow.” | **UNKNOWN** | OneTrust reports runtime controls, telemetry, continuous evidence, and versioned records. |
| “Observability vendors only provide dashboards.” | **UNKNOWN** | Named vendors report tracing, evaluation, policy, alerts, audit logs, and other material capabilities. |
| “Model-risk vendors have no runtime binding.” | **UNKNOWN** | Named vendors report blocking, inline protections, real-time hooks, production monitoring, or governance gates. |
| “Customers are using A11oy receipts in production.” | **UNAVAILABLE** | No customer or production evidence was supplied to this workcell. |

## 5. Diligence proof ladder

| Gate | Required evidence | Claim unlocked |
|---|---|---|
| 1. Repository reproducibility | **MEASURED:** Pinned source commit, documented command, genuine fixture, corrupted fixture, and deterministic exit codes. | **REPORTED:** A local reference verifier exists and its repository tests pass. |
| 2. Clean-machine reproduction | **MEASURED:** A timestamped run on a fresh environment with network disabled during verification. | **MEASURED:** The supplied bundle verifies offline under stated conditions. |
| 3. Identity constraint | **MEASURED:** Verification fails for an unexpected key fingerprint or certificate identity. | **MEASURED:** The receipt is bound to an expected signer policy, not merely self-consistent. |
| 4. Real workflow | **MEASURED:** A consequential demo request traverses policy and tool gates, emits a receipt, fails after tampering, and replays the valid evidence chain. | **MEASURED:** One end-to-end A11oy workflow satisfies the protocol. |
| 5. Independent evaluator | **MEASURED:** An external party reproduces the pass/fail result without private assistance. | **REPORTED:** Independent verification occurred for the named fixture and version. |
| 6. Competitor protocol | **MEASURED:** The same documented criteria are applied to named alternatives using available product access. | **MEASURED:** Mechanism-level comparison for the tested products and versions. |
| 7. Commercial validation | **MEASURED:** A signed LOI, pilot agreement, or paid deployment explicitly values the verification workflow. | **REPORTED:** Market demand for the named use case, bounded to the documented relationship. |

No later gate may be inferred from an earlier one.

## 6. Investor conversation structure

1. **REPORTED — The problem:** Present the scoped 87%/22% survey result and cite the surveyed population.
2. **REPORTED — The market:** Acknowledge that funded competitors already report meaningful governance, runtime, observability, and evidence capabilities.
3. **MODELED — The design target:** Explain signed, identity-constrained, offline-verifiable decision receipts without claiming exclusivity.
4. **REPORTED — The current proof:** Show the repository verifier and the honest fail-closed public conformance result.
5. **UNKNOWN — The open questions:** State external reproducibility, competitor equivalence, and willingness to pay as unresolved.
6. **MODELED — The milestone:** Ask an evaluator or design partner to run the same receipt-verification protocol against one consequential workflow.

## 7. Publication gate

Before any sentence here moves to the deck, organization card, website, or social post:

1. refresh every time-sensitive source and record `observed_at`;
2. keep every material claim label attached through review;
3. link the exact product version or commit supporting A11oy claims;
4. run the differentiation protocol against A11oy;
5. obtain founder approval for the final external wording; and
6. remove the internal label only after the supporting evidence is packaged for diligence.

Until those gates pass, this file is a positioning workbench—not an external claim authorization.
