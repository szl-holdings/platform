# SZL Holdings — Demo Day Guide

*For: Founder, demo leads, and investor relations*  
*Last updated: April 2026*

This guide covers everything you need to run a flawless SZL Holdings demo: environment setup, platform preparation, persona switching, and presentation tips for each audience type.

---

## 1. Pre-Demo Setup Checklist

Complete this checklist 30–60 minutes before any demo session.

### Environment

- [ ] Run the demo reset script: `./scripts/demo-reset/reset.sh`
- [ ] Verify API health: `curl /api/health` returns `{"status":"healthy"}`
- [ ] Confirm all workflows are running (SZL Holdings, Vessels, Aegis, Lyte, PRISM Counsel)
- [ ] Open browser windows for each platform — do not use a cold start during the demo
- [ ] Set browser zoom to 90% for 1920×1080 presentations (avoids scroll-heavy views)
- [ ] Close all unrelated tabs; hide browser bookmarks bar
- [ ] Silence notifications on all devices

### Data State Verification

- [ ] Verify demo data banners are visible in each platform (data state badges should show "Demo Mode")
- [ ] Confirm at least one pending approval is in the Command Inbox (Lyte)
- [ ] Confirm MV Soltana is visible in the Vessels fleet dashboard with an active alert
- [ ] Confirm Rivera matter is in the PRISM Counsel dashboard with a clock violation badge
- [ ] Confirm the credential stuffing incident is in the Aegis SOC queue
- [ ] Confirm 1847 Flatbush Ave (compounded distress: lis pendens + tax lien) is at the top of the Terra distress queue

### Devices

- [ ] Laptop screen tested at presentation resolution
- [ ] External display connected and mirroring confirmed (if using projector)
- [ ] CORTEX mobile app loaded and signed in (if showing the mobile demo)
- [ ] Backup device ready (tablet or second laptop) in case of technical issues

---

## 2. Persona Switching

Each narrative uses a different persona. Switch roles to show how the same platform looks and behaves differently for different users.

### How to Switch Personas

In the demo environment, personas are configured via the demo toolbar at the bottom of each platform screen (visible in demo mode only). Alternatively, use the account switcher in the top-right navigation.

| Persona | Role Tag | Use When |
|---------|----------|----------|
| Marcus Holt (CFO) | `executive` | Lyte / Business Observability demo |
| Diana Reyes (CISO) | `executive` | Aegis Security — CISO view |
| Priya Nair (SOC Analyst) | `analyst` | Aegis Security — analyst execution view |
| Captain James Wren | `operator` | Vessels maritime demo |
| Robert Tanner (CCO) | `auditor` | Vessels — read-only compliance view |
| Sophia Marchetti | `operator` | PRISM Counsel legal demo |
| Marcus Holt (Apex Capital) | `operator` | Terra real-estate distress demo |

### Role-Based View Differences

| View Element | Executive | Operator | Analyst | Auditor |
|-------------|-----------|----------|---------|---------|
| Approval Gate | Visible (can approve) | Visible (can approve) | Not visible | Not visible |
| Raw Signal Feed | Hidden | Visible | Visible | Hidden |
| Financial Data | Full | Full | Hidden | Summary only |
| Audit Trail | Full | Full | Own actions only | Full |
| Export Controls | Full | Full | Limited | Full |
| Execution Controls | Hidden | Visible | Visible | Hidden |

---

## 3. Demo Flow — Recommended Run Order

### Full Platform Demo (60–75 minutes)

Best for: Series A investors, strategic partners, enterprise executive evaluators

| Time | Section | Platform | Persona |
|------|---------|----------|---------|
| 0–5 min | Opening thesis — the governed intelligence loop | SZL Holdings homepage | — |
| 5–17 min | Narrative 1: Business Observability | Lyte | Marcus Holt (CFO) |
| 17–29 min | Narrative 3: Maritime / Sanctions | Vessels | James Wren → Robert Tanner |
| 29–41 min | Narrative 2: Security / SOC | Aegis | Priya Nair → Diana Reyes |
| 41–53 min | Narrative 4: Legal / PRISM Counsel | PRISM Counsel | Sophia Marchetti |
| 53–65 min | Narrative 5: Real Estate / Distress Diligence | Terra | Marcus Holt (Apex Capital) |
| 65–70 min | Platform compounding thesis | SZL Holdings architecture view | — |
| 70–75 min | Mobile (optional) + Q&A | CORTEX | — |

For self-serve prospect exploration, send a direct deep link with `?demo=true` to any of the five product apps. Each app auto-enables Demo Mode and surfaces a guided walkthrough sidebar (steps mirror the talking script below).

### Condensed Demo (20–25 minutes)

Best for: Time-constrained meetings, second-round check-ins, conference booths

| Time | Section | Platform |
|------|---------|----------|
| 0–3 min | Opening thesis | SZL Holdings |
| 3–11 min | Lyte: Command Inbox + Proof Chain | Lyte |
| 11–19 min | Vessels: AIS anomaly + OFAC + Audit View | Vessels |
| 19–23 min | Platform compounding thesis | SZL Holdings |
| 23–25 min | Q&A | — |

### Domain-Specific Demo (15 minutes)

