# Wiki Sync Plan — SZL Holdings Platform

## Architecture

```
Replit Workspace (source of truth)
  └── docs/wiki/wiki-seed/*.md          ← Edited here
  └── docs/wiki/_Sidebar.md             ← Edited here
  └── docs/wiki/_Footer.md              ← Edited here
        │
        ▼
  scripts/wiki/prepare-wiki-pages.ts    ← Validates, transforms, tags
        │
        ▼
  scripts/wiki/export-docs-to-wiki.ts   ← Copies to local wiki clone dir
        │
        ▼
  scripts/wiki/wiki-commit.sh           ← Git adds, commits, pushes to wiki repo
        │
        ▼
GitHub Wiki (github.com/user/repo/wiki)
```

## Trigger Events

| Event | Sync Required |
|-------|--------------|
| New platform release | Yes — update Roadmap, Home, Platform Overview |
| Architecture change | Yes — update Architecture, Platform Overview |
| New screenshot added | Yes — update Screenshots-and-Demos |
| Trust/compliance update | Yes — update Security-Posture, Trust-Center |
| FAQ update | Yes — update FAQ |
| Routine content polish | Optional — batch with next release |

## Sync Steps (Manual)

1. Edit source pages in `docs/wiki/wiki-seed/`
2. Run `npx tsx scripts/wiki/prepare-wiki-pages.ts` to validate and check for broken links
3. Ensure local wiki clone exists at `../szl-holdings-platform.wiki/` (see setup below)
4. Run `npx tsx scripts/wiki/export-docs-to-wiki.ts` to copy files
5. Run `bash scripts/wiki/wiki-commit.sh "Message describing the update"` to commit and push

## Local Wiki Clone Setup

The GitHub Wiki is a separate Git repository. Clone it alongside the main repo:

```bash
git clone https://github.com/stephenlutar2-hash/szl-holdings-platform.wiki.git ../szl-holdings-platform.wiki
```

The wiki repo URL follows the pattern: `{repo-url}.wiki.git`

## File Mapping

| Source (Replit) | Destination (Wiki repo) |
|----------------|------------------------|
| `docs/wiki/wiki-seed/Home.md` | `Home.md` |
| `docs/wiki/wiki-seed/Platform-Overview.md` | `Platform-Overview.md` |
| `docs/wiki/wiki-seed/Architecture.md` | `Architecture.md` |
| `docs/wiki/wiki-seed/Deployment-Model.md` | `Deployment-Model.md` |
| `docs/wiki/wiki-seed/Security-Posture.md` | `Security-Posture.md` |
| `docs/wiki/wiki-seed/Trust-Center.md` | `Trust-Center.md` |
| `docs/wiki/wiki-seed/Screenshots-and-Demos.md` | `Screenshots-and-Demos.md` |
| `docs/wiki/wiki-seed/Buyer-Use-Cases.md` | `Buyer-Use-Cases.md` |
| `docs/wiki/wiki-seed/Investor-Overview.md` | `Investor-Overview.md` |
| `docs/wiki/wiki-seed/FAQ.md` | `FAQ.md` |
| `docs/wiki/wiki-seed/Roadmap.md` | `Roadmap.md` |
| `docs/wiki/wiki-seed/Glossary.md` | `Glossary.md` |
| `docs/wiki/_Sidebar.md` | `_Sidebar.md` |
| `docs/wiki/_Footer.md` | `_Footer.md` |

## Conflict Policy

The Replit workspace is the source of truth. Any manual edits made directly on GitHub Wiki will be overwritten on the next sync. This is by design. All wiki content editing happens in the workspace.

## First-Time Setup

Before first sync, enable the wiki on the GitHub repo:
1. Go to the repository → Settings → Features → check "Wikis"
2. Create the first wiki page manually through the GitHub UI (required to initialize the wiki repo)
3. Clone the wiki repo locally using the command above
4. Run the full sync pipeline

See `ops/github/wiki-manual-steps.md` for the complete first-time setup checklist.
