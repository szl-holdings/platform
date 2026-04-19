# SZL Holdings — Launch Series

Connected three-week launch arc for the SZL Command newsletter, Medium long-reads, LinkedIn shorts, and the cross-channel social announcement kit. Everything is paste-and-publish.

---

## Drop Order

### Week 1 — Foundational Arc (SZL Command • The Operator)

| # | Folder | Day | Title |
|---|--------|-----|-------|
| 1 | `01-thursday-intro/` | Thursday, April 16 | The accountability gap is the next enterprise problem |
| 2 | `02-sunday-deep-dive/` | Sunday, April 19 | Six primitives, not features |
| 3 | `03-monday-operator-lens/` | Monday, April 20 | From signal to proof: a day inside a governed decision |

### Week 2 — Operator Continuation

| # | Folder | Day | Title |
|---|--------|-----|-------|
| 4 | `04-operator-w2-post4/` | Thursday, April 23 | The six primitives, in detail |
| 5 | `05-operator-w2-post5/` | Sunday, April 26 | Trust layers — Covenant Policy in practice |
| 6 | `06-operator-w2-post6/` | Monday, April 27 | The platform moat: shared governance across six domains |

### Week 2 — Medium Long-Reads

| # | Folder | Day | Title |
|---|--------|-----|-------|
| 7 | `07-medium-aegis-thesis/` | Tuesday, April 21 | The Aegis defense thesis |
| 8 | `08-medium-cortex-architecture/` | Thursday, April 23 | CORTEX architecture: the unified agentic AI layer |
| 9 | `09-medium-cross-domain-moat/` | Saturday, April 25 | The cross-domain moat |

### LinkedIn Week 1 Adaptations

| # | Folder | Title |
|---|--------|-------|
| 10 | `10-linkedin-week1-short/` | Short-format adaptations of Week 1 Operator posts (post1–post3) |

### Standalone Assets

| Folder / File | Purpose |
|---------------|---------|
| `social-announcement-kit/` | Cross-channel launch announcement (Substack email, X thread, LinkedIn) |
| `substack-template.md` | Reusable template for every new SZL Command issue |

---

## What's in Each Folder

```
01-thursday-intro/
├── linkedin.md          ← short-form post (1,300–1,900 chars), hook-led
├── medium.md            ← long-form article with headings and pull quotes
├── substack.md          ← email variant — subject line, preheader, single CTA
├── meta.md              ← title, subtitle, tags, canonical URL, OG alt text
├── hashtags.txt         ← ready-to-paste hashtag block
└── screenshots/
    └── README.md        ← ordered shot list with filenames, artifacts, and viewports
```

Week 2 folders (`04`–`09`) follow the same shape, scaled to the channel they're for: Operator posts include `substack.md` + `linkedin.md` + (where applicable) `medium.md`; Medium posts include `medium.md` + `linkedin.md` cross-promo. All folders include `meta.md` + `hashtags.txt`.

---

## Publish Workflow

### LinkedIn
1. Open `linkedin.md`.
2. Copy the entire body (exclude the YAML front matter at the top if present).
3. Paste into a new LinkedIn post.
4. Attach the hero screenshot from `screenshots/` as the first image, then any supporting shots the platform allows.
5. Add the hashtags from `hashtags.txt` at the end of the post (or the first comment).
6. Schedule or post immediately.

### Medium
1. Open `medium.md`.
2. In Medium's editor, create a new story.
3. Set the title and subtitle from `meta.md`.
4. Paste the body, then replace each `[IMAGE: filename — caption]` placeholder with the corresponding image from `screenshots/`.
5. Set the canonical URL from `meta.md` → **Story settings → SEO settings → Canonical link**.
6. Add the tags from `meta.md` → **Story settings → Tags**.
7. Publish or schedule.

### Substack
1. Open `substack.md` (or use `substack-template.md` for new issues).
2. In Substack's composer, create a new post.
3. Set the **subject line** from the top of `substack.md`.
4. Set the **preheader** (preview text) from the second line.
5. Paste the body, replacing image placeholders with the corresponding files from `screenshots/`.
6. Add the CTA button/link from the close of the post.
7. Send or schedule.

### Auto-Publish Pipeline
For automated cross-channel publishing, the Distribution OS publishing routes live at `artifacts/api-server/src/routes/distribution-os/publishing.ts`. Submit a content piece via the API to schedule it across Substack / Medium / LinkedIn from the analytics dashboard at `/szl-holdings/command-newsletter`.

---

## Analytics

The SZL Command analytics dashboard is live at:

- **Path**: `/szl-holdings/command-newsletter` in the SZL Holdings web artifact
- **Source**: `artifacts/szl-holdings/src/pages/command-newsletter.tsx`
- **Tracks**: subscriber growth, open rate, click-through rate, paid conversion, channel referrer mix, per-issue performance

---

## Subscribe Modules

The shared `NewsletterSubscribe` component (`lib/shared-ui/src/newsletter-subscribe.tsx`) is deployed across every portfolio site:

| Site | File | Variant |
|------|------|---------|
| SZL Holdings | `artifacts/szl-holdings/...` | banner |
| Aegis | `artifacts/aegis/src/pages/aegis-home.tsx` | banner |
| Vessels | `artifacts/vessels/src/pages/vessels-landing.tsx` | banner |
| Terra | `artifacts/terra/...` | banner |
| Carlota Jo | `artifacts/carlota-jo/src/pages/Home.tsx` | custom (light cream/gold theme — `SzlCommandSubscribeSection`) |

