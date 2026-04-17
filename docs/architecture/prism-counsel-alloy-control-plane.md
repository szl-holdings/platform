# Prism Counsel — Alloy Control Plane Architecture

> **DEPRECATED:** PRISM Counsel has been retired and consolidated into the Aegis legal workspace. This document is preserved for historical reference only.

**Version:** 1.0  
**Date:** April 2026  
**Scope:** Internal engineering reference

---

## Overview

**Prism Counsel** is a legal matter observability and governed execution platform for plaintiff-side NY insurance litigation teams.

**Alloy** is the orchestration and control plane that powers it.

This distinction matters: Prism Counsel is the product — the workflows, the surfaces, the matter intelligence, the client experience. Alloy is the engine that makes it reliable, auditable, and enterprise-grade. Alloy is not a feature of Prism Counsel; it is the infrastructure Prism Counsel runs on.

---

## Alloy's Role in Prism Counsel

Alloy provides the following capabilities to Prism Counsel:

| Capability | What it does |
|------------|-------------|
| **Model routing** | Routes every AI call to the correct provider/model/lane based on task type, cost targets, circuit state, and fallback chain |
| **Tool orchestration** | Coordinates multi-step operations: ingest → extract → classify → route → approve → export |
| **Prompt and policy control** | System prompts, guardrail definitions, mode-specific templates, and per-org policy overrides |
| **Matter-context assembly** | Builds the full context window for any AI call: matter state, parties, claims, deadlines, pressure scores, proof chain, worldline overlays |
| **Permission-aware retrieval** | Retrieval is scoped to the requesting user's org, role, matter access, and privilege state |
| **Audit logging** | Every action — AI output, human approval, data export, connector sync, model call — is persisted as an immutable audit event |
| **Proof/source chain generation** | Each AI output is recorded with its source references, model version, confidence, and review state |
| **Workflow triggering** | Matter changes, pressure spikes, connector events, and deadline alerts trigger defined workflow actions |
| **Evaluation hooks** | Model outputs can be scored, compared against prior versions, and flagged for drift |
| **Cross-platform reuse** | The same Alloy engine powers Lyte, Aegis, Terra, Vessels, and Prism Counsel — shared infrastructure, domain-specific surfaces |

---

## Control Plane Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│  PRISM COUNSEL  — Product Layer                                          │
│                                                                          │
│  Matter Twin   Copilot Workbench   Pressure Graph   Settlement Friction  │
│  Proof Chain   Pilot Review        Forecast Engine   Worldline Engine    │
│  M365 Sync     Document Pipeline   Approval Queue    Audit Export        │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │ product calls
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  ALLOY  — Orchestration & Control Plane                                  │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────────────┐ │
│  │  Model Router   │  │  Tool Registry  │  │  Prompt/Policy Engine    │ │
│  │                 │  │                 │  │                          │ │
│  │  7 model lanes  │  │  embedding      │  │  mode-specific prompts   │ │
│  │  circuit breaker│  │  retrieval      │  │  guardrail policies      │ │
│  │  cost tracking  │  │  classification │  │  org overrides           │ │
│  │  fallback chain │  │  extraction     │  │  advisory-only boundary  │ │
│  │  request log    │  │  reasoning      │  │  privilege filters       │ │
│  └────────┬────────┘  │  forecast       │  └──────────────────────────┘ │
│           │           │  policy_guardrail│                               │
│           │           └─────────────────┘                               │
│           │                                                              │
│  ┌────────▼────────────────────────────────────────────────────────────┐│
│  │  Matter-Context Assembly                                             ││
│  │                                                                      ││
│  │  matter profile · parties · claims · deadlines · offers · damages   ││
│  │  pressure scores · data products · forecast diffs · worldline feats ││
│  │  proof chain · communications · approval queue · privilege state     ││
│  └────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌──────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐│
│  │  Retrieval Layer │  │  Audit & Event Log  │  │  Workflow Triggers  ││
│  │                  │  │                     │  │                     ││
│  │  org-scoped      │  │  every action logged│  │  matter changes     ││
│  │  role-filtered   │  │  model version      │  │  pressure spikes    ││
│  │  privilege-aware │  │  actor attribution  │  │  deadline proximity ││
│  │  hybrid RRF      │  │  immutable append   │  │  connector events   ││
│  └──────────────────┘  └─────────────────────┘  └─────────────────────┘│
└──────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  PROVIDERS — External Services                                           │
│                                                                          │
│  OpenAI (GPT-4o reasoning)    Azure Document Intelligence                │
│  HuggingFace (embedding,      Azure AI Search (hybrid retrieval)         │
│               classification) Internal engines (forecast, policy)        │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Model Routing

See full specification: [prism-counsel-model-routing.md](prism-counsel-model-routing.md)

**Lane summary:**

