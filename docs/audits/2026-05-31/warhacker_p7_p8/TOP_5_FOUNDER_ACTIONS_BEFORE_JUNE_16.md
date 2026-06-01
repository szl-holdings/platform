# TOP 5 FOUNDER ACTIONS BEFORE JUNE 16
**For:** Stephen P. Lutar only — these are the things **no one else can do for you** (they need your accounts, your card, your signature, your calendar). **By:** Yachay · 2026-06-01 · **T-minus 15 days.**

> Everything else in the readiness audit can be delegated or scripted. These five cannot. Do them in this order. Total founder time: **~3.5 hours of your hands + lead-time waits.**

---

## 1. Set `HF_TOKEN` as a Space secret (unblocks the live demo) — **15 min**
- **Why:** The `/killinchu/missions` Spaces need an `HF_TOKEN` to call the Hub at runtime (model pulls, gated endpoints). Without it, P7/P8 endpoints 500 at the booth. This is the cheapest, highest-leverage unblock.
- **How:** huggingface.co → your Space (under **SZLHOLDINGS**) → **Settings → Variables and secrets → New secret** → name `HF_TOKEN`, value = a **fine-grained read token** (Settings → Access Tokens → New → fine-grained, read-only on the repos the Space needs). Do **not** use a write token in a Space secret.
- **Where:** https://huggingface.co/settings/tokens and your Space settings page.
- **Done when:** the Space rebuilds and the P1/P6 endpoint returns 200 without a token error in the logs.

## 2. Connect Zenodo ↔ GitHub for a citable DOI — **20 min + 1 release**
- **Why:** A Zenodo DOI on the SZL repo turns "a GitHub project" into a **citable artifact** — exactly the provenance signal a defense/IC audience and your ORCID record reward. It also future-proofs the "everything is receipted" thesis with an external, permanent anchor.
- **How:** zenodo.org → log in with GitHub → **Settings → GitHub** → flip the toggle **ON** for `github.com/szl-holdings/<repo>` → then cut a **GitHub Release** (e.g. `v0.8.0-warhacker`). Zenodo mints a DOI automatically on release and links it to your ORCID **0009-0001-0110-4173**.
- **Where:** https://zenodo.org/account/settings/github/ and your repo's Releases page.
- **Done when:** a DOI badge resolves and shows on the repo README; add the DOI to the booth one-pager.

## 3. Buy the domains — `szlholdings.com` + an `a11oy.code` TLD — **30 min**
- **Why:** A defense PM who Googles you at the booth must land on **your** page, not a parked squatter. `a11oy.code` is the product brand — own the matching TLD before someone else does after the event.
- **How:** Register `szlholdings.com` at any reputable registrar (Cloudflare Registrar is at-cost, no markup). For `a11oy.code`: `.code` is not a public gTLD, so secure the practical equivalents — **`a11oy.dev`, `a11oy.ai`, and `a11oy.io`** — and point them at the HF Space or a one-page holding site. Set up email forwarding (`stephen@szlholdings.com`) the same day.
- **Where:** https://dash.cloudflare.com (Registrar) or Namecheap/Porkbun.
- **Done when:** `szlholdings.com` resolves to a holding page with your one-liner + links to HF/GitHub/ORCID, and the `a11oy.*` set is registered and parked to the same page. **Put this URL on the business cards** (so finalize before the §card-print step in the audit).

## 4. Schedule the 60-min Greene walkthrough — by **Jun 10** — **10 min to book**
- **Why:** Greene is pre-approved and warm. A private walkthrough **before** the floor turns the booth demo into a confident second showing and lets you fix anything he reacts to. This is your single highest-probability conversion and only you can book it.
- **How:** Send Andrew Greene a direct calendar invite for a 60-min video call **on or before Jun 10**. Agenda: 5-min [GREENE_AUDIT_DEMO_FLOW] live + P6→P7 bridge (his ATO BoE now ingests AI-reasoning receipts) + P8 sovereignty toggle + ask him which named DU people (Slaughter, McCoy, Thompson) to prioritize on the floor.
- **Where:** your calendar + Greene's direct line/email.
- **Done when:** the invite is **accepted** and on the calendar. If he can't do 60, take 30. Do not let this slip past Jun 10.

## 5. Order the demo-critical hardware (cap ~$1,500) — **45 min, ORDER THIS WEEK**
- **Why:** The full go-bag is ~$2,500–$3,000, but the **demo-critical minimum** fits under ~$1,500 and has the longest lead times. If it's not ordered this week, it won't arrive. **This is currently a spec, not a purchase — that is the gap.**
- **How (one cart, prioritized by lead time):**
  | Item | ~$ | why critical |
  |---|---|---|
  | HackRF One (RECEIVE-ONLY) | ~$400 | longest lead time; the RF-detection prop. **Never transmit near Naval Base SD.** |
  | RTL-SDR Blog V4 + antenna | ~$60 | cheap, the realistic detection demo |
  | HDMI capture card + 2 USB-C/HDMI adapter sets | ~$120 | booth display — you don't control the venue monitor |
  | 1 portable monitor (2nd if budget) | ~$200 | guaranteed display independent of booth |
  | 3× 1TB SSD | ~$210 | the Plan-B canned demo videos + clones live here |
  | 2 USB-C Ethernet adapters, power strip, 25ft extension, spare 100W charger | ~$130 | booth power/connectivity reality |
  | 3D-print filament for DJI decoys (×3) + DJI Mini 3 if not owned | ~$300 | print lead time — start prints this week |
  | **Subtotal** | **~$1,420** | under cap ✅ |
- **Where:** Amazon (fast items) + your 3D-print queue (start immediately) + Great Scott Gadgets/retailer for HackRF.
- **Done when:** all orders confirmed with **delivery dates before Jun 13** (so the §3 airgapped smoke-test can use the real kit). The remaining ~$1,000 of the full go-bag (2nd monitor, Starlink Mini, extra cables, cards/one-pagers print run) can follow once §1a numbers are locked and §3 domain is live.

---

### The sequence in one line
HF_TOKEN today → Zenodo + domains this week → hardware ordered this week → Greene booked by Jun 10 → then the team smoke-tests, records Plan-B videos, and prints cards with the locked 749/14/163 numbers and the new `szlholdings.com` URL.

— Signed **Yachay** · 2026-06-01 · No mysticism. No bandaid.
