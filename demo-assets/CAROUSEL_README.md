# SZL Holdings — LinkedIn Investor Carousel

## Output files

| File | Description |
|------|-------------|
| `carousel-slides/slide-01-cover.jpg` through `slide-10-thesis.jpg` | 10 individual 1080×1080px JPG slides |
| `szl-holdings-investor-carousel.pdf` | Combined 10-page PDF ready for LinkedIn upload — **generated locally only; gitignored and not committed to the public repo (task #2703).** Distribute via a private channel (private repo, encrypted storage, or investor data room). |

## Regenerating

To regenerate slides after updating screenshots or copy:

```bash
node demo-assets/generate-carousel.mjs
```

**Requirements:** Playwright and a system Chromium binary (both present in this Replit environment).

If running outside Replit:
```bash
pnpm add -D playwright
npx playwright install chromium
node demo-assets/generate-carousel.mjs
```

## Design brief

See `demo-assets/linkedin-carousel.md` for the full content and design spec.

## Screenshots used

| Slide | Screenshot |
|-------|-----------|
| 3 — SZL Holdings Dashboard | `screenshots/szl-holdings-hero.jpg` |
| 4 — Lyte | `screenshots/lyte-hero.jpg` |
| 5 — Vessels | `screenshots/vessels-hero.jpg` |
| 6 — Terra | `screenshots/terra-hero.jpg` |
| 7 — Aegis | _(no screenshot — designed with cards + stats)_ |
| 8 — PRISM Counsel / IMPERIUM | `screenshots/prism-counsel-hero.jpg` |
| 9 — Carlota Jo / Stephen | `screenshots/carlota-jo-hero.jpg`, `screenshots/stephen-site-hero.jpg` |
