# Anti-Vagueness Copy Pass — SZL Holdings

**Date:** 2026-04-16
**Scope:** platform.tsx, company.tsx, about.tsx, README.md

---

## What changed

Every public-facing page was audited against the governed decision infrastructure narrative. The canonical nine-step loop (`Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning`) is now the organizing principle across all surfaces.

### Terms removed or replaced

| Old term | Replacement | Reason |
|---|---|---|
| "Business observability" | "Governed command surface" | Observability is a feature, not a category |
| "Worldline" | "Event Fabric" | Worldline was internal naming; Event Fabric describes the function |
| "Model Mesh" | "Monte Carlo engine" | Generic AI term; Monte Carlo is specific and verifiable |
| "GraphQL Control Plane" | "Six shared primitives" | Implementation detail promoted to category claim |
| "Strategic technology portfolio company" | "Governed decision infrastructure" | Vague holding company language |
| "Lyte is the commercial wedge" | "Command is the operator surface" | Wedge framing is investor jargon, not product clarity |
| "Expansion lanes" | "Domain packs — governed extensions" | Lanes implies roadmap; packs implies architecture |
| "Design partner stage" (as brand identity) | Retained, clarified in company posture section | Honest, but not the headline framing |

### Structural changes

1. **platform.tsx LAYERS**: "Lyte" → "Lyte + Command" (governed command surface). "Alloy" retained as "Execution Fabric" with updated capabilities (Proof Chain, Monte Carlo, Covenant Policy, durable state).

2. **platform.tsx HOW_IT_WORKS**: Three generic steps replaced with the nine-step loop organized as three phases: Signal→Context→Recommendation, Simulation→Policy→Execution, Proof→Outcome→Learning.

3. **platform.tsx EXPANSION_VERTICALS**: Four verticals → six domain packs (added Counsel and IMPERIUM). Grid changed from 4-col to 3-col to accommodate.

4. **company.tsx PRODUCT_HIERARCHY**: "Lyte" → "Command + Lyte" with governed decision language. Alloy description updated to mention Proof Chain, Monte Carlo, and Covenant Policy by name.

5. **company.tsx body copy**: "What we build" section rewritten. Removed Worldline, Model Mesh, GraphQL Control Plane. Replaced with Event Fabric, Proof Chain, Covenant Policy, Monte Carlo engine, Outcome Graph — the six shared primitives.

6. **company.tsx "Why Lyte first"**: Renamed to "Why governed decisions". Reframed from execution-breaks-down to AI-governance-gap. Entry point is the governed loop, not a single product.

7. **about.tsx**: Full rewrite. Old page used deprecated `Navbar`/`Footer` components and described SZL as "strategic technology portfolio company". New page uses `SiteNav`/`SiteFooter`, governed decision infrastructure narrative, principles section, domain packs section, and CTA.

8. **README.md**: Fixed dead paths (stale archived artifact paths updated to canonical surfaces `/aegis/` and `/command/`), updated product table terminology.

### Anti-vagueness rules applied

- No term appears without a specific, verifiable claim attached
- Every domain pack names what it governs (AIS telemetry, MITRE ATT&CK, court filings, etc.)
- AI capabilities always include: source citations, confidence scores, provenance metadata
- The nine-step loop is referenced structurally, not as marketing decoration
- "Platform" always means the six shared primitives, never a generic category word
- "Governed" always means: who approved, based on what, with what outcome — traceable

### Pages not touched (out of scope)

- Landing page (index.tsx) — already aligned in prior pass
- Founder page — already aligned
- Individual domain pack pages (aegis-public, vessels-public, terra-public, etc.) — separate pass needed
- Architecture page — separate pass needed
