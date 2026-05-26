---
name: Artifact TOML and configureWorkflow quirks
description: Safe editing patterns for .replit-artifact/artifact.toml and the stale-counter bug in configureWorkflow.
---

Two related platform pitfalls when modifying artifact wiring:

1. **Never write `.replit-artifact/artifact.toml` directly** with the `write` or `edit` tool. The platform recomputes a checksum and will reject or silently revert the change. Use the `verifyAndReplaceArtifactToml` callback: write the proposed content to `.replit-artifact/artifact.edit.toml`, then call `verifyAndReplaceArtifactToml({tempFilePath, artifactTomlPath})` with absolute paths.

2. **`configureWorkflow` can report a stale workflow count.** After calling `removeWorkflow`, the internal counter that enforces the 10-workflow limit may not decrement, so a subsequent `configureWorkflow` fails with `Workflow limit exceeded (12/10)` and lists phantom workflows that `listWorkflows` no longer returns. There is no reliable invalidation. The practical workaround is to avoid editing the workflow command and instead make the existing command succeed — e.g. drop a binary into one of the directories already on the workflow PATH (`node_modules/.bin`, `.config/npm/node_global/bin`, `.pythonlibs/bin`) rather than re-issuing the command with a different `$PATH` export.

**Why:** Both failure modes are silent and look like agent errors. Direct toml edits appear to succeed but the workflow keeps running with the old config. Phantom limits in `configureWorkflow` cannot be cleared from the agent side.

**How to apply:** Default to `verifyAndReplaceArtifactToml` for any artifact toml change. Before debugging a `configureWorkflow` rejection, cross-check `listWorkflows()` — if the rejection lists workflows not in the live list, it's the phantom-counter bug. Pivot to PATH-side fixes.
