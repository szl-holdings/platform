# Audit Chain Hybrid Signing — Rollout & Runbook

## Deploy sequence

### Phase 1 — Warn mode (default, safe)

1. Deploy with `AUDIT_CHAIN_ROLLOUT=warn` (this is the default).
2. Apply migration 0051 (`pnpm run db:migrate`).
3. Server bootstraps the platform-service DID automatically on startup.
4. New audit events receive hybrid signatures; old rows stay as `legacy_unsigned`.
5. Run the smoke test: `pnpm --filter @workspace/api-server smoke:identity`
6. Verify the Identity Registry page shows the platform-service DID.
7. Monitor for `[audit-chain-signer] Signing failure` log lines at `error` level.

**Soak window**: Let the system run in warn mode for at least 24h and confirm:
- `GET /audit-chain/verify` returns `{ summary: { hybrid_verified: N, broken: 0 } }` with `N > 0`
- No unexpected broken entries
- No `signing_failure` errors in logs

### Phase 2 — Enforce mode

1. Confirm soak window metrics look healthy (zero `broken`, healthy `hybrid_verified` growth).
2. Set `AUDIT_CHAIN_ROLLOUT=enforce` and redeploy.
3. Audit write attempts that cannot be signed will now fail with HTTP 503. Any signing failure fails the originating request closed.
4. Re-run the smoke test: `pnpm --filter @workspace/api-server smoke:identity`

## Rollback procedure

If enforce mode causes unexpected failures:

1. Set `AUDIT_CHAIN_ROLLOUT=warn` in environment.
2. Redeploy (rolling deploy, no DB changes needed).
3. Server reverts to warn-only behavior immediately on restart.
4. Investigate signing failures in logs: search for `[audit-chain-signer]`.

**DB rollback is NOT needed.** The signature columns are nullable; switching back to warn mode simply means new rows may be written without signatures (legacy_unsigned), which the verifier handles gracefully.

## Metrics to watch during rollout

| Log line | Meaning |
|----------|---------|
| `[audit-chain-signer] Signing failure` at `error` | Signing failed for an event; check custody backend |
| `[key-custody] Bootstrap: generating new root key` | First-run key generation (expected on fresh deploy) |
| `[identity-bootstrap] Platform identity bootstrapped` | DID bootstrap complete (expected once per cold start) |
| `[did-registry] DID created` | New DID minted |
| `[did-registry] Key rotated` | Key rotation executed |

## Key rotation

To rotate the platform-service DID signing key:

```bash
# Via API (requires ops role):
curl -X POST /api/identity-registry/dids/did:plat:platform_service:szl-api-server/rotate \
  -H 'x-internal-token: $ALLOY_INTERNAL_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"reason": "scheduled_rotation"}'
```

Old key is soft-revoked (not deleted). New key takes over immediately for signing.

## Incident response — signing key compromised

1. Immediately revoke the active key:
   ```bash
   POST /api/identity-registry/dids/{did}/revoke
   Body: {"reason": "key_compromise"}
   ```
2. A new key will need to be bootstrapped (rotate or restart server).
3. Set `AUDIT_CHAIN_ROLLOUT=warn` to prevent audit write failures while key is being restored.
4. Investigate all events signed by the compromised key ID.
5. Re-sign critical events is out of scope for v1 (re-signing is a deferred item).

## Environment variables reference

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `AUDIT_CHAIN_ROLLOUT` | `warn` \| `enforce` | `warn` | Rollout mode |
| `KEY_CUSTODY_BACKEND` | `software-encrypted` \| `hsm-stub` | `software-encrypted` | Custody backend |
| `KEK_SOURCE` | `env` \| `file` | `env` | KEK source |
| `KEK` | hex or base64 | — | Key encryption key (if KEK_SOURCE=env) |
| `DID_WEBVH_LOG` | `on` \| `off` | `off` | WebVH history log writer |
| `SIGNING_SCHEME_VERSION` | string | `hybrid-v1` | Signing scheme version |
