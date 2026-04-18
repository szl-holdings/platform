# Canonical Index — SZL Holdings Platform

**Date:** April 2026  
**Purpose:** For every legacy or overlapping doc in this repo, this index tells you which new canonical doc supersedes it, so readers know where truth lives.

---

## How to Use This Index

1. You found a doc. You want to know if it's current.
2. Find it in the "Legacy Doc" column below.
3. Read the "Canonical Replacement" column — that's the source of truth.
4. The legacy doc may still be useful for history or extended detail, but it is not authoritative.

If a legacy doc has no entry here, it is considered current until it is audited.

---

## Architecture and System Design

| Legacy Doc | Canonical Replacement | Notes |
|------------|----------------------|-------|
| `ARCHITECTURE.md` | [architecture.md](../architecture.md) | Root canonical doc now at lowercase `architecture.md`. `ARCHITECTURE.md` retains detail in some sections. |
| `docs/architecture.md` | [architecture.md](../architecture.md) | Older version (v2.0, March 2026). Superseded by root `architecture.md`. |
| `SYSTEM-OVERVIEW.md` | [architecture.md](../architecture.md) | System overview is now embedded in architecture.md. |
| `DEPENDENCY_MAP.md` | [architecture.md](../architecture.md) § Package Concept Ownership | Dependency and concept ownership table is in architecture.md. |
| `CONTROL_PLANE_ARCHITECTURE.md` | [architecture.md](../architecture.md) | Control plane section is part of architecture.md. |

## Platform Runtime / Build / Ops

| Legacy Doc | Canonical Replacement | Notes |
|------------|----------------------|-------|
| `docs/PLATFORM_CANONICAL.md` | `docs/PLATFORM_CANONICAL.md` (still canonical) | Build commands, runtime versions, env loading. Not replaced — still authoritative for ops. |
| `docs/deployment.md` | `docs/DEPLOYMENT_MODEL.md` | Deployment model documentation. |
| `docs/disaster-recovery.md` | `docs/disaster-recovery.md` | Still current. |

## Ontology and Data Model

| Legacy Doc | Canonical Replacement | Notes |
|------------|----------------------|-------|
| `DATA-MODEL.md` | [ontology.md](../ontology.md) | Entity types and domain taxonomy now in ontology.md. |
| `docs/EVENT_SCHEMA.md` | [ontology.md](../ontology.md) § Signals | Signal types and shapes are in ontology.md. |
| `docs/DECISION_LEDGER.md` | [ontology.md](../ontology.md) § Entity Snapshots | Snapshot and decision record shapes in ontology.md. |
| `docs/cognitive-runtime-schema.md` | [ontology.md](../ontology.md) | Cognitive runtime entity shapes map to ontology.md types. |
| `ATLAS_CORE_SPEC.md` (if present) | [ontology.md](../ontology.md) + `packages/atlas-core/` | ATLAS types are compatible; ontology.md is the human spec. |

## Policy, Proof, and Trust

| Legacy Doc | Canonical Replacement | Notes |
|------------|----------------------|-------|
| `PROOF_AND_POLICY_MODEL.md` | [policy-model.md](../policy-model.md) | Policy and proof model now in policy-model.md. PROOF_AND_POLICY_MODEL.md has UI component detail still useful. |
| `docs/trust/` | [policy-model.md](../policy-model.md) + `TRUST_CENTER_INDEX.md` | Trust docs are split: governance model in policy-model.md, trust center in TRUST_CENTER_INDEX.md. |
| `ACCESS-CONTROL-MATRIX.md` | `ACCESS-CONTROL-MATRIX.md` (still current) | RBAC matrix is authoritative. |
| `SECURITY-CHECKLIST.md` | `SECURITY-CHECKLIST.md` (still current) | Security controls. |
| `KNOWN-GAPS.md` | `KNOWN-GAPS.md` + [CODEX_HANDOFF.md](../CODEX_HANDOFF.md) § Known Gaps | Gap registry is in both places; KNOWN-GAPS.md is the full registry. |

## Telemetry and Observability

| Legacy Doc | Canonical Replacement | Notes |
|------------|----------------------|-------|
| `OBSERVABILITY_ARCHITECTURE.md` | [telemetry-model.md](../telemetry-model.md) | Telemetry layered model, observability surfaces, and correlation contract now in telemetry-model.md. |
| `docs/audit-ecosystem.md` | [telemetry-model.md](../telemetry-model.md) | Audit and observability ecosystem merged into telemetry-model.md. |

## Product Map and Moats

| Legacy Doc | Canonical Replacement | Notes |
|------------|----------------------|-------|
| `MOAT_MAP.md` | [app-moats.md](../app-moats.md) | Product naming map in app-moats.md. MOAT_MAP.md retains the full moat analysis with code evidence. |
| `DOMAIN_PACK_CATALOG.md` | [app-moats.md](../app-moats.md) | Domain pack definitions and product names in app-moats.md. DOMAIN_PACK_CATALOG.md has pack anatomy detail. |
| `PLATFORM_PRIMITIVES.md` | `PLATFORM_PRIMITIVES.md` (still canonical) | The six platform primitives doc is still authoritative for primitive-level detail. |
| `CATEGORY_POSITIONING.md` | `CATEGORY_POSITIONING.md` (still current) | Market positioning. |
| `PRODUCT_PACKAGING.md` | `PRODUCT_PACKAGING.md` (still current) | Packaging tiers. |
| `APP_STATUS.md` | [app-moats.md](../app-moats.md) § Canonical Product Map | Active/archived artifact list is now in app-moats.md. |

## Agent Handoff

| Legacy Doc | Canonical Replacement | Notes |
|------------|----------------------|-------|
| Any prior Codex/agent handoff docs | [CODEX_HANDOFF.md](../CODEX_HANDOFF.md) | Single canonical handoff doc. |
| `docs/alloy-runtime.md` | [architecture.md](../architecture.md) + `packages/alloy/` | Alloy is described in architecture.md; implementation in packages/alloy/. |

---

## Legacy Docs That Are Still Authoritative (Not Superseded)

These documents remain the source of truth in their domain:

| Document | Why It's Still Authoritative |
|----------|------------------------------|
| `docs/PLATFORM_CANONICAL.md` | Build commands, runtime versions, workspace conventions |
| `PLATFORM_PRIMITIVES.md` | Six platform primitives — deep technical reference |
| `PROOF_AND_POLICY_MODEL.md` | UI component shapes (ProofPanel, PolicyResult, etc.) |
| `MOAT_MAP.md` | Full moat analysis with code evidence per moat |
| `DOMAIN_PACK_CATALOG.md` | Domain pack anatomy, agent lists, scenario library |
| `ACCESS-CONTROL-MATRIX.md` | RBAC role matrix |
| `SECURITY-CHECKLIST.md` | Security control mapping |
| `KNOWN-GAPS.md` | Full gap registry |
| `TRUST_CENTER_INDEX.md` | Trust center documentation index |
| `docs/trust/` | Security posture, privacy, deployment model detail |
| `docs/DOMAIN_PACK_STANDARD.md` | Standard for adding new domain packs |
| `docs/DEMO_DATA_POLICY.md` | Demo data governance |
| `docs/DEPENDENCY_POLICY.md` | Dependency version and update policy |
| `AUDIT_FINDINGS_REGISTER.md` | Open architectural findings |

---

*Maintain this index when new canonical docs are created or when legacy docs are fully retired. The goal is that a reader who finds any doc in the repo can quickly locate the authoritative version.*