| Lane | Provider (default) | Model (default) | Purpose |
|------|-------------------|-----------------|---------|
| `embedding` | HuggingFace | `BAAI/bge-large-en-v1.5` | Semantic vector generation |
| `retrieval` | Azure | `azure-ai-search-hybrid` | Hybrid RRF retrieval |
| `classification` | HuggingFace | `facebook/bart-large-mnli` | Document/privilege classification |
| `extraction` | Azure | `azure-document-intelligence-v4` | Document extraction and OCR |
| `reasoning` | OpenAI | `gpt-5` (complex), `gpt-4.1` (drafting), `gpt-4o` (multimodal) | Legal reasoning, drafting, and multimodal review |
| `forecast` | Internal | `prism-forecast-v1` | Settlement and matter forecasting |
| `policy_guardrail` | Internal | `prism-policy-engine-v1` | Output guardrails and policy enforcement |

**Reasoning lane model class routing:**

| Task Type | Model Class | Rationale |
|-----------|------------|-----------|
| Complex legal reasoning (strategy, contradiction, privilege analysis) | GPT-5 class | Deep multi-step inference required |
| Routine drafting (memos, checklists, summaries) | GPT-4.1 class | Fast, cost-efficient, structured output |
| Multimodal / visual evidence review | GPT-4o | Vision + text capability for documents with images, diagrams, handwriting |

Each lane supports:
- **Per-org overrides** — tenant can configure preferred provider/model/endpoint
- **Priority ordering** — multiple lanes can be configured; primary is selected by priority
- **Circuit breaker** — automatic failover after 5 consecutive failures; reopens after 30s
- **Fallback chain** — if primary fails and circuit opens, next available active lane is tried
- **Cost tracking** — per-request cost logged for tenant billing and budget controls
- **Request logging** — every call stored in `pc_model_requests` with latency, status, error

---

## Tool Orchestration

Alloy does not execute tools in isolation. It coordinates multi-step operations as atomic or recoverable sequences.

**Example: Document ingestion and routing**
```
1. Document uploaded → prism-queue.DOCUMENT_EXTRACT job enqueued
2. Azure Document Intelligence extracts text, fields, tables
3. classification lane scores document: privilege · work_product · standard
4. embedding lane generates semantic vector
5. retrieval index updated with new vector + ACL metadata
6. proof chain entry created: outputType=document_extracted, source=azure_doc_intel
7. If extraction confidence < 0.6 → ReviewItem created, reviewState=pending_review
8. Matter Twin snapshot triggered on_change
9. Pressure Graph recomputed if evidence dimension affected
```

**Example: Copilot answer generation**
```
1. User sends message to Copilot Workbench session
2. Matter-context assembled: matter profile + 20 recent comms + latest pressure scores
3. policy_guardrail lane checks input against org policy
4. reasoning lane generates response (GPT-4o) with matter context in window
5. Proof chain entry created: outputType=copilot_answer, sources=[], requiresReview=true
6. Response returned to user with proof chain ID
7. If action_suggested=true → approval_required flag set on message
```

---

## Prompt and Policy Control

Every Copilot mode has a distinct system prompt enforced at session creation:

| Mode | Governing Instruction |
|------|----------------------|
| `matter` | Summarize status, explain changes, show pressures, flag missing artifacts, recommend next actions. Ground all answers in sources. Never present inference as fact. |
| `communications` | Analyze carrier communications, extract asks/commitments/denials, surface silence windows. Always cite source messages. |
| `document` | Summarize documents, extract facts, flag contradictions, show extraction confidence. Never hide missing evidence. |
| `strategy` | Show leverage, explain settlement posture, compare forecast snapshots, produce briefing packs. Every recommendation must be source-grounded. |
| `ops` | Show connector health, sync lag, extraction backlog, approval backlog, tenant state. Operator-level detail only to privileged users. |

**Policy enforcement is layered:**
1. System prompt at session creation (mode-specific behavior)
2. `policy_guardrail` lane checks user input before routing to `reasoning`
3. Output is marked `requiresReview=true` by default for legal outputs
4. Proof chain entry created for every assistant response
5. Export requires `approvalState=approved` before export_safe flag is set

---

## Matter-Context Assembly

Before any AI reasoning call, Alloy assembles a structured context object from the database:

```typescript
interface MatterContext {
  matter: {
    id: number;
    title: string;
    status: string;
    stage: string;
    jurisdiction: string;
    healthScore: number;
    settlementRange: { low: number; high: number; mid: number };
    statOfLimitations: Date;
  };
  parties: Array<{ role: string; name: string; organization: string }>;
  claims: Array<{ coverageType: string; status: string; policyLimit: number }>;
  deadlines: Array<{ type: string; dueDate: Date; status: string }>;
  pressureScores: Record<PressureDimension, { score: number; movement: string; topDrivers: string[] }>;
  dataProducts: Record<DataProduct, { score: number; movement: string }>;
  latestForecasts: ForecastDiff[];
  worldlineOverlays: WorldlineFeature[];
  proofChainSummary: { total: number; pendingReview: number; approvedExportSafe: number };
  communications: Array<{ type: string; direction: string; date: Date }>;
  openApprovals: number;
  privilegeState: "none" | "attorney_client" | "work_product" | "both";
}
```

