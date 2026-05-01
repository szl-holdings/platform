# @szl-holdings/guardrails

Drop-in LLM safety wrapper. Same config surface as NVIDIA NeMo Guardrails. Closed-form Λ-scored receipts. Every decision is auditable, deterministic, and tamper-evident.

## Why this exists

NeMo Guardrails uses an LLM to decide whether another LLM is safe. That answer is non-deterministic and ungrounded. There is no way to prove, after the fact, why a given decision was made.

`@szl-holdings/guardrails` decides with arithmetic. Each rail returns a closed-form score in [0,1]. The composite Λ is the geometric mean. A single zero collapses Λ to zero, which matches the design intent — any hard veto blocks the action. Every decision is sealed into a receipt that auditors can verify cryptographically.

This single artifact satisfies, at once:

- EU AI Act Article 12 (automatic recording of events for high-risk systems)
- NIST SP 800-53 AU-12 (audit record generation)
- SR 11-7 (model risk management ongoing monitoring)
- DoD CDAO RAI "Traceable" tenet (forward-chained provenance)

## Install

```sh
npm install @szl-holdings/guardrails
```

## Five-line quickstart

```ts
import { Guardrails } from "@szl-holdings/guardrails";

const g = new Guardrails({
  tenantId: "acme",
  inputRails: [{ name: "jailbreak_detection" }, { name: "sensitive_data_detection" }],
  outputRails: [{ name: "pii_filter" }, { name: "hallucination_check" }],
  executionRails: [{ name: "tool_authority_check" }, { name: "anduril_refusal_check" }],
});

const r = await g.guard({ subject: "claude/req-1", prompt, response, toolCall });
if (r.action !== "PROCEED") refuse(r);
```

## Rail catalogue

| Kind       | Rail                                           | What it gates                          |
| ---------- | ---------------------------------------------- | -------------------------------------- |
| input      | `jailbreak_detection`                          | Prompt injection, role hijack          |
| input      | `sensitive_data_detection`                     | PII / credentials in user prompt       |
| input      | `topic_safety`                                 | Hard-banned topics                     |
| input      | `self_check_input`                             | Role-boundary integrity                |
| output     | `pii_filter`                                   | PII leak in model output               |
| output     | `hallucination_check`                          | Ungrounded URLs in output              |
| output     | `fact_check`                                   | Uncited numerical claims               |
| output     | `self_check_output`                            | Harmful step-by-step content           |
| dialog     | `scope_creep_check`                            | Assistant-volume blow-up               |
| dialog     | `consent_alignment`                            | First-turn consent boundary            |
| retrieval  | `citation_check`                               | Every chunk has corpus + reference     |
| retrieval  | `context_provenance`                           | Theosophy axis — source triangulation  |
| execution  | `tool_authority_check`                         | High-risk tools require capability     |
| execution  | `anduril_refusal_check`                        | Destructive tools require rollback     |
| any        | `lambda_*_check`                               | Composite Λ across that rail's checks  |

## Receipts

Every `guard()` call returns a `GuardrailReceipt`. The receipt is hash-chained to the previous receipt for the same `Guardrails` instance, forming an append-only log. `verifyReceipt(r, tenantKeyId)` and `verifyReceiptChain(chain, tenantKeyId)` confirm no byte has been altered.

Configure a `receiptSink` to ship receipts to your existing log infrastructure (S3, Kafka, Splunk, Datadog, Honeycomb).

## NeMo migration

If you have a NeMo Guardrails config, the rail names map directly. You change the import and keep the YAML.

| NeMo Guardrails        | @szl-holdings/guardrails              |
| ---------------------- | ------------------------------------- |
| `self_check_input`     | `self_check_input`                    |
| `self_check_output`    | `self_check_output`                   |
| `jailbreak_detection`  | `jailbreak_detection`                 |
| `fact_checking_rail`   | `fact_check`                          |
| `sensitive_data_*`     | `sensitive_data_detection`            |
| `pii_*`                | `pii_filter`                          |
| (none)                 | `lambda_*_check` (composite, new)     |
| (none)                 | hash-chained receipts (new)           |
| (none)                 | closed-form Λ scalar (new)            |

## License

Apache-2.0. Use it. Build on it. Audit it.
