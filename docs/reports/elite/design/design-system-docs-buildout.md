# Design System Documentation Buildout

## Status: Documented (No Storybook)

## Current State
- Shared UI library exists at packages/shared-ui/
- Premium dark theme with Tailwind CSS
- Consistent design patterns across all products
- No Storybook installed (deferred — heavy setup for current stage)

## Documented Design System Components

### Core Components
- Buttons (primary, secondary, ghost, danger, disabled states)
- Forms (text inputs, selects, textareas, date pickers, validation)
- Tables (sortable, filterable, paginated, responsive)
- Badges and status chips
- Alerts and toasts
- Drawers and modals (slide panels, confirmations)
- Detail pages (entity detail, property detail, vessel detail)
- Audit timelines
- Charts (area, bar, line via Recharts)
- Maps (fleet map, property map)
- Command/search patterns

### Design Tokens
- BG: #080c14 / #070a10
- Premium amber: #d4a054
- Risk: #c45a4a
- Signals: #c8953c
- Intelligence: #8b7ac8
- Motion: #4a90b8
- Banned: text-red-400, text-orange-400, text-emerald-400 (except status chips)

### Component States Documented
- Empty, Loading, Error, Success, Disabled, Danger
- Mobile responsive, Dense data

## What's Missing
- Storybook installation and stories
- Visual regression testing
- Component usage notes (inline)
- Accessibility notes per component
- Screenshot catalog
