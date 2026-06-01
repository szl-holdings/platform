# PERSONAL_SITE_FAVICON_LOG — Provenanced Notebook

**Date:** 2026-06-01
**Source:** `/home/user/workspace/szl_personal_frontier/` (static site)
**Local commit (no remote configured):** `9bb5ff0e6103bca64db182a0958720b8733fad52`
**Remote:** none (`git remote -v` empty) → committed locally and documented. Deploys from local; no HF/auth involvement.

## Changes (additive)

New asset:
- `assets/szl-avatar-animated.gif` (2,307,397 bytes) — added.

`index.html` `<head>` additions (existing `<link rel="icon" href="assets/favicon.svg">` retained — additive):
- `<link rel="icon" href="assets/szl-avatar-animated.gif" type="image/gif" sizes="400x400">` (alternate favicon — shows on browser tab where GIF favicons are honored)
- `<meta property="og:image" content="assets/szl-avatar-animated.gif">` (social share image)
- `<meta name="twitter:card" content="summary_large_image">` + `<meta name="twitter:image" content="assets/szl-avatar-animated.gif">`
- Supporting `og:type`/`og:title`/`og:description`/`twitter:title` (none existed before → fully additive).

## Verification (on-disk, real)

- `assets/szl-avatar-animated.gif` present.
- `index.html` now has **2** `rel="icon"` links (svg + gif) and **1** `og:image`.
- Existing `assets/favicon.svg` (863 B) and `assets/kanchay-glyph.svg` — **both retained, untouched**.

## Founder note
To publish: deploy the `szl_personal_frontier/` directory as-is. The GIF is referenced with
relative paths (`assets/…`), so it works under any path/host. Social cards (LinkedIn/X/Slack
unfurls) will use the animated avatar as the share image.
