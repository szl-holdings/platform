# SZL Holdings — GitHub Org Audit (2026-05-27 delta)

**Date:** 2026-05-27
**Scope:** All 20 repos in `github.com/szl-holdings/*` + 6 personal repos
**This document:** A point-in-time delta. It does **not** supersede the canonical audits.
**Canonical references (do not duplicate, extend):**
- `docs/audit/series-a-full-audit.md` — full series-a audit
- `docs/audit/series-a-gap-register.md` — living gap register (GAP-001…015)
- `docs/audit/github-deep-scan.md` + `github-overhaul-audit.md` — prior org-level scans
- `docs/A11OY_RELEASE_DOCTRINE.md` — release readiness scorecard methodology
- `docs/RELEASE_GATES.md` — CI/security/manual gates
- `scripts/release/uds-version-sync.json` — UDS bundle source of truth
- `scripts/release/uds-release.sh` — local release gate

**Posture:** No bandaids. No hallucinations. Every finding either ties to a file, a tag, or a CI run.

---

## 1. Release gate (local proof, today)

Ran `bash scripts/release/uds-release.sh` from a clean checkout — **PASSED end-to-end.**

| Bundle      | Version | sha256 | cosign     | smoke | Verdict     |
|-------------|---------|--------|------------|-------|-------------|
| a11oy-uds   | 0.1.1   | ✓      | unsigned   | ✓     | OK (G2)     |
| sentra-uds  | 0.2.0   | ✓      | unsigned   | ✓     | OK (G2)     |
| amaru-uds   | 0.1.0   | ✓      | unsigned   | ✓     | OK (G2)     |
| rosie-uds   | 0.1.0   | ✓      | unsigned   | ✓     | OK (G2)     |
| Lean (Λ)    | v4.12.0 | n/a    | n/a        | ✓     | OK          |

All four bundles build, hash-verify, and node-smoke-import green. Single consistent local gap: cosign signing (see proposed GAP-016 below).

---

## 2. Per-repo posture matrix

Columns: `License / SECURITY / CITATION / CHANGELOG / CODEOWNERS / branch-protect / workflows / latest tag`.

### Tier A — Series A flagship products

| Repo       | Lic         | SEC | CITE | CHG | OWN | PROT | WF | Latest tag                  |
|------------|-------------|-----|------|-----|-----|------|----|-----------------------------|
| a11oy      | NOASSERTION | ✓   | ✓    | ✓   | ✗   | ✓    | ✓  | `uds-v0.1.1` (2026-05-26)   |
| sentra     | NOASSERTION | ✓   | ✓    | ✓   | ✗   | ✓    | ✓  | `uds-v0.2.0` (2026-05-27)   |
| amaru      | NOASSERTION | ✓   | ✓    | ✓   | ✗   | ✓    | ✓  | `uds-v0.1.0` (2026-05-26)   |
| vessels    | NOASSERTION | ✓   | ✓    | ✓   | ✗   | ✓    | ✓  | `uds-v0.1.0` (2026-05-27)   |
| **rosie**  | **none**    | **✗** | **✗** | **✗** | ✗ | **✗** | ✗ | `uds-v0.1.0` (2026-05-27)   |
| terra      | NOASSERTION | ✓   | ✓    | ✓   | ✗   | ✓    | ✓  | `v1.0.0-alpha` (no uds-v*)  |
| counsel    | NOASSERTION | ✓   | ✓    | ✓   | ✗   | ✓    | ✓  | `v1.0.0-alpha` (no uds-v*)  |
| carlota-jo | NOASSERTION | ✓   | ✓    | ✓   | ✗   | ✓    | ✓  | `v1.0.0-alpha` (no uds-v*)  |

### Tier B — protocol / contract repos

| Repo      | Lic        | SEC | CITE | CHG | OWN | PROT | WF | Notes                                                       |
|-----------|------------|-----|------|-----|-----|------|----|-------------------------------------------------------------|
| vsp-otel  | Apache-2.0 | ✗   | ✓    | ✗   | ✗   | ✓    | ✓  | Public OTel contract — missing SECURITY.md and CHANGELOG    |
| uds-mesh  | Apache-2.0 | ✗   | ✗    | ✗   | ✗   | ✓    | ✗  | Public mesh contract — bare; only one PR; **no workflows**  |

