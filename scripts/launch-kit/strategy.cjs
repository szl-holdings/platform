// Strategy content for the SZL Holdings launch kit — shared between the
// Substack and Medium PDFs, with platform-specific overrides at the bottom.

const POSITIONING = {
  oneLine:
    "Inside the build of SZL Holdings — a portfolio of AI-native command platforms for defense, maritime, real estate, legal, and advisory.",
  tagline: "Command platforms, written in public.",
  pubName: "SZL Command",
  subdomain: "szlcommand",
  audiences: [
    {
      name: "Investors",
      description:
        "Vertical-AI and industrial-stack investors looking for a front-row seat on how a multi-product command group is built, funded, and operated.",
      posts: ["Investor updates in public", "Portfolio deep-dives", "Term-sheet and fundraising essays"]
    },
    {
      name: "Enterprise buyers",
      description:
        "Defense program offices, shipowners / charterers / brokers, real-estate GPs and asset managers, heads of legal ops — the operators our products are built for.",
      posts: ["Vertical deep-dives (Aegis, Vessels, Terra, Prism Counsel)", "Market structure essays", "Compliance and governance essays"]
    },
    {
      name: "AI builders",
      description:
        "Engineers and product leaders building production AI systems in regulated industries. Our engineering diary is for them.",
      posts: ["AI platform engineering essays", "Eval / guardrail / agent-design posts", "Incident post-mortems"]
    },
    {
      name: "Press & analysts",
      description:
        "Journalists and analysts covering AI, defense-tech, maritime-tech, and industrial software. The newsletter is designed to be linkable and quotable.",
      posts: ["All posts — sources linked", "Quarterly state-of-market pieces"]
    }
  ],
  bio: {
    short:
      "Building SZL Holdings — a portfolio of AI-native command platforms across defense, maritime, real estate, legal, and advisory. Writing two long-form essays a week on the build, the market, and the lessons.",
    long: `I build command platforms.

SZL Holdings is a portfolio of AI-native command platforms: Aegis (defense & intelligence), Vessels (maritime), Terra (real-estate intelligence), Carlota Jo (advisory), Command Portal (unified operator cockpit), CORTEX (mobile), IMPERIUM (governance), Forge (client delivery), Autopilot (agentic workflows), and Prism Counsel (legal & compliance).

Each product is a vertical operator surface with AI as an ingredient rather than the product. The spine underneath — auth, evals, guardrails, audit, governance — is shared. The bet is that the next decade of enterprise software will be won by small groups of vertical command platforms with a shared AI backbone, sold to specific operator roles, and compounding trust faster than horizontal AI vendors can flatten it.

This newsletter is where I write about building all of it — in public, in order, with the receipts. Two essays a week, six pillars, no fluff.`
  },
  aboutPage: `## About SZL Command

SZL Command is the writing home of the SZL Holdings build.

### What you'll get
- Two long-form essays every week (Tuesday and Friday).
- Portfolio deep-dives, market structure analysis, engineering essays, and a monthly investor-style update published in public.
- Quarterly state-of-market pieces covering defense, maritime, and real estate from an operator-tech perspective.
- Occasional interviews with operators, investors, and builders in adjacent spaces.

### The six pillars
1. **Defense & Intelligence** — Aegis, command-surface design, AI in high-assurance environments.
2. **Maritime** — Vessels, port-call intelligence, freight and bunker markets, compliance.
3. **Real Estate Intelligence** — Terra, underwriting, market structure, migration and climate.
4. **AI Platform Engineering** — evals, guardrails, agent design, infra decisions, incident learning.
5. **Founder Journey** — hiring, fundraising, governance, and running six products with a small team.
6. **Portfolio Deep-Dives** — one product per month, top to bottom.

### Who reads this
Investors (vertical AI, industrial stack), enterprise buyers in defense / maritime / real-estate / legal, AI builders in regulated industries, and press covering the space. If you're one of those, you're the audience.

### What you won't get
- Recycled news commentary.
- "Thought leadership" that's really a vendor pitch in a blazer.
- Fabricated numbers. When a metric isn't real yet, it's marked as such.

### Paid tier
A founding-member tier is available. It includes:
- The quarterly investor-style deep-dive memo (paid-only).
- A monthly small-group office-hours call.
- A private forum and directory.
- Every essay stays free — paid gets you the *extras*, not the essentials.

### Contact
Reply to any email, or reach out via the SZL Holdings site.`
};