The context window is assembled per-request and scoped to the requesting user's org, role, and matter access.

---

## Permission-Aware Retrieval

Retrieval in Prism Counsel is not a single shared index. Access is controlled at multiple levels:

| Level | Enforcement |
|-------|-------------|
| **Org boundary** | Every query filtered by `orgId` — no cross-org leakage |
| **Matter access** | Retrieval scoped to matters the user has access to |
| **Role level** | `client_viewer` and `external_reviewer` cannot retrieve privileged materials |
| **Privilege state** | `attorney_client` and `work_product` materials hidden from non-attorney roles |
| **Export safety** | Only `exportSafe=true` items surfaced in export-context retrieval |

Retrieval uses hybrid RRF (keyword + semantic) via Azure AI Search with per-document ACL metadata attached at index time.

---

## Audit Logging

Every significant operation in Prism Counsel writes to `pc_audit_events`:

```typescript
interface AuditEvent {
  orgId: number;
  matterId?: number;
  actorId?: number;
  actorType: "user" | "system" | "service";
  action: string;           // e.g. "review_approved", "connector_sync", "model_request"
  entityType: string;       // e.g. "review_item", "proof_chain_entry", "connector_account"
  entityId?: number;
  details: Record<string, any>;
  createdAt: Date;
}
```

**Logged events include:**
- Every model request (lane, provider, model, latency, cost, status)
- Every proof chain entry creation, review state change, approval state change
- Every connector sync start, complete, fail
- Every review item creation, state change, signoff
- Every export generation
- Every approval request create/resolve
- Every matter change event

Audit events are append-only. No delete operation exists on `pc_audit_events`.

---

## Proof Chain Generation

Every AI output is anchored to a proof chain entry:

```typescript
interface ProofChainEntry {
  id: number;
  orgId: number;
  matterId?: number;
  outputType: "document_extracted" | "copilot_answer" | "classification" | "chronology_draft" | "demand_section" | "review_memo" | "export_packet";
  outputContent: string;
  outputHash: string;         // SHA-256 of content — integrity verification
  sourceReferences: SourceRef[];
  sourceClass?: string;
  extractionConfidence?: number;
  modelLane?: string;
  modelProvider?: string;
  modelVersion?: string;
  actorType: "system" | "user" | "service";
  reviewState: "pending_review" | "reviewed" | "approved" | "needs_revision" | "archived";
  approvalState: "none" | "pending" | "approved" | "rejected";
  exportSafe: boolean;        // true only after approval
  privilegeState: "none" | "attorney_client" | "work_product" | "both";
}
```

The content hash enables integrity verification at any future point. Any tampering with `outputContent` after creation is detectable.

---

## Workflow Triggers

Alloy monitors the following signals and triggers defined workflows:

| Trigger | Source | Workflow |
|---------|--------|----------|
| Pressure dimension rises > 0.7 | Pressure Graph | Alert attorneys; create review item |
| Deadline within 7 business days | Deadline table | Deadline alert notification |
| Connector sync failure | Connector system | Ops alert; retry with backoff |
| Proof chain entry pending review | Proof Chain | Notify assigned reviewer |
| Approval queue depth > 5 | Approval system | Escalation notification |
| Graph subscription expiring < 24h | Subscription state | Renewal trigger |
| Document extraction confidence < 0.6 | Document pipeline | Manual review queue |
| Quiet risk score > 0.5 | Forecast engine | Matter review prompt |

---

## Evaluation Hooks

Model outputs support evaluation at two levels:

**Per-output confidence scoring:**
- Every extraction, classification, and reasoning output includes a confidence score
- Outputs below threshold (configurable per lane) are flagged for review
- Confidence is stored in `pc_proof_chain_entries.extraction_confidence`

**Model version tracking:**
- Every model request logs provider, model name/version, and lane
- `pc_model_requests` enables per-version performance comparison
- Lane health dashboard surfaces success rate, avg latency, circuit state per lane

---

## Cross-Platform Reuse

The same Alloy engine powers every SZL platform:

| Platform | Domain | Alloy Uses |
|----------|--------|-----------|
| Lyte | Business observability | Workflow engine, approval gates, audit trail |
| Aegis | Defense & intelligence | Threat classification, alert routing, incident workflows |
| Terra | Real estate | Distress signal classification, deal routing |
| Vessels | Maritime | AIS anomaly scoring, port workflow triggers |
| Prism Counsel | Legal | Full model mesh, matter-context assembly, proof chain, review gates |

Prism Counsel is the most AI-intensive deployment of Alloy — using all 7 model lanes, proof chain anchoring on every output, and the full retrieval and permission stack.

---

*See also:*
- *[Model Routing Strategy](prism-counsel-model-routing.md)*
- *[Matter Twin Specification](prism-counsel-matter-twin-spec.md)*
- *[Proof Chain Specification](prism-counsel-proof-chain-spec.md)*
- *[M365 Integration Path](prism-counsel-m365-integration.md)*
- *[Trust Center](../trust/prism-counsel-trust-center.md)*
