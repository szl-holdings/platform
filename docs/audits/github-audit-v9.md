# GitHub Audit — v9 Publication Readiness

**Date:** 2026-05-05
**Auditor:** Task Agent (read-only via GitHub connector — Replit integration `conn_github_01KMJNN39AEEJS9QTVT9APKCCC`, status `healthy`)
**Audit scope:** Owner `stephenlutar2-hash` + organization `szl-holdings` + the 3 publication-relevant repositories.

---

## 1. Identity + organizations

| Field | Value |
|---|---|
| GitHub login | `stephenlutar2-hash` |
| Display name | Stephen Paul Lutar Jr. |
| ORCID | `0009-0001-0110-4173` |
| Organizations | `szl-holdings` |

**17 repos visible** to the connection: 12 in `szl-holdings`, 5 under personal account. 4 are archived (`stephenlutar2-hash/szl-holdings-platform`, `stephenlutar2-hash/szl-holdings`, `stephenlutar2-hash/inca-intelligence-platform`, `szl-holdings/demo-repository`).

---

## 2. The three publication-relevant repos

### 2.1 `szl-holdings/ouroboros-thesis` — **the DOI target**

| Item | State | Notes |
|---|---|---|
| License | **CC-BY-4.0** ✅ | Required for Zenodo open-science deposit |
| `CITATION.cff` | ✅ present | v9 update needs to add `paper-v9-1.0.0` |
| `.zenodo.json` | ❌ **missing** | This is the file Zenodo reads for DOI metadata; without it Zenodo falls back to repo description |
| `LICENSE` | ✅ |
| `README.md` | ✅ |
| `SECURITY.md` | ✅ |
| `CODE_OF_CONDUCT.md` | ❌ |
| `CONTRIBUTING.md` | ❌ |
| Topics | `ai-governance`, `ai-safety`, `bounded-recursion`, `research-paper`, `zenodo`, `convergence-traces`, `cc-by-4`, `doi` ✅ |
| Workflows | Dependabot only — no CI ⚠ |
| Existing releases (DOI-published) | `paper-v8-1.0.0` (v8 Free-Energy-Lutar Active Inference), `paper-v7-1.0.0`, `paper-v6-1.0.0`, `paper-v5-1.0.0`, `paper-v4-1.0.0`, `paper-v3-2.0.0`, `paper-v3-1.0.0`, `paper-v2-empirical-1.0.0`, `v3.0.0`, `v2.0.0` |
| Naming convention observed | `paper-vN-MAJOR.MINOR.PATCH` for paper releases |

**Style match for v9:** `paper-v9-1.0.0` — *"v9 — UNIFIED-OPERATIONAL: The Lutar Invariant Family (v1 → v7 + Ω)"*.

### 2.2 `szl-holdings/ouroboros` — runtime / reference implementation

| Item | State | Notes |
|---|---|---|
| License | NOASSERTION ⚠ | LICENSE file present but SPDX not detected; pin to MIT or Apache-2.0 in next release |
| `CITATION.cff` | ❌ **missing** | Recommended; should cite ouroboros-thesis DOI |
| `.zenodo.json` | ❌ missing | Optional; runtime is software-only |
| `SECURITY.md` | ✅ |
| Workflows | Dependabot only — should add CI |
| Releases | `v6.2.0`, `v6.1.0`, `v6.0.0` (semver, no `paper-` prefix) |

### 2.3 `szl-holdings/szl-holdings-platform` — main monorepo (this repo)

| Item | State | Notes |
|---|---|---|
| License | NOASSERTION ⚠ |
| `CITATION.cff` | ❌ → **created in this audit** at repo root |
| `.zenodo.json` | ❌ → **created in this audit** at repo root |
| Default branch | `master` (note: differs from the other two which use `main`) |
| Docs surface | 30+ top-level `.md` (ARCHITECTURE, API-CATALOGUE, DATA-MODEL, etc.) ✅ |
| Workflows | 19 (CI, CodeQL, Lighthouse CI, E2E, Dep Review, Secret Scan, Release, Deploy-Staging, Post-Deploy Smoke, etc.) ✅ |
| `CODE_OF_CONDUCT.md` / `CONTRIBUTING.md` / `SECURITY.md` | All ✅ |

---

