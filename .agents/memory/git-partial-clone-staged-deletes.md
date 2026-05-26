---
name: Partial git clones leave phantom staged deletes
description: --filter=blob:none plus an LFS smudge failure produces an index full of staged-deletion entries; a naive commit captures all of them.
---

When cloning a large repo with `git clone --filter=blob:none` (or `--depth=1` against a server that can't satisfy it) and the checkout step partially fails — most commonly an `lfs smudge filter failed` on a single LFS asset — git aborts the working-tree checkout but **leaves the index populated with the full tree**. The result: `git status -s` shows thousands of lines that look like `D path/...` (staged deletion), because the index has the blob and the working tree does not.

A plain `git commit` after `git add <two specific files>` will still capture **all those staged deletes** along with your intended change. The push succeeds, the PR (if opened) deletes the entire codebase.

**Why:** Once burned an entire repo's worth of phantom deletions into a security-fix branch on a private repo. Caught it before opening a PR, force-deleted the remote branch, but it was a near miss.

**How to apply:**
- For one-off edits to a repo you don't already have checked out, prefer **`GIT_LFS_SKIP_SMUDGE=1 git clone --depth=1 --single-branch --branch <main> <url>`** — no blob filter, just shallow + LFS skipped.
- After any partial / filtered clone, sanity-check before the first commit:
  - `git status -s | wc -l` should be `0` on a fresh clone. Anything else means a broken checkout.
  - `git diff --cached --name-only` after `git add` should list **exactly** the files you intended.
  - `git show --stat HEAD` immediately after commit — if `changed_files` is in the thousands, abort and re-clone.
- If you already pushed a bad branch, force-delete the remote ref **before** opening a PR: `git push origin --delete <branch>`. No PR = no review trail = clean recovery.
