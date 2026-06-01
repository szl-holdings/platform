# Zenodo Mint Status (Task 4)

**Date:** 2026-06-01
**Author:** Stephen P. Lutar Jr. (signed **Yachay**)
**Co-authored-by:** Perplexity Computer Agent
**Directive:** NO BANDAID. Use the GitHub–Zenodo auto-mint integration, not manual API
mints (founder correction 2026-06-01 02:34 EDT). Founder-only actions are **documented,
not faked**.

---

## 1. Token / credential check

Secrets directory: `/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/`

| File | Present | Relevant to Zenodo |
|------|---------|--------------------|
| `hf_token` | YES | No (Hugging Face only — used for Task 2 dataset upload) |
| `cosign_signing_key.key` | YES | No (Sigstore/cosign signing) |
| `cosign_signing_key.pub` | YES | No |
| `szlholdings_ec_private.pem` | YES | No (EC private key) |
| **Zenodo token** | **NO** | — |

**There is NO Zenodo API token in the environment, and no Zenodo connector exists.**
A manual API mint is therefore impossible *and* — per the founder correction — no longer
the intended path. This is consistent with the new directive: the canonical path is the
GitHub–Zenodo auto-mint integration, which uses **no token at all** (it relies on the
founder's one-time Zenodo OAuth + repo toggle).

## 2. GitHub-side verification (via `gh api`, api_credentials=["github"])

### Thesis: `szl-holdings/ouroboros-thesis`

- Repo: exists, **public** (`private=false`), `html_url=https://github.com/szl-holdings/ouroboros-thesis`.
- `.zenodo.json` at root: **present but EMPTY (0 bytes)** ⚠ — confirmed via both the
  contents API and the git tree (`size=0`).
- Release `paper-v20-1.0.0`: **exists**, `draft=false`, `prerelease=false`.
- Release attached assets: **0**. (The auto-generated source tarball/zipball is always
  available to Zenodo, so the empty asset list does **not** block auto-mint; only the
  empty `.zenodo.json` does, by degrading metadata.)

### Preprint: `szl-holdings/puriq-preprint` (created this session)

- Repo: exists, **public**.
- `.zenodo.json` at root: **present and populated (2,595 bytes, valid JSON)** ✓ from the
  first commit (per founder, "from day one").
- Release: not yet published — mint occurs on first release.

## 3. What is and is not done

**Done (by the agent):**
- Verified token state (no Zenodo token; auto-mint needs none).
- Verified both repos' visibility, `.zenodo.json` presence/population, and the thesis
  release state via `gh api`.
- Shipped a populated `.zenodo.json` at the root of the new `puriq-preprint` repo from
  day one, and documented the auto-mint pattern there.
- Wrote `ZENODO_AUTO_MINT_SETUP.md` (the canonical 5-click checklist replacing the
  manual mint instructions).

**NOT done — founder-only actions (documented, not faked):**
1. **Populate the empty thesis `.zenodo.json`.** The complete v20 metadata exists locally
   at `thesis_v20/.zenodo.json` (validated). The agent deliberately did **not** push it,
   because Task 4's mandate is *verify and document*, and the action-safety policy flags
   unsanctioned writes to the pre-existing shared thesis repo. One-line founder fix is in
   `ZENODO_AUTO_MINT_SETUP.md` (commit + push the populated file, then keep/republish the
   release).
2. **Zenodo OAuth login + toggle repo(s) ON** at
   https://zenodo.org/account/settings/github/ (the exact 5 clicks are in
   `ZENODO_AUTO_MINT_SETUP.md`). This cannot be performed by an automated agent.
3. **Publish a GitHub release** to trigger each mint (thesis: `paper-v20-1.0.0` already
   exists; preprint: `preprint-v1.0.0` to be cut).

## 4. No bandaid

No DOI was minted with a guessed or invalid credential. No fake DOI was written into any
file. The empty thesis `.zenodo.json` is reported as a real, named blocker rather than
silently patched. The path forward is the GitHub–Zenodo integration exactly as the
founder directed.

---

**Status: VERIFIED & DOCUMENTED.** Auto-mint is wired for the preprint from day one;
the thesis needs the founder to (a) populate the empty `.zenodo.json`, (b) toggle the
repo ON in Zenodo, and (c) keep/republish the v20 release. See
`ZENODO_AUTO_MINT_SETUP.md`.
