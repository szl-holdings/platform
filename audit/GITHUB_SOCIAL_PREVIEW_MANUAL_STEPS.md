# GitHub Social Preview Upload — Manual Steps

GitHub does not expose a public REST or GraphQL endpoint for setting the
"Social preview" image on a repository. It must be uploaded through the
GitHub web UI.

## Files to upload

The prepared social preview source images live in:

- `docs/media/social-preview/repo-social-preview.png` — for `szl-holdings/szl-holdings-platform`
- `docs/media/social-preview/org-social-preview-source.jpg` — for `szl-holdings/.github` (org profile)
- `docs/media/social-preview/stephen-lutar.svg` — alternate art (export to PNG before upload)
- `docs/media/social-preview/szl-holdings-platform.svg` — alternate art (export to PNG before upload)

## Upload steps (per repo)

1. Open the repo on github.com.
2. Click **Settings** → scroll down to the **Social preview** section
   (under "General").
3. Click **Edit** → **Upload an image…**
4. Choose the corresponding file from `docs/media/social-preview/`.
5. Confirm the preview renders correctly in the right-hand thumbnail.
6. Save.

GitHub recommends a 1280×640 image. Both prepared PNG/JPG sources are
already sized and visually balanced for that aspect ratio.

## Why this is manual

The undocumented `/repos/{owner}/{repo}/community/profile` and
`/repos/{owner}/{repo}/social-preview` endpoints are not part of the
public REST surface and reject `multipart/form-data` uploads from
personal access tokens. GitHub Apps cannot set this either. The only
supported path is the web UI form.

## Verification

After upload, confirm by fetching the OpenGraph tag:

```sh
curl -sI -L https://opengraph.githubassets.com/$(date +%s)/szl-holdings/szl-holdings-platform | grep -i content-type
```

A successful upload returns `image/png` (or `image/jpeg`) with a
non-zero `content-length`.
