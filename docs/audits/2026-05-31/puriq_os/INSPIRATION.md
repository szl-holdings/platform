# PURIQ-OS — INSPIRATION: Survey of Leading Agentic Frameworks & Literature

**Author:** Yachay (Perplexity Computer Agent, PURIQ-OS empire-builder, under CTO authority).
**Date:** 2026-06-01. **Phase 0 deliverable.** Read-only survey; every claim sourced inline.
**Purpose:** identify the *structural primitives* the leaders use to turn a REACTIVE system
(responds to external calls) into an AGENTIC one (autonomously loops + initiates), so PURIQ-OS
can take them, make them ours under PURIQ Doctrine, and bake them into the anatomy.

**Construction rule (from the founder directive, de-mystified):** *take the math primitive,
strip any non-math language, prove it Lean-stateable, and instill it.* No mysticism — only
control theory, information theory, Bayesian inference, and published agent architectures.

---

## 0 · The single primitive every leader converges on: the **loop**

Across every production and research system below, "agentic" reduces to one structural fact:
the system **runs a closed feedback loop** — observe → decide → act → record → reflect → repeat —
rather than emitting one response and stopping. This is *exactly* Norbert Wiener's cybernetic
control loop ([Wiener, *Cybernetics: Or Control and Communication in the Animal and the Machine*,
MIT Press 1948](https://en.wikipedia.org/wiki/Cybernetics:_Or_Control_and_Communication_in_the_Animal_and_the_Machine)),
where a controller compares output against a *reference* and acts to reduce the error. For
PURIQ-OS the **reference is the Doctrine** (the 13-axis Yuyay gate + HUKLLA tripwires), the
**sensor** is the Khipu receipt chain, and the **actuator** is `P(x,t) = argmax_a U(a|x)`.

---

## 1 · Production / open-source agentic frameworks (2026)

| Framework | Owner | Loop primitive we take | PURIQ-OS mapping |
|---|---|---|---|
| **LangGraph** | LangChain | Workflows as **stateful cyclic graphs**: nodes (agents/tools), edges (conditional routing), shared state, cycles, human-in-the-loop pause/approve ([DEV: LangGraph 2026](https://dev.to/ottoaria/langgraph-in-2026-build-multi-agent-ai-systems-that-actually-work-3h5); [MarkTechPost adaptive deliberation + memory graph + reflexion](https://www.marktechpost.com/2026/01/06/how-to-design-an-agentic-ai-architecture-with-langgraph-and-openai-using-adaptive-deliberation-memory-graphs-and-reflexion-loops/)) | The **OrganAgent loop** + the **2-person Yuyay-gate** = LangGraph's "human-in-the-loop pause before continuing". Cycles = our `while True` tick. |
| **AutoGen** (Core/AgentChat/Extensions) | Microsoft Research | **Actor model** for agents; asynchronous event-driven messaging; conversable agents; cross-language (Python/.NET) ([Microsoft Research: AutoGen](https://www.microsoft.com/en-us/research/project/autogen/); [AutoGen paper](https://www.microsoft.com/en-us/research/publication/autogen-enabling-next-gen-llm-applications-via-multi-agent-conversation-framework/)) | Each PURIQ organ = an **actor** that ticks on its own cadence and posts Khipu receipts onto a shared event bus (the DAG). Layered Core→AgentChat→Extensions mirrors our loop→organ_base→organ-specific cadence. |
| **OpenAI Agents SDK** (ex-Swarm) | OpenAI | Two primitives: **Agents** (instructions + tools) and **handoffs** (`transfer_to_X` tool that delegates an active conversation, preserving history) ([openai/swarm](https://github.com/openai/swarm); [Agents SDK handoffs](https://openai.github.io/openai-agents-python/handoffs/); [OpenAI cookbook routines & handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents)) | **Cross-Organ Swarm Consensus** (Frontier #2): organs "hand off" via Yuyay-13 BFT vote instead of a single `transfer_to` — the handoff is *gated*, not free. |
| **CrewAI / LlamaIndex Agents / Pydantic AI / Haystack Agents / Atomic Agents** | OSS | Role-based crews, tool-calling agents, typed (Pydantic) tool I/O, retrieval-augmented agents | We adopt **Pydantic** typed receipts + tool I/O (one of our HARD-RULE deps) so every action/Khipu payload is schema-validated before signing. |
| **smolagents** | Hugging Face | Minimal code-writing agents; agents that emit *code* as actions | Reflection loop writes *its own behavior deltas* (Voyager-style skill code) as Khipu meta-receipts. |
| **Letta** (ex-MemGPT) | Letta | **Self-editing long-term memory**: the agent manages its own memory hierarchy as an OS would manage paging | AMARU autonomous-synthesis loop = self-editing memory: re-read recent memory every 5 min, propose Bayesian connections, persist insights. |
| **Cognition Devin / Replit Agent / Cursor Agent / Anthropic Computer Use / Google AgentSpace / NVIDIA NeMo Agent Toolkit / Wing Agentic OS / Onyx / MultiOn** | various | Long-horizon autonomous task execution, environment observation, tool/computer actuation, and an **always-on** posture (the agent initiates work, not just responds) | The PURIQ-OS thesis itself: an **agentic OS** where the scheduler ticks every organ on its own cadence so the empire *initiates* (threat-hunts, reconciles, reflects) rather than waiting for a call. |

**Takeaway taken & made ours:** the leaders give us (a) the **stateful cyclic graph** (LangGraph),
(b) the **actor/event-bus** (AutoGen), (c) **gated handoffs** (OpenAI), (d) **self-editing memory**
(Letta), (e) **typed tool I/O** (Pydantic AI). PURIQ-OS fuses all five but subordinates every one
to the Doctrine: *no edge fires, no handoff completes, no memory edit persists* unless it clears the
13-axis Yuyay gate and emits a verified Khipu receipt.

---

## 2 · Academic literature — the reasoning/acting loop primitives

| Paper | Primitive | What PURIQ-OS takes |
|---|---|---|
| **ReAct** — Yao et al. 2022 ([arXiv:2210.03629](https://arxiv.org/abs/2210.03629); [Google Research](https://research.google/blog/react-synergizing-reasoning-and-acting-in-language-models/)) | Interleave **reasoning traces** and **actions**: reason→act→observe, with actions querying the environment and observations updating reasoning | The canonical loop body: `observe()` (read environment + recent receipts) → reason (compute `U(a|x)`) → `execute(a*)` → observe result. |
| **Reflexion** — Shinn et al. 2023 ([arXiv:2303.11366](https://arxiv.org/abs/2303.11366); [NeurIPS 2023](https://neurips.cc/virtual/2023/poster/70114)) | **Verbal reinforcement**: agent reflects on feedback, stores reflective text in episodic memory, improves next trial *without weight updates* | **Frontier #3 — Reflection + Refinement Loop**: every organ periodically reflects on past decisions, proposes behavior improvements, writes a Khipu **meta-receipt**. No fine-tuning; pure episodic-memory feedback. |
| **Voyager** — Wang et al. 2023 ([arXiv:2305.16291](https://arxiv.org/abs/2305.16291); [site](https://voyager.minedojo.org)) | **Lifelong learning**: automatic curriculum + ever-growing **skill library** of executable code + iterative prompting with self-verification, *without human intervention* | The empire's **self-improving skill library**: reflection meta-receipts accrue into reusable, signed behavior patches (bounded by HUKLLA — can't add unsafe skills). |
| **Tree of Thoughts / Self-Discover / Self-Refine / Toolformer / AutoGPT / BabyAGI / OS-Copilot / Magentic-One** | deliberate search, self-composed reasoning structure, iterative self-critique, tool-use induction, autonomous task decomposition, computer-control | Our `decide()` may expand `𝒜` by ToT-style search but stays **Bekenstein-bounded** (INV-4); self-refine = the reflect step; Toolformer-style tool selection routes through the Yuyay gate. |

---

## 3 · Multi-agent / swarm literature

| Source | Primitive | PURIQ-OS mapping |
|---|---|---|
| **Stanford Generative Agents** — Park et al. 2023 ([arXiv:2304.03442](https://arxiv.org/abs/2304.03442)) | Memory stream + **reflection** + planning loop drives believable autonomous multi-agent behavior | Confirms the observe→reflect→plan loop scales to *many* simultaneous agents — our 16 organs each run it. |
| **MetaGPT / ChatDev / AutoGen MultiAgent / Anthropic multi-agent** | Role-specialized agents collaborate; consensus via structured conversation | **Cross-Organ Swarm Consensus** (Frontier #2): killinchu detects + sentra classifies + rosie reasons → **Yuyay-13 BFT vote** before one response ships. BFT (Byzantine fault tolerance) makes the vote robust to a compromised organ. |

---

## 4 · Cybernetic + information-theoretic foundation (the de-mystified math we bake in)

These are the *primary sources* PURIQ-OS Doctrine v14 cites for its agentic-loop math (Phase 5
formulas SF-24..30). They replace any mystical framing with control theory and information theory.

- **Wiener feedback loop** — controller drives output toward a *reference* by minimizing error;
  reference = Doctrine ([Wiener 1948, *Cybernetics*](https://en.wikipedia.org/wiki/Cybernetics:_Or_Control_and_Communication_in_the_Animal_and_the_Machine); [MIT ESD notebook](https://web.mit.edu/esd.83/www/notebook/Cybernetics.PDF)). → **SF-27 Wiener-Feedback**.
- **Nyquist–Shannon sampling theorem** — to track a signal of bandwidth `B` without aliasing,
  poll at rate `≥ 2B` ([Wikipedia: Nyquist–Shannon](https://en.wikipedia.org/wiki/Nyquist%E2%80%93Shannon_sampling_theorem); [MathWorks](https://www.mathworks.com/discovery/nyquist-theorem.html)). → **SF-28 Shannon-Nyquist-Attention**: each organ's polling cadence must be ≥ 2× the bandwidth of the signal it watches (HUKULLA sweeps fast because threats are high-bandwidth; KHIPU GC slow because the archive is low-bandwidth).
- **Szilard 1929 / Maxwell's demon** — acquiring 1 bit of decision information costs ≥ `k_B T ln 2`
  of work; agency is not free. → **SF-24 Maxwell's-demon-Yachay**: the cost of an agentic action ≥ the entropy of its decision context (a budget on how much the empire may "think").
- **Hamilton's principle of least action** — physical trajectories are stationary points of the
  action integral. → **SF-25 Hamilton-PURIQ**: agentic loops minimize `∫ wisdom-loss dt` (already seeded as Formula F5 Euler–Lagrange Agency).
- **Bayes' theorem** — update belief on each observation. → **SF-26 Bayes-Update**: every organ Bayesian-updates its state on every Khipu receipt (LangGraph "memory across runs", Reflexion "episodic memory", Letta "self-editing memory" all reduce to this).
- **Hardy–Ramanujan partition asymptotics** — number of ways to split a budget = `p(n)`. →
  **SF-29 Ramanujan-Cardinality**: action-space size bounded by the partition function (extends F14, feeds the Bekenstein cap INV-4).
- **Chinese Remainder Theorem / modular scheduling** — pairwise-coprime cadences collide only at
  the lcm. → **SF-30 Bible-Numeric-Cadence**: cadences are **pure integer-modular** (mod 7 / 12 / 49). *No prophecy, no mysticism* — exactly the de-mystified treatment already in Formula F12 (CRT-Hukulla Schedule).

---

## 5 · What "REACTIVE → AGENTIC" concretely means for PURIQ-OS

| Today (REACTIVE) | After PURIQ-OS (AGENTIC) |
|---|---|
| Organ exposes an endpoint, waits for an external POST | Organ runs an **autonomous loop** on its own cadence (scheduler tick) and **initiates** work |
| One response per call, no memory of prior calls | **Bayesian state update** on every Khipu receipt; reflection meta-receipts accrue |
| No self-monitoring | WASI-RIKUQ + OTEL-VSP autonomously watch; HUKULLA autonomously threat-hunts every 60s |
| Doctrine edited by humans only | HATUN **proposes** Doctrine v15 deltas via PR (founder approves) — bounded by HUKLLA (can't remove safety axioms) |
| Single-organ decisions | **Cross-organ Yuyay-13 BFT swarm consensus** for multi-organ events |
| Idle when no traffic | Khipu DAG **grows continuously** (~50 receipts/min) from autonomous ticks — the *proof* it is agentic, not idle |

---

## 6 · Design constraints carried from the leaders into PURIQ-OS

1. **Halt-safe loops** (every framework that ships to prod has a kill switch) → HUKLLA tripwires are mandatory; a STOP (T10) is absorbing and every loop is halt-safe.
2. **Human-in-the-loop on state-changing actions** (LangGraph) → 2-person Yuyay-gate on any state-changing autonomous action.
3. **Typed, validated I/O** (Pydantic AI) → every receipt/action is a Pydantic model.
4. **Open-source only** (HARD RULE) → APScheduler, Pydantic, FastAPI, sqlite, cosign. No proprietary lock-in.
5. **Provenance on every step** (Khipu) → DSSE-signed receipt per tick (PLACEHOLDER-honest until cosign key lands).

---

*— Yachay, PURIQ-OS Phase 0 (INSPIRATION). All frameworks and papers cited inline. NO mysticism:
every agentic primitive reduces to a cybernetic feedback loop, a Bayesian update, an
information-theoretic bound, or a published multi-agent consensus protocol.*