## 3. Files committed in this audit (root of the platform repo)

- `CITATION.cff` — v9 paper, ORCID, CC-BY-4.0, 9.0.0, dated 2026-05-05, references HUFT (arXiv:2510.06282).
- `.zenodo.json` — Zenodo-readable metadata mirroring CITATION; community = `open-science`; relations to ouroboros-thesis (`isSupplementTo`) and ORCID (`isIdenticalTo`).

These files will be picked up automatically by Zenodo on the **next published release** of any repo that has the Zenodo–GitHub webhook enabled.

---

## 4. Publishing playbook — how the DOI gets minted (operator action)

The agent **does not perform** the GitHub release in this task (writes to external services require explicit per-call human confirmation under integration policy). The operator runs the steps below — every artefact they need is already authored.

### Step A — copy v9 deposit files into `szl-holdings/ouroboros-thesis`
```
papers/v9/
  v9-canonical.md            # from docs/thesis/v9-canonical.md (this repo)
  v9-essay.md                # from docs/thesis/v9-essay.md
  v9-onepager.md             # from docs/thesis/v9-onepager.md
  v9-social-cards.md         # from docs/thesis/v9-social-cards.md
.zenodo.json                  # from this repo's root .zenodo.json
CITATION.cff                  # update existing — append v9 release entry
```

### Step B — confirm Zenodo–GitHub webhook is enabled
1. Sign in to https://zenodo.org with the same GitHub identity (`stephenlutar2-hash`).
2. Settings → GitHub → toggle `szl-holdings/ouroboros-thesis` ON (and ideally also `szl-holdings/szl-holdings-platform`).
3. Verify ORCID `0009-0001-0110-4173` is linked under Zenodo Profile.

### Step C — tag + publish the release (style-matched to v3..v8)
```bash
# inside ouroboros-thesis repo
git tag -a paper-v9-1.0.0 -m "v9 — UNIFIED-OPERATIONAL: Lutar Invariant Family (v1→v7+Ω)"
git push origin paper-v9-1.0.0
gh release create paper-v9-1.0.0 \
  --title "v9 — UNIFIED-OPERATIONAL: The Lutar Invariant Family (v1 → v7 + Ω)" \
  --notes-file papers/v9/v9-onepager.md \
  papers/v9/*.md
```

Zenodo will detect the release within minutes and mint a fresh DOI of the form `10.5281/zenodo.<n>`. Update `CITATION.cff` `identifiers:` with the minted DOI and the optional Concept-DOI.

### Step D — backfill citations on the platform repo
Once the v9 DOI is live, append it to root `CITATION.cff` `identifiers:` here (`type: doi`, `value: 10.5281/zenodo.<n>`) and to `.zenodo.json` `related_identifiers` (`relation: isSupplementTo`).

---

## 5. Hardening recommendations (out of scope for v9 publication, queued for follow-up)

| Priority | Repo | Action |
|---|---|---|
| P0 | ouroboros-thesis | Add `.zenodo.json` (operator copies from this repo's root) so DOI metadata is canonical |
| P1 | ouroboros, szl-holdings-platform | Replace `NOASSERTION` license with explicit SPDX tag (`MIT`, `Apache-2.0`, or `BUSL-1.1` depending on intent) |
| P1 | ouroboros-thesis | Add CI workflow (markdown lint + PDF render) |
| P2 | ouroboros-thesis, ouroboros | Add `CONTRIBUTING.md` + `CODE_OF_CONDUCT.md` (already present in main platform — lift verbatim) |
| P2 | All | Enable branch protection on `main`/`master`: required reviews, required status checks, signed commits |
| P3 | All | Enable Dependabot security updates (already on Dependabot but verify auto-merge for patch) |

---

## 6. Verification trail

- Connector: `conn_github_01KMJNN39AEEJS9QTVT9APKCCC` (`status: healthy`)
- API calls (read-only): `GET /user`, `GET /user/orgs`, `GET /user/repos`, `GET /repos/{full_name}`, `GET /repos/{full_name}/contents/`, `GET /repos/{full_name}/releases`, `GET /repos/{full_name}/tags`, `GET /repos/{full_name}/topics`, `GET /repos/{full_name}/actions/workflows`
- No write operations performed. No `confirm_connector_operation` was triggered.
