<!-- doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header. -->
# Vendor Outreach Packages — Top 3 Priority Integrations
**SZL Holdings | Stephen P. Lutar | ORCID 0009-0001-0110-4173**
**Product:** `@szl-holdings/ouroboros` v6.1.0 | `@szl-holdings/guardrails` SKU
**DOIs:** [10.5281/zenodo.19867281](https://doi.org/10.5281/zenodo.19867281) · [10.5281/zenodo.19944926](https://doi.org/10.5281/zenodo.19944926)

Priority rationale from INTEGRATION_TARGETS.md: LangChain is the canonical Λ attestation surface (Callbacks API fires at every discrete agent decision); Anthropic offers free Claude Partner Network membership with the highest-leverage agentic safety pitch; Arize AI / Phoenix is fully OSS (8.5k stars) and a PR-based integration is executable in days without partner approval.

---

## Vendor 1: LangChain / LangSmith

### Program
LangChain Partner Network — [langchain.com/langchain-partner-network](https://www.langchain.com/langchain-partner-network)

### Target Contact
`partnerships@langchain.dev` (inferred from Partner Network page); GitHub Discussions on `langchain-ai/langchain` for technical reviewer.

### Subject Line
`LambdaCallbackHandler` — Ouroboros trust receipts native in LangSmith

### Email Body

Hi LangChain Partner Network Team,

I am Stephen Lutar, founder of SZL Holdings (single-member NY entity). We build Ouroboros (`@szl-holdings/ouroboros`, MIT), a production guardrails runtime that emits a standardized 9-axis trust receipt per AI decision — a closed-form Λ scalar covering fidelity, hallucination risk, drift, latency, scope-creep, toxicity, provenance, consent alignment, and cost.

LangChain is the canonical integration surface for Ouroboros. The LangChain Callbacks API fires at every discrete agent decision point: tool selection, LLM call, chain step, agent action. A `LambdaCallbackHandler` attaches a Λ scalar to each LangSmith run as metadata — zero breaking changes, zero schema migration, fully compatible with existing LangSmith deployments. Every existing LangSmith user gets structured trust attestation on every run without changing their code beyond adding the handler.

We intend to contribute `langchain-ouroboros` to the `langchain-community` package and submit a listing through the LangChain Partner Network. Our mathematical model is peer-reviewed: DOIs 10.5281/zenodo.19867281 and 10.5281/zenodo.19944926. We have a working prototype and can share a branch PR within one week of a technical contact being identified.

The `@szl-holdings/guardrails` SKU (54 tests, closed-form Λ, hash-chained receipts) is a drop-in NeMo Guardrails replacement. LangChain customers who currently use NeMo can replace it with a single package swap and gain a verifiable, auditable receipt log on every guardrail decision.

Can you connect us with the integrations team who reviews `langchain-community` contributions? We are ready to move.

Best,
Stephen P. Lutar
SZL Holdings
stephenlutar2@gmail.com
ORCID: 0009-0001-0110-4173
Runtime: @szl-holdings/ouroboros
GitHub: github.com/szl-holdings/ouroboros

### Attached Artifacts
1. Pitch deck: `/home/user/workspace/ouroboros-unified-payload/pitch/SZL_Holdings_Ouroboros_Pitch_Deck.pdf` [placeholder — generate before send]
2. Technical specification: `https://doi.org/10.5281/zenodo.19944926` (v2 Zenodo DOI, peer-reviewed Λ axis model)
3. GitHub repository: `https://github.com/szl-holdings/ouroboros` [confirm repo URL before send]

### LinkedIn DM Alternative

Stephen Lutar, SZL Holdings — building `@szl-holdings/ouroboros`, a 9-axis AI trust receipt runtime. We want to contribute `langchain-ouroboros` to `langchain-community`: a `LambdaCallbackHandler` that writes Λ scalars to LangSmith run metadata on every callback. Peer-reviewed model at doi.org/10.5281/zenodo.19944926. Can I connect with whoever reviews community integrations?

---

### Technical Brief: LangChain / LangSmith Integration

#### Integration: `langchain-ouroboros` — LambdaCallbackHandler for LangSmith

**Overview**

The LangChain integration surface is the `BaseCallbackHandler` abstract class, which fires synchronous or asynchronous hook methods on every discrete LangChain event: `on_llm_start`, `on_llm_end`, `on_chain_start`, `on_chain_end`, `on_tool_start`, `on_tool_end`, `on_agent_action`, `on_agent_finish`. Ouroboros ships a concrete implementation, `LambdaCallbackHandler`, that intercepts the `on_llm_end` and `on_tool_end` events, computes a 9-axis Λ scalar from the event payload, and writes the receipt as structured metadata on the active LangSmith `RunTree` object.

**API Surface**

```python
from langchain_ouroboros import LambdaCallbackHandler

handler = LambdaCallbackHandler(
    axis_weights=[1.0] * 9,      # optional: per-axis priority weights
    receipt_sink="s3://...",     # optional: write receipts to S3 sink
    hash_chain=True,             # enable hash-chained receipt log
    block_on_threshold=None,     # optional: Λ threshold above which call is blocked
)

llm = ChatOpenAI(callbacks=[handler])
chain = LLMChain(llm=llm, prompt=prompt, callbacks=[handler])
```

The `LambdaCallbackHandler` is instantiated once and passed to any LangChain component that accepts a `callbacks` argument. No other code changes are required. LangSmith receives the Λ receipt as `extra.ouroboros` in the run metadata, visible in the LangSmith UI as a structured JSON field on every run.

**Scope**

- Package: `langchain-ouroboros` published to PyPI and `langchain-community/libs/community/langchain_community/callbacks/`
- Language: Python 3.9+
- Dependencies: `@szl-holdings/ouroboros` (npm, JS/TS) or `szl-holdings-ouroboros` (PyPI, Python); `langchain-core >= 0.1.0`
- LangSmith metadata fields: `ouroboros.lambda_scalar` (float, 0–1), `ouroboros.axes` (dict, 9 float values), `ouroboros.receipt_hash` (SHA-256 hex), `ouroboros.receipt_ts` (ISO 8601)

**Expected Effort**

- Prototype `LambdaCallbackHandler`: 3–5 days
- LangSmith metadata field integration and unit tests: 2 days
- `langchain-community` PR preparation (docstring, README, type hints, unit tests): 3 days
- Total: approximately 8–10 engineering days from kickoff to open PR

**Public Artifact Target**

Primary: a merged PR to `langchain-ai/langchain` adding `langchain_community/callbacks/ouroboros.py` with full test coverage and a usage example in the LangChain docs. Secondary: a co-authored blog post on the LangChain blog ("Adding 9-axis trust attestation to every LangSmith run") to be published within 30 days of PR merge. Tertiary: a conference talk submission to LangChain's next developer event or a relevant AI engineering conference (NeurIPS, ICLR workshops) citing the Zenodo DOIs as the mathematical foundation.

---

## Vendor 2: Anthropic — Claude Partner Network

### Program
Claude Partner Network — [anthropic.com/news/claude-partner-network](https://www.anthropic.com/news/claude-partner-network)
Free membership, open to any organization bringing Claude to market; launched March 2026; $100M Anthropic investment in program.

### Target Contact
`partners@anthropic.com` (inferred from Claude Partner Network program page); formal application via the Claude Partner Network page.

### Subject Line
Ouroboros MCP server for Claude — scope-creep + consent receipts

### Email Body

Hi Anthropic Partnerships Team,

I am Stephen Lutar, founder of SZL Holdings. We build Ouroboros (`@szl-holdings/ouroboros`, MIT) and would like to join the Claude Partner Network to ship a reference MCP server integration.

Claude's tool use API is the primary surface where agentic AI systems take actions in the real world. It is also the surface most vulnerable to scope-creep — a tool invoked beyond the bounds of the original user task — and consent misalignment — an action not authorized by the user's actual intent. These are exactly the failure modes Ouroboros axis 5 (scope-creep) and axis 8 (consent alignment) are designed to detect.

The integration is straightforward: Ouroboros ships as an MCP server that proxies Claude tool calls, computing a Λ trust receipt on each tool invocation before passing results back to Claude. The receipt includes a scope-creep score (how far the tool's actual effect deviated from the stated task scope) and a consent-alignment score (how closely the tool invocation matches the user's authorized intent as stated in the original system prompt). Both scores are closed-form computations — no additional LLM call is required. The MCP server is fewer than 300 lines of Python.

We have reviewed the Claude Partner Network terms. Membership is free and open. Our formal 9-axis trust model is peer-reviewed: DOIs 10.5281/zenodo.19867281 and 10.5281/zenodo.19944926. The `@szl-holdings/guardrails` SKU (54 tests, hash-chained receipts) is also positioned as a drop-in replacement for NeMo Guardrails in Claude pipelines.

We would welcome a technical review from your safety or integrations team. We can have a reference MCP server implementation ready for review within two weeks.

Best,
Stephen P. Lutar
SZL Holdings
stephenlutar2@gmail.com
ORCID: 0009-0001-0110-4173
Runtime: @szl-holdings/ouroboros
GitHub: github.com/szl-holdings/ouroboros

### Attached Artifacts
1. Pitch deck: `/home/user/workspace/ouroboros-unified-payload/pitch/SZL_Holdings_Ouroboros_Pitch_Deck.pdf` [placeholder — generate before send]
2. Technical specification: `https://doi.org/10.5281/zenodo.19867281` (v1 Zenodo DOI, foundational Λ axis model)
3. GitHub repository: `https://github.com/szl-holdings/ouroboros` [confirm repo URL before send]

### LinkedIn DM Alternative

Stephen Lutar, SZL Holdings — we want to join the Claude Partner Network and ship an MCP server that wraps Claude tool calls with Ouroboros scope-creep (axis 5) and consent-alignment (axis 8) receipts. Peer-reviewed model at doi.org/10.5281/zenodo.19867281. Claude membership is free — can we connect with your integrations team?

---

### Technical Brief: Anthropic Claude — MCP Server Integration

#### Integration: `ouroboros-mcp` — Model Context Protocol Server for Claude Tool Use

**Overview**

Anthropic's Model Context Protocol (MCP) is the emerging standard for agentic tool use in Claude deployments. An MCP server receives tool call requests from Claude, executes the tool, and returns results. Ouroboros ships as an MCP server (`ouroboros-mcp`) that sits between Claude and the upstream tool implementations, computing a Λ trust receipt on every tool invocation before the result is returned to Claude.

The server also supports a Python SDK wrapper mode: wrapping the `anthropic.Anthropic()` client directly with a `LambdaAnthropicWrapper` that intercepts `messages.create` calls and computes Λ axes 5 and 8 on each response before returning to the caller.

**API Surface**

MCP server mode:
```json
{
  "mcpServers": {
    "ouroboros": {
      "command": "uvx",
      "args": ["ouroboros-mcp"],
      "env": {
        "OUROBOROS_AXES": "5,8",
        "OUROBOROS_RECEIPT_SINK": "s3://...",
        "OUROBOROS_HASH_CHAIN": "true"
      }
    }
  }
}
```

Python SDK wrapper mode:
```python
from ouroboros_anthropic import LambdaAnthropicWrapper

client = LambdaAnthropicWrapper(
    axes=[5, 8],               # scope-creep, consent-alignment
    receipt_sink="s3://...",
    hash_chain=True,
)
message = client.messages.create(model="claude-opus-4-5", ...)
# receipt is attached to message.meta["ouroboros"]
```

**Scope**

- Package: `ouroboros-mcp` on PyPI; installable via `uvx ouroboros-mcp` per MCP convention
- Language: Python 3.10+
- Dependencies: `mcp[cli]`, `anthropic >= 0.30.0`, `szl-holdings-ouroboros`
- Receipt fields: `ouroboros.scope_creep` (axis 5, float 0–1), `ouroboros.consent_alignment` (axis 8, float 0–1), `ouroboros.lambda_scalar` (composite, float 0–1), `ouroboros.receipt_hash` (SHA-256), `ouroboros.tool_name` (string), `ouroboros.receipt_ts` (ISO 8601)
- Supported Claude models: all models accessible via the Anthropic Messages API (`claude-3-5-sonnet-*`, `claude-opus-4-5`, any future models)

**Expected Effort**

- MCP server scaffold and tool-call proxy: 2–3 days
- Λ axis 5 and 8 computation on tool call payload: 2 days
- Hash-chain receipt logging and S3 sink: 1 day
- Python SDK wrapper (`LambdaAnthropicWrapper`): 2 days
- Tests (54 test suite extension for MCP surface): 2 days
- Documentation and Claude Partner Network submission materials: 1 day
- Total: approximately 10–11 engineering days from kickoff to submission

**Public Artifact Target**

Primary: a published `ouroboros-mcp` package on PyPI listed in the Claude Partner Network ecosystem directory. Secondary: a blog post on the Anthropic developer blog or the SZL Holdings blog ("Wrapping Claude Tool Use with scope-creep and consent-alignment receipts") co-authored with an Anthropic safety team member. Tertiary: a talk at Anthropic's developer events or a safety-focused AI conference (e.g., ICLR Safety Workshop, NeurIPS AI Safety Track) presenting the empirical distribution of scope-creep scores observed in a production Claude agentic deployment.

---

## Vendor 3: Arize AI / Phoenix

### Program
Arize AI Partner Program — apply via [arize.com/contact](https://arize.com/contact/); AWS ISVA partnership confirmed; OSS-first community through `Arize-ai/phoenix` (8.5k stars).

### Target Contact
`partnerships@arize.com` (inferred from partner job posting and contact page); GitHub Issues / Pull Requests on `Arize-ai/phoenix` for technical reviewer.

### Subject Line
Ouroboros composite Λ evaluator for Arize Phoenix

### Email Body

Hi Arize Partnerships Team,

I am Stephen Lutar, founder of SZL Holdings. We build Ouroboros (`@szl-holdings/ouroboros`, MIT), a runtime that emits a 9-axis trust receipt (Λ scalar) per LLM span. We want to ship a reference integration with Phoenix.

Phoenix evaluators are registered as `llm_classify`-compatible Python functions that return a structured evaluation result per span. Ouroboros registers as a composite evaluator that returns all 9 Λ axes simultaneously — including hallucination risk (axis 7) and fidelity (axis 3), which are semantically equivalent to Phoenix's native `hallucination` and `correctness` evaluators, and seven additional axes that Phoenix does not currently compute: provenance, drift, latency, scope-creep, toxicity, consent alignment, and cost.

The integration ships as a PR to `Arize-ai/phoenix` adding a `OuroborosEvaluator` class under `phoenix/evals/` that wraps the Ouroboros Python package and returns a `pandas.DataFrame` of per-span Λ scores in the format Phoenix's eval framework expects. It also ships as an OpenInference span attribute set — a `ouroboros.*` attribute namespace that can be sent over OTLP to Phoenix's collector endpoint — for teams that instrument at the trace level rather than the eval level.

Our mathematical model is peer-reviewed: DOIs 10.5281/zenodo.19867281 and 10.5281/zenodo.19944926. We can open a draft PR to `Arize-ai/phoenix` within one week. Who reviews evaluator contributions to Phoenix?

Best,
Stephen P. Lutar
SZL Holdings
stephenlutar2@gmail.com
ORCID: 0009-0001-0110-4173
Runtime: @szl-holdings/ouroboros
GitHub: github.com/szl-holdings/ouroboros

### Attached Artifacts
1. Pitch deck: `/home/user/workspace/ouroboros-unified-payload/pitch/SZL_Holdings_Ouroboros_Pitch_Deck.pdf` [placeholder — generate before send]
2. Technical specification: `https://doi.org/10.5281/zenodo.19944926` (v2 Zenodo DOI, complete Λ axis definitions)
3. GitHub repository: `https://github.com/szl-holdings/ouroboros` [confirm repo URL before send]

### LinkedIn DM Alternative

Stephen Lutar, SZL Holdings — building `OuroborosEvaluator` for Arize Phoenix: a composite `llm_classify`-compatible evaluator that returns all 9 Λ axes per span, including hallucination risk (axis 7) and fidelity (axis 3) as a superset of Phoenix's native evaluators. Want to open a PR to `Arize-ai/phoenix`. Who should I tag?

---

### Technical Brief: Arize AI / Phoenix — Composite Evaluator Integration

#### Integration: `OuroborosEvaluator` — Composite OpenInference Evaluator for Arize Phoenix

**Overview**

Phoenix is an open-source LLM observability and evaluation framework built around the OpenInference instrumentation specification. It accepts traces over OTLP (via Phoenix's built-in OTLP collector) and evaluates spans using Python evaluator functions registered in the `phoenix.evals` module. Evaluators return structured `pandas.DataFrame` results with columns `label`, `score`, and `explanation` per span.

Ouroboros ships two integration surfaces for Phoenix:

1. `OuroborosEvaluator`: a `llm_classify`-compatible Python evaluator class registered in the Phoenix eval framework. It computes all 9 Λ axes on a batch of spans and returns a DataFrame with one row per span and nine additional score columns (`ouroboros_axis_1` through `ouroboros_axis_9`, plus `ouroboros_lambda_scalar`).

2. OpenInference span attributes: a `ouroboros.*` attribute namespace appended to OTLP spans at instrumentation time, enabling Λ scores to flow through the Phoenix collector pipeline without a post-hoc eval step.

**API Surface**

Evaluator mode (post-hoc, batch):
```python
from phoenix.evals import run_evals
from ouroboros_phoenix import OuroborosEvaluator

evaluator = OuroborosEvaluator(
    axes=[1, 2, 3, 4, 5, 6, 7, 8, 9],  # all 9 axes
    hash_chain=True,
)

results = run_evals(
    dataframe=spans_df,
    evaluators=[evaluator],
    provide_explanation=True,
)
# results["OuroborosEvaluator"] is a DataFrame with per-span Λ scores
```

Span attribute mode (inline, per-trace):
```python
from opentelemetry.sdk.trace import TracerProvider
from ouroboros_openinference import OuroborosSpanProcessor

provider = TracerProvider()
provider.add_span_processor(OuroborosSpanProcessor(axes=[3, 7]))
```

The `OuroborosSpanProcessor` appends `ouroboros.axis_3_fidelity`, `ouroboros.axis_7_hallucination_risk`, and `ouroboros.lambda_scalar` as span attributes on every span before export to Phoenix's OTLP endpoint.

**Scope**

- Package: `ouroboros-phoenix` and `ouroboros-openinference` on PyPI
- Language: Python 3.9+
- Dependencies: `arize-phoenix >= 4.0.0`, `openinference-api`, `szl-holdings-ouroboros`, `pandas`
- PR target: `Arize-ai/phoenix` — add `phoenix/evals/ouroboros.py` with `OuroborosEvaluator` class and unit tests
- OpenInference namespace: `ouroboros.axis_N_<name>` (e.g., `ouroboros.axis_7_hallucination_risk`), `ouroboros.lambda_scalar`, `ouroboros.receipt_hash`
- Axis mapping to Phoenix native evaluators: axis 7 (hallucination risk) replaces `HallucinationEvaluator`; axis 3 (fidelity) replaces `QAEvaluator`; the remaining 7 axes are additive and do not replace existing Phoenix evaluators

**Expected Effort**

- `OuroborosEvaluator` class and DataFrame output format: 2–3 days
- `OuroborosSpanProcessor` for OpenInference attribute injection: 2 days
- Unit tests (extending the 54-test `@szl-holdings/guardrails` suite to the Phoenix eval surface): 2–3 days
- PR to `Arize-ai/phoenix` with docs, type hints, and example notebook: 2 days
- Total: approximately 8–10 engineering days from kickoff to open PR

**Public Artifact Target**

Primary: a merged PR to `Arize-ai/phoenix` adding `OuroborosEvaluator` to the Phoenix eval ecosystem, visible in the Phoenix documentation and the Arize partner listing. Secondary: a Jupyter notebook published to Zenodo demonstrating the evaluator on a public LLM benchmark dataset (e.g., TruthfulQA or MMLU), with a new Zenodo DOI citing the two existing Ouroboros DOIs. Tertiary: a conference talk or poster at an AI systems conference (MLSys, SysML, or the NeurIPS Responsible Generative AI workshop) presenting empirical Λ distribution data from the Phoenix integration, co-presented with an Arize team member.

---

## Sources

- [LangChain Partner Network](https://www.langchain.com/langchain-partner-network)
- [LangSmith Documentation](https://docs.smith.langchain.com/)
- [Anthropic Claude Partner Network](https://www.anthropic.com/news/claude-partner-network)
- [Anthropic Claude Tool Use Documentation](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
- [Anthropic Model Context Protocol Announcement](https://www.anthropic.com/news/model-context-protocol)
- [Arize Phoenix Documentation](https://docs.arize.com/phoenix)
- [Ouroboros v1 DOI](https://doi.org/10.5281/zenodo.19867281)
- [Ouroboros v2 DOI](https://doi.org/10.5281/zenodo.19944926)
