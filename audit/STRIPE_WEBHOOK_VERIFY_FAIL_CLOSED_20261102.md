# Stripe webhook verification — local source evidence

- Workcell: `STRIPE-WEBHOOK-VERIFY-20261102`.
- Actor and recorder: OpenAI Codex, implementing the owner-authorized platform repair.
- Recorded at: `2026-11-02T05:51:25Z`.
- Base: `0bf3657ecc7aa15ac8372beddfc9421209168fec`.
- Base tree: `3eb2adbc72d006d80cdf198bf3399e4b89075bf9`.
- Proof level: measured local source and offline test evidence; no deployed-runtime proof.

## Objective and security boundary

Make `StripeAdapter.verifyWebhookPayload` fail closed when its inbound webhook
secret or signature is absent. Authenticate the exact supplied body bytes
before returning parsed event data, reject ambiguous timestamp and digest
encodings, and preserve the existing five-minute tolerance plus multiple `v1`
signatures used during secret rotation.

The outbound `STRIPE_SECRET_KEY` is intentionally not part of this boundary.
Webhook authentication remains valid when only `STRIPE_WEBHOOK_SECRET` is
configured. Adding the webhook secret to the adapter-wide `requiredEnvVars`
would incorrectly disable unrelated outbound Stripe operations.

## Trigger and candidate behavior

Previously, parseable JSON returned `{ verified: true, event }` whenever the
outbound API key or webhook secret was absent. The missing-signature check then
never ran. A correctly MACed nonnumeric timestamp produced `NaN`, which also
bypassed the freshness comparison, and permissive hex decoding admitted
noncanonical digest suffixes.

The candidate returns `{ verified: false, event: null }` for missing or blank
webhook configuration, missing signatures, duplicate or noncanonical
timestamps, out-of-window timestamps, malformed digests, bad HMACs, invalid
JSON, and non-object JSON roots. It computes HMAC over the timestamp prefix and
the exact UTF-8 string bytes or copied Buffer bytes, then parses the event only
after authentication succeeds.

Current source exports this adapter from the public services package but has no
direct caller. The historical billing webhook route named in documentation is
absent from the current API-server stub. Adapter-level vulnerability is
confirmed; current external HTTP reachability remains unproven.

## Local commands and results

The repository-pinned pnpm 10.26.1 dependency graph was installed from the
frozen lockfile. The first shared-store attempt exited 1 because one cached
file was missing; an isolated workspace store install then completed with exit
0. After protected `main` advanced, that store was refreshed from the new
frozen lockfile and the final checks ran with Vitest 4.1.12. No candidate
manifest dependency or lockfile change was made.

Protected `main` then advanced from dependency parent `9b72438...` to the
recorded base with an unrelated AEF benchmark-report change. None of the five
candidate paths changed; the focused suite and candidate workspace typecheck
were rerun on the recorded exact base.

| Command / check | Exit | Result |
|---|---:|---|
| `corepack pnpm exec turbo run typecheck --concurrency=2 --output-logs=errors-only`, unmodified dependency parent `9b72438...` | 0 | 232/232 Turbo tasks passed in 13m0.552s; cold run with 0 cache hits |
| New Stripe suite against the original verifier | 1, expected | 8 failed and 9 passed; missing configuration, missing signature, malformed timestamp/digest, duplicate timestamp, and non-object roots reproduced |
| `corepack pnpm --filter @szl-holdings/services test`, candidate | 0 | 2 files and 35/35 tests passed, including 17 Stripe cases |
| `corepack pnpm --filter @szl-holdings/services typecheck` | 0 | TypeScript check passed |
| `corepack pnpm --filter @szl-holdings/services lint` | 0 | No errors; 141 pre-existing package warnings reported |
| Changed-file Biome lint | 0 | No errors; one pre-existing non-null warning at `stripe.ts:213` |
| `corepack pnpm exec turbo run typecheck --concurrency=2 --output-logs=errors-only`, final candidate on exact base | 0 | 232/232 Turbo tasks passed in 2.035s; 232 cache hits |
| `$env:TRUTH_ALLOWLIST_BASE_SHA='9b72438f25faa3474a0933a4a775aff46594ed1b'; node tools/truth/claims-drift.ts` | 0 | `claims drift: PASS` |
| `git diff --check` | 0 | No whitespace errors |
| Changed-file `scripts/qa/scan-secrets.js` | 0 | `CLEAN — no secrets found.` |

The test fixtures use inert values and local Node HMAC computation. No Stripe
API request, credential read, charge, webhook delivery, deployment, or
provider mutation occurred. No UI or route changed, so screenshot and route
checks are inapplicable.

The negative control used the original verifier blob
`f5ed89a28c3f495cf967cdc09c5e6f4dc24ed63b`, which is byte-identical at the
exact base recorded above.

## Verification and limits

The original fail-open result no longer reproduces in the candidate: all
missing-configuration and missing-signature cases return false with a null
event. Legitimate behavior remains covered by valid signatures with and
without the outbound API key, exact string and Buffer bodies, the five-minute
boundary, and valid signatures in either rotation position.

An independent post-patch bypass review found no blocking bypass, regression,
or scope violation. It identified one incorrect base-blob SHA in this packet;
the value above was independently checked with `git ls-tree` and corrected.

This repair does not prove that a billing webhook route exists, preserves raw
request bytes before middleware, reaches this adapter, handles event types
correctly, is deployed, or processes commercial transactions. `BIL-001`,
`FLOW-002`, `TG-001`, and `TG-002` remain open. Hosted exact-head checks,
protected admission, live configuration, and end-to-end Stripe test-mode
delivery remain required.

Rollback is a protected revert of this scoped source, test, package-script, and
evidence change. No migration, provider mutation, or credential change is
required.