---

## Screenshots Workflow

Each `screenshots/README.md` lists the exact shot list for that post. The filenames are already defined — just drop your PNGs into the `screenshots/` folder using those exact names. Suggested capture tool: your browser's DevTools device toolbar (set width to 1440px unless the shot list specifies otherwise).

---

## Outbound Links (Consistent Across All Posts)

| Platform | URL |
|----------|-----|
| LinkedIn | https://linkedin.com/in/stephen-l-279315240 |
| GitHub | https://github.com/szl-holdings/szl-holdings-platform |
| GitHub Release (v1.0-standby) | https://github.com/szl-holdings/szl-holdings-platform/releases/tag/v1.0-standby |
| Medium | https://medium.com/@stephen_38454 |
| Substack | https://szlholdings.substack.com |
| Site | https://szlholdings.com |

---

## Release Permalinks

| Tag | URL | Notes |
|-----|-----|-------|
| `v1.0-standby` | https://github.com/szl-holdings/szl-holdings-platform/releases/tag/v1.0-standby | Wave 3 launch standby — 10 deployed artifacts, 700+ tables, 11-role RBAC, 9 schema-validated AI decision types, six load-bearing platform primitives |

## Week 1 Launch Status

The three Week 1 launch posts are loaded into Distribution OS (`/szl-holdings/command-newsletter`) with full bodies, canonical URLs, tags, and scheduled dates. Status as of April 19, 2026:

| # | Post | Thursday Apr 16 (Issue #1) | Sunday Apr 19 (Issue #2) | Monday Apr 20 (Issue #3) |
|---|------|----------------------------|--------------------------|--------------------------|
| LinkedIn | short-form | published (mock) | published (mock) | scheduled |
| Medium | long-form | published (mock) | published (mock) | scheduled (queued) |
| Substack | email | published (mock) | published (mock) | scheduled (ready) |

The "mock" markers reflect that the Distribution OS Substack / Medium / LinkedIn adapters are running in `MOCKED_DEMO_MODE` because `SUBSTACK_API_KEY`, `MEDIUM_INTEGRATION_TOKEN`, and `LINKEDIN_ACCESS_TOKEN` are not configured in this environment. To execute the real external publish, configure those secrets and the same records will hit the live APIs through the existing `/articles/:id/publish-medium`, `/newsletters/:id/publish-substack`, and `/carousels/:id/publish-linkedin` (or the LinkedIn share API) endpoints. The cross-link URLs inside each post body all point at `https://szlholdings.com` and `https://szlholdings.substack.com`, which remain valid when the real permalinks come back.

## Social Permalinks (mock until live OAuth/API keys are configured)

| Channel | Issue / Post | URL |
|---------|--------------|-----|
| Substack | Issue #1 — The accountability gap | https://szlholdings.substack.com/p/the-accountability-gap-is-the-next-enterprise-problem |
| Substack | Issue #2 — Six primitives, not features | https://szlholdings.substack.com/p/six-primitives-not-features |
| Substack | Issue #3 — From signal to proof | _(scheduled — Mon Apr 20)_ |
| LinkedIn | Week 1 Post 1 (short) | https://www.linkedin.com/feed/update/mock_linkedin_01-thursday-intro-accountability-gap |
| LinkedIn | Week 1 Post 2 (short) | https://www.linkedin.com/feed/update/mock_linkedin_02-sunday-six-primitives |
| LinkedIn | Week 1 Post 3 (short) | _(scheduled — Mon Apr 20)_ |
| Medium | Issue #1 — The accountability gap | https://medium.com/@stephen_38454/the-accountability-gap-is-the-next-enterprise-problem-lity-gap |
| Medium | Issue #2 — Six primitives, not features | https://medium.com/@stephen_38454/six-primitives-not-features-rimitives |
| Medium | Issue #3 — From signal to proof | _(scheduled — Mon Apr 20)_ |
| Medium | Aegis defense thesis | _(record after publishing)_ |
| Medium | CORTEX architecture | _(record after publishing)_ |
| Medium | The cross-domain moat | _(record after publishing)_ |
| X / Twitter | Launch announcement thread | _(record after publishing)_ |

When the live publish runs, replace the mock URLs above with the real permalinks returned by the adapters (they're auto-stored in `dos_articles.external_url_medium`, `dos_newsletters.substack_url`, and `dos_publication_urls`).

## Subaccount Status

Per-vertical X / LinkedIn subaccounts (`@aegis`, `@vessels`, `@terra`) — kits ready in folders 07–09 for cross-promotion once accounts are spun up. This is an external action item outside the platform.

---

## Zipping for Distribution

Run `bundle.sh` to produce ready-to-share zip archives for the original Week 1 arc:

```bash
bash content/launch-series/bundle.sh
```

Output: `01-thursday-intro.zip`, `02-sunday-deep-dive.zip`, `03-monday-operator-lens.zip` in the project root.

---

## Voice & Tone Reminders

- Professional, calm, thought-provoking.
- No hype words. No emoji walls.
- Every claim is grounded in something real in the platform.
- The arc is connected — each issue cross-links to the others where relevant.
