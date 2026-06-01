# DOCS_SITE_BUILD_LOG — VitePress navbar logo = Inca avatar

**Date:** 2026-06-01
**Repo:** szl-holdings/docs-site (pushed — see GITHUB_PUSH_LOG.md, SHA `2db82380ac8ab487d9971a6950f36d8a3fc9bcd6`)
**Local source built:** `/home/user/workspace/szl_docs_site/`

## Change made (additive)

- Config file is **`docs/.vitepress/config.mjs`** (not `config.ts` — there is no `.ts` config in this repo).
- `themeConfig.logo` changed from `'/img/szl-mark.svg'` → **`'/img/szl-avatar-animated.gif'`**.
- New asset added: **`docs/public/img/szl-avatar-animated.gif`** (2,307,397 bytes).
- The previous static logo **`docs/public/img/szl-mark.svg` is retained on disk** (additive — not removed). Comment added in config noting this.
- Also added root `/branding/szl-avatar-animated.gif` + README block (consistent with other repos).

## Build — RAN SUCCESSFULLY in sandbox

Sandbox HAS pnpm/npm/node (pnpm 11.5.0, node v24.16.0). Build script is **`docs:build`**
(`"docs:build": "vitepress build docs && node fix-relative-paths.mjs"`), not `build`.

esbuild's post-install build script is gated by pnpm; approved via `pnpm-workspace.yaml`:
```yaml
allowBuilds:
  esbuild: true
onlyBuiltDependencies:
  - esbuild
```

Commands run (local source):
```
cd /home/user/workspace/szl_docs_site
pnpm install        # rc=0 (esbuild postinstall: Done)
pnpm docs:build     # rc=0
```

Build output (verbatim tail):
```
vitepress v1.6.4
✓ building client + server bundles...
✓ rendering pages...
build complete in 8.04s.
fix-relative-paths: rewrote 30 HTML file(s) of 31 total.
```

## Post-build verification (on-disk, real)

- `docs/.vitepress/dist/img/szl-avatar-animated.gif` → present, **2,307,397 bytes**.
- `docs/.vitepress/dist/index.html` → contains `szl-avatar-animated.gif` (logo wired into rendered HTML).
- `docs/.vitepress/dist/img/szl-mark.svg` → still present (578 bytes) — old logo retained.

## Founder-runnable build line (for re-deploy of the pushed repo)

```bash
git clone https://github.com/szl-holdings/docs-site && cd docs-site
printf 'allowBuilds:\n  esbuild: true\nonlyBuiltDependencies:\n  - esbuild\n' > pnpm-workspace.yaml
pnpm install && pnpm docs:build      # output in docs/.vitepress/dist
```
Deploy target: `docs.szlholdings.com` (per repo description / config).
