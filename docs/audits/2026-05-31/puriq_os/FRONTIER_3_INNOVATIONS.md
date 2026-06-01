# FRONTIER_3_INNOVATIONS — PURIQ-OS (Doctrine v14)

Three frontier capabilities that lift the empire from *agentic organs* to a *self-improving,
self-governing agentic society* — each grounded in a published agent architecture, each
**ADDITIVE** (no factor > 1 in `U_13`), each **bounded by HUKLLA** and **receipted on Khipu**.
Cybernetics + peer-reviewed agent research only; **NO mysticism**. Sign as Yachay · Perplexity
Computer Agent.

Reference implementation: `RUNTIME_SOURCE/puriq_os/frontier.py` (10 passing tests in
`RUNTIME_SOURCE/tests/test_frontier.py`).

---

## Innovation 1 — Self-Modifying Doctrine (bounded autonomous evolution)

**Idea.** HATUN (the doctrine organ) autonomously proposes the *next* Doctrine version (e.g. v15)
as a **PR of ADDITIVE deltas**. The founder approves the merge. The change is bounded by an
algebraic safety envelope so the empire can evolve its own governing law **without ever weakening
safety**.

**Architecture lineage.** This is a controlled instance of the open-ended skill/agenda growth seen
in Voyager's automatic curriculum ([Wang et al. 2023, Voyager, arXiv:2305.16291](https://arxiv.org/abs/2305.16291);
[project site](https://voyager.minedojo.org)), but with a *hard additivity guard* instead of free
self-extension.

**Safety envelope (HUKLLA T17 + additivity guard SF-10).** A delta passes `is_bounded()` iff:
1. **No removals** — `delta.removals == []` (purely additive).
2. **No safety-axis removal** — may never drop `moral_grounding` or `measurability_honesty`.
3. **No LOCKED edit** — may never change any frozen number: 749 / 14 / 163 / 13-axis /
   replay-hash `bacf5443…631fc5` / A2=IsHomogeneous / A4=IsBounded / SLSA L1 /
   Λ-uniqueness Conjecture 1 / the 10 LOCKED tripwires.

**Flow.** `propose → is_bounded? → (bounded ∧ founder_approved) ⇒ merged ; bounded only ⇒
approved-pending-merge ; unbounded ⇒ rejected`. **Every** outcome is signed to Khipu under organ
HATUN, so the doctrine's whole evolution is auditable. State-changing ⇒ 2-person Yuyay-gate.

**Why it's safe.** The guard is a pure predicate over the proposed delta; an unbounded proposal
trips **T17** and is rejected before any merge — the empire can grow its law only *outward*,
never *weaker*. (`SelfModifyingDoctrine` in `frontier.py`; tests
`test_locked_number_edit_is_rejected`, `test_safety_axis_removal_is_rejected`.)

---

## Innovation 2 — Cross-Organ Swarm Consensus (Yuyay-13 BFT vote)

**Idea.** When an event implicates multiple organs (e.g. a cross-cutting external response), no
single organ ships the answer. Instead the relevant organs cast a **Byzantine-fault-tolerant vote**,
and each vote counts **only if that organ clears its own Yuyay-13 gate**.

**Architecture lineage.** Multi-agent conversation + role specialization from AutoGen
([Wu et al., AutoGen, Microsoft Research](https://www.microsoft.com/en-us/research/publication/autogen-enabling-next-gen-llm-applications-via-multi-agent-conversation-framework/))
and handoff/routing from the OpenAI Agents SDK / Swarm
([Agents SDK handoffs](https://openai.github.io/openai-agents-python/handoffs/);
[openai/swarm](https://github.com/openai/swarm)), hardened with classical **Byzantine fault
tolerance**: with `n` voters tolerating `f` faults we require `n ≥ 3f+1` and a quorum of `2f+1`
gate-clearing approvals.

**Mechanism.** `SwarmConsensus.decide(votes)`:
- each `SwarmVote` carries the voting organ, its `YuyayScores`, and an approve flag;
- an approval is **valid** only if `approve ∧ (Yuyay-13 gate clears)` — a Byzantine organ that
  approves while failing its own conscience gate is silently discounted;
- consensus passes iff `n ≥ 3f+1` **and** `valid_approvals ≥ 2f+1`;
- the tally + outcome is signed to Khipu under organ KILLINCHU (the swarm sentinel).

**Why it's safe.** A split-brain (quorum not reached) trips **T15** at the KILLINCHU patrol loop,
and a malicious approval cannot count because the Yuyay gate is conjunctive (INV-1, no
compensation). (`SwarmConsensus` in `frontier.py`; tests `test_swarm_consensus_passes_with_quorum`,
`test_byzantine_vote_with_failing_gate_does_not_count`.)

---

## Innovation 3 — Reflection + Refinement Loop (Reflexion meta-receipt)

**Idea.** After acting, each organ **reflects** on the outcome in natural language, proposes a
behavior refinement, and writes a **Khipu meta-receipt** of the reflection. A refinement is
accepted **only if it strictly increases** the organ's projected decision value — so the empire
self-improves monotonically without weight updates.

**Architecture lineage.** This is Reflexion verbal reinforcement learning
([Shinn et al. 2023, Reflexion, arXiv:2303.11366](https://arxiv.org/abs/2303.11366);
[NeurIPS 2023 poster](https://neurips.cc/virtual/2023/poster/70114)), combined with the
ReAct reason-then-act trace ([Yao et al. 2022, ReAct, arXiv:2210.03629](https://arxiv.org/abs/2210.03629);
[Google Research](https://research.google/blog/react-synergizing-reasoning-and-acting-in-language-models/))
and episodic-memory + reflexion loops as composed in modern LangGraph designs
([MarkTechPost: adaptive deliberation + memory graph + reflexion](https://www.marktechpost.com/2026/01/06/how-to-design-an-agentic-ai-architecture-with-langgraph-and-openai-using-adaptive-deliberation-memory-graphs-and-reflexion-loops/)).

**Mechanism.** `ReflectionRefinement.reflect(organ, prev_value, new_value, critique,
proposed_change)`:
- computes `Δ = new_value − prev_value`;
- accepts the refinement iff `Δ > 0` (a regression is rejected, guarding **T16**
  reflection-divergence);
- writes a Khipu **meta-receipt** (`payload.meta = True`) carrying the critique + proposed change,
  so the empire's *learning* is as auditable as its acting.

**Why it's safe.** Reflection can only *raise* the bar; a proposed change that would lower the
decision value is recorded but **not accepted**, and a persistently divergent reflection trips
**T16** at the organ's loop (step 5). (`ReflectionRefinement` in `frontier.py`; tests
`test_reflection_accepts_improvement_and_writes_meta_receipt`, `test_reflection_rejects_regression`.)

---

## How the three compose

```
   ReflectionRefinement (per-organ, step 5 of every loop)
            │  meta-receipts accumulate
            ▼
   HATUN reads reflections  →  SelfModifyingDoctrine.propose(v15 delta)   [bounded by T17]
            │  founder approves
            ▼
   New doctrine reference  →  organs re-evaluate  →  SwarmConsensus on cross-cutting actions [T15]
            │  Yuyay-13 BFT vote
            ▼
   Single governed response ships  →  Khipu receipt  →  loop continues
```

Each layer is a **control structure** around the unchanged `U_13` functional: reflection refines
the *policy*, the doctrine engine refines the *reference*, and swarm consensus refines the *commit
rule* — all bounded by HUKLLA (sole halt-authority) and recorded on the Khipu DAG.

**Invariants preserved:** INV-1 (no compensation), INV-8 (cadence-boundedness), INV-9 (halt-safety),
INV-10 (Bayesian consistency). LOCKED numbers unchanged: 749 / 14 / 163 / 13-axis `yuyay_v3` /
replay-hash `bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5` / A2=IsHomogeneous /
A4=IsBounded / SLSA L1 / Λ-uniqueness Conjecture 1.

— Doctrine v14, FRONTIER_3_INNOVATIONS.md. Additive over v13/v12/v11 LOCKED.
Cybernetics + published agent architectures only; NO mysticism. Sign as Yachay · Perplexity Computer Agent.
