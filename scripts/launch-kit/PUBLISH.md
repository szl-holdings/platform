# SZL Command — Publishing Runbook

This document covers how to push the first three essays from `posts.cjs` to
Substack and Medium as drafts, and the canonical-URL discipline used throughout
the launch kit.

---

## Canonical-URL discipline

**Substack is the canonical home.** Every post lives there first.
Medium is the syndication channel.  Medium drafts always include a
`canonicalUrl` pointing back to the Substack permalink so search engines
credit Substack, not Medium.

Publish order:
1. Create Substack draft → review & publish on Substack.
2. Wait ~24 hours.
3. Create Medium draft (with canonical pointing at the live Substack URL) →
   review & publish on Medium.

---

## Required credentials

| Variable | Where to get it |
|---|---|
| `SUBSTACK_SESSION` | Log in to Substack in Chrome, open DevTools → Application → Cookies → `substack.sid`. Copy the **value** of that cookie. |
| `SUBSTACK_PUBLICATION_URL` | The full base URL of your publication, e.g. `https://szlcommand.substack.com`. No trailing slash. |
| `MEDIUM_INTEGRATION_TOKEN` | medium.com → Settings → Security & Apps → Integration Tokens → Generate. |
| `MEDIUM_PUBLICATION_ID` | Call `curl -H "Authorization: Bearer $MEDIUM_INTEGRATION_TOKEN" https://api.medium.com/v1/users/me/publications` and copy the `id` field for your publication. |

Store these in Replit Secrets (never in source control).

---

## Run order

### Step 1 — Push Substack drafts

```bash
SUBSTACK_SESSION=<value> \
SUBSTACK_PUBLICATION_URL=https://szlcommand.substack.com \
node scripts/launch-kit/publish-substack.cjs
```

The script will print a draft URL for each post, e.g.:
```
✓ draft created  id=12345678
  https://szlcommand.substack.com/publish/post/12345678
```

Open each URL, review the formatting, then click **Publish** when ready.

> Note: Substack uses an unofficial API (session cookie).  If the script
> returns a 401 or 403, your session cookie has expired — re-copy it from
> DevTools and retry.

---

### Step 2 — Push Medium drafts (~24 h later)

```bash
MEDIUM_INTEGRATION_TOKEN=<value> \
MEDIUM_PUBLICATION_ID=<value> \
SUBSTACK_PUBLICATION_URL=https://szlcommand.substack.com \
node scripts/launch-kit/publish-medium.cjs
```

The script will:
- Verify your token with `/v1/me`
- Create each draft under the specified publication
- Embed `canonicalUrl` + a header note linking readers back to Substack
- Print a draft link for each post

Open https://medium.com/me/stories/drafts, review formatting, then click
**Publish** when ready.

> **Tip — guaranteed canonical URLs:** By default the canonical URL is
> derived from the post title (slug).  For an exact match, copy the real
> Substack permalink after publishing (e.g.
> `https://szlcommand.substack.com/p/why-im-building-szl-holdings-in-public`)
> and add a `canonicalUrl` field directly on the post object in `posts.cjs`
> before running this script.  The script always prefers an explicit
> `canonicalUrl` field over the derived slug.

---

## What the scripts do (and don't do)

| | Substack | Medium |
|---|---|---|
| Creates post as | **Draft** | **Draft** |
| Auto-publishes | No | No |
| Includes canonical URL | N/A (this is the canonical) | Yes → Substack permalink |
| Tags | Substack tags (`tags` field) | `mediumTags` field (max 5) |
| Source of content | `posts.cjs` — first 3 posts | `posts.cjs` — first 3 posts |

Both scripts are idempotent in the sense that running them again creates
**new** drafts rather than overwriting existing ones — delete any duplicate
drafts from the platform dashboards if needed.

---

## Troubleshooting

**Substack 401/403** — Session cookie expired. Re-copy `substack.sid` from DevTools.

**Substack 400** — Publication URL is wrong or the script cannot reach the API.
Confirm `SUBSTACK_PUBLICATION_URL` is the exact base URL (no trailing slash).

**Medium 401** — Integration token is invalid or expired. Regenerate it from
Settings → Security & Apps.

**Medium 400 / "publication not found"** — Double-check `MEDIUM_PUBLICATION_ID`.
Use the `/v1/users/me/publications` call above to confirm the correct ID.

**Medium tags error** — Medium accepts a maximum of 5 tags.  The `mediumTags`
field in `posts.cjs` already respects this limit.
