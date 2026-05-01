# Demo Video — End-to-End A11oy → Sentra → Amaru → Katzilla

**Document ID:** DEMO-V1-SCRIPT
**Length target:** 90 seconds (≤ 105 seconds hard cap)
**Audience:** NYSTEC reviewers, state procurement, prime-contractor evaluators
**Output formats:** 16:9 master (presentations), 1:1 square (LinkedIn / X), 9:16 vertical (sponsorship clip use)
**Recording target:** Place under `artifacts/szl-demo-video/` (artifact already exists with tooling)

---

## 1. The point this video must make

In 90 seconds, a procurement reviewer must walk away believing **three** things that no other vendor in their pipeline can demonstrate:

1. SZL's products process *real* data, not fixtures (Katzilla → Amaru → ledger).
2. Every action is auditable to its primary source by hash (replay attestation).
3. The vendor's own product catches the vendor's own mistakes (Sentra closes the loop).

Everything else — visuals, music, brand — is in service of those three points.

## 2. Beat-by-beat script

### Scene 1 — Hook (0:00–0:08, 8s)

**Visual:** Static title card. Black background. Headline:

> **"Most AI products can't show their work."**

Sub-line, smaller:

> "We built ours so you can replay every decision back to its primary source."

**VO (calm, measured, US neutral):** "Most AI products can't show their work. We built ours so you can replay every decision back to its primary source."

### Scene 2 — Katzilla pulls a real federal source (0:08–0:22, 14s)

**Visual:** Browser tab on `katzilla.szlholdings.com/feeds`. Operator clicks **"Federal Register — today's filings."** Spinner → table of filings appears with columns: agency, title, hash, ingest time. Hover over a row → small tooltip "blake3:78c2... ingested 14:02 UTC."

**VO:** "Katzilla pulled today's Federal Register filings — every record hash-anchored at ingest. This isn't a scrape — it's a chain of custody from the federal source forward."

**On-screen text:** "Primary source → cryptographic hash → evidence ledger"

### Scene 3 — Amaru routes the deltas (0:22–0:38, 16s)

**Visual:** Cut to Amaru dashboard (`artifacts/conduit` UI, syncs page). Show one source ("Federal Register") streaming into one destination ("compliance-watcher-warehouse"). Counter ticks: 142 deltas synced. Click a delta → metadata panel opens, shows `classification: A — Public`, `hash chain link`, `policy_pass: true`.

**VO:** "Amaru routes the deltas to the agency's warehouse — every record classified, every hop logged, every policy decision recorded against the original."

**On-screen text:** "Append-only delta log · classified · policy-guarded"

### Scene 4 — A11oy runs the agent (0:38–0:54, 16s)

**Visual:** Cut to A11oy console. An agent named "compliance-watcher" runs. Show the run page with steps streaming: `retrieve → classify → summarize → notify`. Each step has a green check and a tiny "🔗 anchor" icon. Click anchor → side panel shows the row in the evidence ledger with `replay_status: deterministic_match`.

**VO:** "A11oy ran the watcher agent against the new filings. Every step is anchored. Every output replays deterministically — that is the difference."

**On-screen text:** "Every step → ledger anchor → replay verified"

### Scene 5 — Sentra catches a tamper attempt (0:54–1:12, 18s)

**Visual:** Cut to terminal. An operator runs:

```bash
$ szl evidence tamper --row 0xa31f --field summary --value "approved"
```

Cut to Sentra Threat Command. A red banner appears within seconds:

> **"Evidence ledger integrity violation — row 0xa31f"**

The Sentra `aegis-home` page surfaces the playbook **SP-009 — Tenant-isolation failure indicator** and a recommended action: revert + freeze + investigate. The operator clicks Approve. A green toast: "Reverted. Evidence chain restored."

**VO:** "We tampered with the ledger on purpose. Sentra caught it in under a second, surfaced the playbook, and reverted the change — all anchored in the same chain."

**On-screen text:** "Self-detecting · self-reverting · self-attesting"

