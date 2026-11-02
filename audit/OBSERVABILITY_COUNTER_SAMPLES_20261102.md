# Observability counter sample evidence — 2026-11-02

Workcell: `OBSERVABILITY-COUNTER-SAMPLES-20261102`.
Status: locally tested source candidate; runtime qualification remains open.

## Problem and change

The readiness observability executor marked a required counter present whenever
its name occurred anywhere in an HTTP-successful response. A HELP comment, a
longer metric name, a label value or HTML prose could therefore create positive
counter evidence without any corresponding sample. The candidate recognizes
complete exact-name Prometheus text samples, validates label syntax and unique
label names, and requires finite nonnegative values and bounded integer
timestamps. A final line without its newline is unproven because the existing
HTTP reader has a bounded response length.

The required counter list, output schema, publication and unsigned-receipt
rejection gates remain unchanged. Missing URLs retain their existing skipped
behavior. Missing collector configuration remains unknown trace propagation.
No endpoint is fabricated and no provider interaction is needed for this fix.

## Source binding and ownership

Base commit: `dca2db629a2d10ecfe27343f1e24843e4f25acd3`.
Base tree: `a191f189250c295ca9fc5244257f7a68c393f93e`.
Source copies for the bounded readiness suite and required repository guidance
were checked against their exact Git blob identities. The recursive tree was
complete. Root `AGENTS.md` and `.github/CODEOWNERS` apply; no more specific
readiness instruction file was found. Python ownership includes the development
and core teams. Main and the open pull request list were refreshed before
packaging; the main SHA was unchanged. The separate filename repair in #997,
canonical JSON repair in #995, probe evidence repair in #994 and security
documentation repair in #992 are not implemented here.

Changed scope: observability executor, its README, a new fleet-discovered
unittest module, an additive known-gaps entry and this proof. No UI, routes,
database, dependencies, workflows, permissions, credential bindings or
deployment behavior changed; screenshots and route/database checks do not
apply. Plan recorded before patching.

## Measured local validation

All requests were replaced by offline response doubles; no target was probed.

| Check | Result |
|---|---|
| New actual-executor regression module on original source | 12 cases run; 24 failing assertions including subcases; exit 1 |
| New module on candidate source | 12 cases run; no failures or skips; exit 0 |
| Original readiness fleet, standard-library isolation | 146 cases run; 133 successful and 13 optional-dependency skips; exit 0 |
| Candidate readiness fleet, standard-library isolation | 158 cases run; 145 successful and the same 13 skips; exit 0 |
| Python syntax compilation | Changed Python files compile |
| Scoped source secret scan | CLEAN for the five changed files |
| Scoped claims parser | New proof and gap entry accepted using unchanged base metrics and no allowlist |
| Full monorepo typecheck | UNAVAILABLE; before and after commands stop before TypeScript execution because installed pnpm 11.25.0 differs from required 10.26.1 |

Regression coverage includes comments, name prefixes/suffixes, unrelated label
values, HTML/arbitrary text, malformed and duplicate labels, nonfinite and
negative values, timestamp bounds and excessively long timestamps, complete
ordinary/quoted samples and escapes, non-success HTTP responses, truncation,
and missing collector configuration. Existing CI discovers the new module via
`python -B -S -m unittest discover -s platform/agents/readiness/_lib -p 'test_*.py'`.
The optional real-crypto and pinned-SDK checks were not executed locally;
their dependency skips do not establish their behavior. Canonical platform-wide
test results remain UNAVAILABLE. No hosted exact-head result is claimed.

## Remaining operational contract

This parser establishes sample presence only. It does not prove counter type,
freshness, monotonicity, collector continuity or end-to-end readiness. Other
exposition formats, including OpenMetrics exemplars, remain unproven by this
bounded text parser. Runtime owners must supply approved `A11OY_URL`,
`AMARU_URL`, `SENTRA_URL`, `KILLINCHU_URL`, `ROSIE_URL` and
`OTEL_COLLECTOR_URL` bindings for the intended targets. The collector `/recent`
contract still uses the existing trace-ID observation logic and needs separate
runtime qualification. Receipt publication still requires the approved fleet
`KHIPU_SIGNING_KEY_B64` binding and either the existing local token path or the
exact dataset-scoped OIDC publisher grant, followed by independent signed
receipt readback. Configuration names are not evidence that bindings exist.

No secret was created or read, no account probed, no workflow dispatched, and
no deployment or merge performed. Protected admission, required reviews and
signature policy remain effective. Rollback is a protected revert; there is no
migration.

## Primary reference and provenance

The [Prometheus exposition format specification](https://prometheus.io/docs/instrumenting/exposition_formats/)
defines line-oriented metric samples, comments, labels, numeric values,
optional timestamps and terminating newlines. The parser and regressions are
first-party implementation for this owner's repair request under the existing
repository license; no external implementation was copied. No independent
human review, DCO certification or verified candidate commit signature is
claimed.
