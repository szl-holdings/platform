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

- **OIDC sign-in** via Keycloak under UDS Core (open source; no proprietary IdP lock-in). Cloud tenants may front with Auth0 / Clerk / PropelAuth — the portal only trusts a verified OIDC `sub`.
- **API key issuance** — key format `szl_{env}_{flagship?}_{base62(16)}`. Only a salted SHA-256 **hash** is stored; the plaintext is shown exactly once. Each key carries a **cosign-signed fingerprint** (PLACEHOLDER trust — see honest labels).
- **Scopes** — `read` / `write` / `admin`, plus a per-flagship allowlist.
- **Quotas** — honor-system **soft** quota by tier with a **10× hard ceiling** that fails closed.
- **Khipu receipt on every mutation** — issue / revoke / rotate / export each append a hash-chained `continuum_hash` receipt (`prevHash` → `sha256(json.dumps(sort_keys=True))`).
- **Body-of-Evidence export** — `GET /v1/audit/export` returns the customer's own receipt chain for independent verification.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/healthz` | none | Probe target for the status page |
| `POST` | `/v1/keys` | OIDC | Issue an API key (plaintext returned once) |
| `DELETE` | `/v1/keys/{key_id}` | OIDC | Revoke a key |
| `POST` | `/v1/keys/{key_id}/rotate` | OIDC | Rotate with a 7-day grace window |
| `GET` | `/v1/usage` | OIDC | Usage counters + quota state |
| `GET` | `/v1/audit` | OIDC | The caller's own action log |
| `GET` | `/v1/audit/export` | OIDC | Body-of-Evidence bundle of Khipu receipts |

## Run it

```bash
pip install -r requirements.txt
python -c "import sqlite3; sqlite3.connect('portal.db').executescript(open('app/schema.sql').read())"
uvicorn app.app:app --port 8088
```

Then:

```bash
curl -s localhost:8088/healthz
# {"status":"ok","doctrine":"v11","replay_hash":"bacf5443...631fc5"}
```

## Files

- [`app/app.py`](app/app.py) — the FastAPI service (tested end-to-end via `TestClient`).
- [`app/verify_key.py`](app/verify_key.py) — key authorization (`authorize()`): hash lookup, status, scope, per-flagship allowlist.
- [`app/quota.py`](app/quota.py) — `quota_state()`: soft quota + 10× hard ceiling.
- [`app/schema.sql`](app/schema.sql) — SQLite store (WAL in prod): accounts, api_keys, key_scopes, usage_counters, audit_log, call_receipts.

## Design docs

Full specs live in the org's customer-surface package: `CUSTOMER_PORTAL_SPEC.md`, `API_KEY_SYSTEM.md`, `PRICING_TIERS.md`, `SDK_SPEC_PYTHON_TS.md`, `PUBLIC_DOCS_SITE.md`, `STATUS_PAGE.md`, `OPENAPI_SPECS_PER_FLAGSHIP.md`, `EXAMPLES_GALLERY.md`, `EXAMPLE_INTEGRATIONS.md`, `GREENE_PERSONA_FLOW.md`.

## Honest labels (we count them out loud)

- **Λ uniqueness is a Conjecture**, not a closed theorem (open `CAUCHY_ND` sorry + missing symmetry axiom).
- The **Khipu receipt signature is a cosign / DSSE PLACEHOLDER**. `chain_verified` verifies the **hash chain only**, not the signature, until Sigstore/Rekor lands.
- **SLSA = L1 (honest).** "SLSA L3" is banned.
- **Wire D** (cross-mesh `traceparent`) is **in-process only**.
- **Historical locked snapshot** (do not reuse as a current claim): **749 declarations / 14 unique axioms (15 raw, 1 duplicate) / 163 sorries (112 baseline + 51 legacy challenge-set)** at `lutar-v18.0.0` / `c7c0ba17`; 13-axis `yuyay_v3` conjunctive AND; replay hash `bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5`.

---

<sub>© 2026 SZL Holdings · Apache-2.0 · Doctrine v11 LOCKED (749/14/163) · Signed Yachay — No mysticism. No bandaid.</sub>

## SZL Holdings

![SZL Holdings](./branding/szl-avatar-animated.gif)

*Amaru — the Inca avatar of SZL Holdings. Animated mark (400×400, 16fps loop). Signed Yachay.*
