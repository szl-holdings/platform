# Zenodo DOI — GitHub Auto-Mint Setup (replaces manual API mint)

**Founder correction (2026-06-01 02:34 EDT):** "To get DOIs, look where the thesis
are posted on GitHub and then it does the rest auto." Use the **GitHub–Zenodo native
auto-mint integration**, NOT manual API mints.

> "Do NOT mint manually anymore. The GitHub integration is the canonical path going
> forward, AND it works for every future release." — Founder
>
> "NO BANDAID. Use the right tool — GitHub–Zenodo auto-integration — not manual API mints."

This file **replaces** the prior manual mint instructions
(`thesis_v20/ZENODO_MINT_INSTRUCTIONS.md`, kept only for historical reference).

---

## How GitHub–Zenodo auto-mint works

Zenodo watches a GitHub repository. When that repo publishes a **GitHub Release**,
Zenodo automatically:

1. Downloads the release source archive (the auto-generated tarball/zipball — no manual
   asset upload required).
2. Reads `.zenodo.json` from the repo root for metadata (title, authors, license,
   keywords, related identifiers).
3. Creates a Zenodo record and **mints a version DOI**.
4. Maintains a **concept DOI** that always resolves to the latest version.

No personal access token, no `curl`, no per-version manual steps. The DOI stays tied
to the release artifact and the committed `.zenodo.json`.

## One-time setup — the exact 5 clicks (FOUNDER ACTION)

These require the founder's Zenodo account + GitHub OAuth and **cannot** be done by an
automated agent. They are **documented, not faked**.

Zenodo GitHub settings page: **https://zenodo.org/account/settings/github/**

1. Open **https://zenodo.org/account/settings/github/**.
2. Click **"Connect"** and log in with GitHub (Zenodo OAuth); authorize Zenodo to read
   the `szl-holdings` organization repositories.
3. In the repository list, locate the target repo
   (**`szl-holdings/ouroboros-thesis`** for the thesis; **`szl-holdings/puriq-preprint`**
   for the PURIQ preprint).
4. Toggle that repository's switch to **ON** (the flip-switch turns green).
5. Click **"Sync now"** if the repo does not appear (Zenodo refreshes from GitHub).

After the toggle is ON, **every future release auto-mints** — for that repo and for any
future release going forward.

## Per-repository status

### `szl-holdings/ouroboros-thesis` (Thesis v20)

| Check | Result (verified 2026-06-01 via `gh api`) |
|-------|-------------------------------------------|
| Repo exists, public | YES (`private=false`) |
| `.zenodo.json` at root present | YES (file exists) |
| `.zenodo.json` **populated** | **NO — file is 0 bytes (EMPTY)** ⚠ |
| Release `paper-v20-1.0.0` exists | YES (not draft, not prerelease) |
| Release attached assets | **0** (source tarball/zipball auto-present) |
| Zenodo repo toggle ON | UNKNOWN — founder-only; requires Zenodo login to confirm |

**⚠ Blocker to resolve before minting:** the `.zenodo.json` at the root of
`ouroboros-thesis` is **empty (0 bytes)**. If a release auto-mints with an empty
metadata file, Zenodo falls back to bare repo metadata and the DOI record will lack the
prepared title/authors/license/related-identifiers. The complete, valid v20 metadata
(2,606 bytes, JSON-validated) already exists locally at
`thesis_v20/.zenodo.json`. **Founder one-line fix** (commit the populated file to the
repo root, then the existing `paper-v20-1.0.0` release — or a fresh release — mints
correctly):

```bash
# from a clone of szl-holdings/ouroboros-thesis, with the populated file in place
git add .zenodo.json && \
git commit -m "Populate .zenodo.json for GitHub-Zenodo auto-mint (v20)" && \
git push origin main
# then (re)publish the release so Zenodo picks up the metadata:
gh release edit paper-v20-1.0.0 --repo szl-holdings/ouroboros-thesis --draft=false
```

> The agent did **not** modify the pre-existing thesis repo: Task 4's mandate is to
> *verify and document*. Populating `.zenodo.json` and toggling Zenodo are founder
> actions, recorded here.

### `szl-holdings/puriq-preprint` (PURIQ Preprint — created this session)

| Check | Result |
|-------|--------|
| Repo exists, public | YES (created `--public` this session) |
| `.zenodo.json` at root present | YES |
| `.zenodo.json` **populated** | **YES — 2,595 bytes, valid JSON (from day one, per founder)** ✓ |
| Release published | NOT YET (mint on first release; see below) |
| Zenodo repo toggle ON | Founder action (same 5 clicks above) |

`.zenodo.json` was committed at the repo root in the very first commit so the first
release mints with correct metadata. To mint:

```bash
gh release create preprint-v1.0.0 \
  --repo szl-holdings/puriq-preprint \
  --title "PURIQ Preprint v1.0.0" \
  --notes "Initial public preprint. Auto-minted via GitHub-Zenodo integration."
```

## After the first auto-mint (both repos)

1. Open the new Zenodo record, copy the **version DOI** and the **DOI badge Markdown**.
2. Replace the `PLACEHOLDER` DOI in each repo's `README.md` with the assigned DOI.
3. Future releases mint automatically — no further action. That is the point of the
   integration.

## Why not manual API mints (recap)

Manual deposition with a long-lived `deposit:write` token is brittle: it needs a secret
in the environment (none exists — see `ZENODO_MINT_STATUS.md`), must be re-run by hand
per version, and drifts from repo state. The GitHub integration is the reproducible,
no-bandaid path.

---

Author: Stephen P. Lutar Jr. (Yachay).
Co-authored-by: Perplexity Computer Agent.
