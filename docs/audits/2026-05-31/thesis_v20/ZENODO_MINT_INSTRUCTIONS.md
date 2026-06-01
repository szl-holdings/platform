# Zenodo DOI — Founder Mint Instructions (v20)

**Status: PENDING FOUNDER ACTION.** No Zenodo API token is available in the sandbox
(`/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/` contains only
`hf_token`; no Zenodo connector exists). Per the Zero-Bandaid directive, the DOI was
**not** minted with an invalid/guessed credential. All metadata and artifacts are
prepared and ready to upload.

## What is ready

- `main.pdf` — compiled thesis, 43 pages
- `main.tex` + `chapters/` + `bibliography.bib` — full LaTeX source
- `.zenodo.json` — complete deposition metadata (v20.0.0, CC-BY-4.0)
- GitHub release: https://github.com/szl-holdings/ouroboros-thesis/releases/tag/paper-v20-1.0.0
  (tag `paper-v20-1.0.0`)
- A source bundle is also attachable: zip of `main.tex chapters bibliography.bib CITATION.cff .zenodo.json README.md`

## Option A — New version under the existing concept DOI (RECOMMENDED)

This keeps the concept DOI `10.5281/zenodo.19944926` resolving to v20.

1. Get a personal token at https://zenodo.org/account/settings/applications/tokens/new
   with scopes `deposit:write` and `deposit:actions`. Export it:
   ```bash
   export ZENODO_TOKEN=...     # do NOT commit this
   ```
2. Create a new version of the concept record. First find the latest deposition ID for
   concept `19944926` (this is the v18 record `20434276`):
   ```bash
   curl -s -H "Authorization: Bearer $ZENODO_TOKEN" \
     "https://zenodo.org/api/deposit/depositions/20434276/actions/newversion"
   # -> follow the "latest_draft" link in the response
   ```
3. From the returned draft, note the new deposition `id` and its `bucket` URL.
4. Update the draft metadata from `.zenodo.json`:
   ```bash
   curl -s -X PUT -H "Authorization: Bearer $ZENODO_TOKEN" \
     -H "Content-Type: application/json" \
     "https://zenodo.org/api/deposit/depositions/<NEW_ID>" \
     -d "{\"metadata\": $(python3 -c 'import json;print(json.dumps(json.load(open(".zenodo.json"))))')}"
   ```
   (Zenodo expects the metadata fields nested under `"metadata"`. The `version`,
   `title`, `creators`, `license`, `related_identifiers`, etc. from `.zenodo.json`
   map directly.)
5. Upload the files to the bucket:
   ```bash
   curl -s -X PUT -H "Authorization: Bearer $ZENODO_TOKEN" \
     --upload-file main.pdf  "<BUCKET_URL>/ouroboros-thesis-v20.pdf"
   curl -s -X PUT -H "Authorization: Bearer $ZENODO_TOKEN" \
     --upload-file ouroboros-thesis-v20-tex.zip "<BUCKET_URL>/ouroboros-thesis-v20-tex.zip"
   ```
6. Publish:
   ```bash
   curl -s -X POST -H "Authorization: Bearer $ZENODO_TOKEN" \
     "https://zenodo.org/api/deposit/depositions/<NEW_ID>/actions/publish"
   ```
7. Capture the new **version DOI** from the response (`doi` field). The concept DOI
   `10.5281/zenodo.19944926` will now resolve to v20 automatically.

## Option B — GitHub→Zenodo automatic archiving

If the `szl-holdings/ouroboros-thesis` repo is linked in https://zenodo.org/account/settings/github/,
the published release `paper-v20-1.0.0` triggers an automatic deposition. Verify the
metadata picks up `.zenodo.json` at the repo root (note: the canonical `.zenodo.json`
lives in `papers/v20/`; copy it to the repo root before tagging if using this path, or
edit the auto-created draft to match).

## After minting — update cross-references

- Update the thesis chapter footers / `15-citation-web.tex` if you want the **minted v20
  DOI** printed (currently they cite the concept DOI `10.5281/zenodo.19944926`, which is
  correct and will resolve to v20).
- Update `CITATION.cff` `doi:` field to the new version DOI.
- Add `relation: isNewVersionOf 10.5281/zenodo.20434276` is already present in
  `.zenodo.json`.

## Honest note

The thesis text and all footers cite the **concept DOI** `10.5281/zenodo.19944926`,
which is stable and resolves to the latest version. This means the document is
internally correct **before** the version DOI exists — no placeholder DOI was fabricated.
