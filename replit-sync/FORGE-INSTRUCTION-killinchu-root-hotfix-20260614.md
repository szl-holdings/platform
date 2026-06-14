# SZL Forge — ORDER (P0 HOTFIX): killinchu "/" white screen — broken root redirect

**Verified live:** https://szlholdings-killinchu.hf.space/ returns a 307/405 with a 0-BYTE body
(white screen). The app is HEALTHY: /elite = 200 (1.2MB, the real homepage), /console = 200,
/elite/mesh = 200, /proven = 200, /index.html = 200. The bare root just fails to forward cleanly.

## FIX
The "/" route either issues a redirect the browser can't follow (405 method / no body) or is missing.
Make "/" serve the real landing directly OR issue a clean 200/308 to /elite:
- Find the root route in killinchu's serve layer (FastAPI/Starlette or static index).
- Either: return the /elite page content at "/" (best — no redirect), OR return a proper
  RedirectResponse(url="/elite", status_code=308) that browsers follow with a body.
- A bare 307 to a 405/empty target = the bug. It must end at a real 200 HTML page.

## GATE (prove-or-downgrade)
```bash
curl -s -L -o /dev/null -w 'root follows to: %{http_code} %{size_download}b %{url_effective}\n' https://szlholdings-killinchu.hf.space/
# PASS = final 200 with a real page (>10KB), reached cleanly from the bare domain.
```
Apply to box AND HF Space if both serve it. Never ship a fake fix; mark BLOCKED with the exact route if stuck.

## DOCTRINE v11 — no fabricated DONE; clean-room; 0 CDN; never commit a key; Λ = Conjecture 1.
— Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
