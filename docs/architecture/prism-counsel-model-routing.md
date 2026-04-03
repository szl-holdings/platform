# Prism Counsel — AI Model Routing Strategy

**Version:** 1.0  
**Date:** April 2026  
**Scope:** Engineering + legal product strategy

---

## Overview

Prism Counsel routes every AI call through a structured model mesh — not a single model. The routing strategy is designed around three principles:

1. **Right model for the task** — complex legal reasoning does not go to a lightweight classifier; fast classification does not burn expensive reasoning tokens
2. **Fallback without failure** — circuit breakers and fallback chains prevent any single provider outage from blocking matter work
3. **Every output is anchored** — no AI output is surfaced without a proof chain entry, confidence score, and review state

---

## Model Lane Architecture

The model mesh has 7 lanes. Each lane is a logical category of AI work, not a single fixed model. Per-org configuration allows tenant-level overrides.

```
┌──────────────────────────────────────────────────────────────────────┐
│  PRISM COUNSEL — AI MODEL MESH                                       │
│                                                                      │
│  embedding        ────► HuggingFace BAAI/bge-large-en-v1.5          │
│  retrieval        ────► Azure AI Search (hybrid RRF)                │
│  classification   ────► HuggingFace facebook/bart-large-mnli        │
│  extraction       ────► Azure Document Intelligence v4 (structural) │
│                         + GPT-4o (multimodal interpretation)        │
│  reasoning        ────► GPT-5 class (complex legal reasoning)       │
│                         GPT-4.1 class (fast drafting)               │
│  forecast         ────► Internal prism-forecast-v1                  │
│  policy_guardrail ────► Internal prism-policy-engine-v1             │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Model Class Hierarchy

The `reasoning` lane supports three model class tiers. The correct tier is selected by task type:

| Model Class | Capability Profile | Primary Use in Prism Counsel |
|-------------|-------------------|------------------------------|
| **GPT-5 class** | Deep multi-step reasoning, complex inference, highest token context | Complex legal reasoning: strategy, contradiction analysis, demand readiness, privilege analysis |
| **GPT-4.1 class** | Fast, cost-efficient, strong structured output | Routine drafting: memos, checklists, summaries, notification drafts |
| **GPT-4o** | Multimodal (vision + text), strong document understanding | Visual/multimodal evidence review: medical images, police report layouts, handwritten documents |

The routing tier is determined per task type at request time — not configurable at the UI level by end users. Tenant-level model overrides (for cost or compliance reasons) are available to org admins.

---

## Task-to-Model Matrix

### Complex Legal Reasoning → `reasoning` lane (GPT-5 class)

These tasks require deep multi-step inference, source integration, legal language understanding, and nuanced judgment. They route to the highest-capability model available and always return `requiresReview: true`.

| Task | Lane | Model Class |
|------|------|-------------|
| Matter status synthesis | reasoning | GPT-5 class |
| Settlement posture analysis | reasoning | GPT-5 class |
| Communication pattern extraction and analysis | reasoning | GPT-5 class |
| Chronology gap identification | reasoning | GPT-5 class |
| Mediation prep briefing | reasoning | GPT-5 class |
| Demand strategy recommendations | reasoning | GPT-5 class |
| Contradiction detection across source documents | reasoning | GPT-5 class |
| Privilege issue flagging | reasoning | GPT-5 class |
| Copilot workbench (all 5 modes) | reasoning | GPT-5 class |
| Forecast interpretation and explanation | reasoning | GPT-5 class |
| Coverage dispute analysis | reasoning | GPT-5 class |
| Lien negotiation preparation | reasoning | GPT-5 class |

**Grounding requirements:** All reasoning outputs must include `sourceReferences`. Outputs with no sources are flagged with `confidence < 0.3` and marked `requiresReview: true`.

**Human review requirement:** All reasoning outputs require attorney review before export. `exportSafe` is false until `approvalState = approved`.

---

### Fast Drafting → `reasoning` lane (GPT-4.1 class)

Routine drafting tasks that require structured output generation but not deep multi-step reasoning. GPT-4.1 class provides lower latency and lower cost while maintaining high accuracy for structured tasks.

| Task | Notes |
|------|-------|
| Internal memo drafting | Template-guided, source-grounded |
| Deadline summary generation | Structured output from deadline table data |
| Party contact sheet generation | Data assembly from parties table |
| Checklist generation | Generated from known state fields |
| Notification drafts | Template-based with matter context |
| Approval queue summaries | Structured summary of pending items |
| Simple document annotations | Structured tagging of extracted facts |

**Note:** Even when using GPT-4.1 class for these tasks, the proof chain entry is still created, confidence scored, and review state enforced. The model tier change affects cost and latency — not the governance controls.

---

### Multimodal / Visual Evidence Review → `extraction` lane (Two-stage: Azure Doc Intel + GPT-4o)

Visual and multimodal evidence goes through a two-stage process:

**Stage 1 — Structural extraction (Azure Document Intelligence v4):**
OCR, field extraction, table detection, and layout parsing. This produces raw text, structured fields, and page-level confidence scores.

**Stage 2 — Multimodal interpretation (GPT-4o):**
When a document contains visual elements that require legal interpretation — medical imaging annotations, handwritten notes with diagrams, police report collision diagrams, injury photographs with clinical annotation — GPT-4o's multimodal capability interprets the visual content alongside the extracted text.

Stage 2 is triggered only when:
- Extraction confidence is below threshold (< 0.75) on pages with likely visual content
- Document type classification indicates likely visual/diagram content
- Attorney explicitly requests visual analysis via Copilot `document` mode

Documents, images, medical records, police reports, and any non-text content always go through Stage 1 first. Stage 2 applies selectively.

| Task | Lane | Notes |
|------|------|-------|
| PDF text extraction | extraction | Azure Doc Intel v4 layout model |
| Medical record parsing | extraction | Field extraction + table detection |
| Police report extraction | extraction | Layout + form field extraction |
| Handwritten note extraction | extraction | Handwriting model |
| Contract/policy extraction | extraction | Layout + form field detection |

Extracted content is:
1. Assigned a confidence score per field/page
2. Stored in the document pipeline with source lineage
3. Embedded via the `embedding` lane
4. Classified via the `classification` lane
5. Anchored in the proof chain as `outputType=document_extracted`

If extraction confidence < 0.6 for any page, a review item is created and routed to the manual review queue.

---

### Document and Privilege Classification → `classification` lane

Fast zero-shot classification for routing and access control. Does not require LLM reasoning.

| Classification Task | Labels |
|--------------------|--------|
| Privilege classification | `attorney_client · work_product · both · none` |
| Document type | `medical_record · police_report · correspondence · contract · invoice · exhibit · other` |
| Communication type | `demand · response · denial · settlement_offer · coverage_dispute · acknowledgment · other` |
| Risk signal type | `coverage_dispute · bad_faith_indicator · reserve_change · adjuster_change · silence_window` |

Classification outputs are stored and used to:
- Set `privilegeState` on documents and proof chain entries
- Route documents to appropriate review queues
- Filter retrieval results by role/access level

---

### Semantic Retrieval → `embedding` + `retrieval` lanes

All retrieval in Prism Counsel is permission-aware and hybrid.

**Embedding lane** (BAAI/bge-large-en-v1.5):
- Generates 1024-dimension vectors for all ingested text
- Used for semantic similarity search
- Applied at ingest time; not re-run unless source document changes

**Retrieval lane** (Azure AI Search hybrid):
- Hybrid RRF combining keyword BM25 and semantic ANN
- ACL metadata applied at index time
- Per-query filters: `orgId`, `matterId[]`, `privilegeState`, `exportSafe`

---

### Matter Forecasting → `forecast` lane (Internal)

Deterministic modeling engine combining structured matter data with worldline features. Not an LLM. No hallucination surface. No human review required for score output — review required for any action recommendation derived from forecasts.

**Forecast types:**
- `insurer_response_latency` — Days since last carrier response vs. normal baseline
- `offer_movement_likelihood` — Probability of offer movement given friction and pressure
- `settlement_friction` — Composite blocking score from multiple friction dimensions
- `review_bottleneck` — Approval queue depth relative to throughput
- `approval_lag_risk` — Compound risk from pending approvals + overdue deadlines
- `recovery_lien_drag_risk` — Settlement timeline risk from active liens
- `quiet_risk_deterioration` — Activity drought detection across all matter signals

---

### Policy and Guardrails → `policy_guardrail` lane (Internal)

Before any user input reaches the `reasoning` lane, the policy engine runs:
- Is this request within the system's advisory-only boundary?
- Does it attempt to bypass review or approval requirements?
- Does it request action outside the user's role level?

Violations are logged and the request is blocked before reaching the LLM.

---

## Grounding and Citation Requirements

| Output Type | Source Requirement | Minimum Confidence |
|-------------|-------------------|-------------------|
| Copilot matter answer | Must cite source documents or pressure scores | 0.65 |
| Copilot strategy advice | Must cite data products or forecast diffs | 0.70 |
| Chronology draft | Must cite extracted document content | 0.75 |
| Demand section draft | Must cite medical records and damages | 0.80 |
| Mediation memo | Must cite all factual claims | 0.75 |
| Classification output | Automatic — confidence from model | 0.60 |
| Extraction output | Per-field confidence from Doc Intel | 0.60 |

If source requirements are not met, the output is:
1. Marked with `confidence < threshold`
2. Flagged `requiresReview: true`
3. `exportSafe: false` — cannot be exported

---

## Human Review Requirements

**Required for every legal output:**

| Trigger | Review Requirement |
|---------|--------------------|
| Any copilot reasoning output | Attorney review before use in external communication |
| Any drafted document section | Attorney sign-off before export |
| Any extraction confidence < 0.6 | Human validation of extracted fields |
| Any output marked `requiresReview: true` | Role-appropriate review (paralegal min for internal; attorney for external) |
| Any export request | `approvalState = approved` required on all included proof chain entries |

**Review workflow:**
```
AI Output Generated
    → ProofChainEntry created (reviewState=pending_review)
    → ReviewItem created if requiresReview=true
    → Assigned reviewer notified
    → Reviewer: approve / needs_revision / reject
    → If approved: reviewState=reviewed, routed to signoff queue
    → Attorney signoff: approvalState=approved, exportSafe=true
    → Export available
