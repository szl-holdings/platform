# Wiki Manual Steps

Step-by-step instructions for enabling, publishing, and managing the GitHub Wiki for `szl-holdings-platform`.

---

## Step 1 — Enable the Wiki

1. Go to: `https://github.com/szl-holdings/szl-holdings-platform/settings`
2. Scroll to **Features**
3. Check the box next to **Wikis**
4. Click **Save changes**

**Note:** The previous `manual-checklist.md` had Wiki disabled. The wiki is now part of the platform's public documentation layer. Enable it.

---

## Step 2 — Initialize the Wiki Repo

GitHub requires at least one page to be created through the UI before the wiki Git repository exists.

1. Go to: `https://github.com/szl-holdings/szl-holdings-platform/wiki`
2. Click **Create the first page**
3. Enter a placeholder title (e.g. "Home") and any placeholder content (e.g. "Initializing...")
4. Click **Save Page**

This creates the wiki Git repository, which you can now clone.

---

## Step 3 — Clone the Wiki Repository

```bash
git clone https://github.com/szl-holdings/szl-holdings-platform.wiki.git ../szl-holdings-platform.wiki
cd ../szl-holdings-platform.wiki
```

---

## Step 4 — Publish the Wiki Home Page

Run the full wiki sync pipeline from the Replit workspace:

```bash
# Validate all pages
npx tsx scripts/wiki/prepare-wiki-pages.ts

# Export to local wiki clone
npx tsx scripts/wiki/export-docs-to-wiki.ts

# Commit and push
bash scripts/wiki/wiki-commit.sh "Initial wiki publish — all 12 pages"
```

---

## Step 5 — Add the Sidebar and Footer

The `_Sidebar.md` and `_Footer.md` files are included in the export step above. After pushing, verify:

1. Go to: `https://github.com/szl-holdings/szl-holdings-platform/wiki`
2. Confirm the sidebar appears on the left of each page
3. Confirm the footer appears at the bottom of each page

If the sidebar is not visible, GitHub may not have rendered the `_Sidebar.md`. Check that:
- The file is named exactly `_Sidebar.md` (underscore prefix, exact case)
- The file was successfully pushed to the wiki repo

---

## Step 6 — Verify Image Rendering

1. Go to: `https://github.com/szl-holdings/szl-holdings-platform/wiki/Screenshots-and-Demos`
2. Confirm that screenshot images render correctly
3. If images do not render, check that the paths in the wiki page match the actual file paths in the main repository

**Note:** Wiki pages reference images in the main repo using relative paths like `../../docs/media/screenshots/lyte-overview.jpg`. These only resolve if the wiki is served from the GitHub wiki domain with proper cross-repo reference support.

**Alternative:** For reliable image rendering in the wiki, host images as GitHub release assets or use absolute GitHub raw content URLs:
```
https://raw.githubusercontent.com/szl-holdings/szl-holdings-platform/main/docs/media/screenshots/lyte-overview.jpg
```

Update the image URLs in `docs/wiki/wiki-seed/Screenshots-and-Demos.md` if relative paths do not render.

---

## Step 7 — Verify README-to-Wiki Links

The README.md should link to key wiki pages. After publishing the wiki, verify these links are valid:

1. Go to: `https://github.com/szl-holdings/szl-holdings-platform`
2. Click each wiki link in the Documentation Map section
3. Confirm each wiki page loads correctly

---

## Step 8 — Verify Wiki Navigation

1. From the wiki home page, click each link in the Sidebar
2. Click each link in the Quick Navigation table on the Home page
3. Verify all `[[PageName]]` wiki links resolve correctly
4. Verify the footer public mirror notice is visible on all pages

---

## Ongoing Maintenance

After each platform release or significant documentation update:
1. Update the relevant seed pages in `docs/wiki/wiki-seed/`
2. Run the sync pipeline (Steps 4 above)
3. Verify the updated pages on GitHub

See `docs/wiki/wiki-publish-checklist.md` for the full pre-sync checklist.
