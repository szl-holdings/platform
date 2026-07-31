# Vertical runtime-contract live-SHA correction

- `workcell_id`: `VERTICAL-RUNTIME-CONTRACTS-2026-07-31`
- `correction_of`:
  [`VERTICAL_RUNTIME_CONTRACT_PROOF_2026-07-31.md`](VERTICAL_RUNTIME_CONTRACT_PROOF_2026-07-31.md)
- `agent`: `Codex`
- `objective`: preserve the immutable original deployment evidence while
  correcting the current Vessels runtime identity after a signed
  dependency-hardening successor advanced Killinchu main.
- `plan_summary`:
  1. detect drift through a fresh live frontier preflight;
  2. bind the observed runtime SHA to current signed repository main;
  3. verify exact-main workflows, governed deployment, attestation, and live
     endpoint identity;
  4. rerun Vessels conformance with the current exact base URL and SHA;
  5. update current-state documentation and append this correction rather than
     modifying the merged proof packet.
- `patch_summary`:
  - `docs/conformance/VERTICAL_CONFORMANCE.md` now names the current exact
    deployed Killinchu SHA and attestation;
  - `docs/operations/known-gaps.md` preserves the PR #301 deployment as
    historical evidence and records the dependency-only PR #302 successor;
  - this append-only packet distinguishes historical proof from current live
    identity without changing the `2/7` Vessels result.
- `test_results`:
  - GitHub current-main readback: signed Killinchu commit
    `305d6aaf67b3d6edd3c4c065a5c8ac90006a1dba`, `verified=true`, from PR #302;
  - exact-main workflow readback: `17/17` workflows terminal `success`;
  - governed deployment:
    <https://github.com/szl-holdings/killinchu/actions/runs/30595522086>,
    terminal `success`;
  - live `/version.gitSha` and `/api/build-info.build.revision`:
    `305d6aaf67b3d6edd3c4c065a5c8ac90006a1dba`;
  - live `/api/build-info.release_receipt.attestation_id`: `38078930`;
  - explicit current-SHA `pnpm frontier:preflight` at
    `2026-07-31T01:58:37.790Z`: exit `0`, Vessels `2/7`, overall
    `0/3 VERIFIED`;
  - signed Platform main `f073afd8bd1c23997c2d205aca02950509a3fc07`
    exact-main workflows: `21/21` terminal success or accepted neutral/skip;
  - `pnpm claims:validate`: exit `0`, canonical truth and allowlist coverage
    passed, `89/89` truth tests passed;
  - `pnpm docs:claims-check`: exit `0`, `26/26` documentation claims verified;
  - `pnpm audit:source-of-truth`: exit `0`, `66/66` checks passed;
  - `node scripts/qa/scan-secrets.js .`: exit `0`, clean;
  - `git diff --check`: exit `0`.
- `screenshot_refs`: no UI changed. The applicable full catalog disposition is
  [`audit/screenshot-catalog.md`](../screenshot-catalog.md#2026-07-31-runtime-contract-release-proof-disposition).
- `verification_notes`: the successor is a signed pytest security-pin change
  that retained the runtime contract. Exact repository main, governed
  deployment, live SHA, release attestation, and explicit conformance input all
  agree on `305d6aaf67b3d6edd3c4c065a5c8ac90006a1dba`.
- `public_claim_check`: this correction preserves `CANDIDATE`, `2/7`, and
  `0/3 VERIFIED`; it adds no conformant, portable-receipt, or release-ready
  claim.
- `security_check`: no credential, secret, protection, governance, A11oy,
  qillqaq, locked PR, or protected deployment approval was changed or exposed.
- `known_gaps_update`: the current live identity is corrected; the five absent
  Vessels conformance gates and every external account-bound blocker remain
  open.
- `mirroreval_assessment`:

  | Dimension | Score | Threshold | Evidence |
  |---|---:|---:|---|
  | Groundedness | 0.97 | 0.75 | Repository, workflow, deployment, route, and attestation agree. |
  | Evidence Coverage | 0.90 | 0.70 | Positive identity and five absent gates are both recorded. |
  | Action Safety | 0.97 | 0.85 | Correction changes claims only and preserves fail-closed state. |
  | Hallucination Risk | 0.98 | 0.80 | Current claims use exact live and GitHub readback. |
  | Policy Compliance | 0.93 | 0.90 | Append-only correction preserves every active coordination lock. |
  | Tool Risk | 0.92 | 0.80 | Read-only probes and normal protected git flow are used. |
  | Stale Context | 0.99 | 0.70 | Drift was detected and corrected in the same session. |
  | Verification Readiness | 0.98 | 0.65 | SHA, routes, run, and attestation remain independently readable. |
  | Counterfactual Strength | 0.80 | 0.60 | Leaving the old SHA current would create immediate truth drift. |
  | Causal Validity | 0.94 | 0.70 | PR #302 caused identity drift but did not change conformance gates. |
  | Approval Alignment | 0.96 | 0.90 | Only normal protected flows are used; no approval is self-issued. |
  | Scope Adherence | 0.97 | 0.85 | Correction is limited to current truth and append-only evidence. |
  | Output Fidelity | 0.95 | 0.75 | Historical and current identities are explicitly separated. |
  | Proof Completeness | 0.92 | 0.80 | Level 5 fields, catalog disposition, and scores are present. |

  Equal-weight composite: `0.94`. Disposition: `pass`; no dimension is below
  threshold. This evaluates the correction packet, not product conformance.
- `release_readiness_score`:

  | Category | Weight | Score | Weighted points |
  |---|---:|---:|---:|
  | Code Quality | 15% | 95 | 14.25 |
  | Security | 20% | 96 | 19.20 |
  | Public Claims Safety | 15% | 100 | 15.00 |
  | Screenshot Freshness | 10% | 100 | 10.00 |
  | Documentation Currency | 10% | 98 | 9.80 |
  | Proof Completeness | 10% | 95 | 9.50 |
  | Naming and Language | 5% | 100 | 5.00 |
  | Architecture Integrity | 10% | 40 | 4.00 |
  | Governance | 5% | 65 | 3.25 |

  Weighted composite: `90.00/100`. Verdict: `RELEASE BLOCKED` because
  Architecture Integrity is below `50`; Governance also remains below `70`.
  The score does not authorize a `3/3` or conformant-product claim.
- `proof_level`: `5` (`Release Proof`), with the existing full screenshot
  disposition, MirrorEval assessment, and Release Readiness Score. Release
  readiness remains blocked.
- `recorded_at`: `2026-07-30T21:58:37-04:00`
- `recorded_by`: `Codex`
