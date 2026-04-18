# Unified Command

The primary operations command surface for SZL Holdings. Merges the former Lyte Command Center and IMPERIUM cloud sovereignty surfaces into a single unified interface.

**Kind:** web  
**Preview path:** `/command/`  
**Artifact dir:** `artifacts/command/`

## Local development

```bash
pnpm --filter @szl-holdings/command dev
```

## Key modules

| Module | Purpose |
|--------|---------|
| Strategy Dashboard | 5-pillar operational overview (PRISM framework) |
| Signal Timeline | Correlated business signal feed |
| Action Queue | Pending decisions with simulation context |
| Approvals Center | Human-in-the-loop approval queue |
| Governed Decision Loop | Flagship end-to-end loop demo at `/command/operations/governed-decision-loop` |
| Infrastructure | Cloud sovereignty and platform infrastructure (formerly IMPERIUM) |
| Decision Receipts | Immutable governed decision records |
| Outcome Loop | Aggregate outcome graph view |

See `PRODUCT_SURFACE_MAP.md` for the full module-to-primitive mapping.
