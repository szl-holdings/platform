# Firestorm — ARCHIVED

The Firestorm front-end artifact was archived in Task #920 (April 2026). Only
the build output (`dist/`) and `node_modules/` directories remain on disk —
both are gitignored — and there is **no source code, no `package.json`, no
`vite.config.ts`, and no workflow** for this app.

## Status

- **Front-end app:** archived. Not registered as an artifact, no workflow,
  not part of the pnpm workspace, not deployable from this repo.
- **Backend domain:** still live. The Firestorm domain routes
  (`/firestorm/*`), database tables, and shared library code in
  `artifacts/api-server/src/routes/firestorm.ts`,
  `artifacts/api-server/src/lib/domain-services/firestorm/`, and the
  GraphQL schema continue to power downstream consumers (Aegis, Command,
  cross-app smoke tests). They are intentionally **not** affected by this
  archive marker.

## Restoring (if needed)

If a future product decision brings the front-end back, treat it as a
new build:

1. Bootstrap a new Vite/React artifact under `artifacts/firestorm/` via the
   artifact scaffold tooling (do **not** try to restore from `dist/`).
2. Re-register the artifact (creates the workflow + preview path).
3. Wire the new UI to the existing `/firestorm/*` API surface.

## Related tasks

- Task #634 — removed the deprecated `prism-counsel/` and `stephen-site/`
  directories entirely.
- Task #920 — archived `firestorm/`, `imperium/`, `lyte-command-center/`
  front-end source.
- Task #862 (this) — re-asserts the archive markers, removes the apps
  from the README's "live products" list, and clarifies that the
  task's "restore" framing is obsolete.
