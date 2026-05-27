<!-- doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header. -->
# Claude Doctrine Research Brief
**Task:** #4247 — Claude doctrine uplift + A11oy Console workbench
**Date:** 2026-05-05
**Source:** Anthropic platform docs (platform.claude.com/docs) — full tree sweep
**Format:** One section per topic · "We have / We need" delta table at end

---

## 1. Models (Claude Family — "Khipu Tier")

### Current Claude model lineup (as of May 2026)

| Model API ID | Friendly Name | Context Window | Max Output | Input $/1M | Output $/1M | Extended Thinking | Vision | Prompt Cache | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `claude-opus-4-5` | Claude Opus 4.5 | 200,000 | 32,000 | $15.00 | $75.00 | ✓ | ✓ | ✓ | Frontier reasoning |
| `claude-sonnet-4-5` | Claude Sonnet 4.5 | 200,000 | 16,000 | $3.00 | $15.00 | ✓ | ✓ | ✓ | Balanced perf/cost |
| `claude-haiku-4-5` | Claude Haiku 4.5 | 200,000 | 8,000 | $0.80 | $4.00 | — | ✓ | ✓ | Speed/cost optimised |
| `claude-3-5-sonnet-20241022` | Claude 3.5 Sonnet | 200,000 | 8,192 | $3.00 | $15.00 | — | ✓ | ✓ | Legacy stable |
| `claude-3-5-haiku-20241022` | Claude 3.5 Haiku | 200,000 | 8,192 | $0.80 | $4.00 | — | ✓ | ✓ | Legacy fast |
| `claude-3-opus-20240229` | Claude 3 Opus | 200,000 | 4,096 | $15.00 | $75.00 | — | ✓ | ✓ | Legacy frontier |

**Platform note:** Our model registry uses our own internal Khipu versioning (`claude-opus-4-7`, `claude-sonnet-4-6`) which we maintain as forward-looking labels. We've added `claude-haiku-4-5` and added `supportsPromptCaching` + `khipuModel` flags to the registry.

---

## 2. Messages API

**Core contract:**
- `POST /v1/messages` — synchronous, returns full response
- `POST /v1/messages` with `stream: true` — SSE stream with event types: `message_start`, `content_block_start`, `content_block_delta`, `content_block_stop`, `message_delta`, `message_stop`
- Request body: `model`, `max_tokens`, `messages[]`, optional `system`, `tools[]`, `tool_choice`, `thinking`, `metadata`
- Response includes: `id`, `type`, `role`, `content[]`, `model`, `stop_reason`, `stop_sequence`, `usage`
- `usage` includes: `input_tokens`, `output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`

**What we have:** AnthropicChatInterface with `chatCompletion`, `streamChatCompletion`, `chatCompletionWithTools` — correctly calls the Messages API.
**What we need:** Surface `cache_creation_input_tokens` and `cache_read_input_tokens` from the usage object. Currently swallowed by the provider client.

---

## 3. Prompt Caching

**How it works:**
- Mark message blocks with `cache_control: { type: "ephemeral" }` 
- Cache TTL: 5 minutes (ephemeral); on-disk or multi-session caching requires Anthropic business tier
- Minimum cacheable prefix: 1,024 tokens (Haiku), 2,048 tokens (Sonnet/Opus)
- Cost: cache write = 1.25× base input price; cache read = 0.1× base input price (~90% saving on cached tokens)
- Works on: system prompt, conversation history, tool definitions, vision content
- API response includes: `cache_creation_input_tokens`, `cache_read_input_tokens`
- Only the top 4 cache breakpoints are supported per request

**What we have:**
- `lib/ai-engine/src/prompt-cache.ts` — in-process LRU hash-based cache (platform-side, not Anthropic API cache breakpoints)
- Budget manager tracks cost but doesn't model cache-discounted rates

**What we need:**
- Add `cache_control` breakpoint injection to the Anthropic provider's message serialisation
- Wire `cache_creation_input_tokens` + `cache_read_input_tokens` from API responses into cost accounting
- Add `cacheHit: boolean`, `cacheTokensRead: number`, `cacheTokensWritten: number` to provenance envelope
- Expose a "cache breakpoint" toggle in the Console UI so operators can see cost drop live

