# Platform security evidence reconciliation — 2026-11-01

## Plan recorded before patching

- Workcell: `platform-security-evidence-20261101`.
- Actor: Codex, acting on Stephen's request to execute the remaining Platform repairs.
- Baseline source: `a465a0aa182f5eb88bdf3131372ca7a9b8199e87`.
- Scope: replace the committed vulnerability and license reports with the exact
  artifacts from successful main Security Audit run `41357376251`; update only
  the dependency evidence in `docs/security-posture.md`; add a dated observation
  to `docs/operations/known-gaps.md`; record verification here.
- Success: report bytes match digest-verified CI artifacts, documented counts
  agree with those reports, and operational claims identify their exact runs.
- SBOM decision: compare committed and hosted bytes before writing. Preserve
  the committed file if already identical.
- Runtime, signing, provider credentials, dependency resolution and policy are
  outside this evidence-refresh patch. Their unresolved requirements remain
  explicit; this patch does not establish operational readiness.

## Baseline

The local checkout is clean at the source above. Node is `v24.22.1`.
The initial `pnpm typecheck` attempt exits 1 because the runtime's pnpm is
`11.25.0`, while the repository requires `10.26.1`. The required version is
available through `npx --yes pnpm@10.26.1`.

## Patch and retained source evidence

`security/vuln-report.md` and `security/license-report.md` are replaced with
the exact files emitted by Security Audit run `41357376251` on the baseline
source. Their ZIP hashes were checked against GitHub's artifact metadata before
their contents were admitted. `docs/security-posture.md` now describes those
reports, and `docs/operations/known-gaps.md` records bounded operational results.
No workflow, code, dependency declaration, lockfile, policy or credential is
changed. The reports describe the baseline dependency graph; they are not a
claim that an unobserved future PR head has passed CI.

| Artifact ID | File | ZIP SHA-256 |
|---|---|---|
| 13104145528 | `license-report.md` | `3b557e69c721e17dbb5622e9eabaed8eb526de68837c3c4e788f14421a887cc8` |
| 13103543498 | `vuln-report.md` | `3cfcf68002189b4f200385342b5e982d8794832eade04894da39d5b82e976859` |
| 13103339377 | `sbom-latest.json` | `f8d7b37e89e5c60aed990902a4b0510d86bc82d6a924b92b35802ff1b7553eec` |

| Repository file | SHA-256 after reconciliation |
|---|---|
| `security/license-report.md` | `7dc1c98c975cedcb6d2aa41ced86a6172a861afa99a4017503088ee850047652` |
| `security/vuln-report.md` | `ee33563b8c6261048d1c7e899c073c6ffcdec98f7b9620d780b2d1cef768700e` |
| `security/sbom-latest.json` | `6574ac9d5338f9b30884bed904fa006076f9f34b1a99f3104c5f09613c4770d9` |

All three repository files match their hosted artifact bytes. The SBOM was
already identical before this patch and remains unchanged: CycloneDX 1.4,
1,806 components, inventory-only. Its generation and schema-validation steps
passed in the hosted dependency job; no new local schema-validation claim is
made.

## Operational observations and next effects

| Surface | Exact evidence | Remaining action |
|---|---|---|
| Main security | [41357376251](https://github.com/szl-holdings/platform/actions/runs/41357376251), all four component jobs and blocking gate passed at baseline SHA | Preserve the gates; obtain fresh PR-head checks before merge |
| Wake receipt | [41357560888](https://github.com/szl-holdings/platform/actions/runs/41357560888), job `125001090205`, HTTP 200 and response contract PASS at baseline SHA | The old 404 is superseded for this transaction; independent storage/signature/source-binding proof is not established by this job |
| Staging | [41357376270](https://github.com/szl-holdings/platform/actions/runs/41357376270), job `125000246618`, configuration check passed, request rejected HTTP 403 | Deployment owner must verify supported provider API and credential/target authorization; then verify accepted deployment and exact-source runtime |
| Security readiness | [41356749350](https://github.com/szl-holdings/platform/actions/runs/41356749350), job `124998333979`, HF preflight ready, empty fleet key, unsigned publication denied | Bind the already-approved fleet seed via the approved secret manager; rerun and independently read back a verified signed receipt |
| Reliability readiness | [41355447822](https://github.com/szl-holdings/platform/actions/runs/41355447822), job `124994392592`, unsigned publication denied | Same fleet signing prerequisite |
| Observability readiness | [41353283038](https://github.com/szl-holdings/platform/actions/runs/41353283038), job `124987873710`, unsigned publication denied | Same fleet signing prerequisite; the OIDC publication path also needs successful observed exchange/upload |

The three sampled readiness runs used
`4dadb116cbafc8dbde9ffc9df183db2205dc73ca`, before #988's retention repair.
Their failures are not a test of artifact retention at the baseline SHA.
The GitHub connector has no secret-administration operation for binding the
fleet seed. No secret was generated, read, printed, or changed. No denied
deployment request was retried. Issue #983 remains only partly resolved by the
observed wake transaction.

## Validation and limits

- Python standard-library SHA-256 and ZIP verification: exit 0; all three ZIP
  hashes match GitHub artifact metadata, and all three extracted files match
  their repository destinations exactly.
- `git diff --check`: exit 0.
- `node scripts/qa/scan-secrets.js .`: reports CLEAN, no secrets found.
- `npx --yes pnpm@10.26.1 typecheck`, before and after patch: exit 1 because
  `turbo` and workspace dependencies are absent. Same environment failure;
  no local typecheck pass is claimed. This is a documentation/report-only patch
  and remains draft pending exact-head hosted validation.
- Hosted baseline CI `41357376379`: Lint and clean-clone jobs passed;
  Typecheck was still running when inspected. Runtime Audit was also pending.
- Screenshot references: not applicable; no application UI changed.
- Public-claim check: dated source/run evidence only, no whole-estate,
  deployment, signing, customer or compliance readiness claim.
- Security check: no credentials, secret values or provider response bodies
  are included in this patch. Only public artifact hashes and run identifiers
  are recorded.
- Known-gaps update: `PLATFORM-EVIDENCE-20261101` is an additive dated entry;
  it does not relabel older estate observations as current.
- Proof level: scoped documentation evidence; no release proof.
- Recorded by: Codex. Recorded date: 2026-11-01, America/New_York.

Rollback: revert only the evidence-refresh commit. This patch has no runtime
effect and does not resolve the 16 Moderate or 1 Low dependency findings.
