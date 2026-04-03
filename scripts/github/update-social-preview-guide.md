# Social Preview Upload Guide

GitHub repository social preview images must be uploaded manually through the GitHub UI. There is no API endpoint for this.

---

## Steps to Upload

1. **Go to repository settings:**
   `https://github.com/stephenlutar2-hash/szl-holdings-platform/settings`

2. **Scroll to "Social preview"** in the General settings section.

3. **Click "Edit"** next to the social preview placeholder.

4. **Click "Upload an image..."**

5. **Select** `docs/media/social-preview/repo-social-preview.png` from your local filesystem.
   - If working from the Replit workspace, download the file first or use the GitHub web upload.

6. **Click "Set social preview"** to confirm.

7. **Verify:** Share the repository URL in a test Slack message or Twitter/X post to confirm the preview renders correctly.

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
