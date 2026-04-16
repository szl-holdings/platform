# AI Governance — SZL Holdings Platform

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** CISO, head of compliance, AI governance reviewers, enterprise evaluators
**Companion docs:** [PLATFORM_PRIMITIVES.md](PLATFORM_PRIMITIVES.md) · [PROOF_AND_POLICY_MODEL.md](PROOF_AND_POLICY_MODEL.md) · [SECURITY.md](SECURITY.md) · [TENANCY-MODEL.md](TENANCY-MODEL.md)

---

## Purpose

Document how the SZL Holdings platform governs AI usage at the platform layer — provider stack, data handling, output provenance, approval gates, evaluation, observability, customer controls.

This is the canonical document for AI governance. It is the artifact a CISO or AI risk officer reads when evaluating us.

---

## Principles

1. **AI is advisory, not autonomous.** Consequential actions require human approval enforced at the platform layer; AI cannot bypass.
2. **Every AI output is provenanced.** Model identity, source citations, confidence score, and review status attach to every output.
3. **Tenant scope is enforced for AI as for everything else.** AI evaluations are stored with `org_id` and only returned to that tenant's authorized users.
4. **No customer data trains foundation models.** Provider terms enforce no-training-on-customer-data; we configure to that posture.
5. **Customers can BYO model.** At Enterprise, customers may supply their own model from an allow-list.
6. **Outputs are auditable.** Every AI recommendation is recorded in the Proof Chain; outcomes feed the Outcome Graph.
7. **We publish what we know and what we do not.** Known gaps in AI governance are listed in [KNOWN-GAPS.md](KNOWN-GAPS.md).

---

## AI Provider Stack

| Provider | Use | Configuration |
|----------|-----|---------------|
| OpenAI | General-purpose reasoning, drafting | API access; no-training-on-data per provider terms |
| Anthropic (Claude) | Reasoning, synthesis, long-context | API access; no-training-on-data per provider terms |
| Google Gemini | Multimodal reasoning | API access; no-training-on-data per provider terms |

We do not use any model that does not contractually disable training on customer data.

### Provider routing

| Decision | Mechanism |
|----------|-----------|
| Default model selection | Per agent class, configured in the AI engine |
| Failover | Cross-provider, configured per agent |
| Customer override (Enterprise) | Customer selects from provider allow-list |
| Cost ceiling | Per-tenant monthly cap; alerts at 80% |
| Region routing | Provider region pinning (e.g., EU) at Enterprise on request |

### Model versioning

| Practice | Implementation |
|----------|----------------|
| Pinned model versions | Yes, per agent |
| Version upgrade cadence | Quarterly, with regression tests |
| Customer notification of upgrade | 30 days for material changes |
| Rollback capability | Yes, immediate |

---

## Data Handling

### What is sent to providers

| Data class | Sent to providers? | Notes |
|-----------|:------------------:|-------|
| Tenant business data (signals, decisions) | ✅ on AI invocation | Required for the AI to function |
| User PII | ✅ if part of context, else no | Customers can configure redaction filters |
| Audit trail entries | ❌ | Never sent to providers |
| Authentication tokens, secrets, keys | ❌ | Never sent to providers |
| Cross-tenant data | ❌ | Architectural — `org_id` scope enforced before AI invocation |

### What providers retain

| Provider | Default retention | Our configuration |
|----------|-------------------|-------------------|
| OpenAI (API) | Per provider docs (currently 30 days zero-data-retention available) | Configured to no-training; ZDR opt-in where available |
| Anthropic (API) | Per provider docs | Configured to no-training |
| Gemini (API) | Per provider docs | Configured to no-training |

### Data residency for AI calls

| Tier | Default | Customer option |
|------|---------|-----------------|
| Starter | US (provider default) | None |
| Pro | US (provider default) | None |
| Enterprise | Customer's preferred region per provider | Provider region pinning where supported |

---

## Output Provenance

Every AI output produced by the platform carries a Proof Chain entry containing:

| Field | Description |
|-------|-------------|
| `output_id` | Unique identifier |
| `created_at` | Creation timestamp |
| `model_provider` | OpenAI / Anthropic / Gemini / Customer-supplied |
| `model_version` | Pinned version string |
| `agent_id` | Which platform agent produced this |
| `source_classification` | `llm_generated`, `human_authored`, `system_computed`, `external_ingested`, `hybrid` |
| `source_citations` | Array of references (URLs, document IDs, signal IDs) |
| `confidence_score` | Numeric, agent-specific scale documented per agent |
| `parent_proof_id` | If derived from another proof (e.g., human-edited LLM output) |
| `review_status` | `unreviewed`, `approved`, `flagged`, `retracted` |
| `export_safety` | `safe`, `restricted`, `pending_review`, `blocked` |
| `tenant_id` | `org_id` scope for retrieval |

