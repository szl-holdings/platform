# Thesis Proof Bundle — Ouroboros v3

**Captured:** 2026-05-01 04:50 EDT
**Author:** Stephen Lutar
**ORCID:** [0009-0001-0110-4173](https://orcid.org/0009-0001-0110-4173)
**Org:** [SZL Holdings](https://github.com/szl-holdings)

This is the immutable proof anchor for the Ouroboros thesis: position paper (v1), empirical companion (v2), runtime release (v6.1.0), and the platform mass behind it (24 packages, 1,372 tests, 91 primitives, 9 Λ axes).

---

## 1. Publications — Zenodo DOIs

| Paper | DOI | Zenodo URL | Date | Type |
| --- | --- | --- | --- | --- |
| **Ouroboros Thesis v1** — position paper | [10.5281/zenodo.19867281](https://doi.org/10.5281/zenodo.19867281) | [zenodo.org/records/19867281](https://zenodo.org/records/19867281) | 2026-04-28 | Position paper |
| **Ouroboros Thesis v2** — empirical companion ("The Loop Is the Product") | [10.5281/zenodo.19934129](https://doi.org/10.5281/zenodo.19934129) | [zenodo.org/records/19934129](https://zenodo.org/records/19934129) | 2026-04-30 | Empirical companion |

License: CC BY 4.0 on both records.

---

## 2. GitHub Release Anchors

### Runtime — szl-holdings/ouroboros

| Tag | Commit SHA | Released | Title |
| --- | --- | --- | --- |
| **v6.1.0** | `e9fc4b86eae18bb7401b14cb0e53900ba8e47ad8` | 2026-04-30T20:22:28Z | EntropyDepthAllocator (Ouroboros Thesis v3) |
| v6.0.0 | (parent of v6.1.0) | 2026-04-30T19:49:16Z | Ouroboros v6 ecosystem layer + government readiness |

Verify: `git rev-parse v6.1.0` in [szl-holdings/ouroboros](https://github.com/szl-holdings/ouroboros)

### Thesis — szl-holdings/ouroboros-thesis

| Tag | Commit SHA | Released | Title |
| --- | --- | --- | --- |
| **paper-v2-empirical-1.0.0** | `598c7aff03564f3f238d5db1a0029bb3f330a491` | 2026-05-01T00:58:41Z | Paper v2 Empirical 1.0.0 — The Loop Is the Product |
| v3.0.0 | (mirrors v6.1.0 thesis surface) | 2026-04-30T20:22:27Z | Auditable governance surface |
| v2.0.0 | (mirrors v6.0.0 thesis surface) | 2026-04-30T19:49:16Z | Thesis + v6 operational contract |

Annotated tag SHA `2dba310254e11a237a6ff380678921ae148f3c9b` → commit `598c7aff03564f3f238d5db1a0029bb3f330a491`.

Verify: `git cat-file -p paper-v2-empirical-1.0.0` in [szl-holdings/ouroboros-thesis](https://github.com/szl-holdings/ouroboros-thesis)

### Platform monorepo — szl-holdings/szl-holdings-platform

| Tag | Released |
| --- | --- |
| codex-kernel v1.0.2 | 2026-04-30 |
| v1.1.0-ouroboros-v5 | (prior) |
| v1.0.0-alpha | (genesis) |
| v0.1.0-3 | (initial) |
| v1.0-standby | (rollback anchor) |

### Satellite repos — all at v1.0.0-alpha

a11oy · sentra · amaru · counsel · terra · vessels · carlota-jo

---

## 3. Test Surface

**Total: 1,372 tests passing.**

| Layer | Count | Command |
| --- | --- | --- |
| TypeScript (24 workspaces) | 925 | `npm test --workspaces --if-present` |
| Python (`packages/ouroboros-py`) | 447 | `cd packages/ouroboros-py && python -m pytest -q` |
| **TOTAL** | **1,372** | — |

Empirical companion paper anchor: 142/142 tests at release commit (`598c7aff03564f3f238d5db1a0029bb3f330a491`). Full runtime + tooling sweep: 1,372.

---

## 4. Platform Mass

| Metric | Value |
| --- | --- |
| Packages (npm workspaces) | 24 |
| Primitives implemented | 91 |
| Λ axes (governance dimensions) | 9 |
| Public org repos | 11 |
| Production product surfaces | 7 (a11oy, sentra, amaru, counsel, terra, vessels, carlota-jo) |
| Open security alerts (org-wide) | 0 |

---

## 5. Governance Posture (post-audit)

| Control | Status |
| --- | --- |
| Secret scanning | Enabled on 10/10 active repos |
| Push protection | Enabled on 10/10 active repos |
| Dependabot alerts | Enabled on 10/10 active repos |
| Dependabot security updates | Enabled on 10/10 active repos |
| Branch protection (no force-push, no delete) | Enabled on 10/10 active repos |
| Org-level defaults for new repos | Enabled |
| Open dependabot PRs (clean) | 0 (4 merged this sweep) |
| Personal account 2FA | Enabled |

---

## 6. Standards Coverage

| Framework | Coverage |
| --- | --- |
| NIST AI RMF | Full coverage across GOVERN / MAP / MEASURE / MANAGE |
| DoD Responsible AI Tenets | 4 of 5 covered (Equitable in 30-day roadmap) |
| GSAR 552.239-7001 (proposed) | 5 of 10 requirements covered, 5 documented gaps |
| NAICS scoped | 541511, 541512, 541519, 541690, 541715 |
| PSC scoped | DA01, DA10, DJ10 |

Source: [`docs/audit/szl-government-readiness.md`](https://github.com/szl-holdings/ouroboros/blob/main/docs/audit/szl-government-readiness.md)

---

## 7. Signed Proof JSON

```json
{
  "schema": "ouroboros.thesis.proof/v1",
  "captured_at": "2026-05-01T08:50:00Z",
  "captured_by": "stephenlutar2-hash",
  "orcid": "0009-0001-0110-4173",
  "publications": {
    "v1_position_paper": {
      "doi": "10.5281/zenodo.19867281",
      "zenodo_url": "https://zenodo.org/records/19867281",
      "date": "2026-04-28",
      "license": "CC-BY-4.0"
    },
    "v2_empirical_companion": {
      "doi": "10.5281/zenodo.19934129",
      "zenodo_url": "https://zenodo.org/records/19934129",
      "date": "2026-04-30",
      "license": "CC-BY-4.0"
    }
  },
  "release_anchors": {
    "ouroboros_v6_1_0": {
      "repo": "szl-holdings/ouroboros",
      "tag": "v6.1.0",
      "commit_sha": "e9fc4b86eae18bb7401b14cb0e53900ba8e47ad8",
      "released_at": "2026-04-30T20:22:28Z",
      "message": "docs(ouroboros): v6.1.0 — EntropyDepthAllocator (v3 §3.2), 142/142 tests"
    },
    "thesis_paper_v2": {
      "repo": "szl-holdings/ouroboros-thesis",
      "tag": "paper-v2-empirical-1.0.0",
      "annotated_tag_sha": "2dba310254e11a237a6ff380678921ae148f3c9b",
      "commit_sha": "598c7aff03564f3f238d5db1a0029bb3f330a491",
      "released_at": "2026-05-01T00:58:41Z",
      "tagger_date": "2026-05-01T00:56:56Z"
    }
  },
  "test_surface": {
    "typescript_tests": 925,
    "python_tests": 447,
    "total_tests": 1372,
    "release_anchor_tests": 142
  },
  "platform_mass": {
    "packages": 24,
    "primitives": 91,
    "lambda_axes": 9,
    "public_repos": 11,
    "open_security_alerts": 0
  },
  "governance_posture_post_audit": {
    "secret_scanning_repos": 10,
    "push_protection_repos": 10,
    "dependabot_alerts_repos": 10,
    "dependabot_security_updates_repos": 10,
    "branch_protection_repos": 10,
    "org_defaults_for_new_repos": true,
    "personal_2fa_enabled": true
  },
  "standards_coverage": {
    "nist_ai_rmf": "full",
    "dod_rai_tenets": "4_of_5",
    "gsar_552_239_7001": "5_of_10",
    "naics": ["541511", "541512", "541519", "541690", "541715"],
    "psc": ["DA01", "DA10", "DJ10"]
  }
}
```

---

## 8. Verification recipe

Anyone can verify this bundle without trust:

```bash
# 1. Verify Zenodo DOIs resolve to your records
curl -sI https://doi.org/10.5281/zenodo.19867281 | grep -i location
curl -sI https://doi.org/10.5281/zenodo.19934129 | grep -i location

# 2. Verify release commit SHAs
gh api repos/szl-holdings/ouroboros/git/refs/tags/v6.1.0 --jq .object.sha
# expect: e9fc4b86eae18bb7401b14cb0e53900ba8e47ad8

gh api repos/szl-holdings/ouroboros-thesis/git/refs/tags/paper-v2-empirical-1.0.0 --jq .object.sha
# annotated tag: 2dba310254e11a237a6ff380678921ae148f3c9b
# resolves to commit: 598c7aff03564f3f238d5db1a0029bb3f330a491

# 3. Verify test count
git clone https://github.com/szl-holdings/ouroboros.git
cd ouroboros && git checkout v6.1.0 && npm install
npm test --workspaces --if-present 2>&1 | grep -E "Tests +[0-9]+ passed" | awk '{sum += $2} END {print sum}'
# expect: 925 (TS only at this anchor)
```

---

This bundle is the canonical thesis proof artifact. It accompanies every funding deck, government briefing, vendor outreach, and design-partner conversation.
