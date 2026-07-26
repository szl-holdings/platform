# OWASP Top 10 for Agentic Applications 2026 mapping

**Assessment date:** 2026-07-25
**Assessment commit:** `36e924f2c8ec34d7e725fa1da6606dfa609e9eda`
**Status:** Internal evidence map; no OWASP certification or complete coverage
claimed

## Claim boundary

The official
[OWASP Top 10 for Agentic Applications 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/)
is a risk-awareness framework. This document maps current repository evidence to
the exact risk names in OWASP's
[official release](https://genai.owasp.org/2025/12/09/owasp-top-10-for-agentic-applications-the-benchmark-for-agentic-security-in-the-age-of-autonomous-ai/).
It is not a certification, penetration test, design review, or statement that a
control covers every agent path.

## Evidence labels

| Label | Meaning in this document |
|---|---|
| **MEASURED** | A static repository property or local check was directly observed at the assessment commit. It does not prove deployed behavior. |
| **MODELED** | Source or configuration contains a relevant control, but end-to-end runtime enforcement was not demonstrated. |
| **PLANNED** | The control exists only in doctrine, architecture, or roadmap material. |
| **UNKNOWN** | Evidence is insufficient to describe the control safely. |

## Risk mapping

| OWASP risk | Evidence label | Repository evidence | Remaining blocker |
|---|---|---|---|
| **ASI01 Agent Goal Hijack** | **MODELED** | [`packages/policy-engine/src/full-evaluation.ts`](../packages/policy-engine/src/full-evaluation.ts) defines an injection check that can block before policy evaluation; [`packages/policy-engine/src/evaluator.ts`](../packages/policy-engine/src/evaluator.ts) models block, escalation, and human-approval outcomes. | Demonstrate that every agent ingress and indirect-content path invokes the same fail-closed control; add adversarial goal-hijack tests and retained results. |
| **ASI02 Tool Misuse & Exploitation** | **MODELED** | The policy engine scopes rules to actions and models approval or blocking. [`packages/agents-sdk-bridge/src/guardrail-adapter.ts`](../packages/agents-sdk-bridge/src/guardrail-adapter.ts) describes a fail-closed policy adapter. | Inventory every callable tool, bind principal and least-privilege permissions, and prove the adapter cannot be bypassed by alternate runtimes or direct tool calls. |
| **ASI03 Identity & Privilege Abuse** | **MEASURED** | The baseline documentation-claims check confirmed that platform and extended role enums match [`ACCESS-CONTROL-MATRIX.md`](../ACCESS-CONTROL-MATRIX.md) and [`lib/db/src/schema/auth.ts`](../lib/db/src/schema/auth.ts). | Static enum agreement does not prove agent identity, session revocation, token audience, delegated authority, or authorization on every execution path; those require runtime tests. |
| **ASI04 Agentic Supply Chain Vulnerabilities** | **MEASURED** | SHA-pinned workflow references, [`pnpm-lock.yaml`](../pnpm-lock.yaml), [dependency review](../.github/workflows/dependency-review.yml), [SBOM generation](../.github/workflows/sbom.yml), and [release attestation configuration](../.github/workflows/release.yml) are present. | Verify current published subjects and attestations, assess agent/model/tool registries and external MCP components, and close the per-artifact SLSA gaps in [`SLSA_POSTURE.md`](SLSA_POSTURE.md). |
| **ASI05 Unexpected Code Execution** | **UNKNOWN** | Policy and guardrail code can deny actions, but this assessment did not identify one centrally enforced sandbox contract for every code-executing tool and agent runtime. | Enumerate code execution surfaces; enforce isolation, resource limits, network/filesystem policy, output validation, and escape tests; retain evidence per runtime. |
| **ASI06 Memory & Context Poisoning** | **MODELED** | [`packages/memory-fabric/src/scoped-memory.ts`](../packages/memory-fabric/src/scoped-memory.ts) models governed scopes, while [`packages/memory-fabric/src/retention.ts`](../packages/memory-fabric/src/retention.ts) models retention, sensitivity checks, and redaction. | Add authenticated writes, integrity/version checks, provenance for recalled context, poisoning tests, rollback or quarantine, and cross-scope isolation evidence. |
| **ASI07 Insecure Inter-Agent Communication** | **PLANNED** | [`docs/architecture/agent-gateway-strategy.md`](architecture/agent-gateway-strategy.md) describes a gateway and governed inter-agent operations. No corresponding `platform/agent-gateway` implementation directory was present in this checkout. | Implement and test peer identity, message authentication, replay resistance, schema validation, authorization, confidentiality, and failure handling. |
| **ASI08 Cascading Failures** | **MODELED** | [`packages/ai-control-plane/src/router.ts`](../packages/ai-control-plane/src/router.ts) and [`lib/services/src/connector-hub/framework.ts`](../lib/services/src/connector-hub/framework.ts) contain circuit-breaker state and failure thresholds. | Prove dependency-graph coverage, bounded retries, backpressure, containment, recovery, and multi-agent failure drills in a representative deployed environment. |
| **ASI09 Human-Agent Trust Exploitation** | **MODELED** | [`docs/A11OY_PUBLIC_CLAIMS_DOCTRINE.md`](A11OY_PUBLIC_CLAIMS_DOCTRINE.md) blocks unsupported claims; the policy engine models human approval and escalation for consequential actions. | Test whether interfaces preserve uncertainty, source boundaries, action consequences, and meaningful consent under manipulation or automation bias. |
| **ASI10 Rogue Agents** | **MODELED** | Policy evaluation can block or require approval, and [`packages/unified-kernel/src/loop/vendor_ouroboros/loop-kernel.ts`](../packages/unified-kernel/src/loop/vendor_ouroboros/loop-kernel.ts) models bounded loop termination and abort. | Add one enforced agent registry, behavioral-drift detection, global containment/stop authority, credential revocation, quarantine, and evidence that every runtime honors the stop path. |

## Interpretation

- **MEASURED** rows are narrow static observations, not proof of deployed
  mitigation.
- **MODELED** rows identify reusable control code but require coverage and
  end-to-end evidence.
- **PLANNED** means the architecture is documented but not established in the
  assessed checkout.
- **UNKNOWN** is a blocker, not a failure hidden behind optimistic wording.

No “OWASP compliant,” “OWASP certified,” or “all Agentic Top 10 risks
mitigated” claim is authorized by this mapping.
