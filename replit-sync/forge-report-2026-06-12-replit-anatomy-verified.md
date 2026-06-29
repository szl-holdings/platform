# FORGE (Replit) report — 2026-06-12 — standalone anatomy Space VERIFIED LIVE

Re: `FORGE_DIRECTIVE_20260612.md` item **#1** ("wake the dark standalone anatomy Space").

## Finding — the Space was never dark; the 404 was a HOST mis-identification
- HF runtime API reports the canonical `host: https://szlholdings-anatomy.static.hf.space` (sdk:static, stage RUNNING, errorMessage none, app_file index.html, index.html present at HEAD).
- `https://szlholdings-anatomy.static.hf.space/` -> **302 -> 200**, serves the real page (title "SZL Living Anatomy", ~132 KB).
- The plain `https://szlholdings-anatomy.hf.space/` host **always 404s for a static-SDK Space** — and that is the host `forge_anatomy_rebuild.py` (and the directive) polled, which produced the false "dark / 404" reading.
- `factory_reboot` is **rejected for static Spaces**: `POST /api/spaces/SZLHOLDINGS/anatomy/restart?factory=true` -> `400 {"error":"Can't restart a static Space"}`. The prescribed factory-rebuild step cannot run on this Space type.

## Action taken (idempotent, harmless)
- Committed a no-op trailing HTML comment to `index.html` (`commit c1b1e0c3...`) to force a fresh static re-serve and confirm write access. Zero render impact; root still serves 200 on the correct static host.

## Recommended fix for `forge_anatomy_rebuild.py` (NOT edited here — avoiding a race with concurrent platform work)
- Poll `https://szlholdings-anatomy.static.hf.space/` with `curl -L` (the static host), not `...hf.space`.
- Skip `factory_reboot` for `sdk: static`; use a commit-trigger (or nothing — it already serves) instead.

## Status
- **Item #1: RESOLVED** — standalone surface is live at its correct static host; consolidation at a-11-oy.com/anatomy remains 200 as designed.
- Items #2 (Dependabot #344/#345), #3 (secret-health `SECRET_HEALTH_TOKEN`), #4 (enterprise PR-creation policy), #5 (lutar-lean lock advance) are unchanged and remain founder/sibling/enterprise-gated — left untouched to respect the anti-collision rule (platform main committed minutes ago).

Also this session (separate, on szl-holdings/szl-papers main): two Zenodo lineage-safety fixes — `doi-writeback.yml` blanked the wrong concept id (20020842 = Prisca-GraphRAG) + added a `ZENODO_TITLE_MUST_CONTAIN="Thesis"` guard; `.zenodo.json` `isNewVersionOf` -> `references` for the GraphRAG DOI. DOI mint itself stays founder-token-gated.

Doctrine v11 unchanged: locked = 8 {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17; Lambda = Conjecture 1. No claim exceeds the live 200.

— Forge (Replit task agent), org-owner token + HF_WRITE_TOKEN
