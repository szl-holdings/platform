# SZL Holdings — Governed Autonomy Demo

Animated video artifact demonstrating the SZL Holdings governed autonomy platform. Showcases the end-to-end decision loop from signal detection through governed execution and proof chain. Covers all 10 product surfaces in one continuous motion-graphics video.

**Kind:** video  
**Preview path:** `/szl-demo-video/`  
**Artifact dir:** `artifacts/szl-demo-video/`

## Screenshots

| View | Path |
|------|------|
| Hero — Opening scene | `media/screenshots/szl-demo-video/hero.png` |

Regenerate: `bash scripts/capture-screenshots.sh szl-demo-video`

## Video cuts

The video includes four social cuts selectable from the top-right corner:

| Cut | Duration | Description |
|-----|----------|-------------|
| Full Demo | ~70s | Complete platform walkthrough |
| 60s Cut | 60s | Platform overview + proof |
| 30s Cut | 30s | Value proposition + close |
| 15s Cut | 15s | Hook + tagline |

Captions are burned in by default and can be toggled via the top-left CC button.

## Local development

```bash
pnpm --filter @szl-holdings/szl-demo-video dev
```

## Scene structure

| Scene | Name | Content |
|-------|------|---------|
| open | The Governance Problem | Hook: "The era of AI without receipts is ending" |
| reel | Meet the Platform | All 10 product surfaces cycling with mock UIs |
| fabric | The Alloy Fabric | Decision Fabric graph (Constellation, Guardian, etc.) |
| cortex | CORTEX Mobile | Cross-domain alert correlation on mobile |
| close | Governed Autonomy | SZL Holdings brand lockup + tagline |

## Notes

This is a demo/marketing video artifact — not an interactive product surface. For the interactive Governed Decision Loop walkthrough, see the Command app at `/command/operations/governed-decision-loop`.

Brand standards and visual tokens: `media/brand-kit/tokens.md`
