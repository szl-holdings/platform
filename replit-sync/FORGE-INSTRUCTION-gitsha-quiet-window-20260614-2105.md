# SZL Forge — ORDER (2026-06-14 21:05 EDT): git_sha at /honest — QUIET WINDOW IS OPEN

**Founder says keep going.** Your box-redeploy + joules-MEASURED work is DONE and independently
verified (holo3d.js 200 JS, WAQAY/Yupay 200 JSON, joules climbing 155k+ MEASURED on rtx-betterwithage).
Two items remain. This order clears #1.

## The a11oy serve.py commit wave has COOLED
Last a11oy main commit was 2026-06-15T00:38:40Z; it has now been quiet ~27 min. This is the calm
serve.py window you (correctly) said you were waiting for. Land the git_sha hook now.

## DO — expose git_sha at /api/a11oy/v1/honest
- A `git_sha` code reference already exists in a11oy serve.py (1 match) — wire it through so
  `/api/a11oy/v1/honest` returns a real `git_sha` field == the deployed GitHub a11oy main HEAD.
- Source it cleanly: a `GIT_SHA` build-arg in the Dockerfile (set at build from the commit), OR read
  it at startup from a baked `.git_sha` file / env. NOT hand-edited per deploy.
- Push byte-identical GitHub a11oy + HF; rebuild the box so the box's /honest also reports it.
- Keep killinchu consistent (same mechanism, its own sha).

## PROVE (paste real output)
- `curl -s a11oy.net/api/a11oy/v1/honest` → includes `git_sha` == `git rev-parse HEAD` of a11oy main.
- Same field on https://szlholdings-a11oy.hf.space/api/a11oy/v1/honest.
- This makes box-staleness self-detecting forever (the whole point).

## DOCTRINE (never weaken)
locked=8 {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17; Λ=Conjecture 1; Khipu=Conjecture 2; trust never
100%; 0 CDN; never commit a key; honest BLOCKED beats fake green. If a NEW commit wave starts before
you can land it cleanly, wait for the next quiet window — do not collide.

## REMAINING after this: UDS recut + cosign sign — that's FOUNDER-GATED (cosign FA-001 key).
Do the UN-SIGNED recut prep (recut bundle from current main, stage the digests) so the founder only
has to run the final `cosign sign` step. Leave clear instructions in a forge-report for the founder.


## ADDENDUM (2026-06-14 21:31 EDT) — ALIGN FREEZE TIME TO CANONICAL 02:00 ET
Your a11oy `.github/workflows/demo-freeze.yml` was set to `2026-06-18 01:00 ET`, but the CANONICAL
source-of-truth `replit-sync/FREEZE.json` (what every cron reads) is `activates_at: 2026-06-18T02:00:00-04:00`.
Fix demo-freeze.yml (+ demo-freeze-hotfix-validate.yml + killinchu's equivalent) to **02:00 ET**, matching
FREEZE.json exactly, so the CI freeze gate doesn't start rejecting commits an hour early during the founder's
June 16-17 on-site prep. FREEZE.json is authoritative — align the CI workflow to it, not the reverse.
