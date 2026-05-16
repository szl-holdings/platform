# §03 — SZL Holdings anatomy

**Author:** Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
**Sourced from:** `packages/payload/raw/` (Doctrine V6 canonical payload)
**Replay root:** `1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b`

Every number below is a direct read of the payload — no rounded marketing
claims. Each subsection cites its source file and JSON path.

---

## 3.1 Doctrine V6 (the floor every component sits on)

Sourced from `packages/payload/raw/payload.json` → `doctrine`:

| Field                              | Value                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------ |
| `version`                          | `V6`                                                                     |
| `replay_root`                      | `1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b`       |
| `byline_canonical`                 | `Lutar, Stephen P.`                                                      |
| `license_allowlist`                | `Apache-2.0`, `MIT`, `BSD-3-Clause`, `CC-BY-4.0`                         |
| `ingestion_policy`                 | `PUBLIC_ONLY`                                                            |
| `byte_identical_replays_required`  | `5`                                                                      |
| `lambda_axes_count`                | `9`                                                                      |
| `lambda_conjunctive_floor`         | `0.90`                                                                   |
| `moralGrounding_floor`             | `0.95`                                                                   |
| `measurabilityHonesty_floor`       | `0.95`                                                                   |

These are the constants Fix B's Pepr module enforces at admission time.

## 3.2 DOI ledger + thesis lineage

Sourced from `packages/payload/raw/dev1_thesis/thesis_payload.json`.

- **Concept DOI:** `10.5281/zenodo.19944926`
- **v11 DOI (TH1–TH3 published):** `10.5281/zenodo.20119582`
- **v14 DOI (TH4–TH7 published):** same versioned record, status
  `published v14`.
- **TH1 — Λ-Gate Invariant (Composability):** informal proof, depends on
  nothing. Statement at `thesis_lineage.TH1-TH3.theorems[0]`.
- **TH2 — Replay-DOI Duality:** informal, depends on TH1. The 5× replay
  root above is *the* anchor.
- **TH3 — ρ-Closure Completeness:** informal, depends on TH1+TH2.
  Production result quoted in the payload: `100% rho-closure on
  8,000/8,000 paired calls`.
- **TH4 — Λ-Category Composability:** conjectured.
- **TH5 — Chain Confluence (Receipt Chain as Cofree Comonad):** conjectured.
- **TH6 — Bekenstein Entropy Bound via DPI:** informal proof complete.
- **TH7 — Curry-Howard Receipt Calculus:** Lean 4 mechanized, `sorry`
  count = 0 on the published surface.
- **TH8 — Graded Λ-Receipt Calculus (GΛR):** proposal + Lean 4 skeleton;
  TH8a / TH8b / TH8c each have a pending `sorry`.

### Lean 4 mechanization counts

