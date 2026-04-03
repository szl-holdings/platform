# SZL Holdings — Publishing State Machine

## Article Lifecycle

```
                    ┌─────────┐
                    │  draft  │  ← Author creates
                    └────┬────┘
                         │
                    ┌────▼────┐
                    │in-review│  ← Editor picks up
                    └────┬────┘
                         │
                    ┌────▼────┐
                    │approved │  ← Editor approves
                    └────┬────┘
                         │
                    ┌────▼─────┐
                    │published │  ← Goes live on owned site
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
         ┌────▼───┐ ┌───▼────┐ ┌──▼──────┐
         │X posts │ │Substack│ │ Medium  │
         │threads │ │post    │ │ article │
         └────┬───┘ └───┬────┘ └──┬──────┘
              │         │         │
              ▼         ▼         ▼
         [permalink] [permalink] [permalink]
              │         │         │
              └────┬────┘         │
                   └──────┬───────┘
                     ┌────▼─────┐
                     │ archived │  ← End of active promotion
                     └──────────┘
```

## Distribution Run States

| State | Description |
|-------|-------------|
| pending | Queued for distribution |
| in-progress | Currently being distributed |
| completed | Successfully published to target |
| failed | Publish attempt failed |
| retry-needed | Failed, should retry |

## Current Implementation Status

| State | In Schema | In UI | In API | Notes |
|-------|-----------|-------|--------|-------|
| draft | ✅ | ✅ | ✅ | Default for new articles |
| in-review | ✅ | ✅ | ✅ | Fixed enum mismatch (was "review") |
| approved | ✅ | ✅ | ✅ | — |
| published | ✅ | ✅ | ✅ | — |
| archived | ✅ | ✅ | ✅ | — |
| scheduled | ❌ | ❌ | ❌ | Needed for automation |
| failed | ❌ | ❌ | ❌ | Needed for publish error handling |
| retry-needed | ❌ | ❌ | ❌ | Needed for publish error handling |

## One Source → Many Outputs

For each canonical article, generate:

1. **Owned Site**: Canonical article at /insights/:slug
2. **Substack**: Full post + Note version
3. **Medium**: Publication-ready article with canonical URL
4. **X**: Long thread (5-10 posts) + 3-5 standalone posts + launch post
5. **LinkedIn**: Text post + PDF document post (if applicable)
6. **Linktree**: Featured link update
7. **PDF/Carousel**: If applicable, generate downloadable asset
