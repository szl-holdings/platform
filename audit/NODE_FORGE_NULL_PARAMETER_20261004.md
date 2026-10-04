# node-forge NULL-parameter supplement — 2026-10-04

## Workcell and plan

- Workcell: `platform-rsa-null-20261004`.
- Actor: ChatGPT; internal dependency source repair.
- Local input: `e9a9d4497aa463aeced2c8af792b713956d1d2ea`, the pristine-helper
  successor to PR #882 head `75bf9ed724e141969ba00ad2a1182d07f24ff6bd`.
- Recorded: 2026-10-04T17:19:02Z.
- Proof level: 2. No UI, route, deployment or application-readiness change.

The plan was recorded before source edits: reproduce nonempty primitive ASN.1
NULL acceptance with owned-key fixtures, add the exact upstream NULL guard,
bind installed bytes and the lockfile, verify compatibility through the actual
Expo consumers, and retain every advisory gate. AGENTS.md, non-negotiables,
the proof doctrine and current known gaps were reviewed for this workcell.

## Source and behavior

The prior backport checks the number of elements inside DigestAlgorithm but
accepts a primitive NULL parameter whose contents are nonempty. The fixtures
construct the DigestInfo encoding independently and sign it with a newly
generated, owned 2048-bit RSA key. Native Node crypto rejects all six new
signatures; the prior backport accepts them. This demonstrates malformed
encoding acceptance, not an ability to forge a signature without the key.

The supplement is the exact source change in
[upstream PR #1157](https://github.com/digitalbazaar/forge/pull/1157), revision
`683ab3344899cc08a581e4d5675a33e87aff7b04`. Its full `lib/rsa.js` differs from
the previous [#1152](https://github.com/digitalbazaar/forge/pull/1152) postimage
by one explanatory comment and one NULL-content condition. Both upstream PRs
were still open at review; this work does not claim an official release.

| Identity | SHA-256 |
|---|---|
| Original node-forge 1.4.0 tarball | `bf9d7ca0d774235354697bd4b5e642af6505e7ce2066762c3b855138cf870820` |
| Original RSA source | `fd4740238145ec26470eb3f06a627c72039538ce1307dbdce40521f94dfd0a50` |
| Prior #1152 RSA postimage | `acc22e5d36e27832c34e02dd3933aad7977d45b047eead5016520735efedc9c5` |
| Supplemental patch file | `7f2e5a471cdcf76fe253e7d744134be7538ab548f829e9a0916167b36faa2cdd` |
| Upstream #1157 and installed RSA postimage | `22cdfb3220439533211cf00ff7c7e6605607761d77a2c3c263411d4c70798c4f` |

The package keeps its original name, version, registry integrity and dual
license. The historical `node-forge-backport-20261003.json` remains intact;
the byte guard now reads the successor `node-forge-backport-20261004.json`.
Pinned pnpm 10.26.1 regenerated exactly four existing patch-hash bindings in
the lockfile. No other package resolution or override changed.

## MEASURED verification

| Check | Exit | Result |
|---|---:|---|
| Original 13 regression tests before supplement | 0 | 13 passed with the actual workspace Expo CLI/certificate dependencies and pristine control. |
| Expanded regressions before changing dependency source | 1, expected | 16 passed; all six new NULL-rejection cases failed with missing exceptions. Native rejection assertions passed first. |
| Pinned lockfile-only generation | 0 | Four patch-hash replacements; package resolution and registry integrity unchanged. |
| Fresh two-package installation with an empty store, scripts disabled | 0 | Exact #1157 RSA postimage; 22 regressions passed with the isolated-fixture scope explicitly identified. |
| Clean full workspace frozen install, scripts and side-effect cache disabled | 0 | 203 workspace projects installed; the actual Expo CLI and certificate chain resolves the repaired package. |
| Expanded tests after the clean workspace install | 0 | 22 passed, zero skipped, using actual Expo consumers and the genuine hash-verified pristine control. |
| Full installed RSA file versus pinned upstream #1157 | 0 | Byte-for-byte equality; both Expo consumers resolve the same patched package. |
| Pristine-helper and vulnerability-report controls | 0 | 31 passed: 25 archive/helper controls plus six report/gate controls. |
| Biome format/lint, Oxlint, `git diff --check` | 0 | Passed for the changed files. |
| Full typecheck before/after | 1 | Same nested evidence-doctrine Corepack request for pnpm 11.9.0 fails with registry DNS `EAI_AGAIN`; 37 successful tasks before, 45 after. Full-workspace verification remains incomplete. |

The expanded suite covers SHA-256 and SHA-1 NULL lengths 1, 8 and 32; all nine
malformed structures accepted by the pristine package are rejected by the
repaired package. Empty/absent NULL, legacy BER indefinite-length DigestInfo,
RSA-PSS, NONE, native signatures, Expo certificates and CSRs remain exercised.
The source change and fixtures do not establish exhaustive cryptographic
verification across every algorithm, encoding or key class.

### Installation observation

An incremental workspace reinstall relinked a new patch-hash slot containing
pristine RSA bytes. The installed-byte guard stopped the suite immediately;
the failure was not bypassed. A scoped rebuild and slot-only rematerialization
did not fix that local tree. Moving the generated root dependency tree aside
and doing a clean frozen install materialized the exact upstream postimage.
No installed RSA file was hand-edited. Hosted CI must run the installed-byte
guard, and a mismatched incremental tree needs a clean installation before
its test results can be accepted.

One typecheck verification attempt was rejected by automatic approval review
because Turbo attempted telemetry to `telemetry.vercel.com`. The subsequent
attempt used the [documented telemetry opt-out](https://turborepo.com/docs/telemetry),
`TURBO_TELEMETRY_DISABLED=1 DO_NOT_TRACK=1`; `turbo telemetry status` confirmed
Disabled. It then reached the existing registry DNS blocker above. No
telemetry exception or repository policy change was introduced.

## Security and release limits

The [node-forge advisory](https://github.com/advisories/GHSA-86w9-cpqp-85rv)
and [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) still
list no patched release at the 2026-10-04 review. The affected versions and
all audit, Grype, report and required security-gate behavior remain in force.
This supplemental source repair does not make the published vulnerability
range disappear and does not establish release approval.

No private-key material, credentials or environment values are committed.
Owned keys are generated in memory. The known-gap register records local
repair and verification limits; new hosted checks, protected integration,
mobile integration and an external release witness remain separate gates.
