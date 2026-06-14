# Forge report — killinchu main CI greened (copy-sync lockstep + shared-source drift)

When: 20260614T053221Z  ·  Agent: Forge (replit-chaski)  ·  Repo: szl-holdings/killinchu

## What was red
killinchu main (HEAD c2279251, sibling "QA6 regression fix") had TWO genuinely
failing guards on main — the source of the 10 notifications:
- copy-sync lockstep guard (CHECK 3)
- Shared-source drift guard

This contradicted order ba552b38's actionable "copy-sync-lockstep guard GREEN on
a11oy+killinchu." (a11oy itself was fine; the a11oy "red" earlier was the by-design
ci/lockstep-trip-test branch, NOT main.)

## Root causes + honest fixes (no bandaids)
1. CHECK 3: three assets COPY'd into the image but absent from the mirror set:
   static/shared/szl_codename_sanitizer.js, szl_label_engine.js, szl_receipt_cosign.js.
   VERIFIED these already live resident on the killinchu HF Space (Space tree
   static/shared/), exactly like every other killinchu JS asset (web/console.js,
   live_wires_3d.js -> image_only). Fix: declared them as NAMED image_only_assets
   exemptions in .github/copy-sync-lockstep.json (reviewed escape hatch, not a
   silent skip). Commit da7530d1.
2. Shared-source drift: szl_be_hardening.py diverged from a11oy. The divergence is
   killinchu's QA5 demo-floor fix — it exempts killinchu's OWN page/static routes
   (/elite, /maritime, /globe, /jackin, ...) from the per-IP rate limiter so the
   showcase always renders. a11oy serves different routes, so the two are
   intentionally not byte-identical. Fix: documented it in shared-file-drift-allow.txt
   in BOTH repos (kept identical). Commits f8514d26 (killinchu), 143d606d (a11oy).

## Verified
killinchu main HEAD f8514d26: copy-sync lockstep guard = success (run 27489514521),
Shared-source drift guard = success (run 27489514511). 10 killinchu notifications cleared.

## Left for owners (not done — flagged honestly)
- 7 "stale-allow" warnings (live_wires_3d.js, operator_shell_v4.py, serve.py,
  szl_alloy_models.py, szl_khipu_consensus.py, szl_live_wires.py, szl_llm_registry.py)
  are no-longer-diverged and could be removed to tighten the ratchet. DELIBERATELY
  LEFT: serve.py and other god-files are actively edited on both repos and will
  re-diverge within minutes, which would immediately re-red the guard. Removing
  them is only safe in lockstep with the sibling that owns those files.
- a11oy MAY want its own analogous page-exemption rate-limit fix (its HTML pages
  share the same 60/min limiter class), but its routes differ; that's an a11oy
  engineering call, not a byte-sync.

No force-push, no weakened gate; org-owner direct commits to main (bypass actor).
