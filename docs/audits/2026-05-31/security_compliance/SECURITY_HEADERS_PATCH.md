# SECURITY_HEADERS_PATCH.md — per‑Space header hardening

**Author:** Yachay (CTO authority) · **Date:** 2026-06-01 · **Doctrine v11 LOCKED (749/14/163).**
**Problem (confirmed from source):** every FastAPI Space sets `allow_origins=["*"]` and **no** security headers; static Spaces have none either. **Fix:** locked CORS + CSP/HSTS/X‑Frame‑Options/X‑Content‑Type‑Options/Referrer‑Policy/Permissions‑Policy on every Space. **HfApi push only — never GitHub Actions `secrets.HF_TOKEN`.** ADDITIVE only.

---

## 1. Current vs target (per Space)

| Space | SDK | Current | Target |
|---|---|---|---|
| a11oy | docker | `allow_origins=["*"]`, no headers | locked CORS allowlist + full header set |
| amaru | docker | `allow_origins=["*"]`, no headers | locked CORS + headers |
| sentra | docker | `allow_origins=["*"]`, no headers | locked CORS + headers (fail‑closed verdicts) |
| vessels | docker | `allow_origins=["*"]`, no headers, **Mapbox token leak** | locked CORS + headers + **proxy Mapbox server‑side** |
| rosie | docker | no explicit CORS in snapshot, no headers | locked CORS + **strict CSP** (XSS‑critical console) + SSO before prod |
| anatomy-3d | static | none | `_headers` (CSP allows three.js CDN) |
| uds-demo | static | none | `_headers` |
| README | static | none | `_headers` |

## 2. Header set shipped (the patch)

Provided as drop‑in files in `patches/`:
- **`szl_security_headers.py`** — ASGI middleware + `install_security(app, allowed_origins=[...])` that (a) replaces wildcard CORS with an allowlist and (b) appends the headers below. Validated to parse.
- **`_headers.static`** — `_headers` file for static Spaces (rename to `_headers` at web root; mirror as `<meta http-equiv>` CSP in `index.html` for platforms that ignore `_headers`).
- **`push_security_headers_hfapi.py`** — HfApi‑direct push (DRY‑RUN by default; `APPLY=1` to push). Token from `.secret/hf_token`.

| Header | Value | Defends against |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'; … frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests` | XSS, injection, clickjacking |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | TLS downgrade |
| `X-Frame-Options` | `DENY` | clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | referrer leakage |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=(), usb=(), payment=()` | feature abuse |
| `Cross-Origin-Opener-Policy` | `same-origin` | XS‑leaks |
| `Cross-Origin-Resource-Policy` | `same-origin` | cross‑origin resource theft |

## 3. Per‑Space CORS allowlist (replace `["*"]`)

```python
ALLOW = [
  "https://szlholdings-a11oy.hf.space",
  "https://szlholdings-amaru.hf.space",
  "https://szlholdings-sentra.hf.space",
  "https://szlholdings-vessels.hf.space",
  "https://szlholdings-rosie.hf.space",
  "https://szlholdings.github.io",          # org pages
]
install_security(app, allowed_origins=ALLOW)
```
- **a11oy**: include sibling Spaces (rosie mirrors `/v1/*`).
- **vessels**: add Mapbox tile origins to `img-src`/`connect-src` in the CSP **and remove** `/api/config/mapbox-token` returning the raw token — proxy tiles server‑side instead.
- **rosie**: add brain‑jack mesh WebSocket origins to `connect-src`; keep CSP strict (this is the XSS‑critical surface); add Keycloak SSO before production.
- **sentra**: keep fail‑closed verdict semantics independent of CORS.

## 4. How to apply (per Space, HfApi only)

**Docker Spaces:**
1. `python3 patches/push_security_headers_hfapi.py` (dry‑run) → review.
2. `APPLY=1 python3 patches/push_security_headers_hfapi.py` → uploads `szl_security_headers.py`.
3. Edit each `serve.py`: delete the `allow_origins=["*"]` CORS block, add `from szl_security_headers import install_security` + `install_security(app, allowed_origins=ALLOW)`.
4. Push the edited `serve.py` via `HfApi.upload_file`. Space rebuilds.

**Static Spaces:** upload `patches/_headers.static` as `_headers` (and add `<meta http-equiv="Content-Security-Policy" …>` to `index.html`).

## 5. Verify

```bash
for s in a11oy amaru sentra vessels rosie anatomy-3d uds-demo; do
  echo "== $s ==" ;
  curl -sI "https://szlholdings-$s.hf.space/" \
    | grep -iE "content-security|strict-transport|x-frame|x-content-type|referrer-policy|permissions-policy|access-control-allow-origin"
done
```
**Pass:** all six headers present; `Access-Control-Allow-Origin` echoes an allowlisted origin (not `*`); Mapbox token endpoint no longer returns a token.

> Online graders to confirm post‑deploy: [securityheaders.com](https://securityheaders.com) and [Mozilla Observatory](https://observatory.mozilla.org/). Target grade A.

---

## Sources
- OWASP Secure Headers Project: <https://owasp.org/www-project-secure-headers/>
- MDN CSP: <https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP> · HSTS: <https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security>
- Internal source files: `raw/a11oy_serve_LIVE.py`, `raw/{amaru,sentra}_serve.py`, `raw/vessels_main.py`.

*— Yachay, 2026-06-01. Patches in `patches/`. HfApi push only.*
