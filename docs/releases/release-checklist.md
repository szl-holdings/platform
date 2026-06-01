# SZL Holdings — Release Checklist

**Use this checklist before tagging any public release.**

---

## Pre-Release Validation

### Code Quality

- [ ] All artifacts build cleanly: `pnpm -r build` — zero errors
- [ ] No TypeScript compilation errors in API server: `pnpm --filter @workspace/api-server build`
- [ ] API health endpoint returns `{"status":"healthy"}` after build
- [ ] No pending database migrations (schema is pushed: `pnpm --filter db push`)

### Security

- [ ] Run `scripts/public-mirror/validate-mirror.sh` — zero errors
- [ ] No `.env` files committed (verify: `git status`)
- [ ] `.env.example` is current and all real values are replaced with `YOUR_*_HERE` placeholders
- [ ] No secrets in any committed files (spot check recently changed files)
- [ ] All API endpoints that should require auth still require auth

### Documentation

- [ ] `README.md` accurately describes current platform state
- [ ] `CHANGELOG.md` has an entry for this release
- [ ] Screenshots in `docs/screenshots/` are current (update if UI has changed significantly)
- [ ] Release notes file created: `docs/releases/v{VERSION}.md`
- [ ] Architecture docs updated if system changed
- [ ] Investor docs updated if product status changed

### Repository Hygiene

- [ ] No noisy directories present: run `scripts/public-mirror/detect-noisy-folders.sh`
- [ ] No large binary files committed that shouldn't be
- [ ] No `node_modules/` or `dist/` directories tracked

### Platform Functionality

- [ ] SZL Holdings home page loads
- [ ] Lyte dashboard loads with seeded data
- [ ] Vessels dashboard loads with demo data
- [ ] Aegis SOC dashboard loads
- [ ] Terra property map loads
- [ ] Carlota Jo web platform loads
- [ ] Stephen Site loads
- [ ] API health endpoint: `GET /api/health` → 200

---

## Release Execution

- [ ] Create Git tag: `git tag -a v{VERSION} -m "v{VERSION} — {Title}"`
- [ ] Push tag to remote: `git push origin v{VERSION}`
- [ ] Create GitHub Release from the tag
  - Title: `v{VERSION} — {Platform Title}`
  - Body: contents of `docs/releases/v{VERSION}.md`
  - Mark as pre-release if not GA
- [ ] Verify GitHub release appears correctly

---

## Post-Release

- [ ] Update GitHub repository description if needed
- [ ] Add/update repository topics if needed
- [ ] Post update to Stephen Lutar LinkedIn if release is significant
- [ ] Update `PRODUCT_MATRIX.md` readiness labels if any changed
- [ ] Archive this checklist instance as `release-checklist-v{VERSION}.md` (optional)

---

## Release Sign-Off

**Verified by:** Stephen Lutar  
**Date:**  
**Version:**  
**Notes:**
