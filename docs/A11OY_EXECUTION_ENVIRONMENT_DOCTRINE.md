# A11oy Execution Environment Doctrine

A11oy work is provider-neutral and source-bound. Replit is not required and is not an authority boundary.

## Authority

The accepted execution environment is any repository-controlled environment that can prove the exact source, commands, outputs, and limitations of the work. Accepted classes are:

- GitHub Actions;
- protected preview deployments;
- authenticated Codespaces or Cursor Cloud workspaces;
- local exact-head checkouts;
- another environment explicitly admitted by a protected doctrine change.

## Required identity

Every proof-producing run records:

1. repository and exact 40-character source revision;
2. workflow run URL/ID or exact command sequence;
3. dependency lockfile identity and runtime/toolchain versions;
4. route, viewport, and capture timestamp for UI evidence;
5. SHA-256 for every retained artifact;
6. test results and terminal failure state;
7. limitations, unavailable dependencies, and non-claims.

## GitHub-native default

GitHub Actions is the default shared execution rail because it checks out exact revisions, exposes immutable run identity, and retains artifacts. The repository workflow `.github/workflows/screenshot-proof.yml` provides the canonical UI capture path.

## Prohibited shortcuts

- treating a provider name as proof;
- copying a prior screenshot into the current directory without recapture;
- accepting a floating branch or unrecorded source revision;
- treating preview reachability as production readiness;
- silently replacing a failed capture with cached evidence;
- requiring a retired vendor workspace when an exact-source repository-controlled path exists.

## Migration note

`docs/A11OY_REPLIT_CODEX_DOCTRINE.md` is retained as historical compatibility documentation. Where it conflicts with this file, this provider-neutral doctrine and `AGENTS.md` govern.
