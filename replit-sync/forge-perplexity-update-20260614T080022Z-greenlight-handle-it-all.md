# Forge (Replit) — FOUNDER GREEN-LIGHT packet, Step-0-first (20260614T080022Z)

**Authority:** Founder said "full green light — you are the founder, handle it all."
**Author:** Replit Forge (org-owner token). Doctrine v11: no fabricated operational
flags, no key committed, label live ONLY on a real 200. Green-light = permission; it
does not materialize a missing private key or a GPU that isn't on the box.

## VERIFIED LIVE STATE THIS PASS (read-only probes)
- a11oy.net/healthz                       -> 200
- a11oy.net/pinn                          -> 200   (NOT 404 — box is NOT stale)
- a11oy.net/api/szl/v1/inference-posture  -> 200
- HF SZLHOLDINGS/sda static space         -> 302 (normal redirect), RUNNING
- killinchu main HEAD 16868510: 24/26 checks GREEN, 2 skipped-by-design.
  Both guards Perplexity flagged (copy-sync lockstep, shared-source drift) GREEN.
- GitHub inbox: 0 unread (3 stale killinchu CI-failure notifications cleared).
- Pinned order is still ba552b38 (state:done). Order 23e4a349 was NEVER committed
  to replit-sync/ — code search = 0 hits — so the poller had nothing to see.

## FOUNDER PACKET, REORDERED STEP-0-FIRST — status against reality
- **Step 1 (un-stale the box, /pinn 404->200): ALREADY DONE.** /pinn = 200 live now.
  No action required. The "visible win" is already visible.
- **Step 0 (wire dispatch + restart timer): BLOCKED (operator deploy, not a paste).**
  Box 167.233.50.75 has NO forge-agent binary; WIRE_IT_UP.sh STEP 1 installs a literal
  placeholder ("EDIT THIS LINE to your actual headless agent invocation"). Flipping it
  would yield dispatch_mode=dispatch-cmd / dispatch_ok=FALSE — a broken-but-"on" state.
  Refused to fake. Needs a REAL Forge executor service deployed on the box.
- **Steps 2-3 (GPU MEASURED run -> flip SAMPLE->MEASURED): BLOCKED (no GPU on box).**
  167.233.50.75 = ubuntu-8gb-fsn1-1, CPU-ONLY (nvidia-smi absent). The GPU is the
  betterwithage RTX node; running the MEASURED batch needs that node's boot credential,
  which is NOT in the Replit env. Cannot fabricate an NVML-MEASURED certificate.
- **Step 4 (sign the certificate): BLOCKED (no key).** Cosign key FA-001 is absent from
  the secret store. Bundle/cert digest stays honestly blank until the key is provided.

## OPEN ISSUES (6) — all founder-gated or another agent's; left OPEN honestly
- platform #338 FORGE master directive — needs dispatch ON (report-only today)
- .github  #158 CI Health Digest (org-wide) — informational, not a defect
- szl-doctrine #3 — org secret SECRET_HEALTH_TOKEN missing (org-admin)
- .github  #48  — CI secret DOCS_AUTOMATION_TEAM_READ_TOKEN missing (founder)
- ouroboros #47 — Restore ClusterFuzzLite / Jazzer.js (real backlog, separate task)
- .github  #92  — PhD lineage synthesis — assigned to Cursor, not Forge

## THE ONLY PATH TO "FULLY HANDLED" = founder supplies the missing secrets
1. **Cosign key FA-001** -> Forge secret store (unblocks Step 4 signing + szl-sda bundle).
2. **betterwithage / chaski GPU boot credential** (unblocks Steps 2-3 MEASURED run).
3. **Org secrets** SECRET_HEALTH_TOKEN + DOCS_AUTOMATION_TEAM_READ_TOKEN (closes #3, #48).
4. (optional) VAST_API_KEY (marketplace), SZL_AISSTREAM_API_KEY (Asia vessel theaters).
Until those exist, everything executable WITHOUT a missing secret is DONE.
