# Evidence-led competitor matrix

> **Status: RESEARCH RECORD — NOT EXTERNAL MARKETING COPY.**
>
> **Observed at:** `2026-07-26T01:10:01.9253595Z`
>
> Company product and funding statements below are **REPORTED** from company-owned sources and were not independently tested. This document does not claim that a competitor lacks a feature because its public documentation did not mention one.

## Claim labels

| Label | Meaning in this document |
|---|---|
| **MEASURED** | Directly observed or computed in the W4 evidence audit. |
| **REPORTED** | Stated by the named company, standards body, or original survey publisher; not independently tested here. |
| **MODELED** | Proposed product, market, or evaluation framing that still needs validation. |
| **CONJECTURE** | A falsifiable strategic hypothesis, not an established fact. |
| **UNKNOWN** | The reviewed authoritative sources did not establish the claim. |
| **UNAVAILABLE** | Evidence was not available or the requested comparison was not applicable. |

## Evidence boundary

- **MEASURED:** The W4 audit reviewed company-owned product documentation, company funding announcements, official standards documentation, and the original survey publisher.
- **MEASURED:** No named competitor was installed, penetration-tested, or subjected to a controlled receipt-verification challenge in this workcell.
- **UNKNOWN:** Documentation silence does not establish that a vendor lacks runtime controls, audit logs, signatures, tamper evidence, or offline verification.
- **CONJECTURE:** A useful differentiation axis may be whether a governed decision produces a signed artifact that can be verified offline under an explicit identity policy. The protocol below makes that conjecture testable.

## Research matrix

