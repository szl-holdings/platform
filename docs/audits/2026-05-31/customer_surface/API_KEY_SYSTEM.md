# API_KEY_SYSTEM — issuance, scopes, rotation, cosign-signed tamper-evident keys

**Layer:** PURIQ v12 customer surface · **Author:** Yachay (CTO authority) · **Date:** 2026-06-01
**Status discipline (Doctrine v12 / v11 LOCKED):** spec + patch. v11 LOCKED numbers preserved verbatim
(749 / 14 / 163 / 13-axis `yuyay_v3` / replay hash `bacf5443…631fc5` / `lutar-v18.0.0` @ `c7c0ba17`).
SLSA = **L1 (honest)**. Khipu/cosign signing is wired here as a **real but PLACEHOLDER-trust** path: the
key fingerprint is cosign-signed for tamper-evidence, but the platform does not yet claim Sigstore
transparency-log inclusion (that lands with the broader Sigstore CI work, Doctrine v12 §2).

---

## 0 — Design principles

1. **Honor system + Khipu receipts.** Quotas are *not* enforced by a hard paywall mid-request; they are
   metered and reconciled. Every API call writes a Khipu receipt; usage = a sum over receipts. This is
   the same honesty posture as the Lean sorry-counting: we count out loud, we do not silently block.
   Over-quota use generates an `over_quota` flag on receipts and a soft 402 advisory, not a hard kill,
   until a tier's *hard ceiling* (10× the soft quota) is reached — then 429.
2. **Tamper-evident, not bearer-only.** A raw bearer key is forgeable if leaked. We add a **cosign
   signature over the key fingerprint** so the server can verify a key was minted by SZL's offline
   signing key, and so an auditor (Greene-grade) can verify the key-issuance event independently.
3. **Least privilege by scope AND by flagship.** A key carries both an action scope
   (`read` / `write` / `admin`) and a per-flagship allowlist (`a11oy` / `amaru` / `sentra` / `killinchu`
   / `rosie`). Enforcement is server-side, derived from the OpenAPI path's `operationId` verb class.
4. **Revocation is instant and receipted.** Revoke writes a Khipu receipt and flips `status` to
   `revoked`; the next verification fails closed.

---

## 1 — Key format

```
szl_{env}_{flagship?}_{base62(16 bytes)}
       │        │            └─ 128-bit random, base62 (~22 chars)
       │        └─ optional single-flagship binding: a11oy|amaru|sentra|killinchu|rosie
       │           (omitted = multi-flagship key; allowlist lives in DB scopes)
       └─ env: live | test
```

Examples:
- `szl_live_d8Kf9...` — multi-flagship live key (allowlist in DB)
- `szl_live_killinchu_Q2m7...` — live key hard-bound to killinchu only
- `szl_test_4Hh1...` — sandbox key (no billing, no real fleet data)

**What the server stores:** never the raw key. We store `sha256(raw_key)` as `key_hash` plus the
**cosign signature** over the *fingerprint* `fp = sha256(raw_key)[:16]`. The raw key is shown to the
user exactly once at issuance.

---

## 2 — cosign signing for tamper-evident keys (real, PLACEHOLDER-trust)

cosign signs **blobs** with a keypair; we use an offline SZL key-issuance key (`szl-keymint.key`,
kept out of any repo / in a KMS in prod). At issuance:

```bash
# offline signing box (NEVER in CI / GitHub Actions)
printf '%s' "$FP" > fp.txt              # FP = sha256(raw_key)[:16]
cosign sign-blob --key szl-keymint.key fp.txt --output-signature fp.sig --yes
# store base64(fp.sig) in api_keys.cosign_sig, and szl-keymint.pub ships in the SDK + docs
```

Verification on each request (server side):

```python
# verify_key.py — runs on every authenticated request (no mock)
import hashlib, base64, subprocess, tempfile, os
def verify_key(raw_key: str, row) -> bool:
    if hashlib.sha256(raw_key.encode()).hexdigest() != row["key_hash"]:
        return False                      # wrong key
    if row["status"] != "active":
        return False                      # revoked / expired -> fail closed
    fp = hashlib.sha256(raw_key.encode()).hexdigest()[:16]
    with tempfile.NamedTemporaryFile("w", delete=False) as f:
        f.write(fp); fp_path = f.name
    sig_path = fp_path + ".sig"
    with open(sig_path, "wb") as s:
        s.write(base64.b64decode(row["cosign_sig"]))
    ok = subprocess.run(
        ["cosign", "verify-blob", "--key", "szl-keymint.pub",
         "--signature", sig_path, fp_path],
        capture_output=True).returncode == 0
    os.unlink(fp_path); os.unlink(sig_path)
    return ok
```