### Tier C — research / proof / brand / trust

| Repo             | Lic        | SEC | CITE | CHG | latest tag                        | Notes                          |
|------------------|------------|-----|------|-----|-----------------------------------|--------------------------------|
| ouroboros        | Apache-2.0 | ✓   | ✓    | ✓   | `v6.3.0` (2026-05-13)             | Clean                          |
| ouroboros-thesis | CC-BY-4.0  | ✓   | ✓    | ✓   | `paper-v14-1.0.0-draft` (draft)   | Clean; awaiting publish        |
| lutar-lean       | Apache-2.0 | ✓   | ✓    | ✗   | `v0.1.0` (2026-05-18)             | Add CHANGELOG                  |
| szl-brand        | CC-BY-4.0  | ✓   | ✓    | ✗   | —                                 | Assets repo; add CHANGELOG     |
| szl-trust        | CC-BY-4.0  | ✓   | ✓    | ✗   | —                                 | Public CPS portal; add CHANGELOG |
| szl-cookbook     | Apache-2.0 | ✓   | ✓    | ✗   | —                                 | Add CHANGELOG                  |
| agi-forecast     | Apache-2.0 | ?   | ?    | ?   | **none**                          | Zenodo metadata present; zero published releases |
| .github          | Apache-2.0 | ✓   | ✓    | ✗   | —                                 | Org profile — fine             |

### Tier D — private / archived

| Repo                                | Status   | Notes                                                                                       |
|-------------------------------------|----------|---------------------------------------------------------------------------------------------|
| platform                            | private  | Canonical monorepo. Latest tag `v1.0.1-codex-kernel`. CI: `szl-zarf-publish` + SHA-pinned.  |
| stephenlutar2-hash/szl-holdings-platform | private | Dev mirror; README points at non-existent canonical URL — see proposed GAP-022           |
| demo-repository, inca-…, stephenlutar2-hash/szl-holdings | private/archived | Leave / superseded                                                       |

---

## 3. Proposed additions to `docs/audit/series-a-gap-register.md`

These are **proposed** — per `A11OY_NON_NEGOTIABLES.md` §"Repo Changes" (additive only unless explicitly authorized), the canonical register is not edited from this delta. Promote them to the register at the next gap-review cadence.

### GAP-016 — UDS bundles ship unsigned (no cosign)

| Field         | Value                                                                                                                                                     |
|---------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Severity**  | HIGH                                                                                                                                                      |
| **Area**      | UDS release pipeline — supply-chain integrity                                                                                                              |
| **Finding**   | `uds-release.sh` summary today shows `sig-skip: 4 a11oy-uds:unsigned sentra-uds:unsigned amaru-uds:unsigned rosie-uds:unsigned`. All bundles ship with sha256 sidecar but no `.sig`. |
| **Risk**      | UDS / Defense-Unicorns audience expects cosign-signed artefacts. Without `.sig`, provenance cannot be verified independently of the SZL release pipeline.  |
| **Resolution**| Generate release cosign keypair, store private key as Actions secret (`COSIGN_KEY` + `COSIGN_PASSWORD`), publish public key under `.github/security/cosign.pub`, gate `szl-zarf-publish` workflow on signature presence. |
| **Owner**     | Platform Engineering                                                                                                                                       |
| **Target**    | Before next public UDS release tag                                                                                                                         |

### GAP-017 — `rosie` public repo has empty skeleton

| Field         | Value                                                                                                                                                     |
|---------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Severity**  | HIGH                                                                                                                                                      |
| **Area**      | Public repo hygiene — Series A diligence surface                                                                                                           |
| **Finding**   | `szl-holdings/rosie` has a single commit (`Initialize repo`), no LICENSE, no SECURITY.md, no CITATION.cff, no CHANGELOG.md, no topics, no branch protection — yet it has a tagged `uds-v0.1.0` release. Every other Tier-A product repo has the full skeleton. |
| **Risk**      | First-impression risk during technical diligence. Auditors sort by `pushed_at`; rosie is currently at the top.                                              |
| **Resolution**| Mirror the `sentra` file set onto `rosie` (LICENSE, SECURITY.md, CITATION.cff, CHANGELOG.md, topics, branch protection); supersede `uds-v0.1.0` to `uds-v0.1.1` with full attestations. |
| **Owner**     | Platform Engineering                                                                                                                                       |
| **Target**    | This week                                                                                                                                                  |