| Company | Funding from reviewed primary sources | Reported mechanisms | Receipt comparison boundary |
|---|---|---|---|
| Arthur AI | **REPORTED:** A [$15M Series A](https://www.arthur.ai/blog/announcing-series-a) and [$42M Series B](https://www.arthur.ai/blog/making-ai-work-for-even-more-people) establish **at least $57M** in announced rounds. **UNKNOWN:** The payload's $63M total was not established by the official announcements reviewed. | **REPORTED:** [Shield](https://www.arthur.ai/product/shield) validates prompts and responses between an application and model deployment. [Agent Discovery](https://docs.arthur.ai/docs/agent-discovery) polls connected AWS or GCP infrastructure for unregistered agents and inspects agent components. | **UNKNOWN:** This audit did not establish the presence or absence of signed, offline-verifiable decision receipts. |
| Credo AI | **REPORTED:** Credo AI reported [$21M in new capital and $41.3M total funding](https://www.credo.ai/blog/accelerating-global-growth-and-innovation-in-ai-governance-with-21-million-in-new-capital). | **REPORTED:** Credo AI reports [cross-framework mappings](https://www.credo.ai/recognition/forrester-wave-2025), policy packs described as executable controls, and [GAIA governance orchestration](https://www.credo.ai/lp/holistic-ai-vs-credo-ai). | **UNKNOWN:** Exact fail-closed enforcement semantics and an offline cryptographic receipt workflow were not established. Calling the product a documentation layer only is unsupported. |
| OneTrust | **REPORTED:** OneTrust reported a [$150M investment, more than $1B in total funding, and a $4.5B valuation](https://www.onetrust.com/news/onetrust-secures-150m-investment-led-by-generation-investment-management/) in 2023. | **REPORTED:** OneTrust reports inventory and lifecycle workflows plus [runtime allow, redact, block, or escalate controls](https://www.onetrust.com/solutions/ai-governance/) and [continuous production evidence with versioned records](https://www.onetrust.com/ai-governance-in-production/). | **UNKNOWN:** Cryptographic signing and fully offline verification were not established. Compliance-workflow-only framing is outdated. |
| IBM watsonx.governance | **UNAVAILABLE:** A standalone startup funding figure is not applicable to a product of IBM. | **REPORTED:** IBM reports [IBM and third-party model governance](https://www.ibm.com/products/watsonx-governance/model-governance), monitoring, thresholds, alerts, inventories, and [factsheet lineage](https://www.ibm.com/docs/en/watsonx/saas?topic=ai-planning-governance). | **UNKNOWN:** Receipt signing and offline verification were not established. Claims about deployment weight or switching cost require separate evidence. |
| Fiddler AI | **REPORTED:** Fiddler reported a [$30M Series C and $100M total funding](https://www.fiddler.ai/press-releases/fiddler-raises-30m-series-c) in January 2026. | **REPORTED:** The same source describes standardized telemetry, evaluation, continuous monitoring, enforceable policy, and auditable governance. | **UNKNOWN:** Failure-mode enforcement, receipt signing, and offline verification were not established. Dashboard-only framing is outdated. |
| Arize AI / Phoenix | **REPORTED:** Arize reported a [$70M Series C](https://arize.com/blog/arize-ai-raises-70m-series-c-to-build-the-gold-standard-for-ai-evaluation-observability/); an [official career page](https://arize.com/career/?gh_jid=5988893004) reports more than $135M in funding. | **REPORTED:** Phoenix reports [open-source OpenTelemetry/OpenInference tracing and evaluation](https://arize.com/docs/phoenix/resources/frequently-asked-questions/open-source-langsmith-alternative-arize-phoenix-vs.-langsmith/) and [agent decision, model, and tool tracing](https://arize.com/blog/add-observability-to-your-open-agent-spec-agents-with-arize-phoenix/). | **UNKNOWN:** DSSE or Sigstore signing of decision traces and offline verification were not established. Dashboard-only framing is reductive. |
| Langfuse | **REPORTED:** Langfuse reported a [$4M seed round](https://langfuse.com/blog/announcing-our-seed-round) and that it [became part of ClickHouse](https://langfuse.com/press) in January 2026. **UNKNOWN:** A complete pre-acquisition total was not established. | **REPORTED:** Langfuse reports open-source tracing, analytics, prompt versioning, evaluations, OpenTelemetry, cloud or self-hosting, and [enterprise audit logs](https://langfuse.com/pricing-self-host). | **UNKNOWN:** Cryptographic signing of traces and offline verification were not established. Dashboard-only framing omits material capabilities. |
| Braintrust | **REPORTED:** Braintrust reported a [$36M Series A and $45M total](https://www.braintrust.dev/blog/announcing-series-a) in 2024, followed by an [$80M Series B](https://www.braintrust.dev/blog/announcing-series-b) in 2026. **UNKNOWN:** The reviewed 2026 announcement did not state a new cumulative total. | **REPORTED:** Braintrust reports [production model, tool, and retrieval traces](https://www.braintrust.dev/learn/ai-observability/v0), scoring, thresholds, alerts, and production-to-evaluation datasets. | **UNKNOWN:** Cryptographic signing of traces and offline verification were not established. Dashboard-only framing omits tracing and evaluation infrastructure. |
| ModelOp | **REPORTED:** ModelOp reported a [$10M Series B](https://www.modelop.com/blog/press-release-modelop-raises-10-million-to-accelerate-innovation-of-its-leading-ai-governance-software). **UNKNOWN:** A current total was not established. | **REPORTED:** ModelOp reports an [auditable inventory and evidence system](https://www.modelop.com/ai-governance-software/inventory) plus [blocking workflows, inline protections, and network controls](https://www.modelop.com/ai-governance-software/controls). | **UNKNOWN:** Independent enforcement coverage, receipt signing, and offline verification were not established. A no-runtime-binding claim is outdated. |
| ValidMind | **REPORTED:** ValidMind reported an [$8.1M seed round](https://validmind.com/news/validmind-secures-8-1-million-in-seed-round-funding/). **UNKNOWN:** A later total was not established. | **REPORTED:** ValidMind reports [inventories, approvals, policy-as-code, real-time hooks, and audit trails](https://validmind.com/) containing reasoning traces, tool logs, and policy evaluation records. | **UNKNOWN:** The immutability mechanism, threat model, receipt signing, and offline verification were not established. |
| Monitaur | **REPORTED:** A [$6M Series A](https://www.monitaur.ai/press-releases/monitaur-the-leading-model-governance-platform-for-highly-regulated-industries-raises-series-a) and earlier [$2.6M round](https://www.monitaur.ai/press-releases/monitaur-uses-industry-traction-to-successfully-close-2-6-million-in-funding) establish at least $8.6M in announced rounds. | **REPORTED:** Monitaur reports [pre-deployment simulation, production monitoring, continuous validation, decision records, and audit evidence](https://www.monitaur.ai/platform). | **UNKNOWN:** Synchronous blocking, receipt signing, and offline verification were not established. A blanket no-runtime claim is unsupported. |
| Enzai | **UNKNOWN:** No company-owned funding announcement with an exact amount was identified in the reviewed sources. | **REPORTED:** Enzai reports a [system of record for inventory, risks, controls, decisions, workflows, monitoring, and auditability](https://www.enz.ai/) plus [automated governance gates and real-time monitoring](https://www.enz.ai/introducing-controls-enzais-ground-breaking-new-feature-for-ai-governance). | **UNKNOWN:** Synchronous fail-closed enforcement, receipt signing, and offline verification were not established. |

## Testable differentiation protocol

The comparison should be run against both A11oy and any named competitor before stronger copy is approved.

| Test | Passing evidence | Current A11oy boundary |
|---|---|---|
| Decision binding | **MODELED:** A decision artifact binds the governed input, selected policy, tool activity, result, and relevant artifact digests. | **REPORTED:** The current repository describes DSSE decision receipts and Khipu parent links in its [vertical conformance documentation](https://github.com/szl-holdings/platform/blob/36e924f2c8ec34d7e725fa1da6606dfa609e9eda/docs/conformance/VERTICAL_CONFORMANCE.md). The W4 market audit did not independently validate a deployed product flow. |
| Explicit signer identity | **MODELED:** Verification constrains a public-key fingerprint or certificate identity instead of accepting any embedded key. | **REPORTED:** The current repository's [offline verifier](https://github.com/szl-holdings/platform/blob/36e924f2c8ec34d7e725fa1da6606dfa609e9eda/packages/conformance/src/verify.mjs) supports an expected public-key fingerprint. No independent third-party run was supplied. |
| Tamper negative | **MODELED:** Altering the signed payload, signature, or parent link makes verification fail. | **REPORTED:** Repository tests report genuine-pass and tampered-fail behavior. External replication is **UNAVAILABLE** in this workcell. |
| Offline operation | **MODELED:** Verification completes after network access is disabled and never treats indeterminate as verified. | **REPORTED:** The repository exposes an `--offline` verifier path. A clean-machine screen capture or external run is **UNAVAILABLE**. |
| Portable evidence | **MODELED:** A documented bundle contains the receipt, verification material, identity policy, and expected digests. | **UNKNOWN:** This W4 workcell did not establish a complete investor-ready export bundle. |
| Independent comparison | **MODELED:** The same fixture and pass/fail criteria are run against named alternatives without inferring absence from documentation silence. | **UNAVAILABLE:** No controlled competitor test was performed. |

## Safe conclusion

- **CONJECTURE:** A11oy may differentiate through signed, identity-constrained, tamper-evident decision receipts that can be verified offline.
- **REPORTED:** The current platform repository contains a local reference verifier and fail-closed conformance harness; it also reports that none of the assessed public target surfaces currently pass every required conformance gate.
- **UNKNOWN:** Whether any named competitor provides an equivalent end-to-end mechanism.
- **UNKNOWN:** Whether A11oy's mechanism is unique, commercially valuable, or independently reproducible outside the repository.

This is a narrower and more defensible thesis than “nobody else provides decision provenance.”
