# Readiness signing repair — 2026-10-11

Workcell: SZL-READINESS-SIGNING-20261011. State: BLOCKED for fleet signing and runtime qualification. This is a focused successor to draft PR #879; no protected merge is authorized in this lane.

## Source and plan

Start from origin main `952439b96efe5eccaf9474d831edb4dd46343d15` on `codex/readiness-authenticated-main-20261011`. Preserve main's dependency repairs, shared Hub writer lock, hourly/daily schedules and explicit security publication-access preflight. Port only #879's receipt authentication and unverified browser labels. Adjust the post-preflight rejection test to supply an authenticated offline signing double. Redact provider upload exception bodies in JSON and Actions annotations. Qualify the README's cadence/freshness statement. No new fleet key is generated or substituted. The prior signed local integration commit remains preserved; this successor excludes its incidental formatter changes to unrelated main files.

## MEASURED local evidence

- Combined readiness contract: `python -m unittest discover -s platform/agents/readiness/_lib -p 'test_*.py'`: 93 passed, exit 0. Includes preflight, signer, unsigned rejection, signature tampering, foreign key, failed upload and provider-error redaction.
- `node platform/agents/readiness/_lib/test_dashboard.mjs`: 3 passed, exit 0. Browser fetches remain read-only, verdicts unverified and provider text escaped.
- `python -m ruff check` on khipu.py, test_khipu_publish.py and test_hf_publish_preflight.py: exit 0.
- `git diff --check`: exit 0.
- Real installed PyNaCl: a local, in-memory ephemeral test seed successfully signed and verified a synthetic receipt; digest tampering was rejected. No provider request occurred. This does not test the established fleet identity.
- `git -c gpg.ssh.program=C:/Windows/System32/OpenSSH/ssh-keygen.exe verify-commit` verified prior commits `c8227280aecaddb1711003c01c022247916fae5f` and `0af714de299364bcda8ce2b65fafec4f8cd8e59e` against the configured allowed signers. The previously selected OpenSSH binary failed as a child process; no trust file or key was changed.

Initial `corepack pnpm typecheck` was unavailable because the integration worktree had no node_modules/turbo. Its frozen dependency installation subsequently completed, but its first broader check failed because Turbo selected the bundled fallback pnpm, which attempted dependency removal without a TTY. No full-workspace typecheck pass is claimed here. The final PR's hosted checks are the authority for the new source commit. Prior dashboard screenshots retain their original source identity and are not fresh screenshots of this successor.

## Fresh provider proof

The existing credential failure is repaired. [Security schedule 38112146764](https://github.com/szl-holdings/platform/actions/runs/38112146764) on main `952439b…` passed the explicit-token access preflight and uploaded a receipt. It still had an empty signing-key environment, `signed:false`, zero signatures and `published:true`.

Independent readback at immutable dataset revision `f9b10252b76f139d4e1f5c54b3ce9061fcb1aacf` found `receipts/readiness-security/2026-10-11/2026-10-11T04-41-04Z.json` unsigned with no signatures. Its recomputed payload hash matched `ab3ac3a316fe34683c92fc9f63eabebfb1a258906c45aac23d2c2f448c16cfd0`. This proves bytes and publication, not authenticated evidence or readiness. Corrected source must reject this unsigned upload even if provider authorization succeeds.

## Remaining gates

Current repository secret-name metadata omits KHIPU_SIGNING_KEY_B64. Organization secret metadata is denied (HTTP 403), so organization configuration remains UNKNOWN. Process/User/Machine environment presence checks found no readiness seed. Preserve the established key and restore it through its authorized secret-management path; Git commit signing and Khipu receipt signing are different identities.

Repository variable metadata and the current scheduled log do not provide flagship or collector targets. The required URLs remain unset; runtime qualification is BLOCKED until the actual targets are configured and independently probed.

Historical security failures on old PR head are not the validation authority for the updated head. Current main contains #905's braces/node-forge remediation. New hosted security and required checks, signature verification and remote head readback must be reported for the final pushed commit. No protected merge, deployment, paid compute, model training or new release qualification is claimed.
