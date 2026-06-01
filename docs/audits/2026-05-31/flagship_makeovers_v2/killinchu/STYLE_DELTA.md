# killinchu — Style Delta

**Front door edited:** `static/index.html`
**Approach:** ADDITIVE — self-contained `<section id="szl-flagship-hero" data-szl-hero-v2="...">`
prepended after `<body>` before the app mount node. Existing content preserved below.

## Tokens (reused — NO new tokens)
From `kanchay/tokens/COLOR_TOKENS.css`: navy `#0a0f1e`, surfaces `#10151c`/`#1b222c`,
border `#3c4757`, text `#f5f7fa`, yuyay teal `#5cc4bf`, hatun gold `#d7b96b`.

## Typography (open-source via Kanchay)
Inter (display) · IBM Plex Sans (body) · JetBrains Mono (metrics). All OFL-licensed.

## Visual changes
- Dense Anduril-style metric strip on LOCKED doctrine numbers (13-axis · 749 decls · 14 axioms ·
  163 sorries · replay hash bacf5443…).
- Defensive aerial-twin replay framing with an explicit, visible legal envelope.
- Gold headline on navy; teal active labels.

## What was NOT touched
- `LEGAL_BOUNDARIES.md` — preserved verbatim.
- HF banner / hero avatars / animated emojis (Space-level).
- No existing CSS modified — hero scoped to `#szl-flagship-hero`.
