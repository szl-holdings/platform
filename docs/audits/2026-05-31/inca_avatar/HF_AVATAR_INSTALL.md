# HF_AVATAR_INSTALL — How to install the new org avatar

**TL;DR:** Hugging Face does **not** expose a public API for setting an *organization*
avatar — it is a UI-only action that requires an org admin. The connected token in this
session (user `betterwithage`) also returned **403 Forbidden** on writes to the
`SZLHOLDINGS` repos, confirming it lacks org-write permission. The avatar change therefore
requires a **founder (org-admin) UI action**. The exact steps are below.

---

## A · Set the org avatar (3 clicks — founder/org-admin)

The animated GIF is the main deliverable and will be shared to you via `share_file`
(`avatar_animated.gif`, 400×400, 2.31 MB, < HF's 3 MB limit).

1. Visit **https://huggingface.co/organizations/SZLHOLDINGS/settings/profile**
   (must be signed in as an org admin).
2. Click **"Change avatar"** (the camera/pencil control on the current avatar image).
3. Upload **`avatar_animated.gif`**, then click **Save**.

> If the GIF is rejected for any reason, upload the static fallback `avatar_400.png`
> instead — HF accepts PNG avatars and will resize automatically.

### Verifying the API limitation (for the record)
- `GET https://huggingface.co/api/organizations/SZLHOLDINGS/overview` returns the current
  `avatarUrl` (read-only); there is **no documented `POST`/`PUT` avatar endpoint** for orgs.
- The `huggingface_hub` `HfApi` exposes repo/file operations, not org-avatar mutation.
- Attempting a write to `SZLHOLDINGS/SZLHOLDINGS` via the connected token returned:
  `403 Forbidden ... Make sure your token has the correct permissions.` (both direct commit
  and `create_pr=1`).

To enable programmatic pushes in future, grant the automation token **write access to the
SZLHOLDINGS org** (Settings → Access Tokens → fine-grained, with the org selected). Even
with write access, the **avatar itself still requires the UI action above** — only the
embeddable asset (below) can be pushed via API.

## B · (Optional) Embed the animated avatar on the org card

To make the animated avatar iframe-embeddable on the org/profile card, add the
vector `avatar_static.svg` (which carries the SMIL animation: 4 s khipu, 8 s amaru,
16 s chakana, 72 BPM lambda) to the org card repo `SZLHOLDINGS/SZLHOLDINGS` at
`assets/inca_avatar.svg`, then reference it in the README, e.g.:

```html
<p align="center">
  <img src="assets/inca_avatar.svg" width="160" alt="SZL Holdings Inca avatar"/>
</p>
```

A push of this SVG was attempted in-session but blocked by the 403 above. Once the token
has org-write (or an admin runs it), the push is:

```bash
hf upload SZLHOLDINGS/SZLHOLDINGS \
  /path/to/avatar_static.svg assets/inca_avatar.svg \
  --repo-type model \
  --commit-message "Add Inca avatar (khipu/amaru/lambda/chakana) embeddable SVG"
```

(or open it as a PR by adding `--create-pr`). The GIF can be uploaded the same way to
`assets/inca_avatar_animated.gif` for `<img>` embedding where SMIL is not desired.

---

— Yachay, 2026-06-01.
