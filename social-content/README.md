# SZL Holdings — Social Media Content Pack

Everything you need for an 8-week social media showcase campaign and full platform profile setup across LinkedIn, X (Twitter), Instagram, YouTube, Medium, Substack, and Hackajob.

## Folder Structure

```
social-content/
  screenshots/              -- Hero screenshots of every SZL portfolio app
  banners/                  -- Weekly campaign banners + platform header images
  logos/                    -- Lyte logo assets (SVG + PNG)
  pdf-guides/               -- Generated PDF documents
    social-media-profile-kit.pdf  -- Complete profile kit for all platforms
    carousel-1-ecosystem-overview.pdf
    carousel-2-cybersecurity-stack.pdf
    carousel-3-ai-analytics.pdf
    carousel-4-maritime-intelligence.pdf
    carousel-5-creative-tech.pdf
    szl-marketing-playbook.pdf    -- 8-week campaign playbook
  content-calendar.md       -- 8 weeks of ready-to-post text for LinkedIn, X, and Hackajob
  hackajob-profile.md       -- Copy-paste text for every Hackajob profile section
  generate-profile-kit.js   -- Generator for the social media profile kit PDF
  generate-carousels.js     -- Generator for LinkedIn carousel PDFs
  generate-banners.js       -- Generator for platform header banner PDFs
  generate-playbook.js      -- Generator for the marketing playbook PDF
  README.md                 -- This file
```

## PDF Documents

### Social Media Profile Kit
`pdf-guides/social-media-profile-kit.pdf` — Complete copy-paste-ready profile content for all platforms:
- Quick reference card with all handles, URLs, and posting schedule
- X (@szlholdings) profile content (bio, description, pinned tweet)
- LinkedIn personal page (headline, about, featured section, experience entries)
- Instagram (@szlholdings) profile (bio, highlights, content strategy)
- YouTube (@SZLHoldings) channel (description, keywords, playlists)
- Medium (szlholdings) publication (bio, description, tags)
- Substack (szlholdings) publication (name, description, about page, welcome email)
- Inaugural first posts for every platform
- LinkedIn carousel guide
- Platform banner specifications and brand colours

### LinkedIn Carousels
Five branded carousel PDFs ready to upload directly to LinkedIn:

| File | Topic |
|------|-------|
| `carousel-1-ecosystem-overview.pdf` | The SZL Ecosystem — One Engineer, 15+ Platforms |
| `carousel-2-cybersecurity-stack.pdf` | Why One Security Tool Isn't Enough |
| `carousel-3-ai-analytics.pdf` | From Data Drowning to Predictive Intelligence |
| `carousel-4-maritime-intelligence.pdf` | Maritime Intelligence — Vessels Platform |
| `carousel-5-creative-tech.pdf` | Creative Tech as Competitive Advantage |

### Marketing Playbook
`pdf-guides/szl-marketing-playbook.pdf` — Detailed 8-week campaign execution guide with checklists, pro tips, and engagement strategies.

## Screenshots

Clean 1280x720 captures of every portfolio app's hero/landing section. Saved as JPG.

| File | App |
|------|-----|
| `szl-holdings-hero.jpg` | SZL Holdings — main portfolio site |
| `inca-dashboard.jpg` | INCA — AI research intelligence command center |
| `lyte-command-center.jpg` | Lyte — intelligent observability platform |
| `rosie-hero.jpg` | Rosie — AI-powered security monitoring |
| `aegis-hero.jpg` | Aegis — enterprise security fortress |
| `firestorm-hero.jpg` | Firestorm — incident response simulation |
| `nimbus-hero.jpg` | Nimbus — predictive AI intelligence |
| `beacon-hero.jpg` | Beacon — decision analytics hub |
| `carlota-jo-hero.jpg` | Carlota Jo — strategic consulting |
| `dreamera-hero.jpg` | DreamEra — neural storytelling platform |
| `dreamscape-hero.jpg` | Dreamscape — immersive creative workspace |
| `career-stephen-lutar.jpg` | Stephen Lutar — founder profile & career site |
| `apps-showcase-hero.jpg` | Apps Showcase — full platform catalog |
| `zeus-hero.jpg` | Zeus — modular core architecture |
| `alloyscape-hero.jpg` | AlloyScape — infrastructure operations |
| `lutar-hero.jpg` | Lutar — personal command center |

