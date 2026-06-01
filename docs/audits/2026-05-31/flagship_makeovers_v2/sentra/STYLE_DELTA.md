# sentra — Style Delta

**Front door edited:** `landing/index.html` (the real `/` front door per `serve.py STATIC_DIR=/app/landing`).
Console page (`console/index.html`) also carries the hero from the first push — both additive.
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
- Continuous-assurance framing (Anthropic idiom) in the sub-head.
- Breathing teal pulse element; gold headline on navy.

## What was NOT touched
- HF banner / hero avatars / animated emojis (Space-level).
- IP-HOLD PR **sentra#45**.
- No existing CSS modified — hero scoped to `#szl-flagship-hero`.
