# D-SLSA Standalone Publication Proof

Date: 2026-07-28

Status: **PUBLIC SOURCE VERIFIED / DOI UNAVAILABLE**

## Plan

1. Correct the proposed D-SLSA DOI claim.
2. Make the reference package installable and testable outside the monorepo.
3. Publish the Apache-2.0 source in a standalone repository.
4. Use the inherited pull-request rule for the first follow-up fix.
5. Verify the public bytes without GitHub authentication.

## Published source

- Repository: <https://github.com/szl-holdings/evidence-doctrine>
- Visibility: public
- Default branch: `main`
- Initial source commit: `0cb859babce33531501352564de3c33e6a6b6007`
- Portable-typecheck PR: <https://github.com/szl-holdings/evidence-doctrine/pull/1>
- Exact reviewed PR head: `3ea40357f878a7326bc5c1a732b20ba3dd32f1ca`
- Protected squash result: `b2fcdb5078127c3ac0bd063ed629a80d26827dca`
- Claim-boundary PR: <https://github.com/szl-holdings/evidence-doctrine/pull/2>
- Current exact main commit: `71ab3b8a4538a106fe0a24146785456fcc8bbe1f`

The initial push established the empty repository's first `main` commit.
Thereafter the inherited organization rule rejected a direct update to `main`,
and the portability fix merged through PR #1. No rule or bypass was changed.

## Verification

The exact public main commit was cloned into a new directory.

| Check | Result |
|---|---|
| TypeScript evaluator tests | 13/13 pass |
| Python evaluator tests | 13/13 pass |
| TypeScript typecheck | pass |
| Unauthenticated GitHub repository API | `private=false` |
| Unauthenticated raw README request | HTTP 200 |
| README identifies the DOI collision | pass |

## DOI boundary

Live Zenodo metadata for record `20490218` reports:

- DOI: `10.5281/zenodo.20490218`
- concept DOI: `10.5281/zenodo.19944926`
- title: `SZL Holdings Ouroboros Thesis v21 — The PURIQ-OS Substrate`
- version: `21.0.0`

Therefore `10.5281/zenodo.19944926` is not and cannot be cited as the D-SLSA
concept DOI. The public repository includes `.zenodo.json` for a future,
separate deposition. No Zenodo access token or authenticated browser session
was available, so no deposition or DOI was fabricated.

## Remaining evidence boundaries

- D3 remains unverified without an exact decision bundle carrying a verified
  third-party log inclusion, byte-identical replay, and offline verification.
- D4 remains unverified without cumulative D3 evidence plus a real authorized
  hardware attestation result, formal policy evidence, and a machine-checked
  denial for the evaluated bundle.
- Public source does not establish adoption, certification, or independent
  validation.

## Coordination boundary

No organization or repository ruleset, branch protection, required review,
required check, bypass actor, qillqaq-attestor, secret, governance workflow, or
owner-controlled pull request was mutated.
