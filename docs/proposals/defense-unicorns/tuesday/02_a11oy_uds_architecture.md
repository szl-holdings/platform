# a11oy.UDS — Architecture

**Author:** Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
**Companion to:** `01_vision_deck.md`, `03_meshing_writeup.md`
**Status:** Architecture document. Every named component either ships in
this monorepo today or is grounded in a merged upstream PR.

---

## 1. System view

```
                          ┌─────────────────────────────────────┐
                          │           UDS Cluster               │
                          │                                     │
   ┌────────┐    SSO      │  ┌────────────────────────────────┐ │
   │ User   │ ──────────► │  │  Keycloak (UDS identity)       │ │
   └────────┘             │  └──────────────┬─────────────────┘ │
                          │                 │                   │
                          │  ┌──────────────▼─────────────────┐ │
                          │  │  Istio tenant gateway          │ │
                          │  └──────────────┬─────────────────┘ │
                          │                 │                   │
   ┌────────────────────────────────────────▼─────────────────┐ │
   │                a11oy.UDS                                 │ │
   │                                                          │ │
   │  ┌────────────────┐   ┌─────────────────────┐            │ │
   │  │ Orchestration  │──►│  Approval Gates     │            │ │
   │  │ Plane          │   │  (Pepr admission +  │            │ │
   │  │ (signal mesh,  │   │   UDS policy engine)│            │ │
   │  │  planner,      │   └──────────┬──────────┘            │ │
   │  │  workcells)    │              │                       │ │
   │  └───────┬────────┘   ┌──────────▼──────────┐            │ │
   │          │            │  Λ-9 Invariant Gate │            │ │
   │          │            │  (pepr #5027)       │            │ │
   │          │            └──────────┬──────────┘            │ │
   │          │                       │                       │ │
   │  ┌───────▼────────┐   ┌──────────▼──────────┐            │ │
   │  │ Artifact       │   │  Agent / Approval   │            │ │
   │  │ Registry       │◄──┤  Workers            │            │ │
   │  │ (models,       │   │  (Temporal-backed)  │            │ │
   │  │  prompts,      │   └──────────┬──────────┘            │ │
   │  │  evals, agents,│              │                       │ │
   │  │  embeddings)   │              │                       │ │
   │  └───────┬────────┘              │                       │ │
   │          │            ┌──────────▼──────────┐            │ │
   │  ┌───────▼────────┐   │  Embedding / RAG    │            │ │
   │  │ Proof Ledger   │◄──┤  Fabric             │            │ │
   │  │ (Ed25519 +     │   └─────────────────────┘            │ │
   │  │  ML-DSA-65,    │                                      │ │
   │  │  uds-cli #5026 │                                      │ │
   │  │  sidecar)      │                                      │ │
   │  └───────┬────────┘                                      │ │
   │          │                                               │ │
   └──────────┼───────────────────────────────────────────────┘ │
              │                                                 │
              │   ┌──────────────────────────────────────────┐  │
              └──►│ Loki + Prometheus (UDS observability)    │  │
                  └──────────────────────────────────────────┘  │
                                                                │
                  ┌──────────────────────────────────────────┐  │
                  │ NetworkPolicies (UDS-default deny)       │  │
                  └──────────────────────────────────────────┘  │
                          UDS Core (uds-core)                   │
                          └─────────────────────────────────────┘
```

The boundary is intentional: every arrow that crosses the a11oy.UDS box
also crosses a UDS primitive. There is no a11oy.UDS surface that
bypasses UDS identity, policy, or observability.

## 2. Per-component table