### GAP-018 — Doctrine V6 scanner is failing on `main`

| Field         | Value                                                                                                                                                     |
|---------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Severity**  | MEDIUM (CI hygiene; Series A signal)                                                                                                                       |
| **Area**      | CI gate — Doctrine V6                                                                                                                                      |
| **Finding**   | `node scripts/check-doctrine-v6.mjs` exits non-zero with 9 forbidden-token violations (legacy tokens `Khipu`, `Pillpintu`, `AlloyScape`) across `dossier/payload-2026-05-25/*`, `packages/agi-forecast/data/*.json`, `scripts/release/uds-version-sync.json`, `artifacts/api-server/src/routes/foundry-deepseek-v4.ts:99`, `.agents/agent_assets_metadata.toml:631`. |
| **Risk**      | A CI gate failing on `main` signals "nobody is watching CI" during diligence. The most ironic offender is `uds-version-sync.json` — the **source of truth for UDS releases** itself contains `doctrine: "Khipu-V1"`. |
| **Resolution**| Per scanner contract: (a) frozen historical receipts → add `doctrine-scanner-exempt` marker; (b) live drift (foundry-deepseek-v4.ts) → rename token; (c) rename `Khipu-V1` doctrine string in `uds-version-sync.json` to current doctrine name. |
| **Owner**     | Platform Engineering                                                                                                                                       |
| **Target**    | Today                                                                                                                                                      |

### GAP-019 — No CODEOWNERS on any Tier-A or Tier-B repo

| Field         | Value                                                                                                                                                     |
|---------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Severity**  | MEDIUM (Series A diligence)                                                                                                                                |
| **Area**      | Repo governance — reviewer attribution                                                                                                                     |
| **Finding**   | None of the public product repos have `.github/CODEOWNERS`. Series A diligence asks "who reviews changes to your governance kernel?" — the answer must be in-tree. |
| **Resolution**| Add minimal `CODEOWNERS` to each Tier-A and Tier-B repo with explicit reviewer attribution on `/src/**/governance/**`, `/lib/proof-chain/**`, and `/lib/covenant-policy/**` paths. |
| **Owner**     | Platform Engineering                                                                                                                                       |
| **Target**    | Before data-room opens                                                                                                                                     |

### GAP-020 — `NOASSERTION` license on all Tier-A products

| Field         | Value                                                                                                                                                     |
|---------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Severity**  | MEDIUM (Series A legal diligence)                                                                                                                          |
| **Area**      | License clarity                                                                                                                                            |
| **Finding**   | `a11oy`, `sentra`, `amaru`, `vessels`, `terra`, `counsel`, `carlota-jo` all show `NOASSERTION` — GitHub cannot auto-detect the LICENSE wording. By contrast `vsp-otel`, `uds-mesh`, `ouroboros` show Apache-2.0 cleanly. |
| **Risk**      | "What's your license?" answered with "look at the LICENSE file" is a friction point in diligence Q&A.                                                      |
| **Resolution**| Confirm intent. If commercial license, declare SPDX `LicenseRef-SZL-Commercial-1.0` at the top of each LICENSE file. If BUSL-1.1, declare that. Either way, GitHub's license badge should match. |
| **Owner**     | Founder + counsel                                                                                                                                          |

### GAP-021 — `uds-mesh` (public mesh contract) is bare

| Field         | Value                                                                                                                                                     |
|---------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Severity**  | MEDIUM                                                                                                                                                     |
| **Area**      | Public ecosystem surface                                                                                                                                   |
| **Finding**   | `szl-holdings/uds-mesh` is the front-door ecosystem contract. Currently: one commit (`Plane 1: initialize…`), no SECURITY.md, no CITATION.cff, no CHANGELOG.md, no workflows, no reference adapter. |
| **Resolution**| Add SECURITY.md, CITATION.cff, CHANGELOG.md, baseline CI workflow (mirror `vsp-otel`), and at least one reference adapter that compiles + tests.            |
| **Owner**     | Platform Engineering                                                                                                                                       |

