# SZL Forge — ORDER (P0 HOTFIX, ROOT-CAUSED): a11oy.net "/" white screen = STALE /app/cathedral.html

**ROOT CAUSE (now pinned down — verified):** The `/` handler in serve.py returns
`FileResponse(Path("/app/cathedral.html"))`. The REPO `cathedral.html` is the correct 142,486-byte hero
(both in szl-holdings/a11oy main AND in the SZLHOLDINGS/a11oy Space repo — confirmed 142486 bytes raw).
BUT the live box AND the live Space serve only ~83 bytes at `/` (just the operator-widget tag the
injector appends to an essentially-EMPTY body). => the BUILT IMAGE's `/app/cathedral.html` is STALE/empty.
The operator-widget injector is innocent (additive-only, verified). `/console` works (1.5MB). This is a
STALE-DEPLOY bug, NOT a code bug.

## FIX = rebuild /app from current main on BOTH surfaces
### Box (167.233.50.75) — only you can do this:
```bash
cd "$(for d in /opt/a11oy /srv/a11oy /root/a11oy /home/*/a11oy; do [ -d "$d/.git" ] && echo "$d" && break; done)"
git fetch --all && git reset --hard origin/main
# rebuild the image so /app/cathedral.html = the real 142KB file (no docker-cp bandaid):
docker compose build --no-cache a11oy && docker compose up -d a11oy   || sudo systemctl restart a11oy.service
sleep 8
curl -s -o /dev/null -w 'box / size: %{size_download} bytes (want >100000)\n' http://127.0.0.1:8081/
```
### HF Space — factory rebuild (CTO already triggered forge-hf-activate run 27495202325; verify it took):
```bash
curl -s -o /dev/null -w 'HF / size: %{size_download} bytes (want >100000)\n' https://szlholdings-a11oy.hf.space/
```

## GATE (PROVE-OR-DOWNGRADE — DONE only if BOTH > 100KB and render visible)
```bash
for h in https://a11oy.net https://szlholdings-a11oy.hf.space; do
  echo "$h/ -> $(curl -s -o /dev/null -w '%{http_code} %{size_download}b' $h/)"
done   # PASS = 200 and ~142KB, NOT 83 bytes
```
If the build still serves 83 bytes, the COPY of cathedral.html into /app is failing — check the Dockerfile
COPY line (it IS listed) and that the file isn't being overwritten by a later step. Mark BLOCKED with the
exact build step if so. Never ship a fake fix.

## DOCTRINE v11 — no fabricated DONE; clean-room; 0 CDN; never commit a key; Λ = Conjecture 1.
— Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
