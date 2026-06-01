# CUSTOMER_PITCH_STORY — one SOC pane for airspace AND drone supply chain

**Audience:** Greene's network (defense / critical-infra security buyers)
**Author:** Yachay, under CTO authority · 2026-06-01 · 1 page
**Honesty:** every number below is the LOCKED, honest figure. Where something is not yet
cryptographically proven, the pitch says so — buyers in this segment reward honesty and punish
overclaim.

---

## The pitch (1 page)

**Today you watch two screens.** One SOC pane for your *physical airspace* (what's flying, what's
hostile). A different tool — or a spreadsheet — for your *drone fleet's supply-chain and firmware
integrity* (is the drone I'm about to launch actually running the firmware I signed?). The two
never reconcile, so the question *"is any drone compromised right now, and can I prove it?"* takes
an afternoon and three teams.

**SZL collapses that into one pane.** Sentra — our immune/dual-use layer — now carries a **Drone
Cyber** view. From the same screen that watches your airspace, you see your **entire drone fleet's
cyber posture**: live fleet status, a 30-day threat timeline, per-drone drill-down, and a single
**Quarantine** button.

**Every drone carries our detection libs *inside it*.** `szl-sentra-detect` is vendored into each
Killinchu drone image and runs in the attestation loop — firmware tamper, MAVLink anomaly, RF
fingerprint deviation, GPS spoofing — mapped to ten tamper tripwires (T11–T20). The drone doesn't
phone home with a "trust me"; it ships **evidence**.

**One Book of Evidence ties it together.** Physical airspace events and drone-integrity events
land in **one Khipu DAG** — a hash-chained, append-only ledger where every receipt names its
origin flagship and links across to the others by a shared event id. When a drone trips a spoof
detector, you can follow **one continuous chain**: the Killinchu tamper receipt → the Sentra
cyber receipt → the a11oy reasoning that summarized it for you — all citable, all in one BoE.

**Ask our assistant in plain English.** *"Are any of our drones compromised?"* a11oy.code pulls
the live cyber events from Sentra, enriches each with the drone's digital twin from Killinchu, and
answers with **Khipu citations** — not vibes.

**Quarantine is safe by construction.** Isolating a suspect drone is **cyber isolation only** —
return-to-launch plus link isolation under a signed Sentra certificate. **Never kinetic, never
third-party.** It requires **two people** to approve and must clear our **Yuyay-13** governance
gate **independently on both flagships** — if the two disagree, the system **halts** and escalates
to a human. We only ever touch **our own fleet** ("WE SENSE, WE EVIDENCE") — by design, we stay
inside CFAA / ITAR / Wassenaar lines.

---

## Why this wins (and what we won't overclaim)

| You get | Honest status |
|---------|---------------|
| One SOC pane: airspace + drone-fleet cyber | **LIVE** — Sentra `/drone-cyber` tab pulls Killinchu fleet + integrity |
| Detection embedded in every drone | **LIVE** design; libs vendored, run in attestation loop |
| One Khipu Book of Evidence across flagships | **LIVE** by correlation (shared event id); a single durable cross-Space store is **not yet wired** — we'll say so |
| Plain-English assistant with citations | **LIVE** — a11oy.code orchestrates both |
| 2-person, both-flagship-agree quarantine | **LIVE** gate logic; reversible cyber-only isolation |
| Cryptographic provenance signatures | **DSSE PLACEHOLDER today** — SLSA **L1 (honest)**; Sigstore CI is on the roadmap, not claimed as done |
| Formal proofs of the governance invariants | **Tracked, not yet proven** (`sorry`-tagged); Λ-uniqueness is a **Conjecture** |

**The differentiator:** two separate buyers, two compliance regimes, one nervous system. You buy
Sentra for airspace and Killinchu for the fleet — and they already speak to each other through one
governed, evidence-first spine. No integration project on your side. You can **demo the unified
SOC pane live today**.

---

*— Yachay, 2026-06-01. Honest by design: LIVE where LIVE, PLACEHOLDER where placeholder,
Conjecture where conjecture. NO BANDAID.*