const VISUAL_IDENTITY = {
  paletteName: "SZL Holdings — Platinum/Obsidian",
  palette: [
    { name: "SZL Base", hex: "#060912", usage: "Primary background" },
    { name: "SZL Secondary", hex: "#070a10", usage: "Panels, cards" },
    { name: "SZL Accent (Gold)", hex: "#D4A054", usage: "Brand mark, headlines, CTAs" },
    { name: "SZL Accent Light", hex: "#E3BB80", usage: "Hover, highlights" },
    { name: "Text Primary", hex: "#F2EFE8", usage: "Body copy" },
    { name: "Text Secondary", hex: "#9CA3AF", usage: "Secondary copy" },
    { name: "Lyte Cyan", hex: "#0FB3D4", usage: "Product signal (Lyte)" },
    { name: "Alloy Indigo", hex: "#3A63E0", usage: "Product signal (Alloy)" },
    { name: "Aegis Blue", hex: "#3B82F6", usage: "Defense/security mentions" },
    { name: "Vessels Sky", hex: "#1D90D1", usage: "Maritime mentions" },
    { name: "Terra Green", hex: "#40856A", usage: "Real-estate mentions" },
    { name: "Carlota Amber", hex: "#C8913A", usage: "Advisory mentions" }
  ],
  typography: {
    display: "Space Grotesk (weights 500/600/700) — used for headlines, section headers, pull quotes.",
    body: "Inter (400/500/600) — body copy, nav, lists.",
    mono: "JetBrains Mono (400/500) — metrics, code, eyebrow labels.",
    serifException:
      "Cormorant Garamond reserved for Carlota Jo advisory posts only. Do not use elsewhere."
  },
  coverImageDirection: `Every cover image is one of three archetypes:
- **Topographic / Cartographic** — layered contour lines, maritime charts, parcel overlays, command-grid textures. Monochrome, gold accent line.
- **Data-surface** — abstract dashboard treatments with minimal data glyphs, glassmorphic depth, gold highlight on the KPI that matters.
- **Portrait / Object** — a single physical object or detail (a bridge, a port, a contract, a screen) shot or rendered against the obsidian palette with one gold highlight.

Never use stock AI-generated people or generic "technology" imagery. Never use more than one gold highlight per cover.`,
  uiPrinciples: [
    "Dark-first, not dark-mode. The obsidian palette is the home, light is the exception.",
    "Gold is a signal, not a decoration. One per view.",
    "Typographic hierarchy does the heavy lifting — size, weight, tracking. Color comes last.",
    "All numbers are tabular mono. Operator trust requires numeric alignment.",
    "Whitespace is a budget line. Spend it generously on launch posts, tighter on updates."
  ]
};

const PILLARS = [
  { id: 1, name: "Defense & Intelligence", share: 0.17, color: "Aegis Blue" },
  { id: 2, name: "Maritime", share: 0.17, color: "Vessels Sky" },
  { id: 3, name: "Real Estate Intelligence", share: 0.17, color: "Terra Green" },
  { id: 4, name: "AI Platform Engineering", share: 0.21, color: "Lyte Cyan" },
  { id: 5, name: "Founder Journey", share: 0.17, color: "SZL Accent (Gold)" },
  { id: 6, name: "Portfolio Deep-Dives", share: 0.11, color: "Alloy Indigo" }
];

