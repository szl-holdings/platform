# SZL Holdings — Design System Tokens

**Date:** April 2026  
**Implementation:** Tailwind CSS v4 + CSS custom properties

---

## Color Tokens

### Semantic Color Scale

These CSS custom properties are defined in the root stylesheet and applied through Tailwind utilities.

```css
/* Background hierarchy */
--background:           /* Deep dark — primary page background */
--card:                 /* Slightly lighter — card and panel surfaces */
--card-hover:           /* On-hover state for interactive cards */
--muted:                /* Secondary surfaces — inactive tabs, disabled states */
--popover:              /* Dropdown, tooltip, popover backgrounds */

/* Border */
--border:               /* Standard border — card edges, dividers */
--border-subtle:        /* Very subtle separator — section dividers */
--input:                /* Input field border */

/* Text */
--foreground:           /* Primary text — headings, primary body */
--muted-foreground:     /* Secondary text — labels, metadata, timestamps */
--card-foreground:      /* Text on card surfaces */

/* Brand accent */
--primary:              /* Brand blue — active states, links, CTAs */
--primary-foreground:   /* Text on primary backgrounds */

/* Semantic status */
--status-success:       /* green-500 equivalent — healthy, connected, live */
--status-warning:       /* yellow-500 equivalent — at risk, pending, stale */
--status-danger:        /* red-500 equivalent — critical, offline, failed */
--status-info:          /* blue-400 equivalent — informational, in-progress */
--status-neutral:       /* gray-500 equivalent — inactive, archived */

/* Chart palette (dark-appropriate) */
--chart-1:              /* Primary data series — medium blue */
--chart-2:              /* Secondary data series — teal */
--chart-3:              /* Tertiary data series — violet */
--chart-4:              /* Quaternary data series — amber */
--chart-5:              /* Quinary data series — rose */
--chart-6:              /* Senary data series — emerald */
```

---

## Typography Scale

| Token | Usage | Tailwind Classes |
|-------|-------|-----------------|
| Display | Page titles, hero headings | `text-2xl font-semibold tracking-tight` |
| H1 | Section headers, modal titles | `text-xl font-semibold` |
| H2 | Card headings, widget titles | `text-base font-semibold` |
| H3 | Sub-headings, group labels | `text-sm font-medium` |
| Body | Primary body copy | `text-sm text-foreground` |
| Secondary | Metadata, descriptions, labels | `text-xs text-muted-foreground` |
| KPI Value | Large metric numbers | `text-3xl font-bold tabular-nums` |
| KPI Label | Metric labels | `text-xs font-medium text-muted-foreground uppercase tracking-wide` |
| Badge | Status labels, tags | `text-xs font-medium` |
| Code / ID | Technical identifiers, IDs, hashes | `text-xs font-mono text-muted-foreground` |
| Caption | Chart labels, axis labels | `text-xs text-muted-foreground` |

---

## Spacing Scale

All spacing values use Tailwind's built-in scale. Canonical usages:

| Context | Value | Tailwind |
|---------|-------|---------|
| Card padding | 24px | `p-6` |
| Card inner section gap | 16px | `space-y-4` |
| Widget header bottom | 12px | `mb-3` |
| Table row height | 48px | `py-3` |
| Form field gap | 16px | `gap-4` |
| Page container padding | 24px horizontal | `px-6` |
| Page section gap | 24px | `gap-6` |
| Navigation item | 4px vertical | `py-1` |

---

## Status Badges

Standard vocabulary for all platforms:

| Status | Color | Usage |
|--------|-------|-------|
| Live | green | Real-time data active, service up, entity active |
| Demo | amber | Demonstration / seeded data |
| Pilot | blue | Real data, limited rollout |
| Pending | yellow | Awaiting action, in queue |
| Critical | red | Requires immediate action |
| High | orange | Elevated priority |
| Medium | yellow | Standard priority |
| Low | slate | Low priority |
| Resolved | green | Closed, completed |
| Archived | gray | Inactive, historical |
| Beta | purple | Feature in beta |

---

## Component Standards

### Card Pattern

```
border border-border rounded-lg bg-card p-6
  Header: flex items-center justify-between mb-4
    Title: text-base font-semibold
    Action: text-sm text-muted-foreground (optional)
  Content: space-y-4
  Footer: pt-4 border-t border-border (optional)
```

### KPI Strip

```
grid grid-cols-4 gap-4 (responsive: grid-cols-2 on mobile)
  KPI Item: bg-card rounded-lg p-4
    Value: text-3xl font-bold tabular-nums
    Label: text-xs font-medium uppercase tracking-wide text-muted-foreground
    Delta: text-xs (green/red for positive/negative change)
```

### Status Badge

```
inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium
  Dot indicator: w-1.5 h-1.5 rounded-full (color matches badge)
  [Status text]
```

### Empty State

```
flex flex-col items-center justify-center py-16 text-center
  Icon: w-8 h-8 text-muted-foreground mb-3
  Title: text-sm font-medium mb-1
  Description: text-xs text-muted-foreground max-w-xs mb-4
  Action: Button (if available)
```

### Loading Skeleton

```
animate-pulse rounded bg-muted
  Text line: h-4 w-full
  Title line: h-5 w-2/3
  KPI value: h-8 w-24
  Card: h-32 w-full
```

---

## Chart Guidelines

**Dark-appropriate chart design:**
- Use `--chart-*` tokens, never raw Tailwind color names in chart configs
- Grid lines: `opacity-20` — very subtle
- Axis text: `text-muted-foreground` — `text-xs`
- Tooltip: match card styling (`bg-card border-border`)
- Line charts: 2px stroke weight minimum
- Area charts: 15–20% opacity fill under the line
- Bar charts: rounded corners (`radius: 4`)
- No gradients unless they aid comprehension
