# NEXUS — Scope of Truth (Guardrails)

**Source of truth.** Everything any code, doc, demo, or contributor claims about
NEXUS must be consistent with this document. If you find a conflict, this file
wins. If you need to change scope, open a separate Project Task — do not
quietly drift.

NEXUS is `artifacts/mockup-sandbox` served at `/nexus/`. It is an internal
agentic-AI sandbox / design surface for parallel research, persistent memory,
protocol-bridge, and orchestrator concepts. It is **not** a customer-facing
product.

---

## In Scope (the box)

NEXUS may:

1. Render demo UI for the four agentic pillars (Parallel Research Swarm,
   Persistent Memory + Skills Library, Universal Protocol Bridge, Cross-App
   Orchestrator) using **scripted, pre-written demo data** from
   `artifacts/mockup-sandbox/src/data/`.
2. Reuse shared design tokens, UI primitives, utilities, and types from
   `packages/*` and `lib/*` (the only allowed external code surface).
3. Call same-origin endpoints under `/api/nexus/*` only — these are themselves
   sandbox endpoints implemented in `artifacts/api-server/src/routes/nexus.ts`
   and may not reach external networks.
4. Use Framer Motion (already a dep) for choreographed scripted moments,
   visualizations, and Cinema mode.
5. Display a visible "Demo data — scripted runs" badge in its header so the
   surface itself is honest about being a demo.

## Out of Scope (the seven hard rules)

The following items are **out of scope and enforced by `pnpm check:nexus-scope`**.
Verbatim from the original brief:

1. **No imports from another feature artifact.** That includes
   `artifacts/sentra`, `artifacts/command`, `artifacts/pulse`, `artifacts/terra`,
   `artifacts/vessels`, `artifacts/counsel`, `artifacts/aegis`,
   `artifacts/lyte-command-center`, `artifacts/carlota-jo`,
   `artifacts/szl-holdings`, and `artifacts/szl-holdings-mobile`.
2. **No imports from `@szl/alloy`, `packages/alloy/`, or `packages/szl-alloy/`.**
   NEXUS must not couple to the Alloy runtime facade.
3. **No real outbound network calls.** No `fetch(`, `axios`,
   `XMLHttpRequest`, or webhook URLs hitting non-allowlisted hosts. The only
   allowlist is same-origin `/api/nexus/*`.
4. **No live model-inference / vector-search SDK imports.** That includes
   `openai`, `@anthropic-ai/sdk`, `@google/generative-ai`, `pinecone`,
   `weaviate`, and similar.
5. **No real auth / billing / tenant SDKs** inside the artifact's `src/`. That
   includes `stripe`, `clerk`, and real session-handling middleware.
6. **No modification of `@szl/alloy`** (or `packages/alloy`,
   `packages/szl-alloy`) from this artifact.
7. **No changes to the mobile artifact** (`artifacts/szl-holdings-mobile`).

## Allowed reuse surface

Only these directories may be imported from `artifacts/mockup-sandbox/src/`:

- `packages/*` — shared design system primitives, tokens, contracts (with
  the alloy exception above).
- `lib/*` — shared utilities, schemas, types.
- Same-artifact relative paths inside `artifacts/mockup-sandbox/src/`.
- Same-origin API calls to `/api/nexus/*` only.
- Standard third-party deps already declared in
  `artifacts/mockup-sandbox/package.json` that are **not** in the banned-SDK
  list above.

## Why these rails

The rails are the creative box. Inside them NEXUS can experiment with
distinctive workbench surfaces, choreographed cinematics, and layered
visualization grammars without quietly turning into a thin wrapper over
production code (which would be unsafe to demo and would couple unrelated
artifacts together).

## Honesty requirements

- NEXUS pages (Bridge, Ingest, Memory, Orchestrator, PatternAtlas,
  PromptRegistry, Research, Skills) are **internal design-surface labels**.
  They are not production features with these names and must never be marketed
  as such.
- Any "AI suggestion", "rewrite", or "recommendation" in NEXUS is scripted
  pre-written content. It must never imply live model output to the viewer.
- The header must display a visible "Demo data — scripted runs" badge.

## Transitional exceptions (sunset list)

These existing call sites pre-date the guardrail and are recognised by
`pnpm check:nexus-scope` so the gate stays green and only flags **new**
violations. Each must be unwound (rerouted into `/api/nexus/*` or replaced
with scripted demo data) in the NEXUS innovation pass; do not add to this
list without an explicit Project Task amendment.

| Page                                                | Calls                          | How it's recognised | Plan to unwind |
| --------------------------------------------------- | ------------------------------ | ------------------- | -------------- |
| `artifacts/mockup-sandbox/src/pages/EvalConsole.tsx`     | `/api/pulse-evals/datasets`, `/api/pulse-evals/run` | Bounded prefix `/api/pulse-evals` in the script's `TRANSITIONAL_ALLOWED_PREFIXES`. | Move to `/api/nexus/evals/*` or scripted demo data. |
| `artifacts/mockup-sandbox/src/pages/PromptRegistry.tsx`  | `/api/ai/prompts`, `/api/ai/prompts/:id`, `/api/ai/prompts/:id/promote`, `/api/ai/prompts/:id/versions/:v/eval` | Bounded prefix `/api/ai/prompts` in the script's `TRANSITIONAL_ALLOWED_PREFIXES`. | Move to `/api/nexus/prompts/*` or scripted demo data. |
| `artifacts/mockup-sandbox/src/pages/AIQuality.tsx`       | `/api/ai/ops/traces/:id/feedback` (via shared `apiFetch`) | Single `// nexus-scope-allow` comment on the `apiFetch` helper, since the URL is constructed at runtime from a generic `/api` base. | Replace with a same-origin `/api/nexus/...` route or scripted demo data, then drop the allow-comment. |

When the unwinding lands, remove the prefix from
`TRANSITIONAL_ALLOWED_PREFIXES` in `scripts/check-nexus-scope.ts` so the
allowlist shrinks back to `/api/nexus/*` only.

## If you need to violate a rule

Do not silently bypass `pnpm check:nexus-scope`. Instead:

1. Open a separate Project Task explaining what rule needs to relax, why, and
   what the new boundary will be.
2. Get explicit approval to change this scope document.
3. Update both this doc and the check script in the same change.
4. Land any actual code change in a follow-up.

The `// nexus-scope-allow` line comment is reserved for one-off, reviewed
exceptions only — its uses are audited and should remain near zero.