```

---

## Advisory-Only Boundaries

Prism Counsel AI is advisory. It does not:

- File documents on behalf of the user
- Send communications without explicit human authorization
- Modify settlement authority or negotiation position autonomously
- Determine legal strategy without attorney review
- Mark any output as legally authoritative

**Enforced boundaries (system-level, not just UI):**
- `exportSafe` flag is false until attorney-level approval is recorded
- No export API accepts an unapproved proof chain entry
- Policy guardrail lane blocks requests that phrase instructions as "send this" / "file this" / "accept this offer"
- Copilot mode prompts explicitly instruct the model to present recommendations only, not instructions

**What AI does in Prism Counsel:**
- Surfaces patterns the attorney would otherwise have to assemble manually
- Identifies missing artifacts and inconsistencies
- Drafts content for attorney review and revision
- Generates checklists and structured summaries
- Alerts on deadline proximity and pressure changes
- Recommends actions — human decides whether to execute

---

## Circuit Breaker and Fallback

Each active lane configuration has an associated circuit breaker:

| State | Behavior |
|-------|----------|
| `closed` | Normal operation — requests pass through |
| `open` | Lane unavailable — fallback chain tried |
| `half_open` | 30s after open — one test request passes; if success, closes |

**Failure thresholds:** Circuit opens after 5 consecutive failures.

**Fallback order:** If primary lane circuit is open, system tries next active lane for the same logical lane type by priority order. If no fallback available, request fails with explicit error (no silent degradation).

---

## Cost Tracking

Every model request logs cost:
- Per-request cost is stored in `pc_model_requests.cost`
- Cost is aggregated per org, per lane, per day in `pc_cost_tracking`
- Budget alerts can be configured per org (not yet implemented — Phase 2)
- Model cost dashboard is available in the admin interface

---

## Model Version Accountability

Every AI output is associated with:
- `modelProvider` — which provider was used (openai, huggingface, azure, internal)
- `modelVersion` — specific model name and version
- `generationTimestamp` — when the output was generated

This enables:
- Comparing outputs before/after model upgrades
- Identifying which model version produced a specific proof chain entry
- Tracking confidence drift over time as models change

---

*See also:*
- *[Alloy Control Plane Architecture](prism-counsel-alloy-control-plane.md)*
- *[Proof Chain Specification](prism-counsel-proof-chain-spec.md)*
- *[Trust Center](../trust/prism-counsel-trust-center.md)*
