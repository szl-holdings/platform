# X (Twitter) launch — research & applied takeaways (2026)

Compact brief on current best practice for B2B/defense-tech/maritime/real-estate brand accounts on X, and how it's applied to this kit.

## 1. Image specs (current, 2026)

| Asset | Pixels | Notes |
|---|---|---|
| Avatar | **400 × 400** (min 200×200) | X crops to a circle. Put nothing critical in the corners. Centered monogram is safest. |
| Header banner | **1500 × 500** (3:1) | **Center-safe zone is ~1200 × 380**. Avatar overlaps the bottom-left corner by ~220 px — keep that area free of text. Mobile scales the header to ~16:9 and can hide the far edges. |
| In-feed single image | **1600 × 900** (16:9) is the safest for desktop; 1:1 (**1200 × 1200**) maximizes vertical real estate on mobile. We ship both. |
| Video thumbnail | 1280 × 720 | Out of scope for v1 |

Applied: the kit ships avatar at exactly 400×400, header at 1500×500 with text confined to the center-safe rectangle and the bottom-left kept clear for the avatar overlap. Three header variants let you A/B on brand tone (gold editorial / command cyan / Aegis amber).

## 2. Profile conventions that still work

- **Bio formula (2026):** `<what you are> · <who it's for> · <how it works in 3 words>`. The Primary bio in `bio.md` follows this: "Governed decision infrastructure · for high-consequence ops · Observe → Understand → Decide → Execute."
- **Location field:** brands increasingly put **two cities** to signal reach without looking remote-ambiguous. We use `New York · Miami`.
- **Pinned post:** single strongest value claim with one link. Not a welcome thread — pin a CTA. We pin the "Dashboards tell you what happened…" post.
- **Verification/ID:** gold/affiliate checkmarks now read as brand-account signals. If you upgrade to Premium+ Org, add the affiliate badge pointing back to `@szlholdings` from product subaccounts (`@aegis`, `@vessels`, etc.) when you spin them up.

## 3. What top B2B / defense / maritime / real-estate accounts do well

Observations consistent across 2025–2026 leaders in these categories:

1. **Show the product.** Palantir, Anduril, Rhombus, Anduril Maritime — every post has a screenshot, map, or product frame. Text-only posts underperform by ~2-3× on impressions.
2. **Operator language beats marketing language.** "We shipped a correlation engine for OT telemetry" outperforms "AI-powered security platform." Specific > aspirational.
3. **Threads that teach the doctrine**, not the features. "Here's how we think about X" threads consistently outperform feature listicles. The Thursday 17:45 thread in this kit follows that template.
4. **Recurring post shapes:** (a) *announcement with product shot*, (b) *principle with one sentence of proof*, (c) *vertical spotlight with a stat*, (d) *design partner/recruiting call*. The 9-post calendar cycles all four.
5. **Sparingly used emoji act as eye-catch** — `↓`, `→`, `◼`, `📌`. Sparkle/rocket emoji now read as crypto-adjacent and hurt credibility for enterprise brands.
6. **Hashtag discipline:** 0–2 max. `#Maritime`, `#Defense`, `#RealEstate`, `#CyberSecurity`, `#PropTech` still route intent; generic `#AI`, `#Innovation` add noise without reach.
7. **Reply ladders matter more than posting cadence.** Accounts that reply to 3–5 comments within the first hour see 1.5–2× the follower growth of equivalent-volume accounts that post and leave.
8. **Bookending the week.** Thursday-announcement + Monday-CTA is a proven pattern — Thursday captures the pre-weekend info-gather, Monday captures the planning-window with a concrete ask.

## 4. Leader accounts worth watching (benchmarks)

- **Palantir** — [@PalantirTech](https://x.com/PalantirTech) — doctrine threads, product stills, calm tone.
- **Anduril** — [@anduriltech](https://x.com/anduriltech) — defense-product visuals, announcement arcs around hardware drops.
- **Windward** — [@WindwardAI](https://x.com/WindwardAI) — maritime intelligence, map screenshots with annotation, very close to our Vessels tone.
- **Cape Analytics** — [@capeanalytics](https://x.com/capeanalytics) / **Placer.ai** — [@placer_ai](https://x.com/placer_ai) — real-estate data posts, one-stat-per-card framing → translated to our Terra `$4.8B / 1,025 assets / 6 modules` post.
- **Ramp** — [@tryramp](https://x.com/tryramp) — B2B tone model; product screenshot-driven, tight copy, one-idea-per-post.

### Reference reading (specs & playbooks)

- X Help Center — **Customize your profile** (avatar & header dimensions, safe zones): https://help.x.com/en/managing-your-account/how-to-customize-your-profile
- X Developer Docs — **Posts API v2** (character limits, media attachment, reply chaining): https://docs.x.com/x-api/posts/creation-of-a-post
- X Developer Docs — **Media upload (v1.1)** used for image attachments: https://developer.x.com/en/docs/x-api/v1/media/upload-media/overview
- Sprout Social — **2026 image size cheat sheet** (cross-checked against X's current specs): https://sproutsocial.com/insights/social-media-image-sizes-guide/
- Buffer — **B2B posting cadence study 2025** (reply-ladder data + best-day-of-week findings): https://buffer.com/resources/social-media-posting-schedule/
- Typefully — **Thread hooks that convert on X**: https://typefully.com/blog/best-twitter-threads

## 5. Takeaways applied to this kit

| Takeaway | Where it shows up |
|---|---|
| 400×400 avatar, centered monogram, corners clear | `avatar-400x400.png` |
| Text inside center-safe zone of header, avatar area clear | `header-1500x500.png` + variants |
| Bio follows `<what> · <who> · <loop>` formula | `bio.md` → Primary bio |
| Pinned = single strongest value claim, one link | `bio.md` → Pinned tweet |
| Every post ships with a product image | 9/9 posts in `content-calendar.md` have an attached asset |
| One thread teaches the doctrine | Thursday 17:45 post (6 tweets) |
| Operator language, 0–2 hashtags | All 9 posts |
| Announcement/CTA bookends | Post 1 (Thu) and Post 9 (Mon) |
| Reply-ladder tactic documented | Engagement tactics section of content calendar |

## 6. Open experiments (next 30 days)

- **Subaccount split**: spin up `@aegis_soc`, `@vessels_maritime`, `@terra_re` once parent account crosses 1K followers — affiliate-badge each under `@szlholdings`.
- **Image variant A/B**: run header variants 1 / 2 for two weeks each, track profile-visit → follow conversion from analytics.
- **Day-of-week iteration**: if Thursday consistently beats Monday, shift the CTA post from Monday to Wednesday and see if mid-week close-rate lifts.
