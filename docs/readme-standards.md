# README Standards

Guidelines for maintaining README files, visual assets, and badges in this repository.

---

## Asset Locations

All README-facing visual assets live under `/assets/readme/` using the following subdirectory structure:

| Directory | Contents |
|-----------|----------|
| `assets/readme/badges/` | Badge SVGs that cannot be served by a live shield URL |
| `assets/readme/brand/` | Logo, wordmark, founder card, and brand mark files |
| `assets/readme/products/` | One representative screenshot per product (1280×800 px preferred) |
| `assets/readme/architecture/` | Architecture diagrams, platform maps, ecosystem maps |
| `assets/readme/screens/` | Additional UI screenshots used in docs |
| `assets/readme/team/` | Headshots or team visuals if needed |

Assets that are only used within a specific artifact (not referenced from any README or docs file) live inside that artifact's own directory and are not subject to these rules.

---

## Naming Rules

- All filenames must be **lowercase** with **hyphens** as word separators (kebab-case).
- No spaces, underscores, camelCase, or uppercase letters in filenames.
- Use descriptive names that reflect the content: `aegis-command-dashboard.jpg`, not `screenshot-1.jpg`.
- Valid extensions: `.jpg`, `.png`, `.svg`, `.gif`, `.webp`.

Examples:

```
assets/readme/products/vessels-maritime.jpg       CORRECT
assets/readme/products/Vessels Maritime.jpg       WRONG
assets/readme/products/vessels_maritime.JPG       WRONG
assets/readme/screens/szl-holdings-dashboard.jpg  CORRECT
```

---

## Adding a New Product Image

1. Capture or export the screenshot at 1280×800 px (or similar 16:10 ratio).
2. Save as a JPEG (quality 85) or PNG.
3. Name the file using kebab-case: `<product-name>-<view>.jpg`.
4. Place it under `assets/readme/products/`.
5. Reference it in `README.md` using a repo-relative path:
   ```markdown
   ![Product Name](assets/readme/products/product-name-view.jpg)
   ```
6. Run `pnpm readme:check` to confirm the validator passes before committing.

---

## Badge Rules

Badges in `README.md` must meet all of the following criteria:

1. **High signal only.** Permitted badge types: CI status, CodeQL analysis, Security audit, License. Remove or do not add badges for vanity metrics (stars, forks, visitors, size).
2. **Real workflow.** Every badge that references a GitHub Actions workflow file must point to a file that actually exists under `.github/workflows/`. The validator (`pnpm readme:check`) enforces this.
3. **Stable URLs only.** Badges served from `shields.io`, `img.shields.io`, or `github.com/…/badge.svg` are acceptable. Never link to Replit preview URLs, `localhost`, blob storage, or temporary upload hosts.
4. **One line per badge.** Place all active badges on the first line after the `<h1>` heading, space-separated.

Current approved badge set:

| Badge | Workflow file |
|-------|--------------|
| CI | `.github/workflows/ci.yml` |
| CodeQL | `.github/workflows/codeql.yml` |
| Security | `.github/workflows/security.yml` |

---

## No External or Localhost Source Policy

The validator (`scripts/validate-readme-assets.js`) rejects any image reference that:

- Uses a `localhost` or `127.0.0.1` URL — these render as broken images on GitHub.
- References a Replit `/blob/` or temp-upload URL — these are ephemeral and will break.
- Uses any URL that is not a stable public CDN (for remote images) or a repo-relative path (for local images).

All local images must be committed to the repository under `assets/readme/`. Do not link to external image hosting for README images.

---

## Running the Validator

```bash
pnpm readme:check
```

This runs `scripts/validate-readme-assets.js` against `README.md` and all local markdown files it links to. The script:

- Parses `![alt](url)` and `<img src="url">` references.
- Checks that every local path exists with exact case on disk.
- Checks that every badge referencing a GitHub Actions workflow points to a file that exists.
- Flags `localhost` and Replit temp URLs.
- Exits non-zero with a clear error list on failure.

To validate the profile README separately:

```bash
node scripts/validate-readme-assets.js --readme profile-readme/README.md
```

---

## CI Enforcement

`.github/workflows/readme-qa.yml` runs `pnpm readme:check` automatically on:

- Every pull request that modifies `README.md`, `profile-readme/README.md`, `assets/readme/**`, `.github/workflows/**`, or the validator script itself.
- Every push to `main` or `master` matching the same paths.

Merge is blocked if the validator exits non-zero.

---

## Profile README

`profile-readme/README.md` is the source of truth for the GitHub profile README. It follows the same asset and badge rules as the root `README.md`. When updating it:

1. Edit `profile-readme/README.md` in this workspace.
2. Run `node scripts/validate-readme-assets.js --readme profile-readme/README.md`.
3. Copy the updated file to the `stephenlutar2-hash` profile repo and push.

See `profile-readme/PROFILE_REPO_SETUP.md` for full setup instructions.
