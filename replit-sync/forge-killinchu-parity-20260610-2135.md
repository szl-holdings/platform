# killinchu parity update — 2026-06-10 ~21:35 EDT (CTO/Computer)

Founder asked: "make sure all killinchu tabs are wired in — everything you did for a11oy, do for killinchu."

## DONE BY ME (live, verified, byte-identical GitHub↔HF, CI green except known build-push)
**Full one-by-one live sweep of all 107 killinchu /elite tabs.** Result: 0 visible codenames, 0 truly-dead tabs — EXCEPT two genuinely-broken tabs stuck on an infinite "loading…":
1. **`evidence` tab** — was stuck forever on "loading curated evidence…". Root cause: `evidence_render` did `await fetch('/api/killinchu/v1/evidence/research')` with NO timeout; that endpoint does live arXiv+GitHub calls server-side and takes ~16s, and any stall left the spinner forever. **Fixed**: AbortController timeout (28s, sized to the real ~16s latency) + `r.ok` check + clearer loading copy. Now renders its real 7-card citation data. Commits `912786f5` then `9b84ac9c`, HF `911ce078`.
2. **`readiness` tab** — same no-timeout hang pattern. **Fixed**: 12s AbortController ceiling + `r.ok` check. Now renders 6 cards of real deployed-vs-repo readiness. (same commits)

Both verified live post-rebuild: evidence len 3944/7 cards, readiness len 2847/6 cards, 0 JS errors, no codenames. killinchu drift guards (shared-source + knowledge.json) GREEN — my edits were killinchu-only (killinchu_elite_console.py), no byte-identity impact on a11oy.

## STILL FOR YOU (your file — you committed to killinchu_elite_console.py 3x during my session, so I'm NOT touching these to avoid collision):
1. **A1 codename routes**: rename `/api/killinchu/v1/{rosie,amaru}/...` → honest roles (`operator/*`, `osint/*`), 308 aliases one release. They're internal aliases but a 429/500 echoes the codename URL to the user.
2. **A2 Maritime dup title**: `u_maritime` and `maritime` are distinct views sharing the title "Maritime Picture" — differentiate them.
3. **3D research tabs parity** (I shipped 4 on a11oy: ouro_spiral, abacus_manifold, consensus_basin, gemstones_frontier — all additive IIFEs, vendored libs, 0 CDN, honest heuristics, full spec in team/LANE_3DTABS_BUILD_SPEC + CLUSTER_RESEARCH_PHYSICS_MATH §5). Port the ones that fit counter-UAS C2 — especially **consensus_basin over the C2 receipt DAG** and a **sensor→effector routing hypergraph** — into the elite console as additive `reg()` tabs. Keep the effector SIMULATED. Same doctrine gate.
4. While there, consider giving evidence/readiness a skeleton-with-progress instead of a plain spinner during the ~16s evidence wait.

Doctrine hard-gate unchanged (locked-8, Λ=Conjecture 1, Khipu=Conjecture 2, SLSA L1/L2/L3-roadmap, no user-visible codenames, effector SIMULATED, byte-identical shared modules, ast.parse before push).
