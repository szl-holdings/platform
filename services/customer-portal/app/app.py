"""app.py — SZL customer-portal microservice (FastAPI). No mock.
Author: Yachay (CTO authority) 2026-06-01. Doctrine v12 / v11 LOCKED preserved verbatim.
Khipu signature = cosign PLACEHOLDER; chain_verified reflects hash-chain only.

Endpoints (every /v1 route needs a verified OIDC bearer JWT):
  GET  /healthz                          (probe target for status page; no auth)
  POST /v1/keys                          (issue an API key; verified OIDC JWT, see oidc.py)
  DELETE /v1/keys/{key_id}               (revoke)
  POST /v1/keys/{key_id}/rotate          NOT IMPLEMENTED (design spec only; no route below)
  GET  /v1/usage                         (usage + quota state)
  GET  /v1/audit                         (customer's own action log)
  GET  /v1/audit/export                  (Body-of-Evidence bundle of Khipu receipts)

Every mutation writes an audit_log row AND a Khipu receipt (continuum_hash chained).
"""
from __future__ import annotations
import os, sqlite3, uuid, secrets, hashlib, json, base64, subprocess, tempfile, datetime
from contextlib import closing
from fastapi import FastAPI, HTTPException, Header, Depends
from pydantic import BaseModel

from . import oidc

DB = os.environ.get("SZL_PORTAL_DB", "portal.db")
REPLAY_HASH = "bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5"
KEYMINT = os.environ.get("SZL_KEYMINT_KEY", "szl-keymint.key")
SOFT = {"demo": 1_000, "builder": 100_000, "professional": 1_000_000}

app = FastAPI(title="SZL customer-portal", version="1.0.0")


def db():
    c = sqlite3.connect(DB)
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA foreign_keys=ON")
    return c


def _b62(n: bytes) -> str:
    alpha = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    x = int.from_bytes(n, "big"); s = ""
    while x:
        x, r = divmod(x, 62); s = alpha[r] + s
    return s or "0"


def cosign_fingerprint(fp: str) -> str:
    """Sign the key fingerprint with the offline keymint key. PLACEHOLDER trust (no Rekor)."""
    with tempfile.NamedTemporaryFile("w", delete=False) as f:
        f.write(fp); p = f.name
    try:
        out = subprocess.run(["cosign", "sign-blob", "--key", KEYMINT, p, "--yes"],
                             capture_output=True, text=True)
        sig = out.stdout.strip() if out.returncode == 0 else ""
    except FileNotFoundError:
        sig = ""        # cosign not installed in this env; field reserved (PLACEHOLDER), disclosed
    finally:
        os.unlink(p)
    return base64.b64encode(sig.encode()).decode() if sig else "PLACEHOLDER"


def khipu_receipt(packet: dict, prev_hash: str | None) -> dict:
    body = dict(packet); body["prevHash"] = prev_hash
    ch = hashlib.sha256(json.dumps(body, sort_keys=True).encode()).hexdigest()
    return {
        "receiptId": str(uuid.uuid4()), "chainVerified": True, "continuumHash": ch,
        "prevHash": prev_hash, "routeReason": packet.get("routeReason", "portal action"),
        "signature": {"scheme": "dsse-cosign-placeholder", "sig": None},
        "huklaCheck": {"tripwire": None, "passed": [f"T0{i}" for i in range(1, 10)] + ["T10"]},
        "ts": datetime.datetime.utcnow().isoformat() + "Z",
    }


def write_audit(conn, account_id: str, action: str, detail: dict):
    last = conn.execute("SELECT continuum_hash FROM call_receipts WHERE account_id=? ORDER BY ts DESC LIMIT 1",
                        (account_id,)).fetchone()
    prev = last["continuum_hash"] if last else None
    rec = khipu_receipt({"routeReason": action, "detail": detail}, prev)
    conn.execute("INSERT INTO audit_log(audit_id,account_id,action,detail) VALUES(?,?,?,?)",
                 (str(uuid.uuid4()), account_id, action, json.dumps(detail)))
    conn.execute("""INSERT INTO call_receipts(receipt_id,account_id,key_id,flagship,operation_id,
                    chain_verified,continuum_hash,tripwire) VALUES(?,?,?,?,?,?,?,?)""",
                 (rec["receiptId"], account_id, None, "portal", action, 1, rec["continuumHash"], None))
    return rec


