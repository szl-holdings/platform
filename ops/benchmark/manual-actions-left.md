# Manual Actions Left — Complete Catalog

**Date:** April 16, 2026
**Purpose:** Comprehensive catalog of every action that cannot be automated and requires founder or engineering execution. This is the definitive pre-launch checklist.

---

## Priority Legend

| Priority | Meaning |
|---------|---------|
| **P0** | Must complete before first investor meeting |
| **P1** | Must complete before term sheet / design partner signing |
| **P2** | Complete during fundraise or at revenue milestone |

---

## Category A: Security — Secrets and Credentials

These are the highest-risk items. A demo environment running with default or shared secrets is a security liability.

| Action | Details | Priority | Est. Time |
|--------|---------|---------|-----------|
| Generate unique `FIELD_ENCRYPTION_KEY` for production | Must not share dev key with any deployed environment | P0 | 30 min |
| Generate unique `SESSION_SECRET` for production | Minimum 64 characters, random, never committed | P0 | 30 min |
| Rotate `ALLOY_INTERNAL_TOKEN` | Used for internal service-to-service auth | P0 | 30 min |
| Verify no dev fallback secrets are active in deployed environment | Audit all `process.env.*` defaults in code | P0 | 1 hour |
| Configure `CORS_ORIGINS` for production domain | Currently allows all origins in dev mode | P1 | 30 min |

---

## Category B: External API Credentials (Built, Not Activated)

The following services are fully integrated in code and will activate immediately when credentials are provided.

