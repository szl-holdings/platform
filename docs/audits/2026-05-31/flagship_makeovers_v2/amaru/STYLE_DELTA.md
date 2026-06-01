# amaru — Style Delta

**Front door edited:** `static/index.html`
**Approach:** ADDITIVE — self-contained `<section id="szl-flagship-hero" data-szl-hero-v2="...">`
prepended after `<body>` before `#root`. Existing front-door content preserved below.

## Tokens (reused — NO new tokens)
From `kanchay/tokens/COLOR_TOKENS.css`: navy `#0a0f1e`, surfaces `#10151c`/`#1b222c`,
border `#3c4757`, text `#f5f7fa`, yuyay teal `#5cc4bf`, hatun gold `#d7b96b`, yawar red (alerts).

## Typography (open-source via Kanchay)
Inter (display) · IBM Plex Sans (body) · JetBrains Mono (metrics). All OFL-licensed.

## Visual changes
- Dense Anduril-style metric strip on LOCKED doctrine numbers (13-axis · 749 decls · 14 axioms ·
  163 sorries · replay hash bacf5443…).
- Threat-fusion framing in the sub-head with Anthropic-style provenance language.
- Gold headline on navy; teal active labels; yawar reserved for alert states only.

## What was NOT touched
- HF banner / hero avatars / animated emojis (Space-level).
- IP-HOLD PR **amaru#46**.
- No existing CSS modified — hero styles scoped to `#szl-flagship-hero`.
