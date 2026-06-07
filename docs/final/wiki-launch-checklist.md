# Wiki Launch Checklist

**Context:** GitHub Wiki for `stephenlutar2-hash/szl-holdings-platform`  
**Date:** April 2026  
**Estimated time:** 20–30 minutes

---

## Pre-Flight

- [ ] Wiki is enabled in repo Settings → Features
- [ ] All wiki source files are ready in `docs/wiki/`
- [ ] Images are in `docs/wiki/assets/` (ready to copy to wiki repo)
- [ ] `docs/wiki/Screenshots-and-Demos.md` has been regenerated: `npx tsx scripts/media/generate-wiki-gallery.ts`

---

## Step 1: Enable Wiki

1. Go to: `https://github.com/stephenlutar2-hash/szl-holdings-platform/settings`
2. Scroll to **Features**
3. Check: **Wiki**
4. Save

---

## Step 2: Push Wiki Pages

The wiki is a separate git repository at `https://github.com/stephenlutar2-hash/szl-holdings-platform.wiki.git`

```bash
# Clone the wiki repo
git clone https://github.com/stephenlutar2-hash/szl-holdings-platform.wiki.git wiki-staging
cd wiki-staging

# Copy all wiki pages
cp /path/to/workspace/docs/wiki/*.md .

# Copy assets (images referenced in wiki pages)
mkdir -p assets
cp /path/to/workspace/docs/wiki/assets/* assets/

# Commit and push
git add -A
git commit -m "feat: wiki seed — platform documentation, screenshots, architecture"
git push origin master
```

---

## Step 3: Verify Sidebar Renders

1. Go to: `https://github.com/stephenlutar2-hash/szl-holdings-platform/wiki`
2. Check:
   - [ ] Sidebar shows all pages (from `_Sidebar.md`)
   - [ ] Navigation links work
   - [ ] Home page renders correctly

If sidebar doesn't show, confirm `_Sidebar.md` was pushed with the correct format:
```markdown
## SZL Holdings Wiki
- [[Home]]
- [[Platform Overview]]
- [[Architecture]]
...
```

---

## Step 4: Verify Footer Renders

1. Scroll to the bottom of any wiki page
2. Check: Footer content from `_Footer.md` appears
3. Footer should show: navigation links, copyright, last updated

---

## Step 5: Verify Image Links

Navigate to: `https://github.com/stephenlutar2-hash/szl-holdings-platform/wiki/Screenshots-and-Demos`

Check each image in the gallery:
- [ ] `szl-holdings-landing.jpg` loads
- [ ] `lyte-overview.jpg` loads
- [ ] `aegis-overview.jpg` loads
- [ ] `vessels-overview.jpg` loads
- [ ] `terra-overview.jpg` loads
- [ ] `mobile-view.jpg` loads
- [ ] SVG diagrams render (ecosystem-map.svg, platform-map.svg)

**Note:** Wiki images must reference the assets uploaded to the wiki repo, not to the main repo's `docs/` folder. Wiki images use: `[[assets/filename.jpg]]` or `![alt](assets/filename.jpg)`.

---

## Step 6: Verify README-to-Wiki Links

1. Open `https://github.com/stephenlutar2-hash/szl-holdings-platform` (main README)
2. Check any "View wiki" or "Full documentation →" links
3. They should resolve to `https://github.com/stephenlutar2-hash/szl-holdings-platform/wiki`

If the README references the wiki, ensure the link format is:
```markdown
[View full documentation →](https://github.com/stephenlutar2-hash/szl-holdings-platform/wiki)
```

---

## Step 7: Final QA

| Check | Expected | Status |
|-------|---------|--------|
| Wiki enabled | Tab visible on repo page | — |
| Home page | Renders with intro and navigation | — |
| Sidebar | All pages listed, links work | — |
| Footer | Appears on all pages | — |
| Screenshots page | All 6 images load | — |
| Architecture page | SVG diagrams render | — |
| README → Wiki link | Resolves correctly | — |
| Mobile view | Wiki readable on mobile | — |

---

## Wiki Pages Summary

| Page | Description |
|------|-------------|
| `Home.md` | Welcome, quick nav, platform overview |
| `Platform-Overview.md` | Full platform ecosystem description |
| `Architecture.md` | Technical architecture with diagrams |
| `Lyte-Business-Observability.md` | Lyte product detail |
| `Alloy-Execution-Fabric.md` | Alloy product detail |
| `Aegis-Defense-Intelligence.md` | Aegis product detail |
| `Vessels-Maritime-Intelligence.md` | Vessels product detail |
| `Terra-Real-Estate.md` | Terra product detail |
| `Carlota-Jo.md` | Carlota Jo product detail |
| `Trust-and-Security.md` | Security posture and trust center |
| `Screenshots-and-Demos.md` | Visual gallery (auto-generated) |
| `_Sidebar.md` | Navigation sidebar |
| `_Footer.md` | Page footer |

---

## Notes

- GitHub Wiki doesn't support subdirectories — all pages are flat in the wiki repo root
- Sidebar file must be named exactly `_Sidebar.md` (case-sensitive)
- Footer file must be named exactly `_Footer.md` (case-sensitive)
- Wiki images must be uploaded to the wiki repo, not referenced from the main repo
- The wiki can be searched with `?q=` — make sure page titles are descriptive
