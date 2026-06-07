# Funnel Definitions — SZL Holdings

## Visitor → Lead Funnel
1. `nav.page.viewed` (any public page: /, /insights, /solutions/*)
2. `content.cta.clicked` (any CTA: newsletter, demo, contact)
3. `content.lead.captured` (form submitted with email)

**Conversion target**: Lead capture rate (leads / unique visitors)

## Lead → Qualified Lead Funnel
1. `content.lead.captured`
2. `nav.page.viewed` (/insights/:slug — multiple visits)
3. `export.document.downloaded` (PDF, carousel)
4. `content.cta.clicked` (demo request CTA)

**Conversion target**: Lead qualification rate

## Demo Request Funnel
1. `nav.page.viewed` (/demo or /contact)
2. `support.demo.requested` (demo form submitted)
3. `support.demo.completed` (demo call completed)

**Conversion target**: Demo request → completed demo rate

## User Activation Funnel
1. `auth.session.started` (first login)
2. `nav.page.viewed` (dashboard)
3. `entity.detail.opened` (first entity interaction)
4. `workflow.triggered` or `entity.updated` (first meaningful action)

**Conversion target**: Time to first meaningful action

## Retention Funnel (Weekly)
1. `auth.session.started` (Week 1)
2. `auth.session.started` (Week 2)
3. `auth.session.started` (Week 4)
4. `workflow.triggered` (Week 4+)

**Conversion target**: Week-4 retention rate

## Content Engagement Funnel
1. `content.article.viewed` (article page)
2. `nav.page.viewed` (second article)
3. `content.cta.clicked` (newsletter or demo CTA)
4. `content.lead.captured`

**Conversion target**: Content → lead conversion rate
