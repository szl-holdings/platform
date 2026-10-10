# A11oy Atelier Proofweave Workcell

- `workcell_id`: `A11OY-ATELIER-PROOFWEAVE-20261003`
- `status`: `IN_PROGRESS`
- `evidence_class`: `DECLARED`
- `recorded_at`: `2026-10-03T00:00:00-04:00`
- `recorded_by`: `CodexSmith`

## Objective

Ship an original A11oy Proofweave compile-only research-planning surface across the Atelier core,
runtime API, CLI, and operator UI without copying vendor code or trade dress and without
misrepresenting compilation as execution, persistence, deployment, provider availability, or
independent proof.

## Plan

1. Preserve the deterministic `PATTERN -> CUT -> STITCH -> FITTING -> LABEL` compiler and its
   fail-closed policy, license, revision, capability, and budget boundaries.
2. Bind each accepted response to the exact tenant, request, policy contract, and canonical
   SHA-256 plan digest through one shared verifier used by browser and CLI clients.
3. Keep browser access fail closed outside local development until a server-side authenticated
   session or BFF exists; never expose the runtime API key to browser code.
4. Exercise core, API, CLI, UI, typecheck, formatting, route, claim, and secret checks and record
   every result without weakening an existing gate.
5. Merge the current protected-source baseline forward into the feature branch without rebasing or
   force-pushing, preserving the newer Grok 4.7 and session-continuity work.
6. Capture the final UI live from an exact 40-character committed revision, hash the screenshot,
   register its metadata, and assemble a Proof Level 4 packet.
7. Create signed commits, push the feature branch, open a pull request, and drive it to merge-ready
   while leaving the owner-controlled merge action untouched.

## Success Criteria

- Altered tenant, request, claim, policy, stage, material, review, limitation, or digest data is
  rejected before a client renders or prints it as proof.
- Browser production mode exposes no API key and clearly reports the unavailable authenticated
  transport as `BLOCKED`; runtime/provider evidence remains `UNKNOWN` unless separately measured.
- Canonical focused tests and typechecks pass, or any unrelated repository baseline failure is
  reproduced and recorded as no worse than baseline.
- The final screenshot and Proof Packet are bound to the exact final source revision.
- No secret, force-push, history rewrite, deployment claim, model execution, or owner-only merge
  occurs.

## Initial Evidence Boundary

This plan is `DECLARED`. The feature remains `SIMULATED` and compile-only until the recorded checks
are run. Hosted CI, protected merge, deployment, durable ledger persistence, provider inference,
source retrieval, and independent replay are `UNKNOWN` at workcell start.