### GAP-022 — `stephenlutar2-hash/szl-holdings-platform` README points at non-existent canonical URL

| Field         | Value                                                                                                                                                     |
|---------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Severity**  | LOW                                                                                                                                                        |
| **Area**      | Documentation — canonical-source pointer                                                                                                                   |
| **Finding**   | Description reads "canonical source at `github.com/szl-holdings/szl-holdings-platform`" — that repo does not exist publicly under that name. The real canonical is `szl-holdings/platform`. |
| **Resolution**| Update repo description and README to point at `szl-holdings/platform`.                                                                                    |
| **Owner**     | Founder                                                                                                                                                    |

### GAP-023 — Terra / Counsel / Carlota-Jo ambiguous UDS-bundle status

| Field         | Value                                                                                                                                                     |
|---------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Severity**  | LOW (doctrine clarity)                                                                                                                                     |
| **Area**      | UDS doctrine — `uds-version-sync.json`                                                                                                                     |
| **Finding**   | `uds-version-sync.json` lists 4 bundles (a11oy/sentra/amaru/rosie). Terra/Counsel/Carlota-Jo are Tier-A products with `v1.0.0-alpha` tags but no `uds-v*` releases. Doctrine is ambiguous about whether they ship as UDS bundles or remain app-tier-only. |
| **Resolution**| Pick one: (a) cut UDS bundles for all three and add to `uds-version-sync.json`, or (b) write a `RELEASES.md` in each repo declaring "app-tier product, not UDS-shipped". |
| **Owner**     | Product / Founder                                                                                                                                          |

### GAP-024 — Social previews from `szl-brand` not applied to product repos

| Field         | Value                                                                                                                                                     |
|---------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Severity**  | LOW                                                                                                                                                        |
| **Area**      | Brand / public surface                                                                                                                                     |
| **Finding**   | `szl-brand` holds 1280×640 social preview PNGs ready for upload. None applied to product repos. Shared links currently render the default GitHub icon.     |
| **Resolution**| One-time per-repo upload via Settings → Social preview (web UI only — no API for this).                                                                    |
| **Owner**     | Founder / Brand                                                                                                                                            |

---

## 4. Today's a11oy perception/bio work — release path

The Replit-managed checkpoint at commit `0eb4f5a0d` already committed today's perception-loop wiring locally. Per `docs/A11OY_RELEASE_DOCTRINE.md`, the path from "merged to platform main" → "public a11oy release" is:

1. Platform merges upstream from this isolated environment (Replit-managed, not run by this task agent).
2. `scripts/release/alpha.sh` and/or the `szl-zarf-publish` workflow fires on a `szl-v*` tag push.
3. Per `scripts/release/uds-version-sync.json`, `a11oy-uds` is built, signed (when GAP-016 closes), and uploaded as a Release asset.

**To cut today's release cleanly** (queued as Task #5514-followup, not done in this task):

- [ ] Bump `artifacts/a11oy-uds/package.json` to `0.1.2`
- [ ] Add `artifacts/a11oy/CHANGELOG.md` entry under "Unreleased → 0.1.2"
- [ ] Update `scripts/release/uds-version-sync.json` `headline` field for a11oy-uds to mention perception/bio wiring
- [ ] Run Release Readiness Scorecard per `docs/RELEASE_READINESS_SCORECARD.md` (must score ≥ 80/100)
- [ ] Tag `szl-v<version>` upstream
- [ ] Verify `szl-zarf-publish` workflow run + signed bundle uploads

---

## 5. What this audit does NOT claim

Per `docs/A11OY_PUBLIC_CLAIMS_DOCTRINE.md`:

- It does **not** assert performance numbers without re-running the benchmarks today.
- It does **not** assert "172/172 tests passing in ouroboros" — that number is sourced from the public ouroboros README and should be reverified by running `pnpm -w test` in the canonical monorepo before the data room opens.
- It does **not** assert SOC 2 / ISO / HIPAA certification.
- It does **not** assert production-customer counts or ARR.

The only claims made here are derived from: (a) the local release-gate run today (`uds-release.sh`), (b) the GitHub API enumeration of public repo metadata, and (c) on-disk files referenced by path.
