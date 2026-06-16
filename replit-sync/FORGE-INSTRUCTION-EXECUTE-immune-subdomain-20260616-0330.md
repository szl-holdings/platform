# FORGE INSTRUCTION — WIRE immune.a11oy.net (subdomain) + verify the immune API surface

Date: 2026-06-16 ET · Founder: Stephen Lutar (full-access green light) · Doctrine v11

## CONTEXT (verified live by founder's session)
The Immune organ (user-visible name **"Immune" / Quechua "Hukulla"** — NEVER sentra/amaru/rosie/jarvis) is REAL: fail-closed deny-by-default packet inspection (signatures + 1MB size guard + λ-gate floor 0.5), backed by Lean `Lutar/Wave11/ImmuneNeymanPearsonOpt.lean` (Neyman-Pearson-optimal egress gate) and `Lutar/Innovations/round11/FrontierWelfordVariance.lean` (Welford anomaly gate). The interactive session has now wired the HONEST API namespace `/api/a11oy/v1/immune/{healthz,status,gates,verdict,feed,threats,verify}` on the a11oy app and the `/immune` page reads it for real.

REMAINING GAP (the only thing left for immune): the **subdomain `immune.a11oy.net` is NXDOMAIN**. Box `a11oy.net` and `killinchu.a11oy.net` both resolve to **167.233.50.75** and are served by **nginx/1.28.3** on the box, routed by Host header (`x-szl-space`). There is NO `*.a11oy.net` wildcard.

## WHAT TO DO (two parts — do the box part; the DNS part is founder-gated)

### PART A — nginx vhost on the box (you can do this on the box shell)
1. SSH/shell into the box (167.233.50.75). Read the existing nginx site that routes `killinchu.a11oy.net` (look in `/etc/nginx/sites-enabled/` and `/etc/nginx/conf.d/`). It uses `server_name killinchu.a11oy.net;` and proxies to the killinchu app upstream, setting `x-szl-space`.
2. Add an analogous `server { server_name immune.a11oy.net; ... }` block that proxies to the SAME a11oy app upstream that serves `a11oy.net`, but with `location / { return 302 /immune; }` OR proxy `/` straight to the a11oy app's `/immune` page (whichever matches how the energy/tawantin paths are reverse-proxied today). Reuse the EXISTING TLS cert path used for `*.a11oy.net` host blocks; if the cert does not cover `immune.a11oy.net`, obtain/extend a Let's Encrypt cert for the new SAN (certbot --nginx -d immune.a11oy.net) AFTER the DNS A record exists (Part B) — do NOT fake a cert.
3. `nginx -t` then `systemctl reload nginx`. Do NOT touch the a11oy/killinchu server blocks.

### PART B — DNS (FOUNDER-GATED — registrar action)
Add a DNS **A record**: `immune  →  167.233.50.75` (TTL 300) at the a11oy.net registrar. Forge CANNOT do this (no registrar creds). If you cannot reach the registrar, report this as an HONEST BLOCKED needing founder action — do NOT claim immune.a11oy.net is live until `dig +short immune.a11oy.net A` returns 167.233.50.75 AND `curl -sI https://immune.a11oy.net/immune` returns 200 with a valid (non-self-signed) cert. While the subdomain is pending, `a11oy.net/immune` is the live surface and IS real.

## PROVE (live curls — narrated-DONE is forbidden)
- `curl -s -o /dev/null -w "%{http_code} %{content_type}" https://a11oy.net/api/a11oy/v1/immune/healthz` → 200 application/json
- `curl -X POST https://a11oy.net/api/a11oy/v1/immune/verdict -H 'content-type: application/json' -d '{"action":{"cmd":"DROP TABLE users"}}'` → decision:deny + real signal + receipt
- After Part A+B: `dig +short immune.a11oy.net A` = 167.233.50.75 AND `curl -sI https://immune.a11oy.net/immune` = 200 valid cert.

## DOCTRINE (never weaken)
locked = EXACTLY 8 {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17; Λ=Conjecture 1; Khipu=Conjecture 2; trust never 100%; SLSA L1/L2/L3-roadmap; effectors simulated; 0 runtime CDN; NO user-visible codenames (immune name is "Immune"/"Hukulla"); never commit a key; never fake a cert or a DNS record. Honest BLOCKED beats fake green.

## REPORT
Write per-task result to AUTO_STATE (key: immune_subdomain) with: nginx block added (yes/no + reload result), DNS state (pending-founder / live), and the live curl outputs. If DNS is founder-gated, send the founder the ONE exact registrar record to add.
