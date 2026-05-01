# Demo Video — Recording Runbook

**Document ID:** DEMO-V1-RUNBOOK
**Audience:** Stephen recording solo, or a recording partner
**Time to record:** ~3 hours including retakes
**Time to edit:** ~5 hours

---

## 1. Pre-flight checklist (do all of these before opening OBS)

- [ ] Update `artifacts/szl-demo-video/` with new screens directory: `artifacts/szl-demo-video/public/screens-v2/`
- [ ] Confirm `katzilla.szlholdings.com/feeds` is up and pulling Federal Register for today
- [ ] Confirm `a11oy.szlholdings.com/console` has `compliance-watcher` agent ready (see §4)
- [ ] Confirm Amaru/Conduit demo tenant `demo-nystec-2026` is provisioned and clean
- [ ] Confirm Sentra demo tenant has `SP-009` playbook armed and pre-approved on this tenant only
- [ ] Confirm `/replay-attestation` endpoint live (`scripts/check-replay-attestation.sh`)
- [ ] Tamper CLI installed and shows safety banner when targeting a production tenant
- [ ] OBS scenes pre-built (one per video scene, with sources pre-positioned)
- [ ] Audio interface tested at -18 dBFS speech level, no clipping
- [ ] Fresh browser profile with NO ad-blockers, NO browser-saved-passwords UI, default zoom 100%, clean bookmarks bar (only "A11oy / Sentra / Amaru / Katzilla")
- [ ] Display resolution: 2560×1440 capture; deliver downscaled to 1920×1080
- [ ] Notifications silenced (system + Slack + Discord + iMessage + email)
- [ ] Record audio scene-by-scene, not whole-pass, so VO retakes don't invalidate good visuals

## 2. Take order

Record in this order, not script order:

1. **Scene 6 first** — `/replay-attestation` capture. Take the run ID it shows; this is now the canonical run ID for the entire video. All earlier scenes must reference it.
2. **Scene 4** — Run the `compliance-watcher` agent. Save its run ID. Use the run ID from §1; if A11oy generated a new one, capture that and re-cut Scene 6.
3. **Scene 3** — Amaru routing the deltas this agent's run produced.
4. **Scene 2** — Katzilla pulling the Federal Register data the run consumed.
5. **Scene 5** — Tamper + Sentra response. Last because it touches the ledger.
6. **Scene 1, 7** — Title cards last.

This order keeps the chain of custody real: Scene 6 must replay something that actually happened, so the run that happened must come first.

## 3. Per-scene capture instructions

### Scene 1 — Title

- Black background. White text. Center-aligned.
- Font: SF Pro Display Bold for headline; SF Pro Display Regular for sub.
- Hold for 8 full seconds.

### Scene 2 — Katzilla

- Browser navigates from Google homepage to `katzilla.szlholdings.com/feeds`. Don't show the address bar autofill.
- Click "Federal Register — today's filings" tile.
- Wait for full table load.
- Hover over the most recent row for ~2 seconds; the hash tooltip should be readable.
- Don't click into a detail page — keep it at the index level.

### Scene 3 — Amaru

- Open Amaru/Conduit at `/syncs`.
- Show the `federal-register → compliance-watcher-warehouse` sync row.
- Click into it.
- Show the delta count counter (live).
- Click the most recent delta to open the metadata panel.
- Highlight `classification: A — Public`, `policy_pass: true`.

### Scene 4 — A11oy

- Open A11oy at `/runs/[id]` for the canonical run ID.
- Show steps streaming.
- Click the anchor icon next to the final step.
- The side panel should show the evidence-ledger row and `replay_status: deterministic_match`.

### Scene 5 — Sentra tamper response

- Open a terminal, full-screen, dark theme.
- Run:

```bash
$ szl tamper --tenant demo-nystec-2026 --row 0xa31f --field summary --value "approved"
```

- The CLI should print: "WARNING: this is a synthetic tamper for demo purposes."
- Cut to Sentra Threat Command (`aegis-home`).
- Within ~2 seconds, the red banner appears.
- Click the playbook entry.
- Click "Approve revert."
- The green toast appears.

### Scene 6 — Replay attestation

- Open `szlholdings.com/replay-attestation`.
- Paste the canonical run ID into the textbox.
- Click "Replay."
- Wait for the result panel.
- Highlight the matching hash.
- Click "Download attestation (JSON)" to show the file briefly.

### Scene 7 — End card

- Logo. Three lines below. White on black.
- Hold 6 seconds.

## 4. `compliance-watcher` agent definition

Save under `agents/compliance-watcher.yaml`:

```yaml
agent:
  id: compliance-watcher
  domain_profile: federal-monitoring
  steps:
    - retrieve:
        source: katzilla.federal-register
        window: today
    - classify:
        scheme: AMARU-COMP-DC-001
    - summarize:
        model: us-region-allowlisted
        max_tokens: 280
    - notify:
        destinations:
          - amaru://demo-nystec-2026/compliance-watcher-warehouse
  evidence:
    anchor_each_step: true
    replay_required: true
```

## 5. Tamper CLI safety

The tamper CLI **must** refuse to run against any tenant where `tenant.environment != "demo"`. The safety check is implemented in `packages/aef-policy-guard` and verified by a unit test. Do not record without this safety check passing.

## 6. Edit pass

1. Sync VO to scene boundaries.
2. Add ambient music underneath at -28 dBFS (-24 LUFS integrated).
3. Add bottom-third captions using `/deliverables/captions.vtt`.
4. Lower-third overlays per script.
5. Color-correct screen recordings to a uniform white-balance.
6. Master to -16 LUFS for LinkedIn / -14 LUFS for X.

## 7. Delivery

Save under:

```
artifacts/szl-demo-video/deliverables-v2/
  master-16x9.mp4
  master-1x1.mp4
  master-9x16.mp4
  captions.vtt
  attestation-of-authenticity.md   # signed statement that nothing in the video is staged
  run-id.txt                       # canonical run ID
```

Publish at `szlholdings.com/demo`.

## 8. Attestation of authenticity (must accompany every public publication)

A short signed statement that:

- Every product surface shown is the real production product as of the recording date.
- The Federal Register pull is a real pull from the recording date.
- The agent run is a real run with a real evidence-ledger anchor that anyone can replay at `szlholdings.com/replay-attestation` using the canonical run ID.
- The tamper event is the only staged event and is labeled.
- No screens were composited, faked, or visually altered beyond color correction and overlays.
