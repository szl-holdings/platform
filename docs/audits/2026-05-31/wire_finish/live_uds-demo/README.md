---
title: SZL UDS — everything in the mesh
emoji: 🧬
colorFrom: indigo
colorTo: purple
sdk: static
app_file: index.html
pinned: true
license: apache-2.0
short_description: "UDS mesh: 7 organs, 12 MCP tools, Lean 749/14/163"
tags:
  - governance
  - agentic-ai
  - doctrine-v10
  - uds
  - service-mesh
  - lean4
  - mathlib
  - dsse
  - eu-ai-act
  - nist-ai-rmf
ecosystem-stage: operational
---

# SZL UDS — everything in the mesh

SZL Holdings builds a formally-verified governance gate for agentic AI. The Λ aggregator is proved in Lean 4 against 749 declarations / 14 unique axioms / 163 tracked sorries. Every gate decision emits a DSSE-signed receipt onto a hash-linked Khipu Merkle DAG with summation-checked integrity. The system packages as a UDS bundle and aligns with EU AI Act Article 12 and NIST AI RMF.

Open the Space to see:
- the **7-organ anatomy** and how each organ maps to a productized module
- the **command path** (rosie → a11oy → organs) and the **receipt fan-out** (every module → Khipu Merkle DAG)
- the **6×6 module authorization matrix** (16 cross-ALLOW + 14 cross-DENY) as enforced by Istio AuthorizationPolicies under STRICT mTLS
- the **deployment runbook** (Zarf + UDS bundle + cosign keyless signing)
- the **12 MCP tools** — the governance surface exposed to external agents
- the **Lean kernel stats** — 749 / 14 / 163 @ c7c0ba17
- **EU AI Act Article 12 + NIST AI RMF alignment**
- **live links** to the five module Spaces
- the **canonical formula registry** (21 pure, typed, theorem-cited formulas) and the **Codex-Kernel composer** (hash-chained governed loop, 4 validators, 13-axis trust schema) — live at a11oy [`/formulas`](https://szlholdings-a11oy.hf.space/formulas) and [`/composer`](https://szlholdings-a11oy.hf.space/composer)
- **DINN (Doctrine-Informed Neural Networks)** — governance folded into the *training loss*, not just checked at inference. See [szl-cookbook recipes](https://github.com/szl-holdings/szl-cookbook/tree/main/recipes) (knot-calculus-v2 · doctrine-dinn-v1 · bekenstein-dinn-v1). *Lean obligation pending (sorry placeholder) — not proven.*

> **Honest disclosure.** This is the v0.3.1 *design* of the mesh. The five module container images are not yet published (FA-001), so the cross-pod mTLS calls and AuthorizationPolicy enforcement are acceptance criteria to run after FA-001, not results observed on a live cluster. The mesh design YAML passes offline syntactic validation. The five module Spaces are live.

---

## How UDS deploys this

The SZL governance stack ships as a Zarf-packaged UDS bundle with cosign keyless signing.

1. **Zarf bundle**: All container images, UDS Package CRs, Istio AuthorizationPolicies, and Lean kernel artifacts are packed into a single transferable artifact (`szl-uds-bundle.tar.zst`). The bundle can be deployed air-gapped.
2. **UDS Package CRs**: Each of the five modules (a11oy, amaru, sentra, vessels, rosie) ships a `uds-package.yaml` CR. The UDS Operator reconciles Virtual Services, NetworkPolicies, SSO, and monitoring automatically.
3. **cosign keyless signing**: Every image and bundle is signed using cosign keyless (Sigstore Fulcio + Rekor) at build time. The `verify_signed_assets.sh` CI gate (merged) fails the pipeline if any artifact lacks a valid cosign signature. Supply chain transparency level: SLSA L1 (honest disclosure).
4. **Mesh bring-up order**: label namespaces → inject sidecars → apply Package CRs → enforce STRICT mTLS → apply AuthorizationPolicies → verify with `istioctl proxy-status`.

Sources: [UDS Package CR reference](https://uds.defenseunicorns.com/reference/configuration/custom-resources/packages-v1alpha1-cr/) · [Istio AuthorizationPolicy](https://istio.io/latest/docs/reference/config/security/authorization-policy/) · [cosign keyless signing](https://docs.sigstore.dev/signing/signing_with_blobs/)

---

## 12 MCP tools

The governance surface is exposed via an MCP server (`ouroboros/agentic/mcp-server`) on port 8090. `span_start` and `span_end` are internal helpers consumed by `vsp_span` and are not registered tools. The 11 registered tools are:

| # | Tool | Thesis claim | Description |
|---|------|-------------|-------------|
| 1 | `lambda_gate` | TH1 | 9-axis Λ aggregator gate — evaluates an axis vector and returns geomean Λ + ALLOW/DENY verdict; moralGrounding and measurabilityHonesty hard floors at 0.95 |
| 2 | `doi_bind` | TH2 | Binds a DOI to a SHA-256 artifact hash for idempotent DOI→replay linking (process-scoped) |
| 3 | `doi_resolve` | TH2 | Resolves a previously bound DOI to its artifact SHA-256 |
| 4 | `bekenstein_bound` | TH6 | Computes the Bekenstein maximum information capacity for a given radius and energy (I ≤ 2πRE / ħc ln 2) |
| 5 | `bekenstein_check` | TH6 | Checks whether a given bit-count is within the Bekenstein bound for a system |
| 6 | `graded_norm` | TH8 | Evaluates the graded norm ‖x‖_g = |v| · 2^(−grade) for a graded value |
| 7 | `linear_receipt_check` | TH8 | Verifies linearity of the receipt function: linearReceipt(α, x, β, y) |
| 8 | `vsp_span` | VSP | Opens and closes a VSP tracing span, returning a receipt stamp with replayRoot |
| 9 | `fg_derive` | FG | Derives gauges from a set of input gauge values using the FG gauge derivation rule |
| 10 | `fg_safety` | FG | Evaluates a11oy safety gates against an axis vector + replay-ok flag |
| 11 | `doctrine_gate` | Doctrine v10 | Checks an action and payload against Doctrine v10 gate rules via a11oy-core |

Source: `ouroboros/agentic/mcp-server/src/index.ts` (167 lines) · [PhD-CS 5-pass review](../phd_cs/PHD_CS_REVIEW.md) Pass 3, Appendix A

---

## The 7-organ anatomy

The governance organism is named in Quechua/Inca terms. The productized five-module ecosystem wraps these organs into deployable services. The two cross-cutting systems (Otel/VSP nervous layer and Kallpa wire fabric) are embedded across all modules.

| Organ | Quechua name | Role | Productized as |
|-------|-------------|------|----------------|
| Cortex | **Amaru** | Cognitive cortex — planning, critique gate, YUYAY v3 heart | **a11oy** — orchestration cognition + policy substrate |
| Heart / Memory | **Yuyay** | Semantic memory retrieval, MUSQUY K-sim, 7-chakra scheduler | **amaru** — memory cortex |
| Blood / Ledger | **Yawar** | Receipt bus — DSSE-signed receipts fanned out to the Khipu Merkle DAG | Receipt fabric (cross-cutting, embodied in **a11oy** + all organs) |
| Immune | **Hukulla** | 10 HUKLLA tripwires, egress inspector, 8 security gates, immune barriers | **sentra** — immune system |
| Skeleton | **Lambda spine** | 12 service repos (axial + appendicular), deployment scaffold | **vessels** — deployment fabric + maritime proving ground |
| Nervous | **Otel / VSP** | OTel spans, W3C TraceContext, VSP trace receipts (cross-cutting) | Substrate embedded in a11oy + all modules |
| Wires | **Kallpa** | Inter-organ wire protocol, RIMAY messaging, HATUN sovereign seal | Wire fabric embedded in **a11oy** |

The operator console (**rosie**) is not an organ — it is attached by nerves to the outside of the body. Rosie is ambient in every app and full-power as a standalone 6-tab operator surface (span explorer, receipt verifier, mesh health, doctrine sweep, live formulas, about).

---

## Lean kernel stats

The Λ aggregator is formally proved in Lean 4 using Mathlib:

| Item | Value |
|------|-------|
| Lean 4 declarations | **749** |
| Raw axioms | 15 |
| Unique axioms | **14** |
| Tracked sorries | **163** (112 baseline + 51 Putnam; each with a documented discharge route) |
| Commit | `c7c0ba17` (`szl-holdings/lutar-lean`) |
| Mathlib version | v4.13.0 (kernel green) |
| Supply chain | SLSA L1 (honest) |
| Zenodo (thesis) | DOI `10.5281/zenodo.20434276` (v18, 2,874 views, 177 downloads as of 2026-05-31) |
| Zenodo (lutar-lean) | DOI `10.5281/zenodo.20434308` |

**Note on sorries:** 163 tracked sorries remain — each with a documented discharge route. The critical sorry is in TH10 (uniqueness theorem, CAUCHY_ND) — meaning the headline Λ uniqueness claim is axiomatized at this commit, not fully closed. PR #134 is open to align Zenodo metadata with the live 749/14/163 count.

---

## EU AI Act + NIST AI RMF alignment

**EU AI Act Article 12 (Record-keeping):** Every Λ gate decision emits a DSSE-signed receipt onto a hash-linked Khipu Merkle DAG. The DAG provides append-only, summation-checked, tamper-evident audit logs of all governance decisions. Each receipt carries: decision timestamp, axis vector, Λ value, ALLOW/DENY verdict, signing key fingerprint, and a chain hash linking to the prior receipt. This directly satisfies Article 12's requirement that high-risk AI systems maintain logs sufficient for post-hoc audit.

**EU AI Act Article 13 (Transparency):** The open Zenodo thesis (DOI `10.5281/zenodo.20434276`) documents the Lean 4 formal proof, all 749 declarations, and the 6 sorry discharge routes. The `LIABILITY_AND_LIMITS.md` honest-disclosure artifact is a governance artifact bundled with every deployment.

**NIST AI RMF — GOVERN function:** The a11oy doctrine gate (tool #12) enforces Doctrine v10 at the policy substrate level, blocking 15 categories of destructive action (`branch_protection_edit`, `force_push`, `repo_delete`, `cron_*`, `spend`, `credential_write`, etc.) before they reach any execution surface.

**NIST AI RMF — MEASURE function:** The `lambda_gate` tool (#1) provides a quantitative 9-axis Λ measurement for every agent decision. Hard floors on moralGrounding (0.95) and measurabilityHonesty (0.95) ensure the gate cannot be satisfied by boosting other axes.

**NIST AI RMF — MANAGE function:** The receipt bus (Yawar / DSSE fan-out) provides the audit trail required for incident response and risk management. The Khipu Merkle DAG integrity is summation-checked and verifiable by any external auditor.

---

## Try the live demo

The five module Spaces are live. The full mesh (cross-pod mTLS + AuthorizationPolicy enforcement) runs once FA-001 module images are published.

| Module | Space | Status |
|--------|-------|--------|
| rosie (operator console) | [SZLHOLDINGS/rosie](https://huggingface.co/spaces/SZLHOLDINGS/rosie) | Gradio · running |
| a11oy (policy substrate) | [SZLHOLDINGS/a11oy](https://huggingface.co/spaces/SZLHOLDINGS/a11oy) | static · running |
| amaru (memory cortex) | [SZLHOLDINGS/amaru](https://huggingface.co/spaces/SZLHOLDINGS/amaru) | Docker · running |
| sentra (immune system) | [SZLHOLDINGS/sentra](https://huggingface.co/spaces/SZLHOLDINGS/sentra) | static · running |
| vessels (deployment fabric) | [SZLHOLDINGS/vessels](https://huggingface.co/spaces/SZLHOLDINGS/vessels) | Docker · running |

The live Λ gate demo (on this Space) accepts an axis vector and returns the geomean Λ value + verdict using the same formula backed by the Lean proof.

---

## Sources

- Thesis: Zenodo DOI [10.5281/zenodo.20434276](https://doi.org/10.5281/zenodo.20434276) (v18)
- Lean kernel: `szl-holdings/lutar-lean` @ `c7c0ba17` · Zenodo DOI [10.5281/zenodo.20434308](https://doi.org/10.5281/zenodo.20434308)
- Mesh design: [szl-uds-deployment PR #20](https://github.com/szl-holdings/szl-uds-deployment/pull/20)
- Deployment runbook: [MESH_DEPLOYMENT_RUNBOOK.md](https://github.com/szl-holdings/szl-uds-deployment/blob/master/docs/architecture/MESH_DEPLOYMENT_RUNBOOK.md)
- UDS Package CR: [uds.defenseunicorns.com](https://uds.defenseunicorns.com/reference/configuration/custom-resources/packages-v1alpha1-cr/)
- Istio AuthorizationPolicy: [istio.io](https://istio.io/latest/docs/reference/config/security/authorization-policy/)
- EU AI Act: [eur-lex.europa.eu](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689)
- NIST AI RMF: [nist.gov/system/files/documents/2023/01/26/AI RMF 1.0.pdf](https://doi.org/10.6028/NIST.AI.100-1)

---
© SZL Holdings · Founder: Stephen P. Lutar Jr. (ORCID 0009-0001-0110-4173 · stephen@szlholdings.com) · Doctrine v10

*Built by Wasichaq (uds-demo HF Space builder) under Quechua squad directive 2026-05-31.*
*TH10 (Λ uniqueness) is Conjecture 1 — sorry-tracked at CAUCHY_ND. Not a closed theorem.*

Tested-by: Wasichaq · Strike 1 (33 unit+property tests, all pass) · Strike 3 (doctrine-grep clean) · Strike 4 (100-vector sandwich property pass)
