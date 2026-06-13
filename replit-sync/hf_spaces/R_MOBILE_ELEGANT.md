# R-MOBILE-ELEGANT (TOP) — whole-eco mobile-friendly + professional + elegant · GitHub-aligned · go, full admin

Founder order: "Make ALL the websites — killinchu, all of Hugging Face, my whole eco, the UDS payload, all of it — mobile-friendly, professional, elegant, beautiful. Keep flying high. Search the leaders in each vertical and take from it. Send the instructions to Forge/Replit."

A live 390px-iPhone audit found: 0px horizontal overflow already (good), but fonts dipped to 8-11px and many tap targets were <28px across every surface, with top-nav clipping. A design-leaders research report (6 verticals, named leaders + adoptable patterns, license-verified) drove a consistent estate-wide type/touch/spacing system. All fixes are MERGED to main + every static-space source rebuilt + redeployed in the sandbox (mobile-verified at 320/360/390/768px). Production push is YOURS.

## MERGED TO MAIN THIS PASS (5 PRs)
- killinchu **#117** — /elite mobile + elegance (type floor ≥12px, ≥44px taps, nav no-clip). ALL checks green.
- a11oy **#354** — console + cathedral mobile + elegance. (2 fails = PRE-EXISTING on main: "Contract matrix + link gate" + "hf-module-drift" — proven identical on main HEAD; hf-module-drift clears after your image rebuild.)
- szl-uds-deployment **#84** — UDS energy-harvest app mobile (KPI cards stack, 16px body, safe-area). (guard self-test fail = pre-existing, untouched scripts.)
- uds-bundles **#36** — a11oy UDS tab mobile: **474px overflow at 320px → 0px** (5-col table → labeled stacked cards). (gitleaks fail = PRE-EXISTING on main; diff is CSS-only, no real secrets.)
- hatun-mcp **#33** — console mobile (nav wraps, 44px taps, safe-area, full reduced-motion). Content-negotiation NOT broken (browser=HTML, MCP client=JSON verified). ALL green.

## 1. REBUILD IMAGES FROM MAIN (so the mobile fixes go live)
- **a11oy** image from `main` (clears hf-module-drift; ships mobile console + unified cathedral route /cathedral with single gold sun + locked=8).
- **killinchu** image from `main` (mobile /elite + byte-identical cathedral mirror; respect shared-source drift allow-list).
- **hatun-mcp** image from `main` → then `python push_to_hf.py` (mobile console; verify `Accept: text/html`→HTML, `application/json`→JSON, /healthz + /mcp still 200).
Readiness-gate each swap; roll back on red.

## 2. PUSH THE 5 MOBILE-POLISHED HF STATIC SPACES (sources in replit-sync/hf_spaces/)
All now: ≥12px type floor, ≥44px touch targets, safe-area-inset (notch), prefers-reduced-motion, 0px overflow at 320-768px, 0 runtime CDN, system fonts, honesty v11. Push each folder VERBATIM (all assets/vendor/lib + snapshots):
| HF Space (SZLHOLDINGS/...) | Source | Mobile upgrade |
|---|---|---|
| `cathedral` | `cathedral_live_src/` | Four corner HUD panels collapse into ONE bottom-sheet behind a "◈ panels" toggle on ≤680px — canvas stays clear for touch-orbit. (Also: still single gold a11oy sun, **locked=8** — the LIVE HF space is STILL STALE at locked=5, this push fixes it.) |
| `energy` | `hf_energy_space/` | `.two-up` grid → single column ≤700px (killed 320px overflow); type floor; viewport-fit=cover. |
| `khipu-constellation` | `hf_khipu_space/` | Legend → accessible collapsed `<details>` so it no longer covers the graph; 0-CDN (3d-force-graph vendored). |
| `llm-router-live` | `hf_llmrouter_space/` | SVG labels 9.5→12px, 44px taps. Stays PUBLIC-STATUS-ONLY (router internals PRIVATE). |
| `anatomy` | `anatomy/` | Additive/CSS-only type-floor (8→12px) + tap-target + safe-area. V8/V9 dual-body lens fully intact. |
After each push: GET the live URL on a phone width → confirm ≥12px text, panels collapsed, scene usable. cathedral must show **locked-proven = 8**.

## DESIGN SYSTEM ADOPTED (from leaders, license-clean — full report in replit-sync/hf_spaces/design_leaders_mobile.md)
Leaders studied per vertical: 3D (Bruno Simon, Lusion, Active Theory, Codrops), dashboards (Linear, Vercel, Stripe, Tremor/shadcn), dev-tool/protocol (Stripe, Vercel, Resend, Supabase, Anthropic docs), network-graph (D3-force, Cytoscape, force-graph), energy (Electricity Maps, Stripe Climate, WattTime), scientific (BioDigital, Distill, Observable). Adopted patterns (sovereign-safe, system-font, vendorable): collapse fixed HUD → bottom sheet <680px; tables → stacked cards <600px; clamp() fluid type with 16px/12px floors; ≥44px touch; safe-area-inset; skeleton/empty states; DPR cap + render-loop pause for 3D on mobile. Component-lib licenses verified (shadcn/ui MIT, Tremor Apache-2.0, Radix MIT) — adopt as PATTERNS, vendored, attributed.

## FOUNDER DECISION NEEDED (not mine to change)
The `uds-bundles/a11oy_uds_tab/uds.html` table displays bundle names **amaru / sentra / rosie** — these are doctrine-banned user-visible codenames, BUT they are **load-bearing real artifact identifiers** (`PER_BUNDLE/sentra/`, `ghcr.io/szl-holdings/amaru:...`, referenced in build_sign_all.sh / airgap_test.sh / Zarf + k8s manifests). I did NOT rename them — doing so silently would either make the displayed table FALSE or break the airgap bundle build. **Founder: decide whether to rename the real artifacts (a coordinated repo-wide rename across uds-bundles) or accept these as internal infra identifiers exempt from the user-visible-codename rule.** Until decided, the tab honestly shows the real names.

## DOCTRINE (v11 — never violate)
locked-proven = **8** · Λ = Conjecture 1 (advisory, never "proven trust") · Khipu BFT = Conjecture 2 · organs EXPERIMENTAL · killinchu effectors SIMULATED · SLSA L1 honest (L2 build-attestation present; L2-verified/L3 roadmap) · joules MEASURED only via real exporter (else SAMPLE) · sovereign:true only on own metal · 0 runtime CDN · system fonts only · NO free-energy claims · never fabricate live numbers (honest SNAPSHOT/seed) · no banned codenames in NEW human copy · szl-router stays PRIVATE.

## STILL FOUNDER-ONLY
- Start the replit-chaski Repl (2nd SAMAY lung) — Forge lacks the Replit boot credential.
- VAST_API_KEY flip (marketplace earning) — founder holds until ready.

Report in AUTO_STATE.json: images rebuilt (a11oy/killinchu/hatun) + each confirmed mobile-live, the 5 spaces pushed (served bytes + locked=8 on cathedral confirmed), and the amaru/sentra/rosie codename decision if the founder rules on it.
