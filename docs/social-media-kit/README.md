# SZL Holdings — Social Media Kit

Complete step-by-step instructions for setting up and publishing SZL Holdings' social media presence. All content referenced here is pre-loaded in the Distribution OS.

---

## Brand Assets

### Profile Avatar (Square)
**File:** `artifacts/szl-holdings/public/brand-kit/szl-avatar-square.png`
- Format: 1:1 square PNG
- Design: Gold "SZL" monogram on dark charcoal background
- Use on: X (Twitter), LinkedIn, Medium, Substack, Instagram

### X / Twitter Banner
**File:** `artifacts/szl-holdings/public/brand-kit/szl-x-banner.png`
- Format: 16:9 wide PNG (use as 1500×500 when uploading to X)
- Design: "SZL Holdings" + tagline "Structured ventures. Clear direction." on dark background
- Use on: X header image

---

## Platform Setup Instructions

### 1. X (Twitter / X.com)
**Account:** @szlholdings

**Upload Steps:**
1. Go to x.com → Profile → Edit Profile
2. Upload avatar: `szl-avatar-square.png` (profile photo)
3. Upload banner: `szl-x-banner.png` (header photo, crop to 1500×500)
4. Bio: "AI-native enterprise intelligence. 10 platforms. Maritime, defense, real estate, legal, advisory + compound intelligence layer. Founder: @stephenlutar. szlholdings.com"
5. Website: https://szlholdings.com
6. Location: Washington, DC

**First Content — Pinned Thread:**
Go to Distribution OS → X Studio. Find the 6-tweet thread starting with "Introducing SZL Holdings." Queue all 6, publish, then pin the first tweet to profile.

**Ongoing:** Post from X Studio. Aim for 1 post/day minimum. Mix of thread parts, platform spotlights, and authority posts.

---

### 2. LinkedIn
**Company Page:** linkedin.com/company/szl-holdings

**Upload Steps:**
1. Go to LinkedIn → Manage Page → Edit Page
2. Logo: Upload `szl-avatar-square.png` (400×400 minimum)
3. Banner: Create a custom 1128×191 banner (use X banner as base, crop/resize)
4. Tagline: "Structured ventures. Clear direction."
5. About: Use the SZL Holdings company description from the Profile Copy Pack
6. Website: https://szlholdings.com
7. Industry: Software Development
8. Company size: 11–50 employees

**First Content:**
Go to Distribution OS → Carousel Lab. Export "The SZL Ecosystem" carousel. Post to LinkedIn with the long caption from the carousel detail view.

**Ongoing:** 3–5 LinkedIn posts/week. Carousels perform best. Link to insights articles in comments.

---

### 3. Medium
**Publication:** medium.com/@stephen_38454

**Upload Steps:**
1. Go to Medium → Profile Settings
2. Upload photo: `szl-avatar-square.png`
3. Bio: "Founder & CEO of SZL Holdings. Writing on AI-native enterprise intelligence, maritime risk, and building vertical AI platforms. szlholdings.com"
4. Social links: Add LinkedIn and X profile URLs

**First Article:**
Go to Distribution OS → Articles CMS. Find "Why We Built SZL Holdings." Copy the markdown body content. In Medium, create new story, paste content, add canonical URL pointing to `https://szlholdings.com/insights/why-we-built-szl-holdings`.

**Publishing canonical URL in Medium:**
Story → More settings → SEO & Canonical link → Add canonical URL

**Ongoing:** Cross-post one article/week from Articles CMS. Always add canonical URL.

---

### 4. Substack
**Publication:** szlholdings.substack.com

**Upload Steps:**
1. Go to Substack → Settings → Publication Details
2. Publication name: "Signal Over Noise"
3. Logo: Upload `szl-avatar-square.png`
4. Tagline: "Weekly signal from SZL Holdings on AI-native enterprise intelligence, operational risk, and the patterns worth paying attention to."
5. About: Use the newsletter description from Distribution OS settings

**First Issue:**
Go to Distribution OS → Newsletters. Find "Signal Over Noise — Inaugural Issue." The content is ready. Copy the intro note, main story, and signoff into Substack editor. Publish.

**Ongoing:** Send one issue per Monday. Draft in Distribution OS Newsletter CMS, then copy to Substack.

---

### 5. Instagram (Optional)
**Account:** @szlholdings

**Upload Steps:**
1. Create account at instagram.com
2. Upload avatar: `szl-avatar-square.png`
3. Bio: "AI-native enterprise intelligence. 10 platforms across maritime, defense, real estate, legal, advisory + compound intelligence layer. 🔗 szlholdings.com"
4. Add link: https://szlholdings.com

**Content:**
Export carousels from Distribution OS → Carousel Lab. Use the Instagram caption from each carousel. Post 2–3 times/week.

---

## Content Calendar (7-Day Launch Sequence)

Pre-loaded in Distribution OS → Content Calendar. Summary:

| Day | Action | Channel |
|-----|--------|---------|
| Day -2 | Publish flagship article to site | Site |
| Day -2 | Send inaugural newsletter | Substack |
| Day -1 | Post 6-part X thread (pin immediately) | X |
| Day 0 | Post ecosystem carousel | LinkedIn |
| Day 0 | Cross-post flagship article | Medium |
| Day +1 | Aegis spotlight X post | X |
| Day +2 | Publish observability article + carousel | Site + LinkedIn |
| Day +3 | Vessels + Terra spotlight X posts | X |
| Day +5 | Send newsletter issue #2 | Substack |
| Day +6 | Publish "From Noise to Signal" article | Site |
| Day +7 | LinkedIn week-one roundup + newsletter CTA | LinkedIn |

---

## Distribution OS Cross-References

All content is pre-seeded in the Distribution OS:

- **X Studio:** 10+ posts ready (6-tweet pinned thread + platform spotlights + authority posts)
- **Newsletters:** 2 issues (1 approved/ready for Substack, 1 draft)
- **Articles:** 3+ articles (2 published, 1 approved)
- **Carousel Lab:** 3 carousel projects with full slides, captions, and X thread adaptations
- **Content Calendar:** 7-day launch schedule mapped to critical path

---

## Social Profile URLs

| Platform | URL |
|----------|-----|
| X (Twitter) | https://x.com/szlholdings |
| LinkedIn | https://linkedin.com/company/szl-holdings |
| Medium | https://medium.com/@stephen_38454 |
| Substack | https://szlholdings.substack.com |
| Link-in-Bio | https://szlholdings.com/link-in-bio |

---

## OG / Social Preview

All public-facing pages include proper OpenGraph and Twitter Card meta tags:

- **Landing page:** `og:title`, `og:description`, `og:image` (szlholdings.com/opengraph.jpg), `twitter:card: summary_large_image`
- **Insights page:** Dynamic via `usePageMeta` hook — unique title + description per load
- **Article pages:** Per-article OG title, description, canonical URL, `og:image`, Twitter Card, Article JSON-LD
- **Link-in-Bio:** `og:title`, `og:description` set via `usePageMeta`

Social preview image: `https://szlholdings.com/opengraph.jpg`
