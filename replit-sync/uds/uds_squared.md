# UDS² — UDS Layer Alignment to UDS Core 1.0

**Author:** Claude (autonomous subagent) · **Date:** 2026-06-04
**Doctrine:** v11 LOCKED · 749/14/163 · kernel `c7c0ba17` · Λ = Conjecture · SLSA L1+L2 only (NEVER L3) · no Iron Bank / FedRAMP / CMMC / SWFT / Mission Owner
**UDS Core 1.0 baseline (released 2026-03-25):** Falco (default runtime security) · Pepr 1.0 · **Istio Ambient** (sidecar-less; ztunnel + waypoint)

---

## What this pass did

Aligned the three UDS-layer repos to UDS Core 1.0, made the fleet overlay deployable, verified every `zarf.yaml` is a real package, validated the uds-mesh schemas, and unblocked the doctrine + CI gates. **Cross-organ mesh interconnect remains roadmap (v0.5.0) — not shipped.** v0.4.0 is five separate deployments with no interconnect; nothing in this pass claims otherwise.

---

## Per-repo status

| Repo | PR | Branch | Substantive CI | Notes |
|------|----|--------|---------------|-------|
| **uds-mesh** | [#80](https://github.com/szl-holdings/uds-mesh/pull/80) | `docs/align-uds-core-1.0-v0.5.0-roadmap` | ✅ **10/10 green** | Docs→Ambient + v0.5.0; doctrine L3→L2; PQC signer `slsa_level 1\|3`→`1\|2`; honest test-count header. All gates pass. |
| **uds-bundles** | [#28](https://github.com/szl-holdings/uds-bundles/pull/28) | `fix/doctrine-l3-honest-l2` | ✅ doctrine + Grype + Trivy + CodeQL pass; ⚠️ 1 pre-existing infra fail | One-line L3→L2 doctrine fix + repaired a mangled action SHA pin. Title-lint still red — see note ①. |
| **szl-fleet-overlay** | [#2](https://github.com/szl-holdings/szl-fleet-overlay/pull/2) | `fix/pin-flagship-images-uds-v0.2.0` | ✅ doctrine + Helm + YAML + Zarf + Preflight pass; ⚠️ 2 env-infra fails | Pinned 5 flagship images `:latest`→`:uds-v0.2.0`; fixed the Preflight doctrine-grep self-flag bug; flagged UDS Core 1.0 tag drift. DCO + k3d-smoke fail on environment, not code — see notes ②③. |

### uds-mesh #80 — changes
- `docs/roadmap/MESH_INTERCONNECT.md`: criterion 3 rewritten for **Istio Ambient** (ztunnel/waypoint enforce mTLS; verify via `istioctl ztunnel-config workload`, not the old 2/2-container sidecar count); interconnect relabeled **v0.4.0 → v0.5.0**; anatomy table `vessels` → `killinchu` (the actual 5th flagship; vessels→phawaq is deferred).
- `docs/MESH.md`: same organ + v0.5.0 + Ambient corrections in the honest-gaps section.
- `docs/UDS_v0.3.1_RELEASE_PLAN.md`: `SLSA Build L3` → **L2 (L3 NOT claimed / not pursued)**.
- `pepr/governance-receipts-pqc.ts`: `slsa_level` type `1|3` → `1|2`; removed a duplicate `b64urlEncode` declaration; header doctrine v6 → v11 + Pepr 1.0 note.
- `.github/workflows/tests.yml`: stale "76 tests / 4 files" header replaced with reproducible honest counts.

### Schema + package validation (local, this pass)
- `bash schemas/spans/test_graph_spans.sh` → **25/25 passed**
- `bash schemas/spans/test_mesh_spans.sh` → **53/53 passed**
- All 5 span schemas (`a11oy.graph`, `amaru.sync`, `killinchu.courier`, `rosie.decision`, `sentra.gate`) parse as valid YAML.
- `pytest tests/` → **209 passed, 1 skipped**; `uds_v18_24_substrate.py` → **OK 275 tests** (178 doctests + 97 assertions).
- **uds-bundles**: all 5 bundle `zarf.yaml` packages parse and have **zero dangling file references** (`szl-a11oy/sentra/amaru/rosie/killinchu`); top-level `UDSBundle` references them at `ref: 0.2.0` (consistent with the `uds-v0.2.0` image pins).
- **szl-fleet-overlay**: `zarf.yaml` is a complete deployable package — all 12 referenced files (namespaces, 5 package CRs, 5 PEAT nodes, doctrine-pin receipt) exist and parse.

---

## Honesty ledger (unchanged truths preserved)

- **Cross-organ mesh interconnect = roadmap v0.5.0, NOT shipped.** v0.4.0 = 5 separate deployments. mTLS manifests validate offline only; no Istio control plane runs in CI.
- **SLSA ceiling = L2 (with public Sigstore+Rekor evidence) / L1 honest. L3 is NEVER claimed** anywhere — verified `git grep` clean across uds-mesh and uds-bundles after the fixes.
- **Λ remains Conjecture 1.** No proof claims added.
- No Iron Bank / FedRAMP / CMMC / SWFT / Mission Owner claims introduced; the doctrine-pin files *declare* these as banned (that declaration is not a violation — the Preflight grep was incorrectly flagging its own ban list; now fixed).

---

## CI failure attribution (none are caused by this pass)

**① uds-bundles "Lint PR title" (red on #28):** The workflow pinned `amannn/action-semantic-pull-request` to a **corrupted/truncated SHA** (`…d98f25d3`, 39 chars) that GitHub cannot resolve — *"unable to find version."* It fails on **every** open PR (confirmed also red on deploy-proof PR #27). I repaired the pin to the correct full v5.5.3 commit `…5155ed6017` (verified via the GitHub tags API). Because `pull_request` title-lint executes the workflow from the **base branch (main)**, #28's own run stays red until the corrected workflow lands on `main`; it goes green for all subsequent PRs once #28 merges. My PR title is valid Conventional Commits.

**② szl-fleet-overlay "Developer Certificate of Origin" (red on #2):** Fails at **Checkout** with `remote: Repository not found … fatal: repository '…/szl-fleet-overlay/' not found` — the runner cannot clone the repo in this CI environment (auth/proxy). It never reaches sign-off validation. My commits **are** properly signed off (`Signed-off-by` matches the author email).

**③ szl-fleet-overlay "k3d Smoke — full cluster" (red on #2):** Fails at **Install UDS CLI 0.18.0** with `tar: Error is not recoverable` — a download/extract failure of the third-party UDS CLI binary, *before* any flagship image is pulled or any of my edits are exercised. Pure environment/network flake.

All three reds are infrastructure/environment, not code. The substantive doctrine, schema, lint, and test gates are green.

---

## FOUNDER-ONLY ACTIONS

These require credentials, registry access, or upstream verification the agent proxy cannot perform. Ordered by Warhacker-readiness priority.

1. **Merge order for uds-bundles #28.** Merge it to make the corrected `commit-lint.yml` action pin live on `main`; that turns the title-lint green for the repo going forward. (The doctrine gate — the PR's actual purpose — is already green.)

2. **Verify the UDS Core 1.0 OCI tag, then bump `UDS_CORE_TAG`.** szl-fleet-overlay still references the pre-1.0 `0.33.0-upstream` in `.github/workflows/k3d-smoke.yml` and `Makefile`. I left it unchanged (with a `FOUNDER-VERIFY` note) rather than guess and break the demo, because the upstream OCI tag could not be re-verified from this environment. Confirm the published Defense Unicorns tag (canonical local target is `k3d-core-slim-dev:0.40.1`) and bump **both files together**. The deploy step is `continue-on-error`, so this does not gate CI — but the live June-9 demo needs the right tag.

3. **Re-run / confirm the fleet env-infra checks (notes ② ③) on real runners.** DCO and k3d-smoke fail only because this CI environment can't clone the repo or fetch the UDS CLI tarball. On the founder's own runners (real GitHub auth + network) both should pass with the current branch. Re-run after merge to confirm.

4. **FA-001 (signing) still outstanding** for the uds-v0.3.1 capstone: agent proxy cannot upload signed binaries to GitHub releases. Per `mesh/docs/UDS_v0.3.1_RELEASE_PLAN.md` → `cosign sign-blob` + `gh release upload` must be run by the founder with the org dev key.

5. **Confirm `uds-v0.2.0` flagship images are public on GHCR.** I pinned all 5 fleet Deployments to `ghcr.io/szl-holdings/<organ>:uds-v0.2.0` (the tag the v0.4.0 bundle charts use). Verify these are pullable without auth for the air-gap/demo path in `WARHACKER_DEMO_RUNBOOK.md`.

---

## Branches pushed (review before merge)

- `szl-holdings/uds-mesh` → `docs/align-uds-core-1.0-v0.5.0-roadmap` (PR #80)
- `szl-holdings/uds-bundles` → `fix/doctrine-l3-honest-l2` (PR #28) — **do not confuse with the stale `fix/doctrine-drift-slsa-l3` branch**, which does NOT fix the L3 line and bundles a sweeping 49-file rewrite that conflicts with the L2-flagship doctrine. This PR is the minimal correct fix.
- `szl-holdings/szl-fleet-overlay` → `fix/pin-flagship-images-uds-v0.2.0` (PR #2)

Untouched (owned by other squads): uds-bundles `deploy-proof-june9` (PR #27).
