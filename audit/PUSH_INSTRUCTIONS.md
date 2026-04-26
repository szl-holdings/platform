# Push Instructions - A11oy GitHub Alignment

**Date:** 2026-04-26
**Branch:** `codex/a11oy-github-alignment-2026-04-26`
**Remote:** `origin` -> `https://github.com/szl-holdings/szl-holdings-platform.git`
**Target PR base:** `main`

## Current State

The local Replit export is the active source tree. Compared with GitHub `origin/main`:

- Local branch is `2091` commits ahead.
- GitHub `main` has `1` commit not present locally.
- That GitHub-only commit adds the archived `.github/workflows/prism-counsel-ci.yml`; this branch preserves it.
- GitHub connector reports no open PRs and no open issues as of 2026-04-26.
- Prior PR #37 is closed and not merged.

## Remote Hygiene

The local `origin` and `github` remotes are configured without embedded credentials:

```bash
origin https://github.com/szl-holdings/szl-holdings-platform.git
github https://github.com/szl-holdings/szl-holdings-platform.git
```

Do not embed a PAT in the remote URL. Use Git Credential Manager, SSH, or a temporary credential helper if GitHub requires authentication.

## Push

```bash
git push -u origin codex/a11oy-github-alignment-2026-04-26
```

If GitHub rejects the push with a workflow-scope error, authenticate with a token that has `repo` and `workflow` scope, then retry the same command. Do not force-push `main`.

## Open PR

After the branch is pushed, open a draft PR:

- Base: `main`
- Head: `codex/a11oy-github-alignment-2026-04-26`
- Title: `chore(github): align A11oy Replit export with public proof surfaces`
- Body: use `PR_DRAFT.md`

## Merge Conditions

- CI completes or environment-only failures are documented.
- At least one CODEOWNER review approves.
- Branch protection is enabled for `main`.
- Secret scan is clean.
- Public README/profile screenshots render on GitHub.

## Notes

- Never force-push or rewrite GitHub history.
- Never commit `.env` files or secrets.
- Do not delete Replit mirror remotes unless explicitly requested; they are local infrastructure metadata and not part of the GitHub PR.
- If the embedded token that previously appeared in local git config is still active, rotate it before treating the environment as clean.