const WELCOME_EMAIL = {
  subject: "Welcome to SZL Command — what's here, and what's next.",
  preview: "Two essays a week, six pillars, written from inside the build.",
  bodyMarkdown: `Hi — thanks for subscribing to **SZL Command**.

You just bought a front-row seat on the build of SZL Holdings — a portfolio of AI-native command platforms for defense, maritime, real estate, legal, and advisory. Here's what you can expect.

### The rhythm
- **Tuesday** — a long-form essay on one of the six pillars (Defense & Intelligence, Maritime, Real Estate, AI Platform Engineering, Founder Journey, Portfolio Deep-Dives).
- **Friday** — the second essay of the week. Usually product-or-market, sometimes the founder journey.
- **Quarterly** — an investor-style update, published in public, with the same numbers I send the cap table.

### Three places to start
1. **Why I'm Building SZL Holdings in Public** — the founding post. The *what* and the *why*.
2. **The Case for Vertical Command Platforms** — the thesis behind every product in the portfolio.
3. **Inside Aegis: Building a Command Surface for Modern Defense** — the first product deep-dive.

### One ask
Reply to this email and tell me one thing: which of the six pillars do you want me to prioritize in the next 30 days? I read every reply and the answers shape the calendar.

### A note on the paid tier
The paid (founding-member) tier is open. It includes the quarterly investor-style deep-dive memo, a monthly small-group office-hours call, and a private forum and directory. Every essay on the list stays free — paid is for the *extras*, not the essentials.

If you're an investor, buyer, builder, or operator in one of the domains I cover, you are exactly the person this newsletter is written for. Welcome in.

— S

P.S. — If someone you respect forwarded you this, you can subscribe directly at [szlcommand.substack.com](#).`
};

const GROWTH_PLAN = {
  crossPosting: [
    "Primary publication on Substack with email-owned list and paid tier.",
    "24-hour-delayed cross-post to Medium with canonical URL back to Substack to protect SEO and email metrics.",
    "LinkedIn short-form (150–250 words) same-day with a single branded image and a CTA back to Substack.",
    "X thread (6–10 posts) same-day with the sharpest claims from the essay and a link in the last post only.",
    "Quarterly deep-cut posts go to the SZL Holdings site blog as pillar content for SEO."
  ],
  amplification: [
    "Founder X/LinkedIn accounts post every essay same day within an hour of Substack publication.",
    "Team members (when they join) get a curated share template — no spammy comment swaps.",
    "Design partners and customers get a heads-up 24 hours before any essay that names them.",
    "Each month, one essay is picked as a 'flagship' and pitched to a Medium publication (The Startup, Towards AI, domain pubs).",
    "Every essay ends with one concrete ask — reply, intro, subscribe — never three.",
    "Monthly roundup email to subscribers only: the month's essays, the most replied-to, and upcoming topics."
  ],
  github: [
    "Every GitHub repo README links to the relevant SZL Command essay for context.",
    "Cross-link essays that reference open-source work from inside the essay.",
    "A dedicated 'Reading' section on the SZL Holdings org README points to the newsletter."
  ],
  partnerCrossPromos: [
    "Adjacent-vertical newsletters (maritime, defense, real-estate, AI infra) — three curated cross-promos per quarter, no trade-for-trade spam.",
    "Guest essays: one per month from month three, targeting complementary audiences.",
    "Podcast appearances: one per month from month two, prioritizing investor and operator audiences over pure tech shows.",
    "Conference and industry-event mentions: speaking slots routed back to the newsletter as the archive."
  ],
  paidTierPricing: {
    free: "All essays, monthly roundup.",
    paid: "$15 / month or $150 / year (standard). Includes quarterly investor-style memo, monthly office-hours call, private forum and directory.",
    foundingMember: "$500 / year (capped at 100 seats in year one). Everything above plus a 1:1 call with the founder per year and early previews of portfolio product roadmaps.",
    launchOffer: "Founding-member price locked for three years if signed up in the first 90 days."
  }
};

