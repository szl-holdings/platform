# ADR: did:webvh History Log

## Status: Deferred (scaffolded, inert by default)

## Context

The `did:webvh` method records a cryptographically verifiable history of DID
document versions, enabling external parties to audit key rotation history.

The `did_webvh_log` table exists in the DB schema (migration 0051). The writer
in `platform-did-registry.ts` is called via `maybeWriteWebvhLog()` but no-ops
unless `DID_WEBVH_LOG=on`.

## Activation path

1. Set `DID_WEBVH_LOG=on` in env.
2. The writer will begin recording events to `did_webvh_log`.
3. Implement a `GET /did-webvh/{did}/history` endpoint that reads the log and
   returns a JSON-LD verifiable history document.
4. Publish that endpoint at a resolvable URL so external resolvers can verify.
5. Update this ADR to `Status: Active`.

## Table schema

```sql
did_webvh_log:
  id          serial PK
  did         text NOT NULL
  event_type  text NOT NULL  -- 'key_genesis' | 'key_rotation' | 'did_revocation'
  key_id      text
  payload     jsonb
  created_at  timestamp
```

## Security note

The history log must be append-only and each entry must eventually be signed
by the active key at the time of the event. This signing is deferred to the
activation task.
