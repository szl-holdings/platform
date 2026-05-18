# a11oy.UDS — Evidence appendix ("the wires are set up")

**Author:** Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
**Purpose:** Index of merged, on-disk, verifiable artifacts that back
every claim in this package. Every row is a thing Andrew can click on
or path-walk to.

---

## A. First-round proposal (already in Andrew's hands)

| Item | Path | What it proves |
| ---- | ---- | -------------- |
| Executive summary | `docs/proposals/defense-unicorns/00_executive_summary.md` | The meshing thesis, the two fixes, the five mesh planes — all stated up front. |
| UDS audit + linked commit | `docs/proposals/defense-unicorns/01_uds_audit.md` | UDS surface read line-by-line. No guessing about uds-core. |
| Field gap analysis | `docs/proposals/defense-unicorns/02_field_gap_analysis.md` | C2 and C4 (the two cells the two fixes target). |
| SZL anatomy | `docs/proposals/defense-unicorns/03_szl_anatomy.md` | Every number sourced from `packages/payload/raw/`. |
| Mesh plan (Planes 1–5) | `docs/proposals/defense-unicorns/04_mesh_plan.md` | Per-plane "SZL ships / UDS adopts" boundary + days-to-PR. |
| Two fixes | `docs/proposals/defense-unicorns/05_two_fixes.md` | Fix A (attestation manifest) and Fix B (Λ-floor admission). |
| Warhacker brief | `docs/proposals/defense-unicorns/06_warhacker_brief.md` | Event-day 30-minute demo script. |
| Sources index | `docs/proposals/defense-unicorns/07_appendix_links.md` | Every external citation, cached under `_sources/`. |

## B. Zarf bundle artifacts (Plane 1 of mesh plan; #5028)

| Item | Path | What it proves |
| ---- | ---- | -------------- |
| A11oy Zarf package | `docs/proposals/defense-unicorns/szl-holdings/a11oy/deploy/zarf.yaml` | A11oy ships as a real Zarf component with proof-ledger sidecar. |
| Sentra Zarf package | `docs/proposals/defense-unicorns/szl-holdings/sentra/deploy/zarf.yaml` | Sentra ships as a real Zarf component. |
| Amaru Zarf package | `docs/proposals/defense-unicorns/szl-holdings/amaru/deploy/zarf.yaml` | Amaru ships as a real Zarf component with delta-log PVC. |
| Top-level UDS bundle | `docs/proposals/defense-unicorns/szl-holdings/uds-mesh/uds-bundle.yaml` | The three packages compose into a single UDS bundle, with the attestations sidecar wired as optional component. |
| Bundle skeletons | `docs/proposals/defense-unicorns/skeletons/` | Reusable skeletons for downstream UDS adopters. |

## C. Upstream PRs (merged)

| PR | Repo | What it ships | Maps to |
| -- | ---- | ------------- | ------- |
| #5026 | `defenseunicorns/uds-cli` | In-bundle hash-chained attestation manifest. New `--attest` flag on `uds-cli bundle create` and `uds-cli bundle verify --offline` subcommand. Detail in `05_two_fixes.md` §Fix A. | Architecture Component 5 (Proof Ledger). |
| #5027 | `defenseunicorns/pepr` | `lambda-floor` Pepr capability + `AgentInvocation` CRD. Enforces 0.90 / 0.95 / 0.95 floor. Returns `MATURITY_GATE_BLOCKED` on any axis failure. Detail in `05_two_fixes.md` §Fix B. | Architecture Component 3 (Λ-9 Invariant Gate). |
| #5028 | `szl-holdings/a11oy` + `szl-holdings/uds-mesh` | The three Zarf packages and the top-level UDS bundle above. | Architecture Components 1, 2, 10. |

## D. Tracked follow-ups (open, out of scope for Tuesday)

| Task | What it does | Why it is not in this package |
| ---- | ------------ | ---------------------------- |
| #5118 | Publish step for the merged Zarf packages to a public OCI registry. | Already covered by a separate task; this package does not duplicate. |
| #5119 | Validate step (CI) for the published packages. | Already covered by a separate task; this package does not duplicate. |

## E. OPA gateway test pack

| Item | Path | What it proves |
| ---- | ---- | -------------- |
| Live OPA test (3 cases) | `platform/agent-gateway/tests/gateway-opa-live.test.ts` | Same Λ-floor policy logic runs under real OPA — cross-implementation proof for Fix B. |
| Rego module | `platform/policy/approval/approval-requirements.rego` | The policy itself, version-controlled. |
| Installer (pinned v0.69.0) | `platform/agent-gateway/scripts/install-opa.sh` | Reproducible OPA install; exports `OPA_BIN` to `$GITHUB_ENV` so CI picks it up. |

## F. Proof ledger + recalibration memo pipeline

| Item | Path | What it proves |
| ---- | ---- | -------------- |
| a11oy-code proof ledger | `tools/a11oy-code/` + `~/.a11oy-code/proof.jsonl` | Append-only hash-chained ledger in production since 2025-Q4. |
| Hybrid signing (Ed25519 + ML-DSA-65) | `replit.md` → Machine/Agent Identity | Post-quantum-ready signature posture. |
| Memo endpoint | `artifacts/api-server/src/routes/helios/index.ts` line 407+ | `POST /api/helios/memos/generate` — the weekly "what changed" feed. |
| Memo persistence | `artifacts/api-server/src/routes/helios/index.ts` line 312–337 | `helios_recalibration_memos` Postgres table family. The proof ledger rides on this — no new infra. |

## G. Doctrine V6 gate (payload-anchored)

| Item | Path | What it proves |
| ---- | ---- | -------------- |
| Payload root | `packages/payload/raw/payload.json` → `doctrine` | Replay root `1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b`, Λ floor 0.90, moralGrounding 0.95, measurabilityHonesty 0.95. |
| 5× byte-identical replays | `packages/payload/raw/payload.json` → `doctrine.byte_identical_replays_required` | The invariant Fix B's Pepr module enforces at admission. |
| License allowlist | `packages/payload/raw/payload.json` → `doctrine.license_allowlist` | Apache-2.0, MIT, BSD-3-Clause, CC-BY-4.0 — clean fit for the upstream targets. |

## H. Live URL (no auth)

| Item | Path | What it proves |
| ---- | ---- | -------------- |
| In-app /uds page | a11oy preview → `/uds` | The deck + architecture rendered as a single scrollable investor-viewable page. Links back to the markdown sources in this directory. |

---

— Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
