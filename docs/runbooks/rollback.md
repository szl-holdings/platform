# Runbook — Flagship Space Rollback

> Doctrine v11 LOCKED · 749/14/163 · locked_at `c7c0ba17`

## When to use

Trigger a rollback when a flagship enters sustained **RED** per its SLO doc
(`platform/docs/slos/<flagship>.md`): `/healthz` 5xx, Doctrine-number drift,
signed-receipt success < 99.9%, or Wire-D verification < 100%.

## Pre-flight

1. Identify the **last-known-good SHA** of the affected Space:
   ```bash
   curl -s https://huggingface.co/api/spaces/SZLHOLDINGS/<flagship>/commits/main \
     | python3 -c "import sys,json;[print(c['id'],c['title']) for c in json.load(sys.stdin)[:10]]"
   ```
   (Many flagships also echo a `sha` field in `/healthz` — e.g. `rosie`.)
2. Confirm the bad commit and the target good SHA with the founder if time permits.

## Execute

```bash
export HF_TOKEN=<write-token-on-SZLHOLDINGS>
export KHIPU_ENDPOINT=https://szlholdings-khipu-constellation.hf.space   # optional
platform/scripts/rollback_flagship.sh <flagship> <previous_sha>
```

The script is **non-destructive**: it re-applies the file tree of `<previous_sha>`
as a **new** restore commit (no history rewrite, no force-push). The rollback is
therefore itself auditable and reversible.

## Verify

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://szlholdings-<flagship>.hf.space/healthz
curl -s https://szlholdings-<flagship>.hf.space/healthz | python3 -m json.tool | grep -E "declarations|axioms|sorries"
```
Expect HTTP `200` and `749 / 14 / 163`.

## Khipu logging

Each rollback emits a Khipu chain entry (`event: rollback`, `flagship`, `restored_to`,
`actor`). If `KHIPU_ENDPOINT` is set, it is POSTed to `/khipu/append`; otherwise it is
logged to stdout for manual capture.

## HF restore pattern note

The earlier brief mentioned `delete_branch` + recreate. We deliberately use the
**re-upload restore** pattern instead: HF Spaces have a single `main` branch and
deleting it would be destructive and could break the running container. Re-uploading
the prior tree as a new commit achieves the same end state safely and additively.
