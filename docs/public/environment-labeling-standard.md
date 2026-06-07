# SZL Holdings — Environment Labeling Standard

**Version**: 1.1
**Effective**: 2026-04-02
**Owner**: Stephen Lutar, Founder & CEO

---

## Purpose

This document defines the canonical environment labels used across all SZL Holdings products. Every screen, API response, report, and demo must clearly communicate what kind of data and environment the user is viewing. No ambiguity is acceptable.

---

## Environment Labels

| Label | Definition | Visual Indicator |
|-------|-----------|-----------------|
| **Live** | Connected to real data sources. Actions have real consequences. Production infrastructure. | Green indicator. No overlay. |
| **Pilot** | Real infrastructure with limited scope. Design-partner data. Actions may have real consequences within the pilot boundary. | Blue indicator. "PILOT" chip in header. |
| **Demo** | Curated demonstration environment. Data is seeded or simulated. No real-world consequences. | Amber indicator. "DEMO" chip in header. |
| **Seeded Data** | Real system running with pre-populated test data. Infrastructure is live but data is synthetic. | Amber indicator. "SEEDED DATA" chip in header. |

---

## Rules

1. Every UI surface must display an environment label when the environment is anything other than Live.
2. API responses must include an `X-Environment` header indicating the current environment type.
3. Demo environments must never imply live data. If a demo uses realistic data patterns, it must be labeled "Seeded Data" explicitly.
4. Screenshots and recordings used in sales, marketing, or investor materials must include the environment label as it appears in the product.
5. The "Live" label should only be used when:
   - Data comes from verified external sources (APIs, feeds, user input)
   - Actions result in real system state changes
   - The system is running on production infrastructure
6. Mixed environments (e.g., live infrastructure with some seeded data) should use the most conservative label. If any data is seeded, label as "Seeded Data".

---

## Implementation Requirements

### UI Components
- Environment label chip: persistent in the application header
- Never dismissible by the user
- Color-coded: Live (green), Pilot (blue), Demo/Seeded (amber)

### API Headers
```
X-Environment: live | pilot | demo | seeded
X-Data-Source: live-api | cached | fallback-api-unavailable | seeded
```

### Reports and Exports
- Every generated document must include the environment label in the footer
- PDF exports must watermark with "DEMO" or "SEEDED DATA" when applicable

### Demo Recordings
- Environment chip must be visible in all screenshots
- Video demos must show the environment label at least once per scene transition
- Presentation decks must note "Demo Environment" on relevant slides

---

## Enforcement

- Pre-deployment checklist must verify environment labels are correctly set
- CI/CD pipelines should validate that non-production deployments include environment indicators
- Quarterly audit of public-facing materials for environment label compliance