---

## 4. Extended Thinking

**How it works:**
- Pass `thinking: { type: "enabled", budget_tokens: N }` in the request (min 1024, max varies by model)
- Only Opus supports extended thinking by default; Sonnet on request
- Response content array will include blocks of `type: "thinking"` with `thinking` text and `type: "text"` with the final answer
- Thinking blocks are NOT sent back to the model in follow-up turns (stripped automatically)
- Streaming: thinking tokens arrive as `content_block_delta` with `delta.type === "thinking_delta"`

**What we have:**
- `lib/ai-engine/src/extended-thinking.ts` — multi-pass diverge/converge/synthesise framework
- This is our own reasoning chain implementation, NOT Anthropic's native `thinking` block

**What we need / gap:**
- Our extended thinking is a custom multi-call chain, not the native `thinking` param
- For the Console, add support for passing native `thinking: { type: "enabled", budget_tokens }` to Anthropic directly
- `extended-thinking.ts` keeps its multi-pass chain for non-Anthropic providers and custom reasoning workflows
- For Anthropic providers, native thinking should be the primary path with our multi-pass as fallback
- Add `thinkingBudget?: number` to the Anthropic provider interface to toggle native thinking

---

## 5. Tool Use (Tool-Use Loop)

**Anthropic's contract:**
- Define tools as `{ name, description, input_schema: { type: "object", properties, required } }`
- When model wants to call a tool: response has `stop_reason: "tool_use"` and content includes `{ type: "tool_use", id, name, input }`
- Send tool result back as user message: `{ role: "user", content: [{ type: "tool_result", tool_use_id, content }] }`
- Loop until `stop_reason: "end_turn"` or max rounds hit

**What we have:**
- `lib/ai-engine/src/providers/anthropic/chat-with-tools.ts` correctly implements this full contract
- `lib/ai-engine/src/agent-tool-loop.ts` routes Anthropic calls via `runAnthropicToolLoop`

**What we need:** The existing implementation is conformant. Enhancement: add `tool_choice` support (`auto`, `any`, `tool`) to allow forcing a specific tool call from the Console.

---

## 6. Model Context Protocol (MCP)

**What it is:**
- Open protocol for tool servers (HTTP+SSE or stdio)
- Claude can be an MCP client connecting to external tool servers
- Tool servers expose: resources, prompts, tools
- Anthropic hosts managed MCP servers for web search, code execution, etc.

**What we have:**
- `lib/ai-engine/src/mcp-apps` — MCP apps folder exists
- `artifacts/a11oy/src/pages/McpHub.tsx` — MCP Hub UI page

**What we need:**
- MCP client connecting through our existing Anthropic provider is the primary gap
- Reconcile `mcp-apps` with the doc's `MCPServerDefinition` schema
- The Console should let operators pick an MCP server to attach tools from

---

## 7. Agent Skills

**What it is:**
- Anthropic's "Computer Use" + reusable skill packs
- Skills: pre-built capability modules (bash, file I/O, browser, etc.)
- Registered at the session level, not per-message

**What we have:**
- `lib/ai-engine/src/skills` — skills directory exists

**What we need:**
- Verify the skills loader matches the Anthropic skills convention (`type: "computer_use"` block)
- The Console's tool picker should enumerate registered skills

---

## 8. Batch API

**What it is:**
- `POST /v1/messages/batches` — submit up to 10,000 requests in one call
- Async processing (typ. 1 hour, up to 24 hours)
- 50% cost discount vs synchronous
- Poll with `GET /v1/messages/batches/:id`; download results from `results_url`
- Use case: large eval runs, backfill jobs, fine-tuning data prep

**What we have:**
- `lib/ai-engine/src/providers/anthropic/batch/` — batch utilities exist

**What we need:**
- Verify the batch utility uses `/v1/messages/batches` endpoint (not `/v1/messages` repeated)
- Add a Batch API route in the Console's right rail ("Run as Batch" toggle)
- Cost accounting should reflect 50% batch discount

---

## 9. Files API

