# Readiness OIDC publication preparation

Workcell: `SZL-ORG-PR-20261015` · PR #904 · recorded 2026-10-15.
Agent: Codex / BuildWarden role. Proof level: 2, source and offline contracts.

The observability publisher is prepared to request an exact-dataset OIDC grant.
Receipt upload still requires the configured fleet signature, the matching
resource and a successful provider exchange. Provider errors now expose only
fixed failure categories; raw exception text cannot enter receipt output or
GitHub Actions annotations through this publication path.

## Plan and patch

Preserve the original PR branch at
`72a780c9fe2bc1d69ef4080958456a5c10baae96`, forward-merge protected main
`0b9585f36c4cc600a841c9486ac6b95702ce7529`, retain main's source and
evidence bytes, and review only the original OIDC delta plus bounded error
handling, meaningful regressions and this proof/gap record. No history rewrite,
credential replacement or provider configuration is part of this repair.

The workflow grants `id-token: write` and selects only
`datasets/SZLHOLDINGS/readiness-runs`. Its job no longer supplies `HF_TOKEN`.
The shared helper rejects mismatched resources, mixed token/OIDC credentials,
missing GitHub Actions request grants and invalid fleet signatures before
constructing the Hub client. The pinned SDK's OIDC-only exchange is called with
the exact resource and GitHub provider. Only a plain dictionary containing a
nonempty plain-string access token without whitespace/control characters can
construct the client. That explicit token bypasses generic credential discovery.
The other seven readiness workflows retain their existing token path.

Independent review found that generic `token=True` discovery could fall through
to another credential source when a nominally successful SDK exchange returned
an empty token. The initial exception-only SDK check did not cover that case.
The final source removes generic discovery and adds real pinned-SDK regressions
for empty, absent, non-string and malformed results as well as thrown denials.
The existing readiness CI job installs the pinned Hub and PyNaCl dependencies
so these integration contracts run before protected admission.

Publication failures preserve `published:false`, the attempted receipt path
and the existing failing Actions exit. The classifier inspects only a plain
integer HTTP status and emits one of six fixed categories. Unknown, malformed
or inaccessible status metadata gets the generic category. Exception strings,
class names, response bodies and headers are never included.

Reviewed Git blob identities for the source under test:

- Workflow: `af7b8a84662b133ede8d0caf1cb57aa291852b15`.
- Shared publisher: `936d9ba81b5dfaaed5b7d26774229541acd76cd3`.
- Publisher regression suite: `1c7a9c16aabe2ebf4b84885b23ff8bcd521d7677`.
- Pinned-SDK regression suite: `ac56928ab6152f01f8f205b59e1e058d7c91f760`.
- Readiness CI: `b6a998b0f903e08e2bf1a058fd24b4401d312bd3`.

## Validation

These observations are scoped to the listed contracts. Canonical aggregate
`platform_tests` evidence remains `UNAVAILABLE`; no repository-wide test count
or runtime qualification is inferred.

| Command / check | Exit | Result |
| --- | --- | --- |
| `pnpm typecheck`, pinned pnpm 10.26.1 / Node 24.19.0, before and after the bounded-error patch | 0 | 232 successful tasks, all cached in both runs |
| `python -B -m unittest discover -s platform/agents/readiness/_lib -p 'test_*.py'` | 0 | 139 readiness regression cases, nine expected PyNaCl-dependent skips and four expected pinned-SDK skips |
| `uv run --offline --no-project --with huggingface_hub==2.0.0 --with pynacl==1.6.0 python -B -m unittest discover -s platform/agents/readiness/_lib -p 'test_*.py'` | 0 | All 139 readiness regression cases completed successfully, including real Ed25519 and pinned-SDK control flow; provider operations mocked and network connections forbidden |
| Initial pinned SDK exception-only contract | 0 | Limited result: thrown exchange denials did not fall back; independent review subsequently found the empty-token case this check omitted and the final source/tests address it |
| `pnpm claims:drift` after ordinary integration | 0 | Unchanged validator accepts the integrated source with its real protected-main ancestor |
| Final source-delta whitespace check against protected main | 0 | No whitespace errors |

A pre-commit `pnpm claims:drift` invocation exited 1 on inherited historical
catalog counts while the ordinary merge was still pending. Its immutable
baseline was the original branch's older merge base
`f2f8df6f89056e9104587674ccec0855dd5b177a`, because protected main was
not yet an ancestor of the local HEAD. The committed integration reran and
passed the unchanged check with its real main ancestor; no allowlist or
validator was changed to admit historical counts.

The negative cases cover synthetic credential text, newline-delimited workflow
commands, client construction and upload denial, each missing OIDC request
field, outside-Actions denial, status-category boundaries, string/boolean/status
subclass rejection and properties that raise. They assert failed publication,
no successful upload, bounded output and no additional workflow command line.
All key/token fixtures are generated or explicit synthetic test doubles; no
real provider exception or stored credential was reproduced.

The final pinned-SDK cases run the real `oidc_login` and header token selector
with provider minting, exchange and upload mocked. Valid output passes the
explicit token to the client even when implicit token use is disabled. Every
malformed/empty/denied outcome returns a bounded unsuccessful publication and
constructs no client. Generic discovery, environment, token-file and Colab
fallback mocks remain uncalled in every case. This verifies SDK control flow,
not provider authentication.

The first hosted CodeQL scan flagged the optional-dependency setup because it
could not infer that `self.skipTest` always raises before `version` is used.
The setup now raises `unittest.SkipTest` explicitly on missing/wrong dependency
versions. Both the complete pinned-dependency suite and the stdlib skip path
were rerun successfully after this control-flow correction.

## Verification and remaining gates

No UI surface or route changed, so a new screenshot and route-discovery run do
not apply. The prior dashboard witness remains tied to its original source.
The known-gaps entry records this bounded source repair and retains the open
provider/signing/runtime requirements. The historical APP_STATUS register is
not relabeled as current readiness.

The Trusted Publisher binding and a successful signed receipt upload have not
been observed. No readiness writer was dispatched, no receipt uploaded, and no
provider or secret configuration was changed by this repair. The scheduled
observability job remains unsuccessful when its real admission inputs are
unavailable. A valid workflow source, local fixture or passing source check
does not establish the provider binding, transport success, fresh flagship
observations or production readiness. Exact-head hosted checks and ordinary
protected squash admission remain required.