**Honest label:** this proves *minting integrity* (the key was issued by SZL and its fingerprint was not
altered). It does **not** yet provide Sigstore Rekor transparency-log inclusion — that is the same
PLACEHOLDER boundary as the Khipu receipt signature. Disclosed, not hidden.
([cosign sign-blob / verify-blob docs](https://docs.sigstore.dev/cosign/signing/signing_with_blobs/).)

---

## 3 — SQLite schema (real DDL, ships in customer-portal)

```sql
-- schema.sql — SZL customer-portal API key store (SQLite, WAL mode in prod)
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE accounts (
    account_id   TEXT PRIMARY KEY,            -- uuid
    email        TEXT NOT NULL UNIQUE,
    oauth_sub    TEXT NOT NULL UNIQUE,        -- OIDC subject from Keycloak/auth provider
    tier         TEXT NOT NULL DEFAULT 'demo' -- demo|builder|professional|enterprise|dod_ic
                 CHECK (tier IN ('demo','builder','professional','enterprise','dod_ic')),
    greene_network INTEGER NOT NULL DEFAULT 0,-- 1 = qualifies for free Demo (academic/hackathon/Greene)
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended'))
);

CREATE TABLE api_keys (
    key_id       TEXT PRIMARY KEY,            -- uuid; safe to show in dashboard
    account_id   TEXT NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    name         TEXT NOT NULL,               -- user label e.g. "ci-bot"
    key_hash     TEXT NOT NULL UNIQUE,        -- sha256(raw_key) hexdigest; raw never stored
    fingerprint  TEXT NOT NULL,               -- sha256(raw_key)[:16], cosign-signed
    cosign_sig   TEXT NOT NULL,               -- base64 cosign signature over fingerprint
    env          TEXT NOT NULL CHECK (env IN ('live','test')),
    scope        TEXT NOT NULL DEFAULT 'read' CHECK (scope IN ('read','write','admin')),
    flagships    TEXT NOT NULL DEFAULT 'a11oy,amaru,sentra,killinchu,rosie', -- CSV allowlist
    status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','expired')),
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at   TEXT,                         -- NULL = no expiry; set for rotation grace
    rotated_from TEXT REFERENCES api_keys(key_id), -- prior key during a rotation overlap
    last_used_at TEXT
);
CREATE INDEX idx_keys_account ON api_keys(account_id);
CREATE INDEX idx_keys_hash    ON api_keys(key_hash);

-- Per-flagship scope override (when a key needs different scopes per flagship)
CREATE TABLE key_flagship_scope (
    key_id   TEXT NOT NULL REFERENCES api_keys(key_id) ON DELETE CASCADE,
    flagship TEXT NOT NULL CHECK (flagship IN ('a11oy','amaru','sentra','killinchu','rosie')),
    scope    TEXT NOT NULL CHECK (scope IN ('read','write','admin')),
    PRIMARY KEY (key_id, flagship)
);

-- Usage = sum over Khipu receipts; we cache a monthly counter for fast quota checks
CREATE TABLE usage_counters (
    account_id   TEXT NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    period       TEXT NOT NULL,               -- 'YYYY-MM'
    calls        INTEGER NOT NULL DEFAULT 0,
    over_quota   INTEGER NOT NULL DEFAULT 0,  -- count of calls past soft quota
    PRIMARY KEY (account_id, period)
);

-- Every API call's Khipu receipt id is logged here (the billing source of truth)
CREATE TABLE call_receipts (
    receipt_id     TEXT PRIMARY KEY,          -- matches KhipuReceipt.receiptId
    account_id     TEXT NOT NULL REFERENCES accounts(account_id),
    key_id         TEXT NOT NULL REFERENCES api_keys(key_id),
    flagship       TEXT NOT NULL,
    operation_id   TEXT NOT NULL,             -- OpenAPI operationId
    chain_verified INTEGER NOT NULL,
    continuum_hash TEXT NOT NULL,
    tripwire       TEXT,                       -- NULL if clean
    over_quota     INTEGER NOT NULL DEFAULT 0,
    ts             TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_receipts_account_ts ON call_receipts(account_id, ts);

-- Customer's own action audit log (what they did in the portal)
CREATE TABLE audit_log (
    audit_id   TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    action     TEXT NOT NULL,                 -- key.create|key.revoke|key.rotate|tier.change|login
    detail     TEXT,                          -- json
    actor_ip   TEXT,
    ts         TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

## 4 — Lifecycle operations

### Issuance
1. Authenticated portal user clicks **Create key** → choose env, scope, flagship allowlist, optional name.
2. Server generates 16 random bytes → base62 → assemble `szl_{env}_{flagship?}_{rand}`.
3. Compute `key_hash`, `fingerprint`; cosign-sign the fingerprint (offline keymint).
4. Insert `api_keys` row; write `audit_log` (`key.create`) and a Khipu receipt for the issuance event.
5. Return the raw key **once** (never retrievable again).

### Revocation
- `UPDATE api_keys SET status='revoked' WHERE key_id=?` → next `verify_key` fails closed.
- Write `audit_log` (`key.revoke`) + Khipu receipt. Effect is immediate (no cache TTL on revocation).

### Rotation (zero-downtime)
- Mint a new key with `rotated_from = old_key_id`, set old key `expires_at = now + 7 days`.
- Both keys valid during the grace window; dashboard nags to migrate. At expiry the old key flips
  `expired`. Each step receipted.

### Scope / per-flagship
- Coarse: `api_keys.scope` + `api_keys.flagships` CSV.
- Fine: rows in `key_flagship_scope` override per flagship (e.g. `read` everywhere but `write` on amaru).
- Verb class derived from `operationId`: `get*`/`list*` → needs `read`; `start*`/`post*`/`ingest*` →
  needs `write`; `admin*`/key management → needs `admin`.

---

## 5 — Rate limits per tier

Enforced as a token-bucket per key + a monthly call quota per account. Honor-system soft quota; hard
ceiling = 10× soft, then 429.

| Tier | Monthly calls (soft) | Burst (req/s per key) | Hard ceiling (429) | Concurrency |
|---|---:|---:|---:|---:|
| **Demo** (free) | 1,000 | 2 | 10,000 | 2 |
| **Builder** ($299/mo) | 100,000 | 20 | 1,000,000 | 10 |
| **Professional** ($1,999/mo) | 1,000,000 | 100 | 10,000,000 | 50 |
| **Enterprise** | unlimited (contracted) | negotiated | n/a | negotiated |
| **DoD/IC** | unlimited (air-gapped) | local-bounded | n/a | local |

Quota check (honor system):
```python
# quota.py — soft advisory, not a hard mid-request kill until hard ceiling
SOFT = {"demo":1_000,"builder":100_000,"professional":1_000_000}
def quota_state(tier, calls_this_period):
    soft = SOFT.get(tier)
    if soft is None: return "unlimited"
    if calls_this_period < soft:           return "ok"
    if calls_this_period < soft * 10:      return "over_quota"   # soft 402 advisory header
    return "hard_ceiling"                                        # 429
```

---

## 6 — Khipu receipt on every API call (the billing + audit spine)

Every authenticated request, before returning, the gateway:
1. Runs the flagship's 13-axis gate + HUKLLA check (already required by Doctrine v12).
2. Builds the receipt packet, `json.dumps(sort_keys=True) → sha256 → continuum_hash`, links `prevHash`.
3. Inserts `call_receipts` row, increments `usage_counters`, sets `over_quota` if applicable.
4. Returns `X-Khipu-Receipt: <receiptId>` header (and the full receipt in JSON bodies).

This makes usage **auditable end to end**: a customer (or Greene) can pull `/v1/audit/{missionId}` or the
portal's receipt export and recompute every `continuum_hash` themselves. Billing is "verify our logs",
not "trust our logs".

---

## 7 — Patch files (NOT pushed by authoring step)

| File | Target |
|---|---|
| `patches/github_customer_portal/schema.sql` | `szl-holdings/customer-portal` repo |
| `patches/github_customer_portal/verify_key.py` | same |
| `patches/github_customer_portal/quota.py` | same |

— Signed **Yachay** (CTO authority), 2026-06-01. Honor system + Khipu receipts. No mock. No bandaid.
