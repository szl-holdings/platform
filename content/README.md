# `content/` — Public-Facing Source Content

This directory holds the **source markdown** for everything user-facing that is not core product code: in-app docs, the SZL Academy, help center, demo walkthroughs, integration catalog, the trust center, the changelog, and the launch series (newsletters, Medium long-reads, LinkedIn posts, social kit).

## Why it lives at the repo root (not under `docs/`)

`docs/` is for **internal contributor documentation** (architecture notes, audit reports, governance, runbooks). `content/` is for **published artifacts** that ship into product surfaces and external channels:

- `content/help/`, `content/academy/`, `content/integrations/`, `content/trust/`, `content/changelog/` are read by in-product help/learning surfaces and the trust center.
- `content/launch-series/` is the canonical source for the multi-week launch arc bundled by `content/launch-series/bundle.sh` and referenced from `scripts/launch/publish-github-release.mjs`.
- `content/demos/` and `content/docs/` (note: this is a sub-folder of `content/`, distinct from top-level `docs/`) feed the in-app demo and docs viewer.

Splitting authored content from internal docs keeps publishing pipelines stable and lets contributors browse contributor docs in `docs/` without scrolling past hundreds of marketing files.

## Layout

| Folder | Purpose |
|--------|---------|
| `academy/` | SZL Academy learning center pages |
| `changelog/` | Release notes and breaking-change log |
| `demos/` | Demo walkthrough scripts (executive tour, operator tour, per-product) |
| `docs/` | In-product docs viewer source (architecture, auth, FAQ, glossary, troubleshooting, workflows, analytics, feature-flags) |
| `help/` | Help center entries (per-product help, contact, feedback, bug report, feature request) |
| `integrations/` | Public integrations catalog (index, status model, request form, template) |
| `launch-series/` | Three-week launch arc — newsletters, Medium, LinkedIn, social kit, bundle script |
| `reports/` | Public-facing reports |
| `trust/` | Trust center content (compliance roadmap, etc.) |

## Editing notes

- Keep filenames lowercase-kebab-case to match in-product slug routing.
- Launch-series posts ship as `linkedin.md`, `medium.md`, `substack.md`, `meta.md`, `hashtags.txt` — preserve that contract; tooling depends on it.
- After material changes to the launch series, regenerate the bundle via `bash content/launch-series/bundle.sh`.
