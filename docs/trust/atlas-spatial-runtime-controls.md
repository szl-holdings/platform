# ATLAS Spatial Runtime — Trust & Control Framework

**Date:** April 2026  
**Audience:** CISOs, compliance teams, enterprise security evaluators

---

## Overview

This document describes the trust controls, data governance model, audit trail design, and operational safety guarantees of the ATLAS Spatial Runtime.

---

## Data Governance

### What ATLAS Stores

ATLAS maintains scene state in the `atlas_artifacts` database table. Each scene record contains:

- **Domain-specific operational state** — derived from signals already present in the SZL platform (no new data collection beyond what the platform already holds)
- **Drift scores** — computed values, not raw signal data
- **Branch proposals and outcome projections** — AI-generated, clearly labeled with model attribution and confidence score
- **Approval decisions** — human actor, timestamp, decision, and rationale

### What ATLAS Does Not Store

- Raw PII beyond what is already present in the underlying domain data
- Credentials, secrets, or keys
- Unattributed AI outputs — every AI-generated content item carries a proof chain entry with model version, confidence score, and service attribution

### Data Retention

| Data Type | Retention |
|-----------|-----------|
| Full-resolution scene snapshots | 72 hours |
| Hourly compacted checkpoints | 30 days |
| Monthly aggregates | Indefinite |
| Proof chain entries | Lifetime of organization record |
| Drift Guard critical entries (score ≥ 0.75) | Lifetime of organization record |
| Branch packages | Lifetime of organization record |
| Approval decisions | Lifetime of organization record |

Snapshot compaction is a lossy process by design: intra-hour changes within the 30-day window are not individually retrievable. For post-incident investigations requiring minute-level fidelity within the first 72 hours, full snapshots are available.

---

## AI Governance

### Output Attribution

Every AI-generated ATLAS output (branch proposal, outcome projection, scene narrative) carries:

- **Model identity** — which model version produced the output
- **Confidence score** — numeric (0.0–1.0), surfaced in the UI and export bundle
- **Service attribution** — which SZL service orchestrated the inference
- **Proof chain ID** — foreign key to the immutable proof chain entry

### Human-in-the-Loop Requirement

ATLAS outputs are advisory. No branch is executed without explicit human approval. The approval gate is enforced at the Alloy workflow layer — it cannot be bypassed by AI agents. The approval record (approver identity, timestamp, decision, rationale) is written to the proof chain before any execution action is dispatched.

### Confidence Thresholds

When `ENABLE_EXECUTIVE_SAFE_MODE` is active:
- Projections with confidence below 0.60 are suppressed from the output
- Raw drift scores are replaced with qualitative labels (Nominal / Elevated / Critical)
- Technical simulation details are collapsed into summary statements

This mode does not alter the underlying data — it filters presentation only.

### Model Version Logging

All inference calls are logged with:
- Provider (OpenAI / Anthropic / Gemini)
- Model version
- Input token count
- Output token count
- Latency (ms)
- Correlation ID linking to the scene context

---

## Audit Trail

ATLAS is fully integrated with the SZL Proof Chain — the platform's immutable audit trail.

### Events Written to the Proof Chain

| Event | Trigger |
|-------|---------|
| Scene snapshot created | Scene Memory Router composes a new scene |
| Drift threshold crossed (≥ 0.75) | Drift Guard detects critical drift |
| Branch proposed | Scenario Forge generates a new branch |
| Branch approved | Human approves a branch in the UI |
| Branch rejected | Human rejects a branch |
| Branch executed | Alloy dispatches the approved branch action |
| OpenUSD export generated | Export adapter creates a manifest |
| Proof bundle exported | Export adapter creates a proof bundle |

### Proof Chain Guarantees

- Entries are immutable — once written, they cannot be modified or deleted
- Every entry carries a timestamp, actor identity (user ID + org ID), and content hash
- The proof chain is queryable by entity ID, time range, and event type
- Export bundles include the full proof chain segment for the relevant entity

---

## Operational Safety Controls

### Feature Flag Kill Switches

| Scenario | Action |
|----------|--------|
| ATLAS must be taken offline | Set `ENABLE_ATLAS_SPATIAL_RUNTIME` to `false` — all ATLAS routes return 503, no data loss |
| AI branch proposals must stop | Set `ENABLE_SCENARIO_FORGE` to `false` — manual branching still available |
| NIM endpoint issues | Set `ENABLE_NIM_PROVIDER` to `false` — falls back to standard AI engine |
| Board presentation needs clean outputs | Set `ENABLE_EXECUTIVE_SAFE_MODE` to `true` |

All flag changes are applied without restart and take effect within one request cycle.

### Demo vs. Production Isolation

Scene state in demo mode (`DEMO_MODE=true` or `NODE_ENV !== "production"`) is served from a seeded snapshot store with clearly labeled demo markers in the `metadata.demo` field. Demo scenes cannot be confused with production scenes because:

1. Demo scenes have `metadata.demo: true` in the database record
2. Demo scenes are created by the seed scripts under a dedicated demo organization ID
3. Export bundles carry a `demo: true` field in the manifest

### Replay Storage Security

Snapshot compaction files are stored within the same PostgreSQL instance as all other platform data, governed by the same encryption at rest, access controls, and backup policies. Snapshot data does not leave the database boundary unless explicitly exported via the proof bundle adapter.

---

## Known Limitations

| Limitation | Status |
|-----------|--------|
| OpenUSD binary output requires NVIDIA USD SDK | Stub only — roadmap item |
| Omniverse Nucleus staging not implemented | Roadmap item |
| Minute-level replay fidelity beyond 72 hours | Not available — by design (compaction policy) |
| NIM endpoint integration | Roadmap item — flag is plumbed but not active |

These limitations are documented honestly. None represent active security risks in the current deployment.

---

*See also: [Security Posture](security-posture.md) · [Trust Center](trust-center.md) · [Architecture](../architecture/atlas-spatial-runtime.md)*
