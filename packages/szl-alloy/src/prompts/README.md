# Alloy Codex — Prompt Kernel Library

`@szl/alloy/prompts` is a versioned, governed library of **prompt kernels** — structured, reusable AI prompt templates that power every SZL vertical. Each kernel is distilled from the best patterns across 21 leading 2026 AI tools.

## Quick Start

```ts
import { getKernel, renderKernel, listKernels, getKernelsForVertical } from '@szl/alloy/prompts';

// Retrieve a kernel
const kernel = getKernel('research-and-cite');

// Render a kernel with variables
const result = renderKernel('research-and-cite', {
  topic: 'Volt Typhoon C2 infrastructure shifts',
  sources: '[{"title":"CISA Advisory","url":"...","excerpt":"..."}]',
});

console.log(result.rendered);      // interpolated prompt
console.log(result.systemPrompt);  // system prompt string
console.log(result.modelHints);    // preferred model, temperature, etc.

// List all kernels
const all = listKernels();

// Filter by domain, vertical, pattern, or tags
const intelligence = listKernels({ domain: 'intelligence' });
const sentraKernels = getKernelsForVertical('sentra');
```

## API Reference

| Function | Signature | Description |
|---|---|---|
| `getKernel` | `(id: string) => PromptKernel` | Retrieve a kernel by id. Throws if not found. |
| `listKernels` | `(filter?: KernelFilter) => PromptKernel[]` | List all kernels, optionally filtered. |
| `renderKernel` | `(id: string, vars: Record<string, unknown>) => RenderResult` | Interpolate a kernel's template with variables. Validates required fields. |
| `getKernelsForVertical` | `(verticalId: string) => PromptKernel[]` | Return all kernels registered for a vertical. |
| `seedKernels` | `() => void` | Seed all kernels into the prompt registry (auto-called on first use). |

## Kernel Catalogue (v1.0.0)

| ID | Name | Domain | Verticals | Inspirations |
|---|---|---|---|---|
| `research-and-cite` | Research & Cite | intelligence | sentra, aegis, vessels, pulse | Perplexity, Claude Cowork |
| `ambient-capture-recap` | Ambient Capture & Recap | productivity | counsel, command, carlota-jo | Granola, Fireflies, Otter |
| `voice-to-action` | Voice to Action | productivity | command, szl-holdings | Superhuman, Motion, Claude |
| `contact-enrichment` | Contact Enrichment | crm | terra, carlota-jo, szl-holdings | Clay, Salesforce Einstein, Apollo |
| `deck-from-brief` | Deck from Brief | content | pulse, szl-holdings | Gamma, Beautiful.ai, Tome |
| `decision-intelligence` | Decision Intelligence | strategy | lyte-command-center, command, aegis, szl-holdings, pulse | Claude Cowork, Julius AI, Motion |
| `deep-analytics` | Deep Analytics | analytics | vessels, terra, pulse, lyte-command-center | Julius AI, Noteable, Hex |
| `conversational-crm` | Conversational CRM | crm | carlota-jo, szl-holdings | Salesforce Einstein, HubSpot Breeze |
| `doc-to-action` | Doc to Action | productivity | counsel, szl-holdings, command | Claude Artifacts, Notion AI |
| `meeting-to-crm-update` | Meeting to CRM Update | crm | szl-holdings, carlota-jo, command | Gong, Salesloft, HubSpot Breeze |
| `threat-intel-briefing` | Threat Intel Briefing | intelligence | sentra, aegis | Recorded Future, Tanium, CrowdStrike |
| `video-storyboard` | Video Storyboard | content | pulse, command | Runway ML, Sora, HeyGen |
| `legal-risk-extract` | Legal Risk Extract | legal | counsel | Harvey AI, Lexis+ AI |
| `cold-outreach` | Cold Outreach | sales | carlota-jo, szl-holdings | Superhuman, Apollo, Clay |
| `maritime-risk-brief` | Maritime Risk Brief | maritime | vessels | Windward, Pole Star, Kpler |
| `executive-briefing` | Executive Briefing | intelligence | pulse, szl-holdings, command, aegis | Perplexity, Granola, Claude |

## Kernel Anatomy

Each `PromptKernel` object contains:

```ts
interface PromptKernel {
  id: string;          // Unique slug, e.g. 'research-and-cite'
  version: string;     // SemVer, e.g. '1.0.0'
  name: string;        // Display name
  description: string;
  pattern: string;     // Interaction pattern slug
  domain: string;      // Business domain
  verticals: string[]; // SZL verticals that use this kernel
  inspirations: string[]; // Source tools/products
  tags: string[];
  createdAt: string;   // ISO 8601
  systemPrompt: string;
  template: string;    // Mustache-style {{variable}} template
  modelHints: ModelHints;
  codex: {
    role: string;        // Agent persona / role
    contract: string;    // Output contract / guarantee
    inputSchema: InputField[];
    outputSchema: OutputField[];
    evidenceRequirements: EvidenceRequirement[];
    refusalPolicy: RefusalPolicy;
    evaluationRubric: RubricCriterion[];
    examples: FewShotExample[];
  };
}
```

## Governance Model

- **Versioning**: Every kernel carries a SemVer version. Breaking changes (template variable renames, removed fields) bump the major version.
- **Registry**: All kernels are seeded into `@szl-holdings/prompt-registry` on first import. The registry tracks versions and promotion history.
- **Refusal Policy**: Each kernel declares explicit triggers that cause the model to refuse rather than hallucinate.
- **Evaluation Rubric**: Each kernel ships with weighted rubric criteria (weights ≤ 1.0) and passing thresholds for automated evaluation.
- **Evidence Requirements**: Kernels that depend on citations or documents declare minimum evidence counts.

## Adding a New Kernel

1. Create `packages/szl-alloy/src/prompts/kernels/your-kernel.ts` following the `PromptKernel` interface.
2. Export it from `kernels/index.ts`.
3. Add it to the `ALL_KERNELS` array in `seed.ts`.
4. Add at least one `FewShotExample` and a full `evaluationRubric`.
5. Register the kernel in the relevant verticals' `verticals` array.
6. Run `pnpm --filter @szl/alloy test` to verify all integrity checks pass.

## Testing

```bash
pnpm --filter @szl/alloy test
```

The test suite (`src/__tests__/prompts.test.ts`) validates:
- All 16 kernels present and correctly structured
- Unique IDs, valid semver versions, valid ISO dates
- Rubric weights sum ≤ 1.0 per kernel
- `getKernel` retrieval and error handling
- `renderKernel` interpolation and missing-variable validation
- Coverage of all 10 SZL verticals

## Inspiration Sources

This library distils patterns from the following 21 leading AI tools (2026):

Perplexity · Claude (Anthropic) · Granola · Fireflies · Otter · Superhuman · Motion · Julius AI · Noteable · Hex · Clay · Salesforce Einstein · Apollo · HubSpot Breeze · Gamma · Beautiful.ai · Tome · Gong · Recorded Future · Harvey AI · Runway ML
