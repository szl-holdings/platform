# Local host operations proof - 2026-10-02

- Workcell: `LOCAL-HOST-OPERATIONS-2026-10-02`.
- Objective: execute the free local cyber observations and close misleading
  finance/data scope claims while preserving release and provider evidence gates.
- Actor: Codex with bounded implementation and read-only review agents.
- Plan: inspect host permissions and disk, recover only inactive regenerable
  data, test scope gates and bounded observation scripts, install/run the limited
  task, request normal Windows elevation for logging/readback, verify a source
  restore, and retain honest gaps. No UI surface or route changed.
- Base local branch: `9f339e19d3c8dbaba7d032f8098f27ba37f45195`.
- Current shared cyber source observed: `d887bacbf34ce6a58bd6c16c211bebc79cb20075`.
  The immutable-head verifier refinement and current gaps/index were carried
  forward from this signed successor rather than reverting its newer evidence.
- Proof level: 2, local source, host configuration, and bounded task evidence.
  This is not release proof or a witness for customer workflows.
- Recorded by: Codex, `2026-10-03T01:20:17Z` (October 2, New York).

## Source behavior

`finance.portfolio-snapshot`, `finance.budget-forecast`,
`data.portfolio-financials`, and `data.lp-reports` accepted identifiers/filters
which their global-record queries did not enforce. Their manifests now disable
gateway invocation; direct handlers validate inputs and throw explicit
unavailable errors before DB access. Re-enable only with admitted scoped data
and target-specific source/result proof.

The Windows collector adds retained-event counts for published Defender event
types 1116-1119 over the last 24 hours, capped at 1,000 with lower-bound
semantics when truncated. It emits no event text or private host identifiers.
Zero retained events never asserts absence of threats. The local evolution
wrapper requires the new section, and the source verifier reads its committed
blob through the observed immutable Git revision.

The launcher pins reviewed collector bytes, fails closed for missing/stale or
invalid evidence, and atomically retains one receipt under 4,096 bytes. A reader
checks source hash, schema/status consistency, observation time, and 36-hour
expiry before exposing it. The limited daily task needs the user logged in.
Receipts are local observations; they are not independently authenticated.

## Executed host work

The task `SZL Local Host Security Observation` was installed with Interactive
logon, Limited run level, daily 09:15 Eastern local time, IgnoreNew overlaps,
StartWhenAvailable, and a five-minute limit. It was started and completed with
task result 2 and a valid 1,422-byte `PARTIAL` receipt. A second live task run
confirmed all three profiles' logging enabled. Collector SHA-256:
`68b56ec5788ffb12d240db7dc0ffeae5e3714c98b1e207d90155e53a5128f1e8`.
Installed launcher SHA-256:
`5e55076809ba1a08c12cdcb4b8b090bf7bbce8633bb657b574a2e02b96221e1a`.

Normal Windows elevation succeeded for `Enable-LocalFirewallLogging.ps1` and
the separate read-only collector helper. Effective firewall profile read-back
confirmed allowed and blocked logging, separate profile log paths, and a
20,480 KB cap each. Log files existed and Private/Public sizes grew beyond the
header, proving writes. A prior-setting snapshot is retained for rollback.
No firewall access rules were added, and no reboot was performed.

The elevated observation at `2026-10-03T01:11:19Z` (October 2, New York) found
Defender antivirus, real-time and behavior monitoring on, signatures age zero,
Tamper Protection off, C: fully encrypted with protection on, and backup query
`UNKNOWN/QUERY_FAILED`. Limited runs retain `UNKNOWN/ACCESS_DENIED` for
encryption/backup. Only aggregate TCP listener counts are exposed; listener
presence is not public reachability or compromise evidence.

`Test-LocalEvidenceRestore.ps1` copied the two installed source files into a
same-volume ZIP, restored them into an isolated directory, compared both
SHA-256 values, retained one 5,590-byte archive and bounded receipt, and removed
its own temporary stage. It returned `RESTORE_VERIFIED`, exit 0.
This does not establish off-device backup or whole-computer recovery.

