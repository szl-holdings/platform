# SZL Holdings — Content Model

## Entity Model

### CONTENT_IDEA → dos_articles (draft stage)
- id, title, slug, thesis/excerpt, body
- editorial_pillar_id → dos_editorial_pillars
- article_type: flagship-essay, founder-note, founder-memo, framework, case-study, industry-brief, playbook, market-signal, product-update, how-to, listicle, opinion
- status: draft → in-review → approved → published → archived
- campaign_id → dos_campaigns
- tags, audience, funnel_stage (via editorial pillars)

### CANONICAL_PIECE → dos_articles (published stage)
- Full long-form body with proof blocks
- CTA block reference → dos_cta_blocks
- Publication URLs → dos_publication_urls (canonical URL + cross-post URLs)
- Version history → dos_article_versions

### DERIVATIVE_ASSET → Generated from canonical
- X posts → dos_x_posts (threads, singles, launch posts)
- Newsletters → dos_newsletters (Substack/email variants)
- Carousel projects → dos_carousel_projects + dos_carousel_slides
- Distribution runs → dos_distribution_runs (track per-platform publish)

## Publishing State Machine

```
draft → in-review → approved → published → archived
                                    ↓
                              [distribution run]
                                    ↓
                    X post | Newsletter | Carousel | Medium | Substack
                                    ↓
                              dos_publication_urls
                           (permalink captured after publish)
```

## Distribution Targets (dos_distribution_targets)
- Owned site (canonical)
- X (@szlholdings)
- Medium (@stephen_38454)
- Substack (szlholdings.substack.com)
- LinkedIn (not yet connected)
- Linktree (linktr.ee/szlholdings — link stack updates)

## Campaign Model (dos_campaigns + dos_campaign_links)
- Campaign with UTM tracking
- Campaign links with utm_source, utm_medium, utm_campaign, utm_content
- Lead attribution via campaign tracking

## Lead Funnel (dos_leads + dos_lead_notes)
- Stages: new → qualified → warm → needs-followup → proposal-candidate → closed-won → closed-lost
- Sources: newsletter, linktree, contact-form, organic, referral, social
- Notes and follow-up tracking

## Analytics Model (dos_page_views + dos_analytics_events)
- Page views with path, referrer, user agent
- Custom analytics events with category, action, label, value
- Campaign attribution via UTM parameters
