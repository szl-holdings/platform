# A11OY — Next Week Execution Plan
**Week of April 28 – May 2, 2026**

---

## Monday — Foundation

### Morning
- [ ] Run substrate engine: `python3 reports/a11oy-substrate/cli.py --all`
- [ ] Verify all 7 artifact JSON files + manifest generated
- [ ] Confirm file permissions (0600) and path redaction in manifest
- [ ] Export strategy bundle: `python3 reports/a11oy-substrate/website/export_strategy_bundle.py`

### Afternoon
- [ ] Review landing page copy (`landing_page_copy.md`) — finalize hero section
- [ ] Draft founder LinkedIn post using Vessels 41% proof point
- [ ] Schedule case study interview with Vessels customer (if approved)

---

## Tuesday — Competitive Positioning

### Morning
- [ ] Review competitive PDF outline (`competitive_pdf_outline.md`)
- [ ] Fill in pricing section with final numbers
- [ ] Add real competitor screenshots to appendix

### Afternoon
- [ ] Build positioning matrix visualization (2x2 chart)
- [ ] Draft 1-page competitive summary for board deck
- [ ] Send competitive brief to advisory board for review

---

## Wednesday — Technical Validation

### Morning
- [ ] Run full test suite: `pnpm --filter @workspace/api-server test`
- [ ] Validate brand strings: `pnpm brand:strings`
- [ ] Run nexus-smoke tests: 22/22 must pass

### Afternoon
- [ ] Review A11oy substrate output with engineering team
- [ ] Verify signal-to-recommendation pipeline for each vertical
- [ ] Document any data gaps in vertical signal sources

---

## Thursday — Content & GTM

### Morning
- [ ] Finalize A11oy web blueprint (`a11oy_web_blueprint.json`)
- [ ] Map blueprint pages to existing A11oy artifact components
- [ ] Identify missing UI components for platform page

### Afternoon
- [ ] Write 3 LinkedIn posts (schedule for next 2 weeks):
  1. Philosophy post — "Governed Autonomy" concept
  2. Vertical showcase — Pulse/Founder Operating Channel
  3. Proof point — Vessels customer metric
- [ ] Draft email sequence for advisor referral outreach

---

## Friday — Review & Ship

### Morning
- [ ] Full A11oy artifact review — screenshot all pages
- [ ] Verify all vertical detail pages render correctly
- [ ] Check mobile responsiveness on A11oy pages

### Afternoon
- [ ] Compile weekly progress report
- [ ] Update replit.md with any architecture changes
- [ ] Prep Monday briefing for the following week
- [ ] Tag release if all checks pass

---

## Success Criteria for the Week

| Metric | Target |
|--------|--------|
| Substrate artifacts generated | 7/7 |
| Test suite passing | 2155+ tests |
| Brand strings clean | 0 violations |
| Nexus smoke tests | 22/22 |
| LinkedIn posts drafted | 3 |
| Competitive brief reviewed | 1 advisor |
| Case study interview scheduled | 1 customer |

---

## Blockers to Watch

- **Vessels case study**: Needs customer approval before publishing any metrics
- **Pricing finalization**: Requires CFO sign-off on enterprise bundle discount
- **Board deck deadline**: Competitive summary needed by May 5
- **A11oy UI gaps**: Platform page components may need design subagent work

---

## Dependencies

| Task | Depends On | Owner |
|------|-----------|-------|
| Case study draft | Customer approval | growth@szl |
| Pricing section | CFO review | cfo@szl |
| Board competitive brief | Advisory feedback | founder@szl |
| Platform page UI | Blueprint finalization | eng@szl |
