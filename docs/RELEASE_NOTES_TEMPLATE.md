# Release Notes — v{VERSION}

**Date:** {DATE}
**Type:** {Major | Minor | Patch | Hotfix}
**Status:** {Released | Pre-release | Rolled back}

---

## Summary

{One paragraph: what changed and why it matters.}

---

## What's New

### {Feature/Change Name}
{Description of the change. What does it do? Who benefits?}

**Affected surfaces:** {List affected artifacts/domains}

---

## Fixes

- {Description of bug fix} — {affected area}

---

## Breaking Changes

{List any breaking changes. If none, write "None."}

---

## Security

- {Security-relevant changes, dependency updates, vulnerability patches}

---

## Known Issues

- {Known issues in this release}

---

## Migration Notes

{Any manual steps required after deployment. If none, write "No migration steps required."}

---

## Metrics Snapshot

| Metric | Before | After |
|--------|--------|-------|
| Route handlers | {count} | {count} |
| Database tables | {count} | {count} |
| Test specs passing | {count} | {count} |

---

## Verification

- [ ] CI pipeline passed (lint, typecheck, build, test)
- [ ] Security scan clean
- [ ] E2E tests passed
- [ ] Health endpoint returns 200
- [ ] Platform facts regenerated and validated
- [ ] Changelog updated
