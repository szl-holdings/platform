# @workspace/eval-os

Eval OS is the **unified evaluation framework** for the SZL Agentic Cognitive Operating Intelligence Platform.

## Contract

Eval OS provides primitives for gold-dataset testing, scenario suites, prompt tests, tool reliability, citation quality, hallucination detection, policy adherence, latency, cost, and regression detection.

### Evaluation Categories

- `gold-dataset` — Expected input/output pairs for regression testing
- `scenario-suite` — Complex multi-step agent scenarios
- `prompt-test` — Prompt template evaluation
- `tool-reliability` — Tool error rate and timeout tracking
- `citation-quality` — Citation coverage and accuracy
- `hallucination` — Hallucination detection
- `policy-adherence` — Policy compliance rate
- `latency` — Latency budget compliance
- `cost` — Cost target compliance
- `regression` — Automated regression detection

### Running an Eval Pack

```typescript
import { createPack, addScenario, EvalScenarioSchema } from '@workspace/eval-os/dataset';
import { runPack, printReport } from '@workspace/eval-os/cli';

let pack = createPack({ id: 'my-pack', name: 'My Eval Pack', version: '1.0', tags: [] });
pack = addScenario(pack, EvalScenarioSchema.parse({
  id: 's1',
  name: 'Intent classification',
  category: 'prompt-test',
  examples: [
    { id: 'e1', input: 'show me my vessels', expectedOutput: 'navigate:vessels' },
  ],
}));

const report = await runPack({
  pack,
  runFn: async (input) => myAgent.classify(input),
});

printReport(report);
```

### Regression Detection

```typescript
import { detectRegressions } from '@workspace/eval-os/regression';

const result = detectRegressions(baselineReport, currentReport);
if (result.hasRegression) {
  console.log('Regressions found:', result.regressions);
}
```

## Non-goals

- Eval OS does not ship with LLM-based judges (add per-app using your model router).
- Eval OS does not automatically run in CI (add a CI step per-app in follow-up tasks).
- No ground truth data is bundled — each app provides its own eval packs.

## Absorption

This package absorbs and re-exports `@szl-holdings/evals-core` as a compatibility shim.
