# A11OY_NON_NEGOTIABLES.md — Hard Rules

These are unconditional rules. There are no exceptions. When in doubt, halt and escalate rather than proceed.

---

## Security

1. **No secrets committed.** No API keys, tokens, database URLs, credentials, `.env` file contents, service account JSON, or private keys may appear in any committed file. This includes markdown, documentation, comments, and test fixtures.
2. **No `.env` files committed.** The `.gitignore` must cover `.env`, `.env.local`, `.env.*.local`, and `*.env`. The only exceptions are `.env.example` and `.env.*.example`.
3. **No database dumps committed.** No `*.dump`, `*.pgdump`, or `.sql.gz` files outside the `.gitignore` pattern.
4. **No hardcoded credentials.** All runtime credentials must come from environment variables. No default passwords in code.
5. **Gitleaks or equivalent must be clean before release.** Any secret detection hit blocks the release.

---

## Public Claims

1. **No unverified production claims.** Do not claim production customers, ARR, MRR, customer counts, or partnership agreements unless documented and verified in `docs/platform-facts.md` or the source-of-truth registry.
2. **No compliance certifications without certification.** Do not claim SOC 2 Type II, ISO 27001, HIPAA compliance, or any other compliance certification that has not been awarded. Use "architected for [standard] readiness" or "roadmap" language.
3. **No live integrations for mock connectors.** If an integration is simulated, call it a "mock connector" or "future connector target." Do not imply live data exchange that does not exist.
4. **No inflated metrics.** Do not state signal counts, route counts, uptime statistics, or performance numbers that are not derived from verified, current measurements.
5. **Use the approved qualifiers.** See `docs/A11OY_PUBLIC_CLAIMS_DOCTRINE.md` for the full approved qualifier list.

---

## Product Naming

1. **The product is A11oy.** Never Bo11y, Bolly, or Boss. These names are retired and must not appear in any committed file, UI label, comment, or documentation.
2. **A11oy is the Live Enterprise Execution Fabric.** Do not introduce alternative descriptors without explicit product decision authorization.
3. **Named agents have exact names.** Do not rename, abbreviate, or merge the 18 named agents without doctrine update authorization. See `docs/A11OY_AGENT_DOCTRINE.md`.
4. **Vendor names are not product names.** Do not use competitor product names (Copilot, Cursor, Codex, etc.) as analogies for A11oy features in public-facing copy.

---

## Screenshots

1. **All screenshots must be live captures.** Captured from the running application in this Replit workspace. No Figma exports, no design mockups, no stock photos, no placeholder screenshots.
2. **Screenshots must show a real application state.** No blank screens, error pages, loading spinners (unless documenting an error), or empty data states labeled as finished.
3. **Screenshot metadata is required.** Every screenshot used as proof must have a corresponding entry in `audit/screenshot-catalog.md` with filename, route, capture date, and agent or human who captured it.
4. **Placeholder data is not acceptable in proof screenshots.** "LOREM", "TODO", "PLACEHOLDER", and "EXAMPLE DATA" labels must not appear in screenshots submitted as proof of a done state.

---

## Repo Changes

1. **Additive only unless explicitly authorized.** Do not delete files, delete directories, rename artifacts, restructure packages, or remove routes without explicit task authorization.
2. **No force-push.** `git push --force`, `git push --force-with-lease`, and history rewrites are unconditionally forbidden.
3. **No destructive database operations without authorization.** `DROP TABLE`, `DELETE FROM` without a WHERE clause, and `TRUNCATE` require a full backup confirmation and explicit task authorization.
4. **The `.gitignore` is additive only.** Only append missing security/env/build patterns. Do not reorder, remove, or restructure existing entries.
5. **`.env` and CI configuration are out of scope for routine doctrine tasks.** Only touch them when the task explicitly authorizes it.

---

## Agent Behavior

1. **Agents must read this file before executing.** No exceptions. Reading AGENTS.md and A11OY_NON_NEGOTIABLES.md is Step 1 of every agent session.
2. **Agents must not exceed their defined scope.** See `docs/A11OY_AGENT_DOCTRINE.md` for each agent's blocked actions.
3. **Agents must produce a Proof Packet.** Every completed task requires a Proof Packet. See `docs/A11OY_PROOF_DOCTRINE.md`.
4. **Agents must not introduce vendor copy.** All language must be original A11oy / SZL Holdings doctrine. No lifted copy from Claude, Cursor, Copilot, Codex, OpenAI, Google, or any other vendor's UI, documentation, or marketing.
5. **When in doubt, halt.** The correct response to uncertainty about a non-negotiable is to surface the uncertainty and halt — not to proceed with a best guess.