### Scene 6 — Public replay attestation (1:12–1:24, 12s)

**Visual:** Cut to `szlholdings.com/replay-attestation`. A textbox shows the run ID from Scene 4. Click "Replay." A spinner. Result panel: `status: match`, `original_hash: blake3:78c2...`, `replay_hash: blake3:78c2...`, `signed: yes`, `timestamp: 2026-04-30 14:08 UTC`. Two buttons appear: "Download attestation (JSON)", "Verify with our public key (CLI)."

**VO:** "Anyone, even outside the agency, can replay it themselves at this URL. That is what audit-grade looks like."

**On-screen text:** "szlholdings.com/replay-attestation"

### Scene 7 — End card (1:24–1:30, 6s)

**Visual:** Logo. Tagline:

> **"AI you can replay. Run by SZL Holdings."**

Below, three lines:
- A11oy · Sentra · Amaru
- inquiries@szlholdings.com
- szlholdings.com/governance

**VO:** "A11oy. Sentra. Amaru. Run by SZL Holdings."

## 3. Production notes

- **VO:** US-neutral male, calm, dry. Not enthusiastic. Not "hype." Think public-sector procurement officer talking to a peer. Suggested: ElevenLabs voice "Bill" or "Adam" with stability ~0.6. Recording script is in `B-02-vo-script.txt`.
- **Music:** Low ambient drone. No drums. -24 LUFS. Suggested: Tom Misch "Ambient" or `artifacts/szl-demo-video/public/audio-scene*.mp3` (already prepared) repurposed.
- **Cuts:** Hard. No motion-graphic transitions. The screen recordings should *look* like a real operator using a real product, because they are.
- **Capture frame rate:** 60fps source for crispness; deliver 30fps to match LinkedIn auto-play behavior.
- **Cursor:** Use a system cursor with cursor-highlight ring. No fake animations.
- **Text overlays:** SF Pro Display, white on a 2px black stroke for legibility. Top-left or bottom-center. Never both.
- **Captions:** Burned-in bottom-third caption track + side-car `.vtt`. The artifact already has `deliverables/captions.vtt` — replace.
- **No background music in the captured product audio.** Capture system audio muted; lay music underneath in post.
- **No fake data.** Every record on screen comes from `katzilla.szlholdings.com/feeds` or a clearly-named demo tenant. The Federal Register pull must be a real pull from that day. The "tamper" command is the only synthetic event and it is labeled.

## 4. Asset checklist

- [ ] Real Katzilla pull recorded (Federal Register, day-of)
- [ ] Real A11oy `compliance-watcher` agent run recorded
- [ ] Real Amaru sync to a demo warehouse recorded
- [ ] Tamper script (`szl evidence tamper`) wired to a demo-only tenant; safety: hard-blocks against any production tenant
- [ ] Real Sentra `SP-009` playbook fires on the tamper
- [ ] Real `/replay-attestation` endpoint live and returning the matching hash
- [ ] VO recorded per `B-02-vo-script.txt`
- [ ] Captions generated and human-corrected
- [ ] Logo + end card matching brand kit
- [ ] Three deliverable cuts: 16:9, 1:1, 9:16 — all under `artifacts/szl-demo-video/deliverables/`
- [ ] Public link: `szlholdings.com/demo`
- [ ] LinkedIn / X / agency-distribution copy drafted in `B-04-distribution-copy.md`

## 5. Acceptance criteria

- A non-SZL viewer can, after watching once, articulate the three points in §1 in their own words.
- The recording shows real product surfaces (no Figma frames, no fake terminals).
- Total runtime ≤ 1:35.
- Captions match the audio at the word level.
- The `/replay-attestation` URL shown in scene 6 is live and returns a successful match for the run ID shown in scene 4 at the time of publication.

## 6. Honest disclosure

We will not stage screen recordings to imply behavior the product cannot perform. If a feature in the script does not exist on the recording day, the script is rewritten — not the recording. Every claim in the VO maps to a real on-screen action in the same scene.
