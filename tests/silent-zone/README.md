# Silent-Zone Baseline Tests

This directory holds **baseline tests** for the "silent zone" of the
monorepo — workspace packages that previously shipped with **zero** test
coverage even though they're imported by production code.

Identified in `dossier/series-a-operational/ROUND11_ZOOMOUT_GAP_AUDIT_2026-05-18.md`,
section "4. Test-coverage gap — packages without any tests".

## Layout

- `<scope>__<name>.smoke.test.ts` — auto-generated baseline smoke test that
  statically imports the package's public surface and asserts it loads and
  exposes at least one named export. Regenerate with
  `node scripts/gen-silent-zone-smoke-tests.mjs`.
- `<scope>__<name>.test.ts(x)` — hand-written deeper test for the highest
  blast-radius packages (currently: `@szl-holdings/auth-shared`,
  `@szl-holdings/db-schema`, `@szl-holdings/design-system`).
- `MANIFEST.json` — machine-readable snapshot of which package each smoke
  test belongs to.

## CI guard

`scripts/check-zero-test-packages.mjs` (wired into `pnpm lint:ci` as
`check:zero-test-packages`) walks every `packages/*` and `lib/*` workspace
package and fails the build when one has neither an internal test file nor
a baseline smoke test in this directory. This is what stops the
silent-zone from re-growing.

Run locally:

```bash
node scripts/check-zero-test-packages.mjs           # human report
node scripts/check-zero-test-packages.mjs --json    # machine output
```

## Adding a new workspace package

1. Add your `packages/<name>/` or `lib/<name>/` directory.
2. Either add a `*.test.ts` inside the package, **or** run
   `node scripts/gen-silent-zone-smoke-tests.mjs` to generate a baseline
   smoke stub.
3. `pnpm check:zero-test-packages` must exit 0.