**What it is:**
- `POST /v1/files` — upload a file (PDF, text, image, etc.) and get a `file_id`
- Use `file_id` in messages as `{ type: "document", source: { type: "file", file_id } }`
- Max file size: 32 MB; supported formats: PDF, TXT, MD, CSV, HTML, images
- File storage is per-API-key; files persist until deleted
- Use `DELETE /v1/files/:id` to clean up

**What we have:** No Files API integration.

**What we need:**
- `lib/ai-engine/src/providers/anthropic/files.ts` — upload, get, delete wrappers
- Console UI: file attachment button that uploads and inserts a `file_id` reference

---

## 10. Citations

**What it is:**
- When `citations: { enabled: true }` is passed, Claude adds source citations to its answer
- Response includes `citations[]` with source text, doc ID, page number
- Works best with document-grounded answers (PDFs, retrieved chunks)
- Helps with RAG-augmented answers where factual grounding matters

**What we have:** No citations integration.

**What we need:**
- Add `citations?: { enabled: boolean }` to the Anthropic provider call options
- Parse citation blocks in the Console's streaming canvas to render inline source refs
- `lib/ai-engine/src/providers/anthropic/citations.ts` — helper to enable and parse citation blocks

---

## 11. Vision (Image Input)

**What it is:**
- Pass images in messages as `{ type: "image", source: { type: "base64", media_type, data } }` or `{ type: "url", url }`
- Supported: JPEG, PNG, GIF, WEBP
- Max image size: 5 MB per image; max 20 images per request
- Works on all Claude models except Haiku 3.0

**What we have:**
- `supportsVision: boolean` flag in the model registry ✓
- No vision content builder in the provider client

**What we need:**
- `lib/ai-engine/src/providers/anthropic/vision.ts` — helpers to build image content blocks
- Console UI: image drop zone when a vision-capable model is selected

---

## 12. Content Moderation

**What it is:**
- Anthropic offers a classifier layer for harmful content detection
- Pre-call: validate input doesn't violate AUP
- Post-call: validate output doesn't include unsafe content
- Available via the `/v1/messages` normal path (Claude refuses on its own) + optional third-party classifiers
- `stop_reason: "max_tokens"` vs `"end_turn"` can signal incomplete/truncated responses

**What we have:**
- Covenant Policy layer (PCE gate) — governs action permission at the platform level

**What we need:**
- `lib/ai-engine/src/providers/anthropic/content-moderation.ts` — pre/post hooks
- Pre-hook: check input against moderation rules before sending to Anthropic
- Post-hook: verify output doesn't contain restricted patterns
- Wire both hooks into the Console's run pipeline

---

## 13. Token Counting

**What it is:**
- `POST /v1/messages/count_tokens` — returns `input_tokens` for a messages array + system prompt WITHOUT making an inference call
- Useful for pre-flight budget checks and context window management

**What we have:**
- Rough heuristic token estimates in `provenance.ts` (`Math.ceil(chars / 4)`)
- Cost estimation uses those rough estimates

**What we need:**
- `lib/ai-engine/src/providers/anthropic/token-counter.ts` — wrapper for the count_tokens endpoint
- Console right rail: show exact token count as user types (debounced, pre-flight)

---

## 14. Embeddings

Not provided by Claude natively. Use separate embedding providers (Cohere, OpenAI, etc.). Already covered by our `lib/ai-engine/src/embedding/` stack.

**Delta:** None needed.

---

## 15. Evaluations (Evals)

**What it is:**
- Anthropic has an Evals library (Python) for automated quality testing
- Patterns: exact match, similarity, model-graded, human-graded
- Recommended: write evals as unit tests; run on golden datasets

**What we have:**
- `lib/ai-engine/src/evals` — evals directory exists
- MirrorEval system (our own evaluator)

**What we need:**
- MirrorEval is our equivalent — no migration needed
- For the Console: add "Grade this response" action that runs a quick MirrorEval pass on any completed run

---

## 16. Prompt Engineering Best Practices

Key doctrine from the docs:

| Practice | Status | Action |
|---|---|---|
| Put instructions at the start, context at end | ✓ Our system prompts follow this | Enforce in Console's system prompt editor |
| Use XML tags for structure (`<document>`, `<instructions>`) | Partial | Recommend in Console's system prompt template |
| Multi-shot examples in `<examples>` blocks | Partial | Add example block support to Console |
| Chain-of-thought: ask Claude to think step-by-step | ✓ Extended thinking | Already wired |
| Prefill assistant turn | Not used | Add "prefill" field to Console advanced params |
| Avoid negative instructions ("don't do X") | Doc guidance | Console system prompt linter (future) |
| Use `max_tokens` generously — Claude stops at natural end | ✓ | |

