# SZL Holdings — Approval Queue Rules

## Platforms Requiring Approval/Manual Sync

### Substack
**Reason:** No public API for direct publish
**Workflow:**
1. Write content in Distribution OS admin panel (dos_articles or dos_newsletters)
2. Set status to "approved"
3. Copy formatted content from admin UI
4. Paste into Substack editor at szlholdings.substack.com
5. Publish manually
6. Record published URL in dos_publication_urls
7. Update dos_distribution_runs status to "completed"

### Linktree
**Reason:** No API integration
**Workflow:**
1. Update link stack in Distribution OS admin (dos_linktree_config)
2. In-app /link-in-bio page auto-reflects changes
3. For linktr.ee/szlholdings: manually update to match in-app order
4. Log sync in dos_automation_runs

### X (Until API credentials obtained)
**Reason:** OAuth credentials not yet configured
**Workflow:**
1. Write posts in Distribution OS admin (dos_x_posts)
2. Set status to "approved"
3. Copy text from admin UI
4. Post manually to x.com/szlholdings
5. Record permalink in dos_publication_urls
6. Update dos_distribution_runs status to "completed"

### Medium (Until integration token obtained)
**Reason:** Integration token not yet configured
**Workflow:**
1. Write article in Distribution OS admin (dos_articles)
2. Set canonical URL field
3. Copy formatted content
4. Create post at medium.com/@stephen_38454
5. Set canonical URL to owned site article
6. Add tags
7. Record published URL in dos_publication_urls

### LinkedIn
**Reason:** Not connected
**Workflow:**
1. Write post in Distribution OS admin
2. Copy text/upload document
3. Post manually to LinkedIn
4. Record engagement metrics manually

## Approval Escalation

| Content Type | Approval Required | Approver |
|-------------|-------------------|----------|
| Articles (flagship-essay, framework) | Yes | Stephen |
| Founder notes | Self-approved | Stephen |
| X posts (singles) | Optional | Stephen |
| X threads | Yes | Stephen |
| Newsletters | Yes | Stephen |
| PDF/carousels | Yes | Stephen |
| Campaign launches | Yes | Stephen |
| Profile/bio updates | Yes | Stephen |

## Auto-Publish Eligible (When Connectors Built)
- X singles (pre-approved)
- Substack Notes (pre-approved)
- Linktree link updates
- In-app article publish (owned site)
