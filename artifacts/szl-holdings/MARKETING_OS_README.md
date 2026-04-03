# SZL Marketing OS — README

## What Is It?

The SZL Marketing OS is the content engine and automation layer built into the SZL Holdings platform. It powers the Distribution OS — a private admin panel for planning, generating, and publishing content across LinkedIn, X (Twitter), Instagram, newsletters, and the SZL site.

The Marketing OS consists of three core modules:

| Module | Path | Purpose |
|---|---|---|
| Carousel Lab | `/admin/distribution/carousel-lab` | Generate aiCarousels-ready carousel content |
| Content Calendar | `/admin/distribution/calendar` | Plan and track content across channels |
| Automations | `/admin/distribution/automations` | Scheduled jobs and weekly executive reports |

---

## How to Run

The SZL Holdings web app runs as part of the monorepo. From the project root:

```bash
pnpm --filter @szl-holdings/web dev
```

Or use the Replit workflow: `artifacts/szl-holdings: web`

The API server must also be running:

```bash
pnpm --filter @szl-holdings/api-server dev
```

---

## How to Seed Data

Run the Marketing OS seed script to populate:
- 5 editorial pillars (3 marked as favorites)
- 10 sample carousel ideas across all templates
- 3 content calendar items

```bash
pnpm --filter @szl-holdings/api-server tsx src/scripts/seed-marketing-os.ts
```

---

## How to Configure Secrets

The Marketing OS uses the standard API server environment. Key variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Session signing secret |
| `VITE_API_URL` | API base URL for the frontend |

Set these in the Replit Secrets panel or your `.env` file. Never commit secrets.

---

## How to Deploy

1. Ensure `DATABASE_URL` is set in the production environment.
2. Run database migrations: `pnpm --filter @szl-holdings/db push`
3. Run the seed script once to populate pillars and carousel ideas.
4. Deploy via Replit's deployment panel or your preferred hosting.

The admin panel is protected by authentication. Only authenticated users can create, update, or trigger content.

---

## How to Use the aiCarousels Import Workflow

1. Go to `/admin/distribution/carousel-lab`
2. Click **New Carousel**
3. Choose a **template** (10 options available)
4. Enter your **topic** and select a **content pillar**
5. Click **Generate Carousel**
6. Review the **Slides** tab to verify the content
7. Go to the **aiCarousels Import** tab
8. Click **Copy Import Block**
9. Open [aiCarousels.com](https://aicarousels.com), create a new project
10. Select **Import → Text Import**
11. Paste the copied block and apply

The import format is:
```
[Intro] Tagline/Title/Paragraph
[Slide 2] Title/Paragraph
[Slide 3] Title/Paragraph
[Outro] Tagline/Title/Paragraph/Call to action
```

Fields within each slide are separated by forward slashes.

---

## How to Use Captions

After generating a carousel, the **Captions** tab provides:

- **LinkedIn Short Caption** — punchy, hook-first, fits first 3 lines
- **LinkedIn Long Caption** — full narrative arc with bullet points
- **X / Threads Adaptation** — numbered thread format
- **Instagram Caption** — dot-separated, hashtag block

Copy any caption directly to your clipboard with the **Copy** button.

---

## How to Create Campaign Links

1. Go to `/admin/distribution/campaigns`
2. Create or select a campaign
3. Click **Add Link**
4. Enter UTM parameters (source, medium, campaign, content)
5. The system generates a full UTM-tagged URL

Use campaign links in carousel CTAs, newsletter CTAs, and Linktree links to track attribution.

---

## How to Run the Weekly Report

1. Go to `/admin/distribution/automations`
2. Find **Weekly Executive Report**
3. Click **Run Now**

The report generates in real time and appears inline. It includes:
- Total visits and leads
- Best campaign and top lead source
- Content generated this week
- Follow-up queue count
- 5 strategic recommendations

Click **Export** to download a plain-text version for sharing.

You can also schedule this job to run automatically every Friday at 4:00 PM by sending a POST request to `/api/distribution-os/automation-runs/trigger/weekly-report`. Similarly, `carousel-ideas`, `thought-leadership`, and `daily-summary` can be triggered at `/api/distribution-os/automation-runs/trigger/:jobType`.

---

## How to Connect Linktree

1. Go to `/admin/distribution/settings`
2. Configure the **Linktree** section with your Linktree URL
3. Go to `/admin/distribution/automations` to review Linktree link recommendations
4. Manually update your Linktree links to match the recommended priority order

Direct Linktree API control is not supported — use the configuration panel and sync manually.

---

## How to Add New Offer Pages

1. Create the page in `/src/pages/` following the existing pattern
2. Register the route in `App.tsx`
3. Add the page URL to relevant campaign links and CTA blocks
4. Update the Linktree configuration to include the new offer page
5. Add it to the `ctaUrl` field on relevant carousel projects

---

## Carousel Templates

| Template | Best For |
|---|---|
| Educational Explainer | Breaking down complex concepts |
| Contrarian POV | Challenging conventional wisdom |
| Operator Checklist | Actionable decision support |
| Before / After Transformation | Client story, product impact |
| Founder Story | Personal narrative, trust building |
| Mistakes to Avoid | Pain-point content |
| Buyer Guide | Pre-sale decision support |
| Enterprise Readiness Checklist | Enterprise lead generation |
| Trend Reaction | Timely authority content |
| Myth vs. Reality | Debunking industry misconceptions |

---

## Automation Jobs

| Job | Schedule | Output |
|---|---|---|
| Carousel Idea Generator | Weekdays, 8:00 AM | 3 carousel calendar items |
| Weekly Thought-Leadership Pack | Mondays, 8:30 AM | 4 content items |
| Daily Marketing Summary | Daily, 6:00 PM | Summary report |
| Weekly Executive Report | Fridays, 4:00 PM | Exportable executive report |

All runs are logged to the `dos_automation_runs` table with status, output, and timestamps. Use the **Run Now** button for manual reruns.

---

## What to Customize First

1. **Pillars** — Update the editorial pillars to reflect your current content strategy (Settings → Pillars).
2. **Author profile** — Add your name, bio, LinkedIn, and photo in Settings → Authors.
3. **Site settings** — Set company name, site URL, Substack URL, LinkedIn URL in Settings → Site.
4. **CTA blocks** — Create your primary CTA blocks (subscribe, contact, offer) in Settings → CTAs.
5. **Carousel hooks** — After generating your first carousel, edit the hook to match your voice.

---

## Architecture Notes

- All content is stored in PostgreSQL via Drizzle ORM.
- The schema is in `lib/db/src/schema/distribution-os.ts`.
- The API routes are in `artifacts/api-server/src/routes/distribution-os.ts`.
- The admin UI is in `artifacts/szl-holdings/src/pages/distribution-os/`.
- The `aiCarouselsImportBlock` field on `dos_carousel_projects` stores the generated import text.
- The `dos_automation_runs` table records all job executions.