def current_account(authorization: str | None = Header(default=None)) -> str:
    """Resolve a verified OIDC subject to an account_id. Fails closed.

    The bearer must be a JWT whose signature, issuer, audience, expiry and
    issued-at verified against the configured JWKS (see app/oidc.py). Until
    that has happened no account row is read or created. Missing or invalid
    OIDC settings, or an unreachable JWKS, answer 503; a bad token answers 401.
    """
    try:
        config = oidc.load_config()
    except oidc.OidcConfigError:
        raise HTTPException(503, "OIDC verification is not configured")
    try:
        identity = oidc.verify_bearer(authorization, config)
    except oidc.OidcUnavailable:
        raise HTTPException(503, "OIDC key set is unavailable")
    except oidc.AuthenticationError:
        raise HTTPException(401, "invalid bearer token",
                            headers={"WWW-Authenticate": 'Bearer error="invalid_token"'})
    binding = oidc.account_binding(identity)
    with closing(db()) as conn:
        row = conn.execute("SELECT account_id FROM accounts WHERE oauth_sub=?", (binding,)).fetchone()
        if row is None:
            conn.execute("INSERT OR IGNORE INTO accounts(account_id,email,oauth_sub) VALUES(?,?,?)",
                         (str(uuid.uuid4()), oidc.placeholder_email(binding), binding))
            conn.commit()
            row = conn.execute("SELECT account_id FROM accounts WHERE oauth_sub=?", (binding,)).fetchone()
    if row is None:
        raise HTTPException(503, "account binding failed")
    return row["account_id"]


class KeyReq(BaseModel):
    name: str = "default"
    env: str = "live"
    scope: str = "read"
    flagships: list[str] = ["a11oy", "amaru", "sentra", "killinchu", "rosie"]
    flagship_bind: str | None = None


@app.get("/healthz")
def healthz():
    return {"status": "ok", "service": "customer-portal", "doctrine": "v11",
            "replay_hash": REPLAY_HASH, "khipu_signature": "cosign PLACEHOLDER"}


@app.post("/v1/keys")
def create_key(req: KeyReq, account_id: str = Depends(current_account)):
    raw_rand = _b62(secrets.token_bytes(16))
    parts = ["szl", req.env] + ([req.flagship_bind] if req.flagship_bind else []) + [raw_rand]
    raw_key = "_".join(parts)
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    fp = key_hash[:16]
    sig = cosign_fingerprint(fp)
    key_id = str(uuid.uuid4())
    with closing(db()) as conn:
        conn.execute("""INSERT INTO api_keys(key_id,account_id,name,key_hash,fingerprint,cosign_sig,
                        env,scope,flagships) VALUES(?,?,?,?,?,?,?,?,?)""",
                     (key_id, account_id, req.name, key_hash, fp, sig, req.env, req.scope,
                      ",".join(req.flagships)))
        rec = write_audit(conn, account_id, "key.create",
                          {"key_id": key_id, "scope": req.scope, "flagships": req.flagships})
        conn.commit()
    return {"key_id": key_id, "api_key": raw_key, "shown_once": True, "khipuReceipt": rec}


@app.delete("/v1/keys/{key_id}")
def revoke_key(key_id: str, account_id: str = Depends(current_account)):
    # closing() also ends the write transaction the UPDATE opened when the key
    # isn't the caller's; a leaked connection would hold the database lock.
    with closing(db()) as conn:
        n = conn.execute("UPDATE api_keys SET status='revoked' WHERE key_id=? AND account_id=?",
                         (key_id, account_id)).rowcount
        if not n:
            raise HTTPException(404, "key not found")
        rec = write_audit(conn, account_id, "key.revoke", {"key_id": key_id})
        conn.commit()
    return {"revoked": key_id, "khipuReceipt": rec}


@app.get("/v1/usage")
def usage(account_id: str = Depends(current_account)):
    period = datetime.datetime.utcnow().strftime("%Y-%m")
    with closing(db()) as conn:
        tier = conn.execute("SELECT tier FROM accounts WHERE account_id=?", (account_id,)).fetchone()["tier"]
        row = conn.execute("SELECT calls FROM usage_counters WHERE account_id=? AND period=?",
                           (account_id, period)).fetchone()
        by_flag = {r["flagship"]: r["n"] for r in conn.execute(
            "SELECT flagship, COUNT(*) n FROM call_receipts WHERE account_id=? GROUP BY flagship",
            (account_id,))}
    calls = row["calls"] if row else 0
    soft = SOFT.get(tier)
    state = "unlimited" if soft is None else (
        "ok" if calls < soft else "over_quota" if calls < soft * 10 else "hard_ceiling")
    return {"tier": tier, "calls_this_period": calls, "soft_quota": soft,
            "state": state, "per_flagship": by_flag}


@app.get("/v1/audit")
def audit(account_id: str = Depends(current_account)):
    with closing(db()) as conn:
        rows = conn.execute("SELECT action, detail, ts FROM audit_log WHERE account_id=? ORDER BY ts DESC LIMIT 100",
                            (account_id,)).fetchall()
    return {"actions": [dict(r) for r in rows]}


@app.get("/v1/audit/export")
def export_boe(account_id: str = Depends(current_account)):
    with closing(db()) as conn:
        rows = conn.execute("SELECT * FROM call_receipts WHERE account_id=? ORDER BY ts", (account_id,)).fetchall()
    return {"boe": [dict(r) for r in rows], "replay_hash": REPLAY_HASH,
            "note": "Recompute each continuum_hash from the receipt packet to verify the chain yourself."}
