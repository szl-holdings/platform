# A11OY_PROOF_DOCTRINE.md — Proof Packet and Proof Levels

Proof is the unit of trust in A11oy. Every completed Workcell, agent run, or significant platform action must produce a Proof Packet. Proof is not documentation — it is evidence.

---

## Proof Packet Fields

Every Proof Packet must include:

| Field | Description |
|-------|-------------|
| `workcell_id` | The Workcell ID this proof belongs to (or task/session ID for non-Workcell work) |
| `agent` | The named agent or human actor who produced the work |
| `objective` | Restatement of the Workcell objective from the plan |
| `plan_summary` | What was planned before execution began |
| `patch_summary` | What was changed: files modified, lines added/removed, behavior changed |
| `test_results` | Command run, exit code, output summary for every check executed |
| `screenshot_refs` | Filenames and routes of all screenshots captured, with links to `audit/screenshot-catalog.md` |
| `verification_notes` | How the agent confirmed the patch meets the objective criteria |
| `public_claim_check` | Confirmation that no unqualified public claims were introduced |
| `security_check` | Confirmation that no secrets, tokens, or `.env` values were committed |
| `known_gaps_update` | Any new gaps introduced or closed, recorded in `docs/operations/known-gaps.md` |
| `proof_level` | The proof level achieved (1–5, see below) |
| `recorded_at` | ISO 8601 timestamp |
| `recorded_by` | Agent or human who assembled the proof packet |

---

## Proof Levels

| Level | Name | Requirements | When to Use |
|-------|------|-------------|-------------|
| **1** | Minimal Proof | Plan summary + patch summary + commit message | Documentation-only, zero-risk changes |
| **2** | Standard Proof | Level 1 + test results (exit codes) + verification notes | Code changes to non-critical paths |
| **3** | Evidence Proof | Level 2 + at least one live screenshot per modified UI surface | Any change affecting a UI surface |
| **4** | Full Proof | Level 3 + public claim check + security check + known-gaps update | Any public-facing change or route change |
| **5** | Release Proof | Level 4 + full screenshot catalog entry + MirrorEval assessment + Release Readiness Score | Any release candidate, public deployment, or investor demo preparation |

The proof level required is specified in the Workcell definition. When in doubt, default to Level 3 for any code change and Level 4 for any public-facing change.

---

## Screenshot Proof Rule

A screenshot submitted as proof must:

1. Be captured live from the running application (not a design tool, not a static image).
2. Show the exact route or surface that was modified.
3. Be stored in `docs/assets/screenshots/current/` with an ISO-date filename.
4. Have a corresponding entry in `audit/screenshot-catalog.md`.
5. Be free of placeholder data, error states, and loading spinners (unless the change specifically relates to error or loading handling).

A screenshot that does not meet these criteria does not count as proof. See `docs/A11OY_SCREENSHOT_DOCTRINE.md` for the complete screenshot quality rules.

---

## Proof Ledger

The Proof Ledger is the immutable, append-only record of all Proof Packets. It is:

- **Immutable.** Once a Proof Packet is recorded, it is not modified or deleted.
- **Append-only.** Corrections are recorded as new entries referencing the original.
- **Auditable.** Every entry includes actor attribution, timestamp, and Workcell reference.
- **Linked to outcomes.** Proof Packets are linked to the Outcome Graph so the full chain (signal → recommendation → decision → action → outcome → proof) is traceable.

In Phase 1 (active prototype), the Proof Ledger is maintained as audit files in the `audit/` directory. In Phase 2, it will be implemented as a governed database table with cryptographic signing.

---

## Minimum Proof Obligation

Every merged change must have, at minimum:

- A commit message that states what changed, why, and what was verified.
- A reference to the task number or Workcell ID.
- A typecheck pass result recorded (even if informal).

This is Proof Level 1. It is the absolute floor. Do not commit without it.
