# Funnel Map

Generated: 2026-04-16 (updated)

## Primary Conversion Funnel

```
Organic/Referral Traffic
  └─> Landing Page (/, /platform, /lyte)
       └─> Product Understanding (/architecture, /how-it-works, /docs)
            └─> Trust Validation (/trust, /trust/security, /trust/ai, /trust/governance)
                 └─> Demo Request (/demo)                           [understand → trust → request demo]
                      └─> Design Partner Path (/design-partner)    [design partner journey]
                           └─> Diligence (/contact, /investor)     [request diligence]
                                └─> Registration (/auth/register)
                                     └─> First Login
                                          └─> Active User
```

## Buyer Journey Steps

| Step | Description | Page | CTA | Event |
|------|-------------|------|-----|-------|
| 1. Understand | Grasp governed execution value prop | `/` hero | "Explore the platform" | `hero_cta_click` (explore-platform) |
| 2. Trust | Validate security, governance, AI model | `/trust` | Trust Center / AI governance | `trust_center_viewed` |
| 3. Request Demo | High-intent signal | `/demo` | "Request a demo" | `demo_request` + `hero_cta_click` (request-demo) |
| 4. Request Diligence | Enterprise security / legal review | `/contact` | "Enterprise diligence" | `diligence_requested` |
| 5. Design Partner | Co-design path for target operators | `/design-partner` | "Become a design partner" | `design_partner_interest` |

## Key Conversion Events (Instrumented)

| Event | Trigger | Source |
|-------|---------|--------|
| `hero_cta_click` | Any hero CTA click | landing.tsx hero section, bottom CTA section |
| `demo_request` | Demo CTA click | hero, bottom-cta |
| `trust_center_viewed` | Trust link clicks + /trust page mount | trust-strip, trust-section, trust-ai-governance, page-mount |
| `design_partner_interest` | Design partner CTA | hero, bottom-cta, design-partner section |
| `diligence_requested` | Enterprise diligence link | bottom-cta |
| `domain_pack_viewed` | Domain pack card click | domain packs section |
| `audience_path_click` | Audience path card | audience paths section |
| `newsletter_signup` | Newsletter form submit | homepage-newsletter |
| `nav_link_click` | Any nav link | SiteNav (already instrumented) |

## Secondary Funnels

### Trust/Compliance Funnel
```
/trust → /trust/security → /trust/governance → /trust/ai → Contact
```

### Developer/Technical Funnel
```
/docs → /architecture → /docs/proof-chain → /docs/control-plane → Demo Request
```

### Domain Pack Funnels
```
Domain packs section card click → /solutions/<pack> → Demo Request
```

### Investor Funnel
```
/investor → /investor/data-room → /investor/architecture → Contact
```

## Navigation Trust Discoverability

Trust Center is surfaced in:
- Main nav "Trust" dropdown (Trust Center, Security, AI Governance, Proof Chain, Compliance Architecture)
- Hero trust strip ("Full Trust Center" link with `trust_center_viewed` tracking)
- Platform section 8 "Trust & Governance" with "Trust Center" and "AI governance model" CTAs
- Mobile nav under "Trust & Company" section
