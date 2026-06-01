# Zenodo DOI — GitHub Auto-Mint Integration

**This repository mints DOIs automatically through the GitHub–Zenodo integration.**
We do **NOT** mint DOIs manually with the Zenodo API anymore. The GitHub integration
is the canonical path going forward, and it works for every future release of this
repository.

## How it works

Zenodo can watch a GitHub repository. When the watched repository publishes a
**GitHub Release**, Zenodo automatically:

1. Downloads the release source archive.
2. Reads `.zenodo.json` from the repository root for deposition metadata
   (title, authors, license, keywords, related identifiers).
3. Creates a Zenodo record and **mints a DOI** for that release.
4. Mints/updates a **concept DOI** that always resolves to the latest release.

Because `.zenodo.json` lives at the repo root **from day one**, the very first
release is minted with correct metadata — no manual editing on the Zenodo side.

## One-time setup (FOUNDER ACTION — 5 clicks)

These steps require the founder's Zenodo account and GitHub OAuth; they cannot be
performed by an automated agent and are **documented, not faked**.

1. Go to **https://zenodo.org/account/settings/github/**
2. Click **"Connect"** / log in with GitHub (Zenodo OAuth). Authorize Zenodo to read
   the `szl-holdings` organization's repositories.
3. In the repository list, find **`szl-holdings/puriq-preprint`**.
4. Toggle the switch for that repository to **ON** (the flip-switch turns green).
5. Click **"Sync now"** if the repo does not appear immediately (Zenodo refreshes the
   repo list from GitHub).

That is the entire setup. After the toggle is ON, every future release auto-mints.

## Cutting a release (mints the DOI)

After the toggle is ON, mint a DOI by publishing a GitHub release:

```bash
# tag and release; api_credentials=["github"]
gh release create preprint-v1.0.0 \
  --repo szl-holdings/puriq-preprint \
  --title "PURIQ Preprint v1.0.0" \
  --notes "Initial public preprint. Auto-minted via GitHub–Zenodo integration."
```

Within a minute or two Zenodo creates the record and assigns the DOI.

## After the first release

1. Open the new record on https://zenodo.org and copy the **version DOI** and the
   **DOI badge Markdown** that Zenodo displays.
2. Replace `10.5281/zenodo.PLACEHOLDER` in `README.md` with the assigned version DOI.
3. Subsequent releases (`preprint-v1.1.0`, …) are minted automatically with no further
   action — that is the whole point of the integration.

## Why not manual API mints

Manual `curl` deposition with a personal `deposit:write` token is brittle: it requires
a long-lived secret in the environment, must be re-run by hand for each version, and
drifts from the repository state. The GitHub integration keeps the DOI tied to the
release artifact and the `.zenodo.json` in the repo, which is the reproducible,
no-bandaid path. **Use the right tool — GitHub–Zenodo auto-integration — not manual API mints.**

---

Author: Stephen P. Lutar Jr. (Yachay).
Co-authored-by: Perplexity Computer Agent.
