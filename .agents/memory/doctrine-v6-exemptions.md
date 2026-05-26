---
name: Doctrine v6 scanner exemptions
description: When a forbidden-token hit should be added to EXCLUDE_PATH_PREFIXES, get a // doctrine-scanner-exempt marker, or be fixed at the source.
---

`scripts/check-doctrine-v6.mjs` scans the repo for renamed-token drift. Three escape hatches:

1. **`EXCLUDE_PATH_PREFIXES`** (path-level allow-list at the top of the script). Use for: dated/frozen historical payloads (`dossier/payload-YYYY-MM-DD/`), vendored mirrors (`vendor/`, `packages/payload/`), generated artifacts whose names embed the old token (`packages/frontier-mythos/`), and metadata files whose values are themselves the historical receipt (`.agents/agent_assets_metadata.toml`).
2. **`// doctrine-scanner-exempt`** (file-level marker comment). Use for source files where a small contiguous block legitimately references the old token (e.g. migration shims) but most of the file is greenfield. Less heavy-handed than path exemption.
3. **Fix at the source.** Default choice when neither of the above applies — rename the token in the code/comment/string.

**Why:** Without discipline the scanner becomes useless (every new hit just gets path-exempted). The "frozen historical receipt" principle is what justifies path exemption: dated dossiers are write-once provenance; renaming them after the fact destroys the audit chain. Conversely, live source files like `artifacts/api-server/src/routes/foundry-deepseek-v4.ts` should be fixed at the source — they are mutable doctrine, not receipts.

**How to apply:** For a new hit, ask: is this file dated/frozen/vendored, or is it active doctrine? If frozen, path-exempt with a comment explaining why renaming would invalidate provenance. If active, fix the token. Use the file-marker form only when most of the file is correct and a single legacy reference cannot be cleanly removed.