| Action | Service | Priority | Est. Time | Estimated Cost |
|--------|---------|---------|-----------|----------------|
| Configure `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs | Stripe billing | P1 | 1 day | Free (% of revenue) |
| Configure `MAPBOX_ACCESS_TOKEN` | Property maps (Terra), vessel maps (Vessels) | P1 | 30 min | Free tier available |
| Configure Resend or SendGrid API key | Email dispatch for notifications and invitations | P1 | 30 min | Free tier available |
| Set up `FIREBASE_SERVICE_ACCOUNT_JSON` | Push notifications for CORTEX mobile | P1 | 2 hours | Free tier available |
| Configure OTLP exporter endpoint and API key (Honeycomb, Datadog, or Jaeger) | External observability / immutable audit log | P2 | 2 hours | $20–200/month |
| Subscribe to AIS data provider and configure `AIS_API_KEY` | Live vessel positions (Vessels) — MarineTraffic, AISHub, or Spire | P2 | 1 day setup | $15–40K/year |
| Configure SIEM connector credentials (Aegis) | Live threat data feed | P2 | Variable | Varies by provider |

---

## Category C: Apple Developer / Google Play — Mobile Release

These are fully sequential blocking steps for CORTEX mobile distribution. None can be automated.

| Action | Where | Priority | Est. Time |
|--------|-------|---------|-----------|
| Create Apple Developer account ($99/year) | developer.apple.com | P0 | 30 min |
| Create App Store Connect record for CORTEX | App Store Connect | P0 | 1 hour |
| Create Google Play Console account ($25 one-time) | play.google.com/console | P0 | 30 min |
| Create Play Console app record for CORTEX | Google Play Console | P0 | 1 hour |
| Create Firebase project and download service account JSON | console.firebase.google.com | P0 | 1 hour |
| Link EAS project to Expo account (`eas init` or EAS dashboard) | expo.dev | P1 | 30 min |
| Run `eas build --platform ios --profile development` on physical device | Local machine with Xcode | P1 | 2 hours |
| Run `eas build --platform android --profile development` | Local machine | P1 | 1 hour |
| Create store screenshots for iOS (6.7", 5.5", iPad 12.9") | Physical device or simulator | P1 | 3 hours |
| Create store screenshots for Android (phone + tablet) | Physical device or emulator | P1 | 2 hours |
| Write Privacy Manifest (`PrivacyInfo.xcprivacy`) for iOS 17 compliance | Xcode | P1 | 1 hour |
| Create app icons at required sizes (iOS, Android) | Design tool | P1 | 2 hours |
| Create splash screen assets | Design tool | P1 | 1 hour |
| Submit to TestFlight Alpha and invite test users | App Store Connect | P1 | 1 hour |
| Submit to Play Internal Testing track | Google Play Console | P1 | 1 hour |

---

## Category D: Domain Configuration

| Action | Details | Priority | Est. Time |
|--------|---------|---------|-----------|
| Configure DNS for szlholdings.com | Point to Replit deployment | P1 | 2 hours |
| Configure TLS certificate | Automatic with Replit custom domain setup | P1 | Included |
| Configure subdomain routing (app.szlholdings.com, api.szlholdings.com) | Per-app domain config | P1 | 2 hours |
| Verify CORS configuration for production domain | Confirm `CORS_ORIGINS` is set correctly before external access | P1 | 30 min |

---

## Category E: Legal and Compliance

None of these can be automated. All require founder action and, in most cases, counsel.

| Action | Owner | Priority | Est. Time | Est. Cost |
|--------|-------|---------|-----------|-----------|
| Draft privacy policy for /legal/privacy | Legal counsel | P1 | 4 hours | $500–2K |
| Draft terms of service for /legal/terms | Legal counsel | P1 | 4 hours | $500–2K |
| GDPR Data Protection Impact Assessment (DPIA) | Legal counsel | P2 | 8 hours | $1–3K |
| Review open-source license for governance primitive publication | Legal counsel | P1 | 2 hours | $500 |
| Begin SOC 2 Type I audit readiness preparation | Compliance advisor | P2 | Ongoing | $15–30K |
| FedRAMP readiness assessment (Aegis-specific) | Compliance advisor | P2 | Post-revenue | $50–150K |

---

## Category F: Fundraising Preparation

| Action | Owner | Priority | Est. Time |
|--------|-------|---------|-----------|
| Prepare 9-slide Series A pitch deck | Founder | P0 | 8 hours |
| Draft financial model and 3-year projections | Founder + advisor | P0 | 8 hours |
| Prepare NDA-gated diligence packet | Founder | P0 | 4 hours |
| Identify 20 target Series A investors | Founder | P0 | 4 hours |
| Draft investor update email template | Founder | P1 | 2 hours |
| Identify and engage Series A lead counsel | Founder | P1 | 4 hours |
| Identify technical advisor to vouch for architecture | Founder | P1 | Ongoing |
| Schedule 3 practice pitches before investor conversations | Founder | P1 | 2 hours scheduling |
| Schedule first 5 investor meetings | Founder | P0 | 4 hours |

---

## Category G: Repository and CI

| Action | Details | Priority | Est. Time |
|--------|---------|---------|-----------|
| Publish GitHub Release v0.2.0 | Tag main; write substantive release notes covering Decision Theater, platform primitives, new security modules, vessels commercial modules, Command unification | P0 | 2 hours |
| Set up GitHub branch protection rules | Require CI pass + review before merge to main | P1 | 30 min |
| Deregister archived artifacts from Replit preview (firestorm, lyte-command-center, prism-counsel) | Cleanup step — artifacts are archived but still listed | P1 | 1 hour |
| Verify CI is green on main branch | Run typecheck + lint + build; confirm passing | P0 | 30 min |
| Wire integration tests into CI pipeline | Currently runs manually; needs GitHub Actions step | P1 | 2 hours |

---

## Category H: Infrastructure (At Revenue Milestone)

These are explicitly deferred — they are not pre-investor actions, but they are documented here for completeness.

| Action | When | Est. Time | Est. Cost |
|--------|------|-----------|-----------|
| Provision Azure subscription and resource group | First enterprise customer commit | 1 day | Varies |
| Provision Azure infrastructure from Bicep templates (`infra/`) | Same as above | 1–2 days | ~$500–2K/month |
| Provision Azure Cache for Redis (session store) | Revenue phase | 1 day engineering | Included in Azure |
| Commission third-party penetration test | Post-first-customer | 2–4 weeks | $15–30K |
| Test backup restoration (currently untested) | Before first enterprise customer | 2 hours | — |
| Set up Azure Application Insights as APM | Azure migration | 1 day | Included in Azure |

---

## Summary Priority Table

| Category | P0 Count | P1 Count | P2 Count |
|---------|---------|---------|---------|
| Security / Secrets | 4 | 1 | 0 |
| External API credentials | 0 | 4 | 3 |
| Mobile release (Apple/Google) | 4 | 11 | 0 |
| Domain configuration | 0 | 4 | 0 |
| Legal and compliance | 0 | 2 | 4 |
| Fundraising | 5 | 4 | 0 |
| Repo and CI | 2 | 4 | 0 |
| Infrastructure (deferred) | 0 | 0 | 6 |
| **Total** | **15** | **30** | **13** |

**P0 total time estimate: ~20 hours across 2–3 weeks (founder + engineering)**
**P1 total time estimate: ~40 hours across 4–6 weeks**
