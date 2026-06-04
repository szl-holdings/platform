# Demo Script: SZL Holdings — Governed Autonomy Demo Video

**Artifact:** `szl-demo-video` → `/szl-demo-video/`  
**Duration:** 77 seconds (full cut) · 30-second and 60-second social cuts available  
**Persona:** Investor, prospect, or conference audience — no login required  
**Pre-requisites:** None. This is a standalone video artifact — no backend, no seed data, no auth.

---

## What This Artifact Is

The Demo Video is a self-contained, browser-rendered animated video artifact. It plays entirely in the browser using React and Framer Motion — no video file, no streaming. It is the platform's primary first-impression asset.

**Three-act narrative structure:**
1. **Act I — The Problem** (0–12s): "The era of AI without receipts is ending." Governance gap reveal with a trace ID.
2. **Act II — The Solution** (12–65s): Tours all 10 product surfaces (reel), the Decision Fabric primitives (fabric), and CORTEX mobile alert chain (cortex).
3. **Act III — The Brand** (65–77s): SZL brand lockup, tagline, and founder call-to-action.

---

## Pre-Demo Checklist

- [ ] Open the video URL in a **full-screen browser tab** or external display
- [ ] Set browser zoom to 100% (the video renders at 16:9 in-browser)
- [ ] Confirm captions (CC) are on or off per audience preference — toggle with the CC button
- [ ] Select the correct cut (Full / 30s / 60s) using the cut selector before presenting

---

## Demo Flow

### Step 1 — Navigate to the artifact (30 seconds before)

Open `/szl-demo-video/` and let it sit at frame 0. It will not auto-play until you press Play. Give the audience context:

> "This is a 77-second overview of the SZL Holdings platform — it runs entirely in the browser, no video file. What you're about to see is built on the same code base as the live product."

### Step 2 — Select your cut

Use the cut selector at the top right:
- **Full (77s)** — investor meetings, board presentations
- **60s cut** — conference demos, partner introductions
- **30s cut** — social media, first pitch impression

### Step 3 — Press Play and narrate lightly

The video is captioned, so narration is optional. If narrating, hit these beats:

| Time | Scene | Narration cue |
|------|-------|---------------|
| 0–12s | Open | "The problem: AI systems making consequential decisions with no audit trail." |
| 12–37s | Reel | "The platform: ten vertical command surfaces, all governed by the same substrate." |
| 37–55s | Fabric | "The backbone: Alloy Execution Fabric — six governed primitives, all auditable." |
| 55–65s | Cortex | "CORTEX: the cross-domain alert chain. Human approval before any autonomous action." |
| 65–77s | Close | "Governed Autonomy — that's the SZL difference." |

### Step 4 — Replay or chapter-jump

Use the chapter marker bar below the video to jump to any act instantly. Useful for:
- Investors who want to re-see the product reel
- Technical audiences who want to re-examine the Fabric primitives
- Press who want the brand lockup frame for screenshots

### Step 5 — Hand off

> "What you just saw is a single platform, fourteen products, one governed substrate. Ready to go deeper on any vertical?"

---

## Social Cut Quick Reference

| Cut | Duration | Scenes | Best for |
|-----|----------|--------|---------|
| Full | 77s | All 5 | Investor meeting, board, demo day |
| 60s | 60s | Open + Reel + Fabric + Close | Partner intro, conference |
| 30s | 30s | Open + Close | Social, cold outreach |

---

## Avoidance Guide

| Do NOT | Why | Alternative |
|--------|-----|-------------|
| Resize the browser window while playing | Framer Motion layout animations can stutter on resize | Set size before playing |
| Use mobile browser for live presentation | Mobile viewport renders compressed | Use desktop/tablet in landscape |
| Hard-refresh during playback | Resets to frame 0 | Use chapter markers to return to position |

---

## Q&A Preparation

**Q: Is this a recorded video?**  
A: No. It's rendered live in the browser using React and Framer Motion — the same technology powering the actual product UIs. There's no video file.

**Q: Can you white-label this for our brand?**  
A: Yes. The scene components are parameterized — brand colors, logo, and tagline can be swapped per client. Discuss with the account team.

**Q: Can we embed this on our website?**  
A: Yes — the artifact can be deployed as a standalone iframe embed or standalone URL. The current build is served at `/szl-demo-video/`.

**Q: Why no sound?**  
A: Intentional. Presentations in investment settings often run without audio. Captions carry the full narrative. A voiced version with Elevenlabs narration is a planned follow-on.

---

*See also: `docs/demo/demo-day-guide.md` (full platform narrative), `docs/demos/README.md` (all artifacts)*
