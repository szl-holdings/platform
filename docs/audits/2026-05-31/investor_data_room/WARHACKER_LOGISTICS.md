# Warhacker Logistics — San Diego, June 16–19 2026

**SZL Holdings · 2026-06-01 · prepared by Yachay · 15 days out**
**Event:** Warhacker (Defense Unicorns), Downtown San Diego, 16–19 June 2026, free to attend, ~400 curated Warhackers ([Warhacker brief](../../phd_warhacker/00_WARHACKER_2026_FULL_BRIEF.md)). Exact venue disclosed upon acceptance.

> **🚩 GATING ITEM:** Warhacker **registration is NOT yet confirmed.** Approval waves passed; the documented late-entry path is **through Andrew Greene / warhacker@defenseunicorns.com**. Confirm before booking non-refundable travel.

---

## 1. Schedule

| Day | Date | Activity |
|---|---|---|
| Day 0 | Mon 16 Jun | Travel → Downtown SD; professional networking (after-hours) |
| Day 1 | Tue 17 Jun | Form teams → commence Warhacking |
| Day 2 | Wed 18 Jun | Continue Warhacking |
| Day 3 | Thu 19 Jun | Complete → **Outbrief** → return to base |

**Internal build deadlines (must hit before travel):** MVP cut **Jun 10**, full polish **Jun 14**, dress rehearsal **Jun 15** (Greene 5-min flow + P1 4-min, airgapped, twice clean), **freeze Jun 16** ([WARHACKER_TIMING_PLAN](../killinchu/warhacker/WARHACKER_TIMING_PLAN.md)).

## 2. Travel — flights (NYC → San Diego)

- **Outbound:** depart NYC (JFK/EWR/LGA) morning of **Mon 16 Jun**; ~6h nonstop (JFK–SAN on JetBlue/Alaska/American). Arrive midday PT — accounts for 3h time-zone gain, leaves the evening for Day-0 networking.
- **Return:** **Thu 19 Jun** evening or **Fri 20 Jun** morning (red-eye risky before an outbrief day; prefer Fri AM if budget allows).
- **Book refundable / flexible fare** until registration is confirmed.

## 3. Hotels (Gas-Lamp Quarter, walkable to downtown venues)

Target the **Gaslamp Quarter** (downtown SD, walkable, where after-hours gatherings concentrate). Candidate properties: Hard Rock Hotel SD, Hotel Indigo Gaslamp, Pendry San Diego, Kimpton Solamar, Marriott Gaslamp. Book a refundable rate for **4 nights (Jun 16–19, checkout Jun 20)** near the venue once disclosed.

## 4. Demo hardware (redundancy is the doctrine)

| Item | Why | Backup |
|---|---|---|
| Primary demo laptop | Runs Killinchu Space locally / airgapped | Second laptop (cloned, tested) |
| Tablet | Hand-around demo + KhipuKnot 3D viewing | — |
| **Backup MiFi / 5G hotspot** | Venue WiFi unreliable; airgapped demo doesn't need it but uploads do | Second carrier SIM |
| USB-C → Ethernet adapters (×2) | Wired fallback if WiFi fails | — |
| HDMI/USB-C → display adapters (full kit) | Outbrief projector compatibility unknown | — |
| Power: chargers, GaN brick, power strip | All-day floor | Battery bank |
| **Warhacker USB bundle** | Signed UDS bundle + demo + reference docs (`82_WARHACKER_USB_BUNDLE_MANIFEST.md`) | 2 copies |

## 5. On-site internet redundancy plan

1. **Primary:** demo runs **airgapped** — pre-seeded recorded RF/SIGINT cue, no live constellation dependency (matches the honest Constellation-Survey note). The 4-min P1 and 5-min Greene flows need **no internet**.
2. **Secondary:** venue WiFi for non-demo (email, intros).
3. **Tertiary:** personal MiFi/5G hotspot + second-carrier SIM.
4. **Wired:** USB-C→Ethernet if a wired drop exists.
> The demo's design (offline re-derivation against replay hash `bacf5443…`) means a total network outage does **not** break the pitch — say this to judges as a feature.

## 6. Collateral

- **Business cards** (founder; QR → exec summary + GitHub org).
- **One-pager handouts** (print the Greene-kit 1-pager, ~25 copies).
- **Demo cards** — 4-min P1 script + 5-min Greene flow on index cards (operator + narrator).
- **Honest-label appendix** printed (749/14/163, Conjecture, SLSA L1, PLACEHOLDER) — never claim more than the receipts show.
- **Badge/lanyard** — issued on-site at check-in (Day 0); confirm pickup window on acceptance.

## 7. After-hours / hospitality (where Greene + network gather)

- Day-0 (Jun 16) evening professional networking is the relationship moment — Gaslamp Quarter bars/restaurants near the venue.
- **Plan to be where Greene is.** Coordinate via the Monday DM / LinkedIn; ask him directly where the DU crew gathers.
- Keep the pitch engineer-first in these settings (architecture, not business value) per his stated preference.

## 8. Pre-travel checklist (owner: Founder unless noted)

- [ ] **Confirm Warhacker registration via Greene** — GATING
- [ ] Book refundable flights (NYC→SAN) + Gaslamp hotel (4 nights)
- [ ] MVP cut Jun 10 / polish Jun 14 / dress rehearsal Jun 15 (Yachay/agents)
- [ ] Pack + test all hardware + 2× USB bundle
- [ ] Print cards + 1-pagers + honest-label appendix
- [ ] Charge everything; pack power strip + battery bank
- [ ] Freeze build Jun 16 — no commits after

---

*Signed — Yachay · 2026-06-01. Registration unconfirmed (flagged). Demo runs offline by design. No bandaid.*
