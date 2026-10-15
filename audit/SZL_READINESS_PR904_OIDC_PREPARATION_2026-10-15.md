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
constructing the Hub client. Explicit `token=True` requests the pinned SDK's
OIDC exchange; exchange denial does not retry through a token path. The other
seven readiness workflows retain their existing token path.

Publication failures preserve `published:false`, the attempted receipt path
and the existing failing Actions exit. The classifier inspects only a plain
integer HTTP status and emits one of six fixed categories. Unknown, malformed
or inaccessible status metadata gets the generic category. Exception strings,
class names, response bodies and headers are never included.

Reviewed Git blob identities for the source under test:

- Workflow: `af7b8a84662b133ede8d0caf1cb57aa291852b15`.
- Shared publisher: `17e942a186aae8c088d76bbfcd49aac48017bb0e`.
- Publisher regression suite: `0559641044f7079d59c4a49301babe0f06b3d3f3`.

## Validation

These observations are scoped to the listed contracts. Canonical aggregate
`platform_tests` evidence remains `UNAVAILABLE`; no repository-wide test count
or runtime qualification is inferred.

| Command / check | Exit | Result |
| --- | --- | --- |
| `pnpm typecheck`, pinned pnpm 10.26.1 / Node 24.19.0, before and after the bounded-error patch | 0 | 232 successful tasks, all cached in both runs |
| `python -B -m unittest discover -s platform/agents/readiness/_lib -p 'test_*.py'` | 0 | 133 readiness regression cases, nine expected PyNaCl-dependent skips |
| `uv run --no-project --with pynacl==1.6.0 python -B -m unittest discover -s platform/agents/readiness/_lib -p 'test_*.py'` | 0 | All 133 readiness regression cases completed successfully, including real Ed25519 checks; Hub calls mocked |
| Pinned `huggingface_hub==2.0.0` offline authentication contract | 0 | Explicit token requirement still selects OIDC with implicit token use disabled; exchange denial raises and does not call environment, file or Colab fallback; zero network requests |
| Final source-delta whitespace check against protected main | 0 | No whitespace errors |

A pre-commit `pnpm claims:drift` invocation exited 1 on inherited historical
catalog counts while the ordinary merge was still pending. Its immutable
baseline was the original branch's older merge base
`f2f8df6f89056e9104587674ccec0855dd5b177a`, because protected main was
not yet an ancestor of the local HEAD. The committed integration must rerun
the unchanged check with its real main ancestor; no allowlist or validator is
changed to admit historical counts.

The negative cases cover synthetic credential text, newline-delimited workflow
commands, client construction and upload denial, each missing OIDC request
field, outside-Actions denial, status-category boundaries, string/boolean/status
subclass rejection and properties that raise. They assert failed publication,
no successful upload, bounded output and no additional workflow command line.
All key/token fixtures are generated or explicit synthetic test doubles; no
real provider exception or stored credential was reproduced.

The pinned-SDK check patches `_get_token_from_oidc` to return a synthetic grant
and then raise a synthetic exchange denial while independently mocking its
environment, token-file and Colab fallback functions. Calling
`_headers.get_token_to_send(True)` with
`HF_HUB_DISABLE_IMPLICIT_TOKEN=True` succeeds only in the first case; each
fallback mock remains uncalled. This verifies SDK control flow, not provider
authentication.

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