This metadata is mandatory for every AI output. The platform refuses to serve un-provenanced AI content.

See [PROOF_AND_POLICY_MODEL.md](PROOF_AND_POLICY_MODEL.md) for the full model.

---

## Approval Gates (Covenant Policy)

The Covenant Policy engine enforces approval requirements for AI-recommended actions.

### Decision types

| Decision | Behavior |
|----------|----------|
| `permit` | Action proceeds; logged in Proof Chain |
| `deny` | Action blocked; logged in Proof Chain with denial reason |
| `escalate` | Action returns `pending_approval`; queued for human approval; AI cannot execute past this point |

### Where enforcement happens

| Layer | Enforcement |
|-------|------------|
| API server route handlers | Covenant Policy check before executing consequential endpoints |
| Workflow engine (Alloy) | Covenant Policy check at each transition step |
| MCP gateway | Same enforcement; agents subject to the same policies as humans |
| AI agent code | Cannot bypass — agents call the same endpoints as humans |

The AI is a caller of the policy engine, not a peer of it.

### Action class examples (Aegis)

| Action | Approval requirement |
|--------|---------------------|
| Triage incident (low confidence) | Operator approval |
| Containment recommendation | Operator approval; security lead for cross-system actions |
| Dismiss alert | Logged; no approval (recoverable, low blast radius) |
| Block IP at perimeter | Approval required (high blast radius) |
| Update playbook | Admin approval |

See [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md) for role mappings per action class.

---

## Evaluation Pipeline

The platform's AI evaluation pipeline (`lib/ai-engine/src/evals/trace-capture.ts`) captures:

| Trace element | Description |
|---------------|-------------|
| Input prompt | What the agent was asked |
| Provider response | Raw model output |
| Latency | Time to first token, time to completion |
| Tokens | In / out counts |
| Cost | USD per call |
| Outcome label | If applicable, downstream outcome attribution |
| `tenant_id` | Scope for retrieval |

### Storage and access

| Aspect | Behavior |
|--------|----------|
| Stored in | PostgreSQL with `org_id` scope |
| Retrievable by | Authenticated users in that tenant with appropriate role |
| Cross-tenant retrieval | Architectural prevention; `org_id` enforced at query layer |
| Aggregate evaluator stats | Available to platform admins (`/api/ai/ops/evaluators/stats`); platform-global, not per-tenant |

### Evaluator classes

| Evaluator | Purpose |
|-----------|---------|
| Confidence calibration | Compares predicted confidence to outcome achievement |
| Citation faithfulness | Verifies output citations reference real sources |
| Policy compliance | Checks recommendations against Covenant Policy |
| Override pattern | Detects systematic override of an agent's recommendations |
| Drift detection | Flags model behavior changes after version upgrade |

---

## Outcome Graph Feedback Loop

Every AI recommendation flows through the Outcome Graph:

```
Agent recommends → Decision recorded → Outcome observed → Calibration job
       ↑                                                        │
       └────────────────────────────────────────────────────────┘
```

The calibration job runs nightly and adjusts:

- Per-agent confidence calibration
- Per-domain acceptance rate baselines
- Sensitivity analysis weights (in conjunction with Monte Carlo)

See [PLATFORM_PRIMITIVES.md](PLATFORM_PRIMITIVES.md) Outcome Graph section.

---

## Tenant Isolation for AI

| Concern | Behavior |
|---------|----------|
| Tenant business data sent to provider | Scoped to the requesting tenant only |
| Vector / RAG retrieval | Tenant-scoped `tenant_id` filter on all retrieval queries (KG001 / KG014 / KG015 resolved Apr 2026) |
| Eval traces | Stored with `org_id`; only returned to that tenant's users |
| AI Ops dashboard | Per-tenant data scoped; admin-tier aggregate data does not include cross-tenant correlation |
| MCP tool tenant binding | Caller cannot supply `orgId` parameter; injected from session |

Cross-tenant retrieval bypass requires `super_admin` role with audit logging of the bypass.

---

## Customer Controls

| Control | Available at | Notes |
|---------|--------------|-------|
| Disable AI for a specific tenant | All tiers | Configured by tenant admin |
| Disable AI for a specific user | All tiers | Configured by org admin |
| Per-action AI on/off | Pro and Enterprise | Configured per action class |
| Customer-supplied model | Enterprise | From allow-list |
| AI cost cap per tenant | All tiers | Configured by tenant admin |
| Audit export of AI traces | All tiers | Filtered by `tenant_id` |
| Redaction filter for PII before AI calls | Pro and Enterprise | Configured at tenant level |