## Banners

### Weekly Campaign Banners
AI-generated banner images for each week of the campaign. Two sizes per week:

- **LinkedIn** (landscape, 1200x627 recommended): `week{N}-{theme}-linkedin.png`
- **X / Square** (1080x1080): `week{N}-{theme}-square.png`

| Week | Theme | LinkedIn | Square |
|------|-------|----------|--------|
| 1 | Genesis | `week1-genesis-linkedin.png` | `week1-genesis-square.png` |
| 2 | The Brain | `week2-brain-linkedin.png` | `week2-brain-square.png` |
| 3 | The Eyes | `week3-eyes-linkedin.png` | `week3-eyes-square.png` |
| 4 | The Shield | `week4-shield-linkedin.png` | `week4-shield-square.png` |
| 5 | Prediction Engine | `week5-prediction-linkedin.png` | `week5-prediction-square.png` |
| 6 | The Advisory Arm | `week6-advisory-linkedin.png` | `week6-advisory-square.png` |
| 7 | The Creative Side | `week7-creative-linkedin.png` | `week7-creative-square.png` |
| 8 | The Full Reveal | `week8-reveal-linkedin.png` | `week8-reveal-square.png` |

### Platform Profile Headers
Branded header/banner images sized for each platform's profile area:

| Platform | Size | File |
|----------|------|------|
| X (Twitter) | 1500x500 | `header-x-1500x500.png` |
| LinkedIn | 1584x396 | `header-linkedin-1584x396.png` |
| YouTube | 2560x1440 | `header-youtube-2560x1440.png` |
| Instagram | 1080x1080 | `header-instagram-1080x1080.png` |

## Logos

- `lyte-logo.svg` — Lyte logo in vector format (scalable)
- `lyte-logo.png` — Lyte logo as high-resolution PNG (960x400px)

## How to Use

### Setting Up All Profiles
1. Open `pdf-guides/social-media-profile-kit.pdf`
2. Go to the section for each platform
3. Copy-paste the bio, description, and other fields directly
4. Upload the matching header banner from `banners/`

### LinkedIn Posts
1. Open `content-calendar.md`
2. Find the current week's LinkedIn section
3. Copy the post text
4. Upload the matching LinkedIn banner from `banners/`
5. Add 1-2 screenshots from `screenshots/` as additional images
6. Post on Tuesday or Thursday between 8-9 AM GMT

### LinkedIn Carousels
1. Upload the carousel PDF directly to LinkedIn using "Create a post" > Document icon
2. Add a caption with relevant hashtags
3. Best posted on Tuesdays for maximum B2B engagement

### X / Twitter Posts
1. Open `content-calendar.md`
2. Find the current week's X section
3. Copy the short post text
4. Attach the matching square banner from `banners/`
5. Post on Monday, Wednesday, or Friday around 12 PM GMT

### Hackajob Profile
1. Open `hackajob-profile.md`
2. Copy each section into the corresponding profile field
3. Upload screenshots as project images
4. Update weekly as described in `content-calendar.md`

## Regenerating PDFs

To regenerate any of the PDF documents:

```bash
node social-content/generate-profile-kit.js   # Profile kit PDF
node social-content/generate-carousels.js      # 5 carousel PDFs
node social-content/generate-banners.js        # Banner PDFs (templates)
node social-content/generate-playbook.js       # Marketing playbook PDF
```

## Campaign Schedule

| Week | Theme | Platforms Featured |
|------|-------|--------------------|
| 1 | Genesis | SZL Holdings |
| 2 | The Brain | INCA |
| 3 | The Eyes | Lyte |
| 4 | The Shield | Rosie, Aegis, Firestorm |
| 5 | Prediction Engine | Nimbus, Beacon |
| 6 | The Advisory Arm | Carlota Jo |
| 7 | The Creative Side | DreamEra, Dreamscape |
| 8 | The Full Reveal | Stephen Lutar + full portfolio |
