# SZL Holdings — Launch Series

Three posts. One arc. Everything you need to copy, paste, and publish.

---

## Drop Order

| # | Folder | Day | Title |
|---|--------|-----|-------|
| 1 | `01-thursday-intro/` | Thursday, April 16 | The accountability gap is the next enterprise problem |
| 2 | `02-sunday-deep-dive/` | Sunday, April 19 | Six primitives, not features |
| 3 | `03-monday-operator-lens/` | Monday, April 20 | From signal to proof: a day inside a governed decision |

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
1. Open `substack.md`.
2. In Substack's composer, create a new post.
3. Set the **subject line** from the top of `substack.md`.
4. Set the **preheader** (preview text) from the second line.
5. Paste the body, replacing image placeholders with the corresponding files from `screenshots/`.
6. Add the CTA button/link from the close of the post.
7. Send or schedule.

---

## Screenshots Workflow

Each `screenshots/README.md` lists the exact shot list for that post. The filenames are already defined — just drop your PNGs into the `screenshots/` folder using those exact names.

Suggested capture tool: your browser's DevTools device toolbar (set width to 1440px unless the shot list specifies otherwise).

---

## Outbound Links (Consistent Across All Posts)

| Platform | URL |
|----------|-----|
| LinkedIn | https://linkedin.com/in/stephen-l-279315240 |
| GitHub | https://github.com/stephenlutar2-hash/szl-holdings-platform |
| Medium | https://medium.com/@stephen_38454 |
| Substack | https://szlholdings.substack.com |
| Site | https://szlholdings.com |

---

## Zipping for Distribution

Run `bundle.sh` to produce three ready-to-share zip archives:

```bash
bash content/launch-series/bundle.sh
```

Output: `01-thursday-intro.zip`, `02-sunday-deep-dive.zip`, `03-monday-operator-lens.zip` in the project root.

---

## Voice & Tone Reminders

- Professional, calm, thought-provoking.
- No hype words. No emoji walls.
- Every claim is grounded in something real in the platform.
- The three posts are a connected arc — each one cross-links to the others where relevant.
