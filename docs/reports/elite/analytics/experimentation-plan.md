# Experimentation Plan

## Approach
Experiments are run using feature flags. Each experiment follows a structured process:

### Process
1. **Hypothesis**: State what you expect to happen
2. **Metric**: Define the primary success metric
3. **Variants**: Define control and treatment
4. **Duration**: Minimum 2 weeks
5. **Sample**: Calculate minimum sample size
6. **Implementation**: Configure feature flag for variants
7. **Analysis**: Compare results with statistical significance
8. **Decision**: Ship winner, iterate, or abandon

## Planned Experiments

| Experiment | Hypothesis | Metric | Status |
|-----------|-----------|--------|--------|
| CTA copy variants | Different CTA text improves lead capture | Lead capture rate | Planned |
| Dashboard layout | Simplified dashboard increases engagement | DAU / feature usage | Planned |
| Onboarding flow | Guided tour improves activation | Time to first action | Planned |

## Rules
- Only one experiment per user at a time (avoid interaction effects)
- Minimum 2 weeks runtime
- Minimum 100 users per variant (adjust per metric)
- Always have a pre-defined success criterion
- Never peek and stop early without statistical significance
- Document all experiments and results

## Current State
- Experimentation framework documented
- Feature flag system supports experiment flags
- **No experiments running yet** — instrumentation needed first
