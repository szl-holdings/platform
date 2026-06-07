# Evidence & Provenance UX Spec

Generated: 2026-04-16

## Purpose

Every AI-assisted output on the operator surface must expose sufficient evidence for a human operator to independently validate the conclusion before acting. This is not optional — it is the trust contract between the platform and its operators.

## The Evidence Contract

An AI output panel that lacks provenance is not acceptable in a production operator surface. This spec defines what "sufficient evidence" means and how to render it.

### Minimum Required Fields (per AI output)

| Field | Description | Example |
|-------|-------------|---------|
| `model` | Model ID and version | `gpt-4o-2024-11-20` |
| `provider` | AI provider | `OpenAI via Replit AI Integrations` |
| `confidence` | Score 0–1, shown as % | `0.87 → 87%` |
| `sources` | Array of evidence items | See below |
| `generatedAt` | ISO timestamp | `2026-04-16T10:32:00Z` |
| `rationale` | Human-readable reasoning | One paragraph |

### Evidence Item Schema

```typescript
interface EvidenceItem {
  id: string;
  label: string;         // "Contract Review SLA"
  value: string;         // "48h elapsed (SLA: 24h)"
  source?: string;       // "Northgate CRM Record #4821"
  confidence?: number;   // 0–1
  timestamp?: string;    // ISO
}
```

## Component Library

### `EvidencePanel` (from `@szl-holdings/shared-ui`)

Use for AI model cards, recommendation displays, audit entries.

```tsx
import { EvidencePanel } from "@szl-holdings/shared-ui";

<EvidencePanel
  model="gpt-4o-2024-11-20"
  provider="OpenAI"
  confidence={0.87}
  sources={[
    { label: "Signal Source", value: "Approval queue age: 48h" },
    { label: "SLA Policy", value: "Standard: 24h" },
    { label: "ARR Impact", value: "$840K at risk" },
  ]}
  generatedAt={new Date().toISOString()}
/>
```

### `OperationalEvidencePanel` (from `@szl-holdings/shared-ui`)

Use for compact inline display on action cards, signal feeds, and approval items.

```tsx
import { OperationalEvidencePanel } from "@szl-holdings/shared-ui";

<OperationalEvidencePanel
  items={evidenceItems}
  rationale="Approval queue aged 48h past SLA threshold. ARR exposure confirmed via CRM record."
  compact={false}
/>
```

### `ConfidenceBand` (from `@szl-holdings/shared-ui`)

Use as a visual confidence bar below any AI recommendation.

```tsx
import { ConfidenceBand } from "@szl-holdings/shared-ui";

<ConfidenceBand score={0.87} showLabel />
```

## Confidence Score Interpretation

| Score Range | Label | Color | Action |
|-------------|-------|-------|--------|
| 0.90 – 1.00 | High Confidence | Green `#6b8f71` | Can act with minimal review |
| 0.70 – 0.89 | Moderate Confidence | Amber `#d4a054` | Review key evidence before acting |
| 0.50 – 0.69 | Low Confidence | Orange `#c8953c` | Require human review gate |
| 0.00 – 0.49 | Insufficient Confidence | Red `#c45a4a` | Must not auto-execute |

## Pages Using Evidence Panels

| Page | Evidence Scope |
|------|---------------|
| `alloy-intelligence.tsx` | AI model slots, audit results, triage outputs |
| `alloy-action-console.tsx` | Per-recommendation evidence |
| `alloy-trust-receipts.tsx` | Decision provenance chain |
| `trust-audit.tsx` | Complete audit with actor and AI attribution |
| `signal-feed` | Per-signal confidence and source attribution |
| `approvals-center.tsx` | AI recommendation evidence before approval |

## Anti-Patterns

- **Never** show "AI recommended this" without confidence score and sources
- **Never** render an AI summary without model name and timestamp
- **Never** auto-execute on confidence < 0.70 without operator confirmation
- **Never** use "Analysis complete" as a substitute for actual evidence items

## Approval Gate for Low-Confidence AI Output

When an AI action has confidence < 0.70:

1. Show `HumanReviewBadge` prominently
2. Block automated execution (no "Execute" button)
3. Display full evidence list expanded by default
4. Require explicit operator sign-off with reason
