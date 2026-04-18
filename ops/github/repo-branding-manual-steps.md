# Repo Branding Manual Steps

Step-by-step instructions for updating `szl-holdings-platform` repository branding, About text, topics, social preview, and positioning.

---

## Step 1 — Update Repository About Text

The About section (visible on the repository homepage) controls the description, website link, and topic display.

1. Go to: `https://github.com/stephenlutar2-hash/szl-holdings-platform`
2. Click the **gear icon (⚙)** next to "About" (top-right of the repo summary panel)
3. Set **Description** to:
   ```
   Governed decision infrastructure software — Lyte · Alloy · Aegis · Vessels · Terra
   ```
4. Set **Website** to: `https://szlholdings.com`
5. Leave "Include in the home page" unchecked (this is for special repos like profile READMEs)
6. Click **Save changes**

---

## Step 2 — Add Topics

In the same About gear icon dialog, or via the Topics field:

1. Click the **gear icon (⚙)** next to "About"
2. In the **Topics** field, add each topic one at a time:
   ```
   szl-holdings
   lyte
   alloy
   business-observability
   ai-orchestration
   secure-operations
   enterprise-platform
   typescript
   react
   azure
   vessels
   ```
3. Click **Save changes**

**Full rationale:** See `ops/github/recommended-topics.md`

**Remove any existing topics** not in the list above (e.g. `saas`, `maritime-intelligence`, `drizzle-orm` are not in the recommended set).

---

## Step 3 — Upload Social Preview

GitHub social preview images must be uploaded through the repository Settings page.

1. Go to: `https://github.com/stephenlutar2-hash/szl-holdings-platform/settings`
2. Scroll to **Social preview**
3. Click **Edit**
4. Click **Upload an image...**
5. Select `docs/media/social-preview/repo-social-preview.png` from your local machine
   - If working remotely, download the file first from the Replit workspace
6. Click **Set social preview**

**If the designed social preview is not ready:** Upload `docs/media/screenshots/lyte-overview.jpg` as an interim placeholder.

**Verify:** Share the repo URL in a test Slack message to confirm the preview card renders.

**Spec:** See `docs/media/social-preview/social-preview-spec.md`  
**Upload guide:** See `scripts/github/update-social-preview-guide.md`

---

## Step 4 — Verify Screenshots Render Correctly

1. Go to: `https://github.com/stephenlutar2-hash/szl-holdings-platform`
2. Scroll to the Screenshots section in the README
3. Confirm all four images render:
   - Landing hero
   - Lyte overview
   - Alloy overview
   - Trust center
4. If images are broken, check that the file paths in README.md match the actual files in `docs/media/screenshots/`

---

## Step 5 — Verify Repository Positioning

After completing the above steps, do a full positioning review:

- [ ] About description is set and correct
- [ ] Website link resolves to `https://szlholdings.com`
- [ ] All 11 topics are applied
- [ ] Social preview image is uploaded and renders correctly
- [ ] README hero section is correct and compelling
- [ ] All links in README are valid (no 404s)
- [ ] Documentation Map links in README resolve to existing files
- [ ] Wiki is enabled and published (see `ops/github/wiki-manual-steps.md`)

---

## Step 6 — Enable Wiki (if not done)

The wiki is part of the platform's public documentation layer. If not yet enabled:

1. Go to: Settings → Features → check **Wikis** → Save
2. Follow `ops/github/wiki-manual-steps.md` for full wiki setup

---

## Fix Repo Positioning

After applying all branding steps, the repository should present as:

- **What it is:** Governed decision infrastructure platform — not a boilerplate, demo, or open-source project
- **Who built it:** Stephen Lutar, SZL Holdings — proprietary, founder-led
- **Who it's for:** Enterprise buyers, investors, technical reviewers
- **What to do next:** README directs clearly to the right starting point for each audience
