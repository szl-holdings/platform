# ADOPTED_OSS — SZL attribution manifest

Fashion-thinking doctrine: take what is **openly licensed** (MIT/Apache/ISC),
rebuild it **SZL-native with attribution**, transform-by-proof. **Never** copy
no-license / all-rights-reserved code (that injects infringing code and kills
the provenance moat). This file lists every upstream whose *idea or ergonomics*
informed an SZL tool, the upstream license, the SZL commit, and how we
transformed it. No upstream source is copied; only high-level approach is reused.

| SZL artifact | Upstream inspiration | Upstream license | SZL commit | Transformation |
|---|---|---|---|---|
| `tools/szl_estate_auditor.py` | [jkdevcode/repo-inspector](https://github.com/jkdevcode/repo-inspector) | MIT (About metadata) / ISC (LICENSE file) — both permissive | `7e762de` (#376) | Independent, original SZL implementation. Only the high-level idea — "one command → auto per-repo health report" — is reused. SZL adds estate-wide health/alignment scoring (RED/STALE/UNLICENSED/GREEN), push-event-vs-scheduled CI disambiguation, and an honesty contract (unreachable fields → `unavailable`, never fabricated). Pure stdlib + `gh` CLI; no upstream source copied. |
| `tools/szlctl.py` | [jkdevcode/smart-job-cli](https://github.com/jkdevcode/smart-job-cli) + [jkdevcode/gh-follow-sync](https://github.com/jkdevcode/gh-follow-sync) | MIT | `24ea64f` (#377) | Original SZL code; only CLI *ergonomics* (a single clean subcommand entrypoint) are inspired. Subcommands are SZL-specific: `surfaces`/`prs`/`fabric`/`forge`/`posture` over the live estate. Read-only (mutates nothing); honesty contract (fetch failure → `unavailable`, retries, never crashes). Pure stdlib (`urllib`+`subprocess`); no upstream source copied. |

## Rules
- **NO no-license repo enters the tree.** All-rights-reserved = do not even read-for-port.
- Keep `# ATTRIBUTION` / SPDX headers and the repo `NOTICE` entry intact — that is what keeps the estate clean.
- When a new openly-licensed upstream informs an SZL tool, add a row here in the same PR that lands the tool.
- Transform-by-proof: SZL ships the *idea* re-implemented + verified, never the upstream bytes.

_Doctrine v11: openly-licensed-only + attribution + transform-by-proof; never plagiarize._
