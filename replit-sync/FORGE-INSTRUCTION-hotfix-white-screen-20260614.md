# SZL Forge — ORDER (P0 HOTFIX): a11oy.net "/" is a WHITE SCREEN — restore the landing page

**Verified bug (probed live, headless-rendered):** `https://a11oy.net/` returns an 83-byte stub whose
ONLY content is `<script src="/vendor/a11oy-operator-widget.js" data-surface="a11oy" defer></script>`.
The Chaski operator widget loads (200, 35KB) and renders a tiny floating bubble bottom-right, but there
is NO landing page around it -> the user sees a BLANK WHITE PAGE with only a "CHASKI" bubble. The real
app is fine at `https://a11oy.net/console` (200, 1.55MB SPA). The HF Space root is the SAME 83-byte stub,
so this shipped from main — NOT a stale box. The Chaski widget is a floating HELPER, never the page body.

## ROOT CAUSE TO CONFIRM
The route/handler (or static index) for "/" was replaced by the operator-widget loader and lost the real
landing HTML (the page skeleton / SPA mount the widget is supposed to overlay). Find where "/" is served
(serve.py root route OR the static index.html) and why it now emits only the 83-byte widget tag.

## FIX (pick the correct one for how "/" is actually served)
- If "/" should be the SPA: serve the real index/landing HTML at "/" (same content as /console's shell, or
  the prior homepage), and KEEP the operator-widget script tag as an OVERLAY inside that full page.
- OR, if "/" is intended to be the operator surface only: it must still render a real page body
  (hero + nav + the .aow-root mounted into a styled full-height layout), not an empty document.
- Simplest correct interim: make "/" serve the same shell as `/console` (which works), with the Chaski
  widget layered on top. Do NOT leave "/" as a bare 83-byte script tag.

## GATE (PROVE-OR-DOWNGRADE — mark DONE only if BOTH pass; paste the output)
```bash
# 1) root must return a real page (not ~83 bytes) with a visible body:
curl -s -o /tmp/r.html -w 'root: HTTP %{http_code} | %{size_download} bytes\n' https://a11oy.net/
#    PASS = clearly > 1KB and contains real landing markup (a root/app container, nav, or hero), not just the script tag.
# 2) headless render shows visible content (not blank):
#    confirm document.body.innerText is non-empty and there is a full-height layout, not only the 56px bubble.
```
If you cannot safely restore it this pass, mark **BLOCKED** with the exact file/route at fault — do NOT
ship a fake "fixed". Apply the same fix to the box AND the HF Space (both serve the 83-byte stub).

## DOCTRINE v11
No fabricated DONE. Clean-room. 0 runtime CDN (the widget is already vendored — keep it). Honest fallback.
Never commit a key. Λ = Conjecture 1.

— Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com> · Doctrine v11 LOCKED
