# FORGE REPORT — immune.a-11-oy.com: nginx+app READY, DNS BLOCKED (founder action)

**When:** 2026-06-16 ~05:00Z · **By:** Forge (Replit session, founder-authorized via GO.txt 04:38 ET)
**Order:** AUTO_STATE 609bab40 / NEXT_ORDER.md — drive actionable[] to done. Verify-live, no blind-race; honest BLOCKED beats fake green.

## Verified status (live curl proofs)

### (1) HF Space factory-rebuild — ✅ DONE / LIVE
- `curl https://szlholdings-a11oy.hf.space/materials` → **200 text/html**, `<title>Materials — Verifiable Alloy & Crystal Discovery …`
- `curl https://szlholdings-a11oy.hf.space/immune` → **200 text/html**, `<title>Immune (Hukulla) — fail-closed egress gate …`

### (3) Box auto-deploying main — ✅ LIVE (box current with HEAD)
- `curl https://a-11-oy.com/materials` → **200** ("Verifiable Alloy")
- `curl https://a-11-oy.com/immune` → **200** ("Immune (Hukulla)")
- box `a-11-oy.com/healthz` → 200

### (2) Wire immune.a-11-oy.com — ⛔ BLOCKED on DNS only (everything else ready)
On box `167.233.50.75`:
- **nginx vhost: DONE** — `/etc/nginx/sites-available/immune` enabled, `server_name immune.a-11-oy.com`, proxies `127.0.0.1:7864`, `nginx -t` OK.
- **immune app: UP** — docker `immune` container `Up`, `127.0.0.1:7864` → 200; nginx routes it locally over HTTP: `curl -H "Host: immune.a-11-oy.com" http://127.0.0.1/` → **200**, `<title>IMMUNE — Investor Demo</title>`.
- **TLS: NOT YET** — the `a-11-oy.com` cert is a SAN cert (`a-11-oy.com, www.a-11-oy.com, killinchu.a-11-oy.com, elite.a-11-oy.com`), **not** a wildcard, so `immune` is not covered. certbot can't run until DNS resolves (HTTP-01).
- **DNS A-record: BLOCKED** — `immune.a-11-oy.com` does not resolve (`Name or service not known`). The Namecheap API rejected the call:
  - `namecheap.domains.dns.getHosts` → **Status=ERROR, 1011102 "API Key is invalid or API access has not been enabled"** (calling IP `136.114.58.66`).
  - i.e. the API key available to Forge is invalid / API access not enabled on the account → I **cannot** add the record programmatically and will **not** fake a DNS/cert.

## GREEN LIGHT — founder action needed (2 steps, ~5 min + propagation)

**Step 1 — add the DNS record** (Namecheap, domain `a-11-oy.com`, BasicDNS):
```
Type=A Record   Host=immune   Value=167.233.50.75   TTL=300 (5 min)
```
Do it in the Namecheap dashboard, **or** enable API access + whitelist the calling IP and Forge will add it. Verify: `dig +short immune.a-11-oy.com A` == `167.233.50.75`.

**Step 2 — issue TLS (on the box, after DNS resolves)** — adds `immune` to the existing SAN cert and injects the 443 block into the immune vhost:
```
certbot --nginx --expand --cert-name a-11-oy.com \
  -d a-11-oy.com -d www.a-11-oy.com -d killinchu.a-11-oy.com -d elite.a-11-oy.com -d immune.a-11-oy.com
nginx -t && systemctl reload nginx
```

**PROVE done:** `curl -sI https://immune.a-11-oy.com/` → 200 with a valid (non-self-signed) cert.

Nothing else is outstanding — the app, the container, the nginx vhost, and HTTP routing are all already in place. The single gate is the registrar DNS record (founder-side).

— Forge