| # | Component in a11oy today | Becomes in a11oy.UDS | UDS primitive inherited | Integration surface | State |
| - | ------------------------ | -------------------- | ----------------------- | ------------------- | ----- |
| 1 | Signal Mesh + Workcell engine (`artifacts/a11oy/src/pages/SignalMesh.tsx`, `Workcells.tsx`) | Orchestration plane, deployed as a Zarf component | Pepr operator hooks for lifecycle | Pepr `Capability.Watch` on `Workcell` CR | **Wired** via `szl-holdings/a11oy/deploy/zarf.yaml` (#5028) |
| 2 | Approval Queue (`ApprovalQueue.tsx`, `platform/agent-gateway/`) | Approval gates as a UDS admission policy | UDS policy engine + Pepr admission | Pepr `Capability.Validate` denial path | **Wired** via pepr #5027 (Λ-floor admission) |
| 3 | Λ-9 Invariant Runtime (`packages/payload/raw/payload.json` → `doctrine`) | Pepr admission module enforcing 0.90 / 0.95 / 0.95 floor | Pepr admission | Same Pepr capability as #2 | **Merged** as pepr #5027 |
| 4 | Frontier registry + thesis-scoring (`pages/frontier/`, `pages/Frontier.tsx`) | Artifact registry for models / prompts / embeddings / evals / agents | Zarf OCI registry + SBOM flow | Custom CRD `AIArtifact{kind,sha256,sbom,attestation}` | **Wired** prototype; CRD spec under §5 below |
| 5 | Proof Ledger (`pages/ProofLedger.tsx`, `~/.a11oy-code/proof.jsonl`) | In-bundle attestation sidecar + Loki stream | uds-cli attestation manifest + Loki | `uds-cli bundle verify --offline` walks the chain | **Merged** as uds-cli #5026 |
| 6 | Recalibration Memo pipeline (`POST /api/helios/memos/generate`) | UDS-aware weekly fleet "what-changed" feed | `uds-cli bundle inspect` inventory | New endpoint accepts bundle inventory POST | **Wired in a11oy**; cli subcommand is Option C scope |
| 7 | Agent Identity Registry (`pages/AgentIdentityRegistry.tsx`) | Keycloak-backed agent identities | Keycloak realm + client | OIDC client per agent class | **Planned** — Week 1 of proof plan |
| 8 | Embedding / RAG fabric (`pages/AgenticRag.tsx`, `MemoryVault`) | RAG with attested embeddings | Zarf-attested embedding bundles | Embedding bundle = signed Zarf component | **Planned** — Week 3 of proof plan |
| 9 | Telemetry (a11oy in-app) | Loki + Prometheus exporters | UDS observability stack | OTLP → Loki, `/metrics` → Prometheus | **Planned** — Week 1 of proof plan |
| 10 | NetworkPolicy posture | UDS-default deny + a11oy-namespace allow-list | NetworkPolicies | Standard UDS `Package` CR exposing endpoints | **Wired** via the bundle manifests (#5028) |

## 3. Problem-to-component mapping

### Problem 1 — Trusted AI/agent orchestration inside air-gapped UDS

| Need | a11oy.UDS component | UDS primitive |
| ---- | ------------------- | ------------- |
| Provenance for every tool call | Component 5 (Proof Ledger) | uds-cli #5026 sidecar, Loki |
| Human-in-the-loop approval gates | Components 2 + 3 (Approval, Λ-9) | Pepr admission, UDS policy engine |
| Immutable tool-call audit | Component 5 + Loki | Loki retention, sidecar signing |
| Disconnected operation | uds-cli #5026 offline-verify path | Zarf bundle is self-contained |
| Identity for agents | Component 7 (Agent Identity) | Keycloak realm |

### Problem 2 — UDS-native artifact spine for AI

| Need | a11oy.UDS component | UDS primitive |
| ---- | ------------------- | ------------- |
| SBOM-style attestation per artifact | Component 4 (Artifact Registry) | Zarf SBOM + OCI registry |
| Signed evals | Component 4, `AIArtifact{kind: eval}` | Cosign signature in OCI |
| Drift detection | Component 4 + 6 (Memo) | Recalibration memo feed |
| Promote / queue / discard flow | Component 4 lifecycle states | Mirror of Zarf package flow |
| In-cluster RAG over attested embeddings | Component 8 (Embedding fabric) | Signed Zarf components |

## 4. Where each upstream wire already lives

- **In-bundle attestation manifest** → `uds-cli` PR #5026.
  Adds `--attest` flag to `uds-cli bundle create`, hash-chained
  `attestations.jsonl` at `/uds-bundle/attestations.jsonl`, and
  `uds-cli bundle verify --offline` subcommand. Detail in
  `docs/proposals/defense-unicorns/05_two_fixes.md` §Fix A.
- **Λ-floor Pepr admission module** → `pepr` PR #5027.
  `lambda-floor` capability enforcing Λ ≥ 0.90, moralGrounding ≥ 0.95,
  measurabilityHonesty ≥ 0.95 against an `AgentInvocation` CR.
  Detail in `docs/proposals/defense-unicorns/05_two_fixes.md` §Fix B.
- **Three Zarf packages + UDS bundle** → merged under
  `docs/proposals/defense-unicorns/szl-holdings/{a11oy,sentra,amaru}/deploy/zarf.yaml`
  and `docs/proposals/defense-unicorns/szl-holdings/uds-mesh/uds-bundle.yaml`.
  Referenced as #5028 in the email thread.
- **OPA gateway test pack** →
  `platform/agent-gateway/tests/gateway-opa-live.test.ts` + pinned
  installer at `platform/agent-gateway/scripts/install-opa.sh` (OPA
  v0.69.0). Cross-implementation proof-of-work for Λ-floor.
- **Proof ledger persistence** —
  `artifacts/api-server/src/routes/helios/index.ts` line 312–337
  (`helios_recalibration_memos` table family is the persistence shape
  the proof ledger rides on).
- **Mesh plan** → `docs/proposals/defense-unicorns/04_mesh_plan.md`
  (Planes 1–5 with day-to-PR estimates).

## 5. CRD sketch — `AIArtifact`

```yaml
apiVersion: a11oy.uds.dev/v1alpha1
kind: AIArtifact
metadata:
  name: thesis-scorer-v3
  namespace: a11oy
spec:
  kind: eval                       # one of: model | prompt | embedding | agent | eval
  sha256: "…"
  sbom: oci://…/sbom.json
  attestation: oci://…/attestation.intoto.jsonl
  lifecycle: queued                # candidate | queued | promoted | discarded
  driftPolicy:
    metric: cosine
    threshold: 0.06
  signer: did:plat:szl-a11oy-prod
status:
  lambda:
    conj: 0.94
    moralGrounding: 0.97
    measurabilityHonesty: 0.96
  lastEvaluated: "2026-05-19T12:00:00Z"
```

This is the artifact-spine surface a11oy.UDS exposes to UDS operators.
Lifecycle transitions are gated by Component 3 (Λ-9) and Component 2
(Approval).

## 6. Formula ↔ Lean traceability (machine-checked claims)

The writeup refers to "machine-checked formulas" wherever it talks about
the Λ-9 floor and the proof ledger. The full binding table — every
registry formula in `lib/formulas/src/registry.ts` paired with the Lean
lemma in `packages/lean-formulas/` that backs it, with an honest
**formalized** vs **registered but not yet formalized** split — is in
the companion appendix:

- `02a_formula_lean_traceability.md` — appendix.

Headline today: exactly one registry formula
(`null-space-projection`) is bound to a Lean lemma
(`null_space_projection` in `packages/lean-formulas/Connection/NullSpace.lean`),
discharged in pure Lean 4 with no `axiom` and no mathlib dependency.
Three other Lean files (`Substance/GCA.lean`, `Anatomy/Boundary.lean`,
`Forecast/Perturbation.lean`) formalize platform shims but do not yet
have matching registry entries; two of them are explicitly axiom-gated.
Ten further registry entries are registered with provenance but have no
Lean lemma. The appendix names each one.

## 7. What this architecture deliberately does **not** introduce

- No new identity provider — Keycloak is canonical.
- No new policy engine — UDS policy engine + Pepr admission.
- No new observability stack — Loki + Prometheus.
- No new package format — Zarf + OCI.
- No new deploy substrate — uds-cli + uds-core.

Every novel surface a11oy.UDS adds is **above** the UDS line:
governed-agent orchestration, the AI artifact spine, the proof ledger
schema, the Λ-9 floor. Everything else is borrowed.

---

— Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
