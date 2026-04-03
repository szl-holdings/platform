# Wiki Style Guide — SZL Holdings Platform

## Voice & Tone

**Direct.** State what the platform does. Do not qualify with "aims to" or "strives to".
**Technical without jargon.** Define terms on first use. Use the Glossary for platform-specific vocabulary.
**Executive-readable.** If a paragraph requires technical background to understand, add a summary sentence at the top.
**No marketing copy.** Claims must be demonstrable. Remove superlatives ("best-in-class", "cutting-edge") unless backed by a specific comparison.

## Formatting Standards

### Headers
- H1 (`#`) — Page title only. One per page.
- H2 (`##`) — Major sections. Every major section gets one.
- H3 (`###`) — Subsections within a major section.
- H4 (`####`) — Use sparingly. If you need H4, consider splitting the page.

### Tables
Use tables for: comparisons, feature matrices, status listings, doc maps.
- Always include a header row
- Keep columns to 3–4 max; additional detail belongs in prose
- Left-align text columns, keep numeric columns consistent

### Code Blocks
Use triple-backtick fenced blocks. Always specify language when relevant:
- ` ```bash ` for shell commands
- ` ```typescript ` for TypeScript
- ` ```text ` or plain ` ``` ` for ASCII diagrams

### Diagrams
ASCII diagrams are preferred for architecture flows — they render in all environments and do not require external hosting.

For visual diagrams, use images in `docs/media/diagrams/` and reference them using relative paths from the repo root.

### Links
- Internal wiki links: `[[Page-Name]]` or `[Display Text](Page-Name)` (GitHub Wiki syntax)
- In-repo doc links: Use the full path from repo root, e.g. `[Trust Center](../../docs/trust/trust-center.md)`
- External links: Include protocol, e.g. `[szlholdings.com](https://szlholdings.com)`

## Content Rules

### Do
- Open each page with a one-sentence summary of what the page covers
- Use numbered lists for sequences, bullet lists for unordered items
- Reference the in-repo source of truth when summarizing a doc (`See [trust-center.md](../../docs/trust/trust-center.md) for full detail`)
- Keep pages focused — one topic per page

### Do Not
- Do not duplicate content verbatim from README — link to it instead
- Do not include placeholder content ("TBD", "Coming soon") — either write the content or omit the section
- Do not include internal development commentary, jokes, or informal asides
- Do not include financial projections, revenue figures, or user counts
- Do not expose internal tooling paths, secrets, or environment configuration

## Length Guidelines

| Page Type | Target Length |
|-----------|--------------|
| Home | 400–600 words |
| Product overview | 300–500 words |
| Architecture | 500–800 words |
| Trust/Security | 400–700 words |
| Use cases | 400–700 words |
| FAQ | 300–600 words |
| Glossary | As needed — one definition per term |

## Update Cadence

- All pages reviewed at each major release
- Architecture and deployment pages reviewed at each infrastructure change
- FAQ updated when a question appears more than twice in buyer/investor conversations

## Public Mirror Notice

Every wiki page footer (via `_Footer.md`) includes the public mirror notice. Do not add additional mirror notices inline unless the page topic specifically relates to the mirror policy.