From `fly_high_v6_audit`:
- `lean_th8_theorems`: **35**
- `lean_th8_sorries`: **8** (closure tracked in task #4940)
- Target venue: POPL 2027 (Aug 2026 submission) or CAV 2027 (Jan 2027).

### Canonical citation hardening
- 117 URLs in the arXiv package; 99 OK; 2 mandatory fixes applied.
- arXiv submission SHA-256: `13ca4a0617dddfa619e97d48a65b042d13d229481354f085f7dcc9199af5973b`
- arXiv submission status: `READY_AWAITING_CONFIRM` (one-way door,
  stays gated).

## 3.3 16-repo org inventory + per-repo state

Sourced from `packages/payload/raw/github_pro/github_inventory.json` and
`payload.json` → `org_summary`.

- `repos_total`: **16**
- `ci_failing`: **0**
- `open_prs`: **64**
- `open_alerts_code_scanning`: **115**
- `open_dependabot_high_critical`: **0**
- `scorecard_avg`: **6.62**
- `branch_protection_compliant`: **10 / 16**
- `branch_protection_weak`: **6 / 16**
- `hygiene_gaps`: `vsp-otel`, `agi-forecast`

The four repos that matter for this proposal:

| Repo                         | Description (from inventory)                                                                                | Latest tag    | OpenSSF score | Open PRs |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------- | ------------- | -------- |
| `szl-holdings/a11oy`         | Governed agentic execution fabric. Policy gates, signal mesh, proof ledger, Λ invariant runtime.            | `v1.0.0-alpha` | (see inventory) | 6        |
| `szl-holdings/sentra`        | Cyber resilience command. Threat modeling, posture drift, incident response, policy-gated remediation.     | `v1.0.0-alpha` | (see inventory) | (see inventory) |
| `szl-holdings/amaru`         | Convergent multi-source data sync. Append-only delta logs, hash-verified ingest, bounded loops.            | `v1.0.0-alpha` | 6.8           | 5        |
| `szl-holdings/lutar-lean`    | Machine-checked Lean 4 proofs of the Lutar Invariant (Λ_k) — uniqueness theorem and Egyptian-exact weights. | —             | (see inventory) | (see inventory) |

## 3.4 A11oy capabilities (what we'd ship as the Zarf package)

Sourced from `packages/payload/raw/dev2_runtime/raw_runtime/a11oy.json`
and from this monorepo's `artifacts/api-server/src/routes/`:

- **Governed agent OS** with policy gates and Λ-9 invariant runtime.
- **`/code` CLI** (`tools/a11oy-code/`) writing an append-only proof
  ledger at `~/.a11oy-code/proof.jsonl`, hash-chained SHA-256.
- **Frontier registry** and governance panels.
- **Proof ledger** as a first-class artifact (the Fix A surface).
- **SentraOps bridge** wiring A11oy decisions into Sentra posture.
- **A11oy-knowledge package** (`@szl-holdings/a11oy-knowledge` v0.3.0,
  v0.4.0 draft in flight): axioms A1–A14, theorems TH1–TH7, derivations
  T1–T10, constants K01–K13, DOI ledger, doctrine clauses, vertical
  routing.

## 3.5 Sentra capabilities

Sourced from the live route at
`artifacts/api-server/src/routes/sentra-posture.ts` and from
`packages/payload/raw/payload.json` → `sentra_posture`:

- **CPS catalog** (Cyber Payload Standard — signed, versioned automation
  package with detect/decide/act/approve/recover sections).
- **Adversary emulation scorecard** and **maturity gate** (the
  `MATURITY_GATE_BLOCKED` pattern Fix B inherits).
- **Posture API** (`GET /api/sentra/posture`) — financial exposure,
  open incidents, critical alerts, compromised assets, 7-day trend,
  top CVE findings, insurance posture.
- **Insurance posture**: carrier `Chartered Hazard Re`, policy
  `CHR-2024-991`, coverage limit `$10,000,000`, retention `$500,000`,
  fail clause "Backup staleness + compromised asset triggers section
  8.3", pass clause "All policy clauses satisfied".
- **Incident timeline** + **hash-chained audit chain** (per-event
  Ed25519 + ML-DSA-65 hybrid signatures, see `replit.md` →
  Machine/Agent Identity).

Exposure model (also payload-anchored):
- `base_unsegmented_ot_usd`: **$1,400,000**
- `per_open_incident_usd`: **$350,000**
- `per_compromised_asset_usd`: **$700,000**

## 3.6 Amaru (Ouroboros / Conduit) capabilities

Sourced from `dev2_runtime/raw_runtime/amaru.json` and
`dev2_runtime/raw_runtime/ouroboros.json`:

- **Governed data fabric** with hash-verified ingest and append-only
  delta logs.
- **`/api/conduit/*`** endpoints (replay-bound syncs).
- **Bounded loops with measurable convergence** (Ouroboros loop kernel,
  218/218 tests, Apache-2.0).

## 3.7 Lutar Calculus

Sourced from `dev1_thesis/thesis_payload.json`:

- **Axioms:** A1–A14 (A1–A9 in published v11; A10–A14 in v0.4.0 draft).
- **Theorems:** TH1–TH7 (TH1–TH3 published v11; TH4–TH7 published v14;
  TH8 proposal + Lean 4 skeleton).
- **Derivations:** T1–T10.
- **Constants:** K01–K13.

## 3.8 OPA gateway test pack + Lean 4 mechanization

- **OPA pack:** `platform/agent-gateway/tests/gateway-opa-live.test.ts`
  spins up a real `opa` process bound to
  `platform/policy/approval/approval-requirements.rego`, drives a
  production-targeted `inspect_code` request through the gateway, and
  asserts the policy decision is honored end-to-end (3 tests:
  prod-gated, dev-ungated, fail-closed-on-OPA-down). Companion installer
  at `platform/agent-gateway/scripts/install-opa.sh` pins OPA `v0.69.0`
  and exports `OPA_BIN` to `$GITHUB_ENV` so CI picks it up.
- **Lean 4 mechanization:** see §3.2.

## 3.9 Pepr-shaped potential

A11oy's invariant runtime is already a TypeScript Λ-9 evaluator. Pepr is
TypeScript admission middleware. The structural match is direct:
A11oy's gate evaluator → Pepr `Capability.Mutate / Validate` handler is
a near-mechanical wrap. That's the engineering basis for §05 Fix B.