---

## Roadmap (Honest)

| Item | Status | Target |
|------|--------|--------|
| Cryptographic anchoring of Proof Chain | Roadmap | FY27 |
| Native MFA for AI-action approvers | Roadmap (KG026) | Sprint 4 |
| Customer BYOK for AI request encryption | Roadmap | FY27 |
| Per-tenant rate-limit on AI calls | Implemented | — |
| Air-gapped AI deployment (Sovereign) | Roadmap | FY27 |
| Per-region model pinning (EU, etc.) | Implemented at Enterprise | — |
| Independent AI red-team report | Roadmap | After SOC 2 |

---

## Known Gaps

From [KNOWN-GAPS.md](KNOWN-GAPS.md):

- Native MFA at platform level not yet implemented (KG026)
- Cryptographic anchoring of Proof Chain not yet implemented
- Independent AI red-team / external evaluation pending
- BYOK for AI request encryption not yet available

---

## Compliance Mapping

| Framework | How we map |
|-----------|------------|
| EU AI Act (high-risk systems) | Article 14 (human oversight): enforced at Covenant Policy; Article 12 (record-keeping): Proof Chain; Article 13 (transparency): provenance metadata on all outputs |
| NIST AI RMF | Map → Measure → Manage → Govern: documented in this file + [SECURITY.md](SECURITY.md) + [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) |
| ISO/IEC 42001 (AI management) | Aligned; certification not yet pursued |
| SOC 2 (AI controls) | Logical access (CC6) extended to AI: per [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md) |

---

## Related Documents

| Document | Path |
|----------|------|
| Platform primitives | [PLATFORM_PRIMITIVES.md](PLATFORM_PRIMITIVES.md) |
| Proof and policy model | [PROOF_AND_POLICY_MODEL.md](PROOF_AND_POLICY_MODEL.md) |
| Security policy | [SECURITY.md](SECURITY.md) |
| Tenancy model | [TENANCY-MODEL.md](TENANCY-MODEL.md) |
| Access control matrix | [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md) |
| Known gaps | [KNOWN-GAPS.md](KNOWN-GAPS.md) |
| Technical diligence packet | [TECHNICAL_DILIGENCE_PACKET.md](TECHNICAL_DILIGENCE_PACKET.md) |
| Trust Center | [TRUST_CENTER_INDEX.md](TRUST_CENTER_INDEX.md) |
| Decision simulation | [DECISION_SIMULATION.md](DECISION_SIMULATION.md) |
| AI evaluation strategy | `AI_EVALUATION_STRATEGY.md` |
| Executive demo — trust walkthrough | [EXECUTIVE_DEMO.md](EXECUTIVE_DEMO.md) |
| Operator demo — override flow | [OPERATOR_DEMO.md](OPERATOR_DEMO.md) |
| Product surfaces — trust-provenance route | [PRODUCT-SURFACES.md](PRODUCT-SURFACES.md) |

---

## Where governance shows up in product

AI governance is not a document — it is a set of routes and components that
buyers and operators can see and exercise directly.

- **`/trust-provenance` route** (Aegis, Terra, Vessels) — 4-tab surface
  showing proof chains, policy results, audit trail, and the decision cockpit.
  See [PRODUCT-SURFACES.md](PRODUCT-SURFACES.md#trust--provenance-surface).
- **Proof attribution** — every AI-generated item carries `sourceClass`,
  `modelProvider`, `modelVersion`, `confidenceScore`, `reviewState`, and
  `exportSafetyState`. Enforced through the `ProofPanel` primitive.
- **Policy appeal with audit** — operators who disagree with a policy denial
  submit a justification (≥ 8 chars) via `POST /api/audit-log/policy-appeal`
  (CSRF-protected, authenticated). The endpoint emits a structured
  `policy.appeal.recorded` log line with actor, role, org, correlation id,
  `requestId`, and `justificationLength`. When the underlying request maps to
  a real approval, the authoritative `human_override` entry is written by the
  reviewer flow (`POST /api/approvals/:id/review` with `decision: "revised"`),
  which persists to the approvals audit trail.
- **Simulation-informed approvals** — approval payloads should embed the
  chosen `SimulationScenario` and a `ProofPanelData` snapshot so approvers
  review the same evidence and scenario ranges the requester saw.
- **Predicted vs Actual calibration** — the Decision Cockpit's *outcome* tab
  shows how prior simulations compared to reality, so reviewers can challenge
  over-confident models before they fire again.
