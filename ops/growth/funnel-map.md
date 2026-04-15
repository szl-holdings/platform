# Funnel Map

Generated: 2026-04-15

## Primary Conversion Funnel

```
Organic/Referral Traffic
  └─> Landing Page (/, /platform, /lyte)
       └─> Product Exploration (/architecture, /trust, /docs)
            └─> Social Proof (/case-studies, /company)
                 └─> Demo Request (/demo)
                      └─> Contact/Schedule (/contact)
                           └─> Registration (/auth/register)
                                └─> First Login
                                     └─> Active User
```

## Key Conversion Points

| Stage | Page | CTA | Tracking Event |
|-------|------|-----|---------------|
| Awareness | Homepage | "Request a demo" | `demo_cta_clicked` |
| Interest | Platform | "Explore the platform" | `platform_explored` |
| Consideration | Trust Center | "View security details" | `trust_center_viewed` |
| Intent | Demo | "Schedule demo" | `demo_request_submitted` |
| Decision | Packages | "Get started" | `plan_selected` |
| Action | Contact | "Submit" | `contact_form_submitted` |

## Secondary Funnels

### Fund Intelligence Funnel
```
/fund → /fund/deal-scoring → /fund/portfolio-intelligence → Demo Request
```

### Trust/Compliance Funnel
```
/trust → /trust/security → /trust/governance → Contact
```

### Developer Funnel
```
/docs → /docs/architecture → /developers → API Key Request
```

## Funnel Optimization Notes

1. **Homepage CTA**: Currently has "Request a demo", "Explore the platform", and "Platform Pulse" — clear hierarchy
2. **Navigation flow**: Company > Leadership provides founder credibility before demo request
3. **Trust signals**: Trust center and security pages build confidence for enterprise buyers
4. **Missing**: No pricing page creates friction — add /packages or /pricing with clear tiers