const MONETIZATION = {
  freeVsPaid: {
    free: "All essays, the welcome email, the monthly roundup, and the public Q-update.",
    paid: [
      "Quarterly investor-style deep-dive memo (paid-only).",
      "Monthly small-group office-hours call (45 min, capped at 20 attendees, paid-only).",
      "Private forum with the paid subscriber directory.",
      "Quarterly 'ask-me-anything' thread in the forum.",
      "Early access to paid-tier-only product previews across SZL Holdings."
    ]
  },
  foundingMemberOffer: {
    price: "$500 / year",
    cap: "First 100 seats, then closed until year two.",
    benefits: [
      "All paid-tier benefits.",
      "One 1:1 call with the founder per year (30 min).",
      "Early previews of portfolio product roadmaps.",
      "Founding-member badge on the forum.",
      "Founding-member pricing locked for three years."
    ]
  },
  consultingFunnel: `The newsletter is the top of funnel for Carlota Jo's advisory practice. Any reader who identifies as an operator, GP, program office, or executive can reply to any essay and ask about an advisory engagement. Three qualification filters run on every inbound before a call is scheduled:

1. **Scope fit** — does the engagement need match Carlota Jo's practice areas (AI platform strategy, vertical command-surface design, regulated-industry governance)?
2. **Budget fit** — is the client at a stage where advisory spend is appropriate ($100K+ engagements)?
3. **Timing fit** — can we deliver quality in the client's timeline without compromising the SZL product roadmap?

If all three pass, the next step is a 30-minute scoping call. Proposals ship within five business days.`,
  revenueMix: {
    year1: {
      "Newsletter paid": "5%",
      "Product pilots & ARR": "60%",
      "Carlota Jo advisory": "30%",
      "Other": "5%"
    },
    year3: {
      "Newsletter paid": "3%",
      "Product pilots & ARR": "80%",
      "Carlota Jo advisory": "15%",
      "Other": "2%"
    }
  }
};

const KPIS = {
  subscribers: {
    month1: "1,500 free / 40 paid",
    month3: "5,000 free / 250 paid",
    month6: "12,000 free / 700 paid",
    month12: "30,000 free / 2,000 paid"
  },
  openRate: {
    target: "45% on main essays, 55% on monthly roundup.",
    minimum: "35% — below this, diagnose list hygiene and subject lines."
  },
  clickthrough: "8–12% clickthrough to linked essays or archive.",
  paidConversion: "5–8% free-to-paid within 60 days of subscribing.",
  churn: "<2% monthly on paid.",
  inboundLeads: {
    month1: "10 qualified conversations (pilots, advisory, investors).",
    month3: "40 qualified conversations.",
    month12: "200 qualified conversations; at least 10% converted to paid engagements or investments."
  },
  trackingSheetSpec: {
    columns: [
      "post_id",
      "publish_date",
      "pillar",
      "title",
      "substack_opens",
      "substack_open_rate",
      "substack_clicks",
      "substack_new_subs",
      "medium_views_7d",
      "medium_views_30d",
      "medium_reads",
      "medium_fans",
      "medium_read_ratio",
      "linkedin_impressions",
      "linkedin_clicks",
      "linkedin_comments",
      "x_impressions",
      "x_clicks",
      "x_replies",
      "paid_conversions",
      "inbound_replies",
      "qualified_conversations"
    ],
    cadence:
      "Updated weekly, every Monday morning, from the four platform analytics dashboards. Quarterly roll-up feeds the public investor update."
  }
};