An exact inactive WinGet Docker installer (627,791,792 bytes) was removed after
path containment, process and exclusive-open checks. Free bytes rose from
1,556,582,400 to 2,184,458,240 immediately. Docker and WSL were untouched. A
native pnpm cache prune removed zero package bytes. Shared checkouts, hardlinked
package stores, models, downloads, and active Remote Desktop traces were retained.

## Verification

| Check | Result |
|---|---|
| Tool-mesh Vitest package run, one worker | Exit 0, 125 tests in 6 files after the four scope blocks. |
| Direct scope/input tests | 8 tests cover four disabled handlers; gateway tests deny each even under an allow rule. |
| Launcher/reader PowerShell tests | Exit 0: complete, partial, stale collector, missing event section, hash mismatch, fresh receipt, expired receipt. |
| Real limited task start/readback | Completed, result 2; fresh source-bound PARTIAL receipt; all profile logging flags true. |
| Real elevated helper/readback | PARTIAL: encrypted/protected C: observed, backup unavailable, Tamper Protection off. |
| Firewall configuration and log files | Effective configuration verified; Private/Public files contain writes. |
| Source-file backup/restore | Exit 0, both restored hashes match; same volume only. |
| Six-lane verifier tests after immutable-head refinement | Exit 0, 5 tests, including a HEAD move between reads. |
| PowerShell and TypeScript syntax checks | Zero parsing diagnostics in reviewed changed files. |
| `corepack pnpm typecheck` | Exit 1 before checking code: Turbo cannot find package-manager binary. Same infrastructure failure as prior local baseline. |
| Tool-mesh `tsc --noEmit` in sparse checkout | Exit 1: missing Node types and four sparse project-reference directories (`TS2688`, `TS6053`). No typecheck pass claimed. |
| Biome lint of the four affected source/test files | Exit 0 with five existing non-null assertion warnings. A prior full check reported existing formatting in the domain-data file and formatting in the new test blocks; test blocks were formatted. |
| UI screenshots/route checks | Not applicable: no UI or routes changed. |

Sparse Vitest setup initially failed before assertions. Small source/test
tsconfig files bound the transform to the package, and ignored junctions reused
existing package dependencies without an install. The final suite then passed.

## Release and business evidence

At shared head `d887bacbf34ce6a58bd6c16c211bebc79cb20075`, PR 882 remained draft
and BLOCKED. Hosted Typecheck, Unit tests, Runtime Audit, E2E, and severity-gate
passed, while dependency vulnerability scan, Grype HIGH/CRITICAL gate and
Security Gate failed. Its vulnerability report identified HIGH
`node-forge@1.4.0`, `GHSA-86w9-cpqp-85rv` / `CVE-2026-85393`, through Expo's
development-tool path; the reviewed advisory listed no patched version.
The separate Grype log did not establish its finding's advisory identity.
No threshold was lowered or advisory suppressed. A final attempt to refresh
the active ruleset returned HTTP 403 for API rate limiting, so no remote
publication or protected-branch mutation was attempted.

The six lanes remain declared demos with unavailable live inputs and blocked
external effects. Free host/source observations do not prove customer finance,
property, legal, data-access, SIEM, containment, or production operations.
Protected merge, provider publication, deployment, and external witness remain
separate required evidence. No credential, environment value, private key, or
private host identifier was added to source or this proof. Known gaps rev 34
records the remaining operational gates.

References: [Microsoft Firewall logging](https://learn.microsoft.com/en-us/windows/security/operating-system-security/network-security/windows-firewall/configure-logging),
[Microsoft Defender event types](https://learn.microsoft.com/en-us/defender-endpoint/troubleshoot-microsoft-defender-antivirus),
[Tamper Protection configuration](https://learn.microsoft.com/en-us/defender-endpoint/tamper-protection-windows-configure),
[reviewed node-forge advisory](https://github.com/advisories/GHSA-86w9-cpqp-85rv).
