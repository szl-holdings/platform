# Social Preview Upload Guide

GitHub repository social preview images must be uploaded manually through the GitHub UI. There is no API endpoint for this.

---

## Steps to Upload — szl-holdings-platform

1. **Go to repository settings:**
   `https://github.com/szl-holdings/szl-holdings-platform/settings`

2. **Scroll to "Social preview"** in the General settings section.

3. **Click "Edit"** next to the social preview placeholder.

4. **Click "Upload an image..."**

5. **Select** `docs/media/social-preview/repo-social-preview.png` from your local filesystem.
   - If working from the Replit workspace, download the file first or use the GitHub web upload.

6. **Click "Set social preview"** to confirm.

7. **Verify:** Share the repository URL in a test Slack message or Twitter/X post to confirm the preview renders correctly.

---

## Steps to Upload — .github (org profile repo)

1. **Go to repository settings:**
   `https://github.com/szl-holdings/.github/settings`

2. **Scroll to "Social preview"** in the General settings section.

3. **Click "Edit"** next to the social preview placeholder.

4. **Click "Upload an image..."**

5. **Select** `docs/media/social-preview/org-social-preview-source.jpg` from your local filesystem.

6. **Click "Set social preview"** to confirm.

---

## Steps to Pin Repositories on the Org Profile

1. **Go to the org profile:**
   `https://github.com/szl-holdings`

2. **Click "Edit profile"** (top-right, visible to org owners).

3. **Click "Manage pinned repositories"** (or the pin icon on any listed repo).

4. **Search for `szl-holdings-platform`** and check it as the first pin.

5. **Search for `.github`** and check it as the second pin.

6. **Save** the updated pin order.

---

## Image Requirements Reminder

| Property | Requirement |
|----------|-------------|
| Dimensions | 1280 × 640px (2:1 ratio) |
| Format | PNG or JPG |
| File size | Under 1MB |

---

## Troubleshooting

**Preview not updating:** Social preview images are cached by social networks for hours to days. Use a cache-buster tool (e.g., LinkedIn Post Inspector, Twitter Card Validator) to force a refresh.

**Image appears cropped:** GitHub displays the preview at 1280 × 640. If your image is a different ratio, it will be cropped. Stick to the 2:1 ratio exactly.

**Low quality:** Export at exactly 1280 × 640px at 100% quality, not scaled up from a smaller source.

---

## See Also

- [Social Preview Spec](../../docs/media/social-preview/social-preview-spec.md)
- [Repo Branding Manual Steps](../../ops/github/repo-branding-manual-steps.md)