const SUBSTACK_CHECKLIST = [
  {
    step: 1,
    task: "Reserve the publication handle",
    detail: "Create the Substack publication at szlcommand.substack.com (or the chosen handle). Set publication name to 'SZL Command'."
  },
  {
    step: 2,
    task: "Upload the brand assets",
    detail:
      "Logo (gold S-mark on obsidian), favicon, and cover image. Use mockups/substack-home.png from the screenshots zip as the visual target — the gold brand mark in the top-left of that mockup is the SZL Command logo. Crop the 32×32 mark for the favicon and the hero gradient for the publication cover."
  },
  {
    step: 3,
    task: "Set the tagline and bio",
    detail: `Tagline: "${POSITIONING.tagline}". Bio: use the short bio from the positioning section. Use the Inter/Space Grotesk pairing for any custom embedded designs.`
  },
  {
    step: 4,
    task: "Write the About page",
    detail: "Paste the About-page copy from the positioning section verbatim. Add a headshot or a branded monogram."
  },
  {
    step: 5,
    task: "Configure the welcome email",
    detail: "Use the welcome email copy from this document. Subject, preview text, body all provided."
  },
  {
    step: 6,
    task: "Configure paid tier",
    detail:
      "Standard: $15/mo, $150/yr. Founding: $500/yr capped at 100 seats. Add founding-member benefits copy from the monetization section."
  },
  {
    step: 7,
    task: "Set up custom domain (optional but recommended)",
    detail: "Point szlcommand.szlholdings.com (or similar) to Substack via CNAME. Do this before launch to avoid URL fragmentation later."
  },
  {
    step: 8,
    task: "Publish the first three posts as a staggered launch",
    detail:
      "Post 1 (Why I'm Building SZL Holdings in Public) at launch. Post 2 (The Case for Vertical Command Platforms) 3 days later. Post 3 (Inside Aegis) 4 days after that. Front-load the launch week with the strongest posts to seed subscriptions."
  },
  {
    step: 9,
    task: "Send launch announcement to personal network",
    detail:
      "Personal email to 50–100 people (investors, ex-colleagues, friends of the firm) with a one-paragraph note and the first-post link. Do not blast — personalize."
  },
  {
    step: 10,
    task: "Amplify on LinkedIn and X",
    detail: "Use the LinkedIn short-form and X thread templates from this kit for each of the first three posts."
  },
  {
    step: 11,
    task: "Submit to Substack recommendations",
    detail:
      "Reach out to 5–10 aligned Substack publications (Stratechery-adjacent, vertical AI, founder-voice) and request mutual recommendations. Be specific about why the audience fit works."
  },
  {
    step: 12,
    task: "Cadence lock",
    detail: "Lock Tuesday 09:00 ET and Friday 09:00 ET publishing times in the calendar for the next 90 days."
  },
  {
    step: 13,
    task: "Analytics setup",
    detail:
      "Copy the tracking sheet spec into a Google Sheet (or Notion database). Pull the first week's metrics manually to validate before automating."
  },
  {
    step: 14,
    task: "Paid tier public launch",
    detail:
      "Week 2 or 3 post-launch, not before. A 'what's in the paid tier' post on the free list, with the founding-member offer and cap clearly communicated."
  },
  {
    step: 15,
    task: "90-day review",
    detail:
      "At day 90, publish the '90 Days of Building in Public' post (included in this kit). Use the KPI tracker to back the numbers."
  }
];

