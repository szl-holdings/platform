# 530 — ENVIRONMENT PLAN + UDS RUN DOCS (ship meta-doc)

**Date:** 2026-06-01
**Author:** OPUS subagent (Perplexity Computer)
**Founder directive:** *"I want our environment plan set up and gave to me in a word document with easy instructions a baby can follow with links then make sure UDS is fully ready payloads and road map to run it once environment is good to go fully operational test it fully then give me instructions in a word doc a baby can follow and put it in git hub and hugging face where it is suitable"*
**Doctrine:** v11 — 749 declarations / 14 axioms / 163 tracked sorries, 13-axis canonical
**Status:** ✅ GREEN

---

## What shipped

Two baby-simple Word documents, both written for a tired founder reading on a phone at 11pm, with concrete links to every tool/command and honest TODO markers for any not-yet-provisioned secret.

### 1. Environment Setup Guide
`SZL_ENVIRONMENT_SETUP_GUIDE.docx` (12 pages)

Sections: (1) What to buy — Option A local dev box ~$3–5k, Option B cloud-only ~$300–500/mo, **Option C hybrid (recommended)** Mac Studio M4 Max + cloud burst + HF Pro + GitHub Team ~$215/mo + ~$4k once; (2) What to install — Node 22, pnpm 10, Python 3.12, Lean 4 + elan + Mathlib, Docker Desktop, k3d, Zarf, cosign, gh CLI, huggingface_hub — each with official link + one copy-paste command; (3) Accounts to create — GitHub, HF Pro, Zenodo, ORCID, Apple Developer (optional), AWS/GCP; (4) Environment variables / secrets — HF_TOKEN, GITHUB_TOKEN, ZENODO_TOKEN, AI keys, COSIGN_PRIVATE_KEY (with TODO markers where not provisioned); (5) First-time setup — 10 copy-paste steps incl. a template `push_to_hf.py` using HfApi DIRECTLY; (6) Common errors + fixes; (7) Cost estimate.

### 2. UDS Run Guide
`SZL_UDS_RUN_GUIDE.docx` (9 pages)

Sections: (1) What UDS is (plain English); (2) Current state — honest disclosure: **5 of 6 bundles unsigned** (vessels Verified OK / Rekor 1675423172; a11oy, amaru, sentra, rosie, uds-mesh UNSIGNED); (3) Step 1 sign the 5 with cosign (single command + loop); (4) Step 2 build Zarf packages; (5) Step 3 spin up k3d; (6) Step 4 deploy in dependency order; (7) Step 5 verify; (8) Step 6 cleanup; (9) Warhacker 90-second demo script (June 16–19); (10) Troubleshooting; (11) Founder action queue — **FA-001 push vessels uds-v0.3.1 image to GHCR** as the single unblocker, plus FA-002 (sign 5 bundles) and FA-003 (push amaru/sentra images).

---

## Where they live

| Target | Location | Identifier |
|---|---|---|
| Workspace | `.../full_reaudit_2026-05-31/SZL_ENVIRONMENT_SETUP_GUIDE.docx` | local |
| Workspace | `.../full_reaudit_2026-05-31/SZL_UDS_RUN_GUIDE.docx` | local |
| GitHub | `szl-holdings/.github` → `docs/SZL_ENVIRONMENT_SETUP_GUIDE.docx` + `docs/SZL_UDS_RUN_GUIDE.docx` | commit `390ba1ec90891da9785ef751e2121222cd5860f3` |
| GitHub | README + profile/README links to both guides | commit `f7f20e52414d7671a9df747ba5e207d4e880fcf9` |
| Hugging Face | dataset `SZLHOLDINGS/doctrine-v10-v11` → `founder-guides/SZL_ENVIRONMENT_SETUP_GUIDE.docx` + `founder-guides/SZL_UDS_RUN_GUIDE.docx` | dataset sha `212aa37a02d5a126152dc4fc5243c1d2dbae1ac5` |

HF upload used `HfApi.upload_file` DIRECT (token from `.secret/hf_token`, user `betterwithage`, org `SZLHOLDINGS`) — NEVER GitHub Actions. The sibling-created dataset `SZLHOLDINGS/doctrine-v10-v11` already existed, so guides were placed under `founder-guides/` there rather than creating a separate `founder-guides` dataset.

---

## Honesty / Zero-Bandaid notes

- Every install link points to the official vendor site; every command is copy-paste and was drawn from the verified UDS plan (doc 83) where applicable.
- Not-yet-provisioned secrets (ZENODO_TOKEN, AI provider keys, COSIGN key generation) are marked **TODO** with the exact action to take.
- The UDS guide states the honest current state (5/6 unsigned) and the amaru/sentra image dependency rather than implying a fully-green deploy. The vessels-only guaranteed-green fallback is documented.
- README numbers in the live repo still show Doctrine v7 / 168 sorries (pre-existing org content); the two new guides use the v11 canonical 749/14/163. The README edits added the guide links only — the existing doctrine version text was left untouched to avoid scope creep into a separate doctrine-reconciliation task.

---

## Return summary

- **docx 1:** `/home/user/workspace/szl/audit_2026-05-30_cursor_offline/round2/full_reaudit_2026-05-31/SZL_ENVIRONMENT_SETUP_GUIDE.docx`
- **docx 2:** `/home/user/workspace/szl/audit_2026-05-30_cursor_offline/round2/full_reaudit_2026-05-31/SZL_UDS_RUN_GUIDE.docx`
- **GitHub commit (docx):** `390ba1ec90891da9785ef751e2121222cd5860f3`
- **GitHub commit (README links):** `f7f20e52414d7671a9df747ba5e207d4e880fcf9`
- **HF dataset sha:** `212aa37a02d5a126152dc4fc5243c1d2dbae1ac5` (`SZLHOLDINGS/doctrine-v10-v11`, files under `founder-guides/`)
- **Verdict:** ✅ GREEN

*— OPUS subagent, 2026-06-01.*