Best for: Domain-expert prospects (CISO, fleet ops, law firm partner)

Show only the relevant narrative. Use the full 12-minute script with role switching. Allow 3 minutes for questions.

---

## 4. Audience-Specific Tips

### For Financial Investors (PE / VC)

**Lead with:** Business Observability (Lyte) and the portfolio-level view.  
**Emphasize:** Compounding architecture economics — one infrastructure investment, N vertical products.  
**Avoid:** Deep technical implementation details unless asked.  
**Best question to ask:** "Where does operational decision-making break down most painfully in your portfolio companies?"

### For Enterprise Executive Evaluators (CXO)

**Lead with:** The narrative most relevant to their domain — ask before starting.  
**Emphasize:** The governed approval model — AI recommends, humans confirm. This is the answer to every AI governance concern.  
**Avoid:** Showing features they don't care about. Keep to the narrative relevant to their role.  
**Best question to ask:** "How do your teams currently get from an operational signal to a decision that leaves an accountability record?"

### For Technical Evaluators (CTO, Platform Architects)

**Lead with:** The shared architecture — monorepo, shared event model, Alloy workflow engine.  
**Emphasize:** TypeScript end-to-end, OpenAPI codegen, Drizzle ORM, RBAC with organization scoping.  
**Allow:** Deeper dives into any layer — have the codebase ready to show.  
**Best question to ask:** "What's your current approach to workflow orchestration and audit trail?"

### For Legal/Compliance Professionals

**Lead with:** PRISM Counsel. Show the proof chain first — it earns the room.  
**Emphasize:** Privilege-aware architecture, attorney work product protection, NY DFS Reg 68 clock tracking.  
**Avoid:** Technical implementation. Stay in the matter management and legal workflow layer.  
**Best question to ask:** "How are you currently tracking insurer response deadlines across your active matters?"

---

## 5. Handling Common Demo Scenarios

### "Is the data live?"

> "Most of the intelligence layer is live — CISA KEV, NVD, NYC Open Data, the OFAC screening model, the audit trail, the workflow engine. Fleet vessel positions are currently simulated in this environment; live AIS integration is available at enterprise tier. All data in this demo is clearly labeled with data state badges — you can see the status of every data source on screen."

### "What if something breaks during the demo?"

- Have the demo reset script ready to run (`./scripts/demo-reset/reset.sh`)
- Keep a static screenshot deck as a fallback for each key screen
- Acknowledge gracefully: "Let me reset that — the seed script restores everything in under a minute." Don't apologize excessively.
- Every platform has a working static view even without live API data

### "Can we see our own data?"

> "What we'd do next is set up a controlled pilot environment with your data. That involves connecting your relevant data sources to the signal layer, provisioning your team's workspace, and configuring the first policy set. The platform is designed for a 30-day activation — not a 6-month integration project."

### "How does pricing work?"

> "We're pre-revenue and not leading with pricing in this conversation. The business model is SaaS subscription per domain pack, per workspace. Enterprise tier includes live data feeds, SSO, SCIM, and custom SLA. I'd rather understand your operational context first before we talk about commercial structure."

---

## 6. Post-Demo Actions

Complete these within 24 hours of every demo.

- [ ] Log the demo in the prospects tracker (company, attendees, narrative shown, key questions asked)
- [ ] Note which sections generated the most engagement
- [ ] Document any questions you couldn't fully answer — add answers to `docs/demo/demo-scenarios.md`
- [ ] If a follow-up was promised (deep-dive, technical call, data room access), schedule it before the day ends
- [ ] Reset the demo environment for the next session: `./scripts/demo-reset/reset.sh`

---

## 7. Quick Reference: Narrative Scenarios

| Narrative | Scenario | Key Metric |
|-----------|---------|-----------|
| Business / Lyte | $4.2M pipeline stall, 47 days — resolved in 26 hours | Close probability 31% → 74% |
| Security / Aegis | Credential stuffing, CVSS 9.1, 2,400 attempts — contained in 23 min | 0 accounts compromised |
| Maritime / Vessels | AIS dark 134 min, OFAC corridor — cleared in 4.5 hours | Demurrage $112K recoverable |
| Legal / PRISM Counsel | Reg 68 clock violation — insurer responded in 5 days | Settlement conference: $395K offer |
| Real Estate / Terra | Brooklyn multifamily, lis pendens + tax lien — LOI in 9 days | $2.05M acquisition vs. $3.45M ARV |

---

## 8. Technical Fallback Options

If the live platform has an issue:

| Issue | Fallback |
|-------|---------|
| API health check fails | Run `./scripts/demo-reset/reset.sh --check` — diagnose then restart API |
| Demo data missing | Run `./scripts/demo-reset/reset.sh` — full restore in 2–4 min |
| Specific narrative data missing | Run `./scripts/demo-reset/reset.sh --narrative [name]` — 45–90 sec |
| Platform not loading | Check workflow status; restart the relevant workflow |
| Database connection lost | Verify DATABASE_URL; restart API server |

---

*For narrative details and talking points, see `docs/demo/demo-scenarios.md`.*  
*For gap analysis and future work, see `docs/demo/gap-report.md`.*
