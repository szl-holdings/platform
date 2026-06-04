# SZL Holdings — Skill Forge

## Overview

Skill Forge is a learning system that converts execution failures into reusable improvements. It mines failure traces from Command Arena and production, clusters failure modes, infers candidate skills, and measures whether the skill actually improved performance.

## Workflow

```
1. COLLECT     ← Gather failure traces from Arena + production
       ↓
2. CLUSTER     ← Group failures by mode (prompt, tool, routing, decomposition)
       ↓
3. INFER       ← Generate candidate skills/patches for each cluster
       ↓
4. APPLY       ← Deploy skill to affected workflows
       ↓
5. EVALUATE    ← Rerun Arena scenarios to measure improvement
       ↓
6. PROMOTE     ← If improvement confirmed, promote to skill registry
```

## Skill Types

| Type | Description | Example |
|------|-------------|---------|
| Prompt Strategy | Improved prompt templates for specific scenarios | Better entity extraction prompt for maritime documents |
| Tool Selection | Optimal tool choice for given context | Use embedding search before SQL for entity lookup |
| Routing Strategy | Better signal routing rules | Route financial signals through Monte Carlo before recommendation |
| Decomposition Strategy | Breaking complex queries into steps | Multi-step property valuation with intermediate verification |
| Memory Retrieval | Better context assembly | Prioritize recent evidence over historical for incident response |
| Fallback Strategy | Graceful degradation patterns | Serve cached recommendation with staleness flag when model unavailable |
| Escalation Strategy | Human-in-the-loop triggers | Auto-escalate when confidence drops below domain-specific threshold |

## Skill Registry

```typescript
interface Skill {
  id: string;
  type: SkillType;
  name: string;
  description: string;
  source_failure_cluster: string;
  created_from_arena_run: string;
  improvement_delta: number;
  domains_applicable: string[];
  status: "candidate" | "testing" | "promoted" | "deprecated";
  promoted_at?: string;
  usage_count: number;
}
```

## Implementation

### Failure Mining
- Script: `scripts/evals/mine-failures-for-skills.ts` (scaffold)
- Input: Arena results from `generated/arena-results/`
- Output: Clustered failure reports with candidate skill suggestions

### Skill Library
- Package: `packages/skill-library`
- Runtime: `lib/forge-runtime`
- Skills are loaded at agent initialization and applied contextually

### Evaluation Loop
- Each candidate skill is tested against the failing scenarios
- Improvement delta is measured (score change)
- Skills that improve scores are promoted
- Skills that degrade scores are rejected with documented reasoning

## Integration

| System | Integration |
|--------|------------|
| Command Arena | Failed scenarios feed failure mining pipeline |
| Agent Runtime | Promoted skills are loaded at agent initialization |
| Proof Chain | Skill application is recorded in the decision audit trail |
| Model Policy Registry | Skills reference registered models and tools |
