# szl-holdings/customer-portal

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Doctrine v11 LOCKED](https://img.shields.io/badge/Doctrine-v11_LOCKED-d4a444.svg)](https://github.com/szl-holdings/lutar-lean)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.19944926.svg)](https://doi.org/10.5281/zenodo.19944926)
[![CI](https://github.com/szl-holdings/customer-portal/actions/workflows/ci.yml/badge.svg)](https://github.com/szl-holdings/customer-portal/actions)
[![Security Policy](https://img.shields.io/badge/Security-Policy-red.svg)](SECURITY.md)


<!-- CII-BEST-PRACTICES-BADGE: PENDING — replace 'PENDING' with the project id once founder registers this repo at https://bestpractices.coreinfrastructure.org/ -->
[![CII Best Practices](https://bestpractices.coreinfrastructure.org/projects/PENDING/badge)](https://bestpractices.coreinfrastructure.org/)

**The commercial surface for SZL Holdings** — sign in, issue API keys, see usage & quotas, and export a Body-of-Evidence bundle of Khipu receipts. Real microservice. **No mock. No bandaid.**

> **Doctrine v11 LOCKED** — 749 / 14 / 163 at kernel commit `c7c0ba17`. Signed **Yachay** (CTO authority), 2026-06-01.

---

## What this is

A standalone FastAPI microservice (deliberately **not** an `a11oy` tab — see [`CUSTOMER_PORTAL_SPEC.md`](#design-docs)) that sits in front of the five SZL flagships and handles the boring-but-load-bearing commercial plumbing:

- **OIDC bearer verification.** Every `/v1` request must carry `Authorization: Bearer <JWT>`. [`app/oidc.py`](app/oidc.py) checks it with PyJWT against the configured issuer's JWKS: the signature (asymmetric algorithms only, `RS256` by default), `iss`, `aud`, `exp` and `iat`, plus `nbf` when present. Only after every check passes is an account looked up or created, keyed by issuer + `sub`. A bad token gets 401. Missing or invalid OIDC settings, or an unreachable JWKS, get 503. In both cases no account row is read or written. The intended issuer is Keycloak under UDS Core; any OIDC provider that publishes a JWKS is handled the same way. **No live issuer has been exercised against this code.** The tests use locally generated keys and a stubbed JWKS.
- **API key issuance** — key format `szl_{env}_{flagship?}_{base62(16)}`. Only an unsalted SHA-256 **hash** of the key is stored; the plaintext is shown exactly once. Each key carries a **cosign-signed fingerprint** (PLACEHOLDER trust — see honest labels).
- **Scopes** — `read` / `write` / `admin`, plus a per-flagship allowlist.
- **Quotas** — `GET /v1/usage` reports an honor-system **soft** quota state by tier, with a `hard_ceiling` state at **10×**. This service only reads the usage counters and reports the state; it doesn't write the counters or reject calls over the ceiling.
- **Khipu receipt on every mutation** — issue and revoke each append a hash-chained `continuum_hash` receipt (`prevHash` → `sha256(json.dumps(sort_keys=True))`).
- **Body-of-Evidence export** — `GET /v1/audit/export` returns the customer's own receipt chain for independent verification.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/healthz` | none | Probe target for the status page |
| `POST` | `/v1/keys` | OIDC JWT | Issue an API key (plaintext returned once) |
| `DELETE` | `/v1/keys/{key_id}` | OIDC JWT | Revoke one of the caller's own keys |
| `POST` | `/v1/keys/{key_id}/rotate` | — | **Not implemented.** It's in the design spec only; `app/app.py` has no such route. |
| `GET` | `/v1/usage` | OIDC JWT | Usage counters + quota state |
| `GET` | `/v1/audit` | OIDC JWT | The caller's own action log |
| `GET` | `/v1/audit/export` | OIDC JWT | Body-of-Evidence bundle of the caller's Khipu receipts |

"OIDC JWT" means a bearer JWT that passed the verification above. Each account sees only its own keys, audit rows and receipts.

## Run it

```bash
pip install -r requirements.txt
python -c "import sqlite3; sqlite3.connect('portal.db').executescript(open('app/schema.sql').read())"
uvicorn app.app:app --port 8088
```

The `/v1` routes need the issuer settings. There are no defaults; without them every `/v1` call answers 503:

```bash
export SZL_PORTAL_OIDC_ISSUER=https://<idp-host>/realms/<realm>          # exact `iss`
export SZL_PORTAL_OIDC_AUDIENCE=<portal-client-id>                         # must appear in `aud`
export SZL_PORTAL_OIDC_JWKS_URL=https://<idp-host>/realms/<realm>/protocol/openid-connect/certs
export SZL_PORTAL_OIDC_ALGORITHMS=RS256                                    # optional; asymmetric only
```

Keycloak puts the portal's client id in `aud` only when the client has an audience mapper.

Then:

```bash
curl -s localhost:8088/healthz
# {"status":"ok","doctrine":"v11","replay_hash":"bacf5443...631fc5"}
```

Tests (offline: locally generated keys, stubbed JWKS, no cosign call). The `customer-portal` job in `.github/workflows/ci.yml` runs them on every pull request.

```bash
pip install -r requirements-dev.txt
python -m pytest tests -q
```

## Files

- [`app/app.py`](app/app.py) — the FastAPI service. [`tests/`](tests) drives it through FastAPI's `TestClient`.
- [`app/oidc.py`](app/oidc.py) — fail-closed bearer JWT verification against the configured JWKS.
- [`app/verify_key.py`](app/verify_key.py) — key authorization (`authorize()`): hash lookup, status, scope, per-flagship allowlist.
- [`app/quota.py`](app/quota.py) — `quota_state()`: soft quota + 10× hard ceiling.
- [`app/schema.sql`](app/schema.sql) — SQLite store (WAL in prod): accounts, api_keys, key_scopes, usage_counters, audit_log, call_receipts.

## Design docs

Full specs live in the org's customer-surface package: `CUSTOMER_PORTAL_SPEC.md`, `API_KEY_SYSTEM.md`, `PRICING_TIERS.md`, `SDK_SPEC_PYTHON_TS.md`, `PUBLIC_DOCS_SITE.md`, `STATUS_PAGE.md`, `OPENAPI_SPECS_PER_FLAGSHIP.md`, `EXAMPLES_GALLERY.md`, `EXAMPLE_INTEGRATIONS.md`, `GREENE_PERSONA_FLOW.md`.

## Honest labels (we count them out loud)

- **Λ uniqueness is a Conjecture**, not a closed theorem (open `CAUCHY_ND` sorry + missing symmetry axiom).
- The **Khipu receipt signature is a cosign / DSSE PLACEHOLDER**. `chain_verified` verifies the **hash chain only**, not the signature, until Sigstore/Rekor lands.
- **SLSA = L1 (honest).** "SLSA L3" is banned.
- **OIDC is verified in code, not in a deployment.** No issuer, audience or JWKS URL is configured anywhere in this repo, and no workflow builds or deploys this service. A `portal.db` written before this check existed bound accounts to unverified bearer text; discard it rather than reuse it.
- **Wire D** (cross-mesh `traceparent`) is **in-process only**.
- **Historical locked snapshot** (do not reuse as a current claim): **749 declarations / 14 unique axioms (15 raw, 1 duplicate) / 163 sorries (112 baseline + 51 legacy challenge-set)** at `lutar-v18.0.0` / `c7c0ba17`; 13-axis `yuyay_v3` conjunctive AND; replay hash `bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5`.

---

<sub>© 2026 SZL Holdings · Apache-2.0 · Doctrine v11 LOCKED (749/14/163) · Signed Yachay — No mysticism. No bandaid.</sub>

## SZL Holdings

![SZL Holdings](./branding/szl-avatar-animated.gif)

*Amaru — the Inca avatar of SZL Holdings. Animated mark (400×400, 16fps loop). Signed Yachay.*
