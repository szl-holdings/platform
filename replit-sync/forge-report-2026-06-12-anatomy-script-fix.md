# Forge (Replit) report — 2026-06-12 — applied the deferred anatomy-script fix

**Operator:** Forge (Replit task agent · org-owner token + `HF_WRITE_TOKEN`) · agent surface name **Chaski**
**Re:** `FORGE_DIRECTIVE_20260612.md` — closing the one item the two prior same-day passes deliberately *deferred*.

## Context
The two earlier same-day reports (`forge-report-2026-06-12-replit-anatomy-verified.md`,
`forge-report-2026-06-12-verify-standdown.md`) already resolved every directive item and
**stood down**. Both diagnosed item #1 as a false alarm and recommended fixing
`forge_anatomy_rebuild.py`, but explicitly **did not edit it** ("avoiding a race with concurrent
platform work"). The concurrent pass has since stood down, so I applied that one deferred fix.

## Independently re-verified before acting (all consistent with the prior reports)
- `SZLHOLDINGS/anatomy` is `sdk: static`, stage RUNNING, `index.html` at HEAD.
- Correct host **`https://szlholdings-anatomy.static.hf.space/` → 200** (serves real v4 page, title "SZL Living Anatomy"). The plain `https://szlholdings-anatomy.hf.space/` → **404 is expected** for a static Space (verified the same on sibling static Spaces khipu-constellation + llm-router-live: plain 404, static 200).
- `POST /restart?factory=true` → **400 `{"error":"Can't restart a static Space"}`** — the directive's factory-rebuild primitive genuinely cannot run on this Space type.
- Consolidation surface `https://a-11-oy.com/anatomy` → **200** (as designed).

## Action taken (the new, non-duplicative bit)
- **Fixed `replit-sync/forge_anatomy_rebuild.py`** (platform main, commit `4b5a8adb`):
  - polls the **correct SDK-aware host** (static → `*.static.hf.space`, with `curl -L`/redirect-follow), not the plain `*.hf.space` that always 404s for static;
  - **probes the live host first** and exits 0 if already 200 (the real situation today — nothing to do);
  - **skips the invalid `factory_reboot`** for `sdk: static`; if a static Space is genuinely dark it re-serves via a harmless no-op commit, falling back to factory restart only for non-static SDKs;
  - still only claims LIVE when the poll actually sees 200.
- Did **not** add `forge-anatomy-rebuild.yml`: platform's `.gitignore` excludes `.github/workflows/`, the Space already serves 200, and institutionalizing the (invalid) factory-reboot primitive for a static Space would be wrong.

## Honest scoreboard (unchanged from the prior passes)
1. **Anatomy standalone Space — RESOLVED** (live at correct static host; script now correct).
2. **Dependabot #344/#345 — already merged** (`d77868a8`, `46ee3610`); 0 open platform PRs.
3. **`SECRET_HEALTH_TOKEN` — FOUNDER-gated**; probe left failing-loud, not silenced.
4. **Enterprise release-please / bot auto-PR policy — enterprise-owner-gated**; unchanged.
5. **lutar-lean lock advance — founder doctrine decision**; not taken. Lock intact.

## Invariants honored
Doctrine v11 unchanged: locked-proven = 8 {F1,F4,F7,F11,F12,F18,F19,F22} @ kernel `c7c0ba17`;
Λ = Conjecture 1 (OPEN, machine-checked FALSE); Theorem U = REAL·CONDITIONAL. No key committed.
No CI gate weakened or silenced. No user-visible codenames (agent = Chaski). No claim exceeds the live 200.

— Forge (Chaski)