---

## 17. Safety & Responsible Scaling Policy

- ASL-2 currently deployed; ASL-3 thresholds being evaluated
- Claude refuses CBRN uplift, cyber-offense at scale, CSAM
- Anthropic has a red-teaming programme
- Claude has a "right to refuse" on distressing requests (welfare policy)

**What we have:** Covenant Policy layer enforces platform-level governance before any model call.
**What we need:** No changes needed; our covenant + PCE gate is the equivalent operator-side control.

---

## 18. Computer Use (Beta)

**What it is:**
- Special tool type `{ type: "computer_use" }` that lets Claude see a desktop screenshot and emit `{ type: "computer_20241022", name: "computer", input: { action, coordinate } }` tool calls
- Requires a screen capture / VNC loop
- Still in beta; not GA

**What we have:** Not implemented.
**What we need:** Out of scope for this task; flagged for future skills loader work.

---

## Delta Table: We Have / We Need

| Capability | We Have | We Need (this task) |
|---|---|---|
| Messages API streaming | ✓ Full SSE stream in chat-with-tools | Surface cache token counts |
| Prompt caching (API-level breakpoints) | ✗ | Add `cache_control` injection + cost accounting |
| Extended thinking (native) | Partial (our custom multi-pass; no native `thinking` param) | Wire native `thinking` param in Console + Anthropic provider |
| Tool use loop | ✓ Conformant contract | — |
| MCP client | Partial (mcp-apps folder) | Console MCP server picker |
| Agent Skills | Partial (skills dir) | Console skill enumeration |
| Batch API | Partial (batch/ dir exists) | Verify endpoint + Console "Run as Batch" toggle |
| Files API | ✗ | `anthropic/files.ts` wrapper + Console attachment |
| Citations | ✗ | `anthropic/citations.ts` + Console inline rendering |
| Vision | Partial (flag in registry, no content builder) | `anthropic/vision.ts` content block helpers |
| Content moderation | Partial (PCE gate is platform-level) | `anthropic/content-moderation.ts` pre/post hooks |
| Token counting (exact) | Partial (heuristic) | `anthropic/token-counter.ts` shim + Console pre-flight |
| Haiku model | ✗ | Add `claude-haiku-4-5` to model registry |
| Model registry `supportsPromptCaching` flag | ✗ | Add flag + `khipuModel` indicator |
| Console UI (3-pane workbench) | ✗ | Build `pages/Console.tsx` |
| Console API route | ✗ | Build `api-server/routes/a11oy-console.ts` |
| Sidebar Console nav entry | ✗ | Add to Orchestration group in Sidebar |

---

## Reference Links (Anthropic Platform Docs)

- Models: `platform.claude.com/docs/en/models/overview`
- Messages API: `platform.claude.com/docs/en/api/messages`
- Streaming: `platform.claude.com/docs/en/api/messages-streaming`
- Prompt Caching: `platform.claude.com/docs/en/build-with-claude/prompt-caching`
- Extended Thinking: `platform.claude.com/docs/en/build-with-claude/extended-thinking`
- Tool Use: `platform.claude.com/docs/en/build-with-claude/tool-use`
- MCP: `platform.claude.com/docs/en/build-with-claude/mcp`
- Agent Skills: `platform.claude.com/docs/en/build-with-claude/computer-use`
- Batch API: `platform.claude.com/docs/en/api/creating-message-batches`
- Files API: `platform.claude.com/docs/en/api/files`
- Citations: `platform.claude.com/docs/en/build-with-claude/citations`
- Vision: `platform.claude.com/docs/en/build-with-claude/vision`
- Token Counting: `platform.claude.com/docs/en/api/counting-tokens`
- Content Moderation: `platform.claude.com/docs/en/resources/responsible-use-guide`
- Prompt Engineering: `platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview`
- RSP: `anthropic.com/responsible-scaling-policy`