const MEDIUM_CHECKLIST = [
  {
    step: 1,
    task: "Create or claim the Medium publication",
    detail:
      "Name: 'SZL Command'. URL slug: /szl-command. Ensure the Medium username hosting the publication is on the Partner Program."
  },
  {
    step: 2,
    task: "Set up publication branding",
    detail:
      "Logo (gold mark on obsidian), header image. Use mockups/medium-publication.png from the screenshots zip. Short description: the one-line positioning."
  },
  {
    step: 3,
    task: "Configure navigation and sections",
    detail:
      "Create one section per pillar: Defense, Maritime, Real Estate, AI Engineering, Founder, Portfolio. Pin the top post of each pillar."
  },
  {
    step: 4,
    task: "Add writers",
    detail:
      "Add the founder (admin + writer) and any team members who will post. Configure default tags for the publication."
  },
  {
    step: 5,
    task: "Partner Program enrollment",
    detail:
      "Enroll the account in the Medium Partner Program. Confirm payout details. Every post after launch is published as a Partner Program story."
  },
  {
    step: 6,
    task: "Canonical URL discipline",
    detail:
      "Every cross-post must have the canonical URL set to the Substack original. Publish Medium post ~24 hours after Substack to protect email open rates and SEO."
  },
  {
    step: 7,
    task: "Tag discipline",
    detail:
      "Five tags per post. Mix: one big (Artificial Intelligence, Startup), three middle (Enterprise Software, SaaS, Product Design), one narrow (Maritime, Defense Technology, Real Estate Investing). Use the per-post tag sets provided in this kit."
  },
  {
    step: 8,
    task: "Publication-submission plan",
    detail:
      "Identify 5 target external Medium publications (Towards AI, The Startup, Better Programming, Data Driven Investor, domain-specific pubs). Submit one post per month as a guest feature with canonical back to Substack."
  },
  {
    step: 9,
    task: "Curation optimization",
    detail:
      "Follow Medium's curation guidelines — original, cited, formatted with headers and block quotes, no promotional language in the first three paragraphs. The drafted posts in this kit are already written to curation standards."
  },
  {
    step: 10,
    task: "Launch sequence",
    detail:
      "Day 1: publish posts 1–3 within 72 hours of the Substack launch, staggered. Day 14: publish the next four posts from the calendar. Day 30: first monthly retrospective on Medium performance."
  },
  {
    step: 11,
    task: "Cross-platform CTA discipline",
    detail:
      "Every Medium post ends with a 'Subscribe to SZL Command on Substack' CTA, not a Medium follow CTA. The Substack list is the owned channel."
  },
  {
    step: 12,
    task: "Analytics setup",
    detail:
      "Medium partner dashboard integrated into the tracking sheet (views, reads, fans, earnings per post). Weekly update."
  },
  {
    step: 13,
    task: "90-day review",
    detail:
      "At day 90, publish a Medium-specific retrospective on what worked, with a CTA back to the Substack. Use Medium's built-in 'Author's note' feature for context."
  }
];

const EDITORIAL_CALENDAR_NOTES = `Each of the 24 posts below is fully drafted in the companion posts file (copy-paste ready).
The cadence is two posts per week for 12 weeks = 24 essays = one full quarter.
Week 13 carries the 90-day review as the final post of the arc.
Every post includes Substack tags, Medium tags (five), and the LinkedIn and X amplification templates below.`;

const LINKEDIN_TEMPLATE = `[Hook — the sharpest claim from the essay, 1 sentence]

[2–3 short paragraphs, one idea each, distilling the argument. Use single-line paragraphs for whitespace.]

[Optional: one concrete example or numeric anchor.]

Full essay on SZL Command (free to subscribe) → [link]

#[primary tag] #[secondary tag] #[narrow tag]`;

const X_TEMPLATE = `Post 1 (hook): [1-sentence sharpest claim]
Post 2: [the problem, 1 sentence]
Post 3: [the insight, 1 sentence]
Post 4: [first supporting point]
Post 5: [second supporting point]
Post 6: [third supporting point / specific example]
Post 7: [meta-lesson / "why this matters"]
Post 8 (last, contains link): [recap + link to SZL Command essay]

Rules:
- One idea per post.
- No paragraph breaks inside a post.
- Link only in the last post.
- Images on post 1 only.`;

module.exports = {
  POSITIONING,
  VISUAL_IDENTITY,
  PILLARS,
  WELCOME_EMAIL,
  GROWTH_PLAN,
  MONETIZATION,
  KPIS,
  SUBSTACK_CHECKLIST,
  MEDIUM_CHECKLIST,
  EDITORIAL_CALENDAR_NOTES,
  LINKEDIN_TEMPLATE,
  X_TEMPLATE
};
