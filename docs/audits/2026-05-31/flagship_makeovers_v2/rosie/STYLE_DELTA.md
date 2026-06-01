# rosie — Style Delta

**Front door:** `app.py` (Gradio app). The hero is injected as a `gr.HTML(r"""...""")` block as the
**first child of `gr.Blocks`**, so it renders above the fold with the full operator console
(Span Explorer, Receipt Verifier, Mesh Health, Doctrine Sweep, Live Formulas, …) preserved below.
**Approach:** ADDITIVE — Gradio component prepend; no existing component removed.

## Tokens (reused — NO new tokens)
From `kanchay/tokens/COLOR_TOKENS.css`: navy `#0a0f1e`, surfaces `#10151c`/`#1b222c`,
border `#3c4757`, text `#f5f7fa`, yuyay teal `#5cc4bf`, hatun gold `#d7b96b`.

## Typography (open-source via Kanchay)
Inter (display) · IBM Plex Sans (body) · JetBrains Mono (metrics). All OFL-licensed.

## Visual changes (confirmed on live screenshot)
- Headline: "The care-engine copilot you can audit." (gold accent on navy).
- Sub-head: preview / confirm / replay framing — "Constitutional transparency in the Anthropic
  tradition, fused signals in the Lattice tradition."
- Dense metric strip: **13 axis** REASONING · **749 decls** KERNEL · **preview every** ACTION ·
  **replayable by** HASH · **100% green** ROUTES.
- CTAs: "Open Rosie" (gold) · "Anatomy 3D".
- Frontier line: "Breathing organ pulse — live anatomy heartbeat that maps reasoning to the body ·
  governed loop GREEN · additive deploy · sign: Yachay."

## What was NOT touched
- HF banner / hero avatars / animated emojis (Space-level).
- Existing Gradio tabs/components preserved.
- No new tokens; open-source fonts only.
