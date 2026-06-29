# Forge (Replit) — doctrine-grep red ROOT-CAUSED + exact handoff patch (20260614T090117Z)

**Author:** Replit Forge (org-owner token). Doctrine v11: honest labels only, no
key committed, no gate weakened. This pass = read-only investigation + handoff;
**no push to a11oy** (see anti-collision below).

## What the founder asked
"Check GitHub for the Perplexity instruction for Replit-Forge — no bandaids, get
it fully operational." Authoritative order = replit-sync/NEXT_ORDER.md (HEAD
9100ef29, amended 08:44Z to "note known doctrine-grep hygiene red").

## ROOT CAUSE of the a11oy "Doctrine — banned-token grep gate" red (corrects the order)
The order calls this red "MARKETING-HYPE legacy prose." **That is wrong.** The
gate run (sha 68146642) reports HIT_COUNT=10, and every one of the 10 hits is in
the codename detector's OWN source:
- `static/shared/szl_codename_sanitizer.js` (6 hits) — TOKENS=["amaru","rosie",
  "sentra","jarvis"] + the jarvis->Operator honest-remap table, plus one English
  "leading" ("preserving a leading capital", a code comment).
- `szl_codename_gate.py` (4 hits) — the same TOKENS tuple + jarvis->Operator map.
These files MUST enumerate the banned codenames to strip them. This is textbook
enumeration-for-detection — identical to serve.py / szl_yachay_organ.py /
ayni_os_serve.py / pages/console.html, all already in .doctrine-allowlist.
Neither file emits a banned token to any user surface. This is NOT hype prose and
must NOT be reworded (rewording would break the detector).

## EXACT, FOUNDER-PRE-AUTHORIZED FIX (ready to apply — append to .doctrine-allowlist)
NEXT_ORDER.md pre-authorized: "add the file to .doctrine-allowlist if it
legitimately enumerates the ban-list. Do NOT weaken the gate." Append:

```
# Doctrine grep-gate exemptions (2026-06-14, founder-authorized).
# The codename gate/sanitizer SOURCE itself: it MUST enumerate the banned
# codenames (amaru/rosie/sentra/jarvis -> Operator) to detect+strip them.
# Enumeration-for-detection, same rationale as serve.py / szl_yachay_organ.py /
# ayni_os_serve.py / pages/console.html above. The one flagged "leading" is the
# English phrase "preserving a leading capital" (a comment). Neither file emits a
# banned token to any user surface; the list IS the rule, not a violation.
szl_codename_gate.py
static/shared/szl_codename_sanitizer.js
```

This exempts ONLY the detector's own source; all first-party files stay fully
scanned. After it lands, the gate scans 0 of these → HIT_COUNT=0 → GREEN.

## WHY I DID NOT PUSH IT THIS PASS (anti-collision — absolute rule)
A sibling Forge is mid-wave on a11oy RIGHT NOW: commits 854a5b55 (08:56:54Z),
02b41d98 (08:57:49Z) — "QA10 nav wire-up" + "fix(nemo) model-aware honesty",
bursts of 3 commits in 8s. Doctrine: never race an actively-committing sibling;
a double-push bounces its guarded pushes / risks clobbering in-flight work. This
red is explicitly LOW-PRIORITY / non-blocking / post-freeze. So: handed off, not
forced. Apply the patch above in the next quiet a11oy window (or the active
sibling can append it inline — it touches only a11oy-local .doctrine-allowlist,
orthogonal to the nav/nemo work).

## LIVE STATE THIS PASS (read-only)
- a-11-oy.com/healthz, /pinn, /api/a11oy/v1/pinn/certificate → all 200 (box NOT stale).
- a11oy main: 13/14 demo-critical gates GREEN; only this doctrine-grep red (cosmetic).

## "FULLY OPERATIONAL" — the honest remaining blockers (unchanged, no bandaids)
Everything executable WITHOUT a missing secret is done or owned by the active
sibling. The rest needs FOUNDER inputs (faking any = the forbidden half-state):
1. A REAL headless Forge executor deployed on the box → only then is dispatch_mode
   honestly "on". WIRE_IT_UP.sh points at a non-existent `forge-agent` binary;
   flipping it = dispatch_ok:false ("on" but broken). Not faked.
2. GPU boot credential (rtx-betterwithage) → flips PINN energy SAMPLE→MEASURED.
   Box 167.233.50.75 is CPU-only; cannot fabricate an NVML reading.
3. Cosign key FA-001 → signs the certificate / UDS bundle (digest stays blank).
4. Org secrets SECRET_HEALTH_TOKEN + DOCS_AUTOMATION_TEAM_READ_TOKEN; (optional)
   NVIDIA NIM key for the cloud tier.

— Replit Forge
