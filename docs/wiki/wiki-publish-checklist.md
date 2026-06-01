# Wiki Publish Checklist

Run this checklist before each wiki sync. Confirm each item before pushing.

---

## Pre-Sync Checks

- [ ] All 12 wiki seed pages have been reviewed and updated for accuracy
- [ ] `_Sidebar.md` navigation matches the current page set
- [ ] `_Footer.md` public mirror notice is intact
- [ ] No placeholder content ("TBD", "Coming soon") in any published page
- [ ] No internal tooling paths or credentials referenced
- [ ] No financial projections, user counts, or unverifiable claims
- [ ] Screenshot file paths in `Screenshots-and-Demos.md` point to files that exist in `docs/media/screenshots/`

## Validation

- [ ] Run `npx tsx scripts/wiki/prepare-wiki-pages.ts` — no errors or warnings

## Export

- [ ] Local wiki repo clone exists at `../szl-holdings-platform.wiki`
- [ ] Wiki repo is on the default branch (usually `master`) and pulled to latest
- [ ] Run `npx tsx scripts/wiki/export-docs-to-wiki.ts` — all files copied
- [ ] Review the file list output — no unexpected files

## Commit

- [ ] Run `bash scripts/wiki/wiki-commit.sh "<message>"` — committed and pushed
- [ ] Verify at `https://github.com/stephenlutar2-hash/szl-holdings-platform/wiki`
- [ ] Check that the sidebar and footer render correctly on all pages
- [ ] Check that screenshot images render correctly on `Screenshots-and-Demos`
- [ ] Verify wiki links (`[[PageName]]`) resolve correctly from `Home` and `_Sidebar`

## Post-Publish

- [ ] README.md links to wiki pages are valid (check the docs map table)
- [ ] Profile README links are valid if they reference wiki pages
- [ ] Announce update in release notes if this is a release-cycle sync

---

## Rollback

If a bad publish occurs, revert in the wiki repo:

```bash
cd ../szl-holdings-platform.wiki
git log --oneline -5
git revert HEAD  # or git reset --hard <commit>
git push origin master
```
