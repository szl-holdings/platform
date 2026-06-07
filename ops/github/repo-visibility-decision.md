# Repository Visibility Decision — `szl-holdings/szl-holdings-platform`

Date recorded: 2026-04-19
Decision owner: SZL Holdings (repo owner)

## Decision

**Stay public.** The repository will remain public to keep GitHub branch
protection enforceable on the Free plan. The org will **not** be upgraded to
GitHub Team at this time.

## Rationale

1. **Cost vs. benefit.** Going private requires a GitHub Team upgrade
   (~$4/user/month) purely to keep branch protection working. Branch
   protection is the higher-value control (it gates merges, enforces
   CODEOWNERS review, and requires all six CI/security checks). Visibility
   is the lower-value control because the codebase is already structured as
   a demo / portfolio platform with seeded narrative data, not live
   customer data.
2. **No real secrets in the repo.** A sweep on 2026-04-19 (see "Public-repo
   sweep evidence" below) found no committed credentials, private keys,
   API tokens, or `.env` files. `.gitignore` correctly excludes all `.env`
   variants and only `.env.example` is tracked.
3. **No real customer data in the repo.** All entities, financials,
   "customer" objects, and ARR/MRR figures live in demo seed, simulation,
   replay-core, and adapter scaffolding files — they are intentionally
   illustrative. There is no production database snapshot, real PII, or
   unredacted private financial data committed.
4. **Investor-ready.** A public platform repo is consistent with the
   current investor-facing posture (Aegis pitch deck, Pulse briefings,
   demo video) and shortens future code-review and due-diligence loops.

## What this decision does NOT change

- Branch protection on `main` and `master` remains active with all six
  required status checks (already verified — see
  `rulesets-and-protections.md`).
- `ops/github/configure-branch-protection.sh` does not need to be re-run;
  no visibility flip happened.
- Secret scanning (Gitleaks) and Dependency Review remain blocking checks,
  so any future secret or vulnerable dependency introduction is caught
  before merge.

## Reversal path (if the decision changes later)

If SZL Holdings later chooses to re-privatize:

1. Upgrade the `szl-holdings` org to GitHub Team (Settings → Billing &
   plans).
2. Flip repo visibility to **Private** (Settings → General → Danger Zone
   → Change visibility).
3. Re-run `ops/github/configure-branch-protection.sh` and verify that the
   six required checks are still present on both `main` and `master`.
4. Update the "Resolved" note at the top of
   `ops/github/rulesets-and-protections.md` to reflect the new state.

## Public-repo sweep evidence (2026-04-19)

The following sweeps were run from the repo root (excluding `node_modules`
and lockfiles):

| Check | Pattern | Result |
|---|---|---|
| Private keys | `BEGIN (RSA \| EC \| DSA \| OPENSSH )?PRIVATE KEY` | 0 matches |
| Stripe live keys | `sk_live_[A-Za-z0-9]{20,}` | 0 matches |
| AWS access keys | `AKIA[0-9A-Z]{16}` | 0 matches |
| GitHub PATs | `ghp_[A-Za-z0-9]{36}` | 0 matches |
| Slack bot tokens | `xoxb-[0-9]{10,}` | 0 matches |
| Committed env files | `git ls-files \| grep "^\.env"` | only `.env.example` |
| `.gitignore` env coverage | `.env`, `.env.local`, `.env.*`, `*.env`, with `!.env.example` allow-list | confirmed |

Hits on words like `secret`, `token`, `password`, and `api_key` were all
in expected locations: infrastructure templates (Bicep modules referencing
Key Vault), runbooks (`infra/runbooks/RUNBOOK_SECRETS.md`), test fixtures
(`tests/utils/setup.ts`, `tests/unit/session-revocation/...`), and
documentation describing the secret-management process. None contained
actual secret values.

References to "financial", "revenue", "ARR", or "MRR" appeared only in:

- `packages/demo-seed/*` — seeded narrative data
- `packages/simulation/*` and `packages/replay-core/*` — scenario engines
- `lib/services/src/adapters/{stripe,salesforce,dynamics365,dun-bradstreet}.ts`
  — adapter scaffolding shape definitions
- `lib/services/src/providers/msp-seed.ts` — MSP demo seed
- `ops/benchmark/operator-differentiation-pass.md` — public benchmark notes

No real customer financials are exposed.

## Status

- [x] Explicit decision recorded (stay public)
- [x] Secret / private-key / committed-env-file sweep performed and clean
- [x] Customer-data and financials sweep performed; only demo / scaffolded
      content found
- [ ] (Not applicable — staying public) Org upgrade to GitHub Team
- [ ] (Not applicable — staying public) Re-run
      `configure-branch-protection.sh` after visibility flip
