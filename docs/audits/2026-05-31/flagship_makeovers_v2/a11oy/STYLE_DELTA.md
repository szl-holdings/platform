# a11oy — Style Delta

**Front door edited:** `console/index.html`
**Approach:** ADDITIVE — a self-contained `<section id="szl-flagship-hero" data-szl-hero-v2="...">`
prepended immediately after `<body>` and before `#root`. React mounts on `#root` and preserves
sibling DOM, so the existing SPA renders untouched below the new hero.

## Tokens (reused — NO new tokens created)
Sourced from `kanchay/tokens/COLOR_TOKENS.css`:
- navy background `#0a0f1e`, surfaces `#10151c` / `#1b222c`, border `#3c4757`, text `#f5f7fa`
- yuyay teal `#5cc4bf` (accent), hatun gold `#d7b96b` (display), yawar red (reserved for alerts)

## Typography (open-source only, via Kanchay)
- Display / headline: Inter
- Body / labels: IBM Plex Sans
- Metrics / mono numerals: JetBrains Mono
All OFL-licensed (see `kanchay/fonts/LICENSES.md`). No proprietary fonts.

## Visual changes
- Dense Anduril-style metric strip using LOCKED doctrine numbers
  (13-axis reasoning · 749 decls · 14 axioms · 163 sorries · replay hash bacf5443…).
- Anthropic-style "visible constitution" framing in the sub-head.
- Gold headline accent on navy; teal for live/active labels.

## What was NOT touched
- HF Space banner, hero avatars, animated emojis (Space-level) — untouched per hard rule.
- IP-HOLD PR a11oy#57 — untouched.
- No existing CSS files modified; all hero styles are inline-scoped to `#szl-flagship-hero`.
